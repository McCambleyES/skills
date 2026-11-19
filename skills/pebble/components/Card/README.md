A borderless surface lifted by a layered micro-shadow, with 24px corners. Use it for every card and panel.

## Usage
- `class="pb-card"` on any block. It pads `space-4`, spaces its children `space-3` apart, rounds to `radius-xl` and sits on `surface` with `shadow-surface`.
- Parts, all optional: `pb-card__header` holding `pb-card__title` (h3, 14px medium) and `pb-card__desc` (p, `text-muted`); then any content; then `pb-card__footer` for buttons.
- Variants: `--secondary` (`surface-2`, no shadow) for a card nested in a card; `--tertiary` (`surface-3`); `--transparent` for a card-shaped group with no fill.
- `pb-card--pressable` when the whole card is one link or button: it washes to `surface-hover` and scales to 0.99 on press. Put it on an `<a>` or `<button>`, never on a card that also holds buttons.
- For large feature cards, override the padding to `space-6`. The consumer provides the grid (gap `space-4`).
