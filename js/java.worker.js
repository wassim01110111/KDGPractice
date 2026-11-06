/* Classic worker: CheerpJ must be loaded here, never on the page thread. */
"use strict";

const LOADER_URL = "https://cjrtnc.leaningtech.com/5.0/loader.js";
const RUNNER_CLASS = "learning.java.ExerciseRunner";
const RUNNER_JAR = "/KDGPractice/content/java/ExerciseRunner.jar";
let runtimeReady = false;
let initialization = null;
let workQueue = Promise.resolve();

/*
 * ExerciseRunner is infrastructure, not the student's Main class.
 * It must be packaged as learning/java/ExerciseRunner.class inside
 * /app/content/java/ExerciseRunner.jar.
 */
async function runExerciseRunner(...args) {
  try {
    // Fail early with a useful message if the deployed JAR is not present.
    await cjFileBlob(RUNNER_JAR);
  } catch (error) {
    throw new Error(
      `Java exercise runner JAR is missing or unreadable at ${RUNNER_JAR}. ` +
        `Deploy ExerciseRunner.jar there; it must contain ` +
        `learning/java/ExerciseRunner.class. Original error: ${error?.message || error}`,
    );
  }

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

try {
  importScripts(LOADER_URL);
} catch (error) {
  self.postMessage({ type: "BOOT_ERROR", ...errorPayload(error, "loader") });
}

async function initialize(requestId) {
  if (runtimeReady) {
    self.postMessage({ type: "READY", requestId, javaVersion: 21 });
    return;
  }
  if (!initialization) {
    initialization = (async () => {
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
    initialize(message.requestId).catch((error) => {
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
