# MASTER PROMPT: GENERATE A COMPLETE OS / LINUX EXERCISE JSON PACKAGE

You are an expert educational exercise generator. Your task is to generate a large, high-quality, exam-focused JSON exercise package for the Operating Systems / Linux coursework.

You will receive:

1. `Linux_Summary.md`: the authoritative source for the course content.
2. A JSON example/schema: the required structure and format for the generated exercise package.

Your task is to generate a complete OS exercise package using ONLY the examinable content supported by the Markdown summary and the restrictions in this prompt.

The final result must be a complete, valid JSON object that can be saved directly as `os-course.json`.

---

# 1. ABSOLUTE COURSE CONTENT RESTRICTIONS

The most important rule is:

**Generate exercises ONLY about material that belongs to the actual examinable coursework.**

The Markdown summary is the source of course information, but not everything mentioned in it is necessarily examinable.

You must follow the explicit inclusions and exclusions in this prompt.

## Strict exclusions: NEVER generate exercises about these topics

The following material is NOT part of the exam and must be completely excluded:

- `grep`
- Regular expressions (regex)
- Basic Regular Expressions (BRE)
- Extended Regular Expressions (ERE)
- Regex pattern construction
- Regex matching
- Regex metacharacters and operators
- POSIX regex character classes, such as `[:digit:]`, `[:alpha:]`, and `[:alnum:]`
- Exercises asking students to identify, write, interpret, or debug regular expressions
- Exercises using `grep` options or arguments
- Exercises involving regex-based text searching
- Regex-based `sed` exercises

This exclusion applies even if these subjects appear in `Linux_Summary.md`.

**Do not create even one exercise about these excluded subjects. Do not include them as distractors in multiple-choice questions. Do not create questions that indirectly test them.**

You must also avoid:

- Introducing Linux commands that are not covered by the coursework.
- Introducing command options that are not covered by the coursework.
- Testing advanced Linux knowledge simply because it is generally useful.
- Inventing course topics or a weekly structure that is not present in the source.
- Treating optional or supplementary material as examinable unless the coursework explicitly establishes that it is required.

If you are uncertain whether something is examinable, leave it out.

## General rule

The prompt and the supplied Markdown summary together define the complete permitted course scope.

Do not use your general Linux knowledge to expand the syllabus.

---

# 2. COURSE TOPICS AND REQUIRED EXERCISE COVERAGE

Generate exercises covering the following subjects.

The subject descriptions below establish the intended coverage. However, the Markdown summary remains authoritative for exact terminology, commands, syntax, flags, and details.

Do not generate material beyond what the summary supports.

## TOPIC 1: LINUX FUNDAMENTALS

Cover the fundamental concepts explicitly included in the summary, such as:

- UNIX and Linux
- Linux distributions
- GNU
- GPL
- Free and Open Source Software (FOSS)
- The Linux kernel
- Shell
- Terminal
- Root user
- Filesystem concepts
- Absolute and relative paths
- Current directory
- Parent directory
- Inodes
- File metadata

Generate conceptual questions that test understanding rather than simple memorization alone.

Minimum: 10 exercises.

## TOPIC 2: SHELL BASICS AND COMMAND SYNTAX

Cover:

- Commands
- Options and arguments
- Short options
- Long options
- Command syntax
- Shell expansion, where covered
- Brace expansion, where covered
- Tilde expansion, where covered
- Variable expansion, where covered
- Wildcard expansion, where covered
- Command separators such as `;`
- Comments
- Backslash line continuation
- Command history
- Recalling previous commands
- Exiting the shell

Only include syntax and expansion types explicitly supported by the summary.

Minimum: 15 exercises.

## TOPIC 3: WILDCARDS AND GLOBBING

Cover the shell wildcard and filename expansion features included in the coursework:

- `*`
- `?`
- Character lists such as `[abc]`
- Negated character lists such as `[!abc]` or `[^abc]`, if covered
- Character ranges
- Hidden files
- Brace expansion
- Other globbing patterns explicitly included in the summary

Important:

- These are shell wildcard and globbing exercises, NOT regular-expression exercises.
- Do not introduce regex concepts.
- Do not confuse shell globbing with regular expressions.

Minimum: 15 exercises.

## TOPIC 4: NAVIGATION AND SYSTEM INFORMATION

Cover the commands and options included in the summary:

- `cd`
- `cd -`
- `cd ~`
- `cd ..`
- `cd /`
- `pwd`
- `ls`
- `man`
- `whoami`
- `date`
- `history`
- `exit`
- Ctrl+D

For `ls`, cover only options explicitly included in the coursework, such as:

- `-l`
- `-a`
- `-A`
- `-d`
- `-R`
- `-h`
- `-s`
- `-i`
- `-t`
- `-r`
- `-1`

Do not assume every option above is examinable if the summary says otherwise.

Minimum: 20 exercises.

## TOPIC 5: FILE INSPECTION

Cover:

- `file`
- `stat`
- `cat`
- `head`
- `tail`
- `less`
- `more`
- `wc`

Test:

- What each command does.
- Which command is appropriate for a given task.
- How to use the documented options.
- Understanding the output.
- Differences between similar commands.

Minimum: 15 exercises.

## TOPIC 6: FILE AND DIRECTORY MANAGEMENT

Cover:

- `mkdir`
- `touch`
- `cp`
- `mv`
- `rm`
- `rmdir`

Include only options explicitly covered in the coursework, for example:

- `mkdir -p`
- `cp -r`
- `cp -i`
- `mv -i`
- `rm -r`
- `rm -i`
- `rm -f`

Test:

- Creating files and directories.
- Copying files and directories.
- Moving and renaming files.
- Removing files and directories.
- Understanding the consequences of commands.
- Choosing the correct command for a practical situation.

Minimum: 20 exercises.

## TOPIC 7: CORE TEXT UTILITIES

Cover the text utilities explicitly included in the exam coursework.

Potential commands include:

- `echo`
- `sed`: ONLY non-regex functionality explicitly taught and examinable in the summary.
- `cut`
- `sort`
- `uniq`
- `tr`
- `tee`
- `wc`
- `ps`: only if included as examinable coursework.

Also include `cat`, `head`, and `tail` where appropriate to the course content.

Test:

- Understanding what each utility does.
- Choosing the correct utility for a task.
- Combining documented utilities where the coursework teaches this.
- Understanding command output.
- Using only documented options.
- Understanding the difference between utilities.

**Do not include `grep` under any circumstances.**

**Do not include regular expressions or regex-based `sed` usage.**

Do not invent options or functionality for any command.

Minimum: 20 exercises.

## TOPIC 8: INPUT AND OUTPUT REDIRECTION

Cover:

- Standard input (stdin)
- Standard output (stdout)
- Standard error (stderr)
- `>`
- `>>`
- `<`
- `2>`
- `2>>`
- Combining redirections, only if covered
- Pipes (`|`)
- `tee`

Test:

- Understanding where command output goes.
- Redirecting output to files.
- Appending instead of overwriting.
- Redirecting errors.
- Using pipes to connect commands.
- Understanding the difference between redirection and pipes.
- Predicting the result of a command sequence.

Minimum: 15 exercises.

## TOPIC 9: HARD LINKS AND SYMBOLIC LINKS

Cover:

- `ln`
- `ln -s`
- Inodes
- Hard links
- Symbolic links
- Differences between hard and symbolic links
- The behavior of links when files are moved or removed, only as explained in the summary.

Test both conceptual understanding and practical command construction.

Minimum: 12 exercises.

## TOPIC 10: QUOTING

Cover:

- Single quotes
- Double quotes
- Variable expansion inside quotes
- Preventing unwanted shell expansion
- Quoting spaces in filenames
- Quoting wildcard characters
- Other quoting behavior explicitly covered in the summary

Test students' ability to predict how the shell interprets commands.

Minimum: 12 exercises.

## TOPIC 11: USERS, GROUPS AND PASSWORDS

Cover the user and group management material in the summary:

- `su`
- `sudo`
- `useradd`
- `userdel`
- `usermod`
- `groupadd`
- `groupdel`
- `groupmod`, if covered
- `passwd`
- `/etc/passwd`
- `/etc/shadow`
- `/etc/group`
- `/etc/login.defs`
- User accounts
- Groups
- Password information
- Password aging

Only test commands, options, files, and configuration details actually included in the summary.

Minimum: 20 exercises.

## TOPIC 12: FILE PERMISSIONS

Cover:

- Read (`r`)
- Write (`w`)
- Execute (`x`)
- Owner
- Group
- Others
- Understanding `ls -l` permission output
- Symbolic permissions
- Numeric/octal permissions
- `chmod`
- `chown`
- `chgrp`
- `umask`
- SUID
- SGID
- Sticky bit

Include SUID, SGID, and sticky bit only if they are part of the actual examinable material.

Test:

- Interpreting permissions.
- Converting between symbolic and numeric permissions.
- Constructing `chmod` commands.
- Understanding ownership.
- Predicting permission effects.
- Understanding `umask`, where covered.
- Practical permission troubleshooting.

Minimum: 25 exercises.

## TOPIC 13: FINDING FILES WITH FIND

Cover the `find` command and its documented functionality:

- Starting paths
- Name-based searches
- File type
- File size
- Time-based searches
- Permissions
- Owner and group
- Tests and expressions
- `+n`, `-n`, and `n` behavior, if covered
- Actions, only if covered

Use only the syntax and options demonstrated in the summary.

Test students' ability to construct commands for realistic file-search tasks.

Minimum: 15 exercises.

## TOPIC 14: ARCHIVING AND COPYING FILES

Cover:

- `tar`
- `scp`

Include only the options and usage patterns documented in the summary.

Test:

- Creating archives.
- Extracting archives.
- Listing archive contents.
- Understanding the documented options.
- Copying files remotely using the taught `scp` syntax.
- Choosing the correct command for a scenario.

Minimum: 15 exercises.

## TOPIC 15: IMPORTANT LINUX DIRECTORIES AND FILES

Cover important directories and system files mentioned in the summary.

Examples may include:

- `/`
- `/home`
- `/root`
- `/etc`
- `/bin`
- `/sbin`
- `/usr`
- `/var`
- `/tmp`
- Other directories or files explicitly described in the summary.

Do not assume every example is examinable.

Test:

- Recognizing directory purposes.
- Identifying where specific files or configuration information are stored.
- Understanding filesystem organization.
- Matching a practical situation to the correct directory.

Minimum: 12 exercises.

## TOPIC 16: SHELL ENVIRONMENT AND CONFIGURATION

Cover environment variables and shell configuration only where they are explicitly included in the summary.

Possible content includes:

- Environment variables
- Variable values
- Exporting variables
- Shell configuration files
- Login and non-login shell behavior, if covered
- Other documented configuration concepts

Do not invent configuration files, variables, or shell behavior.

Minimum: 10 exercises.

## TOPIC 17: VIM

Cover Vim only to the extent explicitly included in the summary.

Potential material includes:

- Vim modes
- Normal mode
- Insert mode
- Command-line mode
- Navigation
- Editing
- Saving
- Quitting
- Documented commands and key combinations

Test:

- Identifying the current mode.
- Choosing the correct command or key.
- Moving around a file.
- Entering and leaving insert mode.
- Saving and quitting.
- Understanding the difference between commands.

Do not introduce advanced Vim functionality.

Minimum: 15 exercises.

---

# 3. EXERCISE QUANTITY

Generate at least the following number of exercises:

| Topic                               | Minimum exercises |
| ----------------------------------- | ----------------: |
| Linux fundamentals                  |                10 |
| Shell basics and syntax             |                15 |
| Wildcards and globbing              |                15 |
| Navigation and system information   |                20 |
| File inspection                     |                15 |
| File and directory management       |                20 |
| Core text utilities                 |                20 |
| Input and output redirection        |                15 |
| Hard and symbolic links             |                12 |
| Quoting                             |                12 |
| Users, groups and passwords         |                20 |
| File permissions                    |                25 |
| Find                                |                15 |
| Archiving and copying               |                15 |
| Important directories and files     |                12 |
| Shell environment and configuration |                10 |
| Vim                                 |                15 |
| **TOTAL**                           |           **261** |

These are minimums, not maximums.

You may generate more exercises when necessary to provide good coverage of the examinable content.

Do not generate filler questions merely to reach the target.

If a subject has less examinable content than expected, do not invent extra content. Prioritize correctness over quantity.

---

# 4. CRITICAL REQUIREMENT: EXERCISE TYPE DISTRIBUTION: 90/10

**THE PACKAGE MUST CONSIST OF APPROXIMATELY 90% COMMAND-WRITING EXERCISES AND 10% MULTIPLE-CHOICE QUESTIONS.**

This is a mandatory requirement.

The primary purpose of this package is to make students practise actually using Linux commands, not simply recognizing the correct answer.

## Required distribution

For a package of 261 exercises, generate:

- **235 `command-text` exercises (approximately 90%).**
- **26 `mcq-single` exercises (approximately 10%).**

The distribution must remain as close to 90/10 as possible.

Do NOT generate an equal split.
Do NOT generate mostly multiple-choice questions.
Do NOT replace command-writing exercises with MCQs because they are easier to create.

## Exercise type 1: `command-text` (90%)

This must be the dominant exercise type.

The student must actually type and construct the Linux command needed to complete the task.

Use command-writing exercises for practically every subject where command construction is possible.

Examples:

- Navigate to a specified directory.
- List files using a particular option.
- Create files and directories.
- Copy, move, rename, and remove files.
- Inspect files.
- Display selected file contents.
- Count lines, words, or characters.
- Sort or transform text using taught utilities.
- Redirect output into files.
- Append output to files.
- Construct pipes.
- Create hard and symbolic links.
- Change file permissions using `chmod`.
- Change file ownership.
- Manage users and groups.
- Search for files using `find`.
- Create, inspect, or extract archives using `tar`.
- Copy files using `scp`.
- Use shell quoting correctly.
- Perform supported Vim operations.

These must be genuine practical tasks. The student must produce the command themselves rather than select it from a list.

## Exercise type 2: `mcq-single` (10%)

Use multiple-choice questions sparingly.

Reserve them mainly for concepts that are better tested through recognition or interpretation, such as:

- Linux fundamentals.
- Understanding filesystem concepts.
- Understanding what commands do.
- Comparing similar commands.
- Interpreting command output.
- Understanding permission concepts.
- Understanding users and groups.
- Recognizing Vim modes.

Each MCQ must have exactly one correct answer.

Required fields:

- `options`: array of answer options.
- `expected`: array containing the zero-based index of the correct option.

## Required exercise structure

For `command-text`, use:

- `expected.accepted`: accepted correct answers.
- `expected.patterns`: answer-validation patterns where required by the application schema.

For `mcq-single`, use:

- `options`
- `expected`

Follow the supplied JSON schema exactly.

## Distribution across categories

Do not put all 26 MCQs into one category.

Spread them across categories where conceptual questions are most appropriate.

However, practical categories must overwhelmingly contain command-writing exercises.

For example:

- Navigation: primarily command-text.
- File inspection: primarily command-text.
- File management: primarily command-text.
- Text utilities: primarily command-text.
- Redirection: primarily command-text.
- Links: primarily command-text.
- Quoting: primarily command-text.
- Users and groups: primarily command-text.
- Permissions: primarily command-text.
- Find: primarily command-text.
- Archiving: primarily command-text.
- Vim: primarily command-text where practical.

Conceptual categories may contain proportionally more MCQs.

## Mandatory final validation

Before outputting the JSON:

1. Count all `command-text` exercises.
2. Count all `mcq-single` exercises.
3. Verify that the total is 261 or more, subject to the course-content restrictions.
4. Verify that approximately 90% are `command-text`.
5. Verify that approximately 10% are `mcq-single`.
6. Verify that command-writing exercises are spread across the practical categories.
7. Verify that command-text exercises genuinely require students to construct commands.

**The final package must be approximately 90% command-writing and 10% multiple-choice. This requirement takes priority over any default tendency to generate MCQs.**

# 5. DIFFICULTY LEVELS

Every exercise must have one of these exact difficulty values:

- `Easy`
- `Medium`
- `Hard`

Use the following general distribution across the package:

- Approximately 30% Easy.
- Approximately 45% Medium.
- Approximately 25% Hard.

Difficulty must reflect the actual thinking required.

## Easy

Examples:

- Recognizing what a command does.
- Identifying the correct command.
- Understanding basic terminology.
- Writing a simple command.
- Recognizing a basic permission value.

## Medium

Examples:

- Combining two or more concepts.
- Choosing between similar commands.
- Constructing commands with documented options.
- Interpreting command output.
- Applying a concept to a realistic scenario.
- Predicting the result of a short command sequence.

## Hard

Examples:

- Multi-step command construction.
- Combining several taught concepts.
- Troubleshooting a realistic situation.
- Interpreting complex permission information.
- Understanding the consequences of several commands.
- Solving a practical problem using multiple documented utilities.

Hard must still mean difficult within the coursework.

**Never make a question Hard by introducing material outside the syllabus.**

---

# 6. CREATE REALISTIC AND VARIED SCENARIOS

Do not make all exercises abstract or repetitive.

Use realistic Linux situations, such as:

- A student organizing files in their home directory.
- A shared project directory.
- A user who needs to inspect a file.
- A directory containing many files.
- A user who needs to create, copy, move, or delete files.
- A permissions problem.
- A user or group administration task.
- A system administrator checking documented system information.
- Redirecting command output into a file.
- Combining commands with pipes.
- Creating or extracting an archive.
- Searching for files using `find`.
- Working with links.
- Editing a file using Vim.

Scenarios must only use concepts covered in the coursework.

Create different names, filenames, directories, users, groups, and situations.

Avoid repeating the same question with only a different filename.

For command-writing exercises, give enough information for the student to know exactly what command they should construct.

---

# 7. QUESTION VARIETY

Generate a varied collection of exercises.

Do not simply generate hundreds of questions asking:

"What does command X do?"

Use a mixture of:

1. Command recognition.
2. Command construction.
3. Choosing the correct command.
4. Interpreting command output.
5. Predicting command behavior.
6. Identifying incorrect commands.
7. Understanding the difference between similar commands.
8. Understanding command options.
9. Practical scenario questions.
10. Multi-step command problems.
11. Permission interpretation and conversion.
12. Filesystem and directory questions.
13. Conceptual questions.
14. Troubleshooting questions.

For example, for permissions, do not only ask students to convert octal values. Also ask them to interpret permissions, construct `chmod` commands, and reason about ownership.

For redirection, do not only ask what `>` does. Also ask students to construct commands and predict whether output is overwritten, appended, or redirected.

For file management, vary the task between creating, copying, moving, renaming, and removing files.

For wildcards, include different valid globbing patterns and ask students to predict which filenames match.

Do not repeat questions with only superficial wording changes.

**Make sure question variety also applies to the interaction type: students must sometimes select an answer and sometimes produce an answer themselves.**

---

# 8. DATASETS AND SCENARIO INFORMATION

The supplied JSON schema contains a `datasets` array with SQL setup scripts.

This is an OS package, not an SQL package.

Therefore:

- Use `"datasets": []`.
- Do not create SQL datasets.
- Do not place SQL scripts in the OS package.
- Do not invent an alternative dataset schema.
- Put the necessary scenario information directly in the exercise instructions.

For example, an exercise can describe a directory structure directly:

"Assume your current directory contains the following files: report.txt, notes.txt, image.png and backup.tar."

This allows the exercise to be answered without needing an external dataset.

Use realistic and varied scenario details.

---

# 9. JSON STRUCTURE

Follow the supplied example JSON schema exactly.

The top-level JSON object must contain:

{
"schemaVersion": 1,
"packageId": "os-course",
"version": "1.0.0",
"datasets": [],
"exercises": []
}

## Exercises

Every exercise must include the fields required by its exercise type and the common fields shown in the supplied example.

Common fields:

- `id`
- `course`
- `category`
- `title`
- `instructions`
- `difficulty`
- `type`
- `examEligible`
- `provenance`
- `contentVersion`

Use:

- `"course": "os"`
- `"examEligible": true`
- `"contentVersion": 1`
- `"provenance": "Linux_Summary.md"` or a similarly accurate source description.

Use unique IDs for every exercise.

Recommended ID pattern:

`os-[category]-001`

For example:

- `os-navigation-001`
- `os-navigation-002`
- `os-permissions-001`
- `os-permissions-002`

Do not reuse IDs.

## Optional fields

Use `hints` when they genuinely help the student without revealing the answer.

Use `explanation` to explain why the correct answer is correct.

Do not add unsupported fields.

Do not change the schema.

---

# 10. HINTS AND EXPLANATIONS

Generate useful explanations for exercises.

Explanations should:

- Explain the underlying concept.
- Explain why the answer is correct.
- Clarify common misunderstandings.
- Stay within the coursework.
- Be concise but educational.

Hints should:

- Guide the student toward the solution.
- Avoid directly revealing the answer.
- Give a useful next step.
- Stay within the course material.

Do not generate generic explanations such as:

"Because this is the correct command."

Instead, explain what the command does and why it fits the task.

For command-text exercises, explanations should explain the command's structure and relevant options.

---

# 11. QUALITY CONTROL

Before producing the final JSON, internally validate the entire package.

## Content validation

Check that:

- Every exercise is supported by the coursework.
- No excluded subject appears.
- No `grep` exercises exist.
- No regex exercises exist.
- No regex-based `sed` exercises exist.
- No unsupported commands are introduced.
- No unsupported options are introduced.
- No advanced Linux concepts are added.
- No optional content is accidentally treated as exam content.
- All questions are answerable using the taught material.

## Exercise-type validation

Check that:

- Both `mcq-single` and `command-text` are used.
- Neither type is neglected.
- The overall distribution is approximately 50/50.
- Command-heavy categories include command-writing exercises.
- Command-text exercises require the student to construct a command.
- Command-text exercises are not simply MCQs disguised as typed-answer questions.
- The student is genuinely required to demonstrate practical command knowledge.

## Structural validation

Check that:

- The JSON is valid.
- Every exercise has a unique ID.
- Every exercise has a meaningful category.
- Every exercise has `"course": "os"`.
- Every exercise has `"examEligible": true`.
- Every difficulty is exactly `Easy`, `Medium`, or `Hard`.
- Every exercise type is supported.
- Every MCQ has exactly one correct answer.
- Every MCQ expected index points to the correct option.
- Every command-text exercise has a valid expected answer structure.
- The `datasets` array is empty.
- No unsupported fields are present.

## Educational quality validation

Check that:

- The exercises are genuinely varied.
- The questions are not duplicates.
- The difficulty distribution is reasonable.
- The questions test understanding and practical application.
- The explanations are correct.
- The command answers are syntactically valid.
- The questions are not ambiguous.
- Hard questions remain within the actual coursework.

Do not sacrifice correctness to reach the exercise count or the exercise-type distribution.

---

# 12. FINAL OUTPUT REQUIREMENTS

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
- "Continue generating later" messages.
- Truncated arrays.
- Instructions for me to finish the JSON manually.

Output the complete JSON object, beginning with `{` and ending with `}`.

The JSON must be ready to save directly as:

`os-course.json`

If the response length limit prevents you from outputting everything in one response:

- Split the JSON into clearly numbered consecutive parts.
- Preserve the exact JSON structure across parts.
- Do not repeat or omit exercises.
- Clearly indicate where each part continues.
- Ensure that all parts can be concatenated into one valid JSON object.
- Never replace missing content with placeholders.

**FINAL PRIORITIES:**

1. Generate exercises exclusively from the actual examinable OS coursework.
2. Completely exclude `grep` and regular expressions.
3. Generate a large and varied collection of exercises.
4. Include BOTH multiple-choice and command-writing exercises, aiming for approximately 50% of each.
5. Make students actually construct Linux commands, rather than only recognizing them.
6. Ensure every exercise is accurate, answerable, and compatible with the supplied JSON schema.
7. Return the complete JSON package.
   , answerable, and compatible with the supplied JSON schema.
8. Return the complete JSON package.
