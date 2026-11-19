Pill buttons in seven styles and three sizes. Every button scales down slightly when pressed.

## Usage
- `pb-btn` alone is the neutral button: `default` fill, `text-primary`. Use it for most actions.
- `pb-btn--primary`: the one main action per view. `accent` fill, `on-accent` text.
- `pb-btn--secondary`: `default` fill with `accent-soft-text`, for a second, related action.
- `pb-btn--outline` (1px `border`, no fill) and `pb-btn--ghost` (no fill) for toolbars and low-priority actions.
- `pb-btn--danger` (solid) to confirm a destructive action; `pb-btn--danger-soft` to offer one.
- Sizes: default 36px, `--sm` 32px, `--lg` 44px for hero calls to action. `--icon` makes a circle for an icon-only button; give it an `aria-label`.
- An 18px icon may lead the label; a `pb-kbd` shortcut may follow it. Labels are verbs in sentence case. Focus shows a 2px `accent` outline; disabled fades to 0.5.
