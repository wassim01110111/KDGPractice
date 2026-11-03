// Keep the PGlite database entirely off the UI thread. This small RPC bridge
// deliberately avoids PGliteWorker's multi-tab wrapper; the app only needs
// query(), exec(), and close().
const worker = new Worker(new URL("./pglite-worker.js", import.meta.url), {
  type: "module",
  name: "acs-pglite-worker",
});

let nextId = 1;
const pending = new Map();
let rejectStartup;

function makeError(data) {
  const error = new Error(data?.message || "PGlite worker request failed");
  if (data?.name) error.name = data.name;
  for (const key of ["code", "detail", "hint", "position", "where", "constraint"]) {
    if (data?.[key] !== undefined) error[key] = data[key];
  }
  return error;
}

const startup = new Promise((resolve, reject) => {
  rejectStartup = reject;
  worker.addEventListener("message", function onMessage(event) {
    const message = event.data || {};
    if (message.type === "ready") {
      worker.removeEventListener("message", onMessage);
      resolve();
      return;
    }
    if (message.type === "startup-error") {
      worker.removeEventListener("message", onMessage);
      reject(makeError(message.error));
    }
  });
});

worker.addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.type !== "result") return;
  const task = pending.get(message.id);
  if (!task) return;
  pending.delete(message.id);
  if (message.error) task.reject(makeError(message.error));
  else task.resolve(message.value);
});

worker.addEventListener("error", (event) => {
  const error = new Error(event.message || "PGlite worker failed to load");
  rejectStartup?.(error);
  for (const task of pending.values()) task.reject(error);
  pending.clear();
});

worker.addEventListener("messageerror", () => {
  const error = new Error("Could not read a message from the PGlite worker");
  rejectStartup?.(error);
  for (const task of pending.values()) task.reject(error);
  pending.clear();
});

function call(method, args) {
  return startup.then(() => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    try {
      worker.postMessage({ type: "call", id, method, args });
    } catch (error) {
      pending.delete(id);
      reject(error);
    }
  }));
}

window.PGlite = {
  query: (...args) => call("query", args),
  exec: (...args) => call("exec", args),
  close: (...args) => call("close", args),
};
window.pgliteReady = startup.then(() => window.PGlite);
window.pgliteReady.catch((error) => {
  console.error("PGlite worker failed to start", error);
});
