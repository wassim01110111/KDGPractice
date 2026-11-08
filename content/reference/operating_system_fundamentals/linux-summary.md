# Operating System Fundamentals Summary

## Table of contents

- [Operating System Fundamentals Summary](#operating-system-fundamentals-summary)
  - [Table of contents](#table-of-contents)
  - [Commands](#commands)
    - [Shell and environment](#shell-and-environment)
    - [Navigation and system information](#navigation-and-system-information)
    - [Viewing and inspecting files](#viewing-and-inspecting-files)
    - [Creating, copying, moving and deleting](#creating-copying-moving-and-deleting)
    - [Text processing](#text-processing)
    - [Users, groups and permissions](#users-groups-and-permissions)
    - [Searching, archiving and file transfer](#searching-archiving-and-file-transfer)
    - [Help and documentation](#help-and-documentation)
    - [Networking and remote access](#networking-and-remote-access)
  - [1. Key Definitions](#1-key-definitions)
  - [2. Shell Basics and Syntax](#2-shell-basics-and-syntax)
    - [2.1 Anatomy of a command](#21-anatomy-of-a-command)
    - [2.2 What the shell does before a command runs](#22-what-the-shell-does-before-a-command-runs)
    - [2.3 Common shell symbols](#23-common-shell-symbols)
    - [2.4 History, completion, and keyboard shortcuts](#24-history-completion-and-keyboard-shortcuts)
  - [3. Wildcards and Patterns](#3-wildcards-and-patterns)
    - [3.1 Filename wildcards (globbing)](#31-filename-wildcards-globbing)
    - [3.2 Brace expansion](#32-brace-expansion)
    - [3.3 POSIX character classes](#33-posix-character-classes)
  - [4. Navigation and System Info](#4-navigation-and-system-info)
    - [4.1 Navigation and information commands](#41-navigation-and-information-commands)
    - [4.2 `ls` options](#42-ls-options)
    - [4.3 System information commands](#43-system-information-commands)
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
  - [8. Input/Output Redirection](#8-inputoutput-redirection)
    - [8.1 Standard streams](#81-standard-streams)
    - [8.2 Redirection operators](#82-redirection-operators)
    - [8.3 Pipes and `tee`](#83-pipes-and-tee)
    - [8.4 Examples](#84-examples)
  - [9. Links: Hard vs Soft](#9-links-hard-vs-soft)
    - [9.1 Comparison](#91-comparison)
    - [9.2 Examples](#92-examples)
  - [10. Quotes and Expansion](#10-quotes-and-expansion)
    - [10.1 Single vs double quotes](#101-single-vs-double-quotes)
    - [10.2 Backslash escaping](#102-backslash-escaping)
    - [10.3 Variables and `${}`](#103-variables-and-)
    - [10.4 Command substitution and tilde expansion](#104-command-substitution-and-tilde-expansion)
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
    - [13.3 Actions and combining tests](#133-actions-and-combining-tests)
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
    - [17.3 Navigation and search](#173-navigation-and-search)
    - [17.4 Editing](#174-editing)
    - [17.5 Minimal survival workflow](#175-minimal-survival-workflow)
  - [18. Getting Help](#18-getting-help)
    - [18.1 Manual pages](#181-manual-pages)
    - [18.2 Quick help and built-ins](#182-quick-help-and-built-ins)
    - [18.3 Reading a SYNOPSIS](#183-reading-a-synopsis)
    - [18.4 Options you look up in the exercises (ex0401, ex0402)](#184-options-you-look-up-in-the-exercises-ex0401-ex0402)
  - [19. Networking and Remote Access (SSH)](#19-networking-and-remote-access-ssh)

---

## Commands

Quick reference to the commands and tools mentioned in this summary. The command names are not links; use **Go to section** to jump to their explanation or example.

### Shell and environment

| Command / tool | Brief explanation                                            | Go to section                                                  |
| -------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `bash`         | Runs commands in the Bash shell.                             | [Go to section](#16-shell-environment)                         |
| `clear`        | Clears the terminal screen.                                  | [Go to section](#24-history-completion-and-keyboard-shortcuts) |
| `exit`         | Closes the current shell session.                            | [Go to section](#24-history-completion-and-keyboard-shortcuts) |
| `history`      | Lists previously entered commands.                           | [Go to section](#24-history-completion-and-keyboard-shortcuts) |
| `source`       | Runs a file in the current shell.                            | [Go to section](#16-shell-environment)                         |
| `type`         | Shows how the shell interprets a command name.               | [Go to section](#182-quick-help-and-built-ins)                 |
| `unalias`      | Removes an alias.                                            | [Go to section](#16-shell-environment)                         |
| `unset`        | Removes a variable or function.                              | [Go to section](#16-shell-environment)                         |
| `export`       | Makes a variable available to child processes.               | [Go to section](#16-shell-environment)                         |
| `env`          | Displays or runs commands with environment variables.        | [Go to section](#16-shell-environment)                         |
| `set`          | Displays or changes shell options and positional parameters. | [Go to section](#16-shell-environment)                         |
| `alias`        | Creates or displays command shortcuts.                       | [Go to section](#16-shell-environment)                         |

### Navigation and system information

| Command / tool | Brief explanation                           | Go to section                                            |
| -------------- | ------------------------------------------- | -------------------------------------------------------- |
| `date`         | Displays or formats the date and time.      | [Go to section](#41-navigation-and-information-commands) |
| `cd`           | Changes the current directory.              | [Go to section](#41-navigation-and-information-commands) |
| `df`           | Shows available and used disk space.        | [Go to section](#43-system-information-commands)         |
| `hostname`     | Displays or sets the system hostname.       | [Go to section](#41-navigation-and-information-commands) |
| `id`           | Displays user and group IDs.                | [Go to section](#41-navigation-and-information-commands) |
| `last`         | Shows recent login history.                 | [Go to section](#41-navigation-and-information-commands) |
| `ls`           | Lists files and directories.                | [Go to section](#41-navigation-and-information-commands) |
| `ps`           | Displays running processes.                 | [Go to section](#43-system-information-commands)         |
| `pwd`          | Prints the current directory path.          | [Go to section](#41-navigation-and-information-commands) |
| `uname`        | Displays system and kernel information.     | [Go to section](#43-system-information-commands)         |
| `uptime`       | Shows how long the system has been running. | [Go to section](#43-system-information-commands)         |
| `who`          | Shows users currently logged in.            | [Go to section](#41-navigation-and-information-commands) |
| `whoami`       | Displays the current username.              | [Go to section](#41-navigation-and-information-commands) |

### Viewing and inspecting files

| Command / tool | Brief explanation                             | Go to section                 |
| -------------- | --------------------------------------------- | ----------------------------- |
| `cat`          | Displays or combines file contents.           | [Go to section](#51-commands) |
| `file`         | Identifies a file type.                       | [Go to section](#51-commands) |
| `head`         | Displays the beginning of a file.             | [Go to section](#51-commands) |
| `less`         | Views file contents one screen at a time.     | [Go to section](#51-commands) |
| `more`         | Views file contents page by page.             | [Go to section](#51-commands) |
| `stat`         | Displays file or filesystem metadata.         | [Go to section](#51-commands) |
| `tail`         | Displays the end of a file.                   | [Go to section](#51-commands) |
| `wc`           | Counts lines, words, and bytes or characters. | [Go to section](#51-commands) |

### Creating, copying, moving and deleting

| Command / tool | Brief explanation                            | Go to section                 |
| -------------- | -------------------------------------------- | ----------------------------- |
| `cp`           | Copies files and directories.                | [Go to section](#61-commands) |
| `mkdir`        | Creates directories.                         | [Go to section](#61-commands) |
| `mv`           | Moves or renames files and directories.      | [Go to section](#61-commands) |
| `rm`           | Removes files or directories.                | [Go to section](#61-commands) |
| `rmdir`        | Removes empty directories.                   | [Go to section](#61-commands) |
| `touch`        | Creates an empty file or updates timestamps. | [Go to section](#61-commands) |

### Text processing

| Command / tool | Brief explanation                                   | Go to section                        |
| -------------- | --------------------------------------------------- | ------------------------------------ |
| `echo`         | Prints text or variable values.                     | [Go to section](#71-commands)        |
| `cut`          | Extracts selected fields or columns from each line. | [Go to section](#71-commands)        |
| `diff`         | Compares files line by line.                        | [Go to section](#71-commands)        |
| `nl`           | Numbers the lines of a file.                        | [Go to section](#71-commands)        |
| `sort`         | Sorts lines of text.                                | [Go to section](#71-commands)        |
| `tee`          | Writes input to a file and passes it onward.        | [Go to section](#71-commands)        |
| `tr`           | Translates or deletes characters.                   | [Go to section](#71-commands)        |
| `uniq`         | Filters or counts adjacent repeated lines.          | [Go to section](#71-commands)        |
| `vim`          | Edits text files in a terminal.                     | [Go to section](#17-vim-cheat-sheet) |

### Users, groups and permissions

| Command / tool | Brief explanation                                               | Go to section                                           |
| -------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| `chage`        | Changes password expiry and aging information.                  | [Go to section](#115-passwords-and-aging)               |
| `chgrp`        | Changes a file’s group ownership.                               | [Go to section](#127-ownership-and-default-permissions) |
| `chpasswd`     | Updates passwords from standard input.                          | [Go to section](#115-passwords-and-aging)               |
| `chown`        | Changes file ownership.                                         | [Go to section](#127-ownership-and-default-permissions) |
| `groups`       | Displays a user’s group memberships.                            | [Go to section](#114-groups)                            |
| `groupadd`     | Creates a group.                                                | [Go to section](#114-groups)                            |
| `groupdel`     | Deletes a group.                                                | [Go to section](#114-groups)                            |
| `groupmod`     | Modifies a group.                                               | [Go to section](#114-groups)                            |
| `newgrp`       | Starts a shell with a different active group.                   | [Go to section](#114-groups)                            |
| `passwd`       | Changes a user password.                                        | [Go to section](#115-passwords-and-aging)               |
| `su`           | Switches to another user account.                               | [Go to section](#111-switching-users)                   |
| `sudo`         | Runs a command with elevated privileges.                        | [Go to section](#111-switching-users)                   |
| `useradd`      | Creates a user account.                                         | [Go to section](#112-creating-and-deleting-users)       |
| `userdel`      | Deletes a user account.                                         | [Go to section](#112-creating-and-deleting-users)       |
| `usermod`      | Modifies a user account.                                        | [Go to section](#113-modifying-users)                   |
| `visudo`       | Safely edits the sudoers configuration.                         | [Go to section](#116-sudo-configuration)                |
| `chmod`        | Changes file or directory permissions.                          | [Go to section](#126-changing-permissions-with-chmod)   |
| `umask`        | Sets the default permission mask for new files and directories. | [Go to section](#127-ownership-and-default-permissions) |

### Searching, archiving and file transfer

| Command / tool | Brief explanation                                     | Go to section                                 |
| -------------- | ----------------------------------------------------- | --------------------------------------------- |
| `ln`           | Creates hard links or symbolic links.                 | [Go to section](#91-comparison)               |
| `find`         | Searches for files and directories matching criteria. | [Go to section](#131-syntax-and-common-tests) |
| `scp`          | Copies files securely between computers over SSH.     | [Go to section](#142-scp)                     |
| `tar`          | Creates or extracts archive files.                    | [Go to section](#141-tar)                     |

### Help and documentation

| Command / tool | Brief explanation                               | Go to section                                  |
| -------------- | ----------------------------------------------- | ---------------------------------------------- |
| `apropos`      | Searches manual-page descriptions by keyword.   | [Go to section](#181-manual-pages)             |
| `help`         | Shows help for shell built-ins.                 | [Go to section](#182-quick-help-and-built-ins) |
| `info`         | Opens the Info documentation system.            | [Go to section](#182-quick-help-and-built-ins) |
| `man`          | Displays a command’s manual page.               | [Go to section](#181-manual-pages)             |
| `mandb`        | Creates or updates the manual-page index cache. | [Go to section](#181-manual-pages)             |
| `pinfo`        | Views documentation in an Info-style interface. | [Go to section](#182-quick-help-and-built-ins) |

### Networking and remote access

| Command / tool | Brief explanation                                                 | Go to section                                         |
| -------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| `curl`         | Transfers data to or from a URL.                                  | [Go to section](#19-networking-and-remote-access-ssh) |
| `ifconfig`     | Displays or configures network interfaces (legacy tool).          | [Go to section](#19-networking-and-remote-access-ssh) |
| `ip`           | Displays or configures network interfaces, addresses, and routes. | [Go to section](#19-networking-and-remote-access-ssh) |
| `ipconfig`     | Displays or manages IP configuration on Windows.                  | [Go to section](#19-networking-and-remote-access-ssh) |
| `ping`         | Tests reachability to another host.                               | [Go to section](#19-networking-and-remote-access-ssh) |
| `ssh`          | Connects securely to a remote system.                             | [Go to section](#19-networking-and-remote-access-ssh) |

## 1. Key Definitions

| Term             | Meaning                                                                                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UNIX**         | A family of multi-user operating systems that originated at Bell Labs. Linux is _UNIX-like_: it follows UNIX design and conventions without being derived from UNIX source code.                                            |
| **FOSS**         | Free and Open-Source Software: the source code can be used, modified, and shared. "Free" means freedom, not price.                                                                                                          |
| **GNU**          | A free operating-system project. The name is recursive: "GNU's Not Unix". Many core Linux tools (`bash`, `tar`, `ls`, ...) and the GCC compiler come from GNU.                                                              |
| **GPL**          | The GNU General Public License. It allows use, modification, and sharing, and requires that distributed modified versions stay under the same license (a "copyleft" license).                                               |
| **Kernel**       | The core of an operating system. It manages hardware, memory, processes, and file systems, and provides services to programs. Linux is a kernel.                                                                            |
| **Distribution** | A complete system built around the Linux kernel plus tools and a package manager. Debian family: Debian, Ubuntu, Linux Mint (`.deb`, `apt`). Red Hat family: RHEL, CentOS Stream, Rocky Linux, AlmaLinux (`.rpm`, `dnf`).   |
| **Shell**        | A program that reads the commands you type, expands them, and runs the requested programs. Bash is the most common shell. The _terminal_ is the window; the shell is the program running in it.                             |
| **Headless**     | A server without monitor or graphical interface, used over the network (usually with SSH). Most Linux servers run this way.                                                                                                 |
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
ls -las /etc      # three options combined: -l -a -s
ls --all          # long options start with two dashes
head -n 3 /etc/group   # the option -n has its own value (3); the argument is /etc/group
```

- Linux is **case-sensitive**: `File.txt` and `file.txt` are different files.
- Spaces separate the command, options, and arguments. A name that contains spaces must be quoted or escaped (see [section 10](#10-quotes-and-expansion)).
- Commands are programs (for example in `/bin`) or shell built-ins. `type command` tells you which (see [18.2](#182-quick-help-and-built-ins)).
- The prompt `user@host:~$` shows user, host, and current directory; `$` means a normal user, `#` means root.

### 2.2 What the shell does before a command runs

The shell processes your line **before** the command starts. It expands braces, `~`, variables, command substitutions, and wildcards, then passes the result to the command as arguments.

```bash
ls *.txt          # the shell expands *.txt first; ls receives: ls a.txt b.txt
```

This explains why `find -name "*.txt"` needs quotes (the shell must not expand the pattern first) and why quoting matters in general (see [section 10](#10-quotes-and-expansion)).

### 2.3 Common shell symbols

| Symbol | What it does                                                                          | Example                                           |
| ------ | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `\`    | At the very end of a line: continues the command on the next line (readability only). | `sudo useradd \` then `-m alice` on the next line |
| `;`    | Runs several commands one after another on a single line.                             | `date ; whoami`                                   |
| `!!`   | Repeats the last command.                                                             | `echo -n "Today is " ; !!` (after `date +%F`)     |
| `!n`   | Repeats command number `n` from `history`.                                            | `!25`                                             |
| `#`    | Starts a comment: the rest of the line is ignored.                                    | `ls  # list files`                                |

The **pipe** `|` sends the standard output of the command on its left into the standard input of the command on its right, for example `ls | wc -l` (count entries). Pipes are explained in [section 8.3](#83-pipes-and-tee).

```bash
echo -n "Today is: " ; date +%x     # two commands on one line
echo "This is a very long command that" \
"we are splitting across" \
"multiple lines"                    # \ splits one command over several lines
```

### 2.4 History, completion, and keyboard shortcuts

| Key / command  | Action                                                                                 |
| -------------- | -------------------------------------------------------------------------------------- |
| `history`      | Numbered list of past commands.                                                        |
| `history -c`   | Clear the history of the current shell.                                                |
| `!!` / `!n`    | Re-run the last command / command number `n`.                                          |
| `Ctrl+R`       | Search backward in the history (type part of the command, then `Enter`).               |
| `Up` / `Down`  | Scroll through previous commands and edit them.                                        |
| `Tab`          | Complete a file name, directory, or command. Press it twice to list the possibilities. |
| `Ctrl+C`       | Stop (interrupt) the current command.                                                  |
| `Ctrl+D`       | End of input: exits the current shell, terminal, or SSH session (same as `exit`).      |
| `Ctrl+L`       | Clear the screen (same as the `clear` command).                                        |
| `Ctrl+Shift+C` | Copy text in the terminal.                                                             |
| `Ctrl+Shift+V` | Paste text in the terminal.                                                            |
| `Ctrl+Shift+X` | Cut text in the terminal.                                                              |

```bash
ls /etc/hostn[Tab]        # completes to /etc/hostname
cat Do[Tab][Tab]c[Tab]    # keep adding letters until the match is unambiguous
```

---

## 3. Wildcards and Patterns

Wildcards (also called **globs**) are patterns that the **shell** expands into matching file names.

### 3.1 Filename wildcards (globbing)

| Pattern              | Matches                                         | Example                                                  |
| -------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `*`                  | Any number of characters, including none.       | `*.txt` matches every name ending in `.txt`.             |
| `?`                  | Exactly one character (any character).          | `file?.txt` matches `file1.txt` but not `file10.txt`.    |
| `[abc]`              | One character that is `a`, `b`, or `c`.         | `log[123].txt` matches `log1.txt`, `log2.txt`, ...       |
| `[!abc]` or `[^abc]` | One character that is **not** `a`, `b`, or `c`. | `[!0-9]*` matches names not starting with a digit.       |
| `[a-z]`              | One character in the range `a` to `z`.          | `[a-z]*` matches names starting with a lowercase letter. |
| `[0-9]`              | One digit.                                      | `log[0-9][0-9].tmp` matches `log42.tmp`.                 |

```bash
ls /etc/*.conf                   # all .conf files in /etc
ls a???.txt                      # names of 4 letters + .txt starting with a
cp *.[pd][do][fc] ~/Documents/   # copy all files ending in .pdf or .doc
rm -i log[0-9][0-9].tmp          # remove matching files, asking first
ls -d ~/.?*                      # hidden configuration files in the home directory
```

Points to remember:

- The **shell** performs the matching against **existing** names. If nothing matches, Bash passes the pattern through unchanged (or the command fails).
- `*` and `?` do not match a leading `.`: hidden files are only matched by patterns that start with a literal dot (for example `.b*`).
- `[!...]` is the POSIX form of negation; Bash also accepts `[^...]`.

### 3.2 Brace expansion

Brace expansion **generates strings**. Unlike wildcards, it does not look at which files exist: it expands **before** the command runs, regardless of the disk state. **No spaces** are allowed inside the braces (`{index, contact}.html` does not work).

| Pattern              | Expands to                                              |
| -------------------- | ------------------------------------------------------- |
| `{a,b,c}`            | `a b c`                                                 |
| `{1..5}`             | `1 2 3 4 5` (`{start..end}`)                            |
| `file{1,2}.txt`      | `file1.txt file2.txt`                                   |
| `config.conf{,.bak}` | `config.conf config.conf.bak` (handy for quick backups) |

```bash
touch file{1..5}.txt                 # creates file1.txt ... file5.txt
mkdir -p proj/{src,bin,docs}         # creates three subdirectories at once
mkdir -pv project/{src,bin,docs,config}
cp config.conf{,.bak}                # same as: cp config.conf config.conf.bak
```

| Globbing                                   | Brace expansion                                    |
| ------------------------------------------ | -------------------------------------------------- |
| **Matches existing** files on disk.        | **Generates** strings, whether or not files exist. |
| Cannot create files that do not exist yet. | Can be used to create new files and directories.   |
| `*`, `?`, `[a-z]`, `[0-9]`                 | `{a,b}`, `{1..5}`                                  |

### 3.3 POSIX character classes

Classes are written **inside** a bracket expression, which is why they have double brackets: the outer `[ ]` is the bracket expression, `[:digit:]` is the class. They are locale-aware.

| Class         | Matches                               |
| ------------- | ------------------------------------- |
| `[[:alnum:]]` | Letters or digits                     |
| `[[:alpha:]]` | Letters                               |
| `[[:digit:]]` | Digits                                |
| `[[:upper:]]` | Uppercase letters                     |
| `[[:space:]]` | Whitespace (space, tab, newline, ...) |

```bash
ls [[:upper:]]*       # names starting with an uppercase letter
```

---

## 4. Navigation and System Info

### 4.1 Navigation and information commands

| Command               | Description                                                                        |
| --------------------- | ---------------------------------------------------------------------------------- |
| `cd dir`              | Change directory.                                                                  |
| `cd -`                | Go back to the previous directory (stored in `$OLDPWD`).                           |
| `cd ~` (or just `cd`) | Go to your home directory.                                                         |
| `cd ..` / `cd ../..`  | Go up one / two directories.                                                       |
| `cd /`                | Go to the root (topmost) directory.                                                |
| `pwd`                 | Print the current (working) directory.                                             |
| `ls [options] [path]` | List directory contents (options in 4.2).                                          |
| `whoami`              | Show the current username.                                                         |
| `hostname`            | Show the name of the machine.                                                      |
| `who`                 | Show who is logged in.                                                             |
| `last`                | Show the history of logins.                                                        |
| `id [user]`           | Show UID, primary group, and all groups (see [11.4](#114-groups)).                 |
| `date`                | Show the date and time. Accepts a format (see below).                              |
| `history`             | Show a numbered list of past commands (re-run one with `!n`).                      |
| `exit` (or `Ctrl+D`)  | Exit the current shell, terminal, or SSH session (`logout` also works for logins). |

Path shortcuts: `.` current directory · `..` parent directory · `~` your home directory · `~user` the home directory of `user`. A relative path depends on where you are, so check with `pwd` first. A trailing slash (`ls /var/log/`) insists on a directory.

**`date` formats** (a `+` followed by a format):

| Format           | Example output                |
| ---------------- | ----------------------------- |
| `date +%F`       | `2026-10-27` (year-month-day) |
| `date +%R`       | `14:35` (hours:minutes)       |
| `date +%x`       | The date in the local format  |
| `date +%A`       | The name of the weekday       |
| `date +%Y%m%d`   | `20261027`                    |
| `date +%Y-%m-%d` | `2026-10-27`                  |

### 4.2 `ls` options

**Essential options**

| Option | Meaning                                                                     |
| ------ | --------------------------------------------------------------------------- |
| `-l`   | Long format: type, permissions, link count, owner, group, size, date, name. |
| `-a`   | Show hidden files (names starting with `.`), including `.` and `..`.        |
| `-d`   | List the directory itself, not its contents (for example `ls -ld /etc`).    |
| `-R`   | Recursive: also list the contents of subdirectories.                        |

**Other useful options**

| Option | Meaning                                           |
| ------ | ------------------------------------------------- |
| `-h`   | With `-l`: human-readable sizes (`4.0K`, `2.3M`). |
| `-s`   | Show the size of each file.                       |
| `-i`   | Show each file's inode number.                    |
| `-1`   | One entry per line.                               |

Options combine: `ls -la`, `ls -lh /bin`, `ls -las`, `ls -li`, `ls -lR`, `ls -ld /etc`.

### 4.3 System information commands

| Command                      | Description                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `uname -s` / `--kernel-name` | Print the kernel name.                                                         |
| `uname -r`                   | Print the kernel release.                                                      |
| `uptime -p` / `--pretty`     | Show how long the system has been running, in a readable form.                 |
| `df -h` / `--human-readable` | Disk space of the file systems, in readable sizes.                             |
| `free -h` / `--human`        | Memory usage in readable sizes (`-k` / `--kibi` for KiB; combine: `free -hk`). |
| `cal 1999` / `cal 12 2000`   | Show the calendar of a year / of a month and year.                             |
| `ps -f`                      | Show information about running processes (full format).                        |

---

## 5. Viewing and Inspecting Files

### 5.1 Commands

| Command               | Description                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `file path`           | Reports what type of file it is (by its **content**, not its extension). `-b` / `--brief` omits the file name. |
| `stat path`           | Shows metadata: size, inode, link count, permissions, owner, and timestamps (access, modify, change, birth).   |
| `stat -c format path` | Prints only the requested fields (see below).                                                                  |
| `cat path`            | Prints the entire file. Several files are joined: `cat a b`. `-n` numbers the lines.                           |
| `head [-n n] path`    | Prints the first lines (default 10). `head -3` and `head -n 3` are the same.                                   |
| `tail [-n n] path`    | Prints the last lines (default 10). `tail -3` and `tail -n 3` are the same.                                    |
| `tail -n +30 path`    | Prints **from line 30 to the end** (written `tail -n+30` as well).                                             |
| `tail -f path`        | Keeps following new lines (useful for logs). `Ctrl+C` stops it.                                                |
| `less path`           | Shows a file page by page; arrow keys scroll both ways, `q` quits.                                             |
| `more path`           | Similar to `less`: `Space` shows the next page, `Enter` the next line, `q` quits.                              |
| `wc [options] path`   | Counts. With no option it prints lines, words, and bytes (three numbers).                                      |

**`wc` options:** `-l` lines · `-w` words · `-c` bytes · `-m` characters · `-L` length of the longest line. Options combine (`wc -wl a b` counts lines and words of both files and prints a total).

**`stat -c` formats:** `%i` inode number · `%s` size in bytes · `%h` number of hard links.

### 5.2 Examples

```bash
file notes.txt                 # e.g. "notes.txt: ASCII text"
file -b /etc/hosts             # type only, without the name
file /etc /bin/bash /dev/null  # directory, executable, special file
stat notes.txt                 # size, permissions, timestamps, inode, links
stat -c "%i" notes.txt         # only the inode number
stat -c %h notes.txt           # number of hard links
cat -n /etc/passwd             # print with line numbers
cat system_status.log meeting_notes.txt   # print two files after each other
head -n 5 notes.txt            # first 5 lines
tail -3 /etc/passwd            # last 3 lines
tail -n+30 /etc/passwd         # line 30 to the end
tail -f /var/log/messages      # follow new lines (Ctrl+C to stop; log name varies)
wc -l notes.txt                # number of lines
wc -wl a.txt b.txt             # lines and words of both files, plus a total
```

Bonus (ex0303): a short report on every file in the current directory:

```bash
for f in *; do
echo -e "\n--- $f ---"
file "$f"
stat -c "Size: %s bytes" "$f"
done
```

---

## 6. Creating, Copying, Moving, Deleting

### 6.1 Commands

| Command             | Description                                                                    | Useful options                                                                                      |
| ------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `mkdir dir`         | Create a directory (several names allowed: `mkdir scripts configs`).           | `-p` creates missing parent directories (and does not fail if it exists) · `-v` verbose             |
| `touch file1 file2` | Create empty files, or update the timestamps of existing ones.                 |                                                                                                     |
| `cp src dest`       | Copy a file. If `dest` is an existing directory, the copy is placed inside it. | `-r` copy directories recursively · `-p` preserve mode, ownership, and timestamps                   |
| `mv src dest`       | Move **or rename** a file or directory.                                        | `-v` show each move                                                                                 |
| `rm file`           | Remove a file.                                                                 | `-r` remove a directory and its contents · `-i` ask first · `-f` force, no prompts (`-rf` combined) |
| `rmdir dir`         | Remove an **empty** directory.                                                 |                                                                                                     |

> **Warning:** there is no recycle bin. `rm` is permanent, and `cp`/`mv` overwrite existing destinations without asking. Be especially careful with `rm -rf` and wildcards (a stray space in `rm -r dir *` deletes far more than intended). Check the destination before `cp -r` or `mv`.

`mkdir test/blah` fails when `test` does not exist; use `mkdir -p test/blah`. `rmdir` refuses a directory that is not empty.

### 6.2 Examples

```bash
mkdir -p project/src          # creates project/ and project/src in one step
mkdir -p data/2025/linux/lab1 # a whole path in one command
touch a.txt b.txt             # two empty files
cp a.txt backup.txt           # copy to a new name
cp a.txt b.txt project/       # copy several files into a directory
cp -r project project_copy    # copy a whole directory
cp *.txt work/                # copy all .txt files (globbing)
mv backup.txt old.txt         # rename
mv old.txt project/           # move into a directory
mv -v song1.mp3 song2.mp3 backup/   # move two files, showing each move
rm a.txt                      # delete a file
rm -i a.txt                   # ask before deleting
rm -r project_copy            # delete a directory and everything in it
rm -r backup/*                # empty a directory without deleting the directory itself
rmdir empty_dir               # delete an empty directory only
```

---

## 7. Text Processing

Most of these commands read from a file **or** from standard input, so they combine well with pipes (section 7.4). `ps` is included here because its output is usually piped into text tools, even though it inspects processes rather than text.

### 7.1 Commands

| Command                  | Description                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `echo "text"`            | Prints text.                                                                                                                 |
| `cut -d delim -f n path` | Extracts fields (columns) from each line.                                                                                    |
| `sort [options] path`    | Sorts lines.                                                                                                                 |
| `uniq [options] path`    | Collapses **consecutive** duplicate lines (so sort first).                                                                   |
| `nl path`                | Adds line numbers to the output.                                                                                             |
| `tr set1 set2`           | Translates, deletes, or squeezes characters. Reads **standard input only** (use `<` or a pipe; it does not take file names). |
| `tee [-a] path`          | Copies its input to the screen **and** to a file.                                                                            |
| `diff file1 file2`       | Compares two text files. **No output means the files are identical.**                                                        |
| `ps`                     | Shows information about running processes.                                                                                   |

### 7.2 Common options

| Command | Option | Meaning                                                                          |
| ------- | ------ | -------------------------------------------------------------------------------- |
| `echo`  | `-n`   | No trailing newline.                                                             |
| `echo`  | `-e`   | Interpret escapes such as `\n` and `\t` (without it, `\t` is printed literally). |
| `cut`   | `-d`   | Field delimiter (default is a tab).                                              |
| `cut`   | `-f`   | Field number(s): `-f1`, `-f 1,7`. Without `-f` it cuts by character.             |
| `sort`  | `-n`   | Numeric sort.                                                                    |
| `sort`  | `-r`   | Reverse order (`-nr` = numeric, largest first).                                  |
| `sort`  | `-u`   | Output only the first of equal lines (removes duplicates).                       |
| `sort`  | `-f`   | Ignore case.                                                                     |
| `sort`  | `-k n` | Sort by field (column) `n`.                                                      |
| `uniq`  | `-c`   | Prefix each line with its number of occurrences.                                 |
| `uniq`  | `-d`   | Show only lines that are duplicated.                                             |
| `tr`    | `-d`   | Delete the given characters.                                                     |
| `tr`    | `-s`   | Squeeze repeated characters into one.                                            |
| `tee`   | `-a`   | Append to the file instead of overwriting it.                                    |
| `ps`    | `aux`  | All processes, user-oriented format (BSD-style options, **no dash**).            |
| `ps`    | `-f`   | Full-format listing (UNIX-style option, with dash).                              |
| `ps`    | `-au`  | Used in ex1001 to find the processes owned by your account.                      |

`tr set1 set2` replaces each character of `set1` with the corresponding character of `set2` (for example `tr 'a-z' 'A-Z'`).

> **`uniq` only collapses adjacent duplicates**, so `sort` first: `sort file.txt | uniq -c`.

### 7.3 Examples

```bash
echo -e "Line1\nLine2"             # -e interprets \n -> prints two lines
echo -e "name,department,score\nalice,IT,87" > students.csv   # create a small CSV file

cut -d: -f1 /etc/passwd            # usernames only (field 1, ":" delimiter)
cut -d: -f1,7 /etc/passwd          # username and shell (fields 1 and 7)
cut -d, -f1,2 students.csv         # first two comma-separated fields

sort numbers.txt                   # text order: 10 comes before 9
sort -n numbers.txt                # numeric order: 9 comes before 10
sort -r names.txt                  # reverse order
sort -u names.txt                  # sorted, duplicates removed

sort names.txt | uniq              # unique names (sort first!)
sort names.txt | uniq -c           # count how often each line appears
sort names.txt | uniq -d           # only lines that appear more than once

tr 'a-z' 'A-Z' < file.txt          # lowercase -> uppercase
tr -d ':' < file.txt               # delete all colons
tr -s ' ' < file.txt               # squeeze repeated spaces into one

nl letters.txt                     # print with line numbers
diff users_last2.txt users_chall.txt   # no output = no difference

ls -l | tee out.txt                # show the output AND save it to out.txt
ls -l | tee -a out.txt             # same, but append instead of overwrite
ps aux | tee processes.txt         # show all processes and save them
```

### 7.4 Combining commands with pipes

```bash
# Which login shells are used on the system, and how many accounts use each?
cut -d: -f7 /etc/passwd | sort | uniq -c | sort -nr

# Page through a long listing or a sorted file
ls -l /usr/bin | less
cat /etc/passwd | sort | less

# Group names, with line numbers, sorted
cut -d ":" -f 1 /etc/group | nl | sort

# Count running processes
ps aux | wc -l

# A chain: sort, remove duplicates, uppercase, first 3 lines, saved to a file
sort users_all.txt | uniq | tr 'a-z' 'A-Z' | head -n 3 > users_chall.txt
```

Step by step for the first example: `cut` extracts the shell field of every account, `sort` groups identical lines together, `uniq -c` counts each group, and `sort -nr` orders the counts from largest to smallest. Example output (will differ on your system):

```
     23 /usr/sbin/nologin
      3 /bin/bash
      1 /bin/sync
```

---

## 8. Input/Output Redirection

### 8.1 Standard streams

Every process starts with three data streams, each identified by a **file descriptor** number:

| Stream | Name            | Descriptor | Default  |
| ------ | --------------- | ---------- | -------- |
| stdin  | Standard input  | 0          | Keyboard |
| stdout | Standard output | 1          | Terminal |
| stderr | Standard error  | 2          | Terminal |

Normal output and error messages are separate streams, which is why you can redirect one without the other. Redirection "unplugs" a stream from the keyboard or screen and connects it to a file or to another program.

### 8.2 Redirection operators

| Syntax        | Meaning                                                       |
| ------------- | ------------------------------------------------------------- |
| `>`           | Send stdout to a file, **overwriting** it (`1>` is the same). |
| `>>`          | Send stdout to a file, **appending** to it.                   |
| `2>`          | Send stderr to a file.                                        |
| `2>>`         | Append stderr to a file.                                      |
| `2>/dev/null` | Discard error messages.                                       |
| `&>`          | Send **both** stdout and stderr to a file (Bash shorthand).   |
| `2>&1`        | Send stderr to wherever stdout currently goes.                |
| `<`           | Use a file as stdin.                                          |

Notes:

- The equivalent of `&>` is `> file 2>&1`. **Order matters**: `cmd > file 2>&1` sends both to the file; `cmd 2>&1 > file` does not (stderr still goes to the terminal).
- `>` empties the target file **before** the command runs. Never read and write the same file (`sort f > f` leaves `f` empty).
- `/dev/null` is a special file that discards everything written to it.

### 8.3 Pipes and `tee`

- A **pipe** (`|`) connects the **stdout** of one command to the **stdin** of the next, in memory (no temporary files). Redirection connects a command to a **file**; a pipe connects a command to **another command**.
- Only stdout travels through a pipe; stderr still goes to the terminal unless redirected (`cmd 2>&1 | next`).
- Commands that read stdin when no file is given (`sort`, `wc`, `cut`, `uniq`, ...) work at the end of a pipe. `tr` reads **only** stdin.
- `>` in the middle of a pipeline takes the output away before it reaches the pipe: `ls > saved.txt | less` shows nothing on screen. `tee` copies its stdin to the screen/pipe **and** to a file, so you can save an intermediate result and keep the pipeline going: `ls | tee saved.txt | less`. Use `tee -a` to append.

### 8.4 Examples

```bash
date > timestamp.txt               # overwrite timestamp.txt with the date
uname -r >> timestamp.txt          # append the kernel release
ls /var/log > varlogs.txt          # save a listing
ls /nonexistent 2> err.txt         # the error message goes to err.txt, not the screen
find /etc -name passwd 2> /dev/null            # hide "permission denied" errors
find /etc -name passwd > results.txt 2> errors.log   # stdout and stderr to separate files
find /etc -name passwd &> all_output.log       # both streams into one file
find /etc -name passwd > out.txt 2>&1          # the same, portable form
sort < unsorted.txt > sorted.txt   # read from one file, write to another
ls | wc -l                         # count directory entries (stdout of ls -> stdin of wc)
ls -l | tee list.txt | wc -l       # save the listing AND count its lines
```

Redirecting a whole group of commands (from ex0599):

```bash
{
echo "unset capstone_env"
echo $capstone_env
type showlogs
} > unsetcheck.txt 2>&1
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
| Can link to directories    | Yes                           | No (`Operation not permitted`)                              |
| If the original is deleted | **Breaks** (dangling link)    | **Still works** (data lives until the last name is removed) |
| Target must exist          | No (can be created dangling)  | Yes                                                         |
| `ls -l` shows              | `l` type and `link -> target` | A normal file (the link count increases)                    |

Extra points:

- `ln -s -t dir target` creates the symbolic link **inside** `dir`, named after the target.
- The path stored in a relative symbolic link is interpreted **relative to the link's own location**, not to your current directory.
- Deleting a symbolic link removes only the link; deleting a hard link removes one name. The file's data is freed only when its link count reaches 0.
- If you recreate a deleted target, a dangling symbolic link works again.

### 9.2 Examples

```bash
echo "hello" > original.txt
ln original.txt hard.txt          # hard link (same inode)
ln -s original.txt soft.txt       # soft link (stores the path "original.txt")
ls -li                            # -i also shows inode numbers
stat -c %h original.txt           # number of hard links (link count)
find . -inum $(stat -c "%i" original.txt)   # all names that share this inode
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
echo "new" > original.txt         # recreate the target...
cat soft.txt                      # ...and the soft link works again

ln -s ~/Documents ~/Desktop/doc_shortcut   # symbolic link to a directory: allowed
ln ~/Documents ~/Desktop/hard_dir          # hard link to a directory: Operation not permitted
ln -s -t /tmp/links /etc/hosts    # creates /tmp/links/hosts -> /etc/hosts
ln -s ../config/passwd project/bin/passwd_link   # relative symbolic link
```

---

## 10. Quotes and Expansion

### 10.1 Single vs double quotes

The shell treats quotes as instructions about which expansions to perform.

| Feature                           | Single quotes `' '`                    | Double quotes `" "`       |
| --------------------------------- | -------------------------------------- | ------------------------- |
| Variable expansion (`$name`)      | **No**                                 | **Yes**                   |
| Command substitution (`$(cmd)`)   | No                                     | Yes                       |
| Wildcards (`*`, `?`) expanded     | No                                     | No                        |
| Keeps spaces together as one word | Yes                                    | Yes                       |
| Best for                          | Exact/literal text, `find -name` globs | Text containing variables |

```bash
name="Bob"
echo "Hello $name"      # Hello Bob
echo 'Hello $name'      # Hello $name
echo "*"                # * (the wildcard is not expanded)
touch "my file.txt"     # one file with a space in its name (without quotes: two files)
touch 'single space file.txt'
touch "double space file.txt"
```

- A single-quoted string cannot contain a single quote.
- Quote wildcard patterns that are meant for a command, not for the shell: `find /data/books -name '*.epub'`.

### 10.2 Backslash escaping

A backslash `\` removes the special meaning of the **next** character.

```bash
echo "The variable \$firstname contains $firstname"   # prints a literal $
touch My\ File.txt                                    # a space in a file name
touch 'price_$100.txt'                                # or use single quotes for $
touch 'wow!.txt'                                      # ! triggers history expansion unless quoted/escaped
```

### 10.3 Variables and `${}`

- Assign with `name=value` and **no spaces** around `=` (`firstname = john` tries to run a command called `firstname`). Multi-word values need quotes: `fullname="john doe"`.
- `$name` or `${name}` gives the value. Braces mark where the name ends:

```bash
firstname=john ; lastname=doe
echo "name: $firstname_$lastname"       # name: doe   (looks for a variable called firstname_)
echo "name: ${firstname}_${lastname}"   # name: john_doe
```

### 10.4 Command substitution and tilde expansion

`$(command)` is replaced by the **output** of the command. `~` expands to your home directory, `~user` to the home of `user`.

```bash
echo "Today is $(date +%A)."
echo "Logged in as $(whoami) on $(hostname)."
touch my_config_$(date +%F)                       # my_config_2026-10-27
cp /etc/passwd passwd_$(whoami)_$(date +%Y%m%d).bak
mkdir -p backup_$(date +%Y-%m-%d)
echo "text" > ~/notes.txt                         # ~ expands before the command runs
```

---

## 11. Users, Groups and Passwords

Account data lives in `/etc/passwd` (users), `/etc/group` (groups), and `/etc/shadow` (password hashes and aging). See [section 15.2](#152-special-files).

Every user has a numeric **UID**, and every group a numeric **GID**. The kernel works with these numbers, not with names.

| Account type   | UID range | Notes                                                                                                      |
| -------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| Superuser      | 0         | `root`: bypasses normal permission checks. Home `/root`.                                                   |
| System/service | 1 - 999   | Run daemons (apache, mail, ...). No interactive login: shell `/sbin/nologin`.                              |
| Regular users  | 1000+     | Humans. Home `/home/username`, shell `/bin/bash`, and a **user private group** (UPG) with the same number. |

`UID_MIN` and `GID_MIN` in `/etc/login.defs` define where regular IDs start (1000). A user has exactly one **primary group** (set in `/etc/passwd`; new files get this group) and any number of **supplementary (secondary) groups** (listed in `/etc/group`).

### 11.1 Switching users

| Command               | Description                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `su account`          | Switch to another account using **that account's** password. Your own environment (PATH, variables) is kept.                                           |
| `su - account`        | Same, but starts a full **login shell** with that user's environment (`su -l` / `su --login` are the same). With no account given, switches to `root`. |
| `sudo command`        | Run **one command** with elevated privileges, using **your own** password, as allowed by `/etc/sudoers`.                                               |
| `sudo -u account cmd` | Run a command as another user (for example `sudo -u neo whoami`).                                                                                      |
| `sudo -i`             | Start an interactive login shell as root, using your own password (if allowed in sudoers).                                                             |
| `sudo -i -u account`  | Start a login shell as another account using **your own** `sudo` permissions and password.                                                             |

Type `exit` to return to your own account.

Direct root login is normally disabled: a shared root password gives no accountability. With `sudo`, every command is logged with the user, time, and command in `/var/log/secure` (RHEL) or `/var/log/auth.log` (Debian). Watch it live with `sudo tail -f /var/log/secure`.

### 11.2 Creating and deleting users

| Command                 | Description        | Common options                                                                                                                                                                                                                                                                    |
| ----------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sudo useradd username` | Create a new user. | `-m` create the home directory · `-d dir` set the home directory path · `-s shell` login shell · `-c "text"` comment (full name) · `-u UID` explicit UID · `-g group` primary group · `-G g1,g2` supplementary groups · `-r` system account · `-M` do not create a home directory |
| `sudo userdel account`  | Delete a user.     | `-r` also remove the home directory and mail spool                                                                                                                                                                                                                                |

- A new account has **no password** and is locked (`!` in `/etc/shadow`) until you set one with `passwd`.
- Whether `useradd` creates the home directory by default depends on the system (`/etc/login.defs`, `/etc/default/useradd`); add `-m` to be sure. With `-m`, the files in `/etc/skel` (`.bashrc`, `.bash_profile`) are copied into the new home.
- Groups named with `-G` or `-g` must already exist.
- `userdel` without `-r` leaves the home directory; files that belonged to the deleted user then show a **number** instead of a name in `ls -l`, and a new user who gets the same UID inherits them.
- A service account: `sudo useradd -r -s /sbin/nologin -d /var/www -M webapp`. `su - webapp` then answers "This account is currently not available."

### 11.3 Modifying users

`sudo usermod options user` changes the settings of an existing account.

| Option          | Meaning                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| `-aG group`     | **Add** the user to supplementary group(s) while keeping existing ones.                                        |
| `-G g1,g2`      | **Set** the supplementary groups to exactly this list (replaces the old list; comma-separated, **no spaces**). |
| `-g group`      | Change the primary group.                                                                                      |
| `-c "text"`     | Change the comment (full name).                                                                                |
| `-s shell`      | Change the login shell (`-s /sbin/nologin` blocks interactive logins).                                         |
| `-d dir -m`     | Change the home directory; `-m` also moves the contents to the new location.                                   |
| `-L` / `--lock` | Lock the password (the user can no longer log in with it; `!` is put in front of the hash in `/etc/shadow`).   |
| `-U`            | Unlock the password.                                                                                           |

> **Important:** `usermod -G` without `-a` **replaces** all supplementary groups. Almost always use `-aG`. Group changes take effect at the user's next login.

### 11.4 Groups

| Command               | Description                                                                                               | Options                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `sudo groupadd group` | Create a group.                                                                                           | `-g n` choose the GID · `-r` create a system group (GID < 1000) |
| `sudo groupdel group` | Delete a group (a group that is the primary group of an existing user cannot be deleted).                 |                                                                 |
| `sudo groupmod group` | Modify a group.                                                                                           | `-n newname` rename · `-g n` change the GID                     |
| `newgrp group`        | Start a new shell in which `group` is your primary group (you must be a member). Type `exit` to leave it. |                                                                 |
| `groups [user]`       | Show the groups of yourself (or of `user`).                                                               |                                                                 |
| `id [user]`           | Show UID, primary group, and all groups with their numbers.                                               |                                                                 |

Files created in a `newgrp` shell belong to that group. The primary group of a user is **not** listed in the 4th field of `/etc/group`; that field holds the supplementary members.

### 11.5 Passwords and aging

| Command                      | Description                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| `passwd`                     | Change **your own** password. `sudo passwd user` changes another user's. |
| `sudo passwd -S account`     | Show password status (`LK` = locked).                                    |
| `sudo chage options account` | Manage password aging and account expiration (options below).            |

To set a password non-interactively, pipe `account:password` into `chpasswd`:

```bash
echo "account:password" | sudo chpasswd
```

This puts the plaintext password in your command history, so it is acceptable for labs but not for real systems. (ex1002 also shows `passwd --stdin account` on RHEL, as a commented-out alternative.)

**`chage` options**

| Option    | Meaning                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| `-l`      | Display password aging and expiration information.                                                              |
| `-M days` | Maximum days before the password must be changed.                                                               |
| `-m days` | Minimum days before the password may be changed again.                                                          |
| `-W days` | Days before expiration on which the user starts getting a warning.                                              |
| `-I days` | Disable the account this many days **after** the password has expired (grace period).                           |
| `-d date` | Date of the last password change. `-d 0` makes the password expire immediately, forcing a change at next login. |
| `-E date` | Account expiration date (`YYYY-MM-DD`).                                                                         |

### 11.6 Sudo configuration

`sudo` rules are stored in `/etc/sudoers` and in files under `/etc/sudoers.d/`. Edit them **only with `visudo`**, which locks the file and checks syntax before saving; a syntax error can lock you out of `sudo`. The drop-in directory is the cleanest way to add rules without touching the main file.

| Command                  | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `sudo visudo`            | Edit `/etc/sudoers` safely.                               |
| `sudo visudo -c -f file` | Check the syntax of a specific file (also written `-cf`). |

**Rule format**

```
who   where = (as_whom : as_group)   [TAGS:]   commands
```

| Part        | Meaning                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `who`       | A user, or a group written with a `%` prefix (for example `%developers`).                      |
| `where`     | The machines on which the rule applies (`ALL` = any).                                          |
| `(as_whom)` | The user(s) the command may be run **as** (`ALL` = anyone, including root).                    |
| `TAGS:`     | Optional, for example `NOPASSWD:` (no password prompt).                                        |
| `commands`  | The allowed command(s), as full paths (`ALL` = any). Arguments listed here must match exactly. |

```
%wheel        ALL=(ALL)   ALL                          # full sudo for group wheel (the Red Hat standard)
devops        ALL=(ALL)   ALL                          # full sudo for the user devops
%opsadmin     ALL=(ALL)   NOPASSWD:ALL                 # passwordless sudo for a group
%developers   ALL=(ALL)   /usr/bin/dnf up              # only a system update
operator      ALL=(root)  NOPASSWD: /usr/sbin/shutdown # one command, no password
%games        ALL=(operator)  /bin/id                  # run id as the user operator
trinity       ALL=(neo)   ALL                          # may only act as neo
```

Test as the user, for example with `sudo -i -u dev2`: `sudo dnf up` works, `sudo useradd testuser` is refused.

### 11.7 Worked examples

```bash
# Users
sudo useradd dev1                                         # defaults
sudo useradd -d /srv/dev2 dev2                            # home in another location
sudo useradd -d /home/neo -c 'The One' -m -s /bin/bash neo
sudo useradd -m -G developers,admins alice                # groups must already exist
sudo usermod -aG docker alice        # add alice to "docker" (keeps her other groups)
sudo usermod -G wheel,dev alice      # SET groups to exactly these two (no spaces!)
sudo usermod -g staff alice          # change primary group
sudo usermod -c "Alice Smith" alice  # set the comment
sudo usermod -L alice                # lock the password (--lock does the same)
sudo usermod -U alice                # unlock it
sudo usermod -s /bin/zsh alice       # change default shell
sudo usermod -s /sbin/nologin intern # block interactive logins
sudo userdel dev1                    # delete the account, home directory stays
sudo userdel -r alice                # delete alice AND her home directory

# Groups
sudo groupadd ops                    # GID assigned automatically
sudo groupadd -g 2000 developers     # create a group with GID 2000
sudo groupadd -r backupsvc           # create a system group
sudo groupmod -n devs developers     # rename the group
sudo groupmod -g 2500 devs           # change its GID
sudo groupdel devs                   # delete the group
newgrp developers                    # new shell with developers as primary group; exit to leave
id alice                             # uid, primary group, and all groups of alice
groups                               # your own groups

# Passwords
sudo passwd -S alice                      # show password status
echo "alice:NewPass123" | sudo chpasswd   # set the password in one line
sudo chage -l alice                       # show aging info
sudo chage -M 90 -W 7 alice               # must change every 90 days, warn 7 days before
sudo chage -m 1 -M 45 -W 7 alice          # min 1 day, max 45 days, warn 7 days before
sudo chage -m 0 -M 90 -W 7 -I 14 alice    # change at any time, every 90 days, warn 7, lock 14 days after expiry
sudo chage -d 0 alice                     # force a password change at next login
sudo chage -E 2026-12-31 alice            # account expires on that date

# Switching users
su - bob                             # become bob (needs bob's password)
sudo -i -u bob                       # become bob (uses your sudo rights)
sudo -u neo whoami                   # run one command as neo

# Sudo configuration
sudo vim /etc/sudoers.d/developers            # add a rule, for example: %developers ALL=(ALL) /usr/bin/dnf up
sudo visudo -c -f /etc/sudoers.d/developers   # check its syntax
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
└─────────────────── Type: - file, d directory, l symbolic link, b/c device
```

A full line looks like this:

```
-rwxr-xr-- 1 alice developers 120 Oct 27 10:00 script.sh
            │  │       │
            │  │       └── group owner
            │  └────────── user owner
            └───────────── link count
```

A `.` after the permission bits (`-rw-r--r--.`) means an SELinux security context is present. Linux checks the **most specific class that applies**: if you are the owner, only the user bits count, even if the group or others have more.

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

| Mode  | Symbolic    | Typical use                                   |
| ----- | ----------- | --------------------------------------------- |
| `644` | `rw-r--r--` | Regular files (owner edits, everyone reads)   |
| `755` | `rwxr-xr-x` | Programs and directories                      |
| `640` | `rw-r-----` | Team-restricted files (group reads)           |
| `600` | `rw-------` | Private files (for example SSH private keys)  |
| `700` | `rwx------` | Private directories                           |
| `000` | `---------` | Completely locked (for example `/etc/shadow`) |

### 12.4 Important directory rules

- To access a file, you generally need `x` on **every parent directory** in its path.
- To **delete** (or rename) a file, you generally need `w` + `x` on its **parent directory**, not write permission on the file itself.
- To **create** a file in a directory, you need `w` + `x` on that directory.

```bash
mkdir t
chmod 400 t ; ls t     # names are listed (details show ??), cd t fails, touch t/f fails
chmod 500 t ; cd t     # cd works, but touch f fails: no w
```

### 12.5 Special permission bits

They form an optional **leading fourth octal digit** (`chmod 4755 file`).

| Bit            | Value | Symbolic | Purpose                                                                                                          |
| -------------- | ----- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| **SUID**       | 4     | `u+s`    | On an executable: runs with the **file owner's** privileges (for example `/usr/bin/passwd`). Ignored on scripts. |
| **SGID**       | 2     | `g+s`    | On an executable: runs with the **file's group**. On a directory: new files inherit the **directory's group**.   |
| **Sticky bit** | 1     | `+t`     | On a directory: only a file's owner, the directory's owner, or root can delete or rename entries inside.         |

How they appear in `ls -l` (a lowercase letter means the `x` bit is also set, uppercase means it is not):

| Octal  | `ls -l` output | Meaning                        |
| ------ | -------------- | ------------------------------ |
| `4755` | `-rwsr-xr-x`   | SUID program                   |
| `2755` | `drwxr-sr-x`   | SGID directory                 |
| `1777` | `drwxrwxrwt`   | Sticky directory (like `/tmp`) |

SUID root programs are a prime target for privilege escalation. Audit them with:

```bash
find / -perm -4000 -type f 2>/dev/null
```

**Why the sticky bit matters**

```
shared/                (no sticky bit)
├── alice.txt          owned by Alice
└── bob.txt            owned by Bob
```

If Bob has `w` and `x` on `shared/`, he can delete `alice.txt`, even though he does not own it and cannot modify its contents. Deleting depends on the permissions of the **parent directory**, not on the file. A sticky bit on `shared/` prevents this: only the file's owner (or the directory owner, or root) can delete it (`rm: cannot remove ...: Operation not permitted`). This is how `/tmp` works (mode `1777`).

**Why SGID on a directory matters:** in `/shared/matrix` with mode `2775` and group `matrix`, a file created by `neo` belongs to group `matrix` instead of `neo`, so the team can collaborate.

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
chmod +x script.sh     # add execute for everyone (same as a+x)
chmod u+x file         # add execute for the owner
chmod g+w,o-r file     # add write for the group, remove read from others
chmod g=rw,o= file     # group exactly rw-, others nothing
chmod -R o-rwx dir     # remove all access for others, recursively
chmod -R 750 dir       # apply recursively
chmod 4755 program     # SUID  (or: chmod u+s program)
chmod 2775 directory   # SGID  (or: chmod g+s directory)
chmod 1777 directory   # sticky bit, rwxrwxrwt  (or: chmod +t directory)
```

### 12.7 Ownership and default permissions

| Command                        | Description                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `sudo chown user[:group] path` | Change the owner, the group, or both (`user:group`). Only root may change the owner. `-R` applies recursively. |
| `sudo chown :group path`       | Change only the group.                                                                                         |
| `chgrp group path`             | Change the group owner only.                                                                                   |
| `umask`                        | Display the current umask: the permission bits that are **removed** from new files and directories.            |
| `umask -S`                     | Display the umask in symbolic form (`u=rwx,g=rx,o=rx`).                                                        |
| `umask nnn`                    | Set the umask for the current shell session (for example `umask 0027`).                                        |

New files start from `666` (`rw-rw-rw-`) and new directories from `777` (`rwxrwxrwx`): files never get `x` by default. The umask **clears** the bits that are set in it (for the usual masks this is the same as subtracting: `666 - 022 = 644`).

| `umask` | New files | New directories | Typical use                    |
| ------- | --------- | --------------- | ------------------------------ |
| `022`   | `644`     | `755`           | Standard users                 |
| `027`   | `640`     | `750`           | Shared departmental servers    |
| `077`   | `600`     | `700`           | Strict security (root on RHEL) |
| `007`   | `660`     | `770`           | Group collaboration (ex1199)   |

To make a umask permanent, add it to `~/.bashrc`: `echo "umask 0027" >> ~/.bashrc`.

### 12.8 Worked examples

```bash
chmod o-w readme.txt                   # remove write from others
chmod 640 project/notes.txt            # owner rw, group r, others nothing
sudo chown devuser:projectteam shared/teamdoc.txt   # change owner and group
sudo chgrp projectteam shared/secret.txt            # change only the group
sudo chown :projectteam shared/secret.txt           # the same with chown
chmod 660 shared/teamdoc.txt           # owner and group rw only
chmod 400 shared/secret.txt            # owner read only
chmod 755 sharedir                     # everyone can read, only the owner can modify

# Collaborative directory (SGID)
mkdir -p ~/osfundamentals/team_project
sudo chown student:projectteam ~/osfundamentals/team_project
chmod 2775 ~/osfundamentals/team_project     # drwxrwsr-x : new files get group projectteam
sudo -u devuser bash -c "umask 0007; echo 'Devuser contribution' > /home/student/osfundamentals/team_project/dev_report.txt"

# Sticky directory
ls -ld /srv/shared/sticky_test         # drwxrwxrwt : t at the end = sticky bit
rm /srv/shared/sticky_test/file_student.txt   # your own file: allowed; other users' files: refused

# umask
umask                                  # show the current umask (for example 0022)
umask 0027                             # new files: 640, new directories: 750
```

---

## 13. Searching with `find`

`find` walks a directory tree and tests every entry against the conditions you give. It searches file **attributes** (name, type, size, owner, time), not the text inside files.

### 13.1 Syntax and common tests

```bash
find [start-dir...] [tests] [actions]
```

| Test                   | Meaning                                                                        | Example                                  |
| ---------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| `-name pattern`        | File name matches a **glob** pattern (case-sensitive). Quote the pattern.      | `find ~ -name "*.txt"`                   |
| `-iname pattern`       | Same, but **case-insensitive**.                                                | `find ~ -iname "*.txt"`                  |
| `-type t`              | Type: `f` regular file, `d` directory, `l` symbolic link.                      | `find ~ -type l`                         |
| `-user user`           | Owned by this user.                                                            | `find /home -user andrew`                |
| `-group group`         | Belongs to this group.                                                         | `find /home -group acs10x`               |
| `-nouser` / `-nogroup` | Owner (or group) no longer exists ("orphans").                                 | `find / -nouser -o -nogroup 2>/dev/null` |
| `-size n`              | Size (units in 13.2).                                                          | `find ~ -size +100M`                     |
| `-mtime n`             | Last **modified** `n` days ago (24-hour units).                                | `find / -mtime +30`                      |
| `-mmin n`              | Last modified `n` **minutes** ago.                                             | `find / -mmin -10`                       |
| `-atime n` / `-amin n` | Last **accessed** (read/opened) `n` days / minutes ago.                        | `find / -amin -5`                        |
| `-ctime n` / `-cmin n` | Last **changed** (metadata: permissions, owner, inode) `n` days / minutes ago. | `find ~ -ctime -1`                       |
| `-perm -mode`          | Has **at least** these permission bits set.                                    | `find / -type f -perm -4000`             |
| `-inum n`              | Has inode number `n` (finds all hard links of a file).                         | `find . -inum 1048601`                   |

`-name` uses **shell-style wildcards** (`*`, `?`, `[]`), and the pattern must be quoted so the shell does not expand it first. Tests are combined with **AND** by default (`find /var/log -type f -name 'secure*'` = regular files **and** names starting with `secure`).

### 13.2 Numeric arguments: `+n`, `-n`, `n`

- `+n` means **more than** `n`, `-n` means **less than** `n`, and plain `n` means **exactly** `n`.
- **Time:** `-mtime 7` = modified exactly 7 days ago (between 7 and 8 times 24 hours); `-mtime +30` = more than 30 days ago (old files); `-mmin -10` = less than 10 minutes ago (recent files).
- **Size:** suffixes are `c` (bytes), `k` (KiB), `M` (MiB), `G` (GiB). `-size +100M` = larger than 100 MiB, `-size -1k` = smaller than 1 KiB, `-size N` = exactly N units (rounded up).

### 13.3 Actions and combining tests

| Item              | Meaning                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `-print`          | Print the matches (the default action). Test your criteria with it before using `-exec`. |
| `-exec cmd {} \;` | Run `cmd` on each match (`{}` stands for the file name, `\;` ends the command).          |
| `-delete`         | Delete every match.                                                                      |
| `-o`              | OR (the default between tests is AND).                                                   |

### 13.4 Examples

```bash
find ~/Downloads -name examscores.csv       # exact name
find /data/books -name '*.epub'             # wildcard (quoted!)
find /var -type f -name "*.conf"            # regular files only
find / -name 'host' 2> /dev/null            # hide "permission denied" errors
find ~ -type l                              # all symbolic links in home
find /home -group acs10x                    # files owned by a group
find / -nouser -o -nogroup 2> /dev/null     # files without a valid owner or group
find / -size +100M 2> /dev/null             # files larger than 100 MiB
find ~ -size -1k                            # files smaller than 1 KiB
find / -mmin -10                            # modified less than 10 minutes ago
find / -mtime +30                           # modified more than 30 days ago
find / -perm -4000 -type f 2>/dev/null      # all SUID files
find . -inum $(stat -c "%i" report.txt)     # every name of the same inode
find /usr/share/doc -name '*.example*' -o -name '*.conf*'   # one pattern OR the other

find ~ -size +10M -exec mv {} ~/Desktop \;                  # move large files to the desktop
find /usr/bin -size +2M -size -10M -mtime +10 -exec cp {} /tmp/$USER \;   # copy matching files
find ~ -name '*.torrent' -delete                            # delete every match
```

---

## 14. Archiving and Copying Between Machines

### 14.1 `tar`

`tar` (Tape ARchiver) bundles many files and directories into one **archive** file (a "tarball") and extracts them again. Unlike `cp`, it **preserves metadata**: owner, group, permissions, and timestamps. It does not compress by itself.

```bash
tar -c|x|t -f archive [-z|-j|-J] [-C dir] [paths]
```

Choose exactly **one** of `-c`, `-x`, `-t`.

| Option                    | Meaning                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `-c` / `--create`         | **Create** a new archive from `paths`.                                                                                         |
| `-x` / `--extract`        | **Extract** files from an archive.                                                                                             |
| `-t` / `--list`           | **List** the contents without extracting.                                                                                      |
| `-f file` / `--file`      | The archive file name. Must be the **last** option in a cluster, directly followed by the name (`-czf name`, not `-cfz name`). |
| `-v` / `--verbose`        | Print each file as it is processed (`tar -tvf` lists with details).                                                            |
| `-C dir`                  | Change to `dir` first: when extracting, files are placed there.                                                                |
| `-z` / `--gzip`           | Compress/decompress with **gzip**.                                                                                             |
| `-j` / `--bzip2`          | Compress/decompress with **bzip2**.                                                                                            |
| `-J` / `--xz`             | Compress/decompress with **xz**.                                                                                               |
| `-P` / `--absolute-names` | Keep the leading `/` in names. **Dangerous**: extracting can overwrite system files. Inspect with `tar -tvf` first.            |

| Compression | Option | Typical extension   | Compression ratio | Speed     |
| ----------- | ------ | ------------------- | ----------------- | --------- |
| none        | (none) | `.tar`              | None              | Fastest   |
| gzip        | `-z`   | `.tar.gz` or `.tgz` | Low               | Fast      |
| bzip2       | `-j`   | `.tar.bz2`          | Medium            | Slow      |
| xz          | `-J`   | `.tar.xz`           | High (best)       | Very slow |

GNU `tar` detects the compression automatically when **listing or extracting**, so `tar -xf backup.tar.gz` works without `-z`. When creating, you must say which compression to use. By default `tar` removes the leading `/` from member names ("Removing leading '/' from member names") so that extracting never overwrites files at their original absolute location.

### 14.2 `scp`

```bash
scp [-r] [-P port] source destination
```

`scp` copies files between machines over SSH (the same encryption and authentication as `ssh`; the remote machine only needs an SSH server).

- A remote location is written `user@host:path`. The **colon** is what tells `scp` the path is remote.
- `-r` is required when copying a **directory**.
- `-P port` (capital P) selects a non-default SSH port.
- Existing files at the destination are overwritten without warning.
- Linux servers run an SSH server by default; a default Windows PC does not, so you cannot copy from Linux to it.

### 14.3 Worked examples

```bash
tar -cf backup.tar myfolder/             # create an uncompressed archive
tar -czf backup.tar.gz myfolder/         # create + gzip
tar -cjf backup.tar.bz2 myfolder/        # create + bzip2
tar -cJf backup.tar.xz myfolder/         # create + xz
tar -czvf archive.tgz dir                # create + gzip, verbose
tar -tf backup.tar.gz                    # list contents without extracting
tar -tvf backup.tar                      # list with details
tar -xzf backup.tar.gz                   # extract into the current directory
tar -xf backup.tar.gz                    # the same: compression is detected
tar -xvf static-web.tgz -C /var/www/html # extract into another directory
tar -czf /tmp/${USER}_backup.tgz /tmp/$USER   # archive a directory

scp backup.tgz backup@mybackup.server.kdg.be:~/backups   # copy a file to another machine
scp -r 'Pictures/My Cat' jeff@backups.com:~/Backups/Pictures   # copy a directory (-r)
scp root@files005.police.belgium.eu:/data/secure/records.tar.gz .   # copy from the remote machine to here (.)
scp -P 2222 myfile user@remotehost:/var/www/html     # non-default SSH port
```

Other tools mentioned in the course (not practised): `rsync` (transfers only changed parts), `sshfs` (mounts a remote directory over SSH), `rdiff-backup` and `borgbackup` (backup tools); graphical SFTP/SCP clients: WinSCP, FileZilla, Cyberduck.

---

## 15. Important Directories and Files

### 15.1 Essential directory map

| Path                       | Contents                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/`                        | The root of the whole file system tree (one root; no drive letters).                                                       |
| `/etc`                     | System-wide configuration files.                                                                                           |
| `/home` and `/root`        | Users' home directories, and the superuser's home directory.                                                               |
| `/usr/bin` and `/usr/sbin` | Standard user commands, and administrative commands. (On many modern distributions `/bin` and `/sbin` are links to these.) |
| `/var`                     | Variable data that changes while the system runs (logs in `/var/log`, databases, mail spool).                              |
| `/tmp`                     | Temporary files. World-writable with the sticky bit (`1777`); old files are removed automatically.                         |
| `/run`                     | Runtime state since boot (PID files, locks, sockets).                                                                      |
| `/dev`                     | Device files that represent hardware (and special files such as `/dev/null`).                                              |
| `/boot`                    | Kernel and boot loader files.                                                                                              |
| `/usr/share/man`           | The manual pages (see [section 18](#18-getting-help)).                                                                     |
| `/usr/share/doc`           | Package documentation, README files, and sample configuration files.                                                       |

### 15.2 Special files

| Path                   | Purpose                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `/dev/null`            | Anything written to it is discarded (used as `2>/dev/null`).                                   |
| `/etc/login.defs`      | Default values for new accounts (UID/GID ranges, password aging defaults, home creation, ...). |
| `/etc/default/useradd` | More defaults for `useradd`.                                                                   |
| `/etc/skel`            | Template files copied into a new home directory (`.bashrc`, `.bash_profile`).                  |
| `/etc/passwd`          | Basic account information, one line per user. Readable by everyone.                            |
| `/etc/shadow`          | Password **hashes** and aging data (see `chage`). Readable by root only.                       |
| `/etc/group`           | Group definitions and members.                                                                 |
| `/etc/sudoers`         | The main `sudo` rules file (edit with `visudo`).                                               |
| `/etc/sudoers.d/`      | Directory of additional sudo rule files.                                                       |
| `/etc/ssh/sshd_config` | Configuration of the SSH server (for example to disable direct root login).                    |
| `/var/log/secure`      | Authentication log on RHEL, including every `sudo` command (`/var/log/auth.log` on Debian).    |
| `~/.bashrc`            | Per-user Bash configuration (aliases, variables).                                              |
| `~/.bash_profile`      | Read by login shells.                                                                          |
| `~/.bash_history`      | Your command history (permissions `600`).                                                      |

Formats (fields are separated by `:`, which is why `cut -d: -f1` works on these files):

```
/etc/passwd:  alice:x:1001:1001:Alice Smith:/home/alice:/bin/bash
              name:password placeholder:UID:GID:comment:home:shell        (7 fields)

/etc/group:   wheel:x:10:student,sysadmin
              name:password placeholder:GID:members                       (4 fields)

/etc/shadow:  root:$6$kG9...$vN7:19820:0:90:7:14:20000:
              name:hash:last change:min days:max days:warn days:inactive days:expiry date:reserved   (9 fields)
```

The `x` means the real password hash is in `/etc/shadow`. In `/etc/shadow`, `$6$` marks a SHA-512 hash (`$y$` yescrypt), and `!` or `*` means locked / no password. The "last change" and "expiry" fields count days since 1970-01-01; min, max, warn, and inactive correspond to `chage -m`, `-M`, `-W`, `-I`.

---

## 16. Shell Environment

| Syntax                     | Purpose                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `NAME=value`               | Create a **local** shell variable (no spaces around `=`).                                  |
| `$NAME`                    | Use the variable's value (`${NAME}` when it touches other text).                           |
| `export NAME=value`        | Make the variable available to **child processes** (an environment variable).              |
| `env`                      | Show the environment variables.                                                            |
| `set`                      | Show all shell variables (and functions), including your own.                              |
| `unset NAME`               | Remove a variable.                                                                         |
| `$PATH`                    | Colon-separated list of directories searched for commands.                                 |
| `$HOME`, `$USER`, `$PS1`   | Examples of environment variables: home directory, user name, prompt format.               |
| `alias ll='ls -la'`        | Create a shortcut for a command. `alias` alone lists the aliases; `unalias ll` removes it. |
| `type name`                | Show how a name is interpreted (alias, built-in, or program).                              |
| `~/.bashrc`                | Per-user Bash configuration file, read by interactive (non-login) shells.                  |
| `~/.bash_profile`          | Read by **login** shells.                                                                  |
| `source ~/.bashrc`         | Re-read a config file in the current shell, without opening a new one.                     |
| `bash`                     | Start a new (child) shell. `exit` returns to the parent.                                   |
| `bash -l` / `bash --login` | Start a **login shell** (reads `~/.bash_profile`); simulates a fresh login.                |

```bash
GREETING=hello
bash -c 'echo "[$GREETING]"'     # [] : a plain variable is not passed to child processes
export GREETING
bash -c 'echo "[$GREETING]"'     # [hello] : an exported variable is

echo $PATH                       # e.g. /usr/local/bin:/usr/bin:/bin
export PATH="$PATH:$HOME/bin"    # append a directory to the search path
export PATH=$HOME/osfundamentals/capstone/bin:$PATH   # prepend: your directory is searched first

export PAGER=cat                 # PAGER is a system variable: man now prints without a pager
export EDITOR=vim
alias showlogs='cat ~/osfundamentals/capstone/logfiles.txt'
unset EDITOR                     # remove the variable
unalias showlogs                 # remove the alias
type showlogs                    # check: no longer an alias
```

A personal script directory:

```bash
mkdir -p ~/bin
vim ~/bin/hello.sh               # first line must be:  #!/bin/bash
chmod +x ~/bin/hello.sh          # make it executable
export PATH=$HOME/bin:$PATH      # in ~/.bashrc, so that "hello.sh" works from anywhere
```

- Variables and aliases set at the prompt disappear when the shell exits. To make them permanent, add them to `~/.bashrc` and run `source ~/.bashrc`.
- Opening a new `bash` runs `~/.bashrc`; `~/.bash_profile` is only read by a login shell (log out and in, or simulate it with `bash --login`).
- **Trap alert:** forgetting `export` means the variable does not reach subshells or programs; forgetting `source ~/.bashrc` means changes are not applied until a new shell starts; aliases only expand in **interactive** shells, not in scripts.
- Order matters in `PATH`: put your own directory **before** `$PATH` to have it searched first.

---

## 17. Vim Cheat Sheet

Vim is a **modal** editor: the same key does different things depending on the mode. Start with `vim file`. For an interactive 25-minute tutorial, run `vimtutor`.

### 17.1 Modes

| Key      | Action                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| `Esc`    | Return to **Command (Normal) mode** (the default mode for moving, deleting, copying, ...). Works from every mode. |
| `i`      | Enter **Insert mode** (type text).                                                                                |
| `v`      | Visual mode: select characters.                                                                                   |
| `V`      | Visual line mode: select whole lines.                                                                             |
| `Ctrl+v` | Visual block mode: select a column (rectangle).                                                                   |
| `:`      | Extended command mode (for commands such as `:w`, `:q`).                                                          |

In Visual mode, `y` copies (yanks) the selection and `d` deletes it.

### 17.2 Saving and quitting

Type these from Command mode, then press `Enter`.

| Command          | Action                                       |
| ---------------- | -------------------------------------------- |
| `:w`             | Save (write) changes.                        |
| `:w newfile.txt` | Save under a new file name.                  |
| `:wq` or `:x`    | Save and quit.                               |
| `:q`             | Quit (refuses if there are unsaved changes). |
| `:q!`            | Quit and **discard** unsaved changes.        |

### 17.3 Navigation and search

| Key                   | Action                         |
| --------------------- | ------------------------------ |
| `h` / `j` / `k` / `l` | Move left / down / up / right. |
| `/pattern`            | Search forward.                |
| `n`                   | Next match.                    |

### 17.4 Editing

| Key             | Action                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `i` / `a`       | Insert before / after the cursor.                                                                                          |
| `I` / `A`       | Insert at the start / end of the line.                                                                                     |
| `o` / `O`       | Open a new line below / above and start inserting.                                                                         |
| `x`             | Delete the character under the cursor.                                                                                     |
| `dd`            | Delete (cut) the line.                                                                                                     |
| `yy`            | Yank (copy) the line. `3yy` copies 3 lines.                                                                                |
| `p` / `P`       | Paste below / above the cursor (after / before for characters).                                                            |
| `u`             | Undo.                                                                                                                      |
| `:%s/old/new/g` | Replace `old` with `new` in the whole file: `%` = the entire document, `s` = substitute, `g` = every occurrence on a line. |

### 17.5 Minimal survival workflow

1. `vim file` opens the file in Command mode.
2. Press `i` (or `a`, `o`) to start typing; press `Esc` when done.
3. Move with `h j k l`, or search with `/text`.
4. Edit with `dd` (delete line), `yy` then `p` (copy and paste a line), `u` (undo).
5. Save and leave with `:wq`, or leave without saving using `:q!`.
6. To copy several lines: `V` (select lines), move, `y`, then `p`. To delete a column: `Ctrl+v`, select, `d`.

---

## 18. Getting Help

### 18.1 Manual pages

Linux has four layers of help: quick help in the command itself (`--help`, `help`), **manual pages** (`man`), GNU **info** pages, and package documentation. Manual pages live in `/usr/share/man`, grouped in 9 sections.

| Section | Content                                        | Examples                               |
| ------- | ---------------------------------------------- | -------------------------------------- |
| 1       | User commands (executables and shell programs) | `ls`, `cp`, `cat`, `date`, `passwd`    |
| 2       | System calls (kernel interface)                | `fork()`, `open()`                     |
| 3       | Library functions (C library)                  | `printf()`, `malloc()`                 |
| 4       | Special files (devices)                        | `null`, `zero`, `tty` in `/dev`        |
| 5       | File formats and configuration files           | `/etc/passwd`, `/etc/fstab`, `crontab` |
| 6       | Games and screensavers                         |                                        |
| 7       | Conventions, standards, protocols              | `IP`, `TCP`, file system hierarchy     |
| 8       | System administration commands                 | `useradd`, `fdisk`, `systemctl`, `ip`  |
| 9       | Linux kernel API                               |                                        |

| Command              | Description                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `man passwd`         | Open the manual page; without a section, the **lowest-numbered** section wins (the command). |
| `man 1 passwd`       | Open the page from section 1 (the `passwd` command).                                         |
| `man 5 passwd`       | Open the page from section 5 (the `/etc/passwd` file format).                                |
| `man -k word`        | Search the page titles and short descriptions for a keyword (same as `apropos word`).        |
| `man -s 1 -k passwd` | Restrict the keyword search to section 1.                                                    |
| `man -K word`        | **Full-text** search in the body of all pages (thorough but slow).                           |
| `apropos word`       | Same as `man -k word`.                                                                       |
| `mandb`              | Rebuild the keyword index that `man -k` / `apropos` use.                                     |

Inside a manual page: `q` quits, `/text` searches forward, and `n` jumps to the next match. In the output of `man -k`, the number in parentheses is the section, for example `printf (1)` and `printf (3)`.

### 18.2 Quick help and built-ins

| Command             | Description                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `command --help`    | Short option summary printed by the program itself (`ls --help`, `cp --help`, `passwd --help`).           |
| `help builtin`      | Help for a Bash **built-in** (`help cd`, `help echo`, `help history`, `help pwd`).                        |
| `type command`      | Tells whether a command is a built-in, an alias, or a program. Built-ins have no `man` page of their own. |
| `info topic`        | GNU info reader: hyperlinked pages in nodes (`info coreutils`).                                           |
| `pinfo topic`       | A friendlier, coloured reader for the same pages (`pinfo coreutils`).                                     |
| `ls /usr/share/doc` | Package documentation: README files, changelogs, sample configuration files.                              |

`pinfo` keys: arrows scroll · `Enter` / `Right` follow a link · `u` / `Left` go up to the parent node · `n` / `p` next / previous node · `q` quit.

```bash
ls /usr/share/doc/sudo
less /usr/share/doc/sudo/sample.sudoers
```

Vendor support: the Red Hat Knowledgebase (access.redhat.com) and the `sosreport` diagnostic tool.

### 18.3 Reading a SYNOPSIS

Example: `crontab [-u user] < -l | -r | -e > [-i]`

| Notation              | Meaning                                                          |
| --------------------- | ---------------------------------------------------------------- |
| **bold** text         | Type it exactly as shown (command names, literal options).       |
| _italic_ / underlined | A placeholder for a value you supply (replace `user` by a name). |
| `[ ]`                 | Optional.                                                        |
| `< a \| b >`          | Choose exactly **one** of the alternatives.                      |

### 18.4 Options you look up in the exercises (ex0401, ex0402)

| Task in the exercise                         | How you find it           | Result                                          |
| -------------------------------------------- | ------------------------- | ----------------------------------------------- |
| Show hidden files with `ls`                  | `man ls`, search "period" | `-a` (`--all`)                                  |
| Command to change file permissions           | `man -k permission`       | `chmod`                                         |
| Command to change file ownership             | `man -k ownership`        | `chown`                                         |
| Section of the `printf` **command**          | `man -k printf`           | section 1 (section 3 is the C library function) |
| Section of the `kill` **command**            | `man -k kill`             | section 1 (section 2 is the system call)        |
| `tar` option for a gzip-compressed archive   | `man tar`                 | `-z`                                            |
| `cp` option that preserves mode, owner, time | `man cp`                  | `-p` (`--preserve`)                             |
| `gzip` option that keeps the original file   | `man gzip`                | `-k` (`--keep`)                                 |

---

## 19. Networking and Remote Access (SSH)

| Concept           | Summary                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IPv4 address**  | Four decimal numbers 0-255 separated by dots (for example `192.168.1.10`). The most common.                                                             |
| **IPv6 address**  | Eight groups of hexadecimal digits (`0`-`9`, `A`-`F`) separated by colons.                                                                              |
| Special addresses | `127.0.0.1` loopback (the same computer) · `192.168.x.x` and `10.x.x.x` local/private networks.                                                         |
| **DNS**           | A name server translates names (`www.kdg.be`) into IP addresses. Its own address (for example `8.8.8.8`) is part of your network settings.              |
| **Port**          | A number (1 - 65535) that selects a service on a machine: **22** SSH · **80** HTTP · **443** HTTPS. A client connects to a port of a server (a socket). |

| Command                 | Description                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| `ip a`                  | Show your network interfaces and IP addresses on Linux (look for `inet`). |
| `ifconfig` / `ipconfig` | The same on macOS / on Windows.                                           |
| `curl ifconfig.me`      | Show your **public** IP address.                                          |
| `ping hostname`         | Check that a machine can be reached (and that its name resolves).         |

**SSH** (Secure Shell) gives an encrypted text connection to a remote (often headless) server that runs an SSH service on port 22.

| Command                      | Description                                                                |
| ---------------------------- | -------------------------------------------------------------------------- |
| `ssh user@host`              | Log in to the remote machine.                                              |
| `ssh -p 2222 user@host`      | Use a non-default port.                                                    |
| `ssh user@host 'uptime'`     | Run one command on the remote machine and return.                          |
| `ssh -t user@host "command"` | Force a terminal for the remote command (used to start the lab exercises). |
| `exit`, `logout`, `Ctrl+D`   | End the SSH session.                                                       |

At the first login you are asked to accept the server's key fingerprint (type `yes`); the password is typed without any characters being shown. After the first login, change your password with `passwd`. Windows 10/11 has `ssh` built in (PowerShell or Command Prompt); older Windows uses PuTTY. See [14.2](#142-scp) for `scp`.

```bash
ssh USERNAME@HOST          # log in
passwd                     # change the initial password
whoami ; hostname ; id     # who am I, where am I
who ; last                 # who is logged in now / earlier logins
exit
```
