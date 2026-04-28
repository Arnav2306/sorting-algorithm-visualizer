// ===== STATE =====
let array = [];
let isSorting = false;
let selectedAlgo = 'bubble';
let comparisons = 0;
let swaps = 0;

// Speed map: slider 1-5 → delay in ms
const SPEED_MAP = { 1: 400, 2: 200, 3: 80, 4: 20, 5: 4 };
const SPEED_LABEL = { 1: 'Very Slow', 2: 'Slow', 3: 'Medium', 4: 'Fast', 5: 'Blazing' };

const ALGO_INFO = {
  bubble:    { name: 'Bubble Sort',    complexity: 'O(n²)' },
  selection: { name: 'Selection Sort', complexity: 'O(n²)' },
  insertion: { name: 'Insertion Sort', complexity: 'O(n²)' },
};

// ===== DOM REFERENCES =====
const visualizer      = document.getElementById('visualizer');
const generateBtn     = document.getElementById('generateBtn');
const sortBtn         = document.getElementById('sortBtn');
const speedSlider     = document.getElementById('speed');
const sizeSlider      = document.getElementById('arraySize');
const sizeVal         = document.getElementById('sizeVal');
const speedVal        = document.getElementById('speedVal');
const infoAlgo        = document.getElementById('infoAlgo');
const infoComparisons = document.getElementById('infoComparisons');
const infoSwaps       = document.getElementById('infoSwaps');
const infoStatus      = document.getElementById('infoStatus');
const infoComplexity  = document.getElementById('infoComplexity');
const algoTabs        = document.querySelectorAll('.algo-tab');

// ===== HELPERS =====

// Sleep: pauses execution for `ms` milliseconds — core of animation
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDelay() {
  return SPEED_MAP[speedSlider.value];
}

// Generate array of random numbers
function generateArray() {
  if (isSorting) return;
  const size = parseInt(sizeSlider.value);
  array = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
  comparisons = 0;
  swaps = 0;
  updateStats();
  setStatus('idle');
  renderBars();
}

// ===== RENDER =====
function renderBars(states = {}) {
  visualizer.innerHTML = '';
  const maxVal = Math.max(...array);

  array.forEach((val, i) => {
    const bar = document.createElement('div');
    bar.classList.add('bar');

    // Height as percentage of container
    bar.style.height = `${(val / maxVal) * 100}%`;

    // Apply color state
    if (states[i] === 'comparing')     bar.classList.add('comparing');
    else if (states[i] === 'swapping') bar.classList.add('swapping');
    else if (states[i] === 'sorted')   bar.classList.add('sorted');
    else if (states[i] === 'pivot')    bar.classList.add('pivot');

    visualizer.appendChild(bar);
  });
}

// Mark all bars as sorted (green) with staggered animation
function markAllSorted() {
  const bars = visualizer.querySelectorAll('.bar');
  bars.forEach((bar, i) => {
    setTimeout(() => {
      bar.className = 'bar sorted';
    }, i * 12);
  });
}

// ===== STATS & UI =====
function updateStats() {
  infoComparisons.textContent = comparisons;
  infoSwaps.textContent = swaps;
}

function setStatus(type) {
  const map = {
    idle:    { text: 'Idle',    cls: 'status-idle'    },
    running: { text: 'Running', cls: 'status-running' },
    done:    { text: 'Done',    cls: 'status-done'    },
  };
  infoStatus.textContent = map[type].text;
  infoStatus.className = `info-value ${map[type].cls}`;
}

function setAlgo(algo) {
  selectedAlgo = algo;
  infoAlgo.textContent = ALGO_INFO[algo].name;
  infoComplexity.textContent = ALGO_INFO[algo].complexity;

  // Update tab highlight
  algoTabs.forEach(t => t.classList.toggle('active', t.dataset.algo === algo));

  // Highlight active card
  document.querySelectorAll('.algo-card').forEach(c => c.classList.remove('active-card'));
  document.getElementById(`card-${algo}`)?.classList.add('active-card');
}

// Lock controls while sorting is in progress
function lockUI() {
  isSorting = true;
  sortBtn.disabled = true;
  generateBtn.disabled = true;
  algoTabs.forEach(t => t.disabled = true);
  sizeSlider.disabled = true;
}

function unlockUI() {
  isSorting = false;
  sortBtn.disabled = false;
  generateBtn.disabled = false;
  algoTabs.forEach(t => t.disabled = false);
  sizeSlider.disabled = false;
}

// ===== SORTING ALGORITHMS =====

// 1. BUBBLE SORT
// Compare adjacent pairs, swap if wrong order, repeat n times
async function bubbleSort() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      updateStats();

      renderBars({ [j]: 'comparing', [j + 1]: 'comparing' });
      await sleep(getDelay());

      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        swaps++;
        updateStats();

        renderBars({ [j]: 'swapping', [j + 1]: 'swapping' });
        await sleep(getDelay());
      }
    }
  }
}

// 2. SELECTION SORT
// Find the minimum in the remaining array, place it at the front
async function selectionSort() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    for (let j = i + 1; j < n; j++) {
      comparisons++;
      updateStats();

      renderBars({ [minIdx]: 'pivot', [j]: 'comparing' });
      await sleep(getDelay());

      if (array[j] < array[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
      swaps++;
      updateStats();

      renderBars({ [i]: 'swapping', [minIdx]: 'swapping' });
      await sleep(getDelay());
    }
  }
}

// 3. INSERTION SORT
// Pick each element and insert it into its correct position in the sorted portion
async function insertionSort() {
  const n = array.length;
  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;

    renderBars({ [i]: 'pivot' });
    await sleep(getDelay());

    while (j >= 0 && array[j] > key) {
      comparisons++;
      swaps++;
      updateStats();

      array[j + 1] = array[j];
      renderBars({ [j]: 'comparing', [j + 1]: 'swapping' });
      await sleep(getDelay());

      j--;
    }

    array[j + 1] = key;
    comparisons++;
    updateStats();
  }
}

// ===== MAIN SORT RUNNER =====
async function startSort() {
  if (isSorting) return;
  if (array.length === 0) generateArray();

  comparisons = 0;
  swaps = 0;
  updateStats();
  lockUI();
  setStatus('running');

  if (selectedAlgo === 'bubble')    await bubbleSort();
  if (selectedAlgo === 'selection') await selectionSort();
  if (selectedAlgo === 'insertion') await insertionSort();

  markAllSorted();
  setStatus('done');
  unlockUI();
}

// ===== EVENT LISTENERS =====
generateBtn.addEventListener('click', generateArray);
sortBtn.addEventListener('click', startSort);

algoTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (!isSorting) setAlgo(tab.dataset.algo);
  });
});

sizeSlider.addEventListener('input', () => {
  sizeVal.textContent = sizeSlider.value;
  if (!isSorting) generateArray();
});

speedSlider.addEventListener('input', () => {
  speedVal.textContent = SPEED_LABEL[speedSlider.value];
});

// ===== INIT — runs on page load =====
setAlgo('bubble');
generateArray();