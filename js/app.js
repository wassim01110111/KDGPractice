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
const loadingSkeleton = (text, sub = "") =>
  h(
    "div",
    { class: "loading-skeleton" },
    loadingNote(text),
    sub ? h("small", { class: "loading-sub" }, sub) : "",
  );
const uniq = (arr, f) =>
  [...new Set(arr.map(f).filter((x) => x !== undefined && x !== ""))].sort();
const courseLabel = (course) =>
  course === "sql" ? "SQL" : course === "os" ? "OS" : course;
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
    attempt = {
      key,
      packageId: ex.packageId,
      id: ex.id,
      t: Date.now(),
      correct,
      mode,
    };
  const prevAttempt = S.attempts.find((a) => a.key === key);
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
//    (easter eggs, Wassim sightings, reading time, failures, bad exams…).
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
    "🥚",
    "wassim",
    "Curious Clicker",
    "Open the Wassim easter egg",
    "You clicked the logo. Wassim noticed.",
    (s) => s.eggOpens,
    1,
  ),
  A(
    "egg-5",
    "🔓",
    "wassim",
    "Logo Enthusiast",
    "Open the easter egg 5 times",
    "It's still the same logo.",
    (s) => s.eggOpens,
    5,
  ),
  A(
    "egg-10",
    "🖱️",
    "wassim",
    "Compulsive Clicker",
    "Open the easter egg 10 times",
    "Doctors recommend a different hobby.",
    (s) => s.eggOpens,
    10,
  ),
  A(
    "egg-25",
    "💻",
    "wassim",
    "Root Access Regular",
    "Open the easter egg 25 times",
    "Wassim is learning your fingerprints.",
    (s) => s.eggOpens,
    25,
  ),
  A(
    "egg-50",
    "👑",
    "wassim",
    "Wassim's Biggest Fan",
    "Open the easter egg 50 times",
    "You've seen this more than the exam material.",
    (s) => s.eggOpens,
    50,
  ),
  A(
    "egg-100",
    "🌱",
    "platinum",
    "Please Touch Grass",
    "Open the easter egg 100 times",
    "The logo is not a stress ball.",
    (s) => s.eggOpens,
    100,
  ),
  A(
    "egg-memes",
    "🎞️",
    "gold",
    "Seen Every Secret",
    "See every different easter egg message",
    "You have now consumed all the lore.",
    (s) => s.eggMemes.length,
    achEggMessages,
  ),
  A(
    "egg-full",
    "⏳",
    "wassim",
    "Stayed for the Self-Destruct",
    "Let an easter egg play all the way through",
    "Respect. Nobody waits for the countdown.",
    (s) => s.eggFull,
    1,
  ),
  A(
    "egg-full-10",
    "🍿",
    "wassim",
    "Front Row Seat",
    "Watch 10 easter eggs play through",
    "Popcorn is on the house.",
    (s) => s.eggFull,
    10,
  ),
  A(
    "egg-skip",
    "⏭️",
    "bronze",
    "Skip Intro",
    "Close an easter egg early",
    "Wassim hates it when you do that.",
    (s) => s.eggSkips,
    1,
  ),
  A(
    "egg-quick",
    "🐟",
    "shame",
    "Goldfish Attention Span",
    "Close an easter egg within 1.5 seconds",
    "Not even a full second of root access.",
    (s) => s.eggQuickSkips,
    1,
  ),
  A(
    "sign",
    "🤝",
    "secret",
    "Secret Handshake",
    "Find the hidden distractions switch",
    "You clicked the sign five times. Nobody told you to.",
    (s) => s.signToggles,
    1,
    true,
  ),
  A(
    "zen-1",
    "🔕",
    "wassim",
    "Do Not Disturb",
    "Turn the distractions off",
    "You muted Wassim. Brave.",
    (s) => s.zenOn,
    1,
  ),
  A(
    "zen-10",
    "🧘",
    "silver",
    "Hermit Mode",
    "Turn the distractions off 10 times",
    "Peace and quiet, until the next signal.",
    (s) => s.zenOn,
    10,
  ),
  A(
    "theme-5",
    "💡",
    "silver",
    "Light Switch Enthusiast",
    "Toggle the theme 5 times",
    "Dark mode, light mode, dark mode…",
    (s) => s.themeToggles,
    5,
  ),
  A(
    "theme-25",
    "🌗",
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
    "👁️",
    "wassim",
    "Under Surveillance",
    "Get caught by WassimGPT's monitor",
    "WassimGPT has entered the chat.",
    (s) => s.watches,
    1,
  ),
  A(
    "watch-3",
    "🕵️",
    "wassim",
    "Familiar Face",
    "Get watched by Wassim 3 times",
    "He now knows your name.",
    (s) => s.watches,
    3,
  ),
  A(
    "watch-5",
    "🎯",
    "wassim",
    "Person of Interest",
    "Get watched by Wassim 5 times",
    "Your file is getting thick.",
    (s) => s.watches,
    5,
  ),
  A(
    "watch-10",
    "📹",
    "wassim",
    "Wassim's Favorite Subject",
    "Get watched by Wassim 10 times",
    "He has a folder just for you.",
    (s) => s.watches,
    10,
  ),
  A(
    "watch-25",
    "🏠",
    "wassim",
    "Live-in Roommate",
    "Get watched by Wassim 25 times",
    "At this point Wassim pays half the rent.",
    (s) => s.watches,
    25,
  ),
  A(
    "watch-50",
    "🛰️",
    "platinum",
    "Property of Wassim",
    "Get watched by Wassim 50 times",
    "There is no escape. There was never an escape.",
    (s) => s.watches,
    50,
  ),

  // ---- time spent in the references ----
  A(
    "ref-1m",
    "📖",
    "bronze",
    "Quick Skim",
    "Spend 1 minute in the references",
    "Reading is the first step.",
    (s) => s.refSeconds,
    60,
  ),
  A(
    "ref-5m",
    "📄",
    "bronze",
    "Page Turner",
    "Spend 5 minutes in the references",
    "The pages are warm now.",
    (s) => s.refSeconds,
    300,
  ),
  A(
    "ref-15m",
    "📑",
    "silver",
    "Chapter Closer",
    "Spend 15 minutes in the references",
    "One chapter down, who knows how many to go.",
    (s) => s.refSeconds,
    900,
  ),
  A(
    "ref-30m",
    "🐛",
    "silver",
    "Bookworm",
    "Spend 30 minutes in the references",
    "You are now technically a worm.",
    (s) => s.refSeconds,
    1800,
  ),
  A(
    "ref-1h",
    "🏛️",
    "gold",
    "Library Resident",
    "Spend 1 hour in the references",
    "The librarian knows your name.",
    (s) => s.refSeconds,
    3600,
  ),
  A(
    "ref-3h",
    "🛏️",
    "gold",
    "Has a Bed in the Library",
    "Spend 3 hours in the references",
    "Maybe go outside? Just a little?",
    (s) => s.refSeconds,
    10800,
  ),
  A(
    "ref-10h",
    "🧙",
    "platinum",
    "Reference Hermit",
    "Spend 10 hours in the references",
    "You've read this more closely than the author.",
    (s) => s.refSeconds,
    36000,
  ),
  A(
    "stay-10",
    "🤿",
    "silver",
    "Deep Dive",
    "Stay 10 minutes in the references without leaving",
    "Pressure at this depth is intense.",
    (s) => s.longestRefStay,
    600,
  ),
  A(
    "stay-30",
    "😴",
    "gold",
    "Unbothered",
    "Stay 30 minutes in the references without leaving",
    "Did you fall asleep on the keyboard?",
    (s) => s.longestRefStay,
    1800,
  ),
  A(
    "subjects-3",
    "🦘",
    "bronze",
    "Subject Hopper",
    "Open 3 different reference subjects",
    "Commitment issues, but academic.",
    (s) => s.refSubjects.length,
    3,
  ),
  A(
    "subjects-all",
    "🎫",
    "gold",
    "Library Card, Fully Stamped",
    "Open every reference subject",
    "You've been everywhere, man.",
    (s) => s.refSubjects.length,
    () => achSubjectCount("referenceFiles"),
  ),
  A(
    "canvas-5m",
    "🎨",
    "bronze",
    "Canvas Visitor",
    "Spend 5 minutes in Canvas",
    "Nice brushwork.",
    (s) => s.canvasSeconds,
    300,
  ),
  A(
    "canvas-30m",
    "🖼️",
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
    "⏱️",
    "bronze",
    "Settling In",
    "Spend 1 active hour on the site",
    "The chair is warm now.",
    (s) => s.activeSeconds,
    3600,
  ),
  A(
    "time-5h",
    "📚",
    "silver",
    "Dedicated",
    "Spend 5 active hours on the site",
    "This is starting to look like a habit.",
    (s) => s.activeSeconds,
    18000,
  ),
  A(
    "time-24h",
    "🏕️",
    "platinum",
    "Lives Here Now",
    "Spend 24 active hours on the site",
    "Your chair has a you-shaped dent.",
    (s) => s.activeSeconds,
    86400,
  ),
  A(
    "days-3",
    "🔥",
    "bronze",
    "Three-Day Streak",
    "Study 3 days in a row",
    "The fire has been lit.",
    (s) => s.bestDayStreak,
    3,
  ),
  A(
    "days-7",
    "📅",
    "silver",
    "Weekly Habit",
    "Study 7 days in a row",
    "A whole week. Look at you.",
    (s) => s.bestDayStreak,
    7,
  ),
  A(
    "days-14",
    "🌋",
    "gold",
    "Fortnight of Focus",
    "Study 14 days in a row",
    "Two weeks without skipping. Suspicious.",
    (s) => s.bestDayStreak,
    14,
  ),
  A(
    "days-30",
    "🏆",
    "platinum",
    "Habit Formed",
    "Study 30 days in a row",
    "Science says it's a habit now.",
    (s) => s.bestDayStreak,
    30,
  ),
  A(
    "night",
    "🦉",
    "silver",
    "Night Owl",
    "Answer a question between midnight and 5 am",
    "Sleep is just a suggestion.",
    (s) => s.nightAttempts,
    1,
  ),
  A(
    "night-25",
    "🧛",
    "gold",
    "Vampire Hours",
    "Answer 25 questions between midnight and 5 am",
    "The sun is your enemy now.",
    (s) => s.nightAttempts,
    25,
  ),
  A(
    "early",
    "🐦",
    "silver",
    "Early Bird",
    "Answer a question between 5 and 8 am",
    "You and the worm have a lot to discuss.",
    (s) => s.earlyAttempts,
    1,
  ),
  A(
    "weekend",
    "🛡️",
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
    "🎯",
    "bronze",
    "First Try",
    "Solve an exercise on the first attempt",
    "Beginner's luck? We'll see.",
    (s) => s.firstTry,
    1,
  ),
  A(
    "first-try-10",
    "🏹",
    "silver",
    "Sharpshooter",
    "Solve 10 exercises on the first attempt",
    "Measure twice, submit once.",
    (s) => s.firstTry,
    10,
  ),
  A(
    "first-try-25",
    "🥷",
    "gold",
    "Sniper Elite",
    "Solve 25 exercises on the first attempt",
    "One shot. One kill. Zero retries.",
    (s) => s.firstTry,
    25,
  ),
  A(
    "streak-5",
    "✨",
    "bronze",
    "Warming Up",
    "Get 5 correct answers in a row",
    "Don't jinx it.",
    (s) => s.bestCorrectStreak,
    5,
  ),
  A(
    "streak-10",
    "🔥",
    "silver",
    "Hot Streak",
    "Get 10 correct answers in a row",
    "Somebody call the fire department.",
    (s) => s.bestCorrectStreak,
    10,
  ),
  A(
    "streak-20",
    "⚡",
    "platinum",
    "Unstoppable",
    "Get 20 correct answers in a row",
    "Are you sure you're not Wassim?",
    (s) => s.bestCorrectStreak,
    20,
  ),
  A(
    "run-1",
    "▶️",
    "bronze",
    "Hello, Database",
    "Run your first SQL query",
    "SELECT 'hello' FROM world;",
    (s) => s.runs,
    1,
  ),
  A(
    "run-25",
    "🔍",
    "silver",
    "Query Enthusiast",
    "Run 25 SQL queries",
    "Your keyboard is starting to wear.",
    (s) => s.runs,
    25,
  ),
  A(
    "run-100",
    "🗃️",
    "gold",
    "SELECT * FROM life",
    "Run 100 SQL queries",
    "No WHERE clause. No regrets.",
    (s) => s.runs,
    100,
  ),
  A(
    "shortcut-10",
    "⌨️",
    "silver",
    "Keyboard Warrior",
    "Use Ctrl+Enter 10 times",
    "The mouse is feeling neglected.",
    (s) => s.shortcuts,
    10,
  ),
  A(
    "hint-1",
    "💡",
    "bronze",
    "Hint Taker",
    "Open a hint",
    "There's no shame in asking. Mostly.",
    (s) => s.hints,
    1,
  ),
  A(
    "hint-10",
    "🆘",
    "silver",
    "Hint Addict",
    "Open hints on 10 exercises",
    "They're free. For now.",
    (s) => s.hints,
    10,
  ),
  A(
    "peek-1",
    "👀",
    "bronze",
    "Just Looking",
    "Peek at a solution",
    "We won't tell. (Wassim will.)",
    (s) => s.solutionPeeks,
    1,
  ),
  A(
    "peek-10",
    "🏺",
    "silver",
    "Answer Key Archaeologist",
    "Peek at 10 solutions",
    "You're digging in the wrong place, but a lot.",
    (s) => s.solutionPeeks,
    10,
  ),
  A(
    "honest",
    "😇",
    "silver",
    "Honest Abe",
    "Mark a self-check answer as wrong",
    "Integrity: 100. Score: ouch.",
    (s) => s.selfWrong,
    1,
  ),
  A(
    "redemption",
    "🌅",
    "gold",
    "Redemption Arc",
    "Solve an exercise right after 3+ wrong answers",
    "Every hero has a low point.",
    (s) => s.redemptions,
    1,
  ),
  A(
    "comeback-1",
    "🩹",
    "silver",
    "Learned From Mistakes",
    "Solve an exercise you failed earlier this session",
    "Failure was just the tutorial.",
    (s) => s.comebacks,
    1,
  ),
  A(
    "comeback-10",
    "🦾",
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
    "💥",
    "shame",
    "Task Failed Successfully",
    "Submit an incorrect answer",
    "Welcome to the club.",
    (s) => s.fails,
    1,
  ),
  A(
    "fail-5",
    "📉",
    "shame",
    "Learning Experience",
    "Submit 5 incorrect answers",
    "Five wrong answers. Education is happening.",
    (s) => s.fails,
    5,
  ),
  A(
    "fail-10",
    "💡",
    "shame",
    "Ten Ways That Don't Work",
    "Submit 10 incorrect answers",
    "Edison would be proud. Edison would also read the question.",
    (s) => s.fails,
    10,
  ),
  A(
    "fail-25",
    "🗑️",
    "shame",
    "Error Collector",
    "Submit 25 incorrect answers",
    "Gotta catch 'em all.",
    (s) => s.fails,
    25,
  ),
  A(
    "fail-50",
    "🎪",
    "shame",
    "Failure Is an Option",
    "Submit 50 incorrect answers",
    "NASA would like a word.",
    (s) => s.fails,
    50,
  ),
  A(
    "fail-100",
    "🖼️",
    "shame",
    "Certified Disappointment",
    "Submit 100 incorrect answers",
    "Wassim has framed this one.",
    (s) => s.fails,
    100,
  ),
  A(
    "fail-250",
    "🏅",
    "shame",
    "Professional Failure",
    "Submit 250 incorrect answers",
    "At this point it's a career.",
    (s) => s.fails,
    250,
  ),
  A(
    "fstreak-3",
    "🎩",
    "shame",
    "Hat Trick of Shame",
    "Get 3 wrong answers in a row",
    "Three in a row. Impressive, in the wrong direction.",
    (s) => s.bestFailStreak,
    3,
  ),
  A(
    "fstreak-5",
    "🥶",
    "shame",
    "Cold Streak",
    "Get 5 wrong answers in a row",
    "The answer key is crying in a corner.",
    (s) => s.bestFailStreak,
    5,
  ),
  A(
    "fstreak-10",
    "🧐",
    "shame",
    "Are You Even Reading?",
    "Get 10 wrong answers in a row",
    "The question is right above the text box.",
    (s) => s.bestFailStreak,
    10,
  ),
  A(
    "sql-1",
    "🙅",
    "shame",
    "Syntax? Never Heard of Her",
    "Submit a query that throws an error",
    "SQLite is not impressed.",
    (s) => s.sqlErrors,
    1,
  ),
  A(
    "sql-10",
    "🔎",
    "shame",
    "Semicolon Search Party",
    "Submit 10 queries that throw errors",
    "Have you tried looking at the commas?",
    (s) => s.sqlErrors,
    10,
  ),
  A(
    "sql-25",
    "😱",
    "shame",
    "The Parser Fears You",
    "Submit 25 queries that throw errors",
    "SQLite has filed a formal complaint.",
    (s) => s.sqlErrors,
    25,
  ),
  A(
    "same-3",
    "🔁",
    "shame",
    "Same Mistake, Different Day",
    "Fail the same exercise 3 times in a session",
    "The definition of insanity, allegedly.",
    (s) => s.maxSameFails,
    3,
  ),
  A(
    "same-5",
    "🐐",
    "shame",
    "Stubborn as a Mule",
    "Fail the same exercise 5 times in a session",
    "Maybe… read the hint?",
    (s) => s.maxSameFails,
    5,
  ),
  A(
    "peek-fail",
    "🤦",
    "shame",
    "Looked and Still Failed",
    "Fail an exercise after opening a hint or solution",
    "You had the answer on screen. And yet.",
    (s) => s.peekedFails,
    1,
  ),
  A(
    "blank",
    "🫥",
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
    "🧯",
    "shame",
    "Failing With Style",
    "Score below 50% on an exam",
    "Failed, but make it fashion.",
    (s) => s.badExams,
    1,
  ),
  A(
    "exam-bad-3",
    "🗓️",
    "shame",
    "Retake Specialist",
    "Score below 50% on 3 exams",
    "The resit office has your number on speed dial.",
    (s) => s.badExams,
    3,
  ),
  A(
    "exam-bad-10",
    "🎟️",
    "shame",
    "Resit Season Pass",
    "Score below 50% on 10 exams",
    "Frequent flyer miles at the registrar.",
    (s) => s.badExams,
    10,
  ),
  A(
    "exam-zero",
    "🥚",
    "shame",
    "Zero Hero",
    "Score 0 on an exam (3+ questions)",
    "Getting every single one wrong takes talent. Truly.",
    (s) => s.zeroExams,
    1,
  ),
  A(
    "exam-guess",
    "🐒",
    "shame",
    "Worse Than Guessing",
    "Score below 25% on an exam (4+ questions)",
    "A monkey with a keyboard would have done better. Probably faster too.",
    (s) => s.guessingExams,
    1,
  ),
  A(
    "exam-half",
    "⚖️",
    "silver",
    "Perfectly Balanced",
    "Score exactly 50% on an exam",
    "As all things should be.",
    (s) => s.halfExams,
    1,
  ),
  A(
    "exam-scrape",
    "🧗",
    "bronze",
    "Pass by a Whisker",
    "Score 50–59% on an exam",
    "Technically a pass. Technically.",
    (s) => s.scrapeExams,
    1,
  ),
  A(
    "exam-bstreak-2",
    "🎲",
    "shame",
    "Doubling Down",
    "Score below 50% on 2 exams in a row",
    "Doing the same thing and expecting different results.",
    (s) => s.bestBadExamStreak,
    2,
  ),
  A(
    "exam-bstreak-3",
    "🪦",
    "shame",
    "Hat Trick of Regret",
    "Score below 50% on 3 exams in a row",
    "Rest in peace, GPA.",
    (s) => s.bestBadExamStreak,
    3,
  ),
  A(
    "exam-decline",
    "⛷️",
    "shame",
    "Downhill Skiing",
    "Score lower on 3 exams in a row",
    "Weeeeeee!",
    (s) => s.bestDeclineStreak,
    3,
  ),
  A(
    "exam-speed-fail",
    "🏃",
    "shame",
    "Speedrun Any%",
    "Fail a 5+ question exam in under a minute",
    "Reading the questions is optional, apparently.",
    (s) => s.speedFails,
    1,
  ),
  A(
    "exam-blank",
    "📄",
    "shame",
    "Blank Page Energy",
    "Submit an exam with no answers",
    "You handed in a blank paper. Bold. Even your name is missing.",
    (s) => s.blankExams,
    1,
  ),
  A(
    "exam-timeout",
    "⌛",
    "shame",
    "Time Waits for No One",
    "Let the exam timer run out",
    "The clock won. The clock always wins.",
    (s) => s.timeouts,
    1,
  ),
  A(
    "exam-quit-1",
    "🏳️",
    "shame",
    "Rage Quit",
    "Discard an unfinished exam",
    "It's fine, we all flip a table sometimes.",
    (s) => s.discards,
    1,
  ),
  A(
    "exam-quit-5",
    "🫠",
    "shame",
    "Exam? What Exam?",
    "Discard 5 unfinished exams",
    "You can't fail what you never finish.",
    (s) => s.discards,
    5,
  ),
  A(
    "exam-comeback",
    "🚀",
    "gold",
    "Comeback Kid",
    "Score 80%+ right after an exam under 40%",
    "From the depths to the heights.",
    (s) => s.examComebacks,
    1,
  ),
  A(
    "exam-speed-perfect",
    "😎",
    "platinum",
    "Speed Demon",
    "Get a perfect score using under half the time",
    "Did you even need the time limit?",
    (s) => s.speedPerfects,
    1,
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
      h("span", { class: "ach-icon" }, a.icon || "★"),
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
      "×",
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
function normalizeLibrary(map) {
  return Object.entries(map || {}).map(([id, entry]) => {
    let terms;
    if (Array.isArray(entry?.terms)) {
      terms = entry.terms.map((t, i) =>
        typeof t === "string"
          ? { label: `Term ${i + 1}`, file: t }
          : { label: t?.name ?? t?.label ?? `Term ${i + 1}`, file: t?.file },
      );
    } else if (entry?.terms && typeof entry.terms === "object") {
      terms = Object.entries(entry.terms)
        .map(([label, t]) => ({
          label,
          file: typeof t === "string" ? t : t?.file,
        }))
        .sort((x, y) =>
          x.label.localeCompare(y.label, undefined, { numeric: true }),
        );
    } else terms = entry?.file ? [{ label: "Term 1", file: entry.file }] : [];
    return { ...entry, id, terms: terms.filter((t) => t.file) };
  });
}
async function loadContent() {
  S.exercises = [];
  S.datasets = {};
  S.errors = [];
  S.packages = [];

  const ctx = {
    seenIds: new Set(),
    datasetIds: new Set(),
    schemaVersion: 1,
  };

  const files = [];

  try {
    const manifest = await (await fetch("content/manifest.json")).json();

    if (!compatibleManifest(manifest))
      throw new Error(
        `Incompatible manifest schema version ${manifest.schemaVersion}; supported: ${ctx.schemaVersion}`,
      );

    // packages, referenceFiles and canvasFiles are objects keyed by ID. The
    // last two hold per-term files: { title, terms: { "Term 1": { file } } }.
    S.manifest = {
      ...manifest,
      referenceFiles: normalizeLibrary(manifest.referenceFiles),
      canvasFiles: normalizeLibrary(manifest.canvasFiles),
    };

    for (const [manifestId, entry] of Object.entries(manifest.packages || {})) {
      for (const f of entry.files || []) {
        try {
          const r = await fetch("content/" + f);

          if (!r.ok) throw new Error("HTTP " + r.status);

          const pkg = await r.json();

          files.push({
            name: "content/" + f,
            src: "bundled",
            // The package file's own packageId/version win; the manifest
            // entry fills them in when the file omits them.
            pkg: {
              packageId: manifestId,
              version: entry.version,
              ...pkg,
            },
          });
        } catch (e) {
          S.errors.push({
            file: "content/" + f,
            id: "(file)",
            field: "$",
            msg: "Cannot load or parse: " + e.message,
          });
        }
      }
    }
  } catch (e) {
    S.errors.push({
      file: "content/manifest.json",
      id: "(manifest)",
      field: "$",
      msg: e.message,
    });

    S.manifest = {
      packages: {},
      referenceFiles: [],
      canvasFiles: [],
    };
  }

  for (const p of await kv.get("imported", [])) {
    files.push({
      name: p.name,
      src: "imported",
      pkg: p.pkg,
    });
  }

  for (const f of files) addPackage(f, ctx);

  const storedAttempts = await kv.get("attempts", []);

  const exercisesById = new Map();

  for (const ex of S.exercises) {
    if (!exercisesById.has(ex.id)) {
      exercisesById.set(ex.id, []);
    }

    exercisesById.get(ex.id).push(ex);
  }

  const exercisesByKey = new Map(S.exercises.map((ex) => [keyOf(ex), ex]));

  const latest = new Map();

  for (const a of storedAttempts) {
    if (a && typeof a.id === "string") {
      const ex =
        typeof a.key === "string"
          ? exercisesByKey.get(a.key)
          : exercisesById.get(a.id)?.length === 1
            ? exercisesById.get(a.id)[0]
            : null;

      const key = ex ? keyOf(ex) : typeof a.key === "string" ? a.key : null;

      if (key && (!latest.has(key) || a.t >= latest.get(key).t)) {
        latest.set(key, {
          key,
          packageId: ex?.packageId || a.packageId,
          id: ex?.id || a.id,
          t: a.t,
          correct: a.correct,
          mode: a.mode,
        });
      }
    }
  }

  S.attempts = [...latest.values()];

  const savedRewards = await kv.get("xpRewards", {});

  S.xpRewards =
    savedRewards &&
    typeof savedRewards === "object" &&
    !Array.isArray(savedRewards)
      ? savedRewards
      : {};

  let migratedRewards = false;

  for (const a of S.attempts) {
    const ex = exercisesByKey.get(a.key);

    if (a.correct && ex && !S.xpRewards[a.key]) {
      S.xpRewards[a.key] = {
        xp: xpFor(ex),
        difficulty: ex.difficulty,
        earnedAt: a.t,
      };

      migratedRewards = true;
    }
  }

  if (migratedRewards) {
    await kv.set("xpRewards", S.xpRewards);
  }

  if (S.attempts.length) {
    await kv.set("attempts", S.attempts);
  } else if (storedAttempts.length) {
    await kv.del("attempts");
  }

  S.drafts = {};

  await Promise.all(
    S.exercises.map(async (ex) => {
      const key = keyOf(ex);

      let answer = await kv.get("draft:" + key, undefined);

      if (answer === undefined && exercisesById.get(ex.id)?.length === 1) {
        answer = await kv.get("draft:" + ex.id, undefined);

        if (answer !== undefined) {
          await kv.set("draft:" + key, answer);
          await kv.del("draft:" + ex.id);
        }
      }

      if (answer !== undefined) {
        S.drafts[key] = answer;
      }
    }),
  );
}
function addPackage(f, ctx) {
  const c = {
    ...ctx,
    seenIds: new Set(ctx.seenIds),
    datasetIds: new Set(ctx.datasetIds),
  };

  const pkg = f.pkg;

  const errs = validatePackage(pkg, f.name, c);

  if (errs.length) {
    S.errors.push(...errs);
    return errs;
  }

  ctx.seenIds = c.seenIds;

  // Datasets and exercises are objects keyed by ID; the key becomes `id`.
  for (const [id, d] of Object.entries(pkg.datasets || {})) {
    S.datasets[id] = { ...d, id };
    ctx.datasetIds.add(id);
  }

  // `term` belongs to the package, so copy it onto every exercise to make
  // filtering cheap and consistent for bundled and imported packages.
  const packageTerm = Number.isInteger(pkg.term) ? pkg.term : null;
  const exercises = Object.entries(pkg.exercises || {}).map(([id, ex]) => ({
    ...ex,
    id,
    term: packageTerm,
    packageId: pkg.packageId,
    key: exerciseKey({ id }, pkg.packageId),
  }));
  S.exercises.push(...exercises);

  S.packages.push({
    name: f.name,
    src: f.src,
    id: pkg.packageId,
    version: pkg.version,
    term: packageTerm,
    n: exercises.length,
  });

  Object.assign(ctx, {
    seenIds: c.seenIds,
    datasetIds: c.datasetIds,
  });

  return [];
}

// ---------- SQL engine ----------
// PGlite runs in a dedicated Web Worker (see pglite-loader.js). Keep complete
// dataset operations in a single queue: the worker owns one PostgreSQL
// connection, and a reset + dataset setup + query must never interleave with
// another exercise's work.
let databaseQueue = Promise.resolve();
const preparedDatasets = new Set();
async function engine() {
  await (window.pgliteReady ||
    Promise.reject(new Error("PGlite worker loader missing")));
  if (!window.PGlite) throw new Error("PGlite worker is unavailable");
  return window.PGlite;
}
async function resetDatabase(db, ds) {
  // Recreate the public schema for each operation so student SQL and reference
  // SQL always run against a clean copy of the selected exercise dataset.
  await db.exec("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
  await db.exec(ds.sql);
  preparedDatasets.add(ds.id + "@" + ds.version);
}
function withFreshDb(ds, task) {
  const operation = databaseQueue.then(async () => {
    const db = await engine();
    await resetDatabase(db, ds);
    return task(db);
  });
  // Keep the queue usable after a failed query/setup while returning the
  // original rejection to the caller.
  databaseQueue = operation.catch(() => {});
  return operation;
}
const dbIsWarm = (ex) => {
  const ds = S.datasets[ex.datasetId];
  return !!(ds && preparedDatasets.has(ds.id + "@" + ds.version));
};
function describeSqlError(e, sql) {
  let msg = e.message;
  const pos = parseInt(e.position, 10);
  if (Number.isFinite(pos) && pos > 0) {
    const before = sql.slice(0, pos - 1);
    const line = before.split("\n").length;
    const col = pos - 1 - before.lastIndexOf("\n"); // 1-based
    const text = sql.split("\n")[line - 1] ?? "";
    msg += `\n\nLine ${line}, column ${col}:\n${text}\n${" ".repeat(col - 1)}^`;
  }
  if (e.hint) msg += `\n\nHint: ${e.hint}`;
  return msg;
}
async function runSql(db, sql) {
  const r = await db.query(sql, [], { rowMode: "array" });
  return { fields: r.fields, rows: r.rows };
}
const KINDS = {
  SELECT: /^(select|with|values|table)\b/i,
  DML: /^(insert|update|delete)\b/i,
  DDL: /^(create|drop|alter|truncate)\b/i,
};
function checkKind(ex, sql) {
  const ok = ex.allowedStatementKinds || ["SELECT"],
    s = sql.replace(/^\s*(--.*\n|\/\*[\s\S]*?\*\/|\s)*/, "");
  if (!ok.some((k) => KINDS[k] && KINDS[k].test(s)))
    throw new Error(
      `Only ${ok.join("/")} statements are allowed for this exercise. Run one statement at a time.`,
    );
}
async function runStudent(ex, sql) {
  checkKind(ex, sql);
  const t0 = performance.now();
  const res = await withFreshDb(S.datasets[ex.datasetId], (db) =>
    runSql(db, sql),
  );
  return { res, ms: Math.round(performance.now() - t0) };
}
async function gradeSql(ex, sql) {
  const ds = S.datasets[ex.datasetId],
    t0 = performance.now();
  try {
    checkKind(ex, sql);
  } catch (e) {
    return { correct: false, error: e.message };
  }
  return withFreshDb(ds, async (db) => {
    const t1 = performance.now();
    let s, r;
    try {
      s = { status: "fulfilled", value: await runSql(db, sql) };
    } catch (reason) {
      s = { status: "rejected", reason };
    }
    // Run the reference query on a freshly restored dataset in the same
    // worker, rather than trying to open a second main-thread database.
    await resetDatabase(db, ds);
    try {
      r = {
        status: "fulfilled",
        value: await runSql(db, ex.referenceSolution),
      };
    } catch (reason) {
      r = { status: "rejected", reason };
    }
    if (r.status === "rejected")
      return {
        correct: false,
        error:
          s.status === "rejected"
            ? describeSqlError(s.reason, sql)
            : describeSqlError(r.reason, ex.referenceSolution),
      };
    if (s.status === "rejected")
      return { correct: false, error: s.reason.message };
    const cmp = compare(s.value, r.value, ex);
    return {
      correct: cmp.ok,
      cmp,
      res: s.value,
      setupMs: Math.round(t1 - t0),
      totalMs: Math.round(performance.now() - t0),
    };
  });
}
// ---------- rendering helpers ----------
function table(r, max = 200) {
  if (!r.fields.length) return h("small", {}, "Statement ran; no result set.");
  const fmt = (v) =>
    v === null
      ? "NULL"
      : v instanceof Date
        ? v.toISOString()
        : typeof v === "object"
          ? JSON.stringify(v)
          : String(v);
  return h(
    "div",
    { class: "tw" },
    h(
      "table",
      {},
      h(
        "tr",
        {},
        r.fields.map((f) => h("th", {}, f.name)),
      ),
      r.rows.slice(0, max).map((row) =>
        h(
          "tr",
          {},
          row.map((v) => h("td", { class: v === null ? "meta" : "" }, fmt(v))),
        ),
      ),
    ),
    h(
      "small",
      {},
      `${r.rows.length} row(s)` +
        (r.rows.length > max ? ` (first ${max} shown)` : ""),
    ),
  );
}
function diffView(c) {
  if (c.ok) return "";
  return h(
    "div",
    {},
    h("p", { class: "bad" }, c.reason),
    c.missing && c.missing.length
      ? h(
          "details",
          { open: true },
          h(
            "summary",
            {},
            `Expected but not in your result (${c.missing.length}${c.missing.length >= 20 ? "+" : ""})`,
          ),
          h("pre", {}, c.missing.join("\n")),
        )
      : "",
    c.extra && c.extra.length
      ? h(
          "details",
          { open: true },
          h(
            "summary",
            {},
            `In your result but not expected (${c.extra.length}${c.extra.length >= 20 ? "+" : ""})`,
          ),
          h("pre", {}, c.extra.join("\n")),
        )
      : "",
  );
}

const formatSQL = (sql) => {
  const keywords = new Set([
    "SELECT",
    "FROM",
    "JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "FULL JOIN",
    "INNER JOIN",
    "CROSS JOIN",
    "OUTER JOIN",
    "ON",
    "WHERE",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "FETCH",
    "UNION",
    "UNION ALL",
    "INTERSECT",
    "EXCEPT",
    "WITH",
    "INSERT INTO",
    "VALUES",
    "UPDATE",
    "SET",
    "DELETE FROM",
    "RETURNING",
    "QUALIFY",
  ]);

  const logical = new Set(["AND", "OR"]);

  // Normalize whitespace without modifying quoted strings.
  const tokens =
    sql.match(
      /'(?:''|[^'])*'|"(?:[^"]|"")*"|`(?:``|[^`])*`|\[(?:[^\]])*\]|--[^\n]*|\/\*[\s\S]*?\*\/|[(),;]|[^\s(),;]+/g,
    ) || [];

  let result = "";
  let depth = 0;
  let indent = 0;
  let previous = "";
  let inCase = 0;

  const add = (text) => {
    result += text;
  };

  const newline = (level = depth) => {
    result = result.trimEnd() + "\n" + "    ".repeat(Math.max(0, level));
  };

  const isWord = (token) => /^[a-z_][\w$]*$/i.test(token);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const upper = token.toUpperCase();
    const next = tokens[i + 1] || "";
    const nextUpper = next.toUpperCase();

    // Comments
    if (token.startsWith("--") || token.startsWith("/*")) {
      add(" " + token);
      continue;
    }

    // Parentheses
    if (token === "(") {
      add("(");
      depth++;
      previous = token;
      continue;
    }

    if (token === ")") {
      depth = Math.max(0, depth - 1);
      add(")");
      previous = token;
      continue;
    }

    // Commas
    if (token === ",") {
      add(",");
      newline(depth);
      previous = token;
      continue;
    }

    // Semicolons
    if (token === ";") {
      add(";");
      newline(0);
      previous = token;
      continue;
    }

    // CASE expressions
    if (upper === "CASE") {
      inCase++;
    }

    if (upper === "END") {
      inCase = Math.max(0, inCase - 1);
    }

    // Multi-word SQL clauses
    const twoWords = `${upper} ${nextUpper}`;
    const threeWords = `${twoWords} ${(tokens[i + 2] || "").toUpperCase()}`;

    let clause = null;
    let consumed = 0;

    if (keywords.has(threeWords)) {
      clause = threeWords;
      consumed = 2;
    } else if (keywords.has(twoWords)) {
      clause = twoWords;
      consumed = 1;
    } else if (keywords.has(upper)) {
      clause = upper;
    }

    // Only format structural clauses at top level.
    // This prevents EXTRACT(... FROM ...) and nested subqueries
    // from being mistaken for outer SQL clauses.
    if (clause && depth === 0) {
      newline(0);
      add(clause);
      i += consumed;
      add(" ");
      previous = clause;
      continue;
    }

    // AND / OR inside WHERE, HAVING, JOIN conditions, etc.
    if (logical.has(upper) && depth === 0 && !inCase) {
      newline(1);
      add(upper + " ");
      previous = upper;
      continue;
    }

    // Normal tokens
    if (
      result &&
      !result.endsWith(" ") &&
      !result.endsWith("\n") &&
      ![".", "::"].includes(token) &&
      previous !== "("
    ) {
      add(" ");
    }

    add(token);
    previous = token;
  }

  return result.replace(/\n{3,}/g, "\n\n").trim();
};

// Canvas-only: formats a whole ```sql block. formatSQL() alone would glue
// comments to the following code, so comment-only lines stay on their own
// line and trailing "-- ..." comments are moved below their statement.
const formatCanvasSQL = (block) => {
  const out = [];
  let chunk = [],
    trailing = [];
  const flush = () => {
    if (chunk.length) out.push(formatSQL(chunk.join("\n")));
    trailing.forEach((c) => out.push(c));
    chunk = [];
    trailing = [];
  };
  const commentStart = (line) => {
    let quote = "";
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quote) {
        if (c === quote) quote = "";
      } else if (c === "'" || c === '"' || c === "`") quote = c;
      else if (c === "-" && line[i + 1] === "-") return i;
    }
    return -1;
  };
  for (const line of block.replace(/\r/g, "").split("\n")) {
    const t = line.trim();
    if (!t) {
      flush();
      continue;
    }
    if (t.startsWith("--")) {
      flush();
      out.push(t);
      continue;
    }
    const at = commentStart(line);
    if (at > 0) {
      chunk.push(line.slice(0, at));
      trailing.push(line.slice(at).trim());
    } else chunk.push(line);
    if (chunk.length && chunk[chunk.length - 1].trimEnd().endsWith(";"))
      flush();
  }
  flush();
  return out.join("\n");
};

// Syntax colouring for fenced code blocks in the markdown pages (Canvas and
// Reference). One small tokenizer, configured per language in CODE_LANGS.
// Output is <span class="tok-…"> markup; colours are injected once (light+dark).
const CODE_LANGS = {};
(() => {
  const R = String.raw;
  const words = (s) => new Set(s.trim().split(/\s+/).filter(Boolean));
  const DQ = R`"(?:\\.|[^"\\\n])*"`,
    SQ = R`'(?:\\.|[^'\\\n])*'`,
    CH = R`'(?:\\[^'\n]+|[^'\\\n])'`,
    BT = R`\`(?:\\[\s\S]|[^\`\\])*\``,
    TQ = R`"""[\s\S]*?"""|'''[\s\S]*?'''`,
    NUM = R`\b(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[fFdDlLuU]*)\b`;
  const strRule = { dq: DQ, sq: SQ, ch: CH, bt: BT, tq: TQ };
  // Builds a rule list for a C-style / scripting language.
  const mk = (o) => {
    const rules = [...(o.extra || [])];
    if (o.block !== false) rules.push(["com", R`/\*[\s\S]*?\*/`]);
    for (const p of o.line || ["//"]) rules.push(["com", p + R`[^\n]*`]);
    const pre = o.prefix ? R`(?:[rRbBfFuU]{1,2})?` : "";
    for (const k of (o.str || "dq sq").split(" "))
      rules.push(["str", pre + `(?:${strRule[k]})`]);
    if (o.ann !== false) rules.push(["ann", R`@[A-Za-z_][\w.]*`]);
    rules.push(["num", NUM]);
    rules.push(["word", R`[A-Za-z_$][\w$]*`]);
    if (o.op)
      rules.push(["op", R`::|->|=>|<>|!=|<=|>=|\|\||&&|[=<>+\-*/%!&|^~?:]`]);
    return {
      rules,
      kws: words(o.kw),
      lits: words(o.lit || ""),
      ci: !!o.ci,
      types: o.types !== false,
      fnKw: words(o.fnKw || ""),
    };
  };
  const def = (names, cfg) =>
    names.split(" ").forEach((n) => (CODE_LANGS[n] = cfg));
  const plain = (rules) => ({
    rules,
    kws: new Set(),
    lits: new Set(),
    ci: false,
    types: false,
    fnKw: new Set(),
  });

  def(
    "js javascript jsx mjs cjs ts typescript tsx",
    mk({
      kw: `break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return super switch this throw try typeof var void while with yield async await static get set from as type interface enum implements public private protected readonly abstract declare namespace keyof`,
      lit: "true false null undefined NaN Infinity",
      str: "dq sq bt",
    }),
  );
  def(
    "java",
    mk({
      kw: `abstract assert break case catch class const continue default do else enum extends final finally for goto if implements import instanceof interface native new package private protected public return static strictfp super switch synchronized this throw throws transient try volatile while var record sealed permits yield boolean byte char double float int long short void`,
      lit: "true false null",
      str: "tq dq ch",
    }),
  );
  def(
    "python py",
    mk({
      kw: `and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case`,
      lit: "True False None",
      line: ["#"],
      block: false,
      str: "tq dq sq",
      prefix: true,
    }),
  );
  const cKw = `auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while`;
  def(
    "c h",
    mk({
      kw: cKw,
      lit: "true false NULL",
      str: "dq ch",
      ann: false,
      extra: [["ann", R`#\s*[a-z]+\b`]],
    }),
  );
  def(
    "cpp c++ cc cxx hpp",
    mk({
      kw: `${cKw} alignas alignof and bool catch class constexpr const_cast decltype delete dynamic_cast explicit export false friend mutable namespace new noexcept not nullptr operator or override private protected public reinterpret_cast static_assert static_cast template this throw true try typeid typename using virtual final`,
      lit: "true false NULL nullptr",
      str: "dq ch",
      ann: false,
      extra: [["ann", R`#\s*[a-z]+\b`]],
    }),
  );
  def(
    "csharp cs c#",
    mk({
      kw: `abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw try typeof uint ulong unchecked unsafe ushort using var virtual void volatile while async await record init get set yield`,
      lit: "true false null",
      str: "dq ch",
      ann: false,
    }),
  );
  def(
    "go golang",
    mk({
      kw: `break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var`,
      lit: "true false nil iota",
      str: "dq bt ch",
      ann: false,
    }),
  );
  def(
    "rust rs",
    mk({
      kw: `as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait type unsafe use where while`,
      lit: "true false",
      str: "dq ch",
      ann: false,
    }),
  );
  def(
    "php",
    mk({
      kw: `abstract and array as break case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile extends final finally fn for foreach function global if implements include include_once instanceof interface isset list match namespace new or print private protected public require require_once return static switch throw trait try unset use var while xor yield`,
      lit: "true false null",
      line: ["//", "#"],
      ci: true,
      ann: false,
      extra: [["id", R`\$[A-Za-z_]\w*`]],
    }),
  );
  def(
    "ruby rb",
    mk({
      kw: `alias and begin break case class def defined do else elsif end ensure for if in module next not or redo rescue retry return self super then undef unless until when while yield`,
      lit: "true false nil",
      line: ["#"],
      block: false,
      extra: [["id", R`(?<!:):[A-Za-z_]\w*`]],
    }),
  );
  def(
    "kotlin kt",
    mk({
      kw: `as break class continue do else for fun if in interface is object package return super this throw try typealias val var when while by catch constructor finally get import init set where abstract annotation companion const data enum final infix inline inner internal lateinit open operator out override private protected public reified sealed suspend tailrec vararg`,
      lit: "true false null",
      str: "tq dq ch",
    }),
  );
  def(
    "swift",
    mk({
      kw: `associatedtype class deinit enum extension fileprivate func import init inout internal let open operator private protocol public rethrows static struct subscript typealias var break case catch continue default defer do else fallthrough for guard if in repeat return throw switch where while as await is self Self super throws try async`,
      lit: "true false nil",
      str: "tq dq",
    }),
  );
  def(
    "bash sh shell zsh",
    mk({
      kw: `if then else elif fi for while do done case esac in function select until return exit export local readonly echo cd source alias unset`,
      line: ["#"],
      block: false,
      ann: false,
      types: false,
      extra: [["id", R`\$(?:\{[^}\n]*\}|[A-Za-z_]\w*|[0-9@#?*!$-])`]],
    }),
  );
  def(
    "sql postgresql psql",
    mk({
      kw: `select distinct from where and or not in is null like ilike between exists join left right full inner outer cross natural on using group by order having limit offset fetch first next rows row only with as union all intersect except case when then else end asc desc nulls last create table insert into values update set delete drop alter add primary key foreign references default check unique view index true false any some over partition filter interval cast returning`,
      fnKw: "left right",
      line: ["--"],
      str: "sq",
      ann: false,
      ci: true,
      op: true,
      types: false,
      extra: [["id", R`"(?:""|[^"])*"`]],
    }),
  );
  def(
    "json jsonc",
    plain([
      ["attr", DQ + R`(?=\s*:)`],
      ["str", DQ],
      ["num", NUM],
      ["lit", R`\b(?:true|false|null)\b`],
    ]),
  );
  def(
    "yaml yml",
    plain([
      ["com", R`#[^\n]*`],
      ["attr", R`[\w.-]+(?=\s*:(?:\s|$))`],
      ["str", DQ],
      ["str", SQ],
      ["num", NUM],
      ["lit", R`\b(?:true|false|null|yes|no)\b`],
    ]),
  );
  def(
    "html xml svg",
    plain([
      ["com", R`<!--[\s\S]*?-->`],
      ["tag", R`</?[A-Za-z][\w:-]*|/?>`],
      ["attr", R`[A-Za-z_:@][\w:.@-]*(?=\s*=)`],
      ["str", DQ],
      ["str", SQ],
    ]),
  );
  def(
    "css scss",
    plain([
      ["com", R`/\*[\s\S]*?\*/`],
      ["ann", R`@[\w-]+`],
      ["str", DQ],
      ["str", SQ],
      [
        "num",
        R`#[\da-fA-F]{3,8}\b|(?<![\w-])-?(?:\d*\.)?\d+(?:px|r?em|%|vh|vw|vmin|vmax|ms|s|deg|fr|ch|pt)?(?!\w)`,
      ],
      ["attr", R`[A-Za-z-]+(?=\s*:)`],
      ["type", R`[.#][A-Za-z_-][\w-]*`],
    ]),
  );
})();

function highlightCode(text, lang) {
  const cfg = CODE_LANGS[lang];
  if (!cfg) return null;
  if (!cfg.re) {
    cfg.kinds = cfg.rules.map((r) => r[0]);
    cfg.re = new RegExp(cfg.rules.map((r) => `(${r[1]})`).join("|"), "g");
  }
  const esc = (v) =>
    v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const span = (kind, t) => `<span class="tok-${kind}">${esc(t)}</span>`;
  const classify = (w, rest) => {
    const key = cfg.ci ? w.toLowerCase() : w;
    if (cfg.kws.has(key))
      return cfg.fnKw.has(key) && /^\(/.test(rest) ? "fn" : "kw";
    if (cfg.lits.has(w)) return "lit";
    if (/^\s*\(/.test(rest)) return "fn";
    if (cfg.types && /^[A-Z][a-z\d]/.test(w)) return "type";
    return null;
  };
  const re = cfg.re;
  re.lastIndex = 0;
  let out = "",
    last = 0,
    m;
  while ((m = re.exec(text))) {
    const tok = m[0];
    if (!tok) {
      re.lastIndex++;
      continue;
    }
    out += esc(text.slice(last, m.index));
    let kind = cfg.kinds[m.findIndex((v, i) => i > 0 && v !== undefined) - 1];
    if (kind === "word")
      kind = classify(tok, text.slice(re.lastIndex, re.lastIndex + 40));
    out += kind ? span(kind, tok) : esc(tok);
    last = m.index + tok.length;
  }
  return out + esc(text.slice(last));
}

// Render exercise instructions as Markdown, including fenced code blocks.
// Use the same sanitizer and syntax highlighter as the Reference/Canvas pages
// so SQL and other supported languages receive the shared light/dark palette.
function renderExerciseInstructions(target, source) {
  const { html } = md(String(source ?? ""));
  appendSanitizedReferenceHtml(target, html);
  target.querySelectorAll('pre code[class^="language-"]').forEach((code) => {
    const language = code.className.slice("language-".length).toLowerCase();
    const highlighted = highlightCode(code.textContent, language);
    if (highlighted !== null) code.innerHTML = highlighted;
  });
  return target;
}

const expectedText = (ex) =>
  ex.type === "sql-query"
    ? formatSQL(ex.referenceSolution)
    : ex.type.startsWith("mcq")
      ? ex.expected.map((i) => ex.options[i]).join("; ")
      : ex.type === "command-text"
        ? [
            ...(ex.expected.accepted || []),
            ...(ex.expected.patterns || []).map((p) => "/" + p + "/"),
          ].join("\n")
        : ex.type === "fill-blank"
          ? ex.expected.blanks.map((b) => b[0]).join(", ")
          : ex.expected;
const answerText = (ex, answer) => {
  if (ex.type.startsWith("mcq")) {
    if (!Array.isArray(answer)) return "(no answer)";
    const choices = answer
      .filter((i) => Number.isInteger(i) && i >= 0 && i < ex.options.length)
      .map((i) => ex.options[i]);
    return choices.length ? choices.join("\n") : "(no answer)";
  }
  return typeof answer === "string"
    ? answer || "(empty)"
    : JSON.stringify(answer ?? "(no answer)");
};
function schemaView(ex) {
  const content = h(
    "div",
    { class: "schema-content" },
    loadingSkeleton(
      "Loading the relationship diagram…",
      "Open to build the sample database",
    ),
  );
  const box = h(
    "details",
    { class: "schema schema-workspace", open: true },
    h("summary", {}, "Dataset schema"),
    content,
  );
  // Clicking anywhere in the schema panel must not steal focus from the
  // element being used (e.g. the SQL editor). Preventing the default
  // mousedown action keeps focus where it was; click events, toggling the
  // <summary>, the view buttons and diagram dragging still work.
  box.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
  });
  box.addEventListener("toggle", async () => {
    if (!box.open || box.dataset.loaded) return;
    box.dataset.loaded = "true";
    content.replaceChildren(
      loadingSkeleton(
        "Creating the sample database…",
        dbIsWarm(ex) ? "" : "The first time takes a few seconds",
      ),
    );
    let columns, keys;
    try {
      [columns, keys] = await withFreshDb(
        S.datasets[ex.datasetId],
        async (db) => {
          const columns = await db.query(
            "select table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema='public' order by table_name, ordinal_position",
          );
          const keys = await db.query(
            "select tc.table_name, kcu.column_name, tc.constraint_type, ccu.table_name as referenced_table, ccu.column_name as referenced_column from information_schema.table_constraints tc join information_schema.key_column_usage kcu on tc.constraint_name=kcu.constraint_name and tc.table_schema=kcu.table_schema join information_schema.constraint_column_usage ccu on ccu.constraint_name=kcu.constraint_name and ccu.table_schema=kcu.table_schema where tc.table_schema='public' and tc.constraint_type in ('PRIMARY KEY','FOREIGN KEY') order by tc.table_name, kcu.ordinal_position",
          );
          return [columns, keys];
        },
      );
    } catch (e) {
      box.dataset.loaded = "";
      content.replaceChildren(h("pre", { class: "err" }, e.message));
      return;
    }
    const tables = new Map();
    for (const row of columns.rows) {
      if (!tables.has(row.table_name)) tables.set(row.table_name, []);
      tables.get(row.table_name).push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === "YES",
        primary: false,
        foreign: false,
      });
    }
    const relations = [];
    for (const key of keys.rows) {
      const col = tables
        .get(key.table_name)
        ?.find((c) => c.name === key.column_name);
      if (key.constraint_type === "PRIMARY KEY" && col) col.primary = true;
      if (key.constraint_type === "FOREIGN KEY" && col) {
        col.foreign = true;
        relations.push({
          from: key.table_name,
          column: key.column_name,
          to: key.referenced_table,
          targetColumn: key.referenced_column,
        });
      }
    }
    const names = [...tables.keys()],
      aliases = new Map(names.map((name, i) => [name, "T" + (i + 1)]));
    const umlText = (value) =>
      String(value)
        .replace(/[\\"]/g, "\\$&")
        .replace(/[{}\r\n]/g, " ");
    const uml = [
      "@startuml",
      "hide circle",
      "hide methods",
      "skinparam linetype ortho",
      "skinparam nodesep 150",
      "skinparam ranksep 170",
      "skinparam padding 16",
      "skinparam defaultFontSize 18",
      "skinparam ArrowFontSize 14",
      "skinparam dpi 160",
      "skinparam shadowing false",
    ];
    for (const [name, cols] of tables) {
      uml.push(`entity "${umlText(name)}" as ${aliases.get(name)} {`);
      const primaryCols = cols.filter((col) => col.primary);
      const attributeCols = cols.filter((col) => !col.primary);
      for (const col of primaryCols)
        uml.push(
          `  ${col.primary ? "*" : " "} ${umlText(col.name)} : ${umlText(col.type)}${col.foreign ? " <<FK>>" : ""}`,
        );
      if (primaryCols.length && attributeCols.length) uml.push("  --");
      for (const col of attributeCols)
        uml.push(
          `    ${umlText(col.name)} : ${umlText(col.type)}${col.foreign ? " <<FK>>" : ""}`,
        );
      uml.push("}");
    }
    for (const rel of relations)
      uml.push(
        `${aliases.get(rel.from)} }o--|| ${aliases.get(rel.to)} : ${umlText(rel.column)}\\n→ ${umlText(rel.targetColumn)}`,
      );
    uml.push("@enduml");
    const diagramViewer = h("div", {
      class: "plantuml-preview",
      "aria-label":
        "PlantUML diagram. On desktop, scroll to zoom and drag to pan.",
    });
    const diagramImage = h("img", {
      alt: `PlantUML entity relationship diagram for ${ex.datasetId}`,
      draggable: "false",
    });
    // Hidden (but still loading) until the image arrives; a skeleton fills the
    // space meanwhile. The PlantUML server can be slow, so say so after a while.
    diagramImage.style.display = "none";
    const diagramPlaceholder = loadingSkeleton(
      "Rendering the PlantUML diagram…",
    );
    const slowTimer = setTimeout(() => {
      diagramPlaceholder.append(
        h(
          "small",
          { class: "loading-sub" },
          "Still working: the PlantUML server is slow right now.",
        ),
      );
    }, 8000);
    diagramImage.addEventListener("load", () => {
      clearTimeout(slowTimer);
      diagramPlaceholder.remove();
      diagramImage.style.display = "";
    });
    diagramImage.addEventListener("error", () => {
      clearTimeout(slowTimer);
      diagramViewer.replaceChildren(
        h(
          "span",
          { class: "err" },
          "The PlantUML diagram could not be loaded.",
        ),
      );
    });
    diagramViewer.append(diagramPlaceholder, diagramImage);
    let zoom = 1,
      panX = 0,
      panY = 0,
      dragStart;
    const desktopZoom = matchMedia(
      "(min-width: 901px) and (hover: hover) and (pointer: fine)",
    );
    const updateDiagramTransform = () => {
      diagramImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    };
    diagramViewer.addEventListener(
      "wheel",
      (event) => {
        if (!desktopZoom.matches) return;
        event.preventDefault();
        // Classic mouse wheel: fixed steps, deltaMode != 0 (lines/pages) or
        // deltaY in multiples of 120 (wheelDeltaY). Anything else is a
        // trackpad (two-finger scroll or pinch, which sets ctrlKey).
        const isMouseWheel =
          !event.ctrlKey &&
          (event.deltaMode !== 0 ||
            (event.wheelDeltaY && event.wheelDeltaY % 120 === 0));
        let factor;
        if (isMouseWheel) {
          factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
        } else {
          // Trackpad: smooth, proportional and much gentler zoom.
          const TRACKPAD_ZOOM_SENSITIVITY = 0.004; // lower = less sensitive
          const PINCH_MULTIPLIER = 2.5; // pinch events have tiny deltas
          const delta = Math.max(-30, Math.min(30, event.deltaY));
          factor = Math.exp(
            -delta *
              TRACKPAD_ZOOM_SENSITIVITY *
              (event.ctrlKey ? PINCH_MULTIPLIER : 1),
          );
        }
        zoom = Math.min(4, Math.max(0.5, zoom * factor));
        updateDiagramTransform();
      },
      { passive: false },
    );
    diagramViewer.addEventListener("pointerdown", (event) => {
      if (!desktopZoom.matches || event.button !== 0) return;
      dragStart = { x: event.clientX - panX, y: event.clientY - panY };
      diagramViewer.setPointerCapture(event.pointerId);
      diagramViewer.classList.add("is-dragging");
    });
    diagramViewer.addEventListener("pointermove", (event) => {
      if (!dragStart) return;
      panX = event.clientX - dragStart.x;
      panY = event.clientY - dragStart.y;
      updateDiagramTransform();
    });
    const endDiagramDrag = () => {
      dragStart = undefined;
      diagramViewer.classList.remove("is-dragging");
    };
    diagramViewer.addEventListener("pointerup", endDiagramDrag);
    diagramViewer.addEventListener("pointercancel", endDiagramDrag);
    const source = h(
      "details",
      { class: "plantuml-source" },
      h("summary", {}, "PlantUML source"),
      h("pre", {}, uml.join("\n")),
    );
    const diagramView = h(
      "div",
      { class: "schema-visual diagram-view" },
      h("strong", {}, "PlantUML ER diagram"),
      diagramViewer,
      h(
        "small",
        { class: "plantuml-controls-hint" },
        "On desktop: scroll over the diagram to zoom; click and drag to move it.",
      ),
      source,
    );
    const tableCards = [...tables].map(([name, cols]) => {
      const primaryCols = cols.filter((col) => col.primary),
        attributeCols = cols.filter((col) => !col.primary),
        columnItem = (col) =>
          h(
            "li",
            {},
            h("code", {}, col.name),
            h("span", { class: "schema-column-type" }, col.type),
            col.primary
              ? h("span", { class: "schema-key schema-pk" }, "PK")
              : "",
            col.foreign
              ? h("span", { class: "schema-key schema-fk" }, "FK")
              : "",
            col.nullable
              ? ""
              : h("span", { class: "schema-not-null" }, "NOT NULL"),
          );
      return h(
        "section",
        { class: "schema-table", "aria-label": `${name} table` },
        h("h4", {}, name),
        h(
          "ul",
          {},
          ...primaryCols.map(columnItem),
          primaryCols.length && attributeCols.length
            ? h("li", { class: "schema-key-divider" }, "Attributes")
            : "",
          ...attributeCols.map(columnItem),
        ),
      );
    });
    const tableView = h(
      "div",
      { class: "schema-visual schema-tables", hidden: true },
      h("div", { class: "schema-table-grid" }, tableCards),
      h(
        "section",
        { class: "schema-relations" },
        h("h4", {}, "Relationships"),
        relations.length
          ? h(
              "ul",
              {},
              relations.map((rel) =>
                h(
                  "li",
                  {},
                  h("code", {}, `${rel.from}.${rel.column}`),
                  h(
                    "span",
                    {
                      class: "schema-relation-arrow",
                      "aria-label": "references",
                    },
                    " → ",
                  ),
                  h("code", {}, `${rel.to}.${rel.targetColumn}`),
                ),
              ),
            )
          : h("p", {}, "No foreign-key relationships."),
      ),
    );
    const diagramToggle = h(
      "button",
      {
        type: "button",
        class: "schema-view-toggle on",
        "aria-pressed": "true",
        onclick: () => setSchemaView("diagram"),
      },
      "PlantUML",
    );
    const tablesToggle = h(
      "button",
      {
        type: "button",
        class: "schema-view-toggle",
        "aria-pressed": "false",
        onclick: () => setSchemaView("tables"),
      },
      "Tables & relationships",
    );
    function setSchemaView(view) {
      const showDiagram = view === "diagram";
      diagramView.hidden = !showDiagram;
      tableView.hidden = showDiagram;
      diagramToggle.classList.toggle("on", showDiagram);
      diagramToggle.setAttribute("aria-pressed", String(showDiagram));
      tablesToggle.classList.toggle("on", !showDiagram);
      tablesToggle.setAttribute("aria-pressed", String(!showDiagram));
    }
    content.replaceChildren(
      h(
        "div",
        {
          class: "schema-view-controls",
          role: "group",
          "aria-label": "Dataset schema view",
        },
        diagramToggle,
        tablesToggle,
      ),
      diagramView,
      tableView,
    );
    try {
      const encoded = await plantumlEncode(uml.join("\n"));
      diagramImage.dataset.plantumlEncoded = encoded;
      diagramImage.src = plantUmlImageUrl(encoded);
    } catch (e) {
      clearTimeout(slowTimer);
      diagramViewer.replaceChildren(
        h(
          "span",
          { class: "err" },
          `Could not prepare PlantUML diagram: ${e.message}`,
        ),
      );
    }
  });
  if (box.open) box.dispatchEvent(new Event("toggle"));
  return box;
}
async function plantumlEncode(source) {
  const compressed = await new Response(
    new Blob([new TextEncoder().encode(source)])
      .stream()
      .pipeThrough(new CompressionStream("deflate-raw")),
  ).arrayBuffer();
  const bytes = new Uint8Array(compressed);
  const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
  let encoded = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i],
      b2 = bytes[i + 1] || 0,
      b3 = bytes[i + 2] || 0;
    encoded += alphabet[b1 >> 2];
    encoded += alphabet[((b1 & 3) << 4) | (b2 >> 4)];
    encoded += alphabet[((b2 & 15) << 2) | (b3 >> 6)];
    encoded += alphabet[b3 & 63];
  }
  return encoded;
}

// Question view. mode 'practice' shows Run/Submit/feedback; 'exam' shows Run only, no feedback.
function qView(
  ex,
  mode,
  get,
  set,
  onAttempt = () => {},
  onNextExercise = null,
  hasNextExercise = () => true,
) {
  const q = h("div", { class: "q" }),
    out = h("div"),
    fb = h("div");
  const scrollToOutput = () =>
    out.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
    });
  const scrollToFeedback = () =>
    // Wait for the new feedback to be laid out, then bring it into view. If it
    // is taller than the screen (long explanation), align its top so the
    // correct/incorrect verdict is visible rather than centring it off-screen.
    requestAnimationFrame(() =>
      fb.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block:
          fb.getBoundingClientRect().height > innerHeight * 0.7
            ? "start"
            : "center",
      }),
    );
  let schemaPanel,
    runId = 0,
    gradingId = 0;
  const updateAnswer = (value) => {
    const saved = set(value);
    Promise.resolve(saved).catch((e) => {
      console.error("Could not save answer draft:", e);
    });
  };
  const instructions = h("div", { class: "stmt" });
  renderExerciseInstructions(instructions, ex.instructions);
  q.append(
    h("h3", {}, ex.title),
    h(
      "div",
      { class: "meta" },
      [
        courseLabel(ex.course),
        ex.packageId,
        ex.category,
        ex.difficulty,
        !ex.examEligible ? "not on exam" : "",
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    instructions,
  );
  const btns = h("div");
  let readAns, resetFn, submitButton, nextExerciseButton, focusTarget;

  let exerciseCorrect = false;

  const updateNextExercise = () => {
    if (nextExerciseButton) {
      nextExerciseButton.hidden = !(exerciseCorrect && hasNextExercise());
    }
  };
  const markExerciseCorrect = () => {
    exerciseCorrect = true;
    updateNextExercise();
  };
  // preventScroll: focusing the button must not yank the page away from the
  // feedback we just scrolled to.
  const focusNextExercise = () =>
    nextExerciseButton?.focus({ preventScroll: true });
  if (ex.type === "sql-query") {
    const ta = h("textarea", {
      class: "editor",
      rows: 8,
      spellcheck: "false",
      "aria-label": "SQL editor",
      placeholder: "Write one SQL statement",
    });
    focusTarget = ta;
    ta.value = get() || "";
    ta.oninput = () => updateAnswer(ta.value);
    const run = h(
      "button",
      {
        onclick: async () => {
          const currentRun = ++runId;
          const sql = ta.value; // capture, in case they edit while it runs
          achTrack((s) => void s.runs++, { full: false });
          fb.replaceChildren();
          out.replaceChildren(
            loadingNote(
              dbIsWarm(ex)
                ? "Running…"
                : "Setting up the database (first run takes a few seconds)…",
            ),
          );
          try {
            const r = await runStudent(ex, sql);
            if (currentRun !== runId || !q.isConnected) return;
            out.replaceChildren(
              table(r.res),
              h("small", {}, `${r.ms} ms (fresh database)`),
            );
          } catch (e) {
            if (currentRun !== runId || !q.isConnected) return;
            out.replaceChildren(
              h("pre", { class: "err" }, describeSqlError(e, sql)),
            );
          }
          scrollToOutput();
        },
      },
      "Run (Ctrl+Enter)",
    );
    ta.onkeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        achTrack((s) => void s.shortcuts++, { full: false });
        if (e.shiftKey && mode === "practice") {
          submitButton?.click();
          return;
        }
        run.click();
      }
    };
    schemaPanel = schemaView(ex);
    q.append(ta);
    btns.append(run);
    readAns = () => ta.value;
    resetFn = () => {
      ta.value = "";
      updateAnswer("");
    };
    if (mode === "practice") {
      submitButton = h(
        "button",
        {
          onclick: async () => {
            const currentGrading = ++gradingId;
            ++runId; // a Run still in flight must not overwrite this output
            fb.replaceChildren(
              loadingNote(
                dbIsWarm(ex)
                  ? "Grading…"
                  : "Setting up the database and grading…",
              ),
            );
            const g = await gradeSql(ex, ta.value);
            if (currentGrading !== gradingId || !q.isConnected) return;
            // Show the result table of the submitted query, like Run does.
            out.replaceChildren(g.res ? table(g.res) : "");
            if (g.correct !== null)
              await rec(ex, g.correct, "practice", onAttempt, {
                error: Boolean(g.error),
                blank: !ta.value.trim(),
              });
            if (currentGrading !== gradingId || !q.isConnected) return;
            if (g.correct === true) {
              markExerciseCorrect();
            }
            fb.replaceChildren(
              g.error
                ? h("pre", { class: "err" }, g.error)
                : h(
                    "p",
                    { class: g.correct ? "ok" : "bad" },
                    g.correct ? "✔ Correct" : "✘ Incorrect",
                    h(
                      "small",
                      {},
                      `  (setup ${g.setupMs} ms, total ${g.totalMs} ms)`,
                    ),
                  ),
              g.cmp ? diffView(g.cmp) : "",
              ex.explanation
                ? h("p", {}, h("b", {}, "Explanation: "), ex.explanation)
                : "",
            );
            scrollToFeedback();
            focusNextExercise();
          },
        },
        "Submit (Ctrl + Shift + Enter)",
      );
      btns.append(submitButton);
    }
  } else {
    const cur =
      get() ||
      (ex.type === "fill-blank" ? [] : ex.type.startsWith("mcq") ? [] : "");
    let inp;
    if (ex.type.startsWith("mcq")) {
      const multi = ex.type === "mcq-multi" || ex.type === "mcq-multiple",
        optionOrder = shuffle(ex.options.map((_, i) => i));
      inp = h(
        "div",
        { class: "answer-options" },
        optionOrder.map((i) => {
          const label = h("label", { class: "stmt" });
          label.append(
            h("input", {
              type: multi ? "checkbox" : "radio",
              name: keyOf(ex),
              checked: cur.includes(i),
              onchange: (e) => {
                const s = new Set(get() || []);
                if (!multi) s.clear();
                e.target.checked ? s.add(i) : s.delete(i);
                updateAnswer([...s]);
              },
            }),
          );
          // Render MCQ options exactly like exercise statements: Markdown,
          // sanitized HTML, and the shared language syntax highlighter.
          renderExerciseInstructions(label, ex.options[i]);
          return label;
        }),
      );
      focusTarget = inp.querySelector("input");
      readAns = () => get() || [];
      resetFn = () => {
        updateAnswer([]);
        inp.querySelectorAll("input").forEach((i) => (i.checked = false));
      };
    } else if (ex.type === "fill-blank") {
      const n = ex.expected.blanks.length;
      inp = h(
        "div",
        { class: "answer-blanks" },
        Array.from({ length: n }, (_, i) =>
          h(
            "label",
            {},
            `${i + 1}. `,
            h("input", {
              value: cur[i] || "",
              "aria-label": "Blank " + (i + 1),
              oninput: (e) => {
                const a = [...(get() || [])];
                a[i] = e.target.value;
                updateAnswer(a);
              },
            }),
          ),
        ),
      );
      readAns = () => get() || [];
      resetFn = () => {
        updateAnswer([]);
        inp.querySelectorAll("input").forEach((i) => (i.value = ""));
      };
    } else {
      inp = h(ex.type === "command-text" ? "input" : "textarea", {
        class: "editor",
        rows: 5,
        spellcheck: "false",
        "aria-label": "Answer",
        oninput: (e) => updateAnswer(e.target.value),
        onkeydown: (e) => {
          if (
            mode === "practice" &&
            ex.type === "command-text" &&
            e.key === "Enter"
          ) {
            e.preventDefault();
            e.stopPropagation();
            submitButton?.click();
          }
        },
      });
      focusTarget = inp;
      inp.value = cur;
      readAns = () => inp.value;
      resetFn = () => {
        inp.value = "";
        updateAnswer("");
      };
    }
    q.append(inp);
    if (ex.type === "command-text")
      q.append(
        h(
          "small",
          {},
          "Graded by text matching against accepted answers: the command is not executed.",
        ),
      );
    if (mode === "practice") {
      submitButton = h(
        "button",
        {
          onclick: async () => {
            const g = gradeOS(ex, readAns());
            if (g === null) {
              fb.replaceChildren(
                h("p", {}, h("b", {}, "Model answer:")),
                h("pre", {}, ex.expected),
                h(
                  "div",
                  {},
                  "Compare with yours, then mark: ",
                  h(
                    "button",
                    {
                      onclick: async () => {
                        await rec(ex, true, "practice", onAttempt);

                        markExerciseCorrect();

                        fb.append(h("p", { class: "ok" }, "Saved as correct"));
                        focusNextExercise();
                      },
                    },
                    "I was right",
                  ),
                  h(
                    "button",
                    {
                      class: "sec",
                      onclick: async () => {
                        await rec(ex, false, "practice", onAttempt);
                        fb.append(
                          h("p", { class: "bad" }, "Saved as incorrect"),
                        );
                        focusNextExercise();
                      },
                    },
                    "I was wrong",
                  ),
                ),
              );
              scrollToFeedback();
              return;
            }
            await rec(ex, g, "practice", onAttempt);

            if (g === true) {
              markExerciseCorrect();
            }
            fb.replaceChildren(
              h(
                "p",
                { class: g ? "ok" : "bad" },
                g ? "✔ Correct" : "✘ Incorrect",
              ),
              !g && hasSimilarOSAnswer(ex, readAns())
                ? h(
                    "small",
                    { class: "answer-review-note" },
                    "Your answer may be right, but the system can't tell for sure because it only checks against listed answers and certain patterns.",
                  )
                : "",
              ex.explanation
                ? h("p", {}, h("b", {}, "Explanation: "), ex.explanation)
                : "",
            );
            scrollToFeedback();
            focusNextExercise();
          },
        },
        ex.type === "command-text"
          ? "Submit (Enter)"
          : ex.type.startsWith("mcq-")
            ? "Submit"
            : "Submit (Ctrl + Shift + Enter)",
      );
      btns.append(submitButton);
    }
  }
  q.addEventListener("keydown", (e) => {
    if (
      mode === "practice" &&
      submitButton &&
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      e.key === "Enter"
    ) {
      e.preventDefault();
      e.stopPropagation();
      submitButton.click();
    }
  });
  if (mode === "practice") {
    if (onNextExercise) {
      nextExerciseButton = h(
        "button",
        {
          onclick: () => {
            if (!exerciseCorrect || !hasNextExercise()) return;
            onNextExercise();
          },
          "aria-keyshortcuts": "Enter",
          hidden: true,
        },
        "Next exercise",
      );
      btns.append(nextExerciseButton);
    }
    btns.append(
      h(
        "button",
        {
          class: "sec",
          onclick: () => {
            runId++;
            gradingId++;

            exerciseCorrect = false;
            updateNextExercise();

            resetFn();
            out.replaceChildren();
            fb.replaceChildren();
          },
        },
        "Reset",
      ),
    );
    const hints = Array.isArray(ex.hints)
      ? ex.hints
      : typeof ex.hints === "string"
        ? [ex.hints]
        : [];
    if (hints.length) {
      const hintPanel = h("div", {
        class: "hint-panel",
        hidden: true,
        "aria-live": "polite",
      });
      const hb = h(
        "button",
        {
          class: "sec",
          onclick: () => {
            const showHints = hintPanel.hidden;
            if (showHints && mode === "practice") achPeek(ex, "hint");
            hintPanel.hidden = !showHints;
            hintPanel.replaceChildren(
              ...(showHints
                ? [
                    h("strong", {}, "Hints"),
                    h(
                      "ul",
                      {},
                      ...hints.map((hintText) => h("li", {}, hintText)),
                    ),
                  ]
                : []),
            );
            hb.textContent = showHints ? "Hide hints" : "Show hints";
            hb.setAttribute("aria-expanded", String(showHints));
          },
          "aria-expanded": "false",
        },
        "Show hints",
      );
      btns.append(hb);
      q.append(hintPanel);
    }
    if (ex.type === "sql-query" && ex.referenceSolution) {
      const snippet = h("div", {
        id: `sql-result-snippet-${ex.id}`,
        class: "sql-result-panel",
      });
      let loadingSnippet = false;
      let previewLoadScheduled = false;
      let previewIdleHandle = null;
      let previewTimer = null;
      const showPreviewLoading = () => {
        snippet.setAttribute("aria-busy", "true");
        snippet.replaceChildren(
          h("strong", {}, "Expected result preview"),
          loadingNote(
            dbIsWarm(ex)
              ? "Loading the first five result rows…"
              : "Setting up the database and loading the first five rows…",
          ),
        );
      };
      const loadResultSnippet = async () => {
        if (snippet.dataset.loaded || loadingSnippet || !snippet.isConnected)
          return;
        loadingSnippet = true;
        showPreviewLoading();
        try {
          const { res } = await runStudent(ex, ex.referenceSolution);
          snippet.replaceChildren(
            h("strong", {}, "Expected result preview"),
            h(
              "small",
              {},
              "A preview of rows returned by the reference query.",
            ),
            table(res, 5),
          );
          snippet.dataset.loaded = "true";
        } catch (e) {
          const message = e?.message || String(e);
          const retry = h(
            "button",
            {
              type: "button",
              class: "sec",
              onclick: () => {
                showPreviewLoading();
                loadResultSnippet();
              },
            },
            "Try loading preview again",
          );
          snippet.replaceChildren(
            h("strong", {}, "Could not load result preview"),
            h("pre", { class: "err" }, message),
            retry,
          );
        } finally {
          loadingSnippet = false;
          snippet.removeAttribute("aria-busy");
        }
      };
      // Give the browser a real paint opportunity before database setup starts.
      // Starting PGlite in the same animation frame that creates the panel can
      // otherwise prevent the loading indicator and filter controls from
      // appearing responsive on a cold database.
      const schedulePreviewLoad = () => {
        if (
          previewLoadScheduled ||
          loadingSnippet ||
          snippet.dataset.loaded ||
          snippet.hidden
        )
          return;
        previewLoadScheduled = true;
        const start = () => {
          previewLoadScheduled = false;
          previewIdleHandle = null;
          previewTimer = null;
          if (snippet.isConnected && !snippet.hidden) loadResultSnippet();
        };
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if ("requestIdleCallback" in window) {
              previewIdleHandle = requestIdleCallback(start, { timeout: 1800 });
            } else {
              previewTimer = setTimeout(start, 180);
            }
          });
        });
      };
      const toggle = h(
        "button",
        {
          class: "sql-result-toggle",
          "aria-expanded": "true",
          "aria-controls": snippet.id,
          onclick: async () => {
            if (!snippet.hidden) {
              snippet.hidden = true;
              toggle.textContent = "Show result snippet";
              toggle.setAttribute("aria-expanded", "false");
              return;
            }
            snippet.hidden = false;
            toggle.textContent = "Hide result snippet";
            toggle.setAttribute("aria-expanded", "true");
            await loadResultSnippet();
          },
        },
        "Hide result snippet",
      );
      btns.append(toggle);
      q.append(snippet);
      // Show the loading state immediately, but start database work only once
      // the page has painted and the browser has had an idle opportunity to
      // process filter/search input.
      showPreviewLoading();
      schedulePreviewLoad();
    }
    const hasSol = ex.type === "sql-query" ? !!ex.referenceSolution : true;
    if (hasSol && ex.type !== "short-answer-self-check") {
      const solution = h(
        "div",
        { class: "solution-panel", hidden: true },
        h("b", {}, "Solution"),
        h("pre", {}, expectedText(ex)),
      );
      const toggle = h(
        "button",
        {
          class: "sec",
          "aria-expanded": "false",
          onclick: () => {
            solution.hidden = !solution.hidden;
            if (!solution.hidden && mode === "practice")
              achPeek(ex, "solution");
            toggle.textContent = solution.hidden
              ? "Show solution"
              : "Hide solution";
            toggle.setAttribute("aria-expanded", String(!solution.hidden));
          },
        },
        "Show solution",
      );
      btns.append(toggle);
      q.append(solution);
    }
  }
  q.append(btns, out, fb);
  const view = schemaPanel ? sqlSplitLayout(schemaPanel, q) : q;
  view.refreshNextExercise = updateNextExercise;
  view.focusInput = () => focusTarget?.focus({ preventScroll: true });
  return view;
}

// ---------- resizable split between the question and the schema/diagram ----------
// Only used for SQL exercises (the only ones that have a schema panel).
// Layout/visuals live in style.css (.sql-exercise-layout, .sql-split-handle);
// here we only set --sql-schema-col (the schema column width) while dragging.
const SQL_SPLIT_KEY = "sqlSchemaFraction";
const SQL_SPLIT_MIN = 0.25,
  SQL_SPLIT_MAX = 0.65;
let sqlSchemaFraction = (() => {
  try {
    const v = parseFloat(localStorage.getItem(SQL_SPLIT_KEY));
    if (v >= SQL_SPLIT_MIN && v <= SQL_SPLIT_MAX) return v;
  } catch {}
  return null; // null = use the stylesheet's default proportions
})();
function sqlSplitLayout(schemaPanel, q) {
  const handle = h("div", {
    class: "sql-split-handle",
    role: "separator",
    "aria-orientation": "vertical",
    "aria-label": "Resize question and diagram panels",
    tabindex: "0",
    title: "Drag to resize (double-click to reset)",
  });
  const layout = h(
    "div",
    { class: "sql-exercise-layout" },
    schemaPanel,
    handle,
    q,
  );
  const currentFraction = () =>
    sqlSchemaFraction ??
    schemaPanel.getBoundingClientRect().width /
      (layout.getBoundingClientRect().width || 1);
  const apply = () => {
    if (sqlSchemaFraction == null) {
      layout.style.removeProperty("--sql-schema-col");
      handle.removeAttribute("aria-valuenow");
      return;
    }
    layout.style.setProperty(
      "--sql-schema-col",
      `${(sqlSchemaFraction * 100).toFixed(2)}%`,
    );
    handle.setAttribute(
      "aria-valuenow",
      String(Math.round(sqlSchemaFraction * 100)),
    );
  };
  const set = (fraction, save) => {
    sqlSchemaFraction =
      fraction == null
        ? null
        : Math.min(SQL_SPLIT_MAX, Math.max(SQL_SPLIT_MIN, fraction));
    apply();
    if (!save) return;
    try {
      if (sqlSchemaFraction == null) localStorage.removeItem(SQL_SPLIT_KEY);
      else localStorage.setItem(SQL_SPLIT_KEY, String(sqlSchemaFraction));
    } catch {}
  };
  handle.setAttribute("aria-valuemin", String(SQL_SPLIT_MIN * 100));
  handle.setAttribute("aria-valuemax", String(SQL_SPLIT_MAX * 100));
  apply();
  let dragging = false;
  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    handle.setPointerCapture(e.pointerId);
    handle.classList.add("is-dragging");
    document.body.classList.add("sql-split-dragging");
    e.preventDefault();
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = layout.getBoundingClientRect();
    // Schema is the right-hand column: its width is what is left of the pointer.
    set((rect.right - e.clientX) / rect.width, false);
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove("is-dragging");
    document.body.classList.remove("sql-split-dragging");
    set(sqlSchemaFraction, true);
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
  handle.addEventListener("dblclick", () => set(null, true));
  handle.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    // Left arrow moves the divider left, i.e. makes the diagram wider.
    if (e.key === "ArrowLeft") set(currentFraction() + step, true);
    else if (e.key === "ArrowRight") set(currentFraction() - step, true);
    else if (e.key === "Home") set(SQL_SPLIT_MAX, true);
    else if (e.key === "End") set(SQL_SPLIT_MIN, true);
    else return;
    e.preventDefault();
  });
  return layout;
}

// ---------- markdown (small, for the supplied reference files) ----------
function renderMermaidFlowchart(source) {
  const lines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    direction = lines[0]
      ?.match(/^flowchart\s+(LR|RL|TB|TD|BT)\b/i)?.[1]
      ?.toUpperCase();
  if (!direction) return null;
  const nodes = new Map(),
    edges = [];
  const nodePattern = String.raw`([A-Za-z0-9_]+)(?:\["([^"]*)"\]|\['([^']*)'\]|\(([^)]*)\)|\{([^}]*)\})?`;
  const edgePattern = new RegExp(
    String.raw`^\s*${nodePattern}\s*-->\s*(?:\|([^|]*)\|\s*)?${nodePattern}\s*$`,
  );
  const register = (id, square, single, rounded, diamond) => {
    const label = square ?? single ?? rounded ?? diamond;
    if (!nodes.has(id) || (nodes.get(id) === id && label))
      nodes.set(id, label ?? id);
    return id;
  };
  for (const line of lines.slice(1)) {
    if (line.startsWith("%%")) continue;
    const match = edgePattern.exec(line);
    if (!match) continue;
    const [
      ,
      from,
      fromSquare,
      fromSingle,
      fromRounded,
      fromDiamond,
      label,
      to,
      toSquare,
      toSingle,
      toRounded,
      toDiamond,
    ] = match;
    register(from, fromSquare, fromSingle, fromRounded, fromDiamond);
    register(to, toSquare, toSingle, toRounded, toDiamond);
    edges.push({ from, to, label: label?.replace(/^["']|["']$/g, "") });
  }
  if (!nodes.size || !edges.length) return null;
  const nodeOrder = new Map([...nodes.keys()].map((id, index) => [id, index]));
  const nodeWidth = 144,
    nodeHeight = 54,
    gap = 82,
    padding = 44,
    centerY =
      direction === "TB" || direction === "TD" || direction === "BT"
        ? padding + nodeHeight / 2
        : 150,
    positionIndex = (index) =>
      direction === "RL" || direction === "BT" ? nodes.size - index - 1 : index,
    positions = new Map(
      [...nodes.keys()].map((id, index) => [
        id,
        direction === "TB" || direction === "TD" || direction === "BT"
          ? {
              x: 120,
              y:
                padding +
                positionIndex(index) * (nodeHeight + gap) +
                nodeHeight / 2,
            }
          : {
              x:
                padding +
                positionIndex(index) * (nodeWidth + gap) +
                nodeWidth / 2,
              y: centerY,
            },
      ]),
    ),
    width =
      direction === "TB" || direction === "TD" || direction === "BT"
        ? 240
        : padding * 2 + nodes.size * nodeWidth + (nodes.size - 1) * gap,
    height =
      direction === "TB" || direction === "TD" || direction === "BT"
        ? padding * 2 + nodes.size * nodeHeight + (nodes.size - 1) * gap
        : 300,
    markerId = `reference-flow-arrow-${++renderMermaidFlowchart.markerId}`;
  const reciprocalRows = [];
  for (const edge of edges) {
    const reverse = edges.findIndex(
      (candidate) => candidate.from === edge.to && candidate.to === edge.from,
    );
    if (reverse < 0) break;
    if (nodeOrder.get(edge.from) < nodeOrder.get(edge.to))
      reciprocalRows.push([edge, edges[reverse]]);
  }
  const hasOnlyReciprocalPairs =
    reciprocalRows.length > 0 && reciprocalRows.length * 2 === edges.length;
  const reciprocalMarkup = hasOnlyReciprocalPairs
    ? reciprocalRows
        .map((pair, rowIndex) => {
          const centerY = 76 + rowIndex * 170,
            leftX = 124,
            rightX = 576,
            leftEdge = leftX + nodeWidth / 2,
            rightEdge = rightX - nodeWidth / 2,
            curve = 32,
            edgePath = (fromLeft, offset) => {
              const startX = fromLeft ? leftEdge : rightEdge,
                endX = fromLeft ? rightEdge : leftEdge,
                controlStartX = fromLeft
                  ? leftEdge + (rightEdge - leftEdge) / 3
                  : rightEdge - (rightEdge - leftEdge) / 3,
                controlEndX = fromLeft
                  ? leftEdge + (2 * (rightEdge - leftEdge)) / 3
                  : rightEdge - (2 * (rightEdge - leftEdge)) / 3;
              return {
                path: `M ${startX} ${centerY} C ${controlStartX} ${centerY + offset}, ${controlEndX} ${centerY + offset}, ${endX} ${centerY}`,
                labelX: (startX + endX) / 2,
                labelY: centerY + offset * 0.78,
              };
            },
            [forward, reverse] = pair,
            forwardCurve = edgePath(true, -curve),
            reverseCurve = edgePath(false, curve);
          return `<path class="flow-edge" d="${forwardCurve.path}" marker-end="url(#${markerId})"/>${
            forward.label
              ? `<text class="flow-edge-label" x="${forwardCurve.labelX}" y="${forwardCurve.labelY - 5}" text-anchor="middle">${escapeHtml(forward.label)}</text>`
              : ""
          }<path class="flow-edge" d="${reverseCurve.path}" marker-end="url(#${markerId})"/>${
            reverse.label
              ? `<text class="flow-edge-label" x="${reverseCurve.labelX}" y="${reverseCurve.labelY + 13}" text-anchor="middle">${escapeHtml(reverse.label)}</text>`
              : ""
          }<g class="flow-node"><rect x="${leftX - nodeWidth / 2}" y="${centerY - nodeHeight / 2}" width="${nodeWidth}" height="${nodeHeight}" rx="9"/><text x="${leftX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(nodes.get(forward.from))}</text></g><g class="flow-node"><rect x="${rightX - nodeWidth / 2}" y="${centerY - nodeHeight / 2}" width="${nodeWidth}" height="${nodeHeight}" rx="9"/><text x="${rightX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(nodes.get(forward.to))}</text></g>`;
        })
        .join("")
    : "";
  const edgeMarkup = hasOnlyReciprocalPairs
    ? reciprocalMarkup
    : edges
        .map(({ from, to, label }, edgeIndex) => {
          const start = positions.get(from),
            end = positions.get(to),
            horizontal = direction === "LR" || direction === "RL",
            sourceFirst = horizontal ? start.x < end.x : start.y < end.y,
            startPoint = horizontal
              ? {
                  x: start.x + (sourceFirst ? nodeWidth / 2 : -nodeWidth / 2),
                  y: start.y,
                }
              : {
                  x: start.x,
                  y: start.y + (sourceFirst ? nodeHeight / 2 : -nodeHeight / 2),
                },
            endPoint = horizontal
              ? {
                  x: end.x + (sourceFirst ? -nodeWidth / 2 : nodeWidth / 2),
                  y: end.y,
                }
              : {
                  x: end.x,
                  y: end.y + (sourceFirst ? -nodeHeight / 2 : nodeHeight / 2),
                },
            pairIndex = edges.findIndex(
              (edge, index) =>
                index < edgeIndex && edge.from === to && edge.to === from,
            ),
            curve = pairIndex < 0 ? 34 : -34 - (pairIndex % 3) * 18,
            controlX =
              (startPoint.x + endPoint.x) / 2 + (horizontal ? 0 : curve),
            controlY =
              (startPoint.y + endPoint.y) / 2 + (horizontal ? curve : 0),
            labelX = (startPoint.x + 2 * controlX + endPoint.x) / 4,
            labelY = (startPoint.y + 2 * controlY + endPoint.y) / 4;
          return `<path class="flow-edge" d="M ${startPoint.x} ${startPoint.y} Q ${controlX} ${controlY} ${endPoint.x} ${endPoint.y}" marker-end="url(#${markerId})"/>${
            label
              ? `<text class="flow-edge-label" x="${labelX}" y="${labelY - 5}" text-anchor="middle">${escapeHtml(label)}</text>`
              : ""
          }`;
        })
        .join("");
  const nodeMarkup = hasOnlyReciprocalPairs
    ? ""
    : [...nodes]
        .map(([id, label]) => {
          const point = positions.get(id);
          return `<g class="flow-node"><rect x="${point.x - nodeWidth / 2}" y="${point.y - nodeHeight / 2}" width="${nodeWidth}" height="${nodeHeight}" rx="9"/><text x="${point.x}" y="${point.y}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(label)}</text></g>`;
        })
        .join("");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "reference-flowchart");
  const diagramWidth = hasOnlyReciprocalPairs ? 700 : width,
    diagramHeight = hasOnlyReciprocalPairs
      ? reciprocalRows.length * 170 + 30
      : height;
  svg.setAttribute("viewBox", `0 0 ${diagramWidth} ${diagramHeight}`);
  svg.setAttribute("width", String(diagramWidth));
  svg.setAttribute("height", String(diagramHeight));
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    "Flowchart: " + [...nodes.values()].join(", "),
  );
  const markerDefinition = `<defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 z"/></marker></defs>`;
  svg.innerHTML = markerDefinition + edgeMarkup + nodeMarkup;
  const container = document.createElement("div");
  container.className = "reference-flowchart-scroll";
  container.append(svg);
  if (hasOnlyReciprocalPairs) {
    const mobileSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    mobileSvg.setAttribute(
      "class",
      "reference-flowchart reference-flowchart-mobile",
    );
    mobileSvg.setAttribute(
      "viewBox",
      `0 0 340 ${reciprocalRows.length * 205 + 10}`,
    );
    mobileSvg.setAttribute("width", "340");
    mobileSvg.setAttribute("height", String(reciprocalRows.length * 205 + 10));
    mobileSvg.setAttribute("role", "img");
    mobileSvg.setAttribute(
      "aria-label",
      "Flowchart: " + [...nodes.values()].join(", "),
    );
    const mobileMarkup = reciprocalRows
      .map(([forward, reverse], rowIndex) => {
        const x = 170,
          topY = 45 + rowIndex * 205,
          bottomY = topY + 105,
          halfHeight = nodeHeight / 2,
          forwardStart = topY + halfHeight,
          forwardEnd = bottomY - halfHeight,
          forwardX = x - 22,
          reverseX = x + 22,
          labelY = (forwardStart + forwardEnd) / 2 + 5,
          edgePaths = `<path class="flow-edge" d="M ${forwardX} ${forwardStart} L ${forwardX} ${forwardEnd}" marker-end="url(#${markerId})"/><text class="flow-edge-label flow-edge-label-left" x="${forwardX - 10}" y="${labelY}" text-anchor="end">${escapeHtml(forward.label || "")}</text><path class="flow-edge" d="M ${reverseX} ${forwardEnd} L ${reverseX} ${forwardStart}" marker-end="url(#${markerId})"/><text class="flow-edge-label flow-edge-label-right" x="${reverseX + 10}" y="${labelY}" text-anchor="start">${escapeHtml(reverse.label || "")}</text>`,
          topNode = `<g class="flow-node"><rect x="${x - nodeWidth / 2}" y="${topY - nodeHeight / 2}" width="${nodeWidth}" height="${nodeHeight}" rx="9"/><text x="${x}" y="${topY}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(nodes.get(forward.from))}</text></g>`,
          bottomNode = `<g class="flow-node"><rect x="${x - nodeWidth / 2}" y="${bottomY - nodeHeight / 2}" width="${nodeWidth}" height="${nodeHeight}" rx="9"/><text x="${x}" y="${bottomY}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(nodes.get(forward.to))}</text></g>`;
        return edgePaths + topNode + bottomNode;
      })
      .join("");
    mobileSvg.innerHTML = markerDefinition + mobileMarkup;
    container.append(mobileSvg);
  }
  return container;
}
renderMermaidFlowchart.markerId = 0;
const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function appendSanitizedReferenceHtml(target, source) {
  const allowedElements = new Set(
      "a b blockquote br code details div em h1 h2 h3 h4 h5 h6 hr i li ol p pre section span strong style summary table tbody td th thead tr ul".split(
        " ",
      ),
    ),
    allowedAttributes = new Set([
      "class",
      "id",
      "style",
      "title",
      "role",
      "href",
      "colspan",
      "rowspan",
      "data-a",
      "open",
    ]),
    parsed = new DOMParser().parseFromString(source, "text/html"),
    cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE)
        return document.createTextNode(node.nodeValue);
      if (node.nodeType !== Node.ELEMENT_NODE) return null;
      const element = node,
        tag = element.tagName.toLowerCase();
      if (["script", "iframe", "object", "embed", "template"].includes(tag))
        return null;
      if (!allowedElements.has(tag)) {
        const content = document.createDocumentFragment();
        [...element.childNodes].forEach((child) => {
          const clean = cleanNode(child);
          if (clean) content.append(clean);
        });
        return content;
      }
      if (tag === "style") {
        const css = element.textContent;
        if (/@|url\s*\(|expression\s*\(|javascript:/i.test(css)) return null;
        const scopedCss = css.replace(
          /([^{}]+)\{([^{}]*)\}/g,
          (rule, selectors, declarations) => {
            if (/url\s*\(|expression\s*\(|javascript:/i.test(declarations))
              return "";
            const scopedSelectors = selectors
              .split(",")
              .map((selector) => `.md ${selector.trim()}`)
              .join(", ");
            return `${scopedSelectors}{${declarations}}`;
          },
        );
        if (!scopedCss.trim()) return null;
        const style = document.createElement("style");
        style.textContent = scopedCss;
        return style;
      }
      const clean = document.createElement(tag);
      for (const attribute of element.attributes) {
        const name = attribute.name.toLowerCase(),
          value = attribute.value;
        if (
          name.startsWith("on") ||
          (!allowedAttributes.has(name) && !name.startsWith("aria-")) ||
          (name === "href" && !/^(?:#|https?:\/\/)/i.test(value.trim())) ||
          (name === "style" &&
            /url\s*\(|expression\s*\(|javascript:|@import/i.test(value))
        )
          continue;
        clean.setAttribute(name, value);
      }
      [...element.childNodes].forEach((child) => {
        const sanitized = cleanNode(child);
        if (sanitized) clean.append(sanitized);
      });
      return clean;
    };
  [...parsed.body.childNodes].forEach((node) => {
    const clean = cleanNode(node);
    if (clean) target.append(clean);
  });
}

function md(src) {
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const slug = (s) =>
    s
      .toLowerCase()
      .replace(/[`*]/g, "")
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .trim()
      .replace(/\s/g, "-");
  const inl = (s) =>
    s
      .split(/(`[^`]+`)/)
      .map((p, i) =>
        i % 2
          ? "<code>" + esc(p.slice(1, -1)) + "</code>"
          : esc(p)
              .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
              .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<i>$2</i>")
              .replace(
                /\[([^\]]+)\]\(#([^)]+)\)/g,
                '<a href="#" data-a="$2">$1</a>',
              )
              .replace(
                /\[([^\]]+)\]\((https?:[^)]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener">$1</a>',
              ),
      )
      .join("");
  const L = src.replace(/\r/g, "").split("\n"),
    o = [],
    st = [],
    toc = [];
  let para = [],
    i = 0;
  const fl = () => {
      if (para.length) {
        o.push("<p>" + inl(para.join(" ")) + "</p>");
        para = [];
      }
    },
    fs = () => {
      while (st.length) o.push("</li></" + st.pop().t + ">");
    };
  const cells = (l) =>
    l
      .trim()
      .replace(/^\||\|$/g, "")
      .split(/(?<!\\)\|/)
      .map((c) => c.trim().replace(/\\\|/g, "|"));
  for (; i < L.length; i++) {
    const l = L[i],
      m = l.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
    if (m) {
      fl();
      const ind = m[1].length,
        t = /\d/.test(m[2]) ? "ol" : "ul";
      while (st.length && ind < st[st.length - 1].i)
        o.push("</li></" + st.pop().t + ">");
      if (st.length && ind === st[st.length - 1].i) o.push("</li>");
      else {
        o.push("<" + t + ">");
        st.push({ i: ind, t });
      }
      o.push("<li>" + inl(m[3]));
      continue;
    }
    fs();
    if (/^ {0,3}```/.test(l)) {
      fl();
      const language = l.match(/^ {0,3}```\s*([^\s`]*)/)?.[1]?.toLowerCase() || "";
      const b = [];
      for (i++; i < L.length && !/^ {0,3}```/.test(L[i]); i++) b.push(L[i]);
      if (language === "mermaid")
        o.push(
          '<pre class="mermaid-source"><code>' +
            esc(b.join("\n")) +
            "</code></pre>",
        );
      else
        o.push(
          `<pre><code${language ? ` class="language-${esc(language)}"` : ""}>` +
            esc(b.join("\n")) +
            "</code></pre>",
        );
      continue;
    }
    {
      // "Try exercise" buttons: a raw <a class="try-exercise-button"> line.
      // Rendered as a real link; "domain/#/..." is reduced to the in-app "#/...".
      const tb = l.match(
        /^\s*<a\s+class="try-exercise-button"\s+href="(?:[^"#]*)(#\/[^"]*)">([^<]*)<\/a>\s*$/i,
      );
      if (tb) {
        fl();
        o.push(
          `<p><a class="try-exercise-button" href="${esc(tb[1]).replace(/"/g, "&quot;")}">${esc(tb[2])}</a></p>`,
        );
        continue;
      }
    }
    if (/^\s*<details\b[^>]*>\s*$/i.test(l)) {
      fl();
      o.push(/\bopen\b/i.test(l) ? "<details open>" : "<details>");
      continue;
    }
    if (/^\s*<\/details>\s*$/i.test(l)) {
      fl();
      o.push("</details>");
      continue;
    }
    {
      const sm = l.match(/^\s*<summary>(.*?)<\/summary>\s*$/i);
      if (sm) {
        fl();
        o.push("<summary>" + inl(sm[1]) + "</summary>");
        continue;
      }
    }
    if (/^\s*<(style|div|section|table|figure|blockquote)\b/i.test(l)) {
      fl();
      const tag = l
        .trim()
        .match(/^<([a-z]+)/i)?.[1]
        .toLowerCase();
      const block = [l];
      let depth =
        (l.match(new RegExp(`<${tag}\\b`, "gi")) || []).length -
        (l.match(new RegExp(`</${tag}\\s*>`, "gi")) || []).length;
      while (depth > 0 && i + 1 < L.length) {
        const next = L[++i];
        block.push(next);
        depth +=
          (next.match(new RegExp(`<${tag}\\b`, "gi")) || []).length -
          (next.match(new RegExp(`</${tag}\\s*>`, "gi")) || []).length;
      }
      o.push(
        '<div class="reference-html-block">' + block.join("\n") + "</div>",
      );
      continue;
    }
    if (
      /^\s*\|/.test(l) &&
      /^\s*\|?[\s:|-]+\|?\s*$/.test(L[i + 1] || "") &&
      /-/.test(L[i + 1])
    ) {
      fl();
      const hd = cells(l);
      i += 2;
      const rows = [];
      for (; i < L.length && /^\s*\|/.test(L[i]); i++) rows.push(cells(L[i]));
      i--;
      o.push(
        '<div class="tw"><table><tr>' +
          hd.map((c) => "<th>" + inl(c) + "</th>").join("") +
          "</tr>" +
          rows
            .map(
              (r) =>
                "<tr>" +
                r.map((c) => "<td>" + inl(c) + "</td>").join("") +
                "</tr>",
            )
            .join("") +
          "</table></div>",
      );
      continue;
    }
    const hm = l.match(/^(#{1,6})\s+(.*)/);
    if (hm) {
      fl();
      // Headings can contain markdown links ("[Title](https://…)"); the
      // contents list and the anchor id should only use the visible text.
      const plain = hm[2]
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[`*]/g, "");
      const n = hm[1].length,
        id = slug(plain);
      if (n >= 2 && n <= 3) toc.push({ n, id, t: plain });
      o.push(`<h${n} id="${id}">${inl(hm[2])}</h${n}>`);
      continue;
    }
    if (/^\s*(---|\*\*\*)\s*$/.test(l)) {
      fl();
      o.push("<hr>");
      continue;
    }
    if (/^>\s?/.test(l)) {
      fl();
      o.push("<blockquote>" + inl(l.replace(/^>\s?/, "")) + "</blockquote>");
      continue;
    }
    if (!l.trim()) {
      fl();
      continue;
    }
    para.push(l.trim());
  }
  fl();
  fs();
  return { html: o.join("\n"), toc };
}

function withoutContentsSection(src) {
  const lines = src.replace(/\r/g, "").split("\n"),
    kept = [];
  let skipLevel = 0;
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (skipLevel) {
      if (!heading || heading[1].length > skipLevel) continue;
      skipLevel = 0;
    }
    if (heading && /^table of contents$/i.test(heading[2].trim())) {
      skipLevel = heading[1].length;
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

// ---------- pages ----------
// Tears down what the reader page attaches outside its own view (the floating
// search button/panel and the visualViewport listeners). Called by route().
let readerSearchCleanup = null;
// Remembers the last term picked per section so switching subject keeps it.
const lastLibraryTerm = {};
const libraryFileKind = (file) =>
  /\.html?(?:[?#].*)?$/i.test(file) ? "html" : "md";
// Term picker on the Reference and Canvas pages.
//   true  -> the picker is shown even when a subject has only one term
//   false -> the picker is hidden when there is nothing to choose between
const SHOW_TERM_PICKER_WITH_SINGLE_TERM = true;
const LIBRARY_VIEWS = {
  reader: {
    key: "referenceFiles",
    route: "reader",
    eyebrow: "STUDY LIBRARY",
    title: "Quick references",
    intro: "Choose a subject to browse its guide.",
    empty: "No reference files configured.",
    noun: "reference",
  },
  canvas: {
    key: "canvasFiles",
    route: "canvas",
    eyebrow: "CANVAS",
    title: "Canvas",
    intro: "Choose a subject to open its canvas.",
    empty: "No canvas files configured.",
    noun: "canvas",
  },
};
const pageReader = (root, arg, term) =>
  pageLibrary(root, arg, term, LIBRARY_VIEWS.reader);
const pageCanvas = (root, arg, term) =>
  pageLibrary(root, arg, term, LIBRARY_VIEWS.canvas);

// Shared by the Reference and Canvas pages. Each subject has several terms
// (a slider switches between them); each term points at a .md or .html file.
async function pageLibrary(root, arg, termArg, view) {
  const refs = (S.manifest && S.manifest[view.key]) || [];
  if (!refs.length) return root.append(empty(view.empty));
  const cur = refs.find((r) => r.id === arg) || refs[0];
  if (!cur.terms.length)
    return root.append(empty(`"${cur.title}" has no files configured.`));
  const termCount = cur.terms.length,
    requestedTerm = termArg || lastLibraryTerm[view.route];
  let termIndex = Math.max(
    0,
    cur.terms.findIndex((t) => t.label === requestedTerm),
  );
  const body = h("article", { class: "md" });
  const searchInput = h("input", {
      type: "search",
      class: "reference-search-input",
      placeholder: `Find in this ${view.noun}`,
      "aria-label": `Find in this ${view.noun}`,
      autocomplete: "off",
      spellcheck: false,
    }),
    searchCount = h("span", {
      class: "reference-search-count",
      role: "status",
      "aria-live": "polite",
    }),
    regexToggle = h(
      "button",
      {
        class: "sec reference-search-regex",
        type: "button",
        "aria-label": "Use regular expression",
        "aria-pressed": "false",
        title: "Regular expression: off",
      },
      ".*",
    ),
    searchPanel = h(
      "div",
      { class: "reference-search-panel" },
      h(
        "div",
        { class: "reference-search-field" },
        searchInput,
        h(
          "button",
          {
            class: "reference-search-close",
            type: "button",
            "aria-label": `Close ${view.noun} search`,
            title: "Close search",
          },
          "×",
        ),
      ),
      h(
        "div",
        { class: "reference-search-controls" },
        searchCount,
        regexToggle,
        h(
          "button",
          {
            class: "sec reference-search-prev",
            type: "button",
            "aria-label": "Previous mention",
            title: "Previous mention (Shift+Enter)",
            disabled: true,
          },
          "↑",
        ),
        h(
          "button",
          {
            class: "sec reference-search-next",
            type: "button",
            "aria-label": "Next mention",
            title: "Next mention (Enter)",
            disabled: true,
          },
          "↓",
        ),
      ),
    ),
    searchToggle = h(
      "button",
      {
        class: "reference-search-toggle",
        type: "button",
        "aria-label": `Search this ${view.noun}`,
        "aria-expanded": "false",
      },
      h("span", { "aria-hidden": "true" }, "⌕"),
      " Find",
    );
  const tabs = h(
    "nav",
    { class: "reference-tabs", "aria-label": `Choose a ${view.noun}` },
    refs.map((r) =>
      h(
        "a",
        {
          href: `#/${view.route}/${encodeURIComponent(r.id)}`,
          class: "reference-tab" + (r === cur ? " on" : ""),
          "aria-current": r === cur ? "page" : false,
        },
        h(
          "span",
          { class: "reference-tab-label" },
          r.id.replace(/[_-]/g, " ").toUpperCase(),
        ),
        h("strong", {}, r.title),
      ),
    ),
  );
  // ----- term picker (segmented control with a gliding highlight) -----
  // With a single term the picker is still drawn when
  // SHOW_TERM_PICKER_WITH_SINGLE_TERM is true (see LIBRARY_VIEWS above).
  const showTermPicker = termCount > 1 || SHOW_TERM_PICKER_WITH_SINGLE_TERM;
  const motionOK = () =>
    !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const termThumb = h("span", { class: "term-thumb", "aria-hidden": "true" }),
    termPos = h("span", { class: "term-picker-pos", "aria-hidden": "true" }),
    termTicks = cur.terms.map((t, i) =>
      h(
        "button",
        {
          type: "button",
          role: "tab",
          class: "term-pill" + (i === termIndex ? " on" : ""),
          title: t.label,
          "aria-selected": String(i === termIndex),
          tabindex: i === termIndex ? "0" : "-1",
          onclick: () => {
            if (i !== termIndex) showTerm(i, true);
          },
        },
        t.label,
      ),
    ),
    termPills = h(
      "div",
      {
        class: "term-pills",
        role: "tablist",
        "aria-label": "Term",
        onkeydown: (e) => {
          const step =
            e.key === "ArrowRight" || e.key === "ArrowDown"
              ? 1
              : e.key === "ArrowLeft" || e.key === "ArrowUp"
                ? -1
                : 0;
          if (e.key === "Home" || e.key === "End" || step) {
            e.preventDefault();
            const next =
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? termCount - 1
                  : (termIndex + step + termCount) % termCount;
            // Wrapping around keeps sliding the way the arrow key points.
            if (next !== termIndex) showTerm(next, true, step);
            termTicks[next].focus({ preventScroll: true });
          }
        },
      },
      termThumb,
      termTicks,
    ),
    termSlider = !showTermPicker
      ? ""
      : h(
          "div",
          { class: "term-picker", "data-n": String(termCount) },
          h("span", { class: "term-picker-label" }, "TERM"),
          termPos,
          h("div", { class: "term-frame" }, termPills),
        );
  let termObserver = null;
  // Fade the row's edges only on the side that still has pills out of view.
  const syncTermEdges = () => {
    const max = termPills.scrollWidth - termPills.clientWidth;
    termPills.classList.toggle("fade-start", termPills.scrollLeft > 2);
    termPills.classList.toggle("fade-end", termPills.scrollLeft < max - 2);
  };
  termPills.addEventListener("scroll", syncTermEdges, { passive: true });
  // Keeps the pill states, the counter and the gliding highlight in step
  // with termIndex, and scrolls the chosen pill to the middle of a long row.
  const syncTermPicker = (animate = true) => {
    termTicks.forEach((tick, i) => {
      tick.classList.toggle("on", i === termIndex);
      tick.setAttribute("aria-selected", String(i === termIndex));
      tick.tabIndex = i === termIndex ? 0 : -1;
    });
    termPos.textContent = `${termIndex + 1} / ${termCount}`;
    const active = termTicks[termIndex];
    // Not laid out yet: the ResizeObserver below calls this again once it is.
    if (!showTermPicker || !active?.isConnected || !active.offsetWidth) return;
    termPills.style.setProperty("--thumb-x", `${active.offsetLeft}px`);
    termPills.style.setProperty("--thumb-w", `${active.offsetWidth}px`);
    if (!termPills.classList.contains("is-ready")) {
      // Commit the first position before the glide transition is switched on,
      // so the highlight appears in place instead of sliding in from the edge.
      void termPills.offsetWidth;
      termPills.classList.add("is-ready");
    }
    const overflow = termPills.scrollWidth - termPills.clientWidth;
    if (overflow > 1)
      termPills.scrollTo({
        left: Math.min(
          overflow,
          Math.max(
            0,
            active.offsetLeft -
              (termPills.clientWidth - active.offsetWidth) / 2,
          ),
        ),
        behavior: animate && motionOK() ? "smooth" : "auto",
      });
    syncTermEdges();
  };

  // ----- page slide between terms -----
  // The page on screen slides out, then the next one slides in from the side
  // the new term sits on: later terms arrive from the right, earlier from the
  // left. Skipped for the first load and for reduced-motion users.
  const SLIDE_OUT_MS = 170,
    SLIDE_IN_MS = 380,
    SLIDE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  let slideAnim = null,
    pageShown = false; // true once a term's content is on screen
  const canSlide = () => motionOK() && typeof body.animate === "function";
  const stopSlide = () => {
    slideAnim?.cancel();
    slideAnim = null;
  };
  // While pages swap, hold the card's height so the layout doesn't jump, and
  // stop the sideways motion from ever adding a horizontal scrollbar.
  const beginSlideState = () => {
    if (!body.style.minHeight) body.style.minHeight = `${body.offsetHeight}px`;
    document.documentElement.classList.add("term-sliding");
  };
  const endSlideState = () => {
    body.style.minHeight = "";
    document.documentElement.classList.remove("term-sliding");
  };
  const slidePage = (phase, dir) => {
    stopSlide();
    const out = phase === "out",
      shift = Math.round(Math.min(72, Math.max(24, innerWidth * 0.07))) * dir;
    slideAnim = body.animate(
      out
        ? [
            { opacity: 1, transform: "translateX(0)" },
            { opacity: 0, transform: `translateX(${-shift}px)` },
          ]
        : [
            { opacity: 0, transform: `translateX(${shift}px)` },
            { opacity: 1, transform: "translateX(0)" },
          ],
      {
        duration: out ? SLIDE_OUT_MS : SLIDE_IN_MS,
        easing: out ? "cubic-bezier(0.4, 0, 1, 1)" : SLIDE_EASE,
        // Stay hidden after sliding out until the next page has loaded.
        fill: out ? "forwards" : "none",
      },
    );
    return slideAnim;
  };
  const heading = h(
    "section",
    { class: "reference-heading" },
    h(
      "div",
      {},
      h("p", { class: "eyebrow" }, view.eyebrow),
      h("h1", {}, view.title),
      h("p", { class: "reference-intro" }, view.intro),
    ),
    tabs,
    termSlider,
  );
  // "On this page" starts open on desktop and collapsed on mobile (same 760px
  // breakpoint as the rest of the app). Chosen once, so switching terms keeps
  // whatever the reader toggled.
  const tocDetails = h("details", {
    class: "reference-toc",
    open: !matchMedia("(max-width: 760px)").matches,
  });
  const sidebar = h(
    "aside",
    { class: "reference-sidebar", "aria-label": "Navigation" },
    searchPanel,
    tocDetails,
  );
  root.append(heading, h("div", { class: "reference-layout" }, sidebar, body));
  document.body.appendChild(searchToggle);
  // Re-measure the highlight when the row is resized (rotation, window resize)
  // or when the web font settles and changes the pill widths.
  if (showTermPicker && typeof ResizeObserver === "function") {
    termObserver = new ResizeObserver(() => syncTermPicker(false));
    termObserver.observe(termPills);
  }
  document.fonts?.ready.then(() => syncTermPicker(false));
  // How long typing must pause before the page is searched.
  const SEARCH_DELAY_MS = 300;
  let matches = [],
    currentMatch = -1,
    regexMode = false,
    keyboardGap = 0,
    highlighted = [], // { node, pieces } for each text node we split up
    searchTimer = 0,
    lastSearchKey = "",
    loadToken = 0,
    frame = null, // the iframe, while an .html file is shown
    frameObserver = null,
    currentDoc = document; // document that holds the rendered content
  // Where text is searched: the article for markdown, the iframe body for html.
  const getSearchRoot = () =>
    frame ? frame.contentDocument?.body || null : body;
  // Mobile: keep the floating search panel above the on-screen keyboard.
  // position:fixed is anchored to the layout viewport, and the keyboard (or a
  // fast programmatic scroll while it is open) can leave that behind the
  // visual viewport. Measure the gap and lift the panel by it.
  const viewport = window.visualViewport;
  const syncSearchPanelToViewport = () => {
    const open = searchPanel.classList.contains("mobile-open"),
      gap =
        open && viewport
          ? Math.max(
              0,
              Math.round(innerHeight - viewport.height - viewport.offsetTop),
            )
          : 0,
      lifted = gap > 2;
    if (gap === keyboardGap) return;
    keyboardGap = gap;
    if (lifted) searchPanel.style.setProperty("--search-kb-offset", gap + "px");
    else searchPanel.style.removeProperty("--search-kb-offset");
    searchPanel.classList.toggle("keyboard-open", lifted);
  };
  viewport?.addEventListener("resize", syncSearchPanelToViewport);
  viewport?.addEventListener("scroll", syncSearchPanelToViewport);
  addEventListener("scroll", syncSearchPanelToViewport, { passive: true });
  // Pass the app theme to html canvases (as data-theme) so they can follow it.
  const syncFrameTheme = () => {
    const el = frame?.contentDocument?.documentElement;
    if (el) el.dataset.theme = currentTheme();
  };
  const themeObserver = new MutationObserver(syncFrameTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const teardownFrame = () => {
    frameObserver?.disconnect();
    frameObserver = null;
    frame = null;
    currentDoc = document;
  };
  readerSearchCleanup = () => {
    viewport?.removeEventListener("resize", syncSearchPanelToViewport);
    viewport?.removeEventListener("scroll", syncSearchPanelToViewport);
    removeEventListener("scroll", syncSearchPanelToViewport);
    clearTimeout(searchTimer);
    loadToken++;
    themeObserver.disconnect();
    termObserver?.disconnect();
    stopSlide();
    endSlideState();
    teardownFrame();
    searchPanel.remove();
    searchToggle.remove();
  };
  // Box of a match in page coordinates (matches inside the iframe are
  // measured relative to the frame, so add the frame's own offset).
  const matchBox = (match) => {
    const box = match.getBoundingClientRect();
    if (!frame) return box;
    const outer = frame.getBoundingClientRect();
    return { top: box.top + outer.top, height: box.height };
  };
  // Centre the match in the part of the screen that is actually visible: on
  // mobile that is between the sticky header (or the top of the visual
  // viewport) and the floating search panel, not the middle of the page.
  const scrollToMatch = (match) => {
    for (
      let d = match.closest?.("details:not([open])");
      d;
      d = d.parentElement?.closest("details:not([open])")
    )
      d.open = true;
    const box = matchBox(match);
    if (viewport && searchPanel.classList.contains("mobile-open")) {
      syncSearchPanelToViewport();
      const siteHeader = document.querySelector("header"),
        top = Math.max(
          viewport.offsetTop,
          siteHeader ? siteHeader.getBoundingClientRect().bottom : 0,
        ),
        bottom = searchPanel.getBoundingClientRect().top;
      if (bottom - top > 40) {
        window.scrollBy({
          top: box.top + box.height / 2 - (top + bottom) / 2,
          behavior: "smooth",
        });
        return;
      }
    }
    if (frame)
      window.scrollBy({
        top: box.top + box.height / 2 - innerHeight / 2,
        behavior: "smooth",
      });
    else match.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  // Scroll a heading into view; inside the iframe this must be done by hand.
  // Brief glow on the heading you jumped to, so the eye finds where the
  // smooth scroll landed. Uses the Web Animations API so it also works on a
  // heading inside an .html canvas iframe (no stylesheet needed there).
  const flashHeading = (el) => {
    if (!motionOK() || typeof el.animate !== "function") return;
    const glow = (a) => `rgba(243, 201, 105, ${a})`;
    el.animate(
      [
        {
          backgroundColor: glow(0.5),
          boxShadow: `0 0 0 6px ${glow(0.5)}`,
          offset: 0,
        },
        {
          backgroundColor: glow(0.5),
          boxShadow: `0 0 0 6px ${glow(0.5)}`,
          offset: 0.3,
        },
        {
          backgroundColor: glow(0),
          boxShadow: `0 0 0 6px ${glow(0)}`,
          offset: 1,
        },
      ],
      { duration: 1800, easing: "ease-out" },
    );
  };
  const scrollToHeading = (el) => {
    flashHeading(el);
    if (!frame) return el.scrollIntoView();
    const top =
      el.getBoundingClientRect().top +
      frame.getBoundingClientRect().top +
      scrollY -
      88;
    window.scrollTo({ top: Math.max(0, top) });
  };
  // Undo by putting each original text node back, rather than merging the
  // whole article's text nodes again with normalize(): far cheaper when there
  // are thousands of highlights.
  const clearHighlights = () => {
    for (const { node, pieces } of highlighted) {
      if (!pieces[0].parentNode) continue;
      pieces[0].replaceWith(node);
      for (let i = 1; i < pieces.length; i++) pieces[i].remove();
    }
    highlighted = [];
    matches = [];
    currentMatch = -1;
  };
  // Forget highlights without touching the DOM (used once it is thrown away).
  const forgetHighlights = () => {
    highlighted = [];
    matches = [];
    currentMatch = -1;
  };
  const showMatch = (index) => {
    if (!matches.length) return;
    if (currentMatch >= 0) matches[currentMatch].classList.remove("current");
    currentMatch = (index + matches.length) % matches.length;
    const match = matches[currentMatch];
    match.classList.add("current");
    searchCount.textContent = `${currentMatch + 1} of ${matches.length}`;
    scrollToMatch(match);
  };
  const resetResults = (message = "") => {
    searchCount.textContent = message;
    searchPanel.classList.remove("has-matches");
    searchPanel.querySelector(".reference-search-prev").disabled = true;
    searchPanel.querySelector(".reference-search-next").disabled = true;
  };
  // Returns true if it ran a new search, false if the query is unchanged.
  const updateSearch = () => {
    clearTimeout(searchTimer);
    searchTimer = 0;
    const query = searchInput.value.trim(),
      key = query ? (regexMode ? "re:" : "text:") + query : "";
    if (key === lastSearchKey) return false;
    lastSearchKey = key;
    clearHighlights();
    searchInput.removeAttribute("aria-invalid");
    if (!query) {
      resetResults();
      return true;
    }
    let expression;
    try {
      expression = new RegExp(
        regexMode ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        // Regex mode is case sensitive; plain-text mode stays case-insensitive.
        regexMode ? "g" : "gi",
      );
    } catch {
      searchInput.setAttribute("aria-invalid", "true");
      resetResults("Invalid pattern");
      return true;
    }
    const searchRoot = getSearchRoot();
    if (!searchRoot) {
      resetResults("No matches");
      return true;
    }
    const doc = searchRoot.ownerDocument;
    // Find every match first (the walker can't survive the DOM edits below).
    const walker = doc.createTreeWalker(searchRoot, NodeFilter.SHOW_TEXT),
      found = [];
    for (let node; (node = walker.nextNode()); ) {
      const text = node.nodeValue,
        ranges = [];
      expression.lastIndex = 0;
      let hit;
      while ((hit = expression.exec(text))) {
        // Zero-length matches (e.g. /a*/ or /\b/) can't be highlighted and
        // would never advance lastIndex, so skip past them.
        if (!hit[0]) {
          expression.lastIndex++;
          continue;
        }
        ranges.push([hit.index, hit.index + hit[0].length]);
      }
      if (
        ranges.length &&
        !node.parentElement?.closest("script, style, noscript, mark")
      )
        found.push([node, text, ranges]);
    }
    // Then rebuild each affected text node once, in a single DOM operation,
    // instead of splitting it with a Range for every match.
    for (const [node, text, ranges] of found) {
      const pieces = [],
        fragment = doc.createDocumentFragment();
      let at = 0;
      for (const [start, end] of ranges) {
        if (start > at) pieces.push(doc.createTextNode(text.slice(at, start)));
        const mark = doc.createElement("mark");
        mark.className = "reference-search-match";
        mark.textContent = text.slice(start, end);
        pieces.push(mark);
        matches.push(mark);
        at = end;
      }
      if (at < text.length) pieces.push(doc.createTextNode(text.slice(at)));
      for (const piece of pieces) fragment.appendChild(piece);
      node.replaceWith(fragment);
      highlighted.push({ node, pieces });
    }
    const hasMatches = matches.length > 0;
    searchPanel.classList.toggle("has-matches", hasMatches);
    searchPanel.querySelector(".reference-search-prev").disabled = !hasMatches;
    searchPanel.querySelector(".reference-search-next").disabled = !hasMatches;
    if (hasMatches) showMatch(0);
    else searchCount.textContent = "No matches";
    return true;
  };
  // Typing waits for a pause before searching; emptying the box is instant.
  const scheduleSearch = () => {
    clearTimeout(searchTimer);
    if (!searchInput.value.trim()) updateSearch();
    else searchTimer = setTimeout(updateSearch, SEARCH_DELAY_MS);
  };
  const closeMobileSearch = () => {
    searchPanel.classList.remove("mobile-open");
    syncSearchPanelToViewport();
    searchToggle.setAttribute("aria-expanded", "false");
    if (searchPanel.parentElement === document.body)
      sidebar.insertBefore(searchPanel, tocDetails);
    searchToggle.focus();
    searchInput.value = "";
    updateSearch();
  };
  searchInput.addEventListener("input", scheduleSearch);
  // Don't steal focus from the input, so the keyboard stays up on mobile.
  regexToggle.addEventListener("mousedown", (event) => event.preventDefault());
  regexToggle.addEventListener("click", () => {
    regexMode = !regexMode;
    regexToggle.setAttribute("aria-pressed", String(regexMode));
    regexToggle.title = "Regular expression: " + (regexMode ? "on" : "off");
    searchPanel.classList.toggle("regex-on", regexMode);
    searchInput.placeholder = regexMode
      ? "Find with regex"
      : `Find in this ${view.noun}`;
    updateSearch();
  });
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // Enter while a search is still waiting runs it now instead of moving on.
      if (searchTimer && updateSearch()) return;
      showMatch(currentMatch + (event.shiftKey ? -1 : 1));
    } else if (
      event.key === "Escape" &&
      searchPanel.classList.contains("mobile-open")
    ) {
      closeMobileSearch();
    }
  });
  searchPanel
    .querySelector(".reference-search-prev")
    .addEventListener("click", () => showMatch(currentMatch - 1));
  searchPanel
    .querySelector(".reference-search-next")
    .addEventListener("click", () => showMatch(currentMatch + 1));
  searchPanel
    .querySelector(".reference-search-close")
    .addEventListener("click", closeMobileSearch);
  searchToggle.addEventListener("click", () => {
    if (matchMedia("(max-width: 760px)").matches)
      document.body.append(searchPanel);
    searchPanel.classList.add("mobile-open");
    syncSearchPanelToViewport();
    searchToggle.setAttribute("aria-expanded", "true");
    searchInput.focus();
  });
  root.onclick = (e) => {
    const a = e.target.closest("[data-a]");
    if (a) {
      e.preventDefault();
      const el = currentDoc.getElementById(a.dataset.a);
      if (el) scrollToHeading(el);
    }
  };

  // ----- content loading (markdown or html, chosen by file extension) -----
  const renderToc = (toc) => {
    tocDetails.hidden = !toc.length;
    tocDetails.replaceChildren(
      h(
        "summary",
        {},
        h("strong", {}, "On this page"),
        h("span", {}, `${toc.length} sections`),
      ),
      h(
        "nav",
        { class: "reference-toc-links", "aria-label": "Sections" },
        toc.map((t) =>
          h(
            "a",
            {
              href: "#",
              class: "reference-toc-link",
              "data-a": t.id,
              style: `padding-left:${Math.max(0, t.n - 2) * 0.75 + 0.5}rem`,
            },
            t.t,
          ),
        ),
      ),
    );
  };
  const loadMarkdown = async (term, token) => {
    const r = await fetch("content/" + term.file);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const source = await r.text();
    if (token !== loadToken) return null;
    const { html, toc } = md(withoutContentsSection(source));
    body.className = "md";
    body.replaceChildren();
    currentDoc = document;
    appendSanitizedReferenceHtml(body, html);
    if (view.route === "canvas")
      body.querySelectorAll("pre code.language-sql").forEach((code) => {
        try {
          code.textContent = formatCanvasSQL(code.textContent);
        } catch {
          /* keep the original text if formatting fails */
        }
      });
    body.querySelectorAll('pre code[class^="language-"]').forEach((code) => {
      const html = highlightCode(
        code.textContent,
        code.className.slice("language-".length).toLowerCase(),
      );
      if (html !== null) code.innerHTML = html;
    });
    body.querySelectorAll(".mermaid-source").forEach((source) => {
      const diagram = renderMermaidFlowchart(source.textContent);
      if (diagram) source.replaceWith(diagram);
      else source.classList.add("reference-code-fallback");
    });
    return toc;
  };
  // An .html canvas runs in an iframe, so its own CSS and JS execute normally
  // without touching (or being touched by) the rest of the app.
  const loadHtml = async (term, token) => {
    const r = await fetch("content/" + term.file);
    if (!r.ok) throw new Error("HTTP " + r.status);
    r.body?.cancel?.();
    if (token !== loadToken) return null;
    const f = h("iframe", {
      class: "canvas-frame",
      title: `${cur.title} – ${term.label}`,
      sandbox:
        "allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads",
      src: "content/" + term.file,
    });
    // Attach the listener before inserting so the load can't be missed.
    const loaded = new Promise((resolve) =>
      f.addEventListener("load", resolve, { once: true }),
    );
    body.className = "canvas-html";
    body.replaceChildren(f);
    frame = f;
    await loaded;
    if (token !== loadToken || frame !== f) return null;
    const doc = f.contentDocument;
    if (!doc || !doc.documentElement) throw new Error("Cannot read the page");
    currentDoc = doc;
    syncFrameTheme();
    const style = doc.createElement("style");
    style.textContent =
      ".reference-search-match{color:#172033;background:#f3c969;border-radius:2px}" +
      ".reference-search-match.current{outline:2px solid #315bd6;outline-offset:1px;background:#f0b93a}";
    (doc.head || doc.documentElement).append(style);
    // Grow the frame to fit its content so the page itself scrolls (this
    // keeps the sticky sidebar, search and scroll-to-match behaving).
    const fit = () => {
      const height = Math.max(
        doc.documentElement.scrollHeight,
        doc.body ? doc.body.scrollHeight : 0,
      );
      if (height && Math.abs(f.offsetHeight - height) > 1)
        f.style.height = height + "px";
    };
    fit();
    frameObserver = new ResizeObserver(fit);
    frameObserver.observe(doc.documentElement);
    if (doc.body) frameObserver.observe(doc.body);
    return [...doc.querySelectorAll("h1, h2, h3")]
      .filter((el) => el.textContent.trim())
      .map((el, i) => {
        if (!el.id) el.id = `canvas-section-${i}`;
        return {
          n: Number(el.tagName[1]),
          id: el.id,
          t: el.textContent.trim().replace(/\s+/g, " "),
        };
      });
  };
  async function showTerm(index, userSwitch = false, direction = 0) {
    const token = ++loadToken,
      term = cur.terms[index],
      previousIndex = termIndex,
      dir = direction || (index > previousIndex ? 1 : -1);
    termIndex = index;
    lastLibraryTerm[view.route] = term.label;
    syncTermPicker(userSwitch);
    // replaceState keeps the address shareable without re-running the route.
    const url = `#/${view.route}/${encodeURIComponent(cur.id)}/${encodeURIComponent(term.label)}`;
    if (location.hash !== url) history.replaceState(null, "", url);
    clearTimeout(searchTimer);
    searchTimer = 0;
    // Slide the page that is on screen out first. Only for a real switch
    // between two terms (not the first load, not reduced motion).
    const slide =
      userSwitch && pageShown && index !== previousIndex && canSlide();
    pageShown = false;
    if (slide) {
      beginSlideState();
      await slidePage("out", dir).finished.catch(() => {});
      if (token !== loadToken) return; // a newer switch took over
    } else {
      stopSlide();
      endSlideState();
    }
    forgetHighlights();
    teardownFrame();
    body.className = "md";
    body.replaceChildren(h("p", { class: "reference-loading" }, "Loading…"));
    // If the next page is slow, stop hiding the card so "Loading…" shows.
    const reveal = slide
      ? setTimeout(() => token === loadToken && stopSlide(), 260)
      : 0;
    let toc = [];
    try {
      toc =
        libraryFileKind(term.file) === "html"
          ? await loadHtml(term, token)
          : await loadMarkdown(term, token);
      if (token !== loadToken || !toc) return;
    } catch (e) {
      if (token !== loadToken) return;
      teardownFrame();
      body.className = "md";
      body.replaceChildren(
        h("p", { class: "err" }, `Could not load ${term.file}: ${e.message}`),
      );
    } finally {
      clearTimeout(reveal);
    }
    renderToc(toc);
    // Re-apply whatever is in the search box to the newly shown term.
    lastSearchKey = null;
    updateSearch();
    pageShown = true;
    // The new page arrives at its own height, then slides in.
    if (slide) body.style.minHeight = "";
    if (userSwitch && body.getBoundingClientRect().top < 0)
      body.scrollIntoView({ block: "start" });
    if (slide) {
      slidePage("in", dir).finished.then(
        () => {
          if (token === loadToken) endSlideState();
        },
        () => {}, // cancelled by a newer switch, which cleans up itself
      );
      tocDetails.animate?.(
        [
          { opacity: 0, transform: "translateY(10px)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: SLIDE_IN_MS,
          delay: 60,
          easing: SLIDE_EASE,
          fill: "backwards",
        },
      );
    }
  }
  await showTerm(termIndex);
}

const PRACTICE_PAGE_SIZE = 40;
const PRACTICE_VISIBLE_KEY = "practice-site-practice-visible-count";
function readPracticeVisibleCount() {
  try {
    const value = Number(sessionStorage.getItem(PRACTICE_VISIBLE_KEY));
    return Number.isSafeInteger(value) && value >= PRACTICE_PAGE_SIZE
      ? value
      : PRACTICE_PAGE_SIZE;
  } catch {
    return PRACTICE_PAGE_SIZE;
  }
}
let practiceVisibleCount = readPracticeVisibleCount();

async function pagePractice(root, routePackageId = "", routeExerciseId = "") {
  if (!S.exercises.length)
    return root.append(
      empty(
        "No exercises installed yet.",
        "Ask the site maintainer to add an exercise package.",
      ),
    );
  const f = { course: "", category: "", difficulty: "", term: "" },
    list = h("div", { class: "side" }),
    pane = h("div"),
    flt = h("div", {
      class: "practice-filters",
      "aria-label": "Filter exercises",
    });
  const answers = S.drafts;
  let showCompleted = false;
  let selectedKey = "";
  let items = [];
  // Rendering 1000+ buttons at once crashes Safari on iPhone, so only a window
  // of the filtered list is in the DOM. "Show more" extends the window.
  let lastResults = {};
  // Lower-cased search text computed once instead of on every keystroke.
  const haystack = new Map(
    S.exercises.map((e) => [
      e,
      [e.title, e.instructions, e.id]
        .map((value) => String(value || ""))
        .join("\n")
        .toLocaleLowerCase(),
    ]),
  );
  const categoryLabel = (category) =>
    category
      .replace(/-/g, " ")
      .toLocaleLowerCase()
      .replace(/\b[a-z]/g, (letter) => letter.toLocaleUpperCase());
  const packageLabel = (packageId) =>
    packageId
      .replace(/-/g, " ")
      .toLocaleLowerCase()
      .replace(/\b[a-z]/g, (letter) => letter.toLocaleUpperCase());
  const terms = [
    ...new Set(
      S.exercises.map((exercise) => exercise.term).filter(Number.isInteger),
    ),
  ].sort((a, b) => a - b);
  const search = h("input", {
      type: "search",
      placeholder: "Search titles",
      "aria-label": "Search questions",
      oninput: () => redraw(),
    }),
    searchControl = h(
      "label",
      { class: "filter-control filter-search" },
      h("span", { class: "filter-label" }, "Search questions"),
      search,
    ),
    termSelect = h(
      "select",
      {
        onchange: (e) => {
          f.term = e.target.value;
          f.category = "";
          refreshCategories();
          redraw();
        },
      },
      h("option", { value: "" }, "All terms"),
      ...terms.map((term) =>
        h("option", { value: String(term) }, `Term ${term}`),
      ),
    ),
    courseSelect = h(
      "select",
      {
        onchange: (e) => {
          f.course = e.target.value;
          f.category = "";
          refreshCategories();
          redraw();
        },
      },
      h("option", { value: "" }, "All"),
      uniq(S.exercises, (e) => e.course).map((v) =>
        h("option", { value: v }, courseLabel(v)),
      ),
    ),
    categorySelect = h("select", {
      onchange: (e) => {
        if (!e.target.value) {
          f.category = "";
        } else {
          [f.course, f.category] = JSON.parse(e.target.value);
          courseSelect.value = f.course;
        }
        refreshCategories();
        redraw();
      },
    }),
    difficultySelect = h(
      "select",
      {
        onchange: (e) => {
          f.difficulty = e.target.value;
          redraw();
        },
      },
      h("option", { value: "" }, "All"),
      DIFF.filter((d) => S.exercises.some((e) => e.difficulty === d)).map((v) =>
        h("option", { value: v }, v),
      ),
    ),
    filterControl = (name, select) =>
      h(
        "label",
        { class: "filter-control" },
        h("span", { class: "filter-label" }, name),
        select,
      );
  const completedToggle = h(
    "button",
    {
      type: "button",
      class: "sec",
      "aria-pressed": "false",
      onclick: () => {
        showCompleted = !showCompleted;
        completedToggle.textContent = showCompleted
          ? "Hide completed"
          : "Show completed exercises";
        completedToggle.setAttribute("aria-pressed", String(showCompleted));
        redraw();
      },
    },
    "Show completed exercises",
  );
  function refreshCategories() {
    const categories = [
      ...new Map(
        S.exercises
          .filter(
            (e) =>
              (!f.course || e.course === f.course) &&
              (!f.term || String(e.term) === f.term),
          )
          .map((e) => [JSON.stringify([e.course, e.category]), e]),
      ).values(),
    ].sort(
      (a, b) =>
        a.category.localeCompare(b.category) ||
        a.course.localeCompare(b.course),
    );
    const courseCounts = new Map();
    categories.forEach((e) =>
      courseCounts.set(e.category, (courseCounts.get(e.category) || 0) + 1),
    );
    categorySelect.replaceChildren(
      h("option", { value: "" }, "All"),
      ...categories.map((e) =>
        h(
          "option",
          { value: JSON.stringify([e.course, e.category]) },
          `${categoryLabel(e.category)}${courseCounts.get(e.category) > 1 ? ` (${courseLabel(e.course)})` : ""}`,
        ),
      ),
    );
    categorySelect.value = f.category
      ? JSON.stringify([f.course, f.category])
      : "";
  }
  refreshCategories();
  flt.append(
    searchControl,
    filterControl("Term", termSelect),
    filterControl("Course", courseSelect),
    filterControl("Category", categorySelect),
    filterControl("Difficulty", difficultySelect),
    completedToggle,
  );
  const makeButton = (e) =>
    h(
      "button",
      {
        class: "item" + (keyOf(e) === selectedKey ? " on" : ""),
        "aria-pressed": keyOf(e) === selectedKey,
        onclick: () => {
          selectExercise(e, true);
        },
      },
      `${lastResults[keyOf(e)] === undefined ? "○" : lastResults[keyOf(e)] ? "✔" : "✘"} ${e.title}`,
      h(
        "small",
        {},
        ` ${packageLabel(e.packageId)} · ${Number.isInteger(e.term) ? `Term ${e.term} · ` : ""}${e.difficulty}${e.examEligible ? "" : " · not on exam"}`,
      ),
    );
  const moreRow = () =>
    h(
      "div",
      { class: "practice-more" },
      h(
        "small",
        {},
        `Showing ${Math.min(practiceVisibleCount, items.length)} of ${items.length}`,
      ),
      h(
        "button",
        { type: "button", class: "sec", onclick: showMore },
        `Show ${Math.min(PRACTICE_PAGE_SIZE, items.length - practiceVisibleCount)} more`,
      ),
    );
  // Append the next chunk instead of rebuilding the list, so the scroll
  // position stays put and the DOM work stays small.
  function showMore() {
    const from = practiceVisibleCount;
    practiceVisibleCount += PRACTICE_PAGE_SIZE;
    try {
      sessionStorage.setItem(
        PRACTICE_VISIBLE_KEY,
        String(practiceVisibleCount),
      );
    } catch {
      // The in-memory count still works when session storage is unavailable.
    }
    list.querySelector(".practice-more")?.remove();
    const fresh = items.slice(from, practiceVisibleCount).map(makeButton);
    list.append(...fresh);
    if (items.length > practiceVisibleCount) list.append(moreRow());
    fresh[0]?.focus({ preventScroll: true });
  }
  const draw = () => {
    const query = search.value.trim().toLocaleLowerCase();
    const filtered = S.exercises.filter(
      (e) =>
        Object.entries(f).every(([k, v]) => !v || String(e[k]) === v) &&
        (!query || haystack.get(e).includes(query)),
    );
    // Keep the active exercise available while filters/search change. The
    // current question stays pinned in the list until the learner explicitly
    // selects another exercise; filters may narrow the other choices but must
    // never clear the active question or its answer pane.
    const selectedExercise = selectedKey
      ? S.exercises.find((e) => keyOf(e) === selectedKey)
      : null;
    items = filtered.filter(
      (e) =>
        showCompleted || keyOf(e) === selectedKey || !S.xpRewards[keyOf(e)],
    );
    if (selectedExercise && !items.some((e) => keyOf(e) === selectedKey)) {
      items.unshift(selectedExercise);
    }
    lastResults = {};
    S.attempts.forEach((a) => {
      lastResults[a.key] = a.correct;
    });
    // Keep the list virtualized when a deep link or Next action selects an
    // exercise beyond the visible window. Show that selected row separately
    // instead of expanding the list through every preceding exercise.
    const nodes = items.slice(0, practiceVisibleCount).map(makeButton);
    const selectedIndex = items.findIndex((e) => keyOf(e) === selectedKey);
    if (selectedIndex >= practiceVisibleCount)
      nodes.push(makeButton(items[selectedIndex]));
    if (!nodes.length)
      nodes.push(
        h(
          "small",
          {},
          filtered.length && !showCompleted
            ? "All matching exercises are completed."
            : "No exercises match these filters.",
        ),
      );
    else if (items.length > practiceVisibleCount) nodes.push(moreRow());
    list.replaceChildren(...nodes);
    pane.firstElementChild?.refreshNextExercise?.();
  };
  // Filter, search and completed-toggle changes start again from page one.
  function redraw() {
    practiceVisibleCount = PRACTICE_PAGE_SIZE;
    try {
      sessionStorage.setItem(
        PRACTICE_VISIBLE_KEY,
        String(practiceVisibleCount),
      );
    } catch {
      // Ignore storage restrictions; filtering still redraws correctly.
    }
    draw();
  }
  function selectExercise(
    exercise,
    addHistoryEntry,
    scrollToExercise = addHistoryEntry,
  ) {
    selectedKey = keyOf(exercise);
    draw();
    const nextExerciseAfter = () => {
      const index = items.findIndex((item) => keyOf(item) === keyOf(exercise));
      return index >= 0 ? items[index + 1] : undefined;
    };
    const view = qView(
      exercise,
      "practice",
      () => answers[keyOf(exercise)],
      (v) => saveDraft(keyOf(exercise), v),
      () => draw(),
      () => {
        const next = nextExerciseAfter();
        if (next) selectExercise(next, true);
      },
      () => !!nextExerciseAfter(),
    );
    pane.replaceChildren(view);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        // Anchor to the actual exercise heading after the page has been
        // attached and laid out. This also works for direct URLs and reloads,
        // not only for clicks in the exercise list.
        if (scrollToExercise && view.isConnected) {
          const title = view.querySelector("h3") || view,
            header = document.querySelector("header"),
            pinned =
              header &&
              ["sticky", "fixed"].includes(getComputedStyle(header).position),
            offset = pinned ? header.getBoundingClientRect().height : 0,
            top = title.getBoundingClientRect().top + scrollY - offset - 12;
          window.scrollTo({
            top: Math.max(0, top),
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          });
        }
        view.focusInput?.();
      }),
    );
    if (addHistoryEntry) {
      const url = `#/practice/${encodeURIComponent(exercise.packageId)}/${encodeURIComponent(exercise.id)}`;
      if (location.hash !== url) history.pushState(null, "", url);
    }
  }
  draw();
  const routeExercise = S.exercises.find(
    (exercise) =>
      exercise.packageId === routePackageId && exercise.id === routeExerciseId,
  );
  if (routeExercise) selectExercise(routeExercise, false, true);
  root.append(flt, h("div", { class: "cols" }, list, pane));
}

async function pageExam(root, isCurrent = () => true) {
  let saved;
  try {
    const [indexedDbExam, checkpoint] = await Promise.all([
      kv.get("exam", null),
      Promise.resolve(readExamCheckpoint()),
    ]);
    saved =
      checkpoint &&
      (!indexedDbExam ||
        (checkpoint.savedAt || 0) > (indexedDbExam.savedAt || 0))
        ? checkpoint
        : indexedDbExam;
  } catch (error) {
    root.append(empty("Could not read the saved exam.", error.message));
    return;
  }
  if (!isCurrent()) return;
  if (saved && !saved.submitted) {
    const shouldContinue = await confirmInApp({
      title: "Exam in progress",
      message:
        "There’s an unfinished exam saved on this device. Would you like to continue where you left off?",
      confirmLabel: "Continue exam",
      cancelLabel: "Discard exam",
      danger: true,
      reverseDanger: true,
    });
    if (!isCurrent()) return;
    if (shouldContinue) {
      return runExam(root, saved);
    }
    try {
      await discardExamState();
      achTrack((s) => void s.discards++, { full: false });
    } catch (error) {
      root.append(empty("Could not discard the saved exam.", error.message));
      return;
    }
  }

  const eligibleExercises = S.exercises.filter((exercise) =>
    Core.eligible(exercise),
  );
  if (!eligibleExercises.length)
    return root.append(
      empty(
        "No exam-eligible exercises installed yet.",
        "Ask the site maintainer to add an exam-eligible package.",
      ),
      await historyView(),
    );

  const courses = uniq(S.exercises, (exercise) => exercise.course);
  // Term options come from packages that actually contain exam-eligible questions.
  // Sort numerically so Term 2 appears before Term 10.
  const terms = [
    ...new Set(
      eligibleExercises
        .map((exercise) => exercise.term)
        .filter(Number.isInteger),
    ),
  ].sort((a, b) => a - b);

  const cfg = {
    terms: [...terms],
    courses: [],
    Easy: 5,
    Medium: 5,
    Hard: 2,
    Extreme: 0,
    mins: 60,
  };
  const msg = h("div");
  const difficultyInputs = {};
  const termInputs = new Map();
  const courseInputs = new Map();
  const courseLabels = new Map();
  // Remember a user's course choices while a course is temporarily unavailable
  // under the currently selected terms. It becomes selectable again when a
  // matching term is re-enabled.
  const preferredCourses = new Set(
    courses.filter((course) =>
      eligibleExercises.some(
        (exercise) =>
          exercise.course === course &&
          (!terms.length || cfg.terms.includes(exercise.term)),
      ),
    ),
  );

  const num = (key, label) => {
    const input = h("input", {
      type: "number",
      min: 0,
      value: cfg[key],
      oninput: (event) => {
        const maximum = Number(event.target.max) || 0;
        cfg[key] = Math.min(
          maximum,
          Math.max(0, Number(event.target.value) || 0),
        );
        event.target.value = cfg[key];
        updateExamSummary();
      },
    });
    difficultyInputs[key] = input;
    return h(
      "label",
      { class: "exam-count-control" },
      h("span", {}, label),
      input,
    );
  };

  const examSummary = h("div", {
    class: "exam-config-summary",
    "aria-live": "polite",
  });

  const courseHasSelectedTerm = (course) =>
    eligibleExercises.some(
      (exercise) =>
        exercise.course === course &&
        (!terms.length || cfg.terms.includes(exercise.term)),
    );

  const getTermFilteredExercises = () =>
    !terms.length
      ? S.exercises
      : S.exercises.filter((exercise) => cfg.terms.includes(exercise.term));

  const updateExamSummary = () => {
    const count = cfg.Easy + cfg.Medium + cfg.Hard + cfg.Extreme;
    const availableCourses = courses.filter(courseHasSelectedTerm);
    const selectedCourses = !availableCourses.length
      ? "No courses available"
      : cfg.courses.length === availableCourses.length
        ? "All available courses"
        : cfg.courses.length
          ? cfg.courses.map(courseLabel).join(", ")
          : "No courses selected";
    const selectedTerms = !terms.length
      ? "No term metadata"
      : cfg.terms.length === terms.length
        ? "All terms"
        : cfg.terms.length
          ? cfg.terms.map((term) => `Term ${term}`).join(", ")
          : "No terms selected";
    examSummary.replaceChildren(
      h("strong", {}, `${count} questions`),
      h(
        "span",
        {},
        `${selectedTerms} · ${selectedCourses} · ${cfg.mins} minutes`,
      ),
    );
  };

  const syncCourseAvailability = () => {
    for (const course of courses) {
      const input = courseInputs.get(course);
      const label = courseLabels.get(course);
      const available = courseHasSelectedTerm(course);
      input.disabled = !available;
      input.checked = available && preferredCourses.has(course);
      label.classList.toggle("is-unavailable", !available);
      if (!available) {
        label.title = "No exam questions for the selected terms";
      } else {
        label.removeAttribute("title");
      }
    }
    cfg.courses = courses.filter(
      (course) =>
        courseHasSelectedTerm(course) && courseInputs.get(course).checked,
    );
    updateDifficultyLimits();
    updateExamSummary();
  };

  const termOptions = h(
    "div",
    {
      class: "exam-term-checkboxes",
      role: "group",
      "aria-label": "Terms",
    },
    terms.length
      ? terms.map((term) => {
          const input = h("input", {
            type: "checkbox",
            checked: true,
            onchange: () => {
              cfg.terms = terms.filter(
                (value) => termInputs.get(value).checked,
              );
              syncCourseAvailability();
              msg.replaceChildren();
            },
          });
          termInputs.set(term, input);
          return h(
            "label",
            { class: "exam-course-checkbox exam-term-checkbox" },
            input,
            h("span", {}, `Term ${term}`),
          );
        })
      : h("small", {}, "No term numbers found in exam-eligible packages."),
  );

  const courseOptions = h(
    "div",
    {
      class: "exam-course-checkboxes",
      role: "group",
      "aria-label": "Courses",
    },
    courses.map((course) => {
      const input = h("input", {
        type: "checkbox",
        checked: preferredCourses.has(course),
        onchange: () => {
          if (input.checked) preferredCourses.add(course);
          else preferredCourses.delete(course);
          syncCourseAvailability();
          msg.replaceChildren();
        },
      });
      const label = h(
        "label",
        { class: "exam-course-checkbox" },
        input,
        h("span", {}, courseLabel(course)),
      );
      courseInputs.set(course, input);
      courseLabels.set(course, label);
      return label;
    }),
  );

  const minuteControl = h(
    "label",
    { class: "exam-count-control exam-minutes-control" },
    h("span", {}, "Minutes"),
    h("input", {
      type: "number",
      min: 1,
      value: cfg.mins,
      oninput: (event) => {
        cfg.mins = Math.max(1, Number(event.target.value) || 1);
        event.target.value = cfg.mins;
        updateExamSummary();
      },
    }),
  );

  const updateDifficultyLimits = () => {
    const termPool = getTermFilteredExercises();
    DIFF.forEach((difficulty) => {
      const available = termPool.filter(
        (exercise) =>
          Core.eligible(exercise) &&
          cfg.courses.includes(exercise.course) &&
          exercise.difficulty === difficulty,
      ).length;
      const input = difficultyInputs[difficulty];
      input.max = available;
      input.disabled = available === 0;
      cfg[difficulty] = Math.min(cfg[difficulty], available);
      input.value = cfg[difficulty];
    });
  };

  const difficultyControls = h(
    "div",
    { class: "exam-difficulty-controls" },
    num("Easy", "Easy"),
    num("Medium", "Medium"),
    num("Hard", "Hard"),
    num("Extreme", "Extreme"),
    minuteControl,
  );

  syncCourseAvailability();
  updateExamSummary();
  root.append(
    h(
      "div",
      { class: "exam-setup-card card" },
      h(
        "div",
        { class: "exam-setup-heading" },
        h("p", { class: "eyebrow" }, "BUILD YOUR SESSION"),
        h("h2", {}, "Start an exam"),
        h(
          "p",
          {},
          "Choose terms, courses, a difficulty mix, and a time limit for your exam.",
        ),
      ),
      h(
        "div",
        { class: "exam-setup-controls" },
        h(
          "div",
          { class: "exam-course-control exam-term-control" },
          h("span", {}, "Terms (select multiple)"),
          termOptions,
        ),
        h(
          "div",
          { class: "exam-course-control" },
          h("span", {}, "Courses"),
          courseOptions,
        ),
        difficultyControls,
        examSummary,
      ),
      h(
        "div",
        { class: "exam-setup-footer" },
        h(
          "button",
          {
            class: "exam-start-button",
            onclick: async () => {
              if (terms.length && !cfg.terms.length) {
                return msg.replaceChildren(
                  h("p", { class: "bad" }, "Select at least one term."),
                );
              }
              if (!cfg.courses.length) {
                return msg.replaceChildren(
                  h(
                    "p",
                    { class: "bad" },
                    "Select at least one available course.",
                  ),
                );
              }
              if (cfg.Easy + cfg.Medium + cfg.Hard + cfg.Extreme === 0) {
                return msg.replaceChildren(
                  h("p", { class: "bad" }, "Select at least one question."),
                );
              }
              const examExercises = getTermFilteredExercises();
              const r = generateExam(
                examExercises,
                {
                  courses: cfg.courses,
                  dist: {
                    Easy: cfg.Easy,
                    Medium: cfg.Medium,
                    Hard: cfg.Hard,
                    Extreme: cfg.Extreme,
                  },
                },
                lastAttempt(),
              );
              if (!r.ok) {
                const avail = (difficulty) =>
                  examExercises.filter(
                    (exercise) =>
                      Core.eligible(exercise) &&
                      cfg.courses.includes(exercise.course) &&
                      exercise.difficulty === difficulty,
                  ).length;
                return msg.replaceChildren(
                  h(
                    "p",
                    { class: "bad" },
                    "Not enough eligible exercises: nothing was substituted. " +
                      Object.entries(r.shortage)
                        .map(
                          ([difficulty, shortage]) =>
                            `${difficulty}: need ${shortage.need}, have ${shortage.have}`,
                        )
                        .join("; ") +
                      ".",
                  ),
                  h(
                    "small",
                    {},
                    `Available in selected terms: Easy ${avail("Easy")}, Medium ${avail("Medium")}, Hard ${avail("Hard")}, Extreme ${avail("Extreme")}. Adjust the numbers above.`,
                  ),
                );
              }
              const examConfig = {
                ...cfg,
                terms: [...cfg.terms],
                courses: [...cfg.courses],
              };
              const st = {
                id: "x" + Date.now(),
                ids: r.exercises.map(keyOf),
                answers: {},
                flags: {},
                cur: 0,
                cfg: examConfig,
                deadline: Date.now() + cfg.mins * 60000,
                startedAt: Date.now(),
                submitted: false,
              };
              await saveExamState(st);
              root.replaceChildren();
              runExam(root, st);
            },
          },
          h("span", { "aria-hidden": "true" }, "▶"),
          " Start exam",
        ),
        h("small", {}, "Your answers save automatically during the exam."),
      ),
      msg,
    ),
    await historyView(),
  );
}
async function historyView() {
  const hist = await kv.get("examHistory", []);
  return h(
    "div",
    { class: "card" },
    h("h3", {}, "Exam history"),
    hist.length
      ? hist
          .slice()
          .reverse()
          .map((x) =>
            h(
              "div",
              {},
              `${new Date(x.date).toLocaleString()}: ${x.score}/${x.total} (${x.ids.length} questions, ${Math.round(x.cfg.mins)} min)`,
            ),
          )
      : h("small", {}, "No exams taken yet."),
  );
}
async function runExam(root, st) {
  const exs = st.ids.map(
    (id) =>
      S.exercises.find((e) => keyOf(e) === id) ||
      (S.exercises.filter((e) => e.id === id).length === 1
        ? S.exercises.find((e) => e.id === id)
        : null),
  );
  if (exs.some((e) => !e))
    return root.append(
      empty(
        "This saved exam refers to unavailable or ambiguous exercises.",
        h(
          "button",
          {
            onclick: async () => {
              await discardExamState();
              location.reload();
            },
          },
          "Discard exam",
        ),
      ),
    );
  const oldAnswers = st.answers || {},
    oldFlags = st.flags || {};
  st.answers = Object.fromEntries(
    exs
      .map((ex) => [keyOf(ex), oldAnswers[keyOf(ex)] ?? oldAnswers[ex.id]])
      .filter(([, value]) => value !== undefined),
  );
  st.flags = Object.fromEntries(
    exs
      .map((ex) => [keyOf(ex), oldFlags[keyOf(ex)] ?? oldFlags[ex.id]])
      .filter(([, value]) => value !== undefined),
  );
  st.ids = exs.map(keyOf);
  const saveStatus = h("small", {
    class: "exam-save-status",
    role: "status",
    "aria-live": "polite",
  });
  const save = () =>
    saveExamState(st)
      .then(() => {
        saveStatus.textContent = "Progress saved locally.";
        saveStatus.classList.remove("err");
      })
      .catch((error) => {
        saveStatus.textContent =
          "Could not save exam progress: " + error.message;
        saveStatus.classList.add("err");
      });
  const top = h("div", { class: "exam-topbar card" }),
    nav = h("div", { class: "exam-question-grid" }),
    body = h("div", { class: "exam-question-body" }),
    timer = h("span", { class: "exam-timer-clock", role: "timer" }),
    summary = h("p", { class: "exam-summary", "aria-live": "polite" }),
    progress = h("progress", {
      class: "exam-progress",
      max: exs.length,
      value: 0,
      "aria-label": "Questions answered",
    }),
    workspace = h(
      "div",
      { class: "exam-workspace" },
      h(
        "aside",
        { class: "exam-nav-panel card" },
        h("h2", {}, "Questions"),
        h("p", {}, "Choose a number to jump to a question."),
        nav,
        h(
          "small",
          { class: "exam-nav-legend" },
          "Filled = answered · outlined = flagged",
        ),
      ),
      h("section", { class: "exam-question-panel card" }, body),
    ),
    session = h("section", { class: "exam-session" }, top, workspace);
  let done = false;
  let autoSubmitted = false;
  let autosaveTimer;
  const submit = async () => {
    if (done || st.submitted) return;
    done = true;
    clearInterval(iv);
    clearInterval(autosaveTimer);
    root.replaceChildren(
      h(
        "div",
        { class: "exam-grading card", role: "status" },
        h("span", { class: "exam-grading-spinner", "aria-hidden": "true" }),
        h("h2", {}, "Grading your exam…"),
        h("p", {}, "Your answers are being checked. This may take a moment."),
      ),
    );
    let score = 0,
      gradable = 0;
    const rows = [];
    for (const ex of exs) {
      const key = keyOf(ex),
        a = st.answers[key];
      let ok = null;
      if (ex.type === "sql-query") {
        const g = await gradeSql(ex, a || "");
        ok = g.correct;
        rows.push({ ex, ok, a, note: g.error });
      } else {
        ok = gradeOS(ex, a);
        rows.push({ ex, ok, a });
      }
      if (ok !== null) {
        gradable++;
        if (ok) score++;
        await rec(ex, ok, "exam");
      }
    }
    const hist = await kv.get("examHistory", []);
    hist.push({
      date: Date.now(),
      ids: st.ids,
      score,
      total: gradable,
      cfg: st.cfg,
    });
    await kv.set("examHistory", hist);
    achOnExam({
      score,
      gradable,
      usedMs: st.startedAt ? Date.now() - st.startedAt : Infinity,
      limitMs: (st.cfg?.mins || 0) * 60000,
      answered: exs.filter((ex) => {
        const a = st.answers[keyOf(ex)];
        return Array.isArray(a)
          ? a.length > 0
          : a != null && String(a).trim() !== "";
      }).length,
      timedOut: autoSubmitted,
    });
    st.submitted = true;
    await discardExamState();
    root.replaceChildren(
      h(
        "section",
        { class: "exam-results" },
        h(
          "div",
          { class: "exam-score-card card" },
          h("p", { class: "eyebrow" }, "EXAM COMPLETE"),
          h("h1", {}, `Score: ${score} / ${gradable}`),
          h(
            "p",
            {},
            gradable < exs.length
              ? "Self-check questions are not included in the score."
              : `${exs.length} questions completed`,
          ),
        ),
        gradable < exs.length
          ? h(
              "p",
              { class: "exam-self-check-note" },
              "Self-check questions are not scored automatically.",
            )
          : "",
        ...rows.map((r) =>
          h(
            "article",
            { class: "exam-result-card card" },
            h(
              "div",
              { class: "exam-result-heading" },
              h("h2", {}, r.ex.title),
              h(
                "span",
                {
                  class:
                    "exam-result-status " +
                    (r.ok ? "ok" : r.ok === false ? "bad" : "meta"),
                },
                r.ok ? "Correct" : r.ok === false ? "Incorrect" : "Self-check",
              ),
            ),
            r.note ? h("pre", { class: "err" }, r.note) : "",
            h(
              "details",
              { class: "exam-answer-review" },
              h("summary", {}, "Review answers"),
              h(
                "div",
                { class: "exam-answer-comparison" },
                h(
                  "div",
                  {},
                  h("h3", {}, "Your answer"),
                  h("pre", {}, answerText(r.ex, r.a)),
                ),
                h(
                  "div",
                  {},
                  h("h3", {}, "Expected answer"),
                  h("pre", {}, expectedText(r.ex)),
                ),
              ),
            ),
            r.ex.explanation ? h("p", {}, r.ex.explanation) : "",
          ),
        ),
      ),
    );
  };
  const show = (i) => {
    const key = keyOf(exs[i]);
    st.cur = i;
    save();
    body.replaceChildren(
      h(
        "div",
        { class: "exam-question-kicker" },
        h("span", {}, `QUESTION ${String(i + 1).padStart(2, "0")}`),
        h("span", {}, `of ${exs.length}`),
      ),
      qView(
        exs[i],
        "exam",
        () => st.answers[key],
        (v) => {
          st.answers[key] = v;
          save();
          updateQuestionStatus();
        },
      ),
      h(
        "label",
        { class: "exam-flag-control" },
        h("input", {
          type: "checkbox",
          checked: !!st.flags[key],
          onchange: (e) => {
            st.flags[key] = e.target.checked;
            save();
            updateQuestionStatus();
          },
        }),
        h("span", {}, "Flag for review"),
      ),
      h(
        "div",
        { class: "exam-question-actions" },
        h(
          "button",
          {
            class: "sec",
            disabled: i === 0,
            onclick: () => show(i - 1),
          },
          "Previous",
        ),
        h(
          "button",
          {
            class: "sec",
            disabled: i === exs.length - 1,
            onclick: () => show(i + 1),
          },
          "Next question",
        ),
      ),
    );
    drawNav();
  };
  const updateQuestionStatus = () => {
    let answered = 0,
      flagged = 0;
    exs.forEach((exercise, i) => {
      const key = keyOf(exercise),
        answer = st.answers[key],
        hasAnswer = Array.isArray(answer)
          ? answer.some((value) => String(value ?? "").trim() !== "")
          : typeof answer === "string"
            ? answer.trim().length > 0
            : answer != null;
      if (hasAnswer) answered++;
      if (st.flags[key]) flagged++;
      const button = nav.children[i];
      if (button) {
        button.classList.toggle("answered", hasAnswer);
        button.classList.toggle("flagged", !!st.flags[key]);
        button.classList.toggle("current", i === st.cur);
        button.setAttribute("aria-current", i === st.cur ? "step" : "false");
        button.setAttribute(
          "aria-label",
          `Question ${i + 1}${hasAnswer ? ", answered" : ", unanswered"}${st.flags[key] ? ", flagged for review" : ""}`,
        );
      }
    });
    progress.value = answered;
    summary.textContent = `${answered} of ${exs.length} answered · ${flagged} flagged for review`;
  };
  const drawNav = () => {
    nav.replaceChildren(
      ...exs.map((e, i) =>
        h(
          "button",
          {
            class: "exam-question-button",
            "aria-current": i === st.cur ? "step" : "false",
            "data-question": i + 1,
            onclick: () => show(i),
          },
          String(i + 1).padStart(2, "0"),
        ),
      ),
    );
    updateQuestionStatus();
  };
  const tick = () => {
    if (!top.isConnected) {
      clearInterval(iv);
      clearInterval(autosaveTimer);
      return;
    }
    const ms = st.deadline - Date.now();
    if (ms <= 0) {
      timer.textContent = "00:00";
      timer.classList.add("urgent");
      autoSubmitted = true;
      submit();
      return;
    }
    const s = Math.ceil(ms / 1000);
    timer.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    timer.classList.toggle("urgent", ms <= 5 * 60_000);
  };
  const iv = setInterval(tick, 500);
  autosaveTimer = setInterval(save, 5000);
  top.append(
    h(
      "div",
      { class: "exam-heading" },
      h("p", { class: "eyebrow" }, "EXAM IN PROGRESS"),
      h("h1", {}, "Stay focused. You’ve got this."),
      h("p", {}, "Your work saves automatically as you answer."),
    ),
    h(
      "div",
      { class: "exam-status" },
      h(
        "div",
        { class: "exam-timer-card" },
        h("span", { class: "exam-timer-label" }, "TIME LEFT"),
        timer,
      ),
      h(
        "div",
        { class: "exam-session-summary" },
        summary,
        progress,
        h("small", {}, "No feedback is shown during the exam."),
        saveStatus,
      ),
      h(
        "button",
        {
          class: "exam-submit-button",
          onclick: async () => {
            if (
              await confirmInApp({
                title: "Submit exam?",
                message:
                  "Submit your answers now? You won’t be able to change them afterward.",
                confirmLabel: "Submit exam",
                danger: true,
              })
            )
              await submit();
          },
        },
        "Submit exam",
      ),
    ),
  );
  root.replaceChildren(session);
  tick();
  if (!done) show(Math.min(st.cur || 0, exs.length - 1));
}

// Everything the Progress page and the achievement popups derive from the
// saved results. Kept separate so both always agree on what is earned.
function computeProgress(examHistory) {
  const ex = S.exercises;
  const xp = Object.values(S.xpRewards).reduce(
    (sum, reward) => sum + (Number.isFinite(reward?.xp) ? reward.xp : 0),
    0,
  );
  const level = Math.floor(xp / 250) + 1,
    levelXp = xp % 250;
  const attempts = new Map(S.attempts.map((a) => [a.key, a]));
  const unlocked = new Set(Object.keys(S.xpRewards));
  const solved = ex.filter((e) => unlocked.has(keyOf(e)));
  const solvedSql = solved.filter((e) => e.course === "sql").length;
  const solvedOs = solved.filter((e) => e.course === "os").length;
  const solvedEasy = solved.filter((e) => e.difficulty === "Easy").length;
  const solvedMedium = solved.filter((e) => e.difficulty === "Medium").length;
  const solvedHard = solved.filter((e) => e.difficulty === "Hard").length;
  const solvedExtreme = solved.filter((e) => e.difficulty === "Extreme").length;
  const courseStats = uniq(ex, (exercise) => exercise.course).map((course) => {
    const exercises = ex.filter((exercise) => exercise.course === course);
    return {
      course,
      exercises,
      solved: solved.filter((exercise) => exercise.course === course).length,
    };
  });
  const solvedMcq = solved.filter((e) =>
      ["mcq-single", "mcq-multi", "mcq-multiple"].includes(e.type),
    ).length,
    solvedSqlQueries = solved.filter((e) => e.type === "sql-query").length,
    solvedCommands = solved.filter((e) => e.type === "command-text").length,
    solvedBlanks = solved.filter((e) => e.type === "fill-blank").length,
    solvedTopics = new Set(solved.map((e) => e.topic || e.category)).size,
    attemptedLatest = ex
      .map((exercise) => attempts.get(keyOf(exercise)))
      .filter(Boolean),
    latestCorrect = attemptedLatest.filter((attempt) => attempt.correct).length,
    latestAccuracy = attemptedLatest.length
      ? latestCorrect / attemptedLatest.length
      : 0;
  const courseCount = courseStats.filter((stat) => stat.solved > 0).length;
  const perfectExams = examHistory.filter(
    (exam) => exam.total > 0 && exam.score === exam.total,
  ).length;
  const highScoreExams = examHistory.filter(
    (exam) => exam.total > 0 && exam.score / exam.total >= 0.9,
  ).length;
  const baseAchievements = [
    {
      title: "First Clear",
      detail: "Solve your first exercise",
      count: solved.length,
      target: 1,
    },
    {
      title: "Getting Warm",
      detail: "Solve 5 exercises",
      count: solved.length,
      target: 5,
    },
    {
      title: "On a Roll",
      detail: "Solve 10 exercises",
      count: solved.length,
      target: 10,
    },
    {
      title: "Quest Master",
      detail: "Solve 25 exercises",
      count: solved.length,
      target: 25,
    },
    {
      title: "Legend",
      detail: "Solve 50 exercises",
      count: solved.length,
      target: 50,
    },
    {
      title: "Century Club",
      detail: "Solve 100 exercises",
      count: solved.length,
      target: 100,
    },
    {
      title: "The Grand Library",
      detail: "Solve 250 exercises",
      count: solved.length,
      target: 250,
    },
    {
      title: "Query Rookie",
      detail: "Solve your first SQL exercise",
      count: solvedSql,
      target: 1,
    },
    {
      title: "SQL Specialist",
      detail: "Solve 5 SQL exercises",
      count: solvedSql,
      target: 5,
    },
    {
      title: "Query Architect",
      detail: "Solve 25 SQL exercises",
      count: solvedSql,
      target: 25,
    },
    {
      title: "SQL Centurion",
      detail: "Solve 50 SQL exercises",
      count: solvedSql,
      target: 50,
    },
    {
      title: "SQL Grandmaster",
      detail: "Solve 100 SQL exercises",
      count: solvedSql,
      target: 100,
    },
    {
      title: "Shell Initiate",
      detail: "Solve your first OS exercise",
      count: solvedOs,
      target: 1,
    },
    {
      title: "Terminal Tamer",
      detail: "Solve 5 OS exercises",
      count: solvedOs,
      target: 5,
    },
    {
      title: "Shell Wizard",
      detail: "Solve 25 OS exercises",
      count: solvedOs,
      target: 25,
    },
    {
      title: "Command Collector",
      detail: "Solve 50 OS exercises",
      count: solvedOs,
      target: 50,
    },
    {
      title: "Terminal Legend",
      detail: "Solve 100 OS exercises",
      count: solvedOs,
      target: 100,
    },
    {
      title: "Warm-up Complete",
      detail: "Solve 25 Easy exercises",
      count: solvedEasy,
      target: 25,
    },
    {
      title: "Easy Does It",
      detail: "Solve 100 Easy exercises",
      count: solvedEasy,
      target: 100,
    },
    {
      title: "Finding Your Feet",
      detail: "Solve your first Medium exercise",
      count: solvedMedium,
      target: 1,
    },
    {
      title: "Steady Climber",
      detail: "Solve 10 Medium exercises",
      count: solvedMedium,
      target: 10,
    },
    {
      title: "Mid-Tier Master",
      detail: "Solve 25 Medium exercises",
      count: solvedMedium,
      target: 25,
    },
    {
      title: "No Middle Ground",
      detail: "Solve 50 Medium exercises",
      count: solvedMedium,
      target: 50,
    },
    {
      title: "Hard Mode",
      detail: "Solve your first Hard exercise",
      count: solvedHard,
      target: 1,
    },
    {
      title: "Boss Breaker",
      detail: "Solve 10 Hard exercises",
      count: solvedHard,
      target: 10,
    },
    {
      title: "Hard Carry",
      detail: "Solve 25 Hard exercises",
      count: solvedHard,
      target: 25,
    },
    {
      title: "Unbreakable",
      detail: "Solve 50 Hard exercises",
      count: solvedHard,
      target: 50,
    },
    {
      title: "Extreme Mode",
      detail: "Solve your first Extreme exercise",
      count: solvedExtreme,
      target: 1,
    },
    {
      title: "Extreme Streak",
      detail: "Solve 5 Extreme exercises",
      count: solvedExtreme,
      target: 5,
    },
    {
      title: "Beyond Extreme",
      detail: "Solve 10 Extreme exercises",
      count: solvedExtreme,
      target: 10,
    },
    {
      title: "Mythic Difficulty",
      detail: "Solve 25 Extreme exercises",
      count: solvedExtreme,
      target: 25,
    },
    {
      title: "Exam Ready",
      detail: "Complete your first exam",
      count: examHistory.length,
      target: 1,
    },
    {
      title: "Exam Veteran",
      detail: "Complete 5 exams",
      count: examHistory.length,
      target: 5,
    },
    {
      title: "Exam Regular",
      detail: "Complete 10 exams",
      count: examHistory.length,
      target: 10,
    },
    {
      title: "Exam Enthusiast",
      detail: "Complete 25 exams",
      count: examHistory.length,
      target: 25,
    },
    {
      title: "Exam Institution",
      detail: "Complete 50 exams",
      count: examHistory.length,
      target: 50,
    },
    {
      title: "Perfect Score",
      detail: "Get a perfect score on an exam",
      count: perfectExams,
      target: 1,
    },
    {
      title: "Perfectionist",
      detail: "Get 3 perfect exam scores",
      count: perfectExams,
      target: 3,
    },
    {
      title: "Flawless Record",
      detail: "Get 10 perfect exam scores",
      count: perfectExams,
      target: 10,
    },
    {
      title: "Ace Student",
      detail: "Score at least 90% on an exam",
      count: highScoreExams,
      target: 1,
    },
    {
      title: "Consistent Ace",
      detail: "Score at least 90% on 5 exams",
      count: highScoreExams,
      target: 5,
    },
    {
      title: "Difficulty Diplomat",
      detail: "Solve an exercise at every difficulty",
      count: [solvedEasy, solvedMedium, solvedHard, solvedExtreme].filter(
        (count) => count > 0,
      ).length,
      target: 4,
    },
    {
      title: "XP Hoarder",
      detail: "Earn 1,000 XP",
      count: xp,
      target: 1000,
    },
    {
      title: "Power Level",
      detail: "Earn 2,500 XP",
      count: xp,
      target: 2500,
    },
    {
      title: "Five Thousand Club",
      detail: "Earn 5,000 XP",
      count: xp,
      target: 5000,
    },
    {
      title: "SQL Apprentice",
      detail: "Solve 10 SQL query exercises",
      count: solvedSqlQueries,
      target: 10,
    },
    {
      title: "Relational Reasoner",
      detail: "Solve 10 SQL theory questions",
      count: solved.filter(
        (e) =>
          e.course === "sql" &&
          ["mcq-single", "mcq-multi", "mcq-multiple"].includes(e.type),
      ).length,
      target: 10,
    },
    {
      title: "Systems Foundations",
      detail: "Solve 10 operating-systems exercises",
      count: solvedOs,
      target: 10,
    },
    {
      title: "Terminal Operator",
      detail: "Solve 10 command-line exercises",
      count: solvedCommands,
      target: 10,
    },
    {
      title: "Conceptual Fluency",
      detail: "Solve 25 multiple-choice questions",
      count: solvedMcq,
      target: 25,
    },
    {
      title: "Blank Page Solver",
      detail: "Solve 10 fill-in-the-blank exercises",
      count: solvedBlanks,
      target: 10,
    },
    {
      title: "Interdisciplinary Learner",
      detail: "Solve exercises in at least two courses",
      count: courseCount,
      target: 2,
    },
    {
      title: "Topic Cartographer",
      detail: "Solve exercises across 5 distinct topics",
      count: solvedTopics,
      target: 5,
    },
    {
      title: "Academic Portfolio",
      detail: "Solve exercises across 10 distinct topics",
      count: solvedTopics,
      target: 10,
    },
    {
      title: "Measured Accuracy",
      detail: "Reach 80% latest-result accuracy across 10 attempts",
      count: attemptedLatest.length >= 10 && latestAccuracy >= 0.8 ? 1 : 0,
      target: 1,
    },
    {
      title: "Reliable Researcher",
      detail: "Reach 90% latest-result accuracy across 20 attempts",
      count: attemptedLatest.length >= 20 && latestAccuracy >= 0.9 ? 1 : 0,
      target: 1,
    },
    {
      title: "Quarter-Curriculum",
      detail: "Solve at least 25% of the available curriculum",
      count: solved.length,
      target: Math.max(1, Math.ceil(ex.length * 0.25)),
    },
    {
      title: "Halfway Scholar",
      detail: "Solve at least 50% of the available curriculum",
      count: solved.length,
      target: Math.max(1, Math.ceil(ex.length * 0.5)),
    },
    {
      title: "Curriculum Complete",
      detail: "Solve every currently available exercise",
      count: solved.length,
      target: Math.max(1, ex.length),
    },
    {
      title: "Junior Scholar",
      detail: "Reach academic level 5",
      count: level,
      target: 5,
    },
    {
      title: "Senior Scholar",
      detail: "Reach academic level 10",
      count: level,
      target: 10,
    },
    {
      title: "Distinguished Scholar",
      detail: "Reach academic level 20",
      count: level,
      target: 20,
    },
    ...courseStats.flatMap(({ course, exercises, solved: solvedCount }) => [
      {
        title: `${courseLabel(course)} Explorer`,
        detail: `Solve your first ${courseLabel(course)} exercise`,
        count: solvedCount,
        target: 1,
      },
      {
        title: `${courseLabel(course)} Specialist`,
        detail: `Solve 25 ${courseLabel(course)} exercises`,
        count: solvedCount,
        target: 25,
      },
      {
        title: `${courseLabel(course)} Curriculum Complete`,
        detail: `Solve every available ${courseLabel(course)} exercise`,
        count: solvedCount,
        target: Math.max(1, exercises.length),
      },
    ]),
  ];
  baseAchievements.forEach((a) => {
    a.id ??= "base:" + a.title;
    a.icon ??= "🏆";
    a.tier ??= "silver";
  });
  const achievements = [...baseAchievements, ...customAchievements()];
  return {
    ex,
    xp,
    level,
    levelXp,
    attempts,
    unlocked,
    solved,
    courseStats,
    attemptedLatest,
    latestAccuracy,
    achievements,
  };
}
async function pageProgress(root) {
  const ex = S.exercises,
    reset = resetLocalDataControl(root);
  await achReady; // stats must be loaded before the stat-based achievements are drawn
  const savedExamHistory = await kv.get("examHistory", []);
  const examHistory = Array.isArray(savedExamHistory) ? savedExamHistory : [];
  const {
    xp,
    level,
    levelXp,
    attempts,
    unlocked,
    solved,
    courseStats,
    achievements,
  } = computeProgress(examHistory);
  const academicRank =
    level >= 20
      ? "Distinguished Scholar"
      : level >= 10
        ? "Senior Scholar"
        : level >= 5
          ? "Junior Scholar"
          : "Foundations";
  const hero = h(
    "section",
    { class: "level-card" },
    h("div", { class: "level-emblem", "aria-hidden": "true" }, "L" + level),
    h(
      "div",
      { class: "level-info" },
      h("p", { class: "eyebrow" }, "ACADEMIC RECORD · XP RANK"),
      h("h1", {}, `${academicRank} · Level ${level}`),
      h("p", {}, `${xp} XP earned · ${250 - levelXp} XP to level ${level + 1}`),
      h("progress", {
        class: "xp-progress",
        max: 250,
        value: levelXp,
        "aria-label": `${levelXp} of 250 XP toward level ${level + 1}`,
      }),
      h("small", {}, `${levelXp} / 250 XP`),
    ),
    h(
      "div",
      { class: "curriculum-tracks", "aria-label": "Course completion" },
      ...courseStats.map(({ course, exercises, solved: count }) => {
        const label = courseLabel(course),
          total = exercises.length,
          completed = Math.min(count, total),
          percentage = total ? Math.round((completed / total) * 100) : 0;
        return h(
          "div",
          { class: "curriculum-track" },
          h(
            "div",
            {},
            h("strong", {}, label),
            h("small", {}, `${completed} / ${total} mastered · ${percentage}%`),
          ),
          h("progress", {
            max: Math.max(1, total),
            value: completed,
            "aria-label": `${label}: ${completed} of ${total} exercises mastered`,
          }),
        );
      }),
    ),
  );
  const filters = h("div", {
    class: "progress-filters",
    role: "group",
    "aria-label": "Filter progress by course",
  });
  const panel = h("div"),
    achievementPreview = h("div", {
      class: "achievement-grid achievement-preview",
    }),
    achievementOverflow = h("details", {
      class: "achievement-group achievement-more",
    }),
    completedAchievements = h("details", {
      class: "achievement-group achievement-completed",
    }),
    recent = h("div");
  let course = "";
  const draw = () => {
    const filtered = ex.filter((e) => !course || e.course === course);
    const results = filtered
      .map((e) => ({ ex: e, attempt: attempts.get(keyOf(e)) }))
      .filter((x) => x.attempt);
    const mastered = filtered.filter((e) => unlocked.has(keyOf(e))).length;
    const latestCorrect = results.filter((x) => x.attempt.correct).length;
    const accuracy = results.length
      ? Math.round((latestCorrect * 100) / results.length)
      : 0;
    const stat = (icon, label, value, note) =>
      h(
        "article",
        { class: "progress-stat" },
        h("span", { class: "stat-icon", "aria-hidden": "true" }, icon),
        h("small", {}, label),
        h("strong", {}, value),
        h("span", {}, note),
      );
    panel.replaceChildren(
      h(
        "div",
        { class: "progress-stats" },
        stat(
          "🏆",
          "Solved",
          `${mastered} / ${filtered.length}`,
          "unique exercises cleared",
        ),
        stat(
          "🎯",
          "Attempted",
          `${results.length} / ${filtered.length}`,
          "latest result saved per exercise",
        ),
        stat(
          "📈",
          "Latest accuracy",
          `${accuracy}%`,
          results.length
            ? `${latestCorrect} latest results correct`
            : "submit an answer to start",
        ),
        stat(
          "⚡",
          "XP in this view",
          `${filtered.reduce((sum, e) => sum + (S.xpRewards[keyOf(e)]?.xp || 0), 0)}`,
          "earned once per exercise",
        ),
      ),
    );
    const earnedAchievements = achievements.filter((a) => a.count >= a.target);
    const lockedAchievements = achievements.filter((a) => a.count < a.target);
    const nextAchievement = lockedAchievements.find((a) => !a.secret);
    const achievementCard = (a, earned) => {
      const hidden = a.secret && !earned,
        title = hidden ? "Secret achievement" : a.title,
        detail = hidden ? "Keep exploring to find this one." : a.detail,
        value = hidden ? 0 : Math.min(a.count, a.target);
      return h(
        "article",
        {
          class: "achievement" + (earned ? " earned" : ""),
          title: earned && a.flavor ? a.flavor : null,
        },
        h(
          "span",
          { class: "achievement-mark", "aria-hidden": "true" },
          earned ? a.icon || "★" : hidden ? "?" : "◇",
        ),
        h("div", {}, h("strong", {}, title), h("small", {}, detail)),
        h(
          "span",
          { class: "achievement-progress" },
          earned ? "Unlocked" : hidden ? "???" : `${value} / ${a.target}`,
        ),
        h("progress", {
          class: "achievement-meter",
          max: a.target,
          value,
          "aria-label": `${title}: ${value} of ${a.target}`,
        }),
      );
    };
    achievementPreview.replaceChildren(
      ...lockedAchievements.slice(0, 6).map((a) => achievementCard(a, false)),
    );
    achievementOverflow.hidden = lockedAchievements.length <= 6;
    achievementOverflow.replaceChildren(
      h(
        "summary",
        {},
        `Show ${lockedAchievements.length - 6} more achievements`,
      ),
      h(
        "div",
        { class: "achievement-grid achievement-locked-list" },
        lockedAchievements.slice(6).map((a) => achievementCard(a, false)),
      ),
    );
    completedAchievements.hidden = earnedAchievements.length === 0;
    completedAchievements.replaceChildren(
      h("summary", {}, `Completed achievements (${earnedAchievements.length})`),
      h(
        "div",
        { class: "achievement-grid achievement-earned-list" },
        earnedAchievements.map((a) => achievementCard(a, true)),
      ),
    );
    recent.replaceChildren(
      h("h2", {}, "Recent submissions"),
      results.length
        ? h(
            "div",
            { class: "recent-quests" },
            results
              .sort((a, b) => b.attempt.t - a.attempt.t)
              .slice(0, 6)
              .map(({ ex: exercise, attempt }) =>
                h(
                  "article",
                  { class: "quest-row" },
                  h(
                    "span",
                    {
                      class: "quest-result " + (attempt.correct ? "ok" : "bad"),
                      "aria-label": attempt.correct ? "Correct" : "Incorrect",
                    },
                    attempt.correct ? "✓" : "×",
                  ),
                  h(
                    "div",
                    {},
                    h("strong", {}, exercise.title),
                    h(
                      "small",
                      {},
                      `${courseLabel(exercise.course)} · ${exercise.difficulty} · ${new Date(attempt.t).toLocaleDateString()}`,
                    ),
                  ),
                  h(
                    "span",
                    { class: "quest-xp" },
                    S.xpRewards[keyOf(exercise)]
                      ? `+${S.xpRewards[keyOf(exercise)].xp} XP`
                      : "—",
                  ),
                ),
              ),
          )
        : h(
            "div",
            { class: "empty" },
            course
              ? `No ${courseLabel(course)} activity yet.`
              : "No activity yet. Pick an exercise and start earning XP.",
          ),
    );
    const milestone = nextAchievement
      ? `${nextAchievement.title}: ${nextAchievement.count} / ${nextAchievement.target}`
      : "All current achievements unlocked!";
    panel.setAttribute("aria-live", "polite");
    root.querySelector(".next-milestone").textContent = milestone;
  };
  for (const [value, label] of [
    ["", "All courses"],
    ...uniq(ex, (exercise) => exercise.course).map((course) => [
      course,
      courseLabel(course),
    ]),
  ]) {
    let filterButton;
    filterButton = h(
      "button",
      {
        class: "progress-filter" + (value === course ? " active" : ""),
        type: "button",
        "aria-pressed": value === course,
        onclick: () => {
          course = value;
          filters.querySelectorAll("button").forEach((button) => {
            const active = button === filterButton;
            button.classList.toggle("active", active);
            button.setAttribute("aria-pressed", String(active));
          });
          draw();
        },
      },
      label,
    );
    filters.append(filterButton);
  }
  root.append(
    hero,
    h(
      "section",
      { class: "progress-section" },
      h(
        "div",
        { class: "progress-section-heading" },
        h("h2", {}, "Course dashboard"),
        h("span", { class: "next-milestone" }, ""),
      ),
      filters,
      panel,
    ),
    h(
      "section",
      { class: "progress-section" },
      h(
        "div",
        { class: "progress-section-heading" },
        h("h2", {}, "Academic achievements"),
        h("span", {}, `${achievements.length} milestones`),
      ),
      achievementPreview,
      achievementOverflow,
      completedAchievements,
    ),
    h("section", { class: "progress-section" }, recent),
    reset,
  );
  draw();
}
function resetLocalDataControl(root) {
  const status = h("p", { role: "status" });
  const button = h(
    "button",
    {
      class: "danger",
      onclick: async () => {
        if (
          !(await confirmInApp({
            title: "Reset saved data?",
            message:
              "This removes imported packages, exercise drafts and results, XP, achievements, saved exams, and exam history from this device. This cannot be undone.",
            confirmLabel: "Reset all data",
            danger: true,
          }))
        )
          return;
        button.disabled = true;
        status.textContent = "Clearing saved app data…";
        try {
          achFrozen = true; // stop saving stats while everything is wiped
          await kv.clear();
          localStorage.removeItem(ACTIVE_EXAM_CHECKPOINT);
          location.reload();
        } catch (e) {
          achFrozen = false;
          button.disabled = false;
          status.textContent = "Could not reset saved data: " + e.message;
        }
      },
    },
    "Reset all local data",
  );
  return h(
    "section",
    { class: "card danger-zone" },
    h("h3", {}, "Reset saved data"),
    h(
      "p",
      {},
      "Remove all data this app saved on this device, including imported packages, exercise drafts and results, XP, achievements, saved exams, and exam history. Bundled site content will remain available.",
    ),
    button,
    status,
  );
}

const pages = {
  reader: pageReader,
  canvas: pageCanvas,
  practice: pagePractice,
  exam: pageExam,
  progress: pageProgress,
};
// Add the Canvas link to the nav if index.html doesn't have it yet.
(() => {
  const navEl = $("#nav");
  if (!navEl || navEl.querySelector('a[href="#/canvas"]')) return;
  const link = h("a", { href: "#/canvas" }, "Canvas");
  const readerLink = navEl.querySelector('a[href="#/reader"]');
  if (readerLink) readerLink.after(link);
  else navEl.append(link);
})();
const periodicToast = $("#periodic-toast");
const terminalArtifact = $("#terminal-artifact");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const themeToggle = $("#theme-toggle");
const systemPrefersDark = matchMedia("(prefers-color-scheme: dark)");
function currentTheme() {
  return (
    document.documentElement.dataset.theme ||
    (systemPrefersDark.matches ? "dark" : "light")
  );
}
function updateThemeToggle() {
  document.documentElement.dataset.theme = currentTheme();
  const dark = currentTheme() === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  themeToggle.setAttribute("aria-label", label);
  themeToggle.title = label;
  themeToggle.firstElementChild.textContent = dark ? "☀" : "☾";
  updatePlantUmlImageTheme();
}
themeToggle?.addEventListener("click", () => {
  achTrack((s) => void s.themeToggles++, { full: false });
  const nextTheme = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  updateThemeToggle();
  try {
    localStorage.setItem("acs-practice-theme", nextTheme);
  } catch (error) {}
});
systemPrefersDark.addEventListener("change", () => {
  if (!document.documentElement.dataset.theme) updateThemeToggle();
});
updateThemeToggle();
const backToTop = $("#back-to-top");
const updateBackToTop = () => {
  if (backToTop)
    backToTop.hidden =
      !matchMedia("(max-width: 760px)").matches || window.scrollY < 320;
};
backToTop?.addEventListener("click", () =>
  window.scrollTo({
    top: 0,
    behavior: reducedMotion.matches ? "auto" : "smooth",
  }),
);
addEventListener("scroll", updateBackToTop, { passive: true });
addEventListener("resize", updateBackToTop);
updateBackToTop();
if (terminalArtifact && !reducedMotion.matches) {
  const alphabet = "0123456789ABCDEF<>[]{}|_-=+/*;:.";
  const logs = [
    "[SYS] integrity check ........ OK",
    "[NET] monitoring local session",
    "AUTH:: user_verified = true",
    "TRACE // signal synchronized",
    "0xAC5F 0x7E21 0x09BD 0xFF10",
    "SELECT * FROM study_progress;",
    "ACCESS GRANTED // welcome back",
    "01001000 01000001 01000011 01001011",
    "kernel: all systems nominal",
    "ssh://localhost/session [ACTIVE]",
    "decrypting... checksum matched",
    "ping 127.0.0.1  time<1ms",
  ];
  terminalArtifact.hidden = true;
  for (let column = 0; column < 24; column++) {
    const stream = Array.from({ length: 28 }, () =>
      Math.random() < 0.18
        ? logs[Math.floor(Math.random() * logs.length)]
        : Array.from(
            { length: 8 },
            () => alphabet[Math.floor(Math.random() * alphabet.length)],
          ).join(""),
    ).join("\n");
    terminalArtifact.append(
      h(
        "span",
        {
          style: `left:${(column / 24) * 100}%;animation-delay:${(Math.random() * 1.8).toFixed(2)}s`,
        },
        stream,
      ),
    );
  }
}
function triggerWassimSignal() {
  if (document.hidden) return;

  if (terminalArtifact && !reducedMotion.matches) {
    terminalArtifact.hidden = false;
    terminalArtifact.classList.add("active");
    document.documentElement.classList.add("hacking-mode");

    setTimeout(() => {
      terminalArtifact.classList.remove("active");
      document.documentElement.classList.remove("hacking-mode");
      setTimeout(() => {
        terminalArtifact.hidden = true;
      }, 1850);
    }, 8500);
  }

  if (!periodicToast) return;

  setTimeout(() => {
    achTrack((s) => void s.watches++, { full: false });
    periodicToast.replaceChildren(
      h("span", { class: "periodic-toast-prefix" }, "[ SYS//MONITOR ]"),
      h(
        "strong",
        { class: "periodic-toast-message" },
        "> WASSIMGPT IS WATCHING YOU",
      ),
      h("span", { class: "periodic-toast-footer" }, "[ SESSION WATCHED ]"),
    );

    periodicToast.hidden = false;
    periodicToast.classList.remove("show");
    requestAnimationFrame(() => periodicToast.classList.add("show"));

    setTimeout(() => {
      periodicToast.classList.remove("show");
      setTimeout(() => {
        periodicToast.hidden = true;
      }, 220);
    }, 4200);
  }, 5000);
}
setTimeout(function loop() {
  triggerWassimSignal();
  setTimeout(loop, (Math.floor(Math.random() * 13) + 3) * 60_000);
}, 60000);
const clickme = document.getElementById("clickme");
function hideClickme() {
  if (!clickme.classList.contains("is-visible")) return;
  clickme.classList.remove("is-visible");
  clickme.classList.add("is-hiding");

  clickme.addEventListener(
    "animationend",
    (event) => {
      if (event.animationName === "hack-exit") {
        clickme.classList.remove("is-hiding");
      }
    },
    { once: true },
  );
}
setTimeout(() => {
  if (focusButton.getAttribute("aria-pressed") === "true") return;
  clickme.classList.remove("is-hiding");
  clickme.classList.add("is-visible");
  setTimeout(hideClickme, 10000);
}, 15000);
setInterval(() => {
  if (focusButton.getAttribute("aria-pressed") === "true") return;
  clickme.classList.remove("is-hiding");
  clickme.classList.add("is-visible");
  setTimeout(hideClickme, 10000);
}, 61000);
let routeTok = 0;
let lastRouteHash = null;
let routePending = false;
const decodeRouteSegment = (segment) => {
  try {
    return decodeURIComponent(segment || "");
  } catch {
    return "";
  }
};
// ---------- page transitions ----------
// Moving between sections slides the old page out and the new one in from the
// side the new section sits on (nav order: a later link arrives from the
// right, an earlier one from the left). Switching subject inside Reference or
// Canvas keeps the heading and tabs still and slides only the content below
// them. Nothing animates for reduced-motion users, or when the address changes
// without changing what is on screen.
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
  main.replaceChildren();
  const view = h("div");
  main.append(view);
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
    h("span", { "aria-hidden": "true" }, " ESC ↗"),
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

        h("span", {}, "wassim // system architect // level ∞"),

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

focusButton.addEventListener("click", () => {
  const isPressed = focusButton.getAttribute("aria-pressed") === "true";
  if (!isPressed) {
    hideClickme();
    achTrack((s) => void s.zenOn++, { full: false });
  }
  focusButton.title = focusButton.querySelector(".focus-label").textContent =
    isPressed ? "Hide distractions" : "Enable distractions";
  focusButton.setAttribute("aria-pressed", String(!isPressed));
});

let clickCount = 0;
let clickTimer;

const wassimSign = document.getElementById("wassim-sign");

wassimSign.addEventListener("click", () => {
  clickCount++;

  clearTimeout(clickTimer);

  if (clickCount >= 5) {
    achTrack((s) => void s.signToggles++, { full: false });
    if (!focusButton.hidden) {
      focusButton.hidden = true;
      focusButton.setAttribute("aria-pressed", "false");
    } else {
      focusButton.hidden = false;
    }

    clickCount = 0;
    return;
  }

  clickTimer = setTimeout(() => {
    clickCount = 0;
  }, 3000);
});
