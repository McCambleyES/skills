// Shared helpers: find the video page, launch Chrome, open the page in render mode.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function resolveVideo(arg) {
  if (!arg) throw new Error('Pass the project folder or its video.html');
  let p = path.resolve(arg);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'video.html');
  if (!fs.existsSync(p)) throw new Error(`Not found: ${p}`);
  return p;
}

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      if (v !== undefined) out[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
}

export async function launch() {
  const { chromium } = await import('playwright-core');
  const args = ['--force-color-profile=srgb', '--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none'];
  try {
    return await chromium.launch({ channel: 'chrome', args });
  } catch (e) {
    try {
      return await chromium.launch({ args });
    } catch (e2) {
      throw new Error('No browser found. Install Google Chrome, or run: npx --prefix "' + path.dirname(new URL(import.meta.url).pathname) + '" playwright-core install chromium\n' + e2.message);
    }
  }
}

export async function openVideo(browser, file, { scale = 1 } = {}) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => errors.push(`Failed to load ${r.url()}`));
  await page.goto(pathToFileURL(file).href + '?render=1');
  await page.waitForFunction(() => window.__video && window.__video.ready, null, { timeout: 30000 });
  await page.evaluate(() => window.__video.ready);
  const info = await page.evaluate(() => ({ duration: window.__video.duration, speed: window.__video.speed || 1, scenes: window.__video.scenes, warnings: window.__video.warnings }));
  return { page, info, errors };
}

export async function seekFrame(page, t) {
  await page.evaluate(t => { window.__video.seek(t); return new Promise(r => requestAnimationFrame(() => r())); }, t);
}

export function ffmpegPath() {
  try {
    const p = execFileSync(process.execPath, ['-e', "process.stdout.write(require('ffmpeg-static') || '')"], { cwd: path.dirname(new URL(import.meta.url).pathname) }).toString();
    if (p && fs.existsSync(p)) return p;
  } catch (e) { /* fall through */ }
  try { return execFileSync('which', ['ffmpeg']).toString().trim(); } catch (e) { /* none */ }
  throw new Error('ffmpeg not found. Run scripts/setup.sh, or install ffmpeg (brew install ffmpeg).');
}

export const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
