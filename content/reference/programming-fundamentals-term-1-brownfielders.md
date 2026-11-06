# Programming Fundamentals: Term 1 Brownfielders

**Single-file browser implementation:** Each exercise is submitted as one Java source file named `Main.java`. Do not add a `package` declaration or create additional `.java` files. When a task needs several classes, declare them as package-private classes in the same source file as `public class Main`.
Solutions are hidden by default. Expand **\***Show solution**\*** to view the Java code.

🔗 [Original exercise sheet](https://studentkdg.sharepoint.com/sites/MedewerkersTIFlexACS/INF_Curriculum/Forms/AllItems.aspx?id=%2Fsites%2FMedewerkersTIFlexACS%2FINF%5FCurriculum%2Fdomain%20%2D%20Software%2FY1%20%2D%20Programming%20Fundamentals%2FCurrent%2F2%2E%20Course%20material%2FExtra%2FOefeningen%20voor%20Brownfielders%2FACS%2FChallenges%20for%20Brownfielders%2Epdf&parent=%2Fsites%2FMedewerkersTIFlexACS%2FINF%5FCurriculum%2Fdomain%20%2D%20Software%2FY1%20%2D%20Programming%20Fundamentals%2FCurrent%2F2%2E%20Course%20material%2FExtra%2FOefeningen%20voor%20Brownfielders%2FACS&p=true&ga=1)

## Week T1W2: Variables and operators

### Challenge: Nimb

**Basic version:** There are 21 matches. Two players (the computer and one human player) take turns removing between 1 and 3 matches. Whoever takes the last match loses. The player chooses who goes first.

**Extended version:**

- Randomly determine who starts.
- Randomly determine `initialNumber` and `maxNumber`, ensuring `initialNumber` is at least five times `maxNumber`.
- Ask whether the player wants to play again after each game.

**Coding tip:** A winning strategy is `(number - 1) % (maxNumber + 1)`.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-bf-t1w2-nimb">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Random;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        Random random = new Random();
        boolean playAgain;

        do {
            int maxNumber = 3;
            int matches = 21;
            System.out.print("Use random extended settings? (y/n): ");
            if (keyboard.next().equalsIgnoreCase("y")) {
                maxNumber = random.nextInt(5) + 2;
                matches = (random.nextInt(3) + 5) * maxNumber;
            }

            System.out.printf("There are %d matches. You may take 1 to %d.%n", matches, maxNumber);
            System.out.print("Who starts? (1 = you, 2 = computer, 3 = random): ");
            int starter = keyboard.nextInt();
            while (starter < 1 || starter > 3) {
                System.out.print("Choose 1, 2, or 3: ");
                starter = keyboard.nextInt();
            }
            boolean humanTurn = starter == 1 || (starter == 3 && random.nextBoolean());

            while (matches > 0) {
                System.out.printf("%d matches left.%n", matches);
                int taken;
                if (humanTurn) {
                    int choice;
                    do {
                        System.out.printf("Take 1 to %d matches: ", Math.min(maxNumber, matches));
                        choice = keyboard.nextInt();
                    } while (choice < 1 || choice > maxNumber || choice > matches);
                    taken = choice;
                    System.out.printf("You take %d match(es).%n", taken);
                } else {
                    // Leave a losing position (1 modulo maxNumber + 1) to the human.
                    taken = (matches - 1) % (maxNumber + 1);
                    // If the current position is already losing, no winning move exists.
                    // Taking one is legal and, importantly, prevents a zero-move loop.
                    if (taken == 0) {
                        taken = 1;
                    }
                    taken = Math.min(taken, matches);
                    System.out.printf("The computer takes %d match(es).%n", taken);
                }
                matches -= taken;
                if (matches == 0) {
                    System.out.println(humanTurn
                            ? "You took the last match. You lose!"
                            : "The computer took the last match. You win!");
                    break;
                }
                humanTurn = !humanTurn;
            }

            System.out.print("Do you want to play again? (y/n): ");
            playAgain = keyboard.next().equalsIgnoreCase("y");
        } while (playAgain);
        keyboard.close();
    }
}
```

</details>

## Week T1W3: Statements and flow control

### Challenge: 101

**Basic version:** Two players (one is the computer) take turns rolling a die. During a turn, a player may roll as often as desired. The rolls are added to the player's turn score. If a player rolls a 6, they lose the points accumulated during that turn and their turn ends. The first player to reach 101 points wins.

**Extended version:**

- Randomly determine who starts.
- Use a die with a different number of sides (8, 10, etc.) and a different target score.
- Ask whether the player wants to play again after each game.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-bf-t1w3-101">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Random;
import java.util.Scanner;

public class Main {
    private static final int TARGET_SCORE = 101;
    private static final int DIE_SIDES = 6;
    private static final Random RANDOM = new Random();

    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        boolean playAgain;
        do {
            int humanScore = 0;
            int computerScore = 0;
            boolean humanTurn = RANDOM.nextBoolean();
            System.out.printf("First to reach %d points wins.%n", TARGET_SCORE);
            System.out.println(humanTurn ? "You start." : "The computer starts.");

            while (humanScore < TARGET_SCORE && computerScore < TARGET_SCORE) {
                if (humanTurn) {
                    humanScore = takeTurn(true, humanScore, keyboard);
                    System.out.printf("Your score: %d | Computer: %d%n", humanScore, computerScore);
                } else {
                    computerScore = takeTurn(false, computerScore, keyboard);
                    System.out.printf("Computer score: %d | You: %d%n", computerScore, humanScore);
                }
                humanTurn = !humanTurn;
            }

            if (humanScore >= TARGET_SCORE) {
                System.out.println("You reached 101 points. You win!");
            } else {
                System.out.println("The computer reached 101 points. You lose.");
            }
            System.out.print("Do you want to play again? (y/n): ");
            playAgain = keyboard.next().equalsIgnoreCase("y");
        } while (playAgain);
        keyboard.close();
    }

    private static int takeTurn(boolean human, int bankedScore, Scanner keyboard) {
        int turnScore = 0;
        boolean continueRolling = true;
        while (continueRolling) {
            int roll = RANDOM.nextInt(DIE_SIDES) + 1;
            if (roll == 6) {
                System.out.printf("%s rolled a 6. The turn points are lost.%n", human ? "You" : "The computer");
                return bankedScore;
            }
            turnScore += roll;
            System.out.printf("%s rolled %d; turn total: %d.%n", human ? "You" : "The computer", roll, turnScore);
            if (human) {
                System.out.print("Roll again? (y/n): ");
                continueRolling = keyboard.next().equalsIgnoreCase("y");
            } else {
                continueRolling = RANDOM.nextBoolean();
            }
        }
        return bankedScore + turnScore;
    }
}
```

</details>

## Week T1W4: OO programming and objects

### Challenge: Highest house number

Each player rolls a die three times to create a three-digit house number (between 111 and 666). After each roll, the player chooses whether the result becomes the hundreds, tens, or units digit. The player with the highest house number wins.

**Computer strategy:**

- First roll: 5 or 6 → hundreds; 1 or 2 → units; 3 or 4 → tens.
- Second roll: 4, 5, or 6 → hundreds if available; otherwise use tens.

**Coding tip:** Use `StringBuilder` to build the house number, starting with a value containing three `X` characters.

**Expansion:** Use a different-sided die (4-, 8-, or 10-sided).

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-bf-t1w4-highest-house-number">Try exercise</a>

<details>
<summary>***Show solution***</summary>

```java
import java.util.Scanner;
import java.util.Random;

public class Main {
    private static final int DIE_SIDES = 6; // Try 4, 8 or 10 for the extension.
    private static final Random RANDOM = new Random();

    public static void main(String[] args) {
        Scanner keyboard = new Scanner(System.in);
        boolean playAgain;
        do {
            int[] human = {-1, -1, -1};
            int[] computer = {-1, -1, -1};

            for (int rollNumber = 1; rollNumber <= 3; rollNumber++) {
                int roll = rollDie();
                int position;
                if (rollNumber < 3) {
                    System.out.printf("You rolled %d. Available positions: %s%s%s%n", roll,
                            human[0] < 0 ? "hundreds (h) " : "",
                            human[1] < 0 ? "tens (t) " : "",
                            human[2] < 0 ? "units (u)" : "");
                    String choice;
                    do {
                        System.out.print("Choose h, t, or u: ");
                        choice = keyboard.next().toLowerCase();
                        position = switch (choice) {
                            case "h" -> 0;
                            case "t" -> 1;
                            case "u" -> 2;
                            default -> -1;
                        };
                    } while (position < 0 || human[position] >= 0);
                } else {
                    position = firstEmpty(human);
                }
                human[position] = roll;
            }
            System.out.println("Your house number is " + formatHouse(human) + ".");

            int first = rollDie();
            int botPosition = first >= Math.max(5, (DIE_SIDES * 5 / 6)) ? 0
                    : first <= Math.max(2, DIE_SIDES / 3) ? 2 : 1;
            computer[botPosition] = first;

            int second = rollDie();
            if (second >= (DIE_SIDES * 2 / 3) && computer[0] < 0) {
                botPosition = 0;
            } else if (computer[1] < 0) {
                botPosition = 1;
            } else {
                botPosition = firstEmpty(computer);
            }
            computer[botPosition] = second;
            computer[firstEmpty(computer)] = rollDie();

            System.out.println("The computer's house number is " + formatHouse(computer) + ".");
            int comparison = compareHouseNumbers(human, computer);
            if (comparison > 0) {
                System.out.println("You win!");
            } else if (comparison < 0) {
                System.out.println("The computer wins.");
            } else {
                System.out.println("It's a draw.");
            }
            System.out.print("Do you want to play again? (y/n): ");
            playAgain = keyboard.next().equalsIgnoreCase("y");
        } while (playAgain);
        keyboard.close();
    }

    private static int rollDie() {
        return RANDOM.nextInt(DIE_SIDES) + 1;
    }

    private static int firstEmpty(int[] slots) {
        for (int i = 0; i < slots.length; i++) {
            if (slots[i] < 0) {
                return i;
            }
        }
        throw new IllegalStateException("No empty digit position remains.");
    }

    private static int compareHouseNumbers(int[] first, int[] second) {
        for (int i = 0; i < first.length; i++) {
            if (first[i] != second[i]) {
                return Integer.compare(first[i], second[i]);
            }
        }
        return 0;
    }

    private static String formatHouse(int[] slots) {
        if (DIE_SIDES <= 9) {
            return "" + slots[0] + slots[1] + slots[2];
        }
        return slots[0] + "-" + slots[1] + "-" + slots[2];
    }
}
```

</details>

## Week T1W5: Writing classes

### Challenge: Word Hut Game

A word is chosen and written down by each player. Players take turns drawing a letter from a bag containing the 26 letters of the alphabet.

- If the drawn letter appears in the current player's word, that player deletes one occurrence.
- If the current player no longer has that letter but the other player does, the other player deletes one occurrence.
- If neither player has the letter, the current player adds it to their word.
- The first player whose word becomes empty wins.

Play against the computer, so there are two players.

**Coding tips:**

- After entering the word, create a `StringBuilder` for each player's note.
- Create classes such as `LetterBag`, `Note`, and `Player`.
- `LetterBag` should provide a method such as `newLetter()` that returns a random letter.
- `Note` should contain a `StringBuilder` and methods for checking, deleting, and adding letters, checking whether all letters are deleted, and returning the note as a string.

**Expansion:** Track for each player how many letters they deleted themselves, deleted with help from their neighbor, added to their note, and drew when the letter did not appear in the word.

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-bf-t1w5-word-hut-game">Try exercise</a>

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

## Week T2W1: Arrays

### Challenge: Simulation

Simulate a game in which each player starts with 10 coins. Players take turns rolling a die:

- 1, 2, or 3: nothing happens.
- 4: give one coin to the player on the left.
- 5: give one coin to the player on the right.
- 6: put one coin in a central jar. If this was the player's last coin, they receive the contents of the jar.

Players who run out of coins are eliminated. The last player remaining wins.

Simulate the game for multiple numbers of players and use an array to manage the players.

**Coding tip:** Create classes such as `Dice`, `Jar`, `Player` (with a `numberOfCoins` attribute), `GameTable` (with `jar` and `players` attributes), and `Simulation` (with a `main` method).

<a class="try-exercise-button" href="#/practice/programming-fundamentals-term-1-canvas/pf-term1-bf-t2w1-simulation">Try exercise</a>

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
            System.out.print("How many players (at least 2)? ");
            int numberOfPlayers = keyboard.nextInt();
            while (numberOfPlayers < 2) {
                System.out.print("Enter at least 2 players: ");
                numberOfPlayers = keyboard.nextInt();
            }
            Simulation simulation = new Simulation(numberOfPlayers, 10);
            simulation.play();
            System.out.print("Simulate another game with a possibly different number of players? (y/n): ");
            playAgain = keyboard.next().equalsIgnoreCase("y");
        } while (playAgain);
        keyboard.close();
    }
}

class Dice {
    private final Random random = new Random();

    int roll() {
        return random.nextInt(6) + 1;
    }
}

class Jar {
    int coins;
}

class Player {
    int numberOfCoins;

    Player(int startingCoins) {
        numberOfCoins = startingCoins;
    }
}

class GameTable {
    final Jar jar = new Jar();
    final Player[] players;
    int playerCount;

    GameTable(int numberOfPlayers, int startingCoins) {
        players = new Player[numberOfPlayers];
        playerCount = numberOfPlayers;
        for (int i = 0; i < numberOfPlayers; i++) {
            players[i] = new Player(startingCoins);
        }
    }

    void transferCoin(int from, int to) {
        players[from].numberOfCoins--;
        players[to].numberOfCoins++;
        System.out.printf("Player %d gives one coin to player %d.%n", from + 1, to + 1);
    }

    void putCoinInJar(int playerIndex) {
        players[playerIndex].numberOfCoins--;
        jar.coins++;
        System.out.printf("Player %d puts one coin in the jar (jar: %d).%n", playerIndex + 1, jar.coins);
        if (players[playerIndex].numberOfCoins == 0) {
            players[playerIndex].numberOfCoins += jar.coins;
            System.out.printf("Player %d used their last coin and receives the %d coin(s) in the jar.%n",
                    playerIndex + 1, jar.coins);
            jar.coins = 0;
        }
    }

    boolean eliminateIfBroke(int playerIndex) {
        if (players[playerIndex].numberOfCoins > 0) {
            return false;
        }
        System.out.printf("Player %d is eliminated.%n", playerIndex + 1);
        for (int i = playerIndex; i < playerCount - 1; i++) {
            players[i] = players[i + 1];
        }
        players[playerCount - 1] = null;
        playerCount--;
        return true;
    }
}

class Simulation {
    private final GameTable table;
    private final Dice dice = new Dice();

    Simulation(int numberOfPlayers, int startingCoins) {
        table = new GameTable(numberOfPlayers, startingCoins);
    }

    void play() {
        int currentPlayer = 0;
        while (table.playerCount > 1) {
            currentPlayer %= table.playerCount;
            int left = (currentPlayer - 1 + table.playerCount) % table.playerCount;
            int right = (currentPlayer + 1) % table.playerCount;
            int roll = dice.roll();
            System.out.printf("Player %d rolls %d. Coins: %d; jar: %d.%n", currentPlayer + 1, roll,
                    table.players[currentPlayer].numberOfCoins, table.jar.coins);

            switch (roll) {
                case 1, 2, 3 -> System.out.println("Nothing happens.");
                case 4 -> table.transferCoin(currentPlayer, left);
                case 5 -> table.transferCoin(currentPlayer, right);
                case 6 -> table.putCoinInJar(currentPlayer);
                default -> throw new IllegalStateException("Unexpected die roll.");
            }

            boolean eliminated = (roll == 4 || roll == 5) && table.eliminateIfBroke(currentPlayer);
            if (!eliminated && table.playerCount > 0) {
                currentPlayer = (currentPlayer + 1) % table.playerCount;
            }
        }
        System.out.printf("Game over. Player 1 in the remaining array is the winner with %d coin(s).%n",
                table.players[0].numberOfCoins);
    }
}
```

</details>
