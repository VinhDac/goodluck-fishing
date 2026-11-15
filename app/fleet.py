"""THE FLEET (PLAN.md 16: «chơi và tìm là một»): the boats that go out when the person sends them, each one a real search.
A boat is a system of company boards (Greenhouse, Lever, Ashby): it reads its boards a few at a time, keeps the jobs that
fit the person's titles and place, and says each one the moment it finds it; the game raises a cloud for it then, from
that boat. The boards that brought jobs before are read first; then the rest, the biggest first. A boat comes home when
its boards are read, or at sunset. Nothing is kept of the person here but which boards brought them jobs (hits.json).
Standard library alone.
"""

from __future__ import annotations

import json
import threading
import time
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
from pathlib import Path

from .sources import HERE, read_board, read_words, finish, title_fits, place_fits

BOARDS = HERE / "store" / "boards.json"
BOATS = {"greenhouse": "Greenhouse", "lever": "Lever", "ashby": "Ashby"}     # each system of boards, one boat
CREW = 10                                                                     # boards read at once by each boat
FRESH_DAYS = 30


class Fleet:
    def __init__(self, data: Path):
        self.data = data
        self.lock = threading.Lock()
        self.events: list = []
        try:
            counts = json.loads(BOARDS.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            counts = {}
        size = {k: sum(1 for b, n in counts.items() if n and b.startswith(k + ":")) for k in BOATS}   # each boat's boards
        self.boats: dict = {k: {"name": n, "state": "moored", "read": 0, "total": size[k], "found": 0} for k, n in BOATS.items()}
        self.stop_flag = threading.Event()
        self.threads: list = []
        self.seen: set = set()

    # ---- what happened, for the game to ask: every event after the one it last saw, and the boats as they are -------------
    def _say(self, **e):
        with self.lock:
            e["seq"] = len(self.events) + 1
            self.events.append(e)

    def poll(self, after: int) -> dict:
        with self.lock:
            return {"events": self.events[after:], "boats": {k: dict(v) for k, v in self.boats.items()}}

    # ---- out: every boat at once, for these titles and this place; the boards to read first, if the game knows them ------
    def start(self, titles: list, city: str, remote: bool, first: list | None = None, boats: list | None = None) -> None:
        self.stop()
        with self.lock:
            self.events, self.seen = [], set()
        self.stop_flag = threading.Event()
        try:
            counts = json.loads(BOARDS.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            counts = {}
        hits = self._hits()
        first = set(first or [])
        for system in boats or list(BOATS):
            keys = [k for k, n in counts.items() if n and k.startswith(system + ":")]
            # first the boards the game knows have jobs for them, then those that brought them jobs before, then the biggest
            keys.sort(key=lambda k: (k not in first, -hits.get(k, 0), counts.get(k, 0)))      # then the small ones: quick to read
            with self.lock:
                self.boats[system].update(state="out", read=0, total=len(keys), found=0)
            t = threading.Thread(target=self._sail, args=(system, keys, titles, city, remote), daemon=True)
            self.threads.append(t)
            t.start()
            self._say(kind="out", boat=system, total=len(keys))

    def stop(self) -> None:
        self.stop_flag.set()
        for t in self.threads:
            t.join(timeout=15)
        self.threads = []

    def _sail(self, system: str, keys: list, titles: list, city: str, remote: bool) -> None:
        found_on = {}
        since = time.time() - FRESH_DAYS * 86400
        with ThreadPoolExecutor(CREW) as pool:
            todo, running = list(keys), {}
            while (todo or running) and not self.stop_flag.is_set():
                while todo and len(running) < CREW:
                    k = todo.pop(0)
                    running[pool.submit(self._board, k, titles, city, remote, since)] = k
                done, _ = wait(list(running), timeout=1, return_when=FIRST_COMPLETED)
                for f in done:
                    k = running.pop(f)
                    try:
                        jobs = f.result()
                    except Exception:  # noqa: BLE001  a board that fails is a board with nothing today
                        jobs = []
                    n = 0
                    for j in jobs:
                        same = (j["company"].lower(), j["title"].lower(), j["place"].lower())
                        with self.lock:
                            if j["id"] in self.seen or same in self.seen:
                                continue
                            self.seen.update({j["id"], same})
                        j = finish(j)
                        if j["agency"]:
                            continue
                        n += 1
                        self._say(kind="job", boat=system, job=j)
                    if n:
                        found_on[k] = n
                    with self.lock:
                        b = self.boats[system]
                        b["read"] += 1
                        b["found"] += n
            for f in running:
                f.cancel()
        with self.lock:
            b = self.boats[system]
            b["state"] = "home"
            found = b["found"]
        self._remember(found_on)
        self._say(kind="home", boat=system, found=found, stopped=self.stop_flag.is_set())

    @staticmethod
    def _board(key: str, titles: list, city: str, remote: bool, since: float) -> list:
        """One board read (lightly), kept to the jobs that fit the person, those then read in full."""
        keep = [j for j in read_board(key, light=True)
                if j["url"] and not (j["posted"] and j["posted"] < since)
                and title_fits(j["title"], titles) and place_fits(j["place"], city, remote)]
        return [read_words(j) for j in keep]

    # ---- which boards brought this person jobs, so they are read first next time -------------------------------------------
    def _hits(self) -> dict:
        try:
            return json.loads((self.data / "hits.json").read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {}

    def _remember(self, found_on: dict) -> None:
        with self.lock:
            hits = self._hits()
            for k, n in found_on.items():
                hits[k] = hits.get(k, 0) + n
            try:
                self.data.mkdir(parents=True, exist_ok=True)
                (self.data / "hits.json").write_text(json.dumps(hits), encoding="utf-8")
            except OSError:
                pass
