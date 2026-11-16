#!/usr/bin/env python3
"""Regenerate the board template's design tokens and icons from the local design-system copy.

Usage: python3 sync_design_system.py [--check]

Reads assets/design-system/tokens.json and assets/design-system/icons/*.svg and
rewrites two generated blocks in assets/board.html:

  /* @tokens:start */ ... /* @tokens:end */   CSS custom properties, light on :root,
                                              dark under prefers-color-scheme and [data-theme]
  /* @icons:start */  ... /* @icons:end */    .ico-<name> classes holding each SVG as a data URI

Everything else in the template's CSS refers to these tokens by name, so a change
to a token's value only needs this script. A renamed or removed token also needs
the hand-written CSS updated; --check lists any var(--x) the CSS uses that no
longer exists.
"""
import json
import pathlib
import re
import sys
import urllib.parse

SKILL = pathlib.Path(__file__).resolve().parent.parent
DS = SKILL / "assets" / "design-system"
PAGE = SKILL / "assets" / "board.html"
# Variables the template defines itself (board semantics layered on the tokens).
LOCAL_VARS = {"st-todo", "st-todo-bg", "st-ready", "st-ready-bg", "st-prog", "st-prog-bg", "st-review",
              "st-review-bg", "st-block", "st-block-bg", "st-done", "st-done-bg", "dot",
              "st-"}  # "st-" is the prefix the page's script completes at runtime


def css_value(v):
    m = re.fullmatch(r"\{([A-Za-z0-9_.-]+)\}", str(v))
    return f"var(--{m.group(1)})" if m else str(v)


def build_tokens(tokens):
    themes = [t["id"] for t in tokens["color"]["themes"]]
    first = themes[0]
    light, dark, common = [], [], []
    for t in tokens["color"]["tokens"]:
        v = t["value"]
        if isinstance(v, dict):
            lv = v.get("light", v.get(first)); dv = v.get("dark", v.get(first))
        else:
            lv = dv = v
        if lv == dv:
            common.append(f"--{t['name']}:{css_value(lv)};")
        else:
            light.append(f"--{t['name']}:{css_value(lv)};")
            dark.append(f"--{t['name']}:{css_value(dv)};")
    for fam in ("spacing", "radius", "shadow"):
        for t in tokens.get(fam, {}).get("tokens", []):
            common.append(f"--{t['name']}:{t['value']};")
    for k, v in tokens["type"]["families"].items():
        common.append(f"--font-{k}:{v};")
    for g in tokens["type"]["groups"]:
        for s in g["styles"]:
            n = s["name"]
            common.append(f"--t-{n}-size:{s['fontSize']}; --t-{n}-lh:{s['lineHeight']}; "
                          f"--t-{n}-weight:{s['fontWeight']}; --t-{n}-track:{s.get('letterSpacing', 'normal')};")
    name = tokens.get("name", "design system")
    out = [f"/* Generated from {name} tokens.json by scripts/sync_design_system.py. Do not edit by hand. */",
           ":root{color-scheme:light;", *("  " + x for x in common + light), "}",
           '@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){color-scheme:dark;',
           *("  " + x for x in dark), "}}",
           ':root[data-theme="dark"]{color-scheme:dark;', *("  " + x for x in dark), "}"]
    return "\n".join(out)


def build_icons():
    rules = ["/* Generated from design-system/icons by scripts/sync_design_system.py. */"]
    for f in sorted((DS / "icons").glob("*.svg")):
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
    tokens = json.loads((DS / "tokens.json").read_text())
    page = PAGE.read_text()
    page = replace_block(page, "tokens", build_tokens(tokens))
    page = replace_block(page, "icons", build_icons())
    defined = {t["name"] for t in tokens["color"]["tokens"]}
    for fam in ("spacing", "radius", "shadow"):
        defined |= {t["name"] for t in tokens.get(fam, {}).get("tokens", [])}
    defined |= {f"font-{k}" for k in tokens["type"]["families"]}
    for g in tokens["type"]["groups"]:
        for s in g["styles"]:
            defined |= {f"t-{s['name']}-{x}" for x in ("size", "lh", "weight", "track")}
    used = set(re.findall(r"var\(--([a-z0-9-]+)", page))
    missing = sorted(used - defined - LOCAL_VARS)
    if "--check" in sys.argv:
        print("missing tokens: " + (", ".join(missing) if missing else "none"))
        sys.exit(1 if missing else 0)
    if missing:
        sys.exit("The template uses tokens the design system no longer defines: " + ", ".join(missing)
                 + "\nUpdate the hand-written CSS in assets/board.html, then run this again.")
    PAGE.write_text(page)
    print(f"synced {len(defined)} tokens and {len(list((DS / 'icons').glob('*.svg')))} icons into {PAGE}")


if __name__ == "__main__":
    main()
