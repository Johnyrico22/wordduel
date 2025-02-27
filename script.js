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

// Load leaderboard on page load
window.onload = function() {
    loadLeaderboard();
};

// Global variables
let score = 0;
let lives = 3;
let timeLeft = 60;
let timer;

// Sounds
const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/incorrect.mp3");

// Attach event listeners once DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("start-btn").addEventListener("click", startGame);
    document.getElementById("submit-score-btn").addEventListener("click", submitUsername);
    document.getElementById("skip-score-btn").addEventListener("click", function () {
        document.getElementById("username-container").style.display = "none";
        startGame();
    });

    document.getElementById("game-container").style.opacity = "1"; // Ensure smooth loading animation
});

// Start the game
function startGame() {
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
    document.getElementById("result").style.display = "none";
    document.getElementById("final-score").style.display = "none";

    document.getElementById("prompt-container").style.display = "block";

    document.getElementById("leaderboard-container").style.display = "none";
    document.getElementById("username-container").style.display = "none";

    document.getElementById("option1").disabled = false;
    document.getElementById("option2").disabled = false;

    startCountdown();
    generateWordPair();
}

// Start countdown timer
function startCountdown() {
    clearInterval(timer);
    let timerBar = document.getElementById("timer-bar");
    timerBar.style.width = "100%";

    timer = setInterval(function () {
        if (timeLeft > 0) {
            timeLeft--;
            document.getElementById("timer").textContent = "Time: " + timeLeft;
            timerBar.style.width = (timeLeft / 60) * 100 + "%";
        } else {
            clearInterval(timer);
            endGame();
        }
    }, 1000);
}

// Generate word pair
function generateWordPair() {
    let pair = phonicsWords[Math.floor(Math.random() * phonicsWords.length)];
    let correctWord = pair[0];
    let incorrectWord = pair[1];
    let sentence = pair[2];

    let options = [correctWord, incorrectWord];
    options.sort(() => Math.random() - 0.5);

    let button1 = document.getElementById("option1");
    let button2 = document.getElementById("option2");

    document.getElementById("prompt").textContent = sentence.replace("__________", "_____");

    button1.textContent = options[0];
    button2.textContent = options[1];

    [button1, button2].forEach(button => {
        button.style.backgroundColor = "#007bff";
        button.innerHTML = button.textContent;
        button.onclick = function () {
            checkAnswer(button, correctWord);
        };
    });
}

// Check answer
function checkAnswer(selectedButton, correctWord) {
    let isCorrect = selectedButton.textContent === correctWord;

    document.getElementById("option1").disabled = true;
    document.getElementById("option2").disabled = true;

    if (isCorrect) {
        score++;
        document.getElementById("score").textContent = "Score: " + score;
        selectedButton.style.backgroundColor = "#28a745";
        launchConfetti();
        correctSound.play();
    } else {
        lives--;
        document.getElementById("lives").textContent = "Lives: " + lives;
        selectedButton.style.backgroundColor = "#d32f2f";
        wrongSound.play();

        if (lives === 0) {
            setTimeout(endGame, 1000);
            return;
        }
    }

    setTimeout(generateWordPair, 1000);
}

// End the game
function endGame() {
    clearInterval(timer);

    document.getElementById("prompt-container").style.display = "none";
    document.getElementById("word-container").style.display = "none";
    document.getElementById("score-lives-container").style.display = "none";

    document.getElementById("result").textContent = "Game Over!";
    document.getElementById("result").style.display = "block";
    document.getElementById("final-score").textContent = "Final Score: " + score;
    document.getElementById("final-score").style.display = "block";

    document.getElementById("leaderboard-container").style.display = "block";
    loadLeaderboard();
}

// Submit score to Firebase
function submitUsername() {
    let username = document.getElementById("username").value.trim().substring(0, 10);

    if (!username || containsBadWord(username)) {
        alert("Invalid or inappropriate username. Please try again.");
        return;
    }

    let newEntry = push(ref(database, "leaderboard"));
    set(newEntry, { name: username, score: score, timestamp: new Date().toISOString() });

    document.getElementById("username-container").style.display = "none";
    loadLeaderboard();
}

// Load leaderboard
function loadLeaderboard() {
    let leaderboardList = document.getElementById("leaderboard");
    leaderboardList.innerHTML = "";

    get(query(ref(database, "leaderboard"), orderByChild("score"), limitToLast(10)))
    .then(snapshot => {
        let scores = [];
        snapshot.forEach(childSnapshot => {
            let entry = childSnapshot.val();
            scores.push({ name: entry.name, score: entry.score });
        });

        scores.sort((a, b) => b.score - a.score);
        scores.forEach(entry => {
            let li = document.createElement("li");
            li.textContent = `${entry.name}: ${entry.score}`;
            leaderboardList.appendChild(li);
        });
    });
}
