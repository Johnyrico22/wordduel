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

//sounds
const correctSound = new Audio("sounds/correct.mp3");
const wrongSound = new Audio("sounds/incorrect.mp3");

// Load leaderboard on page load
window.onload = function() {
    loadLeaderboard();
};

let score = 0;
let lives = 3;
let timeLeft = 60;
let timer;

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("start-btn").addEventListener("click", function () {
        console.log("Start button clicked!");
        startGame();
    });

    loadLeaderboard(); // Load leaderboard on page load
});

document.getElementById("submit-score-btn").addEventListener("click", function() {
    let username = document.getElementById("username").value.trim().substring(0, 10);

    // ✅ Check if the name contains a banned word
    if (!username) {
        alert("Please enter a valid name.");
        return;
    }
    
    if (containsBadWord(username)) {
        alert("Inappropriate username detected. Please enter a different name.");
        return;
    }

    // ✅ If the name is clean, submit the score
    submitScore(username, score);
    loadLeaderboard();

    // Hide username input and show leaderboard
    document.getElementById("username-container").style.display = "none";
    document.getElementById("leaderboard-container").style.display = "block";
    document.getElementById("start-btn").style.display = "block";
});

document.getElementById("skip-score-btn").addEventListener("click", function() {
    document.getElementById("username-container").style.display = "none";
    startGame();
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("game-container").style.opacity = "1";
});


function endGame() {
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

    document.getElementById("start-btn").textContent = "Play Again";

    // ✅ Always show the leaderboard after the game ends
    document.getElementById("leaderboard-container").style.display = "block";
    loadLeaderboard();

    // ✅ Check if the player qualifies for a high score
    get(query(ref(database, "leaderboard"), orderByChild("score"), limitToLast(10)))
    .then((snapshot) => {
        let scores = [];

        snapshot.forEach(childSnapshot => {
            let entry = childSnapshot.val();
            scores.push(entry.score);
        });

        let lowestTopScore = scores.length < 10 ? 0 : Math.min(...scores);

        if (score > lowestTopScore || scores.length < 10) {
            // ✅ If the player qualifies, show input form
            document.getElementById("username-container").style.display = "block";
            document.getElementById("username-label").textContent = "🎉 Congratulations! You got a high score! Please enter your name:";
        } else {
            // ✅ If not in top 10, just show Play Again button
            document.getElementById("start-btn").style.display = "block";
        }
    });
}

function startCountdown() {
    clearInterval(timer); // Reset timer

    let timerBar = document.getElementById("timer-bar");
    timerBar.style.width = "100%";

    timer = setInterval(function () {
        if (timeLeft > 0) {
            timeLeft--;
            document.getElementById("timer").textContent = "Time: " + timeLeft;

            // ⏳ Reduce timer bar width
            timerBar.style.width = (timeLeft / 60) * 100 + "%";
        } else {
            clearInterval(timer);
            endGame();
        }
    }, 1000);
}


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
    document.getElementById("prompt").style.display = "block"; // Ensure prompt is visible

    button1.textContent = options[0];
    button2.textContent = options[1];

    [button1, button2].forEach(button => {
        button.style.backgroundColor = "#007bff";
        button.innerHTML = button.textContent;
        button.onclick = function () {
            checkAnswer(button, correctWord, sentence.replace("__________", correctWord));
        };
    });
}

// Confetti Effect for Correct Answers 🎉
function launchConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function checkAnswer(selectedButton, correctWord, definition) {
    let isCorrect = selectedButton.textContent === correctWord;

    // ✅ Disable both answer buttons immediately after one is clicked
    document.getElementById("option1").disabled = true;
    document.getElementById("option2").disabled = true;

    if (isCorrect) {
        score++;
        document.getElementById("score").textContent = "Score: " + score;
        selectedButton.style.backgroundColor = "#28a745"; // ✅ Green for correct answer
        selectedButton.innerHTML = "&#10004;";
    } else {
        lives--;
        document.getElementById("lives").textContent = "Lives: " + lives;
        selectedButton.style.backgroundColor = "#d32f2f"; // ✅ Red for wrong answer
        selectedButton.innerHTML = "&#10008;";

        // ✅ End game if no lives left
        if (lives === 0) {
            setTimeout(endGame, 1000);
            return;
        }
    }

    // ✅ Move to the next question after 1 second & re-enable buttons
    setTimeout(() => {
        generateWordPair();
        document.getElementById("option1").disabled = false;
        document.getElementById("option2").disabled = false;
        document.getElementById("option1").innerHTML = "";
        document.getElementById("option2").innerHTML = "";
    }, 1000);
}

    // ✅ Move to the next question after 1 second & re-enable buttons
    setTimeout(() => {
        generateWordPair();
        document.getElementById("option1").disabled = false;
        document.getElementById("option2").disabled = false;
    }, 1000);


function endGame() {
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

    document.getElementById("start-btn").textContent = "Play Again";
    document.getElementById("start-btn").style.display = "none"; // ✅ Hide until score check is done

    // ✅ Fetch top 10 scores and determine if the player qualifies
    get(query(ref(database, "leaderboard"), orderByChild("score"), limitToLast(10)))
    .then((snapshot) => {
        let scores = [];

        snapshot.forEach(childSnapshot => {
            let entry = childSnapshot.val();
            scores.push(entry.score);
        });

        // ✅ Check if the new score is higher than the lowest score in the Top 10
        let lowestTopScore = scores.length < 10 ? 0 : Math.min(...scores);

        // ✅ Always show leaderboard
        document.getElementById("leaderboard-container").style.display = "block";
        loadLeaderboard();

        if (score > lowestTopScore || scores.length < 10) {
            // ✅ If the player qualifies, show the input form
            document.getElementById("username-container").style.display = "block";
            document.getElementById("username-label").textContent = "🎉 Congratulations! You got a high score! Please enter your name:";
        } else {
            // ✅ If the player does NOT qualify, just show Play Again button
            document.getElementById("start-btn").style.display = "block";
        }
    });
}

// Submit Score to Firebase
function submitScore(name, score) {
    let newEntry = push(ref(database, "leaderboard"));
    set(newEntry, {
        name: name,
        score: score,
        timestamp: new Date().toISOString()
    });
}

function loadLeaderboard() {
    let leaderboardList = document.getElementById("leaderboard");
    leaderboardList.innerHTML = ""; // ✅ Clear old leaderboard before updating

    get(query(ref(database, "leaderboard"), orderByChild("score"), limitToLast(10)))
    .then((snapshot) => {
        let scores = [];

        snapshot.forEach(childSnapshot => {
            let entry = childSnapshot.val();
            scores.push({ name: entry.name, score: entry.score });
        });

        // ✅ Sort scores in descending order (highest first)
        scores.sort((a, b) => b.score - a.score);

        // ✅ Display the top 10 scores
        scores.forEach(entry => {
            let li = document.createElement("li");
            li.textContent = `${entry.name}: ${entry.score}`;
            leaderboardList.appendChild(li);
        });

        // ✅ Ensure leaderboard is visible
        document.getElementById("leaderboard-container").style.display = "block";
    }).catch(error => {
        console.error("Error loading leaderboard:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    // Attach event listener to Start Game / Play Again button
    document.getElementById("start-btn").addEventListener("click", startGame);
});

// Load leaderboard on page load
window.onload = function() {
    loadLeaderboard();
};
