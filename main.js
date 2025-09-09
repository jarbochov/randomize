const MAX_CHOICES = 50;
const STORAGE_KEY = 'choice-randomizer-v1';
const HISTORY_KEY = 'choice-randomizer-history-v1';

const choiceInput = document.getElementById('choice-input');
const addBtn = document.getElementById('add-btn');
const choicesList = document.getElementById('choices-list');
const maxedMsg = document.getElementById('maxed-msg');
const importBtn = document.getElementById('import-btn');
const exportBtn = document.getElementById('export-btn');
const clearBtn = document.getElementById('clear-btn');
const csvHeaderCheckbox = document.getElementById('csv-header');
const csvFileInput = document.getElementById('csv-file');
const randomizeBtn = document.getElementById('randomize-btn');
const toggleOptionsBtn = document.getElementById('toggle-options');
const optionsRollup = document.getElementById('options-rollup');
const carouselSection = document.getElementById('carousel-section');
const carouselList = document.getElementById('carousel-list');
const winnerSection = document.getElementById('winner-section');
const winnerValue = document.getElementById('winner-value');
const spinAgainBtn = document.getElementById('spin-again-btn');
const editBtn = document.getElementById('edit-btn');
const resultExportBtn = document.getElementById('result-export-btn');
const historyContainer = document.getElementById('history-container');
const inputSection = document.getElementById('input-section');
const choicesSection = document.getElementById('choices-section');
const randomizeSection = document.getElementById('randomize-section');
const mainApp = document.getElementById('main-app');
const toggleHistoryBtn = document.getElementById('toggle-history');
const historyRollup = document.getElementById('history-rollup');
const clearHistoryBtn = document.getElementById('clear-history-btn');

let choices = [];
let history = [];
const randomLabels = [
  "Let Chaos Reign!",
  "Shake It Up!",
  "Spin the Wheel of Destiny!",
  "Summon Randomness!",
  "Unleash the Fates!",
  "Roll the Cosmic Dice!",
  "Mayhem Mode!",
  "Toss into the Void!",
  "Destiny, Take the Wheel!",
  "Invoke the Randomizer!",
  "Disorder, Please!",
  "Activate Quantum Luck!",
  "Who Knows?!",
  "Bring the Pandemonium!",
  "Release the Kraken!",
  "YOLO Button!",
  "Throw a Curveball!",
  "Hurl into Uncertainty!",
  "Choose or Lose!",
  "Hit Me With Chaos!",
  "Spin and Grin!",
  "Let the Universe Decide!",
  "Go Bananas!"
];

const respinMessages = [
  "🌀 The timeline has shifted. But is this really better?",
  "🔮 Another universe, another outcome.",
  "🌌 You just quantum-leaped to a new result!",
  "🦋 That butterfly just flapped its wings. Welcome to a new timeline.",
  "⚡️ The fabric of fate is fraying. Result updated!",
  "⏳ You have rewound the cosmic clock. Again.",
  "🌠 A ripple in the multiverse delivers a different destiny.",
  "✨ Parallel worlds say hello! Enjoy your alternate fate.",
  "🪐 The universe blinks. Your wish is (randomly) granted.",
  "🛸 You’ve seen another potential future. Satisfied?",
  "🚀 You’ve created a new branch of reality. Good luck!",
  "🌈 Another roll, another dimension.",
  "🦄 Multiverse roulette: new path unlocked.",
  "🍀 Alternate luck engaged. Fate is fickle.",
  "👾 You glitched the matrix. This is your new outcome."
];

const firstSpinDisclaimer = `🤔 Not satisfied? <b>True randomness</b> is a cruel mistress.<br>
Try again, but don’t tell the quantum gods.`;

function getRandomLabel() {
  return randomLabels[Math.floor(Math.random() * randomLabels.length)];
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    choices,
    csvHeader: csvHeaderCheckbox.checked
  }));
}
function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
function loadHistory() {
  const data = localStorage.getItem(HISTORY_KEY);
  if (data) {
    try {
      history = JSON.parse(data) || [];
    } catch { history = []; }
  }
}
function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const d = JSON.parse(data);
      choices = Array.isArray(d.choices) ? d.choices.slice(0, MAX_CHOICES) : [];
      csvHeaderCheckbox.checked = !!d.csvHeader;
    } catch {}
  }
}

function updateChoicesUI() {
  choicesList.innerHTML = '';
  choices.forEach((choice, idx) => {
    const li = document.createElement('li');
    li.className = 'choice-item';
    li.innerHTML = `
      <span class="choice-label">${escapeHTML(choice)}</span>
      <button class="remove-btn" aria-label="Remove choice" data-idx="${idx}" tabindex="0">&times;</button>
    `;
    choicesList.appendChild(li);
  });

  maxedMsg.style.display = (choices.length >= MAX_CHOICES) ? '' : 'none';
  choiceInput.disabled = choices.length >= MAX_CHOICES;
  addBtn.disabled = choices.length >= MAX_CHOICES;
  randomizeBtn.disabled = choices.length < 2;
}

function escapeHTML(str) {
  return str.replace(/[&<>"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[c]));
}

// Add choice
document.getElementById('choice-form').addEventListener('submit', e => {
  e.preventDefault();
  const val = choiceInput.value.trim();
  if (val && choices.length < MAX_CHOICES) {
    choices.push(val);
    choiceInput.value = '';
    updateChoicesUI();
    saveToStorage();
    choiceInput.focus();
    updateRandomizeLabel();
  }
});

// Remove choice (event delegation)
choicesList.addEventListener('click', e => {
  if (e.target.classList.contains('remove-btn')) {
    const idx = +e.target.dataset.idx;
    choices.splice(idx, 1);
    updateChoicesUI();
    saveToStorage();
    choiceInput.focus();
    updateRandomizeLabel();
  }
});
// Keyboard remove (Enter/Space)
choicesList.addEventListener('keydown', e => {
  if (e.target.classList.contains('remove-btn') &&
      (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    e.target.click();
  }
});

// Clear all
clearBtn.addEventListener('click', () => {
  if (choices.length && confirm('Clear all choices?')) {
    choices = [];
    updateChoicesUI();
    saveToStorage();
    choiceInput.focus();
    updateRandomizeLabel();
  }
});

// Import CSV
importBtn.addEventListener('click', () => csvFileInput.click());
csvFileInput.addEventListener('change', handleCSVImport);

function handleCSVImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    let text = ev.target.result;
    let lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    if (csvHeaderCheckbox.checked && lines.length) lines.shift();
    const imported = lines.slice(0, MAX_CHOICES);
    choices = imported;
    updateChoicesUI();
    saveToStorage();
    csvFileInput.value = '';
    updateRandomizeLabel();
  };
  reader.readAsText(file);
}

// Export CSV (for both main and result)
function exportChoices() {
  let out = '';
  if (csvHeaderCheckbox.checked) out += 'Choice\n';
  out += choices.join('\n');
  const blob = new Blob([out], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'choices.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{URL.revokeObjectURL(url); a.remove();}, 500);
}
exportBtn.addEventListener('click', exportChoices);
resultExportBtn.addEventListener('click', exportChoices);

// Save header pref
csvHeaderCheckbox.addEventListener('change', saveToStorage);

// Toggle Options rollup
toggleOptionsBtn.addEventListener('click', () => {
  if (optionsRollup.hasAttribute('hidden')) {
    optionsRollup.removeAttribute('hidden');
    toggleOptionsBtn.setAttribute('aria-expanded', 'true');
  } else {
    optionsRollup.setAttribute('hidden', '');
    toggleOptionsBtn.setAttribute('aria-expanded', 'false');
  }
});

// HISTORY ROLLUP
toggleHistoryBtn.addEventListener('click', () => {
  if (historyRollup.hasAttribute('hidden')) {
    historyRollup.removeAttribute('hidden');
    toggleHistoryBtn.setAttribute('aria-expanded', 'true');
  } else {
    historyRollup.setAttribute('hidden', '');
    toggleHistoryBtn.setAttribute('aria-expanded', 'false');
  }
});

// Clear history button
clearHistoryBtn.addEventListener('click', () => {
  if (history.length && confirm('Clear all history?')) {
    history = [];
    saveHistory();
    renderHistory();
  }
});

// Set random label on randomize button
function updateRandomizeLabel() {
  randomizeBtn.textContent = getRandomLabel();
}
randomizeBtn.addEventListener('pointerenter', updateRandomizeLabel);
randomizeBtn.addEventListener('focus', updateRandomizeLabel);
toggleOptionsBtn.addEventListener('pointerenter', function() {
  toggleOptionsBtn.style.transform = "scale(1.04) rotate(-2deg)";
  setTimeout(()=>toggleOptionsBtn.style.transform = "", 170);
});

// ---- Carousel and Winner Logic ----

function showCarousel() {
  inputSection.hidden = true;
  choicesSection.hidden = true;
  randomizeSection.hidden = true;
  winnerSection.hidden = true;
  carouselSection.hidden = false;
}
function showInput() {
  inputSection.hidden = false;
  choicesSection.hidden = false;
  randomizeSection.hidden = false;
  winnerSection.hidden = true;
  carouselSection.hidden = true;
}
function showWinner() {
  inputSection.hidden = true;
  choicesSection.hidden = true;
  randomizeSection.hidden = true;
  winnerSection.hidden = false;
  carouselSection.hidden = true;
}

function shuffleArray(arr) {
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// Carousel Animation
function animateCarousel(choices, winnerIdx, doneCb) {
  let idx = Math.floor(Math.random() * choices.length);
  let totalSpins = Math.floor(30 + Math.random() * 18); // 30-48 spins
  let spinDuration = 70; // ms for fast spinning, slows down
  let currentSpin = 0;
  let jumpChance = Math.random();
  let jumpMode = (jumpChance < 0.07); // 7% chance to "jump" to winner at the end

  function renderCarousel(centerIdx) {
    carouselList.innerHTML = '';
    let n = choices.length;
    for (let offset = -2; offset <= 2; offset++) {
      let pos = (centerIdx + offset + n) % n;
      let item = document.createElement('li');
      item.className = 'carousel-item';
      if (offset === 0) item.classList.add('primary');
      else if (Math.abs(offset) === 1) item.classList.add('secondary');
      else item.classList.add('tertiary');
      item.textContent = choices[pos];
      carouselList.appendChild(item);
    }
  }

  showCarousel();
  renderCarousel(idx);

  function spinStep() {
    if (currentSpin < totalSpins) {
      idx = (idx + 1) % choices.length;
      renderCarousel(idx);
      currentSpin++;
      // Easing: slow down at end
      let progress = currentSpin / totalSpins;
      let speed = spinDuration + Math.pow(progress, 2.5) * 320;
      setTimeout(spinStep, speed);
    } else {
      // Now land on winner, maybe with a "jump"
      if (jumpMode) {
        let fakeIdx = Math.floor(Math.random() * choices.length);
        renderCarousel(fakeIdx);
        setTimeout(() => {
          renderCarousel(winnerIdx);
          setTimeout(() => doneCb && doneCb(), 600);
        }, 400);
      } else {
        function landStep(tempIdx) {
          renderCarousel(tempIdx);
          if (tempIdx === winnerIdx) {
            setTimeout(() => doneCb && doneCb(), 700);
          } else {
            setTimeout(() => landStep((tempIdx + 1) % choices.length), 160);
          }
        }
        setTimeout(() => landStep(idx), 250);
      }
    }
  }

  setTimeout(spinStep, 300);
}

function pickRandomIdx(arr) {
  return Math.floor(Math.random() * arr.length);
}

// --- Winner flow (with respin support) ---
function showWinnerView(winnerVal, respinFlag = false) {
  winnerValue.textContent = winnerVal;
  showWinner();
  addHistoryEntry(winnerVal, respinFlag);
  renderHistory();
  renderWinnerDisclaimer(respinFlag);
  // Collapse history rollup on winner reveal, for tidier UI
  historyRollup.setAttribute('hidden', '');
  toggleHistoryBtn.setAttribute('aria-expanded', 'false');
}

function renderWinnerDisclaimer(respinFlag) {
  const disclaimerDiv = document.querySelector('.winner-disclaimer');
  if (respinFlag) {
    disclaimerDiv.innerHTML = `
      <div>
        <span>${respinMessages[Math.floor(Math.random()*respinMessages.length)]}</span>
      </div>
    `;
  } else {
    disclaimerDiv.innerHTML = `
      <div>
        <span>${firstSpinDisclaimer}</span>
      </div>
    `;
  }
}

// --- History with respin flag ---
// New: alt timeline is a row above the outcome, centered
function renderHistory() {
  if (!history.length) {
    historyContainer.innerHTML = '';
    return;
  }
  let list = `<h3>Recent Results</h3><ul class="history-list">`;
  for (const item of history) {
    list += `<li>
      ${item.respin ? `<span class="history-alt-timeline">⏪ alt timeline</span>` : ''}
      <span>${escapeHTML(item.value)}</span>
      <span class="history-timestamp">${item.timestamp}</span>
    </li>`;
  }
  list += '</ul>';
  historyContainer.innerHTML = list;
}

function addHistoryEntry(winnerVal, respinFlag) {
  let now = new Date();
  let ts = now.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  history.unshift({ value: winnerVal, timestamp: ts, respin: !!respinFlag });
  if (history.length > 12) history = history.slice(0, 12);
  saveHistory();
}

// --- Randomize button refactor ---
function spinCarouselAndShowWinner(respinFlag = false) {
  if (choices.length < 2) return;
  // 1. Shuffle for display, but keep the original for the real winner
  const displayChoices = shuffleArray(choices);
  // 2. Randomly pick a winner index in the display array
  const realWinner = choices[Math.floor(Math.random() * choices.length)];
  const winnerIdx = displayChoices.indexOf(realWinner);
  animateCarousel(displayChoices, winnerIdx, () => {
    showWinnerView(realWinner, respinFlag);
  });
}
randomizeBtn.addEventListener('click', () => spinCarouselAndShowWinner(false));

// Spin Again from winner view (now just spins again, does NOT show input)
spinAgainBtn.addEventListener('click', () => {
  showCarousel();
  setTimeout(() => spinCarouselAndShowWinner(true), 400);
});

// Edit Choices from winner view (still shows input UI)
editBtn.addEventListener('click', () => {
  showInput();
  setTimeout(() => choiceInput.focus(), 250);
});

// --- Initial load ---
loadFromStorage();
loadHistory();
updateChoicesUI();
updateRandomizeLabel();
renderHistory();
showInput();