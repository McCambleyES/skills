A labelled text input: a borderless white well on a faint shadow and hairline, with 12px corners.

## Usage
- Wrap a `<label>`, a `pb-input` (`<input>`, `<select>` or `<textarea>`) and optional `pb-field__help` in `pb-field`. Always give the field a visible label.
- On `bg-base` or a `surface`, use `pb-input`. On a `default` or `surface-2` background, use `pb-input--secondary` (flat `default` fill, no shadow).
- Focus shows a 2px `accent` outline offset by 2px. For an error, set `aria-invalid="true"` on the input and replace the help text with `pb-field__error`, which says how to fix it.
- Placeholders are examples ("e.g. 4 guests"), never the label.
