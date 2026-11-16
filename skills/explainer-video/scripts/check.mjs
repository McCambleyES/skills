#!/usr/bin/env node
// Check a video before rendering it.
//   node check.mjs <project-dir | video.html> [--scene N] [--no-frames]
// Writes <project>/check/: one frame per step (frames/), contact sheets (sheet-NN.png),
// report.md (layout problems and timing) and script.md (all on-screen text, in order).
// Exits 1 if it finds errors that must be fixed before rendering.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveVideo, parseArgs, launch, openVideo, seekFrame, fmtTime } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const file = resolveVideo(args._[0]);
const dir = path.dirname(file);
const out = path.join(dir, 'check');
const framesDir = path.join(out, 'frames');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const browser = await launch();
const { page, info, errors } = await openVideo(browser, file);
const onlyScene = args.scene ? Number(args.scene) - 1 : null;

// Runs inside the page: inspect the visible scene at the current time.
function inspect() {
  const SAFE = { l: 40, t: 24, r: 1920 - 40, b: 1080 - 24 };
  const scene = [...document.querySelectorAll('.stage > .scene.is-on')].pop();
  if (!scene) return { problems: [], words: 0 };
  const opacityOf = el => { let o = 1; for (let n = el; n && n !== document.body; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
  const label = el => {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
    return `<${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? ' class="' + el.className + '"' : ''}> "${t}"`;
  };
  const boxes = [];
  const walker = document.createTreeWalker(scene, NodeFilter.SHOW_TEXT);
  let words = 0;
  while (walker.nextNode()) {
    const n = walker.currentNode;
    const owner = n.parentElement;
    if (!n.textContent.trim() || !owner || owner.closest('[data-noread],style,script')) continue;
    const op = opacityOf(owner);
    if (op < 0.5) continue;
    words += n.textContent.trim().split(/\s+/).length;
    const r = document.createRange(); r.selectNodeContents(n);
    for (const rc of r.getClientRects()) if (rc.width > 1 && rc.height > 1) boxes.push({ owner, rc, size: parseFloat(getComputedStyle(owner).fontSize), svg: owner instanceof SVGElement });
  }
  const problems = [];
  const seen = new Set();
  const add = (kind, level, msg) => { const k = kind + msg; if (!seen.has(k)) { seen.add(k); problems.push({ kind, level, msg }); } };
  const inCam = el => !!el.closest('[data-cam]');
  // Text inside a camera is meant to leave the frame when zoomed: judge only what shows through its window.
  const camWindow = el => { const cam = el.closest('[data-cam]'); return cam && cam.parentElement ? cam.parentElement.getBoundingClientRect() : null; };
  for (let i = boxes.length - 1; i >= 0; i--) {
    const w = camWindow(boxes[i].owner);
    const rc = boxes[i].rc;
    if (w && (rc.right <= w.left || rc.left >= w.right || rc.bottom <= w.top || rc.top >= w.bottom)) boxes.splice(i, 1);
  }
  for (const b of boxes) {
    const { rc, owner } = b;
    if (rc.left < SAFE.l || rc.top < SAFE.t || rc.right > SAFE.r || rc.bottom > SAFE.b) add('frame', inCam(owner) ? 'warn' : 'error', `Text outside the safe area (${Math.round(rc.left)},${Math.round(rc.top)} → ${Math.round(rc.right)},${Math.round(rc.bottom)}): ${label(owner)}`);
    const boxEl = owner.closest('.card,.node,.callout,.chip,.badge,.code,.tile,.dg-node,td,th');
    if (boxEl) {
      const br = boxEl.matches('.dg-node') && boxEl.querySelector('rect.box') ? boxEl.querySelector('rect.box').getBoundingClientRect() : boxEl.getBoundingClientRect();
      if (rc.right > br.right + 2 || rc.bottom > br.bottom + 2 || rc.left < br.left - 2 || rc.top < br.top - 2) add('spill', 'error', `Text spills out of its ${boxEl.className.baseVal ?? boxEl.className}: ${label(owner)}`);
    }
    const px = b.svg ? rc.height / 1.2 : b.size;
    if (px < 19.5) add('small', 'warn', `Text is ${Math.round(px)}px, below the 20px minimum: ${label(owner)}`);
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], c = boxes[j];
    if (a.owner === c.owner || a.owner.contains(c.owner) || c.owner.contains(a.owner)) continue;
    const w = Math.min(a.rc.right, c.rc.right) - Math.max(a.rc.left, c.rc.left);
    const h = Math.min(a.rc.bottom, c.rc.bottom) - Math.max(a.rc.top, c.rc.top);
    if (w <= 0 || h <= 0) continue;
    const small = Math.min(a.rc.width * a.rc.height, c.rc.width * c.rc.height);
    if (w * h > 0.12 * small) add('overlap', 'error', `Text overlaps other text: ${label(a.owner)} and ${label(c.owner)}`);
  }
  // Lines (diagram edges, gridlines, pins) that visibly run through text
  const isOpaque = el => {
    if (opacityOf(el) < 0.5) return false;
    const cs = getComputedStyle(el);
    if (el instanceof SVGElement) {
      if (!/^(rect|circle|ellipse|path|polygon)$/.test(el.tagName)) return false;
      const m = cs.fill.match(/rgba?\(([^)]+)\)/);
      if (cs.fill === 'none' || !m) return false;
      const parts = m[1].split(',').map(Number);
      return (parts[3] ?? 1) * parseFloat(cs.fillOpacity || 1) > 0.5;
    }
    const bg = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
    return cs.backgroundImage !== 'none' || (bg && (bg[1].split(',').map(Number)[3] ?? 1) > 0.5);
  };
  const strokes = [...scene.querySelectorAll('path, line, polyline')].filter(g => {
    if (g.closest('defs,marker')) return false;
    const cs = getComputedStyle(g);
    return cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0 && opacityOf(g) > 0.5;
  });
  for (const g of strokes) {
    let len = 0; try { len = g.getTotalLength(); } catch (e) { continue; }
    const ctm = g.getScreenCTM(); if (!ctm || !g.ownerSVGElement) continue;
    const pt = g.ownerSVGElement.createSVGPoint();
    for (let l = 0; l <= len; l += 5) {
      const p = g.getPointAtLength(l); pt.x = p.x; pt.y = p.y;
      const sp = pt.matrixTransform(ctm);
      for (const b of boxes) {
        const r = b.rc;
        if (sp.x <= r.left + 2 || sp.x >= r.right - 2 || sp.y <= r.top + r.height * 0.2 || sp.y >= r.bottom - r.height * 0.2) continue;
        const stack = document.elementsFromPoint(sp.x, sp.y);
        const iLine = stack.indexOf(g);
        if (iLine === -1) continue;
        const covered = stack.slice(0, iLine).some(e => e !== b.owner && !b.owner.contains(e) && !e.contains(b.owner) && isOpaque(e));
        if (!covered) add('line', 'error', `A line runs through text: ${label(b.owner)}. Move the line, or put the text on a dg-label-bg rect.`);
      }
    }
  }
  scene.querySelectorAll('*').forEach(el => {
    if (el instanceof SVGElement) return;
    const cs = getComputedStyle(el);
    if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden') && el.textContent.trim() && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) && opacityOf(el) > 0.5 && !el.closest('[data-cam]') && !el.querySelector('[data-cam]') && !el.matches('.scene'))
      add('clip', 'error', `Content is cut off inside ${label(el)} (${el.scrollWidth}×${el.scrollHeight} in ${el.clientWidth}×${el.clientHeight})`);
  });
  if (words > 95) add('dense', 'warn', `${words} words on screen at once; aim for under 80`);
  return { problems, words };
}

const report = [];
const script = [];
const shots = [];
let errorCount = 0, warnCount = 0;

for (const sc of info.scenes) {
  if (onlyScene !== null && sc.index !== onlyScene) continue;
  const n = sc.index + 1;
  const dur = sc.end - sc.start;
  script.push(`## Scene ${n}${sc.chapter ? ` · ${sc.chapter}` : ''}${sc.title ? ` · ${sc.title}` : ''}  (${fmtTime(sc.start)}–${fmtTime(sc.end)})`);
  const sceneProblems = [];
  for (const st of sc.steps) {
    if (st.text) script.push(`- [step ${st.step}, ${st.hold.toFixed(1)}s] ${st.text.replace(/\s+([.,;:!?)])/g, '$1').replace(/([(])\s+/g, '$1')}`);
    const t = await page.evaluate(([i, k]) => window.__video.settled(i, k), [sc.index, st.step]);
    await seekFrame(page, t);
    const res = await page.evaluate(inspect);
    res.problems.forEach(p => sceneProblems.push({ ...p, step: st.step }));
    if (st.words > 45) sceneProblems.push({ level: 'warn', step: st.step, msg: `Step adds ${st.words} reading units at once (words; code and paths count extra); split it so viewers can keep up` });
    if (!args['no-frames']) {
      const f = path.join(framesDir, `s${String(n).padStart(2, '0')}-${String(st.step).padStart(2, '0')}.jpg`);
      await page.screenshot({ path: f, type: 'jpeg', quality: 82 });
      shots.push({ f, label: `Scene ${n} · step ${st.step}` });
    }
  }
  if (dur * info.speed > 50) sceneProblems.push({ level: 'warn', step: '-', msg: `Scene runs ${(dur * info.speed).toFixed(0)}s at 1x speed; split it into smaller ideas` });
  script.push('');
  const errs = sceneProblems.filter(p => p.level === 'error'), warns = sceneProblems.filter(p => p.level === 'warn');
  errorCount += errs.length; warnCount += warns.length;
  report.push(`### Scene ${n} — ${sc.title || sc.id || '(untitled)'} — ${dur.toFixed(1)}s, ${sc.steps.length} steps`);
  if (!sceneProblems.length) report.push('OK');
  sceneProblems.forEach(p => report.push(`- ${p.level.toUpperCase()} (step ${p.step}): ${p.msg}`));
  report.push('');
}

// Contact sheets: 2 × 3 frames each, at half size so text stays legible
const PER_SHEET = 6;
if (shots.length) {
  const sheet = await browser.newPage({ viewport: { width: 1980, height: 1800 } });
  for (let s = 0; s * PER_SHEET < shots.length; s++) {
    const group = shots.slice(s * PER_SHEET, s * PER_SHEET + PER_SHEET);
    const html = `<!doctype html><body style="margin:0;background:#1b1c1f;font:500 22px system-ui;color:#c9ccd2;display:grid;grid-template-columns:repeat(2,960px);gap:18px 20px;padding:20px">${group.map(g => `<figure style="margin:0"><img src="${pathToFileURL(g.f).href}" style="width:960px;height:540px;display:block;border-radius:6px"><figcaption style="padding-top:6px">${g.label}</figcaption></figure>`).join('')}</body>`;
    const tmp = path.join(out, `.sheet.html`);
    fs.writeFileSync(tmp, html);
    await sheet.goto(pathToFileURL(tmp).href);
    await sheet.waitForFunction(() => [...document.images].every(i => i.complete));
    await sheet.screenshot({ path: path.join(out, `sheet-${String(s + 1).padStart(2, '0')}.png`), fullPage: true });
    fs.rmSync(tmp);
  }
}

await browser.close();

const head = [
  `# Check report`,
  ``,
  `Video: ${file}`,
  `Length: ${fmtTime(info.duration)} (${info.duration.toFixed(1)}s), ${info.scenes.length} scenes`,
  `Errors: ${errorCount}  Warnings: ${warnCount}`,
  ...info.warnings.map(w => `- RUNTIME WARNING: ${w}`),
  ...[...new Set(errors)].map(e => `- PAGE ERROR: ${e}`),
  ``
];
errorCount += new Set(errors).size;
fs.writeFileSync(path.join(out, 'report.md'), head.concat(report).join('\n'));
fs.writeFileSync(path.join(out, 'script.md'), [`# On-screen text`, '', `Every word the viewer sees, in order, with each step's hold time.`, '', ...script].join('\n'));
console.log(head.join('\n'));
report.filter(l => l.startsWith('- ') || l.startsWith('###')).forEach(l => console.log(l));
console.log(`\nWrote ${path.relative(process.cwd(), out) || out}/report.md, script.md, ${shots.length} frames and ${Math.ceil(shots.length / PER_SHEET)} contact sheets.`);
process.exit(errorCount ? 1 : 0);
