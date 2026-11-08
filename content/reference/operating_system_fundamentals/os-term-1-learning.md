# Operating Systems · Term 1 Learning Path

This is a guided, progressive exercise path through the complete **Operating System Fundamentals Summary**. Work from Section 01 onward. Each section introduces a small set of ideas, gives you a prepared terminal environment, and ends with a checkpoint that reuses earlier skills. The package groups its exercises with the matching `Section NN — ...` category label.

> **How progress works:** complete the exercises in order. The terminal environment is reset and prepared for each exercise through `preSetupCommands`; you should not need to create the starting files yourself unless an instruction explicitly asks you to. The grader checks the resulting filesystem state, not the exact command sequence.

**Recommended routine:** read the section purpose, complete the exercises from easiest to hardest, revisit any task that needed a hint, and mark the section reviewed only when you can explain what each command did. Do not use destructive commands on real system paths while practising.

## Learning path at a glance

| Section | Topic | Progression goal |
| --- | --- | --- |
| 01 | Linux, terminal and first commands | Understand Linux, the shell, command anatomy and safe first commands |
| 02 | Navigation and system information | Move through paths and inspect the machine |
| 03 | Shell syntax and expansion | Understand quoting, variables, globs, brace expansion and symbols |
| 04 | Viewing and inspecting files | Read file contents, type, metadata and counts |
| 05 | File and directory operations | Create, copy, move, rename and remove safely |
| 06 | Text processing | Extract, sort, count, transform and compare lines |
| 07 | Redirection and pipelines | Connect standard streams, files and commands |
| 08 | Links and inodes | Understand hard links, symbolic links and inode identity |
| 09 | Searching with find | Search by name, type, size, owner, time and permissions |
| 10 | Users and groups | Create and manage accounts and group membership |
| 11 | Passwords and sudo | Manage lab credentials, password aging and elevated commands |
| 12 | Permissions and ownership | Apply rwx, octal modes, special bits, ownership and umask |
| 13 | Archives and secure copy | Bundle, inspect, extract and copy files |
| 14 | Filesystem map | Recognise important system directories and special files |
| 15 | Bash environment | Manage variables, PATH, aliases, startup files and subshells |
| 16 | Vim | Navigate, edit, search, save and quit a terminal editor |
| 17 | Help and documentation | Find authoritative command help and read a synopsis |
| 18 | Integrated capstone | Combine the full course into a small operations workflow |

---

## Section 01 — Linux, the terminal and your first commands

**Purpose:** learn the vocabulary before operating the system. UNIX is a multi-user operating-system family; Linux is UNIX-like, not derived from UNIX source. FOSS means Free and Open-Source Software; GNU is the recursive project name “GNU's Not Unix” and supplies many core tools; the GPL is a copyleft licence for sharing modified software. Linux is the kernel; a distribution combines it with tools and a package manager (for example Debian/Ubuntu with `apt` and `.deb`, or the Red Hat family with `dnf` and `.rpm`). Bash is a shell that reads and expands commands; the terminal is the window/interface in which the shell runs. A headless server has no graphical interface. Root is the superuser (UID 0). A path is absolute when it begins at `/` and relative when it begins from the current directory. An inode stores metadata and data location, not a filename. Linux is case-sensitive. A command follows `command [options] [arguments]`.

**Practise:** identify yourself and the machine, inspect the current directory, use `echo`, `cat`, `type`, `clear`, and `history`, distinguish a parent Bash shell from a child shell with `bash` and `exit`, and understand the role of command separators and comments. The `true` and `false` utilities are included as a small supplement to practise successful and unsuccessful exit statuses; they are not explained in the source summary.

**Practice environment:** simple files in `/home/student`; no administrative changes are needed.

**Checkpoint:** produce a short orientation report containing your working directory, username, hostname and date. Explain the difference between the terminal, shell and kernel.

## Section 02 — Navigation and system information

**Purpose:** master absolute and relative paths. `/` is the filesystem root; `.` is the current directory; `..` is its parent; `~` is your home directory. `pwd` prints the current location. `cd` changes it; `cd -` returns to the previous location. A relative path depends on where you currently are.

**Commands:** `pwd`, `cd`, `ls`, `date`, `hostname`, `whoami`, `who`, `last`, `id`, `uname`, `uptime`, `df`, and `ps`. Also inspect `free -h` and `cal`; they appear in the summary's system-information table, although they are not in the required command list. Use `ls -l`, `-a`, `-d`, `-R`, `-h`, `-s`, `-i`, and `-1` deliberately. Useful formats include `date +%F`, `+%R`, `+%x`, `+%A` and `+%Y%m%d`. `uname -s` gives the kernel name and `uname -r` the release; `uptime -p` is the readable uptime form; `ps -f`, `ps aux` and `ps -au` are distinct process-listing forms.

**Practice database/environment:** a prepared `nav/` tree with a start directory, child directory and archive. System-command output can vary by virtual machine, so these tasks verify saved reports rather than fixed host-specific values.

**Checkpoint:** make a machine snapshot with the current date, hostname, username, kernel release, uptime and disk usage. Explain when `cd -` is more useful than `cd ..`.

## Section 03 — Shell syntax, wildcards, quotes and expansion

**Purpose:** understand that Bash processes a command line before launching the program. It expands globs, braces, `~`, variables and command substitutions. Globbing matches existing names; brace expansion generates strings whether or not files already exist.

**Patterns:** `*` matches any number of characters; `?` matches one; `[abc]` matches one listed character; `[!0-9]` matches a character outside the listed range. POSIX classes include `[[:alnum:]]`, `[[:alpha:]]`, `[[:digit:]]`, `[[:upper:]]` and `[[:space:]]`. Brace forms include `{a,b}` and `{1..5}`. Globs match existing names; brace expansion generates strings without checking the disk. `*` and `?` do not match names beginning with `.`. When no glob matches, Bash may pass the pattern through unchanged. Quote patterns passed to `find` so the shell does not expand them first.

**Quoting:** single quotes preserve literal text; double quotes still allow variable and command substitution but keep spaces together. A backslash escapes the next character. Use `${name}` when a variable name touches other text. `$(command)` inserts command output. The shell symbols `;`, `#`, `\`, `!!` and `!n` have the meanings described in the summary.

**Checkpoint:** create a numbered report set using brace expansion, select only matching files with a glob, and use a variable plus command substitution to name a dated directory.

## Section 04 — Viewing and inspecting files

**Purpose:** choose the correct tool for reading contents versus inspecting metadata. `cat` displays or joins files; `head` shows the beginning; `tail` shows the end or follows a growing log; `less` and `more` page through long output. `file` identifies a type based on content. `stat` reports metadata, including inode, size, permissions, owner, link count and timestamps. `wc` counts lines, words, bytes, characters or the longest line.

**Useful options:** `cat -n`, `head -n`, `tail -n`, `tail -n +N`, `tail -f`, `file -b`, `stat -c`, and `wc -l/-w/-c/-m/-L`. Use `q` to leave `less` or `more`; use Ctrl+C to stop `tail -f`.

**Checkpoint:** create an inspection report for each supplied file using its name, file type, byte size and line count.

## Section 05 — Creating, copying, moving and deleting

**Purpose:** build a safe file-management routine. `mkdir` creates directories; `mkdir -p` creates missing parents. `touch` creates empty files or updates timestamps. `cp` copies; `cp -r` copies directories; `cp -p` preserves mode, ownership and timestamps. `mv` moves or renames. `rm` removes files; `rm -r` removes directory trees; `rm -i` asks first; `rm -f` forces removal. `rmdir` only removes empty directories.

**Safety:** there is no recycle bin. `cp` and `mv` can overwrite destinations. `cp -p` preserves mode, ownership and timestamps. `rm -i` asks first; `rm -f` suppresses prompts; `rm -r` removes directories recursively. Treat `rm -rf` and wildcards as dangerous; inspect paths and matches before deleting. Use `rmdir` when the directory should be empty. For directories, `w` plus `x` on the parent controls creating, deleting and renaming entries.

**Checkpoint:** organise a small project tree, retain a backup copy, rename one file, and remove only the intended temporary file.

## Section 06 — Text processing foundations

**Purpose:** process line-oriented text and structured fields. `echo` prints text; `printf` provides predictable formatting. `cut -d` chooses a delimiter and `-f` selects fields. `sort` sorts lines; `sort -n` sorts numerically; `sort -r` reverses; `sort -u` removes duplicates. `uniq` collapses adjacent duplicate lines, so sort first. `uniq -c` counts them and `uniq -d` shows duplicated lines. `tr` reads standard input and translates, deletes or squeezes characters. `nl` numbers lines. `diff` compares two files; no output means identical. `tee` duplicates input to the terminal and a file.

**Checkpoint:** extract a CSV column, sort it, count repeated values and save the report while still displaying it.

## Section 07 — Standard streams, redirection and pipelines

**Purpose:** every process has stdin (file descriptor 0), stdout (1) and stderr (2). Redirection connects streams to files; a pipe connects one command's stdout to the next command's stdin.

**Redirection:** `>` overwrites; `>>` appends; `2>` redirects errors; `2>>` appends errors; `2>/dev/null` discards errors; `&>` captures stdout and stderr in Bash; `2>&1` sends stderr wherever stdout currently goes; `<` uses a file as stdin. Order matters: `cmd > file 2>&1` captures both streams, but `cmd 2>&1 > file` does not capture stderr in that file.

**Pipes:** only stdout travels through a pipe by default. Use `2>&1 |` to send errors into a pipeline. Use `tee` in the middle of a pipeline when you want to save an intermediate result and keep processing it. Never sort a file into itself with `sort file > file`: the shell truncates the destination before the command reads it.

**Checkpoint:** create a multi-stage pipeline that sorts, deduplicates, numbers and saves a report; separately capture normal output and errors.

## Section 08 — Inodes and hard/soft links

**Purpose:** a filename is a directory entry that points to an inode. An inode stores metadata and data location, not the filename. A hard link is another name for the same inode. A symbolic link is a separate file containing a path.

**Commands:** `ln target linkname` creates a hard link; `ln -s target linkname` creates a symbolic link. `ls -li` displays inode numbers; `stat -c %h` displays a hard-link count. `ln -s -t dir target` puts the new symbolic link in a chosen directory.

**Differences:** hard links share an inode, require the target to exist, cannot cross filesystems and normally cannot point to directories. They continue to work when one name is deleted, until the last hard link is removed. Symbolic links have their own inode, can cross filesystems and point to directories; deleting the target leaves a dangling link. Relative symbolic-link paths are interpreted relative to the link's directory.

**Checkpoint:** create both link types, compare inode numbers, remove the original filename, and explain which link still resolves.

## Section 09 — Searching with find

**Purpose:** `find` walks a directory tree and tests file attributes. Its general form is `find [start-dir...] [tests] [actions]`. Tests are ANDed by default; `-o` means OR. Quote wildcard patterns so Bash does not expand them before `find` sees them.

**Tests to practise:** `-name`, `-iname`, `-type f/d/l`, `-user`, `-group`, `-nouser`, `-nogroup`, `-size`, `-mtime`, `-mmin`, `-atime`, `-amin`, `-ctime`, `-cmin`, `-perm`, and `-inum`. For numeric values, `+n` means more than n, `-n` less than n, and `n` exactly n. Size suffixes include `c`, `k`, `M` and `G`. The time tests refer to access, modification or metadata-change times; distinguish them when deciding what to search.

**Actions:** `-print` previews matches; `-exec command {} \;` runs a command on each match; `-delete` removes matches. Always preview destructive matches first and restrict the starting directory.

**Checkpoint:** find regular text files by name and size, copy the matches to a collection directory with `-exec`, and avoid deleting unrelated files.

## Section 10 — Users and groups

**Purpose:** understand UIDs and GIDs. Root is UID 0; system/service accounts commonly use UIDs 1–999; regular users commonly begin at 1000, according to the configured `UID_MIN` and `GID_MIN`. A user has one primary group and may have supplementary groups. Account records live in `/etc/passwd`, `/etc/group` and `/etc/shadow`.

**Commands:** `useradd` creates an account (`-m`, `-d`, `-s`, `-c`, `-u`, `-g`, `-G`, `-r`, `-M`); `userdel` removes one (`-r` also removes the home); `usermod` modifies one (`-aG` adds supplementary groups, `-G` replaces the list, `-g` changes primary group, `-c` comment, `-s` shell, `-d ... -m` moves home, `-L` locks and `-U` unlocks). `groupadd`, `groupdel` and `groupmod` manage groups; `groups` and `id` inspect memberships; `newgrp` starts a shell with a different active group.

**Safety:** practise only with disposable lab usernames and groups. Group names passed to `-g` or `-G` must already exist. `useradd -r -s /sbin/nologin -M` creates a non-interactive service account; `userdel` without `-r` leaves the home directory. `usermod -L` locks and `-U` unlocks a password. Be especially careful: `usermod -G` without `-a` replaces supplementary groups.

**Checkpoint:** create a team group, create a regular user with a home and Bash shell, add a supplementary group without removing existing memberships, and inspect the resulting IDs.

## Section 11 — Passwords, user switching and sudo

**Purpose:** understand password status and aging, and distinguish changing identity from running one elevated command. A new account may be locked until a password is set.

**Commands:** `passwd` changes your own password; `sudo passwd USER` changes another user's; `passwd -S` displays password status. `chpasswd` reads `user:password` lines from standard input. `chage -l` lists password aging; `-m`, `-M`, `-W`, `-I`, `-d` and `-E` configure minimum/maximum age, warning, inactivity, last-change date and account expiry.

`su USER` switches user while retaining much of the caller environment; `su - USER` starts a login shell. `sudo command` runs one command with elevated privileges; `sudo -u USER command` runs one as another user; `sudo -i` starts an interactive login shell as root; `sudo -i -u USER` starts one as another account.

**Sudo configuration:** rules live in `/etc/sudoers` and `/etc/sudoers.d/`. Edit with `visudo`, not a normal editor, because it locks and validates the file. `visudo -c -f FILE` checks a specific file. A rule has the form `who where = (as_whom : as_group) TAGS: commands`; `%group` names a group, `ALL` is a wildcard, and `NOPASSWD:` is a tag. Authentication logs are commonly `/var/log/secure` (RHEL family) or `/var/log/auth.log` (Debian family).

**Security note:** the `chpasswd` exercise uses a throwaway lab password. Putting plaintext credentials in shell history is not appropriate for real systems.

**Checkpoint:** set a lab-only password, apply aging rules, run one harmless command as another user, and validate sudoers safely.

## Section 12 — Linux permissions and ownership

**Purpose:** read and set permissions for owner, group and others. On files, `r` reads, `w` modifies, `x` executes. On directories, `r` lists names, `w` creates/removes/renames entries (with `x`), and `x` traverses/enters. The most specific class that applies is used.

**Octal modes:** `r=4`, `w=2`, `x=1`; add values for each class. Typical modes include `644` (ordinary file), `755` (directory/program), `640` (group-readable), `600` (private file), `700` (private directory) and `000` (no access). `chmod` supports numeric and symbolic forms (`u/g/o/a`, `+/-/=`).

**Special bits:** SUID `4` (`u+s`) on an executable uses file-owner privileges; SGID `2` (`g+s`) on a directory makes new files inherit its group; sticky `1` (`+t`) on a directory restricts who may remove entries. Typical modes are `4755`, `2775` and `1777`. Lowercase `s`/`t` means the execute bit is also set; uppercase means it is not. `chown user:group` changes both owner and group; `chown :group` or `chgrp` changes only the group. The umask removes bits from the defaults `666` for files and `777` for directories: `022` commonly gives `644`/`755`, `027` gives `640`/`750`, and `077` gives `600`/`700`.

**Ownership and defaults:** `chown user[:group]` changes owner and optionally group (root required); `chown :group` changes only group; `chgrp` changes group only. `umask` displays or sets the mask removed from new permissions. New files start from `666`, directories from `777`; common masks are `022`, `027`, `077` and `007`.

**Checkpoint:** create a workspace with a private area (`700`/`600`), an SGID team directory (`2775`) and a sticky shared dropbox (`1777`).

## Section 13 — Archives and secure copy

**Purpose:** use `tar` to bundle a directory tree while preserving metadata. Select exactly one operation: `-c` create, `-x` extract or `-t` list. `-f` names the archive and should be last in the option cluster, immediately before its filename. `-v` is verbose; `-C` changes the base/destination directory. Compression options are `-z` gzip, `-j` bzip2 and `-J` xz. GNU tar detects compression when listing or extracting. By default it strips leading `/` from stored member names; `-P` preserves absolute names and is dangerous during extraction.

**Secure copy supplement:** the source summary does not teach `scp`, but it is included because it is part of the required command list. The common remote forms are `scp local-file user@host:/remote/path` and `scp user@host:/remote/file local-path`; `-r` copies directories recursively. The sandbox exercises use local-to-local copies where the installed OpenSSH client supports them; they do not assume an external SSH server.

**Checkpoint:** create a compressed tarball, list it before extraction, extract it into a controlled directory with `-C`, and make a local `scp` practice copy.

## Section 14 — Linux filesystem map and special files

**Purpose:** recognise important locations. `/etc` stores system configuration; `/home` and `/root` are user home directories; `/usr/bin` and `/usr/sbin` hold commands; `/var` stores changing data and logs; `/tmp` is temporary storage and commonly has mode `1777`; `/run` contains runtime state; `/dev` contains device and special files; `/boot` contains kernel and boot-loader files; `/usr/share/man` contains manual pages; `/usr/share/doc` contains package documentation.

**Special files:** `/dev/null` discards data; `/etc/login.defs` and `/etc/default/useradd` influence account defaults; `/etc/skel` supplies template files; `/etc/passwd` contains readable account information; `/etc/shadow` stores hashes and aging data and is root-readable; `/etc/group` defines groups; `/etc/sudoers` and `/etc/sudoers.d/` hold sudo rules; `~/.bashrc`, `~/.bash_profile` and `~/.bash_history` are user-specific Bash files.

**Checkpoint:** produce a path reference sheet and safely inspect account-file formats without copying password hashes.

## Section 15 — Bash environment and shell customisation

**Purpose:** distinguish a local shell variable from an exported environment variable. `NAME=value` assigns locally; `export NAME=value` passes it to child processes. `env` shows exported environment variables; `set` shows shell variables and functions too; `unset` removes a variable or function. `PATH` is the colon-separated search path; `$HOME`, `$USER` and `$PS1` are common environment variables.

**Aliases and startup:** `alias ll='ls -la'` creates a shortcut; `unalias ll` removes it; `type` shows whether a command name is an alias, built-in or program. `~/.bashrc` is read by interactive non-login shells; `~/.bash_profile` is read by login shells. `source ~/.bashrc` applies changes to the current shell. `bash` starts a child shell; `bash -l` starts a login shell; `exit` returns to the parent. Aliases are expanded in interactive shells, not scripts. Put a personal bin directory before `$PATH` if it should take priority.

**Checkpoint:** write a shell setup file, source it, export variables to a child shell, create/remove an alias, and verify PATH ordering.

## Section 16 — Editing configuration files with Vim

**Purpose:** become comfortable with Vim's modal workflow. Vim opens in Normal/Command mode. `i` enters Insert mode; `v`, `V` and Ctrl+v select characters, lines or a block; Esc returns to Normal mode. `:` enters extended commands.

**Navigation and editing:** `h/j/k/l` move; `/pattern` searches and `n` finds the next match. `i/a`, `I/A`, `o/O` start inserting at different positions. `x` deletes a character; `dd` deletes a line; `yy` yanks a line; `p/P` pastes; `u` undoes. `:%s/old/new/g` substitutes throughout the file.

**Save and quit:** `:w` saves; `:w newfile.txt` saves under another name; `:wq` or `:x` saves and quits; `:q` quits when there are no unsaved changes; `:q!` discards unsaved changes. The summary recommends `vimtutor` for an interactive tutorial.

**Checkpoint:** edit a small configuration note, perform a search and substitution, save it, reopen it, and confirm the final contents.

## Section 17 — Getting help and documentation

**Purpose:** learn to look up command behaviour instead of guessing. Quick help is available through `command --help` and Bash's `help builtin`. `type` distinguishes aliases, built-ins and programs. `man` opens manual pages; `man -k` and `apropos` search titles/descriptions; `man -K` searches full text. `mandb` rebuilds the keyword index. `info` and `pinfo` browse GNU Info documentation. Package documentation is commonly under `/usr/share/doc`.

**Manual sections:** 1 user commands; 2 system calls; 3 library functions; 4 special files; 5 file formats; 6 games; 7 conventions/protocols; 8 administration commands; 9 kernel API. For example, `man 1 passwd` is the command while `man 5 passwd` describes the file format. Inside `man`, use `q` to quit and `/text` then `n` to search.

**Pinfo keys:** arrows scroll; Enter/Right follows a link; `u`/Left goes up; `n`/`p` moves next/previous; `q` quits. The synopsis conventions are: bold is literal, italic is a placeholder, `[ ]` is optional, and `<a | b>` means choose one alternative.

**Checkpoint:** research the `ls` hidden-file option, the permission and ownership commands, the printf manual section, and the tar gzip option. Record the evidence you found.

## Section 18 — Integrated operating-system capstone

**Purpose:** bring the full toolkit together. You will inspect a delivery, move and copy files, extract CSV fields, sort and count values, create hard and symbolic links, search with `find`, set permissions and group ownership, build a tar archive, use `scp`, inspect user identity and the shell environment, and edit an operator note with Vim.

**Practice environment:** a prepared project delivery containing a brief, a CSV hours report and a disposable temporary file. The environment is reset for every exercise, so each capstone mission can be retried independently.

**Final checkpoint:** produce a final runbook with system identity, date, a unique department report, a saved file listing and an archive-member list. Be able to explain which operations changed names, which created copies, how the permissions protect the workspace, and why the archive should be inspected before extraction.

---

## Command coverage index

The required commands are all practised in the exercises. A few commands are interactive or produce machine-specific output; their exercises ask you to inspect the output and save a short report rather than compare unstable values.

| Command | Main section(s) | Use in this learning path |
| --- | --- | --- |
| `alias`, `unalias`, `type` | 01, 15, 17 | Create/remove shortcuts; identify command resolution |
| `apropos`, `man`, `mandb`, `help`, `info`, `pinfo` | 17 | Search and browse command documentation |
| `bash`, `source`, `exit` | 01, 15 | Start shells, load settings, return to parent shell |
| `cat`, `file`, `head`, `less`, `more`, `stat`, `tail`, `wc` | 04 | View contents, identify type, inspect metadata and count |
| `cd`, `pwd`, `ls`, `clear`, `history` | 01–03 | Navigate and manage the terminal session |
| `date`, `df`, `hostname`, `id`, `last`, `ps`, `uname`, `uptime`, `who`, `whoami` | 02 | Inspect time, host, users, processes, kernel and disk |
| `cp`, `mkdir`, `mv`, `rm`, `rmdir`, `touch` | 05 | Create and manage files/directories |
| `echo`, `cut`, `diff`, `nl`, `sort`, `tee`, `tr`, `uniq` | 06–07 | Transform, compare, count and save text |
| `ln` | 08 | Create hard and symbolic links |
| `find` | 08–09, 18 | Locate files by name, type, size, owner, age, mode and inode |
| `chage`, `chpasswd`, `passwd`, `su`, `sudo`, `visudo` | 11 | Manage lab passwords, aging, identity switching and sudo rules |
| `chgrp`, `chmod`, `chown`, `umask` | 12 | Manage ownership, modes, special bits and defaults |
| `groups`, `groupadd`, `groupdel`, `groupmod`, `newgrp` | 10 | Manage and inspect groups |
| `useradd`, `userdel`, `usermod` | 10–11 | Create, modify and remove disposable accounts |
| `env`, `export`, `set`, `unset` | 15 | Inspect and control shell/environment variables |
| `false`, `true` | 01 | Supplementary practice with success/failure exit status |
| `scp`, `tar` | 13, 18 | Local/remote copy syntax and archive workflows |
| `vim` | 16, 18 | Edit, search, substitute, save and quit |
| `printf` | Throughout | Create predictable files and formatted reports |

**Source boundary:** `scp`, `true` and `false` are included because they were explicitly requested, but their detailed behaviour is not explained in the supplied Linux summary. This guide labels them as supplemental material rather than attributing those details to the summary. `free` and `cal` are also included as extra system-information commands because they appear in the summary.

## Completion standard

You have completed the path when you can solve the section checkpoints without copying hints, explain why a command or option is appropriate, predict how quoting/redirection/permissions affect the result, and distinguish shell expansion before command execution from tests performed later by commands such as `find`. Revisit the sections where you needed hints, then retry the integration exercises from Section 18 without opening the hints first.
