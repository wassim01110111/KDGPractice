"use strict";

export const JAVA_TIMEOUTS = Object.freeze({
  initializationMs: 90_000,
  compilationMs: 60_000,
  executionMs: 8_000,
  gradingMs: 60_000,
});

const JAVA_MODULE_URL =
  globalThis.__ACS_JAVA_MODULE_BASE_URL__ || import.meta.url;
const WORKER_URL = new URL("./java.worker.js", JAVA_MODULE_URL);
if (globalThis.__ACS_FORCE_CACHE_BUST__)
  WORKER_URL.searchParams.set(
    "__acs_nocache",
    String(globalThis.__ACS_FORCE_CACHE_BUST__),
  );
if (new URL(JAVA_MODULE_URL).searchParams.has("__acs_java_version"))
  WORKER_URL.searchParams.set(
    "__acs_java_version",
    new URL(JAVA_MODULE_URL).searchParams.get("__acs_java_version"),
  );
// Optional A/B test for CheerpJ 5.0's experimental WasmGC engine. The normal
// JavaScript/Wasm engine remains the default for compatibility.
const enableExperimentalWasmGC =
  globalThis.__ACS_JAVA_WASM_GC__ === true ||
  new URL(globalThis.location?.href || JAVA_MODULE_URL).searchParams.get(
    "java-wasm-gc",
  ) === "1";
if (enableExperimentalWasmGC)
  WORKER_URL.searchParams.set("__acs_java_wasm_gc", "1");
const statusListeners = new Set();
let worker = null;
let readyPromise = null;
let initRequestId = null;
let activeRequest = null;
let sequence = 0;
let generation = 0;
let operationQueue = Promise.resolve();

// ---------------------------------------------------------------------------
// Java module preload + cache
//
// Page side: the worker script.
// Worker side (java.worker.js, told via INIT.newVer): ExerciseRunner.jar, the
// CheerpJ runtime start-up and a warm-up compile.
//   * Normal load  -> cached copies are used.
//   * newVer load  -> the caches are emptied first and everything is refetched.
//   * A run started before preload finished joins the in-flight preload and
//     uses whatever is already loaded; it never starts a second load.
// ---------------------------------------------------------------------------
const VERSION_DECISION_WAIT_MS = 4_000;
const WORKER_RUNNER_CACHE_NAME = "acs-java-runner";
let modulesPromise = null;

// Resolves to the startup newVer decision made by app-routing.js. If that
// decision is missing or slow, assume "not new" so offline use stays fast.
async function resolveNewVer() {
  const decision = globalThis.__ACS_VERSION_DECISION__;
  if (!decision || typeof decision.then !== "function") return false;
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(false), VERSION_DECISION_WAIT_MS);
  });
  try {
    return (await Promise.race([decision, timeout])) === true;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function clearJavaModuleCache() {
  modulesPromise = null;
  if (!("caches" in globalThis)) return Promise.resolve(false);
  return caches.delete(WORKER_RUNNER_CACHE_NAME).catch(() => false);
}

export function preloadJavaModules({ newVer = false, force = false } = {}) {
  if (modulesPromise && !force) return modulesPromise;
  const current = (modulesPromise = (async () => {
    const tasks = [
      // Warm the HTTP cache for the worker script; the Worker constructor uses it.
      fetch(WORKER_URL.href, { cache: newVer ? "reload" : "default" }).then(
        (response) => response.arrayBuffer(),
      ),
    ];
    const outcomes = await Promise.allSettled(tasks);
    for (const outcome of outcomes)
      if (outcome.status === "rejected")
        console.warn("Java module preload step failed:", outcome.reason);
  })());
  current.catch(() => {
    if (modulesPromise === current) modulesPromise = null;
  });
  return current;
}

// Startup entry point used by app-routing.js: load modules, then boot the runtime.
// The CheerpJ worker boots immediately and never waits for the module fetches;
// the worker takes whatever modules are already loaded when INIT is sent.
export function preloadJava({ newVer = false, force = false } = {}) {
  const modules = preloadJavaModules({ newVer, force }).catch((error) =>
    console.warn("Java module preload failed:", error),
  );
  const runtime = initJava();
  return Promise.all([modules, runtime]).then(([, ready]) => ready);
}

async function modulesForInit() {
  const newVer = await resolveNewVer();
  // Start or join the preload but do not wait for it: use what is loaded now.
  preloadJavaModules({ newVer }).catch(() => {});
  return { newVer };
}

function emitStatus(status, detail = "") {
  for (const listener of statusListeners) {
    try {
      listener({ status, detail });
    } catch (error) {
      console.warn("Java status listener failed", error);
    }
  }
}

export function subscribeJavaStatus(listener) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function createWorker() {
  if (typeof Worker === "undefined") {
    throw new Error(
      "This browser does not support Web Workers. Java exercises need a browser with Web Worker support.",
    );
  }
  const next = new Worker(WORKER_URL, {
    type: "classic",
    name: "acs-java-playground",
  });
  worker = next;
  next.onmessage = (event) => handleWorkerMessage(next, event.data || {});
  next.onerror = (event) => {
    const error = new Error(
      event.message || "The Java worker encountered an unexpected error.",
    );
    failWorker(next, error, "worker");
  };
  next.onmessageerror = () =>
    failWorker(
      next,
      new Error(
        "The Java worker returned a message that the page could not read.",
      ),
      "worker",
    );
  return next;
}

function clearRequestTimer(request) {
  if (request?.timer) clearTimeout(request.timer);
  if (request) request.timer = null;
}

function terminateCurrentWorker(reason) {
  const old = worker;
  worker = null;
  readyPromise = null;
  initRequestId = null;
  if (old) {
    old.onmessage = null;
    old.onerror = null;
    old.onmessageerror = null;
    try {
      old.terminate();
    } catch (_) {
      /* already terminated */
    }
  }
  if (activeRequest) {
    const current = activeRequest;
    activeRequest = null;
    clearRequestTimer(current);
    current.reject(
      reason instanceof Error
        ? reason
        : new Error(String(reason || "Java worker stopped.")),
    );
  }
}

function failWorker(target, error, phase) {
  if (worker !== target) return;
  if (activeRequest) {
    const active = activeRequest;
    activeRequest = null;
    clearRequestTimer(active);
    active.reject(Object.assign(error, { phase }));
  }
  terminateCurrentWorker(error);
  emitStatus("ERROR", error.message);
}

function armWatchdog(request, phase) {
  clearRequestTimer(request);
  const configured = request.timeoutMs;
  const phaseLimit =
    phase === "RUNNING"
      ? configured || JAVA_TIMEOUTS.executionMs
      : phase === "TESTING"
        ? configured || JAVA_TIMEOUTS.gradingMs
        : JAVA_TIMEOUTS.compilationMs;
  const remainingOverall = request.deadlineAt
    ? Math.max(0, request.deadlineAt - Date.now())
    : phaseLimit;
  const delay = Math.max(0, Math.min(phaseLimit, remainingOverall));
  request.phase = phase;
  request.timer = setTimeout(() => {
    if (activeRequest !== request) return;
    const message = `Java ${phase.toLowerCase()} timed out after ${delay / 1000} seconds. The program may contain an infinite loop or an operation that is taking too long.`;
    const error = Object.assign(new Error(message), {
      code: "JAVA_TIMEOUT",
      phase,
      timeoutMs: delay,
      possibleInfiniteLoop: phase === "RUNNING" || phase === "TESTING",
    });
    terminateCurrentWorker(error);
    emitStatus("TIMEOUT", message);
  }, delay);
}

function handleWorkerMessage(target, message) {
  if (target !== worker) return;
  if (message.type === "BOOT_ERROR") {
    const request = activeRequest;
    if (request && request.kind === "init") {
      activeRequest = null;
      clearRequestTimer(request);
      const error = Object.assign(
        new Error(message.message || "Could not load CheerpJ 5.0."),
        { phase: "loader" },
      );
      request.reject(error);
    }
    terminateCurrentWorker(
      new Error(message.message || "Could not load CheerpJ 5.0."),
    );
    emitStatus("ERROR", message.message || "Could not load CheerpJ 5.0.");
    return;
  }

  if (message.type === "STATUS") {
    if (activeRequest && message.requestId === activeRequest.requestId) {
      // Progress details are also sent as heartbeats. Re-arm the watchdog only
      // when the operation changes phase; otherwise a stuck compile/run could
      // keep extending its own timeout forever just by reporting elapsed time.
      if (
        message.status !== "INITIALIZING" &&
        activeRequest.phase !== message.status
      ) {
        armWatchdog(activeRequest, message.status);
      }
    }
    emitStatus(message.status || "WORKING", message.detail || "");
    return;
  }

  if (message.type === "READY") {
    if (
      activeRequest &&
      activeRequest.kind === "init" &&
      message.requestId === activeRequest.requestId
    ) {
      const request = activeRequest;
      activeRequest = null;
      clearRequestTimer(request);
      request.resolve({ ready: true, javaVersion: message.javaVersion || 21 });
      emitStatus("READY", "Java 21 runtime is ready.");
    }
    return;
  }

  if (
    message.type === "INIT_ERROR" ||
    message.type === "REQUEST_ERROR" ||
    message.type === "ERROR"
  ) {
    const request = activeRequest;
    if (request && message.requestId === request.requestId) {
      activeRequest = null;
      clearRequestTimer(request);
      const error = Object.assign(
        new Error(message.message || "Java execution failed."),
        {
          phase: message.phase || "execution",
          workerStack: message.stack || "",
        },
      );
      request.reject(error);
      if (message.type === "INIT_ERROR") terminateCurrentWorker(error);
      emitStatus("ERROR", error.message);
    }
    return;
  }

  if (message.type === "RESULT") {
    const request = activeRequest;
    if (!request || message.requestId !== request.requestId) return;
    activeRequest = null;
    clearRequestTimer(request);
    emitStatus("RESULT", "Java operation completed.");
    request.resolve(message.result || {});
  }
}

export function initJava() {
  if (readyPromise) return readyPromise;
  const currentGeneration = generation;
  const promise = new Promise((resolve, reject) => {
    let instance;
    try {
      instance = worker || createWorker();
    } catch (error) {
      reject(error);
      return;
    }
    const requestId = `init-${++sequence}`;
    initRequestId = requestId;
    const request = { kind: "init", requestId, resolve, reject, timer: null };
    activeRequest = request;
    request.timer = setTimeout(() => {
      if (activeRequest !== request) return;
      const error = Object.assign(
        new Error(
          "Java 21 initialization exceeded 90 seconds. Check your connection and reload the Java exercise to try again.",
        ),
        {
          code: "JAVA_TIMEOUT",
          phase: "INITIALIZING",
          timeoutMs: JAVA_TIMEOUTS.initializationMs,
        },
      );
      terminateCurrentWorker(error);
      emitStatus("TIMEOUT", error.message);
    }, JAVA_TIMEOUTS.initializationMs);
    emitStatus(
      "INITIALIZING",
      "Loading the Java 21 runtime (the first start can take longer)…",
    );
    modulesForInit()
      .catch(() => ({ newVer: false }))
      .then((modules) => {
        if (worker !== instance || activeRequest !== request) return;
        instance.postMessage({
          type: "INIT",
          requestId,
          newVer: modules.newVer,
        });
      });
  });
  let wrapped;
  wrapped = promise
    .then((value) => {
      if (currentGeneration === generation) return value;
      throw new Error("Java runtime initialization was cancelled.");
    })
    .catch((error) => {
      if (readyPromise === wrapped) readyPromise = null;
      throw error;
    });
  readyPromise = wrapped;
  return wrapped;
}

function enqueueOperation(operation, payload) {
  const taskGeneration = generation;
  const task = operationQueue
    .catch(() => {})
    .then(async () => {
      if (taskGeneration !== generation)
        throw new Error("This Java operation was cancelled.");
      const invalid = validateSources(payload.sources);
      if (invalid) return invalid;
      await initJava();
      if (taskGeneration !== generation)
        throw new Error("This Java operation was cancelled.");
      const instance = worker;
      if (!instance)
        throw new Error(
          "The Java worker is not available. Run the exercise again to restart it.",
        );
      const requestId = `java-${++sequence}`;
      const isCheck = operation === "check";
      const configuredTimeout = Number(payload.config?.timeoutMs);
      const timeoutMs =
        Number.isFinite(configuredTimeout) && configuredTimeout >= 1000
          ? Math.min(30_000, configuredTimeout)
          : isCheck
            ? JAVA_TIMEOUTS.gradingMs
            : JAVA_TIMEOUTS.executionMs;

      const rawResult = await new Promise((resolve, reject) => {
        const request = {
          kind: "execute",
          requestId,
          resolve,
          reject,
          timer: null,
          timeoutMs,
          deadlineAt: isCheck ? Date.now() + timeoutMs : null,
        };
        activeRequest = request;
        armWatchdog(request, "COMPILING");
        emitStatus("COMPILING", "Compiling your Java source code…");
        instance.postMessage({
          type: "EXECUTE",
          requestId,
          operation,
          sources: payload.sources,
          config: payload.config,
        });
      });
      return finalizeResult(operation, rawResult, payload.plan);
    });
  operationQueue = task.catch(() => {});
  return task;
}

function normalizeSources(config, source) {
  const sourceFiles = [
    { name: config.sourceFile || "Main.java", code: String(source ?? "") },
  ];
  const additional = config.additionalSources;
  if (Array.isArray(additional)) {
    for (const item of additional) {
      if (
        item &&
        typeof item.name === "string" &&
        typeof item.code === "string"
      )
        sourceFiles.push({ name: item.name, code: item.code });
    }
  } else if (additional && typeof additional === "object") {
    for (const [name, code] of Object.entries(additional)) {
      if (typeof code === "string") sourceFiles.push({ name, code });
    }
  }
  return sourceFiles;
}

// ---------------------------------------------------------------------------
// Work moved out of Java: source validation, check planning, comparisons,
// feedback text, scoring and result shaping.
// ---------------------------------------------------------------------------
const SOURCE_NAME_PATTERN = /^[A-Za-z0-9_$.-]+\.java$/;

function validateSources(sources) {
  const failure = (file, message) => ({
    success: false,
    compiled: false,
    status: "compile-error",
    exitCode: 1,
    stdout: "",
    stderr: "",
    executionTimeMs: 0,
    diagnostics: [{ kind: "ERROR", file, line: 0, column: 0, message }],
  });
  if (!Array.isArray(sources) || sources.length === 0)
    return failure("(source)", "No Java source files were supplied.");
  for (const source of sources) {
    if (!SOURCE_NAME_PATTERN.test(String(source?.name ?? "")))
      return failure(
        String(source?.name ?? ""),
        "Source file names must be simple .java file names without directory separators.",
      );
  }
  return null;
}

// java.lang.reflect.Modifier bits.
const MODIFIER_BITS = {
  public: 0x1,
  private: 0x2,
  protected: 0x4,
  static: 0x8,
  final: 0x10,
  synchronized: 0x20,
  volatile: 0x40,
  transient: 0x80,
  native: 0x100,
  abstract: 0x400,
  strict: 0x800,
};
const MODIFIER_ORDER = [
  ["public", 0x1],
  ["protected", 0x4],
  ["private", 0x2],
  ["abstract", 0x400],
  ["static", 0x8],
  ["final", 0x10],
  ["transient", 0x80],
  ["volatile", 0x40],
  ["synchronized", 0x20],
  ["native", 0x100],
  ["strictfp", 0x800],
  ["interface", 0x200],
];
const modifiersToString = (bits) =>
  MODIFIER_ORDER.filter(([, bit]) => (bits & bit) !== 0)
    .map(([name]) => name)
    .join(" ");

function asList(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

// Split each check into what Java needs (regex flag bits) and what only JS
// needs (id, description, points, matcher, flag errors).
function buildCheckPlan(rawChecks) {
  const checks = Array.isArray(rawChecks) ? rawChecks : [];
  const meta = [];
  const javaChecks = checks.map((check, index) => {
    const id = String(check?.id ?? `check-${index + 1}`);
    const entry = {
      id,
      description: String(check?.description ?? id),
      points: Number.isFinite(Number(check?.points)) ? Number(check.points) : 1,
      matcher:
        check?.regex === true
          ? "regex"
          : check?.contains === true
            ? "contains"
            : String(check?.matcher ?? "exact").toLowerCase(),
      flagError: null,
    };
    const prepared = { ...check, matcher: entry.matcher };
    // The package schema stores regex as a boolean. The Java worker protocol
    // retains its original matcher string and structured regex flags object.
    delete prepared.contains;
    delete prepared.regex;
    if (entry.matcher === "regex") {
      // Regex options are encoded inline in the expected pattern, not check.flags.
      prepared.regex = { flags: 0, full: check?.fullMatch === true };
    }
    meta.push(entry);
    return prepared;
  });
  return { javaChecks, checks, meta };
}

const pass = (actual) => ({ passed: true, feedback: "Passed.", actual });
const fail = (feedback, actual) => ({ passed: false, feedback, actual });
const quoteText = (value) => JSON.stringify(String(value));

function describeRegex(pattern) {
  const source = String(pattern ?? "");
  try {
    // Pass the original pattern so generateFromRegex can parse inline (?ims).
    const sample = globalThis.Core?.generateFromRegex?.(source);
    if (typeof sample === "string")
      return { generated: true, text: sample === "" ? '""' : sample };
  } catch (_) {
    // Keep the original pattern visible if sample generation is unsupported.
  }
  return { generated: false, text: source };
}

function compareText(actual, check, entry, probe) {
  const text = String(actual ?? "");
  const expected = check.expected == null ? "null" : String(check.expected);
  switch (entry.matcher) {
    case "exact":
      return text === expected
        ? { passed: true, feedback: "Text matches exactly.", actual: text }
        : fail(
            `Expected exact text ${quoteText(expected)} but received ${quoteText(text)}.`,
            text,
          );
    case "contains":
      return text.includes(expected)
        ? { passed: true, feedback: "Expected text was found.", actual: text }
        : fail(`Output does not contain ${quoteText(expected)}.`, text);
    case "regex": {
      if (probe.regexError)
        return fail(`Invalid regular expression: ${probe.regexError}`, text);
      if (probe.matched === true)
        return { passed: true, feedback: "Regular expression matched.", actual: text };
      const mode = check.fullMatch === true ? "full match" : "substring search";
      const described = describeRegex(check.expected);
      return fail(
        described.generated
          ? `The output did not match (${mode}). For example, matching text could be:\n${described.text}`
          : `The output did not match (${mode}). Expected output must match the regular expression:\n${described.text}`,
        text,
      );
    }
    default:
      return fail(`Unsupported matcher: ${entry.matcher}`, text);
  }
}

function looseNumber(value) {
  return typeof value === "number" ? value : null;
}

function valuesEqual(actual, expected) {
  if (actual === null || actual === undefined || expected === null || expected === undefined)
    return (actual ?? null) === (expected ?? null);
  const a = looseNumber(actual);
  const e = looseNumber(expected);
  if (a !== null && e !== null) return a === e;
  if (typeof actual === "object" || typeof expected === "object")
    return JSON.stringify(actual) === JSON.stringify(expected);
  return String(actual) === String(expected);
}

function compareValue(actual, check, entry, probe) {
  if (typeof actual === "string" && typeof check.expected === "string")
    return compareText(actual, check, entry, probe);
  const same = valuesEqual(actual, check.expected);
  return {
    passed: same,
    feedback: same
      ? "Returned value matches."
      : `Expected ${JSON.stringify(check.expected)} but received ${JSON.stringify(actual)}.`,
    actual,
  };
}

function modifierOutcome(bits, expected, label) {
  const actualText = modifiersToString(bits);
  for (const raw of asList(expected).map((item) => String(item))) {
    const name = raw.toLowerCase();
    let present;
    if (name === "default") present = false;
    else if (name in MODIFIER_BITS) present = (bits & MODIFIER_BITS[name]) !== 0;
    else return fail(`Unknown modifier: ${raw}`, actualText);
    if (!present)
      return fail(
        `${label} must be ${raw}. Actual modifiers: ${actualText}.`,
        actualText,
      );
  }
  return pass(actualText);
}

function describeProbeError(probe) {
  const message = probe.errorMessage || probe.errorType || "Check failed.";
  switch (probe.errorType) {
    case "ClassNotFoundException":
      return `Class ${message} was not found.`;
    case "NoSuchFieldException":
      return `Field ${message} was not found.`;
    case "NoSuchMethodException":
      return `Method or constructor ${message} was not found.`;
    default:
      return message;
  }
}

function evaluateProbe(probe, check, entry) {
  const type = String(check?.type ?? "");
  const className = String(check?.className ?? check?.mainClass ?? "Main");
  if (probe.unsupported) return fail(`Unsupported check type: ${type}`, null);
  switch (type) {
    case "stdout":
    case "stderr": {
      if (probe.exception)
        return fail(
          `Program threw ${probe.exception.type || "an exception"}: ${probe.exception.message ?? ""}`,
          probe.actual,
        );
      return compareText(probe.actual, check, entry, probe);
    }
    case "classExists":
    case "methodExists":
      return pass(probe.actual);
    case "fieldExists": {
      const expectedType = String(check.expectedType ?? "");
      if (expectedType && probe.actual !== expectedType)
        return fail(
          `Field exists, but its type is ${probe.actual} instead of ${expectedType}.`,
          probe.actual,
        );
      return pass(probe.name);
    }
    case "fieldModifier":
      return modifierOutcome(probe.modifiers, check.expected, `Field ${probe.name}`);
    case "methodModifier":
      return modifierOutcome(probe.modifiers, check.expected, `Method ${probe.name}`);
    case "constructorExists":
      return Object.prototype.hasOwnProperty.call(check, "expected")
        ? modifierOutcome(probe.modifiers, check.expected, "Constructor")
        : pass(probe.actual);
    case "classModifier":
      return modifierOutcome(probe.modifiers, check.expected, `Class ${className}`);
    case "inheritance": {
      const expectedSuper = String(check.superclass ?? check.expected ?? "");
      if (expectedSuper && probe.superclass !== expectedSuper)
        return fail(
          `Expected superclass ${expectedSuper}, found ${probe.superclass || "none"}.`,
          probe.superclass,
        );
      const interfaces = Array.isArray(probe.interfaces) ? probe.interfaces : [];
      for (const wanted of asList(check.interfaces).map(String))
        if (!interfaces.includes(wanted))
          return fail(
            `Expected implemented interface ${wanted} was not found.`,
            `[${interfaces.join(", ")}]`,
          );
      return pass(probe.superclass);
    }
    case "instanceOf": {
      const target = String(check.expectedType ?? check.expected ?? "");
      return {
        passed: probe.isInstance === true,
        feedback:
          probe.isInstance === true
            ? "Instance has the expected type."
            : `Expected an instance of ${target}.`,
        actual: probe.actual,
      };
    }
    case "fieldValue":
      return compareValue(probe.actual, check, entry, probe);
    case "methodReturn": {
      if (probe.notInstantiable)
        return fail(
          "Cannot invoke an instance method on an abstract class or interface without a concrete instance.",
          null,
        );
      if (probe.thrown)
        return fail(
          `Method threw ${String(probe.thrown.type || "").split(".").pop()}: ${probe.thrown.message ?? ""}`,
          probe.thrown,
        );
      return compareValue(probe.actual, check, entry, probe);
    }
    default:
      return fail(`Unsupported check type: ${type}`, null);
  }
}

function normalizeDiagnostics(list) {
  if (!Array.isArray(list)) return list;
  return list.map((item) =>
    item && typeof item.file === "string" && item.file.includes("/")
      ? { ...item, file: item.file.slice(item.file.lastIndexOf("/") + 1) }
      : item,
  );
}

// Turns the raw facts the slim Java runner returns into the full result shape.
// Results without raw:true (compile results, or an older runner) pass through.
async function finalizeResult(operation, raw, plan) {
  const result = { ...(raw || {}) };
  if (result.diagnostics) result.diagnostics = normalizeDiagnostics(result.diagnostics);
  if (result.compileDiagnostics)
    result.compileDiagnostics = normalizeDiagnostics(result.compileDiagnostics);
  if (result.raw !== true) return result;
  delete result.raw;

  result.stdout = result.stdout ?? "";
  result.stderr = result.stderr ?? "";
  result.executionTimeMs = result.executionTimeMs ?? 0;

  if (result.error) {
    return { ...result, compiled: false, success: false, status: "error", exitCode: 1 };
  }
  result.compiled = true;

  if (operation === "run") {
    const failed = Boolean(result.runtimeException);
    return {
      ...result,
      success: !failed,
      status: failed ? "runtime-error" : "completed",
      exitCode: failed ? 1 : 0,
    };
  }

  // operation === "check"
  const probes = Array.isArray(result.checks) ? result.checks : [];
  const checks = plan?.checks || [];
  const meta = plan?.meta || [];
  let total = 0;
  let earned = 0;
  let allPassed = true;
  let lastStdout = "";
  let lastStderr = "";
  const results = probes.map((probe, index) => {
    const check = checks[index] || {};
    const entry = meta[index] || { id: `check-${index + 1}`, description: `check-${index + 1}`, points: 1, matcher: "exact" };
    total += entry.points;
    const row = {
      id: entry.id,
      description: entry.description,
      points: entry.points,
      pointsEarned: 0,
    };
    let outcome;
    if (probe.errorType) {
      outcome = fail(describeProbeError(probe), undefined);
      row.errorType = probe.errorType;
    } else {
      if (typeof probe.stdout === "string") lastStdout = probe.stdout;
      if (typeof probe.stderr === "string") lastStderr = probe.stderr;
      outcome = evaluateProbe(probe, check, entry);
    }
    row.passed = outcome.passed;
    row.feedback = outcome.feedback;
    if (outcome.actual !== undefined && outcome.actual !== null) row.actual = outcome.actual;
    if (Object.prototype.hasOwnProperty.call(check, "expected")) row.expected = check.expected;
    if (outcome.passed) {
      earned += entry.points;
      row.pointsEarned = entry.points;
    } else {
      allPassed = false;
    }
    return row;
  });

  const success = allPassed && probes.length > 0;
  return {
    ...result,
    checks: results,
    score: { earned, total },
    stdout: lastStdout,
    stderr: lastStderr,
    success,
    status: "graded",
    exitCode: success ? 0 : 1,
  };
}

function executionConfig(exercise, stdin = "", checks = []) {
  const java = exercise?.java || {};
  return {
    sourceFile: java.sourceFile || "Main.java",
    mainClass: java.mainClass || "Main",
    stdin: String(stdin ?? ""),
    checks,
    timeoutMs: java.timeoutMs,
  };
}

export function runJavaExercise({ exercise, source, stdin = "" }) {
  const config = executionConfig(exercise, stdin);
  return enqueueOperation("run", {
    sources: normalizeSources(exercise?.java || {}, source),
    config,
    plan: null,
  });
}

export function checkJavaExercise({ exercise, source }) {
  const plan = buildCheckPlan(exercise?.checks ?? exercise?.java?.checks);
  const config = executionConfig(
    exercise,
    exercise?.java?.stdin || "",
    plan.javaChecks,
  );
  return enqueueOperation("check", {
    sources: normalizeSources(exercise?.java || {}, source),
    config,
    plan,
  });
}

export function stopJavaExecution(reason = "Execution stopped by the user.") {
  generation++;
  operationQueue = Promise.resolve();
  const error = Object.assign(new Error(reason), {
    code: "JAVA_STOPPED",
    phase: "stopped",
  });
  terminateCurrentWorker(error);
  emitStatus("STOPPED", reason);
}

export function resetJavaRuntime() {
  stopJavaExecution("Java runtime reset.");
}

let codeMirrorModulePromise = null;
function loadCodeMirror() {
  // Cache the import group across exercises. Dynamic import itself is cached by
  // the browser, but retaining the aggregate promise also avoids repeat setup.
  return (codeMirrorModulePromise ||= Promise.all([
    import("https://esm.sh/codemirror@6.0.2"),
    import("https://esm.sh/@codemirror/language"),
    import("https://esm.sh/@codemirror/lang-java@6.0.2"),
    import("https://esm.sh/@codemirror/theme-one-dark"),
    import("https://esm.sh/@codemirror/state@6"),
    import("https://esm.sh/@codemirror/commands@6"),
  ])
    .then(([core, language, javaLanguage, oneDark, state, commands]) => ({
      ...core,
      ...language,
      ...javaLanguage,
      ...oneDark,
      ...state,
      ...commands,
    }))
    .catch((error) => {
      codeMirrorModulePromise = null;
      throw error;
    }));
}

function element(tag, className, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child instanceof Node) node.append(child);
    else if (child != null) node.append(document.createTextNode(String(child)));
  }
  return node;
}

function scrollSentinel() {
  const node = element("div", "java-scroll-end");
  node.setAttribute("aria-hidden", "true");
  return node;
}

function createJavaThemeExtensions(oneDark, dark) {
  // Keep all visual styling in style.css. One Dark contributes syntax colours
  // only while the application itself is using its dark theme.
  return dark ? [oneDark] : [];
}

function formatDiagnostics(diagnostics) {
  return (diagnostics || []).map((item) => {
    const location =
      item.line > 0
        ? `${item.file || "Source"}:${item.line}:${item.column || 1}`
        : item.file || "Compiler";
    return {
      ...item,
      label: `${location} · ${item.kind || "INFO"}: ${item.message || ""}`,
    };
  });
}

function renderConsole(target, result, diagnostics = []) {
  target.replaceChildren();
  const stdout = element("section", "java-console-stream", [
    element("h4", "", "System.out"),
    element(
      "pre",
      "java-console-text",
      result?.stdout || "(no standard output)",
    ),
  ]);
  const stderr = element("section", "java-console-stream", [
    element("h4", "", "System.err"),
    element(
      "pre",
      "java-console-text java-stderr",
      result?.stderr || "(no standard error)",
    ),
  ]);
  target.append(stdout, stderr);
  const exception = result?.runtimeException;
  if (exception) {
    const detail = element("details", "java-runtime-exception");
    detail.append(
      element(
        "summary",
        "",
        `Runtime exception: ${exception.type || "Java exception"}`,
      ),
    );
    detail.append(
      element("pre", "", exception.message || "No exception message."),
    );
    target.append(detail);
  }
  const formatted = formatDiagnostics(
    diagnostics.length
      ? diagnostics
      : result?.compileDiagnostics || result?.diagnostics || [],
  );
  if (formatted.length) {
    const panel = element("details", "java-diagnostics");
    panel.open = true;
    panel.append(
      element("summary", "", `Compiler diagnostics (${formatted.length})`),
    );
    const list = element("ul", "");
    formatted.forEach((item) => {
      const row = element("li", "java-diagnostic");
      row.append(
        element(
          "span",
          `java-diagnostic-kind ${String(item.kind).toLowerCase()}`,
          item.kind || "INFO",
        ),
      );
      row.append(element("span", "", item.label));
      list.append(row);
    });
    panel.append(list);
    target.append(panel);
  }
  const meta = [];
  if (Number.isFinite(result?.executionTimeMs))
    meta.push(`${result.executionTimeMs} ms`);
  if (result?.exitCode !== undefined && result?.exitCode !== null)
    meta.push(`exit code ${result.exitCode}`);
  if (meta.length)
    target.append(element("small", "java-console-meta", meta.join(" · ")));
}

function renderCheckResults(target, result) {
  target.replaceChildren();
  const checks = Array.isArray(result?.checks) ? result.checks : [];
  const score = result?.score || { earned: 0, total: 0 };
  const passed = checks.filter((item) => item.passed).length;
  target.append(
    element("div", "java-score-heading", [
      element(
        "strong",
        "",
        `${score.earned ?? 0} / ${score.total ?? 0} points`,
      ),
      element("span", "", `${passed} / ${checks.length} tests passed`),
    ]),
  );
  const list = element("ol", "java-check-list");
  checks.forEach((check) => {
    const row = element(
      "li",
      `java-check ${check.passed ? "passed" : "failed"}`,
    );
    row.append(
      element("span", "java-check-icon", check.passed ? "✓" : "✕"),
      element("div", "java-check-content", [
        element(
          "strong",
          "",
          check.description || check.id || "Automatic test",
        ),
        element(
          "small",
          "",
          `${check.pointsEarned ?? (check.passed ? check.points : 0)} / ${check.points ?? 0} points`,
        ),
        check.feedback
          ? element("span", "ot-feedback", check.feedback)
          : "",
      ]),
    );
    if (!check.passed && check.actual !== undefined) {
      const actual = element("details", "java-check-actual");
      actual.append(
        element("summary", "", "Show actual value"),
        element(
          "pre",
          "",
          typeof check.actual === "string"
            ? check.actual
            : JSON.stringify(check.actual, null, 2),
        ),
      );
      row.append(actual);
    }
    list.append(row);
  });
  target.append(list);
  if (result?.success && result?.explanation)
    target.append(element("p", "java-explanation", result.explanation));
}

export async function mountJavaExercise({
  toolsContainer = null,
  container = null,
  workspaceContainer = null,
  editorContainer = null,
  actionsContainer = null,
  exercise,
  initialCode,
  onChange = () => {},
  onGrade = () => {},
  mode = "practice",
}) {
  const toolsHost =
    toolsContainer instanceof Element ? toolsContainer : container;
  if (!(toolsHost instanceof Element))
    throw new Error("A valid Java tools container is required");
  const javaConfig = exercise?.java || {};
  const config = {
    ...javaConfig,
    checks: exercise?.checks ?? javaConfig.checks,
    solution: exercise?.solution ?? javaConfig.solution,
    explanation:
      [exercise?.explanation, javaConfig.gradingExplanation]
        .filter((value) => typeof value === "string" && value.trim())
        .join("\n\n") || javaConfig.explanation,
  };
  const originalCode = String(config.preCode ?? "");
  let source =
    initialCode === undefined || initialCode === null
      ? originalCode
      : String(initialCode);
  let editor = null;
  let editorView = null;
  let redoCommand = null;
  let disposed = false;
  let running = false;
  let currentOperation = 0;
  let unsubscribeStatus = null;
  let themeObserver = null;
  let themeCompartment = null;
  let latestResult = null;
  let solutionPanelObserver = null;
  let showSolutionClickHandler = null;
  let solutionTestButton = null;
  let solutionCopyButton = null;
  let solutionRevealed = false;
  let solutionPanel = null;
  const root = element("div", "java-exercise");
  const editorPanel = element("section", "java-panel java-editor-panel");
  const editorHeader = element("div", "java-panel-heading", [
    element("h4", "", "Java editor"),
    element("small", "", config.sourceFile || "Main.java"),
  ]);
  const selectLineButton = element("button", "sec", "Select current line");
  selectLineButton.type = "button";
  selectLineButton.title = "Select the current line";
  selectLineButton.setAttribute("aria-label", "Select current line");
  editorHeader.append(selectLineButton);
  const editorHost = element("div", "java-codemirror-host");
  const fallbackNotice = element(
    "p",
    "java-editor-loading",
    "Loading the Java editor…",
  );
  editorPanel.append(editorHeader, fallbackNotice, editorHost);

  const inputPanel = element("section", "java-panel java-input-panel");
  const inputLabel = element("label", "", "Standard input (System.in)");
  const input = element("textarea", "java-input");
  input.rows = 3;
  input.spellcheck = false;
  input.setAttribute("aria-label", "Java standard input");
  input.value = String(config.stdin || "");
  inputLabel.append(input);
  inputPanel.append(
    inputLabel,
    element(
      "small",
      "java-help",
      "Enter the text your program should read. Include line breaks when the program expects multiple values.",
    ),
  );

  const actionButtons =
    actionsContainer instanceof Element
      ? actionsContainer
      : element("div", "exercise-action-buttons");
  const runButton = element("button", "", "Run (Ctrl+Enter)");
  runButton.setAttribute("aria-keyshortcuts", "Control+Enter");
  runButton.title = "Run Java (Ctrl+Enter)";
  runButton.hidden = !config.mainClass;
  const checkButton = element("button", "", "Check (Ctrl+Shift+Enter)");
  checkButton.setAttribute("aria-keyshortcuts", "Control+Shift+Enter");
  checkButton.title = "Run automatic checks (Ctrl+Shift+Enter)";
  const resetButton = element("button", "sec", "Reset");
  const stopButton = element("button", "sec", "Stop");
  stopButton.disabled = true;
  checkButton.hidden =
    !Array.isArray(config.checks) || config.checks.length === 0;
  actionButtons.append(runButton, checkButton, resetButton, stopButton);

  const statusLine = element(
    "p",
    "java-runtime-status",
    "Java runtime will initialize when this exercise opens.",
  );
  statusLine.setAttribute("role", "status");
  statusLine.setAttribute("aria-live", "polite");
  const operationProgress = element("div", "java-operation-progress", [
    element("div", "java-operation-progress-heading", [
      element("span", "java-operation-progress-indicator", ""),
      element(
        "strong",
        "java-operation-progress-title",
        "Preparing Java runtime…",
      ),
    ]),
    element(
      "p",
      "java-operation-progress-detail",
      "The Java worker is getting ready.",
    ),
    element("div", "java-operation-progress-track", [
      element("span", "java-operation-progress-fill", ""),
    ]),
  ]);
  operationProgress.hidden = true;
  operationProgress.setAttribute("aria-hidden", "true");
  const progressTitle = operationProgress.querySelector(
    ".java-operation-progress-title",
  );
  const progressDetail = operationProgress.querySelector(
    ".java-operation-progress-detail",
  );
  const consolePanel = element("details", "java-panel java-output-panel");
  consolePanel.open = true;
  consolePanel.append(
    element("summary", "java-panel-summary", "Console output"),
  );
  const consoleContent = element("div", "java-console-content");
  const consoleEnd = scrollSentinel();
  consolePanel.append(consoleContent, consoleEnd);
  const resultsPanel = element("details", "java-panel java-results-panel");
  resultsPanel.open = true;
  resultsPanel.append(
    element("summary", "java-panel-summary", "Automatic test results"),
  );
  const resultsContent = element(
    "div",
    "java-results-content",
    "Run Check to see the test results.",
  );
  const resultsEnd = scrollSentinel();
  resultsPanel.append(resultsContent, resultsEnd);

  // The app supplies workspace and tools slots. The editor mounts in the
  // workspace slot; runtime panels mount in the tools slot; action buttons are
  // contributed directly to the app-owned shared action group. The fallback
  // keeps this module usable outside the exercise-page layout.
  const editorHostContainer = workspaceContainer || editorContainer;
  if (editorHostContainer) editorHostContainer.replaceChildren(editorPanel);
  else root.append(editorPanel);
  root.append(inputPanel);
  if (!(actionsContainer instanceof Element)) root.append(actionButtons);
  root.append(operationProgress, statusLine, consolePanel);
  if (!checkButton.hidden) root.append(resultsPanel);
  toolsHost.replaceChildren(root);

  const getSource = () =>
    editorView ? editorView.state.doc.toString() : source;

  // Ctrl/Cmd+L adds the following line; Ctrl/Cmd+Shift+L adds the
  // preceding line. The toolbar button selects only the current line.
  const selectCurrentLine = () => {
    if (editorView?.state?.doc?.lineAt && editorView?.dispatch) {
      const line = editorView.state.doc.lineAt(
        editorView.state.selection.main.head,
      );
      editorView.dispatch({
        selection: { anchor: line.from, head: line.to },
        scrollIntoView: true,
      });
      editorView.focus();
      return;
    }

    const fallback = editorHost.querySelector("textarea");
    if (!fallback) return;
    const value = fallback.value;
    const position = fallback.selectionStart;
    const lineStart = value.lastIndexOf("\n", position - 1) + 1;
    const newline = value.indexOf("\n", position);
    const lineEnd = newline < 0 ? value.length : newline;
    fallback.setSelectionRange(lineStart, lineEnd);
    fallback.focus();
  };

  const extendLineSelection = (direction) => {
    if (editorView?.state?.doc?.lineAt && editorView?.dispatch) {
      const doc = editorView.state.doc;
      const selection = editorView.state.selection.main;
      const startLine = doc.lineAt(selection.from);
      const endLine = doc.lineAt(selection.to);

      if (selection.empty) {
        editorView.dispatch({
          selection: { anchor: startLine.from, head: startLine.to },
          scrollIntoView: true,
        });
      } else if (direction === "down") {
        const nextLine =
          selection.to >= endLine.to && endLine.number < doc.lines
            ? doc.line(endLine.number + 1)
            : null;
        editorView.dispatch({
          selection: {
            anchor: startLine.from,
            head: nextLine ? nextLine.to : endLine.to,
          },
          scrollIntoView: true,
        });
      } else {
        const previousLine =
          selection.from <= startLine.from && startLine.number > 1
            ? doc.line(startLine.number - 1)
            : null;
        editorView.dispatch({
          selection: {
            anchor: previousLine ? previousLine.from : startLine.from,
            head: endLine.to,
          },
          scrollIntoView: true,
        });
      }
      editorView.focus();
      return;
    }

    const fallback = editorHost.querySelector("textarea");
    if (!fallback) return;
    const value = fallback.value;
    const from = fallback.selectionStart;
    const to = fallback.selectionEnd;
    const startLineStart = value.lastIndexOf("\n", from - 1) + 1;
    const endLineStart = value.lastIndexOf("\n", Math.max(from, to - 1)) + 1;
    const endNewline = value.indexOf("\n", endLineStart);
    const endLineEnd = endNewline < 0 ? value.length : endNewline;

    if (from === to) {
      fallback.setSelectionRange(startLineStart, endLineEnd);
    } else if (direction === "down") {
      const nextLineStart = endLineEnd + 1;
      const nextNewline = value.indexOf("\n", nextLineStart);
      const nextLineEnd = nextNewline < 0 ? value.length : nextNewline;
      const newEnd =
        to >= endLineEnd && endNewline >= 0 ? nextLineEnd : endLineEnd;
      fallback.setSelectionRange(startLineStart, newEnd);
    } else {
      const previousLineStart =
        startLineStart > 0
          ? value.lastIndexOf("\n", startLineStart - 2) + 1
          : startLineStart;
      const newStart =
        from <= startLineStart ? previousLineStart : startLineStart;
      fallback.setSelectionRange(newStart, endLineEnd);
    }
    fallback.focus();
  };

  selectLineButton.addEventListener("click", selectCurrentLine);

  const setSource = (value) => {
    source = String(value ?? "");
    if (editorView)
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: source },
      });
    onChange(source);
  };
  const setBusy = (busy) => {
    running = busy;
    runButton.disabled = busy;
    checkButton.disabled = busy || checkButton.hidden;
    resetButton.disabled = busy;
    stopButton.disabled = !busy;
    if (solutionTestButton) solutionTestButton.disabled = busy;
    if (solutionCopyButton) solutionCopyButton.disabled = busy;
    root.setAttribute("aria-busy", String(busy));
  };

  // Scroll to the very bottom of a panel (console output after Run, automatic
  // test results after Check). scrollIntoView on the zero-height sentinel moves
  // every scrollable ancestor (split tools pane, page), and the panel body is
  // also pinned to its own bottom in case it has a max-height with overflow.
  const scrollToBottom = (content, end) => {
    if (disposed) return;
    requestAnimationFrame(() => {
      if (disposed) return;
      if (content && content.scrollHeight > content.clientHeight)
        content.scrollTop = content.scrollHeight;
      const reduce =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      end.scrollIntoView({
        block: "end",
        inline: "nearest",
        behavior: reduce ? "auto" : "smooth",
      });
    });
  };

  // Navigation is owned by app.js; this module reports grading only.

  const handleStatus = ({ status, detail }) => {
    if (disposed) return;
    const messages = {
      INITIALIZING: [
        "Starting the Java 21 runtime",
        "Preparing the isolated Java worker. The first start may take longer.",
      ],
      COMPILING: [
        "Compiling your Java code",
        "Checking the source and preparing the program to run.",
      ],
      RUNNING: [
        "Running your program",
        "Your code is executing in a separate worker; the editor remains responsive.",
      ],
      TESTING: [
        "Running automatic tests",
        "Executing the exercise checks and collecting their results.",
      ],
    };
    const activeMessage = messages[status];
    if (activeMessage) {
      progressTitle.textContent = activeMessage[0];
      progressDetail.textContent = detail || activeMessage[1];
      operationProgress.dataset.phase = status.toLowerCase();
      operationProgress.hidden = false;
    } else {
      operationProgress.hidden = true;
      operationProgress.removeAttribute("data-phase");
    }
    statusLine.textContent =
      detail ||
      {
        INITIALIZING: "Initializing Java 21…",
        READY: "Java 21 runtime ready.",
        COMPILING: "Compiling Java source…",
        RUNNING: "Running Java program…",
        TESTING: "Running automatic tests…",
        TIMEOUT: "Java execution timed out.",
        STOPPED: "Execution stopped.",
        ERROR: "Java runtime error.",
      }[status] ||
      status;
    statusLine.dataset.status = status.toLowerCase();
  };
  unsubscribeStatus = subscribeJavaStatus(handleStatus);

  const execute = async (operation, { recordGrade = true } = {}) => {
    if (running || disposed) return;
    const current = ++currentOperation;
    const code = getSource();
    setBusy(true);
    operationProgress.hidden = false;
    operationProgress.dataset.phase = "queued";
    progressTitle.textContent =
      operation === "check"
        ? "Preparing automatic checks"
        : "Preparing Java execution";
    progressDetail.textContent =
      "Starting the Java worker and preparing your source code.";
    statusLine.textContent =
      operation === "check"
        ? "Preparing automatic checks…"
        : "Preparing Java execution…";
    consolePanel.open = true;
    if (operation === "check") {
      resultsPanel.open = true;
      resultsContent.replaceChildren(
        element("p", "java-pending", "Compiling and running the test suite…"),
      );
    }
    consoleContent.replaceChildren(
      element(
        "p",
        "java-pending",
        "Java is working in a separate browser worker. The editor remains responsive.",
      ),
    );
    if (operation === "check") scrollToBottom(resultsContent, resultsEnd);
    else scrollToBottom(consoleContent, consoleEnd);
    try {
      const result =
        operation === "check"
          ? await checkJavaExercise({ exercise, source: code })
          : await runJavaExercise({
              exercise,
              source: code,
              stdin: input.value,
            });
      if (disposed || current !== currentOperation) return;
      latestResult = result;
      const diagnostics =
        result.status === "compile-error"
          ? result.diagnostics || []
          : result.compileDiagnostics || [];
      renderConsole(consoleContent, result, diagnostics);
      if (operation === "check") {
        renderCheckResults(resultsContent, {
          ...result,
          explanation: config.explanation,
        });
        if (recordGrade) {
          try {
            await onGrade(result);
          } catch (error) {
            console.warn("Could not record Java exercise grade:", error);
          }
        }
      }
      statusLine.textContent =
        result.status === "compile-error"
          ? "Compilation failed. Review the compiler diagnostics below."
          : result.status === "runtime-error"
            ? "The program stopped because of a runtime exception."
            : result.status === "completed"
              ? "Program completed."
              : result.success
                ? "All automatic checks passed."
                : "Automatic checks completed; review the failed tests.";
      statusLine.dataset.status = result.success ? "ready" : "error";
      operationProgress.hidden = true;
      operationProgress.removeAttribute("data-phase");
      if (operation === "check") scrollToBottom(resultsContent, resultsEnd);
      else scrollToBottom(consoleContent, consoleEnd);
    } catch (error) {
      if (disposed || current !== currentOperation) return;
      const isTimeout = error?.code === "JAVA_TIMEOUT";
      const message = isTimeout
        ? `${error.message} The worker was terminated so the website remains responsive. Run again to start a fresh Java runtime.`
        : error?.code === "JAVA_STOPPED"
          ? error.message
          : error?.message || String(error);
      renderConsole(consoleContent, {
        stdout: "",
        stderr: "",
        status: isTimeout ? "timeout" : "error",
        error: message,
        exitCode: null,
      });
      consoleContent.append(
        element(
          "p",
          `java-execution-error ${isTimeout ? "timeout" : ""}`,
          message,
        ),
      );
      if (operation === "check")
        resultsContent.replaceChildren(element("p", "bad", message));
      statusLine.textContent = message;
      statusLine.dataset.status = isTimeout ? "timeout" : "error";
      operationProgress.hidden = true;
      operationProgress.removeAttribute("data-phase");
      if (operation === "check") scrollToBottom(resultsContent, resultsEnd);
      else scrollToBottom(consoleContent, consoleEnd);
      if (error?.code === "JAVA_TIMEOUT" || error?.code === "JAVA_STOPPED")
        setBusy(false);
    } finally {
      if (!disposed && current === currentOperation) setBusy(false);
    }
  };

  // The exercise page owns the solution panel and its Show solution control.
  // Add this exercise's reference-solution test button only after that panel is
  // revealed. The button loads the reference solution into the current editor
  // and sends it through the same automatic checks as learner code.
  const isPanelVisible = (panel) => {
    if (!panel) return false;
    for (let current = panel; current instanceof Element; current = current.parentElement) {
      if (current.hidden || current.getAttribute("aria-hidden") === "true")
        return false;
      if (current instanceof HTMLDetailsElement && !current.open)
        return false;
      const style = window.getComputedStyle?.(current);
      if (style && (style.display === "none" || style.visibility === "hidden"))
        return false;
    }
    return true;
  };

  const attachSolutionTestButton = () => {
    if (disposed || !solutionRevealed || typeof config.solution !== "string" || !config.solution.trim())
      return;
    const panel = document.querySelector(".java-solution-panel");
    if (!panel || !isPanelVisible(panel)) return;
    solutionPanel = panel;

    const existingTest = panel.querySelector('[data-java-test-solution="true"]');
    if (existingTest && existingTest !== solutionTestButton) existingTest.remove();
    const existingCopy = panel.querySelector('[data-java-copy-solution="true"]');
    if (existingCopy && existingCopy !== solutionCopyButton) existingCopy.remove();
    if (solutionTestButton && solutionTestButton.parentElement !== panel)
      solutionTestButton.remove();
    if (solutionCopyButton && solutionCopyButton.parentElement !== panel)
      solutionCopyButton.remove();

    if (!solutionCopyButton) {
      solutionCopyButton = element("button", "sec", "Copy code");
      solutionCopyButton.type = "button";
      solutionCopyButton.dataset.javaCopySolution = "true";
      solutionCopyButton.title =
        "Copy the reference solution into the Java editor without running it.";
      solutionCopyButton.setAttribute("aria-label", "Copy code");
      solutionCopyButton.addEventListener("click", () => {
        if (running || disposed || typeof config.solution !== "string") return;
        setSource(config.solution);
        if (editorView) editorView.focus();
        else editorHost.querySelector("textarea")?.focus();
        statusLine.textContent =
          "Reference solution copied into the editor. Nothing was run.";
        statusLine.dataset.status = "ready";
      });
    }

    if (!solutionTestButton) {
      solutionTestButton = element("button", "sec", "Test solution");
      solutionTestButton.type = "button";
      solutionTestButton.dataset.javaTestSolution = "true";
      solutionTestButton.title = "Load the reference solution into the editor and run all automatic checks.";
      solutionTestButton.setAttribute("aria-label", "Test solution");
      solutionTestButton.addEventListener("click", () => {
        if (running || disposed || typeof config.solution !== "string") return;
        setSource(config.solution);
        consolePanel.open = true;
        resultsPanel.open = true;
        execute("check", { recordGrade: false });
      });
    }

    // Keep the non-running copy action immediately beside the existing test
    // action, even when the page re-renders or reveals the panel later. Avoid
    // moving already-positioned nodes: this panel is observed by a
    // MutationObserver, so needless appends would retrigger that observer.
    if (solutionTestButton.parentElement !== panel)
      panel.append(solutionTestButton);
    if (
      solutionCopyButton.parentElement !== panel ||
      solutionCopyButton.nextElementSibling !== solutionTestButton
    )
      panel.insertBefore(solutionCopyButton, solutionTestButton);
    solutionCopyButton.disabled = running;
    solutionTestButton.disabled = running;
  };

  showSolutionClickHandler = (event) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const trigger = target?.closest("button, [role='button'], summary, a");
    if (!trigger) return;
    const label = [
      trigger.textContent,
      trigger.getAttribute("aria-label"),
      trigger.getAttribute("title"),
    ].filter(Boolean).join(" ");
    if (!/show\s+solution/i.test(label)) return;
    solutionRevealed = true;
    requestAnimationFrame(attachSolutionTestButton);
  };
  document.addEventListener("click", showSolutionClickHandler, true);

  // Observe the page-owned panel as it is revealed or populated. The delegated
  // click handler above covers the normal Show solution action; this observer
  // also handles panels revealed by keyboard or restored page state.
  if (typeof MutationObserver !== "undefined" && document.documentElement) {
    solutionPanelObserver = new MutationObserver(() => {
      if (solutionRevealed) attachSolutionTestButton();
      else {
        const panel = document.querySelector(".java-solution-panel");
        const hasVisibleSolution = isPanelVisible(panel) &&
          Boolean(panel?.querySelector("pre, code, .java-solution-code"));
        if (hasVisibleSolution) {
          solutionRevealed = true;
          attachSolutionTestButton();
        }
      }
    });
    solutionPanelObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden"],
    });
  }
  const initiallyVisibleSolution = document.querySelector(".java-solution-panel");
  if (isPanelVisible(initiallyVisibleSolution) &&
      initiallyVisibleSolution?.querySelector("pre, code, .java-solution-code")) {
    solutionRevealed = true;
    attachSolutionTestButton();
  }

  runButton.addEventListener("click", () => execute("run"));
  checkButton.addEventListener("click", () => execute("check"));
  // The editor can be mounted in a separate pane outside `root`, so listen
  // directly on editorHost. Capture the shortcut before CodeMirror or the
  // surrounding page can consume it, then prevent it escaping to browser/page
  // handlers (for example, form submission).
  editorHost.addEventListener(
    "keydown",
    (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === "z"
      ) {
        if (editorView && redoCommand) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          redoCommand(editorView);
        }
        // In the textarea fallback, leave the native browser redo shortcut intact.
        return;
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "l"
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        extendLineSelection(event.shiftKey ? "up" : "down");
        return;
      }
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.key !== "Enter" ||
        event.altKey
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (event.shiftKey) {
        if (!checkButton.hidden && !checkButton.disabled) execute("check");
      } else if (!runButton.hidden && !runButton.disabled) {
        execute("run");
      }
    },
    true,
  );
  resetButton.addEventListener("click", () => {
    if (running) return;
    setSource(originalCode);
    input.value = String(config.stdin || "");
    consoleContent.replaceChildren();
    resultsContent.replaceChildren("Run Check to see the test results.");
    operationProgress.hidden = true;
    operationProgress.removeAttribute("data-phase");
    statusLine.textContent = "Starter code restored.";
  });
  stopButton.addEventListener("click", () => {
    if (!running) return;
    currentOperation++;
    stopJavaExecution("Execution stopped by the user.");
    setBusy(false);
    statusLine.textContent =
      "Execution stopped. The next run will initialize a fresh Java worker.";
    statusLine.dataset.status = "stopped";
    operationProgress.hidden = true;
    operationProgress.removeAttribute("data-phase");
  });

  // Begin runtime setup as soon as the Java exercise is opened. CodeMirror
  // loads independently, so the initial Java download never blocks the UI.
  initJava().catch((error) => {
    if (!disposed) {
      statusLine.textContent = error?.message || String(error);
      statusLine.dataset.status = "error";
    }
  });

  try {
    const {
      basicSetup,
      EditorView,
      java,
      indentUnit,
      oneDark,
      Compartment,
      indentLess,
      redo,
    } = await loadCodeMirror();
    redoCommand = redo;
    if (disposed) return { getSource, dispose: () => {} };
    themeCompartment = new Compartment();
    const activeTheme = () =>
      createJavaThemeExtensions(
        oneDark,
        document.documentElement.dataset.theme === "dark",
      );
    editorView = new EditorView({
      doc: source,
      parent: editorHost,
      extensions: [
        basicSetup,
        java(),
        indentUnit.of("    "),
        themeCompartment.of(activeTheme()),
        EditorView.domEventHandlers({
          keydown(event, view) {
            if (
              event.key !== "Tab" ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey
            )
              return false;

            event.preventDefault();
            if (event.shiftKey) {
              // Match IDE behavior: reduce indentation on the current line
              // or every selected line, using the configured indent unit.
              indentLess(view);
              return true;
            }

            const selection = view.state.selection.main;
            const spaces = "    ";
            view.dispatch({
              changes: {
                from: selection.from,
                to: selection.to,
                insert: spaces,
              },
              selection: { anchor: selection.from + spaces.length },
            });
            return true;
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            source = update.state.doc.toString();
            onChange(source);
          }
        }),
      ],
    });
    editor = editorView;
    themeObserver = new MutationObserver(() => {
      if (!disposed && editorView && themeCompartment) {
        editorView.dispatch({
          effects: themeCompartment.reconfigure(activeTheme()),
        });
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    fallbackNotice.remove();
  } catch (error) {
    if (!disposed) {
      const fallback = element("textarea", "editor java-editor-fallback");
      fallback.value = source;
      fallback.spellcheck = false;
      fallback.setAttribute("aria-label", "Java source code");
      fallback.addEventListener("input", () => {
        source = fallback.value;
        onChange(source);
      });
      fallback.addEventListener("keydown", (event) => {
        if (
          event.key !== "Tab" ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        )
          return;
        event.preventDefault();

        const value = fallback.value;
        const start = fallback.selectionStart;
        const end = fallback.selectionEnd;

        if (event.shiftKey) {
          // Textarea fallback: outdent the current line or selected lines.
          const firstLineStart = value.lastIndexOf("\n", start - 1) + 1;
          const lastLineStart =
            end > start && value[end - 1] === "\n"
              ? value.lastIndexOf("\n", end - 2) + 1
              : value.lastIndexOf("\n", Math.max(start, end - 1)) + 1;
          const edits = [];
          for (
            let lineStart = firstLineStart;
            lineStart <= lastLineStart && lineStart < value.length;
          ) {
            let remove = 0;
            if (value[lineStart] === "\t") remove = 1;
            else {
              while (
                remove < 4 &&
                value[lineStart + remove] === " "
              ) remove++;
            }
            if (remove) edits.push({ from: lineStart, to: lineStart + remove });
            const newline = value.indexOf("\n", lineStart);
            if (newline < 0) break;
            lineStart = newline + 1;
          }

          const mapPosition = (position) =>
            position -
            edits.reduce(
              (total, edit) =>
                total + Math.min(edit.to - edit.from, Math.max(0, position - edit.from)),
              0,
            );
          const nextStart = mapPosition(start);
          const nextEnd = mapPosition(end);
          let nextValue = value;
          for (const edit of edits.reverse()) {
            nextValue =
              nextValue.slice(0, edit.from) + nextValue.slice(edit.to);
          }
          fallback.value = nextValue;
          fallback.setSelectionRange(nextStart, nextEnd);
        } else {
          fallback.setRangeText("    ", start, end, "end");
        }
        source = fallback.value;
        onChange(source);
      });
      editorHost.replaceChildren(fallback);
      fallbackNotice.textContent = `CodeMirror could not be loaded (${error?.message || String(error)}). Basic editing is available; check the Content Security Policy to enable Java syntax highlighting.`;
      fallbackNotice.classList.add("java-editor-error");
      editor = { destroy: () => {} };
      editorView = {
        get state() {
          return {
            doc: {
              toString: () => fallback.value,
              length: fallback.value.length,
            },
          };
        },
        dispatch: ({ changes }) => {
          fallback.value = changes.insert;
          source = fallback.value;
          onChange(source);
        },
      };
    }
  }

  return {
    getSource,
    get latestResult() {
      return latestResult;
    },
    reset: () => setSource(originalCode),
    stop: () => stopJavaExecution(),
    dispose: () => {
      if (disposed) return;
      disposed = true;
      currentOperation++;
      unsubscribeStatus?.();
      themeObserver?.disconnect();
      themeObserver = null;
      solutionPanelObserver?.disconnect();
      solutionPanelObserver = null;
      if (showSolutionClickHandler)
        document.removeEventListener("click", showSolutionClickHandler, true);
      showSolutionClickHandler = null;
      solutionTestButton?.remove();
      solutionTestButton = null;
      solutionCopyButton?.remove();
      solutionCopyButton = null;
      solutionPanel = null;
      if (running) stopJavaExecution("Java exercise closed.");
      editor?.destroy?.();
      root.remove();
      if (editorHostContainer) editorPanel.remove();
    },
  };
}
