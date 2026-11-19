shadcn/ui is a quiet, neutral interface system for apps and dashboards: white or near-black surfaces, 1px grey borders, faint shadows, a near-black (or, in dark mode, near-white) primary, and almost no colour. This folder ports its default `neutral` theme and its `new-york-v4` component recipes to plain CSS, so a page without React or Tailwind can look like a shadcn app. shadcn/ui is MIT-licensed and built to be copied; the tokens and recipes here come from ui.shadcn.com (checked 2026-11-19).

## Principles

- **Light first, dark everywhere.** Design in `light`. Every colour token has a `dark` value, so the same markup works in both.
- **Monochrome.** Surfaces, text, borders and the primary action are greys. Colour appears only in `destructive`, the `chart-*` palette, and the dark sidebar's `sidebar-primary`. A brand colour, if any, replaces `primary` and nothing else.
- **Borders separate; shadows barely lift.** Every card, table and menu has a 1px `border`. Shadows are Tailwind's faint `shadow-xs` to `shadow-lg`, never coloured, never glowing.
- **Pairs, not shades.** Each surface token has a `-foreground` partner. Put `primary-foreground` on `primary`, `muted-foreground` on `background`. Don't invent in-between greys.
- **Dense and calm.** 14px UI text, 36px controls, 24px card padding. Let whitespace and alignment carry the hierarchy, not weight or colour.

## Content and tone

- Sentence case for buttons, labels, titles and menu items: "Save changes", "Log out", "Recent orders".
- Buttons are short verbs: "Save", "Continue", "Delete account". No exclamation marks, no emoji.
- Card titles name the thing; card descriptions say what it shows in one line ("Visitors for the last 6 months").
- Numbers use `tabular-nums` and align right in tables.
- Shortcuts go in `sc-kbd` or `sc-menu-shortcut`: ⌘K, ⇧⌘P.

## Colour

| Pair | Use |
|---|---|
| `background` / `foreground` | Page and default text. |
| `card`, `popover` | Cards; menus and dialogs. Same as background in light, one step lighter in dark. |
| `primary` | The single main action in a view, checked controls, progress. |
| `secondary` | Lower-emphasis filled buttons and badges. |
| `muted` / `muted-foreground` | Subtle fills (tab track, kbd, code); descriptions, help text, meta. |
| `accent` | Hover and highlight wash only: ghost buttons, focused menu items, skeletons. Despite the name, it is grey. |
| `destructive` | Delete, errors, invalid fields. White text on its fill. |
| `border`, `input`, `ring` | Dividers; form-control borders; focus. |
| `chart-1` … `chart-5` | Chart series only, in that order. Light and dark palettes differ on purpose. |
| `sidebar-*` | The app sidebar, which sits a shade off the background. |

- `muted-foreground` passes 4.5:1 on `background` and `card` but sits just under it on `muted` in light. Keep small muted text off muted fills.
- Need a status colour (success, warning)? shadcn adds one as a new pair, such as `--warning` and `--warning-foreground`, defined in both themes. Add it the same way rather than reaching for a raw hex.
- The derived tokens at the end of `tokens.json` (`input-bg`, `outline-bg`, `switch-*`, `tab-active-*` and so on) stand in for shadcn's `dark:` utility classes. Components use them; pages rarely need to.

## Shape and depth

- One base `radius` (10px) derives the scale: `radius-sm` 6px (menu items, kbd), `radius-md` 8px (buttons, inputs, menus), `radius-lg` 10px (alerts, dialogs, tab track), `radius-xl` 14px (cards), `radius-full` (badges, avatars, switches). Change `--radius` to reshape everything at once.
- Shadows: `shadow-xs` on inputs and outline buttons, `shadow-sm` on cards and the selected tab, `shadow-md` on menus and popovers, `shadow-lg` on dialogs.
- Focus: the control's border turns `ring` and a 3px `ring` halo at 50% surrounds it. Invalid fields use the same halo in `destructive` at 20%.

## Type

- **Geist** for everything; **Geist Mono** for code. Both from Google Fonts.
- UI text is 14px (`text-sm`) at weight 400; labels, buttons and table headers are 500; titles are 600. Card titles are 16px with a line height of 1.
- Prose uses the Typography scale: `h1` 36px/800, `h2` 30px/600 with a bottom border, `h3` 24px, `h4` 20px, all with −0.025em tracking; body 16px at 28px line height; `lead` 20px muted.
- Show emphasis in UI copy with `foreground` against `muted-foreground`, not with extra weight.

## Layout and spacing

- Tailwind's 4px scale (`space-1` … `space-16`). Cards pad `space-6` and stack their header, content and footer `space-6` apart. Card grids and form fields gap `space-4` to `space-6`. Inside a field, label to control is `space-2`.
- Control heights: 32px small, 36px default, 40px large. Icon buttons are square at the same sizes.
- App layout: a 240–256px `sidebar`, a 56px top bar with a bottom `border`, content padded `space-6`. Collapse the sidebar under 768px.

## Iconography

- **Lucide**, shadcn's default set: 24px grid, 2px stroke, round caps and joins, `currentColor`. Show at 16px inside buttons, menus, alerts and inputs.
- Icons in menus are `muted-foreground`; icons in buttons take the label's colour. Never colour an icon to decorate it.
- `icons/` holds a starter set. For others, copy the SVG from lucide.dev or `lucide-static` (ISC-licensed).

## Motion

- 150ms transitions on colour, background and shadow. Menus and dialogs fade and zoom from 95% in about 150–200ms.
- Skeletons pulse; spinners spin. Both stop under `prefers-reduced-motion`.

## Do / Don't

| Do | Don't |
|---|---|
| Keep surfaces grey and put colour only in charts and destructive actions | Tint cards, headers or backgrounds |
| Use one `primary` button per view; make the rest `outline`, `secondary` or `ghost` | Put three solid primary buttons side by side |
| Separate with a 1px `border` | Use heavy shadows or gradients to separate |
| Pair every surface with its `-foreground` | Pick a new grey for text |
| Use `muted-foreground` for secondary text | Lower opacity on text to dim it |
| Show focus with the 3px `ring` halo | Remove focus outlines |
