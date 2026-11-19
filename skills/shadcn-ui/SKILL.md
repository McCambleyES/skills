---
name: shadcn-ui
description: shadcn/ui as a design system in plain CSS, with neutral OKLCH tokens, 1px borders, faint shadows, Geist type and Lucide icons. Use when styling a page, artifact, deck, video or board in a shadcn or shadcn/ui look, or when another skill names it.
---

# shadcn/ui

shadcn/ui's look: monochrome surfaces paired with `-foreground` tokens, 1px grey borders, faint Tailwind shadows, 36px controls, a 3px focus ring, Geist type and Lucide icons. This folder ports its default `neutral` theme and `new-york-v4` component recipes to plain CSS, so pages without React or Tailwind can use it. It is the source of truth for the tokens and `sc-*` classes.

`SKILL_DIR` means the folder this file is in.

## Files

| Path | What it is |
|---|---|
| `README.md` | The brand book: principles, tone, colour, shape and depth, type, spacing, icons, motion, do and don't. **Read it in full before styling anything.** |
| `tokens.json` | Every token with its value per theme and a usage note. Light is the primary theme. |
| `tokens.css` | The tokens as CSS custom properties, light and dark (system preference, `data-theme`, or shadcn's `.dark` class). Generated: run `python3 SKILL_DIR/scripts/tokens_css.py` after changing `tokens.json`. |
| `components/bundle.css` | The `sc-*` classes: button, badge, card, form controls, tabs, table, alert, menu, popover, tooltip, kbd, dialog, avatar, skeleton, progress, spinner, separator, typography. Loads Geist and Geist Mono from Google Fonts. |
| `components/<Name>/README.md` | When and how to use each component. |
| `components/<Name>/preview.html` | A working example of each component, with a theme toggle. Open it in a browser. `Cover/preview.html` is a full dashboard that composes them. |
| `icons/*.svg`, `icons/README.md` | A starter set of Lucide icons that inherit `currentColor`. |

## Use it in a page

1. Read `README.md` and the README of each component you will use.
2. Put the contents of `tokens.css` and `components/bundle.css` in the page's `<style>`. Inline them rather than linking, because an artifact page can't load files from this folder.
3. Add `class="sc"` to `<body>` and build with the `sc-*` classes. Use tokens for every colour, radius and shadow.
4. Inline icons as `<svg>` with the icon's paths, so they take the surrounding text colour.
5. Check both themes. Text keeps 4.5:1 contrast on its surface.

At a different scale (slides at 1920×1080, video), keep the colour tokens and scale type, spacing and radii up in proportion.

## In a codebase that already uses shadcn/ui

If the project has a `components.json`, use its real components instead of this bundle: add them with `npx shadcn@latest add <component>` and take colours from the project's own global CSS, which may differ from the defaults here. Shadcn's own skill (`npx skills add shadcn/ui`) covers the CLI and component APIs. `README.md`'s principles still apply.

## Change it

Edit `tokens.json`, `README.md`, `components/` or `icons/` here, then:

1. Run `python3 SKILL_DIR/scripts/tokens_css.py`.
2. Recheck contrast for any text colour you changed against every surface it sits on, in both themes, and update its usage note.
3. Open the component previews and check both themes.

To follow an upstream change, compare `tokens.json` with the "Default Theme CSS" on ui.shadcn.com/docs/theming and the component sources under `apps/v4/registry/new-york-v4/ui/` in the `shadcn-ui/ui` GitHub repo.
