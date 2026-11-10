"use strict";

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
// Use the same sanitizer and syntax highlighter as the Summaries/Canvas pages
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
  ex.type === "java-ex"
    ? `Your edited Java source is checked against ${Array.isArray(ex.checks) ? ex.checks.length : 0} automatic tests.`
    : ex.type === "sql-query"
      ? formatSQL(ex.solution)
      : ex.type.startsWith("mcq")
        ? ex.checks.map((i) => ex.options[i]).join("; ")
        : ex.type === "command-text"
          ? (ex.checks || [])
              .filter((check) => check.regex !== true)
              .map((check) => check.expected)
              .join("\n")
          : ex.type === "fill-blank"
            ? ex.checks.blanks.map((b) => b[0]).join(", ")
            : ex.checks;
const answerText = (ex, answer) => {
  if (ex.type.startsWith("mcq")) {
    if (!Array.isArray(answer)) return "(no answer)";
    const choices = answer
      .filter((i) => Number.isInteger(i) && i >= 0 && i < ex.options.length)
      .map((i) => ex.options[i]);
    return choices.length ? choices.join("\n") : "(no answer)";
  }
  if (ex.type === "fill-blank" && Array.isArray(answer))
    return answer
      .map((value, index) => `${index + 1}. ${value || "(empty)"}`)
      .join("\n");
  return typeof answer === "string"
    ? answer || "(empty)"
    : JSON.stringify(answer ?? "(no answer)");
};
function schemaView(ex, options = {}) {
  const content = h(
    "div",
    { class: "schema-content" },
    loadingSkeleton(
      "Loading the relationship diagram\u2026",
      "Open to build the sample database",
    ),
  );
  const box = h(
    "details",
    { class: "schema schema-workspace", open: true },
    h(
      "summary",
      {},
      ex.datasetTitle ? `${ex.datasetTitle} \u00B7 schema` : "Dataset schema",
    ),
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
        "Creating the sample database\u2026",
        dbIsWarm(ex) ? "" : "The first time takes a few seconds",
      ),
    );
    let columns, keys;
    try {
      const withDatabase = options.preserveDatabase
        ? withPersistentDb
        : withFreshDb;
      [columns, keys] = await withDatabase(
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
        `${aliases.get(rel.from)} }o--|| ${aliases.get(rel.to)} : ${umlText(rel.column)}\\n\u2192 ${umlText(rel.targetColumn)}`,
      );
    uml.push("@enduml");
    const diagramViewer = h("div", {
      class: "plantuml-preview",
      "aria-label":
        "PlantUML diagram. On desktop, scroll to zoom and drag to pan.",
    });
    const diagramImage = h("img", {
      alt: `PlantUML entity relationship diagram for ${ex.datasetTitle || ex.datasetId}`,
      draggable: "false",
    });
    // Hidden (but still loading) until the image arrives; a skeleton fills the
    // space meanwhile. The PlantUML server can be slow, so say so after a while.
    diagramImage.style.display = "none";
    const diagramPlaceholder = loadingSkeleton(
      "Rendering the PlantUML diagram\u2026",
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
                    " \u2192 ",
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

// Exercise modules receive these app-owned containers directly:
// - workspace container: the main/left pane
// - actions container: the shared action button group
// - feedback container: grading feedback below the action group
// Modules must not create their own navigation or split-layout wrappers.

// Question view. Practice and exam share the same panels, split layout, and
// exercise-action-buttons container; only mode-specific actions differ.
function qView(
  ex,
  mode,
  get,
  set,
  onAttempt = () => {},
  onNextExercise = null,
  hasNextExercise = () => true,
  attemptId = mode === "exam" ? "exam" : "practice",
  extraActionControls = [],
  onPracticeResult = null,
) {
  let q = h("div", { class: "q" });
  const out = h("div"),
    fb = h("div");
  // Split exercises can have an independently scrolling workspace/instructions
  // pane. Scroll the result inside its own pane and the learning navigator in its
  // own scroll container in the same frame. On mobile, keep the navigator in view
  // and deliberately do not jump down to the result.
  const findScrollContainer = (element) => {
    let scroller = element?.parentElement;
    while (
      scroller &&
      scroller !== document.body &&
      scroller !== document.documentElement
    ) {
      const overflowY = getComputedStyle(scroller).overflowY;
      if (
        scroller.scrollHeight > scroller.clientHeight + 1 &&
        ["auto", "scroll", "overlay", "hidden"].includes(overflowY)
      )
        return scroller;
      scroller = scroller.parentElement;
    }
    return window;
  };
  const findLearningPathNavigator = () => {
    const splitLayout = q.closest?.(".exercise-split-layout");
    if (splitLayout)
      return splitLayout.querySelector(".learning-path-navigator");
    return (
      q.querySelector?.(".learning-path-navigator") ||
      q.parentElement?.querySelector?.(".learning-path-navigator") ||
      null
    );
  };
  const scrollWithinContainer = (element, scroller, block, behavior) => {
    if (!element?.isConnected) return;
    const rect = element.getBoundingClientRect();
    if (scroller === window) {
      const header = document.querySelector("header");
      const pinned =
        header &&
        ["sticky", "fixed"].includes(getComputedStyle(header).position);
      const offset = pinned ? header.getBoundingClientRect().height : 0;
      let top = rect.top + window.scrollY - offset - 12;
      if (block === "center")
        top =
          rect.top +
          window.scrollY -
          offset -
          Math.max(0, (window.innerHeight - rect.height) / 2);
      else if (block === "nearest") {
        if (rect.top >= offset + 8 && rect.bottom <= window.innerHeight - 8)
          return;
        if (rect.top < offset + 8)
          top = rect.top + window.scrollY - offset - 8;
        else top = rect.bottom + window.scrollY - window.innerHeight + 8;
      }
      window.scrollTo({ top: Math.max(0, top), behavior });
      return;
    }

    const containerRect = scroller.getBoundingClientRect();
    const viewportTop = containerRect.top + scroller.clientTop;
    const viewportBottom = viewportTop + scroller.clientHeight;
    let top = scroller.scrollTop;
    if (block === "center") {
      top += rect.top - viewportTop - (scroller.clientHeight - rect.height) / 2;
    } else if (block === "nearest") {
      if (rect.top >= viewportTop + 8 && rect.bottom <= viewportBottom - 8)
        return;
      if (rect.top < viewportTop + 8)
        top += rect.top - viewportTop - 8;
      else top += rect.bottom - viewportBottom + 8;
    } else {
      top += rect.top - viewportTop - 12;
    }
    scroller.scrollTo({
      top: Math.max(0, Math.min(scroller.scrollHeight - scroller.clientHeight, top)),
      behavior,
    });
  };
  const scrollToExerciseTarget = (target, block = "nearest") =>
    requestAnimationFrame(() => {
      if (!target?.isConnected) return;
      const navigator = findLearningPathNavigator();
      const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
      const mobile = matchMedia("(max-width: 760px)").matches;
      const resultScroller = findScrollContainer(target);
      const navigatorScroller = navigator?.isConnected
        ? findScrollContainer(navigator)
        : null;

      if (navigator?.isConnected && mobile) {
        scrollWithinContainer(navigator, navigatorScroller, "start", behavior);
        return;
      }

      scrollWithinContainer(target, resultScroller, block, behavior);
      // When the result and navigator share a scroll owner, only one can be
      // aligned at a time. Split desktop exercises have separate owners, so
      // both scroll operations are issued together without fighting each other.
      if (navigator?.isConnected && navigatorScroller !== resultScroller)
        scrollWithinContainer(navigator, navigatorScroller, "start", behavior);
    });
  const scrollToOutput = () => scrollToExerciseTarget(out, "nearest");
  const scrollToFeedback = (correct = false) => {
    // Keep the old no-path behavior: incorrect answers reveal their feedback,
    // while a correct answer does not force a result scroll. With a path active,
    // desktop reveals both panes and mobile moves only to the path navigator.
    const navigator = findLearningPathNavigator();
    if (correct && !navigator) return;
    scrollToExerciseTarget(
      fb,
      fb.getBoundingClientRect().height > innerHeight * 0.7 ? "start" : "center",
    );
  };
  let schemaPanel,
    runId = 0,
    gradingId = 0;
  const updateAnswer = (value, meta = { source: "user" }) => {
    const saved = set(value, meta);
    return Promise.resolve(saved).catch((e) => {
      console.error("Could not save answer draft:", e);
    });
  };
  const instructions = h("div", { class: "stmt" });
  renderExerciseInstructions(instructions, ex.instructions);
  const exerciseHeading = h("h3", {}, ex.title);
  const exerciseMeta = h(
    "div",
    { class: "meta" },
    [courseLabel(ex.course), ex.packageId, ex.category, ex.difficulty]
      .filter(Boolean)
      .join(" \u00B7 "),
  );
  let instructionPanel = null;
  if (EXERCISE_LAYOUTS[ex.type]?.sidePanel === "instructions") {
    instructionPanel = h(
      "section",
      {
        class: "q exercise-instruction-panel",
        "aria-label": "Exercise instructions and actions",
      },
      exerciseHeading,
      exerciseMeta,
      instructions,
    );
    q = h("section", {
      class: "q exercise-workspace-panel",
      "aria-label":
        EXERCISE_LAYOUTS[ex.type]?.workspaceLabel || "Exercise workspace",
    });
  } else {
    q.append(exerciseHeading, exerciseMeta, instructions);
  }
  const btns = h("div", {
    class: "exercise-action-buttons",
    role: "group",
    "aria-label": "Exercise actions",
  });
  const supplementalPanels = [];
  const suppliedActions = Array.isArray(extraActionControls)
    ? extraActionControls
    : extraActionControls
      ? [extraActionControls]
      : [];
  btns.append(...suppliedActions.filter(Boolean));
  let readAns, resetFn, submitButton, nextExerciseButton, focusTarget;
  let nextExerciseHandler = onNextExercise;
  let nextExerciseAvailability = hasNextExercise;

  // Every exercise type uses the same completion-gated Next action.
  let exerciseCorrect = Boolean(
    S.xpRewards?.[keyOf(ex)] || S.xpRewards?.[ex.id],
  );

  const updateNextExercise = () => {
    if (!nextExerciseButton) return;
    const canContinue = exerciseCorrect && nextExerciseAvailability();
    nextExerciseButton.hidden = !canContinue;
    nextExerciseButton.disabled = !canContinue;
  };
  const markExerciseCorrect = () => {
    exerciseCorrect = true;
    updateNextExercise();
  };
  const recordPracticeResult = async (correct, meta = {}) => {
    if (mode !== "practice") return;
    if (typeof onPracticeResult !== "function") {
      console.error(
        "Practice view is missing its app-practice result handler.",
      );
      return;
    }
    await onPracticeResult(correct, meta);
    if (correct === true) markExerciseCorrect();
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
                ? "Running\u2026"
                : "Setting up the database (first run takes a few seconds)\u2026",
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
                  ? "Grading\u2026"
                  : "Setting up the database and grading\u2026",
              ),
            );
            const g = await gradeSql(ex, ta.value);
            if (currentGrading !== gradingId || !q.isConnected) return;
            // Show the result table of the submitted query, like Run does.
            out.replaceChildren(g.res ? table(g.res) : "");
            if (currentGrading !== gradingId || !q.isConnected) return;
            fb.replaceChildren(
              g.error
                ? h("pre", { class: "err" }, g.error)
                : h(
                    "p",
                    { class: g.correct ? "ok" : "bad" },
                    g.correct ? "\u2714 Correct" : "\u2718 Incorrect",
                    h(
                      "small",
                      {},
                      `  (setup ${g.setupMs} ms, total ${g.totalMs} ms)`,
                    ),
                  ),
              g.cmp ? diffView(g.cmp) : "",
              g.correct && ex.explanation
                ? h("p", {}, h("b", {}, "Explanation: "), ex.explanation)
                : "",
            );
            if (g.correct !== null)
              await recordPracticeResult(g.correct, {
                error: Boolean(g.error),
                blank: !ta.value.trim(),
              });
            if (currentGrading !== gradingId || !q.isConnected) return;
            scrollToFeedback(g.correct === true);
            focusNextExercise();
          },
        },
        "Submit (Ctrl + Shift + Enter)",
      );
      btns.append(submitButton);
    }
  } else if (EXERCISE_LAYOUTS[ex.type]?.module === "java") {
    const javaHost = h("div", { class: "exercise-module-host" });
    javaHost.append(loadingNote("Loading the Java playground\u2026"));
    instructionPanel.append(javaHost);
    let javaController = null;
    let javaDisposed = false;
    let javaMountPromise = null;
    let javaMountGeneration = 1;
    const savedCode = get();
    const initialCode =
      savedCode === undefined || savedCode === null
        ? String(ex.java?.preCode ?? "")
        : String(savedCode);
    // Persist the visible starter text too, so a saved exam always contains
    // the exact source that will be graded even when the student never edits it.
    updateAnswer(initialCode, { source: "initial" });
    readAns = () => javaController?.getSource?.() ?? initialCode;
    resetFn = () => javaController?.reset?.();
    q.disposeExercise = () => {
      javaDisposed = true;
      javaMountGeneration++;
      const controller = javaController;
      javaController = null;
      if (controller) return controller.dispose?.();
      return javaMountPromise?.then((mounted) => mounted?.dispose?.());
    };
    const generation = javaMountGeneration;
    javaMountPromise = loadJavaModule()
      .then(async (javaModule) => {
        if (
          javaDisposed ||
          generation !== javaMountGeneration ||
          !q.isConnected
        )
          return null;
        const controller = await javaModule.mountJavaExercise({
          toolsContainer: javaHost,
          workspaceContainer: q,
          actionsContainer: btns,
          exercise: ex,
          initialCode,
          mode,
          onChange: (code) => updateAnswer(code),
          onGrade: async (result) => {
            if (mode !== "practice" || javaDisposed || !q.isConnected) return;
            const passed = result?.success === true;
            const score = result?.score || {};
            await recordPracticeResult(passed, {
              java: true,
              partialScore: score.earned ?? 0,
              maxScore: score.total ?? 0,
              error:
                result?.status === "compile-error" ||
                result?.status === "runtime-error",
              blank: !readAns().trim(),
            });
          },
        });
        if (
          javaDisposed ||
          generation !== javaMountGeneration ||
          !q.isConnected
        ) {
          controller?.dispose?.();
          return null;
        }
        javaController = controller;
        return controller;
      })
      .catch((error) => {
        if (!javaDisposed && q.isConnected) {
          javaHost.replaceChildren(
            h(
              "div",
              { class: "err", role: "alert" },
              `The Java playground could not be loaded: ${error?.message || String(error)}. Other exercise types are unaffected.`,
            ),
          );
        }
        return null;
      });
  } else if (EXERCISE_LAYOUTS[ex.type]?.module === "terminal") {
    const terminalHost = h("div", { class: "exercise-module-host" });
    terminalHost.append(loadingNote("Loading browser terminal\u2026"));
    q.append(terminalHost);
    let terminalController = null;
    let terminalDisposed = false;
    let mountGeneration = 1;
    let terminalMountPromise = null;
    readAns = () => "terminal-workspace";
    resetFn = () => terminalController?.reset?.();
    q.disposeExercise = () => {
      terminalDisposed = true;
      mountGeneration++;
      const controller = terminalController;
      terminalController = null;
      if (controller) return controller.dispose?.();
      return terminalMountPromise;
    };
    const generation = mountGeneration;
    terminalMountPromise = loadTerminalModule()
      .then(async (terminalModule) => {
        if (
          terminalDisposed ||
          generation !== mountGeneration ||
          !q.isConnected
        )
          return;
        const controller = await terminalModule.mountTerminalExercise({
          workspaceContainer: terminalHost,
          exercise: ex,
          packageId: ex.packageId,
          exerciseId: ex.id,
          attemptId,
          mode,
          actionsContainer: btns,
          feedbackContainer: fb,
          onChange: async () => {
            // The terminal module owns its detailed .ot-grade panel. Remove
            // app-owned feedback (including any previous workspace summary)
            // whenever the workspace changes or is reset.
            [...fb.children]
              .filter((child) => !child.classList.contains("ot-grade"))
              .forEach((child) => child.remove());
            await updateAnswer("terminal-workspace");
          },
          onGrade: async (result) => {
            if (mode !== "practice" || terminalDisposed || !q.isConnected)
              return;
            // A new check replaces the previous summary instead of stacking.
            fb.querySelectorAll(".terminal-grade-summary").forEach((node) =>
              node.remove(),
            );
            fb.append(
              h(
                "p",
                {
                  class: `terminal-grade-summary ${result.passed ? "ok" : "bad"}`,
                },
                `Workspace score: ${result.score} / ${result.maxScore}${result.passed ? " \u00B7 All checks passed" : " \u00B7 Review the failed checks above"}`,
              ),
            );
            await recordPracticeResult(result.passed, {
              terminal: true,
              partialScore: result.score,
              maxScore: result.maxScore,
              blank: false,
            });
            scrollToFeedback(result.passed === true);
            if (result.passed) focusNextExercise();
          },
        });
        if (
          terminalDisposed ||
          generation !== mountGeneration ||
          !q.isConnected
        ) {
          await controller?.dispose?.();
          return;
        }
        terminalController = controller;
        updateNextExercise();
        await updateAnswer("terminal-workspace", { source: "workspace-open" });
      })
      .catch((error) => {
        if (
          terminalDisposed ||
          generation !== mountGeneration ||
          !q.isConnected
        )
          return;
        terminalHost.replaceChildren(
          h(
            "div",
            { class: "err", role: "alert" },
            `The terminal feature could not be loaded: ${error?.message || String(error)}. Other exercises are unaffected.`,
          ),
        );
      });
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
      const n = ex.checks.blanks.length;
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
            const g = gradeExerciseAnswer(ex, readAns());
            if (g === null) {
              fb.replaceChildren(
                h("p", {}, h("b", {}, "Model answer:")),
                h("pre", {}, expectedText(ex)),
                h(
                  "div",
                  {},
                  "Compare with yours, then mark: ",
                  h(
                    "button",
                    {
                      onclick: async () => {
                        fb.append(h("p", { class: "ok" }, "Saved as correct"));
                        await recordPracticeResult(true);
                        scrollToFeedback(true);
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
                        fb.append(
                          h("p", { class: "bad" }, "Saved as incorrect"),
                        );
                        await recordPracticeResult(false);
                        scrollToFeedback();
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
            fb.replaceChildren(
              h(
                "p",
                { class: g ? "ok" : "bad" },
                g ? "\u2714 Correct" : "\u2718 Incorrect",
              ),
              !g && hasSimilarExerciseAnswer(ex, readAns())
                ? h(
                    "small",
                    { class: "answer-review-note" },
                    "Your answer may be right, but the system can't tell for sure because it only checks against listed answers and certain patterns.",
                  )
                : "",
              g && ex.explanation
                ? h("p", {}, h("b", {}, "Explanation: "), ex.explanation)
                : "",
            );
            await recordPracticeResult(g);
            scrollToFeedback(g === true);
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
          class: "learning-path-next-exercise",
          onclick: () => {
            if (!exerciseCorrect || !nextExerciseAvailability()) return;
            nextExerciseHandler?.();
          },
          "aria-keyshortcuts": "Enter",
          hidden: true,
        },
        "Next exercise",
      );
      btns.append(nextExerciseButton);
    }
    if (ex.type !== "terminal" && ex.type !== "java-ex") {
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
    }
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
      supplementalPanels.push(hintPanel);
    }
  }
  // Result snippet: shown in practice and exam, open by default.
  if (ex.type === "sql-query" && ex.solution) {
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
            ? "Loading the first five result rows\u2026"
            : "Setting up the database and loading the first five rows\u2026",
        ),
      );
    };
    const loadResultSnippet = async () => {
      if (snippet.dataset.loaded || loadingSnippet || !snippet.isConnected)
        return;
      loadingSnippet = true;
      showPreviewLoading();
      try {
        const { res } = await runStudent(ex, ex.solution);
        snippet.replaceChildren(
          h("strong", {}, "Expected result preview"),
          h("small", {}, "A preview of rows returned by the reference query."),
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
  if (mode === "practice") {
    const hasSol = ex.type === "sql-query" ? !!ex.solution : true;
    if (
      hasSol &&
      ex.type !== "short-answer-self-check" &&
      ex.type !== "terminal" &&
      ex.type !== "java-ex"
    ) {
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
      supplementalPanels.push(solution);
    }
  }
  // Java solutions share the exercise-level solution field with SQL and
  // terminal exercises; rendering remains type-specific.
  if (
    mode === "practice" &&
    ex.type === "java-ex" &&
    typeof ex.solution === "string" &&
    ex.solution.trim()
  ) {
    const solutionCode = h("code", {});
    solutionCode.innerHTML = Core.highlightJava(ex.solution);
    const solution = h(
      "div",
      { class: "solution-panel java-solution-panel", hidden: true },
      h("b", {}, "One possible solution"),
      h("div", { class: "stmt" }, h("pre", {}, solutionCode)),
      h(
        "small",
        { class: "java-solution-note" },
        "This is one possible implementation. Revealing it does not replace your code in the editor.",
      ),
    );
    const toggle = h(
      "button",
      {
        class: "sec",
        "aria-expanded": "false",
        onclick: () => {
          solution.hidden = !solution.hidden;
          if (!solution.hidden) achPeek(ex, "solution");
          toggle.textContent = solution.hidden
            ? "Show solution"
            : "Hide solution";
          toggle.setAttribute("aria-expanded", String(!solution.hidden));
        },
      },
      "Show solution",
    );
    btns.append(toggle);
    supplementalPanels.push(solution);
  }
  if (DESKTOP_SPLIT_EXERCISE_TYPES.includes(ex.type)) {
    const sidePanel =
      EXERCISE_LAYOUTS[ex.type]?.sidePanel === "instructions"
        ? instructionPanel
        : schemaPanel;
    const actionPanel = instructionPanel || q;
    actionPanel.append(btns, ...supplementalPanels);
    if (instructionPanel) {
      const moduleHost = instructionPanel.querySelector(
        ":scope > .exercise-module-host",
      );
      instructionPanel.insertBefore(btns, moduleHost);
      supplementalPanels.forEach((panel) =>
        instructionPanel.insertBefore(panel, moduleHost),
      );
      instructionPanel.append(out, fb);
    } else {
      q.append(out, fb);
    }
    const view = createExerciseSplitLayout(ex.type, q, sidePanel);
    view.refreshNextExercise = updateNextExercise;
    view.hideInlineNextExercise = () => {
      nextExerciseButton?.remove();
      nextExerciseButton = null;
    };
    view.configureNextExercise = (handler, availability) => {
      if (typeof handler === "function") nextExerciseHandler = handler;
      if (typeof availability === "function")
        nextExerciseAvailability = availability;
      updateNextExercise();
    };
    view.focusInput = () => focusTarget?.focus({ preventScroll: true });
    updateNextExercise();
    view.actionsRoot = actionPanel;
    return view;
  }
  q.append(btns, ...supplementalPanels, out, fb);
  const view = q;
  view.refreshNextExercise = updateNextExercise;
  view.hideInlineNextExercise = () => {
    nextExerciseButton?.remove();
    nextExerciseButton = null;
  };
  view.configureNextExercise = (handler, availability) => {
    if (typeof handler === "function") nextExerciseHandler = handler;
    if (typeof availability === "function")
      nextExerciseAvailability = availability;
    updateNextExercise();
  };
  view.focusInput = () => focusTarget?.focus({ preventScroll: true });
  updateNextExercise();
  // All non-split exercise actions live in the question's shared action group.
  view.actionsRoot = q;
  return view;
}

// Shared desktop split layout. The app owns its structure for Practice,
// Guided Learning, Exam, and the Java sandbox. Exercise modules only fill the
// workspace and optional action/feedback containers.
function createExerciseSplitLayout(type, mainPanel, sidePanel) {
  const config = EXERCISE_LAYOUTS[type];
  if (!config || !sidePanel) return mainPanel;

  let fraction = config.defaultFraction;
  try {
    const stored = Number(localStorage.getItem(config.storageKey));
    if (
      localStorage.getItem(config.storageKey) !== null &&
      Number.isFinite(stored) &&
      stored >= config.min &&
      stored <= config.max
    )
      fraction = stored;
  } catch {}

  const handle = h("div", {
    class: "exercise-split-handle",
    role: "separator",
    "aria-orientation": "vertical",
    "aria-label": config.label,
    tabindex: "0",
    title: "Drag to resize (double-click to reset)",
  });
  mainPanel.classList.add("exercise-split-main");
  sidePanel.classList.add("exercise-split-side");
  const layout = h(
    "div",
    { class: "exercise-split-layout", "data-exercise-type": type },
    mainPanel,
    handle,
    sidePanel,
  );
  layout.style.setProperty("--exercise-split-main-min", config.mainMin);
  layout.style.setProperty("--exercise-split-side-min", config.sideMin);
  const apply = () => {
    if (fraction == null) {
      layout.style.removeProperty("--exercise-split-side-width");
      handle.removeAttribute("aria-valuenow");
      return;
    }
    layout.style.setProperty(
      "--exercise-split-side-width",
      `${(fraction * 100).toFixed(2)}%`,
    );
    handle.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
  };
  const set = (next, save = false) => {
    fraction =
      next == null ? null : Math.min(config.max, Math.max(config.min, next));
    apply();
    if (!save) return;
    try {
      if (fraction == null) localStorage.removeItem(config.storageKey);
      else localStorage.setItem(config.storageKey, String(fraction));
    } catch {}
  };
  const currentFraction = () =>
    fraction ??
    sidePanel.getBoundingClientRect().width /
      (layout.getBoundingClientRect().width || 1);

  handle.setAttribute("aria-valuemin", String(config.min * 100));
  handle.setAttribute("aria-valuemax", String(config.max * 100));
  apply();

  let dragging = false;
  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || matchMedia("(max-width: 900px)").matches) return;
    dragging = true;
    handle.setPointerCapture(event.pointerId);
    handle.classList.add("is-dragging");
    document.body.classList.add("exercise-split-dragging");
    event.preventDefault();
  });
  handle.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const rect = layout.getBoundingClientRect();
    if (rect.width) set((rect.right - event.clientX) / rect.width);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove("is-dragging");
    document.body.classList.remove("exercise-split-dragging");
    set(fraction, true);
  };
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);
  handle.addEventListener("lostpointercapture", endDrag);
  handle.addEventListener("dblclick", () => set(config.defaultFraction, true));
  handle.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 0.1 : 0.02;
    const current = currentFraction();
    if (event.key === "ArrowLeft") set(current - step, true);
    else if (event.key === "ArrowRight") set(current + step, true);
    else if (event.key === "Home") set(config.min, true);
    else if (event.key === "End") set(config.max, true);
    else return;
    event.preventDefault();
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
  // Inline Markdown renderer. Protect code spans and links before escaping
  // or applying emphasis, so backticks inside link destinations cannot split
  // the surrounding Markdown syntax.
  const inl = (s) => {
    const protectedParts = [];
    const hold = (html) => {
      const key = `\u0000MD${protectedParts.length}\u0000`;
      protectedParts.push(html);
      return key;
    };
    let text = String(s);

    // Some generated summaries escape redundant inner emphasis markers:
    // **\*\*text\*\***. Collapse those pairs to the intended **text**.
    text = text.replace(/\*\*\\\*\\\*/g, "**").replace(/\\\*\\\*\*\*/g, "**");

    // Parse links first. Their destinations may legitimately contain backticks.
    text = text.replace(
      /\[([^\]]+)\]\(([^)\s]*(?:\s+[^)]*)?)\)/g,
      (whole, label, destination) => {
        const safeLabel = inl(label);
        const dest = destination.trim();
        if (dest.startsWith("#"))
          return hold(
            `<a href="#" data-a="${esc(dest.slice(1))}">${safeLabel}</a>`,
          );
        if (/^https?:/i.test(dest))
          return hold(
            `<a href="${esc(dest).replace(/"/g, "&quot;")}" target="_blank" rel="noopener">${safeLabel}</a>`,
          );
        return whole;
      },
    );

    // Protect inline code before escaping Markdown punctuation.
    text = text.replace(/`([^`]+)`/g, (_, code) =>
      hold("<code>" + esc(code) + "</code>"),
    );

    text = esc(text)
      .replace(/\*\*([\s\S]+?)\*\*/g, "<b>$1</b>")
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<i>$2</i>");

    return text.replace(
      /\u0000MD(\d+)\u0000/g,
      (_, index) => protectedParts[Number(index)] ?? "",
    );
  };
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
      const language =
        l.match(/^ {0,3}```\s*([^\s`]*)/)?.[1]?.toLowerCase() || "";
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
        const href = tb[1];
        const parts = href.split("/").filter(Boolean);

        const exerciseId = parts.at(-1);
        const packageId = parts.at(-2);

        // Match the exact completion key format.
        const rewardKey = JSON.stringify([packageId, exerciseId]);
        const isDone = Boolean(S.xpRewards?.[rewardKey]);
        o.push(
          `<p><a class="try-exercise-button ${isDone ? " done" : ""}" href="${esc(tb[1]).replace(/"/g, "&quot;")}">${esc(tb[2])}</a></p>`,
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
      // Headings can contain markdown links ("[Title](https://\u2026)"); the
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
