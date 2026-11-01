# Content format (schemaVersion 1)

A **package** is one JSON file. A generator must output exactly this shape. Anything invalid is rejected whole and listed on the Content page with file, exercise ID and field.

```json
{
  "schemaVersion": 1,
  "packageId": "sql-week1",
  "version": "1.0.0",
  "datasets": [ { "id": "enterprise", "version": "1", "title": "Enterprise", "sql": "CREATE TABLE ...; INSERT INTO ...;" } ],
  "exercises": [ { "...": "see below" } ]
}
```

## IDs
Exercise and dataset `id` values are stable: editing wording never changes an ID; a genuinely different exercise gets a new ID. Use lowercase `a-z0-9-` e.g. `sql-w1-001`. Exercise IDs are unique within each package; progress is keyed by package ID plus exercise ID.

## Exercise — common fields (all required unless noted)
`id`, `course` (`sql`|`os`), `category`, `title`, `instructions`, `difficulty` (`Easy`|`Medium`|`Hard`), `type`, `examEligible` (boolean), `provenance` (source file + exercise), `contentVersion` (integer).
Optional: `week`, `subtopic`, `hints` (string[]), `explanation`.

**GREP rule:** every GREP exercise has `examEligible: false`; exam eligibility is controlled by each exercise's own flag.

## SQL exercises (`course: "sql"`, `type: "sql-query"`)
Required: `datasetId` (must exist in a `datasets[]` of this or an installed package), `referenceSolution` (a single statement), `orderMatters`, `compareColumnNames`, `columnOrderMatters` (booleans). Optional: `numericTolerance` (number, floats only), `allowedStatementKinds` (array of `SELECT`|`DML`|`DDL`, default `["SELECT"]`).
Every reference solution is executed against its dataset on import; failures reject the package. One statement per query (PGlite `query`).

SQL-course knowledge checks may also use `mcq-single` or `mcq-multi`. These render as choice questions and do not require a dataset or SQL query fields.

## Choice and text exercises
Exercises using these types are graded by **answer matching, not SQL execution**.
| type | extra fields | `expected` |
|---|---|---|
| `mcq-single` | `options: string[]` | `[index]` (exactly one) |
| `mcq-multi` | `options: string[]` | `[index, ...]` |
| `command-text` | – | `{ "accepted": ["ls -l"], "patterns": ["^ls\\s+-l$"] }` (whitespace normalised; regex tested on the normalised input; at least one list non-empty) |
| `fill-blank` | – | `{ "blanks": [["accepted1","accepted2"], ["..."]] }` one inner array per blank |
| `short-answer-self-check` | – | model answer string; student self-marks |

## Bundled vs imported
- **Bundled:** put the file in `content/`, add `{ "id": "...", "version": "...", "files": ["yourfile.json"] }` to `packages` in `content/manifest.json`, commit. Everyone using the deployment gets it.
- **Imported:** Content page → file picker (JSON files). Stored only in that browser's IndexedDB; not shared; survives refresh. (Zip import is not implemented.)

## Datasets
`sql` is a PostgreSQL script (schema + data) run on an empty database. Prebuilt snapshots are not supported yet. The engine caches a snapshot per `id@version` — **bump `version` when data changes**.
