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

  const source = document.currentScript?.src || new URL("app.js", document.baseURI).href;
  const base = new URL(".", source);
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
      script.src = new URL(name, base).href;
      script.async = false;
      script.dataset.appSection = name;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${name}`));
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
