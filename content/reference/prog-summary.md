# Programming Fundamentals Java — Complete Theory Summary

This study guide follows the supplied **Programming Fundamentals** lecture PDF (302 pages). It consolidates the theory, terminology, rules, comparisons and examples taught in the slides. The explanations stay within the scope and level of those materials.

The PDF contains five main teaching blocks:

1. Basic Concepts: programming languages, the Java platform, first programs and algorithms.
2. Flow Control: expressions, statements, blocks, decisions, loops and functions.
3. Variables and Operators: primitive types, literals, conversions and operators.
4. OO Programming and Objects: classes, objects, references, packages, garbage collection, `Random`, `String`, `StringBuilder` and formatting.
5. Classes: class structure, attributes, methods, encapsulation, constructors, `toString()` and `Math`.

> **Scope note:** Some constructs appear in a syntax overview or are labelled “for completeness”, “explained later”, or “see later”. This guide identifies them but does not add explanations the PDF does not provide. Course administration and exercise instructions are not included as theory.

---

## 1. Basic concepts: programming languages and Java

*Source: PDF pages 250–302.*

### 1.1 What is a programming language?

A programming language is a way to express instructions for a computer. The slides distinguish three generations:

- **Machine language (first generation):** binary code used by computers. It is processor-specific.
- **Assembly language (second generation):** more readable than machine code, but still processor-specific.
- **Third-generation languages (3GL):** more readable, high-level source code that is processor-independent. Java is presented as a 3GL. The slides also list languages such as C, C++, BASIC, C#, Pascal, Python, JavaScript and others as 3GL examples.

The important distinction in the slides is that machine and assembly code are tied to a processor, whereas 3GL source code is not written as that processor's binary instructions.

### 1.2 Compiled languages

In the compiled-language model shown in the slides:

1. A programmer writes a text source-code file.
2. A compiler transforms the source code into binary code.
3. The binary code is executed on the target platform.

The same source may need to be compiled separately for different processor platforms. The slides illustrate different compiler outputs for Intel and ARM processors.

**Advantages listed in the coursework:**

- Compile-time checks are performed.
- Source code is portable between development environments.
- Execution is fast because binary code can be executed directly.
- Source code is not readable on the target platform, which the slides list as a security advantage.

**Disadvantages listed in the coursework:**

- The binary code is platform-dependent, so different binary files must be distributed to different target platforms.
- Changing code, for example for testing, requires recompilation.

C and C++ are given as examples of compiled languages in this comparison.

### 1.3 Interpreted languages

In the interpreted-language model:

1. The source-code text is provided to an interpreter on the target platform.
2. The interpreter transforms and executes it.

The slides use JavaScript and Python as examples in this comparison.

**Advantages listed:**

- Source code is portable.
- The source code is runnable on different platforms.
- It is platform-independent when a suitable interpreter is installed on each platform.

**Disadvantages listed:**

- There are no compile-time checks in the described model.
- An interpreter must be installed on each system where the program runs.
- Execution is slower in the described model because text must be transformed when the program runs.
- The source code remains readable on the target platform.

### 1.4 Java's compiled/interpreted model

The slides present Java as combining aspects of compilation and interpretation:

1. The programmer writes a `.java` source file.
2. The Java compiler compiles it into **bytecode**.
3. The bytecode is stored in a `.class` file.
4. A Java Virtual Machine (JVM) on the target platform executes the bytecode. The diagrams show JVM interpreters for different processors.

The slides describe bytecode as code for the JVM, which they call a software processor. The Java platform can therefore use the same portable bytecode on different target platforms when the Java platform is installed.

**Advantages listed for Java:**

- Compile-time checks.
- Portable source code.
- Platform independence, provided that the Java platform is installed.
- Medium speed in the comparison shown.

**Disadvantages listed:**

- There is an extra compile step immediately before execution, identified in the slides as JIT.
- A virtual machine is needed to run the code; the virtual machine is part of the Java platform.

The Java API and the JVM hide the underlying platform. This is the explanation given in the slides for Java programs being platform-independent.

### 1.5 Java characteristics and applications

The slides identify Java as:

- Object-oriented.
- Interpreted.
- Distributed.
- Robust.
- Multithreaded.
- Secure.
- Fast.

These are introduced as characteristics; the introductory slides do not explain each one in detail. The slides also note that Java was released in the 1990s by Sun Microsystems and is now owned by Oracle. In the comparison with C++, both languages are described as object-oriented, Java syntax is described as based on C++, and the table identifies platform independence as Java's distinguishing characteristic in that comparison.

Java applications are grouped into:

- **Desktop applications**, with LibreOffice and Minecraft as examples.
- **Server applications**, described as a popular use of Java.
- **Mobile applications**, with Android given as the platform.

The course says it will initially focus on desktop applications.

### 1.6 JRE, JDK and IDE

| Term | Meaning in the slides | Purpose |
|---|---|---|
| **JRE — Java Runtime Environment** | JVM + Java API | Needed to run Java bytecode programs. |
| **JDK — Java Development Kit** | JRE plus development tools and extras | Includes tools such as compiling and debugging tools; API reference documentation is listed as optional. |
| **IDE — Integrated Development Environment** | A workbench application for developers | Helps developers write, build and run programs; an IDE can support multiple programming languages. |

The relationship is **JDK = JRE + development extras**. An IDE is the developer's workbench; it is not the same thing as the JDK or JRE.

### 1.7 Writing, compiling and running a first Java program

The slides give this basic sequence:

1. Write the source code in a file with the `.java` extension.
2. Compile the source code.
3. Run the compiled program.

A text editor can be used to write source code, but an IDE assists with writing, building and running it. IntelliJ is used in the examples. The IDE can provide immediate feedback and suggestions; the lightbulb shown in the slides proposes and can apply enhancements.

A simple program has the following structure:

```java
package hello;

public class HelloWorldApp {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}
```

The concepts highlighted by this example are:

- A **package** groups source files. In the example, `hello` is the package and is associated with a subdirectory named `hello`.
- A **class** is defined using a class declaration. Classes are a key object-oriented concept.
- The **`main` method** is the starting point of a Java application.
- `System.out.println(...)` displays text on the screen.
- Comments are ignored by the compiler. The slides show both `/* ... */` comments and `//` comments.

The command-line compilation example uses `javac`, which the slides identify as the command-line compiler bundled with the JDK:

```text
javac hello/HelloWorldApp.java
```

The compiler generates a `.class` bytecode file. To run the program, the slides use:

```text
java HelloWorldApp
```

The `java` command starts the JVM and executes the bytecode. In IntelliJ, the Run action compiles and runs the program. The slides note that IntelliJ by default puts source files in `src` and `.class` files in `out`.

### 1.8 Programming algorithms

An **algorithm** is a sequence of steps used to perform a task. The slides describe programming as:

- Designing an algorithm to perform a task.
- Encoding the algorithm in a programming language so that a computer can perform the task.

An algorithm must be expressed as steps that the computer—or the example robot—can understand. The pizza-order robot example emphasizes making each step sufficiently detailed for the robot to execute.

The slides identify typical algorithm actions:

- **Ask for input.** Obtain information from a user or another input source.
- **Produce output.** Show a result or message.
- **Test.** Choose different actions depending on a condition's result.
- **Repeat.** Perform a sequence of steps several times.
- **Compute.** Calculate a value.

In the sum example, the algorithm reads two numbers, stores intermediate results in variables, adds the values and displays the sum. This illustrates the roles of input/output (I/O), variables and computation.

When translating an algorithm into Java, each step becomes a Java statement. The slides demonstrate:

- Displaying text with `System.out.print("text");`.
- Reading an integer from a keyboard `Scanner` with `keyboard.nextInt();`.
- Assigning an input value to a variable with `=`.
- Declaring variables and their types before using them.
- Creating a `Scanner` connected to `System.in` to read keyboard input.
- Importing `java.util.Scanner`, because the slides state that `Scanner` is not part of the Java core.
- Closing the keyboard scanner in the example to release system resources.

The number-guessing example adds tests: compare a guess with an answer using `<`, `>` and `==`, then display the corresponding message. The slides use it to show that an algorithm can combine input, comparisons and conditional output.

---

## 2. Variables, types and literals

*Source: PDF pages 58–82.*

### 2.1 Variables

A **variable** is a location in memory that can be used to store data. The slides say that a variable has:

- A **name**, for example `firstNumber`, `secondNumber` or `sum`.
- A **type**, for example `int`, `char` or `double`.
- A **scope**, meaning the part of the code where it can be accessed.

Before using a variable, it must be declared. A declaration gives the variable a name and specifies the kind of data it can store.

The general format is:

```java
type name;
```

For example:

```java
int firstNumber;
```

A variable can also be initialized in its declaration:

```java
int numberOne = 10;
int numberTwo = 100;
```

Several variables of the same type can be declared on one line, for example `int numberOne, numberTwo;`, but the slides mark this as discouraged.

### 2.2 Primitive data types

The slides distinguish primitive types from reference types. Reference types are introduced later in the coursework; the table below reproduces the primitive types covered in the variables module.

| Type | Meaning in the slides | Format / size | Range or possible values |
|---|---|---|---|
| `byte` | Byte value | 8-bit two's complement | −128 to 127 |
| `short` | Short integer | 16-bit two's complement | −32,768 to 32,767 |
| `int` | Integer | 32-bit two's complement | −2³¹ to 2³¹ − 1 |
| `long` | Long integer | 64-bit two's complement | −2⁶³ to 2⁶³ − 1 |
| `float` | Single-precision floating-point number | 32-bit IEEE 754 | Approximately −3.4E+38 to 3.4E+38 |
| `double` | Double-precision floating-point number | 64-bit IEEE 754 | Approximately −1.7E+308 to 1.7E+308 |
| `boolean` | Boolean value | 1 bit in the slide's table | `false` or `true` |
| `char` | Character | 16-bit Unicode | `\u0000` to `\uFFFF` |

The slides use `int` for an age, `double` for a percentage and `String` for a name in a “which data type?” example. `String` is later explained as a class rather than one of the primitive types.

### 2.3 Variable names and identifiers

A variable name must follow the rules listed in the slides:

- It may contain alphabetic characters (`a`–`z`, `A`–`Z`), digits (`0`–`9`), the connecting character `_` and `$`.
- It cannot start with a digit.
- It cannot be a reserved word (a Java keyword).

A variable name must be unique within its scope. Names are **case-sensitive**, so uppercase and lowercase letters make a difference. A unique name is also called an **identifier**.

The code conventions recommend:

- Choose clear and meaningful names.
- Start variable names with a lowercase letter.
- Use **camelCase**: start with a lowercase letter and capitalize the first letter of each subsequent word, such as `greatestCommonDivisor` or `aSmallNumber`.
- Avoid connecting characters, `$` signs and underscores in ordinary variable names.

Reserved words have a specific meaning in Java and therefore cannot be used as variable names. The slides show `yield` and `var` as examples.

### 2.4 Literals

A **literal** is a fixed value that appears directly in code. Each type has a format.

| Type | Literal format taught in the slides | Example |
|---|---|---|
| `boolean` | `true` or `false` | `boolean firstTime = true;` |
| `char` | A character enclosed in single quotes, or the corresponding ASCII code | `char letter = 'A';` or `char letter = 65;` |
| `int` | Integer digits; underscores may separate groups for readability | `int million = 1_000_000;` |
| `long` | Integer literal ending in `L` or `l` | `long value = 1247418127475L;` |
| `double` | A decimal point or scientific notation | `double average = 13.25;`, `double fraction = 1.0E-8;` |
| `float` | A decimal literal ending in `F` or `f` | `float distance = 3.25F;` |
| `String` | Text enclosed in double quotes | `String name = "Pete";` |

The slides also note that numeric literals can use bases other than decimal, although the details of those other bases are not expanded in this section.

#### Character escape sequences

Special characters can be represented in character literals using a backslash. The table in the slides lists:

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

The slides note that line-ending conventions differ between operating systems and that Java automatically handles the necessary conversion. They give `\n` as the Windows newline representation and note that other systems may use `\r`.

A double quote inside a string must be escaped so it is treated as text rather than as the end of the string. For example:

```java
System.out.println("Welcome to \"Java\"");
```

### 2.5 `final` variables and constants

Declaring a variable as `final` ensures that it cannot be modified after it has been initialized. The slides also call a `final` variable a **constant**.

```java
final int MAXIMUM_TEMPERATURE = 100;
```

The recommended naming convention for final variables is capital letters, with words separated by underscores, for example `MAXIMUM_TEMPERATURE`.

The slides recommend replacing literal values in code with named `final` variables. This makes the purpose of the value clearer and follows the convention for constants.

### 2.6 Conversion between types and casting

The slides demonstrate that assigning an `int` value to a `double` variable is allowed:

```java
int a = 100;
double b;
b = a;
```

The reverse assignment is not allowed implicitly in the example:

```java
double c = 100.2;
int d = c; // compiler does not allow this
```

The explanation given is that assigning a `double` to an `int` could cause loss of data or precision. The programmer can explicitly request a conversion using a **type cast**:

```java
int d = (int) c;
```

The target type is written in parentheses before the value being converted. The slides use casts in division examples to show how the operand types affect the result:

- `10 / 3` with two integer operands produces `3`.
- `(double) 10 / 3` produces approximately `3.333…`.
- `10 / (double) 3` also produces approximately `3.333…`.
- `7.0 / 2.0` produces `3.5`.
- Casting both operands to `int` before division produces an integer result.

The key course point is that the types used in an arithmetic expression affect the result, and an explicit cast is used when the desired conversion is not allowed implicitly.

---

## 3. Operators

*Source: PDF pages 83–105.*

An **operator** is a symbol used to perform an action on values or variables. The slides introduce operators for assignment, calculation and comparison.

### 3.1 Mathematical operators

The binary mathematical operators are:

| Operator | Meaning |
|---|---|
| `+` | Sum of the two operands |
| `-` | Difference between the operands |
| `*` | Product of the operands |
| `/` | First operand divided by the second |
| `%` | Remainder after division; the slides describe the divisor using its absolute value |

For example, `13 % 5` gives `3`, `15 % 5` gives `0`, and `21 % 5` gives `1`. The remainder pattern repeats as the dividend increases.

### 3.2 Increment and decrement

The increment operator `++` increases a variable by one. The decrement operator `--` decreases it by one.

The position of the operator determines when the changed value is used:

- **Pre-increment (`++i`):** increment first, then use the new value.
- **Post-increment (`i++`):** use the current value first, then increment the variable.
- **Pre-decrement (`--i`):** decrement first, then use the new value.
- **Post-decrement (`i--`):** use the current value first, then decrement the variable.

For example, when `i` begins at `10`:

```java
number = ++i; // number becomes 11; i becomes 11
number = i++; // number receives 10; afterwards i becomes 11
```

Likewise, `number = --i` makes both `number` and `i` equal to `9` when the original `i` was `10`; `number = i--` gives `number` the old value `10` and leaves `i` equal to `9`.

The slides also list unary `-op` as the negative value of an operand. Unary `+op` promotes a `byte`, `short` or `char` to an `int`.

### 3.3 Relational operators

Relational operators compare two operands and produce a boolean result:

| Operator | Meaning |
|---|---|
| `>` | Greater than |
| `>=` | Greater than or equal to |
| `<` | Less than |
| `<=` | Less than or equal to |
| `==` | Equal to |
| `!=` | Different from / not equal to |

These comparisons are used in conditions, for example `score >= 10` or `guess == answer`.

### 3.4 Logical operators

Logical operators combine or invert boolean expressions.

- `&&` means **AND**. It is true only when both operands are true.
- `||` means **OR**. It is true when at least one operand is true.
- `!` means **NOT**. It is true when its operand is false.

The truth table for the two binary operators is:

| Operand 1 | Operand 2 | `op1 && op2` | `op1 || op2` |
|---|---|---|---|
| `true` | `true` | `true` | `true` |
| `true` | `false` | `false` | `true` |
| `false` | `true` | `false` | `true` |
| `false` | `false` | `false` | `false` |

The slides use combinations such as `age >= 18 && age <= 67` to test whether an age is within an interval, and `age < 18 || age > 67` to test whether an age is outside it.

### 3.5 Assignment operators

The assignment operator `=` assigns the value on the right to the variable on the left. The slides state that the result of the assignment operation is the value of the left operand after assignment.

Compound assignment operators combine a calculation with assignment:

| Operator | Equivalent form |
|---|---|
| `a += b` | `a = a + b` |
| `a -= b` | `a = a - b` |
| `a *= b` | `a = a * b` |
| `a /= b` | `a = a / b` |
| `a %= b` | `a = a % b` |

The order is: first perform the calculation, then assign the result.

### 3.6 Other operators listed in the slides

The slides include these operators “for completeness”:

| Operator / form | Use stated in the slides |
|---|---|
| `.` | Creates a qualified name, such as `object.property`. |
| `[]` | Used to create arrays and access their elements, such as `array[x]`. |
| `(params)` | Represents a comma-separated list of parameters. |
| `(type)` | Explicitly converts a value to a type (casting). |
| `new` | Creates a new object or a new array. |
| `instanceof` | Tests whether an operand is an object of a class or one of its subclasses. |

The slides identify casting as already covered and indicate that some of the other operators will be discussed later. This guide does not expand those later topics.

### 3.7 Operator precedence

**Operator precedence** is the order in which operators in an expression are evaluated. The precedence table in the slides is listed from higher to lower priority:

1. Postfix operators: `[]`, `.`, parameter list `()`, `expr++`, `expr--`.
2. Unary operators: `++expr`, `--expr`, unary `+`, unary `-`, `~`, `!`.
3. Creation and type conversion: `new`, `(type)expr`.
4. Multiplication, division and modulo: `*`, `/`, `%`.
5. Addition and subtraction: `+`, `-`.
6. Shift operators: `<<`, `>>`, `>>>`.
7. Relational operators: `<`, `>`, `<=`, `>=`, `instanceof`.
8. Equality operators: `==`, `!=`.
9. Bitwise AND: `&`.
10. Bitwise exclusive OR: `^`.
11. Bitwise inclusive OR: `|`.
12. Logical AND: `&&`.
13. Logical OR: `||`.
14. Conditional operator: `?:`.
15. Assignment operators: `=`, `+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `^=`, `|=`, `<<=`, `>>=`, `>>>=`.

The slides advise not to depend too much on precedence rules. Their recommended practice is to use parentheses to make the intended order explicit.

---

## 4. Expressions, statements, blocks and scope

*Source: PDF pages 1–13.*

### 4.1 Expressions

An **expression** is a construct made up of literals, variables, operators and/or method calls that evaluates to a single value.

Examples from the slides include:

```java
a = 15 * b + c;
a < 120
```

The first expression produces a calculated value. The second produces a boolean value (`true` or `false`).

### 4.2 Statements

A **statement** is a basic instruction in a program. The slides identify these statement types:

- **Declaration statement:** declares a variable, for example `double a;`.
- **Assignment statement:** assigns a value, for example `a = 15 * Math.PI;`.
- **Method-call statement:** invokes a method, for example `System.out.println(a);`.
- **Compound statements:** contain or control other statements, including flow-control statements.

A single statement is terminated with a semicolon (`;`). An `if` statement containing another statement is shown as a compound statement.

### 4.3 Blocks

A **block** is a group of statements enclosed by a pair of curly braces `{` and `}`. A block can be used anywhere a simple statement is allowed.

The slides recommend indenting statements an additional level inside each new block. Continued lines of a statement should also be indented. Correct indentation makes the nesting and structure of code easier to read; IntelliJ's reformat-code function is mentioned as a tool for applying the convention.

### 4.4 Variable scope

**Scope** is the region of a program in which a variable is known and can be used.

The rules explained in the slides are:

- A variable is known inside the block where it is declared and in nested blocks inside it.
- Its scope starts at the line where it is declared.
- Its scope ends at the closing curly brace of the block in which it was declared.
- A variable declared inside an inner block cannot be used after that block has ended.
- Two separate inner blocks can each declare a variable with the same name because each declaration belongs to its own block scope.

This explains why a variable declared in an `if` block is not available after the block, while an outer variable can be used from inside a nested block.

---

## 5. Conditional execution

*Source: PDF pages 14–30.*

Statements normally execute in sequence. **Flow-control statements** change that sequential execution. The slides group flow control into conditional execution and repeated execution.

### 5.1 The `if` statement

An `if` statement executes its statements only when its logical condition is true:

```java
if (score >= 10) {
    System.out.println("success");
}
```

If the condition is false, the `if` block is skipped and execution continues after it.

The syntax is:

```java
if (condition) {
    statements;
}
```

The slides recommend always using a code block after `if`, even when only one statement is present.

### 5.2 The `if...else` statement

An `if...else` provides two alternatives:

- The `if` block executes when the condition is true.
- The `else` block executes when the condition is false.

```java
if (score >= 10) {
    System.out.println("success");
} else {
    System.out.println("fail");
}
```

The slides recommend using code blocks after both `if` and `else`.

### 5.3 Nested `if` and `else if`

A nested `if` places another conditional inside an `else` block. It can represent several alternatives, but deeply nested structures become complex and harder to read.

The slides show that an `else if` chain expresses the same style of multi-way grade selection more simply:

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

The course describes the `else if` structure as simpler than deep nesting. It also notes that when an `else` is followed by a single `if` statement, the `if` can be written as a simple statement without adding another block around that single `if`.

### 5.4 Conditional operator `?:`

The **conditional operator** is also called the **ternary operator**. Its form is:

```java
condition ? valueIfTrue : valueIfFalse
```

The condition must be a boolean expression. If it is true, the operator yields the second operand; otherwise it yields the third operand.

The slides compare it with `if...else`:

- It works like an `if...then...else` choice.
- The conditional operator is an **expression** and returns a value.
- An `if...else` statement does not itself return a value.

Example from the slides:

```java
System.out.println("BMI is " + ((bmi > 25) ? "too high" : "ok"));
```

The conditional expression first produces either `"too high"` or `"ok"`; that result is then concatenated with `"BMI is "`.

### 5.5 Traditional `switch` statement

A `switch` is used to test equality against multiple values. The slides show a selector value and several `case` labels:

```java
switch (day) {
    case 0: System.out.println("monday"); break;
    case 1: System.out.println("tuesday"); break;
    case 2: System.out.println("wednesday"); break;
    default: System.out.println("invalid day");
}
```

The rules given in the slides are:

- The switch value is compared with the case literals.
- When a case matches, its statements execute.
- Execution continues until a `break` is reached.
- Without a `break`, execution continues into the statements of the next case. This is called **fall-through**.
- `default` is optional in the traditional statement. If no case matches, the default statements execute when a default is present.

Fall-through can intentionally group several cases that share the same action. In the seasons example, the labels for March, April and May all lead to the same `spring` output before the `break`.

The syntax slide describes the selector as an integral type (the slide gives `int`, `long`, etc.) or a `String`. This summary preserves the wording of that course slide.

### 5.6 Simplified switch syntax and switch expressions

The slides introduce simplified switch syntax as available **since Java 14**. It uses an arrow (`->`) instead of a colon (`:`):

```java
switch (month) {
    case "march", "april", "may" -> System.out.println("spring");
    case "june", "july", "august" -> System.out.println("summer");
    default -> System.out.println("invalid month");
}
```

The simplified form can:

- Put multiple values on one `case` label.
- Avoid writing `break` for these arrow cases.
- Avoid the fall-through behaviour described for the traditional syntax.

The slides also show that a simplified `switch` can be used as an **expression**, meaning it returns a value:

```java
String seasonName = switch (month) {
    case "march", "april", "may" -> "spring";
    case "june", "july", "august" -> "summer";
    case "september", "october", "november" -> "autumn";
    case "december", "january", "february" -> "winter";
    default -> "invalid month";
};
```

If a switch expression does not cover all possible cases, the slides say that `default` is mandatory. It ensures that the expression has a value for the remaining cases.

An arrow case can also use a block with several statements. In that situation, the slides use `yield` to provide the value returned by the switch expression:

```java
default -> {
    System.out.println("Please use lower case English month names");
    yield "invalid month";
}
```

The `yield` expression is the value that the switch expression returns from that block.

---

## 6. Loops and repeated execution

*Source: PDF pages 31–47.*

A **loop** (or **iteration**) is a code block that is executed repeatedly. The slides cover `while`, `do...while` and `for` loops.

### 6.1 `while` loop

A `while` loop repeats a block as long as its condition is true:

```java
while (condition) {
    statements;
}
```

Its processing order is:

1. Check the condition.
2. If true, execute the code block and return to step 1.
3. If false, end the loop and continue with the statement after the block.

Because the condition is tested before the block, the block may execute zero times if the condition is initially false.

The slides show an infinite-loop example in which a counter is tested but never changed inside the loop. Since the condition never becomes false, the program never finishes. A loop must therefore have a way for its condition to become false when termination is intended.

Curly braces are technically unnecessary when the `while` controls a single statement, but the slides recommend always using a block for clarity.

### 6.2 `break`

`break` exits a loop. The slides demonstrate it inside a `while (true)` loop, but label that approach bad coding practice. The recommended practice is to express the loop's stopping condition in the `while (condition)` test when that is clearer.

### 6.3 `continue`

`continue` stops the current iteration and proceeds with the next iteration of the loop. In the slide example, values divisible by three are skipped, so the output contains `1 2 4 5 7 8`.

### 6.4 `do...while` loop

A `do...while` loop checks its condition **after** executing the block:

```java
do {
    statements;
} while (condition);
```

Its processing order is:

1. Execute the block.
2. Check the condition.
3. If true, return to the block.
4. If false, end the loop and continue after it.

Because the block is executed before the condition is checked, a `do...while` block executes **one or more times**.

### 6.5 `for` loop

A `for` loop is a compact way to repeat an action a specified number of times. Its syntax is:

```java
for (initialisation; condition; modification) {
    statements;
}
```

The three parts have these roles:

- **Initialisation:** runs once, before the loop starts. The slides' example declares and initializes `i` to `0`.
- **Condition:** tested before each execution of the block. If false, the loop terminates.
- **Modification:** runs after each execution of the block. The example increments `i`.

For `for (int i = 0; i < 10; i++)`, the initialisation occurs once, the condition is checked before every pass, and the increment occurs after each pass. The loop stops when the condition becomes false.

A `for` loop can express the same repetition as a `while` loop. The slides show a `for` loop counting from 0 to 9 alongside the equivalent `while` form that initializes `i` before the loop and increments it inside the body.

Additional rules and recommendations in the slides:

- The scope of a variable declared in the initialisation is limited to the `for` loop.
- Initialisation, condition and modification are each optional.
- The two semicolons are mandatory even if one or more parts are omitted.
- A part can contain multiple statements separated by commas.
- Keep the loop simple.

---

## 7. Functions and methods

*Source: PDF pages 48–57.*

### 7.1 What is a function?

A **function** is a named, callable code block. It allows an algorithm to be reused rather than copied into several places.

The caller can:

- Pass argument values to the function.
- Receive a result back from the function.

The slides explain that using functions can make code more concise and readable. For example, repeated prompts for three amounts can be moved into an `enterAmount()` function, the average calculation can be moved into `average(...)`, and displaying the result can be moved into `printResult(...)`.

The `main` method is also a function. In Java, the slides state that all functions are methods because they are always declared inside a class.

### 7.2 Function declaration and signature

The slide's example labels these parts of a function declaration:

- Access modifier.
- Return type.
- Name.
- Argument list.
- Signature.
- Body.

For the introductory exercises, the slides use `public static` as the access modifier. The function name convention is camelCase starting with a lowercase character. Names should be brief, meaningful and describe what the function does.

Parentheses must be written even when the argument list is empty:

```java
public static double enterAmount() {
    // body
}
```

### 7.3 Arguments and parameters

A **function call** invokes a function. Some calls pass **arguments** (also called actual parameters). The function declaration lists **formal parameters** in its argument list.

The slides explain that formal parameters are similar to local variables and are initialized with the argument values passed by the function call. A parameter list can contain several individually typed parameters, separated by commas.

Example:

```java
public static double average(double amount1,
                             double amount2,
                             double amount3) {
    double result = (amount1 + amount2 + amount3) / 3;
    return result;
}
```

Here, the function has three formal parameters of type `double`. The variable `result` is a local variable because it is declared inside the function body.

### 7.4 Return values and `void`

The return type tells the caller what kind of value the function returns. The Java keyword `return` passes the return value back to the caller.

A function that returns a value has a return type such as `double` or `int`:

```java
public static double average(double a, double b, double c) {
    return (a + b + c) / 3;
}
```

A function that does not return a result uses `void`:

```java
public static void printResult(double average) {
    System.out.println("The average is: " + average);
}
```

The slides explain the difference between calls:

- A method call with a non-`void` return type is an expression because it produces a value. That value can be assigned to a variable or used inside another statement.
- A `void` method call does not produce a value. It cannot be assigned to a variable or used where an expression value is required. It can be called as a statement on its own.

The `return` statement ends the method after returning its value.

---

## 8. Object-oriented programming and objects

*Source: PDF pages 106–128.*

### 8.1 Objects and object-oriented programming

The slides identify the **object** as the foundation of **Object-Oriented Programming (OOP)**.

An object in everyday life has:

- **Properties**, which make up its state.
- **Behaviour**, meaning the actions it can perform.

In software, the corresponding terms are:

- Properties → **attributes**, **fields** or **class properties**.
- Behaviour → **methods**.

The slides also relate objects to entities used in database design and general analysis and design.

A ship illustrates the idea:

- Attributes can include type, capacity, amount of crew on board, length, width and draft.
- Behaviour can include docking, sounding its horn, lowering its anchor, turning, boarding passengers and loading cargo.

### 8.2 Classes and objects

A **class** is a blueprint that describes the properties and methods of all objects of a certain type.

An **object** is a unique instance of a class. Therefore:

- The class determines the type of the object.
- The class defines the attributes and methods.
- The object has its own attribute values and can use the methods defined by its class.

For example, `Car` can be a class, while `herbie` is an object created from that class:

```java
Car herbie = new Car();
herbie.start();
herbie.accelerate(10);
herbie.turn(90);
```

The slides also use `Dog` and `Rectangle` examples to distinguish the class definition from an individual object and its attribute values.

### 8.3 Method calls as messages

A method call is presented as a **message** sent to an object. A typical call has:

- The object receiving the call.
- The method name.
- Optional parameter values.
- Potentially, a result that can be stored in a variable.

The general form is `objectName.methodName(...)`. The slides show `keyboard.nextInt()` as an example of calling a method on a keyboard object and assigning its result to a variable.

### 8.4 Creating and initializing objects

To create an object, the slides use:

```java
ClassName variableName = new ClassName(parameters);
```

The `new` operator:

- Allocates memory to store the object.
- Returns a reference to the object that was created.
- Calls a constructor of the class.

The parentheses after the class name are mandatory, even when there are no parameters. Optional parameters are written between the parentheses and are used to initialize the object through the constructor.

Examples in the slides include:

```java
Scanner keyboard = new Scanner(System.in);
Random rand = new Random(10);
StringBuilder builder = new StringBuilder();
```

A constructor is described as a special kind of method. It has the same name as its class, and each constructor call creates a new object.

### 8.5 Using an object

The slides state that only an object's **public** properties and methods can be accessed from the using code.

To access a public property or invoke a public method, write the object name, a dot, and the property or method name:

```java
int number = random.nextInt();
```

The slides emphasize the distinction between the class name `Random` and the object variable name `random`.

### 8.6 The `Random` class

The `Random` class is used in the slides to generate pseudo-random values. The slides explain that its values form a sequence based on a mathematical formula.

Two constructors are introduced:

- `Random()` generates different number sequences for different instances, as described in the slides.
- `Random(long seed)` produces the same sequence for a specific seed. Creating multiple `Random` instances with the same seed produces the same number series.

The methods covered are:

| Method | Result described in the slides |
|---|---|
| `nextInt(int bound)` | Whole number from 0 inclusive to `bound` exclusive: `0 <= result < bound`. |
| `nextInt(int origin, int bound)` | Whole number from `origin` inclusive to `bound` exclusive. |
| `nextDouble()` | Number from 0 inclusive to 1 exclusive: `0 <= result < 1`. |
| `nextBoolean()` | A random boolean value: `true` or `false`. |

Examples from the coursework:

- A six-sided die can be simulated with `generator.nextInt(6) + 1` or `generator.nextInt(1, 7)`.
- A coin toss can use `generator.nextBoolean()` or `generator.nextInt(2)`.
- `generator.nextInt(50) + 50` produces a number in the range 50 through 99.
- A three-digit number can be generated with `generator.nextInt(900) + 100` or `generator.nextInt(100, 1000)`.

---

## 9. References, memory, packages and garbage collection

*Source: PDF pages 129–142.*

### 9.1 References to objects

When an object is created, a **reference** to that object is assigned to a variable. The slides distinguish the variable from the object itself:

- The variable stores the reference.
- The reference identifies the object that was created.
- The memory diagrams distinguish **stack memory** (where the reference variable is shown) and **heap memory** (where the object is shown).

Object creation and reference assignment can be written on one line or on separate lines:

```java
Random generator = new Random();
```

or

```java
Random generator;
generator = new Random();
```

The slides show that trying to use a reference variable before it has been initialized does not compile. The variable must first receive a reference to an object before the example can call a method on that object.

### 9.2 Multiple references to one object

More than one reference variable can refer to the same object:

```java
Random randomOne;
Random randomTwo;
randomOne = new Random(42);
randomTwo = randomOne;
```

After the assignment, both variables refer to the same object. The slides contrast assignment of primitive values with assignment of references:

- **Primitive assignment:** the value is copied. If `j = i`, both variables initially contain the same value, but changing `i` later does not change `j`.
- **Reference assignment:** the reference is copied. Both variables then refer to the same object. A change made to that object through one reference can also be observed through the other reference.

The player example illustrates this: assigning `player1` to `player2` means both refer to the same player object. Adding a life through `player1` is visible when reading the lives through `player2`.

### 9.3 Packages and imports

A **package** groups related classes and interfaces into one unit, similar to a folder in a file system. The slides give these reasons for organizing classes into packages:

- It helps manage and maintain code.
- It prevents naming conflicts.
- It controls access to code.

Each class belongs to a package. For example, `Random` belongs to `java.util`, and its fully qualified name is `java.util.Random`.

An `import` statement allows a class to be referred to by its simple name:

```java
import java.util.Random;
Random generator = new Random();
```

Without an import, the fully qualified name is used:

```java
java.util.Random generator = new java.util.Random();
```

The slides also show `import java.util.*;` as a way to import all classes from the `java.util` package.

The compiler's class lookup order is listed as:

1. Explicitly imported classes (package plus class name).
2. Classes in the current package.
3. Classes from packages imported using `*`.

The slides identify some packages that are available automatically:

- The default package (classes without a package declaration).
- The current package.
- `java.lang`, which contains Java's base classes.

A package naming convention is to use a reversed company domain followed by project or subpackage names, all in lowercase, for example `be.kdg.programming1.m4.myutilities`. The reversed domain is used to help ensure worldwide uniqueness.

### 9.4 Garbage collection

**Garbage collection** frees memory that was allocated for objects but is no longer referred to by any variable. The slides describe it as the opposite of `new`.

According to the slides, a reference can disappear when:

- The reference variable no longer exists, for example because it has gone out of scope.
- `null` is assigned to the reference variable.

Garbage collection happens automatically, but not immediately. The slides describe it as running on a separate, low-priority thread.

---

## 10. Strings and StringBuilder

*Source: PDF pages 143–163.*

### 10.1 `String` is a class

The slides explain that `String` is a class, so each `String` in a program is an object. It belongs to `java.lang`, so no import is needed.

A `String` object is **immutable**: once created, its contents cannot be updated. Any apparent change creates a new `String` object instead.

### 10.2 Creating strings

A string literal is already a `String` object:

```java
String theString = "Hello World";
System.out.println("Hello World");
```

The slides show that the variable and the same literal represent the same object. They also show explicit construction:

```java
String otherString = new String("Hello World");
```

The slides label explicit creation with `new String(...)` as bad practice in this example.

### 10.3 Text blocks

The slides introduce text blocks for text containing multiple lines and double quotes. A text block starts and ends with three double quotes (`"""`):

```java
String sql = """
    SELECT id, firstName, lastName
    FROM Employee
    WHERE departmentId = "IT"
    ORDER BY lastName, firstName""";
```

The example shows that a text block can include line breaks and double quotes without writing a separate escape for each double quote.

### 10.4 Reading strings with `Scanner`

The slides distinguish two input methods:

- `keyboard.next()` reads characters from the input buffer up to a space or newline.
- `keyboard.nextLine()` reads characters from the input buffer up to a newline.

A common issue occurs when `nextInt()` is followed directly by `nextLine()`. After the user enters an integer and presses Enter, the Enter/newline remains in the input buffer. The following `nextLine()` consumes that leftover newline, so the expected name or sentence is skipped and an empty string is read.

The slide's fix is to call `nextLine()` once after `nextInt()` to clear the leftover Enter before reading the full line:

```java
int age = keyboard.nextInt();
keyboard.nextLine(); // clear the leftover Enter
String name = keyboard.nextLine();
```

### 10.5 Common `String` methods

The slides introduce these methods:

| Method | Purpose |
|---|---|
| `length()` | Returns the number of characters in the string. |
| `charAt(int index)` | Returns the character at the given index; the first character is at index 0. |
| `equals(String string)` | Compares two strings and returns `true` or `false`. |
| `equalsIgnoreCase(String string)` | Compares two strings without considering letter case. |
| `compareTo(String other)` | Compares strings alphabetically: returns a negative value if this string comes before the other, zero if equal, and a positive value if it comes after. |
| `isEmpty()` | Returns `true` if the string has length zero. |

The slides also name `substring`, `strip`, `toUpperCase` and `toLowerCase` as other popular methods.

String literals are objects too, so methods can be called directly on a literal. The `+` operator can concatenate string literals and string variables:

```java
String greeting = "Hello";
String message = greeting + " Duke!";
```

### 10.6 Comparing strings

The slides strongly warn not to compare strings using `==`. The memory example shows that two identical string literals can refer to the same pooled string, while a separately created `new String("abc")` object is a different object.

The example gives:

- `one == two` → `true` for two references to the same literal object.
- `one == three` → `false` for a literal and an explicitly created object.
- `one.equals(three)` → `true` because the string contents are equal.

The course conclusion is: **do not use `==` to compare string contents; use `equals()` instead.**

The slides also show that string literals are allocated in memory only once in the Java String Pool. The important practical distinction in the lesson is that `==` does not provide the intended content comparison, whereas `equals()` does.

### 10.7 Immutability in practice

Calling a method such as `concat()` does not change the original string object. The method produces a new string. The example demonstrates that:

```java
String s1 = "abc";
s1.concat("def");
System.out.println(s1); // original string remains "abc"

String s2 = s1.concat("def");
System.out.println(s2); // the returned string is "abcdef"
```

This is another illustration of string immutability. The slides recommend considering `StringBuilder` when text is changed often.

### 10.8 `StringBuilder`

`StringBuilder` is presented as an alternative to `String` when mutable text is useful:

- Its contents can be modified.
- Text can be appended, inserted or removed without creating new objects for every change.
- The slides say this makes it more performant and reduces memory usage when a string is changed often.

A `String` can be created from a literal or with `new String(...)`. A `StringBuilder` object is created using one of its constructors:

```java
StringBuilder emptyBuilder = new StringBuilder();
StringBuilder builder = new StringBuilder("stringliteral");
```

Methods covered in the slides:

| Method | Purpose |
|---|---|
| `append(...)` | Appends its argument to the end of the builder. |
| `toString()` | Returns the builder's contents as a `String` object. |
| `length()` | Returns the builder's length. |
| `charAt(int index)` | Returns the character at the given index, starting at zero. |
| `reverse()` | Reverses the builder's contents. |

Other methods named in the slides include `insert`, `setCharAt`, `deleteCharAt`, `replace`, `substring` and `indexOf`.

The **builder pattern** example uses chained calls such as `fork.append('r').append('k')`. The slides explain that `append` returns the modified `StringBuilder`, allowing another `append` call to follow it.

---

## 11. Formatting output

*Source: PDF pages 164–171.*

### 11.1 Formatting to the screen or to a string

For displaying formatted data, the slides use:

```java
System.out.printf("formatstring", variable, ...);
System.out.format("formatstring", variable, ...);
```

The slides state that `printf` and `format` are identical except for their names.

If the formatted result is needed as a `String` object, use `String.format(...)`:

```java
String str = String.format("%d apples are €%.2f.", 4, 14.0 / 4);
System.out.println(str);
```

### 11.2 Format specifiers

A format specifier begins with `%` and indicates the kind of value to display.

| Specifier | Data described in the slides |
|---|---|
| `%d` | `int` and `long` (integer number) |
| `%f` | `float` and `double` (decimal number) |
| `%s` | `String` |
| `%c` | `char` |
| `%b` | `boolean` |
| `%n` | Newline; described as more platform-independent than `\n` |
| `%%` | A percent character in the formatted output (shown in the VAT example). |

By default, formatted values are aligned to the right.

Additional indicators can appear between `%` and the type letter:

- **Width `n`:** specifies the minimum number of character positions. For example, `%20s` reserves at least 20 positions.
- **Minus `-`:** left-aligns the value, for example `%-20s`.
- **`n.d` with `%f`:** specifies the minimum total width and the number of decimal places. For example, `%6.2f` uses at least six positions and two decimal places. The slides say the value is automatically rounded to the nearest value at the requested precision.
- **Comma `,` with numbers:** adds a thousands separator, for example `%,d`.

### 11.3 Matching format specifiers and arguments

For every format specifier, the argument list must contain a corresponding parameter of the appropriate type. The slides demonstrate combining `%d` and `%c` with an integer and a character, as well as using `%f` for a decimal value.

The slides also show that a width is a **minimum**, not a maximum. If the supplied value is longer than the requested width, the output is not cut off; it occupies the space it needs.

Examples covered include:

- `%10.2f` to display a decimal value with a minimum width of 10 and two decimal places.
- `%-10s` to display a string left-aligned in a minimum width of 10.
- `%4d` to display integers in a minimum width of 4.
- `%n` to end the formatted output with a newline.

---

## 12. Designing classes

*Source: PDF pages 172–192.*

### 12.1 Recap: class and object

A class is a blueprint describing the properties and methods of objects of a certain kind. An object is a unique instance of that class. The class defines which attributes and methods are available; each object has its own attribute values.

The `Dog` example in the slides has attributes such as coat colour, eye colour, height and weight. An individual dog object has concrete values for those attributes and can invoke methods such as `sit`, `lie` and `here`.

### 12.2 Structure of a class

The class example uses a `Rectangle` class. A class body can contain:

- **Attributes**, which represent the object's data, such as `x`, `y`, `height` and `width`.
- **Constructors**, which initialize new objects.
- **Methods**, which represent operations that can be performed on the object, such as getters and setters or calculations such as area and perimeter.

The slides show a public class declaration and explain that a public class must be declared in a `.java` file with the same name as the class. For example, a public `Rectangle` class belongs in `Rectangle.java`.

A separate application/client class containing a `main` method is used to run the program and create or use objects of the class.

### 12.3 Class declaration syntax

The general class declaration shown in the slides is:

```java
[public] [abstract | final] class ClassName [extends SuperClass]
        [implements Interface] {
    // class contents
}
```

In the syntax description:

- Items in square brackets are optional.
- The class name is an identifier chosen for the class.
- The class body contains the class contents.
- The slides recommend making all classes `public` at this stage of the course.

The syntax lists `abstract`, `final`, `extends` and `implements`, but this module does not explain those concepts in detail; the guide does not expand them.

### 12.4 UML class diagrams

The slides use UML class diagrams to represent classes and objects. The `Rectangle` example shows the class's attributes and methods in one area, and an individual `Rectangle` object with concrete attribute values in another.

The same method names can be shown in the class and in an object instance. The example includes `getHeight`, `setHeight`, `getWidth`, `setWidth`, `getX`, `setX`, `getY`, `setY`, `getPerimeter` and `getArea`. The object example shows particular values for position, height and width and the results of methods such as perimeter and area.

### 12.5 Attributes

An **attribute** is a variable declared in the class to store information about an object. The slides' example declares attributes for a rectangle's position and dimensions.

The general attribute declaration format shown is:

```java
[private | public | protected] [static] [final] type name [= initValue];
```

The slides explain these parts:

- Access modifier: controls where the attribute can be accessed.
- `static`: listed but deferred to a later module.
- `final`: the variable cannot be modified after initialization.
- Type: can be a primitive type or a reference type.
- Name: the attribute's identifier.
- Initial value: an optional starting value.

The key design guideline is: **unless an attribute is `final`, mark it `private`.** The slides connect this recommendation to encapsulation.

### 12.6 Access modifiers

The slides give the following access table:

| Modifier | Same class | Class in same package | Subclass | Any class |
|---|:---:|:---:|:---:|:---:|
| `private` | Yes | No | No | No |
| No modifier (package access) | Yes | Yes | No | No |
| `protected` | Yes | Yes | Yes | No |
| `public` | Yes | Yes | Yes | Yes |

If no access modifier is written, the slides call the result **package access**. At most one of the accessibility modifiers is allowed in a declaration.

### 12.7 Default attribute values

The slides state that attributes receive default values automatically when no initial value is supplied:

| Attribute type | Default value shown |
|---|---|
| Integral number | `0` |
| `char` | `\u0000` (Unicode zero) |
| Floating-point number | `0.0` |
| `boolean` | `false` |
| Object/reference type (for example `String` or `Rectangle`) | `null` |

The slides warn that using an object reference when it is still `null` results in a `NullPointerException` and can terminate the program.

This is contrasted with local variables: class attributes are automatically initialized, while local variables are not automatically initialized and must be given a value before they are used.

---

## 13. Methods, parameters and encapsulation in classes

*Source: PDF pages 193–220.*

### 13.1 Methods

A **method** is code associated with an object. Calling a method sends a request to the object, and the method can provide a response.

The method declaration syntax shown in the slides is:

```java
[public | private | protected] [static] [abstract] [final]
returnType methodName([parameters]) [throws exceptions] {
    // statements
}
```

A method can return a value or use `void` when it does not return anything. The syntax also lists `static`, `abstract`, `final` and `throws exceptions`; the slides indicate that some of these are explained later, so this guide does not extend those topics.

### 13.2 Attribute scope versus local-variable scope

The slides compare attributes and local variables:

| Attribute | Local variable |
|---|---|
| Declared in the class (class scope). | Declared in a code block (local scope). |
| Automatically initialized. | Not automatically initialized. |
| Valid in the class and all its methods. | Valid only in its code block. |
| Belongs to the object's state. | Can temporarily hold a value within a method or block. |

A method always has access to the attributes of the object on which it is called. The method does not need those attributes to be passed as parameters.

A local variable can have the same name as an attribute. The `this` reference distinguishes the object's attribute from the local variable:

```java
private int number = 42;

public void method1() {
    int number = 7;
    System.out.println(number);       // local variable
    System.out.println(this.number); // object's attribute
}
```

The slides also show that `this.number` can be used to refer to the attribute explicitly when there is no local variable with the same name.

### 13.3 Parameters and pass by value

Parameters are used to pass data to a method. Each parameter is declared individually, with its type, and parameters are separated by commas.

Example:

```java
public void setPosition(int x, int y) {
    this.x = x;
    this.y = y;
}
```

The slides describe the parameter mechanism as **pass by value**. When `rect.setPosition(7, 9)` is called, the values `7` and `9` are assigned to the method parameters `x` and `y`, respectively. The slides compare this to local assignments `x = 7;` and `y = 9;`.

### 13.4 Setters (mutators)

A **setter**, also called a **mutator**, changes an attribute.

The slides describe typical setters as follows:

- They generally have one parameter.
- The parameter type matches the type of the attribute being changed.
- They often check the new value before assigning it.
- Their return type is `void`.

Example:

```java
public void setWidth(int width) {
    if (width > 0) {
        this.width = width;
    }
}
```

The slides also show a string setter that checks that the provided name is not empty before storing it. The `this` reference is necessary in a setter when the parameter and attribute have the same name, so the attribute can be distinguished from the parameter.

### 13.5 Returning a value from a method

To return a value:

1. Put the result type before the method name.
2. Use `return expression;` inside the method.
3. Call the method and use the returned value.

Example:

```java
public int getWidth() {
    return this.width;
}
```

The caller can store the result:

```java
int theWidth = rect.getWidth();
```

Or it can use the method call directly in another statement:

```java
System.out.println(rect.getWidth());
```

A method that returns `void` has no result to assign or print. The method can still be called as a statement, for example `rect.setWidth(5);`.

### 13.6 Getters (accessors)

A **getter**, also called an **accessor**, provides information about an attribute.

The slides describe getters as methods that:

- Generally have no parameters.
- Have a return type matching the type of the attribute whose value they provide.

Example:

```java
public int getWidth() {
    return this.width;
}
```

The slides note that `this` is optional in a getter when there is no ambiguity. The coursework exercises also use methods such as `getArea()` and `getPerimeter()` to calculate and provide derived information about a rectangle.

### 13.7 Encapsulation

**Encapsulation** means accessing an object's attributes through methods rather than directly. The slides recommend using setters and getters rather than public attributes.

Direct access to a public attribute allows other code to place invalid values in an object. The car example demonstrates that a public `speed` attribute can be set to values such as `50000` or `-50000`, with no control over whether the data is valid.

Changing the attribute to `private` prevents direct access from the application, but a public setter without validation still allows invalid values to be passed. The slides therefore show the complete approach:

1. Make the non-final attribute `private`.
2. Provide a public setter when other code needs to change the value.
3. Validate the new value inside the setter before assigning it.

The car example defines `MIN_SPEED = -20` and `MAX_SPEED = 300`. The setter only assigns the new speed when it is within that range. Otherwise it prints an invalid-speed message and leaves the existing speed unchanged.

The stated conclusion is that the class then has control over the validity of its data. The best-practice guidance is to make non-final attributes private and implement public setters with validation code when a public setter is necessary.

### 13.8 Method overloading

**Method overloading** allows methods in the same class to have the same name when their parameter lists differ.

The slides say that overloaded methods must have:

- Different parameter types, or
- A different number of parameters.

The method name plus parameter list defines the **method signature**. For example, a car class can have both `report()` and `report(String unit)`. The compiler uses the arguments in the method call to select the corresponding overloaded method.

---

## 14. Constructors

*Source: PDF pages 221–235.*

### 14.1 What is a constructor?

A **constructor** is a special kind of class member used to create and initialize objects. The slides state that every class needs a constructor to create and initialize its objects.

A constructor:

- Has the same name as its class.
- Has no return type.
- Can have parameters used to initialize the object.
- Is called when an object is created with `new`.

The slides show constructor access modifiers such as `public`, `private` and `protected`. Constructor names follow the class-name convention: they start with a capital letter (UpperCamelCase).

### 14.2 Constructors and object creation

Examples:

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

The class has two constructors: one without parameters and one with two parameters. These allow objects to be created with different initialization information.

### 14.3 Default constructor

If no constructor is written in a class, Java automatically generates a **default constructor**. The slides describe the generated default constructor as having no parameters and an empty body.

Important rule:

- If no constructor is declared, the default constructor is generated automatically.
- If any constructor is explicitly declared, Java does **not** automatically generate the no-argument default constructor.
- If a no-argument constructor is needed in that situation, it must be written explicitly.

The slides also show an explicit no-argument constructor that sets starting values. This is still a no-argument constructor, but its body can initialize values rather than being empty.

### 14.4 Constructor validation

The car example shows why constructors should not allow invalid data to enter an object. A constructor that assigns a supplied speed directly can create an invalid object, such as a car with speed `-1000`.

The solution is to call a validating setter from the constructor. In the example, the setter checks the range from `-20` through `300`. If the supplied value is outside the range, it prints an invalid-speed message and leaves the speed at its default value. The slides conclude that using a validating setter in the constructor results in a valid object state.

### 14.5 Constructor overloading and a copy constructor

The coursework exercises ask for several constructor forms for `Rectangle`:

- A default constructor.
- A constructor with two parameters for height and width.
- A constructor with four parameters for x-position, y-position, height and width.
- A copy constructor that takes another `Rectangle` as a parameter and copies its attributes into the new object.

These examples illustrate constructor overloading: a class can provide multiple constructors with different parameter lists. The slides recommend ensuring that invalid data cannot enter through any constructor.

### 14.6 Calling one constructor from another with `this(...)`

A constructor can call another constructor in the same class using `this(parameters)`. The slides give two reasons and rules:

- It allows code reuse and reduces redundant initialization code.
- The `this(parameters)` call must be the **first line** of the constructor.

Example:

```java
public Point() {
    this(1.0, 1.0);
}

public Point(double x, double y) {
    setX(x);
    setY(y);
}
```

The no-argument constructor delegates to the constructor with two parameters. The slides recommend that constructors with fewer parameters call the constructor with the most parameters when appropriate, supplying default values for omitted information.

---

## 15. The `toString()` method

*Source: PDF pages 236–242.*

Every object can invoke a `toString()` method, and `toString()` returns a `String`.

The default implementation shown in the slides prints the class name and a hash code, for example `Dummy@190d11`. The slides describe this default output as not very useful.

When an object is passed to `System.out.println`, `println` internally calls `toString()`. Therefore these two calls produce the same output:

```java
System.out.println(dummy.toString());
System.out.println(dummy);
```

The slides show how to redefine `toString()` so that it returns meaningful text describing an object's state. A `Person` example returns the first and last name. The method is marked with `@Override` in the example.

A `Point` example returns its coordinates as `(x,y)`. The slides show both string concatenation and `String.format(...)` as possible ways to build the returned string.

The `Rectangle` exercise asks for a `toString()` representation that includes the dimensions, position, area and perimeter. The purpose is to make printing an object display useful information about that object's state rather than the default class-name/hash-code text.

---

## 16. The `Math` class

*Source: PDF pages 243–248.*

The `Math` class is described as a **utility class** containing methods for basic numeric operations, including elementary exponential, logarithm, square-root and trigonometric functions.

The slides state that:

- `Math` contains only static methods.
- Its constants include `E`, the base of the natural logarithms, and `PI`, the ratio of a circle's circumference to its diameter.
- Static methods and variables are called on the class, using the class name such as `Math`.

Methods explicitly listed include:

| Member | Purpose stated in the slides |
|---|---|
| `Math.max(a, b)` | Returns the larger of two values. |
| `Math.min(a, b)` | Returns the smaller of two values. |
| `Math.abs(a)` | Returns the absolute (positive) value. |
| `Math.pow(a, b)` | Calculates a power. |
| `Math.sqrt(a)` | Calculates a square root. |
| `Math.E` | Constant for the base of natural logarithms. |
| `Math.PI` | Constant for the ratio of circumference to diameter. |

The slides demonstrate calls such as `Math.abs(number)`, `Math.pow(number, value)`, `Math.sqrt(value)`, `Math.max(number, value)`, `Math.min(number, value)` and printing `Math.PI`.

---

## 17. High-value comparisons to remember

| Concept A | Concept B | Difference taught in the coursework |
|---|---|---|
| Compiled language | Interpreted language | A compiled language transforms source to platform-specific binary before execution; an interpreted language uses an interpreter on the target platform to transform and execute source. |
| Java source | Java bytecode | `.java` is the text source file; the compiler produces JVM bytecode in a `.class` file. |
| JRE | JDK | JRE runs Java bytecode and contains the JVM plus Java API; JDK contains the JRE plus development tools and extras. |
| Expression | Statement | An expression evaluates to one value; a statement is an instruction. |
| Block | Scope | A block is statements enclosed in braces; scope is the region where a declared variable can be used. |
| `if...else` | `?:` | `if...else` is a statement; the conditional operator is an expression that returns one of two values. |
| Traditional `switch` | Simplified arrow `switch` | Traditional cases can fall through until `break`; simplified arrow cases allow multiple labels, need no `break` and do not fall through. |
| `while` | `do...while` | `while` tests before executing and may run zero times; `do...while` tests after executing and runs at least once. |
| `while` | `for` | Both repeat code; `for` puts initialization, condition and modification in one compact header. |
| Pre-increment | Post-increment | Pre-increment changes the value before it is used; post-increment uses the old value and changes the variable afterwards. |
| Primitive assignment | Reference assignment | Primitive assignment copies the value; reference assignment copies the reference, so both variables can refer to the same object. |
| Attribute | Local variable | An attribute belongs to the class/object and is automatically initialized; a local variable belongs to a block and is not automatically initialized. |
| Getter | Setter | A getter provides an attribute's value; a setter changes an attribute. |
| Public attribute | Private attribute with validated setter | Direct public access permits invalid values; encapsulation allows the class to control and validate changes. |
| Overloading | Same method repeated | Overloading uses the same name with a different number or type of parameters, giving a different signature. |
| Constructor | Ordinary method | A constructor has the class name, no return type, and is called when an object is created to initialize it. |
| `String` | `StringBuilder` | `String` is immutable; `StringBuilder` can be modified without creating new objects for every text change. |
| `==` for strings | `equals()` for strings | The slides warn that `==` is not the intended content comparison; use `equals()` to compare string contents. |
| `printf` / `format` | `String.format` | `System.out.printf` and `System.out.format` display formatted output; `String.format` produces a formatted `String`. |

---

## 18. Coursework boundaries: items mentioned but not fully explained

The slides deliberately defer or only list some subjects. To keep this guide aligned with the supplied coursework, these are not expanded here:

- Reference types are introduced in the variables module and explored in the object module.
- `static` is listed in attribute and method syntax but explicitly deferred to a later module.
- `abstract`, `extends` and `implements` appear in the class-declaration syntax, but the slides do not explain them in this module.
- Exceptions are mentioned in method syntax, and the constructor-validation slide says that throwing an exception will be covered later. This guide does not explain exception handling.
- Arrays, bitwise operators, shift operators and some operators in the precedence table are listed, but are not developed as topics in these slides.
- The slides identify several Java characteristics—such as distributed, robust, multithreaded and secure—without providing full explanations in this introductory section.

For examination revision, use the definitions, rules and examples in the relevant sections above as the level of detail supported by these lecture materials.

---

## 19. Quick revision checklist

Use this list to check whether you can explain the central theory without looking at the slides:

- [ ] Distinguish machine language, assembly language and 3GLs.
- [ ] Explain the compiled, interpreted and Java bytecode/JVM execution models.
- [ ] Distinguish JRE, JDK and IDE.
- [ ] Describe the `.java` → compiler → `.class` bytecode → JVM process.
- [ ] Explain what an algorithm is and identify input, output, tests, repetition and computation.
- [ ] Define a variable, declaration, type, identifier and scope.
- [ ] Recognize the primitive types, their roles and their ranges as listed in the slides.
- [ ] Recognize literal formats, escape sequences and `final` constants.
- [ ] Explain implicit conversion and explicit type casting as taught.
- [ ] Explain mathematical, relational, logical and assignment operators.
- [ ] Distinguish pre-increment/post-increment and pre-decrement/post-decrement.
- [ ] Explain operator precedence and why parentheses are recommended.
- [ ] Distinguish expressions, statements, blocks and variable scope.
- [ ] Explain `if`, `if...else`, nested `if`, `else if`, the conditional operator and both switch forms.
- [ ] Explain `while`, `do...while` and `for`, including the execution order of each.
- [ ] Explain `break` and `continue` and recognize an infinite loop caused by an unchanged condition.
- [ ] Explain why functions/methods are useful, how arguments and parameters work, and the difference between value-returning and `void` methods.
- [ ] Define object, class, attribute, state, behaviour and method call.
- [ ] Explain object creation with `new` and the role of constructors.
- [ ] Use the `Random` methods and ranges shown in the slides.
- [ ] Distinguish primitive-value copying from reference copying and explain how two references can share one object.
- [ ] Explain packages, imports, fully qualified names and automatic imports.
- [ ] Explain when an object becomes eligible for garbage collection as described in the slides.
- [ ] Explain `String` immutability, string input methods, common methods and content comparison with `equals()`.
- [ ] Compare `String` and `StringBuilder` and name the methods taught for each.
- [ ] Read and construct the formatting specifiers taught in the slides.
- [ ] Explain class structure, attribute defaults and access modifiers.
- [ ] Distinguish attributes from local variables and explain `this`.
- [ ] Explain parameters, pass by value, getters, setters and return values.
- [ ] Explain encapsulation and why setters should validate input.
- [ ] Explain method overloading and method signatures.
- [ ] Explain constructors, default-constructor generation, constructor validation and `this(...)`.
- [ ] Explain the purpose of `toString()` and why an overridden version is useful.
- [ ] Describe the `Math` class constants and methods listed in the coursework.

---

**Source:** `programmingfundamentals(1).pdf`, supplied in this conversation (302 PDF pages). The summary follows the lecture blocks in that PDF; page references in the PDF itself are not replaced with external sources or documentation.
