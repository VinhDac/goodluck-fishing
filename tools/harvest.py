"""THE HARVEST (PLAN.md step 1: the shared job store). Every live company board found (data/boards.json, by
tools/crawl.py) read for its open jobs, each kept as one line of data/jobs.jsonl: where it is, when it was posted, the
link to apply on the company's own page, and the skills its words ask (skills.json, the game's own list: the posting's
text is read here and not kept, so the store stays small and the CV is scored on the person's own device).

    python tools/harvest.py                 -> data/jobs.jsonl, and what it found, said at the end

A job twice (the same company, title and place) is kept once; a recruitment agency's is kept and marked, hidden by the
game unless the person asks (PLAN.md 7, decision 4). Says how far it is as it goes. Standard library alone.
"""

from __future__ import annotations

import html
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from discover import ask  # noqa: E402  a board asked politely, as the other tools ask

HERE = Path(__file__).resolve().parent.parent
BOARDS = HERE / "store" / "boards.json"            # the live boards, kept in the repo (public names)
OUT = HERE / "data" / "jobs.jsonl"
SKILLS = json.loads((HERE / "skills.json").read_text(encoding="utf-8"))
# each skill's spellings as whole words, as js/score.js reads them
RX = [(forms[0], re.compile("|".join(r"(?:^|[^a-z0-9+#.])" + re.escape(f.strip()) + r"(?=$|[^a-z0-9+#])" for f in forms)))
      for forms in SKILLS]
AGENCY = re.compile(r"recruit|staffing|talent (?:partners|solutions|acquisition)|search partners|resourcing|headhunt", re.I)
UK = re.compile(r"\b(?:uk|u\.k\.|united kingdom|england|scotland|wales|northern ireland|london|manchester|edinburgh|"
                r"glasgow|bristol|cambridge|oxford|leeds|birmingham|belfast|cardiff)\b", re.I)


def skills_of(text: str) -> dict:
    t = f" {text.lower()} "
    out = {}
    for name, rx in RX:
        n = len(rx.findall(t))
        if n:
            out[name] = min(3, n)
    return out


def plain(markup: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(html.unescape(markup or "")))).strip()


def when(value) -> int:
    """A posting's time in seconds since 1970, or 0."""
    if isinstance(value, (int, float)):
        return int(value / 1000 if value > 1e11 else value)
    try:
        return int(datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp())
    except ValueError:
        return 0


def read(key: str) -> list:
    """One board's open jobs, one shape for every system."""
    system, slug = key.split(":", 1)
    out = []
    if system == "greenhouse":
        d = ask(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true") or {}
        for j in d.get("jobs") or []:
            out.append({"id": f"gh:{slug}:{j.get('id')}", "company": j.get("company_name") or slug, "title": j.get("title") or "",
                        "place": (j.get("location") or {}).get("name") or "", "url": j.get("absolute_url") or "",
                        "posted": when(j.get("first_published") or j.get("updated_at")), "text": plain(j.get("content"))})
    elif system == "lever":
        d = ask(f"https://api.lever.co/v0/postings/{slug}?mode=json") or []
        for j in d if isinstance(d, list) else []:
            c = j.get("categories") or {}
            out.append({"id": f"lv:{slug}:{j.get('id')}", "company": slug, "title": j.get("text") or "",
                        "place": "; ".join(c.get("allLocations") or [c.get("location") or ""]), "url": j.get("hostedUrl") or "",
                        "posted": when(j.get("createdAt") or 0), "text": j.get("descriptionPlain") or ""})
    elif system == "ashby":
        d = ask(f"https://api.ashbyhq.com/posting-api/job-board/{slug}") or {}
        for j in d.get("jobs") or []:
            if j.get("isListed") is False:
                continue
            places = [j.get("location") or ""] + [s.get("location") or "" for s in j.get("secondaryLocations") or []]
            out.append({"id": f"ab:{slug}:{j.get('id')}", "company": slug, "title": j.get("title") or "",
                        "place": "; ".join(p for p in places if p) + (" (remote)" if j.get("isRemote") else ""),
                        "url": j.get("jobUrl") or "", "posted": when(j.get("publishedAt")), "text": j.get("descriptionPlain") or ""})
    return out


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
                text = j.pop("text")
                j["skills"] = skills_of(f"{j['title']} {text}")
                j["agency"] = bool(AGENCY.search(j["company"]))
                kept.append(j)
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
