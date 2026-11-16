// THE LETTERS, AND CATCHING ONE (PLAN.md 18 and 19; Vin, 16/11: «tôi muốn chơi như chơi câu cá ở Stardew Valley ... cảm giác
// chill chill thư giãn ... bắt được cái gì hiếm tốt, thì có effect riêng»). Every job found is a letter that flies up from
// its company's roof and keeps to the sky over the city: the better it fits, the higher it flies, up near the boat.
// Catching one is a calm rhythm with a hand in it, one button the whole way:
//   cast: hold anywhere; a little arc over the duck fills and empties like a breath; let go, and the float flies toward the
//     finger, as far as the arc was full. Under the float hangs the bait: the CV, folded small.
//   wait: the float rides the wind; a letter comes round and sniffs the CV; the better it fits, the sooner it bites (in the
//     app this is when its posting is asked whether it is still up). A press while waiting winds the float back in.
//   bite: the float dips, a ring goes out through the air, «!» over the duck: a press within a second and a half sets the
//     hook. Too late, and the letter lets go, and comes round again.
//   reel: beside the boat a little panel of sky opens. The letter flutters up and down in it, each kind its own way; a
//     small cloud rises while the button is held and sinks when it is let go; the letter resting in the cloud fills the
//     ribbon, out of it the ribbon slowly empties. Full: it comes up. Empty: it slips off, flies a loop, comes back later.
//   show: the duck holds it up over its head, its name on a paper tag (the page writes it), and it goes into the mailbag
//     on the mast. How it shows is by how well it fits: a pip; one star; two; three, golden, the world slowing for half a
//     second; a rainbow for a dream company.
// A tap on the duck hands it the rod (it casts, waits, strikes and reels by itself, at its own pace); any other press takes
// the rod back. Nothing is ever lost: the play decides the order and the joy, never whether a job is on the list (PLAN.md 14).
//
// Motion as in plan 18: nothing jumps. Every letter steers and eases; the rod and the duck's lean are springs; the float
// hangs on a pendulum while the rod is idle, dips on a spring when something tugs at it; the panel's cloud has weight. This
// file holds the state; js/sky.js draws it.

import { fitOf, sizeOf } from './lake.js';

const ROOM = { wide: 20, narrow: 12 };                               // letters in the sky at once
const SIZE = { gold: [13, 8], big: [13, 8], medium: [11, 7], small: [9, 6], unread: [9, 6] };
const CRUISE = { gold: 5.5, big: 6, medium: 7, small: 8, unread: 7.5 };   // art pixels a second, flying level
const EDGE = 16;                                                     // how near the side a letter turns round
const DAWN = 0.08, DUSK = 0.94;                                      // the hour the sky shows, at the start and at sunset
const BREATH = 1.6;                                                  // seconds of the cast's arc: full, and empty again
const BITE = 1.5;                                                    // seconds to set the hook once it bites
const HANG = 14;                                                     // the float's line at rest, in art pixels
const SHOW = { 0: 1.4, 1: 1.5, 2: 1.7, 3: 2.3, legend: 2.8 };        // seconds the duck holds it up, by how well it fits
const TRACK = 84;                                                    // the reel panel's sky, art pixels high
export const PANEL = { w: 27, h: 90, track: TRACK, pad: 3, lane: 16, ribbon: 3 };   // the reel panel's measures
// how each kind of letter moves in the panel; how big the cloud is for it; how fast the ribbon fills and empties
const REEL = {
  plain: { zone: 28, fill: 0.2, drain: 0.1, k: 10, every: [1.2, 2.4], span: 30, rest: 0.35 },
  fresh: { zone: 26, fill: 0.19, drain: 0.11, k: 30, every: [0.45, 0.9], span: 14, rest: 0.1 },
  old: { zone: 30, fill: 0.22, drain: 0.09, k: 6, every: [2, 3.2], span: 22, rest: 0.2, sink: 6 },
  gold: { zone: 22, fill: 0.15, drain: 0.12, k: 14, dance: 16, freq: 0.6, darts: [1.5, 3], dartK: 45 },
  gull: { zone: 28, fill: 0.2, drain: 0.1, k: 5, feather: 24, freq: 0.3 },
};
REEL.unread = REEL.plain;
const CLOUD = { up: 150, down: 110, max: 70, damp: 1.2, bounce: 0.35 };   // the panel's cloud: art pixels a second (squared)
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);   // slow, quick, slow
const easeOut = (u) => 1 - (1 - u) ** 3;
const smooth = (u) => u * u * (3 - 2 * u);
const daysOld = (ms) => (Date.now() - ms) / 864e5;
const bez = (a, c, b, u) => ({ x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y });

// junk, now and then (PLAN.md 19.6 E): not a job, never counted; caught like a letter, tossed into the junk drawer
export const JUNK = {
  ball: 'A crumpled cover letter. Draft 34.', plane: 'A paper plane: somebody\'s CV, folded with care.',
  sock: 'A sock. With wings. Why not.', rejection: 'An old rejection letter. Mine. «We regret…»', boot: 'An old boot. Some things never change.',
};
export function makeLetters({ onSay, onBag, onAway, onCheck, onSunset, onHome, onShow, onJunk } = {}) {
  const F = { on: false };
  let L = null, W = 384, H = 216, mine = new Set(), known = () => false, dream = new Set();

  const order = (a, b) => (b.fit ?? -1) - (a.fit ?? -1) || b.posted - a.posted;
  const room = () => (W >= H ? ROOM.wide : ROOM.narrow);
  const kindOf = (j) => (j.size === 'gold' ? 'gold' : j.fit == null ? 'unread' : daysOld(j.posted) > 21 ? 'old' : 'plain');
  // how it shows when it comes up: a dream company's above all; then three stars from the mark, two, one, none
  const tierOf = (j) => (dream.has(String(j.company || '').toLowerCase()) ? 'legend' : j.fit == null ? 0 : j.fit >= 70 ? 3 : j.fit >= 55 ? 2 : j.fit >= 40 ? 1 : 0);
  const reelKind = (l) => (l.job.bottle ? 'gull' : l.kind === 'gold' ? 'gold' : daysOld(l.job.posted) < 1 ? 'fresh' : l.kind === 'old' ? 'old' : l.kind === 'unread' ? 'unread' : 'plain');

  // ---- a morning out ----------------------------------------------------------------------------------------------------------
  // opts: skills (the CV's), lake (jobs at once), bottles (the gull's), auto (the duck has the rod), day (the hour, if the sun
  // stands still), dayLength (seconds of sun: then it moves, and sets), known (a job's id already in the bag), dream (company
  // names: their letters are legends), gullFirst, gullEvery, season (winter, spring, summer, autumn: the real month's),
  // weather (quiet: few new jobs today, a mist and a shower; busy: many, a clear sky; fair)
  function start(view, opts = {}) {
    L = view.L; W = view.W; H = view.H;
    mine = new Set(opts.skills || []);
    known = opts.known || (() => false);
    dream = new Set((opts.dream || []).map((c) => String(c).toLowerCase()));
    Object.assign(F, {
      on: true, over: false, t: 0, day: opts.day ?? DAWN, dayLength: opts.dayLength || 0, at: 0, speed: 14, waiting: true, found: 0, gold: 0,
      sky: [], queue: [], seen: new Set(), fx: [], bag: 0, bagPuff: 0, stamps: 0, met: new Set(), checks: new Map(),
      auto: !!opts.auto, autoIn: 2.5, releaseIn: 0.5, resort: 1.2, holding: false, press: null, missed: 0,
      line: null, held: null, show: null, tag: null, showId: 0, bang: null, scale: 1, slow: 0, sag: 0.6, boatDx: 0, homing: null, arriving: { age: 0 },
      rod: { a: 0.42, va: 0, bend: 0, vb: 0, target: 0.42, bendTo: 0 },
      duck: { lean: 0, vl: 0, leanTo: 0, look: 0, hop: 0, cheer: false },
      float: { x: 0, y: 0, th: 0.2, vth: 0, len: HANG, mode: 'idle', dip: 0, vdip: 0 }, tipLast: null, tipV: 0, tipA: 0,
      sip: { in: rand(6, 10), k: 0, on: false, age: 0 },
      gull: null, gullIn: opts.gullFirst ?? 40, gullEvery: opts.gullEvery ?? 80, bottles: (opts.bottles || []).slice(), drop: null,
      season: opts.season || 'autumn', weather: opts.weather || 'fair', rain: 0, junkIn: rand(50, 80), junkN: 0,
    });
    const tip = rodTip();
    Object.assign(F.float, { x: tip.x, y: tip.y + HANG });
    for (const j of opts.lake || []) feed(j);
  }
  function feed(job) {
    if (!F.on || F.over || F.seen.has(job.id) || known(job.id)) return false;
    F.seen.add(job.id);
    const fit = job.fit !== undefined && !mine.size ? job.fit : fitOf(job.skills, mine);
    const j = { ...job, fit, size: sizeOf(fit) };
    const i = F.queue.findIndex((x) => order(j, x) < 0);
    F.queue.splice(i < 0 ? F.queue.length : i, 0, j);
    F.found++; if (j.size === 'gold') F.gold++;
    return true;
  }
  function give({ bottles } = {}) {                                    // the gull's letters, once they are read
    if (F.on && bottles) F.bottles.push(...bottles.filter((j) => !known(j.id)));
  }
  function searchDone() { F.waiting = false; }
  function setAuto(on) { F.auto = !!on; F.autoIn = 1.2; if (F.line) F.line.by = F.auto ? 'duck' : 'you'; }
  function resize(w, h) { W = w; H = h; for (const l of F.sky || []) { l.x = clamp(l.x, 8, W - 8); l.home = homeOf(l.job); } }

  // ---- the boat, the duck, its rod, the float: where each is now --------------------------------------------------------------
  const boatY = () => L.boat.y + Math.sin(F.t * 1.6) * 1.2;          // it rides its cloud
  const breath = () => Math.sin(F.t * 0.9) * 0.35;
  const boatX = () => L.boat.x + F.boatDx;                            // sailing in from the left, or back out to it
  function duckAt() { return { x: boatX() + 52 + F.duck.lean, y: boatY() - 9 + breath() - F.duck.hop }; }
  function handAt() { const d = duckAt(); return { x: d.x + 6, y: d.y - 10 }; }
  function rodTip() {
    const h = handAt(), a = F.rod.a + F.rod.bend * 0.9;
    return { x: h.x + Math.cos(a) * 30, y: h.y + Math.sin(a) * 30 };
  }
  const takeAt = () => ({ x: boatX() + 82, y: boatY() - 2 });         // where a letter on the line comes up to the boat
  const overHead = () => { const d = duckAt(); return { x: d.x + 3, y: d.y - 31 }; };   // held up in both wings
  const bagAt = () => ({ x: boatX() + 33, y: boatY() - 36 });         // the mailbag's mouth, on the mast
  const baitAt = () => ({ x: F.float.x + Math.sin(F.t * 1.3) * 0.8, y: F.float.y + F.float.dip + 7 });
  function panelAt() { return L.wide ? { x: Math.round(L.boat.x + 104), y: 10 } : { x: W - PANEL.w - 6, y: 22 }; }
  function onDuck(p) { const d = duckAt(); return p.x > d.x - 14 && p.x < d.x + 17 && p.y > d.y - 27 && p.y < d.y + 4; }

  // ---- the sky's heights: the better a letter fits, against the others in the sky now, the higher it flies ------------------
  function rankOf(j) {
    if (j.fit == null) return 0.2;
    const set = F.sky.filter((l) => l.state !== 'leave').map((l) => l.job);
    set.push(...F.queue.slice(0, Math.max(0, room() - set.length)));
    if (!set.includes(j)) set.push(j);
    const fits = set.map((x) => x.fit).filter((x) => x != null);
    if (fits.length < 2) return 0.5;
    const below = fits.filter((x) => x < j.fit).length, same = fits.filter((x) => x === j.fit).length;
    return clamp((below + same / 2) / (fits.length - 1), 0, 1);
  }
  function homeOf(j) {
    let k = rankOf(j);
    if (j.size === 'gold') k = Math.max(k, 0.85);
    return L.bottom - (L.bottom - L.top) * (0.1 + 0.8 * k);
  }

  // ---- stocking: a letter flies up from its company's roof ------------------------------------------------------------------------
  function takeOff(job) {
    const roofs = (L.tops || []).filter((r) => r.x > W * 0.1 && r.x < W * 0.92 && r.y > L.top + 30);
    const rf = roofs.length ? roofs[Math.floor(Math.random() * roofs.length)] : { x: rand(W * 0.2, W * 0.85), y: L.bottom + 18 };
    const kind = kindOf(job), [w, h] = SIZE[job.size] || SIZE.small;
    const l = {
      job, kind, size: job.size, w, h, x: rf.x, y: rf.y - 3, vx: 0, vy: -8, dir: Math.random() < 0.5 ? -1 : 1,
      cruise: (CRUISE[job.size] || 7) * rand(0.85, 1.15), seed: Math.random() * 100, phase: Math.random(), rate: 4.5,
      glide: 0, glideIn: rand(2.5, 6), state: 'rise', age: 0, tag: 3.4, home: 0, shy: 0,
      fresh: daysOld(job.posted) < 1,
    };
    l.home = homeOf(job);
    F.sky.push(l);
    for (let i = 0; i < 5; i++) F.fx.push({ kind: 'dust', x: rf.x + rand(-4, 4), y: rf.y - 1, vx: rand(-6, 6), vy: rand(-6, -2), age: 0, life: rand(0.6, 1.1) });
  }
  function junkFly(dt) {                                              // now and then a bit of junk drifts up among the letters
    if (F.over || F.sky.some((l) => l.job.junk) || (F.junkIn -= dt) > 0 || !F.sky.length) return;
    const kinds = Object.keys(JUNK), kind = kinds[Math.floor(Math.random() * kinds.length)];
    const job = { id: `junk:${++F.junkN}`, title: JUNK[kind], company: '', junk: kind, fit: null, size: 'small', posted: Date.now() };
    const roofs = (L.tops || []).filter((r) => r.x > W * 0.15 && r.x < W * 0.9), rf = roofs.length ? roofs[Math.floor(Math.random() * roofs.length)] : { x: W * 0.6, y: L.bottom + 10 };
    const l = { job, kind: 'junk', size: 'small', w: 9, h: 6, x: rf.x, y: rf.y - 3, vx: 0, vy: -8, dir: Math.random() < 0.5 ? -1 : 1, cruise: 6, seed: Math.random() * 100,
      phase: Math.random(), rate: 4, glide: 0, glideIn: 4, state: 'rise', age: 0, tag: 0, home: L.bottom - (L.bottom - L.top) * rand(0.2, 0.6), shy: 0 };
    F.sky.push(l);
    F.junkIn = rand(90, 140);
  }
  function stock(dt) {
    if ((F.releaseIn -= dt) > 0 || !F.queue.length) return;
    const flying = F.sky.filter((l) => l.state !== 'leave' && !l.job.junk).length;
    if (flying < room()) { takeOff(F.queue.shift()); F.releaseIn = flying < 6 ? rand(0.35, 0.7) : rand(0.8, 1.5); return; }
    // the sky is full: a better letter waiting takes the place of the least of those flying, which flies off
    const worst = F.sky.filter((l) => l.state === 'fly' && !l.job.junk).sort((a, b) => order(a.job, b.job)).pop();
    if (worst && order(F.queue[0], worst.job) < 0) {
      worst.state = 'leave'; worst.dir = worst.x < W / 2 ? -1 : 1;
      F.queue.push(worst.job); F.queue.sort(order);
      takeOff(F.queue.shift());
    }
    F.releaseIn = 1.8;
  }

  // ---- a letter in flight: it steers, never turns on the spot -----------------------------------------------------------------------
  function fly(l, dt) {
    const t = F.t, sd = l.seed;
    let tvx = 0, tvy = 0, ax = 9, ay = 18;
    if (l.shy > 0) l.shy -= dt;
    if (l.state === 'rise') {
      tvx = l.dir * 2.5; tvy = -26; ay = 34;
      if (l.y <= l.home + 12) l.state = 'fly';
    } else if (l.state === 'leave') {
      tvx = l.dir * 30; tvy = -4; ax = 14;
    } else if (l.state === 'suitor') {                                // round the bait, nosing at the CV; in at the bite
      const k = F.line, b = baitAt();
      if (k && k.phase === 'bite') { tvx = clamp((b.x - l.x) * 7, -30, 30); tvy = clamp((b.y + 2 - l.y) * 7, -30, 30); ax = 80; ay = 80; }
      else {
        l.orbit += l.spin * dt;
        l.ring = Math.max(8, l.ring - dt * 1.4);
        let ox = b.x + Math.cos(l.orbit) * l.ring, oy = b.y + 2 + Math.sin(l.orbit) * l.ring * 0.55;
        if (k && k.nose > 0) { const u = Math.sin(Math.PI * (1 - k.nose / 0.5)); ox += (b.x - ox) * u * 0.85; oy += (b.y + 2 - oy) * u * 0.85; }
        const far = Math.hypot(ox - l.x, oy - l.y) > 30;                 // on its way: quicker; there: round and round
        tvx = clamp((ox - l.x) * 2.4, far ? -40 : -16, far ? 40 : 16); tvy = clamp((oy - l.y) * 2.4, far ? -40 : -16, far ? 40 : 16); ax = far ? 60 : 36; ay = far ? 60 : 36;
      }
    } else {
      if (l.x < EDGE && l.dir < 0) l.dir = 1; else if (l.x > W - EDGE && l.dir > 0) l.dir = -1;
      tvx = l.dir * (l.cruise + 1.6 * Math.sin(t * 0.37 + sd * 7.1));
      const alt = l.home + 6 * Math.sin(t * 0.19 + sd * 3.3) + 2.5 * Math.sin(t * 0.61 + sd * 9.7);
      tvy = clamp((alt - l.y) * 0.8, -9, 9) + (l.glide > 0 ? 1.6 : 0);  // a glide sinks a little
    }
    l.vx += clamp((tvx - l.vx) * 1.6, -ax, ax) * dt;
    l.vy += clamp((tvy - l.vy) * 2.4, -ay, ay) * dt;
    l.x += l.vx * dt; l.y += l.vy * dt;
    if (l.state === 'suitor' && Math.abs(l.vx) > 0.5) l.dir = l.vx > 0 ? 1 : -1;
    // the wings: quick climbing, easy flying level, still in a glide now and then
    const climbing = l.state === 'rise' || l.vy < -4;
    if (l.state === 'fly' && !climbing) {
      if (l.glide > 0) l.glide -= dt;
      else if ((l.glideIn -= dt) <= 0) { l.glide = rand(0.9, 1.8); l.glideIn = rand(3.5, 7); }
    } else l.glide = 0;
    const want = l.state === 'suitor' ? (F.line && F.line.phase === 'bite' ? 7 : 3) : climbing ? 4.6 : l.state === 'leave' ? 3.6 : l.glide > 0 ? 0 : 2.4;
    l.rate += (want - l.rate) * Math.min(1, dt * 4);
    l.phase += l.rate * dt;
    l.age += dt; if (l.tag > 0) l.tag -= dt;
  }
  function apart(dt) {                                                // letters keep a little room between them
    const free = F.sky.filter((l) => l.state === 'fly' || l.state === 'rise');
    for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
      const a = free[i], b = free[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = (a.w + b.w) / 2 + 7;
      if (d >= min || d < 0.01) continue;
      const push = ((min - d) / min) * 14 * dt, ux = dx / d, uy = dy / d;
      a.vx -= ux * push; a.vy -= uy * push * 1.5; b.vx += ux * push; b.vy += uy * push * 1.5;
    }
  }
  function letGo(l, shy) { if (l && (l.state === 'suitor' || l.state === 'hooked')) { l.state = 'fly'; l.shy = shy; } }

  // ---- the hands: one button the whole way ----------------------------------------------------------------------------------------------
  function press(p) {
    if (!F.on || F.over || F.homing || F.arriving) return false;
    const k = F.line;
    if (!k && !F.show && onDuck(p)) { F.press = { duck: true, at: F.t }; return true; }      // the duck: a tap hands it the rod
    if (F.auto) { F.auto = false; if (k) k.by = 'you'; say('Your rod.', 'duck', 1.4); }        // any other press takes it back
    if (!k) {
      if (F.show || (F.drop && F.drop.down)) return false;
      F.line = { phase: 'charge', t: 0, power: 0, aim: { x: p.x, y: p.y }, by: 'you' };
      return true;
    }
    if (k.phase === 'wait') { windIn(k); return true; }
    if (k.phase === 'bite') { strike(k); return true; }
    if (k.phase === 'reel') { F.holding = true; return true; }
    return false;
  }
  function release(p) {
    F.holding = false;
    const k = F.line, pr = F.press; F.press = null;
    if (pr && pr.duck) { if (!k && F.t - pr.at < 0.45 && (!p || onDuck(p))) handOver(); return; }
    if (k && k.phase === 'charge' && k.by === 'you') cast(k);
  }
  function move(p) { const k = F.line; if (k && k.phase === 'charge' && k.by === 'you') k.aim = { x: p.x, y: p.y }; }
  function handOver() {
    F.auto = !F.auto; F.autoIn = 1.2; sound('clink');
    say(F.auto ? 'My rod? Fine. Have a coffee, I will fish.' : 'Your rod. Hold anywhere, let go to cast.', 'duck', 2.6);
  }
  const hovering = (p) => !F.line && !F.show && onDuck(p);            // the duck under the pointer, to be tapped

  // ---- cast: the arc fills and empties like a breath; let go and the float flies ------------------------------------------------
  function landing(k) {                                                // where the float will come down, from the arc and the aim
    const tip = rodTip(), u = 0.3 + 0.7 * k.power;
    return { x: clamp(tip.x + (k.aim.x - tip.x) * u, 12, W - 12), y: clamp(tip.y + (k.aim.y - tip.y) * u, L.top - 8, L.bottom - 2) };
  }
  function cast(k) {
    const to = landing(k), from = { x: F.float.x, y: F.float.y };
    Object.assign(k, { phase: 'cast', age: 0, from, to, dur: 0.45 + Math.hypot(to.x - from.x, to.y - from.y) / 420 });
    F.float.mode = 'cast';
    sound('swish');
  }
  function windIn(k) {                                                 // nothing yet, and a press: the float comes home
    letGo(k.suitor, 2);
    F.line = null; F.bang = null;
    homeFloat();
    after(0.6);
  }
  function homeFloat() {                                               // back on its pendulum from where it is: the line wound in
    const tip = rodTip(), fl = F.float, dx = fl.x - tip.x, dy = fl.y + fl.dip - tip.y;
    fl.mode = 'idle'; fl.y += fl.dip; fl.dip = 0; fl.vdip = 0;
    fl.th = Math.atan2(dx, dy); fl.len = Math.max(1, Math.hypot(dx, dy));
    fl.vth = clamp(((fl.vx || 0) * Math.cos(fl.th) - (fl.vy || 0) * Math.sin(fl.th)) / fl.len, -6, 6);   // swinging on as it was going
  }

  // ---- the wait, the bite, the strike -------------------------------------------------------------------------------------------------
  function pickSuitor() {                                              // the letters near, the better fits likelier, come round
    const b = baitAt(), near = F.sky.filter((l) => l.state === 'fly' && !(l.shy > 0) && l.age > 1);
    if (!near.length) return null;
    const ws = near.map((l) => { const d = Math.hypot(l.x - b.x, l.y - b.y), f = l.job.fit ?? 30; return Math.max(0.02, ((f + 10) / 110) ** 2) / (1 + (d / 45) ** 2); });
    let r = Math.random() * ws.reduce((a, w) => a + w, 0);
    for (let i = 0; i < near.length; i++) { r -= ws[i]; if (r <= 0) return near[i]; }
    return near[0];
  }
  function court(k, s) {
    const b = baitAt();
    Object.assign(s, { state: 'suitor', orbit: Math.atan2(s.y - b.y, s.x - b.x), spin: (Math.random() < 0.5 ? -1 : 1) * rand(1.3, 1.9), ring: 18 });
    const fit = clamp(((s.job.fit ?? 30) - 20) / 60, 0, 1);
    Object.assign(k, { suitor: s, arrived: false, circle: 0.8 + (1 - fit) * 2.6 + rand(0, 0.8), sniffs: 0, nose: 0, since: 0 });
    if (onCheck && !s.job.bottle && !s.job.junk && !F.checks.has(s.job.id)) {         // the app asks its posting meanwhile: still up?
      F.checks.set(s.job.id, undefined);
      Promise.resolve(onCheck(s.job)).then((v) => F.checks.set(s.job.id, v), () => F.checks.set(s.job.id, null));
    }
  }
  function waitStep(k, dt) {
    k.age += dt;
    const s = k.suitor;
    if (!s || !F.sky.includes(s) || s.state !== 'suitor') {
      k.suitor = null;
      if ((k.look -= dt) <= 0) { k.look = 0.6; const n = pickSuitor(); if (n) court(k, n); }
      return;
    }
    const b = baitAt();
    k.since += dt;
    if (!k.arrived && (Math.hypot(s.x - b.x, s.y - b.y) < 22 || (k.since > 3.5 && Math.hypot(s.x - b.x, s.y - b.y) < 40))) { k.arrived = true; k.sniffAt = [k.circle * 0.55, k.circle * 0.2]; }
    if (!k.arrived) return;
    const was = k.circle; k.circle -= dt;
    for (const at of k.sniffAt) if (was > at && k.circle <= at) { k.nose = 0.5; k.nudge = true; }
    if (k.nose > 0) { k.nose -= dt; if (k.nudge && k.nose < 0.25) { k.nudge = false; F.float.vdip += 26; sound('nibble'); } }
    const asked = !F.checks.has(s.job.id) || F.checks.get(s.job.id) !== undefined || k.circle < -6;
    if (k.circle <= 0 && asked) bite(k);
  }
  function bite(k) {
    Object.assign(k, { phase: 'bite', age: 0, react: rand(0.25, 0.6) });
    F.float.vdip += 95;
    F.bang = { age: 0 };
    const b = baitAt();
    for (let i = 0; i < 2; i++) F.fx.push({ kind: 'ring', x: b.x, y: b.y - 6, age: -i * 0.18, life: 0.9, r: 15 });
    sound('bite');
  }
  function biteStep(k, dt) {
    k.age += dt;
    if (F.bang) F.bang.age += dt;
    if (Math.random() < dt * 5) F.float.vdip += 12;                    // it tugs
    if (k.by === 'duck' && k.age >= k.react) return strike(k);
    if (k.age >= BITE) {                                               // too late: it lets go, and comes round again
      letGo(k.suitor, 3);
      Object.assign(k, { phase: 'wait', suitor: null, look: rand(1.6, 3.2) });
      F.bang = null;
      if (!F.missed++) say('Missed it. No matter: it will come round again.', 'duck', 2.6);
    }
  }
  function strike(k) {                                                 // the hook is set: the panel of sky opens beside the boat
    const s = k.suitor, kind = reelKind(s), c = REEL[kind];
    s.state = 'hooked';
    Object.assign(k, {
      phase: 'reel', age: 0, kind, cfg: c, p: 0.25, pv: 0.25, p0: 0.25, open: 0, out: 0, tick: 0, in: true, got: false,
      cloud: { y: clamp(TRACK / 2 - 3 + 3 - c.zone / 2, 0, TRACK - c.zone), v: 0 },
      m: { y: TRACK / 2 - 3, v: 0, target: TRACK / 2 - 3, next: 0.9, base: TRACK / 2 - 3, dart: 0, t: 0 },
      stamp: null, stampIn: Math.random() < 0.35 ? rand(1.2, 3) : Infinity, b0: { x: s.x, y: s.y },
    });
    F.bang = null; F.holding = false;
    const fl = F.float; fl.mode = 'reel';                             // the float goes to the line: from where it is, easing over
    { const tip = rodTip(), top = { x: s.x, y: s.y - s.h / 2 }, dd = Math.max(0.01, Math.hypot(tip.x - top.x, tip.y - top.y)), up = Math.min(10, dd * 0.5) / dd;
      k.fo = { x: fl.x - (top.x + (tip.x - top.x) * up), y: fl.y + fl.dip - (top.y + (tip.y - top.y) * up) }; }
    fl.y += fl.dip; fl.dip = 0; fl.vdip = 0;
    F.rod.va -= 7;                                                     // the rod jerks up
    const b = baitAt();
    for (let i = 0; i < 5; i++) F.fx.push({ kind: 'spark', x: b.x, y: b.y, vx: rand(-20, 20), vy: rand(-24, 2), age: 0, life: rand(0.3, 0.5), col: '#ffffff' });
    sound('strike');
  }

  // ---- the reel: one button; the cloud has weight, the letter its own way of moving -------------------------------------------------
  function moveLetter(k, dt) {
    const c = k.cfg, m = k.m, bot = TRACK - 6;
    m.t += dt;
    let target, K = c.k;
    if (k.kind === 'gold') {                                           // a dance, and now and then a dart somewhere else
      if ((m.next -= dt) <= 0) { m.base = rand(10, bot - 10); m.next = rand(...c.darts); m.dart = 0.4; }
      if (m.dart > 0) { m.dart -= dt; K = c.dartK; }
      target = m.base + Math.sin(m.t * 2 * Math.PI * c.freq) * c.dance;
    } else if (k.kind === 'gull') {                                    // a feather: slow, wide, easy
      target = TRACK / 2 - 3 + Math.sin(m.t * 2 * Math.PI * c.freq) * c.feather + Math.sin(m.t * 1.7) * 3;
    } else {
      if ((m.next -= dt) <= 0) {
        if (Math.random() < c.rest) m.next = rand(0.6, 1.1);             // a rest: it stays where it is a moment
        else { m.target = clamp(m.y + rand(-c.span, c.span), 0, bot); m.next = rand(...c.every); }
      }
      if (c.sink) m.target = Math.min(bot, m.target + c.sink * dt);     // the old ones sink, lazily
      target = m.target;
    }
    target = clamp(target, 0, bot);
    m.v += (K * (target - m.y) - 2 * Math.sqrt(K) * m.v) * dt;
    m.y = clamp(m.y + m.v * dt, 0, bot);
  }
  function duckHolds(k) {                                              // the duck at the reel: a look a little ahead, a calm hand
    const c = k.cfg, cl = k.cloud, aim = k.m.y + 3 - c.zone / 2;
    const ahead = (a) => cl.y + cl.v * 0.22 + 0.5 * a * 0.0484;
    return Math.abs(ahead(-CLOUD.up) - aim) < Math.abs(ahead(CLOUD.down) - aim);
  }
  function reelStep(k, dt) {
    const s = k.suitor, c = k.cfg, cl = k.cloud;
    k.age += dt; k.open = Math.min(1, k.open + dt / 0.25);
    const hold = k.by === 'duck' ? duckHolds(k) : F.holding;
    cl.v += (hold ? -CLOUD.up : CLOUD.down) * dt;
    cl.v = clamp(cl.v * Math.exp(-CLOUD.damp * dt), -CLOUD.max, CLOUD.max);
    cl.y += cl.v * dt;
    if (cl.y > TRACK - c.zone) { cl.y = TRACK - c.zone; if (cl.v > 0) cl.v = -cl.v * CLOUD.bounce; }
    if (cl.y < 0) { cl.y = 0; if (cl.v < 0) cl.v = 0; }
    moveLetter(k, dt);
    const mid = k.m.y + 3;
    k.in = mid >= cl.y && mid <= cl.y + c.zone;
    if (k.in) k.p += c.fill * dt; else { k.p -= c.drain * dt; k.out += dt; }
    if (!k.stamp && (k.stampIn -= dt) <= 0) { k.stamp = { y: rand(8, TRACK - 14), k: 0, age: 0 }; k.stampIn = Infinity; }
    if (k.stamp) {                                                     // a stamp drifting through: the cloud on it a second, it is ours
      const st = k.stamp, on = st.y + 3 >= cl.y && st.y + 3 <= cl.y + c.zone;
      st.age += dt; st.k = clamp(st.k + (on ? dt : -dt / 2), 0, 1);
      if (st.k >= 1) {
        k.got = true; F.stamps++; k.stamp = null; sound('stamp');
        const pa = panelAt();
        for (let i = 0; i < 8; i++) F.fx.push({ kind: 'spark', x: pa.x + PANEL.pad + PANEL.lane / 2, y: pa.y + PANEL.pad + st.y + 3, vx: rand(-24, 24), vy: rand(-28, 4), age: 0, life: rand(0.4, 0.7), col: i % 2 ? '#ff8a70' : '#fff6c0' });
      } else if (st.age > 4.5) k.stamp = null;
    }
    k.pv += (k.p - k.pv) * Math.min(1, dt * 4);
    // the letter on the line, in the sky: from where it bit toward the boat as the ribbon fills, back out a little as it
    // empties; its sway and struggle coming in slowly, so it never jumps
    const to = takeAt(), u = clamp((k.pv - k.p0) / (1 - k.p0), -0.3, 1), e = u >= 0 ? smooth(u) : u, ramp = Math.min(1, k.age / 0.6);
    s.x = k.b0.x + (to.x - k.b0.x) * e + (Math.sin(F.t * 2.7) * 4 * (1 - e) + (k.in ? 0 : Math.sin(F.t * 17) * 1.2)) * ramp;
    s.y = k.b0.y + (to.y - k.b0.y) * e + Math.sin(F.t * 4.1) * 2 * (1 - e) * ramp;
    s.vx = 0; s.vy = 0; s.rate = k.in ? 5 : 8; s.phase += s.rate * dt; s.dir = to.x > s.x ? 1 : -1;
    const fade = Math.max(0, 1 - k.age / 0.4), e2 = fade * fade * (3 - 2 * fade);   // the float's way over to the line, done in 0.4 s
    const tip = rodTip(), top = { x: s.x, y: s.y - s.h / 2 }, dd = Math.max(0.01, Math.hypot(tip.x - top.x, tip.y - top.y)), up = Math.min(10, dd * 0.5) / dd;
    const on = { x: top.x + (tip.x - top.x) * up, y: top.y + (tip.y - top.y) * up };   // on the line, between the letter and the rod's tip
    F.float.x = on.x + k.fo.x * e2; F.float.y = on.y + k.fo.y * e2;
    F.rod.target = 0.3; F.rod.bendTo = 0.28 + (k.in ? 0 : 0.18) + Math.sin(F.t * 9) * 0.03; F.duck.leanTo = -0.35;
    if (k.in && hold !== undefined && (k.tick -= dt) <= 0) { k.tick = 0.1; sound('reel'); }
    if (k.p >= 1) land(k); else if (k.p <= 0) slip(k);
  }
  function slip(k) {                                                   // it slipped off: up and away, back later
    const s = k.suitor;
    if (s) { s.state = 'rise'; s.shy = 8; s.home = homeOf(s.job); s.vy = -12; }
    Object.assign(k, { phase: 'slip', age: 0 });
    homeFloat();
    say('It slipped off. It will be back.', 'duck', 2.2);
    sound('slip');
  }
  function land(k) {                                                   // up it comes: out of the sky, into the duck's wings
    const s = k.suitor;
    F.sky.splice(F.sky.indexOf(s), 1);
    s.state = 'held';
    F.held = s;
    Object.assign(k, { phase: 'land', age: 0, from: { x: s.x, y: s.y }, perfect: k.out < 0.12 });
    homeFloat();
    sound('pop');
  }
  function landStep(k, dt) {
    const s = k.suitor;
    k.age += dt; k.open = Math.max(0, k.open - dt / 0.2);
    const u = Math.min(1, k.age / 0.45), e = ease(u), to = overHead();
    const p = bez(k.from, { x: (k.from.x + to.x) / 2 + 6, y: Math.min(k.from.y, to.y) - 16 }, to, e);
    s.x = p.x; s.y = p.y; s.rate = 4 * (1 - u); s.phase += s.rate * dt;
    F.duck.leanTo = 0.2; F.rod.bendTo = 0.3 * (1 - e); F.rod.target = 0.3 + 0.12 * e;   // the rod unbends as the letter leaves it, not at once
    if (u < 1) return;
    if (F.checks.get(s.job.id) === false) { Object.assign(k, { phase: 'closed', age: 0 }); s.state = 'closed'; s.x = takeAt().x - 6; s.y = takeAt().y - 8; return; }
    F.line = null;
    showIt(s, { perfect: k.perfect, stamp: k.got });
  }

  // ---- the show: held up over the head, its tag, its light by how well it fits; then into the mailbag ---------------------------
  function showIt(l, { perfect = false, stamp = false } = {}) {
    const job = l.job, tier = job.junk ? 'junk' : tierOf(job), co = String(job.company || '').toLowerCase();
    const isNew = !!co && !job.junk && !F.met.has(co); if (co && !job.junk) F.met.add(co);
    if (onShow) onShow(job, { tier, perfect, stamp, isNew });
    l.state = 'held'; l.perfect = perfect;
    F.held = l;
    const dur = SHOW[tier] ?? 1.6;
    F.show = { id: ++F.showId, l, job, tier, age: 0, dur, stage: 'up' };
    F.tag = { id: F.show.id, job, tier, perfect, stamp, isNew, fresh: !job.junk && daysOld(job.posted) < 1, gull: !!job.bottle, junk: job.junk, age: 0, life: dur + 2.6 };
    F.duck.cheer = true; F.sip.on = false; F.sip.k = 0;
    const at = overHead(), spark = (n, cols, sp = 30) => { for (let i = 0; i < n; i++) F.fx.push({ kind: 'spark', x: at.x, y: at.y, vx: rand(-sp, sp), vy: rand(-sp - 8, -4), age: 0, life: rand(0.5, 0.9), col: cols[i % cols.length] }); };
    if (tier === 'junk') sound('slip');
    else if (tier === 0) sound('pip');
    else if (tier === 1) { sound('chime2'); spark(5, ['#ffffff']); }
    else if (tier === 2) { sound('chime3'); spark(8, ['#fff2b0', '#ffffff']); F.fx.push({ kind: 'glow', x: at.x, y: at.y, age: 0, life: 0.9, r: 22, col: '255,214,140' }); F.duck.hopIn = 0.6; }
    else {                                                             // golden (and a dream company's): the world slows for half a second
      sound(tier === 'legend' ? 'legend' : 'golden');
      F.slow = 0.5;
      spark(14, ['#ffd84a', '#fff2b0']);
      F.fx.push({ kind: 'rays', x: at.x, y: at.y, age: 0, life: 2.4 });
      F.fx.push({ kind: 'warm', age: 0, life: 1.8 });
      F.fx.push({ kind: 'glow', x: at.x, y: at.y, age: 0, life: 1.2, r: 34, col: '255,216,74' });
      for (let i = 0; i < 26; i++) F.fx.push({ kind: 'gold', x: at.x + rand(-46, 46), y: at.y - rand(6, 30), vx: rand(-3, 3), vy: rand(5, 12), age: -rand(0, 0.6), life: rand(2, 3.2), tw: rand(0, 6) });
      F.duck.hopIn = 0.8;
      if (tier === 'legend') { F.fx.push({ kind: 'rainbow', age: 0, life: 6 }); F.fx.push({ kind: 'flock', age: 0, life: 9, y: L.top - 40 + rand(-6, 6) }); }
    }
  }
  function showStep(dt) {
    const sh = F.show, l = sh.l;
    sh.age += dt;
    if (sh.stage === 'up') {
      const at = overHead(); l.x = at.x; l.y = at.y; l.rate = 0;
      if (sh.age >= sh.dur) { sh.stage = sh.job.junk ? 'toss' : 'bag'; sh.age = 0; sh.from = { x: l.x, y: l.y }; F.duck.cheer = false; sound('swish'); }
      return;
    }
    if (sh.stage === 'toss') {                                         // junk: over the side, tumbling, into the junk drawer
      const u = Math.min(1, sh.age / 1.1);
      l.x = sh.from.x - 30 * u; l.y = sh.from.y - 14 * Math.sin(Math.PI * Math.min(1, u * 1.4)) + 60 * u * u; l.alpha = 1 - Math.max(0, (u - 0.6) / 0.4);
      if (u < 1) return;
      F.held = null; F.show = null;
      if (onJunk) onJunk(sh.job.junk);
      after(rand(2, 3.5));
      return;
    }
    const u = Math.min(1, sh.age / 0.45), e = ease(u), to = bagAt();
    const p = bez(sh.from, { x: (sh.from.x + to.x) / 2 - 4, y: Math.min(sh.from.y, to.y) - 12 }, to, e);
    l.x = p.x; l.y = p.y; l.small = u > 0.4;
    if (u < 1) return;
    F.held = null; F.show = null;
    F.bagPuff = 1;
    bagIt(l.job);
    sound('rustle');
    after(rand(2.5, 4.5));
  }
  function closedStep(k, dt) {                                         // it opens at the boat: CLOSED, return to sender; it drops away
    const l = k.suitor;
    k.age += dt;
    l.open = Math.min(1, k.age / 0.5); l.stamp = k.age >= 0.55 ? Math.min(1, (k.age - 0.55) / 0.12) : 0;
    if (k.age >= 0.55 && !k.shook) { k.shook = true; F.fx.push({ kind: 'shake', age: 0, life: 0.25 }); sound('snap'); }
    if (k.age >= 1.25) { l.vy = (l.vy || 0) + 60 * dt; l.y += l.vy * dt; l.x += Math.sin(k.age * 6) * 12 * dt; l.alpha = clamp(1 - (k.age - 1.25) / 0.6, 0, 1); }
    if (k.age >= 1.9) {
      F.held = null; F.line = null;
      if (onAway) onAway(l.job, 'expired');
      say(`${l.job.company} has closed that one. Return to sender: marked expired.`, 'duck', 3.5);
      after(rand(2, 3.5));
    }
  }
  function bagIt(job) { F.bag++; if (onBag) onBag(job, F.bag); }
  function after(rest) { F.autoIn = rest; }

  // ---- back to the pier: the line wound in, the boat sails back the way it came, to the left, the city going by the other way;
  // and in again from the left when the person comes back to the same morning
  function goHome() {
    if (!F.on || F.homing) return false;
    const k = F.line;
    if (k && k.phase === 'land') return false;                         // a letter coming up: it lands first
    if (k) { if (k.suitor) letGo(k.suitor, 4); F.line = null; F.bang = null; homeFloat(); }
    F.holding = false; F.press = null;
    F.homing = { age: 0 }; F.arriving = null;
    return true;
  }
  function comeBack() { F.homing = null; F.arriving = { age: 0 }; F.boatDx = -(L.boat.x + 110); }
  function sailing(dt) {
    if (F.homing) {
      const h = F.homing; h.age += dt;
      F.boatDx -= dt * (14 + h.age * 46);
      if (h.age > 2.6 && !h.told) { h.told = true; if (onHome) onHome(); }
    } else if (F.arriving) {
      const a = F.arriving; a.age += dt;
      const u = Math.min(1, a.age / 2.4), from = a.from ?? (a.from = F.boatDx || -(L.boat.x + 110));
      F.boatDx = from * (1 - easeOut(u));
      if (u >= 1) { F.arriving = null; F.boatDx = 0; }
    }
  }

  // a job kept from the list (the bag's, not the sky's): out of the queue; its letter, if flying, flies off
  function kept(job) {
    if (!F.on) return;
    F.queue = F.queue.filter((j) => j.id !== job.id);
    for (const l of F.sky) {
      if (l.job.id !== job.id || (l.state !== 'fly' && l.state !== 'rise' && l.state !== 'suitor')) continue;
      if (F.line && F.line.suitor === l) { F.line.suitor = null; F.line.look = 0.6; }
      l.state = 'leave'; l.dir = l.x < W / 2 ? -1 : 1;
    }
    F.bag++;
  }
  // in the middle of something: a line out, a letter held up, the gull's letter coming down or lying on the deck
  const busy = () => !!(F.line || F.show || F.drop || (F.gull && F.gull.job) || F.homing);
  const left = () => F.sky.filter((l) => l.state !== 'leave' && !l.job.junk).length + F.queue.length;   // still to catch: flying, and waiting

  // ---- the rod, the duck's lean, the float: springs and a pendulum ----------------------------------------------------------------
  function springs(dt) {
    const r = F.rod, d = F.duck, fl = F.float;
    if (!F.line && !F.show) { r.target = 0.42 + Math.sin(F.t * 0.7) * 0.02; r.bendTo = 0; d.leanTo = 0; }
    if (F.show) { r.target = 0.6; r.bendTo = 0; d.leanTo = 0.3; }
    r.va += (260 * (r.target - r.a) - 2 * 0.45 * 16 * r.va) * dt; r.a += r.va * dt;
    r.vb += (180 * (r.bendTo - r.bend) - 2 * 0.5 * 13.4 * r.vb) * dt; r.bend += r.vb * dt;
    d.vl += (90 * (d.leanTo - d.lean) - 2 * 0.7 * 9.5 * d.vl) * dt; d.lean += d.vl * dt;
    if (d.hopIn > 0) { d.hopIn -= dt; d.hop = Math.abs(Math.sin((0.8 - d.hopIn) * Math.PI * 2.5)) * 2 * Math.min(1, d.hopIn * 3); } else d.hop = 0;
    const tip = rodTip();
    if (F.tipLast) {
      const v = (tip.x - F.tipLast.x) / Math.max(dt, 1e-3), a = (v - F.tipV) / Math.max(dt, 1e-3);
      F.tipV = v; F.tipA = clamp(a, -600, 600);
    }
    F.tipLast = tip;
    fl.vdip += (-120 * fl.dip - 2 * 0.35 * 11 * fl.vdip) * dt; fl.dip += fl.vdip * dt;   // a tug dips the float; it rights itself
    if (fl.mode === 'idle') {                                           // it hangs from the tip on its line, swinging
      fl.len += (HANG - fl.len) * Math.min(1, dt * 2.5);
      const len = Math.max(4, fl.len);
      fl.vth += (-(240 / len) * Math.sin(fl.th) - 1.1 * fl.vth - (F.tipA / len) * Math.cos(fl.th)) * dt;
      fl.th += fl.vth * dt; if (fl.th > Math.PI) fl.th -= 2 * Math.PI; else if (fl.th < -Math.PI) fl.th += 2 * Math.PI;   // round and round, never a jump
      fl.x = tip.x + Math.sin(fl.th) * fl.len; fl.y = tip.y + Math.cos(fl.th) * fl.len;
    }
  }

  // ---- the catch, each moment ----------------------------------------------------------------------------------------------------------
  function lineStep(dt) {
    const k = F.line, fl = F.float;
    if (k.phase === 'charge') {                                         // the arc: full and empty again, like a breath
      k.t += dt;
      k.power = 0.5 - 0.5 * Math.cos((2 * Math.PI * k.t) / BREATH);
      F.rod.target = -0.55 - 0.4 * k.power; F.rod.bendTo = 0; F.duck.leanTo = -0.4 - 0.45 * k.power; F.duck.look = 1;
      if (k.by === 'duck' && k.t >= BREATH / 2 - 0.02) cast(k);          // the duck lets go at the top of the breath
      return;
    }
    if (k.phase === 'cast') {                                           // forward, a little past, settling; the float flies
      k.age += dt;
      F.rod.target = k.age < 0.12 ? 0.78 : 0.42; F.duck.leanTo = 1;
      const u = Math.min(1, k.age / k.dur), sm = smooth(u), d = Math.hypot(k.to.x - k.from.x, k.to.y - k.from.y);
      fl.x = k.from.x + (k.to.x - k.from.x) * (1 - (1 - sm) ** 2);
      fl.y = k.from.y + (k.to.y - k.from.y) * sm - (8 + d * 0.07) * Math.sin(Math.PI * sm);
      if (u >= 1) {
        Object.assign(k, { phase: 'wait', age: 0, at: { ...k.to }, look: 0.4, suitor: null, seed: Math.random() * 10 });
        fl.mode = 'set';
        F.fx.push({ kind: 'puff', x: fl.x, y: fl.y + 3, age: 0, life: 0.5, r: 2 });
        F.fx.push({ kind: 'ring', x: fl.x, y: fl.y + 2, age: 0, life: 0.7, r: 9 });
        sound('plop');
      }
      return;
    }
    if (fl.mode === 'set') {                                            // on the wind: a slow drift, a bob
      F.rod.target = 0.36; F.rod.bendTo = 0.04; F.duck.leanTo = 0.15; F.duck.look = 1;
      const r = Math.min(1, (k.age || 0) / 0.8), rr = r * r * (3 - 2 * r);   // the drift and the bob come in as it settles
      fl.x = k.at.x + Math.sin(F.t * 0.45 + k.seed) * 2.5 * rr;
      fl.y = k.at.y + Math.sin(F.t * 2.1 + k.seed) * 1.2 * rr;
    }
    if (k.phase === 'wait') return waitStep(k, dt);
    if (k.phase === 'bite') return biteStep(k, dt);
    if (k.phase === 'reel') return reelStep(k, dt);
    if (k.phase === 'slip') { k.age += dt; k.open = Math.max(0, k.open - dt / 0.25); if (k.open <= 0) { F.line = null; after(rand(1.5, 3)); } return; }
    if (k.phase === 'land') return landStep(k, dt);
    if (k.phase === 'closed') return closedStep(k, dt);
  }

  // ---- the duck by itself: casts at the best letter now and then; a sip of coffee between --------------------------------------
  function duck(dt, hold) {
    const s = F.sip;
    if (!F.line && !F.show && F.auto && !hold && !F.over && !F.homing && !F.arriving && !(F.drop && F.drop.down) && (F.autoIn -= dt) <= 0) {
      const pick = F.sky.filter((l) => l.state === 'fly' && l.age > 2 && !l.job.junk).sort((a, b) => order(a.job, b.job))[0];
      if (pick) { F.line = { phase: 'charge', t: 0, power: 0, aim: { x: pick.x, y: pick.y - 6 }, by: 'duck' }; s.on = false; s.k = 0; return; }
      F.autoIn = 1;
    }
    const idle = !F.show && (!F.line || F.line.phase === 'wait');
    if (!idle) { s.on = false; s.k = Math.max(0, s.k - dt * 3); return; }
    if (!s.on && (s.in -= dt) <= 0) { s.on = true; s.age = 0; }
    if (s.on) {                                                         // up to the beak, a moment, down again
      s.age += dt;
      s.k = s.age < 0.6 ? easeOut(s.age / 0.6) : s.age < 1.6 ? 1 : s.age < 2.2 ? 1 - ease((s.age - 1.6) / 0.6) : 0;
      if (s.age >= 2.2) { s.on = false; s.k = 0; s.in = rand(9, 15); }
    }
    if (!F.line) F.duck.look = 0;
  }

  // ---- the gull, the postman: in low from the right with a letter, drops it on the deck; the duck holds it up ---------------
  function gull(dt, hold) {
    if (!F.gull) {
      if (F.bottles.length && !hold && !F.over && !F.line && !F.show && !F.homing && !F.arriving && (F.gullIn -= dt) <= 0 && !F.drop) {
        const to = { x: L.boat.x + 22, y: L.boat.y - 64 };             // over the deck, clear of the mast
        F.gull = { phase: 'in', age: 0, job: { ...F.bottles.shift(), bottle: true }, from: { x: W + 24, y: L.boat.y - 40 }, to, c: { x: W * 0.55, y: L.boat.y - 70 }, x: W + 24, y: L.boat.y - 40, dir: -1, flap: 0 };
        F.gullIn = F.gullEvery;
      }
    } else {
      const gl = F.gull; gl.age += dt;
      if (gl.phase === 'in') {
        const u = Math.min(1, gl.age / 2.8), p = bez(gl.from, gl.c, gl.to, easeOut(u));
        gl.x = p.x; gl.y = p.y; gl.flap += dt * (u < 0.55 ? 5 : u < 0.8 ? 1.2 : 7);
        if (u >= 1) { gl.phase = 'drop'; gl.age = 0; F.drop = { job: gl.job, x: gl.x - 1, y: gl.y + 4, vy: 0, age: 0, x0: gl.x - 1 }; gl.job = null; say('The gull brought you a letter!', 'gull', 2.5); }
      } else if (gl.phase === 'drop') {
        gl.flap += dt * 7; gl.y = gl.to.y - Math.sin(gl.age * 6) * 1.2;
        if (gl.age >= 0.45) { gl.phase = 'out'; gl.age = 0; gl.from = { x: gl.x, y: gl.y }; gl.c = { x: gl.x - 40, y: gl.y - 6 }; gl.to = { x: -30, y: L.boat.y - 96 }; }
      } else {
        const u = Math.min(1, gl.age / 2.6), p = bez(gl.from, gl.c, gl.to, u * u);
        gl.x = p.x; gl.y = p.y; gl.flap += dt * 5;
        if (u >= 1) F.gull = null;
      }
    }
    const d = F.drop;                                                   // the letter it let go: down to the deck, side to side
    if (d) {
      const deck = boatY() - 14;
      if (!d.down) {
        d.age += dt; d.vy = Math.min(16, d.vy + 30 * dt);
        d.y += d.vy * dt; d.x = d.x0 + Math.sin(d.age * 4.2) * 4 * Math.min(1, d.age * 2);
        if (d.y >= deck) { d.down = true; d.y = deck; F.fx.push({ kind: 'puff', x: d.x, y: deck + 2, age: 0, life: 0.5, r: 3 }); }
      } else d.y = deck;
      if (d.down && !F.line && !F.show) {                                // the duck picks it up and holds it up, like any other
        F.drop = null;
        const [w, h] = SIZE.small;
        showIt({ job: d.job, kind: 'plain', size: 'small', w, h, x: d.x, y: d.y, phase: 0, rate: 0, age: 9, airmail: true });
      }
    }
  }

  function weather(dt) {
    if (F.weather !== 'quiet') { F.rain = Math.max(0, F.rain - dt * 0.3); return; }
    const want = F.t > 75 && F.t < 120 ? 1 : 0;
    F.rain += (want - F.rain) * Math.min(1, dt * 0.35);
    if (!F.rained && F.t > 120 && F.rain < 0.3) { F.rained = true; F.fx.push({ kind: 'rainbow', age: 0, life: 14 }); say('The rain has stopped. A rainbow!', 'duck', 3); }
  }

  // ---- each moment --------------------------------------------------------------------------------------------------------------------
  // hold: a sheet is open over the sky: the letters fly on, but the duck starts nothing and the sun waits
  function step(dt, hold = false) {
    if (!F.on) return;
    const real = dt;
    if (F.slow > 0) F.slow -= real;                                     // a golden one: the world slows for half a second
    F.scale += ((F.slow > 0 ? 0.35 : 1) - F.scale) * Math.min(1, real * 10);
    dt *= F.scale;
    F.t += dt;
    if (F.dayLength && !hold && !F.over) {                              // the sun crosses the sky; it sets once nothing is on the go
      F.day = Math.min(DUSK, F.day + ((DUSK - DAWN) * dt) / F.dayLength);
      if (F.day >= DUSK && !busy()) { F.over = true; if (onSunset) onSunset(); }
    }
    if (F.homing) F.speed += (-18 - F.speed) * Math.min(1, dt * 1.5);   // sailing back: the city goes by the other way
    else if (F.waiting) F.speed += (14 - F.speed) * Math.min(1, dt * 1.5);
    else { F.speed *= Math.exp(-dt * 0.45); if (Math.abs(F.speed) < 0.05) F.speed = 0; }   // the search done, the city slows, and stops
    F.at += F.speed * dt;
    if (!F.over) { stock(dt); junkFly(dt); }
    weather(dt);
    if ((F.resort -= dt) <= 0) {                                         // now and then a letter finds its height again
      F.resort = 1.2;
      const l = F.sky[Math.floor(Math.random() * F.sky.length)];
      if (l && l.state === 'fly') l.home = homeOf(l.job);
    }
    for (const l of F.sky.slice()) {
      if (l.state === 'hooked') continue;
      fly(l, dt);
      if (l.state === 'leave' && (l.x < -24 || l.x > W + 24)) F.sky.splice(F.sky.indexOf(l), 1);
    }
    apart(dt);
    sailing(dt);
    springs(dt);
    if (F.line) lineStep(dt);
    if (F.show) showStep(dt);
    F.sag += (sagFor() - F.sag) * Math.min(1, dt * 5);                  // the line's slack eases from one moment to the next
    { const fl = F.float; if (fl.px != null && dt > 0) { fl.vx = (fl.x - fl.px) / dt; fl.vy = (fl.y - fl.py) / dt; } fl.px = fl.x; fl.py = fl.y; }
    if (F.tag && (F.tag.age += dt) > F.tag.life) F.tag = null;
    if (F.bagPuff > 0) F.bagPuff = Math.max(0, F.bagPuff - dt * 2.2);
    duck(dt, hold);
    gull(dt, hold);
    for (const f of F.fx) {
      f.age += dt;
      if (f.vx != null) { f.x += f.vx * dt; f.y += f.vy * dt; if (f.kind === 'gold') f.vx += Math.sin(F.t * 2 + f.tw) * 4 * dt; else { f.vy += (f.kind === 'dust' ? -4 : 50) * dt; f.vx *= 1 - dt * 2; } }
    }
    F.fx = F.fx.filter((f) => f.age < f.life);
  }

  function sagFor() {                                                  // how the line hangs: a long line out on the wind, a long loose curve
    const k = F.line, ph = k ? k.phase : '', tip = rodTip(), reach = Math.hypot(F.float.x - tip.x, F.float.y - tip.y);
    return !k ? 0.6 : ph === 'cast' ? 9 * (1 - Math.min(1, k.age / k.dur)) : ph === 'reel' ? 0.2 : ph === 'wait' ? 3 + reach * 0.09 : ph === 'bite' ? 1.5 + reach * 0.03 : 1;
  }

  // ---- what js/sky.js draws ---------------------------------------------------------------------------------------------------------
  function view() {
    const tip = rodTip(), hand = handAt(), dk = duckAt(), k = F.line, fl = F.float;
    const ph = k ? k.phase : '';
    const sag = F.sag;
    const shake = F.fx.find((f) => f.kind === 'shake');
    const reeling = k && (ph === 'reel' || ((ph === 'land' || ph === 'slip') && k.open > 0) || (ph === 'closed' && false));
    const on = k && (ph === 'reel' || ph === 'land') ? null : baitAt();
    return {
      t: F.t, day: F.day, at: F.at,
      boat: { x: boatX(), y: boatY() }, cloudY: L.boat.y + Math.sin(F.t * 1.1 + 0.6) * 0.8, halo: true,
      duck: { x: dk.x, y: dk.y, look: F.duck.look, sip: F.sip.k, cheer: F.duck.cheer },
      rod: { hand, a: F.rod.a, bend: F.rod.bend, tip },
      float: { x: fl.x, y: fl.y + fl.dip }, bait: on, sag,
      hooked: k && ph === 'reel' ? k.suitor : null,
      charge: k && ph === 'charge' ? { k: k.power, land: landing(k), by: k.by } : null,
      bang: F.bang,
      panel: reeling ? { ...panelAt(), ...PANEL, open: k.open, zone: k.cfg.zone, cloud: k.cloud.y, letter: k.m.y, kind: k.kind, flap: (k.suitor && k.suitor.phase) || 0,
        p: clamp(k.pv, 0, 1), in: k.in, stamp: k.stamp ? { y: k.stamp.y, k: k.stamp.k } : null, t: F.t } : null,
      letters: F.sky, held: F.held, drop: F.drop, gull: F.gull, fx: F.fx,
      shake: shake ? (1 - shake.age / shake.life) : 0,
      bag: { n: F.bag, puff: F.bagPuff, at: bagAt() },
      tag: F.tag ? { ...F.tag, at: overHead() } : null, season: F.season, rain: F.rain, mist: F.weather === 'quiet' ? 1 : 0,
      auto: F.auto,
    };
  }
  // what is still in the sky and waiting to fly: the best first, each once
  function rest() {
    const seen = new Set();
    return [...(F.sky || []).map((l) => l.job), ...(F.queue || [])].filter((j) => !seen.has(j.id) && seen.add(j.id) && !j.bottle && !j.junk).sort(order);
  }
  // for the page that tries it: a catch of a chosen kind shown at once, as if just reeled in (no box, no list)
  function tryShow(job, { closed = false, perfect = false } = {}) {
    if (!F.on || F.line || F.show) return false;
    const [w, h] = SIZE[job.size] || SIZE.small;
    const l = { job, kind: kindOf(job), size: job.size, w, h, x: takeAt().x, y: takeAt().y, phase: 0, rate: 0, age: 9, fresh: daysOld(job.posted) < 1, airmail: !!job.bottle };
    if (closed) {
      F.held = l; l.state = 'closed';
      F.line = { phase: 'closed', age: 0, suitor: l, by: 'you' };
      l.x -= 6; l.y -= 8;
      return true;
    }
    showIt(l, { perfect, stamp: false });
    return true;
  }
  const sounds = { fn: null };
  function sound(name) { if (sounds.fn) sounds.fn(name); }
  function say(text, who, secs) { if (onSay) onSay(text, who, secs); }

  return {
    F, start, feed, give, searchDone, setAuto, resize, step, press, release, move, hovering, kept, busy, left, view, rest, tryShow, tierOf, goHome, comeBack,
    onSound(fn) { sounds.fn = fn; }, stop() { F.on = false; F.line = null; F.show = null; },
  };
}
