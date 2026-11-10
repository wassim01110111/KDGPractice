"use strict";

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
// Older manifests may omit learning package IDs. New manifests should set
// `packageId` on each learning term (or on its subject entry); that value is
// matched against the package's own packageId, not the manifest package-group key.
const LEGACY_LEARNING_PACKAGE_IDS = Object.freeze({
  sql: "sql-relational-learning-term-1",
  os: "os-learning-term-1",
});

// Learning and Canvas Markdown articles share the same progress UI and path-session
// contract. Exercise completion reuses the same XP keys as Practice/Progress; the
// separate "section reviewed" checklist is saved through the existing IndexedDB store.
async function enhanceLearningProgress(
  body,
  term,
  subject,
  context = "learning",
) {
  if (!body || !term?.file) return;
  const allHeadings = [...body.querySelectorAll("h2")];
  // The guided Learning articles use explicit "Section ..." headings. Canvas
  // articles are less prescriptive: they may use ordinary Markdown headings,
  // or they may contain only Try exercise links. Never let heading wording (or
  // the absence of headings) suppress the Canvas progress UI.
  let headings =
    context === "canvas"
      ? [...allHeadings]
      : allHeadings.filter((heading) =>
          heading.textContent.trim().startsWith("Section "),
        );

  const exerciseFromPracticeHref = (href, label = "") => {
    const match = String(href || "").match(/#\/practice\/([^/?#]+)\/([^/?#]+)/);
    if (!match) return null;
    try {
      const packageId = decodeURIComponent(match[1]);
      const exerciseId = decodeURIComponent(match[2]);
      const existing = S.exercises.find(
        (exercise) =>
          exercise.packageId === packageId && exercise.id === exerciseId,
      );
      // Keep a route record even if the package has not finished loading yet.
      // The exercise itself will still be resolved by Practice when the route
      // opens; the route IDs are sufficient to preserve path order meanwhile.
      return (
        existing || {
          packageId,
          id: exerciseId,
          title: String(label || exerciseId).trim(),
          key: JSON.stringify([packageId, exerciseId]),
        }
      );
    } catch {
      return null;
    }
  };

  const canvasLinks =
    context === "canvas"
      ? [...body.querySelectorAll('a[href*="#/practice/"]')]
      : [];
  const linkedCanvasExercises = [
    ...new Map(
      canvasLinks
        .map((link) =>
          exerciseFromPracticeHref(link.getAttribute("href"), link.textContent),
        )
        .filter(Boolean)
        .map((exercise) => [`${exercise.packageId}::${exercise.id}`, exercise]),
    ).values(),
  ];

  if (context === "canvas" && !headings.length) {
    // A single fallback module gives link-only Canvas Markdown a real section
    // anchor for its progress card and review state.
    const fallbackHeading = h("h2", {}, "Canvas exercises");
    const documentTitle = body.querySelector("h1");
    if (documentTitle) documentTitle.after(fallbackHeading);
    else body.prepend(fallbackHeading);
    headings = [fallbackHeading];
  }
  if (!headings.length) return;

  const storageKey = `learning-complete:${term.file}`;
  const stored = await kv.get(storageKey, []);
  const completed = new Set(Array.isArray(stored) ? stored : []);
  const learningPackageId =
    term?.packageId ??
    term?.exercisePackageId ??
    subject?.packageId ??
    subject?.exercisePackageId ??
    LEGACY_LEARNING_PACKAGE_IDS[subject?.id] ??
    linkedCanvasExercises[0]?.packageId;
  const packageExercises = (
    context === "canvas" && linkedCanvasExercises.length
      ? linkedCanvasExercises.filter((exercise) => !exercise.mockExam)
      : learningPackageId
        ? S.exercises.filter(
            (exercise) =>
              !exercise.mockExam && exercise.packageId === learningPackageId,
          )
        : []
  ).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  // Assign every Canvas link to the closest preceding h2. This works for
  // standalone HTML exercise-button lines, links inside paragraphs/lists, and
  // ordinary Markdown section titles. The document's link order is retained.
  const canvasExercisesByHeading = new Map(
    headings.map((heading) => [heading, []]),
  );
  if (context === "canvas") {
    const seenCanvasExercises = new Set();
    for (const link of canvasLinks) {
      const exercise = exerciseFromPracticeHref(
        link.getAttribute("href"),
        link.textContent,
      );
      if (!exercise) continue;
      const routeKey = `${exercise.packageId}::${exercise.id}`;
      if (seenCanvasExercises.has(routeKey)) continue;
      seenCanvasExercises.add(routeKey);

      let owner = headings[0];
      for (const heading of headings) {
        const relation = heading.compareDocumentPosition(link);
        if (relation & Node.DOCUMENT_POSITION_FOLLOWING) owner = heading;
        else if (relation & Node.DOCUMENT_POSITION_PRECEDING) break;
      }
      canvasExercisesByHeading.get(owner)?.push(exercise);
    }
  }

  const solved = new Set(Object.keys(S.xpRewards || {}));
  const modules = headings.map((heading, index) => {
    const sectionNumber = String(index + 1).padStart(2, "0");
    const sectionId = `s${sectionNumber}`;
    // SQL exercises traditionally start with "s01-"; OS exercises use
    // "os-learning-s01-001". Prefer explicit category/ID matching for Learning.
    const linkedSectionExercises =
      context === "canvas" ? canvasExercisesByHeading.get(heading) || [] : [];
    const exercises =
      context === "canvas" && linkedCanvasExercises.length
        ? linkedSectionExercises
        : context === "canvas"
          ? packageExercises.filter((exercise) => {
              const category = String(exercise.category || "");
              const categoryMatches = new RegExp(
                `^Section\\s+${sectionNumber}\\b`,
                "i",
              ).test(category);
              const id = String(exercise.id || "");
              const idMatches =
                new RegExp(`(?:^|-)s${sectionNumber}-`).test(id) ||
                new RegExp(`(?:^|-)t\\d+-${sectionNumber}-\\d+$`).test(id);
              return categoryMatches || idMatches;
            })
          : packageExercises.filter((exercise) => {
              const category = String(exercise.category || "");
              const categoryMatches = new RegExp(
                `^Section\\s+${sectionNumber}\\b`,
                "i",
              ).test(category);
              const id = String(exercise.id || "");
              const idMatches =
                new RegExp(`(?:^|-)s${sectionNumber}-`).test(id) ||
                new RegExp(`(?:^|-)t\\d+-${sectionNumber}-\\d+$`).test(id);
              return categoryMatches || idMatches;
            });
    return { heading, sectionId, exercises, index };
  });
  const pathExercises = modules.flatMap((pathModule) =>
    pathModule.exercises.map((pathExercise) => ({
      packageId: pathExercise.packageId,
      exerciseId: pathExercise.id,
      sectionId: pathModule.sectionId,
    })),
  );
  const saveLearningPathSession = (exercise) => {
    try {
      localStorage.setItem(
        "learning-path-session",
        JSON.stringify({
          termFile: term.file,
          context,
          packageId: learningPackageId,
          exercises: pathExercises,
          completedSectionIds: [...completed],
          currentExerciseId: exercise.id,
          startedAt: Date.now(),
        }),
      );
    } catch (error) {
      console.warn("Could not save learning path position:", error);
    }
  };
  // Canvas content often links directly to Practice via try-exercise buttons.
  // Preserve the section order for those links too, not only for links generated
  // by the progress cards above.
  body.addEventListener(
    "click",
    (event) => {
      const link = event.target?.closest?.('a[href*="#/practice/"]');
      if (!link || !body.contains(link)) return;
      const exercise = exerciseFromPracticeHref(
        link.getAttribute("href"),
        link.textContent,
      );
      if (
        exercise &&
        pathExercises.some(
          (item) =>
            item.packageId === exercise.packageId &&
            item.exerciseId === exercise.id,
        )
      )
        saveLearningPathSession(exercise);
    },
    true,
  );
  const totalExercises = modules.reduce(
    (sum, module) => sum + module.exercises.length,
    0,
  );
  const totalSolved = modules.reduce(
    (sum, module) =>
      sum +
      module.exercises.filter((exercise) => solved.has(keyOf(exercise))).length,
    0,
  );
  const totalComplete = modules.filter((module) =>
    completed.has(module.sectionId),
  ).length;
  const overall = h(
    "section",
    { class: "learning-overview", "aria-label": "Learning progress" },
    h(
      "div",
      { class: "learning-overview-heading" },
      h(
        "div",
        {},
        h(
          "span",
          { class: "learning-kicker" },
          context === "canvas" ? "YOUR CANVAS PATH" : "YOUR LEARNING PATH",
        ),
        h(
          "h2",
          {},
          `${term.label || (context === "canvas" ? "Canvas" : "Term 1")} progress`,
        ),
        h(
          "p",
          { class: "learning-overview-subtitle" },
          "Exercise clears and reviewed sections are tracked separately.",
        ),
      ),
      h(
        "div",
        { class: "learning-overview-percent", "aria-live": "polite" },
        `${totalExercises ? Math.round((totalSolved / totalExercises) * 100) : 0}%`,
      ),
    ),
    h(
      "div",
      { class: "learning-overview-metrics" },
      h(
        "div",
        { class: "learning-metric" },
        h(
          "strong",
          { class: "learning-solved-count" },
          `${totalSolved}/${totalExercises}`,
        ),
        h("span", {}, "Exercises solved"),
      ),
      h(
        "div",
        { class: "learning-metric" },
        h(
          "strong",
          { class: "learning-complete-count" },
          `${totalComplete}/${modules.length}`,
        ),
        h("span", {}, "Sections reviewed"),
      ),
    ),
    h("progress", {
      class: "learning-overview-bar",
      max: Math.max(totalExercises, 1),
      value: totalSolved,
      "aria-label": "Exercise completion",
    }),
    h(
      "div",
      { class: "learning-overview-foot" },
      "Correct answers are counted from your saved practice history. Review checkmarks remain saved on this device.",
    ),
  );

  // Keep the progress summary and one course-wide resume action at the very top.
  // Resume scans sections in document order, skipping reviewed sections and
  // selecting the first unsolved exercise in the first eligible section.
  const firstResumeTarget = () => {
    for (const module of modules) {
      if (completed.has(module.sectionId)) continue;
      const exercise = module.exercises.find(
        (item) => !solved.has(keyOf(item)),
      );
      if (exercise) return { module, exercise };
    }
    return null;
  };
  const hasAnyLearningProgress = () =>
    modules.some(
      (module) =>
        module.exercises.some((exercise) => {
          const key = keyOf(exercise);
          return (
            solved.has(key) ||
            S.attempts.some((attempt) => attempt.key === key) ||
            Object.prototype.hasOwnProperty.call(S.drafts, key)
          );
        }) || completed.has(module.sectionId),
    );
  const courseResume = h("a", {
    class: "learning-continue-button learning-course-continue",
    "aria-label":
      context === "canvas"
        ? "Continue the Canvas path from the first unfinished section and exercise"
        : "Continue the learning path from the first unfinished section and exercise",
  });
  const syncCourseResume = () => {
    const target = firstResumeTarget();
    if (target) {
      courseResume.href = `#/practice/${encodeURIComponent(target.exercise.packageId)}/${encodeURIComponent(target.exercise.id)}`;
      courseResume.classList.remove("is-disabled");
      courseResume.removeAttribute("aria-disabled");
      const actionLabel = context === "canvas" ? "canvas" : "learning";
      courseResume.textContent = hasAnyLearningProgress()
        ? `Continue ${actionLabel} \u2192`
        : `Start ${actionLabel} \u2192`;
      courseResume.onclick = () => saveLearningPathSession(target.exercise);
      courseResume.title = `Section ${String(target.module.index + 1).padStart(2, "0")} \u00B7 ${target.exercise.title}`;
    } else {
      courseResume.removeAttribute("href");
      courseResume.classList.add("is-disabled");
      courseResume.setAttribute("aria-disabled", "true");
      courseResume.textContent =
        context === "canvas"
          ? "Canvas path completed"
          : "Learning path completed";
      courseResume.onclick = (event) => event.preventDefault();
      courseResume.title =
        "Every section is reviewed or every exercise is complete.";
    }
  };
  overall.querySelector(".learning-overview-heading").append(courseResume);
  body.prepend(overall);
  syncCourseResume();
  const refreshOverview = () => {
    const solvedNow = modules.reduce(
      (sum, module) =>
        sum +
        module.exercises.filter((exercise) => solved.has(keyOf(exercise)))
          .length,
      0,
    );
    overall.querySelector(".learning-solved-count").textContent =
      `${solvedNow}/${totalExercises}`;
    overall.querySelector(".learning-complete-count").textContent =
      `${modules.filter((module) => completed.has(module.sectionId)).length}/${modules.length}`;
    overall.querySelector(".learning-overview-percent").textContent =
      `${totalExercises ? Math.round((solvedNow / totalExercises) * 100) : 0}%`;
    overall.querySelector(".learning-overview-bar").value = solvedNow;
  };

  for (const module of modules) {
    const { heading, sectionId, exercises, index } = module;
    heading.classList.add("learning-module-heading");
    const solvedCount = exercises.filter((exercise) =>
      solved.has(keyOf(exercise)),
    ).length;
    const progress = h("progress", {
      class: "learning-module-bar",
      max: Math.max(exercises.length, 1),
      value: solvedCount,
      "aria-label": `Section ${index + 1} exercise progress`,
    });
    const status = h(
      "span",
      { class: "learning-module-status" },
      `${solvedCount}/${exercises.length} exercises solved`,
    );
    const firstUncompletedExercise = exercises.find(
      (exercise) => !solved.has(keyOf(exercise)),
    );
    let sectionReviewed = completed.has(sectionId);
    let canContinue = !sectionReviewed && Boolean(firstUncompletedExercise);
    const hasProgress = exercises.some((exercise) => {
      const exerciseKey = keyOf(exercise);
      return (
        solved.has(exerciseKey) ||
        S.attempts.some((attempt) => attempt.key === exerciseKey) ||
        Object.prototype.hasOwnProperty.call(S.drafts, exerciseKey)
      );
    });
    const continueLabel = hasProgress
      ? "Continue \u2192"
      : "Start section \u2192";
    const continueControl = h(
      "a",
      {
        class: "learning-continue-button" + (canContinue ? "" : " is-disabled"),
        ...(canContinue
          ? {
              href: `#/practice/${encodeURIComponent(firstUncompletedExercise.packageId)}/${encodeURIComponent(firstUncompletedExercise.id)}`,
            }
          : {}),
        "aria-disabled": String(!canContinue),
        "aria-label": `${hasProgress ? "Continue" : "Start"} Section ${String(index + 1).padStart(2, "0")} at its first unsolved exercise`,
        tabindex: canContinue ? "0" : "-1",
        title: canContinue
          ? ""
          : sectionReviewed
            ? "This section is marked as reviewed."
            : exercises.length
              ? "All exercises in this section are solved."
              : "No exercises are available in this section.",
        onclick: (event) => {
          if (!canContinue) {
            event.preventDefault();
            return;
          }
          saveLearningPathSession(firstUncompletedExercise);
        },
      },
      canContinue
        ? continueLabel
        : sectionReviewed
          ? "Section reviewed"
          : exercises.length
            ? "All solved"
            : "Unavailable",
    );
    const syncContinueControl = () => {
      canContinue = !sectionReviewed && Boolean(firstUncompletedExercise);
      continueControl.classList.toggle("is-disabled", !canContinue);
      continueControl.setAttribute("aria-disabled", String(!canContinue));
      if (canContinue) {
        continueControl.setAttribute(
          "href",
          `#/practice/${encodeURIComponent(firstUncompletedExercise.packageId)}/${encodeURIComponent(firstUncompletedExercise.id)}`,
        );
        continueControl.setAttribute("tabindex", "0");
        continueControl.textContent = continueLabel;
        continueControl.removeAttribute("title");
      } else {
        continueControl.removeAttribute("href");
        continueControl.setAttribute("tabindex", "-1");
        continueControl.textContent = sectionReviewed
          ? "Section reviewed"
          : exercises.length
            ? "All solved"
            : "Unavailable";
        continueControl.title = sectionReviewed
          ? "This section is marked as reviewed."
          : exercises.length
            ? "All exercises in this section are solved."
            : "No exercises are available in this section.";
      }
    };
    const toggle = h(
      "button",
      {
        type: "button",
        class:
          "learning-complete-toggle" + (sectionReviewed ? " is-complete" : ""),
        "aria-pressed": String(sectionReviewed),
        onclick: async () => {
          if (completed.has(sectionId)) completed.delete(sectionId);
          else completed.add(sectionId);
          sectionReviewed = completed.has(sectionId);
          toggle.classList.toggle("is-complete", sectionReviewed);
          toggle.setAttribute("aria-pressed", String(sectionReviewed));
          toggle.textContent = sectionReviewed
            ? "\u2713 Section reviewed"
            : "Mark section reviewed";
          syncContinueControl();
          await kv.set(storageKey, [...completed]);
          syncCourseResume();
          refreshOverview();
        },
      },
      sectionReviewed ? "\u2713 Section reviewed" : "Mark section reviewed",
    );
    const moduleActions = h(
      "div",
      { class: "learning-module-actions" },
      continueControl,
      toggle,
    );
    const exerciseLinks = exercises.length
      ? h(
          "details",
          { class: "learning-exercise-list" },
          h(
            "summary",
            {},
            `Open ${exercises.length} exercises in this section`,
          ),
          h(
            "ol",
            {},
            ...exercises.map((exercise) => {
              const done = solved.has(keyOf(exercise));
              const readableTitle =
                exercise.title.split(" \u00B7 ").slice(2).join(" \u00B7 ") ||
                exercise.title;
              return h(
                "li",
                {},
                h(
                  "a",
                  {
                    href: `#/practice/${encodeURIComponent(exercise.packageId)}/${encodeURIComponent(exercise.id)}`,
                    onclick: () => saveLearningPathSession(exercise),
                  },
                  readableTitle,
                ),
                h(
                  "span",
                  {
                    class: done
                      ? "learning-exercise-done"
                      : "learning-exercise-open",
                  },
                  done ? "Solved" : "Not solved",
                ),
              );
            }),
          ),
        )
      : h(
          "p",
          { class: "learning-no-exercises" },
          "The exercise package is not loaded. Check the manifest integration notes.",
        );
    const card = h(
      "section",
      {
        class: "learning-module-progress",
        "aria-label": `Section ${index + 1} progress`,
      },
      h(
        "div",
        { class: "learning-module-progress-top" },
        h(
          "div",
          {},
          h("strong", {}, `Section ${String(index + 1).padStart(2, "0")}`),
          status,
        ),
        moduleActions,
      ),
      progress,
      exerciseLinks,
    );
    heading.after(card);
  }
  refreshOverview();
}

const LIBRARY_VIEWS = {
  reader: {
    key: "referenceFiles",
    route: "reader",
    eyebrow: "STUDY LIBRARY",
    title: "Quick Summaries",
    intro: "Choose a subject to browse its guide.",
    empty: "No summary files configured.",
    noun: "summary",
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
  learning: {
    key: "learningFiles",
    route: "learning",
    eyebrow: "GUIDED CURRICULUM",
    title: "Learning",
    intro: "Follow a progressive path and track each section as you learn.",
    empty: "No learning paths configured.",
    noun: "learning path",
  },
};
const pageReader = (root, arg, term) =>
  pageLibrary(root, arg, term, LIBRARY_VIEWS.reader);
const pageCanvas = (root, arg, term) =>
  pageLibrary(root, arg, term, LIBRARY_VIEWS.canvas);
const pageLearning = (root, arg, term) =>
  pageLibrary(root, arg, term, LIBRARY_VIEWS.learning);

function pageMockExam(root, subjectArg = "") {
  const subjects = S.manifest?.mockExamFiles || [];
  if (!subjects.length) {
    return root.append(
      empty(
        "No mock exams configured.",
        "Add mockExamFiles entries to the content manifest to make mock exams available.",
      ),
    );
  }

  const current =
    subjects.find((subject) => subject.id === subjectArg) || subjects[0];
  let termIndex = 0;
  const subjectLabel = (subject) =>
    subject.title ||
    globalThis.Core.initcap(String(subject.id).replace(/[-_]+/g, " "));
  const subjectTabs = h(
    "nav",
    { class: "reference-tabs", "aria-label": "Choose a mock exam subject" },
    subjects.map((subject) =>
      h(
        "a",
        {
          href: `#/mock-exam/${encodeURIComponent(subject.id)}`,
          class: "reference-tab" + (subject.id === current.id ? " on" : ""),
          "aria-current": subject.id === current.id ? "page" : false,
        },
        h("strong", {}, subjectLabel(subject)),
      ),
    ),
  );

  const termCount = current.terms.length;
  if (!termCount) {
    root.append(
      h(
        "section",
        { class: "reference-heading" },
        h(
          "div",
          {},
          h("p", { class: "eyebrow" }, "MOCK EXAMS"),
          h("h1", {}, "Mock Exam"),
          h(
            "p",
            { class: "reference-intro" },
            `${subjectLabel(current)} has no terms configured.`,
          ),
        ),
        subjectTabs,
      ),
    );
    return;
  }

  const content = h("article", { class: "md mock-exam-list" });
  const termThumb = h("span", { class: "term-thumb", "aria-hidden": "true" });
  const termPos = h("span", {
    class: "term-picker-pos",
    "aria-hidden": "true",
  });
  const termPills = h("div", {
    class: "term-pills",
    role: "tablist",
    "aria-label": "Mock exam term",
    onkeydown: (event) => {
      const step =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (event.key === "Home" || event.key === "End" || step) {
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? termCount - 1
              : (termIndex + step + termCount) % termCount;
        renderTerm(next);
        termPills.children[next + 1]?.focus({ preventScroll: true });
      }
    },
  });
  const termPicker = h(
    "div",
    { class: "term-picker", "data-n": String(termCount) },
    h("span", { class: "term-picker-label" }, "TERM"),
    termPos,
    h("div", { class: "term-frame" }, termPills),
  );
  const examList = h("div", { class: "exam-history-list mock-exam-cards" });

  const syncTermPicker = () => {
    const active = termPills.querySelector(".term-pill.on");
    termPos.textContent = `${termIndex + 1} / ${termCount}`;
    if (!active?.offsetWidth) return;
    termPills.style.setProperty("--thumb-x", `${active.offsetLeft}px`);
    termPills.style.setProperty("--thumb-w", `${active.offsetWidth}px`);
    if (!termPills.classList.contains("is-ready")) {
      void termPills.offsetWidth;
      termPills.classList.add("is-ready");
    }
  };

  const renderTerm = (nextIndex) => {
    termIndex = Math.max(0, Math.min(termCount - 1, nextIndex));
    termPills.replaceChildren(
      termThumb,
      ...current.terms.map((term, index) =>
        h(
          "button",
          {
            type: "button",
            role: "tab",
            class: "term-pill" + (index === termIndex ? " on" : ""),
            "aria-selected": String(index === termIndex),
            tabindex: index === termIndex ? "0" : "-1",
            onclick: () => renderTerm(index),
          },
          term.label,
        ),
      ),
    );
    const term = current.terms[termIndex];
    const exams = Array.isArray(term.exams) ? term.exams : [];
    examList.replaceChildren(
      ...(exams.length
        ? exams.map((exam, examIndex) => {
            const exercises = exam.path
              ? S.exercises.filter(
                  (exercise) => exercise.sourceFile === exam.path,
                )
              : [];
            const validTime = Number.isFinite(exam.time) && exam.time > 0;
            const available = exercises.length > 0 && validTime;
            const status = !exam.path
              ? "The package file path is empty or invalid."
              : !exercises.length
                ? "The package could not be loaded or contains no exercises."
                : !validTime
                  ? "Set a positive time value (in minutes) in the manifest."
                  : `${exercises.length} questions · ${exam.time} minutes`;
            return h(
              "section",
              { class: "exam-setup-card card" },
              h(
                "div",
                { class: "exam-setup-heading" },
                h(
                  "p",
                  { class: "eyebrow" },
                  `MOCK EXAM ${String(examIndex + 1).padStart(2, "0")}`,
                ),
                h("h2", {}, exam.title),
                h("p", {}, status),
              ),
              h(
                "div",
                { class: "exam-config-summary" },
                h("strong", {}, `${exercises.length} questions`),
                h(
                  "span",
                  {},
                  validTime ? `${exam.time} minutes` : "Duration unavailable",
                ),
              ),
              h(
                "div",
                { class: "exam-setup-footer" },
                h(
                  "button",
                  {
                    type: "button",
                    class: "exam-start-button",
                    disabled: !available,
                    onclick: () => {
                      const request = {
                        type: "mock-exam",
                        subjectId: current.id,
                        termIndex,
                        examIndex,
                        launchId: Date.now(),
                      };
                      location.hash = `#/exam/${encodeURIComponent(JSON.stringify(request))}`;
                    },
                  },
                  h("span", { "aria-hidden": "true" }, "▶"),
                  " Start mock exam",
                ),
              ),
            );
          })
        : [
            h(
              "p",
              { class: "exam-history-empty" },
              "No mock exam files are configured for this term.",
            ),
          ]),
    );
    syncTermPicker();
  };

  const heading = h(
    "section",
    { class: "reference-heading" },
    h(
      "div",
      {},
      h("p", { class: "eyebrow" }, "MOCK EXAMS"),
      h("h1", {}, "Mock Exam"),
      h(
        "p",
        { class: "reference-intro" },
        "Choose a subject and term, then start a timed exam containing every exercise.",
      ),
    ),
    subjectTabs,
    termPicker,
  );
  const sidebar = h(
    "aside",
    { class: "reference-sidebar", "aria-label": "Mock exam information" },
    h("h2", {}, subjectLabel(current)),
    h("p", {}, "Those are a list of mock exams done during class."),
  );
  content.append(examList);
  root.append(
    heading,
    h("div", { class: "reference-layout" }, sidebar, content),
  );
  renderTerm(0);
}

// Shared by the Summaries and Canvas pages. Each subject has several terms
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
          "\u00D7",
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
          "\u2191",
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
          "\u2193",
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
      h("span", { "aria-hidden": "true" }, "\u2315"),
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
        h("strong", {}, globalThis.Core.initcap(r.id)),
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
    frameObjectUrl = null,
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
  let searchViewportFrame = 0;
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
  const scheduleSearchPanelViewportSync = () => {
    if (searchViewportFrame) return;
    searchViewportFrame = requestAnimationFrame(() => {
      searchViewportFrame = 0;
      syncSearchPanelToViewport();
    });
  };
  viewport?.addEventListener("resize", scheduleSearchPanelViewportSync, {
    passive: true,
  });
  viewport?.addEventListener("scroll", scheduleSearchPanelViewportSync, {
    passive: true,
  });
  addEventListener("scroll", scheduleSearchPanelViewportSync, {
    passive: true,
  });
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
    if (frameObjectUrl) {
      URL.revokeObjectURL(frameObjectUrl);
      frameObjectUrl = null;
    }
    currentDoc = document;
  };
  readerSearchCleanup = () => {
    viewport?.removeEventListener("resize", scheduleSearchPanelViewportSync);
    viewport?.removeEventListener("scroll", scheduleSearchPanelViewportSync);
    removeEventListener("scroll", scheduleSearchPanelViewportSync);
    if (searchViewportFrame) cancelAnimationFrame(searchViewportFrame);
    searchViewportFrame = 0;
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
    const r = await fetchAppResource("content/" + term.file);
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
    if (view.route === "learning" || view.route === "canvas")
      await enhanceLearningProgress(body, term, cur, view.route);
    return toc;
  };
  // An .html canvas runs in an iframe, so its own CSS and JS execute normally
  // without touching (or being touched by) the rest of the app.
  const loadHtml = async (term, token) => {
    const resourceUrl = appResourceUrl("content/" + term.file);
    const r = await fetchAppResource("content/" + term.file);
    if (!r.ok) throw new Error("HTTP " + r.status);
    if (token !== loadToken) return null;

    const f = h("iframe", {
      class: "canvas-frame",
      title: `${cur.title} \u2013 ${term.label}`,
    });
    if (r.headers.has("X-ACS-Cache-Time")) {
      // A cached response cannot be assigned to an iframe URL directly. Load
      // its body into a Blob and restore the source URL as <base> so relative
      // images/scripts/styles continue resolving to their original locations.
      const source = await r.text();
      if (token !== loadToken) return null;
      const parsed = new DOMParser().parseFromString(source, "text/html");
      if (!parsed.querySelector("base[href]")) {
        const baseElement = parsed.createElement("base");
        baseElement.href = resourceUrl;
        parsed.head.prepend(baseElement);
      }
      // Retain the document's HTTP content-security policy when available.
      const policy = r.headers.get("Content-Security-Policy");
      if (policy) {
        const policyMeta = parsed.createElement("meta");
        policyMeta.httpEquiv = "Content-Security-Policy";
        policyMeta.content = policy;
        parsed.head.prepend(policyMeta);
      }
      const htmlSource = "<!doctype html>\n" + parsed.documentElement.outerHTML;
      frameObjectUrl = URL.createObjectURL(
        new Blob([htmlSource], { type: "text/html" }),
      );
      f.src = frameObjectUrl;
    } else {
      // Preserve the original URL/location behavior for normal online loads.
      r.body?.cancel?.();
      f.src = resourceUrl;
    }
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
    body.replaceChildren(loadingNote("Loading reference content…"));
    // If the next page is slow, stop hiding the card so "Loading\u2026" shows.
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
