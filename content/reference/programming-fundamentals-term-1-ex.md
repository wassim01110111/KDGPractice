# Programming Fundamentals — Term 1

## Table of contents

- [Programming Fundamentals — Term 1](#programming-fundamentals--term-1)
  - [Table of contents](#table-of-contents)
  - [Week 1](#week-1)
    - [Ex 01.03 Sum](#ex-0103-sum)
    - [Ex 01.04 Welcome (read text))](#ex-0104-welcome-read-text)
    - [Ex 01.05 Product (read int)](#ex-0105-product-read-int)
    - [Ex 01.06 Age (LocalDate)](#ex-0106-age-localdate)
    - [Ex 01.07 BMI v1 (read double)](#ex-0107-bmi-v1-read-double)
    - [Ex 01.08 BMIv2 (if)](#ex-0108-bmiv2-if)
    - [Ex 01.09 Between (if) / EXTRA](#ex-0109-between-if--extra)
    - [Ex 01.10 Calculate (if)](#ex-0110-calculate-if)
  - [Week 2](#week-2)
    - [Ex 02.01 Variables](#ex-0201-variables)
    - [Ex 02.02 numbers v1](#ex-0202-numbers-v1)
    - [Ex 02.03 Taxes](#ex-0203-taxes)
    - [Ex 02.04 Numbers V2](#ex-0204-numbers-v2)
    - [Ex 02.05 Numbers V3](#ex-0205-numbers-v3)
    - [Ex 02.06 ASCII table](#ex-0206-ascii-table)
    - [Ex 02.07 Digits v1](#ex-0207-digits-v1)
    - [Ex 02.08 Digits v2](#ex-0208-digits-v2)
    - [Ex 02.09 Fuel consumption](#ex-0209-fuel-consumption)
    - [Ex 02.10 Switches](#ex-0210-switches)
    - [Ex 02.11 Scramble name /EXTRA](#ex-0211-scramble-name-extra)
    - [Ex 02.12 Investment](#ex-0212-investment)
  - [Week 3](#week-3)
    - [Ex 01.08 HigherLower (variable)](#ex-0108-higherlower-variable)
    - [Ex 03.01 Age (if)](#ex-0301-age-if)
    - [Ex 03.02 Scrabble (switch)](#ex-0302-scrabble-switch)
    - [Ex 03.03 Loops (while/for)](#ex-0303-loops-whilefor)
    - [Ex 03.04 Multiples (while)](#ex-0304-multiples-while)
    - [Ex 03.05 Factorial (for)](#ex-0305-factorial-for)
    - [Ex 03.06 Days in month (switch/conditional operator)](#ex-0306-days-in-month-switchconditional-operator)
    - [Ex 03.07 Hexadecimal (for)](#ex-0307-hexadecimal-for)
    - [Ex 03.08 Divisible (loops/nested if)](#ex-0308-divisible-loopsnested-if)
    - [Ex 03.09 Interest / EXTRA](#ex-0309-interest--extra)
    - [Ex 03.10 ASCII box / EXTRA](#ex-0310-ascii-box--extra)
    - [Ex 03.11 Sequence / EXTRA](#ex-0311-sequence--extra)
    - [Ex 03.12 Multiplication table / EXTRA](#ex-0312-multiplication-table--extra)
    - [Ex 03.13 Multiplication table + Quiz / EXTRA](#ex-0313-multiplication-table--quiz--extra)
    - [Ex 03.14 ASCII Christmas tree / EXTRA](#ex-0314-ascii-christmas-tree--extra)
    - [Ex 03.15 Functions](#ex-0315-functions)
  - [Week 5](#week-5)
    - [Ex 05.01 Book (class)](#ex-0501-book-class)
    - [Ex 05.02 Bank Account (class)](#ex-0502-bank-account-class)
    - [Ex 05.03 Box (class)](#ex-0503-box-class)
    - [Ex 05.04 Operations (class)](#ex-0504-operations-class)
    - [Ex 05.05 Maximum (constructor/method overloading)](#ex-0505-maximum-constructormethod-overloading)
    - [Ex 05.06 Salesperson (class)](#ex-0506-salesperson-class)
    - [Ex 05.07 Circle (data validation)](#ex-0507-circle-data-validation)
    - [Ex 05.08 Perfect number / EXTRA](#ex-0508-perfect-number--extra)
    - [Ex 05.09 For experienced programmers: Word Hut Game / Extra](#ex-0509-for-experienced-programmers-word-hut-game--extra)
  - [Week 6](#week-6)
    - [Ex 06.01 Chess club](#ex-0601-chess-club)
    - [Ex 06.02 Student Grade Evaluator](#ex-0602-student-grade-evaluator)

## Week 1

### [Ex 01.03 Sum](https://canvas.kdg.be/courses/62612/modules/items/1495527)

<details>
<summary>***Show solution***</summary>

**Sum03.java**

```java
public class Sum03 {

}
```

</details>

### [Ex 01.04 Welcome (read text))](https://canvas.kdg.be/courses/62612/modules/items/1495528)

<details>
<summary>***Show solution***</summary>

**Welcome04.java**

```java
import java.util.Scanner;

public class Welcome04 {
    public static void main() {
        Scanner keyboard = new Scanner(System.in);
        System.out.print("What is your name? ");
        String firstName = keyboard.nextLine();
        System.out.print("\nWelcome " + firstName + "!");
        keyboard.close();

    }
}
```

</details>

### [Ex 01.05 Product (read int)](https://canvas.kdg.be/courses/62612/modules/items/1495529)

<details>
<summary>***Show solution***</summary>

**Product05.java**

```java
import java.util.Scanner;

public class Product05 {
    public static void main() {
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

### [Ex 01.06 Age (LocalDate)](https://canvas.kdg.be/courses/62612/modules/items/1495530)

<details>
<summary>***Show solution***</summary>

**Age06.java**

```java
import java.time.LocalDate;
import java.util.Scanner;

public class Age06 {
    public static void main() {
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

### [Ex 01.07 BMI v1 (read double)](https://canvas.kdg.be/courses/62612/modules/items/1495531)

<details>
<summary>***Show solution***</summary>

**BMI07.java**

```java
import java.util.Scanner;

public class BMI07 {
    public static void main() {
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

### [Ex 01.08 BMIv2 (if)](https://canvas.kdg.be/courses/62612/modules/items/1495532)

<details>
<summary>***Show solution***</summary>

**BMI08.java**

```java
import java.util.Scanner;

public class BMI08 {
    public static void main() {
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

### [Ex 01.09 Between (if) / EXTRA](https://canvas.kdg.be/courses/62612/modules/items/1495533)

<details>
<summary>***Show solution***</summary>

**Between09.java**

```java
import java.util.Scanner;

public class Between09 {
    public static void main() {
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

### [Ex 01.10 Calculate (if)](https://canvas.kdg.be/courses/62612/modules/items/1495534)

<details>
<summary>***Show solution***</summary>

**Calculate10.java**

```java
import java.util.Scanner;

public class Calculate10 {
    public static void main() {
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

### [Ex 02.01 Variables](https://canvas.kdg.be/courses/62612/modules/items/1495541)

<details>
<summary>***Show solution***</summary>

**Variables01.java**

```java
public class Variables01 {
    public static void main() {
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

### [Ex 02.02 numbers v1](https://canvas.kdg.be/courses/62612/modules/items/1495542)

<details>
<summary>***Show solution***</summary>

**Numbers02.java**

```java
public class Numbers02 {
    public static void main() {
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
        result = first++; // increments after assigning the variable
        System.out.println("first++:" + result);
        first = 8;
        result = ++first; // increments before assigning the variable
        System.out.println("++first:" + result);
        result = second--; // decrements after assigning the variable
        System.out.println("second--:" + result);
        second = 5;
        result = --second; // decrements before assigning the variable
        System.out.println("--second:" + result);

    }
}
```

</details>

### [Ex 02.03 Taxes](https://canvas.kdg.be/courses/62612/modules/items/1495543)

<details>
<summary>***Show solution***</summary>

**Taxes03.java**

```java
import java.util.Scanner;

public class Taxes03 {
    public static void main() {
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

### [Ex 02.04 Numbers V2](https://canvas.kdg.be/courses/62612/modules/items/1495544)

<details>
<summary>***Show solution***</summary>

**Numbers04.java**

```java
import java.util.Scanner;

public class Numbers04 {
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
                long res = (firstNum * secondNum) % 100000;
                System.out.println("The 5 final digits are: " + res);
            }
        }
        keyboard.close();
    }
}
```

</details>

### [Ex 02.05 Numbers V3](https://canvas.kdg.be/courses/62612/modules/items/1495545)

<details>
<summary>***Show solution***</summary>

**Numbers05.java**

```java
import java.util.Scanner;

public class Numbers05 {
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

### [Ex 02.06 ASCII table](https://canvas.kdg.be/courses/62612/modules/items/1495546)

<details>
<summary>***Show solution***</summary>

**Numbers06.java**

```java
import java.util.Scanner;

public class Numbers06 {
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

### [Ex 02.07 Digits v1](https://canvas.kdg.be/courses/62612/modules/items/1495547)

<details>
<summary>***Show solution***</summary>

**Digits07.java**

```java
import java.util.Scanner;

public class Digits07 {
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

### [Ex 02.08 Digits v2](https://canvas.kdg.be/courses/62612/modules/items/1495548)

<details>
<summary>***Show solution***</summary>

**Digits08.java**

```java
import java.util.Scanner;

public class Digits08 {
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

### [Ex 02.09 Fuel consumption](https://canvas.kdg.be/courses/62612/modules/items/1495549)

<details>
<summary>***Show solution***</summary>

**FuelConsumption09.java**

```java
import java.util.Scanner;

public class FuelConsumption09 {
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

### [Ex 02.10 Switches](https://canvas.kdg.be/courses/62612/modules/items/1495550)

<details>
<summary>***Show solution***</summary>

**Switches10.java**

```java
import java.util.Scanner;

public class Switches10 {
    public static void main(String[] args) {
        final Scanner keyboard = new Scanner(System.in);
        int switches = 0;

        for (int i = 0; i < 3; i++) {
            System.out.println("Enter the state of switch %d (true or false): ".formatted(i + 1));
            if (keyboard.nextBoolean()) {
                switches++;
            }
        }
        if (switches <= 1) {
            System.out.println("At most one switch is turned on.");
        }
        if (switches >= 2) {
            System.out.println("At least two switches are turned on.");
        }
        if (switches == 2) {
            System.out.println("Exactly two switches are turned on.");
        }
        keyboard.close();
    }
}
```

</details>

### [Ex 02.11 Scramble name /EXTRA](https://canvas.kdg.be/courses/62612/modules/items/1495551)

<details>
<summary>***Show solution***</summary>

**ScrambleName11.java**

```java
import java.util.Random;
import java.util.Scanner;

public class ScrambleName11 {
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

### [Ex 02.12 Investment](https://canvas.kdg.be/courses/62612/modules/items/1529644)

<details>
<summary>***Show solution***</summary>

**Investment12.java**

```java

import java.util.Scanner;

public class Investment12 {
    static void main(String[] args) {
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

### [Ex 01.08 HigherLower (variable)](https://canvas.kdg.be/courses/62612/modules/items/1495562)

<details>
<summary>***Show solution***</summary>

**HigherLower0108.java**

```java
package W3;

import java.util.Scanner;

public class HigherLower0108 {
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

### [Ex 03.01 Age (if)](https://canvas.kdg.be/courses/62612/modules/items/1495569)

<details>
<summary>***Show solution***</summary>

**Age01.java**

```java
package W3;

import java.util.Scanner;

public class Age01 {
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

### [Ex 03.02 Scrabble (switch)](https://canvas.kdg.be/courses/62612/modules/items/1495570)

<details>
<summary>***Show solution***</summary>

**Scrabble02.java**

```java
package W3;

import java.util.HashMap;
import java.util.Scanner;

public class Scrabble02 {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        HashMap<Character, Integer> scrabble = new HashMap<>();
        String onePoint = "aeiolnstr";
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

### [Ex 03.03 Loops (while/for)](https://canvas.kdg.be/courses/62612/modules/items/1495571)

<details>
<summary>***Show solution***</summary>

**Loops03.java**

```java
package W3;

public class Loops03 {
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

### [Ex 03.04 Multiples (while)](https://canvas.kdg.be/courses/62612/modules/items/1495572)

<details>
<summary>***Show solution***</summary>

**Multiples04.java**

```java
package W3;

import java.util.Scanner;

public class Multiples04 {
    public static void main(String[] args) {
        final int MAX = 100;
        Scanner keyboard = new Scanner(System.in);
        int inputNumber = keyboard.nextInt();
        for (int i = 1; inputNumber * i < MAX; i++) {
            System.out.println(inputNumber * i);
        }
        keyboard.close();
    }
}
```

</details>

### [Ex 03.05 Factorial (for)](https://canvas.kdg.be/courses/62612/modules/items/1495573)

<details>
<summary>***Show solution***</summary>

**Factorial05.java**

```java
package W3;

public class Factorial05 {
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

### [Ex 03.06 Days in month (switch/conditional operator)](https://canvas.kdg.be/courses/62612/modules/items/1495574)

<details>
<summary>***Show solution***</summary>

**DaysInMonth06.java**

```java
package W3;

import java.util.Scanner;

public class DaysInMonth06 {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.println("Enter a month number (1 = January): ");
        int monthNum = keyboard.nextInt();
        System.out.println("Enter a year (4 digits):");
        int yearNum = keyboard.nextInt();

        String[][] months = {
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
        String[] month = months[monthNum - 1];
        System.out.println("%s has %s days.".formatted(month[0], month[1]));
        keyboard.close();
    }
}
```

</details>

### [Ex 03.07 Hexadecimal (for)](https://canvas.kdg.be/courses/62612/modules/items/1495575)

<details>
<summary>***Show solution***</summary>

**Hexadecimal07.java**

```java
package W3;

public class Hexadecimal07 {
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

### [Ex 03.08 Divisible (loops/nested if)](https://canvas.kdg.be/courses/62612/modules/items/1495576)

<details>
<summary>***Show solution***</summary>

**Divisble08.java**

```java
package W3;

import java.util.Scanner;

public class Divisble08 {
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
                    if (i % task1first + i % task1second == 0) {
                        counter++;
                        System.out.print(i + " ");
                        if (counter > 9) {
                            System.out.println(i + " ");
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

### [Ex 03.09 Interest / EXTRA](https://canvas.kdg.be/courses/62612/modules/items/1495577)

<details>
<summary>***Show solution***</summary>

**Interest09.java**

```java
package W3;

import java.util.Scanner;

public class Interest09 {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.println("Enter the starting capital in €:");
        double capital = keyboard.nextInt();
        System.out.println("Enter the interest rate:");
        double interestRate = (keyboard.nextFloat() / 100) + 1;
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

### [Ex 03.10 ASCII box / EXTRA](https://canvas.kdg.be/courses/62612/modules/items/1495578)

<details>
<summary>***Show solution***</summary>

**ASCII10.java**

```java
package W3;

import java.util.Scanner;

public class ASCII10 {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.println(
                "We'll draw an ASCII box using a character and dimensions of your choice.\nEnter a character: ");
        char spamChar = keyboard.next().charAt(0);
        System.out.println("Enter the width (2..60): ");
        int width = keyboard.nextInt();
        while (width < 2 || width > 60) {
            System.out.println("Invalid width");
            width = keyboard.nextInt();
        }
        System.out.println("Enter the height (2..20): ");
        int height = keyboard.nextInt();
        while (height < 2 || height > 20) {
            System.out.println("Invalid height");
            height = keyboard.nextInt();
        }
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                if (i == 0 || i == height - 1 || j == 0 || j == width - 1) { // Task 2
                    System.out.print(spamChar);
                } else {
                    System.out.print(" ");
                }
            }
            System.out.println();
        }
        keyboard.close();
    }
}
```

</details>

### [Ex 03.11 Sequence / EXTRA](https://canvas.kdg.be/courses/62612/modules/items/1495579)

<details>
<summary>***Show solution***</summary>

**Sequence11.java**

```java
package W3;

import java.util.Scanner;

public class Sequence11 {
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

### [Ex 03.12 Multiplication table / EXTRA](https://canvas.kdg.be/courses/62612/modules/items/1495580)

<details>
<summary>***Show solution***</summary>

**MultiplicationTable12.java**

```java
package W3;

import java.util.Scanner;

public class MultiplicationTable12 {
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

### [Ex 03.13 Multiplication table + Quiz / EXTRA](https://canvas.kdg.be/courses/62612/modules/items/1495581)

<details>
<summary>***Show solution***</summary>

**MultiplicationTable13.java**

```java
package W3;

import java.util.Scanner;

public class MultiplicationTable13 {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        final int MAX_MULT = 10;
        int errors = 0;
        System.out.println("Which multiplication table would you like to see?");
        int num = keyboard.nextInt();
        while (num < 1 || num > MAX_MULT) {
            System.out.println("Invalid number");
            num = keyboard.nextInt();
        }
        for (int i = 0; i < MAX_MULT; i++) {
            int res = (i + 1) * num;
            System.out.print("%d x %d = ".formatted(i + 1, num));
            int answer = -1;
            while (true) {
                answer = keyboard.nextInt();
                if (res == answer) {
                    System.out.println("Correct!");
                    break;
                } else {
                    errors++;
                    System.out.println("Wrong");
                }
            }
        }
        System.out.println("You made %d errors".formatted(errors));

        keyboard.close();
    }
}
```

</details>

### [Ex 03.14 ASCII Christmas tree / EXTRA](https://canvas.kdg.be/courses/62612/modules/items/1495582)

<details>
<summary>***Show solution***</summary>

**ASCIIChristmas14.java**

```java
package W3;

import java.util.Scanner;

public class ASCIIChristmas14 {
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

### [Ex 03.15 Functions](https://canvas.kdg.be/courses/62612/modules/items/1495583)

<details>
<summary>***Show solution***</summary>

**Functions15.java**

```java
package W3;

import java.util.HashMap;
import java.util.Scanner;

public class Functions15 {
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
        String onePoint = "aeiolnstr";
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

### [Ex 05.01 Book (class)](https://canvas.kdg.be/courses/62612/modules/items/1495608)

<details>
<summary>***Show solution***</summary>

**Book01.java**

```java
package W5.ex01book;

public class Book01 {
    private String author;
    private String title;
    private int pages;
    private boolean onLoan = false;

    Book01(String author, String title, int pages) {
        this.author = author;
        this.title = title;
        this.pages = pages;
    }

    Book01() {
        this.author = "unknown";
        this.title = "unknown";
        this.pages = 0;
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
```

**TestBook01.java**

```java
package W5.ex01book;

public class TestBook01 {
    public static void main(String[] args) {
        Book01 book1 = new Book01("deitel & deitel", "java, how to program", 1186);
        book1.setLoan(true);
        Book01 book2 = new Book01("hillary mantel", "wolf hall", 604);
        Book01 book3 = new Book01("p.g. wodehouse", "leave it to ppsmith", 352);
        book3.setLoan(true);
        System.out.println(book1.toString());
        System.out.println(book2.toString());
        System.out.println(book3.toString());

    }
}
```

</details>

### [Ex 05.02 Bank Account (class)](https://canvas.kdg.be/courses/62612/modules/items/1495609)

<details>
<summary>***Show solution***</summary>

**BankAccount.java**

```java
package W5.ex02bankaccount;

public class BankAccount {
    private String holder;
    private String iban;
    private double balance;

    BankAccount(String holder, String iban, double balance) {
        this.holder = holder;
        this.iban = iban;
        this.balance = balance;
    }

    BankAccount(String holder, String iban) {
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
```

**DemoBankAccount.java**

```java
package W5.ex02bankaccount;

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
        System.out.println("Euro: \u20AC");
        System.out.write(0xE2);
        System.out.write(0x82);
        System.out.write(0xAC);
        System.out.flush();
        System.out.println();
    }

}
```

</details>

### [Ex 05.03 Box (class)](https://canvas.kdg.be/courses/62612/modules/items/1495610)

<details>
<summary>***Show solution***</summary>

**Box.java**

```java
package W5.ex03box;

public class Box {
    private String type;
    private double length;
    private double width;
    private double height;

    Box(String type, double length, double width, double height) {
        this.type = type;
        this.length = length;
        this.width = width;
        this.height = height;
    }

    Box(String type, double length) {
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
```

**BoxDemo.java**

```java
package W5.ex03box;

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
```

</details>

### [Ex 05.04 Operations (class)](https://canvas.kdg.be/courses/62612/modules/items/1495611)

<details>
<summary>***Show solution***</summary>

**Operations.java**

```java
package W5.ex04operations;

public class Operations {
    private int numberOne;
    private int numberTwo;

    Operations(int numberOne, int numberTwo) {
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
```

**DemoOperations.java**

```java
package W5.ex04operations;

import java.util.Scanner;

public class DemoOperations {
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
```

</details>

### [Ex 05.05 Maximum (constructor/method overloading)](https://canvas.kdg.be/courses/62612/modules/items/1495612)

<details>
<summary>***Show solution***</summary>

**Maximum.java**

```java
package W5.a05Maximum;

public class Maximum {
    private int one;
    private int two;
    private int three;

    Maximum() {
        System.out.println("constructor without parameters called");
    }

    Maximum(int one, int two, int three) {
        System.out.println("int constructor called");
        this.one = one;
        this.two = two;
        this.three = three;
    }

    Maximum(long one, long two, long three) {
        System.out.println("long constructor called");
        this.one = (int) one;
        this.two = (int) two;
        this.three = (int) three;
    }

    Maximum(double one, double two, double three) {
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
```

**TestMaximum.java**

```java
package W5.a05Maximum;

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
```

</details>

### [Ex 05.06 Salesperson (class)](https://canvas.kdg.be/courses/62612/modules/items/1495613)

<details>
<summary>***Show solution***</summary>

**SalesPerson.java**

```java
package W5.a06salesperson;

public class SalesPerson {
    private String name;
    private double revenue;

    SalesPerson(String name, double revenue) {
        this.name = name;
        this.revenue = revenue;
    }

    public String getName() {
        return this.name;
    }

    public double getRevenue() {
        return this.revenue;
    }

    public boolean hasMoreRevenueThan(SalesPerson other) {
        return this.revenue > other.getRevenue();
    }
}
```

**TestSalesPerson.java**

```java
package W5.a06salesperson;

import java.util.Scanner;

public class TestSalesPerson {
    public static void main(String[] args) {

        Scanner scanner = new Scanner(System.in);
        String name;

        name = "Jan";
        System.out.printf("Enter %s's revenue: ", name);
        SalesPerson one = new SalesPerson(name, scanner.nextDouble());

        name = "Laetitia";
        System.out.printf("Enter %s's revenue: ", name);
        SalesPerson two = new SalesPerson(name, scanner.nextDouble());

        name = "Lotte";
        System.out.printf("Enter %s's revenue: ", name);
        SalesPerson three = new SalesPerson(name, scanner.nextDouble());
        // TODO: Print out the name of the top earner!
        SalesPerson bigBoy = one.hasMoreRevenueThan(two) ? one : two;
        System.out.printf("Our top earner is %s!",
                bigBoy.hasMoreRevenueThan(three) ? bigBoy.getName() : three.getName());
        scanner.close();
    }
}
```

</details>

### [Ex 05.07 Circle (data validation)](https://canvas.kdg.be/courses/62612/modules/items/1495614)

<details>
<summary>***Show solution***</summary>

**Circle.java**

```java
package W5.ex07circle;

public class Circle {
    private int radius;
    private String colour = "Black";

    Circle(int radius, String colour) {
        setRadius(radius);
        this.colour = colour;
    }

    Circle(int radius) {
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
        return circumference() - other.circumference();
    }

    public double deltaSurface(Circle other) {
        return surface() - other.surface();
    }

    public String toString() {
        return "Colour:%-10sRadius:%-7dCircumference:%-12.2fSurface: %-10.2f".formatted(this.colour,
                this.radius, circumference(), surface());
    }

}
```

**CircleApp.java**

```java
package W5.ex07circle;

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

        System.out.printf("Difference in circumference (%s - %s): %.2f%n", big.getColour(), small.getColour(),
                big.deltaCircumference(small));
        System.out.printf("Difference in surface (%s - %s): %.2f%n", big.getColour(), small.getColour(),
                big.deltaSurface(small));
    } // main()
} // class
```

</details>

### [Ex 05.08 Perfect number / EXTRA](https://canvas.kdg.be/courses/62612/modules/items/1495615)

<details>
<summary>***Show solution***</summary>

**PerfectNumber.java**

```java
package W5.ex08perfect;

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
```

**TestPerfectNumber.java**

```java
package W5.ex08perfect;

public class TestPerfectNumber {
    public static void main(String[] args) {
        PerfectNumber perfect = new PerfectNumber();

        System.out.println("6 --> " + perfect.getPerfect(6));
        System.out.println("28 --> " + perfect.getPerfect(28));
        System.out.println("496 --> " + perfect.getPerfect(496));
        System.out.println("8128 --> " + perfect.getPerfect(8128));
    }
}
```

</details>

### [Ex 05.09 For experienced programmers: Word Hut Game / Extra](https://canvas.kdg.be/courses/62612/modules/items/1495616)

<details>
<summary>***Show solution***</summary>

**WordHunt10.java**

```java
package W5.ex10wordhut;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.Scanner;

public class WordHunt10 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter a word: ");
        LetterBag lb = new LetterBag();
        String word = sc.nextLine();
        Player user = new Player(word);
        Player bot = new Player(word);
        while (!user.getNote().allLettersDeleted() || !bot.getNote().allLettersDeleted()) {
            char letter = lb.newLetter();
            System.out.println(letter);
        }

        sc.close();
    }
}

class LetterBag {
    private int[] allLetters = new int[26];
    private Random rand = new Random();

    public char newLetter() {
        List<Character> lettersLeft = new ArrayList<>();
        for (int i = 0; i < allLetters.length; i++) {
            if (allLetters[i] == 0) {
                lettersLeft.add((char) ('a' + i));
            }
        }
        char letter = lettersLeft.get(rand.nextInt(0, lettersLeft.size()));
        allLetters[letter - 'a'] = 1;
        return letter;
    }
}

class Note {
    StringBuilder theWord;

    Note(String intialWord) {
        this.theWord = new StringBuilder(intialWord);
    }

    public boolean letterInWord(char letter) {
        return this.theWord.toString().indexOf(letter) != -1;
    }

    public void deleteLetter(char letter) {
        int index = this.theWord.toString().indexOf(letter);
        this.theWord.deleteCharAt(index);
    }

    public void addLetter(char letter) {
        this.theWord.append(letter);
    }

    public boolean allLettersDeleted() {
        return this.theWord.length() == 0;
    }

    public String toString() {
        return theWord.toString();
    }
}

class Player {
    private Note note;
    private int letterDelNote = 0;
    private int letterDelNeighbor = 0;
    private int lettersWritten = 0;
    private int notInWord = 0;

    Player(String word) {
        this.note = new Note(word);
    }

    public Note getNote() {
        return this.note;
    }

    public void addDelNote() {
        letterDelNote++;
    }

    public void addDelNeighbor() {
        letterDelNeighbor++;
    }

    public void addWritten() {
        lettersWritten++;
    }

    public void addNotInWord() {
        notInWord++;
    }

    public String getStats() {
        return "Number of deleted notes: %d%nNumber of letters written: %d%nNumber of times not in word: %d%n"
                .formatted(letterDelNote, letterDelNeighbor, lettersWritten, notInWord);
    }
}
```

</details>

## Week 6

### [Ex 06.01 Chess club](https://canvas.kdg.be/courses/62612/modules/items/1495621)

<details>
<summary>***Show solution***</summary>

**Main.java**

```java
package W6.ex01ChessClub;

public class Main {

    public static void main(String[] args) {

        // TODO make the player class and make the code below function as instructed.

        // TODO Uncomment the code below to test your solution. Do NOT change any code
        // here beyond uncommenting it.

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
```

**Player.java**

```java
package W6.ex01ChessClub;

import java.time.LocalDate;
import java.util.Random;

public class Player {
    private String name;
    private int birthDate;
    private float winRatio;
    private boolean retired = false;
    final private int CURRENT_YEAR = LocalDate.now().getYear();

    Player(String name, int birthDate, float winRatio, boolean retired) {
        this.name = name;
        setAge(birthDate);
        setWinRatio(winRatio);
        this.retired = retired;
    }

    public float getWinRatio() {
        return this.winRatio;
    }

    public void setAge(int birthDate) {
        if (birthDate < CURRENT_YEAR && birthDate >= CURRENT_YEAR - 120) {
            this.birthDate = birthDate;
        } else {
            System.out.println("Invalid age!");
        }
    }

    public void setWinRatio(float winRatio) {
        if (winRatio > 0 && winRatio < 1) {
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
                retired ? "retired" : "activate");
    }
}
```

</details>

### [Ex 06.02 Student Grade Evaluator](https://canvas.kdg.be/courses/62612/modules/items/1495622)

<details>
<summary>***Show solution***</summary>

**Main.java**

```java
package W6.ex02StudentGrade;

import java.util.Scanner;

public class Main {
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
                    System.out.println("\nResults\n");
                    System.out.println("------------------------------------");
                    System.out.println("Student information");
                    System.out.println("------------------------------------");
                    System.out.printf("Name            : %s", student.getName());
                    System.out.printf("%nID              : %d", student.getId());
                    System.out.printf("%nGrade           : %.1f", student.getGrade());
                    System.out.printf("%nPerformance     : %s%n", student.getPerformanceCategory());
                    System.out.println("------------------------------------");
                }
            } while (askAgain);
            System.out.printf("%nDo you want to enter another student? (yes/no): ");
            playAgain = sc.nextLine().strip();
        }
        System.out.println("\nProgram terminated. Goodbye!");
        sc.close();
    }
}
```

**Student.java**

```java
package W6.ex02StudentGrade;

public class Student {
    private String name = "";
    private int id = -1;
    private float grade = -1f;

    Student(String name, int id, float grade) {
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
        switch (value) {
            case 10:
                return "Excellent";
            case 9:
                return "Excellent";
            case 8:
                return "Excellent";
            case 7:
                return "Good";
            case 6:
                return "Sufficient";
            default:
                return "Insufficient";
        }

    }

}
```

</details>
