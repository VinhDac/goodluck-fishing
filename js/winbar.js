// THE APP'S TITLE BAR ON WINDOWS (Vin, 16/11: «custom cho tôi title bar cho đẹp cho khớp với game đi»): the window's own
// frame is taken off (app/frame.py) and the page draws the bar the way the game draws its signs on the roofs: the night, a
// thin gold line, the duck, the name in yellow pixel letters, three plain buttons. The page starts the drag, the resize at
// the edges and the buttons; Windows runs them itself, Aero Snap and double-click to maximize included (GoodLuck's live.js
// wireWindow, itself Jenifer Studio's, copied). Only in the app on Windows (window.GLF_FRAME, set by app/server.py).

import { DUCK, INK } from './art.js';

const EDGE = 6;                                                      // a framed window's own border, in the page's pixels
const HT = { left: 10, right: 11, top: 12, topLeft: 13, topRight: 14, bottom: 15, bottomLeft: 16, bottomRight: 17, caption: 2 };
const CURSOR = { 10: 'ew-resize', 11: 'ew-resize', 12: 'ns-resize', 15: 'ns-resize', 13: 'nwse-resize', 17: 'nwse-resize', 14: 'nesw-resize', 16: 'nesw-resize' };
// the buttons' pictures, in whole pixels as the game's are
const GLYPH = {
  min: '<svg width="10" height="10" viewBox="0 0 10 10" shape-rendering="crispEdges"><rect x="0" y="7" width="10" height="2" fill="currentColor"/></svg>',
  max: '<svg width="10" height="10" viewBox="0 0 10 10" shape-rendering="crispEdges"><path fill="currentColor" fill-rule="evenodd" d="M0 0h10v10H0zM1 3h8v6H1z"/></svg>',
  restore: '<svg width="10" height="10" viewBox="0 0 10 10" shape-rendering="crispEdges"><path fill="currentColor" fill-rule="evenodd" d="M2 0h8v8H8V2H2zM0 2h8v8H0zM1 4h6v5H1z"/></svg>',
  close: '<svg width="10" height="10" viewBox="0 0 10 10" shape-rendering="crispEdges"><path fill="currentColor" d="M0 0h2v2H0zM2 2h2v2H2zM4 4h2v2H4zM6 6h2v2H6zM8 8h2v2H8zM8 0h2v2H8zM6 2h2v2H6zM2 6h2v2H2zM0 8h2v2H0z"/></svg>',
};

export function winbar() {
  if (!window.GLF_FRAME) return false;
  document.body.classList.add('framed');
  const bar = document.getElementById('winbar');
  bar.hidden = false;
  // the duck, crisp: a whole number of the screen's pixels to each of its own
  const c = document.getElementById('winDuck'), k = Math.max(1, Math.round(window.devicePixelRatio || 1)), w = DUCK[0].length, h = DUCK.length;
  c.width = w * k; c.height = h * k; c.style.width = `${(w * k) / (window.devicePixelRatio || 1)}px`; c.style.height = `${(h * k) / (window.devicePixelRatio || 1)}px`;
  const g = c.getContext('2d'), ink = { ...INK, E: '#1b1f3a' };
  DUCK.forEach((row, y) => [...row].forEach((ch, x) => { if (ink[ch]) { g.fillStyle = ink[ch]; g.fillRect(x * k, y * k, k, k); } }));
  const maxBtn = bar.querySelector('[data-win="max"]');
  bar.querySelector('[data-win="min"]').innerHTML = GLYPH.min;
  bar.querySelector('[data-win="close"]').innerHTML = GLYPH.close;

  const api = () => window.pywebview && window.pywebview.api;
  let zoomed = false, last = { t: 0, x: 0, y: 0 }, shown = '';
  const markZoomed = (on) => { zoomed = !!on; maxBtn.innerHTML = zoomed ? GLYPH.restore : GLYPH.max; maxBtn.title = zoomed ? 'Restore' : 'Maximize'; };
  markZoomed(false);
  const sync = () => { const a = api(); if (a && a.maximized) a.maximized().then(markZoomed); };
  addEventListener('pywebviewready', sync);
  addEventListener('resize', sync);
  sync();

  const edge = (x, y) => {
    if (zoomed) return null;                                         // a maximized window has no edge to pull
    const W = innerWidth, H = innerHeight, t = y < EDGE, b = y >= H - EDGE, l = x < EDGE, r = x >= W - EDGE;
    if (t && l) return HT.topLeft;
    if (t && r) return HT.topRight;
    if (b && l) return HT.bottomLeft;
    if (b && r) return HT.bottomRight;
    if (l) return HT.left;
    if (r) return HT.right;
    if (t) return HT.top;
    if (b) return HT.bottom;
    return null;
  };
  // ahead of everything else, so a press at an edge is a resize and never falls through to the game under it
  addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const a = api();
    if (!a) return;
    const m = edge(e.clientX, e.clientY);
    if (m !== null) { e.preventDefault(); e.stopPropagation(); a.drag(m); return; }
    if (e.clientY >= bar.getBoundingClientRect().bottom || e.target.closest('[data-nodrag]')) return;
    e.preventDefault();
    // the double click seen at the press: the first press started Windows' drag loop, which swallows the second one
    const now = Date.now(), twice = now - last.t < 500 && Math.abs(e.clientX - last.x) < 6 && Math.abs(e.clientY - last.y) < 6;
    last = { t: twice ? 0 : now, x: e.clientX, y: e.clientY };
    if (twice) { a.maximize().then(markZoomed); return; }
    a.drag(HT.caption);
  }, true);
  addEventListener('mousemove', (e) => {                             // the pointer's shape at the edges, as a framed window's
    const m = edge(e.clientX, e.clientY), cur = m === null ? '' : CURSOR[m];
    if (cur !== shown) { shown = cur; document.documentElement.style.cursor = cur; }
  }, true);
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-win]'), a = api();
    if (!b || !a) return;
    if (b.dataset.win === 'min') a.minimize();
    else if (b.dataset.win === 'max') a.maximize().then(markZoomed);
    else if (b.dataset.win === 'close') a.close();
  });
  return true;
}
