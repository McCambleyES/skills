---
name: go-crazy
description: Work through one assignee's tasks on a project task board by fanning out parallel subagents on every ready task, and set a timer to recheck when nothing is ready.
argument-hint: <board> <max-agents> <recheck-interval> <assignee>
disable-model-invocation: true
---

# Go crazy

You are the **orchestrator**. You never do task work yourself. You read the board, **dispatch** one background subagent per **ready** task, keep up to `max-agents` running, and when nothing is ready and nothing is running you are **stuck**: set a timer and **recheck** later. Every subagent works only on the assignee's items and follows the board's own agent protocol.

Arguments: `$ARGUMENTS`

## 1. Parse the arguments

Positional, in this order. Accept `name=value` forms too.

| # | Name | Meaning | If missing |
|---|---|---|---|
| 1 | `board` | The task board: a URL, key or query that identifies it | Ask |
| 2 | `max-agents` | Most subagents running at once (integer ≥ 1) | 3 |
| 3 | `recheck-interval` | Wait between rechecks while stuck: `15m`, `1h`, or bare minutes | 30m (reject under 5m) |
| 4 | `assignee` | The person whose items to work. May be several words, so it takes the rest of the line | Ask |

Ask for every missing required value in one AskUserQuestion call.

## 2. Load the board adapter

The skill works with any board through an **adapter** in `boards/`. Each adapter says how to detect its board, where its agent protocol lives, and how to resolve the assignee, list tasks, decide readiness, claim and log.

| Board | Adapter |
|---|---|
| claude.ai build board (`claude.ai/artifact/...` page with a "For agents" section, made by the build-board skill) | [`boards/build-board.md`](boards/build-board.md) |

Read the matching adapter in full now. If no adapter matches (for example a Jira board or JQL), stop and tell the user which board type is unsupported. A new adapter goes in `boards/<type>.md` and must answer every heading in [`boards/ADAPTER.md`](boards/ADAPTER.md). Never improvise board writes without one.

## 3. Read the board and resolve the assignee

Follow the adapter: read the board's agent protocol, its rules, and every task. Resolve `assignee` to the board's identity for that person. If it matches no one, or more than one, stop and ask.

Then show the user, in a few lines:

- the assignee and their board identity
- counts of the assignee's tasks by state: ready, running elsewhere, waiting on others, needs a human, done
- which ready tasks you will dispatch first, and `max-agents`

Proceed without waiting for approval: invoking this skill is the approval to fan out.

## 4. The loop

Repeat until the assignee has no unfinished tasks, or the user stops you:

1. **Re-read** the assignee's tasks through the adapter. Never act on a stale read.
2. **Classify** each unfinished task. The adapter defines each state:
   - **ready**: dispatchable now
   - **running**: one of your subagents has it
   - **elsewhere**: claimed or in progress outside this session; leave it alone
   - **waiting**: blocked by work other people or processes will finish (deps, open review)
   - **needs a human**: decisions, access grants, outside `needs`, blocked tasks. Never dispatch these. Report each one to the user once, with what it needs.
3. **Dispatch** ready tasks while fewer than `max-agents` are running, in the order the adapter gives. For each: **claim** it through the adapter first, then launch the subagent with the brief below. If the claim is refused because someone else took it, skip it.
4. **Wait**:
   - Subagents running: end your turn. Each completion re-invokes you. Never poll, and never predict a pending agent's result.
   - Nothing running and nothing ready: you are **stuck**. Go to step 5.
5. **Stuck.** If every unfinished task is **needs a human**, or waits only on the assignee's own blocked tasks, nothing will change on its own: stop and report. Otherwise set a one-shot timer with CronCreate (`recurring: false`) at now + `recheck-interval`, pinned to that minute, with the prompt:

   > go-crazy recheck: board `<board>`, assignee `<assignee>`, max-agents `<n>`, recheck-interval `<interval>`. Re-read the board and continue the go-crazy loop.

   Tell the user the timer's actual fire time from the CronCreate result, then end your turn. Timers fire only while this session is idle and open. Keep at most one recheck timer alive: CronDelete any older one before creating a new one.

After every 3 consecutive rechecks with no state change, double the interval (cap 4h) and say so.

### When a subagent finishes

Re-read its task through the adapter. Its own report is a claim; the board record is the evidence. Then tell the user in one or two lines: task ID, new state, PR link if any, and anything left pending manual verification. If the subagent stopped without updating the board, mark the task blocked through the adapter with the subagent's reason and report it as **needs a human**. Then continue the loop at step 1.

## 5. Subagent brief

Launch with the Agent tool, `subagent_type: "general-purpose"`, `run_in_background: true`, description `<task ID>: <short title>`. Send all of one round's dispatches in a single message so they start together. Fill in the brief:

```
You are one of several parallel agents working the task board <board> for <assignee>
(board identity: <assignee-id>). Every item you touch is <assignee>'s. Act on their
behalf, and use <assignee-id> wherever the board asks who you are.

Your task is <task ID>: <title>. It is already claimed for <assignee-id>; do not pick,
claim or touch any other task.

1. Read the board's agent protocol: <protocol location from the adapter>. Follow it
   exactly from the step after claiming. The board's project rules override it where
   they conflict. <Adapter-specific protocol notes>.
2. Read the full task record before starting, including its spec, out-of-scope items
   and definition of done.
3. Nobody is watching this session to approve a plan. Where the protocol says to show
   your plan to your person, record the plan on the task (see the protocol) and proceed.
4. Other agents are working in the same repos right now. Do all git work in your own
   worktree: `git -C <repo> worktree add ../<repo>-<task ID> -b <branch> <base>`.
   Leave the main checkout and every other branch untouched. Remove your worktree
   when your PR is open or the task is abandoned.
5. Read the target repo's CLAUDE.md and AGENTS.md before changing it. The workspace's
   hard rules apply to you in full.
6. If you are blocked, follow the protocol's blocked step and stop. A question for
   <assignee> is a blocker: write it down and stop, rather than guessing.
7. Finish with a report: final task state, PR link, the exact commands you ran and
   their results, and what still needs manual verification.
```

## 6. Finish

When the loop ends, CronDelete any recheck timer, then give the user:

- each task touched: ID, final state, PR link
- every task that **needs a human**, and what it needs
- what was verified and what is pending manual verification, as the subagents reported it
