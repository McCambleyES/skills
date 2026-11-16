# Adapter: claude.ai build board

Boards made by the build-board skill: a claude.ai artifact page backed by a shared database with `meta/plan`, `meta/rules`, `tasks/*` and `log/*`. The page's "For agents" section is the protocol every agent follows. The data shapes are in `~/.claude/skills/build-board/references/schema.md`; read it if a field below is unclear.

## Detect

`board` is a `https://claude.ai/artifact/<id>` URL. Read it with the Artifact tool (`action: "read"`). It is a build board if the page has a "For agents" section and ArtifactData `get` of `meta/plan` returns a plan with `people` and `lanes`. Strip any `?sk=` key from the URL before putting it in a brief or a log.

## Tools

ArtifactData for every read and write, with the board URL as `url`. It is deferred: load it with ToolSearch `select:ArtifactData`. Subagents must load it the same way.

## Agent protocol

The "For agents" section of the board page, plus `meta/rules`, which overrides it. Read both yourself before dispatching, so you can tell when a subagent strays.

## Assignee

Match the `assignee` argument case-insensitively against `meta/plan.people`, by `id` then `label`. Their tasks are those whose `lane` is their id, plus any task whose `owner` is their id. Tasks in a lane marked `"shared": true` are not theirs unless already owned by them. The board's protocol allows other-lane work only when the person says so, so list ready shared-lane tasks to the user and dispatch one only if they say yes.

## Read tasks

`list` the `tasks` collection with a limit of 1000, following any continuation the result gives. Keep each task's version for the claim. You need `id`, `title`, `short`, `lane`, `owner`, `status`, `deps`, `needs`, `start`, `phase`, `blocked_reason`, `prs`.

## States

`status` is one of `todo`, `in_progress`, `review`, `blocked`, `done`.

- **done**: `status` is `done`.
- **ready**: `status` is `todo`, every `deps` entry is `done`, and `needs` is empty. A `todo` task whose deps are done but which has a `needs` is **needs a human** until the user confirms the need is met; after that, treat it as ready for the rest of the session.
- **running**: claimed by one of this session's subagents.
- **elsewhere**: `status` is `in_progress` and no subagent of this session has it.
- **waiting**: `status` is `review` (an open PR waiting on review or merge), or `status` is `todo` with a dep that is not done and not dead (below).
- **needs a human**: `status` is `blocked`; or a decision task (`needs` starts with "Decision", or the ID is `<prefix>-D<n>`); or an unconfirmed `needs` as above.

A dep is **dead** when it, or a dep it waits on, is a **needs a human** task in the assignee's lane: only the assignee can move it. A task waiting only on dead deps counts as **needs a human** for the stuck check. Deps in other lanes, or in `review`, are live: other people's agents may finish them.

Order ready tasks by `start`, then by `id`.

## Claim

1. `get` `tasks/<ID>` and check it is still `todo` and unowned. Keep its version.
2. `update` it with `if_version` and `data`: `status: "in_progress"`, `owner: <assignee-id>`, `started_at` and `updated_at` set to now (ISO 8601 UTC), and `branch` if the task changes code, named the way `meta/rules` and the page's branch example say. If the write is refused, re-read; if someone else claimed it, skip it.
3. `set` a log document with id `<YYYYMMDDTHHMMSSZ>-<ID>-<assignee-id>` and data `{ts, task: <ID>, lane: <assignee-id>, kind: "claim", text: "Claimed for a parallel go-crazy agent."}`.

Always `update` a task, never `set` it: `set` replaces the record and erases the spec.

## Block

`get` the task, then `update` with `if_version`: `status: "blocked"`, `blocked_reason: <the subagent's reason>`, `updated_at`. Log `kind: "blocked"` with the same reason.

## Brief notes

- Protocol location: `the "For agents" section of <board URL> (read it with the Artifact tool), plus meta/rules in its database`.
- Protocol notes: `Read and write the board with ArtifactData (load it with ToolSearch "select:ArtifactData") using url <board URL>. Your person id is <assignee-id>. Start at the "Do the work" step. Record your plan in impl.summary and log it with kind "progress" before you change code. Always update tasks with if_version; never set a task, and never change id, deps, spec or lane.`
