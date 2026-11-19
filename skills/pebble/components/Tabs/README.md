A pill-shaped track with the selected tab lifted onto a white segment. Use it to switch views or filter one list.

## Usage
- `pb-tabs` (role `tablist`) holds `pb-tabs__tab` buttons (role `tab`). Mark the current one `aria-selected="true"`; it gets the `segment` fill and `shadow-segment`.
- Keep it to two to five short labels. For page-level navigation with many items, use ghost buttons instead.
- The selected segment changes over `dur-overlay` on `ease-fluid`. The consumer wires the tab panels and arrow-key movement.
