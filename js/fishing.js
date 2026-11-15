// FISHING (PLAN.md 14, Vin, 15/11: «như 1 game câu cá thật sự có căn lực và bắt cá»): the clouds that are jobs drift by
// over the city as the boat sails. Hold to charge the cast (the power swings up and down: let go at the right moment),
// aimed where the pointer is; the float lands; a cloud that is hit takes its time, then bites («!»): press in time to
// hook it. Then the fight: hold to reel in, let go to ease the line; keep the tension in the green; the better the fit,
// the bigger and stronger the cloud, pulling in bursts. Landed, its card: Keep, or Throw back. Never punished: a cloud
// that snaps the line, gets away or is missed comes round again later today; at sunset the golden clouds not caught
// wash ashore into the bucket. The net, once a day, scoops the small ones. Now and then the plane drops a bottle: a job
// outside the person's titles that their CV still fits. The last minute is the golden hour. Auto fishes for the busy.

import { hash } from './pix.js';
import { add, has } from './box.js';
import { RADIUS, HOOKS } from './lake.js';
import { sfx } from './sound.js';

export const DAY = 420;                                              // seconds from morning to sunset: seven minutes
const GOLDEN = 60;                                                   // the last minute: the golden hour
const NET_KEY = 'glf.net';
const rand = (a, b) => a + Math.random() * (b - a);
const today = () => new Date().toLocaleDateString('en-CA');

export function makeFishing(px, { onCard, onSay, onSunset }) {
  const { R, P, ell, line, text, textW } = px;
  const F = { on: false };
  let W = 384, H = 216;

  // ---- a day out: the lake as read at the pier, the bait and the hook chosen there -------------------------------------
  function start(view, { lake, bottles, bait, hook, auto }) {
    W = view.W; H = view.H;
    const min = HOOKS[hook] ?? 0, fits = (j) => (min ? j.fit != null && j.fit >= min : true);
    const asks = (j) => (bait && j.skills && j.skills[bait] ? 1 : 0);
    Object.assign(F, {
      on: true, over: false, t: 0, day: 0, bait, hook, auto: !!auto,
      lake: lake.filter((j) => fits(j) && !has(j.id)).sort((a, b) => asks(b) - asks(a) || (b.fit ?? -1) - (a.fit ?? -1) || b.posted - a.posted),
      later: [], clouds: [], bottles: bottles.slice(), bottle: null, bottlesDropped: 0,
      cast: null, charging: null, aim: { x: W * 0.6, y: H * 0.3 }, holding: false,
      caught: 0, spawnIn: 0.4, golden: false, autoWait: 1.5,
      netUsed: (() => { try { return localStorage.getItem(NET_KEY) === today(); } catch (e) { return false; } })(),
    });
    for (let i = 0; i < 3; i++) { spawn(); const c = F.clouds[F.clouds.length - 1]; if (c) c.x = W * (0.5 + i * 0.17); }   // a few already in sight
    const n = F.lake.length + F.clouds.length;
    onSay(n ? `${n} cloud${n === 1 ? '' : 's'} out there today${bait ? `, the ${bait} ones first` : ''}. Hold to charge, let go to cast.` : 'The sky is quiet today: no new clouds for you. Come back tomorrow.');
  }
  const SHOWN = () => (W >= H ? 6 : 5);
  const band = () => [H * 0.10, H * (W >= H ? 0.46 : 0.40)];        // where clouds float: over the city, under the top
  function spawn() {
    if (F.clouds.length >= SHOWN()) return;
    let job;
    if (F.golden) { const i = F.lake.findIndex((j) => j.size === 'gold'); if (i >= 0) job = F.lake.splice(i, 1)[0]; }
    if (!job) job = F.lake.shift() || (F.later.length && F.t > (F.later[0].back || 0) ? F.later.shift() : null);
    if (!job) return;
    const [y0, y1] = band(), r = RADIUS[job.size];
    F.clouds.push({ job, r, x: W + r + 4, y: rand(y0 + r, y1 - r), v: rand(6, 9) * (W >= H ? 1 : 0.7), bob: rand(0, 6), shake: 0 });
  }
  const back = (job) => F.later.push({ ...job, back: F.t + 25 });     // it comes round again, in a while

  // ---- the rod's tip, given by the scene each frame ---------------------------------------------------------------------
  let tip = { x: 60, y: 60 };
  const range = () => Math.hypot(W, H) * 0.85;
  const landing = (power) => {
    const dx = F.aim.x - tip.x, dy = F.aim.y - tip.y, d = Math.hypot(dx, dy) || 1;
    return { x: tip.x + (dx / d) * power * range(), y: tip.y + (dy / d) * power * range() };
  };
  const powerAt = (age) => { const k = (age / 0.8) % 2; return k < 1 ? k : 2 - k; };   // up and down, 0.8 s each way

  // ---- the hands: press, let go, move -------------------------------------------------------------------------------------
  function down(p) {
    if (!F.on || F.over || F.auto) return;
    F.holding = true; F.aim = p;
    const k = F.cast;
    if (!k && F.bottle && Math.hypot(p.x - F.bottle.x, p.y - F.bottle.y) < 9) { const job = F.bottle.job; F.bottle = null; card(job, 'bottle'); return; }
    if (!k) { if (!F.charging) F.charging = { age: 0 }; return; }   // a second finger does not start the power again
    if (k.phase === 'bite') return hook(k);
  }
  function move(p) { if (F.on) F.aim = p; }
  function up() {
    if (!F.on) return;
    F.holding = false;
    if (F.charging && !F.cast) { const power = Math.max(0.08, powerAt(F.charging.age)); F.charging = null; throwLine(power); }
  }
  function throwLine(power) {
    const to = landing(power);
    F.cast = { phase: 'fly', age: 0, fly: 0.35 + power * 0.35, from: { ...tip }, to, hit: null };
    sfx('swish');
  }
  function hook(k) {
    k.phase = 'fight'; k.age = 0; k.ten = 0.35; k.prog = 0.05; k.burst = 0; k.next = rand(0.6, 1.2);
    k.from = { x: k.hit.x, y: k.hit.y };
    if (!F.auto) onSay(k.hit.job.size === 'gold' ? 'A golden one! Hold to reel, let go when it pulls.' : 'Hooked! Hold to reel in, keep the line in the green.');
  }

  // ---- each moment ---------------------------------------------------------------------------------------------------------
  const PULL = { small: 0.22, medium: 0.4, big: 0.6, gold: 0.82, unread: 0.36 };
  function step(dt, paused) {
    if (!F.on) return;
    F.t += dt;
    if (!paused && !F.over) {
      F.day = Math.min(1, F.day + dt / DAY);
      if (!F.golden && F.day >= 1 - GOLDEN / DAY) { F.golden = true; if (F.lake.some((j) => j.size === 'gold')) onSay('The golden hour: the golden clouds are rising.'); }
      if ((F.day >= 1 || (!F.lake.length && !F.later.length && !F.clouds.length && !F.cast && !F.bottle && !F.charging && F.t > 3)) && !F.pending) return sunset();
    }
    if (paused) return;
    if ((F.spawnIn -= dt) <= 0) { spawn(); F.spawnIn = rand(2.5, 5); }
    const k = F.cast;
    for (const c of F.clouds.slice()) {                                 // the clouds drift by, from right to left
      if (k && k.hit === c && k.phase !== 'fly') continue;
      c.x -= c.v * dt;
      if (c.x < -c.r - 6) { F.clouds.splice(F.clouds.indexOf(c), 1); back(c.job); }
    }
    if (F.charging) F.charging.age += dt;
    if (k) cast(k, dt);
    bottle(dt);
    if (F.auto) autoHand(dt);
  }
  function cast(k, dt) {
    k.age += dt;
    if (k.phase === 'fly') {
      if (k.age < k.fly) return;
      k.hit = F.clouds.find((c) => Math.hypot(c.x - k.to.x, c.y - k.to.y) <= c.r + 3) || null;
      if (!k.hit) { k.phase = 'back'; k.age = 0; sfx('splash'); onSay(F.auto ? '' : 'Splash: nothing there. Watch the marker on the line.'); return; }
      k.phase = 'wait'; k.age = 0; k.wait = rand(0.7, 2.0) * (F.bait && k.hit.job.skills && k.hit.job.skills[F.bait] ? 0.5 : 1);
      return;
    }
    if (k.phase === 'wait') {                                           // the float sits on the cloud; it takes its time
      k.hit.x -= k.hit.v * dt * 0.3;
      if (k.age >= k.wait) { k.phase = 'bite'; k.age = 0; k.window = k.hit.job.size === 'gold' ? 0.7 : 0.9; sfx('bite'); }
      return;
    }
    if (k.phase === 'bite') {                                           // «!»: press now
      k.hit.shake = 1;
      if (F.auto && k.age > 0.25) return hook(k);
      if (k.age >= k.window) { k.hit.shake = 0; k.phase = 'back'; k.age = 0; onSay('Too slow: it let go. It will come round again.'); }
      return;
    }
    if (k.phase === 'fight') return fight(k, dt);
    if (k.phase === 'back' && k.age >= 0.35) F.cast = null;             // the line wound back in
  }
  // THE FIGHT: holding reels in and tightens the line; letting go eases it and lets the cloud run a little. In a burst
  // the cloud pulls hard: hold through it and the line goes red and snaps.
  function fight(k, dt) {
    const c = k.hit, pull = PULL[c.job.size] ?? 0.4;
    if ((k.next -= dt) <= 0) { k.burst = k.burst ? 0 : 1; k.next = k.burst ? rand(0.5, 1.0) * (0.6 + pull) : rand(0.8, 1.8) * (1.4 - pull); }
    const reel = F.auto ? k.ten < (k.burst ? 0.42 : 0.66) : F.holding;
    if (reel) { k.prog += dt * 0.32 * (1 - k.burst * 0.7); k.ten += dt * (0.22 + pull * (k.burst ? 1.25 : 0.4)); }
    else { k.ten = Math.max(0, k.ten - dt * 0.7); k.prog -= dt * (0.025 + pull * (k.burst ? 0.12 : 0.04)); }
    if (k.ten < 0.12 && !reel) k.prog -= dt * 0.08;                      // a slack line: it slips away
    const e = Math.max(0, Math.min(1, k.prog));
    c.x = k.from.x + (tip.x + 6 - k.from.x) * e + (k.burst ? Math.sin(F.t * 30) * 1.5 : 0);
    c.y = k.from.y + (tip.y + 4 - k.from.y) * e;
    c.shake = k.burst;
    if (k.ten >= 1) { sfx('snap'); return lost(k, 'The line snapped! It swims off; it will come round again.'); }
    if (k.prog <= 0 && k.age > 1.2) return lost(k, 'It got away. It will come round again.');
    if (k.prog >= 1) landed(k);
  }
  function lost(k, said) {
    F.clouds.splice(F.clouds.indexOf(k.hit), 1); back(k.hit.job);
    F.cast = null; onSay(said);
  }
  function landed(k) {
    F.clouds.splice(F.clouds.indexOf(k.hit), 1);
    F.cast = null;
    if (F.auto) { keep(k.hit.job, 'caught'); onSay(`Caught: ${k.hit.job.title}, ${k.hit.job.company}.`); }
    else card(k.hit.job, 'caught');
  }
  function card(job, how) { F.pending = { job, how }; onCard(job, how); }
  // into the bucket; counted as caught only when it is new there and kept (thrown back is put away, not caught)
  function keep(job, how, status = 'new') { if (add(job, how === 'bottle' ? 'caught' : how, status) && status === 'new') F.caught++; }
  // the card's answer: Keep, or Throw back (not for me); either way the cloud is out of the sky
  function answer(keepIt) {
    const p = F.pending; F.pending = null;
    if (!p) return;
    keep(p.job, p.how, keepIt ? 'new' : 'not_for_me');
  }

  // ---- the net: once a day, every small cloud in sight and the next few in the lake ---------------------------------------
  function net() {
    if (!F.on || F.over || F.netUsed) return 0;
    const small = (j) => j.size === 'small' || j.size === 'unread';
    const inSight = F.clouds.filter((c) => small(c.job) && !(F.cast && F.cast.hit === c));
    inSight.forEach((c) => F.clouds.splice(F.clouds.indexOf(c), 1));
    const more = F.lake.filter(small).slice(0, Math.max(0, 8 - inSight.length));
    F.lake = F.lake.filter((j) => !more.includes(j));
    const got = [...inSight.map((c) => c.job), ...more];
    got.forEach((j) => keep(j, 'net'));
    F.netUsed = true; try { localStorage.setItem(NET_KEY, today()); } catch (e) { /* this visit alone */ }
    F.netSwing = 1;
    onSay(got.length ? `The net brought in ${got.length} small cloud${got.length === 1 ? '' : 's'}. They are in the bucket.` : 'Nothing small enough for the net in sight. It is used for today.');
    return got.length;
  }

  // ---- the bottle the plane drops: a job outside the titles that the CV still fits ---------------------------------------
  function bottle(dt) {
    const cycle = F.t % 90, k = cycle / 16;                             // the plane of js/voyage.js passes every 45 s; every other one drops
    if (!F.bottle && F.bottles.length && F.bottlesDropped < 3 && cycle > 7 && cycle < 7 + dt * 1.5 && !F.over) {
      const x = W + 60 - k * (W + 220);
      F.bottle = { job: F.bottles.shift(), x, y: 26, vy: 6, age: 0 };
      F.bottlesDropped++;
      onSay('The plane dropped a bottle! Press it before it falls into the city.');
    }
    const b = F.bottle;
    if (!b) return;
    b.age += dt; b.y += b.vy * dt; b.x -= 3 * dt;
    if (F.auto && b.age > 1) { F.bottle = null; keep(b.job, 'caught'); onSay(`From a bottle: ${b.job.title}, ${b.job.company}.`); return; }
    if (b.y > H * 0.62) F.bottle = null;                                 // into the city: gone (it was a bonus, never owed)
  }

  // ---- the duck fishing by itself ------------------------------------------------------------------------------------------
  function autoHand(dt) {
    if (F.cast || F.over || F.pending) return;
    if ((F.autoWait -= dt) > 0 || !F.clouds.length) return;
    F.autoWait = rand(0.8, 1.6);
    const best = F.clouds.filter((c) => c.x < W - 8).sort((a, b) => (b.job.fit ?? -1) - (a.job.fit ?? -1))[0];
    if (!best) return;
    F.aim = { x: best.x - best.v * 0.5, y: best.y };
    const d = Math.hypot(F.aim.x - tip.x, F.aim.y - tip.y);
    throwLine(Math.min(1, d / range()));
  }

  // ---- sunset: the golden clouds not caught wash ashore; the day's report -------------------------------------------------
  function sunset() {
    F.over = true; F.cast = null; F.charging = null;
    const left = [...F.clouds.map((c) => c.job), ...F.lake, ...F.later].filter((j) => j.size === 'gold' && !has(j.id));
    left.forEach((j) => add(j, 'ashore'));
    onSunset({ caught: F.caught, ashore: left.length });
  }

  // ---- drawing, over the sky ------------------------------------------------------------------------------------------------
  function draw(t, rodTip) {
    if (!F.on) return;
    tip = rodTip;
    const ctx = px.ctx;
    for (const c of F.clouds) {                                          // the clouds: their size the fit, gold the mark
      const shake = c.shake ? Math.round(Math.sin(t * 40) * 1.5) : 0, y = Math.round(c.y + Math.sin(t * 1.3 + c.bob) * 1.2);
      const old = Date.now() - c.job.posted > 14 * 864e5, fresh = Date.now() - c.job.posted < 864e5;
      if (c.job.size === 'gold') { ctx.globalCompositeOperation = 'lighter'; ell(c.x, y, c.r + 5, c.r * 0.7 + 4, 'rgba(255,200,80,0.18)'); ctx.globalCompositeOperation = 'source-over'; }
      ell(c.x + shake, y + c.r * 0.12, c.r + 2, c.r * 0.72 + 2, c.job.size === 'gold' ? '#a8701a' : '#7a84aa');      // an outline: a job's cloud, not the sky's
      px.lump(c.x + shake, y, c.r, c.job.size === 'gold' ? 'gold' : old ? 'old' : 'near');
      if (c.job.size === 'unread') text('?', c.x - 1, y - 3, '#8a90a8');
      if (fresh) for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; if (Math.sin(t * 6 + i * 3) > 0.2) P(c.x + Math.cos(a) * (c.r + 3), y + Math.sin(a) * (c.r * 0.6 + 2), '#ffffff'); }
    }
    const k = F.cast;
    if (F.charging && !k) {                                             // charging: the power swinging, the marker on the line
      const pw = powerAt(F.charging.age), to = landing(pw);
      for (let i = 1; i < 14; i++) { const e = i / 14; if (i % 2) P(tip.x + (to.x - tip.x) * e, tip.y + (to.y - tip.y) * e - Math.sin(Math.PI * e) * 10, 'rgba(255,255,255,0.8)'); }
      ell(to.x, to.y, 3, 2, 'rgba(255,255,255,0.5)'); R(to.x - 1, to.y - 1, 3, 3, '#e03a3a');
      gauge(tip.x - 36, tip.y - 6, pw, 'POWER');
    }
    if (k) {
      let fx, fy;
      if (k.phase === 'fly') { const e = Math.min(1, k.age / k.fly); fx = k.from.x + (k.to.x - k.from.x) * e; fy = k.from.y + (k.to.y - k.from.y) * e - Math.sin(Math.PI * e) * 22; }
      else if (k.phase === 'back') { const e = Math.min(1, k.age / 0.35), o = k.hit ? { x: k.hit.x, y: k.hit.y } : k.to; fx = o.x + (tip.x - o.x) * e; fy = o.y + (tip.y - o.y) * e; }
      else { fx = k.hit.x; fy = k.hit.y; }
      line(tip.x, tip.y, fx, fy, k.phase === 'fight' && k.ten > 0.85 ? '#ff8a7a' : 'rgba(255,255,255,0.9)');
      R(fx - 1, fy - 1 + (k.phase === 'wait' ? Math.round(Math.sin(t * 5)) : 0), 3, 3, '#e03a3a'); P(fx, fy - 2, '#ffffff');
      if (k.phase === 'bite') {                                          // «!», over the cloud
        const bx = Math.round(k.hit.x) - 3, by = Math.round(k.hit.y) - k.hit.r - 14;
        R(bx, by, 7, 10, '#fff8e7'); R(bx, by, 7, 1, '#3a2a1a'); R(bx, by + 9, 7, 1, '#3a2a1a'); R(bx + 3, by + 2, 1, 4, '#d03a2a'); R(bx + 3, by + 7, 1, 1, '#d03a2a');
      }
      if (k.phase === 'fight') tension(tip.x - 34, tip.y - 30, k);
    }
    if (F.bottle) {                                                      // the bottle, falling slowly under its little sail
      const b = F.bottle, x = Math.round(b.x), y = Math.round(b.y);
      line(x - 4, y - 8, x, y - 2, '#c8c8d4'); line(x + 4, y - 8, x, y - 2, '#c8c8d4'); ell(x, y - 9, 5, 2, '#fff8e7');
      R(x - 2, y - 2, 4, 7, 'rgba(120,200,160,0.85)'); R(x - 1, y - 4, 2, 2, '#8a5a32'); R(x - 1, y, 2, 3, '#f4efe2');
    }
  }
  function gauge(x, y, v, label) {                                       // the power: a bar that fills and empties
    R(x - 1, y - 1, 28, 7, '#1b1f3a'); R(x, y, 26, 5, '#3a3f6a');
    R(x, y, Math.round(26 * v), 5, v > 0.8 ? '#ffd84a' : '#7fe0a0');
    text(label, x, y - 7, '#fff8e7');
  }
  function tension(x, y, k) {                                            // the line's tension: green in the middle, red at the top
    const h = 30;
    R(x - 1, y - 1, 7, h + 2, '#1b1f3a'); R(x, y, 5, h, '#3a3f6a');
    R(x, y + h * 0.25, 5, h * 0.45, '#2e6a4a');                          // the green zone
    R(x, y, 5, h * 0.1, '#7a2a2a');                                      // the red
    const ten = Math.min(1, k.ten), ky = Math.round(y + h - h * ten);
    R(x - 2, ky - 1, 9, 2, ten > 0.9 ? '#ff5a4a' : ten < 0.25 ? '#c9d0ff' : '#ffffff');
    R(x + 8, y, 3, h, '#3a3f6a'); R(x + 8, y + h - Math.round(h * Math.max(0, k.prog)), 3, Math.round(h * Math.max(0, k.prog)), '#ffd84a');   // how far in
    text('LINE', x - 2, y - 7, '#fff8e7');
  }

  // the window changed shape at sea: the clouds kept inside the new band
  function resize(w, h) {
    W = w; H = h;
    if (!F.on) return;
    const [y0, y1] = band();
    for (const c of F.clouds) { c.y = Math.max(y0 + c.r, Math.min(y1 - c.r, c.y)); if (c.x > W + c.r + 4) c.x = W + c.r + 4; }
  }
  return { F, start, step, draw, down, up, move, net, answer, resize, stop() { F.on = false; } };
}
