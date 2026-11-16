#!/usr/bin/env python3
"""Fill the board template with one project's values.

Usage: python3 build_page.py <board_dir> [--draft]

Reads <board_dir>/config.json and <board_dir>/meta/plan.json, fills
assets/board.html, and writes <board_dir>/board.html.

--draft allows an empty board_url (first publish, before the page has a URL).
Rebuild without --draft once config.json has the URL, then republish.
"""
import html
import json
import pathlib
import re
import sys

SKILL = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = SKILL / "assets" / "board.html"
REQUIRED = ["title", "eyebrow", "plan_title", "plan_url", "plan_read_how",
            "branch_example", "commit_example", "example_id"]
DRAFT_URL = "THIS_PAGE_URL"


def join_names(names):
    if not names:
        return "the team"
    if len(names) == 1:
        return names[0]
    return ", ".join(names[:-1]) + " and " + names[-1]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    draft = "--draft" in sys.argv
    if len(args) != 1:
        sys.exit(__doc__)
    d = pathlib.Path(args[0]).expanduser()
    cfg = json.loads((d / "config.json").read_text())
    plan = json.loads((d / "meta" / "plan.json").read_text())

    missing = [k for k in REQUIRED if not str(cfg.get(k, "")).strip()]
    if missing:
        sys.exit("config.json is missing: " + ", ".join(missing))
    board_url = str(cfg.get("board_url", "")).strip()
    if not board_url and not draft:
        sys.exit("config.json has no board_url. Use --draft for the first publish, "
                 "then add the URL the publish returned (without ?sk=...) and rebuild.")
    if board_url and not re.match(r"^https://claude\.ai/artifact/[A-Za-z0-9]+$", board_url):
        sys.exit("board_url should look like https://claude.ai/artifact/<id> with no query string "
                 "(never put the ?sk= share key on the page).")

    people = [p for p in plan.get("people", []) if p.get("id")]
    if not people:
        sys.exit("meta/plan.json needs a non-empty people list.")
    labels = [p.get("label") or p["id"] for p in people]
    names = join_names(labels)
    sentence = (f"{labels[0]} drives Claude agents from here." if len(labels) == 1
                else f"{names} each drive their own Claude agents.")

    values = {
        "TITLE": cfg["title"],
        "EYEBROW": cfg["eyebrow"],
        "PLAN_TITLE": cfg["plan_title"],
        "PLAN_URL": cfg["plan_url"],
        "PLAN_READ_HOW": cfg["plan_read_how"],
        "BOARD_URL": board_url or DRAFT_URL,
        "BRANCH_EXAMPLE": cfg["branch_example"],
        "COMMIT_EXAMPLE": cfg["commit_example"],
        "EXAMPLE_ID": cfg["example_id"],
        "EXAMPLE_PERSON": people[0]["id"],
        "PEOPLE_NAMES": names,
        "PEOPLE_SENTENCE": sentence,
        "LANE_CHOICES": "|".join(labels),
    }
    out = TEMPLATE.read_text()
    for k, v in values.items():
        out = out.replace("{{" + k + "}}", html.escape(str(v), quote=True))
    left = sorted(set(re.findall(r"\{\{[A-Z_]+\}\}", out)))
    if left:
        sys.exit("Unfilled placeholders: " + ", ".join(left))
    (d / "board.html").write_text(out)
    print(f"wrote {d / 'board.html'}" + (" (draft: board_url not set yet)" if not board_url else ""))


if __name__ == "__main__":
    main()
