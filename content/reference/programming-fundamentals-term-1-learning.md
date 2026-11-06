# Java Programming · Term 1 Learning Path

This learning path takes you from the first Java program to object-oriented programs that combine the complete supplied Term 1 theory summary. It follows the summary as the curriculum source: the goal is to teach its concepts, vocabulary, syntax, rules, comparisons and stated boundaries—not to introduce unrelated advanced Java topics.

Work through the 20 sections in order. Each section explains its concepts, names the exercises dedicated to them, and ends with a checkpoint. Later sections deliberately reuse earlier knowledge. The last section contains three capstones that bring foundational and later concepts together.

## How to use this path

1. **Read Purpose first.** Study the definitions, syntax and examples. Before coding, explain the new idea aloud or write a short summary in your own words.
2. **Attempt every Practice exercise in order.** Read its complete JSON instructions, use the hints only when useful, and write the solution yourself before checking the reference solution. Do not skip an exercise just because its first example looks familiar.
3. **Run the checkpoint without copying.** Predict outputs, explain distinctions, or write the requested mini-program independently. Return to the explanation and exercises if you cannot justify your answer.
4. **Revisit earlier concepts.** Keep variables, operators, conditions, loops, methods, Strings and object design active as the problems become larger. The final projects should feel like combinations of skills you have already practised.

### Recommended study routine

For each study session, review the previous checkpoint, read one new Purpose, complete the corresponding exercises without looking at the solutions, and finish by writing down one mistake you corrected and one rule you can now explain. Revisit older material after a few sections rather than waiting until the end. You can keep your own notes or checklist; this guide does not assume that the exercise platform provides progress tracking.

### Exercise and output conventions

The exercise package is `programming-fundamentals-term-1-learning.json`. Each exercise ID is stable and appears beside its section number below. For example, Section 01, Exercise 03 is `java-t1-01-03`. The package contains 82 exercises; every exercise includes a reference solution and one or more checks.

The checks deliberately use regex matching for standard output. Leading and trailing whitespace, line-ending differences, and ordinary spacing between output tokens are tolerated where the pattern uses `\s`. The required words, values, case, order and important punctuation are still checked. Do not print prompts, debug messages, labels or extra explanatory lines unless the exercise explicitly asks for them. When an exercise asks you to read a String, use the supplied input; do not hardcode one tested name or phrase. Multiple tests vary input values and text, and some checks permit one or more spaces between words.

### Mandatory single-file rule

The browser environment accepts exactly one Java source file for each exercise: **`Main.java`**. Keep `public class Main` as the only public top-level class. Any supporting classes (for example `Car`, `Rectangle`, `Student` or `Book`) must be package-private and defined in the same file, after or before `Main`. Put every import at the top of the file and write no `package` declaration. You will learn what packages mean, why they exist and how imports work, but you will not be asked to build package directories or use multiple source files. This restriction changes the file layout, not the concepts of classes, objects, constructors, references or encapsulation.

### Difficulty progression

| Stage | Sections | What changes |
|---|---:|---|
| 1 — Absolute fundamentals | 01–04 | Tiny isolated tasks; one or two new ideas at a time. |
| 2 — Basic application | 05–08 | Apply decisions, loops and methods to small requirements. |
| 3 — Combining concepts | 09–14 | Build objects, use references, Strings and formatting with earlier control flow. |
| 4 — Independent problem-solving | 15–19 | Design classes and APIs, validate state, construct objects and calculate results. |
| 5 — Advanced integration | 20 | Solve broader requirements by choosing and organizing the appropriate constructs. |

---

## Section 01 — Programming foundations and the Java platform

*Stage 1 — Absolute fundamentals*

**Purpose:**

This first section explains what programming is and how Java source becomes an executing program. A **programming language** expresses instructions for a computer. The supplied course distinguishes three generations:

- **Machine language (first generation):** binary instructions used by a processor; it is processor-specific.
- **Assembly language (second generation):** more readable symbolic instructions, but still tied to a processor.
- **Third-generation languages (3GL):** higher-level, more readable source code that is not written as one processor's binary instructions. Java is presented as a 3GL; the summary also lists C, C++, BASIC, C#, Pascal, Python and JavaScript as examples.

### Compiled, interpreted and Java execution models

In the **compiled-language model**, a programmer writes source text, a compiler translates it into binary code, and the target platform executes that binary. Different processor families may need different compiled outputs. The course lists compile-time checks, fast direct execution, portability between development environments and source not being readable on the target as advantages. It lists platform-dependent binaries and the need to recompile after changes as disadvantages. C and C++ are its examples.

In the **interpreted-language model**, source text is given to an interpreter on the target system, which transforms and executes it. The course uses JavaScript and Python as examples. It lists portable source and platform independence when a suitable interpreter exists as advantages; it lists no compile-time checks in this simplified model, the need to install an interpreter, slower execution in the described model and readable source on the target as disadvantages.

Java combines these ideas:

```text
Main.java (source text)
       │  javac — Java compiler in the JDK
       ▼
Main.class (JVM bytecode)
       │  JVM on the target platform
       ▼
program execution
```

The `.java` file contains source code. The compiler produces bytecode in a `.class` file. Bytecode is intended for the **Java Virtual Machine (JVM)**, described in the slides as a software processor. A compatible Java platform on another processor can execute the same bytecode. The **Java API** and JVM hide platform differences. The course characterizes Java as object-oriented, interpreted, distributed, robust, multithreaded, secure and fast. It describes Java's speed as medium in its comparison, and identifies a virtual machine and an additional runtime compilation/optimization step as costs.

**Java accuracy note:** the summary calls the extra step “JIT”. More precisely, a *just-in-time (JIT) compiler* can compile frequently executed bytecode to native machine code while the JVM is running; it is not normally a separate `javac` step that the programmer performs immediately before every run. The core course distinction remains source → bytecode → JVM execution.

The summary notes that Java appeared in the 1990s through Sun Microsystems and is now owned by Oracle. It describes Java syntax as based on C++ and both Java and C++ as object-oriented, while highlighting Java's platform independence in that comparison. Java applications include **desktop** programs (the slides give LibreOffice and Minecraft), **server** applications, and **mobile** applications (Android is given). The initial course focus is desktop programming.

### JRE, JDK and IDE

| Term | Meaning in the course | What it is for |
|---|---|---|
| **JRE — Java Runtime Environment** | JVM + Java API | Runs Java bytecode programs. |
| **JDK — Java Development Kit** | JRE + development tools and extras | Provides tools such as the compiler and debugger; API reference documentation is listed as an optional extra. |
| **IDE — Integrated Development Environment** | Developer workbench application | Helps write, build and run programs; an IDE can support several languages. |

Remember: **JDK = JRE + development extras**. An IDE is not the JDK or JRE. A text editor is enough to write source; an IDE such as IntelliJ adds build/run support, feedback and suggestions.

### The first Java application

A basic application has a class and a `main` entry point:

```java
public class HelloWorldApp {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}
```

`main` is where the application starts. `System.out.println(...)` writes text and ends the line; `System.out.print(...)` writes without ending the line. Java comments are ignored by the compiler: `//` starts a single-line comment and `/* ... */` marks a block comment.

The lecture example also has `package hello;`. A **package** groups related source types and normally corresponds to a directory structure. The browser exercises in this package deliberately do not create package folders: each exercise is one file named `Main.java`, with `Main` as its only public top-level class. Other top-level helper classes must be package-private and appear in the same file. Imports, when needed, go before the class declaration.

The command-line sequence shown in the course is `javac hello/HelloWorldApp.java`, which creates a `.class` file, followed by `java HelloWorldApp`, which starts the JVM. In IntelliJ, Run performs the build and execution; the slides mention `src` for source files and `out` for generated class files by default.

### Algorithms before code

An **algorithm** is a sufficiently detailed sequence of steps for completing a task. Programming involves designing the steps and encoding them in a language the computer can execute. The pizza-order robot example emphasizes that vague instructions are not enough: each step must be explicit enough for the robot.

The course's common algorithm actions are:

1. **Ask for input** — obtain data from a user or another source.
2. **Produce output** — display a result or message.
3. **Test** — choose actions based on a condition.
4. **Repeat** — execute steps several times.
5. **Compute** — calculate a value.

A two-number sum combines input, variables, computation and output. Java can display a prompt with `System.out.print`, read keyboard input with `Scanner`, store the returned value in a correctly typed variable, compute, and display the result. `Scanner` is in `java.util`, so the example imports `java.util.Scanner` and constructs `new Scanner(System.in)`. It reads an integer with `nextInt()`. The lecture example closes the keyboard scanner at the end to release resources; in a short browser exercise, do not close `System.in` before the required input has been read.

The number-guess example combines input with `<`, `>` and `==` comparisons and conditional messages; you will implement that logic in **05.05**.

**Practice:** Start with the program entry point and visible output. Then translate a tiny input-compute-output algorithm into Java. Learn to separate source code from the text the program displays, and to include user input in the calculation rather than hardcoding a sample result.

Complete exercises **01.01–01.03**. Work through them in order:

- **01.01 — Print the first Java message** (`java-t1-01-01`)
- **01.02 — Use comments and distinguish print from println** (`java-t1-01-02`)
- **01.03 — Turn a sum algorithm into Java** (`java-t1-01-03`)

**Checkpoint:** Without looking at the guide, sketch the Java execution pipeline from a `.java` file to a running application. Then explain in your own words how the JDK differs from the JRE and an IDE. Finally, describe a five-step algorithm for a robot to add two numbers and display the result; every input, computation and output step must be explicit.

---

## Section 02 — Variables, primitive types, identifiers and literals

*Stage 1 — Absolute fundamentals*

**Purpose:**

A **variable** is a named location used to store data. Every variable has a **name**, a **type** and a **scope** (where the name can be used). Declare a variable before using it:

```java
type name;
int firstNumber;
int numberOne = 10;
int numberTwo = 100;
```

The declaration gives the variable a type and identifier. Initialization supplies its first value. Although Java allows several same-type declarations on one line (`int a, b;`), the slides discourage that style because separate declarations are easier to read.

### Primitive types

The following are the eight primitive types covered in the summary:

| Type | Meaning | Representation in the slides | Range / values |
|---|---|---|---|
| `byte` | Byte integer | 8-bit two's complement | −128 to 127 |
| `short` | Short integer | 16-bit two's complement | −32,768 to 32,767 |
| `int` | Integer | 32-bit two's complement | −2³¹ to 2³¹ − 1 |
| `long` | Long integer | 64-bit two's complement | −2⁶³ to 2⁶³ − 1 |
| `float` | Single-precision floating point | 32-bit IEEE 754 | Approximately −3.4E+38 to 3.4E+38 |
| `double` | Double-precision floating point | 64-bit IEEE 754 | Approximately −1.7E+308 to 1.7E+308 |
| `boolean` | Logical value | Table lists 1 bit | `false` or `true` |
| `char` | Character | 16-bit Unicode | `\u0000` to `\uFFFF` |

**Java accuracy note:** the course table lists `boolean` as 1 bit, but the Java language does not specify a one-bit storage size for a boolean variable. For this term, the important rule is that a boolean value is either `true` or `false`. `String` is not a primitive type; it is a class, covered in Section 12.

Choose a type that matches the data: an age can be an `int`, a percentage with a fractional part can be a `double`, a single initial can be a `char`, and a person's name can be a `String`.

### Identifiers and naming conventions

A variable name is an **identifier**. The supplied rules say that it can contain letters, digits, `_` and `$`, but it cannot begin with a digit or be a reserved Java keyword. Names are **case-sensitive** and must be unique within their scope. A name such as `score` differs from `Score`.

Use meaningful names. The recommended variable style is **camelCase**: begin with a lowercase letter and capitalize the beginning of later words, for example `firstNumber` or `greatestCommonDivisor`. Avoid `_` and `$` in ordinary variable names. Keywords have a defined language meaning and cannot be used as names; the slides point to `var` and `yield` as examples.

### Literals

A **literal** is a fixed value written directly in source code. The course formats are:

| Type | Literal form | Example |
|---|---|---|
| `boolean` | `true` or `false` | `boolean firstTime = true;` |
| `char` | Single quotes, or the corresponding character code | `char letter = 'A';` or `char letter = 65;` |
| `int` | Integer digits; `_` may group digits | `int million = 1_000_000;` |
| `long` | Integer literal ending in `L` or `l` | `long value = 1247418127475L;` |
| `double` | Decimal point or scientific notation | `double average = 13.25;` or `1.0E-8` |
| `float` | Decimal literal ending in `F` or `f` | `float distance = 3.25F;` |
| `String` | Text in double quotes | `String name = "Pete";` |

The slides note that numeric literals can be represented in bases other than decimal, but do not develop the syntax in this term.

### Escape sequences

A backslash introduces a special character in a character or String literal. Know all of the sequences listed in the course:

| Escape | Meaning |
|---|---|
| `\n` | Newline |
| `\r` | Return / carriage return |
| `\t` | Tabulator |
| `\b` | Backspace |
| `\f` | Form feed / new page |
| `\'` | Single quote |
| `\"` | Double quote |
| `\\` | Backslash |

For example, a double quote inside a String must be escaped so that Java does not treat it as the end of the literal:

```java
System.out.println("Welcome to \"Java\"");
```

Line-ending conventions differ between systems. The summary notes that Java handles necessary line-ending conversion; the important lesson here is how an escape sequence represents a control character or a quote inside a literal.

### Constants with `final`

A variable declared `final` can be initialized once and cannot then be assigned another value. The slides also call a final variable a **constant**. Name constants using uppercase letters and underscores:

```java
final int MAXIMUM_TEMPERATURE = 100;
```

Prefer a named constant to an unexplained literal (“magic number”) when the value has a clear meaning. The name communicates the rule and avoids repeating a value throughout the program.

**Practice:** Work with all eight primitive types and distinguish them from String. Practise naming identifiers, reading literal suffixes, representing quotes and tabs, and replacing an unexplained fixed value with a named final constant.

Complete exercises **02.01–02.04**. Work through them in order:

- **02.01 — Declare and initialize primitive variables** (`java-t1-02-01`)
- **02.02 — Use valid identifiers and camelCase** (`java-t1-02-02`)
- **02.03 — Print literals and escaped characters** (`java-t1-02-03`)
- **02.04 — Replace a magic number with a final constant** (`java-t1-02-04`)

**Checkpoint:** For each of these values, choose a suitable type and explain why: an age, a very large whole number, a temperature with decimals, a yes/no status, a letter grade and a full name. Then identify which of these declarations is invalid and explain why: `int 2ndPlace = 3;`, `float rate = 2.5;`, `long total = 9000000000L;`, `char initial = 'A';`. Finally write a constant for a maximum number of attempts.

---

## Section 03 — Type conversion and Java operators

*Stage 1 — Absolute fundamentals*

**Purpose:**

A **type conversion** changes a value from one type to another. Java permits the widening conversion shown in the summary:

```java
int a = 100;
double b = a;       // allowed: int value assigned to double
```

The reverse is not accepted implicitly in the example because a `double` may contain a fractional part:

```java
double c = 100.2;
// int d = c;       // does not compile
int d = (int) c;    // explicit cast; result is 100
```

A **cast** puts the target type in parentheses before the value. Casting a floating-point number to an integer truncates the fractional part in the examples; it does not round. Operand types also determine division: `10 / 3` gives integer result `3`, while `(double) 10 / 3` and `10 / (double) 3` produce about `3.333…`. `7.0 / 2.0` gives `3.5`. Casting both operands to int gives integer division.

### Mathematical operators

| Operator | Meaning |
|---|---|
| `+` | Sum |
| `-` | Difference |
| `*` | Product |
| `/` | Division |
| `%` | Remainder after division |

The examples `13 % 5 = 3`, `15 % 5 = 0`, and `21 % 5 = 1` show how the remainder changes. Use `%` to test divisibility: a number is divisible by 3 when `number % 3 == 0`.

### Increment, decrement and unary operators

`++` increases a variable by one; `--` decreases it by one. Prefix and postfix differ in the value of the expression:

- `++i`: increment first, then use the new value (**pre-increment**).
- `i++`: use the old value, then increment (**post-increment**).
- `--i`: decrement first, then use the new value (**pre-decrement**).
- `i--`: use the old value, then decrement (**post-decrement**).

If `i` begins at 10, `number = ++i` gives `number = 11` and `i = 11`; `number = i++` gives `number = 10`, then leaves `i = 11`. The same timing distinction applies to decrement. Unary `-op` gives the negative of an operand. Unary `+op` promotes a `byte`, `short` or `char` operand to `int`.

### Relational and logical operators

Relational operators compare two operands and return a boolean:

| Operator | Meaning |
|---|---|
| `>` | Greater than |
| `>=` | Greater than or equal |
| `<` | Less than |
| `<=` | Less than or equal |
| `==` | Equal |
| `!=` | Not equal |

Logical operators combine boolean expressions:

- `&&` (**AND**) is true only when both operands are true.
- `||` (**OR**) is true when at least one operand is true.
- `!` (**NOT**) reverses a boolean value.

| A | B | `A && B` | `A || B` |
|---|---|---|---|
| true | true | true | true |
| true | false | false | true |
| false | true | false | true |
| false | false | false | false |

For example, an age inside an inclusive interval is `age >= 18 && age <= 67`. An age outside that interval is `age < 18 || age > 67`.

### Assignment operators

`=` assigns the right-hand value to the variable on the left. Compound assignment performs a calculation and stores the result back:

| Form | Equivalent |
|---|---|
| `a += b` | `a = a + b` |
| `a -= b` | `a = a - b` |
| `a *= b` | `a = a * b` |
| `a /= b` | `a = a / b` |
| `a %= b` | `a = a % b` |

The calculation happens before the new value is assigned.

### Other operators named in the course

These forms are included in the lecture list, even though several are only introduced as later topics:

| Form | Meaning in the supplied summary |
|---|---|
| `.` | Qualified member name, such as `object.property` |
| `[]` | Create arrays and access their elements, such as `array[x]` |
| `(params)` | Comma-separated parameter list |
| `(type)` | Explicit cast |
| `new` | Create an object or array |
| `instanceof` | Test whether an object is of a class or one of its subclasses |

### Operator precedence

**Precedence** determines the order in which operators are evaluated. The course lists the following groups from highest to lowest priority:

1. Postfix: `[]`, `.`, parameter list `()`, `expr++`, `expr--`.
2. Unary: `++expr`, `--expr`, unary `+`, unary `-`, `~`, `!`.
3. Creation and cast: `new`, `(type)expr`.
4. Multiplication, division and remainder: `*`, `/`, `%`.
5. Addition and subtraction: `+`, `-`.
6. Shifts: `<<`, `>>`, `>>>`.
7. Relational: `<`, `>`, `<=`, `>=`, `instanceof`.
8. Equality: `==`, `!=`.
9. Bitwise AND: `&`.
10. Bitwise XOR: `^`.
11. Bitwise OR: `|`.
12. Logical AND: `&&`.
13. Logical OR: `||`.
14. Conditional: `?:`.
15. Assignment: `=`, `+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `^=`, `|=`, `<<=`, `>>=`, `>>>=`.

Do not make code hard to read by depending on memory of this list. Use parentheses to communicate the intended order, for example `(a + b) * c`.

**Practice:** Calculate integer quotients and remainders, trace prefix and postfix updates, cast between numeric types, apply compound assignments, and compare expressions with and without parentheses. These tasks deliberately use earlier variables and literals again.

Complete exercises **03.01–03.06**. Work through them in order:

- **03.01 — Calculate quotient and remainder** (`java-t1-03-01`)
- **03.02 — Trace pre- and post-increment** (`java-t1-03-02`)
- **03.03 — Use decrement and unary operators** (`java-t1-03-03`)
- **03.04 — Convert numeric types explicitly** (`java-t1-03-04`)
- **03.05 — Update values with compound assignment** (`java-t1-03-05`)
- **03.06 — Make operator precedence explicit** (`java-t1-03-06`)

**Checkpoint:** Without running Java, predict the value of `result` and the final value of `i` for `int i = 10; int result = i++ + ++i;`. Then calculate `10 / 3`, `(double) 10 / 3`, and `(int) (10.0 / 3)`. Explain why the results differ. Finally write both an inside-range condition using `&&` and an outside-range condition using `||`; explain how `!` reverses a boolean result.

---

## Section 04 — Expressions, statements, blocks and scope

*Stage 1 — Absolute fundamentals*

**Purpose:**

An **expression** consists of literals, variables, operators and/or method calls and evaluates to one value. For example, `a = 15 * b + c` contains a calculation, while `a < 120` evaluates to `true` or `false`.

A **statement** is a basic program instruction. The course identifies:

- **Declaration statement:** introduces a variable, for example `double a;`.
- **Assignment statement:** gives a variable a value, for example `a = 15 * Math.PI;`.
- **Method-call statement:** calls a method, for example `System.out.println(a);`.
- **Compound statement:** contains or controls other statements, such as flow-control statements.

A simple statement ends with a semicolon (`;`). An `if` statement containing a block is a compound statement.

A **block** groups statements between curly braces `{` and `}`. A block can appear where Java allows a simple statement. Indent the statements inside each block one level deeper; indent continued lines as well. Clear indentation makes nesting easier to understand. IntelliJ's reformat feature can apply indentation consistently.

**Scope** is the region in which a variable name is known. The rules in the summary are:

- A variable is known inside the block where it is declared and inside nested blocks.
- Its scope begins at its declaration line.
- Its scope ends at the closing brace of its declaring block.
- A variable declared in an inner block cannot be used after that block closes.
- Two separate inner blocks can each declare a local variable with the same name because their scopes do not overlap.

An outer variable can be used from an inner block. A local variable created in an inner block cannot be used after that block. Remember that a block is the braces and statements; scope is the visibility region of a declaration.

**Practice:** Practise building an expression, storing its value in an assignment statement, and displaying it with a method-call statement. Then use nested and separate blocks to observe which local variables remain accessible. Prioritize readable braces and indentation over compressed code.

Complete exercises **04.01–04.03**. Work through them in order:

- **04.01 — Build expressions and statements** (`java-t1-04-01`)
- **04.02 — Observe nested block scope** (`java-t1-04-02`)
- **04.03 — Use independent blocks and readable indentation** (`java-t1-04-03`)

**Checkpoint:** Label each of these as an expression, statement or block: `a + b`, `int total = 0;`, `System.out.println(total);`, and `{ int local = 4; }`. Then write a short program with an outer variable and a separate inner-block variable. Predict which names can be used after each closing brace, and explain why.

---

## Section 05 — Conditional execution: if, else, logical tests and ?:

*Stage 2 — Basic application*

**Purpose:**

Normally Java executes statements in sequence. **Flow-control statements** alter that sequence. Conditional execution chooses what to execute based on a boolean condition.

### `if`

An `if` block runs only when its condition is true:

```java
if (score >= 10) {
    System.out.println("success");
}
```

When the condition is false, Java skips the block and continues after it. The slides recommend always using braces, even for one statement.

### `if...else`

Use `if...else` when there are two alternatives. The `if` block runs when the condition is true; the `else` block runs otherwise. Use braces around both blocks.

### Nested `if` and `else if`

A nested `if` places another conditional inside an `else` block. It can express several decisions, but deep nesting is difficult to read. An `else if` chain is usually clearer for ordered categories, such as grades:

```java
if (grade >= 90) {
    System.out.println("A");
} else if (grade >= 80) {
    System.out.println("B");
} else if (grade >= 70) {
    System.out.println("C");
} else if (grade >= 60) {
    System.out.println("D");
} else {
    System.out.println("E");
}
```

The order matters: check the highest threshold first. Once a branch is selected, later branches do not execute. An `else` followed by one `if` can be written as `else if` without an unnecessary extra nested block.

### Conditional operator `?:`

The **conditional operator**, also called the **ternary operator**, has this form:

```java
condition ? valueIfTrue : valueIfFalse
```

The condition must be boolean. If true, the expression yields the second operand; otherwise it yields the third. This is an **expression** and produces a value. An `if...else` is a **statement** and does not itself yield a value. For example:

```java
String status = (score >= 10) ? "success" : "try again";
```

Use `?:` for a concise value choice; use `if...else` when each branch needs multiple statements or the decision is easier to read that way.

Relational operators (`<`, `>`, `<=`, `>=`, `==`, `!=`) and logical operators (`&&`, `||`, `!`) produce or combine booleans. Revisit their truth table in Section 3. The number-guess task uses `<`, `>` and `==` to distinguish too-low, too-high and correct guesses.

**Practice:** Move from a single `if` to two-way decisions and then to ordered multi-way decisions. Test boundary values rather than only typical values. Use `&&` for an inclusive interval, then use `||` and `!` to express the outside-range test. Implement a three-way number-guess comparison and finish with a value-producing conditional expression.

Complete exercises **05.01–05.06**. Work through them in order:

- **05.01 — Use an if statement for a single decision** (`java-t1-05-01`)
- **05.02 — Choose between two alternatives with if else** (`java-t1-05-02`)
- **05.03 — Classify a score with an else-if chain** (`java-t1-05-03`)
- **05.04 — Combine relational and logical operators** (`java-t1-05-04`)
- **05.05 — Give number-guessing feedback with relational operators** (`java-t1-05-05`)
- **05.06 — Combine OR and NOT to test an outside range** (`java-t1-05-06`)

**Checkpoint:** Write a grade classifier for 90+, 80–89, 70–79, 60–69 and below 60. Explain why the conditions must be ordered from highest to lowest. Then write a ternary expression that assigns `"adult"` or `"minor"` from a boolean age test. Explain one difference between that expression and an if/else statement.

---

## Section 06 — Traditional switch, arrow switch and switch expressions

*Stage 2 — Basic application*

**Purpose:**

A `switch` selects among values by equality. It is useful when one selector is compared with several constant cases.

### Traditional colon-style switch

```java
switch (day) {
    case 0:
        System.out.println("monday");
        break;
    case 1:
        System.out.println("tuesday");
        break;
    default:
        System.out.println("invalid day");
}
```

When a case matches, its statements run. Execution continues until a `break` or the end of the switch. Without a `break`, execution continues into the next case; this is **fall-through**. Fall-through can be intentional when several case labels share one action, such as grouping March, April and May as spring. `default` is optional in a traditional switch and runs when no case matches if it is present.

The supplied summary describes the traditional selector as an integral type (giving `int`, `long`, etc.) or a `String`. **Java accuracy note:** Java does not allow a `long` selector in a traditional switch. For the level of this course, use an `int` or a `String` selector; Java also supports other specific types such as `byte`, `short`, `char` and enum values.

### Arrow-style switch

The slides introduce simplified switch syntax as available since Java 14. It uses `->`:

```java
switch (month) {
    case "march", "april", "may" -> System.out.println("spring");
    case "june", "july", "august" -> System.out.println("summer");
    default -> System.out.println("invalid month");
}
```

Multiple values can share one arrow case. Arrow cases do not fall through, so they do not need `break`.

### Switch expressions and `yield`

A switch can be an **expression** that returns a value:

```java
String season = switch (month) {
    case "march", "april", "may" -> "spring";
    case "june", "july", "august" -> "summer";
    case "september", "october", "november" -> "autumn";
    case "december", "january", "february" -> "winter";
    default -> "invalid month";
};
```

Every possible selector value must produce a result. If the listed cases are not exhaustive, include `default`. An arrow case can contain a block with several statements; use `yield` inside the block to supply the switch expression's value:

```java
default -> {
    System.out.println("Please use lower case English month names");
    yield "invalid month";
}
```

The `yield` statement returns that value from the switch-expression block. Do not confuse it with `break` in a traditional switch.

**Practice:** Complete one traditional switch with explicit breaks and a default case, then group cases intentionally through fall-through. Move to arrow syntax with multiple labels, and finally produce a String using a switch expression. Practise a block-style default branch that prints a warning and returns a fallback with `yield`.

Complete exercises **06.01–06.04**. Work through them in order:

- **06.01 — Use a traditional switch with break** (`java-t1-06-01`)
- **06.02 — Recognize and control traditional switch fall-through** (`java-t1-06-02`)
- **06.03 — Use arrow switch and a switch expression** (`java-t1-06-03`)
- **06.04 — Return a value from an arrow switch block with yield** (`java-t1-06-04`)

**Checkpoint:** Given a traditional switch where case 2 has no break and case 3 prints a second message, predict the output when the selector is 2. Explain fall-through. Then rewrite the idea as an arrow-style switch and as a switch expression. State why the expression needs a default result when the cases are not exhaustive.

---

## Section 07 — Loops and repeated execution

*Stage 2 — Basic application*

**Purpose:**

A **loop**, also called **iteration**, executes a block repeatedly. A loop must have a condition or stopping mechanism that allows it to terminate when termination is intended.

### `while`

```java
while (condition) {
    statements;
}
```

Java checks the condition before each execution. If true, the block runs and Java returns to the condition. If false, the loop ends. Therefore a `while` body may run **zero times** when its initial condition is false. A counter that never changes can create an infinite loop because the condition remains true. Always identify which statement changes the values used by the condition. Use braces even when the body contains one statement.

### `break` and `continue`

`break` exits the nearest loop immediately. The slides demonstrate it inside `while (true)` but describe that as bad practice; a clear condition in the loop header is usually preferable when it expresses the stopping rule. `continue` ends the current iteration and moves to the next one. For example, to skip multiples of 3, test `number % 3 == 0` and use `continue`.

### `do...while`

```java
do {
    statements;
} while (condition);
```

The block runs first, then the condition is checked. If true, the block runs again; if false, the loop ends. Thus the body executes **at least once**. Notice the semicolon after the final `while` condition.

### `for`

```java
for (initialisation; condition; modification) {
    statements;
}
```

- **Initialisation** runs once before the loop starts.
- **Condition** is checked before every pass; false ends the loop.
- **Modification** runs after each pass, commonly incrementing a counter.

For `for (int i = 0; i < 10; i++)`, `i` begins at 0, the body runs while `i < 10`, and `i` increments after each pass. This is equivalent to a while loop with initialization before it and modification inside its body. A variable declared in the for initialization is scoped to the loop.

The initialization, condition and modification parts are optional, but the two semicolons are mandatory. The slides allow multiple expressions in initialization or modification separated by commas, and recommend keeping the loop simple. Use `for` when the number of passes or counter structure is clear; use `while` when repetition depends on a condition; use `do...while` when the body must run at least once.

**Practice:** Begin with a small counter loop, then test a condition that is false at the start. Isolate `break` and `continue`, compare pre-test with post-test behavior, and calculate a running total with a for-loop. Include a zero input as an edge case so you can distinguish zero iterations from one guaranteed iteration.

Complete exercises **07.01–07.06**. Work through them in order:

- **07.01 — Repeat while a condition is true** (`java-t1-07-01`)
- **07.02 — Understand a while loop that may run zero times** (`java-t1-07-02`)
- **07.03 — Exit a loop with break** (`java-t1-07-03`)
- **07.04 — Skip an iteration with continue** (`java-t1-07-04`)
- **07.05 — Guarantee one execution with do while** (`java-t1-07-05`)
- **07.06 — Calculate a running total with for** (`java-t1-07-06`)

**Checkpoint:** For each loop type, explain when its condition is tested and whether its body can run zero times. Then write a for-loop that totals 1 through 10 and a while-loop that prints only numbers not divisible by 3 from 1 through 8. Identify exactly where each loop changes its counter and why neither loop is infinite.

---

## Section 08 — Functions and methods: parameters, arguments and return values

*Stage 2 — Basic application*

**Purpose:**

A **function** is a named, callable code block. It allows an algorithm to be reused instead of copied. The caller may pass values in and receive a result. Reusing methods can make a program shorter and easier to read: a repeated prompt, a calculation and a display operation can each become a separate method.

In Java, the course states that functions are methods because they are declared inside classes. The `main` method is also a method. The declaration contains an access modifier, return type, method name, parameter list, signature and body. Introductory examples use `public static` methods. Method names should use short, meaningful camelCase names beginning with lowercase. Parentheses are required even when no parameters are present:

```java
public static double enterAmount() {
    // method body
}
```

A **method call** invokes a method. Values supplied by a call are **arguments** (actual parameters). Names and types listed in a declaration are **formal parameters**. Each parameter is a typed local variable initialized from the corresponding argument. Several parameters are separated by commas:

```java
public static double average(double amount1,
                             double amount2,
                             double amount3) {
    double result = (amount1 + amount2 + amount3) / 3;
    return result;
}
```

The method has three formal parameters, and `result` is local to the method.

### Return values and `void`

A method's **return type** states what kind of value it produces. `return expression;` sends that value to the caller and ends the method:

```java
public static double average(double a, double b, double c) {
    return (a + b + c) / 3;
}
```

A method that does not return a result uses `void`:

```java
public static void printResult(double average) {
    System.out.println("The average is: " + average);
}
```

A non-void method call is an expression; its result can be assigned, passed to another method or used in another expression. A void method call produces no value, so it cannot be assigned to a variable or used where an expression is required. It can be called as a statement. The `return` statement also ends the method after returning its value.

**Practice:** Move one repeated output action into a no-argument void method. Then write a value-returning method, a method with several typed parameters, and a small input/calculation/output program whose main method coordinates the other methods. Practise the difference between arguments at the call site and formal parameters in the declaration.

Complete exercises **08.01–08.04**. Work through them in order:

- **08.01 — Move repeated output into a void method** (`java-t1-08-01`)
- **08.02 — Return a value from a method** (`java-t1-08-02`)
- **08.03 — Pass multiple arguments to a method** (`java-t1-08-03`)
- **08.04 — Combine input, calculation, and output methods** (`java-t1-08-04`)

**Checkpoint:** Write a method signature for a method that receives two doubles and returns a double. Identify its access modifier, return type, name, parameter types and signature. Then explain why `void printResult(...)` cannot be assigned to a variable, while `double average(...)` can. Sketch a main method that calls both.

---

## Section 09 — Object-oriented programming, classes and objects

*Stage 3 — Combining concepts*

**Purpose:**

The **object** is the foundation of **Object-Oriented Programming (OOP)**. An everyday object has **properties** (its state) and **behaviour** (what it can do). In software, properties are represented as **attributes**, **fields** or class properties; behaviour is represented by **methods**. A ship, for example, may have type, capacity, crew count, length, width and draft, and it may dock, sound its horn, lower its anchor, turn, board passengers or load cargo. Objects also relate to entities identified during database design and general analysis.

A **class** is a blueprint describing the attributes and methods for objects of a certain type. An **object** is a unique instance of a class. The class defines the available attributes and methods; each instance has its own attribute values. `Car` can be a class and `herbie` one object created from it. Other examples in the slides include Dog and Rectangle.

A method call can be understood as a **message** sent to an object. It identifies the receiving object, the method name, optional parameter values and possibly a result. The syntax is `objectName.methodName(...)`, for example `keyboard.nextInt()`.

### Creating and using objects

The course's creation pattern is:

```java
ClassName variableName = new ClassName(parameters);
```

The `new` operator allocates memory for the new object, calls one of the class's constructors and returns a reference to the created object. Parentheses are mandatory even when no constructor arguments are supplied. Examples include:

```java
Scanner keyboard = new Scanner(System.in);
Random rand = new Random(10);
StringBuilder builder = new StringBuilder();
```

A constructor has the same name as its class. From using code, only public properties and methods are available. Access uses a dot: `random.nextInt()`. Distinguish a class name such as `Random` from a variable/reference name such as `random`.

### The `Random` class

`Random` produces pseudo-random values using a mathematical sequence. `Random()` creates a generator with a changing seed source; `Random(long seed)` creates a repeatable sequence for that seed. Two generators constructed with the same seed produce the same sequence when the same calls are made in the same order.

| Method | Result range |
|---|---|
| `nextInt(int bound)` | Integer from 0 inclusive to `bound` exclusive: `0 <= result < bound`. |
| `nextInt(int origin, int bound)` | Integer from `origin` inclusive to `bound` exclusive. |
| `nextDouble()` | Double from 0 inclusive to 1 exclusive. |
| `nextBoolean()` | `true` or `false`. |

Examples from the slides: a six-sided die can use `nextInt(6) + 1` or `nextInt(1, 7)`; a coin toss can use `nextBoolean()` or `nextInt(2)`; `nextInt(50) + 50` gives 50–99; and `nextInt(900) + 100` gives a three-digit number from 100–999. The upper bound is always excluded in the bounded methods.

**Practice:** Model simple real-world entities as classes with data and behaviour. Instantiate multiple objects to see that each instance has its own state. Call methods through object references, pass parameters, and use returned values. The next section focuses specifically on pseudo-random generation.

Complete exercises **09.01–09.04**. Work through them in order:

- **09.01 — Model an object with attributes and behaviour** (`java-t1-09-01`)
- **09.02 — Create two independent objects from one class** (`java-t1-09-02`)
- **09.03 — Send a message and use a returned object value** (`java-t1-09-03`)
- **09.04 — Use new and distinguish class names from variables** (`java-t1-09-04`)

**Checkpoint:** Describe the difference between a class and an object using a Car example. Identify the attributes (state) and methods (behaviour) you would give a Car. Explain each part of `Car vehicle = new Car("Nova");`, and describe what `new`, the constructor call, the reference variable and the dot in `vehicle.start()` each contribute.

---

## Section 10 — Random values and deterministic seeds

*Stage 3 — Combining concepts*

**Purpose:**

This section focuses on selecting correct ranges with `Random` and understanding repeatability. A pseudo-random generator produces a sequence rather than a truly independent physical random event. The default `Random()` constructor is used when a varied sequence is wanted. A seeded constructor, `Random(long seed)`, is useful when a reproducible sequence is needed—for example, a test can use the same seed so that the same values are generated every run.

`Random()` creates a generator using a default seed source, so separate instances normally produce different sequences. `Random(long seed)` creates a repeatable sequence for that seed; two instances using the same seed produce the same sequence when they receive the same calls in the same order.

| Method | Result range |
|---|---|
| `nextInt(int bound)` | Integer from 0 inclusive to `bound` exclusive: `0 <= result < bound`. |
| `nextInt(int origin, int bound)` | Integer from `origin` inclusive to `bound` exclusive. |
| `nextDouble()` | Double from 0 inclusive to 1 exclusive. |
| `nextBoolean()` | `true` or `false`. |

A six-sided die can use `nextInt(6) + 1` or `nextInt(1, 7)`. A coin toss can use `nextBoolean()` or `nextInt(2)`. Adding 50 to `nextInt(50)` produces 50 through 99; adding 100 to `nextInt(900)` produces a three-digit number from 100 through 999.

A range check should test the permitted interval, not demand one particular unseeded output. A reproducibility test should seed the generator and compare the results from identical call sequences.

**Practice:** Use a fixed seed to compare two generators, simulate a die, and generate values in shifted and origin/bound intervals. Validate that the random outputs are in their permitted ranges, not that an unseeded generator returns a particular value.

Complete exercises **10.01–10.03**. Work through them in order:

- **10.01 — Generate repeatable pseudo-random values with a seed** (`java-t1-10-01`)
- **10.02 — Generate values inside an exclusive upper bound** (`java-t1-10-02`)
- **10.03 — Use the Random methods and interval boundaries** (`java-t1-10-03`)

**Checkpoint:** Write the expression for a die from 1 through 6, a whole number from 50 through 99, and a whole number from 100 through 999. For each, explain why the lower bound is included and why the upper bound is excluded. Explain when a seed is useful.

---

## Section 11 — References, stack and heap, packages, imports and garbage collection

*Stage 3 — Combining concepts*

**Purpose:**

When an object is created, a variable receives a **reference** to it. The variable is not the object itself: it stores a reference that identifies the object. The course's memory diagrams distinguish **stack memory**, where a reference variable is shown, and **heap memory**, where the object is shown. A reference can be declared separately and initialized later:

```java
Random generator;
generator = new Random();
```

Using a reference variable before assigning it a reference does not compile in the examples. The reference must be initialized before calling a method through it.

### Primitive assignment versus reference assignment

For primitives, assignment copies the value. If `j = i`, both contain the same value at that moment, but changing `i` later does not change `j`. For objects, assignment copies the reference. Two variables can then identify the same object. A mutation made through one reference can be seen through the other, as in the course's shared Player example. The object is not copied by a normal reference assignment.

### Packages and imports

A **package** groups related classes and interfaces, much like a directory groups files. The course gives three reasons: easier management and maintenance, avoiding naming conflicts, and access control. Every class belongs to a package. `Random` belongs to `java.util`; its fully qualified name is `java.util.Random`.

An import allows the simple class name:

```java
import java.util.Random;
Random generator = new Random();
```

Without an import, use the fully qualified name:

```java
java.util.Random generator = new java.util.Random();
```

`import java.util.*;` imports the accessible classes from that package by simple name. The lookup order listed in the slides is: (1) explicitly imported classes, (2) classes in the current package, and (3) classes from wildcard imports. The slides identify the default package (classes with no package declaration), the current package and `java.lang` as automatically available. `java.lang` contains base classes such as `String` and `Math`.

A package naming convention uses a reversed company domain, followed by project/subpackage names in lowercase, for example `be.kdg.programming1.m4.myutilities`. Reversing the domain helps make names globally unique. You must understand the concept, but the browser exercise environment does not allow package directories: leave out the `package` declaration and keep all exercise classes together in `Main.java`.

### Garbage collection

**Garbage collection** frees memory for objects that are no longer reachable through any reference. It is described as the opposite of `new`. A reference may disappear when its variable goes out of scope or when `null` is assigned to it. Garbage collection occurs automatically but not immediately; the slides describe it as operating on a separate, low-priority thread. Do not assume that an object is reclaimed at the exact moment its last reference disappears.

**Practice:** Compare primitive value copying with two references to one mutable object. Use a fully qualified class name and recognize the automatic `java.lang` package. Finally clear a reference to show when an object can become eligible for collection; use both a fully qualified name and a `java.util.*` wildcard import, and do not try to force or time the collector.

Complete exercises **11.01–11.04**. Work through them in order:

- **11.01 — Distinguish primitive copies from shared references** (`java-t1-11-01`)
- **11.02 — Use imports and fully qualified class names** (`java-t1-11-02`)
- **11.03 — Understand null and garbage-collection eligibility** (`java-t1-11-03`)
- **11.04 — Use a wildcard import for java.util classes** (`java-t1-11-04`)

**Checkpoint:** Draw a simple stack/heap picture for two reference variables pointing to one object. If you mutate the object through the first variable, what can the second variable observe? How is this different from copying an int? Then explain package, import, fully qualified name, wildcard import and null in your own words.

---

## Section 12 — String objects, input, comparison and immutability

*Stage 3 — Combining concepts*

**Purpose:**

`String` is a **class** in `java.lang`; a String value is an object and no import is needed. A String is **immutable**: after it is created, its contents cannot be changed. An operation that appears to change text creates and returns another String.

### Creating Strings and text blocks

A String literal is already a String object:

```java
String greeting = "Hello World";
System.out.println("Hello World");
```

The slides also demonstrate `new String("Hello World")`, but label this explicit construction as bad practice in the example. A text block is useful for multiline text and embedded double quotes. It begins and ends with three double quotes:

```java
String sql = """
    SELECT id, firstName, lastName
    FROM Employee
    WHERE departmentId = "IT"
    ORDER BY lastName, firstName""";
```

### Reading tokens and lines with Scanner

`Scanner.next()` reads the next token up to whitespace (a space or newline). `Scanner.nextLine()` reads the rest of the current line up to its newline. A common issue occurs after `nextInt()`: the Enter/newline remains in the input buffer. If `nextLine()` is called immediately, it consumes that leftover newline and returns an empty line instead of the user's name. The course's fix is:

```java
int age = keyboard.nextInt();
keyboard.nextLine();       // consume the leftover Enter
String name = keyboard.nextLine();
```

Use `next()` for one token and `nextLine()` for a complete line, especially when names or sentences may contain spaces.

### Common String methods

| Method | Purpose |
|---|---|
| `length()` | Number of characters. |
| `charAt(int index)` | Character at the index; first index is 0. |
| `equals(String other)` | Boolean content comparison, case-sensitive. |
| `equalsIgnoreCase(String other)` | Content comparison without letter-case distinction. |
| `compareTo(String other)` | Negative if this String sorts before the other; zero if equal; positive if after. |
| `isEmpty()` | True only if length is zero. |
| `substring(...)` | Returns a selected portion of the String. |
| `strip()` | Returns a String with leading/trailing whitespace removed. |
| `toUpperCase()` | Returns an uppercase String. |
| `toLowerCase()` | Returns a lowercase String. |
| `concat(...)` | Returns a concatenated String. |

The `+` operator also concatenates literals and String variables. Methods can be called directly on string literals because literals are objects.

### Compare content with equals, not ==

The slides strongly warn against using `==` to compare String contents. `==` compares references—whether they identify the same object. String literals are placed in the **String Pool**, so identical literals may refer to the same pooled object. A separately constructed `new String("abc")` is a distinct object in the example: `one == two` is true for the two literal references; `one == three` is false; `one.equals(three)` is true because the contents match. For content comparison, use `equals()` (or `equalsIgnoreCase()` where case-insensitive comparison is intended).

Calling `concat()` without storing its returned value does not change the original:

```java
String s1 = "abc";
s1.concat("def");
System.out.println(s1);          // abc
String s2 = s1.concat("def");
System.out.println(s2);          // abcdef
```

This illustrates immutability. When text will be changed repeatedly, consider `StringBuilder` in the next section.

**Practice:** Create and concatenate String values, use a text block, and read typed input containing names with spaces. Practise both the `next()` token rule and the `nextLine()` leftover-newline problem. Apply the common inspection and transformation methods, compare content using equals, and prove that concat does not mutate the original object.

Complete exercises **12.01–12.07**. Work through them in order:

- **12.01 — Create strings, concatenate, and use a text block** (`java-t1-12-01`)
- **12.02 — Read one word and a complete line with Scanner** (`java-t1-12-02`)
- **12.03 — Use common String inspection methods** (`java-t1-12-03`)
- **12.04 — Transform and extract String content** (`java-t1-12-04`)
- **12.05 — Compare String content with equals, not ==** (`java-t1-12-05`)
- **12.06 — Observe String immutability and concat** (`java-t1-12-06`)
- **12.07 — Compare Scanner next and nextLine** (`java-t1-12-07`)

**Checkpoint:** Explain the difference between `next()` and `nextLine()`. Trace what happens when `nextInt()` is followed immediately by `nextLine()`, and show how to fix it. Then explain why `first == third` can be false while `first.equals(third)` is true for two Strings that contain `abc`. Finally, describe what happens to the original String when `concat()` is called and its return value is ignored.

---

## Section 13 — Mutable text with StringBuilder

*Stage 3 — Combining concepts*

**Purpose:**

`StringBuilder` is a class for text that needs to change. Unlike `String`, its contents are **mutable**. The summary describes appending, inserting and removing text without creating a new object for every change. This can improve performance and reduce memory use when text changes frequently.

Create a builder using either constructor:

```java
StringBuilder emptyBuilder = new StringBuilder();
StringBuilder builder = new StringBuilder("stringliteral");
```

Methods covered in the course:

| Method | Purpose |
|---|---|
| `append(...)` | Adds text at the end and returns the builder, allowing chaining. |
| `toString()` | Returns the current contents as a String. |
| `length()` | Returns the number of characters. |
| `charAt(int index)` | Returns the character at the specified zero-based index. |
| `reverse()` | Reverses the builder's contents. |
| `insert(...)` | Inserts text at an index. |
| `setCharAt(...)` | Replaces one character at an index. |
| `deleteCharAt(...)` | Removes one character. |
| `replace(start, end, text)` | Replaces the selected range. |
| `substring(...)` | Returns a String for a selected range. |
| `indexOf(...)` | Finds the first occurrence of the requested text, or returns -1. |

The builder pattern chains calls because `append` returns the same modified `StringBuilder`: `builder.append('r').append('k')`. Keep track of indexes after insertions and deletions because changing the length changes later positions. Use a StringBuilder when repeatedly modifying text; use String when the text value should remain immutable.

**Practice:** Construct an empty and a prefilled builder. Append and chain calls; inspect length and a character; convert back to String. Then practise insert, setCharAt, deleteCharAt, replace, reverse, substring and indexOf while carefully recalculating indexes after each modification.

Complete exercises **13.01–13.04**. Work through them in order:

- **13.01 — Build and modify text with StringBuilder** (`java-t1-13-01`)
- **13.02 — Insert, replace, remove, and reverse builder text** (`java-t1-13-02`)
- **13.03 — Use StringBuilder for repeated concatenation** (`java-t1-13-03`)
- **13.04 — Find and extract text inside a StringBuilder** (`java-t1-13-04`)

**Checkpoint:** Describe one situation where StringBuilder is a better choice than String. Starting from `abcdef`, predict the result of inserting `X` at index 3, removing the character at index 2, and reversing the result. Explain which of the StringBuilder methods mutate the builder and which one returns a String.

---

## Section 14 — Formatting output and formatted Strings

*Stage 3 — Combining concepts*

**Purpose:**

Formatted output places typed values into a controlled text layout. The slides use:

```java
System.out.printf("formatstring", value, ...);
System.out.format("formatstring", value, ...);
```

`printf` and `format` are identical except for their names. If the formatted result should be stored as a String instead of printed immediately, use `String.format(...)`:

```java
String text = String.format("%d apples cost €%.2f", 4, 3.5);
System.out.println(text);
```

### Format specifiers

A specifier begins with `%` and indicates the type of value that follows:

| Specifier | Type / purpose |
|---|---|
| `%d` | `int` or `long` integer |
| `%f` | `float` or `double` decimal |
| `%s` | String |
| `%c` | char |
| `%b` | boolean |
| `%n` | Newline; more platform-independent than `\n` according to the slides |
| `%%` | A literal percent character |

Every specifier must have a corresponding argument of the appropriate type, in the correct order. A mismatch may cause a formatting error or incorrect output.

### Width, alignment and precision

By default, formatted values are right-aligned. Extra indicators can appear between `%` and the type letter:

- **Width `n`:** minimum number of character positions, such as `%20s`.
- **Minus `-`:** left-aligns, such as `%-20s`.
- **Precision `n.d` for `%f`:** minimum total width `n` and `d` decimal places, such as `%6.2f`. The value is rounded to the requested precision.
- **Comma `,`:** thousands grouping, such as `%,d`.

Examples: `%10.2f` gives a decimal at least 10 characters wide with 2 fractional digits; `%-10s` left-aligns a String in at least 10 positions; `%4d` gives an integer at least 4 positions; `%n` ends the line. Width is a **minimum**, not a maximum: a longer value is not truncated.

**Practice:** Match each specifier to its argument type and use printf to display integers, decimals, Strings, characters and booleans. Practise rounded precision, minimum width, right and left alignment, thousands separators and a literal percent sign. Then store a formatted result with String.format.

Complete exercises **14.01–14.03**. Work through them in order:

- **14.01 — Format values with printf and format specifiers** (`java-t1-14-01`)
- **14.02 — Control width, alignment, precision, and grouping** (`java-t1-14-02`)
- **14.03 — Create a formatted String with String.format** (`java-t1-14-03`)

**Checkpoint:** Choose a suitable format string to display an integer, a character, a String and a boolean. Then explain the difference between `%8.2f` and `%-8s`, why width does not truncate a long value, and when you would use String.format instead of System.out.printf.

---

## Section 15 — Designing classes: UML, attributes, access and default values

*Stage 4 — Independent problem-solving*

**Purpose:**

A class is a blueprint; an object is one instance with its own attribute values. The course uses a Dog example (coat colour, eye colour, height, weight, and actions such as sit, lie and here) and a Rectangle example. A class body can contain:

- **Attributes** — data describing the object's state, such as rectangle position and dimensions (`x`, `y`, `height`, `width`).
- **Constructors** — initialize new objects.
- **Methods** — operations such as getters, setters, area and perimeter calculations.

A UML class diagram represents a class's attributes and methods in one area and can show an individual object with concrete values separately. The Rectangle illustration includes accessors and mutators for height, width, x and y, plus `getPerimeter()` and `getArea()`.

### Class declaration and source file

The general syntax shown in the slides is:

```java
[public] [abstract | final] class ClassName [extends SuperClass]
        [implements Interface] {
    // class contents
}
```

Square brackets indicate optional items. The class name is an identifier. The slides recommend public classes at this stage. A public top-level class must be in a `.java` file with the same name (for example, public `Rectangle` in `Rectangle.java`). A client/application class with `main` creates and uses objects.

**Browser single-file adaptation:** every exercise is compiled as `Main.java`. Therefore `public class Main` is the one public top-level class. Any additional top-level classes (such as `Rectangle`, `Book` or `Student`) must be package-private in that same file. Do not create additional source files or a package directory. This changes the packaging arrangement, not the object-oriented learning goals.

The syntax also lists `abstract`, `final`, `extends` and `implements`, but their meaning is deliberately deferred in the summary. Recognize that they appear in the general syntax; do not attempt to learn inheritance or interfaces from this term's material.

### Attributes

An attribute is a variable declared in a class to hold information about an object. The summary's general form is:

```java
[private | public | protected] [static] [final] type name [= initValue];
```

The access modifier controls visibility. `static` is listed for a later module. `final` means the value cannot be changed after initialization. The type may be primitive or a reference type; the name is the identifier; the initial value is optional. The central design guideline is: **unless an attribute is final, make it private**.

### Access modifiers

| Modifier | Same class | Same package | Subclass | Any class |
|---|:---:|:---:|:---:|:---:|
| `private` | Yes | No | No | No |
| No modifier (package access) | Yes | Yes | No | No |
| `protected` | Yes | Yes | Yes | No |
| `public` | Yes | Yes | Yes | Yes |

If no access modifier is present, the course calls it **package access**. Use at most one of the accessibility modifiers in a declaration.

### Default attribute values

Fields receive an automatic default when no initializer is supplied:

| Attribute type | Default value |
|---|---|
| Integral number | `0` |
| `char` | `\u0000` (Unicode zero) |
| Floating-point number | `0.0` |
| `boolean` | `false` |
| Object/reference (e.g. String or Rectangle) | `null` |

A reference that is still `null` cannot be used to call an instance method or access an instance member; doing so can cause a `NullPointerException` and terminate the program. This contrasts with local variables: **attributes are automatically initialized; local variables are not** and must receive a value before they are used.

**Practice:** Translate a small conceptual/UML class into attributes, a constructor and methods. Use private, package-access, protected and public members in the appropriate contexts. Observe default field values and distinguish them from uninitialized local variables. Keep every helper class in the same Main.java file.

Complete exercises **15.01–15.04**. Work through them in order:

- **15.01 — Translate a simple class design into one source file** (`java-t1-15-01`)
- **15.02 — Understand access modifiers and package access** (`java-t1-15-02`)
- **15.03 — Observe default values of class attributes** (`java-t1-15-03`)
- **15.04 — Recognize a class declaration and its deferred modifiers** (`java-t1-15-04`)

**Checkpoint:** Draw a UML-style class outline for a Rectangle with position and dimensions, plus area and perimeter operations. Label which members are attributes, constructors and methods. Then explain the visibility of private, package-access, protected and public members, and state the default values of an int, double, boolean, char and String field. Why is a null String reference unsafe to use?

---

## Section 16 — Class methods, parameters, this, encapsulation and overloading

*Stage 4 — Independent problem-solving*

**Purpose:**

A **method** is code associated with an object. Calling it requests behaviour and may produce a response. The method syntax listed in the slides is:

```java
[public | private | protected] [static] [abstract] [final]
returnType methodName([parameters]) [throws exceptions] {
    // statements
}
```

A method can return a value or use `void`. The summary lists `static`, `abstract`, `final` and `throws exceptions` but defers detailed teaching of those subjects; do not expand them in this term.

### Attribute scope, local scope and `this`

An attribute is declared in the class and belongs to the object's state. It is automatically initialized and is available to the object's methods. A local variable is declared in a method or block, is not automatically initialized, and exists only within its declaring block. A method already has access to the attributes of the object on which it is called; those attributes do not need to be passed as parameters.

A local variable may have the same name as an attribute. The keyword/reference `this` identifies the current object, so `this.number` refers to the field while `number` may refer to a local variable:

```java
private int number = 42;
public void show() {
    int number = 7;
    System.out.println(number);       // local variable: 7
    System.out.println(this.number); // attribute: 42
}
```

`this.number` is also valid when there is no name conflict, although `this` is optional in that getter-like situation.

### Parameters and pass by value

Each parameter has its own declared type; multiple parameters are separated by commas. For `setPosition(int x, int y)`, a call such as `rect.setPosition(7, 9)` passes the values into the method's parameter variables. The course describes this as **pass by value**.

More precisely, Java always passes arguments by value. For a primitive, the primitive value is copied. For an object variable, the reference value is copied: the method can mutate the shared object through that copied reference, but assigning a different reference to the parameter does not reassign the caller's variable.

### Getters, setters and encapsulation

A **setter** (or **mutator**) changes an attribute. It generally has one parameter of the same type as the attribute, often validates the proposed value, and usually returns `void`:

```java
public void setWidth(int width) {
    if (width > 0) {
        this.width = width;
    }
}
```

The `this` reference distinguishes the field from a same-named parameter. A String setter in the slides checks that a supplied name is not empty before storing it.

A **getter** (or **accessor**) provides information about an attribute. It generally has no parameters and returns a value whose type matches the attribute:

```java
public int getWidth() {
    return this.width;
}
```

The caller can store the returned value or use it directly, for example `System.out.println(rect.getWidth())`. A `void` setter call such as `rect.setWidth(5)` is a statement and has no value to assign.

**Encapsulation** means interacting with an object's attributes through methods rather than accessing them directly. A public field lets external code place invalid data in an object (the slides give car speeds such as 50000 or -50000). Making a field private prevents direct access, but an unvalidated public setter still permits invalid data. The course's complete approach is: make non-final attributes private; provide a public setter when outside code needs to change the value; validate the proposed value before assignment. The car example accepts speeds from `MIN_SPEED = -20` through `MAX_SPEED = 300`; an invalid value is rejected and the previous state remains unchanged.

### Method overloading

**Overloading** allows multiple methods in one class to share a name when their parameter lists differ. The course permits a different number of parameters or different parameter types. The method name plus its parameter list is the **method signature**. For example, `report()` and `report(String unit)` are overloads. The compiler selects the appropriate method using the arguments in the call.

**Practice:** Use `this` to disambiguate an attribute from a local variable. Demonstrate pass-by-value with a primitive parameter. Build classes with private attributes, getters, validated setters and calculated information. Finish with overloads that differ in parameter count and parameter type.

Complete exercises **16.01–16.06**. Work through them in order:

- **16.01 — Distinguish attributes from local variables with this** (`java-t1-16-01`)
- **16.02 — Pass primitive arguments by value** (`java-t1-16-02`)
- **16.03 — Write getters and validated setters** (`java-t1-16-03`)
- **16.04 — Calculate derived values through getters** (`java-t1-16-04`)
- **16.05 — Overload methods with different parameter lists** (`java-t1-16-05`)
- **16.06 — Overload methods by parameter type** (`java-t1-16-06`)

**Checkpoint:** Explain the difference between an attribute and a local variable. Trace a method where a field and parameter share the name `width`, and identify when `this.width` is needed. Explain pass by value. Then design a validated setter for a percentage from 0 to 100, and write two legal overloaded method signatures that share the same name.

---

## Section 17 — Constructors, validation, overloading and this(...)

*Stage 4 — Independent problem-solving*

**Purpose:**

A **constructor** is a special class member for creating and initializing objects. It has the same name as its class, has **no return type**, may receive parameters and is called by `new`. Constructor names use the class naming convention (UpperCamelCase). The slides show access modifiers such as `public`, `private` and `protected` for constructors.

Example:

```java
public class Point {
    private double x;
    private double y;

    public Point() { }

    public Point(double x, double y) {
        this.x = x;
        this.y = y;
    }
}
Point origin = new Point();
Point point = new Point(9.0, 1.1);
```

This class has two overloaded constructors, allowing different initialization choices.

### Default constructor rule

If a class declares **no** constructor, Java generates a no-argument **default constructor** with an empty body. As soon as any constructor is explicitly declared, Java no longer generates that no-argument default constructor. If the class still needs a no-argument constructor, you must write it yourself. An explicit no-argument constructor can initialize starting values; it is not the same as the compiler-generated empty constructor.

### Constructor validation

A constructor should not create an object containing invalid data. The car example's direct assignment could create a car with speed -1000. Instead, it calls the validating setter. If the supplied speed is outside -20 through 300, the setter rejects it and the speed remains at its default value. Thus construction produces an object in a valid state.

### Constructor overloading and copy constructors

The Rectangle coursework asks for a default constructor, a constructor with height and width, a constructor with x-position, y-position, height and width, and a **copy constructor** that accepts another Rectangle and copies its attributes into a new object. Constructors can be overloaded because their parameter lists differ. Each constructor path should enforce the same validity rules.

### Delegating with `this(...)`

A constructor may call another constructor in the same class using `this(parameters)`. This reuses initialization code and avoids duplication. The call must be the **first statement** in the constructor:

```java
public Point() {
    this(1.0, 1.0);
}

public Point(double x, double y) {
    setX(x);
    setY(y);
}
```

The course recommends that shorter constructors delegate to the constructor with the most parameters where appropriate, supplying default values for omitted information.

**Practice:** Instantiate classes with implicit and explicit no-argument constructors. Overload constructors for different initialization data, validate constructor input through setters, copy the state of another object into a new object, and delegate with `this(...)` as the first statement.

Complete exercises **17.01–17.05**. Work through them in order:

- **17.01 — Observe the generated default constructor** (`java-t1-17-01`)
- **17.02 — Overload constructors for different initialization options** (`java-t1-17-02`)
- **17.03 — Validate constructor input before storing it** (`java-t1-17-03`)
- **17.04 — Create a copy constructor** (`java-t1-17-04`)
- **17.05 — Reuse constructor initialization with this(...)** (`java-t1-17-05`)

**Checkpoint:** A class declares `Point(double x, double y)` but no no-argument constructor. Can `new Point()` compile? Explain why. Then write a no-argument constructor that delegates to the two-argument constructor with coordinates 1.0 and 1.0. Finally explain how a copy constructor differs from assigning one reference variable to another.

---

## Section 18 — Readable object output with toString()

*Stage 4 — Independent problem-solving*

**Purpose:**

Every object can invoke `toString()`, and the method returns a String. The default implementation shown in the slides produces text such as `Dummy@190d11`, which identifies the class and a hash-code-like value but does not meaningfully describe the object.

When an object is passed to `System.out.println`, `println` calls `toString()` internally. Therefore:

```java
System.out.println(dummy.toString());
System.out.println(dummy);
```

produce the same text when `toString()` is defined normally.

Override `toString()` to return a useful description of the object's state. The slides use `@Override` above the method. A Person can return first and last name; a Point can return coordinates as `(x,y)` using concatenation or `String.format`. The Rectangle exercise asks for position, dimensions, area and perimeter in the representation. This makes printing an object useful to a reader and easier to debug.

**Practice:** Override `toString()` in a simple person model, then produce a richer Rectangle description that includes both stored attributes and derived values. Print the object itself to verify that println uses the override.

Complete exercises **18.01–18.02**. Work through them in order:

- **18.01 — Override toString to describe an object** (`java-t1-18-01`)
- **18.02 — Create a useful Rectangle toString representation** (`java-t1-18-02`)

**Checkpoint:** Explain why the default toString output is not useful for a user. Write a toString implementation for a Point with x and y coordinates. Then explain why printing `point` and printing `point.toString()` normally result in the same visible String.

---

## Section 19 — The Math class and mathematical constants

*Stage 4 — Independent problem-solving*

**Purpose:**

The `Math` class supplies common mathematical methods and constants. It belongs to `java.lang`, so it needs no import. The members explicitly listed in the slides are:

| Member | Purpose |
|---|---|
| `Math.max(a, b)` | Returns the larger of two values. |
| `Math.min(a, b)` | Returns the smaller of two values. |
| `Math.abs(a)` | Returns the absolute (magnitude) value. |
| `Math.pow(a, b)` | Calculates a power. |
| `Math.sqrt(a)` | Calculates a square root. |
| `Math.E` | Constant for the base of natural logarithms. |
| `Math.PI` | Constant for the ratio of a circle's circumference to its diameter. |

Examples from the course include `Math.abs(number)`, `Math.pow(number, value)`, `Math.sqrt(value)`, `Math.max(number, value)`, `Math.min(number, value)` and printing `Math.PI`. Methods such as `pow` and `sqrt` return double values. Combine these operations with variables, casts, methods and formatted output when a problem needs a mathematical calculation.

**Practice:** Use max, min and abs for direct comparisons and magnitude; calculate a power and square root; then use PI and E in a formula and formatted result. The integration tasks bring the Math methods together with earlier variables, methods, and formatting.

Complete exercises **19.01–19.03**. Work through them in order:

- **19.01 — Use Math max, min, and abs** (`java-t1-19-01`)
- **19.02 — Calculate powers and square roots** (`java-t1-19-02`)
- **19.03 — Use Math.PI and Math.E in a formula** (`java-t1-19-03`)

**Checkpoint:** Choose Math methods for each requirement: the larger of two numbers, the smaller of two numbers, the magnitude of a negative input, 5 squared, and the square root of 144. Explain the meanings of Math.PI and Math.E, and write an expression for the circumference of a circle with radius `r`.

---

## Section 20 — Cumulative integration and capstone projects

*Stage 5 — Advanced integration*

**Purpose:**

The final stage is not a new isolated topic. It is where you combine the full course. Start by translating written requirements into an algorithm: identify input, output, calculations, decisions and repetition. Choose types and constants deliberately. Use operators and parentheses so that calculations are clear. Select a suitable conditional or switch form; choose a loop only when the requirements call for repetition. Move reusable calculations into methods with clear parameters and return types.

For object-oriented tasks, decide which real-world entities should become classes. Give each class private attributes for state, constructors that establish valid initial values, getters and validated setters where needed, methods for behaviour and calculations, and a useful `toString()`. Use constructor overloading and `this(...)` when multiple initialization paths are required. When copying an object, understand whether you are creating a new object with copied field values or simply copying a reference to the same object.

Use `String` for immutable text values and `StringBuilder` when constructing mutable text through repeated operations. Compare String content with `equals()`. Read full lines carefully when using Scanner. Format final output with `printf` or `String.format`, matching specifiers to argument types. Use `Random` when a pseudo-random choice is required and a fixed seed when repeatable tests are useful. Use `Math` for the listed common calculations.

**Single-file discipline still applies:** each capstone solution is a single `Main.java` source file. Keep one public top-level `Main` class, place additional class definitions below it as package-private classes, and put all imports at the beginning. Do not create package folders or separate source files. The aim is not to cram everything into `main`; good organization still means small methods and cohesive classes.

**Practice:** The first capstone combines full-line input, constants, arithmetic, a conditional discount, a reusable calculation method, StringBuilder receipt construction and String.format. The second integrates a multi-class model, validation, several constructors, copying, derived methods and toString. The third uses Random, Scanner, a three-pass for loop, a calculation method, conditions, score accumulation and formatted questions. After completing the three, revisit earlier exercises and explain which construct you chose for each requirement.

Complete exercises **20.01–20.03**. Work through them in order:

- **20.01 — Capstone: Console order calculator** (`java-t1-20-01`)
- **20.02 — Capstone: Validated rectangle geometry model** (`java-t1-20-02`)
- **20.03 — Capstone: Three-round randomized quiz** (`java-t1-20-03`)

**Checkpoint:** Complete all three capstones without copying their reference solutions. For each project, be able to explain: (1) the algorithm before the code, (2) why each variable has its type, (3) how data moves between methods and objects, (4) which conditions and loops control the program, (5) how invalid or boundary input is handled, and (6) why the output is formatted the way it is. Then choose one capstone and redesign it with different input values or a new requirement without breaking its existing behavior.

---

## High-value comparisons to revise

Use this table as a self-test. The second column is not a synonym for the first; explain the distinction and give an example.

| Concept A | Concept B | Difference to explain |
|---|---|---|
| `Compiled language` | `Interpreted language` | Compiled source is translated to binary before execution; the interpreted model transforms and executes source through an interpreter on the target. |
| `Java source` | `Java bytecode` | .java is source text; the compiler produces JVM bytecode in a .class file. |
| `JRE` | `JDK` | JRE runs bytecode and includes the JVM plus Java API; JDK adds development tools and extras. |
| `JDK / JRE` | `IDE` | The JDK/JRE provide tools/runtime; the IDE is the developer workbench. |
| `Expression` | `Statement` | An expression evaluates to a value; a statement is a program instruction. |
| `Block` | `Scope` | A block is a brace-delimited group of statements; scope is where a declared variable is visible. |
| `if...else` | `?:` | if...else is a statement; ?: is an expression that yields one of two values. |
| `Traditional switch` | `Arrow switch` | Colon cases can fall through until break; arrow cases do not fall through and need no break. |
| `Switch statement` | `Switch expression` | A statement controls execution; an expression produces a value and must cover all cases or have default. |
| `while` | `do...while` | while checks before the body and can run zero times; do...while checks after and runs at least once. |
| `while` | `for` | Both repeat; for groups initialization, condition and modification in one header. |
| `Pre-increment` | `Post-increment` | Pre uses the updated value; post uses the old value and then updates the variable. |
| `Primitive assignment` | `Reference assignment` | Primitive assignment copies the value; reference assignment copies the reference so two variables can share one object. |
| `Attribute` | `Local variable` | An attribute belongs to the object and has a default; a local variable belongs to its block and must be initialized before use. |
| `Getter` | `Setter` | A getter provides a value; a setter changes an attribute. |
| `Public field` | `Private field with validated setter` | Direct public access can bypass rules; encapsulation lets the class validate changes. |
| `Overloaded methods` | `Repeated identical signature` | Overloading uses the same method name with a different parameter list/signature. |
| `Constructor` | `Ordinary method` | A constructor has the class name, no return type and runs during object creation. |
| `String` | `StringBuilder` | String is immutable; StringBuilder is mutable and useful for repeated text changes. |
| `== for Strings` | `equals() for Strings` | == tests reference identity; equals() compares String contents. |
| `printf / format` | `String.format` | System.out.printf and format display formatted output; String.format returns a formatted String. |

---

## Coursework boundaries: recognize, but do not expand

The supplied summary deliberately lists some concepts without teaching them in detail. They remain part of the vocabulary you should recognize, but this learning path does not pretend that the provided material teaches their implementation:

- Reference types are introduced with variables and explored through objects later in the course.
- `static` appears in class-attribute and method syntax but is deferred to a later module.
- `abstract`, `extends` and `implements` appear in the class-declaration form but are not explained here.
- `throws`/exceptions appear in method syntax, and constructor validation mentions throwing an exception as a later subject; exception handling is not expanded.
- Arrays, bitwise operators, shift operators and some operators in the precedence list are named but not developed as programming topics.
- Java characteristics such as distributed, robust, multithreaded and secure are listed without detailed definitions in the introductory slides.

The general class and operator syntax still names those items; knowing where they appear is different from claiming mastery of the deferred topic.

## Final mastery checklist

- [ ] Distinguish machine language, assembly language and third-generation languages.
- [ ] Explain the compiled, interpreted and Java bytecode/JVM models, including the role of JIT in the runtime model.
- [ ] Distinguish JRE, JDK and IDE and describe the .java → .class → JVM sequence.
- [ ] Describe Java characteristics, common application areas and the stated Java/C++ comparison.
- [ ] Explain the main method, comments, print/println, compiling and running with javac/java or an IDE.
- [ ] Define an algorithm and identify input, output, tests, repetition and computation.
- [ ] Define a variable, declaration, initialization, type, identifier and scope.
- [ ] Recognize all eight primitive types, their purposes and the ranges/representations listed in the summary.
- [ ] Use valid identifiers and camelCase naming conventions; recognize reserved words.
- [ ] Recognize boolean, char, int, long, float, double and String literal forms, numeric separators and scientific notation.
- [ ] Use all listed escape sequences and explain why quotes and backslashes may need escaping.
- [ ] Use final variables as named constants and apply the constant naming convention.
- [ ] Explain widening conversion, explicit casting, truncation and integer versus floating-point division.
- [ ] Use arithmetic, remainder, prefix/postfix increment and decrement, unary plus/minus, relational, logical and assignment operators.
- [ ] Explain the other listed operator forms and the precedence order; use parentheses to make expressions clear.
- [ ] Distinguish expressions, declaration/assignment/method-call/compound statements, blocks and variable scope.
- [ ] Implement if, if/else, nested if, else-if chains and the conditional operator; test boundaries.
- [ ] Explain traditional switch, break, fall-through, default, arrow switch, switch expressions and yield.
- [ ] Explain while, do/while and for execution order, counter updates, zero/one-or-more passes, break and continue.
- [ ] Explain methods, signatures, public static introductory methods, parameters, arguments, return values and void.
- [ ] Define objects, classes, attributes, state, behaviour, instances, messages and object creation with new.
- [ ] Use all Random constructors and methods listed, including seeds, bounds, nextDouble and nextBoolean.
- [ ] Distinguish stack/heap reference diagrams, primitive value copying, shared references and uninitialized references.
- [ ] Explain packages, package naming, imports, wildcard imports, fully qualified names and automatic java.lang access.
- [ ] Explain garbage-collection eligibility and why collection is automatic but not immediate.
- [ ] Explain String as an immutable class, literal construction, text blocks and the next/nextLine Scanner rules.
- [ ] Use length, charAt, equals, equalsIgnoreCase, compareTo, isEmpty, substring, strip, case conversion and concat.
- [ ] Compare String references with String content and use equals rather than == for content comparison.
- [ ] Compare String with StringBuilder and use append, toString, length, charAt, reverse, insert, setCharAt, deleteCharAt, replace, substring and indexOf.
- [ ] Use printf, format and String.format with every listed specifier, width, alignment, precision, grouping, newline and percent.
- [ ] Read UML class diagrams and explain class structure, declaration syntax, attributes, constructors and methods.
- [ ] Use access modifiers and explain package access, default field values, null and NullPointerException.
- [ ] Distinguish attributes from local variables and use this to refer to the current object fields.
- [ ] Explain pass by value and write methods with typed parameters and return values.
- [ ] Implement getters, setters, validation and encapsulation; explain why non-final fields should normally be private.
- [ ] Explain method overloading and identify method signatures.
- [ ] Explain constructor naming, no return type, implicit default constructor rules, constructor validation, overloading, copy constructors and this(...) delegation.
- [ ] Override toString and explain why println can call it automatically.
- [ ] Use Math.max, min, abs, pow, sqrt, E and PI.
- [ ] Solve the capstones using one Main.java file and organize additional classes and methods clearly.

## Final completion standard

You are ready to finish Term 1 when you can explain the concepts without copying the guide, implement the exercises with the reference solutions hidden, handle the tested boundary cases, and complete the three capstones independently. A successful capstone is not simply code that prints the sample output: you should be able to explain why your types, conditions, loops, methods, classes, constructors, references and output formatting are appropriate, and adapt the program when a requirement changes.
