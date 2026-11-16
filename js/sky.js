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

// ---- the catch (PLAN.md 19): the float and its bait, the «!», the reel's panel, the mailbag ---------------------------------
function floatArt(px, ox, oy) {                                    // a float, red over white, a little stick on top; (ox, oy) its middle
  const { R, P } = px;
  R(ox, oy - 6, 1, 2, '#3a2a1a');                                  // the stick
  R(ox - 2, oy - 4, 5, 7, '#5a2a22');                              // its outline
  R(ox - 1, oy - 4, 3, 1, '#5a2a22'); R(ox - 1, oy + 3, 3, 1, '#5a2a22');
  R(ox - 1, oy - 3, 3, 3, '#e0402e'); P(ox - 1, oy - 3, '#ff9a80');     // the red cap, lit
  R(ox - 1, oy, 3, 1, '#3a2a1a');                                  // the band
  R(ox - 1, oy + 1, 3, 2, '#f6f2e8'); P(ox + 1, oy + 2, '#cfc8b8');    // the white belly
}
function baitArt(px, ox, oy) {                                     // the CV, folded small, on the hook: (ox, oy) its top
  const { R, P } = px;
  R(ox - 2, oy, 5, 6, '#8a8478'); R(ox - 1, oy + 1, 3, 4, '#ffffff');
  R(ox - 1, oy + 2, 3, 1, '#b8c0d0'); R(ox - 1, oy + 4, 2, 1, '#b8c0d0');
  P(ox + 2, oy, '#d8d2c4');                                        // a corner folded down
}
function bangArt(px, ox, oy) {                                     // «!» in a little white box with a tail; (ox, oy) the tail's tip
  const { R, P } = px;
  R(ox - 4, oy - 13, 9, 11, '#3a2a1a'); R(ox - 3, oy - 12, 7, 9, '#fffdf6');
  R(ox, oy - 11, 2, 4, '#d03a2a'); R(ox, oy - 6, 2, 2, '#d03a2a');
  R(ox - 1, oy - 2, 3, 1, '#3a2a1a'); P(ox, oy - 1, '#3a2a1a'); P(ox, oy - 2, '#fffdf6');
}
function bagArt(px, ox, oy, n, puffed) {                           // the mailbag hung on the mast, its count on a tag; (ox, oy) its mouth
  const { R, P, ell, line, text, textW } = px, f = puffed ? 1 : 0;
  line(ox + 6, oy - 7, ox - 3, oy, '#6b5a3a'); line(ox + 6, oy - 7, ox + 3, oy, '#6b5a3a');   // the strap from its peg
  ell(ox, oy + 6, 5 + f, 6, '#6b5a3a'); ell(ox, oy + 6, 4 + f, 5, '#d9c9a3');                 // the sack
  ell(ox - 1, oy + 4, 2, 2, '#ece0c0'); ell(ox + 1, oy + 9, 3 + f, 1, '#b8a67e');
  R(ox - 4, oy, 9, 2, '#6b5a3a'); R(ox - 3, oy, 7, 1, '#c9b48a');                                 // its tied mouth
  P(ox - 1, oy + 6, '#d03a2a'); P(ox + 1, oy + 6, '#3a6ad0'); P(ox, oy + 7, '#d03a2a');           // an airmail mark
  const s = String(n), w = textW(s) + 4;
  R(ox - Math.floor(w / 2), oy + 13, w, 7, '#3a2a1a'); R(ox - Math.floor(w / 2) + 1, oy + 14, w - 2, 5, '#fff8e7');
  text(s, ox - Math.floor(w / 2) + 2, oy + 14, '#3a2a1a');
}
function panelArt(px, w, h, lane, ribbon, pad) {                  // the reel's panel: paper round a little sky, a ribbon at its side
  const { R } = px;
  R(1, 2, w, h, 'rgba(20,20,40,0.28)');                             // its shadow
  R(0, 0, w, h, '#3a2a1a'); R(1, 1, w - 2, h - 2, '#fff8e7');
  for (let y = 0; y < h - 2 * pad; y++) {                          // the sky in it, light at the top, paler below
    const k = y / (h - 2 * pad), c = [Math.round(150 + k * 70), Math.round(204 + k * 34), Math.round(246 + k * 8)];
    R(pad, pad + y, lane, 1, `rgb(${c})`);
  }
  R(pad - 1, pad - 1, lane + 2, 1, '#c8b890'); R(pad - 1, h - pad, lane + 2, 1, '#e8dcc0');
  R(pad + lane + 2, pad, ribbon, h - 2 * pad, '#e6d8b4');            // the ribbon's bed
}
function reelCloudArt(px, w, h) {                                  // the cloud that holds the letter: (0, 0) its top left
  const { ell, R } = px, cx = Math.floor(w / 2);
  ell(cx, h / 2, cx - 1, h / 2 - 1, '#b9c8e2');
  ell(cx, h / 2 - 1, cx - 2, h / 2 - 2, '#ffffff');
  ell(cx - 3, h / 2 - 3, 3, 2, '#ffffff'); ell(cx + 3, h / 2 - 4, 3, 2, '#ffffff');
  R(cx - 4, h - 4, 8, 1, '#dfe8f4'); R(cx - 5, h - 3, 10, 1, '#cbd8ec');
}
function miniLetterArt(px, ox, oy, kind, f) {                     // the letter on the line, small, in the reel's panel; (ox, oy) its middle
  const { R, P } = px, [edge, paper, shade, flap, seal] = kind === 'gull' ? ['#7d6e5a', '#fbf7ec', '#e8dfcb', '#cdbf9f', '#3a6ad0'] : (LETTER[kind] || LETTER.plain);
  const up = f === 0 ? -2 : f === 2 ? 1 : 0;                       // the wings: up, level, down
  for (const s of [-1, 1]) { P(ox + s * 6, oy - 1 + up, '#8796b8'); P(ox + s * 5, oy - 1 + Math.round(up / 2), '#ffffff'); P(ox + s * 7, oy - 1 + Math.round(up * 1.5), '#8796b8'); }
  R(ox - 4, oy - 3, 9, 6, edge); R(ox - 3, oy - 2, 7, 4, paper); R(ox - 3, oy + 1, 7, 1, shade);
  P(ox - 2, oy - 2, flap); P(ox + 2, oy - 2, flap); P(ox - 1, oy - 1, flap); P(ox + 1, oy - 1, flap);
  if (seal) P(ox, oy, seal);
  if (kind === 'gull') for (let i = 0; i < 9; i++) P(ox - 4 + i, oy - 3, i % 4 < 2 ? '#d03a2a' : '#3a6ad0');
}
function stampArt(px, ox, oy) {                                    // a postage stamp, its edge torn in little teeth
  const { R, P } = px;
  R(ox, oy, 7, 8, '#fff8e7');
  for (let i = 0; i < 7; i += 2) { P(ox + i, oy, '#e8dcc0'); P(ox + i, oy + 7, '#e8dcc0'); }
  for (let j = 1; j < 7; j += 2) { P(ox, oy + j, '#e8dcc0'); P(ox + 6, oy + j, '#e8dcc0'); }
  R(ox + 1, oy + 1, 5, 6, '#d03a2a'); R(ox + 2, oy + 2, 3, 3, '#ffd84a'); P(ox + 3, oy + 5, '#ffffff');
}
function bowArt(px, ox, oy) {                                      // a little red bow: caught without a slip
  const { R, P } = px;
  P(ox - 2, oy - 1, '#d03a2a'); P(ox - 1, oy, '#d03a2a'); P(ox + 1, oy, '#d03a2a'); P(ox + 2, oy - 1, '#d03a2a');
  R(ox - 2, oy, 1, 2, '#a82a20'); R(ox + 2, oy, 1, 2, '#a82a20'); P(ox, oy, '#ff8a70');
  P(ox - 1, oy + 2, '#d03a2a'); P(ox + 1, oy + 2, '#d03a2a');
}
function junkArt(px, ox, oy, kind, f) {                            // junk, drawn as itself; (ox, oy) its middle; f: its wings' beat
  const { R, P, ell, poly } = px;
  if (f >= 0 && kind !== 'plane') {                                // little paper wings, as the letters have
    const up = f === 0 ? -2 : f === 2 ? 1 : 0;
    for (const s2 of [-1, 1]) { P(ox + s2 * 5, oy - 1 + up, '#8796b8'); P(ox + s2 * 6, oy - 1 + up, '#ffffff'); P(ox + s2 * 7, oy - 1 + Math.round(up * 1.5), '#8796b8'); }
  }
  if (kind === 'ball') { ell(ox, oy, 3, 3, '#9a9488'); ell(ox, oy, 2, 2, '#efe9da'); P(ox - 1, oy - 1, '#ffffff'); P(ox + 1, oy, '#c8c0ae'); P(ox, oy + 1, '#c8c0ae'); }
  else if (kind === 'plane') { poly([[ox - 5, oy + 1], [ox + 5, oy - 1], [ox - 3, oy - 3]], '#ffffff'); poly([[ox - 5, oy + 1], [ox + 5, oy - 1], [ox - 1, oy + 2]], '#d8dce8'); P(ox + 4, oy - 1, '#8796b8'); }
  else if (kind === 'sock') { R(ox - 2, oy - 4, 4, 6, '#f4efe2'); R(ox - 2, oy - 3, 4, 1, '#d03a2a'); R(ox - 2, oy - 1, 4, 1, '#d03a2a'); R(ox - 2, oy + 2, 6, 2, '#f4efe2'); R(ox + 3, oy + 2, 1, 2, '#c8c0ae'); }
  else if (kind === 'rejection') { R(ox - 4, oy - 3, 8, 7, '#8a8478'); R(ox - 3, oy - 2, 6, 5, '#f4efe2'); P(ox - 2, oy - 1, '#c0392b'); P(ox - 1, oy, '#c0392b'); P(ox, oy + 1, '#c0392b'); P(ox, oy - 1, '#c0392b'); P(ox - 2, oy + 1, '#c0392b'); }
  else { R(ox - 2, oy - 4, 3, 6, '#6a4628'); R(ox - 2, oy + 1, 6, 3, '#6a4628'); R(ox + 3, oy + 2, 1, 2, '#4a2e16'); R(ox - 2, oy + 3, 7, 1, '#2a1a10'); }   // a boot
}
export const art = { junkArt, letterArt, openedArt, airmailArt, tagArt, gullArt, floatArt, baitArt, bangArt, bagArt, panelArt, reelCloudArt, miniLetterArt, stampArt, bowArt };

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
    { const k = ((t + 40) % 200) / 200, x = W + 60 - k * (W + 160), y = H * 0.3;   // a cloud like a whale, very slowly across
      stage.sprite(x, y, 64, 26, 32, 13, (px, ox, oy) => {
        for (const [dx, dy, r] of [[-14, 1, 9], [-2, -1, 11], [10, 0, 10], [20, 2, 7]]) px.puff(ox + dx, oy + dy, r, late > 0.4 ? '#ffe2d0' : '#ffffff', late > 0.4 ? '#e8c0c8' : '#dfe8f4');
        px.poly([[ox + 26, oy + 1], [ox + 31, oy - 5], [ox + 30, oy + 1], [ox + 31, oy + 7]], late > 0.4 ? '#ffe2d0' : '#f4f8ff');   // its tail
        px.P(ox - 18, oy - 1, '#9aa6c8');                                   // its eye
        px.R(ox - 4, oy - 13, 1, 3, 'rgba(255,255,255,0.8)'); px.R(ox - 6, oy - 14, 1, 2, 'rgba(255,255,255,0.7)'); px.R(ox - 2, oy - 14, 1, 2, 'rgba(255,255,255,0.7)');   // its spout
      }, `whale:${late > 0.4 ? 1 : 0}`, 0.85); }
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

  // ---- the lake (Vin, 16/11: «khoảng này nhiều mây hơn 1 chút, cảm giác như hồ, làm nó mờ mờ đi, như 1 cái hồ trong»): the sky
  // under the boat's cloud is a clear lake and the city its bed. Clouds drift in it, slowly, the deeper the smaller and the
  // fainter; a mist lies along its bed over the roofs; the deeper, the hazier, so the city is seen as through clear water. The
  // letters swim in it, those deep down a little veiled (deep(), after them), as fish are in a clear lake.
  const surface = () => L.top - 10, bed = () => L.bottom;
  function veil(stops) {                                               // a haze down the lake: [y, alpha] by depth, the lake's own tint
    const g = stage.g, K = stage.K, late = city.late, c = [216, 236, 252].map((v0, i) => Math.round(v0 + ([250, 218, 222][i] - v0) * late)).join(',');
    const y0 = stops[0][0], y1 = stops[stops.length - 1][0];
    const gr = g.createLinearGradient(0, y0 * K, 0, y1 * K);
    for (const [y, a] of stops) gr.addColorStop(Math.max(0, Math.min(1, (y - y0) / (y1 - y0))), `rgba(${c},${a})`);
    g.fillStyle = gr; g.fillRect(0, Math.floor(y0 * K), stage.canvas.width, Math.ceil((y1 - y0) * K) + 1);
  }
  function mistArt(px, w, h, seed) {                                   // a long strip of mist in wisps, its two ends meeting when laid end to end
    for (let k = 0; k < 3; k++) {                                      // three wisps, gaps between them
      const mid = w * (k + 0.2 + hash(seed + k * 1.7) * 0.6) / 3, len = 26 + hash(seed + k * 2.3) * 34;
      for (let i = 0; i < 5; i++) {
        const cx = mid + (hash(seed + k * 9.1 + i * 3.1) - 0.5) * len, rx = Math.round(7 + hash(seed + k * 4.7 + i * 5.3) * 14), ry = Math.round(2 + hash(seed + k * 6.1 + i * 7.7) * 3);
        const cy = h / 2 + Math.round((hash(seed + k * 8.3 + i * 11.9) - 0.5) * 4);
        for (const dx of [-w, 0, w]) if (cx + dx + rx > 0 && cx + dx - rx < w) px.ell(cx + dx, cy, rx, ry, 'rgba(255,255,255,0.22)');
      }
    }
  }
  function lake(v) {
    const { W } = L, t = v.t, at = v.at || 0, late = city.late, S = surface(), B = bed(), eve = late > 0.4 ? 1 : 0;
    const top = eve ? '#ffe2d0' : '#ffffff', under = eve ? '#e8c0c8' : '#dfe8f4';
    for (let i = 0; i < (L.wide ? 9 : 6); i++) {                       // clouds in the lake, drifting with the city and the wind
      const d = hash(i + 211), r = Math.round(13 - d * 6 + hash(i + 213) * 3), flat = hash(i + 223) > 0.4, span = W + r * 5 + 40;
      const y = S + 16 + d * (B - S - 34), go = at * (0.5 + 0.35 * (1 - d)) + t * (0.5 + hash(i + 219) * 0.9);
      const x = (((hash(i + 217) * span - go) % span) + span) % span - r * 2.5 - 20;
      stage.sprite(x, y, r * 5, r * 2 + 4, Math.round(r * 2.5), r + 1, (px, ox, oy) => {
        if (flat) { px.ell(ox, oy + 1, r * 2, Math.max(2, Math.round(r * 0.32)), under); px.ell(ox - r * 0.7, oy - 1, Math.round(r * 1.2), Math.max(1, Math.round(r * 0.28)), top); px.ell(ox + r * 0.6, oy - 1, r, Math.max(1, Math.round(r * 0.25)), top); }
        else { px.puff(ox - r * 0.7, oy + 1, Math.round(r * 0.7), top, under); px.puff(ox + r * 0.4, oy, r, top, under); }
      }, `lk${i}:${eve}`, 0.8 - d * 0.32);
    }
    for (const [k, y, pf, wind] of [[0, B - 6, 0.85, 0.7], [1, B + 22, 0.95, 1.1], [2, B + 50, 1.05, 1.5]]) {   // the mist along its bed
      const SW = 240, go = at * pf + t * wind, x0 = -((go % SW) + SW) % SW;
      for (let x = x0; x < W; x += SW) stage.sprite(x, y, SW, 14, 0, 7, (px, ox, oy) => mistArt(px, SW, 14, 401 + k * 37), `mist${k}`, eve ? 0.7 : 0.85);
    }
    veil([[S, 0], [S + (B - S) * 0.5, 0.05], [B, 0.17], [B + 30, 0.19], [L.H, 0.13]]);   // the deeper, the hazier; the far roofs most
    for (let i = 0; i < 7; i++) {                                      // a glint of light on it, here and there, coming and going slowly
      const p = 4 + hash(i + 301) * 3, u = (t + hash(i + 303) * p) / p, c = Math.floor(u), a = Math.sin(Math.PI * (u - c)) ** 2 * 0.55;
      const x = Math.round(hash(i * 13 + c * 7.31) * W), y = Math.round(S + 12 + hash(i * 17 + c * 3.37) * (B - S - 24)), n = 3 + Math.floor(hash(i * 19 + c * 5.1) * 5);
      if (x < L.boat.x + 90 && y < L.top + 12) continue;               // not on the boat's cloud
      stage.fill(`rgba(255,255,255,${(a * 0.55).toFixed(3)})`, x, y, n, 1); stage.dot(x + Math.floor(n / 2), y, `rgba(255,255,255,${a.toFixed(3)})`);
    }
  }
  function deep(v) { veil([[surface(), 0], [bed(), 0.1], [L.H, 0.07]]); }   // the letters deep in the lake, a little veiled

  // ---- a letter where it is: its wings by the beat (held out in a glide), lifted a little by each beat --------------------------
  function letter(l, alpha = 1) {
    const still = l.state === 'held' || l.state === 'closed';
    const f = still ? -1 : l.glide > 0 && l.rate < 0.6 ? 4 : Math.floor((((l.phase % 1) + 1) % 1) * 4);
    const lift = l.state === 'hooked' || still ? 0 : -0.7 * Math.sin(2 * Math.PI * l.phase) * Math.min(1, l.rate / 2);
    const fade = Math.min(1, (l.age ?? 1) / 0.35) * (l.alpha ?? 1) * alpha;
    const y = l.y + lift, [w, h] = [l.w + 14, l.h + 12];
    if (l.state === 'closed' && l.open > 0) {                          // opened at the boat; the stamp comes down with a jolt
      const sh = Math.sin(now * 70) * shaking * 1.5;
      const step = l.open < 0.34 ? 0 : l.open < 0.67 ? 1 : 2, st = Math.round((l.stamp || 0) * 4);
      stage.sprite(l.x + sh, l.y, 28, 22, 14, 11, (px, ox, oy) => openedArt(px, ox, oy, l.kind, (l.stamp || 0), step), `open:${l.kind}:${step}:${st}`, fade);
      return;
    }
    if (l.job && l.job.junk) {                                         // junk: itself, fluttering or held up
      stage.sprite(l.x, l.state === 'held' ? l.y : y, 17, 11, 8, 5, (px, ox, oy) => junkArt(px, ox, oy, l.job.junk, still ? -1 : Math.min(2, f)), `J:${l.job.junk}:${still ? -1 : Math.min(2, f)}`, fade);
      return;
    }
    if (l.state === 'held') {                                          // up in the duck's wings, or on its way into the bag
      if (l.airmail) stage.sprite(l.x, l.y, 11, 8, 5, 3, airmailArt, 'airmail');
      else if (l.small) stage.sprite(l.x, l.y, 23, 18, 11, 9, (px, ox, oy) => letterArt(px, ox, oy, 'small', l.kind, -1), `L:small:${l.kind}:-1`);
      else stage.sprite(l.x, l.y, w, h, 7 + Math.floor(l.w / 2), 6 + Math.floor(l.h / 2), (px, ox, oy) => letterArt(px, ox, oy, l.size, l.kind, -1), `L:${l.size}:${l.kind}:-1`);
      if (l.perfect && !l.small) stage.sprite(l.x - l.w / 2 + 1, l.y - l.h / 2, 5, 4, 2, 1, bowArt, 'bow');
      if (l.fresh && !l.small) for (let i = 0; i < 2; i++) {             // the dew on a letter posted today
        const k = (now * 0.8 + i * 0.5) % 1;
        stage.dot(l.x - l.w / 2 + 2 + i * (l.w - 5) * 0.7, l.y - l.h / 2 + 1 + k * (l.h - 2), `rgba(220,240,255,${(0.9 * (1 - k)).toFixed(2)})`);
      }
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

  // ---- the boat on its cloud, the mailbag on its mast, the duck between the hull's two sides, its rod, its line ------------------
  function boat(v) {
    const b = v.boat, t = v.t;
    stage.sprite(b.x, v.cloudY, 96, 34, 14, 4, (px, ox, oy) => {
      for (const [dx, dy, r] of [[8, 10, 10], [26, 12, 13], [46, 11, 12], [62, 9, 9], [-2, 7, 7]]) px.lump(ox + dx, oy + dy, r, 'near');
    }, 'boatcloud');
    stage.sprite(b.x, b.y, 86, 70, 12, 60, (px, ox, oy) => drawBoat(px, ox, oy, t, { part: 'back', bob: false, shadow: false }));
    if (v.bag) {                                                      // the mailbag: it puffs up a moment when a letter goes in
      const pf = v.bag.puff > 0.4, n = v.bag.n;
      stage.sprite(v.bag.at.x, v.bag.at.y - (pf ? 1 : 0), 24, 30, 12, 8, (px, ox, oy) => bagArt(px, ox, oy, n, pf), `bag:${n}:${pf ? 1 : 0}`);
    }
    const d = v.duck, blink = (t % 5) > 4.85, cheer = !!d.cheer;
    const halo = !!v.halo && !cheer;                                   // in heaven the duck wears a halo
    stage.sprite(d.x, d.y, 40, 40, 20, 36, (px, ox, oy) => upright(px, ox, oy, { sit: true, blink, look: d.look, cheer, halo }), `duck:${blink ? 1 : 0}:${d.look}:${cheer ? 1 : 0}:${halo ? 1 : 0}`);
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
  function strand(a, b, sag, col = 'rgba(255,255,255,0.78)') {        // a line between two points, sagging a little
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + sag, n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2) + 2;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x, y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y;
      stage.dot(x, y, col);
    }
  }
  function line(v) {
    if (v.float) {                                                    // the float on its line; the CV under it, or the letter on it
      const fl = v.float;
      strand(v.rod.tip, { x: fl.x, y: fl.y - 6 }, v.sag);
      if (v.hooked) { const l = v.hooked; strand({ x: fl.x, y: fl.y + 3 }, { x: l.x, y: l.y - l.h / 2 }, 0.2); }
      else if (v.bait) { strand({ x: fl.x, y: fl.y + 3 }, v.bait, 0.4, 'rgba(255,255,255,0.7)'); stage.sprite(v.bait.x, v.bait.y, 7, 7, 3, 0, baitArt, 'bait'); }
      stage.sprite(fl.x, fl.y, 7, 11, 3, 7, floatArt, 'float');
      return;
    }
    const a = v.rod.tip, b = v.hook;
    strand(a, b, v.sag);
    stage.sprite(b.x, b.y, 3, 6, 1, 0, (px) => { px.P(1, 0, '#c8ccd8'); px.R(1, 1, 1, 3, '#eef1f7'); px.P(0, 3, '#eef1f7'); px.R(0, 4, 2, 1, '#aab0c2'); }, 'hook');
  }
  function gull(v) {
    const gl = v.gull;
    if (!gl) return;
    const f = Math.floor((((gl.flap % 1) + 1) % 1) * 4);
    stage.sprite(gl.x, gl.y, 22, 18, 10, 9, (px, ox, oy) => gullArt(px, ox, oy, f), `gull${f}`);
    if (gl.job) stage.sprite(gl.x - 7, gl.y + 4, 11, 8, 5, 3, airmailArt, 'airmail');
  }

  // ---- the cast's arc over the duck: it fills and empties like a breath; where the float will come down ------------------------
  function charge(v) {
    const c = v.charge;
    if (!c) return;
    const d = v.duck, cx = d.x + 4, cy = d.y - 18, r = 14;
    for (let i = 0; i <= 24; i++) {
      const u = i / 24, a = Math.PI + u * Math.PI, on = u <= c.k + 0.001;
      stage.dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, on ? (u > c.k - 0.06 ? '#fff6c0' : '#ffd84a') : 'rgba(255,255,255,0.35)');
    }
    const p = c.land, br = 3 + c.k * 1.5;                               // a faint ring where it will land
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + v.t; stage.dot(p.x + Math.cos(a) * br, p.y + Math.sin(a) * br * 0.7, 'rgba(255,255,255,0.55)'); }
  }
  // ---- «!» over the duck: it drops into place ---------------------------------------------------------------------------------------
  function bang(v) {
    if (!v.bang) return;
    const d = v.duck, a = v.bang.age, dy = -4 * Math.max(0, 1 - a / 0.12) + Math.sin(a * 18) * Math.max(0, 0.6 - a) * 1.2;
    stage.sprite(d.x + 3, d.y - 31 + dy, 11, 15, 5, 14, bangArt, 'bang', Math.min(1, a / 0.08));
  }
  // ---- the reel's panel: its sky, the cloud the button lifts, the letter fluttering, a stamp now and then, the ribbon ------------
  function panel(v) {
    const p = v.panel;
    if (!p || p.open <= 0) return;
    const al = smoothstep(p.open), x = p.x, y = p.y + (1 - al) * 8, ix = x + p.pad, iy = y + p.pad;
    stage.sprite(x, y, p.w + 1, p.h + 2, 0, 0, (px) => panelArt(px, p.w, p.h, p.lane, p.ribbon, p.pad), `panel:${p.w}:${p.h}`, al);
    for (let i = 0; i < 3; i++) {                                     // wisps drifting down past: the letter is coming up
      const wy = ((p.t * (6 + i * 3) + i * 31) % p.track), wx = ix + 2 + ((i * 7) % (p.lane - 6));
      stage.sprite(wx, iy + wy, 6, 1, 0, 0, (px) => px.R(0, 0, 6, 1, 'rgba(255,255,255,0.55)'), 'wisp', al);
    }
    stage.sprite(ix, iy + p.cloud, p.lane, p.zone, 0, 0, (px) => reelCloudArt(px, p.lane, p.zone), `reelcloud:${p.lane}:${p.zone}`, al * (p.in ? 1 : 0.85));
    if (p.stamp) {
      stage.sprite(ix + p.lane / 2 - 3.5, iy + p.stamp.y, 7, 8, 0, 0, stampArt, 'stamp', al);
      const n = Math.round(p.stamp.k * 12);
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i / 12) * Math.PI * 2; stage.dot(ix + p.lane / 2 + Math.cos(a) * 6, iy + p.stamp.y + 4 + Math.sin(a) * 6, '#ffd84a'); }
    }
    const fl = Math.floor(((p.t * (p.in ? 5 : 9)) % 1) * 3);
    stage.sprite(ix + p.lane / 2, iy + p.letter + 3, 17, 9, 8, 4, (px, ox, oy) => miniLetterArt(px, ox, oy, p.kind, fl), `mini:${p.kind}:${fl}`, al);
    const rx = ix + p.lane + 2, fillH = p.track * p.p;                // the ribbon, filling from the bottom
    if (fillH > 0) {
      stage.g.globalAlpha = al;
      stage.fill(p.in ? '#ffd84a' : '#e0b850', rx, iy + p.track - fillH, p.ribbon, fillH);
      stage.fill(p.in ? '#fff6c0' : '#f2d98c', rx, iy + p.track - fillH, p.ribbon, Math.min(1, fillH));
      stage.g.globalAlpha = 1;
    }
  }

  // ---- what passes: sparks, dust, puffs, rings in the air, a warm glow, golden rays and dust ------------------------------------
  function fx(v) {
    const g = stage.g, K = stage.K;
    for (const f of v.fx) {
      if (f.age < 0) continue;
      const k = f.age / f.life;
      if (f.kind === 'spark') stage.dot(f.x, f.y, f.col || '#ffffff');
      else if (f.kind === 'dust') stage.dot(f.x, f.y, `rgba(236,230,214,${(0.8 * (1 - k)).toFixed(2)})`);
      else if (f.kind === 'puff') stage.sprite(f.x, f.y - k * 5, 16, 12, 8, 6, (px, ox, oy) => px.lump(ox, oy, f.r || 3, 'near'), `puff${f.r || 3}`, 1 - k);
      else if (f.kind === 'tink') {
        const r = 1 + k * 4, a = (1 - k).toFixed(2);
        for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) stage.dot(f.x + dx, f.y + dy, `rgba(255,255,255,${a})`);
      } else if (f.kind === 'ring') {                                  // a ring going out through the air
        const r = 2 + (f.r || 12) * (1 - (1 - k) ** 2), n = Math.max(10, Math.round(r * 2.4)), a = (0.75 * (1 - k)).toFixed(2);
        for (let i = 0; i < n; i++) { const t2 = (i / n) * Math.PI * 2; stage.dot(f.x + Math.cos(t2) * r, f.y + Math.sin(t2) * r * 0.45, `rgba(255,255,255,${a})`); }
      } else if (f.kind === 'glow') {                                  // a warm light, swelling and gone
        const r = (f.r || 20) * (0.4 + 0.6 * Math.sin(Math.min(1, k * 1.4) * Math.PI / 2)), a = 0.45 * Math.sin(Math.PI * k);
        const gr = g.createRadialGradient(f.x * K, f.y * K, 0, f.x * K, f.y * K, r * K);
        gr.addColorStop(0, `rgba(${f.col},${a.toFixed(3)})`); gr.addColorStop(1, `rgba(${f.col},0)`);
        g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect((f.x - r) * K, (f.y - r) * K, 2 * r * K, 2 * r * K); g.globalCompositeOperation = 'source-over';
      } else if (f.kind === 'gold') {                                  // golden dust, drifting down, twinkling
        const tw = 0.55 + 0.45 * Math.sin(f.age * 9 + f.tw), a = Math.min(1, f.age * 4) * (1 - k) * tw;
        stage.dot(f.x, f.y, `rgba(255,${tw > 0.8 ? 246 : 216},${tw > 0.8 ? 192 : 74},${a.toFixed(2)})`);
      } else if (f.kind === 'rays') rays(f, k, v);
      else if (f.kind === 'warm') stage.fill(`rgba(255,196,120,${(0.13 * Math.sin(Math.PI * k)).toFixed(3)})`);
    }
  }
  function rays(f, k, v) {                                             // the light behind a golden letter, turning slowly
    const g = stage.g, K = stage.K, at = v.held ? { x: v.held.x, y: v.held.y } : f, a0 = f.age * 0.5;
    const a = 0.32 * Math.sin(Math.PI * Math.min(1, k * 1.15));
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) {
      const ang = a0 + (i / 10) * Math.PI * 2, len = (i % 2 ? 26 : 38) * (0.6 + 0.4 * Math.min(1, k * 3)), wd = 0.11;
      const gr = g.createLinearGradient(at.x * K, at.y * K, (at.x + Math.cos(ang) * len) * K, (at.y + Math.sin(ang) * len) * K);
      gr.addColorStop(0, `rgba(255,220,120,${a.toFixed(3)})`); gr.addColorStop(1, 'rgba(255,220,120,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(at.x * K, at.y * K);
      g.lineTo((at.x + Math.cos(ang - wd) * len) * K, (at.y + Math.sin(ang - wd) * len) * K);
      g.lineTo((at.x + Math.cos(ang + wd) * len) * K, (at.y + Math.sin(ang + wd) * len) * K);
      g.closePath(); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  }
  function behind(v) {                                                 // in the sky behind the city: a rainbow, a flock going over
    const g = stage.g, K = stage.K;
    for (const f of v.fx) {
      if (f.age < 0) continue;
      const k = f.age / f.life;
      if (f.kind === 'rainbow') {
        const a = Math.min(1, f.age / 1.2) * Math.min(1, (f.life - f.age) / 1.6) * 0.42, cx = L.W * 0.55, cy = L.H * 0.95, r0 = Math.max(L.W, L.H) * 0.62;
        const cols = ['255,90,80', '255,160,70', '255,226,90', '120,210,110', '90,170,240', '150,120,230'];
        g.lineWidth = 2.2 * K;
        cols.forEach((c, i) => { g.strokeStyle = `rgba(${c},${a.toFixed(3)})`; g.beginPath(); g.arc(cx * K, cy * K, (r0 - i * 2.2) * K, Math.PI * 1.04, Math.PI * 1.96); g.stroke(); });
      } else if (f.kind === 'flock') {
        const x0 = -40 + (L.W + 90) * k, y0 = f.y;
        for (let i = 0; i < 7; i++) {
          const side = i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2), bx = x0 - Math.abs(side) * 7, by = y0 + side * 5 + Math.sin(f.age * 2 + i) * 1.2;
          const up = Math.sin(f.age * 9 + i * 1.3) > 0;
          stage.sprite(bx, by, 7, 3, 3, 1, (px) => { px.P(0, up ? 0 : 1, '#3a3e5a'); px.P(1, 1, '#3a3e5a'); px.P(2, 2, '#3a3e5a'); px.P(3, 1, '#3a3e5a'); px.P(4, up ? 0 : 1, '#3a3e5a'); }, `bird${up ? 1 : 0}`);
        }
      }
    }
  }
  const smoothstep = (u) => { const x = Math.max(0, Math.min(1, u)); return x * x * (3 - 2 * x); };
  // ---- the season in the air, by the real month: autumn's leaves, winter's snow, spring's petals, summer's fireflies at dusk ---
  function dusk(v) {                                                 // as the light goes: the stars, letters glowing, the lantern lit
    const late = city.late;
    if (late <= 0.3) return;
    const a = Math.min(1, (late - 0.3) / 0.5);
    for (let i = 0; i < 40; i++) { const tw = 0.5 + 0.5 * Math.sin(v.t * (1.3 + hash(i) * 2) + i); stage.dot(hash(i + 70) * L.W, hash(i + 90) * L.H * 0.42, `rgba(255,250,230,${(a * tw * 0.8).toFixed(2)})`); }
  }
  function glows(v) {
    const late = city.late;
    if (late <= 0.4) return;
    const a = Math.min(1, (late - 0.4) / 0.4), g = stage.g, K = stage.K;
    g.globalCompositeOperation = 'lighter';
    for (const l of v.letters) { if (l.state === 'leave') continue; const gr = g.createRadialGradient(l.x * K, l.y * K, 0, l.x * K, l.y * K, 9 * K); gr.addColorStop(0, `rgba(255,220,140,${(0.22 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,220,140,0)'); g.fillStyle = gr; g.fillRect((l.x - 9) * K, (l.y - 9) * K, 18 * K, 18 * K); }
    const lx = v.boat.x + 45, ly = v.boat.y - 35, gr = g.createRadialGradient(lx * K, ly * K, 0, lx * K, ly * K, 14 * K);   // the lantern on the mast, lit
    gr.addColorStop(0, `rgba(255,210,120,${(0.6 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,210,120,0)'); g.fillStyle = gr; g.fillRect((lx - 14) * K, (ly - 14) * K, 28 * K, 28 * K);
    g.globalCompositeOperation = 'source-over';
  }
  function season(v) {
    const t = v.t, W2 = L.W, H2 = L.H, kind = v.season;
    if (!kind) return;
    if (kind === 'summer') {                                        // fireflies, only as the light goes
      const a = Math.max(0, (v.day - 0.7) / 0.2);
      if (a <= 0) return;
      for (let i = 0; i < 18; i++) {
        const x = (hash(i + 3) * W2 + Math.sin(t * 0.3 + i) * 20 + W2) % W2, y = L.top + 20 + hash(i + 7) * (H2 * 0.6) + Math.sin(t * 0.7 + i * 2) * 6, on = Math.sin(t * 2 + i * 1.7) > 0.3;
        if (on) stage.dot(x, y, `rgba(255,236,120,${(0.8 * Math.min(1, a)).toFixed(2)})`);
      }
      return;
    }
    const n = kind === 'winter' ? 46 : 22, cols = kind === 'autumn' ? ['#e8743a', '#d9a63a', '#c8502a', '#f0c050'] : kind === 'spring' ? ['#f8c8d8', '#ffffff', '#f4a8c0'] : ['#ffffff', '#eef4ff'];
    for (let i = 0; i < n; i++) {
      const sp = 6 + hash(i + 11) * 10, dx = kind === 'winter' ? -2 : -9 - hash(i) * 6;
      const x = ((hash(i + 1) * (W2 + 40) + dx * t + Math.sin(t * (0.8 + hash(i + 2)) + i) * 6) % (W2 + 40) + W2 + 40) % (W2 + 40) - 20;
      const y = ((hash(i + 5) * (H2 + 20) + sp * t) % (H2 + 20)) - 10, c = cols[i % cols.length];
      if (kind === 'winter') stage.dot(x, y, 'rgba(255,255,255,0.85)');
      else { const flip = Math.sin(t * 3 + i) > 0; stage.dot(x, y, c); if (flip) stage.dot(x + 1, y, c); else stage.dot(x, y + 1, c); }
    }
  }
  function shower(v) {                                               // a quiet day: a mist; and a shower about a minute in
    if (v.mist) stage.fill(`rgba(236,240,248,${(0.08 + 0.06 * (v.rain || 0)).toFixed(3)})`);
    const r = v.rain || 0;
    if (r <= 0.02) return;
    const n = Math.round(70 * r), t = v.t;
    for (let i = 0; i < n; i++) {
      const x = ((hash(i + 21) * (L.W + 60) - t * 30) % (L.W + 60) + L.W + 60) % (L.W + 60) - 30, y = ((hash(i + 33) * (L.H + 30) + t * 150) % (L.H + 30)) - 15;
      stage.dot(x, y, 'rgba(200,214,240,0.55)'); stage.dot(x - 0.4, y + 1, 'rgba(200,214,240,0.45)'); stage.dot(x - 0.8, y + 2, 'rgba(200,214,240,0.3)');
    }
  }

  // ---- the whole sky, one moment ---------------------------------------------------------------------------------------------------
  let now = 0, shaking = 0;
  function draw(v) {
    now = v.t; shaking = v.shake || 0;
    back(v.t, v);
    behind(v);
    dusk(v);
    town(v);
    lake(v);
    season(v);
    const onLine = v.letters.filter((l) => l.state === 'hooked' || l.state === 'closed');
    for (const l of v.letters) if (!onLine.includes(l)) letter(l);
    deep(v);
    boat(v);
    rod(v);
    line(v);
    for (const l of onLine) letter(l);
    if (v.held) letter(v.held);
    if (v.drop) stage.sprite(v.drop.x, v.drop.y, 11, 8, 5, 3, airmailArt, 'airmail');
    gull(v);
    fx(v);
    glows(v);
    shower(v);
    charge(v);
    bang(v);
    panel(v);
  }
  return { layout, draw, L, city };
}
