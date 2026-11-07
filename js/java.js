"use strict";

export const JAVA_TIMEOUTS = Object.freeze({
  initializationMs: 90_000,
  compilationMs: 20_000,
  executionMs: 8_000,
  gradingMs: 20_000,
});

const WORKER_URL = new URL("./java.worker.js", import.meta.url);
const statusListeners = new Set();
let worker = null;
let readyPromise = null;
let initRequestId = null;
let activeRequest = null;
let sequence = 0;
let generation = 0;
let operationQueue = Promise.resolve();

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
      if (message.status !== "INITIALIZING")
        armWatchdog(activeRequest, message.status);
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
    instance.postMessage({ type: "INIT", requestId });
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

      return new Promise((resolve, reject) => {
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

function executionConfig(exercise, stdin = "") {
  const java = exercise?.java || {};
  return {
    sourceFile: java.sourceFile || "Main.java",
    mainClass: java.mainClass || "Main",
    stdin: String(stdin ?? ""),
    checks: Array.isArray(java.checks) ? java.checks : [],
    timeoutMs: java.timeoutMs,
  };
}

export function runJavaExercise({ exercise, source, stdin = "" }) {
  const config = executionConfig(exercise, stdin);
  return enqueueOperation("run", {
    sources: normalizeSources(exercise?.java || {}, source),
    config,
  });
}

export function checkJavaExercise({ exercise, source }) {
  const config = executionConfig(exercise, exercise?.java?.stdin || "");
  return enqueueOperation("check", {
    sources: normalizeSources(exercise?.java || {}, source),
    config,
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

async function loadCodeMirror() {
  const [core, language, javaLanguage, oneDark] = await Promise.all([
    import("https://esm.sh/codemirror@6.0.2"),
    import("https://esm.sh/@codemirror/language"),
    import("https://esm.sh/@codemirror/lang-java@6.0.2"),
    import("https://esm.sh/@codemirror/theme-one-dark"),
  ]);

  return {
    ...core,
    ...language,
    ...javaLanguage,
    ...oneDark,
  };
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
        check.feedback ? element("p", "", check.feedback) : "",
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
  const toolsHost = toolsContainer instanceof Element ? toolsContainer : container;
  if (!(toolsHost instanceof Element))
    throw new Error("A valid Java tools container is required");
  const config = exercise?.java || {};
  const originalCode = String(config.preCode ?? "");
  let source =
    initialCode === undefined || initialCode === null
      ? originalCode
      : String(initialCode);
  let editor = null;
  let editorView = null;
  let disposed = false;
  let running = false;
  let currentOperation = 0;
  let unsubscribeStatus = null;
  let latestResult = null;
  const root = element("div", "java-exercise");
  const editorPanel = element("section", "java-panel java-editor-panel");
  const editorHeader = element("div", "java-panel-heading", [
    element("h4", "", "Java editor"),
    element("small", "", config.sourceFile || "Main.java"),
  ]);
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
  const consolePanel = element("details", "java-panel java-output-panel");
  consolePanel.open = true;
  consolePanel.append(
    element("summary", "java-panel-summary", "Console output"),
  );
  const consoleContent = element("div", "java-console-content");
  const consoleEnd = element("div", "java-scroll-end");
  consoleEnd.setAttribute("aria-hidden", "true");
  consoleEnd.style.cssText = "height:0;overflow:hidden;";
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
  const resultsEnd = element("div", "java-scroll-end");
  resultsEnd.setAttribute("aria-hidden", "true");
  resultsEnd.style.cssText = "height:0;overflow:hidden;";
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
  root.append(statusLine, consolePanel);
  if (!checkButton.hidden) root.append(resultsPanel);
  toolsHost.replaceChildren(root);

  const getSource = () =>
    editorView ? editorView.state.doc.toString() : source;
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

  const execute = async (operation) => {
    if (running || disposed) return;
    const current = ++currentOperation;
    const code = getSource();
    setBusy(true);
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
        try {
          await onGrade(result);
        } catch (error) {
          console.warn("Could not record Java exercise grade:", error);
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
      if (operation === "check") scrollToBottom(resultsContent, resultsEnd);
      else scrollToBottom(consoleContent, consoleEnd);
      if (error?.code === "JAVA_TIMEOUT" || error?.code === "JAVA_STOPPED")
        setBusy(false);
    } finally {
      if (!disposed && current === currentOperation) setBusy(false);
    }
  };

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
    const { basicSetup, EditorView, java, indentUnit, oneDark } =
      await loadCodeMirror();
    const theme = EditorView.theme(
      {
        "&": {
          color: "var(--fg)",
          backgroundColor: "var(--card)",
          fontSize: "0.9rem",
        },
        ".cm-content": {
          caretColor: "var(--ac)",
          fontFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
          minHeight: "18rem",
          padding: "0.8rem 0",
        },
        ".cm-gutters": {
          backgroundColor: "var(--soft)",
          color: "var(--mut)",
          borderRight: "1px solid var(--bd)",
        },
        ".cm-activeLineGutter, .cm-activeLine": {
          backgroundColor: "color-mix(in srgb, var(--ac) 8%, transparent)",
        },
        "&.cm-focused": {
          outline: "2px solid color-mix(in srgb, var(--ac) 45%, transparent)",
          outlineOffset: "-2px",
        },
        ".cm-selectionBackground": {
          backgroundColor:
            "color-mix(in srgb, var(--ac) 25%, transparent) !important",
        },
      },
      { dark: document.documentElement.dataset.theme === "dark" },
    );
    editorView = new EditorView({
      doc: source,
      parent: editorHost,
      extensions: [
        basicSetup,
        java(),
        indentUnit.of("    "),
        oneDark,
        EditorView.domEventHandlers({
          keydown(event, view) {
            if (
              event.key !== "Tab" ||
              event.shiftKey ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey
            )
              return false;
            event.preventDefault();
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
          event.shiftKey ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        )
          return;
        event.preventDefault();
        const start = fallback.selectionStart;
        const end = fallback.selectionEnd;
        fallback.setRangeText("    ", start, end, "end");
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
      if (running) stopJavaExecution("Java exercise closed.");
      editor?.destroy?.();
      root.remove();
      if (editorHostContainer) editorPanel.remove();
    },
  };
}
