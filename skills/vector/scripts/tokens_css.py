#!/usr/bin/env python3
"""Regenerate tokens.css from tokens.json.

Usage: python3 tokens_css.py

Writes ../tokens.css: every token as a CSS custom property. Light values sit on
:root; dark values apply under prefers-color-scheme (unless data-theme="light")
and under [data-theme="dark"]. Type styles become --t-<style>-size, -lh, -weight
and -track; font families become --font-<family>.
"""
import json
import pathlib
import re

SKILL = pathlib.Path(__file__).resolve().parent.parent


def css_value(v):
    m = re.fullmatch(r"\{([A-Za-z0-9_.-]+)\}", str(v))
    return f"var(--{m.group(1)})" if m else str(v)


def build(tokens):
    first = tokens["color"]["themes"][0]["id"]
    light, dark, common = [], [], []
    for t in tokens["color"]["tokens"]:
        v = t["value"]
        if isinstance(v, dict):
            lv, dv = v.get("light", v.get(first)), v.get("dark", v.get(first))
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
    return "\n".join([
        f"/* Generated from {tokens.get('name', 'Vector')} tokens.json by vector/scripts/tokens_css.py. Do not edit by hand. */",
        ":root{color-scheme:light;", *("  " + x for x in common + light), "}",
        '@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){color-scheme:dark;',
        *("  " + x for x in dark), "}}",
        ':root[data-theme="dark"]{color-scheme:dark;', *("  " + x for x in dark), "}",
    ]) + "\n"


if __name__ == "__main__":
    out = SKILL / "tokens.css"
    out.write_text(build(json.loads((SKILL / "tokens.json").read_text())))
    print(f"wrote {out}")
