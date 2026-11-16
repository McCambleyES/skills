---
name: build-board
description: Turn a development plan into a live, shared build board on claude.ai. The board is an artifact page with a database that several people's Claude agents read and write. It holds tasks with full specs (what to do, what's out of scope, definition of done, where in the code, technical brief), dependencies, lanes for each person, a dependency graph, a timeline with milestones, project rules, an activity log, and a claim/update protocol for agents. Use this whenever the user wants to set up a coordination board, build board, task board or tracker for agents; split a plan into tasks for several people or agents; make "a board like the Security Audit Build"; or kick off a multi-agent build of a planned project, even if they don't say "board". Also use it to add tasks to an existing board, change one, or republish one made this way.
---

# Build board

A build board is a claude.ai artifact page that a team's Claude agents use as their shared source of truth while building a planned project. The page code is fixed and generic (`assets/board.html`). Everything about one project lives in its database: `meta/plan`, `meta/rules`, `tasks/*` and `log/*`. Building a board means doing three things well:

1. **Break the plan into tasks** with specs good enough that an agent can finish one without asking. This is most of the work and most of the value.
2. **Publish the page** from the template.
3. **Seed the database** and hand out the kickoff prompt.

Read `references/decompose.md` before drafting tasks, and `references/schema.md` before writing any data files.

The page is styled with the **Vector** design system, from the `vector` skill. Its tokens and icons are baked into the template (see "Design system" below), so every board looks the same without fetching anything.

## Before you start

You need:

- **A plan.** This can be a Claude Doc, an artifact, a Markdown file, a Confluence page or anything else you can read in full. If there's no plan yet, say so and offer to help write one first. A board built from a vague request turns into vague tasks.
- **People.** Who will drive agents, and roughly who owns what. Take this from the plan if it says; otherwise ask.
- **A start date**, and any holidays or freeze days.

Ask only for what the plan doesn't answer. Use one AskUserQuestion call for all of it, not a series.

## Workflow

### 1. Set up the board folder

Use `~/.claude/boards/<slug>/`, where `<slug>` is a short kebab-case name for the project. Keep the folder outside any repository: the board spans repos, and its files are the source you republish from later.

If the folder already exists, this is a change to a live board, so go to "Changing a live board" below.

### 2. Read the plan and draft the structure

Read the whole plan. Record its revision or version if it has one; it goes in `meta/plan.source_rev`. Then draft:

- the people and lanes, including a shared lane if there's joint work
- the phases, each with a `done_when` you could demonstrate
- an ID prefix of 2 to 4 capital letters
- the milestones, each gated by one task
- the start and end dates, and the holidays
- the project rules: merge policy, branch and commit format, off-limits environments, secrets handling

Show this structure to the user in a compact form and settle it before writing tasks. Changing lanes or phases after 40 tasks exist is expensive.

### 3. Draft the tasks

Follow `references/decompose.md`. Write one file per task at `tasks/<ID>.json`, plus `meta/plan.json`, `meta/rules.json` and `config.json`, in the shapes `references/schema.md` gives.

For a large plan, write the tasks phase by phase. Don't hold them all in your head before writing.

### 4. Check, then review with the user

```sh
python3 ~/.claude/skills/build-board/scripts/check_board.py ~/.claude/boards/<slug> --no-log
```

Fix every ERROR. Read every WARN and either fix it or be ready to explain why it's fine. Then do the manual consistency pass at the end of `references/decompose.md`.

Show the user:

- a table of tasks: ID, title, lane, deps, estimate and dates, grouped by phase
- the critical path and the milestone dates
- a coverage list: plan section → task IDs, plus anything you left out on purpose
- any warnings you chose not to fix, and why

Also render the board locally so the user can see it before anything goes live:

```sh
python3 ~/.claude/skills/build-board/scripts/build_page.py ~/.claude/boards/<slug> --draft
python3 ~/.claude/skills/build-board/scripts/preview_board.py ~/.claude/boards/<slug> --theme dark --screenshot ~/.claude/boards/<slug>/preview-dark.png
```

Look at the screenshot yourself, since it catches overlong labels, empty phases and a cramped graph, then give the user the path to `preview.html` to open. The preview serves the local files through a stand-in database, so it shows the board as it will look on its first day. The script exits non-zero if the page threw any errors; fix those before publishing.

Wait for approval before publishing or seeding. Seeding writes shared data that other people's agents will act on, and a wrong spec is much cheaper to fix in a local file than on a live board.

### 5. Publish the page

The page needs the `db` and `user` capabilities. Load the `artifact-capabilities` skill before you pass `capabilities`. The Artifact tool's contract may also ask for the `artifact-design` skill or a `quickstart` call before a new page. Follow that, but keep this template: it already meets the page contract (title, colour tokens, dark mode, phone layout, allowed font host). If a quickstart call is needed, pass `design_systems: false`, because the board already carries Vector. The data-driven views are the point, so don't swap in a generic Dashboard type.

1. Build a draft page, since the board doesn't have a URL yet:
   ```sh
   python3 ~/.claude/skills/build-board/scripts/build_page.py ~/.claude/boards/<slug> --draft
   ```
2. Publish `~/.claude/boards/<slug>/board.html` with the Artifact tool:
   - `capabilities: {"db": {}, "user": {}}`
   - `icon: "checklist"`
   - a one-sentence `description`
3. Put the returned URL in `config.json` as `board_url`. Use the bare `https://claude.ai/artifact/<id>`, never with a `?sk=` key. Rebuild without `--draft`, and republish the same file path so it keeps the same URL.

Check the result: `grep -c THIS_PAGE_URL board.html` must print 0.

### 6. Seed the database

```sh
python3 ~/.claude/skills/build-board/scripts/check_board.py ~/.claude/boards/<slug>
```

This run also writes a "seeded" log entry and `seed_batches.json`. For each batch in that file, call ArtifactData with `action: "batch"`, the board URL, and that batch as `writes`. Each entry is a create that reads its data from `file_path`, so you don't retype the tasks.

Then verify:

- `list` `tasks` with `limit` 1000 returns the same number of tasks you seeded.
- `get` `meta/plan` and `get` `meta/rules` both return their documents.

If a batch fails partway, re-run check_board with `--only` naming the documents that are still missing. Never re-send documents that already exist.

### 7. Hand off

Tell the user:

- **The board URL.** The page works only on claude.ai, signed in.
- **Sharing.** The artifact starts private. Each person whose agent will write to it needs Contributor or Editor access, which they can grant from the artifact's share menu on claude.ai.
- **The kickoff prompt** from the page's "For agents" section, with each person's name filled in, ready to paste into a new session.
- **What they should check first**: the first tasks that are ready in each lane, and any task with a `needs` that involves someone outside the team.

## Changing a live board

Once seeded, **the database is the source of truth**. Local task files go stale as soon as agents start writing status, so never re-seed existing documents. ArtifactData refuses a `set` on an existing document without `if_version`, which protects live data. Don't work around that.

- **Add tasks.** Write the new `tasks/<ID>.json` files and run `check_board.py <dir> --only tasks/<ID>,tasks/<ID>`, which checks them against the full local set. Then seed the batch. If existing tasks gain dependencies on the new ones, `update` them with `if_version` and log `kind: "replan"`.
- **Change a task's spec, deps or lane.** `get` the task, then `update` it with `if_version`. Log `kind: "amendment"` (scope) or `"replan"` (order or dates) with the reason. Update the local file too, so the folder stays a usable record.
- **Change rules or phases.** `update` `meta/rules` or `meta/plan` with `if_version`, and log `kind: "decision"`.
- **Upgrade the page** (for example, after this skill's template improves). Rebuild `board.html` from `config.json` and publish to the board's URL. In a new conversation, read the artifact with the Artifact tool first, then publish with `url`. The data isn't touched.
- **The plan changed.** Read the new revision and diff it against `meta/plan.source_rev`. Propose task changes as amendments for the user to approve, rather than rewriting specs silently.

## Design system

Boards use Vector. The `vector` skill (`~/.claude/skills/vector/`) holds its brand book, tokens, component guidelines and icons.

How the template uses it:

- **Tokens.** `assets/board.html` contains two generated blocks: `/* @tokens:start */` (Vector's `tokens.css`: every token as a CSS variable, light on `:root`, dark under `prefers-color-scheme` and `[data-theme]`) and `/* @icons:start */` (`.ico-<name>` classes). `scripts/sync_design_system.py` copies both in from the `vector` skill; don't edit them by hand. The template carries its own copy because an artifact page can't load files at runtime, and so a board built today looks the same next month.
- **Components.** The rest of the CSS maps the board onto Vector components. Panels and cards use the Card's lit gradient border, the header is the page's one glow section, statuses are Badges (colour only in the dot), and toggles and actions are Buttons. Section headings carry a bare 20px icon.
- **Status colours** use Vector's badge tones: waiting grey, ready blue, in progress amber, in review violet, blocked red, done green. They are defined once as `--st-*` at the top of the hand-written CSS.

If you change the board's styling, follow the `vector` skill's `README.md`:

- Use tokens only, never new raw colours.
- Colour goes in icons, dots and the single accent, never in text or surfaces.
- Text keeps 4.5:1 contrast in both themes.
- Preview both themes before publishing.

Write board copy in Vector's voice too: sentence case, short declarative titles, verbs on buttons, and no exclamation marks or emoji.

When Vector changes, run `python3 ~/.claude/skills/build-board/scripts/sync_design_system.py`. If it reports tokens the template uses that no longer exist, update the hand-written CSS in `assets/board.html` and run it again. Then preview a board in both themes (`scripts/preview_board.py --theme light|dark --screenshot`) and republish any live boards that should pick up the change (see "Changing a live board").

## Why the protocol looks the way it does

The page's "For agents" section is the contract every worker agent follows. It already covers claiming tasks with `if_version`, logging every change, `update` rather than `set`, appending to arrays rather than overwriting them, and treating amendments as scope changes. Keep it on the page rather than in a separate worker skill. That way anyone's agent gets the same instructions just by reading the URL, and changing the contract means republishing one page.
