# Runtime reference

`runtime/player.js` turns a page of `.scene` sections into a timeline. Every visual is a pure function of time, so the renderer can seek to any frame and get the same picture. You never set times by hand. You say *what appears at which step*, and the runtime works out *how long each step stays on screen* from the words it adds.

## Page skeleton

```html
<body data-pace="1">            <!-- 1.2 = 20% slower reading pace, 0.9 = faster -->
<!-- optional: data-speed="1.75" (the default) sets playback speed; data-speed="1" plays at the 1x timing below -->
<main class="stage">
  <section class="scene" data-chapter="Chapter name"> … </section>
  …
</main>
<script src="runtime/icons.js"></script>
<script src="runtime/player.js"></script>
</body>
```

The stage is 1920 × 1080. Scenes play in document order. A scene fades and rises in, holds through its steps, then fades out before the next one starts.

## Timing model

- **Steps.** Each scene runs through steps 0, 1, 2, … up to the highest step number used in it. Step 0 starts with the scene.
- **Hold time.** Each step holds for about `0.6 s + (0.9 s + words ÷ 3.2) × pace`, with a minimum of 1.8 s.
  - `words` counts only the text that step adds.
  - Code and paths count as heavier reading.
  - Steps with a count-up, a typing effect or a camera move hold long enough for the motion to finish.
- **Extra time.** `data-hold="2"` on an element adds 2 s to the step it appears in, which is useful for a diagram that needs studying. That is its own `data-step`, else its nearest ancestor's, else step 0. `data-hold` on a `.scene` adds time at the end of the scene.
- **Playback speed.** The whole timeline then plays 1.75 times faster by default, like watching at 1.75x in a video player: every hold, entrance and fade is divided by 1.75. Set `data-speed` on `<body>` to change it (`1` for the original pace). The times above are at 1x. The rendered MP4, the preview player and the hold times in `check/script.md` are all at the playback speed. The checker's "scene runs too long" warning still judges the 1x length, because it is about how many ideas a scene holds.
- **Reading it back.** `check/script.md` lists every step's text and hold time. Read it to judge the pace.

## Attributes

| Attribute | On | Effect |
|---|---|---|
| `data-step="N"` | any element | Enters at step N. Without it, an element is visible from the start of its scene. |
| `data-anim="…"` | with `data-step` | How it enters: `rise` (default), `fade`, `pop`, `left`, `right`, `down`, `grow-x`, `grow-y`, `draw`, `type`, `count`, `none`. |
| `data-stagger="0.1"` | container with `data-step` | Its direct children enter one after another, 0.1 s apart (default 0.09). Use for card grids, table rows and badge rows. |
| `data-delay="0.5"` | with `data-step` | Starts the entrance 0.5 s into its step. Use it to bring an edge label in after its line draws. |
| `data-dur="1.2"` | with `data-step` | Entrance length in seconds. |
| `data-exit="N"` | any | Fades out at step N. Captions that replace each other use `data-step="k" data-exit="k+1"`. |
| `data-dim="N"` / `data-undim="M"` | any | Fades to about 26% at step N, and back at step M. Use it to focus on one part. |
| `data-mark="N"` / `data-unmark="M"` | any | Draws an accent highlight from step N to step M. See "Marks" below. |
| `data-cam='{"2":[1.6,0.25,0.5]}'` | `.cam` wrapper | At step 2, zooms to 1.6× centred on 25% across and 50% down the wrapper. Add more keys for more moves, and `[1,0.5,0.5]` to zoom back out. The wrapper's parent must clip (`overflow:hidden`). |
| `data-chapter="Name"` | `.scene` | Groups scenes into numbered chapters. The runtime adds a chapter tag at the top left of content scenes. |
| `data-chapter-num` | any element | Filled with this scene's chapter number (`01`). Use it in chapter cards. |
| `data-chapter-ref="Name"` | any element | Filled with the number of the chapter called Name, for text like "See chapter <span data-chapter-ref="Rules"></span>". Numbers stay right when chapters move. The title scene's chapter is not numbered. |
| `data-timeline='{…}'` | empty `div` | Builds a date timeline. See "Date timeline" below. |
| `data-tag="off"` | `.scene` | Hides the chapter tag on this scene. |
| `data-noread` | any | Text that doesn't count toward reading time (decorative labels, axis ticks). |

### Animation notes

- **`draw`** works on SVG paths, lines, polylines and shapes, or on a `<g>` holding them. It traces the stroke, adds the arrowhead at the end, and fades in any `<text>` inside the group near the end. Dashed or dotted strokes fade in instead of tracing.
- **`count`** counts up to the number in the element's text, and keeps the prefix, suffix, decimals and thousands separators. Put it on the element that holds only the number.
- **`type`** types out the text of a leaf element, at about 40 characters a second. Use it sparingly, for a command or one short line.
- **SVG elements with a `transform` attribute** only fade, because a CSS transform would override the attribute and move them. Put `data-step` on an inner element, or on a wrapper `<g>` without a transform, if you need movement.
- Don't add CSS `transition` or `animation` rules. Render mode disables them, and they would play differently in the preview.

### Marks

A mark is an accent ring and wash whose strength follows the CSS variable `--m`, from 0 to 1.

- **HTML elements:** the ring is drawn automatically, about 10 px outside the element.
- **`<tr>`:** the row gets a tinted background and an accent bar on the left.
- **`.ln` code lines:** the line gets a highlight band.
- **SVG nodes:** include a `<rect class="ring">` about 8 px larger than the box, inside the `.dg-node` group. Only the ring follows `--m`.

## Date timeline

Use it for anything placed on real dates: seasons, schedules, payment months, loans. The runtime draws a date-scaled SVG with:

- an axis with month, week or day ticks
- one bar per range
- labelled pins for single days, such as "Today"

```html
<div class="timeline" data-timeline='{
  "from": "2026-11-01", "to": "2027-09-30", "ticks": "month",
  "bars": [
    { "label": "Winter", "sub": "21 Nov to 12 Apr", "from": "2026-11-21", "to": "2027-04-12", "tone": "blue", "step": 1 },
    { "label": "Summer", "from": "2027-06-18", "to": "2027-09-06", "tone": "green", "row": 0, "step": 2, "mark": 4 }
  ],
  "markers": [
    { "label": "Today", "date": "2026-11-10", "step": 3, "exit": 4 },
    { "label": "Today", "date": "2027-05-01", "step": 4 }
  ]
}'></div>
```

- Dates are `YYYY-MM-DD`. A bar covers whole days, from the start of `from` to the end of `to`.
- `ticks` is `month`, `week` or `day`. If you leave it out, the runtime picks one from the span.
- Each bar takes its own row unless you give `row`. Bars that share a row must not overlap.
- Bars and markers take `step`, `exit`, `dim`, `undim`, `mark` and `unmark`, just like elements.
- **To move a pin,** add one marker per position, each with `step` and `exit`.
- If a bar is too narrow for its label, the label goes to the right of the bar. The checker flags it if it then runs off the frame.

## Captions that replace each other

Put the captions in one `.captions` container. They all occupy the same spot, and the container is as tall as the longest one. Give each caption `data-step="k"` and `data-exit="k+1"`. The last caption has no exit.

```html
<div class="captions">
  <div class="card card--tight" data-step="1" data-exit="2"><span class="n">1</span><p class="primary">…</p></div>
  <div class="card card--tight" data-step="2"><span class="n">2</span><p class="primary">…</p></div>
</div>
```

## CSS classes (runtime/vector-video.css)

| Group | Classes |
|---|---|
| Scenes | `.scene`, `.scene--title`, `.scene--chapter`, `.scene--center`, `.scene--top`, `.scene--middle` |
| Type | `.display` 104px, `.h1` 76, `.h2` 60, `.h3` 36, `.h4` 30, `.lead` 36 (secondary colour), `.body` 30, `.small` 26, `.label` 24, `.micro` 22, `.eyebrow` 26; `.primary`, `.secondary`, `.muted`, `.accent`, `.hue`, `.mono`, `.wide` (removes the max line length) |
| Hue | `.tone-blue`, `-violet`, `-amber`, `-green`, `-teal`, `-pink`, `-orange`, `-red`, `-indigo`, `-grey`. These set `--hue`, `--soft` and `--hue-text` for everything inside. |
| Layout | `.row`, `.col`, `.gap-1` … `.gap-8`, `.grow`, `.fill`, `.grid-2`, `.grid-3`, `.grid-4`, `.split` (5:7), `.split--even`, `.split--wide` (4:8), `.head`, `.center` |
| Surfaces | `.card`, `.card--accent` (one per scene), `.card--tight`, `.node`, `.node--accent` |
| Icons | `<i class="ic" data-icon="name"></i>` inherits the hue. Put it inside `.tile`, `.tile--sm` or `.tile--lg` for the soft square backing. |
| Small parts | `.badge` (dot plus label, coloured by tone), `.badge--soft`, `.badge--plain`, `.chip`, `.chip .dot`, `.chain` plus `.arrow`, `.kbd`, `code` |
| Lists | `.list` (dot bullets, `.sub` for a second line), `.list--compact`, `.steps` (numbered circles) |
| Flow | `.flow` with `.node` and `.link` children |
| Table | `.table`, `.table--compact` |
| Code | `pre.code` with `<span class="ln" data-n="1">` per line. Token colours: `.k` keyword, `.s` string, `.n` number, `.f` function or property, `.c` comment. Also `.code-title` and `.path`. |
| Callouts | `.callout` plus `--warn`, `--bug`, `--info`, `--ok`, with an `.ic` first and a `<p>` holding a `.title` span |
| Stats | `.stat`, `.num` (with `<small>` for units), `.what` |
| Compare | `.versus`, `.yes`, `.no` (each with an `.ic` then text) |
| Timeline | `.strip` of `.cell` (`.on`, `.now`), `.axis` |
| Lanes | `.lanes` with `.lane-name` and `.lane` (HTML lanes), or draw the lanes in SVG as in patterns.html scene 10 |
| State demo | `.check`, `.check.on` |
| Diagram text colour | `.dg-hue` (the tone's text colour), `.dg-secondary`, `.dg-muted` on SVG `<text>` |
| Diagram (SVG) | `svg.diagram`, `g.dg-node` (with `rect.box`, `rect.ring`, `text.t1`, `text.t2`, `.accent`, `.ghost`), `path.dg-edge` (`.dashed`, `.dotted`, `.hot`), `text.dg-label`, `rect.dg-label-bg`, `g.dg-group`, `.dg-dot` |
| Arrowheads | `marker-end="url(#arrow)"`, or `url(#arrow-hot)` for a `.hot` edge |

## Icons

`database server cloud user users role shield lock key document code terminal api globe device monitor scan ticket card cart receipt tag box layers calendar clock repeat bolt bell mail search gear filter list table chart flow branch link arrow check x alert info bug flag eye eyeoff plus trash edit money queue home mountain map puzzle sparkle`

The checker reports any unknown icon name. To add an icon, append it to the project's `runtime/icons.js`. Draw it on a 24 px grid with 1.5 px strokes, and give one part `data-f` for the soft fill.

## Preview and API

Opening `video.html` in a browser shows a player. Space plays and pauses, ← and → move between scenes, and `,` and `.` step one frame. URL options: `?t=42` opens at 42 seconds of output time (at the playback speed), and `?scene=5` opens scene 5.

`?render=1` is the mode the scripts use. It shows only the stage, with no player.

`window.__video` has:

- `ready`: a promise
- `duration`
- `scenes`: each with its steps, times and text
- `seek(t)`
- `settled(sceneIndex, step)`: a time when that step has fully appeared
- `warnings`
