#!/usr/bin/env node
// Start a video project.
//   node new.mjs <project-dir> [--title "Video title"]
// Creates <dir>/runtime/ (styles, fonts, player), <dir>/video.html (a starter you replace),
// <dir>/source/ (put the extracted source here) and <dir>/facts.md (the fact inventory).
// Re-running it refreshes runtime/ and leaves your other files alone.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args._[0]) { console.error('Usage: node new.mjs <project-dir> [--title "..."]'); process.exit(2); }
const dir = path.resolve(args._[0]);
const skill = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
fs.mkdirSync(path.join(dir, 'source'), { recursive: true });
fs.cpSync(path.join(skill, 'assets', 'runtime'), path.join(dir, 'runtime'), { recursive: true });
const title = args.title && args.title !== true ? String(args.title) : 'Untitled explainer';
const video = path.join(dir, 'video.html');
if (!fs.existsSync(video)) {
  const tpl = fs.readFileSync(path.join(skill, 'assets', 'template.html'), 'utf8').replaceAll('{{TITLE}}', title.replace(/[<&]/g, c => (c === '<' ? '&lt;' : '&amp;')));
  fs.writeFileSync(video, tpl);
}
const facts = path.join(dir, 'facts.md');
if (!fs.existsSync(facts)) fs.writeFileSync(facts, [
  `# ${title}`, '',
  'Source: <link or path>', 'Read on: <date>', '',
  '## Outline', '', '<Chapters, then scenes. One line per scene: its single idea.>', '',
  '## Hue map', '', '<One hue per object type, used in every scene. Example: Season = blue, Account = indigo.>', '',
  '## Facts', '',
  '| # | Fact, in plain words | Where in the source (quote or path) | Scene |',
  '|---|---|---|---|', '',
  '## Worked examples', '', '<Inputs, method and outputs for anything computed. Leave empty if none.>', '',
  '## Changes after review', '', ''
].join('\n'));
console.log(`Project ready: ${dir}\n  video.html   edit this\n  facts.md     fill this first\n  source/      extracted source text and data\n  runtime/     styles, fonts and player (don't edit; re-run new.mjs to refresh)`);
