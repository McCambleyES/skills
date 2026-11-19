A modal, matching shadcn's `Dialog`, built on the native `<dialog>` element.

## Usage
- `<dialog class="sc-dialog">`, opened with `showModal()`. The backdrop is black at 50%.
- Inside: `sc-dialog-header` (`sc-dialog-title`, `sc-dialog-description`), the body, then `sc-dialog-footer` with cancel (outline) before confirm (primary). The footer stacks on phones.
- Wrap the contents in `<form method="dialog">` so buttons close it. Add a ghost icon button with the `x` icon top right.
- For confirmations of destructive actions, make the confirm button `sc-btn--destructive`.
