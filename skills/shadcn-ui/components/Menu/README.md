Floating surfaces: dropdown menu, popover, tooltip and keyboard keys, matching shadcn's `DropdownMenu`, `Popover`, `Tooltip` and `Kbd`.

## Usage
- `sc-menu` holds `sc-menu-label`, `sc-menu-item` buttons, `hr.sc-menu-separator` and a trailing `sc-menu-shortcut`. `sc-menu-item--destructive` for delete.
- `sc-popover` is a 288px padded panel for small forms or details.
- `sc-tooltip` inverts the theme (`foreground` fill, `background` text); a `sc-kbd` inside it adapts.
- These classes style the surface only. Positioning and open/close are the page's job: a `popover` attribute, `<details>`, or a few lines of script.
