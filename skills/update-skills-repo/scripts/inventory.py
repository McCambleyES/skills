#!/usr/bin/env python3
"""Compare local skills with the published skills repo.

Usage: inventory.py [REPO_DIR]   (default ~/dev/skills)

Prints one line per skill: STATUS  NAME  [detail]
  new          own skill, not in the repo yet
  changed      own skill, differs from the repo copy (files listed)
  same         own skill, matches the repo copy
  gone         in the repo, no longer in ~/.claude/skills
  third-party  installed by the skills CLI (~/.agents/.skill-lock.json); never publish
  synced       claude.ai synced skills folder; never publish
  skip         no SKILL.md, or a .private file marks it private; never publish
"""
import filecmp
import json
import os
import sys

HOME = os.path.expanduser("~")
LOCAL = os.path.join(HOME, ".claude", "skills")
REPO = os.path.expanduser(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(HOME, "dev", "skills")
PUBLISHED = os.path.join(REPO, "skills")
LOCK = os.path.join(HOME, ".agents", ".skill-lock.json")
IGNORE = {"node_modules", ".DS_Store", "__pycache__", ".git"}


def files(root):
    out = set()
    for d, dirs, fs in os.walk(root):
        dirs[:] = [x for x in dirs if x not in IGNORE]
        for f in fs:
            if f not in IGNORE and not f.endswith(".pyc"):
                out.add(os.path.relpath(os.path.join(d, f), root))
    return out


def diff(a, b):
    fa, fb = files(a), files(b)
    changed = [f"+{f}" for f in sorted(fa - fb)] + [f"-{f}" for f in sorted(fb - fa)]
    changed += [f"~{f}" for f in sorted(fa & fb)
                if not filecmp.cmp(os.path.join(a, f), os.path.join(b, f), shallow=False)]
    return changed


locked = {}
if os.path.exists(LOCK):
    locked = {k: v.get("source", "?") for k, v in json.load(open(LOCK)).get("skills", {}).items()}

local = sorted(d for d in os.listdir(LOCAL) if os.path.isdir(os.path.join(LOCAL, d)))
published = sorted(os.listdir(PUBLISHED)) if os.path.isdir(PUBLISHED) else []

for name in local:
    path = os.path.join(LOCAL, name)
    if name == "synced":
        print(f"synced       {name}")
    elif name in locked:
        print(f"third-party  {name}  from {locked[name]}")
    elif not os.path.exists(os.path.join(path, "SKILL.md")):
        print(f"skip         {name}  no SKILL.md")
    elif os.path.exists(os.path.join(path, ".private")):
        print(f"skip         {name}  private (.private file)")
    elif name not in published:
        print(f"new          {name}")
    else:
        d = diff(path, os.path.join(PUBLISHED, name))
        print(f"changed      {name}  {' '.join(d)}" if d else f"same         {name}")

for name in published:
    if name not in local:
        print(f"gone         {name}")
