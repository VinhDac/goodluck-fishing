// FISHING THE LAKE (PLAN.md 17; Vin, 15/11: «thả câu mà đợi ... câu từ dưới lên ... phần cho chơi chỉ là 1 phần nổi ... không
// thì cứ bật auto cho chạy từ đầu đến cuối ... xong thì popup kết quả»). The search fills the lake: each job found rises as a
// cloud-fish from its company's roof and swims at its depth (the better the fit, the bigger and the deeper; the golden ones
// near the roofs). The rod is the duck's while no hand is on it, and the person's the moment they press:
//   press on the lake: the bait is cast there and sinks to that depth; then one waits. A fish comes round the bait,
//   nibbles (the rod tip twitches: strike now and it takes fright), then bites («!»): press to strike. A fish too small for
//   the hook slips off. Holding reels in: with nothing on, the bait is brought back up; with a fish on, the line tightens
//   (let go when it pulls, or it snaps). Up at the boat the duck nets it, and its card turns up: Keep, or Throw back.
//   Press elsewhere on the lake, with nothing biting, and the bait goes there instead.
// Catching is real work too: a hooked fish's posting is asked whether it is still up; a closed one comes up an old boot,
// marked expired. Never punished: a fish lost comes round again. The gull steals a bait left too long near the top. The plane
// drops a bottle now and then: a job outside the titles that the CV fits. The last minute is the golden hour. The morning is
// done when the search is done and a dozen are in the bucket (the results then), and over at sunset; the golden ones not
// caught wash ashore. Drawn by js/deep.js, from view().

import { add, has } from './box.js';
import { HOOKS, fitOf, sizeOf } from './lake.js';
import { sfx } from './sound.js';

export const DAY = 480;                                              // seconds from morning to sunset: eight minutes
const GOLDEN = 60;                                                   // the last minute: the golden hour
const IDLE = 8;                                                      // seconds with no hand on the rod: the duck takes it again
const TARGET = 12;                                                   // in the bucket, with the search done: the morning's results
const NET_KEY = 'glf.net';
const RAD = { gold: 10, big: 8.5, medium: 7, small: 5.5, unread: 6 };
const PULL = { small: 0.22, medium: 0.4, big: 0.6, gold: 0.82, unread: 0.36, bottle: 0.05 };
const SPEED = { gold: 7, near: 10, old: 5, ghost: 6, bottle: 2 };
const rand = (a, b) => a + Math.random() * (b - a);
const today = () => new Date().toLocaleDateString('en-CA');
const daysOld = (ms) => (Date.now() - ms) / 864e5;
export const shortOf = (k) => {                                      // a skill on a jar's label, two or three letters
  const SHORT = { python: 'PY', pytorch: 'PT', tensorflow: 'TF', javascript: 'JS', typescript: 'TS', 'machine learning': 'ML', 'deep learning': 'DL',
    llms: 'LLM', llm: 'LLM', nlp: 'NLP', 'computer vision': 'CV', kubernetes: 'K8S', docker: 'DKR', react: 'RCT', golang: 'GO', go: 'GO' };
  const w = String(k || '').toLowerCase();
  return (SHORT[w] || (w.includes(' ') ? w.split(/\s+/).map((x) => x[0]).join('') : w.slice(0, 3))).toUpperCase().slice(0, 3);
};

export function makeFishing({ onCard, onSay, onSunset, onDone, onCheck }) {
  const F = { on: false };
  let L = null, W = 384, H = 216;                                    // the lake's layout, from js/deep.js
  let mine = new Set();

  // ---- the gear: the bait (a skill of the CV) and the hook (the smallest fit it holds) ----------------------------------------
  const order = (a, b) => {
    const asks = (j) => (F.bait && j.skills && j.skills[F.bait] ? 1 : 0);
    return asks(b) - asks(a) || (b.fit ?? -1) - (a.fit ?? -1) || b.posted - a.posted;
  };
  const hookable = (j) => { const min = HOOKS[F.hook] ?? 0; return !min || j.bottle || (j.fit != null && j.fit >= min); };
  function setGear(bait, hook) {
    if (bait != null) F.bait = bait;
    if (hook != null) F.hook = hook;
    if (F.queue) F.queue.sort(order);
  }

  // ---- a morning out --------------------------------------------------------------------------------------------------------
  function start(view, opts) {
    L = view.L; W = view.W; H = view.H;
    mine = new Set(opts.skills || []);
    Object.assign(F, {
      on: true, over: false, doneShown: false, t: 0, day: 0, golden: false,
      stream: !!opts.stream, waiting: true, citySpeed: 14,
      queue: [], pond: [], rising: [], seen: new Set(), bottles: (opts.bottles || []).slice(), bottleNext: 40,
      line: null, who: 'duck', touched: -99, holding: false, down: null, saidDuck: false,
      caught: 0, releaseIn: 0.3, autoWait: 2.5, puffs: [], sparks: [], shake: 0, boot: null, net: null, gullSteal: null,
      sonar: { read: 0, total: 0, found: 0, gold: 0, blips: [], what: opts.stream ? 'fleet' : 'store' },
      pending: null, checks: new Map(),
      netUsed: (() => { try { return localStorage.getItem(NET_KEY) === today(); } catch (e) { return false; } })(),
    });
    setGear(opts.bait || '', opts.hook || 'small');
    if (!F.stream) {                                                 // the web: the shared store, read at once; stocked as it lands
      for (const j of opts.lake || []) feed(j);
      setTimeout(() => { F.waiting = false; }, 6000);
    }
    onSay(F.stream ? 'The fleet is out. Each job it finds rises from its company\'s roof into the lake.' : 'Here we are. Watch the lake fill up.', 'duck');
  }

  // ---- a job found: weighed against the CV, into the queue in its place --------------------------------------------------------
  function feed(job) {
    if (!F.on || F.over || has(job.id) || F.seen.has(job.id)) return false;
    F.seen.add(job.id);
    const fit = fitOf(job.skills, mine), j = { ...job, fit, size: sizeOf(fit) };
    const i = F.queue.findIndex((x) => order(j, x) < 0);
    F.queue.splice(i < 0 ? F.queue.length : i, 0, j);
    const sn = F.sonar;
    sn.found++; if (j.size === 'gold') sn.gold++;
    sn.blips.push({ age: 0, depth: { gold: 0.85, big: 0.65, medium: 0.45, small: 0.25, unread: 0.3 }[j.size] ?? 0.4, gold: j.size === 'gold' });
    if (sn.blips.length > 40) sn.blips.shift();
    return true;
  }
  function fleetHome() { F.waiting = false; }

  // ---- the lake's depths: the better a fish fits, against today's others, the deeper it swims; the golden ones deepest ---------
  const room = () => (W >= H ? 30 : 20);                             // how many swim at once: the phone's lake is smaller
  function rankOf(j) {                                               // where its fit stands in the lake as it fills, 0 to 1:
    if (j.fit == null) return 0.25;                                  // those in it, and the next of the queue to take the room
    const set = [...F.pond.map((f) => f.job), ...F.rising.map((r) => r.job)];
    set.push(...F.queue.slice(0, Math.max(0, room() - set.length)));
    if (!set.includes(j)) set.push(j);
    const fits = set.map((x) => x.fit).filter((x) => x != null);
    if (fits.length < 2) return 0.5;
    const below = fits.filter((x) => x < j.fit).length, same = fits.filter((x) => x === j.fit).length;
    return Math.min(1, (below + same / 2) / (fits.length - 1));
  }
  function band(j) {
    const top = L.top + 4, bot = L.bottom - 6, span = bot - top;
    let k = rankOf(j);
    if (j.size === 'gold') k = Math.max(k, 0.85);
    if (F.golden && j.size === 'gold') k = 0.45;                      // the golden hour: the golden ones come up
    const c = top + span * (0.08 + 0.84 * k);
    return [Math.max(top, c - span * 0.1), Math.min(bot, c + span * 0.1)];
  }
  const kindOf = (j) => (j.bottle ? 'bottle' : j.size === 'gold' ? 'gold' : daysOld(j.posted) > 21 ? 'ghost' : daysOld(j.posted) > 14 ? 'old' : 'near');
  const clampX = (x) => Math.max(10, Math.min(W - 10, x));
  function retarget(f) {
    const [a, b] = band(f.job);
    f.tx = clampX(rand(12, W - 12)); f.ty = rand(a, b);
    if (f.tx < L.boat.x + 96 && f.ty < L.top + 18) f.ty = L.top + 18;
  }

  // ---- stocking: a job rises from its company's roof into the lake -------------------------------------------------------------
  function release(job) {
    const roofs = (L.tops || []).filter((r) => r.x > W * 0.12 && r.x < W * 0.94 && r.y > L.top + 20);
    const rf = roofs.length ? roofs[Math.floor(Math.random() * roofs.length)] : { x: rand(W * 0.2, W * 0.9), y: L.bottom + 20 };
    const [a, b] = band(job);
    F.rising.push({ job, x: rf.x, from: rf.y, y: rand(a, b), k: 0, r: RAD[job.size] || 6, name: job.company, dir: Math.random() < 0.5 ? -1 : 1, kind: kindOf(job) });
  }
  function stock(dt) {
    const free = room() - F.pond.length - F.rising.length;
    if ((F.releaseIn -= dt) > 0 || !F.queue.length) return;
    if (free > 0) { release(F.queue.shift()); F.releaseIn = F.pond.length < 8 ? rand(0.3, 0.6) : rand(0.6, 1.2); return; }
    // the lake is full: a better one still waiting takes the place of the least of those swimming, which swims off
    const worst = F.pond.filter((f) => f.state === 'swim' && f.kind !== 'bottle').sort((a, b) => order(a.job, b.job)).pop();
    if (worst && order(F.queue[0], worst.job) < 0) { worst.state = 'leave'; worst.tx = worst.x < W / 2 ? -30 : W + 30; F.queue.push(worst.job); F.queue.sort(order); release(F.queue.shift()); }
    F.releaseIn = 2;
  }

  // ---- the hands ------------------------------------------------------------------------------------------------------------
  const inLake = (p) => p.y > L.top - 6 && p.y < L.bottom + 10;
  function down(p) {
    if (!F.on || F.over || F.pending) return;
    F.touched = F.t;
    if (F.who === 'duck') { F.who = 'you'; onSay('Your rod.', 'duck', 1.5); }
    const k = F.line;
    F.down = { p, at: F.t };
    if (k && (k.phase === 'nibble' || k.phase === 'bite')) return strike(k);
    if (k && k.phase === 'fight') { F.holding = true; return; }
    if (!k) { if (inLake(p)) cast(p); return; }
    if (k.phase === 'wait' || k.phase === 'sink' || k.phase === 'come') {
      if (Math.hypot(p.x - k.bait.x, p.y - k.bait.y) > 40 && inLake(p)) {                 // fish elsewhere: a fish coming is let go
        if (k.suitor) { k.suitor.state = 'swim'; retarget(k.suitor); k.suitor = null; }
        k.phase = 'back'; k.age = 0; k.next = p; return;
      }
      F.holding = true;                                              // held: reel the bait back up; a tap: a twitch of the bait
    }
  }
  function up() {
    if (!F.on) return;
    const k = F.line, d = F.down;
    F.holding = false; F.down = null;
    if (k && d && F.t - d.at < 0.25 && (k.phase === 'wait' || k.phase === 'come')) jig(k);
  }
  function move() {}
  function jig(k) {                                                 // a tap with nothing on: the bait hops, and a fish near looks
    k.bait.y = Math.max(L.top + 4, k.bait.y - 5); puff(k.bait.x, k.bait.y, 2);
    const near = F.pond.filter((f) => f.state === 'swim' && Math.hypot(f.x - k.bait.x, f.y - k.bait.y) < 70);
    if (near.length && !k.suitor) { k.suitor = near[Math.floor(Math.random() * near.length)]; k.suitor.state = 'come'; k.phase = 'come'; k.age = 0; }
  }
  function cast(p) {
    const to = { x: clampX(p.x), y: Math.max(L.top + 6, Math.min(L.bottom - 4, p.y)) };
    F.line = { phase: 'fly', age: 0, from: { ...F.tip }, to, bait: { ...F.tip }, waited: 0, suitor: null };
    sfx('swish');
  }
  function strike(k) {
    const f = k.suitor;
    if (k.phase === 'nibble') {                                     // too soon: it takes fright
      f.state = 'flee'; f.flee = 2; f.tx = f.x + (f.x > k.bait.x ? 80 : -80); f.ty = f.y + rand(-10, 20);
      k.suitor = null; k.phase = 'wait'; k.waited = 0;
      return onSay('Too soon! It took fright. Wait for the bite.', 'duck', 2.5);
    }
    if (!hookable(f.job)) {                                         // too small for this hook
      f.state = 'swim'; f.ignore = 12; retarget(f); k.suitor = null; k.phase = 'wait'; k.waited = 0;
      return onSay(`Too small for the ${F.hook} hook: it slipped off.`, 'duck', 2.5);
    }
    k.phase = 'fight'; k.age = 0; k.ten = 0.35; k.prog = 0.04; k.burst = 0; k.burstIn = rand(0.6, 1.2);
    k.from = { x: f.x, y: f.y }; f.state = 'hooked';
    if (f.job.size === 'gold') F.shake = 1;
    puff(f.x, f.y, 4);
    if (onCheck && !f.job.bottle) onCheck(f.job).then((v) => F.checks.set(f.job.id, v), () => F.checks.set(f.job.id, null));
    if (F.who === 'you') onSay(f.job.size === 'gold' ? 'A golden one! Hold to reel, let go when it pulls.' : 'Hooked! Hold to reel, let go when it pulls.', 'duck', 3);
  }

  // ---- each moment ----------------------------------------------------------------------------------------------------------
  function step(dt, paused) {
    if (!F.on) return;
    F.t += dt;
    if (paused) return;
    if (!F.over) {
      F.day = Math.min(1, F.day + dt / DAY);
      if (!F.golden && F.day >= 1 - GOLDEN / DAY) { F.golden = true; onSay('The golden hour: the golden ones are coming up.', 'gull'); for (const f of F.pond) if (f.kind === 'gold' && f.state === 'swim') retarget(f); }
      if (F.day >= 1 && !F.pending && !(F.line && (F.line.phase === 'fight' || F.line.phase === 'land'))) return sunset();
      const emptied = !F.pond.length && !F.queue.length;            // nothing left to catch: the results, however many
      if (!F.doneShown && !F.waiting && !F.rising.length && (F.caught >= Math.min(TARGET, F.sonar.found) || emptied) && !F.line && !F.pending) {
        F.doneShown = true; onDone({ caught: F.caught, found: F.sonar.found, gold: F.sonar.gold });
      }
    }
    F.citySpeed = F.waiting ? 14 : Math.max(0, F.citySpeed - dt * 3);   // the search done, the city slows and stops: anchored
    for (const b of F.sonar.blips) b.age += dt;
    stock(dt);
    for (const r of F.rising.slice()) {
      r.k += dt / 2.2;
      if (r.k >= 1) {
        F.rising.splice(F.rising.indexOf(r), 1);
        const f = { job: r.job, x: r.x, y: r.y, r: r.r, kind: r.kind, dir: r.dir, state: 'swim', ph: Math.random() * 6, fresh: daysOld(r.job.posted) < 1, ignore: 0 };
        retarget(f); F.pond.push(f);
      }
    }
    if ((F.resort = (F.resort || 0) - dt) <= 0) {                    // now and then a fish finds its depth again, as the lake changes
      F.resort = 1.5;
      const f = F.pond[Math.floor(Math.random() * F.pond.length)];
      if (f && f.state === 'swim') retarget(f);
    }
    swim(dt);
    if (F.line) line(dt);
    if (F.who === 'you' && F.t - F.touched > IDLE && !(F.line && F.line.phase === 'fight') && !F.pending) {
      F.who = 'duck'; if (!F.saidDuck) { F.saidDuck = true; onSay('I will keep fishing. Press the lake any time to take the rod.', 'duck', 3.5); }
    }
    if (F.who === 'duck') duck(dt);
    plane();
    // the effects: they fade
    for (const pf of F.puffs) pf.age += dt;
    F.puffs = F.puffs.filter((pf) => pf.age < 0.8);
    for (const sp of F.sparks) { sp.age += dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 20 * dt; }
    F.sparks = F.sparks.filter((sp) => sp.age < 1.2);
    F.shake = Math.max(0, F.shake - dt * 2.5);
    if (F.gullSteal && (F.gullSteal.k += dt / 2) >= 1) F.gullSteal = null;
    if (F.boot && (F.boot.age += dt) > 2.2) F.boot = null;
  }
  function swim(dt) {
    const k = F.line;
    for (const f of F.pond.slice()) {
      if (f.state === 'hooked') continue;
      if (f.ignore > 0) f.ignore -= dt;
      if (f.flee > 0) { f.flee -= dt; if (f.flee <= 0) { f.state = 'swim'; retarget(f); } }
      let tx = f.tx, ty = f.ty, sp = (SPEED[f.kind] || 10) * (f.fresh ? 1.3 : 1);
      if (f.state === 'come' && k) { tx = k.bait.x - f.dir * (f.r + 3); ty = k.bait.y; sp *= 1.2; }
      if (f.state === 'nibble' && k) { tx = k.bait.x - f.dir * (f.r + 2) + Math.sin(F.t * 9) * 1.5; ty = k.bait.y; sp *= 2; }
      if (f.state === 'flee' || f.state === 'leave') sp *= 3;
      const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy);
      if (d > 0.5) { const m = Math.min(d, sp * dt); f.x += (dx / d) * m; f.y += (dy / d) * m * 0.7; }
      if (Math.abs(dx) > 1 && f.state !== 'nibble') f.dir = dx > 0 ? 1 : -1;
      if (f.state === 'leave' && (f.x < -20 || f.x > W + 20)) { F.pond.splice(F.pond.indexOf(f), 1); continue; }
      if (f.state === 'swim' && d < 4) retarget(f);
    }
  }
  // the line: flying out, sinking, waiting, a fish coming, nibbling, biting, the fight, the net, back in
  function line(dt) {
    const k = F.line;
    k.age += dt;
    if (k.phase === 'fly') {
      const e = Math.min(1, k.age / 0.5), top = L.top + 2;
      k.bait = { x: k.from.x + (k.to.x - k.from.x) * e, y: k.from.y + (top - k.from.y) * e - Math.sin(Math.PI * e) * 16 };
      if (e >= 1) { k.phase = 'sink'; k.age = 0; puff(k.bait.x, top, 3); sfx('splash'); }
      return;
    }
    if (k.phase === 'sink') {                                         // down it goes, slowly, to the depth chosen
      k.bait.y = Math.min(k.to.y, k.bait.y + 26 * dt);
      if (k.bait.y >= k.to.y) { k.phase = 'wait'; k.age = 0; k.waited = 0; }
      return;
    }
    if (F.holding && (k.phase === 'wait' || k.phase === 'come')) {   // reeling the bait back up toward the boat
      const lx = F.tip.x + 4, ly = L.top, dx = lx - k.bait.x, dy = ly - k.bait.y, d = Math.hypot(dx, dy);
      if (d < 6) { if (k.suitor) { k.suitor.state = 'swim'; retarget(k.suitor); } F.line = null; return; }
      k.bait.x += (dx / d) * 32 * dt; k.bait.y += (dy / d) * 32 * dt;
    }
    if (k.phase === 'wait') {
      k.waited += dt;
      // the gull, if the bait sits a long while near the top
      if (k.waited > 14 && k.bait.y < L.top + (L.bottom - L.top) * 0.3 && Math.random() < dt * 0.15 && !F.gullSteal) {
        F.gullSteal = { k: 0, x: k.bait.x, y: k.bait.y };
        onSay(`Hey! The gull stole my ${F.bait || 'bait'}!`, 'duck', 2.5);
        k.phase = 'back'; k.age = 0; k.nobait = true; return;
      }
      // a fish takes an interest: near, at its depth, the bait's skill in its posting, not too wary
      if (Math.random() < dt * 1.2) {
        const cands = F.pond.filter((f) => f.state === 'swim' && !(f.ignore > 0) && Math.hypot(f.x - k.bait.x, f.y - k.bait.y) < 80);
        for (const f of cands) {
          const [a, b] = band(f.job), atDepth = k.bait.y >= a - 12 && k.bait.y <= b + 12 ? 1 : 0.25;
          const p = 0.35 * (F.bait && f.job.skills && f.job.skills[F.bait] ? 2.2 : 1) * (f.kind === 'gold' ? 0.55 : 1) * atDepth * (f.kind === 'bottle' ? 2 : 1);
          if (Math.random() < p) { k.suitor = f; f.state = 'come'; k.phase = 'come'; k.age = 0; break; }
        }
      }
      return;
    }
    if (k.phase === 'come') {                                         // a fish swims round to the bait
      const f = k.suitor;
      if (!f || !F.pond.includes(f)) { k.phase = 'wait'; k.suitor = null; return; }
      if (Math.hypot(f.x - k.bait.x, f.y - k.bait.y) < f.r + 6 || k.age > 6) {
        k.phase = 'nibble'; k.age = 0; k.nibbles = f.kind === 'bottle' ? 0 : 1 + Math.floor(Math.random() * 3); k.nextNib = rand(0.4, 0.9); f.state = 'nibble';
      }
      return;
    }
    if (k.phase === 'nibble') {                                       // little tugs: the rod tip twitches; not yet
      if (k.age >= k.nextNib) {
        k.twitch = 0.2; k.age = 0; k.nextNib = rand(0.6, 1.0);
        if (k.nibbles-- <= 0) { k.phase = 'bite'; k.age = 0; k.window = k.suitor.kind === 'gold' ? 0.75 : k.suitor.kind === 'bottle' ? 1.6 : 0.9; sfx('bite'); if (k.suitor.kind === 'gold') F.shake = 0.6; }
      }
      if (k.twitch > 0) k.twitch -= dt;
      return;
    }
    if (k.phase === 'bite') {                                         // «!»: strike now
      if (F.who === 'duck' && k.age > 0.22) return strike(k);
      if (k.age >= k.window) {
        const f = k.suitor; f.state = 'swim'; f.ignore = 6; retarget(f); k.suitor = null;
        if (Math.random() < 0.35) { k.phase = 'back'; k.age = 0; k.nobait = true; onSay('Too slow: it took the bait and swam off.', 'duck', 2.5); }
        else { k.phase = 'wait'; k.waited = 0; onSay('Too slow: it let go.', 'duck', 2); }
      }
      return;
    }
    if (k.phase === 'fight') return fight(k, dt);
    if (k.phase === 'land') {                                         // the duck nets it
      F.net = { k: k.age / 0.7, x: k.suitor.x, y: k.suitor.y };
      if (k.age >= 0.7) { F.net = null; landed(k); }
      return;
    }
    if (k.phase === 'back') {                                         // the bait wound back in (or the empty hook)
      const e = Math.min(1, k.age / 0.45);
      k.bait = { x: k.bait.x + (F.tip.x - k.bait.x) * e, y: k.bait.y + (F.tip.y - k.bait.y) * e };
      if (e >= 1) { const next = k.next; F.line = null; if (next) cast(next); }
    }
  }
  // THE FIGHT: holding reels in and tightens the line; letting go eases it and lets the fish run a little. In a burst it pulls
  // hard and dives: hold through it and the line snaps.
  function fight(k, dt) {
    const f = k.suitor, pull = PULL[f.job.bottle ? 'bottle' : f.job.size] ?? 0.4;
    if ((k.burstIn -= dt) <= 0) { k.burst = k.burst ? 0 : 1; k.burstIn = k.burst ? rand(0.5, 1.0) * (0.6 + pull) : rand(0.8, 1.8) * (1.4 - pull); if (k.burst) puff(f.x, f.y, 3); }
    const reel = F.who === 'duck' ? k.ten < (k.burst ? 0.42 : 0.66) : F.holding;
    if (reel) { k.prog += dt * 0.2 * (1 - k.burst * 0.7) * (f.job.bottle ? 3 : 1); k.ten += dt * (0.22 + pull * (k.burst ? 1.25 : 0.4)); if (Math.random() < dt * 14) sfx('reel'); }
    else { k.ten = Math.max(0, k.ten - dt * 0.7); k.prog -= dt * (0.02 + pull * (k.burst ? 0.1 : 0.03)); }
    if (k.ten < 0.12 && !reel) k.prog -= dt * 0.06;                  // a slack line: it slips away
    const e = Math.max(0, Math.min(1, k.prog)), lx = F.tip.x + 6, ly = L.top + 2;
    f.x = k.from.x + (lx - k.from.x) * e + Math.sin(F.t * 2.2 + f.ph) * 14 * (1 - e) + (k.burst ? Math.sin(F.t * 30) * 2 : 0);
    f.y = k.from.y + (ly - k.from.y) * e + (k.burst ? 3 : 0);
    f.dir = Math.cos(F.t * 2.2 + f.ph) > 0 ? 1 : -1;
    k.bait = { x: f.x + f.dir * (f.r + 2), y: f.y + 2 };
    for (const o of F.pond) if (o !== f && o.state === 'swim' && Math.hypot(o.x - f.x, o.y - f.y) < 34) { o.tx = clampX(o.x + (o.x - f.x)); o.ty = o.y + (o.y - f.y) * 0.5; }   // the others keep away
    if (k.ten >= 1) { sfx('snap'); return lost(k, 'The line snapped! It is still down there; it will bite again.'); }
    if (k.prog <= 0 && k.age > 1.5) return lost(k, 'It got away. It is still in the lake.');
    if (k.prog >= 1) { k.phase = 'land'; k.age = 0; }
  }
  function lost(k, said) {
    const f = k.suitor; f.state = 'swim'; f.ignore = 8; retarget(f);
    F.line = { ...k, phase: 'back', age: 0, suitor: null, nobait: true, next: null };
    onSay(said, 'duck', 3);
  }
  function landed(k) {
    const f = k.suitor, job = f.job, checked = F.checks.get(job.id);
    F.pond.splice(F.pond.indexOf(f), 1);
    F.line = null;
    if (checked === false) {                                          // the posting had closed: an old boot
      F.boot = { x: F.tip.x + 2, y: F.tip.y + 12, age: 0 };
      add(job, 'caught', 'expired');
      return onSay(`An old boot! ${job.company} has closed that posting. Marked expired, so you need not look.`, 'duck', 4);
    }
    puff(f.x, f.y, 5);
    if (job.size === 'gold') for (let i = 0; i < 24; i++) F.sparks.push({ x: f.x, y: f.y, vx: rand(-30, 30), vy: rand(-40, -10), age: 0, col: i % 2 ? '#fff2b0' : '#ffd84a' });
    const how = job.bottle ? 'bottle' : 'caught';
    if (F.who === 'duck') { keep(job, how, 'new'); F.autoWait = rand(2.5, 4); return onSay(`${job.size === 'gold' ? 'A golden one: ' : ''}${job.title}, ${job.company}. In the bucket.`, 'duck', 3.5); }
    F.pending = { job, how };
    onCard(job, how, f.kind, checked);
  }
  function keep(job, how, status) { if (add(job, how === 'bottle' ? 'caught' : how, status) && status === 'new') F.caught++; }
  function answer(keepIt) {                                          // the card's answer: Keep, or Throw back (not for me)
    const p = F.pending; F.pending = null;
    if (p) keep(p.job, p.how, keepIt ? 'new' : 'not_for_me');
    F.touched = F.t;
  }
  function puff(x, y, r) { F.puffs.push({ x, y, r, age: 0 }); }

  // ---- the duck fishing by itself: the best fish first, a calm hand -------------------------------------------------------------
  function duck(dt) {
    const k = F.line;
    if (!k) {
      if ((F.autoWait -= dt) > 0 || F.pending) return;
      const pick = F.pond.filter((f) => f.state === 'swim' && !(f.ignore > 0)).sort((a, b) => (b.kind === 'bottle') - (a.kind === 'bottle') || order(a.job, b.job))[0];
      if (!pick) return;
      F.autoWait = rand(1.2, 2.4);
      cast({ x: pick.x + pick.dir * 10, y: pick.y });
      return;
    }
    if (k.phase === 'wait' && k.waited > 9) { k.phase = 'back'; k.age = 0; F.autoWait = 0.5; }   // nothing here: elsewhere
  }

  // ---- the bottle the plane drops: a job outside the titles that the CV fits ---------------------------------------------------
  function plane() {
    if (!F.bottles.length || F.t < F.bottleNext || F.over) return;
    F.bottleNext = F.t + 90;
    const job = { ...F.bottles.shift(), bottle: true }, x = rand(W * 0.3, W * 0.85);
    F.rising.push({ job, x, from: 10, y: rand(L.top + 10, L.deep), k: 0, r: 6, name: 'A BOTTLE', dir: -1, kind: 'bottle' });
    onSay('The plane dropped a bottle into the lake! A job outside your titles that your CV fits.', 'gull', 4);
  }

  // ---- the end of the morning: sunset, or home early from the results -----------------------------------------------------------
  function sunset(quiet) {                                          // quiet: home early from the results, nothing more to say
    if (F.over) return;
    F.over = true; F.line = null;
    const left = rest().filter((j) => j.size === 'gold');
    left.forEach((j) => add(j, 'ashore'));
    if (!quiet) onSunset({ caught: F.caught, ashore: left.length });
  }
  // what is still in the lake and waiting to rise: not caught, the best first, each once (one swimming off is also queued again)
  function rest() {
    const seen = new Set();
    return [...(F.pond || []).map((f) => f.job), ...(F.rising || []).map((r) => r.job), ...(F.queue || [])]
      .filter((j) => !seen.has(j.id) && seen.add(j.id) && !has(j.id) && !j.bottle).sort(order);
  }
  // kept from the results' list, not caught: out of the lake and the queue, and counted as caught
  function kept(job) {
    if (!F.on) return;
    F.queue = F.queue.filter((j) => j.id !== job.id);
    F.rising = F.rising.filter((r) => r.job.id !== job.id);
    for (const f of F.pond) if (f.job.id === job.id && f.state !== 'hooked') { f.state = 'leave'; f.tx = f.x < W / 2 ? -30 : W + 30; }
    F.caught++;
  }

  // ---- what js/deep.js draws ----------------------------------------------------------------------------------------------------
  function view(t, extra = {}) {
    const k = F.line, fight = k && k.phase === 'fight', twitch = k && k.phase === 'nibble' && k.twitch > 0;
    const left = Math.max(0, Math.ceil(DAY * (1 - F.day)));
    return {
      day: 0.08 + F.day * 0.86, speed: F.citySpeed, names: extra.names,
      fish: F.pond.map((f) => ({ x: f.x, y: f.y, r: f.r, dir: f.dir, kind: f.kind, fresh: f.fresh, ph: f.ph, shy: k && k.suitor === f && (k.phase === 'come' || k.phase === 'nibble') })),
      rising: F.rising,
      bait: k && !(k.phase === 'back' && k.nobait && k.age > 0.4) ? k.bait : null, label: k && !k.nobait ? shortOf(F.bait) : '',
      nibble: k && (k.phase === 'come' || k.phase === 'nibble'), bite: k && k.phase === 'bite',
      taut: fight ? Math.min(1, k.ten) : 0, bend: fight ? 0.3 + Math.min(1, k.ten) * 0.5 : twitch ? 0.25 : 0,
      rod: k ? (fight ? 0.45 : 0.3) : 0.12, fight: fight ? { ten: k.ten, prog: Math.max(0, Math.min(1, k.prog)) } : null,
      idle: !k && F.who === 'duck', puffs: F.puffs, sparks: F.sparks, shake: F.shake, boot: F.boot, net: F.net, gullSteal: F.gullSteal,
      sonar: { ...F.sonar, clock: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, sound: extra.sound },
      tools: { baitShort: shortOf(F.bait) || '?', hook: { small: 'S', medium: 'M', big: 'L' }[F.hook] || 'S', netUsed: F.netUsed, auto: F.who === 'duck', bucket: F.caught },
    };
  }

  // ---- the tackle bar's net: once a day, every small fish in the shallows, scooped ----------------------------------------------
  function net() {
    if (!F.on || F.over || F.netUsed) return 0;
    const small = F.pond.filter((f) => (f.job.size === 'small' || f.job.size === 'unread') && f.state === 'swim' && f.kind !== 'bottle');
    small.forEach((f) => { F.pond.splice(F.pond.indexOf(f), 1); puff(f.x, f.y, 3); keep(f.job, 'net', 'new'); });
    F.netUsed = true; try { localStorage.setItem(NET_KEY, today()); } catch (e) { /* this visit alone */ }
    onSay(small.length ? `The net scooped ${small.length} small one${small.length === 1 ? '' : 's'} from the shallows. In the bucket.` : 'Nothing small enough for the net in the shallows. It is used for today.', 'duck', 3);
    return small.length;
  }
  function toggleWho() {
    F.who = F.who === 'duck' ? 'you' : 'duck'; F.touched = F.t;
    onSay(F.who === 'duck' ? 'I will fish. Same lake, same list. Have a coffee.' : 'Your rod. Press the lake to cast.', 'duck', 2.5);
  }

  return {
    F, start, feed, fleetHome, step, view, down, up, move, answer, net, toggleWho, setGear, rest, kept, sunset,
    setTip(tip) { F.tip = tip; }, resize(w, h) { W = w; H = h; }, stop() { F.on = false; F.line = null; },
  };
}
