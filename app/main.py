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
import time
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
        framed = sys.platform == "win32"                                 # Windows: the game's own title bar (app/frame.py)
        srv.state["framed"] = framed
        api = Api()
        win = webview.create_window(NAME, url, width=1280, height=760, min_size=(640, 400), background_color="#0c0f24",
                                    frameless=framed, easy_drag=False, js_api=api)
        api._window = win
        if framed:
            win.events.shown += lambda: threading.Thread(target=dress, args=(api,), daemon=True).start()
        webview.start(private_mode=False, storage_path=str(data / "window"))
    except Exception:                                                    # not there, or its toolkit would not load (16/11:
        srv.state["framed"] = False                                      # a package named Microsoft shadowed pythonnet's): the browser
        webbrowser.open(url)
        try:
            threading.Event().wait()
        except KeyboardInterrupt:
            pass
    srv.fleet.stop()
    srv.shutdown()
    return 0


NAME = "GoodLuck Fishing"


class Api:
    """What the page's title bar calls: window.pywebview.api.<name>(). Every attribute is PRIVATE: pywebview walks the
    public ones of a js_api object, and walking into a Window hangs it (GoodLuck's winview.Api)."""

    def __init__(self) -> None:
        self._window = None
        self._frame = None

    def drag(self, code):
        return bool(self._frame and self._frame.start_drag(code))

    def minimize(self):
        self._window.minimize()
        return True

    def maximize(self):
        """Maximize, or restore if it already is: the NEW state, for the button's picture."""
        was = bool(self._frame and self._frame.maximized())
        self._window.restore() if was else self._window.maximize()
        return not was

    def maximized(self):
        return bool(self._frame and self._frame.maximized())

    def close(self):
        self._window.destroy()
        return True


def dress(api: Api) -> None:
    """The window just shown, found by its title, given the frame's patches and the duck for its icon."""
    from .frame import Frame, find_window, set_icons
    hwnd, end = None, time.monotonic() + 20                              # a cold first start is slow
    while not hwnd and time.monotonic() < end:
        hwnd = find_window(os.getpid(), NAME)
        if not hwnd:
            time.sleep(0.1)
    if not hwnd:
        return
    time.sleep(0.15)                                                     # let it settle, then patch
    frame = Frame()
    if frame.patch(hwnd):
        api._frame = frame
    set_icons(hwnd, Path(__file__).resolve().parent.parent / "img" / "duck-64.png")
    frame.front()
