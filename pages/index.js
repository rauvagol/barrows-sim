import { useEffect, useMemo, useRef, useState } from 'react';

export default function HomePage() {
  const brothers = useMemo(() => ["Ahrim","Dharok","Guthan","Karil","Torag","Verac"], []);
  const slots = useMemo(() => ["Head","Body","Legs","Weapon"], []);
  const skipOptions = useMemo(() => [
    "Always skip (default)",
    "Skip if tunnel boss",
    "Skip if no gear needed",
    "Skip if tunnel or unneeded",
    "Skip if no gear wanted",
    "Skip if tunnel or unwanted",
    "Always kill"
  ], []);

  const dropdownsRef = useRef(null);
  const gridRef = useRef(null);
  const outputRef = useRef(null);
  const summaryRef = useRef(null);
  const optimalRef = useRef(null);

  const [wantedWeight, setWantedWeight] = useState(0.5);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const dropdownsEl = dropdownsRef.current;
    const gridEl = gridRef.current;
    const outputEl = outputRef.current;
    const summaryEl = summaryRef.current;
    const optimalEl = optimalRef.current;
    if (!dropdownsEl || !gridEl || !summaryEl || !optimalEl) return;

    const dropdownState = {};
    const gearState = {};

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
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + '; path=/; max-age=' + maxAge;
    }
    const savedState = readCookie(COOKIE_NAME) || null;
    function saveState() {
      writeCookie(COOKIE_NAME, { choices: dropdownState, gear: gearState });
    }

    // Build top rule dropdowns
    dropdownsEl.innerHTML = '';
    brothers.forEach((name) => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      const label = document.createElement('label');
      label.textContent = name;
      const sel = document.createElement('select');
      sel.setAttribute('data-brother', name);
      skipOptions.forEach((opt) => {
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

    // Build gear desirability grid
    gridEl.innerHTML = '';
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

    function hasNeeded(prefs) { for (const k in prefs) { if (prefs[k] === 'needed') return true; } return false; }
    function hasWanted(prefs) { if (hasNeeded(prefs)) return true; for (const k in prefs) { if (prefs[k] === 'wanted') return true; } return false; }
    function shouldKill(rule, isTunnel, prefs) {
      switch (rule) {
        case 'Always skip (default)': return false;
        case 'Skip if tunnel boss': return !isTunnel;
        case 'Skip if no gear needed': return hasNeeded(prefs);
        case 'Skip if tunnel or unneeded': return !isTunnel && hasNeeded(prefs);
        case 'Skip if tunnel or unwanted': return !isTunnel && hasWanted(prefs);
        case 'Always kill': return true;
        default: return false;
      }
    }

    function fmtPctValue(num) { return Number(num.toFixed(2)).toString() + '%'; }

    function computeGroups() {
      const isSix = window.matchMedia('(min-width: 1920px)').matches;
      const isOne = window.matchMedia('(max-width: 620px)').matches;
      const isTwo = !isOne && window.matchMedia('(max-width: 900px)').matches;
      if (isSix) return [[0,1,2,3,4,5]]; // 6-wide: one array of 6
      if (isTwo) return [[0,1],[2,3],[4,5]]; // 2-wide: three arrays of 2
      if (isOne) return [[0],[1],[2],[3],[4],[5]]; // 1-wide: six arrays of 1
      return [[0,1,2],[3,4,5]]; // 3-wide: two arrays of 3
    }

    function getCurrentCols() {
      const isSix = window.matchMedia('(min-width: 1920px)').matches;
      const isOne = window.matchMedia('(max-width: 620px)').matches;
      const isTwo = !isOne && window.matchMedia('(max-width: 900px)').matches;
      if (isSix) return 6;
      if (isTwo) return 2;
      if (isOne) return 1;
      return 3;
    }

    function headerTemplateFor(cols) {
      const isSix = window.matchMedia('(min-width: 1920px)').matches;
      const isOne = window.matchMedia('(max-width: 620px)').matches;
      const isTwo = !isOne && window.matchMedia('(max-width: 900px)').matches;
      if (isSix) return 'repeat(' + cols + ', 244px)';
      if (isTwo) return 'repeat(' + cols + ', minmax(260px, 1fr))';
      if (isOne) return 'repeat(' + cols + ', 1fr)';
      return 'repeat(' + cols + ', minmax(280px, 1fr))';
    }

    function isSixWide() { return window.matchMedia('(min-width: 1920px)').matches; }

    function reflowGroupHeaders(container) {
      if (!container) return;
      const resCols = Array.from(container.querySelectorAll('.res-col'));
      if (!resCols.length) return;
      // Capture footers (lines that span full width)
      const footerLines = Array.from(container.querySelectorAll('.res-line')).filter(n => (n.style && n.style.gridColumn === '1 / -1'));
      // Remove all children to rebuild
      const groups = computeGroups();
      const fragment = document.createDocumentFragment();
      const byIdx = {};
      resCols.forEach(n => { const i = parseInt(n.dataset.idx || '-1', 10); byIdx[i] = n; });
      groups.forEach((idxs, gi) => {
        const header = document.createElement('div');
        header.className = 'title-bar';
        header.style.display = 'grid';
        header.style.gridTemplateColumns = (isSixWide() ? '12px 28px ' : '28px ') + headerTemplateFor(idxs.length);
        const btn = document.createElement('button');
        btn.className = 'collapse-btn';
        btn.setAttribute('aria-label', 'Toggle group ' + (gi + 1));
        // Text/expanded set after we determine current visibility
        if (isSixWide && typeof isSixWide === 'function' && isSixWide()) {
          btn.style.gridColumn = '2';
          btn.style.marginLeft = '22px';
        }
        header.appendChild(btn);
        idxs.forEach(idx => {
          const t = document.createElement('div');
          t.className = 'title-cell header-title';
          t.textContent = 'Tunnel ' + brothers[idx];
          header.appendChild(t);
        });
        fragment.appendChild(header);
        const groupCols = [];
        idxs.forEach(idx => { const node = byIdx[idx]; if (node) { fragment.appendChild(node); groupCols.push(node); } });
        // Majority rule: if half or more are visible, expand all; else collapse all
        const visibleCount = groupCols.reduce((n, c) => n + (c.style.display !== 'none' ? 1 : 0), 0);
        const shouldExpandAll = (visibleCount * 2) >= groupCols.length;
        groupCols.forEach(c => { c.style.display = shouldExpandAll ? '' : 'none'; });
        btn.dataset.expanded = shouldExpandAll ? 'true' : 'false';
        btn.textContent = shouldExpandAll ? '▾' : '▸';
        btn.addEventListener('click', () => {
          const expanded = btn.dataset.expanded !== 'false';
          const next = !expanded;
          btn.dataset.expanded = next ? 'true' : 'false';
          btn.textContent = next ? '▾' : '▸';
          groupCols.forEach(c => { c.style.display = next ? '' : 'none'; });
        });
      });
      footerLines.forEach(n => fragment.appendChild(n));
      container.innerHTML = '';
      container.appendChild(fragment);
    }

    function runSimulate() {
      const outEl = outputEl;
      const summary = summaryEl;
      if (!outEl || !summary) return;
      const wantedWeightLocal = Math.min(0.9, Math.max(0.1, Number(wantedWeight) || 0.5));
      const payload = { choices: dropdownState, gear: gearState };
      outEl.textContent = JSON.stringify(payload, null, 2);

      summary.innerHTML = '';
      const groups = computeGroups();

      let sumUseful = 0;
      let sumTotalDrops = 0;
      let sumPct = 0;
      let sumExpUniques = 0;

      groups.forEach((idxs, gi) => {
        const header = document.createElement('div');
        header.className = 'title-bar';
        // Header row contains [button] + [names...] inside same bar
        header.style.gridTemplateColumns = (isSixWide() ? '12px 28px ' : '28px ') + headerTemplateFor(idxs.length);
        summary.appendChild(header);
        const btn = document.createElement('button');
        btn.className = 'collapse-btn';
        btn.setAttribute('aria-label', 'Toggle group ' + (gi + 1));
        if (isSixWide && typeof isSixWide === 'function' && isSixWide()) {
          btn.style.gridColumn = '2';
          btn.style.marginLeft = '22px';
        }
        header.appendChild(btn);
        idxs.forEach(idx => {
          const t = document.createElement('div');
          t.className = 'title-cell header-title';
          t.textContent = 'Tunnel ' + brothers[idx];
          header.appendChild(t);
        });

        const groupCols = [];
        idxs.forEach(idx => {
          const name = brothers[idx];
        const ruleTextMap = {
          'Always skip (default)': 'Skip',
          'Skip if tunnel boss': 'Skip in Tunnel',
          'Skip if no gear needed': 'skip if unneeded',
          'Skip if tunnel or unneeded': 'skip if tunnel/unneeded',
          'Skip if tunnel or unwanted': 'skip if tunnel/unwanted',
          'Always kill': 'Kill'
        };
        const ruleText = ruleTextMap[dropdownState[name]] || dropdownState[name];

        const col = document.createElement('div');
        col.className = 'res-col';
        col.dataset.idx = String(idx);
        // Inline title for narrow layouts (3-wide)
        const inlineTitle = document.createElement('div');
        inlineTitle.className = 'title-cell inline-title';
        inlineTitle.textContent = 'Tunnel ' + name;
        const rule = document.createElement('div');
        rule.className = 'res-line';
        rule.textContent = ruleText;

        const killed = [];
        for (let bi = 0; bi < brothers.length; bi++) {
          const nm = brothers[bi];
          const kill = shouldKill(dropdownState[nm], nm === name, gearState[nm]);
          if (kill) killed.push(nm);
        }
        const result = document.createElement('div');
        result.className = 'res-line kill-line';
        result.textContent = 'kills: ' + killed.length + (killed.length ? ' — ' + killed.join(', ') : '');

        const rolls = killed.length + 1;
        const denom = killed.length > 0 ? (450 - 58 * killed.length) : null;
        const unique = document.createElement('div');
        unique.className = 'res-line';
        unique.textContent = denom
          ? ('unique: ' + rolls + ' rolls, 1/' + denom + ' (' + fmtPctValue(100/denom) + ')')
          : ('unique: ' + rolls + ' rolls, n/a');
        const expected = document.createElement('div');
        expected.className = 'res-line';
        const perRollDenomExp = 102;
        const expItems = rolls / perRollDenomExp;
        const expInv = (expItems > 0) ? (perRollDenomExp / rolls) : Infinity;
        expected.textContent = 'expected uniques: ' + expItems.toFixed(4) + ' per chest (≈ 1 per ' + expInv.toFixed(2) + ' chests)';
        sumExpUniques += expItems;

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
        const weightedWanted = Math.round(wantedCount * wantedWeightLocal * 100) / 100;
        const usefulCount = neededCount + weightedWanted;
        const totalDrops = 4 * killed.length;
        const unwantedCount = totalDrops - usefulCount;
        function pct(n) {
          if (totalDrops <= 0) return '0%';
          const p = (n * 100) / totalDrops; return Number(p.toFixed(2)).toString() + '%';
        }
        const dropsNeeded = document.createElement('div'); dropsNeeded.className = 'res-line'; dropsNeeded.textContent = 'needed drops: ' + neededCount + ' (' + pct(neededCount) + ')';
        const dropsWanted = document.createElement('div'); dropsWanted.className = 'res-line'; dropsWanted.textContent = 'wanted drops: ' + wantedCount + ' (' + pct(wantedCount) + ')';
        const dropsUseful = document.createElement('div'); dropsUseful.className = 'res-line'; dropsUseful.textContent = 'useful drops: ' + usefulCount + ' (' + pct(usefulCount) + ')';
        const dropsUnwanted = document.createElement('div'); dropsUnwanted.className = 'res-line'; dropsUnwanted.textContent = 'unwanted drops: ' + unwantedCount + ' (' + pct(unwantedCount) + ')';

        col.appendChild(inlineTitle);
        col.appendChild(rule);
        col.appendChild(result);
        col.appendChild(unique);
        col.appendChild(expected);
        col.appendChild(dropsNeeded);
        col.appendChild(dropsWanted);
        col.appendChild(dropsUseful);
        col.appendChild(dropsUnwanted);
        summary.appendChild(col);
        groupCols.push(col);

        sumUseful += usefulCount;
        sumTotalDrops += totalDrops;
        sumPct += totalDrops > 0 ? (usefulCount / totalDrops) : 0;
        });

        // Majority rule on initial render
        const visCount = groupCols.reduce((n,c)=> n + (c.style.display !== 'none' ? 1 : 0), 0);
        const expandAll = (visCount * 2) >= groupCols.length;
        groupCols.forEach(c => { c.style.display = expandAll ? '' : 'none'; });
        btn.dataset.expanded = expandAll ? 'true' : 'false';
        btn.textContent = expandAll ? '▾' : '▸';
        btn.addEventListener('click', () => {
          const expanded = btn.dataset.expanded !== 'false';
          const next = !expanded;
          btn.dataset.expanded = next ? 'true' : 'false';
          btn.textContent = next ? '▾' : '▸';
          groupCols.forEach(c => { c.style.display = next ? '' : 'none'; });
        });
      });

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
      summary.appendChild(weightedLine);

      const avgExpUniques = scenarios ? (sumExpUniques / scenarios) : 0;
      const expectedUsefulItems = avgExpUniques * (avgPct / 100);
      const expectedChestsPerUseful = expectedUsefulItems > 0 ? (1 / expectedUsefulItems) : Infinity;
      const expectedUsefulLine = document.createElement('div');
      expectedUsefulLine.className = 'res-line';
      expectedUsefulLine.style.gridColumn = '1 / -1';
      expectedUsefulLine.textContent = 'expected useful: ' + Number(expectedUsefulItems.toFixed(4)).toString() + ' per chest (≈ 1 per ' + Number(expectedChestsPerUseful.toFixed(2)).toString() + ' chests)';
      summary.appendChild(expectedUsefulLine);

      (function normalizeKillHeights() {
        const nodes = Array.from(summary.querySelectorAll('.kill-line'));
        if (!nodes.length) return;
        nodes.forEach(n => { n.style.height = ''; });
        const maxH = nodes.reduce((m, n) => Math.max(m, n.offsetHeight), 0);
        nodes.forEach(n => { n.style.height = maxH + 'px'; });
      })();
    }

    function generateSeeds(digits, length) {
      const out = [];
      function rec(pos, prefix) {
        if (pos === length) { out.push(prefix); return; }
        for (let i = 0; i < digits.length; i++) rec(pos + 1, prefix + digits[i]);
      }
      rec(0, '');
      return out;
    }

    function runOptimize() {
      const container = optimalEl;
      if (!container) return;
      container.innerHTML = '';

      const wrapper = document.createElement('div');
      wrapper.className = 'opt-table';
      const hdrLine = document.createElement('div');
      hdrLine.className = 'res-line';
      hdrLine.style.gridColumn = '1 / -1';
      hdrLine.textContent = '…';
      wrapper.appendChild(hdrLine);

      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const hdr = document.createElement('tr');
      const headerLabels = ['Ahrim','Dharok','Guthan','Karil','Torag','Verac','Expected useful drops per chest','Expected chests per useful drop','Tunnel Rate','Details'];
      headerLabels.forEach(h => {
        const th = document.createElement('th'); th.textContent = h; th.dataset.base = h;
        const keyMap = {
          'expected useful drops per chest': 'expUseful',
          'expected chests per useful drop': 'expChests',
          'tunnel rate': 'tunnelRate'
        };
        const k = keyMap[h.toLowerCase()];
        if (k) { th.dataset.sortKey = k; th.style.cursor = 'pointer'; }
        hdr.appendChild(th);
      });
      thead.appendChild(hdr);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      const rowsData = [];

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

      const wantedWeightLocal = Math.min(0.9, Math.max(0.1, Number(wantedWeight) || 0.5));
      const seeds = generateSeeds(['1','2','7'], brothers.length);
      const totalPerms = seeds.length;
      hdrLine.textContent = totalPerms + ' permutations';

      function evaluateSeed(code) {
        const rulesForSeed = {};
        for (let i = 0; i < brothers.length; i++) {
          const idx = Math.max(1, Math.min(7, parseInt(code[i], 10) || 1)) - 1;
          rulesForSeed[brothers[i]] = skipOptions[idx];
        }
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
          const weightedWanted = Math.round(wantedCount * wantedWeightLocal * 100) / 100;
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
        // Odds you have to do tunnel: count tunnels where the tunnel boss must be fought
        let tunnelFightCount = 0;
        for (let t = 0; t < brothers.length; t++) {
          const tunnelBoss = brothers[t];
          if (shouldKillLocal(rulesForSeed[tunnelBoss], true, gearState[tunnelBoss])) tunnelFightCount++;
        }
        const tunnelRate = (tunnelFightCount * 100) / brothers.length; // percent 0..100
        return {
          seed: code,
          byBoss: brothers.map(b => {
            const labelsShort = {
              'Always skip (default)': 'Skip',
              'Skip if tunnel boss': 'Skip in Tunnel',
              'Skip if no gear needed': 'skip if unneeded',
              'Skip if tunnel or unneeded': 'skip if tunnel/unneeded',
              'Skip if no gear wanted': 'skip if unwanted',
              'Skip if tunnel or unwanted': 'skip if tunnel/unwanted',
              'Always kill': 'Kill'
            };
            return labelsShort[rulesForSeed[b]] || rulesForSeed[b];
          }),
          useful: Number(avgUseful.toFixed(2)),
          drops: Number(avgTotal.toFixed(2)),
          pct: Number(avgPct.toFixed(2)),
          expUseful: Number(expUseful.toFixed(4)),
          expChests: Number.isFinite(expChests) ? Number(expChests.toFixed(2)) : Infinity,
          tunnelRate: Number(tunnelRate.toFixed(3))
        };
      }
      function showDetailsForCode(code) {
        const summary = summaryRef.current;
        if (!summary) return;
        // Ensure details are expanded
        summary.classList.remove('collapsed');
        // Build rules for this seed
        const rulesForSeed = {};
        for (let i = 0; i < brothers.length; i++) {
          const idx = Math.max(1, Math.min(7, parseInt(code[i], 10) || 1)) - 1;
          rulesForSeed[brothers[i]] = skipOptions[idx];
        }
        // Clear and build grouped headers (no global collapse)
        summary.innerHTML = '';
        const groups = computeGroups();

        let sumUseful = 0;
        let sumTotalDrops = 0;
        let sumPct = 0;
        let sumExpUniques = 0;

        const ruleTextMap = {
          'Always skip (default)': 'Skip',
          'Skip if tunnel boss': 'Skip in Tunnel',
          'Skip if no gear needed': 'skip if unneeded',
          'Skip if tunnel or unneeded': 'skip if tunnel/unneeded',
          'Skip if no gear wanted': 'skip if unwanted',
          'Skip if tunnel or unwanted': 'skip if tunnel/unwanted',
          'Always kill': 'Kill'
        };

        groups.forEach((idxs, gi) => {
          const header = document.createElement('div');
          header.className = 'title-bar';
          header.style.gridTemplateColumns = (typeof window !== 'undefined' && window.matchMedia('(min-width: 1920px)').matches
            ? '12px 28px '
            : '28px '
          ) + headerTemplateFor(idxs.length);
          summary.appendChild(header);
          const btn = document.createElement('button');
          btn.className = 'collapse-btn';
          btn.setAttribute('aria-label', 'Toggle group ' + (gi + 1));
          btn.textContent = '▾';
          btn.dataset.expanded = 'true';
          if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1920px)').matches) {
            btn.style.gridColumn = '2';
          }
          header.appendChild(btn);
          idxs.forEach(idx => {
            const t = document.createElement('div');
            t.className = 'title-cell header-title';
            t.textContent = 'Tunnel ' + brothers[idx];
            header.appendChild(t);
          });

          const groupCols = [];
          idxs.forEach(idx => {
            const name = brothers[idx];
            const ruleText = ruleTextMap[rulesForSeed[name]] || rulesForSeed[name];
            const col = document.createElement('div');
            col.className = 'res-col';
            col.dataset.idx = String(idx);
            const inlineTitle = document.createElement('div');
            inlineTitle.className = 'title-cell inline-title';
            inlineTitle.textContent = 'Tunnel ' + name;
            const rule = document.createElement('div');
            rule.className = 'res-line';
            rule.textContent = ruleText;

          const killed = [];
          for (let bi = 0; bi < brothers.length; bi++) {
            const nm = brothers[bi];
            const kill = shouldKillLocal(rulesForSeed[nm], nm === name, gearState[nm]);
            if (kill) killed.push(nm);
          }
          const result = document.createElement('div');
          result.className = 'res-line kill-line';
          result.textContent = 'kills: ' + killed.length + (killed.length ? ' — ' + killed.join(', ') : '');

          const rolls = killed.length + 1;
          const denom = killed.length > 0 ? (450 - 58 * killed.length) : null;
          const unique = document.createElement('div');
          unique.className = 'res-line';
          unique.textContent = denom
            ? ('unique: ' + rolls + ' rolls, 1/' + denom + ' (' + (Number((100/denom).toFixed(2)).toString()) + '%)')
            : ('unique: ' + rolls + ' rolls, n/a');
          const expected = document.createElement('div');
          expected.className = 'res-line';
          const perRollDenomExp = 102;
          const expItems = rolls / perRollDenomExp;
          const expInv = (expItems > 0) ? (perRollDenomExp / rolls) : Infinity;
          expected.textContent = 'expected uniques: ' + expItems.toFixed(4) + ' per chest (≈ 1 per ' + expInv.toFixed(2) + ' chests)';
          sumExpUniques += expItems;

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
          const wantedWeightLocal = Math.min(0.9, Math.max(0.1, Number(wantedWeight) || 0.5));
          const weightedWanted = Math.round(wantedCount * wantedWeightLocal * 100) / 100;
          const usefulCount = neededCount + weightedWanted;
          const totalDrops = 4 * killed.length;
          const unwantedCount = totalDrops - usefulCount;
          function pct(n) {
            if (totalDrops <= 0) return '0%';
            const p = (n * 100) / totalDrops; return Number(p.toFixed(2)).toString() + '%';
          }
          const dropsNeeded = document.createElement('div'); dropsNeeded.className = 'res-line'; dropsNeeded.textContent = 'needed drops: ' + neededCount + ' (' + pct(neededCount) + ')';
          const dropsWanted = document.createElement('div'); dropsWanted.className = 'res-line'; dropsWanted.textContent = 'wanted drops: ' + wantedCount + ' (' + pct(wantedCount) + ')';
          const dropsUseful = document.createElement('div'); dropsUseful.className = 'res-line'; dropsUseful.textContent = 'useful drops: ' + usefulCount + ' (' + pct(usefulCount) + ')';
          const dropsUnwanted = document.createElement('div'); dropsUnwanted.className = 'res-line'; dropsUnwanted.textContent = 'unwanted drops: ' + unwantedCount + ' (' + pct(unwantedCount) + ')';

          col.appendChild(inlineTitle);
            col.appendChild(inlineTitle);
            col.appendChild(rule);
            col.appendChild(result);
            col.appendChild(unique);
            col.appendChild(expected);
            col.appendChild(dropsNeeded);
            col.appendChild(dropsWanted);
            col.appendChild(dropsUseful);
            col.appendChild(dropsUnwanted);
            summary.appendChild(col);
            groupCols.push(col);

            sumUseful += usefulCount;
            sumTotalDrops += totalDrops;
            sumPct += totalDrops > 0 ? (usefulCount / totalDrops) : 0;
          });

          btn.addEventListener('click', () => {
            const expanded = btn.dataset.expanded !== 'false';
            const next = !expanded;
            btn.dataset.expanded = next ? 'true' : 'false';
            btn.textContent = next ? '▾' : '▸';
            groupCols.forEach(c => { c.style.display = next ? '' : 'none'; });
          });
          // Run reflow once to ensure header/columns are wired correctly
          reflowGroupHeaders(summary);
        });

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
        summary.appendChild(weightedLine);

        const avgExpUniques = scenarios ? (sumExpUniques / scenarios) : 0;
        const expectedUsefulItems = avgExpUniques * (avgPct / 100);
        const expectedChestsPerUseful = expectedUsefulItems > 0 ? (1 / expectedUsefulItems) : Infinity;
        const expectedUsefulLine = document.createElement('div');
        expectedUsefulLine.className = 'res-line';
        expectedUsefulLine.style.gridColumn = '1 / -1';
        expectedUsefulLine.textContent = 'expected useful: ' + Number(expectedUsefulItems.toFixed(4)).toString() + ' per chest (≈ 1 per ' + Number(expectedChestsPerUseful.toFixed(2)).toString() + ' chests)';
        summary.appendChild(expectedUsefulLine);

        (function normalizeKillHeights() {
          const nodes = Array.from(summary.querySelectorAll('.kill-line'));
          if (!nodes.length) return;
          nodes.forEach(n => { n.style.height = ''; });
          const maxH = nodes.reduce((m, n) => Math.max(m, n.offsetHeight), 0);
          nodes.forEach(n => { n.style.height = maxH + 'px'; });
        })();

        // Ensure header structure matches current breakpoint
        reflowGroupHeaders(summary);
      }

      function fmtPctFlexible(n) { return parseFloat(Number(n).toFixed(3)).toString() + '%'; }

      const bossHasNeeded = {};
      for (let i = 0; i < brothers.length; i++) {
        const name = brothers[i];
        let has = false;
        for (let s = 0; s < slots.length; s++) {
          if (gearState[name][slots[s]] === 'needed') { has = true; break; }
        }
        bossHasNeeded[name] = has;
      }

      const baseline = '7'.repeat(brothers.length);
      const baselineRow = evaluateSeed(baseline);
      const rowsDataKept = [baselineRow];
      // Discard rule: drop permutations with exactly 0 expected useful items per chest

      for (let r = 0; r < seeds.length; r++) {
        const code = seeds[r];
        if (code === baseline) continue;
        // Discard seeds with exactly five '1's and one '2' (no kills in one tunnel scenario)
        const c1 = (code.match(/1/g) || []).length;
        const c2 = (code.match(/2/g) || []).length;
        const c7 = (code.match(/7/g) || []).length;
        if (c1 === brothers.length - 1 && c2 === 1 && c7 === 0) continue;
        const row = evaluateSeed(code);
        if (row.expUseful !== 0) rowsDataKept.push(row);
      }

      const keptCount = rowsDataKept.length;
      hdrLine.textContent = keptCount + ' of ' + totalPerms + ' permutations kept';

      function renderRows(sorted) {
        tbody.innerHTML = '';
        sorted.forEach(row => {
          const tr = document.createElement('tr');
          // Boss columns with colored backgrounds
          for (let i = 0; i < brothers.length; i++) {
            const val = row.byBoss[i];
            const td = document.createElement('td');
            td.textContent = val;
            const norm = (val || '').toLowerCase();
            if (norm === 'kill') td.classList.add('cell-kill');
            else if (norm === 'skip') td.classList.add('cell-skip');
            else if (norm === 'skip in tunnel') td.classList.add('cell-skip-tunnel');
            tr.appendChild(td);
          }
          // Metrics columns
          const metrics = [
            row.expUseful.toString(),
            (Number.isFinite(row.expChests) ? row.expChests.toString() : '∞'),
            fmtPctFlexible(row.tunnelRate)
          ];
          metrics.forEach(val => { const td = document.createElement('td'); td.textContent = val; tr.appendChild(td); });
          // Details button
          const detailsTd = document.createElement('td');
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.textContent = 'See details';
          btn.addEventListener('click', () => showDetailsForCode(row.seed));
          detailsTd.appendChild(btn);
          tr.appendChild(detailsTd);
          tbody.appendChild(tr);
        });
      }

      function sortAndRenderByKey(key) {
        const eps = 1e-9;
        // Prefer skipping Verac > Guthan > Torag > Dharok when tunnel (only affects order)
        const skipWeights = { Verac: 3, Guthan: 2, Torag: 1, Dharok: 0 };
        const sorted = rowsData.slice().sort((a,b)=>{
          if (key === 'seed' || !key) return a.seed.localeCompare(b.seed);
          if (key === 'expChests') {
            const d = a.expChests - b.expChests; if (Math.abs(d) > eps) return d;
          } else {
            const d = b[key] - a[key]; if (Math.abs(d) > eps) return d;
          }
          const score = (row) => row.byBoss.reduce((acc,label,idx)=>{
            const name = brothers[idx];
            const isSkipTunnel = (label || '').toLowerCase() === 'skip in tunnel';
            return acc + (isSkipTunnel ? (skipWeights[name] || 0) : 0);
          },0);
          const ta = score(a), tb = score(b); if (ta !== tb) return tb - ta;
          return a.seed.localeCompare(b.seed);
        });
        const ths = Array.from(thead.querySelectorAll('th'));
        ths.forEach(th => { th.textContent = th.dataset.base || th.textContent; });
        const active = ths.find(th => th.dataset.sortKey === key);
        if (active) active.textContent = (active.dataset.base || active.textContent) + ' ▾';
        renderRows(sorted);
      }

      Array.from(thead.querySelectorAll('th')).forEach(th => {
        if (th.dataset.sortKey) {
          th.addEventListener('click', () => sortAndRenderByKey(th.dataset.sortKey));
        }
      });

      const rowsDataFinal = (typeof rowsDataKept !== 'undefined') ? rowsDataKept : rowsData;
      rowsData.length = 0; Array.prototype.push.apply(rowsData, rowsDataFinal);
      // Default sort by expected chests (ascending)
      sortAndRenderByKey('expChests');

      table.appendChild(tbody);
      wrapper.appendChild(table);
      container.appendChild(wrapper);
    }

    // Attach buttons via ids created in JSX
    const simulateBtn = document.getElementById('simulate');
    const optimizeBtn = document.getElementById('optimize');
    if (simulateBtn) simulateBtn.addEventListener('click', runSimulate);
    if (optimizeBtn) optimizeBtn.addEventListener('click', runOptimize);

    // Resize observer: reflow headers without recomputing any values
    let resizeRaf = null;
    const handleResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        reflowGroupHeaders(summaryEl);
        reflowGroupHeaders(optimalEl);
      });
    };
    if (typeof window !== 'undefined') window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      if (simulateBtn) simulateBtn.removeEventListener('click', runSimulate);
      if (optimizeBtn) optimizeBtn.removeEventListener('click', runOptimize);
      if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize);
    };
  }, [brothers, slots, skipOptions, wantedWeight]);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
        body { margin: 0; background: #ffffff; color: #111111; }
        .wrap { max-width: 1920px; margin: 24px auto; padding: 16px; }
        h1 { font-size: 18px; margin: 0 0 16px 0; }
        .row { display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 12px; padding: 12px; border: 1px solid #cccccc; border-radius: 8px; }
        .dropdown-item { display: flex; align-items: center; column-gap: 6px; }
        .dropdown-item label { width: 56px; flex: 0 0 56px; }
        .dropdown-item select { flex: 1 1 auto; min-width: 200px; width: 100%; }
        .grid { display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 12px; padding: 12px; border: 1px solid #cccccc; border-radius: 8px; margin-top: 16px; }
        .grid .col { display: grid; gap: 10px; min-width: 0; }
        .col-title { text-align: center; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .slot { display: flex; align-items: center; column-gap: 6px; min-width: 0; }
        .slot label { font-size: 12px; color: #444; width: 56px; flex: 0 0 56px; }
        .state-select { padding: 8px 10px; border-radius: 6px; border: 1px solid #cfcfcf; background: #f7f7f7; flex: 1; max-width: 100%; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .controls { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #cccccc; border-radius: 8px; margin-top: 16px; }
        .num { width: 120px; padding: 8px 10px; border-radius: 6px; border: 1px solid #cfcfcf; text-align: center; }
        .btn { padding: 8px 14px; border-radius: 6px; border: 1px solid #cfcfcf; background: #f7f7f7; cursor: pointer; }
        .out { display: none; margin-top: 12px; padding: 12px; border: 1px dashed #cccccc; border-radius: 8px; background: #fafafa; color: #111; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; min-height: 80px; }
        .summary { display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 12px; padding: 12px; border: 1px solid #cccccc; border-radius: 8px; margin-top: 12px; }
        .summary:empty { display: none; }
        .res-col { display: grid; gap: 8px; align-content: start; }
        .res-title { text-align: center; font-weight: 700; }
        .title-bar { grid-column: 1 / -1; display: grid; grid-template-columns: 28px repeat(3, minmax(280px, 1fr)); gap: 12px; padding: 6px 12px; border: 1px solid #cccccc; border-radius: 8px; background: #fafafa; margin-top: 12px; align-items: center; }
        .title-cell { text-align: center; font-weight: 700; font-size: 14px; padding: 3px 10px; }
        /* Show header titles in the bar at all widths; hide per-column titles */
        .header-title { display: block; }
        .inline-title { display: none; }
        .collapse-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1px solid #cfcfcf; background: #f7f7f7; border-radius: 4px; cursor: pointer; font-size: 22px; line-height: 1; }
        .summary.collapsed .res-col { display: none; }
        .res-line { padding: 8px 10px; border: 1px dashed #cccccc; border-radius: 6px; background: #fafafa; text-align: center; }
        .kill-line { min-height: 46px; display: flex; align-items: center; justify-content: center; }
        .opt-table { grid-column: 1 / -1; }
        .opt-table table { width: 100%; border-collapse: collapse; }
        .opt-table th, .opt-table td { border: 1px dashed #cccccc; padding: 8px 10px; text-align: center; background: #fafafa; }
        .opt-toolbar { grid-column: 1 / -1; display: flex; gap: 8px; justify-content: flex-end; margin: 8px 0; }
        /* Coloring for boss decision cells */
        .cell-kill { background: #ffe5e5 !important; }
        .cell-skip { background: #e8f6e8 !important; }
        .cell-skip-tunnel { background: #fff7d6 !important; }
        @media (min-width: 1920px) {
          .wrap { max-width: 1582px; }
          .row, .grid { grid-template-columns: repeat(6, 244px); justify-content: center; }
          .summary { grid-template-columns: repeat(6, 244px); justify-content: center; }
          .title-bar { grid-template-columns: repeat(6, 244px); justify-content: center; }
          /* 6-wide keeps same visibility settings */
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
      `}</style>

      <div className="wrap">
        <h1>Barrows – quick setup</h1>

        <div id="dropdowns" className="row" ref={dropdownsRef} />

        <div id="gearGrid" className="grid" ref={gridRef} />

        <div className="controls">
          <label htmlFor="wantedWeight">Wanted weight</label>
          <input
            id="wantedWeight"
            className="num"
            type="number"
            min="0.1"
            max="0.9"
            step="0.1"
            value={wantedWeight}
            onChange={(e) => setWantedWeight(Number(e.target.value))}
          />
          <button id="simulate" className="btn">Calculate</button>
          <button id="optimize" className="btn" style={{ marginLeft: 'auto' }}>Find optimal strategy</button>
        </div>

        <div id="output" className="out" ref={outputRef} />
        <div id="summary" className="summary" ref={summaryRef} />
        <div id="optimal" className="summary" ref={optimalRef} />
      </div>
    </>
  );
}


