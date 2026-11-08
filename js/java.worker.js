/* Classic worker: CheerpJ must be loaded here, never on the page thread. */
"use strict";

const JAVA_CACHE_VERSION = new URL(self.location.href).searchParams.get("__acs_java_version");
const LOADER_URL_OBJECT = new URL("https://cjrtnc.leaningtech.com/5.0/loader.js");
if (JAVA_CACHE_VERSION)
  LOADER_URL_OBJECT.searchParams.set("__acs_java_version", JAVA_CACHE_VERSION);
const LOADER_URL = LOADER_URL_OBJECT.href;
const RUNNER_CLASS = "learning.java.ExerciseRunner";

// Resolve the JAR relative to this classic worker. This preserves the
// GitHub Pages repository prefix (for example /KDGPractice/) automatically.
const RUNNER_JAR_URL_OBJECT = new URL(
  "./content/java/ExerciseRunner.jar",
  self.location.href,
);
if (JAVA_CACHE_VERSION)
  RUNNER_JAR_URL_OBJECT.searchParams.set("__acs_java_version", JAVA_CACHE_VERSION);
const RUNNER_JAR_URL = RUNNER_JAR_URL_OBJECT.href;

// Stage the downloaded JAR in CheerpJ's Java-readable /str filesystem.
const RUNNER_JAR = "/str/ExerciseRunner.jar";
let runnerJarReady = null;
let runtimeReady = false;
let moduleNewVer = false;
let warmUpScheduled = false;
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
const CHEERPJ_CACHE_NAME = "acs-cheerpj-runtime";
const CHEERPJ_ORIGIN = LOADER_URL_OBJECT.origin;
const STATUS_HEADER = "x-acs-status";
let cheerpCachePromise = null;
const nativeFetch = self.fetch.bind(self);

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
  if (cache && !moduleNewVer) {
    try {
      const hit = await cache.match(key);
      if (hit) return responseFromCache(hit);
    } catch (_) {
      /* fall through to the network */
    }
  }

  const response = await nativeFetch(
    request,
    moduleNewVer ? { cache: "reload" } : undefined,
  );
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
async function loadRunnerJarBytes() {
  let cache = null;
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
        const cached = new Uint8Array(await hit.arrayBuffer());
        if (isJar(cached)) return cached;
      }
    } catch (_) {
      /* fall through to the network */
    }
  }
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
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (isJar(bytes) && cache) {
    try {
      await cache.put(RUNNER_JAR_URL, new Response(buffer.slice(0)));
    } catch (_) {
      /* caching is best effort */
    }
  }
  return bytes;
}

async function ensureRunnerJar() {
  if (!runnerJarReady) {
    runnerJarReady = (async () => {
      const bytes = await loadRunnerJarBytes();
      if (!isJar(bytes)) {
        throw new Error(`The response from ${RUNNER_JAR_URL} is not a valid JAR/ZIP file.`);
      }

      cheerpOSAddStringFile(RUNNER_JAR, bytes);
      const staged = await cjFileBlob(RUNNER_JAR);
      if (!staged || staged.size === 0) {
        throw new Error(`ExerciseRunner.jar could not be staged at ${RUNNER_JAR}.`);
      }
    })().catch((error) => {
      runnerJarReady = null;
      throw error;
    });
  }
  return runnerJarReady;
}

async function runExerciseRunner(...args) {
  await ensureRunnerJar();

  try {
    return await cheerpjRunMain(RUNNER_CLASS, RUNNER_JAR, ...args);
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
  }
}

function status(requestId, value, detail = "") {
  self.postMessage({ type: "STATUS", requestId, status: value, detail });
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
      if (moduleNewVer) await resetCheerpCache();
      await ensureLoader();
      if (typeof cheerpjInit !== "function") {
        throw new Error(
          "The CheerpJ 5.0 loader did not expose cheerpjInit inside the worker.",
        );
      }
      await cheerpjInit({ version: 21, status: "none" });
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
      await ensureRunnerJar();
      runtimeReady = true;
    })().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  status(
    requestId,
    "INITIALIZING",
    "Starting the Java 21 runtime for the first time…",
  );
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
  workQueue = workQueue.then(warmUp).catch(() => {});
}

async function warmUp() {
  const unique = "java_warmup";
  const sourcesPath = `/str/${unique}_sources.json`;
  const configPath = `/str/${unique}_config.json`;
  const basePath = `/files/acs-java/${unique}`;
  const classesPath = `${basePath}/classes`;
  try {
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
    await runExerciseRunner("compile", sourcesPath, configPath, `${basePath}/compile-result.json`, classesPath);
    await runExerciseRunner("run", "-", configPath, `${basePath}/result.json`, classesPath);
  } catch (error) {
    console.warn("Java warm-up skipped:", error);
  } finally {
    await cleanupRequestFiles(configPath, `${basePath}/cleanup-result.json`, classesPath);
    safeRemoveStringFile(sourcesPath);
    safeRemoveStringFile(configPath);
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

async function execute(message) {
  const { requestId, operation, sources, config } = message;
  if (!runtimeReady) await initialize(requestId);

  const unique = `java_${String(requestId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const sourcesPath = `/str/${unique}_sources.json`;
  const configPath = `/str/${unique}_config.json`;
  const basePath = `/files/acs-java/${unique}`;
  const classesPath = `${basePath}/classes`;
  const compileResultPath = `${basePath}/compile-result.json`;
  const resultPath = `${basePath}/result.json`;

  try {
    cheerpOSAddStringFile(sourcesPath, JSON.stringify({ sources }));
    cheerpOSAddStringFile(configPath, JSON.stringify(config));

    status(requestId, "COMPILING", "Compiling your Java source code…");
    const compileExit = await runExerciseRunner(
      "compile",
      sourcesPath,
      configPath,
      compileResultPath,
      classesPath,
    );
    const compilation = await readJson(compileResultPath);
    if (
      !compilation.compiled ||
      compilation.success !== true ||
      compileExit !== 0
    ) {
      self.postMessage({ type: "RESULT", requestId, result: compilation });
      return;
    }

    const command = operation === "check" ? "check" : "run";
    status(
      requestId,
      command === "check" ? "TESTING" : "RUNNING",
      command === "check"
        ? "Running the automatic checks…"
        : "Running your Java program…",
    );
    const executionExit = await runExerciseRunner(
      command,
      "-",
      configPath,
      resultPath,
      classesPath,
    );
    const result = await readJson(resultPath);
    result.compiled = true;
    result.compileDiagnostics = compilation.diagnostics || [];
    if (result.exitCode === undefined) result.exitCode = executionExit;
    if (executionExit !== 0 && result.success === true) result.success = false;
    self.postMessage({ type: "RESULT", requestId, result });
  } finally {
    await cleanupRequestFiles(
      configPath,
      `${basePath}/cleanup-result.json`,
      classesPath,
    );
    safeRemoveStringFile(sourcesPath);
    safeRemoveStringFile(configPath);
  }
}

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type === "INIT") {
    initialize(message.requestId, { newVer: message.newVer === true }).catch((error) => {
      self.postMessage({
        type: "INIT_ERROR",
        requestId: message.requestId,
        ...errorPayload(error, "initialization"),
      });
    });
    return;
  }
  if (message.type === "EXECUTE") {
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
