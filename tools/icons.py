"""THE PICTURES OUTSIDE THE GAME: the tab's icon, the phone's home-screen icon, and the card a shared link shows. Drawn
from the game's own yellow duck (js/art.js, read here so there is one duck), pixel by pixel, written as PNG.

    python tools/icons.py        -> img/duck-64.png, img/icon-180.png, img/icon-192.png, img/icon-512.png, img/card.png

Standard library alone.
"""

from __future__ import annotations

import math
import re
import struct
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
OUT = HERE / "img"
NIGHT = (12, 15, 36)


def hexc(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def duck() -> list:
    """The awake duck of js/art.js: its rows and its inks, as rows of colours (None where it is clear)."""
    js = (HERE / "js" / "art.js").read_text(encoding="utf-8")
    rows = re.findall(r"'([.a-zA-Z]+)'", js.split("export const DUCK = [")[1].split("];")[0])
    ink = {k: hexc(v) for k, v in re.findall(r"(\w): '(#[0-9a-f]{6})'", js.split("export const INK = ")[1].split(";")[0])}
    ink["E"] = hexc("#1b1f3a")
    return [[ink.get(ch) for ch in r] for r in rows]


class Pic:
    def __init__(self, w: int, h: int, bg=None):
        self.w, self.h = w, h
        self.px = [[bg] * w for _ in range(h)]

    def dot(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h and c:
            self.px[y][x] = c

    def rect(self, x, y, w, h, c):
        for yy in range(int(round(y)), int(round(y + h))):
            for xx in range(int(round(x)), int(round(x + w))):
                self.dot(xx, yy, c)

    def sprite(self, rows, x, y, k=1):
        for j, r in enumerate(rows):
            for i, c in enumerate(r):
                if c:
                    self.rect(x + i * k, y + j * k, k, k, c)

    def blob(self, cx, cy, r, c):
        """A cloud as the game draws one (js/sky.js blob): four rounds."""
        for dx, dy, k in [(0, 0, 1), (-r * .8, r * .25, .7), (r * .8, r * .25, .7), (-r * .35, -r * .35, .7)]:
            rr = r * k
            y = -rr
            while y <= rr:
                w = round(rr * math.sqrt(max(0, 1 - (y * y) / (rr * rr))))
                self.rect(round(cx + dx - w), round(cy + dy + y), w * 2 + 1, 1, c)
                y += 1

    def line(self, x0, y0, x1, y1, c):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) or 1
        for i in range(n + 1):
            self.dot(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c)

    def scaled(self, k: int) -> "Pic":
        p = Pic(self.w * k, self.h * k)
        p.px = [[c for c in row for _ in range(k)] for row in self.px for _ in range(k)]
        return p

    def png(self, path: Path):
        raw = b"".join(b"\0" + b"".join(bytes((*c, 255)) if c else b"\0\0\0\0" for c in row) for row in self.px)
        chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
        path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0))
                         + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


# a small pixel font, 7 rows high, for the card's words
FONT = {
    "G": [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "C": [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
    "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    "I": ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
    "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
    "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
    "B": ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
    "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
    "V": ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    " ": ["..", "..", "..", "..", "..", "..", ".."],
}


def words_w(s: str, k: int) -> int:
    return sum((len(FONT[ch][0]) + 1) * k for ch in s) - k


def words(p: Pic, s: str, x, y, k, c, edge):
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (1, 1)]:           # an outline, then the letters
        words_at(p, s, x + dx, y + dy, k, edge)
    words_at(p, s, x, y, k, c)


def words_at(p, s, x, y, k, c):
    for ch in s:
        g = FONT[ch]
        for j, r in enumerate(g):
            for i, b in enumerate(r):
                if b == "#":
                    p.rect(x + i * k, y + j * k, k, k, c)
        x += (len(g[0]) + 1) * k


def icon(size: int, k: int, bg) -> Pic:
    d = duck()
    p = Pic(size, size, bg)
    p.sprite(d, (size - len(d[0]) * k) // 2, (size - len(d) * k) // 2, k)
    return p


def card() -> Pic:
    """1200 by 630: the sky scene at a fifth of that, scaled up."""
    W, H = 240, 126
    p = Pic(W, H)
    top, bot = (92, 160, 230), (200, 232, 250)
    for b in range(12):
        t = b / 11
        p.rect(0, b * H / 12, W, H / 12 + 1, tuple(round(a + (z - a) * t) for a, z in zip(top, bot)))
    p.blob(224, 48, 7, (255, 243, 176))                                   # the sun
    for i in range(6):
        p.blob((i * 53 + 17) % W, 50 + (i * 19) % 30, 5, (226, 240, 252))
    for i, n in enumerate(range(10)):                                     # the city
        bw, bh = 22, 14 + (i * 37) % 18
        x = 2 + i * 24
        p.rect(x, H - bh, bw, bh, (91, 107, 140))
        for y in range(H - bh + 3, H - 2, 4):
            for xx in range(x + 2, x + bw - 2, 4):
                p.rect(xx, y, 2, 2, (255, 230, 160) if (xx * y) % 7 else (74, 88, 120))
    bx, by = 34, 80                                                       # the boat on its cloud, the duck, the rod
    p.blob(bx + 16, by + 6, 15, (255, 255, 255))
    p.rect(bx + 2, by - 4, 30, 5, (138, 90, 50))
    p.rect(bx + 4, by + 1, 26, 2, (106, 66, 36))
    p.sprite(duck(), bx + 6, by - 19)
    tip = (bx + 30, by - 22)
    p.line(bx + 22, by - 9, *tip, (90, 58, 26))
    for cx, cy, r, c in [(128, 98, 8, (255, 255, 255)), (156, 52, 7, (255, 255, 255)), (178, 82, 11, (255, 214, 90)),
                         (214, 64, 6, (255, 255, 255))]:
        p.blob(cx, cy, r, c)
    p.line(*tip, 176, 78, (255, 255, 255))                                # the line, to the golden cloud
    p.rect(175, 77, 3, 3, (224, 58, 58))
    title, by_ = "GOODLUCK FISHING", "BY VINH DAC"
    words(p, title, (W - words_w(title, 2)) // 2, 10, 2, (255, 216, 74), (122, 74, 18))
    words(p, by_, (W - words_w(by_, 1)) // 2, 30, 1, (255, 255, 255), (58, 42, 26))
    return p.scaled(5)


def main() -> int:
    OUT.mkdir(exist_ok=True)
    icon(64, 3, None).png(OUT / "duck-64.png")
    icon(180, 6, NIGHT).png(OUT / "icon-180.png")
    icon(192, 6, NIGHT).png(OUT / "icon-192.png")
    icon(512, 17, NIGHT).png(OUT / "icon-512.png")
    card().png(OUT / "card.png")
    for f in sorted(OUT.iterdir()):
        print(f.name, f.stat().st_size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
