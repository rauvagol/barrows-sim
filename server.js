const http = require('http');

const PORT = process.env.PORT || 3000;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Barrows Sim – Minimal UI</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
    body { margin: 0; background: #ffffff; color: #111111; }
    .wrap { max-width: 1920px; margin: 24px auto; padding: 16px; }
    h1 { font-size: 18px; margin: 0 0 16px 0; }
    /* Top row: dropdowns with labels */
    .row { display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 12px; padding: 12px; border: 1px solid #cccccc; border-radius: 8px; }
    .dropdown-item { display: flex; align-items: center; column-gap: 6px; }
    .dropdown-item label { width: 56px; flex: 0 0 56px; }
    .dropdown-item select { flex: 1 1 auto; min-width: 200px; width: 100%; }
    /* Grid of rectangles */
    .grid { display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 12px; padding: 12px; border: 1px solid #cccccc; border-radius: 8px; margin-top: 16px; }
    .grid .col { display: grid; gap: 10px; min-width: 0; }
    .col-title { text-align: center; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .slot { display: flex; align-items: center; column-gap: 6px; min-width: 0; }
    .slot label { font-size: 12px; color: #444; width: 56px; flex: 0 0 56px; }
    .state-select { padding: 8px 10px; border-radius: 6px; border: 1px solid #cfcfcf; background: #f7f7f7; flex: 1; max-width: 100%; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* Controls */
    .controls { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #cccccc; border-radius: 8px; margin-top: 16px; }
    .num { width: 120px; padding: 8px 10px; border-radius: 6px; border: 1px solid #cfcfcf; text-align: center; }
    .btn { padding: 8px 14px; border-radius: 6px; border: 1px solid #cfcfcf; background: #f7f7f7; cursor: pointer; }
    /* Output (hidden) */
    .out { display: none; margin-top: 12px; padding: 12px; border: 1px dashed #cccccc; border-radius: 8px; background: #fafafa; color: #111; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; min-height: 80px; }
    /* Summary grid aligned with columns */
    .summary { display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 12px; padding: 12px; border: 1px solid #cccccc; border-radius: 8px; margin-top: 12px; }
    .res-col { display: grid; gap: 8px; align-content: start; }
    .res-title { text-align: center; font-weight: 700; }
    .title-bar { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 12px; padding: 6px 42px; border: 1px solid #cccccc; border-radius: 8px; background: #fafafa; margin-top: 12px; align-items: center; position: relative; }
    .title-cell { text-align: center; font-weight: 700; font-size: 14px; padding: 3px 10px; }
    .collapse-btn { position: absolute; left: 8px; right: auto; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1px solid #cfcfcf; background: #f7f7f7; border-radius: 4px; cursor: pointer; font-size: 22px; line-height: 1; }
    .summary.collapsed .res-col { display: none; }
    .res-line { padding: 8px 10px; border: 1px dashed #cccccc; border-radius: 6px; background: #fafafa; text-align: center; }
    .kill-line { min-height: 46px; display: flex; align-items: center; justify-content: center; }
    /* Optimal table */
    .opt-table { grid-column: 1 / -1; }
    .opt-table table { width: 100%; border-collapse: collapse; }
    .opt-table th, .opt-table td { border: 1px dashed #cccccc; padding: 8px 10px; text-align: center; background: #fafafa; }
    .opt-toolbar { grid-column: 1 / -1; display: flex; gap: 8px; justify-content: flex-end; margin: 8px 0; }

    /* Responsive columns: default 3 → 2 → 1, with fixed-width 6 on very wide screens */
    @media (min-width: 1920px) {
      .wrap { max-width: 1582px; }
      .row, .grid { grid-template-columns: repeat(6, 244px); justify-content: center; }
      .summary { grid-template-columns: repeat(6, 244px); justify-content: center; }
      .title-bar { grid-template-columns: repeat(6, 244px); justify-content: center; }
      /* Ensure top selects fit within 238px column alongside the label */
      .dropdown-item select { min-width: 0; }
    }
    @media (max-width: 900px) {
      .row, .grid { grid-template-columns: repeat(2, minmax(260px, 1fr)); }
      .summary { grid-template-columns: repeat(2, minmax(260px, 1fr)); }
      .title-bar { grid-template-columns: repeat(2, minmax(260px, 1fr)); }
    }
    @media (max-width: 620px) {
      .row, .grid { grid-template-columns: 1fr; }
      .summary { grid-template-columns: 1fr; }
      .title-bar { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Barrows – quick setup</h1>

    <div id="dropdowns" class="row"></div>

    <div id="gearGrid" class="grid"></div>

    <div class="controls">
      <label for="wantedWeight">Wanted weight</label>
      <input id="wantedWeight" class="num" type="number" min="0.1" max="0.9" step="0.1" value="0.5" />
      <button id="simulate" class="btn">Calculate</button>
      <button id="optimize" class="btn" style="margin-left:auto">Find optimal strategy</button>
    </div>
    <div id="output" class="out"></div>
    <div id="summary" class="summary"></div>
    <div id="optimal" class="summary"></div>
  </div>

  <script>
    const brothers = ["Ahrim","Dharok","Guthan","Karil","Torag","Verac"];
    const slots = ["Head","Body","Legs","Weapon"];

    const skipOptions = [
      "Always skip (default)",
      "Skip if tunnel boss",
      "Skip if no gear needed",
      "Skip if tunnel or unneeded",
      "Skip if no gear wanted",
      "Skip if tunnel or unwanted",
      "Always kill"
    ];

    const dropdownsEl = document.getElementById('dropdowns');
    const gridEl = document.getElementById('gearGrid');
    const outputEl = document.getElementById('output');
    const summaryEl = document.getElementById('summary');

    const dropdownState = {};
    const gearState = {};

    // Simple cookie persistence
    const COOKIE_NAME = 'barrowsSimState';
    function readCookie(name) {
      const parts = document.cookie.split('; ').filter(Boolean);
      for (let i = 0; i < parts.length; i++) {
        const row = parts[i];
        if (row.indexOf(name + '=') === 0) {
          try { return JSON.parse(decodeURIComponent(row.slice(name.length + 1))); }
          catch (e) { return null; }
        }
      }
      return null;
    }
    function writeCookie(name, value) {
      const maxAge = 60 * 60 * 24 * 365; // 1 year
      document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + '; path=/; max-age=' + maxAge;
    }
    const savedState = readCookie(COOKIE_NAME) || null;
    function saveState() {
      writeCookie(COOKIE_NAME, { choices: dropdownState, gear: gearState });
    }

    // Top rule dropdowns
    brothers.forEach((name) => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      const label = document.createElement('label');
      label.textContent = name;
      const sel = document.createElement('select');
      sel.setAttribute('data-brother', name);
      skipOptions.forEach((opt, i) => {
        const o = document.createElement('option');
        o.value = opt; o.textContent = opt;
        sel.appendChild(o);
      });
      item.appendChild(label);
      item.appendChild(sel);
      dropdownsEl.appendChild(item);
      const initialRule = (savedState && savedState.choices && savedState.choices[name]) || skipOptions[0];
      sel.value = initialRule;
      dropdownState[name] = initialRule;
      sel.addEventListener('change', () => {
        dropdownState[name] = sel.value;
        saveState();
      });
    });

    // Gear desirability grid
    brothers.forEach((name) => {
      const col = document.createElement('div');
      col.className = 'col';
      const title = document.createElement('div');
      title.className = 'col-title';
      title.textContent = name;
      col.appendChild(title);

      gearState[name] = {};
      slots.forEach((slot) => {
        gearState[name][slot] = 'unwanted';
        const row = document.createElement('div');
        row.className = 'slot';
        const lab = document.createElement('label');
        lab.textContent = slot;
        const sel = document.createElement('select');
        sel.className = 'state-select';
        ['unwanted','wanted','needed'].forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt; o.textContent = opt;
          sel.appendChild(o);
        });
        const initialPref = (savedState && savedState.gear && savedState.gear[name] && savedState.gear[name][slot]) || 'unwanted';
        sel.value = initialPref;
        gearState[name][slot] = initialPref;
        sel.addEventListener('change', () => {
          gearState[name][slot] = sel.value;
          saveState();
        });
        row.appendChild(lab);
        row.appendChild(sel);
        col.appendChild(row);
      });

      gridEl.appendChild(col);
    });

    // Simulate -> dump selections JSON and show aligned summary
    document.getElementById('simulate').addEventListener('click', () => {
      const wantedWeight = Math.min(0.9, Math.max(0.1, parseFloat(document.getElementById('wantedWeight').value) || 0.5));
      const payload = {
        choices: dropdownState,
        gear: gearState
      };
      outputEl.textContent = JSON.stringify(payload, null, 2);

      // Build summary grid aligned with columns
      const linesPerBoss = [];
      const rulesShort = {
        'Always skip (default)': 'always skip',
        'Skip if tunnel boss': 'skip if tunnel',
        'Skip if no gear needed': 'skip if unneeded',
        'Skip if tunnel or unneeded': 'skip if tunnel/unneeded',
        'Skip if tunnel or unwanted': 'skip if tunnel/unwanted',
        'Always kill': 'always kill'
      };

      brothers.forEach((name) => {
        const ruleText = rulesShort[dropdownState[name]] || dropdownState[name];
        linesPerBoss.push({ name, ruleText });
      });

      // Helper logic for kill decision
      function hasNeeded(prefs) {
        for (const k in prefs) { if (prefs[k] === 'needed') return true; }
        return false;
      }
      function hasWanted(prefs) {
        if (hasNeeded(prefs)) return true;
        for (const k in prefs) { if (prefs[k] === 'wanted') return true; }
        return false;
      }
      function shouldKill(rule, isTunnel, prefs) {
        switch (rule) {
          case 'Always skip (default)':
            return false;
          case 'Skip if tunnel boss':
            return !isTunnel;
          case 'Skip if no gear needed':
            return hasNeeded(prefs);
          case 'Skip if tunnel or unneeded':
            return !isTunnel && hasNeeded(prefs);
          case 'Skip if tunnel or unwanted':
            return !isTunnel && hasWanted(prefs);
          case 'Always kill':
            return true;
          default:
            return false;
        }
      }

      summaryEl.innerHTML = '';
      // Create continuous header bar spanning all columns
      const titleBar = document.createElement('div');
      titleBar.className = 'title-bar';
      const collapse = document.createElement('button');
      collapse.className = 'collapse-btn';
      collapse.setAttribute('aria-label', 'Toggle details');
      collapse.textContent = '▸';
      collapse.addEventListener('click', () => {
        const isCollapsed = summaryEl.classList.toggle('collapsed');
        collapse.textContent = isCollapsed ? '▸' : '▾';
      });
      titleBar.appendChild(collapse);
      summaryEl.appendChild(titleBar);
      // start collapsed
      summaryEl.classList.add('collapsed');
      let sumUseful = 0;
      let sumTotalDrops = 0;
      let sumPct = 0; // sum of (useful/total) per scenario
      let sumExpUniques = 0; // sum of expected uniques per chest across scenarios
      linesPerBoss.forEach(({ name, ruleText }) => {
        const col = document.createElement('div');
        col.className = 'res-col';
        // Add a header cell into the shared title bar for this column
        const title = document.createElement('div');
        title.className = 'title-cell';
        title.textContent = 'Tunnel ' + name;
        titleBar.appendChild(title);
        const rule = document.createElement('div');
        rule.className = 'res-line';
        rule.textContent = ruleText;
        // Compute result for this tunnel
        const killed = [];
        for (let bi = 0; bi < brothers.length; bi++) {
          const nm = brothers[bi];
          const kill = shouldKill(dropdownState[nm], nm === name, gearState[nm]);
          if (kill) killed.push(nm);
        }
        const result = document.createElement('div');
        result.className = 'res-line kill-line';
        result.textContent = 'kills: ' + killed.length + (killed.length ? ' — ' + killed.join(', ') : '');
        // Unique rate per chest based on kills → mapped denominators from wiki
        const rolls = killed.length + 1;
        const denom = killed.length > 0 ? (450 - 58 * killed.length) : null; // programmatic: 450 - 58*kills
        // sanity check with known mapping (should match)
        // const chestDenomMap = { 1: 392, 2: 334, 3: 276, 4: 218, 5: 160, 6: 102 };
        // if (killed.length in chestDenomMap && chestDenomMap[killed.length] !== denom) { console.warn('Denominator mismatch'); }
        const unique = document.createElement('div');
        unique.className = 'res-line';
        function fmtPctValue(num) { return Number(num.toFixed(2)).toString() + '%'; }
        unique.textContent = denom
          ? ('unique: ' + rolls + ' rolls, 1/' + denom + ' (' + fmtPctValue(100/denom) + ')')
          : ('unique: ' + rolls + ' rolls, n/a');
        const expected = document.createElement('div');
        expected.className = 'res-line';
        const perRollDenomExp = 102; // p = 1/102 per roll
        const expItems = rolls / perRollDenomExp; // E[count] = rolls * p
        const expInv = (expItems > 0) ? (perRollDenomExp / rolls) : Infinity;
        expected.textContent = 'expected uniques: ' + expItems.toFixed(4) + ' per chest (≈ 1 per ' + expInv.toFixed(2) + ' chests)';
        sumExpUniques += expItems;
        col.appendChild(rule);
        col.appendChild(result);
        col.appendChild(unique);
        col.appendChild(expected);
        // Possible drops section
        let neededCount = 0;
        let wantedCount = 0;
        for (let i = 0; i < killed.length; i++) {
          const prefs = gearState[killed[i]];
          for (let s = 0; s < slots.length; s++) {
            const v = prefs[slots[s]];
            if (v === 'needed') neededCount += 1;
            else if (v === 'wanted') wantedCount += 1;
          }
        }
        const weightedWanted = Math.round(wantedCount * wantedWeight * 100) / 100; // keep 2 decimals
        const usefulCount = neededCount + weightedWanted;
        const totalDrops = 4 * killed.length;
        const unwantedCount = totalDrops - usefulCount;
        function pct(n) {
          if (totalDrops <= 0) return '0%';
          const p = (n * 100) / totalDrops;
          return Number(p.toFixed(2)).toString() + '%';
        }
        const dropsNeeded = document.createElement('div');
        dropsNeeded.className = 'res-line';
        dropsNeeded.textContent = 'needed drops: ' + neededCount + ' (' + pct(neededCount) + ')';
        const dropsWanted = document.createElement('div');
        dropsWanted.className = 'res-line';
        dropsWanted.textContent = 'wanted drops: ' + wantedCount + ' (' + pct(wantedCount) + ')';
        const dropsUseful = document.createElement('div');
        dropsUseful.className = 'res-line';
        dropsUseful.textContent = 'useful drops: ' + usefulCount + ' (' + pct(usefulCount) + ')';
        const dropsUnwanted = document.createElement('div');
        dropsUnwanted.className = 'res-line';
        dropsUnwanted.textContent = 'unwanted drops: ' + unwantedCount + ' (' + pct(unwantedCount) + ')';
        col.appendChild(dropsNeeded);
        col.appendChild(dropsWanted);
        col.appendChild(dropsUseful);
        col.appendChild(dropsUnwanted);
        summaryEl.appendChild(col);

        // accumulate for weighted line
        sumUseful += usefulCount;
        sumTotalDrops += totalDrops;
        sumPct += totalDrops > 0 ? (usefulCount / totalDrops) : 0;
      });

      // Full-width weighted useful percent line
      const scenarios = brothers.length;
      const avgUseful = scenarios ? (sumUseful / scenarios) : 0;
      const avgTotal = scenarios ? (sumTotalDrops / scenarios) : 0;
      const avgPct = scenarios ? (sumPct / scenarios) * 100 : 0;
      function fmtNum(n) { return Number(n.toFixed(2)).toString(); }
      function fmtPctVal(n) { return Number(n.toFixed(2)).toString() + '%'; }
      const weightedLine = document.createElement('div');
      weightedLine.className = 'res-line';
      weightedLine.style.gridColumn = '1 / -1';
      weightedLine.textContent = 'weighted useful: ' + fmtNum(avgUseful) + ' of ' + fmtNum(avgTotal) + ' (' + fmtPctVal(avgPct) + ')';
      summaryEl.appendChild(weightedLine);

      // Expected useful items using expected-uniques × useful%
      const avgExpUniques = scenarios ? (sumExpUniques / scenarios) : 0;
      const expectedUsefulItems = avgExpUniques * (avgPct / 100);
      const expectedChestsPerUseful = expectedUsefulItems > 0 ? (1 / expectedUsefulItems) : Infinity;
      const expectedUsefulLine = document.createElement('div');
      expectedUsefulLine.className = 'res-line';
      expectedUsefulLine.style.gridColumn = '1 / -1';
      expectedUsefulLine.textContent = 'expected useful: ' + Number(expectedUsefulItems.toFixed(4)).toString() + ' per chest (≈ 1 per ' + Number(expectedChestsPerUseful.toFixed(2)).toString() + ' chests)';
      summaryEl.appendChild(expectedUsefulLine);

      // Normalize heights of all kill lines so they match the tallest
      (function normalizeKillHeights() {
        const nodes = Array.from(summaryEl.querySelectorAll('.kill-line'));
        if (!nodes.length) return;
        nodes.forEach(n => { n.style.height = ''; });
        const maxH = nodes.reduce((m, n) => Math.max(m, n.offsetHeight), 0);
        nodes.forEach(n => { n.style.height = maxH + 'px'; });
      })();
    });

    // Find optimal strategy: for now, emit a random 6-character string (digits 1-7)
    document.getElementById('optimize').addEventListener('click', () => {
      // Generic seed generator for any digit set and length
      function generateSeeds(digits, length) {
        const out = [];
        function rec(pos, prefix) {
          if (pos === length) { out.push(prefix); return; }
          for (let i = 0; i < digits.length; i++) rec(pos + 1, prefix + digits[i]);
        }
        rec(0, '');
        return out;
      }

      const container = document.getElementById('optimal');
      if (!container) return;
      container.innerHTML = '';

      // Build table header
      const wrapper = document.createElement('div');
      wrapper.className = 'opt-table';
      const hdrLine = document.createElement('div');
      hdrLine.className = 'res-line';
      hdrLine.style.gridColumn = '1 / -1';
      hdrLine.textContent = '64 permutations';
      wrapper.appendChild(hdrLine);
      // remove toolbar; sorting will be via header clicks

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const hdr = document.createElement('tr');
      const headerLabels = ['seed','Ahrim','Dharok','Guthan','Karil','Torag','Verac','useful avg','drops avg','useful %','expected useful','expected chests'];
      headerLabels.forEach(h => {
        const th = document.createElement('th'); th.textContent = h; th.dataset.base = h;
        const keyMap = {
          'seed': 'seed',
          'useful avg': 'useful',
          'drops avg': 'drops',
          'useful %': 'pct',
          'expected useful': 'expUseful',
          'expected chests': 'expChests'
        };
        const k = keyMap[h.toLowerCase()];
        if (k) { th.dataset.sortKey = k; th.style.cursor = 'pointer'; }
        hdr.appendChild(th);
      });
      thead.appendChild(hdr);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      const rowsData = [];

      const labelsShort = {
        'Always skip (default)': 'always skip',
        'Skip if tunnel boss': 'skip if tunnel',
        'Skip if no gear needed': 'skip if unneeded',
        'Skip if tunnel or unneeded': 'skip if tunnel/unneeded',
        'Skip if no gear wanted': 'skip if unwanted',
        'Skip if tunnel or unwanted': 'skip if tunnel/unwanted',
        'Always kill': 'always kill'
      };

      function hasNeededLocal(prefs) { for (const k in prefs) { if (prefs[k] === 'needed') return true; } return false; }
      function hasWantedLocal(prefs) { if (hasNeededLocal(prefs)) return true; for (const k in prefs) { if (prefs[k] === 'wanted') return true; } return false; }
      function shouldKillLocal(rule, isTunnel, prefs) {
        switch (rule) {
          case 'Always skip (default)': return false;
          case 'Skip if tunnel boss': return !isTunnel;
          case 'Skip if no gear needed': return hasNeededLocal(prefs);
          case 'Skip if tunnel or unneeded': return !isTunnel && hasNeededLocal(prefs);
          case 'Skip if no gear wanted': return hasWantedLocal(prefs);
          case 'Skip if tunnel or unwanted': return !isTunnel && hasWantedLocal(prefs);
          case 'Always kill': return true;
          default: return false;
        }
      }

      const wantedWeight = Math.min(0.9, Math.max(0.1, parseFloat(document.getElementById('wantedWeight').value) || 0.5));
      const seeds = generateSeeds(['1','2','4','7'], brothers.length);
      // Update header with programmatic permutation count (kept updated later after filtering)
      const totalPerms = seeds.length;
      hdrLine.textContent = totalPerms + ' permutations';

      function evaluateSeed(code) {
        // Map seed to rules (1-indexed into skipOptions)
        const rulesForSeed = {};
        for (let i = 0; i < brothers.length; i++) {
          const idx = Math.max(1, Math.min(7, parseInt(code[i], 10) || 1)) - 1;
          rulesForSeed[brothers[i]] = skipOptions[idx];
        }
        // Evaluate across tunnels
        let sumUseful = 0, sumTotal = 0, sumPct = 0, sumExpUniques = 0;
        for (let t = 0; t < brothers.length; t++) {
          const tunnel = brothers[t];
          const killed = [];
          for (let bi = 0; bi < brothers.length; bi++) {
            const nm = brothers[bi];
            if (shouldKillLocal(rulesForSeed[nm], nm === tunnel, gearState[nm])) killed.push(nm);
          }
          let neededCount = 0, wantedCount = 0;
          for (let i = 0; i < killed.length; i++) {
            const prefs = gearState[killed[i]];
            for (let s = 0; s < slots.length; s++) {
              const v = prefs[slots[s]];
              if (v === 'needed') neededCount++;
              else if (v === 'wanted') wantedCount++;
            }
          }
          const weightedWanted = Math.round(wantedCount * wantedWeight * 100) / 100;
          const useful = neededCount + weightedWanted;
          const totalDrops = 4 * killed.length;
          sumUseful += useful; sumTotal += totalDrops; sumPct += totalDrops > 0 ? (useful / totalDrops) : 0;
          const rolls = killed.length + 1; sumExpUniques += rolls / 102;
        }
        const scenarios = brothers.length;
        const avgUseful = scenarios ? (sumUseful / scenarios) : 0;
        const avgTotal = scenarios ? (sumTotal / scenarios) : 0;
        const avgPct = scenarios ? (sumPct / scenarios) * 100 : 0;
        const avgExpUniques = scenarios ? (sumExpUniques / scenarios) : 0;
        const expUseful = avgExpUniques * (avgPct / 100);
        const expChests = expUseful > 0 ? (1 / expUseful) : Infinity;
        return {
          seed: code,
          byBoss: brothers.map(b => labelsShort[rulesForSeed[b]] || rulesForSeed[b]),
          useful: Number(avgUseful.toFixed(2)),
          drops: Number(avgTotal.toFixed(2)),
          pct: Number(avgPct.toFixed(2)),
          expUseful: Number(expUseful.toFixed(4)),
          expChests: isFinite(expChests) ? Number(expChests.toFixed(2)) : Infinity
        };
      }

      // Precompute which bosses have at least one item marked as needed
      const bossHasNeeded = {};
      for (let i = 0; i < brothers.length; i++) {
        const name = brothers[i];
        let has = false;
        for (let s = 0; s < slots.length; s++) {
          if (gearState[name][slots[s]] === 'needed') { has = true; break; }
        }
        bossHasNeeded[name] = has;
      }

      // Baseline first: all 7s
      const baseline = '7'.repeat(brothers.length);
      const baselineRow = evaluateSeed(baseline);
      const rowsDataKept = [baselineRow];

      // Evaluate and keep only seeds with expected useful >= baseline
      for (let r = 0; r < seeds.length; r++) {
        const code = seeds[r];
        if (code === baseline) continue;
        // Rule: if a boss has no items marked as needed, skip seeds with '4' in that boss's position
        let invalid = false;
        for (let i = 0; i < brothers.length; i++) {
          if (code[i] === '4' && !bossHasNeeded[brothers[i]]) { invalid = true; break; }
        }
        if (invalid) continue;
        const row = evaluateSeed(code);
        if (row.expUseful >= baselineRow.expUseful) rowsDataKept.push(row);
      }

      // Update header to show kept/total
      const keptCount = rowsDataKept.length;
      hdrLine.textContent = keptCount + ' of ' + totalPerms + ' permutations kept';

      function renderRows(sorted) {
        tbody.innerHTML = '';
        sorted.forEach(row => {
          const tr = document.createElement('tr');
          const cols = [row.seed].concat(row.byBoss).concat([
            row.useful.toString(),
            row.drops.toString(),
            row.pct.toString() + '%',
            row.expUseful.toString(),
            (isFinite(row.expChests) ? row.expChests.toString() : '∞')
          ]);
          cols.forEach(val => { const td = document.createElement('td'); td.textContent = val; tr.appendChild(td); });
          tbody.appendChild(tr);
        });
      }

      function sortAndRenderByKey(key) {
        const eps = 1e-9;
        const tunnelRank = { Torag: 4, Guthan: 3, Dharok: 2, Verac: 1, Ahrim: 0, Karil: 0 };
        const sorted = rowsData.slice().sort((a,b)=>{
          if (key === 'seed' || !key) return a.seed.localeCompare(b.seed);
          if (key === 'expChests') {
            const d = a.expChests - b.expChests; if (Math.abs(d) > eps) return d; // ascending
          } else {
            const d = b[key] - a[key]; if (Math.abs(d) > eps) return d; // descending
          }
          // tiebreaker: prefer fighting D/G/T/V tunnel over A/K by rescoring tunnel presence
          // Since we did not store tunnelScore, recompute quick proxy from byBoss labels
          const score = (row) => row.byBoss.reduce((acc,label,idx)=>{
            const name = brothers[idx];
            // If label implies we would kill the tunnel boss, add its rank; here we assume any non 'always skip' allows killing when not tunnel-restricted.
            // This proxy keeps ordering stable without affecting metrics.
            return acc + (tunnelRank[name] || 0);
          },0);
          const ta = score(a), tb = score(b); if (ta !== tb) return tb - ta;
          return a.seed.localeCompare(b.seed);
        });
        // mark active header with ▾
        const ths = Array.from(thead.querySelectorAll('th'));
        ths.forEach(th => { th.textContent = th.dataset.base || th.textContent; });
        const active = ths.find(th => th.dataset.sortKey === key);
        if (active) active.textContent = (active.dataset.base || active.textContent) + ' ▾';
        renderRows(sorted);
      }

      // attach click listeners on sortable headers
      Array.from(thead.querySelectorAll('th')).forEach(th => {
        if (th.dataset.sortKey) {
          th.addEventListener('click', () => sortAndRenderByKey(th.dataset.sortKey));
        }
      });

      // default sort by seed using kept rows
      const rowsDataFinal = (typeof rowsDataKept !== 'undefined') ? rowsDataKept : rowsData;
      // overwrite rowsData reference for render functions
      rowsData.length = 0; Array.prototype.push.apply(rowsData, rowsDataFinal);
      sortAndRenderByKey('seed');

      table.appendChild(tbody);
      wrapper.appendChild(table);
      container.appendChild(wrapper);
    });
  </script>
  </body>
</html>`;


const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') {
    res.statusCode = 204;
    return res.end();
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


