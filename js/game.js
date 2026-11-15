// THE GAME, ONE DAY OF IT (PLAN.md 14): the office at night (the duck asleep, the person's own numbers in the room),
// the golden escalator up to the cloud pier (the day's departures, the bait, the hook), the boat out over the city
// (fishing), and at sunset the bucket: the list of jobs to act on. Mouse alone (a finger on a phone). The picture fills
// the window, drawn small and scaled up whole so each pixel stays sharp; every scene is laid out from the window's shape.

import { me, begin } from './setup.js';
import { user, saveProfile, postcard } from './account.js';
import { sync, all, has } from './box.js';
import { openReport } from './report.js';
import { makeRoom } from './room.js';
import { makePier } from './pier.js';
import { makeVoyage } from './voyage.js';
import { makePix } from './pix.js';
import { makeFishing, DAY } from './fishing.js';
import { readLake, boardOf, baitsOf, HOOKS } from './lake.js';
import { numbers, fished } from './progress.js';
import { sfx, soundOn, setSound } from './sound.js';

const $ = (id) => document.getElementById(id);
const cv = $('scene'), g = cv.getContext('2d');
const touch = matchMedia('(pointer: coarse)').matches, PRESS = touch ? 'Tap' : 'Click';
let person = me;                                                       // the CV's skills, the titles, the place (setup.js)

// ---- the stage: a small canvas the shape of the window, scaled up whole -------------------------------------------------
let W = 384, H = 216, K = 1;
function fit() {
  const iw = innerWidth, ih = innerHeight, wide = iw >= ih;
  const r = wide ? ih / 216 : iw / 195;                                // about 216 high on a computer, 195 wide on a phone
  K = r >= 2 ? Math.floor(r) : r;
  W = Math.ceil(iw / K); H = Math.ceil(ih / K);
  cv.width = W; cv.height = H;
  cv.style.width = `${W * K}px`; cv.style.height = `${H * K}px`;
  g.imageSmoothingEnabled = false;
  for (const s of [room, pier, sky]) s.layout(W, H);
  fishing.resize(W, H);
}
const room = makeRoom(g), pier = makePier(g), sky = makeVoyage(g);
const fishing = makeFishing(makePix(g), {
  onCard: (job, how) => card(job, how),
  onSay: (t) => { if (t) say(t, 'sky'); },
  onSunset: (r) => sunset(r),
});
const logical = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / K, y: (e.clientY - r.top) / K }; };
const inside = (p, s) => s && p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h;
const hit = (p, spots) => Object.entries(spots || {}).reverse().find(([, s]) => inside(p, s));

// ---- what is said, in a bubble over the one who says it -------------------------------------------------------------------
let saying = { until: 0, who: null };
function say(text, who = 'duck', secs) {
  const b = $('say');
  b.textContent = text; b.hidden = !text;
  saying = { until: performance.now() + (secs || Math.min(9, 2.5 + text.length / 16)) * 1000, who };
  place();
}
function place() {
  const b = $('say');
  if (b.hidden) return;
  if (performance.now() > saying.until) { b.hidden = true; return; }
  let at;
  if (scene === 'office') at = room.L.head;
  else if (scene === 'pier') at = saying.who === 'gull' ? pier.L.gullHead : pier.L.duckHead || pier.L.gullHead;
  else at = sky.L.boat ? { x: sky.L.boat.x + 52, y: sky.L.boat.y - 32 } : null;
  if (!at) return;
  const r = b.getBoundingClientRect(), maxX = innerWidth - r.width - 8;
  b.style.left = `${Math.max(8, Math.min(maxX, at.x * K - 24))}px`;
  b.style.top = `${Math.max(8, at.y * K - r.height - 10)}px`;
  b.classList.toggle('below', at.y * K - r.height - 10 < 8);
}

// ---- the scenes and the moves between them ------------------------------------------------------------------------------
let scene = 'office', t0 = performance.now(), fade = null;            // fade: { color, k, dir, then }
const office = { pose: 'sleep', k: 0, n: numbers(), talkAt: 6 };
const dock = { pose: 'stand', k: 0, board: null, loading: false, skills: [], bait: '', hook: 'small', lake: null, bottles: [], told: 0 };
function go(to, color = '#ffffff') {
  fade = { color, k: 0, dir: 1, then: () => { scene = to; enter(to); fade.dir = -1; } };
}
function enter(to) {
  $('say').hidden = true;
  $('skyHud').hidden = to !== 'sea';
  document.body.dataset.scene = to;
  if (to === 'office') { office.pose = 'sleep'; office.k = 0; office.n = numbers(); office.talkAt = 3; corner(); }
  if (to === 'pier') arrive();
  if (to === 'sea') setSail();
}

// ---- THE OFFICE: the duck asleep, its numbers in the room; a press on it (or the escalator) and up it goes --------------------
const SNORES = ['zzz… entry level… eight years of experience required… zzz', 'zzz… yes… I am a team player… zzz',
  'zzz… where do I see myself in five years… asleep… zzz', 'zzz… competitive salary… unpaid… zzz', 'zzz… a fast-paced environment… zzz',
  'zzz… please find attached… my soul… zzz', 'zzz… we will keep your CV on file… zzz'];
const THINGS = {
  screen: (n) => `${n.applied} sent, ${n.replies} ${n.replies === 1 ? 'reply' : 'replies'}. I keep typing. My beak keeps typing.`,
  calendar: (n) => `Day ${n.day} of the search. ${n.streak > 1 ? `${n.streak} days fishing in a row!` : 'One day at a time.'}`,
  board: (n) => (n.letters ? `${n.letters} let go: expired, or not for me. My fan mail.` : 'No letters yet. Good luck!'),
  poster: () => 'Hang in there, little duck.',
  clock: () => '3:47 in the morning. The best ideas come at 3:47. So do the worst.',
  window: () => 'The city never sleeps. Neither do I, apparently.',
  trophy: () => 'For taking part. I take part a lot.',
  papers: (n) => (n.papers ? `${n.papers} job${n.papers === 1 ? '' : 's'} in my bucket, not looked at yet.` : 'My pile is empty. Time to fish.'),
  mugs: (n) => `${n.mugs || 1} mug${(n.mugs || 1) === 1 ? '' : 's'} this week. Each one a day of fishing.`,
  noodles: () => 'Dinner. Also breakfast.',
  plant: (n) => (n.away <= 1 ? 'It is doing well. It likes it when I come every day.' : n.away <= 4 ? 'It droops when I stay away.' : 'I have been away too long. Sorry, plant.'),
  phone: () => '«Unfortunately…» Back to sleep.',
  bin: () => 'Cover letter, draft 31. Draft 32. Draft 33.',
  sign: () => 'Jobs this way. Up.',
  rope: () => (person ? 'The rope is down. Up we go?' : 'CV required. Of course it is.'),
};
function officePress(p) {
  const h = hit(p, room.L.spots);
  if (!h) return;
  const [name] = h;
  if (name === 'duck' || name === 'escalator' || name === 'sign' || name === 'rope') {
    if (!person) { say('CV required. Of course it is. Give me your CV first.', 'duck'); begin(asked); return; }
    if (office.pose !== 'sleep') return;
    sfx('quack');
    office.pose = 'wake'; office.k = 0;
    say(['An escalator. To the sky. …Sure, why not.', 'Huh? Oh. The sky again. Let us go fishing.', 'Five more minutes… no. Jobs. Up.'][Math.floor(Math.random() * 3)], 'duck', 3);
    return;
  }
  const f = THINGS[name];
  if (f) say(f(office.n), 'duck');
}
function officeStep(dt, t) {
  if (office.pose === 'wake' && (office.k += dt) > 1.6) { office.pose = 'walk'; office.k = 0; }
  else if (office.pose === 'walk' && (office.k += dt / 2.2) >= 1) { office.pose = 'ride'; office.k = 0; sfx('hum'); }
  else if (office.pose === 'ride' && (office.k += dt / 2.6) >= 1 && !fade) go('pier', '#ffffff');
  if (office.pose === 'sleep' && t > office.talkAt && $('say').hidden && !anySheet()) {      // talking in its sleep
    office.talkAt = t + 9 + Math.random() * 6;
    say(person ? SNORES[Math.floor(Math.random() * SNORES.length)] : 'zzz… a CV… I need a CV… zzz', 'duck', 4.5);
  }
}
const anySheet = () => ['paper', 'notes', 'map', 'postcard', 'report', 'catch'].some((id) => !$(id).hidden);

// ---- THE PIER: the sky is read; the board turns; a bait, a hook, then the boat -------------------------------------------------
async function arrive() {
  Object.assign(dock, { pose: 'stand', k: 0, loading: true, board: null, told: 0 });
  namesCache = null;
  say('Huh. So this is where jobs come from.', 'duck', 3);
  try {
    const { lake, bottles } = await readLake(person);
    dock.lake = lake; dock.bottles = bottles;
    dock.board = boardOf(lake, person);
    dock.skills = baitsOf(lake, person).slice(0, 4);
    if (dock.skills.length < 4) for (const k of person.skills || []) if (dock.skills.length < 4 && !dock.skills.includes(k)) dock.skills.push(k);
    if (!dock.skills.includes(dock.bait)) dock.bait = dock.skills[0] || '';
  } catch (e) {
    dock.lake = []; dock.bottles = []; dock.board = [['THE SKY', 0, 'CLOSED']];
    say(`The sky could not be read (${e.message}). Try again in a while.`, 'gull');
  }
  dock.loading = false; sfx('flaps');
  setTimeout(() => { if (scene === 'pier' && dock.pose === 'stand') { dock.told = 1; say(gullTip(), 'gull', 6); } }, 3200);
}
function gullTip() {
  const n = dock.lake ? dock.lake.length : 0, gold = dock.lake ? dock.lake.filter((j) => j.size === 'gold').length : 0;
  if (!n) return 'Ahoy. A quiet sky today: nothing new for you. Come back tomorrow, the harbour will be busier.';
  return `Ahoy! ${n} cloud${n === 1 ? '' : 's'} out today, ${gold} golden. Pick a bait jar (a skill from your CV) and a hook, then ${PRESS.toLowerCase()} the boat.`;
}
const PIER_SAYS = {
  board: () => 'The departures: how many clouds are out today where you look, and how many are golden: the ones that fit you.',
  hut: () => 'The harbour master is out fishing. Like everyone.',
  crates: () => 'HOPE: handle with care. CV13: the thirteenth draft, the best one yet.',
  gull: () => gullTip(),
};
function pierPress(p) {
  const h = hit(p, pier.L.spots);
  if (!h || dock.pose !== 'stand') return;
  const [name] = h;
  if (name.startsWith('jar:')) {
    dock.bait = name.slice(4); sfx('clink');
    const n = (dock.lake || []).filter((j) => j.skills && j.skills[dock.bait]).length;
    return say(`Bait: ${dock.bait}. ${n} of today's clouds ask for it: they come first, and they bite faster.`, 'gull');
  }
  if (name.startsWith('hook:')) {
    dock.hook = name.slice(5); sfx('clink');
    const min = HOOKS[dock.hook], n = (dock.lake || []).filter((j) => (min ? j.fit != null && j.fit >= min : true)).length;
    return say(min ? `The ${dock.hook} hook: only clouds that fit you ${min}% or more. ${n} of them today.` : `The small hook: it catches every cloud, ${n} today.`, 'gull');
  }
  if (name === 'boat' || name === 'sign') {
    if (dock.loading) return say('Wait for the board: the sky is still being read.', 'gull');
    dock.pose = 'walk'; dock.k = 0; sfx('quack');
    return;
  }
  const f = PIER_SAYS[name];
  if (f) say(f(), name === 'gull' || name === 'board' ? 'gull' : 'duck');
}
function pierStep(dt) {
  if (dock.pose === 'walk' && (dock.k += dt / 2.4) >= 1) { dock.pose = 'aboard'; dock.k = 0; say('All aboard the Good Luck!', 'duck', 2); }
  else if (dock.pose === 'aboard' && (dock.k += dt) > 1.0) { dock.pose = 'sail'; dock.k = 0; sfx('horn'); }
  else if (dock.pose === 'sail' && (dock.k += dt / 2.2) >= 1 && !fade) go('sea', '#ffffff');
}

// ---- OUT FISHING ------------------------------------------------------------------------------------------------------------
let autoOn = false;
function setSail() {
  fished();
  fishing.start({ W, H }, { lake: dock.lake || [], bottles: dock.bottles || [], bait: dock.bait, hook: dock.hook, auto: autoOn });
  $('skyCount').textContent = '0';
  $('skyGear').textContent = `Bait: ${dock.bait || 'any'} · Hook: ${dock.hook}`;
  netLabel();
}
function netLabel() { $('netBtn').disabled = !!fishing.F.netUsed; $('netBtn').textContent = fishing.F.netUsed ? 'Net: used today' : 'Net'; }
const ago = (ms) => { const h = Math.max(0, (Date.now() - ms) / 36e5), n = h < 48 ? Math.round(h) : Math.round(h / 24), u = h < 48 ? 'hour' : 'day'; return h < 1 ? 'posted within the hour' : `posted ${n} ${u}${n === 1 ? '' : 's'} ago`; };
function card(job, how) {
  const mine = new Set(person.skills || []);
  $('ctKicker').textContent = how === 'bottle' ? 'A message in a bottle' : job.size === 'gold' ? 'A golden cloud!' : job.size === 'big' ? 'A big one' : 'You caught';
  $('ctTitle').textContent = job.title;
  $('ctWho').textContent = job.company;
  $('ctMeta').textContent = [job.place, ago(job.posted)].filter(Boolean).join(' · ');
  const have = Object.keys(job.skills || {}).filter((k) => mine.has(k)), miss = Object.keys(job.skills || {}).filter((k) => !mine.has(k));
  $('ctFit').textContent = job.fit == null ? 'Its posting names too little to weigh: open it to judge.'
    : `Fits you ${job.fit}%. Your CV says: ${have.slice(0, 5).join(', ') || 'none of it'}.${miss.length ? ` It asks too: ${miss.slice(0, 5).join(', ')}.` : ''}`
      + (how === 'bottle' ? ' Not one of your titles, but your CV fits it.' : '');
  $('ctOpen').href = job.url;
  $('catch').hidden = false; $('say').hidden = true;
  sfx(job.size === 'gold' ? 'fanfare' : 'catch');
}
function answer(keep) {
  fishing.answer(keep);
  $('catch').hidden = true;
  $('skyCount').textContent = String(fishing.F.caught);
  say(keep ? 'In the bucket.' : 'Thrown back. Not for us.', 'sky', 1.6);
}
function sunset({ caught, ashore }) {
  sfx('dusk');
  openReport(`The sun has set: ${caught} caught${ashore ? `, ${ashore} golden washed ashore` : ''}`, () => { fishing.stop(); go('office', '#0c0f24'); });
}

// ---- the hands ----------------------------------------------------------------------------------------------------------------
cv.addEventListener('pointerdown', (e) => {
  if (fade || anySheet()) return;
  const p = logical(e);
  if (scene === 'office') officePress(p);
  else if (scene === 'pier') pierPress(p);
  else { fishing.down(p); }
});
cv.addEventListener('pointermove', (e) => {
  const p = logical(e);
  if (scene === 'sea') fishing.move(p);
  const spots = scene === 'office' ? room.L.spots : scene === 'pier' ? pier.L.spots : null;
  cv.style.cursor = spots && hit(p, spots) ? 'pointer' : scene === 'sea' ? 'crosshair' : 'default';
});
addEventListener('pointerup', () => { if (scene === 'sea') fishing.up(); });
addEventListener('pointercancel', () => { if (scene === 'sea') fishing.up(); });
$('netBtn').addEventListener('click', () => { if (fishing.net()) { $('skyCount').textContent = String(fishing.F.caught); sfx('net'); } netLabel(); });
$('autoSky').addEventListener('click', () => {
  autoOn = !autoOn; fishing.F.auto = autoOn;
  $('autoSky').textContent = `Auto: ${autoOn ? 'on' : 'off'}`;
  say(autoOn ? 'The duck fishes by itself. Same clouds, same list. Have a coffee.' : 'Your rod again.', 'sky', 2.5);
});
$('ctKeep').addEventListener('click', () => answer(true));
$('ctThrow').addEventListener('click', () => answer(false));
$('sound').addEventListener('click', () => { setSound(!soundOn()); $('sound').textContent = `Sound: ${soundOn() ? 'on' : 'off'}`; sfx('quack'); });
$('sound').textContent = `Sound: ${soundOn() ? 'on' : 'off'}`;
$('bucket').addEventListener('click', () => openReport('Your bucket', () => { office.n = numbers(); }));

// ---- the CV and the account (PLAN.md 9): asked once; «My CV» asks again ---------------------------------------------------------
function asked(v) {
  person = JSON.parse(localStorage.getItem('glf.me') || 'null') || v;
  user().then((u) => { if (u) { saveProfile(person); ready(); } else postcard(ready); });
}
function ready() {
  $('mycv').hidden = false; $('bucket').hidden = false;
  corner().then((u) => { if (u) sync().then(() => { office.n = numbers(); }); });
  if (person) say('Is that… my CV? Mine? Not bad, me. Now: the escalator.', 'duck', 4);
}
async function corner() {
  const u = await user();
  $('who').hidden = !u; $('who').textContent = u ? `Signed in: ${u.email}` : '';
  $('signin').hidden = !!u;
  return u;
}
$('mycv').addEventListener('click', () => { if (scene === 'office') begin(asked); });
$('signin').addEventListener('click', () => { $('signin').hidden = true; postcard(ready); });

// ---- the loop -------------------------------------------------------------------------------------------------------------------
addEventListener('resize', fit);
fit();
document.body.dataset.scene = 'office';
if (person) { $('mycv').hidden = false; $('bucket').hidden = false; corner(); user().then((u) => { if (u) { saveProfile(person); sync().then(() => { office.n = numbers(); }); } }); }
else setTimeout(() => begin(asked), 900);
let last = performance.now();
function frame(now) { tick(now); requestAnimationFrame(frame); }
function tick(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  const t = (now - t0) / 1000;
  if (fade) {
    fade.k += dt / 0.7 * fade.dir;
    if (fade.k >= 1 && fade.dir > 0) { fade.k = 1; fade.then(); }
    else if (fade.k <= 0 && fade.dir < 0) fade = null;
  }
  if (scene === 'office') {
    officeStep(dt, t);
    room.draw(W, H, t, { n: office.n, open: !!person, duck: { pose: office.pose, k: office.k } });
  } else if (scene === 'pier') {
    pierStep(dt);
    pier.draw(W, H, t, { board: dock.board, loading: dock.loading, skills: dock.skills, bait: dock.bait, hook: dock.hook, duck: { pose: dock.pose, k: dock.k } });
  } else {
    const paused = !$('catch').hidden || !$('report').hidden;
    fishing.step(dt, paused);
    const F = fishing.F, k = F.cast, rod = k && k.phase === 'fight' ? -0.55 - Math.sin(t * 20) * 0.05 * (k.burst || 0) : F.charging ? -1.4 : -0.95;
    const tip = sky.draw(W, H, t, { day: F.day * 0.92 + 0.05, names: names(), rod, speed: 16 });
    fishing.draw(t, { x: tip[0], y: tip[1] });
    $('skyCount').textContent = String(F.caught);
    if (!paused) {
      const left = Math.max(0, Math.ceil(DAY * (1 - F.day)));
      $('skyClock').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    }
    if (k && k.phase === 'fight' && F.holding && Math.random() < dt * 14) sfx('reel');
  }
  if (fade) { g.globalAlpha = Math.max(0, Math.min(1, fade.k)); g.fillStyle = fade.color; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  place();
}
// the names on the city's billboards: the companies whose jobs are in today's sky
let namesCache = null;
function names() {
  if (namesCache) return namesCache;
  const by = {};
  for (const j of dock.lake || []) by[j.company] = (by[j.company] || 0) + 1;
  const list = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 24).map(([n]) => n);
  namesCache = list.length ? list : null;
  return namesCache || ['Goggle', 'Amazoom', 'Snoozle', 'Facepalm'];
}
requestAnimationFrame(frame);

// ?debug: the game's own hands, to try it where a page draws no frames
if (new URLSearchParams(location.search).has('debug')) window.game = { fishing, dock, office, room, pier, sky, go, get scene() { return scene; }, all, has, K: () => K,
  // press a named thing of the scene, as a hand would
  // run the game for a while where the page draws no frames of its own
  run(sec) { let now = last; for (let i = 0; i < sec * 20; i++) { now += 50; tick(now); } return scene; },
  press(name) {
    const s = (scene === 'office' ? room : pier).L.spots[name]; if (!s) return false;
    const r = cv.getBoundingClientRect(), x = r.left + (s.x + s.w / 2) * K, y = r.top + (s.y + s.h / 2) * K;
    cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true })); addEventListener; dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y }));
    return name;
  } };
