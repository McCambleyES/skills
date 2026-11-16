---
name: vector
description: Vector (also called Linearesque), a quiet dark-first design system with lit gradient borders, faint glows and two-tone icons. Use when styling a page, artifact, deck, video or board in Vector or Linearesque, or when another skill names Vector.
---

# Vector

Vector is a design system: near-black surfaces, 1px borders lit from the top, faint radial glows, and small two-tone icons that carry almost all of the colour. This folder is its source of truth. Skills that use Vector (`build-board`, `explain-with-slides`, `explainer-video`) take their tokens from here.

`SKILL_DIR` means the folder this file is in.

## Files

| Path | What it is |
|---|---|
| `README.md` | The brand book: principles, tone, colour, gradient borders, type, spacing, icons, motion, do and don't. **Read it in full before styling anything.** |
| `tokens.json` | Every token with its value per theme and a usage note. Dark is the primary theme. |
| `tokens.css` | The tokens as CSS custom properties, light and dark. Generated: run `python3 SKILL_DIR/scripts/tokens_css.py` after changing `tokens.json`. |
| `components/bundle.css` | The `vx-*` component classes: card, glow section, buttons, badge, icon tile. Loads Inter and JetBrains Mono from Google Fonts. |
| `components/<Name>/README.md` | When and how to use each component. |
| `components/<Name>/preview.html` | A working example of each component. Open it in a browser. `Cover/preview.html` is the system's cover art. |
| `icons/*.svg`, `icons/README.md` | Ten two-tone icons on a 24px grid, one hue per object type. |

## Use it in a page

1. Read `README.md` and the README of each component you will use.
2. Put the contents of `tokens.css` and `components/bundle.css` in the page's `<style>`. Inline them rather than linking, because an artifact page can't load files from this folder.
3. Add `class="vx"` to `<body>` and build with the `vx-*` classes. Use tokens for every colour, size and radius.
4. Inline icons as `<img src="data:image/svg+xml,…">` or as inline `<svg>`. Their colours are baked in.
5. Check both themes. Text keeps 4.5:1 contrast on its surface.

At a different scale (slides at 1920×1080, video), keep the colour tokens and scale the type and spacing up in proportion, as `explain-with-slides/assets/deck.css` and `explainer-video/assets/runtime/vector-video.css` do.

## Change Vector

Edit `tokens.json`, `README.md`, `components/` or `icons/` here, then:

1. Run `python3 SKILL_DIR/scripts/tokens_css.py`.
2. Update the copies that skills keep at their own scale, if they use what you changed:
   - `build-board`: run `python3 ~/.claude/skills/build-board/scripts/sync_design_system.py`. It copies `tokens.css` and the icons into the board template.
   - `explain-with-slides/assets/deck.css` and `explainer-video/assets/runtime/vector-video.css`: copy changed colour values into their `:root` blocks by hand.
3. Open the component previews and check both themes.
