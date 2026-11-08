# Programming Fundamentals: Term 1 Tutoring

**Single-file browser implementation:** Each exercise is submitted as one Java source file named `Main.java`. Do not add a `package` declaration or create additional `.java` files. When a task needs several classes, declare them as package-private classes in the same source file as `public class Main`.

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

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-tut-t1w2-purchase">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    private static final double VAT_RATE = 0.21;

    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        double totalIncludingVat = 0;
        String[] labels = {"first", "second", "third"};

        for (String label : labels) {
            System.out.printf("What's the price of the %s product? ", label);
            double price = keyboard.nextDouble();
            if (price < 0) {
                System.out.println("Price should not be negative; using 0.");
                price = 0;
            }
            double priceIncludingVat = price * (1 + VAT_RATE);
            System.out.printf("Price including 21%% VAT: €%.2f%n", priceIncludingVat);
            totalIncludingVat += priceIncludingVat;
        }

        if (totalIncludingVat == 0) {
            System.out.println("No products purchased.");
        } else {
            double discount = totalIncludingVat > 100 ? totalIncludingVat * 0.10 : 0;
            double finalPrice = totalIncludingVat - discount;
            System.out.printf("Total including VAT: €%.2f%n", totalIncludingVat);
            System.out.printf("Discount: €%.2f%n", discount);
            System.out.printf("Final price: €%.2f%n", finalPrice);
            if (finalPrice > 200) {
                System.out.println("You will receive an extra gift!");
            }
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

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-tut-t1w2-digital-addiction">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    private static final String[] QUESTIONS = {
        "The last thing I do before turning off the lights at night is quickly check if I have received any messages, etc. on my smartphone.",
        "The first thing I do when I turn on the lights in the morning is check my smartphone for messages, etc.",
        "I have notifications (that make a sound or vibrate) activated on my smartphone.",
        "When I notice that a notification has come in on my smartphone, I check my smartphone within a minute to see what it is.",
        "While watching a TV series or movie on TV or my computer screen, I use my smartphone one or more times.",
        "When I eat alone (breakfast/lunch/dinner), I use my smartphone several times during the meal.",
        "When I eat in company—family, friends, etc. (breakfast/lunch/dinner)—I use my smartphone several times during the meal.",
        "When I am waiting (for a bus, train, tram, a friend, etc.), I use my smartphone.",
        "When walking alone on the street, I do so with my smartphone in my hand and regularly look at the screen.",
        "When I'm cycling or driving, I sometimes pick up my smartphone and look at the screen."
    };

    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        int totalUsers = 0;
        int seriousUsers = 0;
        boolean playAgain;

        do {
            if (totalUsers == 0) {
                System.out.println("This survey has already been completed by 0 users, 0% of whom had a serious or extreme form of digital addiction.");
            } else {
                double percentage = (double) seriousUsers / totalUsers * 100;
                System.out.printf("This survey has already been completed by %d users, %.2f%% of whom had a serious or extreme form of digital addiction.%n",
                        totalUsers, percentage);
            }

            System.out.print("What's your name? ");
            String name = keyboard.nextLine().trim();
            String[] answers = new String[QUESTIONS.length];
            int yesCount = 0;

            for (int i = 0; i < QUESTIONS.length; i++) {
                String answer;
                do {
                    System.out.printf("%d. %s%nYour answer (YES/NO): ", i + 1, QUESTIONS[i]);
                    answer = keyboard.nextLine().trim();
                } while (!answer.equalsIgnoreCase("YES") && !answer.equalsIgnoreCase("NO"));
                answers[i] = answer.toUpperCase();
                if (answers[i].equals("YES")) {
                    yesCount++;
                }
            }

            String advice;
            double phonePercentage = -1;
            if (yesCount == 0) {
                advice = "You are not digitally addicted. Keep it up!";
            } else if (yesCount <= 2) {
                advice = "You have a mild form of digital addiction";
            } else if (yesCount <= 5) {
                advice = "You have a form of digital addiction that should not be underestimated. Set some limits for yourself.";
            } else if (yesCount <= 8) {
                advice = "You have a severe form of digital addiction. Consider taking a digital detox course!";
            } else {
                advice = "You have an extreme form of digital addiction. You probably need professional help!";
                double hours;
                do {
                    System.out.print(name + ", how many hours per day do you spend on your smartphone? ");
                    hours = keyboard.nextDouble();
                    keyboard.nextLine();
                } while (hours < 0 || hours > 24);
                phonePercentage = hours / 24 * 100;
                if (phonePercentage > 80) {
                    advice += String.format("%nYou spend %.2f%% of the day on your smartphone. Your addiction is a danger to yourself and those around you. Seek help as soon as possible!!", phonePercentage);
                } else if (phonePercentage >= 20) {
                    advice += String.format("%nYou spend %.2f%% of the day on your smartphone. We advise you to seek professional help", phonePercentage);
                } else {
                    advice += String.format("%nYou spend %.2f%% of the day on your smartphone. Strange, are you sure you filled in the survey honestly? Be honest with yourself!", phonePercentage);
                }
            }

            totalUsers++;
            if (yesCount >= 6) {
                seriousUsers++;
            }

            System.out.println("\n========== SUMMARY REPORT ==========");
            System.out.println("Name: " + name);
            for (int i = 0; i < QUESTIONS.length; i++) {
                System.out.printf("%d. %s%nAnswer: %s%n", i + 1, QUESTIONS[i], answers[i]);
            }
            System.out.println("Total number of YES answers: " + yesCount);
            if (phonePercentage >= 0) {
                System.out.printf("Percentage of the day spent on your smartphone: %.2f%%%n", phonePercentage);
            }
            System.out.println("\nOur advice:");
            System.out.println(advice);
            System.out.println("====================================");

            System.out.print(name + ", do you want to complete another survey (Y/N)? ");
            playAgain = keyboard.nextLine().equalsIgnoreCase("Y");
        } while (playAgain);

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
2. Keep asking for a choice until the customer enters `0`. A `do-while` loop is suitable because the customer must be prompted at least once.
3. Use a **switch expression** to determine the selected item's name and price:

- After a valid choice, display: `"<item> added to basket."` (e.g. `"Popcorn added to basket."`).
- If the choice is invalid, display `"Invalid choice."` and use a price of 0. Hint: look at `yield` in the slides.

4. Keep track of the number of items ordered and the total price. Invalid choices and the `0` (pay) option do not count as items.
5. Write a function `calculateDiscount(double total)` that returns the discount:

- 10% if the total is more than 20 euros.
- Otherwise, 0.

6. When the customer pays:

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

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-tut-t1w4-snack-bar">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Locale;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        int itemCount = 0;
        double total = 0;

        System.out.println("--- SNACK BAR ---");
        System.out.printf(Locale.GERMANY, "1. %-14s €%5.2f%n", "Popcorn", 4.50);
        System.out.printf(Locale.GERMANY, "2. %-14s €%5.2f%n", "Soft drink", 3.00);
        System.out.printf(Locale.GERMANY, "3. %-14s €%5.2f%n", "Nachos", 5.50);
        System.out.println("0. Pay");

        int choice;
        do {
            System.out.print("Choice: ");
            choice = keyboard.nextInt();
            if (choice == 0) {
                break;
            }

            String item;
            double price = switch (choice) {
                case 1 -> {
                    item = "Popcorn";
                    yield 4.50;
                }
                case 2 -> {
                    item = "Soft drink";
                    yield 3.00;
                }
                case 3 -> {
                    item = "Nachos";
                    yield 5.50;
                }
                default -> {
                    item = null;
                    yield 0.0;
                }
            };

            if (item == null) {
                System.out.println("Invalid choice.");
            } else {
                itemCount++;
                total += price;
                System.out.println(item + " added to basket.");
            }
        } while (choice != 0);

        if (itemCount == 0) {
            System.out.println("Nothing ordered.");
        } else {
            double discount = calculateDiscount(total);
            System.out.printf(Locale.GERMANY, "Items   : %d%nTotal   : €%.2f%nDiscount: €%.2f%nTo pay  : €%.2f%n",
                    itemCount, total, discount, total - discount);
        }
        keyboard.close();
    }

    static double calculateDiscount(double total) {
        return total > 20 ? total * 0.10 : 0;
    }
}
```

</details>

### Assignment 2: Account Generator

You are building a small tool that creates a username and a random password for new students.

#### Requirements

1. Import `Scanner` and `Random` explicitly (do not use wildcard imports). In the browser version, omit the Java `package` declaration and keep all code in the single source file.
2. Ask for the first name and last name and trim leading/trailing spaces.
3. Generate the username (all lowercase):

- First letter of the first name.
- Last name.
- 2 random digits.

Example: `Sarah Peeters` → `speeters47`

4. Ask for the password length. Keep asking until it is between 8 and 16.
5. Generate the password by picking random characters from the `String` below with `charAt`. Build the password with a `StringBuilder`.

```java
String allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?#$%&";
```

6. Count the number of uppercase letters and digits in the password.

Hint: you can compare chars, e.g. `ch >= 'A' && ch <= 'Z'`.

7. The password is **STRONG** if:

- Its length is at least 12.
- It contains at least one uppercase letter.
- It contains at least one digit.

Otherwise, it is **WEAK**.

8. Display the summary with `printf`, aligned as in the example below.

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

Ask the user whether to use a seed. If they choose yes, read a number and pass it to the `Random` constructor. Run the program twice with the same seed. What do you notice? The reference solution includes this option.

**b) Masked password**

Show the password masked, so only the first and last characters are visible.

Example:

```text
Password : k**********P
```

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-tut-t1w4-account-generator">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Random;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        System.out.print("Use a seed for repeatable output? (y/n): ");
        boolean useSeed = keyboard.nextLine().trim().equalsIgnoreCase("y");
        Random random;
        if (useSeed) {
            System.out.print("Seed: ");
            long seed = keyboard.nextLong();
            keyboard.nextLine();
            random = new Random(seed);
        } else {
            random = new Random();
        }

        System.out.print("First name: ");
        String firstName = keyboard.nextLine().trim();
        while (firstName.isEmpty()) {
            System.out.print("First name cannot be empty. First name: ");
            firstName = keyboard.nextLine().trim();
        }
        System.out.print("Last name: ");
        String lastName = keyboard.nextLine().trim();
        while (lastName.isEmpty()) {
            System.out.print("Last name cannot be empty. Last name: ");
            lastName = keyboard.nextLine().trim();
        }

        String username = firstName.substring(0, 1).toLowerCase()
                + lastName.toLowerCase().replaceAll("\\s+", "")
                + String.format("%02d", random.nextInt(100));

        int passwordLength;
        do {
            System.out.print("Password length (8-16): ");
            passwordLength = keyboard.nextInt();
            if (passwordLength < 8 || passwordLength > 16) {
                System.out.println("Length must be between 8 and 16.");
            }
        } while (passwordLength < 8 || passwordLength > 16);

        String allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?#$%&";
        StringBuilder password = new StringBuilder();
        int uppercaseCount = 0;
        int digitCount = 0;
        for (int i = 0; i < passwordLength; i++) {
            char character = allowed.charAt(random.nextInt(allowed.length()));
            password.append(character);
            if (character >= 'A' && character <= 'Z') {
                uppercaseCount++;
            }
            if (character >= '0' && character <= '9') {
                digitCount++;
            }
        }

        String strength = passwordLength >= 12 && uppercaseCount > 0 && digitCount > 0
                ? "STRONG" : "WEAK";
        String visiblePassword = password.toString();
        String maskedPassword = visiblePassword.charAt(0)
                + "*".repeat(passwordLength - 2)
                + visiblePassword.charAt(passwordLength - 1);

        System.out.printf("%n%-10s: %s%n%-10s: %s%n%-10s: %d%n%-10s: %d%n%-10s: %s%n",
                "Username", username, "Password", visiblePassword,
                "Uppercase", uppercaseCount, "Digits", digitCount, "Strength", strength);
        System.out.println("Masked password: " + maskedPassword);
        keyboard.close();
    }
}
```

</details>

## [Peer Tutoring – T1W6](https://studentkdg.sharepoint.com/sites/MedewerkersTIFlexACS/INF_Curriculum/Forms/AllItems.aspx?id=%2Fsites%2FMedewerkersTIFlexACS%2FINF%5FCurriculum%2Fdomain%20%2D%20Software%2FY1%20%2D%20Programming%20Fundamentals%2FCurrent%2F2%2E%20Course%20material%2FPeertutoring%2FACS%2FPeer%20Tutoring%20Exercise%20%2D%20T1W6%2Epdf&parent=%2Fsites%2FMedewerkersTIFlexACS%2FINF%5FCurriculum%2Fdomain%20%2D%20Software%2FY1%20%2D%20Programming%20Fundamentals%2FCurrent%2F2%2E%20Course%20material%2FPeertutoring%2FACS&p=true&ga=1)

### Assignment: Hangman

We are gradually developing a simple version of the word game Hangman. The exercise is structured in steps. Completing it entirely will be difficult; see it as a challenge and try to get as far as possible! Maybe with some tips from the tutors, you can finish it at home on your own.

### Hangman 1

Implement this version in the public `Main` class in the single source file used by the browser runner.

Ask the user for a word. Perform the following checks:

- The word can be a maximum of 10 letters long.
- The word must be at least 5 letters long.

Use a validation loop: keep asking for a word until the user has entered a word with an acceptable length.

Next, clear the screen by showing 20 empty lines. Then show the player (a person other than the user) a number of dots equal to the length of the word to be guessed.

The player may now make a few guesses. Each time, check whether the word the player enters matches the word to be guessed (case-insensitive).

If the player has not found the word after 5 turns, the game ends.

#### Example of operation

```text
Give a word (5-10 letters): exhibitions
Give a word (5-10 letters): pumpkin
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

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-tut-t1w6-hangman-1">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        final int MIN_LENGTH = 5;
        final int MAX_LENGTH = 10;
        String word;
        do {
            System.out.print("Give a word (5-10 letters): ");
            word = keyboard.nextLine().trim().toLowerCase();
        } while (word.length() < MIN_LENGTH || word.length() > MAX_LENGTH || !word.matches("[a-z]+"));

        System.out.print("\n".repeat(20));
        System.out.println("The word to search for: " + ".".repeat(word.length()));
        boolean guessed = false;
        int turns = 0;
        while (turns < 5 && !guessed) {
            System.out.print("Take a guess: ");
            String guess = keyboard.nextLine().trim();
            turns++;
            guessed = guess.equalsIgnoreCase(word);
            if (guessed) {
                System.out.printf("Congratulations, you guessed the word in %d turns!%n", turns);
            } else {
                System.out.println("WRONG!");
            }
        }
        if (!guessed) {
            System.out.println("You did not guess the word in five turns. The word was " + word + ".");
        }
        keyboard.close();
    }
}
```

</details>

### Hangman 2

Implement this version as a separate exercise in its own `Main.java` file. Start from the previous version, but keep only one public `Main` class in this file.

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
Give a word (5-10 letters): avocado










The word to search for: .......
Guess a letter: d
The word to search for: .....d.
Guess a letter: o
The word to search for: ..o..do
Guess a letter: v
The word to search for: .vo..do
Guess a letter: k
The word to search for: .vo..do
Guess a letter: a
The word to search for: avo.ado
Guess a letter: c
The word to search for: avocado
Congratulations, you guessed the word in 6 turns!
```

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-tut-t1w6-hangman-2">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        final int MIN_LENGTH = 5;
        final int MAX_LENGTH = 10;
        String word;
        do {
            System.out.print("Give a word (5-10 letters): ");
            word = keyboard.nextLine().trim().toLowerCase();
        } while (word.length() < MIN_LENGTH || word.length() > MAX_LENGTH || !word.matches("[a-z]+"));

        System.out.print("\n".repeat(20));
        StringBuilder progress = new StringBuilder(".".repeat(word.length()));
        boolean guessed = false;
        int turns = 0;

        while (turns < 8 && !guessed) {
            System.out.println("The word to search for: " + progress);
            System.out.print("Guess a letter: ");
            String input = keyboard.nextLine().trim().toLowerCase();
            if (input.length() != 1 || input.charAt(0) < 'a' || input.charAt(0) > 'z') {
                System.out.println("Please enter exactly one letter.");
                continue;
            }
            char guess = input.charAt(0);
            turns++;
            for (int i = 0; i < word.length(); i++) {
                if (word.charAt(i) == guess) {
                    progress.setCharAt(i, guess);
                }
            }
            System.out.println("The word to search for: " + progress);
            guessed = progress.indexOf(".") == -1;
        }

        if (guessed) {
            System.out.printf("Congratulations, you guessed the word in %d turns!%n", turns);
        } else {
            System.out.println("You used all 8 turns. The word was " + word + ".");
        }
        keyboard.close();
    }
}
```

</details>

### Hangman 3

Implement this version as a separate exercise in its own `Main.java` file. Keep only one public `Main` class in the file.

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

The `String` consists of 8 lines. Reveal one additional line after each incorrect guess. If all 8 lines have been shown and the word has not yet been guessed, the game ends with a message that the player has lost.

If the player guesses the word before the hangman is complete, they win.

#### Example of operation

```text
Give a word (5-10 letters): halloween










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
The word to search for: .....wee.
-----
| |
Guess a letter: u
The word to search for: ......wee.
-----
| |
| O
Guess a letter: h
The word to search for: h....wee.
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

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-tut-t1w6-hangman-3">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        final int MIN_LENGTH = 5;
        final int MAX_LENGTH = 10;
        final String HANGMAN =
                "----- \n" +
                "| | \n" +
                "| O \n" +
                "| /|\\\n" +
                "| | \n" +
                "| / \\\n" +
                "| \n" +
                "-------";
        final String[] HANGMAN_PARTS = HANGMAN.split("\\n");

        String word;
        do {
            System.out.print("Give a word (5-10 letters): ");
            word = keyboard.nextLine().trim().toLowerCase();
        } while (word.length() < MIN_LENGTH || word.length() > MAX_LENGTH || !word.matches("[a-z]+"));

        System.out.print("\\n".repeat(20));
        StringBuilder progress = new StringBuilder(".".repeat(word.length()));
        int wrongGuesses = 0;
        int turns = 0;
        boolean guessed = false;

        while (wrongGuesses < HANGMAN_PARTS.length && !guessed) {
            System.out.println("The word to search for: " + progress);
            System.out.print("Guess a letter: ");
            String input = keyboard.nextLine().trim().toLowerCase();
            if (input.length() != 1 || input.charAt(0) < 'a' || input.charAt(0) > 'z') {
                System.out.println("Please enter exactly one letter.");
                continue;
            }
            char guess = input.charAt(0);
            turns++;
            boolean found = false;
            for (int i = 0; i < word.length(); i++) {
                if (word.charAt(i) == guess) {
                    progress.setCharAt(i, guess);
                    found = true;
                }
            }
            if (!found) {
                wrongGuesses++;
            }
            System.out.println("The word to search for: " + progress);
            for (int i = 0; i < wrongGuesses; i++) {
                System.out.println(HANGMAN_PARTS[i]);
            }
            guessed = progress.indexOf(".") == -1;
        }

        if (guessed) {
            System.out.printf("Congratulations, you guessed the word in %d turns!%n", turns);
        } else {
            System.out.println("The hangman is complete. You lose. The word was " + word + ".");
        }
        keyboard.close();
    }
}
```

</details>
