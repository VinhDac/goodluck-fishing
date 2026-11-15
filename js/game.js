// THE GAME, ONE MORNING OF IT (PLAN.md 14 and 17): the office at night (the duck asleep, the person's own numbers in the
// room), the golden escalator up to the cloud pier (the first time: the bait, the hook; after that the gear is remembered and
// the duck goes straight out), the lake above the city (the search fills it; the duck fishes, or the person does), and the
// results: «Catch of the day» when the search is done and the bucket has a dozen, the report at sunset. Mouse alone (a
// finger on a phone). The picture fills the window, drawn small and scaled up whole so each pixel stays sharp.

import { me, begin } from './setup.js';
import { user, saveProfile, postcard } from './account.js';
import { sync, all, has } from './box.js';
import { openReport } from './report.js';
import { makeRoom } from './room.js';
import { makePier } from './pier.js';
import { makeDeep } from './deep.js';
import { makeFishing, shortOf } from './fishing.js';
import { readLake, boardOf, baitsOf, HOOKS } from './lake.js';
import { numbers, fished } from './progress.js';
import { sfx, soundOn, setSound } from './sound.js';
import { inApp, boats, moored, sail, callHome, stillOpen } from './fleet.js';

const $ = (id) => document.getElementById(id);
const cv = $('scene'), g = cv.getContext('2d');
const touch = matchMedia('(pointer: coarse)').matches, PRESS = touch ? 'Tap' : 'Click';
let person = me;                                                       // the CV's skills, the titles, the place (setup.js)

// ---- the stage: a small canvas the shape of the window, scaled up whole -------------------------------------------------
let W = 384, H = 216, K = 1;
const room = makeRoom(g), pier = makePier(g), deep = makeDeep(g);
const fishing = makeFishing({
  onCard: (job, how, kind, checked) => card(job, how, kind, checked),
  onSay: (t, who, secs) => talk(t, who, secs),
  onSunset: (r) => sunset(r),
  onDone: (r) => done(r),
  onCheck: inApp ? (job) => stillOpen(job.id) : undefined,              // in the app, a hooked fish's posting is asked if it is still up
});
function fit() {
  const iw = innerWidth, ih = innerHeight, wide = iw >= ih;
  const r = wide ? ih / 216 : iw / 195;                                // about 216 high on a computer, 195 wide on a phone
  K = r >= 2 ? Math.floor(r) : r;
  W = Math.ceil(iw / K); H = Math.ceil(ih / K);
  cv.width = W; cv.height = H;
  cv.style.width = `${W * K}px`; cv.style.height = `${H * K}px`;
  g.imageSmoothingEnabled = false;
  for (const s of [room, pier, deep]) s.layout(W, H);
  fishing.resize(W, H);
}
const logical = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / K, y: (e.clientY - r.top) / K }; };
const inside = (p, s) => s && p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h;
const hit = (p, spots) => Object.entries(spots || {}).reverse().find(([, s]) => inside(p, s));

// ---- what is said: in the office and on the pier a bubble over the speaker; out fishing, the talk box at the bottom -----------
let saying = { until: 0, who: null }, talking = 0;
function say(text, who = 'duck', secs) {
  const b = $('say');
  b.textContent = text; b.hidden = !text;
  saying = { until: performance.now() + (secs || Math.min(9, 2.5 + text.length / 16)) * 1000, who };
  place();
}
function talk(text, who = 'duck', secs) {
  if (!text) return;
  if (scene !== 'sea') return say(text, who === 'gull' ? 'gull' : 'duck', secs);
  $('talkText').textContent = text;
  face(who);
  $('talk').hidden = false;
  talking = performance.now() + (secs || Math.min(8, 2.5 + text.length / 18)) * 1000;
  place();
}
function face(who) {                                                    // the speaker's face, in the talk box
  const c = $('talkFace').getContext('2d');
  c.clearRect(0, 0, 16, 16); c.fillStyle = '#9fd4f8'; c.fillRect(0, 0, 16, 16);
  if (who === 'gull') {
    c.fillStyle = '#f6f6f8'; c.beginPath(); c.arc(8, 9, 5, 0, 7); c.fill();
    c.fillStyle = '#f0b030'; c.fillRect(12, 9, 4, 2); c.fillStyle = '#1b1f3a'; c.fillRect(9, 7, 1, 2);
    c.fillStyle = '#1b2a5a'; c.fillRect(4, 2, 9, 3); c.fillStyle = '#f4f4f4'; c.fillRect(4, 5, 9, 1);
  } else {
    c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(8, 8, 6, 0, 7); c.fill();
    c.fillStyle = '#f2802a'; c.fillRect(12, 8, 4, 2); c.fillStyle = '#1b1f3a'; c.fillRect(9, 5, 1, 2);
  }
}
function place() {
  const t = $('talk');
  if (!t.hidden) {
    if (scene !== 'sea' || performance.now() > talking) t.hidden = true;
    else { const L = deep.L.talk; Object.assign(t.style, { left: `${L.x * K}px`, top: `${L.y * K}px`, width: `${L.w * K}px`, minHeight: `${L.h * K}px` }); }
  }
  const b = $('say');
  if (b.hidden) return;
  if (performance.now() > saying.until || scene === 'sea') { b.hidden = true; return; }
  const at = scene === 'office' ? room.L.head : saying.who === 'gull' ? pier.L.gullHead : pier.L.duckHead || pier.L.gullHead;
  if (!at) return;
  const r = b.getBoundingClientRect(), maxX = innerWidth - r.width - 8;
  b.style.left = `${Math.max(8, Math.min(maxX, at.x * K - 24))}px`;
  b.style.top = `${Math.max(8, at.y * K - r.height - 10)}px`;
  b.classList.toggle('below', at.y * K - r.height - 10 < 8);
}

// ---- the gear (PLAN.md 17, D): the bait and the hook, remembered from one morning to the next ---------------------------------
const GEAR = 'glf.gear';
const gear = (() => { try { return JSON.parse(localStorage.getItem(GEAR)); } catch (e) { return null; } })();
function saveGear() { try { localStorage.setItem(GEAR, JSON.stringify({ bait: dock.bait, hook: dock.hook })); } catch (e) { /* this visit alone */ } }

// ---- the scenes and the moves between them ------------------------------------------------------------------------------
let scene = 'office', t0 = performance.now(), fade = null;            // fade: { color, k, dir, then }
const office = { pose: 'sleep', k: 0, n: numbers(), talkAt: 6 };
const dock = { pose: 'stand', k: 0, board: null, loading: false, skills: [], bait: gear ? gear.bait : '', hook: gear ? gear.hook : 'small', lake: null, bottles: [] };
function go(to, color = '#ffffff') {
  fade = { color, k: 0, dir: 1, then: () => { scene = to; enter(to); fade.dir = -1; } };
}
function enter(to) {
  $('say').hidden = true; $('talk').hidden = true;
  document.body.dataset.scene = to;
  if (to === 'office') { office.pose = 'sleep'; office.k = 0; office.n = numbers(); office.talkAt = 3; corner(); }
  if (to === 'pier') arrive();
  if (to === 'sea') setSail();
}

// ---- THE OFFICE: the duck asleep, its numbers in the room; a press on it, the escalator, or «Go fishing», and up it goes -------
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
function goFishing() {
  if (!person) { say('CV required. Of course it is. Give me your CV first.', 'duck'); begin(asked); return; }
  if (scene !== 'office' || office.pose !== 'sleep') return;
  sfx('quack');
  office.pose = 'wake'; office.k = 0;
  say(['An escalator. To the sky. …Sure, why not.', 'Huh? Oh. The lake again. Let us go fishing.', 'Five more minutes… no. Jobs. Up.'][Math.floor(Math.random() * 3)], 'duck', 3);
}
function officePress(p) {
  const h = hit(p, room.L.spots);
  if (!h) return;
  const [name] = h;
  if (name === 'duck' || name === 'escalator' || name === 'sign' || name === 'rope') return goFishing();
  const f = THINGS[name];
  if (f) say(f(office.n), 'duck');
}
function officeStep(dt, t) {
  const quick = !!gear;                                                // after the first morning: a quick way up, and straight out
  if (office.pose === 'wake' && (office.k += dt) > (quick ? 0.8 : 1.6)) { office.pose = 'walk'; office.k = 0; }
  else if (office.pose === 'walk' && (office.k += dt / (quick ? 1.4 : 2.2)) >= 1) { office.pose = 'ride'; office.k = 0; sfx('hum'); }
  else if (office.pose === 'ride' && (office.k += dt / (quick ? 1.8 : 2.6)) >= 1 && !fade) go(quick ? 'sea' : 'pier', '#ffffff');
  if (office.pose === 'sleep' && t > office.talkAt && $('say').hidden && !anySheet()) {      // talking in its sleep
    office.talkAt = t + 9 + Math.random() * 6;
    say(person ? SNORES[Math.floor(Math.random() * SNORES.length)] : 'zzz… a CV… I need a CV… zzz', 'duck', 4.5);
  }
}
const anySheet = () => ['paper', 'notes', 'map', 'postcard', 'report', 'catch'].some((id) => !$(id).hidden);

// ---- THE PIER (the first morning): the sky is read; the board turns; a bait, a hook, then the boat -------------------------------
function skillsFor(lake) {                                             // the bait jars: the CV's skills the day's jobs ask most
  const s = baitsOf(lake || [], person).slice(0, 4);
  for (const k of person.skills || []) if (s.length < 4 && !s.includes(k)) s.push(k);
  return s;
}
async function arrive() {
  Object.assign(dock, { pose: 'stand', k: 0, loading: true, board: null });
  namesCache = null;
  say('Huh. So this is where jobs come from.', 'duck', 3);
  try {
    const { lake, bottles } = await readLake(person);
    dock.lake = lake; dock.bottles = bottles;
    dock.board = boardOf(lake, person);
    if (inApp) {                                                       // the departures are the fleet: each boat, its boards
      await moored();
      dock.board = Object.values(boats).map((b) => [b.name.toUpperCase(), b.total || '', 'READY']);
    }
    dock.skills = skillsFor(lake);
    if (!dock.skills.includes(dock.bait)) dock.bait = dock.skills[0] || '';
  } catch (e) {
    dock.lake = []; dock.bottles = []; dock.board = [['THE SKY', 0, 'CLOSED']];
    say(`The sky could not be read (${e.message}). Try again in a while.`, 'gull');
  }
  dock.loading = false; sfx('flaps');
  setTimeout(() => { if (scene === 'pier' && dock.pose === 'stand') say(gullTip(), 'gull', 6); }, 3200);
}
function gullTip() {
  if (inApp) return `Ahoy! Your fleet reads ${(dock.board || []).reduce((a, r) => a + (+r[1] || 0), 0).toLocaleString('en-GB')} company boards the moment you sail. Pick a bait and a hook, then ${PRESS.toLowerCase()} the boat.`;
  const n = dock.lake ? dock.lake.length : 0, gold = dock.lake ? dock.lake.filter((j) => j.size === 'gold').length : 0;
  if (!n) return 'Ahoy. A quiet sky today: nothing new for you. Come back tomorrow, the harbour will be busier.';
  return `Ahoy! ${n} jobs out today, ${gold} golden. Pick a bait jar (a skill from your CV) and a hook, then ${PRESS.toLowerCase()} the boat.`;
}
const PIER_SAYS = {
  board: () => (inApp ? 'The departures: your fleet. Each boat reads one kind of company job board, live, the moment you sail.'
    : 'The departures: how many jobs are out today where you look, and how many are golden: the ones that fit you.'),
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
    return say(`Bait: ${dock.bait}. ${n} of today's jobs ask for it: they come to it first, and they bite faster.`, 'gull');
  }
  if (name.startsWith('hook:')) {
    dock.hook = name.slice(5); sfx('clink');
    const min = HOOKS[dock.hook], n = (dock.lake || []).filter((j) => (min ? j.fit != null && j.fit >= min : true)).length;
    return say(min ? `The ${dock.hook} hook: it holds only fish that fit you ${min}% or more. ${n} of them today.` : `The small hook: it holds every fish, ${n} today.`, 'gull');
  }
  if (name === 'boat' || name === 'sign') {
    if (dock.loading) return say('Wait for the board: the sky is still being read.', 'gull');
    dock.pose = 'walk'; dock.k = 0; sfx('quack'); saveGear();
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

// ---- THE LAKE: the search fills it; the duck fishes, or the person does ------------------------------------------------------
const SYSTEM = { gh: 'greenhouse', lv: 'lever', ab: 'ashby' };
let found = [];
async function setSail() {
  fished(); saveGear();
  if (!dock.lake) {                                                    // straight out (the pier skipped): the store read now
    try { const r = await readLake(person); dock.lake = r.lake; dock.bottles = r.bottles; } catch (e) { dock.lake = []; dock.bottles = []; }
  }
  if (!dock.skills.length) dock.skills = skillsFor(dock.lake);
  if (!dock.bait) dock.bait = dock.skills[0] || '';
  found = []; namesCache = null;
  fishing.start({ W, H, L: deep.L }, { lake: inApp ? [] : dock.lake, bottles: dock.bottles || [], bait: dock.bait, hook: dock.hook, stream: inApp, skills: person.skills });
  if (!inApp) return;
  // the boards the shared store knows have jobs for them, read first
  const first = [...new Set((dock.lake || []).map((j) => { const [p, slug] = j.id.split(':'); return SYSTEM[p] ? `${SYSTEM[p]}:${slug}` : null; }).filter(Boolean))];
  sail(person, first, {
    job: (j) => { found.push(j); if (found.length % 15 === 0) namesCache = null; fishing.feed(j); },
    boat: (e) => {
      const b = boats[e.boat] || { name: e.boat, read: 0 };
      if (e.kind === 'home' && !e.stopped && !e.found) talk(`Nothing on the ${b.name} boards for you today. «Hiring freeze», they say.`, 'gull', 3.5);
    },
    allHome: () => {
      fishing.fleetHome();
      const sn = fishing.F.sonar;
      talk(`The search is done: ${sn.found} jobs for you, ${sn.gold} golden. The lake is stocked.`, 'gull', 4);
    },
  }).catch((e) => { fishing.fleetHome(); talk(`The search could not start (${e.message}).`, 'gull'); });
}
const ago = (ms) => { const h = Math.max(0, (Date.now() - ms) / 36e5), n = h < 48 ? Math.round(h) : Math.round(h / 24), u = h < 48 ? 'hour' : 'day'; return h < 1 ? 'posted within the hour' : `posted ${n} ${u}${n === 1 ? '' : 's'} ago`; };
function card(job, how, kind, checked) {
  const mine = new Set(person.skills || []), days = Math.round((Date.now() - job.posted) / 864e5);
  $('ctKicker').textContent = how === 'bottle' ? 'A message in a bottle' : kind === 'ghost' ? `A ghost: posted ${days} days ago and still up` : job.size === 'gold' ? 'A golden one!' : job.size === 'big' ? 'A big one' : 'You caught';
  $('ctTitle').textContent = job.title;
  $('ctWho').textContent = job.company;
  $('ctMeta').textContent = [job.place, ago(job.posted), checked === true ? 'still open today' : ''].filter(Boolean).join(' · ');
  const have = Object.keys(job.skills || {}).filter((k) => mine.has(k)), miss = Object.keys(job.skills || {}).filter((k) => !mine.has(k));
  $('ctFit').textContent = job.fit == null ? 'Its posting names too little to weigh: open it to judge.'
    : `Fits you ${job.fit}%. Your CV says: ${have.slice(0, 5).join(', ') || 'none of it'}.${miss.length ? ` It asks too: ${miss.slice(0, 5).join(', ')}.` : ''}`
      + (how === 'bottle' ? ' Not one of your titles, but your CV fits it.' : '');
  $('ctOpen').href = job.url;
  $('catch').hidden = false; $('talk').hidden = true;
  sfx(job.size === 'gold' ? 'fanfare' : 'catch');
}
function answer(keep) {
  fishing.answer(keep);
  $('catch').hidden = true;
  talk(keep ? 'In the bucket.' : 'Thrown back. Not for us.', 'duck', 1.6);
}
function homeFromLake() {                                             // home: the fleet called in, the golden ones ashore
  if (inApp) callHome();
  fishing.sunset(true); fishing.stop();
  go('office', '#0c0f24');
}
function done({ caught, found: n, gold }) {                          // the search done and a dozen in the bucket: the results
  sfx('fanfare');
  openReport(`Catch of the day: ${caught} caught this morning, from ${n} jobs found (${gold} golden)`, null, {
    pond: fishing.rest(),
    actions: [{ label: 'Keep fishing', fn: () => talk('Back to it. The sun sets on its own.', 'duck', 2.5) }, { label: 'Home', quiet: true, fn: homeFromLake }],
  });
}
function sunset({ caught, ashore }) {
  if (inApp) callHome();
  sfx('dusk');
  openReport(`The sun has set: ${caught} caught${ashore ? `, ${ashore} golden washed ashore` : ''}`, null, {
    pond: fishing.rest(), actions: [{ label: 'Home', fn: () => { fishing.stop(); go('office', '#0c0f24'); } }],
  });
}
// the tackle bar: the bait, the hook, the net, who fishes, the bucket; and the sonar's speaker
function tool(name) {
  sfx('clink');
  if (name === 'bar:bait') {
    const s = dock.skills.length ? dock.skills : person.skills || [];
    if (!s.length) return;
    dock.bait = s[(s.indexOf(dock.bait) + 1) % s.length]; fishing.setGear(dock.bait, null); saveGear();
    const n = fishing.rest().filter((j) => j.skills && j.skills[dock.bait]).length;
    return talk(`Bait: ${dock.bait} (${shortOf(dock.bait)}). ${n} of the lake's fish ask for it: they come to it first.`, 'duck', 3);
  }
  if (name === 'bar:hook') {
    const order = ['small', 'medium', 'big'];
    dock.hook = order[(order.indexOf(dock.hook) + 1) % 3]; fishing.setGear(null, dock.hook); saveGear();
    const min = HOOKS[dock.hook];
    return talk(min ? `The ${dock.hook} hook: it holds only fish that fit you ${min}% or more.` : 'The small hook: it holds every fish.', 'duck', 3);
  }
  if (name === 'bar:net') { if (fishing.net()) sfx('net'); return; }
  if (name === 'bar:who') return fishing.toggleWho();
  if (name === 'bar:bucket') return openReport('Your bucket', () => { office.n = numbers(); });
  if (name === 'sound') { setSound(!soundOn()); $('sound').textContent = `Sound: ${soundOn() ? 'on' : 'off'}`; sfx('quack'); }
}

// ---- the hands ----------------------------------------------------------------------------------------------------------------
cv.addEventListener('pointerdown', (e) => {
  if (fade || anySheet()) return;
  const p = logical(e);
  if (scene === 'office') return officePress(p);
  if (scene === 'pier') return pierPress(p);
  const h = hit(p, deep.L.spots);
  if (h && (h[0].startsWith('bar:') || h[0] === 'sound')) return tool(h[0]);
  fishing.down(p);
});
cv.addEventListener('pointermove', (e) => {
  const p = logical(e);
  if (scene === 'sea') fishing.move(p);
  const spots = scene === 'office' ? room.L.spots : scene === 'pier' ? pier.L.spots : deep.L.spots;
  const h = hit(p, spots);
  cv.style.cursor = h && (scene !== 'sea' || h[0].startsWith('bar:') || h[0] === 'sound') ? 'pointer' : scene === 'sea' ? 'crosshair' : 'default';
});
addEventListener('pointerup', () => { if (scene === 'sea') fishing.up(); });
addEventListener('pointercancel', () => { if (scene === 'sea') fishing.up(); });
$('ctKeep').addEventListener('click', () => answer(true));
$('ctThrow').addEventListener('click', () => answer(false));
$('sound').addEventListener('click', () => { setSound(!soundOn()); $('sound').textContent = `Sound: ${soundOn() ? 'on' : 'off'}`; sfx('quack'); });
$('sound').textContent = `Sound: ${soundOn() ? 'on' : 'off'}`;
$('bucket').addEventListener('click', () => openReport('Your bucket', () => { office.n = numbers(); }));
$('gofish').addEventListener('click', goFishing);

// ---- the CV and the account (PLAN.md 9): asked once; «My CV» asks again ---------------------------------------------------------
function asked(v) {
  person = JSON.parse(localStorage.getItem('glf.me') || 'null') || v;
  user().then((u) => { if (u) { saveProfile(person); ready(); } else postcard(ready); });
}
function ready() {
  $('mycv').hidden = false; $('bucket').hidden = false; $('gofish').hidden = false;
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
if (person) {
  $('mycv').hidden = false; $('bucket').hidden = false; $('gofish').hidden = false; corner();
  user().then((u) => { if (u) { saveProfile(person); sync().then(() => { office.n = numbers(); }); } });
} else setTimeout(() => begin(asked), 900);
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
    const F = fishing.F, paused = !$('catch').hidden || !$('report').hidden;
    if (inApp && F.on) {                                               // the sonar: the fleet's boards, read so far
      const b = Object.values(boats);
      F.sonar.read = b.reduce((a, x) => a + (x.read || 0), 0); F.sonar.total = b.reduce((a, x) => a + (x.total || 0), 0);
    }
    fishing.step(dt, paused);
    const st = F.on ? fishing.view(t, { names: names(), sound: soundOn() })
      : { day: 0.08, speed: 14, names: names(), fish: [], sonar: { what: inApp ? 'fleet' : 'store', clock: '8:00', sound: soundOn() }, tools: { baitShort: shortOf(dock.bait) } };
    fishing.setTip(deep.draw(W, H, t, st));
  }
  if (fade) { g.globalAlpha = Math.max(0, Math.min(1, fade.k)); g.fillStyle = fade.color; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  place();
}
// the names on the city's billboards: the companies whose jobs are in today's lake
let namesCache = null;
function names() {
  if (namesCache) return namesCache;
  const by = {};
  for (const j of inApp && found.length ? found : dock.lake || []) by[j.company] = (by[j.company] || 0) + 1;
  const list = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 24).map(([n]) => n);
  namesCache = list.length >= 6 ? list : null;                          // once there are enough to fill the city
  return namesCache || ['Goggle', 'Amazoom', 'Snoozle', 'Facepalm'];
}
requestAnimationFrame(frame);

// ?debug: the game's own hands, to try it where a page draws no frames
if (new URLSearchParams(location.search).has('debug')) window.game = { fishing, dock, office, room, pier, deep, go, get scene() { return scene; }, all, has, K: () => K,
  // run the game for a while where the page draws no frames of its own
  run(sec) { let now = last; for (let i = 0; i < sec * 20; i++) { now += 50; tick(now); } return scene; },
  // press a named thing of the scene, as a hand would
  press(name) {
    const s = (scene === 'office' ? room : scene === 'pier' ? pier : deep).L.spots[name]; if (!s) return false;
    const r = cv.getBoundingClientRect(), x = r.left + (s.x + s.w / 2) * K, y = r.top + (s.y + s.h / 2) * K;
    cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true })); dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y }));
    return name;
  },
  // press a point of the lake (in the scene's own pixels), holding for a while if asked
  tap(x, y, hold = 0) {
    const r = cv.getBoundingClientRect(), cx = r.left + x * K, cy = r.top + y * K;
    cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: cx, clientY: cy, bubbles: true }));
    if (hold) this.run(hold);
    dispatchEvent(new PointerEvent('pointerup', { clientX: cx, clientY: cy }));
  } };
