// HEAVEN'S PIER (PLAN.md 19: the soul arrives by the escalator, through a gate of cloud with HEAVEN over it; the gull keeps
// the gate at a lectern, its ledger open; the boat goes out to the right and comes back in from the right; the way home is the
// escalator, down. Before it: THE CLOUD PIER) (Vin, 15/11: «khi lên rồi thì phải có 1 cái bến, trước khi bắt đầu đi câu»; and of the first try,
// «ẩu rồi, đã chốt làm 2.5D ... chất lượng kém xa lobby»): drawn as the office's escalator is, in an oblique view from the
// front left and a little above, so each thing shows its front, its top and its right side. A wooden pier over a sea of
// clouds in the early morning; the sun low at the back right lights the tops and the right sides and throws every shadow
// forward and to the left. The golden escalator arrives at the front left corner. On the deck, at the back: the harbour
// hut (its chimney smoking, a life ring, a bell, a box of flowers) and the departures board (the day's own numbers, on
// split flaps); nearer: the bait stall, whose jars are the CV's skills; at the front: crates, bollards, a coil of rope, a
// lantern, a signpost; tied up at the right end, the boat GOOD LUCK, its inside showing. A gull in a captain's hat.

import { makePix, hash } from './pix.js';
import { upright } from './ducks.js';
import { drawEscalator } from './escalator.js';
import { drawBoat } from './boat.js';

const KX = 0.5, KY = 0.6;                                           // a step back into the picture: this far right, this far up

export function makePier(g) {
  const px = makePix(g), { R, P, ell, line, poly, text, textW } = px;
  const L = {};
  const scratch = document.createElement('canvas').getContext('2d');   // where the shadows are gathered, unseen
  let D = {};                                                         // what the game tells it: the board, the bait, the hook, the duck
  const spot = (name, x, y, w, h) => { L.spots[name] = { x, y, w, h }; };   // where each thing can be pressed

  // ---- the layout, in the pier's own measures: x along it, z back from its front edge, h up from its deck ------------------
  function layout(W, H) {
    const wide = W >= H;
    Object.assign(L, { W, H, wide });
    if (wide) {
      Object.assign(L, { hz: 92, yF: 172, Dz: 62, x0: 40, x1: 282 });
      L.hut = { x: 54, z: 40, w: 58, d: 18, h: 30 };
      L.board = { x: 108, z: 50, w: 90, lift: 36, bh: 38 };
      L.stall = { x: 204, z: 20, w: 56, d: 14, h: 15 };
      L.crates = { x: 92, z: 8 };
      L.bollards = [[154, 3], [272, 3]];
      L.lamp = { x: 128, z: 4 };
      L.sign = { x: 274, z: 50 };                                     // at the back right corner, pointing out to sea
      L.boat = { x: L.x1 + 18, y: L.yF + 20 };
      L.duck = { x: 70, z: 10 };                                       // just through the gate
    } else {
      Object.assign(L, { hz: 176, yF: 292, Dz: 84, x0: 14, x1: W + 30 });
      L.hut = { x: 14, z: 60, w: 58, d: 18, h: 30 };
      L.board = { x: 58, z: 74, w: 88, lift: 48, bh: 38 };
      L.stall = { x: 100, z: 22, w: 56, d: 14, h: 15 };
      L.crates = { x: 46, z: 8 };
      L.bollards = [[96, 3], [168, 3]];
      L.lamp = null;
      L.sign = null;
      L.boat = { x: 96, y: L.yF + 56 };
      L.duck = { x: 40, z: 12 };
    }
    const ox = Math.round((W - (wide ? 384 : 195)) / 2);             // a window wider or narrower than drawn for: the pier in its middle
    if (ox) {
      L.x0 += ox; if (wide) L.x1 += ox; else L.x1 = W + 30;
      for (const o of [L.hut, L.board, L.stall, L.crates, L.lamp, L.sign, L.duck]) if (o) o.x += ox;
      L.bollards = L.bollards.map(([x, z]) => [x + ox, z]); L.boat.x += ox;
    }
    L.yB = L.yF - L.Dz * KY;                                         // the back edge, on the screen
    L.duck.sx = L.duck.x + L.duck.z * KX; L.duck.sy = L.yF - L.duck.z * KY;
    L.esc = { tx: L.x0 - 4, ty: L.yF - 1, slope: 0.84 };
    L.esc.by = H + 30; L.esc.bx = L.esc.tx - (L.esc.by - L.esc.ty) * L.esc.slope;
    return L;
  }
  const S = (x, z, h = 0) => [x + z * KX, L.yF - z * KY - h];          // a point of the pier, on the screen
  const quad = (pts, col) => poly(pts.map(([x, z, h]) => S(x, z, h)), col);

  // a box standing on the deck: its right side and top lit by the sun at the back right, its front in shade
  function box(x, z, w, d, h, { top, side, front, edge = 'rgba(40,20,10,0.6)', lift = 0 }) {
    const a = lift, b = lift + h;
    quad([[x + w, z, a], [x + w, z + d, a], [x + w, z + d, b], [x + w, z, b]], side);
    const [fx, fy] = S(x, z, a);
    R(fx, fy - h, w, h, front);
    quad([[x, z, b], [x + w, z, b], [x + w, z + d, b], [x, z + d, b]], top);
    line(fx, fy - h, fx + w - 1, fy - h, 'rgba(255,240,215,0.6)');       // the front top edge, catching the light
    R(fx, fy - 1, w, 1, edge);
    return [fx, fy];
  }
  // the shadow a thing throws on the deck: its footprint, and the footprint carried forward and left by its height
  const shadows = [];
  function shade(x, z, w, d, h) {
    const ox = -h * 0.55, oz = -h * 0.42;
    shadows.push([[x + w, z + d], [x, z + d], [x + ox, z + d + oz], [x + ox, z + oz], [x + w + ox, z + oz], [x + w, z]]);
  }
  function castShadows() {
    g.save(); g.beginPath();
    [[L.x0, 0], [L.x1, 0], [L.x1, L.Dz], [L.x0, L.Dz]].forEach(([x, z], i) => { const [sx, sy] = S(x, z); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); });
    g.closePath(); g.clip();
    for (const s of shadows) poly(s.map(([x, z]) => S(x, z)), 'rgba(80,44,44,0.28)');
    g.restore();
  }

  // ---- the sky: morning, the sun low at the back right, its rays, high clouds, birds -----------------------------------------
  function sky(t) {
    const { W, hz } = L, top = [86, 150, 220], low = [255, 214, 178];
    for (let i = 0; i < 20; i++) {
      const k = i / 19, c = top.map((v, j) => Math.round(v + (low[j] - v) * k ** 1.6));
      R(0, (i * (hz + 8)) / 20, W, (hz + 8) / 20 + 1, `rgb(${c})`);
    }
    const sx = Math.round(W * (L.wide ? 0.86 : 0.8)), sy = Math.round(hz * 0.42);
    L.sun = { x: sx, y: sy };
    g.globalCompositeOperation = 'lighter';
    for (const [r, a] of [[60, 0.05], [38, 0.07], [22, 0.12]]) ell(sx, sy, r, r, `rgba(255,190,110,${a})`);
    g.globalCompositeOperation = 'source-over';
    ell(sx, sy, 9, 9, '#fff1c0'); ell(sx - 1, sy - 1, 7, 7, '#fffbea');
    for (let i = 0; i < 5; i++) {
      const x = ((hash(i) * (W + 80) + t * (1.5 + i * 0.4)) % (W + 80)) - 40, y = 10 + hash(i + 9) * hz * 0.45, w = 26 + hash(i + 3) * 28;
      R(x, y, w, 2, 'rgba(255,255,255,0.65)'); R(x + 4, y + 2, w - 8, 1, 'rgba(255,214,170,0.7)'); R(x + 10, y - 1, w * 0.4, 1, 'rgba(255,255,255,0.4)');
    }
    for (let i = 0; i < 5; i++) {
      const x = ((W * 0.28 + i * 8 + t * 5) % (W + 40)) - 20, y = hz * 0.3 + (i % 2) * 4 + Math.sin(t * 2 + i) * 1.5, f = Math.sin(t * 7 + i * 1.3) > 0;
      P(x - 2, y - (f ? 1 : 0), '#4a4a6a'); P(x - 1, y, '#4a4a6a'); P(x, y + 1, '#4a4a6a'); P(x + 1, y, '#4a4a6a'); P(x + 2, y - (f ? 1 : 0), '#4a4a6a');
    }
  }
  function rays() {
    const { x, y } = L.sun;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const a = 2.2 + i * 0.16, len = L.H * 1.4, w = 0.03 + (i % 2) * 0.02;
      poly([[x, y], [x + Math.cos(a - w) * len, y + Math.sin(a - w) * len], [x + Math.cos(a + w) * len, y + Math.sin(a + w) * len]], 'rgba(255,214,150,0.045)');
    }
    g.globalCompositeOperation = 'source-over';
  }

  // ---- the sea of clouds ------------------------------------------------------------------------------------------------------
  const cloud = (cx, cy, r, near) => px.lump(cx, cy, r, near ? 'near' : 'far');
  function farSea(t) {
    const { W, H, hz } = L;
    R(0, hz, W, H - hz, '#f3dfe4');
    for (let row = 0; row < 4; row++) {
      const y = hz + 2 + row * 8, r = 5 + row * 3, step = r * 2.2;
      for (let i = -1; i < W / step + 2; i++) cloud(i * step - ((t * (0.6 + row * 0.5)) % step) + hash(i + row * 30) * 4, y + hash(i + row * 60) * 3, r + hash(i + row * 90) * 2, row > 1);
    }
    R(0, hz - 1, W, 2, 'rgba(255,236,220,0.8)');
  }
  function nearBase(t) {                                             // under the pier: the cloud floor, its shadow, a gap to the city
    const { W, H, yF } = L, y0 = yF + 6;
    R(0, y0, W, H - y0, '#e8ecf8');
    poly([[L.x0 - 10, yF + 6], [L.x1, yF + 6], [L.x1 - 34, yF + 32], [L.x0 - 44, yF + 32]], 'rgba(120,128,180,0.30)');
    const gx = ((W * 0.5 - t * 2.5) % (W + 140) + W + 140) % (W + 140) - 70, gy = L.wide ? H - 18 : yF + 120, rx = L.wide ? 40 : 34, ry = 8;
    g.save(); g.beginPath(); g.ellipse(Math.round(gx), gy, rx, ry, 0, 0, Math.PI * 2); g.clip();
    R(gx - rx, gy - ry, rx * 2, ry * 2, '#a3bcd8');
    for (let i = 0; i < 16; i++) { const bx = gx - rx + i * 5.5, bh = 3 + hash(i + 40) * 9; R(bx, gy + ry - bh, 4, bh, '#7891b2'); R(bx + 3, gy + ry - bh, 1, bh, '#6a83a6'); if (hash(i + 7) > 0.5) P(bx + 1, gy + ry - bh + 2, '#fff0c0'); }
    R(gx - rx, gy - ry, rx * 2, 4, 'rgba(240,244,252,0.55)');
    g.restore();
    for (let k = -rx; k <= rx; k += 8) cloud(gx + k, gy - ry - 2 + (Math.abs(k) / rx) * 4, 5, true);
  }
  function nearLumps(t) {
    const { W, H, yF } = L;
    const rows = L.wide ? [[yF + 16, 9], [yF + 34, 12], [H + 2, 15]] : [[yF + 22, 9], [yF + 70, 12], [yF + 150, 14], [H - 4, 17]];
    rows.forEach(([y, r], row) => {
      const step = r * 2.6;
      for (let i = -1; i < W / step + 2; i++) {
        const x = i * step - ((t * (1.2 + row)) % step) + hash(i + row * 40) * 6;
        if (row === 0 && x > L.x0 - 20 && x < L.x1 + 10) continue;          // right under the pier: only its shadow
        cloud(x, y + hash(i + row * 70) * 4, r + hash(i + row * 50) * 4, true);
      }
    });
  }

  // ---- the pier itself ---------------------------------------------------------------------------------------------------------
  function deck() {
    const { x0, x1, Dz } = L;
    // its right end: the thickness of the deck, lit
    quad([[x1, 0, 0], [x1, Dz, 0], [x1, Dz, -6], [x1, 0, -6]], '#a8784a');
    // the boards, across the pier, running back into the picture
    for (let x = x0, i = 0; x < x1; x += 5, i++) {
      const w = Math.min(4, x1 - x);
      quad([[x, 0], [x + w, 0], [x + w, Dz], [x, Dz]], ['#c99a68', '#c29260', '#cd9f6e', '#be8f5c'][i % 4]);
      if (x + 5 < x1) { const [a, b] = S(x + 4, 0), [c, d] = S(x + 4, Dz); line(a, b, c, d, '#8a6038'); }   // the gap between two boards
      const jz = 6 + ((i * 17) % (Dz - 12)), [jx, jy] = S(x, jz); R(jx, jy, 4, 1, '#9a6c40');                  // where a board ends
      for (const nz of [3, Dz / 2, Dz - 3]) { const [nx, ny] = S(x + 1, nz); P(nx, ny, '#6a4628'); }            // nails, over the joists
      if (hash(i + 21) > 0.6) { const [gx, gy] = S(x + 4, hash(i + 8) * Dz); P(gx, gy, '#eef2fa'); P(gx + 1, gy - 1, '#eef2fa'); }   // the clouds below, through a gap
      if (hash(i) > 0.78) { const [kx, ky] = S(x + 2, hash(i + 3) * Dz); ell(kx, ky, 1, 1, '#a87848'); }        // a knot
    }
    const [bx0, by0] = S(x0, Dz), [bx1] = S(x1, Dz);
    R(bx0, by0, bx1 - bx0, 1, '#e8bc8a');                                     // the far edge, catching the sun
  }
  function railing() {                                                         // along the back edge: posts, a sagging rope
    const { x0, x1, Dz } = L;
    for (let x = x0 + 4; x < x1; x += 26) {
      const [sx, sy] = S(x, Dz);
      R(sx, sy - 12, 3, 12, '#6a4628'); R(sx + 2, sy - 12, 1, 12, '#a07048'); R(sx, sy - 13, 3, 1, '#b88a5a');
      if (x + 26 < x1) for (let k = 0; k <= 26; k++) P(sx + 2 + k, sy - 10 + Math.round(Math.sin((Math.PI * k) / 26) * 3), '#d8c094');
    }
  }
  function frontBeam() {
    const { x0, x1, yF } = L, w = x1 - x0;
    R(x0, yF, w, 6, '#7a5232'); R(x0, yF, w, 1, '#b88a5a'); R(x0, yF + 5, w, 1, '#4a3020');
    for (let x = x0 + 10; x < x1; x += 40) { P(x, yF + 2, '#e0c080'); P(x + 2, yF + 2, '#e0c080'); }
  }
  function piles() {
    const { x0, x1, yF } = L, len = L.wide ? 34 : 50;
    for (let x = x0 + 14; x < x1 - 4; x += 40) {
      R(x, yF + 6, 7, len, '#5a3a22'); R(x + 5, yF + 6, 2, len, '#8a6040'); R(x + 1, yF + 6, 1, len, '#4a2e18');
      if (x + 40 < x1 - 4) { line(x + 7, yF + 8, x + 40, yF + len * 0.7, '#4a3020', 2); line(x + 7, yF + len * 0.7, x + 40, yF + 8, '#4a3020', 2); }
    }
  }

  // ---- the things on the deck ---------------------------------------------------------------------------------------------------
  function hut(t) {
    const { x, z, w, d, h } = L.hut, rh = 14;
    shade(x, z, w + 14, d, h + rh);
    const [fx, fy] = box(x, z, w, d, h, { top: '#d8e8f2', side: '#d0e2ee', front: '#a8c6da' });
    // the side wall's boards, the front wall's boards
    for (let k = 3; k < h; k += 4) { quad([[x + w, z, k], [x + w, z + d, k], [x + w, z + d, k + 1], [x + w, z, k + 1]], '#b4ccdc'); R(fx, fy - k, w, 1, '#94b4ca'); }
    R(fx, fy - h, 2, h, '#e8f2f8'); R(fx + w - 2, fy - h, 2, h, '#e8f2f8'); R(fx, fy - 2, w, 2, '#6a8aa2');
    // on the front: the door and its step, the window with shutters and a box of flowers, a plaque, a life ring
    R(fx + 6, fy - 22, 13, 22, '#5a3220'); R(fx + 7, fy - 21, 11, 21, '#7a4a2a'); R(fx + 8, fy - 19, 9, 8, '#8a5a32'); R(fx + 8, fy - 9, 9, 8, '#8a5a32');
    R(fx + 15, fy - 12, 2, 2, '#ffd84a');
    box(x + 5, z - 4, 15, 4, 2, { top: '#d0a070', side: '#a87848', front: '#9a6a3e' });
    R(fx + 26, fy - 26, 18, 13, '#4a3020'); R(fx + 27, fy - 25, 16, 11, '#8ec8e6'); R(fx + 27, fy - 25, 6, 3, '#d8f0fc');
    R(fx + 34, fy - 25, 1, 11, '#4a3020'); R(fx + 27, fy - 20, 16, 1, '#4a3020');
    R(fx + 23, fy - 26, 3, 13, '#2f5a7a'); R(fx + 44, fy - 26, 3, 13, '#2f5a7a');
    R(fx + 25, fy - 12, 20, 4, '#8a5a32'); R(fx + 25, fy - 12, 20, 1, '#a87040');
    for (let i = 0; i < 6; i++) { P(fx + 26 + i * 3, fy - 14, ['#e8643a', '#ffd84a', '#e88aa0'][i % 3]); P(fx + 27 + i * 3, fy - 13, '#5ab07a'); }
    R(fx + 6, fy - h + 3, textW('HARBOUR') + 4, 7, '#fff8ea'); text('HARBOUR', fx + 8, fy - h + 4, '#2a4a6a');
    const rx = fx + w - 7, ry = fy - h + 9;
    ell(rx, ry, 5, 5, '#f4efe2'); ell(rx, ry, 2, 2, '#a8c6da');
    for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4]]) R(rx + dx - 1, ry + dy - 1, 3, 3, '#d03a2a');
    // the roof: a gable along the hut, the slope toward us in shade, the gable end lit; eaves overhanging
    const o = 3;
    quad([[x - o, z - o, h], [x + w + o, z - o, h], [x + w + o, z + d / 2, h + rh], [x - o, z + d / 2, h + rh]], '#8a3a2a');
    for (let k = 1; k < 5; k++) { const f = k / 5; quad([[x - o, z - o + (d / 2 + o) * f, h + rh * f], [x + w + o, z - o + (d / 2 + o) * f, h + rh * f], [x + w + o, z - o + (d / 2 + o) * f + 0.6, h + rh * f + 0.6], [x - o, z - o + (d / 2 + o) * f + 0.6, h + rh * f + 0.6]], '#6e2c20'); }
    quad([[x + w + o, z - o, h], [x + w + o, z + d + o, h], [x + w + o, z + d / 2, h + rh]], '#e8f2f8');      // the gable end
    quad([[x + w + o, z - o, h], [x + w + o, z + d / 2, h + rh], [x + w + o + 1, z + d / 2, h + rh], [x + w + o + 1, z - o, h]], '#5a2018');
    { const [a, b] = S(x - o, z + d / 2, h + rh), [c] = S(x + w + o, z + d / 2, h + rh); R(a, b, c - a, 1, '#d2785a'); }   // the ridge, lit
    { const [a, b] = S(x - o, z - o, h), [c] = S(x + w + o, z - o, h); R(a, b, c - a, 2, '#5a2018'); }            // the eaves' shadow line
    // the chimney at the back, smoking
    box(x + w - 16, z + d / 2 + 2, 7, 5, rh / 2 + 8, { top: '#4a2a20', side: '#b06a54', front: '#8a4a3a', lift: h + rh / 2 });
    const [cx, cy] = S(x + w - 12, z + d / 2 + 4, h + rh + 6);
    for (let i = 0; i < 5; i++) { const k = (t * 0.35 + i / 5) % 1; ell(cx - k * 22, cy - 3 - k * 20, 1 + k * 3, 1 + k * 2, `rgba(244,244,250,${(0.75 * (1 - k)).toFixed(2)})`); }
    // the name board on the ridge
    const [nx, ny] = S(x + w / 2 - 22, z + d / 2, h + rh), bw = textW('HEAVEN PIER') + 8;
    R(nx + 3, ny - 2, 1, 3, '#5a3a22'); R(nx + bw - 4, ny - 2, 1, 3, '#5a3a22');
    R(nx, ny - 12, bw, 10, '#fff8ea'); R(nx, ny - 3, bw, 1, '#c8b890'); R(nx + bw, ny - 12, 1, 10, '#d8ccb0');
    text('HEAVEN PIER', nx + 4, ny - 9, '#2a4a8a');
    // the bell at the front corner, swinging a little
    const s = Math.sin(t * 1.4) * 0.8;
    R(fx - 4, fy - h + 1, 5, 1, '#5a3a22'); R(fx - 3, fy - h + 2, 1, 2, '#5a3a22');
    poly([[fx - 6 + s, fy - h + 4], [fx + s, fy - h + 4], [fx - 1 + s, fy - h + 9], [fx - 5 + s, fy - h + 9]], '#e8c25a'); P(fx - 3 + s, fy - h + 10, '#8a6a20');
    // a barrel beside it
    barrel(x + w + 6, z + 2);
    spot('hut', fx, fy - h - 18, w + 4, h + 18);
  }
  function barrel(x, z) {
    shade(x, z, 10, 8, 13);
    const [bx, by] = S(x, z);
    R(bx, by - 13, 10, 13, '#9a6a3e'); R(bx + 7, by - 13, 3, 13, '#c08a56'); R(bx, by - 10, 10, 1, '#5a5a6a'); R(bx, by - 3, 10, 1, '#5a5a6a');
    ell(bx + 5, by - 14, 5, 2, '#c49464'); ell(bx + 5, by - 14, 3, 1, '#8a5a32');
  }
  function board(nums, t) {                                                   // the departures, on split flaps, on two posts
    const { x, z, w, lift, bh } = L.board;
    shade(x + 6, z, w - 12, 3, lift + bh);
    for (const p0 of [x + 8, x + w - 12]) box(p0, z, 4, 3, lift + 2, { top: '#8a6040', side: '#8a6040', front: '#5a3a22' });
    const [fx, fy] = S(x, z, lift);
    quad([[x + w, z, lift], [x + w, z + 4, lift], [x + w, z + 4, lift + bh], [x + w, z, lift + bh]], '#6a4a2a');   // its edge, lit
    quad([[x - 1, z, lift + bh], [x + w, z, lift + bh], [x + w, z + 4, lift + bh], [x - 1, z + 4, lift + bh]], '#a07448');   // its top
    const top = fy - bh;
    R(fx, top, w, bh, '#14182e'); R(fx, top, w, 1, '#d9a63a'); R(fx, top + bh - 1, w, 1, '#8a6a20'); R(fx, top, 1, bh, '#d9a63a'); R(fx + w - 1, top, 1, bh, '#b8862a');
    text('DEPARTURES', fx + 4, top + 3, '#fff8e7');
    const clock = `07:${String(12 + (Math.floor(t / 6) % 48)).padStart(2, '0')}`;
    text(clock, fx + w - 4 - textW(clock), top + 3, '#ffd84a');
    const flip = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    [0, 1, 2].forEach((i) => {
      const yy = top + 11 + i * 8, row = nums[i];
      for (let cx = fx + 3; cx < fx + w - 4; cx += 4) { R(cx, yy - 1, 3, 7, '#232846'); R(cx, yy + 2, 3, 1, '#14182e'); }
      if (D.loading) {                                                         // the flaps turning while the sky is read
        let w0 = '';
        for (let k = 0; k < 20; k++) w0 += flip[Math.floor((Math.sin(t * 13 + k * 7.1 + i * 3.3) * 0.5 + 0.5) * flip.length) % flip.length];
        text(w0, fx + 4, yy, '#ffd84a');
        return;
      }
      if (!row) return;
      const [name, n, state] = row;
      text(name, fx + 4, yy, '#ffd84a'); text(String(n), fx + 48 - textW(String(n)), yy, '#ffd84a');
      text(state, fx + w - 4 - textW(state), yy, state === 'BOARDING' ? '#7fe0a0' : '#c9d0ff');
    });
    spot('board', fx, top, w, bh);
  }
  function lectern(t) {                                                       // the gull keeps the gate: a lectern, its ledger open
    const { x, z } = L.stall, lx = x + 12;
    shade(lx, z, 13, 8, 18);
    const [fx, fy] = box(lx, z, 13, 7, 15, { top: '#c08a52', side: '#a87444', front: '#7a4e2c' });
    R(fx + 2, fy - 11, 9, 5, '#fff8ea'); text('CV', fx + 4, fy - 11, '#8a3a2a');
    const [bx, by] = S(lx + 1, z + 3, 15);                                   // the ledger, open, its lines
    R(bx, by - 3, 13, 3, '#f4efe2'); R(bx + 6, by - 3, 1, 3, '#c8b890');
    for (let i = 0; i < 2; i++) { R(bx + 1, by - 2 + i, 4, 1, '#b9b3a3'); R(bx + 8, by - 2 + i, 4, 1, '#b9b3a3'); }
    R(bx + 10, by - 6, 1, 4, '#3a2a1a'); P(bx + 10, by - 7, '#ffffff');      // a quill
    gull(lx + 10, z + 10, t, 0);
  }
  function gate(t) {                                                          // where the escalator comes up: a gate of cloud, HEAVEN over it
    const x0 = L.x0 - 4, x1 = L.x0 + (L.wide ? 22 : 18), z = 6;
    for (const gx of [x0, x1]) {
      const [cx, cy] = S(gx, z);
      for (let k = 0; k < 4; k++) px.lump(cx, cy - 4 - k * 9, 7 - (k === 3 ? 1 : 0), 'near');
    }
    const [ax, ay] = S(x0, z, 40), [bx] = S(x1, z, 40), w = bx - ax;
    R(ax - 4, ay - 2, w + 8, 4, '#d9a63a'); R(ax - 4, ay - 2, w + 8, 1, '#ffe58a');
    const word = 'HEAVEN', tw = textW(word) + 6, sx = Math.round(ax + w / 2 - tw / 2);
    R(sx, ay - 12, tw, 10, '#fff8e7'); R(sx, ay - 12, tw, 1, '#d9a63a'); R(sx, ay - 3, tw, 1, '#d9a63a');
    text(word, sx + 3, ay - 10, '#b8860b');
    const c = px.ctx; c.globalCompositeOperation = 'lighter';
    ell(ax + w / 2, ay - 6, w / 2 + 8, 9, `rgba(255,230,160,${(0.12 + 0.04 * Math.sin(t * 2)).toFixed(3)})`);
    c.globalCompositeOperation = 'source-over';
    spot('down', ax - 14, ay - 14, w + 24, 60);
  }
  function crates() {                                                         // two crates: HOPE, and a CV's thirteenth draft
    const { x, z } = L.crates;
    shade(x, z, 18, 14, 24);
    const [fx, fy] = box(x, z, 18, 14, 13, { top: '#d8aa70', side: '#b88a50', front: '#a07038' });
    R(fx + 1, fy - 9, 16, 1, '#7a5030'); R(fx + 1, fy - 5, 16, 1, '#7a5030');
    text('HOPE', fx + 2, fy - 11, '#4a2010');
    const [gx, gy] = box(x + 2, z + 2, 14, 10, 10, { top: '#e0b47a', side: '#c09658', front: '#a87c40', lift: 13 });
    text('CV13', gx, gy - 8, '#4a2010');
    spot('crates', fx, gy - 18, 20, fy - gy + 18);
  }
  function bollard(x, z) {
    shade(x - 3, z, 7, 5, 9);
    const [bx, by] = S(x, z);
    R(bx - 3, by - 8, 7, 8, '#3a3a48'); R(bx + 2, by - 8, 2, 8, '#7a7a8a'); ell(bx, by - 9, 4, 2, '#4a4a5a'); ell(bx + 1, by - 10, 2, 1, '#9a9aaa');
  }
  function coil(x, z) {
    const [cx, cy] = S(x, z);
    for (const [r, c] of [[6, '#a88a58'], [5, '#d8bc88'], [4, '#b89a68'], [3, '#e0c898'], [2, '#a08a60']]) ell(cx, cy, r, Math.max(1, Math.round(r / 2.4)), c);
  }
  function lamp() {
    if (!L.lamp) return;
    const { x, z } = L.lamp, c = px.ctx;
    shade(x - 1, z, 3, 3, 34);
    const [bx, by] = S(x, z);
    R(bx - 2, by - 2, 6, 2, '#3a3a48'); R(bx, by - 30, 2, 30, '#3a3a48'); R(bx + 1, by - 30, 1, 30, '#8a8a9a');
    R(bx - 3, by - 38, 8, 8, '#3a3a48'); R(bx - 2, by - 37, 6, 6, '#ffe2a0'); R(bx + 2, by - 37, 2, 6, '#fff4d0'); R(bx - 4, by - 39, 10, 1, '#3a3a48'); P(bx + 1, by - 41, '#3a3a48');
    c.globalCompositeOperation = 'lighter'; ell(bx + 1, by - 34, 6, 5, 'rgba(255,200,100,0.10)'); c.globalCompositeOperation = 'source-over';
  }
  function signpost() {
    if (!L.sign) return;
    const { x, z } = L.sign;
    shade(x, z, 3, 3, 36);
    const [bx, by] = S(x, z);
    R(bx, by - 36, 3, 36, '#6a4628'); R(bx + 2, by - 36, 1, 36, '#a07048');
    const arrow = (y, dir, word, c) => {
      const w = textW(word) + 8, x0 = dir > 0 ? bx - 3 : bx + 6 - w;
      poly(dir > 0 ? [[x0, y], [x0 + w, y], [x0 + w + 4, y + 4], [x0 + w, y + 8], [x0, y + 8]] : [[x0 + w, y], [x0, y], [x0 - 4, y + 4], [x0, y + 8], [x0 + w, y + 8]], c);
      R(x0, y, w, 1, '#f8e8c0'); R(x0, y + 8, w, 1, '#7a5a30');
      text(word, x0 + 4, y + 2, '#3a2a1a');
    };
    arrow(by - 35, 1, 'FISHING', '#e8c890');
    spot('sign', bx - 4, by - 36, 40, 12);
  }
  function gull(x, z, t, lift = 10) {                                         // the gull in a captain's hat (on a bollard: lifted)
    const [gx, gy0] = S(x, z), y = gy0 - lift, b = Math.round(Math.sin(t * 1.3) * 0.5), look = Math.sin(t * 0.4) > 0.6 ? -1 : 1;
    ell(gx + 1, y - 5 + b, 5, 4, '#f6f6f8'); ell(gx + 2, y - 4 + b, 4, 2, '#b8c0cc'); R(gx - 4, y - 5 + b, 3, 2, '#3a3a48');
    ell(gx + 3, y - 10 + b, 3, 3, '#f6f6f8');
    if (look > 0) { R(gx + 6, y - 10 + b, 3, 1, '#f0b030'); P(gx + 4, y - 11 + b, '#1b1f3a'); } else { R(gx - 2, y - 10 + b, 3, 1, '#f0b030'); P(gx + 1, y - 11 + b, '#1b1f3a'); }
    R(gx, y - 15 + b, 7, 2, '#1b2a5a'); R(gx + 1, y - 17 + b, 5, 2, '#1b2a5a'); R(gx, y - 14 + b, 8, 1, '#f4f4f4'); P(gx + 3, y - 16 + b, '#ffd84a');
    R(gx, y - 1, 1, 2, '#f0b030'); R(gx + 3, y - 1, 1, 2, '#f0b030');
    L.gullHead = { x: gx + 3, y: y - 18 };
    spot('gull', gx - 5, y - 18, 14, 20);
  }
  // the boat GOOD LUCK, tied up in front of the pier's end, seen from above so its inside shows
  function boat(t) {
    const { x, y } = L.boat, yy = y + Math.round(Math.sin(t * 1.6) * 1.2);
    const [rx0, ry0] = S(...L.bollards[1]);                                    // the rope from the bollard to its bow
    const go = D.duck && D.duck.pose === 'sail' ? D.duck.k : D.duck && D.duck.pose === 'return' ? 1 - Math.min(1, D.duck.k) : 0;   // out to the right; back from it
    if (!go) for (let i = 0; i <= 24; i++) { const k = i / 24; P(rx0 + (x + 6 - rx0) * k, ry0 - 6 + (yy - 8 - ry0 + 6) * k + Math.sin(Math.PI * k) * 5, '#e0c896'); }
    const aboard = D.duck && (D.duck.pose === 'aboard' || D.duck.pose === 'sail' || D.duck.pose === 'return');
    drawBoat(px, x + go * go * (L.W + 40), y - go * 6, t, { duck: aboard, sailing: go > 0 && D.duck.pose === 'sail', halo: aboard, left: D.duck && D.duck.pose === 'return' });
    spot('boat', x - 2, yy - 52, 74, 60);
  }

  // ---- the light over it all: warm from the low sun, cooler toward us ----------------------------------------------------------
  function grade() {
    const { W, H } = L;
    g.globalCompositeOperation = 'lighter';
    ell(L.sun.x, L.sun.y + H * 0.25, W * 0.5, H * 0.45, 'rgba(40,24,8,0.10)');
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 6; i++) R(0, H - (i + 1) * 6, W, 6, `rgba(70,80,150,${(0.02 * (6 - i)).toFixed(3)})`);
  }

  // ---- the whole pier -------------------------------------------------------------------------------------------------------
  // data: board (rows of the departures), loading, skills (the bait jars), bait, hook, duck: { pose: stand | walk | aboard | sail, k }
  function draw(W, H, t = 0, data = {}) {
    px.use(g);
    D = data; L.spots = {};
    const nums = data.board || [['LONDON', 69, 'ON TIME'], ['REMOTE', 12, 'ON TIME'], ['GOLDEN', 2, 'BOARDING']];
    const pose = (data.duck && data.duck.pose) || 'stand', dk = Math.min(1, (data.duck && data.duck.k) || 0);
    const walk = pose === 'walk' ? dk : pose === 'walkback' ? 1 - dk : 0;
    const toEsc = pose === 'down' ? Math.min(1, dk / 0.45) : 0;                         // over to the escalator, then down it
    const dz = L.duck.z, dxw = L.duck.x + walk * (L.bollards[1][0] - 8 - L.duck.x) + toEsc * (L.x0 - 2 - L.duck.x);   // along the front of the deck
    const items = [                                                       // what stands on the deck, by how far back it is
      [L.board.z, L.board.x, () => board(nums, t)], [L.hut.z, L.hut.x, () => hut(t)], [L.stall.z, L.stall.x, () => lectern(t)],
      [L.crates.z, L.crates.x, crates], ...L.bollards.map(([x, z]) => [z, x, () => bollard(x, z)]),
      [2, L.bollards[0][0] + 12, () => coil(L.bollards[0][0] + 12, 2)],
      ...(L.lamp ? [[L.lamp.z, L.lamp.x, lamp]] : []), ...(L.sign ? [[L.sign.z, L.sign.x, signpost]] : []),
      ...(pose === 'stand' || pose === 'walk' || pose === 'walkback' || (pose === 'down' && dk < 0.45) ? [[dz, dxw, () => {
        shade(dxw - 8, dz - 3, 16, 6, 22); const [dx, dy] = S(dxw, dz), hop = walk || toEsc ? Math.abs(Math.sin(t * 10)) * 2 : 0;
        const home = pose === 'walkback' || pose === 'down';                // walking back from the boat: facing the way it goes
        upright(px, dx, dy - hop, { blink: (t % 4) > 3.85, halo: true, left: home }); L.duckHead = { x: dx + (home ? -4 : 4), y: dy - 30 };
      }]] : []),
    ].sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    shadows.length = 0; scratch.canvas.width = W; scratch.canvas.height = H;
    const keep = px.use(scratch); items.forEach(([, , f]) => f()); px.use(keep);   // a dry run, to gather every shadow
    sky(t); farSea(t); rays();
    railing(); deck(); castShadows(); shadows.length = 0;
    items.forEach(([, , f]) => f());
    nearBase(t); piles(); frontBeam(); nearLumps(t);
    boat(t);
    drawEscalator(px, { bx: L.esc.bx, by: L.esc.by, tx: L.esc.tx, ty: L.esc.ty, slope: L.esc.slope, t: pose === 'down' ? -t : t, bottom: false, top: true });
    if (pose === 'down' && dk >= 0.45) {                                      // down the escalator, out of sight
      const u = (dk - 0.45) / 0.55, e = L.esc, y = e.ty + u * (e.by - e.ty) * 0.6, x = e.bx + (e.by - y) * e.slope;
      upright(px, Math.round(x + 4), Math.round(y - 4), { halo: true, left: true }); L.duckHead = { x: Math.round(x), y: Math.round(y) - 34 };
    }
    gate(t);
    grade();
  }
  return { layout, draw, L };
}
