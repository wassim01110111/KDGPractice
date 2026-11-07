/*
 * ACS Practice app loader.
 *
 * Keep these as ordered classic scripts (not ES modules): the existing app
 * shares a set of top-level declarations across its feature sections. This
 * loader keeps that execution model while making each section independently
 * navigable and maintainable.
 */
(() => {
  if (window.__ACS_PRACTICE_APP_LOADING__) return;
  window.__ACS_PRACTICE_APP_LOADING__ = true;

  const loaderScript = document.currentScript;
  const source = loaderScript?.src || new URL("app.js", document.baseURI).href;
  const loaderNonce = loaderScript?.nonce || "";
  const base = new URL(".", source);
  const forceCacheBust = new URL(location.href).searchParams.get("__acs_nocache");

  // Small, bounded Cache Storage helper shared with the app's content loader.
  // Network is always attempted first; cached content is only an offline/error fallback.
  const RUNTIME_CACHE = "acs-practice-runtime-v2";
  const CACHE_MAX_ENTRIES = 60;
  const CACHE_MAX_BYTES = 20 * 1024 * 1024;
  const CACHE_MAX_RESOURCE = 3 * 1024 * 1024;
  const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
  const CACHE_TIME_HEADER = "X-ACS-Cache-Time";
  const CACHE_SIZE_HEADER = "X-ACS-Cache-Size";
  let runtimeCacheIndex = null;
  let runtimeCacheIndexPromise = null;
  let cacheWriteQueue = Promise.resolve();
  const cacheableUrl = (value) => {
    try {
      const url = new URL(value, document.baseURI);
      const extension = url.pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
      const contentAsset = url.pathname.includes("/content/");
      const mediaAsset = ["svg", "png", "jpg", "jpeg", "webp", "avif", "gif", "woff", "woff2"].includes(extension);
      return !forceCacheBust && url.origin === location.origin &&
        url.pathname.startsWith(base.pathname) &&
        !url.searchParams.has("__acs_nocache") &&
        !url.searchParams.has("_version_check") &&
        !url.searchParams.has("_acs_retry") &&
        !/\/content\/version\.json$/i.test(url.pathname) &&
        !url.pathname.includes("/api/") && !url.pathname.includes("/auth/") &&
        (!(["json", "md", "html"].includes(extension)) || contentAsset) &&
        (!mediaAsset || contentAsset || url.pathname.includes("/assets/")) &&
        ["js", "css", "json", "md", "html", "svg", "png", "jpg", "jpeg", "webp", "avif", "gif", "woff", "woff2"].includes(extension);
    } catch (_) { return false; }
  };
  const openRuntimeCache = async () => {
    if (!("caches" in window)) return null;
    try { return await caches.open(RUNTIME_CACHE); } catch (_) { return null; }
  };
  const loadRuntimeCacheIndex = async (cache) => {
    const rebuild = async (requests) => {
      const next = new Map();
      for (const request of requests) {
        const response = await cache.match(request);
        if (!response) continue;
        const cachedAt = Number(response.headers.get(CACHE_TIME_HEADER)) || 0;
        const size = Number(response.headers.get(CACHE_SIZE_HEADER)) || 0;
        if (!cachedAt || Date.now() - cachedAt > CACHE_MAX_AGE) {
          await cache.delete(request);
          continue;
        }
        next.set(request.url, { cachedAt, size });
      }
      return next;
    };
    if (!runtimeCacheIndex) {
      if (!runtimeCacheIndexPromise) {
        runtimeCacheIndexPromise = cache.keys().then(rebuild).then((index) => {
          runtimeCacheIndex = index;
          return index;
        }).finally(() => { runtimeCacheIndexPromise = null; });
      }
      await runtimeCacheIndexPromise;
    }
    // Detect Cache Storage being cleared externally (for example, a forced
    // version update) without rescanning every entry on every write.
    const keys = await cache.keys();
    if (keys.length !== runtimeCacheIndex.size) {
      runtimeCacheIndex = await rebuild(keys);
    }
    return runtimeCacheIndex;
  };
  const pruneRuntimeCache = async (cache, incomingBytes = 0, incomingUrl = "") => {
    try {
      const index = await loadRuntimeCacheIndex(cache);
      let total = 0;
      for (const value of index.values()) total += value.size;
      if (incomingUrl && index.has(incomingUrl)) {
        total -= index.get(incomingUrl).size;
        index.delete(incomingUrl);
      }
      for (const [url, value] of [...index]) {
        if (!value.cachedAt || Date.now() - value.cachedAt > CACHE_MAX_AGE) {
          await cache.delete(url);
          index.delete(url);
          total -= value.size;
        }
      }
      while (index.size >= CACHE_MAX_ENTRIES || total + incomingBytes > CACHE_MAX_BYTES) {
        let oldestUrl = null;
        let oldestTime = Infinity;
        for (const [url, value] of index) {
          if (value.cachedAt < oldestTime) {
            oldestTime = value.cachedAt;
            oldestUrl = url;
          }
        }
        if (oldestUrl == null) break;
        const oldest = index.get(oldestUrl);
        await cache.delete(oldestUrl);
        index.delete(oldestUrl);
        total -= oldest.size;
      }
    } catch (_) { /* Cache storage is optional and may be quota-limited. */ }
  };
  // Measure the decoded response stream rather than trusting Content-Length.
  // Many hosts omit that header for compressed/streamed Markdown responses.
  // Only a bounded number of bytes are retained; oversized resources are
  // skipped without affecting the original network response.
  const readBoundedCacheBody = async (response, maxBytes) => {
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
  };

  const cacheResponse = async (url, response) => {
    const write = async () => {
      if (!cacheableUrl(url) || !response || response.status !== 200 || response.type === "opaque") return;
      const directives = (response.headers.get("Cache-Control") || "").toLowerCase();
      if (directives.includes("no-store") || directives.includes("private") ||
          (response.headers.get("Vary") || "").trim() === "*") return;
      const cache = await openRuntimeCache();
      if (!cache) return;
      const bounded = await readBoundedCacheBody(response, CACHE_MAX_RESOURCE);
      if (!bounded) return;
      const { bytes, size } = bounded;
      const headers = new Headers(response.headers);
      // The cached body is the browser-decoded byte stream. Transfer metadata
      // from the wire response could now be wrong, so remove it before storing.
      headers.delete("Content-Length");
      headers.delete("Content-Encoding");
      headers.delete("Transfer-Encoding");
      headers.set(CACHE_TIME_HEADER, String(Date.now()));
      headers.set(CACHE_SIZE_HEADER, String(size));
      const key = new URL(url, document.baseURI).href;
      await pruneRuntimeCache(cache, size, key);
      try {
        await cache.put(key, new Response(bytes, {
          status: response.status, statusText: response.statusText, headers,
        }));
        const index = await loadRuntimeCacheIndex(cache);
        index.set(key, { cachedAt: Date.now(), size });
      } catch (_) { /* Quota/private-mode errors never affect page loading. */ }
    };
    const queued = cacheWriteQueue.then(write, write);
    cacheWriteQueue = queued.catch(() => {});
    return queued;
  };
  const readCachedResponse = async (url) => {
    if (!cacheableUrl(url)) return null;
    const cache = await openRuntimeCache();
    if (!cache) return null;
    try {
      const cached = await cache.match(url);
      if (!cached) return null;
      const cachedAt = Number(cached.headers.get(CACHE_TIME_HEADER)) || 0;
      if (!cachedAt || Date.now() - cachedAt > CACHE_MAX_AGE) {
        await cache.delete(url);
        return null;
      }
      return cached;
    } catch (_) { return null; }
  };
  const fetchResource = async (url, options = {}) => {
    const requestOptions = { ...options };
    if (forceCacheBust) requestOptions.cache = "reload";
    try {
      const response = await fetch(url, requestOptions);
      if (response.ok) void cacheResponse(url, response.clone());
      else {
        const cached = await readCachedResponse(url);
        if (cached) return cached;
        if (response.status >= 500) {
          try { return await fetch(url, { ...requestOptions, cache: "no-store" }); }
          catch (_) { /* Keep the original HTTP response for the caller. */ }
        }
      }
      return response;
    } catch (networkError) {
      const cached = await readCachedResponse(url);
      if (cached) return cached;
      // Cache Storage may be disabled or empty. Make one final ordinary
      // network attempt before reporting failure to the caller.
      try { return await fetch(url, { ...requestOptions, cache: "no-store" }); }
      catch (_) { throw networkError; }
    }
  };
  window.__ACS_OFFLINE_CACHE__ = Object.freeze({
    cacheResponse, readCachedResponse, fetchResource,
    prime: async (url) => {
      if (!cacheableUrl(url)) return;
      try {
        const response = await fetch(url, { cache: "force-cache", credentials: "same-origin" });
        if (response.ok) await cacheResponse(url, response.clone());
      } catch (_) { /* The ordinary page request remains authoritative. */ }
    },
  });

  // Register only on supported secure origins. The feature is optional: normal
  // network loading and the direct Cache API fallback continue without a worker.
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    const workerUrl = new URL("acs-cache-worker.js", base);
    navigator.serviceWorker.register(workerUrl.href, { scope: base.pathname })
      .catch((error) => console.info("Offline fallback is unavailable in this browser context:", error));
  }

  // Cache the already-loaded app entry and same-origin stylesheets on first visit.
  void window.__ACS_OFFLINE_CACHE__.prime(source);
  document.querySelectorAll('link[rel~="stylesheet"][href]').forEach((link) => {
    try {
      const href = new URL(link.href, document.baseURI);
      if (href.origin === location.origin) void window.__ACS_OFFLINE_CACHE__.prime(href.href);
    } catch (_) { /* Ignore malformed/non-HTTP stylesheet references. */ }
  });
  if (forceCacheBust) {
    window.__ACS_FORCE_CACHE_BUST__ = forceCacheBust;
    document.querySelectorAll('link[rel~="stylesheet"][href]').forEach((link) => {
      try {
        const href = new URL(link.href, document.baseURI);
        if (href.origin === location.origin) {
          href.searchParams.set("__acs_nocache", forceCacheBust);
          link.href = href.href;
        }
      } catch (_) {
        /* Leave non-URL stylesheet references untouched. */
      }
    });
  }
  const modules = [
    "app-state.js",
    "app-data.js",
    "app-rendering.js",
    "app-library.js",
    "app-practice.js",
    "app-progress.js",
    "app-routing.js",
  ];
  const bootstrap = document.createElement("div");
  bootstrap.className = "app-bootstrap-progress";
  bootstrap.setAttribute("role", "status");
  bootstrap.setAttribute("aria-live", "polite");
  const bootstrapLabel = document.createElement("span");
  bootstrapLabel.textContent = "Loading practice workspace…";
  const bootstrapMeter = document.createElement("progress");
  bootstrapMeter.className = "app-bootstrap-meter";
  bootstrapMeter.max = modules.length;
  bootstrapMeter.value = 0;
  bootstrapMeter.setAttribute("aria-label", "Application loading progress");
  bootstrap.append(bootstrapLabel, bootstrapMeter);
  (document.body || document.documentElement).prepend(bootstrap);

  const loadScript = (name) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const scriptUrl = new URL(name, base);
      if (forceCacheBust) scriptUrl.searchParams.set("__acs_nocache", forceCacheBust);
      script.src = scriptUrl.href;
      script.async = false;
      script.dataset.appSection = name;
      script.onload = () => {
        // Native script loading remains the normal path. Cache a copy for a
        // later offline visit without delaying execution of the app section.
        void window.__ACS_OFFLINE_CACHE__.prime(scriptUrl.href);
        resolve();
      };
      script.onerror = async () => {
        // A failed network load may still have a usable cached script. This
        // fallback is attempted only after the ordinary script request failed.
        if (!forceCacheBust) {
          const cached = await readCachedResponse(scriptUrl.href);
          if (cached) {
            try {
              const cachedSource = await cached.text();
              const fallback = document.createElement("script");
              fallback.async = false;
              fallback.dataset.appSection = name;
              fallback.dataset.appSectionSrc = scriptUrl.href;
              const nonce = loaderNonce || document.querySelector("script[nonce]")?.nonce;
              if (nonce) fallback.nonce = nonce;
              fallback.textContent = `${cachedSource}\n//# sourceURL=${scriptUrl.href}`;
              (document.head || document.documentElement).append(fallback);
              resolve();
              return;
            } catch (_) { /* Try the ordinary network path once more below. */ }
          }
        }
        // Last attempt is a normal, cache-bypassing network load. If it also
        // fails, surface the original script-load error to the bootstrap UI.
        const retryUrl = new URL(scriptUrl.href);
        retryUrl.searchParams.set("_acs_retry", String(Date.now()));
        const retry = document.createElement("script");
        retry.async = false;
        retry.dataset.appSection = name;
        retry.src = retryUrl.href;
        retry.onload = resolve;
        retry.onerror = () => reject(new Error(`Could not load ${name} from network or cache`));
        (document.head || document.documentElement).append(retry);
      };
      (document.head || document.documentElement).append(script);
    });

  (async () => {
    try {
      for (const [index, name] of modules.entries()) {
        bootstrapLabel.textContent = `Loading ${name} (${index + 1} of ${modules.length})…`;
        await loadScript(name);
        bootstrapMeter.value = index + 1;
      }
      bootstrap.classList.add("is-complete");
      bootstrapLabel.textContent = "Practice workspace ready";
      bootstrap.remove();
      if (forceCacheBust) {
        const cleanUrl = new URL(location.href);
        cleanUrl.searchParams.delete("__acs_nocache");
        history.replaceState(history.state, "", cleanUrl.href);
      }
    } catch (error) {
      bootstrap.classList.add("has-error");
      bootstrapLabel.textContent = "Application loading failed";
      console.error("ACS Practice failed to load:", error);
      const alert = document.createElement("div");
      alert.className = "app-load-error";
      alert.setAttribute("role", "alert");
      alert.textContent = `The application could not finish loading: ${error.message}. Check that app.js and all app-*.js files are in the same directory.`;
      (document.querySelector("main") || document.body || document.documentElement).prepend(alert);
      window.dispatchEvent(new CustomEvent("acs:app-load-error", { detail: error }));
    }
  })();
})();
