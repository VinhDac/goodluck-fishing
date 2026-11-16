// THE SKY OF LETTERS (PLAN.md 18): the city below, the boat GOOD LUCK on its own cloud at the top left, the duck at its
// stern with the rod, and the letters flying between the roofs and the boat. Drawn on the stage (js/stage.js): every
// layer and every sprite at the art's own size, set on the screen where it really is, to the screen's own pixel, so the
// city slides, the letters glide, the boat rides its cloud, and nothing steps. What moves, and how, is js/letters.js's.

import { hash } from './pix.js';
import { makeVoyage, drawCar } from './voyage.js';
import { drawBoat, SEAT } from './boat.js';
import { upright } from './ducks.js';

const LETTER = {                                                     // a letter's colours: outline, paper, shade, flap, seal, its light
  plain: ['#7d6e5a', '#fbf7ec', '#e8dfcb', '#cdbf9f', '#d03a2a', '#ff8a70'],
  gold: ['#a8701a', '#fff3c8', '#f2d98c', '#e0b850', '#ffd84a', '#fff6c0'],
  old: ['#8a7448', '#eedfb5', '#dccb98', '#c9b47e', '#a8584a', '#d08a78'],
  unread: ['#8a8a96', '#f2f0ea', '#dedbd2', '#c8c6be', null, null],
};
// a wing, the left one, row by row (# its edge, W white, S in shade); the right is its mirror. [rows, the row it is fixed by]
const WINGS = [
  [['#.....', '#W#...', '#WW#..', '.#WW#.', '.#WWW#', '..#WSS'], 5],          // up
  [['#####.', '#WWWW#', '.#WWWS', '..###S'], 2],                              // level
  [['..#WSS', '.#WWW#', '.#WW#.', '#WW#..', '#W#...', '#.....'], 0],          // down
  [['#####.', '#WWWW#', '.#WWWS', '..###S'], 2],                              // level
  [['##....', '#W##..', '#WWW##', '.#WWWS', '..####'], 3],                    // held out: a glide
];
const WING = { '#': '#8796b8', W: '#ffffff', S: '#dfe6f3' };

// ---- the sprites ------------------------------------------------------------------------------------------------------------
function letterArt(px, ox, oy, size, kind, f) {
  const { R, P } = px, [w, h] = { gold: [13, 8], big: [13, 8], medium: [11, 7], small: [9, 6], unread: [9, 6] }[size] || [9, 6];
  const [edge, paper, shade, flap, seal, glint] = LETTER[kind] || LETTER.plain;
  const ex = ox - Math.floor(w / 2), ey = oy - Math.floor(h / 2);
  if (f >= 0) {                                                    // the wings, behind the paper's edge
    const [rows, at] = WINGS[f];
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      P(ex - 6 + i, ey + 1 - at + j, WING[ch]);                    // left
      P(ex + w + 5 - i, ey + 1 - at + j, WING[ch]);                // right, mirrored
    }));
  }
  R(ex, ey, w, h, edge); R(ex + 1, ey + 1, w - 2, h - 2, paper); R(ex + 1, ey + h - 2, w - 2, 1, shade);
  const half = Math.floor(w / 2), cy = ey + Math.floor(h / 2);
  for (let i = 1; i < half; i++) { const yy = ey + 1 + Math.round((i * (cy - ey - 1)) / half); P(ex + i, yy, flap); P(ex + w - 1 - i, yy, flap); }
  const cx = ex + half;
  if (seal) { if (w >= 11) { R(cx - 1, cy, 3, 2, seal); P(cx - 1, cy, glint); } else { R(cx, cy, 1, 2, seal); } }
  if (kind === 'gold') { P(ex + 1, ey + 1, '#ffffff'); P(ex + w - 2, ey + h - 2, '#ffe9a0'); }
  if (kind === 'old') {                                            // a dog-eared corner: folded down, its back showing
    px.ctx.clearRect(ex + w - 2, ey, 2, 1); px.ctx.clearRect(ex + w - 1, ey + 1, 1, 1);
    P(ex + w - 2, ey + 1, edge); P(ex + w - 1, ey + 2, edge);
    P(ex + w - 3, ey + 1, '#cdb882'); P(ex + w - 3, ey + 2, '#cdb882'); P(ex + w - 2, ey + 2, '#cdb882');
  }
}
function openedArt(px, ox, oy, kind, stamp, step = 2) {             // a letter opened at the boat: CLOSED, return to sender
  const { R, P, poly, text, textW } = px, [edge, paper, shade, flap] = LETTER[kind] || LETTER.plain;
  if (step < 2) {                                                   // the flap up; then the sheet half out of it
    const ex = ox - 6, ey = oy + 1;
    if (step === 1) { R(ox - 5, oy - 8, 10, 11, edge); R(ox - 4, oy - 7, 8, 10, paper); for (let i = 0; i < 3; i++) R(ox - 3, oy - 5 + i * 3, 6 - (i % 2) * 2, 1, '#c8bfae'); }
    poly([[ex, ey + 1], [ex + 12, ey + 1], [ox, ey - 5]], edge); poly([[ex + 2, ey + 1], [ex + 10, ey + 1], [ox, ey - 3]], flap);
    R(ex, ey, 13, 8, edge); R(ex + 1, ey + 1, 11, 6, paper); R(ex + 1, ey + 6, 11, 1, shade);
    for (let i = 1; i < 6; i++) { P(ex + i, ey + 6 - Math.round(i * 0.6), flap); P(ex + 12 - i, ey + 6 - Math.round(i * 0.6), flap); }
    return;
  }
  R(ox - 12, oy - 9, 24, 18, edge); R(ox - 11, oy - 8, 22, 16, paper); R(ox - 11, oy + 6, 22, 1, shade);
  for (let i = 0; i < 4; i++) R(ox - 8, oy - 5 + i * 3, 16 - (i % 2) * 5, 1, '#c8bfae');   // its lines
  if (stamp > 0) {
    const dy = Math.round((1 - stamp) * -5), s = 'CLOSED', tw = textW(s);
    R(ox - tw / 2 - 3, oy - 5 + dy, tw + 6, 11, '#c0302a'); R(ox - tw / 2 - 2, oy - 4 + dy, tw + 4, 9, paper);
    text(s, ox - tw / 2, oy - 2 + dy, '#c0302a');
    P(ox - tw / 2 - 3, oy - 5 + dy, paper); P(ox + tw / 2 + 2, oy + 5 + dy, paper);   // a stamp's worn corners
  }
}
function airmailArt(px, ox, oy) {                                  // the gull's letter: airmail, red and blue round its edge
  const { R, P } = px, ex = ox - 4, ey = oy - 3;
  R(ex, ey, 9, 6, '#7d6e5a'); R(ex + 1, ey + 1, 7, 4, '#fbf7ec');
  for (let i = 0; i < 9; i++) { const c = i % 4 < 2 ? '#d03a2a' : '#3a6ad0'; P(ex + i, ey, c); P(ex + 8 - i, ey + 5, c); }
  P(ex + 4, ey + 2, '#d03a2a');
}
function tagArt(px, ox, oy, name) {
  const { R, text, textW } = px, w = textW(name) + 6;
  R(ox - Math.floor(w / 2) + 1, oy + 1, w, 9, 'rgba(0,0,0,0.3)');
  R(ox - Math.floor(w / 2), oy, w, 9, '#1b1f3a'); R(ox - Math.floor(w / 2), oy, w, 1, '#d9a63a');
  text(name, ox - Math.floor(w / 2) + 3, oy + 2, '#ffd84a');
}
function gullArt(px, ox, oy, f) {                                  // facing left; f: up, level, down, level, glide
  const { R, P, ell, line, poly } = px, cx = ox, cy = oy;
  const tips = [[2, -8], [7, -3], [4, 5], [7, -3], [8, -1]], [tx, ty] = tips[f];
  poly([[cx + 1, cy - 1], [cx + tx + 2, cy + ty - 1], [cx + 3, cy]], '#9aa2b4');          // the far wing, in shade
  ell(cx, cy, 4, 2, '#ffffff'); R(cx - 2, cy + 1, 5, 1, '#d6dbe6');
  ell(cx - 4, cy - 1, 2, 2, '#ffffff'); P(cx - 5, cy - 2, '#1b1f3a');
  R(cx - 8, cy - 1, 3, 1, '#ffb030'); P(cx - 7, cy, '#d0801a');
  R(cx + 4, cy - 1, 3, 2, '#eef0f6'); P(cx + 6, cy - 1, '#3a3e4a');
  poly([[cx - 2, cy - 1], [cx + tx, cy + ty], [cx + 2, cy]], '#c4cad6');                  // the near wing
  line(cx - 2, cy - 1, cx + tx, cy + ty, '#eef1f7'); P(cx + tx, cy + ty, '#3a3e4a');
}
const sunArt = (px, ox, oy) => { for (const [r, a] of [[46, 0.06], [28, 0.09], [16, 0.12]]) px.ell(ox, oy, r, r, `rgba(255,200,120,${a})`); };
export const art = { letterArt, openedArt, airmailArt, tagArt, gullArt };

export function makeSky(stage) {
  const city = makeVoyage(stage.g, { deep: true });
  const L = {};
  const out = {}, names = [];

  function layout(W, H) {
    const wide = W >= H;
    Object.assign(L, { W, H, wide });
    city.layout(W, H);
    L.boat = wide ? { x: Math.round(W * 0.05), y: 70 } : { x: 6, y: 94 };
    L.top = L.boat.y + 20;                                           // the letters' sky: under the boat's cloud ...
    L.bottom = Math.round(H * (wide ? 0.72 : 0.74));                 // ... down to just over the roofs
    L.tops = [];
    return L;
  }

  // ---- the sky at the back: its colours, the sun, high thin clouds, hazy far ones, a balloon, a plane --------------------------
  function back(t, v) {
    const { W, H } = L, sk = city.sky(), late = city.late;
    const lay = stage.layer('sky', 0), { R } = lay.px;
    for (let i = 0; i < 22; i++) { const k = (i / 21) ** 1.3; R(0, (i * H) / 22, W, H / 22 + 1, `rgb(${sk.top.map((c, j) => Math.round(c + (sk.low[j] - c) * k))})`); }
    stage.blit(lay);
    const day = v.day, sx = W * (0.3 + day * 0.62), sy = H * 0.55 - Math.sin(Math.PI * Math.min(1, day * 1.05)) * H * 0.45;
    stage.sprite(sx, sy, 96, 96, 48, 48, sunArt, 'sun', 1, 'lighter');
    stage.sprite(sx, sy, 20, 20, 10, 10, (px, ox, oy) => px.ell(ox, oy, 8, 8, late > 0.5 ? '#ffd2a8' : '#fff3c4'), `disc${late > 0.5 ? 1 : 0}`);
    for (let i = 0; i < 6; i++) {
      const x = ((hash(i) * (W + 80) - t * (2 + i * 0.6)) % (W + 80) + W + 80) % (W + 80) - 40, y = 10 + hash(i + 9) * H * 0.28, w = Math.round(26 + hash(i + 3) * 30);
      stage.sprite(x, y, w, 3, 0, 0, (px) => { px.R(0, 0, w, 2, 'rgba(255,255,255,0.6)'); px.R(5, 2, w - 10, 1, late > 0.3 ? 'rgba(255,190,150,0.7)' : 'rgba(220,230,250,0.6)'); }, `thin${i}:${late > 0.3 ? 1 : 0}`);
    }
    balloon(t); plane(t);
    for (let i = 0; i < 7; i++) {
      const x = ((hash(i + 40) * (W + 120) - t * 1.5) % (W + 120) + W + 120) % (W + 120) - 60, y = H * (0.46 + hash(i + 50) * 0.08), r = Math.round(5 + hash(i + 60) * 5);
      stage.sprite(x, y, r * 3, r * 2 + 4, Math.round(r * 1.5), r, (px, ox, oy) => px.lump(ox, oy, r, late > 0.4 ? 'dusk' : 'far'), `far${i}:${late > 0.4 ? 1 : 0}`, 0.5);
    }
  }
  function balloon(t) {
    const { W, H } = L, k = ((t + 20) % 90) / 60;
    if (k > 1) return;
    const x = W * 1.1 - k * W * 1.3, y = H * 0.22 + Math.sin(t * 0.5) * 2;
    stage.sprite(x, y, 13, 20, 6, 7, (px, ox, oy) => {
      const { R, ell, line } = px;
      ell(ox, oy, 5, 6, '#e8643a'); R(ox - 1, oy - 6, 2, 12, '#ffd84a'); R(ox - 4, oy - 2, 1, 5, '#ffd84a'); R(ox + 3, oy - 2, 1, 5, '#ffd84a');
      line(ox - 3, oy + 5, ox - 1, oy + 9, '#5a3a22'); line(ox + 3, oy + 5, ox + 1, oy + 9, '#5a3a22'); R(ox - 2, oy + 9, 4, 3, '#8a5a32');
    }, 'balloon');
  }
  function plane(t) {
    const { W } = L, k = (t % 45) / 16;
    if (k > 1) return;
    const x = W + 60 - k * (W + 220), y = (L.wide ? 20 : 34) + Math.sin(t) * 1.5, f = Math.floor(t * 8) % 2;   // on a phone, under the line across the top
    stage.sprite(x, y, 84, 14, 8, 6, (px, ox, oy) => {
      const { R, P, ell, poly, line, text, textW } = px;
      ell(ox, oy, 7, 2, '#eceef4'); R(ox - 3, oy - 4, 4, 3, '#d03a2a'); R(ox + 3, oy - 1, 3, 1, '#2a3a6a'); poly([[ox - 1, oy], [ox + 3, oy], [ox - 4, oy + 4]], '#c8ccd8');
      const word = 'NOW HIRING', bw = textW(word) + 6, bx = ox + 18;
      line(ox + 7, oy, bx, oy, '#8a8a96');
      R(bx, oy - 4, bw, 8, '#fff8e7'); R(bx, oy + 3, bw, 1, '#d8ccb0'); text(word, bx + 3, oy - 2, '#d03a2a');
      for (let i = 0; i < 4; i++) P(bx + bw + i, oy - 3 + ((i + f) % 2) * 6, '#fff8e7');
    }, `plane${f}`);
  }

  // ---- the city: each row at a whole pixel on its own layer, set at the fraction; the cars set one by one ---------------------
  function town(v) {
    out.far = stage.layer('far'); out.rows = [stage.layer('row0'), stage.layer('row1'), stage.layer('row2')];
    for (const l of v.letters || []) if (names.length < 14 && l.job.company && !names.includes(l.job.company)) names.push(l.job.company);   // kept: a billboard keeps its name
    city.layers(v.t, { day: v.day, at: v.at, names: names.length >= 4 ? names : undefined }, out);
    const low = city.sky().low;
    stage.blit(out.far, -out.farFrac, 0);
    const hz = [0.22, 0.10, 0];
    out.rows.forEach((lay, i) => {
      stage.blit(lay, -out.frac, 0);
      for (const c of out.cars[i]) stage.sprite(c.x - out.frac, c.y, 8, 5, 1, 4, (px, ox, oy) => drawCar(px, ox, oy, c.k, c.lights), `car${c.k}:${c.lights ? 1 : 0}`);
      if (hz[i]) stage.fill(`rgba(${low},${hz[i]})`);
    });
    if (city.late > 0) stage.fill(`rgba(60,30,90,${(city.late * 0.12).toFixed(3)})`);
    L.tops = (city.L.tops || []).map((r) => ({ x: r.x - out.frac, y: r.y }));
  }

  // ---- a letter where it is: its wings by the beat (held out in a glide), lifted a little by each beat --------------------------
  function letter(l, alpha = 1) {
    const f = l.state === 'closed' ? -1 : l.glide > 0 && l.rate < 0.6 ? 4 : Math.floor((((l.phase % 1) + 1) % 1) * 4);
    const lift = l.state === 'hooked' || l.state === 'closed' ? 0 : -0.7 * Math.sin(2 * Math.PI * l.phase) * Math.min(1, l.rate / 2);
    const fade = Math.min(1, (l.age ?? 1) / 0.35) * (l.alpha ?? 1) * alpha;
    const y = l.y + lift, [w, h] = [l.w + 14, l.h + 12];
    if (l.state === 'closed' && l.open > 0) {                          // opened at the boat; the stamp comes down with a jolt
      const sh = Math.sin(now * 70) * shaking * 1.5;
      const step = l.open < 0.34 ? 0 : l.open < 0.67 ? 1 : 2, st = Math.round((l.stamp || 0) * 4);
      stage.sprite(l.x + sh, l.y, 28, 22, 14, 11, (px, ox, oy) => openedArt(px, ox, oy, l.kind, (l.stamp || 0), step), `open:${l.kind}:${step}:${st}`, fade);
      return;
    }
    stage.sprite(l.x, y, w, h, 7 + Math.floor(l.w / 2), 6 + Math.floor(l.h / 2), (px, ox, oy) => letterArt(px, ox, oy, l.size, l.kind, f), `L:${l.size}:${l.kind}:${f}`, fade);
    if (l.chosen && l.state !== 'hooked') {                            // chosen while the duck is busy: a little ring of sparkle
      const a = l.age * 5;
      for (let i = 0; i < 3; i++) stage.dot(l.x + Math.cos(a + i * 2.1) * (l.w / 2 + 3), y + Math.sin(a + i * 2.1) * (l.h / 2 + 3), 'rgba(255,240,170,0.9)');
    }
    if (l.kind === 'gold' && l.state !== 'hooked') {                   // a golden one leaves a glitter behind it
      for (let i = 1; i <= 3; i++) {
        const k = (l.age * 2 + i * 0.33) % 1;
        stage.dot(l.x - (l.vx || 0) * k * 0.6 - Math.sign(l.vx || 1) * (l.w / 2 + 1), y + Math.sin(l.age * 3 + i) * 2, `rgba(255,236,150,${(0.8 * (1 - k)).toFixed(2)})`);
      }
    }
    if (l.tag > 0 && l.state !== 'hooked') {                           // its company's name, hung under it on a thread, for a moment
      const a = Math.min(1, l.tag / 0.6) * Math.min(1, (l.age || 0) / 0.3), name = String(l.job.company || '').toUpperCase().slice(0, 16);
      for (let k = 1; k <= 3; k++) stage.dot(l.x, y + l.h / 2 + k, `rgba(220,214,196,${(0.9 * a).toFixed(2)})`);
      stage.sprite(l.x, y + l.h / 2 + 4, 120, 11, 60, 0, (px, ox, oy) => tagArt(px, ox, oy, name), `T:${name}`, a);
    }
  }

  // ---- the boat on its cloud, the duck between the hull's two sides, its rod, its line and hook ----------------------------------
  function boat(v) {
    const b = v.boat, t = v.t;
    stage.sprite(b.x, v.cloudY, 96, 34, 14, 4, (px, ox, oy) => {
      for (const [dx, dy, r] of [[8, 10, 10], [26, 12, 13], [46, 11, 12], [62, 9, 9], [-2, 7, 7]]) px.lump(ox + dx, oy + dy, r, 'near');
    }, 'boatcloud');
    stage.sprite(b.x, b.y, 86, 70, 12, 60, (px, ox, oy) => drawBoat(px, ox, oy, t, { part: 'back', bob: false, shadow: false }));
    const d = v.duck, blink = (t % 5) > 4.85;
    stage.sprite(d.x, d.y, 40, 32, 20, 28, (px, ox, oy) => upright(px, ox, oy, { sit: true, blink, look: d.look }), `duck:${blink ? 1 : 0}:${d.look}`);
    if (d.sip > 0) {                                                  // a sip of coffee: the cup up to the beak and down
      const cx = d.x + 9 + d.sip * 3, cy = d.y + 1 - d.sip * 16;
      stage.sprite(cx, cy, 7, 7, 1, 3, (px, ox, oy) => { px.R(ox, oy, 4, 4, '#f1ead6'); px.R(ox + 4, oy + 1, 1, 2, '#f1ead6'); px.R(ox, oy, 4, 1, '#5a3a1a'); }, 'cup');
      if (d.sip > 0.95 && Math.sin(t * 3) > 0) stage.dot(cx + 1, cy - 2, 'rgba(255,255,255,0.7)');
    }
    stage.sprite(b.x, b.y, 86, 70, 12, 60, (px, ox, oy) => drawBoat(px, ox, oy, t, { part: 'front', bob: false, shadow: false }), 'boatfront');
  }
  function rod(v) {
    const { hand: h, a, bend, tip } = v.rod, len = 30, c = { x: h.x + Math.cos(a) * len * 0.62, y: h.y + Math.sin(a) * len * 0.62 };
    for (let i = 0; i <= 60; i++) {
      const u = i / 60, x = (1 - u) * (1 - u) * h.x + 2 * (1 - u) * u * c.x + u * u * tip.x, y = (1 - u) * (1 - u) * h.y + 2 * (1 - u) * u * c.y + u * u * tip.y;
      if (u < 0.3) stage.dot(x - 0.5, y - 0.5, '#3a2410', 2); else stage.dot(x, y, '#5a3a1a');
      if (i === 25 || i === 45) stage.dot(x, y - 1, '#c8c8d4');
    }
    stage.sprite(h.x, h.y, 6, 5, 1, 0, (px, ox, oy) => { px.R(ox - 1, oy, 4, 3, '#2a1a10'); px.P(ox + 1, oy + 1, '#c8c8d4'); }, 'reel');
  }
  function line(v) {
    const a = v.rod.tip, b = v.hook, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + v.sag, n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2) + 2;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x, y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y;
      stage.dot(x, y, 'rgba(255,255,255,0.78)');
    }
    stage.sprite(b.x, b.y, 3, 6, 1, 0, (px) => { px.P(1, 0, '#c8ccd8'); px.R(1, 1, 1, 3, '#eef1f7'); px.P(0, 3, '#eef1f7'); px.R(0, 4, 2, 1, '#aab0c2'); }, 'hook');
  }
  function gull(v) {
    const gl = v.gull;
    if (!gl) return;
    const f = Math.floor((((gl.flap % 1) + 1) % 1) * 4);
    stage.sprite(gl.x, gl.y, 22, 18, 10, 9, (px, ox, oy) => gullArt(px, ox, oy, f), `gull${f}`);
    if (gl.job) stage.sprite(gl.x - 7, gl.y + 4, 11, 8, 5, 3, airmailArt, 'airmail');
  }
  function fx(v) {
    for (const f of v.fx) {
      const k = f.age / f.life;
      if (f.kind === 'spark') stage.dot(f.x, f.y, f.col || '#ffffff');
      else if (f.kind === 'dust') stage.dot(f.x, f.y, `rgba(236,230,214,${(0.8 * (1 - k)).toFixed(2)})`);
      else if (f.kind === 'puff') stage.sprite(f.x, f.y - k * 5, 16, 12, 8, 6, (px, ox, oy) => px.lump(ox, oy, f.r || 3, 'near'), `puff${f.r || 3}`, 1 - k);
      else if (f.kind === 'tink') {
        const r = 1 + k * 4, a = (1 - k).toFixed(2);
        for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) stage.dot(f.x + dx, f.y + dy, `rgba(255,255,255,${a})`);
      }
    }
  }

  // ---- the whole sky, one moment ---------------------------------------------------------------------------------------------------
  let now = 0, shaking = 0;
  function draw(v) {
    now = v.t; shaking = v.shake || 0;
    back(v.t, v);
    town(v);
    const onLine = v.letters.filter((l) => l.state === 'hooked' || l.state === 'closed');
    for (const l of v.letters) if (!onLine.includes(l)) letter(l);
    boat(v);
    rod(v);
    line(v);
    for (const l of onLine) letter(l);
    if (v.drop) stage.sprite(v.drop.x, v.drop.y, 11, 8, 5, 3, airmailArt, 'airmail');
    gull(v);
    fx(v);
  }
  return { layout, draw, L, city };
}
