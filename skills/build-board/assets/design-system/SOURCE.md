# Vector design system: local copy

- Source: https://claude.ai/artifact/TEWtueJ78KnXj7TMcJu9rp (a Design System artifact owned by Jake)
- Copied: 2026-11-13, from artifact version `1794601996-af72` (index `lastChange` 2026-11-12T16:30:00Z)

## What's here

| File | Copied from |
|---|---|
| `README.md` | `project/README.md`, the brand book. Read this before changing any board styling. |
| `tokens.json` | `project/tokens.json` |
| `components/bundle.css` | `project/components/bundle.css`, the reference for the `vx-*` component styles |
| `components/<Name>/README.md`, `preview.html` | The guidelines and preview for each component |
| `icons/*.svg`, `icons/README.md` | Asset group "Icons", renamed from blob ids to their index names |

## Why a copy, not a link

A board page can't load this system at runtime. Each artifact runs on its own origin, and the system's `tokens.css` is generated inside its own page, not published as a file. So the board template carries the tokens itself (the generated blocks in `assets/board.html`). The copy also keeps builds offline and repeatable: a board built today looks the same next month, even if Vector changes.

## Re-syncing after Vector changes

1. Read the system with the Artifact tool (bare URL above):
   - `read` with `path` for `project/tokens.json`, `project/README.md` and `project/components/bundle.css`
   - for icons, `list` with `scope: "assets"`, then `read` each asset id one at a time with `path` (a multi-path read doesn't fetch assets)
   - the index `project/design-system.json` maps blob ids to icon names under `assetGroups.Icons.files`
2. Replace the matching files here. Update the date and version above.
3. Run `python3 ~/.claude/skills/build-board/scripts/sync_design_system.py`. If it reports tokens the template uses that no longer exist, update the hand-written CSS in `assets/board.html` to use the new names, then run it again.
4. Preview a board in both themes (`scripts/preview_board.py --theme light|dark --screenshot`) and look at the screenshots.
5. Republish any live boards that should pick up the change (SKILL.md, "Changing a live board").
