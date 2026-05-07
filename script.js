let board = [];
let boardSize = 3;

let currentPlayer = "X";
let gameMode = "pvp";
let gameActive = true;
let isAITurn = false;

let scoreX = 0;
let scoreO = 0;

// ---------- 🔥 NOVO MENU DINÂMICO ----------
function toggleMode(mode) {
  const sections = ["pvpOptions", "easyOptions", "mediumOptions", "hardOptions"];

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (id.startsWith(mode)) {
      el.classList.toggle("hidden");
    } else {
      el.classList.add("hidden");
    }
  });
}

// ---------- SCORE ----------
function getScoreKey() {
  return "score_" + gameMode + "_" + boardSize;
}

function loadScore() {
  const saved = JSON.parse(localStorage.getItem(getScoreKey()));
  scoreX = saved?.X || 0;
  scoreO = saved?.O || 0;
}

function saveScore() {
  localStorage.setItem(getScoreKey(), JSON.stringify({ X: scoreX, O: scoreO }));
}

function resetScore() {
  scoreX = 0;
  scoreO = 0;
  saveScore();
  updateHUD();
}

// ---------- START ----------
function startGame(mode) {
  const parts = mode.split("-");

  gameMode = parts[0];
  boardSize = parts[1] ? parseInt(parts[1]) : 3;

  if (!boardSize || boardSize < 3) boardSize = 3;

  loadScore();

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  createBoard();
}

// ---------- BOARD ----------
function createBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  board = Array(boardSize * boardSize).fill("");

  boardDiv.style.gridTemplateColumns = `repeat(${boardSize}, 110px)`;

  currentPlayer = "X";
  gameActive = true;
  isAITurn = false;

  board.forEach((_, i) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    cell.onclick = () => onPlayerMove(i);

    cell.onmouseenter = () => {
      if (board[i] === "" && !isAITurn && gameActive) {
        cell.textContent = currentPlayer;
        cell.classList.add("preview");
      }
    };

    cell.onmouseleave = () => {
      if (cell.classList.contains("preview")) {
        cell.textContent = "";
        cell.classList.remove("preview");
      }
    };

    boardDiv.appendChild(cell);
  });

  document.getElementById("resultScreen").classList.add("hidden");

  updateHUD();
}

// ---------- PLAYER ----------
function onPlayerMove(i) {
  if (!gameActive || isAITurn || board[i] !== "") return;

  board[i] = currentPlayer;

  document.querySelectorAll(".cell").forEach(c => {
    c.classList.remove("preview");
  });

  render();

  if (finishTurn(currentPlayer)) return;

  if (gameMode !== "pvp") {
    isAITurn = true;
    document.getElementById("board").classList.add("disabled");

    updateHUD();

    setTimeout(() => {
      if (gameActive) playAI();
      isAITurn = false;
      document.getElementById("board").classList.remove("disabled");
      updateHUD();
    }, 250);
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateHUD();
  }
}

// ---------- IA ----------
function playAI() {
  let move;

  if (gameMode === "easy") {
    move = randomMove();
  } else if (gameMode === "medium") {
    move = Math.random() < 0.5 ? randomMove() : smartMove();
  } else {
    move = smartMove();
  }

  board[move] = "O";
  render();

  if (finishTurn("O")) return;

  currentPlayer = "X";
  updateHUD();
}

function randomMove() {
  const empty = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

function smartMove() {
  for (let i = 0; i < board.length; i++) {
    if (board[i] === "") {
      board[i] = "O";
      if (checkWinner(board)) {
        board[i] = "";
        return i;
      }
      board[i] = "";
    }
  }

  for (let i = 0; i < board.length; i++) {
    if (board[i] === "") {
      board[i] = "X";
      if (checkWinner(board)) {
        board[i] = "";
        return i;
      }
      board[i] = "";
    }
  }

  const center = Math.floor(board.length / 2);
  if (board[center] === "") return center;

  return randomMove();
}

// ---------- TURN ----------
function finishTurn(player) {
  const combo = checkWinner(board);

  if (combo) {
    highlightWinner(combo);
    showResult(player + " venceu!");

    if (player === "X") scoreX++;
    else scoreO++;

    saveScore();
    updateHUD();

    gameActive = false;
    return true;
  }

  if (!board.includes("")) {
    showResult("Empate!");
    gameActive = false;
    return true;
  }

  return false;
}

// ---------- WIN ----------
function checkWinner(b) {
  const s = boardSize;

  for (let r = 0; r < s; r++) {
    const row = [...Array(s)].map((_, c) => r * s + c);
    if (row.every(i => b[i] && b[i] === b[row[0]])) return row;
  }

  for (let c = 0; c < s; c++) {
    const col = [...Array(s)].map((_, r) => r * s + c);
    if (col.every(i => b[i] && b[i] === b[col[0]])) return col;
  }

  const d1 = [...Array(s)].map((_, i) => i * s + i);
  const d2 = [...Array(s)].map((_, i) => i * s + (s - i - 1));

  if (d1.every(i => b[i] && b[i] === b[d1[0]])) return d1;
  if (d2.every(i => b[i] && b[i] === b[d2[0]])) return d2;

  return null;
}

// ---------- UI ----------
function render() {
  document.querySelectorAll(".cell").forEach((c, i) => {
    c.textContent = board[i];

    c.classList.remove("X", "O", "marked", "preview");

    if (board[i]) {
      c.classList.add(board[i]);
      c.classList.add("marked");
    }
  });
}

function highlightWinner(combo) {
  const cells = document.querySelectorAll(".cell");
  combo.forEach(i => cells[i].classList.add("winner"));
}

function showResult(text) {
  document.getElementById("resultText").textContent = text;
  document.getElementById("resultScreen").classList.remove("hidden");
}

// ---------- HUD ----------
function updateHUD() {
  const turnEl = document.getElementById("turn");

  if (!turnEl) return;

  turnEl.classList.remove("turn-x", "turn-o", "thinking");

  if (isAITurn) {
    turnEl.classList.add("thinking");
  } else {
    turnEl.classList.add(currentPlayer === "X" ? "turn-x" : "turn-o");
  }

  turnEl.textContent =
    `Modo: ${gameMode.toUpperCase()} (${boardSize}x${boardSize}) - ` +
    (isAITurn ? "IA pensando..." : "Vez: " + currentPlayer);

  document.getElementById("scoreX").textContent = scoreX;
  document.getElementById("scoreO").textContent = scoreO;
}

// ---------- CONTROLES ----------
function resetGame() {
  createBoard();
}

function goMenu() {
  document.getElementById("menu").classList.remove("hidden");
  document.getElementById("game").classList.add("hidden");
}