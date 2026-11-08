"use strict";

function normalizeLibrary(map) {
  // A single subject may be supplied directly as { title, terms }, while
  // multi-subject libraries remain objects keyed by their subject IDs.
  const isSingleSubject = Boolean(
    map &&
    typeof map === "object" &&
    !Array.isArray(map) &&
    typeof map.title === "string" &&
    (Array.isArray(map.terms) ||
      (map.terms && typeof map.terms === "object") ||
      map.file),
  );
  const entries = isSingleSubject
    ? [[map.id || map.slug || "relational-database", map]]
    : Object.entries(map || {});
  return entries.map(([id, entry]) => {
    let terms;
    if (Array.isArray(entry?.terms)) {
      terms = entry.terms.map((t, i) =>
        typeof t === "string"
          ? { label: `Term ${i + 1}`, file: t }
          : {
              ...t,
              label: t?.name ?? t?.label ?? `Term ${i + 1}`,
              file: t?.file,
            },
      );
    } else if (entry?.terms && typeof entry.terms === "object") {
      terms = Object.entries(entry.terms)
        .map(([label, t]) => ({
          ...(t && typeof t === "object" && !Array.isArray(t) ? t : {}),
          label,
          file: typeof t === "string" ? t : t?.file,
        }))
        .sort((x, y) =>
          x.label.localeCompare(y.label, undefined, { numeric: true }),
        );
    } else terms = entry?.file ? [{ label: "Term 1", file: entry.file }] : [];
    // A learning entry may link one exercise package for every term, or
    // define a default packageId inherited by terms that do not override it.
    const defaultPackageId = entry?.packageId ?? entry?.exercisePackageId;
    terms = terms.map((t) => ({
      ...t,
      packageId: t.packageId ?? t.exercisePackageId ?? defaultPackageId,
    }));
    return { ...entry, id, terms: terms.filter((t) => t.file) };
  });
}
async function loadContent() {
  S.exercises = [];
  S.datasets = {};
  S.errors = [];
  S.packages = [];

  const main = document.getElementById("main");
  const startupProgress = createLoadingProgress({
    title: "Preparing your practice library",
    detail: "Loading the content manifest…",
    value: null,
    className: "startup-loading-progress",
  });
  main?.replaceChildren(startupProgress.element);

  const ctx = {
    seenIds: new Set(),
    datasetIds: new Set(),
    schemaVersion: 1,
  };

  const files = [];

  try {
    const manifest = await (await fetchAppResource("content/manifest.json")).json();

    if (!compatibleManifest(manifest))
      throw new Error(
        `Incompatible manifest schema version ${manifest.schemaVersion}; supported: ${ctx.schemaVersion}`,
      );

    // Packages and the document libraries are objects keyed by ID. Each
    // library entry contains an ordered list of per-term Markdown/HTML files.
    S.manifest = {
      ...manifest,
      referenceFiles: normalizeLibrary(manifest.referenceFiles),
      canvasFiles: normalizeLibrary(manifest.canvasFiles),
      learningFiles: normalizeLibrary(manifest.learningFiles),
    };

    const packageEntries = Object.entries(manifest.packages || {});
    const totalPackageFiles = packageEntries.reduce(
      (count, [, entry]) => count + (entry.files || []).length,
      0,
    );
    let loadedPackageFiles = 0;
    startupProgress.update({
      title: "Loading exercise packages",
      detail: totalPackageFiles
        ? `Found ${totalPackageFiles} content package file${totalPackageFiles === 1 ? "" : "s"}.`
        : "No bundled exercise packages were listed; restoring saved work…",
      value: totalPackageFiles ? 5 : 80,
    });

    for (const [manifestId, entry] of packageEntries) {
      for (const f of entry.files || []) {
        try {
          const r = await fetchAppResource("content/" + f);

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
              canvas: pkg.canvas ?? entry.canvas,
            },
          });
        } catch (e) {
          S.errors.push({
            file: "content/" + f,
            id: "(file)",
            field: "$",
            msg: "Cannot load or parse: " + e.message,
          });
        } finally {
          loadedPackageFiles++;
          startupProgress.update({
            detail: `Loaded ${loadedPackageFiles} of ${totalPackageFiles} package files…`,
            value: totalPackageFiles
              ? 5 + (loadedPackageFiles / totalPackageFiles) * 70
              : 80,
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
      learningFiles: [],
    };
    startupProgress.update({
      title: "Restoring available practice content",
      detail: "The content manifest could not be loaded; continuing with saved/imported content…",
      value: 80,
    });
  }

  startupProgress.update({
    title: "Restoring saved progress",
    detail: "Loading imported packages and saved attempts…",
    value: 80,
  });
  for (const p of await kv.get("imported", [])) {
    files.push({
      name: p.name,
      src: "imported",
      pkg: p.pkg,
    });
  }

  startupProgress.update({
    title: "Preparing the exercise library",
    detail: `Validating ${files.length} bundled and imported package${files.length === 1 ? "" : "s"}…`,
    value: 76,
  });
  for (let index = 0; index < files.length; index++) {
    addPackage(files[index], ctx);
    startupProgress.update({
      detail: `Validated ${index + 1} of ${files.length} packages…`,
      value: files.length ? 76 + ((index + 1) / files.length) * 8 : 84,
    });
    // Give the browser a paint opportunity between package validations.
    if (index % 3 === 2) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }

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
  const everIncorrectByKey = new Set();

  for (const a of storedAttempts) {
    if (a && typeof a.id === "string") {
      const ex =
        typeof a.key === "string"
          ? exercisesByKey.get(a.key)
          : exercisesById.get(a.id)?.length === 1
            ? exercisesById.get(a.id)[0]
            : null;

      const key = ex ? keyOf(ex) : typeof a.key === "string" ? a.key : null;

      if (key && (a.correct === false || a.everIncorrect === true))
        everIncorrectByKey.add(key);

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

  S.attempts = [...latest.values()].map((attempt) => ({
    ...attempt,
    // Older stored data may contain multiple attempts per exercise. Preserve
    // any past incorrect result when compacting that history to the latest row.
    everIncorrect:
      everIncorrectByKey.has(attempt.key) || attempt.correct === false,
  }));

  const savedRewards = await kv.get("xpRewards", {});

  S.xpRewards =
    savedRewards &&
    typeof savedRewards === "object" &&
    !Array.isArray(savedRewards)
      ? savedRewards
      : {};

  const savedForLater = await kv.get("savedForLater", {});
  S.savedForLater =
    savedForLater &&
    typeof savedForLater === "object" &&
    !Array.isArray(savedForLater)
      ? savedForLater
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
  startupProgress.update({
    title: "Restoring saved answers",
    detail: `Checking saved drafts for ${S.exercises.length} exercises…`,
    value: 86,
  });
  let restoredDrafts = 0;
  const totalDrafts = S.exercises.length;

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
      restoredDrafts++;
      if (totalDrafts) {
        startupProgress.update({
          detail: `Restored ${restoredDrafts} of ${totalDrafts} saved drafts…`,
          value: 86 + (restoredDrafts / totalDrafts) * 13,
        });
      }
    }),
  );
  startupProgress.complete(`${S.exercises.length} exercises ready.`);
}
// Exercise packages use one public grading schema. Core's validator and the
// original OS grader still consume the previous field names, so adapt only at
// that boundary while keeping S.exercises in the canonical shape.
function normalizeExerciseCheck(check, kind = "generic") {
  if (!check || typeof check !== "object" || Array.isArray(check)) return check;
  const next = { ...check };
  if (Object.prototype.hasOwnProperty.call(next, "expectedRegex")) {
    if (!Object.prototype.hasOwnProperty.call(next, "expected"))
      next.expected = next.expectedRegex;
    delete next.expectedRegex;
    next.regex = true;
  }
  if (kind === "java") {
    const matcher = String(next.matcher ?? "").toLowerCase();
    if (matcher) {
      next.regex = matcher === "regex";
      if (matcher === "contains") next.contains = true;
      else if (matcher === "regex" || matcher === "exact") delete next.contains;
      if (["regex", "contains", "exact"].includes(matcher))
        delete next.matcher;
    } else {
      next.regex = next.regex === true;
    }
  } else if (kind === "terminal") {
    next.regex = next.regex === true;
  }
  return next;
}

function normalizeExercisePackageSchema(pkg) {
  if (
    !pkg ||
    typeof pkg !== "object" ||
    !pkg.exercises ||
    typeof pkg.exercises !== "object" ||
    Array.isArray(pkg.exercises)
  )
    return pkg;

  const exercises = Object.fromEntries(
    Object.entries(pkg.exercises).map(([id, raw]) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw))
        return [id, raw];
      const exercise = { ...raw };
      const type = exercise.type;
      const serviceKey =
        type === "java-ex" ? "java" : type === "terminal" ? "terminal" : null;

      // Java and terminal keep their distinct runtime settings nested, while
      // shared exercise content (checks, solution, explanation) lives at root.
      if (serviceKey && exercise[serviceKey] && typeof exercise[serviceKey] === "object") {
        const service = { ...exercise[serviceKey] };
        if (!Array.isArray(exercise.checks) && Array.isArray(service.checks))
          exercise.checks = service.checks;
        delete service.checks;
        if (exercise.solution === undefined && service.solution !== undefined)
          exercise.solution = service.solution;
        delete service.solution;
        if (service.explanation !== undefined) {
          if (exercise.explanation === undefined) {
            exercise.explanation = service.explanation;
          } else if (
            type === "java-ex" &&
            exercise.explanation !== service.explanation
          ) {
            service.gradingExplanation = service.explanation;
          }
          delete service.explanation;
        }
        exercise[serviceKey] = service;
      }

      if (type === "sql-query" && exercise.solution === undefined &&
          exercise.referenceSolution !== undefined) {
        exercise.solution = exercise.referenceSolution;
      }
      delete exercise.referenceSolution;

      // `expected` was overloaded for check collections; it is now always
      // called `checks`. Command answers are normalized to expected/regex rows.
      if (exercise.checks === undefined && exercise.expected !== undefined) {
        const expected = exercise.expected;
        exercise.checks =
          type === "command-text" && expected && typeof expected === "object" &&
          !Array.isArray(expected)
            ? [
                ...(expected.accepted || []).map((value) => ({
                  expected: value,
                  regex: false,
                })),
                ...(expected.patterns || []).map((value) => ({
                  expected: value,
                  regex: true,
                })),
              ]
            : expected;
      }
      delete exercise.expected;

      if (exercise.expectedRegex !== undefined) {
        const rows = Array.isArray(exercise.checks) ? [...exercise.checks] : [];
        rows.push({ expected: exercise.expectedRegex, regex: true });
        exercise.checks = rows;
        delete exercise.expectedRegex;
      }

      if (Array.isArray(exercise.checks)) {
        exercise.checks = exercise.checks.map((check) =>
          normalizeExerciseCheck(
            check,
            type === "java-ex" ? "java" : type === "terminal" ? "terminal" : "generic",
          ),
        );
      }

      // The common optional fields are stable even for older imported files.
      if (exercise.hints == null) exercise.hints = [];
      else if (typeof exercise.hints === "string") exercise.hints = [exercise.hints];
      return [id, exercise];
    }),
  );
  return { ...pkg, exercises };
}

function commandChecksAsLegacyExpected(checks) {
  const rows = Array.isArray(checks) ? checks : [];
  return {
    accepted: rows
      .filter((check) => check && check.regex !== true)
      .map((check) => check.expected),
    patterns: rows
      .filter((check) => check && check.regex === true)
      .map((check) => check.expected),
  };
}

// Add old aliases for the legacy Core functions without leaking the old schema
// back into the canonical in-memory exercise objects.
function exerciseWithCoreAliases(exercise) {
  const adapted = { ...exercise };
  // Only exercise types whose legacy Core contract used root `expected` need
  // that alias. Java and terminal checks belonged inside their service block.
  if (
    adapted.checks !== undefined &&
    adapted.expected === undefined &&
    adapted.type !== "java-ex" &&
    adapted.type !== "terminal"
  ) {
    adapted.expected =
      adapted.type === "command-text"
        ? commandChecksAsLegacyExpected(adapted.checks)
        : adapted.checks;
  }
  if (
    adapted.type === "sql-query" &&
    adapted.solution !== undefined &&
    adapted.referenceSolution === undefined
  )
    adapted.referenceSolution = adapted.solution;
  if (adapted.type === "java-ex") {
    const java = { ...(adapted.java || {}) };
    java.checks = adapted.checks ?? java.checks;
    java.solution = adapted.solution ?? java.solution;
    java.explanation =
      java.gradingExplanation ?? adapted.explanation ?? java.explanation;
    adapted.java = java;
  } else if (adapted.type === "terminal") {
    const terminal = { ...(adapted.terminal || {}) };
    terminal.checks = adapted.checks ?? terminal.checks;
    terminal.solution = adapted.solution ?? terminal.solution;
    terminal.explanation = adapted.explanation ?? terminal.explanation;
    adapted.terminal = terminal;
  }
  return adapted;
}

function packageForCoreValidation(pkg) {
  const legacy = {
    ...pkg,
    exercises: Object.fromEntries(
      Object.entries(pkg.exercises || {}).map(([id, exercise]) => {
        if (!exercise || typeof exercise !== "object" || Array.isArray(exercise))
          return [id, exercise];
        const adapted = exerciseWithCoreAliases(exercise);
        if (adapted.type === "java-ex") {
          const java = { ...(adapted.java || {}) };
          if (Array.isArray(java.checks)) java.checks = java.checks.map((check) => {
            const next = { ...check };
            const matcher =
              next.regex === true
                ? "regex"
                : next.contains === true
                  ? "contains"
                  : "";
            delete next.regex;
            delete next.contains;
            if (matcher) next.matcher = matcher;
            return next;
          });
          adapted.java = java;
          delete adapted.checks;
          delete adapted.solution;
          if (java.gradingExplanation !== undefined) {
            java.explanation = java.gradingExplanation;
            delete java.gradingExplanation;
            adapted.java = java;
          } else {
            delete adapted.explanation;
          }
        } else if (adapted.type === "terminal") {
          const terminal = { ...(adapted.terminal || {}) };
          if (Array.isArray(terminal.checks))
            terminal.checks = terminal.checks.map((check) => {
              const next = { ...check };
              if (next.regex === false) delete next.regex;
              return next;
            });
          adapted.terminal = terminal;
          delete adapted.checks;
          delete adapted.solution;
          delete adapted.explanation;
        } else if (adapted.type === "sql-query") {
          delete adapted.solution;
        } else {
          delete adapted.checks;
        }
        return [id, adapted];
      }),
    ),
  };
  return legacy;
}

function gradeExerciseAnswer(exercise, answer) {
  return gradeOS(exerciseWithCoreAliases(exercise), answer);
}

function hasSimilarExerciseAnswer(exercise, answer) {
  return hasSimilarOSAnswer(exerciseWithCoreAliases(exercise), answer);
}

// Hints are optional package content. Normalize them before validation so
// packages created before hints were introduced (or deliberately omitting
// them) remain valid. Keep malformed non-string/non-array values unchanged so
// package validation can still report genuinely invalid data.
function normalizeOptionalExerciseHints(pkg) {
  if (
    !pkg ||
    typeof pkg !== "object" ||
    !pkg.exercises ||
    typeof pkg.exercises !== "object" ||
    Array.isArray(pkg.exercises)
  )
    return pkg;

  return {
    ...pkg,
    exercises: Object.fromEntries(
      Object.entries(pkg.exercises).map(([id, exercise]) => {
        if (
          !exercise ||
          typeof exercise !== "object" ||
          Array.isArray(exercise)
        )
          return [id, exercise];

        // All exercise types use one shared top-level `hints` field.
        // Terminal configuration is reserved for runtime/filesystem settings.
        const hints = exercise.hints;
        return [
          id,
          {
            ...exercise,
            hints:
              hints == null
                ? []
                : Array.isArray(hints)
                  ? hints
                  : typeof hints === "string"
                    ? [hints]
                    : hints,
          },
        ];
      }),
    ),
  };
}

function addPackage(f, ctx) {
  const c = {
    ...ctx,
    seenIds: new Set(ctx.seenIds),
    datasetIds: new Set(ctx.datasetIds),
  };

  // A question may omit `hints`; the practice UI simply hides the hint
  // control for an empty list.
  const pkg = normalizeOptionalExerciseHints(normalizeExercisePackageSchema(f.pkg));

  const validationPkg = packageForCoreValidation(pkg);
  const errs = validatePackage(validationPkg, f.name, c);

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

  // Package-level metadata is copied onto exercises so filtering and routing
  // stay consistent for bundled and imported packages. A per-exercise canvas
  // value may override the package default.
  const packageTerm = Number.isInteger(pkg.term) ? pkg.term : null;
  const packageCanvas = pkg.canvas ?? f.canvas ?? null;
  const exercises = Object.entries(pkg.exercises || {}).map(([id, ex]) => ({
    ...ex,
    id,
    // Java is a programming-fundamentals subject, not a separate course tab.
    course:
      ex.type === "java-ex" && ex.course === "java"
        ? "programming_fundamentals"
        : ex.course,
    term: packageTerm,
    canvas: ex.canvas ?? packageCanvas,
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
    canvas: packageCanvas,
    n: exercises.length,
  });

  Object.assign(ctx, {
    seenIds: c.seenIds,
    datasetIds: c.datasetIds,
  });

  return [];
}

// Render package-loading and package-validation problems visibly on every page.
// Each message is inserted as text (not HTML) so package contents cannot inject markup.
function packageLoadErrorPanel() {
  if (!Array.isArray(S.errors) || S.errors.length === 0) return null;

  const describeError = (error) => {
    if (typeof error === "string") {
      return h("li", {}, h("p", {}, error));
    }

    const context = [
      error?.file || error?.name || "",
      error?.id && !["(file)", "(manifest)"].includes(error.id)
        ? `Question ${error.id}`
        : "",
      error?.field && error.field !== "$" ? `Field ${error.field}` : "",
    ]
      .filter(Boolean)
      .join(" \u00B7 ");
    const reason =
      error?.msg ||
      error?.message ||
      (error == null
        ? "The package could not be loaded for an unknown reason."
        : "");

    let fallback = "";
    if (!reason) {
      try {
        fallback = JSON.stringify(error);
      } catch {
        fallback = String(error);
      }
    }

    return h(
      "li",
      {},
      context ? h("strong", {}, context) : "",
      h(
        "p",
        {},
        String(
          reason ||
            fallback ||
            "The package could not be loaded for an unknown reason.",
        ),
      ),
    );
  };

  const count = S.errors.length;
  return h(
    "section",
    {
      class: "package-load-errors",
      role: "alert",
      "aria-labelledby": "package-load-errors-title",
    },
    h(
      "h2",
      { id: "package-load-errors-title", class: "bad" },
      "Some exercise packages could not be loaded",
    ),
    h(
      "p",
      {},
      `The app loaded the available content, but ${count} package issue${count === 1 ? "" : "s"} occurred. Details:`,
    ),
    h("ul", {}, ...S.errors.map(describeError)),
  );
}

// ---------- SQL engine ----------
// PGlite runs in a dedicated Web Worker (see pglite-loader.js). Keep complete
// dataset operations in a single queue: the worker owns one PostgreSQL
// connection, and a reset + dataset setup + query must never interleave with
// another exercise's work.
let databaseQueue = Promise.resolve();
const preparedDatasets = new Set();
let activeDatabaseToken = null;
const databaseToken = (dataset) => `${dataset.id}@${dataset.version}`;
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
  activeDatabaseToken = databaseToken(ds);
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
// Sandbox queries share the existing PGlite worker but keep the selected
// dataset live between runs. Exercise queries continue to use withFreshDb().
function withPersistentDb(ds, task, forceReset = false) {
  const operation = databaseQueue.then(async () => {
    const db = await engine();
    if (forceReset || activeDatabaseToken !== databaseToken(ds))
      await resetDatabase(db, ds);
    return task(db);
  });
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
async function runSqlInRollbackTransaction(db, ds, sql) {
  let began = false;
  let result;
  try {
    await db.exec("BEGIN");
    began = true;
    result = { status: "fulfilled", value: await runSql(db, sql) };
  } catch (reason) {
    result = { status: "rejected", reason };
  }

  // A normal query (including DML/DDL) is rolled back to the dataset baseline.
  // Explicit transaction control can make PostgreSQL treat a later ROLLBACK
  // with no active transaction as a warning rather than an error, so those
  // scripts always receive a full dataset reset before the next query.
  const controlsTransaction = /\b(?:BEGIN|COMMIT|END|ROLLBACK)\b/i.test(sql);
  if (began && !controlsTransaction) {
    try {
      await db.exec("ROLLBACK");
    } catch {
      await resetDatabase(db, ds);
    }
  } else {
    await resetDatabase(db, ds);
  }
  return result;
}

async function gradeSqlOnDatabase(
  ex,
  sql,
  db,
  ds,
  startedAt = performance.now(),
  setupMs = 0,
) {
  const t0 = startedAt;
  if (!String(sql || "").trim())
    return { correct: false, error: "No SQL answer was submitted." };
  try {
    checkKind(ex, sql);
  } catch (error) {
    return { correct: false, error: error.message };
  }

  const student = await runSqlInRollbackTransaction(db, ds, sql);
  if (student.status === "rejected") {
    return {
      correct: false,
      error: describeSqlError(student.reason, sql),
      setupMs,
      totalMs: Math.round(performance.now() - t0),
    };
  }

  const reference = await runSqlInRollbackTransaction(
    db,
    ds,
    ex.solution,
  );
  if (reference.status === "rejected") {
    return {
      correct: false,
      error: describeSqlError(reference.reason, ex.solution),
      res: student.value,
      setupMs,
      totalMs: Math.round(performance.now() - t0),
    };
  }

  const cmp = compare(student.value, reference.value, ex);
  return {
    correct: cmp.ok,
    cmp,
    res: student.value,
    setupMs,
    totalMs: Math.round(performance.now() - t0),
  };
}

async function gradeSql(ex, sql) {
  const ds = S.datasets[ex.datasetId];
  if (!ds) return { correct: false, error: "The SQL dataset is unavailable." };
  try {
    checkKind(ex, sql);
  } catch (error) {
    return { correct: false, error: error.message };
  }
  const startedAt = performance.now();
  return withFreshDb(ds, (db) =>
    gradeSqlOnDatabase(
      ex,
      sql,
      db,
      ds,
      startedAt,
      Math.round(performance.now() - startedAt),
    ),
  );
}

// Exam SQL grading groups questions by dataset. PGlite is a single worker and
// each question previously re-imported the complete dataset twice (student
// query + reference query). A single seed per dataset plus isolated rollback
// transactions preserves clean-state grading while avoiding repeated imports.
async function gradeSqlBatch(items, onProgress = () => {}) {
  const grades = new Map();
  const groups = new Map();

  for (const item of items) {
    const { ex } = item;
    const key = keyOf(ex);
    const sql = typeof item.answer === "string" ? item.answer : "";
    if (!sql.trim()) {
      grades.set(key, {
        correct: false,
        error: "No SQL answer was submitted.",
      });
      continue;
    }
    try {
      checkKind(ex, sql);
    } catch (error) {
      grades.set(key, { correct: false, error: error.message });
      continue;
    }
    const ds = S.datasets[ex.datasetId];
    if (!ds) {
      grades.set(key, {
        correct: false,
        error: "The SQL dataset is unavailable.",
      });
      continue;
    }
    const groupKey = databaseToken(ds);
    if (!groups.has(groupKey)) groups.set(groupKey, { ds, items: [] });
    groups.get(groupKey).items.push({ ex, sql, key });
  }

  let completed = 0;
  const total = [...groups.values()].reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  for (const { ds, items: groupItems } of groups.values()) {
    try {
      const startedAt = performance.now();
      onProgress({ phase: "prepare", dataset: ds, completed, total });
      await withFreshDb(ds, async (db) => {
        const setupMs = Math.round(performance.now() - startedAt);
        for (const item of groupItems) {
          onProgress({ phase: "check", exercise: item.ex, completed, total });
          try {
            grades.set(
              item.key,
              await gradeSqlOnDatabase(
                item.ex,
                item.sql,
                db,
                ds,
                startedAt,
                setupMs,
              ),
            );
          } catch (error) {
            grades.set(item.key, {
              correct: false,
              error: `SQL grading failed: ${error?.message || String(error)}`,
            });
          }
          completed++;
        }
      });
    } catch (error) {
      for (const item of groupItems) {
        if (grades.has(item.key)) continue;
        grades.set(item.key, {
          correct: false,
          error: `SQL dataset setup failed: ${error?.message || String(error)}`,
        });
        completed++;
      }
    }
  }
  return grades;
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
// Summaries). One small tokenizer, configured per language in CODE_LANGS.
// Output is <span class="tok-\u2026"> markup; colours are injected once (light+dark).
