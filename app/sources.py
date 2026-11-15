"""THE SOURCES THE BOATS READ (PLAN.md 15 and 16): a company's own job board on Greenhouse, Lever or Ashby, read by its
public API; one shape for every system: id, company, title, place, link, when posted, and the skills its words ask
(skills.json, the game's own list). Shared by the app's fleet (app/fleet.py) and the six-hourly harvest
(tools/harvest.py), so a job has the same id and the same skills wherever it was read. Standard library alone.
"""

from __future__ import annotations

import html
import json
import re
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
AGENT = "GoodLuckFishing/0.2 (reading public job boards; vinhdac.github.io)"
SKILLS = json.loads((HERE / "skills.json").read_text(encoding="utf-8"))
# each skill's spellings as whole words, as js/score.js reads them
RX = [(forms[0], re.compile("|".join(r"(?:^|[^a-z0-9+#.])" + re.escape(f.strip()) + r"(?=$|[^a-z0-9+#])" for f in forms)))
      for forms in SKILLS]
AGENCY = re.compile(r"recruit|staffing|talent (?:partners|solutions|acquisition)|search partners|resourcing|headhunt", re.I)


def ask(url: str, timeout: float = 12):
    """The answer as JSON, or None when there is no board (or no answer). Asked politely, named as this tool."""
    req = urllib.request.Request(url, headers={"User-Agent": AGENT, "Accept": "application/json"})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3 + attempt * 5)
                continue
            return None
        except (urllib.error.URLError, TimeoutError, ValueError, OSError):
            return None
    return None


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


def read_board(key: str, light: bool = False) -> list:
    """One board's open jobs, one shape for every system, with the posting's words ("text") still in. Light: a Greenhouse
    board's list alone, its words left out (fetched for the jobs that fit, by read_words), many times quicker."""
    system, slug = key.split(":", 1)
    out = []
    if system == "greenhouse":
        d = ask(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs{'' if light else '?content=true'}") or {}
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


def read_words(job: dict) -> dict:
    """A Greenhouse job read lightly: its posting's words, fetched now."""
    if job.get("text") or not job["id"].startswith("gh:"):
        return job
    _, slug, jid = job["id"].split(":", 2)
    d = ask(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs/{jid}") or {}
    job["text"] = plain(d.get("content"))
    return job


def finish(job: dict) -> dict:
    """A job as the game takes it: the words read into skills and let go, an agency marked."""
    text = job.pop("text", "")
    job["skills"] = skills_of(f"{job['title']} {text}")
    job["agency"] = bool(AGENCY.search(job["company"]))
    return job


def still_open(job_id: str):
    """Is this posting still up? True, False, or None when it cannot be told (asked of its board's own API)."""
    try:
        prefix, slug, jid = job_id.split(":", 2)
    except ValueError:
        return None
    if prefix == "gh":
        url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs/{jid}"
    elif prefix == "lv":
        url = f"https://api.lever.co/v0/postings/{slug}/{jid}"
    else:
        d = ask(f"https://api.ashbyhq.com/posting-api/job-board/{slug}")
        return None if d is None else any(j.get("id") == jid for j in d.get("jobs") or [])
    req = urllib.request.Request(url, headers={"User-Agent": AGENT, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except urllib.error.HTTPError as e:
        return False if e.code == 404 else None
    except (urllib.error.URLError, TimeoutError, OSError):
        return None


# ---- the person's own filters, as js/score.js has them: their titles and where they work ------------------------------
LEVEL = {"senior", "sr", "junior", "jr", "lead", "principal", "staff", "head", "graduate", "intern", "associate", "i", "ii", "iii",
         "of", "and", "the", "a"}


def words(s: str) -> list:
    return re.findall(r"[a-z0-9+#]+", str(s or "").lower())


def title_fits(title: str, titles: list) -> bool:
    """A job's title fits one of theirs when its last word (what the job is: engineer, analyst) is in it, and half of the
    others; no title given, every job fits."""
    if not titles:
        return True
    have = set(words(title))
    near = lambda w: w in have or re.sub(r"s$", "", w) in have or f"{w}s" in have  # noqa: E731
    for t in titles:
        core = [w for w in words(t) if w not in LEVEL]
        if not core or not near(core[-1]):
            continue
        rest = core[:-1]
        if sum(1 for w in rest if near(w)) >= -(-len(rest) // 2):
            return True
    return False


def place_fits(place: str, city: str, remote: bool) -> bool:
    """Where it is fits theirs: their city named in its place, or remote work when they take it; no city given, anywhere."""
    p = str(place or "").lower()
    if remote and re.search(r"remote|anywhere|work from home", p):
        return True
    if not (city or "").strip():
        return True
    return city.strip().lower() in p
