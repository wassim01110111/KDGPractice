"use strict";
const { compare, generateExam, validatePackage, gradeOS, exerciseKey, DIFF } =
  Core;
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
const empty = (a, b) =>
  h("div", { class: "empty" }, h("strong", {}, a), h("div", {}, b || ""));
const uniq = (arr, f) =>
  [...new Set(arr.map(f).filter((x) => x !== undefined && x !== ""))].sort();

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
async function loadContent() {
  S.exercises = [];
  S.datasets = {};
  S.errors = [];
  S.packages = [];
  const ctx = { seenIds: new Set(), datasetIds: new Set(), schemaVersion: 1 },
    files = [];
  try {
    S.manifest = await (await fetch("content/manifest.json")).json();
    for (const p of S.manifest.packages)
      for (const f of p.files) {
        try {
          const r = await fetch("content/" + f);
          if (!r.ok) throw new Error("HTTP " + r.status);
          files.push({
            name: "content/" + f,
            src: "bundled",
            pkg: await r.json(),
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
  } catch (e) {
    S.errors.push({
      file: "content/manifest.json",
      id: "(manifest)",
      field: "$",
      msg: e.message,
    });
    S.manifest = { packages: [], referenceFiles: [] };
  }
  for (const p of await kv.get("imported", []))
    files.push({ name: p.name, src: "imported", pkg: p.pkg });
  for (const f of files) addPackage(f, ctx);
  const storedAttempts = await kv.get("attempts", []);
  const exercisesById = new Map();
  for (const ex of S.exercises) {
    if (!exercisesById.has(ex.id)) exercisesById.set(ex.id, []);
    exercisesById.get(ex.id).push(ex);
  }
  const exercisesByKey = new Map(S.exercises.map((ex) => [keyOf(ex), ex]));
  const latest = new Map();
  for (const a of storedAttempts)
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
  if (migratedRewards) await kv.set("xpRewards", S.xpRewards);
  if (S.attempts.length) await kv.set("attempts", S.attempts);
  else if (storedAttempts.length) await kv.del("attempts");
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
      if (answer !== undefined) S.drafts[key] = answer;
    }),
  );
}
function addPackage(f, ctx) {
  const c = {
    ...ctx,
    seenIds: new Set(ctx.seenIds),
    datasetIds: new Set(ctx.datasetIds),
  };
  const errs = validatePackage(f.pkg, f.name, c);
  if (errs.length) {
    S.errors.push(...errs);
    return errs;
  }
  ctx.seenIds = c.seenIds;
  (f.pkg.datasets || []).forEach((d) => {
    S.datasets[d.id] = d;
    ctx.datasetIds.add(d.id);
  });
  S.exercises.push(
    ...(f.pkg.exercises || []).map((ex) => ({
      ...ex,
      packageId: f.pkg.packageId,
      key: exerciseKey(ex, f.pkg.packageId),
    })),
  );
  S.packages.push({
    name: f.name,
    src: f.src,
    id: f.pkg.packageId,
    version: f.pkg.version,
    n: (f.pkg.exercises || []).length,
  });
  Object.assign(ctx, { seenIds: c.seenIds, datasetIds: c.datasetIds });
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
      return {
        correct: null,
        error: "Reference solution failed (content error): " + r.reason.message,
      };
    if (s.status === "rejected")
      return { correct: false, error: s.reason.message };
    const cmp = compare(s.value, r.value, ex);
    return {
      correct: cmp.ok,
      cmp,
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
const expectedText = (ex) =>
  ex.type === "sql-query"
    ? ex.referenceSolution
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
      "skinparam nodesep 90",
      "skinparam ranksep 110",
      "skinparam padding 16",
      "skinparam defaultFontSize 18",
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
        `${aliases.get(rel.from)} }o--|| ${aliases.get(rel.to)} : ${umlText(rel.column)} -> ${umlText(rel.targetColumn)}`,
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
        zoom = Math.min(
          4,
          Math.max(0.5, zoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15)),
        );
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
      const imageUrl = `https://www.plantuml.com/plantuml/dsvg/${encoded}`;
      diagramImage.src = imageUrl;
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
function qView(ex, mode, get, set, onAttempt = () => {}) {
  const q = h("div", { class: "q" }),
    out = h("div"),
    fb = h("div");
  const scrollToFeedback = () =>
    fb.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
  let schemaPanel;
  const draftStatus = h(
    "small",
    { class: "draft-status", role: "status" },
    "Draft saves automatically as you type.",
  );
  const updateAnswer = (value) => {
    const saved = set(value);
    if (mode !== "practice") return;
    draftStatus.textContent = "Saving draft…";
    Promise.resolve(saved)
      .then(() => {
        draftStatus.textContent = "Draft saved.";
        draftStatus.className = "draft-status";
      })
      .catch((e) => {
        draftStatus.textContent = "Could not save draft: " + e.message;
        draftStatus.className = "draft-status err";
      });
  };
  q.append(
    h("h3", {}, ex.title),
    h(
      "div",
      { class: "meta" },
      [
        ex.course.toUpperCase(),
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
  let readAns, resetFn, submitButton;
  if (ex.type === "sql-query") {
    const ta = h("textarea", {
      class: "editor",
      rows: 8,
      spellcheck: "false",
      "aria-label": "SQL editor",
      placeholder: "Write one SQL statement",
    });
    ta.value = get() || "";
    ta.oninput = () => updateAnswer(ta.value);
    const run = h(
      "button",
      {
        onclick: async () => {
          out.replaceChildren(h("small", {}, "Running…"));
          try {
            const r = await runStudent(ex, ta.value);
            out.replaceChildren(
              table(r.res),
              h("small", {}, `${r.ms} ms (fresh database)`),
            );
          } catch (e) {
            out.replaceChildren(h("pre", { class: "err" }, e.message));
          }
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
            fb.replaceChildren(h("small", {}, "Grading…"));
            const g = await gradeSql(ex, ta.value);
            if (g.correct !== null)
              await rec(ex, g.correct, "practice", onAttempt);
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
      const multi = ex.type === "mcq-multi";
      inp = h(
        "div",
        { class: "answer-options" },
        ex.options.map((o, i) =>
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
            " " + o,
          ),
        ),
      );
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
      });
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
                        fb.append(h("p", { class: "ok" }, "Saved as correct"));
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
            fb.replaceChildren(
              h(
                "p",
                { class: g ? "ok" : "bad" },
                g ? "✔ Correct" : "✘ Incorrect",
              ),
              ex.explanation
                ? h("p", {}, h("b", {}, "Explanation: "), ex.explanation)
                : "",
            );
            scrollToFeedback();
          },
        },
        "Submit (Ctrl + Shift + Enter)",
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
    btns.append(
      h(
        "button",
        {
          class: "sec",
          onclick: () => {
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
  if (mode === "practice") q.append(draftStatus);
  return schemaPanel
    ? h("div", { class: "sql-exercise-layout" }, schemaPanel, q)
    : q;
}

// ---------- markdown (small, for the supplied reference files) ----------
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
      const b = [];
      for (i++; i < L.length && !/^```/.test(L[i]); i++) b.push(L[i]);
      o.push("<pre><code>" + esc(b.join("\n")) + "</code></pre>");
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
  const tabs = h(
    "nav",
    { class: "reference-tabs", "aria-label": "Choose a reference" },
    refs.map((r) =>
      h(
        "a",
        {
          href: "#/reader/" + r.id,
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
  root.append(
    header,
    h("div", { class: "reference-layout" }, tocDetails, body),
  );
  try {
    const r = await fetch("content/" + cur.file);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const { html, toc } = md(withoutContentsSection(await r.text()));
    body.innerHTML = html;
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
  const f = { course: "", category: "", difficulty: "" },
    list = h("div", { class: "side" }),
    pane = h("div"),
    flt = h("div", {
      class: "practice-filters",
      "aria-label": "Filter exercises",
    });
  const answers = S.drafts;
  let showCompleted = false;
  let selectedKey = "";
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
        h("option", { value: v }, v.toUpperCase()),
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
          .filter((e) => !f.course || e.course === f.course)
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
          `${categoryLabel(e.category)}${courseCounts.get(e.category) > 1 ? ` (${e.course.toUpperCase()})` : ""}`,
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
    const items = filtered.filter(
      (e) =>
        showCompleted ||
        keyOf(e) === selectedKey ||
        !S.xpRewards[keyOf(e)],
    );
    const la = {};
    S.attempts.forEach((a) => {
      la[a.key] = a.correct;
    });
    if (selectedKey && !items.some((e) => keyOf(e) === selectedKey)) {
      selectedKey = "";
      pane.replaceChildren();
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
          ` ${packageLabel(e.packageId)} · ${e.difficulty}${e.examEligible ? "" : " · not on exam"}`,
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
  };
  function selectExercise(exercise, addHistoryEntry) {
    selectedKey = keyOf(exercise);
    pane.replaceChildren(
      qView(
        exercise,
        "practice",
        () => answers[keyOf(exercise)],
        (v) => saveDraft(keyOf(exercise), v),
        () => draw(),
      ),
    );
    if (addHistoryEntry) {
      const url = `#/practice/${encodeURIComponent(exercise.packageId)}/${encodeURIComponent(exercise.id)}`;
      if (location.hash !== url) history.pushState(null, "", url);
    }
    draw();
  }
  draw();
  const routeExercise = S.exercises.find(
    (exercise) =>
      exercise.packageId === routePackageId && exercise.id === routeExerciseId,
  );
  if (routeExercise) selectExercise(routeExercise, false);
  root.append(flt, h("div", { class: "cols" }, list, pane));
}

async function pageExam(root) {
  const saved = await kv.get("exam", null);
  if (saved && !saved.submitted) return runExam(root, saved);
  const courses = uniq(S.exercises, (e) => e.course),
    cfg = { course: "", Easy: 5, Medium: 5, Hard: 2, Extreme: 0, mins: 60 },
    msg = h("div");
  const difficultyInputs = {};
  if (!S.exercises.some((e) => e.examEligible))
    return root.append(
      empty(
        "No exam-eligible exercises installed yet.",
        "Ask the site maintainer to add an exam-eligible package.",
      ),
      await historyView(),
    );
  const num = (k, l) => {
    const input = h("input", {
        type: "number",
        min: 0,
        value: cfg[k],
        oninput: (e) => {
          cfg[k] = Math.min(
            +e.target.max,
            Math.max(0, +e.target.value || 0),
          );
          e.target.value = cfg[k];
          updateExamSummary();
        },
      });
    difficultyInputs[k] = input;
    return h(
      "label",
      { class: "exam-count-control" },
      h("span", {}, l),
      input,
    );
  };
  const examSummary = h("div", {
    class: "exam-config-summary",
    "aria-live": "polite",
  });
  const updateExamSummary = () => {
    const count = cfg.Easy + cfg.Medium + cfg.Hard + cfg.Extreme;
    examSummary.replaceChildren(
      h("strong", {}, `${count} questions`),
      h(
        "span",
        {},
        `${cfg.course ? cfg.course.toUpperCase() : "All courses"} · ${cfg.mins} minutes`,
      ),
    );
  };
  const courseSelect = h(
    "select",
    {
      onchange: (e) => {
        cfg.course = e.target.value;
        updateDifficultyLimits();
        updateExamSummary();
      },
    },
    h("option", { value: "" }, "All courses"),
    courses.map((c) => h("option", { value: c }, c.toUpperCase())),
  );
  const minuteControl = h(
    "label",
    { class: "exam-count-control exam-minutes-control" },
    h("span", {}, "Minutes"),
    h("input", {
      type: "number",
      min: 1,
      value: cfg.mins,
      oninput: (e) => {
        cfg.mins = Math.max(1, +e.target.value || 1);
        e.target.value = cfg.mins;
        updateExamSummary();
      },
    }),
  );
  const updateDifficultyLimits = () => {
    DIFF.forEach((difficulty) => {
      const available = S.exercises.filter(
        (exercise) =>
          Core.eligible(exercise) &&
          (!cfg.course || exercise.course === cfg.course) &&
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
  updateDifficultyLimits();
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
          "Choose the course, difficulty mix, and time limit for your exam.",
        ),
      ),
      h(
        "div",
        { class: "exam-setup-controls" },
        h(
          "label",
          { class: "exam-course-control" },
          h("span", {}, "Course"),
          courseSelect,
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
              const r = generateExam(
                S.exercises,
                {
                  course: cfg.course,
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
                const avail = (d) =>
                  S.exercises.filter(
                    (e) =>
                      Core.eligible(e) &&
                      (!cfg.course || e.course === cfg.course) &&
                      e.difficulty === d,
                  ).length;
                return msg.replaceChildren(
                  h(
                    "p",
                    { class: "bad" },
                    "Not enough eligible exercises — nothing was substituted. " +
                      Object.entries(r.shortage)
                        .map(([d, s]) => `${d}: need ${s.need}, have ${s.have}`)
                        .join("; ") +
                      ".",
                  ),
                  h(
                    "small",
                    {},
                    `Available — Easy ${avail("Easy")}, Medium ${avail("Medium")}, Hard ${avail("Hard")}, Extreme ${avail("Extreme")}. Adjust the numbers above.`,
                  ),
                );
              }
              const st = {
                id: "x" + Date.now(),
                ids: r.exercises.map(keyOf),
                answers: {},
                flags: {},
                cur: 0,
                cfg,
                deadline: Date.now() + cfg.mins * 60000,
                startedAt: Date.now(),
                submitted: false,
              };
              await kv.set("exam", st);
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
              await kv.del("exam");
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
  const save = () => kv.set("exam", st),
    top = h("div", { class: "exam-topbar card" }),
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
    session = h(
      "section",
      { class: "exam-session" },
      top,
      workspace,
    );
  let done = false;
  const submit = async () => {
    if (done || !(await kv.get("exam", null))) return;
    done = true;
    clearInterval(iv);
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
    await kv.del("exam");
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
              r.ok
                ? "Correct"
                : r.ok === false
                  ? "Incorrect"
                  : "Self-check",
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
      ),
      h(
        "button",
        {
          class: "exam-submit-button",
          onclick: () => confirm("Submit the exam now?") && submit(),
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
    reset = resetLocalDataControl();
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
  ];
  const hero = h(
    "section",
    { class: "level-card" },
    h("div", { class: "level-emblem", "aria-hidden": "true" }, "L" + level),
    h(
      "div",
      { class: "level-info" },
      h("p", { class: "eyebrow" }, "STUDENT PROGRESS"),
      h("h1", {}, `Level ${level}`),
      h("p", {}, `${xp} XP earned · ${250 - levelXp} XP to level ${level + 1}`),
      h("progress", {
        class: "xp-progress",
        max: 250,
        value: levelXp,
        "aria-label": `${levelXp} of 250 XP toward level ${level + 1}`,
      }),
      h("small", {}, `${levelXp} / 250 XP`),
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
      h("h2", {}, "Recent activity"),
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
                      `${exercise.course.toUpperCase()} · ${exercise.difficulty} · ${new Date(attempt.t).toLocaleDateString()}`,
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
              ? `No ${course.toUpperCase()} activity yet.`
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
    ["", "All quests"],
    ["sql", "SQL"],
    ["os", "OS"],
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
        h("h2", {}, "Quest log"),
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
        h("h2", {}, "Achievements"),
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
function resetLocalDataControl() {
  const status = h("p", { role: "status" });
  const button = h(
    "button",
    {
      class: "danger",
      onclick: async () => {
        if (
          !confirm(
            "Reset all data saved by this practice app on this device? This removes imported packages, exercise drafts and results, XP, achievements, saved exams, and exam history. This cannot be undone.",
          )
        )
          return;
        button.disabled = true;
        status.textContent = "Clearing saved app data…";
        try {
          await kv.clear();
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
  terminalArtifact.hidden = true;
  for (let column = 0; column < 12; column++) {
    const stream = Array.from({ length: 28 }, () =>
      Array.from(
        { length: 3 },
        () => alphabet[Math.floor(Math.random() * alphabet.length)],
      ).join(""),
    ).join("\n");
    terminalArtifact.append(
      h(
        "span",
        {
          style: `left:${(column / 12) * 100}%;animation-delay:${column * 0.08}s`,
        },
        stream,
      ),
    );
  }
  setInterval(() => {
    if (reducedMotion.matches || document.hidden) return;
    terminalArtifact.hidden = false;
    terminalArtifact.classList.add("active");
    setTimeout(() => {
      terminalArtifact.classList.remove("active");
      terminalArtifact.hidden = true;
    }, 7000);
  }, 60_000);
}
function schedulePeriodicToast() {
  const delay = 60_000 + Math.random() * 9 * 60_000;
  setTimeout(() => {
    periodicToast.textContent = "Wassim sees you 👀";
    periodicToast.hidden = false;
    requestAnimationFrame(() => periodicToast.classList.add("show"));
    schedulePeriodicToast();
    setTimeout(() => {
      periodicToast.classList.remove("show");
      setTimeout(() => {
        periodicToast.hidden = true;
      }, 220);
    }, 4200);
  }, delay);
}
schedulePeriodicToast();
let routeTok = 0;
async function route() {
  const tok = ++routeTok,
    [, p = "reader", arg, exerciseArg] = location.hash.split("/"),
    main = $("#main");
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
    const decodeSegment = (segment) => {
      try {
        return decodeURIComponent(segment || "");
      } catch {
        return "";
      }
    };
    await pagePractice(view, decodeSegment(arg), decodeSegment(exerciseArg));
  } else {
    await (pages[p] || pageReader)(view, arg);
  }
  if (tok !== routeTok) view.remove();
}
addEventListener("hashchange", route);
addEventListener("popstate", route);
loadContent()
  .then(route)
  .catch((e) => {
    $("#main").textContent = "Startup error: " + e.message;
  });
