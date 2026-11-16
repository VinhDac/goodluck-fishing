// THE LETTERS, CAUGHT BY A TAP (PLAN.md 18): the game's engine until the catch of plan 19 (js/letters.js, a cast, a wait,
// a bite, a one-button reel) is approved and takes its place; then this file goes.
//
// (PLAN.md 18; Vin, 15/11: «để làm những lá thư bay ... nên cho câu dễ hơn, chill hơn ... quan trọng nhất là
// chuyển động»). Every job found is a letter that flies up from its company's roof on two paper wings and keeps to the
// sky over the city: the better it fits, the higher it flies, up near the boat. Tap a letter and the duck casts to it: the
// hook takes it by its top, the duck reels it up and takes it in its beak. Nothing can go wrong; the play is in choosing.
// With AUTO on (it starts on) the duck catches the best one in the sky now and then by itself. A closed posting comes up
// stamped CLOSED; the gull, the postman, brings now and then a letter outside the titles that the CV fits.
//
// Motion is the point of it. Nothing jumps: every letter steers, easing toward where it wants to go, so a turn is an arc
// and a stop slows down; its wings beat faster climbing and rest in a glide now and then, and each beat lifts it a little.
// The rod is a spring (back, forward, a little past, settling); the hook hangs on a pendulum that the boat's bob and the
// rod's swing set going; a letter on the hook swings under it as it comes up. This file holds the state; js/sky.js draws.
//
// In the game (js/game.js) a morning is eight minutes of sun (dayLength): the sun crosses the sky and sets, and the
// morning is over. The game keeps the bag: each letter kept is handed to onBag, each put away (not for me, or closed) to
// onAway; a job already in the bag (known) never flies. Away from the sky (on the pier, in the office) nothing here moves:
// the game stops stepping it, and the letters the search finds meanwhile wait in the queue.

import { fitOf, sizeOf } from './lake.js';

const ROOM = { wide: 20, narrow: 12 };                               // letters in the sky at once
const SIZE = { gold: [13, 8], big: [13, 8], medium: [11, 7], small: [9, 6], unread: [9, 6] };
const CRUISE = { gold: 5.5, big: 6, medium: 7, small: 8, unread: 7.5 };   // art pixels a second, flying level
const T = { windup: 0.22, cast: 0.5, hook: 0.18, take: 0.45, closed: 1.9 };   // a catch, in seconds; the reel by its length
const EDGE = 16;                                                     // how near the side a letter turns round
const DAWN = 0.08, DUSK = 0.94;                                      // the hour the sky shows, at the start and at sunset
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);   // slow, quick, slow
const easeOut = (u) => 1 - (1 - u) ** 3;
const daysOld = (ms) => (Date.now() - ms) / 864e5;

export function makeLetters({ onCard, onSay, onBag, onAway, onCheck, onSunset } = {}) {
  const F = { on: false };
  let L = null, W = 384, H = 216, mine = new Set(), known = () => false;

  const order = (a, b) => (b.fit ?? -1) - (a.fit ?? -1) || b.posted - a.posted;
  const room = () => (W >= H ? ROOM.wide : ROOM.narrow);
  const kindOf = (j) => (j.size === 'gold' ? 'gold' : j.fit == null ? 'unread' : daysOld(j.posted) > 21 ? 'old' : 'plain');

  // ---- a morning out ----------------------------------------------------------------------------------------------------------
  // opts: skills (the CV's), lake (jobs at once), bottles (the gull's), auto, day (the hour, if the sun stands still),
  // dayLength (seconds of sun: then it moves, and sets), known (a job's id already in the bag), gullFirst, gullEvery
  function start(view, opts = {}) {
    L = view.L; W = view.W; H = view.H;
    mine = new Set(opts.skills || []);
    known = opts.known || (() => false);
    Object.assign(F, {
      on: true, over: false, t: 0, day: opts.day ?? DAWN, dayLength: opts.dayLength || 0, at: 0, speed: 14, waiting: true, found: 0, gold: 0,
      sky: [], queue: [], seen: new Set(), fx: [], bag: 0, next: null,
      line: null, auto: opts.auto ?? true, autoIn: 3, pending: null, releaseIn: 0.5, resort: 1.2,
      rod: { a: 0.42, va: 0, bend: 0, vb: 0, target: 0.42, bendTo: 0 },
      duck: { lean: 0, vl: 0, leanTo: 0, look: 0 },
      hook: { x: 0, y: 0, th: 0.2, vth: 0, mode: 'idle' }, tipLast: null, tipV: 0,
      sip: { in: rand(6, 10), k: 0, on: false, age: 0 },
      gull: null, gullIn: opts.gullFirst ?? 40, gullEvery: opts.gullEvery ?? 80, bottles: (opts.bottles || []).slice(), drop: null,
    });
    const tip = rodTip();
    Object.assign(F.hook, { x: tip.x, y: tip.y + 16 });
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
  function setAuto(on) { F.auto = !!on; F.autoIn = 1.2; }
  function resize(w, h) { W = w; H = h; for (const l of F.sky || []) { l.x = clamp(l.x, 8, W - 8); l.home = homeOf(l.job); } }

  // ---- the boat, the duck and its rod: where each is now ------------------------------------------------------------------------
  const boatY = () => L.boat.y + Math.sin(F.t * 1.6) * 1.2;          // it rides its cloud
  const breath = () => Math.sin(F.t * 0.9) * 0.35;
  function duckAt() { return { x: L.boat.x + 52 + F.duck.lean, y: boatY() - 9 + breath() }; }
  function handAt() { const d = duckAt(); return { x: d.x + 6, y: d.y - 10 }; }
  function rodTip() {
    const h = handAt(), a = F.rod.a + F.rod.bend * 0.9;
    return { x: h.x + Math.cos(a) * 30, y: h.y + Math.sin(a) * 30 };
  }
  const beak = () => { const d = duckAt(); return { x: d.x + 15, y: d.y - 18 }; };
  const takeAt = () => ({ x: L.boat.x + 82, y: boatY() - 2 });         // where a letter on the hook is handed over

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
  function release(job) {
    const roofs = (L.tops || []).filter((r) => r.x > W * 0.1 && r.x < W * 0.92 && r.y > L.top + 30);
    const rf = roofs.length ? roofs[Math.floor(Math.random() * roofs.length)] : { x: rand(W * 0.2, W * 0.85), y: L.bottom + 18 };
    const kind = kindOf(job), [w, h] = SIZE[job.size] || SIZE.small;
    const l = {
      job, kind, size: job.size, w, h, x: rf.x, y: rf.y - 3, vx: 0, vy: -8, dir: Math.random() < 0.5 ? -1 : 1,
      cruise: (CRUISE[job.size] || 7) * rand(0.85, 1.15), seed: Math.random() * 100, phase: Math.random(), rate: 4.5,
      glide: 0, glideIn: rand(2.5, 6), state: 'rise', age: 0, tag: 3.4, home: 0, chosen: false,
    };
    l.home = homeOf(job);
    F.sky.push(l);
    for (let i = 0; i < 5; i++) F.fx.push({ kind: 'dust', x: rf.x + rand(-4, 4), y: rf.y - 1, vx: rand(-6, 6), vy: rand(-6, -2), age: 0, life: rand(0.6, 1.1) });
  }
  function stock(dt) {
    if ((F.releaseIn -= dt) > 0 || !F.queue.length) return;
    const flying = F.sky.filter((l) => l.state !== 'leave').length;
    if (flying < room()) { release(F.queue.shift()); F.releaseIn = flying < 6 ? rand(0.35, 0.7) : rand(0.8, 1.5); return; }
    // the sky is full: a better letter waiting takes the place of the least of those flying, which flies off
    const worst = F.sky.filter((l) => l.state === 'fly' && !l.chosen).sort((a, b) => order(a.job, b.job)).pop();
    if (worst && order(F.queue[0], worst.job) < 0) {
      worst.state = 'leave'; worst.dir = worst.x < W / 2 ? -1 : 1;
      F.queue.push(worst.job); F.queue.sort(order);
      release(F.queue.shift());
    }
    F.releaseIn = 1.8;
  }

  // ---- a letter in flight: it steers, never turns on the spot -----------------------------------------------------------------------
  function fly(l, dt) {
    const t = F.t, sd = l.seed;
    let tvx = 0, tvy = 0, ax = 9, ay = 18;
    if (l.state === 'rise') {
      tvx = l.dir * 2.5; tvy = -26; ay = 34;
      if (l.y <= l.home + 12) l.state = 'fly';
    } else if (l.state === 'leave') {
      tvx = l.dir * 30; tvy = -4; ax = 14;
    } else if (l.state === 'wait') {                                  // chosen: it slows and hovers for the hook
      tvx = 0; tvy = 0; ax = 16; ay = 16;
    } else {
      if (l.x < EDGE && l.dir < 0) l.dir = 1; else if (l.x > W - EDGE && l.dir > 0) l.dir = -1;
      tvx = l.dir * (l.cruise + 1.6 * Math.sin(t * 0.37 + sd * 7.1));
      const alt = l.home + 6 * Math.sin(t * 0.19 + sd * 3.3) + 2.5 * Math.sin(t * 0.61 + sd * 9.7);
      tvy = clamp((alt - l.y) * 0.8, -9, 9) + (l.glide > 0 ? 1.6 : 0);  // a glide sinks a little
    }
    l.vx += clamp((tvx - l.vx) * 1.6, -ax, ax) * dt;
    l.vy += clamp((tvy - l.vy) * 2.4, -ay, ay) * dt;
    l.x += l.vx * dt; l.y += l.vy * dt;
    // the wings: quick climbing, easy flying level, still in a glide now and then
    const climbing = l.state === 'rise' || l.vy < -4;
    if (l.state === 'fly' && !climbing) {
      if (l.glide > 0) l.glide -= dt;
      else if ((l.glideIn -= dt) <= 0) { l.glide = rand(0.9, 1.8); l.glideIn = rand(3.5, 7); }
    } else l.glide = 0;
    const want = l.state === 'wait' ? 3.4 : climbing ? 4.6 : l.state === 'leave' ? 3.6 : l.glide > 0 ? 0 : 2.4;
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

  // ---- the hands: a tap on a letter ---------------------------------------------------------------------------------------------------
  function hit(p) {                                                     // the letter under a finger, if any
    if (!F.on || F.over) return null;
    let best = null, bd = 1e9;
    for (const l of F.sky) {
      if (l.state !== 'fly' && l.state !== 'rise') continue;
      const d = Math.hypot(l.x - p.x, l.y - p.y), r = Math.max(11, l.w * 0.95);   // a finger is big
      if (d < r && d < bd) { best = l; bd = d; }
    }
    return best;
  }
  function tap(p) {
    if (!F.on || F.over || F.pending) return false;
    const best = hit(p);
    if (!best) return false;
    if (F.line) { if (F.next) F.next.chosen = false; F.next = best; best.chosen = true; return true; }   // the next one, then
    begin(best, 'you');
    return true;
  }

  // ---- a catch: the windup, the cast, the hook, the reel, the duck taking it -----------------------------------------------------
  function begin(l, by) {
    l.state = 'wait'; l.chosen = true;
    F.line = { l, by, phase: 'windup', age: 0 };
    F.duck.look = 1;
    F.sip.on = false; F.sip.k = 0;
  }
  const hookPoint = (l) => ({ x: l.x, y: l.y - l.h / 2 - 1 });
  function catchStep(dt) {
    const k = F.line, l = k.l;
    k.age += dt;
    if (k.phase === 'windup') {                                       // the rod comes back, the duck leans back
      F.rod.target = -0.95; F.duck.leanTo = -0.8;                          // high over the shoulder
      if (k.age >= T.windup) { k.phase = 'cast'; k.age = 0; k.h0 = { x: F.hook.x, y: F.hook.y }; F.hook.mode = 'cast'; sound('swish'); }
      return;
    }
    if (k.phase === 'cast') {                                         // forward, a little past, settling; the hook flies
      F.rod.target = k.age < 0.12 ? 0.78 : 0.42; F.duck.leanTo = 1;
      // out quick and up a little, landing soft: from rest and to rest, so the hook never jumps
      const u = Math.min(1, k.age / T.cast), s = u * u * (3 - 2 * u), to = hookPoint(l), d = Math.hypot(to.x - k.h0.x, to.y - k.h0.y);
      F.hook.x = k.h0.x + (to.x - k.h0.x) * (1 - (1 - s) ** 2);
      F.hook.y = k.h0.y + (to.y - k.h0.y) * s - (8 + d * 0.07) * Math.sin(Math.PI * s);
      if (u >= 1) {
        k.phase = 'hook'; k.age = 0; l.state = 'hooked'; F.hook.mode = 'held';
        F.fx.push({ kind: 'tink', x: to.x, y: to.y, age: 0, life: 0.5 });
        for (let i = 0; i < 6; i++) F.fx.push({ kind: 'spark', x: to.x, y: to.y, vx: rand(-22, 22), vy: rand(-26, 4), age: 0, life: rand(0.35, 0.6), col: '#ffffff' });
        sound('clink');
        k.checked = undefined;
        if (onCheck && !l.job.bottle) Promise.resolve(onCheck(l.job)).then((v) => { k.checked = v; }, () => { k.checked = null; });
      }
      return;
    }
    if (k.phase === 'hook') {                                          // it struggles a moment, prettily
      F.rod.target = 0.42; F.rod.bendTo = 0.28; F.duck.leanTo = 0.3;
      l.rate = 7; l.phase += 7 * dt;
      const p = hookPoint(l); F.hook.x = p.x; F.hook.y = p.y;
      l.vx *= 0.9; l.vy *= 0.9;
      if (k.age >= T.hook) {
        k.phase = 'reel'; k.age = 0; k.p0 = { x: F.hook.x, y: F.hook.y };
        k.dur = 1.05 + Math.hypot(takeAt().x - k.p0.x, takeAt().y - k.p0.y) / 260;
        k.sw = { a: clamp(l.vx * 0.03, -0.5, 0.5), v: 0 }; k.hx = F.hook.x; k.hvx = 0; k.tick = 0;
      }
      return;
    }
    if (k.phase === 'reel') {                                          // up it comes, swinging under the hook
      F.rod.bendTo = 0.34; F.rod.target = 0.36; F.duck.leanTo = -0.2;
      const u = Math.min(1, k.age / k.dur), e = ease(u), to = takeAt();
      const hx = k.p0.x + (to.x - k.p0.x) * e, hy = k.p0.y + (to.y - k.p0.y) * e;
      const hvx = (hx - k.hx) / Math.max(dt, 1e-3), hax = (hvx - k.hvx) / Math.max(dt, 1e-3);
      k.hx = hx; k.hvx = hvx;
      // the pendulum: the letter, five pixels under the hook, swung by the hook's pull sideways
      k.sw.v += (-(150 / 6) * Math.sin(k.sw.a) - 2.4 * k.sw.v - (clamp(hax, -400, 400) / 6) * Math.cos(k.sw.a)) * dt;
      k.sw.a = clamp(k.sw.a + k.sw.v * dt, -0.9, 0.9);
      F.hook.x = hx; F.hook.y = hy;
      l.x = hx + Math.sin(k.sw.a) * 6; l.y = hy + Math.cos(k.sw.a) * 6 + l.h / 2 - 5;
      l.vx = 0; l.vy = 0; l.rate = 5.5 - 3 * u; l.phase += l.rate * dt;
      if ((k.tick -= dt) <= 0) { k.tick = 0.11; sound('reel'); }
      if (u >= 1) {
        if (k.checked === false) { k.phase = 'closed'; k.age = 0; l.state = 'closed'; F.hook.mode = 'idle'; resetHook(); return; }
        k.phase = 'take'; k.age = 0; k.from = { x: l.x, y: l.y }; F.hook.mode = 'idle'; resetHook();
      }
      return;
    }
    if (k.phase === 'take') {                                          // the rod lifts, the duck leans to it: into the beak
      F.rod.bendTo = 0; F.rod.target = 0.12; F.duck.leanTo = 1.3;
      const u = Math.min(1, k.age / T.take), b = beak(), e = ease(u);
      const c = { x: Math.max(k.from.x, b.x) + 3, y: Math.min(k.from.y, b.y) - 5 };
      l.x = (1 - e) * (1 - e) * k.from.x + 2 * (1 - e) * e * c.x + e * e * b.x;
      l.y = (1 - e) * (1 - e) * k.from.y + 2 * (1 - e) * e * c.y + e * e * b.y;
      l.rate = 1.5 * (1 - u); l.phase += l.rate * dt;
      if (u >= 1) landed(k);
      return;
    }
    if (k.phase === 'closed') {                                         // it opens: CLOSED, return to sender; it drops away
      F.rod.bendTo = 0; F.rod.target = 0.42; F.duck.leanTo = 0;
      l.open = Math.min(1, k.age / 0.5); l.stamp = k.age >= 0.55 ? Math.min(1, (k.age - 0.55) / 0.12) : 0;
      if (k.age >= 0.55 && !k.shook) { k.shook = true; F.fx.push({ kind: 'shake', age: 0, life: 0.25 }); sound('snap'); }
      if (k.age >= 1.25) { l.vy += 60 * dt; l.y += l.vy * dt; l.x += Math.sin(k.age * 6) * 12 * dt; l.alpha = clamp(1 - (k.age - 1.25) / 0.6, 0, 1); }
      if (k.age >= T.closed) {
        F.sky.splice(F.sky.indexOf(l), 1); F.line = null;
        if (onAway) onAway(l.job, 'expired');
        say(`${l.job.company} has closed that one. Return to sender: marked expired.`, 'duck', 3.5);
        after();
      }
    }
  }
  function landed(k) {
    const l = k.l, b = beak();
    F.sky.splice(F.sky.indexOf(l), 1);
    F.line = null; F.duck.leanTo = 0; F.duck.look = 0;
    F.fx.push({ kind: 'puff', x: b.x, y: b.y, age: 0, life: 0.5, r: 4 });
    const n = l.kind === 'gold' ? 14 : 6;
    for (let i = 0; i < n; i++) F.fx.push({ kind: 'spark', x: b.x, y: b.y, vx: rand(-30, 30), vy: rand(-38, -6), age: 0, life: rand(0.5, 0.9), col: l.kind === 'gold' ? (i % 2 ? '#ffd84a' : '#fff2b0') : '#ffffff' });
    sound(l.kind === 'gold' ? 'fanfare' : 'catch');
    if (k.by === 'you') { F.pending = l.job; onCard(l.job, { kind: l.kind, checked: k.checked }); }
    else { bagIt(l.job); say(`${l.kind === 'gold' ? 'A golden one! ' : ''}${l.job.title}, ${l.job.company}. In the bag.`, 'duck', 3.2); }
    after();
  }
  function after() {                                                    // a letter chosen meanwhile is next; else the duck rests
    F.autoIn = rand(3.5, 6);
    if (F.pending) return;                                              // its card first: the one chosen waits for the answer
    const n = F.next; F.next = null;
    if (n && F.sky.includes(n) && (n.state === 'fly' || n.state === 'rise')) begin(n, 'you');
    else if (n) n.chosen = false;
  }
  function bagIt(job) { F.bag++; if (onBag) onBag(job, F.bag); }
  function answer(keep) {                                               // the card's answer: Keep, or Not for me
    const j = F.pending; F.pending = null;
    if (j && keep) bagIt(j);
    else if (j && onAway) onAway(j, 'not_for_me');
    after();
  }
  // a job kept from the list (the bag's, not from the sky): out of the queue; its letter, if flying, flies off
  function kept(job) {
    if (!F.on) return;
    F.queue = F.queue.filter((j) => j.id !== job.id);
    for (const l of F.sky) {
      if (l.job.id !== job.id || (l.state !== 'fly' && l.state !== 'rise')) continue;
      l.state = 'leave'; l.dir = l.x < W / 2 ? -1 : 1;
      if (F.next === l) F.next = null;
      l.chosen = false;
    }
    F.bag++;
  }
  // in the middle of something: a catch, a card waiting, the gull's letter coming down or lying on the deck
  const busy = () => !!(F.line || F.pending || F.drop || (F.gull && F.gull.job));
  const left = () => F.sky.filter((l) => l.state !== 'leave').length + F.queue.length;   // still to catch: flying, and waiting
  function resetHook() {                                                // the hook back on its pendulum, from where it is: the line
    const tip = rodTip(), dx = F.hook.x - tip.x, dy = F.hook.y - tip.y;  // as long as it is now, let out to its length slowly
    F.hook.th = Math.atan2(dx, dy); F.hook.vth = 0; F.hook.len = Math.max(1, Math.hypot(dx, dy));
  }

  // ---- the rod, the duck's lean, the hook at rest: springs and a pendulum -----------------------------------------------------------
  function springs(dt) {
    const r = F.rod, d = F.duck;
    r.va += (260 * (r.target - r.a) - 2 * 0.45 * 16 * r.va) * dt; r.a += r.va * dt;
    r.vb += (180 * (r.bendTo - r.bend) - 2 * 0.5 * 13.4 * r.vb) * dt; r.bend += r.vb * dt;
    d.vl += (90 * (d.leanTo - d.lean) - 2 * 0.7 * 9.5 * d.vl) * dt; d.lean += d.vl * dt;
    if (!F.line) { r.target = 0.42 + Math.sin(F.t * 0.7) * 0.02; r.bendTo = 0; d.leanTo = 0; }
    const tip = rodTip();
    if (F.tipLast) {
      const v = (tip.x - F.tipLast.x) / Math.max(dt, 1e-3), a = (v - F.tipV) / Math.max(dt, 1e-3);
      F.tipV = v; F.tipA = clamp(a, -600, 600);
    }
    F.tipLast = tip;
    if (F.hook.mode === 'idle') {                                       // the hook hangs, sixteen pixels of line, swinging
      const h = F.hook;
      h.len = (h.len ?? 16) + (16 - (h.len ?? 16)) * Math.min(1, dt * 2.5);
      const len = Math.max(4, h.len);
      h.vth += (-(240 / len) * Math.sin(h.th) - 1.1 * h.vth - ((F.tipA || 0) / len) * Math.cos(h.th)) * dt;
      h.th = clamp(h.th + h.vth * dt, -2.6, 2.6);
      h.x = tip.x + Math.sin(h.th) * h.len; h.y = tip.y + Math.cos(h.th) * h.len;
    }
  }

  // ---- the duck by itself: the best letter in the sky, now and then; a sip of coffee between ------------------------------------
  function duck(dt, hold) {
    if (F.line || F.pending) return;
    if (F.auto && !hold && !F.over && (F.autoIn -= dt) <= 0) {
      const pick = F.sky.filter((l) => l.state === 'fly' && l.age > 2).sort((a, b) => order(a.job, b.job))[0];
      if (pick) { begin(pick, 'duck'); F.autoIn = rand(4.5, 7.5); return; }
      F.autoIn = 1;
    }
    const s = F.sip;
    if (!s.on && (s.in -= dt) <= 0) { s.on = true; s.age = 0; }
    if (s.on) {                                                         // up to the beak, a moment, down again
      s.age += dt;
      s.k = s.age < 0.6 ? easeOut(s.age / 0.6) : s.age < 1.6 ? 1 : s.age < 2.2 ? 1 - ease((s.age - 1.6) / 0.6) : 0;
      if (s.age >= 2.2) { s.on = false; s.k = 0; s.in = rand(9, 15); }
    }
  }

  // ---- the gull, the postman: in from the right with a letter, drops it on the deck, away up to the left -----------------------
  function gull(dt, hold) {
    if (!F.gull) {
      if (F.bottles.length && !hold && !F.over && !F.line && !F.pending && (F.gullIn -= dt) <= 0 && !F.drop) {
        const to = { x: L.boat.x + 22, y: L.boat.y - 64 };             // over the deck, clear of the mast
        // in low from the right, under the line of how the search goes, rising to the deck: never along the top edge
        F.gull = { phase: 'in', age: 0, job: { ...F.bottles.shift(), bottle: true }, from: { x: W + 24, y: L.boat.y - 40 }, to, c: { x: W * 0.55, y: L.boat.y - 70 }, x: W + 24, y: L.boat.y - 40, dir: -1, flap: 0 };
        F.gullIn = F.gullEvery;
      }
    } else {
      const gl = F.gull; gl.age += dt;
      const bez = (a, c, b, u) => ({ x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y });
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
      } else d.y = deck;                                                // on the deck, riding with the boat
      if (d.down && (F.auto || (!F.line && !F.pending))) {             // the duck takes it in; or, by hand, its card once none is open
        F.drop = null;
        if (F.auto) { bagIt(d.job); say(`From the gull: ${d.job.title}, ${d.job.company}. Not one of your titles, but your CV fits it. In the bag.`, 'gull', 4); }
        else { F.pending = d.job; onCard(d.job, { kind: 'gull' }); }
      }
    }
  }

  // ---- each moment --------------------------------------------------------------------------------------------------------------------
  // hold: a sheet is open over the sky (a card, the bag): the letters fly on, but the duck starts nothing and the sun waits
  function step(dt, hold = false) {
    if (!F.on) return;
    F.t += dt;
    if (F.dayLength && !hold && !F.over) {                              // the sun crosses the sky; it sets once nothing is on the go
      F.day = Math.min(DUSK, F.day + ((DUSK - DAWN) * dt) / F.dayLength);
      if (F.day >= DUSK && !busy()) { F.over = true; F.next = null; if (onSunset) onSunset(); }
    }
    F.speed = F.waiting ? 14 : F.speed * Math.exp(-dt * 0.45);         // the search done, the city slows, and stops
    if (F.speed < 0.05) F.speed = 0;
    F.at += F.speed * dt;
    if (!F.over) stock(dt);
    if ((F.resort -= dt) <= 0) {                                         // now and then a letter finds its height again
      F.resort = 1.2;
      const l = F.sky[Math.floor(Math.random() * F.sky.length)];
      if (l && l.state === 'fly') l.home = homeOf(l.job);
    }
    for (const l of F.sky.slice()) {
      if (l.state === 'hooked' || l.state === 'closed') continue;
      if (F.line && F.line.l === l && F.line.phase !== 'windup' && F.line.phase !== 'cast') continue;
      fly(l, dt);
      if (l.state === 'leave' && (l.x < -24 || l.x > W + 24)) F.sky.splice(F.sky.indexOf(l), 1);
    }
    apart(dt);
    springs(dt);
    if (F.line) catchStep(dt);
    duck(dt, hold);
    gull(dt, hold);
    for (const f of F.fx) { f.age += dt; if (f.vx != null) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.kind === 'dust' ? -4 : 50) * dt; f.vx *= 1 - dt * 2; } }
    F.fx = F.fx.filter((f) => f.age < f.life);
  }

  // ---- what js/sky.js draws ---------------------------------------------------------------------------------------------------------
  function view() {
    const tip = rodTip(), hand = handAt(), dk = duckAt(), k = F.line;
    const sag = !k ? 0.6 : k.phase === 'cast' ? 9 * (1 - Math.min(1, k.age / T.cast)) : k.phase === 'reel' || k.phase === 'hook' ? 0.3 : 1;
    const shake = F.fx.find((f) => f.kind === 'shake');
    return {
      t: F.t, day: F.day, at: F.at,
      boat: { x: L.boat.x, y: boatY() }, cloudY: L.boat.y + Math.sin(F.t * 1.1 + 0.6) * 0.8,
      duck: { x: dk.x, y: dk.y, look: F.duck.look, sip: F.sip.k },
      rod: { hand, a: F.rod.a, bend: F.rod.bend, tip },
      hook: { x: F.hook.x, y: F.hook.y }, sag,
      letters: F.sky, drop: F.drop, gull: F.gull, fx: F.fx,
      shake: shake ? (1 - shake.age / shake.life) : 0,
    };
  }
  // what is still in the sky and waiting to fly: the best first, each once
  function rest() {
    const seen = new Set();
    return [...(F.sky || []).map((l) => l.job), ...(F.queue || [])].filter((j) => !seen.has(j.id) && seen.add(j.id) && !j.bottle).sort(order);
  }
  const sounds = { fn: null };
  function sound(name) { if (sounds.fn) sounds.fn(name); }
  function say(text, who, secs) { if (onSay) onSay(text, who, secs); }

  return {
    F, start, feed, give, searchDone, setAuto, resize, step, hit, tap, answer, kept, busy, left, view, rest,
    onSound(fn) { sounds.fn = fn; }, stop() { F.on = false; F.line = null; F.pending = null; },
  };
}
