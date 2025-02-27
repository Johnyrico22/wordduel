// Import Firebase modules (ES6 style)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, push, set, orderByChild, limitToLast, get, query } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase Configuration (DO NOT expose API keys in index.html)
const firebaseConfig = {
  apiKey: "AIzaSyCieuR8-ud_W4aCRfl5Z-OKtxQuHfDFIOQ",
  authDomain: "word-duel-a6eb9.firebaseapp.com",
  databaseURL: "https://word-duel-a6eb9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "word-duel-a6eb9",
  storageBucket: "word-duel-a6eb9.firebasestorage.app",
  messagingSenderId: "597092630133",
  appId: "1:597092630133:web:93ba5b90b311367e85023c",
  measurementId: "G-HJ83X7XWJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Game Module
const game = (() => {
  const correctSound = new Audio("sounds/correct.mp3");
  const wrongSound = new Audio("sounds/incorrect.mp3");
  let score = 0;
  let lives = 3;
  let timeLeft = 60;
  let timer;

  const startGame = () => {
    console.log("Game started!");

    score = 0;
    lives = 3;
    timeLeft = 60;

    document.getElementById("score").textContent = "Score: 0";
    document.getElementById("lives").textContent = "Lives: " + lives;
    document.getElementById("timer").textContent = "Time: " + timeLeft;

    document.getElementById("start-btn").style.display = "none";
    document.getElementById("timer").style.display = "block";
    document.getElementById("score-lives-container").style.display = "flex";
    document.getElementById("word-container").style.display = "block";
    document.getElementById("definition").style.display = "none";
    document.getElementById("result").style.display = "none";
    document.getElementById("final-score").style.display = "none";

    document.getElementById("instructions-container").classList.add("hidden");
    document.getElementById("prompt-container").style.display = "block";
    document.getElementById("prompt").style.display = "block";
    document.getElementById("leaderboard-container").style.display = "none";

    startCountdown();
    generateWordPair();
  };

  const startCountdown = () => {
    clearInterval(timer);

    const timerBar = document.getElementById("timer-bar");
    timerBar.style.width = "100%";

    timer = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        document.getElementById("timer").textContent = "Time: " + timeLeft;
        timerBar.style.width = (timeLeft / 60) * 100 + "%";
      } else {
        clearInterval(timer);
        endGame();
      }
    }, 1000);
  };

  const generateWordPair = () => {
    const pair = phonicsWords[Math.floor(Math.random() * phonicsWords.length)];
    const correctWord = pair[0];
    const incorrectWord = pair[1];
    const sentence = pair[2];

    const options = [correctWord, incorrectWord];
    options.sort(() => Math.random() - 0.5);

    const button1 = document.getElementById("option1");
    const button2 = document.getElementById("option2");

    document.getElementById("prompt").textContent = sentence.replace("__________", "_____");
    document.getElementById("prompt").style.display = "block";

    button1.textContent = options[0];
    button2.textContent = options[1];

    [button1, button2].forEach(button => {
      button.style.backgroundColor = "#007bff";
      button.innerHTML = button.textContent;
      button.onclick = () => checkAnswer(button, correctWord, sentence.replace("__________", correctWord));
    });
  };

  const launchConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const checkAnswer = (selectedButton, correctWord, definition) => {
    const isCorrect = selectedButton.textContent === correctWord;

    document.getElementById("option1").disabled = true;
    document.getElementById("option2").disabled = true;

    if (isCorrect) {
      launchConfetti();
      correctSound.play();
      score++;
      document.getElementById("score").textContent = "Score: " + score;
      selectedButton.style.backgroundColor = "#28a745";
      selectedButton.innerHTML = "&#10004;";
    } else {
      wrongSound.play();
      lives--;
      document.getElementById("lives").textContent = "Lives: " + lives;
      selectedButton.style.backgroundColor = "#d32f2f";
      selectedButton.innerHTML = "&#10008;";

      if (lives === 0) {
        setTimeout(endGame, 1000);
        return;
      }
    }

    setTimeout(() => {
      generateWordPair();
      document.getElementById("option1").disabled = false;
      document.getElementById("option2").disabled = false;
    }, 1000);
  };

  const endGame = () => {
    clearInterval(timer);

    document.getElementById("prompt-container").style.display = "none";
    document.getElementById("word-container").style.display = "none";
    document.getElementById("score-lives-container").style.display = "none";
    document.getElementById("timer").style.display = "none";

    document.getElementById("result").textContent = "Game Over!";
    document.getElementById("result").style.fontSize = "32px";
    document.getElementById("result").style.display = "block";

    document.getElementById("final-score").textContent = "Final Score: " + score;
    document.getElementById("final-score").style.display = "block";

    // Check if the score is within the top 10
    get(query(ref(database, "leaderboard"), orderByChild("score"), limitToLast(100)))
      .then(snapshot => {
        const scores = [];
        snapshot.forEach(childSnapshot => {
          const entry = childSnapshot.val();
          scores.push({ name: entry.name, score: entry.score });
        });

        // Filter out duplicate usernames and keep only the highest score for each unique username
        const uniqueScores = scores.reduce((acc, current) => {
          const x = acc.find(item => item.name === current.name);
          if (!x) {
            return acc.concat([current]);
          } else if (x.score < current.score) {
            return acc.map(item => item.name === current.name ? current : item);
          } else {
            return acc;
          }
        }, []);

        // Sort scores in descending order and take the top 10
        uniqueScores.sort((a, b) => b.score - a.score);
        const topScores = uniqueScores.slice(0, 10);

        // Check if the current score is within the top 10
        if (topScores.length < 10 || score > topScores[topScores.length - 1].score) {
          // If within top 10, show the username input field
          document.getElementById("username-container").style.display = "block";
        } else {
          // If not within top 10, show the leaderboard and play again button
          document.getElementById("leaderboard-container").style.display = "block";
          document.getElementById("start-btn").style.display = "block";
        }
      })
      .catch(error => {
        console.error("Error checking leaderboard:", error);
      });
  };

  return {
    startGame,
    startCountdown,
    generateWordPair,
    checkAnswer,
    endGame,
    getScore: () => score // Add this getter to access the score
  };
})();

// Leaderboard Module
const leaderboard = (() => {
  const submitScore = (name, score) => {
    console.log("Submitting score:", score); // Debugging statement
    const newEntry = push(ref(database, "leaderboard"));
    set(newEntry, {
      name: name,
      score: score,
      timestamp: new Date().toISOString()
    }).catch(error => {
      console.error("Error submitting score:", error);
    });
  };

  const loadLeaderboard = () => {
    const leaderboardList = document.getElementById("leaderboard");
    leaderboardList.innerHTML = "";

    get(query(ref(database, "leaderboard"), orderByChild("score"), limitToLast(100)))
      .then(snapshot => {
        const scores = [];

        snapshot.forEach(childSnapshot => {
          const entry = childSnapshot.val();
          scores.push({ name: entry.name, score: entry.score });
        });

        // Filter out duplicate usernames and keep only the highest score for each unique username
        const uniqueScores = scores.reduce((acc, current) => {
          const x = acc.find(item => item.name === current.name);
          if (!x) {
            return acc.concat([current]);
          } else if (x.score < current.score) {
            return acc.map(item => item.name === current.name ? current : item);
          } else {
            return acc;
          }
        }, []);

        // Sort scores in descending order and take the top 10
        uniqueScores.sort((a, b) => b.score - a.score);
        const topScores = uniqueScores.slice(0, 10);

        topScores.forEach(entry => {
          const li = document.createElement("li");
          li.textContent = `${entry.name}: ${entry.score}`;
          leaderboardList.appendChild(li);
        });
      })
      .catch(error => {
        console.error("Error loading leaderboard:", error);
      });
  };

  return {
    submitScore,
    loadLeaderboard
  };
})();

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start-btn").addEventListener("click", () => {
    console.log("Start button clicked!");
    game.startGame();
  });

  leaderboard.loadLeaderboard();
});

document.getElementById("submit-score-btn").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim().substring(0, 10);
  const score = game.getScore(); // Get the current score

  console.log("Username:", username); // Debugging statement
  console.log("Score:", score); // Debugging statement

  if (!username) {
    alert("Please enter a valid name.");
    return;
  }

  if (containsBadWord(username)) {
    alert("Inappropriate username detected. Please enter a different name.");
    return;
  }

  leaderboard.submitScore(username, score);
  leaderboard.loadLeaderboard();

  document.getElementById("username-container").style.display = "none";
  document.getElementById("leaderboard-container").style.display = "block";
  document.getElementById("start-btn").style.display = "block";
});

document.getElementById("skip-score-btn").addEventListener("click", () => {
  document.getElementById("username-container").style.display = "none";
  game.startGame();
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("game-container").style.opacity = "1";
});
