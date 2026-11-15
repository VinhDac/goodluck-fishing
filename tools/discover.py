"""FIND THE COMPANY BOARDS (PLAN.md step 1: the shared job store, many legal sources).

A company's own job board on Greenhouse, Lever, Ashby or Workable is public, and readable by anyone. This finds them
from a list of company names (to begin: the Home Office's public register of UK licensed sponsors, as GoodLuck keeps
it): for each name, its likely board names are asked of each system; a board that answers is kept with its job count.

    python tools/discover.py --register <path to a GoodLuck jobbot.db> --sample 1000 --out data/found.json

Read only: nothing is written anywhere but --out. Polite: a few requests at a time, each named as this tool.
Standard library alone.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.sources import AGENT, ask  # noqa: E402  one polite way of asking, for every tool
DROP = {"limited", "ltd", "plc", "llp", "lp", "uk", "group", "holdings", "holding", "inc", "llc", "the", "co", "company",
        "services", "service", "international", "global", "europe", "trading", "as", "t/a", "and", "of"}

# each system: the address of a board's jobs, and how many jobs an answer holds (None: no such board)
SYSTEMS = {
    "greenhouse": ("https://boards-api.greenhouse.io/v1/boards/{}/jobs", lambda d: len(d.get("jobs") or [])),
    "lever": ("https://api.lever.co/v0/postings/{}?mode=json", lambda d: len(d) if isinstance(d, list) else None),
    "ashby": ("https://api.ashbyhq.com/posting-api/job-board/{}", lambda d: len(d.get("jobs") or [])),
    "workable": ("https://apply.workable.com/api/v1/widget/accounts/{}", lambda d: len(d.get("jobs") or [])),
}


def slugs(name: str) -> list:
    """The board names a company is likely to have: its words joined, and hyphenated."""
    words = [w for w in re.findall(r"[a-z0-9]+", name.lower().replace("&", " and ")) if w not in DROP]
    if not words:
        return []
    out = ["".join(words)]
    if len(words) > 1:
        out.append("-".join(words))
    return [s for s in dict.fromkeys(out) if 2 < len(s) <= 40]


def probe(name: str) -> list:
    found = []
    for slug in slugs(name):
        for system, (url, count) in SYSTEMS.items():
            d = ask(url.format(slug))
            n = count(d) if isinstance(d, (dict, list)) else None
            if n is not None:
                found.append({"name": name, "system": system, "slug": slug, "jobs": n})
    return found


def main() -> int:
    a = argparse.ArgumentParser()
    a.add_argument("--register", required=True, help="a GoodLuck jobbot.db holding the table sponsor (read only)")
    a.add_argument("--sample", type=int, default=1000)
    a.add_argument("--seed", type=int, default=14)
    a.add_argument("--workers", type=int, default=12)
    a.add_argument("--out", default="data/found.json")
    args = a.parse_args()
    conn = sqlite3.connect(Path(args.register).resolve().as_uri() + "?mode=ro", uri=True)
    names = sorted({r[0] for r in conn.execute("SELECT name FROM sponsor WHERE route = 'Skilled Worker'")})
    conn.close()
    random.Random(args.seed).shuffle(names)
    names = names[: args.sample]
    t0 = time.time()
    with ThreadPoolExecutor(args.workers) as pool:
        found = [f for part in pool.map(probe, names) for f in part]
    boards = [f for f in found if f["jobs"] > 0]
    out = {"names": len(names), "seconds": round(time.time() - t0), "boards": found,
           "with_jobs": len(boards), "jobs": sum(f["jobs"] for f in boards),
           "by_system": {s: sum(1 for f in boards if f["system"] == s) for s in SYSTEMS}}
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps({k: v for k, v in out.items() if k != "boards"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
