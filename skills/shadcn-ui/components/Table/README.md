A borderless data table with row dividers, matching shadcn's `Table`.

## Usage
- Wrap `<table class="sc-table">` in `sc-table-wrap` so it scrolls sideways on narrow screens.
- Header cells are 40px and weight 500; rows divide with `border` and wash `muted` at 50% on hover. Mark a selected row with `aria-selected="true"`.
- Right-align numbers with `sc-num` on both the `<th>` and the `<td>`.
- Put status in an `outline` or `secondary` badge and row actions in a ghost icon button with the `ellipsis` icon.
- Put the table inside a `sc-card-content` for a dashboard panel.
