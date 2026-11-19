A segmented tab bar on a `muted` track, matching shadcn's `Tabs`.

## Usage
- `sc-tabs-list` with `role="tablist"`; each `sc-tabs-trigger` is a `<button role="tab">` with `aria-selected` and `aria-controls`.
- Panels are `sc-tabs-panel` with `role="tabpanel"`; hide inactive ones with `hidden`.
- Copy the small script from `preview.html` for click and arrow-key switching.
- Use tabs to switch views of one thing. For a two- or three-option filter inside a card header, put the tab list in `sc-card-action`.
