## Week 1

### 0201 - Accessing the Command Line

Execute the commands listed in the **Command** column in the order in which they are displayed. For feedback, compare your result with the **What to expect** column and read the explanation to understand what is happening. If you lose track, reset the exercise and start over from the first command.

#### Basic Bash syntax

| Command | What to expect | Explanation |
|---|---|---|
| `ls` | `Desktop Documents Downloads Music Pictures Videos` | Simple command, no options or arguments. |
| `ls -a` | All entries, including hidden ones (names starting with a dot) | Simple command (`ls`) with an option (`-a`): show all files. |
| `ls -l /etc` | A long listing, e.g. `-rw-r--r--. 1 root root 749 Aug 5 01:56 passwd` | Command: `ls`, option: `-l`, argument: `/etc`. |
| `ls -lh /bin` | A long listing with human-readable sizes | Command: `ls`, multiple options: `-lh`, argument: `/bin`. |
| `head -n 5 /var/log/dnf.log` | The first 5 lines of the file | The option `-n` has `5` as its value; `/var/log/dnf.log` is the argument. |
| `tail -n 3 /var/log/dnf.log` | The last 3 lines of the file | Show the last 3 lines. |
| `wc -l Documents/fruits.txt` | `3 Documents/fruits.txt` | Counts the lines (`-l`) in a file. |
| `wc -w Documents/fruits.txt Documents/vegetables.txt` | `3 Documents/fruits.txt`, `3 Documents/vegetables.txt`, `6 total` | Counts the words (`-w`) in two files (two arguments). |

#### Combining commands

| Command | What to expect | Explanation |
|---|---|---|
| `date ; whoami` | The date, followed by `student` | Run two separate commands one after the other, separated by `;`. |
| `ls -1 ; pwd` | One entry per line, followed by `/home/student` | Combine two commands, with or without options/arguments. |

#### Viewing file contents

| Command | What to expect | Explanation |
|---|---|---|
| `cat Documents/fruits.txt` | `Apples`, `Oranges`, `Bananas` | Displays the contents of `fruits.txt`. |
| `cat Documents/fruits.txt Documents/vegetables.txt` | The fruits followed by the vegetables | Displays and concatenates both files. |

#### Tab completion

Whenever you see `[Tab]`, press the Tab key. If there are multiple possibilities, keep adding letters until it is unequivocal.

| Command | What to expect | Explanation |
|---|---|---|
| `ls /etc/hostn[Tab]` | `ls /etc/hostname` | Save typing effort by using the Tab key. |
| `cat Doc[Tab]fr[Tab]` | `cat Documents/fruits.txt` | Completes the directory and then the file. |
| `cat Do[Tab][Tab]c[Tab]v[Tab]` | `cat Documents/vegetables.txt` | Keep typing letters until the completion is unambiguous. |

#### Spreading long commands over multiple lines

Use `\` at the end of a line to split a long command over multiple lines:

```bash
echo "This is a very long command that" \
"we are splitting across" \
"multiple lines"
```

Expected output: `This is a very long command that we are splitting across multiple lines`

#### History

| Command | What to expect | Explanation |
|---|---|---|
| `history` | A numbered list of past commands | Shows your command history. |
| `Ctrl+R`, `tail`, `Enter` | The most recent command containing `tail` | Search backward in the history for a pattern. |
| `!3` | Command number 3 is executed again | Re-run the command with number 3 from the list. |
| `!!` | The last command is executed again | Repeat the last command. |
| `date +%F` | e.g. `2025-08-12` | Shows today's formatted date. |
| `echo -n "Today is " ; !!` | e.g. `Today is 2025-08-12` | Combines `echo` with the previously executed command (`date +%F`). |

#### Save your results

Finally, practise redirection and record your work:

1. Concatenate `Documents/fruits.txt` and `Documents/vegetables.txt` with `cat` and save the output into `~/combined.txt`.
2. Run the long `echo` command from above (split over three lines with `\`) again, but redirect its output into `~/long_command.txt`.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0201">Try exercise</a>

### 0202 - Accessing the Command Line

This is a flow-based exercise set, where each task builds on the previous one, guiding you through a realistic workflow using Linux command line fundamentals.

**Scenario:** You have just logged in to a remote Linux system. You want to explore some text files related to system status and personal notes, analyze them and practice efficient command line usage.

#### 1. Basic navigation

- Display your current working directory by entering `pwd`, followed by ENTER.
- List all files in your home directory using `ls`.

#### 2. Viewing files

There are two files in your home directory: `system_status.log` and `meeting_notes.txt`.

- View the contents of `system_status.log` using `cat`.
- Then, display the contents of `meeting_notes.txt` using `cat`.

#### 3. Viewing multiple files at once

- Display the contents of both `system_status.log` and `meeting_notes.txt` in a single command, and save that output into `~/all_files.txt`.

#### 4. Using head and tail to focus on parts of files

- Display the first 10 lines of `system_status.log` using `head` and save them into `~/status_head.txt`.
- Display the last 5 lines of `meeting_notes.txt` using `tail` and save them into `~/notes_tail.txt`.
- Use options with `head` to display only the first 3 lines of `meeting_notes.txt` and save them into `~/notes_head.txt`.

#### 5. Counting lines, words and bytes

- Count how many lines are in `system_status.log` and save **only the number** into `~/status_lines.txt` (hint: `wc -l < file` prints only the number).
- Count the number of words in `meeting_notes.txt` and save **only the number** into `~/notes_words.txt`.
- Use one command to count lines and words in both files together (display only).

#### 6. Combining commands

- Use a command to display the last 5 lines of `system_status.log`, then immediately display the current date and time. (Hint: use `;` to combine commands.)
- Tip: build the line step by step: write the command before the `;`, then test. If that works, write the command after the `;`. If that works as well, combine both commands with `;`.

#### 7. Long commands on multiple lines

Construct and run this command to find all lines containing the word "error" in `system_status.log`, sort them, count duplicates, and sort numerically in descending order, breaking it over multiple lines with `\`. Add a redirection at the end so the result is saved into `~/error_summary.txt`.

```bash
grep -i "error" system_status.log | \
sort | \
uniq -c | \
sort -nr
```

Without line splitting, the command would look like this; nevertheless it would work just the same:

```bash
grep -i "error" system_status.log | sort | uniq -c | sort -nr
```

Don't worry if you don't understand everything in these commands. Just do your best to type these commands error-free. Try both of them.

#### 8. Tab completion practice

- Use tab completion to list files starting with `m` (e.g., `meeting_notes.txt`).
- Try to autocomplete the command `cat` followed by a filename using tab completion.

#### 9. Using command history

- Display the last commands you typed.
- Use `Ctrl+R` to reverse search your history for the command containing `grep`.
- Run the command again from history, by referring to it by its number.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0202">Try exercise</a>

### 0203 - Accessing the Command Line

#### 1. Command, options and arguments

##### 1.1 Commands with arguments

Split the lines below into the components **command**, **option(s)/parameter(s)** and **argument(s)**. (Use a text editor or a spreadsheet program to write out the solutions, or just think them through.)

| Command line | Command | Option(s) | Argument(s) |
|---|---|---|---|
| `cat -n /etc/passwd` | | | |
| `ls -l /etc` | | | |
| `ls -l -a /` | | | |
| `ls -la /` | | | |
| `cd /home/user` | | | |
| `echo -n Hello World` | | | |
| `cal 1999` | | | |
| `cal 12 2000` | | | |
| `head -n 3 /etc/group` | | | |

##### 1.2 Commands with only options but no arguments

Enter these commands at the command line, both with and without options. (What is the command, what is the option?)

| Command line | Command | Option(s) |
|---|---|---|
| `ps -f` | | |
| `uname -s` | | |
| `uname --kernel-name` | | |
| `uptime -p` | | |
| `uptime --pretty` | | |
| `df -h` | | |
| `df --human-readable` | | |
| `free -hk` | | |
| `free --human --kibi` | | |

#### 2. Command separator

##### 2.1 Command separator `;`

Execute the commands below and notice the different behaviour:

```bash
echo Hello ls
echo Hello ; ls

echo aaa ; echo bbb ; echo ccc
echo aaa echo bbb echo ccc
```

##### 2.2 head and tail

What does the command `head -n 1 /etc/group ; tail -n 1 /etc/group` do?

##### 2.3 head and tail with `\`

And if you type the following command, pressing ENTER right after the `\`?

```bash
head -n 1 /etc/group ; \
tail -n 1 /etc/group
```

##### 2.4 File types and the file command

Use the `file` command to determine the type of the file. Enter the following commands:

```bash
file /etc/group
file /etc
file /
file /bin/bash
file /dev/null
file /proc/self
file -b /etc/hosts
file --brief /usr/bin/ls
```

Note: all of these different types of files will be explained shortly, e.g. symbolic link or character special file.

##### 2.5 "Headless"

Ask your favorite AI tool what percentage of servers run "headless". By the way, is your Windows or Mac headless?

#### 3. Save your results

1. Run `echo -n Hello World` and redirect its output into `~/echo_n.txt` (the `-n` option suppresses the newline, so the file contains no trailing newline).
2. Run the three commands `echo aaa`, `echo bbb` and `echo ccc` separated by `;` and save their combined output into `~/separators.txt` (hint: group the commands with `( ... )` or `{ ...; }` and redirect the group).

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0203">Try exercise</a>

## Week 2

### 0301 - Navigating the command line

Execute the commands listed in the **Command** column in the order in which they are displayed. If you lose track, reset the exercise and start over from the first command. For feedback, verify with the **Which output to expect** column and read the explanation to understand what is happening.

| Command | Which output to expect | Explanation |
|---|---|---|
| `cd ~` | prompt shows `~` | This is the student user's home directory. `cd` stands for *change directory*; `~` represents the home directory of the current user. |
| `pwd` | `/home/student` | The full path, starting from the root directory (`/`), to the folder where you are now (*print working directory*). |
| `ls` | `Desktop Documents Downloads Music Pictures Videos` | `ls` shows the contents of the directory where you are now. |
| `cd Documents` | prompt shows `Documents` | Switches from your present location to the `Documents` folder. |
| `pwd` | `/home/student/Documents` | |
| `cd ..` | prompt shows `~` | The double dot (`..`) tells the shell to go up one level, to the parent directory. |
| `pwd` | `/home/student` | |
| `cd ../..` | prompt shows `/` | Go back two levels in the hierarchy. |
| `pwd` | `/` | This is the top of the hierarchy: the root. You cannot go back further. |
| `ls` | `bin dev etc home lib ... usr var` | The contents of `/`. |
| `cd home` | prompt shows `home` | You went a level deeper, starting from `/`. `home` needs to be listed in the output of the previous command. |
| `pwd` | `/home` | |
| `ls` | `student` | The home directory lists all the users' home directories. |
| `cd ../etc` | prompt shows `etc` | You switched up one level (to `/`), then down one level to `etc`. |
| `pwd` | `/etc` | |
| `cd /` | prompt shows `/` | You move at once to the folder of destination by specifying it as an argument. |
| `ls` | *Which output would you expect?* | |
| `cd usr` | prompt shows `usr` | `usr` is a folder one level down from `/`. |
| `cd share` | prompt shows `share` | One more level down. |
| `cd doc` | prompt shows `doc` | One more level down. |
| `pwd` | `/usr/share/doc` | The `pwd` command gives the full path of the present location. |
| `cd /var/log` | prompt shows `log` | Switch immediately to a different location by starting the argument with `/` (absolute path). |
| `pwd` | `/var/log` | |
| `cd -` | prompt shows `doc` | By using `-` as an argument, you switch to the previous location (`/usr/share/doc`). |
| `pwd` | `/usr/share/doc` | Using `cd -` again switches back to `/var/log`. Do this before continuing. |
| `cd ~` | prompt shows `~` | `~` stands for the home directory of the current user. |
| `cd .` | prompt shows `~` | The single dot means *this directory*: no change. |
| `pwd` | `/home/student` | |

#### Save your results

Record where you are by redirecting the output of `pwd` into files in your home directory:

1. Go to `/usr/share/doc` and save the output of `pwd` into `~/pwd_doc.txt`.
2. Go to `/var/log` and save the output of `pwd` into `~/pwd_log.txt`.
3. Go back to your home directory and save the output of `pwd` into `~/pwd_home.txt`.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0301">Try exercise</a>

### 0302 - Manage Files from the Command Line (guided)

Start a terminal and execute the commands listed in the **Command** column in the order in which they are displayed. If you lose track, reset the exercise and start over from the first command. For feedback, verify with the **What output to expect** column and read the explanation to understand what is happening.

| Command | What output to expect | Explanation |
|---|---|---|
| `cd ~` | prompt shows `~` | Puts you into your home directory, in case you are not in it. |
| `mkdir testdir` | *(no output)* | No output generally means the command executed OK. Creates a new directory `testdir`. |
| `cd tes[Tab]` | `cd testdir/` (press Enter) | Auto-completion with the Tab key. |
| `touch myfile myotherfile` | *(no output)* | Creates two new empty files, `myfile` and `myotherfile`. |
| `ls` | `myfile myotherfile` | Lists the contents of `testdir`. |
| `cp myfile copiedfile` | *(no output)* | Copy `myfile` to a new file `copiedfile`. |
| `ls` | `copiedfile myfile myotherfile` | There are now three (empty) files in `testdir`. **Also save this listing**: run `ls > ~/listing_copied.txt`. |
| `mv myf[Tab] renamedfile` | *(no output)* | `mv` moves files and directories, but is also used to rename them. `my` is not enough to distinguish between `myfile` and `myotherfile`. |
| `ls` | `copiedfile myotherfile renamedfile` | **Also save this listing**: run `ls > ~/listing_renamed.txt`. |
| `rm rena[Tab]` | *(no output)* | The `rm` command removes the files mentioned as arguments. |
| `cd ..` | prompt shows `~` | Go up one level. |
| `rmdir testdir` | `rmdir: failed to remove 'testdir/': Directory not empty` | `rmdir` can only remove empty folders. Continue with the next command to empty the folder. |
| `cd testdir` | prompt shows `testdir` | Go back to the `testdir` folder. |
| `rm *file` | *(no output)* | Remove all files that end with the string `file`. The asterisk expands to any string of zero or more characters. This is called *globbing*. |
| `cd ~` | prompt shows `~` | Go back to the home directory. |
| `rmdir testdir` | *(no output)* | Remove the directory `testdir`. |
| `ls` | The `testdir` folder should not be there any more. | |

Execute the commands meticulously. At the end of the exercise the `testdir` folder must be gone and the two listing files must exist in your home directory.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0302">Try exercise</a>

### 0303 - File Navigation, Paths, Listing, and File Metadata

#### Part 0 – Setup

```bash
cd ~/Documents
```

#### Part 1 – Absolute & relative paths

**1.1 Identify absolute paths**

1. What is your current working directory? (`pwd`)
2. Use `ls` with an absolute path to list the contents of `/var/log`.

**1.2 Navigate with relative paths**

1. Create a directory called `test1` in your current working directory.
2. Move into `test1` using a relative path.
3. From inside `test1`, list the contents of the `Documents` directory using `..` in the path.
4. Return to your home directory using an absolute path **or** the shortcut `~`.

#### Part 2 – Navigating the file system

**2.1 Basic navigation**

1. Change to `/usr` using an absolute path.
2. From `/usr`, move to `/usr/share/gnome` without typing `/usr/share/gnome` in full (use relative navigation).
3. Return to your previous directory using `cd -`.

**2.2 Hidden directories**

1. Go to your home directory (`cd`).
2. List all files and directories, including hidden ones, in long listing format.
3. Which option(s) did you use with `ls`?

#### Part 3 – ls exploration

**3.1 Using options**

1. In your `Documents` directory, create:

   ```bash
   mkdir dirA dirB
   touch dirA/file1.txt dirA/.hiddenfile dirB/file2.txt
   ```

2. List `dirA`:
   - normally (without options)
   - with `-a` to see hidden files
   - with `-l` for detailed info
3. Use `ls -R` on `Documents`. What happens?

#### Part 4 – Inspecting files with file and stat

**4.1 Identifying file types** (in `~/Documents`)

1. Create:

   ```bash
   echo "Hello, Linux" > text1.txt
   touch emptyfile
   mkdir somedir
   ```

2. Use the `file` command on `text1.txt`, `emptyfile` and `somedir`.
3. How does `file` describe each?

**4.2 Examining metadata with stat**

1. Run `stat text1.txt`.
2. Identify the file size (bytes), the last modification time and the permissions.
3. Compare with `stat emptyfile` and `stat somedir`.

**4.3 File changes over time**

1. Record the modification time of `text1.txt`.
2. Append: `echo "Another line" >> text1.txt`
3. Run `stat` again. Which fields changed?

**4.4 file vs. ls -l**

1. Compare the outputs of `ls -l text1.txt` and `file text1.txt`.
2. Which gives type info? Which shows permissions and owner?

#### Part 5 – Special directories

**5.1 `.`, `..` and navigation**

1. From inside `dirA`, run `ls .` and `ls ..`. Compare the results from both commands.
2. From `dirB`, list the files in `dirA` without changing directory.

#### Part 6 – Challenge task (3 minutes)

1. Start in your home directory.
2. Navigate to `/etc` and list all files in long format.
3. Go to `/var/log` without using an absolute path.
4. From `/var/log`, list the contents of `/etc` without leaving `/var/log`.
5. Return to the directory you were in before `/var/log`.
6. Show your current absolute path.

#### Part 7 – File detective missions

**Mission 1 – Basic investigation**

1. Go to your home directory (`cd`).
2. Change to the `mystery` directory.
3. List all files in the `mystery` directory with full details.
4. Use `file` to determine the type of each.
5. Which can be executed?
6. Which is empty?
7. Which is a directory?

**Mission 2 – Metadata sleuth**

1. Use `stat` to check the last modification time of each file.
2. Identify the fields showing the file size, the number of hard links and the permissions in octal.
3. Append to `report1.txt` using the command line below, and check the timestamps on `report1.txt` again.

   ```bash
   stat .hidden_dir binary1 report1.txt script1.sh secret_empty >> report1.txt
   ```

**Mission 3 – Cross-directory clues**

1. Use an absolute path to run `file` on `/etc/passwd`.
2. Change to `~/mystery/.hidden_dir` and run `stat` on `script1.sh` (which is in `mystery`) without changing directory.
3. Go to `/bin` and find `bash` (`ls -l b*`). Use `file` to identify it and `stat` to see its last modification date.
4. Return to the `mystery` directory with `cd ~/mystery`.

**Mission 4 – Bonus forensics report**

For students who want to do some advanced stuff. Create a report on the terminal:

```bash
cd ~/mystery
for f in *; do
      echo -e "\n--- $f ---"
      file "$f"
      stat -c "Size: %s bytes" "$f"
done
```

This should output each file's name, type and size to the terminal.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0303">Try exercise</a>

### 0304 - Manage files and directories

Work in your home directory (`/home/student`). The sections build on each other, so do them in order.

#### 1. Creating directories with mkdir

1. Create a single directory named `backup` inside your home directory (`/home/student`).
2. Create two directories at once in your home directory: `scripts` and `configs`.
3. Create `data/2025/linux/lab1` in one command in your home directory without manually creating each intermediate directory.

#### 2. Copying files and directories with cp

1. Copy `intro.txt` from `Documents` to your `backup` directory.
2. Copy both `chapter1.txt` and `chapter2.txt` from `Documents` into `projects/alpha`.
3. Copy the entire `Pictures` directory into `backup`.
4. Copy both `Pictures` and `Music` directories into `projects/beta`.

#### 3. Moving and renaming with mv

1. Rename `chapter1.txt` in `Documents` to `chap1.txt`.
2. Move `chap1.txt` from `Documents` to `backup`.
3. Move `song1.mp3` and `song2.mp3` from `Music` into `backup`, showing each move with the `-v` option.
4. Move and rename the entire `projects/beta` directory into `projects/archived`.

#### 4. Removing files and directories with rm and rmdir

1. Remove `intro.txt` from `backup`.
2. Remove the empty directory `Downloads` using `rmdir`.
3. Remove the `Music` directory and all its contents in one command.
4. Remove everything inside `backup` without deleting the directory itself (tip: use a combination of `backup` and `*`).

#### 5. Scenario 1 – Departmental resource organization

You are the IT support for a university department. They ask you to:

1. Create:

   ```
   resources/
   resources/students/
   resources/teachers/
   ```

2. Copy all `.txt` files from `Documents` into `resources/students/`.
3. Move all `.md` files from `projects/alpha` into `resources/teachers/`.

#### 6. Scenario 2 – Cleanup operation

The `cleanup` folder (in your home directory) contains old and temporary files (`temp1.log`, `temp2.log`, `old_reports/`, `drafts/` and `old_data/`). Follow the cleanup plan:

1. Move `temp1.log` and `temp2.log` into `cleanup/old_reports/`.
2. Rename `draft1.txt` in `cleanup/drafts` to `draft_final.txt`.
3. Copy the entire `old_data` directory so that it becomes `backup/old_archives`.
4. Copy the entire `drafts` directory so that it becomes `backup/drafts`.
5. Remove the directory `cleanup/drafts/`.
6. Delete all `.zip` files inside `backup/old_archives`.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0304">Try exercise</a>

### 0305 - Linking Files in Linux

#### 1. Creating hard links

**1.1 Basic hard link**

1. Navigate to `~/osfundamentals/links`.
2. Create a hard link to `report.txt` named `report_link`:

   ```bash
   ln report.txt report_link
   ```

**1.2 Verifying hard links**

Use `ls -l report.txt report_link`. What do you notice about the file size, the number of links (second column) and the inode number (`ls -i`)? Verify they share the same inode.

**1.3 Determining if a file has multiple hard links**

1. Use `ls -l` on `report.txt`: the second column shows the number of hard links.
2. Use `find` to list all names referring to the same inode:

   ```bash
   find . -inum $(stat -c "%i" report.txt)
   ```

**1.4 Delete the original hard link**

1. Delete the original `report.txt`.
2. Verify that `report_link` still contains the content (use `cat`).

**1.5 Recreate report.txt**

1. In `~/osfundamentals/links`, create a hard link to `report_link` named `report.txt`.
2. Verify the inodes match (`ls -li report*`).

**1.6 Create additional hard links**

1. Create another hard link named `report_backup` pointing to `report.txt`.
2. Verify all inodes match.
3. Create a hard link named `helper_hard` pointing to `scripts/helper.sh`.
4. Verify the inodes match (`ls -li helper_hard scripts/helper.sh`).

#### 2. Creating symbolic (soft) links

**2.1 Basic symbolic link**

1. Create a symbolic link named `data_link.csv` pointing to `data1.csv`:

   ```bash
   ln -s data1.csv data_link.csv
   ```

2. Verify that `data_link.csv` shows the contents of `data1.csv`.

**2.2 Symbolic link to a file in another directory**

1. From `~/osfundamentals/links`, create a symbolic link named `runme_link` pointing to `scripts/runme.sh`.
2. Create a symbolic link `helper_soft` pointing to `scripts/helper.sh`.

**2.3 Verifying symbolic links**

Use `ls -l data_link.csv runme_link`. How is the output different from hard links? In the output, what does the arrow (`→`) indicate?

#### 3. Behavior differences between hard and symbolic links

**3.1 Deleting the original file**

1. Delete `data1.csv`.
2. Check `data_link.csv` (use `cat`). Does it still work?

**3.2 Recreating the deleted file**

1. Recreate `data1.csv` with new content:

   ```bash
   echo "Some new content" > data1.csv
   ```

2. Does `data_link.csv` now work again?

#### 4. Challenge – copy, move

1. Navigate to `~/osfundamentals/challenge`.
2. Create the following directory tree:

   ```bash
   mkdir -p work/input work/output work/links
   ```

Your tasks:

1. Copy `raw_data.csv` into `work/input/`.
2. Move `report_final.txt` into `work/output/` and rename it to `final_report.txt`.
3. List all files recursively in `work/` using `ls -lR`.

#### 5. Linking challenge

Use `ls -lR` to display the locations of all the files.

1. Navigate to `~/osfundamentals/challenge/work/links`.
2. Create a hard link named `report_hard` pointing to `final_report.txt` (in `work/output`).
3. Verify the inodes match.
4. Create a symbolic link named `data_soft` pointing to `raw_data.csv` (the copy in `work/input`).
5. Verify `data_soft` can be read correctly.
6. Create a symbolic link named `analysis_link` pointing to `analysis.sh` (in `~/osfundamentals/challenge`).
7. Check the link count for `report_hard` using `stat -c %h`.
8. Read `data_soft` to verify the symbolic link is valid.

Tip: a symbolic link created with a relative target is resolved relative to the directory that contains the link, so use paths such as `../input/raw_data.csv`.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0305">Try exercise</a>

### 0306 - Pattern Matching and Expansion

Navigate to the directory `~/osfundamentals/patterns`. It contains a `data/` directory with sample files and an empty `work/` directory.

#### Task 1 – Globbing with `*`

Copy all `.txt` files from `data/` into the `work/` directory using a single `cp` command with a `*` wildcard.

#### Task 2 – Globbing with `?`

Copy all files from `data/` whose names start with `report` and have exactly one digit before `.txt` into `work/`.

#### Task 3 – Globbing with character classes

Copy all files from `data/` whose names match `notes_[a or b].txt` into `work/`.

#### Task 4 – Negated character classes

Copy all `.log` files from `data/` that do **not** contain `1` in their names just before `.log` into `work/`. So you do not want to copy `old_2021.log`, you do want to copy `old_2022.log`, `old_2020.log`, etc.

#### Task 5 – Brace expansion

In `work/`, create the directories `project_alpha`, `project_beta`, and `project_gamma` using a single command.

#### Task 6 – Tilde expansion

Verify that the command `ls ~` shows your home directory contents. Save the output into a file `home_listing.txt` inside `work/`.

Use output redirection (`>`) to send the output to the file `home_listing.txt` inside `work/`. The file will be created because of the redirection.

#### Task 7 – Variable expansion

Set a variable `SRC` to `$HOME/osfundamentals/patterns/data`:

```bash
SRC="$HOME/osfundamentals/patterns/data"
# Make sure you don't make any typing mistake!
```

Use it with `cp` to copy `draft_final.md` into `work/` without typing the full path directly.

#### Task 8 – Command substitution

In `work/`, create a file called `current_date.txt` whose first line is today's date in `YYYY-MM-DD` format (use `date +%F`).

Use output redirection (`>`) to send the output to the file `current_date.txt` in `work/`. The file will be created because of the redirection.

#### Task 9 – Protecting arguments from expansion

Inside `work/`, create three empty files whose names contain characters that the shell would normally expand or interpret. These files should be created literally as named below by using correct quoting or escaping.

- `project notes.txt` (space in name: requires quoting or escaping)
- `price_$100.txt` (dollar sign: requires escaping or single quotes)
- `wow!.txt` (exclamation mark: requires escaping or single quotes, especially with history expansion enabled)

#### Task 10 – Quoting differences

Inside `work/`, create:

- `double space file.txt` using **double quotes** around the name when creating it.
- `single space file.txt` using **single quotes** around the name when creating it.

The point: both work to prevent splitting, but variable and command substitution inside the quotes behave differently.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0306">Try exercise</a>

### 0399 - Capstone Lab

This lab ties together the earlier topics: navigation, file management, linking, pattern matching, expansion and quoting/escaping.

#### Capstone Lab – Linux Systems Maintenance Challenge

**Scenario:** You have been hired by the IT department of a company called DataSys to help set up a new project workspace. Your tasks include navigating the filesystem, organizing files, creating backups, linking data, pattern matching, and cleanup, all using the Bash shell.

Your terminal starts in `/home/student/osfundamentals/capstone`, which contains the following directory structure:

```
capstone/
└── workspace/
     ├── todo.txt
     ├── notes/
     │     ├── meeting_jan.txt
     │     ├── meeting_feb.txt
     │     └── archive/
     │          └── old_notes.txt
     └── projects/                (empty at start)
```

#### Part 1 – Navigation and paths

1. **Find your current directory:** run `pwd` to confirm you are inside `/home/student/osfundamentals/capstone`.
2. **Relative navigation:** use `cd` to go into `workspace/notes/archive` using a relative path. Then return to the previous directory with `cd -`.
3. **Listing:** from the `capstone` root, run `ls -l` on `workspace` to confirm the contents. Try `ls -a` to see hidden files (if any).

#### Part 2 – File and directory management

4. **Create directories:** in `workspace`, create a directory `projects` with a subdirectory `drafts` with one command using `mkdir -p`.
5. **Create files:** inside `workspace/projects`, create the empty files `plan1.txt`, `plan2.txt` and `notes.md`.
6. **Copy files:** copy both `plan1.txt` and `plan2.txt` into `workspace/projects/drafts/`.
7. **Move and rename:** move `workspace/projects/notes.md` into `workspace/notes/` and rename it to `project_notes.md`.
8. **Remove files/directories:** remove all `txt` files from `workspace/projects/drafts/`, then remove the empty directory `workspace/projects/drafts/`.

#### Part 3 – Links

9. **Hard link:** in `workspace/`, create a hard link called `todo_hardlink.txt` pointing to `workspace/todo.txt`.
10. **Check links:** verify the link count with `ls -l workspace/todo.txt`.
11. **Symbolic link:** in `workspace/`, create a symbolic link `latest_notes` pointing to the directory `workspace/notes/`. Check the link: is `latest_notes` pointing to the correct location? And is it showing the correct contents when you do `ls workspace/latest_notes`?
    - Hint: if you create the link outside of the directory where you want the symbolic link to be, use the `-t` option to `ln -s`.

#### Part 4 – Expansions & quoting

12. **Brace expansion:** in `workspace/projects/`, create the files `draft1.txt`, `draft2.txt`, and `draft3.txt` in one command.
13. **Variable expansion:** define a variable `MYDIR=workspace/projects`. Use it with `touch $MYDIR/var_test.txt` to create the file.
14. **Command substitution:** in `workspace/`, create a file named `datefile_YYYYMMDD.txt` where `YYYYMMDD` is today's date, using `$(date +%Y%m%d)`.
15. **Tilde expansion:** from anywhere, create a file `workspace/homecheck.txt` by referencing your home directory with `~`.
16. **Protecting arguments from expansion:** create the following files in `workspace/` using quotes or escaping:
    - `project notes.txt`
    - `price_$100.txt`
    - `wow!.txt`
    - `double space file.txt` (using double quotes)
    - `single space file.txt` (using single quotes)

#### Part 5 – Challenge task

17. **The one-liner: listing `.txt` files with globbing.** Your goal is to create a file that lists all `.txt` files in `workspace` and its subdirectories (including nested folders).
    - Use globbing patterns with `ls` and redirection.
    - Make sure the file contains **absolute paths** to each `.txt` file.
    - Save the result into `workspace/all_txt_files.txt`.

    *Tip 1:* you may need to combine several glob patterns: `workspace/*.txt`, `workspace/*/*.txt`, `workspace/*/*/*.txt`.

    *Tip 2:* use output redirection (`>`) at the end of the `ls` command to send the output to the file `workspace/all_txt_files.txt` (there is no need to create the file first).

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0399">Try exercise</a>

## Week 3

### 0401 - Local Help Systems

**Objectives:** find information in local Linux system manual pages: navigate and search man pages, and search for man pages by keyword.

#### Exercise 1 – Navigating a man page

- In your home directory, create the folder `manpages` inside `osfundamentals` (if it doesn't exist).
- Navigate to `~/osfundamentals/manpages`.
- Open the manual page for `ls`.
- Find the option that shows hidden files (search for "period").
- Save only the option name (e.g. `-a`) into the file `ls_hidden.txt`. (Use output redirection with `>` and `echo` to send your answer to `~/osfundamentals/manpages/ls_hidden.txt`.)

#### Exercise 2 – Searching for commands by keyword

You forgot the command to change file permissions.

- Use `man -k permission` to find the right command.
- Save only the command name (not the description nor the number) of the command that changes file permissions into `permission_cmd.txt`.

#### Exercise 3 – Searching inside all man pages

- Run `man -k printf`.
- You will see several entries for `printf`.
- Save the section number of the page that describes the command (the one you can run in the shell) into `printf_section.txt`.

#### Exercise 4 – Combine and apply

- Use `man` to find the option of the `tar` command that creates a compressed archive with gzip.
- Save the option into `tar_gzip.txt`.

All answer files go in `~/osfundamentals/manpages`.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0401">Try exercise</a>

### 0402 - Local Help Systems

**Objectives:** find information in local Linux system manual pages: navigate and search man pages, and search for man pages by keyword.

#### Exercise 1 – Navigating a man page

- In your home directory, create the folder `manpages` inside `osfundamentals` (if it doesn't exist).
- Navigate to `~/osfundamentals/manpages`.
- Open the manual page for `cp`.
- Find the option that allows preserving file attributes (mode, ownership, timestamps).
- Save only the option into `cp_preserve.txt`.

#### Exercise 2 – Searching for commands by keyword (`man -k`)

- You forgot the command to change the owner of a file.
- Use the search term `ownership` (or a related keyword).
- Save the command name into `ownership_cmd.txt`.

#### Exercise 3 – Section numbers

- Run `man -k kill`.
- You will see multiple entries.
- Save the section number of the `kill` command you can run in the shell into `kill_section.txt`.

#### Exercise 4 – Applying options

- Open the manual page for `gzip`.
- Find the option that lets you keep the original file when compressing.
- Save only the option into `gzip_keep.txt`.

All answer files go in `~/osfundamentals/manpages`.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0402">Try exercise</a>

## Week 4

### 0501 - Redirection & Pipelines

**Objectives:** redirect output and error messages into files; append new content to existing files; redirect both output and errors to the same file; build pipelines to filter and process text; use `cut`, `sort`, `uniq` and `tr` in simple data-processing tasks; use `tee` to save and view output simultaneously.

Move to the working directory (already created for you):

```bash
cd ~/osfundamentals/redirection
```

#### Exercise 1 – Redirect standard output

List the files in `/var/log` and save them into `varlogs.txt`.

#### Exercise 2 – Redirect standard error

Try to list a non-existing directory, e.g. `/doesnotexist`, and save the error message into `error.txt`.

#### Exercise 3 – Redirect stdout and stderr together

Save both successful output and errors from exercise 1 and 2 into one file called `combined.txt`.

#### Exercise 4 – Append to a file

Append today's date to the end of `varlogs.txt`.

#### Exercise 5 – Pipelines with cut and sort

Extract the first column from `/etc/passwd` (usernames), sort them alphabetically, and save to `users.txt`.

#### Exercise 6 – Remove duplicates with uniq

Use `sort` and `uniq` on `animals.txt` to produce a list of unique animal names, and save it as `unique_animals.txt`.

#### Exercise 7 – Transform characters with tr

Convert all lowercase letters in `users.txt` into uppercase, and save it as `users_upper.txt`.

#### Exercise 8 – Use tee with a pipeline

Display all running processes with `ps aux`, save them in `processes.txt`, and at the same time show them on your screen.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0501">Try exercise</a>

### 0502 - Edit Text Files with Vim

**Objectives:** learn the basic Vim workflow (`:w`, `:wq`, `:q!`); practice undo and delete; duplicate text using yank and paste (`yy`, `p`); use visual modes (`v`, `Shift+v`, `Ctrl+v`).

#### Setup

In your home directory, create the folder structure `~/osfundamentals/vim`. Navigate to the `vim` folder inside `~/osfundamentals`.

#### Exercise 1 – Create a file

1. Use `vim` to open a new file with the name `notes.txt`.
2. Enter insert mode (`i`) and write:

   ```
   My Vim Practice Notes
   DO NOT DELETE THIS LINE
   Apples
   Bananas
   Cherries
   ```

3. Save and quit: `<esc>`, `:wq`.

#### Exercise 2 – Undo

1. Use `vim` to open `notes.txt`.
2. Navigate to the line `DO NOT DELETE THIS LINE`.
3. Delete the line `DO NOT DELETE THIS LINE` using two keystrokes.
4. Undo the deletion with one keystroke.
5. Save and quit with `:wq`.

#### Exercise 3 – Quit without saving

1. Open `notes.txt`.
2. Delete the line `Bananas` with two keystrokes.
3. Quit without saving.
4. Run `cat notes.txt` to confirm `Bananas` is still there.

#### Exercise 4 – Yank and paste

1. Open `notes.txt`.
2. Move to the line `Cherries`.
3. Yank the line, then paste below `Bananas`.
4. Save and quit.

`Cherries` should now appear twice.

#### Exercise 5 – Visual mode

1. Open `notes.txt`.
2. Add one more line at the end: `Grapes`. Save and quit, then reopen.
3. **Character mode:** select part of `Apples` (`ple`), yank it and paste it at the end of that same line (the line becomes `Applesple`).
4. **Line mode:** select both the lines `Bananas` and `Cherries` (the first `Cherries`), yank and paste them below `Grapes`.
5. **Block mode:** `Ctrl+v` select the first column of all fruit names (all lines from `Applesple` down to the end, not the two header lines) and delete it (`d`).

   Now all fruit names should be missing their first letter, e.g. `Bananas` → `ananas`.

6. Save and quit.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0502">Try exercise</a>

### 0503 - Shell Variables & Configuration

**Objectives:** set shell variables to run commands; assign and retrieve values; configure programs with environment variables; set variables automatically; bash aliases; unset and unexport variables and aliases.

#### Setup

In your home directory, create the folder structure `~/osfundamentals/vars`. Navigate to the `vars` folder inside `~/osfundamentals`.

#### Exercise 1 – Assign and expand variables

1. Create a variable called `course` with the value `osfundamentals`:

   ```bash
   course=osfundamentals
   ```

   (Don't put spaces before or after the `=` sign!)

2. Echo the value with and without braces:

   ```bash
   echo $course
   echo ${course}_linux
   ```

3. Save both outputs to a file `exercise1.txt`.

#### Exercise 2 – Configure Bash with variables

1. Create `~/.vars` with vim and add this line (use `Student` as the name):

   ```bash
   myname="Student"
   ```

2. Reload the file: `source ~/.vars`
3. Check that it works: `echo $myname`

#### Exercise 3 – Environment variables

1. Edit `~/.vars` and add this line below the first one:

   ```bash
   export project=linux101
   ```

   Then reload the `~/.vars` file with `source ~/.vars`.

2. Start a new shell: `bash`
3. Check and save the result:

   ```bash
   echo $myname
   echo $project
   echo $project > ~/osfundamentals/vars/exercise3.txt
   exit
   ```

(If you omit `export`, the variable won't survive into the new shell.)

#### Exercise 4 – Configure programs with environment variables

1. Add this line to the end of `~/.bashrc`:

   ```bash
   export PAGER=cat
   ```

   (`PAGER` is an existing system variable, hence the uppercase letters.)

2. Start a new shell (`bash`) and run `man echo`. If executed correctly, the manual dumps directly to the screen instead of using a pager. (Without `export`, programs like `man` won't see your variable in the new shell.)
3. Exit the subshell when done.

#### Exercise 5 – Aliases

1. Add this line to the end of `~/.bashrc`:

   ```bash
   alias ll='ls -l'
   ```

2. Reload your shell: `source ~/.bashrc`
3. Run (from `~/osfundamentals/vars`):

   ```bash
   ll ~/osfundamentals/vars > exercise5.txt
   ```

#### Exercise 6 – Unset and unexport

1. List all current environment variables (`env`) and your own variables (`set`), among other variables and functions.
2. In your current shell, remove a variable and an alias:

   ```bash
   unset project
   unalias ll
   ```

3. Verify:

   ```bash
   echo $project
   type ll
   ```

4. Enter the following code to save the commands and outputs into `exercise6.txt` (in `~/osfundamentals/vars`):

   ```bash
   {
        echo "unset project"
        echo $project
        echo "unalias ll"
        type ll
   } > exercise6.txt 2>&1
   ```

#### Exercise 7 – Login vs non-login shells

1. Create `~/.bash_profile` containing only the following line:

   ```bash
   export loginvar="set_in_login"
   ```

   Save and exit the file.

2. Note that just opening a new bash shell won't trigger `.bash_profile` like it triggers `.bashrc`. You need to log out and log back in. Since you are in a containerized environment, you can simulate a login shell by entering:

   ```bash
   bash --login
   ```

3. Check:

   ```bash
   echo $loginvar > ~/osfundamentals/vars/exercise7.txt
   exit
   exit
   ```

**Pro tips / trap alert:**

- Forgetting `export` → the variable won't survive into subshells.
- Forgetting `source ~/.bashrc` → changes won't apply until restart.
- Aliases only expand in interactive shells, not in scripts.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0503">Try exercise</a>

### 0599 - Capstone Lab

This lab ties together the topics from chapter 05: redirecting and piping, editing with vim, variables & environment configuration, and aliases and startup scripts.

#### Setup

In your home directory, create the folder structure `~/osfundamentals/capstone`. Navigate to the `capstone` folder inside `~/osfundamentals`. All files below are created in that folder unless a path is given.

#### Step 1 – Collect log data

1. Use a pipeline to list all files in `/var/log` and save the names to `logfiles.txt`.
2. Count how many files are in `/var/log` and append the count to `logfiles.txt`.
3. View `logfiles.txt` to verify.

#### Step 2 – Extended practice with redirection & pipelines

We'll create and process a list of users to practice classic text tools.

Create first a CSV-style file with multiple fields:

```bash
echo -e "name,department,score\nalice,IT,87\nbob,HR,92\ncarol,IT,78\ndave,Finance,85" > ~/osfundamentals/capstone/students.csv
```

**A – cut:** extract only the first (name) and second (department) fields from `students.csv` using a comma delimiter and save to `students_names_departments.txt`.

Hints/tips on the usage of `cut`: without the `-d` option, `cut` uses the TAB character by default; without specifying fields, it cuts by character.

Create a second sample file, by entering the following command exactly as written:

```bash
echo -e "alice\nbob\ncarol\nalice\ndave\nbob\nerin" > users_all.txt
```

**B – sort:** sort `users_all.txt` alphabetically and save to `users_sorted.txt`.

**C – uniq:** remove duplicate names from `users_sorted.txt` and save to `users_unique.txt`.

**D – tr:** convert the lowercase letters in `users_unique.txt` to uppercase and save to `users_upper.txt`.

**E – head:** show only the first 3 lines of `users_upper.txt` and save to `users_top3.txt`.

**F – tail:** show only the last 2 lines of `users_top3.txt` and save to `users_last2.txt`.

**Challenge:** chain B → E together in one command (redirect the result, at the end of the command, to `users_chall.txt`).

Now compare `users_last2.txt` and `users_chall.txt`.

Bonus: use the `diff` command to compare two text files:

```bash
diff users_last2.txt users_chall.txt
# If you see no output, then there is no difference between the two files.
```

#### Step 3 – Create and edit with vim

1. Open a new file `report.txt` in vim. In insert mode, type (use `Student` as the name):

   ```
   OS Fundamentals Capstone
   Student Name: Student
   ```

   Save and quit with `:wq`.

2. Reopen `report.txt` and add these items:

   ```
   Tasks:
   1. Log Data Collected
   2. Environment Configured
   ```

   Save and quit again. (Use `u` to undo and `:q!` to quit without saving if you mess up.)

#### Step 4 – Visual mode magic

1. Open `report.txt` again.
2. Add more tasks:

   ```
   3. Variable Set
   4. Alias Created
   ```

3. Use visual line mode (`Shift+V`) to select tasks 3 and 4 and copy them below the existing list.
4. Use block visual mode (`Ctrl+v`) to select the number column of all tasks and delete it, leaving just the dot, a space and the text.
5. Save and quit.

#### Step 5 – Variables & environment

1. In your current shell, set:

   ```bash
   capstone_project="osfundamentals"
   # Verify that the variable has been set
   echo $capstone_project
   ```

2. Add to the end of your `~/.bashrc`:

   ```bash
   myalias="capstone"
   export capstone_env="lab"
   alias showlogs='cat ~/osfundamentals/capstone/logfiles.txt'
   ```

3. Reload your `.bashrc` and verify:

   ```bash
   echo $capstone_env
   showlogs
   ```

#### Step 6 – Login shell variable

1. Create `~/.bash_profile` containing only:

   ```bash
   export loginvar="capstone_login"
   ```

2. Start a login shell:

   ```bash
   bash -l
   echo $loginvar > ~/osfundamentals/capstone/logincheck.txt
   exit
   ```

#### Step 7 – PATH modification

1. Create a small script in your personal bin. First, create the `bin` folder:

   ```bash
   mkdir -p ~/osfundamentals/capstone/bin
   ```

   Create the following `hello.sh` script in your personal bin (be sure to include `#!/bin/bash` as the very first line of the file, followed by an empty line):

   ```bash
   #!/bin/bash

   echo "Hello from Capstone!"
   ```

   Make the script executable (mode `755`):

   ```bash
   chmod +x ~/osfundamentals/capstone/bin/hello.sh
   ```

2. Add this to the end of your `.bashrc` file:

   ```bash
   export PATH=$HOME/osfundamentals/capstone/bin:$PATH
   ```

3. Reload the shell and run `hello.sh`.

PATH order matters: add your bin directory **before** `$PATH`.

#### Step 8 – Unset and unalias

1. In your current shell:

   ```bash
   unset capstone_env
   unalias showlogs
   ```

2. Save verification output. Enter this code at the command line:

   ```bash
   {
       echo "unset capstone_env"
       echo $capstone_env
       echo "unalias showlogs"
       type showlogs
   } > ~/osfundamentals/capstone/unsetcheck.txt 2>&1
   ```

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-0599">Try exercise</a>

### 1001 - Switching Users and Granting sudo Access

Work as the `student` user. The accounts `sysadmin` (password `sysadmin`) and `devops` (password `devops`) exist, the root password is `administrator`, and the group `opsadmin` exists.

#### Exercise 1 – Switch user & inspect system info

**Goal:** learn to switch users and inspect account information.

1. Use `id student` and `id` to see your own UID, GID, and groups.
2. Use `cat /etc/passwd` and `cat /etc/group` to explore users and groups.
3. Use `ps -au` to view processes and identify which are owned by your account (`student`).
4. Switch to the `sysadmin` account using `su - sysadmin` (password: `sysadmin`).
5. Run `id` inside `sysadmin` to verify identity.

Return to the `student` account with `exit`.

#### Exercise 2 – Grant sudo access to a user

**Goal:** add a new user to a privileged group using `/etc/sudoers.d/`.

1. Switch to root with `su -` (password: `administrator`).
2. Create a file `/etc/sudoers.d/devops` containing:

   ```
   devops ALL=(ALL) ALL
   ```

3. Test by switching to `devops` (password: `devops`) and running `sudo whoami`. It should return `root`. Note the `devops` user still needs to enter his password.
4. Type `exit` twice to return to the `student` prompt.

#### Exercise 3 – Passwordless sudo

**Goal:** configure a group with passwordless sudo.

1. Switch to root with `su -`.
2. Add `devops` to the group `opsadmin`: `usermod -aG opsadmin devops`
3. Create `/etc/sudoers.d/opsadmin` containing:

   ```
   %opsadmin ALL=(ALL) NOPASSWD:ALL
   ```

4. Switch to `devops` and run `sudo whoami` without being prompted for a password. Note the `devops` user does not need to enter his password any longer.

Return to the `student` prompt (`exit` as often as needed).

#### Save your results

Back at the `student` prompt, save the group memberships of `devops` into `~/devops_groups.txt`:

```bash
id -nG devops > ~/devops_groups.txt
```

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-1001">Try exercise</a>

### 1002 - Managing User Accounts

**Learning objectives:** create, modify, and delete local user accounts; understand and configure default account settings in `/etc/login.defs`; use `usermod` to adjust user properties such as home directory, shell, or comment; assign and remove group memberships; configure limited sudo privileges for a group or user; recognize UID/GID numbering ranges on Red Hat-based systems; distinguish between deleting only an account and deleting both the account and its files.

Work as the `student` user. Root privileges are available via `sudo`.

#### Background

Linux is a multi-user operating system. Each user account defines ownership, permissions, and identity.

| File | Description |
|---|---|
| `/etc/passwd` | Basic user information (UID, home, shell) |
| `/etc/shadow` | Encrypted passwords (root-only access) |
| `/etc/group` | Group definitions and members |
| `/etc/login.defs` | Default values for new users (UID, GID, etc.) |

#### Task 1 – Create new user accounts

1. Create user `dev1` with default settings:

   ```bash
   sudo useradd dev1
   ```

2. You can create users and give them a home directory in an alternative location. Create user `dev2` with home directory `/srv/dev2`:

   ```bash
   sudo useradd -d /srv/dev2 dev2
   ```

3. Verify: `grep dev /etc/passwd`

Expected:

```
dev1:x:1001:1001::/home/dev1:/bin/bash
dev2:x:1002:1002::/srv/dev2:/bin/bash
```

#### Task 2 – Check default UID and GID ranges

```bash
grep -E '^(UID_MIN|GID_MIN)' /etc/login.defs
```

Typical output:

```
UID_MIN 1000
GID_MIN 1000
```

These define where the numbering for regular user IDs begin.

#### Task 3 – Create and manage a group

1. Create group `developers` with a group ID of 2000:

   ```bash
   sudo groupadd -g 2000 developers
   ```

2. Check the members of the `developers` group (there should be none): `grep developers /etc/group`. Expected: `developers:x:2000:`
3. Add both users to this group:

   ```bash
   sudo usermod -aG developers dev1
   sudo usermod -aG developers dev2
   ```

4. Verify: `grep developers /etc/group`. Expected: `developers:x:2000:dev1,dev2`

Notice how `dev1` and `dev2` are now members of this group.

#### Task 4 – Modify user information

1. Add a descriptive comment for `dev2`:

   ```bash
   sudo usermod -c "Developer Two" dev2
   ```

2. Lock account `dev1`: `sudo usermod --lock dev1`
3. Check status: `sudo passwd -S dev1`. The output shows `LK` = locked.

#### Task 5 – Set user passwords

Assign the password `RedhatKdG` to `dev2`:

```bash
echo "dev2:RedhatKdG" | sudo chpasswd
```

#### Task 6 – Configure sudo privileges

Allow members of `developers` to run only `/usr/bin/dnf up` (which performs a system update).

1. Create `/etc/sudoers.d/developers`: `sudo vim /etc/sudoers.d/developers`
2. Add the following line, which allows all members of the `developers` group to perform an update of the system:

   ```
   %developers ALL=(ALL) /usr/bin/dnf up
   ```

3. Check syntax: `sudo visudo -cf /etc/sudoers.d/developers`
4. Test:

   ```bash
   # Switch to the dev2 user:
   sudo -i -u dev2
   # Perform the following commands as the dev2 user:
   sudo dnf up
   sudo useradd testuser         # should fail
   # Exit back to the student user when you're done
   ```

#### Task 7 – Deleting users safely

You'll now explore the difference between deleting only an account and deleting the account plus its files.

**Step 1 – Create a third user for testing**

```bash
sudo useradd dev3
echo "dev3:RedhatKdG" | sudo chpasswd
# Verify that the home directory has been made
ls -ld /home/dev3
```

**Step 2 – Delete `dev1` (without `-r`)**

```bash
sudo userdel dev1
```

Check with `grep dev1 /etc/passwd` and `ls -ld /home/dev1`. The user entry is gone, the home directory still exists.

**Step 3 – Delete `dev3` (with `-r`)**

```bash
sudo userdel -r dev3
```

Check with `grep dev3 /etc/passwd` and `ls -ld /home/dev3`. Both the user and the home directory are removed.

**Step 4 – Summary**

| Command | Account removed | Home removed |
|---|---|---|
| `userdel dev1` | ✅ | ❌ |
| `userdel -r dev3` | ✅ | ✅ |

**Step 5 – Reflection:** why do you think Linux keeps user files by default? (Hint: consider multi-user servers and shared data.)

#### Task 8 – Save your results

After finishing Task 7, save the following verification output as the `student` user:

```bash
grep developers /etc/group > ~/developers_group.txt
grep '^dev2:' /etc/passwd | cut -d: -f5,6 > ~/dev2_info.txt
```

#### Reflection questions

1. What is the role of `/etc/login.defs` in account creation?
2. How can you check whether an account is locked?
3. Why is `/etc/sudoers.d/` preferred over editing `/etc/sudoers` directly?
4. What is the safest way to add a user to an existing group?
5. What happens if you delete a user but keep their home directory?

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-1002">Try exercise</a>

### 1003 - Managing Groups

In Linux, groups define collections of users who share permissions to access files, devices, or applications. This exercise teaches you to create, modify, and delete groups; manage group membership; and explore how primary and supplementary groups work.

**Learning objectives:** create, rename, and delete local group accounts; assign users to primary and supplementary groups; modify group IDs and understand how they're allocated; compare primary vs. supplementary group membership; temporarily switch your primary group using `newgrp`.

#### Environment

Work as the `student` user. Root privileges are available via `sudo`. Your exercise environment already includes the following users and groups:

| User | Home directory | Default primary group | Password |
|---|---|---|---|
| alice | `/home/alice` | alice | password |
| bob | `/home/bob` | bob | password |
| charlie | `/home/charlie` | charlie | password |

| Group | GID |
|---|---|
| devteam | 3000 |
| qa | 3001 |

#### Task 1 – Create new groups

Create two new groups:

1. `ops` – without specifying a GID (the system assigns one automatically).
2. `engineers` – with a specific GID of 4000.

```bash
sudo groupadd ops
sudo groupadd -g 4000 engineers
```

Verify with `grep -E 'ops|engineers' /etc/group`. You should see entries similar to:

```
ops:x:3002:
engineers:x:4000:
```

#### Task 2 – Modify existing groups

1. Rename the group `qa` to `quality`:

   ```bash
   sudo groupmod -n quality qa
   ```

2. Change the GID of `devteam` to 3500:

   ```bash
   sudo groupmod -g 3500 devteam
   ```

Verify with `grep -E 'devteam|quality' /etc/group`. Expected lines:

```
devteam:x:3500:
quality:x:3001:
```

#### Task 3 – Change group membership

1. Change alice's primary group to `engineers`:

   ```bash
   sudo usermod -g engineers alice
   ```

2. Add alice and bob to the supplementary groups `devteam` and `ops` (alice first, then bob):

   ```bash
   sudo usermod -aG devteam,ops alice
   sudo usermod -aG devteam,ops bob
   ```

Verify with `id alice` and `id bob`. Expected (example):

```
uid=1000(alice) gid=4000(engineers) groups=4000(engineers),3500(devteam),3002(ops)
uid=1001(bob) gid=1001(bob) groups=1001(bob),3500(devteam),3002(ops)
```

#### Task 4 – Delete and recreate groups

1. Delete the `quality` group: `sudo groupdel quality`
2. Create a system group named `infra`: `sudo groupadd -r infra`

Verify with `grep 'infra' /etc/group`. System groups have GIDs below 1000, e.g. `infra:x:997:`.

#### Task 5 – Temporarily change primary group

1. Switch to user alice: `su - alice`
2. Check your current groups: `id`
3. Temporarily switch your primary group to `ops`:

   ```bash
   newgrp ops
   id
   ```

Observe how your primary group (`gid=`) changes to `ops`. This change lasts until you log out of that shell. Return to the `student` prompt with `exit` as often as needed.

#### Optional exploration

- Examine `/etc/passwd` and `/etc/group` (`less /etc/passwd`, `less /etc/group`).
- Compare how `id` reports primary vs. supplementary groups.
- View your active groups at any moment with `groups`.

#### Save your results

Back as the `student` user, save the final state of the three groups you worked with into `~/verify.txt`:

```bash
grep -E '^(devteam|ops|engineers):' /etc/group > ~/verify.txt
```

#### Recap: key commands

| Purpose | Command |
|---|---|
| Create a group | `groupadd [groupname]` |
| Create a group with a specific GID | `groupadd -g [GID] [groupname]` |
| Rename a group | `groupmod -n [newname] [oldname]` |
| Change a group's GID | `groupmod -g [newGID] [groupname]` |
| Delete a group | `groupdel [groupname]` |
| Change a user's primary group | `usermod -g [group] [username]` |
| Add user to supplementary groups | `usermod -aG [groups] [username]` |
| View user group memberships | `id [username]` |
| Temporarily switch group | `newgrp [group]` |

**Tips:** use `grep`, `id`, and `cat` often: they help you confirm what's really in the system files. If you make a mistake, you can re-run user or group commands with corrected options.

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-1003">Try exercise</a>

### 1004 - Password Aging and Account Locking

**Learning objectives:** view and interpret password aging information using `chage`; modify password aging settings (min/max age, warning days, expiry date); force users to change their password at next login; lock and unlock user accounts using `usermod -L` and `usermod -U`; restrict access using the `nologin` shell; understand how `/etc/shadow` changes with these actions.

Work as the `student` user. Root privileges are available via `sudo`. The initial passwords of the users `qaeng`, `intern` and `tempuser` are `P@ssword1`.

#### Task 1 – Inspect password aging

Use:

```bash
sudo chage -l qaeng
```

to view the password expiration information. Then use `date "+%Y-%m-%d"` to note the current date.

#### Task 2 – Set a password expiration policy

Set the following for user `qaeng`:

- Password must be changed every 45 days.
- Password cannot be changed more than once per day.
- User should receive a warning 7 days before expiry.

Command:

```bash
sudo chage -M 45 -m 1 -W 7 qaeng
```

(Don't forget to also consult the man page for `chage` or use `chage --help`.)

#### Task 3 – Force user to change password on next login

For user `intern`, expire the password immediately:

```bash
sudo chage -d 0 intern
```

Verify that the `intern` user must change his password: `sudo chage -l intern`

#### Task 4 – Lock and unlock a user account

Lock `tempuser` so login is not possible:

```bash
sudo usermod -L tempuser
```

Verify that it is not possible to log in as the `tempuser` user (the password of `tempuser` is `P@ssword1`):

```bash
su - tempuser
```

Expected output: `unix_chkpwd[69]: password check failed for user (tempuser)`

Then unlock it again:

```bash
sudo usermod -U tempuser
```

#### Task 5 – Restrict access using nologin

For user `intern`, change the login shell to `/sbin/nologin`:

```bash
sudo usermod -s /sbin/nologin intern
```

To verify: `grep intern /etc/passwd`

#### Task 6 – Verify results

Check `/etc/shadow` and `/etc/passwd` to confirm:

- `qaeng`'s shadow line contains the proper min/max/warning settings.
- `intern` has the shell `/sbin/nologin`.
- `tempuser`'s password field no longer starts with `!` (after unlock).

Save the verification into the file `~/verify.txt` (one line per check, in this order):

```bash
sudo grep '^qaeng:' /etc/shadow | cut -d: -f4-7 > ~/verify.txt
sudo grep '^intern:' /etc/shadow | cut -d: -f3 >> ~/verify.txt
grep '^intern:' /etc/passwd | cut -d: -f7 >> ~/verify.txt
sudo grep '^tempuser:' /etc/shadow | cut -d: -f2 | cut -c1 >> ~/verify.txt
```

The four lines show: the minimum/maximum/warning/inactive fields of `qaeng`, the "last changed" field of `intern` (`0` means expired), the shell of `intern`, and the first character of the `tempuser` password hash (`$` means unlocked).

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-1004">Try exercise</a>

### 1101 - Managing File and Directory Permissions in Linux

**Learning objectives:** modify file and directory permissions using both symbolic and octal notation; change ownership and group ownership of files and directories; interpret and apply directory permissions for collaborative use.

Work as the `student` user. Root privileges are available via `sudo`. The users `devuser` and the group `projectteam` exist.

#### Folder structure (pre-provisioned)

All files are located under `/home/student/osfundamentals/permissions/`:

```
/home/student/osfundamentals/permissions/
├── ex1/
│   ├── readme.txt
│   └── project/
│        └── notes.txt
├── ex2/
│   └── shared/
│        ├── teamdoc.txt
│        └── secret.txt
└── ex3/
    └── sharedir/
         ├── file1.txt
         └── file2.txt
```

#### Task 1 – File permissions (`ex1/`)

- Use **symbolic** notation to remove write permission for "others" on `readme.txt`.

  Expected: `rw-rw-r--`

- Use **octal** notation to set `project/notes.txt` to: owner read/write, group read-only, others no access.

  Expected:

  ```
  [student@ex1101 ex1]$ ls -l project/
  total 0
  -rw-r-----. 1 student student 0 Oct 23 11:00 notes.txt
  ```

#### Task 2 – Ownership and group management (`ex2/`)

- Change ownership of `shared/teamdoc.txt` to user `devuser` and group `projectteam`.
- Change the group of `shared/secret.txt` to `projectteam` (owner stays `student`).
- Set permissions:
  - `teamdoc.txt`: readable and writable by owner and group only, others have no access.
  - `secret.txt`: readable only by the owner, group and others have no access.

Expected:

```
[student@ex1101 ex2]$ ls -l shared/
total 0
-r--------. 1 student projectteam 0 Oct 23 11:00 secret.txt
-rw-rw----. 1 devuser projectteam 0 Oct 23 11:00 teamdoc.txt
```

#### Task 3 – Directory permissions (`ex3/`)

- Set the directory `sharedir` so everyone can read files but only the owner can modify contents.

  Expected:

  ```
  [student@ex1101 ex3]$ ls -l
  total 0
  drwxr-xr-x. 2 student student 40 Oct 23 13:30 sharedir
  ```

- Ensure `file1.txt` and `file2.txt` are readable by all users (mode `644`).

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-1101">Try exercise</a>

### 1102 - Special & Default Permissions

**Section goals:** apply and verify special permissions (SGID, sticky); control default file creation permissions with `umask`; understand the practical security effects of these permissions.

Work as the `student` user. Root privileges are available via `sudo`. The users `devuser` and the groups `projectteam` and `sharedgrp` exist.

#### Task 1 – Sticky bit (shared directory)

1. Inspect `/srv/shared/sticky_test`:

   ```bash
   ls -ld /srv/shared/sticky_test
   ```

   Expected: `drwxrwxrwt root sharedgrp /srv/shared/sticky_test/` (confirm it has the sticky bit set: a `t` at the end of the permissions).

2. Verify that `student` cannot delete `/srv/shared/sticky_test/file_devuser.txt`.
3. Confirm you can delete your own file:

   ```bash
   rm /srv/shared/sticky_test/file_student.txt
   ```

#### Task 2 – SGID directory

1. Create the directory (notice how the group ownership is `student`):

   ```bash
   mkdir -p ~/osfundamentals/permissions_special/ex2/project_area
   ```

2. Apply the SGID bit and appropriate group ownership:

   ```bash
   # Change group ownership of the `project_area` folder
   sudo chown student:projectteam ~/osfundamentals/permissions_special/ex2/project_area
   # Apply SGID
   chmod 2775 ~/osfundamentals/permissions_special/ex2/project_area
   ```

3. Inside it, create:

   ```bash
   echo "report1" > ~/osfundamentals/permissions_special/ex2/project_area/report1.txt
   echo "report2" > ~/osfundamentals/permissions_special/ex2/project_area/report2.txt
   ```

4. Verify that the new files have group `projectteam` instead of `student`.

#### Task 3 – umask

1. Display the current umask: `umask`. Expected: `0022`
2. Temporarily set umask: `umask 0027`
3. Create:

   ```bash
   echo "testing umask" > ~/osfundamentals/permissions_special/ex3/umask_test.txt
   ```

4. Verify with `ls -l ~/osfundamentals/permissions_special/ex3/umask_test.txt`. Expected: `rw-r-----`
5. Make the change persistent:

   ```bash
   echo "umask 0027" >> ~/.bashrc
   ```

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-1102">Try exercise</a>

### 1199 - Capstone Lab: Advanced File Permissions and Collaboration

**Learning outcomes:** combine SGID, sticky bit, and umask to implement secure, collaborative environments; interpret how default permissions and special bits influence file sharing and protection; verify, troubleshoot, and explain real-world filesystem permission scenarios.

Work as the `student` user. Root privileges are available via `sudo`. The user `devuser` and the group `projectteam` exist, `/srv/shared/uploads` is a shared upload area, and your shell has a default umask of `0007`.

#### Task 1 – Collaborative project directory (SGID)

1. Create the shared project directory:

   ```bash
   mkdir -p ~/osfundamentals/permissions_capstone/team_project
   ```

2. Change ownership of the `team_project` directory: owner `student`, group owner `projectteam`.

   ```bash
   sudo chown student:projectteam ~/osfundamentals/permissions_capstone/team_project
   ```

   Expected:

   ```
   [student@ex1199 permissions_capstone]$ ls -l
   drwxrwx---. 2 student projectteam team_project/
   ```

3. Add the SGID bit to the `team_project` directory and give "other" read and execute permissions, additionally:

   ```bash
   chmod 2775 ~/osfundamentals/permissions_capstone/team_project
   ```

   Expected:

   ```
   [student@ex1199 permissions_capstone]$ ls -l
   drwxrwsr-x. 2 student projectteam team_project/
   ```

4. Create files as both users:

   ```bash
   echo "Student contribution" > ~/osfundamentals/permissions_capstone/team_project/student_report.txt
   sudo -u devuser bash -c "umask 0007; echo 'Devuser contribution' > /home/student/osfundamentals/permissions_capstone/team_project/dev_report.txt"
   ```

5. Verify that both files belong to the `projectteam` group and are writable by it.

   Expected:

   ```
   -rw-rw---- devuser projectteam dev_report.txt
   -rw-rw---- student projectteam student_report.txt
   ```

#### Task 2 – Shared upload area (sticky bit)

1. Check the existing upload area:

   ```bash
   ls -ld /srv/shared/uploads
   ```

   It should show: `drwxrwxrwt`.

2. Create test files:

   ```bash
   echo "Student file" > /srv/shared/uploads/file_student.txt
   sudo -u devuser bash -c "umask 0007; echo 'Devuser file' > /srv/shared/uploads/file_devuser.txt"
   ```

3. Test deletion behavior:
   - `student` can delete their own file (`file_student.txt`): do this.
   - `student` cannot delete `file_devuser.txt`: try it and observe the error.

#### Task 3 – Verify default umask

1. Confirm the umask: `umask`. It should return `0007`.
2. Create a test file:

   ```bash
   mkdir -p ~/osfundamentals/permissions_capstone/umask_test
   echo "Testing umask" > ~/osfundamentals/permissions_capstone/umask_test/umask_test.txt
   ls -l ~/osfundamentals/permissions_capstone/umask_test
   ```

   Expect: `-rw-rw---- student projectteam umask_test.txt`

<a class="try-exercise-button" href="#/practice/os-term-1-canvas/os-term-1-1199">Try exercise</a>
