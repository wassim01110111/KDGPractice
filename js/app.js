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
async function rec(ex, correct, mode, onRecorded = () => {}) {
  const key = keyOf(ex),
    attempt = {
      key,
      packageId: ex.packageId,
      id: ex.id,
      t: Date.now(),
      correct,
      mode,
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

// ---------- content loading ----------
const compatibleManifest = (m) =>
  Boolean(m) &&
  typeof m === "object" &&
  Core.compatibleSchemaVersion(m.schemaVersion, 1);
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

    // packages and referenceFiles are objects keyed by ID.
    S.manifest = {
      ...manifest,
      referenceFiles: Object.entries(manifest.referenceFiles || {}).map(
        ([id, ref]) => ({ ...ref, id }),
      ),
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
const snaps = {};
const snapshotLoads = {};
async function engine() {
  await (window.pgliteReady ||
    Promise.reject(new Error("PGlite loader missing")));
  return window.PGlite;
}
async function freshDb(ds) {
  const P = await engine(),
    k = ds.id + "@" + ds.version;
  let s = snaps[k];
  if (s && s !== "exec") return new P({ loadDataDir: s });
  if (!s) {
    snapshotLoads[k] ??= (async () => {
      const db = new P();
      try {
        await db.exec(ds.sql);
        try {
          snaps[k] = await db.dumpDataDir();
        } catch {
          snaps[k] = "exec";
        }
      } finally {
        db.close();
      }
    })().finally(() => {
      delete snapshotLoads[k];
    });
    await snapshotLoads[k];
    s = snaps[k];
    if (s && s !== "exec") return new P({ loadDataDir: s });
  }
  const db = new P();
  await db.exec(ds.sql);
  return db;
}
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
  const t0 = performance.now(),
    db = await freshDb(S.datasets[ex.datasetId]);
  try {
    const res = await runSql(db, sql);
    return { res, ms: Math.round(performance.now() - t0) };
  } finally {
    db.close();
  }
}
async function gradeSql(ex, sql) {
  const ds = S.datasets[ex.datasetId],
    t0 = performance.now();
  try {
    checkKind(ex, sql);
  } catch (e) {
    return { correct: false, error: e.message };
  }
  const [a, b] = await Promise.all([freshDb(ds), freshDb(ds)]),
    t1 = performance.now();
  try {
    const [s, r] = await Promise.allSettled([
      runSql(a, sql),
      runSql(b, ex.referenceSolution),
    ]);
    if (r.status === "rejected")
      return { correct: false, error: describeSqlError(s.reason, sql) };
    if (s.status === "rejected")
      return { correct: false, error: s.reason.message };
    const cmp = compare(s.value, r.value, ex);
    return {
      correct: cmp.ok,
      cmp,
      res: s.value, // the student's own result set, so callers can show it
      setupMs: Math.round(t1 - t0),
      totalMs: Math.round(performance.now() - t0),
    };
  } finally {
    a.close();
    b.close();
  }
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
    h("small", {}, "Loading the PlantUML-rendered relationship diagram…"),
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
    content.replaceChildren(h("small", {}, "Loading dataset diagram…"));
    let columns, keys;
    try {
      const db = await freshDb(S.datasets[ex.datasetId]);
      try {
        [columns, keys] = await Promise.all([
          db.query(
            "select table_name, column_name, data_type, is_nullable from information_schema.columns where table_schema='public' order by table_name, ordinal_position",
          ),
          db.query(
            "select tc.table_name, kcu.column_name, tc.constraint_type, ccu.table_name as referenced_table, ccu.column_name as referenced_column from information_schema.table_constraints tc join information_schema.key_column_usage kcu on tc.constraint_name=kcu.constraint_name and tc.table_schema=kcu.table_schema join information_schema.constraint_column_usage ccu on ccu.constraint_name=tc.constraint_name and ccu.table_schema=tc.table_schema where tc.table_schema='public' and tc.constraint_type in ('PRIMARY KEY','FOREIGN KEY') order by tc.table_name, kcu.ordinal_position",
          ),
        ]);
      } finally {
        db.close();
      }
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
      loading: "lazy",
      draggable: "false",
    });
    diagramImage.addEventListener("error", () => {
      diagramViewer.replaceChildren(
        h(
          "span",
          { class: "err" },
          "The PlantUML diagram could not be loaded.",
        ),
      );
    });
    diagramViewer.append(diagramImage);
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
    h("div", { class: "stmt" }, ex.instructions),
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
          fb.replaceChildren();
          out.replaceChildren(h("small", {}, "Running…"));
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
            fb.replaceChildren(h("small", {}, "Grading…"));
            const g = await gradeSql(ex, ta.value);
            if (currentGrading !== gradingId || !q.isConnected) return;
            // Show the result table of the submitted query, like Run does.
            out.replaceChildren(g.res ? table(g.res) : "");
            if (g.correct !== null)
              await rec(ex, g.correct, "practice", onAttempt);
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
        optionOrder.map((i) =>
          h(
            "label",
            {},
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
            " " + ex.options[i],
          ),
        ),
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
          "Graded by text matching against accepted answers — the command is not executed.",
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
      const loadResultSnippet = async () => {
        if (snippet.dataset.loaded || loadingSnippet) return;
        loadingSnippet = true;
        toggle.disabled = true;
        snippet.replaceChildren(
          h("strong", {}, "Expected result preview"),
          h("small", {}, "Loading the first five result rows…"),
        );
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
          snippet.replaceChildren(
            h("strong", {}, "Could not load result preview"),
            h("pre", { class: "err" }, e.message),
          );
        } finally {
          loadingSnippet = false;
          toggle.disabled = false;
        }
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
      loadResultSnippet();
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
      "a b blockquote br code div em h1 h2 h3 h4 h5 h6 hr i li ol p pre section span strong style table tbody td th thead tr ul".split(
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
    if (/^```/.test(l)) {
      fl();
      const language = l.match(/^```\s*([^\s`]*)/)?.[1]?.toLowerCase() || "";
      const b = [];
      for (i++; i < L.length && !/^```/.test(L[i]); i++) b.push(L[i]);
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
      const n = hm[1].length,
        id = slug(hm[2]);
      if (n >= 2 && n <= 3) toc.push({ n, id, t: hm[2].replace(/[`*]/g, "") });
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
async function pageReader(root, arg) {
  const refs = (S.manifest && S.manifest.referenceFiles) || [];
  if (!refs.length) return root.append(empty("No reference files configured."));
  const cur = refs.find((r) => r.id === arg) || refs[0],
    body = h("article", { class: "md" }, "Loading…");
  const searchInput = h("input", {
      type: "search",
      class: "reference-search-input",
      placeholder: "Find in this reference",
      "aria-label": "Find in this reference",
      autocomplete: "off",
      spellcheck: false,
    }),
    searchCount = h("span", {
      class: "reference-search-count",
      role: "status",
      "aria-live": "polite",
    }),
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
            "aria-label": "Close reference search",
            title: "Close search",
          },
          "×",
        ),
      ),
      h(
        "div",
        { class: "reference-search-controls" },
        searchCount,
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
        "aria-label": "Search this reference",
        "aria-expanded": "false",
      },
      h("span", { "aria-hidden": "true" }, "⌕"),
      " Find",
    );
  const tabs = h(
    "nav",
    { class: "reference-tabs", "aria-label": "Choose a reference" },
    refs.map((r) =>
      h(
        "a",
        {
          href: "#/reader/" + encodeURIComponent(r.id),
          class: "reference-tab" + (r === cur ? " on" : ""),
          "aria-current": r === cur ? "page" : false,
        },
        h("span", { class: "reference-tab-label" }, r.id.toUpperCase()),
        h("strong", {}, r.title),
      ),
    ),
  );
  const header = h(
    "section",
    { class: "reference-heading" },
    h(
      "div",
      {},
      h("p", { class: "eyebrow" }, "STUDY LIBRARY"),
      h("h1", {}, "Quick references"),
      h(
        "p",
        { class: "reference-intro" },
        "Choose a subject to browse its guide.",
      ),
    ),
    tabs,
  );
  const tocDetails = h("details", { class: "reference-toc" });
  const sidebar = h(
    "aside",
    { class: "reference-sidebar", "aria-label": "Reference navigation" },
    searchPanel,
    tocDetails,
  );
  root.append(
    header,
    searchToggle,
    h("div", { class: "reference-layout" }, sidebar, body),
  );
  let matches = [],
    currentMatch = -1;
  const clearHighlights = () => {
    body.querySelectorAll("mark.reference-search-match").forEach((mark) => {
      mark.replaceWith(document.createTextNode(mark.textContent));
    });
    body.normalize();
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
    match.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  const updateSearch = () => {
    clearHighlights();
    const query = searchInput.value.trim();
    if (!query) {
      searchCount.textContent = "";
      searchPanel.classList.remove("has-matches");
      searchPanel.querySelector(".reference-search-prev").disabled = true;
      searchPanel.querySelector(".reference-search-next").disabled = true;
      return;
    }
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      expression = new RegExp(escapedQuery, "gi"),
      walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT),
      nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest("script, style, mark")) nodes.push(node);
    }
    for (const node of nodes) {
      const text = node.nodeValue,
        ranges = [];
      expression.lastIndex = 0;
      let found;
      while ((found = expression.exec(text)))
        ranges.push([found.index, found.index + found[0].length]);
      for (let i = ranges.length - 1; i >= 0; i--) {
        const [start, end] = ranges[i],
          range = document.createRange();
        range.setStart(node, start);
        range.setEnd(node, end);
        const mark = document.createElement("mark");
        mark.className = "reference-search-match";
        range.surroundContents(mark);
      }
    }
    matches = [...body.querySelectorAll("mark.reference-search-match")];
    const hasMatches = matches.length > 0;
    searchPanel.classList.toggle("has-matches", hasMatches);
    searchPanel.querySelector(".reference-search-prev").disabled = !hasMatches;
    searchPanel.querySelector(".reference-search-next").disabled = !hasMatches;
    if (hasMatches) showMatch(0);
    else searchCount.textContent = "No matches";
  };
  const closeMobileSearch = () => {
    searchPanel.classList.remove("mobile-open");
    searchToggle.setAttribute("aria-expanded", "false");
    if (searchPanel.parentElement === document.body)
      sidebar.insertBefore(searchPanel, tocDetails);
    searchToggle.focus();
    searchInput.value = "";
    updateSearch();
  };
  searchInput.addEventListener("input", updateSearch);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
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
    searchToggle.setAttribute("aria-expanded", "true");
    searchInput.focus();
  });
  try {
    const r = await fetch("content/" + cur.file);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const { html, toc } = md(withoutContentsSection(await r.text()));
    appendSanitizedReferenceHtml(body, html);
    body.querySelectorAll("pre code.language-java").forEach((code) => {
      code.innerHTML = Core.highlightJava(code.textContent);
    });
    body.querySelectorAll(".mermaid-source").forEach((source) => {
      const diagram = renderMermaidFlowchart(source.textContent);
      if (diagram) source.replaceWith(diagram);
      else source.classList.add("reference-code-fallback");
    });
    const tocNav = h(
      "nav",
      { class: "reference-toc-links", "aria-label": "Reference sections" },
      toc.map((t) =>
        h(
          "a",
          {
            href: "#",
            class: "reference-toc-link",
            "data-a": t.id,
            style: `padding-left:${(t.n - 2) * 0.75 + 0.5}rem`,
          },
          t.t,
        ),
      ),
    );
    tocDetails.replaceChildren(
      h(
        "summary",
        {},
        h("strong", {}, "On this page"),
        h("span", {}, `${toc.length} sections`),
      ),
      tocNav,
    );
    if (searchInput.value) updateSearch();
    root.onclick = (e) => {
      const a = e.target.closest("[data-a]");
      if (a) {
        e.preventDefault();
        const el = document.getElementById(a.dataset.a);
        if (el) el.scrollIntoView();
      }
    };
  } catch (e) {
    body.replaceChildren(
      h("p", { class: "err" }, "Could not load " + cur.file + ": " + e.message),
    );
  }
}

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
      placeholder: "Search titles, instructions, or IDs",
      "aria-label": "Search questions",
      oninput: () => draw(),
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
          draw();
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
          draw();
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
        draw();
      },
    }),
    difficultySelect = h(
      "select",
      {
        onchange: (e) => {
          f.difficulty = e.target.value;
          draw();
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
          : "Show all exercises";
        completedToggle.setAttribute("aria-pressed", String(showCompleted));
        draw();
      },
    },
    "Show all exercises",
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
  const draw = () => {
    const query = search.value.trim().toLocaleLowerCase();
    const filtered = S.exercises.filter(
      (e) =>
        Object.entries(f).every(([k, v]) => !v || String(e[k]) === v) &&
        (!query ||
          [e.title, e.instructions, e.id].some((value) =>
            String(value || "")
              .toLocaleLowerCase()
              .includes(query),
          )),
    );
    // A selected exercise must not leak back into the list after a filter
    // (especially Term) excludes it. Keep completed selections visible only
    // while they still satisfy the active filters.
    if (selectedKey && !filtered.some((e) => keyOf(e) === selectedKey)) {
      selectedKey = "";
      pane.replaceChildren();
    }
    items = filtered.filter(
      (e) =>
        showCompleted || keyOf(e) === selectedKey || !S.xpRewards[keyOf(e)],
    );
    const la = {};
    S.attempts.forEach((a) => {
      la[a.key] = a.correct;
    });
    if (selectedKey && !items.some((e) => keyOf(e) === selectedKey)) {
      const currentExercise = filtered.find((e) => keyOf(e) === selectedKey);
      if (currentExercise) items.unshift(currentExercise);
    }
    const buttons = items.map((e) =>
      h(
        "button",
        {
          class: "item" + (keyOf(e) === selectedKey ? " on" : ""),
          "aria-pressed": keyOf(e) === selectedKey,
          onclick: () => {
            selectExercise(e, true);
          },
        },
        `${la[keyOf(e)] === undefined ? "○" : la[keyOf(e)] ? "✔" : "✘"} ${e.title}`,
        h(
          "small",
          {},
          ` ${packageLabel(e.packageId)} · ${Number.isInteger(e.term) ? `Term ${e.term} · ` : ""}${e.difficulty}${e.examEligible ? "" : " · not on exam"}`,
        ),
      ),
    );
    if (!buttons.length)
      buttons.push(
        h(
          "small",
          {},
          filtered.length && !showCompleted
            ? "All matching exercises are completed."
            : "No exercises match these filters.",
        ),
      );
    list.replaceChildren(...buttons);
    pane.firstElementChild?.refreshNextExercise?.();
  };
  function selectExercise(exercise, addHistoryEntry) {
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
    requestAnimationFrame(() => view.focusInput?.());
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
  if (routeExercise) selectExercise(routeExercise, false);
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
                    "Not enough eligible exercises — nothing was substituted. " +
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
                    `Available in selected terms — Easy ${avail("Easy")}, Medium ${avail("Medium")}, Hard ${avail("Hard")}, Extreme ${avail("Extreme")}. Adjust the numbers above.`,
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
              `${new Date(x.date).toLocaleString()} — ${x.score}/${x.total} (${x.ids.length} questions, ${Math.round(x.cfg.mins)} min)`,
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

async function pageProgress(root) {
  const ex = S.exercises,
    reset = resetLocalDataControl(root);
  const savedExamHistory = await kv.get("examHistory", []);
  const examHistory = Array.isArray(savedExamHistory) ? savedExamHistory : [];
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
  const achievements = [
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
    const nextAchievement = lockedAchievements[0];
    const achievementCard = (a, earned) =>
      h(
        "article",
        { class: "achievement" + (earned ? " earned" : "") },
        h(
          "span",
          { class: "achievement-mark", "aria-hidden": "true" },
          earned ? "★" : "◇",
        ),
        h("div", {}, h("strong", {}, a.title), h("small", {}, a.detail)),
        h(
          "span",
          { class: "achievement-progress" },
          earned ? "Unlocked" : `${Math.min(a.count, a.target)} / ${a.target}`,
        ),
        h("progress", {
          class: "achievement-meter",
          max: a.target,
          value: Math.min(a.count, a.target),
          "aria-label": `${a.title}: ${Math.min(a.count, a.target)} of ${a.target}`,
        }),
      );
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
          await kv.clear();
          localStorage.removeItem(ACTIVE_EXAM_CHECKPOINT);
          location.reload();
        } catch (e) {
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
  practice: pagePractice,
  exam: pageExam,
  progress: pageProgress,
};
const periodicToast = $("#periodic-toast");
const terminalArtifact = $("#terminal-artifact");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const themeToggle = $("#theme-toggle");
const themeStatus = $("#theme-status");
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
  const nextTheme = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  updateThemeToggle();
  try {
    localStorage.setItem("acs-practice-theme", nextTheme);
    themeStatus.textContent = `${nextTheme === "dark" ? "Dark" : "Light"} mode enabled.`;
  } catch (error) {
    themeStatus.textContent =
      "Theme changed, but the preference could not be saved: " + error.message;
  }
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
    periodicToast.replaceChildren(
      h("span", { class: "periodic-toast-prefix" }, "[ SYS//MONITOR ]"),
      h(
        "strong",
        { class: "periodic-toast-message" },
        "> WASSIM IS WATCHING YOU",
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
async function route() {
  const routeHash = location.hash;
  if (routeHash === lastRouteHash && routePending) return;
  lastRouteHash = routeHash;
  if (activeConfirmDialog?.open) activeConfirmDialog.close("cancel");
  const tok = ++routeTok,
    [, p = "reader", arg, exerciseArg] = routeHash.split("/"),
    main = $("#main");
  routePending = true;
  main.replaceChildren();
  document
    .querySelectorAll("#nav a")
    .forEach((a) =>
      a.classList.toggle(
        "on",
        a.getAttribute("href") === "#/" + (pages[p] ? p : "reader"),
      ),
    );
  const view = h("div");
  main.append(view);
  if (p === "practice") {
    await pagePractice(
      view,
      decodeRouteSegment(arg),
      decodeRouteSegment(exerciseArg),
    );
  } else if (p === "exam") {
    await pageExam(view, () => tok === routeTok);
  } else {
    await (pages[p] || pageReader)(view, decodeRouteSegment(arg));
  }
  if (tok !== routeTok) view.remove();
  else routePending = false;
}
addEventListener("hashchange", route);
addEventListener("popstate", route);
loadContent()
  .then(route)
  .catch((e) => {
    $("#main").textContent = "Startup error: " + e.message;
  });

// ---------- Wassim's 2.6s brand easter egg ----------
// Delegated click handling means this works even if #brand is rendered later.
// A single active instance + a short cooldown makes rapid/repeated clicks safe.
let wassimEggActive = false;
let wassimEggLastStart = -Infinity;
let rainColumnIndex = 0;
let wassimUsedMemes = new Set();
let wassimEggState = "closed";

function launchWassimEasterEgg() {
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
  closeTimer = window.setTimeout(finishEasterEgg, closeDuration);
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
