A floating list of actions: an `overlay` panel with `shadow-overlay` and 16px corners, opening with a short fluid pop.

## Usage
- `pb-menu` holds `pb-menu__item` buttons. Each item may lead with an 18px icon and end with a `pb-kbd` shortcut.
- `pb-menu__sep` divides groups. Put a destructive item last, after a separator, as `pb-menu__item--danger`.
- Use the same panel styles (`overlay`, `shadow-overlay`, `radius-lg`) for popovers and dialogs; dialogs pad `space-6`, round to `radius-xl` and sit over a `backdrop` scrim.
- The consumer handles positioning, opening and keyboard navigation (arrow keys, Escape).
