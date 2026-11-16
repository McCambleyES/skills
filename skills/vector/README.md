Vector is a quiet, precise interface system for product and marketing surfaces, styled after the look of linear.app: near-black canvases, hairline borders that catch light along their top edge, faint radial glows, and small icons that carry almost all of the colour. It is an original system: its name, icons and tokens are its own, and it uses no Linear logos or artwork.

## Principles

- **Dark first, light where it helps.** Design in the `dark` theme. Every token has a `light` value, so the same markup works in both.
- **Neutral surfaces, colourful details.** Backgrounds, text and borders are greys. Colour appears in icons, one `accent` action per view, and faint glows. Nothing else is coloured.
- **Light, not lines.** Borders are 1px and fade from `edge-highlight` at the top to `border-faint` at the bottom, so a card looks lit from above rather than outlined.
- **Restraint.** If you notice a gradient, it is too strong. Glows stay under 16% opacity, and a section has two at most.

## Content and tone

- Sentence case everywhere: "Create issue", "Cycle 24", "Updated 2h ago".
- Headlines are short and declarative: "Plan the work. Ship it." Subcopy says what the product does in one sentence.
- Buttons are verbs: "Create", "Get started", "Open app". No exclamation marks, no emoji.
- Issue keys and shortcuts are set in `mono`: ENG-1423, ⌘K.

## Colour

- **Surfaces step up in three levels:** `bg-base` (page), `bg-raised` (cards, panels) and `bg-elevated` (buttons, inputs, icon tiles). `bg-hover` is the wash on hover.
- **Text has three weights:** `text-primary` for headings and body, `text-secondary` for descriptions, `text-tertiary` for meta. All pass 4.5:1 on every surface in both themes.
- **One accent.** `accent` fills the single primary action and marks selection. `accent-text` is for links. Do not use the accent for decoration.
- **Icon colours** (`icon-blue` … `icon-grey`) are for icon strokes only, each paired with its `soft-*` tile fill. Each object type keeps its colour everywhere: Issues are always violet, Projects always green. Hues also differ in lightness, so the icon shape, not the colour, tells types apart.

## Gradient borders

The signature detail. A 1px border painted as a vertical gradient:

```css
.vx-card {
  border: 1px solid transparent;
  background:
    linear-gradient(180deg, var(--tint-top), transparent 60%) padding-box,
    linear-gradient(var(--bg-raised), var(--bg-raised)) padding-box,
    linear-gradient(180deg, var(--edge-highlight), var(--border-subtle) 40%, var(--border-faint)) border-box;
}
```

- **Default** (`vx-card`): `edge-highlight` → `border-subtle` → `border-faint`. Use for every card and panel.
- **Accent** (`vx-card--accent`): a diagonal `edge-accent-a` (indigo) → `border-subtle` → `edge-accent-b` (orange). One per page, for the featured card.
- Gradient borders are decorative. A control must still read as a control from its fill and label.

## Backgrounds

- Pages are flat `bg-base`. A hero or feature section may add `vx-glow`: an elliptical `glow-accent` bleeding in from the top centre and a smaller `glow-warm` off to one side.
- Cards add `tint-top` inside, fading out by 60%, so the top of each card is a touch lighter.
- No full-colour gradients, no mesh gradients, no noise textures.

## Type

- **Inter** for everything; **JetBrains Mono** for keys and code. Both from Google Fonts.
- Headings use weight 600 with negative tracking (`display` −0.03em, `title-1` −0.025em). Body is 400 at default tracking.
- Styles: `display` 56px, `title-1` 36px, `title-2` 22px, `body-lg` 17px, `body` 15px, `label` 13px, `micro` 12px, `mono` 13px.

## Layout and spacing

- A 4px grid: `space-1` … `space-24`. Cards pad `space-6`; card grids gap `space-4`; sections are `space-24` apart on wide screens.
- Radii: `radius-sm` for controls, `radius-md` for icon tiles, `radius-lg` for cards, `radius-xl` for hero frames, `radius-pill` for badges.
- Shadows only on things that float (menus, popovers): `shadow-card`. Cards in a grid rely on their gradient border.

## Iconography

- 24px grid, 1.5px rounded strokes, two-tone: a full-colour stroke plus the same hue at 22% as a fill on one part of the shape (Icons asset group).
- Show icons at 16px in dense UI and 20px in cards. In feature cards, set the icon on a 36px `vx-icontile` with the matching `soft-*` fill.
- One hue per object type: Inbox blue, Issues violet, Cycles amber, Projects green, Roadmap teal, Insights pink, Triage orange, Integrations red, Teams indigo, Docs grey.

## Motion

- 150ms `ease-out` for hover and press; 240ms for menus and popovers. No bounce.
- On hover a card's border brightens to `border-strong` and its glow does not move.

## Do / Don't

| Do | Don't |
|---|---|
| Fade borders from light at the top | Draw flat, uniform grey outlines on cards |
| Keep glows under 16% and two per section | Fill sections with colourful gradients |
| Put colour in icons and one accent button | Colour headings, cards or backgrounds |
| Give each object type one icon hue | Mix hues for the same object |
| Use the accent border on one featured card | Put accent borders on every card |
