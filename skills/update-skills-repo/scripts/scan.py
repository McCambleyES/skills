#!/usr/bin/env python3
"""First-pass scan for proprietary content. A hit is a lead to read, not a verdict.

Usage: scan.py DIR [DIR ...]

Terms come from this machine, so the script itself names no company:
  - the domain of `git config user.email` (and its first label)
  - the GitHub orgs of the gh account
  - the folder names in ~/dev (the work repos)
Patterns: emails, claude.ai artifact links, Jira-style keys, absolute home paths,
private IPs and internal hosts, and strings shaped like secrets.
"""
import os
import re
import subprocess
import sys

IGNORE_DIRS = {"node_modules", ".git", "__pycache__"}
BINARY = (".woff2", ".woff", ".ttf", ".png", ".jpg", ".jpeg", ".gif", ".mp4", ".zip", ".pyc")


def run(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=20).stdout.strip()
    except Exception:
        return ""


terms = set()
email = run(["git", "config", "user.email"])
if "@" in email:
    domain = email.split("@", 1)[1]
    terms |= {domain, domain.split(".")[0]}
terms |= {o for o in run(["gh", "api", "user/orgs", "--jq", ".[].login"]).split() if o}
dev = os.path.expanduser("~/dev")
if os.path.isdir(dev):
    terms |= {d for d in os.listdir(dev) if os.path.isdir(os.path.join(dev, d))
              and not d.startswith(".") and d != "skills"}
terms = {t for t in terms if len(t) >= 3}

patterns = [
    ("term", re.compile("|".join(re.escape(t) for t in sorted(terms, key=len, reverse=True)), re.I)),
    ("email", re.compile(r"[\w.%+-]+@[\w-]+\.[\w.]+")),
    ("artifact", re.compile(r"claude\.ai/(?:code/)?artifact/[A-Za-z0-9-]{6,}")),
    ("ticket", re.compile(r"\b[A-Z][A-Z0-9]{1,9}-\d{2,}\b")),
    ("home-path", re.compile(r"/(?:Users|home)/[a-z][\w.-]+")),
    ("host", re.compile(r"\b(?:10\.\d+|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d+\.\d+\b|\b[\w-]+\.(?:internal|corp|local)\b")),
    ("secret", re.compile(r"\b(?:gh[pousr]_\w{20,}|sk-[\w-]{20,}|AKIA[0-9A-Z]{16}|xox[abp]-[\w-]{10,})|-----BEGIN [A-Z ]*PRIVATE KEY")),
]

print(f"terms: {', '.join(sorted(terms)) or '(none found)'}\n")
hits = 0
for root in sys.argv[1:]:
    for d, dirs, fs in os.walk(root):
        dirs[:] = [x for x in dirs if x not in IGNORE_DIRS]
        for f in fs:
            if f.endswith(BINARY) or f == "package-lock.json":
                continue
            p = os.path.join(d, f)
            try:
                lines = open(p, encoding="utf-8").read().splitlines()
            except (UnicodeDecodeError, OSError):
                continue
            for n, line in enumerate(lines, 1):
                for kind, rx in patterns:
                    if kind == "term" and not terms:
                        continue
                    m = rx.search(line)
                    if m:
                        hits += 1
                        print(f"{p}:{n}: [{kind}] {m.group(0)}  |  {line.strip()[:160]}")
print(f"\n{hits} hit(s)")
