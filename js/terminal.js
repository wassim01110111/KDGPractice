/*
 * ACS Practice: isolated browser-only Linux-like terminal exercise.
 * This is a deliberately constrained shell/filesystem simulation. It never
 * evaluates student input, spawns host processes, or reads host files.
 */
const TERMINAL_VERSION = 1;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_NODES = 5000;
const MAX_SCROLLBACK = 650;
const BUILTINS = new Set([
  ".",
  ":",
  "alias",
  "apropos",
  "bash",
  "cal",
  "cat",
  "cd",
  "chage",
  "chgrp",
  "chpasswd",
  "chmod",
  "chown",
  "clear",
  "command",
  "cp",
  "crontab",
  "cut",
  "date",
  "df",
  "diff",
  "echo",
  "env",
  "exit",
  "export",
  "file",
  "find",
  "free",
  "groups",
  "groupadd",
  "groupdel",
  "groupmod",
  "gunzip",
  "gzip",
  "head",
  "help",
  "history",
  "hostname",
  "id",
  "info",
  "kill",
  "last",
  "less",
  "ln",
  "logout",
  "ls",
  "man",
  "mandb",
  "mkdir",
  "more",
  "mv",
  "newgrp",
  "nl",
  "passwd",
  "pinfo",
  "printf",
  "ps",
  "pwd",
  "rm",
  "rmdir",
  "set",
  "sort",
  "source",
  "scp",
  "su",
  "sudo",
  "stat",
  "tail",
  "tar",
  "tee",
  "touch",
  "tr",
  "true",
  "false",
  "type",
  "umask",
  "unalias",
  "uname",
  "uniq",
  "unset",
  "uptime",
  "useradd",
  "userdel",
  "usermod",
  "vim",
  "vimtutor",
  "visudo",
  "who",
  "whoami",
  "wc",
]);
const SHELL_BUILTINS = new Set([
  ".",
  ":",
  "alias",
  "cd",
  "command",
  "echo",
  "exit",
  "export",
  "false",
  "help",
  "history",
  "pwd",
  "set",
  "source",
  "true",
  "type",
  "umask",
  "unalias",
  "unset",
]);

const MANUALS = {
  help: "Supported commands: alias apropos bash cat cd chage chgrp chpasswd chmod chown clear cp cut date df diff echo env exit export file find false groups groupadd groupdel groupmod head help history hostname id info last less ln ls man mandb mkdir more mv newgrp nl passwd pinfo printf ps pwd rm rmdir scp set sort source su sudo stat tail tar tee touch tr true type umask unalias uname uniq unset uptime useradd userdel usermod vim visudo who whoami wc.\nThis is a browser simulation, not a real Linux system. Run man COMMAND for concise help.",
  pwd: "pwd — print the current virtual working directory. Usage: pwd",
  uname:
    "uname — print simulated system identification. Usage: uname [-a]. The kernel/system string is illustrative, not a real host kernel.",
  cd: "cd — change the virtual working directory. Usage: cd [DIRECTORY]. With no argument, changes to HOME.",
  ls: "ls — list virtual directory entries. Usage: ls [-laR] [PATH ...]. Supported options: -a, -l, -R, -d, -h.",
  mkdir: "mkdir — create directories. Usage: mkdir [-p] DIRECTORY ...",
  touch:
    "touch — create an empty file or update its modification time. Usage: touch FILE ...",
  cat: "cat — print file contents. Usage: cat [FILE ...]. A lone '-' reads standard input.",
  echo: "echo — write arguments followed by a newline. Supports -n (omit final newline), -e (interpret common backslash escapes such as \n and \t), and -E (disable escape interpretation). Example: echo -e 'one\ntwo'.",
  printf:
    "printf — format and write text without adding a newline automatically. Backslash escapes in the format (\n, \t, etc.) become real characters. Supports %s, %b, %c, %d, %i, %u, %o, %x, %X, and %%. Examples: printf 'Hello World\n' > hello.txt; printf '%s\n%s\n' first second > lines.txt.",
  cp: "cp — copy files and directories. Usage: cp [-r] SOURCE DEST; multiple sources require DEST to be a directory.",
  mv: "mv — move or rename paths. Usage: mv SOURCE DEST.",
  rm: "rm — remove files. Usage: rm [-rf] FILE ...; directories require -r.",
  rmdir: "rmdir — remove empty directories. Usage: rmdir DIRECTORY ...",
  chmod:
    "chmod — change virtual permission bits. Usage: chmod MODE FILE ...; numeric modes (755, 644) and symbolic modes (u+x, go-w, a=r) are supported.",
  chown:
    "chown — change virtual ownership (root only). Usage: chown [USER][:GROUP] PATH ...",
  chgrp: "chgrp — change virtual group ownership. Usage: chgrp GROUP PATH ...",
  ln: "ln — create links. Usage: ln [-s] [-t DIR] TARGET LINK_NAME. Hard links share a simulated inode and symbolic links store a path.",
  find: "find — walk the virtual filesystem. Supported predicates: -name PATTERN, -type f|d|l, -maxdepth N.",
  stat: "stat — display virtual file metadata. Usage: stat PATH ...",
  wc: "wc — count lines, words and bytes. Options: -l, -w, -c.",
  head: "head — print the first lines. Usage: head [-n N] [FILE ...]",
  tail: "tail — print the last lines. Usage: tail [-n N] [FILE ...]",
  source:
    "source — execute simple supported shell commands from a virtual file in the current shell context. Usage: source FILE",
  bash: "bash — invoke the supported Bash-like interpreter. Usage: bash [-c COMMAND] [FILE]. Advanced Bash syntax is not implemented.",
  alias: "alias — define or display aliases. Usage: alias [NAME='VALUE' ...]",
  export:
    "export — mark shell variables for command environments. Usage: export NAME=VALUE or export NAME",
  unset: "unset — remove shell variables or aliases. Usage: unset NAME ...",
  set: "set — display variables or set supported options/positional parameters. Supports set -- ARG..., set -e/+e, set -u/+u, and set -o/+o errexit|nounset.",
  sudo: "sudo — run a supported command as simulated root. Members of the simulated sudo group must enter their local simulation password. This is not device authentication.",
  su: "su — switch to a simulated user. Usage: su [USER] or su -c 'COMMAND' [USER]. A local simulation password is requested.",
  useradd:
    "useradd — create a simulated account (root only). Supports -m, -u UID, -g GROUP, -G GROUPS, -s SHELL.",
  groupadd:
    "groupadd — create a simulated group (root only). Usage: groupadd [-f] [-r] [-g GID] GROUP. -f succeeds if the group already exists and selects an available GID if the requested GID is occupied.",
  passwd:
    "passwd — change a simulated account password. Passwords exist only in this exercise's local virtual database and provide no real security.",
  tar: "tar — create/list/extract a constrained virtual archive. This simulation stores a JSON archive in a virtual file; it is not a GNU tar binary format. Usage: tar -cf ARCHIVE PATH... | tar -tf ARCHIVE | tar -xf ARCHIVE [-C DIR].",
  scp: "scp — constrained local copy only. Remote user@host:path transfers are unsupported because no SSH service exists. Usage: scp SOURCE DEST.",
  vim: "vim — open the built-in basic text editor for a virtual file. Edit the text and choose Save or Cancel. This is not full Vim modal editing.",
  less: "less — display virtual file contents in the terminal scrollback (no interactive pager keys).",
  more: "more — display virtual file contents in the terminal scrollback (no interactive pager keys).",
  ls: "ls — list directory entries. Supports -l, -a/--all, -d, -R/--recursive, -h/--human-readable, -s/--size, -i/--inode, -1, and -F.",
  free: "free — display simulated memory totals. Supports -h/--human and -k/--kibi.",
  cal: "cal — display a calendar. Usage: cal [YEAR] or cal MONTH YEAR.",
  gzip: "gzip — constrained browser simulation using a private JSON-backed format (not interoperable with GNU gzip). Supports -k/--keep, -d/--decompress, -c/--stdout, -f/--force, -l/--list, and -v/--verbose.",
  gunzip:
    "gunzip — decompress files created by the ACS virtual gzip simulation. These are not standard gzip streams.",
  find: "find — search virtual paths. Supports -name/-iname, -type, -user/-group, -nouser/-nogroup, -size, -mtime/-mmin/-atime/-amin/-ctime/-cmin, -perm, -inum, -maxdepth, -print, -delete, -exec COMMAND {} \\;, and -o.",
  tar: "tar — virtual JSON-backed archive. Supports -c/-x/-t, -f, -v, -C, -P, -z/-j/-J as simulated format labels. It is not a GNU tar archive and compression flags do not create interoperable compressed files.",
  vim: "vim — lightweight Vim-style editor with Normal/Insert modes and :w, :wq, :q, :q!, :x, h/j/k/l, i/a/I/A/o/O, x, dd, yy, p/P, u, /search, n, and :%s/old/new/g.",
  command:
    "command — resolve or run a supported command. Usage: command -v NAME, command -V NAME, or command NAME [ARGS...].",
  logout: "logout — exit the current simulated shell (same as exit).",
  crontab:
    "crontab — edit or list a simulated per-user crontab. Supports -l, -r, -e, and -u USER.",
  kill: "kill — send a simulated signal to a small set of virtual processes. Usage: kill [-s SIGNAL] PID; kill -l lists signal names.",
  vimtutor: "vimtutor — show a short interactive-editor tutorial.",
};

function safeText(value) {
  return String(value ?? "");
}
function byteLength(value) {
  return new TextEncoder().encode(String(value)).length;
}

// Match the common Bash/GNU echo escape behavior only when -e is requested.
// In particular, the normal `echo "Hello World"` still appends exactly one
// newline, while `echo -e "Hello\nWorld"` interprets the escape sequence.
function decodeEchoEscapes(input) {
  let output = "";
  let suppressNewline = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch !== "\\" || i + 1 >= input.length) {
      output += ch;
      continue;
    }
    const next = input[++i];
    switch (next) {
      case "\\":
        output += "\\";
        break;
      case "a":
        output += "\x07";
        break;
      case "b":
        output += "\b";
        break;
      case "c":
        suppressNewline = true;
        i = input.length;
        break;
      case "e":
      case "E":
        output += "\x1b";
        break;
      case "f":
        output += "\f";
        break;
      case "n":
        output += "\n";
        break;
      case "r":
        output += "\r";
        break;
      case "t":
        output += "\t";
        break;
      case "v":
        output += "\v";
        break;
      case "0": {
        let digits = "";
        while (
          digits.length < 3 &&
          i + 1 < input.length &&
          /[0-7]/.test(input[i + 1])
        )
          digits += input[++i];
        output += String.fromCodePoint(digits ? parseInt(digits, 8) : 0);
        break;
      }
      case "x": {
        const match = input.slice(i + 1).match(/^[0-9a-fA-F]{1,2}/);
        if (match) {
          output += String.fromCodePoint(parseInt(match[0], 16));
          i += match[0].length;
        } else output += "\\x";
        break;
      }
      case "u":
      case "U": {
        const digitsExpected = next === "u" ? 4 : 8;
        const match = input
          .slice(i + 1)
          .match(new RegExp(`^[0-9a-fA-F]{1,${digitsExpected}}`));
        if (match) {
          const codePoint = parseInt(match[0], 16);
          output +=
            codePoint <= 0x10ffff
              ? String.fromCodePoint(codePoint)
              : "\\" + next + match[0];
          i += match[0].length;
        } else output += "\\" + next;
        break;
      }
      default:
        output += "\\" + next;
    }
  }
  return { text: output, suppressNewline };
}
// A small, explicit Bash-like printf implementation. It formats only known
// conversions and never evaluates student-provided format strings as code.
function formatPrintf(format, values) {
  const decodedFormat = decodeEchoEscapes(String(format ?? ""));
  const template = decodedFormat.text;
  const conversions = /%[-+ #0]*\d*(?:\.\d*)?[dibouxXscb]/.test(template);
  let argumentIndex = 0;
  let output = "";
  const renderOnce = () => {
    let rendered = "";
    for (let i = 0; i < template.length; i++) {
      if (template[i] !== "%") {
        rendered += template[i];
        continue;
      }
      if (template[i + 1] === "%") {
        rendered += "%";
        i++;
        continue;
      }
      const match = template
        .slice(i)
        .match(/^%([-+ #0]*)(\d{0,4})(?:\.(\d{0,4}))?([dibouxXscb])/);
      if (!match) {
        rendered += "%";
        continue;
      }
      i += match[0].length - 1;
      const [, flags, widthText, precisionText, conversion] = match;
      const raw = values[argumentIndex++];
      const width = widthText ? Number(widthText) : 0;
      const precision =
        precisionText === undefined ? null : Number(precisionText);
      let value = "";
      if (conversion === "s") {
        value = safeText(raw);
        if (precision !== null) value = [...value].slice(0, precision).join("");
      } else if (conversion === "b") {
        const decoded = decodeEchoEscapes(safeText(raw));
        value = decoded.text;
        if (decoded.suppressNewline) decodedFormat.suppressNewline = true;
        if (precision !== null) value = [...value].slice(0, precision).join("");
      } else if (conversion === "c") {
        value = [...safeText(raw)][0] || "\0";
      } else {
        const parsed = Number.parseInt(safeText(raw), 10);
        const number = Number.isFinite(parsed) ? parsed : 0;
        const radix =
          conversion === "o"
            ? 8
            : conversion === "x" || conversion === "X"
              ? 16
              : 10;
        const negative = number < 0 && conversion !== "u";
        let digits = Math.abs(number).toString(radix);
        if (conversion === "X") digits = digits.toUpperCase();
        if (precision !== null) digits = digits.padStart(precision, "0");
        const sign = negative
          ? "-"
          : flags.includes("+")
            ? "+"
            : flags.includes(" ")
              ? " "
              : "";
        const prefix =
          flags.includes("#") && number !== 0
            ? conversion === "o"
              ? "0"
              : conversion === "x"
                ? "0x"
                : conversion === "X"
                  ? "0X"
                  : ""
            : "";
        value = sign + prefix + digits;
      }
      if (width > value.length) {
        const padChar =
          flags.includes("0") &&
          !flags.includes("-") &&
          precision === null &&
          conversion !== "s" &&
          conversion !== "c"
            ? "0"
            : " ";
        const padding = padChar.repeat(Math.min(width - value.length, 4096));
        value = flags.includes("-") ? value + padding : padding + value;
      }
      rendered += value;
      if (decodedFormat.suppressNewline) break;
    }
    return rendered;
  };
  do {
    const before = argumentIndex;
    output += renderOnce();
    if (
      !conversions ||
      argumentIndex >= values.length ||
      argumentIndex === before ||
      decodedFormat.suppressNewline
    )
      break;
  } while (argumentIndex < values.length);
  return output;
}

function cleanName(value) {
  const name = String(value ?? "");
  if (
    !name ||
    name === "." ||
    name === ".." ||
    name.includes("/") ||
    name.includes("\0")
  ) {
    throw new Error(`Invalid file name: ${name || "(empty)"}`);
  }
  return name;
}
function splitPath(path) {
  return String(path).split("/").filter(Boolean);
}
function modeString(mode, type) {
  const kind = type === "directory" ? "d" : type === "symlink" ? "l" : "-";
  let result = kind;
  for (const shift of [6, 3, 0]) {
    result += mode & (4 << shift) ? "r" : "-";
    result += mode & (2 << shift) ? "w" : "-";
    result += mode & (1 << shift) ? "x" : "-";
  }
  return result;
}
function modeOctal(mode) {
  return (mode & 0o7777).toString(8).padStart(3, "0");
}
function ownPlain(object) {
  return object && typeof object === "object" && !Array.isArray(object);
}

class VirtualFS {
  constructor() {
    this.nextId = 1;
    this.nodeCount = 0;
    this.totalBytes = 0;
    this.cwd = "/home/student";
    this.umask = 0o022;
    this.users = {
      root: {
        name: "root",
        uid: 0,
        gid: 0,
        comment: "root",
        home: "/root",
        shell: "/bin/bash",
        password: "root",
        locked: false,
        groups: [0],
        aging: {},
      },
      student: {
        name: "student",
        uid: 1000,
        gid: 1000,
        comment: "student",
        home: "/home/student",
        shell: "/bin/bash",
        password: "student",
        locked: false,
        groups: [1000, 27],
        aging: {},
      },
    };
    this.groups = {
      root: { name: "root", gid: 0, members: ["root"] },
      student: { name: "student", gid: 1000, members: ["student"] },
      sudo: { name: "sudo", gid: 27, members: ["student"] },
    };
    this.currentUid = 1000;
    this.root = this.makeNode("directory", "", null, 0, 0, 0o755);
    this.makeInitialTree();
  }
  makeNode(
    type,
    name,
    parent,
    uid,
    gid,
    mode,
    content = "",
    target = "",
    sharedInode = null,
  ) {
    const text = type === "file" ? String(content) : "";
    const inode =
      type === "file"
        ? sharedInode || {
            id: this.nextId++,
            uid,
            gid,
            mode,
            content: text,
            ctime: Date.now(),
            mtime: Date.now(),
            atime: Date.now(),
            linkCount: 1,
          }
        : null;
    const node = {
      id: inode ? inode.id : this.nextId++,
      type,
      name,
      parent,
      target: type === "symlink" ? String(target) : "",
      children: type === "directory" ? new Map() : null,
    };
    if (inode) {
      Object.defineProperties(node, {
        uid: {
          enumerable: true,
          get: () => inode.uid,
          set: (v) => {
            inode.uid = v;
          },
        },
        gid: {
          enumerable: true,
          get: () => inode.gid,
          set: (v) => {
            inode.gid = v;
          },
        },
        mode: {
          enumerable: true,
          get: () => inode.mode,
          set: (v) => {
            inode.mode = v;
          },
        },
        content: {
          enumerable: true,
          get: () => inode.content,
          set: (v) => {
            inode.content = String(v);
          },
        },
        ctime: {
          enumerable: true,
          get: () => inode.ctime,
          set: (v) => {
            inode.ctime = v;
          },
        },
        mtime: {
          enumerable: true,
          get: () => inode.mtime,
          set: (v) => {
            inode.mtime = v;
          },
        },
        atime: {
          enumerable: true,
          get: () => inode.atime,
          set: (v) => {
            inode.atime = v;
          },
        },
        linkCount: { enumerable: true, get: () => inode.linkCount },
      });
      node.inode = inode;
    } else {
      Object.assign(node, {
        uid,
        gid,
        mode,
        content: "",
        ctime: Date.now(),
        mtime: Date.now(),
        atime: Date.now(),
        linkCount: 1,
      });
    }
    const size = inode && !sharedInode ? byteLength(text) : 0;
    if (this.totalBytes + size > MAX_TOTAL_BYTES)
      throw new Error(
        `Virtual filesystem file-data limit (${MAX_TOTAL_BYTES} bytes) reached`,
      );
    this.nodeCount++;
    this.totalBytes += size;
    return node;
  }
  makeInitialTree() {
    for (const path of [
      "/bin",
      "/sbin",
      "/etc",
      "/etc/default",
      "/etc/skel",
      "/etc/ssh",
      "/etc/sudoers.d",
      "/home",
      "/home/root",
      "/home/student",
      "/root",
      "/tmp",
      "/usr",
      "/usr/bin",
      "/usr/sbin",
      "/usr/local",
      "/usr/local/bin",
      "/usr/local/sbin",
      "/usr/share",
      "/usr/share/man",
      "/usr/share/doc",
      "/var",
      "/var/log",
      "/var/spool",
      "/var/spool/cron",
      "/var/spool/cron/crontabs",
      "/run",
      "/dev",
      "/boot",
    ]) {
      this.mkdir(path, {
        uid: 0,
        gid: 0,
        mode: 0o755,
        parents: true,
        bootstrap: true,
      });
    }
    this.resolve("/tmp").node.mode = 0o1777;
    const studentHome = this.resolve("/home/student").node;
    studentHome.uid = 1000;
    studentHome.gid = 1000;
    this.writeFile("/etc/hostname", "acs-linux\n", {
      uid: 0,
      gid: 0,
      mode: 0o644,
      bootstrap: true,
    });
    this.writeFile("/etc/passwd", this.passwdText(), {
      uid: 0,
      gid: 0,
      mode: 0o644,
      bootstrap: true,
    });
    this.writeFile("/etc/group", this.groupText(), {
      uid: 0,
      gid: 0,
      mode: 0o644,
      bootstrap: true,
    });
    this.writeFile("/etc/shadow", this.shadowText(), {
      uid: 0,
      gid: 0,
      mode: 0o600,
      bootstrap: true,
    });
    this.writeFile(
      "/etc/login.defs",
      "UID_MIN 1000\nGID_MIN 1000\nPASS_MAX_DAYS 90\nPASS_MIN_DAYS 0\nPASS_WARN_AGE 7\n",
      { uid: 0, gid: 0, mode: 0o644, bootstrap: true },
    );
    this.writeFile(
      "/etc/default/useradd",
      "SHELL=/bin/bash\nCREATE_MAIL_SPOOL=no\n",
      { uid: 0, gid: 0, mode: 0o644, bootstrap: true },
    );
    this.writeFile(
      "/etc/ssh/sshd_config",
      "# Simulated SSH configuration\nPermitRootLogin no\n",
      { uid: 0, gid: 0, mode: 0o600, bootstrap: true },
    );
    this.writeFile(
      "/etc/sudoers",
      "# Simulated sudo policy for this exercise\n%sudo ALL=(ALL) ALL\n",
      { uid: 0, gid: 0, mode: 0o440, bootstrap: true },
    );
    this.writeFile("/dev/null", "", {
      uid: 0,
      gid: 0,
      mode: 0o666,
      bootstrap: true,
    });
    this.writeFile("/var/log/auth.log", "", {
      uid: 0,
      gid: 0,
      mode: 0o600,
      bootstrap: true,
    });
    this.writeFile("/var/log/secure", "", {
      uid: 0,
      gid: 0,
      mode: 0o600,
      bootstrap: true,
    });
    this.writeFile("/etc/skel/.bashrc", "# Default Bash configuration\n", {
      uid: 0,
      gid: 0,
      mode: 0o644,
      bootstrap: true,
    });
    this.writeFile("/etc/skel/.bash_profile", "# Default login profile\n", {
      uid: 0,
      gid: 0,
      mode: 0o644,
      bootstrap: true,
    });
    this.writeFile("/home/student/.bashrc", "# Student Bash configuration\n", {
      uid: 1000,
      gid: 1000,
      mode: 0o644,
      bootstrap: true,
    });
    this.writeFile("/home/student/.bash_profile", "# Student login profile\n", {
      uid: 1000,
      gid: 1000,
      mode: 0o644,
      bootstrap: true,
    });
    this.writeFile("/root/.bashrc", "# Root Bash configuration\\n", {
      uid: 0,
      gid: 0,
      mode: 0o600,
      bootstrap: true,
    });
    this.writeFile("/root/.bash_profile", "# Root login profile\\n", {
      uid: 0,
      gid: 0,
      mode: 0o600,
      bootstrap: true,
    });
    this.writeFile("/home/student/.bash_history", "", {
      uid: 1000,
      gid: 1000,
      mode: 0o600,
      bootstrap: true,
    });
    this.writeFile(
      "/home/student/README.txt",
      "Welcome to ACS Practice's virtual Linux environment.\nThis is a safe, browser-only simulation.\nTry: pwd, ls -la, help\n",
      { uid: 1000, gid: 1000, mode: 0o644, bootstrap: true },
    );
    this.cwd = "/home/student";
  }
  getUserByUid(uid) {
    return Object.values(this.users).find((u) => u.uid === Number(uid)) || null;
  }
  getUser(nameOrUid) {
    if (nameOrUid === undefined || nameOrUid === null || nameOrUid === "")
      return null;
    return /^\d+$/.test(String(nameOrUid))
      ? this.getUserByUid(Number(nameOrUid))
      : this.users[String(nameOrUid)] || null;
  }
  getGroup(nameOrGid) {
    if (nameOrGid === undefined || nameOrGid === null || nameOrGid === "")
      return null;
    return /^\d+$/.test(String(nameOrGid))
      ? Object.values(this.groups).find((g) => g.gid === Number(nameOrGid)) ||
          null
      : this.groups[String(nameOrGid)] || null;
  }
  currentUser() {
    return (
      this.getUserByUid(this.currentUid) ||
      this.users.student ||
      this.users.root
    );
  }
  currentGroups() {
    const user = this.currentUser();
    return new Set([user.gid, ...(user.groups || [])]);
  }
  nodePath(node) {
    if (node === this.root) return "/";
    const parts = [];
    let current = node;
    while (current && current !== this.root) {
      parts.push(current.name);
      current = current.parent;
    }
    return "/" + parts.reverse().join("/");
  }
  can(node, bits, uid = this.currentUid) {
    if (uid === 0) {
      if (bits.includes("x") && node.type === "file" && !(node.mode & 0o111))
        return false;
      return true;
    }
    const user = this.getUserByUid(uid);
    if (!user) return false;
    let shift = 0;
    if (user.uid === node.uid) shift = 6;
    else if (new Set([user.gid, ...(user.groups || [])]).has(node.gid))
      shift = 3;
    for (const bit of bits) {
      const mask = bit === "r" ? 4 : bit === "w" ? 2 : 1;
      if (!((node.mode >> shift) & mask)) return false;
    }
    return true;
  }
  require(node, bits, path = this.nodePath(node)) {
    if (!this.can(node, bits)) {
      const label = bits
        .split("")
        .map((b) => ({ r: "read", w: "write", x: "search/execute" })[b])
        .join(" and ");
      throw new Error(`Permission denied: cannot ${label} '${path}'`);
    }
  }
  resolve(path, options = {}) {
    const input = safeText(path || ".");
    const followFinal = options.followFinal !== false;
    const missingFinal = options.missingFinal === true;
    const cwd = options.cwd || this.cwd;
    let stack = input.startsWith("/") ? [] : splitPath(cwd);
    let queue = splitPath(input);
    let links = 0;
    let node = this.root;
    const rebuild = () => {
      node = this.root;
      for (const name of stack) {
        if (node.type !== "directory")
          throw new Error(`Not a directory: '${this.nodePath(node)}'`);
        this.require(node, "x");
        const child = node.children.get(name);
        if (!child) throw new Error(`No such file or directory: '${name}'`);
        node = child;
      }
    };
    rebuild();
    while (queue.length) {
      const part = queue.shift();
      if (!part || part === ".") continue;
      if (part === "..") {
        stack.pop();
        rebuild();
        continue;
      }
      if (node.type !== "directory")
        throw new Error(`Not a directory: '${this.nodePath(node)}'`);
      this.require(node, "x");
      const child = node.children.get(part);
      const isFinal = queue.length === 0;
      if (!child) {
        if (missingFinal && isFinal)
          return {
            node: null,
            parent: node,
            name: part,
            path: "/" + [...stack, part].join("/"),
          };
        throw new Error(`No such file or directory: '${part}'`);
      }
      if (child.type === "symlink" && (followFinal || !isFinal)) {
        if (++links > 40) throw new Error("Too many levels of symbolic links");
        const target = child.target;
        const targetParts = splitPath(target);
        if (target.startsWith("/")) stack = [];
        queue = [...targetParts, ...queue];
        rebuild();
      } else {
        node = child;
        stack.push(part);
      }
    }
    if (node.type === "symlink" && followFinal) {
      if (++links > 40) throw new Error("Too many levels of symbolic links");
      return this.resolve(node.target, {
        ...options,
        cwd: node.parent ? this.nodePath(node.parent) : "/",
        followFinal: true,
      });
    }
    node.atime = Date.now();
    return {
      node,
      parent: node.parent,
      name: node.name,
      path: this.nodePath(node),
    };
  }
  resolveParent(path) {
    const raw = safeText(path);
    if (!raw || raw.endsWith("/"))
      throw new Error(`Invalid destination path: '${raw}'`);
    const parts = splitPath(raw);
    const name = cleanName(parts.pop());
    const parentPath =
      (raw.startsWith("/") ? "/" : this.cwd + "/") +
      (parts.length ? parts.join("/") : "");
    const parent = this.resolve(parentPath || ".").node;
    if (parent.type !== "directory")
      throw new Error(`Not a directory: '${parentPath}'`);
    return { parent, name };
  }
  ensureCapacity() {
    if (this.nodeCount >= MAX_NODES)
      throw new Error(`Virtual filesystem node limit (${MAX_NODES}) reached`);
  }
  mkdir(path, options = {}) {
    const {
      uid = this.currentUid,
      gid = null,
      mode = 0o777 & ~this.umask,
      parents = false,
      bootstrap = false,
    } = options;
    if (parents) {
      const parts = String(path).startsWith("/") ? [] : splitPath(this.cwd);
      for (const p of splitPath(path)) {
        if (p === ".") continue;
        if (p === "..") {
          parts.pop();
          continue;
        }
        const built = "/" + [...parts, p].join("/");
        try {
          const existing = this.resolve(built).node;
          if (existing.type !== "directory")
            throw new Error(`File exists and is not a directory: '${built}'`);
        } catch (error) {
          if (!String(error.message).startsWith("No such file or directory:"))
            throw error;
          this.mkdir(built, { uid, gid, mode, bootstrap });
        }
        parts.push(p);
      }
      return;
    }
    const { parent, name } = this.resolveParent(path);
    if (!bootstrap) this.require(parent, "wx");
    if (parent.children.has(name)) throw new Error(`File exists: '${path}'`);
    this.ensureCapacity();
    const inheritedGroup = Boolean(parent.mode & 0o2000);
    const nodeGid = inheritedGroup
      ? parent.gid
      : (gid ?? this.currentUser().gid);
    const nodeMode = (mode & 0o7777) | (inheritedGroup ? 0o2000 : 0);
    const node = this.makeNode(
      "directory",
      name,
      parent,
      uid,
      nodeGid,
      nodeMode,
    );
    parent.children.set(name, node);
    parent.mtime = Date.now();
  }
  readFile(path, options = {}) {
    const entry = this.resolve(path, {
      followFinal: options.followFinal !== false,
    }).node;
    if (entry.type === "directory")
      throw new Error(`Is a directory: '${path}'`);
    if (entry.type !== "file") throw new Error(`Not a regular file: '${path}'`);
    this.require(entry, "r", path);
    entry.atime = Date.now();
    return entry.content;
  }
  writeFile(path, content, options = {}) {
    const data = String(content ?? "");
    if (byteLength(data) > MAX_FILE_BYTES)
      throw new Error(
        `File exceeds the ${MAX_FILE_BYTES} byte virtual file limit`,
      );
    const {
      uid = this.currentUid,
      gid = this.currentUser().gid,
      mode = 0o666 & ~this.umask,
      append = false,
      bootstrap = false,
    } = options;
    let entry;
    try {
      entry = this.resolve(path).node;
    } catch (error) {
      if (!String(error.message).startsWith("No such file or directory:"))
        throw error;
      const { parent, name } = this.resolveParent(path);
      if (!bootstrap) this.require(parent, "wx");
      this.ensureCapacity();
      const nodeGid = parent.mode & 0o2000 ? parent.gid : gid;
      entry = this.makeNode(
        "file",
        name,
        parent,
        uid,
        nodeGid,
        mode & 0o777,
        "",
      );
      parent.children.set(name, entry);
      parent.mtime = Date.now();
    }
    if (entry.type !== "file") throw new Error(`Not a regular file: '${path}'`);
    if (!bootstrap) this.require(entry, "w", path);
    const next = append ? entry.content + data : data;
    const oldSize = byteLength(entry.content),
      nextSize = byteLength(next);
    if (nextSize > MAX_FILE_BYTES)
      throw new Error(
        `File exceeds the ${MAX_FILE_BYTES} byte virtual file limit`,
      );
    if (this.totalBytes - oldSize + nextSize > MAX_TOTAL_BYTES)
      throw new Error(
        `Virtual filesystem file-data limit (${MAX_TOTAL_BYTES} bytes) reached`,
      );
    this.totalBytes += nextSize - oldSize;
    entry.content = next;
    entry.mtime = Date.now();
    return entry;
  }
  touch(path) {
    try {
      const node = this.resolve(path).node;
      if (node.type !== "file")
        throw new Error(`Not a regular file: '${path}'`);
      this.require(node, "w", path);
      node.mtime = Date.now();
    } catch (error) {
      if (!String(error.message).startsWith("No such file or directory:"))
        throw error;
      this.writeFile(path, "");
    }
  }
  remove(path, options = {}) {
    const { recursive = false, directoryOnly = false, force = false } = options;
    let entry;
    try {
      entry = this.resolve(path, { followFinal: false }).node;
    } catch (error) {
      if (
        force &&
        String(error.message).startsWith("No such file or directory:")
      )
        return;
      throw error;
    }
    if (entry === this.root)
      throw new Error("Refusing to remove virtual root /");
    if (directoryOnly && entry.type !== "directory")
      throw new Error(`Not a directory: '${path}'`);
    if (entry.type === "directory" && entry.children.size && !recursive)
      throw new Error(`Directory not empty: '${path}'`);
    const parent = entry.parent;
    this.require(parent, "wx", this.nodePath(parent));
    if (
      parent.mode & 0o1000 &&
      this.currentUid !== 0 &&
      this.currentUid !== parent.uid &&
      this.currentUid !== entry.uid
    )
      throw new Error(
        `Operation not permitted: sticky directory protects '${path}'`,
      );
    const removed = [];
    const collect = (node) => {
      removed.push(node);
      if (node.type === "directory")
        for (const child of node.children.values()) collect(child);
    };
    collect(entry);
    this.nodeCount -= removed.length;
    for (const node of removed)
      if (node.type === "file" && node.inode) {
        node.inode.linkCount = Math.max(0, node.inode.linkCount - 1);
        if (node.inode.linkCount === 0)
          this.totalBytes -= byteLength(node.content);
      } else if (node.type === "file") {
        this.totalBytes -= byteLength(node.content);
      }
    parent.children.delete(entry.name);
    parent.mtime = Date.now();
  }
  rename(source, destination) {
    const src = this.resolve(source, { followFinal: false }).node;
    if (src === this.root) throw new Error("Cannot move virtual root /");
    const destInfo = (() => {
      try {
        return {
          existing: this.resolve(destination, { followFinal: false }).node,
          ...this.resolve(destination, { followFinal: false }),
        };
      } catch {
        return { ...this.resolveParent(destination), existing: null };
      }
    })();
    let destParent, destName;
    if (destInfo.existing?.type === "directory") {
      destParent = destInfo.existing;
      destName = src.name;
    } else if (destInfo.existing) {
      destParent = destInfo.existing.parent;
      destName = destInfo.existing.name;
    } else {
      destParent = destInfo.parent;
      destName = destInfo.name;
    }
    if (
      src.type === "directory" &&
      this.nodePath(destParent).startsWith(this.nodePath(src) + "/")
    )
      throw new Error("Cannot move a directory inside itself");
    this.require(src.parent, "wx", this.nodePath(src.parent));
    this.require(destParent, "wx", this.nodePath(destParent));
    if (
      src.parent.mode & 0o1000 &&
      this.currentUid !== 0 &&
      this.currentUid !== src.parent.uid &&
      this.currentUid !== src.uid
    )
      throw new Error(
        `Operation not permitted: sticky directory protects '${source}'`,
      );
    if (
      destParent.children.has(destName) &&
      destParent.children.get(destName) !== src
    ) {
      const replaced = destParent.children.get(destName);
      if (replaced.type === "directory" && replaced.children.size)
        throw new Error(`Directory not empty: '${destination}'`);
      if ((replaced.type === "directory") !== (src.type === "directory"))
        throw new Error("Cannot replace a file with a directory or vice versa");
      this.totalBytes -=
        replaced.type === "file" ? byteLength(replaced.content) : 0;
      this.nodeCount--;
      destParent.children.delete(destName);
    }
    src.parent.children.delete(src.name);
    src.name = destName;
    src.parent = destParent;
    src.mtime = Date.now();
    destParent.children.set(destName, src);
    destParent.mtime = Date.now();
  }
  copy(source, destination, options = {}) {
    const src = this.resolve(source).node;
    const { recursive = false, preserve = false } = options;
    if (src.type === "directory" && !recursive)
      throw new Error(`Omitting directory '${source}'; use -r`);
    let destParent, destName;
    try {
      const dest = this.resolve(destination, { followFinal: false }).node;
      if (dest.type === "directory") {
        destParent = dest;
        destName = src.name;
      } else {
        destParent = dest.parent;
        destName = dest.name;
      }
    } catch {
      ({ parent: destParent, name: destName } =
        this.resolveParent(destination));
    }
    this.require(destParent, "wx", this.nodePath(destParent));
    if (destParent.children.has(destName))
      throw new Error(
        `File exists: '${this.nodePath(destParent)}/${destName}'`,
      );
    const measure = (node) => {
      let nodes = 1,
        bytes = node.type === "file" ? byteLength(node.content) : 0;
      if (node.type === "directory")
        for (const child of node.children.values()) {
          const m = measure(child);
          nodes += m.nodes;
          bytes += m.bytes;
        }
      return { nodes, bytes };
    };
    const copiedSize = measure(src);
    if (this.nodeCount + copiedSize.nodes > MAX_NODES)
      throw new Error(`Virtual filesystem node limit (${MAX_NODES}) reached`);
    if (this.totalBytes + copiedSize.bytes > MAX_TOTAL_BYTES)
      throw new Error(
        `Virtual filesystem file-data limit (${MAX_TOTAL_BYTES} bytes) reached`,
      );
    const clone = (node, parent, name) => {
      this.ensureCapacity();
      const n = this.makeNode(
        node.type,
        name,
        parent,
        preserve ? node.uid : this.currentUid,
        preserve ? node.gid : this.currentUser().gid,
        preserve ? node.mode : node.mode & 0o777 & ~this.umask,
        node.content,
        node.target,
      );
      if (n.type === "directory")
        for (const child of node.children.values())
          n.children.set(child.name, clone(child, n, child.name));
      return n;
    };
    const copied = clone(src, destParent, destName);
    destParent.children.set(destName, copied);
    destParent.mtime = Date.now();
  }
  symlink(target, path, options = {}) {
    const { parent, name } = this.resolveParent(path);
    if (!options.bootstrap) this.require(parent, "wx", this.nodePath(parent));
    if (parent.children.has(name)) throw new Error(`File exists: '${path}'`);
    this.ensureCapacity();
    parent.children.set(
      name,
      this.makeNode(
        "symlink",
        name,
        parent,
        options.uid ?? this.currentUid,
        options.gid ?? this.currentUser().gid,
        0o777,
        "",
        target,
      ),
    );
    parent.mtime = Date.now();
  }
  hardlink(source, path) {
    const sourceNode = this.resolve(source, { followFinal: true }).node;
    if (sourceNode.type !== "file")
      throw new Error("hard links can only be created for regular files");
    const { parent, name } = this.resolveParent(path);
    this.require(parent, "wx", this.nodePath(parent));
    if (parent.children.has(name)) throw new Error(`File exists: '${path}'`);
    this.ensureCapacity();
    const linked = this.makeNode(
      "file",
      name,
      parent,
      sourceNode.uid,
      sourceNode.gid,
      sourceNode.mode,
      sourceNode.content,
      "",
      sourceNode.inode,
    );
    sourceNode.inode.linkCount++;
    parent.children.set(name, linked);
    parent.mtime = Date.now();
    return linked;
  }
  chmod(path, mode, recursive = false) {
    const node = this.resolve(path, { followFinal: false }).node;
    if (this.currentUid !== 0 && this.currentUid !== node.uid)
      throw new Error(`Operation not permitted: '${path}'`);
    node.mode = mode & 0o7777;
    node.mtime = Date.now();
    if (recursive && node.type === "directory")
      for (const child of node.children.values())
        this.chmod(this.nodePath(child), mode, true);
  }
  chown(path, uid, gid, groupOnly = false) {
    const node = this.resolve(path, { followFinal: false }).node;
    if (this.currentUid !== 0)
      throw new Error(`Operation not permitted: '${path}'`);
    if (!groupOnly && uid !== undefined && uid !== null) node.uid = uid;
    if (gid !== undefined && gid !== null) node.gid = gid;
    node.mtime = Date.now();
  }
  chgrp(path, gid) {
    const node = this.resolve(path, { followFinal: false }).node;
    if (
      this.currentUid !== 0 &&
      (this.currentUid !== node.uid || !this.currentGroups().has(Number(gid)))
    )
      throw new Error(`Operation not permitted: '${path}'`);
    node.gid = Number(gid);
    node.mtime = Date.now();
  }
  list(path = ".", options = {}) {
    const { followFinal = true } = options;
    const node = this.resolve(path, { followFinal }).node;
    if (node.type !== "directory") return [node];
    this.require(node, "r", path);
    return [...node.children.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }
  treeWalk(start = "/", maxDepth = Infinity) {
    const root = this.resolve(start, { followFinal: false }).node;
    const rows = [];
    const walk = (node, depth) => {
      rows.push({ node, depth });
      if (
        node.type === "directory" &&
        depth < maxDepth &&
        this.can(node, "rx")
      ) {
        for (const child of [...node.children.values()].sort((a, b) =>
          a.name.localeCompare(b.name),
        ))
          walk(child, depth + 1);
      }
    };
    walk(root, 0);
    return rows;
  }
  passwdText() {
    return (
      Object.values(this.users)
        .sort((a, b) => a.uid - b.uid)
        .map(
          (u) =>
            `${u.name}:x:${u.uid}:${u.gid}:${u.comment || u.name}:${u.home}:${u.shell}`,
        )
        .join("\n") + "\n"
    );
  }
  groupText() {
    return (
      Object.values(this.groups)
        .sort((a, b) => a.gid - b.gid)
        .map((g) => `${g.name}:x:${g.gid}:${g.members.join(",")}`)
        .join("\n") + "\n"
    );
  }
  shadowText() {
    return (
      Object.values(this.users)
        .sort((a, b) => a.uid - b.uid)
        .map(
          (u) =>
            `${u.name}:${u.locked ? "!" : "$SIMULATED$"}:${Math.floor(Date.now() / 86400000)}:${u.aging.min ?? 0}:${u.aging.max ?? 90}:${u.aging.warn ?? 7}:${u.aging.inactive ?? ""}:${u.aging.expire ?? ""}:`,
        )
        .join("\n") + "\n"
    );
  }
  removeAccountHomeIfRequested(user, recursive) {
    if (!recursive) return;
    try {
      this.remove(user.home, { recursive: true, force: true });
    } catch {}
  }
  refreshAccountFiles() {
    this.writeFile("/etc/passwd", this.passwdText(), {
      uid: 0,
      gid: 0,
      bootstrap: true,
    });
    this.writeFile("/etc/group", this.groupText(), {
      uid: 0,
      gid: 0,
      bootstrap: true,
    });
    this.writeFile("/etc/shadow", this.shadowText(), {
      uid: 0,
      gid: 0,
      mode: 0o600,
      bootstrap: true,
    });
  }
  serializeNode(node) {
    return {
      id: node.id,
      type: node.type,
      name: node.name,
      uid: node.uid,
      gid: node.gid,
      mode: node.mode,
      content: node.type === "file" ? node.content : undefined,
      target: node.type === "symlink" ? node.target : undefined,
      linkCount: node.type === "file" ? node.linkCount : 1,
      ctime: node.ctime,
      mtime: node.mtime,
      atime: node.atime,
      children:
        node.type === "directory"
          ? [...node.children.values()].map((child) =>
              this.serializeNode(child),
            )
          : undefined,
    };
  }
  serialize() {
    return {
      version: TERMINAL_VERSION,
      nextId: this.nextId,
      cwd: this.cwd,
      umask: this.umask,
      currentUid: this.currentUid,
      users: this.users,
      groups: this.groups,
      root: this.serializeNode(this.root),
    };
  }
  static restore(data) {
    if (
      !ownPlain(data) ||
      data.version !== TERMINAL_VERSION ||
      !ownPlain(data.root) ||
      !ownPlain(data.users) ||
      !ownPlain(data.groups)
    )
      throw new Error(
        "Saved terminal data has an unsupported or invalid format",
      );
    const seenUids = new Set();
    for (const [name, user] of Object.entries(data.users)) {
      if (
        !ownPlain(user) ||
        user.name !== name ||
        !/^[a-z_][a-z0-9_-]*[$]?$/.test(name) ||
        !Number.isInteger(user.uid) ||
        user.uid < 0 ||
        seenUids.has(user.uid) ||
        !Number.isInteger(user.gid) ||
        user.gid < 0 ||
        typeof user.home !== "string" ||
        !user.home.startsWith("/") ||
        typeof user.shell !== "string" ||
        typeof user.password !== "string" ||
        !Array.isArray(user.groups) ||
        user.groups.some((gid) => !Number.isInteger(gid) || gid < 0)
      )
        throw new Error("Saved terminal account database is invalid");
      seenUids.add(user.uid);
    }
    const seenGids = new Set();
    for (const [name, group] of Object.entries(data.groups)) {
      if (
        !ownPlain(group) ||
        group.name !== name ||
        !/^[a-z_][a-z0-9_-]*[$]?$/.test(name) ||
        !Number.isInteger(group.gid) ||
        group.gid < 0 ||
        seenGids.has(group.gid) ||
        !Array.isArray(group.members) ||
        group.members.some((member) => typeof member !== "string")
      )
        throw new Error("Saved terminal group database is invalid");
      seenGids.add(group.gid);
    }
    if (!seenUids.has(0) || !data.users.root || data.users.root.uid !== 0)
      throw new Error("Saved terminal root account is missing");
    for (const user of Object.values(data.users)) {
      if (
        !seenGids.has(user.gid) ||
        user.groups.some((gid) => !seenGids.has(gid))
      )
        throw new Error("Saved terminal account refers to an unknown group");
    }
    const fs = Object.create(VirtualFS.prototype);
    fs.nodeCount = 0;
    fs.totalBytes = 0;
    fs.nextId =
      Number.isInteger(data.nextId) && data.nextId > 0 ? data.nextId : 1;
    fs.cwd =
      typeof data.cwd === "string" && data.cwd.startsWith("/")
        ? data.cwd
        : "/home/student";
    fs.umask = Number.isInteger(data.umask) ? data.umask & 0o777 : 0o022;
    fs.users = data.users;
    fs.groups = data.groups;
    fs.currentUid = Number.isInteger(data.currentUid) ? data.currentUid : 0;
    let count = 0;
    const seenNodeIds = new Set();
    const restoredInodes = new Map();
    const build = (raw, parent) => {
      if (
        !ownPlain(raw) ||
        !["directory", "file", "symlink"].includes(raw.type) ||
        typeof raw.name !== "string"
      )
        throw new Error("Saved terminal filesystem contains an invalid node");
      if (parent === null ? raw.name !== "" : cleanName(raw.name) !== raw.name)
        throw new Error("Saved terminal filesystem contains an invalid name");
      if (
        !Number.isInteger(raw.uid) ||
        raw.uid < 0 ||
        !Number.isInteger(raw.gid) ||
        raw.gid < 0 ||
        !Number.isInteger(raw.mode)
      )
        throw new Error("Saved terminal filesystem contains invalid metadata");
      const nodeId =
        Number.isInteger(raw.id) && raw.id > 0 ? raw.id : count + 1;
      if (seenNodeIds.has(nodeId))
        throw new Error(
          "Saved terminal filesystem contains duplicate node identities",
        );
      seenNodeIds.add(nodeId);
      if (++count > MAX_NODES)
        throw new Error("Saved terminal filesystem is too large");
      const node = {
        id: nodeId,
        type: raw.type,
        name: raw.name,
        parent,
        uid: raw.uid,
        gid: raw.gid,
        mode: Number(raw.mode) & 0o7777,
        content: raw.type === "file" ? safeText(raw.content) : "",
        target: raw.type === "symlink" ? safeText(raw.target) : "",
        children: raw.type === "directory" ? new Map() : null,
        ctime: Number(raw.ctime) || Date.now(),
        mtime: Number(raw.mtime) || Date.now(),
        atime: Number(raw.atime) || Date.now(),
      };
      if (byteLength(node.content) > MAX_FILE_BYTES)
        throw new Error("Saved virtual file exceeds the size limit");
      if (node.type === "file") {
        fs.totalBytes += byteLength(node.content);
        if (fs.totalBytes > MAX_TOTAL_BYTES)
          throw new Error(
            "Saved virtual filesystem exceeds the total file-data limit",
          );
      }
      if (node.type === "directory") {
        if (!Array.isArray(raw.children))
          throw new Error("Saved directory has invalid children");
        for (const childRaw of raw.children) {
          const child = build(childRaw, node);
          if (node.children.has(child.name))
            throw new Error("Saved directory has duplicate entries");
          node.children.set(child.name, child);
        }
      }
      return node;
    };
    fs.root = build(data.root, null);
    fs.nodeCount = count;
    if (fs.root.type !== "directory" || fs.root.name !== "")
      throw new Error("Saved filesystem root is invalid");
    if (!fs.getUserByUid(fs.currentUid))
      fs.currentUid = fs.getUserByUid(1000) ? 1000 : 0;
    try {
      const cwdNode = fs.resolve(fs.cwd).node;
      if (cwdNode.type !== "directory") fs.cwd = fs.currentUser().home;
    } catch {
      fs.cwd = fs.currentUser().home;
    }
    return fs;
  }
}

function tokenize(input, shell) {
  const tokens = [];
  let word = "",
    quote = null,
    tokenStarted = false,
    wasQuoted = false;
  const pushWord = () => {
    if (tokenStarted)
      tokens.push({ type: "word", value: word, glob: !wasQuoted });
    word = "";
    tokenStarted = false;
    wasQuoted = false;
  };
  const pushOp = (op) => {
    pushWord();
    tokens.push({ type: "op", value: op });
  };
  const operators = [
    "2>&1",
    "2>>",
    "2>",
    "&>",
    "1>>",
    "1>",
    "&&",
    "||",
    ">>",
    ";",
    "|",
    "<",
    ">",
  ];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote === "'") {
      if (ch === "'") quote = null;
      else word += ch;
      continue;
    }
    if (quote === '"' && ch === '"') {
      quote = null;
      continue;
    }
    if (ch === "\\") {
      if (i + 1 >= input.length) {
        word += "\\";
        tokenStarted = true;
        continue;
      }
      const next = input[++i];
      if (next === "\n") continue;
      if (quote === '"' && !["\\", '"', "$", "`"].includes(next))
        word += "\\" + next;
      else word += next;
      tokenStarted = true;
      continue;
    }
    if (!quote && (ch === "'" || ch === '"')) {
      quote = ch;
      tokenStarted = true;
      wasQuoted = true;
      continue;
    }
    if (quote !== "'" && ch === "$") {
      const match = input
        .slice(i)
        .match(
          /^\$(?:\{(?:[A-Za-z_][A-Za-z0-9_]*|\d+)\}|[A-Za-z_][A-Za-z0-9_]*|\d+|[?$#@*])/,
        );
      if (match) {
        const key = match[0].startsWith("${")
          ? match[0].slice(2, -1)
          : match[0].slice(1);
        word += `\uE000${key}\uE001`;
        i += match[0].length - 1;
        tokenStarted = true;
        continue;
      }
      if (input[i + 1] === "{")
        throw new Error(
          "Unsupported parameter expansion; use $NAME or ${NAME}",
        );
    }
    if (!quote && ch === "#") {
      // A comment starts only at the beginning of a shell word and ends at the line.
      if (!tokenStarted) {
        while (i + 1 < input.length && input[i + 1] !== "\n") i++;
        continue;
      }
    }
    if (!quote && ch === "\n") {
      pushWord();
      if (tokens.at(-1)?.value !== ";") tokens.push({ type: "op", value: ";" });
      continue;
    }
    if (!quote && /\s/.test(ch)) {
      pushWord();
      continue;
    }
    if (!quote) {
      const operator = operators.find((op) => input.startsWith(op, i));
      if (operator) {
        pushOp(operator);
        i += operator.length - 1;
        continue;
      }
      if (ch === "&")
        throw new Error(
          "Unsupported shell syntax: background jobs are not implemented",
        );
    }
    word += ch;
    tokenStarted = true;
  }
  if (quote) throw new Error("Unterminated quoted string");
  pushWord();
  while (tokens[0]?.type === "op" && tokens[0].value === ";") tokens.shift();
  while (tokens.at(-1)?.type === "op" && tokens.at(-1).value === ";")
    tokens.pop();
  return tokens;
}

function expandBraceWord(word, limit = 256) {
  let values = [String(word)],
    changed = true,
    rounds = 0;
  while (changed && rounds++ < 12) {
    changed = false;
    const next = [];
    for (const value of values) {
      let quote = null,
        escaped = false,
        start = -1,
        depth = 0,
        end = -1;
      for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (quote) {
          if (ch === quote) quote = null;
          continue;
        }
        if (ch === "'" || ch === '"') {
          quote = ch;
          continue;
        }
        if (ch === "{") {
          if (depth++ === 0) start = i;
        } else if (ch === "}" && depth) {
          if (--depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (start < 0 || end < 0) {
        next.push(value);
        continue;
      }
      const body = value.slice(start + 1, end);
      let alternatives = [];
      const range = body.match(/^(-?\d+)\.\.(-?\d+)(?:\.\.(-?\d+))?$/);
      const alpha = body.match(/^([a-zA-Z])\.\.([a-zA-Z])(?:\.\.(-?\d+))?$/);
      if (range) {
        const from = Number(range[1]),
          to = Number(range[2]);
        const stride = Math.abs(Number(range[3] || 1)) * (from <= to ? 1 : -1);
        if (!stride) {
          next.push(value);
          continue;
        }
        for (
          let n = from, count = 0;
          (stride > 0 ? n <= to : n >= to) && count < limit;
          n += stride, count++
        )
          alternatives.push(String(n));
      } else if (alpha) {
        const from = alpha[1].charCodeAt(0),
          to = alpha[2].charCodeAt(0);
        const stride = Math.abs(Number(alpha[3] || 1)) * (from <= to ? 1 : -1);
        if (!stride) {
          next.push(value);
          continue;
        }
        for (
          let n = from, count = 0;
          (stride > 0 ? n <= to : n >= to) && count < limit;
          n += stride, count++
        )
          alternatives.push(String.fromCharCode(n));
      } else if (body.includes(",")) {
        let inner = 0,
          splitAt = 0;
        for (let k = 0; k < body.length; k++) {
          if (body[k] === "{") inner++;
          else if (body[k] === "}") inner--;
          else if (body[k] === "," && inner === 0) {
            alternatives.push(body.slice(splitAt, k));
            splitAt = k + 1;
          }
        }
        alternatives.push(body.slice(splitAt));
      }
      if (alternatives.length < 2) {
        next.push(value);
        continue;
      }
      changed = true;
      for (const alt of alternatives) {
        next.push(value.slice(0, start) + alt + value.slice(end + 1));
        if (next.length > limit)
          throw new Error(`brace expansion exceeded ${limit} words`);
      }
    }
    values = next;
    if (values.length > limit)
      throw new Error(`brace expansion exceeded ${limit} words`);
  }
  return values;
}

function expandBraceExpressions(source, limit = 256) {
  let results = [String(source)];
  const findBrace = (text) => {
    let quote = null,
      escaped = false,
      start = -1,
      depth = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (quote) {
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === "'" || ch === '"') {
        quote = ch;
        continue;
      }
      if (ch === "{") {
        if (depth++ === 0) start = i;
      } else if (ch === "}" && depth) {
        depth--;
        if (depth === 0) {
          const body = text.slice(start + 1, i);
          if (
            body.includes(",") ||
            /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(body) ||
            /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(body)
          )
            return { start, end: i, body };
        }
      }
    }
    return null;
  };
  let changed = true,
    rounds = 0;
  while (changed && rounds++ < 12) {
    changed = false;
    const next = [];
    for (const item of results) {
      const match = findBrace(item);
      if (!match) {
        next.push(item);
        continue;
      }
      let alternatives = [];
      const range = match.body.match(/^(-?\d+)\.\.(-?\d+)(?:\.\.(-?\d+))?$/);
      const alpha = match.body.match(
        /^([a-zA-Z])\.\.([a-zA-Z])(?:\.\.(-?\d+))?$/,
      );
      if (range) {
        const from = Number(range[1]),
          to = Number(range[2]),
          step = Math.abs(Number(range[3] || 1)) * (from <= to ? 1 : -1);
        for (
          let n = from, count = 0;
          (step > 0 ? n <= to : n >= to) && count < 128;
          n += step, count++
        )
          alternatives.push(String(n));
      } else if (alpha) {
        const from = alpha[1].charCodeAt(0),
          to = alpha[2].charCodeAt(0),
          step = Math.abs(Number(alpha[3] || 1)) * (from <= to ? 1 : -1);
        for (
          let n = from, count = 0;
          (step > 0 ? n <= to : n >= to) && count < 128;
          n += step, count++
        )
          alternatives.push(String.fromCharCode(n));
      } else {
        let depth = 0,
          start = 0;
        for (let i = 0; i < match.body.length; i++) {
          if (match.body[i] === "{") depth++;
          else if (match.body[i] === "}") depth--;
          else if (match.body[i] === "," && depth === 0) {
            alternatives.push(match.body.slice(start, i));
            start = i + 1;
          }
        }
        alternatives.push(match.body.slice(start));
      }
      if (alternatives.length <= 1) {
        next.push(item);
        continue;
      }
      changed = true;
      for (const alt of alternatives) {
        next.push(item.slice(0, match.start) + alt + item.slice(match.end + 1));
        if (next.length + results.length > limit)
          throw new Error("brace expansion produced too many words");
      }
    }
    results = next;
  }
  return results.join(" ");
}

function globToRegExp(pattern, insensitive = false) {
  let out = "^";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*") out += ".*";
    else if (ch === "?") out += ".";
    else if (ch === "[") {
      if (pattern.startsWith("[[:", i)) {
        const end = pattern.indexOf(":]]", i + 3);
        if (end >= 0) {
          const name = pattern.slice(i + 3, end);
          const classes = {
            digit: "0-9",
            alpha: "A-Za-z",
            alnum: "A-Za-z0-9",
            upper: "A-Z",
            lower: "a-z",
            space: "\\s",
            xdigit: "A-Fa-f0-9",
          };
          if (classes[name]) {
            out += `[${classes[name]}]`;
            i = end + 2;
            continue;
          }
        }
      }
      const end = pattern.indexOf("]", i + 1);
      if (end < 0) {
        out += "\\[";
        continue;
      }
      let body = pattern.slice(i + 1, end);
      if (body.startsWith("!") || body.startsWith("^"))
        body = "^" + body.slice(1);
      out += "[" + body.replace(/\\/g, "\\\\") + "]";
      i = end;
    } else {
      out += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  out += "$";
  return new RegExp(out, insensitive ? "i" : "");
}

function expandVirtualGlob(fs, pattern) {
  if (!/[*?[]/.test(pattern)) return [pattern];
  const absolute = pattern.startsWith("/");
  const segments = pattern
    .split("/")
    .filter((part, index) => !(index === 0 && part === ""));
  let candidates = [absolute ? "/" : ""];
  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      candidates = candidates.map((base) => {
        const full = base || fs.cwd;
        const parts = full.split("/").filter(Boolean);
        parts.pop();
        return (
          (absolute ? "/" : "") + parts.join("/") || (absolute ? "/" : ".")
        );
      });
      continue;
    }
    const isPattern = /[*?[]/.test(segment);
    const regex = isPattern ? globToRegExp(segment) : null;
    const next = [];
    for (const base of candidates) {
      let directory;
      try {
        directory = fs.resolve(base || ".").node;
      } catch {
        continue;
      }
      if (directory.type !== "directory") continue;
      for (const child of directory.children.values()) {
        if (child.name.startsWith(".") && !segment.startsWith(".")) continue;
        if (!regex || regex.test(child.name)) {
          const prefix =
            base === "/" ? "/" : base ? base.replace(/\/$/, "") + "/" : "";
          next.push(prefix + child.name);
        }
      }
    }
    candidates = next;
    if (!candidates.length) return [pattern];
  }
  return candidates.length ? candidates : [pattern];
}

function expandShellWord(value, shell) {
  return String(value).replace(/\uE000([^\uE001]*)\uE001/g, (_, key) => {
    if (key === "?") return String(shell.lastStatus);
    if (key === "$") return "1000";
    if (key === "#") return String(shell.positionals.length);
    if (key === "@" || key === "*") return shell.positionals.join(" ");
    if (/^\d+$/.test(key))
      return key === "0"
        ? safeText(shell.zero || "bash")
        : safeText(shell.positionals[Number(key) - 1]);
    if (shell.options.nounset && !(key in shell.env))
      throw new Error(`${key}: unbound variable`);
    return safeText(shell.env[key]);
  });
}

function expandShellPath(value, shell) {
  let result = expandShellWord(value, shell);
  if (result.startsWith("~")) {
    const match = result.match(/^~([^/]*)(.*)$/);
    if (match) {
      const home = match[1]
        ? shell.fs.getUser(match[1])?.home
        : shell.env.HOME || shell.user.home;
      if (home) result = home.replace(/\/$/, "") + match[2];
      else if (match[1]) throw new Error(`unknown user '${match[1]}'`);
    }
  }
  return result;
}

class Shell {
  constructor(fs, io) {
    this.fs = fs;
    this.io = io;
    this.env = {
      HOME: "/home/student",
      USER: "student",
      LOGNAME: "student",
      SHELL: "/bin/bash",
      PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      PS1: "\\u@\\h:\\w\\$ ",
      PWD: fs.cwd,
      OLDPWD: fs.cwd,
      HOSTNAME: "acs-linux",
      TERM: "xterm-256color",
      LANG: "C.UTF-8",
    };
    this.exported = new Set(Object.keys(this.env));
    this.aliases = new Map();
    this.history = [];
    this.commandRecords = [];
    this.lastStatus = 0;
    this.positionals = [];
    this.zero = "bash";
    this.options = { errexit: false, nounset: false };
    this.closed = false;
    this.runningSource = 0;
    this.userStack = [];
    this.groupStack = [];
    this.shellStack = [];
    this.contextStack = [];
  }
  get user() {
    return this.fs.currentUser();
  }
  prompt() {
    const user = this.user.name;
    const home = this.env.HOME;
    const cwd =
      this.fs.cwd === home
        ? "~"
        : this.fs.cwd.startsWith(home + "/")
          ? "~/" + this.fs.cwd.slice(home.length + 1)
          : this.fs.cwd;
    return `${user}@acs-linux:${cwd}${user === "root" ? "#" : "$"}`;
  }
  async expandCommandSubstitutions(source, depth = 0) {
    if (depth > 8)
      throw new Error("command substitution nesting limit reached");
    let output = "",
      quote = null;
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (ch === "\\" && i + 1 < source.length) {
        output += ch + source[++i];
        continue;
      }
      if (quote === "'") {
        output += ch;
        if (ch === "'") quote = null;
        continue;
      }
      if (quote === '"' && ch === '"') {
        quote = null;
        output += ch;
        continue;
      }
      if (!quote && (ch === "'" || ch === '"')) {
        quote = ch;
        output += ch;
        continue;
      }
      if (quote !== "'" && ch === "$" && source[i + 1] === "(") {
        let level = 1,
          innerQuote = null,
          inner = "",
          escaped = false,
          j = i + 2;
        for (; j < source.length; j++) {
          const c = source[j];
          if (escaped) {
            inner += c;
            escaped = false;
            continue;
          }
          if (c === "\\") {
            inner += c;
            escaped = true;
            continue;
          }
          if (innerQuote) {
            if (c === innerQuote) innerQuote = null;
            inner += c;
            continue;
          }
          if (c === "'" || c === '"') {
            innerQuote = c;
            inner += c;
            continue;
          }
          if (c === "(") {
            level++;
            inner += c;
            continue;
          }
          if (c === ")") {
            level--;
            if (!level) break;
            inner += c;
            continue;
          }
          inner += c;
        }
        if (level !== 0) throw new Error("Unterminated command substitution");
        const result = await this.executeLine(inner, {
          fromSource: true,
          allowClosed: true,
          substitutionDepth: depth + 1,
        });
        if (result.stderr)
          this.substitutionStderr =
            (this.substitutionStderr || "") + result.stderr;
        output += result.stdout.replace(/\n+$/, "");
        i = j;
        continue;
      }
      if (quote !== "'" && ch === "`") {
        let j = i + 1,
          inner = "";
        for (; j < source.length && source[j] !== "`"; j++) inner += source[j];
        if (j >= source.length)
          throw new Error("Unterminated backtick command substitution");
        const result = await this.executeLine(inner, {
          fromSource: true,
          allowClosed: true,
          substitutionDepth: depth + 1,
        });
        if (result.stderr)
          this.substitutionStderr =
            (this.substitutionStderr || "") + result.stderr;
        output += result.stdout.replace(/\n+$/, "");
        i = j;
        continue;
      }
      output += ch;
    }
    return output;
  }
  expandWordTokens(wordTokens) {
    const expanded = [];
    for (const token of wordTokens) {
      const value = expandShellWord(token.value, this);
      for (const braced of expandBraceWord(value)) {
        let pieceValue = braced;
        if (pieceValue.startsWith("~")) {
          const match = pieceValue.match(/^~([^/]*)(.*)$/);
          if (match) {
            const home = match[1]
              ? this.fs.getUser(match[1])?.home
              : this.env.HOME || this.user.home;
            if (home) pieceValue = home.replace(/\/$/, "") + match[2];
            else if (match[1]) throw new Error(`unknown user '${match[1]}'`);
          }
        }
        const split = token.glob
          ? pieceValue.split(/\s+/).filter(Boolean)
          : [pieceValue];
        for (const item of split) {
          if (!item && token.glob) continue;
          if (token.glob && /[*?[]/.test(item))
            expanded.push(...expandVirtualGlob(this.fs, item));
          else expanded.push(item);
        }
      }
    }
    return expanded;
  }
  async executeForLoop(source, options = {}) {
    const match = source
      .trim()
      .match(
        /^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([\s\S]*?)\s*;\s*do(?:\s+|\n)([\s\S]*?)\s*;?\s*done\s*$/,
      );
    if (!match) return null;
    const [, name, listSource, body] = match;
    const listTokens = tokenize(
      expandBraceExpressions(listSource),
      this,
    ).filter((token) => token.type === "word");
    const values = this.expandWordTokens(listTokens);
    if (values.length > 256)
      throw new Error("for loop iteration limit (256) exceeded");
    const hadPrevious = Object.hasOwn(this.env, name),
      previous = this.env[name];
    let stdout = "",
      stderr = "",
      status = 0;
    try {
      for (const value of values) {
        this.env[name] = value;
        const result = await this.executeLine(body, {
          fromSource: true,
          allowClosed: true,
          substitutionDepth: options.substitutionDepth || 0,
        });
        stdout += result.stdout;
        stderr += result.stderr;
        status = result.status;
        if (this.options.errexit && status !== 0) break;
      }
    } finally {
      if (hadPrevious) this.env[name] = previous;
      else delete this.env[name];
    }
    return { stdout, stderr, status };
  }
  expandHistory(source) {
    let out = "",
      quote = null,
      escaped = false,
      bracketPattern = false;
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\" && quote !== "'") {
        out += ch;
        escaped = true;
        continue;
      }
      if (quote === "'") {
        out += ch;
        if (ch === "'") quote = null;
        continue;
      }
      if (ch === '"' && quote === '"') {
        quote = null;
        out += ch;
        continue;
      }
      if (!quote && (ch === "'" || ch === '"')) {
        quote = ch;
        out += ch;
        continue;
      }
      // In an unquoted glob bracket expression, [!abc] uses ! for negation,
      // not as a Bash history designator.
      if (!quote && ch === "[") bracketPattern = true;
      else if (!quote && ch === "]") bracketPattern = false;
      if (
        quote !== "'" &&
        !bracketPattern &&
        ch === "!" &&
        source[i + 1] === "!"
      ) {
        const previous =
          this.history.length > 1 ? this.history[this.history.length - 2] : "";
        if (!previous) throw new Error("event not found: !!");
        out += previous;
        i++;
        continue;
      }
      if (
        quote !== "'" &&
        !bracketPattern &&
        ch === "!" &&
        /\d/.test(source[i + 1] || "")
      ) {
        const m = source.slice(i + 1).match(/^\d+/),
          n = Number(m[0]);
        if (!Number.isInteger(n) || !this.history[n - 1])
          throw new Error(`event not found: !${n}`);
        out += this.history[n - 1];
        i += m[0].length;
        continue;
      }
      out += ch;
    }
    return out;
  }
  parseSimpleCommandGroup(source) {
    const text = String(source).trim();
    if (!text.startsWith("{")) return null;
    let quote = null,
      escaped = false,
      depth = 0,
      close = -1;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\" && quote !== "'") {
        escaped = true;
        continue;
      }
      if (quote) {
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === "'" || ch === '"') {
        quote = ch;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) {
        close = i;
        break;
      }
    }
    if (close < 0 || depth !== 0) return null;
    const body = text
      .slice(1, close)
      .trim()
      .replace(/(?:;|\n)\s*$/, "")
      .trim();
    const tail = text.slice(close + 1).trim();
    if (!body) return null;
    if (!tail) return { body, op: null, path: null, merge: false };
    const m = tail.match(/^(&>|>>|>|2>>|2>)\s*([^\s]+)(?:\s*(2>&1))?$/);
    if (!m) return null;
    return { body, op: m[1], path: m[2], merge: Boolean(m[3]) };
  }
  async executeLine(line, options = {}) {
    const source = String(line ?? "");
    const shouldRecord = !options.fromSource && Boolean(source.trim());
    const record = shouldRecord
      ? { command: source, output: "", outputCaptured: false, status: null }
      : null;
    if (record) {
      this.commandRecords.push(record);
      if (this.commandRecords.length > 500) this.commandRecords.shift();
    }
    try {
      const result = await this.executeLineCore(source, options);
      if (record) {
        record.output = (
          safeText(result?.stdout) + safeText(result?.stderr)
        ).slice(0, 8192);
        record.outputCaptured = true;
        record.status = Number.isInteger(result?.status) ? result.status : 0;
      }
      return result;
    } catch (error) {
      if (record) {
        record.output = `${safeText(error?.message || error)}\n`.slice(0, 8192);
        record.outputCaptured = true;
        record.status = 1;
      }
      throw error;
    }
  }
  async executeLineCore(line, options = {}) {
    const source = String(line ?? "");
    if (!options.fromSource && source.trim()) {
      this.history.push(source);
      if (this.history.length > 500) this.history.shift();
    }
    if (this.closed && !options.allowClosed)
      return {
        stdout: "",
        stderr: "Shell session is closed. Type bash to start a new shell.\n",
        status: 1,
      };
    let expandedSource;
    try {
      expandedSource = options.skipHistoryExpansion
        ? source
        : this.expandHistory(source);
      expandedSource = await this.expandCommandSubstitutions(
        expandedSource,
        options.substitutionDepth || 0,
      );
      const group = this.parseSimpleCommandGroup(expandedSource);
      if (group) {
        const grouped = await this.executeLine(group.body, {
          fromSource: true,
          allowClosed: true,
          substitutionDepth: options.substitutionDepth || 0,
        });
        let stdout = grouped.stdout,
          stderr = grouped.stderr;
        if (group.op) {
          const path = expandShellPath(group.path, this);
          if (
            group.op === "&>" ||
            ((group.op === ">" || group.op === ">>") && group.merge)
          ) {
            this.fs.writeFile(path, stdout + stderr, {
              append: group.op === ">>",
            });
            stdout = "";
            stderr = "";
          } else if (group.op === ">" || group.op === ">>") {
            this.fs.writeFile(path, stdout, { append: group.op === ">>" });
            stdout = "";
          } else if (group.op === "2>" || group.op === "2>>") {
            this.fs.writeFile(path, stderr, { append: group.op === "2>>" });
            stderr = "";
          }
        }
        this.lastStatus = grouped.status;
        this.env.PWD = this.fs.cwd;
        return { stdout, stderr, status: grouped.status };
      }
      const loopResult = await this.executeForLoop(expandedSource, options);
      if (loopResult) {
        this.lastStatus = loopResult.status;
        this.env.PWD = this.fs.cwd;
        const extra = this.substitutionStderr || "";
        this.substitutionStderr = "";
        return { ...loopResult, stderr: extra + loopResult.stderr };
      }
    } catch (error) {
      this.lastStatus = 2;
      const extra = this.substitutionStderr || "";
      this.substitutionStderr = "";
      return {
        stdout: "",
        stderr: extra + `bash: ${error.message}\n`,
        status: 2,
      };
    }
    let tokens;
    try {
      tokens = tokenize(expandedSource, this);
    } catch (error) {
      this.lastStatus = 2;
      return { stdout: "", stderr: `bash: ${error.message}\n`, status: 2 };
    }
    if (!tokens.length) {
      this.lastStatus = 0;
      return { stdout: "", stderr: "", status: 0 };
    }
    let index = 0,
      previousStatus = 0,
      connector = ";",
      stdout = "",
      stderr = "";
    const redirectOps = new Set([
      ">",
      ">>",
      "<",
      "1>",
      "1>>",
      "2>",
      "2>>",
      "&>",
      "2>&1",
    ]);
    const parseSimple = () => {
      const words = [],
        redirects = [];
      while (index < tokens.length) {
        const token = tokens[index];
        if (token.type === "op" && [";", "&&", "||", "|"].includes(token.value))
          break;
        if (token.type === "op" && redirectOps.has(token.value)) {
          const op = token.value;
          index++;
          if (op === "2>&1") {
            redirects.push({ op });
            continue;
          }
          const target = tokens[index++];
          if (!target || target.type !== "word")
            throw new Error(`Missing filename after '${op}'`);
          redirects.push({ op, path: target.value, glob: false });
        } else if (token.type === "word") {
          words.push(token);
          index++;
        } else {
          throw new Error(`Unexpected token '${token.value}'`);
        }
      }
      return { words, redirects };
    };
    while (index < tokens.length) {
      const shouldRun =
        connector === ";" ||
        (connector === "&&" && previousStatus === 0) ||
        (connector === "||" && previousStatus !== 0);
      const pipeline = [];
      try {
        pipeline.push(parseSimple());
        while (tokens[index]?.type === "op" && tokens[index].value === "|") {
          index++;
          pipeline.push(parseSimple());
        }
        if (
          !pipeline.length ||
          pipeline.some((part) => !part.words.length && !part.redirects.length)
        )
          throw new Error("Empty command in command list");
      } catch (error) {
        stderr += `bash: ${error.message}\n`;
        previousStatus = 2;
      }
      if (shouldRun && pipeline.length && pipeline[0].words.length) {
        try {
          const result = await this.runPipeline(pipeline);
          stdout += result.stdout;
          stderr += result.stderr;
          previousStatus = result.status;
          this.lastStatus = previousStatus;
          if (this.options.errexit && previousStatus !== 0) break;
        } catch (error) {
          stderr += `bash: ${error.message}\n`;
          previousStatus = 1;
        }
      }
      const op = tokens[index];
      if (!op) break;
      if (op.type !== "op" || ![";", "&&", "||"].includes(op.value)) {
        stderr += `bash: syntax error near '${op.value}'\n`;
        previousStatus = 2;
        break;
      }
      connector = op.value;
      index++;
    }
    this.lastStatus = previousStatus;
    this.env.PWD = this.fs.cwd;
    const substitutionErrors = this.substitutionStderr || "";
    this.substitutionStderr = "";
    return {
      stdout,
      stderr: substitutionErrors + stderr,
      status: previousStatus,
    };
  }
  async runPipeline(parts) {
    let stdin = "",
      last = { stdout: "", stderr: "", status: 0 };
    for (let p = 0; p < parts.length; p++) {
      const part = parts[p];
      let input = stdin;
      const stdoutDefault =
        p < parts.length - 1 ? { type: "pipe" } : { type: "terminal" };
      let stdoutSink = stdoutDefault,
        stderrSink = { type: "terminal" };
      for (const redir of part.redirects) {
        if (redir.op === "<")
          input = this.fs.readFile(expandShellPath(redir.path, this));
        else if (redir.op === "2>&1") stderrSink = stdoutSink;
        else {
          const path = expandShellPath(redir.path, this);
          const append =
            redir.op === ">>" || redir.op === "1>>" || redir.op === "2>>";
          const sink = {
            type: path === "/dev/null" ? "null" : "file",
            path,
            append,
          };
          if (redir.op === "2>" || redir.op === "2>>") stderrSink = sink;
          else if (redir.op === "&>") {
            stdoutSink = sink;
            stderrSink = sink;
          } else stdoutSink = sink;
        }
      }
      const commandTokens = part.words.slice();
      const temporaryAssignments = [];
      while (
        commandTokens.length &&
        /^[A-Za-z_][A-Za-z0-9_]*=/.test(commandTokens[0].value)
      ) {
        const raw = commandTokens.shift().value;
        const splitAt = raw.indexOf("=");
        const name = raw.slice(0, splitAt);
        const had = Object.hasOwn(this.env, name);
        const previous = this.env[name];
        const value = expandShellWord(raw.slice(splitAt + 1), this);
        if (commandTokens.length)
          temporaryAssignments.push({
            name,
            had,
            previous,
            exported: this.exported.has(name),
          });
        this.env[name] = value;
        if (commandTokens.length) this.exported.add(name);
      }
      if (!commandTokens.length) continue;
      const expandedWords = this.expandWordTokens(commandTokens);
      const command = this.expandAlias(expandedWords);
      if (!command.length) continue;
      try {
        last = await this.runCommand(command, input);
      } finally {
        for (const item of temporaryAssignments.reverse()) {
          if (item.had) this.env[item.name] = item.previous;
          else delete this.env[item.name];
          if (!item.exported) this.exported.delete(item.name);
        }
      }
      const writes = new Map();
      const route = (sink, value, stream) => {
        if (!value) return;
        if (sink.type === "terminal") {
          if (stream === "stdout")
            last.stdoutToTerminal = (last.stdoutToTerminal || "") + value;
          else last.stderrToTerminal = (last.stderrToTerminal || "") + value;
        } else if (sink.type === "pipe") {
          last.pipeOutput = (last.pipeOutput || "") + value;
        } else if (sink.type === "file") {
          const key = `${sink.path}\u0000${sink.append ? "a" : "w"}`;
          writes.set(key, {
            path: sink.path,
            append: sink.append,
            value: (writes.get(key)?.value || "") + value,
          });
        }
      };
      route(stdoutSink, last.stdout, "stdout");
      route(stderrSink, last.stderr, "stderr");
      for (const write of writes.values())
        this.fs.writeFile(write.path, write.value, { append: write.append });
      const pipeOut = last.pipeOutput || "";
      last.stdout = last.stdoutToTerminal || "";
      last.stderr = last.stderrToTerminal || "";
      delete last.stdoutToTerminal;
      delete last.stderrToTerminal;
      delete last.pipeOutput;
      if (p < parts.length - 1) stdin = pipeOut;
    }
    return last;
  }
  expandAlias(words) {
    let result = words.slice();
    for (let count = 0; count < 10 && this.aliases.has(result[0]); count++) {
      const expansion = tokenize(this.aliases.get(result[0]), this)
        .filter((t) => t.type === "word")
        .map((t) => t.value);
      result = [...expansion, ...result.slice(1)];
    }
    if (this.aliases.has(result[0]))
      throw new Error("Alias expansion loop detected");
    return result;
  }
  resolveVirtualExecutable(name) {
    const explicit = String(name).includes("/");
    const candidates = explicit
      ? [String(name)]
      : String(this.env.PATH || "")
          .split(":")
          .filter(Boolean)
          .map((dir) => `${dir.replace(/\/$/, "")}/${name}`);
    for (const candidate of candidates) {
      let node;
      try {
        node = this.fs.resolve(candidate).node;
      } catch {
        continue;
      }
      if (node.type !== "file") continue;
      try {
        this.fs.require(node, "x", candidate);
      } catch (error) {
        return { path: candidate, node, error };
      }
      return { path: candidate, node, error: null };
    }
    return null;
  }
  async runVirtualScript(program, args) {
    if (program.error)
      return {
        stdout: "",
        stderr: `${program.path}: ${program.error.message}\n`,
        status: 126,
      };
    const content = this.fs.readFile(program.path);
    const firstLine = content.split(/\r?\n/, 1)[0].trim();
    if (!/^#!\s*(?:\/bin\/bash|\/usr\/bin\/env\s+bash)\s*$/.test(firstLine))
      return {
        stdout: "",
        stderr: `${program.path}: cannot execute: unsupported or missing #!/bin/bash interpreter\n`,
        status: 126,
      };
    const child = new Shell(this.fs, this.io);
    const childEnv = {};
    for (const key of this.exported)
      if (Object.hasOwn(this.env, key)) childEnv[key] = this.env[key];
    child.env = { ...child.env, ...childEnv, PWD: this.fs.cwd };
    child.exported = new Set(Object.keys(child.env));
    child.zero = program.path;
    child.positionals = args.map(String);
    const script = content.replace(/^[^\n]*(?:\r?\n|$)/, "");
    return child.executeLine(script, { fromSource: true, allowClosed: true });
  }
  async runCommand(argv, stdin = "") {
    const [rawCommand, ...args] = argv;
    const commandName = String(rawCommand || "");
    const baseName = commandName.split("/").at(-1);
    const trustedCommandPath = [
      "/bin/",
      "/sbin/",
      "/usr/bin/",
      "/usr/sbin/",
      "/usr/local/bin/",
      "/usr/local/sbin/",
    ].some((prefix) => commandName.startsWith(prefix));
    if (
      !BUILTINS.has(commandName) &&
      !(trustedCommandPath && BUILTINS.has(baseName))
    ) {
      const program = this.resolveVirtualExecutable(commandName);
      if (!program)
        return {
          stdout: "",
          stderr: `${commandName}: command not found\n`,
          status: 127,
        };
      return this.runVirtualScript(program, args);
    }
    const command = BUILTINS.has(commandName) ? commandName : baseName;
    if (args.includes("--help"))
      return {
        stdout:
          (MANUALS[command] ||
            `${command}: supported virtual command. Run 'man ${command}'.`) +
          "\n",
        stderr: "",
        status: 0,
      };
    const io = {
      stdin,
      promptSecret: (label) => this.io.promptSecret(label),
      promptText: (label) =>
        this.io.promptText ? this.io.promptText(label) : Promise.resolve("n"),
      openEditor: (path, value, save) => this.io.openEditor(path, value, save),
      clear: () => this.io.clear(),
    };
    try {
      const result = await this.dispatch(command, args, io);
      return {
        stdout: safeText(result?.stdout),
        stderr: safeText(result?.stderr),
        status: Number.isInteger(result?.status) ? result.status : 0,
      };
    } catch (error) {
      return {
        stdout: "",
        stderr: `${command}: ${error?.message || String(error)}\n`,
        status: 1,
      };
    }
  }
  result(stdout = "", stderr = "", status = 0) {
    return { stdout, stderr, status };
  }
  needRoot(command) {
    if (this.fs.currentUid !== 0)
      throw new Error(
        `${command}: permission denied (simulated root privileges required; try sudo)`,
      );
  }
  async dispatch(command, args, io) {
    const fs = this.fs;
    const noArgs = (usage) => {
      throw new Error(`usage: ${usage}`);
    };
    const filesFrom = (paths) =>
      paths.length ? paths : noArgs(`${command} FILE...`);
    const splitFlags = (values) => {
      const flags = new Set(),
        rest = [];
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (value === "--") {
          rest.push(...values.slice(i + 1));
          break;
        }
        if (value.startsWith("--") && value.length > 2)
          flags.add(value.slice(2));
        else if (value.startsWith("-") && value !== "-")
          for (const c of value.slice(1)) flags.add(c);
        else rest.push(value);
      }
      return { flags, rest };
    };
    const requireFlag = (flags, allowed) => {
      const bad = [...flags].filter((f) => !allowed.includes(f));
      if (bad.length) throw new Error(`unsupported option -- '${bad[0]}'`);
    };
    const parseCount = (args, fallback = 10) => {
      const n = Number(
        args[1] === "-n"
          ? args[2]
          : args[0]?.startsWith("-n")
            ? args[0].slice(2)
            : fallback,
      );
      if (!Number.isInteger(n) || n < 0) throw new Error("invalid line count");
      return n;
    };
    const linesOf = (text) => String(text).split("\n");
    const groupNames = (user) =>
      [...new Set([user.gid, ...(user.groups || [])])].map(
        (gid) => fs.getGroup(gid)?.name || String(gid),
      );
    switch (command) {
      case "help": {
        const topic = args[0];
        if (!topic) return this.result(MANUALS.help + "\n");
        if (!SHELL_BUILTINS.has(topic))
          return this.result(
            `help: ${topic}: not a shell builtin; try 'man ${topic}'.\n`,
            "",
            1,
          );
        return this.result(
          (MANUALS[topic] || `${topic} is a shell builtin.`) + "\n",
        );
      }
      case "man":
      case "info":
      case "pinfo": {
        let section = null,
          keyword = null,
          searchTerm = null,
          fullText = false;
        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-k" || args[i] === "--apropos")
            searchTerm = args[++i] || "";
          else if (args[i] === "-K") {
            searchTerm = args[++i] || "";
            fullText = true;
          } else if (args[i] === "-s" || args[i] === "--section")
            section = args[++i] || null;
          else if (/^[1-9]$/.test(args[i]) && i + 1 < args.length && !keyword)
            section = args[i];
          else if (!args[i].startsWith("-")) keyword = args[i];
        }
        const infoPages = {
          coreutils:
            "GNU COREUTILS (LOCAL SUMMARY)\n\nThe core file, text and system utilities supported by this virtual terminal include: cat, cp, date, df, echo, env, head, id, ln, ls, mkdir, mv, pwd, rm, rmdir, sort, stat, tail, touch, tr, uname, uniq, wc, and whoami.\n\nText processing pipelines: cut, diff, nl, sort, tee, tr, uniq, and wc.\n\nThis is a concise bundled learning page, not the complete GNU Info manual. Run man COMMAND for command-specific supported options.",
          bash: "BASH (LOCAL SUMMARY)\n\nThe simulated Bash supports quoted words, variable expansion, export, aliases, history, brace expansion, filename globs, command substitution, for-in loops, pipes, redirection, and ;, &&, ||. Advanced process, job-control, trap and subshell features are not implemented.",
          sudo: "SUDO (LOCAL SUMMARY)\n\nThe terminal simulates users, groups, sudo policy, and privilege changes in its virtual filesystem. It never changes device accounts or grants real system privileges.",
          find: "FIND (LOCAL SUMMARY)\n\nThe virtual find supports common path, name, type, owner, group, size, time, permission, inode, print, exec, and delete predicates. Actions are confined to the virtual filesystem.",
          tar: "TAR (LOCAL SUMMARY)\n\nTar archives are stored in a private browser-simulation format. Create, list, and extract are supported inside the virtual filesystem; output is not a standard GNU tar binary.",
        };
        if (
          (command === "info" || command === "pinfo") &&
          keyword &&
          infoPages[keyword]
        )
          return this.result(infoPages[keyword] + "\\n");
        const sections = {
          passwd: ["5"],
          group: ["5"],
          shadow: ["5"],
          sudoers: ["5"],
          crontab: ["5"],
          printf: ["3"],
          kill: ["2"],
          fork: ["2"],
        };
        const filePages = {
          passwd:
            "PASSWD(5)\nThe /etc/passwd file contains one account per line. Fields are name:password:UID:GID:GECOS:home:shell. Password hashes are normally stored separately in /etc/shadow.",
          group:
            "GROUP(5)\nThe /etc/group file contains group records in the form name:password:GID:member-list. Primary group membership is stored in /etc/passwd; this member list is supplementary membership.",
          shadow:
            "SHADOW(5)\nThe simulated /etc/shadow file stores local password markers and password-aging data. It is not a real password database and provides no device security.",
          sudoers:
            "SUDOERS(5)\nThe simulated sudoers parser supports simple lines USER ALL=(ALL) ALL, %GROUP ALL=(ALL) ALL, optional NOPASSWD:, and command paths. Complex aliases, host groups, runas groups and tags are not implemented.",
          crontab:
            "CRONTAB(5)\nA crontab contains schedule lines. This environment stores crontab text only; it does not schedule background jobs.",
          printf:
            "PRINTF(1)\nThe shell printf builtin writes formatted text. Supported conversions include %s, %b, %c, %d, %i, %u, %o, %x, %X and %% with common width/precision forms.",
          kill: "KILL(1)\nThe simulated kill command can signal only listed virtual PIDs. It cannot signal browser or host processes.",
          fork: "FORK(2)\nProcess creation is not implemented: the virtual shell does not create operating-system processes.",
        };
        const entries = Object.entries(MANUALS).map(([name, body]) => ({
          name,
          section: "1",
          body,
        }));
        for (const [name, body] of Object.entries(filePages)) {
          for (const sec of sections[name] || ["5"])
            entries.push({ name, section: sec, body });
        }
        if (searchTerm !== null) {
          const query = String(searchTerm).toLowerCase();
          const found = entries.filter((entry) => {
            if (section && entry.section !== section) return false;
            const text = `${entry.name} ${entry.body}`.toLowerCase();
            return fullText
              ? text.includes(query)
              : `${entry.name} ${entry.body.split(" — ")[1] || ""}`
                  .toLowerCase()
                  .includes(query);
          });
          return this.result(
            found
              .map(
                (e) =>
                  `${e.name} (${e.section}) - ${e.body.split(" — ")[1]?.split(".")[0] || e.body.split("\n")[0]}`,
              )
              .join("\n") + (found.length ? "\n" : ""),
            "",
            found.length ? 0 : 1,
          );
        }
        if (!keyword)
          return this.result(
            "Available manual topics: " +
              [...new Set(entries.map((e) => e.name))].sort().join(" ") +
              "\n",
          );
        const available = entries.filter(
          (e) => e.name === keyword && (!section || e.section === section),
        );
        if (!available.length)
          return this.result(
            `No manual entry for ${keyword}${section ? ` in section ${section}` : ""}.\n`,
            "",
            1,
          );
        const page = available[0];
        return this.result(
          `${page.name}(${page.section})\n${"=".repeat(page.name.length + page.section.length + 2)}\n${page.body}\n`,
        );
      }
      case "apropos": {
        return this.dispatch("man", ["-k", args.join(" ")], io);
      }
      case "mandb":
        return this.result(
          "Updated the small built-in help index (no download required).\n",
        );
      case "clear":
        io.clear();
        return this.result();
      case "pwd":
        return this.result(fs.cwd + "\n");
      case "cd": {
        if (args.length > 1) throw new Error("cd: too many arguments");
        const destination =
          args[0] === "-" ? this.env.OLDPWD : args[0] || this.env.HOME;
        if (!destination) throw new Error("cd: OLDPWD not set");
        const old = fs.cwd;
        const target = fs.resolve(destination).node;
        if (target.type !== "directory")
          throw new Error(`${destination}: Not a directory`);
        fs.require(target, "x", destination);
        fs.cwd = fs.nodePath(target);
        this.env.OLDPWD = old;
        this.env.PWD = fs.cwd;
        return this.result(args[0] === "-" ? fs.cwd + "\n" : "");
      }
      case "ls": {
        const { flags, rest } = splitFlags(args);
        requireFlag(flags, "alRdhFsi1human-readableallrecursiveinode");
        const has = (short, long) => flags.has(short) || flags.has(long);
        const paths = rest.length ? rest : ["."];
        let output = "";
        const human = (size) =>
          size >= 1024 * 1024
            ? `${(size / 1048576).toFixed(1)}M`
            : size >= 1024
              ? `${(size / 1024).toFixed(1)}K`
              : String(size);
        const showOne = (node, name) => {
          const displayName =
            name +
            (has("F")
              ? node.type === "directory"
                ? "/"
                : node.type === "symlink"
                  ? "@"
                  : node.type === "file" && node.mode & 0o111
                    ? "*"
                    : ""
              : "");
          const size =
            node.type === "file"
              ? byteLength(node.content)
              : node.type === "symlink"
                ? byteLength(node.target)
                : node.children.size;
          const owner = fs.getUserByUid(node.uid)?.name || node.uid;
          const group = fs.getGroup(node.gid)?.name || node.gid;
          const date = new Date(node.mtime).toLocaleString();
          const suffix = node.type === "symlink" ? ` -> ${node.target}` : "";
          let prefix = "";
          if (has("i", "inode")) prefix += `${String(node.id).padStart(8)} `;
          if (has("s", "size"))
            prefix += `${String(Math.ceil(size / 1024)).padStart(4)} `;
          if (has("l"))
            prefix += `${modeString(node.mode, node.type)} ${String(node.type === "file" ? node.linkCount || 1 : node.type === "directory" ? node.children.size + 2 : 1).padStart(3)} ${owner} ${group} ${String(has("h", "human-readable") ? human(size) : size).padStart(7)} ${date} `;
          output += prefix + displayName + suffix + "\n";
        };
        const walk = (path, node, topLevel = false) => {
          if (node.type !== "directory" || has("d")) {
            showOne(node, path);
            return;
          }
          const entries = [...node.children.values()]
            .filter((child) => has("a", "all") || !child.name.startsWith("."))
            .sort((a, b) => a.name.localeCompare(b.name));
          if (has("a", "all")) {
            const parent = node.parent || node;
            entries.unshift({ ...node, name: "." }, { ...parent, name: ".." });
          }
          if (
            (paths.length > 1 || has("R", "recursive")) &&
            (topLevel || has("R", "recursive"))
          )
            output += `${path}:\n`;
          for (const child of entries) showOne(child, child.name);
          if (has("R", "recursive")) {
            for (const child of entries) {
              if (
                child.type === "directory" &&
                child.name !== "." &&
                child.name !== ".."
              ) {
                const childPath =
                  (path === "/" ? "" : path.replace(/\/+$/, "")) +
                  "/" +
                  child.name;
                output += "\n";
                walk(childPath, child, false);
              }
            }
          }
        };
        for (const path of paths) {
          const node = fs.resolve(path, { followFinal: !has("d") }).node;
          if (paths.length > 1 && node.type === "directory" && !has("d"))
            output += `${path}:\n`;
          walk(path, node, true);
        }
        return this.result(output);
      }
      case "mkdir": {
        const { flags, rest } = splitFlags(args);
        requireFlag(flags, "pvverbose");
        filesFrom(rest);
        let output = "";
        for (const path of rest) {
          fs.mkdir(path, { parents: flags.has("p") || flags.has("parents") });
          if (flags.has("v") || flags.has("verbose"))
            output += `mkdir: created directory '${path}'\n`;
        }
        return this.result(output);
      }
      case "touch": {
        const paths = args.filter((arg) => arg !== "--");
        for (const path of filesFrom(paths)) fs.touch(path);
        return this.result();
      }
      case "cat": {
        let number = false;
        const paths = [];
        for (const arg of args) {
          if (arg === "-n" || arg === "--number") number = true;
          else if (arg !== "--") paths.push(arg);
        }
        const files = paths.length ? paths : ["-"];
        let output = "";
        for (const path of files)
          output += path === "-" ? io.stdin : fs.readFile(path);
        if (number) {
          const rows = output.split(/(?<=\n)/);
          output = rows
            .map((row, index) =>
              row ? `${String(index + 1).padStart(6)}\t${row}` : "",
            )
            .join("");
        }
        return this.result(output);
      }
      case "printf": {
        if (!args.length) return this.result();
        return this.result(formatPrintf(args[0], args.slice(1)));
      }
      case "echo": {
        let noNewline = false;
        let interpretEscapes = false;
        let index = 0;
        // Support the common GNU/Bash options, including combined forms such
        // as -ne. Unknown leading options remain ordinary text, like echo.
        while (index < args.length) {
          const option = args[index];
          if (option === "--") {
            index++;
            break;
          }
          if (!/^-[neE]+$/.test(option)) break;
          for (const flag of option.slice(1)) {
            if (flag === "n") noNewline = true;
            else if (flag === "e") interpretEscapes = true;
            else if (flag === "E") interpretEscapes = false;
          }
          index++;
        }
        let text = args.slice(index).join(" ");
        let suppressNewline = false;
        if (interpretEscapes) {
          const decoded = decodeEchoEscapes(text);
          text = decoded.text;
          suppressNewline = decoded.suppressNewline;
        }
        return this.result(text + (noNewline || suppressNewline ? "" : "\n"));
      }
      case "cp": {
        const { flags, rest } = splitFlags(args);
        requireFlag(flags, "rfpRrecursivepreserveniforceinteractiveverbose");
        if (rest.length < 2) noArgs("cp [-r] [-p] SOURCE... DEST");
        const dest = rest.at(-1),
          sources = rest.slice(0, -1);
        let destinationIsDirectory = false;
        try {
          destinationIsDirectory = fs.resolve(dest).node.type === "directory";
        } catch (error) {
          if (!String(error.message).startsWith("No such file or directory:"))
            throw error;
        }
        if (sources.length > 1 && !destinationIsDirectory)
          throw new Error(
            "target must be a directory when copying multiple files",
          );
        let output = "";
        for (const source of sources) {
          const basename = source.split("/").filter(Boolean).at(-1);
          const target =
            sources.length > 1 || destinationIsDirectory
              ? dest.replace(/\/$/, "") + "/" + basename
              : dest;
          const sourceNode = fs.resolve(source).node;
          let existing = null;
          try {
            existing = fs.resolve(target, { followFinal: false }).node;
          } catch {}
          if (existing && existing === sourceNode)
            throw new Error(`'${source}' and '${target}' are the same file`);
          if (existing && flags.has("n")) continue;
          if (existing && flags.has("i")) {
            const answer = io.promptText
              ? await io.promptText(`overwrite '${target}'? [y/N] `)
              : "n";
            if (!/^y(es)?$/i.test(answer.trim())) continue;
          }
          if (existing) {
            if (existing.type !== sourceNode.type)
              throw new Error(
                `cannot overwrite '${target}' with a different file type`,
              );
            if (existing.type === "directory")
              throw new Error(
                `cannot overwrite directory '${target}' without removing it first`,
              );
            fs.remove(target, { force: true });
          }
          fs.copy(source, target, {
            recursive:
              flags.has("r") || flags.has("R") || flags.has("recursive"),
            preserve: flags.has("p") || flags.has("preserve"),
          });
          if (flags.has("v") || flags.has("verbose"))
            output += `copied '${source}' -> '${target}'\\n`;
        }
        return this.result(output);
      }
      case "mv": {
        const { flags, rest } = splitFlags(args);
        requireFlag(flags, "vverbose");
        if (rest.length < 2) noArgs("mv [-v] SOURCE... DEST");
        const dest = rest.at(-1),
          sources = rest.slice(0, -1);
        let destinationIsDirectory = false;
        try {
          destinationIsDirectory = fs.resolve(dest).node.type === "directory";
        } catch (error) {
          if (!String(error.message).startsWith("No such file or directory:"))
            throw error;
        }
        if (sources.length > 1 && !destinationIsDirectory)
          throw new Error(
            "target must be a directory when moving multiple files",
          );
        let output = "";
        for (const source of sources) {
          const target =
            sources.length > 1 || destinationIsDirectory
              ? dest.replace(/\/$/, "") +
                "/" +
                source.split("/").filter(Boolean).at(-1)
              : dest;
          fs.rename(source, target);
          if (flags.has("v") || flags.has("verbose"))
            output += `renamed '${source}' -> '${target}'\n`;
        }
        return this.result(output);
      }
      case "rm": {
        const { flags, rest } = splitFlags(args);
        requireFlag(flags, "rRfiforceinteractiveverbose");
        filesFrom(rest);
        let output = "";
        for (const path of rest) {
          if (flags.has("i") || flags.has("interactive")) {
            const answer = io.promptText
              ? await io.promptText(`remove '${path}'? [y/N] `)
              : "n";
            if (!/^y(es)?$/i.test(answer.trim())) {
              output += `not removed '${path}'\n`;
              continue;
            }
          }
          fs.remove(path, {
            recursive: flags.has("r") || flags.has("R"),
            force: flags.has("f") || flags.has("force"),
          });
          if (flags.has("v") || flags.has("verbose"))
            output += `removed '${path}'\n`;
        }
        return this.result(output);
      }
      case "rmdir":
        for (const path of filesFrom(args))
          fs.remove(path, { directoryOnly: true });
        return this.result();
      case "chmod": {
        const { flags, rest } = splitFlags(args);
        requireFlag(flags, "Rrecursive");
        if (rest.length < 2) noArgs("chmod [-R] MODE FILE...");
        const recursive = flags.has("R") || flags.has("recursive");
        for (const path of rest.slice(1)) {
          const rootNode = fs.resolve(path, { followFinal: false }).node;
          const targets =
            recursive && rootNode.type === "directory"
              ? fs.treeWalk(path).map((x) => x.node)
              : [rootNode];
          for (const node of targets) {
            const current = modeOctal(node.mode);
            const isDir = node.type === "directory";
            fs.chmod(fs.nodePath(node), parseMode(rest[0], current, isDir));
          }
        }
        return this.result();
      }
      case "chown":
      case "chgrp": {
        if (command === "chown") this.needRoot(command);
        const { flags, rest } = splitFlags(args);
        requireFlag(flags, "Rrecursive");
        if (rest.length < 2) noArgs(`${command} [-R] OWNER PATH...`);
        const spec = rest[0];
        let uid, gid;
        if (command === "chgrp") {
          const group = fs.getGroup(spec);
          if (!group) throw new Error(`invalid group: '${spec}'`);
          gid = group.gid;
        } else {
          const parts = spec.split(":");
          if (parts[0]) {
            const user = fs.getUser(parts[0]);
            if (!user) throw new Error(`invalid user: '${parts[0]}'`);
            uid = user.uid;
          }
          if (parts.length > 1 && parts[1]) {
            const group = fs.getGroup(parts[1]);
            if (!group) throw new Error(`invalid group: '${parts[1]}'`);
            gid = group.gid;
          }
        }
        for (const path of rest.slice(1)) {
          const node = fs.resolve(path, { followFinal: false }).node;
          const targets =
            flags.has("R") || flags.has("recursive")
              ? node.type === "directory"
                ? fs.treeWalk(path).map((x) => x.node)
                : [node]
              : [node];
          for (const target of targets) {
            if (command === "chgrp") fs.chgrp(fs.nodePath(target), gid);
            else fs.chown(fs.nodePath(target), uid, gid, false);
          }
        }
        return this.result();
      }
      case "ln": {
        let symbolic = false,
          targetDirectory = null;
        const rest = [];
        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-s" || args[i] === "--symbolic") symbolic = true;
          else if (args[i] === "-t" || args[i] === "--target-directory")
            targetDirectory = args[++i];
          else if (args[i] === "-f" || args[i] === "--force")
            throw new Error(
              "ln: -f overwrite is not implemented; remove the destination first",
            );
          else if (args[i] !== "--") rest.push(args[i]);
        }
        let sources, destination;
        if (targetDirectory) {
          sources = rest;
          destination = targetDirectory;
        } else {
          if (rest.length < 2)
            noArgs("ln [-s] [-t DIRECTORY] TARGET [LINK_NAME]");
          sources = rest.slice(0, -1);
          destination = rest.at(-1);
        }
        const destNode = (() => {
          try {
            return fs.resolve(destination).node;
          } catch {
            return null;
          }
        })();
        const isDir = Boolean(
          targetDirectory || (destNode && destNode.type === "directory"),
        );
        if (sources.length > 1 && !isDir)
          throw new Error(
            "ln: target must be a directory when linking multiple sources",
          );
        for (const source of sources) {
          const base = source.split("/").filter(Boolean).at(-1);
          const linkPath = isDir
            ? `${destination.replace(/\/$/, "")}/${base}`
            : destination;
          if (symbolic) fs.symlink(source, linkPath);
          else fs.hardlink(source, linkPath);
        }
        return this.result();
      }
      case "stat": {
        let format = null;
        const paths = [];
        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-c" || args[i] === "--format")
            format = args[++i] ?? "";
          else if (args[i] !== "--") paths.push(args[i]);
        }
        const names = filesFrom(paths);
        return this.result(
          names
            .map((path) => {
              const node = fs.resolve(path, { followFinal: false }).node;
              const owner = fs.getUserByUid(node.uid)?.name || node.uid,
                group = fs.getGroup(node.gid)?.name || node.gid;
              const size =
                node.type === "file"
                  ? byteLength(node.content)
                  : node.type === "symlink"
                    ? byteLength(node.target)
                    : node.children.size;
              const links = Number(node.linkCount || 1);
              if (format !== null) {
                const fields = {
                  i: String(node.id),
                  s: String(size),
                  h: String(links),
                  n: path,
                  a: modeOctal(node.mode),
                  A: modeString(node.mode, node.type),
                  U: owner,
                  G: group,
                  F: node.type,
                };
                return format.replace(/%%|%[a-zA-Z]/g, (token) =>
                  token === "%%" ? "%" : (fields[token[1]] ?? token),
                );
              }
              return `  File: ${path}\n  Size: ${size}\tType: ${node.type}\n  Links: ${links}\n  Access: (${modeOctal(node.mode)}/${modeString(node.mode, node.type)})  Uid: (${node.uid}/${owner})  Gid: (${node.gid}/${group})\n  Birth: ${new Date(node.ctime).toISOString()}\n  Modify: ${new Date(node.mtime).toISOString()}\n  Access: ${new Date(node.atime).toISOString()}\n`;
            })
            .join("\n") + "\n",
        );
      }
      case "file": {
        const brief = args.includes("-b") || args.includes("--brief");
        const paths = args.filter(
          (a) => a !== "-b" && a !== "--brief" && a !== "--",
        );
        return this.result(
          filesFrom(paths)
            .map((path) => {
              const { node } = fs.resolve(path, { followFinal: false });
              const kind =
                node.type === "directory"
                  ? "directory"
                  : node.type === "symlink"
                    ? `symbolic link to ${node.target}`
                    : node.content.length === 0
                      ? "empty"
                      : "ASCII text";
              return brief ? kind : `${path}: ${kind}`;
            })
            .join("\n") + "\n",
        );
      }
      case "head":
      case "tail": {
        let count = 10,
          fromLine = false,
          follow = false;
        const paths = [];
        for (let i = 0; i < args.length; i++) {
          const value = args[i];
          if (value === "-f" || value === "--follow") {
            follow = true;
            continue;
          }
          if (value === "-n" || value === "--lines") {
            const raw = args[++i];
            if (!raw) throw new Error("missing number after -n");
            if (command === "tail" && raw.startsWith("+")) {
              fromLine = true;
              count = Number(raw.slice(1));
            } else count = Number(raw);
            continue;
          }
          const short = value.match(/^-([+-]?\d+)$/);
          const compact = value.match(/^-n([+-]?\d+)$/);
          if (short || compact) {
            const raw = (short || compact)[1];
            if (command === "tail" && raw.startsWith("+")) {
              fromLine = true;
              count = Number(raw.slice(1));
            } else count = Number(raw);
            continue;
          }
          if (value !== "--") paths.push(value);
        }
        if (!Number.isInteger(count) || count < 0)
          throw new Error("invalid number of lines");
        const files = paths.length ? paths : ["-"];
        let output = "";
        for (const path of files) {
          const content = path === "-" ? io.stdin : fs.readFile(path);
          const rows = content.split("\n");
          if (rows.at(-1) === "") rows.pop();
          const selected =
            command === "head"
              ? rows.slice(0, count)
              : fromLine
                ? rows.slice(Math.max(0, count - 1))
                : rows.slice(-count);
          output +=
            selected.join("\n") +
            (selected.length && (content.endsWith("\n") || selected.length)
              ? "\n"
              : "");
          if (follow && path !== "-")
            output += `[tail -f snapshot: live background following is unavailable in this browser simulation]\n`;
        }
        return this.result(output);
      }
      case "less":
      case "more": {
        const paths = args.filter((x) => !x.startsWith("-"));
        return this.result(
          paths.length ? paths.map((p) => fs.readFile(p)).join("\n") : io.stdin,
        );
      }
      case "wc": {
        const { flags, rest } = splitFlags(args);
        requireFlag(flags, "lwcmL");
        const paths = rest.length ? rest : ["-"];
        const countFor = (content) => {
          const text = String(content);
          const lines = text
            ? (text.match(/\n/g) || []).length + (text.endsWith("\n") ? 0 : 1)
            : 0;
          const words = (text.trim().match(/\S+/g) || []).length;
          const bytes = byteLength(text),
            chars = [...text].length;
          const longest = text
            .split(/\r?\n/)
            .reduce((n, row) => Math.max(n, [...row].length), 0);
          return { lines, words, bytes, chars, longest };
        };
        const totals = { lines: 0, words: 0, bytes: 0, chars: 0, longest: 0 };
        const rows = paths.map((path) => {
          const stats = countFor(path === "-" ? io.stdin : fs.readFile(path));
          for (const key of Object.keys(totals)) totals[key] += stats[key];
          const selected = flags.size
            ? ["l", "w", "c", "m", "L"]
                .filter((f) => flags.has(f))
                .map(
                  (f) =>
                    stats[
                      {
                        l: "lines",
                        w: "words",
                        c: "bytes",
                        m: "chars",
                        L: "longest",
                      }[f]
                    ],
                )
            : [stats.lines, stats.words, stats.bytes];
          return `${selected.map((v) => String(v).padStart(8)).join("")}${paths.length > 1 || path !== "-" ? " " + path : ""}`;
        });
        if (paths.length > 1) {
          const selected = flags.size
            ? ["l", "w", "c", "m", "L"]
                .filter((f) => flags.has(f))
                .map(
                  (f) =>
                    totals[
                      {
                        l: "lines",
                        w: "words",
                        c: "bytes",
                        m: "chars",
                        L: "longest",
                      }[f]
                    ],
                )
            : [totals.lines, totals.words, totals.bytes];
          rows.push(
            `${selected.map((v) => String(v).padStart(8)).join("")} total`,
          );
        }
        return this.result(rows.join("\n") + "\n");
      }
      case "sort": {
        let numeric = false,
          reverse = false,
          unique = false,
          ignoreCase = false,
          keyField = 1;
        const paths = [];
        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === "-n" || a === "--numeric-sort") numeric = true;
          else if (a === "-r" || a === "--reverse") reverse = true;
          else if (a === "-u" || a === "--unique") unique = true;
          else if (a === "-f" || a === "--ignore-case") ignoreCase = true;
          else if (a === "-k" || a === "--key") keyField = Number(args[++i]);
          else if (/^-k\d+$/.test(a)) keyField = Number(a.slice(2));
          else if (/^-[nruf]{2,}$/.test(a)) {
            for (const flag of a.slice(1)) {
              if (flag === "n") numeric = true;
              if (flag === "r") reverse = true;
              if (flag === "u") unique = true;
              if (flag === "f") ignoreCase = true;
            }
          } else if (a !== "--") paths.push(a);
        }
        if (!Number.isInteger(keyField) || keyField < 1)
          throw new Error("sort: invalid key field");
        const text = paths.length
          ? paths.map((p) => fs.readFile(p)).join("")
          : io.stdin;
        let rows = text.split(/\r?\n/);
        if (rows.at(-1) === "") rows.pop();
        rows.sort((a, b) => {
          let left = a,
            right = b;
          if (keyField > 1) {
            left = a.trim().split(/\s+/)[keyField - 1] || "";
            right = b.trim().split(/\s+/)[keyField - 1] || "";
          }
          if (ignoreCase) {
            left = left.toLowerCase();
            right = right.toLowerCase();
          }
          return numeric
            ? Number(left) - Number(right)
            : left.localeCompare(right);
        });
        if (reverse) rows.reverse();
        if (unique)
          rows = rows.filter(
            (row, index) => index === 0 || row !== rows[index - 1],
          );
        return this.result(rows.join("\n") + (rows.length ? "\n" : ""));
      }
      case "uniq": {
        let count = false,
          duplicated = false,
          uniqueOnly = false,
          ignoreCase = false;
        const paths = args.filter((a) => {
          if (a === "-c" || a === "--count") {
            count = true;
            return false;
          }
          if (a === "-d" || a === "--repeated") {
            duplicated = true;
            return false;
          }
          if (a === "-u" || a === "--unique") {
            uniqueOnly = true;
            return false;
          }
          if (a === "-i" || a === "--ignore-case") {
            ignoreCase = true;
            return false;
          }
          return !a.startsWith("-") || a === "-";
        });
        const text = paths.length ? fs.readFile(paths[0]) : io.stdin;
        const rows = text.split(/\r?\n/);
        if (rows.at(-1) === "") rows.pop();
        const out = [];
        for (let i = 0; i < rows.length; ) {
          let j = i + 1;
          const key = ignoreCase ? rows[i].toLowerCase() : rows[i];
          while (
            j < rows.length &&
            (ignoreCase ? rows[j].toLowerCase() : rows[j]) === key
          )
            j++;
          const n = j - i;
          if (
            (!duplicated && !uniqueOnly) ||
            (duplicated && n > 1) ||
            (uniqueOnly && n === 1)
          )
            out.push((count ? String(n).padStart(7) + " " : "") + rows[i]);
          i = j;
        }
        return this.result(out.join("\n") + (out.length ? "\n" : ""));
      }
      case "nl": {
        const text = args.length ? fs.readFile(args.at(-1)) : io.stdin;
        return this.result(
          text
            .split(/(?<=\n)/)
            .map((row, i) => `${String(i + 1).padStart(6)}\t${row}`)
            .join(""),
        );
      }
      case "cut": {
        let delimiter = "\t",
          fields = null,
          chars = null,
          suppressNoDelimiter = false,
          complement = false;
        const paths = [];
        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === "-d" || a === "--delimiter") delimiter = args[++i] ?? "";
          else if (a.startsWith("-d") && a.length > 2) delimiter = a.slice(2);
          else if (a === "-f" || a === "--fields") fields = args[++i];
          else if (a.startsWith("-f") && a.length > 2) fields = a.slice(2);
          else if (a === "-c" || a === "--characters") chars = args[++i];
          else if (a.startsWith("-c") && a.length > 2) chars = a.slice(2);
          else if (a === "-s" || a === "--only-delimited")
            suppressNoDelimiter = true;
          else if (a === "--complement") complement = true;
          else if (a === "--")
            (paths.push(...args.slice(i + 1)), (i = args.length));
          else paths.push(a);
        }
        if ((fields === null) === (chars === null))
          throw new Error(
            "usage: cut -d DELIMITER -f LIST [FILE] or cut -c LIST [FILE]",
          );
        const parseList = (spec) => {
          const set = new Set();
          for (const bit of String(spec).split(",")) {
            const m = bit.match(/^(\d+)?-(\d+)?$/);
            if (m && (m[1] || m[2])) {
              const from = m[1] ? Number(m[1]) : 1,
                to = m[2] ? Number(m[2]) : 10000;
              for (let n = from; n <= Math.min(to, 10000); n++) set.add(n - 1);
            } else {
              const n = Number(bit);
              if (!Number.isInteger(n) || n < 1)
                throw new Error("invalid field/character list");
              set.add(n - 1);
            }
          }
          return [...set].sort((a, b) => a - b);
        };
        const selected = parseList(fields ?? chars);
        const text = paths.length
          ? paths.map((p) => (p === "-" ? io.stdin : fs.readFile(p))).join("")
          : io.stdin;
        const output = text
          .split(/(?<=\n)/)
          .map((line) => {
            const body = line.endsWith("\n") ? line.slice(0, -1) : line;
            if (fields !== null) {
              if (!body.includes(delimiter))
                return suppressNoDelimiter ? "" : line;
              const parts = body.split(delimiter);
              const indexes = complement
                ? parts.map((_, i) => i).filter((i) => !selected.includes(i))
                : selected;
              return (
                indexes.map((i) => parts[i] ?? "").join(delimiter) +
                (line.endsWith("\n") ? "\n" : "")
              );
            }
            const points = [...body];
            const indexes = complement
              ? points.map((_, i) => i).filter((i) => !selected.includes(i))
              : selected;
            return (
              indexes.map((i) => points[i] ?? "").join("") +
              (line.endsWith("\n") ? "\n" : "")
            );
          })
          .join("");
        return this.result(output);
      }
      case "tr": {
        let deleteChars = false,
          squeeze = false,
          complement = false;
        const operands = [];
        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-d" || args[i] === "--delete") deleteChars = true;
          else if (args[i] === "-s" || args[i] === "--squeeze-repeats")
            squeeze = true;
          else if (
            args[i] === "-c" ||
            args[i] === "-C" ||
            args[i] === "--complement"
          )
            complement = true;
          else if (args[i] === "--")
            (operands.push(...args.slice(i + 1)), (i = args.length));
          else operands.push(args[i]);
        }
        if (
          !operands.length ||
          (!deleteChars && !squeeze && operands.length < 2)
        )
          noArgs("tr [-cds] SET1 [SET2]");
        const expandSet = (value) => {
          const raw = String(value)
            .replace(/\\\n/g, "\n")
            .replace(/\\\t/g, "\t")
            .replace(/\\\r/g, "\r");
          const out = [];
          for (let i = 0; i < raw.length; i++) {
            if (raw[i] === "\\\\" && i + 1 < raw.length) {
              out.push(raw[++i]);
              continue;
            }
            if (i + 2 < raw.length && raw[i + 1] === "-") {
              const a = raw.charCodeAt(i),
                b = raw.charCodeAt(i + 2),
                step = a <= b ? 1 : -1;
              if (Math.abs(a - b) > 4096)
                throw new Error("tr: character range too large");
              for (let n = a; step > 0 ? n <= b : n >= b; n += step)
                out.push(String.fromCharCode(n));
              i += 2;
            } else out.push(raw[i]);
          }
          return [...new Set(out)];
        };
        let from = expandSet(operands[0]);
        const to = deleteChars
          ? []
          : operands[1] === undefined
            ? from
            : expandSet(operands[1]);
        if (complement) {
          const excluded = new Set(from);
          from = [...new Set([...io.stdin])].filter((c) => !excluded.has(c));
        }
        let output = "";
        if (deleteChars)
          output = [...io.stdin].filter((c) => !from.includes(c)).join("");
        else {
          const map = new Map(
            from.map((c, i) => [
              c,
              to[Math.min(i, Math.max(0, to.length - 1))] ?? "",
            ]),
          );
          output = [...io.stdin]
            .map((c) => (map.has(c) ? map.get(c) : c))
            .join("");
        }
        if (squeeze) {
          const squeezeSet = new Set(deleteChars ? from : to);
          let last = null,
            compressed = "";
          for (const c of output) {
            if (c !== last || !squeezeSet.has(c)) compressed += c;
            last = c;
          }
          output = compressed;
        }
        return this.result(output);
      }
      case "diff": {
        const paths = args.filter((a) => !a.startsWith("-"));
        if (paths.length !== 2) noArgs("diff FILE1 FILE2");
        const a = fs.readFile(paths[0]).split(/\r?\n/),
          b = fs.readFile(paths[1]).split(/\r?\n/);
        if (a.at(-1) === "") a.pop();
        if (b.at(-1) === "") b.pop();
        if (a.join("\n") === b.join("\n")) return this.result();
        const out = [`--- ${paths[0]}`, `+++ ${paths[1]}`];
        const n = Math.max(a.length, b.length);
        for (let i = 0; i < n; i++) {
          if (a[i] !== b[i]) {
            if (a[i] !== undefined) out.push(`-${a[i]}`);
            if (b[i] !== undefined) out.push(`+${b[i]}`);
          }
        }
        return this.result(out.join("\n") + "\n", "", 1);
      }
      case "tee": {
        const { flags, rest } = splitFlags(args);
        requireFlag(flags, "aappend");
        const text = io.stdin;
        for (const path of rest)
          fs.writeFile(path, text, {
            append: flags.has("a") || flags.has("append"),
          });
        return this.result(text);
      }
      case "find": {
        const list = args.slice();
        let start = ".",
          maxDepth = Infinity,
          action = "print",
          execCommand = null;
        if (list[0] && !list[0].startsWith("-")) start = list.shift();
        const predicates = [];
        const readValue = (i, flag) => {
          if (i + 1 >= list.length)
            throw new Error(`find: missing argument to ${flag}`);
          return list[i + 1];
        };
        for (let i = 0; i < list.length; i++) {
          const flag = list[i];
          if (flag === "-maxdepth") {
            maxDepth = Number(readValue(i, flag));
            i++;
          } else if (flag === "-name" || flag === "-iname") {
            predicates.push({ type: flag.slice(1), value: readValue(i, flag) });
            i++;
          } else if (
            flag === "-type" ||
            flag === "-user" ||
            flag === "-group" ||
            flag === "-size" ||
            flag === "-mtime" ||
            flag === "-mmin" ||
            flag === "-atime" ||
            flag === "-amin" ||
            flag === "-ctime" ||
            flag === "-cmin" ||
            flag === "-perm" ||
            flag === "-inum"
          ) {
            predicates.push({ type: flag.slice(1), value: readValue(i, flag) });
            i++;
          } else if (flag === "-nouser" || flag === "-nogroup")
            predicates.push({ type: flag.slice(1) });
          else if (flag === "-o" || flag === "-or")
            predicates.push({ type: "or" });
          else if (flag === "-print") action = "print";
          else if (flag === "-delete") action = "delete";
          else if (flag === "-exec") {
            const cmd = [];
            let foundEnd = false;
            for (i = i + 1; i < list.length; i++) {
              if (list[i] === ";") {
                foundEnd = true;
                break;
              }
              cmd.push(list[i]);
            }
            if (!foundEnd || !cmd.length || !cmd.includes("{}"))
              throw new Error("find: -exec requires COMMAND {} \\\\;");
            action = "exec";
            execCommand = cmd;
          } else if (flag === "-depth" || flag === "-L" || flag === "-P") {
            /* traversal defaults are already safe */
          } else throw new Error(`find: unknown predicate '${flag}'`);
        }
        if (
          maxDepth !== Infinity &&
          (!Number.isInteger(maxDepth) || maxDepth < 0)
        )
          throw new Error("find: invalid max depth");
        const rows = fs.treeWalk(start, maxDepth);
        const compareNumeric = (actual, spec) => {
          const match = String(spec).match(/^([+-]?)(\d+(?:\.\d+)?)([ckMG]?)$/);
          if (!match) return false;
          const n = Number(match[2]),
            multiplier =
              { c: 1, k: 1024, M: 1048576, G: 1073741824 }[match[3]] || 1;
          const wanted = n * multiplier,
            value = Number(actual);
          if (match[1] === "+") return value > wanted;
          if (match[1] === "-") return value < wanted;
          return value === wanted;
        };
        const test = ({ node, depth }, pred) => {
          switch (pred.type) {
            case "name":
              return globToRegExp(pred.value).test(node.name);
            case "iname":
              return globToRegExp(pred.value, true).test(node.name);
            case "type":
              return (
                { file: "f", directory: "d", symlink: "l" }[node.type] ===
                pred.value
              );
            case "user":
              return fs.getUser(pred.value)?.uid === node.uid;
            case "group":
              return fs.getGroup(pred.value)?.gid === node.gid;
            case "nouser":
              return !fs.getUserByUid(node.uid);
            case "nogroup":
              return !fs.getGroup(node.gid);
            case "inum":
              return node.id === Number(pred.value);
            case "perm": {
              const spec = String(pred.value);
              const mode = parseInt(spec.replace(/^[-+]/, ""), 8);
              if (!Number.isFinite(mode)) return false;
              if (spec.startsWith("-")) return (node.mode & mode) === mode;
              if (spec.startsWith("+")) return Boolean(node.mode & mode);
              return (node.mode & 0o7777) === mode;
            }
            case "size": {
              const bytes =
                node.type === "file"
                  ? byteLength(node.content)
                  : node.type === "symlink"
                    ? byteLength(node.target)
                    : node.children.size;
              const match = String(pred.value).match(/^([+-]?)(\d+)([ckMG]?)$/);
              if (!match) return false;
              const divisor = { c: 1, k: 1024, M: 1048576, G: 1073741824 }[
                match[3] || "c"
              ];
              const units = match[3] ? Math.ceil(bytes / divisor) : bytes;
              return compareNumeric(units, match[1] + match[2]);
            }
            case "mtime":
            case "atime":
            case "ctime":
            case "mmin":
            case "amin":
            case "cmin": {
              const stamp =
                node[
                  pred.type.startsWith("a")
                    ? "atime"
                    : pred.type.startsWith("c")
                      ? "ctime"
                      : "mtime"
                ];
              const minutes = pred.type.endsWith("min"),
                elapsed = (Date.now() - stamp) / (minutes ? 60000 : 86400000);
              const age = Math.floor(elapsed);
              return compareNumeric(age, pred.value);
            }
            default:
              return true;
          }
        };
        const matches = rows.filter((row) => {
          let groupResult = true,
            anyGroup = false;
          for (const pred of predicates) {
            if (pred.type === "or") {
              anyGroup = anyGroup || groupResult;
              groupResult = true;
              continue;
            }
            groupResult = groupResult && test(row, pred);
          }
          return anyGroup || groupResult;
        });
        if (action === "delete") {
          const ordered = matches.slice().sort((a, b) => b.depth - a.depth);
          for (const { node } of ordered)
            if (node.parent)
              fs.remove(fs.nodePath(node), {
                recursive: node.type === "directory",
                force: true,
              });
          return this.result();
        }
        if (action === "exec") {
          let stdout = "",
            stderr = "",
            status = 0;
          for (const { node } of matches) {
            const path = fs.nodePath(node);
            const argv = execCommand.map((part) =>
              part === "{}" ? path : part,
            );
            const result = await this.runCommand(argv, io.stdin);
            stdout += result.stdout;
            stderr += result.stderr;
            status = result.status;
          }
          return this.result(stdout, stderr, status);
        }
        return this.result(
          matches.map(({ node }) => fs.nodePath(node)).join("\n") +
            (matches.length ? "\n" : ""),
        );
      }
      case "vim": {
        if (args.length !== 1) noArgs("vim FILE");
        let initial = "";
        try {
          initial = fs.readFile(args[0]);
        } catch (error) {
          if (!String(error.message).startsWith("No such file or directory:"))
            throw error;
        }
        await io.openEditor(args[0], initial, (value, targetPath = args[0]) =>
          fs.writeFile(targetPath, value),
        );
        return this.result();
      }
      case ":":
      case "true":
        return this.result();
      case "false":
        return this.result("", "", 1);
      case "date": {
        const now = new Date();
        const format = args.find((a) => a.startsWith("+"));
        if (!format) return this.result(now.toString() + "\n");
        const tokens = {
          Y: () => String(now.getFullYear()).padStart(4, "0"),
          y: () => String(now.getFullYear()).slice(-2),
          m: () => String(now.getMonth() + 1).padStart(2, "0"),
          d: () => String(now.getDate()).padStart(2, "0"),
          F: () =>
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
          H: () => String(now.getHours()).padStart(2, "0"),
          M: () => String(now.getMinutes()).padStart(2, "0"),
          S: () => String(now.getSeconds()).padStart(2, "0"),
          R: () =>
            `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          T: () => now.toTimeString().slice(0, 8),
          x: () => now.toLocaleDateString(),
          A: () => now.toLocaleDateString(undefined, { weekday: "long" }),
          a: () => now.toLocaleDateString(undefined, { weekday: "short" }),
          B: () => now.toLocaleDateString(undefined, { month: "long" }),
          b: () => now.toLocaleDateString(undefined, { month: "short" }),
          "%": () => "%",
        };
        return this.result(
          format
            .slice(1)
            .replace(
              /%([YymdFHMSR TxaABb%])/g,
              (_, k) => tokens[k]?.() ?? `%${k}`,
            ) + "\n",
        );
      }
      case "hostname": {
        if (args.length) {
          this.needRoot(command);
          fs.writeFile("/etc/hostname", args[0] + "\n");
          this.env.HOSTNAME = args[0];
          return this.result();
        }
        return this.result(fs.readFile("/etc/hostname"));
      }
      case "uname": {
        const flags = new Set(args);
        if (flags.has("--kernel-name") || flags.has("-s"))
          return this.result("Linux\n");
        if (flags.has("-r") || flags.has("--kernel-release"))
          return this.result("6.1.0-acs\n");
        if (flags.has("-n") || flags.has("--nodename"))
          return this.result("acs-linux\n");
        if (flags.has("-m") || flags.has("--machine"))
          return this.result("x86_64\n");
        if (flags.has("-a") || flags.has("--all"))
          return this.result(
            "Linux acs-linux 6.1.0-acs #1 SMP browser x86_64 GNU/Linux (simulated)\n",
          );
        return this.result("Linux\n");
      }
      case "uptime": {
        if (args.includes("-p") || args.includes("--pretty"))
          return this.result("up 1 day, 2 hours (simulated)\n");
        return this.result(
          ` ${new Date().toLocaleTimeString()} up 1 day,  2 users,  load average: 0.02, 0.01, 0.00 (simulated)\n`,
        );
      }
      case "df": {
        const human = args.includes("-h") || args.includes("--human-readable");
        return this.result(
          human
            ? "Filesystem      Size  Used Avail Use% Mounted on\nvirtualfs        64M    1M   63M   2% /\n"
            : "Filesystem      1K-blocks  Used Available Use% Mounted on\nvirtualfs           65536 1024     64512   2% /\n",
        );
      }
      case "free": {
        const human =
          args.includes("-h") ||
          args.includes("-hk") ||
          args.includes("-kh") ||
          args.includes("--human");
        const unit = human
          ? "Gi"
          : args.includes("-k") || args.includes("--kibi")
            ? "Ki"
            : "";
        const divisor = human
          ? 1048576
          : args.includes("-k") ||
              args.includes("-hk") ||
              args.includes("-kh") ||
              args.includes("--kibi")
            ? 1024
            : 1;
        const scale = (n) => Math.round(n / divisor);
        return this.result(
          `               total        used        free      shared  buff/cache   available\nMem:          ${scale(
            4 * 1024 ** 3,
          )
            .toString()
            .padStart(8)}      ${scale(1.2 * 1024 ** 3)
            .toString()
            .padStart(8)}      ${scale(2.8 * 1024 ** 3)
            .toString()
            .padStart(8)}           0        ${scale(512 * 1024 ** 2)
            .toString()
            .padStart(8)}      ${scale(2.5 * 1024 ** 3)
            .toString()
            .padStart(8)} ${unit}\nSwap:         ${scale(2 * 1024 ** 3)
            .toString()
            .padStart(8)}           0      ${scale(2 * 1024 ** 3)
            .toString()
            .padStart(8)}\n(simulated values)\n`,
        );
      }
      case "cal": {
        let month, year;
        if (args.length === 0) {
          const now = new Date();
          month = now.getMonth() + 1;
          year = now.getFullYear();
        } else if (args.length === 1) {
          year = Number(args[0]);
          month = null;
        } else {
          month = Number(args[0]);
          year = Number(args[1]);
        }
        if (
          !Number.isInteger(year) ||
          year < 1 ||
          year > 9999 ||
          (month !== null &&
            (!Number.isInteger(month) || month < 1 || month > 12))
        )
          throw new Error("usage: cal [YEAR] or cal MONTH YEAR");
        const months =
          month === null
            ? Array.from({ length: 12 }, (_, i) => i + 1)
            : [month];
        const render = (m) => {
          const title = new Date(year, m - 1, 1).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          });
          let out = `      ${title}\nSu Mo Tu We Th Fr Sa\n`;
          const first = new Date(year, m - 1, 1).getDay(),
            days = new Date(year, m, 0).getDate();
          let cells = Array(first).fill("  ");
          for (let d = 1; d <= days; d++) cells.push(String(d).padStart(2));
          for (let i = 0; i < cells.length; i += 7)
            out += cells.slice(i, i + 7).join(" ") + "\n";
          return out;
        };
        return this.result(months.map(render).join("\n"));
      }
      case "ps": {
        const full = args.includes("-f"),
          bsd =
            args.includes("aux") ||
            args.includes("-au") ||
            (args.includes("-a") && args.includes("-u")),
          user = args.includes("-u");
        const header = full
          ? "UID          PID PPID C STIME TTY          TIME CMD"
          : bsd
            ? "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND"
            : "  PID TTY          TIME CMD";
        const row = full
          ? `${this.user.name.padEnd(12)} 1000    1 0 19:00 pts/0    00:00:00 bash`
          : bsd
            ? `${this.user.name.padEnd(10)} 1000  0.0  0.1  10000  4000 pts/0    Ss   19:00   0:00 bash`
            : " 1000 pts/0    00:00:00 bash";
        return this.result(
          `${header}\n${row}\n${full || bsd ? "  " + this.user.name + " ".repeat(9) + "1001  0.0  0.0   2000  1000 pts/0    R+   19:01   0:00 ps" : " 1001 pts/0    00:00:00 ps"}\n`,
        );
      }
      case "whoami":
        return this.result(this.user.name + "\n");
      case "who":
        return this.result(
          `${this.user.name} pts/0 ${new Date().toLocaleString()} (browser)\n`,
        );
      case "id": {
        const user = args[0] ? fs.getUser(args[0]) : this.user;
        if (!user) throw new Error(`no such user: ${args[0]}`);
        const groups = [...new Set([user.gid, ...(user.groups || [])])];
        return this.result(
          `uid=${user.uid}(${user.name}) gid=${user.gid}(${fs.getGroup(user.gid)?.name || user.gid}) groups=${groups.map((gid) => `${gid}(${fs.getGroup(gid)?.name || gid})`).join(",")}\n`,
        );
      }
      case "groups": {
        const user = args[0] ? fs.getUser(args[0]) : this.user;
        if (!user) throw new Error(`no such user: ${args[0]}`);
        return this.result(groupNames(user).join(" ") + "\n");
      }
      case "last":
        return this
          .result(`${this.user.name} pts/0 browser ${new Date().toLocaleString()} still logged in\n
wtmp begins ${new Date(Date.now() - 86400000).toDateString()} (simulated)\n`);
      case "history": {
        if (args.includes("-c") || args.includes("--clear")) {
          this.history = [];
          return this.result();
        }
        if (args.includes("-d")) {
          const index = args.indexOf("-d"),
            n = Number(args[index + 1]);
          if (!Number.isInteger(n) || n < 1 || n > this.history.length)
            throw new Error("history: invalid history position");
          this.history.splice(n - 1, 1);
          return this.result();
        }
        const limit = Number(args[0]);
        const entries =
          Number.isInteger(limit) && limit > 0
            ? this.history.slice(-limit)
            : this.history;
        return this.result(
          entries
            .map(
              (line, i) =>
                `${String(this.history.length - entries.length + i + 1).padStart(5)}  ${line}`,
            )
            .join("\n") + "\n",
        );
      }
      case "command": {
        if (args[0] === "-v" || args[0] === "-V") {
          const names = args.slice(1);
          const resolveName = (name) =>
            this.aliases.has(name)
              ? args[0] === "-v"
                ? this.aliases.get(name)
                : `${name} is aliased to '${this.aliases.get(name)}'`
              : SHELL_BUILTINS.has(name)
                ? args[0] === "-v"
                  ? name
                  : `${name} is a shell builtin`
                : BUILTINS.has(name)
                  ? args[0] === "-v"
                    ? ["bash", "vim", "vimtutor"].includes(name)
                      ? `/bin/${name}`
                      : `/usr/bin/${name}`
                    : `${name} is /usr/bin/${name}`
                  : this.resolveVirtualExecutable(name)?.path || "";
          const values = names.map(resolveName).filter(Boolean);
          return this.result(
            values.join("\n") + (values.length ? "\n" : ""),
            "",
            values.length === names.length ? 0 : 1,
          );
        }
        if (!args.length) return this.result();
        return this.runCommand(args, io.stdin);
      }
      case "type": {
        if (!args.length) noArgs("type NAME...");
        const values = args.map((name) =>
          this.aliases.has(name)
            ? `${name} is aliased to '${this.aliases.get(name)}'`
            : SHELL_BUILTINS.has(name)
              ? `${name} is a shell builtin`
              : BUILTINS.has(name)
                ? `${name} is /usr/bin/${name}`
                : this.resolveVirtualExecutable(name)
                  ? `${name} is ${this.resolveVirtualExecutable(name).path}`
                  : `${name}: not found`,
        );
        return this.result(
          values.join("\n") + "\n",
          "",
          args.every(
            (name) =>
              this.aliases.has(name) ||
              SHELL_BUILTINS.has(name) ||
              BUILTINS.has(name) ||
              Boolean(this.resolveVirtualExecutable(name)),
          )
            ? 0
            : 1,
        );
      }
      case "alias": {
        if (!args.length)
          return this.result(
            [...this.aliases]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => `alias ${k}='${v.replace(/'/g, "'\\''")}'`)
              .join("\n") + (this.aliases.size ? "\n" : ""),
          );
        for (const item of args) {
          const index = item.indexOf("=");
          if (index < 1) {
            if (!this.aliases.has(item)) throw new Error(`${item}: not found`);
            return this.result(`alias ${item}='${this.aliases.get(item)}'\n`);
          }
          this.aliases.set(
            item.slice(0, index),
            item.slice(index + 1).replace(/^['"]|['"]$/g, ""),
          );
        }
        return this.result();
      }
      case "unalias": {
        if (args.length === 1 && args[0] === "-a") {
          this.aliases.clear();
          return this.result();
        }
        if (!args.length) noArgs("unalias [-a] NAME...");
        for (const name of args) {
          if (!this.aliases.delete(name)) throw new Error(`${name}: not found`);
        }
        return this.result();
      }
      case "export": {
        if (!args.length)
          return this.result(
            [...this.exported]
              .sort()
              .map(
                (key) =>
                  `declare -x ${key}="${safeText(this.env[key]).replace(/"/g, '\\"')}"`,
              )
              .join("\n") + "\n",
          );
        for (const arg of args) {
          const i = arg.indexOf("=");
          const key = i < 0 ? arg : arg.slice(0, i);
          if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
            throw new Error(`not a valid identifier: ${key}`);
          if (i >= 0) this.env[key] = arg.slice(i + 1);
          this.exported.add(key);
        }
        return this.result();
      }
      case "unset": {
        const names = args.filter((x) => x !== "-v" && x !== "-f");
        for (const name of names) {
          delete this.env[name];
          this.exported.delete(name);
          this.aliases.delete(name);
        }
        return this.result();
      }
      case "env": {
        let i = 0,
          changed =
            args.includes("-i") || args.includes("--ignore-environment")
              ? {}
              : { ...this.env };
        while (i < args.length) {
          if (args[i] === "-i" || args[i] === "--ignore-environment") {
            i++;
            continue;
          }
          if (args[i] === "-u" || args[i] === "--unset") {
            delete changed[args[i + 1]];
            i += 2;
            continue;
          }
          if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(args[i])) {
            const at = args[i].indexOf("=");
            changed[args[i].slice(0, at)] = args[i].slice(at + 1);
            i++;
            continue;
          }
          break;
        }
        if (i >= args.length)
          return this.result(
            Object.keys(changed)
              .sort()
              .map((key) => `${key}=${changed[key]}`)
              .join("\n") + "\n",
          );
        const before = this.env,
          beforeExported = this.exported;
        this.env = changed;
        this.exported = new Set(Object.keys(changed));
        try {
          return await this.runCommand(args.slice(i), io.stdin);
        } finally {
          this.env = before;
          this.exported = beforeExported;
        }
      }
      case "set": {
        if (!args.length)
          return this.result(
            Object.keys(this.env)
              .sort()
              .map((key) => `${key}=${this.env[key]}`)
              .join("\n") +
              "\n" +
              this.positionals.map((p, i) => `${i + 1}) ${p}`).join("\n"),
          );
        if (args[0] === "--") {
          this.positionals = args.slice(1);
          return this.result();
        }
        const positionals = [];
        for (let i = 0; i < args.length; i++) {
          const option = args[i];
          if (option === "-e") this.options.errexit = true;
          else if (option === "+e") this.options.errexit = false;
          else if (option === "-u") this.options.nounset = true;
          else if (option === "+u") this.options.nounset = false;
          else if (["-o", "+o"].includes(option)) {
            const name = args[i + 1];
            if (!name)
              return this.result(
                `errexit\t${this.options.errexit ? "on" : "off"}\nnounset\t${this.options.nounset ? "on" : "off"}\n`,
              );
            i++;
            if (name === "errexit") this.options.errexit = option === "-o";
            else if (name === "nounset") this.options.nounset = option === "-o";
            else throw new Error(`unsupported set option '${name}'`);
          } else if (option === "--") {
            positionals.push(...args.slice(i + 1));
            break;
          } else if (option.startsWith("-") || option.startsWith("+"))
            throw new Error(`unsupported set option '${option}'`);
          else positionals.push(option);
        }
        this.positionals = positionals;
        return this.result();
      }
      case "umask": {
        if (!args.length) return this.result(modeOctal(fs.umask) + "\n");
        if (args[0] === "-S" || args[0] === "--symbolic") {
          const allow = ~fs.umask & 0o777;
          const part = (shift) =>
            ["r", "w", "x"]
              .map((c, i) => (allow & (1 << (shift + 2 - i)) ? c : "-"))
              .join("");
          return this.result(`u=${part(6)},g=${part(3)},o=${part(0)}\n`);
        }
        if (!/^[0-7]{3,4}$/.test(args[0]))
          throw new Error("invalid symbolic mode string");
        fs.umask = parseInt(args[0], 8) & 0o777;
        return this.result();
      }
      case "source":
      case ".": {
        if (args.length !== 1) noArgs("source FILE");
        const content = fs.readFile(args[0]);
        if (++this.runningSource > 10) {
          this.runningSource--;
          throw new Error("source nesting limit reached");
        }
        try {
          const r = await this.executeLine(content, {
            fromSource: true,
            allowClosed: true,
          });
          return this.result(r.stdout, r.stderr, r.status);
        } finally {
          this.runningSource--;
        }
      }
      case "exit":
      case "logout": {
        const context =
          this.contextStack.pop() ||
          (this.groupStack.length
            ? "group"
            : this.userStack.length
              ? "user"
              : this.shellStack.length
                ? "shell"
                : "");
        if (context === "group" && this.groupStack.length) {
          const prior = this.groupStack.pop();
          this.user.gid = prior.gid;
          return this.result("Returned to previous simulated group.\n");
        }
        if (context === "user" && this.userStack.length) {
          const prior = this.userStack.pop();
          fs.currentUid = prior.uid;
          fs.cwd = prior.cwd;
          this.env = prior.env;
          this.env.PWD = fs.cwd;
          return this.result(`Returned to simulated user ${this.user.name}.\n`);
        }
        if (context === "shell" && this.shellStack.length) {
          const prior = this.shellStack.pop();
          this.env = prior.env;
          this.exported = new Set(prior.exported);
          this.aliases = new Map(prior.aliases);
          this.history = prior.history;
          this.positionals = prior.positionals;
          this.zero = prior.zero;
          this.options = prior.options;
          this.closed = prior.closed;
          fs.cwd = prior.cwd;
          this.env.PWD = fs.cwd;
          return this.result("Returned to parent Bash shell.\n");
        }
        this.closed = true;
        return this.result(
          `exit\n[Shell exited with status ${Number(args[0]) || this.lastStatus}]\n`,
        );
      }
      case "bash": {
        if (args[0] === "-c" || args[0] === "--command") {
          if (!args[1]) noArgs("bash -c COMMAND [NAME [ARG...]]");
          const child = new Shell(fs, this.io);
          const childEnv = {
            HOME: this.env.HOME,
            USER: this.env.USER,
            LOGNAME: this.env.LOGNAME,
            SHELL: this.env.SHELL,
            PATH: this.env.PATH,
            PWD: fs.cwd,
            HOSTNAME: this.env.HOSTNAME,
            TERM: this.env.TERM,
            LANG: this.env.LANG,
          };
          for (const key of this.exported)
            if (key in this.env) childEnv[key] = this.env[key];
          child.env = childEnv;
          child.exported = new Set(Object.keys(childEnv));
          child.zero = args[2] || "bash";
          child.positionals = args.length > 2 ? args.slice(3) : [];
          const priorCwd = fs.cwd;
          try {
            return await child.executeLine(args[1], {
              fromSource: true,
              allowClosed: true,
            });
          } finally {
            fs.cwd = priorCwd;
          }
        }
        if (args[0] && !["-l", "--login", "-"].includes(args[0])) {
          const child = new Shell(fs, this.io);
          const childEnv = {
            HOME: this.env.HOME,
            USER: this.env.USER,
            LOGNAME: this.env.LOGNAME,
            SHELL: this.env.SHELL,
            PATH: this.env.PATH,
            PWD: fs.cwd,
            HOSTNAME: this.env.HOSTNAME,
            TERM: this.env.TERM,
            LANG: this.env.LANG,
          };
          for (const key of this.exported)
            if (key in this.env) childEnv[key] = this.env[key];
          child.env = childEnv;
          child.exported = new Set(Object.keys(childEnv));
          child.zero = args[0];
          child.positionals = args.slice(1);
          const priorCwd = fs.cwd;
          try {
            return await child.executeLine(fs.readFile(args[0]), {
              fromSource: true,
              allowClosed: true,
            });
          } finally {
            fs.cwd = priorCwd;
          }
        }
        const login =
          args[0] === "-l" || args[0] === "--login" || args[0] === "-";
        const previous = {
          env: this.env,
          exported: [...this.exported],
          aliases: [...this.aliases],
          history: this.history,
          positionals: this.positionals,
          zero: this.zero,
          options: this.options,
          closed: this.closed,
          cwd: fs.cwd,
        };
        this.shellStack.push(previous);
        this.contextStack.push("shell");
        const childEnv = {
          HOME: this.env.HOME,
          USER: this.env.USER,
          LOGNAME: this.env.LOGNAME,
          SHELL: this.env.SHELL,
          PATH: this.env.PATH,
          PWD: fs.cwd,
          HOSTNAME: this.env.HOSTNAME,
          TERM: this.env.TERM,
          LANG: this.env.LANG,
        };
        for (const key of this.exported)
          if (key in this.env) childEnv[key] = this.env[key];
        this.env = childEnv;
        this.exported = new Set(Object.keys(childEnv));
        this.aliases = new Map();
        this.history = [];
        this.positionals = [];
        this.zero = "bash";
        this.options = { errexit: false, nounset: false };
        this.closed = false;
        if (login) {
          this.env.HOME = this.user.home;
          this.env.PWD = this.user.home;
          this.env.OLDPWD = previous.cwd;
          this.fs.cwd = this.user.home;
          this.env.PATH =
            "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin";
        }
        const startupFiles = login ? [".bash_profile", ".bashrc"] : [".bashrc"];
        let startupOutput = "";
        for (const file of startupFiles) {
          try {
            const result = await this.dispatch(
              "source",
              [this.user.home + "/" + file],
              io,
            );
            startupOutput += result.stdout + result.stderr;
          } catch (error) {
            if (!String(error.message).startsWith("No such file or directory:"))
              startupOutput += `${error.message}\n`;
          }
        }
        return this.result(
          `Started simulated ${login ? "login " : ""}Bash child shell. Type exit to return.\n` +
            startupOutput,
        );
      }
      case "sudo": {
        let targetName = "root",
          login = false,
          nonInteractive = false,
          commandArgs = [];
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (arg === "-u" || arg === "--user") {
            targetName = args[++i];
            if (!targetName) noArgs("sudo [-u USER] [-i] COMMAND");
          } else if (arg === "-i" || arg === "--login") login = true;
          else if (arg === "-n" || arg === "--non-interactive")
            nonInteractive = true;
          else if (arg === "--") {
            commandArgs = args.slice(i + 1);
            break;
          } else if (arg.startsWith("-"))
            throw new Error(`sudo: unsupported option ${arg}`);
          else {
            commandArgs = args.slice(i);
            break;
          }
        }
        const target = fs.getUser(targetName);
        if (!target) throw new Error(`sudo: unknown user ${targetName}`);
        const invoking = this.user;
        const invokingUid = fs.currentUid;
        let policyText = "";
        const priorPolicyUid = fs.currentUid;
        fs.currentUid = 0;
        try {
          try {
            policyText = fs.readFile("/etc/sudoers");
          } catch {}
          try {
            for (const entry of fs.list("/etc/sudoers.d")) {
              if (entry.name.startsWith(".")) continue;
              try {
                policyText +=
                  "\n" + fs.readFile("/etc/sudoers.d/" + entry.name);
              } catch {}
            }
          } catch {}
        } finally {
          fs.currentUid = priorPolicyUid;
        }
        let allowed = false,
          noPassword = false;
        const requestedCommand = commandArgs.length
          ? commandArgs[0].split("/").at(-1)
          : "ALL";
        for (const raw of policyText.split(/\r?\n/)) {
          const line = raw.replace(/#.*$/, "").trim();
          if (!line) continue;
          const rule = line.match(
            /^([^\s]+)\s+ALL\s*=\s*\(([^)]*)\)\s*(?:(NOPASSWD|PASSWD):\s*)?(.+)$/,
          );
          if (!rule) continue;
          const [, subject, runas, tag, commandSpec] = rule;
          const subjectMatch = subject.startsWith("%")
            ? (invoking.groups || []).includes(
                fs.getGroup(subject.slice(1))?.gid,
              ) || invoking.gid === fs.getGroup(subject.slice(1))?.gid
            : subject === invoking.name;
          if (!subjectMatch) continue;
          const runasNames = runas
            .split(":")
            .map((x) => x.trim())
            .filter(Boolean);
          if (
            !(
              runasNames.includes("ALL") ||
              runasNames.includes(target.name) ||
              (target.uid === 0 && runasNames.includes("root"))
            )
          )
            continue;
          const allowedCommands = commandSpec.split(/\s*,\s*/);
          const commandMatch = allowedCommands.some((spec) => {
            if (spec === "ALL") return true;
            const parts = spec.trim().split(/\s+/);
            const name = parts[0].split("/").at(-1);
            return (
              name === requestedCommand &&
              parts
                .slice(1)
                .every((arg, index) => commandArgs[index + 1] === arg)
            );
          });
          if (!commandMatch) continue;
          allowed = true;
          noPassword = tag === "NOPASSWD";
        }
        if (!allowed && invokingUid !== 0)
          throw new Error(
            `${invoking.name} is not allowed to run sudo on this system`,
          );
        if (invokingUid !== 0 && !noPassword) {
          if (nonInteractive)
            throw new Error(
              "a password is required (use an interactive sudo prompt)",
            );
          const supplied = await io.promptSecret("[sudo] password: ");
          if (supplied !== invoking.password || invoking.locked)
            throw new Error("incorrect password");
        }
        if (login) {
          if (
            target.shell === "/sbin/nologin" ||
            target.shell === "/usr/sbin/nologin"
          )
            throw new Error("This account is currently not available.");
          this.userStack.push({
            uid: invokingUid,
            cwd: fs.cwd,
            env: { ...this.env },
          });
          this.contextStack.push("user");
          fs.currentUid = target.uid;
          this.env = {
            HOME: target.home,
            USER: target.name,
            LOGNAME: target.name,
            SHELL: target.shell,
            PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            PWD: target.home,
            OLDPWD: fs.cwd,
            HOSTNAME: this.env.HOSTNAME || "acs-linux",
            TERM: this.env.TERM || "xterm-256color",
            LANG: this.env.LANG || "C.UTF-8",
            SUDO_USER: invoking.name,
            SUDO_UID: String(invokingUid),
          };
          fs.cwd = target.home;
          return this.result(
            `Started simulated sudo login shell as ${target.name}. Type exit to return.\n`,
          );
        }
        if (!commandArgs.length) noArgs("sudo [-u USER] COMMAND [ARG...]");
        const commandName = commandArgs[0].split("/").at(-1);
        const logLine = `${new Date().toISOString()} ${invoking.name} : TTY=virtual ; PWD=${fs.cwd} ; USER=${target.name} ; COMMAND=${commandArgs.join(" ")}\n`;
        try {
          fs.writeFile("/var/log/auth.log", logLine, {
            append: true,
            uid: 0,
            gid: 0,
            bootstrap: true,
          });
        } catch {}
        try {
          fs.writeFile("/var/log/secure", logLine, {
            append: true,
            uid: 0,
            gid: 0,
            bootstrap: true,
          });
        } catch {}
        return this.withUid(target.uid, async () => {
          const priorEnv = this.env;
          this.env = {
            ...priorEnv,
            SUDO_USER: invoking.name,
            SUDO_UID: String(invokingUid),
            SUDO_COMMAND: commandArgs.join(" "),
            USER: target.name,
            LOGNAME: target.name,
            HOME: target.home,
          };
          try {
            return await this.runCommand(
              [commandName, ...commandArgs.slice(1)],
              io.stdin,
            );
          } finally {
            this.env = priorEnv;
          }
        });
      }
      case "su": {
        let userName = "root",
          commandText = null,
          login = false;
        const rest = [];
        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-c") {
            commandText = args[++i];
            if (!commandText) throw new Error("su: missing command after -c");
          } else if (
            args[i] === "-" ||
            args[i] === "-l" ||
            args[i] === "--login"
          )
            login = true;
          else if (args[i] === "-s") {
            i++; /* constrained shell path is informational */
          } else if (args[i].startsWith("-"))
            throw new Error(`su: unsupported option ${args[i]}`);
          else rest.push(args[i]);
        }
        if (rest[0]) userName = rest[0];
        const user = fs.getUser(userName);
        if (!user) throw new Error(`su: user ${userName} does not exist`);
        if (
          login &&
          (user.shell === "/sbin/nologin" || user.shell === "/usr/sbin/nologin")
        )
          throw new Error("This account is currently not available.");
        if (this.fs.currentUid !== 0) {
          const pass = await io.promptSecret("Password:");
          if (pass !== user.password || user.locked)
            throw new Error("su: Authentication failure");
        }
        if (commandText !== null) {
          return this.withUid(user.uid, async () => {
            if (login) {
              fs.cwd = user.home;
              this.env = {
                ...this.env,
                HOME: user.home,
                USER: user.name,
                LOGNAME: user.name,
                PWD: user.home,
              };
            }
            return this.executeLine(commandText, {
              fromSource: true,
              allowClosed: true,
            });
          });
        }
        this.userStack.push({
          uid: fs.currentUid,
          cwd: fs.cwd,
          env: { ...this.env },
        });
        this.contextStack.push("user");
        fs.currentUid = user.uid;
        if (login) {
          this.env = {
            HOME: user.home,
            USER: user.name,
            LOGNAME: user.name,
            SHELL: user.shell,
            PATH: "/usr/local/bin:/usr/bin:/bin",
            PWD: user.home,
            OLDPWD: fs.cwd,
            HOSTNAME: this.env.HOSTNAME,
            TERM: this.env.TERM,
            LANG: this.env.LANG,
          };
        } else {
          this.env.USER = user.name;
          this.env.LOGNAME = user.name;
          this.env.HOME = user.home;
        }
        fs.cwd = user.home;
        this.env.PWD = fs.cwd;
        return this.result(
          `Switched to simulated user ${user.name}. Type exit to return.\n`,
        );
      }
      case "newgrp": {
        const group = fs.getGroup(args.at(-1) || this.user.name);
        if (!group) throw new Error(`unknown group '${args.at(-1)}'`);
        if (
          this.fs.currentUid !== 0 &&
          !(this.user.groups || []).includes(group.gid) &&
          this.user.gid !== group.gid
        )
          throw new Error(`newgrp: user is not a member of '${group.name}'`);
        this.groupStack.push({ gid: this.user.gid });
        this.contextStack.push("group");
        this.user.gid = group.gid;
        return this.result(
          `New simulated shell group: ${group.name}. Type exit to return.\n`,
        );
      }
      case "useradd": {
        this.needRoot(command);
        if (!args.length)
          noArgs(
            "useradd [-m|-M] [-r] [-u UID] [-d HOME] [-c COMMENT] [-g GROUP] [-G GROUPS] [-s SHELL] USER",
          );
        let createHome = false,
          explicitNoHome = false,
          system = false;
        let uid = null,
          gid = null,
          extraGroups = [],
          shellPath = "/bin/bash",
          home = null,
          comment = "";
        let name = null;
        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === "-m" || a === "--create-home") createHome = true;
          else if (a === "-M" || a === "--no-create-home")
            explicitNoHome = true;
          else if (a === "-r" || a === "--system") system = true;
          else if (a === "-u" || a === "--uid") uid = Number(args[++i]);
          else if (a === "-g" || a === "--gid") {
            const g = fs.getGroup(args[++i]);
            if (!g) throw new Error("unknown primary group");
            gid = g.gid;
          } else if (a === "-G" || a === "--groups") {
            extraGroups = (args[++i] || "").split(",").map((x) => {
              const g = fs.getGroup(x);
              if (!g) throw new Error(`unknown group '${x}'`);
              return g.gid;
            });
          } else if (a === "-s" || a === "--shell") shellPath = args[++i];
          else if (a === "-d" || a === "--home-dir") home = args[++i];
          else if (a === "-c" || a === "--comment") comment = args[++i] || "";
          else if (a.startsWith("-"))
            throw new Error(`unsupported option ${a}`);
          else name = a;
        }
        if (!name || !/^[a-z_][a-z0-9_-]*[$]?$/.test(name))
          throw new Error("invalid user name");
        const defaultUidMin = system ? 1 : 1000,
          defaultUidMax = system ? 999 : 60000;
        if (uid === null) {
          const taken = new Set(Object.values(fs.users).map((u) => u.uid));
          uid = defaultUidMin;
          while (taken.has(uid) && uid <= defaultUidMax) uid++;
          if (uid > defaultUidMax)
            throw new Error("no available UID in simulated range");
        }
        if (
          fs.users[name] ||
          Object.values(fs.users).some((u) => u.uid === uid)
        )
          throw new Error("user or UID already exists");
        if (!Number.isInteger(uid) || uid < 1) throw new Error("invalid UID");
        let primary;
        if (gid !== null) primary = gid;
        else {
          const privateGroup = fs.getGroup(name);
          if (privateGroup) primary = privateGroup.gid;
          else {
            let groupId = system ? 1 : uid;
            while (Object.values(fs.groups).some((g) => g.gid === groupId))
              groupId++;
            fs.groups[name] = { name, gid: groupId, members: [] };
            primary = groupId;
          }
        }
        const userHome = home || `/home/${name}`;
        const user = {
          name,
          uid,
          gid: primary,
          comment: comment || name,
          home: userHome,
          shell: shellPath,
          password: "",
          locked: true,
          groups: [...new Set([primary, ...extraGroups])],
          aging: {},
        };
        fs.users[name] = user;
        for (const groupId of user.groups) {
          const g = fs.getGroup(groupId);
          if (g && !g.members.includes(name)) g.members.push(name);
        }
        if (createHome || (!explicitNoHome && !system)) {
          fs.mkdir(userHome, { uid, gid: primary, parents: true });
          try {
            fs.copy("/etc/skel/.bashrc", `${userHome}/.bashrc`, {
              preserve: true,
            });
          } catch {}
          try {
            fs.copy("/etc/skel/.bash_profile", `${userHome}/.bash_profile`, {
              preserve: true,
            });
          } catch {}
        }
        fs.refreshAccountFiles();
        return this.result();
      }
      case "userdel": {
        this.needRoot(command);
        const name = args.at(-1),
          user = fs.getUser(name);
        if (!user || user.uid === 0 || user.uid === this.fs.currentUid)
          throw new Error(`cannot delete user '${name}'`);
        fs.removeAccountHomeIfRequested(
          user,
          args.includes("-r") || args.includes("--remove"),
        );
        delete fs.users[user.name];
        for (const group of Object.values(fs.groups))
          group.members = group.members.filter((m) => m !== user.name);
        fs.refreshAccountFiles();
        return this.result();
      }
      case "usermod": {
        this.needRoot(command);
        if (args.length < 2)
          noArgs(
            "usermod [-aG GROUPS] [-g GROUP] [-c COMMENT] [-s SHELL] [-d HOME [-m]] [-L|-U] USER",
          );
        let append = false,
          extraGroups = null,
          primary = null,
          comment = null,
          shellPath = null,
          home = null,
          moveHome = false,
          lock = null;
        const name = args.at(-1);
        for (let i = 0; i < args.length - 1; i++) {
          const a = args[i];
          if (a === "-aG") {
            append = true;
            extraGroups = (args[++i] || "").split(",").map((x) => {
              const g = fs.getGroup(x);
              if (!g) throw new Error(`unknown group '${x}'`);
              return g.gid;
            });
          } else if (a === "-G" || a === "--groups") {
            append = false;
            extraGroups = (args[++i] || "").split(",").map((x) => {
              const g = fs.getGroup(x);
              if (!g) throw new Error(`unknown group '${x}'`);
              return g.gid;
            });
          } else if (a === "-g") {
            const g = fs.getGroup(args[++i]);
            if (!g) throw new Error("unknown group");
            primary = g.gid;
          } else if (a === "-c") {
            comment = args[++i] ?? "";
          } else if (a === "-s") {
            shellPath = args[++i];
          } else if (a === "-d") {
            home = args[++i];
          } else if (a === "-m") {
            moveHome = true;
          } else if (a === "-L" || a === "--lock") lock = true;
          else if (a === "-U" || a === "--unlock") lock = false;
          else throw new Error(`unsupported option ${a}`);
        }
        const user = fs.getUser(name);
        if (!user) throw new Error(`user '${name}' does not exist`);
        const previousPrimary = user.gid;
        if (primary !== null) user.gid = primary;
        if (comment !== null) user.comment = comment;
        if (shellPath !== null) user.shell = shellPath;
        if (home !== null) {
          if (moveHome) {
            try {
              fs.rename(user.home, home);
            } catch (e) {
              throw new Error(`could not move home directory: ${e.message}`);
            }
          }
          user.home = home;
        }
        if (lock !== null) user.locked = lock;
        const previousSupplementary = (user.groups || []).filter(
          (gid) => gid !== previousPrimary,
        );
        const supplementary =
          extraGroups !== null
            ? append
              ? [...previousSupplementary, ...extraGroups]
              : extraGroups
            : previousSupplementary;
        user.groups = [...new Set([user.gid, ...supplementary])];
        for (const group of Object.values(fs.groups))
          group.members = group.members.filter(
            (member) => member !== user.name,
          );
        for (const gid of user.groups) {
          const g = fs.getGroup(gid);
          if (g && !g.members.includes(user.name)) g.members.push(user.name);
        }
        fs.refreshAccountFiles();
        return this.result();
      }
      case "groupadd": {
        this.needRoot(command);
        let gid = null,
          system = false,
          force = false,
          name = null;
        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-g" || args[i] === "--gid") {
            const value = args[++i];
            if (value === undefined)
              noArgs("groupadd [-f] [-r] [-g GID] GROUP");
            gid = Number(value);
          } else if (args[i] === "-r" || args[i] === "--system") system = true;
          else if (args[i] === "-f" || args[i] === "--force") force = true;
          else if (args[i].startsWith("-"))
            throw new Error(`unsupported option ${args[i]}`);
          else if (name === null) name = args[i];
          else throw new Error("groupadd accepts exactly one group name");
        }
        if (!name || name.startsWith("-"))
          noArgs("groupadd [-f] [-r] [-g GID] GROUP");
        if (!/^[a-z_][a-z0-9_-]*[$]?$/.test(name))
          throw new Error("invalid group name");

        // Match shadow-utils groupadd -f: an existing group is a successful
        // no-op. This is especially useful for repeatable exercise setup.
        if (fs.groups[name]) {
          if (force) return this.result();
          throw new Error("invalid or existing group name/ID");
        }

        if (gid !== null && (!Number.isInteger(gid) || gid < 1))
          throw new Error("invalid or existing group name/ID");
        const usedGids = new Set(
          Object.values(fs.groups).map((group) => group.gid),
        );
        if (gid !== null && usedGids.has(gid)) {
          if (!force) throw new Error("invalid or existing group name/ID");
          // -f with a requested but occupied GID falls back to an unused ID.
          gid = null;
        }
        if (gid === null) {
          gid = system ? 1 : 1000;
          while (usedGids.has(gid)) gid++;
        }
        fs.groups[name] = { name, gid, members: [] };
        fs.refreshAccountFiles();
        return this.result();
      }
      case "groupdel": {
        this.needRoot(command);
        const group = fs.getGroup(args.at(-1));
        if (
          !group ||
          group.gid === 0 ||
          Object.values(fs.users).some((user) => user.gid === group.gid)
        )
          throw new Error(
            `cannot delete group '${args.at(-1)}' because it is missing, protected, or still used as a primary group`,
          );
        delete fs.groups[group.name];
        for (const user of Object.values(fs.users))
          user.groups = (user.groups || []).filter((gid) => gid !== group.gid);
        group.members = [];
        fs.refreshAccountFiles();
        return this.result();
      }
      case "groupmod": {
        this.needRoot(command);
        const group = fs.getGroup(args.at(-1));
        if (!group) throw new Error("group not found");
        const gIndex = args.indexOf("-g"),
          nIndex = args.indexOf("-n");
        if (gIndex >= 0) {
          const nextGid = Number(args[gIndex + 1]);
          if (
            !Number.isInteger(nextGid) ||
            nextGid < 1 ||
            Object.values(fs.groups).some(
              (c) => c !== group && c.gid === nextGid,
            )
          )
            throw new Error("invalid or already-used group ID");
          const old = group.gid;
          group.gid = nextGid;
          for (const user of Object.values(fs.users)) {
            if (user.gid === old) user.gid = nextGid;
            user.groups = [
              ...new Set(user.groups.map((g) => (g === old ? nextGid : g))),
            ];
          }
        }
        if (nIndex >= 0) {
          const name = args[nIndex + 1];
          if (!name || !/^[a-z_][a-z0-9_-]*[$]?$/.test(name) || fs.groups[name])
            throw new Error("invalid or existing group name");
          delete fs.groups[group.name];
          group.name = name;
          fs.groups[name] = group;
        }
        fs.refreshAccountFiles();
        return this.result();
      }
      case "passwd": {
        const userArgument = args.find((arg) => !arg.startsWith("-"));
        const statusOnly = args.includes("-S") || args.includes("--status");
        const lock = args.includes("-l") || args.includes("--lock");
        const unlock = args.includes("-u") || args.includes("--unlock");
        const stdinMode = args.includes("--stdin");
        const target = fs.getUser(userArgument || this.user.name);
        if (!target)
          throw new Error(`passwd: user '${userArgument}' does not exist`);
        if (target.uid !== fs.currentUid && fs.currentUid !== 0)
          throw new Error("passwd: permission denied");
        if (statusOnly) {
          const state = target.locked ? "L" : target.password ? "P" : "NP";
          return this.result(
            `${target.name} ${state} ${target.aging.lastChange ?? "today"} ${target.aging.min ?? 0} ${target.aging.max ?? 90} ${target.aging.warn ?? 7} ${target.aging.inactive ?? -1} ${target.aging.expire ?? -1}\n`,
          );
        }
        if (lock || unlock) {
          this.needRoot("passwd");
          if (lock) target.locked = true;
          if (unlock) target.locked = false;
          fs.refreshAccountFiles();
          return this.result(
            `passwd: password ${lock ? "locked" : "unlocked"} for ${target.name}\n`,
          );
        }
        if (stdinMode) {
          this.needRoot("passwd");
          const value = String(io.stdin || "").replace(/\r?\n$/, "");
          if (!value)
            throw new Error("passwd: no password supplied on standard input");
          target.password = value;
          target.locked = false;
          fs.refreshAccountFiles();
          return this.result("passwd: password updated successfully\n");
        }
        let nextPassword;
        if (args.length > (userArgument ? 1 : 0)) nextPassword = args.at(-1);
        else {
          const first = await io.promptSecret("New password: ");
          const second = await io.promptSecret("Retype new password: ");
          if (first !== second)
            throw new Error("Sorry, passwords do not match");
          nextPassword = first;
        }
        if (!nextPassword) throw new Error("password may not be empty");
        target.password = String(nextPassword);
        target.locked = false;
        target.aging.lastChange = new Date().toISOString().slice(0, 10);
        fs.refreshAccountFiles();
        return this.result("passwd: password updated successfully\n");
      }
      case "chpasswd": {
        this.needRoot(command);
        const encrypted = args.includes("-e") || args.includes("--encrypted");
        const rows = io.stdin.trim().split(/\r?\n/).filter(Boolean);
        if (!rows.length)
          throw new Error(
            "provide user:password pairs on standard input, e.g. echo 'student:newpass' | chpasswd",
          );
        for (const row of rows) {
          const i = row.indexOf(":");
          if (i < 1) throw new Error("invalid user:password line");
          const user = fs.getUser(row.slice(0, i));
          if (!user) throw new Error(`unknown user '${row.slice(0, i)}'`);
          user.password = row.slice(i + 1);
          user.locked = false;
          user.aging.lastChange = Math.floor(Date.now() / 86400000);
        }
        fs.refreshAccountFiles();
        return this.result(
          encrypted
            ? "Updated simulated password fields (encrypted mode is not security-validated).\n"
            : "Updated simulated passwords.\n",
        );
      }
      case "chage": {
        const user = fs.getUser(args.at(-1) || this.user.name);
        if (!user) throw new Error("unknown user");
        if (this.fs.currentUid !== 0 && user.uid !== this.fs.currentUid)
          throw new Error("permission denied");
        if (args.includes("-l") || args.includes("--list")) {
          return this.result(
            `Last password change\t\t: ${user.aging.lastChange ?? "today"}\nMinimum days between change\t: ${user.aging.min ?? 0}\nMaximum days between change\t: ${user.aging.max ?? 90}\nWarning days\t\t: ${user.aging.warn ?? 7}\nInactive days\t\t: ${user.aging.inactive ?? "never"}\nAccount expires\t\t: ${user.aging.expire ?? "never"}\n`,
          );
        }
        let changed = false;
        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-m") {
            user.aging.min = Number(args[++i]);
            changed = true;
          } else if (args[i] === "-M") {
            user.aging.max = Number(args[++i]);
            changed = true;
          } else if (args[i] === "-W") {
            user.aging.warn = Number(args[++i]);
            changed = true;
          } else if (args[i] === "-I") {
            user.aging.inactive = Number(args[++i]);
            changed = true;
          } else if (args[i] === "-d") {
            user.aging.lastChange = args[++i] === "0" ? 0 : args[i];
            changed = true;
          } else if (args[i] === "-E") {
            user.aging.expire = args[++i];
            changed = true;
          } else if (args[i].startsWith("-"))
            throw new Error(`unsupported chage option ${args[i]}`);
        }
        if (!changed)
          throw new Error(
            "supported: chage -l USER or chage [-m MIN] [-M MAX] [-W WARN] [-I INACTIVE] [-E DATE] USER",
          );
        fs.refreshAccountFiles();
        return this.result();
      }
      case "visudo": {
        this.needRoot(command);
        let target = "/etc/sudoers",
          check = false;
        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-c" || args[i] === "--check") check = true;
          else if (args[i] === "-f" || args[i] === "--file")
            target = args[++i] || noArgs("visudo [-c] [-f FILE]");
          else if (args[i] === "-cf" || args[i] === "-fc") {
            check = true;
            target = args[++i] || noArgs("visudo -cf FILE");
          } else if (args[i].startsWith("-"))
            throw new Error(`visudo: unsupported option ${args[i]}`);
        }
        const validate = (text) => {
          const errors = [];
          for (const [index, raw] of String(text).split(/\r?\n/).entries()) {
            const line = raw.replace(/#.*$/, "").trim();
            if (!line) continue;
            if (
              /^(Defaults\b|@include\b|#include\b|@includedir\b|#includedir\b)/.test(
                line,
              )
            )
              continue;
            if (
              !/^([%A-Za-z0-9_.-]+)\s+ALL\s*=\s*\([^)]*\)\s*(?:(?:NOPASSWD|PASSWD):\s*)?\S/.test(
                line,
              )
            )
              errors.push(`line ${index + 1}: syntax error`);
          }
          return errors;
        };
        let value = "";
        try {
          value = fs.readFile(target);
        } catch (error) {
          if (check) throw error;
        }
        if (check) {
          const errors = validate(value);
          return errors.length
            ? this.result(errors.join("\n") + "\n", "", 1)
            : this.result(`${target}: parsed OK\n`);
        }
        await io.openEditor(target, value, (text) => {
          const errors = validate(text);
          if (errors.length) throw new Error(errors.join("; "));
          fs.writeFile(target, text, {
            uid: 0,
            gid: 0,
            mode: 0o440,
            bootstrap: true,
          });
        });
        return this.result();
      }
      case "scp": {
        if (args.length !== 2) noArgs("scp SOURCE DEST");
        if (args.some((p) => p.includes(":")))
          throw new Error(
            "remote SCP is unavailable: this browser simulation has no SSH server; only local virtual paths can be copied",
          );
        fs.copy(args[0], args[1], { recursive: true });
        return this.result(
          "Copied within the virtual filesystem (local simulation).\n",
        );
      }
      case "crontab": {
        let target = this.user.name,
          list = false,
          remove = false,
          edit = false,
          interactive = false;
        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-u") target = args[++i];
          else if (args[i] === "-l") list = true;
          else if (args[i] === "-r") remove = true;
          else if (args[i] === "-e") edit = true;
          else if (args[i] === "-i" || args[i] === "--interactive")
            interactive = true;
          else if (args[i].startsWith("-"))
            throw new Error(`crontab: unsupported option ${args[i]}`);
        }
        if (target !== this.user.name && this.fs.currentUid !== 0)
          throw new Error(
            "crontab: only root may inspect another user's crontab",
          );
        const user = fs.getUser(target);
        if (!user) throw new Error(`crontab: user '${target}' does not exist`);
        const path = `/var/spool/cron/crontabs/${target}`;
        if (remove) {
          if (interactive) {
            const answer = io.promptText
              ? await io.promptText(`Remove crontab for ${target}? [y/N] `)
              : "n";
            if (!/^y(es)?$/i.test(answer.trim()))
              return this.result("crontab: not removed\n");
          }
          fs.remove(path, { force: true });
          return this.result();
        }
        if (edit) {
          let initial = "";
          try {
            initial = fs.readFile(path);
          } catch {}
          await io.openEditor(path, initial, (value) =>
            fs.writeFile(path, value, {
              uid: user.uid,
              gid: user.gid,
              mode: 0o600,
              bootstrap: true,
            }),
          );
          return this.result();
        }
        if (list) {
          try {
            return this.result(fs.readFile(path));
          } catch {
            return this.result("no crontab for " + target + "\n", "", 1);
          }
        }
        if (args.length) {
          const source = fs.readFile(args.at(-1));
          fs.writeFile(path, source, {
            uid: user.uid,
            gid: user.gid,
            mode: 0o600,
            bootstrap: true,
          });
          return this.result();
        }
        return this.result("usage: crontab [-u USER] -l|-r|-e [FILE]\n");
      }
      case "kill": {
        const signals = [
          "HUP",
          "INT",
          "QUIT",
          "ILL",
          "TRAP",
          "ABRT",
          "BUS",
          "FPE",
          "KILL",
          "USR1",
          "SEGV",
          "USR2",
          "PIPE",
          "ALRM",
          "TERM",
          "CHLD",
          "CONT",
          "STOP",
          "TSTP",
          "TTIN",
          "TTOU",
        ];
        if (args.includes("-l") || args.includes("--list"))
          return this.result(
            signals.map((s, i) => `${i + 1}) SIG${s}`).join("\n") + "\n",
          );
        let signal = "TERM",
          pidArg = null;
        for (let i = 0; i < args.length; i++) {
          if (args[i] === "-s" || args[i] === "--signal")
            signal = String(args[++i] || "TERM").replace(/^SIG/, "");
          else if (args[i].startsWith("-") && /^-[A-Za-z]+$/.test(args[i]))
            signal = args[i].slice(1).replace(/^SIG/, "");
          else pidArg = args[i];
        }
        const pid = Number(pidArg);
        if (!pidArg || !Number.isInteger(pid) || pid < 0)
          throw new Error("usage: kill [-s SIGNAL] PID");
        if (!signals.includes(signal))
          throw new Error(`kill: invalid signal ${signal}`);
        const known = new Set([1000, 1001]);
        if (!known.has(pid))
          throw new Error(`kill: (${pid}) - No such process`);
        if (signal === "0") return this.result();
        if (pid === 1000 && this.fs.currentUid !== 0) {
          this.closed = true;
          return this.result(
            `[Simulated process ${pid} received SIG${signal}.]\n`,
          );
        }
        return this.result(
          `[Simulated process ${pid} received SIG${signal}.]\n`,
        );
      }
      case "vimtutor":
        return this.result(
          "Vim tutorial: press i to insert, Esc for Normal mode, :wq to save and quit, :q! to discard. Use h/j/k/l to move, dd to delete a line, yy to yank a line, p to paste, u to undo, /text to search.\n",
        );
      case "gzip":
      case "gunzip": {
        let keep = false,
          decompress = command === "gunzip",
          toStdout = false,
          force = false,
          list = false,
          verbose = false;
        const files = [];
        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === "-k" || a === "--keep") keep = true;
          else if (a === "-d" || a === "--decompress") decompress = true;
          else if (a === "-c" || a === "--stdout") toStdout = true;
          else if (a === "-f" || a === "--force") force = true;
          else if (a === "-l" || a === "--list") list = true;
          else if (a === "-v" || a === "--verbose") verbose = true;
          else if (a.startsWith("-"))
            throw new Error(`gzip: unsupported option ${a}`);
          else files.push(a);
        }
        if (!files.length) noArgs(`${command} [-k|-d|-c|-l] FILE...`);
        let stdout = "",
          messages = "";
        for (const path of files) {
          if (list) {
            const raw = JSON.parse(fs.readFile(path));
            if (raw.format !== "acs-simulated-gzip-v1")
              throw new Error("not an ACS simulated gzip file");
            messages += `${String(byteLength(raw.content)).padStart(10)} ${String(byteLength(fs.readFile(path))).padStart(10)} ${path}\n`;
            continue;
          }
          if (decompress) {
            const raw = JSON.parse(fs.readFile(path));
            if (raw.format !== "acs-simulated-gzip-v1")
              throw new Error(
                "not an ACS simulated gzip file (GNU gzip streams are not supported)",
              );
            if (toStdout) stdout += raw.content;
            else {
              const target = path.endsWith(".gz")
                ? path.slice(0, -3)
                : path + ".out";
              if (!force) {
                try {
                  fs.resolve(target);
                  throw new Error(`output file '${target}' already exists`);
                } catch (e) {
                  if (!String(e.message).startsWith("No such file")) throw e;
                }
              }
              fs.writeFile(target, raw.content);
              if (!keep) fs.remove(path, { force: true });
              if (verbose) messages += `${path}: decompressed to ${target}\n`;
            }
          } else {
            const content = fs.readFile(path),
              target = path + ".gz";
            const wrapper = JSON.stringify({
              format: "acs-simulated-gzip-v1",
              name: path.split("/").at(-1),
              content,
            });
            if (toStdout) stdout += wrapper;
            else {
              if (!force) {
                try {
                  fs.resolve(target);
                  throw new Error(`output file '${target}' already exists`);
                } catch (e) {
                  if (!String(e.message).startsWith("No such file")) throw e;
                }
              }
              fs.writeFile(target, wrapper);
              if (!keep) fs.remove(path, { force: true });
              if (verbose)
                messages += `${path}: compressed to ${target} (private simulation format)\n`;
            }
          }
        }
        if (list) return this.result(messages);
        return this.result(stdout + messages);
      }
      case "tar": {
        if (!args.length)
          noArgs("tar -c|x|t -f ARCHIVE [-z|-j|-J] [-v] [-C DIR] [PATHS...]");
        let mode = null,
          archive = null,
          baseDir = null,
          verbose = false,
          absoluteNames = false,
          compression = "none";
        const paths = [];
        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === "-C" || a === "--directory") {
            baseDir = args[++i];
            if (!baseDir) throw new Error("tar: missing directory after -C");
            continue;
          }
          if (a === "-f" || a === "--file") {
            archive = args[++i];
            if (!archive) throw new Error("tar: missing archive name after -f");
            continue;
          }
          if (a === "--create") mode = "c";
          else if (a === "--extract") mode = "x";
          else if (a === "--list") mode = "t";
          else if (a === "--verbose") verbose = true;
          else if (a === "--absolute-names") absoluteNames = true;
          else if (a === "--gzip") compression = "gzip";
          else if (a === "--bzip2") compression = "bzip2";
          else if (a === "--xz") compression = "xz";
          else if (a.startsWith("-") && a !== "-") {
            const cluster = a.slice(1);
            for (let j = 0; j < cluster.length; j++) {
              const f = cluster[j];
              if ("cxt".includes(f)) {
                if (mode && mode !== f)
                  throw new Error("tar: choose only one of -c, -x, or -t");
                mode = f;
              } else if (f === "f") {
                archive = args[++i];
                if (!archive)
                  throw new Error("tar: missing archive name after -f");
                break;
              } else if (f === "v") verbose = true;
              else if (f === "P") absoluteNames = true;
              else if (f === "z") compression = "gzip";
              else if (f === "j") compression = "bzip2";
              else if (f === "J") compression = "xz";
              else throw new Error(`tar: unsupported option -${f}`);
            }
          } else paths.push(a);
        }
        if (!mode || !archive)
          noArgs("tar -c|x|t -f ARCHIVE [OPTIONS] [PATHS...]");
        if (mode === "c") {
          if (!paths.length) noArgs("tar -cf ARCHIVE PATH...");
          const origin = fs.cwd,
            base = baseDir ? fs.nodePath(fs.resolve(baseDir).node) : origin;
          const records = [];
          for (const path of paths) {
            const absolute = path.startsWith("/")
              ? path
              : `${base.replace(/[/]+$/, "")}/${path}`;
            const node = fs.resolve(absolute, { followFinal: false }).node;
            const nodePath = fs.nodePath(node);
            let member;
            if (absoluteNames) member = nodePath;
            else if (path.startsWith("/")) member = nodePath.replace(/^\//, "");
            else {
              const basePath = fs.nodePath(fs.resolve(baseDir || ".").node);
              member =
                nodePath === basePath
                  ? "."
                  : nodePath.slice(basePath === "/" ? 1 : basePath.length + 1);
            }
            records.push({ path: member, node: fs.serializeNode(node) });
          }
          fs.writeFile(
            archive,
            JSON.stringify({
              format: "acs-virtual-tar-v2",
              compression,
              records,
            }),
          );
          return this.result(
            verbose
              ? records.map((r) => r.path).join("\n") + "\n"
              : "Created constrained virtual archive (JSON-backed; not a GNU tar stream; compression is metadata-only).\n",
          );
        }
        const data = JSON.parse(fs.readFile(archive));
        if (!["acs-virtual-tar-v1", "acs-virtual-tar-v2"].includes(data.format))
          throw new Error("unsupported archive format");
        if (mode === "t") {
          const rows = (data.records || []).map((r) =>
            verbose ? `${modeOctal(r.node.mode)} ${r.path}` : r.path,
          );
          return this.result(rows.join("\n") + "\n");
        }
        const destination = baseDir || fs.cwd;
        const destNode = fs.resolve(destination).node;
        let stdout = "";
        if (destNode.type !== "directory")
          throw new Error(`tar: '${destination}' is not a directory`);
        fs.require(destNode, "wx", destination);
        const dest = fs.nodePath(destNode);
        for (const record of data.records || []) {
          let member = String(record.path || "");
          if (!absoluteNames && !member.startsWith("/"))
            member = member.replace(/^[/]+/, "");
          if (!absoluteNames) member = member.replace(/^\//, "");
          const parts = member.split("/").filter(Boolean);
          if (parts.some((p) => p === ".." || p === "."))
            throw new Error("tar: unsafe path in archive");
          let target;
          if (absoluteNames && member.startsWith("/")) target = member;
          else
            target = [dest === "/" ? "" : dest, ...parts]
              .filter(Boolean)
              .join("/");
          if (!target.startsWith("/")) target = "/" + target;
          restoreArchiveNode(fs, record.node, target);
          if (verbose) stdout += target + "\n";
        }
        return this.result(
          verbose ? stdout : "Extracted constrained virtual archive.\n",
        );
      }
      default:
        throw new Error(
          "command is recognized but not available in this profile",
        );
    }
  }
  async withUid(uid, task) {
    const oldUid = this.fs.currentUid,
      oldCwd = this.fs.cwd;
    const oldEnv = { ...this.env };
    this.fs.currentUid = uid;
    try {
      return await task();
    } finally {
      this.fs.currentUid = oldUid;
      this.fs.cwd = oldCwd;
      this.env = oldEnv;
    }
  }
  serialize() {
    return {
      env: this.env,
      exported: [...this.exported],
      aliases: [...this.aliases],
      history: this.history.slice(-500),
      commandRecords: this.commandRecords.slice(-500).map((record) => ({
        command: safeText(record.command).slice(0, 8192),
        output: safeText(record.output).slice(0, 8192),
        outputCaptured: Boolean(record.outputCaptured),
        status: Number.isInteger(record.status) ? record.status : null,
      })),
      lastStatus: this.lastStatus,
      positionals: this.positionals,
      zero: this.zero,
      options: this.options,
      closed: this.closed,
      userStack: this.userStack,
      groupStack: this.groupStack,
      shellStack: this.shellStack,
      contextStack: this.contextStack,
    };
  }
  restore(data) {
    if (!ownPlain(data)) return;
    if (ownPlain(data.env))
      this.env = {
        ...this.env,
        ...Object.fromEntries(
          Object.entries(data.env).filter(
            ([k, v]) =>
              /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) && typeof v === "string",
          ),
        ),
      };
    if (Array.isArray(data.exported))
      this.exported = new Set(
        data.exported.filter((x) => typeof x === "string"),
      );
    if (Array.isArray(data.aliases))
      this.aliases = new Map(
        data.aliases.filter(
          (x) =>
            Array.isArray(x) &&
            typeof x[0] === "string" &&
            typeof x[1] === "string",
        ),
      );
    if (Array.isArray(data.history))
      this.history = data.history
        .filter((x) => typeof x === "string")
        .slice(-500);
    if (Array.isArray(data.commandRecords))
      this.commandRecords = data.commandRecords
        .filter(
          (record) =>
            ownPlain(record) &&
            typeof record.command === "string" &&
            typeof record.output === "string",
        )
        .slice(-500)
        .map((record) => ({
          command: record.command.slice(0, 8192),
          output: record.output.slice(0, 8192),
          outputCaptured: record.outputCaptured === true,
          status: Number.isInteger(record.status) ? record.status : null,
        }));
    else if (Array.isArray(data.history))
      this.commandRecords = this.history.map((command) => ({
        command,
        output: "",
        outputCaptured: false,
        status: null,
      }));
    if (Number.isInteger(data.lastStatus)) this.lastStatus = data.lastStatus;
    if (Array.isArray(data.positionals))
      this.positionals = data.positionals.map(String);
    if (typeof data.zero === "string") this.zero = data.zero;
    if (ownPlain(data.options))
      this.options = {
        errexit: Boolean(data.options.errexit),
        nounset: Boolean(data.options.nounset),
      };
    this.closed = Boolean(data.closed);
    this.userStack = Array.isArray(data.userStack)
      ? data.userStack
          .filter(
            (x) =>
              ownPlain(x) &&
              Number.isInteger(x.uid) &&
              typeof x.cwd === "string" &&
              ownPlain(x.env),
          )
          .slice(-8)
      : [];
    this.groupStack = Array.isArray(data.groupStack)
      ? data.groupStack.filter((x) => Number.isInteger(x.gid)).slice(-8)
      : [];
    this.shellStack = Array.isArray(data.shellStack)
      ? data.shellStack.filter(ownPlain).slice(-20)
      : [];
    this.contextStack = Array.isArray(data.contextStack)
      ? data.contextStack
          .filter((x) => ["user", "group", "shell"].includes(x))
          .slice(-60)
      : [];
    this.env.PWD = this.fs.cwd;
    this.env.USER = this.user.name;
  }
}

function parseMode(spec, baseMode = "000", isDirectory = false) {
  const text = String(spec);
  if (/^[0-7]{3,4}$/.test(text)) return parseInt(text, 8) & 0o7777;
  let mode = parseInt(String(baseMode), 8) & 0o7777;
  const clauses = text.split(",");
  for (const clause of clauses) {
    const m = clause.match(/^([ugoa]*)([+=-])([rwxXst]*)$/);
    if (!m) throw new Error(`invalid mode: '${spec}'`);
    const who = m[1] || "a",
      op = m[2],
      perms = m[3];
    let mask = 0,
      special = 0;
    if (who.includes("u") || who === "a") {
      if (perms.includes("r")) mask |= 0o400;
      if (perms.includes("w")) mask |= 0o200;
      if (
        perms.includes("x") ||
        (perms.includes("X") && (isDirectory || mode & 0o111))
      )
        mask |= 0o100;
      if (perms.includes("s")) special |= 0o4000;
    }
    if (who.includes("g") || who === "a") {
      if (perms.includes("r")) mask |= 0o040;
      if (perms.includes("w")) mask |= 0o020;
      if (
        perms.includes("x") ||
        (perms.includes("X") && (isDirectory || mode & 0o111))
      )
        mask |= 0o010;
      if (perms.includes("s")) special |= 0o2000;
    }
    if (who.includes("o") || who === "a") {
      if (perms.includes("r")) mask |= 0o004;
      if (perms.includes("w")) mask |= 0o002;
      if (
        perms.includes("x") ||
        (perms.includes("X") && (isDirectory || mode & 0o111))
      )
        mask |= 0o001;
      if (perms.includes("t")) special |= 0o1000;
    }
    if (op === "+") mode |= mask | special;
    else if (op === "-") mode &= ~(mask | special);
    else {
      const clear =
        (who.includes("u") || who === "a" ? 0o700 | 0o4000 : 0) |
        (who.includes("g") || who === "a" ? 0o070 | 0o2000 : 0) |
        (who.includes("o") || who === "a" ? 0o007 | 0o1000 : 0);
      mode = (mode & ~clear) | mask | special;
    }
  }
  return mode & 0o7777;
}
function restoreArchiveNode(fs, raw, targetPath) {
  if (!raw || !["file", "directory", "symlink"].includes(raw.type))
    throw new Error("Archive contains an unsupported virtual node");
  const parts = targetPath.split("/").filter(Boolean),
    name = parts.pop();
  if (!name)
    throw new Error("Archive entry cannot replace the virtual filesystem root");
  const parentPath = "/" + parts.join("/");
  fs.mkdir(parentPath, { parents: true });
  const parent = fs.resolve(parentPath).node;
  if (parent.children.has(name)) return;
  const build = (data, parentNode, nodeName) => {
    const mode = Number(data.mode) & 0o7777,
      uid = Number.isInteger(data.uid) ? data.uid : 0,
      gid = Number.isInteger(data.gid) ? data.gid : 0;
    let node;
    if (data.type === "directory")
      node = fs.makeNode("directory", nodeName, parentNode, uid, gid, mode);
    else if (data.type === "symlink")
      node = fs.makeNode(
        "symlink",
        nodeName,
        parentNode,
        uid,
        gid,
        0o777,
        "",
        data.target || "",
      );
    else
      node = fs.makeNode(
        "file",
        nodeName,
        parentNode,
        uid,
        gid,
        mode,
        data.content || "",
      );
    node.ctime = Number(data.ctime) || node.ctime;
    node.mtime = Number(data.mtime) || node.mtime;
    node.atime = Number(data.atime) || node.atime;
    if (data.type === "directory") {
      if (!Array.isArray(data.children))
        throw new Error("Archive directory has invalid children");
      for (const child of data.children) {
        if (node.children.has(child.name))
          throw new Error("Archive contains duplicate directory entries");
        node.children.set(child.name, build(child, node, child.name));
      }
    }
    return node;
  };
  parent.children.set(name, build(raw, parent, name));
}

function generateFromRegex(input, options = {}) {
  const maxRepeat = options.maxRepeat ?? 3;
  const maxAttempts = options.maxAttempts ?? 100;

  let source;
  let flags = "";

  if (input instanceof RegExp) {
    source = input.source;
    flags = input.flags;
  } else {
    source = String(input);

    // Support common inline dotAll syntax.
    if (source.startsWith("(?s)")) {
      source = source.slice(4);
      flags += "s";
    }
  }

  const original = new RegExp(source, flags);

  let pos = 0;

  function peek() {
    return source[pos];
  }

  function consume() {
    return source[pos++];
  }

  function parseExpression() {
    const alternatives = [parseSequence()];

    while (peek() === "|") {
      consume();
      alternatives.push(parseSequence());
    }

    return { type: "alt", alternatives };
  }

  function parseSequence() {
    const nodes = [];

    while (pos < source.length && peek() !== ")" && peek() !== "|") {
      nodes.push(parseQuantified());
    }

    return { type: "seq", nodes };
  }

  function parseQuantified() {
    let node = parseAtom();
    let min = 1;
    let max = 1;

    if (peek() === "*") {
      consume();
      min = 0;
      max = maxRepeat;
    } else if (peek() === "+") {
      consume();
      min = 1;
      max = maxRepeat;
    } else if (peek() === "?") {
      consume();
      min = 0;
      max = 1;
    } else if (peek() === "{") {
      const remaining = source.slice(pos);
      const match = remaining.match(/^\{(\d+)(?:,(\d*))?\}/);

      if (match) {
        pos += match[0].length;
        min = Number(match[1]);

        max =
          match[2] === undefined
            ? min
            : match[2] === ""
              ? maxRepeat
              : Math.min(Number(match[2]), maxRepeat);
      }
    }

    if (min !== 1 || max !== 1) {
      node = { type: "repeat", node, min, max };
    }

    // Ignore lazy quantifier modifier.
    if (peek() === "?") consume();

    return node;
  }

  function parseAtom() {
    const char = consume();

    if (char === undefined) {
      throw new Error("Unexpected end of regex");
    }

    if (char === "^" || char === "$") {
      return { type: "empty" };
    }

    if (char === ".") {
      return { type: "dot" };
    }

    if (char === "[") {
      let content = "";
      let escaped = false;

      while (pos < source.length) {
        const c = consume();

        if (c === "]" && !escaped) break;

        content += c;

        if (c === "\\" && !escaped) {
          escaped = true;
        } else {
          escaped = false;
        }
      }

      return { type: "class", content };
    }

    if (char === "\\") {
      const escaped = consume();

      if (escaped === undefined) {
        throw new Error("Incomplete escape");
      }

      if (escaped === "d") return { type: "literal", value: "0" };
      if (escaped === "w") return { type: "literal", value: "a" };
      if (escaped === "s") return { type: "literal", value: " " };

      if (escaped === "D") return { type: "class", content: "^0-9" };
      if (escaped === "W") return { type: "class", content: "^a-zA-Z0-9_" };
      if (escaped === "S")
        return { type: "class", content: "^ \\t\\n\\r\\f\\v" };

      if (escaped === "n") return { type: "literal", value: "\n" };
      if (escaped === "r") return { type: "literal", value: "\r" };
      if (escaped === "t") return { type: "literal", value: "\t" };
      if (escaped === "f") return { type: "literal", value: "\f" };
      if (escaped === "v") return { type: "literal", value: "\v" };

      // Zero-width assertions.
      if ("bBAZz".includes(escaped)) {
        return { type: "empty" };
      }

      // Hexadecimal escape.
      if (escaped === "x") {
        const hex = source.slice(pos, pos + 2);
        if (!/^[0-9a-f]{2}$/i.test(hex)) {
          throw new Error("Invalid hex escape");
        }
        pos += 2;
        return {
          type: "literal",
          value: String.fromCharCode(parseInt(hex, 16)),
        };
      }

      // Unicode escape.
      if (escaped === "u") {
        const hex = source.slice(pos, pos + 4);
        if (!/^[0-9a-f]{4}$/i.test(hex)) {
          throw new Error("Invalid Unicode escape");
        }
        pos += 4;
        return {
          type: "literal",
          value: String.fromCharCode(parseInt(hex, 16)),
        };
      }

      return { type: "literal", value: escaped };
    }

    if (char === "(") {
      if (peek() === "?") {
        consume();

        if (peek() === ":") {
          consume();
        } else {
          throw new Error(
            "Lookarounds and inline group modifiers are not supported",
          );
        }
      }

      const node = parseExpression();

      if (consume() !== ")") {
        throw new Error("Unclosed group");
      }

      return node;
    }

    return { type: "literal", value: char };
  }

  function generate(node) {
    switch (node.type) {
      case "empty":
        return "";

      case "literal":
        return node.value;

      case "dot":
        return "\na".slice(1);

      case "class": {
        const regex = new RegExp("^(?:[" + node.content + "])$", flags);

        const candidates =
          "aAzZ019_ -!@#$%^&*()[]{} \t\n\r" +
          "abcdefghijklmnopqrstuvwxyz" +
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
          "0123456789";

        for (const c of candidates) {
          if (regex.test(c)) return c;
        }

        throw new Error(
          "Could not find a character for class: [" + node.content + "]",
        );
      }

      case "seq":
        return node.nodes.map(generate).join("");

      case "alt":
        return generate(node.alternatives[0]);

      case "repeat": {
        const count = node.min;
        return Array.from({ length: count }, () => generate(node.node)).join(
          "",
        );
      }

      default:
        throw new Error("Unknown AST node: " + node.type);
    }
  }

  // Try different alternatives if the first generated candidate
  // doesn't pass validation.
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = generate(parseExpression());

      if (original.test(result)) {
        return result;
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
    }

    // Reset parser for another attempt.
    pos = 0;
  }

  throw new Error(
    "Could not generate a matching string. " +
      "The pattern may use unsupported regex features.",
  );
}

function gradeFilesystem(
  fs,
  checks,
  baseDirectory = "/home/student",
  commandRecords = [],
) {
  const previousUid = fs.currentUid;
  fs.currentUid = 0; // the checker inspects metadata as a privileged internal operation
  try {
    const results = [];
    let score = 0,
      maxScore = 0;
    for (const check of checks) {
      const checkPath = check.path
        ? String(check.path).startsWith("/")
          ? String(check.path)
          : `${String(baseDirectory).replace(/\/$/, "")}/${check.path}`
        : null;
      const points =
        Number.isFinite(check.points) && check.points >= 0 ? check.points : 1;
      maxScore += points;
      let passed = false,
        feedback = "";
      let entry = null;
      try {
        if (check.type === "not_exists") {
          try {
            fs.resolve(checkPath, { followFinal: false });
            passed = false;
            feedback = "The path still exists.";
          } catch (error) {
            if (String(error.message).startsWith("No such file or directory:"))
              passed = true;
            else throw error;
          }
        } else {
          try {
            entry = fs.resolve(checkPath, {
              followFinal: check.type !== "symlink",
            }).node;
          } catch (error) {
            if (
              String(error.message).startsWith("No such file or directory:")
            ) {
              feedback = "The path does not exist.";
            } else throw error;
          }
          if (entry) {
            const actualType = entry.type;
            switch (check.type) {
              case "exists":
                passed = true;
                break;
              case "file":
                passed = actualType === "file";
                if (!passed)
                  feedback = `Expected a regular file, found ${actualType}.`;
                break;
              case "directory":
                passed = actualType === "directory";
                if (!passed)
                  feedback = `Expected a directory, found ${actualType}.`;
                break;
              case "file_type":
                passed = actualType === check.expected;
                if (!passed)
                  feedback = `Expected ${check.expected}, found ${actualType}.`;
                break;
              case "content":
                if (actualType !== "file")
                  feedback = `Expected a regular file, found ${actualType}.`;
                else {
                  const expectedContent = String(check.expected ?? "");
                  const actualContent = entry.content;
                  passed = actualContent === expectedContent;
                  if (!passed) {
                    const describe = (value) => {
                      const preview =
                        value.length > 100 ? value.slice(0, 100) + "…" : value;
                      const lines = value.length
                        ? value.split("\n").length -
                          (value.endsWith("\n") ? 1 : 0)
                        : 0;
                      return `${byteLength(value)} bytes, ${lines} line(s), ${JSON.stringify(preview)}`;
                    };
                    feedback = `Expected exactly ${describe(expectedContent)}; found ${describe(actualContent)}. Newlines, spaces, and the final newline are significant.`;
                  }
                }
                break;
              case "contains": {
                if (actualType !== "file") {
                  feedback = `Expected a regular file, found ${actualType}.`;
                  break;
                }

                let contentPassed = false;
                if (check.regex !== undefined) {
                  try {
                    const regex = new RegExp(check.expected, check.flags || "");
                    contentPassed = regex.test(entry.content);
                    if (!contentPassed)
                      feedback = `File content did not match the required pattern: ${check.regex ? generateFromRegex(check.expected) : check.expected}`;
                  } catch (error) {
                    feedback = `Invalid check regex: ${error.message}`;
                  }
                } else {
                  contentPassed = entry.content.includes(
                    String(check.expected ?? ""),
                  );
                  if (!contentPassed)
                    feedback = "Required text was not found in the file.";
                }

                // Optional command-history assertion piggybacks on the existing
                // `contains` check type so package loaders with a fixed check-type
                // list continue to accept the exercise. The command and its output
                // must match the same recorded invocation.
                passed = contentPassed;
                if (contentPassed && check.commandExpected !== undefined) {
                  try {
                    const commandRegex = new RegExp(
                      check.commandExpected,
                      check.commandFlags || "",
                    );
                    const outputRegex =
                      check.intendedOutput === undefined
                        ? null
                        : new RegExp(
                            check.intendedOutput,
                            check.intendedOutputFlags || "",
                          );
                    let commandWasRun = false;
                    let commandOutputCaptured = false;
                    let commandAndOutputMatched = false;

                    for (const record of commandRecords) {
                      commandRegex.lastIndex = 0;
                      if (!commandRegex.test(safeText(record.command)))
                        continue;
                      commandWasRun = true;
                      if (!outputRegex) {
                        commandAndOutputMatched = true;
                        break;
                      }
                      if (!record.outputCaptured) continue;
                      commandOutputCaptured = true;
                      outputRegex.lastIndex = 0;
                      if (outputRegex.test(safeText(record.output))) {
                        commandAndOutputMatched = true;
                        break;
                      }
                    }

                    passed = commandAndOutputMatched;
                    if (!passed) {
                      if (!commandWasRun)
                        feedback = `No command-history entry matched: ${check.regex ? generateFromRegex(check.commandExpected) : check.commandExpected}`;
                      else if (outputRegex && !commandOutputCaptured)
                        feedback =
                          "The command was found in history, but its output was not captured. Run it again to verify intendedOutput.";
                      else if (outputRegex)
                        feedback = `The command was run, but its output did not match: ${check.intendedOutput}`;
                      else
                        feedback =
                          "The command-history requirement was not met.";
                    }
                  } catch (error) {
                    passed = false;
                    feedback = `Invalid command-history regex: ${error.message}`;
                  }
                }
                break;
              }
              case "permissions": {
                const expected = String(check.expected)
                  .replace(/^0o/, "")
                  .replace(/^0/, "");
                passed = modeOctal(entry.mode).replace(/^0/, "") === expected;
                if (!passed)
                  feedback = `Expected mode ${check.expected}, found ${modeOctal(entry.mode)}.`;
                break;
              }
              case "owner": {
                const owner = fs.getUserByUid(entry.uid);
                passed =
                  entry.uid ===
                  (typeof check.expected === "number"
                    ? check.expected
                    : fs.getUser(check.expected)?.uid);
                if (!passed)
                  feedback = `Expected owner ${check.expected}, found ${owner?.name || entry.uid}.`;
                break;
              }
              case "group": {
                const group = fs.getGroup(check.expected);
                const gid =
                  typeof check.expected === "number"
                    ? check.expected
                    : group?.gid;
                passed = gid !== undefined && entry.gid === gid;
                if (!passed)
                  feedback = `Expected group ${check.expected}, found ${fs.getGroup(entry.gid)?.name || entry.gid}.`;
                break;
              }
              case "symlink":
                passed =
                  actualType === "symlink" &&
                  entry.target === String(check.expected ?? "");
                if (!passed)
                  feedback =
                    actualType !== "symlink"
                      ? `Expected a symbolic link, found ${actualType}.`
                      : `Expected link target '${check.expected}', found '${entry.target}'.`;
                break;
              case "size": {
                const size =
                  actualType === "file"
                    ? byteLength(entry.content)
                    : actualType === "symlink"
                      ? byteLength(entry.target)
                      : entry.children.size;
                const wanted = check.expected;
                if (typeof wanted === "number") passed = size === wanted;
                else if (ownPlain(wanted))
                  passed =
                    (wanted.exact === undefined || size === wanted.exact) &&
                    (wanted.min === undefined || size >= wanted.min) &&
                    (wanted.max === undefined || size <= wanted.max);
                if (!passed)
                  feedback = `Expected size constraint ${JSON.stringify(wanted)}, found ${size}.`;
                break;
              }
              case "empty":
                passed =
                  actualType === "file"
                    ? entry.content.length === 0
                    : actualType === "directory"
                      ? entry.children.size === 0
                      : false;
                if (!passed)
                  feedback =
                    actualType === "directory"
                      ? "Directory is not empty."
                      : actualType === "file"
                        ? "File is not empty."
                        : `Cannot apply empty check to ${actualType}.`;
                break;
              case "executable":
                passed = Boolean(entry.mode & 0o111);
                if (!passed) feedback = "No executable permission bit is set.";
                break;
              case "line_count": {
                if (actualType !== "file")
                  feedback = `Expected a regular file, found ${actualType}.`;
                else {
                  const count = entry.content.length
                    ? entry.content.split("\n").length -
                      (entry.content.endsWith("\n") ? 1 : 0)
                    : 0;
                  passed = count === Number(check.expected);
                  if (!passed)
                    feedback = `Expected ${check.expected} lines, found ${count}.`;
                }
                break;
              }
              case "directory_contents": {
                if (actualType !== "directory")
                  feedback = `Expected a directory, found ${actualType}.`;
                else {
                  const actual = [...entry.children.keys()].sort();
                  const expected = Array.isArray(check.expected)
                    ? check.expected.map(String).sort()
                    : [];
                  passed =
                    actual.length === expected.length &&
                    actual.every((name, i) => name === expected[i]);
                  if (!passed)
                    feedback = `Directory entries differ. Found: ${actual.join(", ") || "(empty)"}.`;
                }
                break;
              }
              default:
                feedback = `Unsupported check type '${check.type}'.`;
            }
          }
        }
      } catch (error) {
        feedback = `Could not inspect path: ${error.message}`;
      }
      const awarded = passed ? points : 0;
      score += awarded;
      results.push({
        id: String(check.id || `check-${results.length + 1}`),
        passed,
        pointsAwarded: awarded,
        pointsPossible: points,
        description: String(
          check.description || check.id || check.path || check.type,
        ),
        feedback: passed ? "" : feedback || "Requirement not met.",
      });
    }
    return {
      score,
      maxScore,
      passed: results.every((r) => r.passed),
      checks: results,
    };
  } finally {
    fs.currentUid = previousUid;
  }
}

function validateExercise(exercise) {
  const config = exercise?.terminal;
  if (!ownPlain(config))
    throw new Error(
      "Terminal exercise is missing its terminal configuration object",
    );
  if (
    config.profile &&
    !["basic-linux", "basic", "intro-linux"].includes(config.profile)
  )
    throw new Error(`Unsupported terminal profile '${config.profile}'`);
  if (config.checks !== undefined && !Array.isArray(config.checks))
    throw new Error("terminal.checks must be an array");
  if (!Array.isArray(config.checks) || config.checks.length === 0)
    throw new Error("terminal.checks must contain at least one grading check");
  if (
    config.solution !== undefined &&
    (!Array.isArray(config.solution) ||
      config.solution.length > 100 ||
      config.solution.some(
        (command) =>
          typeof command !== "string" ||
          !command.trim() ||
          command.length > 8192,
      ))
  )
    throw new Error(
      "terminal.solution must be an array of non-empty command strings (maximum 8192 characters each)",
    );
  if (
    config.initialFilesystem !== undefined &&
    !Array.isArray(config.initialFilesystem)
  )
    throw new Error("terminal.initialFilesystem must be an array");
  if (
    config.preSetupCommands !== undefined &&
    (!Array.isArray(config.preSetupCommands) ||
      config.preSetupCommands.length > 100 ||
      config.preSetupCommands.some(
        (command) =>
          typeof command !== "string" ||
          !command.trim() ||
          command.length > 8192,
      ))
  )
    throw new Error(
      "terminal.preSetupCommands must be an array of non-empty command strings (maximum 8192 characters each)",
    );
  const supported = new Set([
    "exists",
    "not_exists",
    "file",
    "directory",
    "content",
    "contains",
    "permissions",
    "owner",
    "group",
    "symlink",
    "size",
    "empty",
    "executable",
    "file_type",
    "line_count",
    "directory_contents",
  ]);
  for (const [i, check] of (config.checks || []).entries()) {
    if (!ownPlain(check))
      throw new Error(`terminal.checks[${i}] must be an object`);
    if (!supported.has(check.type))
      throw new Error(
        `terminal.checks[${i}] has unsupported type '${check.type}'`,
      );
    if (typeof check.path !== "string" || !check.path.trim())
      throw new Error(`terminal.checks[${i}].path must be a non-empty string`);
    if (check.commandExpected !== undefined) {
      if (check.type !== "contains")
        throw new Error(
          `terminal.checks[${i}].commandExpected is only supported on contains checks`,
        );
      if (typeof check.commandExpected !== "string" || !check.commandExpected)
        throw new Error(
          `terminal.checks[${i}].commandExpected must be a command-history regex string`,
        );
      if (check.commandExpected.length > 2048)
        throw new Error(
          `terminal.checks[${i}].commandExpected regex is too long`,
        );
      if (
        check.commandFlags !== undefined &&
        typeof check.commandFlags !== "string"
      )
        throw new Error(`terminal.checks[${i}].commandFlags must be a string`);
      if (
        check.intendedOutput !== undefined &&
        (typeof check.intendedOutput !== "string" ||
          check.intendedOutput.length > 2048)
      )
        throw new Error(
          `terminal.checks[${i}].intendedOutput must be a regex string (maximum 2048 characters)`,
        );
      if (
        check.intendedOutputFlags !== undefined &&
        typeof check.intendedOutputFlags !== "string"
      )
        throw new Error(
          `terminal.checks[${i}].intendedOutputFlags must be a string`,
        );
      try {
        new RegExp(check.commandExpected, check.commandFlags || "");
        if (check.intendedOutput !== undefined)
          new RegExp(check.intendedOutput, check.intendedOutputFlags || "");
      } catch (error) {
        throw new Error(
          `terminal.checks[${i}] has an invalid command-history regex: ${error.message}`,
        );
      }
    } else if (
      check.intendedOutput !== undefined ||
      check.intendedOutputFlags !== undefined ||
      check.commandFlags !== undefined
    ) {
      throw new Error(
        `terminal.checks[${i}] requires commandExpected when command-history options are supplied`,
      );
    }
    if (
      [
        "content",
        "contains",
        "permissions",
        "owner",
        "group",
        "symlink",
        "size",
        "file_type",
        "line_count",
        "directory_contents",
      ].includes(check.type) &&
      check.expected === undefined
    )
      throw new Error(`terminal.checks[${i}] requires expected`);
    if (
      check.points !== undefined &&
      (!Number.isFinite(check.points) || check.points < 0)
    )
      throw new Error(
        `terminal.checks[${i}].points must be a non-negative number`,
      );
  }
  for (const [i, entry] of (config.initialFilesystem || []).entries()) {
    if (
      !ownPlain(entry) ||
      typeof entry.path !== "string" ||
      !entry.path.startsWith("/")
    )
      throw new Error(
        `terminal.initialFilesystem[${i}] needs an absolute path`,
      );
    if (entry.type && !["file", "directory", "symlink"].includes(entry.type))
      throw new Error(
        `terminal.initialFilesystem[${i}] has an unsupported node type`,
      );
    if (entry.type === "symlink" && typeof entry.target !== "string")
      throw new Error(
        `terminal.initialFilesystem[${i}] symlink needs a target`,
      );
  }
  if (
    config.initialDirectory !== undefined &&
    (typeof config.initialDirectory !== "string" ||
      !config.initialDirectory.startsWith("/"))
  )
    throw new Error("terminal.initialDirectory must be an absolute path");
  return config;
}

function initialFilesystem(fs, entries) {
  const ordered = [...(entries || [])].sort(
    (a, b) =>
      (a.type === "directory" ? 0 : 1) - (b.type === "directory" ? 0 : 1),
  );
  for (const entry of ordered) {
    const path = entry.path;
    const parts = splitPath(path);
    parts.pop();
    const parentPath =
      (path.startsWith("/") ? "/" : fs.cwd + "/") + parts.join("/");
    if (parts.length) fs.mkdir(parentPath, { parents: true, bootstrap: true });
    const uid =
      fs.getUser(entry.owner ?? entry.uid)?.uid ??
      (Number.isInteger(entry.uid) ? entry.uid : 0);
    const gid =
      fs.getGroup(entry.group ?? entry.gid)?.gid ??
      (Number.isInteger(entry.gid) ? entry.gid : 0);
    const mode =
      entry.mode === undefined
        ? entry.type === "directory"
          ? 0o755
          : 0o644
        : typeof entry.mode === "string"
          ? parseInt(entry.mode.replace(/^0o/, ""), 8)
          : entry.mode;
    if (entry.type === "directory")
      fs.mkdir(path, { uid, gid, mode, parents: true, bootstrap: true });
    else if (entry.type === "symlink")
      fs.symlink(entry.target, path, { uid, gid, bootstrap: true });
    else
      fs.writeFile(path, safeText(entry.content), {
        uid,
        gid,
        mode,
        bootstrap: true,
      });
  }
}

async function createExerciseWorkspace(config, io) {
  const fs = new VirtualFS();
  initialFilesystem(fs, config.initialFilesystem);

  // Trusted, developer-authored setup commands run once as simulated root.
  // They use the exact same shell and filesystem implementation as students,
  // but are not included in the student's command history.
  fs.currentUid = 0;
  fs.cwd = "/";
  const setupShell = new Shell(fs, io);
  setupShell.env.HOME = "/home/root";
  setupShell.env.USER = "root";
  setupShell.env.LOGNAME = "root";
  setupShell.env.PWD = "/";
  for (const [index, command] of (config.preSetupCommands || []).entries()) {
    const result = await setupShell.executeLine(command, { fromSource: true });
    if (result.status !== 0) {
      const detail = (
        result.stderr ||
        result.stdout ||
        "command failed"
      ).trim();
      throw new Error(
        `preSetupCommands[${index}] failed (status ${result.status}): ${detail}`,
      );
    }
  }

  const student = fs.getUser("student");
  if (!student)
    throw new Error(
      "Pre-environment setup must not remove the student account",
    );
  fs.currentUid = student.uid;
  const startPath = config.initialDirectory || student.home;
  const startNode = fs.resolve(startPath).node;
  if (startNode.type !== "directory")
    throw new Error(
      `terminal.initialDirectory '${startPath}' is not a directory`,
    );
  fs.cwd = startPath;

  const shell = new Shell(fs, io);
  shell.env.HOME = shell.user.home;
  shell.env.PWD = fs.cwd;
  shell.env.USER = shell.user.name;
  shell.env.LOGNAME = shell.user.name;
  return { fs, shell };
}

function makeIdb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("IndexedDB is unavailable in this browser"));
      return;
    }
    const request = indexedDB.open("acs-practice-terminal", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("attempts"))
        db.createObjectStore("attempts", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Could not open terminal storage"));
  });
}
function idbRequest(db, mode, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("attempts", mode);
    const store = tx.objectStore("attempts");
    let request, result;
    try {
      request = action(store);
    } catch (error) {
      reject(error);
      return;
    }
    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(request.error || tx.error);
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () =>
      reject(
        tx.error ||
          request?.error ||
          new Error("Terminal storage transaction failed"),
      );
    tx.onabort = () =>
      reject(tx.error || new Error("Terminal storage transaction was aborted"));
  });
}

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function escapeTerminalHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}
function highlightDoubleQuotedMarkup(value) {
  const text = String(value);
  const pieces = [];
  const add = (part, kind = "string") => {
    if (!part) return;
    pieces.push(
      `<span class="ot-syntax-${kind}">${escapeTerminalHtml(part)}</span>`,
    );
  };
  let cursor = 0;
  let literalStart = 0;
  while (cursor < text.length) {
    if (text[cursor] === "\\" && cursor + 1 < text.length) {
      cursor += 2;
      continue;
    }
    if (text[cursor] === "$" && cursor + 1 < text.length) {
      add(text.slice(literalStart, cursor));
      let end = cursor + 1;
      if (text[end] === "{") {
        const close = text.indexOf("}", end + 1);
        end = close < 0 ? text.length : close + 1;
      } else if (text[end] === "(") {
        let depth = 1;
        end++;
        while (end < text.length && depth) {
          if (text[end] === "(") depth++;
          else if (text[end] === ")") depth--;
          end++;
        }
      } else {
        while (end < text.length && /[A-Za-z0-9_?#!@$*-]/.test(text[end]))
          end++;
      }
      if (end === cursor + 1) {
        cursor++;
        continue;
      }
      add(text.slice(cursor, end), "variable");
      cursor = end;
      literalStart = end;
      continue;
    }
    cursor++;
  }
  add(text.slice(literalStart));
  return pieces.join("");
}

// Syntax colors are presentation only: the real shell still receives the
// untouched command string. Every token is escaped before it reaches innerHTML.
function highlightCommandMarkup(source) {
  const text = String(source ?? "");
  const output = [];
  let index = 0;
  let expectCommand = true;
  let previousCommand = "";
  const add = (value, kind = "") => {
    const escaped = escapeTerminalHtml(value);
    output.push(
      kind ? `<span class="ot-syntax-${kind}">${escaped}</span>` : escaped,
    );
  };
  const isOperator = (position) => {
    const tail = text.slice(position);
    const match = tail.match(/^(?:2>&1|&>|2>>|2>|>>|&&|\|\||[|;&<>])/);
    return match ? match[0] : "";
  };
  while (index < text.length) {
    const character = text[index];
    if (/\s/.test(character)) {
      let end = index + 1;
      while (end < text.length && /\s/.test(text[end])) end++;
      add(text.slice(index, end));
      index = end;
      continue;
    }
    if (character === "#" && (index === 0 || /\s/.test(text[index - 1]))) {
      add(text.slice(index), "comment");
      break;
    }
    const operator = isOperator(index);
    if (operator) {
      add(operator, "operator");
      index += operator.length;
      if ([";", "|", "&&", "||"].includes(operator)) {
        expectCommand = true;
        previousCommand = "";
      }
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      const quote = character;
      let end = index + 1;
      while (end < text.length) {
        if (text[end] === "\\" && quote !== "'") {
          end += 2;
          continue;
        }
        if (text[end] === quote) {
          end++;
          break;
        }
        end++;
      }
      const quoted = text.slice(index, Math.min(end, text.length));
      if (quote === '"') output.push(highlightDoubleQuotedMarkup(quoted));
      else add(quoted, quote === "`" ? "substitution" : "string");
      index = Math.min(end, text.length);
      continue;
    }
    if (character === "\\" && index + 1 < text.length) {
      add(text.slice(index, index + 2), "escape");
      index += 2;
      continue;
    }
    if (character === "$") {
      let end = index + 1;
      if (text[end] === "{") {
        const close = text.indexOf("}", end + 1);
        end = close < 0 ? text.length : close + 1;
      } else if (text[end] === "(") {
        let depth = 1;
        end++;
        while (end < text.length && depth) {
          if (text[end] === "(") depth++;
          else if (text[end] === ")") depth--;
          end++;
        }
      } else {
        while (end < text.length && /[A-Za-z0-9_?#!@$*-]/.test(text[end]))
          end++;
      }
      add(text.slice(index, end), "variable");
      index = end;
      continue;
    }
    let end = index + 1;
    while (end < text.length && !/\s/.test(text[end]) && !isOperator(end)) {
      if (text[end] === "\\" && end + 1 < text.length) end += 2;
      else if (text[end] === "'" || text[end] === '"' || text[end] === "`") {
        const quote = text[end++];
        while (end < text.length) {
          if (text[end] === "\\" && quote !== "'") {
            end += 2;
            continue;
          }
          if (text[end++] === quote) break;
        }
      } else end++;
    }
    const word = text.slice(index, end);
    let kind = "argument";
    if (expectCommand) {
      kind = "command";
      previousCommand = word;
      // sudo and env commonly precede the command that will actually run.
      expectCommand = ["sudo", "env", "command", "builtin"].includes(word);
    } else if (/^-[^-]/.test(word) || /^--[\w-]+/.test(word)) kind = "flag";
    else if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) kind = "assignment";
    else if (/[\/]/.test(word) || /^~/.test(word) || /^\./.test(word))
      kind = "path";
    else if (
      previousCommand === "sudo" ||
      previousCommand === "env" ||
      previousCommand === "command" ||
      previousCommand === "builtin"
    ) {
      kind = "command";
      previousCommand = word;
      expectCommand = false;
    }
    add(word, kind);
    index = end;
  }
  return output.join("");
}

const ANSI_COLORS = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
];
function ansi256Hex(index) {
  const value = Math.max(0, Math.min(255, Number(index) || 0));
  if (value < 16) {
    const palette = [
      "#30343b",
      "#ff8f9b",
      "#93d7a6",
      "#e9c982",
      "#89b4fa",
      "#cba6f7",
      "#83dce5",
      "#dce5f2",
      "#778296",
      "#ffabb4",
      "#b3e8bd",
      "#f4dfaa",
      "#accaff",
      "#dfc0ff",
      "#a8edf2",
      "#ffffff",
    ];
    return palette[value];
  }
  if (value >= 232) {
    const channel = (8 + (value - 232) * 10).toString(16).padStart(2, "0");
    return `#${channel}${channel}${channel}`;
  }
  const cube = value - 16;
  const levels = [0, 95, 135, 175, 215, 255];
  const red = levels[Math.floor(cube / 36)];
  const green = levels[Math.floor((cube % 36) / 6)];
  const blue = levels[cube % 6];
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
function ansiClassFor(code, bright = false) {
  const names = bright
    ? [
        "bright-black",
        "bright-red",
        "bright-green",
        "bright-yellow",
        "bright-blue",
        "bright-magenta",
        "bright-cyan",
        "bright-white",
      ]
    : ANSI_COLORS;
  return names[code] || "";
}
function ansiLineMarkup(line, state) {
  const parts = [];
  const emit = (value) => {
    if (!value) return;
    const classes = [];
    if (state.fg) classes.push(`ot-ansi-fg-${state.fg}`);
    if (state.bg) classes.push(`ot-ansi-bg-${state.bg}`);
    const inlineStyles = [];
    if (state.fgHex) inlineStyles.push(`color:${state.fgHex}`);
    if (state.bgHex) inlineStyles.push(`background-color:${state.bgHex}`);
    if (state.bold) classes.push("ot-ansi-bold");
    if (state.dim) classes.push("ot-ansi-dim");
    if (state.italic) classes.push("ot-ansi-italic");
    if (state.underline) classes.push("ot-ansi-underline");
    const safe = escapeTerminalHtml(value);
    const attributes = `${classes.length ? ` class="${classes.join(" ")}"` : ""}${inlineStyles.length ? ` style="${inlineStyles.join(";")}"` : ""}`;
    parts.push(attributes ? `<span${attributes}>${safe}</span>` : safe);
  };
  let cursor = 0;
  const pattern = /\x1b\[([0-9;]*)m/g;
  let match;
  while ((match = pattern.exec(line))) {
    emit(line.slice(cursor, match.index));
    const codes = (match[1] || "0").split(";").map((item) => Number(item || 0));
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      if (code === 0)
        Object.assign(state, {
          fg: "",
          bg: "",
          fgHex: "",
          bgHex: "",
          bold: false,
          dim: false,
          italic: false,
          underline: false,
        });
      else if (code === 1) state.bold = true;
      else if (code === 2) state.dim = true;
      else if (code === 3) state.italic = true;
      else if (code === 4) state.underline = true;
      else if (code === 22) {
        state.bold = false;
        state.dim = false;
      } else if (code === 23) state.italic = false;
      else if (code === 24) state.underline = false;
      else if (code === 39) {
        state.fg = "";
        state.fgHex = "";
      } else if (code === 49) {
        state.bg = "";
        state.bgHex = "";
      } else if (code >= 30 && code <= 37) {
        state.fg = ansiClassFor(code - 30);
        state.fgHex = "";
      } else if (code >= 90 && code <= 97) {
        state.fg = ansiClassFor(code - 90, true);
        state.fgHex = "";
      } else if (code >= 40 && code <= 47) {
        state.bg = ansiClassFor(code - 40);
        state.bgHex = "";
      } else if (code >= 100 && code <= 107) {
        state.bg = ansiClassFor(code - 100, true);
        state.bgHex = "";
      } else if (
        (code === 38 || code === 48) &&
        codes[i + 1] === 5 &&
        Number.isInteger(codes[i + 2])
      ) {
        const target = code === 38 ? "fg" : "bg";
        state[target] = "";
        state[`${target}Hex`] = ansi256Hex(codes[i + 2]);
        i += 2;
      } else if (
        (code === 38 || code === 48) &&
        codes[i + 1] === 2 &&
        codes.slice(i + 2, i + 5).every(Number.isInteger)
      ) {
        const target = code === 38 ? "fg" : "bg";
        const rgb = codes
          .slice(i + 2, i + 5)
          .map((channel) => Math.max(0, Math.min(255, channel)));
        state[target] = "";
        state[`${target}Hex`] =
          `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
        i += 4;
      }
    }
    cursor = pattern.lastIndex;
  }
  emit(line.slice(cursor));
  return parts.join("") || " ";
}
function appendOutput(screen, text, className = "") {
  const value = String(text ?? "");
  if (!value) return;
  const rows = value.replace(/\r/g, "").split("\n");
  if (rows.at(-1) === "") rows.pop();
  const ansiState = {
    fg: "",
    bg: "",
    fgHex: "",
    bgHex: "",
    bold: false,
    dim: false,
    italic: false,
    underline: false,
  };
  for (const row of rows) {
    const line = createElement(
      "div",
      "os-term-line" + (className ? " " + className : ""),
    );
    line.innerHTML = ansiLineMarkup(row, ansiState);
    screen.append(line);
  }
  while (screen.children.length > MAX_SCROLLBACK)
    screen.firstElementChild.remove();
  screen.scrollTop = screen.scrollHeight;
}
function appendCommandEcho(screen, prompt, command) {
  const line = createElement("div", "os-term-line ot-command-echo");
  line.innerHTML = `<span class="ot-echo-prompt">${promptMarkup(prompt)}</span> ${highlightCommandMarkup(command)}`;
  screen.append(line);
  while (screen.children.length > MAX_SCROLLBACK)
    screen.firstElementChild.remove();
  screen.scrollTop = screen.scrollHeight;
}
function promptMarkup(value) {
  const prompt = String(value ?? "");
  const marker = prompt.slice(-1);
  const body = prompt.slice(0, -1);
  const split = body.indexOf("@");
  const colon = body.lastIndexOf(":");
  if (split < 0 || colon < split) return escapeTerminalHtml(prompt);
  return `<span class="ot-prompt-user">${escapeTerminalHtml(body.slice(0, split))}</span><span class="ot-prompt-at">@</span><span class="ot-prompt-host">${escapeTerminalHtml(body.slice(split + 1, colon))}</span><span class="ot-prompt-path">:${escapeTerminalHtml(body.slice(colon + 1))}</span><span class="ot-prompt-marker">${escapeTerminalHtml(marker)}</span>`;
}
// A trailing unescaped backslash continues a command on the next terminal
// input line. Bash removes the backslash and line break before parsing.
function shellLineContinuationIndex(source) {
  const text = String(source ?? "");
  let trailingSlashes = 0;
  for (let i = text.length - 1; i >= 0 && text[i] === "\\"; i--)
    trailingSlashes++;
  if (!trailingSlashes || trailingSlashes % 2 === 0) return -1;

  const scanEnd = text.length - trailingSlashes;
  let quote = null;
  for (let i = 0; i < scanEnd; i++) {
    const ch = text[i];
    if (quote === "'") {
      if (ch === "'") quote = null;
      continue;
    }
    if (ch === "\\") {
      if (i + 1 < scanEnd) i++;
      continue;
    }
    if (quote === '"') {
      if (ch === '"') quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    // A backslash in a shell comment is literal, not a continuation.
    if (ch === "#" && (i === 0 || /\s/.test(text[i - 1]))) return -1;
  }
  if (quote === "'") return -1;
  return text.length - 1;
}

export async function mountTerminalExercise({
  workspaceContainer = null,
  container = null,
  exercise,
  packageId,
  exerciseId,
  attemptId,
  mode = "practice",
  onGrade = () => {},
  onChange = () => {},
  actionsContainer = null,
  feedbackContainer = null,
}) {
  const workspaceHost =
    workspaceContainer instanceof Element ? workspaceContainer : container;
  if (!(workspaceHost instanceof Element))
    throw new Error("A valid terminal workspace element is required");
  const config = validateExercise(exercise);
  const key = [
    String(packageId || "package"),
    String(exerciseId || exercise.id || "exercise"),
    String(attemptId || mode || "practice"),
  ].join("::");
  let db = null,
    disposed = false,
    savedRecord = null,
    fs,
    shell,
    lastGrade = null;
  let activePrompt = null,
    activePromptMode = null,
    editorResolve = null;
  const instance = createElement("section", "os-terminal");
  const toolbar = createElement("div", "ot-toolbar");
  const label = createElement("strong", "ot-label", "Browser Linux terminal");
  const status = createElement("span", "ot-state", "Loading workspace…");
  const colorLegend = createElement("span", "ot-color-legend");
  for (const [labelText, kind] of [
    ["command", "cmd"],
    ["flags", "flag"],
    ["strings", "string"],
    ["paths", "path"],
  ]) {
    const item = createElement("span", kind, labelText);
    colorLegend.append(item);
  }
  const focusButton = createElement("button", "ot-focus", "Focus input");
  focusButton.type = "button";
  const clearButton = createElement("button", "sec", "Clear");
  clearButton.type = "button";
  const checkButton = createElement("button", "", "Check exercise");
  checkButton.type = "button";
  checkButton.hidden = mode !== "practice";
  toolbar.append(label, status, colorLegend, focusButton, clearButton);
  const screen = createElement("div", "ot-screen");
  screen.setAttribute("role", "log");
  screen.setAttribute("aria-label", "Terminal output");
  screen.setAttribute("aria-live", "polite");
  const inputRow = createElement("div", "ot-input-row");
  const prompt = createElement("span", "ot-prompt", "student@acs-linux:~$");
  const inputWrap = createElement("div", "ot-input-wrap");
  const inputHighlight = createElement("div", "ot-input-highlight");
  inputHighlight.setAttribute("aria-hidden", "true");
  const inputHighlightContent = createElement(
    "span",
    "ot-input-highlight-content",
  );
  inputHighlight.append(inputHighlightContent);
  const input = createElement("textarea", "ot-input");
  // Workspace restore is asynchronous. Do not accept commands until the shell
  // exists; the Enter handler below also guards against synthetic/racing input.
  input.disabled = true;

  input.rows = 1;
  input.wrap = "soft";
  input.autocomplete = "off";
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", "false");

  input.setAttribute("aria-label", "Terminal command input");
  input.placeholder = "Type a command and press Enter";

  inputWrap.append(inputHighlight, input);
  inputRow.append(prompt, inputWrap);
  const keyBar = createElement("div", "ot-keys");
  for (const [labelText, key] of [
    ["Tab", "Tab"],
    ["Ctrl+C", "CtrlC"],
    ["Ctrl+L", "CtrlL"],
    ["↑", "ArrowUp"],
    ["↓", "ArrowDown"],
    ["Esc", "Escape"],
  ]) {
    const button = createElement("button", "sec", labelText);
    button.type = "button";
    button.dataset.key = key;
    keyBar.append(button);
  }
  const solutionCommands = Array.isArray(config.solution)
    ? config.solution.map((command) => String(command))
    : [];
  const solutionButton = createElement("button", "sec", "Show solution");
  solutionButton.type = "button";
  solutionButton.hidden = mode !== "practice" || solutionCommands.length === 0;
  solutionButton.setAttribute("aria-expanded", "false");
  const solutionArea = createElement("section", "ot-solution");
  solutionArea.hidden = true;
  const solutionHeading = createElement("h4", "", "Minimal solution");
  const solutionIntro = createElement(
    "p",
    "ot-solution-intro",
    "These commands satisfy the configured grading checks. They may skip extra practice steps that are described but not graded.",
  );
  const solutionList = createElement("ol", "ot-solution-list");
  for (const command of solutionCommands) {
    const item = createElement("li");
    const code = createElement("code", "", command);
    item.append(code);
    solutionList.append(item);
  }
  solutionArea.append(solutionHeading, solutionIntro, solutionList);
  const gradeArea = createElement("div", "ot-grade");
  gradeArea.hidden = true;
  const editorArea = createElement("div", "ot-editor");
  editorArea.hidden = true;
  const notice = createElement("p", "ot-notice");
  notice.hidden = true;

  // The host owns layout and navigation. This module fills the workspace slot,
  // contributes actions to the shared action group, and reports grade details
  // through the shared feedback slot.
  const workbench = createElement("div", "ot-workbench");
  const workspaceMain = createElement("div", "ot-workspace-main");
  const externalActionsContainer =
    actionsContainer instanceof Element ? actionsContainer : null;
  const localActionsContainer = externalActionsContainer
    ? null
    : createElement("div", "exercise-action-buttons");
  const actionTarget = externalActionsContainer || localActionsContainer;
  if (localActionsContainer) {
    localActionsContainer.setAttribute("role", "group");
    localActionsContainer.setAttribute("aria-label", "Exercise actions");
  }
  workspaceMain.append(toolbar, screen, inputRow, keyBar, notice, editorArea);
  workbench.append(workspaceMain);
  if (localActionsContainer) workbench.append(localActionsContainer);
  if (feedbackContainer instanceof Element) feedbackContainer.append(gradeArea);
  else workbench.append(gradeArea);
  instance.append(workbench);
  workspaceHost.replaceChildren(instance);

  let commandHistory = [],
    historyIndex = 0,
    outputBusy = false;
  let continuationBuffer = "",
    continuationActive = false;
  let pendingCommand = Promise.resolve();
  const saveNow = async () => {
    if (!db || disposed || !fs || !shell) return;
    const record = {
      key,
      version: TERMINAL_VERSION,
      savedAt: Date.now(),
      filesystem: fs.serialize(),
      shell: shell.serialize(),
      lastGrade,
    };
    await idbRequest(db, "readwrite", (store) => store.put(record));
    savedRecord = record;
  };
  const setPrompt = () => {
    if (continuationActive) {
      prompt.textContent = ">";
      prompt.classList.add("ot-continuation-prompt");
      inputRow.classList.add("is-continuing");
      return;
    }
    prompt.classList.remove("ot-continuation-prompt");
    inputRow.classList.remove("is-continuing");
    prompt.innerHTML = promptMarkup(
      shell ? shell.prompt() : "student@acs-linux:~$",
    );
  };
  const clearContinuation = () => {
    continuationBuffer = "";
    continuationActive = false;
    input.placeholder = "Type a command and press Enter";
    setPrompt();
  };
  // Draw the initial placeholder and keep the syntax preview in sync while typing.
  const output = (value, error = false) =>
    appendOutput(screen, value, error ? "err" : "");
  const syncInputHighlight = () => {
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
    if (input.type === "password")
      inputHighlightContent.textContent = "•".repeat(input.value.length);
    else if (input.value)
      inputHighlightContent.innerHTML = highlightCommandMarkup(input.value);
    else
      inputHighlightContent.innerHTML = `<span class="ot-input-placeholder">${escapeTerminalHtml(input.placeholder || "")}</span>`;
    inputHighlightContent.style.transform = `translateX(-${input.scrollLeft || 0}px)`;
  };
  input.addEventListener("input", syncInputHighlight);
  input.addEventListener("scroll", syncInputHighlight);
  const focusInput = () => {
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
  };
  const clearScreen = () => {
    screen.replaceChildren();
  };
  syncInputHighlight();
  const showError = (message) => {
    const box = createElement("div", "ot-error", message);
    container.replaceChildren(style, box);
  };
  const editorPromise = (path, initial, write) =>
    new Promise((resolve) => {
      editorResolve = resolve;
      editorArea.hidden = false;
      editorArea.replaceChildren();

      let currentPath = path;
      let mode = "normal";
      let dirty = false;
      let savedValue = String(initial ?? "");
      let undoStack = [];
      let yankBuffer = "";
      let yankLinewise = false;
      let pendingOperator = "";
      let pendingCount = "";
      let lastSearch = "";
      let searchDirection = 1;
      let lineNumbers = false;
      let beforeInput = null;

      const heading = createElement(
        "strong",
        "ot-editor-title",
        `Vim — ${currentPath}`,
      );
      const modeLabel = createElement("span", "ot-editor-mode", "NORMAL");
      const statusLine = createElement(
        "div",
        "ot-editor-status",
        "Esc: Normal · i: Insert · :wq: Save and quit",
      );
      const textarea = createElement("textarea", "ot-editor-textarea");
      textarea.spellcheck = false;
      textarea.autocapitalize = "off";
      textarea.autocomplete = "off";
      textarea.value = savedValue;
      textarea.setAttribute("aria-label", `Vim editor for ${currentPath}`);
      const commandRow = createElement("div", "ot-editor-command-row");
      const commandLabel = createElement("span", "", ":");
      const commandInput = createElement("input", "ot-editor-command");
      commandInput.type = "text";
      commandInput.autocomplete = "off";
      commandInput.spellcheck = false;
      commandInput.hidden = true;
      const buttonRow = createElement("div", "ot-actions");
      const saveButton = createElement("button", "", "Save (:w)");
      const saveQuitButton = createElement("button", "", "Save & quit (:wq)");
      const quitButton = createElement(
        "button",
        "sec",
        "Quit without saving (:q!)",
      );
      for (const button of [saveButton, saveQuitButton, quitButton])
        button.type = "button";

      const cursor = () => textarea.selectionStart ?? 0;
      const lineStart = (pos) => {
        const start = textarea.value.lastIndexOf("\n", Math.max(0, pos - 1));
        return start + 1;
      };
      const lineEnd = (pos) => {
        const end = textarea.value.indexOf("\n", pos);
        return end < 0 ? textarea.value.length : end;
      };
      const currentLine = () => {
        const pos = cursor();
        return { start: lineStart(pos), end: lineEnd(pos), pos };
      };
      const snapshot = () => ({
        value: textarea.value,
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      });
      const pushUndo = () => {
        undoStack.push(snapshot());
        if (undoStack.length > 100) undoStack.shift();
      };
      const updateDirty = () => {
        dirty = textarea.value !== savedValue;
        heading.textContent = `Vim — ${currentPath}${dirty ? " [+]" : ""}`;
      };
      const setMode = (next, message = "") => {
        mode = next;
        modeLabel.textContent = next.toUpperCase();
        statusLine.textContent =
          message ||
          (next === "insert"
            ? "-- INSERT --  Press Esc to return to Normal mode"
            : next === "visual"
              ? "-- VISUAL --  Move with h/j/k/l, y to copy, d to delete"
              : "NORMAL  h/j/k/l move · i insert · dd delete line · yy copy line · p paste · :wq save & quit");
      };
      const setCursor = (position, extend = false) => {
        const bounded = Math.max(0, Math.min(textarea.value.length, position));
        const anchor = extend
          ? textarea.selectionStart <= textarea.selectionEnd
            ? textarea.selectionStart
            : textarea.selectionEnd
          : bounded;
        textarea.focus();
        if (extend) textarea.setSelectionRange(anchor, bounded);
        else textarea.setSelectionRange(bounded, bounded);
      };
      const insertAt = (start, end, text) => {
        pushUndo();
        textarea.setRangeText(text, start, end, "end");
        updateDirty();
        setMode(mode);
      };
      const saveTo = async (target = currentPath) => {
        await write(textarea.value, target);
        currentPath = target;
        savedValue = textarea.value;
        updateDirty();
        heading.textContent = `Vim — ${currentPath}`;
        statusLine.textContent = `"${currentPath}" ${byteLength(textarea.value)} bytes written`;
        return true;
      };
      const finish = async (commit) => {
        if (commit) {
          try {
            await saveTo();
          } catch (error) {
            statusLine.textContent = `Write failed: ${error.message}`;
            return;
          }
        }
        editorArea.hidden = true;
        editorArea.replaceChildren();
        editorResolve = null;
        resolve();
        focusInput();
      };
      const openCommand = (kind) => {
        commandInput.hidden = false;
        commandLabel.textContent = kind === "search" ? "/" : ":";
        commandInput.value = "";
        commandInput.dataset.kind = kind;
        setMode(
          kind === "search" ? "search" : "command",
          kind === "search"
            ? "Search forward · Enter to find · Esc to cancel"
            : "Enter a Vim command · Esc to cancel",
        );
        commandInput.focus();
      };
      const executeEditorCommand = async (raw) => {
        const command = raw.trim();
        const matchSubstitute = command.match(
          /^%?s\/((?:\\.|[^/])*)\/((?:\\.|[^/])*)\/([gi]*)$/,
        );
        if (command === "w" || command.startsWith("w ")) {
          const target = command.slice(1).trim() || currentPath;
          try {
            await saveTo(target);
          } catch (error) {
            statusLine.textContent = `Write failed: ${error.message}`;
            return;
          }
        } else if (
          command === "wq" ||
          command === "x" ||
          command.startsWith("wq ") ||
          command.startsWith("x ")
        ) {
          const target = command.replace(/^(wq|x)\s*/, "") || currentPath;
          try {
            await saveTo(target);
            await finish(false);
          } catch (error) {
            statusLine.textContent = `Write failed: ${error.message}`;
          }
        } else if (command === "q") {
          if (dirty) {
            statusLine.textContent =
              "No write since last change (use :q! to discard or :wq to save)";
            return;
          }
          await finish(false);
        } else if (command === "q!") {
          await finish(false);
        } else if (matchSubstitute) {
          const [, oldRaw, newRaw, flags] = matchSubstitute;
          const decode = (value) => value.replace(/\\(.)/g, "$1");
          const oldText = decode(oldRaw),
            newText = decode(newRaw);
          if (!oldText) {
            statusLine.textContent = "E486: Pattern not found";
            return;
          }
          const next = flags.includes("g")
            ? textarea.value.split(oldText).join(newText)
            : textarea.value.replace(oldText, newText);
          if (next !== textarea.value) {
            pushUndo();
            textarea.value = next;
            updateDirty();
            statusLine.textContent = "Substitution complete";
          } else statusLine.textContent = "Pattern not found";
        } else if (command === "set number" || command === "set nu") {
          lineNumbers = true;
          statusLine.textContent = "Line numbers enabled in this editor view";
        } else if (command === "set nonumber" || command === "set nonu") {
          lineNumbers = false;
          statusLine.textContent = "Line numbers disabled";
        } else if (!command) {
          setMode("normal");
        } else {
          statusLine.textContent = `Not implemented by the lightweight Vim editor: :${command}`;
        }
        if (!editorArea.hidden) setMode("normal", statusLine.textContent);
      };
      const findNext = (pattern, direction = 1) => {
        if (!pattern) return false;
        const source = textarea.value;
        const start = cursor();
        const found =
          direction >= 0
            ? source.indexOf(pattern, start + 1)
            : source.lastIndexOf(pattern, Math.max(0, start - 1));
        const index =
          found >= 0
            ? found
            : direction >= 0
              ? source.indexOf(pattern)
              : source.lastIndexOf(pattern);
        if (index < 0) {
          statusLine.textContent = `Pattern not found: ${pattern}`;
          return false;
        }
        setCursor(index);
        textarea.setSelectionRange(index, index + pattern.length);
        lastSearch = pattern;
        searchDirection = direction;
        statusLine.textContent = `/${pattern}`;
        return true;
      };
      const moveVertical = (delta, extend) => {
        const pos = cursor();
        const start = lineStart(pos),
          column = pos - start;
        const targetLineStart =
          delta < 0
            ? Math.max(0, lineStart(Math.max(0, start - 1)))
            : Math.min(textarea.value.length, lineEnd(start) + 1);
        const target = Math.min(
          lineEnd(targetLineStart),
          targetLineStart + column,
        );
        setCursor(target, extend);
      };
      const editLineOperator = (operator, count) => {
        const { start } = currentLine();
        let end = start;
        for (let i = 0; i < count; i++) {
          const newline = textarea.value.indexOf("\n", end);
          if (newline < 0) {
            end = textarea.value.length;
            break;
          }
          end = newline + 1;
        }
        if (end === start && start > 0) end = textarea.value.length;
        const selected = textarea.value.slice(start, end);
        if (operator === "y") {
          yankBuffer = selected;
          yankLinewise = true;
          statusLine.textContent = `Yanked ${count} line${count === 1 ? "" : "s"}`;
        } else {
          pushUndo();
          textarea.setRangeText("", start, end, "end");
          updateDirty();
          statusLine.textContent = `Deleted ${count} line${count === 1 ? "" : "s"}`;
        }
      };

      textarea.addEventListener("beforeinput", () => {
        if (mode === "insert") beforeInput = snapshot();
      });
      textarea.addEventListener("input", () => {
        if (mode === "insert" && beforeInput) {
          undoStack.push(beforeInput);
          if (undoStack.length > 100) undoStack.shift();
          beforeInput = null;
        }
        updateDirty();
      });
      textarea.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          setMode("normal");
          pendingOperator = "";
          pendingCount = "";
          textarea.focus();
          return;
        }
        if (mode === "insert") return;
        if (event.ctrlKey || event.metaKey) {
          if (event.key.toLowerCase() === "v") {
            event.preventDefault();
            statusLine.textContent =
              "Visual block selection is not supported; use v or V for character/line selection.";
          }
          return;
        }
        event.preventDefault();
        const key = event.key;
        if (mode === "visual") {
          if (["ArrowLeft", "h"].includes(key)) setCursor(cursor() - 1, true);
          else if (["ArrowRight", "l"].includes(key))
            setCursor(cursor() + 1, true);
          else if (["ArrowUp", "k"].includes(key)) moveVertical(-1, true);
          else if (["ArrowDown", "j"].includes(key)) moveVertical(1, true);
          else if (key === "y" || key === "d") {
            const a = Math.min(textarea.selectionStart, textarea.selectionEnd),
              b = Math.max(textarea.selectionStart, textarea.selectionEnd);
            const selected = textarea.value.slice(a, b);
            if (key === "y") {
              yankBuffer = selected;
              yankLinewise = false;
            } else {
              pushUndo();
              textarea.setRangeText("", a, b, "end");
              updateDirty();
            }
            setMode(
              "normal",
              key === "y" ? "Yanked selection" : "Deleted selection",
            );
          }
          return;
        }
        if (pendingOperator) {
          if (key === pendingOperator)
            editLineOperator(key, Number(pendingCount || "1"));
          else
            statusLine.textContent = `Operator ${pendingOperator}${key} is not supported`;
          pendingOperator = "";
          pendingCount = "";
          setMode("normal", statusLine.textContent);
          return;
        }
        if (/^[0-9]$/.test(key) && (key !== "0" || pendingCount)) {
          pendingCount += key;
          return;
        }
        const count = Number(pendingCount || "1");
        pendingCount = "";
        const { start, end, pos } = currentLine();
        if (key === "i") setMode("insert");
        else if (key === "a") {
          setCursor(Math.min(textarea.value.length, pos + 1));
          setMode("insert");
        } else if (key === "A") {
          setCursor(end);
          setMode("insert");
        } else if (key === "I") {
          setCursor(start);
          setMode("insert");
        } else if (key === "o") {
          insertAt(end, end, "\n");
          setCursor(end + 1);
          setMode("insert");
        } else if (key === "O") {
          insertAt(start, start, "\n");
          setCursor(start);
          setMode("insert");
        } else if (key === "h" || key === "ArrowLeft") setCursor(pos - 1);
        else if (key === "l" || key === "ArrowRight") setCursor(pos + 1);
        else if (key === "j" || key === "ArrowDown") {
          for (let n = 0; n < count; n++) moveVertical(1, false);
        } else if (key === "k" || key === "ArrowUp") {
          for (let n = 0; n < count; n++) moveVertical(-1, false);
        } else if (key === "0") setCursor(start);
        else if (key === "$") setCursor(end);
        else if (key === "x") {
          if (pos < textarea.value.length) {
            pushUndo();
            textarea.setRangeText(
              "",
              pos,
              Math.min(textarea.value.length, pos + count),
              "end",
            );
            updateDirty();
          }
        } else if (key === "d" || key === "y") pendingOperator = key;
        else if (key === "p" || key === "P") {
          if (!yankBuffer) return;
          if (yankLinewise) {
            const insertion =
              key === "p"
                ? end < textarea.value.length
                  ? end + 1
                  : end
                : start;
            const text = yankBuffer.endsWith("\n")
              ? yankBuffer
              : yankBuffer + "\n";
            insertAt(insertion, insertion, text);
          } else {
            const insertion =
              key === "p" ? Math.min(textarea.value.length, pos + 1) : pos;
            insertAt(insertion, insertion, yankBuffer);
          }
        } else if (key === "u") {
          const previous = undoStack.pop();
          if (previous) {
            textarea.value = previous.value;
            setCursor(previous.start);
            updateDirty();
            statusLine.textContent = "Undo";
          }
        } else if (key === "v" || key === "V") {
          const begin = key === "V" ? start : pos;
          const finish =
            key === "V" ? Math.min(textarea.value.length, end + 1) : pos;
          setCursor(begin);
          textarea.setSelectionRange(begin, finish);
          setMode("visual");
        } else if (key === "/") {
          searchDirection = 1;
          openCommand("search");
        } else if (key === "?") {
          searchDirection = -1;
          openCommand("search");
        } else if (key === "n") {
          findNext(lastSearch, searchDirection);
        } else if (key === ":") openCommand("command");
        else if (key === "Enter") {
          setCursor(Math.min(textarea.value.length, end + 1));
        } else statusLine.textContent = `Unknown Normal-mode key: ${key}`;
        textarea.focus();
      });
      commandInput.addEventListener("keydown", async (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          commandInput.hidden = true;
          setMode("normal");
          textarea.focus();
          return;
        }
        if (event.key !== "Enter") return;
        event.preventDefault();
        const value = commandInput.value,
          kind = commandInput.dataset.kind;
        commandInput.hidden = true;
        if (kind === "search") findNext(value, searchDirection);
        else await executeEditorCommand(value);
        textarea.focus();
      });
      saveButton.addEventListener("click", () =>
        saveTo().catch((error) => {
          statusLine.textContent = `Write failed: ${error.message}`;
        }),
      );
      saveQuitButton.addEventListener("click", () => finish(true));
      quitButton.addEventListener("click", () => finish(false));
      buttonRow.append(saveButton, saveQuitButton, quitButton);
      commandRow.append(commandLabel, commandInput);
      editorArea.append(
        heading,
        modeLabel,
        textarea,
        commandRow,
        statusLine,
        buttonRow,
      );
      setMode("normal");
      textarea.focus();
    });
  const secretPrompt = (labelText) =>
    new Promise((resolve) => {
      if (activePrompt) {
        resolve("");
        return;
      }
      activePrompt = resolve;
      activePromptMode = "secret";
      input.disabled = false;
      prompt.textContent = labelText;
      input.type = "password";
      input.value = "";
      input.placeholder = "Enter simulated password";
      syncInputHighlight();
      focusInput();
    });
  const textPrompt = (labelText) =>
    new Promise((resolve) => {
      if (activePrompt) {
        resolve("");
        return;
      }
      activePrompt = resolve;
      activePromptMode = "text";
      input.disabled = false;
      prompt.textContent = labelText;
      input.type = "text";
      input.value = "";
      input.placeholder = "Type a response and press Enter";
      syncInputHighlight();
      focusInput();
    });
  const completeSecret = (value) => {
    if (!activePrompt) return false;
    const resolve = activePrompt;
    activePrompt = null;
    activePromptMode = null;
    input.type = "text";
    input.placeholder = "Type a command and press Enter";
    input.value = "";
    syncInputHighlight();
    setPrompt();
    resolve(value);
    return true;
  };
  const createIO = () => ({
    promptSecret: secretPrompt,
    promptText: textPrompt,
    openEditor: editorPromise,
    clear: clearScreen,
  });
  const mountWorkspace = async () => {
    const workspace = await createExerciseWorkspace(config, createIO());
    fs = workspace.fs;
    shell = workspace.shell;
  };
  const renderGrade = (result) => {
    gradeArea.hidden = false;
    gradeArea.replaceChildren();
    const heading = createElement(
      "h4",
      "",
      `Score: ${result.score} / ${result.maxScore}${result.passed ? " — all checks passed" : " — some checks need work"}`,
    );
    gradeArea.append(heading);
    const list = createElement("ul", "ot-checks");
    for (const check of result.checks) {
      const li = createElement("li", "ot-check");
      const statusText = createElement(
        "span",
        check.passed ? "ot-check-pass" : "ot-check-fail",
        check.passed ? "✓" : "×",
      );
      const detail = createElement("div", "", check.description);
      if (!check.passed && check.feedback)
        detail.append(createElement("span", "ot-feedback", check.feedback));
      else
        detail.append(
          createElement(
            "span",
            "ot-feedback",
            `${check.pointsAwarded} / ${check.pointsPossible} points`,
          ),
        );
      li.append(statusText, detail);
      list.append(li);
    }
    gradeArea.append(list);
    if (exercise.explanation)
      gradeArea.append(
        createElement("p", "ot-notice", `Explanation: ${exercise.explanation}`),
      );
  };
  const performCheck = async () => {
    if (!fs || disposed || mode !== "practice") return null;
    const result = gradeFilesystem(
      fs,
      config.checks || [],
      config.initialDirectory || "/home/student",
      shell?.commandRecords || [],
    );
    lastGrade = result;
    renderGrade(result);
    checkButton.disabled = result.passed && config.allowRetry === false;
    resetButton.disabled = result.passed && config.allowRetry === false;
    status.textContent = result.passed
      ? "Exercise complete"
      : "Workspace checked";
    try {
      await saveNow();
    } catch (error) {
      output(`Warning: could not save check result: ${error.message}\n`, true);
    }
    try {
      await onGrade(result);
    } catch (error) {
      output(`Could not update app progress: ${error.message}\n`, true);
    }
    return result;
  };
  const resetWorkspace = async () => {
    if (disposed) return;
    if (lastGrade?.passed && config.allowRetry === false) return;
    try {
      await mountWorkspace();
    } catch (error) {
      output(`Could not reset workspace: ${error.message}\n`, true);
      status.textContent = "Reset failed";
      return;
    }
    lastGrade = null;
    gradeArea.hidden = true;
    gradeArea.replaceChildren();
    clearScreen();
    output("Workspace reset to the exercise's initial state.\n");
    setPrompt();
    input.disabled = false;
    try {
      await saveNow();
    } catch (error) {
      output(`Could not save reset workspace: ${error.message}\n`, true);
    }
    await onChange("terminal-workspace");
    focusInput();
  };
  const runCommand = async (line, { echo = true } = {}) => {
    if (!shell || disposed || outputBusy) return;
    if (activePrompt) {
      completeSecret(line);
      return;
    }
    const trimmed = line.trim();
    if (!trimmed) return;
    if (lastGrade?.passed && config.allowRetry === false) {
      output("This exercise is complete and retries are disabled.\n", true);
      return;
    }
    lastGrade = null;
    gradeArea.hidden = true;
    gradeArea.replaceChildren();
    if (shell.closed && /^bash(?:\s|$)/.test(trimmed)) {
      shell.closed = false;
      output("Started a new simulated shell.\n");
    }
    if (echo) appendCommandEcho(screen, shell.prompt(), line);
    outputBusy = true;
    input.disabled = true;
    checkButton.disabled = true;
    resetButton.disabled = true;
    status.textContent = "Running…";
    try {
      const result = await shell.executeLine(line);
      output(result.stdout);
      output(result.stderr, true);
      if (shell.closed) status.textContent = "Shell exited";
      else status.textContent = "Ready";
      setPrompt();
      await onChange("terminal-workspace");
      await saveNow();
    } catch (error) {
      output(`${error.message}\n`, true);
      status.textContent = "Ready";
    } finally {
      outputBusy = false;
      input.disabled = false;
      checkButton.disabled =
        mode !== "practice" ||
        (lastGrade?.passed && config.allowRetry === false);
      resetButton.disabled = false;
      focusInput();
    }
  };
  const resetButton = createElement("button", "sec", "Reset workspace");
  resetButton.type = "button";
  resetButton.addEventListener("click", () => {
    pendingCommand = resetWorkspace().catch(() => {});
  });
  if (mode === "practice") actionTarget.append(checkButton);
  actionTarget.append(resetButton);
  if (!solutionButton.hidden) actionTarget.append(solutionButton);
  actionTarget.append(solutionArea);
  solutionButton.addEventListener("click", () => {
    const show = solutionArea.hidden;
    solutionArea.hidden = !show;
    solutionButton.textContent = show ? "Hide solution" : "Show solution";
    solutionButton.setAttribute("aria-expanded", String(show));
  });
  if (mode !== "practice") {
    checkButton.hidden = true;
  }
  checkButton.addEventListener("click", () => {
    pendingCommand = performCheck().catch(() => {});
  });
  clearButton.addEventListener("click", () => {
    clearScreen();
    focusInput();
  });
  focusButton.addEventListener("click", focusInput);
  let reverseSearch = null;
  const commonPrefix = (items) => {
    if (!items.length) return "";
    let prefix = items[0];
    for (const item of items.slice(1)) {
      let n = 0;
      while (n < prefix.length && n < item.length && prefix[n] === item[n]) n++;
      prefix = prefix.slice(0, n);
    }
    return prefix;
  };
  const completeInput = () => {
    if (!shell || activePrompt || outputBusy) return;
    const value = input.value;
    const cursor = input.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const match = before.match(/(?:^|[\s;|&])([^\s;|&]*)$/);
    const prefix = match ? match[1] : "";
    const start = cursor - prefix.length;
    let candidates = [];
    if (!before.slice(0, start).trim()) {
      candidates = [...new Set([...BUILTINS, ...shell.aliases.keys()])]
        .filter((name) => name.startsWith(prefix))
        .sort();
    } else {
      let expandedPrefix = prefix;
      if (expandedPrefix.startsWith("~"))
        expandedPrefix = shell.env.HOME + expandedPrefix.slice(1);
      const slash = expandedPrefix.lastIndexOf("/");
      const directory = slash >= 0 ? expandedPrefix.slice(0, slash + 1) : "";
      const basename =
        slash >= 0 ? expandedPrefix.slice(slash + 1) : expandedPrefix;
      const directoryPath = directory || ".";
      try {
        const node = shell.fs.resolve(directoryPath).node;
        if (node.type === "directory") {
          candidates = [...node.children.values()]
            .filter((entry) => entry.name.startsWith(basename))
            .map(
              (entry) =>
                directory +
                entry.name +
                (entry.type === "directory" ? "/" : ""),
            )
            .sort();
        }
      } catch {}
    }
    if (!candidates.length) return;
    const replacement =
      candidates.length === 1 ? candidates[0] : commonPrefix(candidates);
    if (replacement.length > prefix.length) {
      const escaped = replacement.replace(/([\\s"'`$&;()])/g, "\\\\$1");
      input.setRangeText(escaped, start, cursor, "end");
      syncInputHighlight();
    }
    if (candidates.length > 1) output(candidates.join("    ") + "\\n");
  };
  const updateReverseSearch = () => {
    if (!reverseSearch) return;
    const query = input.value;
    for (let i = reverseSearch.index; i >= 0; i--) {
      if (commandHistory[i]?.includes(query)) {
        reverseSearch.match = commandHistory[i];
        reverseSearch.index = i;
        status.textContent = `(reverse-i-search) '${query}': ${commandHistory[i]}`;
        return;
      }
    }
    reverseSearch.match = "";
    status.textContent = `(reverse-i-search) '${query}':`;
  };
  input.addEventListener("input", () => {
    if (reverseSearch) updateReverseSearch();
  });
  input.addEventListener("keydown", (event) => {
    if (reverseSearch) {
      if (event.key === "Enter") {
        event.preventDefault();
        input.value = reverseSearch.match || input.value;
        reverseSearch = null;
        input.placeholder = "Type a command and press Enter";
        syncInputHighlight();
        status.textContent = "Ready";
      } else if (
        event.key === "Escape" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "g")
      ) {
        event.preventDefault();
        reverseSearch = null;
        input.value = "";
        input.placeholder = "Type a command and press Enter";
        syncInputHighlight();
        status.textContent = "Ready";
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "r"
      ) {
        event.preventDefault();
        reverseSearch.index = Math.max(0, reverseSearch.index - 1);
        updateReverseSearch();
      }
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const value = input.value;
      if (activePrompt) {
        completeSecret(value);
        return;
      }
      // The textarea can receive synthetic events even while disabled. Guard
      // this path too, so an early Enter never dereferences an unready shell.
      if (!shell || disposed) {
        event.preventDefault();
        return;
      }
      input.value = "";
      syncInputHighlight();
      const currentPrompt = continuationActive ? ">" : shell.prompt();
      const continuationIndex = shellLineContinuationIndex(value);
      appendCommandEcho(screen, currentPrompt, value);
      if (continuationIndex >= 0) {
        // Remove only the final continuation slash; paired backslashes before
        // it remain and are interpreted by the shell in the completed command.
        continuationBuffer += value.slice(0, -1);
        continuationActive = true;
        input.placeholder = "Continue command, then press Enter";
        setPrompt();
        status.textContent = "Waiting for continuation…";
        focusInput();
        return;
      }
      const command = continuationActive ? continuationBuffer + value : value;
      clearContinuation();
      commandHistory.push(command);
      if (commandHistory.length > 500) commandHistory.shift();
      historyIndex = commandHistory.length;
      pendingCommand = runCommand(command, { echo: false }).catch(() => {});
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!commandHistory.length) return;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = commandHistory[historyIndex] || "";
      syncInputHighlight();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      historyIndex = Math.min(commandHistory.length, historyIndex + 1);
      input.value = commandHistory[historyIndex] || "";
      syncInputHighlight();
    } else if (event.key === "Tab") {
      event.preventDefault();
      completeInput();
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "r"
    ) {
      event.preventDefault();
      if (!activePrompt) {
        reverseSearch = { index: commandHistory.length - 1, match: "" };
        input.value = "";
        input.placeholder = "(reverse-i-search) type to search history";
        syncInputHighlight();
        status.textContent = "(reverse-i-search)";
        input.focus();
      }
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "d"
    ) {
      event.preventDefault();
      if (activePrompt) completeSecret("");
      else if (!input.value) {
        commandHistory.push("exit");
        historyIndex = commandHistory.length;
        pendingCommand = runCommand("exit").catch(() => {});
      } else {
        const start = input.selectionStart ?? 0,
          end = input.selectionEnd ?? start;
        input.setRangeText(
          "",
          start,
          end > start ? end : Math.min(input.value.length, start + 1),
          "end",
        );
        syncInputHighlight();
      }
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "c"
    ) {
      event.preventDefault();
      if (activePrompt) completeSecret("");
      else {
        output("^C\n");
        input.value = "";
        if (continuationActive) clearContinuation();
        syncInputHighlight();
      }
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "l"
    ) {
      event.preventDefault();
      clearScreen();
    } else if (event.key === "Escape" && editorResolve) {
      /* editor has its own Cancel button */
    }
  });
  screen.addEventListener("click", focusInput);
  keyBar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-key]");
    if (!button) return;
    const key = button.dataset.key;
    if (key === "CtrlL") clearScreen();
    else if (key === "CtrlC") {
      if (activePrompt) completeSecret("");
      else {
        output("^C\n");
        input.value = "";
        if (continuationActive) clearContinuation();
        syncInputHighlight();
      }
    } else if (key === "ArrowUp" || key === "ArrowDown")
      input.dispatchEvent(new KeyboardEvent("keydown", { key }));
    else if (key === "Tab") completeInput();
    else if (key === "Escape") {
      if (activePrompt) completeSecret("");
    }
    focusInput();
  });

  try {
    db = await makeIdb();
    try {
      savedRecord = await idbRequest(db, "readonly", (store) => store.get(key));
    } catch (error) {
      throw new Error(`Could not read saved workspace: ${error.message}`);
    }
    if (savedRecord) {
      try {
        if (savedRecord.version !== TERMINAL_VERSION)
          throw new Error("Saved workspace version is outdated");
        fs = VirtualFS.restore(savedRecord.filesystem);
        shell = new Shell(fs, createIO());
        shell.restore(savedRecord.shell);
        const candidateGrade = savedRecord.lastGrade;
        const validGrade =
          ownPlain(candidateGrade) &&
          Number.isFinite(candidateGrade.score) &&
          Number.isFinite(candidateGrade.maxScore) &&
          typeof candidateGrade.passed === "boolean" &&
          Array.isArray(candidateGrade.checks) &&
          candidateGrade.checks.length === config.checks.length &&
          candidateGrade.checks.every(
            (item) => ownPlain(item) && typeof item.passed === "boolean",
          );
        lastGrade = validGrade
          ? {
              score: candidateGrade.score,
              maxScore: candidateGrade.maxScore,
              passed: candidateGrade.passed,
              checks: candidateGrade.checks.map((item) => ({
                id: safeText(item.id),
                passed: item.passed,
                pointsAwarded: Number(item.pointsAwarded) || 0,
                pointsPossible: Number(item.pointsPossible) || 0,
                description: safeText(item.description),
                feedback: safeText(item.feedback),
              })),
            }
          : null;
        if (config.resetOnRetry && lastGrade && !lastGrade.passed) {
          await mountWorkspace();
          lastGrade = null;
        }
      } catch (error) {
        await mountWorkspace();
        notice.hidden = false;
        notice.textContent = `A saved workspace could not be restored (${error.message}). A clean workspace is ready; the invalid saved data was not used.`;
      }
    } else await mountWorkspace();
    if (lastGrade) renderGrade(lastGrade);
    if (
      mode === "practice" &&
      lastGrade?.passed &&
      config.allowRetry === false
    ) {
      checkButton.disabled = true;
      resetButton.disabled = true;
    }
    if (!shell) await mountWorkspace();
    setPrompt();
    output(
      savedRecord && !notice.hidden
        ? "A clean workspace was created because the previous save was invalid.\n"
        : "ACS Practice virtual Linux environment. This is a JavaScript simulation, not a real Linux kernel.\nType help for supported commands.\nSimulated account passwords: student/student and root/root (local exercise data only).\n",
    );
    if (shell.history.length) {
      commandHistory = shell.history.slice();
      historyIndex = commandHistory.length;
    }
    if (!savedRecord || !notice.hidden) await saveNow();
    status.textContent = "Ready";
    input.disabled = false;
    focusInput();
  } catch (error) {
    showError(
      `The terminal could not be initialized: ${error.message}. Other exercises remain available.`,
    );
  }

  const dispose = () => {
    if (disposed) return Promise.resolve();
    disposed = true;
    if (activePrompt) {
      activePrompt("");
      activePrompt = null;
    }
    if (editorResolve) {
      editorResolve();
      editorResolve = null;
    }
    const connection = db;
    db = null;
    instance.replaceChildren();
    return (async () => {
      try {
        await pendingCommand;
        if (connection && fs && shell) {
          const record = {
            key,
            version: TERMINAL_VERSION,
            savedAt: Date.now(),
            filesystem: fs.serialize(),
            shell: shell.serialize(),
            lastGrade,
          };
          await idbRequest(connection, "readwrite", (store) =>
            store.put(record),
          );
        }
      } catch {
        /* closing an exercise must never break the host application */
      } finally {
        try {
          connection?.close();
        } catch {}
      }
    })();
  };
  return {
    async check() {
      pendingCommand = performCheck().catch(() => null);
      return pendingCommand;
    },
    async reset() {
      pendingCommand = resetWorkspace().catch(() => {});
      return pendingCommand;
    },
    async save() {
      await pendingCommand;
      return saveNow();
    },
    dispose,
    get lastGrade() {
      return lastGrade;
    },
  };
}

// Standalone terminal playground. It has its own stable IndexedDB workspace,
// no grading controls, and no connection to an exercise attempt.
export function mountTerminalSandbox({ container, workspaceId = "default" }) {
  const exercise = {
    id: "sandbox-terminal",
    title: "Terminal Sandbox",
    terminal: {
      profile: "basic-linux",
      initialDirectory: "/home/student",
      initialFilesystem: [],
      checks: [
        {
          id: "sandbox-root",
          type: "directory",
          path: "/",
          points: 0,
          description: "Sandbox root exists.",
        },
      ],
    },
  };
  return mountTerminalExercise({
    container,
    exercise,
    packageId: "__sandbox__",
    exerciseId: "terminal",
    attemptId: String(workspaceId || "default"),
    mode: "sandbox",
  });
}

// Used by the host exam grader. It reads the same persisted filesystem and
// shell command/output records that the mounted terminal has saved.
export async function gradeTerminalAttempt({
  exercise,
  packageId,
  exerciseId,
  attemptId,
}) {
  const config = validateExercise(exercise);
  const key = [
    String(packageId || "package"),
    String(exerciseId || exercise.id || "exercise"),
    String(attemptId || "exam"),
  ].join("::");
  const db = await makeIdb();
  try {
    let fs = null;
    let commandRecords = [];
    const saved = await idbRequest(db, "readonly", (store) => store.get(key));
    if (saved && saved.version === TERMINAL_VERSION) {
      try {
        fs = VirtualFS.restore(saved.filesystem);
        const savedShell = new Shell(fs, {});
        savedShell.restore(saved.shell);
        commandRecords = savedShell.commandRecords;
      } catch {
        fs = null;
        commandRecords = [];
        /* fall back to a clean attempt below */
      }
    }
    if (!fs) {
      const io = {
        promptSecret: async () => "",
        openEditor: async () => "",
        clear: () => {},
      };
      ({ fs } = await createExerciseWorkspace(config, io));
    }
    return gradeFilesystem(
      fs,
      config.checks || [],
      config.initialDirectory || "/home/student",
      commandRecords,
    );
  } finally {
    db.close();
  }
}
