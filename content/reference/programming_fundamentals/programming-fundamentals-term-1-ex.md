# Programming Fundamentals: Term 1 Exercises

This guide contains the Term 1 exercises, their browser-playground links and the example Java solutions supplied in the original guide.

**Single-file Java environment:** Every exercise must be completed in one Java source file. When an exercise requires several classes, declare those classes one after another in the same file. Do not create separate `.java` files or add a Java package declaration.

**Source-material notes:** The pasted instruction sheet includes both `03.00 HigherLower` and a duplicate `01.08 HigherLower`; both are retained with separate exercise IDs. The original Markdown guide has `03.01 Age (if)`, but the pasted instruction sheet has no corresponding task description, so its instructions are explicitly reconstructed from the supplied example solution. The supplied Sum source is only an empty class; this missing reference implementation is identified in its solution section. The Word Hut implementation is reused from the supplied Brownfielders guide and corrected to implement the stated game.

## Table of contents

- [Week 1](#week-1)
  - [Ex 01.03 Sum](#ex-01-03-sum)
  - [Ex 01.04 Welcome (read text)](#ex-01-04-welcome-read-text)
  - [Ex 01.05 Product (read int)](#ex-01-05-product-read-int)
  - [Ex 01.06 Age (LocalDate)](#ex-01-06-age-localdate)
  - [Ex 01.07 BMI v1 (read double)](#ex-01-07-bmi-v1-read-double)
  - [Ex 01.08 BMIv2 (if)](#ex-01-08-bmiv2-if)
  - [Ex 01.08 HigherLower (variable)](#ex-01-08-higherlower-variable)
  - [Ex 01.09 Between (if) / EXTRA](#ex-01-09-between-if-extra)
  - [Ex 01.10 Calculate (if)](#ex-01-10-calculate-if)
- [Week 2](#week-2)
  - [Ex 02.01 Variables](#ex-02-01-variables)
  - [Ex 02.02 numbers v1](#ex-02-02-numbers-v1)
  - [Ex 02.03 Taxes](#ex-02-03-taxes)
  - [Ex 02.04 Numbers V2](#ex-02-04-numbers-v2)
  - [Ex 02.05 Numbers V3](#ex-02-05-numbers-v3)
  - [Ex 02.06 ASCII table](#ex-02-06-ascii-table)
  - [Ex 02.07 Digits v1](#ex-02-07-digits-v1)
  - [Ex 02.08 Digits v2](#ex-02-08-digits-v2)
  - [Ex 02.09 Fuel consumption](#ex-02-09-fuel-consumption)
  - [Ex 02.10 Switches](#ex-02-10-switches)
  - [Ex 02.11 Scramble name /EXTRA](#ex-02-11-scramble-name-extra)
  - [Ex 02.12 Investment](#ex-02-12-investment)
- [Week 3](#week-3)
  - [Ex 03.00 HigherLower (variable)](#ex-03-00-higherlower-variable)
  - [Ex 03.01 Age (if)](#ex-03-01-age-if)
  - [Ex 03.02 Scrabble (switch)](#ex-03-02-scrabble-switch)
  - [Ex 03.03 Loops (while/for)](#ex-03-03-loops-while-for)
  - [Ex 03.04 Multiples (while)](#ex-03-04-multiples-while)
  - [Ex 03.05 Factorial (for)](#ex-03-05-factorial-for)
  - [Ex 03.06 Days in month (switch/conditional operator)](#ex-03-06-days-in-month-switch-conditional-operator)
  - [Ex 03.07 Hexadecimal (for)](#ex-03-07-hexadecimal-for)
  - [Ex 03.08 Divisible (loops/nested if)](#ex-03-08-divisible-loops-nested-if)
  - [Ex 03.09 Interest / EXTRA](#ex-03-09-interest-extra)
  - [Ex 03.10 ASCII box / EXTRA](#ex-03-10-ascii-box-extra)
  - [Ex 03.11 Sequence / EXTRA](#ex-03-11-sequence-extra)
  - [Ex 03.12 Multiplication table / EXTRA](#ex-03-12-multiplication-table-extra)
  - [Ex 03.13 Multiplication table + Quiz / EXTRA](#ex-03-13-multiplication-table-quiz-extra)
  - [Ex 03.14 ASCII Christmas tree / EXTRA](#ex-03-14-ascii-christmas-tree-extra)
  - [Ex 03.15 Functions](#ex-03-15-functions)
- [Week 5](#week-5)
  - [Ex 05.01 Book (class)](#ex-05-01-book-class)
  - [Ex 05.02 Bank Account (class)](#ex-05-02-bank-account-class)
  - [Ex 05.03 Box (class)](#ex-05-03-box-class)
  - [Ex 05.04 Operations (class)](#ex-05-04-operations-class)
  - [Ex 05.05 Maximum (constructor/method overloading)](#ex-05-05-maximum-constructor-method-overloading)
  - [Ex 05.06 Salesperson (class)](#ex-05-06-salesperson-class)
  - [Ex 05.07 Circle (data validation)](#ex-05-07-circle-data-validation)
  - [Ex 05.08 Perfect number / EXTRA](#ex-05-08-perfect-number-extra)
  - [Ex 05.09 For experienced programmers: Word Hut Game / Extra](#ex-05-09-for-experienced-programmers-word-hut-game-extra)
- [Week 6](#week-6)
  - [Ex 06.01 Chess club](#ex-06-01-chess-club)
  - [Ex 06.02 Student Grade Evaluator](#ex-06-02-student-grade-evaluator)

## Week 1

### Ex 01.03 Sum

Implement the Sum program demonstrated in the course slides in the single Java source file. The final Sum example code referenced by the exercise was not included in the supplied materials; the original Markdown guide contains only an empty `Sum03` class. Ask the course instructor for the missing reference implementation before completing the exercise.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0103-sum">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
// MISSING SOLUTION: the source Markdown contains only an empty Sum03 class; no complete Java example was supplied.
class Sum03 { }
```

</details>

### Ex 01.04 Welcome (read text)

Write a program that exhibits the following user interaction:

What is your name? Luka

Welcome Luka!  
Hints:

use keyboard.nextLine() to read a text  
You can declare a text variable like this:  
String firstName;

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0104-welcome-read-text">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.print("What is your name? ");
        String firstName = keyboard.nextLine();
        System.out.print("\nWelcome " + firstName + "!");
        keyboard.close();

    }
}
```

</details>

### Ex 01.05 Product (read int)

Write a program that implements the following behaviour:

Enter a number: 3

Enter another number: 2

Enter a final number: 5

The product is: 30

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0105-product-read-int">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.print("Enter a number: ");
        int firstNumber = keyboard.nextInt();
        System.out.print("\nEnter another number: ");
        int secondNumber = keyboard.nextInt();
        System.out.print("\nEnter a final number: ");
        int thirdNumber = keyboard.nextInt();
        System.out.print("\nThe product is: " + firstNumber * secondNumber * thirdNumber);
        keyboard.close();
    }
}
```

</details>

### Ex 01.06 Age (LocalDate)

Write a program that implements the following behaviour:

Please enter your name: Romelu

Dear Romelu, please enter the year you were born: 2011

If all goes well you'll be 11 by the end of the year.

Note: This is the output for the program in 2022. In 2023 this should print 12 etc.

Hint: to get the current year

Before your class declaration add  
import java.time.LocalDate;  
You can then calculate the current year using:  
year = LocalDate.now().getYear();

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0106-age-localdate">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.time.LocalDate;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int year = LocalDate.now().getYear();
        Scanner keyboard = new Scanner(System.in);
        System.out.print("Please enter your name: ");
        String name = keyboard.nextLine();
        System.out.print("\nDear %s, please enter the year you were born: ".formatted(name));
        int age = year - keyboard.nextInt();
        System.out.print("\nIf all goes well you'll be %d by the end of the year.".formatted(age));

        keyboard.close();
    }
}
```

</details>

### Ex 01.07 BMI v1 (read double)

The BMI is defined as the body mass divided by the square of the body height and is universally expressed in units of kg/m2. (Wikipedia)

Write a program that calculates the BMI. Here is an example session:

Dear patient, this program will calculate your BMI.  
Enter your weight in kilograms:76  
Enter your length in meters: 1,79  
Your BMI is: 23.719609250647608  
Tip: Length can be a floating point number. Use a variable of type double instead of int.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0107-bmi-v1-read-double">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.print("Dear patient, this program will calculate your BMI.\r\n" +
                "Enter your weight in kilograms:");
        int weight = keyboard.nextInt();
        System.out.print("\nEnter your length in meters: ");
        double length = keyboard.nextDouble();
        System.out.print("\nYour BMI is: %f".formatted(calculateBMI(weight, length)));
        keyboard.close();
    }

    public static double calculateBMI(int kg, double m) {
        return kg / Math.pow(m, 2);
    }
}
```

</details>

### Ex 01.08 BMIv2 (if)

Extend assignment BMI v1 with recommendations for the patient:

BMI < 18: underweight  
BMI >= 18 en BMI < 25: healthy weight  
BMI >= 25 en BMI < 30: overweight  
BMI >= 30: obese  
Add an extra line to the output that shows the BMI class: depending on the BMI you show the corresponding label from the list above.

Hint: You can use the && operator (AND) if you want to test 2 conditions. Example

if (bmi >= 18 && bmi<25) {  
// conditional code  
}

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0108-bmiv2-if">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.print("Dear patient, this program will calculate your BMI.\r\n" +
                "Enter your weight in kilograms:");
        int weight = keyboard.nextInt();
        System.out.print("\nEnter your length in meters: ");
        double length = keyboard.nextDouble();
        double BMI = calculateBMI(weight, length);
        System.out.println("\nYour BMI is: %f".formatted(BMI));
        if (BMI < 18) {
            System.out.println("underweight");
        } else if (BMI >= 18 && BMI < 25) {
            System.out.println("healthy weight");
        } else if (BMI >= 25 && BMI < 30) {
            System.out.println("overweight");
        } else {
            System.out.println("obese");
        }
        keyboard.close();
    }

    public static double calculateBMI(int kg, double m) {
        return kg / Math.pow(m, 2);
    }
}
```

</details>

### Ex 01.08 HigherLower (variable)

**Task 1**
Implement and run the HigherLower program from the slides  
**Task 2**
Sometimes you need to change your algorithm a bit to go well with the structure of your programming language.

while (true){

// statements ommitted

if (test) return;

}

The while(true) / return structure is not elegant. While can be accompanied by a test, so it is often better to put the test there, rather than to put it in an if inside the loop.

Remove the if from the loop and put the test in the while condition.

Hint: To test if two values are NOT the same, use the != operator.

**Task 3**
Extend HigherLower with a counter.  
Print the number of guesses the user needed to guess the secret.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0108-higherlower-variable">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int secret = 56;
        int guess;
        int counter = 0;
        Scanner keyboard = new Scanner(System.in);
        System.out.print("Enter a number: ");
        guess = keyboard.nextInt();
        while (guess != secret) {
            counter++;
            if (guess < secret) {
                System.out.println("Higher!");
            } else {
                System.out.println("Lower!");
            }
            System.out.print("Enter a number: ");
            guess = keyboard.nextInt();
        }
        counter++;
        System.out.print("Congratulations, you used " + counter
                + " guesses to find the right number!");
        keyboard.close();
    }
}
```

</details>

### Ex 01.09 Between (if) / EXTRA

Write a program that reads 3 numbers in the range 1..100, and prints the number whose value is between the other two (i.e. it is neither the largest nor the smallest).

Example run:

Enter the first number (1..100): 67  
Enter the second number (1..100): 23  
Enter the third number (1..100): 45  
The middle number is 45

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0109-between-if-extra">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int middleNum;
        Scanner keyboard = new Scanner(System.in);
        System.out.println("Enter the first number (1..100): ");
        int firstNum = keyboard.nextInt();
        System.out.println("Enter the first number (1..100): ");
        int secondNum = keyboard.nextInt();
        System.out.println("Enter the first number (1..100): ");
        int thirdNum = keyboard.nextInt();
        int biggest = Math.max(firstNum, Math.max(secondNum, thirdNum));
        int smallest = Math.min(firstNum, Math.min(secondNum, thirdNum));
        if (firstNum != smallest && firstNum != biggest) {
            middleNum = firstNum;
        } else if (secondNum != smallest && secondNum != biggest) {
            middleNum = secondNum;
        } else {
            middleNum = thirdNum;
        }
        System.out.println("The middle number  is %d".formatted(middleNum));
        keyboard.close();
    }
}
```

</details>

### Ex 01.10 Calculate (if)

**Task 1: 4 operations**
Write a program that implements the following behaviour:

Enter a number: 15  
Enter another number: 4  
Choose an operation:  
add  
substract  
multiply  
divide  
Your choice: 3  
15 \* 4 = 60  
**Optional Task 2: 5 operations / EXTRA**
Extend the program with an extra operation: exponentiation

Example: 5^4 (or 54) = 5*5*5\*5 (= 625)

Hint: Use a loop or Math.pow()

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0110-calculate-if">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.println("Enter a number: ");
        int firstNum = keyboard.nextInt();
        System.out.println("Enter another number: ");
        int secondNum = keyboard.nextInt();
        System.out.println("Choose an operation:\n1. add\n2. substract\n3. multiply\n4. divide\n5. operations");
        int operation = keyboard.nextInt();
        if (operation == 1) {
            System.out.println("%d + %d = %d".formatted(firstNum, secondNum, firstNum + secondNum));
        } else if (operation == 2) {
            System.out.println("%d - %d = %d".formatted(firstNum, secondNum, firstNum - secondNum));
        } else if (operation == 3) {
            System.out.println("%d * %d = %d".formatted(firstNum, secondNum, firstNum * secondNum));
        } else if (operation == 4) {
            System.out.println("%d / %d = %d".formatted(firstNum, secondNum, firstNum / secondNum));
        } else if (operation == 5) {
            System.out.println("%d^%d = %f".formatted(firstNum, secondNum, Math.pow(firstNum, secondNum)));
        }
        keyboard.close();
    }
}
```

</details>

## Week 2

### Ex 02.01 Variables

Write a program in which you declare and initialise variables of types: boolean, char, byte, short, int , long, float and double. You're free to choose any value when initialising these variables.

Next, print the value of each variable. Compile your program, execute it and check the output.

Add the following statement to your code:

final double PI = 3.14;  
Finally, try changing PI's value:

PI = 3.1415926536;  
Are you able to compile and/or run your program? Why (not)?

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0201-variables">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class Main {
    public static void main(String[] args) {
        boolean varboolean = false;
        char varchar = 'a';
        byte varbyte = 4;
        short varshort = 100;
        int varint = 95254;
        long varlong = 1651656452;
        float varfloat = 7.156418f;
        double vardouble = 754.6466;
        final double PI = 3.14;
        System.out.println(varboolean + " " + varchar + " " + varbyte + " " + varshort + " " + varint + " " + varlong
                + " " + varfloat + " " + vardouble + " " + PI);

    }
}
```

</details>

### Ex 02.02 numbers v1

**Part 1**
Write a program in which you calculate the sum of two int variables, each of which contains the value of 2 billion (2,000,000,000).

Print this sum. The output may not be as expected. What happened?

Fix your program to have it print the correct sum.

**Part 2**
Add two long variables to the program you wrote in part 1. Initialise both of them with the value of 10,000.

Calculate the sum of these two variables and store the result in an int variable called result. Print the value of result.

Your program won't even compile correctly. Why not? What do you need to do to fix this? Make the necessary changes.

**Part 3**
Write a new program in which you declare two int variables. Name them first and second. Initialise them with 8 and 5 respectively.

Now print ... :

... their sum  
... their difference (second subtracted from first)  
... their product  
... their quotient (first divided by second)  
... the remainder of first divided by second  
**Part 4**
Add an int variable called result to the program you wrote in part 3.

Assign result the value of ... :

... ++first ... and print the value of result  
... first++ ... and print the value of result  
... --second ... and print the value of result  
... second-- ... and print the value of result  
Explain each value printed.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0202-numbers-v1">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class Main {
    public static void main(String[] args) {
        // part 1, pre-fix
        int varInt1 = 2_000_000_000;
        int varInt2 = 2_000_000_000;
        System.out.println("Part 1 Pre-Fix: " + (varInt1 + varInt2));
        // part 1, post-fix
        long varLong1 = 2_000_000_000;
        long varLong2 = 2_000_000_000;
        System.out.println("Part 1 Fix: " + (varLong1 + varLong2));

        // part 2
        long varLong3 = 10_000;
        long varLong4 = 10_000;
        int result = (int) (varLong3 + varLong4);
        System.out.println("Part 2: " + result);

        // part 3
        int first = 8;
        int second = 5;
        System.out.println("Part 3:\nSum: " + (first + second) + "\nDifference: " + (second - first) + "\nProduct: " //
                + (first * second) + "\nQuotient: " + (first / second) + "\nRemainder: " + (first % second));

        // part 4
        System.out.println("Part4:");
        result = ++first; // increments before assigning the variable
        System.out.println("++first:" + result);
        first = 8;
        result = first++; // increments after assigning the variable
        System.out.println("first++:" + result);
        result = --second; // decrements before assigning the variable
        System.out.println("--second:" + result);
        second = 5;
        result = second--; // decrements after assigning the variable
        System.out.println("second--:" + result);

    }
}
```

</details>

### Ex 02.03 Taxes

Write a program that adds VAT (value-added tax) to a monetary value or that calculates the VAT-exclusive amount from a monetary value that already includes VAT. See the examples below.

Ask the user to enter the following data:

The VAT percentage  
The amount (may or may not include VAT)  
You should also give the user the option to indicate whether or not the amount entered already includes VAT. Display an error message in case the user entered an invalid option.

Examples  
(the amount in bold is the amount you calculate)

First run:

Enter the VAT percentage: 21  
Enter an amount in €: 121  
Make a choice (1 = inclusive, 2 = exclusive): 1  
€100.0 + 21.0% VAT = €121.0

Second run:

Enter the VAT percentage: 6  
Enter an amount in €: 100  
Make a choice (1 = inclusive, 2 = exclusive): 2  
€100.0 + 6.0% VAT = €106.0

Third run:

Enter the VAT percentage: 12  
Enter an amount in €: 100  
Make a choice (1 = inclusive, 2 = exclusive): 3  
Invalid choice!

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0203-taxes">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.println("Enter the VAT percentage: ");
        double vat = 1 + (keyboard.nextDouble() / 100);
        System.out.println("Enter an amount in €: ");
        double amount = keyboard.nextDouble();
        System.out.println("Make a choice (1 = inclusive, 2 = exclusive): ");
        int choice = keyboard.nextInt();
        double res = amount;
        if (choice == 1) {
            res /= vat;
        } else if (choice == 2) {
            res *= vat;
        } else {
            System.err.println("Invalid choice!");
        }
        System.out.println("Res: " + res);
        keyboard.close();
    }
}
```

</details>

### Ex 02.04 Numbers V2

Write a program that can multiply two six-digit numbers.

Create a constant MINIMUM with a value of 100000.  
Create a constant MAXIMUM with a value of 999999.  
Ask the user for two six-digit numbers.  
Check if both numbers do, in fact, have exactly six digits. Display an error message if this is not the case and abort the program. (See the example below)  
If both digits are accepted, then multiply them and show the five final digits of the result. (Hint: you can use one of the five most basic operators to do this)  
Examples  
First run:

Enter a 6-digit whole number: 123456  
Enter another 6-digit whole number: 654321  
The product is 80779853376  
The 5 final digits are: 53376  
Second run:

Enter a 6-digit whole number: 12345  
Enter another 6-digit whole number: 123456  
One of the numbers is too small.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0204-numbers-v2">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        int MINIMUM = 100_000;
        int MAXIMUM = 999_999;
        System.out.println("Enter a 6-digit whole number: ");
        long firstNum = keyboard.nextInt();
        if (firstNum > MAXIMUM || firstNum < MINIMUM) {
            System.err.println("First number is not 6 digits");
        } else {
            System.out.println("Enter another 6-digit whole number: ");
            long secondNum = keyboard.nextInt();
            if (secondNum > MAXIMUM || secondNum < MINIMUM) {
                System.err.println("Second number is not 6 digits");
            } else {
                long product = firstNum * secondNum;
                System.out.println("The product is " + product);
                long res = product % 100000;
                System.out.println("The 5 final digits are: " + res);
            }
        }
        keyboard.close();
    }
}
```

</details>

### Ex 02.05 Numbers V3

Write a program to divide a 13-digit number by an 8-digit number.

Create a constant MINIMUM_DIVIDEND with a value of 1_000_000_000_000 (1 trillion)  
Create a constant MINIMUM_DIVISOR with a value of 10_000_000 (10 million)  
Ask the user to enter a number of at least 13 digits (the dividend). Next, ask the user to enter a number of at least 8 digits (the divisor). In both cases check if the number is large enough. If not, print an error message and abort the program.  
In case both numbers are accepted calculate the quotient and print it. Finally, print the quotient once again, but this time print it as a whole number (no decimal point and no fractional part)  
Examples  
First run:

Enter a 13-digit whole number: 1234567890123  
Enter an 8-digit whole number: 87654321  
The quotient is 14084.506913504014  
Without the fractional part it's 14084  
Second run:

Enter a 13-digit number: 123456789012  
This number is too small.  
Third run:

Enter a 13-digit whole number: 1234567890123  
Enter an 8-digit whole number: 1234567  
This number is too small.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0205-numbers-v3">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        final long MINIMUM_DIVIDEND = 1_000_000_000_000L;
        final long MINIMUM_DIVISOR = 10_000_000;
        System.out.println("Enter a 13-digit whole number: ");
        long firstNum = keyboard.nextLong();
        if (firstNum < MINIMUM_DIVIDEND) {
            System.err.println("First number is not 13 digits");
        } else {
            System.out.println("Enter another 8-digit whole number: ");
            long secondNum = keyboard.nextLong();
            if (secondNum < MINIMUM_DIVISOR) {
                System.err.println("Second number is not 8 digits");
            } else {
                double res = ((double) (firstNum) / secondNum);
                System.out.println("The quotient is " + res);
                System.out.println("Without the fractional part it's " + (long) (res));
            }

        }
        keyboard.close();
    }
}
```

</details>

### Ex 02.06 ASCII table

Write a program that prints an ASCII value of a characters. First, have the user enter a number from 32 (space bar) up until 127, then print the character which represents that number. If the user enters an invalid number, abort the program.

Extra: If you already have some experience in programming and are familiar with loops; print all characters with a decimal code of 32 up to 127. See the example below, each line of the output contains six characters.

Extra extra: Expand the table with all characters with a decimal code of 128 up to 255.

Expected ouput  
( 32) ! ( 33) " ( 34) # ( 35) $ ( 36) % ( 37)  
& ( 38) ' ( 39) ( ( 40) ) ( 41) \* ( 42) + ( 43)  
, ( 44) - ( 45) . ( 46) / ( 47) 0 ( 48) 1 ( 49)  
2 ( 50) 3 ( 51) 4 ( 52) 5 ( 53) 6 ( 54) 7 ( 55)  
8 ( 56) 9 ( 57) : ( 58) ; ( 59) < ( 60) = ( 61)

> ( 62) ? ( 63) @ ( 64) A ( 65) B ( 66) C ( 67)  
> D ( 68) E ( 69) F ( 70) G ( 71) H ( 72) I ( 73)  
> J ( 74) K ( 75) L ( 76) M ( 77) N ( 78) O ( 79)  
> P ( 80) Q ( 81) R ( 82) S ( 83) T ( 84) U ( 85)  
> V ( 86) W ( 87) X ( 88) Y ( 89) Z ( 90) [ ( 91)
> \ ( 92) ] ( 93) ^ ( 94) \_ ( 95) ` ( 96) a ( 97)  
> b ( 98) c ( 99) d (100) e (101) f (102) g (103)  
> h (104) i (105) j (106) k (107) l (108) m (109)  
> n (110) o (111) p (112) q (113) r (114) s (115)  
> t (116) u (117) v (118) w (119) x (120) y (121)  
> z (122) { (123) | (124) } (125) ~ (126) □ (127)

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0206-ascii-table">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        final int MINIMUM = 32;
        final int MAXIMUM = 127;

        char input = 0;
        while (input < MINIMUM || input > MAXIMUM) {
            System.out.println("Give a value between %d and %d".formatted(MINIMUM, MAXIMUM));
            input = (char) (keyboard.nextInt());
        }
        System.out.println("Your value is %s".formatted(String.valueOf(input)));

        for (int i = MINIMUM; i <= 255; i++) {
            System.out.println("%s ( %d)".formatted(String.valueOf((char) (i)), i));
        }
        keyboard.close();
    }
}
```

</details>

### Ex 02.07 Digits v1

Write a program in which you ask the user for four digits. Your program is then supposed to create a number out of these four digits. The first digit represents 1000s, the next one 100s, etc.

The sample input/output below should make things more clear.

Possible extras:

Validate the input  
Tricky: If you are familiar with loops: make sure that the program repeats until the user enters -1 as his/her first digit (you can use a boolean variable to achieve this)  
Hard: For experienced students! instead of an int, read the input as a string of text (using nextLine) and then convert the first character to an int.  
Examples  
First run:

Enter four digits (0..9).  
The first digit: 9  
The second digit: 5  
The third digit: 7  
The fourth digit: 9  
The number is 9579  
Second run:

Enter four digits (0..9).  
The first digit: 6  
The second digit: 0  
The third digit: 2  
The fourth digit: 7  
The number is 6027  
Third run:

Enter four digits (0..9).  
The first digit: 0  
The second digit: 8  
The third digit: 0  
The fourth digit: 7  
The number is 807

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0207-digits-v1">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.println("Enter four digits (0..9).\nThe first digit: ");
        int firstDig = getNum(keyboard);
        System.out.println("The second digit: ");
        int secondDig = getNum(keyboard);
        System.out.println("The third digit: ");
        int thirdDig = getNum(keyboard);
        System.out.println("The fourth digit: ");
        int fourthDig = getNum(keyboard);

        System.out.println("The number is " + (firstDig * 1000 + secondDig * 100 + thirdDig * 10 + fourthDig));
        keyboard.close();
    }

    public static int getNum(Scanner keyboard) {
        final char char0 = '0';
        return keyboard.nextLine().charAt(0) - char0;

    }
}
```

</details>

### Ex 02.08 Digits v2

Write a program in which you ask the user for a number that is made up of exactly four digits. Calculate the sum of these four digits.

Make sure that the number entered by the user is made up of four digits, so it should be in the range [1000..9999]. Make use of constants MINIMUM = 1000 and MAXIMUM = 9999.

Possible extras:

Make sure that the program repeats until the user enters -1 (you can use a boolean variable to help you)  
Hard: Allow the user to enter the amount of digits so that it's not always supposed to be a 4-digit number.  
Examples  
First run:

Enter a 4-digit whole number (1000..9999): 1540  
The sum of the digits of this number is 10  
Second run:

Enter a 4-digit whole number (1000..9999): 6187  
The sum of the digits of this number is 22

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0208-digits-v2">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        while (true) {
            System.out.println("How many digits do you want?");
            int digits = keyboard.nextInt();
            if (digits == -1) {
                break;
            }
            final long MINIMUM = (long) Math.pow(10, digits - 1);
            final long MAXIMUM = (long) Math.pow(10, digits) - 1;
            long res = 0;
            while (res < MINIMUM || res > MAXIMUM) {
                System.out.println("Enter a %d-digit whole number (%d..%d): ".formatted(digits, MINIMUM, MAXIMUM));
                res = keyboard.nextLong();
            }

            int result = 0;
            while (res > 0) {
                result += res % 10;
                res /= 10;
            }
            System.out.println("The sum of the digits of this number is " + result);

        }
        keyboard.close();
    }
}
```

</details>

### Ex 02.09 Fuel consumption

Write a program to calculate a car's fuel consumption.

Ask for the following input:

The car's mileage the last time its tank was filled.  
The current mileage of the car.  
The amount of fuel (in liters) that was used to fill the tank.  
Example  
Enter the previous mileage: 79114  
Enter the current mileage: 80103  
Enter the amount of liters refilled: 60.4  
Consumption for 989km driven: 6.11 liters/100km

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0209-fuel-consumption">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        final Scanner keyboard = new Scanner(System.in);
        System.out.println("Enter the previous mileage: ");
        int prevMileage = keyboard.nextInt();
        System.out.println("Enter the current mileage: ");
        int nextMileage = keyboard.nextInt();
        System.out.println("Enter the amount of liters refilled: ");
        float liters = keyboard.nextFloat();
        int totalMileage = nextMileage - prevMileage;
        System.out.println(
                "Consumption for %dkm driven: %f liters/100km".formatted(totalMileage, liters * 100 / totalMileage));
        keyboard.close();
    }
}
```

</details>

### Ex 02.10 Switches

Write a program to simulate three switches. Ask for the state of each switch by reading a literal of type boolean.

Next, perform the following checks in sequence:

Check if at least two switches are turned on (on = true)  
Check if exactly two switches are turned on  
Check if at most one switch is turned on  
Examples  
First run:

Enter the state of switch 1 (true or false): false  
Enter the state of switch 2 (true or false): false  
Enter the state of switch 3 (true or false): false  
At most one switch is turned on.  
Second run:

Enter the state of switch 1 (true or false): false  
Enter the state of switch 2 (true or false): true  
Enter the state of switch 3 (true or false): false  
At most one switch is turned on.  
Third run:

Enter the state of switch 1 (true or false): true  
Enter the state of switch 2 (true or false): false  
Enter the state of switch 3 (true or false): true  
At least two switches are turned on.  
Exactly two switches are turned on.  
Fourth run:

Enter the state of switch 1 (true or false): true  
Enter the state of switch 2 (true or false): true  
Enter the state of switch 3 (true or false): true  
At least two switches are turned on.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0210-switches">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        final Scanner keyboard = new Scanner(System.in);
        int switches = 0;

        for (int i = 0; i < 3; i++) {
            System.out.println("Enter the state of switch %d (true or false): ".formatted(i + 1));
            if (keyboard.nextBoolean()) {
                switches++;
            }
        }
        if (switches >= 2) {
            System.out.println("At least two switches are turned on.");
        }
        if (switches == 2) {
            System.out.println("Exactly two switches are turned on.");
        }
        if (switches <= 1) {
            System.out.println("At most one switch is turned on.");
        }
        keyboard.close();
    }
}
```

</details>

### Ex 02.11 Scramble name /EXTRA

This exercise uses API's we have not covered in class yet, and is intended as a challenge for students with prior Java knowledge!

Write a program to shuffle the letters of a person's name.

Spaces should be removed.

Hint: check the documentation of the class Random.

Examples  
First run:

Enter your name: Lars Willemsens  
Hi Lars Willemsens, your scrambled name is snraeissWLmell.  
Second run:

Enter your name: Jan de Rijke  
Hi Jan de Rijke, your scrambled name is iRanjJedek.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0211-scramble-name-extra">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Random;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        final Scanner keyboard = new Scanner(System.in);
        final Random random = new Random();
        System.out.print("Enter your name: ");
        String original = keyboard.nextLine();
        String name = original.replace(" ", "");
        StringBuilder scrambled = new StringBuilder();

        while (!name.isEmpty()) {
            int pos = random.nextInt(name.length());
            scrambled.append(name.charAt(pos));
            name = name.substring(0, pos) + name.substring(pos + 1);
        }
        System.out.print("Hi %s, your scrambled name is %s.".formatted(original, scrambled.toString()));
        keyboard.close();
    }
}
```

</details>

### Ex 02.12 Investment

Write a Java program that allows a user to calculate how much money they will have after a certain number of years when investing an amount at a fixed annual interest rate.

First, ask for the user's name. Then ask the user to enter the initial investment, the annual interest rate, the number of years, and their currency. The currency is represented by a single character, for example €, $, or £.

Next, calculate the final balance using the compound interest formula:

final balance = investment × (1 + interest rate / 100)^years

Display the user's name, the entered values, and the calculated final balance.

Then extend your program with the following calculations:

Calculate how many full periods of 5 years are contained in the given number of years and how many years remain afterwards.

Increase the number of years by one year using the increment operator and calculate the new final balance.

Then increase the initial investment by 100 using a compound assignment operator and calculate the final balance again.

Finally, create an int variable in which you store the new final balance without decimals. Tip: loss of data is allowed.

Use appropriate data types for the different values, such as String, double, int, and char.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0212-investment">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
public static void main(String[] args) {
        String name;
        double initialInvestment;
        double interestRate;
        int years;
        char currency;
        double finalBalance;
        Scanner keyboard = new Scanner(System.in);

        System.out.println("What is your name?");
        name = keyboard.nextLine();

        System.out.println("What is the initial investment?");
        initialInvestment = keyboard.nextDouble();

        System.out.println("What is the interest rate in %?");
        interestRate = keyboard.nextDouble();

        System.out.println("How many years do you want to invest?");
        years = keyboard.nextInt();

        System.out.println("What is the currency?");
        currency = keyboard.next().charAt(0);

        finalBalance = initialInvestment * Math.pow(1 + interestRate / 100, years); // Use Math.pow(number, exponant)
                                                                                    // to do number^exponant
        System.out.println("Hello " + name + "\nInitial investment is " + initialInvestment + "\nInterest rate is "
                + interestRate + "\nYears invested: " + years + "Final balance is " + finalBalance + currency);

        // Calculate how many full periods of 5 years are contained in the given number
        // of years and how many years remain afterwards.
        System.out.println("There are " + years / 5 + " periods of years");
        System.out.println("With " + years % 5 + " remaining afterwards.");

        // Increase the number of years by one year using the increment operator and
        // calculate the new final balance.
        finalBalance = initialInvestment * Math.pow(1 + interestRate / 100, ++years);
        System.out.println("New final balance after year increase: " + finalBalance);

        // Then increase the initial investment by 100 using a compound assignment
        // operator and calculate the final balance again.
        initialInvestment += 100;
        finalBalance = initialInvestment * Math.pow(1 + interestRate / 100, years);
        System.out.println("New final balance after initial investment increase: " + finalBalance);

        // Finally, create an int variable in which you store the new final balance
        // without decimals. Tip: loss of data is allowed.
        int finalFinalBalance = (int) finalBalance;
        System.out.println("Final balance in int is: " + finalFinalBalance);

        keyboard.close();

    }
}
```

</details>

## Week 3

### Ex 03.00 HigherLower (variable)

**Task 1**
Implement and run the HigherLower program from the slides  
**Task 2**
Sometimes you need to change your algorithm a bit to go well with the structure of your programming language.

while (true){

// statements ommitted

if (test) return;

}

The while(true) / return structure is not elegant. While can be accompanied by a test, so it is often better to put the test there, rather than to put it in an if inside the loop.

Remove the if from the loop and put the test in the while condition.

Hint: To test if two values are NOT the same, use the != operator.

**Task 3**
Extend HigherLower with a counter.  
Print the number of guesses the user needed to guess the secret.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0300-higherlower-variable">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
// Reused from the identical HigherLower example supplied under the legacy 01.08 heading in the Markdown guide.
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        int secret = 56;
        int guess;
        int counter = 0;
        Scanner keyboard = new Scanner(System.in);
        while (true) {
            System.out.print("Enter a number: ");
            guess = keyboard.nextInt();
            counter++;
            if (guess < secret) {
                System.out.print("Higher! ");
            }
            if (guess > secret) {
                System.out.print("Lower! ");
            } else {
                System.out.print("Congratulations, you used " + counter
                        + " guesses to find the right number!");
                keyboard.close();
                return;
            }
        } // end while
    }
}
```

</details>

### Ex 03.01 Age (if)

**Source gap:** The pasted exercise instructions do not contain a task description for Ex 03.01 Age (if). The existing Markdown guide does contain a heading and a Java example. The following task summary is reconstructed only from that supplied example: read an age and display `Baby` for ages below 2, `Child` for ages 2–11, `Teenager` for ages 12–16, or `Adult` for ages 17 and above. Please verify these thresholds against the original course instructions.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0301-age-if">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
// Source gap: exercise instructions were absent from the pasted instructions; this example comes from the existing Markdown guide.
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.println("What is your age?");
        int age = keyboard.nextInt();
        if (age < 2) {
            System.out.println("Baby");
        } else if (age < 12) {
            System.out.println("Child");
        } else if (age < 17) {
            System.out.println("Teenager");
        } else {
            System.out.println("Adult");
        }
        keyboard.close();
    }
}
```

</details>

### Ex 03.02 Scrabble (switch)

Ask the user for a letter and show the scrabble value for that letter.  
The user should get the same result whether entering a lower or upper-case letter.

Points

Letters

1 point

A, E, I, L, N, O, R, S, T, U

2 points

D, G

3 points

B, C, M, P

4 points

F, H, V, W, Y

5 points

K

8 points

J, X

10 points

Q, Z

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0302-scrabble-switch">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.HashMap;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        HashMap<Character, Integer> scrabble = new HashMap<>();
        String onePoint = "aeilnorst u".replace(" ", "");
        String twoPoints = "dg";
        String threePoints = "bcmp";
        String fourPoints = "fhvwy";
        String fivePoints = "k";
        String eightPoints = "jx";
        String tenPoints = "qz";

        for (char letter : onePoint.toCharArray()) {
            scrabble.put(letter, 1);
        }

        for (char letter : twoPoints.toCharArray()) {
            scrabble.put(letter, 2);
        }

        for (char letter : threePoints.toCharArray()) {
            scrabble.put(letter, 3);
        }

        for (char letter : fourPoints.toCharArray()) {
            scrabble.put(letter, 4);
        }

        for (char letter : fivePoints.toCharArray()) {
            scrabble.put(letter, 5);
        }

        for (char letter : eightPoints.toCharArray()) {
            scrabble.put(letter, 8);
        }

        for (char letter : tenPoints.toCharArray()) {
            scrabble.put(letter, 10);
        }
        System.out.println("What letter do you wanna check?");
        char letterToCheck = keyboard.next().toLowerCase().charAt(0);
        if (scrabble.containsKey(letterToCheck)) {
            System.out.println("This letter counts for %d points".formatted(scrabble.get(letterToCheck)));
        } else {
            System.out.println("Not a valid letter");
        }
        keyboard.close();

    }
}
```

</details>

### Ex 03.03 Loops (while/for)

**Task 1: while**
Write a program that

Displays a line with all numbers from 120 to 100 (descending)  
Displays a line with all multiples of 3 below 50  
Displays a line with the powers of 5 below 10,000  
Displays a line with the alphabet  
Hint: you can increment a char

**Task 2: do-while**
Make a copy of the program you wrote in task 1 and replace all while loops with do-while loops.

**Task 3: for**
Make a copy of the program you wrote in task 1 and replace all while loops with for loops.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0303-loops-while-for">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class Main {
    public static void main(String[] args) {
        // Task 1
        int task1 = 120;

        while (task1 > 99) {
            System.out.println(task1);
            task1--;
        }

        task1 = 3;
        while (task1 < 50) {
            System.out.println(task1);
            task1 += 3;
        }
        task1 = 1;
        while (task1 < 10_000) {
            System.out.println(task1);
            task1 *= 5;
        }
        char task1Char = 'a';
        while (task1Char < 'z' + 1) {
            System.out.println(task1Char);
            task1Char++;
        }

        // Task 2
        int task2 = 120;
        do {
            System.out.println(task2);
            task2--;
        } while (task2 > 99);
        task2 = 3;
        do {
            System.out.println(task2);
            task2 += 3;
        } while (task2 < 50);
        task2 = 1;
        do {
            System.out.println(task2);
            task2 *= 5;
        } while (task2 < 10_000);
        char task2Char = 'a';
        do {
            System.out.println(task2Char);
            task2Char++;
        } while (task2Char < 'z' + 1);

        // Task 3
        for (int i = 120; i > 99; i--) {
            System.out.println(i);
        }
        for (int i = 3; i < 50; i += 3) {
            System.out.println(i);
        }
        for (int i = 1; i < 10_000; i *= 5) {
            System.out.println(i);
        }
        for (char i = 'a'; i < 'z' + 1; i++) {
            System.out.println(i);
        }
    }
}
```

</details>

### Ex 03.04 Multiples (while)

Ask a user for a number.

Show all multiples for that number below a maximum value.

In your program initialise a constant MAX to 100.

Example run:

Which number would you like to see the multiples of? 28  
28  
56  
84

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0304-multiples-while">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        final int MAX = 100;
        Scanner keyboard = new Scanner(System.in);
        int inputNumber = keyboard.nextInt();
        int multiple = inputNumber;
        while (multiple < MAX) {
            System.out.println(multiple);
            multiple += inputNumber;
        }
        keyboard.close();
    }
}
```

</details>

### Ex 03.05 Factorial (for)

Show the factorials from 1 to 20 (Factorial calculator) .

Expected output:

1! = 1  
2! = 2  
3! = 6  
4! = 24  
5! = 120  
6! = 720  
7! = 5040  
8! = 40320  
9! = 362880  
10! = 3628800  
11! = 39916800  
12! = 479001600  
13! = 6227020800  
14! = 87178291200  
15! = 1307674368000  
16! = 20922789888000  
17! = 355687428096000  
18! = 6402373705728000  
19! = 121645100408832000  
20! = 2432902008176640000

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0305-factorial-for">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class Main {
    public static void main(String[] args) {
        for (int i = 1; i < 21; i++) {
            long fact = 1;
            for (int j = 1; j <= i; j++) {
                fact *= j;
            }
            System.out.println("%d! = %d".formatted(i, fact));
        }
    }
}
```

</details>

### Ex 03.06 Days in month (switch/conditional operator)

Task 1: Days in month  
Ask a user for the number of a month.

Print the name of the month and the number of days.

There should be only one println statement in your program for printing the result.

Example (2 runs):

Enter a month number (1 = January): 2  
February has 28 days.:

Enter a month number (1 = January): 5  
May has 31 days  
Task 2: Days in month in year  
Extend your program to also ask the user for a year.

If the year is a leap year, February should have 29 days.

A year is a leap year if it is a multiple of 400. It is also a leap year if it is a multiple of 4 and not a multiple of 100.

Example (2 runs):

Enter a month number (1 = January): 2  
Enter a year (4 digits): 2020  
In 2020 February has 29 days.

Enter a month number (1 = January): 2  
Enter a year (4 digits):2021  
In 2021 February has 28 days.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0306-days-in-month-switch-conditional-operator">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.println("Enter a month number (1 = January): ");
        int monthNum = keyboard.nextInt();
        System.out.println("Enter a year (4 digits):");
        int yearNum = keyboard.nextInt();

        String[][] months = {
                { "January", "31" },
                { "February", (yearNum % 400 == 0 || (yearNum % 4 == 0 && yearNum % 100 != 0)) ? "29" : "28" },
                { "March", "31" },
                { "April", "30" },
                { "May", "31" },
                { "June", "30" },
                { "July", "31" },
                { "August", "31" },
                { "September", "30" },
                { "October", "31" },
                { "November", "30" },
                { "December", "31" } };
        String[] month = months[monthNum - 1];
        System.out.println("In %d %s has %s days.".formatted(yearNum, month[0], month[1]));
        keyboard.close();
    }
}
```

</details>

### Ex 03.07 Hexadecimal (for)

Write a program that prints all hexadecimal numbers:

0 1 2 3 4 5 6 7 8 9 A B C D E F  
Hints:

use loop(s)  
You can use char arithmetic  
(char)( 'A' + 2) will result in 'C'  
when you do arithmetic the result is promoted to the largest type. char (2 byte) + int (4 byte) produces an int (4 byte).  
You can get back to char by casting (prepending (char)).

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0307-hexadecimal-for">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class Main {
    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            System.out.println(i);
        }
        for (char i = 'A'; i < 'G'; i++) {
            System.out.println(i);
        }
    }
}
```

</details>

### Ex 03.08 Divisible (loops/nested if)

Task 1: Divisible  
Ask the user for two numbers.

Print all numbers between 1 and 1000 that are divisible by both numbers (the remainder of dividing is 0)

Expected output:

Enter the first divider: 7  
Enter the second divider: 3  
21 42 63 84 105 126 147 168 189 210 231 252 273 294 315 336 357 378 399 420 441 462 483 504 525 546 567 588 609 630 651 672 693 714 735 756 777 798 819 840 861 882 903 924 945 966 987  
Task 2: format the output  
Modify the program to print maximum 10 numbers on a line

Enter the first divider: 3  
Enter the second divider: 8  
24 48 72 96 120 144 168 192 216 240  
264 288 312 336 360 384 408 432 456 480  
504 528 552 576 600 624 648 672 696 720  
744 768 792 816 840 864 888 912 936 960  
Task 3: Rinse and repeat  
Ask the user for a new set of dividers until the user enters a zero  
if the user enters a negative number for one of the dividers, print an error message and restart the loop  
We'll print all numbers below 1000 that are divisible between 2 numbers of your choosing.

Enter the first divider (end the program with 0): 9  
Enter the second divider: 11  
99 198 297 396 495 594 693 792 891 990

Enter the first divider (end the program with 0): -3  
Enter the second divider: 5  
Please enter positive numbers

Enter the first divider (end the program with 0): 14  
Enter the second divider: 60  
420 840

Enter the first divider (end the program with 0): 0

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0308-divisible-loops-nested-if">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        // Task 1
        while (true) {
            System.out.println("Enter the first divider (end the program with 0): ");
            int task1first = keyboard.nextInt();
            if (task1first == 0) {
                break;
            }
            System.out.println("Enter the second divider: ");
            int task1second = keyboard.nextInt();
            if (task1second == 0) {
                break;
            }
            if (task1first > 0 && task1second > 0) {
                int counter = 0; // Task 2
                for (int i = 1; i <= 1000; i++) {
                    if (i % task1first == 0 && i % task1second == 0) {
                        counter++;
                        System.out.print(i + " ");
                        if (counter == 10) {
                            System.out.println();
                            counter = 0;
                        }
                    }
                }

            } else {
                System.out.println("Please enter positive numbers");
            }
        }
        keyboard.close();

    }
}
```

</details>

### Ex 03.09 Interest / EXTRA

Task 1: Compound interest  
Calculate the growth of capital over the years at a given interest rate.

Ask the user to enter these data:

starting capital (double)  
interest rate (double)  
number of years (int)  
Calculate the captial after the given number of years. Cast the capital to long before printing.

Example run:

Enter the starting capital in €: 10000  
Enter the interest rate: 1,1  
Enter the number of years: 8  
The capital will amount to €10914  
Task 2: years to double  
Extend the program by adding the number of years it will take to double the amount at this interest rate.

Example run:

Enter the amount in €: 1000  
Enter the interest: 2,5  
Enter the number of years: 3  
The capital will amount to €1076  
It takes 29 years to double the money.;

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0309-interest-extra">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.println("Enter the starting capital in €:");
        double capital = keyboard.nextDouble();
        System.out.println("Enter the interest rate:");
        double interestRate = (keyboard.nextDouble() / 100) + 1;
        System.out.println("Enter the number of years:");
        int years = keyboard.nextInt();
        System.out.println("The capital will amount to €" + (long) (capital * Math.pow(interestRate, years)));
        // Task 2
        long yearsToDouble = (long) Math.ceil(
                Math.log(2) / Math.log(interestRate));
        System.out.println(
                "It takes %d years to double the money.".formatted(yearsToDouble));

        keyboard.close();
    }
}
```

</details>

### Ex 03.10 ASCII box / EXTRA

Task 1: Draw a filled box  
Draw a filled box using an ascii character.

Ask the user for the character to use, the height and the width.  
width is between 2 and 60, height is between 2 and 20. Check and ask again if needed.  
Draw as many lines as the height. Use a loop.  
For each line, draw as many characters on a line as the width. You'll need another loop within he first one.  
Example output:

We'll draw an ASCII box using a character and dimensions of your choice.  
Enter a character: @  
Enter the width (2..60): 44  
Enter the height (2..20): 499  
Invalid height  
Enter the height (2..20): 4  
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  
Task 2: Draw a box outline  
Modify the previous program to only draw the box borders.

The contents of the box should be blank.

Example output:

We'll draw an ASCII box using a character and dimensions of your choice.  
Enter a character: +  
Enter the width (2..60): 51  
Enter the height (2..20): 6  
+++++++++++++++++++++++++++++++++++++++++++++++++++

-                                                 +
-                                                 +
-                                                 +
-                                                 +
  +++++++++++++++++++++++++++++++++++++++++++++++++++

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0310-ascii-box-extra">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.print("Choose 1 for a filled box or 2 for an outline: ");
        int style = keyboard.nextInt();
        while (style != 1 && style != 2) {
            System.out.print("Choose 1 or 2: ");
            style = keyboard.nextInt();
        }
        System.out.print("Enter a character: ");
        char boxCharacter = keyboard.next().charAt(0);
        System.out.print("Enter the width (2..60): ");
        int width = keyboard.nextInt();
        while (width < 2 || width > 60) {
            System.out.print("Invalid width. Enter a value from 2 to 60: ");
            width = keyboard.nextInt();
        }
        System.out.print("Enter the height (2..20): ");
        int height = keyboard.nextInt();
        while (height < 2 || height > 20) {
            System.out.print("Invalid height. Enter a value from 2 to 20: ");
            height = keyboard.nextInt();
        }

        for (int row = 0; row < height; row++) {
            for (int column = 0; column < width; column++) {
                boolean border = row == 0 || row == height - 1
                        || column == 0 || column == width - 1;
                if (style == 1 || border) {
                    System.out.print(boxCharacter);
                } else {
                    System.out.print(' ');
                }
            }
            System.out.println();
        }
        keyboard.close();
    }
}
```

</details>

### Ex 03.11 Sequence / EXTRA

Write a program that implements the following behaviour:

How many numbers do you want to print? 5  
What is the starting value? 100  
What is the increment? 50  
100 150 200 250 300

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0311-sequence-extra">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.println("How many numbers do you want to print? ");
        int numbers = keyboard.nextInt();
        System.out.println("What is the starting value? ");
        int startingValue = keyboard.nextInt();
        System.out.println("What is the increment? ");
        int increment = keyboard.nextInt();
        int j = 0;
        for (int i = startingValue; j < numbers; i += increment) {
            System.out.println(i);
            j++;
        }
        keyboard.close();
    }
}
```

</details>

### Ex 03.12 Multiplication table / EXTRA

Print a multiplication table:

multiplication table

Ask the user for a number between 1 and 30. Test the number and ask again if it is not correct.  
Print the multiplication table from 1 up to the given number  
Example run:

Enter a number between 1 and 30: 55  
Invalid number  
Enter a number between 1 and 30: 5  
| 1| 2| 3| 4| 5|  
| 2| 4| 6| 8| 10|  
| 3| 6| 9| 12| 15|  
| 4| 8| 12| 16| 20|  
| 5| 10| 15| 20| 25|  
Hints:

You'll have to print the rows in a loop  
in each row you'll have to print the cells in a loop. You"ll need nested loops  
the cells you print need to be fixed width, but the numbers have varying wdths. You can use the printf statement for this:  
System.out.printf("|%3d", aNumber)  
printf interprets sequences starting with % as placeholder for variables. It will be replaced by the value of the first variable (aNumber).  
%3d will format the value of the variable as a number (d stands for decimal number, an int) wtih a width of 3

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0312-multiplication-table-extra">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        final int MAX_MULT = 30;
        Scanner keyboard = new Scanner(System.in);
        int[][] multTable = new int[MAX_MULT][MAX_MULT];
        for (int i = 0; i < MAX_MULT; i++) {
            for (int j = 0; j < MAX_MULT; j++) {
                multTable[i][j] = (i + 1) * (j + 1);
            }
        }
        System.out.println("Enter a number between 1 and 30:");
        int mult = keyboard.nextInt();
        while (mult < 1 || mult > MAX_MULT) {
            System.out.println("Invalid number");
            mult = keyboard.nextInt();
        }
        for (int i = 0; i < mult; i++) {
            for (int j = 0; j < mult; j++) {
                System.out.printf("|%3d", multTable[i][j]);
            }
            System.out.println();
        }
        keyboard.close();
    }
}
```

</details>

### Ex 03.13 Multiplication table + Quiz / EXTRA

Task 1: print the multiplication tables for a number between 1 and 10  
Example run:

Which multiplication table would you like to see? 7  
1 x 7 = 7  
2 x 7 = 14  
3 x 7 = 21  
4 x 7 = 28  
5 x 7 = 35  
6 x 7 = 42  
7 x 7 = 49  
8 x 7 = 56  
9 x 7 = 63  
10 x 7 = 70  
Task 2: Quiz  
Write a quiz, where the user has to supply the values of a table, one by one. Check the values and repeat a question until you get the right answer.  
Example run:

Which multiplication table would you like to practice? 7  
1 x 7 = 7  
Correct!  
2 x 7 = 12  
Wrong!  
3x7 = ...

... continue to 10, then quit.

Task 3: Quiz + score  
At the end of the quiz, print the number of errors the user made.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0313-multiplication-table-quiz-extra">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        final int MAX_MULTIPLIER = 10;
        System.out.print("Choose 1 to display a table or 2 to practise a quiz: ");
        int mode = keyboard.nextInt();
        while (mode != 1 && mode != 2) {
            System.out.print("Choose 1 or 2: ");
            mode = keyboard.nextInt();
        }
        System.out.print("Which multiplication table (1..10)? ");
        int number = keyboard.nextInt();
        while (number < 1 || number > 10) {
            System.out.print("Enter a number from 1 to 10: ");
            number = keyboard.nextInt();
        }

        int errors = 0;
        for (int multiplier = 1; multiplier <= MAX_MULTIPLIER; multiplier++) {
            int result = multiplier * number;
            if (mode == 1) {
                System.out.printf("%d x %d = %d%n", multiplier, number, result);
            } else {
                int answer;
                do {
                    System.out.printf("%d x %d = ", multiplier, number);
                    answer = keyboard.nextInt();
                    if (answer != result) {
                        errors++;
                        System.out.println("Wrong! Try again.");
                    }
                } while (answer != result);
                System.out.println("Correct!");
            }
        }
        if (mode == 2) {
            System.out.printf("You made %d error(s).%n", errors);
        }
        keyboard.close();
    }
}
```

</details>

### Ex 03.14 ASCII Christmas tree / EXTRA

Write a program to draw a christmas tree using \* and space characters.

When writing the program avoid hard coding values in your program. Define them as constants.

Ask the user for the width of the tree, this should be an uneven number between 13 and 29  
If the numbered entered is not within these boundaries, take the minimum width  
If the number is not uneven make the width one smaller  
Example output  
Enter the width of the Christmas Tree (uneven number between 13 and 29): 23

-

---

---

---

---

---

---

---

---

---

---

---

---

---

---

---

draw the treetop  
start with a line with one star  
each new line has two more stars  
stop drawing lines when the stars fill the entire width  
on each line the number of spaces is the width - the number of stars  
draw half of the spaces  
draw all the stars  
draw the remaining spaces (or draw nothing at all)  
draw the trunk  
the height of the trunk is always 4  
the width of the trunk (number of stars) is always 3

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0314-ascii-christmas-tree-extra">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        final int MIN = 13;
        final int MAX = 29;
        final int TRUNK_HEIGHT = 4;
        final int TRUNK_WIDTH = 3;
        System.out.println("Enter the width of the Christmas Tree (uneven number between 13 and 29):");
        int number = keyboard.nextInt();
        if (number < MIN || number > MAX) {
            System.out.println("Number not within bounds, taking %d instead.".formatted(MIN));
            number = MIN;
        }
        if (number % 2 != 1) {
            number--;
            System.out.println("Number not uneven, taking %d instead.".formatted(number));
        }

        for (int i = 0; i < number / 2 + 1; i++) {
            System.out.println(" ".repeat(number / 2 - i) + "*".repeat(i * 2 + 1));
        }
        for (int i = 0; i < TRUNK_HEIGHT; i++) {
            System.out.println(" ".repeat(number / 2 - 1) + "*".repeat(TRUNK_WIDTH));
        }
        keyboard.close();
    }
}
```

</details>

### Ex 03.15 Functions

Rewrite exercises 03.01Age and/or 03.02 Scrabble using 3 functions:

one function to read the input  
one function to calculate the result (the age category, the score)  
one function to print the result  
Also do this for exercise 03.06 Month in year. Choose for yourself what you think is a good candidate to be written as a separate function.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0315-functions">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.HashMap;
import java.util.Scanner;

public class Main {
    static Scanner keyboard = new Scanner(System.in);

    public static void main(String[] args) {
        String exercise = "age";
        switch (exercise) {
            case "age"://
                age();
                break;
            case "scrabble":
                scrabble();
                break;
            case "months":
                daysInMonth();
                break;
            default:
                break;
        }
        if (exercise == "Age") {
            age();
        } else
            keyboard.close();
    }

    public static void daysInMonth() {
        System.out.println("Enter a month number (1 = January): ");
        int monthNum = readInt();
        System.out.println("Enter a year (4 digits):");
        int yearNum = readInt();

        String[][] months = getMonths(yearNum);
        String[] month = months[monthNum - 1];
        printRes("%s has %s days.".formatted(month[0], month[1]));

    }

    public static String[][] getMonths(int yearNum) {
        return new String[][] {
                { "January", "31" },
                { "February", yearNum % 4 == 0 ? "29" : "28" },
                { "March", "31" },
                { "April", "30" },
                { "May", "31" },
                { "June", "30" },
                { "July", "31" },
                { "August", "31" },
                { "September", "30" },
                { "October", "31" },
                { "November", "30" },
                { "December", "31" } };
    }

    public static void printRes(Object x) {
        System.out.println(x);
    }

    public static int readInt() {
        return keyboard.nextInt();
    }

    public static char readChar() {
        return keyboard.next().toLowerCase().charAt(0);
    }

    public static void scrabble() {
        System.out.println("What letter do you wanna check?");
        char letterToCheck = readChar();
        printRes(scrabbleScore(letterToCheck));
    }

    public static void age() {
        System.out.println("What is your age?");
        int ageYear = readInt();
        printRes(ageCat(ageYear));
    }

    public static String ageCat(int ageYear) {
        if (ageYear < 2) {
            return "Baby";
        } else if (ageYear < 12) {
            return "Child";
        } else if (ageYear < 17) {
            return "Teenager";
        } else {
            return "Adult";
        }
    }

    public static String scrabbleScore(char letterToCheck) {
        HashMap<Character, Integer> scrabble = new HashMap<>();
        String onePoint = "aeilnorst u".replace(" ", "");
        String twoPoints = "dg";
        String threePoints = "bcmp";
        String fourPoints = "fhvwy";
        String fivePoints = "k";
        String eightPoints = "jx";
        String tenPoints = "qz";
        for (char letter : onePoint.toCharArray()) {
            scrabble.put(letter, 1);
        }

        for (char letter : twoPoints.toCharArray()) {
            scrabble.put(letter, 2);
        }

        for (char letter : threePoints.toCharArray()) {
            scrabble.put(letter, 3);
        }

        for (char letter : fourPoints.toCharArray()) {
            scrabble.put(letter, 4);
        }

        for (char letter : fivePoints.toCharArray()) {
            scrabble.put(letter, 5);
        }

        for (char letter : eightPoints.toCharArray()) {
            scrabble.put(letter, 8);
        }

        for (char letter : tenPoints.toCharArray()) {
            scrabble.put(letter, 10);
        }
        if (scrabble.containsKey(letterToCheck)) {
            return "This letter counts for %d points".formatted(scrabble.get(letterToCheck));
        } else {
            return "Not a valid letter";
        }
    }
}
```

</details>

## Week 5

### Ex 05.01 Book (class)

Task 1: Create the `Book` class in the same single Java source file as the test code. Do not create a Java package or a separate `.java` file.

Add these attributes  
author  
title  
pages (number of pages)  
onLoan (true/false)  
Add a constructor with author, title and pages as parameters.  
Hint: if you press ALT+INSERT and choose constructor IntelliJ can help you here  
Add a contructor without parameters. Call the constructor you wrote earlier and set author and title to unknown and the number of pages to 0.  
Add getters and setters for all attributes  
Hint: if you press ALT+INSERT and choose Getter and Setter IntelliJ can help you here  
Add a method toString() that returns a description of the book with title and author in upper case. Example:  
Book JAVA, HOW TO PROGRAM (1186 pages), written by DEITEL & DEITEL is on loan.  
Task 3: Test the Book class  
Add a test class with a main method in the same source file (the supplied example names this driver TestBook01)  
Make some books and print them to the screen. Example output:  
Book JAVA, HOW TO PROGRAM (1186 pages), written by DEITEL & DEITEL is on loan.  
Book WOLF HALL (604 pages), written by HILLARY MANTEL is available.  
Book LEAVE IT TO PSMITH (352 pages), written by P.G. WODEHOUSE is on loan.

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0501-book-class">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class Book {
    private String author;
    private String title;
    private int pages;
    private boolean onLoan = false;
    public Book(String author, String title, int pages) {
        this.author = author;
        this.title = title;
        this.pages = pages;
    }
    public Book() {
        this("unknown", "unknown", 0);
    }

    public String getAuthor() {
        return this.author;
    }

    public String getTitle() {
        return this.title;
    }

    public int getPages() {
        return this.pages;
    }

    public boolean getLoan() {
        return this.onLoan;
    }

    public String setAuthor(String author) {
        this.author = author;
        return this.author;
    }

    public String setTitle(String title) {
        this.title = title;
        return this.title;
    }

    public int setPages(int pages) {
        this.pages = pages;
        return this.pages;
    }

    public boolean setLoan(boolean loan) {
        this.onLoan = loan;
        return this.onLoan;
    }

    public String toString() {
        return "Book %s (%d pages), written by %s is %s".formatted(this.title.toUpperCase(), this.pages,
                this.author.toUpperCase(),
                this.onLoan ? "on loan" : "available ");
    }
}
class TestBook01 {
    public static void main(String[] args) {
        Book book1 = new Book("deitel & deitel", "java, how to program", 1186);
        book1.setLoan(true);
        Book book2 = new Book("hillary mantel", "wolf hall", 604);
        Book book3 = new Book("p.g. wodehouse", "leave it to ppsmith", 352);
        book3.setLoan(true);
        System.out.println(book1.toString());
        System.out.println(book2.toString());
        System.out.println(book3.toString());

    }
}

class Main {
    public static void main(String[] args) {
        TestBook01.main(args);
    }
}
```

</details>

### Ex 05.02 Bank Account (class)

Task 1: Create the BankAccount class  
Create a `BankAccount` class in the same single Java source file as the demo code. Do not use a package declaration or a separate file.  
Add these attributes  
holder(String)  
iban (String)  
balance (double)  
Add a constructor that initializes all attributes  
Add a constructor with only holder and iban. The balance should be 0. Reuse code rather than repeating it.  
Add getters for all attributes  
Add a method deposit(double amount) that adds money to the account  
Add a method withdraw(double amount) that removes money from the account. The withdrawal should be refused if the balance would become negative. Return a boolean indicating whether the withdrawal succeeded.  
Add a toString method to obtain the output below  
Task 2: Test the BankAccount class  
Add this class and run it

public class DemoBankAccount {  
public static void main(String[] args) {  
BankAccount greg = new BankAccount("Gregory Persons", "BE15 6474 3001 5840");  
System.out.println(greg);  
greg.deposit(3000);  
System.out.println(greg);  
if (greg.withdraw(2000)) {  
// withdraw returns true  
System.out.println(greg);  
} else {  
System.out.println("Insufficient credit");  
}  
if (greg.withdraw(1500)) {  
// withdraw returns false  
System.out.println(greg);  
} else {  
System.out.println("Insufficient credit");  
}  
BankAccount carl = new BankAccount("Carl Deleu", "BE45 8477 0157 5478", 35652);  
System.out.println("\n" + carl);  
carl.deposit(6487);  
System.out.println(carl);  
}

}  
Expected output:

The account BE15 6474 3001 5840 of Gregory Persons has a balance of € 0,00  
The account BE15 6474 3001 5840 of Gregory Persons has a balance of € 3000,00  
The account BE15 6474 3001 5840 of Gregory Persons has a balance of € 1000,00  
Insufficient credit

The account BE45 8477 0157 5478 of Carl Deleu has a balance of € 35652,00  
The account BE45 8477 0157 5478 of Carl Deleu has a balance of € 42139,00

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0502-bank-account-class">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class BankAccount {
    private String holder;
    private String iban;
    private double balance;
    public BankAccount(String holder, String iban, double balance) {
        this.holder = holder;
        this.iban = iban;
        this.balance = balance;
    }
    public BankAccount(String holder, String iban) {
        this.holder = holder;
        this.iban = iban;
        this.balance = 0;
    }

    public String getHolder() {
        return this.holder;
    }

    public String getIban() {
        return this.iban;
    }

    public double getBalance() {
        return this.balance;
    }

    public double deposit(double amount) {
        this.balance += amount;
        return this.balance;
    }

    public boolean withdraw(double amount) {
        if (balance >= amount) {
            this.balance -= amount;
            return true;
        } else {
            return false;
        }
    }

    public String toString() {
        return "The account %s of %s has a balance of € %.2f".formatted(this.iban, this.holder, this.balance);
    }
}
class DemoBankAccount {
    public static void main(String[] args) {
        BankAccount greg = new BankAccount("Gregory Persons", "BE15 6474 3001 5840");
        System.out.println(greg);
        greg.deposit(3000);
        System.out.println(greg);
        if (greg.withdraw(2000)) {
            // withdraw returns true
            System.out.println(greg);
        } else {
            System.out.println("Insufficient credit");
        }
        if (greg.withdraw(1500)) {
            // withdraw returns false
            System.out.println(greg);
        } else {
            System.out.println("Insufficient credit");
        }
        BankAccount carl = new BankAccount("Carl Deleu", "BE45 8477 0157 5478", 35652);
        System.out.println("\n" + carl);
        carl.deposit(6487);
        System.out.println(carl);
        System.out.println("Euro: \u20AC");
        System.out.write(0xE2);
        System.out.write(0x82);
        System.out.write(0xAC);
        System.out.flush();
        System.out.println();
    }

}

class Main {
    public static void main(String[] args) {
        DemoBankAccount.main(args);
    }
}
```

</details>

### Ex 05.03 Box (class)

Write a class box with

private attributes  
type (String)  
length (double)  
width (double)  
height (double)  
constructors  
a constructor with parameters for all attributes  
constructor for a cube with parameters type and length  
methods  
surface (calculates total surface)  
volume  
tapeLength (calculates minimum length of tape needed to wrap around the box in one direction)

toString (see expected output)  
Test your class using this code

public class BoxDemo {  
public static void main(String[] args) {  
Box cube = new Box("Cube", 10);  
System.out.println(cube);

Box flat = new Box("Flat box", 30, 30, 3.5);  
System.out.println(flat);

Box parcel = new Box("Parcel Service box", 30.5, 21.5, 17.0);  
System.out.println(parcel);  
}  
}  
Expected output:  
Type: Cube  
Length: 10,0cm  
Width: 10,0cm  
Height: 10,0cm  
Surface: 600,0cm²  
Volume: 1000,0cm³  
Minimum tapelength: 40,0cm

Type: Flat box  
Length: 30,0cm  
Width: 30,0cm  
Height: 3,5cm  
Surface: 2220,0cm²  
Volume: 3150,0cm³  
Minimum tapelength: 67,0cm

Type: Parcel Service box  
Length: 30,5cm  
Width: 21,5cm  
Height: 17,0cm  
Surface: 3079,5cm²  
Volume: 11147,8cm³  
Minimum tapelength: 77,0cm

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0503-box-class">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class Box {
    private String type;
    private double length;
    private double width;
    private double height;
    public Box(String type, double length, double width, double height) {
        this.type = type;
        this.length = length;
        this.width = width;
        this.height = height;
    }
    public Box(String type, double length) {
        this.type = type;
        this.length = length;
        this.width = length;
        this.height = length;
    }

    public double surface() {
        return this.width * this.length * 2 + this.width * this.height * 2 + this.height * this.length * 2;
    }

    public double volume() {
        return this.width * this.length * this.height;
    }

    public double tapeLength() {
        double small = Math.min(this.length, this.height);
        double smaller = Math.min(Math.max(this.length, this.height), this.width);
        return small * 2 + smaller * 2;
    }

    public String toString() {
        return "Type: %s%nLength: %.1fcm%nWidth: %.1fcm%nHeight: %.1fcm%nSurface: %.1fcm²%nVolume: %.1fcm³%nMinimum tapelength: %.1fcm%n"//
                .formatted(this.type, this.length, this.width, this.height, surface(), volume(), tapeLength());
    }
}
class BoxDemo {
    public static void main(String[] args) {
        Box cube = new Box("Cube", 10);
        System.out.println(cube);

        Box flat = new Box("Flat box", 30, 30, 3.5);
        System.out.println(flat);

        Box parcel = new Box("Parcel Service box", 30.5, 21.5, 17.0);
        System.out.println(parcel);
    }
}

class Main {
    public static void main(String[] args) {
        BoxDemo.main(args);
    }
}
```

</details>

### Ex 05.04 Operations (class)

Task 1: write the Operations class  
attributes (remember to define them private!)  
numberOne  
numberTwo  
constructors  
a constructor with parameters for all attributes  
methods  
sum  
difference  
product  
quotient (result should be a double)  
Task 2: write the DemoOperations class  
Make a new class DemoOperations with a main method that:

Asks the user for both numbers  
Prints the result of all operations  
Expected output:  
Please enter the first integer: 236  
Please enter the second integer: 6978  
The sum is 7214  
The difference is -6742  
The product is 1646808  
The quotiënt is 0,03

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0504-operations-class">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Operations {
    private int numberOne;
    private int numberTwo;
    public Operations(int numberOne, int numberTwo) {
        this.numberOne = numberOne;
        this.numberTwo = numberTwo;
    }

    public int sum() {
        return this.numberOne + this.numberTwo;
    }

    public int difference() {
        return this.numberOne - this.numberTwo;
    }

    public int product() {
        return this.numberOne * this.numberTwo;
    }

    public double quotient() {
        return (double) this.numberOne / (double) this.numberTwo;
    }
}
class DemoOperations {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Please enter the first integer: ");
        int firstInt = sc.nextInt();
        sc.nextLine();
        System.out.printf("%nPlease enter the second integer: ");
        int secondInt = sc.nextInt();
        sc.nextLine();
        Operations op = new Operations(firstInt, secondInt);
        System.out.printf("%nThe sum is %d", op.sum());
        System.out.printf("%nThe difference is %d", op.difference());
        System.out.printf("%nThe product is %d", op.product());
        System.out.printf("%nThe quotient is %.2f", op.quotient());
        sc.close();
    }
}

class Main {
    public static void main(String[] args) {
        DemoOperations.main(args);
    }
}
```

</details>

### Ex 05.05 Maximum (constructor/method overloading)

Task 1: write the Maximum class  
private int attributes  
one  
two  
three  
constructors  
empty constructor without parameters  
a constructor with parameters for all attributes  
a constructor with long parameters for all attributes  
a constructor with double parameters for all attributes  
methods  
max: returns biggest attribute as a double  
max with 3 int parameters: returns biggest argument as a double  
max with 3 long parameters: returns biggest argument as a double  
max with 3 double parameters: returns biggest argument as a double  
Task 2: Test your class  
Test using this class

public class TestMaximum {  
public static void main(String[] args) {

Maximum maximum = new Maximum(1, 3, 2);  
System.out.println("maximum = " + maximum.max());

maximum = new Maximum(1L, 2, 3);  
System.out.println("maximum = " + maximum.max());

maximum = new Maximum(3L, 2.0, 1);  
System.out.println("maximum = " + maximum.max());

maximum = new Maximum();  
System.out.println("maximum = " + maximum.max(1, 3, 2));

maximum = new Maximum();  
System.out.println("maximum = " + maximum.max(1, 3, 2L));

maximum = new Maximum();  
System.out.println("maximum = " + maximum.max(1.0, 3, 2));  
}  
}  
Expected output:  
int constructor called  
maximum = 3.0  
long constructor called  
maximum = 3.0  
double constructor called  
maximum = 3.0  
constructor without parameters called  
int parameters method called  
maximum = 3.0  
constructor without parameters called  
long parameters method called  
maximum = 3.0  
constructor without parameters called  
double parameters method called  
maximum = 3.0

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0505-maximum-constructor-method-overloading">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class Maximum {
    private int one;
    private int two;
    private int three;
    public Maximum() {
        System.out.println("constructor without parameters called");
    }
    public Maximum(int one, int two, int three) {
        System.out.println("int constructor called");
        this.one = one;
        this.two = two;
        this.three = three;
    }
    public Maximum(long one, long two, long three) {
        System.out.println("long constructor called");
        this.one = (int) one;
        this.two = (int) two;
        this.three = (int) three;
    }
    public Maximum(double one, double two, double three) {
        System.out.println("double constructor called");
        this.one = (int) one;
        this.two = (int) two;
        this.three = (int) three;
    }

    public double max() {
        return (double) Math.max(Math.max(this.one, this.two), this.three);
    }

    public double max(int one, int two, int three) {
        System.out.println("int parameters method called");
        return (double) Math.max(Math.max(one, two), three);
    }

    public double max(long one, long two, long three) {
        System.out.println("long parameters method called");
        return (double) Math.max(Math.max(one, two), three);
    }

    public double max(double one, double two, double three) {
        System.out.println("double parameters method called");
        return Math.max(Math.max(one, two), three);
    }
}
class TestMaximum {
    public static void main(String[] args) {

        Maximum maximum = new Maximum(1, 3, 2);
        System.out.println("maximum = " + maximum.max());

        maximum = new Maximum(1L, 2, 3);
        System.out.println("maximum = " + maximum.max());

        maximum = new Maximum(3L, 2.0, 1);
        System.out.println("maximum = " + maximum.max());

        maximum = new Maximum();
        System.out.println("maximum = " + maximum.max(1, 3, 2));

        maximum = new Maximum();
        System.out.println("maximum = " + maximum.max(1, 3, 2L));

        maximum = new Maximum();
        System.out.println("maximum = " + maximum.max(1.0, 3, 2));
    }
}

class Main {
    public static void main(String[] args) {
        TestMaximum.main(args);
    }
}
```

</details>

### Ex 05.06 Salesperson (class)

Task 1: write the SalesPerson class  
attributes (private!)  
name  
revenue  
constructors  
a constructor with parameters for all attributes  
methods  
getters for all attributes  
hasMoreRevenueThan(SalesPerson other):boolean  
it returns whether this Salesperson has more revenue than the other  
Task 2: Print the top earner  
Write a class that reads the revenue of 3 salesman and prints the name of the top earner. Complete this test class to obtain the expected output (test for all three salespersons being top earner):

import java.util.Scanner;

public class TestSalesPerson {  
public static void main(String[] args) {

Scanner scanner = new Scanner(System.in);  
String name;  
double revenue ;

name="Jan";  
System.out.printf("Enter %s's revenue: ",name);  
SalesPerson one = new SalesPerson(name, scanner.nextDouble());

name="Laetitia";  
System.out.printf("Enter %s's revenue: ",name);  
SalesPerson two = new SalesPerson(name, scanner.nextDouble());

name="Lotte";  
System.out.printf("Enter %s's revenue: ",name);  
SalesPerson three = new SalesPerson(name, scanner.nextDouble());  
// Compare all three salespeople and print the highest revenue.

}  
}

Expected output:  
Enter Jan's revenue: 885,56  
Enter Laetitia's revenue: 4885,53  
Enter Lotte's revenue: 78965,3  
Our top earner is Lotte!

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0506-salesperson-class">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class SalesPerson {
    private final String name;
    private final double revenue;

    public SalesPerson(String name, double revenue) {
        this.name = name;
        this.revenue = revenue;
    }

    public String getName() {
        return name;
    }

    public double getRevenue() {
        return revenue;
    }

    public boolean hasMoreRevenueThan(SalesPerson other) {
        return revenue > other.getRevenue();
    }
}

class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        SalesPerson[] salesPeople = new SalesPerson[3];
        String[] names = {"Jan", "Laetitia", "Lotte"};
        for (int i = 0; i < salesPeople.length; i++) {
            System.out.printf("Enter %s's revenue: ", names[i]);
            salesPeople[i] = new SalesPerson(names[i], scanner.nextDouble());
        }

        SalesPerson topEarner = salesPeople[0];
        for (int i = 1; i < salesPeople.length; i++) {
            if (salesPeople[i].hasMoreRevenueThan(topEarner)) {
                topEarner = salesPeople[i];
            }
        }
        System.out.printf("Our top earner is %s!%n", topEarner.getName());
        scanner.close();
    }
}
```

</details>

### Ex 05.07 Circle (data validation)

Task 1: write the Circle class  
attributes (private!)  
radius (int)  
colour (String, default "Black")  
constructors  
a constructor with parameters for all attributes  
a constructor with only radius as parameter  
methods  
circumference //  
surface //  
deltaCircumference(Circle other) : give the absolute difference in circumference between this circle and the other  
deltaSurface(Circle other) : gives difference in circumference between this circle and the other  
extra  
a Circle may not accept a radius less than 10, nor greater than 1000, nor via the constructor, nor via the setter  
If passed an invalid value, print an error message to inform the user that the value is invalid  
-->Hint: see slides about Validating Constructor/Setter  
add a toString() method that prints out the state of the Circle object

Task 2: Test the class  
Use this class to test the class you wrote

public class CircleApp {  
public static void main(String[] args) {  
Circle tooSmall = new Circle(5);  
System.out.println(tooSmall);

Circle tooBig = new Circle(1200);  
System.out.println(tooBig);

Circle small = new Circle(10, "Red");  
System.out.println(small);

Circle big = new Circle(200, "Blue");  
System.out.println(big);

System.out.printf("Difference in circumference (%s - %s): %.2f%n", big.getColour(), small.getColour(), big.deltaCircumference(small));  
System.out.printf("Difference in surface (%s - %s): %.2f%n", big.getColour(), small.getColour(), big.deltaSurface(small));  
} // main()  
} // class

Expected output  
Invalid radius 5  
Colour:Black Radius:0 Circumference:0,00 Surface: 0,00  
Invalid radius 1200  
Colour:Black Radius:0 Circumference:0,00 Surface: 0,00  
Colour:Red Radius:10 Circumference:62,83 Surface: 314,16  
Colour:Blue Radius:200 Circumference:1256,64 Surface: 125663,71  
Difference in circumference (Blue - Red): 1193,81  
Difference in surface (Blue - Red): 125349,55

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0507-circle-data-validation">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class Circle {
    private int radius;
    private String colour = "Black";
    public Circle(int radius, String colour) {
        setRadius(radius);
        this.colour = colour;
    }
    public Circle(int radius) {
        setRadius(radius);
    }

    public void setRadius(int radius) {
        if (radius < 10 || radius > 1000) {
            System.out.println("Invalid radius " + radius);
        } else {
            this.radius = radius;
        }
    }

    public String getColour() {
        return this.colour;
    }

    public double circumference() {
        return 2 * Math.PI * radius;
    }

    public double surface() {
        return Math.PI * Math.pow(radius, 2);
    }

    public double deltaCircumference(Circle other) {
        return Math.abs(circumference() - other.circumference());
    }

    public double deltaSurface(Circle other) {
        return Math.abs(surface() - other.surface());
    }

    public String toString() {
        return "Colour:%-10sRadius:%-7dCircumference:%-12.2fSurface: %-10.2f".formatted(this.colour,
                this.radius, circumference(), surface());
    }

}
class CircleApp {
    public static void main(String[] args) {
        Circle tooSmall = new Circle(5);
        System.out.println(tooSmall);

        Circle tooBig = new Circle(1200);
        System.out.println(tooBig);

        Circle small = new Circle(10, "Red");
        System.out.println(small);

        Circle big = new Circle(200, "Blue");
        System.out.println(big);

        System.out.printf("Difference in circumference (%s - %s): %.2f%n", big.getColour(), small.getColour(),
                big.deltaCircumference(small));
        System.out.printf("Difference in surface (%s - %s): %.2f%n", big.getColour(), small.getColour(),
                big.deltaSurface(small));
    } // main()
} // class

class Main {
    public static void main(String[] args) {
        CircleApp.main(args);
    }
}
```

</details>

### Ex 05.08 Perfect number / EXTRA

Introduction: What is a perfect number?  
A number is a perfect number if the sum of all its divisors (including 1, excluding the number itself) is equal to the number itself.  
Example: 6 is a perfect number because 6=1+2+3. More info on wikipedia.

Task 1: Write the PerfectNumber class  
Write a class PerfectNumber  
The class only contains one method: String getPerfect(int number)  
If the number is a perfect number, the class should return a String with all its divisors. Otherwise the method should return null. Use a Stringbuilder to make the string to be returned.  
Task 2: Test your class  
Make a class TestPerfectNumber with a main method.  
In the main method make a PerfectNumber object  
Examine all numbers between 2 and 10000. If a number is a perfect number, print out the number and its divisors.  
Expected output  
6 --> 1 2 3  
28 --> 1 2 4 7 14  
496 --> 1 2 4 8 16 31 62 124 248  
8128 --> 1 2 4 8 16 32 64 127 254 508 1016 2032 4064

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0508-perfect-number-extra">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
public class PerfectNumber {
    public String getPerfect(int number) {
        int sum = 0;
        StringBuilder perfect = new StringBuilder();
        for (int i = 1; i < number; i++) {
            if (number % i == 0) {
                sum += i;
                perfect.append(i);
                perfect.append(" ");
            }
        }
        if (sum == number) {
            return perfect.toString();
        } else {
            return null;
        }
    }
}
class TestPerfectNumber {
    public static void main(String[] args) {
        PerfectNumber perfect = new PerfectNumber();

        for (int number = 2; number <= 10000; number++) {
            String divisors = perfect.getPerfect(number);
            if (divisors != null) {
                System.out.println(number + " --> " + divisors);
            }
        }
    }
}

class Main {
    public static void main(String[] args) {
        TestPerfectNumber.main(args);
    }
}
```

</details>

### Ex 05.09 For experienced programmers: Word Hut Game / Extra

Challenge  
A word is chosen and each player writes it on a note. In turn, the players draw a letter (from a pocket with the 26 letters from the alphabet). When the drawn letter appears in his word, the player may delete this letter (if a letter is present multiple times in the word, delete it only once!).

If the letter (or all the same letters) has already been deleted, the player's left neighbor may delete this letter on his note. If all the same letters have already been deleted from this neighbor, the player must add the letter back to his note.

The person whose letters were all deleted first wins the game.

Play against the computer –so only 2 players-

Coding tips  
After entering the word, create a StringBuilder object for each player. Delete and add in this item.  
Create, among others, the following classes:  
LetterBag (methods: newLetter –randomly generated letter-)  
Note (attributes: theWord -StringBuilder-) (methods: constructor (with as parameter initialWord), letterInWord, deleteLetter, addLetter, allLettersDeleted, toString)  
Player (attributes: note)  
Extension  
For each player, count

how many times he has deleted a letter (via his note-object)  
how many times he has deleted a letter thanks to his neighbor  
how many times he has had to write a letter  
how many times he has drawn a letter than did not appear in the word.

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0509-for-experienced-programmers-word-hut-game-extra">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Random;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        boolean playAgain;
        do {
            String word;
            do {
                System.out.print("Enter a word containing at least one letter: ");
                word = keyboard.nextLine().trim().toLowerCase().replaceAll("[^a-z]", "");
            } while (word.isEmpty());

            LetterBag letterBag = new LetterBag();
            Player human = new Player(word, "You");
            Player computer = new Player(word, "The computer");
            Player[] players = {human, computer};
            int currentPlayer = 0;
            int turns = 0;

            while (!human.note.isEmpty() && !computer.note.isEmpty()) {
                Player current = players[currentPlayer];
                Player neighbor = players[1 - currentPlayer];
                char letter = letterBag.newLetter();
                turns++;
                System.out.printf("%s draws '%c'. Your note: %s | Computer's note: %s%n",
                        current.name, letter, human.note, computer.note);

                if (current.note.contains(letter)) {
                    current.note.deleteOne(letter, false);
                    System.out.printf("%s deletes one '%c' from their own note.%n", current.name, letter);
                } else if (neighbor.note.contains(letter)) {
                    neighbor.note.deleteOne(letter, true);
                    current.note.notInOwnNote++;
                    System.out.printf("%s has no '%c'; the other player deletes one.%n", current.name, letter);
                } else {
                    current.note.add(letter);
                    current.note.notInOwnNote++;
                    System.out.printf("Neither note contains '%c'; %s adds it.%n", letter, current.name);
                }

                currentPlayer = 1 - currentPlayer;
                System.out.println("Press Enter to continue.");
                keyboard.nextLine();
            }

            Player winner = human.note.isEmpty() ? human : computer;
            System.out.printf("%s wins after %d turns!%n", winner.name, turns);
            System.out.println("\nStatistics:");
            System.out.println(human.name + ":\n" + human.note.statistics());
            System.out.println(computer.name + ":\n" + computer.note.statistics());

            System.out.print("Do you want to play again? (y/n): ");
            playAgain = keyboard.nextLine().equalsIgnoreCase("y");
        } while (playAgain);
        keyboard.close();
    }
}

class LetterBag {
    private final char[] letters = new char[26];
    private final Random random = new Random();
    private int nextIndex = 26;

    char newLetter() {
        if (nextIndex == letters.length) {
            refillAndShuffle();
        }
        return letters[nextIndex++];
    }

    private void refillAndShuffle() {
        for (int i = 0; i < letters.length; i++) {
            letters[i] = (char) ('a' + i);
        }
        for (int i = letters.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temporary = letters[i];
            letters[i] = letters[j];
            letters[j] = temporary;
        }
        nextIndex = 0;
    }
}

class Note {
    private final StringBuilder word;
    int deletedFromOwnNote;
    int deletedWithNeighborHelp;
    int lettersAdded;
    int notInOwnNote;

    Note(String initialWord) {
        word = new StringBuilder(initialWord);
    }

    boolean contains(char letter) {
        return word.indexOf(String.valueOf(letter)) >= 0;
    }

    void deleteOne(char letter, boolean withNeighborHelp) {
        int index = word.indexOf(String.valueOf(letter));
        if (index < 0) {
            throw new IllegalArgumentException("The letter is not in this note.");
        }
        word.deleteCharAt(index);
        if (withNeighborHelp) {
            deletedWithNeighborHelp++;
        } else {
            deletedFromOwnNote++;
        }
    }

    void add(char letter) {
        word.append(letter);
        lettersAdded++;
    }

    boolean isEmpty() {
        return word.length() == 0;
    }

    String statistics() {
        return "Deleted from own note: " + deletedFromOwnNote
                + "\nDeleted with neighbor's help: " + deletedWithNeighborHelp
                + "\nLetters added: " + lettersAdded
                + "\nDraws absent from own note: " + notInOwnNote;
    }

    @Override
    public String toString() {
        return word.toString();
    }
}

class Player {
    final Note note;
    final String name;

    Player(String word, String name) {
        note = new Note(word);
        this.name = name;
    }
}
```

</details>

## Week 6

### Ex 06.01 Chess club

Chess club (old Exam Question)  
A hobbyist chess club wants to make their own custom simulation program to simulate their various members playing against each other. You will complete a basic prototype that will do just that.

The `Main` class contains a main method with the supplied test code. Keep `Main` and the `Player` class in the same Java source file, with no package declaration. Uncommenting this code will cause several errors as the “Player” class does not exist. Create the `Player` class in that same source file and complete it so the main runs as it is supposed to.

The Player class contains four properties  
Their name in text; it can not be empty.  
Their birth year as a whole number; it can not be in the future or more than 120 years ago.  
You may make a constant CURRENT_YEAR to store the current year in the class Player.  
Their win ratio as a fractional number between 0 and 1 (for example 0.64).  
A toggle which indicates whether the player is retired from the game or not.  
When a Player object is created, all properties should be passed along  
Make sure that the properties are assigned the proper way and no invalid data can be entered.  
Make sure the checks on the data are done in the appropriate method  
When printing a Player, the result should look like this:  
Sebastiaan (31: Winratio: 0.5 active.)  
Wim (61: Winratio: 0.73 active.)  
Retiree (99: Winratio: 0.43 retired.)  
Implement this in the appropriate place  
The play method is the method which will be used to simulate the games. It has two modes, implement them correctly.  
The first is simply calling play on a single Player. In this method, generate a random number between 0 and 1 and compare it to the win ratio of the Player. If the generated number is higher, the player loses, if it’s lower, the player wins.  
The second is calling play on a Player with a different Player as a parameter. In this implementation, generate two random numbers and subtract the first number from the first player’s win ratio and the second number from the second player’s win ratio. The number with the highest resulting number wins.  
For more tips on what the play method should return, closely look at the main and what result is expected of the method.  
Your final result upon executing the code could look like this:

Invalid age!  
Invalid winratio!  
Sebastiaan (1993: Winratio: 0.5 active.) win? true  
Wim (1963: Winratio: 0.73 active.) win? true  
Sebastiaan (1993: Winratio: 0.5 active.) wins!

Note that as we are using random numbers, your wins and losses could be different.

Main.java:

public class Main {

public static void main(String[] args) {

//TODO make the player class and make the code below function as instructed.

//TODO Uncomment the code below to test your solution. Do NOT change any code here beyond uncommenting it.

/\*

//Negative age should not be allowed!

Player player1 = new Player("Sebastiaan", 2993, 0.5f, false);

//Fixing negative age

player1.setAge(1993);

//Win ratio should not be higher than 1!

Player player2 = new Player("Wim", 1963, 75, false);

//Fixing win ratio

player2.setWinRatio(0.73f);

System.out.println(player1 + " win? " + player1.play());

System.out.println(player2 + " win? " + player2.play());

if(player1.play(player2)){

System.out.println(player1 + " wins!");

} else {

System.out.println(player2 + " wins!");

}

\*/

}

}

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0601-chess-club">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.time.LocalDate;
import java.util.Random;

class Main {

    public static void main(String[] args) {

        // The Player class below implements the required validation and play methods.

        // Test the Player class using the supplied examples.

        // Negative age should not be allowed!

        Player player1 = new Player("Sebastiaan", 2993, 0.5f, false);

        // Fixing negative age

        player1.setAge(1993);

        // Win ratio should not be higher than 1!

        Player player2 = new Player("Wim", 1963, 75, false);

        // Fixing win ratio

        player2.setWinRatio(0.73f);

        System.out.println(player1 + " win? " + player1.play());

        System.out.println(player2 + " win? " + player2.play());

        if (player1.play(player2)) {

            System.out.println(player1 + " wins!");

        } else {

            System.out.println(player2 + " wins!");

        }

    }

}
public class Player {
    private String name;
    private int birthDate;
    private float winRatio;
    private boolean retired = false;
    final private int CURRENT_YEAR = LocalDate.now().getYear();
    public Player(String name, int birthDate, float winRatio, boolean retired) {
        setName(name);
        setAge(birthDate);
        setWinRatio(winRatio);
        this.retired = retired;
    }

    public float getWinRatio() {
        return this.winRatio;
    }

    public void setName(String name) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        } else {
            System.out.println("Invalid name!");
            this.name = "Unknown";
        }
    }

    public void setAge(int birthDate) {
        if (birthDate < CURRENT_YEAR && birthDate >= CURRENT_YEAR - 120) {
            this.birthDate = birthDate;
        } else {
            System.out.println("Invalid age!");
        }
    }

    public void setWinRatio(float winRatio) {
        if (winRatio >= 0 && winRatio <= 1) {
            this.winRatio = winRatio;
        } else {
            System.out.println("Invalid winratio!");
        }
    }

    public boolean play() {
        Random rand = new Random();
        if (rand.nextFloat(1) > this.winRatio) {
            return false;
        } else {
            return true;
        }
    }

    public boolean play(Player player) {
        Random rand = new Random();
        float firstNum = rand.nextFloat(1);
        float secondNum = rand.nextFloat(1);
        if (this.winRatio - firstNum > player.getWinRatio() - secondNum) {
            return true;
        } else {
            return false;
        }
    }

    public String toString() {
        return "%s (%d: Winratio: %.2f %s)".formatted(name, birthDate, winRatio,
                retired ? "retired" : "active");
    }
}
```

</details>

### Ex 06.02 Student Grade Evaluator

You are writing a simple Student Grade Evaluator for a teacher. The teacher wants to enter student data, calculate whether they have passed, and see a performance category (Excellent, Good, Satisfactory, or Unsatisfactory). The program processes one student at a time until the teacher decides to stop.

A. Make a `Student` class in the same single Java source file as `Main` (no package declaration or separate `.java` files).

Attributes:

"name" als text. This must not be empty and must contain at least 1 space  
"id" as an integer. This must not be negative.  
"grade" as a decimal number. This must be between 0 and 100.  
Methods:

Constructor that initializes all attributes.  
Getters and setters for each attribute.  
The method isCorrect() that checks whether all values are correct and displays an error message if they are not. This method returns a boolean indicating whether the values are correct.  
The method getPerformanceCategory() that returns the following:  
(Use a lambda switch statement for this. Tip: divide the” grade” by 10 and cast to an int to easily determine the categories..)  
"Excellent" if value ≥ 90  
"Good" if value ≥ 75  
"Sufficient " if value ≥ 50  
"Insufficient " in all other cases

B. Make the `Main` class containing the `main()` method in that same source file.

In the main()-method:

Create a Scanner object for user input.  
Use a do-while-loop for repeatedly:  
Ask for the student's name, ID, and grade.  
Create a Student object with these values.  
If the values are not correct, the data must be requested again (until they are correct).  
Display the student's information and performance category.  
Ask the user:"Do you want to enter another student? (yes/no)"  
Continue as long as the answer is "yes".  
In this loop, you use a for-loop that counts down from 3 to 1 before the results are displayed ("3...2...1... results!"). When the user enters 'no', display a farewell message.

Output example:

Enter the student's name: Alice  
Enter the student’s ID: 101  
Enter the student's grade (0–100): 95

Error! The name must contain at least 1 space!

Enter the student's name: Alice Verberckmoes  
Enter the student's ID: 101  
Enter the student's grade (0–100): 95

Calculating results...  
3  
2  
1

Results!

---

Student information

---

Name : Alice Verberckmoes  
ID : 101  
Grade : 95.0  
Performance : Excellent

---

Do you want to enter another student? (yes/no): yes

Enter the student's name: Bob Lowen  
Enter the student's ID: 102  
Enter the student's grade (0–100): 63

Calculating results...  
3  
2  
1

Results!

---

Student information

---

Name : Bob Lowen  
ID : 102  
Grade : 63.0  
Performance : Sufficent

---

Do you want to enter another student? (yes/no): no

Program terminated. Goodbye!

**Single-file requirement:** Keep every class needed for this exercise in this one Java source file. Do not create separate Java files or declare a Java package.

**Browser implementation:** Submit one Java source file only. If multiple classes are required, declare them consecutively in that same file; do not create separate files or use a package declaration.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-0602-student-grade-evaluator">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        String playAgain = "yes";
        while (playAgain.equals("yes")) {
            boolean askAgain = true;
            do {
                System.out.printf("%nEnter the student's name: ");
                String name = sc.nextLine();
                System.out.printf("%nEnter the student's ID: ");
                int id = sc.nextInt();
                System.out.printf("%nEnter the student's grade (0–100): ");
                float grade = sc.nextFloat();
                sc.nextLine();
                Student student = new Student(name, id, grade);
                askAgain = !student.isCorrect();
                if (!askAgain) {
                    System.out.println("\nCalculating results...");
                    for (int i = 3; i > 0; i--) {
                        System.out.println(i);
                    }
                    System.out.printf("%n%s", student);
                }
            } while (askAgain);
            System.out.printf("%nDo you want to enter another student? (yes/no): ");
            playAgain = sc.nextLine().strip();
        }
        System.out.println("\nProgram terminated. Goodbye!");
        sc.close();
    }
}
public class Student {
    private String name = "";
    private int id = -1;
    private float grade = -1f;
    public Student(String name, int id, float grade) {
        setName(name);
        setId(id);
        setGrade(grade);
    }

    public void setName(String name) {
        if (name.indexOf(" ") == -1 || name.length() == 0) {
            System.out.println("Error! The name must contain at least 1 space!");
        } else {
            this.name = name;
        }
    }

    public void setId(int id) {
        if (id >= 0) {
            this.id = id;
        } else {
            System.out.println("Error! The id must not be negative!");
        }
    }

    public void setGrade(float grade) {
        if (grade >= 0 && grade <= 100) {
            this.grade = grade;
        } else {
            System.out.println("Error! The grade must be between 0 and 100");
        }
    }

    public String getName() {
        return this.name;
    }

    public int getId() {
        return this.id;
    }

    public float getGrade() {
        return this.grade;
    }

    public boolean isCorrect() {
        if (name.indexOf(" ") == -1 || name.length() == 0 || id < 0 || grade < 0 || grade > 100) {
            return false;
        } else {
            return true;
        }
    }

    public String getPerformanceCategory() {
        int value = (int) (grade / 10);
        return switch (value) {
            case 9, 10 -> "Excellent";
            case 7, 8 -> "Good";
            case 5, 6 -> "Sufficient";
            default -> "Insufficient";
        };

    }

    public String toString() {
        return String.format(
                "\nResults\n" +
                        "------------------------------------\n" +
                        "Student information\n" +
                        "------------------------------------\n" +
                        "%-16s: %s\n" +
                        "%-16s: %d\n" +
                        "%-16s: %.1f\n" +
                        "%-16s: %s\n" +
                        "------------------------------------",
                "Name", this.getName(),
                "ID", this.getId(),
                "Grade", this.getGrade(),
                "Performance", this.getPerformanceCategory());

    }

}
```

</details>
