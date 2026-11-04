# Programming Fundamentals: Term 1 Tutoring

## Table of contents

- [Programming Fundamentals: Term 1 Tutoring](#programming-fundamentals-term-1-tutoring)
  - [Table of contents](#table-of-contents)
  - [Peer Tutoring Exercise – T1W2](#peer-tutoring-exercise--t1w2)
    - [Assignment 1: Purchase](#assignment-1-purchase)
      - [Requirements](#requirements)
    - [Assignment 2: Digital Addiction](#assignment-2-digital-addiction)
      - [Results](#results)
      - [Extensions](#extensions)
  - [Peer Tutoring Exercise – T1W4](#peer-tutoring-exercise--t1w4)
    - [Assignment 1: Snack Bar](#assignment-1-snack-bar)
      - [Requirements](#requirements-1)
      - [Example terminal output](#example-terminal-output)
    - [Assignment 2: Account Generator](#assignment-2-account-generator)
      - [Requirements](#requirements-2)
      - [Example terminal output](#example-terminal-output-1)
      - [Extra (if you have time left)](#extra-if-you-have-time-left)
  - [Peer Tutoring – T1W6](#peer-tutoring--t1w6)
    - [Assignment: Hangman](#assignment-hangman)
    - [Hangman 1](#hangman-1)
      - [Example of operation](#example-of-operation)
    - [Hangman 2](#hangman-2)
      - [Example of operation](#example-of-operation-1)
    - [Hangman 3](#hangman-3)
      - [Example of operation](#example-of-operation-2)

Solutions are hidden by default. Expand Show solution to view the Java code.

## [Peer Tutoring Exercise – T1W2](https://studentkdg.sharepoint.com/sites/MedewerkersTIFlexACS/INF_Curriculum/Forms/AllItems.aspx?id=%2Fsites%2FMedewerkersTIFlexACS%2FINF_Curriculum%2Fdomain+-+Software%2FY1+-+Programming+Fundamentals%2FCurrent%2F2.+Course+material%2FPeertutoring%2FACS%2FPeer+Tutoring+Exercise+-+T1W2.pdf&utm_source=chatgpt.com)

### Assignment 1: Purchase

You are writing a simple cash register program for a store. The customer buys a maximum of 3 products. The program must calculate the total price and check whether the customer is eligible for a discount.

#### Requirements

1. Ask the user for the price of the first product.
2. Ask the user for the price of the second product.
3. Ask the user for the price of the third product.
4. Check: if a product price is negative, display an error message and set the price to 0.
5. Calculate the price including VAT for each product:
   - Example: use 21% VAT on each product.
   - Display the price including VAT each time.
6. Add up all prices (including VAT) and display the total price.
7. If the total price exceeds 100 euros, the customer receives a 10% discount.
8. Finally, display the final price (with or without discount).
9. If the total price is exactly 0, display: `"No products purchased."`
10. If the final price is more than 200 euros, display: `"You will receive an extra gift!"`

<details>
<summary>***Show solution***</summary>

**PTW2_01.java**

```java
package PeerTutoring;

import java.util.Scanner;

public class PTW2_01 {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        float VAT = 0.21f;
        System.out.println("What's the price of the first product?");
        int firstProd = keyboard.nextInt();
        if (firstProd < 0) {
            System.out.println("Should not be negative, defaulting 0");
            firstProd = 0;
        }
        float firstVAT = (VAT + 1) * firstProd;
        System.out.println("VAT Price is: " + firstVAT);
        System.out.println("What's the price of the second product?");
        int secondProd = keyboard.nextInt();
        if (secondProd < 0) {
            System.out.println("Should not be negative, defaulting 0");
            secondProd = 0;
        }
        float secondVAT = (VAT + 1) * secondProd;
        System.out.println("VAT Price is: " + secondVAT);
        System.out.println("What's the price of the third product?");
        int thirdProd = keyboard.nextInt();
        if (thirdProd < 0) {
            System.out.println("Should not be negative, defaulting 0");
            thirdProd = 0;
        }
        float thirdVAT = (VAT + 1) * thirdProd;
        System.out.println("VAT Price is: " + thirdVAT);
        float totalPrice = firstVAT + secondVAT + thirdVAT;
        if (totalPrice > 100) {
            System.out.println("Received a 10% discount");
            totalPrice *= 0.9;
            if (totalPrice > 200) {
                System.out.println("You will receive an extra gift!");
            }
        }
        if (totalPrice == 0) {
            System.out.println("No products purchased.");
        } else {
            System.out.println("Total price is: " + totalPrice);
        }

        keyboard.close();
    }
}
```

</details>

### Assignment 2: Digital Addiction

Come up with the algorithm for the following program:

You want to build a small application to test whether people are digitally addicted or not.

The following yes/no questions are asked (use copy/paste, don't retype everything!):

1. The last thing I do before turning off the lights at night is quickly check if I have received any messages, etc. on my smartphone.
2. The first thing I do when I turn on the lights in the morning is check my smartphone for messages, etc.
3. I have notifications (that make a sound or vibrate) activated on my smartphone.
4. When I notice that a notification has come in on my smartphone, I check my smartphone within a minute to see what it is.
5. While watching a TV series or movie on TV or my computer screen, I use my smartphone one or more times.
6. When I eat alone (breakfast/lunch/dinner), I use my smartphone several times during the meal.
7. When I eat in company—family, friends, etc. (breakfast/lunch/dinner)—I use my smartphone several times during the meal.
8. When I am waiting (for a bus, train, tram, a friend, etc.), I use my smartphone.
9. When walking alone on the street, I do so with my smartphone in my hand and regularly look at the screen.
10. When I'm cycling or driving, I sometimes pick up my smartphone and look at the screen.

The program counts the number of times the user answers "yes."

#### Results

- 0 yes answers: `"You are not digitally addicted. Keep it up!"`
- 1–2 yes answers: `"You have a mild form of digital addiction"`
- 3–5 yes answers: `"You have a form of digital addiction that should not be underestimated. Set some limits for yourself."`
- 6–8 yes answers: `"You have a severe form of digital addiction. Consider taking a digital detox course!"`
- 9 or more yes answers: `"You have an extreme form of digital addiction. You probably need professional help!"`

Once you have the algorithm, convert it to Java code. Use the elements that have already been covered in an intuitive way in the (extensive) slides. Run the program in IntelliJ.

#### Extensions

a. Personalization

At the beginning, ask for the user's name and use that name when addressing them and when the result is displayed on the screen.

b. Repeat survey

When the program ends, ask the user if they want to complete another survey. If the user answers `'Y'`, start it again.

c. Statistics

Count how many users have already used the program—as long as the program is running, of course—and how many (percentage) of them have a serious or extreme form of digital addiction.

Display this at the start of the program:

`This survey has already been completed by ... users, ...% of whom had a serious or extreme form of digital addiction ...`

d. Smartphone usage percentage

For people with an extreme form of digital addiction, ask how many hours a day they spend on their smartphone. Then calculate the percentage of time they spend on their smartphone per day.

- More than 80%:

`"You spend ...% of the day on your smartphone. Your addiction is a danger to yourself and those around you. Seek help as soon as possible!!"`

- Between 20% and 80%:

`"You spend ...% of the day on your smartphone. We advise you to seek professional help"`

- Less than 20%:

`"You spend ...% of the day on your smartphone. Strange, are you sure you filled in the survey honestly? Be honest with yourself!"`

e. Summary report

Display a summary report when all questions have been answered:

- Show the user's name.
- Show the various questions and the answers the user gave.
- Show the total number of `'Yes'` answers.
- In the case of extreme digital addiction, also show the percentage calculated in extension d.
- Show the text `"Our advice:"` and then the advice given. In cases of extreme addiction, this is the combined advice.

<details>
<summary>***Show solution***</summary>

**PTW2_02.java**

```java
package PeerTutoring;

import java.util.Scanner;

public class PTW2_02 {

    public static void main(String[] args) {

        Scanner keyboard = new Scanner(System.in);

        boolean playAgain = true;

        int totalUsers = 0;
        int seriousUsers = 0;

        System.out.println("What's your name?");
        String name = keyboard.nextLine();

        String[] questions = {
                "The last thing I do before turning off the lights at night is quickly check if I have received any messages, etc. on my smartphone.",
                "The first thing I do when I turn on the lights in the morning is check my smartphone for messages, etc.",
                "I have notifications (that make a sound or vibrate) activated on my smartphone.",
                "When I notice that a notification has come in on my smartphone, I check my smartphone within a minute to see what it is.",
                "While watching a TV series or movie on TV or my computer screen, I use my smartphone one or more times.",
                "When I eat alone (breakfast/lunch/dinner), I use my smartphone several times during the meal.",
                "When I eat in company—family, friends, etc. (breakfast/lunch/dinner)—I use my smartphone several times during the meal.",
                "When I am waiting (for a bus, train, tram, a friend, etc.), I use my smartphone.",
                "When walking alone on the street, I do so with my smartphone in my hand and regularly look at the screen.",
                "When I'm cycling or driving, I sometimes pick up my smartphone and look at the screen." };

        while (playAgain) {

            int digitallyAddicted = 0;

            String[] answers = new String[questions.length];

            String advice = "";
            double percentage = 0;

            if (totalUsers == 0) {

                System.out.println(
                        "This survey has already been completed by 0 users, 0% of whom had a serious or extreme form of digital addiction.");

            } else {

                double seriousPercentage = (double) seriousUsers / totalUsers * 100;

                System.out.printf(
                        "This survey has already been completed by %d users, %.2f%% of whom had a serious or extreme form of digital addiction.%n",
                        totalUsers, seriousPercentage);
            }

            System.out.println();
            System.out.println("Welcome " + name + "!");
            System.out.println("Please answer YES or NO to the following questions.");
            System.out.println();

            for (int i = 0; i < questions.length; i++) {

                System.out.println((i + 1) + ". " + questions[i]);

                String answer;

                do {
                    System.out.println("Your answer (YES/NO): ");
                    answer = keyboard.nextLine();

                } while (!answer.equalsIgnoreCase("YES")
                        && !answer.equalsIgnoreCase("NO"));

                answers[i] = answer;

                if (answer.equalsIgnoreCase("YES")) {
                    digitallyAddicted++;
                }

                System.out.println();
            }

            if (digitallyAddicted == 0) {

                advice = "You are not digitally addicted. Keep it up!";

            } else if (digitallyAddicted <= 2) {

                advice = "You have a mild form of digital addiction";

            } else if (digitallyAddicted <= 5) {

                advice = "You have a form of digital addiction that should not be underestimated. Set some limits for yourself.";

            } else if (digitallyAddicted <= 8) {

                advice = "You have a severe form of digital addiction. Consider taking a digital detox course!";

            } else {

                advice = "You have an extreme form of digital addiction. You probably need professional help!";

                double hours;

                do {
                    System.out.println(
                            name + ", how many hours per day do you spend on your smartphone?");

                    hours = keyboard.nextDouble();
                    keyboard.nextLine();

                } while (hours < 0 || hours > 24);

                percentage = hours / 24 * 100;

                if (percentage > 80) {

                    advice += "\nYou spend " + String.format("%.2f", percentage) +
                            "% of the day on your smartphone. Your addiction is a danger to yourself and those around you. Seek help as soon as possible!!";

                } else if (percentage >= 20) {

                    advice += "\nYou spend " + String.format("%.2f", percentage) +
                            "% of the day on your smartphone. We advise you to seek professional help";

                } else {

                    advice += "\nYou spend " + String.format("%.2f", percentage) +
                            "% of the day on your smartphone. Strange, are you sure you filled in the survey honestly? Be honest with yourself!";
                }
            }

            if (digitallyAddicted >= 6) {
                seriousUsers++;
            }

            totalUsers++;

            System.out.println();
            System.out.println("========== SUMMARY REPORT ==========");

            System.out.println("Name: " + name);
            System.out.println();

            System.out.println("Your answers:");

            for (int i = 0; i < questions.length; i++) {

                System.out.println((i + 1) + ". " + questions[i]);
                System.out.println("Answer: " + answers[i]);
                System.out.println();
            }

            System.out.println("Total number of YES answers: "
                    + digitallyAddicted);

            if (digitallyAddicted == 9 || digitallyAddicted == 10) {

                System.out.printf(
                        "Percentage of the day spent on your smartphone: %.2f%%%n",
                        percentage);
            }

            System.out.println();
            System.out.println("Our advice:");
            System.out.println(advice);

            System.out.println("====================================");

            System.out.println();
            System.out.println(
                    name + ", do you want to complete another survey (Y/N)?");

            String answer = keyboard.nextLine();

            playAgain = answer.equalsIgnoreCase("Y");
        }

        System.out.println("Thank you for using the digital addiction survey!");

        keyboard.close();
    }
}
```

</details>

## [Peer Tutoring Exercise – T1W4](https://studentkdg.sharepoint.com/:w:/s/MedewerkersTIFlexACS/IQDB1gi2MXOvSox6QQpbGEIwAXapqV91JCWJ0Ama0tYRVio?e=xa2i6Q)

### Assignment 1: Snack Bar

You are writing the till program for the cinema snack bar. The customer orders snacks one by one until they choose to pay. The program keeps track of the order, applies a discount if applicable, and displays the bill.

#### Requirements

1. Display the menu once (see the example below).
2. Keep asking for a choice until the customer enters `0`. Think about which loop is best suited here.
3. Use a **switch expression** to determine the name and the price of the chosen item:

- After a valid choice, display: `"<item> added to basket."` (e.g. `"Popcorn added to basket."`).
- If the choice is invalid, display `"Invalid choice."` and use a price of 0. Hint: look at `yield` in the slides.

1. Keep track of the number of items ordered and the total price. Invalid choices don't count.
2. Write a function `calculateDiscount(double total)` that returns the discount:

- 10% if the total is more than 20 euros.
- Otherwise, 0.

1. When the customer pays:

- If nothing was ordered, display: `"Nothing ordered."`
- Otherwise, display the number of items, the total, the discount and the amount to pay.
- Use `printf` with 2 decimals.

#### Example terminal output

```text
--- SNACK BAR ---

1. Popcorn 4,50
2. Soft drink 3,00
3. Nachos 5,50
0. Pay

Choice: 1
Popcorn added to basket.

Choice: 3
Nachos added to basket.

Choice: 7
Invalid choice.

Choice: 2
Soft drink added to basket.

Choice: 1
Popcorn added to basket.

Choice: 3
Nachos added to basket.

Choice: 0

Items : 5
Total : €23,00
Discount: €2,30
To pay : €20,70
```

<details>
<summary>***Show solution***</summary>

**PTPW4_01.java**

```java
package PeerTutoring;

import java.util.Scanner;

public class PTPW4_01 {
    static Scanner sc = new Scanner(System.in);
    static int items = 0;
    static double total = 0;

    public static void main(String[] args) {
        System.out.println("--- SNACK BAR ---");
        System.out.printf("%d. %-14s %.2f\n", 1, "Popcorn", 4.5f);
        System.out.printf("%d. %-14s %.2f\n", 1, "Soft drink", 3f);
        System.out.printf("%d. %-14s %.2f\n", 1, "Nachos", 5.5f);
        System.out.println("0. Pay");

        int choice;
        do {
            System.out.print("Choice: ");
            choice = sc.nextInt();
            switch (choice) {
                case 1:
                    updateItems(4.5f, "Popcorn");
                    break;
                case 2:
                    updateItems(3f, "Soft drink");
                    break;
                case 3:
                    updateItems(5.5f, "Nachos");
                    break;

                default:
                    updateItems(0f, null);
                    break;
            }
        } while (choice != 0);
        double discount = calculateDiscount(total);
        if (items == 0) {
            System.out.println("Nothing ordered.");
        } else {
            System.out.printf("%-8s: %d\n%-8s: €%.2f\n%-8s:  %.2f\n%-8s: €%.2f", "Items", items, "Total", total,
                    "Discount", discount, "To pay",
                    total - discount);
        }
    }

    static public double calculateDiscount(double total) {
        if (total > 20) {
            return total / 10;
        }
        return 0;
    }

    static public void updateItems(float price, String item) {
        if (item != null) {
            items++;
            System.out.printf("%s added to basket.\n", item);
            total += price;
        } else {
            System.out.println("Invalid choice.");
        }

    }
}
```

</details>

### Assignment 2: Account Generator

You are building a small tool that creates a username and a random password for new students.

#### Requirements

1. Put your class in the package `be.kdg.peertutoring.w4`.
2. Import `Scanner` and `Random` explicitly (don't use `*`).
3. Ask for the first name and last name and remove leading/trailing spaces.
4. Generate the username (all lowercase):

- First letter of the first name.
- Last name.
- 2 random digits.

Example: `Sarah Peeters` → `speeters47`

1. Ask for the password length. Keep asking until it is between 8 and 16.
2. Generate the password by picking random characters from the `String` below with `charAt`. Build the password with a `StringBuilder`.

```java
String allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?#$%&";
```

1. Count the number of uppercase letters and digits in the password.

Hint: you can compare chars, e.g. `ch >= 'A' && ch <= 'Z'`.

1. The password is **STRONG** if:

- Its length is at least 12.
- It contains at least one uppercase letter.
- It contains at least one digit.

Otherwise, it is **WEAK**.

1. Display the summary with `printf`, aligned as in the example below.

#### Example terminal output

```text
First name: Sarah
Last name: Peeters
Password length (8-16): 5

Length must be between 8 and 16.

Password length (8-16): 12

Username : speeters47
Password : k7#Rq!aZ2m?P
Uppercase: 3
Digits : 2
Strength : STRONG
```

#### Extra (if you have time left)

**a) Random seed**

Ask the user for a number and use it as the seed for `Random`.

Run the program twice with the same seed. What do you notice?

**b) Masked password**

Show the password masked, so only the first and last characters are visible.

Example:

```text
Password : k**********P
```

<details>
<summary>***Show solution***</summary>

**PTPW4_02.java**

```java
package PeerTutoring;

// 1
import java.util.Random;
import java.util.Scanner;

public class PTPW4_02 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // A - Extra SEED
        System.out.print("Seed number: ");
        Random ran = new Random(sc.nextInt());
        sc.nextLine();
        // 2
        System.out.print("First name: ");
        String firstName = sc.nextLine().trim();
        System.out.print("Last name: ");
        String lastName = sc.nextLine().trim();
        // 3
        String username = Character.toString(firstName.toLowerCase().charAt(0)) + lastName.toLowerCase() +
                ran.nextInt(100);
        // 4
        int pwdLen;
        do {
            System.out.print("Password length (8-16): ");
            pwdLen = sc.nextInt();
            sc.nextLine();
            if (pwdLen < 8 || pwdLen > 16) {
                System.out.println("Length must be between 8 and 16.");
            }
        } while (pwdLen < 8 || pwdLen > 16);
        String allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?#$%&";
        StringBuilder pwd = new StringBuilder();
        int upperNum = 0;
        int digitNum = 0;
        // 5
        for (int i = 0; i < pwdLen; i++) {
            char randomChar = allowed.charAt(ran.nextInt(allowed.length()));
            pwd.append(randomChar);
            // 6
            if (randomChar >= 'A' && randomChar <= 'Z') {
                upperNum++;
            } else if (randomChar >= '0' && randomChar <= '9') {
                digitNum++;
            }
        }
        // 7
        String strength;
        if (pwdLen >= 12 && upperNum >= 1 && digitNum >= 1) {
            strength = "STRONG";
        } else {
            strength = "WEAK";
        }

        // 8
        System.out.printf(
                "%n%-9s: %s" +
                        "%n%-9s: %s" +
                        "%n%-9s: %d" +
                        "%n%-9s: %d" +
                        "%n%-9s: %s",
                "Username", username, "Password",
                // B - Extra MASKED
                Character.toString(pwd.charAt(0)) + "*".repeat(pwd.length() - 2) +
                        Character.toString(pwd.charAt(pwd.length() - 1)),
                "Uppercase", upperNum, "Digits", digitNum, "Strength", strength);
        sc.close();
    }
}
```

</details>

## [Peer Tutoring – T1W6](https://studentkdg.sharepoint.com/sites/MedewerkersTIFlexACS/INF_Curriculum/Forms/AllItems.aspx?id=%2Fsites%2FMedewerkersTIFlexACS%2FINF%5FCurriculum%2Fdomain%20%2D%20Software%2FY1%20%2D%20Programming%20Fundamentals%2FCurrent%2F2%2E%20Course%20material%2FPeertutoring%2FACS%2FPeer%20Tutoring%20Exercise%20%2D%20T1W6%2Epdf&parent=%2Fsites%2FMedewerkersTIFlexACS%2FINF%5FCurriculum%2Fdomain%20%2D%20Software%2FY1%20%2D%20Programming%20Fundamentals%2FCurrent%2F2%2E%20Course%20material%2FPeertutoring%2FACS&p=true&ga=1)

### Assignment: Hangman

We are gradually developing a simple version of the word game Hangman. The exercise is structured in steps. Completing it entirely will be difficult; see it as a challenge and try to get as far as possible! Maybe with some tips from the tutors, you can finish it at home on your own.

### Hangman 1

Create a class `Hangman1` with a `main` method.

Ask the user for a word. Perform the following checks:

- The word can be a maximum of 10 letters long.
- The word must be at least 5 letters long.

Use a validation loop: keep asking for a word until the user has entered a word with an acceptable length.

Next, clear the screen by showing 20 empty lines. Then show the player (a person other than the user) a number of dots equal to the length of the word to be guessed.

The player may now make a few guesses. Each time, check whether the word the player enters matches the word to be guessed (case-insensitive).

If the player has not found the word after 5 turns, the game ends.

#### Example of operation

```text
Give a word (max 10 letters): exhibitions
Give a word (max 10 letters): pumpkin
The word to search for: .......








Take a guess: appel
WRONG!
Take a guess: banana
WRONG!
Take a guess: lemon
WRONG!
Take a guess: pumpkin
Congratulations, you guessed the word in 4 turns!
```

<details>
<summary>***Show solution***</summary>

**Hangman1.java**

```java
package PeerTutoring;

import java.util.Scanner;

public class Hangman1 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final int MAX = 10;
        final int MIN = 5;
        String word;
        do {
            System.out.print("Give a word (max 10 letters): ");
            word = sc.nextLine().strip();
        } while (word.length() < MIN || word.length() > MAX);

        System.out.print("\n".repeat(20));
        System.out.printf("The word to search for: %s%n", ".".repeat(word.length()));
        for (int i = 1; i <= 5; i++) {
            System.out.print("Take a guess: ");
            if (sc.nextLine().strip().toLowerCase().equals(word.toLowerCase())) {
                System.out.printf("%nCongratulations, you guessed the word in %d turns!", i);
                break;
            } else {
                System.out.print("WRONG! ");
            }
        }
        sc.close();
    }
}
```

</details>

### Hangman 2

Create a class `Hangman2` with a `main` method. Copy the code from the previous version into this class.

The game becomes a bit more advanced: for each guess, ask the player to enter a single letter. Display that letter at the correct position in the series of dots, as shown in the example below.

Proceed as follows:

1. After reading the word and clearing the screen, create a `StringBuilder` object and fill it with as many dots as the word has letters.
   - **Tip:** Use `append`.
2. Use a loop that continues until the word is found. The maximum number of turns is now 8.
   - Each turn, ask the user for a letter. Read it as a `char` like this:

     ```java
     char guess = keyboard.next().charAt(0);
     ```

   - Loop through the word you are searching for. If a character in the word matches the guessed character, replace the corresponding dot in the `StringBuilder` with the correct character.
     - **Tip:** Use `setCharAt`.
   - Display the `StringBuilder` (containing both dots and correctly guessed letters), so the player can see the word gradually appear.

3. Repeat until the contents of the `StringBuilder` are the same as the original word.

#### Example of operation

```text
Give a word (max 10 letters): avocado










The word to search for: ........
Guess a letter: d
The word to search for: .d....d.
Guess a letter: o
The word to search for: .d.o..do
Guess a letter: v
The word to search for: .dvo..do
Guess a letter: k
The word to search for: .dvo..do
Guess a letter: a
The word to search for: advo.ado
Guess a letter: c
The word to search for: avocado
Congratulations, you guessed the word in 6 turns!
```

<details>
<summary>***Show solution***</summary>

**Hangman2.java**

```java
package PeerTutoring;

import java.util.Scanner;

public class Hangman2 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final int MAX = 10;
        final int MIN = 5;
        String word;
        do {
            System.out.print("Give a word (max 10 letters): ");
            word = sc.nextLine().strip();
        } while (word.length() < MIN || word.length() > MAX);

        System.out.print("\n".repeat(20));
        StringBuilder toGuess = new StringBuilder(".".repeat(word.length()));
        for (int i = 1; i <= 8; i++) {
            System.out.printf("The word to search for: %s%n", toGuess);
            System.out.print("Guess a letter: ");
            char guess = sc.next().charAt(0);
            sc.nextLine();
            boolean fullyGuessed = true;
            for (int j = 0; j < word.length(); j++) {
                if (word.charAt(j) == guess) {
                    toGuess.setCharAt(j, guess);
                } else if (toGuess.charAt(j) == '.') {
                    fullyGuessed = false;
                }
            }
            if (fullyGuessed) {
                System.out.printf("%nCongratulations, you guessed the word in %d turns!", i);
                break;
            }
        }
        sc.close();
    }
}
```

</details>

### Hangman 3

Copy the code again into a new class called `Hangman3`.

After each guess, show part of a hangman. Each time the player makes a wrong guess, reveal a little more of the hangman.

Copy the following `String` into your code:

```java
final String HANGMAN =
    "----- \n" +
    "| | \n" +
    "| O \n" +
    "| /|\\\n" +
    "| | \n" +
    "| / \\\n" +
    "| \n" +
    "-------";
```

After each guess, show part of this `String`, revealing a little more each time the player guesses incorrectly.

Use methods from the `String` class to do this.

The `String` consists of 8 parts, each 7 characters long. If all lines of the `String` have been shown and the word has not yet been guessed, the game ends with a message that the player has lost.

If the player guesses the word before the hangman is complete, they win.

#### Example of operation

```text
Give a word (max 10 letters): halloween










The word to search for: .........
Guess a letter: e
The word to search for: ......ee.
Guess a letter: x
The word to search for: ......ee.
-----
Guess a letter: q
The word to search for: ......ee.
-----
| |
Guess a letter: w
The word to search for: ......wee.
-----
| |
Guess a letter: u
The word to search for: ......wee.
-----
| |
| O
Guess a letter: h
The word to search for: h.....wee.
-----
| |
| O
Guess a letter: o
The word to search for: h...owee.
-----
| |
| O
Guess a letter: l
The word to search for: h.llowee.
-----
| |
| O
Guess a letter: a
The word to search for: hallowee.
-----
| |
| O
Guess a letter: n
The word to search for: halloween
-----
| |
| O
Congratulations, you guessed the word in 10 turns!
```

<details>
<summary>***Show solution***</summary>

**Hangman3.java**

```java
package PeerTutoring;

import java.util.Scanner;

public class Hangman3 {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final int MAX = 10;
        final int MIN = 5;
        final String HANGMAN = "----- \n" +
                "| | \n" +
                "| O \n" +
                "| /|\\\n" +
                "| | \n" +
                "| / \\\n" +
                "| \n" +
                "-------";
        final String[] HANGMAN_SPLIT = HANGMAN.split("\n");
        String word;
        do {
            System.out.print("Give a word (max 10 letters): ");
            word = sc.nextLine().strip();
        } while (word.length() < MIN || word.length() > MAX);

        System.out.print("\n".repeat(20));
        StringBuilder toGuess = new StringBuilder(".".repeat(word.length()));
        int wrongs = 0;
        System.out.printf("The word to search for: %s%n", toGuess);
        int i = 0;
        while (HANGMAN_SPLIT.length > wrongs) {
            i++;
            System.out.print("Guess a letter: ");
            char guess = sc.next().charAt(0);
            sc.nextLine();
            boolean fullyGuessed = true;
            boolean goodGuess = false;
            for (int j = 0; j < word.length(); j++) {
                if (word.charAt(j) == guess) {
                    goodGuess = true;
                    toGuess.setCharAt(j, guess);
                } else if (toGuess.charAt(j) == '.') {
                    fullyGuessed = false;
                }
            }
            if (!goodGuess) {
                wrongs++;
            }
            System.out.printf("The word to search for: %s%n", toGuess);
            for (int j = 0; j < wrongs; j++) {
                System.out.println(HANGMAN_SPLIT[j]);
            }
            if (fullyGuessed) {
                System.out.printf("%nCongratulations, you guessed the word in %d turns!", i);
                break;
            }
        }
        if (HANGMAN_SPLIT.length <= wrongs) {
            System.out.println("You lost, bozo");
        }
        sc.close();
    }
}
```

</details>
