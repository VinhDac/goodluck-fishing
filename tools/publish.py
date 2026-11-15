"""THE STORE AS FILES (Vin, 15/11/2026: «đổi sang cách file tĩnh»). The harvest (data/jobs.jsonl) written as a few
static files, one for each part of the world and one for the remote jobs, which the game reads straight from GitHub: no
query to a database, nothing to time out, the person's titles never asked of any server (they filter on their device).

    python tools/publish.py            -> store/out/<region>.json and store/out/index.json

Kept: the jobs posted in the last 30 days, no recruitment agency's, each as [id, company, title, place, url, posted
(seconds), {skill: times asked}]. A job in a city of a region goes to that region; one remote with no city named, to
remote.json. Standard library alone.
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
JOBS = HERE / "data" / "jobs.jsonl"
OUT = HERE / "store" / "out"
DAYS = 30
# each region by the words a place names it with (its countries, its codes, its big cities)
REGIONS = {
    "uk": r"\b(?:uk|u\.k\.|united kingdom|england|scotland|wales|northern ireland|great britain|london|manchester|edinburgh|"
          r"glasgow|bristol|cambridge|oxford|leeds|birmingham|belfast|cardiff|reading|brighton|newcastle|liverpool|sheffield)\b",
    "ie": r"\b(?:ireland|dublin|cork|galway)\b",
    "us": r"\b(?:usa|u\.s\.|united states|new york|nyc|san francisco|bay area|seattle|boston|austin|chicago|los angeles|denver|"
          r"atlanta|miami|washington|palo alto|mountain view|menlo park|san jose|san diego|dallas|houston|philadelphia|"
          r"portland|salt lake|raleigh|pittsburgh|minneapolis|detroit|phoenix|[A-Z][a-z]+,\s?(?:CA|NY|WA|MA|TX|IL|CO|GA|FL|NC|PA|OR|UT|VA|NJ|MN|AZ|MI|OH|DC))\b",
    "ca": r"\b(?:canada|toronto|vancouver|montreal|ottawa|calgary|waterloo)\b",
    "de": r"\b(?:germany|deutschland|berlin|munich|münchen|hamburg|frankfurt|cologne|köln|stuttgart)\b",
    "fr": r"\b(?:france|paris|lyon)\b",
    "nl": r"\b(?:netherlands|amsterdam|rotterdam|utrecht|the hague)\b",
    "es": r"\b(?:spain|madrid|barcelona|valencia|málaga|malaga)\b",
    "eu": r"\b(?:switzerland|zurich|zürich|geneva|sweden|stockholm|denmark|copenhagen|norway|oslo|finland|helsinki|poland|"
          r"warsaw|krakow|portugal|lisbon|porto|italy|milan|rome|austria|vienna|belgium|brussels|czech|prague|estonia|tallinn|"
          r"romania|bucharest|greece|athens|hungary|budapest)\b",
    "asia": r"\b(?:singapore|india|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|japan|tokyo|hong kong|china|shanghai|"
            r"beijing|korea|seoul|vietnam|hanoi|ho chi minh|taiwan|taipei|philippines|manila|indonesia|jakarta|malaysia|kuala lumpur|"
            r"thailand|bangkok|uae|dubai|abu dhabi|israel|tel aviv)\b",
    "oceania": r"\b(?:australia|sydney|melbourne|brisbane|perth|new zealand|auckland)\b",
    "latam": r"\b(?:brazil|são paulo|sao paulo|mexico|mexico city|argentina|buenos aires|colombia|bogota|chile|santiago)\b",
}
RX = {k: re.compile(v, re.I if k != "us" else 0) for k, v in REGIONS.items()}
US_WORDS = re.compile(REGIONS["us"].split("|[A-Z]")[0] + r")\b", re.I)          # the US's words, any case
REMOTE = re.compile(r"\bremote\b|\banywhere\b|work from home", re.I)


def pretty(company: str) -> str:
    """A company as people write it: Lever's and Ashby's boards give only their address («hims-and-hers»)."""
    if company and (company.islower() or re.search(r"[-_]", company)) and " " not in company:
        return " ".join(w[:1].upper() + w[1:] for w in re.split(r"[-_]+", company) if w)
    return company


def regions_of(place: str) -> list:
    out = [k for k, rx in RX.items() if rx.search(place)]
    if "us" not in out and US_WORDS.search(place):
        out.append("us")
    return out


def main() -> int:
    since = time.time() - DAYS * 86400
    files = {k: [] for k in [*REGIONS, "remote", "other"]}
    for line in JOBS.open(encoding="utf-8", newline="\n"):
        if not line.strip():
            continue
        j = json.loads(line)
        if j.get("agency") or not j.get("posted") or j["posted"] < since:
            continue
        row = [j["id"], pretty(j["company"]), j["title"], j["place"], j["url"], j["posted"], j["skills"]]
        where = regions_of(j["place"])
        for k in where:
            files[k].append(row)
        if REMOTE.search(j["place"]) and not where:
            files["remote"].append(row)
        elif not where:
            files["other"].append(row)
    OUT.mkdir(parents=True, exist_ok=True)
    index = {"updated": int(time.time()), "days": DAYS, "files": {}}
    for k, rows in files.items():
        rows.sort(key=lambda r: -r[5])
        (OUT / f"{k}.json").write_text(json.dumps({"updated": index["updated"], "jobs": rows}, ensure_ascii=False, separators=(",", ":")),
                                       encoding="utf-8")
        index["files"][k] = len(rows)
    (OUT / "index.json").write_text(json.dumps(index), encoding="utf-8")
    sizes = {k: f"{n} jobs, {round((OUT / f'{k}.json').stat().st_size / 1e6, 2)} MB" for k, n in index["files"].items()}
    print(json.dumps(sizes, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
