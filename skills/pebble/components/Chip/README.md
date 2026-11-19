A small pill for status, tags and counts. Soft tints by default; solid fills only when a status must stand out.

## Usage
- `pb-chip` alone is neutral (`default` fill). Add a tone for status: `--accent` (info, selected), `--success` (done, active), `--warning` (pending), `--danger` (failed, overdue). Tones use the `*-soft` fill with `*-soft-text`.
- Add `--solid` to a toned chip for the solid fill. Use it sparingly, for one status per view.
- An optional leading `<i></i>` draws a 6px dot in the text colour; a 14px icon also fits.
- Sizes: default 24px, `--sm` 20px, `--lg` 28px. The label always carries the meaning, so colour is never the only signal.
