// ===== SortLab: State & Metadata =====
let array = [];
let initialDataset = [];
let isSorting = false;
let isBenchmarking = false;
let selectedAlgo = 'bubble';
let comparisons = 0;
let swaps = 0;
let writes = 0;

// Speed map: slider 1-5 → animation delay in ms
const SPEED_MAP = { 1: 320, 2: 140, 3: 50, 4: 15, 5: 3 };
const SPEED_LABEL = { 1: 'Very Slow', 2: 'Slow', 3: 'Medium', 4: 'Fast', 5: 'Blazing' };

const ALGO_INFO = {
  bubble: {
    name: 'Bubble Sort',
    complexity: 'O(n²)',
    best: 'O(n)',
    avg: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: 'Stable'
  },
  selection: {
    name: 'Selection Sort',
    complexity: 'O(n²)',
    best: 'O(n²)',
    avg: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: 'Unstable'
  },
  insertion: {
    name: 'Insertion Sort',
    complexity: 'O(n²)',
    best: 'O(n)',
    avg: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: 'Stable'
  },
  merge: {
    name: 'Merge Sort',
    complexity: 'O(n log n)',
    best: 'O(n log n)',
    avg: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    stable: 'Stable'
  },
  quick: {
    name: 'Quick Sort',
    complexity: 'O(n log n)',
    best: 'O(n log n)',
    avg: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    stable: 'Unstable'
  }
};

// ===== DOM REFERENCES =====
const visualizer         = document.getElementById('visualizer');
const generateBtn        = document.getElementById('generateBtn');
const resetBtn           = document.getElementById('resetBtn');
const sortBtn            = document.getElementById('sortBtn');
const speedSlider        = document.getElementById('speed');
const sizeSlider         = document.getElementById('arraySize');
const sizeVal            = document.getElementById('sizeVal');
const speedVal           = document.getElementById('speedVal');
const inputCondition     = document.getElementById('inputCondition');
const infoAlgo           = document.getElementById('infoAlgo');
const infoComparisons    = document.getElementById('infoComparisons');
const infoSwaps          = document.getElementById('infoSwaps');
const infoWrites         = document.getElementById('infoWrites');
const infoStatus         = document.getElementById('infoStatus');
const infoComplexity     = document.getElementById('infoComplexity');
const algoTabs           = document.querySelectorAll('.algo-tab');

// Benchmark references
const runBenchmarkBtn    = document.getElementById('runBenchmarkBtn');
const selectAllBenchBtn  = document.getElementById('selectAllBenchBtn');
const deselectAllBenchBtn= document.getElementById('deselectAllBenchBtn');
const benchCheckboxes    = document.querySelectorAll('.bench-checkbox');
const benchDatasetDesc   = document.getElementById('benchDatasetDesc');
const benchmarkEmptyState= document.getElementById('benchmarkEmptyState');
const benchmarkContent   = document.getElementById('benchmarkContent');
const benchmarkSummaryBar= document.getElementById('benchmarkSummaryBar');
const benchmarkTableBody = document.getElementById('benchmarkTableBody');

// ===== HELPERS =====
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDelay() {
  return SPEED_MAP[speedSlider.value];
}

function verifySorted(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) return false;
  }
  return true;
}

// ===== DATASET GENERATION =====
function generateDataset(size, condition) {
  const result = [];
  if (condition === 'sorted') {
    for (let i = 0; i < size; i++) {
      result.push(Math.round(10 + (i / (size - 1 || 1)) * 85));
    }
  } else if (condition === 'reversed') {
    for (let i = 0; i < size; i++) {
      result.push(Math.round(10 + ((size - 1 - i) / (size - 1 || 1)) * 85));
    }
  } else if (condition === 'nearly_sorted') {
    for (let i = 0; i < size; i++) {
      result.push(Math.round(10 + (i / (size - 1 || 1)) * 85));
    }
    // Perturb ~8% of the elements
    const swapsCount = Math.max(1, Math.floor(size * 0.08));
    for (let s = 0; s < swapsCount; s++) {
      const idx1 = Math.floor(Math.random() * size);
      const idx2 = Math.min(size - 1, Math.max(0, idx1 + (Math.random() < 0.5 ? 1 : -1)));
      const temp = result[idx1];
      result[idx1] = result[idx2];
      result[idx2] = temp;
    }
  } else {
    // Random distribution
    for (let i = 0; i < size; i++) {
      result.push(Math.floor(Math.random() * 90) + 10);
    }
  }
  return result;
}

// Generate new array and store as reusable initial dataset
function createNewArray() {
  if (isSorting || isBenchmarking) return;
  const size = parseInt(sizeSlider.value, 10);
  const condition = inputCondition.value;

  initialDataset = generateDataset(size, condition);
  array = [...initialDataset];

  comparisons = 0;
  swaps = 0;
  writes = 0;
  updateStats();
  setStatus('idle');
  renderBars();
  updateBenchmarkDatasetLabel();
}

// Reset array to initial dataset
function resetArray() {
  if (isSorting || isBenchmarking) return;
  if (initialDataset.length === 0) {
    createNewArray();
    return;
  }
  array = [...initialDataset];
  comparisons = 0;
  swaps = 0;
  writes = 0;
  updateStats();
  setStatus('idle');
  renderBars();
}

function updateBenchmarkDatasetLabel() {
  const conditionLabels = {
    random: 'Random',
    nearly_sorted: 'Nearly Sorted (~90%)',
    sorted: 'Already Sorted',
    reversed: 'Reverse Sorted'
  };
  const label = conditionLabels[inputCondition.value] || 'Random';
  if (benchDatasetDesc) {
    benchDatasetDesc.textContent = `${array.length} elements · ${label}`;
  }
}

// ===== RENDER VISUALIZER =====
function renderBars(states = {}) {
  visualizer.innerHTML = '';
  const maxVal = Math.max(...array, 100);

  array.forEach((val, i) => {
    const bar = document.createElement('div');
    bar.classList.add('bar');
    bar.style.height = `${(val / maxVal) * 100}%`;

    if (states[i] === 'comparing')     bar.classList.add('comparing');
    else if (states[i] === 'swapping') bar.classList.add('swapping');
    else if (states[i] === 'sorted')   bar.classList.add('sorted');
    else if (states[i] === 'pivot')    bar.classList.add('pivot');

    visualizer.appendChild(bar);
  });
}

function markAllSorted() {
  const bars = visualizer.querySelectorAll('.bar');
  bars.forEach((bar, i) => {
    setTimeout(() => {
      bar.className = 'bar sorted';
    }, i * 10);
  });
}

// ===== UI & STATS =====
function updateStats() {
  infoComparisons.textContent = comparisons.toLocaleString();
  infoSwaps.textContent = swaps.toLocaleString();
  infoWrites.textContent = writes.toLocaleString();
}

function setStatus(type) {
  const map = {
    idle:    { text: 'Idle',    cls: 'status-idle'    },
    running: { text: 'Running', cls: 'status-running' },
    done:    { text: 'Sorted ✓',cls: 'status-done'    },
  };
  infoStatus.textContent = map[type].text;
  infoStatus.className = `info-value ${map[type].cls}`;
}

function setAlgo(algo) {
  selectedAlgo = algo;
  const meta = ALGO_INFO[algo];
  infoAlgo.textContent = meta.name;
  infoComplexity.textContent = meta.complexity;

  algoTabs.forEach(t => {
    const isActive = t.dataset.algo === algo;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  document.querySelectorAll('.algo-card').forEach(c => c.classList.remove('active-card'));
  const activeCard = document.getElementById(`card-${algo}`);
  if (activeCard) activeCard.classList.add('active-card');
}

function lockUI() {
  isSorting = true;
  sortBtn.disabled = true;
  generateBtn.disabled = true;
  resetBtn.disabled = true;
  runBenchmarkBtn.disabled = true;
  inputCondition.disabled = true;
  sizeSlider.disabled = true;
  algoTabs.forEach(t => t.disabled = true);
}

function unlockUI() {
  isSorting = false;
  sortBtn.disabled = false;
  generateBtn.disabled = false;
  resetBtn.disabled = false;
  runBenchmarkBtn.disabled = false;
  inputCondition.disabled = false;
  sizeSlider.disabled = false;
  algoTabs.forEach(t => t.disabled = false);
}

// ===== ANIMATED SORTING IMPLEMENTATIONS =====

// 1. Bubble Sort
async function bubbleSortVisual() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      updateStats();
      renderBars({ [j]: 'comparing', [j + 1]: 'comparing' });
      await sleep(getDelay());

      if (array[j] > array[j + 1]) {
        const tmp = array[j];
        array[j] = array[j + 1];
        array[j + 1] = tmp;
        swaps++;
        writes += 2;
        swapped = true;
        updateStats();

        renderBars({ [j]: 'swapping', [j + 1]: 'swapping' });
        await sleep(getDelay());
      }
    }
    if (!swapped) break;
  }
}

// 2. Selection Sort
async function selectionSortVisual() {
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
      const tmp = array[i];
      array[i] = array[minIdx];
      array[minIdx] = tmp;
      swaps++;
      writes += 2;
      updateStats();

      renderBars({ [i]: 'swapping', [minIdx]: 'swapping' });
      await sleep(getDelay());
    }
  }
}

// 3. Insertion Sort
async function insertionSortVisual() {
  const n = array.length;
  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;

    renderBars({ [i]: 'pivot' });
    await sleep(getDelay());

    while (j >= 0) {
      comparisons++;
      updateStats();
      renderBars({ [j]: 'comparing', [j + 1]: 'swapping' });
      await sleep(getDelay());

      if (array[j] > key) {
        array[j + 1] = array[j];
        writes++;
        updateStats();
        j--;
      } else {
        break;
      }
    }

    if (j + 1 !== i) {
      array[j + 1] = key;
      writes++;
      updateStats();
      renderBars({ [j + 1]: 'swapping' });
      await sleep(getDelay());
    }
  }
}

// 4. Merge Sort (Visual)
async function mergeSortVisual(start = 0, end = array.length - 1) {
  if (start >= end) return;
  const mid = Math.floor((start + end) / 2);
  await mergeSortVisual(start, mid);
  await mergeSortVisual(mid + 1, end);
  await mergeVisual(start, mid, end);
}

async function mergeVisual(start, mid, end) {
  const left = array.slice(start, mid + 1);
  const right = array.slice(mid + 1, end + 1);
  let i = 0;
  let j = 0;
  let k = start;

  while (i < left.length && j < right.length) {
    comparisons++;
    updateStats();
    renderBars({ [start + i]: 'comparing', [mid + 1 + j]: 'comparing' });
    await sleep(getDelay());

    if (left[i] <= right[j]) {
      array[k] = left[i];
      i++;
    } else {
      array[k] = right[j];
      j++;
    }
    writes++;
    updateStats();
    renderBars({ [k]: 'swapping' });
    await sleep(getDelay());
    k++;
  }

  while (i < left.length) {
    array[k] = left[i];
    writes++;
    updateStats();
    renderBars({ [k]: 'swapping' });
    await sleep(getDelay());
    i++;
    k++;
  }

  while (j < right.length) {
    array[k] = right[j];
    writes++;
    updateStats();
    renderBars({ [k]: 'swapping' });
    await sleep(getDelay());
    j++;
    k++;
  }
}

// 5. Quick Sort (Visual)
async function quickSortVisual(low = 0, high = array.length - 1) {
  if (low < high) {
    const pi = await partitionVisual(low, high);
    await quickSortVisual(low, pi - 1);
    await quickSortVisual(pi + 1, high);
  }
}

async function partitionVisual(low, high) {
  const pivot = array[high];
  let i = low - 1;

  renderBars({ [high]: 'pivot' });
  await sleep(getDelay());

  for (let j = low; j < high; j++) {
    comparisons++;
    updateStats();
    renderBars({ [high]: 'pivot', [j]: 'comparing', ...(i >= low ? { [i]: 'pivot' } : {}) });
    await sleep(getDelay());

    if (array[j] < pivot) {
      i++;
      if (i !== j) {
        const tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
        swaps++;
        writes += 2;
        updateStats();
        renderBars({ [high]: 'pivot', [i]: 'swapping', [j]: 'swapping' });
        await sleep(getDelay());
      }
    }
  }

  if (i + 1 !== high) {
    const tmp = array[i + 1];
    array[i + 1] = array[high];
    array[high] = tmp;
    swaps++;
    writes += 2;
    updateStats();
    renderBars({ [i + 1]: 'swapping', [high]: 'swapping' });
    await sleep(getDelay());
  }

  return i + 1;
}

// ===== MAIN ANIMATED RUNNER =====
async function startSort() {
  if (isSorting || isBenchmarking) return;
  if (array.length === 0) createNewArray();

  comparisons = 0;
  swaps = 0;
  writes = 0;
  updateStats();
  lockUI();
  setStatus('running');

  if (selectedAlgo === 'bubble')    await bubbleSortVisual();
  if (selectedAlgo === 'selection') await selectionSortVisual();
  if (selectedAlgo === 'insertion') await insertionSortVisual();
  if (selectedAlgo === 'merge')     await mergeSortVisual();
  if (selectedAlgo === 'quick')     await quickSortVisual();

  markAllSorted();
  setStatus('done');
  unlockUI();
}

// ===== PURE NON-ANIMATED BENCHMARK SUITE =====
// Benchmark functions execute purely without any DOM manipulation or sleep() calls.
// Each operates on an isolated cloned array.

function benchmarkBubble(sourceArr) {
  const arr = [...sourceArr];
  let comps = 0;
  let swps = 0;
  let wrts = 0;
  const n = arr.length;

  const t0 = performance.now();
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      comps++;
      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
        swps++;
        wrts += 2;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  const t1 = performance.now();

  return {
    timeMs: t1 - t0,
    comparisons: comps,
    swaps: swps,
    writes: wrts,
    isSorted: verifySorted(arr)
  };
}

function benchmarkSelection(sourceArr) {
  const arr = [...sourceArr];
  let comps = 0;
  let swps = 0;
  let wrts = 0;
  const n = arr.length;

  const t0 = performance.now();
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      comps++;
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      const tmp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = tmp;
      swps++;
      wrts += 2;
    }
  }
  const t1 = performance.now();

  return {
    timeMs: t1 - t0,
    comparisons: comps,
    swaps: swps,
    writes: wrts,
    isSorted: verifySorted(arr)
  };
}

function benchmarkInsertion(sourceArr) {
  const arr = [...sourceArr];
  let comps = 0;
  let swps = 0;
  let wrts = 0;
  const n = arr.length;

  const t0 = performance.now();
  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0) {
      comps++;
      if (arr[j] > key) {
        arr[j + 1] = arr[j];
        wrts++;
        j--;
      } else {
        break;
      }
    }
    if (j + 1 !== i) {
      arr[j + 1] = key;
      wrts++;
    }
  }
  const t1 = performance.now();

  return {
    timeMs: t1 - t0,
    comparisons: comps,
    swaps: swps,
    writes: wrts,
    isSorted: verifySorted(arr)
  };
}

function benchmarkMerge(sourceArr) {
  const arr = [...sourceArr];
  let comps = 0;
  let swps = 0;
  let wrts = 0;

  function merge(start, mid, end) {
    const left = arr.slice(start, mid + 1);
    const right = arr.slice(mid + 1, end + 1);
    let i = 0;
    let j = 0;
    let k = start;

    while (i < left.length && j < right.length) {
      comps++;
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        i++;
      } else {
        arr[k] = right[j];
        j++;
      }
      wrts++;
      k++;
    }

    while (i < left.length) {
      arr[k] = left[i];
      wrts++;
      i++;
      k++;
    }

    while (j < right.length) {
      arr[k] = right[j];
      wrts++;
      j++;
      k++;
    }
  }

  function sort(start, end) {
    if (start >= end) return;
    const mid = Math.floor((start + end) / 2);
    sort(start, mid);
    sort(mid + 1, end);
    merge(start, mid, end);
  }

  const t0 = performance.now();
  sort(0, arr.length - 1);
  const t1 = performance.now();

  return {
    timeMs: t1 - t0,
    comparisons: comps,
    swaps: swps,
    writes: wrts,
    isSorted: verifySorted(arr)
  };
}

function benchmarkQuick(sourceArr) {
  const arr = [...sourceArr];
  let comps = 0;
  let swps = 0;
  let wrts = 0;

  function partition(low, high) {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      comps++;
      if (arr[j] < pivot) {
        i++;
        if (i !== j) {
          const tmp = arr[i];
          arr[i] = arr[j];
          arr[j] = tmp;
          swps++;
          wrts += 2;
        }
      }
    }

    if (i + 1 !== high) {
      const tmp = arr[i + 1];
      arr[i + 1] = arr[high];
      arr[high] = tmp;
      swps++;
      wrts += 2;
    }
    return i + 1;
  }

  function sort(low, high) {
    if (low < high) {
      const pi = partition(low, high);
      sort(low, pi - 1);
      sort(pi + 1, high);
    }
  }

  const t0 = performance.now();
  sort(0, arr.length - 1);
  const t1 = performance.now();

  return {
    timeMs: t1 - t0,
    comparisons: comps,
    swaps: swps,
    writes: wrts,
    isSorted: verifySorted(arr)
  };
}

// ===== BENCHMARK EXECUTION CONTROLLER =====
const BENCHMARK_RUNNERS = {
  bubble:    benchmarkBubble,
  selection: benchmarkSelection,
  insertion: benchmarkInsertion,
  merge:     benchmarkMerge,
  quick:     benchmarkQuick
};

async function executeBenchmark() {
  if (isSorting || isBenchmarking) return;

  const selectedKeys = Array.from(benchCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  if (selectedKeys.length === 0) {
    alert('Please select at least one algorithm to benchmark.');
    return;
  }

  // Ensure initialDataset is fresh
  if (initialDataset.length === 0) {
    createNewArray();
  }

  isBenchmarking = true;
  runBenchmarkBtn.disabled = true;
  runBenchmarkBtn.textContent = '⏳ Benchmarking...';

  // Small delay to allow UI state to update before execution
  await sleep(20);

  const results = [];
  for (const key of selectedKeys) {
    const runner = BENCHMARK_RUNNERS[key];
    if (runner) {
      const metrics = runner(initialDataset);
      results.push({
        key,
        name: ALGO_INFO[key].name,
        complexity: ALGO_INFO[key].complexity,
        best: ALGO_INFO[key].best,
        avg: ALGO_INFO[key].avg,
        worst: ALGO_INFO[key].worst,
        space: ALGO_INFO[key].space,
        ...metrics
      });
    }
  }

  renderBenchmarkResults(results);

  isBenchmarking = false;
  runBenchmarkBtn.disabled = false;
  runBenchmarkBtn.textContent = '⚡ Run Benchmark';
}

function renderBenchmarkResults(results) {
  benchmarkEmptyState.classList.add('hidden');
  benchmarkContent.classList.remove('hidden');

  // Find min and max runtime for relative comparison bars
  const maxTime = Math.max(...results.map(r => r.timeMs), 0.001);
  const minTime = Math.min(...results.map(r => r.timeMs));

  // Determine fastest algorithm and key stats
  const fastest = results.slice().sort((a, b) => a.timeMs - b.timeMs)[0];
  const lowestWrites = results.slice().sort((a, b) => a.writes - b.writes)[0];
  const lowestComps = results.slice().sort((a, b) => a.comparisons - b.comparisons)[0];

  // Render Summary Cards
  benchmarkSummaryBar.innerHTML = `
    <div class="summary-card highlight">
      <div class="summary-card-label">Fastest Algorithm</div>
      <div class="summary-card-value accent">${fastest ? fastest.name : '—'}</div>
      <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
        ${fastest ? `${fastest.timeMs.toFixed(3)} ms` : ''}
      </div>
    </div>
    <div class="summary-card">
      <div class="summary-card-label">Fewest Comparisons</div>
      <div class="summary-card-value">${lowestComps ? lowestComps.name : '—'}</div>
      <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
        ${lowestComps ? `${lowestComps.comparisons.toLocaleString()} comparisons` : ''}
      </div>
    </div>
    <div class="summary-card">
      <div class="summary-card-label">Fewest Memory Writes</div>
      <div class="summary-card-value">${lowestWrites ? lowestWrites.name : '—'}</div>
      <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
        ${lowestWrites ? `${lowestWrites.writes.toLocaleString()} writes` : ''}
      </div>
    </div>
    <div class="summary-card">
      <div class="summary-card-label">Active Dataset Size</div>
      <div class="summary-card-value">${initialDataset.length} Elements</div>
      <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">
        Identical Clones
      </div>
    </div>
  `;

  // Render Table Rows
  benchmarkTableBody.innerHTML = '';
  results.forEach(res => {
    const isFastest = res.timeMs === minTime;
    const barPercent = Math.max(4, Math.round((res.timeMs / maxTime) * 100));

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="algo-name-cell">${res.name}</td>
      <td>
        ${res.isSorted
          ? '<span class="status-badge-ok">✓ Sorted</span>'
          : '<span class="status-badge-fail">✗ Unsorted</span>'
        }
      </td>
      <td class="runtime-cell">${res.timeMs < 0.01 ? '< 0.01' : res.timeMs.toFixed(3)} ms</td>
      <td>
        <div class="bar-compare-container">
          <div class="bar-compare-track">
            <div class="bar-compare-fill ${isFastest ? 'fastest' : ''}" style="width: ${barPercent}%"></div>
          </div>
          <span class="bar-compare-label">${barPercent}%</span>
        </div>
      </td>
      <td>${res.comparisons.toLocaleString()}</td>
      <td>${res.swaps.toLocaleString()}</td>
      <td>${res.writes.toLocaleString()}</td>
      <td><span style="color: var(--accent);">${res.best}</span> / ${res.avg} / ${res.worst}</td>
      <td>${res.space}</td>
    `;
    benchmarkTableBody.appendChild(tr);
  });
}

// ===== EVENT LISTENERS =====
generateBtn.addEventListener('click', createNewArray);
resetBtn.addEventListener('click', resetArray);
sortBtn.addEventListener('click', startSort);
runBenchmarkBtn.addEventListener('click', executeBenchmark);

algoTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (!isSorting && !isBenchmarking) setAlgo(tab.dataset.algo);
  });
});

inputCondition.addEventListener('change', () => {
  if (!isSorting && !isBenchmarking) {
    createNewArray();
  }
});

sizeSlider.addEventListener('input', () => {
  sizeVal.textContent = sizeSlider.value;
  if (!isSorting && !isBenchmarking) {
    createNewArray();
  }
});

speedSlider.addEventListener('input', () => {
  speedVal.textContent = SPEED_LABEL[speedSlider.value];
});

selectAllBenchBtn.addEventListener('click', () => {
  benchCheckboxes.forEach(cb => { cb.checked = true; });
});

deselectAllBenchBtn.addEventListener('click', () => {
  benchCheckboxes.forEach(cb => { cb.checked = false; });
});

// ===== INITIALIZATION =====
setAlgo('bubble');
createNewArray();