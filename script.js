// Mini Crossword - Vanilla JS implementation
// Static, GitHub Pages friendly. Loads puzzles from ./puzzles/{date}.json with an index at ./puzzles/index.json

(() => {
  const gridEl = document.getElementById('grid');
  const acrossListEl = document.getElementById('acrossClues');
  const downListEl = document.getElementById('downClues');
  const datePickerEl = document.getElementById('datePicker');
  const prevBtn = document.getElementById('prevPuzzleBtn');
  const nextBtn = document.getElementById('nextPuzzleBtn');
  const toggleDirBtn = document.getElementById('toggleDirBtn');
  const checkWordBtn = document.getElementById('checkWordBtn');
  const revealWordBtn = document.getElementById('revealWordBtn');
  const checkPuzzleBtn = document.getElementById('checkPuzzleBtn');
  const revealPuzzleBtn = document.getElementById('revealPuzzleBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const titleEl = document.getElementById('puzzleTitle');
  const authorEl = document.getElementById('puzzleAuthor');
  const toastEl = document.getElementById('toast');

  const STORAGE_PREFIX = 'mini-crossword-';

  /** @type {{date: string, title?: string, author?: string, grid: string[], clues: {across: string[], down: string[]}}} */
  let puzzle = null;

  /**
   * Internal model of the grid
   * cells: [{ r, c, id, isBlock, solution, user, numberAcross, numberDown, inputEl }]
   */
  let cells = [];
  /** indexes of entries: number -> { id, cells: number[], answer, clue, direction } */
  let acrossEntries = new Map();
  let downEntries = new Map();

  let focusedCellId = null;
  let direction = 'across'; // 'across' | 'down'

  let availableDates = [];

  function showToast(message, ms = 1500) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function todayDateStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }

  function getUrlDateParam() {
    const url = new URL(window.location.href);
    const d = url.searchParams.get('date');
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  }
  function setUrlDateParam(d) {
    const url = new URL(window.location.href);
    url.searchParams.set('date', d);
    history.replaceState({}, '', url.toString());
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    return res.json();
  }

  async function loadIndex() {
    const idx = await fetchJson('./puzzles/index.json');
    if (!Array.isArray(idx) || idx.length === 0) throw new Error('Empty puzzles index');
    availableDates = idx.map(e => e.date).sort();
    // set date picker bounds
    try {
      datePickerEl.min = availableDates[0];
      datePickerEl.max = availableDates[availableDates.length - 1];
    } catch {}
    return idx;
  }

  function findClosestAvailableDate(targetDate) {
    if (availableDates.includes(targetDate)) return targetDate;
    // pick the latest date not after target; else fallback to latest overall
    const sorted = [...availableDates].sort();
    const before = sorted.filter(d => d <= targetDate);
    if (before.length) return before[before.length - 1];
    return sorted[sorted.length - 1];
  }

  async function loadPuzzle(dateStr) {
    let resolved = findClosestAvailableDate(dateStr);
    const meta = { date: resolved };
    try {
      puzzle = await fetchJson(`./puzzles/${resolved}.json`);
      puzzle.date = resolved;
      titleEl.textContent = puzzle.title ? `“${puzzle.title}”` : '';
      authorEl.textContent = puzzle.author ? `by ${puzzle.author}` : '';
    } catch (e) {
      console.error(e);
      showToast('Failed to load puzzle');
      return;
    }
    datePickerEl.value = resolved;
    setUrlDateParam(resolved);
    hydrateModelFromPuzzle();
    renderAll();
    restoreProgress();
  }

  function hydrateModelFromPuzzle() {
    cells = [];
    acrossEntries.clear();
    downEntries.clear();
    const rows = puzzle.grid.length;
    const cols = puzzle.grid[0].length;
    // create cells
    for (let r = 0; r < rows; r++) {
      const rowStr = puzzle.grid[r];
      for (let c = 0; c < cols; c++) {
        const ch = rowStr[c];
        const isBlock = ch === '#';
        cells.push({
          r, c, id: r*cols + c,
          isBlock,
          solution: isBlock ? '' : ch.toUpperCase(),
          user: '',
          numberAcross: 0,
          numberDown: 0,
          inputEl: null,
        });
      }
    }
    // numbering
    let num = 0;
    const get = (r,c) => (r<0||c<0||r>=rows||c>=cols) ? null : cells[r*cols+c];
    // across
    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        const cell = get(r,c);
        if (!cell || cell.isBlock) continue;
        const isStart = (c===0 || get(r,c-1).isBlock);
        if (isStart) {
          num++;
          const entryCells = [];
          let cc = c;
          while (cc<cols && !get(r,cc).isBlock){ entryCells.push(get(r,cc).id); cc++; }
          const answer = entryCells.map(id => cells[id].solution).join('');
          const clueText = (puzzle.clues?.across?.[acrossEntries.size] ?? '');
          entryCells.forEach(id => cells[id].numberAcross = num);
          acrossEntries.set(num, { id: num, cells: entryCells, answer, clue: clueText, direction: 'across' });
        }
      }
    }
    // down
    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        const cell = get(r,c);
        if (!cell || cell.isBlock) continue;
        const isStart = (r===0 || get(r-1,c).isBlock);
        if (isStart) {
          num++;
          const entryCells = [];
          let rr = r;
          while (rr<rows && !get(rr,c).isBlock){ entryCells.push(get(rr,c).id); rr++; }
          const answer = entryCells.map(id => cells[id].solution).join('');
          const clueText = (puzzle.clues?.down?.[downEntries.size] ?? '');
          entryCells.forEach(id => cells[id].numberDown = num);
          downEntries.set(num, { id: num, cells: entryCells, answer, clue: clueText, direction: 'down' });
        }
      }
    }
  }

  function renderAll() {
    renderGrid();
    renderClues();
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    cells.forEach(cell => {
      const cellEl = document.createElement('div');
      cellEl.className = 'cell' + (cell.isBlock ? ' black' : '');
      cellEl.setAttribute('role', 'gridcell');
      cellEl.dataset.id = String(cell.id);
      cellEl.addEventListener('click', () => onCellClick(cell.id));
      if (!cell.isBlock) {
        const num = direction === 'across' ? cell.numberAcross : cell.numberDown;
        const showNum = cell.numberAcross && isEntryStart(cell, 'across') ? cell.numberAcross : (cell.numberDown && isEntryStart(cell, 'down') ? cell.numberDown : 0);
        if (showNum) {
          const numEl = document.createElement('div');
          numEl.className = 'num';
          numEl.textContent = String(showNum);
          cellEl.appendChild(numEl);
        }
        const input = document.createElement('input');
        input.maxLength = 1;
        input.autocapitalize = 'characters';
        input.inputMode = 'text';
        input.setAttribute('aria-label', `Row ${cell.r+1}, Col ${cell.c+1}`);
        input.value = cell.user;
        input.addEventListener('input', (e) => onInput(cell.id, input.value));
        input.addEventListener('keydown', (e) => onKeyDown(e, cell.id));
        input.addEventListener('focus', () => focusCell(cell.id));
        cellEl.appendChild(input);
        cell.inputEl = input;
      }
      gridEl.appendChild(cellEl);
    });
    updateHighlights();
  }

  function renderClues() {
    acrossListEl.innerHTML = '';
    for (const [num, entry] of acrossEntries) {
      const li = document.createElement('li');
      li.className = 'clue';
      li.dataset.entry = String(num);
      li.dataset.dir = 'across';
      li.innerHTML = `<span class="num">${num}</span><span class="text">${entry.clue || ''}</span>`;
      li.addEventListener('click', () => selectEntry(num, 'across'));
      acrossListEl.appendChild(li);
    }
    downListEl.innerHTML = '';
    for (const [num, entry] of downEntries) {
      const li = document.createElement('li');
      li.className = 'clue';
      li.dataset.entry = String(num);
      li.dataset.dir = 'down';
      li.innerHTML = `<span class="num">${num}</span><span class="text">${entry.clue || ''}</span>`;
      li.addEventListener('click', () => selectEntry(num, 'down'));
      downListEl.appendChild(li);
    }
    updateActiveClue();
  }

  function isEntryStart(cell, dir) {
    const rows = puzzle.grid.length, cols = puzzle.grid[0].length;
    if (dir === 'across') {
      return !cell.isBlock && (cell.c === 0 || getCell(cell.r, cell.c-1).isBlock);
    } else {
      return !cell.isBlock && (cell.r === 0 || getCell(cell.r-1, cell.c).isBlock);
    }
  }

  function getCell(r,c){ return cells[r*puzzle.grid[0].length + c]; }

  function onInput(cellId, val) {
    const ch = (val || '').toUpperCase().replace(/[^A-Z]/g, '');
    const cell = cells[cellId];
    cell.user = ch;
    if (cell.inputEl && cell.inputEl.value !== ch) cell.inputEl.value = ch;
    saveProgressDebounced();
    if (ch) moveNext();
    updateHighlights();
  }

  function onKeyDown(e, cellId) {
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
      e.preventDefault();
      navigateByArrow(key);
      return;
    }
    if (key === 'Backspace') {
      const cell = cells[cellId];
      if (!cell.user) {
        movePrev();
      } else {
        cell.user = '';
        if (cell.inputEl) cell.inputEl.value = '';
        saveProgressDebounced();
      }
      updateHighlights();
      return;
    }
    if (key === ' ' || key === 'Spacebar') {
      e.preventDefault();
      toggleDirection();
      return;
    }
    if (key === 'Enter' || key === 'Tab') {
      e.preventDefault();
      jumpToNextEntry();
      return;
    }
  }

  function onCellClick(cellId) {
    const cell = cells[cellId];
    if (!cell || cell.isBlock) return;
    const startAcross = isEntryStart(cell, 'across');
    const startDown = isEntryStart(cell, 'down');
    if (startAcross || startDown) {
      if (startAcross && startDown) {
        if (focusedCellId === cellId && direction === 'across') {
          selectEntry(cell.numberDown, 'down');
        } else {
          selectEntry(cell.numberAcross, 'across');
        }
      } else if (startAcross) {
        selectEntry(cell.numberAcross, 'across');
      } else {
        selectEntry(cell.numberDown, 'down');
      }
    } else {
      focusCell(cellId);
      cell.inputEl?.focus();
    }
    updateHighlights();
  }

  function entryForCell(cellId, dir = direction) {
    const cell = cells[cellId];
    const num = dir === 'across' ? cell.numberAcross : cell.numberDown;
    return dir === 'across' ? acrossEntries.get(num) : downEntries.get(num);
  }

  function focusCell(cellId) {
    focusedCellId = cellId;
    const cell = cells[cellId];
    // if current direction does not exist on this cell, switch
    if (direction === 'across' && !cell.numberAcross) direction = 'down';
    if (direction === 'down' && !cell.numberDown) direction = 'across';
    updateHighlights();
  }

  function focusFirstCellOfEntry(entry) {
    const id = entry.cells[0];
    const cell = cells[id];
    focusedCellId = id;
    setTimeout(() => cell.inputEl?.focus(), 0);
  }

  function selectEntry(num, dir) {
    direction = dir;
    const entry = dir === 'across' ? acrossEntries.get(num) : downEntries.get(num);
    if (!entry) return;
    focusFirstCellOfEntry(entry);
    updateHighlights();
  }

  function toggleDirection() {
    direction = direction === 'across' ? 'down' : 'across';
    updateHighlights();
    showToast(direction.toUpperCase());
  }

  function navigateByArrow(key) {
    const rows = puzzle.grid.length, cols = puzzle.grid[0].length;
    if (focusedCellId == null) return;
    const cell = cells[focusedCellId];
    let { r, c } = cell;
    if (key === 'ArrowLeft') { c--; direction = 'across'; }
    if (key === 'ArrowRight') { c++; direction = 'across'; }
    if (key === 'ArrowUp') { r--; direction = 'down'; }
    if (key === 'ArrowDown') { r++; direction = 'down'; }
    while (r>=0 && r<rows && c>=0 && c<cols && getCell(r,c).isBlock) {
      if (key === 'ArrowLeft') c--; if (key === 'ArrowRight') c++; if (key === 'ArrowUp') r--; if (key === 'ArrowDown') r++;
    }
    if (r>=0 && r<rows && c>=0 && c<cols && !getCell(r,c).isBlock) {
      focusedCellId = getCell(r,c).id;
      getCell(r,c).inputEl?.focus();
      updateHighlights();
    }
  }

  function moveNext() {
    const entry = entryForCell(focusedCellId);
    const idx = entry.cells.indexOf(focusedCellId);
    if (idx < entry.cells.length - 1) {
      focusedCellId = entry.cells[idx + 1];
      cells[focusedCellId].inputEl?.focus();
    } else {
      jumpToNextEntry();
    }
  }
  function movePrev() {
    const entry = entryForCell(focusedCellId);
    const idx = entry.cells.indexOf(focusedCellId);
    if (idx > 0) {
      focusedCellId = entry.cells[idx - 1];
      cells[focusedCellId].inputEl?.focus();
    }
  }

  function jumpToNextEntry() {
    const list = direction === 'across' ? [...acrossEntries.keys()] : [...downEntries.keys()];
    const current = entryForCell(focusedCellId).id;
    const pos = list.indexOf(current);
    const next = list[(pos + 1) % list.length];
    selectEntry(next, direction);
  }

  function updateHighlights() {
    const entry = focusedCellId != null ? entryForCell(focusedCellId) : null;
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('highlight','active'));
    document.querySelectorAll('.clue').forEach(el => el.classList.remove('active'));
    if (entry) {
      for (const id of entry.cells) {
        const el = gridEl.querySelector(`.cell[data-id="${id}"]`);
        el?.classList.add('highlight');
      }
      const activeEl = gridEl.querySelector(`.cell[data-id="${focusedCellId}"]`);
      activeEl?.classList.add('active');
      const listEl = (entry.direction === 'across' ? acrossListEl : downListEl)
        .querySelector(`.clue[data-entry="${entry.id}"]`);
      listEl?.classList.add('active');
    }
  }

  function getSaveKey() {
    return STORAGE_PREFIX + (puzzle?.date || '');
  }
  function saveProgress() {
    try {
      const state = cells.map(c => c.user || '.');
      localStorage.setItem(getSaveKey(), JSON.stringify(state));
    } catch {}
  }
  let saveTimer = null;
  function saveProgressDebounced() {
    clearTimeout(saveTimer); saveTimer = setTimeout(saveProgress, 150);
  }
  function restoreProgress() {
    try {
      const state = JSON.parse(localStorage.getItem(getSaveKey()) || '[]');
      if (Array.isArray(state) && state.length === cells.length) {
        cells.forEach((c,i) => { c.user = state[i] === '.' ? '' : state[i]; c.inputEl && (c.inputEl.value = c.user); });
      }
    } catch {}
    // focus first entry
    const firstAcross = acrossEntries.values().next().value;
    if (firstAcross) { focusFirstCellOfEntry(firstAcross); }
    updateHighlights();
  }

  function clearAll() {
    cells.forEach(c => { if (!c.isBlock) { c.user = ''; c.inputEl && (c.inputEl.value = ''); c.inputEl && c.inputEl.classList.remove('error','revealed'); } });
    saveProgress();
    showToast('Cleared');
  }

  function checkEntry(entry) {
    let allCorrect = true;
    for (const id of entry.cells) {
      const c = cells[id];
      const ok = c.user === '' || c.user === c.solution;
      if (!ok) { allCorrect = false; c.inputEl?.classList.add('error'); }
    }
    setTimeout(() => entry.cells.forEach(id => cells[id].inputEl?.classList.remove('error')), 800);
    return allCorrect;
  }
  function revealEntry(entry) {
    for (const id of entry.cells) {
      const c = cells[id];
      c.user = c.solution; if (c.inputEl) { c.inputEl.value = c.solution; c.inputEl.classList.add('revealed'); }
    }
    saveProgress();
  }
  function checkPuzzle() {
    let ok = true;
    for (const e of acrossEntries.values()) ok = checkEntry(e) && ok;
    for (const e of downEntries.values()) ok = checkEntry(e) && ok;
    showToast(ok ? 'Looks good!' : 'Some letters are off');
  }
  function revealPuzzle() {
    for (const e of acrossEntries.values()) revealEntry(e);
    saveProgress();
  }

  // Navigation helpers
  prevBtn.addEventListener('click', () => navigateRelative(-1));
  nextBtn.addEventListener('click', () => navigateRelative(1));
  function navigateRelative(delta) {
    const i = availableDates.indexOf(puzzle.date);
    if (i === -1) return;
    const j = Math.min(Math.max(i + delta, 0), availableDates.length - 1);
    const d = availableDates[j];
    loadPuzzle(d);
  }

  toggleDirBtn.addEventListener('click', toggleDirection);
  checkWordBtn.addEventListener('click', () => { const e = entryForCell(focusedCellId); if (e) checkEntry(e); });
  revealWordBtn.addEventListener('click', () => { const e = entryForCell(focusedCellId); if (e) revealEntry(e); });
  checkPuzzleBtn.addEventListener('click', checkPuzzle);
  revealPuzzleBtn.addEventListener('click', revealPuzzle);
  clearAllBtn.addEventListener('click', clearAll);

  datePickerEl.addEventListener('change', () => {
    const val = datePickerEl.value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) { loadPuzzle(val); }
  });

  // Init
  (async function init() {
    try {
      await loadIndex();
      const urlDate = getUrlDateParam();
      await loadPuzzle(urlDate || todayDateStr());
    } catch (e) {
      console.error(e);
      showToast('Error initializing app');
    }
  })();
})();

