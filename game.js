(function () {
  "use strict";

  const WORDS = [
    "ELEFANTE",
    "JIRAFA",
    "COCODRILO",
    "MARIPOSA",
    "PINGUINO",
    "DELFIN",
    "TORTUGA",
    "AGUILA",
    "CAMELLO",
    "GORILA",
    "HIPOPOTAMO",
    "CANGURO",
    "LEOPARDO",
    "FLAMENCO",
    "MURCIELAGO",
    "AVESTRUZ",
    "IGUANA",
    "CHIMPANCE",
  
    "ARMADILLO",
  ];

  const KEYBOARD_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  const MAX_WRONG = 6;

  const elWelcome = document.getElementById("screen-welcome");
  const elGame = document.getElementById("screen-game");
  const elEnd = document.getElementById("screen-end");
  const elWord = document.getElementById("word-display");
  const elKeyboard = document.getElementById("keyboard");
  const elAttempts = document.getElementById("attempts-count");
  const elEndTitle = document.getElementById("end-title");
  const elEndWord = document.getElementById("end-word");
  const elBtnAgain = document.getElementById("btn-again");

  let currentWord = "";
  let guessed = new Set();
  let wrongCount = 0;
  let gameOver = false;

  function showScreen(screen) {
    [elWelcome, elGame, elEnd].forEach(function (el) {
      var active = el === screen;
      el.classList.toggle("screen--active", active);
      el.setAttribute("aria-hidden", active ? "false" : "true");
    });
  }

  function randomWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  function normalizeLetter(ch) {
    return String(ch)
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function letterInWord(letter) {
    var L = normalizeLetter(letter);
    for (var i = 0; i < currentWord.length; i++) {
      if (normalizeLetter(currentWord[i]) === L) return true;
    }
    return false;
  }

  function isLetterChar(c) {
    return /[\p{L}]/u.test(c);
  }

  function isWordComplete() {
    for (var i = 0; i < currentWord.length; i++) {
      var c = currentWord[i];
      if (!isLetterChar(c)) continue;
      var found = false;
      guessed.forEach(function (g) {
        if (normalizeLetter(g) === normalizeLetter(c)) found = true;
      });
      if (!found) return false;
    }
    return true;
  }

  function renderWord() {
    elWord.innerHTML = "";
    for (var i = 0; i < currentWord.length; i++) {
      var c = currentWord[i];
      var span = document.createElement("span");
      span.className = "word-char";
      if (!isLetterChar(c)) {
        span.classList.add("word-char--space");
        span.textContent = c === " " ? "\u00a0" : c;
        elWord.appendChild(span);
        continue;
      }
      var revealed = false;
      guessed.forEach(function (g) {
        if (normalizeLetter(g) === normalizeLetter(c)) revealed = true;
      });
      if (revealed) {
        span.classList.add("word-char--revealed");
        span.textContent = c;
      } else {
        span.classList.add("word-char--pending");
        span.textContent = "\u00a0";
      }
      elWord.appendChild(span);
    }
  }

  function updateHangman() {
    for (var step = 1; step <= MAX_WRONG; step++) {
      var part = document.getElementById("part-" + step);
      if (!part) continue;
      var visible = step <= wrongCount;
      part.setAttribute("visibility", visible ? "visible" : "hidden");
    }
  }

  function updateAttempts() {
    elAttempts.textContent = String(wrongCount);
  }

  function buildKeyboard() {
    elKeyboard.innerHTML = "";
    KEYBOARD_ROWS.forEach(function (row) {
      var rowEl = document.createElement("div");
      rowEl.className = "keyboard-row";
      row.forEach(function (letter) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "key";
        btn.textContent = letter;
        btn.dataset.letter = letter;
        btn.setAttribute("aria-label", "Letra " + letter);
        btn.addEventListener("click", onKeyClick);
        rowEl.appendChild(btn);
      });
      elKeyboard.appendChild(rowEl);
    });
  }

  function onKeyClick(ev) {
    if (gameOver) return;
    var btn = ev.currentTarget;
    var letter = btn.dataset.letter;
    if (!letter || btn.disabled) return;

    guessed.add(letter);
    btn.disabled = true;
    btn.classList.add("key--used");

    if (letterInWord(letter)) {
      renderWord();
      if (isWordComplete()) endGame(true);
    } else {
      btn.classList.add("key--wrong");
      wrongCount += 1;
      updateHangman();
      updateAttempts();
      if (wrongCount >= MAX_WRONG) endGame(false);
    }
  }

  function blockPhysicalKeyboard(ev) {
    if (!elGame.classList.contains("screen--active")) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key.length === 1 && /[\p{L}]/u.test(ev.key)) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  function startGame() {
    currentWord = randomWord();
    guessed = new Set();
    wrongCount = 0;
    gameOver = false;
    buildKeyboard();
    renderWord();
    updateHangman();
    updateAttempts();
    showScreen(elGame);
    document.addEventListener("keydown", blockPhysicalKeyboard, true);
  }

  function winTierMessage() {
    if (wrongCount === 0) {
      return "¡Increíble! Sos un verdadero guardián de la naturaleza. 🏆";
    }
    if (wrongCount >= 1 && wrongCount <= 3) {
      return "¡Muy bien! El bosque está orgulloso de vos. 🌿";
    }
    return "Por poco... pero el animal es tuyo. 🐾";
  }

  function endGame(won) {
    gameOver = true;
    document.removeEventListener("keydown", blockPhysicalKeyboard, true);

    elEndTitle.classList.remove("end-title--win", "end-title--lose");
    if (won) {
      elEndTitle.textContent = "¡Animal encontrado! 🎉";
      elEndTitle.classList.add("end-title--win");
      elEndWord.innerHTML =
        '<p class="end-word">¡Adivinaste! El animal era <span>' +
        escapeHtml(currentWord) +
        "</span>.</p>" +
        '<p class="end-word">' +
        winTierMessage() +
        "</p>";
      elBtnAgain.textContent = "Buscar otro animal";
    } else {
      elEndTitle.textContent = "¡El animal escapó! 🌿";
      elEndTitle.classList.add("end-title--lose");
      elEndWord.innerHTML =
        '<p class="end-word">Se acabaron los intentos. El animal era <span>' +
        escapeHtml(currentWord) +
        "</span>.</p>" +
        '<p class="end-word">Se perdió en la selva, pero podés intentarlo de nuevo.</p>';
      elBtnAgain.textContent = "Nueva expedición";
    }

    showScreen(elEnd);
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  document.getElementById("btn-play").addEventListener("click", startGame);
  elBtnAgain.addEventListener("click", startGame);
})();
