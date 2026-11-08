"use strict";
const {
  compare,
  generateExam,
  validatePackage,
  gradeOS,
  hasSimilarOSAnswer,
  exerciseKey,
  shuffle,
  DIFF,
} = Core;
const focusButton = document.getElementById("focus-toggle");
const headerTools = document.getElementById("header-tools");
// A forced refresh adds a one-time URL token to app-owned resources. This
// bypasses stale browser/service-worker entries without changing normal caching.
function appResourceUrl(path, base = document.baseURI) {
  const url = new URL(path, base);
  const cacheBust = window.__ACS_FORCE_CACHE_BUST__;
  if (cacheBust && url.origin === location.origin)
    url.searchParams.set("__acs_nocache", String(cacheBust));
  return url.href;
}
async function fetchAppResource(path, options = {}) {
  const url = appResourceUrl(path);
  const offlineCache = window.__ACS_OFFLINE_CACHE__;
  if (offlineCache?.fetchResource)
    return offlineCache.fetchResource(url, options);
  const requestOptions = { ...options };
  if (window.__ACS_FORCE_CACHE_BUST__) requestOptions.cache = "reload";
  return fetch(url, requestOptions);
}
const appStateScript = document.currentScript;
const appStateScriptUrl =
  appStateScript?.dataset.appSectionSrc || appStateScript?.src || location.href;
const terminalModuleUrl = appResourceUrl("./terminal.js", appStateScriptUrl);
let javaModuleUrl = appResourceUrl("./java.js", appStateScriptUrl);
let terminalModulePromise = null;
let javaModulePromise = null;
async function importAppModuleWithCacheFallback(url, kind) {
  try {
    const module = await import(url);
    // Cache API warm-up is non-blocking; keep native module URLs for relative
    // imports, and warm the Java worker URL so it can be served by the worker
    // cache on a later offline visit.
    void window.__ACS_OFFLINE_CACHE__?.prime?.(url);
    if (kind === "java") {
      const workerUrl = new URL("./java.worker.js", url).href;
      void window.__ACS_OFFLINE_CACHE__?.prime?.(workerUrl);
    }
    return module;
  } catch (networkError) {
    if (
      !window.__ACS_OFFLINE_CACHE__?.readCachedResponse ||
      window.__ACS_FORCE_CACHE_BUST__
    )
      throw networkError;
    const cached = await window.__ACS_OFFLINE_CACHE__.readCachedResponse(url);
    if (!cached) {
      // If the cache is unavailable/empty, retry the normal module URL once.
      try {
        return await import(url);
      } catch (_) {
        throw networkError;
      }
    }
    const source = await cached.text();
    const blobUrl = URL.createObjectURL(
      new Blob([source], { type: "text/javascript" }),
    );
    try {
      // java.js derives its worker URL from import.meta.url; when loaded from a
      // Blob, provide the original same-origin module URL explicitly.
      if (kind === "java") window.__ACS_JAVA_MODULE_BASE_URL__ = url;
      const module = await import(blobUrl);
      if (kind === "java") {
        const workerUrl = new URL("./java.worker.js", url).href;
        void window.__ACS_OFFLINE_CACHE__?.prime?.(workerUrl);
      }
      return module;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }
}
const loadTerminalModule = () =>
  (terminalModulePromise ||= importAppModuleWithCacheFallback(
    terminalModuleUrl,
    "terminal",
  ));
const loadJavaModule = () => {
  if (window.newVer === true) {
    const versionedUrl = new URL(javaModuleUrl);
    versionedUrl.searchParams.set(
      "__acs_java_version",
      String(window.__ACS_SITE_VERSION__ ?? "new"),
    );
    javaModuleUrl = versionedUrl.href;
  }
  return (javaModulePromise ||= importAppModuleWithCacheFallback(
    javaModuleUrl,
    "java",
  ));
};
window.__ACS_LOAD_JAVA_MODULE__ = loadJavaModule;

// One registry defines every desktop split exercise. Adding a new workspace
// type requires one entry here and the shared workspace/action-container
// contract; no feature-specific split CSS or wrapper is needed.
const EXERCISE_LAYOUTS = Object.freeze({
  terminal: {
    storageKey: "terminalInstructionsFraction",
    min: 0.22,
    max: 0.56,
    defaultFraction: 0.34,
    mainMin: "320px",
    sideMin: "280px",
    label: "Resize workspace and instructions",
    sidePanel: "instructions",
    module: "terminal",
    workspaceLabel: "Terminal workspace",
  },
  "java-ex": {
    storageKey: "javaSideFraction",
    min: 0.3,
    max: 0.64,
    defaultFraction: 0.46,
    mainMin: "320px",
    sideMin: "320px",
    label: "Resize workspace and instructions",
    sidePanel: "instructions",
    module: "java",
    workspaceLabel: "Java editor",
  },
  "sql-query": {
    storageKey: "sqlSchemaFraction",
    min: 0.25,
    max: 0.65,
    defaultFraction: null,
    mainMin: "0px",
    sideMin: "250px",
    label: "Resize SQL editor and schema",
    sidePanel: "schema",
  },
});
const DESKTOP_SPLIT_EXERCISE_TYPES = Object.freeze(
  Object.keys(EXERCISE_LAYOUTS),
);

// Terminal views own their listeners and resources. Dispose only exercise
// views that explicitly expose this small lifecycle hook.
function clearTerminalExerciseStorage() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase("acs-practice-terminal");
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error || new Error("Could not clear terminal workspaces"));
    request.onblocked = () =>
      reject(
        new Error(
          "Terminal storage is still open in another tab; close it and retry",
        ),
      );
  });
}
function disposeExerciseViews(root) {
  if (!root) return Promise.resolve();
  const nodes = [root, ...(root.querySelectorAll?.("*") || [])];
  const pending = root.exerciseCleanupPromise
    ? [root.exerciseCleanupPromise]
    : [];
  for (const node of nodes) {
    if (typeof node.disposeExercise !== "function") continue;
    const dispose = node.disposeExercise;
    node.disposeExercise = null;
    try {
      const result = dispose();
      if (result && typeof result.then === "function") pending.push(result);
    } catch (error) {
      console.warn("Exercise cleanup failed:", error);
    }
  }
  let wrapped;
  wrapped = Promise.all(
    pending.map((task) =>
      task.catch((error) => {
        console.warn("Exercise cleanup failed:", error);
      }),
    ),
  ).finally(() => {
    if (root.exerciseCleanupPromise === wrapped)
      root.exerciseCleanupPromise = null;
  });
  root.exerciseCleanupPromise = wrapped;
  return wrapped;
}
const $ = (s, r = document) => r.querySelector(s);
const h = (t, a = {}, ...k) => {
  const e = document.createElement(t);
  for (const [n, v] of Object.entries(a)) {
    if (n === "class") e.className = v;
    else if (n.startsWith("on")) e.addEventListener(n.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(n, v === true ? "" : v);
  }
  k.flat(9).forEach((c) =>
    e.append(c instanceof Node ? c : document.createTextNode(c ?? "")),
  );
  return e;
};
function plantUmlImageUrl(encoded) {
  const format = currentTheme() === "dark" ? "dsvg" : "svg";
  return `https://www.plantuml.com/plantuml/${format}/${encoded}`;
}
function updatePlantUmlImageTheme() {
  document
    .querySelectorAll(".plantuml-preview img[data-plantuml-encoded]")
    .forEach((image) => {
      const url = plantUmlImageUrl(image.dataset.plantumlEncoded);
      if (image.src !== url) image.src = url;
    });
}
const empty = (a, b) =>
  h("div", { class: "empty" }, h("strong", {}, a), h("div", {}, b || ""));
// ---------- loading placeholders ----------
const loadingNote = (text, extra = {}) =>
  h(
    "div",
    { class: "loading-note", role: "status", "aria-live": "polite", ...extra },
    h("span", { class: "loading-spin", "aria-hidden": "true" }),
    h("span", {}, text),
  );

// A reusable loading panel for operations with multiple stages. Pass a value
// from 0..100 when measurable progress is available; omit it while the current
// stage has an unknown duration so the meter can display an indeterminate run.
function createLoadingProgress({
  title = "Loading",
  detail = "Please wait…",
  value = null,
  className = "",
} = {}) {
  const titleNode = h("strong", { class: "loading-progress-title" }, title);
  const detailNode = h("p", { class: "loading-progress-detail" }, detail);
  const meter = h("progress", {
    class: "loading-progress-meter",
    max: 100,
    "aria-label": title,
  });
  const percentNode = h("span", { class: "loading-progress-percent" });
  const element = h(
    "section",
    {
      class: `loading-progress-panel ${className}`.trim(),
      role: "status",
      "aria-live": "polite",
      "aria-busy": "true",
    },
    h(
      "div",
      { class: "loading-progress-heading" },
      h("span", { class: "loading-progress-spinner", "aria-hidden": "true" }),
      h("div", { class: "loading-progress-copy" }, titleNode, detailNode),
    ),
    h("div", { class: "loading-progress-footer" }, meter, percentNode),
  );

  const update = (next = {}) => {
    if (typeof next.title === "string") {
      titleNode.textContent = next.title;
      meter.setAttribute("aria-label", next.title);
    }
    if (typeof next.detail === "string") detailNode.textContent = next.detail;
    if (Object.prototype.hasOwnProperty.call(next, "value")) {
      if (next.value === null || !Number.isFinite(Number(next.value))) {
        meter.removeAttribute("value");
        percentNode.textContent = "Working…";
        element.classList.add("is-indeterminate");
      } else {
        const progress = Math.max(0, Math.min(100, Number(next.value)));
        meter.value = progress;
        percentNode.textContent = `${Math.round(progress)}%`;
        element.classList.remove("is-indeterminate");
      }
    }
    if (next.error) element.classList.add("has-error");
  };

  update({ value });
  return Object.freeze({
    element,
    update,
    complete(detailText = "Complete") {
      update({ detail: detailText, value: 100 });
      element.setAttribute("aria-busy", "false");
      element.classList.add("is-complete");
    },
    fail(detailText) {
      update({
        title: "Could not finish",
        detail: detailText,
        value: null,
        error: true,
      });
      element.setAttribute("aria-busy", "false");
    },
  });
}

const loadingSkeleton = (text, sub = "") =>
  h(
    "div",
    { class: "loading-skeleton" },
    loadingNote(text),
    sub ? h("small", { class: "loading-sub" }, sub) : "",
  );
const uniq = (arr, f) =>
  [...new Set(arr.map(f).filter((x) => x !== undefined && x !== ""))].sort();
const courseLabel = (course) => globalThis.Core.initcap(course);

let activeConfirmDialog = null;
let confirmDialogId = 0;
function confirmInApp({
  title,
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  danger = false,
  reverseDanger = false,
}) {
  if (activeConfirmDialog?.open) activeConfirmDialog.close("cancel");
  return new Promise((resolve) => {
    const titleId = `app-confirm-title-${++confirmDialogId}`;
    const dialog = h(
      "dialog",
      { class: "app-confirm-dialog", "aria-labelledby": titleId },
      h(
        "div",
        { class: "app-confirm-content" },
        h("h2", { id: titleId }, title),
        h("p", {}, message),
        h(
          "div",
          { class: "app-confirm-actions" },
          h(
            "button",
            {
              type: "button",
              class: danger && reverseDanger ? "danger" : "sec",
              onclick: () => dialog.close("cancel"),
            },
            cancelLabel,
          ),
          h(
            "button",
            {
              type: "button",
              class:
                danger && !reverseDanger
                  ? "danger"
                  : danger && reverseDanger
                    ? "sec"
                    : "",
              onclick: () => dialog.close("confirm"),
            },
            confirmLabel,
          ),
        ),
      ),
    );
    dialog.addEventListener(
      "close",
      () => {
        if (activeConfirmDialog === dialog) activeConfirmDialog = null;
        dialog.remove();
        resolve(dialog.returnValue === "confirm");
      },
      { once: true },
    );
    document.body.append(dialog);
    activeConfirmDialog = dialog;
    dialog.showModal();
    dialog.querySelector(".sec").focus();
  });
}

// ---------- storage ----------
const idb = new Promise((res, rej) => {
  const r = indexedDB.open("practice-site", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("kv");
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const kv = {
  async get(k, d) {
    const db = await idb;
    return new Promise((res) => {
      const q = db.transaction("kv").objectStore("kv").get(k);
      q.onsuccess = () => res(q.result ?? d);
    });
  },
  async set(k, v) {
    const db = await idb;
    return new Promise((res) => {
      const t = db.transaction("kv", "readwrite");
      t.objectStore("kv").put(v, k);
      t.oncomplete = res;
    });
  },
  async del(k) {
    const db = await idb;
    return new Promise((res, rej) => {
      const t = db.transaction("kv", "readwrite");
      t.objectStore("kv").delete(k);
      t.oncomplete = res;
      t.onerror = () => rej(t.error);
    });
  },
  async clear() {
    const db = await idb;
    return new Promise((res, rej) => {
      const t = db.transaction("kv", "readwrite");
      t.objectStore("kv").clear();
      t.oncomplete = res;
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error("Storage reset was aborted"));
    });
  },
};
const ACTIVE_EXAM_CHECKPOINT = "practice-site-active-exam";
let examSaveQueue = Promise.resolve();
function saveExamState(exam) {
  const snapshot = { ...exam, savedAt: Date.now() };
  const write = async () => {
    await kv.set("exam", snapshot);
    localStorage.setItem(ACTIVE_EXAM_CHECKPOINT, JSON.stringify(snapshot));
  };
  examSaveQueue = examSaveQueue.then(write, write);
  return examSaveQueue;
}
function readExamCheckpoint() {
  const value = localStorage.getItem(ACTIVE_EXAM_CHECKPOINT);
  return value === null ? null : JSON.parse(value);
}
async function discardExamState() {
  const discard = async () => {
    await kv.del("exam");
    localStorage.removeItem(ACTIVE_EXAM_CHECKPOINT);
  };
  examSaveQueue = examSaveQueue.then(discard, discard);
  return examSaveQueue;
}

const S = {
  exercises: [],
  datasets: {},
  errors: [],
  packages: [],
  attempts: [],
  drafts: {},
  xpRewards: {},
  savedForLater: {},
};
const keyOf = (ex) => ex.key || exerciseKey(ex);
const lastAttempt = () => {
  const m = {};
  S.attempts.forEach((a) => {
    m[a.key] = Math.max(m[a.key] || 0, a.t);
  });
  return m;
};
const xpFor = (ex) =>
  ({ Easy: 25, Medium: 50, Hard: 100, Extreme: 200 })[ex.difficulty] || 25;
async function rec(ex, correct, mode, onRecorded = () => {}, meta = {}) {
  const key = keyOf(ex),
    prevAttempt = S.attempts.find((a) => a.key === key),
    attempt = {
      key,
      packageId: ex.packageId,
      id: ex.id,
      t: Date.now(),
      correct,
      mode,
      // Keep this history flag even after a later correct attempt. The Needs
      // correction filter additionally checks the latest result, so a question
      // leaves that filter as soon as it is answered correctly.
      everIncorrect: correct === false || Boolean(prevAttempt?.everIncorrect),
    };
  const earnedReward = correct && !S.xpRewards[key];
  if (earnedReward) {
    S.xpRewards[key] = {
      xp: xpFor(ex),
      difficulty: ex.difficulty,
      earnedAt: attempt.t,
    };
  }
  S.attempts = [...S.attempts.filter((a) => a.key !== key), attempt];
  onRecorded(attempt);
  const writes = [kv.set("attempts", S.attempts)];
  if (earnedReward) writes.push(kv.set("xpRewards", S.xpRewards));
  await Promise.all(writes);
  // Exams are scored as a whole by achOnExam once they are submitted.
  if (mode === "practice") achOnAttempt(ex, key, correct, meta, !prevAttempt);
}
const draftWrites = new Map();
function saveDraft(id, answer) {
  S.drafts[id] = answer;
  const previous = draftWrites.get(id) || Promise.resolve();
  const write = previous
    .catch(() => {})
    .then(() => kv.set("draft:" + id, answer));
  draftWrites.set(id, write);
  return write.finally(() => {
    if (draftWrites.get(id) === write) draftWrites.delete(id);
  });
}

// ---------- achievements ----------
// Two kinds of achievement share one registry:
//  - "base" milestones are computed from solved exercises, XP and exam history
//    (see computeProgress, which the Progress page also uses);
//  - "x:" achievements are driven by the small counters in S.stats below
//    (easter eggs, Wassim sightings, reading time, failures, bad exams\u2026).
// Unlocked ids are stored under "achUnlocked" and stats under "stats", so a
// popup fires exactly once per achievement.
const achStatDefaults = () => ({
  eggOpens: 0,
  eggSkips: 0,
  eggQuickSkips: 0,
  eggFull: 0,
  eggMemes: [],
  signToggles: 0,
  zenOn: 0,
  themeToggles: 0,
  watches: 0,
  activeSeconds: 0,
  refSeconds: 0,
  canvasSeconds: 0,
  longestRefStay: 0,
  refSubjects: [],
  canvasSubjects: [],
  runs: 0,
  shortcuts: 0,
  hints: 0,
  solutionPeeks: 0,
  fails: 0,
  failStreak: 0,
  bestFailStreak: 0,
  correctStreak: 0,
  bestCorrectStreak: 0,
  sqlErrors: 0,
  blankSubmits: 0,
  maxSameFails: 0,
  redemptions: 0,
  peekedFails: 0,
  selfWrong: 0,
  comebacks: 0,
  firstTry: 0,
  nightAttempts: 0,
  earlyAttempts: 0,
  weekendAttempts: 0,
  dayStreak: 0,
  bestDayStreak: 0,
  totalDays: 0,
  lastDay: "",
  badExams: 0,
  badExamStreak: 0,
  bestBadExamStreak: 0,
  zeroExams: 0,
  guessingExams: 0,
  halfExams: 0,
  scrapeExams: 0,
  declineStreak: 0,
  bestDeclineStreak: 0,
  lastExamPct: -1,
  examComebacks: 0,
  speedFails: 0,
  speedPerfects: 0,
  blankExams: 0,
  timeouts: 0,
  discards: 0,
});
S.stats = achStatDefaults();
S.achUnlocked = null; // null until loaded; {} once loaded
let achFrozen = false; // set while "Reset all local data" runs
let achResolveReady;
const achReady = new Promise((resolve) => (achResolveReady = resolve));
const achSession = {
  fails: Object.create(null),
  peeked: new Set(),
  seenPeek: new Set(),
};

const achEggMessages = () =>
  typeof memes !== "undefined" && memes?.length ? memes.length : 5;
const achSubjectCount = (key) => Math.max(2, (S.manifest?.[key] || []).length);
// id, icon, tier, title, detail, flavor, stat getter, target, secret?
const A = (id, icon, tier, title, detail, flavor, stat, target, secret) => ({
  id: "x:" + id,
  icon,
  tier,
  title,
  detail,
  flavor,
  stat,
  target,
  secret: Boolean(secret),
});
const ACH_DEFS = [
  // ---- the Wassim easter egg ----
  A(
    "egg-1",
    "\u{1F95A}",
    "wassim",
    "Curious Clicker",
    "Open the Wassim easter egg",
    "You clicked the logo. Wassim noticed.",
    (s) => s.eggOpens,
    1,
  ),
  A(
    "egg-5",
    "\u{1F513}",
    "wassim",
    "Logo Enthusiast",
    "Open the easter egg 5 times",
    "It's still the same logo.",
    (s) => s.eggOpens,
    5,
  ),
  A(
    "egg-10",
    "\u{1F5B1}\uFE0F",
    "wassim",
    "Compulsive Clicker",
    "Open the easter egg 10 times",
    "Doctors recommend a different hobby.",
    (s) => s.eggOpens,
    10,
  ),
  A(
    "egg-25",
    "\u{1F4BB}",
    "wassim",
    "Root Access Regular",
    "Open the easter egg 25 times",
    "Wassim is learning your fingerprints.",
    (s) => s.eggOpens,
    25,
  ),
  A(
    "egg-50",
    "\u{1F451}",
    "wassim",
    "Wassim's Biggest Fan",
    "Open the easter egg 50 times",
    "You've seen this more than the exam material.",
    (s) => s.eggOpens,
    50,
  ),
  A(
    "egg-100",
    "\u{1F331}",
    "platinum",
    "Please Touch Grass",
    "Open the easter egg 100 times",
    "The logo is not a stress ball.",
    (s) => s.eggOpens,
    100,
  ),
  A(
    "egg-memes",
    "\u{1F39E}\uFE0F",
    "gold",
    "Seen Every Secret",
    "See every different easter egg message",
    "You have now consumed all the lore.",
    (s) => s.eggMemes.length,
    achEggMessages,
  ),
  A(
    "egg-full",
    "\u23F3",
    "wassim",
    "Stayed for the Self-Destruct",
    "Let an easter egg play all the way through",
    "Respect. Nobody waits for the countdown.",
    (s) => s.eggFull,
    1,
  ),
  A(
    "egg-full-10",
    "\u{1F37F}",
    "wassim",
    "Front Row Seat",
    "Watch 10 easter eggs play through",
    "Popcorn is on the house.",
    (s) => s.eggFull,
    10,
  ),
  A(
    "egg-skip",
    "\u23ED\uFE0F",
    "bronze",
    "Skip Intro",
    "Close an easter egg early",
    "Wassim hates it when you do that.",
    (s) => s.eggSkips,
    1,
  ),
  A(
    "egg-quick",
    "\u{1F41F}",
    "shame",
    "Goldfish Attention Span",
    "Close an easter egg within 1.5 seconds",
    "Not even a full second of root access.",
    (s) => s.eggQuickSkips,
    1,
  ),
  A(
    "sign",
    "\u{1F91D}",
    "secret",
    "Hidden Admin Panel",
    "Hold the maker signature while distractions are enabled",
    "You found a console that was definitely not in the documentation.",
    (s) => s.signToggles,
    1,
    true,
  ),
  A(
    "zen-1",
    "\u{1F515}",
    "wassim",
    "Do Not Disturb",
    "Turn the distractions off",
    "You muted Wassim. Brave.",
    (s) => s.zenOn,
    1,
  ),
  A(
    "zen-10",
    "\u{1F9D8}",
    "silver",
    "Hermit Mode",
    "Turn the distractions off 10 times",
    "Peace and quiet, until the next signal.",
    (s) => s.zenOn,
    10,
  ),
  A(
    "theme-5",
    "\u{1F4A1}",
    "silver",
    "Light Switch Enthusiast",
    "Toggle the theme 5 times",
    "Dark mode, light mode, dark mode\u2026",
    (s) => s.themeToggles,
    5,
  ),
  A(
    "theme-25",
    "\u{1F317}",
    "bronze",
    "Cannot Decide",
    "Toggle the theme 25 times",
    "Pick a side, coward.",
    (s) => s.themeToggles,
    25,
  ),

  // ---- WassimGPT is watching ----
  A(
    "watch-1",
    "\u{1F441}\uFE0F",
    "wassim",
    "Under Surveillance",
    "Get caught by WassimGPT's monitor",
    "WassimGPT has entered the chat.",
    (s) => s.watches,
    1,
  ),
  A(
    "watch-3",
    "\u{1F575}\uFE0F",
    "wassim",
    "Familiar Face",
    "Get watched by Wassim 3 times",
    "He now knows your name.",
    (s) => s.watches,
    3,
  ),
  A(
    "watch-5",
    "\u{1F3AF}",
    "wassim",
    "Person of Interest",
    "Get watched by Wassim 5 times",
    "Your file is getting thick.",
    (s) => s.watches,
    5,
  ),
  A(
    "watch-10",
    "\u{1F4F9}",
    "wassim",
    "Wassim's Favorite Subject",
    "Get watched by Wassim 10 times",
    "He has a folder just for you.",
    (s) => s.watches,
    10,
  ),
  A(
    "watch-25",
    "\u{1F3E0}",
    "wassim",
    "Live-in Roommate",
    "Get watched by Wassim 25 times",
    "At this point Wassim pays half the rent.",
    (s) => s.watches,
    25,
  ),
  A(
    "watch-50",
    "\u{1F6F0}\uFE0F",
    "platinum",
    "Property of Wassim",
    "Get watched by Wassim 50 times",
    "There is no escape. There was never an escape.",
    (s) => s.watches,
    50,
  ),

  // ---- time spent in the summaries ----
  A(
    "ref-1m",
    "\u{1F4D6}",
    "bronze",
    "Quick Skim",
    "Spend 1 minute in the summaries",
    "Reading is the first step.",
    (s) => s.refSeconds,
    60,
  ),
  A(
    "ref-5m",
    "\u{1F4C4}",
    "bronze",
    "Page Turner",
    "Spend 5 minutes in the summaries",
    "The pages are warm now.",
    (s) => s.refSeconds,
    300,
  ),
  A(
    "ref-15m",
    "\u{1F4D1}",
    "silver",
    "Chapter Closer",
    "Spend 15 minutes in the summaries",
    "One chapter down, who knows how many to go.",
    (s) => s.refSeconds,
    900,
  ),
  A(
    "ref-30m",
    "\u{1F41B}",
    "silver",
    "Bookworm",
    "Spend 30 minutes in the summaries",
    "You are now technically a worm.",
    (s) => s.refSeconds,
    1800,
  ),
  A(
    "ref-1h",
    "\u{1F3DB}\uFE0F",
    "gold",
    "Library Resident",
    "Spend 1 hour in the summaries",
    "The librarian knows your name.",
    (s) => s.refSeconds,
    3600,
  ),
  A(
    "ref-3h",
    "\u{1F6CF}\uFE0F",
    "gold",
    "Has a Bed in the Library",
    "Spend 3 hours in the summaries",
    "Maybe go outside? Just a little?",
    (s) => s.refSeconds,
    10800,
  ),
  A(
    "ref-10h",
    "\u{1F9D9}",
    "platinum",
    "summary Hermit",
    "Spend 10 hours in the summaries",
    "You've read this more closely than the author.",
    (s) => s.refSeconds,
    36000,
  ),
  A(
    "stay-10",
    "\u{1F93F}",
    "silver",
    "Deep Dive",
    "Stay 10 minutes in the summaries without leaving",
    "Pressure at this depth is intense.",
    (s) => s.longestRefStay,
    600,
  ),
  A(
    "stay-30",
    "\u{1F634}",
    "gold",
    "Unbothered",
    "Stay 30 minutes in the summaries without leaving",
    "Did you fall asleep on the keyboard?",
    (s) => s.longestRefStay,
    1800,
  ),
  A(
    "subjects-3",
    "\u{1F998}",
    "bronze",
    "Subject Hopper",
    "Open 3 different summary subjects",
    "Commitment issues, but academic.",
    (s) => s.refSubjects.length,
    3,
  ),
  A(
    "subjects-all",
    "\u{1F3AB}",
    "gold",
    "Library Card, Fully Stamped",
    "Open every summary subject",
    "You've been everywhere, man.",
    (s) => s.refSubjects.length,
    () => achSubjectCount("summarieFiles"),
  ),
  A(
    "canvas-5m",
    "\u{1F3A8}",
    "bronze",
    "Canvas Visitor",
    "Spend 5 minutes in Canvas",
    "Nice brushwork.",
    (s) => s.canvasSeconds,
    300,
  ),
  A(
    "canvas-30m",
    "\u{1F5BC}\uFE0F",
    "silver",
    "Canvas Resident",
    "Spend 30 minutes in Canvas",
    "You should be paying rent.",
    (s) => s.canvasSeconds,
    1800,
  ),

  // ---- stamina and habits ----
  A(
    "time-1h",
    "\u23F1\uFE0F",
    "bronze",
    "Settling In",
    "Spend 1 active hour on the site",
    "The chair is warm now.",
    (s) => s.activeSeconds,
    3600,
  ),
  A(
    "time-5h",
    "\u{1F4DA}",
    "silver",
    "Dedicated",
    "Spend 5 active hours on the site",
    "This is starting to look like a habit.",
    (s) => s.activeSeconds,
    18000,
  ),
  A(
    "time-24h",
    "\u{1F3D5}\uFE0F",
    "platinum",
    "Lives Here Now",
    "Spend 24 active hours on the site",
    "Your chair has a you-shaped dent.",
    (s) => s.activeSeconds,
    86400,
  ),
  A(
    "days-3",
    "\u{1F525}",
    "bronze",
    "Three-Day Streak",
    "Study 3 days in a row",
    "The fire has been lit.",
    (s) => s.bestDayStreak,
    3,
  ),
  A(
    "days-7",
    "\u{1F4C5}",
    "silver",
    "Weekly Habit",
    "Study 7 days in a row",
    "A whole week. Look at you.",
    (s) => s.bestDayStreak,
    7,
  ),
  A(
    "days-14",
    "\u{1F30B}",
    "gold",
    "Fortnight of Focus",
    "Study 14 days in a row",
    "Two weeks without skipping. Suspicious.",
    (s) => s.bestDayStreak,
    14,
  ),
  A(
    "days-30",
    "\u{1F3C6}",
    "platinum",
    "Habit Formed",
    "Study 30 days in a row",
    "Science says it's a habit now.",
    (s) => s.bestDayStreak,
    30,
  ),
  A(
    "night",
    "\u{1F989}",
    "silver",
    "Night Owl",
    "Answer a question between midnight and 5 am",
    "Sleep is just a suggestion.",
    (s) => s.nightAttempts,
    1,
  ),
  A(
    "night-25",
    "\u{1F9DB}",
    "gold",
    "Vampire Hours",
    "Answer 25 questions between midnight and 5 am",
    "The sun is your enemy now.",
    (s) => s.nightAttempts,
    25,
  ),
  A(
    "early",
    "\u{1F426}",
    "silver",
    "Early Bird",
    "Answer a question between 5 and 8 am",
    "You and the worm have a lot to discuss.",
    (s) => s.earlyAttempts,
    1,
  ),
  A(
    "weekend",
    "\u{1F6E1}\uFE0F",
    "silver",
    "Weekend Warrior",
    "Answer a question on a weekend",
    "Fun is for people without exams.",
    (s) => s.weekendAttempts,
    1,
  ),

  // ---- practice: wins ----
  A(
    "first-try-1",
    "\u{1F3AF}",
    "bronze",
    "First Try",
    "Solve an exercise on the first attempt",
    "Beginner's luck? We'll see.",
    (s) => s.firstTry,
    1,
  ),
  A(
    "first-try-10",
    "\u{1F3F9}",
    "silver",
    "Sharpshooter",
    "Solve 10 exercises on the first attempt",
    "Measure twice, submit once.",
    (s) => s.firstTry,
    10,
  ),
  A(
    "first-try-25",
    "\u{1F977}",
    "gold",
    "Sniper Elite",
    "Solve 25 exercises on the first attempt",
    "One shot. One kill. Zero retries.",
    (s) => s.firstTry,
    25,
  ),
  A(
    "streak-5",
    "\u2728",
    "bronze",
    "Warming Up",
    "Get 5 correct answers in a row",
    "Don't jinx it.",
    (s) => s.bestCorrectStreak,
    5,
  ),
  A(
    "streak-10",
    "\u{1F525}",
    "silver",
    "Hot Streak",
    "Get 10 correct answers in a row",
    "Somebody call the fire department.",
    (s) => s.bestCorrectStreak,
    10,
  ),
  A(
    "streak-20",
    "\u26A1",
    "platinum",
    "Unstoppable",
    "Get 20 correct answers in a row",
    "Are you sure you're not Wassim?",
    (s) => s.bestCorrectStreak,
    20,
  ),
  A(
    "run-1",
    "\u25B6\uFE0F",
    "bronze",
    "Hello, Database",
    "Run your first SQL query",
    "SELECT 'hello' FROM world;",
    (s) => s.runs,
    1,
  ),
  A(
    "run-25",
    "\u{1F50D}",
    "silver",
    "Query Enthusiast",
    "Run 25 SQL queries",
    "Your keyboard is starting to wear.",
    (s) => s.runs,
    25,
  ),
  A(
    "run-100",
    "\u{1F5C3}\uFE0F",
    "gold",
    "SELECT * FROM life",
    "Run 100 SQL queries",
    "No WHERE clause. No regrets.",
    (s) => s.runs,
    100,
  ),
  A(
    "shortcut-10",
    "\u2328\uFE0F",
    "silver",
    "Keyboard Warrior",
    "Use Ctrl+Enter 10 times",
    "The mouse is feeling neglected.",
    (s) => s.shortcuts,
    10,
  ),
  A(
    "hint-1",
    "\u{1F4A1}",
    "bronze",
    "Hint Taker",
    "Open a hint",
    "There's no shame in asking. Mostly.",
    (s) => s.hints,
    1,
  ),
  A(
    "hint-10",
    "\u{1F198}",
    "silver",
    "Hint Addict",
    "Open hints on 10 exercises",
    "They're free. For now.",
    (s) => s.hints,
    10,
  ),
  A(
    "peek-1",
    "\u{1F440}",
    "bronze",
    "Just Looking",
    "Peek at a solution",
    "We won't tell. (Wassim will.)",
    (s) => s.solutionPeeks,
    1,
  ),
  A(
    "peek-10",
    "\u{1F3FA}",
    "silver",
    "Answer Key Archaeologist",
    "Peek at 10 solutions",
    "You're digging in the wrong place, but a lot.",
    (s) => s.solutionPeeks,
    10,
  ),
  A(
    "honest",
    "\u{1F607}",
    "silver",
    "Honest Abe",
    "Mark a self-check answer as wrong",
    "Integrity: 100. Score: ouch.",
    (s) => s.selfWrong,
    1,
  ),
  A(
    "redemption",
    "\u{1F305}",
    "gold",
    "Redemption Arc",
    "Solve an exercise right after 3+ wrong answers",
    "Every hero has a low point.",
    (s) => s.redemptions,
    1,
  ),
  A(
    "comeback-1",
    "\u{1FA79}",
    "silver",
    "Learned From Mistakes",
    "Solve an exercise you failed earlier this session",
    "Failure was just the tutorial.",
    (s) => s.comebacks,
    1,
  ),
  A(
    "comeback-10",
    "\u{1F9BE}",
    "gold",
    "Resilient Learner",
    "Turn 10 failures into solves in one go",
    "What doesn't kill you gives you XP.",
    (s) => s.comebacks,
    10,
  ),

  // ---- practice: failures (roast mode) ----
  A(
    "fail-1",
    "\u{1F4A5}",
    "shame",
    "Task Failed Successfully",
    "Submit an incorrect answer",
    "Welcome to the club.",
    (s) => s.fails,
    1,
  ),
  A(
    "fail-5",
    "\u{1F4C9}",
    "shame",
    "Learning Experience",
    "Submit 5 incorrect answers",
    "Five wrong answers. Education is happening.",
    (s) => s.fails,
    5,
  ),
  A(
    "fail-10",
    "\u{1F4A1}",
    "shame",
    "Ten Ways That Don't Work",
    "Submit 10 incorrect answers",
    "Edison would be proud. Edison would also read the question.",
    (s) => s.fails,
    10,
  ),
  A(
    "fail-25",
    "\u{1F5D1}\uFE0F",
    "shame",
    "Error Collector",
    "Submit 25 incorrect answers",
    "Gotta catch 'em all.",
    (s) => s.fails,
    25,
  ),
  A(
    "fail-50",
    "\u{1F3AA}",
    "shame",
    "Failure Is an Option",
    "Submit 50 incorrect answers",
    "NASA would like a word.",
    (s) => s.fails,
    50,
  ),
  A(
    "fail-100",
    "\u{1F5BC}\uFE0F",
    "shame",
    "Certified Disappointment",
    "Submit 100 incorrect answers",
    "Wassim has framed this one.",
    (s) => s.fails,
    100,
  ),
  A(
    "fail-250",
    "\u{1F3C5}",
    "shame",
    "Professional Failure",
    "Submit 250 incorrect answers",
    "At this point it's a career.",
    (s) => s.fails,
    250,
  ),
  A(
    "fstreak-3",
    "\u{1F3A9}",
    "shame",
    "Hat Trick of Shame",
    "Get 3 wrong answers in a row",
    "Three in a row. Impressive, in the wrong direction.",
    (s) => s.bestFailStreak,
    3,
  ),
  A(
    "fstreak-5",
    "\u{1F976}",
    "shame",
    "Cold Streak",
    "Get 5 wrong answers in a row",
    "The answer key is crying in a corner.",
    (s) => s.bestFailStreak,
    5,
  ),
  A(
    "fstreak-10",
    "\u{1F9D0}",
    "shame",
    "Are You Even Reading?",
    "Get 10 wrong answers in a row",
    "The question is right above the text box.",
    (s) => s.bestFailStreak,
    10,
  ),
  A(
    "sql-1",
    "\u{1F645}",
    "shame",
    "Syntax? Never Heard of Her",
    "Submit a query that throws an error",
    "SQLite is not impressed.",
    (s) => s.sqlErrors,
    1,
  ),
  A(
    "sql-10",
    "\u{1F50E}",
    "shame",
    "Semicolon Search Party",
    "Submit 10 queries that throw errors",
    "Have you tried looking at the commas?",
    (s) => s.sqlErrors,
    10,
  ),
  A(
    "sql-25",
    "\u{1F631}",
    "shame",
    "The Parser Fears You",
    "Submit 25 queries that throw errors",
    "SQLite has filed a formal complaint.",
    (s) => s.sqlErrors,
    25,
  ),
  A(
    "same-3",
    "\u{1F501}",
    "shame",
    "Same Mistake, Different Day",
    "Fail the same exercise 3 times in a session",
    "The definition of insanity, allegedly.",
    (s) => s.maxSameFails,
    3,
  ),
  A(
    "same-5",
    "\u{1F410}",
    "shame",
    "Stubborn as a Mule",
    "Fail the same exercise 5 times in a session",
    "Maybe\u2026 read the hint?",
    (s) => s.maxSameFails,
    5,
  ),
  A(
    "peek-fail",
    "\u{1F926}",
    "shame",
    "Looked and Still Failed",
    "Fail an exercise after opening a hint or solution",
    "You had the answer on screen. And yet.",
    (s) => s.peekedFails,
    1,
  ),
  A(
    "blank",
    "\u{1FAE5}",
    "shame",
    "Blank Stare",
    "Submit an empty SQL answer",
    "Technically a strategy. Technically.",
    (s) => s.blankSubmits,
    1,
  ),

  // ---- exams: bad scores (roast mode) and good ones ----
  A(
    "exam-bad-1",
    "\u{1F9EF}",
    "shame",
    "Failing With Style",
    "Score below 50% on an exam",
    "Failed, but make it fashion.",
    (s) => s.badExams,
    1,
  ),
  A(
    "exam-bad-3",
    "\u{1F5D3}\uFE0F",
    "shame",
    "Retake Specialist",
    "Score below 50% on 3 exams",
    "The resit office has your number on speed dial.",
    (s) => s.badExams,
    3,
  ),
  A(
    "exam-bad-10",
    "\u{1F39F}\uFE0F",
    "shame",
    "Resit Season Pass",
    "Score below 50% on 10 exams",
    "Frequent flyer miles at the registrar.",
    (s) => s.badExams,
    10,
  ),
  A(
    "exam-zero",
    "\u{1F95A}",
    "shame",
    "Zero Hero",
    "Score 0 on an exam (3+ questions)",
    "Getting every single one wrong takes talent. Truly.",
    (s) => s.zeroExams,
    1,
  ),
  A(
    "exam-guess",
    "\u{1F412}",
    "shame",
    "Worse Than Guessing",
    "Score below 25% on an exam (4+ questions)",
    "A monkey with a keyboard would have done better. Probably faster too.",
    (s) => s.guessingExams,
    1,
  ),
  A(
    "exam-half",
    "\u2696\uFE0F",
    "silver",
    "Perfectly Balanced",
    "Score exactly 50% on an exam",
    "As all things should be.",
    (s) => s.halfExams,
    1,
  ),
  A(
    "exam-scrape",
    "\u{1F9D7}",
    "bronze",
    "Pass by a Whisker",
    "Score 50\u201359% on an exam",
    "Technically a pass. Technically.",
    (s) => s.scrapeExams,
    1,
  ),
  A(
    "exam-bstreak-2",
    "\u{1F3B2}",
    "shame",
    "Doubling Down",
    "Score below 50% on 2 exams in a row",
    "Doing the same thing and expecting different results.",
    (s) => s.bestBadExamStreak,
    2,
  ),
  A(
    "exam-bstreak-3",
    "\u{1FAA6}",
    "shame",
    "Hat Trick of Regret",
    "Score below 50% on 3 exams in a row",
    "Rest in peace, GPA.",
    (s) => s.bestBadExamStreak,
    3,
  ),
  A(
    "exam-decline",
    "\u26F7\uFE0F",
    "shame",
    "Downhill Skiing",
    "Score lower on 3 exams in a row",
    "Weeeeeee!",
    (s) => s.bestDeclineStreak,
    3,
  ),
  A(
    "exam-speed-fail",
    "\u{1F3C3}",
    "shame",
    "Speedrun Any%",
    "Fail a 5+ question exam in under a minute",
    "Reading the questions is optional, apparently.",
    (s) => s.speedFails,
    1,
  ),
  A(
    "exam-blank",
    "\u{1F4C4}",
    "shame",
    "Blank Page Energy",
    "Submit an exam with no answers",
    "You handed in a blank paper. Bold. Even your name is missing.",
    (s) => s.blankExams,
    1,
  ),
  A(
    "exam-timeout",
    "\u231B",
    "shame",
    "Time Waits for No One",
    "Let the exam timer run out",
    "The clock won. The clock always wins.",
    (s) => s.timeouts,
    1,
  ),
  A(
    "exam-quit-1",
    "\u{1F3F3}\uFE0F",
    "shame",
    "Rage Quit",
    "Discard an unfinished exam",
    "It's fine, we all flip a table sometimes.",
    (s) => s.discards,
    1,
  ),
  A(
    "exam-quit-5",
    "\u{1FAE0}",
    "shame",
    "Exam? What Exam?",
    "Discard 5 unfinished exams",
    "You can't fail what you never finish.",
    (s) => s.discards,
    5,
  ),
  A(
    "exam-comeback",
    "\u{1F680}",
    "gold",
    "Comeback Kid",
    "Score 80%+ right after an exam under 40%",
    "From the depths to the heights.",
    (s) => s.examComebacks,
    1,
  ),
  A(
    "exam-speed-perfect",
    "\u{1F60E}",
    "platinum",
    "Speed Demon",
    "Get a perfect score using under half the time",
    "Did you even need the time limit?",
    (s) => s.speedPerfects,
    1,
  ),
  // ---- additional academic coping mechanisms ----
  A(
    "night-owl-10",
    "\u{1F989}",
    "bronze",
    "Sleep Is a Premium Feature",
    "Make 10 attempts between midnight and 5 AM",
    "Your circadian rhythm has filed a formal complaint.",
    (s) => s.nightAttempts,
    10,
  ),
  A(
    "night-owl-50",
    "\u{1F31A}",
    "silver",
    "Nocturnal Department",
    "Make 50 attempts between midnight and 5 AM",
    "The sun is a rumour at this point.",
    (s) => s.nightAttempts,
    50,
  ),
  A(
    "early-bird-10",
    "\u{1F413}",
    "bronze",
    "Suspiciously Functional",
    "Make 10 attempts before 8 AM",
    "Who are you and what have you done with the student?",
    (s) => s.earlyAttempts,
    10,
  ),
  A(
    "weekend-10",
    "\u{1F4C6}",
    "bronze",
    "Weekend? Never Heard of Her",
    "Make 10 attempts on weekends",
    "Your calendar says Saturday. Your workload says absolutely not.",
    (s) => s.weekendAttempts,
    10,
  ),
  A(
    "weekend-50",
    "\u{1FAE1}",
    "silver",
    "Weekend? Not in This Economy",
    "Make 50 attempts on weekends",
    "Work-life balance has left the group chat.",
    (s) => s.weekendAttempts,
    50,
  ),
  A(
    "first-try-10",
    "\u{1F3AF}",
    "silver",
    "Accidentally Competent",
    "Solve 10 exercises on the first try",
    "A suspicious run of good decisions.",
    (s) => s.firstTry,
    10,
  ),
  A(
    "first-try-50",
    "\u{1F9E0}",
    "gold",
    "Read the Question? Unprecedented",
    "Solve 50 exercises on the first try",
    "The bar was low. You vaulted over it.",
    (s) => s.firstTry,
    50,
  ),
  A(
    "fail-25",
    "\u{1F9F1}",
    "bronze",
    "Professional Wall Tester",
    "Fail 25 exercise attempts",
    "You have confirmed that the wall is, in fact, still there.",
    (s) => s.fails,
    25,
  ),
  A(
    "fail-100",
    "\u{1F9EF}",
    "silver",
    "Error Message Collector",
    "Fail 100 exercise attempts",
    "At this point the errors are starting to recognize you.",
    (s) => s.fails,
    100,
  ),
  A(
    "comeback-10",
    "\u{1FA83}",
    "gold",
    "Recurring Comeback",
    "Recover from a failed attempt 10 times",
    "Character development, but make it repetitive.",
    (s) => s.comebacks,
    10,
  ),
  A(
    "hints-25",
    "\u{1F6DF}",
    "bronze",
    "Hint Subscription",
    "Open hints 25 times",
    "The hint button is doing a lot of heavy lifting.",
    (s) => s.hints,
    25,
  ),
  A(
    "solution-peeks-25",
    "\u{1F440}",
    "silver",
    "Just One Little Peek",
    "Peek at 25 solutions",
    "You and the solution key are getting rather close.",
    (s) => s.solutionPeeks,
    25,
  ),
  A(
    "sql-errors-25",
    "\u{1F5C3}\uFE0F",
    "bronze",
    "SQL Crime Scene",
    "Trigger 25 SQL errors",
    "The database would like some personal space.",
    (s) => s.sqlErrors,
    25,
  ),
  A(
    "blank-submits-5",
    "\u{1F4C3}",
    "shame",
    "Minimalist Submission",
    "Submit 5 blank answers",
    "Bold use of negative content.",
    (s) => s.blankSubmits,
    5,
  ),
  A(
    "zen-10",
    "\u{1F9D8}",
    "silver",
    "Enlightenment Buffering",
    "Enable Zen mode 10 times",
    "Inner peace. Outer procrastination.",
    (s) => s.zenOn,
    10,
  ),
  A(
    "themes-10",
    "\u{1F3A8}",
    "bronze",
    "Identity Crisis",
    "Change the theme 10 times",
    "Maybe the next colour will explain the assignment.",
    (s) => s.themeToggles,
    10,
  ),
  A(
    "runs-100",
    "\u25B6\uFE0F",
    "gold",
    "Execute First, Think Later",
    "Run 100 SQL queries",
    "The database has seen things.",
    (s) => s.runs,
    100,
  ),
  A(
    "shortcuts-25",
    "\u2328\uFE0F",
    "silver",
    "Keyboard Goblin",
    "Use keyboard shortcuts 25 times",
    "The mouse has been made redundant. It knows what it did.",
    (s) => s.shortcuts,
    25,
  ),
];
function customAchievements() {
  const s = S.stats;
  return ACH_DEFS.map((d) => {
    const target = typeof d.target === "function" ? d.target() : d.target;
    return {
      id: d.id,
      icon: d.icon,
      tier: d.tier,
      title: d.title,
      detail: d.detail,
      flavor: d.flavor,
      secret: d.secret,
      count: Math.max(0, Number(d.stat(s)) || 0),
      target: Math.max(1, target),
    };
  });
}
const achExamHistory = async () => {
  const saved = await kv.get("examHistory", []);
  return Array.isArray(saved) ? saved : [];
};

// ---- loading, saving and checking ----
async function achInit() {
  try {
    const [stats, unlocked] = await Promise.all([
      kv.get("stats", {}),
      kv.get("achUnlocked", null),
    ]);
    S.stats = {
      ...achStatDefaults(),
      ...(stats && typeof stats === "object" ? stats : {}),
    };
    S.achUnlocked =
      unlocked && typeof unlocked === "object" && !Array.isArray(unlocked)
        ? unlocked
        : null;
    if (!S.achUnlocked) {
      // First run with popups: quietly credit what is already earned so the
      // person isn't buried under dozens of popups at once.
      const credited = {};
      const now = Date.now();
      for (const a of computeProgress(await achExamHistory()).achievements)
        if (a.count >= a.target) credited[a.id] = now;
      S.achUnlocked = credited;
      await kv.set("achUnlocked", credited);
    }
  } catch {
    S.achUnlocked ||= {};
  }
  achResolveReady();
  achStartTicker();
}
let achChain = Promise.resolve();
function achCheck(full = true) {
  achChain = achChain
    .then(async () => {
      if (achFrozen || !S.achUnlocked) return;
      const list = full
        ? computeProgress(await achExamHistory()).achievements
        : customAchievements();
      const fresh = list.filter(
        (a) => a.count >= a.target && !S.achUnlocked[a.id],
      );
      if (!fresh.length) return;
      const now = Date.now();
      fresh.forEach((a) => (S.achUnlocked[a.id] = now));
      await kv.set("achUnlocked", S.achUnlocked);
      fresh.forEach(achPopup);
    })
    .catch(() => {});
  return achChain;
}
let achDirty = false;
let achSaveTimer = 0;
function achFlush() {
  clearTimeout(achSaveTimer);
  achSaveTimer = 0;
  if (!achDirty || achFrozen) return;
  achDirty = false;
  return kv.set("stats", S.stats).catch(() => {});
}
function achMarkDirty() {
  achDirty = true;
  if (!achSaveTimer) achSaveTimer = setTimeout(achFlush, 2500);
}
addEventListener("pagehide", achFlush);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) achFlush();
});
// Every event goes through here: update counters, save, then look for
// newly earned achievements. full=false skips the (slower) base milestones.
async function achTrack(update, { full = true } = {}) {
  await achReady;
  if (achFrozen) return;
  try {
    update(S.stats);
  } catch {
    return;
  }
  achMarkDirty();
  return achCheck(full);
}

// ---- event helpers ----
const achYmd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function achTouchDay(s) {
  const now = new Date(),
    today = achYmd(now);
  if (s.lastDay === today) return;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  s.dayStreak = s.lastDay === achYmd(yesterday) ? s.dayStreak + 1 : 1;
  s.bestDayStreak = Math.max(s.bestDayStreak, s.dayStreak);
  s.totalDays++;
  s.lastDay = today;
}
function achClock(s) {
  const d = new Date(),
    hour = d.getHours();
  if (hour < 5) s.nightAttempts++;
  else if (hour < 8) s.earlyAttempts++;
  if (d.getDay() === 0 || d.getDay() === 6) s.weekendAttempts++;
}
function achOnAttempt(ex, key, correct, meta, firstTime) {
  return achTrack((s) => {
    achTouchDay(s);
    achClock(s);
    if (correct) {
      if (s.failStreak >= 3) s.redemptions++;
      s.failStreak = 0;
      s.correctStreak++;
      s.bestCorrectStreak = Math.max(s.bestCorrectStreak, s.correctStreak);
      if (achSession.fails[key]) {
        s.comebacks++;
        achSession.fails[key] = 0;
      }
      if (firstTime) s.firstTry++;
    } else {
      s.fails++;
      s.failStreak++;
      s.bestFailStreak = Math.max(s.bestFailStreak, s.failStreak);
      s.correctStreak = 0;
      const sameExercise = (achSession.fails[key] =
        (achSession.fails[key] || 0) + 1);
      s.maxSameFails = Math.max(s.maxSameFails, sameExercise);
      if (meta?.error) s.sqlErrors++;
      if (meta?.blank) s.blankSubmits++;
      if (achSession.peeked.has(key)) s.peekedFails++;
      if (ex.type === "short-answer-self-check") s.selfWrong++;
    }
  });
}
function achPeek(ex, kind) {
  const key = keyOf(ex),
    once = kind + ":" + key;
  achSession.peeked.add(key);
  if (achSession.seenPeek.has(once)) return;
  achSession.seenPeek.add(once);
  achTrack(
    (s) => {
      if (kind === "hint") s.hints++;
      else s.solutionPeeks++;
    },
    { full: false },
  );
}
function achOnExam({ score, gradable, usedMs, limitMs, answered, timedOut }) {
  return achTrack((s) => {
    achTouchDay(s);
    achClock(s);
    if (answered === 0) s.blankExams++;
    if (timedOut) s.timeouts++;
    if (gradable <= 0) return;
    const pct = score / gradable;
    if (pct < 0.5) {
      s.badExams++;
      s.badExamStreak++;
      s.bestBadExamStreak = Math.max(s.bestBadExamStreak, s.badExamStreak);
    } else s.badExamStreak = 0;
    if (gradable >= 3 && score === 0) s.zeroExams++;
    if (gradable >= 4 && pct < 0.25) s.guessingExams++;
    if (gradable >= 4 && score * 2 === gradable) s.halfExams++;
    if (pct >= 0.5 && pct < 0.6) s.scrapeExams++;
    if (gradable >= 5 && pct < 0.5 && usedMs < 60_000) s.speedFails++;
    if (gradable >= 5 && pct === 1 && usedMs < limitMs / 2) s.speedPerfects++;
    if (s.lastExamPct >= 0) {
      if (pct < s.lastExamPct) {
        s.declineStreak++;
        s.bestDeclineStreak = Math.max(s.bestDeclineStreak, s.declineStreak);
      } else s.declineStreak = 0;
      if (s.lastExamPct < 0.4 && pct >= 0.8) s.examComebacks++;
    }
    s.lastExamPct = pct;
  });
}
// ---- time spent: counts only while the tab is visible and the person is
// actually interacting (scrolling, typing, clicking, moving the pointer).
let achLastActivity = performance.now();
let achRefStay = 0;
let achLastPage = "";
for (const type of [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "scroll",
  "touchstart",
])
  addEventListener(
    type,
    () => {
      achLastActivity = performance.now();
    },
    { passive: true, capture: true },
  );
const achPage = () => {
  const page = location.hash.split("/")[1] || "reader";
  return pages[page] ? page : "reader";
};
function achOnRoute(page, subject) {
  if (page !== achLastPage) achRefStay = 0;
  achLastPage = page;
  if ((page === "reader" || page === "canvas") && subject)
    achTrack(
      (s) => {
        const list = page === "reader" ? s.refSubjects : s.canvasSubjects;
        if (!list.includes(subject)) list.push(subject);
      },
      { full: false },
    );
}
let achTickerStarted = false;
function achStartTicker() {
  if (achTickerStarted) return;
  achTickerStarted = true;
  setInterval(() => {
    if (achFrozen || document.hidden || !document.hasFocus()) return;
    if (performance.now() - achLastActivity > 90_000) return;
    if (wassimEggActive) return;
    const s = S.stats,
      page = achPage();
    s.activeSeconds++;
    if (page === "reader") {
      s.refSeconds++;
      achRefStay++;
      s.longestRefStay = Math.max(s.longestRefStay, achRefStay);
    } else if (page === "canvas") s.canvasSeconds++;
    achMarkDirty();
    if (s.activeSeconds % 5 === 0) {
      achTouchDay(s);
      achCheck(false);
    }
  }, 1000);
}

// ---- popup UI (top right, one at a time) ----
const ACH_KICKERS = {
  bronze: "ACHIEVEMENT UNLOCKED",
  silver: "ACHIEVEMENT UNLOCKED",
  gold: "ACHIEVEMENT UNLOCKED",
  platinum: "LEGENDARY ACHIEVEMENT",
  shame: "FAILURE UNLOCKED",
  wassim: "[ SYS//ACHIEVEMENT_LOGGED ]",
  secret: "SECRET UNLOCKED",
};
const achStack = h("div", {
  id: "ach-stack",
  class: "ach-stack",
  role: "status",
  "aria-live": "polite",
});
// A manual popover lives in the top layer, so popups stay visible above the
// full-screen easter egg and above modal dialogs.
if (typeof achStack.showPopover === "function")
  achStack.setAttribute("popover", "manual");
else achStack.classList.add("ach-fallback");
document.body.append(achStack);
// How long each achievement popup stays on screen, in milliseconds.
// When several are queued they speed up automatically (about 2/3 of this
// with 1-2 waiting, about 45% with 3 or more waiting).
const ACH_POPUP_MS = 6200;
const achQueue = [];
let achShowing = false;
function achPopup(a) {
  achQueue.push(a);
  achPump();
}
function achPump() {
  // Focus mode (distractions off): no popups. They stay unlocked and still
  // show up on the Progress page, they just aren't announced.
  if (focusButton.getAttribute("aria-pressed") === "true") {
    achQueue.length = 0;
    return;
  }
  if (achShowing || !achQueue.length) return;
  achShowing = true;
  const a = achQueue.shift(),
    backlog = achQueue.length,
    duration = Math.round(
      ACH_POPUP_MS * (backlog >= 3 ? 0.45 : backlog >= 1 ? 0.68 : 1),
    ),
    tier = ACH_KICKERS[a.tier] ? a.tier : "silver",
    reduced = reducedMotion.matches;
  try {
    achStack.hidePopover();
  } catch {}
  try {
    achStack.showPopover();
  } catch {}
  const sparks = reduced
    ? []
    : Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.35,
          distance = 52 + Math.random() * 62;
        return h("i", {
          class: "ach-spark",
          style: `--dx:${(Math.cos(angle) * distance).toFixed(1)}px;--dy:${(Math.sin(angle) * distance).toFixed(1)}px;--sd:${(Math.random() * 0.18).toFixed(2)}s;--ss:${(0.7 + Math.random() * 0.7).toFixed(2)}`,
        });
      });
  let timer = 0,
    closed = false,
    remaining = duration,
    armedAt = 0;
  const finish = () => {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    const done = () => {
      toast.remove();
      achShowing = false;
      setTimeout(achPump, 280);
    };
    toast.classList.add("ach-leaving");
    if (reduced) setTimeout(done, 200);
    else setTimeout(done, 480);
  };
  const arm = () => {
    armedAt = performance.now();
    timer = setTimeout(finish, remaining);
  };
  const toast = h(
    "div",
    {
      class: `ach-toast ach-tier-${tier}`,
      style: `--ach-dur:${duration}ms`,
      role: "group",
      "aria-label": `Achievement unlocked: ${a.title}`,
    },
    h("span", { class: "ach-glow", "aria-hidden": "true" }),
    h(
      "span",
      { class: "ach-clip", "aria-hidden": "true" },
      h("span", { class: "ach-shine" }),
      h("span", { class: "ach-timer" }),
    ),
    h(
      "div",
      { class: "ach-medal", "aria-hidden": "true" },
      h("span", { class: "ach-ring" }),
      h("span", { class: "ach-ring ach-ring-2" }),
      h("span", { class: "ach-icon" }, a.icon || "\u2605"),
      h("span", { class: "ach-burst" }, sparks),
    ),
    h(
      "div",
      { class: "ach-text" },
      h("span", { class: "ach-kicker" }, ACH_KICKERS[tier]),
      h("strong", { class: "ach-title" }, a.title),
      h("span", { class: "ach-detail" }, a.detail),
      a.flavor ? h("em", { class: "ach-flavor" }, a.flavor) : "",
    ),
    h(
      "button",
      {
        type: "button",
        class: "ach-close",
        "aria-label": "Dismiss achievement",
      },
      "\u00D7",
    ),
  );
  toast.addEventListener("click", finish);
  toast.addEventListener("pointerenter", () => {
    if (closed) return;
    clearTimeout(timer);
    remaining -= performance.now() - armedAt;
    toast.classList.add("ach-paused");
  });
  toast.addEventListener("pointerleave", () => {
    if (closed) return;
    toast.classList.remove("ach-paused");
    remaining = Math.max(remaining, 1500);
    arm();
  });
  achStack.append(toast);
  arm();
}

// ---------- content loading ----------
const compatibleManifest = (m) =>
  Boolean(m) &&
  typeof m === "object" &&
  Core.compatibleSchemaVersion(m.schemaVersion, 1);
// Turns a manifest map into [{ id, title, terms: [{ label, file }] }].
// Current format: `terms` is an ordered array of { file, name } and keeps the
// order written in the manifest. Still accepted: the older
// { "Term 1": { file } } object (sorted naturally, "Term 2" before "Term 10")
// and a single `file` entry (treated as "Term 1").
