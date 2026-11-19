---
name: update-skills-repo
description: Publish the user's own skills from ~/.claude/skills to their public GitHub skills repo, scrubbed of proprietary information, with the README's directions kept current. Use when the user wants to publish, share, sync or push their skills or a skill update.
argument-hint: "[skill names to limit the run to]"
---

# Update skills repo

Copy the user's own skills into their public skills repo, scrub anything **proprietary**, refresh the README, and push. The repo is public: whatever lands in a commit stays readable in history even after a later fix, so the scrub happens before the commit, never after.

| What | Value |
|---|---|
| Source of truth | `~/.claude/skills/<name>/`. Scrub edits go here first, then get copied, so the next run can't bring proprietary text back. |
| Local clone | `~/dev/skills`, skills under `skills/<name>/` |
| Remote | `github.com/<gh account>/skills`, default branch `main` |
| Scripts | `SKILL_DIR/scripts/inventory.py`, `SKILL_DIR/scripts/scan.py` (`SKILL_DIR` is this file's folder) |

`$ARGUMENTS`, when given, limits the run to those skill names.

## 1. Sync the clone

Run `gh api user --jq .login` for the account. Then:

- **Clone exists:** `git -C ~/dev/skills pull --ff-only`. If the tree is dirty or the pull fails, stop and show the user `git status`.
- **No clone, repo exists on GitHub:** clone it to `~/dev/skills`.
- **No repo:** this is a first publish. Create it at the end with `gh repo create <account>/skills --public --description "Claude Code skills" --source ~/dev/skills --remote origin --push`, after `git init -b main` and a `.gitignore` holding `node_modules/` and `.DS_Store`.

Done when the clone matches `origin/main`.

## 2. Take inventory

```sh
python3 SKILL_DIR/scripts/inventory.py ~/dev/skills
```

It labels each skill `new`, `changed`, `same`, `gone`, `third-party`, `synced` or `skip`.

- **third-party** (installed from someone else's repo, per `~/.agents/.skill-lock.json`), **synced** (Anthropic's skills from claude.ai) and **skip** (no `SKILL.md`, or a `.private` file in the folder) are never published. If the user asks for one, point them to its source repo for the README instead.
- **new** and **gone** need the user's say. Ask in one AskUserQuestion call: which new skills to publish, and whether each gone skill should be removed from the repo. A skill that exists only to work on the user's company code (its steps name their repos or services) gets its own option: publish scrubbed, or keep private.
- **changed** skills are published without asking: the user published them before.

Done when every skill in scope has a decision: publish, remove or leave out.

## 3. Scrub proprietary information

For each skill to publish, read every text file in full for a new skill, and every changed file for a changed one (`diff -ru ~/dev/skills/skills/<name> ~/.claude/skills/<name> -x node_modules`). Then run the scan as a second net:

```sh
python3 SKILL_DIR/scripts/scan.py ~/.claude/skills/<name> [...]
```

The scan builds its terms from this machine (work email domain, GitHub orgs, repo names in `~/dev`). A hit is a lead; your read is the check.

**Proprietary** means anything that tells an outsider about the user's employer or colleagues that the employer hasn't published:

- company, product, repo, service, tenant or customer names
- internal code paths, class names, endpoints, hostnames and architecture
- security findings of any kind, above all unfixed ones
- business rules, pricing and schedules from internal code
- colleagues' names, emails and handles. The user's own first name is fine.
- ticket keys and links to internal Jira, Confluence or Slack
- secrets, tokens and keys. If one turns up, stop and tell the user: it needs rotating, not just deleting.

**Rewrite, don't delete.** Most hits are example content. Replace them with a made-up example that keeps the same markup, structure and teaching point. Use one consistent fictional domain per file (for example a library app with members, loans and tags). Edit the file in `~/.claude/skills/<name>/`, then check it with the scan again.

**Keep** what the skill needs to work and reveals nothing: links to the user's own claude.ai artifacts that a skill reads (they are private by default, so list them in the README's prerequisites instead), clearly fictional examples (`PR-104`, `AbC123`), and `~/.claude/skills/...` paths. When unsure whether something is proprietary, ask.

Done when the scan's remaining hits are all ones you chose to keep, and you can say why for each.

## 4. Copy into the clone

```sh
rsync -a --delete --exclude node_modules --exclude .DS_Store --exclude __pycache__ ~/.claude/skills/<name>/ ~/dev/skills/skills/<name>/
```

For a removed skill, `git -C ~/dev/skills rm -r skills/<name>`. Then rerun `inventory.py`: every published skill should read `same`.

## 5. Update the README

`~/dev/skills/README.md` is what colleagues read to install and use the skills. Bring it in line with what's in `skills/` now:

- **Skill table:** one row per folder in `skills/`, linking its `SKILL.md`, with a one-line summary taken from its `description`. No rows for missing folders.
- **Install:** the `npx skills add <account>/skills` command and the clone-and-link steps, with the real account name. Keep the note that skills install to `~/.claude/skills/`, since some refer to each other by that path.
- **Before you use them:** one bullet per real prerequisite, found by reading the skills: claude.ai artifacts a skill reads (and who to ask for access), setup scripts, tools like Node or Chrome, other skills it calls, and skills that run only when typed (`disable-model-invocation: true`).

Write it in plain language: load `iso-plain-language` first. Done when every skill and every prerequisite you found appears once, and nothing in the README describes a skill that's gone.

## 6. Check, commit and push

1. Run `scan.py ~/dev/skills` over the whole clone, README included. Every hit must be a keeper from step 3.
2. `git -C ~/dev/skills status --short`: no `node_modules`, build output or files outside `skills/`, `README.md` and `.gitignore`.
3. Commit with a subject naming what changed, such as `Add wizard; update build-board and README`, and a body listing each skill added, updated or removed, plus "Scrubbed example content in <file>" for each scrub.
4. `git push`. If GitHub rejects the push over email privacy, tell the user; don't change their git config.
5. Confirm with `gh api repos/<account>/skills/contents/skills --jq '.[].name'` that the published folders match the plan.

## 7. Report

Tell the user:

- the repo URL and the commit
- skills added, updated and removed
- each scrub: file, what it was, what replaced it, and that the local copy in `~/.claude/skills` changed too
- scan hits you kept, and why
- what wasn't checked, such as installing from the repo on a clean machine
