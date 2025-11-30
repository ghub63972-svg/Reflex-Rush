let selectedAvatar = "https://i.imgur.com/Tx1REdh.jpeg";
let playerName = "";
let difficulty = "easy";
let reactionTimeout;
let startTime;
let xp = 0;

// Track first login
let firstLogin = !sessionStorage.getItem("hasLoggedIn");

const avatarImages = {
  1: "https://i.imgur.com/Tx1REdh.jpeg",
  2: "https://i.imgur.com/3jJrTlk.jpeg",
  3: "https://i.imgur.com/xULAiPt.jpeg",
};

function selectAvatar(num) {
  selectedAvatar = avatarImages[num];
  document.querySelectorAll(".avatar").forEach((img) => img.classList.remove("selected"));
  document.querySelectorAll(".avatar")[num - 1].classList.add("selected");
}

function goToDifficultyScreen() {
  playerName = document.getElementById("playerName").value.trim();
  if (!playerName) { alert("Please enter your name."); return; }

  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("difficulty-screen").classList.remove("hidden");

  firstLogin = false;
  sessionStorage.setItem("hasLoggedIn", "true");
}

function startGame(diff) {
  difficulty = diff;
  document.getElementById("difficulty-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");

  const area = document.getElementById("click-area");
  area.textContent = "Wait for green...";
  area.style.backgroundColor = "#111";

  let delay;
  switch (difficulty) {
    case "easy": delay = 1500 + Math.random() * 1000; break;
    case "medium": delay = 1000 + Math.random() * 1000; break;
    case "hard": delay = 500 + Math.random() * 1000; break;
  }

  reactionTimeout = setTimeout(() => {
    area.textContent = "TAP NOW!";
    area.style.backgroundColor = "#00c853";
    startTime = Date.now();
  }, delay);
}

document.getElementById("click-area").addEventListener("click", () => {
  if (!startTime) {
    clearTimeout(reactionTimeout);
    const area = document.getElementById("click-area");
    area.textContent = "Too Soon! ❌";
    area.style.backgroundColor = "#c62828";
    document.getElementById("wrongSound").play();
    setTimeout(() => showResult(null), 1000);
    return;
  }

  const reaction = Date.now() - startTime;
  document.getElementById("correctSound").play();
  const gainedXP = getXP(reaction);
  xp += gainedXP;
  document.getElementById("xp").textContent = xp;

  showResult(reaction);
});

function getXP(reaction) {
  if (reaction < 200) return 30;
  if (reaction < 300) return 20;
  if (reaction < 500) return 10;
  return 5;
}

function showResult(reactionTime) {
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.remove("hidden");

  const reactionEl = document.getElementById("reaction-time");
  const bestEl = document.getElementById("bestTime");
  const streakEl = document.getElementById("streakInfo");

  reactionEl.className = "reaction-number";
  bestEl.className = "slide-left";
  streakEl.className = "slide-right";

  if (reactionTime) {
    let current = 0;
    const step = Math.ceil(reactionTime / 30);
    const counter = setInterval(() => {
      current += step;
      if (current >= reactionTime) { current = reactionTime; clearInterval(counter); }
      reactionEl.textContent = `Your Reaction: ${current} ms`;
    }, 30);

    saveScore(playerName, reactionTime, xp, selectedAvatar);
    updateBestTime(reactionTime);
  } else reactionEl.textContent = "❌ You clicked too early!";

  updateStreak();
  startTime = null;
}

function goHome() {
  document.getElementById("result-screen").classList.add("hidden");
  document.getElementById("leaderboard-screen").classList.add("hidden");
  if (firstLogin) document.getElementById("login-screen").classList.remove("hidden");
  else document.getElementById("difficulty-screen").classList.remove("hidden");
}

function saveScore(name, reaction, xpValue, avatar) {
  const leaderboard = JSON.parse(localStorage.getItem("reflexRushLB")) || [];
  leaderboard.push({ name, reaction, xp: xpValue, avatar });
  localStorage.setItem("reflexRushLB", JSON.stringify(leaderboard));
}

function showLeaderboard() {
  const board = JSON.parse(localStorage.getItem("reflexRushLB")) || [];

  // Group by player
  const players = {};
  board.forEach(entry => {
    if (!players[entry.name]) players[entry.name] = [];
    players[entry.name].push(entry);
  });

  // Sort each player's scores ascending (best first) and keep top 3
  for (let name in players) {
    players[name].sort((a, b) => a.reaction - b.reaction);
    players[name] = players[name].slice(0, 3);
  }

  // Flatten and sort all scores globally ascending
  const topScores = Object.values(players).flat();
  topScores.sort((a, b) => a.reaction - b.reaction);

  const list = document.getElementById("leaderboard");
  list.innerHTML = "";

  topScores.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<img src="${entry.avatar}" width="30" height="30" style="border-radius:50%;"/>
                    <strong>${index + 1}. ${entry.name}</strong> — 🕒 ${entry.reaction} ms, ⭐ XP: ${entry.xp}`;
    list.appendChild(li);
  });

  document.getElementById("result-screen").classList.add("hidden");
  document.getElementById("leaderboard-screen").classList.remove("hidden");
}

function updateBestTime(newTime) {
  let best = localStorage.getItem("bestTime");
  if (!best || newTime < best) best = newTime;
  localStorage.setItem("bestTime", best);
  document.getElementById("bestTime").textContent = `🏅 Best Time: ${best} ms`;
}

function updateStreak() {
  const today = new Date().toDateString();
  let streakData = JSON.parse(localStorage.getItem("streakData")) || { lastDate: null, streak: 0 };
  if (streakData.lastDate !== today) streakData.streak += 1;
  streakData.lastDate = today;
  localStorage.setItem("streakData", JSON.stringify(streakData));
  document.getElementById("streakInfo").textContent = `🔥 Streak: ${streakData.streak} days`;
}