# Relational database · Term 1 Learning Path

This is a guided exercise path through the complete **Relational Database Fundamentals** summary. Work from Section 01 onward: each section introduces a small set of ideas, gives you a dedicated practice database, and ends with questions that combine earlier skills with the new material.

> **How progress works:** solving an exercise correctly records it in the existing practice history. Each section also has a separate study-complete toggle, so you can mark a topic as reviewed after you understand it. Your checklist is saved locally on this device.

**Recommended routine:** read the section goals, complete its exercises in order, revisit any question that needed a hint, and mark the section complete only when you can explain the query you wrote.

---

## Section 01 — Database concepts and your first tables

**Purpose:** understand what the data represents before writing SQL. A relational database stores related information in tables. A row is one record; a column is one attribute. A primary key identifies a row uniquely, while a foreign key refers to a key in another (or the same) table. A composite key uses multiple columns together. `UNIQUE` prevents duplicates, `NOT NULL` requires a value, and `NULL` means missing or unknown.

**Practice database:** Library foundations (`readers`, `books`, `loans`). Start by reading complete tables, then select the attributes that identify records and follow the reader-to-loan relationship conceptually.

**Checkpoint:** explain why `reader_id` identifies a reader, why `loans.reader_id` refers to it, and why an unreturned loan has a `NULL` return date.

## Section 02 — The shape of a SQL query

**Purpose:** write the basic `SELECT ... FROM ...` form. `SELECT` chooses what appears in the result; `FROM` chooses the source. A query can also return constants and arithmetic expressions without a table. Table aliases make longer queries easier to read.

**Practice database:** Bakery basics (`products`, `orders`). Practice reading complete tables, choosing columns, selecting constants, calculating simple expressions, and using aliases.

**Checkpoint:** write a query that selects table values and a literal label in the same result.

## Section 03 — Choosing columns, aliases, DISTINCT and concatenation

**Purpose:** shape output deliberately. Use `AS` for temporary output names, `DISTINCT` to remove duplicate result rows, and `||`, `CONCAT()` or `CONCAT_WS()` to combine text. Remember that `DISTINCT` applies to the entire selected row. Use single quotes for values and double quotes for identifiers that need spaces or capitals.

**Practice database:** Music catalogue (`artists`, `albums`). Work with repeated genres, names and release years before building display labels.

**Checkpoint:** produce a unique, readable artist list with a concatenated display name.

## Section 04 — Filtering rows with WHERE

**Purpose:** keep only rows that satisfy a condition. Practise equality, inequality, comparisons, and combining tests with `AND`, `OR` and `NOT`. Use parentheses when mixing `AND` and `OR` so the intended logic is clear.

**Practice database:** Bike rentals (`rentals`). Begin with one condition, then combine status, bike type, date, duration and fee tests.

**Checkpoint:** describe in plain language why each condition is joined with `AND` or `OR`.

## Section 05 — Filtering ranges, lists, patterns and NULL

**Purpose:** extend `WHERE` with inclusive `BETWEEN`, list matching with `IN`, pattern matching with `LIKE`, and missing-value checks with `IS NULL` / `IS NOT NULL`. In a `LIKE` pattern, `%` means any amount of text and `_` means exactly one character. Text comparisons are case-sensitive; standardize with `LOWER()` or `UPPER()` when needed. Never compare NULL with `= NULL`.

**Practice database:** Hotel bookings (`bookings`). Use guest names, cities, room types, confirmation codes and nightly rates.

**Checkpoint:** combine list membership, an inclusive range and a NULL check in one query.

## Section 06 — Sorting and limiting results

**Purpose:** control presentation with `ORDER BY`, `ASC`, `DESC`, multiple sort keys and explicit NULL placement. Practise `LIMIT`, `OFFSET`, `FETCH FIRST` and `FETCH NEXT`. Sorting is only guaranteed when you specify `ORDER BY`.

**Practice database:** Arcade scores (`scores`). Find top scores, recent sessions and pages of sorted results.

**Checkpoint:** filter first, sort with a tie-breaker, skip rows, and return a limited page.

## Section 07 — Text functions and nested expressions

**Purpose:** use the full text-function toolkit from the summary: `UPPER`, `LOWER`, `INITCAP`, `LENGTH`, `SUBSTR`, `LEFT`, `POSITION`, `REPLACE`, `TRIM`, `LTRIM`, `LPAD`, `RPAD`, `CONCAT` and `CONCAT_WS`. Functions can be nested; the innermost expression is evaluated first.

**Practice database:** Contact directory (`contacts`). Clean inconsistent casing and whitespace, extract fragments, locate characters and build formatted labels.

**Checkpoint:** combine multiple text functions in one expression and explain the order in which they run.

## Section 08 — Numeric functions and arithmetic

**Purpose:** calculate values with `+`, `-`, `*` and `/`; round with `ROUND(number, decimals)`; truncate without rounding with `TRUNC(number, decimals)`; and calculate remainders with `MOD(a, b)`. Negative decimal positions round or truncate to the left of the decimal point.

**Practice database:** Store prices (`price_items`). Calculate gross values, discounts, VAT, stock values and rounded presentation values.

**Checkpoint:** calculate a discounted total and choose whether the result should be rounded or truncated.

## Section 09 — Date and time functions

**Purpose:** work with `CURRENT_DATE`, `CURRENT_TIME`, `NOW()`, `AGE(date)`, `AGE(date1, date2)`, `EXTRACT`, and `DATE_PART`. Subtracting dates returns days; adding an `INTERVAL` produces a future or past date. Remember that an age interval depends on the current date.

**Practice database:** Workshop schedule (`participants`). Examine birth dates, registration dates and session timestamps.

**Checkpoint:** calculate an age interval, extract a date component, and filter on that component.

## Section 10 — Type conversion and date formatting

**Purpose:** convert values with `TO_CHAR`, `TO_DATE`, `TO_NUMBER` and `CAST`; PostgreSQL also supports `value::type`. Practise `YYYY`, `MM`, `DD`, `Month`, `Mon`, `Day`, `dy`, `DDTH`, `WWth`, `HH24:MI` and `HH:MI AM`. `FM` removes padding spaces and `TM` uses the configured language. Always specify the year in a `TO_DATE` format.

**Practice database:** Invoice import staging (`invoice_imports`). Dates and amounts arrive as text, while postal codes must remain text to preserve leading zeroes.

**Checkpoint:** parse a date, format it for display, convert an amount to numeric, and perform a calculation.

## Section 11 — Aggregate functions

**Purpose:** summarize many rows with `COUNT(*)`, `COUNT(column)`, `COUNT(DISTINCT column)`, `SUM`, `AVG`, `MIN` and `MAX`. Most aggregates ignore NULL values; `COUNT(*)` counts all rows. Without `GROUP BY`, an aggregate normally returns one result row. Aggregate functions cannot be used in `WHERE`.

**Practice database:** Film rentals (`rentals`). Count records, total fees, average values, extrema and known versus missing ratings or return dates.

**Checkpoint:** explain why `COUNT(*)` and `COUNT(returned_on)` can return different values.

## Section 12 — GROUP BY and HAVING

**Purpose:** create one aggregate result per group. Every selected expression must either be inside an aggregate or appear in `GROUP BY`. Use `WHERE` to filter individual rows before grouping and `HAVING` to filter completed groups using aggregate results.

**Practice database:** Cafe sales (`sales`). Group by branch, product, category or cashier; calculate units and revenue; filter groups by counts and totals.

**Checkpoint:** write a report that filters rows, groups them, applies a HAVING condition and sorts the grouped output.

## Section 13 — INNER JOIN and joining several tables

**Purpose:** combine related rows using `JOIN ... ON`. An inner join returns only matches. Use aliases and qualified column names when names overlap. Chain multiple joins by following the real relationships. A join without a condition produces a Cartesian product.

**Practice database:** City projects (`departments`, `employees`, `projects`, `tasks`). Follow project-to-department and task-to-employee relationships.

**Checkpoint:** produce a project report with its supporting department, assigned employees and total recorded hours.

## Section 14 — Advanced joins: composite keys, non-equi joins and self joins

**Purpose:** match all columns of a composite key with `AND`; join numeric values to ranges using inequalities; and join a table to itself using different aliases. Self joins can reveal manager hierarchies, related records and row-to-row comparisons. Use `<` when each unordered pair should appear once; use `<>` when both directions are wanted.

**Practice database:** School records (`students`, `sections`, `grades`, `grade_conversions`, `staff`). Match students to grade records, convert score ranges to letter grades and explore staff relationships.

**Checkpoint:** combine ordinary joins with a range join and explain why a self join needs two aliases.

## Section 15 — Outer joins and finding rows without a match

**Purpose:** use `LEFT JOIN`, `RIGHT JOIN` and `FULL OUTER JOIN` to keep unmatched rows. A missing side is filled with NULL. To find rows without a match, use `LEFT JOIN` and test a right-side primary or join key with `IS NULL`. Be careful: a right-table condition in `WHERE` can remove unmatched rows; use `ON` when the unmatched left rows must remain. `COUNT(right_key)` counts real matches.

**Practice database:** Community events (`members`, `teams`, `events`, `signups`). Find members without signups, teams without events and counts that include zero.

**Checkpoint:** preserve every member, count only matching signups, and sort the results.

## Section 16 — Capstone: combine the complete SQL toolkit

**Purpose:** solve multi-table reporting questions that require you to choose the right joins, format values, filter rows, calculate aggregates, group results, filter groups and sort the final report. These tasks deliberately combine concepts from the entire path.

**Practice database:** Enterprise capstone (`departments`, `employees`, `projects`, `tasks`, `salary_bands`). The data includes optional relationships, managers, date values, numeric ranges and projects with different statuses.

**Final checkpoint:** produce a report for active projects that includes department, total hours, distinct contributors and latest completion date, then explain each clause in logical query-building order.

---

## Completion standard

You have completed the path when you can write each query without copying the reference solution, explain why every clause is present, and identify whether a condition belongs in `WHERE`, `ON` or `HAVING`. Revisit the sections whose exercise progress is low, then retry their integration checkpoints without opening the hints first.
