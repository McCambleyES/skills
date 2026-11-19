Six variants and four sizes, matching shadcn's `Button`.

## Usage
- `sc-btn`: the default, `primary` fill. One per view, for the main action.
- `sc-btn--secondary` (filled grey), `sc-btn--outline` (bordered, `shadow-xs`), `sc-btn--ghost` (no fill until hover), `sc-btn--destructive` (white on `destructive`), `sc-btn--link` (underlined on hover).
- Sizes: `sc-btn--sm` 32px, default 36px, `sc-btn--lg` 40px. Add `sc-btn--icon` for a square icon-only button and give it an `aria-label`.
- A 16px Lucide icon may lead the label; padding tightens automatically. For loading, add the `loader-circle` icon with class `sc-spinner` and set `disabled`.
- Use `<a class="sc-btn">` for navigation and `<button>` for actions.
