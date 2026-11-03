// PGlite runs here, never on the page's main/UI thread.
import { PGlite } from "https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.2.17/dist/index.js";

let db;
let queue = Promise.resolve();

function serializeError(error) {
  const out = {
    name: error?.name || "Error",
    message: error?.message || String(error),
  };
  for (const key of ["code", "detail", "hint", "position", "where", "constraint"]) {
    if (error?.[key] !== undefined) out[key] = error[key];
  }
  return out;
}

async function initialize() {
  db = new PGlite();
  await db.waitReady;
  self.postMessage({ type: "ready" });
}

self.addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.type !== "call") return;

  const run = async () => {
    try {
      if (!db) throw new Error("PGlite has not finished initializing");
      const method = message.method;
      if (!["query", "exec", "close"].includes(method)) {
        throw new Error(`Unsupported PGlite method: ${method}`);
      }
      const value = await db[method](...(message.args || []));
      self.postMessage({ type: "result", id: message.id, value });
      if (method === "close") db = null;
    } catch (error) {
      self.postMessage({ type: "result", id: message.id, error: serializeError(error) });
    }
  };

  queue = queue.then(run, run);
});

initialize().catch((error) => {
  self.postMessage({ type: "startup-error", error: serializeError(error) });
});
