#!/usr/bin/env python3
"""Check a board's seed data and plan the ArtifactData batches that write it.

Usage: python3 check_board.py <board_dir> [--only tasks/X-101,tasks/X-102,...] [--no-log]

Reads <board_dir>/meta/plan.json, <board_dir>/meta/rules.json (optional) and
<board_dir>/tasks/*.json. Prints errors (exit 1) and warnings, then writes
<board_dir>/seed_batches.json: a list of batches, each at most 50 writes and
under 1 MiB, ready to pass as `writes` to ArtifactData action "batch".

Every write is a create (`set` with no if_version). On a board that already
has data, use --only to list the new documents; existing documents are
refused without if_version, which protects live status from being erased.
"""
import datetime as dt
import json
import pathlib
import re
import sys

STATUSES = {"todo", "in_progress", "review", "blocked", "done"}
SPEC_LISTS = ["what", "not", "dod", "where"]
MAX_WRITES, MAX_BYTES = 50, 900_000  # stay under the 1 MiB batch limit
NUM = r"(\d+|one|two|three|four|five|six|seven|eight|nine|ten)"

errors, warnings = [], []


def err(m): errors.append(m)
def warn(m): warnings.append(m)


def day(s, where):
    try:
        return dt.date.fromisoformat(str(s))
    except ValueError:
        err(f"{where}: '{s}' is not a YYYY-MM-DD date")
        return None


def load(p):
    try:
        return json.loads(p.read_text())
    except json.JSONDecodeError as e:
        err(f"{p}: invalid JSON ({e})")
        return None


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith("--"):
        sys.exit(__doc__)
    d = pathlib.Path(args[0]).expanduser()
    only = None
    if "--only" in args:
        only = set(args[args.index("--only") + 1].split(","))
    add_log = "--no-log" not in args

    plan = load(d / "meta" / "plan.json") or {}
    rules_p = d / "meta" / "rules.json"
    rules = load(rules_p) if rules_p.exists() else None
    task_files = sorted((d / "tasks").glob("*.json"))
    tasks = {}
    for f in task_files:
        t = load(f)
        if t is None:
            continue
        if t.get("id") != f.stem:
            err(f"{f.name}: id '{t.get('id')}' must match the file name")
        tasks[t.get("id")] = t

    # ---- meta/plan
    for k in ["title", "start", "end", "people", "lanes", "phases", "seeded"]:
        if not plan.get(k):
            err(f"meta/plan: missing '{k}'")
    pstart = day(plan.get("start"), "meta/plan.start") if plan.get("start") else None
    pend = day(plan.get("end"), "meta/plan.end") if plan.get("end") else None
    people = {p.get("id") for p in plan.get("people", [])}
    lanes = {l.get("id") for l in plan.get("lanes", [])}
    phases = [p.get("id") for p in plan.get("phases", [])]
    for name, ids, src in [("people", people, plan.get("people", [])), ("lanes", lanes, plan.get("lanes", [])),
                           ("phases", set(phases), plan.get("phases", []))]:
        if len(ids) != len(src) or None in ids:
            err(f"meta/plan.{name}: every entry needs a unique id")
    for p in plan.get("phases", []):
        if not p.get("done_when"):
            warn(f"phase {p.get('id')}: no done_when, so nobody can tell when the phase is finished")
    if rules is not None:
        for i, r in enumerate(rules.get("items", [])):
            if not r.get("id") or not r.get("text"):
                err(f"meta/rules.items[{i}]: needs id and text")

    # ---- tasks
    if not tasks:
        err("no tasks in tasks/*.json")
    for tid, t in tasks.items():
        w = f"task {tid}"
        for k in ["title", "short", "phase", "lane", "est_days", "start", "end", "spec", "status"]:
            if t.get(k) in (None, ""):
                err(f"{w}: missing '{k}'")
        if not isinstance(t.get("deps"), list):
            err(f"{w}: 'deps' must be a list (use [] for none)")
        if t.get("phase") not in phases:
            err(f"{w}: phase '{t.get('phase')}' is not in meta/plan.phases")
        if t.get("lane") not in lanes:
            err(f"{w}: lane '{t.get('lane')}' is not in meta/plan.lanes")
        if t.get("status") not in STATUSES:
            err(f"{w}: status must be one of {sorted(STATUSES)}")
        if t.get("owner") and t["owner"] not in people:
            err(f"{w}: owner '{t['owner']}' is not in meta/plan.people")
        if len(str(t.get("short", ""))) > 23:
            warn(f"{w}: short label over 23 characters gets cut off in the graph")
        spec = t.get("spec") or {}
        for k in SPEC_LISTS:
            if not isinstance(spec.get(k), list) or not spec.get(k):
                err(f"{w}: spec.{k} must be a non-empty list")
        if not str(spec.get("brief", "")).strip():
            err(f"{w}: spec.brief is empty")
        # A count in "what" that differs from the one in "dod" usually means one was edited and the other wasn't.
        what_n = set(re.findall(r"exactly " + NUM, " ".join(map(str, spec.get("what", []))), re.I))
        dod_n = set(re.findall(r"exactly " + NUM, " ".join(map(str, spec.get("dod", []))), re.I))
        if what_n and dod_n and what_n != dod_n:
            warn(f"{w}: 'exactly {'/'.join(sorted(what_n))}' in what but 'exactly {'/'.join(sorted(dod_n))}' in dod")
        a = day(t.get("start"), f"{w}.start") if t.get("start") else None
        b = day(t.get("end"), f"{w}.end") if t.get("end") else None
        if a and b and a > b:
            err(f"{w}: start is after end")
        if a and pstart and a < pstart or b and pend and b > pend:
            warn(f"{w}: dates fall outside meta/plan start/end")
        for dep in t.get("deps") or []:
            if dep == tid:
                err(f"{w}: depends on itself")
            elif dep not in tasks:
                err(f"{w}: dependency '{dep}' does not exist")
            else:
                try:
                    de = dt.date.fromisoformat(str(tasks[dep].get("end")))
                except ValueError:
                    de = None  # reported on the dependency itself
                if a and de and de > a:
                    warn(f"{w}: starts {a} but dependency {dep} ends {de}")

    # cycles
    state = {}
    def visit(n, path):
        if state.get(n) == 1:
            err("dependency cycle (each task depends on the next): " + " -> ".join(path[path.index(n):] + [n]))
            return
        if state.get(n) == 2 or n not in tasks:
            return
        state[n] = 1
        for dep in tasks[n].get("deps") or []:
            visit(dep, path + [n])
        state[n] = 2
    for n in tasks:
        visit(n, [])

    used_phases = {t.get("phase") for t in tasks.values()}
    for p in phases:
        if p not in used_phases:
            warn(f"phase {p} has no tasks")
    for m in plan.get("milestones", []):
        if m.get("task") not in tasks:
            err(f"milestone {m.get('id')}: gate task '{m.get('task')}' does not exist")
        elif m.get("date") and tasks[m["task"]].get("end") and m["date"] < tasks[m["task"]]["end"]:
            warn(f"milestone {m.get('id')} is dated before its gate task {m['task']} ends")

    # ---- batches
    docs = [("meta", "plan", d / "meta" / "plan.json")]
    if rules is not None:
        docs.append(("meta", "rules", rules_p))
    docs += [("tasks", f.stem, f) for f in task_files]
    if add_log:
        now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
        stamp = now.strftime("%Y%m%dT%H%M%SZ")
        log_dir = d / "log"
        log_dir.mkdir(exist_ok=True)
        for stale in log_dir.glob("*-plan-seed.json"):  # one seed entry per run, not one per check
            stale.unlink()
        lid = f"{stamp}-plan-seed"
        n = len(tasks) if only is None else len([x for x in only if x.startswith("tasks/")])
        entry = {"ts": now.isoformat().replace("+00:00", "Z"), "task": None, "lane": plan.get("seeded_by", ""),
                 "kind": "replan", "text": f"Seeded {n} task{'s' if n != 1 else ''} from {plan.get('source_title', 'the plan')}."}
        (log_dir / f"{lid}.json").write_text(json.dumps(entry, indent=2))
        docs.append(("log", lid, log_dir / f"{lid}.json"))
    if only is not None:
        unknown = only - {f"{c}/{i}" for c, i, _ in docs}
        if unknown:
            err("--only names documents that don't exist locally: " + ", ".join(sorted(unknown)))
        docs = [x for x in docs if f"{x[0]}/{x[1]}" in only or x[0] == "log"]

    batches, cur, size = [], [], 0
    for c, i, f in docs:
        b = f.stat().st_size
        if b > MAX_BYTES:
            err(f"{c}/{i} is {b} bytes; one document must stay well under 1 MiB")
        if cur and (len(cur) == MAX_WRITES or size + b > MAX_BYTES):
            batches.append(cur); cur, size = [], 0
        cur.append({"op": "set", "collection": c, "doc_id": i, "file_path": str(f.resolve())})
        size += b
    if cur:
        batches.append(cur)

    for m in warnings:
        print("WARN  " + m)
    for m in errors:
        print("ERROR " + m)
    if errors:
        print(f"\n{len(errors)} error(s). Fix them before seeding.")
        sys.exit(1)
    (d / "seed_batches.json").write_text(json.dumps(batches, indent=2))
    print(f"\nOK: {len(tasks)} tasks, {len(phases)} phases, {len(lanes)} lanes, "
          f"{len(plan.get('milestones', []))} milestones, {len(warnings)} warning(s).")
    print(f"{sum(map(len, batches))} writes in {len(batches)} batch(es) -> {d / 'seed_batches.json'}")


if __name__ == "__main__":
    main()
