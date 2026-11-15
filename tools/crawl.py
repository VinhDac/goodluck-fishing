"""THE COMPANY BOARDS THE WEB KNOWS (PLAN.md step 1, source 2: Common Crawl).

Common Crawl, the public archive of the web, keeps an index of every address it visited. Asked for the addresses of
jobs.ashbyhq.com, jobs.lever.co, boards.greenhouse.io and apply.workable.com, it names the companies whose own job
boards are there: a real list, not a guess. Then each board is asked how many jobs it holds now.

    python tools/crawl.py collect --crawls 6      the companies, from the six newest crawls -> data/slugs.json
    python tools/crawl.py verify                   each board's jobs now                     -> data/boards.json

Both go on where they stopped (what is done is kept as it comes) and say how far they are. Polite to Common Crawl: one
request at a time, a pause between, and a wait that grows when it is busy. Standard library alone.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from discover import AGENT, SYSTEMS, ask  # noqa: E402  the boards' own addresses, asked the same way

HERE = Path(__file__).resolve().parent.parent
SLUGS = HERE / "data" / "slugs.json"
BOARDS = HERE / "store" / "boards.json"            # the live boards, kept in the repo (public names)
INDEX = "https://index.commoncrawl.org"
# where each system's boards live on the web
HOSTS = {"ashby": ["jobs.ashbyhq.com"], "lever": ["jobs.lever.co", "jobs.eu.lever.co"],
         "greenhouse": ["boards.greenhouse.io", "job-boards.greenhouse.io", "job-boards.eu.greenhouse.io"],
         "workable": ["apply.workable.com"]}
NOT_A_BOARD = {"embed", "api", "v1", "jobs", "j", "favicon.ico", "robots.txt", "sitemap.xml", "static", "assets", "_next",
               "careers", "privacy", "terms", "login", "signin", "oauth", "health", "graphql", "widget", "cdn-cgi", "track"}


def get(url: str, tries: int = 6) -> str:
    """The answer's text; Common Crawl's index is often busy: waited for, longer each time."""
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": AGENT})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return ""
        except (urllib.error.URLError, TimeoutError, OSError):
            pass
        time.sleep(min(90, 5 * 2 ** k))
    return ""


def slug_of(url: str) -> str:
    """The company in a board's address: its first path part, or ?for= of an embedded Greenhouse board."""
    p = urllib.parse.urlsplit(url)
    q = urllib.parse.parse_qs(p.query)
    if "for" in q and q["for"][0]:
        return q["for"][0].lower()
    part = p.path.strip("/").split("/")[0].lower()
    return part if part and part not in NOT_A_BOARD and re.fullmatch(r"[a-z0-9][a-z0-9_.-]{1,60}", part) else ""


def collect(crawls: int) -> int:
    found = json.loads(SLUGS.read_text(encoding="utf-8")) if SLUGS.is_file() else {"done": [], "slugs": {}}
    names = [c["id"] for c in json.loads(get(f"{INDEX}/collinfo.json") or "[]")][:crawls]
    if not names:
        print("Common Crawl did not answer: try again later.")
        return 1
    for crawl in names:
        for system, hosts in HOSTS.items():
            for host in hosts:
                key = f"{crawl}|{host}"
                if key in found["done"]:
                    continue
                base = f"{INDEX}/{crawl}-index?url={host}/*&output=json&fl=url"
                try:
                    pages = int(json.loads(get(base + "&showNumPages=true") or "{}").get("pages") or 0)
                except ValueError:
                    pages = 0
                got = set(found["slugs"].get(system, []))
                before = len(got)
                for page in range(pages):
                    for line in get(f"{base}&page={page}").splitlines():
                        try:
                            s = slug_of(json.loads(line)["url"])
                        except (ValueError, KeyError):
                            continue
                        if s:
                            got.add(s)
                    time.sleep(1)
                found["slugs"][system] = sorted(got)
                found["done"].append(key)
                SLUGS.parent.mkdir(parents=True, exist_ok=True)
                SLUGS.write_text(json.dumps(found, indent=1), encoding="utf-8")
                print(f"{crawl} {host}: {pages} pages, +{len(got) - before} companies "
                      f"({system} now {len(got)})", flush=True)
    print("companies:", {s: len(v) for s, v in found["slugs"].items()}, flush=True)
    return 0


def verify(workers: int) -> int:
    slugs = json.loads(SLUGS.read_text(encoding="utf-8"))["slugs"]
    have = json.loads(BOARDS.read_text(encoding="utf-8")) if BOARDS.is_file() else {}
    todo = [(s, x) for s, xs in slugs.items() for x in xs if f"{s}:{x}" not in have]
    print(f"{len(todo)} boards to ask ({len(have)} asked before)", flush=True)

    def one(item):
        system, slug = item
        url, count = SYSTEMS[system]
        d = ask(url.format(slug))
        n = count(d) if isinstance(d, (dict, list)) else None
        return f"{system}:{slug}", n

    t0 = time.time()
    with ThreadPoolExecutor(workers) as pool:
        for k, (key, n) in enumerate(pool.map(one, todo), 1):
            have[key] = n
            if k % 200 == 0 or k == len(todo):
                BOARDS.write_text(json.dumps(have), encoding="utf-8")
                live = [v for v in have.values() if v]
                print(f"{k}/{len(todo)} asked, {round(time.time() - t0)} s: {len(live)} boards with jobs, "
                      f"{sum(live)} jobs", flush=True)
    live = {k: v for k, v in have.items() if v}
    by = {s: sum(1 for k in live if k.startswith(s + ":")) for s in SYSTEMS}
    print("boards with jobs:", len(live), by, "jobs:", sum(live.values()), flush=True)
    return 0


def main() -> int:
    a = argparse.ArgumentParser()
    a.add_argument("step", choices=("collect", "verify"))
    a.add_argument("--crawls", type=int, default=6)
    a.add_argument("--workers", type=int, default=12)
    args = a.parse_args()
    return collect(args.crawls) if args.step == "collect" else verify(args.workers)


if __name__ == "__main__":
    raise SystemExit(main())
