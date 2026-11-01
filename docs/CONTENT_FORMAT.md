# Course content format (schemaVersion 1)

Course content is maintained directly in two bundled JSON files:

- `content/os-course.json` contains the OS exercises.
- `content/sql-course.json` contains the SQL exercises and their datasets.

Each file is a complete package with `schemaVersion`, `packageId`, `version`,
`datasets`, and `exercises`. Edit the relevant file to add or change course
content; do not create a separate package for an individual exercise. Keep the
file valid JSON and preserve the package metadata and top-level structure.

Both files are loaded by `content/manifest.json`. If you rename or add a course
file, update the `packages` list there so the app loads it.

## Current package layout

The OS package uses `packageId: "os-term-1"` and has no datasets. Its exercises
use `course: "os"` and currently use `command-text` or `mcq-single`.

The SQL package uses `packageId: "sql-term-1"`. It defines datasets in its
`datasets` array and refers to them from SQL exercises by `datasetId`.
Its exercises use `course: "sql"` and currently use `sql-query` or
`mcq-single`.

Exercise IDs must be unique within their package and stable across edits:
changing wording does not require a new ID, but a genuinely different exercise
does. Progress and saved answers are identified by package ID plus exercise
ID. Dataset IDs must be unique across installed packages; bump a dataset's
version whenever its schema or data changes.

## Exercise fields

Every exercise requires:

- `id`
- `course` (`"sql"` or `"os"`)
- `category`
- `title`
- `instructions`
- `difficulty` (`"Easy"`, `"Medium"`, `"Hard"`, or `"Extreme"`)
- `type`
- `examEligible` (boolean)
- `provenance`
- `contentVersion` (integer)

Optional common fields are `week`, `subtopic`, `hints` (string array), and
`explanation`.

The first correct solve awards XP once: Easy 25, Medium 50, Hard 100, Extreme
200. The exam builder includes an Extreme count input set to 0 by default, so
existing exam lengths remain unchanged unless you opt in.

## SQL exercises

An automatically graded SQL exercise has `course: "sql"` and
`type: "sql-query"`. It requires:

- `datasetId`, matching a dataset in an installed package
- `referenceSolution`, a single SQL statement
- `orderMatters`, `compareColumnNames`, and `columnOrderMatters` (booleans)

Optional fields are `numericTolerance` (number) and `allowedStatementKinds`
(array containing `"SELECT"`, `"DML"`, and/or `"DDL"`; defaults to
`["SELECT"]`).

Datasets are PostgreSQL setup scripts stored in the SQL package's `datasets`
array. Each dataset has `id`, `version`, `title`, and `sql`; the `sql` script
creates and populates the database. Reference solutions are checked against
their dataset when the package is loaded. Queries must use one statement.

SQL knowledge-check exercises may use `mcq-single`, `mcq-multi`, or
`mcq-multiple` instead; they do not need a dataset or SQL-query fields.

## Choice and text exercises

These types are graded by answer matching rather than SQL execution:

| Type | Additional fields | `expected` |
|---|---|---|
| `mcq-single` | `options`: string array | Array containing exactly one valid option index |
| `mcq-multi` | `options`: string array | Array of valid option indexes |
| `mcq-multiple` | `options`: string array | Array of valid option indexes (multi-select alias) |
| `command-text` | — | Object with `accepted` and/or `patterns` arrays; at least one must contain an entry |
| `fill-blank` | — | Object with `blanks`: one array of accepted strings per blank |
| `short-answer-self-check` | — | Model answer string; the student self-marks |

For `command-text`, whitespace is normalised before accepted answers are
compared or patterns are tested. Patterns are regular expressions.

## Add or edit course content

1. Edit `content/os-course.json` or `content/sql-course.json`.
2. Add an exercise object to that package's `exercises` array, following the
   fields for its course and type above.
3. For an SQL exercise, use an existing dataset ID or add/update a dataset in
   `content/sql-course.json`. Increment that dataset's `version` when its data
   or schema changes.
4. Keep each exercise ID unique in its package and ensure every SQL reference
   solution is valid for its dataset.
5. If adding a new JSON course file rather than updating one of the existing
   files, register its path in `content/manifest.json`.

An invalid package is rejected whole and its errors are shown on the Content
page with the file, exercise ID, and field.
