# ACS Practice — Terminal exercises and Sandbox

This is an additive update for the supplied ACS Practice application. It adds an isolated browser terminal, a standalone Sandbox page with terminal and SQL modes, and a sample preconfigured file-management exercise. It is a constrained JavaScript simulation of a Linux-like shell and filesystem. It does **not** run a Linux kernel, native programs, host shell commands, Docker, or a virtual machine.

## Install

Back up the current files, then place the patched files as siblings in the application's existing `js/` directory:

- `app.js` — patched copy of the uploaded application script.
- `core.js` — patched package validator / core logic.
- `terminal.js` — new terminal implementation.

The supplied update also includes `index.html` with a Sandbox navigation link and `css/style.css` with a small set of Sandbox layout rules. The new page reuses the site's existing cards, buttons, SQL split layout, schema panel, PlantUML renderer, and table styling. `app.js` derives the terminal module URL relative to its own script. The terminal implementation remains in `terminal.js`; the module is dynamically imported only when a terminal exercise or the terminal Sandbox mode is opened.

Keep `terminal.js` next to `app.js` in `js/`. Do not put terminal implementation code into `app.js` or `core.js`. PGlite, `pglite-loader.js`, and `pglite-worker.js` are not modified. The SQL Sandbox uses the app's existing PGlite worker and serial query queue; exercise SQL still uses its original fresh-database behavior.

## Add a terminal exercise

The package schema remains version 1. A terminal exercise has `type: "terminal"` and a `terminal` configuration instead of the `expected` property used by answer-based OS exercises. The complete example package is in `terminal-example-package.json`. To include it as bundled app content, copy it to `content/os-terminal-intro.json` and add an entry to the existing `content/manifest.json` `packages` object (preserve all existing entries):

```json
"os-terminal-intro": {
  "version": "1.0.0",
  "files": ["os-terminal-intro.json"]
}
```

Required configuration:

```json
{
  "profile": "basic-linux",
  "initialDirectory": "/home/student",
  "checks": [
    {
      "id": "result-file",
      "type": "file",
      "path": "/home/student/project/result.txt",
      "points": 1,
      "description": "The result file exists."
    }
  ]
}
```

Paths in checks may be absolute or relative. Relative check paths are resolved from `terminal.initialDirectory` (default `/home/student`). Checks inspect the live virtual filesystem, not command history. Supported check types are:

- `exists`, `not_exists`, `file`, `directory`
- `content`, `contains`, `line_count`, `size`, `empty`
- `permissions`, `owner`, `group`, `executable`
- `symlink`, `file_type`, `directory_contents`

Each check can set `id`, `description`, and non-negative `points`; omitted points default to 1. Results include per-check feedback and partial credit. The exercise is marked fully correct in the app's existing practice-progress model only when all checks pass. Exam totals use the app's existing one-point-per-question scoring model; the per-check terminal score and feedback are shown in the exam result note.
Content checks compare the actual file string exactly, including every space, blank line, and final newline. JSON decodes `\n` in a check's `expected` value to a real newline before grading. For an expected value of `"Hello World\n"`, either `echo "Hello World" > project/hello.txt` or `printf 'Hello World\n' > project/hello.txt` creates the required one-line file. Do not type the two visible characters backslash and `n` unless the exercise explicitly requires them.

Use `printf` to create multi-line files without relying on a multiline command editor:

```bash
printf 'First line\nSecond line\n' > project/notes.txt
printf '%s\n%s\n' 'First line' 'Second line' > project/notes.txt
```

The content checker does not trim or normalize text: the example above creates exactly `First line\nSecond line\n` as actual line breaks, and the final newline is significant. A multi-line exact check is authored in JSON like this:

```json
{
  "type": "content",
  "path": "/home/student/project/notes.txt",
  "expected": "First line\nSecond line\n"
}
```

The JSON parser converts each `\n` escape into a real line-feed character before the checker compares it with the file. A `content` check is appropriate for an exact full-file match; use `contains` or `line_count` when only a portion or the number of lines matters.

Optional supported keys include `profile` (`basic-linux`, `basic`, or `intro-linux`), `initialDirectory`, `initialFilesystem`, `preSetupCommands`, top-level `hints`, `explanation`, `allowRetry`, and `resetOnRetry`. All exercise hints belong at the exercise's top level (`ex.hints`), just like other exercise types. Do not place hints inside `terminal`; the validator reports that as a package error. `initialFilesystem` is an array of absolute-path entries. Entries can specify `type` (`file`, `directory`, `symlink`), `content`, `target`, `mode`, `owner`/`uid`, and `group`/`gid`. Parent directories are created when needed; explicit directory entries are processed before files and links.

`preSetupCommands` is an optional array of up to 100 shell command strings (each at most 8,192 characters). They run in order as simulated `root`, using the same safe shell interpreter and virtual filesystem, before the student shell is started. They are hidden from student command history. Resetting an exercise, or starting a fresh attempt, rebuilds the filesystem and replays these commands. Use them to create starter directories and files, set modes, and assign ownership. Do not use them to remove the simulated `student` account. Example:

```json
"preSetupCommands": [
  "mkdir -p /home/student/inbox /home/student/work",
  "printf 'Starter file\\n' > /home/student/inbox/readme.txt",
  "chown student:student /home/student/inbox /home/student/work /home/student/inbox/readme.txt",
  "chmod 640 /home/student/inbox/readme.txt"
]
```

The sample package includes a second exercise, **Move, copy, rename and remove existing files**. Its files are created by `preSetupCommands`; students must operate on those existing files and grading checks the final file paths, preserved content, and permissions.

## Standalone Sandbox page

The navigation now contains **Sandbox**. It has two modes:

- **Terminal** opens a standalone, ungraded terminal workspace. Its storage key is separate from every package exercise (`__sandbox__ / terminal / default`), and the `Reset workspace` action recreates a clean sandbox filesystem.
- **SQL** lists every dataset loaded by the existing package loader. The selected database's `title` (falling back to its name/ID) is shown as the active database. The editor runs SQL against the selected dataset, and changes persist between statements while that database remains active in PGlite. Switching databases loads the newly selected dataset from its package SQL; **Reset database** restores the selected dataset to its original package state.

The SQL mode places the existing `schemaView()` panel beside the editor. It includes the same PlantUML ER diagram and the **Tables & relationships** view used in SQL practice exercises. The schema view reads the active sandbox database without resetting it. Use one SQL statement per Run action. The SQL sandbox is an interactive browser database workspace; it is not a server database and is not synchronized to an account. PGlite is still initialized by the host app's existing loader/worker.

A dataset is made available by adding it to any valid package's `datasets` object, for example:

```json
"datasets": {
  "inventory-demo": {
    "version": "1.0",
    "title": "Inventory Demo Database",
    "sql": "CREATE TABLE items (id integer primary key, name text); INSERT INTO items VALUES (1, 'Notebook');"
  }
}
```

## Command and shell compatibility

The command catalogue follows the **Commands** quick reference and command examples in the supplied *Operating System Fundamentals Summary*. The documented command names are implemented in the virtual shell:

- Shell/environment: `bash`, `clear`, `exit`, `logout`, `history`, `source`, `.`, `type`, `command`, `alias`, `unalias`, `unset`, `export`, `env`, `set`.
- Navigation/system: `date`, `cd`, `df`, `free`, `cal`, `hostname`, `id`, `last`, `ls`, `ps`, `pwd`, `uname`, `uptime`, `who`, `whoami`.
- File inspection: `cat`, `file`, `head`, `less`, `more`, `stat`, `tail`, `wc`.
- File operations: `cp`, `mkdir`, `mv`, `rm`, `rmdir`, `touch`, `ln`.
- Text processing: `echo`, `printf`, `cut`, `diff`, `nl`, `sort`, `tee`, `tr`, `uniq`, `vim`.
- Accounts/permissions: `chage`, `chgrp`, `chpasswd`, `chown`, `groups`, `groupadd`, `groupdel`, `groupmod`, `newgrp`, `passwd`, `su`, `sudo`, `useradd`, `userdel`, `usermod`, `visudo`, `chmod`, `umask`.
- Search/archive/transfer: `find`, `tar`, `scp`, `gzip`, `gunzip`.
- Help and extra tools used in the summary: `apropos`, `help`, `info`, `man`, `mandb`, `pinfo`, `kill`, `crontab`, `vimtutor`, `true`, `false`.

The commonly shown options and forms in the summary are supported, including:

| Area | Supported arguments and option forms |
| --- | --- |
| `ls` | `-l`, `-a`/`--all`, `-d`, `-R`/`--recursive`, `-h`/`--human-readable`, `-s`, `-i`, `-1`, `-F`; combined forms such as `-la`, `-lh`, `-lR` |
| System information | `uname -s/-r/-a`, `uptime -p`, `df -h`, `free -h/-k` (including combined short options), `cal YEAR` and `cal MONTH YEAR`, `ps -f`, `ps aux`, `ps -au` |
| File inspection | `file -b`, `stat -c FORMAT`, `cat -n`, `head -n N`/`head -N`, `tail -n N`/`tail -N`/`tail -n +N`, `wc -l/-w/-c/-m/-L` and combined options |
| File operations | `mkdir -p/-v`, `cp -r/-p/-v`, `mv -v`, `rm -r/-i/-f` and combined options, `rmdir`, `touch` |
| Text processing | `echo -n/-e/-E`, `printf` format strings, `cut -d/-f/-c/-s`, `sort -n/-r/-u/-f/-k`, `uniq -c/-d`, `tr -d/-s`, `tee -a`, `nl`, `diff` |
| `find` | `-name`, `-iname`, `-type`, `-user`, `-group`, `-nouser`, `-nogroup`, `-size`, `-mtime`, `-mmin`, `-atime`, `-amin`, `-ctime`, `-cmin`, `-perm`, `-inum`, `-maxdepth`, `-depth`, `-L`, `-P`, `-o`/`-or`, `-print`, `-delete`, and a constrained `-exec COMMAND {} \\;` |
| Users and groups | `useradd -m/-M/-r/-d/-s/-c/-u/-g/-G`, `userdel -r`, `usermod -aG/-G/-g/-c/-s/-d/-m/-L/-U`, `groupadd -g/-r`, `groupmod -n/-g`, `passwd -S/-l/-u/--stdin`, `chage -l/-m/-M/-W/-I/-d/-E`, `groups`, `id`, `newgrp` |
| Privilege management | `su -/-l/-c/-s`, `sudo -u/-i/-n`, `visudo -c/-f` and combined forms; simplified `/etc/sudoers` rules including group rules and `NOPASSWD` |
| Links/archive | `ln -s`, `ln -t`, hard links, `tar -c/-x/-t`, `-f`, `-C`, `-v`, `-z/-j/-J`, `-P`, `gzip`/`gunzip -k/-d/-c/-f/-l/-v` |
| Help/extra tools | `man SECTION NAME`, `man -s SECTION -k WORD`, `man -k`, `man -K`, `apropos`, `mandb`, `info`, `pinfo`, `command -v/-V`, `--help`, `kill -l/-s`, `crontab -u/-l/-r/-e/-i` |

Shell syntax includes command arguments, single/double quotes, practical backslash escaping, environment and positional variables, `export`/`unset`, aliases, `~` and `~user`, `$(command)` and backtick command substitution, filename globbing (`*`, `?`, bracket ranges, `[!...]`, POSIX character classes), brace expansion (`{a,b}`, `{1..5}`, `file{,.bak}`), `for NAME in ...; do ...; done`, simple command groups (`{ ...; }`), `source`, history expansion (`!!`, `!N`), pipes, input/output/error redirection (`>`, `>>`, `<`, `2>`, `2>>`, `2>&1`, `&>`), and `;`, `&&`, `||`. The summary's loop, glob, command-substitution, brace-expansion, grouped-redirection and pipeline examples are covered by the shell smoke tests.

`bash -c COMMAND [NAME [ARG...]]`, `bash FILE [ARG...]`, `bash --login`, positional parameters (`$0`, `$1`, `$#`, `$@`), `set --`, `set -e`, `set -u`, `PATH`, and executable virtual scripts with `#!/bin/bash` or `#!/usr/bin/env bash` are supported. Virtual scripts are interpreted by the same safe shell parser; native binaries and arbitrary program execution are not supported.

### Deliberate simulation boundaries

- This is not full Bash. `if`/`while`/`case`, functions, arrays, arithmetic expansion, process substitution, real subshells, job control, asynchronous jobs, traps, and arbitrary native binaries are not implemented. A `for-in` loop and simple command group are supported, but they do not provide full shell grammar or subshell semantics.
- `vim` is a small modal editor supporting practical Insert/Normal/Visual (character and line) workflows, movement, search, yank/delete/paste, undo, `:w`, `:wq`, `:x`, `:q`, `:q!`, and `:%s`. Visual block mode (`Ctrl+v`) is not implemented.
- `less` and `more` display file contents in the terminal but do not provide a full interactive pager. `tail -f` provides a current snapshot rather than a live background follower.
- `tar`, `gzip`, and `gunzip` use private virtual archive/compression representations. They support the educational create/list/extract and keep/decompress workflows, but do not produce interoperable GNU tar or gzip binary files.
- `scp` supports paths within the same virtual filesystem only. Remote `user@host:path` SSH transfer is unavailable because no remote service exists.
- `crontab` lets students list, edit, import and remove simulated crontab files. No scheduler or background daemon runs them.
- `kill` lists signal names and handles only simulated process IDs. `ps`, `df`, `free`, `uptime`, `last`, `who`, and `hostname` report constrained educational data, not host state.
- `info`/`pinfo` and `man` use a concise bundled help database, not the complete GNU documentation collection. `mandb` updates the small local simulated index and does not download anything.
- Hard links are supported within the virtual filesystem. Symbolic links support relative and absolute targets.

Unsupported options are reported rather than silently succeeding. Where a command depends on a kernel, live process table, scheduler, SSH server, or native binary format, its behavior is either explicitly simulated or returns an unsupported-operation message.

## Filesystem, accounts, and permissions

The virtual root contains `/bin`, `/etc`, `/root`, `/home/student`, `/tmp`, `/usr`, `/usr/local/bin`, and `/var` with small useful starter files. Filesystem node data tracks file type, content/children, numeric UID/GID, mode bits, timestamps, symlink target, and stable node identity. The shell and grader use the same filesystem instance.

Unix-like owner/group/other read, write, and execute checks are implemented, including directory traversal, numeric and symbolic `chmod`, `umask`, and simulated owner/group changes. Root and account operations are local simulation only. The starter accounts are `student` (password `student`) and `root` (password `root`). These are educational defaults, not real credentials; no device accounts or privileges are touched. The checker inspects state as an internal privileged operation so a restrictive directory mode does not prevent grading.

The virtual filesystem limits each regular file to 1 MiB, aggregate file data to 8 MiB, and the tree to 5,000 nodes. Terminal output retains at most 650 lines.

## Persistence and isolation

Terminal state is stored in a separate IndexedDB database named `acs-practice-terminal`; the existing application `practice-site` database and PGlite worker are not used or modified by the terminal. Keys include package ID, exercise ID, and the app's current attempt identifier. Practice has a per-exercise practice workspace; each exam gets a separate workspace keyed by that exam's existing attempt ID. The app does not expose a stable student/account identifier in the supplied code, so the storage is local to the browser profile and does not sync between devices or profiles.

The terminal module owns its UI, styles, listeners, shell, and filesystem. It has no global event handlers, workers, timers, external assets, or background polling. The app awaits terminal disposal when changing exercises/routes or closing an exam. A terminal import or initialization error is displayed in that exercise area only. The app's “Reset all local data” action deletes the separate terminal database without importing the terminal module.

Offline use depends on the host app's own caching/service-worker setup. This feature itself downloads no runtime dependencies.

## Security boundary

Student input is tokenized and interpreted by explicit command implementations. It is never passed to `eval`, `Function`, the host OS, a process launcher, or arbitrary host file APIs. All paths resolve within the virtual filesystem. User/group/password commands only affect the local simulated account database. This is an educational browser simulation, not a security boundary against a user inspecting or modifying their own browser code; client-side grading is unsuitable for high-stakes exam integrity.

## Validation performed

The supplied app/core scripts and terminal module pass Node syntax checks. Node smoke tests exercised quoted strings, variable and positional expansion, aliases, source, redirection, pipes and chaining, file operations, symlinks, find/tar, simulated users/groups and sudo, modes/umask, filesystem serialization/restore, and filesystem-based partial grading. `Core.validatePackage` accepts the sample terminal package and a legacy `command-text` package. A headless Chromium browser check was attempted, but the environment browser policy blocked local test pages before app code could execute. Browser-level acceptance tests therefore remain to be run in the target application/browser matrix.
