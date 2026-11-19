#!/usr/bin/env python3
"""Regenerate tokens.css from tokens.json.

Usage: python3 tokens_css.py

Writes ../tokens.css: every token as a CSS custom property. Light values sit on
:root; dark values apply under prefers-color-scheme (unless data-theme="light"
or class="light"), under [data-theme="dark"], and under shadcn's own .dark
class. Type styles become --t-<style>-size, -lh, -weight and -track; font
families become --font-<family>.
"""
import json
import pathlib

SKILL = pathlib.Path(__file__).resolve().parent.parent


def build(tokens):
    light, dark, common = [], [], []
    for t in tokens["color"]["tokens"]:
        v = t["value"]
        lv, dv = (v["light"], v["dark"]) if isinstance(v, dict) else (v, v)
        if lv == dv:
            common.append(f"--{t['name']}:{lv};")
        else:
            light.append(f"--{t['name']}:{lv};")
            dark.append(f"--{t['name']}:{dv};")
    for fam in ("radius", "spacing", "shadow"):
        for t in tokens.get(fam, {}).get("tokens", []):
            common.append(f"--{t['name']}:{t['value']};")
    for k, v in tokens["type"]["families"].items():
        common.append(f"--font-{k}:{v};")
    for g in tokens["type"]["groups"]:
        for s in g["styles"]:
            n = s["name"]
            common.append(f"--t-{n}-size:{s['fontSize']}; --t-{n}-lh:{s['lineHeight']}; "
                          f"--t-{n}-weight:{s['fontWeight']}; --t-{n}-track:{s.get('letterSpacing', 'normal')};")
    dark_body = [f"  {x}" for x in dark]
    return "\n".join([
        "/* Generated from shadcn-ui/tokens.json by shadcn-ui/scripts/tokens_css.py. Do not edit by hand. */",
        ":root{color-scheme:light;", *("  " + x for x in common + light), "}",
        '@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]):not(.light){color-scheme:dark;',
        *dark_body, "}}",
        ':root[data-theme="dark"], .dark{color-scheme:dark;', *dark_body, "}",
    ]) + "\n"


if __name__ == "__main__":
    out = SKILL / "tokens.css"
    out.write_text(build(json.loads((SKILL / "tokens.json").read_text())))
    print(f"wrote {out}")
