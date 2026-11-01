# SQL + OS Practice (static, plain HTML/JS/CSS)

No build step, no backend. Open via any static server. All URLs are relative, so it works under `https://user.github.io/repo/`.

## Deploy on GitHub Pages
**A. No build (simplest):** commit these files to the repo root (or a `docs/` folder). Settings → Pages → Source: *Deploy from a branch* → branch `main`, folder `/ (root)` (or `/docs`) → Save.
**B. GitHub Actions:** Settings → Pages → Source: *GitHub Actions*, then add a workflow using `actions/upload-pages-artifact` (path `.`) and `actions/deploy-pages`. Nothing needs building.

Local test: `python3 -m http.server` then open `http://localhost:8000/`.

## SQL engine
PGlite (PostgreSQL in WASM) is loaded by `<script type="module" src="js/pglite-loader.js">`, which imports a pinned jsDelivr URL. This is a runtime CDN dependency (your choice). To self-host, copy the package's `dist/` into `js/vendor/` and change the URL in the loader. It runs on the main thread (not a Worker), and one statement per query.
Exercise packages are managed by the site maintainer in the project files. There is no in-app package import or content administration page. The app loads the packages listed in `content/manifest.json`.

## Layout
`js/core.js` pure logic (comparator, exam generator, validator, OS grading; unit-tested) · `js/app.js` UI/storage/engine · `content/manifest.json` · `content/reference/*.md` (your files, unmodified) · `docs/CONTENT_FORMAT.md` · `docs/exercise.schema.json` · `tests/`.

## Grading
Student query and the reference run on **two separate fresh databases** created from the dataset (snapshot cached per dataset id@version), started together so `CURRENT_DATE`/`NOW()` agree except across midnight. Comparison is on executed results: NULL ≠ '' ≠ 0; duplicate rows counted; numeric columns normalised by column type (`25` = `25.00`); text never parsed as numbers; dates compared as instants; order only if `orderMatters`; column names only if `compareColumnNames`; with `columnOrderMatters:false` cells within a row are compared as a set. Diff is shown in Practice only.

## Practice state
Exercises are identified by their package ID plus exercise ID, so packages can safely reuse exercise IDs without sharing drafts or progress. Practice answers are saved as the latest draft for each exercise in this browser, so returning to an exercise restores what you were writing. The app keeps only the latest correctness result per exercise; it does not retain a log of submitted answer text. **Progress** tracks levels, XP, unique exercises solved, latest accuracy, recent activity, and achievement milestones. The achievement list previews six unearned milestones, with the rest and completed achievements in separate collapsed sections. XP is awarded on the first correct solve of an exercise (25/50/100/200 for Easy/Medium/Hard/Extreme), so repeating submissions cannot be used to grind rewards. **Progress → Reset all local data** removes app data saved in IndexedDB on this device, including imported packages, drafts, results, XP, achievements, and exam history. SQL exercises display the dataset schema as a PlantUML SVG by default, with methods hidden, larger labels, and extra spacing between tables and relationships. The generated PlantUML source is available below the image; diagram requests send table and column names to plantuml.com.

Selecting a Practice exercise adds its package ID and exercise ID to the URL. The selected exercise opens when that URL is refreshed, and browser back/forward navigates between previously selected exercises.

## Test report (what was actually run)
- `bun tests/core.test.js` → **18/18 passed** (comparator cases, exam generator 5/5/2, shortage without substitution, no duplicates, GREP exclusion by exercise eligibility, validator errors, OS grading).
- `node tests/md-smoke.js` → both supplied reference files render with all headings and tables intact.
- **NOT verified (no network or browser in my environment):** PGlite loading and every SQL construct, snapshot speed, browser behavior beyond the checks above, and subpath hosting. Run `node tests/core.test.js` and check SQL exercises in a browser after deploying.

## Known limitations
Plain textarea editor (no syntax highlighting); zip import not implemented; OS grading is text matching only; no Worker; `dumpDataDir` snapshot speed-up falls back to re-running the dataset script if unsupported; first load fetches the WASM from the CDN; large datasets slow each fresh database.
