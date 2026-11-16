#!/usr/bin/env python3
"""Render a board locally from its seed files, before publishing anything.

Usage: python3 preview_board.py <board_dir> [--theme light|dark] [--screenshot out.png] [--open TASK_ID]

Writes <board_dir>/preview.html: the built board.html plus a stand-in for the
artifact database that serves meta/plan, meta/rules, tasks/* and log/* from the
local files (read-only; Save in the drawer does nothing). Open it in a browser.

With --screenshot, renders it in headless Chrome and saves a full-page PNG; the
script exits 1 and prints the errors if the page threw any.
"""
import json
import pathlib
import re
import subprocess
import sys
import tempfile

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

MOCK = """<script>
window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)));
addEventListener('unhandledrejection',e=>__errs.push('rejection: '+String(e.reason)));
(()=>{const TASKS=%s, DOCS=%s, LOGS=%s;
const snap=a=>({size:a.length,metadata:{fromCache:false},docs:a.map(v=>({id:v.id||'x',exists:true,data:()=>v}))});
const later=f=>setTimeout(f,0);
const coll=n=>{const data=n==='tasks'?TASKS:[...LOGS].sort((a,b)=>String(b.ts).localeCompare(String(a.ts)));
  const q={orderBy:()=>q,limit:()=>q,where:(f,o,v)=>({limit:()=>({get:async()=>snap(data.filter(x=>x[f]===v))})}),
    onSnapshot:cb=>{later(()=>cb(snap(data)));return()=>{}}};return q};
const db={collection:coll,doc:p=>({onSnapshot:cb=>{later(()=>cb({exists:!!DOCS[p],data:()=>DOCS[p]}));return()=>{}},
  update:async()=>{},set:async()=>{}})};
window.claude={use:async k=>k==='db'?db:{can:async()=>true}};})();
</script>"""

PROBE = """<script>setTimeout(()=>{%s const o=document.createElement('pre');o.id='__probe';o.hidden=true;
o.textContent=JSON.stringify({errs:__errs,tasks:document.querySelectorAll('#tlist .trow').length});document.body.append(o)},900);</script>"""


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith("--"):
        sys.exit(__doc__)
    d = pathlib.Path(args[0]).expanduser()
    opt = lambda k: args[args.index(k) + 1] if k in args else None
    theme, shot, open_id = opt("--theme"), opt("--screenshot"), opt("--open")
    page = (d / "board.html").read_text()
    docs = {"meta/plan": json.loads((d / "meta/plan.json").read_text())}
    if (d / "meta/rules.json").exists():
        docs["meta/rules"] = json.loads((d / "meta/rules.json").read_text())
    tasks = [json.loads(f.read_text()) for f in sorted((d / "tasks").glob("*.json"))]
    logs = [json.loads(f.read_text()) for f in sorted((d / "log").glob("*.json"))] if (d / "log").exists() else []
    attr = f' data-theme="{theme}"' if theme in ("light", "dark") else ""
    open_js = f"location.hash={json.dumps(open_id)};" if open_id else ""
    html = (f"<!doctype html><html{attr}><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'></head><body>"
            + MOCK % (json.dumps(tasks), json.dumps(docs), json.dumps(logs)) + page + PROBE % open_js + "</body></html>")
    out = d / "preview.html"
    out.write_text(html)
    print(f"wrote {out}")
    if not shot:
        return
    if not pathlib.Path(CHROME).exists():
        sys.exit("Google Chrome not found; open preview.html in a browser instead.")
    with tempfile.TemporaryDirectory() as prof:
        base = [CHROME, "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
                f"--user-data-dir={prof}", "--virtual-time-budget=3000"]
        dom = subprocess.run(base + ["--dump-dom", out.as_uri()], capture_output=True, text=True, timeout=60).stdout
        subprocess.run(base + ["--window-size=1280,2400", f"--screenshot={pathlib.Path(shot).resolve()}", out.as_uri()],
                       capture_output=True, timeout=60)
    m = re.search(r'<pre id="__probe" hidden="">(.*?)</pre>', dom, re.S)
    if not m:
        sys.exit("The page didn't finish rendering; open preview.html in a browser to see why.")
    probe = json.loads(m.group(1).replace("&quot;", '"').replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">"))
    print(f"screenshot: {shot} · task rows rendered: {probe['tasks']} · page errors: {len(probe['errs'])}")
    if probe["errs"]:
        print("\n".join(probe["errs"]))
        sys.exit(1)


if __name__ == "__main__":
    main()
