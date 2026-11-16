// THE LONG WAY UP (PLAN.md 19.1; Vin, 16/11: «lúc đi lên thang máy đi thật từ từ thôi. vì thang máy cuốn mà»). The soul rides
// the golden escalator from the office's ceiling to the gate of HEAVEN, slowly, as an escalator does, about twenty-five
// seconds: up through the floors of the building at night (a meeting room left with «Q4 SYNERGY» on its board, a coffee
// machine OUT OF ORDER, another duck asleep under its desk, the server room blinking, a cleaner's cart, the boss's door
// with HIRING FREEZE on it), out over the roof (pigeons on the water tower, a red light on the mast), into the night with
// the city below growing small, its lit windows as many as the letters out for the person today, up through the clouds,
// the dark going to dawn, and the gate in the light. And the same way down, back to the body. Nothing to press: only to
// look at. Drawn on the stage: the world slides past to the screen's own pixel; the escalator and the soul stay put.

import { makePix, hash } from './pix.js';
import { drawEscalator } from './escalator.js';
import { soul, upright } from './ducks.js';

export const TOP = 1200;                                             // art pixels from the office's ceiling to the gate
export const RIDE = 25;                                              // seconds, up or down
const FLOOR = 60, FLOORS = 6, ROOF = FLOOR * FLOORS;
const STOPS = [[-200, [26, 30, 70]], [300, [10, 14, 44]], [700, [20, 28, 74]], [930, [64, 56, 128]], [1070, [214, 128, 140]], [1190, [255, 196, 150]], [1500, [255, 236, 196]]];
const smooth = (u) => { const x = Math.max(0, Math.min(1, u)); return x * x * (3 - 2 * x); };
function skyAt(h) {                                                  // the sky's colour at a height: night, then dawn near the top
  for (let i = 1; i < STOPS.length; i++) if (h <= STOPS[i][0]) {
    const [h0, a] = STOPS[i - 1], [h1, b] = STOPS[i], u = (h - h0) / (h1 - h0);
    return a.map((c, j) => Math.round(c + (b[j] - c) * u));
  }
  return STOPS[STOPS.length - 1][1];
}

export function makeRise(stage) {
  const L = {};
  const buf = document.createElement('canvas'), bg = buf.getContext('2d'), px = makePix(bg);
  const esc = document.createElement('canvas'), eg = esc.getContext('2d'), epx = makePix(eg);

  function layout(W, H) {
    const wide = W >= H;
    Object.assign(L, { W, H, wide, slope: wide ? 0.84 : 0.4, standY: Math.round(H * 0.62) });
    L.by = H + 24; L.ty = -40;
    L.bx = Math.round(W * (wide ? 0.42 : 0.38) - (L.by - L.standY) * L.slope);
    L.escX = (y) => L.bx + (L.by - y) * L.slope;
    L.tx = L.escX(L.ty);
    buf.width = W; buf.height = H + 2; bg.imageSmoothingEnabled = false;
    esc.width = W; esc.height = H; eg.imageSmoothingEnabled = false;
    L.left = wide ? [10, Math.round(W * 0.16)] : [3, 30];               // where the floors' things stand, clear of the escalator
    L.right = wide ? [Math.round(W * 0.74), W - 52] : [W - 50, W - 48];
    return L;
  }
  const sy = (h, ci) => Math.round(L.H * 0.55 + ci - h) + 1;            // a height of the world, on the buffer (its spare top row)

  // ---- a floor of the building, at night: its wall, its windows, a lamp, and one thing to look at ------------------------------
  const THINGS = [
    (x, y, t) => {                                                   // a meeting room left as it was: Q4 SYNERGY
      px.R(x, y - 26, 40, 20, '#e8e6dc'); px.R(x, y - 26, 40, 1, '#9a98a8'); px.text('Q4', x + 3, y - 23, '#3a5ab0'); px.text('SYNERGY', x + 3, y - 16, '#3a5ab0');
      px.line(x + 28, y - 10, x + 36, y - 22, '#d03a2a'); px.R(x + 4, y - 4, 7, 4, '#3a3d55'); px.R(x + 24, y - 4, 7, 4, '#3a3d55');
    },
    (x, y, t) => {                                                   // the coffee machine: OUT OF ORDER
      px.R(x + 4, y - 24, 16, 24, '#5a5e7c'); px.R(x + 6, y - 21, 12, 6, '#1a1c2c'); px.R(x + 9, y - 12, 6, 6, '#2a2c3c');
      px.R(x + 2, y - 30, textW('OUT OF ORDER') + 2, 7, '#fff8e7'); px.text('OUT OF ORDER', x + 3, y - 29, '#d03a2a');
      px.R(x + 24, y - 6, 5, 6, '#f1ead6');
    },
    (x, y, t) => {                                                   // another duck, asleep under its desk
      px.R(x, y - 18, 44, 3, '#6a4224'); px.R(x + 2, y - 15, 2, 15, '#4a2e16'); px.R(x + 40, y - 15, 2, 15, '#4a2e16');
      upright(px, x + 20, y, { sit: true, blink: true });
      if (Math.sin(t * 1.3) > 0) px.text('Z', x + 30, y - 26 - Math.round((t * 3) % 4), '#c9d0ff');
    },
    (x, y, t) => {                                                   // the server room, blinking
      for (let r = 0; r < 3; r++) {
        px.R(x + r * 13, y - 28, 11, 28, '#1a1c2c'); px.R(x + r * 13, y - 28, 11, 1, '#3a3d55');
        for (let k = 0; k < 6; k++) px.P(x + r * 13 + 2 + (k % 2) * 6, y - 25 + k * 4, Math.sin(t * (3 + k) + r * 2) > 0.2 ? '#7fe0a0' : (k === 3 && r === 1 ? '#e03a3a' : '#2a4a3a'));
      }
    },
    (x, y, t) => {                                                   // a cleaner's cart, a wet floor
      px.R(x, y - 12, 18, 10, '#3a7be0'); px.R(x + 2, y - 2, 3, 2, '#1a1c2c'); px.R(x + 13, y - 2, 3, 2, '#1a1c2c');
      px.line(x + 20, y, x + 26, y - 24, '#c8b888'); px.R(x + 17, y - 2, 8, 2, '#e8e2d0');
      px.poly([[x + 32, y], [x + 36, y - 12], [x + 40, y]], '#ffd84a'); px.text('!', x + 35, y - 8, '#1b1f3a');
    },
    (x, y, t) => {                                                   // the boss's door: HIRING FREEZE
      px.R(x + 6, y - 30, 22, 30, '#6a4224'); px.R(x + 8, y - 28, 18, 26, '#7a5030'); px.P(x + 23, y - 15, '#d9a63a');
      px.R(x + 2, y - 24, textW('HIRING') + 4, 13, '#fff8e7'); px.text('HIRING', x + 4, y - 23, '#3a5ab0'); px.text('FREEZE', x + 4, y - 17, '#3a5ab0');
    },
  ];
  const { textW } = px;
  function floors(ci, t) {
    const { W } = L;
    for (let i = -1; i < FLOORS; i++) {
      const top = sy(FLOOR * (i + 1), ci), bot = sy(FLOOR * i + 6, ci);
      if (bot < -2 || top > L.H + 4) continue;
      px.R(0, top, W, bot - top, i < 0 ? '#2a2e58' : '#22264a');                      // the wall (below: the office itself)
      for (let x = 0; x < W; x += 8) px.R(x, top, 1, bot - top, i < 0 ? '#262a52' : '#1e2244');
      if (i >= 0) {
        px.R(Math.round(W * 0.5) - 8, top, 16, 2, '#3a3d55'); px.ell(Math.round(W * 0.5), top + 3, 5, 1, '#fff2c0');   // a lamp, on
        const side = i % 2 ? L.right : L.left, wx = i % 2 ? L.left[0] : L.right[1] - 6;
        px.R(wx, top + 10, 28, 20, '#0c1033'); px.R(wx, top + 10, 28, 1, '#3b3462');                        // a window on the night
        for (let k = 0; k < 6; k++) px.P(wx + 3 + ((k * 7 + i * 5) % 22), top + 16 + ((k * 3) % 11), '#ffd27a');
        THINGS[i % THINGS.length](side[0], bot, t);
      }
      const slab = sy(FLOOR * (i + 1), ci);                                             // the floor above, the ceiling here
      if (i < FLOORS - 1) { px.R(0, slab - 6, W, 6, '#41445e'); px.R(0, slab - 6, W, 1, '#5a5e7c'); px.R(0, slab - 1, W, 1, '#2a2c40'); }
    }
  }
  function roof(ci, t) {                                               // the roof: a parapet, a water tower and its pigeons, a mast
    const { W } = L, y = sy(ROOF, ci);
    if (y < -60 || y > L.H + 60) return;
    px.R(0, y - 6, W, 8, '#41445e'); px.R(0, y - 6, W, 1, '#6a6e8c');
    px.R(0, y - 10, W, 4, '#4a4e6a'); px.R(0, y - 10, W, 1, '#7a7e9c');
    const wx = L.left[0] + 6;
    for (const dx of [2, 18]) px.R(wx + dx, y - 26, 2, 16, '#3a2a1a');
    px.R(wx - 2, y - 46, 26, 20, '#6a4a2a'); px.R(wx - 2, y - 46, 26, 2, '#8a6a3a'); px.poly([[wx - 4, y - 46], [wx + 11, y - 56], [wx + 26, y - 46]], '#4a3420');
    for (let k = 0; k < 2; k++) {                                     // pigeons, bobbing
      const px0 = wx + 4 + k * 10, bob = Math.sin(t * 2 + k * 2) > 0.6 ? 1 : 0;
      px.ell(px0, y - 58 + bob, 3, 2, '#8a90a8'); px.ell(px0 + 3, y - 60 + bob, 2, 2, '#9aa0b8'); px.P(px0 + 5, y - 60 + bob, '#e0a040');
    }
    const mx = L.right[1] + 20;
    px.R(mx, y - 60, 2, 50, '#5a5e7c'); px.line(mx - 8, y - 10, mx, y - 44, '#5a5e7c'); px.line(mx + 10, y - 10, mx + 1, y - 44, '#5a5e7c');
    if (Math.sin(t * 2.5) > 0) { px.R(mx - 1, y - 63, 4, 3, '#ff4a3a'); } else px.R(mx, y - 62, 2, 2, '#8a2a2a');
  }
  function clouds(ci, t) {                                             // the cloud banks the soul goes up through
    const { W } = L;
    for (const [h, n, kind] of [[760, 9, 'far'], [790, 8, 'near'], [880, 9, 'near'], [960, 7, 'dusk']]) {
      const y = sy(h, ci);
      if (y < -40 || y > L.H + 40) continue;
      for (let i = 0; i < n; i++) px.lump(((i + 0.5) / n) * W + (hash(i + h) - 0.5) * 30, y + (hash(i + h * 2) - 0.5) * 14, 12 + hash(i * 3 + h) * 12, kind);
    }
  }
  function gate(ci, t) {                                               // the gate of HEAVEN, in the light at the top
    const { W } = L, y = sy(TOP + 34, ci), cx = Math.round(W * 0.5);
    if (y > L.H + 80 || y < -120) return;
    for (const dx of [-46, 46]) {                                     // its pillars, of cloud
      for (let k = 0; k < 4; k++) px.lump(cx + dx, y - k * 14, 11, 'near');
    }
    px.R(cx - 44, y - 64, 88, 6, '#d9a63a'); px.R(cx - 44, y - 64, 88, 1, '#ffe58a');           // its golden beam and sign
    px.R(cx - 30, y - 80, 60, 16, '#fff8e7'); px.R(cx - 30, y - 80, 60, 1, '#d9a63a'); px.R(cx - 30, y - 65, 60, 1, '#d9a63a');
    px.text('HEAVEN', cx - Math.round(textW('HEAVEN') / 2), y - 77, '#b8860b'); px.text('JOBS DEPT', cx - Math.round(textW('JOBS DEPT') / 2), y - 70, '#8a6a3a');
  }

  // ---- far away, set to the screen's own pixel: the stars, the city below growing small --------------------------------------
  function stars(cam, t) {
    const a = Math.min(1, Math.max(0, (cam - 320) / 160)) * Math.min(1, Math.max(0, (1060 - cam) / 160));
    if (a <= 0) return;
    for (let i = 0; i < 70; i++) {
      const x = hash(i + 3) * L.W, y = ((hash(i + 11) * L.H * 1.5 + cam * 0.08) % (L.H * 1.5)) - L.H * 0.25, tw = 0.5 + 0.5 * Math.sin(t * (1.5 + hash(i) * 3) + i);
      stage.dot(x, y, `rgba(255,250,230,${(a * (0.35 + 0.6 * tw)).toFixed(2)})`);
    }
  }
  function city(cam, lit) {                                            // the city below, its lit windows the letters out today
    if (cam < ROOF - 40) return;
    const y = L.H - 46 + Math.max(0, cam - ROOF) * 0.3, w = L.W + 20, n = Math.min(240, lit || 0);
    if (y > L.H + 10) return;
    stage.sprite(-10, y, w, 60, 0, 0, (p) => {
      for (let i = 0; i < 40; i++) {
        const bw = 8 + Math.round(hash(i + 5) * 14), bh = 14 + Math.round(hash(i + 9) * 34), bx = Math.round((i / 40) * w + (hash(i) - 0.5) * 8);
        p.R(bx, 60 - bh, bw, bh, '#141a3a');
      }
      let k = 0;
      for (let i = 0; i < 400 && k < n; i++) {                       // as many lit windows as letters (to the city's size)
        const x = Math.round(hash(i * 1.7 + 2) * w), yy = 60 - Math.round(4 + hash(i * 2.3 + 1) * 40);
        p.P(x, yy, '#ffd27a'); k++;
      }
    }, `risecity:${L.W}:${n}`);
  }

  // ---- one moment of the ride ---------------------------------------------------------------------------------------------------
  // st: dir (1 up, -1 down), k (0 to 1, the way done), t (seconds, for what twinkles), walking (taken a step at a time:
  // quicker), lit (letters out today)
  function draw(st) {
    const { W, H } = L, t = st.t, k = Math.max(0, Math.min(1, st.k));
    const cam = TOP * (st.dir > 0 ? smooth(k) : 1 - smooth(k)), ci = Math.floor(cam), frac = cam - ci;
    for (let y = -2; y < H + 2; y += 3) {                              // the sky, from the night up into the dawn
      const h = cam + H * 0.55 - y;
      stage.fill(`rgb(${skyAt(h)})`, 0, y, W, 3.2);
    }
    if (cam > 900) {                                                  // the dawn's light from above
      const a = Math.min(1, (cam - 900) / 260) * 0.5, g = stage.g, K = stage.K;
      const gr = g.createRadialGradient(W * 0.5 * K, -H * 0.1 * K, 0, W * 0.5 * K, -H * 0.1 * K, H * 0.9 * K);
      gr.addColorStop(0, `rgba(255,236,180,${a.toFixed(3)})`); gr.addColorStop(1, 'rgba(255,236,180,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(0, 0, W * K, H * K); g.globalCompositeOperation = 'source-over';
    }
    stars(cam, t);
    city(cam, st.lit);
    bg.clearRect(0, 0, buf.width, buf.height);                        // the near world, at the whole pixel, then slid by the rest
    floors(ci, t); roof(ci, t); clouds(ci, t); gate(ci, t);
    stage.g.imageSmoothingEnabled = false;
    stage.g.drawImage(buf, 0, Math.round((-1 + frac) * stage.K), buf.width * stage.K, buf.height * stage.K);
    eg.clearRect(0, 0, W, H);                                          // the escalator, running up (or down)
    drawEscalator(epx, { bx: L.bx, by: L.by, tx: L.tx, ty: L.ty, slope: L.slope, t: st.dir > 0 ? t : -t, bottom: false, top: false });
    stage.g.drawImage(esc, 0, 0, W * stage.K, H * stage.K);
    // the soul on its step: still, but for a bob; when it walks, a step at a time
    const x = L.escX(L.standY) + 10, step = st.walking ? Math.abs(Math.sin(t * 7)) * 2 : 0, bob = Math.sin(t * 1.7) * 0.8;
    stage.sprite(x, L.standY - 2 + bob - step, 40, 40, 20, 36, (p, ox, oy) => soul(p, ox, oy, { look: st.dir > 0 ? 0 : -1, left: st.dir < 0 }), `risesoul:${st.dir > 0 ? 0 : 1}`);   // down: facing down the steps
    L.head = { x: x + 4, y: L.standY - 34 };
    return cam;
  }
  return { layout, draw, L };
}
