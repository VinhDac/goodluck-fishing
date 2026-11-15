// THE SKY WHILE FISHING (Vin, 15/11: «cảnh trời tòa nhà cho nó di chuyển liên tục để tạo cảm giác nó đang đi»; and
// after the pier: «tôi muốn cảnh toà nhà phong phú hơn, chứ không lặp như giờ»): the boat GOOD LUCK sails on over a city
// that goes by underneath, drawn as the office and the pier are, in an oblique view from the front left and above, the
// sun lighting the tops and the right sides. The city never comes round again: every lot of ground is made up from its
// own number, in districts of their own kind (glass towers downtown, the old town's brick and slate, a river with its
// bridge and barges, a park with its pond, a campus of low glass, the harbour's warehouses and cranes, now and then a
// building going up), three rows deep, with streets between them and cars along them. On the roofs: pools, gardens,
// solar panels, helipads, a basketball court, water towers, aerials blinking, billboards bearing the names of the
// companies whose jobs are in the sky. The day runs from morning to sunset (day: 0 to 1); the windows light up with it.

import { makePix, hash } from './pix.js';
import { drawBoat } from './boat.js';

const KX = 0.5, KY = 0.6;
const KINDS = ['downtown', 'oldtown', 'river', 'park', 'downtown', 'campus', 'harbour', 'oldtown', 'downtown', 'park'];
const DISTRICT = 260;                                                // how long a district runs, in the city's own units

// opts.deep: the city as the bed of the fishing lake (PLAN.md 17): lower, so the sky between the boat and the roofs is the
// lake; no boat and no rushing wisps of its own (the fishing scene draws those it needs); where each roof is, kept in L.tops
export function makeVoyage(g, opts = {}) {
  const px = makePix(g), { R, P, ell, line, poly, text, textW } = px;
  const L = {};
  let names = ['Goggle', 'Amazoom', 'Snoozle', 'Facepalm'];
  let s = 0, day = 0.3, lit = 0, late = 0, T = 0;                    // how far we have sailed; the hour; how lit the windows are

  function layout(W, H) {
    const wide = W >= H;
    Object.assign(L, { W, H, wide });
    L.G = H + (wide ? 8 : -24);                                      // where the city's ground meets the bottom of the picture
    L.rows = opts.deep ? [
      { z: 92, lot: 30, seed: 11, hi: wide ? 40 : 110, lo: wide ? 16 : 40 },
      { z: 54, lot: 34, seed: 23, hi: wide ? 30 : 76, lo: wide ? 12 : 26 },
      { z: 16, lot: 40, seed: 37, hi: wide ? 20 : 44, lo: wide ? 8 : 14 },
    ] : [
      { z: 92, lot: 30, seed: 11, hi: wide ? 110 : 200, lo: wide ? 40 : 70 },
      { z: 54, lot: 34, seed: 23, hi: wide ? 76 : 140, lo: wide ? 26 : 44 },
      { z: 16, lot: 40, seed: 37, hi: wide ? 44 : 80, lo: wide ? 14 : 24 },
    ];
    if (opts.deep) L.G = H + (wide ? 16 : 14);                     // the roofs low: the sky above them is the lake
    L.boat = { x: Math.round(W * (wide ? 0.07 : 0.05)), y: Math.round(H * (wide ? 0.42 : 0.36)) };
    return L;
  }
  const S = (x, z, h = 0) => [x - s + z * KX, L.G - z * KY - h];      // a point of the city, on the screen, as we sail
  const quad = (pts, col) => poly(pts.map(([x, z, h]) => S(x, z, h || 0)), col);
  const kindAt = (x) => KINDS[Math.floor(hash(Math.floor(x / DISTRICT) * 7.31 + 3) * KINDS.length)];
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const rgb = (c) => `rgb(${c})`;
  const dusk = (c) => rgb(mix(c, [40, 30, 80], late * 0.4));

  // ---- a box of the city: right side lit, front in shade, top seen from above --------------------------------------------
  function box(x, z, w, d, h, { top, side, front, lift = 0 }) {
    const a = lift, b = lift + h;
    quad([[x + w, z, a], [x + w, z + d, a], [x + w, z + d, b], [x + w, z, b]], side);
    const [fx, fy] = S(x, z, a);
    R(fx, fy - h, w, h, front);
    quad([[x, z, b], [x + w, z, b], [x + w, z + d, b], [x, z + d, b]], top);
    line(fx, fy - h, fx + w - 1, fy - h, 'rgba(255,244,220,0.55)');
    return [fx, fy];
  }
  // windows on a front face: a grid, a band, or a wall of glass; lit as the day goes
  function windows(fx, fy, w, h, style, seed) {
    const top = fy - h, warm = '#ffe2a0';
    if (style === 'glass') {
      for (let y = top + 2; y < fy - 1; y += 4) {
        R(fx + 1, y, w - 2, 3, dusk(mix([120, 170, 210], [70, 90, 130], (y - top) / h)));
        for (let x = fx + 1; x < fx + w - 1; x += 3) if (hash(seed + x * 3.1 + y * 1.7) < lit * 0.75) R(x, y, 2, 3, warm);
        R(fx + 1, y + 3, w - 2, 1, 'rgba(30,40,60,0.6)');
      }
      for (let k = 0; k < 3; k++) { const sx = fx + ((seed * 7 + k * 11) % Math.max(2, w - 6)); line(sx, fy - 2, sx + 5, top + 2, 'rgba(255,255,255,0.18)'); }   // the sky in it
      return;
    }
    for (let y = top + 3; y < fy - 3; y += 5) {
      if (style === 'band') { R(fx + 2, y, w - 4, 2, '#3e4a66'); for (let x = fx + 2; x < fx + w - 2; x += 2) if (hash(seed + x + y * 3) < lit * 0.7) R(x, y, 2, 2, warm); continue; }
      for (let x = fx + 2; x < fx + w - 3; x += 4) {
        const r = hash(seed + x * 1.3 + y * 2.9);
        R(x, y, 2, 3, r < lit * 0.8 ? warm : r > 0.88 ? '#a8c8e8' : '#3a4560');
      }
    }
  }

  // ---- what may stand on a roof ----------------------------------------------------------------------------------------------
  function roof(x, z, w, d, h, seed, kind) {
    const r = hash(seed * 1.7 + 0.3), at = (u, v, hh = 0) => S(x + u, z + v, h + hh);
    const pick = kind === 'downtown' ? ['helipad', 'pool', 'tower', 'aerial', 'ac', 'garden', 'sign'] : kind === 'campus' ? ['solar', 'garden', 'sign', 'solar'] :
      kind === 'harbour' ? ['ac', 'solar', 'sign'] : ['tower', 'garden', 'court', 'ac', 'pool', 'sign', 'aerial', 'solar'];
    const what = pick[Math.floor(r * pick.length)];
    if (what === 'pool' && w > 18) {
      quad([[x + 3, z + 3, h], [x + w - 4, z + 3, h], [x + w - 4, z + d - 4, h], [x + 3, z + d - 4, h]], '#d8d4c8');
      quad([[x + 5, z + 5, h], [x + w - 6, z + 5, h], [x + w - 6, z + d - 6, h], [x + 5, z + d - 6, h]], '#3ab0e0');
      const [a, b] = at(7, 6); line(a, b, a + 6, b - 2, 'rgba(255,255,255,0.7)');
      const [c, e] = at(w - 5, d - 3); R(c - 3, e - 1, 3, 1, '#e8643a'); R(c - 3, e - 4, 3, 1, '#ffd84a');      // two loungers
      return;
    }
    if (what === 'garden') {
      quad([[x + 2, z + 2, h], [x + w - 2, z + 2, h], [x + w - 2, z + d - 2, h], [x + 2, z + d - 2, h]], '#6a9a4a');
      for (let k = 0; k < 4; k++) { const [a, b] = at(4 + hash(seed + k) * (w - 8), 4 + hash(seed + k + 9) * (d - 8)); ell(a, b - 2, 2, 2, '#3e7a3a'); ell(a + 1, b - 3, 1, 1, '#7ab85a'); }
      return;
    }
    if (what === 'solar') {
      for (let v = 3; v < d - 4; v += 5) quad([[x + 3, z + v, h + 1], [x + w - 3, z + v, h + 1], [x + w - 3, z + v + 3, h + 2], [x + 3, z + v + 3, h + 2]], '#2a3a6a');
      for (let v = 3; v < d - 4; v += 5) { const [a, b] = at(3, v + 3, 2), [c] = at(w - 3, v + 3, 2); R(a, b, c - a, 1, '#6a8acc'); }
      return;
    }
    if (what === 'helipad' && w > 20) {
      quad([[x + 3, z + 3, h], [x + w - 3, z + 3, h], [x + w - 3, z + d - 3, h], [x + 3, z + d - 3, h]], '#3a3e4a');
      const [a, b] = at(w / 2, d / 2); ell(a, b, Math.min(8, Math.floor(w / 3)), 3, '#ffd84a'); ell(a, b, Math.min(7, Math.floor(w / 3) - 1), 2, '#3a3e4a'); text('H', a - 1, b - 2, '#f4f4f4');
      return;
    }
    if (what === 'court' && w > 18) {
      quad([[x + 3, z + 3, h], [x + w - 3, z + 3, h], [x + w - 3, z + d - 3, h], [x + 3, z + d - 3, h]], '#d8783a');
      const [a, b] = at(w / 2, 3), [c, e] = at(w / 2, d - 3); line(a, b, c, e, '#f4f4f4');
      const [f, k] = at(4, d / 2); R(f, k - 5, 1, 5, '#f4f4f4'); R(f - 1, k - 6, 3, 1, '#e8643a');
      return;
    }
    if (what === 'tower') {                                         // a water tower on its legs
      const [a, b] = at(w * 0.6, d * 0.55);
      R(a - 3, b - 4, 1, 4, '#3a3a4a'); R(a + 3, b - 4, 1, 4, '#3a3a4a');
      R(a - 4, b - 11, 9, 7, '#8a5a32'); R(a + 3, b - 11, 2, 7, '#b07a48'); for (let k = 0; k < 3; k++) R(a - 4, b - 10 + k * 2, 9, 1, '#6a4224');
      poly([[a - 5, b - 11], [a + 5, b - 11], [a, b - 15]], '#5a3a22');
      return;
    }
    if (what === 'aerial') {
      const [a, b] = at(w * 0.5, d * 0.5);
      R(a, b - 16, 1, 16, '#3a3a4a'); R(a - 2, b - 10, 5, 1, '#3a3a4a'); R(a - 1, b - 13, 3, 1, '#3a3a4a');
      if (Math.sin(T * 3 + seed) > 0.3) { P(a, b - 17, '#ff4a3a'); P(a - 1, b - 17, 'rgba(255,74,58,0.4)'); P(a + 1, b - 17, 'rgba(255,74,58,0.4)'); }
      return;
    }
    if (what === 'sign') { billboard(x, z, w, d, h, seed); return; }
    for (let k = 0; k < 3; k++) box(x + 3 + k * (w / 3), z + 3 + (k % 2) * 4, 5, 4, 3, { top: '#b8bcc8', side: '#9a9eac', front: '#7a7e8c', lift: h });   // air conditioning
  }
  // a billboard on a roof, with the name of a company whose jobs are in the sky
  function billboard(x, z, w, d, h, seed) {
    let n = names[Math.floor(hash(seed * 3.3) * names.length)].toUpperCase();
    while (textW(n) + 6 > w + 18 && n.length > 3) n = n.slice(0, -1);
    const bw = textW(n) + 6, [a, b] = S(x + w / 2 - bw / 2, z + d / 2, h);
    R(a + 2, b - 4, 1, 5, '#3a3a4a'); R(a + bw - 3, b - 4, 1, 5, '#3a3a4a');
    R(a, b - 13, bw, 9, '#1b1f3a'); R(a, b - 13, bw, 1, '#d9a63a'); R(a + bw, b - 12, 1, 9, '#3a3f6a');
    text(n, a + 3, b - 11, lit > 0.25 ? '#ffd84a' : '#fff8e7');
    if (lit > 0.25) { g.globalCompositeOperation = 'lighter'; R(a - 1, b - 14, bw + 2, 11, `rgba(255,200,80,${(0.12 * lit).toFixed(2)})`); g.globalCompositeOperation = 'source-over'; }
  }

  // ---- the kinds of building -------------------------------------------------------------------------------------------------
  function glassTower(x, z, w, d, h, seed) {
    const pal = [[[110, 170, 200], [150, 205, 230], [60, 110, 150]], [[120, 150, 190], [170, 195, 230], [70, 90, 140]], [[100, 170, 160], [150, 215, 205], [50, 110, 110]]][Math.floor(hash(seed) * 3)];
    const tiers = h > 70 && hash(seed + 5) > 0.4 ? 2 : 1, h1 = tiers === 2 ? Math.round(h * 0.62) : h;
    const [fx, fy] = box(x, z, w, d, h1, { top: dusk(pal[1]), side: dusk(pal[1]), front: dusk(pal[2]) });
    windows(fx, fy, w, h1, 'glass', seed);
    if (tiers === 2) {                                              // a setback: a narrower tower on top of the first
      const w2 = Math.round(w * 0.66), d2 = Math.round(d * 0.7), x2 = x + Math.round((w - w2) / 2), z2 = z + Math.round((d - d2) / 2);
      const [gx, gy] = box(x2, z2, w2, d2, h - h1, { top: dusk(pal[1]), side: dusk(pal[1]), front: dusk(pal[0]), lift: h1 });
      windows(gx, gy, w2, h - h1, 'glass', seed + 9);
      crown(x2, z2, w2, d2, h, seed);
    } else crown(x, z, w, d, h, seed);
  }
  function crown(x, z, w, d, h, seed) {                             // the top of a tower: its name, a mast, a spire, or a roof of its own
    const r = hash(seed + 21);
    if (r < 0.35) {                                                  // its company's name across the top, lit at dusk
      let n = names[Math.floor(hash(seed * 5.1) * names.length)].toUpperCase();
      while (textW(n) + 4 > w && n.length > 2) n = n.slice(0, -1);
      const [a, b] = S(x, z, h);
      R(a + w / 2 - textW(n) / 2 - 2, b + 1, textW(n) + 4, 7, 'rgba(10,14,30,0.55)');
      text(n, a + w / 2 - textW(n) / 2, b + 2, lit > 0.2 ? '#ffe28a' : '#ffffff');
      roof(x, z, w, d, h, seed, 'downtown');
    } else if (r < 0.55) {
      const [a, b] = S(x + w / 2, z + d / 2, h);
      R(a - 1, b - 22, 2, 22, '#c8ccd8'); R(a, b - 22, 1, 22, '#ffffff');
      if (Math.sin(T * 2.4 + seed) > 0) P(a, b - 23, '#ff4a3a');
    } else if (r < 0.7) {
      const [a, b] = S(x, z, h), [c] = S(x + w, z, h), [e, f] = S(x + w / 2, z + d / 2, h + 14);
      poly([[a, b], [c, b], [e, f]], dusk([150, 205, 230]));
      poly([[c, b], [e, f], [c + d * KX, b - d * KY]], dusk([190, 225, 245]));
    } else roof(x, z, w, d, h, seed, 'downtown');
  }
  function office(x, z, w, d, h, seed, kind) {
    const c = [[[200, 196, 186], [222, 218, 206], [168, 162, 150]], [[190, 200, 210], [214, 222, 230], [150, 160, 176]], [[214, 200, 170], [232, 220, 192], [176, 160, 132]]][Math.floor(hash(seed + 2) * 3)];
    const [fx, fy] = box(x, z, w, d, h, { top: dusk(c[1]), side: dusk(c[1]), front: dusk(c[2]) });
    windows(fx, fy, w, h, hash(seed + 3) > 0.5 ? 'grid' : 'band', seed);
    roof(x, z, w, d, h, seed, kind);
  }
  function brick(x, z, w, d, h, seed) {                             // the old town: brick, white windows, a slate or tiled roof
    const reds = [[150, 76, 56], [170, 96, 66], [120, 70, 60], [190, 140, 100]], c = reds[Math.floor(hash(seed) * 4)];
    const [fx, fy] = box(x, z, w, d, h, { top: dusk(mix(c, [255, 230, 200], 0.2)), side: dusk(mix(c, [255, 220, 180], 0.25)), front: dusk(c) });
    for (let y = fy - h + 4; y < fy - 3; y += 6) for (let xx = fx + 3; xx < fx + w - 4; xx += 6) {
      R(xx - 1, y - 1, 4, 5, '#f0e8dc'); R(xx, y, 2, 3, hash(seed + xx + y * 2) < lit * 0.85 ? '#ffd890' : '#4a4a5a');
    }
    // the roof: a gable along the street, the slope toward us, its end lit, a chimney
    const rh = 8 + Math.round(hash(seed + 4) * 6), tile = hash(seed + 6) > 0.5 ? [90, 96, 110] : [150, 70, 50];
    quad([[x - 1, z - 1, h], [x + w + 1, z - 1, h], [x + w + 1, z + d / 2, h + rh], [x - 1, z + d / 2, h + rh]], dusk(tile));
    for (let k = 1; k < 4; k++) { const f = k / 4; quad([[x - 1, z - 1 + (d / 2 + 1) * f, h + rh * f], [x + w + 1, z - 1 + (d / 2 + 1) * f, h + rh * f], [x + w + 1, z + (d / 2 + 1) * f, h + rh * f + 0.6], [x - 1, z + (d / 2 + 1) * f, h + rh * f + 0.6]], dusk(mix(tile, [0, 0, 0], 0.25))); }
    quad([[x + w + 1, z - 1, h], [x + w + 1, z + d + 1, h], [x + w + 1, z + d / 2, h + rh]], dusk(mix(c, [255, 220, 180], 0.35)));
    const [ra, rb] = S(x - 1, z + d / 2, h + rh), [rc] = S(x + w + 1, z + d / 2, h + rh); R(ra, rb, rc - ra, 1, dusk(mix(tile, [255, 240, 220], 0.4)));
    box(x + Math.round(w * 0.7), z + d / 2 + 1, 4, 3, rh / 2 + 5, { top: '#4a2a20', side: dusk([176, 100, 80]), front: dusk([140, 74, 58]), lift: h + rh / 2 });
    if (hash(seed + 8) > 0.6) {                                     // washing hung out on the roof
      const [a, b] = S(x + 2, z + d / 2, h + rh + 2), [c2] = S(x + w - 2, z + d / 2, h + rh + 2);
      line(a, b, c2, b, '#d8d8d8'); for (let k = a + 2; k < c2 - 2; k += 4) R(k, b + 1, 2, 3, ['#e8643a', '#3a7be0', '#ffd84a', '#f4f4f4'][Math.floor(k / 4) % 4]);
    }
  }
  function campus(x, z, w, d, h, seed) {                            // low glass, a logo, grass round it
    quad([[x - 2, z - 2], [x + w + 2, z - 2], [x + w + 2, z + d + 2], [x - 2, z + d + 2]], dusk([122, 168, 96]));
    const [fx, fy] = box(x, z, w, d, h, { top: dusk([232, 238, 244]), side: dusk([200, 220, 235]), front: dusk([110, 160, 190]) });
    windows(fx, fy, w, h, 'glass', seed);
    roof(x, z, w, d, h, seed, 'campus');
  }
  function warehouse(x, z, w, d, h, seed) {                          // the harbour: a sawtooth roof, containers stacked by it
    const c = [[160, 170, 180], [120, 140, 150], [180, 160, 130]][Math.floor(hash(seed) * 3)];
    const [fx, fy] = box(x, z, w, d, h, { top: dusk(c), side: dusk(mix(c, [255, 255, 255], 0.2)), front: dusk(mix(c, [0, 0, 0], 0.2)) });
    R(fx + 4, fy - 10, 10, 10, '#4a4e5a'); for (let k = 0; k < 4; k++) R(fx + 4, fy - 10 + k * 2.5, 10, 1, '#6a6e7a');   // a roller door
    for (let u = 2; u < w - 4; u += 7) quad([[x + u, z + 1, h], [x + u + 6, z + 1, h], [x + u + 6, z + d - 1, h + 4], [x + u, z + d - 1, h + 4]], dusk(mix(c, [255, 255, 255], 0.3)));
    const cols = [[210, 80, 60], [60, 120, 190], [90, 160, 90], [230, 180, 60]], o = Math.floor(hash(seed + 3) * 4);
    for (let k = 0; k < 3; k++) { const cc = cols[(o + k) % 4]; box(x + w - 12, z - 10 + (k % 2) * 3, 10, 5, 5, { top: rgb(mix(cc, [255, 255, 255], 0.25)), side: rgb(cc), front: rgb(mix(cc, [0, 0, 0], 0.3)), lift: k * 5 }); }
  }
  function crane(x, z, h, seed) {                                     // a tower crane, its arm swinging slowly
    if (opts.deep) return;                                              // not into the lake: it would stand among the fish
    const [a, b] = S(x, z, 0), [, c] = S(x, z, h + 30);
    for (let y = c; y < b; y += 3) { R(a, y, 3, 1, '#e8b030'); P(a + 1, y + 1, '#a87820'); }
    R(a - 1, c, 5, 3, '#e8b030');
    const swing = Math.sin(T * 0.25 + seed) * 0.4, len = 34;
    const ex = a + 2 + Math.cos(swing) * len, ey = c + Math.sin(swing) * 4;
    line(a + 2, c, ex, ey, '#e8b030', 2); line(a + 2, c, a - 10, c + 1, '#e8b030', 2); R(a - 13, c - 1, 4, 4, '#5a5a6a');
    const hx = a + 2 + Math.cos(swing) * len * 0.7, hy = ey + 1;
    line(hx, hy, hx, hy + 14, '#3a3a4a'); R(hx - 2, hy + 14, 5, 3, '#e86a3a');
  }
  function frame(x, z, w, d, h, seed) {                               // a building going up: its floors, its steel, its crane
    const floors = Math.max(2, Math.round(h / 6));
    for (let f = 0; f < floors; f++) quad([[x, z, f * 6], [x + w, z, f * 6], [x + w, z + d, f * 6], [x, z + d, f * 6]], dusk([150, 150, 160]));
    for (const [u, v] of [[0, 0], [w, 0], [0, d], [w, d], [w / 2, 0]]) { const [a, b] = S(x + u, z + v, 0), [, c] = S(x + u, z + v, h); R(a, c, 1, b - c, '#c0503a'); }
    crane(x + w + 4, z + d / 2, h, seed);
  }
  function tree(x, z, r) {
    const [a, b] = S(x, z);
    ell(a - 2, b, r, 1, 'rgba(40,60,30,0.35)');
    R(a, b - r, 1, r, '#6a4a2a');
    ell(a, b - r - 2, r, r, dusk([60, 120, 60])); ell(a + 1, b - r - 3, r - 1, r - 2, dusk([100, 160, 80]));
  }
  function park(x, z, w, d, seed) {                                   // grass, a path, trees, sometimes a pond with a duck on it
    quad([[x, z], [x + w, z], [x + w, z + d], [x, z + d]], dusk([120, 168, 88]));
    const [a, b] = S(x, z + d / 2), [c, e] = S(x + w, z + d / 2); line(a, b, c, e, '#d8c8a0');
    if (hash(seed + 1) > 0.5) {
      const [p, q] = S(x + w / 2, z + d / 2); ell(p, q, Math.floor(w / 3), 3, '#4a8ac0'); ell(p - 2, q - 1, Math.floor(w / 4), 1, '#8ac0e8');
      if (Math.sin(T * 0.7 + seed) > 0) { P(p + 4, q, '#ffd84a'); P(p + 5, q - 1, '#ffd84a'); }
    }
    for (let k = 0; k < 5; k++) tree(x + 3 + hash(seed + k) * (w - 6), z + 3 + hash(seed + k + 5) * (d - 6), 3 + hash(seed + k + 9) * 3);
  }
  function car(x, z, h, k) {
    const cols = ['#d03a2a', '#3a7be0', '#f4f4f4', '#ffd84a', '#2a2a3a', '#5ab07a'];
    const [a, b] = S(x, z, h);
    R(a, b - 3, 5, 3, cols[k % 6]); R(a + 1, b - 4, 3, 1, 'rgba(200,230,255,0.9)');
    if (lit > 0.3) { P(a + 5, b - 2, '#fff4c0'); P(a - 1, b - 2, '#ff4a3a'); }
  }
  function river(x, z, w, d, seed, isBridge) {                         // water and its ripples, a barge; a bridge across
    quad([[x, z - 14], [x + w, z - 14], [x + w, z + d + 14], [x, z + d + 14]], dusk([80, 140, 190]));
    for (let k = 0; k < 6; k++) { const [a, b] = S(x + ((k * 13 + T * 6) % w), z - 10 + k * 7); R(a, b, 6, 1, 'rgba(220,240,255,0.5)'); }
    if (hash(seed + 2) > 0.6) {
      const [a, b] = S(x + w / 2, z + d / 2);
      poly([[a - 10, b], [a + 10, b], [a + 8, b + 3], [a - 8, b + 3]], '#3a3a4a'); R(a - 7, b - 3, 9, 3, '#c8503a'); R(a + 3, b - 5, 4, 5, '#f4efe2');
    }
    if (isBridge) {
      quad([[x, z - 16, 6], [x + w, z - 16, 6], [x + w, z + d + 16, 6], [x, z + d + 16, 6]], '#8a8e9a');
      quad([[x, z - 16, 6], [x + w, z - 16, 6], [x + w, z - 16, 3], [x, z - 16, 3]], '#5a5e6a');
      for (let k = 0; k < 4; k++) { const v = ((k * 23 + T * 18) % (d + 30)) - 15; car(x + w / 2 - 3 + (k % 2) * 4, z + v, 6, k); }
    }
  }

  // ---- a lot of the city: what stands on it, from its own number -------------------------------------------------------------
  function lot(row, i) {
    const x = i * row.lot, seed = i * 13.7 + row.seed, kind = kindAt(x + row.lot / 2);
    const roofAt = (hh) => { const [a, b] = S(x + row.lot / 2, row.z + 12, hh); L.tops.push({ x: a, y: b, row: row.seed, lot: i }); };
    const r = hash(seed), gap = 3 + Math.round(hash(seed + 1) * 4), w = row.lot - gap, d = 20 + Math.round(hash(seed + 2) * 8), z = row.z;
    const h = Math.round(row.lo + (row.hi - row.lo) * hash(seed + 3) ** (kind === 'downtown' ? 0.7 : 1.4));
    if (kind === 'river') { river(x, z, row.lot, d, seed, Math.abs(i) % 9 === 4); return; }
    if (kind === 'park' && r < 0.75) { park(x, z, row.lot, d, seed); return; }
    if (r > 0.95 && kind !== 'oldtown') { frame(x, z, w, d, Math.min(h, 40), seed); return; }
    if (kind === 'downtown') { if (r < 0.62) { glassTower(x + 2, z, w - 4, d, h, seed); roofAt(h); } else { office(x, z, w, d, Math.round(h * 0.8), seed, kind); roofAt(Math.round(h * 0.8)); } return; }
    if (kind === 'oldtown') { brick(x, z, w, d, Math.min(h, 34), seed); roofAt(Math.min(h, 34) + 8); return; }
    if (kind === 'campus') { campus(x + 2, z, w - 4, d - 4, Math.min(h, 18), seed); roofAt(Math.min(h, 18)); return; }
    if (kind === 'harbour') { warehouse(x, z, w, d, Math.min(h, 20), seed); roofAt(Math.min(h, 20)); if (r > 0.9 && row.seed === 37) crane(x + w - 4, z + d, 40, seed); return; }
    office(x, z, w, d, Math.round(h * 0.7), seed, kind); roofAt(Math.round(h * 0.7));
  }
  function street(row) {                                               // the street in front of a row, its cars going by
    const z0 = row.z - 12, from = s - row.z * KX - 40, to = from + L.W + 80;
    quad([[from, z0], [to, z0], [to, z0 + 10], [from, z0 + 10]], dusk([80, 84, 96]));
    quad([[from, z0 + 10], [to, z0 + 10], [to, z0 + 12], [from, z0 + 12]], '#a8a8b0');
    for (let x = Math.floor(from / 12) * 12; x < to; x += 12) { const [a, b] = S(x, z0 + 5); R(a, b, 5, 1, '#e8e0b0'); }
    for (let k = 0; k < 10; k++) {
      const dir = k % 2 ? 1 : -1, span = L.W + 160, cx = from + (((hash(row.seed + k) * span + dir * T * (14 + k * 2)) % span) + span) % span;
      car(cx, z0 + (dir > 0 ? 2 : 7), 0, k + row.seed);
    }
    if (lit > 0.3) for (let x = Math.floor(from / 30) * 30; x < to; x += 30) {
      const [a, b] = S(x, z0 + 11, 10); R(a, b, 1, 10, '#3a3a4a'); P(a, b - 1, '#ffe8a0');
      g.globalCompositeOperation = 'lighter'; ell(a, b + 8, 4, 2, 'rgba(255,220,140,0.12)'); g.globalCompositeOperation = 'source-over';
    }
  }
  function cityRow(row) {
    const first = Math.floor((s - row.z * KX - 60) / row.lot), last = Math.ceil((s - row.z * KX + L.W + 30) / row.lot);
    const from = s - row.z * KX - 60, to = from + L.W + 120;
    quad([[from, row.z - 2], [to, row.z - 2], [to, row.z + 34], [from, row.z + 34]], dusk([150, 150, 156]));
    street(row);
    for (let i = first; i <= last; i++) lot(row, i);
  }

  // ---- the sky ---------------------------------------------------------------------------------------------------------------
  const lowSky = () => mix([214, 232, 248], [252, 168, 120], late);
  function sky(t) {
    const { W, H } = L;
    const top = mix([86, 150, 220], [58, 52, 120], late), low = lowSky();
    for (let i = 0; i < 22; i++) R(0, (i * H) / 22, W, H / 22 + 1, rgb(mix(top, low, (i / 21) ** 1.3)));
    const sx = W * (0.3 + day * 0.62), sy = H * 0.55 - Math.sin(Math.PI * Math.min(1, day * 1.05)) * H * 0.45;
    g.globalCompositeOperation = 'lighter';
    for (const [r, a] of [[46, 0.06], [28, 0.09], [16, 0.12]]) ell(sx, sy, r, r, `rgba(255,${Math.round(200 - late * 60)},120,${a})`);
    g.globalCompositeOperation = 'source-over';
    ell(sx, sy, 8, 8, late > 0.5 ? '#ffd2a8' : '#fff3c4');
    for (let i = 0; i < 6; i++) {                                     // high thin clouds
      const x = ((hash(i) * (W + 80) - t * (2 + i * 0.6)) % (W + 80) + W + 80) % (W + 80) - 40, y = 10 + hash(i + 9) * H * 0.28, w = 26 + hash(i + 3) * 30;
      R(x, y, w, 2, 'rgba(255,255,255,0.6)'); R(x + 5, y + 2, w - 10, 1, late > 0.3 ? 'rgba(255,190,150,0.7)' : 'rgba(220,230,250,0.6)');
    }
    g.globalAlpha = 0.5;                                              // clouds far off, low and hazy: never taken for the jobs' clouds
    for (let i = 0; i < 7; i++) {
      const x = ((hash(i + 40) * (W + 120) - t * 1.5) % (W + 120) + W + 120) % (W + 120) - 60, y = H * (0.46 + hash(i + 50) * 0.08);
      px.lump(x, y, 5 + hash(i + 60) * 5, late > 0.4 ? 'dusk' : 'far');
    }
    g.globalAlpha = 1;
  }
  function farCity() {                                                 // the far city in the haze, slower than the near one
    const { W, H } = L, off = s * 0.35, base = L.G - 120 * KY, c = rgb(mix([168, 190, 218], [110, 100, 150], late));
    for (let i = Math.floor(off / 9) - 2; i < (off + W) / 9 + 2; i++) {
      const w = 7 + hash(i + 500) * 8, h = 12 + hash(i + 600) ** 1.6 * 46, x = i * 9 - off;
      R(x, base - h, w, h + 40, c);
      if (hash(i + 700) > 0.75) R(x + w / 2, base - h - 6, 1, 6, c);
      if (lit > 0.4) for (let k = 0; k < 3; k++) if (hash(i * 3 + k) > 0.5) P(x + 2 + k * 2, base - h + 4 + k * 5, '#ffe2a0');
    }
    R(0, base - 30, W, H, `rgba(${mix([200, 216, 236], [200, 140, 140], late)},0.35)`);
  }
  function haze(a) { R(0, 0, L.W, L.H, `rgba(${lowSky()},${a})`); }
  function plane(t) {                                                  // now and then, a plane trailing NOW HIRING
    const { W } = L, k = (t % 45) / 16;
    if (k > 1) return;
    const x = W + 60 - k * (W + 220), y = 20 + Math.sin(t) * 1.5;
    ell(x, y, 7, 2, '#eceef4'); R(x - 3, y - 4, 4, 3, '#d03a2a'); R(x + 3, y - 1, 3, 1, '#2a3a6a'); poly([[x - 1, y], [x + 3, y], [x - 4, y + 4]], '#c8ccd8');
    const word = 'NOW HIRING', bw = textW(word) + 6, bx = x + 18;
    line(x + 7, y, bx, y, '#8a8a96');
    R(bx, y - 4, bw, 8, '#fff8e7'); R(bx, y + 3, bw, 1, '#d8ccb0'); text(word, bx + 3, y - 2, '#d03a2a');
    for (let i = 0; i < 4; i++) P(bx + bw + i, y - 3 + ((i + Math.floor(t * 8)) % 2) * 6, '#fff8e7');
  }
  function balloon(t) {                                                 // a hot air balloon, far off, once in a long while
    const { W, H } = L, k = ((t + 20) % 90) / 60;
    if (k > 1) return;
    const x = W * 1.1 - k * W * 1.3, y = H * 0.22 + Math.sin(t * 0.5) * 2;
    ell(x, y, 5, 6, '#e8643a'); R(x - 1, y - 6, 2, 12, '#ffd84a'); R(x - 4, y - 2, 1, 5, '#ffd84a'); R(x + 3, y - 2, 1, 5, '#ffd84a');
    line(x - 3, y + 5, x - 1, y + 9, '#5a3a22'); line(x + 3, y + 5, x + 1, y + 9, '#5a3a22'); R(x - 2, y + 9, 4, 3, '#8a5a32');
  }

  // ---- the whole sky, as we sail ------------------------------------------------------------------------------------------------
  function draw(W, H, t = 0, data = {}) {
    px.use(g);
    if (data.names && data.names.length) names = data.names;
    const dt = Math.min(0.1, Math.max(0, t - T));
    T = t; day = data.day ?? 0.3;
    s = data.at != null ? data.at : s + dt * (data.speed ?? 16);
    L.tops = [];
    late = Math.max(0, (day - 0.7) / 0.3); lit = Math.max(0, (day - 0.55) / 0.45);
    sky(t); balloon(t); plane(t);
    farCity();
    const [back, mid, front] = L.rows;
    cityRow(back); haze(0.22);
    cityRow(mid); haze(0.10);
    R(0, L.G - (front.z - 12) * KY, W, H, dusk([96, 100, 110]));                                          // the near pavement, under the front row
    cityRow(front);
    if (opts.deep) { if (late > 0) R(0, 0, W, H, `rgba(60,30,90,${(late * 0.12).toFixed(3)})`); return null; }
    ell(L.boat.x + 30 + Math.sin(t * 0.5) * 4, L.G - 70 * KY - 30, 22, 3, 'rgba(40,40,80,0.18)');    // the boat's shadow far below
    const tip = drawBoat(px, L.boat.x, L.boat.y, t, { duck: true, sailing: true, shadow: false, rod: data.rod ?? -0.95 });
    for (const c of data.clouds || []) px.lump(c.x, c.y, c.r, c.gold ? 'gold' : 'near');
    for (let i = 0; i < 4; i++) {                                        // wisps of cloud rushing by in front, fastest of all
      const sp = 44 + hash(i + 900) * 24, x = ((hash(i + 800) * (W + 200) - t * sp) % (W + 200) + W + 200) % (W + 200) - 100;
      px.lump(x, H * (0.7 + hash(i + 950) * 0.25), 10 + hash(i + 990) * 8, late > 0.5 ? 'dusk' : 'near');
    }
    if (late > 0) R(0, 0, W, H, `rgba(60,30,90,${(late * 0.12).toFixed(3)})`);
    return tip;
  }
  return { layout, draw, L, get late() { return late; }, get lit() { return lit; } };
}
