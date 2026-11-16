# Skills

Claude Code skills I use day to day. Each folder under `skills/` is one skill.

| Skill | What it does |
|---|---|
| [`build-board`](skills/build-board/SKILL.md) | Turn a development plan into a live, shared build board on claude.ai. |
| [`explain-with-slides`](skills/explain-with-slides/SKILL.md) | Build a claude.ai slide deck that explains a topic in plain language. |
| [`explainer-video`](skills/explainer-video/SKILL.md) | Turn an explanatory document into a silent, animated explainer video (MP4). |
| [`go-crazy`](skills/go-crazy/SKILL.md) | Work one person's tasks on a build board with parallel subagents, rechecking on a timer. |
| [`iso-plain-language`](skills/iso-plain-language/SKILL.md) | Write human-facing text in plain language that follows ISO 24495-1:2023. |
| [`project-update`](skills/project-update/SKILL.md) | Post a short status paragraph about a project on a repeating timer. |
| [`update-skills-repo`](skills/update-skills-repo/SKILL.md) | Publish your own skills to a public GitHub skills repo, with proprietary information removed and this README kept current. |

## Install

Install into `~/.claude/skills/`. Some skills refer to each other by that path (for example, `go-crazy` reads `~/.claude/skills/build-board/`).

With the [skills CLI](https://github.com/vercel-labs/skills), which lets you pick skills and install them globally:

```sh
npx skills add McCambleyES/skills
```

Or clone and link them by hand:

```sh
git clone https://github.com/McCambleyES/skills.git ~/src/skills
for s in ~/src/skills/skills/*/; do ln -s "$s" ~/.claude/skills/; done
```

Run `git pull` in the clone to update.

## Before you use them

- **claude.ai account.** `build-board`, `go-crazy`, `project-update` and `explain-with-slides` create or read claude.ai artifacts, so Claude Code must be signed in with a claude.ai account that has artifacts enabled.
- **Shared design artifacts.** `explain-with-slides` builds on two claude.ai artifacts: a Slides type and the Vector design system. Ask me for access if a publish is refused. `build-board` and `explainer-video` carry their own copy of Vector and don't need access.
- **`explainer-video` setup.** Needs Node and Chrome. Run `bash ~/.claude/skills/explainer-video/scripts/setup.sh` once.
- **Build boards.** Each person whose agent writes to a board needs Contributor or Editor access to that board's artifact.
- **`go-crazy` and `project-update`** run only when you type `/go-crazy` or `/project-update`. Claude won't start them on its own.
- **`iso-plain-language` is used by other skills.** `explain-with-slides`, `explainer-video`, `project-update` and `update-skills-repo` load it, so install it with them.
- **`update-skills-repo` publishes to your own account.** It needs the `gh` CLI signed in and Python 3. It keeps its clone at `~/dev/skills` and pushes to `github.com/<your account>/skills`, creating that public repo on the first run. It never publishes skills you installed from other people's repos.
