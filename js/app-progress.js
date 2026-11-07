"use strict";

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
      title: "The Academic Industrial Complex",
      detail: "Solve 500 exercises",
      count: solved.length,
      target: 500,
    },
    {
      title: "Please Go Outside",
      detail: "Solve 1,000 exercises",
      count: solved.length,
      target: 1000,
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
      title: "Rent Is Due in XP",
      detail: "Earn 10,000 XP",
      count: xp,
      target: 10000,
    },
    {
      title: "The XP Hoarding Problem",
      detail: "Earn 25,000 XP",
      count: xp,
      target: 25000,
    },
    {
      title: "Exam Factory",
      detail: "Complete 100 exams",
      count: examHistory.length,
      target: 100,
    },
    {
      title: "Perfectly Unemployed in Other Hobbies",
      detail: "Get 25 perfect exam scores",
      count: perfectExams,
      target: 25,
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
    a.icon ??= "\u{1F3C6}";
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
  // Study-habit chips come from the same counters the achievements use.
  const habit = S.stats || {};
  const todayKey = achYmd(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const streakNow =
    habit.lastDay === todayKey || habit.lastDay === achYmd(yesterdayDate)
      ? Number(habit.dayStreak) || 0
      : 0;
  const fmtDuration = (seconds) => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0)),
      hours = Math.floor(total / 3600),
      minutes = Math.floor((total % 3600) / 60);
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
  };
  const levelChip = (icon, text, title) =>
    h(
      "span",
      { class: "level-chip", title: title || null },
      h("span", { "aria-hidden": "true" }, icon),
      text,
    );
  const habitChips = h(
    "div",
    { class: "level-chips", "aria-label": "Study habits" },
    levelChip(
      "\u{1F525}",
      streakNow
        ? `${streakNow}-day streak`
        : "No active streak",
      `Best streak: ${Number(habit.bestDayStreak) || 0} day(s)`,
    ),
    levelChip(
      "\u{1F4C5}",
      `${Number(habit.totalDays) || 0} study day${(Number(habit.totalDays) || 0) === 1 ? "" : "s"}`,
    ),
    levelChip(
      "\u23F1",
      `${fmtDuration(habit.activeSeconds)} active`,
      "Time spent actively using the app",
    ),
    levelChip(
      "\u{1F3AF}",
      `${solved.length} / ${ex.length} solved`,
      "Unique exercises cleared across all courses",
    ),
  );
  const hero = h(
    "section",
    { class: "level-card" },
    h("div", { class: "level-emblem", "aria-hidden": "true" }, "L" + level),
    h(
      "div",
      { class: "level-info" },
      h("p", { class: "eyebrow" }, "ACADEMIC RECORD \u00B7 XP RANK"),
      h("h1", {}, `${academicRank} \u00B7 Level ${level}`),
      h(
        "p",
        {},
        `${xp} XP earned \u00B7 ${250 - levelXp} XP to level ${level + 1}`,
      ),
      h("progress", {
        class: "xp-progress",
        max: 250,
        value: levelXp,
        "aria-label": `${levelXp} of 250 XP toward level ${level + 1}`,
      }),
      h("small", {}, `${levelXp} / 250 XP`),
      habitChips,
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
            h(
              "small",
              {},
              `${completed} / ${total} mastered \u00B7 ${percentage}%`,
            ),
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
  const TIER_ORDER = [
    "bronze",
    "silver",
    "gold",
    "platinum",
    "shame",
    "wassim",
    "secret",
  ];
  const TIER_NAMES = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    shame: "Shame",
    wassim: "Wassim",
    secret: "Secret",
  };
  // A locked secret achievement keeps its real tier hidden until it is earned.
  const tierOf = (a) =>
    a.secret && a.count < a.target
      ? "secret"
      : TIER_ORDER.includes(a.tier)
        ? a.tier
        : "silver";
  const ratioOf = (a) => (a.target ? Math.min(1, a.count / a.target) : 0);
  const unlockedAt = (a) => Number(S.achUnlocked?.[a.id]) || 0;
  // Several achievements credited in one go (the first-run catch-up) share one
  // timestamp, so that date says nothing about when they were actually earned.
  const bulkTimes = (() => {
    const tally = new Map();
    for (const a of achievements) {
      const t = unlockedAt(a);
      if (t) tally.set(t, (tally.get(t) || 0) + 1);
    }
    return new Set([...tally].filter(([, n]) => n > 3).map(([t]) => t));
  })();
  const fmtDate = (t) => {
    const d = new Date(t),
      today = new Date(),
      yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
    });
  };
  const nextMilestone = h("span", { class: "next-milestone" }, ""),
    achCount = h("span", {}, ""),
    achSummary = h("div", { class: "achievement-summary" }),
    achTierBar = h("div", {
      class: "achievement-tiers",
      role: "group",
      "aria-label": "Filter achievements by tier",
    }),
    achRecent = h("div", { class: "achievement-latest-row" }),
    achEmpty = h("div", { class: "empty", hidden: true }, "No achievements in this tier yet."),
    panel = h("div"),
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
  let course = "",
    achTier = "";
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
    // Solved-by-difficulty bars for whatever the course filter is showing.
    const levels = DIFF.filter((d) => filtered.some((e) => e.difficulty === d));
    const breakdown = levels.length
      ? h(
          "div",
          { class: "difficulty-breakdown", "aria-label": "Solved by difficulty" },
          ...levels.map((d) => {
            const all = filtered.filter((e) => e.difficulty === d),
              done = all.filter((e) => unlocked.has(keyOf(e))).length;
            return h(
              "div",
              { class: "difficulty-row", "data-diff": d },
              h("span", {}, d),
              h("progress", {
                class: "difficulty-meter",
                max: Math.max(1, all.length),
                value: done,
                "aria-label": `${d}: ${done} of ${all.length} solved`,
              }),
              h("small", {}, `${done} / ${all.length}`),
            );
          }),
        )
      : "";
    panel.replaceChildren(
      h(
        "div",
        { class: "progress-stats" },
        stat(
          "\u{1F3C6}",
          "Solved",
          `${mastered} / ${filtered.length}`,
          "unique exercises cleared",
        ),
        stat(
          "\u{1F3AF}",
          "Attempted",
          `${results.length} / ${filtered.length}`,
          "latest result saved per exercise",
        ),
        stat(
          "\u{1F4C8}",
          "Latest accuracy",
          `${accuracy}%`,
          results.length
            ? `${latestCorrect} latest results correct`
            : "submit an answer to start",
        ),
        stat(
          "\u26A1",
          "XP in this view",
          `${filtered.reduce((sum, e) => sum + (S.xpRewards[keyOf(e)]?.xp || 0), 0)}`,
          "earned once per exercise",
        ),
      ),
      breakdown,
    );
    const recentRow = ({ ex: exercise, attempt }) =>
      h(
        "a",
        {
          class: "quest-row quest-link",
          href: `#/practice/${encodeURIComponent(exercise.packageId)}/${encodeURIComponent(exercise.id)}`,
          title: "Open this exercise",
        },
        h(
          "span",
          {
            class: "quest-result " + (attempt.correct ? "ok" : "bad"),
            "aria-label": attempt.correct ? "Correct" : "Incorrect",
          },
          attempt.correct ? "\u2713" : "\u00D7",
        ),
        h(
          "div",
          {},
          h("strong", {}, exercise.title),
          h(
            "small",
            {},
            `${courseLabel(exercise.course)} \u00B7 ${exercise.difficulty} \u00B7 ${fmtDate(attempt.t)}`,
          ),
        ),
        h(
          "span",
          { class: "quest-xp" },
          S.xpRewards[keyOf(exercise)]
            ? `+${S.xpRewards[keyOf(exercise)].xp} XP`
            : "\u2014",
        ),
      );
    const sortedResults = results.sort((a, b) => b.attempt.t - a.attempt.t);
    recent.replaceChildren(
      h("h2", {}, "Recent submissions"),
      sortedResults.length
        ? h(
            "div",
            {},
            h("div", { class: "recent-quests" }, sortedResults.slice(0, 6).map(recentRow)),
            sortedResults.length > 6
              ? h(
                  "details",
                  { class: "achievement-group recent-more" },
                  h(
                    "summary",
                    {},
                    `Show ${Math.min(sortedResults.length, 20) - 6} more`,
                  ),
                  h(
                    "div",
                    { class: "recent-quests" },
                    sortedResults.slice(6, 20).map(recentRow),
                  ),
                )
              : "",
          )
        : h(
            "div",
            { class: "empty" },
            course
              ? `No ${courseLabel(course)} activity yet.`
              : "No activity yet. Pick an exercise and start earning XP.",
          ),
    );
    panel.setAttribute("aria-live", "polite");
  };
  const achievementCard = (a, earned) => {
    const hidden = a.secret && !earned,
      tier = tierOf(a),
      title = hidden ? "Secret achievement" : a.title,
      detail = hidden ? "Keep exploring to find this one." : a.detail,
      value = hidden ? 0 : Math.min(a.count, a.target),
      left = Math.max(0, a.target - value),
      when = earned ? unlockedAt(a) : 0;
    return h(
      "article",
      {
        class: `achievement tier-${tier}` + (earned ? " earned" : ""),
        title: earned && a.flavor ? a.flavor : null,
      },
      h(
        "span",
        { class: "achievement-mark", "aria-hidden": "true" },
        earned ? a.icon || "\u2605" : hidden ? "?" : "\u25C7",
      ),
      h("div", {}, h("strong", {}, title), h("small", {}, detail)),
      h(
        "div",
        { class: "achievement-meta" },
        h(
          "span",
          { class: "achievement-progress" },
          earned
            ? when && !bulkTimes.has(when)
              ? `Unlocked \u00B7 ${fmtDate(when)}`
              : "Unlocked"
            : hidden
              ? "???"
              : `${value} / ${a.target} \u00B7 ${left} to go`,
        ),
        h("span", { class: "achievement-tier-tag" }, TIER_NAMES[tier]),
      ),
      h("progress", {
        class: "achievement-meter",
        max: a.target,
        value,
        "aria-label": `${title}: ${value} of ${a.target}`,
      }),
    );
  };
  const drawAchievements = () => {
    const earnedAll = achievements.filter((a) => a.count >= a.target),
      lockedAll = achievements.filter((a) => a.count < a.target),
      byRecent = (a, b) => unlockedAt(b) - unlockedAt(a),
      // Closest to done first; hidden secrets go last.
      byClosest = (a, b) =>
        (a.secret ? 1 : 0) - (b.secret ? 1 : 0) || ratioOf(b) - ratioOf(a),
      inTier = (a) => !achTier || tierOf(a) === achTier,
      earned = earnedAll.filter(inTier).sort(byRecent),
      locked = lockedAll.filter(inTier).sort(byClosest),
      pct = achievements.length
        ? Math.round((earnedAll.length * 100) / achievements.length)
        : 0;
    achCount.textContent = `${earnedAll.length} / ${achievements.length} unlocked`;
    achSummary.replaceChildren(
      h("strong", {}, `${pct}%`),
      h("span", {}, `${earnedAll.length} of ${achievements.length} achievements unlocked`),
      h("progress", {
        class: "achievement-meter achievement-overall",
        max: Math.max(1, achievements.length),
        value: earnedAll.length,
        "aria-label": `${earnedAll.length} of ${achievements.length} achievements unlocked`,
      }),
    );
    const tiersPresent = TIER_ORDER.filter((t) =>
      achievements.some((a) => tierOf(a) === t),
    );
    achTierBar.replaceChildren(
      ...[["", "All"], ...tiersPresent.map((t) => [t, TIER_NAMES[t]])].map(
        ([value, label]) => {
          const list = value
              ? achievements.filter((a) => tierOf(a) === value)
              : achievements,
            got = list.filter((a) => a.count >= a.target).length;
          return h(
            "button",
            {
              type: "button",
              class:
                "achievement-tier-chip " +
                (value ? `tier-${value}` : "tier-all") +
                (value === achTier ? " active" : ""),
              "aria-pressed": String(value === achTier),
              onclick: () => {
                achTier = value;
                drawAchievements();
                // The chips are rebuilt, so put keyboard focus back on the new one.
                achTierBar.querySelector('[aria-pressed="true"]')?.focus();
              },
            },
            label,
            h("small", {}, `${got}/${list.length}`),
          );
        },
      ),
    );
    const latest = earnedAll
      .filter((a) => unlockedAt(a) && !bulkTimes.has(unlockedAt(a)))
      .sort(byRecent)
      .slice(0, 3);
    const showLatest = latest.length > 0;
    achRecent.hidden = !showLatest;
    achRecent.replaceChildren(
      ...(showLatest
        ? [
            h("small", {}, "Latest unlocked"),
            ...latest.map((a) =>
              h(
                "span",
                {
                  class: `achievement-latest tier-${tierOf(a)}`,
                  title: `${a.detail} \u00B7 ${fmtDate(unlockedAt(a))}`,
                },
                h("span", { "aria-hidden": "true" }, a.icon || "\u2605"),
                a.title,
              ),
            ),
          ]
        : []),
    );
    achievementPreview.replaceChildren(
      ...locked.slice(0, 6).map((a) => achievementCard(a, false)),
    );
    achievementOverflow.hidden = locked.length <= 6;
    achievementOverflow.replaceChildren(
      h("summary", {}, `Show ${Math.max(0, locked.length - 6)} more achievements`),
      h(
        "div",
        { class: "achievement-grid achievement-locked-list" },
        locked.slice(6).map((a) => achievementCard(a, false)),
      ),
    );
    completedAchievements.hidden = earned.length === 0;
    completedAchievements.replaceChildren(
      h("summary", {}, `Completed achievements (${earned.length})`),
      h(
        "div",
        { class: "achievement-grid achievement-earned-list" },
        earned.map((a) => achievementCard(a, true)),
      ),
    );
    achEmpty.hidden = locked.length + earned.length > 0;
    // Next milestone: the closest locked achievement that isn't a secret.
    const next = lockedAll
      .filter((a) => !a.secret)
      .sort(byClosest)[0];
    nextMilestone.textContent = next
      ? `Next: ${next.title} \u00B7 ${next.count} / ${next.target}`
      : "All current achievements unlocked!";
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
        nextMilestone,
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
        achCount,
      ),
      achSummary,
      achTierBar,
      achRecent,
      achEmpty,
      achievementPreview,
      achievementOverflow,
      completedAchievements,
    ),
    h("section", { class: "progress-section" }, recent),
    reset,
  );
  draw();
  drawAchievements();
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
              "This removes imported packages, exercise drafts and results, saved-for-later questions, terminal workspaces, XP, achievements, saved exams, and exam history from this device. This cannot be undone.",
            confirmLabel: "Reset all data",
            danger: true,
          }))
        )
          return;
        button.disabled = true;
        status.textContent = "Clearing saved app and terminal data\u2026";
        try {
          achFrozen = true; // stop saving stats while everything is wiped
          await kv.clear();
          // The terminal uses a separate IndexedDB database. Delete that store
          // directly so resetting app data never imports or initializes the feature.
          await clearTerminalExerciseStorage();
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
      "Remove all data this app saved on this device, including imported packages, exercise drafts and results, terminal workspaces, saved-for-later questions, XP, achievements, saved exams, and exam history. Bundled site content will remain available.",
    ),
    button,
    status,
  );
}

const pages = {
  reader: pageReader,
  canvas: pageCanvas,
  learning: pageLearning,
  practice: pagePractice,
  exam: pageExam,
  progress: pageProgress,
  sandbox: pageSandbox,
};
// Add Sandbox/Canvas links if index.html comes from an older application shell.
(() => {
  const navEl = $("#nav");
  if (!navEl) return;
  if (!navEl.querySelector('a[href="#/canvas"]')) {
    const canvasLink = h("a", { href: "#/canvas" }, "Canvas");
    const readerLink = navEl.querySelector('a[href="#/reader"]');
    if (readerLink) readerLink.after(canvasLink);
    else navEl.append(canvasLink);
  }
  if (!navEl.querySelector('a[href="#/learning"]')) {
    const learningLink = h("a", { href: "#/learning" }, "Learning");
    const canvasLink = navEl.querySelector('a[href="#/canvas"]');
    const practiceLink = navEl.querySelector('a[href="#/practice"]');
    if (canvasLink) canvasLink.after(learningLink);
    else if (practiceLink) practiceLink.before(learningLink);
    else navEl.append(learningLink);
  }
  if (!navEl.querySelector('a[href="#/sandbox"]')) {
    const sandboxLink = h("a", { href: "#/sandbox" }, "Sandbox");
    const practiceLink = navEl.querySelector('a[href="#/practice"]');
    if (practiceLink) practiceLink.after(sandboxLink);
    else navEl.append(sandboxLink);
  }
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
  themeToggle.firstElementChild.textContent = dark ? "\u2600" : "\u263E";
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
let backToTopFrame = 0;
const scheduleBackToTopUpdate = () => {
  if (backToTopFrame) return;
  backToTopFrame = requestAnimationFrame(() => {
    backToTopFrame = 0;
    updateBackToTop();
  });
};
addEventListener("scroll", scheduleBackToTopUpdate, { passive: true });
addEventListener("resize", scheduleBackToTopUpdate, { passive: true });
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
  if (focusButton.getAttribute("aria-pressed") === "true") return;
  if (terminalArtifact && !reducedMotion.matches) {
    terminalArtifact.hidden = false;
    terminalArtifact.classList.add("active");
    document.documentElement.classList.add("hacking-mode");

    setTimeout(() => {
      if (focusButton.getAttribute("aria-pressed") === "true") return;
      terminalArtifact.classList.remove("active");
      document.documentElement.classList.remove("hacking-mode");
      setTimeout(() => {
        terminalArtifact.hidden = true;
      }, 1850);
    }, 8500);
  }

  if (!periodicToast) return;

  setTimeout(() => {
    if (focusButton.getAttribute("aria-pressed") === "true") return;
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
      if (focusButton.getAttribute("aria-pressed") === "true") return;
      periodicToast.classList.remove("show");
      setTimeout(() => {
        periodicToast.hidden = true;
      }, 220);
    }, 4200);
  }, 5000);
}
let wassimSignalTimer = 0;
function scheduleWassimSignal(delay = 60_000) {
  clearTimeout(wassimSignalTimer);
  if (document.hidden || focusButton.getAttribute("aria-pressed") === "true") return;
  wassimSignalTimer = window.setTimeout(() => {
    wassimSignalTimer = 0;
    triggerWassimSignal();
    scheduleWassimSignal((Math.floor(Math.random() * 13) + 3) * 60_000);
  }, delay);
}
function syncWassimSignalSchedule() {
  clearTimeout(wassimSignalTimer);
  wassimSignalTimer = 0;
  if (!document.hidden) scheduleWassimSignal(60_000);
}
document.addEventListener("visibilitychange", syncWassimSignalSchedule);
scheduleWassimSignal(60_000);
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
let clickmeShowTimer = 0;
let clickmeHideTimer = 0;
function syncClickmeSchedule(delay = 15_000) {
  clearTimeout(clickmeShowTimer);
  clickmeShowTimer = 0;
  if (document.hidden || focusButton.getAttribute("aria-pressed") === "true") {
    clearTimeout(clickmeHideTimer);
    clickmeHideTimer = 0;
    hideClickme();
    return;
  }
  clickmeShowTimer = window.setTimeout(() => {
    clickmeShowTimer = 0;
    if (document.hidden || focusButton.getAttribute("aria-pressed") === "true") return;
    clickme.classList.remove("is-hiding");
    clickme.classList.add("is-visible");
    clearTimeout(clickmeHideTimer);
    clickmeHideTimer = window.setTimeout(() => {
      clickmeHideTimer = 0;
      hideClickme();
    }, 10_000);
    // Keep the next appearance timer separate from the 10-second hide timer.
    syncClickmeSchedule(61_000);
  }, delay);
}
document.addEventListener("visibilitychange", () => syncClickmeSchedule(15_000));
syncClickmeSchedule(15_000);
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
