/* Explainer video runtime.
   Every visual is a pure function of time t, so the renderer can seek to any frame
   and get the same picture every time. Timing comes from the content: each step is
   held long enough to read the words it adds. See the skill's references/runtime.md. */
(() => {
  const params = new URLSearchParams(location.search);
  const RENDER = params.has('render');
  const body = document.body;
  body.classList.add(RENDER ? 'render' : 'preview');
  if (RENDER) {
    const st = document.createElement('style');
    st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}';
    document.head.appendChild(st);
  }

  const PACE = parseFloat(body.dataset.pace || '1') || 1;
  // Playback speed: the whole timeline plays this many times faster, like a video player's speed setting.
  // Timing below is worked out at 1x; the public API (seek, duration, scenes, settled) and the player use output time.
  const SPEED = parseFloat(body.dataset.speed || '1.75') || 1.75;
  const T = {
    enter: 0.6,      // default entrance length
    wps: 3.2,        // reading speed, words per second (about 190 words a minute: slower than reading a page)
    base: 0.9,       // fixed time to notice something new
    minStep: 1.8,    // shortest hold for a step that changes anything
    firstBeat: 0.5,  // beat before step 1 when step 0 has no text
    sceneIn: 0.6, sceneOut: 0.45, tail: 0.7,
    mark: 0.45, dim: 0.45, exit: 0.4, cam: 1.1
  };
  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const easeInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const num = v => (v === undefined || v === null || v === '' ? null : Number(v));
  const warnings = [];

  const stage = document.querySelector('.stage');
  if (!stage) { console.error('No .stage element'); return; }

  /* ---------- One-time DOM setup ---------- */
  /* ---------- Date timelines: <div class="timeline" data-timeline='{…}'> becomes an SVG ---------- */
  function buildTimelines() {
    const DAY = 86400000;
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const d = v => Date.parse(v + 'T00:00:00Z');
    const attrs = o => ['step', 'exit', 'dim', 'undim', 'mark', 'unmark'].filter(k => o[k] !== undefined && o[k] !== null).map(k => ` data-${k}="${o[k]}"`).join('');
    document.querySelectorAll('[data-timeline]').forEach(host => {
      let spec;
      try { spec = JSON.parse(host.dataset.timeline); } catch (e) { warnings.push('data-timeline is not valid JSON'); return; }
      const W = 1620, pad = 24, rowH = 88, gap = 18;
      const t0 = d(spec.from), t1 = d(spec.to) + DAY;
      if (!(t1 > t0)) { warnings.push('data-timeline needs "from" before "to"'); return; }
      const x = v => pad + (v - t0) / (t1 - t0) * (W - 2 * pad);
      const bars = spec.bars || [], marks = spec.markers || [];
      const rows = Math.max(1, ...bars.map((b, i) => (b.row ?? i) + 1));
      const top = marks.length ? 70 : 10;
      const axisY = top + rows * rowH + (rows - 1) * gap + 22;
      const H = axisY + 60;
      let out = '';
      // Axis and ticks (ticks stay under the bars so lines never cross text)
      out += `<path d="M${pad} ${axisY} H ${W - pad}" stroke="var(--border-strong)" stroke-width="2"/>`;
      const ticks = [];
      const unit = spec.ticks || ((t1 - t0) / DAY > 120 ? 'month' : (t1 - t0) / DAY > 35 ? 'week' : 'day');
      const c = new Date(t0);
      if (unit === 'month') { c.setUTCDate(1); if (+c < t0) c.setUTCMonth(c.getUTCMonth() + 1); }
      if (unit === 'week') while (c.getUTCDay() !== 1) c.setUTCDate(c.getUTCDate() + 1);
      for (; +c < t1;) {
        const first = !ticks.length;
        const lbl = unit === 'month' ? MONTHS[c.getUTCMonth()] + (first || c.getUTCMonth() === 0 ? ' ' + c.getUTCFullYear() : '')
          : c.getUTCDate() + ' ' + MONTHS[c.getUTCMonth()];
        ticks.push({ x: x(+c), lbl });
        if (unit === 'month') c.setUTCMonth(c.getUTCMonth() + 1); else c.setUTCDate(c.getUTCDate() + (unit === 'week' ? 7 : 1));
      }
      const minGap = unit === 'day' ? 90 : 110;
      let lastX = -1e9;
      ticks.forEach(tk => {
        out += `<path d="M${tk.x.toFixed(1)} ${axisY - 8} V ${axisY + 8}" stroke="var(--border-strong)" stroke-width="2"/>`;
        if (tk.x - lastX >= minGap && tk.x < W - 60) { out += `<text x="${(tk.x + 6).toFixed(1)}" y="${axisY + 44}" style="font: 500 22px var(--sans); fill: var(--text-tertiary)">${esc(tk.lbl)}</text>`; lastX = tk.x; }
      });
      // Bars
      bars.forEach((b, i) => {
        const row = b.row ?? i, y = top + row * (rowH + gap);
        const x1 = x(d(b.from)), x2 = x(d(b.to) + DAY), w = Math.max(6, x2 - x1);
        const inside = w > Math.max(String(b.label || '').length, String(b.sub || '').length * 0.75) * 17 + 40;
        const tx = inside ? x1 + 20 : x2 + 16;
        const step = b.step !== undefined ? ` data-step="${b.step}"` : '';
        out += `<g class="tone-${esc(b.tone || 'indigo')}"${attrs({ exit: b.exit, dim: b.dim, undim: b.undim, mark: b.mark, unmark: b.unmark })}>`;
        out += `<rect x="${x1.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${rowH}" rx="12" fill="var(--soft)" stroke="var(--hue)" stroke-width="2"${step} data-anim="grow-x"/>`;
        out += `<rect class="tl-ring" x="${(x1 - 7).toFixed(1)}" y="${y - 7}" width="${(w + 14).toFixed(1)}" height="${rowH + 14}" rx="17"/>`;
        out += `<g${step} data-anim="fade" data-delay="0.35"><text x="${tx.toFixed(1)}" y="${y + (b.sub ? 38 : 55)}" style="font: 550 30px var(--sans); fill: var(--text-primary)">${esc(b.label || '')}</text>`;
        if (b.sub) out += `<text x="${tx.toFixed(1)}" y="${y + 70}" style="font: 400 23px var(--sans); fill: var(--text-secondary)">${esc(b.sub)}</text>`;
        out += `</g></g>`;
      });
      // Markers: a labelled pin from the top to the axis
      marks.forEach(m => {
        const mx = x(d(m.date) + DAY / 2);
        const label = String(m.label || '');
        const lw = label.length * 14 + 36;
        const lx = Math.min(W - lw - 2, Math.max(2, mx - lw / 2));
        out += `<g class="tone-${esc(m.tone || 'grey')}"${attrs({ step: m.step, exit: m.exit, dim: m.dim, undim: m.undim, mark: m.mark, unmark: m.unmark })} data-anim="down">`;
        out += `<path d="M${mx.toFixed(1)} 50 V ${axisY}" stroke="var(--text-primary)" stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round"/>`;
        out += `<circle cx="${mx.toFixed(1)}" cy="${axisY}" r="7" fill="var(--text-primary)"/>`;
        out += `<rect x="${lx.toFixed(1)}" y="4" width="${lw}" height="44" rx="22" fill="var(--bg-elevated)" stroke="var(--border-strong)" stroke-width="1.5"/>`;
        out += `<text x="${(lx + lw / 2).toFixed(1)}" y="34" text-anchor="middle" style="font: 500 23px var(--sans); fill: var(--text-primary)">${esc(label)}</text></g>`;
      });
      host.innerHTML = `<svg class="diagram" viewBox="0 0 ${W} ${H}">${out}</svg>`;
    });
  }

  function setupDom() {
    buildTimelines();
    // Icons
    document.querySelectorAll('.ic[data-icon]').forEach(el => {
      const svg = window.VX_ICON && window.VX_ICON(el.dataset.icon);
      if (svg) el.innerHTML = svg; else warnings.push(`Unknown icon "${el.dataset.icon}"`);
      if (el.dataset.hue) el.classList.add('tone-' + el.dataset.hue);
    });
    // Shared SVG defs: gradient strokes and arrowheads for diagrams
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    defs.setAttribute('width', '0'); defs.setAttribute('height', '0');
    defs.setAttribute('style', 'position:absolute'); defs.setAttribute('aria-hidden', 'true');
    defs.innerHTML = `<defs>
      <linearGradient id="vx-edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,0.26)"/><stop offset="0.4" stop-color="rgba(255,255,255,0.14)"/><stop offset="1" stop-color="rgba(255,255,255,0.07)"/></linearGradient>
      <linearGradient id="vx-accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgba(94,106,210,0.85)"/><stop offset="0.5" stop-color="rgba(255,255,255,0.16)"/><stop offset="1" stop-color="rgba(217,106,26,0.6)"/></linearGradient>
      <marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 9 5 1 9z" fill="rgba(255,255,255,0.45)"/></marker>
      <marker id="arrow-hot" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 9 5 1 9z" fill="#8a94f0"/></marker>
    </defs>`;
    stage.prepend(defs);
    // Chapter tags
    // Chapters are numbered in order of first use; the title scene doesn't count.
    const chapters = [];
    const allScenes = [...stage.querySelectorAll(':scope > .scene')];
    allScenes.forEach(sc => { const ch = sc.dataset.chapter; if (ch && !sc.classList.contains('scene--title') && !chapters.includes(ch)) chapters.push(ch); });
    const chNum = ch => String(chapters.indexOf(ch) + 1).padStart(2, '0');
    document.querySelectorAll('[data-chapter-ref]').forEach(n => {
      const ch = n.dataset.chapterRef;
      if (chapters.includes(ch)) n.textContent = chNum(ch); else warnings.push(`data-chapter-ref names an unknown chapter: "${ch}"`);
    });
    allScenes.forEach(sc => {
      const ch = sc.dataset.chapter;
      if (!ch || sc.classList.contains('scene--title')) return;
      sc.querySelectorAll('[data-chapter-num]').forEach(n => { n.textContent = chNum(ch); });
      if (sc.classList.contains('scene--chapter') || sc.dataset.tag === 'off') return;
      const tag = document.createElement('div');
      tag.className = 'chapter-tag'; tag.dataset.noread = '';
      tag.innerHTML = `<b>${String(chapters.indexOf(ch) + 1).padStart(2, '0')}</b><i></i><span></span>`;
      tag.querySelector('span').textContent = ch;
      sc.prepend(tag);
    });
    // Progress line
    const prog = document.createElement('div');
    prog.className = 'progress'; prog.innerHTML = '<span></span>';
    stage.appendChild(prog);
    return prog.firstElementChild;
  }

  /* ---------- Reading load ---------- */
  function readUnits(text, isCode) {
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t) return 0;
    const words = t.split(' ').length;
    return isCode ? Math.max(words, t.length / 6) * 1.25 : words;
  }
  function stepOf(node, scene) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    const host = el.closest('[data-step]');
    return host && scene.contains(host) ? Number(host.dataset.step) || 0 : 0;
  }

  /* ---------- Build the timeline ---------- */
  function buildScene(el, index) {
    const items = new Map();
    const item = node => {
      if (!items.has(node)) items.set(node, { el: node, isSvg: node instanceof SVGElement && node.tagName.toLowerCase() !== 'svg' });
      return items.get(node);
    };
    let maxStep = 0;
    const bump = v => { if (v !== null && v > maxStep) maxStep = v; };

    el.querySelectorAll('[data-step],[data-exit],[data-dim],[data-undim],[data-mark],[data-unmark]').forEach(node => {
      const d = node.dataset;
      const step = num(d.step);
      ['exit', 'dim', 'undim', 'mark', 'unmark'].forEach(k => { if (d[k] !== undefined) { const it = item(node); it[k] = num(d[k]); bump(it[k]); } });
      if (step === null) return;
      bump(step);
      const anim = d.anim || 'rise';
      const dur = num(d.dur);
      if (d.stagger !== undefined) {
        const gap = num(d.stagger) || 0.09;
        [...node.children].forEach((child, i) => {
          if (child.dataset.step !== undefined) return;
          const it = item(child);
          Object.assign(it, { step, anim: child.dataset.anim || anim, delay: i * gap, dur: num(child.dataset.dur) || dur });
        });
      } else {
        Object.assign(item(node), { step, anim, delay: num(d.delay) || 0, dur });
      }
    });

    const cams = [...el.querySelectorAll('[data-cam]')].map(node => {
      let keys = {};
      try { keys = JSON.parse(node.dataset.cam); } catch (e) { warnings.push(`Scene ${index + 1}: data-cam is not valid JSON`); }
      const frames = Object.entries(keys).map(([k, v]) => ({ step: Number(k), s: v[0], fx: v[1], fy: v[2] })).sort((a, b) => a.step - b.step);
      if (!frames.length || frames[0].step !== 0) frames.unshift({ step: 0, s: 1, fx: 0.5, fy: 0.5 });
      frames.forEach(f => bump(f.step));
      return { el: node, frames };
    });

    // Words added at each step
    const words = new Array(maxStep + 1).fill(0);
    const texts = Array.from({ length: maxStep + 1 }, () => []);
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      const p = n.parentElement;
      if (!p || p.closest('[data-noread],style,script,[aria-hidden="true"]')) continue;
      const s = Math.min(stepOf(n, el), maxStep);
      const isCode = !!p.closest('pre,code,.code,.mono,.path');
      const u = readUnits(n.textContent, isCode);
      if (!u) continue;
      words[s] += u;
      texts[s].push(n.textContent.replace(/\s+/g, ' ').trim());
    }
    // Extra hold requested per step, and animation lengths per step
    const extra = new Array(maxStep + 1).fill(0);
    const animLen = new Array(maxStep + 1).fill(0);
    el.querySelectorAll('[data-hold]').forEach(node => {
      const s = Math.min(stepOf(node, el), maxStep); // its own step, its nearest stepped ancestor's, or 0
      extra[s] = Math.max(extra[s], num(node.dataset.hold) || 0);
    });
    items.forEach(it => {
      if (it.step === undefined || it.step === null) return;
      if (!it.dur) {
        if (it.anim === 'type') it.dur = Math.max(0.6, (it.el.textContent || '').length / 40);
        else if (it.anim === 'count') it.dur = 1.3;
        else if (it.anim === 'draw') it.dur = 0.9;
        else it.dur = T.enter;
      }
      animLen[it.step] = Math.max(animLen[it.step], (it.delay || 0) + it.dur);
    });
    const camSteps = new Set(cams.flatMap(c => c.frames.map(f => f.step)).filter(s => s > 0));

    const holds = words.map((w, s) => {
      let h;
      if (s === 0 && w === 0) h = T.firstBeat;
      else h = Math.max(T.minStep * PACE, T.enter + (T.base + w / T.wps) * PACE);
      h = Math.max(h, animLen[s] + 0.8 * PACE);
      if (camSteps.has(s)) h = Math.max(h, T.cam + 1.0 * PACE);
      return h + extra[s];
    });
    const sceneHold = num(el.dataset.hold) || 0;
    const heading = el.querySelector('.display,.h1,.h2,.h3');
    return {
      el, index, items: [...items.values()], cams, holds, words, texts, sceneHold,
      chapter: el.dataset.chapter || '', id: el.id || '',
      title: heading ? heading.textContent.replace(/\s+/g, ' ').trim() : ''
    };
  }

  function layoutTimeline(scenes) {
    let t = 0;
    scenes.forEach(sc => {
      sc.start = t;
      sc.stepStart = [];
      let s = t;
      sc.holds.forEach((h, k) => { sc.stepStart[k] = s; s += h; });
      sc.end = s + T.tail + sc.sceneHold;
      t = sc.end + T.sceneOut;
      sc.items.forEach(it => {
        if (it.step !== undefined && it.step !== null) it.t0 = sc.stepStart[it.step] + (it.step === 0 ? 0.12 : 0) + (it.delay || 0);
        ['exit', 'dim', 'undim', 'mark', 'unmark'].forEach(k => { if (it[k] !== undefined && it[k] !== null) it['t_' + k] = sc.stepStart[it[k]]; });
        prepItem(it);
      });
      sc.cams.forEach(c => c.frames.forEach(f => { f.t = sc.stepStart[f.step]; }));
    });
    return t + 0.25;
  }

  function prepItem(it) {
    const el = it.el;
    if (it.isSvg) {
      el.style.transformBox = 'fill-box';
      el.style.transformOrigin = it.anim === 'grow-y' ? 'center bottom' : it.anim === 'grow-x' ? 'left center' : 'center';
      it.noTransform = el.hasAttribute('transform');
    } else if (it.anim === 'grow-x') el.style.transformOrigin = 'left center';
    else if (it.anim === 'grow-y') el.style.transformOrigin = 'center bottom';
    if (it.anim === 'draw') {
      const geo = el instanceof SVGGeometryElement ? [el] : [...el.querySelectorAll('path,line,polyline,polygon,circle,rect,ellipse')];
      it.parts = geo.map(g => {
        const dashed = getComputedStyle(g).strokeDasharray;
        let len = 0; try { len = g.getTotalLength(); } catch (e) { /* ignore */ }
        return { g, len, dashed: dashed && dashed !== 'none', marker: g.getAttribute('marker-end'), markerStart: g.getAttribute('marker-start') };
      });
      it.labels = [...el.querySelectorAll('text')];
      if (!it.parts.length && !it.isSvg) it.anim = 'grow-x';
    }
    if (it.anim === 'type') it.full = el.textContent;
    if (it.anim === 'count') {
      const m = el.textContent.match(/^(\D*?)(-?[\d,]*\.?\d+)(.*)$/s);
      if (m) { it.pre = m[1]; it.post = m[3]; it.target = parseFloat(m[2].replace(/,/g, '')); it.decimals = (m[2].split('.')[1] || '').length; it.commas = m[2].includes(','); }
      else it.anim = 'fade';
    }
  }

  /* ---------- Apply state for time t ---------- */
  function applyItem(it, t) {
    const el = it.el;
    let op = 1, tf = '';
    if (it.t0 !== undefined) {
      const p = (t - it.t0) / it.dur;
      const e = easeOut(clamp01(p));
      switch (it.anim) {
        case 'fade': op = e; break;
        case 'pop': op = e; tf = `scale(${(0.93 + 0.07 * e).toFixed(4)})`; break;
        case 'left': op = e; tf = `translateX(${((1 - e) * -32).toFixed(2)}px)`; break;
        case 'right': op = e; tf = `translateX(${((1 - e) * 32).toFixed(2)}px)`; break;
        case 'down': op = e; tf = `translateY(${((1 - e) * -20).toFixed(2)}px)`; break;
        case 'grow-x': op = clamp01(e * 4); tf = `scaleX(${e.toFixed(4)})`; break;
        case 'grow-y': op = clamp01(e * 4); tf = `scaleY(${e.toFixed(4)})`; break;
        case 'none': op = p >= 0 ? 1 : 0; break;
        case 'type': {
          op = p >= 0 ? 1 : 0;
          const n = Math.round(it.full.length * clamp01(p));
          if (it.shown !== n) { el.textContent = it.full.slice(0, n); it.shown = n; }
          break;
        }
        case 'count': {
          op = clamp01(p * 5);
          const v = it.target * e;
          let s = v.toFixed(it.decimals);
          if (it.commas) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: it.decimals, maximumFractionDigits: it.decimals });
          const txt = it.pre + s + it.post;
          if (it.shown !== txt) { el.textContent = txt; it.shown = txt; }
          break;
        }
        case 'draw': {
          op = p >= 0 ? 1 : 0;
          it.parts.forEach(pt => {
            if (pt.dashed || !pt.len) pt.g.style.opacity = e.toFixed(4);
            else { pt.g.style.strokeDasharray = `${pt.len} ${pt.len}`; pt.g.style.strokeDashoffset = (pt.len * (1 - e)).toFixed(2); }
            if (pt.marker) { if (e > 0.97) pt.g.setAttribute('marker-end', pt.marker); else pt.g.removeAttribute('marker-end'); }
            if (pt.markerStart) { if (e > 0.05) pt.g.setAttribute('marker-start', pt.markerStart); else pt.g.removeAttribute('marker-start'); }
          });
          it.labels.forEach(l => { l.style.opacity = clamp01((p - 0.55) / 0.45).toFixed(4); });
          break;
        }
        default: op = e; tf = `translateY(${((1 - e) * 20).toFixed(2)}px)`; // rise
      }
    }
    if (it.t_exit !== undefined) op *= 1 - easeOut(clamp01((t - it.t_exit) / T.exit));
    if (it.t_dim !== undefined) {
      let d = easeInOut(clamp01((t - it.t_dim) / T.dim));
      if (it.t_undim !== undefined) d -= easeInOut(clamp01((t - it.t_undim) / T.dim));
      op *= 1 - 0.74 * Math.max(0, d);
    }
    if (it.t_mark !== undefined) {
      let m = easeInOut(clamp01((t - it.t_mark) / T.mark));
      if (it.t_unmark !== undefined) m -= easeInOut(clamp01((t - it.t_unmark) / T.mark));
      el.style.setProperty('--m', Math.max(0, m).toFixed(4));
    }
    el.style.opacity = op >= 0.9999 ? '' : op.toFixed(4);
    if (!(it.isSvg && it.noTransform)) el.style.transform = tf;
  }

  function applyCam(c, t) {
    const f = c.frames;
    let a = f[0], b = f[0], k = 0;
    for (let i = 0; i < f.length; i++) if (t >= f[i].t) { b = f[i]; a = f[i - 1] || f[i]; k = i; }
    const e = k === 0 ? 1 : easeInOut(clamp01((t - b.t) / T.cam));
    const s = a.s + (b.s - a.s) * e, fx = a.fx + (b.fx - a.fx) * e, fy = a.fy + (b.fy - a.fy) * e;
    const W = c.el.offsetWidth, H = c.el.offsetHeight;
    c.el.style.transform = `translate(${(W / 2 - fx * W * s).toFixed(2)}px, ${(H / 2 - fy * H * s).toFixed(2)}px) scale(${s.toFixed(4)})`;
  }

  let scenes = [], duration = 0, current = 0, progressEl = null;
  function seek(t) {
    t = Math.max(0, Math.min(duration, t));
    current = t;
    for (const sc of scenes) {
      const on = t >= sc.start && t < sc.end + T.sceneOut;
      sc.el.classList.toggle('is-on', on);
      if (!on) continue;
      const pin = easeOut(clamp01((t - sc.start) / T.sceneIn));
      const pout = easeInOut(clamp01((t - sc.end) / T.sceneOut));
      sc.el.style.opacity = (pin * (1 - pout)).toFixed(4);
      sc.el.style.transform = `translateY(${((1 - pin) * 16 - pout * 10).toFixed(2)}px)`;
      sc.items.forEach(it => applyItem(it, t));
      sc.cams.forEach(c => applyCam(c, t));
    }
    if (progressEl) progressEl.style.width = (t / duration * 100).toFixed(3) + '%';
    return t;
  }

  /* ---------- Preview player ---------- */
  function mountPlayer() {
    const wrap = document.createElement('div');
    wrap.className = 'stage-wrap';
    stage.parentNode.insertBefore(wrap, stage);
    wrap.appendChild(stage);
    const ui = document.createElement('div');
    ui.className = 'player';
    ui.innerHTML = `<button data-a="prev">◀︎</button><button data-a="play">Play</button><button data-a="next">▶︎</button>
      <span class="scn"></span><div class="bar"><div class="track"></div><div class="fill"></div></div><span class="time"></span>`;
    wrap.after(ui);
    const bar = ui.querySelector('.bar'), fill = ui.querySelector('.fill'), time = ui.querySelector('.time'), scn = ui.querySelector('.scn'), playBtn = ui.querySelector('[data-a="play"]');
    scenes.forEach(sc => { const tk = document.createElement('div'); tk.className = 'tick'; tk.style.left = (sc.start / duration * 100) + '%'; tk.title = sc.title; bar.appendChild(tk); });
    const fit = () => {
      const s = Math.min((innerWidth - 40) / 1920, (innerHeight - 90) / 1080);
      stage.style.transform = `scale(${s})`;
      wrap.style.width = 1920 * s + 'px'; wrap.style.height = 1080 * s + 'px';
      document.documentElement.style.setProperty('--pw', 1920 * s + 'px');
    };
    fit(); addEventListener('resize', fit);
    const fmt = x => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
    const sceneAt = t => { let i = 0; scenes.forEach((s, k) => { if (t >= s.start) i = k; }); return i; };
    const show = t => { seek(t); fill.style.width = (current / duration * 100) + '%'; time.textContent = `${fmt(current / SPEED)} / ${fmt(duration / SPEED)}`; scn.textContent = `Scene ${sceneAt(current) + 1}/${scenes.length}`; };
    let playing = false, last = 0;
    const loop = now => { if (!playing) return; const dt = (now - last) / 1000; last = now; show(current + dt * SPEED); if (current >= duration) { playing = false; playBtn.textContent = 'Play'; return; } requestAnimationFrame(loop); };
    const toggle = () => { playing = !playing; playBtn.textContent = playing ? 'Pause' : 'Play'; if (playing) { if (current >= duration) current = 0; last = performance.now(); requestAnimationFrame(loop); } };
    const jump = d => { const i = Math.max(0, Math.min(scenes.length - 1, sceneAt(current) + d)); show(scenes[i].start + 0.7 * SPEED); };
    ui.addEventListener('click', e => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'play') toggle(); if (a.dataset.a === 'prev') jump(-1); if (a.dataset.a === 'next') jump(1); });
    bar.addEventListener('click', e => { const r = bar.getBoundingClientRect(); show((e.clientX - r.left) / r.width * duration); });
    addEventListener('keydown', e => {
      if (e.key === ' ') { e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowRight') jump(1);
      else if (e.key === 'ArrowLeft') jump(-1);
      else if (e.key === '.') show(current + SPEED / 30);
      else if (e.key === ',') show(current - SPEED / 30);
    });
    const startScene = num(params.get('scene'));
    const startT = num(params.get('t'));
    show(startT !== null ? startT * SPEED : (startScene ? scenes[Math.min(scenes.length, startScene) - 1].start : 0) + 0.7 * SPEED);
  }

  /* ---------- Boot ---------- */
  const ready = (async () => {
    if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r));
    progressEl = setupDom();
    await document.fonts.ready;
    await Promise.all([...document.images].map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })));
    scenes = [...stage.querySelectorAll(':scope > .scene')].map(buildScene);
    if (!scenes.length) warnings.push('No .scene elements inside .stage');
    duration = layoutTimeline(scenes);
    seek(0);
    if (!RENDER) mountPlayer();
    window.__video.scenes = scenes.map(sc => ({
      index: sc.index, id: sc.id, chapter: sc.chapter, title: sc.title, start: sc.start / SPEED, end: sc.end / SPEED,
      steps: sc.holds.map((h, k) => ({ step: k, start: sc.stepStart[k] / SPEED, hold: h / SPEED, words: Math.round(sc.words[k]), text: sc.texts[k].join(' ') }))
    }));
    return true;
  })();

  window.__video = {
    ready, warnings, speed: SPEED,
    seek: t => seek(t * SPEED) / SPEED,
    get duration() { return duration / SPEED; },
    /** Time just before step k of scene i ends: the moment every element of that step is settled. */
    settled(i, k) {
      const sc = scenes[i];
      if (k === undefined) k = sc.holds.length - 1;
      return (k === sc.holds.length - 1 ? sc.end : sc.stepStart[k + 1]) / SPEED - 0.05;
    }
  };
})();
