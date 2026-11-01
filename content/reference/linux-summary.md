# Operating System Fundamentals Summary

## Table of contents

- [Operating System Fundamentals Summary](#operating-system-fundamentals-summary)
  - [Table of contents](#table-of-contents)
  - [1. Key Definitions](#1-key-definitions)
  - [2. Shell Basics and Syntax](#2-shell-basics-and-syntax)
    - [2.1 Anatomy of a command](#21-anatomy-of-a-command)
    - [2.2 What the shell does before a command runs](#22-what-the-shell-does-before-a-command-runs)
    - [2.3 Common shell symbols](#23-common-shell-symbols)
  - [3. Wildcards and Patterns](#3-wildcards-and-patterns)
    - [3.1 Filename wildcards (globbing)](#31-filename-wildcards-globbing)
    - [3.2 Brace expansion](#32-brace-expansion)
    - [3.3 POSIX character classes](#33-posix-character-classes)
  - [4. Navigation and System Info](#4-navigation-and-system-info)
    - [4.1 Navigation and information commands](#41-navigation-and-information-commands)
    - [4.2 `ls` options](#42-ls-options)
  - [5. Viewing and Inspecting Files](#5-viewing-and-inspecting-files)
    - [5.1 Commands](#51-commands)
    - [5.2 Examples](#52-examples)
  - [6. Creating, Copying, Moving, Deleting](#6-creating-copying-moving-deleting)
    - [6.1 Commands](#61-commands)
    - [6.2 Examples](#62-examples)
  - [7. Text Processing](#7-text-processing)
    - [7.1 Commands](#71-commands)
    - [7.2 Common options](#72-common-options)
    - [7.3 Examples](#73-examples)
    - [7.4 Combining commands with pipes](#74-combining-commands-with-pipes)
    - [7.5 Regular expressions](#75-regular-expressions)
      - [7.5.1 Core symbols](#751-core-symbols)
      - [7.5.2 Basic vs extended regular expressions](#752-basic-vs-extended-regular-expressions)
      - [7.5.3 Regex with `grep`](#753-regex-with-grep)
      - [7.5.4 Regex with `sed`](#754-regex-with-sed)
      - [7.5.5 `grep` vs `sed`](#755-grep-vs-sed)
      - [7.5.6 Regex vs shell wildcards](#756-regex-vs-shell-wildcards)
  - [8. Input/Output Redirection](#8-inputoutput-redirection)
    - [8.1 Standard streams](#81-standard-streams)
    - [8.2 Redirection operators](#82-redirection-operators)
    - [8.3 Pipes and `tee`](#83-pipes-and-tee)
    - [8.4 Examples](#84-examples)
  - [9. Links: Hard vs Soft](#9-links-hard-vs-soft)
    - [9.1 Comparison](#91-comparison)
    - [9.2 Examples](#92-examples)
  - [10. Quotes: Single vs Double](#10-quotes-single-vs-double)
  - [11. Users, Groups and Passwords](#11-users-groups-and-passwords)
    - [11.1 Switching users](#111-switching-users)
    - [11.2 Creating and deleting users](#112-creating-and-deleting-users)
    - [11.3 Modifying users](#113-modifying-users)
    - [11.4 Groups](#114-groups)
    - [11.5 Passwords and aging](#115-passwords-and-aging)
    - [11.6 Sudo configuration](#116-sudo-configuration)
    - [11.7 Worked examples](#117-worked-examples)
  - [12. Linux Permissions (rwx)](#12-linux-permissions-rwx)
    - [12.1 The three permissions](#121-the-three-permissions)
    - [12.2 The three permission groups](#122-the-three-permission-groups)
    - [12.3 Numeric (octal) permissions](#123-numeric-octal-permissions)
    - [12.4 Important directory rules](#124-important-directory-rules)
    - [12.5 Special permission bits](#125-special-permission-bits)
    - [12.6 Changing permissions with `chmod`](#126-changing-permissions-with-chmod)
    - [12.7 Ownership and default permissions](#127-ownership-and-default-permissions)
    - [12.8 Worked examples](#128-worked-examples)
  - [13. Searching with `find`](#13-searching-with-find)
    - [13.1 Syntax and common tests](#131-syntax-and-common-tests)
    - [13.2 Numeric arguments: `+n`, `-n`, `n`](#132-numeric-arguments-n--n-n)
    - [13.3 Combining tests and useful extras](#133-combining-tests-and-useful-extras)
    - [13.4 Examples](#134-examples)
  - [14. Archiving and Copying Between Machines](#14-archiving-and-copying-between-machines)
    - [14.1 `tar`](#141-tar)
    - [14.2 `scp`](#142-scp)
    - [14.3 Worked examples](#143-worked-examples)
  - [15. Important Directories and Files](#15-important-directories-and-files)
    - [15.1 Essential directory map](#151-essential-directory-map)
    - [15.2 Special files](#152-special-files)
  - [16. Shell Environment](#16-shell-environment)
  - [17. Vim Cheat Sheet](#17-vim-cheat-sheet)
    - [17.1 Modes](#171-modes)
    - [17.2 Saving and quitting](#172-saving-and-quitting)
    - [17.3 Navigation](#173-navigation)
    - [17.4 Editing](#174-editing)
    - [17.5 Minimal survival workflow](#175-minimal-survival-workflow)

---

## 1. Key Definitions

| Term             | Meaning                                                                                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UNIX**         | A family of multi-user operating systems that originated at Bell Labs. Linux is _UNIX-like_: it follows UNIX design and conventions without being derived from UNIX source code.                                            |
| **FOSS**         | Free and Open-Source Software: the source code can be used, modified, and shared.                                                                                                                                           |
| **GNU**          | A free operating-system project. The name is recursive: "GNU's Not Unix". Many core Linux tools (`bash`, `grep`, `sed`, `tar`, `ls`, ...) come from GNU.                                                                    |
| **GPL**          | The GNU General Public License. It allows use, modification, and sharing, and requires that distributed modified versions stay under the same license (a "copyleft" license).                                               |
| **Kernel**       | The core of an operating system. It manages hardware, memory, processes, and file systems, and provides services to programs. Linux is a kernel.                                                                            |
| **Distribution** | A complete system built around the Linux kernel plus tools and a package manager (for example Debian, Ubuntu, Fedora, RHEL).                                                                                                |
| **Shell**        | A program that reads the commands you type, expands them, and runs the requested programs. Bash is the most common shell. The _terminal_ is the window; the shell is the program running in it.                             |
| **Root**         | The superuser account (UID 0) with unrestricted access to the system.                                                                                                                                                       |
| **Path**         | The location of a file. An **absolute** path starts at `/` (for example `/etc/passwd`); a **relative** path starts from the current directory (for example `docs/a.txt`). `.` means the current directory, `..` the parent. |
| **Inode**        | A data structure that stores a file's metadata: size, owner, permissions, timestamps, and where its data is stored. It does **not** store the file name; names live in directories, which map each name to an inode.        |

---

## 2. Shell Basics and Syntax

### 2.1 Anatomy of a command

```
command [options] [arguments]
```

```bash
ls -l /etc        # command: ls   option: -l   argument: /etc
ls -la /etc       # short options can be combined: -l and -a
ls --all          # long options start with two dashes
```

- Linux is **case-sensitive**: `File.txt` and `file.txt` are different files.
- Spaces separate the command, options, and arguments. A name that contains spaces must be quoted (see [section 10](#10-quotes-single-vs-double)).

### 2.2 What the shell does before a command runs

The shell processes your line **before** the command starts. It expands braces, `~`, variables, and wildcards, then passes the result to the command as arguments.

```bash
ls *.txt          # the shell expands *.txt first; ls receives: ls a.txt b.txt
```

This explains several later topics: why regex patterns for `grep` and `sed` must be quoted (so the shell leaves them alone), why `find -name "*.txt"` needs quotes, and why `*` means different things in a wildcard and in a regex.

### 2.3 Common shell symbols

| Symbol | What it does                                                                          | Example                                           |
| ------ | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `\`    | At the very end of a line: continues the command on the next line (readability only). | `sudo useradd \` then `-m alice` on the next line |
| `;`    | Runs several commands one after another on a single line, regardless of success.      | `cd /tmp; ls`                                     |
| `!!`   | Repeats the last command.                                                             | `sudo !!`                                         |
| `!n`   | Repeats command number `n` from `history`.                                            | `!25`                                             |
| `#`    | Starts a comment: the rest of the line is ignored.                                    | `ls  # list files`                                |
| `&&`   | **(optional)** Runs the next command only if the previous one succeeded.              | `mkdir d && cd d`                                 |

The **pipe** `|` sends the standard output of the command on its left into the standard input of the command on its right, for example `ls | wc -l` (count entries). Pipes are explained in [section 8.3](#83-pipes-and-tee).

**(Optional)** `||` (two pipe characters, not to be confused with a single pipe) runs the next command only if the previous one failed, for example `cd d || echo "no such directory"`.

> **Tip:** `sudo !!` is a handy way to re-run the previous command with administrative rights.

---

## 3. Wildcards and Patterns

Wildcards (also called **globs**) are patterns that the **shell** expands into matching file names. They are not regular expressions (see [7.5.6](#756-regex-vs-shell-wildcards)).

### 3.1 Filename wildcards (globbing)

| Pattern              | Matches                                         | Example                                                |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| `*`                  | Any number of characters, including none.       | `*text` matches every name ending in `text`.           |
| `?`                  | Exactly one character (any character).          | `file?.txt` matches `file1.txt` but not `file10.txt`.  |
| `[abc]`              | One character that is `a`, `b`, or `c`.         | `[abc]*` matches names starting with `a`, `b`, or `c`. |
| `[!abc]` or `[^abc]` | One character that is **not** `a`, `b`, or `c`. | `[!0-9]*` matches names not starting with a digit.     |
| `[a-z]`              | One character in the range `a` to `z`.          | `[a-z]*.txt`                                           |
| `[!a-z]`             | One character **not** in the range `a` to `z`.  |                                                        |
| `[0-9]`              | One digit.                                      | `log[0-9].txt` matches `log3.txt`.                     |

Points to remember:

- The **shell** performs the matching against existing names. If nothing matches, Bash passes the pattern through unchanged.
- `*` and `?` do not match a leading `.`: hidden files are only matched by patterns that start with a literal dot (for example `.b*`).
- `[!...]` is the POSIX form of negation; Bash also accepts `[^...]`.
- Ranges such as `[a-z]` can depend on the locale; the POSIX classes in 3.3 are more reliable.

### 3.2 Brace expansion

Brace expansion **generates strings**. Unlike wildcards, it does not look at which files exist. It is a Bash/Zsh feature (not available in plain POSIX `sh`).

| Pattern         | Expands to                            |
| --------------- | ------------------------------------- |
| `{a,b,c}`       | `a b c`                               |
| `{0..9}`        | `0 1 2 ... 9`                         |
| `{a..z}`        | `a b c ... z`                         |
| `{01..10}`      | `01 02 ... 10` (zero-padded; Bash 4+) |
| `file{1,2}.txt` | `file1.txt file2.txt`                 |

```bash
touch log{1..3}.txt                  # creates log1.txt log2.txt log3.txt
mkdir -p project/{src,docs,tests}    # creates three subdirectories at once
```

### 3.3 POSIX character classes

Classes are written **inside** a bracket expression, which is why they have double brackets: the outer `[ ]` is the bracket expression, `[:digit:]` is the class. They work in shell wildcards and in regular expressions.

| Class          | Matches                               |
| -------------- | ------------------------------------- |
| `[[:alnum:]]`  | Letters or digits                     |
| `[[:alpha:]]`  | Letters                               |
| `[[:digit:]]`  | Digits                                |
| `[[:lower:]]`  | Lowercase letters                     |
| `[[:upper:]]`  | Uppercase letters                     |
| `[[:space:]]`  | Whitespace (space, tab, newline, ...) |
| `[[:blank:]]`  | Space or tab                          |
| `[[:punct:]]`  | Punctuation                           |
| `[[:xdigit:]]` | Hexadecimal digits                    |

Classes can be combined in one bracket expression: `[[:alpha:][:digit:]_]` matches a letter, digit, or underscore.

---

## 4. Navigation and System Info

### 4.1 Navigation and information commands

| Command               | Description                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- |
| `cd dir`              | Change directory.                                                                     |
| `cd -`                | Go back to the previous directory.                                                    |
| `cd ~` (or just `cd`) | Go to your home directory.                                                            |
| `cd ..`               | Go up one directory.                                                                  |
| `cd /`                | Go to the root (topmost) directory.                                                   |
| `pwd`                 | Print the current (working) directory.                                                |
| `ls [options] [path]` | List directory contents (options in 4.2).                                             |
| `man command`         | Show the manual page for a command. Press `q` to quit, `/text` to search.             |
| `whoami`              | Show the current username.                                                            |
| `date`                | Show the date and time. Accepts a format, for example `date +%F` prints `2026-10-27`. |
| `history`             | Show a numbered list of past commands (re-run one with `!n`).                         |
| `exit` (or `Ctrl+D`)  | Exit the current shell, terminal, or SSH session.                                     |

### 4.2 `ls` options

**Essential options**

| Option | Meaning                                                                     |
| ------ | --------------------------------------------------------------------------- |
| `-l`   | Long format: type, permissions, link count, owner, group, size, date, name. |
| `-a`   | Show hidden files (names starting with `.`), including `.` and `..`.        |
| `-A`   | Show hidden files **without** `.` and `..`.                                 |
| `-d`   | List the directory itself, not its contents (for example `ls -ld /etc`).    |
| `-R`   | Recursive: also list the contents of subdirectories.                        |

**Other useful options**

| Option | Meaning                                                   |
| ------ | --------------------------------------------------------- |
| `-h`   | With `-l` or `-s`: human-readable sizes (`4.0K`, `2.3M`). |
| `-s`   | Show the disk space allocated to each file (in blocks).   |
| `-i`   | Show each file's inode number.                            |
| `-t`   | Sort by modification time, newest first.                  |
| `-r`   | Reverse the sort order.                                   |
| `-1`   | One entry per line.                                       |

Options combine: `ls -lah`, `ls -lt`, `ls -lhtr`.

---

## 5. Viewing and Inspecting Files

### 5.1 Commands

| Command                  | Description                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `file path`              | Reports what type of file it is (text, executable, directory, ...).                       |
| `stat path`              | Shows metadata: size, inode, link count, permissions, owner, and timestamps.              |
| `cat path`               | Prints the entire file (can also join several files: `cat a b`).                          |
| `head [-n n] path`       | Prints the first `n` lines (default 10).                                                  |
| `tail [-n n] path`       | Prints the last `n` lines (default 10). `-f` keeps following new lines (useful for logs). |
| `less path`              | Shows a file page by page; you can scroll both ways, search with `/text`, quit with `q`.  |
| `more path`              | Similar to `less`, but with more limited navigation (mainly forward).                     |
| `wc [-l] [-w] [-c] path` | Counts **l**ines, **w**ords, and bytes (`-c`). With no option it prints all three.        |

`wc -c` counts **bytes**; use `wc -m` to count characters (they differ for non-ASCII text).

### 5.2 Examples

```bash
file notes.txt                 # e.g. "notes.txt: ASCII text"
ls -la ~                       # long listing of your home directory, including hidden files
ls -lR /etc/ssh                # long listing, recursive
head -n 5 notes.txt            # first 5 lines
tail -n 20 /var/log/messages   # last 20 lines (log file name varies by distribution)
tail -f /var/log/messages      # keep showing new lines as they are written (Ctrl+C to stop)
wc -l notes.txt                # number of lines
```

---

## 6. Creating, Copying, Moving, Deleting

### 6.1 Commands

| Command             | Description                                                                    | Useful options                                                                     |
| ------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `mkdir dir`         | Create a directory.                                                            | `-p` creates missing parent directories (and does not fail if it exists).          |
| `touch file1 file2` | Create empty files, or update the timestamps of existing ones.                 |                                                                                    |
| `cp src dest`       | Copy a file. If `dest` is an existing directory, the copy is placed inside it. | `-r` copy directories recursively · `-i` ask before overwriting                    |
| `mv src dest`       | Move **or rename** a file or directory.                                        | `-i` ask before overwriting                                                        |
| `rm file`           | Remove a file.                                                                 | `-r` remove a directory and its contents · `-i` ask first · `-f` force, no prompts |
| `rmdir dir`         | Remove an **empty** directory.                                                 |                                                                                    |

> **Warning:** there is no recycle bin. `rm` is permanent, and `cp`/`mv` overwrite existing destinations without asking (unless you use `-i`). Be especially careful with `rm -r` and wildcards (a stray space in `rm -r dir *` deletes far more than intended).

### 6.2 Examples

```bash
mkdir -p project/src          # creates project/ and project/src in one step
touch a.txt b.txt             # two empty files
cp a.txt backup.txt           # copy to a new name
cp a.txt b.txt project/       # copy several files into a directory
cp -r project project_copy    # copy a whole directory
mv backup.txt old.txt         # rename
mv old.txt project/           # move into a directory
rm a.txt                      # delete a file
rm -r project_copy            # delete a directory and everything in it
rmdir empty_dir               # delete an empty directory only
```

---

## 7. Text Processing

Most of these commands read from a file **or** from standard input, so they combine well with pipes (section 7.4). `ps` is included here because it is usually combined with `grep`, even though it inspects processes rather than text.

### 7.1 Commands

| Command                         | Description                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `echo "text"`                   | Prints text.                                                                                                                 |
| `grep [options] 'pattern' path` | Searches for lines matching a pattern and prints them.                                                                       |
| `sed [options] 'script' path`   | A stream editor: processes text line by line. Commonly used to substitute text, print selected lines, or delete lines.       |
| `cut -d delim -f n path`        | Extracts fields (columns) from each line.                                                                                    |
| `sort [options] path`           | Sorts lines.                                                                                                                 |
| `uniq [options] path`           | Collapses **consecutive** duplicate lines (so sort first).                                                                   |
| `tr set1 set2`                  | Translates, deletes, or squeezes characters. Reads **standard input only** (use `<` or a pipe; it does not take file names). |
| `tee [-a] path`                 | Copies its input to the screen **and** to a file.                                                                            |
| `ps`                            | Shows information about running processes.                                                                                   |

### 7.2 Common options

| Command | Option | Meaning                                                                                   |
| ------- | ------ | ----------------------------------------------------------------------------------------- |
| `echo`  | `-n`   | No trailing newline.                                                                      |
| `echo`  | `-e`   | Interpret escapes such as `\n` and `\t` (Bash builtin; behaviour varies in other shells). |
| `grep`  | `-i`   | Ignore case.                                                                              |
| `grep`  | `-v`   | Invert: show lines that do **not** match.                                                 |
| `grep`  | `-n`   | Show line numbers.                                                                        |
| `grep`  | `-c`   | Print the **number of matching lines** (not the number of matches).                       |
| `grep`  | `-r`   | Search directories recursively.                                                           |
| `grep`  | `-w`   | Match whole words only.                                                                   |
| `grep`  | `-E`   | Use extended regular expressions (see 7.5).                                               |
| `grep`  | `-l`   | **(optional)** List only the names of files that contain a match.                         |
| `sed`   | `-n`   | Suppress automatic printing (print only what a `p` command selects).                      |
| `sed`   | `-i`   | Edit the file **in place** (GNU/Linux syntax; macOS needs `-i ''`).                       |
| `sed`   | `-E`   | Use extended regular expressions.                                                         |
| `sed`   | `-e`   | Add a script/command (allows several: `sed -e 's/a/b/' -e 's/c/d/'`).                     |
| `cut`   | `-d`   | Field delimiter (default is a tab).                                                       |
| `cut`   | `-f`   | Field number(s): `-f1`, `-f1,7`, `-f2-4`.                                                 |
| `sort`  | `-n`   | Numeric sort.                                                                             |
| `sort`  | `-r`   | Reverse order.                                                                            |
| `sort`  | `-u`   | Output only the first of equal lines (removes duplicates).                                |
| `sort`  | `-f`   | Ignore case.                                                                              |
| `sort`  | `-k n` | **(optional)** Sort by field `n` (with `-t` to set the separator).                        |
| `uniq`  | `-c`   | Prefix each line with its number of occurrences.                                          |
| `uniq`  | `-d`   | Show only lines that are duplicated.                                                      |
| `uniq`  | `-u`   | Show only lines that are not repeated.                                                    |
| `tr`    | `-d`   | Delete the given characters.                                                              |
| `tr`    | `-s`   | Squeeze repeated characters into one.                                                     |
| `tee`   | `-a`   | Append to the file instead of overwriting it.                                             |
| `ps`    | `aux`  | All processes, user-oriented format (BSD-style options, **no dash**).                     |
| `ps`    | `-ef`  | All processes, full format (UNIX-style options, with dash).                               |

`tr set1 set2` replaces each character of `set1` with the corresponding character of `set2`.

> **`ps` option styles:** with a dash, `-u` selects processes of a given user (`ps -u alice`); without a dash, `u` selects a user-oriented output format (`ps au`). Mixing the two styles (as in `ps -au`) is ambiguous, so prefer `ps aux` or `ps -ef`.

> **`uniq` only collapses adjacent duplicates**, so `sort` first: `sort file.txt | uniq -c`.

### 7.3 Examples

```bash
echo -e "Line1\nLine2"             # -e interprets \n -> prints two lines
grep -in "error" log.txt           # case-insensitive, with line numbers
grep -rw "root" /etc/ 2>/dev/null  # whole word "root", recursive; hide "permission denied" errors
grep -c "ssh" log.txt              # how many LINES contain "ssh"
grep -v "^#" config.conf           # all lines that do NOT start with #

sed 's/foo/bar/' file.txt          # replace the first foo on each line (prints result, file unchanged)
sed 's/foo/bar/g' file.txt         # replace ALL foo occurrences on each line
sed -n '5,10p' file.txt            # print only lines 5 through 10
sed '/debug/d' file.txt            # print everything except lines containing debug
sed -i 's/foo/bar/g' file.txt      # same replacement, but edit the file itself (GNU/Linux)

cut -d: -f1 /etc/passwd            # usernames only (field 1, ":" delimiter)
cut -d: -f1,7 /etc/passwd          # username and shell (fields 1 and 7)

sort numbers.txt                   # text order: 10 comes before 9
sort -n numbers.txt                # numeric order: 9 comes before 10
sort -ru names.txt                 # reverse order, duplicates removed

sort names.txt | uniq -c           # count how often each line appears
sort names.txt | uniq -d           # only lines that appear more than once

tr "a-z" "A-Z" < file.txt          # lowercase -> uppercase
tr -d "0-9" < file.txt             # delete all digits
tr -s " " < file.txt               # squeeze repeated spaces into one

ls -l | tee out.txt                # show the output AND save it to out.txt
ls -l | tee -a out.txt             # same, but append instead of overwrite

ps aux | grep sshd                 # find sshd among all running processes
```

### 7.4 Combining commands with pipes

```bash
# Which login shells are used on the system, and how many accounts use each?
cut -d: -f7 /etc/passwd | sort | uniq -c | sort -nr
```

Step by step: `cut` extracts the shell field of every account, `sort` groups identical lines together, `uniq -c` counts each group, and `sort -nr` orders the counts from largest to smallest. Example output (will differ on your system):

```
     23 /usr/sbin/nologin
      3 /bin/bash
      1 /bin/sync
```

### 7.5 Regular expressions

A **regular expression (regex)** is a pattern that describes text. Commands such as `grep` and `sed` interpret regexes; the shell does not. Always put a regex in **single quotes** so the shell leaves characters like `*`, `$`, `|`, and `(` alone.

`grep` and `sed` both use regexes to find text. The difference is what they do next: `grep` **selects and prints matching lines**, while `sed` can **transform** the matched text (see 7.5.5).

#### 7.5.1 Core symbols

These work in both basic and extended regular expressions:

| Symbol        | Meaning                                               | Example                                         |
| ------------- | ----------------------------------------------------- | ----------------------------------------------- |
| `.`           | Any single character.                                 | `c.t` matches `cat`, `cut`, `c9t`.              |
| `*`           | Zero or more repetitions of the **preceding item**.   | `ab*c` matches `ac`, `abc`, `abbc`.             |
| `.*`          | Any sequence of characters (including none).          | `a.*z` matches `az`, `abcz`.                    |
| `^`           | Start of a line (anchor).                             | `^root` matches lines starting with `root`.     |
| `$`           | End of a line (anchor).                               | `txt$` matches lines ending in `txt`.           |
| `^$`          | An empty line.                                        | `grep -c '^$' file` counts blank lines.         |
| `[abc]`       | Any one character from the set.                       | `[aeiou]` matches one vowel.                    |
| `[a-z]`       | Any one character in the range.                       | `[0-9]` matches one digit.                      |
| `[^abc]`      | Any one character **not** in the set.                 | `[^0-9]` matches a non-digit.                   |
| `[[:digit:]]` | POSIX class inside a bracket expression (see 3.3).    | `[[:upper:]][[:lower:]]*`                       |
| `\`           | Escapes a special character so it is taken literally. | `\.` matches a literal period (in BRE and ERE). |

Notes:

- Inside `[ ]`, most special characters lose their meaning: `[.*]` matches a literal `.` or `*`.
- A regex matches **anywhere in the line** unless anchored with `^` and/or `$`. For example, `grep 'cat'` also matches `concatenate`; `grep '^cat$'` matches only a line that is exactly `cat`.
- `*` repeats the item before it and is **greedy** (matches as much as possible).
- Common GNU extensions (not available everywhere): `\<` and `\>` mark the start and end of a word, `\b` marks a word boundary.

#### 7.5.2 Basic vs extended regular expressions

There are two regex dialects. `grep` and `sed` use **basic regular expressions (BRE)** by default. Option `-E` switches both to **extended regular expressions (ERE)**.

The difference is mainly which characters are special by default:

```
Meaning                BRE (default)          ERE (grep -E / sed -E)
---------------------  ---------------------  ----------------------
One or more            \+    (GNU only)       +
Zero or one            \?    (GNU only)       ?
Alternation (or)       \|    (GNU only)       |
Grouping               \( \)                  ( )
Repeat m to n times    \{m,n\}                {m,n}
Literal + ? | ( ) { }  written as is          needs a backslash: \+ \? \| \( \) \{ \}
```

Summary: in BRE the characters `+ ? | ( ) { }` are **literal** unless escaped with a backslash; in ERE they are **special** unless escaped. The BRE forms `\+`, `\?`, and `\|` are GNU extensions and are not guaranteed on other systems (for example macOS). For portable, readable patterns, use `-E`.

Use `-E` whenever you need alternation, `+`, `?`, or grouping:

```bash
grep -E 'error|warning' log.txt     # ERE: lines containing error OR warning
grep 'error\|warning' log.txt       # same in GNU BRE (less portable)
```

Because `|` is also the shell's pipe symbol, an unquoted `grep -E error|warning` would be split into two commands. Quote the pattern.

Back-references (`\1`, `\2`, ...) refer to the text captured by the first, second, ... group and work in `sed` replacements (see 7.5.4).

#### 7.5.3 Regex with `grep`

```bash
grep '^root' /etc/passwd            # lines starting with root
grep 'bash$' /etc/passwd            # lines ending with bash
grep '[0-9]' file.txt               # lines containing at least one digit
grep -E 'error|warning' log.txt     # lines containing error OR warning
grep -E '^[A-Z][a-z]+$' names.txt   # whole line: one capital followed by lowercase letters
grep -E 'colou?r' file.txt          # color or colour (u is optional)
grep -E '^[0-9]{3}-[0-9]{4}$' f.txt # lines that are exactly like 555-1234
grep '\.conf$' list.txt             # lines ending in the literal text ".conf"
grep -v '^$' file.txt               # print all non-empty lines
```

#### 7.5.4 Regex with `sed`

The substitution command has the form `s/pattern/replacement/flags`. The most common flag is `g` (replace **all** matches on the line instead of only the first).

```bash
sed -n '/^root/p' /etc/passwd         # print only lines starting with root
sed 's/[0-9]/X/g' file.txt            # replace every digit with X
sed 's/^/# /' file.txt                # add "# " at the start of every line
sed '/^$/d' file.txt                  # delete blank lines (from the output)
sed -E 's/[0-9]+/NUMBER/g' file.txt   # replace each run of digits with NUMBER
sed -E 's/(error|warning)/ALERT/g' log.txt  # replace either word with ALERT
```

Replacement features:

```bash
echo "hello world" | sed -E 's/([a-z]+) ([a-z]+)/\2 \1/'   # world hello  (\1, \2 = captured groups)
echo "abc 123"     | sed -E 's/[0-9]+/<&>/'                # abc <123>     (& = the whole match)
sed 's#/usr/local#/opt#g' paths.txt                        # any delimiter works; # avoids escaping /
```

Selecting lines (addresses): `5` (line 5), `5,10` (lines 5 to 10), `$` (last line), `/regex/` (lines matching). The commands used most are `p` (print), `d` (delete), and `s` (substitute). Remember `-n` with `p`; without `-n`, selected lines are printed twice.

`sed` writes its result to standard output and leaves the original file unchanged unless you use `-i`. On GNU/Linux `sed -i 's/a/b/' file` edits in place and `sed -i.bak ...` also keeps a backup; on macOS/BSD the in-place option needs an argument (`sed -i '' ...`).

#### 7.5.5 `grep` vs `sed`

| Aspect            | `grep`                         | `sed`                                                |
| ----------------- | ------------------------------ | ---------------------------------------------------- |
| Main job          | Find and print matching lines. | Edit text: substitute, delete, print selected lines. |
| Pattern used for  | Selecting lines.               | Selecting lines **and** the text to replace.         |
| Default regex     | BRE (`-E` for ERE).            | BRE (`-E` for ERE).                                  |
| Output            | Matching lines, unchanged.     | All lines, modified as instructed.                   |
| Changes the file? | Never.                         | Only with `-i`.                                      |

The same line selection in both tools:

```bash
grep '^error' log.txt             # lines starting with error
sed -n '/^error/p' log.txt        # the same lines (-n + p prints only matches)

grep 'error$' log.txt             # lines ending with error
sed 's/error$/FIXED/' log.txt     # but sed can also CHANGE them: replace trailing "error" with FIXED
```

#### 7.5.6 Regex vs shell wildcards

Both use symbols like `*` and `[ ]`, but they are different systems.

| Aspect            | Shell wildcard (glob)                      | Regular expression                                  |
| ----------------- | ------------------------------------------ | --------------------------------------------------- |
| Interpreted by    | The shell, before the command runs.        | The command (`grep`, `sed`, ...).                   |
| Matches           | File names.                                | Text inside lines.                                  |
| Match scope       | The whole name.                            | Anywhere in the line, unless anchored with `^`/`$`. |
| Any one character | `?`                                        | `.`                                                 |
| Any sequence      | `*`                                        | `.*`                                                |
| Meaning of `*`    | "any characters".                          | "repeat the previous item zero or more times".      |
| Negated set       | `[!abc]` (also `[^abc]` in Bash)           | `[^abc]`                                            |
| Anchors           | Not used (match is always the whole name). | `^` and `$`.                                        |

The glob `*.txt` corresponds roughly to the regex `^.*\.txt$`.

A classic mistake: `grep *.txt file` lets the shell expand `*.txt` into file names. To search for lines ending in `.txt`, write `grep '\.txt$' file`.

**Remember:**

- `grep 'pattern' file` prints the matching lines.
- `sed 's/pattern/replacement/g' file` replaces every match on each line.
- Quote regexes in single quotes; use `-E` when you need `+`, `?`, `|`, `( )`, or `{m,n}` without backslashes.

---

## 8. Input/Output Redirection

### 8.1 Standard streams

Every process starts with three data streams, each identified by a **file descriptor** number:

| Stream | Name            | Descriptor | Default  |
| ------ | --------------- | ---------- | -------- |
| stdin  | Standard input  | 0          | Keyboard |
| stdout | Standard output | 1          | Terminal |
| stderr | Standard error  | 2          | Terminal |

Normal output and error messages are separate streams, which is why you can redirect one without the other.

### 8.2 Redirection operators

| Syntax        | Meaning                                                       |
| ------------- | ------------------------------------------------------------- |
| `>`           | Send stdout to a file, **overwriting** it (`1>` is the same). |
| `>>`          | Send stdout to a file, **appending** to it.                   |
| `2>`          | Send stderr to a file.                                        |
| `2>/dev/null` | Discard error messages.                                       |
| `&>`          | Send **both** stdout and stderr to a file (Bash shorthand).   |
| `2>&1`        | Send stderr to wherever stdout currently goes.                |
| `<`           | Use a file as stdin.                                          |

Notes:

- The portable equivalent of `&>` is `> file 2>&1`. **Order matters**: `cmd > file 2>&1` sends both to the file; `cmd 2>&1 > file` does not (stderr still goes to the terminal).
- `>` empties the target file **before** the command runs. Never read and write the same file (`sort f > f` leaves `f` empty).
- `/dev/null` is a special file that discards everything written to it.

### 8.3 Pipes and `tee`

- A **pipe** (`|`) connects the **stdout** of one command to the **stdin** of the next. Redirection connects a command to a **file**; a pipe connects a command to **another command**.
- Only stdout travels through a pipe; stderr still goes to the terminal unless redirected (`cmd 2>&1 | next`).
- Commands that read stdin when no file is given (`grep`, `sort`, `wc`, `cut`, `uniq`, ...) work at the end of a pipe. `tr` reads **only** stdin.
- `tee` is a command that copies its stdin to the screen **and** to a file, so you can save an intermediate result and keep the pipeline going.

### 8.4 Examples

```bash
ls /etc > list.txt                 # overwrite list.txt with the listing
ls /home >> list.txt               # append to list.txt
ls /nonexistent 2> err.txt         # the error message goes to err.txt, not the screen
find / -name "x" 2>/dev/null       # hide "permission denied" errors
make > out.txt 2>&1                # stdout and stderr both into out.txt
sort < unsorted.txt > sorted.txt   # read from one file, write to another
ls | wc -l                         # count directory entries (stdout of ls -> stdin of wc)
ls -l | tee list.txt | wc -l       # save the listing AND count its lines
```

---

## 9. Links: Hard vs Soft

A file name is a **directory entry** pointing to an inode. A **hard link** is an additional name for the same inode; a **soft (symbolic) link** is a separate small file that contains a path.

### 9.1 Comparison

| Feature                    | Soft (symbolic) link          | Hard link                                                   |
| -------------------------- | ----------------------------- | ----------------------------------------------------------- |
| Command                    | `ln -s target linkname`       | `ln target linkname`                                        |
| Points to                  | A **path** (text)             | The **same inode** (the data itself)                        |
| Inode                      | Its own, different inode      | Same inode as the original                                  |
| Works across file systems  | Yes                           | No                                                          |
| Can link to directories    | Yes                           | No                                                          |
| If the original is deleted | **Breaks** (dangling link)    | **Still works** (data lives until the last name is removed) |
| Target must exist          | No (can be created dangling)  | Yes                                                         |
| `ls -l` shows              | `l` type and `link -> target` | A normal file (the link count increases)                    |

Extra points:

- `ln -s -t dir target` (GNU) creates the symbolic link **inside** `dir`, named after the target.
- The path stored in a relative symbolic link is interpreted **relative to the link's own location**, not to your current directory.
- Deleting a symbolic link removes only the link; deleting a hard link removes one name. The file's data is freed only when its link count reaches 0.

### 9.2 Examples

```bash
echo "hello" > original.txt
ln original.txt hard.txt          # hard link (same inode)
ln -s original.txt soft.txt       # soft link (stores the path "original.txt")
ls -li                            # -i also shows inode numbers
```

Example output (numbers will differ). Note the shared inode and the link count `2` of the hard-linked file, and that the soft link has its own inode:

```
1048601 -rw-r--r-- 2 alice alice  6 Oct 27 10:00 hard.txt
1048601 -rw-r--r-- 2 alice alice  6 Oct 27 10:00 original.txt
1048602 lrwxrwxrwx 1 alice alice 12 Oct 27 10:00 soft.txt -> original.txt
```

```bash
rm original.txt
cat hard.txt                      # still prints "hello"
cat soft.txt                      # error: No such file or directory (dangling link)

ln -s -t /tmp/links /etc/hosts    # creates /tmp/links/hosts -> /etc/hosts
```

---

## 10. Quotes: Single vs Double

The shell treats quotes as instructions about which expansions to perform.

| Feature                           | Single quotes `' '`                        | Double quotes `" "`       |
| --------------------------------- | ------------------------------------------ | ------------------------- |
| Variable expansion (`$name`)      | **No**                                     | **Yes**                   |
| Command substitution (`$(cmd)`)   | No                                         | Yes                       |
| Wildcards (`*`, `?`) expanded     | No                                         | No                        |
| Keeps spaces together as one word | Yes                                        | Yes                       |
| Best for                          | Exact/literal text, regexes, `sed` scripts | Text containing variables |

```bash
name="Bob"
echo "Hello $name"      # Hello Bob
echo 'Hello $name'      # Hello $name
echo "*"                # * (the wildcard is not expanded)
touch "my file.txt"     # one file with a space in its name (without quotes: two files)
grep 'a|b' file         # pattern kept literal; the shell does not treat | as a pipe
```

- A single-quoted string cannot contain a single quote. A backslash escapes one character outside quotes: `echo it\'s`.
- Use single quotes for `grep`/`sed` patterns and for `find -name "*.txt"`-style globs (either quote type works there; the point is that the **shell** must not expand them).
- When a `sed` or `grep` pattern must include a shell variable, use double quotes: `sed "s/old/$new/" file`.

---

## 11. Users, Groups and Passwords

Account data lives in `/etc/passwd` (users), `/etc/group` (groups), and `/etc/shadow` (password hashes and aging). See [section 15.2](#152-special-files).

### 11.1 Switching users

| Command              | Description                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `su - account`       | Switch to another account using **that account's** password. With no account given, switches to `root`. The `-` starts a full login shell with that user's environment. |
| `sudo -i -u account` | Start a login shell as another account using **your own** `sudo` permissions and password.                                                                              |

Type `exit` to return to your own account.

### 11.2 Creating and deleting users

| Command                 | Description        | Common options                                                                                                                                                                    |
| ----------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sudo useradd username` | Create a new user. | `-m` create the home directory · `-d dir` set the home directory path · `-G g1,g2` supplementary groups · `-g group` primary group · `-s shell` login shell · `-c "text"` comment |
| `sudo userdel account`  | Delete a user.     | `-r` also remove the home directory and mail spool                                                                                                                                |

- Whether `useradd` creates the home directory by default depends on the distribution and `/etc/login.defs`; add `-m` to be sure.
- Groups named with `-G` or `-g` must already exist.
- On Debian/Ubuntu, `adduser` is a friendlier interactive wrapper around `useradd` **(optional)**.

### 11.3 Modifying users

`sudo usermod options user` changes the settings of an existing account.

| Option      | Meaning                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `-aG group` | **Add** the user to supplementary group(s) while keeping existing ones.                                        |
| `-G g1,g2`  | **Set** the supplementary groups to exactly this list (replaces the old list; comma-separated, **no spaces**). |
| `-g group`  | Change the primary group.                                                                                      |
| `-c "text"` | Change the comment (full name).                                                                                |
| `-s shell`  | Change the login shell.                                                                                        |
| `-L`        | Lock the password (the user can no longer log in with it).                                                     |
| `-U`        | Unlock the password.                                                                                           |

> **Important:** `usermod -G` without `-a` **replaces** all supplementary groups. Almost always use `-aG`. Group changes take effect at the user's next login.
>
> `-L` only locks password authentication; it does not necessarily block other methods such as SSH keys. To disable an account entirely use `chage -E 0` (see 11.5).

### 11.4 Groups

| Command               | Description                                                                                               | Options                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `sudo groupadd group` | Create a group.                                                                                           | `-g n` choose the GID · `-r` create a system group (for services) |
| `sudo groupdel group` | Delete a group (a user's primary group cannot be deleted while in use).                                   |                                                                   |
| `sudo groupmod group` | Modify a group.                                                                                           | `-n newname` rename · `-g n` change the GID                       |
| `newgrp group`        | Start a new shell in which `group` is your primary group (you must be a member). Type `exit` to leave it. |                                                                   |
| `groups [user]`       | Show the groups of yourself (or of `user`).                                                               |                                                                   |
| `id [user]`           | Show UID, primary group, and all groups with their numbers.                                               |                                                                   |
| `getent group`        | List all groups with their GIDs (and members).                                                            |                                                                   |

### 11.5 Passwords and aging

| Command                      | Description                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| `passwd`                     | Change **your own** password. `sudo passwd user` changes another user's. |
| `sudo passwd -S account`     | Show password status (for example `P` = password set, `L` = locked).     |
| `sudo chage options account` | Manage password aging and account expiration (options below).            |

To set a password non-interactively, pipe `account:password` into `chpasswd`:

```bash
echo "account:password" | sudo chpasswd
```

This puts the plaintext password in your command history, so it is acceptable for labs but not for real systems.

**`chage` options**

| Option    | Meaning                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| `-l`      | Display password aging and expiration information.                                                              |
| `-M days` | Maximum days before the password must be changed.                                                               |
| `-m days` | Minimum days before the password may be changed again.                                                          |
| `-W days` | Days before expiration on which the user starts getting a warning.                                              |
| `-I days` | Disable the account this many days **after** the password has expired.                                          |
| `-d date` | Date of the last password change. `-d 0` makes the password expire immediately, forcing a change at next login. |
| `-E date` | Account expiration date (`YYYY-MM-DD`). `-E -1` means never expires.                                            |

### 11.6 Sudo configuration

`sudo` rules are stored in `/etc/sudoers` and in files under `/etc/sudoers.d/`. Edit them **only with `visudo`**, which locks the file and checks syntax before saving; a syntax error can lock you out of `sudo`.

| Command                  | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `sudo visudo`            | Edit `/etc/sudoers` safely.                             |
| `sudo visudo -f file`    | Edit a specific file, such as one in `/etc/sudoers.d/`. |
| `sudo visudo -c`         | Check the sudoers configuration for errors.             |
| `sudo visudo -c -f file` | Check a specific file (`-f` selects the file).          |

**Rule format**

```
who   host=(runas)   command
```

| Part      | Meaning                                                                          |
| --------- | -------------------------------------------------------------------------------- |
| `who`     | A user, or a group written with a `%` prefix (for example `%developers`).        |
| `host`    | The machines on which the rule applies (`ALL` = any).                            |
| `(runas)` | The user(s) the command may be run **as** (`ALL` = anyone, including root).      |
| `command` | The allowed command(s), as full paths. Arguments listed here must match exactly. |

```
%developers   ALL=(wassim, teacher)   /usr/bin/dnf up
%admins       ALL=(ALL)               ALL
```

The first rule lets members of `developers`, on any host, run `/usr/bin/dnf up` as the users `wassim` or `teacher` (for example `sudo -u wassim /usr/bin/dnf up`). The second is the typical "full sudo" rule: members of `admins` may run any command as any user. On RHEL-family systems the group `wheel` usually plays this role; on Debian/Ubuntu it is `sudo`.

### 11.7 Worked examples

```bash
# Users
sudo useradd -m -d /home/alice -G developers,admins alice   # groups must already exist
sudo usermod -aG docker alice        # add alice to "docker" (keeps her other groups)
sudo usermod -G wheel,dev alice      # SET groups to exactly these two (no spaces!)
sudo usermod -g staff alice          # change primary group
sudo usermod -c "Alice Smith" alice  # set the comment
sudo usermod -L alice                # lock the password
sudo usermod -U alice                # unlock it
sudo usermod -s /bin/zsh alice       # change default shell
sudo userdel -r alice                # delete alice AND her home directory

# Groups
sudo groupadd -g 2000 developers     # create a group with GID 2000
sudo groupadd -r backupsvc           # create a system group
sudo groupmod -n devs developers     # rename the group
sudo groupmod -g 2500 devs           # change its GID
newgrp developers                    # new shell with developers as primary group; exit to leave
id alice                             # uid, primary group, and all groups of alice

# Passwords
sudo passwd -S alice                      # show password status
echo "alice:NewPass123" | sudo chpasswd   # set the password in one line
sudo chage -l alice                       # show aging info
sudo chage -M 90 -W 7 alice               # must change every 90 days, warn 7 days before
sudo chage -d 0 alice                     # force a password change at next login
sudo chage -E 2026-12-31 alice            # account expires on that date

# Switching users
su - bob                             # become bob (needs bob's password)
sudo -i -u bob                       # become bob (uses your sudo rights)

# Sudo configuration
sudo visudo -c                       # check the main sudoers file
sudo visudo -c -f /etc/sudoers.d/dev # check one specific file
```

---

## 12. Linux Permissions (rwx)

### 12.1 The three permissions

| Symbol | Meaning | On a **file**   | On a **directory**                                     |
| ------ | ------- | --------------- | ------------------------------------------------------ |
| `r`    | Read    | Read contents   | List the names inside                                  |
| `w`    | Write   | Modify contents | Create, delete, and rename entries (needs `x` as well) |
| `x`    | Execute | Run the file    | Enter (`cd`) and access items inside (traverse)        |

- `x` means **run** for files but **enter/traverse** for directories.
- `w` + `x` on a directory lets you create, rename, and remove files inside it.
- `r` without `x` on a directory lets you see the names but not use the files (for example `ls -l` cannot read their details).
- Scripts need `r` **and** `x` to be run directly. The superuser `root` bypasses most permission checks.

**Quick memory trick**

- **File:** read it, change it, run it.
- **Directory:** list it, change its contents, enter it.

### 12.2 The three permission groups

`ls -l` shows ten characters at the start of each line, for example `-rwxr-xr--`:

```
-   rwx   r-x   r--
│    │     │     │
│    │     │     └── Others:         read only
│    │     └──────── Group:          read, execute
│    └────────────── User (owner):   read, write, execute
└─────────────────── Type: - file, d directory, l symbolic link
```

A full line looks like this:

```
-rwxr-xr-- 1 alice developers 120 Oct 27 10:00 script.sh
            │  │       │
            │  │       └── group owner
            │  └────────── user owner
            └───────────── link count
```

Linux checks the **most specific class that applies**: if you are the owner, only the user bits count, even if the group or others have more.

### 12.3 Numeric (octal) permissions

`r = 4` · `w = 2` · `x = 1`. Add the values for each group.

| Symbolic | Calculation | Number |
| -------- | ----------- | ------ |
| `rwx`    | 4+2+1       | **7**  |
| `rw-`    | 4+2         | **6**  |
| `r-x`    | 4+1         | **5**  |
| `r--`    | 4           | **4**  |
| `---`    | 0           | **0**  |

Example: `chmod 754 file.txt`

```
   7      5      4
 USER   GROUP  OTHERS
  rwx    r-x    r--
```

Common modes:

| Mode  | Symbolic    | Typical use                                  |
| ----- | ----------- | -------------------------------------------- |
| `644` | `rw-r--r--` | Regular files (owner edits, everyone reads)  |
| `755` | `rwxr-xr-x` | Programs and directories                     |
| `600` | `rw-------` | Private files (for example SSH private keys) |
| `700` | `rwx------` | Private directories                          |
| `664` | `rw-rw-r--` | Group-shared files                           |

### 12.4 Important directory rules

- To access a file, you generally need `x` on **every parent directory** in its path.
- To **delete** (or rename) a file, you generally need `w` + `x` on its **parent directory**, not write permission on the file itself.
- To **create** a file in a directory, you need `w` + `x` on that directory.

### 12.5 Special permission bits

They form an optional **leading fourth octal digit** (`chmod 4755 file`).

| Bit            | Value | Symbolic | Purpose                                                                                                                          |
| -------------- | ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **SUID**       | 4     | `u+s`    | On an executable: runs with the **file owner's** privileges (for example `/usr/bin/passwd`). Ignored on scripts by most systems. |
| **SGID**       | 2     | `g+s`    | On an executable: runs with the **file's group**. On a directory: new files inherit the **directory's group**.                   |
| **Sticky bit** | 1     | `+t`     | On a directory: only a file's owner, the directory's owner, or root can delete or rename entries inside.                         |

How they appear in `ls -l` (a lowercase letter means the `x` bit is also set, uppercase means it is not):

| Octal  | `ls -l` output | Meaning                        |
| ------ | -------------- | ------------------------------ |
| `4755` | `-rwsr-xr-x`   | SUID program                   |
| `2755` | `drwxr-sr-x`   | SGID directory                 |
| `1777` | `drwxrwxrwt`   | Sticky directory (like `/tmp`) |

**Why the sticky bit matters**

```
shared/                (no sticky bit)
├── alice.txt          owned by Alice
└── bob.txt            owned by Bob
```

If Bob has `w` and `x` on `shared/`, he can delete `alice.txt`, even though he does not own it and cannot modify its contents. Deleting depends on the permissions of the **parent directory**, not on the file. A sticky bit on `shared/` prevents this: only the file's owner (or the directory owner, or root) can delete it. This is how `/tmp` works (mode `1777`).

### 12.6 Changing permissions with `chmod`

**Numeric mode:** `chmod 755 file` sets all permissions at once.

**Symbolic mode:** `chmod [who][operator][permissions] file`

| Part        | Values                                              |
| ----------- | --------------------------------------------------- |
| Who         | `u` user (owner) · `g` group · `o` others · `a` all |
| Operator    | `+` add · `-` remove · `=` set exactly              |
| Permissions | `r` `w` `x` (and `s` `t` for special bits)          |

```bash
ls -l                  # view permissions
chmod 755 file         # set rwxr-xr-x
chmod u+x file         # add execute for the owner
chmod g-w file         # remove write from the group
chmod go= file         # remove all permissions from group and others
chmod u=rwx,g=rx,o=r f # set exactly rwxr-xr--
chmod -R 750 dir       # apply recursively
chmod g+s directory    # add SGID to a directory
chmod 1777 directory   # rwxrwxrwt (sticky bit)
```

Without a "who" (`chmod +x file`), the change applies to everyone, but bits blocked by the `umask` are not added.

### 12.7 Ownership and default permissions

| Command                        | Description                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `sudo chown user[:group] path` | Change the owner, the group, or both (`user:group`). Only root may change the owner. `-R` applies recursively. |
| `sudo chown :group path`       | Change only the group.                                                                                         |
| `chgrp group path`             | Change the group owner only. The owner may do this without `sudo` for a group they belong to.                  |
| `umask`                        | Display the current umask: the permission bits that are **removed** from new files and directories.            |
| `umask nnn`                    | Set the umask for the current shell session.                                                                   |

New files start from `666` (`rw-rw-rw-`) and new directories from `777` (`rwxrwxrwx`). The umask **clears** the bits that are set in it.

| `umask` | New files | New directories |
| ------- | --------- | --------------- |
| `022`   | `644`     | `755`           |
| `002`   | `664`     | `775`           |
| `027`   | `640`     | `750`           |
| `077`   | `600`     | `700`           |

> **Subtraction is only a shortcut.** The exact rule is bitwise: `permissions = default AND NOT umask`. The shortcut `666 - 022 = 644` works for common umasks, but not in general: with `umask 033`, files get `644` (not `633`), because the `x` bit was never present in `666`. Files never receive `x` by default.

### 12.8 Worked examples

```bash
chmod 754 script.sh        # rwxr-xr--
chmod u+x script.sh        # add execute for the owner
chmod g-w file.txt         # remove write from the group
chmod g+s project/         # SGID: new files inherit the directory's group
chmod 1777 shared/         # sticky bit + rwxrwxrwx (like /tmp)

sudo chown alice file.txt            # change the owner
sudo chown :devs file.txt            # change only the group
sudo chown alice:devs file.txt       # change both
sudo chgrp devs file.txt             # change only the group (alternative)

umask                      # show the current umask (for example 0022)
umask 027                  # new files: 640, new directories: 750
```

---

## 13. Searching with `find`

`find` walks a directory tree and tests every entry against the conditions you give.

### 13.1 Syntax and common tests

```bash
find path [tests] [actions]
```

| Test            | Meaning                                                                       | Example                    |
| --------------- | ----------------------------------------------------------------------------- | -------------------------- |
| `-name pattern` | File name matches a **glob** pattern (the name only, not the path). Quote it. | `find ~ -name "*.txt"`     |
| `-type t`       | Type: `f` regular file, `d` directory, `l` symbolic link.                     | `find . -type d`           |
| `-user user`    | Owned by this user.                                                           | `find / -user alice`       |
| `-group group`  | Belongs to this group.                                                        | `find / -group devs`       |
| `-mtime n`      | Last **modified** `n` days ago (24-hour units).                               | `find ~ -mtime +7`         |
| `-mmin n`       | Last modified `n` **minutes** ago.                                            | `find ~ -mmin -10`         |
| `-size n`       | Size (units in 13.2).                                                         | `find ~ -size +100M`       |
| `-perm mode`    | Permission bits match (see 13.2).                                             | `find ~ -type f -perm 644` |

`-name` uses **shell-style wildcards**, not regular expressions, and the pattern must be quoted so the shell does not expand it first. `-iname` ignores case.

### 13.2 Numeric arguments: `+n`, `-n`, `n`

- `+n` means **more than** `n`, `-n` means **less than** `n`, and plain `n` means **exactly** `n`.
- **Time:** the age is rounded down to whole units. `-mtime +7` therefore means "modified at least 8 days ago", `-mtime 0` means "within the last 24 hours", and `-mtime -1` means "less than 24 hours ago".
- **Size:** suffixes are `c` (bytes), `k` (KiB), `M` (MiB), `G` (GiB). Sizes are rounded **up** to the unit. Without a suffix the unit is 512-byte blocks, so always give a suffix: `-size +100M`.
- **Permissions:** `-perm 644` matches **exactly** `644`; `-perm -644` matches files having **at least** those bits; `-perm /222` matches files with **any** write bit.

### 13.3 Combining tests and useful extras

Tests are combined with **AND** by default. These extras are common but go beyond the basic list **(optional)**:

| Item              | Meaning                                                  |
| ----------------- | -------------------------------------------------------- |
| `-o`, `!`         | OR and NOT. Group with escaped parentheses: `\( ... \)`. |
| `-maxdepth n`     | Do not descend more than `n` levels.                     |
| `-exec cmd {} \;` | Run `cmd` on each match (`{}` stands for the file name). |

### 13.4 Examples

```bash
find ~ -name "*.log"                        # all .log files under home
find /var -type f -name "*.conf"            # regular files only
find / -user alice 2>/dev/null              # everything owned by alice (hide permission errors)
find /home -group developers -type d        # directories owned by group developers
find ~ -mtime +7                            # modified at least 8 days ago
find ~ -mtime -1                            # modified less than 24 hours ago
find ~ -mmin -10                            # modified in the last 10 minutes
find / -size +100M 2>/dev/null              # files larger than 100 MiB
find ~ -type f -perm 644                    # regular files with exactly 644 permissions
find ~ -type f -user alice -size +10M       # tests combine with AND

find . -maxdepth 1 -name "*.sh"             # (optional) only the current directory level
find ~ -name "*.tmp" -exec rm {} \;         # (optional) delete every .tmp file found
```

---

## 14. Archiving and Copying Between Machines

### 14.1 `tar`

`tar` bundles many files and directories into one **archive** file (optionally compressed) and extracts them again.

```bash
tar -c|x|t -f archive [-z|-j|-J] [-C dir] [paths]
```

Choose exactly **one** of `-c`, `-x`, `-t`.

| Option    | Meaning                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `-c`      | **Create** a new archive from `paths`.                                                                                         |
| `-x`      | **Extract** files from an archive.                                                                                             |
| `-t`      | **List** the contents without extracting.                                                                                      |
| `-f file` | The archive file name. Must be the **last** option in a cluster, directly followed by the name (`-czf name`, not `-cfz name`). |
| `-C dir`  | Change to `dir` first: when extracting, files are placed there.                                                                |
| `-z`      | Compress/decompress with **gzip**.                                                                                             |
| `-j`      | Compress/decompress with **bzip2**.                                                                                            |
| `-J`      | Compress/decompress with **xz**.                                                                                               |
| `-v`      | **(optional)** Verbose: print each file as it is processed.                                                                    |

| Compression | Option | Typical extension   | Compression ratio | Speed   |
| ----------- | ------ | ------------------- | ----------------- | ------- |
| none        | (none) | `.tar`              | None              | Fastest |
| gzip        | `-z`   | `.tar.gz` or `.tgz` | Low               | Fast    |
| bzip2       | `-j`   | `.tar.bz2`          | Medium            | Slow    |
| xz          | `-J`   | `.tar.xz`           | High              | Slowest |

GNU `tar` can detect the compression automatically when **listing or extracting**, so `tar -xf backup.tar.gz` works without `-z`. When creating, you must say which compression to use. The extension is only a naming convention; it does not change the compression.

### 14.2 `scp`

```bash
scp [-r] source destination
```

`scp` copies files between machines over SSH (it asks for the remote account's password or uses SSH keys).

- A remote location is written `user@host:path`. The **colon** is what tells `scp` the path is remote; a relative remote path starts in the remote user's home directory.
- `-r` is required when copying a **directory**.
- `-P port` (capital P) selects a non-default SSH port. **(optional)**
- Existing files at the destination are overwritten without warning.

### 14.3 Worked examples

```bash
tar -cf backup.tar myfolder/             # create an uncompressed archive
tar -czf backup.tar.gz myfolder/         # create + gzip
tar -cjf backup.tar.bz2 myfolder/        # create + bzip2
tar -cJf backup.tar.xz myfolder/         # create + xz
tar -tf backup.tar.gz                    # list contents without extracting
tar -xzf backup.tar.gz                   # extract into the current directory
tar -xzf backup.tar.gz -C /tmp/restore   # extract into /tmp/restore (the directory must exist)

scp report.txt alice@192.168.1.10:/home/alice/       # copy a file to another machine
scp -r myfolder alice@192.168.1.10:/home/alice/      # copy a directory (-r)
scp alice@192.168.1.10:/home/alice/report.txt .      # copy from the remote machine to here

tar -czf proj.tar.gz proj/ && scp proj.tar.gz alice@192.168.1.10:/tmp/   # (optional) archive, then send
```

---

## 15. Important Directories and Files

### 15.1 Essential directory map

| Path                       | Contents                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/`                        | The root of the whole file system tree.                                                                                    |
| `/etc`                     | System-wide configuration files.                                                                                           |
| `/home` and `/root`        | Users' home directories, and the superuser's home directory.                                                               |
| `/usr/bin` and `/usr/sbin` | Standard user commands, and administrative commands. (On many modern distributions `/bin` and `/sbin` are links to these.) |
| `/var`                     | Variable data that changes while the system runs (logs in `/var/log`, databases, mail spool).                              |
| `/tmp`                     | Temporary files. World-writable with the sticky bit (`1777`); cleaned at reboot or periodically, depending on the system.  |
| `/run`                     | Runtime state since boot (PID files, locks, sockets).                                                                      |
| `/dev`                     | Device files that represent hardware (and special files such as `/dev/null`).                                              |
| `/boot`                    | Kernel and boot loader files.                                                                                              |
| `/proc` and `/sys`         | **(optional)** Virtual file systems exposing kernel and process information.                                               |
| `/opt` and `/mnt`          | **(optional)** Add-on third-party software, and a conventional place for temporary mounts.                                 |

### 15.2 Special files

| Path              | Purpose                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `/dev/null`       | Anything written to it is discarded (used as `2>/dev/null`).                                   |
| `/etc/login.defs` | Default values for new accounts (UID/GID ranges, password aging defaults, home creation, ...). |
| `/etc/passwd`     | Basic account information, one line per user. Readable by everyone.                            |
| `/etc/shadow`     | Password **hashes** and aging data (see `chage`). Readable by root only.                       |
| `/etc/group`      | Group definitions and members.                                                                 |
| `/etc/sudoers`    | The main `sudo` rules file (edit with `visudo`).                                               |
| `/etc/sudoers.d/` | Directory of additional sudo rule files.                                                       |

Formats (fields are separated by `:`, which is why `cut -d: -f1` works on these files):

```
/etc/passwd:  alice:x:1001:1001:Alice Smith:/home/alice:/bin/bash
              name:password placeholder:UID:GID:comment:home:shell        (7 fields)

/etc/group:   developers:x:2000:alice,bob
              name:password placeholder:GID:members                       (4 fields)
```

The `x` means the real password hash is in `/etc/shadow`.

---

## 16. Shell Environment

| Syntax              | Purpose                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `NAME=value`        | Create a **local** shell variable (no spaces around `=`).                                 |
| `$NAME`             | Use the variable's value (`${NAME}` when it touches other text).                          |
| `export NAME=value` | Make the variable available to **child processes** (an environment variable).             |
| `env` or `printenv` | Show the environment variables.                                                           |
| `$PATH`             | Colon-separated list of directories searched for commands.                                |
| `alias ll='ls -la'` | Create a shortcut for a command (`unalias ll` removes it).                                |
| `~/.bashrc`         | Per-user Bash configuration file, read by interactive shells.                             |
| `source ~/.bashrc`  | Re-read a config file in the current shell, without opening a new one (`.` is a synonym). |

```bash
GREETING=hello
bash -c 'echo "[$GREETING]"'     # [] : a plain variable is not passed to child processes
export GREETING
bash -c 'echo "[$GREETING]"'     # [hello] : an exported variable is

echo $PATH                       # e.g. /usr/local/bin:/usr/bin:/bin
export PATH="$PATH:$HOME/bin"    # append a directory to the search path
```

- Variables and aliases set at the prompt disappear when the shell exits. To make them permanent, add them to `~/.bashrc` and run `source ~/.bashrc`. (Login shells may read `~/.bash_profile` or `~/.profile` instead; many systems make that file load `~/.bashrc`.)
- The current directory is normally **not** in `PATH`, which is why a script in it must be run as `./script.sh`.

---

## 17. Vim Cheat Sheet

Vim is a **modal** editor: the same key does different things depending on the mode. Start with `vim file`.

### 17.1 Modes

| Key   | Action                                                                           |
| ----- | -------------------------------------------------------------------------------- |
| `Esc` | Return to **Normal mode** (the default mode for moving, deleting, copying, ...). |
| `i`   | Enter **Insert mode** (type text).                                               |
| `v`   | Visual mode (select characters).                                                 |
| `V`   | Visual line mode (select whole lines).                                           |
| `:`   | Command-line mode (for commands such as `:w`, `:q`).                             |

### 17.2 Saving and quitting

Type these from Normal mode, then press `Enter`.

| Command | Action                                               |
| ------- | ---------------------------------------------------- |
| `:w`    | Save (write) changes.                                |
| `:wq`   | Save and quit (`ZZ` does the same from Normal mode). |
| `:q`    | Quit (refuses if there are unsaved changes).         |
| `:q!`   | Quit and **discard** unsaved changes.                |

### 17.3 Navigation

| Key                   | Action                                           |
| --------------------- | ------------------------------------------------ |
| `h` / `j` / `k` / `l` | Move left / down / up / right.                   |
| `w`                   | Start of the next word.                          |
| `b`                   | Start of the previous word.                      |
| `e`                   | End of the current word.                         |
| `0`                   | Start of the line.                               |
| `$`                   | End of the line.                                 |
| `{` / `}`             | Previous / next paragraph (blank-line boundary). |
| `gg`                  | Go to the first line.                            |
| `G`                   | Go to the last line.                             |
| `/text`               | Search forward.                                  |
| `?text`               | Search backward.                                 |
| `n` / `N`             | Next / previous match.                           |
| `*`                   | Search for the word under the cursor.            |

### 17.4 Editing

| Key             | Action                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `i` / `a`       | Insert before / after the cursor.                                                                                            |
| `I` / `A`       | Insert at the start / end of the line.                                                                                       |
| `o` / `O`       | Open a new line below / above and start inserting.                                                                           |
| `x`             | Delete the character under the cursor.                                                                                       |
| `dw`            | Delete (cut) from the cursor to the next word.                                                                               |
| `dd`            | Delete (cut) the line.                                                                                                       |
| `yy`            | Yank (copy) the line.                                                                                                        |
| `p` / `P`       | Paste after / before the cursor (or below / above for lines).                                                                |
| `u`             | Undo.                                                                                                                        |
| `Ctrl+r`        | Redo.                                                                                                                        |
| `:%s/old/new/g` | Replace `old` with `new` on **every line** of the file (omit `g` for the first match per line; add `c` to confirm each one). |

A number before a command repeats it: `3dd` deletes three lines, `5yy` copies five.

### 17.5 Minimal survival workflow

1. `vim file` opens the file in Normal mode.
2. Press `i` (or `a`, `o`) to start typing; press `Esc` when done.
3. Move with `h j k l`, `gg`, `G`, or search with `/text`.
4. Edit with `dd` (delete line), `yy` then `p` (copy and paste a line), `u` (undo).
5. Save and leave with `:wq`, or leave without saving using `:q!`.
