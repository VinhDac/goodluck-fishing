"""GOODLUCK FISHING, THE APP (PLAN.md 15, step 1): the game in a window of its own, with its fleet on this computer.

    python -m app            -> the window (pywebview when it is there, else the person's own browser)
    python -m app --browser  -> in the browser, always (for trying it)
    python -m app --serve    -> the server alone, nothing opened (for tests: GLF_PORT sets its port)

The person's things (the bucket, the CV, which boards brought them jobs) stay on this computer: in the window's own
storage and in the data folder (%LOCALAPPDATA%\\goodluck-fishing on Windows, ~/.goodluck-fishing elsewhere).
"""

from __future__ import annotations

import os
import sys
import threading
import webbrowser
from pathlib import Path

from .server import make


def data_folder() -> Path:
    if os.environ.get("GLF_DATA"):                                      # another folder, for trying it on other data
        return Path(os.environ["GLF_DATA"])
    base = os.environ.get("LOCALAPPDATA")
    return Path(base) / "goodluck-fishing" if base else Path.home() / ".goodluck-fishing"


def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    data = data_folder()
    data.mkdir(parents=True, exist_ok=True)
    srv = make(data, int(os.environ.get("GLF_PORT", "0")))
    url = f"http://127.0.0.1:{srv.server_address[1]}/"
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    print(f"GoodLuck Fishing at {url}", flush=True)
    if "--serve" in argv:
        try:
            threading.Event().wait()
        except KeyboardInterrupt:
            pass
        return 0
    try:
        if "--browser" in argv:
            raise ImportError
        import webview  # pywebview: the one package from outside, with the browser as its fallback
        webview.create_window("GoodLuck Fishing", url, width=1280, height=760, min_size=(640, 400), background_color="#0c0f24")
        webview.start(private_mode=False, storage_path=str(data / "window"))
    except ImportError:
        webbrowser.open(url)
        try:
            threading.Event().wait()
        except KeyboardInterrupt:
            pass
    srv.fleet.stop()
    srv.shutdown()
    return 0
