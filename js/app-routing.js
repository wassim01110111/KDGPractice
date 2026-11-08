"use strict";

const ROUTE_OUT_MS = 140,
  ROUTE_IN_MS = 360,
  ROUTE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// Check content/version.json at most once per hour, independently of navigation.
// The first successful fetch establishes this page's version for its lifetime.
// All version-check state stays in memory and is reset by a full page reload.
const SITE_VERSION_CHECK_INTERVAL = 60 * 60 * 1000;
const SITE_VERSION_NOTICE_DURATION = 60 * 1000;
let siteVersion = null;
let siteVersionLastCheckedAt = 0;
let siteVersionPendingNotice = null;
let siteVersionForceApplied = null;
let siteVersionCheckPromise = null;
let siteVersionDismissedThisSession = null;
let siteVersionNoticeTimer = 0;
let siteVersionNoticeElement = null;

function numericSiteVersion(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
function hideSiteVersionNotice(version, { dismissed = true } = {}) {
  if (siteVersionNoticeTimer) clearTimeout(siteVersionNoticeTimer);
  siteVersionNoticeTimer = 0;
  if (dismissed) siteVersionDismissedThisSession = String(version);
  siteVersionNoticeElement?.remove();
  siteVersionNoticeElement = null;
}
function showPendingSiteVersionNotice() {
  const version = siteVersionPendingNotice;
  if (version == null || version === "") return;
  if (siteVersionDismissedThisSession === String(version)) return;
  if (siteVersionNoticeElement?.dataset.version === String(version)) return;

  // A newer pending version replaces the previous notice and its timer.
  hideSiteVersionNotice(version, { dismissed: false });
  const notice = h(
    "section",
    {
      class: "site-update-notice",
      role: "status",
      "aria-live": "polite",
      "aria-label": "Website update available",
      "data-version": String(version),
    },
    h(
      "div",
      { class: "site-update-copy" },
      h("strong", {}, "The website has been updated."),
      h("p", {}, "Reload to get the latest version, or discard this notice for now."),
    ),
    h(
      "div",
      { class: "site-update-actions" },
      h(
        "button",
        {
          type: "button",
          class: "site-update-reload",
          onclick: () => {
            siteVersionPendingNotice = null;
            hideSiteVersionNotice(version, { dismissed: true });
            void reloadSiteWithoutCache(version);
          },
        },
        "Reload",
      ),
      h(
        "button",
        {
          type: "button",
          class: "site-update-discard",
          onclick: () => hideSiteVersionNotice(version, { dismissed: true }),
        },
        "Discard",
      ),
    ),
  );
  siteVersionNoticeElement = notice;
  document.body.append(notice);
  siteVersionNoticeTimer = setTimeout(
    () => hideSiteVersionNotice(version, { dismissed: true }),
    SITE_VERSION_NOTICE_DURATION,
  );
}
async function reloadSiteWithoutCache(version) {
  // CacheStorage may contain app-shell or content responses controlled by a
  // service worker. Clear those first; cache-bust the document and app assets
  // on the next load as an additional safeguard.
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch (error) {
    console.warn("Could not clear the site cache before reloading:", error);
  }
  const target = new URL(location.href);
  target.searchParams.set(
    "__acs_nocache",
    `${String(version).replace(/[^a-zA-Z0-9_-]/g, "_")}-${Date.now()}`,
  );
  location.replace(target.href);
}
async function checkSiteVersion() {
  showPendingSiteVersionNotice();

  if (Date.now() - siteVersionLastCheckedAt < SITE_VERSION_CHECK_INTERVAL)
    return siteVersionCheckPromise;
  if (siteVersionCheckPromise) return siteVersionCheckPromise;

  // Throttle attempts as well as successful requests, so a failing endpoint
  // cannot be requested repeatedly by route changes or visibility events.
  siteVersionLastCheckedAt = Date.now();
  siteVersionCheckPromise = (async () => {
    try {
      const versionUrl = new URL(
        appResourceUrl("content/version.json", document.baseURI),
      );
      // Avoid a cached version response; this check is independent of assets.
      versionUrl.searchParams.set("_version_check", String(Date.now()));
      const response = await fetch(versionUrl.href, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, max-age=0",
          Pragma: "no-cache",
        },
      });
      if (!response.ok)
        throw new Error(`Version check failed with HTTP ${response.status}`);
      const payload = await response.json();
      const incomingVersion = numericSiteVersion(payload?.version);
      const forceUpdate = numericSiteVersion(payload?.forceUpdate);
      if (incomingVersion === null)
        throw new Error("content/version.json must contain a numeric version.");

      // The first successful fetch establishes the version this page runs.
      // Keep it unchanged for this page's lifetime, even after finding an update.
      if (siteVersion === null) siteVersion = incomingVersion;

      const appliedForceKey = `${siteVersion}:${forceUpdate ?? 0}`;
      // forceUpdate is the minimum version allowed to keep running. Reload when
      // this page's version is lower than that threshold.
      if (
        forceUpdate !== null &&
        siteVersion < forceUpdate &&
        siteVersionForceApplied !== appliedForceKey
      ) {
        siteVersionForceApplied = appliedForceKey;
        siteVersionPendingNotice = null;
        hideSiteVersionNotice(incomingVersion, { dismissed: false });
        await reloadSiteWithoutCache(`forced-${incomingVersion}-${forceUpdate}`);
        return;
      }

      // A higher fetched version means an update is available. Keep the original
      // page version as the comparison baseline until the user reloads.
      if (siteVersion < incomingVersion) {
        siteVersionPendingNotice = incomingVersion;
      }
      showPendingSiteVersionNotice();
    } catch (error) {
      // Version checks are opportunistic: a network failure must never block navigation.
      console.warn("Website version check skipped:", error);
    } finally {
      siteVersionCheckPromise = null;
    }
  })();
  return siteVersionCheckPromise;
}

// Run independently of route()/section changes. The visibility check catches up
// promptly when a background tab has had its interval timer throttled.
window.setInterval(() => {
  void checkSiteVersion();
}, SITE_VERSION_CHECK_INTERVAL);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") void checkSiteVersion();
});

let routeShown = null; // { page, subject } currently on screen
let routeEnterAnim = null; // enter animation still running, if any
let routeLeaving = null; // { target, anim }: the exit that is in flight
// Reference/Canvas subject, normalised so "" and the first subject match.
const routeSubject = (page, arg) => {
  const lib = LIBRARY_VIEWS[page];
  if (!lib) return "";
  const refs = S.manifest?.[lib.key] || [],
    id = decodeRouteSegment(arg);
  return (refs.find((r) => r.id === id) || refs[0])?.id ?? "";
};
// What kind of transition this navigation needs (null = none). dir is +1 when
// the new page sits after the old one, -1 before it, 0 for the first load.
function routeMotion(page, subject) {
  if (!routeShown) return { kind: "page", dir: 0 };
  if (routeShown.page !== page) {
    const order = [...document.querySelectorAll("#nav a")].map((a) =>
        a.getAttribute("href"),
      ),
      from = order.indexOf("#/" + routeShown.page),
      to = order.indexOf("#/" + page);
    return { kind: "page", dir: to >= from ? 1 : -1 };
  }
  const lib = LIBRARY_VIEWS[page];
  if (lib && routeShown.subject !== subject) {
    const ids = (S.manifest?.[lib.key] || []).map((r) => r.id);
    return {
      kind: "subject",
      dir: ids.indexOf(subject) >= ids.indexOf(routeShown.subject) ? 1 : -1,
    };
  }
  return null;
}
function playRoute(el, phase, motion) {
  const out = phase === "out",
    sideways = motion.dir !== 0,
    shift =
      motion.kind === "subject"
        ? 32
        : Math.round(Math.min(56, Math.max(20, innerWidth * 0.05))),
    offset = sideways ? motion.dir * shift : 14,
    axis = sideways ? "translateX" : "translateY",
    anim = el.animate(
      out
        ? [
            { opacity: 1, transform: `${axis}(0)` },
            { opacity: 0, transform: `${axis}(${-offset}px)` },
          ]
        : [
            { opacity: 0, transform: `${axis}(${offset}px)` },
            { opacity: 1, transform: `${axis}(0)` },
          ],
      {
        duration: out ? ROUTE_OUT_MS : ROUTE_IN_MS,
        easing: out ? "cubic-bezier(0.4, 0, 1, 1)" : ROUTE_EASE,
        // Stay hidden after sliding out until the old page is removed.
        fill: out ? "forwards" : "none",
      },
    );
  if (!out) routeEnterAnim = anim;
  return anim;
}
async function route() {
  const routeHash = location.hash;
  if (routeHash === lastRouteHash && routePending) return;
  // Never await this: navigation and page rendering remain responsive while
  // the optional hourly version request runs in the background.
  void checkSiteVersion();
  lastRouteHash = routeHash;
  if (activeConfirmDialog?.open) activeConfirmDialog.close("cancel");
  readerSearchCleanup?.();
  readerSearchCleanup = null;
  routeEnterAnim?.cancel();
  routeEnterAnim = null;
  const tok = ++routeTok,
    [, p = "reader", arg, exerciseArg] = routeHash.split("/"),
    main = $("#main"),
    page = pages[p] ? p : "reader",
    motion =
      !reducedMotion.matches && typeof main.animate === "function"
        ? routeMotion(page, routeSubject(page, arg))
        : null,
    leaving = main.firstElementChild,
    root = document.documentElement;
  routePending = true;
  document
    .querySelectorAll("#nav a")
    .forEach((a) =>
      a.classList.toggle("on", a.getAttribute("href") === "#/" + page),
    );
  // Slide the page that is on screen out first (not on the very first load).
  if (motion && motion.dir !== 0 && leaving) {
    const target =
      motion.kind === "subject"
        ? leaving.querySelector(".reference-layout") || leaving
        : leaving;
    // A second click during the exit reuses it instead of restarting it.
    if (routeLeaving?.target !== target)
      routeLeaving = { target, anim: playRoute(target, "out", motion) };
    leaving.style.pointerEvents = "none";
    root.classList.add("route-sliding");
    await routeLeaving.anim.finished.catch(() => {});
    if (tok !== routeTok) return; // a newer navigation took over
  } else if (!motion) {
    root.classList.remove("route-sliding");
  }
  await disposeExerciseViews(main);
  main.replaceChildren();
  const view = h("div");
  main.append(view);
  const packageErrors = packageLoadErrorPanel();
  if (packageErrors) view.append(packageErrors);
  routeShown = { page, subject: routeSubject(page, arg) };
  achOnRoute(page, routeShown.subject);
  // The page functions build their markup before their first await, so the
  // view is ready to animate straight away while content keeps loading.
  const run =
    p === "practice"
      ? pagePractice(
          view,
          decodeRouteSegment(arg),
          decodeRouteSegment(exerciseArg),
        )
      : p === "exam"
        ? pageExam(view, () => tok === routeTok)
        : (pages[p] || pageReader)(
            view,
            decodeRouteSegment(arg),
            decodeRouteSegment(exerciseArg),
          );
  if (motion) {
    const target =
      motion.kind === "subject"
        ? view.querySelector(".reference-layout") || view
        : view;
    if (motion.dir !== 0) root.classList.add("route-sliding");
    playRoute(target, "in", motion).finished.then(
      () => {
        if (tok === routeTok) root.classList.remove("route-sliding");
      },
      () => {}, // cancelled by a newer navigation, which cleans up itself
    );
  }
  await run;
  if (tok !== routeTok) view.remove();
  else routePending = false;
}
addEventListener("hashchange", route);
addEventListener("popstate", route);

loadContent()
  .then(() => {
    achInit(); // loads stats and starts the achievement popups
    return route();
  })
  .catch((e) => {
    $("#main").textContent = "Startup error: " + e.message;
  });

let wassimEggActive = false;
let wassimEggLastStart = -Infinity;
let rainColumnIndex = 0;
let wassimUsedMemes = new Set();
let wassimEggState = "closed";

function launchWassimEasterEgg() {
  if (focusButton.getAttribute("aria-pressed") === "true") return;
  hideClickme();
  const now = performance.now();

  if (wassimEggActive || now - wassimEggLastStart < 650) return;

  wassimEggActive = true;
  wassimEggLastStart = now;
  wassimEggState = "open";

  const previousFocus = document.activeElement;
  const previousBodyOverflow = document.body.style.overflow;
  const previousRootOverflow = document.documentElement.style.overflow;
  const motionIsReduced = reducedMotion.matches;

  // Shared animation and closing durations.
  const closeDuration = motionIsReduced ? 1450 : 4420;
  const exitDuration = motionIsReduced ? 30 : 200;

  let closeTimer = 0;
  let exitTimer = 0;
  let finished = false;
  let rainColumnIndex = 0;

  if (wassimUsedMemes.size >= memes.length) {
    wassimUsedMemes.clear();
  }

  const availableMemes = memes
    .map((meme, index) => ({ meme, index }))
    .filter(({ index }) => !wassimUsedMemes.has(index));

  const selected =
    availableMemes[Math.floor(Math.random() * availableMemes.length)];

  wassimUsedMemes.add(selected.index);

  const meme = selected.meme;
  const openedAt = performance.now();
  achTrack(
    (s) => {
      s.eggOpens++;
      const id = String(meme.title ?? selected.index);
      if (!s.eggMemes.includes(id)) s.eggMemes.push(id);
    },
    { full: false },
  );
  const text = {
    kicker: String(meme.kicker ?? ""),
    title: String(meme.title ?? ""),
    subtitle: String(meme.subtitle ?? ""),
    log: String(meme.log ?? ""),
    verdict: String(meme.verdict ?? ""),
  };

  const alphabet = "01WASSIM<>[]{}#$/\\";

  const rain = Array.from({ length: 22 }, () => {
    const stream = Array.from(
      { length: 17 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("\n");

    return h(
      "span",
      {
        class: "wassim-egg-rain-column",
        style: `--wee-column:${rainColumnIndex++};--wee-delay:${(-Math.random() * 2.6).toFixed(2)}s;--wee-speed:${(1.35 + Math.random() * 1.9).toFixed(2)}s`,
      },
      stream,
    );
  });

  const kickerElement = h("p", {
    class: "wassim-egg-kicker",
  });
  kickerElement.textContent = text.kicker;

  const titleElement = h("h1", {
    class: "wassim-egg-title",
  });
  titleElement.textContent = text.title;
  titleElement.dataset.text = text.title;

  const subtitleElement = h("p", {
    class: "wassim-egg-subtitle",
  });
  subtitleElement.textContent = text.subtitle;

  const logElement = h("span");
  logElement.textContent = text.log;

  const verdictElement = h("p", {
    class: "wassim-egg-verdict",
  });
  verdictElement.textContent = text.verdict;

  const skipButton = h(
    "button",
    {
      type: "button",
      class: "wassim-egg-skip",
      "aria-label": "Close the Wassim easter egg",
      onclick: closeEasterEgg,
    },
    "SKIP",
    h("span", { "aria-hidden": "true" }, " ESC \u2197"),
  );

  const overlay = h(
    "section",
    {
      class: "wassim-egg-overlay",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Wassim root access easter egg",
      tabindex: "-1",
      style: `--wee-duration: ${closeDuration}ms`,
    },

    h("div", { class: "wassim-egg-grid", "aria-hidden": true }),
    h("div", { class: "wassim-egg-rain", "aria-hidden": true }, rain),

    h(
      "div",
      { class: "wassim-egg-topbar" },

      h(
        "span",
        { class: "wassim-egg-live" },
        h("i", { "aria-hidden": "true" }),
        " LIVE // PRIVATE CHANNEL",
      ),

      h("span", { class: "wassim-egg-node" }, "NODE: WASSIM-01"),

      h("span", { class: "wassim-egg-encrypted" }, "AES-256 :: ENCRYPTED"),
    ),

    h(
      "div",
      { class: "wassim-egg-stage" },

      kickerElement,

      h(
        "div",
        { class: "wassim-egg-sigil", "aria-hidden": true },

        h("span", { class: "wassim-egg-sigil-ring" }),

        h("span", {
          class: "wassim-egg-sigil-ring wassim-egg-sigil-ring-two",
        }),

        h("strong", {}, "W"),

        h("i", {}, "0x57"),
      ),

      h(
        "p",
        { class: "wassim-egg-identity" },
        "IDENTITY VERIFIED",
        h("span", { "aria-hidden": true }, " // "),
        " OPERATOR FOUND",
      ),

      titleElement,
      subtitleElement,

      h(
        "div",
        {
          class: "wassim-egg-console",
          "aria-label": "Simulated access log",
        },

        h("span", {}, h("b", {}, "root@mainframe"), ":~$ whoami"),

        h("span", {}, "wassim // system architect // level \u221E"),

        h("span", {}, h("b", {}, "root@mainframe"), ":~$ ", logElement),

        h(
          "span",
          { class: "wassim-egg-console-success" },
          "[ OK ] PRIVILEGES ELEVATED. REALITY PATCHED.",
        ),
      ),

      h(
        "div",
        { class: "wassim-egg-stats" },

        h(
          "div",
          { class: "wassim-egg-stat" },
          h("span", {}, "ACCESS LEVEL"),
          h("strong", {}, "ROOT / GODMODE"),
        ),

        h(
          "div",
          { class: "wassim-egg-stat" },
          h("span", {}, "THREAT LEVEL"),
          h("strong", { class: "wassim-egg-stat-hot" }, "LEGENDARY"),
        ),

        h(
          "div",
          { class: "wassim-egg-stat" },
          h("span", {}, "SYSTEM STATUS"),
          h("strong", { class: "wassim-egg-stat-ok" }, "WASSIM-APPROVED"),
        ),
      ),

      verdictElement,
    ),

    h(
      "div",
      { class: "wassim-egg-footer" },

      h("span", {}, "SIGNAL ORIGIN: LOCALHOST"),

      h(
        "span",
        { class: "wassim-egg-progress", "aria-hidden": true },
        h("i", {}),
      ),

      h("span", {}, "SESSION WILL SELF-DESTRUCT"),

      skipButton,
    ),
  );

  function cleanup() {
    clearTimeout(closeTimer);
    clearTimeout(exitTimer);

    document.removeEventListener("keydown", onEasterEggKeydown, true);

    overlay.remove();

    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousRootOverflow;

    wassimEggActive = false;
    wassimEggState = "closed";

    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
      try {
        previousFocus.focus({ preventScroll: true });
      } catch {
        previousFocus.focus();
      }
    }
  }

  function finishEasterEgg() {
    if (finished) return;

    finished = true;
    wassimEggState = "closing";

    clearTimeout(closeTimer);

    overlay.classList.add("wassim-egg-exiting");

    exitTimer = window.setTimeout(cleanup, exitDuration);
  }

  function closeEasterEgg() {
    if (!finished)
      achTrack(
        (s) => {
          s.eggSkips++;
          if (performance.now() - openedAt < 1500) s.eggQuickSkips++;
        },
        { full: false },
      );
    finishEasterEgg();
  }

  function onEasterEggKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeEasterEgg();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      skipButton.focus();
    }
  }

  // Mount overlay.
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";

  document.body.append(overlay);

  document.addEventListener("keydown", onEasterEggKeydown, true);

  overlay.focus({ preventScroll: true });

  // Automatic closing synchronized with the progress bar.
  closeTimer = window.setTimeout(() => {
    if (!finished) achTrack((s) => void s.eggFull++, { full: false });
    finishEasterEgg();
  }, closeDuration);
}

// Keep the rain column counter local to each launch.

document.addEventListener(
  "click",
  (event) => {
    const target =
      event.target instanceof Element ? event.target.closest("#brand") : null;
    if (!target) return;
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    launchWassimEasterEgg();
  },
  true,
);

// Remember distraction mode across page refreshes.
const FOCUS_MODE_KEY = "practice-site-focus-mode";

function setFocusMode(isPressed, recordAchievement = false) {
  if (isPressed) {
    periodicToast.hidden = true;
    terminalArtifact.hidden = true;
    document.documentElement.classList.remove("hacking-mode");
    hideClickme();

    if (recordAchievement) {
      achTrack((s) => void s.zenOn++, { full: false });
    }
  }

  const label = isPressed ? "Enable distractions" : "Hide distractions";

  focusButton.title = focusButton.querySelector(".focus-label").textContent =
    label;

  focusButton.setAttribute("aria-pressed", String(isPressed));
  syncClickmeSchedule?.();
  syncWassimSignalSchedule?.();

  try {
    localStorage.setItem(FOCUS_MODE_KEY, String(isPressed));
  } catch (error) {
    console.warn("Could not save distraction setting:", error);
  }
}

// The distraction setting is now a normal, always-available control; the
// maker signature no longer hides/reveals it as part of a tap-count secret.
focusButton.hidden = false;

// Restore the previous setting when the page loads.
let savedFocusMode = false;

try {
  savedFocusMode = localStorage.getItem(FOCUS_MODE_KEY) === "true";
} catch (error) {
  console.warn("Could not restore distraction setting:", error);
}

setFocusMode(savedFocusMode);

// Toggle distraction mode.
focusButton.addEventListener("click", () => {
  const isPressed = focusButton.getAttribute("aria-pressed") === "true";
  // Switching distractions off must cancel a secret hold already in progress.
  if (!isPressed) cancelMakerSecretHold();
  setFocusMode(!isPressed, !isPressed);
});

// Hidden developer console: a deliberate press-and-hold, not a multi-tap.
// It is only available when distractions are enabled (focus mode is off).
const wassimSign = document.getElementById("wassim-sign");
const MAKER_SECRET_HOLD_MS = 1250;
let makerSecretHoldTimer = 0;
let makerSecretSuppressTimer = 0;
let makerSecretHolding = false;
let makerSecretOpen = false;
let makerSecretTriggered = false;

function distractionsAreEnabled() {
  return focusButton.getAttribute("aria-pressed") !== "true";
}

function openMakerSecretConsole() {
  if (!distractionsAreEnabled() || makerSecretOpen || wassimEggActive) return;
  makerSecretOpen = true;
  achTrack((stats) => void stats.signToggles++, { full: false });

  const dialog = h(
    "dialog",
    {
      class: "maker-secret-dialog",
      "aria-labelledby": "maker-secret-title",
      "aria-describedby": "maker-secret-description",
    },
    h("div", { class: "maker-secret-content" },
      h("p", { class: "maker-secret-kicker" }, "UNLISTED // DEVELOPER CHANNEL"),
      h("h2", { id: "maker-secret-title" }, "Well, this is awkward."),
      h("p", { id: "maker-secret-description", class: "maker-secret-description" },
        "You found the maintenance console. It mostly contains things the developer meant to fix later."),
      h("div", { class: "maker-secret-log", "aria-label": "Developer console diagnostics" },
        h("p", {}, h("strong", {}, "[ OK ] "), "CSS cascade: contained (mostly)"),
        h("p", {}, h("strong", {}, "[ OK ] "), "Study progress: safely stored"),
        h("p", {}, h("strong", {}, "[ WARN ] "), "One more tiny refactor is pending"),
        h("p", {}, h("strong", {}, "[ INFO ] "), "Coffee dependency: unresolved"),
        h("p", { class: "maker-secret-success" }, "ACCESS GRANTED // YOU WERE NEVER SUPPOSED TO FIND THIS"),
      ),
      h("div", { class: "maker-secret-footer" },
        h("span", {}, "SESSION: LOCAL ONLY"),
        h("button", { type: "button", class: "sec", onclick: () => dialog.close() }, "Back to work"),
      ),
    ),
  );

  dialog.addEventListener("close", () => {
    dialog.remove();
    makerSecretOpen = false;
    if (wassimSign instanceof HTMLElement && wassimSign.isConnected) {
      try { wassimSign.focus({ preventScroll: true }); }
      catch { wassimSign.focus(); }
    }
  }, { once: true });
  document.body.append(dialog);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function startMakerSecretHold(event) {
  if (!wassimSign || !distractionsAreEnabled() || makerSecretOpen) return;
  if (event.type === "pointerdown" && event.button !== 0) return;
  if (event.type === "keydown" && event.repeat) return;
  makerSecretHolding = true;
  wassimSign.classList.add("is-secret-holding");
  clearTimeout(makerSecretHoldTimer);
  makerSecretHoldTimer = window.setTimeout(() => {
    makerSecretHoldTimer = 0;
    if (!makerSecretHolding || !distractionsAreEnabled()) return;
    makerSecretHolding = false;
    makerSecretTriggered = true;
    clearTimeout(makerSecretSuppressTimer);
    makerSecretSuppressTimer = window.setTimeout(() => {
      makerSecretTriggered = false;
      makerSecretSuppressTimer = 0;
    }, 700);
    wassimSign.classList.remove("is-secret-holding");
    openMakerSecretConsole();
  }, MAKER_SECRET_HOLD_MS);
}

function cancelMakerSecretHold() {
  makerSecretHolding = false;
  clearTimeout(makerSecretHoldTimer);
  makerSecretHoldTimer = 0;
  wassimSign?.classList.remove("is-secret-holding");
}

if (wassimSign) {
  // Make the hold discoverable to keyboard and assistive-technology users too.
  if (wassimSign.tabIndex < 0) wassimSign.tabIndex = 0;
  if (!wassimSign.hasAttribute("aria-label")) {
    wassimSign.setAttribute(
      "aria-label",
      "Maker signature. Press and hold while distractions are enabled to open a hidden console.",
    );
  }
  wassimSign.addEventListener("click", (event) => {
    if (!makerSecretTriggered) return;
    makerSecretTriggered = false;
    clearTimeout(makerSecretSuppressTimer);
    makerSecretSuppressTimer = 0;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  wassimSign.addEventListener("contextmenu", (event) => {
    if (makerSecretHolding) event.preventDefault();
  });
  wassimSign.addEventListener("pointerdown", startMakerSecretHold);
  wassimSign.addEventListener("pointerup", cancelMakerSecretHold);
  wassimSign.addEventListener("pointercancel", cancelMakerSecretHold);
  wassimSign.addEventListener("pointerleave", cancelMakerSecretHold);
  wassimSign.addEventListener("blur", cancelMakerSecretHold);
  wassimSign.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startMakerSecretHold(event);
    }
  });
  wassimSign.addEventListener("keyup", (event) => {
    if (event.key === "Enter" || event.key === " ") cancelMakerSecretHold();
  });
}
