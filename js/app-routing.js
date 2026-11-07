"use strict";

const ROUTE_OUT_MS = 140,
  ROUTE_IN_MS = 360,
  ROUTE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
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

  try {
    localStorage.setItem(FOCUS_MODE_KEY, String(isPressed));
  } catch (error) {
    console.warn("Could not save distraction setting:", error);
  }
}

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

  setFocusMode(!isPressed, !isPressed);
});

let clickCount = 0;
let clickTimer;

const wassimSign = document.getElementById("wassim-sign");

wassimSign.addEventListener("click", () => {
  clickCount++;

  clearTimeout(clickTimer);

  if (clickCount >= 5) {
    achTrack((s) => void s.signToggles++, { full: false });
    focusButton.hidden = !focusButton.hidden;

    clickCount = 0;
    return;
  }

  clickTimer = setTimeout(() => {
    clickCount = 0;
  }, 3000);
});
