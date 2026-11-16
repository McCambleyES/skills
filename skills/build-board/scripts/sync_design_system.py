#!/usr/bin/env python3
"""Copy Vector's tokens and icons into the board template.

Usage: python3 sync_design_system.py [--check]

Reads tokens.css and icons/*.svg from the `vector` skill (a sibling folder of this
skill, else ~/.claude/skills/vector) and rewrites two generated blocks in
assets/board.html:

  /* @tokens:start */ ... /* @tokens:end */   vector/tokens.css, verbatim
  /* @icons:start */  ... /* @icons:end */    .ico-<name> classes holding each SVG as a data URI

Run vector/scripts/tokens_css.py first if tokens.json changed. A renamed or removed
token also needs the hand-written CSS updated; --check lists any var(--x) the
template uses that tokens.css no longer defines.
"""
import pathlib
import re
import sys
import urllib.parse

SKILL = pathlib.Path(__file__).resolve().parent.parent
VECTOR = next((p for p in (SKILL.parent / "vector", pathlib.Path.home() / ".claude" / "skills" / "vector")
               if (p / "tokens.css").exists()), None)
PAGE = SKILL / "assets" / "board.html"
# Variables the template defines itself (board semantics layered on the tokens).
LOCAL_VARS = {"st-todo", "st-todo-bg", "st-ready", "st-ready-bg", "st-prog", "st-prog-bg", "st-review",
              "st-review-bg", "st-block", "st-block-bg", "st-done", "st-done-bg", "dot",
              "st-"}  # "st-" is the prefix the page's script completes at runtime


def build_icons():
    rules = ["/* Generated from vector/icons by scripts/sync_design_system.py. */"]
    for f in sorted((VECTOR / "icons").glob("*.svg")):
        svg = re.sub(r"\s+", " ", f.read_text().strip())
        if re.search(r"<script|on\w+=|href=|foreignObject", svg, re.I):
            sys.exit(f"{f.name}: refusing an SVG with script, event handlers or links")
        uri = "data:image/svg+xml," + urllib.parse.quote(svg, safe=" =:/,'-.")
        rules.append(f'.ico-{f.stem}{{background-image:url("{uri}")}}')
    return "\n".join(rules)


def replace_block(page, tag, body):
    pat = re.compile(r"(/\* @%s:start \*/\n)(?:.*?\n)?(/\* @%s:end \*/)" % (tag, tag), re.S)
    if not pat.search(page):
        sys.exit(f"board.html has no /* @{tag}:start */ ... /* @{tag}:end */ block")
    return pat.sub(lambda m: m.group(1) + body + "\n" + m.group(2), page, count=1)


def main():
    if VECTOR is None:
        sys.exit("Can't find the vector skill (tokens.css). Install it next to build-board.")
    tokens_css = (VECTOR / "tokens.css").read_text().rstrip("\n")
    page = PAGE.read_text()
    page = replace_block(page, "tokens", tokens_css)
    page = replace_block(page, "icons", build_icons())
    defined = set(re.findall(r"--([A-Za-z0-9_-]+)\s*:", tokens_css))
    used = set(re.findall(r"var\(--([a-z0-9-]+)", page))
    missing = sorted(used - defined - LOCAL_VARS)
    if "--check" in sys.argv:
        print("missing tokens: " + (", ".join(missing) if missing else "none"))
        sys.exit(1 if missing else 0)
    if missing:
        sys.exit("The template uses tokens Vector no longer defines: " + ", ".join(missing)
                 + "\nUpdate the hand-written CSS in assets/board.html, then run this again.")
    PAGE.write_text(page)
    print(f"synced {len(defined)} tokens and {len(list((VECTOR / 'icons').glob('*.svg')))} icons from {VECTOR} into {PAGE}")

if __name__ == "__main__":
    main()
