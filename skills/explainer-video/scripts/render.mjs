#!/usr/bin/env node
// Render a video page to MP4, frame by frame.
//   node render.mjs <project-dir | video.html> [--out file.mp4] [--fps 30] [--workers N] [--scale 1|2] [--from s] [--to s] [--crf 15]
// --scale 2 renders 3840×2160. --from/--to render part of the video (seconds) for a quick look.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { resolveVideo, parseArgs, launch, openVideo, seekFrame, ffmpegPath, fmtTime } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const file = resolveVideo(args._[0]);
const dir = path.dirname(file);
const fps = Number(args.fps || 30);
const scale = Number(args.scale || 1);
const crf = String(args.crf || 15);
const workers = Math.max(1, Number(args.workers || Math.min(6, Math.max(1, Math.floor(os.cpus().length / 2)))));
const partial = args.from !== undefined || args.to !== undefined;
const base = path.basename(dir);
const outFile = path.resolve(args.out || path.join(dir, partial ? `${base}-part-${Number(args.from || 0)}-${args.to ?? 'end'}.mp4` : `${base}.mp4`));
const ffmpeg = ffmpegPath();

const browser = await launch();
const probe = await openVideo(browser, file, { scale });
const duration = probe.info.duration;
if (probe.errors.length) console.warn('Page reported problems:\n  ' + [...new Set(probe.errors)].join('\n  '));
await probe.page.close();

const from = Math.max(0, Number(args.from || 0));
const to = Math.min(duration, Number(args.to || duration));
const first = Math.round(from * fps), last = Math.ceil(to * fps); // frames [first, last)
const total = last - first;
console.log(`Rendering ${fmtTime(to - from)} (${total} frames at ${fps} fps, ${1920 * scale}×${1080 * scale}) with ${workers} workers`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'explainer-render-'));
let done = 0;
const started = Date.now();
let lastLog = -1;
const tick = () => {
  const pct = done / total;
  if (!process.stdout.isTTY) { const d = Math.floor(pct * 10); if (d === lastLog) return; lastLog = d; }
  const el = (Date.now() - started) / 1000;
  const eta = pct > 0 ? el / pct - el : 0;
  process.stdout.write(`${process.stdout.isTTY ? '\r' : ''}  ${(pct * 100).toFixed(1)}%  ${done}/${total} frames  ${fmtTime(el)} elapsed  ~${fmtTime(eta)} left   ${process.stdout.isTTY ? '' : '\n'}`);
};

async function renderRange(w, a, b) {
  const { page } = await openVideo(browser, file, { scale });
  const client = await page.context().newCDPSession(page);
  const seg = path.join(tmp, `seg-${String(w).padStart(2, '0')}.mp4`);
  const ff = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-tune', 'animation', '-x264-params', 'aq-mode=3', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-r', String(fps), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const exited = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
  for (let f = a; f < b; f++) {
    await seekFrame(page, f / fps);
    const { data } = await client.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false });
    const buf = Buffer.from(data, 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    done++; if (done % 10 === 0) tick();
  }
  ff.stdin.end();
  await exited;
  await page.close();
  return seg;
}

const per = Math.ceil(total / workers);
const ranges = [];
for (let w = 0; w < workers; w++) {
  const a = first + w * per, b = Math.min(last, a + per);
  if (a < b) ranges.push([w, a, b]);
}
const segs = await Promise.all(ranges.map(([w, a, b]) => renderRange(w, a, b)));
tick();
await browser.close();

fs.mkdirSync(path.dirname(outFile), { recursive: true });
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, segs.map(s => `file '${s}'`).join('\n'));
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', outFile]);
fs.rmSync(tmp, { recursive: true, force: true });
const mb = (fs.statSync(outFile).size / 1e6).toFixed(1);
console.log(`\nWrote ${outFile} (${mb} MB, ${fmtTime(to - from)}) in ${fmtTime((Date.now() - started) / 1000)}`);
