// THE GAME, ONE MORNING OF IT (PLAN.md 14, 17 and 18): the office at night (the duck asleep, the person's own numbers in the
// room), the golden escalator up to the cloud pier (the first morning; after that the duck goes straight out), the sky over
// the city (the search fills it with letters, each flying up from its company's roof; the duck catches them, or the person
// does), and the results: «Catch of the day» when the search is done and the bag holds a dozen, the report at sunset. Out
// in the sky: one line of how the search goes, top right, with the sound beside it; along the bottom AUTO, BAG, PIER and
// LOBBY. To the pier or the lobby and back loses nothing: the sky waits as it was, and the search goes on. Mouse alone (a
// finger on a phone). Drawn on the stage (js/stage.js): the office and the pier at their art's own size, set on the screen
// whole; the sky to the screen's own pixel, so nothing in it steps.

import { me, begin } from './setup.js';
import { user, saveProfile, postcard } from './account.js';
import { sync, all, has, add, todays } from './box.js';
import { openReport } from './report.js';
import { makeStage } from './stage.js';
import { makeRoom } from './room.js';
import { makePier } from './pier.js';
import { makeSky } from './sky.js';
import { makeLetters } from './letters.js';
import { readLake, boardOf, baitsOf, HOOKS } from './lake.js';
import { numbers, fished } from './progress.js';
import { sfx, soundOn, setSound } from './sound.js';
import { inApp, boats, moored, sail, callHome, stillOpen, openOut } from './fleet.js';

const $ = (id) => document.getElementById(id);
const cv = $('scene');
const touch = matchMedia('(pointer: coarse)').matches, PRESS = touch ? 'Tap' : 'Click';
const DAY = 480;                                                      // seconds of sun in a morning: eight minutes
const TARGET = 12;                                                    // in the bag, with the search done: the morning's results
const STORE_SPAN = 45;                                                // on the web, the day's store comes out over about this many seconds
const n = (v) => Number(v || 0).toLocaleString('en-GB');
let person = me;                                                       // the CV's skills, the titles, the place (setup.js)

// ---- the stage: the canvas the window's size in device pixels; the office and the pier drawn small, then set on it whole --------
const stage = makeStage(cv);
const art = document.createElement('canvas'), ag = art.getContext('2d');
let W = 384, H = 216;
const room = makeRoom(ag), pier = makePier(ag), sky = makeSky(stage);
const letters = makeLetters({
  onCard: (job, info) => card(job, info),
  onSay: (t, who, secs) => talk(t, who, secs),
  onBag: (job) => { add(job, 'caught', 'new'); bagCount(true); },      // kept: into the bag, from day to day (js/box.js)
  onAway: (job, status) => add(job, 'caught', status),                // not for me, or closed: put away, so it never comes again
  onCheck: inApp ? (job) => stillOpen(job.id) : undefined,             // in the app, a letter on the hook is asked if its posting is up
  onSunset: () => sunset(),
});
letters.onSound(sfx);
function fit() {
  stage.fit(); W = stage.W; H = stage.H;
  art.width = W; art.height = H; ag.imageSmoothingEnabled = false;
  room.layout(W, H); pier.layout(W, H); sky.layout(W, H);
  letters.resize(W, H);
}
const css = (v) => (v * stage.K) / stage.dpr;                          // art pixels, in the page's own
function show() { stage.g.imageSmoothingEnabled = false; stage.g.drawImage(art, 0, 0, art.width * stage.K, art.height * stage.K); }
const inside = (p, s) => s && p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h;
const hit = (p, spots) => Object.entries(spots || {}).reverse().find(([, s]) => inside(p, s));

// ---- what is said: in the office and on the pier a bubble over the speaker; in the sky, the talk box at the bottom left ------
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
  if (!t.hidden && (scene !== 'sea' || performance.now() > talking)) t.hidden = true;
  const b = $('say');
  if (b.hidden) return;
  if (performance.now() > saying.until || scene === 'sea') { b.hidden = true; return; }
  const at = scene === 'office' ? room.L.head : saying.who === 'gull' ? pier.L.gullHead : pier.L.duckHead || pier.L.gullHead;
  if (!at) return;
  const r = b.getBoundingClientRect(), maxX = innerWidth - r.width - 8;
  b.style.left = `${Math.max(8, Math.min(maxX, css(at.x) - 24))}px`;
  b.style.top = `${Math.max(8, css(at.y) - r.height - 10)}px`;
  b.classList.toggle('below', css(at.y) - r.height - 10 < 8);
}

// ---- the gear (PLAN.md 17, D): the bait and the hook, remembered from one morning to the next; also that one has been out -----
const GEAR = 'glf.gear';
const gear = (() => { try { return JSON.parse(localStorage.getItem(GEAR)); } catch (e) { return null; } })();
function saveGear() { try { localStorage.setItem(GEAR, JSON.stringify({ bait: dock.bait, hook: dock.hook })); } catch (e) { /* this visit alone */ } }

// ---- the scenes and the moves between them ------------------------------------------------------------------------------
let scene = 'office', t0 = performance.now(), fade = null;            // fade: { color, k, dir, then }
const office = { pose: 'sleep', k: 0, n: numbers(), talkAt: 6 };
const dock = { pose: 'stand', k: 0, board: null, loading: false, skills: [], bait: gear ? gear.bait : '', hook: gear ? gear.hook : 'small', lake: null, bottles: [] };
let trip = null;                                                       // the morning out: { done, store, pace }; null in none
const out = () => !!trip && letters.F.on;                              // a morning is on: the sky waits for the duck to come back
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
  say(out() ? 'My letters! Still up there, waiting. Back I go.'
    : ['An escalator. To the sky. …Sure, why not.', 'Huh? Oh. The letters again. Up we go.', 'Five more minutes… no. Jobs. Up.'][Math.floor(Math.random() * 3)], 'duck', 3);
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
  const quick = !!gear || out();                                       // after the first morning, or back to one: quick, and straight out
  if (office.pose === 'wake' && (office.k += dt) > (quick ? 0.8 : 1.6)) { office.pose = 'walk'; office.k = 0; }
  else if (office.pose === 'walk' && (office.k += dt / (quick ? 1.4 : 2.2)) >= 1) { office.pose = 'ride'; office.k = 0; sfx('hum'); }
  else if (office.pose === 'ride' && (office.k += dt / (quick ? 1.8 : 2.6)) >= 1 && !fade) go(quick ? 'sea' : 'pier', '#ffffff');
  if (office.pose === 'sleep' && t > office.talkAt && $('say').hidden && !anySheet()) {      // talking in its sleep
    office.talkAt = t + 9 + Math.random() * 6;
    say(person ? SNORES[Math.floor(Math.random() * SNORES.length)] : 'zzz… a CV… I need a CV… zzz', 'duck', 4.5);
  }
}
const anySheet = () => ['paper', 'notes', 'map', 'postcard', 'report', 'catch'].some((id) => !$(id).hidden);

// ---- THE PIER (the first morning; and from the sky, by PIER): the board turns; a bait, a hook, then the boat ---------------------
function skillsFor(lake) {                                             // the bait jars: the CV's skills the day's jobs ask most
  const s = baitsOf(lake || [], person).slice(0, 4);
  for (const k of person.skills || []) if (s.length < 4 && !s.includes(k)) s.push(k);
  return s;
}
function fleetBoard() {                                                // the departures in the app: each boat, its boards, where it is
  return Object.values(boats).map((b) => [b.name.toUpperCase(), b.total || '', b.state === 'home' ? 'HOME' : b.state === 'out' ? 'AT SEA' : 'READY']);
}
async function arrive() {
  Object.assign(dock, { pose: 'stand', k: 0 });
  if (out()) {                                                         // back from the sky: the morning goes on out there
    dock.loading = false;
    if (inApp) dock.board = fleetBoard();
    else if (!dock.board) dock.board = boardOf(dock.lake || [], person);
    say('The boat is waiting. My letters are still up there.', 'duck', 3);
    return;
  }
  Object.assign(dock, { loading: true, board: null });
  say('Huh. So this is where jobs come from.', 'duck', 3);
  try {
    const { lake, bottles } = await readLake(person);
    dock.lake = lake; dock.bottles = bottles;
    dock.board = boardOf(lake, person);
    if (inApp) {                                                       // the departures are the fleet: each boat, its boards
      await moored();
      dock.board = fleetBoard();
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
  if (out()) return `Ahoy! Your letters are still in the sky. ${PRESS} the boat to go back out.`;
  if (inApp) return `Ahoy! Your fleet reads ${(dock.board || []).reduce((a, r) => a + (+r[1] || 0), 0).toLocaleString('en-GB')} company boards the moment you sail. Pick a bait and a hook, then ${PRESS.toLowerCase()} the boat.`;
  const k = dock.lake ? dock.lake.length : 0, gold = dock.lake ? dock.lake.filter((j) => j.size === 'gold').length : 0;
  if (!k) return 'Ahoy. A quiet sky today: nothing new for you. Come back tomorrow, the harbour will be busier.';
  return `Ahoy! ${k} jobs out today, ${gold} golden. Pick a bait jar (a skill from your CV) and a hook, then ${PRESS.toLowerCase()} the boat.`;
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
    const k = (dock.lake || []).filter((j) => j.skills && j.skills[dock.bait]).length;
    return say(`Bait: ${dock.bait}. ${k} of today's jobs ask for it: they come to it first, and they bite faster.`, 'gull');
  }
  if (name.startsWith('hook:')) {
    dock.hook = name.slice(5); sfx('clink');
    const min = HOOKS[dock.hook], k = (dock.lake || []).filter((j) => (min ? j.fit != null && j.fit >= min : true)).length;
    return say(min ? `The ${dock.hook} hook: it holds only fish that fit you ${min}% or more. ${k} of them today.` : `The small hook: it holds every fish, ${k} today.`, 'gull');
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

// ---- THE SKY: the search fills it with letters; the duck catches them, or the person does -----------------------------------
const SYSTEM = { gh: 'greenhouse', lv: 'lever', ab: 'ashby' };
async function setSail() {
  bagCount(); autoLabel();
  if (out()) { talk('Back in the sky. Where were we?', 'duck', 2.5); return; }   // the same morning, as it was left
  fished(); saveGear();
  const my = trip = { done: false, store: null, pace: null };
  letters.start({ W, H, L: sky.L }, { skills: person.skills, auto: true, dayLength: DAY, known: has });
  autoLabel();
  talk(inApp ? 'The fleet is out. Each letter it finds flies up from its company\'s roof: tap one, or let me.'
    : 'Here we are. The letters will come up from the roofs: tap one, or let me.', 'duck', 4.5);
  if (!dock.lake) {                                                    // straight out (the pier skipped): the store read now
    try { const r = await readLake(person); dock.lake = r.lake; dock.bottles = r.bottles; } catch (e) { dock.lake = []; dock.bottles = []; }
  }
  if (trip !== my || !letters.F.on) return;                            // home again meanwhile
  letters.give({ bottles: dock.bottles || [] });
  if (!inApp) return paceStore(my, dock.lake || []);
  // the boards the shared store knows have jobs for them, read first
  const first = [...new Set((dock.lake || []).map((j) => { const [p, slug] = j.id.split(':'); return SYSTEM[p] ? `${SYSTEM[p]}:${slug}` : null; }).filter(Boolean))];
  sail(person, first, {
    job: (j) => { if (trip === my) letters.feed(j); },
    boat: () => {},
    allHome: () => { if (trip === my) searchDone(); },
  }).catch((e) => {                                                   // the fleet would not go out: today's shared store instead
    if (trip !== my) return;
    talk(`The fleet could not go out (${e.message}). Today's store instead.`, 'gull', 4.5);
    paceStore(my, dock.lake || []);
  });
}
// on the web there is no fleet: the day's store, read at once, comes out over a while, in the order a search finds jobs
function paceStore(my, lake) {
  const order = lake.slice();
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  my.store = { fed: 0, total: order.length };
  if (!order.length) return searchDone();
  const from = performance.now();
  my.pace = setInterval(() => {
    if (trip !== my || !letters.F.on) { clearInterval(my.pace); return; }
    const due = Math.min(order.length, Math.ceil((order.length * (performance.now() - from)) / (STORE_SPAN * 1000)));
    while (my.store.fed < due) letters.feed(order[my.store.fed++]);
    if (my.store.fed >= order.length) { clearInterval(my.pace); searchDone(); }
  }, 400);
}
function searchDone(quiet) {
  const F = letters.F;
  if (!F.on || !F.waiting) return;
  letters.searchDone();
  if (!quiet) talk(`The search is done: ${n(F.found)} letters for you, ${n(F.gold)} golden. The city slows, and stops.`, 'gull', 4.5);
}
const ago = (ms) => { const h = Math.max(0, (Date.now() - ms) / 36e5), k = h < 48 ? Math.round(h) : Math.round(h / 24), u = h < 48 ? 'hour' : 'day'; return h < 1 ? 'posted within the hour' : `posted ${k} ${u}${k === 1 ? '' : 's'} ago`; };
function card(job, { kind, checked } = {}) {                           // the letter opened: what the job is, and how it fits
  const mine = new Set(person.skills || []), days = Math.round((Date.now() - job.posted) / 864e5);
  $('ctKicker').textContent = kind === 'gull' ? 'The gull brought this one' : kind === 'gold' ? 'A golden one!'
    : kind === 'old' ? `An old letter: posted ${days} days ago, still up` : 'A letter for you';
  $('ctTitle').textContent = job.title;
  $('ctWho').textContent = job.company;
  $('ctMeta').textContent = [job.place, ago(job.posted), checked === true ? 'still open today' : ''].filter(Boolean).join(' · ');
  const asks = Object.keys(job.skills || {}), have = asks.filter((k) => mine.has(k)), miss = asks.filter((k) => !mine.has(k));
  $('ctFit').textContent = job.fit == null ? 'Its posting names too little to weigh: open it to judge.'
    : `Fits you ${job.fit}%. Your CV says: ${have.slice(0, 5).join(', ') || 'none of it'}.${miss.length ? ` It asks too: ${miss.slice(0, 5).join(', ')}.` : ''}`
      + (kind === 'gull' ? ' Not one of your titles, but your CV fits it.' : '');
  $('ctOpen').href = job.url;
  $('catch').hidden = false; $('talk').hidden = true;
}
function answer(keep) {
  $('catch').hidden = true;
  letters.answer(keep);
  talk(keep ? 'In the bag.' : 'Not for us. Put away.', 'duck', 1.6);
}

// ---- along the bottom: AUTO, BAG, PIER, LOBBY; top right, how the search goes, and the sound -----------------------------------
let bagN = 0;
function bagCount(bump) {                                              // the BAG button: what is in the bag today
  bagN = todays().length;
  const b = $('bag');
  b.textContent = `BAG ${bagN}`;
  if (bump) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
}
function autoLabel() { const on = letters.F.auto !== false; $('auto').textContent = on ? 'AUTO ON' : 'AUTO OFF'; $('auto').classList.toggle('on', on); }
let said = '', barAt = '';
function progress() {                                                  // one line: «Searching · 1,240 of 2,840 boards · 312 letters»
  const F = letters.F;
  let text = 'Getting ready…', k = 0;
  if (F.on && !F.waiting) { text = `Search done · ${n(F.found)} letters`; k = 1; }
  else if (F.on && inApp && !(trip && trip.store)) {
    const b = Object.values(boats), read = b.reduce((a, x) => a + (x.read || 0), 0), total = b.reduce((a, x) => a + (x.total || 0), 0);
    text = total ? `Searching · ${n(read)} of ${n(total)} boards · ${n(F.found)} letters` : `Searching · ${n(F.found)} letters`;
    k = total ? read / total : 0;
  } else if (F.on && trip && trip.store) { text = `Searching · ${n(F.found)} letters`; k = trip.store.total ? trip.store.fed / trip.store.total : 0; }
  if (text !== said) { said = text; $('progText').textContent = text; }
  const w = `${Math.round(100 * Math.min(1, k))}%`;
  if (w !== barAt) { barAt = w; $('progBar').style.width = w; }
}
const free = () => !fade && !anySheet() && scene === 'sea';
$('auto').addEventListener('click', () => {
  if (!free()) return;
  letters.setAuto(!letters.F.auto); autoLabel(); sfx('clink');
  talk(letters.F.auto ? 'I will catch them as they come. Tap one any time.' : 'Your rod. Tap a letter and I cast to it.', 'duck', 2.5);
});
$('bag').addEventListener('click', () => {                             // the bag, and what is still in the sky
  if (!free()) return;
  sfx('clink');
  openReport('Your mailbag', () => bagCount(), { pond: letters.rest(), keep: (j) => letters.kept(j) });
});
$('toPier').addEventListener('click', () => { if (free()) { sfx('clink'); go('pier', '#ffffff'); } });
$('toLobby').addEventListener('click', () => { if (free()) { sfx('clink'); go('office', '#0c0f24'); } });

// ---- the end of a morning: «Catch of the day», the sunset, home -------------------------------------------------------------
function leftGolden() {                                                // the golden ones not caught: kept in the bag for later, unopened
  const left = letters.rest().filter((j) => j.size === 'gold' && !has(j.id));
  left.forEach((j) => add(j, 'ashore'));
  return left.length;
}
function endMorning() {                                                // the fleet called in, the sky put away
  if (inApp) callHome();
  if (trip && trip.pace) clearInterval(trip.pace);
  letters.stop(); trip = null;
}
function homeFromSky() { leftGolden(); endMorning(); go('office', '#0c0f24'); }
function done() {                                                      // the search done and a dozen in the bag: the results
  sfx('fanfare');
  openReport(`Catch of the day: ${bagN} in the bag, from ${n(letters.F.found)} letters found`, () => bagCount(), {
    pond: letters.rest(), keep: (j) => letters.kept(j),
    actions: [{ label: 'Keep fishing', fn: () => { bagCount(); talk('Back to it. The sun sets on its own.', 'duck', 2.5); } }, { label: 'Home', quiet: true, fn: homeFromSky }],
  });
}
function sunset() {
  if (inApp) callHome();
  const left = leftGolden();
  bagCount(); sfx('dusk');
  openReport(`The sun has set: ${bagN} in the bag${left ? `, ${left} golden kept for you, unopened` : ''}`, null, {
    pond: letters.rest(), actions: [{ label: 'Home', fn: () => { endMorning(); go('office', '#0c0f24'); } }],
  });
}

// ---- the hands ----------------------------------------------------------------------------------------------------------------
cv.addEventListener('pointerdown', (e) => {
  if (fade || anySheet()) return;
  const p = stage.toArt(e);
  if (scene === 'office') return officePress(p);
  if (scene === 'pier') return pierPress(p);
  letters.tap(p);
});
cv.addEventListener('pointermove', (e) => {
  const p = stage.toArt(e);
  const on = scene === 'sea' ? !!letters.hit(p) : !!hit(p, scene === 'office' ? room.L.spots : pier.L.spots);
  cv.style.cursor = on ? 'pointer' : 'default';
});
$('ctKeep').addEventListener('click', () => answer(true));
$('ctThrow').addEventListener('click', () => answer(false));
$('ctOpen').addEventListener('click', (e) => { e.preventDefault(); openOut($('ctOpen').href); });   // outside the game, never in its place
function soundLabels() { $('sound').textContent = `Sound: ${soundOn() ? 'on' : 'off'}`; $('seaSound').textContent = soundOn() ? '♪ on' : '♪ off'; }
for (const id of ['sound', 'seaSound']) $(id).addEventListener('click', () => { setSound(!soundOn()); soundLabels(); sfx('quack'); });
soundLabels();
$('bucket').addEventListener('click', () => openReport('Your bucket', () => { office.n = numbers(); }));
$('gofish').addEventListener('click', goFishing);

// ---- the CV and the account (PLAN.md 9): asked once; «My CV» asks again ---------------------------------------------------------
function asked(v) {
  person = JSON.parse(localStorage.getItem('glf.me') || 'null') || v;
  if (trip) { endMorning(); dock.lake = null; dock.bottles = []; }     // a new CV: the morning out was weighed against the old one
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
function tick(now, step) {
  const dt = step ?? Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  const t = (now - t0) / 1000;
  if (fade) {
    fade.k += dt / 0.7 * fade.dir;
    if (fade.k >= 1 && fade.dir > 0) { fade.k = 1; fade.then(); }
    else if (fade.k <= 0 && fade.dir < 0) fade = null;
  }
  if (scene === 'office') {
    officeStep(dt, t);
    room.draw(W, H, t, { n: office.n, open: !!person, duck: { pose: office.pose, k: office.k } });
    show();
  } else if (scene === 'pier') {
    pierStep(dt);
    if (inApp && out()) dock.board = fleetBoard();                     // the fleet still out: the board as it goes
    pier.draw(W, H, t, { board: dock.board, loading: dock.loading, skills: dock.skills, bait: dock.bait, hook: dock.hook, duck: { pose: dock.pose, k: dock.k } });
    show();
  } else if (letters.F.t !== undefined) {                              // (put away on the way home, it is still drawn as the light goes)
    const F = letters.F, held = anySheet();
    letters.step(dt, held);
    sky.draw(letters.view());
    progress();
    // the search done and a dozen in the bag (or nothing left in the sky): the morning's results
    if (trip && F.on && !trip.done && !F.over && !F.waiting && !held && !fade && !letters.busy() && (bagN >= Math.min(TARGET, F.found) || !letters.left())) {
      trip.done = true; done();
    }
  }
  if (fade) { stage.g.globalAlpha = Math.max(0, Math.min(1, fade.k)); stage.fill(fade.color); stage.g.globalAlpha = 1; }
  place();
}
requestAnimationFrame(frame);

// ?debug: the game's own hands, to try it where a page draws no frames
if (new URLSearchParams(location.search).has('debug')) window.game = { letters, sky, stage, dock, office, room, pier, go, get scene() { return scene; }, get trip() { return trip; }, all, has, todays,
  // run the game for a while where the page draws no frames of its own, in steps of dt seconds
  run(sec, dt = 0.05) { let now = last; for (let i = 0; i < sec / dt; i++) { now += dt * 1000; tick(now, dt); } return scene; },
  // press a named thing of the office or the pier, as a hand would
  press(name) {
    const s = (scene === 'office' ? room : pier).L.spots[name]; if (!s) return false;
    const r = cv.getBoundingClientRect(), x = r.left + css(s.x + s.w / 2), y = r.top + css(s.y + s.h / 2);
    cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
    return name;
  },
  // press a point of the sky, in the scene's own pixels
  tap(x, y) {
    const r = cv.getBoundingClientRect();
    cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + css(x), clientY: r.top + css(y), bubbles: true }));
  } };
