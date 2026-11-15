// THE PIXEL TOOLS EVERY SCENE DRAWS WITH (the office, the pier, the sky): rectangles, dots, filled ellipses row by row,
// lines, polygons, and a small font 5 pixels high, all on whole pixels so the picture stays sharp when scaled up.

export const FONT = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'], ':': ['.', '#', '.', '#', '.'], '.': ['.', '.', '.', '.', '#'],
  ',': ['.', '.', '.', '#', '#'], '!': ['#', '#', '#', '.', '#'], '-': ['...', '...', '###', '...', '...'],
  '_': ['...', '...', '...', '...', '###'], '^': ['.#.', '###', '.#.', '.#.', '.#.'], ' ': ['..', '..', '..', '..', '..'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'], '<': ['..#', '.#.', '#..', '.#.', '..#'], '&': ['.#.', '#.#', '.#.', '#.#', '.##'],
  '+': ['...', '.#.', '###', '.#.', '...'], '#': ['#.#', '###', '#.#', '###', '#.#'], "'": ['#', '#', '.', '.', '.'],
};

export function makePix(ctx) {
  let c = ctx;
  const t = {
    use(x) { const was = c; c = x; return was; },                  // draw on another context (a layer), give back the last
    get ctx() { return c; },
    R(x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
    P(x, y, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); },
    ell(cx, cy, rx, ry, col) {                                     // a filled ellipse, row by row: pixel edges
      c.fillStyle = col;
      for (let y = -ry; y <= ry; y++) {
        const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
        c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
      }
    },
    line(x0, y0, x1, y1, col, w = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      c.fillStyle = col;
      for (let i = 0; i <= n; i++) c.fillRect(Math.round(x0 + ((x1 - x0) * i) / n - (w >> 1)), Math.round(y0 + ((y1 - y0) * i) / n - (w >> 1)), w, w);
    },
    poly(pts, col) { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); },
    textW: (s) => [...s].reduce((n, ch) => n + (FONT[ch] || FONT[' '])[0].length + 1, -1),
    text(s, x, y, col) {
      c.fillStyle = col;
      for (const ch of s) {
        const f = FONT[ch] || FONT[' '];
        f.forEach((row, j) => [...row].forEach((b, i) => { if (b === '#') c.fillRect(Math.round(x + i), Math.round(y + j), 1, 1); }));
        x += f[0].length + 1;
      }
    },
    // a cloud of the sky's kind: round lumps, a lit top, a shaded underside
    puff(cx, cy, r, top = '#ffffff', under = '#dfe8f4') {
      t.ell(cx, cy + 1, r, Math.max(1, Math.round(r * 0.55)), under);
      t.ell(cx - r * 0.5, cy - r * 0.15, Math.round(r * 0.6), Math.round(r * 0.45), top);
      t.ell(cx + r * 0.35, cy - r * 0.3, Math.round(r * 0.55), Math.round(r * 0.5), top);
      t.ell(cx, cy - 1, Math.round(r * 0.85), Math.max(1, Math.round(r * 0.4)), top);
    },
  };
  return t;
}

// a number from a seed, the same every time: the city and the clouds are made up, but always made up the same way
export const hash = (n) => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
