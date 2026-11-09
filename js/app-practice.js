"use strict";

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
let practiceFilterMemory = {
  search: "",
  course: "",
  category: "",
  difficulty: "",
  term: "",
  exerciseTypes: ["mcq", "interactive", "other"],
  statusMode: "uncompleted",
};

// ---------- interactive Sandbox ----------
function displayDatasetTitle(dataset, id) {
  const title = dataset?.title || dataset?.name || dataset?.label || id;
  return String(title)
    .replace(/[-_]+/g, " ")
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

const SANDBOX_JAVA_STORAGE_KEY = "sandboxJavaCode";
const SANDBOX_JAVA_STARTER = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
`;
// Minimal exercise descriptor: a runnable Main class, no automatic checks
// (so the Check button and test results stay hidden) and no instructions.
const SANDBOX_JAVA_EXERCISE = {
  checks: [],
  java: {
    sourceFile: "Main.java",
    mainClass: "Main",
    preCode: SANDBOX_JAVA_STARTER,
    stdin: "",
  },
};
function readSandboxJavaCode() {
  try {
    const saved = localStorage.getItem(SANDBOX_JAVA_STORAGE_KEY);
    if (saved !== null) return saved;
  } catch {}
  return SANDBOX_JAVA_STARTER;
}
function saveSandboxJavaCode(code) {
  try {
    localStorage.setItem(SANDBOX_JAVA_STORAGE_KEY, String(code ?? ""));
  } catch {}
}

async function pageSandbox(root) {
  const datasets = Object.entries(S.datasets || {})
    .filter(
      ([, dataset]) =>
        dataset && typeof dataset.sql === "string" && dataset.sql.trim(),
    )
    .sort((a, b) =>
      displayDatasetTitle(a[1], a[0]).localeCompare(
        displayDatasetTitle(b[1], b[0]),
      ),
    );
  const page = h("section", { class: "sandbox-page" });
  const heading = h(
    "div",
    { class: "card sandbox-heading" },
    h("h2", {}, "Sandbox"),
    h(
      "p",
      {},
      "Experiment freely with the browser Linux terminal, run SQL against any database bundled with the exercise packages, or write and run Java code. Sandbox work does not affect exercise grades.",
    ),
  );
  const modeBar = h("div", {
    class: "sandbox-mode-bar",
    role: "group",
    "aria-label": "Sandbox environment",
  });
  const content = h("div", { class: "sandbox-content" });
  const terminalMode = h(
    "button",
    { type: "button", class: "sec on", "aria-pressed": "true" },
    "Terminal",
  );
  const sqlMode = h(
    "button",
    { type: "button", class: "sec", "aria-pressed": "false" },
    "SQL",
  );
  const javaMode = h(
    "button",
    { type: "button", class: "sec", "aria-pressed": "false" },
    "Java",
  );
  modeBar.append(terminalMode, sqlMode, javaMode);
  page.append(heading, modeBar, content);
  root.append(page);

  let mode = "terminal";
  let modeGeneration = 0;
  let terminalController = null;
  let javaController = null;
  let javaSandboxCode = readSandboxJavaCode();
  let selectedDatasetId = datasets[0]?.[0] || "";
  let currentSchema = null;
  let currentSqlTextarea = null;
  let sqlOutput = null;
  let sqlRunButton = null;
  let sqlRunning = false;

  const syncModes = () => {
    terminalMode.classList.toggle("on", mode === "terminal");
    sqlMode.classList.toggle("on", mode === "sql");
    javaMode.classList.toggle("on", mode === "java");
    terminalMode.setAttribute("aria-pressed", String(mode === "terminal"));
    sqlMode.setAttribute("aria-pressed", String(mode === "sql"));
    javaMode.setAttribute("aria-pressed", String(mode === "java"));
  };
  const disposeTerminal = async () => {
    const controller = terminalController;
    terminalController = null;
    if (controller) await controller.dispose?.();
  };
  const disposeJava = async () => {
    const controller = javaController;
    javaController = null;
    if (controller) await controller.dispose?.();
  };
  const disposeActive = async () => {
    await Promise.all([disposeTerminal(), disposeJava()]);
  };
  root.disposeExercise = async () => {
    modeGeneration++;
    await disposeActive();
  };

  const showTerminal = async () => {
    mode = "terminal";
    syncModes();
    const generation = ++modeGeneration;
    await disposeActive();
    if (generation !== modeGeneration) return;
    content.replaceChildren(
      loadingNote("Opening your personal terminal sandbox\u2026"),
    );
    try {
      const terminalModule = await loadTerminalModule();
      if (generation !== modeGeneration || !content.isConnected) return;
      const host = h("div", { class: "terminal-sandbox-host" });
      content.replaceChildren(host);
      const controller = await terminalModule.mountTerminalSandbox({
        container: host,
        workspaceId: "default",
      });
      if (generation !== modeGeneration || !content.isConnected) {
        await controller?.dispose?.();
        return;
      }
      terminalController = controller;
    } catch (error) {
      if (generation !== modeGeneration) return;
      content.replaceChildren(
        h(
          "div",
          { class: "card err", role: "alert" },
          `The terminal sandbox could not be opened: ${error?.message || String(error)}`,
        ),
      );
    }
  };

  const showJava = async () => {
    mode = "java";
    syncModes();
    const generation = ++modeGeneration;
    await disposeActive();
    if (generation !== modeGeneration) return;
    content.replaceChildren(loadingNote("Loading the Java playground\u2026"));
    try {
      const javaModule = await loadJavaModule();
      if (generation !== modeGeneration || !content.isConnected) return;
      // Same two-pane layout as a Java practice exercise: editor on the left,
      // input / controls / console on the right (no instructions pane content).
      const editorPane = h("section", {
        class: "q exercise-workspace-panel",
        "aria-label": "Java code editor",
      });
      const toolsPane = h("section", {
        class: "q exercise-module-panel",
        "aria-label": "Java tools",
      });
      const host = h("div", { class: "exercise-module-host" });
      toolsPane.append(host);
      content.replaceChildren(
        createExerciseSplitLayout("java-ex", editorPane, toolsPane),
      );
      const controller = await javaModule.mountJavaExercise({
        toolsContainer: host,
        workspaceContainer: editorPane,
        exercise: SANDBOX_JAVA_EXERCISE,
        initialCode: javaSandboxCode,
        mode: "sandbox",
        onChange: (code) => {
          javaSandboxCode = code;
          saveSandboxJavaCode(code);
        },
      });
      if (generation !== modeGeneration || !content.isConnected) {
        await controller?.dispose?.();
        return;
      }
      javaController = controller;
    } catch (error) {
      if (generation !== modeGeneration) return;
      content.replaceChildren(
        h(
          "div",
          { class: "card err", role: "alert" },
          `The Java sandbox could not be opened: ${error?.message || String(error)}`,
        ),
      );
    }
  };

  const renderSql = () => {
    const generation = ++modeGeneration;
    void disposeActive();
    mode = "sql";
    syncModes();
    if (!datasets.length) {
      content.replaceChildren(
        h(
          "div",
          { class: "empty" },
          h("strong", {}, "No SQL databases are available"),
          h(
            "p",
            {},
            "Add a dataset with a title and SQL setup script to an exercise package to make it available here.",
          ),
        ),
      );
      return;
    }
    if (!S.datasets[selectedDatasetId]) selectedDatasetId = datasets[0][0];
    const database = S.datasets[selectedDatasetId];
    const title = displayDatasetTitle(database, selectedDatasetId);
    const titleLine = h(
      "div",
      { class: "sandbox-db-title" },
      h("span", { class: "filter-label" }, "Current database"),
      h("strong", {}, title),
    );
    const selector = h(
      "select",
      { "aria-label": "Choose database" },
      ...datasets.map(([id, item]) =>
        h(
          "option",
          { value: id, selected: id === selectedDatasetId },
          displayDatasetTitle(item, id),
        ),
      ),
    );
    const resetDatabaseButton = h(
      "button",
      { type: "button", class: "sec" },
      "Reset database",
    );
    const refreshSchemaButton = h(
      "button",
      { type: "button", class: "sec" },
      "Refresh schema",
    );
    const topbar = h(
      "div",
      { class: "card sandbox-sql-toolbar" },
      h(
        "label",
        { class: "filter-control" },
        h("span", { class: "filter-label" }, "Load database"),
        selector,
      ),
      titleLine,
      refreshSchemaButton,
      resetDatabaseButton,
    );
    const pseudoExercise = {
      datasetId: selectedDatasetId,
      datasetTitle: title,
    };
    const schemaPanel = schemaView(pseudoExercise, { preserveDatabase: true });
    const question = h(
      "section",
      { class: "q sandbox-sql-question" },
      h("h3", {}, "SQL playground"),
      h(
        "p",
        { class: "muted" },
        "Run one PostgreSQL statement per execution against the selected database. Changes persist while you experiment here; selecting another database loads that dataset's original state. Refresh the schema after creating, changing, or dropping tables.",
      ),
    );
    const textarea = h("textarea", {
      class: "editor sandbox-sql-editor",
      rows: 12,
      spellcheck: "false",
      "aria-label": "Sandbox SQL editor",
      placeholder: "SELECT * FROM \u2026;",
    });
    const actions = h("div", { class: "sandbox-sql-actions" });
    const runButton = h("button", { type: "button" }, "Run SQL (Ctrl + Enter)");
    const clearButton = h(
      "button",
      { type: "button", class: "sec" },
      "Clear editor",
    );
    const status = h("small", {
      class: "sandbox-sql-status",
      role: "status",
      "aria-live": "polite",
    });
    const output = h("div", { class: "sandbox-sql-output" });
    actions.append(runButton, clearButton, status);
    question.append(textarea, actions, output);
    const layout = createExerciseSplitLayout(
      "sql-query",
      question,
      schemaPanel,
    );
    const refreshSchema = () => {
      const freshSchema = schemaView(pseudoExercise, {
        preserveDatabase: true,
      });
      layout.replaceChild(freshSchema, layout.lastElementChild);
      currentSchema = freshSchema;
    };
    content.replaceChildren(topbar, layout);
    currentSchema = schemaPanel;
    currentSqlTextarea = textarea;
    sqlOutput = output;
    sqlRunButton = runButton;

    const runQuery = async () => {
      const sql = textarea.value;
      if (!sql.trim() || sqlRunning) return;
      sqlRunning = true;
      runButton.disabled = true;
      resetDatabaseButton.disabled = true;
      status.textContent = "Running against " + title + "\u2026";
      output.replaceChildren(loadingNote("Executing SQL\u2026"));
      try {
        const result = await withPersistentDb(database, (db) =>
          runSql(db, sql),
        );
        if (generation !== modeGeneration || mode !== "sql") return;
        output.replaceChildren(table(result));
        status.textContent = `Completed \u00B7 ${result.rows?.length ?? 0} row(s)`;
        if (/^\s*(create|alter|drop|truncate)\b/i.test(sql)) refreshSchema();
      } catch (error) {
        if (generation !== modeGeneration || mode !== "sql") return;
        output.replaceChildren(
          h("pre", { class: "err" }, describeSqlError(error, sql)),
        );
        status.textContent = "Query failed";
      } finally {
        sqlRunning = false;
        if (generation === modeGeneration) {
          runButton.disabled = false;
          resetDatabaseButton.disabled = false;
        }
      }
    };
    runButton.addEventListener("click", runQuery);
    refreshSchemaButton.addEventListener("click", () => {
      if (sqlRunning) return;
      refreshSchemaButton.disabled = true;
      refreshSchemaButton.textContent = "Refreshing\u2026";
      refreshSchema();
      requestAnimationFrame(() => {
        refreshSchemaButton.disabled = false;
        refreshSchemaButton.textContent = "Refresh schema";
      });
    });
    clearButton.addEventListener("click", () => {
      textarea.value = "";
      textarea.focus();
    });
    textarea.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        runQuery();
      }
    });
    selector.value = selectedDatasetId;
    selector.addEventListener("change", () => {
      selectedDatasetId = selector.value;
      sqlRunning = false;
      renderSql();
    });
    resetDatabaseButton.addEventListener("click", async () => {
      if (sqlRunning) return;
      resetDatabaseButton.disabled = true;
      runButton.disabled = true;
      status.textContent = "Restoring " + title + "\u2026";
      try {
        await withPersistentDb(database, async () => {}, true);
        if (generation !== modeGeneration || mode !== "sql") return;
        // Refresh the diagram and tables from the pristine selected dataset.
        refreshSchema();
        output.replaceChildren(
          h("small", {}, "Database restored to its original package state."),
        );
        status.textContent = "Database reset";
      } catch (error) {
        output.replaceChildren(h("pre", { class: "err" }, error.message));
        status.textContent = "Reset failed";
      } finally {
        if (generation === modeGeneration) {
          resetDatabaseButton.disabled = false;
          runButton.disabled = false;
        }
      }
    });
  };

  terminalMode.addEventListener("click", () => {
    if (mode !== "terminal") showTerminal();
  });
  sqlMode.addEventListener("click", () => {
    if (mode !== "sql") renderSql();
  });
  javaMode.addEventListener("click", () => {
    if (mode !== "java") showJava();
  });
  await showTerminal();
}

async function pagePractice(root, routePackageId = "", routeExerciseId = "") {
  if (!S.exercises.length)
    return root.append(
      empty(
        "No exercises installed yet.",
        "Ask the site maintainer to add an exercise package.",
      ),
    );
  const f = {
      course: practiceFilterMemory.course,
      category: practiceFilterMemory.category,
      difficulty: practiceFilterMemory.difficulty,
      term: practiceFilterMemory.term,
    },
    list = h("div", { class: "side" }),
    pane = h("div"),
    flt = h("div", {
      class: "practice-filters",
      "aria-label": "Filter exercises",
    });
  const answers = S.drafts;
  // Keep these values in page memory while the learner switches tabs. This
  // helper must live inside pagePractice because search, f and statusMode are
  // local to this page instance.
  function rememberPracticeFilters() {
    practiceFilterMemory = {
      search: search.value,
      course: f.course,
      category: f.category,
      difficulty: f.difficulty,
      term: f.term,
      exerciseTypes: [...selectedExerciseTypes],
      statusMode,
    };
  }
  // Four-position practice filter. Needs correction means a question has
  // previously been answered incorrectly and its latest result is still wrong.
  // Saved-for-later choices are stored per exercise in IndexedDB.
  let statusMode = practiceFilterMemory.statusMode || "uncompleted";
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
  const search = h("input", {
      type: "search",
      placeholder: "Search titles",
      "aria-label": "Search questions",
      oninput: () => {
        rememberPracticeFilters();
        redraw();
      },
    }),
    searchControl = h(
      "label",
      { class: "filter-control filter-search" },
      h("span", { class: "filter-label" }, "Search questions"),
      search,
    ),
    termSelect = h("select", {
      onchange: (e) => {
        f.term = e.target.value;
        f.category = "";
        rememberPracticeFilters();
        redraw();
      },
    }),
    courseSelect = h("select", {
      onchange: (e) => {
        f.course = e.target.value;
        f.category = "";
        rememberPracticeFilters();
        redraw();
      },
    }),
    categorySelect = h("select", {
      onchange: (e) => {
        if (!e.target.value) {
          f.category = "";
        } else {
          [f.course, f.category] = JSON.parse(e.target.value);
          courseSelect.value = f.course;
        }
        rememberPracticeFilters();
        redraw();
      },
    }),
    difficultySelect = h("select", {
      onchange: (e) => {
        f.difficulty = e.target.value;
        rememberPracticeFilters();
        redraw();
      },
    }),
    filterControl = (name, select) =>
      h(
        "label",
        { class: "filter-control" },
        h("span", { class: "filter-label" }, name),
        select,
      );
  const exerciseTypeOptions = [
    { key: "mcq", label: "Multiple choice questions" },
    { key: "interactive", label: "Interactive" },
    { key: "other", label: "Other" },
  ];
  const validExerciseTypeKeys = new Set(
    exerciseTypeOptions.map((option) => option.key),
  );
  let selectedExerciseTypes = new Set(
    (Array.isArray(practiceFilterMemory.exerciseTypes)
      ? practiceFilterMemory.exerciseTypes
      : exerciseTypeOptions.map((option) => option.key)
    ).filter((key) => validExerciseTypeKeys.has(key)),
  );
  const exerciseTypeCheckboxes = h("div", {
    class: "practice-type-checkboxes",
    role: "group",
    "aria-label": "Exercise types",
  });
  const exerciseTypeControl = h(
    "div",
    { class: "filter-control practice-type-filter-control" },
    h("span", { class: "filter-label" }, "Exercise type"),
    exerciseTypeCheckboxes,
  );
  exerciseTypeControl.addEventListener("click", () => {
    exerciseTypeControl.classList.toggle("is-open");
  });
  const exerciseTypeGroup = (exercise) => {
    if (String(exercise.type || "").startsWith("mcq")) return "mcq";
    if (
      exercise.type === "terminal" ||
      exercise.type === "sql-query" ||
      exercise.type == "java-ex"
    )
      return "interactive";
    return "other";
  };
  const statusModes = ["all", "uncompleted", "review", "saved"];
  const statusNames = [
    "Every question",
    "Uncompleted",
    "Needs correction",
    "Saved for later",
  ];
  const statusButtons = statusModes.map((mode, index) =>
    h(
      "button",
      {
        type: "button",
        class:
          "practice-status-option" + (mode === statusMode ? " is-active" : ""),
        "aria-pressed": String(mode === statusMode),
        onclick: () => {
          statusMode = mode;
          statusSlider.dataset.status = mode;
          statusButtons.forEach((button, buttonIndex) => {
            const active = statusModes[buttonIndex] === mode;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
          });
          rememberPracticeFilters();
          redraw();
        },
      },
      statusNames[index],
    ),
  );
  const statusSlider = h(
    "div",
    {
      class: "practice-status-slider",
      role: "group",
      "aria-label": "Filter questions by status",
      "data-status": statusMode,
    },
    h("div", { class: "practice-status-labels" }, ...statusButtons),
  );
  const statusControl = h(
    "div",
    { class: "filter-control practice-status-control" },
    h("span", { class: "filter-label" }, "Question status"),
    statusSlider,
  );
  function buildPracticeStatusIndexes() {
    const last = Object.create(null);
    const previouslyMissed = new Set();
    S.attempts.forEach((attempt) => {
      last[attempt.key] = attempt.correct;
      const completedBefore = Boolean(S.xpRewards[attempt.key]);
      if (
        !completedBefore &&
        (attempt.everIncorrect || attempt.correct === false) &&
        attempt.correct !== true
      )
        previouslyMissed.add(attempt.key);
    });
    return { last, previouslyMissed };
  }
  function matchesPracticeStatus(exercise, statusIndexes) {
    const key = keyOf(exercise);
    const completedBefore = Boolean(S.xpRewards[key]);
    const needsCorrection = statusIndexes.previouslyMissed.has(key);
    if (statusMode === "all") return true;
    if (statusMode === "review") return needsCorrection;
    if (statusMode === "saved") return Boolean(S.savedForLater[key]);
    return !completedBefore || needsCorrection;
  }
  function getAvailableExercises(
    excludedFilter,
    statusIndexes,
    includeAllTypes = false,
  ) {
    const query = search.value.trim().toLocaleLowerCase();
    return S.exercises.filter(
      (exercise) =>
        Object.entries(f).every(
          ([key, value]) =>
            (Array.isArray(excludedFilter)
              ? excludedFilter.includes(key)
              : key === excludedFilter) ||
            !value ||
            String(exercise[key]) === value,
        ) &&
        (includeAllTypes ||
          selectedExerciseTypes.has(exerciseTypeGroup(exercise))) &&
        (!query || haystack.get(exercise).includes(query)) &&
        matchesPracticeStatus(exercise, statusIndexes),
    );
  }
  function replaceFacetOptions(
    select,
    allLabel,
    entries,
    selectedValue,
    valueOf,
    labelOf,
  ) {
    const options = entries.map((entry) =>
      h("option", { value: valueOf(entry) }, labelOf(entry)),
    );
    if (
      selectedValue &&
      !entries.some((entry) => valueOf(entry) === selectedValue)
    ) {
      options.push(
        h(
          "option",
          { value: selectedValue, disabled: true },
          `${labelOf(selectedValue)} (no matching items)`,
        ),
      );
    }
    select.replaceChildren(h("option", { value: "" }, allLabel), ...options);
    select.value = selectedValue || "";
  }
  function refreshFilterOptions(statusIndexes = buildPracticeStatusIndexes()) {
    const availableTerms = [
      ...new Set(
        getAvailableExercises("term", statusIndexes)
          .map((exercise) => exercise.term)
          .filter(Number.isInteger),
      ),
    ].sort((a, b) => a - b);
    const availableCourses = uniq(
      getAvailableExercises(["course", "category"], statusIndexes),
      (exercise) => exercise.course,
    );
    const availableDifficulties = DIFF.filter((difficulty) =>
      getAvailableExercises("difficulty", statusIndexes).some(
        (exercise) => exercise.difficulty === difficulty,
      ),
    );
    const categories = [
      ...new Map(
        getAvailableExercises("category", statusIndexes)
          .filter((exercise) => exercise.category)
          .map((exercise) => [
            JSON.stringify([exercise.course, exercise.category]),
            { course: exercise.course, category: exercise.category },
          ]),
      ).values(),
    ].sort(
      (a, b) =>
        String(a.category).localeCompare(String(b.category)) ||
        String(a.course).localeCompare(String(b.course)),
    );
    const courseCounts = new Map();
    categories.forEach((entry) =>
      courseCounts.set(
        entry.category,
        (courseCounts.get(entry.category) || 0) + 1,
      ),
    );
    const categoryValue = (entry) =>
      typeof entry === "string"
        ? entry
        : JSON.stringify([entry.course, entry.category]);
    replaceFacetOptions(
      termSelect,
      "All terms",
      availableTerms,
      f.term,
      String,
      (term) => `Term ${term}`,
    );
    replaceFacetOptions(
      courseSelect,
      "All",
      availableCourses,
      f.course,
      String,
      (course) => courseLabel(course),
    );
    replaceFacetOptions(
      categorySelect,
      "All",
      categories,
      f.category ? JSON.stringify([f.course, f.category]) : "",
      categoryValue,
      (entry) => {
        if (typeof entry === "string") {
          try {
            const [course, category] = JSON.parse(entry);
            return `${categoryLabel(category)} (${courseLabel(course)}) — no matches`;
          } catch {
            return `${entry} — no matches`;
          }
        }
        return `${categoryLabel(entry.category)}${courseCounts.get(entry.category) > 1 ? ` (${courseLabel(entry.course)})` : ""}`;
      },
    );
    replaceFacetOptions(
      difficultySelect,
      "All",
      availableDifficulties,
      f.difficulty,
      String,
      String,
    );

    const availableGroups = new Set(
      getAvailableExercises("__exerciseType", statusIndexes, true).map(
        exerciseTypeGroup,
      ),
    );
    const visibleTypeOptions = exerciseTypeOptions.filter((option) =>
      availableGroups.has(option.key),
    );
    exerciseTypeCheckboxes.replaceChildren(
      ...visibleTypeOptions.map((option) => {
        const checkbox = h("input", {
          type: "checkbox",
          checked: selectedExerciseTypes.has(option.key),
          onchange: (event) => {
            if (event.target.checked) selectedExerciseTypes.add(option.key);
            else selectedExerciseTypes.delete(option.key);
            rememberPracticeFilters();
            redraw();
          },
        });
        return h(
          "label",
          { class: "practice-type-option" },
          checkbox,
          h("span", {}, option.label),
        );
      }),
    );
  }
  // Restore values before the controls are attached; facets are rebuilt from
  // the available exercises while respecting every other active filter.
  search.value = practiceFilterMemory.search || "";
  statusSlider.dataset.status = statusMode;
  statusButtons.forEach((button, index) => {
    const active = statusModes[index] === statusMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  refreshFilterOptions();
  flt.append(
    searchControl,
    filterControl("Term", termSelect),
    filterControl("Course", courseSelect),
    filterControl("Category", categorySelect),
    filterControl("Difficulty", difficultySelect),
    exerciseTypeControl,
    statusControl,
  );
  const makeButton = (e) => {
    const key = keyOf(e);
    const completedBefore = Boolean(S.xpRewards[key]);
    return h(
      "button",
      {
        class: "item" + (key === selectedKey ? " on" : ""),
        "data-exercise-key": key,
        "aria-pressed": key === selectedKey,
        onclick: () => {
          void selectExercise(e, true).catch((error) =>
            console.error("Could not open exercise:", error),
          );
        },
      },
      `${S.savedForLater[key] ? "\u{1F516} " : ""}${lastResults[key] === undefined ? "\u25CB" : lastResults[key] ? "\u2714" : "\u2718"} ${e.title}`,
      completedBefore
        ? h(
            "span",
            {
              class: "exercise-completed-flag exercise-completed-flag--inline",
              title: "This exercise has been completed successfully before.",
              "aria-label": "Completed before",
            },
            "\u2713 Completed before",
          )
        : null,
      h(
        "small",
        {},
        ` ${packageLabel(e.packageId)} \u00B7 ${Number.isInteger(e.term) ? `Term ${e.term} \u00B7 ` : ""}${e.difficulty}`,
      ),
    );
  };
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
    const statusIndexes = buildPracticeStatusIndexes();
    refreshFilterOptions(statusIndexes);
    const filtered = getAvailableExercises(null, statusIndexes);
    // Keep the active exercise available while filters/search change. The
    // current question stays pinned in the list until the learner explicitly
    // selects another exercise; filters may narrow the other choices but must
    // never clear the active question or its answer pane.
    const selectedExercise = selectedKey
      ? S.exercises.find((e) => keyOf(e) === selectedKey)
      : null;
    lastResults = statusIndexes.last;
    items = filtered.filter((exercise) => {
      const key = keyOf(exercise);
      // The active exercise stays pinned even when a filter no longer matches.
      return (
        key === selectedKey || matchesPracticeStatus(exercise, statusIndexes)
      );
    });
    if (selectedExercise && !items.some((e) => keyOf(e) === selectedKey)) {
      items.unshift(selectedExercise);
    }
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
          statusMode === "uncompleted" && filtered.length
            ? "All matching exercises are completed."
            : statusMode === "review"
              ? "No questions currently need correction in these filters."
              : statusMode === "saved"
                ? "No questions have been saved for later in these filters."
                : "No exercises match these filters.",
        ),
      );
    else if (items.length > practiceVisibleCount) nodes.push(moreRow());
    list.replaceChildren(...nodes);
    pane.firstElementChild?.refreshNextExercise?.();
  };
  // Keep the selected exercise visible in the left navigation when that
  // navigation has its own scroll area. This does not move the main page.
  function scrollSelectedNavigationItem(key) {
    const navItem = [...list.querySelectorAll("[data-exercise-key]")].find(
      (item) => item.dataset.exerciseKey === key,
    );
    if (!navItem) return;
    let scroller = list;
    while (scroller && scroller !== document.body) {
      const overflowY = getComputedStyle(scroller).overflowY;
      if (
        scroller.scrollHeight > scroller.clientHeight + 1 &&
        ["auto", "scroll", "overlay"].includes(overflowY)
      )
        break;
      scroller = scroller.parentElement;
    }
    if (!scroller || scroller === document.body) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const itemRect = navItem.getBoundingClientRect();
    let nextTop = scroller.scrollTop;
    if (itemRect.top < scrollerRect.top) {
      nextTop += itemRect.top - scrollerRect.top - 8;
    } else if (itemRect.bottom > scrollerRect.bottom) {
      nextTop += itemRect.bottom - scrollerRect.bottom + 8;
    } else {
      return;
    }
    scroller.scrollTo({
      top: Math.max(0, nextTop),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  function scrollLearningPathNavigator(navigator) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!navigator?.isConnected) return;

        const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth";

        // The exercise pane may scroll independently of the document. Find
        // the nearest ancestor that can actually scroll instead of assuming
        // window is the active scroll container.
        let scroller = navigator.parentElement;
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
            break;
          scroller = scroller.parentElement;
        }

        if (
          scroller &&
          scroller !== document.body &&
          scroller !== document.documentElement
        ) {
          const scrollerRect = scroller.getBoundingClientRect();
          const navigatorRect = navigator.getBoundingClientRect();
          const scrollportTop = scrollerRect.top + scroller.clientTop;
          const top =
            scroller.scrollTop + navigatorRect.top - scrollportTop - 12;
          scroller.scrollTo({ top: Math.max(0, top), behavior });
          return;
        }

        // Fall back to document scrolling when no nested scroll container
        // owns the navigator. Account for a sticky/fixed site header.
        const header = document.querySelector("header");
        const pinned =
          header &&
          ["sticky", "fixed"].includes(getComputedStyle(header).position);
        const offset = pinned ? header.getBoundingClientRect().height : 0;
        const scrollingElement =
          document.scrollingElement || document.documentElement;
        const top =
          navigator.getBoundingClientRect().top +
          scrollingElement.scrollTop -
          offset -
          12;
        window.scrollTo({ top: Math.max(0, top), behavior });
      }),
    );
  }
  // Filter, search and status-slider changes start again from page one.
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
  let exerciseSelectionGeneration = 0;
  async function selectExercise(
    exercise,
    addHistoryEntry,
    scrollToExercise = addHistoryEntry,
  ) {
    const generation = ++exerciseSelectionGeneration;
    await disposeExerciseViews(pane);
    if (generation !== exerciseSelectionGeneration) return;
    selectedKey = keyOf(exercise);
    draw();
    const nextExerciseAfter = () => {
      const index = items.findIndex((item) => keyOf(item) === keyOf(exercise));
      return index >= 0 ? items[index + 1] : undefined;
    };
    let pathNavigator = null;
    const handlePracticeResult = async (correct, meta = {}) => {
      const save = rec(
        exercise,
        correct,
        "practice",
        () => {
          draw();
          syncCompletionFlag();
        },
        meta,
      );
      setTimeout(() => {
        if (pathNavigator?.isConnected) {
          pathNavigator.classList.toggle("right", correct === true);
          if (correct === true) scrollLearningPathNavigator(pathNavigator);
        }
      }, 200);
      await save;
    };
    const view = qView(
      exercise,
      "practice",
      () => answers[keyOf(exercise)],
      (v) => saveDraft(keyOf(exercise), v),
      undefined,
      () => {
        const next = nextExerciseAfter();
        if (next)
          void selectExercise(next, true).catch((error) =>
            console.error("Could not open next exercise:", error),
          );
      },
      () => !!nextExerciseAfter(),
      "practice",
      [],
      handlePracticeResult,
    );

    const exerciseKey = keyOf(exercise);
    const saveStatus = h("span", {
      class: "practice-save-status",
      role: "status",
      "aria-live": "polite",
    });
    const saveButton = h(
      "button",
      {
        type: "button",
        class: "practice-save-button",
        "aria-pressed": String(Boolean(S.savedForLater[exerciseKey])),
        onclick: async () => {
          const wasSaved = Boolean(S.savedForLater[exerciseKey]);
          if (wasSaved) delete S.savedForLater[exerciseKey];
          else S.savedForLater[exerciseKey] = true;

          saveButton.disabled = true;
          syncSaveButton();
          saveStatus.textContent = "Saving\u2026";
          // Redraw the list immediately, but keep the currently open exercise
          // pinned until the learner explicitly selects another one.
          redraw();
          try {
            await kv.set("savedForLater", S.savedForLater);
            saveStatus.textContent = wasSaved
              ? "Removed from Saved for later."
              : "Saved for later.";
          } catch (error) {
            if (wasSaved) S.savedForLater[exerciseKey] = true;
            else delete S.savedForLater[exerciseKey];
            syncSaveButton();
            redraw();
            saveStatus.textContent =
              "Could not update saved status: " +
              (error?.message || String(error));
          } finally {
            saveButton.disabled = false;
          }
        },
      },
      S.savedForLater[exerciseKey] ? "Saved for later" : "Save for later",
    );
    const syncSaveButton = () => {
      const isSaved = Boolean(S.savedForLater[exerciseKey]);
      saveButton.textContent = isSaved ? "Saved for later" : "Save for later";
      saveButton.classList.toggle("is-saved", isSaved);
      saveButton.setAttribute("aria-pressed", String(isSaved));
    };
    syncSaveButton();
    const questionRoot =
      view.actionsRoot ??
      (view.classList?.contains("q") ? view : view.querySelector?.(".q"));
    questionRoot?.prepend(
      h("div", { class: "practice-exercise-actions" }, saveButton, saveStatus),
    );
    let completionFlag = null;
    const syncCompletionFlag = () => {
      if (!S.xpRewards[exerciseKey] || completionFlag) return;
      completionFlag = h(
        "span",
        {
          class: "exercise-completed-flag exercise-completed-flag--question",
          role: "status",
          "aria-label": "Completed before",
        },
        "\u2713 Completed before",
      );
      const heading = view.querySelector("h3");
      if (heading) heading.before(completionFlag);
      else questionRoot?.prepend(completionFlag);
    };
    syncCompletionFlag();

    // Guided Learning exercises retain their sequence in the practice view.
    // Reviewed sections are skipped; solved exercises remain available.
    let learningSession = null;
    try {
      learningSession = JSON.parse(
        localStorage.getItem("learning-path-session") || "null",
      );
    } catch {
      learningSession = null;
    }
    const learningPathExercises = Array.isArray(learningSession?.exercises)
      ? learningSession.exercises
      : [];
    const learningPathIndex = learningPathExercises.findIndex(
      (item) =>
        item.packageId === exercise.packageId &&
        item.exerciseId === exercise.id,
    );
    if (
      learningSession?.packageId === exercise.packageId &&
      learningPathIndex >= 0
    ) {
      const reviewedSections = new Set(
        Array.isArray(learningSession.completedSectionIds)
          ? learningSession.completedSectionIds
          : [],
      );
      const pathPosition = h("span", {
        class: "learning-path-position",
        "aria-live": "polite",
      });
      const previousPathButton = h(
        "button",
        { type: "button", class: "sec", disabled: true },
        "\u2190 Previous",
      );
      const nextPathButton = h(
        "button",
        { type: "button", class: "sec" },
        "Next exercise \u2192",
      );
      const findPathExercise = (direction) => {
        for (
          let index = learningPathIndex + direction;
          index >= 0 && index < learningPathExercises.length;
          index += direction
        ) {
          const candidate = learningPathExercises[index];
          if (reviewedSections.has(candidate.sectionId)) continue;
          const candidateKey = `${candidate.packageId}:${candidate.exerciseId}`;
          if (
            direction > 0 &&
            (S.xpRewards?.[candidateKey] || S.xpRewards?.[candidate.exerciseId])
          )
            continue;
          const found = S.exercises.find(
            (item) =>
              item.packageId === candidate.packageId &&
              item.id === candidate.exerciseId,
          );
          if (!found) continue;
          if (direction > 0 && S.xpRewards[keyOf(found)]) continue;
          return { exercise: found, index };
        }
        return null;
      };
      const previousPathExercise = findPathExercise(-1);
      const nextPathExercise = findPathExercise(1);
      view.hideInlineNextExercise?.();
      previousPathButton.disabled = !previousPathExercise;
      nextPathButton.disabled = !nextPathExercise;
      // Every exercise type uses this same path-order handler and skip rules.
      view.configureNextExercise?.(
        () => {
          if (nextPathExercise)
            void selectExercise(nextPathExercise.exercise, true);
        },
        () => Boolean(nextPathExercise),
      );
      pathPosition.textContent =
        `Learning path \u00B7 Exercise ${learningPathIndex + 1} of ${learningPathExercises.length}` +
        (reviewedSections.size
          ? ` \u00B7 ${reviewedSections.size} section${reviewedSections.size === 1 ? "" : "s"} marked done`
          : "");
      previousPathButton.addEventListener("click", () => {
        if (previousPathExercise)
          void selectExercise(previousPathExercise.exercise, true);
      });
      nextPathButton.addEventListener("click", () => {
        if (nextPathExercise)
          void selectExercise(nextPathExercise.exercise, true);
      });
      pathNavigator = h(
        "nav",
        {
          class: "learning-path-navigator",
          "aria-label": "Learning path navigation",
        },
        h(
          "div",
          { class: "learning-path-navigator__details" },
          h("strong", {}, "Continue learning"),
          pathPosition,
        ),
        h(
          "div",
          { class: "learning-path-navigator__actions" },
          previousPathButton,
          nextPathButton,
        ),
      );
      view.prepend(pathNavigator);
      learningSession.currentExerciseId = exercise.id;
      try {
        localStorage.setItem(
          "learning-path-session",
          JSON.stringify(learningSession),
        );
      } catch {
        /* Navigation still works for the current page. */
      }
    }

    pane.replaceChildren(view);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        // Anchor to the actual exercise heading after the page has been
        // attached and laid out. This also works for direct URLs and reloads,
        // not only for clicks in the exercise list.
        if (view.isConnected) {
          scrollSelectedNavigationItem(keyOf(exercise));
        }
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
  if (routeExercise)
    selectExercise(routeExercise, false, true).catch((error) =>
      console.error("Could not open selected exercise:", error),
    );
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
        "There\u2019s an unfinished exam saved on this device. Would you like to continue where you left off?",
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

  const examPool = S.exercises;
  if (!examPool.length)
    return root.append(
      empty(
        "No exercises installed yet.",
        "Ask the site maintainer to add an exercise package.",
      ),
      await historyView(),
    );

  const courses = uniq(S.exercises, (exercise) => exercise.course);
  // Term options come from all installed exercise packages.
  // Sort numerically so Term 2 appears before Term 10.
  const terms = [
    ...new Set(
      examPool.map((exercise) => exercise.term).filter(Number.isInteger),
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
      examPool.some(
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
    examPool.some(
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
        `${selectedTerms} \u00B7 ${selectedCourses} \u00B7 ${cfg.mins} minutes`,
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
      : h("small", {}, "No term numbers found in installed packages."),
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
                examExercises.map(exerciseWithCoreAliases),
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
                      cfg.courses.includes(exercise.course) &&
                      exercise.difficulty === difficulty,
                  ).length;
                return msg.replaceChildren(
                  h(
                    "p",
                    { class: "bad" },
                    "Not enough exercises: nothing was substituted. " +
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
                visited: {},
                touched: {},
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
          h("span", { "aria-hidden": "true" }, "\u25B6"),
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
  const savedHistory = await kv.get("examHistory", []);
  const hist = Array.isArray(savedHistory) ? savedHistory : [];
  const resolveExercise = (id) => {
    const normalizedId = typeof id === "string" ? id : id?.id || id?.key || "";
    return (
      S.exercises.find((exercise) => keyOf(exercise) === normalizedId) ||
      (S.exercises.filter((exercise) => exercise.id === normalizedId).length ===
      1
        ? S.exercises.find((exercise) => exercise.id === normalizedId)
        : null)
    );
  };
  const practiceLink = (question, exercise) => {
    const id = question.id || question.key || "";
    const packageId =
      exercise?.packageId || question.packageId || id.split(":")[0];
    const exerciseId =
      exercise?.id || question.exerciseId || id.split(":").slice(1).join(":");
    if (!packageId || !exerciseId || !exercise) return "";
    return h(
      "button",
      {
        type: "button",
        class: "exam-history-practice-link",
        onclick: () => {
          location.hash = `#/practice/${encodeURIComponent(packageId)}/${encodeURIComponent(exerciseId)}`;
        },
      },
      "Practice this question",
    );
  };
  const questionCard = (question, index) => {
    const id = question.id || question.key || "";
    const exercise = resolveExercise(id);
    const title = question.title || exercise?.title || `Question ${index + 1}`;
    const answerAvailable = Object.prototype.hasOwnProperty.call(
      question,
      "answer",
    );
    const legacyRecord = question.legacy === true;
    let learnerAnswer = "No answer was entered for this question.";
    if (legacyRecord && !answerAvailable) {
      learnerAnswer =
        "This exam was saved before per-question answers were recorded. The overall exam result is preserved, but this question's answer and visit state are unavailable.";
    } else if (question.type === "terminal" || exercise?.type === "terminal") {
      learnerAnswer = question.answered
        ? "Terminal workspace changes were saved and graded from the final state."
        : question.visited
          ? "The terminal workspace was opened, but no changes were saved."
          : "The terminal workspace was not opened for this question.";
    } else if (question.answered === false) {
      learnerAnswer = question.visited
        ? "You opened this question but did not submit an answer."
        : "This question was not opened during the exam.";
    } else if (answerAvailable && exercise) {
      learnerAnswer = answerText(exercise, question.answer);
    } else if (answerAvailable) {
      learnerAnswer = Array.isArray(question.answer)
        ? question.answer.join(", ")
        : String(question.answer ?? "(no answer)");
    } else if (!question.visited && !question.answered) {
      learnerAnswer = "This question was not opened during the exam.";
    }
    const resultLabel = legacyRecord
      ? "Details unavailable"
      : question.correct === true
        ? "Correct"
        : question.correct === false
          ? "Incorrect"
          : "Self-check";
    const resultClass = legacyRecord
      ? "is-legacy"
      : question.correct === true
        ? "is-correct"
        : question.correct === false
          ? "is-incorrect"
          : "is-self-check";
    const comment = question.feedback || question.checkComment || "";
    const explanation = question.explanation || exercise?.explanation || "";
    return h(
      "article",
      { class: "exam-history-question" },
      h(
        "div",
        { class: "exam-history-question-heading" },
        h(
          "div",
          {},
          h(
            "span",
            { class: "exam-history-question-number" },
            `QUESTION ${String(index + 1).padStart(2, "0")}`,
          ),
          h("h4", {}, title),
        ),
        h("span", { class: `exam-history-result ${resultClass}` }, resultLabel),
      ),
      h(
        "div",
        { class: "exam-history-answer" },
        h("strong", {}, "Your answer"),
        h("pre", {}, learnerAnswer),
      ),
      comment
        ? h(
            "div",
            { class: "exam-history-feedback" },
            h("strong", {}, "Check feedback"),
            h("pre", {}, comment),
          )
        : "",
      explanation
        ? h(
            "div",
            { class: "exam-history-feedback" },
            h("strong", {}, "Exercise explanation"),
            h("p", {}, explanation),
          )
        : "",
      h(
        "div",
        { class: "exam-history-question-meta" },
        legacyRecord
          ? h("span", {}, "Saved with an older exam format")
          : h("span", {}, question.visited ? "Visited" : "Not visited"),
        legacyRecord
          ? ""
          : h("span", {}, question.answered ? "Answered" : "Unanswered"),
        question.flagged
          ? h("span", { class: "is-flagged" }, "Flagged for review")
          : "",
      ),
      practiceLink(question, exercise),
    );
  };

  return h(
    "section",
    { class: "exam-history-section card" },
    h(
      "div",
      { class: "exam-history-section-heading" },
      h(
        "div",
        {},
        h("p", { class: "eyebrow" }, "YOUR PAST SESSIONS"),
        h("h2", {}, "Exam history"),
      ),
      h(
        "span",
        { class: "exam-history-count" },
        `${hist.length} exam${hist.length === 1 ? "" : "s"}`,
      ),
    ),
    hist.length
      ? h(
          "div",
          { class: "exam-history-list" },
          ...hist
            .slice()
            .reverse()
            .map((exam, examIndex) => {
              const legacyIds = Array.isArray(exam.ids)
                ? exam.ids
                : Array.isArray(exam.exerciseIds)
                  ? exam.exerciseIds
                  : [];
              const rawQuestions = Array.isArray(exam.questions)
                ? exam.questions
                : legacyIds.map((rawId, index) => {
                    const id =
                      typeof rawId === "string"
                        ? rawId
                        : rawId?.id ||
                          rawId?.key ||
                          (rawId?.packageId && rawId?.exerciseId
                            ? `${rawId.packageId}:${rawId.exerciseId}`
                            : "");
                    const exercise = resolveExercise(id);
                    const legacyAnswer =
                      exam.answers?.[id] ??
                      (exercise ? exam.answers?.[exercise.id] : undefined) ??
                      exam.answers?.[index];
                    const legacyQuestion = { id, legacy: true };
                    if (legacyAnswer !== undefined) {
                      legacyQuestion.answer = legacyAnswer;
                      legacyQuestion.answered = true;
                    }
                    return legacyQuestion;
                  });
              const savedQuestions = rawQuestions.map((rawQuestion, index) => {
                if (typeof rawQuestion === "string")
                  rawQuestion = { id: rawQuestion, legacy: true };
                const question =
                  rawQuestion && typeof rawQuestion === "object"
                    ? { ...rawQuestion }
                    : { legacy: true };
                question.id ||=
                  question.key ||
                  (question.packageId && question.exerciseId
                    ? `${question.packageId}:${question.exerciseId}`
                    : "");
                if (!Object.prototype.hasOwnProperty.call(question, "answer")) {
                  const exercise = resolveExercise(question.id);
                  const legacyAnswer =
                    exam.answers?.[question.id] ??
                    (exercise ? exam.answers?.[exercise.id] : undefined) ??
                    exam.answers?.[index];
                  if (legacyAnswer !== undefined) {
                    question.answer = legacyAnswer;
                    if (question.answered == null) question.answered = true;
                  }
                }
                return question;
              });
              const hasSnapshots = savedQuestions.some((question) =>
                [
                  "visited",
                  "answered",
                  "flagged",
                  "correct",
                  "feedback",
                  "checkComment",
                ].some((field) =>
                  Object.prototype.hasOwnProperty.call(question, field),
                ),
              );
              if (!hasSnapshots)
                savedQuestions.forEach((question) => {
                  question.legacy = true;
                });
              const dateLabel = exam.date
                ? new Date(exam.date).toLocaleString()
                : `Exam ${hist.length - examIndex}`;
              const visitedCount = savedQuestions.filter(
                (question) => question.visited,
              ).length;
              const answeredCount = savedQuestions.filter(
                (question) => question.answered,
              ).length;
              const sessionMeta = hasSnapshots
                ? `${savedQuestions.length} questions \u00B7 ${visitedCount} visited \u00B7 ${answeredCount} answered \u00B7 ${Math.round(exam.cfg?.mins || 0)} min`
                : `${savedQuestions.length} questions \u00B7 ${Math.round(exam.cfg?.mins || 0)} min`;
              return h(
                "article",
                { class: "exam-history-card" },
                h(
                  "div",
                  { class: "exam-history-card-heading" },
                  h(
                    "div",
                    {},
                    h("strong", {}, dateLabel),
                    h("small", {}, sessionMeta),
                  ),
                  h(
                    "span",
                    { class: "exam-history-score" },
                    `${exam.score ?? 0} / ${exam.total ?? 0}`,
                  ),
                ),
                h(
                  "details",
                  { class: "exam-history-details" },
                  h("summary", {}, "Review questions and your answers"),
                  h(
                    "div",
                    {},
                    hasSnapshots
                      ? ""
                      : h(
                          "p",
                          { class: "exam-history-older-note" },
                          "This exam was taken before question-level answers and visit status were saved. The overall score is preserved; available questions can still be opened in Practice.",
                        ),
                    h(
                      "div",
                      { class: "exam-history-questions" },
                      ...savedQuestions.map(questionCard),
                    ),
                  ),
                ),
              );
            }),
        )
      : h(
          "p",
          { class: "exam-history-empty" },
          "No completed exams yet. Your question-by-question reviews will appear here after you submit an exam.",
        ),
  );
}
async function runExam(root, st) {
  const storedIds = Array.isArray(st.ids)
    ? st.ids
    : Array.isArray(st.exerciseIds)
      ? st.exerciseIds
      : Array.isArray(st.questions)
        ? st.questions.map(
            (question) =>
              question?.id ||
              question?.key ||
              (question?.packageId && question?.exerciseId
                ? `${question.packageId}:${question.exerciseId}`
                : null),
          )
        : [];
  st.ids = storedIds
    .map((value) =>
      typeof value === "string"
        ? value
        : value?.id ||
          value?.key ||
          (value?.packageId && value?.exerciseId
            ? `${value.packageId}:${value.exerciseId}`
            : null),
    )
    .filter(Boolean);
  st.cfg = { mins: 60, ...(st.cfg || {}) };
  st.startedAt = Number(st.startedAt) || Date.now();
  st.deadline = Number(st.deadline) || st.startedAt + st.cfg.mins * 60000;
  st.cur = Math.max(0, Math.min(st.ids.length - 1, Number(st.cur) || 0));
  st.id ||= `legacy-exam-${st.startedAt}`;
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
    oldFlags = st.flags || {},
    oldVisited = st.visited || {},
    oldTouched = st.touched || {};
  const oldValue = (record, ex, index) =>
    Array.isArray(record)
      ? record[index]
      : (record?.[keyOf(ex)] ?? record?.[ex.id] ?? record?.[index]);
  st.answers = Object.fromEntries(
    exs
      .map((ex, index) => [keyOf(ex), oldValue(oldAnswers, ex, index)])
      .filter(([, value]) => value !== undefined),
  );
  st.flags = Object.fromEntries(
    exs
      .map((ex, index) => [keyOf(ex), oldValue(oldFlags, ex, index)])
      .filter(([, value]) => value !== undefined),
  );
  st.visited = Object.fromEntries(
    exs.map((ex, index) => [
      keyOf(ex),
      Boolean(oldValue(oldVisited, ex, index) ?? index === st.cur),
    ]),
  );
  const inferTouched = (ex, answer) => {
    // Older exam checkpoints only stored the terminal-open sentinel. Preserve
    // their ability to be graded against the saved virtual workspace.
    if (ex.type === "terminal") return answer === "terminal-workspace";
    if (ex.type === "java-ex")
      return (
        typeof answer === "string" && answer !== String(ex.java?.preCode ?? "")
      );
    if (Array.isArray(answer))
      return answer.some((value) => String(value ?? "").trim() !== "");
    if (answer && typeof answer === "object")
      return Object.values(answer).some(
        (value) => String(value ?? "").trim() !== "",
      );
    return answer != null && String(answer).trim() !== "";
  };
  st.touched = Object.fromEntries(
    exs.map((ex, index) => {
      const key = keyOf(ex);
      const saved = oldValue(oldTouched, ex, index);
      return [
        key,
        saved === undefined
          ? inferTouched(ex, st.answers[key])
          : Boolean(saved),
      ];
    }),
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
    nav = h("div", { class: "exercise-index-grid" }),
    body = h("div", { class: "exercise-question-body" }),
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
      { class: "cols exercise-session-layout" },
      h(
        "aside",
        { class: "side exercise-index-panel" },
        h("h2", {}, "Questions"),
        h("p", {}, "Choose a number to jump to a question."),
        nav,
        h(
          "small",
          { class: "exercise-index-legend" },
          "Tinted = visited \u00B7 filled = answered \u00B7 orange = flagged",
        ),
      ),
      h("section", { class: "q exercise-question-panel" }, body),
    ),
    session = h("section", { class: "exam-session" }, top, workspace);
  let done = false;
  let showGeneration = 0;
  let autoSubmitted = false;
  let autosaveTimer;
  const submit = async () => {
    if (done || st.submitted) return;
    done = true;
    clearInterval(iv);
    clearInterval(autosaveTimer);
    showGeneration++;
    const gradingProgress = createLoadingProgress({
      title: "Grading your exam",
      detail: "Closing active exercise workspaces…",
      value: 2,
      className: "exam-grading-progress",
    });
    root.replaceChildren(
      h("div", { class: "exam-grading card" }, gradingProgress.element),
    );

    try {
      await disposeExerciseViews(body);
      gradingProgress.update({
        detail: "Preparing submitted answers and SQL datasets…",
        value: 5,
      });
      let score = 0,
        gradable = 0;
      const rows = [];
      const sqlItems = exs
        .filter((exercise) => exercise.type === "sql-query")
        .map((exercise) => ({ exercise, answer: st.answers[keyOf(exercise)] }));
      gradingProgress.update({
        detail: sqlItems.length
          ? `Checking ${sqlItems.length} SQL submission${sqlItems.length === 1 ? "" : "s"}…`
          : "No SQL submissions need checking; preparing other graders…",
        value: 8,
      });
      const sqlGrades = await gradeSqlBatch(
        sqlItems.map(({ exercise, answer }) => ({ ex: exercise, answer })),
        ({ phase, exercise, completed, total }) => {
          const fraction = total
            ? Math.min(1, (completed + (phase === "check" ? 1 : 0)) / total)
            : 1;
          gradingProgress.update({
            detail:
              phase === "prepare"
                ? `Preparing SQL dataset for ${total} submitted question${total === 1 ? "" : "s"}…`
                : `Checking ${exercise?.title || "SQL exercise"} (${Math.min(total, completed + 1)} of ${total})…`,
            value: 8 + fraction * 27,
          });
        },
      );
      gradingProgress.update({
        detail: "SQL checks finished. Loading specialized graders…",
        value: 36,
      });
      let javaModule = null;
      let terminalModule = null;
      const javaWork = exs.some(
        (exercise) =>
          exercise.type === "java-ex" && st.touched?.[keyOf(exercise)],
      );
      const terminalWork = exs.some(
        (exercise) =>
          exercise.type === "terminal" &&
          st.answers[keyOf(exercise)] === "terminal-workspace",
      );
      const moduleLoads = [];
      if (javaWork || terminalWork) {
        gradingProgress.update({
          detail: "Loading Java and terminal grading modules…",
          value: null,
        });
      }
      if (javaWork) {
        moduleLoads.push(
          loadJavaModule().then((module) => {
            javaModule = module;
          }),
        );
      }
      if (terminalWork) {
        moduleLoads.push(
          loadTerminalModule().then((module) => {
            terminalModule = module;
          }),
        );
      }
      const moduleResults = await Promise.allSettled(moduleLoads);
      const moduleLoadError = moduleResults.find(
        (result) => result.status === "rejected",
      );
      if (moduleLoadError) {
        // Individual rows below retain a readable per-question module error.
        gradingProgress.update({
          title: "Grading your exam",
          detail: `A specialized grader could not load: ${moduleLoadError.reason?.message || String(moduleLoadError.reason)}. Continuing with available checks…`,
          value: 39,
        });
      } else {
        gradingProgress.update({
          detail: "Specialized graders are ready. Checking each exam question…",
          value: 40,
        });
      }
      for (let questionIndex = 0; questionIndex < exs.length; questionIndex++) {
        const ex = exs[questionIndex];
        gradingProgress.update({
          detail: `Grading question ${questionIndex + 1} of ${exs.length}: ${ex.title || ex.id}`,
          value: 40 + (questionIndex / Math.max(1, exs.length)) * 48,
        });
        const key = keyOf(ex),
          a = st.answers[key];
        let ok = null;
        if (ex.type === "sql-query") {
          const g = sqlGrades.get(key) || {
            correct: false,
            error: "No SQL grading result was produced.",
          };
          ok = g.correct;
          rows.push({
            ex,
            ok,
            a,
            note:
              g.error ||
              (g.correct === true
                ? "SQL automatic checks passed."
                : g.correct === false
                  ? "The SQL result did not match the expected output."
                  : "This SQL question is not automatically graded."),
          });
        } else if (ex.type === "java-ex") {
          const submittedSource =
            typeof a === "string" ? a : String(ex.java?.preCode ?? "");
          if (!st.touched?.[key]) {
            ok = false;
            rows.push({
              ex,
              ok,
              a: submittedSource,
              note: "No Java answer was submitted; compilation was skipped.",
            });
          } else {
            try {
              if (!javaModule) javaModule = await loadJavaModule();
              const result = await javaModule.checkJavaExercise({
                exercise: ex,
                source: submittedSource,
              });
              ok = result.success === true;
              const checks = (result.checks || []).filter(
                (check) => check.feedback || !check.passed,
              );
              const javaScore = result.score || { earned: 0, total: 0 };
              rows.push({
                ex,
                ok,
                a: submittedSource,
                note:
                  `Java automatic checks: ${javaScore.earned ?? 0} / ${javaScore.total ?? 0} points` +
                  (checks.length
                    ? `\n${checks.map((check) => `${check.passed ? "\u2713" : "\u2717"} ${check.description}: ${check.feedback || (check.passed ? "Passed" : "Failed")}`).join("\n")}`
                    : ""),
              });
            } catch (error) {
              ok = false;
              rows.push({
                ex,
                ok,
                a: submittedSource,
                note: `Java grading failed: ${error?.message || String(error)}`,
              });
            }
          }
        } else if (ex.type === "terminal") {
          if (a !== "terminal-workspace") {
            ok = false;
            rows.push({
              ex,
              ok,
              a,
              note: "Terminal workspace was not opened during this exam.",
            });
          } else {
            try {
              if (!terminalModule) terminalModule = await loadTerminalModule();
              const result = await terminalModule.gradeTerminalAttempt({
                exercise: ex,
                packageId: ex.packageId,
                exerciseId: ex.id,
                attemptId: st.id,
              });
              ok = result.passed;
              const checks = (result.checks || []).filter(
                (check) => check.feedback || !check.passed,
              );
              rows.push({
                ex,
                ok,
                a,
                note:
                  `Terminal workspace: ${result.score} / ${result.maxScore} points` +
                  (checks.length
                    ? `\n${checks.map((check) => `${check.passed ? "\u2713" : "\u2717"} ${check.description}: ${check.feedback || (check.passed ? "Passed" : "Failed")}`).join("\n")}`
                    : ""),
              });
            } catch (error) {
              ok = false;
              rows.push({
                ex,
                ok,
                a,
                note: `Terminal grading failed: ${error?.message || String(error)}`,
              });
            }
          }
        } else {
          ok = gradeExerciseAnswer(ex, a);
          rows.push({
            ex,
            ok,
            a,
            note: ex.checkComment || ex.gradingComment || ex.feedback || "",
          });
        }
        if (ok !== null) {
          gradable++;
          if (ok) score++;
          await rec(ex, ok, "exam");
        }
        gradingProgress.update({
          detail: `Checked ${questionIndex + 1} of ${exs.length} exam questions.`,
          value: 40 + ((questionIndex + 1) / Math.max(1, exs.length)) * 48,
        });
      }

      // Preserve generated grading details and any authored exercise-level
      // check comment. A Set prevents repeating comments already used as the
      // primary feedback for self-check questions.
      gradingProgress.update({
        detail: "Preparing question feedback and exam history…",
        value: 90,
      });
      for (const row of rows) {
        const feedbackParts = [
          row.note,
          row.ex.checkComment,
          row.ex.gradingComment,
          row.ex.feedback,
        ]
          .filter((part) => typeof part === "string")
          .map((part) => part.trim())
          .filter(Boolean);
        row.note = [...new Set(feedbackParts)].join("\n\n");
      }

      const savedHistory = await kv.get("examHistory", []);
      const hist = Array.isArray(savedHistory) ? savedHistory : [];
      const questionSnapshots = rows.map((row) => {
        const key = keyOf(row.ex);
        const answered = Boolean(st.touched?.[key]);
        const answer =
          !answered || row.ex.type === "terminal"
            ? null
            : Array.isArray(row.a)
              ? row.a.slice()
              : row.a && typeof row.a === "object"
                ? JSON.parse(JSON.stringify(row.a))
                : row.a;
        const checkComment =
          row.note ||
          row.checkComment ||
          row.ex.checkComment ||
          row.ex.gradingComment ||
          row.ex.feedback ||
          "";
        return {
          id: key,
          packageId: row.ex.packageId,
          exerciseId: row.ex.id,
          title: row.ex.title,
          type: row.ex.type,
          answer,
          answered,
          visited: Boolean(st.visited?.[key]),
          flagged: Boolean(st.flags?.[key]),
          correct: row.ok,
          feedback: checkComment,
          explanation: row.ex.explanation || "",
        };
      });
      hist.push({
        date: Date.now(),
        ids: st.ids,
        score,
        total: gradable,
        cfg: st.cfg,
        questions: questionSnapshots,
      });
      gradingProgress.update({
        detail: "Saving the completed exam and achievement progress…",
        value: 96,
      });
      await kv.set("examHistory", hist);
      achOnExam({
        score,
        gradable,
        usedMs: st.startedAt ? Date.now() - st.startedAt : Infinity,
        limitMs: (st.cfg?.mins || 0) * 60000,
        answered: exs.filter((ex) => Boolean(st.touched[keyOf(ex)])).length,
        timedOut: autoSubmitted,
      });
      st.submitted = true;
      await discardExamState();
      gradingProgress.complete("Exam graded. Preparing your results…");
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
              r.note
                ? h(
                    "pre",
                    {
                      class:
                        r.ex.type === "terminal" || r.ex.type === "java-ex"
                          ? "exam-result-note"
                          : "err",
                    },
                    r.note,
                  )
                : "",
              r.ex.type === "terminal"
                ? h(
                    "div",
                    { class: "exam-answer-review" },
                    h("h3", {}, "Your answer"),
                    h(
                      "p",
                      {},
                      "The terminal workspace was graded from its final virtual filesystem state. The per-check result is shown above.",
                    ),
                  )
                : h(
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
                        h(
                          "pre",
                          {},
                          st.touched?.[keyOf(r.ex)]
                            ? answerText(r.ex, r.a)
                            : "No answer was submitted for this question.",
                        ),
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
        await historyView(),
      );
    } catch (error) {
      console.error("Exam grading failed:", error);
      gradingProgress.fail(
        `Exam grading could not finish: ${error?.message || String(error)}. Your latest saved exam checkpoint may be recoverable after reloading.`,
      );
      root.replaceChildren(
        h(
          "div",
          { class: "exam-grading card is-error", role: "alert" },
          gradingProgress.element,
          h(
            "p",
            {},
            "Reload the app to attempt recovery from the saved exam checkpoint.",
          ),
          h(
            "button",
            { type: "button", class: "sec", onclick: () => location.reload() },
            "Reload and recover",
          ),
        ),
      );
    }
  };
  const show = async (i) => {
    const generation = ++showGeneration;
    await disposeExerciseViews(body);
    if (done || generation !== showGeneration) return;
    const key = keyOf(exs[i]);
    st.cur = i;
    st.visited[key] = true;
    save();
    const flagControl = h(
      "label",
      { class: "exercise-review-flag" },
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
    );
    body.replaceChildren(
      h(
        "div",
        { class: "exercise-question-kicker" },
        h("span", {}, `QUESTION ${String(i + 1).padStart(2, "0")}`),
        h("span", {}, `of ${exs.length}`),
      ),
      qView(
        exs[i],
        "exam",
        () => st.answers[key],
        (v, meta = {}) => {
          st.answers[key] = v;
          if (meta.source === "user") st.touched[key] = true;
          save();
          updateQuestionStatus();
        },
        () => {},
        null,
        () => true,
        st.id,
        [flagControl],
      ),
      h(
        "div",
        { class: "exercise-question-navigation" },
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
      flagged = 0,
      visited = 0;
    exs.forEach((exercise, i) => {
      const key = keyOf(exercise),
        hasAnswer = Boolean(st.touched[key]);
      if (hasAnswer) answered++;
      if (st.visited[key]) visited++;
      if (st.flags[key]) flagged++;
      const button = nav.children[i];
      if (button) {
        button.classList.toggle("answered", hasAnswer);
        button.classList.toggle("visited", !!st.visited[key]);
        button.classList.toggle("flagged", !!st.flags[key]);
        button.classList.toggle("current", i === st.cur);
        button.setAttribute("aria-current", i === st.cur ? "step" : "false");
        button.setAttribute(
          "aria-label",
          `Question ${i + 1}${st.visited[key] ? ", visited" : ", not visited"}${hasAnswer ? ", answered" : ", unanswered"}${st.flags[key] ? ", flagged for review" : ""}`,
        );
      }
    });
    progress.value = answered;
    summary.textContent = `${visited} visited \u00B7 ${answered} answered \u00B7 ${flagged} flagged for review`;
  };
  const drawNav = () => {
    nav.replaceChildren(
      ...exs.map((e, i) =>
        h(
          "button",
          {
            class: "exercise-index-button",
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
  // Click/tap (or Enter/Space) the timer to blur the time; again to reveal it.
  const timerCard = h(
    "div",
    {
      class: "exam-timer-card",
      role: "button",
      tabindex: "0",
      "aria-pressed": "false",
      title: "Click to hide or show the time",
    },
    h("span", { class: "exam-timer-label" }, "TIME LEFT"),
    timer,
    h(
      "span",
      { class: "exam-timer-hint", "aria-hidden": "true" },
      "Tap to show",
    ),
  );
  const toggleTimerBlur = () =>
    timerCard.setAttribute(
      "aria-pressed",
      String(timerCard.classList.toggle("is-blurred")),
    );
  timerCard.addEventListener("click", toggleTimerBlur);
  timerCard.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    toggleTimerBlur();
  });
  top.append(
    h(
      "div",
      { class: "exam-heading" },
      h("p", { class: "eyebrow" }, "EXAM IN PROGRESS"),
      h("h1", {}, "Stay focused. You\u2019ve got this."),
      h("p", {}, "Your work saves automatically as you answer."),
    ),
    h(
      "div",
      { class: "exam-status" },
      timerCard,
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
                  "Submit your answers now? You won\u2019t be able to change them afterward.",
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
