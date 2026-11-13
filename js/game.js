// GOODLUCK FISHING: the lake (DESIGN.md, step 1). The GoodLuck duck in a boat; every shadow under the water is a real job
// just posted on a company's own board; hold to cast, release to throw, click when the float dives, and the fish is the job.
import { DUCK_PATH, DUCK_SIDE } from './duck.js';
import { COMPANIES, sonar } from './sources.js';

const W = 320, H = 180, HORIZON = 92, WATERLINE = 106;
const DAY = 600;                      // seconds from sunrise to sunset: ten minutes on the lake
const FRESH_DAYS = 14;                // a job posted longer ago than this is not in the lake
const SHOWN = 10;                     // shadows in the water at once; the rest wait deeper
const BITE_WINDOW = 0.9;              // seconds to strike once the float dives

const cv = document.getElementById('lake');
const g = cv.getContext('2d');
const $ = (id) => document.getElementById(id);

// ---- colours ---------------------------------------------------------------------------------------------------------
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const rgb = (a) => `rgb(${a.map((x) => Math.round(x)).join(',')})`;
const mix = (a, b, t) => rgb(hex(a).map((x, i) => x + (hex(b)[i] - x) * t));
const mixA = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
// the sky through the day: [moment, top, bottom]
const SKY = [[0, '#2b2d5c', '#f2a37c'], [0.1, '#4f73c4', '#f7c99c'], [0.25, '#5aa0e6', '#c3e6f6'], [0.72, '#5aa0e6', '#c3e6f6'],
  [0.86, '#6c4f9f', '#f39b6c'], [1, '#2a1f4a', '#c0605a']];
function skyAt(t) {
  for (let i = 1; i < SKY.length; i++) {
    if (t <= SKY[i][0]) {
      const [t0, a0, b0] = SKY[i - 1], [t1, a1, b1] = SKY[i], k = (t - t0) / (t1 - t0);
      return { top: mixA(hex(a0), hex(a1), k), bottom: mixA(hex(b0), hex(b1), k) };
    }
  }
  return { top: hex(SKY[SKY.length - 1][1]), bottom: hex(SKY[SKY.length - 1][2]) };
}

// ---- small pixel tools -----------------------------------------------------------------------------------------------
const px = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
function line(x0, y0, x1, y1, c) {                       // a one-pixel line, no blur
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  g.fillStyle = c;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x0 += sx; }
    if (e2 <= dx) { e += dx; y0 += sy; }
  }
}
function ellipse(cx, cy, rx, ry, c) {
  g.fillStyle = c;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}
const rand = (a, b) => a + Math.random() * (b - a);
const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---- the duck: GoodLuck's own (JobA-Z logo.svg, js/duck.js) drawn again in pixels, as its round head, its raised tail
// and its little beak; traced from the path, the shape alone was a white blob at this size, so it has an eye, an orange
// beak and a wing here. Facing the water.
const DUCK_ROWS = [
  '.........kkkkk......',
  '........kwwwwwk.....',
  '.......kwwwwwwwk....',
  '.......kwwwwwewk....',
  '.......kwwwwwwwkkk..',
  '.......kwwwwwwwoook.',
  '........kwwwwwwkkk..',
  '.kk......kwwwwwk....',
  'kwwk....kwwwwwwk....',
  'kwwwkkkkwwwwwwwwk...',
  'kwwwwwwwwwwwwwwwwk..',
  'kwwwwwwdddwwwwwwwk..',
  'kwwwwwdwwwdwwwwwwk..',
  '.kwwwwwwwwwwwwwwwk..',
  '.ksssssssssssssssk..',
  '..kssssssssssssk....',
  '...kkkkkkkkkkkk.....',
];
const DUCK_INK = { k: '#2b2f5a', w: '#ffffff', s: '#dfe6ff', o: '#f29a3a', e: '#1b1f3a', d: '#c3cbef' };
function sprite(rows, ink) {
  const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, i) => { if (ink[ch]) { x.fillStyle = ink[ch]; x.fillRect(i, y, 1, 1); } }));
  return c;
}
const DUCK = sprite(DUCK_ROWS, DUCK_INK);
void DUCK_PATH; void DUCK_SIDE;                     // the vector duck, for the bigger pictures (the share card, step 4)

// ---- a fish: one species for each company, its size the job's (step 2: the score) -------------------------------------
const SPECIES = [['#e8794a', '#ffb07a'], ['#5aa86a', '#a6e0a0'], ['#d6527a', '#ff9bb8'], ['#4a86d8', '#9cc7ff'],
  ['#9a6ad0', '#cfb0ff'], ['#c9a227', '#ffe17a'], ['#3aa6a0', '#8fe3d8'], ['#d0603a', '#f6a98a']];
// one fish, facing right: k its outline, b its back, l its belly, f its fins, w and e the eye
const FISH_ROWS = [
  '...........kkkk.........',
  '.........kkffffk........',
  '.kk....kkbbbbbbbkk......',
  'kffk.kkbbbbbbbbbbbkk....',
  'kfffkbbbbbbbbbbbbbbbk...',
  '.kffbbbbbbbbbbbbbbwwbk..',
  '..kfbbbbbbbbbbbbbbwebbk.',
  '.kffllllllllllllllllllk.',
  'kfffkllllllfflllllllkk..',
  'kffk.kkllllllffllllk....',
  '.kk....kkllllllllkk.....',
  '.........kkkkkkkk.......',
];
const darker = (c, k) => rgb(hex(c).map((v) => v * k));
function fishSprite(job) {
  const [body, belly] = SPECIES[hash(job.company) % SPECIES.length];
  return sprite(FISH_ROWS, { k: darker(body, 0.45), b: body, l: belly, f: darker(body, 0.78), w: '#ffffff', e: '#1b1f3a' });
}

// ---- the day ---------------------------------------------------------------------------------------------------------
const S = {
  t: 0, day: 0, paused: false, over: false,
  lake: [],             // jobs found and not yet in the water
  seen: new Set(),      // every job id that reached the lake
  shadows: [],          // the jobs swimming now
  bucket: [],           // what you caught (or what slipped off: never lost)
  read: 0, failed: 0, total: COMPANIES.length,
  state: 'idle',        // idle · charge · fly · wait · nibble · bite · reel
  power: 0, held: 0, cast: null, float: null, target: null, timer: 0, nibbles: 0,
  splashes: [], ripples: [], jumper: null, auto: false, autoWait: 1.5,
};
const BOAT = { x: 58, y: WATERLINE };
const tip = () => ({ x: BOAT.x + 46, y: BOAT.y - 30 + bob() });
const bob = () => Math.sin(S.t * 1.7) * 1.2;

// clouds and hills, made once
const CLOUDS = Array.from({ length: 5 }, (_, i) => ({ x: i * 75 + rand(0, 40), y: rand(12, 50), w: rand(16, 34), v: rand(1.2, 3) }));
const HILLS = Array.from({ length: W }, (_, x) => 10 + 7 * Math.sin(x / 37) + 4 * Math.sin(x / 13 + 1) + 2 * Math.sin(x / 5));
const TREES = Array.from({ length: W }, (_, x) => 3 + 3 * Math.abs(Math.sin(x * 1.7)) + 2 * Math.sin(x / 9));
const GLINTS = Array.from({ length: 46 }, () => ({ x: rand(0, W), y: rand(HORIZON + 3, H - 2), w: rand(3, 9), p: rand(0, 6.3), v: rand(1.5, 4) }));

// ---- the search, as fish swimming into the lake -----------------------------------------------------------------------
function startSonar() {
  const since = Date.now() - FRESH_DAYS * 864e5;
  sonar(COMPANIES, (c, jobs) => {
    S.read++;
    if (!jobs) S.failed++;
    else {
      const fresh = jobs.filter((j) => j.posted >= since && j.url && !S.seen.has(j.id));
      fresh.forEach((j) => S.seen.add(j.id));
      S.lake.push(...fresh);
      S.lake.sort((a, b) => b.posted - a.posted);          // the newest swim in first
    }
    sonarSay(jobs ? `Sonar: ${jobs[0] ? jobs[0].company : c.slug} read` : `Sonar: ${c.slug} did not answer`);
  }).then(() => sonarSay());
}
function sonarSay(now) {
  const n = S.lake.length + S.shadows.length;
  const done = S.read >= S.total;
  $('sonar').textContent = done
    ? `Lake: ${n} fish from ${S.total - S.failed} companies${S.failed ? ` (${S.failed} did not answer)` : ''}`
    : `${now || 'Sonar: listening…'} · ${S.read}/${S.total}`;
}
function spawn() {
  if (S.shadows.length >= SHOWN || !S.lake.length) return;
  const job = S.lake.shift();
  // it rises from the deep somewhere in the lake, faint at first (fish swimming in from the edges all crowded one side)
  S.shadows.push({ job, x: rand(125, W - 15), y: rand(116, 170), dir: Math.random() < 0.5 ? 1 : -1, v: rand(5, 11),
    len: rand(7, 11), wig: rand(0, 6), turn: rand(2, 6), mode: 'swim', rise: 0 });
  sonarSay();
}

// ---- drawing ---------------------------------------------------------------------------------------------------------
function draw() {
  const day = S.day, sky = skyAt(day);
  // the sky in bands
  const BANDS = 14;
  for (let b = 0; b < BANDS; b++) {
    g.fillStyle = rgb(mixA(sky.top, sky.bottom, b / (BANDS - 1)));
    g.fillRect(0, Math.floor((b * HORIZON) / BANDS), W, Math.ceil(HORIZON / BANDS) + 1);
  }
  // the sun on its arc
  const sx = 24 + day * 272, sy = HORIZON - 6 - Math.sin(Math.PI * day) * 70;
  ellipse(sx, sy, 10, 10, rgb(mixA(sky.bottom, [255, 240, 190], 0.35)));
  ellipse(sx, sy, 7, 7, day > 0.82 || day < 0.1 ? '#ffc07a' : '#fff1b8');
  // clouds
  for (const c of CLOUDS) {
    const col = rgb(mixA([255, 255, 255], sky.bottom, 0.25));
    g.fillStyle = col;
    g.fillRect(Math.round(c.x), Math.round(c.y), Math.round(c.w), 3);
    g.fillRect(Math.round(c.x + c.w * 0.2), Math.round(c.y - 2), Math.round(c.w * 0.45), 2);
    g.fillRect(Math.round(c.x + c.w * 0.5), Math.round(c.y - 3), Math.round(c.w * 0.3), 3);
  }
  // hills and the line of trees
  const far = rgb(mixA(sky.bottom, [70, 96, 140], 0.55)), near = rgb(mixA(sky.bottom, [38, 66, 70], 0.75));
  for (let x = 0; x < W; x++) {
    g.fillStyle = far; g.fillRect(x, HORIZON - HILLS[x], 1, HILLS[x]);
    g.fillStyle = near; g.fillRect(x, HORIZON - TREES[x], 1, TREES[x]);
  }
  // the water, deeper as it nears you
  const top = mixA(sky.bottom, [47, 111, 154], 0.55), deep = mixA(sky.top, [20, 52, 88], 0.75);
  for (let b = 0; b < 8; b++) {
    g.fillStyle = rgb(mixA(top, deep, b / 7));
    g.fillRect(0, HORIZON + Math.floor((b * (H - HORIZON)) / 8), W, Math.ceil((H - HORIZON) / 8) + 1);
  }
  // the sun on the water
  for (let y = HORIZON + 2; y < HORIZON + 34; y += 3) {
    const w = 3 + (y - HORIZON) / 5, o = Math.sin(S.t * 2 + y) * 2;
    g.fillStyle = 'rgba(255,236,180,0.35)';
    g.fillRect(Math.round(sx - w / 2 + o), y, Math.round(w), 1);
  }
  // glints
  for (const s of GLINTS) {
    const a = 0.12 + 0.18 * Math.sin(S.t * 1.3 + s.p);
    if (a <= 0.05) continue;
    g.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
    g.fillRect(Math.round(s.x), Math.round(s.y), Math.round(s.w), 1);
  }
  // the shadows: the jobs swimming
  for (const f of S.shadows) {
    const shade = `rgba(10,25,45,${((f.mode === 'flee' ? 0.22 : 0.4) * Math.min(1, f.rise)).toFixed(2)})`;
    ellipse(f.x, f.y, f.len, 3, shade);
    const w = Math.round(Math.sin(S.t * 8 + f.wig)), tx = Math.round(f.x - f.dir * (f.len + 1)), ty = Math.round(f.y);
    g.fillStyle = shade;                                                     // its tail, forked, swaying
    g.fillRect(tx - (f.dir > 0 ? 2 : 0), ty - 1 + w, 2, 2);
    g.fillRect(tx - (f.dir > 0 ? 3 : -1), ty - 3 + w, 2, 2);
    g.fillRect(tx - (f.dir > 0 ? 3 : -1), ty + 1 + w, 2, 2);
  }
  drawBoat();
  drawLine();
  // splashes and ripples
  for (const r of S.ripples) {
    const k = r.age / r.life, rx = 2 + k * 12, ry = 1 + k * 3;
    g.fillStyle = `rgba(255,255,255,${(0.6 * (1 - k)).toFixed(2)})`;
    for (let a = 0; a < 6.28; a += 0.25) g.fillRect(Math.round(r.x + Math.cos(a) * rx), Math.round(r.y + Math.sin(a) * ry), 1, 1);
  }
  for (const p of S.splashes) px(p.x, p.y, `rgba(235,248,255,${Math.max(0, 1 - p.age / p.life).toFixed(2)})`);
  // a fish in the air, coming to the boat
  if (S.jumper) {
    const j = S.jumper, k = Math.min(1, j.age / j.life);
    const x = j.x0 + (j.x1 - j.x0) * k, y = j.y0 + (j.y1 - j.y0) * k - Math.sin(Math.PI * k) * 34;
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(Math.sin(S.t * 18) * 0.4 - 0.3);
    g.drawImage(j.img, -12, -6); g.restore();
  }
  // the power of the cast
  if (S.state === 'charge') {
    const bx = BOAT.x - 6, by = BOAT.y - 34, h = 26;
    g.fillStyle = '#3a2a1a'; g.fillRect(bx - 1, by - 1, 5, h + 2);
    g.fillStyle = '#fff8e7'; g.fillRect(bx, by, 3, h);
    const fill = Math.round(h * S.power);
    g.fillStyle = S.power > 0.92 ? '#ffcf4a' : '#8c9cf8'; g.fillRect(bx, by + h - fill, 3, fill);
  }
  // a bite: the mark over the float
  if (S.state === 'bite' && S.float) {
    const fx = Math.round(S.float.x), fy = Math.round(S.float.y) - 19 + Math.round(Math.sin(S.t * 30));
    g.fillStyle = '#3a2a1a'; g.fillRect(fx - 4, fy - 1, 9, 13); g.fillRect(fx - 1, fy + 12, 3, 1); px(fx, fy + 13, '#3a2a1a');
    g.fillStyle = '#fff8e7'; g.fillRect(fx - 3, fy, 7, 11); g.fillRect(fx, fy + 11, 1, 1);
    g.fillStyle = '#e03a3a'; g.fillRect(fx - 1, fy + 2, 3, 5); g.fillRect(fx - 1, fy + 8, 3, 2);
  }
  // night falls over the last moments
  if (day > 0.9) { g.fillStyle = `rgba(20,14,48,${((day - 0.9) * 3).toFixed(2)})`; g.fillRect(0, 0, W, H); }
}

function drawBoat() {
  const y = BOAT.y + bob(), x = BOAT.x;
  ellipse(x + 22, WATERLINE + 3, 26, 2, 'rgba(10,25,45,0.35)');            // its shadow on the water
  // the duck sits in it, holding the rod
  g.drawImage(DUCK, x + 12, Math.round(y - 19));
  const t = tip();
  line(x + 29, y - 8, t.x, t.y, '#5a3a1a');                                   // the rod, held at the duck's front
  px(t.x, t.y, '#c9a227');
  // the hull, planks and rim
  const rows = [[0, 46, '#a8683a'], [1, 44, '#7a4a2a'], [2, 43, '#7a4a2a'], [3, 41, '#6a3e22'], [4, 39, '#6a3e22'], [5, 36, '#5a321a'], [6, 32, '#4a2814']];
  for (const [r, w, c] of rows) { g.fillStyle = c; g.fillRect(Math.round(x + (46 - w) / 2), Math.round(y - 6 + r), w, 1); }
  g.fillStyle = '#c98a4e'; g.fillRect(x, Math.round(y - 7), 46, 1);
  g.fillStyle = '#4a2814'; g.fillRect(x + 10, Math.round(y - 4), 1, 3); g.fillRect(x + 35, Math.round(y - 4), 1, 3);
}

function drawLine() {
  const t = tip();
  if (S.state === 'fly' && S.cast) {
    const c = S.cast, k = Math.min(1, c.age / c.life);
    const x = t.x + (c.x - t.x) * k, y = t.y + (c.y - t.y) * k - Math.sin(Math.PI * k) * c.arc;
    line(t.x, t.y, x, y, 'rgba(255,255,255,0.75)');
    drawFloat(x, y, false);
    return;
  }
  if (!S.float) return;
  const f = S.float;
  // the line sags from the tip to the float
  let lx = t.x, ly = t.y;
  for (let i = 1; i <= 16; i++) {
    const k = i / 16, x = t.x + (f.x - t.x) * k, y = t.y + (f.y - t.y) * k + Math.sin(Math.PI * k) * 6;
    line(lx, ly, x, y, 'rgba(255,255,255,0.6)'); lx = x; ly = y;
  }
  drawFloat(f.x, f.y + f.dip, f.dip > 2);
}
function drawFloat(x, y, under) {
  x = Math.round(x); y = Math.round(y);
  if (under) { g.fillStyle = '#e03a3a'; g.fillRect(x - 1, y - 1, 3, 1); return; }   // only its tip shows
  g.fillStyle = '#e03a3a'; g.fillRect(x - 1, y - 3, 3, 2);
  g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 3, 2);
  g.fillStyle = '#3a2a1a'; g.fillRect(x, y - 4, 1, 1);
}

// ---- the play --------------------------------------------------------------------------------------------------------
function press() {                                  // a press: hold to cast, strike on a bite, reel in an empty line
  sound.wake();
  if (S.paused || S.over) return;
  if (S.state === 'idle') { S.state = 'charge'; S.held = 0; S.power = 0; return; }
  if (S.state === 'bite') return strike();
  if (S.state === 'wait' || S.state === 'nibble') return reelIn(S.state === 'nibble' ? 'Too soon: it let go.' : '');
}
function release() {
  if (S.state !== 'charge') return;
  throwAt(S.power);
}
function throwAt(power) {
  const x = Math.min(W - 10, 118 + power * 186), y = 150 - power * 34 + rand(-3, 3);
  S.cast = { x, y, age: 0, life: 0.45 + power * 0.4, arc: 18 + power * 26 };
  S.state = 'fly';
  sound.cast();
}
function land() {
  const c = S.cast;
  S.float = { x: c.x, y: c.y, dip: 0 };
  S.cast = null; S.state = 'wait'; S.timer = 0;
  splash(c.x, c.y, 8); S.ripples.push({ x: c.x, y: c.y, age: 0, life: 1.2 });
  sound.plop();
  // the nearest fish that can see the float comes to it
  let best = null, bd = 48;
  for (const f of S.shadows) {
    if (f.mode !== 'swim') continue;
    const d = Math.hypot(f.x - c.x, (f.y - c.y) * 1.6);
    if (d < bd) { bd = d; best = f; }
  }
  S.target = best;
  if (best) best.mode = 'come';
}
function strike() {
  const f = S.target;
  S.state = 'reel';
  sound.catch();
  S.jumper = { img: fishSprite(f.job), x0: S.float.x, y0: S.float.y, x1: BOAT.x + 24, y1: BOAT.y - 20, age: 0, life: 0.85, job: f.job };
  splash(S.float.x, S.float.y, 14);
  S.shadows.splice(S.shadows.indexOf(f), 1);
  S.float = null; S.target = null;
}
function landed(job) {                              // the fish in the boat: its card
  S.bucket.push({ job, caught: true });
  $('bucketN').textContent = S.bucket.length;
  S.state = 'idle';
  // the duck fishing by itself says what it caught and fishes on; a card would stop the day for a press
  if (S.auto) toast(`Caught: ${job.title} · ${job.company}`);
  else showCard(job);
}
function slipped() {                                // too late: it is off the hook, but never lost
  const f = S.target;
  if (f) {
    f.mode = 'flee'; f.dir = Math.random() < 0.5 ? -1 : 1;
    S.bucket.push({ job: f.job, caught: false });
    $('bucketN').textContent = S.bucket.length;
  }
  reelIn('It slipped off the hook, but it is in your bucket.');
}
function reelIn(said) {
  if (S.target && S.target.mode === 'come') S.target.mode = 'swim';
  S.target = null; S.float = null; S.state = 'idle';
  if (said) toast(said);
}
function splash(x, y, n) {
  for (let i = 0; i < n; i++) S.splashes.push({ x, y, vx: rand(-22, 22), vy: rand(-42, -14), age: 0, life: rand(0.35, 0.7) });
}

// ---- the clock of the game -------------------------------------------------------------------------------------------
function step(dt) {
  S.t += dt;
  for (const c of CLOUDS) { c.x += c.v * dt; if (c.x > W + 10) c.x = -c.w - 10; }
  for (const s of GLINTS) { s.x -= s.v * dt * 0.4; if (s.x < -10) s.x = W + 5; }
  if (!S.paused && !S.over) {
    S.day = Math.min(1, S.day + dt / DAY);
    if (S.day >= 1) return sunset();
  }
  if (Math.random() < dt * 0.9) spawn();
  // the fish
  for (const f of S.shadows) {
    f.rise = Math.min(1, f.rise + dt / 1.5);
    if (f.mode === 'swim') {
      f.x += f.dir * f.v * dt; f.y += Math.sin(S.t * 0.7 + f.wig) * dt * 3; f.turn -= dt;
      if (f.x < 108 || f.x > W - 6 || f.turn < 0) { f.dir *= -1; f.turn = rand(3, 8); f.x = Math.max(108, Math.min(W - 6, f.x)); }
      f.y = Math.max(114, Math.min(172, f.y));
    } else if (f.mode === 'come' && S.float) {
      const dx = S.float.x - f.x, dy = S.float.y + 2 - f.y, d = Math.hypot(dx, dy);
      f.dir = dx >= 0 ? 1 : -1;
      if (d > 2) { f.x += (dx / d) * 14 * dt; f.y += (dy / d) * 14 * dt; }
      else if (S.state === 'wait') { S.state = 'nibble'; S.timer = 0; S.nibbles = Math.floor(rand(1, 4)); }
    } else if (f.mode === 'flee') {
      f.x += f.dir * 40 * dt;
    }
  }
  S.shadows = S.shadows.filter((f) => f.mode !== 'flee' || (f.x > -20 && f.x < W + 20));
  // the line
  if (S.state === 'charge') { S.held += dt; S.power = Math.min(1, S.held / 1.1); }
  if (S.state === 'fly') { S.cast.age += dt; if (S.cast.age >= S.cast.life) land(); }
  if (S.float) S.float.dip *= Math.pow(0.02, dt);
  if (S.state === 'wait') {
    S.timer += dt;
    if (S.float) S.float.dip = Math.sin(S.t * 2) * 0.4;
    if (!S.target && S.timer > 3.2) reelIn(S.auto ? '' : S.shadows.length ? 'Nothing near the float. Cast toward a shadow.' : 'The lake is still filling. Wait a moment.');
  }
  if (S.state === 'nibble') {
    S.timer += dt;
    if (S.timer > 0.55) { S.timer = 0; S.float.dip = 2; sound.tick(); if (--S.nibbles <= 0) { S.state = 'bite'; S.timer = 0; S.float.dip = 5; sound.bite(); } }
  }
  if (S.state === 'bite') {
    S.timer += dt; S.float.dip = 5;
    if (S.auto && S.timer > S.autoStrike) strike();
    else if (S.timer > BITE_WINDOW) slipped();
  }
  if (S.jumper) { S.jumper.age += dt; if (S.jumper.age >= S.jumper.life) { const job = S.jumper.job; S.jumper = null; splash(BOAT.x + 24, BOAT.y - 8, 6); landed(job); } }
  for (const p of S.splashes) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; }
  S.splashes = S.splashes.filter((p) => p.age < p.life);
  for (const r of S.ripples) r.age += dt;
  S.ripples = S.ripples.filter((r) => r.age < r.life);
  // the duck fishing by itself
  if (S.auto && S.state === 'idle' && !S.paused && !S.over) {
    S.autoWait -= dt;
    const f = S.shadows.find((x) => x.mode === 'swim');
    if (f && S.autoWait <= 0) {
      S.autoWait = rand(1.2, 2.4);
      S.autoStrike = rand(0.2, 0.75);
      throwAt(Math.max(0, Math.min(1, (f.x - 118) / 186)));
    }
  }
  clock();
}
function clock() {
  const left = Math.max(0, Math.ceil(DAY * (1 - S.day)));
  $('clock').innerHTML = `${S.day > 0.86 ? '🌇' : '☀'} <b>${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</b>`;
}

// ---- the cards -------------------------------------------------------------------------------------------------------
const ago = (ms) => {
  const h = Math.max(0, (Date.now() - ms) / 36e5), n = h < 48 ? Math.round(h) : Math.round(h / 24), unit = h < 48 ? 'hour' : 'day';
  return h < 1 ? 'posted within the hour' : `posted ${n} ${unit}${n === 1 ? '' : 's'} ago`;
};
function paintFish(canvas, job) {
  const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, canvas.width, canvas.height);
  c.drawImage(fishSprite(job), 0, 0, canvas.width, canvas.height);
}
function showCard(job) {
  S.paused = true;
  paintFish($('fishPic'), job);
  $('cardTitle').textContent = job.title;
  $('cardWho').textContent = job.company;
  $('cardMeta').textContent = [job.place, ago(job.posted)].filter(Boolean).join(' · ');
  $('cardOpen').href = job.url;
  $('card').hidden = false;
  $('cardBack').focus();
}
function closeCard() { $('card').hidden = true; S.paused = false; }
function showBucket(head) {
  S.paused = true;
  $('bucketHead').textContent = head || 'Your bucket';
  const n = S.bucket.length;
  $('bucketSub').textContent = n ? `${n} job${n > 1 ? 's' : ''} today, the newest first. Each opens on the company's own page.`
    : 'Nothing yet. Hold to cast, release to throw, click when the float dives.';
  const ol = $('bucketList'); ol.replaceChildren();
  for (const { job } of S.bucket.slice().sort((a, b) => b.job.posted - a.job.posted)) {
    const li = document.createElement('li');
    const pic = document.createElement('canvas'); pic.width = 48; pic.height = 24; paintFish(pic, job);
    const t = document.createElement('div'); t.className = 't';
    const b = document.createElement('b'); b.textContent = job.title;
    const s = document.createElement('span'); s.textContent = [job.company, job.place, ago(job.posted)].filter(Boolean).join(' · ');
    t.append(b, s);
    const a = document.createElement('a'); a.href = job.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open ↗';
    li.append(pic, t, a); ol.appendChild(li);
  }
  $('bucket').hidden = false;
}
function closeBucket() { $('bucket').hidden = true; S.paused = S.over; }
function sunset() {
  S.over = true; S.state = 'idle'; S.float = null; S.target = null;
  showBucket(`The sun has set: ${S.bucket.length} fish today`);
  $('bucketBack').textContent = 'Fish again';
}
let toastTimer = 0;
function toast(text) {
  const t = $('toast'); t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

// ---- sound: small sounds made on the spot, nothing to load ------------------------------------------------------------
const sound = (() => {
  let ac = null, on = true;
  const tone = (f, d, type = 'square', vol = 0.06, slide = 0) => {
    if (!ac || !on) return;
    const o = ac.createOscillator(), v = ac.createGain(), t = ac.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + d);
    v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(v); v.connect(ac.destination); o.start(t); o.stop(t + d);
  };
  const noise = (d, vol = 0.08) => {
    if (!ac || !on) return;
    const b = ac.createBuffer(1, ac.sampleRate * d, ac.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain();
    f.type = 'lowpass'; f.frequency.value = 900; v.gain.value = vol;
    s.buffer = b; s.connect(f); f.connect(v); v.connect(ac.destination); s.start();
  };
  return {
    wake() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } },
    toggle() { on = !on; return on; },
    cast() { tone(420, 0.25, 'triangle', 0.05, 0.5); },
    plop() { noise(0.18, 0.12); tone(220, 0.08, 'sine', 0.05, 0.6); },
    tick() { tone(660, 0.05, 'square', 0.03); },
    bite() { tone(880, 0.09, 'square', 0.06); setTimeout(() => tone(1175, 0.12, 'square', 0.06), 90); },
    catch() { noise(0.25, 0.14); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.05), 120 + i * 80)); },
  };
})();

// ---- input -----------------------------------------------------------------------------------------------------------
cv.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
addEventListener('pointerup', release);
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (!$('card').hidden) closeCard(); else if (!$('bucket').hidden && !S.over) closeBucket(); return; }
  if (e.code !== 'Space' || e.repeat) return;
  if (!$('card').hidden) { e.preventDefault(); closeCard(); return; }
  if (!$('bucket').hidden) return;
  e.preventDefault(); press();
});
addEventListener('keyup', (e) => { if (e.code === 'Space') release(); });
$('cardBack').addEventListener('click', closeCard);
$('card').addEventListener('click', (e) => { if (e.target === $('card')) closeCard(); });
$('bucketBtn').addEventListener('click', () => showBucket());
$('bucketBack').addEventListener('click', () => {
  if (S.over) { location.reload(); return; }
  closeBucket();
});
$('autoBtn').addEventListener('click', () => { S.auto = !S.auto; $('autoBtn').textContent = `Auto: ${S.auto ? 'on' : 'off'}`; sound.wake(); });
$('soundBtn').addEventListener('click', () => { $('soundBtn').textContent = `♪ ${sound.toggle() ? 'on' : 'off'}`; sound.wake(); });
document.addEventListener('visibilitychange', () => { last = performance.now(); });

// ---- the stage: the lake scaled up by a whole number, so the pixels stay sharp -----------------------------------------
function fit() {
  // a whole number where there is room; on a phone the lake fills the width (two pixels or more each, else a tiny lake)
  const room = Math.min((innerWidth - 24) / W, (innerHeight - 70) / H);
  const k = room >= 2 ? Math.floor(room) : Math.max(1, room);
  cv.style.width = `${W * k}px`; cv.style.height = `${H * k}px`;
  $('stage').style.width = `${W * k}px`;
}
addEventListener('resize', fit);
fit();
if (matchMedia('(pointer: coarse)').matches) $('hint').textContent = 'Hold · let go to throw · tap when the float dives';

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  step(dt); draw();
  requestAnimationFrame(frame);
}
startSonar();
requestAnimationFrame(frame);
// ?debug: the game's own hands, to try it frame by frame where the page is not shown (a hidden page draws no frames)
if (new URLSearchParams(location.search).has('debug')) {
  window.fish = { S, press, release, run(seconds) { for (let k = 0; k < seconds * 20; k++) step(0.05); draw(); return S.state; } };
}
