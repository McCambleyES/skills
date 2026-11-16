# Scene patterns

Every pattern below is working code in `SKILL_DIR/assets/examples/patterns.html`. Copy from that file rather than writing from scratch.

## Contents

- Telling a story without voice
- Which pattern for which content
- Pattern notes
- Composition rules

## Telling a story without voice

With no narrator, the screen does three jobs at once. It says what's happening, it shows it, and it controls the pace. These habits make that work:

- **Lead each scene with its point.** The heading is a statement the viewer could repeat: "The API is the real gate". Visuals and steps then prove or unpack it.
- **Reveal in reading order.** Show the heading first. Then add the parts in the order you'd explain them aloud, one per step. The runtime holds each step long enough to read.
- **Show, then say.** For diagrams, reveal the structure first. Then put one sentence under it saying what to notice. Use `data-dim` and `data-mark` to point at the part the sentence is about.
- **Use captions for sequences.** For a process or trace, add a caption card per step inside a `.captions` container. Each one replaces the last (`data-step` plus `data-exit`) while a mark or dot moves through the diagram.
- **Keep continuity.** A thing keeps the same hue, icon and name in every scene. When a later scene zooms into something from an earlier one, repeat its tile or chip so viewers recognise it.
- **Use chapter cards.** Put one before each major section. They give viewers a breather and a map.
- **Repeat for memory.** End with a recap of three to five points, and use the same words as the scenes that taught them.

## Which pattern for which content

| Source content | Pattern (scene in patterns.html) |
|---|---|
| Title, subtitle, audience | Title (1) |
| Section start | Chapter card (2) |
| Summary or "short version" bullets | Key points list (3) |
| A set of parallel things (areas, roles, record types) | Card grid with icon tiles (4) |
| Entities and relationships, ER diagrams, Mermaid `erDiagram` | SVG relationship diagram, revealed in steps, then focused (5) |
| A linear process or checklist of 3–6 stages | Process flow with marks and caption cards (6). For more stages, use a numbered `steps` list or split across scenes. |
| End-to-end chain of records or services | `chain` of `chip`s with arrows |
| Small table (up to ~7 rows) | Table with row marks (7) |
| Large table (8+ rows) | Page it: up to ~7 rows per scene, with "Rows 1–7 of 26" in the eyebrow. Or show a summary count plus the rows that matter, and say how many are left out. |
| Code, JSON, request lines | Code block with line marks, plus a file path (8) |
| Numbers worth remembering | Stats with count-up (9) |
| A request or job moving between systems (swimlanes, traces) | Lane trace with a caption per step (10). For long traces, show the lanes once, then one scene per 4–6 steps. |
| Warnings, gotchas, known bugs, unverified findings | Callouts (11): `callout--warn` for watch-outs, `callout--bug` for confirmed bugs, `callout--info` for notes. Add a `badge` saying "Unverified" when the source says so. |
| Do / don't, before / after, A vs B | `versus` grid with `yes` / `no` rows, or two cards side by side (11) |
| Dates, seasons, schedules, payment months | Date timeline (12): `data-timeline` draws a date-scaled axis, bars and pins. To move a "today" pin, add one marker per position with `step` and `exit`. |
| Equal units (days 1–30, months 1–12) where each cell is a state | Strip of `.cell`s (12b). To show a cell changing state, put a second element inside the cell with `data-step` that covers it. |
| A big diagram (architecture, many nodes) | Camera zoom (13): show the whole, zoom into each region in turn, then zoom back out |
| If-then rules, formulas, cascades | Cards with the condition as the `h4` and the result in `p`, revealed one per step. Put formulas in code style. |
| Interactive demo (checkbox grid, calculator) | Rebuild one or two worked states as static HTML. Show the input, then the result, as separate steps. Label it "Example". Take the values from `source/worked-examples.md`. |
| Ending | Recap with numbered `steps` (14), then optionally a sources scene listing the source paths |

## Pattern notes

**Diagrams.** Use one `<svg class="diagram" viewBox="0 0 1620 H">`. 1620 is the content width, so 1 unit = 1 pixel and font sizes stay true.

- Put edges before nodes in the markup, so the lines run under the boxes.
- Start and end each edge on a box's edge, never inside the box.
- Put edge labels on a `dg-label-bg` rect so the line doesn't cross the text.
- Keep node text to a name and one short detail line. Long explanations go in the caption below the diagram.
- Text sizes: node names 30px, details 24px, labels 24px. Don't go smaller.

**Hues.** Pick one hue per object type at the start, and list it in `facts.md`. Use `icon-*`-style hues only for icons, dots, bars and small marks. Body text stays neutral. `hue` text (via `.hue`) is for short labels only.

**Long processes.** If a process scene runs past about 45 seconds, split it into two scenes that show the same flow. In the first scene, dim the second half with `data-dim="0"`. In the second, dim the first half. Viewers keep the whole picture while each scene teaches part of it.

**Code.** Show at most about 14 lines. Cut unrelated lines and mark the cut with a comment like `# …`, but never change the lines you keep. Mark the line the step talks about.

**Dense source detail.** Detail such as file:line references for every step belongs in a small `path` line under the caption, not in the main text. If it doesn't help a newcomer understand, list it on a closing "Where to look in the code" scene instead.

**Uncertainty.** Carry the source's own words: "Unconfirmed", "Probably", "Known bug". Don't upgrade a guess into a fact, and don't downgrade a confirmed fact.

## Composition rules

- The content area is 1620 × 810 px, inside 150 px side margins and a top band for the chapter tag. The checker flags anything outside a 40 px safe margin.
- Scenes centre their content vertically by default. Use `scene--top` to pin content to the top, which suits tall tables.
- Use one focal point per frame. If two things compete, split the scene or dim one.
- Grids: 2, 3 or 4 columns. Prefer fewer, larger items.
- Leave space. If a frame looks full in the contact sheet, it is too full for a video.
- Use at most one `card--accent` per scene, on the item that matters most.
