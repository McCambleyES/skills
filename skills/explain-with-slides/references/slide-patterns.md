# Slide patterns

Each pattern is one slide file, `project/slides/<id>.html`, using the classes in `assets/deck.css`. Copy the markup, swap in the content and keep the class names. The text below is example content from past decks; replace all of it.

Pick the pattern by the content's shape:

| Content | Pattern |
|---|---|
| Where X lives, what it is | Cover |
| Three to five things to remember | Short version |
| Parallel concepts, parts or options | Card grid |
| Things that happen in order | Steps |
| A request that crosses apps, servers and jobs | Trail |
| Records and how they link | Flow |
| Values across several attributes, a reference list | Table |
| The one rule the reader must not miss | Statement: rule |
| A count that tells the story | Statement: numbers |
| Risks and traps | Watch for |
| Problems found while reading | Findings |
| What to do now | Next steps |
| What wasn't checked, files read | Limits and sources |

Shared rules:

- Content slides start with a `.head` block (eyebrow, then the `h2` question), so the heading never moves between slides.
- Add `class="in" style="--i:N"` to the blocks that should rise in, counting up from 1 in reading order.
- For a slide footer, add `has-foot` to the section and end it with `<div class="foot"><p class="meta">Deck title</p><p class="pn"></p></div>`. Use footers on every content slide or on none.
- Icons are `<x-icon name="...">` inside a `.tile` with a tone class (`t-blue`, `t-violet`, `t-amber`, `t-green`, `t-teal`, `t-pink`, `t-orange`, `t-red`, `t-indigo`, `t-grey`). Give each object type one tone and keep it for the whole deck. Names that rendered in past decks: `Globe`, `Code`, `Database`, `Clock`, `Warning`.
- Use `pill` (green, confirmed), `pill amber` (unverified) and `pill red` (known problem) for status badges.

## Cover

```html
<section id="cover" class="hero">
<p class="eyebrow">Admin › Settings › Tags</p>
<h1>How the Tags screen works</h1>
<p class="lede">The Tags screen manages short pick lists that each library defines. Other screens use these lists to fill their dropdowns.</p>
<p class="meta">For staff, support and developers · Based on a code review of the admin app and the API on 10 November 2026</p>
</section>
```

## Short version

```html
<section id="key-points">
<div class="head">
<p class="eyebrow">The short version</p>
<h2>What do you need to know first?</h2>
</div>
<div class="points">
<div class="pt in" style="--i:1"><p class="n">1</p><p class="t">Each row on the screen is a <b>tag group</b>. A group holds the <b>tags</b> people pick from.</p></div>
<div class="pt in" style="--i:2"><p class="n">2</p><p class="t">A group's key, such as <span class="code">shelfLocation</span>, decides which screen uses it.</p></div>
<div class="pt in" style="--i:3"><p class="n">3</p><p class="t">You can't change a key after you create the group.</p></div>
</div>
</section>
```

## Card grid

Use `grid2` for two or four cards and `grid3` for three or six. Add `featured` to at most one card per slide.

```html
<section id="every-request">
<div class="head">
<p class="eyebrow">Every request</p>
<h2>What happens on every request?</h2>
</div>
<div class="grid2">
<div class="card in" style="--i:1">
<div class="tile t-blue"><x-icon name="Globe"></x-icon></div>
<h3>Library from the host</h3>
<p class="text">The API picks the library from the request host. The token holds only <span class="code">user_id</span>.</p>
</div>
<div class="card in" style="--i:2">
<div class="tile t-green"><x-icon name="Database"></x-icon></div>
<h3>Automatic library filter</h3>
<p class="text">Library-owned models add <span class="code">where(library_id: …)</span> to every query.</p>
</div>
</div>
</section>
```

## Steps

```html
<section id="after">
<div class="head">
<p class="eyebrow">After a loan</p>
<h2>What happens after a member borrows a book?</h2>
</div>
<div class="main">
<div class="steps">
<div class="step in" style="--i:1"><p class="n">01</p><p class="t">The member checks out a book</p><p class="d">The loan is marked <span class="code">on_loan</span>.</p></div>
<div class="step in" style="--i:2"><p class="n">02</p><p class="t">The system sets a due date</p><p class="d">Reminders use this date.</p></div>
<div class="step in" style="--i:3"><p class="n">03</p><p class="t">A daily job sends reminders</p><p class="d">It runs at 08:00 server time and emails members whose loans are due tomorrow.</p></div>
</div>
</div>
</section>
```

## Trail

A request followed through the places it runs. The left column says what happens and what to watch for; the right column lists the steps, each with a dot in its lane. Define the lanes once on a "How to read a trail" slide, and keep the same lane colors and offsets on every trail slide: lane 1 `d-blue l0`, lane 2 `d-violet l1`, lane 3 `d-orange l2`, lane 4 `d-green l3`, lane 5 `d-pink l4`. Keep a trail to 14 steps or fewer per slide.

```html
<section id="t-discovery">
<div class="split">
<div class="split-l">
<p class="eyebrow">Admin app · Startup and sign-in</p>
<h2>How does the admin app find its library and log in?</h2>
<p class="text">The app first asks a shared lookup host which API host serves its URL. Then it logs in and stores the token in a cookie.</p>
<div class="callout">
<p class="label">Watch for</p>
<p class="text">The lookup answer is cached for a day, so a moved library can point at its old host until the cache clears.</p>
</div>
</div>
<div class="split-r">
<div class="legend"><div class="lg"><div class="dot d-blue"></div><p class="meta">App</p></div><div class="lg"><div class="dot d-orange"></div><p class="meta">API</p></div><div class="lg"><div class="dot d-green"></div><p class="meta">Data and jobs</p></div></div>
<div class="trail">
<div class="tstep"><p class="n">01</p><div class="track"><div class="dot d-blue l0"></div></div><p class="t">Ask which API host to use</p></div>
<div class="tstep"><p class="n">02</p><div class="track"><div class="dot d-orange l2"></div></div><p class="t">Lookup route</p></div>
<div class="tstep"><p class="n">03</p><div class="track"><div class="dot d-green l3"></div></div><p class="t">Library filter on every query</p></div>
</div>
</div>
</div>
</section>
```

## Flow

Up to four boxes in a row. Mark the box the slide is about with `key`. Put supporting facts underneath in `.facts`.

```html
<section id="storage">
<div class="head">
<p class="eyebrow">How it's stored</p>
<h2>How is the data stored?</h2>
</div>
<div class="main">
<div class="flow in" style="--i:1">
<div class="box"><h3>Library</h3><p class="text">One library. Owns many groups.</p></div>
<x-connector class="arrow" head="end"></x-connector>
<div class="box"><h3>Tag group</h3><p class="text"><span class="code">tag_groups</span>. One key per group.</p></div>
<x-connector class="arrow" head="end"></x-connector>
<div class="box key"><h3>Tag</h3><p class="text"><span class="code">tags</span>. One choice in a group.</p></div>
</div>
<div class="facts in" style="--i:2">
<div class="fact"><h3>Library on every row</h3><p class="text">Each row carries <span class="code">library_id</span>.</p></div>
<div class="fact"><h3>Soft delete</h3><p class="text">Deleting sets <span class="code">deleted_at</span>. The row stays but is hidden.</p></div>
<div class="fact"><h3>UUID keys</h3><p class="text">All three tables use UUIDs as IDs.</p></div>
</div>
</div>
</section>
```

## Table

Set column widths on the header cells. Keep it to about eight rows at 26px, or ten with `tbl dense`; page longer lists across slides.

```html
<section id="trails">
<div class="head">
<p class="eyebrow">The trails</p>
<h2>Which requests does this deck follow?</h2>
</div>
<table class="tbl">
<tr class="th"><th style="width:26%">App</th><th style="width:44%">Trail</th><th style="width:30%">Kind</th></tr>
<tr><td class="k">Admin app</td><td>Staff edit a member profile</td><td>REST write</td></tr>
<tr><td class="k">Member app</td><td>Pay a late fee</td><td>GraphQL payment</td></tr>
</table>
</section>
```

## Statement: rule

One or two per deck. No heading question here: the statement is the point.

```html
<section id="rule" class="statement">
<p class="eyebrow in">How the system picks the current term</p>
<p class="big in" style="--i:1">The current term owns the earliest term day that is today or later.</p>
<p class="after in" style="--i:2">Nobody sets it by hand. Between terms, the current term is the next one.</p>
</section>
```

## Statement: numbers

```html
<section id="key-count" class="statement" style="justify-content:space-between">
<div class="head">
<p class="eyebrow">Keys</p>
<h2>How many of the 28 keys are in use?</h2>
</div>
<div class="stats">
<div class="stat in" style="--i:1"><p class="num">21</p><p class="lab">keys feed at least one screen</p></div>
<div class="stat in" style="--i:2"><p class="num">6</p><p class="lab">keys feed nothing</p></div>
<div class="stat in" style="--i:3"><p class="num">1</p><p class="lab">key exists only in the API</p></div>
</div>
</section>
```

## Watch for

Six cards at most. Each title states the trap; the text says what happens and what to do.

```html
<section id="watch">
<div class="head">
<p class="eyebrow">Risks</p>
<h2>What should you watch for?</h2>
</div>
<div class="grid3">
<div class="card tight in" style="--i:1"><h3>Never reorder keys</h3><p class="text">Groups store the key as a number. Add new keys at the end.</p></div>
<div class="card tight in" style="--i:2"><h3>Search lags the database</h3><p class="text">Indexing runs in background jobs, so a new tag can take a few seconds to appear.</p></div>
<div class="card tight in" style="--i:3"><h3>Deletes leave dead links</h3><p class="text">Records keep a deleted tag's ID, so the link returns nothing.</p></div>
</div>
</section>
```

## Findings

Two slides: confirmed, then unverified. Name the file and line in confirmed rows. In unverified rows, say what would settle it.

```html
<section id="found-confirmed">
<div class="head">
<p class="eyebrow">Found along the way · confirmed in the code</p>
<h2>What problems did the review confirm?</h2>
</div>
<table class="tbl dense">
<tr class="th"><th style="width:26%">Area</th><th style="width:74%">What the code does</th></tr>
<tr><td class="k">Tag export</td><td><span class="code">tags/export.rb:42</span> skips soft-deleted groups but still exports their tags.</td></tr>
</table>
</section>
```

## Next steps

```html
<section id="next">
<div class="head">
<p class="eyebrow">Next steps</p>
<h2>What should you do next?</h2>
</div>
<div class="main">
<div class="points">
<div class="pt in" style="--i:1"><p class="n">1</p><p class="t"><b>Add next term's days before this term ends.</b> Otherwise there is no current term.</p></div>
<div class="pt in" style="--i:2"><p class="n">2</p><p class="t"><b>Check one thing in a browser.</b> Do custom roles ever see the Delete button?</p></div>
</div>
</div>
</section>
```

## Limits and sources

Always the last slide. Say plainly what was and wasn't run, and list the files or pages read.

```html
<section id="limits" class="hero" style="justify-content:space-between">
<div class="head">
<p class="eyebrow">Limits and sources</p>
<h2>What did this review not check?</h2>
</div>
<ul class="list">
<li>No one ran the app, the tests or any database queries, so behavior on a live library is unverified.</li>
<li>The mobile app wasn't searched for uses of the keys.</li>
</ul>
<div class="grid2">
<div><p class="meta">Admin app</p><p class="mono">src/routes/Settings/Tags/</p></div>
<div><p class="meta">API</p><p class="mono">app/models/tag_group.rb<br>app/models/tag.rb</p></div>
</div>
</section>
```
