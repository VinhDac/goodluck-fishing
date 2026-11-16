"""THE SHARE CARD AND THE MOVING PICTURE (PLAN.md 20 E and F): tools/card.html, the game's own sky with made-up jobs, drawn by
Chrome with no window, at the moments chosen here.

    python tools/card.py             img/card.png, 1200 x 630: the card a shared link shows
    python tools/card.py --moving    img/play.gif: the duck fishing a golden letter, for the README (needs Pillow, for the GIF)

The page is served from this folder by a server of its own, on a free port, for as long as the pictures take.
"""

from __future__ import annotations

import functools
import http.server
import shutil
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
CHROMES = [r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
           "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "google-chrome", "chromium"]
CARD_AT = 15.1                                   # seconds in: the golden letter held up, its tag over it
MOVING = [(4.4, 10.2), (12.4, 17.8)]             # the cast, the wait, the bite, the reel begun; the reel's end, the golden letter, into the bag
FPS = 10
MOVING_SIZE = (768, 432)                         # the game's own 384 x 216, two screen pixels to each


def chrome() -> str:
    for c in CHROMES:
        found = shutil.which(c) or (c if Path(c).exists() else None)
        if found:
            return found
    sys.exit("Chrome was not found.")


def serve() -> http.server.ThreadingHTTPServer:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(HERE)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def shot(url: str, out: Path, size: tuple, profile: str) -> None:
    subprocess.run([chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    f"--user-data-dir={profile}", f"--window-size={size[0]},{size[1]}", "--virtual-time-budget=8000",
                    f"--screenshot={out}", url], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
    if not out.exists():
        sys.exit(f"Chrome made no picture of {url}")


def main(argv: list) -> int:
    srv = serve()
    base = f"http://127.0.0.1:{srv.server_address[1]}/tools/card.html"
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        profile = str(Path(tmp) / "chrome")
        if "--moving" not in argv:
            out = HERE / "img" / "card.png"
            shot(f"{base}?card&at={CARD_AT}", out, (1200, 630), profile)
            print(f"{out.relative_to(HERE)}: {out.stat().st_size // 1024} KB")
            return 0
        from PIL import Image                                           # only for the GIF
        frames = []
        times = [round(a + i / FPS, 3) for a, b in MOVING for i in range(int(round((b - a) * FPS)))]
        for n, t in enumerate(times):
            f = Path(tmp) / f"f{n:03d}.png"
            shot(f"{base}?at={t}", f, MOVING_SIZE, profile)
            frames.append(Image.open(f).convert("RGB"))
            print(f"\r{n + 1} of {len(times)}", end="", flush=True)
        print()
        pal = frames[len(frames) // 2].quantize(colors=255, method=Image.Quantize.MEDIANCUT)   # one palette for all: no flicker
        gif = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
        out = HERE / "img" / "play.gif"
        gif[0].save(out, save_all=True, append_images=gif[1:], duration=int(1000 / FPS), loop=0, optimize=True, disposal=1)
        print(f"{out.relative_to(HERE)}: {len(gif)} frames, {out.stat().st_size // 1024} KB")
    srv.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
