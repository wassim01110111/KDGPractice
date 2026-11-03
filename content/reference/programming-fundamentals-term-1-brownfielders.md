# Programming Fundamentals — Term 1 Brownfielders

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

<details>
<summary>***Show solution***</summary>

**t1w2.java**

```java
package t1w2;

import java.util.Random;
import java.util.Scanner;

public class t1w2 {
    public static void main() {
        Scanner keyboard = new Scanner(System.in);
        boolean playAgain = true;
        Random random = new Random();
        while (playAgain) {
            int maxNumber = random.nextInt(5) + 2;
            int initialNumber = (random.nextInt(3) + 5) * maxNumber;
            boolean playerTurn = random.nextBoolean();
            while (initialNumber > 0) {
                System.out.println("%d matches left!".formatted(initialNumber));
                playerTurn = !playerTurn;
                int playerChoice = 0;
                int matchesTaken;
                if (playerTurn) {
                    while (playerChoice <= 0 || playerChoice > maxNumber) {
                        System.out.println("Pick a number between 1 and %d".formatted(maxNumber));
                        playerChoice = keyboard.nextInt();
                    }
                    matchesTaken = playerChoice;
                } else {
                    matchesTaken = (initialNumber - 1) % (maxNumber + 1);
                    System.out.println("The bot picked %d matches".formatted(matchesTaken));

                }
                initialNumber -= matchesTaken;
            }
            if (playerTurn) {
                System.out.println("You lost!! :(");
            } else {
                System.out.println("You won!! :)");
            }
            System.out.println("Do you want to play again? (y/n)");
            String answer = keyboard.next();

            playAgain = answer.equalsIgnoreCase("y");
        }
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

<details>
<summary>***Show solution***</summary>

**t1w3.java**

```java
package t1w3;

import java.util.Random;
import java.util.Scanner;

public class t1w3 {
    static Random random = new Random();
    static int dieSide = 8;
    static Scanner keyboard = new Scanner(System.in);

    public static void main() {
        int botPoint = 0;
        int userPoint = 0;
        boolean playerTurn = random.nextBoolean();
        boolean playAgain = true;
        while (playAgain) {
            while (userPoint < 101 && botPoint < 101) {

                playerTurn = !playerTurn;
                if (playerTurn) {
                    int score = rollingDice(true, userPoint);
                    if (score != 0) {
                        userPoint = score;
                        if (userPoint > 101) {
                            break;
                        }
                    }
                } else {
                    int score = rollingDice(false, botPoint);
                    if (score != 0) {
                        botPoint = score;
                        if (botPoint > 101) {
                            break;
                        }
                    }
                }
            }
            if (botPoint > 101) {
                System.out.println("The bot has over 101 points, you lost :(");
            } else {
                System.out.println("You have over 101 points, you won :)");
            }
            System.out.println("Do you want to play again? (y/n)");
            String answer = keyboard.next();

            playAgain = answer.equalsIgnoreCase("y");
        }
    }

    public static int rollingDice(boolean user, int res) {
        boolean rolling = true;
        while (rolling) {
            int roll = random.nextInt(dieSide) + 1;
            if (roll == 6) {
                System.out.println("%s rolled a 6, no score this turn".formatted(user ? "You" : "The bot"));
                return 0;
            }
            res += roll;
            if (user) {
                System.out.println(
                        "You rolled %d, for a total of %d, would you like to roll again? (y/n)".formatted(roll, res));
                String answer = keyboard.next();
                rolling = answer.equalsIgnoreCase("y");
            } else {
                rolling = random.nextBoolean();
                System.out.println(
                        "The bot rolled %d, for a total of %d".formatted(roll, res));
            }
        }
        return res;
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

<details>
<summary>***Show solution***</summary>

**t1w4.java**

```java
package t1w4;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.Scanner;

public class t1w4 {
    static int dieSide = 6;
    static Random random = new Random();
    static Scanner keyboard = new Scanner(System.in);

    public static void main() {
        boolean playAgain = true;
        while (playAgain) {
            StringBuilder botScore = new StringBuilder("XXX");
            StringBuilder userScore = new StringBuilder("XXX");
            Map<Character, Integer> placement = new HashMap<>();
            int halfThreshold = '0' + (dieSide / 2);
            int upperHalf = '0' + (dieSide * 2 / 3);
            int bigThreshold = upperHalf + 1;
            placement.put('o', 2);
            placement.put('t', 1);
            placement.put('h', 0);
            int placementLeft = 3;
            for (int i = 0; i < 2; i++) {
                char score = dieThrow();
                char choice = 'X';
                while (!placement.containsKey(choice)) {
                    System.out.println(
                            "You got %d, would you like to place it in %s%s%s%s?".formatted(charToInt(score),
                                    userScore.charAt(2) == 'X' ? "the once (o)" : "",
                                    userScore.charAt(2) == 'X' && userScore.charAt(1) == 'X' ? ", " : "",
                                    userScore.charAt(1) == 'X' ? "the ten (t)" : "",
                                    userScore.charAt(0) == 'X' ? ", the hundred (h)" : ""));
                    choice = keyboard.next().charAt(0);
                }
                placementLeft -= placement.get(choice);
                userScore.setCharAt(placement.get(choice), score);
                placement.remove(choice);
            }
            char score = dieThrow();
            userScore.setCharAt(placementLeft, score);
            System.err.println("You got %d, your final score is %s".formatted(charToInt(score), userScore.toString()));
            placementLeft = 3;

            char firstThrow = dieThrow();
            int botPosition;
            if (firstThrow >= bigThreshold) {
                botPosition = 0;
            } else if (firstThrow >= halfThreshold) {
                botPosition = 1;
            } else {
                botPosition = 2;
            }
            placementLeft -= botPosition;
            botScore.setCharAt(botPosition, firstThrow);
            char secondThrow = dieThrow();
            if (secondThrow >= upperHalf && botScore.charAt(0) == 'X') {
                botPosition = 0;
            } else if ((secondThrow >= upperHalf && botScore.charAt(1) == 'X') || botScore.charAt(2) != 'X') {
                botPosition = 1;
            } else {
                botPosition = 2;
            }
            placementLeft -= botPosition;
            botScore.setCharAt(botPosition, secondThrow);

            char lastThrow = dieThrow();
            botScore.setCharAt(placementLeft, lastThrow);
            int finalBot = Integer.parseInt(botScore.toString());
            int finalUser = Integer.parseInt(userScore.toString());
            System.out.println("The bot got %d".formatted(finalBot));
            if (finalUser > finalBot) {
                System.out.println("You win!!! :))");
            } else {
                System.out.println("You lost!!! :))");
            }
            System.out.println("Do you want to play again? (y/n)");
            String answer = keyboard.next();

            playAgain = answer.equalsIgnoreCase("y");
        }
    }

    public static char dieThrow() {
        int score = random.nextInt(dieSide) + 1;
        return (char) ('0' + score);
    }

    public static int charToInt(char number) {
        return number - '0';
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

<details>
<summary>***Show solution***</summary>

**t1w5.java**

```java
package t1w5;

import java.util.Random;
import java.util.Scanner;

public class t1w5 {
    static Scanner keyboard = new Scanner(System.in);
    static LetterBag letterBag = new LetterBag();

    public static void main() {
        boolean playAgain = true;
        while (playAgain) {
            System.out.println("Type out a word: ");
            String word = keyboard.nextLine();
            word = word.toLowerCase().replaceAll("[^a-z]", "");
            Player user = new Player(word, "the player");
            Player bot = new Player(word, "the computer");
            Player[] playerTurn = { user, bot };
            int currentPlayer = 0;
            while (!user.note.allLettersDeleted() && !bot.note.allLettersDeleted()) {
                char newLetter = letterBag.newLetter();
                Player temp = playerTurn[currentPlayer];
                Player opps = playerTurn[1 - currentPlayer];
                System.out.println("%s drew %s! Your current word is: %s. The computer's is: %s"
                        .formatted(temp.name, String.valueOf(newLetter), user.note.tostring(),
                                bot.note.tostring()));
                if (temp.note.letterInWord(newLetter)) {
                    System.out.println("%s has the letter, deleting it".formatted(temp.name));
                    temp.note.deleteLetter(newLetter, false);
                } else if (opps.note.letterInWord(newLetter)) {
                    temp.note.notAppeared++;
                    System.out.println("%s doesn't have the letter, but %s has it, deleting it"
                            .formatted(temp.name, opps.name));
                    opps.note.deleteLetter(newLetter, true);

                } else {
                    temp.note.notAppeared++;
                    System.out.println("Neither have the letter, adding it to %s".formatted(temp.name));
                    temp.note.addLetter(newLetter);
                }
                currentPlayer = 1 - currentPlayer;

                System.out.println("Press enter to continue");
                keyboard.nextLine();

            }

            if (user.note.allLettersDeleted()) {
                System.out.println("You ran out of letters, you win! :))");
            } else {
                System.out.println("The computer ran out of letters first, you lose! :((");
            }
            System.out.println("Do you want to play again? (y/n)");
            String answer = keyboard.next();
            playAgain = answer.equalsIgnoreCase("y");

        }
    }
}

class LetterBag {
    static Random random = new Random();

    char newLetter() {
        return (char) ('a' + random.nextInt(26));
    }
}

class Note {
    StringBuilder theWord;
    int lettersDeleted = 0;
    int neighborHelp = 0;
    int lettersAdded = 0;
    int notAppeared = 0;

    Note(String initialWord) {
        theWord = new StringBuilder(initialWord);
    }

    boolean letterInWord(char letter) {
        for (int i = 0; i < theWord.length(); i++) {
            if (letter == theWord.charAt((i))) {
                return true;
            }
        }
        return false;
    }

    void deleteLetter(char letter, boolean neighbor) {
        for (int i = 0; i < theWord.length(); i++) {
            if (letter == theWord.charAt((i))) {
                theWord.deleteCharAt(i);
                if (neighbor) {
                    neighborHelp++;
                } else {
                    lettersDeleted++;
                }
                return;
            }
        }
    }

    void addLetter(char letter) {
        lettersAdded++;
        theWord.append(letter);
    }

    boolean allLettersDeleted() {
        return theWord.length() == 0;
    }

    String tostring() {
        return theWord.toString();
    }
}

class Player {
    Note note;
    String name;

    Player(String initialWord, String userName) {
        note = new Note(initialWord);
        name = userName;
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

<details>
<summary>***Show solution***</summary>

**t2w1.java**

```java
package t2w1;

import java.util.ArrayList;
import java.util.Random;
import java.util.Scanner;

public class t2w1 {
    static Scanner keyboard = new Scanner(System.in);

    public static void main() {
        boolean playAgain = true;

        while (playAgain) {
            System.out.println("\n========== NEW GAME ==========");

            Simulation simulation = new Simulation(10);
            simulation.main();

            System.out.println("\nDo you want to play again? (y/n)");
            String answer = keyboard.next();
            playAgain = answer.equalsIgnoreCase("y");
        }

        keyboard.close();
        System.out.println("Program ended.");
    }
}

class Dice {
    Random random = new Random();
    int dieSide = 6;

    int roll() {
        int result = random.nextInt(dieSide) + 1;
        System.out.println(String.format("[DICE] Rolled: %d", result));
        return result;
    }
}

class Jar {
    int stolenCoins = 0;
}

class Player {
    int numberOfCoins;

    Player(int iniCoins) {
        numberOfCoins = iniCoins;
    }
}

class GameTable {
    Jar jar = new Jar();
    ArrayList<Player> players;

    GameTable(int numberOfPlayers, int iniCoins) {
        players = new ArrayList<>();

        for (int i = 0; i < numberOfPlayers; i++) {
            players.add(new Player(iniCoins));
        }

        System.out.println(String.format(
                "[TABLE] Created %d players with %d coins each.",
                numberOfPlayers,
                iniCoins));
    }

    void giveCoin(int index, int receiver) {
        System.out.println(String.format(
                "[COIN] Player %d gives 1 coin to Player %d",
                index,
                receiver));

        System.out.println(String.format(
                "[COIN] Before: Player %d = %d, Player %d = %d",
                index,
                players.get(index).numberOfCoins,
                receiver,
                players.get(receiver).numberOfCoins));

        players.get(index).numberOfCoins--;
        players.get(receiver).numberOfCoins++;

        System.out.println(String.format(
                "[COIN] After: Player %d = %d, Player %d = %d",
                index,
                players.get(index).numberOfCoins,
                receiver,
                players.get(receiver).numberOfCoins));
    }

    void toJar(int index) {
        System.out.println(String.format(
                "[JAR] Player %d puts 1 coin in the jar.",
                index));

        players.get(index).numberOfCoins--;
        jar.stolenCoins++;

        System.out.println(String.format(
                "[JAR] Player %d now has %d coins.",
                index,
                players.get(index).numberOfCoins));

        System.out.println(String.format(
                "[JAR] Jar contains %d coins.",
                jar.stolenCoins));

        if (players.get(index).numberOfCoins <= 0) {
            System.out.println(String.format(
                    "[JAR] Player %d has no coins left!",
                    index));

            System.out.println(String.format(
                    "[JAR] Returning %d jar coins to Player %d.",
                    jar.stolenCoins,
                    index));

            players.get(index).numberOfCoins = jar.stolenCoins;
            jar.stolenCoins = 0;

            System.out.println(String.format(
                    "[JAR] Player %d now has %d coins.",
                    index,
                    players.get(index).numberOfCoins));
        }
    }

    boolean removeBroke(int index) {
        if (players.get(index).numberOfCoins > 0) {
            System.out.println(String.format(
                    "[CHECK] Player %d still has %d coins.",
                    index,
                    players.get(index).numberOfCoins));

            return true;
        } else {
            System.out.println(String.format(
                    "[REMOVE] Player %d is broke and is removed!",
                    index));

            players.remove(index);

            System.out.println(String.format(
                    "[REMOVE] Players remaining: %d",
                    players.size()));

            return false;
        }
    }
}

class Simulation {
    int playerCount = 5;
    Dice dice = new Dice();
    int initialCoins;

    Simulation(int iniCoins) {
        initialCoins = iniCoins;
    }

    void main() {
        int prevPlayer = playerCount - 1;
        int currentPlayer = 0;
        int nextPlayer = 1;

        GameTable gameTable = new GameTable(playerCount, initialCoins);

        System.out.println(String.format(
                "[GAME] Starting game with %d players.",
                playerCount));

        while (playerCount > 1) {

            System.out.println("\n----------------------------");

            System.out.println(String.format(
                    "[TURN] Current player: %d",
                    currentPlayer));

            System.out.println(String.format(
                    "[TURN] Previous player: %d",
                    prevPlayer));

            System.out.println(String.format(
                    "[TURN] Next player: %d",
                    nextPlayer));

            System.out.println(String.format(
                    "[TURN] Players in game: %d",
                    playerCount));

            int roll = dice.roll();

            boolean checkCoin = false;

            if (roll == 4) {
                System.out.println(
                        "[ACTION] Roll = 4 -> give coin to previous player.");

                gameTable.giveCoin(currentPlayer, prevPlayer);
                checkCoin = true;

            } else if (roll == 5) {
                System.out.println(
                        "[ACTION] Roll = 5 -> give coin to next player.");

                gameTable.giveCoin(currentPlayer, nextPlayer);
                checkCoin = true;

            } else if (roll == 6) {
                System.out.println(
                        "[ACTION] Roll = 6 -> put coin in jar.");

                gameTable.toJar(currentPlayer);
                checkCoin = true;

            } else {
                System.out.println(String.format(
                        "[ACTION] Roll = %d -> nothing happens.",
                        roll));
            }

            System.out.println(String.format(
                    "[STATE] checkCoin = %b",
                    checkCoin));

            if (checkCoin && !gameTable.removeBroke(currentPlayer)) {

                System.out.println(String.format(
                        "[GAME] Player %d was removed.",
                        currentPlayer));

                playerCount--;

                System.out.println(String.format(
                        "[GAME] Player count is now: %d",
                        playerCount));

                if (prevPlayer >= playerCount) {
                    System.out.println(
                            "[INDEX] Adjusting previous player.");

                    prevPlayer--;
                }

                currentPlayer = prevPlayer + 1;

                if (currentPlayer >= playerCount) {
                    currentPlayer = 0;
                }

                nextPlayer = currentPlayer + 1;

                if (nextPlayer >= playerCount) {
                    nextPlayer = 0;
                }

                System.out.println(String.format(
                        "[INDEX] After removal: Previous = %d, Current = %d, Next = %d",
                        prevPlayer,
                        currentPlayer,
                        nextPlayer));

            } else {

                System.out.println("[TURN] Moving to next player.");

                prevPlayer = currentPlayer;
                currentPlayer = nextPlayer;

                nextPlayer++;

                if (nextPlayer >= playerCount) {
                    nextPlayer = 0;
                }

                System.out.println(String.format(
                        "[INDEX] After turn: Previous = %d, Current = %d, Next = %d",
                        prevPlayer, currentPlayer, nextPlayer));
            }
        }

        System.out.println("\n========== GAME OVER ==========");

        System.out.println(String.format(
                "[GAME] Remaining players: %d",
                playerCount));

        if (gameTable.players.size() == 1) {
            System.out.println(String.format(
                    "[GAME] Winner has %d coins.",
                    gameTable.players.get(0).numberOfCoins));
        }
    }
}
```

</details>
