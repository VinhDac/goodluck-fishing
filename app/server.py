"""THE APP'S OWN LITTLE SERVER (PLAN.md 15, step 1): it hands the game its pages (the same game as the web's), and stands
between the game and the fleet: the game sends the boats out (/api/fleet/start), asks what has happened since it last
asked (/api/fleet/poll), calls them home (/api/fleet/stop), and, when a cloud is hooked, asks whether its posting is still
up (/api/check). A job's own page it opens in the person's browser (/api/open), never in the game's window. Only this
computer can reach it (127.0.0.1). Standard library alone.
"""

from __future__ import annotations

import json
import mimetypes
import threading
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from .fleet import Fleet
from .sources import HERE, still_open

GAME = {"index.html", "manifest.webmanifest", "skills.json"}                  # the files of the game it serves, and its folders
FOLDERS = {"css", "js", "img"}
VERSION = "0.1.0"


def make(data: Path, port: int = 0) -> ThreadingHTTPServer:
    fleet = Fleet(data)
    state = {"framed": False}                                             # the window draws no frame: the page draws the bar

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):  # quiet
            pass

        def _json(self, obj, code=200):
            body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _body(self) -> dict:
            n = int(self.headers.get("Content-Length") or 0)
            try:
                return json.loads(self.rfile.read(n).decode("utf-8")) if n else {}
            except ValueError:
                return {}

        def do_GET(self):  # noqa: N802
            u = urllib.parse.urlparse(self.path)
            q = urllib.parse.parse_qs(u.query)
            if u.path == "/api/hello":
                return self._json({"app": True, "version": VERSION})
            if u.path == "/api/fleet/poll":
                return self._json(fleet.poll(int((q.get("after") or ["0"])[0] or 0)))
            if u.path == "/api/check":
                return self._json({"open": still_open((q.get("id") or [""])[0])})
            self._file(u.path)

        def do_POST(self):  # noqa: N802
            u = urllib.parse.urlparse(self.path)
            if not self._own():                                             # the game's own page alone sends, stops, opens
                return self._json({"ok": False}, 403)
            b = self._body()
            if u.path == "/api/fleet/start":
                fleet.start(b.get("titles") or [], b.get("city") or "", bool(b.get("remote")), b.get("first") or [], b.get("boats"))
                return self._json({"ok": True})
            if u.path == "/api/fleet/stop":
                threading.Thread(target=fleet.stop, daemon=True).start()
                return self._json({"ok": True})
            if u.path == "/api/open":                                       # a job's page, in the person's own browser
                url = str(b.get("url") or "")
                p = urllib.parse.urlparse(url)
                if p.scheme not in ("http", "https") or not p.netloc:
                    return self._json({"ok": False}, 400)
                webbrowser.open(url, new=2)
                return self._json({"ok": True})
            self.send_error(404)

        def _own(self) -> bool:
            """Asked by the game's own page: no other site's page can start the search, stop it, or have this computer open
            things. A page elsewhere sends its own Origin, and its JSON is held back by the browser (no CORS here)."""
            origin = self.headers.get("Origin")
            mine = f"http://127.0.0.1:{self.server.server_address[1]}"
            return (origin is None or origin == mine) and (self.headers.get("Content-Type") or "").startswith("application/json")

        def _file(self, path: str):
            rel = path.lstrip("/") or "index.html"
            parts = Path(rel).parts
            if ".." in parts or not parts or not (rel in GAME or parts[0] in FOLDERS):
                return self.send_error(404)
            f = HERE / rel
            if not f.is_file():
                return self.send_error(404)
            body = f.read_bytes()
            if rel == "index.html":                                         # the game knows it is in the app (and draws its title bar)
                mark = b"window.GLF_APP = true;" + (b" window.GLF_FRAME = true;" if state["framed"] else b"")
                body = body.replace(b"<head>", b"<head>\n  <script>" + mark + b"</script>", 1)
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(f.name)[0] or "application/octet-stream")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    srv.daemon_threads = True
    srv.fleet = fleet
    srv.state = state
    return srv
