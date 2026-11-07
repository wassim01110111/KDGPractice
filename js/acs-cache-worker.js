/*
 * ACS Practice offline fallback.
 * Network-first for small, same-origin app/content files; Cache Storage is a
 * bounded fallback, never the primary source. This is intentionally not a
 * general-purpose offline/PWA cache.
 */
"use strict";

const CACHE_NAME = "acs-practice-runtime-v2";
const MAX_CACHE_ENTRIES = 60;
const MAX_CACHE_BYTES = 20 * 1024 * 1024;
const MAX_RESOURCE_BYTES = 3 * 1024 * 1024;
const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000;
const CACHE_TIME_HEADER = "X-ACS-Cache-Time";
const CACHE_SIZE_HEADER = "X-ACS-Cache-Size";
let cacheIndex = null;
let cacheIndexPromise = null;
let cacheWriteQueue = Promise.resolve();

function cacheableRequest(request, url) {
  if (request.method !== "GET" || request.headers.has("Range") || url.origin !== self.location.origin) return false;
  const scopePath = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(scopePath)) return false;
  if (url.searchParams.has("__acs_nocache") || url.searchParams.has("_version_check") || url.searchParams.has("_acs_retry")) return false;
  if (/\/content\/version\.json$/i.test(url.pathname)) return false;
  if (url.pathname.includes("/api/") || url.pathname.includes("/auth/")) return false;
  const pathname = url.pathname;
  const contentAsset = pathname.includes("/content/");
  const extension = pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (["json", "md", "html"].includes(extension) && !contentAsset) return false;
  if (["svg", "png", "jpg", "jpeg", "webp", "avif", "gif", "woff", "woff2"].includes(extension) && !contentAsset && !pathname.includes("/assets/")) return false;
  return ["js", "css", "json", "md", "html", "svg", "png", "jpg", "jpeg", "webp", "avif", "gif", "woff", "woff2"].includes(extension);
}

async function openRuntimeCache() {
  if (!self.caches) return null;
  try {
    return await self.caches.open(CACHE_NAME);
  } catch (_) {
    return null;
  }
}

async function loadCacheIndex(cache) {
  const rebuild = async (requests) => {
    const next = new Map();
    for (const request of requests) {
      const response = await cache.match(request);
      if (!response) continue;
      const cachedAt = Number(response.headers.get(CACHE_TIME_HEADER)) || 0;
      const size = Number(response.headers.get(CACHE_SIZE_HEADER)) || 0;
      if (!cachedAt || Date.now() - cachedAt > MAX_CACHE_AGE) {
        await cache.delete(request);
        continue;
      }
      next.set(request.url, { cachedAt, size });
    }
    return next;
  };
  if (!cacheIndex) {
    if (!cacheIndexPromise) {
      cacheIndexPromise = cache.keys().then(rebuild).then((index) => {
        cacheIndex = index;
        return index;
      }).finally(() => { cacheIndexPromise = null; });
    }
    await cacheIndexPromise;
  }
  // Detect page-triggered cache clearing without reading every cached body
  // before every write. The full index is rebuilt only when entry counts differ.
  const keys = await cache.keys();
  if (keys.length !== cacheIndex.size) cacheIndex = await rebuild(keys);
  return cacheIndex;
}

async function pruneCache(cache, incomingBytes = 0, incomingUrl = "") {
  try {
    const index = await loadCacheIndex(cache);
    let totalBytes = 0;
    for (const item of index.values()) totalBytes += item.size;
    if (incomingUrl && index.has(incomingUrl)) {
      totalBytes -= index.get(incomingUrl).size;
      index.delete(incomingUrl);
    }
    for (const [url, item] of [...index]) {
      if (!item.cachedAt || Date.now() - item.cachedAt > MAX_CACHE_AGE) {
        await cache.delete(url);
        index.delete(url);
        totalBytes -= item.size;
      }
    }
    while (index.size >= MAX_CACHE_ENTRIES || totalBytes + incomingBytes > MAX_CACHE_BYTES) {
      let oldestUrl = null;
      let oldestTime = Infinity;
      for (const [url, item] of index) {
        if (item.cachedAt < oldestTime) {
          oldestTime = item.cachedAt;
          oldestUrl = url;
        }
      }
      if (oldestUrl == null) break;
      const oldest = index.get(oldestUrl);
      await cache.delete(oldestUrl);
      index.delete(oldestUrl);
      totalBytes -= oldest.size;
    }
  } catch (_) {
    // Storage pressure/private browsing: caching is optional; network still works.
  }
}

// Count the decoded response stream with a hard ceiling. Content-Length is
// frequently absent for compressed/chunked Markdown and HTML responses, so
// using it as a prerequisite silently prevented those files from being cached.
async function readBoundedCacheBody(response, maxBytes) {
  const declaredText = response.headers.get("Content-Length");
  const declaredSize = declaredText == null ? null : Number(declaredText);
  if (Number.isFinite(declaredSize) && declaredSize > maxBytes) return null;
  if (!response.body || typeof response.body.getReader !== "function") return null;

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        try { await reader.cancel(); } catch (_) { /* clone only */ }
        return null;
      }
      chunks.push(value);
    }
  } catch (_) {
    try { await reader.cancel(); } catch (_) { /* already closed */ }
    return null;
  } finally {
    try { reader.releaseLock(); } catch (_) { /* already released */ }
  }
  if (size <= 0) return null;
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { bytes, size };
}

async function storeResponse(cache, request, response) {
  const write = async () => {
    if (!response || response.status !== 200 || response.type === "opaque") return;
    const directives = (response.headers.get("Cache-Control") || "").toLowerCase();
    if (directives.includes("no-store") || directives.includes("private")) return;
    if ((response.headers.get("Vary") || "").trim() === "*") return;

    const bounded = await readBoundedCacheBody(response, MAX_RESOURCE_BYTES);
    if (!bounded) return;
    const { bytes, size } = bounded;
    const headers = new Headers(response.headers);
    headers.delete("Content-Length");
    headers.delete("Content-Encoding");
    headers.delete("Transfer-Encoding");
    headers.set(CACHE_TIME_HEADER, String(Date.now()));
    headers.set(CACHE_SIZE_HEADER, String(size));
    const key = request.url;
    await pruneCache(cache, size, key);
    try {
      await cache.put(
        request,
        new Response(bytes, {
          status: response.status,
          statusText: response.statusText,
          headers,
        }),
      );
      const index = await loadCacheIndex(cache);
      index.set(key, { cachedAt: Date.now(), size });
    } catch (_) {
      // Cache quota errors must never fail the original request.
    }
  };
  const queued = cacheWriteQueue.then(write, write);
  cacheWriteQueue = queued.catch(() => {});
  return queued;
}

async function getFreshCached(cache, request) {
  try {
    const cached = await cache.match(request);
    if (!cached) return null;
    const cachedAt = Number(cached.headers.get(CACHE_TIME_HEADER)) || 0;
    if (!cachedAt || Date.now() - cachedAt > MAX_CACHE_AGE) {
      await cache.delete(request);
      return null;
    }
    return cached;
  } catch (_) {
    return null;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Remove only older ACS cache generations; never touch unrelated site caches.
    const names = await self.caches.keys().catch(() => []);
    await Promise.all(names
      .filter((name) => name.startsWith("acs-practice-runtime-") && name !== CACHE_NAME)
      .map((name) => self.caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }
  if (!cacheableRequest(request, url)) return;

  const cachePromise = openRuntimeCache();
  const networkPromise = fetch(request.clone());
  // Register the cache write while the FetchEvent is still being dispatched;
  // the response itself can be delivered without waiting for disk persistence.
  const cacheWriteLifetime = Promise.all([cachePromise, networkPromise])
    .then(([cache, response]) => {
      if (cache && response.ok) return storeResponse(cache, request, response.clone());
      return undefined;
    })
    .catch(() => undefined);
  event.waitUntil(cacheWriteLifetime);

  event.respondWith((async () => {
    // Always try the ordinary network request first. Don't await Cache Storage
    // at all on the successful path; cache opening is needed only after failure.
    try {
      const response = await networkPromise;
      if (response.ok || response.status < 400) return response;
      const cache = await cachePromise;
      if (cache) {
        const cached = await getFreshCached(cache, request);
        if (cached) return cached;
      }
      return response;
    } catch (networkError) {
      const cache = await cachePromise;
      if (cache) {
        const cached = await getFreshCached(cache, request);
        if (cached) return cached;
      }
      // No usable cached copy: retry a normal network load once. This also
      // handles transient connection resets without manufacturing a response.
      try {
        return await fetch(request.clone(), { cache: "no-store" });
      } catch (_) {
        throw networkError;
      }
    }
  })());
});
