// THE LOBBY (PLAN.md 9, part 1): an office late at night, the yellow duck asleep on its desk among the papers, the
// computer still saying how the search goes; a click on the duck and a beam of light, a golden escalator comes down, the
// duck wakes and floats up it into the sky. Our own scene: no character, picture or music of any cartoon.
// Drawn small on a canvas whose shape follows the window (wide on a computer, tall on a phone), scaled up sharp.

import { me, begin } from './setup.js';
import { AWAKE, ASLEEP } from './art.js';
import { user, saveProfile, postcard } from './account.js';
import { makeSky } from './sky.js';

const cv = document.getElementById('scene');
const g = cv.getContext('2d');
const $ = (id) => document.getElementById(id);

// ---- the stage: a small canvas shaped like the window ------------------------------------------------------------------
let W = 320, H = 180, K = 1;
let sky = null;                                    // the sky scene, made below once the page is laid out
function fit() {
  const iw = innerWidth, ih = innerHeight - 28;
  if (iw >= ih) { H = 180; W = Math.max(240, Math.min(400, Math.round(H * iw / ih))); }
  else { W = 180; H = Math.max(240, Math.min(400, Math.round(W * ih / iw))); }
  const room = Math.min(iw / W, ih / H);
  K = room >= 2 ? Math.floor(room) : room;
  cv.width = W; cv.height = H;
  cv.style.width = `${W * K}px`; cv.style.height = `${H * K}px`;
  g.imageSmoothingEnabled = false;
  layout();
  if (sky) sky.resize();
}

// ---- pixel tools ------------------------------------------------------------------------------------------------------
const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
// the yellow duck: js/art.js, shared with the sky

// ---- the room, laid out from the canvas's own size ---------------------------------------------------------------------
const L = {};
function layout() {
  L.floor = Math.round(H * 0.8);
  L.deskW = Math.min(130, Math.round(W * 0.62));
  L.deskX = Math.round((W - L.deskW) / 2);
  L.deskTop = L.floor - 30;
  L.duckX = L.deskX + Math.round(L.deskW * 0.32);
  L.duckY = L.deskTop - 13;
  L.monX = L.deskX + L.deskW - 54; L.monY = L.deskTop - 32;
  L.winX = W >= H ? 14 : Math.round(W / 2 - 34); L.winY = 14;
  L.top = { x: Math.max(8, L.duckX - 60), y: -8 };    // where the escalator comes from: the far side from the computer
  STARS.length = 0;
  for (let i = 0; i < 9; i++) STARS.push({ x: L.winX + 4 + Math.random() * 60, y: L.winY + 4 + Math.random() * 26, p: Math.random() * 6 });
  place();
}
const STARS = [];

// ---- the play ---------------------------------------------------------------------------------------------------------
const S = { t: 0, mode: 'sleep', a: 0, zs: [], sparks: [], ready: !!me };   // sleep · ascend · gone; ready once the CV is in
const ASCEND = { beam: 1.0, steps: 2.2, wake: 2.4, rise: 2.8, top: 5.2, white: 6.0 };

function step(dt) {
  S.t += dt;
  if (S.mode === 'sleep' && Math.random() < dt * 0.7) S.zs.push({ x: L.duckX + 15, y: L.duckY - 2, age: 0 });
  for (const z of S.zs) { z.age += dt; z.y -= dt * 6; z.x += Math.sin(z.age * 3) * dt * 4; }
  S.zs = S.zs.filter((z) => z.age < 2.6 && S.mode === 'sleep');
  if (S.mode === 'ascend') {
    S.a += dt;
    if (S.a > ASCEND.rise && Math.random() < dt * 18) S.sparks.push({ x: duckAt().x + 10 + (Math.random() - 0.5) * 16, y: duckAt().y + 8, age: 0 });
    if (S.a >= ASCEND.white) {
      S.mode = 'gone'; $('hint').hidden = true; $('screen').hidden = true; sky.start();
      // the bait: the CV's own skills
      $('baitSel').replaceChildren(new Option('Bait: any', ''), ...sky.baits().map((k) => new Option(`Bait: ${k}`, k)));
    }
  }
  for (const s of S.sparks) { s.age += dt; s.y += dt * 10; }
  S.sparks = S.sparks.filter((s) => s.age < 1);
}
// where the duck is now: at its desk, or riding the escalator up
function duckAt() {
  if (S.mode !== 'ascend' || S.a < ASCEND.rise) return { x: L.duckX, y: L.duckY - (S.mode === 'ascend' && S.a > ASCEND.wake ? 3 : 0) };
  const k = Math.min(1, (S.a - ASCEND.rise) / (ASCEND.top - ASCEND.rise)), e = k * k * (3 - 2 * k);
  return { x: L.duckX + (L.top.x - 4 - L.duckX) * e, y: L.duckY - 3 + (L.top.y - 20 - L.duckY) * e + Math.sin(S.a * 6) };
}

// ---- drawing ----------------------------------------------------------------------------------------------------------
function draw() {
  // the wall and the floor
  rect(0, 0, W, L.floor, '#1d2147');
  for (let y = 0; y < L.floor; y += 6) rect(0, y, W, 1, '#1a1e40');
  rect(0, L.floor, W, H - L.floor, '#2a1f2e');
  rect(0, L.floor, W, 1, '#3a2c3c');
  // the window: the night, the moon, a few stars, the town's lights
  rect(L.winX - 2, L.winY - 2, 72, 40, '#3b3462');
  rect(L.winX, L.winY, 68, 36, '#0e1236');
  for (const s of STARS) if (Math.sin(S.t * 2 + s.p) > -0.3) rect(s.x, s.y, 1, 1, '#e8ecff');
  // the moon, a crescent
  rect(L.winX + 51, L.winY + 4, 4, 1, '#f6f0c8'); rect(L.winX + 50, L.winY + 5, 2, 5, '#f6f0c8'); rect(L.winX + 51, L.winY + 10, 4, 1, '#f6f0c8');
  for (let i = 0; i < 10; i++) rect(L.winX + 3 + i * 7, L.winY + 26 - (i % 3) * 3, 5, 10 + (i % 3) * 3, '#151a40');
  for (let i = 0; i < 8; i++) if ((i * 7 + Math.floor(S.t / 3)) % 3) rect(L.winX + 5 + i * 8, L.winY + 29, 1, 1, '#ffd27a');
  rect(L.winX + 33, L.winY, 2, 36, '#3b3462'); rect(L.winX, L.winY + 17, 68, 2, '#3b3462');
  // the lamp's warm light over the desk
  const lx = L.deskX + 14;
  g.fillStyle = 'rgba(255,214,120,0.10)';
  g.beginPath(); g.moveTo(lx, L.deskTop - 28); g.lineTo(lx - 30, L.deskTop + 2); g.lineTo(lx + 70, L.deskTop + 2); g.closePath(); g.fill();
  // the desk
  rect(L.deskX - 2, L.deskTop, L.deskW + 4, 4, '#8a5a32');
  rect(L.deskX, L.deskTop + 4, L.deskW, 3, '#6a4224');
  rect(L.deskX + 4, L.deskTop + 7, 4, L.floor - L.deskTop - 7, '#5a3820');
  rect(L.deskX + L.deskW - 8, L.deskTop + 7, 4, L.floor - L.deskTop - 7, '#5a3820');
  // the lamp
  rect(lx - 1, L.deskTop - 3, 8, 3, '#3a3a4a'); rect(lx + 2, L.deskTop - 20, 2, 17, '#3a3a4a');
  rect(lx - 3, L.deskTop - 28, 10, 7, '#c9a227'); rect(lx - 2, L.deskTop - 21, 8, 1, '#ffe9a0');
  // the piles of papers: the applications
  const pile = (x, n) => { for (let i = 0; i < n; i++) rect(x + (i % 2), L.deskTop - 2 - i * 2, 14, 2, i % 3 ? '#f1ead6' : '#e3d8bd'); };
  pile(L.deskX + 2, 4); pile(L.deskX + Math.round(L.deskW * 0.55), 7);
  // the computer, its screen glowing
  rect(L.monX, L.monY, 50, 28, '#2c2c3a'); rect(L.monX + 2, L.monY + 2, 46, 22, '#0f2a1e');
  rect(L.monX + 2, L.monY + 2, 46, 22, `rgba(120,255,170,${(0.05 + 0.02 * Math.sin(S.t * 9)).toFixed(3)})`);
  rect(L.monX + 22, L.monY + 28, 6, 2, '#2c2c3a'); rect(L.monX + 16, L.monY + 30, 18, 2, '#2c2c3a');
  // the light from above, and the golden escalator
  if (S.mode === 'ascend') drawEscalator();
  // the duck, asleep or awake
  const d = duckAt(), awake = S.mode === 'ascend' && S.a > ASCEND.wake;
  if (!awake) {
    g.save(); g.translate(Math.round(d.x + 10), Math.round(d.y + 9)); g.rotate(0.32);
    g.drawImage(ASLEEP, -10, -9); g.restore();
  } else g.drawImage(AWAKE, Math.round(d.x), Math.round(d.y - 4));
  for (const z of S.zs) { const a = Math.max(0, 1 - z.age / 2.6); rect(z.x, z.y, 3, 1, `rgba(220,230,255,${a})`); rect(z.x + 2, z.y + 1, 1, 1, `rgba(220,230,255,${a})`); rect(z.x, z.y + 2, 3, 1, `rgba(220,230,255,${a})`); }
  for (const s of S.sparks) rect(s.x, s.y, 1, 1, `rgba(255,236,150,${1 - s.age})`);
  // white, as the duck reaches the sky
  if (S.mode === 'ascend' && S.a > ASCEND.top) rect(0, 0, W, H, `rgba(255,255,255,${Math.min(1, (S.a - ASCEND.top) / (ASCEND.white - ASCEND.top))})`);
  if (S.mode === 'gone') rect(0, 0, W, H, '#ffffff');
}
function drawEscalator() {
  const a = S.a, beam = Math.min(1, a / ASCEND.beam);
  // the beam of light from above the duck
  const bx = L.duckX - 4, bw = 30;
  for (let i = 0; i < 6; i++) rect(bx - i * 2, 0, bw + i * 4, L.deskTop, `rgba(255,240,180,${(0.05 * beam).toFixed(3)})`);
  // the escalator, coming down from the sky to the duck's side
  const k = Math.max(0, Math.min(1, (a - ASCEND.beam * 0.8) / (ASCEND.steps - ASCEND.beam * 0.8)));
  if (!k) return;
  const x0 = L.top.x, y0 = L.top.y, x1 = L.duckX - 2, y1 = L.deskTop - 2;
  const ex = x0 + (x1 - x0) * k, ey = y0 + (y1 - y0) * k;
  const len = Math.hypot(ex - x0, ey - y0), n = Math.floor(len / 5);
  for (let i = 0; i <= n; i++) {
    const f = (i / Math.max(1, n) + (a * 0.15) % (1 / Math.max(1, n))) % 1;   // the steps moving up
    const x = ex + (x0 - ex) * f, y = ey + (y0 - ey) * f;
    rect(x - 6, y, 12, 2, '#f2c94c'); rect(x - 6, y + 2, 12, 1, '#c9952a');
  }
  // its golden rails
  g.strokeStyle = '#ffe58a'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x0 - 7, y0 - 6); g.lineTo(ex - 7, ey - 6); g.moveTo(x0 + 7, y0 - 6); g.lineTo(ex + 7, ey - 6); g.stroke();
}

// ---- the words laid over the drawing: the computer's screen, the hint ---------------------------------------------------
function place() {
  const r = cv.getBoundingClientRect(), st = $('stage').getBoundingClientRect(), ox = r.left - st.left, oy = r.top - st.top;
  const sc = $('screen');
  sc.style.left = `${ox + (L.monX + 2) * K}px`; sc.style.top = `${oy + (L.monY + 2) * K}px`;
  sc.style.width = `${46 * K}px`; sc.style.height = `${22 * K}px`; sc.style.fontSize = `${Math.max(7, 3.5 * K)}px`;
  const h = $('hint');
  h.style.left = `${ox + (L.duckX + 10) * K}px`; h.style.top = `${oy + (L.duckY - 34) * K}px`;
}

// ---- input: the mouse alone (a touch on a phone) ------------------------------------------------------------------------
function logical(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / K, y: (e.clientY - r.top) / K }; }
const onDuck = (p) => p.x >= L.duckX - 4 && p.x <= L.duckX + 24 && p.y >= L.duckY - 6 && p.y <= L.duckY + 20;
cv.addEventListener('pointermove', (e) => cv.classList.toggle('over-duck', S.ready && S.mode === 'sleep' && onDuck(logical(e))));
cv.addEventListener('pointerdown', (e) => {
  if (sky.S.on) { sky.down(logical(e)); return; }
  if (!S.ready || S.mode !== 'sleep' || !onDuck(logical(e))) return;
  S.mode = 'ascend'; S.a = 0; $('hint').hidden = true; cv.classList.remove('over-duck');
});
// the sky (step 4): it takes the canvas once the duck is up; its card's button goes on fishing, or, at sunset, home
const toCss = (x, y) => { const r = cv.getBoundingClientRect(), st = $('stage').getBoundingClientRect(); return { x: r.left - st.left + x * K, y: r.top - st.top + y * K }; };
sky = makeSky(g, () => ({ W, H }), toCss);
addEventListener('pointerup', () => { if (sky && sky.S.on) sky.up(); });
addEventListener('pointercancel', () => { if (sky && sky.S.on) sky.up(); });
$('netBtn').addEventListener('click', () => sky.net());
$('autoSky').addEventListener('click', () => { sky.S.auto = !sky.S.auto; $('autoSky').textContent = `Auto: ${sky.S.auto ? 'on' : 'off'}`; });
$('baitSel').addEventListener('change', () => sky.bait($('baitSel').value));
$('ctBack').addEventListener('click', () => {
  sky.closeCard();
  if (sky.S.over) { sky.S.on = false; $('skyHud').hidden = true; $('signs').replaceChildren(); S.mode = 'sleep'; S.sparks = []; $('hint').hidden = false; $('screen').hidden = false; }
});

// the CV first (PLAN.md 9, part 2): asked once; a return goes straight to the duck, «My CV» asks again. Then, for one
// not signed in, the postcard (part 3); signed in, what they look for is kept with their account.
function ready() { S.ready = true; $('hint').hidden = false; $('mycv').hidden = false; corner(); }
async function corner() {
  const u = await user();
  $('who').hidden = !u; $('who').textContent = u ? `Signed in: ${u.email}` : '';
  $('signin').hidden = !!u;
  return u;
}
function asked(v) {
  user().then((u) => { if (u) { saveProfile(v); ready(); } else postcard(ready); });
}
function ask() { S.ready = false; $('hint').hidden = true; $('mycv').hidden = true; $('signin').hidden = true; begin(asked); }
$('mycv').addEventListener('click', ask);
$('signin').addEventListener('click', () => { $('signin').hidden = true; postcard(ready); });
if (me) { ready(); user().then((u) => { if (u) saveProfile(me); }); } else ask();

addEventListener('resize', fit);
fit();
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (sky.S.on) { sky.step(dt); sky.draw(); } else { step(dt); draw(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// ?debug: the scene's own hands, to try it where the page draws no frames
if (new URLSearchParams(location.search).has('debug')) {
  window.lobby = { S, L, sky, run(sec) { for (let i = 0; i < sec * 20; i++) step(0.05); draw(); return S.mode; },
    click() { S.mode = 'ascend'; S.a = 0; $('hint').hidden = true; } };
}
