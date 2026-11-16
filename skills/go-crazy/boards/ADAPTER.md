# Writing a board adapter

An adapter teaches the go-crazy orchestrator one kind of task board. It lives at `boards/<type>.md` and gets a row in the adapter table in `SKILL.md`. It answers each heading below, concretely enough that the orchestrator never guesses a board write. Use [`build-board.md`](build-board.md) as the worked example.

## Detect

Which `board` arguments this adapter handles (URL shape, key format, query syntax), and the first read that confirms it.

## Tools

The tools and connectors used for reads and writes, and how to load them if they are deferred.

## Agent protocol

Where the board's own instructions for agents live, and how a subagent reads them. If the board has none (a plain Jira project, say), the adapter supplies the protocol itself: how to claim, report progress, record verification, open a PR, finish and block.

## Assignee

How to map the `assignee` argument to the board's identity (person id, account ID), and which tasks count as theirs.

## Read tasks

How to fetch every task of the assignee's, with the fields needed to classify it. Include pagination.

## States

A rule for each orchestrator state, written against the board's own fields: **done**, **ready**, **elsewhere**, **waiting**, **needs a human**. Every unfinished task must land in exactly one. Say how to tell "waits on the assignee's own blocked task" (a dead end) from "waits on someone else" (worth a recheck), and the order to dispatch ready tasks in.

## Claim

The write that claims a task for the assignee, and how it refuses a lost race (a version check, a status transition that fails if someone moved it). Plus any log or comment the board expects.

## Block

How the orchestrator marks a task blocked when a subagent stopped without updating it.

## Brief notes

Lines to substitute into the subagent brief: the protocol location, the identity to use, and any board-specific write rules.
