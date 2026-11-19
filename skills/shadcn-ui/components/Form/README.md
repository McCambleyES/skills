Inputs, select, textarea, checkbox and switch, matching shadcn's `Input`, `NativeSelect`, `Textarea`, `Checkbox`, `Switch`, `Label` and `Field`.

## Usage
- Wrap each control in `sc-field` with a `sc-label` above it and optional `sc-help` or `sc-error` below.
- `sc-input`, `sc-select` (a styled native `<select>`) and `sc-textarea` are 36px tall (textarea grows), with a `shadow-xs` and the 3px focus ring.
- Mark errors with `aria-invalid="true"` on the control and link the `sc-error` text with `aria-describedby`.
- Checkbox: `<input type="checkbox" class="sc-checkbox">` inside a `sc-label`. Switch: `<input type="checkbox" role="switch" class="sc-switch">`.
- Form actions sit below the fields: a primary submit, then an outline cancel.
