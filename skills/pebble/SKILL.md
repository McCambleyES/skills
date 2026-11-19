---
name: pebble
description: Pebble (also called Heroesque), a soft light-first design system after HeroUI, with borderless shadow-lifted surfaces, large radii, pill buttons that press in, and tinted status colours. Use when styling a page, artifact, deck, video or board in Pebble, Heroesque or a HeroUI look, or when another skill names Pebble.
---

# Pebble

Pebble is a design system: pale grey pages, white surfaces lifted by faint layered shadows instead of borders, 24px card corners, pill buttons that scale down when pressed, and colour that arrives as soft tints. This folder is its source of truth.

`SKILL_DIR` means the folder this file is in.

## Files

| Path | What it is |
|---|---|
| `README.md` | The brand book: principles, tone, colour, depth and shape, type, spacing, icons, motion, do and don't. **Read it in full before styling anything.** |
| `tokens.json` | Every token with its value per theme and a usage note. Light is the primary theme. Shadows are themed too. |
| `tokens.css` | The tokens as CSS custom properties, light and dark. Generated: run `python3 SKILL_DIR/scripts/tokens_css.py` after changing `tokens.json`. |
| `components/bundle.css` | The `pb-*` component classes: card, button, chip, field, menu, tabs, icon tile. Loads Inter and JetBrains Mono from Google Fonts. |
| `components/<Name>/README.md` | When and how to use each component. |
| `components/<Name>/preview.html` | A working example of each component. Open it in a browser. `Cover/preview.html` is the system's cover art. |
| `icons/*.svg`, `icons/README.md` | Ten single-colour stroke icons on a 24px grid that inherit `currentColor`. |

## Use it in a page

1. Read `README.md` and the README of each component you will use.
2. Put the contents of `tokens.css` and `components/bundle.css` in the page's `<style>`. Inline them rather than linking, because an artifact page can't load files from this folder.
3. Add `class="pb"` to `<body>` and build with the `pb-*` classes. Use tokens for every colour, size, radius and timing.
4. Inline icons as `<svg class="pb-icon" viewBox="0 0 24 24">` with the icon's inner paths, so they take the surrounding text colour.
5. Check both themes. Text keeps 4.5:1 contrast on its surface.

At a different scale (slides at 1920×1080, video), keep the colour and shadow tokens and scale type, spacing and radii up in proportion.

## Change Pebble

Edit `tokens.json`, `README.md`, `components/` or `icons/` here, then:

1. Run `python3 SKILL_DIR/scripts/tokens_css.py`.
2. Recheck contrast for any text colour you changed against every surface it sits on, in both themes, and update the ratio in its usage note.
3. Open the component previews and check both themes.
