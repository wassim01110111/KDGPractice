// Pure logic: comparator, exam generator, validator, OS grading. Works in browser (window.Core) and Node.
(function (root) {
  const NUM = new Set([20, 21, 23, 26, 700, 701, 1700]),
    FLT = new Set([700, 701]);
  const DIFF = ["Easy", "Medium", "Hard", "Extreme"];
  const SQL_TYPES = ["sql-query"],
    MCQ_TYPES = ["mcq-single", "mcq-multi", "mcq-multiple"],
    OS_TYPES = [
      ...MCQ_TYPES,
      "command-text",
      "fill-blank",
      "short-answer-self-check",
      "terminal",
    ];
  const JAVA_TYPES = ["java-ex"];
  const NON_SQL_TYPES = [...OS_TYPES, ...JAVA_TYPES];
  const JAVA_CHECK_TYPES = new Set([
    "stdout",
    "stderr",
    "classExists",
    "fieldExists",
    "fieldModifier",
    "fieldValue",
    "methodExists",
    "methodModifier",
    "methodReturn",
    "constructorExists",
    "classModifier",
    "inheritance",
    "instanceOf",
  ]);
  function compatibleSchemaVersion(version, supported) {
    const match = String(version).match(/^(\d+)(?:\.0+)*$/);
    return Boolean(match && Number(match[1]) === supported);
  }

  function normNum(v) {
    let s = String(v).trim();
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
      if (s === "-0") s = "0";
    }
    return s;
  }
  function cellKey(v, oid, tol) {
    if (v === null || v === undefined) return "N";
    if (v instanceof Date) return "d:" + v.getTime();
    if (NUM.has(oid)) {
      if (tol && FLT.has(oid))
        return "f:" + (Math.round(Number(v) / tol) * tol).toPrecision(10);
      return "n:" + normNum(v);
    }
    if (typeof v === "object") return "j:" + JSON.stringify(v);
    return "s:" + String(v);
  }
  const show = (v) =>
    v === null || v === undefined
      ? "NULL"
      : v instanceof Date
        ? v.toISOString()
        : typeof v === "object"
          ? JSON.stringify(v)
          : String(v);

  // result = { fields:[{name,dataTypeID}], rows:[[...]] }
  function compare(stu, ref, o = {}) {
    const nS = stu.fields.length,
      nR = ref.fields.length;
    if (nS !== nR)
      return {
        ok: false,
        reason: `Column count differs: yours ${nS}, expected ${nR}.`,
        missing: [],
        extra: [],
      };
    if (o.compareColumnNames) {
      const a = stu.fields.map((f) => f.name.toLowerCase()),
        b = ref.fields.map((f) => f.name.toLowerCase());
      const same = o.columnOrderMatters
        ? a.join() === b.join()
        : [...a].sort().join() === [...b].sort().join();
      if (!same)
        return {
          ok: false,
          reason: `Column names differ: yours (${a.join(", ")}), expected (${b.join(", ")}).`,
          missing: [],
          extra: [],
        };
    }
    const keyRows = (r) =>
      r.rows.map((row) => {
        let cells = row.map((v, i) =>
          cellKey(v, r.fields[i].dataTypeID, o.numericTolerance),
        );
        if (!o.columnOrderMatters) cells = cells.slice().sort();
        return cells.join("\u0001");
      });
    const kS = keyRows(stu),
      kR = keyRows(ref),
      disp = (r, i) => r.rows[i].map(show).join(" | ");
    if (o.orderMatters) {
      const n = Math.max(kS.length, kR.length);
      for (let i = 0; i < n; i++)
        if (kS[i] !== kR[i])
          return {
            ok: false,
            reason:
              kS.length !== kR.length
                ? `Row count differs: yours ${kS.length}, expected ${kR.length}.`
                : `Rows differ in order or value at position ${i + 1}.`,
            missing: kR
              .map((k, j) => (k !== kS[j] ? disp(ref, j) : null))
              .filter(Boolean)
              .slice(0, 20),
            extra: kS
              .map((k, j) => (k !== kR[j] ? disp(stu, j) : null))
              .filter(Boolean)
              .slice(0, 20),
          };
      return { ok: true };
    }
    const cnt = new Map();
    kR.forEach((k) => cnt.set(k, (cnt.get(k) || 0) + 1));
    const extra = [];
    kS.forEach((k, i) => {
      const c = cnt.get(k) || 0;
      if (c > 0) cnt.set(k, c - 1);
      else extra.push(disp(stu, i));
    });
    const missing = [];
    kR.forEach((k, i) => {
      const c = cnt.get(k) || 0;
      if (c > 0) {
        cnt.set(k, c - 1);
        missing.push(disp(ref, i));
      }
    });
    if (!missing.length && !extra.length) return { ok: true };
    return {
      ok: false,
      reason: "Result rows differ.",
      missing: missing.slice(0, 20),
      extra: extra.slice(0, 20),
    };
  }

  function shuffle(a, rnd = Math.random) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function exerciseKey(ex, packageId = ex.packageId) {
    return packageId ? JSON.stringify([packageId, ex.id]) : ex.id;
  }
  // lastAttempt: { exerciseKey: ms }
  // Every installed exercise can be selected for an exam. The old
  // `examEligible` property is accepted as inert legacy package metadata.

  function generateFromRegex(input, options = {}) {
    const maxRepeat = options.maxRepeat ?? 3;
    const maxAttempts = options.maxAttempts ?? 100;
    const maxLength = options.maxLength ?? 10000;

    let source;
    let flags = "";
    const isRegExp = input instanceof RegExp;

    if (isRegExp) {
      source = input.source;
      flags = input.flags.replace(/[gy]/g, "");
    } else {
      source = String(input);
    }

    // Support leading inline flags: (?ims)
    while (true) {
      const inline = source.match(/^\(\?([ims]+)\)/);
      if (!inline) break;

      for (const flag of inline[1]) {
        if (!flags.includes(flag)) flags += flag;
      }

      source = source.slice(inline[0].length);
    }

    // Infer multiline mode for line-based lookahead patterns.
    // Override with options.multiline if needed.
    const hasLineLookahead =
      /\(\?[=!]/.test(source) && /\^[\s\S]*\$/.test(source);

    const multiline = options.multiline ?? (!isRegExp && hasLineLookahead);

    if (multiline && !flags.includes("m")) {
      flags += "m";
    }

    const original = new RegExp(source, flags);

    function readGroup(text, start) {
      let depth = 0;
      let escaped = false;
      let inClass = false;

      for (let i = start; i < text.length; i++) {
        const c = text[i];

        if (escaped) {
          escaped = false;
          continue;
        }

        if (c === "\\") {
          escaped = true;
          continue;
        }

        if (c === "[" && !inClass) {
          inClass = true;
          continue;
        }

        if (c === "]" && inClass) {
          inClass = false;
          continue;
        }

        if (inClass) continue;

        if (c === "(") depth++;

        if (c === ")") {
          depth--;

          if (depth === 0) return i;
        }
      }

      throw new Error("Unclosed group at position " + start);
    }

    function groupInfo(text, start) {
      if (text.startsWith("(?=", start)) {
        return { kind: "positive", bodyStart: start + 3 };
      }

      if (text.startsWith("(?!", start)) {
        return { kind: "negative", bodyStart: start + 3 };
      }

      if (text.startsWith("(?<=", start)) {
        return { kind: "lookbehind", bodyStart: start + 4 };
      }

      if (text.startsWith("(?<!", start)) {
        return {
          kind: "negativeLookbehind",
          bodyStart: start + 4,
        };
      }

      if (text.startsWith("(?:", start)) {
        return { kind: "group", bodyStart: start + 3 };
      }

      if (text.startsWith("(?", start)) {
        throw new Error(
          "Unsupported inline group modifier at position " + start,
        );
      }

      return { kind: "group", bodyStart: start + 1 };
    }

    // Collect positive lookaheads without treating assertions inside
    // negative assertions as unconditional requirements.
    function collectPositiveLookaheads(text, output = []) {
      let escaped = false;
      let inClass = false;

      for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (escaped) {
          escaped = false;
          continue;
        }

        if (c === "\\") {
          escaped = true;
          continue;
        }

        if (c === "[" && !inClass) {
          inClass = true;
          continue;
        }

        if (c === "]" && inClass) {
          inClass = false;
          continue;
        }

        if (inClass || c !== "(") continue;

        const info = groupInfo(text, i);
        const end = readGroup(text, i);
        const body = text.slice(info.bodyStart, end);

        if (info.kind === "positive") {
          output.push(body);
          collectPositiveLookaheads(body, output);
        } else if (info.kind === "group") {
          collectPositiveLookaheads(body, output);
        }

        // Negative assertions are enforced during final validation.
        i = end;
      }

      return output;
    }

    function decodeEscape(c) {
      const controls = {
        n: "\n",
        r: "\r",
        t: "\t",
        f: "\f",
        v: "\v",
        0: "\0",
      };

      if (Object.prototype.hasOwnProperty.call(controls, c)) {
        return controls[c];
      }

      if ("\\.^$|?*+()[]{}-".includes(c) || c === "/") {
        return c;
      }

      return null;
    }

    // Extract exact literal lines from ^...$ expressions.
    function extractAnchoredLiterals(text) {
      const found = [];
      let escaped = false;
      let inClass = false;

      for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (escaped) {
          escaped = false;
          continue;
        }

        if (c === "\\") {
          escaped = true;
          continue;
        }

        if (c === "[" && !inClass) {
          inClass = true;
          continue;
        }

        if (c === "]" && inClass) {
          inClass = false;
          continue;
        }

        if (inClass || c !== "^") continue;

        let value = "";
        let valid = true;
        let j = i + 1;

        for (; j < text.length; j++) {
          const x = text[j];

          if (x === "\\") {
            const next = text[++j];

            if (next === undefined) {
              valid = false;
              break;
            }

            const decoded = decodeEscape(next);

            if (decoded === null) {
              valid = false;
              break;
            }

            value += decoded;
            continue;
          }

          if (x === "$") break;

          if (".^*+?()[]{}|".includes(x)) {
            valid = false;
            break;
          }

          value += x;
        }

        if (valid && j < text.length && text[j] === "$" && value.length > 0) {
          found.push(value);
          i = j;
        }
      }

      return found;
    }

    const positiveBodies = collectPositiveLookaheads(source);

    const requiredLines = [
      ...new Set(positiveBodies.flatMap(extractAnchoredLiterals)),
    ];

    function validate(candidate) {
      if (candidate.length > maxLength) return false;

      original.lastIndex = 0;

      return original.test(candidate);
    }

    // Generate candidates satisfying all extracted positive
    // line requirements, then validate all assertions.
    if (requiredLines.length) {
      const separator = options.separator ?? "\n";

      const orders = [requiredLines];

      for (let i = 1; i < requiredLines.length; i++) {
        orders.push(requiredLines.slice(i).concat(requiredLines.slice(0, i)));
      }

      orders.push([...requiredLines].reverse());

      for (
        let attempt = 0;
        attempt < Math.min(maxAttempts, orders.length);
        attempt++
      ) {
        const candidate = orders[attempt].join(separator);

        if (validate(candidate)) {
          return candidate;
        }
      }
    }

    // Generic AST-based fallback.
    let pos = 0;

    function peek(offset = 0) {
      return source[pos + offset];
    }

    function consume() {
      return source[pos++];
    }

    function parseExpression() {
      const alternatives = [parseSequence()];

      while (peek() === "|") {
        consume();
        alternatives.push(parseSequence());
      }

      return alternatives.length === 1
        ? alternatives[0]
        : { type: "alt", alternatives };
    }

    function parseSequence() {
      const nodes = [];

      while (pos < source.length && peek() !== ")" && peek() !== "|") {
        nodes.push(parseQuantified());
      }

      return { type: "seq", nodes };
    }

    function parseQuantified() {
      let node = parseAtom();
      let min = 1;
      let max = 1;

      if (peek() === "*") {
        consume();
        min = 0;
        max = maxRepeat;
      } else if (peek() === "+") {
        consume();
        min = 1;
        max = maxRepeat;
      } else if (peek() === "?") {
        consume();
        min = 0;
        max = 1;
      } else if (peek() === "{") {
        const m = source.slice(pos).match(/^\{(\d+)(?:,(\d*))?\}/);

        if (m) {
          pos += m[0].length;

          min = Number(m[1]);

          max =
            m[2] === undefined
              ? min
              : m[2] === ""
                ? maxRepeat
                : Math.min(Number(m[2]), maxRepeat);
        }
      }

      if (min !== 1 || max !== 1) {
        node = { type: "repeat", node, min, max };
      }

      // Lazy quantifier modifier.
      if (peek() === "?") consume();

      return node;
    }

    function parseAtom() {
      const c = consume();

      if (c === undefined) {
        throw new Error("Unexpected end of regex");
      }

      if (c === "^" || c === "$") {
        return { type: "empty" };
      }

      if (c === ".") {
        return { type: "literal", value: "a" };
      }

      if (c === "\\") {
        const e = consume();

        if (e === undefined) {
          throw new Error("Incomplete escape");
        }

        const controls = {
          n: "\n",
          r: "\r",
          t: "\t",
          f: "\f",
          v: "\v",
        };

        if (e in controls) {
          return { type: "literal", value: controls[e] };
        }

        if (e === "d") {
          return { type: "class", content: "0-9" };
        }

        if (e === "D") {
          return { type: "class", content: "^0-9" };
        }

        if (e === "w") {
          return {
            type: "class",
            content: "a-zA-Z0-9_",
          };
        }

        if (e === "W") {
          return {
            type: "class",
            content: "^a-zA-Z0-9_",
          };
        }

        if (e === "s") {
          return {
            type: "class",
            content: " \\t\\n\\r\\f\\v",
          };
        }

        if (e === "S") {
          return {
            type: "class",
            content: "^ \\t\\n\\r\\f\\v",
          };
        }

        if ("bBAZz".includes(e)) {
          return { type: "empty" };
        }

        if (e === "x" || e === "u") {
          const size = e === "x" ? 2 : 4;
          const hex = source.slice(pos, pos + size);

          if (!new RegExp("^[0-9a-f]{" + size + "}$", "i").test(hex)) {
            throw new Error("Invalid hex escape");
          }

          pos += size;

          return {
            type: "literal",
            value: String.fromCharCode(parseInt(hex, 16)),
          };
        }

        return { type: "literal", value: e };
      }

      if (c === "[") {
        let content = "";
        let escaped = false;
        let closed = false;

        while (pos < source.length) {
          const x = consume();

          if (x === "]" && !escaped) {
            closed = true;
            break;
          }

          content += x;

          if (x === "\\" && !escaped) {
            escaped = true;
          } else {
            escaped = false;
          }
        }

        if (!closed) {
          throw new Error("Unclosed character class");
        }

        return { type: "class", content };
      }

      if (c === "(") {
        const info = groupInfo(source, pos - 1);

        pos = info.bodyStart;

        const node = parseExpression();

        if (consume() !== ")") {
          throw new Error("Unclosed group");
        }

        return info.kind === "group" ? node : { type: info.kind, node };
      }

      return { type: "literal", value: c };
    }

    function generate(node, attempt) {
      switch (node.type) {
        case "empty":
        case "positive":
        case "negative":
        case "lookbehind":
        case "negativeLookbehind":
          return "";

        case "literal":
          return node.value;

        case "class": {
          const re = new RegExp("^(?:[" + node.content + "])$", flags);

          const candidates =
            "aAzZ019_ -!@#$%^&*()[]{} \t\n\r" +
            "abcdefghijklmnopqrstuvwxyz" +
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

          for (const ch of candidates) {
            if (re.test(ch)) return ch;
          }

          throw new Error(
            "No candidate for character class [" + node.content + "]",
          );
        }

        case "seq":
          return node.nodes.map((n) => generate(n, attempt)).join("");

        case "alt":
          return generate(
            node.alternatives[attempt % node.alternatives.length],
            attempt,
          );

        case "repeat": {
          const count = node.min + (attempt % (node.max - node.min + 1));

          return Array.from({ length: count }, () =>
            generate(node.node, attempt),
          ).join("");
        }

        default:
          throw new Error("Unknown AST node: " + node.type);
      }
    }

    pos = 0;

    const ast = parseExpression();

    if (pos !== source.length) {
      throw new Error("Unexpected regex syntax at position " + pos);
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = generate(ast, attempt);

      if (validate(candidate)) {
        return candidate;
      }
    }

    throw new Error(
      "Could not generate a matching string. " +
        "The pattern may require constraints beyond " +
        "this generator's bounded search.",
    );
  }

  function generateExam(pool, cfg, lastAttempt = {}, rnd = Math.random) {
    const dist = cfg.dist || { Easy: 5, Medium: 5, Hard: 2, Extreme: 0 };
    const selectedCourses = Array.isArray(cfg.courses)
      ? new Set(cfg.courses)
      : null;
    const base = pool.filter((e) =>
      selectedCourses
        ? selectedCourses.has(e.course)
        : !cfg.course || e.course === cfg.course,
    );
    const shortage = {},
      picked = [];
    for (const d of DIFF) {
      const need = dist[d] || 0;
      if (!need) continue;
      const have = base.filter((e) => e.difficulty === d);
      if (have.length < need) shortage[d] = { need, have: have.length };
      else
        picked.push(
          ...shuffle(have, rnd)
            .sort(
              (a, b) =>
                (lastAttempt[exerciseKey(a)] || 0) -
                (lastAttempt[exerciseKey(b)] || 0),
            )
            .slice(0, need),
        );
    }
    if (Object.keys(shortage).length) return { ok: false, shortage };
    return { ok: true, exercises: picked };
  }

  function validatePackage(pkg, file, ctx) {
    // ctx: { seenIds:Set, datasetIds:Set, schemaVersion }
    const errs = [],
      E = (id, field, msg) =>
        errs.push({ file, id: id || "(package)", field, msg });
    if (!pkg || typeof pkg !== "object") {
      E(null, "$", "Not a JSON object");
      return errs;
    }
    if (!compatibleSchemaVersion(pkg.schemaVersion, ctx.schemaVersion))
      E(
        null,
        "schemaVersion",
        `Incompatible schema version ${pkg.schemaVersion}; supported: ${ctx.schemaVersion}`,
      );
    for (const f of ["packageId", "version"])
      if (!pkg[f]) E(null, f, "Missing required field");
    const isMap = (v) => v && typeof v === "object" && !Array.isArray(v);
    for (const f of ["datasets", "exercises"])
      if (pkg[f] !== undefined && !isMap(pkg[f]))
        E(null, f, `Must be an object keyed by ${f.slice(0, -1)} ID`);
    const datasets = isMap(pkg.datasets) ? pkg.datasets : {},
      exercises = isMap(pkg.exercises) ? pkg.exercises : {};
    const dsIds = new Set(ctx.datasetIds);
    for (const [id, d] of Object.entries(datasets)) {
      if (!isMap(d) || !d.version || !d.sql)
        E(id, "datasets", "Dataset needs version and sql");
      else if (d.id !== undefined && d.id !== id)
        E(id, "id", `Dataset id "${d.id}" does not match its key`);
      else if (dsIds.has(id)) E(id, "id", "Duplicate dataset ID");
      else dsIds.add(id);
    }
    const req = [
      "category",
      "title",
      "instructions",
      "difficulty",
      "type",
      "contentVersion",
    ];
    for (const [id, value] of Object.entries(exercises)) {
      if (!isMap(value)) {
        E(id, "$", "Exercise must be an object");
        continue;
      }
      if (value.id !== undefined && value.id !== id)
        E(id, "id", `Exercise id "${value.id}" does not match its key`);
      const ex = { ...value, id };
      req.forEach((f) => {
        if (ex[f] === undefined || ex[f] === "")
          E(id, f, "Missing required field");
      });
      const key = exerciseKey(ex, pkg.packageId);
      if (ctx.seenIds.has(key))
        E(id, "id", "Duplicate exercise ID within this package");
      ctx.seenIds.add(key);
      if (ex.difficulty && !DIFF.includes(ex.difficulty))
        E(id, "difficulty", `Must be one of ${DIFF.join(", ")}`);
      if (typeof pkg.course !== "string" || !pkg.course.trim())
        E(id, "course", "Must be a non-empty course name");
      if (ex.type === "sql-query") {
        if (!ex.datasetId) E(id, "datasetId", "Missing datasetId");
        else if (!dsIds.has(ex.datasetId))
          E(id, "datasetId", `Unknown dataset "${ex.datasetId}"`);
        if (!ex.referenceSolution)
          E(id, "referenceSolution", "Missing reference solution");
        ["orderMatters", "compareColumnNames", "columnOrderMatters"].forEach(
          (f) => {
            if (typeof ex[f] !== "boolean") E(id, f, "Must be true or false");
          },
        );
      } else {
        if (!NON_SQL_TYPES.includes(ex.type))
          E(
            id,
            "type",
            `${String(ex.course || "Course")} type must be one of ${NON_SQL_TYPES.join(", ")}`,
          );
        [
          "datasetId",
          "referenceSolution",
          "orderMatters",
          "compareColumnNames",
          "columnOrderMatters",
          "numericTolerance",
          "allowedStatementKinds",
        ].forEach((f) => {
          if (ex[f] !== undefined)
            E(id, f, "SQL-query-only field on a non-query exercise");
        });
        if (
          ex.hints !== undefined &&
          !(
            typeof ex.hints === "string" ||
            (Array.isArray(ex.hints) &&
              ex.hints.every((hint) => typeof hint === "string"))
          )
        )
          E(id, "hints", "Must be a string or an array of strings");
        if (ex.type === "terminal") {
          const config = ex.terminal;
          if (!config || typeof config !== "object" || Array.isArray(config)) {
            E(
              id,
              "terminal",
              "Terminal exercises need a terminal configuration object",
            );
          } else {
            const supportedChecks = new Set([
              "exists",
              "not_exists",
              "file",
              "directory",
              "content",
              "contains",
              "permissions",
              "owner",
              "group",
              "symlink",
              "size",
              "empty",
              "executable",
              "file_type",
              "line_count",
              "directory_contents",
            ]);
            if (!Array.isArray(config.checks) || config.checks.length === 0) {
              E(
                id,
                "terminal.checks",
                "Need at least one filesystem grading check",
              );
            } else {
              config.checks.forEach((check, index) => {
                const field = `terminal.checks[${index}]`;
                if (
                  !check ||
                  typeof check !== "object" ||
                  Array.isArray(check)
                ) {
                  E(id, field, "Must be an object");
                  return;
                }
                if (!supportedChecks.has(check.type))
                  E(
                    id,
                    `${field}.type`,
                    `Unsupported check type: ${check.type}`,
                  );
                if (typeof check.path !== "string" || !check.path.trim())
                  E(id, `${field}.path`, "Must be a non-empty path");
                if (
                  [
                    "content",
                    "contains",
                    "permissions",
                    "owner",
                    "group",
                    "symlink",
                    "size",
                    "file_type",
                    "line_count",
                    "directory_contents",
                  ].includes(check.type) &&
                  check.expected === undefined
                )
                  E(id, `${field}.expected`, "Required for this check type");
                if (
                  check.points !== undefined &&
                  (!Number.isFinite(check.points) || check.points < 0)
                )
                  E(id, `${field}.points`, "Must be a non-negative number");
              });
            }
            if (Object.prototype.hasOwnProperty.call(config, "hints"))
              E(
                id,
                "terminal.hints",
                "Move hints to the exercise's top-level 'hints' field",
              );
            if (
              config.initialFilesystem !== undefined &&
              !Array.isArray(config.initialFilesystem)
            )
              E(id, "terminal.initialFilesystem", "Must be an array");
            if (
              config.preSetupCommands !== undefined &&
              (!Array.isArray(config.preSetupCommands) ||
                config.preSetupCommands.length > 100 ||
                config.preSetupCommands.some(
                  (command) =>
                    typeof command !== "string" ||
                    !command.trim() ||
                    command.length > 8192,
                ))
            )
              E(
                id,
                "terminal.preSetupCommands",
                "Must be an array of at most 100 non-empty command strings (maximum 8192 characters each)",
              );
            if (
              config.initialDirectory !== undefined &&
              (typeof config.initialDirectory !== "string" ||
                !config.initialDirectory.startsWith("/"))
            )
              E(id, "terminal.initialDirectory", "Must be an absolute path");
            if (
              config.profile !== undefined &&
              !["basic-linux", "basic", "intro-linux"].includes(config.profile)
            )
              E(
                id,
                "terminal.profile",
                `Unsupported profile: ${config.profile}`,
              );
          }
        } else if (ex.type === "java-ex") {
          const config = ex.java;
          if (!isMap(config)) {
            E(id, "java", "Java exercises need a java configuration object");
          } else {
            if (
              typeof config.sourceFile !== "string" ||
              !config.sourceFile.trim() ||
              !config.sourceFile.endsWith(".java")
            )
              E(id, "java.sourceFile", "Must be a non-empty .java file name");
            if (typeof config.preCode !== "string")
              E(id, "java.preCode", "Must be a starter-code string");
            if (
              config.solution !== undefined &&
              typeof config.solution !== "string"
            )
              E(
                id,
                "java.solution",
                "Must be a Java source-code string when supplied",
              );
            if (
              config.mainClass !== undefined &&
              (typeof config.mainClass !== "string" || !config.mainClass.trim())
            )
              E(
                id,
                "java.mainClass",
                "Must be a non-empty class name when supplied",
              );
            if (config.stdin !== undefined && typeof config.stdin !== "string")
              E(id, "java.stdin", "Must be a string");
            if (
              config.explanation !== undefined &&
              typeof config.explanation !== "string"
            )
              E(id, "java.explanation", "Must be a string");
            if (
              config.timeoutMs !== undefined &&
              (!Number.isInteger(config.timeoutMs) ||
                config.timeoutMs < 1000 ||
                config.timeoutMs > 30000)
            )
              E(
                id,
                "java.timeoutMs",
                "Must be an integer between 1000 and 30000 milliseconds",
              );
            if (
              config.additionalSources !== undefined &&
              !(
                isMap(config.additionalSources) ||
                (Array.isArray(config.additionalSources) &&
                  config.additionalSources.every(
                    (item) =>
                      isMap(item) &&
                      typeof item.name === "string" &&
                      typeof item.code === "string",
                  ))
              )
            )
              E(
                id,
                "java.additionalSources",
                "Must be a filename-to-source object or an array of { name, code } objects",
              );
            if (!Array.isArray(config.checks)) {
              E(id, "java.checks", "Must be an array of automatic checks");
            } else {
              config.checks.forEach((check, index) => {
                const field = `java.checks[${index}]`;
                if (!isMap(check)) {
                  E(id, field, "Must be an object");
                  return;
                }
                if (!JAVA_CHECK_TYPES.has(check.type))
                  E(
                    id,
                    `${field}.type`,
                    `Unsupported Java check type: ${check.type}`,
                  );
                if (
                  check.id !== undefined &&
                  (typeof check.id !== "string" || !check.id.trim())
                )
                  E(id, `${field}.id`, "Must be a non-empty string");
                if (
                  check.description !== undefined &&
                  typeof check.description !== "string"
                )
                  E(id, `${field}.description`, "Must be a string");
                if (
                  check.points !== undefined &&
                  (!Number.isFinite(check.points) || check.points < 0)
                )
                  E(id, `${field}.points`, "Must be a non-negative number");
                if (
                  [
                    "stdout",
                    "stderr",
                    "methodReturn",
                    "fieldValue",
                    "fieldModifier",
                    "methodModifier",
                    "classModifier",
                  ].includes(check.type) &&
                  check.expected === undefined
                )
                  E(id, `${field}.expected`, "Required for this check type");
                if (
                  check.type === "inheritance" &&
                  check.superclass === undefined &&
                  check.expected === undefined &&
                  !(Array.isArray(check.interfaces) && check.interfaces.length)
                )
                  E(
                    id,
                    field,
                    "Specify a superclass and/or at least one implemented interface",
                  );
                if (
                  check.type === "instanceOf" &&
                  (typeof (check.expectedType ?? check.expected) !== "string" ||
                    !(check.expectedType ?? check.expected).trim())
                )
                  E(
                    id,
                    `${field}.expectedType`,
                    "Must specify the expected class or interface name",
                  );
                if (
                  ["fieldExists", "fieldModifier", "fieldValue"].includes(
                    check.type,
                  ) &&
                  (typeof check.fieldName !== "string" ||
                    !check.fieldName.trim())
                )
                  E(id, `${field}.fieldName`, "Must be a non-empty field name");
                if (
                  ["methodExists", "methodModifier", "methodReturn"].includes(
                    check.type,
                  ) &&
                  (typeof check.method !== "string" || !check.method.trim())
                )
                  E(id, `${field}.method`, "Must be a non-empty method name");
                if (
                  [
                    "classExists",
                    "fieldExists",
                    "fieldModifier",
                    "fieldValue",
                    "methodExists",
                    "methodModifier",
                    "methodReturn",
                    "constructorExists",
                    "classModifier",
                    "inheritance",
                    "instanceOf",
                  ].includes(check.type) &&
                  (typeof check.className !== "string" ||
                    !check.className.trim())
                )
                  E(id, `${field}.className`, "Must be a non-empty class name");
                if (
                  check.parameterTypes !== undefined &&
                  (!Array.isArray(check.parameterTypes) ||
                    check.parameterTypes.some(
                      (item) => typeof item !== "string" || !item.trim(),
                    ))
                )
                  E(
                    id,
                    `${field}.parameterTypes`,
                    "Must be an array of Java type names",
                  );
                if (check.args !== undefined && !Array.isArray(check.args))
                  E(id, `${field}.args`, "Must be an array");
                if (
                  check.matcher !== undefined &&
                  !["exact", "regex", "contains"].includes(check.matcher)
                )
                  E(id, `${field}.matcher`, "Must be exact, regex or contains");
                if (
                  check.flags !== undefined &&
                  !(
                    typeof check.flags === "string" ||
                    (Array.isArray(check.flags) &&
                      check.flags.every((flag) => typeof flag === "string"))
                  )
                )
                  E(
                    id,
                    `${field}.flags`,
                    "Must be a string or array of regex flags",
                  );
                if (
                  check.fullMatch !== undefined &&
                  typeof check.fullMatch !== "boolean"
                )
                  E(id, `${field}.fullMatch`, "Must be true or false");
                if (
                  check.input !== undefined &&
                  typeof check.input !== "string"
                )
                  E(id, `${field}.input`, "Must be a string");
              });
            }
          }
          [
            "terminal",
            "expected",
            "options",
            "referenceSolution",
            "datasetId",
          ].forEach((f) => {
            if (ex[f] !== undefined)
              E(
                id,
                f,
                `Not used by java-ex exercises; use the dedicated 'java' configuration`,
              );
          });
        } else {
          if (ex.java !== undefined)
            E(
              id,
              "java",
              "Java configuration is only valid for java-ex exercises",
            );
          const x = ex.expected;
          if (x === undefined) E(id, "expected", "Missing expected");
          else if (MCQ_TYPES.includes(ex.type)) {
            if (!Array.isArray(ex.options) || ex.options.length < 2)
              E(id, "options", "Need at least 2 options");
            else if (
              !Array.isArray(x) ||
              !x.length ||
              x.some(
                (i) => !Number.isInteger(i) || i < 0 || i >= ex.options.length,
              )
            )
              E(id, "expected", "Must be array of valid option indexes");
            else if (ex.type === "mcq-single" && x.length !== 1)
              E(id, "expected", "mcq-single needs exactly one index");
          } else if (
            ex.type === "command-text" &&
            !(
              (x.accepted && x.accepted.length) ||
              (x.patterns && x.patterns.length)
            )
          )
            E(id, "expected", "Need accepted[] and/or patterns[]");
          else if (
            ex.type === "fill-blank" &&
            !(Array.isArray(x.blanks) && x.blanks.length)
          )
            E(id, "expected", "Need blanks: [[accepted,...],...]");
          else if (
            ex.type === "short-answer-self-check" &&
            typeof x !== "string"
          )
            E(id, "expected", "Must be a model-answer string");
        }
      }
    }
    return errs;
  }

  const norm = (s) => String(s).trim().replace(/\s+/g, " ");
  function similarAnswer(a, b) {
    const left = norm(a).toLowerCase(),
      right = norm(b).toLowerCase();
    if (Math.max(left.length, right.length) < 4) return false;
    let prev = Array.from({ length: right.length + 1 }, (_, i) => i);
    for (let i = 1; i <= left.length; i++) {
      const curr = [i];
      for (let j = 1; j <= right.length; j++)
        curr[j] = Math.min(
          curr[j - 1] + 1,
          prev[j] + 1,
          prev[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
        );
      prev = curr;
    }
    return 1 - prev[right.length] / Math.max(left.length, right.length) >= 0.8;
  }
  function hasSimilarOSAnswer(ex, answer) {
    if (ex.type === "command-text")
      return (
        true ||
        (typeof answer === "string" &&
          (ex.expected.accepted || []).some((expected) =>
            similarAnswer(answer, expected),
          ))
      );
    if (ex.type === "fill-blank" && Array.isArray(answer))
      return ex.expected.blanks.some(
        (accepted, i) =>
          typeof answer[i] === "string" &&
          !accepted.some((expected) => norm(answer[i]) === norm(expected)) &&
          accepted.some((expected) => similarAnswer(answer[i], expected)),
      );
    return false;
  }
  function highlightJava(source) {
    const keywords = new Set(
        "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public record return short static strictfp super switch synchronized this throw throws transient try void volatile while yield var".split(
          " ",
        ),
      ),
      literals = new Set(["true", "false", "null"]),
      tokenPattern =
        /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"""[\s\S]*?"""|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@[A-Za-z_$][\w$]*|\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|record|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|yield|var|true|false|null)\b|\b(?:0[xX][\da-fA-F_]+(?:\.[\da-fA-F_]*)?(?:[pP][+-]?[\d_]+)?[fFdDlL]?|0[bB][01_]+[lL]?|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?[\d_]+)?[fFdDlL]?)\b|[A-Za-z_$][\w$]*|[{}()[\].,;]|[+\-*/%=!<>:&|^~?]+/gy;
    const escape = (text) =>
      text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let html = "";
    for (let index = 0; index < source.length; ) {
      tokenPattern.lastIndex = index;
      const match = tokenPattern.exec(source);
      if (!match) {
        html += escape(source[index++]);
        continue;
      }
      const token = match[0],
        className =
          token.startsWith("//") || token.startsWith("/*")
            ? "java-comment"
            : token.startsWith('"') ||
                token.startsWith("'") ||
                token.startsWith('"""')
              ? "java-string"
              : token.startsWith("@")
                ? "java-annotation"
                : literals.has(token)
                  ? "java-literal"
                  : keywords.has(token)
                    ? "java-keyword"
                    : /^\d/.test(token)
                      ? "java-number"
                      : /^[A-Z]/.test(token)
                        ? "java-type"
                        : /^[{}()[\].,;]$/.test(token)
                          ? "java-punctuation"
                          : /^[+\-*/%=!<>:&|^~?]+$/.test(token)
                            ? "java-operator"
                            : "";
      html += className
        ? `<span class="${className}">${escape(token)}</span>`
        : escape(token);
      index = tokenPattern.lastIndex;
    }
    return html;
  }
  // returns true / false / null (null = not auto-gradable)
  function gradeOS(ex, a) {
    const x = ex.expected;
    switch (ex.type) {
      case "mcq-single":
      case "mcq-multi":
      case "mcq-multiple": {
        const g = (a || []).slice().sort().join(),
          e = x.slice().sort().join();
        return g === e;
      }
      case "command-text": {
        if (!a || !norm(a)) return false;
        const n = norm(a);
        return (
          (x.accepted || []).some((c) => norm(c) === n) ||
          (x.patterns || []).some((p) => new RegExp(p).test(n))
        );
      }
      case "fill-blank":
        return x.blanks.every(
          (acc, i) =>
            a && a[i] !== undefined && acc.some((c) => norm(c) === norm(a[i])),
        );
      default:
        return null;
    }
  }
  function initcap(str) {
    return str
      .replaceAll("_", " ")
      .replace(/(^|\s)\S/g, (char) => char.toUpperCase());
  }

  const api = {
    compare,
    generateFromRegex,
    generateExam,
    validatePackage,
    gradeOS,
    compatibleSchemaVersion,
    hasSimilarOSAnswer,
    highlightJava,
    exerciseKey,
    cellKey,
    initcap,
    normNum,
    shuffle,
    DIFF,
    SQL_TYPES,
    MCQ_TYPES,
    OS_TYPES,
    JAVA_TYPES,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.Core = api;
})(typeof window !== "undefined" ? window : globalThis);
