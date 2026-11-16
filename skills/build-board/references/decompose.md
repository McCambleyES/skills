# Turning a plan into tasks

The board is only as good as its task specs. An agent that picks up a task has the spec, the plan, and the repo. It has none of the conversation where the plan was written. So write every spec for a capable engineer who joins the project today and must finish the task without asking anyone.

## Order of work

1. **Read the whole plan** before writing any task. List its deliverables, decisions, risks, known issues and anything it calls out as "first" or "before".
2. **Find the decisions.** Any open question that blocks building becomes a decision task (`<prefix>-D1`…) in phase `D`, with `needs: "Decision: …"`. Its `spec.what` lists the options and the facts needed to choose. Its `dod` is "Outcome recorded in `decision`". Make the tasks it gates depend on it.
3. **Choose phases** from the plan's own stages. Each phase needs a `done_when` you could demonstrate in a few minutes, for example "`./tool run --dry-run` exits 0 and its output passes the schema", not "tools done". Put the plan's known-issue fixes in their own phase if they can run in parallel.
4. **Cut tasks.** One task is one PR, or one settings change, or one decision, taking 0.25 to 3 days. Split anything bigger. Merge anything so small it would only produce noise on the board.
5. **Wire dependencies.** Only add a dependency when the task truly can't start before the other is done. Leave out edges that are already implied by a chain (if B depends on A and C depends on B, C doesn't need A). Too many edges hide the critical path.
6. **Assign lanes** by ownership and skill, from what the plan or the user says. Put joint work (decisions, first end-to-end run, triage, go-live) in the shared lane.
7. **Schedule.** Walk the graph in dependency order and give each lane a sequence, skipping weekends and holidays. A task starts on or after its latest dependency's end. These are proposed dates, and agents replan as they go.
8. **Set milestones** at the points the plan cares about. Each milestone's gate is the single task whose completion proves it.
9. **Capture cross-cutting rules** in `meta/rules`: merge policy, branch and commit format, environments that are off-limits, secrets handling, and temporary exceptions with a "revisit" note. Don't repeat them in every task.

## What a good spec looks like

Compare these two specs for the same task.

Weak:

- what: "Set up the GitHub App."
- dod: "App works."

Strong:

- what: "Create a private GitHub App owned by the org, with webhooks off." · "Permissions: Contents read and write, Administration read, Metadata read." · "Install it on exactly two repos: `app-repo` and `audit-repo`." · "Hand the App ID and private key to `X-007` through the password manager."
- not: "Adding secrets to the repo (`X-007`)." · "Branch rulesets (`X-003`)."
- dod: "Installed on exactly two repos." · "A token minted with `permission-contents: read` can clone `app-repo` and cannot push (tested once)." · "The key was never pasted into chat, issues or the board."
- brief: why one App with narrowly scoped tokens instead of two Apps, which action version supports the needed inputs, and the fallback if it doesn't.

What makes the strong version work:

- **`what`** gives concrete steps with names, versions and limits.
- **`not`** stops the agent from doing a neighbour's work, and points to who does it.
- **`dod`** describes checks that someone else can repeat, including negative checks ("cannot push").
- **`brief`** carries the reasoning, so the agent can adapt when reality differs from the plan without breaking the design.

## Consistency pass (do this before showing the user)

Run `scripts/check_board.py` first; it catches structural errors. Then check the things a script can't:

- **`what` matches `dod`.** Every count, name and limit in `what` appears the same way in `dod`. On the first board, a spec said "two repos" in `what` but "three repos" in `dod`.
- **Every `not` item is owned.** Each item names a task, and that task's `what` actually covers it. Otherwise it's a gap.
- **Plan coverage.** Each deliverable, decision and known issue in the plan maps to at least one task. Build a short "plan section → task IDs" list. Anything unmapped is either missing or deliberately out of scope, so say which.
- **Decision gates are honoured.** No task assumes an outcome of an open decision it doesn't depend on.
- **Outside needs are visible.** Tasks that need someone outside the lanes, such as an org owner, a vendor or an admin, have `needs` set, and are scheduled early or flagged as a risk.
- **Safety.** No spec asks an agent to break the workspace's hard rules (for example, live environments or running migrations). If the plan needs that, the task is a hand-off to a person, and the spec says so.
