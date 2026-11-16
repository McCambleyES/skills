---
name: explain-with-slides
description: Build a claude.ai slide deck that explains a topic (a feature, screen, flow, data model, system or concept) in plain language, in the Linearesque design system. Use when the user says "Explain X" or "/explain-with-slides X", or asks for an explainer deck, slides or presentation on how something works. A quick question mid-task ("explain this error") gets a chat answer instead.
argument-hint: "<topic to explain>"
---

# Explain with slides

Turn "Explain X" into one dark, Linearesque slide deck that a newcomer can read on their own and trust. The deck is a claude.ai artifact made from the Slides type.

Two things matter equally:

- **Grounded.** Every claim on a slide traces to a source you read: code, docs or a page. Keep the source's certainty: a guess stays a guess, and an untested path is labeled as untested. Copy names, numbers, paths and field names exactly.
- **Plain and calm.** One idea per slide, question headings, short sentences, neutral surfaces with color only in small details.

`SKILL_DIR` means the folder this file is in.

## Fixed inputs

| What | Value |
|---|---|
| Slides type | `https://claude.ai/artifact/8jTsAFQMFDb2oA8MsPJ2eL` |
| Design system | Linearesque (README calls it Vector), `https://claude.ai/artifact/TEWtueJ78KnXj7TMcJu9rp`, folder `vector`, dark theme |
| Stylesheet | `SKILL_DIR/assets/deck.css`, copied verbatim to `project/deck.css` |
| Slide markup | `SKILL_DIR/references/slide-patterns.md` |
| Fonts | Inter (400, 500, 600) and JetBrains Mono (400, 500) from Google Fonts |
| Working folder | `<scratchpad>/explain-<slug>/`, holding `facts.md` and the deck's `project/` tree |

## Steps

### 1. Pin down X

Decide the topic, the reader and the purpose: what the reader should be able to do or decide after the deck. The default reader is a newcomer to the team who knows the product but not this part of the code. If X could mean two different things (two apps, two features with one name), ask one question. Otherwise state your assumption in one line and go on.

Done when you can write the deck's one-sentence lede.

### 2. Read the sources and build `facts.md`

Read the real material: for code, every file the topic runs through, end to end; for a concept outside the workspace, primary sources. Use Explore subagents for wide sweeps across repos. Follow the workspace's `CLAUDE.md` rules, including no live environments.

Write each fact as a row in `facts.md`:

| Fact, in plain words | Source (`path:line`, or URL and quote) | Status | Slide |
|---|---|---|---|

Status is `confirmed` (read in the source) or `unverified` (inferred, not traced or needs a live system). Record anything that looks wrong as a finding, and keep it as the source has it. Note the date you read the code.

Done when every part of X a reader needs has rows, each with a source.

### 3. Outline the deck

Write the outline at the top of `facts.md`: sections, then one line per slide stating its single idea and its pattern from `slide-patterns.md`. Use this arc, dropping parts with nothing in them:

1. **Cover**: where X lives (eyebrow breadcrumb), the title, the lede, then audience and source with date.
2. **The short version**: three to five numbered points to remember.
3. **Body sections**: in the order a newcomer needs, usually what it is, then how people use it, then how the system does it, then where it connects to other things.
4. **One or two statement slides** for the single rule or number the reader must not miss.
5. **What to watch for**: risks and traps, as a card grid.
6. **Findings**: confirmed and unverified problems found while reading, in two tables.
7. **Next steps**: numbered actions.
8. **Limits and sources**: what wasn't checked or run, and the files or pages read.

Aim for 12 to 20 slides. Cover every section the reader needs; when a slide is too full, split it. For a long list (28 keys, 10 traces), show every item across pages ("Keys 1–14 of 28") when each matters, or show the count plus the items that teach something and say so on the slide.

### 4. Write the words

Load the `iso-plain-language` skill (the user's own copy, not `anthropic-skills:iso-plain-language`) and apply it to every word on every slide. Slide rules on top of it:

- Headings are questions in the reader's words, in one grammar throughout: "How does the API store a season?" The cover title and statement slides are the exceptions.
- About 40 words at most in a card, 25 in a step and 90 on a slide.
- Sentence case, no emoji, no exclamation marks.
- Code, paths, keys and field names go in a `.code` span, exactly as in the source.
- Define a term on the slide where it first appears.

### 5. Build the deck

Create the deck: an Artifact publish with `type_url` set to the Slides type, a `title` and no files. If that is refused, run `quickstart` with `intent: "slides"` and use the Slides type it names. Then follow the type's instructions in the reply for file formats and publish calls. This skill decides only what goes in the files:

- **Design system:** use Linearesque. Install it as the type's Creating step 3 says: a `designSystems` record in `deck.json` with title `Linearesque`, namespace `vector`, the URL above and `copiedAt` set to now, and a `files` entry copying its `project/tokens.json` to `project/ds/vector/tokens.json`.
- **`deck.json`:** the `sections` from your outline, `cover`, and `faces` for Inter and JetBrains Mono.
- **`deck.css`:** copy `SKILL_DIR/assets/deck.css` verbatim. If a slide needs a layout it lacks, add a class at the end of the file and keep the tokens.
- **Slides:** build each from its pattern in `slide-patterns.md`. Stagger entrances with `class="in"` and `style="--i:N"`.

Done when every slide in the outline is published and the deck's `order` matches the outline.

### 6. Check accuracy with fresh eyes

Start a subagent that hasn't seen your reasoning. Give it the paths to `facts.md`, the slide files under `project/slides/` and the sources, and this task:

> Compare every claim on the slides with the sources (not with facts.md alone). List: (a) anything a slide states that the source doesn't support or states differently, such as names, numbers, conditions, order of steps, or cause and effect; (b) caveats or "unverified" labels that were dropped; (c) facts in the source a reader needs that the deck leaves out; (d) wording a newcomer would misread. Quote the source for each item.

Fix what it finds and republish those slides. Check diagrams yourself: arrows, directions and which boxes connect.

### 7. Look at the slides

Read the type's `artifact-type/reference/viewer.md` and preview each slide with a diagram, table, statement or hand-placed layout. Fix overflow, crowding and text running past the margins.

### 8. Report

Give the user:

- the deck link, its slide count and its sections
- what you read and when, and what you summarized or left out
- what you verified (the fresh-eyes review, the slides you previewed) and what remains unverified
- any placeholder you left and anything in the source that looked wrong
