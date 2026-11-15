"""THE HARVEST (PLAN.md step 1: the shared job store). Every live company board found (data/boards.json, by
tools/crawl.py) read for its open jobs, each kept as one line of data/jobs.jsonl: where it is, when it was posted, the
link to apply on the company's own page, and the skills its words ask (skills.json, the game's own list: the posting's
text is read here and not kept, so the store stays small and the CV is scored on the person's own device).

    python tools/harvest.py                 -> data/jobs.jsonl, and what it found, said at the end

A job twice (the same company, title and place) is kept once; a recruitment agency's is kept and marked, hidden by the
game unless the person asks (PLAN.md 7, decision 4). Says how far it is as it goes. Standard library alone.
"""

from __future__ import annotations

import re
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.sources import read_board as read, finish  # noqa: E402  the same reading as the app's own boats

HERE = Path(__file__).resolve().parent.parent
BOARDS = HERE / "store" / "boards.json"            # the live boards, kept in the repo (public names)
OUT = HERE / "data" / "jobs.jsonl"
UK = re.compile(r"\b(?:uk|u\.k\.|united kingdom|england|scotland|wales|northern ireland|london|manchester|edinburgh|"
                r"glasgow|bristol|cambridge|oxford|leeds|birmingham|belfast|cardiff)\b", re.I)


def main() -> int:
    boards = [k for k, n in json.loads(BOARDS.read_text(encoding="utf-8")).items() if n]
    t0, seen, kept = time.time(), set(), []
    counts = {"boards": len(boards), "failed": 0}
    with ThreadPoolExecutor(8) as pool:
        for k, jobs in enumerate(pool.map(read, boards), 1):
            if not jobs:
                counts["failed"] += 1
            for j in jobs:
                same = (j["company"].lower(), j["title"].lower(), j["place"].lower())
                if not j["url"] or same in seen:
                    continue
                seen.add(same)
                kept.append(finish(j))
            if k % 200 == 0 or k == len(boards):
                print(f"{k}/{len(boards)} boards, {round(time.time() - t0)} s: {len(kept)} jobs", flush=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as f:
        for j in kept:
            f.write(json.dumps(j, ensure_ascii=False) + "\n")
    now = datetime.now(timezone.utc).timestamp()
    fresh = [j for j in kept if j["posted"] and now - j["posted"] <= 14 * 86400]
    uk = [j for j in kept if UK.search(j["place"])]
    said = {"seconds": round(time.time() - t0), "jobs": len(kept), "posted_14_days": len(fresh), "uk": len(uk),
            "uk_14_days": len({j["id"] for j in uk} & {f["id"] for f in fresh}),
            "london": sum(1 for j in kept if "london" in j["place"].lower()), "agency": sum(j["agency"] for j in kept),
            "no_skill_read": sum(1 for j in kept if len(j["skills"]) < 3), "boards_empty_or_failed": counts["failed"],
            "megabytes": round(OUT.stat().st_size / 1e6, 1)}
    print(json.dumps(said), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
