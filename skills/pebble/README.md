Pebble is a soft, friendly interface system for product and marketing surfaces, styled after the look of heroui.com (HeroUI v3): borderless white surfaces on a pale grey page, generous rounded corners, pill buttons that press in when clicked, and colour that arrives as soft tints. It is an original system: its name, icons and tokens are its own, and it uses no HeroUI logos or artwork. Its colour, radius, shadow and motion values started from HeroUI v3.2.7's default theme (read 2026-11-19), converted from oklch to hex. The accent, danger and muted values were darkened so that text holds 4.5:1.

## Principles

- **Light first, dark as an equal.** Design in the `light` theme. Every token has a `dark` value, so the same markup works in both.
- **Lift, not lines.** Surfaces are separated by tone and a layered micro-shadow (`shadow-surface`), not by borders. A card has no outline; a field has only a hairline. In dark, shadows drop away and the tone steps do the work.
- **Round and touchable.** Cards round to 24px, buttons and chips are pills, fields round to 12px. Everything pressable scales down slightly on press, so the interface feels physical.
- **Soft colour.** Status colour appears mostly as a 15–20% tint with a darker text of the same hue (`*-soft` + `*-soft-text`). Solid colour is kept for the one primary action and for destructive confirmations.

## Content and tone

- Sentence case everywhere: "Save changes", "Booking confirmed", "Updated 2h ago".
- Headlines are short, confident promises: "Never start from zero." "Everything you need to ship." Subcopy says what the product does, in one sentence.
- Buttons are verbs: "Get started", "Save", "Delete booking". No exclamation marks, no emoji.
- Shortcuts and IDs are set in `mono`: ⌘K, BK-2041.

## Colour

- **Surfaces step up in tone:** `bg-base` (page), `surface` (cards, fields), `surface-2` and `surface-3` (nested cards, header rows). `overlay` is for anything that floats. `default` is the neutral fill for secondary buttons, chips, tab tracks and icon tiles.
- **Text has two weights:** `text-primary` for headings, body and labels, `text-muted` for descriptions and meta. Both pass 4.5:1 on every surface, `default` included, in both themes.
- **One accent.** `accent` (blue) fills the single primary action and marks selection and focus. `accent-text` is for links. `accent-soft` with `accent-soft-text` is the quieter, tinted form.
- **Status colours** are `success` (green), `warning` (amber), `danger` (red). Each has a solid fill, a `-soft` tint and a `-soft-text`. Prefer the soft pair; use solid fills for a destructive button (`danger`) or a status that must shout. Text on solid `success` and `warning` is `on-status` (dark); on `accent` and `danger` it is `on-accent` (white).
- Colour is never the only signal: a chip has a word, an error has a message.

## Depth and shape

The signature detail. Light surfaces float on three stacked, very faint shadows rather than a border:

```css
.pb-card {
  border-radius: var(--radius-xl);   /* 24px */
  background: var(--surface);
  box-shadow: var(--shadow-surface); /* 0 2px 4px .04, 0 1px 2px .06, 0 0 1px .06 */
}
```

- **Cards and panels:** `surface`, `shadow-surface`, `radius-xl`. A card inside a card switches to `surface-2` with no shadow.
- **Floating layers** (menus, popovers, dialogs): `overlay`, `shadow-overlay`, `radius-lg`. In dark, `shadow-overlay` adds a 1px inner hairline so the layer separates from the surface below it.
- **Fields:** `surface`, `shadow-surface` plus a `separator` hairline, `radius-md`. On a `default` or `surface-2` background, use the flat `pb-input--secondary`.
- **Borders** (`border`) appear only on outline buttons. Dividers inside a surface are 1px `separator`.
- No gradients on surfaces and no glass blur by default. A marketing hero may use one large, soft radial wash of `accent-soft` behind the headline.

## Type

- **Inter** for everything; **JetBrains Mono** for shortcuts and code. Both from Google Fonts.
- Headlines are bold (700) and tightly tracked (`display` −0.035em, `title-1` −0.025em). UI text is small and even: most labels and body copy are 14px.
- Styles: `display` 56px, `title-1` 36px, `title-2` 20px, `body-lg` 18px, `body` 14px, `label` 14px medium, `small` 12px medium, `mono` 13px.

## Layout and spacing

- A 4px grid: `space-1` … `space-24`. Cards pad `space-4` (`space-6` for large cards and dialogs) and space their parts `space-3` apart; card grids gap `space-4`; sections are `space-24` apart on wide screens.
- Radii: `radius-sm` for menu rows, `radius-md` for fields and icon tiles, `radius-lg` for menus and nested cards, `radius-xl` for cards and dialogs, `radius-pill` for buttons, chips, tabs and avatars.
- Controls: buttons 36px tall (32 small, 44 large); fields 40px; chips 24px.

## Iconography

- 24px grid, 1.75px rounded strokes, one colour: `currentColor`. Icons take the colour of the text around them, so inline them as `<svg>` (an `<img>` can't inherit colour).
- Show icons at 18px in buttons and menus, 20px elsewhere, 14px in chips. In feature cards, set the icon in a 40px `pb-icontile`, neutral or tinted with a soft status colour.

## Motion

- Press: buttons scale to `press-scale` (0.97; 0.98 small, 0.96 large) over `dur-press` with `ease`; pressable cards scale to 0.99.
- Colour and background change over `dur-fast` (100ms) `ease-out`.
- Menus, popovers and the tab indicator move over `dur-overlay` (300ms) on `ease-fluid`, a fast-start, long-settle curve. No bounce.
- Honour `prefers-reduced-motion`: drop the scale and the overlay animation, keep colour changes.
- Disabled controls fade to `disabled-opacity` (0.5).

## Do / Don't

| Do | Don't |
|---|---|
| Lift cards with `shadow-surface` on `bg-base` | Outline cards with grey borders |
| Make buttons pills that press in | Use square-cornered buttons |
| Tint status with `*-soft` + `*-soft-text` | Fill every chip with solid colour |
| Keep one solid `accent` button per view | Put the accent on several competing actions |
| Nest with `surface-2`, no second shadow | Stack shadows on shadows |
| Drop shadows in dark and step the tone | Use black drop shadows on dark surfaces |
