A bordered panel with header, content and footer slots, matching shadcn's `Card`.

## Usage
- `sc-card` stacks its children `space-6` apart and pads `space-6` top and bottom; each slot pads `space-6` left and right.
- `sc-card-header` holds `sc-card-title` and `sc-card-description`. Add `sc-card-action` inside the header to pin a button or badge to the top right.
- `sc-card-content` for the body, `sc-card-footer` for actions. Add `sc-bordered` to a header or footer for a dividing line.
- For a stat card, put the description first and a large tabular number as the title, as in `Cover/preview.html`.
