// THE CLOUD PIER (Vin, 15/11: «khi lên rồi thì phải có 1 cái bến, trước khi bắt đầu đi câu»): the escalator comes up out
// of the sea of clouds onto a wooden pier, in the morning. On it: the harbour hut with its life ring and bell, a board of
// the day's departures (the sky's own numbers: how many clouds, how many golden), a bait stall whose jars are the CV's own
// skills, bunting, a gull in a captain's hat on the last post, a signpost, and the boat GOOD LUCK tied up, bobbing,
// waiting. Laid out from the canvas's size, wide or tall.

import { makePix, hash } from './pix.js';
import { upright } from './ducks.js';
import { drawBoat } from './boat.js';

export function makePier(g) {
  const px = makePix(g), { R, P, ell, line, poly, text, textW, puff } = px;
  const L = {};

  function layout(W, H) {
    const wide = W >= H;
    Object.assign(L, { W, H, wide });
    L.hz = Math.round(H * (wide ? 0.58 : 0.40));                    // the top of the sea of clouds
    L.deck = Math.round(H * (wide ? 0.61 : 0.43));                  // the deck's top, its back edge
    L.depth = 8;
    L.x0 = wide ? 44 : 30;                                          // where the escalator comes up
    L.x1 = Math.round(W * (wide ? 0.78 : 0.86));                    // the end of the pier
    L.hut = { x: L.x0 + (wide ? 28 : 22), w: 52, h: 44 };
    if (wide) { L.board = { x: L.hut.x + 62, y: L.deck - 50, w: 84, h: 40 }; L.stall = { x: L.hut.x + 156, w: 54 }; }
    else { L.board = { x: 8, y: L.deck - 104, w: 84, h: 40 }; L.stall = { x: L.hut.x + 62, w: 54 }; }
    L.sign = wide ? L.x1 - 12 : null;
    L.boat = wide ? { x: L.x1 + 6, y: L.deck + 20 } : { x: Math.round(W * 0.42), y: L.deck + 92 };
    L.x1 = wide ? L.x1 : W + 6;                                     // on a phone the pier runs off the right edge
    L.duck = { x: L.x0 + 10, y: L.deck + 5 };
    return L;
  }

  // ---- the sky, the sun, the sea of clouds --------------------------------------------------------------------------
  function sky(t) {
    const { W, H, hz } = L;
    const top = [79, 155, 224], low = [255, 217, 176];
    for (let i = 0; i < 16; i++) {
      const k = i / 15, col = top.map((v, j) => Math.round(v + (low[j] - v) * k * k));
      R(0, (i * hz) / 16, W, hz / 16 + 1, `rgb(${col})`);
    }
    // the sun, low and warm, rising behind the clouds
    const sx = Math.round(W * 0.84), sy = hz - 6;
    g.globalCompositeOperation = 'lighter';
    for (const [r, a] of [[46, 0.06], [30, 0.08], [18, 0.12]]) ell(sx, sy, r, r, `rgba(255,200,120,${a})`);
    g.globalCompositeOperation = 'source-over';
    ell(sx, sy, 11, 11, '#fff3c4'); ell(sx, sy, 9, 9, '#fffbe6');
    // high thin clouds, drifting
    for (let i = 0; i < 5; i++) {
      const x = ((hash(i) * W + t * (2 + i)) % (W + 60)) - 30, y = 12 + hash(i + 9) * hz * 0.4;
      R(x, y, 24 + hash(i + 3) * 20, 1, 'rgba(255,255,255,0.55)'); R(x + 6, y + 2, 16 + hash(i + 4) * 14, 1, 'rgba(255,255,255,0.35)');
    }
    // birds, far off
    for (let i = 0; i < 4; i++) {
      const x = ((W * 0.3 + i * 9 + t * 6) % (W + 40)) - 20, y = hz * 0.32 + (i % 2) * 4 + Math.sin(t * 3 + i) * 1.5, f = Math.sin(t * 8 + i) > 0;
      P(x - 2, y - (f ? 1 : 0), '#3a3a5a'); P(x - 1, y, '#3a3a5a'); P(x, y + 1, '#3a3a5a'); P(x + 1, y, '#3a3a5a'); P(x + 2, y - (f ? 1 : 0), '#3a3a5a');
    }
  }
  function sea(layer, t) {                                         // three rows of cloud tops, the far ones pink with the sun
    const { W, H, hz } = L;
    const rows = [[hz - 2, 16, '#f9dcd2', '#ecbfb8', 2], [hz + 10, 20, '#ffffff', '#e2e8f4', 4], [H - 4, 22, '#ffffff', '#d8e2f0', 7], [Math.round((hz + H) / 2 + 12), 13, '#f6f9ff', '#d4def0', 5]];
    const [y, r, top, under, speed] = rows[layer];
    if (layer === 0) R(0, hz + 4, W, H - hz, '#f2d6d6');
    if (layer === 1) R(0, hz + 14, W, H - hz, '#eef2fa');
    const step = layer === 3 ? r * 4.2 : r * 1.3;
    for (let i = -1; i < W / step + 2; i++) {
      const x = i * step - ((t * speed) % step) + (layer === 3 ? hash(i) * r * 2 : 0), wob = hash(i + layer * 50) * 6;
      puff(x, y + wob, r + hash(i + layer * 70) * 6, top, under);
      if (layer === 3) puff(x + r * 1.6, y + wob + 4, Math.round(r * 0.7), top, under);
    }
    if (layer === 2) R(0, H - 3, W, 3, '#ffffff');
  }
  function gaps(t) {                                                 // holes in the clouds: the city, far below, in the haze
    const { W, H, deck } = L, ys = L.wide ? [H - 20] : [deck + 150, deck + 196];
    ys.forEach((gy, n) => {
      const base = (L.wide ? W * 0.56 : W * (0.3 + n * 0.4)) + 60, gx = ((((base - t * 3) % (W + 120)) + W + 120) % (W + 120)) - 60, rx = L.wide ? 46 : 34, ry = L.wide ? 8 : 9;
      g.save(); g.beginPath(); g.ellipse(Math.round(gx), gy, rx, ry, 0, 0, Math.PI * 2); g.clip();
      R(gx - rx, gy - ry, rx * 2, ry * 2, '#9dbbd8');
      for (let i = 0; i < 16; i++) {
        const bx = gx - rx + i * 6 + hash(i + n * 20) * 3, bh = 3 + hash(i + 40 + n) * 8;
        R(bx, gy + ry - bh, 4, bh, '#6f8cae'); if (hash(i + 7) > 0.5) P(bx + 1, gy + ry - bh + 2, '#ffe6a0');
      }
      R(gx - rx, gy - ry, rx * 2, 3, 'rgba(255,255,255,0.45)');
      g.restore();
      for (let k = -rx; k <= rx; k += 9) puff(gx + k, gy - ry - 1 + Math.abs(k) / rx * 3, 6, '#ffffff', '#dfe6f2');
    });
  }

  // ---- the escalator's top, coming up out of the clouds ---------------------------------------------------------------
  function escalatorTop(t) {
    const { x0, deck } = L, slope = 0.84, by = L.H + 20, bx = x0 - (by - deck) * slope;
    const D = [13, -9], rise = 5, run = rise * slope, escX = (y) => bx + (by - y) * slope;
    for (let i = Math.ceil((by - deck) / rise); i >= 0; i--) {
      const y = by - (i + (t * 0.9) % 1) * rise, x = escX(y);
      if (y < deck) continue;
      poly([[x, y], [x + run, y], [x + run + D[0], y + D[1]], [x + D[0], y + D[1]]], '#f6d264');
      poly([[x, y], [x + D[0], y + D[1]], [x + D[0], y + D[1] + rise], [x, y + rise]], '#b8862a');
    }
    poly([[bx + run, by + 6], [x0 + run, deck + 6], [x0 + run, deck + 22], [bx + run, by + 22]], '#c9952a');
    line(bx + run, by + 6, x0 + run, deck + 6, '#ffe58a');
    line(bx - 2, by - 22, x0 - 2, deck - 22, '#17100a', 3); line(bx - 2, by - 24, x0 - 2, deck - 24, '#e8c25a');
    ell(x0, deck - 18, 5, 6, '#17100a'); ell(x0, deck - 19, 3, 4, '#3a2a14');                       // the rail's round end at the top
    R(x0 - 4, deck, 24, 3, '#c8c8d4'); for (let x = x0 - 2; x < x0 + 20; x += 3) P(x, deck + 1, '#8a8a96');
  }

  // ---- the pier ----------------------------------------------------------------------------------------------------------
  function pier() {
    const { x0, x1, deck, depth } = L;
    // the posts down into the clouds
    for (let x = x0 + 18; x <= x1; x += 30) { R(x, deck + depth, 5, 40, '#5a3a22'); R(x, deck + depth, 1, 40, '#7a5232'); }
    // the deck: planks seen from above, then its front edge
    R(x0, deck, x1 - x0 + 6, depth, '#b07c4a');
    for (let x = x0, i = 0; x < x1 + 6; x += 6, i++) { R(x, deck, 1, depth, '#8a5e36'); if (hash(i) > 0.6) R(x + 1, deck + 1, 5, depth - 2, '#bb8856'); }
    for (let x = x0 + 4; x < x1; x += 13) P(x, deck + 2, '#6a4628');                                // the nails
    R(x0, deck, x1 - x0 + 6, 1, '#d0a06a');
    R(x0, deck + depth, x1 - x0 + 6, 4, '#7a5232'); R(x0, deck + depth + 4, x1 - x0 + 6, 1, '#4a3020');
  }
  function railing(t) {                                              // posts and rope along the back edge, lanterns on some
    const { x0, x1, deck } = L, y = deck + 1;
    const posts = [];
    for (let x = x0 + 22; x <= x1; x += 30) posts.push(x);
    posts.forEach((x, i) => {
      R(x, y - 13, 3, 13, '#6a4628'); R(x, y - 13, 3, 1, '#8a6040');
      if (i < posts.length - 1) for (let k = 0; k <= 30; k++) P(x + 1 + k, y - 11 + Math.round(Math.sin(Math.PI * k / 30) * 3), '#c9b48a');
      if (i % 2 === 1) { const sw = Math.sin(t * 2 + i) * 1; R(x - 1 + sw, y - 20, 5, 6, '#e8643a'); R(x + sw, y - 19, 3, 4, '#ffb070'); R(x + 1, y - 22, 1, 2, '#3a2a1a'); }
    });
  }
  function hut(t) {
    const { x, w, h } = L.hut, y = L.deck + 4;
    R(x + 3, y - 1, w + 4, 3, 'rgba(60,30,10,0.35)');                                                 // its shadow
    R(x, y - h, w, h, '#c8955a');
    for (let yy = y - h + 4; yy < y; yy += 4) R(x, yy, w, 1, '#a87840');                              // its boards
    R(x, y - h, 2, h, '#e0b07a');                                                                      // the sun on its edge
    poly([[x - 6, y - h], [x + w + 6, y - h], [x + w - 4, y - h - 14], [x + 4, y - h - 14]], '#8a3a2a');   // the roof
    for (let yy = y - h - 12; yy < y - h; yy += 3) R(x - 4, yy, w + 8, 1, '#702c20');
    R(x - 6, y - h, w + 12, 2, '#5a2018');
    const bw = textW('CLOUD PIER') + 8;                                                               // its name board
    R(x + w / 2 - bw / 2, y - h - 24, bw, 10, '#f1ead6'); R(x + w / 2 - bw / 2, y - h - 24, bw, 1, '#8a6040');
    text('CLOUD PIER', x + w / 2 - bw / 2 + 4, y - h - 22, '#2a4a8a');
    R(x + 8, y - 22, 12, 22, '#7a4a2a'); R(x + 17, y - 12, 2, 2, '#ffd84a');                          // the door, its handle
    R(x + 26, y - h + 10, 18, 14, '#4a3020'); R(x + 27, y - h + 11, 16, 12, '#8fd0f0');               // the window
    R(x + 34, y - h + 11, 1, 12, '#4a3020'); R(x + 27, y - h + 16, 16, 1, '#4a3020');
    R(x + 25, y - h + 24, 20, 2, '#a87840');                                                          // its sill, a flower pot
    R(x + 30, y - h + 20, 5, 4, '#b5562f'); P(x + 31, y - h + 18, '#e8643a'); P(x + 33, y - h + 19, '#ffd84a'); P(x + 32, y - h + 17, '#5ab07a');
    const rx = x + w - 6, ry = y - 16;                                                                // the life ring
    ell(rx, ry, 6, 6, '#f1ead6'); ell(rx, ry, 3, 3, '#c8955a');
    for (const [dx, dy] of [[-5, 0], [5, 0], [0, -5], [0, 5]]) R(rx + dx - 1, ry + dy - 1, 3, 3, '#d03a2a');
    const bs = Math.sin(t * 1.5) * 0.8;                                                               // the bell, under the eaves
    R(x - 2, y - h - 1, 1, 4, '#5a3a22'); poly([[x - 5 + bs, y - h + 3], [x + 2 + bs, y - h + 3], [x + 1 + bs, y - h + 8], [x - 4 + bs, y - h + 8]], '#e8c25a');
  }
  function board(nums) {                                             // the day's departures: the sky's own numbers
    const { x, y, w, h } = L.board;
    R(x + 8, y + h, 3, L.deck + 4 - y - h, '#5a3a22'); R(x + w - 11, y + h, 3, L.deck + 4 - y - h, '#5a3a22');
    R(x + 2, y + 2, w, h, 'rgba(40,20,10,0.3)');
    R(x, y, w, h, '#1b1f3a'); R(x, y, w, 1, '#d9a63a'); R(x, y + h - 1, w, 1, '#d9a63a'); R(x, y, 1, h, '#d9a63a'); R(x + w - 1, y, 1, h, '#d9a63a');
    text('DEPARTURES', x + 4, y + 3, '#fff8e7'); R(x + 3, y + 9, w - 6, 1, '#3a3f6a');
    nums.forEach(([name, n, state], i) => {
      const yy = y + 12 + i * 8;
      R(x + 3, yy - 1, w - 6, 7, i % 2 ? '#20254a' : '#1b1f3a');
      text(name, x + 4, yy, '#ffd84a'); text(String(n), x + 46 - textW(String(n)), yy, '#ffd84a');
      text(state, x + w - 4 - textW(state), yy, state === 'BOARDING' ? '#7fe0a0' : '#c9d0ff');
    });
  }
  function stall(skills, t) {                                        // bait and tackle: the CV's own skills, in jars
    const x = L.stall.x, w = L.stall.w, y = L.deck + 4;
    R(x + 3, y - 1, w + 2, 3, 'rgba(60,30,10,0.35)');
    R(x, y - 16, w, 16, '#8a5a32'); R(x, y - 16, w, 2, '#a87040'); R(x + 2, y - 12, w - 4, 1, '#6a4224');   // the counter
    R(x + 1, y - 40, 2, 24, '#6a4628'); R(x + w - 3, y - 40, 2, 24, '#6a4628');                            // its poles
    for (let i = 0; i < 6; i++) R(x - 3 + i * (w + 6) / 6, y - 44, (w + 6) / 6, 6, i % 2 ? '#f1ead6' : '#d03a2a');   // the awning
    for (let i = 0; i < 6; i++) ell(x - 3 + (i + 0.5) * (w + 6) / 6, y - 38, 3, 1, i % 2 ? '#f1ead6' : '#d03a2a');
    const sw = textW('BAIT') + 6; R(x + w / 2 - sw / 2, y - 53, sw, 9, '#f1ead6'); text('BAIT', x + w / 2 - sw / 2 + 3, y - 51, '#d03a2a');
    const cols = ['#e8a040', '#7fb0e0', '#a0d070', '#d080c0', '#e0d060'];
    const used = new Set();
    skills.slice(0, 4).forEach((k, i) => {                          // a jar for each skill, its label, its lid
      const jx = x + 2 + i * 13, jy = y - 27;
      R(jx, jy, 12, 11, 'rgba(200,236,255,0.55)'); R(jx + 1, jy + 4, 10, 7, cols[i]); R(jx, jy - 2, 12, 2, '#5a5a6a');
      R(jx + 1, jy + 1, 1, 3, 'rgba(255,255,255,0.7)');
      const lab = short(k, used); R(jx, jy + 4, 12, 7, '#f1ead6'); text(lab, jx + 6 - textW(lab) / 2, jy + 5, '#3a2a1a');
    });
    const wx = x + 8, wob = Math.sin(t * 4) * 1;                    // a worm, out of the first jar, looking about
    line(wx, y - 28, wx + 1 + wob, y - 33, '#e88a8a', 2); P(wx + 1 + wob, y - 34, '#1b1f3a');
  }
  // a skill in three letters, as people write it (ML, SQL, AWS); two the same, the second by its own letters
  const SHORT = { python: 'PY', pytorch: 'PT', tensorflow: 'TF', javascript: 'JS', typescript: 'TS', 'machine learning': 'ML',
    'deep learning': 'DL', llms: 'LLM', llm: 'LLM', nlp: 'NLP', 'computer vision': 'CV', kubernetes: 'K8S', docker: 'DKR', react: 'RCT', golang: 'GO', go: 'GO' };
  function short(k, used) {
    const w = k.toLowerCase(), words = w.split(/\s+/);
    for (const c of [SHORT[w], words.length > 1 ? words.map((x) => x[0]).join('').slice(0, 3) : w.slice(0, 3), w[0] + w.slice(-2)]) {
      const u = (c || '').toUpperCase().replace(/[^A-Z0-9+#]/g, '');
      if (u && !used.has(u)) { used.add(u); return u; }
    }
    return '?';
  }
  function bunting(t) {                                              // little flags from the hut's roof to the awning
    const ax = L.hut.x + L.hut.w + 4, ay = L.deck + 4 - L.hut.h - 6, bx = L.stall.x, by = L.deck + 4 - 42;
    if (bx - ax < 20) return;
    const cols = ['#d03a2a', '#ffd84a', '#3a7be0', '#5ab07a', '#f1ead6'];
    for (let i = 0; i <= 40; i++) { const k = i / 40; P(ax + (bx - ax) * k, ay + (by - ay) * k + Math.sin(Math.PI * k) * 8, '#5a4a3a'); }
    for (let i = 1; i < 9; i++) {
      const k = i / 9, fx = ax + (bx - ax) * k, fy = ay + (by - ay) * k + Math.sin(Math.PI * k) * 8, s = Math.sin(t * 3 + i) * 0.6;
      poly([[fx - 2, fy], [fx + 2, fy], [fx + s, fy + 5]], cols[i % 5]);
    }
  }
  function signpost() {
    if (!L.sign) return;
    const x = L.sign, y = L.deck + 4;
    R(x, y - 34, 3, 34, '#6a4628');
    poly([[x - 4, y - 32], [x + 32, y - 32], [x + 36, y - 28], [x + 32, y - 24], [x - 4, y - 24]], '#e0c08a'); text('FISHING', x - 1, y - 30, '#3a2a1a');
  }
  function gull(x, y, t) {                                           // a gull on the last post, in a captain's hat
    R(x - 2, y, 7, 3, '#5a3a22');
    const b = Math.round(Math.sin(t * 1.3) * 0.5);
    ell(x + 1, y - 5 + b, 5, 4, '#f4f4f4'); ell(x + 2, y - 4 + b, 4, 2, '#b8c0cc');
    ell(x + 4, y - 10 + b, 3, 3, '#f4f4f4'); R(x + 7, y - 10 + b, 3, 1, '#f0b030'); P(x + 5, y - 11 + b, '#1b1f3a');
    R(x + 1, y - 15 + b, 7, 2, '#1b2a5a'); R(x + 2, y - 17 + b, 5, 2, '#1b2a5a'); R(x + 1, y - 14 + b, 8, 1, '#f4f4f4'); P(x + 4, y - 16 + b, '#ffd84a');
    R(x, y - 1, 1, 2, '#f0b030'); R(x + 3, y - 1, 1, 2, '#f0b030');
  }
  function boat(t) {                                                 // the GOOD LUCK, tied up, bobbing
    const { x, y } = L.boat, b = Math.round(Math.sin(t * 1.6) * 1.2), yy = y + b, w = 62;
    // the mooring rope to the last post
    const px0 = L.wide ? L.x1 + 2 : L.x1 - 20, py0 = L.deck + 2;
    for (let i = 0; i <= 20; i++) { const k = i / 20; P(px0 + (x + 6 - px0) * k, py0 + (yy - 6 - py0) * k + Math.sin(Math.PI * k) * 4, '#c9b48a'); }
    drawBoat(px, x, y, t);
  }

  // ---- the whole pier -------------------------------------------------------------------------------------------------------
  function draw(W, H, t = 0, data = {}) {
    px.use(g);
    const nums = data.board || [['LONDON', 69, 'ON TIME'], ['REMOTE', 12, 'ON TIME'], ['GOLDEN', 2, 'BOARDING']];
    const skills = data.skills || ['python', 'sql', 'pytorch', 'aws'];
    sky(t); sea(0, t); sea(1, t); gaps(t); sea(3, t);
    escalatorTop(t);
    pier(); railing(t);
    boat(t);
    hut(t); bunting(t); board(nums); stall(skills, t); signpost();
    gull(L.wide ? L.x1 + 2 : L.x1 - 4, L.deck - 2, t);
    upright(px, L.duck.x, L.duck.y, { blink: (t % 4) > 3.85 });
    sea(2, t);
  }
  return { layout, draw, L };
}
