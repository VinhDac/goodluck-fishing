// THE OFFICE, IN DETAIL (PLAN.md 12): 3:47 in the morning, day 214 of the search. The yellow duck asleep face down on
// its keyboard, its beak still typing the cover letter; empty mugs, cold noodles, a wilting plant, a board of rejection
// letters; and at the right, already there, a golden escalator up through the ceiling to the sky, roped off until a CV
// is given. Pixel art seen three quarters on, lit by the desk lamp, the screen and the light from above (the rest of the
// room in the dark). Laid out from the canvas's own size: wide on a computer, tall on a phone.

import { makePix, FONT } from './pix.js';
const FONTROW = (ch) => FONT[ch] || FONT[' '];
import { sleeping, upright, soul } from './ducks.js';
import { drawEscalator } from './escalator.js';

export function makeRoom(g) {
  const px = makePix(g), { R, P, ell, line, poly, text, textW } = px;
  let N = {}, T = 0, S = {};                                          // the person's numbers (js/progress.js), the time, the state
  const spot = (name, x, y, w, h) => { L.spots[name] = { x, y, w, h }; };   // where each thing can be pressed

  // ---- the layout, from the canvas's size -------------------------------------------------------------------------------
  const L = {};
  function layout(W, H) {
    const wide = W >= H;
    L.W = W; L.H = H; L.wide = wide;
    L.ceil = 9;
    L.fy = Math.round(H * (wide ? 0.80 : 0.74));                  // where the wall meets the floor
    // the escalator: from the front of the floor, up and to the right, out of the room into the light
    L.bx = W - (wide ? Math.min(150, Math.round(W * 0.39)) : Math.round(W * 0.43)); L.by = H - 12;
    L.slope = wide ? 0.84 : 0.40;                                  // x moved per pixel climbed (50 degrees; a phone's, 68)
    L.escX = (y) => L.bx + (L.by - y) * L.slope;                   // the steps' front edge at a height
    L.tx = W + 16; L.ty = Math.max(L.ceil - 30, L.by - (L.tx - L.bx) / L.slope);
    L.tx = L.escX(L.ty);
    L.out = L.escX(L.ceil) <= W ? { x: L.escX(L.ceil), y: L.ceil, up: true } : { x: W, y: L.by - (W - L.bx) / L.slope, up: false };
    // the desk, clear of the escalator
    L.deskR = Math.round(L.escX(L.fy) - 12);
    L.deskW = Math.min(wide ? 230 : 150, L.deskR - 6);
    L.deskL = L.deskR - L.deskW;
    L.deskT = L.fy - 34;                                            // the back edge of its top
    L.depth = wide ? 11 : 9;
    L.mon = { w: wide ? 66 : 48, h: wide ? 44 : 38 };
    L.mx = Math.round(L.deskL + L.deskW * (wide ? 0.44 : 0.42));    // the monitor's middle
    L.mcx = L.mx - (wide ? 16 : 10);                               // the monitor's middle, left of the duck
    L.monTop = L.deskT - 6 - L.mon.h;
    // the wall's things, laid in rows from the top left, kept off the escalator and above the screen
    const things = [['window', wide ? 76 : 72, wide ? 54 : 52], ['clock', 21, 21], ['calendar', 29, 34], ['board', 76, 56], ['poster', 30, 42], ['apply', 40, 34]];
    L.wall = {};
    let x = 10, y = 18, row = 0;
    for (const [name, w, h] of things) {
      const limit = Math.min(W - 8, L.escX(y + h) - 34);
      if (x + w > limit) { x = 10; y += row + 12; row = 0; }
      if (y + h > L.monTop - 10 && name !== 'window') continue;      // no room left on this wall
      L.wall[name] = { x, y, w, h };
      x += w + 12; row = Math.max(row, h);
    }
    return L;
  }

  // ---- the wall, the floor, the ceiling ---------------------------------------------------------------------------------
  function walls() {
    const { W, H, fy, ceil } = L;
    R(0, 0, W, fy, '#2a2e58');
    for (let x = 0; x < W; x += 8) R(x, ceil, 1, fy - ceil, '#262a52');            // the wallpaper's stripes
    R(0, fy - 34, W, 34, '#232650'); R(0, fy - 35, W, 2, '#363a6c');                // the panelling, its rail
    for (let x = 4; x < W; x += 22) R(x, fy - 31, 18, 27, '#20234a');
    R(0, fy - 4, W, 4, '#15183a');                                                    // the skirting
    R(0, 0, W, ceil, '#16183a'); R(0, ceil, W, 2, '#30346a');                         // the ceiling, its cornice
    // the floor: boards seen from above, the joints staggered
    R(0, fy, W, H - fy, '#3c2b28');
    for (let y = fy, i = 0; y < H; y += 6, i++) {
      R(0, y, W, 1, '#2f211f');
      for (let x = (i % 2) * 23; x < W; x += 46) R(x, y, 1, 6, '#2f211f');
    }
    R(0, fy, W, 1, '#4c3833');
  }
  function window_(o) {
    const { x, y, w, h } = o;
    R(x - 3, y - 3, w + 6, h + 6, '#3b3462'); R(x, y, w, h, '#0c1033');
    for (let i = 0; i < 9; i++) P(x + 4 + ((i * 37) % (w - 8)), y + 3 + ((i * 13) % (h / 2)), '#c9d0ff');
    ell(x + w - 14, y + 11, 4, 4, '#f6f0c8'); ell(x + w - 12, y + 10, 4, 4, '#0c1033');   // the moon, a crescent
    for (let i = 0; i < 12; i++) {                                                   // the town, its lights still on
      const bw = 6 + (i * 5) % 5, bh = 12 + (i * 17) % 18, bx = x + i * (w / 11) - 2;
      R(bx, y + h - bh, bw, bh, '#161b45');
      for (let yy = y + h - bh + 2; yy < y + h - 2; yy += 3) for (let xx = bx + 1; xx < bx + bw - 1; xx += 2) if ((xx * 7 + yy * 3) % 5 === 0) P(xx, yy, '#ffd27a');
    }
    for (let i = 0; i < 26; i++) {                                                   // the rain
      const rx = x + ((i * 29) % w), ry = y + ((i * 47) % h);
      line(rx, ry, rx - 2, ry + 4, 'rgba(160,190,255,0.35)');
    }
    R(x + w / 2 - 1, y, 3, h, '#3b3462'); R(x, y + h / 2 - 1, w, 3, '#3b3462');      // the frame's cross
    R(x - 5, y + h + 3, w + 10, 3, '#4a4278');                                        // the sill
    spot('window', x, y, w, h);
  }
  function clock(o) {
    const cx = o.x + 10, cy = o.y + 10;
    ell(cx, cy, 10, 10, '#1b1f3a'); ell(cx, cy, 8, 8, '#e9e4d0');
    for (let i = 0; i < 12; i++) P(cx + Math.round(Math.sin(i * Math.PI / 6) * 7), cy - Math.round(Math.cos(i * Math.PI / 6) * 7), '#6a6450');
    const at = 3 * 60 + 47 + Math.floor(S.clockMin || 0), hh = Math.floor(at / 60) % 12, mm = at % 60;   // 3:47, and on by the minutes in the sky
    const hr = (hh + mm / 60) * Math.PI / 6, mn = mm * Math.PI / 30;
    line(cx, cy, cx + Math.sin(hr) * 4, cy - Math.cos(hr) * 4, '#1b1f3a');
    line(cx, cy, cx + Math.sin(mn) * 6, cy - Math.cos(mn) * 6, '#1b1f3a');
    P(cx, cy, '#b03a2a');
    spot('clock', o.x - 1, o.y - 1, 22, 22);
  }
  function calendar(o) {
    const { x, y, w, h } = o;
    R(x + 2, y + 2, w, h, 'rgba(0,0,0,0.3)');                                         // its shadow on the wall
    R(x, y, w, h, '#f1ead6'); R(x, y, w, 9, '#b03a2a');
    const day = `DAY ${N.day || 1}`;                                                  // the days of their search
    text(day, x + (w - textW(day)) / 2, y + 2, '#fff8e7');
    const crossed = Math.min(20, (N.day || 1) - 1);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) {                         // the days gone, crossed out; today
      const cx = x + 3 + k * 5, cy = y + 12 + r * 5, n = r * 5 + k;
      if (n < crossed) { line(cx, cy, cx + 2, cy + 2, '#c0392b'); line(cx + 2, cy, cx, cy + 2, '#c0392b'); }
      else if (n === crossed) { R(cx - 1, cy - 1, 5, 5, '#ffd84a'); R(cx, cy, 3, 3, '#f1ead6'); }
      else R(cx, cy + 1, 3, 1, '#d8d0b8');
    }
    spot('calendar', x, y, w, h);
    R(x + w / 2 - 1, y - 2, 2, 3, '#555');
  }
  function board(o) {
    const { x, y, w, h } = o;
    R(x + 2, y + 2, w, h, 'rgba(0,0,0,0.3)');
    R(x, y, w, h, '#5a3a20'); R(x + 2, y + 2, w - 4, h - 4, '#9a7048');
    for (let i = 0; i < 40; i++) P(x + 3 + ((i * 31) % (w - 6)), y + 3 + ((i * 17) % (h - 6)), '#86603c');
    // the letters: one big one stamped REJECTED, small ones each with its own no
    const paper = (px, py, pw, ph, pin) => {
      R(px + 1, py + 1, pw, ph, 'rgba(0,0,0,0.25)'); R(px, py, pw, ph, '#f4efe2');
      for (let yy = py + 3; yy < py + ph - 2; yy += 2) R(px + 2, yy, pw - 4 - ((yy * 3) % 5), 1, '#b9b3a3');
      ell(px + pw / 2, py + 1, 1, 1, pin);
    };
    const letters = [
      () => { paper(x + 5, y + 5, 34, 24, '#e03a3a'); R(x + 4, y + 13, textW('REJECTED') + 2, 7, '#f4efe2');
        text('REJECTED', x + 5, y + 14, '#c0392b'); R(x + 4, y + 12, textW('REJECTED') + 2, 1, '#c0392b'); R(x + 4, y + 20, textW('REJECTED') + 2, 1, '#c0392b'); },
      () => { paper(x + 43, y + 4, 15, 19, '#3a7be0'); text('NO', x + 47, y + 13, '#c0392b'); },
      () => { paper(x + 8, y + 33, 16, 19, '#e0c03a'); text('SORRY', x + 5, y + 44, '#c0392b'); },
      () => { paper(x + 30, y + 31, 22, h - 36, '#e03a3a'); text('UNFORTU', x + 31, y + 36, '#5a5040'); text('NATELY', x + 31, y + 42, '#5a5040'); },
      () => paper(x + w - 18, y + 8, 13, 17, '#3ae07b'),
      () => { if (w > 70) { paper(x + w - 22, y + 30, 16, 20, '#3a7be0'); line(x + w - 20, y + 34, x + w - 10, y + 44, '#c0392b'); line(x + w - 10, y + 34, x + w - 20, y + 44, '#c0392b'); } },
    ];
    const n = Math.min(letters.length, N.letters || 0);
    letters.slice(0, n).forEach((f) => f());
    if (!n) {                                                                          // nothing let go yet: a note of good luck
      R(x + w / 2 - 15, y + h / 2 - 7, 30, 14, '#fff176'); text('GOOD', x + w / 2 - 7, y + h / 2 - 5, '#8a6a20'); text('LUCK!', x + w / 2 - 9, y + h / 2 + 1, '#8a6a20');
      ell(x + w / 2, y + h / 2 - 7, 1, 1, '#e03a3a');
    }
    spot('board', x, y, w, h);
  }
  function poster(o) {
    const { x, y, w, h } = o;
    R(x + 2, y + 2, w, h, 'rgba(0,0,0,0.3)');
    R(x, y, w, h, '#f1ead6'); R(x + 2, y + 2, w - 4, h - 15, '#9fd0e8');
    line(x + 3, y + 6, x + w - 4, y + 8, '#6a4224', 2);                                // the branch
    R(x + w / 2 - 1, y + 8, 1, 4, '#7a4a12'); R(x + w / 2 + 2, y + 8, 1, 4, '#7a4a12');  // two little feet holding on
    ell(x + w / 2, y + 17, 5, 5, '#ffd84a'); ell(x + w / 2 - 1, y + 22, 6, 4, '#ffd84a');
    P(x + w / 2 - 2, y + 15, '#1b1f3a'); R(x + w / 2 - 7, y + 16, 3, 2, '#f2802a');
    text('HANG IN', x + (w - textW('HANG IN')) / 2, y + h - 12, '#1b1f3a');
    text('THERE', x + (w - textW('THERE')) / 2, y + h - 6, '#1b1f3a');
    spot('poster', x, y, w, h);
  }

  function apply(o) {                                               // a cork board: the letters kept, to apply to
    const { x, y, w, h } = o;
    R(x + 2, y + 2, w, h, 'rgba(0,0,0,0.3)');
    R(x, y, w, h, '#5a3a20'); R(x + 2, y + 2, w - 4, h - 4, '#c49a62');
    for (let i = 0; i < 24; i++) P(x + 3 + ((i * 29) % (w - 6)), y + 3 + ((i * 13) % (h - 6)), '#b0864e');
    R(x + 3, y + 3, w - 6, 7, '#1b1f3a'); text('TO APPLY', x + Math.round((w - textW('TO APPLY')) / 2), y + 4, '#ffd84a');
    const n = Math.min(6, N.keep || 0);
    for (let i = 0; i < n; i++) {                                    // one card for each letter kept
      const cx = x + 4 + (i % 3) * 11, cy = y + 13 + Math.floor(i / 3) * 10;
      R(cx + 1, cy + 1, 9, 8, 'rgba(0,0,0,0.25)'); R(cx, cy, 9, 8, '#fbf7ec'); R(cx + 2, cy + 3, 5, 1, '#b9b3a3'); R(cx + 2, cy + 5, 4, 1, '#b9b3a3');
      P(cx + 4, cy, ['#e03a3a', '#3a7be0', '#3ae07b'][i % 3]);
    }
    if (!n) text('-', x + w / 2 - 1, y + h / 2 + 2, '#7a5a30');
    spot('apply', x, y, w, h);
  }
  function shelf(x, y, w) {
    if (w < 40 || y > L.monTop + 10) return;
    R(x + 2, y + 3, w, 3, 'rgba(0,0,0,0.3)'); R(x, y, w, 3, '#6a4224'); R(x, y, w, 1, '#8a5a32');
    const books = ['#8a3a3a', '#3a5a8a', '#5a7a3a', '#8a6a2a', '#5a3a6a', '#3a6a6a'];
    let bx = x + 3;
    books.forEach((col, i) => { const h = 12 + (i * 5) % 6; R(bx, y - h, 4, h, col); R(bx, y - h + 2, 4, 1, 'rgba(255,255,255,0.25)'); bx += 5; });
    R(bx + 1, y - 9, 5, 9, '#4a4a6a'); line(bx + 1, y - 9, bx + 7, y - 13, '#4a4a6a', 1);    // one book fallen over
    R(x + 3, y - 14, 4, 14, '#b03a2a'); R(x + 3, y - 12, 4, 1, '#ffd84a'); R(x + 3, y - 4, 4, 1, '#ffd84a');   // the stamp album, red, gold bands
    spot('album', x + 1, y - 17, 8, 18);
    const tx = x + w - 16;                                                             // a trophy for taking part
    R(tx + 4, y - 2, 8, 2, '#5a3a20'); R(tx + 7, y - 6, 2, 4, '#d9a63a');
    poly([[tx + 3, y - 14], [tx + 13, y - 14], [tx + 11, y - 7], [tx + 5, y - 7]], '#e8c25a'); R(tx + 4, y - 13, 2, 4, '#fff0a8');
    R(tx + 1, y - 13, 2, 3, '#e8c25a'); R(tx + 13, y - 13, 2, 3, '#e8c25a');
    spot('trophy', tx, y - 15, 16, 15);
  }

  // ---- the desk and what is on it ---------------------------------------------------------------------------------------
  function desk() {
    const { deskL: x, deskW: w, deskT: t, depth: d, fy } = L;
    R(x + 4, fy - 2, w, 4, 'rgba(0,0,0,0.35)');                                       // its shadow on the floor
    R(x, t, w, d, '#8a5a32');                                                          // the top, seen from above
    for (let i = 0; i < 5; i++) R(x + 6 + i * 37 % (w - 30), t + 2 + (i * 3) % (d - 3), 22, 1, '#7c5030');   // the grain
    R(x, t, w, 1, '#a06a3a'); R(x, t + d, w, 1, '#c08a52');                           // the back edge, the front edge lit
    R(x, t + d + 1, w, 7, '#6a4224'); R(x, t + d + 8, w, 1, '#4a2e16');               // the front
    const ped = Math.min(36, Math.round(w * 0.24));                                  // the drawers at the left
    R(x + 3, t + d + 9, ped, fy - t - d - 9, '#64401f');
    for (let yy = t + d + 9; yy < fy - 4; yy += 9) { R(x + 3, yy, ped, 1, '#4a2e16'); R(x + 3 + ped / 2 - 2, yy + 4, 4, 1, '#d9a63a'); }
    if ((N.junk || 0) > 0) { R(x + 3 + ped - 3, t + d + 11, 2, 2, '#f4efe2'); }   // a sock's toe out of the drawer
    spot('drawer', x + 3, t + d + 9, ped, fy - t - d - 9);
    R(x + w - 7, t + d + 9, 4, fy - t - d - 9, '#5a3820');                            // a leg
  }
  const on = (dy = 0) => L.deskT + Math.round(L.depth / 2) + dy;                     // where a thing stands on the desk
  function shadow(x, w) { ell(x + w / 2 + 3, on(1), w / 2 + 1, 1, 'rgba(40,20,10,0.45)'); }   // to the right: the lamp is at the left
  function lamp(x) {
    const y = on();
    shadow(x - 5, 12);
    ell(x, y, 5, 1, '#1f2a24'); R(x - 1, y - 14, 2, 14, '#b8902a');                    // a banker's lamp: its base, its stem
    poly([[x - 9, y - 14], [x + 9, y - 14], [x + 7, y - 19], [x - 7, y - 19]], '#2f6b4a');
    R(x - 9, y - 14, 18, 1, '#ffe9a0');                                                // the bulb's glow under the shade
    R(x - 6, y - 18, 8, 1, '#4f9b72');
  }
  function tray(x) {                                                // the in-tray: the letters brought back, not opened yet
    shadow(x, 18);
    const n = Math.min(8, N.tray || 0), y = on(-1), glow = S.fresh && n > 0;
    if (glow) { const c = px.ctx, a = 0.18 + 0.1 * Math.sin(T * 3); c.globalCompositeOperation = 'lighter'; ell(x + 8, y - 6, 14, 9, `rgba(255,220,120,${a.toFixed(2)})`); c.globalCompositeOperation = 'source-over'; }
    R(x - 1, y - 1, 18, 2, '#7a7a8a'); R(x - 1, y - 7, 1, 7, '#7a7a8a'); R(x + 16, y - 7, 1, 7, '#7a7a8a');   // a wire tray
    for (let i = 0; i < n; i++) {                                    // the envelopes in it, a little askew
      const ey = y - 3 - i * 2, ex = x + ((i * 3) % 3) - 1;
      R(ex, ey, 16, 3, '#7d6e5a'); R(ex + 1, ey, 14, 2, i === n - 1 && glow ? '#fff6d8' : '#fbf7ec'); P(ex + 8, ey + 1, '#d03a2a');
    }
    for (let k = 0; k < 4; k++) R(x - 1 + k * 5, y - 7, 1, 7, 'rgba(122,122,138,0.6)');
    spot('tray', x - 2, y - 6 - n * 2, 21, n * 2 + 8);
  }
  function monitor() {
    const { w, h } = L.mon, x = L.mcx - w / 2, y = L.monTop;
    R(L.mcx - 3, y + h, 6, 5, '#2c2c3a'); ell(L.mcx, on(-1), 9, 1, '#2c2c3a');           // the stand
    R(x - 2, y - 2, w + 4, h + 4, '#2c2c3a'); R(x, y, w, h, '#0c2a1c');
    const g1 = '#7fe0a0', g2 = '#4fae74';
    const f = 'F'.repeat(1 + Math.floor((T * 2.5) % 13)), sent = `SENT: ${N.applied || 0}`, rep = `REPLIES: ${N.replies || 0}`;   // the beak, still typing
    const lines = L.wide ? [sent, rep, '', 'DEAR HIRING', 'MANAGER, I AM', 'PASSIONATE', `ABOUT ${f}`.slice(0, 16)] : [sent, rep, '', 'DEAR HIRING', 'MANAGER, I', `AM ${f}`.slice(0, 11)];
    lines.forEach((s, i) => text(s.slice(0, Math.floor((w - 4) / 4)), x + 2, y + 2 + i * 6, i < 2 ? g1 : g2));
    R(x + 2 + textW(lines[lines.length - 1].slice(0, Math.floor((w - 4) / 4))) + 1, y + 2 + (lines.length - 1) * 6, 2, 5, g1);   // the cursor
    R(x + w - 9, y - 1, 8, 7, '#fff176'); text('V12', x + w - 9, y + 1, '#8a7a30');   // a sticky note: «CV final v12»
    spot('screen', x - 2, y - 2, w + 4, h + 4);
  }
  function keyboard() {
    const w = L.wide ? 44 : 36, x = L.mx - w / 2 - 6, y = on(-1);
    R(x, y, w, 4, '#3a3a48'); for (let i = 1; i < w - 1; i += 3) { R(x + i, y + 1, 2, 1, '#6a6a7a'); R(x + i + 1, y + 2, 2, 1, '#6a6a7a'); }
  }
  function mug(x, kind) {
    const y = on(), col = ['#f1ead6', '#e05a4a', '#4a7be0', '#f1ead6', '#5ab07a'][kind % 5];
    shadow(x, 7);
    R(x, y - 8, 7, 8, col); R(x, y - 8, 7, 1, '#2a1a10'); R(x + 7, y - 6, 2, 1, col); R(x + 8, y - 6, 1, 4, col); R(x + 7, y - 3, 2, 1, col);
    if (kind === 3) { line(x + 2, y - 8, x + 1, y - 4, '#d9d0b0'); R(x - 1, y - 4, 3, 3, '#e8c060'); }   // a tea bag's tag
    ell(x + 3, y + 3, 4, 1, 'rgba(90,50,20,0.5)');                                      // the ring it left
    const m = L.spots.mugs; spot('mugs', m ? m.x : x - 1, y - 9, m ? x + 10 - m.x : 11, 12);
  }
  function noodles(x) {
    const y = on();
    shadow(x, 9);
    poly([[x, y - 10], [x + 9, y - 10], [x + 8, y], [x + 1, y]], '#f4efe2'); R(x, y - 7, 9, 2, '#c0392b');
    line(x + 6, y - 10, x + 9, y - 19, '#a8a8b8'); R(x + 8, y - 21, 3, 2, '#a8a8b8');     // a fork, standing in it
    spot('noodles', x - 1, y - 21, 12, 22);
  }
  function plant(x) {
    const y = on();
    shadow(x, 10);
    poly([[x, y - 8], [x + 10, y - 8], [x + 9, y], [x + 1, y]], '#b5562f'); R(x, y - 8, 10, 1, '#8a3e20');
    const away = N.away || 0;
    if (away <= 1) {                                                                    // green and upright: they come every day
      line(x + 5, y - 8, x + 3, y - 17, '#3e8a3a'); line(x + 6, y - 8, x + 9, y - 16, '#3e8a3a'); line(x + 5, y - 8, x + 5, y - 19, '#3e8a3a');
      for (const [a, b] of [[1, -15], [10, -14], [3, -19], [7, -18], [0, -11], [11, -11]]) R(x + a, y + b, 3, 2, '#5ab05a');
      if ((N.streak || 0) >= 3) { ell(x + 5, y - 21, 2, 2, '#ffd84a'); P(x + 5, y - 21, '#e8643a'); }   // a flower, for a streak
    } else if (away <= 4) {                                                             // drooping
      line(x + 5, y - 8, x + 3, y - 15, '#6a7a2a'); line(x + 3, y - 15, x - 2, y - 11, '#6a7a2a');
      line(x + 6, y - 8, x + 10, y - 13, '#6a7a2a'); line(x + 10, y - 13, x + 13, y - 7, '#6a7a2a');
      R(x - 3, y - 11, 3, 2, '#8a8a3a'); R(x + 12, y - 7, 3, 2, '#9a7a3a'); R(x + 14, y + 2, 3, 1, '#9a6a3a');
    } else {                                                                            // brown: they have been away
      line(x + 5, y - 8, x + 2, y - 11, '#7a5a2a'); line(x + 6, y - 8, x + 11, y - 9, '#7a5a2a');
      R(x - 1, y - 12, 3, 1, '#8a6a3a'); R(x + 10, y - 10, 3, 1, '#8a6a3a'); R(x + 12, y + 2, 3, 1, '#8a6a3a'); R(x - 4, y + 2, 3, 1, '#8a6a3a');
    }
    spot('plant', x - 3, y - 22, 17, 23);
  }
  function phone(x) {
    const y = on(2);
    const buzz = Math.sin(T * 1.1) > 0.93, dx = buzz ? Math.round(Math.sin(T * 60)) : 0;   // now and then it buzzes
    R(x + dx, y - 1, 10, 3, '#15151f'); R(x + 1 + dx, y - 1, 8, 2, buzz ? '#8ab0ff' : '#2a3a6a');
    P(x + 8 + dx, y - 2, '#e03a3a');                                                   // one new email
    if (buzz) { P(x - 2, y - 3, '#c9d0ff'); P(x + 12, y - 3, '#c9d0ff'); P(x - 3, y - 1, '#c9d0ff'); P(x + 13, y - 1, '#c9d0ff'); }
    L.buzz = buzz;
    spot('phone', x - 2, y - 4, 14, 7);
  }
  function bin() {
    const x = Math.round(L.deskL + L.deskW * 0.52), y = L.fy + 11;
    ell(x + 7, y, 9, 2, 'rgba(0,0,0,0.35)');
    poly([[x, y - 14], [x + 14, y - 14], [x + 12, y], [x + 2, y]], '#5a5a6a'); R(x, y - 14, 14, 2, '#7a7a8a');
    for (let i = 0; i < 4; i++) ell(x + 3 + i * 3, y - 16 - (i % 2) * 2, 2, 2, '#e8e2d0');   // paper balls, too many
    ell(x + 20, y - 1, 2, 2, '#e8e2d0'); ell(x - 6, y + 1, 2, 2, '#e8e2d0');              // and two that missed
    const k = (T % 9) / 1.2;                                                          // every so often one more, thrown and missed
    if (k < 1) ell(x + 30 - k * 22, y - 30 + k * k * 30, 2, 2, '#e8e2d0');
    spot('bin', x - 2, y - 19, 18, 20);
  }

  // ---- the escalator, the light it goes up into, the rope ------------------------------------------------------------------
  // seen from the front left: the far balustrade behind, the steps (tread and riser, climbing), the golden side under them,
  // the near glass and its black handrail; it leaves the room into a glow, through the ceiling or the right wall
  function escalator(t) {
    const { bx, by, tx, ty, slope } = L;
    // the opening it goes out by: the sky, bright
    const o = L.out;
    if (o.up) { R(o.x - 30, 0, L.W - o.x + 30, L.ceil + 1, '#9fd4f8'); ell(o.x - 6, 3, 7, 2, '#ffffff'); }
    else { R(L.W - 10, o.y - 60, 10, 70, '#9fd4f8'); ell(L.W - 3, o.y - 40, 6, 3, '#ffffff'); }
    drawEscalator(px, { bx, by, tx, ty, slope, t, bottom: true });
    // a sign on the wall by it, in neon: HEAVEN, up; one of its letters never quite works
    const word = 'HEAVEN', sub2 = 'JOBS DEPT', sw = textW(word) * 2 + 14, sh = 24;
    const sy = L.wide ? Math.min(L.deskT - 48, L.monTop - 26) : L.monTop - 70, sx = Math.min(L.escX(sy + 20) - sw - 10, L.W - sw - 4);
    R(sx + 2, sy + 2, sw, sh, 'rgba(0,0,0,0.35)'); R(sx, sy, sw, sh, '#14162e');
    R(sx, sy, sw, 1, '#3a3f6a'); R(sx, sy + sh - 1, sw, 1, '#0a0b1a');
    const flick = Math.sin(t * 13.1) + Math.sin(t * 7.7) + Math.sin(t * 2.3) > 1.9;   // the second E flickers, now and then
    const c = px.ctx;
    c.globalCompositeOperation = 'lighter'; ell(sx + sw / 2, sy + 8, sw / 2, 7, 'rgba(255,160,200,0.10)'); c.globalCompositeOperation = 'source-over';
    let lx = sx + 5;
    [...word].forEach((ch, i) => {                                    // each letter twice as big, a neon tube
      const f = (i === 4 && flick) ? '#4a2a3a' : '#ffb0d8', glow = (i === 4 && flick) ? null : 'rgba(255,120,190,0.35)';
      const rows = FONTROW(ch);
      rows.forEach((row, j) => [...row].forEach((b, k) => { if (b === '#') { if (glow) R(lx + k * 2 - 1, sy + 3 + j * 2 - 1, 4, 4, glow); R(lx + k * 2, sy + 3 + j * 2, 2, 2, f); } }));
      lx += rows[0].length * 2 + 2;
    });
    P(sx + sw - 6, sy + 4, '#ffd84a'); R(sx + sw - 7, sy + 5, 3, 1, '#ffd84a'); R(sx + sw - 6, sy + 6, 1, 6, '#ffd84a');   // an arrow, up
    text(sub2, sx + Math.round((sw - textW(sub2)) / 2), sy + sh - 8, '#c9d0ff');
    spot('sign', sx, sy, sw, sh);
    spot('escalator', bx - 12, by - 70, Math.round(70 * slope) + 30, 74);
  }
  function beam(a) {                                                // the light from the opening, down the steps
    const o = L.out, { bx, by } = L;
    poly([[o.x - 40, o.y], [o.x + 40, o.y], [bx + 60, by + 8], [bx - 50, by + 8]], `rgba(255,244,200,${a})`);
    poly([[o.x - 16, o.y], [o.x + 24, o.y], [bx + 30, by + 8], [bx - 24, by + 8]], `rgba(255,244,200,${a})`);
  }
  function rope(open) {
    const { bx, by } = L, a = bx - 46, b = bx - 8, y = by + 1;
    for (const x of [a, b]) { ell(x, y + 1, 3, 1, '#6a5018'); R(x - 1, y - 15, 2, 16, '#d9a63a'); ell(x, y - 16, 2, 2, '#ffe58a'); }
    if (open) return;
    spot('rope', a - 4, y - 20, b - a + 8, 24);
    for (let x = a; x <= b; x++) { const k = (x - a) / (b - a); R(x, y - 14 + Math.round(Math.sin(Math.PI * k) * 5), 1, 2, '#b0202a'); }
    const w = textW('REQUIRED') + 6, sx = Math.round((a + b) / 2 - w / 2), sy = y - 9;
    R(sx, sy, w, 14, '#1b1f3a'); R(sx, sy, w, 1, '#d9a63a'); R(sx, sy + 13, w, 1, '#d9a63a');
    text('CV', sx + (w - textW('CV')) / 2, sy + 2, '#ffd84a'); text('REQUIRED', sx + 3, sy + 8, '#fff8e7');
  }

  // ---- the light: the room in the dark, but for the lamp's pool, the screen's glow and the light down the escalator ---------
  let dark = null;
  function light(W, H) {
    if (!dark || dark.width !== W || dark.height !== H) { dark = document.createElement('canvas'); dark.width = W; dark.height = H; }
    const d = dark.getContext('2d'), keep = px.use(d);
    d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H);
    R(0, 0, W, H, 'rgba(6,8,30,0.55)');
    d.globalCompositeOperation = 'destination-out';
    const lx = L.lampX + 16, ly = on() - 4;
    for (const [rx, ry, a] of [[96, 46, 0.3], [70, 32, 0.35], [44, 20, 0.5]]) ell(lx, ly, rx, ry, `rgba(0,0,0,${a})`);
    for (const [rx, ry, a] of [[58, 42, 0.3], [38, 28, 0.35]]) ell(L.mcx, L.monTop + L.mon.h / 2, rx, ry, `rgba(0,0,0,${a})`);
    beam(0.45); beam(0.3);
    px.use(keep);
    g.drawImage(dark, 0, 0);
    // the light's colours: warm from the lamp and from above, green from the screen
    g.globalCompositeOperation = 'lighter';
    for (const [rx, ry] of [[64, 28], [38, 16]]) ell(lx, ly, rx, ry, 'rgba(60,38,8,0.20)');
    ell(L.mcx, L.monTop + L.mon.h, 36, 14, 'rgba(8,46,28,0.28)');
    beam(0.05);
    const o = L.out; for (const [r, a] of [[30, 0.10], [18, 0.16], [9, 0.25]]) ell(o.x, o.y, r, r, `rgba(255,240,190,${a})`);
    g.globalCompositeOperation = 'source-over';
  }

  // ---- the soul's way, by its pose and the seconds it has been in it -----------------------------------------------------------
  // soul: 4 s up out of the body, a look down, a poke, a shrug; walk: 2.4 s over to the escalator; ride: 4 s up it, slowly;
  // descend: 4 s down it; back: 2.4 s back over the desk; enter: 1 s into the body
  const SOUL = { soul: 4, walk: 2.4, ride: 4, descend: 4, back: 2.4, enter: 1 };
  const smooth = (u) => { const x = Math.max(0, Math.min(1, u)); return x * x * (3 - 2 * x); };
  function soulAt(pose, k, t) {
    const body = { x: L.mx - 2, y: on(-6) }, above = { x: L.mx - 2, y: on(-30) }, foot = { x: L.bx - 18, y: L.fy + 8 };
    const bob = Math.sin(t * 2.4) * 1.5;
    const ride = (u) => { const y = L.by - 6 - u * (L.by - L.ceil + 40); return { x: L.escX(y) + 2, y }; };
    if (pose === 'soul') {
      const up = smooth(k / 1.6), poke = k > 2.4 && k < 3 ? Math.sin(((k - 2.4) / 0.6) * Math.PI) * 4 : 0;
      return { x: body.x + (above.x - body.x) * up, y: body.y + (above.y - body.y) * up + bob * up + poke, alpha: 0.85 * Math.min(1, k / 0.9), look: k > 1.6 && k < 3 ? -1 : 0, beam: Math.min(1, k / 0.6) * (k > 3.4 ? Math.max(0, 1 - (k - 3.4) / 0.6) : 1) };
    }
    if (pose === 'walk' || pose === 'back') {
      const u = smooth(k / SOUL.walk), [a, b] = pose === 'walk' ? [above, foot] : [foot, above];
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - Math.sin(Math.PI * u) * 10 + bob };
    }
    if (pose === 'ride') return { ...ride(smooth(k / SOUL.ride)), alpha: 0.85 };
    if (pose === 'descend') return ride(1 - smooth(k / SOUL.descend));
    if (pose === 'enter') { const u = smooth(k / SOUL.enter); return { x: above.x, y: above.y + (body.y - above.y) * u, alpha: 0.85 * (1 - u) }; }
    return null;
  }
  function beamDown(a) {                                             // a light from the ceiling onto the desk
    const c = px.ctx; c.globalCompositeOperation = 'lighter';
    poly([[L.mx - 16, L.ceil], [L.mx + 12, L.ceil], [L.mx + 20, on(2)], [L.mx - 26, on(2)]], `rgba(255,244,200,${(0.16 * a).toFixed(3)})`);
    poly([[L.mx - 8, L.ceil], [L.mx + 4, L.ceil], [L.mx + 10, on(2)], [L.mx - 16, on(2)]], `rgba(255,244,200,${(0.14 * a).toFixed(3)})`);
    c.globalCompositeOperation = 'source-over';
  }

  // ---- the whole room -------------------------------------------------------------------------------------------------------
  // state: n (the numbers of js/progress.js), open (a CV is given), clockMin (minutes spent in the sky), fresh (letters just
  // brought back, not opened), duck: { pose: faint | soul | walk | ride | descend | back | enter | awake, k: seconds in it }
  function draw(W, H, t = 0, state = {}) {
    px.use(g);
    N = state.n || {}; T = t; S = state; L.spots = {};
    walls();
    const wl = L.wall;
    if (wl.window) window_(wl.window);
    if (wl.clock) clock(wl.clock);
    if (wl.calendar) calendar(wl.calendar);
    if (wl.board) board(wl.board);
    if (wl.poster) poster(wl.poster);
    if (wl.apply) apply(wl.apply);
    if (L.wide && wl.window) shelf(wl.window.x, wl.window.y + wl.window.h + 22, Math.min(wl.window.w, L.mcx - L.mon.w / 2 - wl.window.x - 10));
    desk();
    // on the desk, left to right: the lamp, the papers, the screen and the duck, the mugs, the noodles, the plant
    const x0 = L.deskL;
    L.lampX = x0 + 14; lamp(L.lampX);
    if (L.mcx - L.mon.w / 2 - (x0 + 26) >= 20) tray(x0 + 28);
    monitor(); keyboard();
    const D = state.duck || {}, pose = D.pose || 'faint', k = D.k || 0;
    const awake = pose === 'awake';
    if (!awake) {                                                    // out cold on the keyboard, little stars going round
      sleeping(px, L.mx - 2, on(-2) - (L.buzz ? 1 : 0), { fainted: true });
      for (let i = 0; i < 3; i++) {
        const a = t * 2.2 + i * 2.1, sx = L.mx - 4 + Math.cos(a) * 9, sy = on(-24) + Math.sin(a) * 2.5;
        if (Math.sin(a) > -0.3 || i === 0) { P(sx, sy, '#ffd84a'); P(sx - 1, sy, '#ffe58a'); P(sx + 1, sy, '#ffe58a'); P(sx, sy - 1, '#ffe58a'); P(sx, sy + 1, '#ffe58a'); }
      }
      L.head = { x: L.mx - 2, y: on(-20) };
      if (pose === 'faint') spot('duck', L.mx - 16, on(-24), 52, 24);
    } else {
      const jolt = k < 0.5 ? Math.round(Math.sin(k * Math.PI * 2) * 3) : 0;   // just woken: a jolt upright
      upright(px, L.mx + 6, on(-1) - Math.max(0, jolt), { blink: (t % 3) > 2.85 });
      L.head = { x: L.mx + 10, y: on(-28) };
      spot('duck', L.mx - 8, on(-30), 30, 30);
    }
    phone(L.mx + 26);
    let x = L.mx + 40;
    const right = L.deskR - 16;
    const mugs = Math.max(1, Math.min(5, N.mugs || 0));                              // a mug for each day fished this week
    for (let k = 0; k < mugs && x + 9 < right - (L.wide ? 22 : 0); k++, x += 11) mug(x, k);
    if (x + 10 < right - 14) { noodles(x + 2); x += 14; }
    if (x + 12 < right + 4) plant(right - 6);
    bin();
    escalator(t);
    rope(state.open);
    // its soul: up out of the body, a look back, over to the escalator, up through the ceiling; and the same way home
    const at = soulAt(pose, k, t);
    if (at) {
      if (at.beam) beamDown(at.beam);
      soul(px, Math.round(at.x), Math.round(at.y), { look: at.look || 0, alpha: at.alpha ?? 0.85 });
      L.head = { x: Math.round(at.x) + 4, y: Math.round(at.y) - 30 };
    }
    light(W, H);
  }
  return { layout, draw, L, SOUL };
}
