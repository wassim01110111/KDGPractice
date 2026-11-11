/* Classic worker: CheerpJ must be loaded here, never on the page thread. */
"use strict";

const JAVA_CACHE_VERSION = new URL(self.location.href).searchParams.get(
  "__acs_java_version",
);
const LOADER_URL_OBJECT = new URL(
  "https://cjrtnc.leaningtech.com/5.0/loader.js",
);
if (JAVA_CACHE_VERSION)
  LOADER_URL_OBJECT.searchParams.set("__acs_java_version", JAVA_CACHE_VERSION);
const LOADER_URL = LOADER_URL_OBJECT.href;
const RUNNER_CLASS = "learning.java.ExerciseRunner";
const ENABLE_EXPERIMENTAL_WASM_GC =
  new URL(self.location.href).searchParams.get("__acs_java_wasm_gc") === "1";

// Successful bytecode builds stay in CheerpJ's in-memory filesystem for this
// worker's lifetime. Re-running or re-checking identical source can therefore
// skip javac entirely. Keep the cache deliberately small because class files
// live in the virtual filesystem, not in Cache Storage.
const COMPILED_CACHE_MAX_ENTRIES = 5;
const compiledBuildCache = new Map();

// Resolve the JAR relative to this classic worker. This preserves the
// GitHub Pages repository prefix (for example /KDGPractice/) automatically.
const RUNNER_JAR_URL_OBJECT = new URL(
  "./content/java/ExerciseRunner.jar",
  self.location.href,
);
if (JAVA_CACHE_VERSION)
  RUNNER_JAR_URL_OBJECT.searchParams.set(
    "__acs_java_version",
    JAVA_CACHE_VERSION,
  );
const RUNNER_JAR_URL = RUNNER_JAR_URL_OBJECT.href;

// Stage the downloaded JAR in CheerpJ's Java-readable /str filesystem.
const RUNNER_JAR = "/str/ExerciseRunner.jar";
let runnerJarReady = null;
let runtimeReady = false;
let moduleNewVer = false;
let warmUpScheduled = false;
let warmUpInProgress = false;
let warmUpRequestId = null;
let warmUpProgressDetail = "Preparing the one-time Java compiler warm-up...";
const RUNNER_CACHE_NAME = "acs-java-runner";
let initialization = null;
let workQueue = Promise.resolve();

/*
 * CheerpJ runtime cache.
 *
 * CheerpJ downloads its runtime (wasm, JS and JDK chunks) lazily from the CDN
 * with fetch(). We wrap fetch() in this worker so every successful GET to the
 * CheerpJ CDN is stored in Cache Storage and answered from there afterwards,
 * including after a page refresh or while offline.
 *   * Normal load -> cache first, network only on a miss (then stored).
 *   * newVer load -> the cache is emptied at startup and never read: every
 *                    file is downloaded with cache:"reload" (HTTP cache
 *                    bypassed) and written back, rebuilding the cache.
 * Range requests are cached per range: the Cache API refuses 206 responses,
 * so they are stored as 200 with a marker header and rebuilt on a hit.
 */
// Keep experimental WasmGC resources separate from the stable engine cache.
const CHEERPJ_CACHE_NAME = ENABLE_EXPERIMENTAL_WASM_GC
  ? "acs-cheerpj-runtime-wasmgc"
  : "acs-cheerpj-runtime";
const CHEERPJ_ORIGIN = LOADER_URL_OBJECT.origin;
const STATUS_HEADER = "x-acs-status";
let cheerpCachePromise = null;
const nativeFetch = self.fetch.bind(self);

// Per-ExerciseRunner invocation telemetry. This measures the boundary that
// Java-side progress cannot observe: CheerpJ's launch/class-loading handoff
// before ExerciseRunner.main() writes its first progress marker.
let activeRunnerTelemetry = null;
const clockNow = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
const formatSeconds = (milliseconds) => `${(milliseconds / 1000).toFixed(2)}s`;

function recordRuntimeFetch(event) {
  const telemetry = activeRunnerTelemetry;
  if (!telemetry) return;
  const bucket = telemetry.mainEnteredAt == null ? telemetry.preMain : telemetry.duringMain;
  if (event.type === "cache-hit") {
    bucket.total++;
    bucket.cacheHits++;
  } else if (event.type === "cache-miss") {
    bucket.total++;
    bucket.cacheMisses++;
  } else if (event.type === "fetch") {
    bucket.fetches++;
    bucket.fetchMs += event.durationMs || 0;
    if (event.status != null) bucket.statuses[event.status] = (bucket.statuses[event.status] || 0) + 1;
  }
  if (event.url && bucket.resources.length < 6) {
    const path = (() => {
      try {
        const url = new URL(event.url);
        return url.pathname.split("/").filter(Boolean).slice(-2).join("/") || url.hostname;
      } catch (_) {
        return String(event.url).slice(-80);
      }
    })();
    if (!bucket.resources.includes(path)) bucket.resources.push(path);
  }
}

function createFetchBucket() {
  return { total: 0, cacheHits: 0, cacheMisses: 0, fetches: 0, fetchMs: 0, statuses: {}, resources: [] };
}

function summarizeFetchBucket(label, bucket) {
  if (!bucket.total) return `${label}: no CheerpJ runtime fetches observed`;
  const parts = [`${bucket.total} runtime resource request(s)`, `${bucket.cacheHits} Cache Storage hit(s)`, `${bucket.cacheMisses} Cache Storage miss(es)`, `${bucket.fetches} fetch(es) (${formatSeconds(bucket.fetchMs)} fetch time)`];
  if (bucket.resources.length) parts.push(`resources: ${bucket.resources.join(", ")}`);
  return `${label}: ${parts.join("; ")}`;
}

function openCheerpCache() {
  if (!("caches" in self)) return Promise.resolve(null);
  if (!cheerpCachePromise)
    cheerpCachePromise = caches.open(CHEERPJ_CACHE_NAME).catch(() => null);
  return cheerpCachePromise;
}

async function resetCheerpCache() {
  cheerpCachePromise = null;
  try {
    if ("caches" in self) await caches.delete(CHEERPJ_CACHE_NAME);
  } catch (_) {
    /* best effort */
  }
}

function cheerpCacheKey(request) {
  const range = request.headers.get("range");
  if (!range) return request.url;
  const key = new URL(request.url);
  key.searchParams.set("__acs_range", range);
  return key.href;
}

function responseFromCache(hit) {
  const status = Number(hit.headers.get(STATUS_HEADER)) || 200;
  const headers = new Headers(hit.headers);
  headers.delete(STATUS_HEADER);
  return new Response(hit.body, {
    status,
    statusText: status === 206 ? "Partial Content" : "OK",
    headers,
  });
}

async function storeInCheerpCache(cache, key, response) {
  try {
    const headers = new Headers(response.headers);
    headers.set(STATUS_HEADER, String(response.status));
    if (headers.has("content-encoding")) {
      // The body is already decoded, so these would no longer match it.
      headers.delete("content-encoding");
      headers.delete("content-length");
    }
    await cache.put(
      key,
      new Response(response.body, { status: 200, statusText: "OK", headers }),
    );
  } catch (_) {
    /* caching is best effort (quota, aborted download, ...) */
  }
}

self.fetch = async function cachedFetch(input, init) {
  let request;
  try {
    request = new Request(input, init);
  } catch (_) {
    return nativeFetch(input, init);
  }
  if (
    request.method !== "GET" ||
    request.cache === "no-store" ||
    new URL(request.url).origin !== CHEERPJ_ORIGIN
  ) {
    return nativeFetch(request);
  }

  const cache = await openCheerpCache();
  const key = cheerpCacheKey(request);
  // newVer: never read the cache; always download and overwrite the entry.
  let cacheLookupCounted = false;
  if (cache && !moduleNewVer) {
    try {
      const hit = await cache.match(key);
      if (hit) {
        recordRuntimeFetch({ type: "cache-hit", url: request.url });
        return responseFromCache(hit);
      }
      recordRuntimeFetch({ type: "cache-miss", url: request.url });
      cacheLookupCounted = true;
    } catch (_) {
      /* fall through to the network */
    }
  }
  if (!cacheLookupCounted)
    recordRuntimeFetch({ type: "cache-miss", url: request.url });

  const fetchStartedAt = clockNow();
  let response;
  try {
    response = await nativeFetch(
      request,
      moduleNewVer ? { cache: "reload" } : undefined,
    );
    recordRuntimeFetch({
      type: "fetch",
      url: request.url,
      durationMs: clockNow() - fetchStartedAt,
      status: response.status,
    });
  } catch (error) {
    recordRuntimeFetch({
      type: "fetch",
      url: request.url,
      durationMs: clockNow() - fetchStartedAt,
      status: "error",
    });
    throw error;
  }
  if (
    cache &&
    (response.status === 200 || response.status === 206) &&
    response.type !== "opaque"
  ) {
    storeInCheerpCache(cache, key, response.clone()); // not awaited on purpose
  }
  return response;
};

// Ask the browser not to evict the caches under storage pressure (best effort).
try {
  self.navigator?.storage?.persist?.().catch(() => {});
} catch (_) {
  /* ignored */
}

/*
 * The loader is imported on INIT rather than at worker start, because only
 * INIT tells us whether this is a newVer load. On newVer the HTTP cache entry
 * is refreshed first so importScripts picks up the new file.
 */
let loaderLoaded = false;
async function ensureLoader() {
  if (loaderLoaded) return;
  if (moduleNewVer) {
    try {
      await nativeFetch(LOADER_URL, { cache: "reload" });
    } catch (_) {
      /* importScripts below reports the real error */
    }
  }
  importScripts(LOADER_URL);
  loaderLoaded = true;
}

/*
 * ExerciseRunner is infrastructure, not the student's Main class.
 * It must be packaged as learning/java/ExerciseRunner.class inside
 * /app/content/java/ExerciseRunner.jar.
 */
const isJar = (bytes) =>
  bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;

/*
 * Cache policy: newVer -> empty the runner cache and refetch from the network;
 * otherwise use the cached JAR when present.
 */
async function loadRunnerJarBytes(onProgress = () => {}) {
  let cache = null;
  onProgress("Checking the persistent Cache Storage entry for ExerciseRunner.jar...");
  try {
    if ("caches" in self) {
      if (moduleNewVer) await caches.delete(RUNNER_CACHE_NAME);
      cache = await caches.open(RUNNER_CACHE_NAME);
    }
  } catch (_) {
    cache = null;
  }
  if (cache && !moduleNewVer) {
    try {
      const hit = await cache.match(RUNNER_JAR_URL);
      if (hit) {
        onProgress("Found ExerciseRunner.jar in Cache Storage; reading the cached JAR...");
        const cached = new Uint8Array(await hit.arrayBuffer());
        if (isJar(cached)) {
          onProgress(`Cached ExerciseRunner.jar is ready (${cached.byteLength.toLocaleString()} bytes).`);
          return cached;
        }
      }
    } catch (_) {
      /* fall through to the network */
    }
  }
  onProgress("Cache miss: downloading ExerciseRunner.jar from the site...");
  const response = await fetch(RUNNER_JAR_URL, {
    cache: moduleNewVer ? "reload" : "default",
  });
  if (!response.ok) {
    throw new Error(
      `Could not download ExerciseRunner.jar from ${RUNNER_JAR_URL} ` +
        `(HTTP ${response.status}). Ensure it exists at content/java/ExerciseRunner.jar ` +
        `relative to java.worker.js.`,
    );
  }
  onProgress("Download complete; reading and validating the ExerciseRunner.jar bytes...");
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (isJar(bytes) && cache) {
    onProgress("Saving the downloaded ExerciseRunner.jar in Cache Storage...");
    try {
      await cache.put(RUNNER_JAR_URL, new Response(buffer.slice(0)));
    } catch (_) {
      /* caching is best effort */
    }
  }
  return bytes;
}

async function ensureRunnerJar(onProgress = () => {}) {
  if (!runnerJarReady) {
    runnerJarReady = (async () => {
      const bytes = await loadRunnerJarBytes(onProgress);
      if (!isJar(bytes)) {
        throw new Error(
          `The response from ${RUNNER_JAR_URL} is not a valid JAR/ZIP file.`,
        );
      }

      onProgress("Staging ExerciseRunner.jar in CheerpJ's Java-readable virtual filesystem...");
      cheerpOSAddStringFile(RUNNER_JAR, bytes);
      const staged = await cjFileBlob(RUNNER_JAR);
      if (!staged || staged.size === 0) {
        throw new Error(
          `ExerciseRunner.jar could not be staged at ${RUNNER_JAR}.`,
        );
      }
      onProgress(`ExerciseRunner.jar staged successfully (${staged.size.toLocaleString()} bytes).`);
    })().catch((error) => {
      runnerJarReady = null;
      throw error;
    });
  } else {
    onProgress("ExerciseRunner.jar is already staged in the CheerpJ virtual filesystem.");
  }
  return runnerJarReady;
}

async function invokeExerciseRunner(args, hooks = {}) {
  const jarStartedAt = clockNow();
  hooks.onStage?.("Worker: confirming ExerciseRunner.jar is staged in CheerpJ's virtual filesystem...");
  await ensureRunnerJar((detail) => hooks.onStage?.(`Runner JAR: ${detail}`));
  const runnerJarMs = clockNow() - jarStartedAt;
  hooks.onJarReady?.(runnerJarMs);

  const launchStartedAt = clockNow();
  hooks.onLaunchStart?.(launchStartedAt);
  const telemetry = hooks.telemetry || null;
  const previousTelemetry = activeRunnerTelemetry;
  if (telemetry) activeRunnerTelemetry = telemetry;
  try {
    const exitCode = await cheerpjRunMain(RUNNER_CLASS, RUNNER_JAR, ...args);
    return {
      exitCode,
      runnerJarMs,
      cheerpjRunMainMs: clockNow() - launchStartedAt,
      launchStartedAt,
    };
  } catch (error) {
    const message = error?.message || String(error);
    if (
      /Could not find or load main class|ClassNotFoundException/i.test(message)
    ) {
      throw new Error(
        `Java exercise runner class "${RUNNER_CLASS}" was not found in ${RUNNER_JAR}. ` +
          `Rebuild the JAR with package learning.java and ensure it contains ` +
          `learning/java/ExerciseRunner.class. Original error: ${message}`,
      );
    }
    throw error;
  } finally {
    if (telemetry) activeRunnerTelemetry = previousTelemetry;
  }
}

async function runExerciseRunner(...args) {
  const invocation = await invokeExerciseRunner(args);
  return invocation.exitCode;
}
function status(requestId, value, detail = "") {
  self.postMessage({ type: "STATUS", requestId, status: value, detail });
}

function reportProgress(requestId, value, detail) {
  if (requestId) {
    status(requestId, value, detail);
    return;
  }
  // Warm-up runs before a learner request exists. Keep its latest exact stage;
  // when a request arrives, immediately attach that stage to its progress UI.
  if (warmUpInProgress) {
    warmUpProgressDetail = detail;
    if (warmUpRequestId) status(warmUpRequestId, value, detail);
  }
}

async function readProgressDetail(path) {
  try {
    const blob = await cjFileBlob(path);
    if (!blob || typeof blob.text !== "function") return "";
    return (await blob.text()).trim();
  } catch (_) {
    // The Java side creates the progress file after its main() method starts.
    return "";
  }
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Runs ExerciseRunner while polling the sidecar file that its Java code updates.
 * javac TaskListener events are written there as they happen, so the UI can show
 * PARSE / ENTER / ANALYZE / GENERATE instead of appearing stuck in one phase.
 */
async function runExerciseRunnerWithProgress(
  requestId,
  phase,
  initialDetail,
  progressPath,
  ...args
) {
  let polling = true;
  let currentDetail = String(initialDetail || "").trim();
  let stageStartedAt = clockNow();
  let lastElapsedSecond = 0;
  let launchStartedAt = null;
  let mainEnteredAt = null;
  let runnerJarCheckMs = 0;
  let mainEntryPrefix = "";
  const telemetry = {
    mainEnteredAt: null,
    preMain: createFetchBucket(),
    duringMain: createFetchBucket(),
  };

  const publish = (rawDetail) => {
    const detail = String(rawDetail || "").trim();
    if (!detail) return;
    if (detail !== currentDetail) {
      currentDetail = detail;
      stageStartedAt = clockNow();
      lastElapsedSecond = 0;
      reportProgress(requestId, phase, detail);
      return;
    }
    const elapsedSecond = Math.floor((clockNow() - stageStartedAt) / 1000);
    if (elapsedSecond > lastElapsedSecond && elapsedSecond > 0) {
      lastElapsedSecond = elapsedSecond;
      reportProgress(requestId, phase, `${detail} (${elapsedSecond}s)`);
    }
  };

  reportProgress(requestId, phase, initialDetail);
  const poller = (async () => {
    while (polling) {
      await delay(250);
      if (!polling) break;
      try {
        const detail = await readProgressDetail(progressPath);
        if (detail) {
          if (mainEnteredAt == null && launchStartedAt != null) {
            mainEnteredAt = clockNow();
            telemetry.mainEnteredAt = mainEnteredAt;
            const handoffMs = mainEnteredAt - launchStartedAt;
            mainEntryPrefix = `Runner JAR check: ${formatSeconds(runnerJarCheckMs)}; CheerpJ entry-point handoff: ${formatSeconds(handoffMs)}; ${summarizeFetchBucket("Pre-main runtime resources", telemetry.preMain)}; `;
            publish(`${mainEntryPrefix}${detail}`);
          } else {
            publish(`${mainEntryPrefix}${detail}`);
          }
        } else if (currentDetail) {
          const elapsedSecond = Math.floor((clockNow() - stageStartedAt) / 1000);
          if (elapsedSecond > lastElapsedSecond && elapsedSecond > 0) {
            lastElapsedSecond = elapsedSecond;
            const resourceHint = currentDetail.startsWith("CheerpJ is inside cheerpjRunMain()")
              ? `; pre-main runtime resources: ${telemetry.preMain.total} request(s), ${telemetry.preMain.cacheHits} Cache Storage hit(s), ${telemetry.preMain.fetches} fetch(es), ${formatSeconds(telemetry.preMain.fetchMs)} fetch time`
              : "";
            reportProgress(requestId, phase, `${currentDetail} (${elapsedSecond}s${resourceHint})`);
          }
        }
      } catch (_) {
        // Progress reporting must never interrupt a Java operation.
      }
    }
  })();

  let invocation;
  try {
    invocation = await invokeExerciseRunner(args, {
      telemetry,
      onStage: (detail) => {
        if (mainEnteredAt == null) publish(detail);
      },
      onJarReady: (elapsedMs) => {
        runnerJarCheckMs = elapsedMs;
        if (mainEnteredAt == null) {
          publish(`ExerciseRunner.jar is staged; worker-side JAR verification took ${formatSeconds(elapsedMs)}. Preparing to call cheerpjRunMain...`);
        }
      },
      onLaunchStart: (startedAt) => {
        launchStartedAt = startedAt;
        if (mainEnteredAt == null) {
          publish("CheerpJ is inside cheerpjRunMain(): launching ExerciseRunner and loading/linking its Java entry point. javac has NOT started yet; waiting for ExerciseRunner.main() to report its first stage...");
        }
      },
    });
    return invocation.exitCode;
  } finally {
    polling = false;
    await poller.catch(() => {});
    const finalDetail = await readProgressDetail(progressPath);
    if (finalDetail && mainEnteredAt == null && launchStartedAt != null) {
      mainEnteredAt = clockNow();
      telemetry.mainEnteredAt = mainEnteredAt;
      mainEntryPrefix = `Runner JAR check: ${formatSeconds(runnerJarCheckMs)}; CheerpJ entry-point handoff: ${formatSeconds(mainEnteredAt - launchStartedAt)}; ${summarizeFetchBucket("Pre-main runtime resources", telemetry.preMain)}; `;
      publish(`${mainEntryPrefix}${finalDetail}`);
    } else if (finalDetail) {
      publish(`${mainEntryPrefix}${finalDetail}`);
    }
    if (invocation) {
      const handoff = mainEnteredAt == null
        ? "ExerciseRunner.main() did not publish a progress marker before cheerpjRunMain() returned."
        : `Pre-main CheerpJ handoff: ${formatSeconds(mainEnteredAt - launchStartedAt)}.`;
      const fetchSummary = [
        summarizeFetchBucket("Before ExerciseRunner.main()", telemetry.preMain),
        summarizeFetchBucket("After ExerciseRunner.main()", telemetry.duringMain),
      ].join(" | ");
      reportProgress(
        requestId,
        phase,
        `Runner invocation returned. Worker-side runner-JAR check: ${formatSeconds(invocation.runnerJarMs)}; cheerpjRunMain total: ${formatSeconds(invocation.cheerpjRunMainMs)}; ${handoff} ${fetchSummary}`,
      );
    }
  }
}
function errorPayload(error, phase = "worker") {
  return {
    type: "ERROR",
    phase,
    message: error && error.message ? error.message : String(error),
    stack:
      error && error.stack
        ? String(error.stack).split("\n").slice(0, 8).join("\n")
        : "",
  };
}

async function initialize(requestId, options = {}) {
  if (options.newVer === true && !initialization && !runtimeReady)
    moduleNewVer = true;
  if (runtimeReady) {
    self.postMessage({ type: "READY", requestId, javaVersion: 21 });
    return;
  }
  if (!initialization) {
    initialization = (async () => {
      let currentDetail = "Preparing the CheerpJ Java 21 runtime...";
      let stageStartedAt = Date.now();
      let lastElapsedSecond = 0;
      const updateDetail = (detail) => {
        currentDetail = detail;
        stageStartedAt = Date.now();
        lastElapsedSecond = 0;
        status(requestId, "INITIALIZING", detail);
      };
      const ticker = setInterval(() => {
        const elapsedSecond = Math.floor((Date.now() - stageStartedAt) / 1000);
        if (elapsedSecond > lastElapsedSecond && elapsedSecond > 0) {
          lastElapsedSecond = elapsedSecond;
          status(requestId, "INITIALIZING", `${currentDetail} (${elapsedSecond}s)`);
        }
      }, 1000);

      try {
        if (moduleNewVer) {
          updateDetail("App version changed: clearing the old CheerpJ runtime cache before refreshing it...");
          await resetCheerpCache();
        }
        updateDetail("Loading the CheerpJ 5.0 loader script...");
        await ensureLoader();
        if (typeof cheerpjInit !== "function") {
          throw new Error(
            "The CheerpJ 5.0 loader did not expose cheerpjInit inside the worker.",
          );
        }
        const initOptions = { version: 21, status: "none" };
        // CheerpJ 5.0's WasmGC engine is experimental. Keep the stable engine as
        // the default, but allow an explicit opt-in for browser/performance tests.
        if (ENABLE_EXPERIMENTAL_WASM_GC) initOptions.wasmGC = true;
        updateDetail("Initializing CheerpJ Java 21 and loading the required runtime/JDK modules...");
        await cheerpjInit(initOptions);
        updateDetail("Checking that CheerpJ's Java execution and virtual-filesystem APIs are available...");
        if (
          typeof cheerpjRunMain !== "function" ||
          typeof cheerpOSAddStringFile !== "function" ||
          typeof cjFileBlob !== "function"
        ) {
          throw new Error(
            "CheerpJ initialized, but one or more required runtime APIs are unavailable.",
          );
        }
        // Stage the runner JAR during startup instead of on the first Run.
        await ensureRunnerJar((detail) => updateDetail(detail));
        runtimeReady = true;
        updateDetail("Java 21 runtime and ExerciseRunner.jar are ready; scheduling the compiler warm-up...");
      } finally {
        clearInterval(ticker);
      }
    })().catch((error) => {
      initialization = null;
      throw error;
    });
  } else {
    status(requestId, "INITIALIZING", "Waiting for the shared CheerpJ Java 21 runtime initialization to finish...");
  }
  await initialization;
  self.postMessage({ type: "READY", requestId, javaVersion: 21 });
  scheduleWarmUp();
}

/*
 * CheerpJ loads the JDK compiler/runtime modules lazily on first use, which is
 * what makes the first Run slow. Compile and run a trivial class once right
 * after startup so those modules are loaded before the student needs them.
 * It uses the same work queue, so a real request that arrives meanwhile simply
 * runs next, on top of the modules the warm-up has already loaded.
 */
function scheduleWarmUp() {
  if (warmUpScheduled) return;
  warmUpScheduled = true;
  warmUpInProgress = true;
  warmUpProgressDetail = "Starting the one-time Java compiler warm-up before learner code...";
  workQueue = workQueue
    .then(warmUp)
    .catch(() => {})
    .finally(() => {
      warmUpInProgress = false;
      warmUpRequestId = null;
      warmUpProgressDetail = "Java compiler warm-up finished.";
    });
}

async function warmUp() {
  const unique = "java_warmup";
  const sourcesPath = `/str/${unique}_sources.json`;
  const configPath = `/str/${unique}_config.json`;
  const basePath = `/files/acs-java/${unique}`;
  const classesPath = `${basePath}/classes`;
  const compileResultPath = `${basePath}/compile-result.json`;
  const runResultPath = `${basePath}/result.json`;
  try {
    warmUpProgressDetail = "Warm-up: staging a tiny Java source file and configuration...";
    cheerpOSAddStringFile(
      sourcesPath,
      JSON.stringify({
        sources: [
          {
            name: "Warmup.java",
            code: "public class Warmup { public static void main(String[] args) { System.out.println(args.length); } }",
          },
        ],
      }),
    );
    cheerpOSAddStringFile(
      configPath,
      JSON.stringify({ mainClass: "Warmup", stdin: "", checks: [] }),
    );
    await runExerciseRunnerWithProgress(
      null,
      "COMPILING",
      "Warm-up: starting javac so the JDK compiler modules are ready before the first learner build...",
      `${compileResultPath}.progress`,
      "compile",
      sourcesPath,
      configPath,
      compileResultPath,
      classesPath,
    );
    await runExerciseRunnerWithProgress(
      null,
      "COMPILING",
      "Warm-up: loading the generated class and exercising the Java runtime...",
      `${runResultPath}.progress`,
      "run",
      "-",
      configPath,
      runResultPath,
      classesPath,
    );
  } catch (error) {
    console.warn("Java warm-up skipped:", error);
  } finally {
    warmUpProgressDetail = "Warm-up finished; removing temporary warm-up source, result, and class files...";
    if (warmUpRequestId)
      status(warmUpRequestId, "COMPILING", warmUpProgressDetail);
    await cleanupRequestFiles(
      configPath,
      `${basePath}/cleanup-result.json`,
      classesPath,
    );
    safeRemoveStringFile(sourcesPath);
    safeRemoveStringFile(configPath);
    warmUpProgressDetail = "Java compiler warm-up complete; your request is next...";
    if (warmUpRequestId)
      status(warmUpRequestId, "COMPILING", warmUpProgressDetail);
  }
}

async function readJson(path) {
  const blob = await cjFileBlob(path);
  const text = await blob.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `The Java runner returned invalid JSON at ${path}: ${error.message}`,
    );
  }
}

function safeRemoveStringFile(path) {
  try {
    if (typeof cheerpOSRemoveStringFile === "function")
      cheerpOSRemoveStringFile(path);
  } catch (_) {
    // /str/ is transient and disappears with the worker; cleanup is best effort.
  }
}

async function cleanupRequestFiles(configPath, resultPath, classesPath) {
  try {
    await runExerciseRunner(
      "cleanup",
      "-",
      configPath,
      resultPath,
      classesPath,
    );
  } catch (_) {
    // Cleanup is best-effort; it must not hide the result of the exercise.
  }
}

function compilationIdentity(sources, config) {
  // stdin, automatic checks and runtime timeouts do not affect javac output.
  // Source names/content and the main-class/source-file settings do.
  const fingerprint = JSON.stringify({
    sources,
    sourceFile: config?.sourceFile || "Main.java",
    mainClass: config?.mainClass || "Main",
  });
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < fingerprint.length; index++) {
    const code = fingerprint.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ (code + index), 0x85ebca6b);
  }
  const key = `${(first >>> 0).toString(16).padStart(8, "0")}${(
    second >>> 0
  ).toString(16).padStart(8, "0")}`;
  return { key, fingerprint };
}

function getCachedCompilation(key, fingerprint) {
  const entry = compiledBuildCache.get(key);
  if (!entry || entry.fingerprint !== fingerprint) return null;
  // Map insertion order doubles as a small LRU list.
  compiledBuildCache.delete(key);
  compiledBuildCache.set(key, entry);
  return entry;
}

function rememberCompilation(key, fingerprint, classesPath, compilation) {
  compiledBuildCache.delete(key);
  compiledBuildCache.set(key, { fingerprint, classesPath, compilation });
  const evicted = [];
  while (compiledBuildCache.size > COMPILED_CACHE_MAX_ENTRIES) {
    const oldestKey = compiledBuildCache.keys().next().value;
    const oldest = compiledBuildCache.get(oldestKey);
    compiledBuildCache.delete(oldestKey);
    if (oldest) evicted.push(oldest);
  }
  return evicted;
}

async function cleanupCachedBuild(entry, configPath, resultPath) {
  try {
    await runExerciseRunner(
      "cleanup",
      "-",
      configPath,
      resultPath,
      entry.classesPath,
    );
  } catch (error) {
    console.warn("Could not evict a cached Java compilation:", error);
  }
}

async function execute(message) {
  const { requestId, operation, sources, config } = message;
  if (!runtimeReady) await initialize(requestId);

  const unique = `java_${String(requestId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const sourcesPath = `/str/${unique}_sources.json`;
  const configPath = `/str/${unique}_config.json`;
  const basePath = `/files/acs-java/${unique}`;
  const identity = compilationIdentity(sources, config);
  const existingEntry = compiledBuildCache.get(identity.key);
  const cachedBuild = getCachedCompilation(identity.key, identity.fingerprint);
  // A hash collision must never cause stale code to execute. Every cache miss
  // gets a fresh output directory, so even an evicted/failed cleanup cannot
  // leave old .class files beside a later compilation.
  const hashCollision = Boolean(
    existingEntry && existingEntry.fingerprint !== identity.fingerprint,
  );
  const classesPath = cachedBuild
    ? cachedBuild.classesPath
    : `/files/acs-java/compiled/${identity.key}-${unique}/classes`;
  const compileResultPath = `${basePath}/compile-result.json`;
  const resultPath = `${basePath}/result.json`;
  const compileProgressPath = `${compileResultPath}.progress`;
  const executionProgressPath = `${resultPath}.progress`;
  const evictedBuilds = [];
  let classesAreCached = Boolean(cachedBuild);

  try {
    status(
      requestId,
      "COMPILING",
      `Preparing ${sources.length} Java source file(s) and the exercise configuration in CheerpJ's virtual filesystem...`,
    );
    cheerpOSAddStringFile(sourcesPath, JSON.stringify({ sources }));
    cheerpOSAddStringFile(configPath, JSON.stringify(config));
    status(requestId, "COMPILING", "Source and configuration files staged; checking the in-memory compiled-build cache...");

    let compilation;
    if (cachedBuild) {
      status(
        requestId,
        "COMPILING",
        "Compilation cache hit: reusing the already-generated .class files; javac will be skipped...",
      );
      compilation = cachedBuild.compilation;
    } else {
      const compileExit = await runExerciseRunnerWithProgress(
        requestId,
        "COMPILING",
        "Preparing the Java runner; measuring the JAR check separately from CheerpJ's Java-entry-point launch...",
        compileProgressPath,
        "compile",
        sourcesPath,
        configPath,
        compileResultPath,
        classesPath,
      );
      status(requestId, "COMPILING", "javac returned; reading its result file and compiler diagnostics...");
      compilation = await readJson(compileResultPath);
      if (
        !compilation.compiled ||
        compilation.success !== true ||
        compileExit !== 0
      ) {
        self.postMessage({ type: "RESULT", requestId, result: compilation });
        return;
      }

      // Cache only a successful build. The classes directory is intentionally
      // outside this request's temporary folder so cleanup cannot remove it.
      if (!hashCollision) {
        status(requestId, "COMPILING", "Compilation succeeded; placing the generated classes in the worker's five-entry LRU cache...");
        classesAreCached = true;
        evictedBuilds.push(
          ...rememberCompilation(
            identity.key,
            identity.fingerprint,
            classesPath,
            compilation,
          ),
        );
      }
    }

    const command = operation === "check" ? "check" : "run";
    status(
      requestId,
      command === "check" ? "TESTING" : "RUNNING",
      command === "check"
        ? "Running the automatic checks…"
        : "Running your Java program…",
    );
    const executionExit = await runExerciseRunnerWithProgress(
      requestId,
      command === "check" ? "TESTING" : "RUNNING",
      command === "check"
        ? "Starting the automatic-check runner and opening the compiled classes..."
        : "Starting the program runner and opening the compiled classes...",
      executionProgressPath,
      command,
      "-",
      configPath,
      resultPath,
      classesPath,
    );
    status(
      requestId,
      command === "check" ? "TESTING" : "RUNNING",
      "Java runner finished; reading captured output and test results...",
    );
    const result = await readJson(resultPath);
    result.compiled = true;
    result.compileDiagnostics = compilation.diagnostics || [];
    if (result.exitCode === undefined) result.exitCode = executionExit;
    if (executionExit !== 0 && result.success === true) result.success = false;
    self.postMessage({ type: "RESULT", requestId, result });
  } finally {
    // Always remove per-request JSON and progress sidecars. The successful
    // compiled classes live outside this folder when cached, so this cleanup
    // does not touch them.
    await cleanupRequestFiles(
      configPath,
      `${basePath}/cleanup-request-result.json`,
      `${basePath}/classes`,
    );
    // A cache miss that was not retained (for example, a hash collision or a
    // failed build) has a separate disposable class-output directory.
    if (!classesAreCached) {
      await cleanupRequestFiles(
        configPath,
        `${basePath}/cleanup-classes-result.json`,
        classesPath,
      );
    }
    for (let index = 0; index < evictedBuilds.length; index++) {
      await cleanupCachedBuild(
        evictedBuilds[index],
        configPath,
        `${basePath}/evicted-${index}.json`,
      );
    }
    safeRemoveStringFile(sourcesPath);
    safeRemoveStringFile(configPath);
  }
}

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type === "INIT") {
    initialize(message.requestId, { newVer: message.newVer === true }).catch(
      (error) => {
        self.postMessage({
          type: "INIT_ERROR",
          requestId: message.requestId,
          ...errorPayload(error, "initialization"),
        });
      },
    );
    return;
  }
  if (message.type === "EXECUTE") {
    if (warmUpInProgress) {
      warmUpRequestId = message.requestId;
      status(
        message.requestId,
        "COMPILING",
        warmUpProgressDetail || "Finishing the one-time Java compiler warm-up before compiling your source...",
      );
    }
    workQueue = workQueue
      .then(() => execute(message))
      .catch((error) => {
        self.postMessage({
          type: "REQUEST_ERROR",
          requestId: message.requestId,
          ...errorPayload(error, "execution"),
        });
      });
  }
};
