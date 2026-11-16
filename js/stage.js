// THE STAGE (PLAN.md 18; Vin, 15/11: «quan trọng nhất là chuyển động hiện tại kém quá»). The picture keeps its big square
// pixels, but nothing moves by whole pixels any more. Each layer (the sky, the far city, each row of the city) and each
// sprite (a letter, the boat, the duck, a car, the gull) is drawn at the art's own size, then set on the screen where it
// really is, to the screen's own pixel: a letter drifting seven art pixels a second slides, where it used to jump three or
// four screen pixels at a time. The canvas is the window's own size in device pixels, K of them to an art pixel, K whole.

import { makePix } from './pix.js';

export function makeStage(canvas, { tall = 216, narrow = 195 } = {}) {
  const g = canvas.getContext('2d', { alpha: false });
  const st = { g, canvas, K: 1, W: 0, H: 0, DW: 0, DH: 0, dpr: 1 };
  const layers = new Map(), kept = new Map();
  const scratch = document.createElement('canvas');
  const dev = (v) => Math.round(v * st.K);                         // a place in art pixels, to the device pixel

  // the window's size: about 216 art pixels high on a computer, 195 wide on a phone, each K device pixels square
  st.fit = function fit() {
    const dpr = window.devicePixelRatio || 1, box = canvas.parentElement && canvas.parentElement.getBoundingClientRect();
    const iw = box && box.width ? box.width : innerWidth, ih = box && box.height ? box.height : innerHeight;   // its box: under the app's title bar, if any
    const DW = Math.max(1, Math.round(iw * dpr)), DH = Math.max(1, Math.round(ih * dpr));
    const K = Math.max(1, iw >= ih ? Math.floor(DH / tall) : Math.round(DW / narrow));   // a phone: the nearest whole size
    Object.assign(st, { dpr, DW, DH, K, W: Math.ceil(DW / K), H: Math.ceil(DH / K) });
    canvas.width = DW; canvas.height = DH;
    canvas.style.width = `${iw}px`; canvas.style.height = `${ih}px`;
    g.imageSmoothingEnabled = false;
    return st;
  };

  // a layer behind everything: a canvas the art's size, two pixels wider, so set a fraction to the left it leaves no gap
  st.layer = function layer(name, pad = 2) {
    let l = layers.get(name);
    if (!l) { const c = document.createElement('canvas'), lg = c.getContext('2d'); l = { c, g: lg, px: makePix(lg) }; layers.set(name, l); }
    const w = st.W + pad, h = st.H;
    if (l.c.width !== w || l.c.height !== h) { l.c.width = w; l.c.height = h; } else l.g.clearRect(0, 0, w, h);
    l.g.imageSmoothingEnabled = false;
    return l;
  };
  st.blit = function blit(l, x = 0, y = 0, alpha = 1) {
    if (alpha < 1) g.globalAlpha = alpha;
    g.drawImage(l.c, dev(x), dev(y), l.c.width * st.K, l.c.height * st.K);
    if (alpha < 1) g.globalAlpha = 1;
  };

  // a sprite: drawn by fn(px, ox, oy) on a w × h canvas the art's size, its point (ox, oy) set at (x, y) on the screen.
  // One that never changes (a letter's wing beat, a car) is kept under its key and drawn once; the rest, every frame.
  st.sprite = function sprite(x, y, w, h, ox, oy, fn, key, alpha = 1, op) {
    let c = key ? kept.get(key) : null;
    if (!c) {
      c = key ? document.createElement('canvas') : scratch;
      c.width = w; c.height = h;                                    // a new size clears it
      const cg = c.getContext('2d'); cg.imageSmoothingEnabled = false;
      fn(makePix(cg), ox, oy);
      if (key) kept.set(key, c);
    }
    if (alpha <= 0) return;
    if (alpha < 1) g.globalAlpha = alpha;
    if (op) g.globalCompositeOperation = op;
    g.drawImage(c, dev(x - ox), dev(y - oy), w * st.K, h * st.K);
    if (op) g.globalCompositeOperation = 'source-over';
    if (alpha < 1) g.globalAlpha = 1;
  };

  // an art pixel (or a square of n), set to the device pixel: the line, the rod, sparks
  st.dot = function dot(x, y, col, n = 1) { g.fillStyle = col; g.fillRect(dev(x), dev(y), Math.round(n * st.K), Math.round(n * st.K)); };
  st.fill = function fill(col, x = 0, y = 0, w = st.W, h = st.H) { g.fillStyle = col; g.fillRect(dev(x), dev(y), Math.ceil(w * st.K), Math.ceil(h * st.K)); };
  // a pointer, in art pixels
  st.toArt = function toArt(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * st.dpr) / st.K, y: ((e.clientY - r.top) * st.dpr) / st.K };
  };
  return st;
}
