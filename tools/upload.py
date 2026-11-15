"""THE HARVEST INTO SUPABASE (PLAN.md step 2): data/jobs.jsonl (tools/harvest.py) written into the shared table jobs,
a thousand at a time; a job already there is brought up to date. Then every job this harvest did not find open is
marked open = false, never deleted (a person's applied list keeps pointing at it).

    python tools/upload.py

The secret key comes from data/keys.json (never printed, never in git); in GitHub Actions, from its secrets.
Standard library alone.
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
JOBS = HERE / "data" / "jobs.jsonl"
BATCH = 1000


def keys() -> tuple:
    if os.environ.get("SUPABASE_URL"):
        return os.environ["SUPABASE_URL"].rstrip("/"), os.environ["SUPABASE_SECRET_KEY"]
    k = json.loads((HERE / "data" / "keys.json").read_text(encoding="utf-8"))
    return k["supabase_url"].strip().rstrip("/"), k["supabase_secret_key"].strip()


def call(url: str, key: str, method: str, path: str, body=None, prefer: str = "") -> int:
    h = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "User-Agent": "GoodLuckFishing/0.1"}
    if prefer:
        h["Prefer"] = prefer
    data = json.dumps(body).encode("utf-8") if body is not None else None
    for k in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(f"{url}/rest/v1/{path}", data=data, method=method, headers=h), timeout=120) as r:
                return r.status
        except urllib.error.HTTPError as e:
            if e.code < 500 or k == 3:
                raise RuntimeError(f"{method} {path.split('?')[0]}: {e.code} {e.read()[:200].decode('utf-8', 'replace')}")
        except (urllib.error.URLError, TimeoutError, OSError):
            if k == 3:
                raise
        time.sleep(3 * (k + 1))
    return 0


def main() -> int:
    url, key = keys()
    start = datetime.now(timezone.utc).isoformat()
    rows = []
    # line by line as the file has them: splitlines() also breaks at U+2028 inside a job's title (15 Nov 2026)
    for line in JOBS.open(encoding="utf-8", newline="\n"):
        if not line.strip():
            continue
        j = json.loads(line)
        rows.append({"id": j["id"], "company": j["company"], "title": j["title"], "place": j["place"], "url": j["url"],
                     "posted": datetime.fromtimestamp(j["posted"], timezone.utc).isoformat() if j["posted"] else None,
                     "skills": j["skills"], "agency": j["agency"], "open": True, "seen_at": start})
    t0 = time.time()
    for k in range(0, len(rows), BATCH):
        call(url, key, "POST", "jobs", rows[k:k + BATCH], "resolution=merge-duplicates,return=minimal")
        if (k // BATCH) % 20 == 0:
            print(f"{k + len(rows[k:k + BATCH])}/{len(rows)} written, {round(time.time() - t0)} s", flush=True)
    # what this harvest did not find open is closed, never deleted
    call(url, key, "PATCH", f"jobs?open=eq.true&seen_at=lt.{urllib.request.quote(start)}", {"open": False}, "return=minimal")
    print(f"done: {len(rows)} jobs written in {round(time.time() - t0)} s; the others marked closed", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
