# MASTER PROMPT — GENERATE A COMPLETE SQL EXERCISE JSON PACKAGE

You are an expert SQL instructor, PostgreSQL specialist, and educational exercise generator.

Your task is to generate a large, high-quality, exam-focused SQL exercise package based exclusively on the supplied course materials.

You will receive:

1. `sql_exam_cheat_sheet.md` — the authoritative SQL course summary.
2. A JSON example/schema — the required structure and format for the generated exercise package.

The package must contain a large collection of SQL exercises organized according to the actual course weeks, with realistic datasets, reference solutions, hints, and explanations.

The final result must be a complete, valid JSON object that can be saved directly as:

`sql-course.json`

**The most important priorities are:**

- Generate exercises only from the examinable coursework.
- Follow the Week 2–5 structure specified in this prompt.
- Make approximately 90% of exercises actual SQL-writing exercises.
- Create multiple different, realistic PostgreSQL datasets.
- Ensure every reference solution is executable and correct.
- Do not introduce SQL features that are outside the coursework.

---

# 1. ABSOLUTE COURSE CONTENT RESTRICTIONS

**Only generate exercises about SQL material that is explicitly included in the supplied coursework and the week-by-week scope in this prompt.**

The Markdown summary and this prompt together define the permitted course content.

Do not use your general SQL knowledge to expand the syllabus.

The fact that a SQL feature exists in PostgreSQL does not mean it belongs in this exercise package.

## SQL dialect

Use PostgreSQL syntax throughout.

All:

- Dataset creation scripts.
- Table definitions.
- Insert statements.
- Reference solutions.
- SQL examples.
- Exercise instructions.

Must be compatible with PostgreSQL.

Do not mix SQL dialects from MySQL, SQL Server, Oracle, SQLite, or other database systems.

## Strictly excluded SQL topics

Do NOT generate exercises involving features that are not part of the supplied coursework.

Unless the Markdown summary explicitly establishes that they are examinable, exclude:

- Common Table Expressions (CTEs).
- Recursive CTEs.
- Window functions.
- `OVER`, `PARTITION BY`, and window frames.
- Advanced subqueries.
- Correlated subqueries.
- Set operations such as `UNION`, `INTERSECT`, and `EXCEPT`.
- Stored procedures.
- User-defined functions.
- Triggers.
- Transactions and transaction control.
- Database administration.
- Index creation and optimization.
- Query execution plans.
- Advanced normalization.
- JSON and JSONB functions.
- Advanced PostgreSQL-specific features not taught in the course.
- Advanced constraints or database design concepts not covered.
- Any SQL command or feature outside the examinable syllabus.

Do not introduce excluded features just to make exercises more difficult.

## Important restrictions

- Do not introduce new functions simply because they are useful.
- Do not introduce new JOIN types or syntax unless they are covered.
- Do not use advanced syntax to solve problems that can be solved with the taught material.
- Do not create questions that indirectly test excluded features.
- Do not use an excluded feature in a reference solution.
- Do not put excluded SQL features in MCQ distractors.

If you are uncertain whether a feature is examinable, leave it out.

**Correct course coverage is more important than generating a larger number of exercises.**

---

# 2. COURSE STRUCTURE — WEEKS 2 TO 5

The package must be organized into the following four course weeks.

Do not invent additional weeks.

Each exercise must belong to the correct week and topic.

The week progression is important: exercises should become progressively more complex as students learn additional SQL concepts.

---

## WEEK 2 — BASIC SQL QUERIES AND FILTERING

<badge color="success">Week 2</badge>

### Main learning objectives

Students should be able to retrieve data from tables, select the correct columns, filter records, sort results, and control which rows are returned.

### Required course content

#### 2.1 SELECT

Cover:

- `SELECT`
- Selecting individual columns.
- Selecting multiple columns.
- Selecting all columns using `*`.
- Column aliases using `AS`, where covered.
- Understanding the structure of a basic SELECT query.

Generate exercises where students must retrieve specific information from a dataset.

Examples of tasks:

- Display all employees.
- Display only employee names and departments.
- Display product names and prices.
- Rename a result column using an alias.
- Retrieve selected information from a table.

#### 2.2 DISTINCT

Cover:

- `DISTINCT`
- Removing duplicate rows from query results.
- Understanding the difference between distinct and non-distinct results.
- Applying DISTINCT to multiple selected columns, where covered.

Generate practical exercises involving repeated values in datasets.

#### 2.3 WHERE

Cover:

- `WHERE`
- Filtering records.
- Comparison operators.
- Equality and inequality.
- Greater than and less than.
- Greater than or equal to.
- Less than or equal to.

Use only operators included in the coursework.

Generate exercises requiring students to filter rows based on realistic conditions.

#### 2.4 Logical operators

Cover:

- `AND`
- `OR`
- `NOT`

Generate exercises involving multiple conditions.

Examples:

- Employees in a particular department with a salary above a specified amount.
- Products that meet two conditions.
- Students who satisfy one of two conditions.
- Records that do not match a specified condition.

Make some exercises require careful understanding of combined conditions.

#### 2.5 BETWEEN

Cover:

- `BETWEEN`
- Inclusive range filtering.
- Numeric ranges.
- Date ranges, where covered.

Generate exercises requiring students to select records within specified ranges.

#### 2.6 IN

Cover:

- `IN`
- Filtering against multiple possible values.

Generate exercises involving:

- Multiple departments.
- Several product categories.
- A selection of student statuses.
- Multiple specified values.

#### 2.7 LIKE

Cover:

- `LIKE`
- `%`
- `_`
- Pattern matching using the taught wildcard characters.

Generate exercises involving:

- Names beginning with a specific character.
- Names ending with a specific sequence.
- Values containing a particular sequence.
- Fixed-length patterns using `_`.

Do not introduce regular-expression matching.

#### 2.8 NULL values

Cover:

- `NULL`
- `IS NULL`
- `IS NOT NULL`
- Understanding why NULL is not equivalent to zero or an empty string.

Generate exercises involving missing information in realistic datasets.

#### 2.9 ORDER BY

Cover:

- `ORDER BY`
- Ascending order.
- Descending order.
- Sorting by multiple columns.
- Sorting using selected columns or aliases, where covered.
- `NULLS FIRST`.
- `NULLS LAST`.

Generate exercises involving alphabetical sorting, numeric sorting, date sorting, and multiple sorting criteria.

#### 2.10 FETCH and OFFSET

Cover:

- `FETCH`
- `FETCH FIRST`
- `FETCH NEXT`, where covered.
- `OFFSET`

Generate exercises involving:

- Returning only the first few results.
- Skipping a number of rows.
- Returning a specific section of sorted results.
- Combining sorting with row limits.

Use the exact PostgreSQL syntax taught in the coursework.

### Week 2 exercise requirements

Minimum: **30 exercises**.

Target difficulty distribution:

- 40% Easy.
- 40% Medium.
- 20% Hard.

Suggested progression:

**Easy**

- Basic SELECT queries.
- Selecting individual columns.
- Simple WHERE conditions.
- Basic ORDER BY.
- Simple DISTINCT.

**Medium**

- Multiple WHERE conditions.
- AND and OR.
- BETWEEN and IN.
- LIKE patterns.
- NULL handling.
- Multiple-column sorting.
- FETCH and OFFSET.

**Hard**

- Combining several Week 2 features.
- Complex filtering conditions.
- Sorting and filtering together.
- Queries involving several conditions and NULL values.
- More involved pagination exercises.

Do not use Week 3, 4, or 5 material in Week 2 exercises.

---

## WEEK 3 — DATA TYPES, CONVERSION AND SQL FUNCTIONS

<badge color="success">Week 3</badge>

### Main learning objectives

Students should be able to work with different data types, convert values, manipulate text, perform numeric calculations, and work with dates and times using the taught SQL functions.

### Required course content

#### 3.1 Data types

Cover data types included in the summary, such as:

- Integer types.
- Numeric types.
- Character types.
- Variable-length character types.
- Date.
- Time.
- Timestamp.
- Other data types explicitly included in the summary.

Generate exercises requiring students to understand the values stored in columns and how data types affect query results.

Do not introduce data types that are outside the course.

#### 3.2 Type conversion

Cover:

- `CAST`
- Conversion syntax taught in the coursework.
- Converting values between compatible data types.

Generate exercises involving conversions between numeric, text, and date-related types where supported by the summary.

#### 3.3 Formatting and conversion functions

Cover:

- `TO_CHAR`
- `TO_DATE`
- `TO_NUMBER`

Use only the formatting patterns and conversion behavior demonstrated in the coursework.

Generate exercises involving:

- Formatting numbers.
- Formatting dates.
- Converting text to dates.
- Converting text to numbers.
- Producing formatted output.

Do not introduce advanced formatting patterns not taught in the course.

#### 3.4 Text functions

Cover the following functions where included in the summary:

- `UPPER`
- `LOWER`
- `INITCAP`
- `LENGTH`
- `SUBSTR`
- `LEFT`
- `POSITION`
- `REPLACE`
- `TRIM`
- `LTRIM`
- `LPAD`
- `RPAD`
- `CONCAT`
- `CONCAT_WS`

Generate exercises involving:

- Converting text to uppercase or lowercase.
- Formatting names.
- Extracting parts of strings.
- Finding positions within strings.
- Replacing text.
- Removing unwanted spaces.
- Padding values.
- Combining text columns.

Use realistic datasets containing names, descriptions, addresses, product codes, and other text values.

Do not introduce text functions outside the taught list unless explicitly included in the Markdown summary.

#### 3.5 Numeric functions and calculations

Cover:

- `ROUND`
- `TRUNC`
- `MOD`
- Arithmetic calculations using numeric columns.
- Numeric expressions in SELECT statements.

Generate exercises involving:

- Calculating totals.
- Applying discounts.
- Rounding values.
- Truncating values.
- Calculating remainders.
- Performing calculations using multiple numeric columns.

Only use the functions and syntax included in the coursework.

#### 3.6 Date and time functions

Cover:

- `CURRENT_DATE`
- `CURRENT_TIME`
- `NOW()`
- `AGE`
- `EXTRACT`
- `DATE_PART`
- `INTERVAL`

Use only the syntax and examples taught in the course.

Generate exercises involving:

- Extracting year, month, or day information.
- Calculating date differences.
- Working with intervals.
- Displaying current date or time.
- Calculating ages or durations.
- Comparing date and time values.

#### 3.7 Date formatting

Use the date formatting techniques demonstrated in the summary, including `TO_CHAR` where applicable.

Generate exercises that require students to display dates in specified formats.

Do not introduce advanced date and time functionality outside the syllabus.

### Week 3 exercise requirements

Minimum: **35 exercises**.

Target difficulty distribution:

- 30% Easy.
- 45% Medium.
- 25% Hard.

Suggested progression:

**Easy**

- Basic text functions.
- Simple numeric functions.
- Basic CAST operations.
- Simple date extraction.
- Basic formatting.

**Medium**

- Combining multiple text functions.
- Using conversion functions.
- Numeric calculations with rounding.
- Date calculations.
- Working with intervals.
- Formatting dates and numbers.

**Hard**

- Combining multiple functions in one query.
- Performing several transformations.
- More involved date calculations.
- Combining calculations with formatting.
- Multi-step text manipulation.

Do not use JOINs, GROUP BY, or aggregate functions as core requirements in Week 3 exercises unless the course materials explicitly place them in Week 3.

---

## WEEK 4 — JOINS AND RELATIONSHIPS BETWEEN TABLES

<badge color="success">Week 4</badge>

### Main learning objectives

Students should be able to retrieve related information from multiple tables by using JOINs.

They should understand table relationships, join conditions, and how keys connect records.

### Required course content

#### 4.1 INNER JOIN

Cover:

- `INNER JOIN`
- `JOIN`
- `ON`
- Matching records between two tables.
- Equi-joins.
- Understanding join conditions.

Generate exercises using related tables.

Examples:

- Employees and departments.
- Orders and customers.
- Students and courses.
- Products and categories.

Students should retrieve information from both tables.

#### 4.2 Multiple-table joins

Cover joining more than two tables.

Generate exercises involving realistic relationships such as:

- Customers → Orders → Products.
- Students → Enrollments → Courses.
- Employees → Departments → Locations.

Use only the join syntax taught in the coursework.

Generate queries requiring students to understand which tables must be joined and how they are connected.

#### 4.3 Primary keys and foreign keys in joins

Cover:

- Primary keys.
- Foreign keys.
- Composite keys, where included.
- How key relationships connect records.
- Join conditions using key columns.

Generate exercises requiring students to identify the correct columns to join.

Do not introduce advanced database design topics outside the course.

#### 4.4 Composite keys

Generate exercises involving tables where a relationship uses more than one column.

Students should understand how multiple columns can be required to identify a relationship.

Only use composite-key structures supported by the coursework.

#### 4.5 Non-equi joins

Cover non-equi joins where explicitly included in the summary.

Generate exercises involving join conditions that use comparison operators rather than only equality.

Use realistic scenarios, such as:

- Matching values to ranges.
- Comparing numeric thresholds.
- Matching records based on date or numeric conditions.

Do not invent advanced join techniques.

#### 4.6 Self-joins

Cover:

- Joining a table to itself.
- Table aliases.
- Understanding why aliases are needed.
- Relationships between rows in the same table.

Generate exercises involving realistic examples, such as:

- Employees and their managers.
- Records referring to other records.
- Other self-referencing relationships included in the coursework.

Only use concepts and syntax taught in the summary.

### Week 4 exercise requirements

Minimum: **35 exercises**.

Target difficulty distribution:

- 25% Easy.
- 45% Medium.
- 30% Hard.

Suggested progression:

**Easy**

- Simple INNER JOIN between two tables.
- Basic join conditions.
- Identifying primary and foreign keys.
- Using table aliases.

**Medium**

- Joining three tables.
- Combining joins with WHERE.
- Selecting columns from multiple tables.
- Joining tables with composite keys.
- Self-joins.

**Hard**

- More complex multi-table joins.
- Multiple join conditions.
- Non-equi joins.
- Self-joins with several conditions.
- Combining joins with Week 2 filtering and sorting features.

Do not introduce aggregate functions or GROUP BY as core requirements in Week 4 unless explicitly covered in that week's coursework.

---

## WEEK 5 — AGGREGATE FUNCTIONS, GROUPING AND OUTER JOINS

<badge color="success">Week 5</badge>

### Main learning objectives

Students should be able to summarize data using aggregate functions, group records, filter grouped results, and retrieve matching or unmatched records using outer joins.

### Required course content

#### 5.1 Aggregate functions

Cover:

- `COUNT`
- `SUM`
- `AVG`
- `MIN`
- `MAX`

Generate exercises involving:

- Counting records.
- Calculating totals.
- Calculating averages.
- Finding minimum values.
- Finding maximum values.

Use realistic numeric and categorical data.

#### 5.2 NULL behavior in aggregate functions

Cover the behavior of aggregate functions when values are NULL.

Students should understand:

- How NULL values affect COUNT.
- How aggregate functions handle NULL values.
- The difference between counting rows and counting non-NULL values.
- How missing values influence calculations.

Generate exercises that specifically test these distinctions.

Do not assume NULL is equivalent to zero.

#### 5.3 GROUP BY

Cover:

- `GROUP BY`
- Grouping rows using one column.
- Grouping rows using multiple columns.
- Selecting grouped columns.
- Applying aggregate functions to groups.

Generate exercises involving:

- Average salary by department.
- Total sales by category.
- Number of students per course.
- Number of orders per customer.
- Minimum or maximum values per group.

#### 5.4 WHERE versus HAVING

Cover:

- `WHERE`
- `HAVING`
- Filtering rows before grouping.
- Filtering groups after aggregation.
- Understanding the difference between the two clauses.

Generate exercises where students must choose the correct clause.

Examples:

- Show departments with an average salary above a specified value.
- Show product categories with more than a specified number of products.
- Filter records before calculating group totals.

#### 5.5 LEFT OUTER JOIN

Cover:

- `LEFT JOIN`
- `LEFT OUTER JOIN`
- Matching and unmatched records.
- NULL values resulting from unmatched right-side records.

Generate exercises involving:

- Customers without orders.
- Departments without employees.
- Students without enrollments.
- Products without sales.

#### 5.6 RIGHT OUTER JOIN

Cover:

- `RIGHT JOIN`
- `RIGHT OUTER JOIN`
- Matching and unmatched records.
- Understanding which table's records are preserved.

Generate exercises requiring students to retrieve all records from the right-hand table, including those without a match.

#### 5.7 FULL OUTER JOIN

Cover:

- `FULL JOIN`
- `FULL OUTER JOIN`
- Returning matching and unmatched records from both sides.

Generate exercises involving realistic datasets where unmatched records exist on both sides.

#### 5.8 Combining Week 5 concepts

Generate more advanced exercises that combine:

- Aggregate functions.
- GROUP BY.
- HAVING.
- WHERE.
- INNER JOIN.
- LEFT JOIN.
- RIGHT JOIN.
- FULL OUTER JOIN.

Use only combinations supported by the course.

Students should be able to solve realistic reporting and data-analysis problems.

### Week 5 exercise requirements

Minimum: **40 exercises**.

Target difficulty distribution:

- 20% Easy.
- 45% Medium.
- 35% Hard.

Suggested progression:

**Easy**

- Basic COUNT, SUM, AVG, MIN, and MAX.
- Simple GROUP BY.
- Basic LEFT JOIN.
- Understanding NULL behavior.

**Medium**

- GROUP BY with multiple columns.
- WHERE and HAVING.
- Aggregates with joins.
- RIGHT JOIN and FULL OUTER JOIN.
- Filtering grouped results.

**Hard**

- Combining several joins with aggregate functions.
- Multi-column grouping.
- More involved HAVING conditions.
- Queries involving unmatched records.
- Understanding NULL behavior in outer joins and aggregates.
- Multi-step reporting queries.

---

# 3. EXERCISE QUANTITY

Generate at least the following number of exercises:

| Week      | Minimum exercises |
| --------- | ----------------: |
| Week 2    |                30 |
| Week 3    |                35 |
| Week 4    |                35 |
| Week 5    |                40 |
| **TOTAL** |           **140** |

These are minimum targets.

Generate more exercises if this improves coverage and variety.

Do not generate repetitive or artificial questions just to reach the target.

If the actual course materials do not support enough unique questions for a particular topic, prioritize correctness over quantity.

Do not introduce material outside the syllabus to fill gaps.

Each exercise must be assigned to the correct week and topic.

Use clear topic IDs, for example:

- `sql-week2-select`
- `sql-week2-filtering`
- `sql-week2-sorting`
- `sql-week2-pagination`
- `sql-week3-conversion`
- `sql-week3-text-functions`
- `sql-week3-numeric-functions`
- `sql-week3-date-functions`
- `sql-week4-inner-joins`
- `sql-week4-multi-table-joins`
- `sql-week4-self-joins`
- `sql-week4-non-equi-joins`
- `sql-week5-aggregates`
- `sql-week5-group-by`
- `sql-week5-having`
- `sql-week5-outer-joins`

You may organize topics more finely where useful, but every topic must belong to one of the four weeks.

---

# 4. CRITICAL REQUIREMENT — EXERCISE TYPE DISTRIBUTION: 90/10

**THE PACKAGE MUST CONSIST OF APPROXIMATELY 90% SQL QUERY-WRITING EXERCISES AND 10% MULTIPLE-CHOICE QUESTIONS.**

This is mandatory.

The purpose of this package is to make students practise writing SQL queries themselves.

Do NOT generate a package consisting mostly of multiple-choice questions.

Do NOT use MCQs as a substitute for actual SQL query-writing practice.

## Required distribution

For 140 exercises, generate:

- **126 `sql-query` exercises (90%).**
- **14 `mcq-single` exercises (10%).**

The distribution should remain as close to 90/10 as possible.

## Exercise type 1 — `sql-query` (90%)

This must be the dominant exercise type.

Students must write a complete SQL query themselves.

Use this type for tasks such as:

- Retrieving selected columns.
- Filtering records.
- Sorting results.
- Removing duplicate results.
- Applying pattern matching.
- Handling NULL values.
- Using FETCH and OFFSET.
- Converting values.
- Formatting text and dates.
- Performing numeric calculations.
- Using text functions.
- Joining tables.
- Joining multiple tables.
- Performing self-joins.
- Performing non-equi joins.
- Calculating aggregates.
- Grouping records.
- Filtering groups.
- Using outer joins.
- Combining multiple taught SQL concepts.

The instructions must describe the desired result, not provide the query itself.

For example:

"Display the names and salaries of all employees in the IT department, ordered by salary from highest to lowest."

The student must construct the SQL query.

Do not turn a query-writing exercise into a multiple-choice question.

## Exercise type 2 — `mcq-single` (10%)

Use MCQs sparingly.

Reserve them for conceptual understanding, such as:

- Understanding what a SQL clause does.
- Understanding the difference between WHERE and HAVING.
- Understanding NULL behavior.
- Recognizing the purpose of a JOIN.
- Understanding the difference between INNER JOIN and OUTER JOIN.
- Understanding aggregate functions.
- Understanding the purpose of DISTINCT.
- Understanding how a function behaves.

Each MCQ must have exactly one correct answer.

Required fields:

- `options`: array of answer options.
- `expected`: array containing the zero-based index of the correct option.

Do not use MCQs for tasks that are better tested by asking the student to write SQL.

## Distribution across weeks

Do not put all MCQs in one week.

Aim for this distribution:

| Week      | SQL-query |    MCQ |   Total |
| --------- | --------: | -----: | ------: |
| Week 2    |        27 |      3 |      30 |
| Week 3    |        32 |      3 |      35 |
| Week 4    |        31 |      4 |      35 |
| Week 5    |        36 |      4 |      40 |
| **Total** |   **126** | **14** | **140** |

Practical SQL topics must overwhelmingly contain `sql-query` exercises.

## Mandatory exercise-type validation

Before returning the JSON:

1. Count every `sql-query` exercise.
2. Count every `mcq-single` exercise.
3. Verify that the distribution is approximately 90/10.
4. Verify that students are required to write SQL in the query exercises.
5. Verify that all four weeks contain practical SQL-writing exercises.
6. Verify that MCQs are used mainly for conceptual learning.

Do not output the package until this check is complete.

Do not invent additional exercise type identifiers.

---

# 5. DIFFICULTY DISTRIBUTION

Every exercise must have one of these exact difficulty values:

- `Easy`
- `Medium`
- `Hard`

Use the difficulty distributions specified for each week.

| Week   | Easy | Medium | Hard |
| ------ | ---: | -----: | ---: |
| Week 2 |  40% |    40% |  20% |
| Week 3 |  30% |    45% |  25% |
| Week 4 |  25% |    45% |  30% |
| Week 5 |  20% |    45% |  35% |

Difficulty must reflect the actual SQL knowledge required.

## Easy

Examples:

- Basic SELECT.
- Selecting columns.
- Simple WHERE conditions.
- Basic sorting.
- Simple text functions.
- Basic numeric functions.
- Simple date extraction.
- Basic INNER JOIN.
- Simple COUNT or SUM.
- Basic GROUP BY.

## Medium

Examples:

- Combining several filtering conditions.
- Combining multiple SQL functions.
- Using conversions.
- Combining date and numeric calculations.
- Joining three tables.
- Using self-joins.
- Combining GROUP BY and aggregate functions.
- Using HAVING.
- Using outer joins.

## Hard

Examples:

- Combining several features from the same week.
- Multi-step data transformations.
- Complex filtering and sorting.
- More involved date calculations.
- Multiple-table joins with several conditions.
- Non-equi joins.
- Self-joins with multiple conditions.
- Aggregate queries involving several tables.
- GROUP BY with multiple columns and HAVING.
- Outer joins involving unmatched records and NULL values.

**Hard questions must remain within the taught SQL syllabus.**

Do not make a question Hard by using an excluded feature.

---

# 6. DATASET GENERATION — CREATE MULTIPLE DIFFERENT DATASETS

This is a critical requirement.

The package must contain several genuinely different datasets.

Do not create one dataset and reuse it for every exercise.

Do not create multiple datasets that are merely copies with renamed tables.

Generate at least **four separate synthetic PostgreSQL datasets** with different subject areas and table structures.

Each dataset must be usable by multiple exercises.

## Dataset 1 — Business / Employee Management

Create a realistic business dataset.

Suggested tables:

- `employees`
- `departments`
- `locations`
- `jobs` or another related table, if useful and supported by the coursework.

Possible columns:

- Employee ID.
- First name.
- Last name.
- Department ID.
- Manager ID.
- Salary.
- Hire date.
- Job title.
- Location ID.

Include:

- Primary keys.
- Foreign keys.
- NULL values where realistic.
- Employees without managers.
- Departments without employees.
- Different salaries.
- Different hire dates.
- Multiple employees in the same department.

This dataset should support:

- Week 2 filtering and sorting.
- Week 3 text, numeric, and date functions.
- Week 4 joins and self-joins.
- Week 5 aggregates and outer joins.

## Dataset 2 — Education / Student Administration

Create a realistic educational dataset.

Suggested tables:

- `students`
- `courses`
- `enrollments`
- `teachers`
- `departments` or another related table, if useful.

Possible columns:

- Student ID.
- Student name.
- Date of birth.
- Email.
- Course ID.
- Course name.
- Teacher ID.
- Enrollment date.
- Grade or result.
- Course capacity.

Include:

- Students enrolled in multiple courses.
- Courses with multiple students.
- Students without enrollments.
- Courses without enrollments.
- NULL values where realistic.
- Different dates and numeric values.
- Appropriate primary and foreign keys.

This dataset should support:

- Filtering students.
- Text manipulation.
- Date calculations.
- Multi-table joins.
- Aggregates.
- GROUP BY and HAVING.
- Outer joins.

## Dataset 3 — Retail / Inventory / Orders

Create a realistic retail dataset.

Suggested tables:

- `customers`
- `products`
- `categories`
- `orders`
- `order_items`

Possible columns:

- Customer ID.
- Customer name.
- City.
- Product ID.
- Product name.
- Category ID.
- Price.
- Stock quantity.
- Order ID.
- Order date.
- Quantity ordered.
- Unit price.

Include:

- Customers with multiple orders.
- Customers without orders.
- Products that have never been ordered.
- Orders with multiple products.
- Multiple product categories.
- Different prices and quantities.
- NULL values where realistic.
- Appropriate primary and foreign keys.

This dataset should support:

- Week 2 filtering and sorting.
- Week 3 numeric calculations and text functions.
- Week 4 multi-table joins.
- Week 5 totals, averages, grouping, and outer joins.

## Dataset 4 — Training / Projects / Services

Create a fourth dataset with a different structure and purpose.

Possible scenario:

A company manages projects, employees, training sessions, or services.

Suggested tables:

- `projects`
- `employees`
- `project_assignments`
- `training_sessions`
- `participants`

Use the tables that best support the taught concepts.

Include:

- Relationships between tables.
- Records with and without matching records.
- Multiple assignments.
- Different dates.
- Numeric values.
- Text values.
- NULL values where realistic.
- Primary and foreign keys.

This dataset should provide fresh scenarios rather than repeating the employee, student, or retail exercises.

## Dataset quality requirements

Each dataset must:

1. Have a unique dataset ID.
2. Have a meaningful title.
3. Have a version.
4. Contain a complete PostgreSQL setup script.
5. Define every table needed by its exercises.
6. Define primary keys.
7. Define foreign keys where appropriate.
8. Insert enough records to make the exercises meaningful.
9. Contain varied data values.
10. Include NULL values where useful.
11. Include duplicate values where useful.
12. Include unmatched records where needed for outer joins.
13. Support all exercises that reference it.

Use enough records to avoid trivial results.

As a general target:

- Simple datasets should contain at least 10–15 rows in their main tables.
- Larger relational datasets should contain enough records to support grouping, filtering, joins, and aggregate exercises.
- Relationship tables should contain multiple records for some parent records and none for others.

Do not generate datasets with only three or four rows unless a very specific exercise requires a small example.

## Dataset diversity

Across the four datasets, vary:

- Table names.
- Column names.
- Data types.
- Relationships.
- Number of tables.
- Number of records.
- Text values.
- Numeric values.
- Date values.
- NULL patterns.

Do not make every dataset an employee database.

Do not make every exercise use the same table names.

## Dataset scripts

Each dataset must have a complete SQL setup script in its `sql` field.

The script must contain:

- CREATE TABLE statements.
- Primary key definitions.
- Foreign key definitions.
- INSERT statements.
- All data required by the exercises using that dataset.

The SQL script must be executable in PostgreSQL.

Ensure:

- Tables are created in a valid order.
- Referenced tables exist before foreign keys are created.
- Insert statements respect foreign key constraints.
- Data types match inserted values.
- Every referenced column exists.
- No duplicate primary keys exist.
- All inserted data is valid.

Do not use unsupported SQL features in the dataset scripts.

---

# 7. DATASET ASSIGNMENT

Every `sql-query` exercise must reference exactly one dataset using:

`datasetId`

The referenced dataset must contain all tables and columns needed by that exercise.

Use the datasets strategically.

For example:

- Employee exercises should use the employee dataset.
- Student and enrollment exercises should use the education dataset.
- Product and order exercises should use the retail dataset.
- Project and training exercises should use the fourth dataset.

Do not assign an exercise to a dataset that does not support its query.

Do not make up dataset IDs.

Every `datasetId` must match an ID in the top-level `datasets` array.

MCQs do not need a dataset if they are purely conceptual. If an MCQ refers to actual table data, it must reference the relevant dataset where the supplied schema supports that field.

---

# 8. REFERENCE SOLUTIONS

Every SQL-query exercise must have a correct `referenceSolution`.

This is one of the most important parts of the package.

The reference solution must:

- Be valid PostgreSQL.
- Use only taught SQL features.
- Reference tables that exist in the assigned dataset.
- Reference columns that exist in those tables.
- Produce the requested result.
- Be logically correct.
- Avoid unnecessary advanced SQL.
- Avoid features outside the coursework.

Do not generate solutions that merely look plausible.

## Validate every reference solution

Before outputting the JSON, internally check every solution against the relevant dataset.

Verify:

1. The table exists.
2. Every referenced column exists.
3. Aliases are used correctly.
4. JOIN conditions are correct.
5. Functions are used with valid arguments.
6. Data types are compatible.
7. NULL handling is correct.
8. GROUP BY is correct where required.
9. HAVING is used appropriately.
10. ORDER BY is correct where required.
11. The query produces the requested result.
12. The solution does not use excluded features.

Where possible, mentally execute or test the query against the generated dataset.

Do not include a reference solution that has not been checked for schema consistency.

## Alternative solutions

If multiple correct SQL solutions exist, the `referenceSolution` should contain one clear and straightforward solution using the taught material.

Do not use advanced syntax simply because it is shorter.

The reference solution should reflect the method students are expected to learn.

---

# 9. SQL RESULT COMPARISON SETTINGS

The supplied schema includes fields such as:

- `orderMatters`
- `compareColumnNames`
- `columnOrderMatters`

Set these correctly for every SQL-query exercise.

## orderMatters

Use:

- `true` when the requested result requires a specific row order.
- `false` when the rows may appear in any order.

If the exercise explicitly asks students to sort results, set `orderMatters` to `true`.

If the order is irrelevant, set it to `false`.

## compareColumnNames

Use the value that matches the application's intended result-comparison behavior.

Do not set it randomly.

Use `true` when the expected result should require matching column names, if that is the application's supported behavior.

Use `false` when the application compares the result data without requiring exact column names.

Follow the supplied JSON schema and any comparison conventions demonstrated in the example.

## columnOrderMatters

Use:

- `true` when columns must appear in a specified order.
- `false` when column order is not important.

If the instructions specify a particular order of displayed columns, use `true`.

Make sure these flags are consistent with the exercise instructions and reference solution.

---

# 10. SQL EXERCISE QUALITY AND VARIETY

Do not generate hundreds of exercises that ask students to do the same thing with different names.

Generate a genuinely varied exercise collection.

Use a mixture of:

1. Basic data retrieval.
2. Filtering.
3. Sorting.
4. Pagination.
5. Pattern matching.
6. NULL handling.
7. Type conversion.
8. Text manipulation.
9. Numeric calculations.
10. Date calculations.
11. Date formatting.
12. Two-table joins.
13. Multi-table joins.
14. Self-joins.
15. Non-equi joins.
16. Aggregate calculations.
17. Grouping.
18. HAVING conditions.
19. Outer joins.
20. Multi-step query construction.

## Avoid repetitive exercises

Bad example:

- Show all employees in IT.
- Show all employees in HR.
- Show all employees in Sales.
- Show all employees in Finance.

These exercises test almost exactly the same thing.

Instead, vary the task:

- Filter by a department.
- Filter using a numeric range.
- Filter using multiple conditions.
- Find missing values.
- Sort by multiple columns.
- Retrieve a limited number of results.
- Use a pattern match.
- Combine filtering and sorting.

The same principle applies to every week.

## Realistic scenario instructions

Write exercise instructions as realistic tasks.

For example:

"Management wants to identify employees hired after 1 January 2022. Display their names and hire dates, ordered from newest to oldest."

Or:

"The sales team wants to know the total quantity sold for each product. Display the product name and total quantity sold."

Do not provide the SQL solution in the instructions.

Do not make the instructions unnecessarily vague.

The student should understand the required output without being told exactly how to write the query.

---

# 11. HINTS AND EXPLANATIONS

Use `hints` and `explanation` where appropriate.

## Hints

Hints should:

- Guide the student toward the right SQL concepts.
- Avoid revealing the complete solution.
- Help students recognize which clauses or functions may be needed.
- Be appropriate for the difficulty level.

Examples:

- "Think about which clause filters individual rows."
- "You need to combine information from two related tables."
- "Consider whether the missing values should be checked using IS NULL."
- "You need to calculate a result for each group."

Do not give the complete query as a hint.

## Explanations

Explanations should:

- Explain why the solution works.
- Explain the relevant SQL concepts.
- Clarify common mistakes.
- Stay within the coursework.
- Be educational and concise.

For example:

"GROUP BY creates one result group for each department. AVG then calculates the average salary within each group."

Avoid generic explanations such as:

"This query is correct because it returns the requested data."

For SQL-query exercises, explain the important parts of the query.

---

# 12. JSON STRUCTURE

Follow the supplied JSON example/schema exactly.

The top-level JSON object must contain:

{
"schemaVersion": 1,
"packageId": "sql-course",
"version": "1.0.0",
"topics": [],
"datasets": [],
"exercises": []
}

Do not change the schema version.

## Topics

Each topic must contain:

- `id`
- `title`
- `examEligible`

Use meaningful topic IDs that reflect the course week and subject.

Examples:

- `sql-week2-select`
- `sql-week2-filtering`
- `sql-week2-sorting`
- `sql-week2-pagination`
- `sql-week3-conversion`
- `sql-week3-text-functions`
- `sql-week3-numeric-functions`
- `sql-week3-date-functions`
- `sql-week4-inner-joins`
- `sql-week4-multi-table-joins`
- `sql-week4-self-joins`
- `sql-week4-non-equi-joins`
- `sql-week5-aggregates`
- `sql-week5-group-by`
- `sql-week5-having`
- `sql-week5-outer-joins`

Every included topic must have:

`"examEligible": true`

Do not create topics for excluded material.

## Datasets

Each dataset must contain the fields demonstrated in the supplied example:

- `id`
- `version`
- `title`
- `sql`

Example structure:

{
"id": "sql-business",
"version": "1",
"title": "Business and employee management",
"sql": "CREATE TABLE ..."
}

The `sql` value must contain the complete setup script.

Use at least four separate datasets.

## SQL-query exercises

Each SQL-query exercise must contain the common fields shown in the supplied example:

- `id`
- `course`
- `category`
- `topic`
- `title`
- `instructions`
- `difficulty`
- `type`
- `examEligible`
- `provenance`
- `contentVersion`
- `datasetId`
- `referenceSolution`
- `orderMatters`
- `compareColumnNames`
- `columnOrderMatters`

Optional fields:

- `hints`
- `explanation`

Use:

- `"course": "sql"`
- `"type": "sql-query"`
- `"examEligible": true`
- `"contentVersion": 1`
- `"provenance": "sql_exam_cheat_sheet.md"` or an accurate source description.

Every SQL-query exercise must reference a valid dataset.

## MCQ exercises

Use:

`"type": "mcq-single"`

Required fields:

- `options`
- `expected`

Example:

{
"id": "sql-week2-select-001",
"course": "sql",
"category": "select",
"topic": "sql-week2-select",
"title": "Understanding DISTINCT",
"instructions": "What is the purpose of DISTINCT in a SELECT query?",
"difficulty": "Easy",
"type": "mcq-single",
"examEligible": true,
"provenance": "sql_exam_cheat_sheet.md",
"contentVersion": 1,
"options": [
"Sorts the result",
"Removes duplicate result rows",
"Filters rows using a condition",
"Limits the number of rows"
],
"expected": [1],
"explanation": "DISTINCT removes duplicate rows from the query result."
}

MCQs must also use only course material.

## IDs

Every topic, dataset, and exercise must have a unique and meaningful ID within its relevant collection.

Recommended exercise ID pattern:

`sql-week[number]-[topic]-[number]`

Examples:

- `sql-week2-select-001`
- `sql-week2-filtering-001`
- `sql-week3-text-001`
- `sql-week4-joins-001`
- `sql-week5-aggregates-001`

Do not reuse exercise IDs.

Do not reference nonexistent topics or datasets.

---

# 13. DATASET AND EXERCISE CONSISTENCY VALIDATION

Before producing the final JSON, perform a full consistency check.

## Dataset validation

Check that:

- Every dataset ID is unique.
- Every dataset contains a valid setup script.
- Every table referenced by an exercise exists.
- Every column referenced by an exercise exists.
- Primary keys are valid.
- Foreign keys reference existing tables and columns.
- Insert statements are valid.
- Insert order respects foreign keys.
- The datasets contain sufficient data.
- The datasets contain the records needed for the exercises.
- The datasets support NULL and unmatched-record exercises where required.

## Exercise validation

Check that:

- Every exercise has a unique ID.
- Every exercise references an existing topic.
- Every SQL-query exercise references an existing dataset.
- Every reference solution uses the correct dataset.
- Every exercise belongs to the correct week.
- Every exercise has `"course": "sql"`.
- Every exercise has `"examEligible": true`.
- Every exercise has a valid difficulty.
- Every exercise uses a supported exercise type.
- Every SQL-query exercise has a reference solution.
- Every MCQ has exactly one correct answer.
- Every MCQ expected index is correct.
- Every exercise is answerable using the taught material.

## SQL validation

Check that:

- All queries use PostgreSQL syntax.
- All queries use existing tables and columns.
- All JOIN conditions are valid.
- All functions are used correctly.
- All data types are compatible.
- All grouping and aggregate logic is valid.
- NULL handling is correct.
- Sorting flags match the instructions.
- No excluded SQL features appear.
- No reference solution is incomplete.

## Course validation

Check that:

- Week 2 contains only Week 2 material.
- Week 3 contains only Week 3 material.
- Week 4 contains only Week 4 material.
- Week 5 contains only Week 5 material.
- Difficulty distributions are approximately correct.
- The 90/10 exercise type distribution is respected.
- The four datasets are genuinely different.
- Exercises are varied and not duplicates.

Do not output the JSON until all these checks have been completed.

---

# 14. FINAL OUTPUT REQUIREMENTS

Your final response must contain the complete JSON package.

Do not provide:

- An introduction.
- A summary.
- A list of what you generated.
- Markdown code fences.
- Comments.
- Explanations outside the JSON.
- Placeholder exercises.
- Placeholder datasets.
- Empty exercise objects.
- "Continue generating later" messages.
- Truncated arrays.
- Instructions for me to finish the JSON manually.

Output the complete JSON object, beginning with `{` and ending with `}`.

The JSON must be ready to save directly as:

`sql-course.json`

If the response length limit prevents you from outputting everything in one response:

- Split the JSON into clearly numbered consecutive parts.
- Preserve the exact JSON structure across parts.
- Do not repeat or omit exercises.
- Clearly indicate where each part continues.
- Ensure that all parts can be concatenated into one valid JSON object.
- Never replace missing content with placeholders.

The final JSON must include:

- All topics.
- All four datasets.
- All exercises.
- All reference solutions.
- All comparison settings.
- All hints and explanations that are appropriate.

**FINAL PRIORITIES:**

1. Use only the actual examinable SQL coursework.
2. Follow the exact Week 2–5 progression.
3. Generate at least 140 meaningful exercises.
4. Make approximately 90% of exercises actual SQL query-writing tasks.
5. Make approximately 10% multiple-choice questions.
6. Generate at least four genuinely different PostgreSQL datasets.
7. Ensure every SQL exercise has a valid dataset and executable reference solution.
8. Ensure the JSON follows the supplied application schema exactly.
9. Return the complete JSON package.


- An introduction.
- A summary.
- A list of what you generated.
- Markdown code fences.
- Comments.
- Explanations outside the JSON.
- Placeholder exercises.
- Placeholder datasets.
- Empty exercise objects.
- "Continue generating later" messages.
- Truncated arrays.
- Instructions for me to finish the JSON manually.

Output the complete JSON object, beginning with `{` and ending with `}`.

The JSON must be ready to save directly as:

`sql-course.json`

If the response length limit prevents you from outputting everything in one response:

- Split the JSON into clearly numbered consecutive parts.
- Preserve the exact JSON structure across parts.
- Do not repeat or omit exercises.
- Clearly indicate where each part continues.
- Ensure that all parts can be concatenated into one valid JSON object.
- Never replace missing content with placeholders.

The final JSON must include:

- All topics.
- All four datasets.
- All exercises.
- All reference solutions.
- All comparison settings.
- All hints and explanations that are appropriate.

**FINAL PRIORITIES:**

1. Use only the actual examinable SQL coursework.
2. Follow the exact Week 2–5 progression.
3. Generate at least 140 meaningful exercises.
4. Make approximately 90% of exercises actual SQL query-writing tasks.
5. Make approximately 10% multiple-choice questions.
6. Generate at least four genuinely different PostgreSQL datasets.
7. Ensure every SQL exercise has a valid dataset and executable reference solution.
8. Ensure the JSON follows the supplied application schema exactly.
9. Return the complete JSON package.
