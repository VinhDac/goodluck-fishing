// THE GAME, ONE MORNING OF IT (PLAN.md 19): the duck has fainted at its desk at 3:47 in the morning. A press on it and its soul
// comes up out of it, looks back at itself, shrugs, and floats over to the golden escalator, which takes it up, slowly, as an
// escalator does, through the building and the night to HEAVEN's pier at dawn. The gull keeps the gate. The boat takes it
// out over the city, where the search fills the sky with letters, each flying up from its company's roof; the duck fishes
// them, a cast, a wait, a bite, a reel, or lets the duck fish by itself. Coming home is the same way back: the boat sails back
// in to the pier, the escalator goes down, the soul slips back into the body, the duck wakes with a start (the clock has
// moved on by the minutes spent up there), and the letters are in the tray on its desk: real ones. It reads them there, one at
// a time: Keep (pinned to the board, to apply to), Not for me, Open. The sun sets eight minutes into a morning, and the boat
// goes home by itself. Mouse alone, or a finger. Drawn on the stage (js/stage.js): the office and the pier at their art's
// size, set on the screen whole; the escalator's long way and the sky to the screen's own pixel, so nothing in them steps.

import { me, begin } from './setup.js';
import { user, saveProfile, postcard } from './account.js';
import { sync, all, has, add, mark, todays } from './box.js';
import { openReport } from './report.js';
import { makeStage } from './stage.js';
import { makeRoom } from './room.js';
import { makePier } from './pier.js';
import { makeSky } from './sky.js';
import { makeRise, RIDE } from './rise.js';
import { makeLetters, JUNK } from './letters.js';
import { makeCatchUI } from './catchui.js';
import { readLake, boardOf } from './lake.js';
import { numbers, fished } from './progress.js';
import { sfx, soundOn, setSound, setMood, playMusic } from './sound.js';
import { inApp, boats, moored, sail, callHome, stillOpen, openOut } from './fleet.js';

const $ = (id) => document.getElementById(id);
const cv = $('scene');
const touch = matchMedia('(pointer: coarse)').matches, PRESS = touch ? 'Tap' : 'Click';
const DAY = 480;                                                      // seconds of sun in a morning: eight minutes
const TARGET = 12;                                                    // in the bag, with the search done: a good haul
const STORE_SPAN = 45;                                                // on the web, the day's store comes out over about this many seconds
const n = (v) => Number(v || 0).toLocaleString('en-GB');
const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return v; };
let person = me;                                                       // the CV's skills, the titles, the place (setup.js)
const been = () => !!(store('glf.went') || store('glf.gear'));           // up there before: the escalator can be walked up

// ---- the stage: the canvas the window's size in device pixels; the office and the pier drawn small, then set on it whole --------
const stage = makeStage(cv);
const art = document.createElement('canvas'), ag = art.getContext('2d');
let W = 384, H = 216;
const room = makeRoom(ag), pier = makePier(ag), sky = makeSky(stage), rise = makeRise(stage);
const letters = makeLetters({
  onSay: (t, who, secs) => talk(t, who, secs),
  onBag: (job) => { add(job, 'caught', 'new'); bagCount(); },       // into the bag: into the tray on the desk, from day to day
  onAway: (job, status) => putAway(job, status),                     // closed: put away, so it never comes again
  onCheck: inApp ? (job) => stillOpen(job.id) : undefined,             // in the app, a letter's posting is asked if it is still up
  onSunset: () => sunset(),
  onHome: () => { dock.fromSea = true; go('pier', '#ffffff'); },
  onShow: (job, info) => logShow(job, info),
  onJunk: (kind) => { const g = log(); g.junk[kind] = (g.junk[kind] || 0) + 1; saveLog(g); office.n.junk = Object.values(g.junk).reduce((a, b) => a + b, 0); talk('Into the junk drawer with it.', 'duck', 2); },
});
letters.onSound(sfx);
function fit() {
  stage.fit(); W = stage.W; H = stage.H;
  art.width = W; art.height = H; ag.imageSmoothingEnabled = false;
  room.layout(W, H); pier.layout(W, H); sky.layout(W, H); rise.layout(W, H);
  letters.resize(W, H);
}
const css = (v) => (v * stage.K) / stage.dpr;                          // art pixels, in the page's own
function show() { stage.g.imageSmoothingEnabled = false; stage.g.drawImage(art, 0, 0, art.width * stage.K, art.height * stage.K); }
const inside = (p, s) => s && p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h;
const hit = (p, spots) => Object.entries(spots || {}).reverse().find(([, s]) => inside(p, s));
const ui = makeCatchUI({
  toCss: (x, y) => ({ x: css(x), y: css(y) }), skills: () => new Set(person ? person.skills || [] : []),
  away: (job) => putAway(job, 'not_for_me'), open: (u) => openOut(u),
});
function putAway(job, status) { if (has(job.id)) mark(job.id, status); else add(job, 'caught', status); bagCount(); }

// ---- the logbook (PLAN.md 19.6): perfect catches, stamps found, the junk drawer, the best morning; kept on this device ------
const log = () => { try { return { perfect: 0, stamps: 0, junk: {}, ...(JSON.parse(store('glf.log') || '{}')) }; } catch (e) { return { perfect: 0, stamps: 0, junk: {} }; } };
const saveLog = (g) => store('glf.log', JSON.stringify(g));
function logShow(job, info) {
  if (job.junk) return;
  const g = log();
  if (info.perfect) g.perfect++;
  if (info.stamp) g.stamps++;
  saveLog(g);
}
function myList() {                                                   // the list of letters; the stamp album from it, on any screen
  openReport('Your letters', () => { office.n = numbers(); }, { actions: [{ label: 'Close', fn: () => { office.n = numbers(); } }, { label: 'Stamp album', quiet: true, fn: album }] });
}
function album() {                                                     // the stamp album: a stamp for each company caught, gold for a golden one
  const el = ui.el, items = all().filter((e) => e.job && e.job.company), by = new Map();
  for (const e of items) { const c = e.job.company, g = e.job.size === 'gold'; if (!by.has(c) || g) by.set(c, g || by.get(c)); }
  const grid = el('div', 'stamps'), hue = (s2) => [...s2].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 7);
  for (const [c, g] of [...by.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    const d = el('div', `stamp${g ? ' gold' : ''}`, c.length > 18 ? `${c.slice(0, 17)}…` : c);
    d.style.background = `hsl(${hue(c)}, 42%, 42%)`; grid.appendChild(d);
  }
  for (let i = by.size; i < Math.max(12, by.size + (4 - (by.size % 4))); i++) grid.appendChild(el('div', 'stamp empty', '?'));
  const g = log(), days = new Map();
  for (const e of items) days.set(e.day, (days.get(e.day) || 0) + 1);
  const best = Math.max(0, ...days.values()), fits = items.map((e) => e.job.fit).filter((f) => f != null), num = numbers();
  const recs = el('ul', 'recs');
  for (const [k2, v2] of [['Letters caught', items.length], ['Golden ones', items.filter((e) => e.job.size === 'gold').length], ['Best fit', fits.length ? `${Math.max(...fits)}%` : '-'],
    ['Best morning', `${best} letter${best === 1 ? '' : 's'}`], ['Days in a row', num.streak || 0], ['Perfect catches', g.perfect], ['Stamps found while reeling', g.stamps]]) {
    const li = el('li'); li.append(el('b', '', `${k2}: `), document.createTextNode(String(v2))); recs.appendChild(li);
  }
  ui.page(`Stamp album · ${by.size} compan${by.size === 1 ? 'y' : 'ies'}`, [grid, el('div', 'k', 'Records'), recs]);
  sfx('rustle');
}
function drawer() {                                                    // the junk drawer: what was caught that was no job
  const el = ui.el, g = log(), list = el('ul', 'recs');
  const kinds = Object.entries(g.junk).filter(([, v2]) => v2 > 0);
  if (!kinds.length) list.appendChild(el('li', '', 'Empty. For now.'));
  for (const [k2, v2] of kinds) { const li = el('li'); li.append(el('b', '', `${v2} × `), document.createTextNode(JUNK[k2] || k2)); list.appendChild(li); }
  ui.page('The junk drawer', [list]);
  sfx('clink');
}

// ---- what is said: in the office and on the pier a bubble over the speaker; on the escalator and in the sky, a quiet line --------
let saying = { until: 0, who: null }, talking = 0;
function say(text, who = 'duck', secs) {
  const b = $('say');
  b.textContent = text; b.hidden = !text;
  saying = { until: performance.now() + (secs || Math.min(9, 2.5 + text.length / 16)) * 1000, who };
  place();
}
function talk(text, who = 'duck', secs) {
  if (!text) return;
  if (scene !== 'sea' && scene !== 'rise') return say(text, who === 'gull' ? 'gull' : 'duck', secs);
  $('talkText').textContent = text;
  face(who);
  $('talk').hidden = false;
  talking = performance.now() + (secs || Math.min(8, 2.5 + text.length / 18)) * 1000;
  place();
}
function face(who) {                                                    // the speaker's face, small, by the words
  const c = $('talkFace').getContext('2d');
  c.clearRect(0, 0, 16, 16);
  if (who === 'gull') {
    c.fillStyle = '#f6f6f8'; c.beginPath(); c.arc(8, 9, 5, 0, 7); c.fill();
    c.fillStyle = '#f0b030'; c.fillRect(12, 9, 4, 2); c.fillStyle = '#1b1f3a'; c.fillRect(9, 7, 1, 2);
    c.fillStyle = '#1b2a5a'; c.fillRect(4, 2, 9, 3); c.fillStyle = '#f4f4f4'; c.fillRect(4, 5, 9, 1);
  } else {
    c.fillStyle = scene === 'rise' ? '#eef5ff' : '#ffd84a'; c.beginPath(); c.arc(8, 9, 6, 0, 7); c.fill();
    c.fillStyle = '#f2802a'; c.fillRect(12, 9, 4, 2); c.fillStyle = '#1b1f3a'; c.fillRect(9, 6, 1, 2);
    c.fillStyle = '#ffd84a'; c.fillRect(4, 1, 8, 1);
  }
}
function place() {
  const t = $('talk');
  if (!t.hidden) {
    if ((scene !== 'sea' && scene !== 'rise') || performance.now() > talking) t.hidden = true;
    else {                                                             // under the boat in the sky; beside the soul on the escalator
      const at = scene === 'sea' ? { x: letters.view().boat.x - 4, y: sky.L.boat.y + 24 } : { x: rise.L.head.x + 14, y: rise.L.head.y - 6 };
      t.style.left = `${Math.max(8, Math.min(innerWidth - t.offsetWidth - 8, css(at.x)))}px`;
      t.style.top = `${Math.max(8, css(at.y))}px`;
    }
  }
  const b = $('say');
  if (b.hidden) return;
  if (performance.now() > saying.until || scene === 'sea' || scene === 'rise') { b.hidden = true; return; }
  const at = scene === 'office' ? room.L.head : saying.who === 'gull' ? pier.L.gullHead : pier.L.duckHead || pier.L.gullHead;
  if (!at) return;
  const r = b.getBoundingClientRect(), maxX = innerWidth - r.width - 8;
  b.style.left = `${Math.max(8, Math.min(maxX, css(at.x) - 24))}px`;
  b.style.top = `${Math.max(8, css(at.y) - r.height - 10)}px`;
  b.classList.toggle('below', css(at.y) - r.height - 10 < 8);
}

// ---- the scenes and the moves between them ------------------------------------------------------------------------------
let scene = 'office', t0 = performance.now(), fade = null;            // fade: { color, k, dir, then }
const office = { pose: 'faint', k: 0, n: numbers(), talkAt: 6, clockMin: 0, away: 0, fresh: false };
office.n.junk = Object.values(log().junk).reduce((a, b) => a + b, 0);
const ride = { dir: 1, k: 0, walking: false, said: 0 };
const dock = { pose: 'stand', k: 0, board: null, loading: false, lake: null, bottles: [], fromSea: false };
let trip = null;                                                       // the morning out: { store, pace, told, homeIn }; null if none
const out = () => !!trip && letters.F.on;                              // a morning is on: the sky waits for the duck to come back
function go(to, color = '#ffffff') {
  fade = { color, k: 0, dir: 1, then: () => { scene = to; enter(to); fade.dir = -1; } };
}
function enter(to) {
  $('say').hidden = true; $('talk').hidden = true;
  document.body.dataset.scene = to;
  setMood(to);
  if (to === 'office') { office.n = { ...numbers(), junk: Object.values(log().junk).reduce((a, b) => a + b, 0) }; office.talkAt = 3; corner(); }
  if (to === 'pier') arrive();
  if (to === 'sea') setSail();
  if (to === 'rise') { ride.k = 0; ride.walking = false; ride.said = 0; ride.hinted = false; }
}

// ---- THE OFFICE: the duck fainted at its desk; its soul goes up, and comes back --------------------------------------------------
const MUMBLES = ['…entry level… eight years of experience required…', '…yes… I am a team player…',
  '…where do I see myself in five years… here… apparently…', '…competitive salary… unpaid…', '…a fast-paced environment…',
  '…please find attached… my soul…', '…we will keep your CV on file…'];
const THINGS = {
  screen: (v) => `${v.applied} sent, ${v.replies} ${v.replies === 1 ? 'reply' : 'replies'}. I keep typing. My beak keeps typing.`,
  calendar: (v) => `Day ${v.day} of the search. ${v.streak > 1 ? `${v.streak} days in a row!` : 'One day at a time.'}`,
  board: (v) => (v.letters ? `${v.letters} let go: expired, or not for me. My fan mail.` : 'No letters let go yet. Good luck!'),
  poster: () => 'Hang in there, little duck.',
  clock: () => (office.clockMin >= 1 ? `${clockText()}. Time flies when you are out of your body.` : '3:47 in the morning. The best ideas come at 3:47. So do the worst.'),
  window: () => 'The city never sleeps. Neither do I, apparently.',
  trophy: () => 'For taking part. I take part a lot.',
  tray: (v) => (v.tray ? `${v.tray} letter${v.tray === 1 ? '' : 's'} in my tray, not opened yet.` : 'My tray is empty. Up I go, for more.'),
  apply: (v) => (v.keep ? `${v.keep} kept, to apply to.` : 'Nothing pinned yet. The letters I keep go here.'),
  mugs: (v) => `${v.mugs || 1} mug${(v.mugs || 1) === 1 ? '' : 's'} this week. Each one a day out.`,
  noodles: () => 'Dinner. Also breakfast.',
  plant: (v) => (v.away <= 1 ? 'It is doing well. It likes it when I come every day.' : v.away <= 4 ? 'It droops when I stay away.' : 'I have been away too long. Sorry, plant.'),
  phone: () => '«Unfortunately…» Back to sleep.',
  bin: () => 'Cover letter, draft 31. Draft 32. Draft 33.',
  sign: () => 'HEAVEN. Jobs department. Up.',
  rope: () => (person ? 'The rope is down. Up we go?' : 'Even heaven wants a CV.'),
};
const clockText = () => { const m = 3 * 60 + 47 + Math.floor(office.clockMin); return `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')}`; };
function goFishing() {
  if (!person) { say('Even heaven wants a CV. Give me yours first.', 'duck'); begin(asked); return; }
  if (scene !== 'office' || (office.pose !== 'faint' && office.pose !== 'awake')) return;
  if (!$('catch').hidden) return;
  if (office.pose === 'awake') say('One more time, then.', 'duck', 1.8);
  office.pose = 'soul'; office.k = 0; office.away = 0;
  sfx('choir');
}
function officePress(p) {
  const h = hit(p, room.L.spots);
  if (!h) return;
  const [name] = h;
  if (name === 'duck' || name === 'escalator' || name === 'sign' || name === 'rope') return goFishing();
  if (name === 'tray') return reading();
  if (name === 'apply') return myList();
  if (name === 'album') return album();
  if (name === 'drawer') return drawer();
  const f = THINGS[name];
  if (f) say(f(office.n), 'duck');
}
function officeStep(dt, t) {
  const o = office, S = room.SOUL;
  o.k += dt;
  if (o.pose === 'soul' && o.k >= S.soul) { o.pose = 'walk'; o.k = 0; }
  else if (o.pose === 'walk' && o.k >= S.walk) { o.pose = 'ride'; o.k = 0; sfx('hum'); }
  else if (o.pose === 'ride' && o.k >= S.ride && !fade) { ride.dir = 1; go('rise', '#ffffff'); }
  else if (o.pose === 'descend' && o.k >= S.descend) { o.pose = 'back'; o.k = 0; }
  else if (o.pose === 'back' && o.k >= S.back) { o.pose = 'enter'; o.k = 0; sfx('pop'); }
  else if (o.pose === 'enter' && o.k >= S.enter) wake();
  if (o.pose === 'faint' && t > o.talkAt && $('say').hidden && !anySheet()) {   // mumbling, out cold
    o.talkAt = t + 10 + Math.random() * 6;
    say(person ? MUMBLES[Math.floor(Math.random() * MUMBLES.length)] : '…a CV… even heaven wants a CV…', 'duck', 4.5);
  }
  if (o.pose === 'soul' && o.k > 1.9 && o.k - dt <= 1.9) say('Oh. Huh. So that is what I look like.', 'duck', 2.2);
}
function wake() {                                                      // back in its body: a start, the clock, the tray
  const o = office;
  o.pose = 'awake'; o.k = 0;
  sfx('wake');
  const mins = Math.max(1, Math.round(o.away / 60));
  o.n = numbers();
  o.fresh = o.n.tray > 0;
  say(`Huh?! ${clockText()}. ${mins} minute${mins === 1 ? '' : 's'}? It felt like a whole day.`, 'duck', 3.6);
  setTimeout(() => { if (scene === 'office' && office.pose === 'awake' && office.fresh && $('catch').hidden) say(`${office.n.tray} letter${office.n.tray === 1 ? '' : 's'} in my tray. Real ones. Let us read them.`, 'duck', 4); }, 4000);
  if (trip && letters.F.over) endMorning();                            // the sun had set: that morning is over
}
const anySheet = () => ['paper', 'notes', 'map', 'postcard', 'report', 'catch'].some((id) => !$(id).hidden);

// ---- reading the letters at the desk (PLAN.md 19.4): one at a time, as letters are opened -----------------------------------------
let reads = null;
const ago = (ms) => { const h = Math.max(0, (Date.now() - ms) / 36e5), k = h < 48 ? Math.round(h) : Math.round(h / 24), u = h < 48 ? 'hour' : 'day'; return h < 1 ? 'posted within the hour' : `posted ${k} ${u}${k === 1 ? '' : 's'} ago`; };
function reading() {
  office.fresh = false;
  const day = new Date().toLocaleDateString('en-CA');
  const list = all().filter((e) => e.status === 'new').sort((a, b) => (b.day === day) - (a.day === day) || (b.job.fit ?? -1) - (a.job.fit ?? -1));
  if (!list.length) return say(THINGS.tray(office.n), 'duck');
  reads = { list, i: 0, kept: 0 };
  sfx('rustle');
  letter();
}
function letter() {                                                    // the next letter, opened
  const r = reads, e = r.list[r.i];
  $('catch').hidden = false; $('ctOpen').hidden = false; $('ctKeep').hidden = false; $('ctThrow').hidden = false;
  if (!e) {
    $('ctKicker').textContent = 'All read';
    $('ctTitle').textContent = r.kept ? `${r.kept} kept, to apply to` : 'None kept this time';
    $('ctWho').textContent = ''; $('ctMeta').textContent = '';
    $('ctFit').textContent = r.kept ? 'They are pinned on the board, with their links. The list has them all.' : 'Tomorrow, more letters.';
    $('ctKeep').textContent = 'See the list'; $('ctThrow').hidden = true; $('ctOpen').hidden = true; $('ctLater').textContent = 'Close';
    return;
  }
  const j = e.job, mine = new Set(person.skills || []), asks = Object.keys(j.skills || {});
  const have = asks.filter((k) => mine.has(k)), miss = asks.filter((k) => !mine.has(k));
  $('ctKicker').textContent = `Letter ${r.i + 1} of ${r.list.length}${j.size === 'gold' ? ' · a golden one' : ''}${e.how === 'ashore' ? ' · left at sunset' : ''}`;
  $('ctTitle').textContent = j.title; $('ctWho').textContent = j.company;
  $('ctMeta').textContent = [j.place, j.posted ? ago(j.posted) : ''].filter(Boolean).join(' · ');
  $('ctFit').textContent = j.fit == null ? 'Its posting names too little to weigh: open it to judge.'
    : `Fits you ${j.fit}%. Your CV says: ${have.slice(0, 5).join(', ') || 'none of it'}.${miss.length ? ` It asks too: ${miss.slice(0, 5).join(', ')}.` : ''}`;
  $('ctOpen').href = j.url || '#';
  $('ctKeep').textContent = 'Keep'; $('ctThrow').textContent = 'Not for me'; $('ctLater').textContent = 'Later';
}
function decide(keep) {
  const r = reads;
  if (!r) return;
  const e = r.list[r.i];
  if (!e) { $('catch').hidden = true; reads = null; office.n = numbers(); if (keep) myList(); return; }
  mark(e.job.id, keep ? 'keep' : 'not_for_me');
  if (keep) { r.kept++; sfx('stamp'); } else sfx('rustle');
  r.i++;
  office.n = numbers();
  letter();
}

// ---- THE ESCALATOR, the long way up (and down) --------------------------------------------------------------------------------
const THOUGHTS = { 1: [[0.03, 'Floating. That is new.'], [0.3, 'Bye, pigeons.'], [0.62, 'Soft.'], [0.86, 'Is that… HEAVEN?']],
  [-1]: [[0.04, 'Back to the body. It is fine. It is fine.'], [0.5, 'The city is still up. So am I, apparently.'], [0.9, 'Here we go.']] };
function rideStep(dt) {
  ride.k = Math.min(1, ride.k + (dt / RIDE) * (ride.walking ? 2 : 1));
  const th = THOUGHTS[ride.dir];
  if (ride.said < th.length && ride.k >= th[ride.said][0]) { talk(th[ride.said][1], 'duck', 3); ride.said++; }
  if (ride.dir > 0 && been() && ride.k > 0.1 && !ride.walking && !ride.hinted) { ride.hinted = true; talk(`${PRESS} to walk up the steps, if you are in a hurry.`, 'duck', 3.5); }
  if (ride.k >= 1 && !fade) {
    if (ride.dir > 0) { dock.fromSea = false; go('pier', '#fff4d8'); }
    else { office.pose = 'descend'; office.k = 0; go('office', '#0c0f24'); }
  }
}

// ---- HEAVEN'S PIER: the gull at the gate; the boat out; the escalator down -------------------------------------------------------
function fleetBoard() {                                                // the departures in the app: each boat, its boards, where it is
  return Object.values(boats).map((b) => [b.name.toUpperCase(), b.total || '', b.state === 'home' ? 'HOME' : b.state === 'out' ? 'AT SEA' : 'READY']);
}
async function arrive() {
  if (dock.fromSea) {                                                  // back from the sky: the boat comes in, the duck steps off
    Object.assign(dock, { pose: 'return', k: 0, loading: false });
    sfx('horn');
    return;
  }
  Object.assign(dock, { pose: 'stand', k: 0 });
  if (out()) {                                                         // the morning goes on out there
    dock.loading = false;
    if (inApp) dock.board = fleetBoard(); else if (!dock.board) dock.board = boardOf(dock.lake || [], person);
    setTimeout(() => { if (scene === 'pier' && dock.pose === 'stand') say('Back again? Your boat is where you left it, and so are your letters.', 'gull', 4); }, 900);
    return;
  }
  Object.assign(dock, { loading: true, board: null });
  setTimeout(() => { if (scene === 'pier' && dock.pose === 'stand') say(been() ? 'Back again? Your boat is ready.' : 'Name? CV? Ah, the duck. Welcome to Heaven, jobs department. Your boat is at the end of the pier.', 'gull', 5); }, 900);
  try {
    const { lake, bottles } = await readLake(person);
    dock.lake = lake; dock.bottles = bottles;
    dock.board = boardOf(lake, person);
    if (inApp) { await moored(); dock.board = fleetBoard(); }
  } catch (e) {
    dock.lake = []; dock.bottles = []; dock.board = [['THE SKY', 0, 'CLOSED']];
    say(`The sky could not be read (${e.message}). Try again in a while.`, 'gull');
  }
  dock.loading = false; sfx('flaps');
  setTimeout(() => { if (scene === 'pier' && dock.pose === 'stand' && (dock.lake || []).length) say(weatherWord(), 'gull', 4.5); }, 6500);
}
function gullTip() {
  if (out()) return `Your letters are still in the sky. ${PRESS} the boat to go back out, or the gate to go home.`;
  if (inApp) return `Your fleet reads ${(dock.board || []).reduce((a, r) => a + (+r[1] || 0), 0).toLocaleString('en-GB')} company boards the moment you sail. ${PRESS} the boat.`;
  const k = dock.lake ? dock.lake.length : 0, gold = dock.lake ? dock.lake.filter((j) => j.size === 'gold').length : 0;
  if (!k) return 'A quiet sky today: nothing new for you. Come back tomorrow, the harbour will be busier.';
  return `${k} letters out today for you, ${gold} golden. ${PRESS} the boat, and fish.`;
}
const PIER_SAYS = {
  board: () => (inApp ? 'The departures: your fleet. Each boat reads one kind of company job board, live, the moment you sail.'
    : 'The departures: how many letters are out today where you look, and how many are golden: the ones that fit you.'),
  hut: () => 'The harbour master is out fishing. Like everyone up here.',
  crates: () => 'HOPE: handle with care. CV13: the thirteenth draft, the best one yet.',
  gull: () => gullTip(),
};
function pierPress(p) {
  const h = hit(p, pier.L.spots);
  if (!h || dock.pose !== 'stand') return;
  const [name] = h;
  if (name === 'boat' || name === 'sign') {
    if (dock.loading) return say('A moment: the sky is still being read.', 'gull');
    dock.pose = 'walk'; dock.k = 0; sfx('quack'); store('glf.went', '1');
    return;
  }
  if (name === 'down') { dock.pose = 'down'; dock.k = 0; say(out() ? 'Down to the desk for a while. The sky will wait.' : 'Home, then.', 'duck', 2.2); return; }
  const f = PIER_SAYS[name];
  if (f) say(f(), name === 'gull' || name === 'board' ? 'gull' : 'duck');
}
function pierStep(dt) {
  const d = dock;
  if (d.pose === 'walk' && (d.k += dt / 2.4) >= 1) { d.pose = 'aboard'; d.k = 0; say('All aboard the Good Luck!', 'duck', 2); }
  else if (d.pose === 'aboard' && (d.k += dt) > 1.0) { d.pose = 'sail'; d.k = 0; sfx('horn'); }
  else if (d.pose === 'sail' && (d.k += dt / 2.2) >= 1 && !fade) go('sea', '#ffffff');
  else if (d.pose === 'return' && (d.k += dt / 2.6) >= 1) { d.pose = 'walkback'; d.k = 0; sfx('clink'); say(`Good haul. ${n(bagN)} letter${bagN === 1 ? '' : 's'} in your bag today.`, 'gull', 3.2); }
  else if (d.pose === 'walkback' && (d.k += dt / 2.4) >= 1) {
    d.pose = 'stand'; d.k = 0; d.fromSea = false;
    if (trip && letters.F.over) setTimeout(() => { if (scene === 'pier' && dock.pose === 'stand') { dock.pose = 'down'; dock.k = 0; say('The sun is down. Home, then.', 'duck', 2); } }, 1200);
  } else if (d.pose === 'down' && (d.k += dt / 3) >= 1 && !fade) { ride.dir = -1; go('rise', '#fff4d8'); }
}

// ---- THE SKY: the search fills it with letters; the duck fishes them, or lets the duck fish ------------------------------------------
const SYSTEM = { gh: 'greenhouse', lv: 'lever', ab: 'ashby' };
function skyToday() {                                                // the season by the real month; the weather by the real market
  const m = new Date().getMonth(), season = [11, 0, 1].includes(m) ? 'winter' : [2, 3, 4].includes(m) ? 'spring' : [5, 6, 7].includes(m) ? 'summer' : 'autumn';
  const lake = dock.lake || [], today = lake.filter((j) => Date.now() - j.posted < 864e5).length, perDay = lake.length / 30;
  const ratio = perDay >= 1 ? today / perDay : 1;
  return { season, weather: lake.length > 20 && ratio < 0.6 ? 'quiet' : ratio > 1.4 ? 'busy' : 'fair', today, ratio };
}
function weatherWord() {                                               // what the gull says of the day: real numbers, the real weekday
  const w = skyToday(), d = new Date(), day = d.getDay(), hr = d.getHours();
  const said = w.weather === 'busy' ? `A busy day: ${w.today} new letters since yesterday. Clear skies.` : w.weather === 'quiet' ? `A quiet day: ${w.today} new since yesterday. A little mist out there.` : `${w.today} new letters since yesterday.`;
  return day === 1 ? `${said} Mondays bring the most.` : day === 5 && hr >= 15 ? `${said} Friday afternoon: the sky goes quiet early.` : said;
}
const dreamList = () => { try { return JSON.parse(store('glf.dream') || '[]'); } catch (e) { return []; } };
async function setSail() {
  bagCount();
  if (out()) { letters.comeBack(); talk('Back in the sky. Where were we?', 'duck', 2.5); return; }   // the same morning, as it was left
  fished();
  const my = trip = { store: null, pace: null, told: false, homeIn: 0 };
  const sky0 = skyToday();
  letters.start({ W, H, L: sky.L }, { skills: person.skills, auto: false, dayLength: DAY, known: has, dream: dreamList(), season: sky0.season, weather: sky0.weather });
  talk(`Hold anywhere and let go to cast. ${PRESS} the duck to let it fish.`, 'duck', 5);
  if (!soundOn() && !store('glf.asked')) setTimeout(() => { if (scene === 'sea') $('ask').hidden = false; }, 6000);   // once: some music?
  if (!dock.lake) {                                                    // the store read now, if the pier did not
    try { const r = await readLake(person); dock.lake = r.lake; dock.bottles = r.bottles; } catch (e) { dock.lake = []; dock.bottles = []; }
  }
  if (trip !== my || !letters.F.on) return;                            // home again meanwhile
  letters.give({ bottles: dock.bottles || [] });
  if (!inApp) return paceStore(my, dock.lake || []);
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
  sfx('chime2');
  if (!quiet) talk(`The search is done: ${n(F.found)} letters for you, ${n(F.gold)} golden. The city slows, and stops.`, 'gull', 4.5);
}

// ---- in the sky: one line of how the search goes, the sound; one way home; the mailbag on the mast ------------------------------
let bagN = 0;
function bagCount() { bagN = todays().length; }                        // the mailbag's number: what is in the bag today
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
$('toPier').addEventListener('click', () => {                          // back to the pier, the way it came
  if (fade || anySheet() || scene !== 'sea' || !letters.F.on) return;
  if (letters.goHome()) { sfx('clink'); talk('Back to the pier, then. The sky will keep.', 'duck', 2.5); }
});
const onBagAt = (p) => { const b = letters.view().bag.at; return p.x > b.x - 8 && p.x < b.x + 8 && p.y > b.y - 4 && p.y < b.y + 20; };
function bagSheet() {                                                  // the bag: today's letters; each one's rest of it, at a press
  const list = todays().map((e) => e.job).sort((a, b) => (b.fit ?? -1) - (a.fit ?? -1));
  ui.list(`Today's bag · ${list.length} letter${list.length === 1 ? '' : 's'}`, list, (j) => letters.tierOf(j));
  sfx('rustle');
}

// ---- the end of a morning: the sunset, the way home -------------------------------------------------------------------------------
function leftGolden() {                                                // the golden ones not caught: into the tray, not opened
  const left = letters.rest().filter((j) => j.size === 'gold' && !has(j.id));
  left.forEach((j) => add(j, 'ashore'));
  return left.length;
}
function endMorning() {                                                // the fleet called in, the sky put away
  if (inApp) callHome();
  if (trip && trip.pace) clearInterval(trip.pace);
  letters.stop(); trip = null;
}
function sunset() {                                                    // the sun goes down: the golden ones not caught go to the tray, the boat home
  if (inApp) callHome();
  const left = leftGolden();
  bagCount(); sfx('dusk');
  talk(`The sun is going down. ${n(bagN)} letter${bagN === 1 ? '' : 's'} in the bag${left ? `, and ${left} golden one${left === 1 ? '' : 's'} for the tray, unopened` : ''}. Home, then.`, 'duck', 4.5);
  if (trip) trip.homeIn = 3;
}

// ---- the hands ----------------------------------------------------------------------------------------------------------------
cv.addEventListener('pointerdown', (e) => {
  if (fade || anySheet()) return;
  const p = stage.toArt(e);
  if (scene === 'office') return officePress(p);
  if (scene === 'pier') return pierPress(p);
  if (scene === 'rise') { if (ride.dir > 0 && been() && !ride.walking) { ride.walking = true; talk('Walking up. Like everyone in a hurry.', 'duck', 2); } return; }
  cv.setPointerCapture?.(e.pointerId);
  if (onBagAt(p) && !letters.F.line) return bagSheet();
  letters.press(p);
});
cv.addEventListener('pointermove', (e) => {
  const p = stage.toArt(e);
  if (scene === 'sea') { letters.move(p); cv.style.cursor = letters.hovering(p) || onBagAt(p) ? 'pointer' : 'default'; return; }
  const on = scene === 'office' ? !!hit(p, room.L.spots) : scene === 'pier' ? !!hit(p, pier.L.spots) : false;
  cv.style.cursor = on ? 'pointer' : 'default';
});
addEventListener('pointerup', (e) => { if (scene === 'sea') letters.release(stage.toArt(e)); });
addEventListener('pointercancel', () => { if (scene === 'sea') letters.release(null); });
$('ctKeep').addEventListener('click', () => decide(true));
$('ctThrow').addEventListener('click', () => decide(false));
$('ctLater').addEventListener('click', () => { $('catch').hidden = true; reads = null; office.n = numbers(); });
$('ctOpen').addEventListener('click', (e) => { e.preventDefault(); openOut($('ctOpen').href); });   // outside the game, never in its place
$('askYes').addEventListener('click', () => { store('glf.asked', '1'); $('ask').hidden = true; setSound(true); soundLabels(); playMusic(true); sfx('chime2'); });
$('askNo').addEventListener('click', () => { store('glf.asked', '1'); $('ask').hidden = true; });
function soundLabels() { $('sound').textContent = `Sound: ${soundOn() ? 'on' : 'off'}`; $('seaSound').textContent = soundOn() ? '♪ on' : '♪ off'; }
for (const id of ['sound', 'seaSound']) $(id).addEventListener('click', () => { setSound(!soundOn()); soundLabels(); playMusic(soundOn()); sfx('quack'); });
addEventListener('pointerdown', () => { if (soundOn()) playMusic(true); }, { once: true });   // browsers start sound only after a press
soundLabels();
$('bucket').addEventListener('click', () => myList());
$('gofish').addEventListener('click', goFishing);

// ---- the CV and the account (PLAN.md 9): asked once; «My CV» asks again ---------------------------------------------------------
function asked(v) {
  person = JSON.parse(localStorage.getItem('glf.me') || 'null') || v;
  if (trip) { endMorning(); dock.lake = null; dock.bottles = []; dock.board = null; }   // a new CV: the morning was weighed against the old one
  user().then((u) => { if (u) { saveProfile(person); ready(); } else postcard(ready); });
}
function ready() {
  $('mycv').hidden = false; $('bucket').hidden = false; $('gofish').hidden = false;
  corner().then((u) => { if (u) sync().then(() => { office.n = numbers(); }); });
  if (person) say('Is that… my CV? Mine? Not bad, me. Now: up.', 'duck', 4);
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
const away = () => scene !== 'office' || ['soul', 'walk', 'ride', 'descend', 'back', 'enter'].includes(office.pose);
function tick(now, step) {
  const dt = step ?? Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  const t = (now - t0) / 1000;
  if (fade) {
    fade.k += dt / 0.7 * fade.dir;
    if (fade.k >= 1 && fade.dir > 0) { fade.k = 1; fade.then(); }
    else if (fade.k <= 0 && fade.dir < 0) fade = null;
  }
  if (away()) { office.away += dt; office.clockMin += dt / 60; }       // the soul is out: the clock on the wall moves on
  if (scene === 'office') {
    officeStep(dt, t);
    room.draw(W, H, t, { n: office.n, open: !!person, clockMin: office.clockMin, fresh: office.fresh, duck: { pose: office.pose, k: office.k } });
    show();
    ui.update(null);
  } else if (scene === 'rise') {
    rideStep(dt);
    rise.draw({ dir: ride.dir, k: ride.k, t, walking: ride.walking, lit: letters.F.on ? letters.F.found : (dock.lake || []).length });
  } else if (scene === 'pier') {
    pierStep(dt);
    if (inApp && out()) dock.board = fleetBoard();                     // the fleet still out: the board as it goes
    pier.draw(W, H, t, { board: dock.board, loading: dock.loading, duck: { pose: dock.pose, k: dock.k } });
    show();
    ui.update(null);
  } else if (letters.F.t !== undefined) {                              // (put away on the way home, it is still drawn as the light goes)
    const F = letters.F, held = anySheet();
    letters.step(dt, held);
    const v = letters.view();
    v.bag.n = bagN;
    sky.draw(v);
    ui.update(v);
    progress();
    if (trip && F.on && !trip.told && !F.waiting && !F.over && bagN >= Math.min(TARGET, F.found)) {   // a good haul: said once, nothing more
      trip.told = true;
      setTimeout(() => talk(`A good haul: ${n(bagN)} letters. The sky will keep: back to the pier whenever you like.`, 'gull', 5), 1500);
    }
    if (trip && trip.homeIn > 0 && (trip.homeIn -= dt) <= 0) letters.goHome();
    setMood(F.day > 0.74 ? 'dusk' : 'sea');
  }
  if (fade) { stage.g.globalAlpha = Math.max(0, Math.min(1, fade.k)); stage.fill(fade.color); stage.g.globalAlpha = 1; }
  place();
}
requestAnimationFrame(frame);

// ?debug: the game's own hands, to try it where a page draws no frames
if (new URLSearchParams(location.search).has('debug')) window.game = { letters, sky, stage, rise, ride, dock, office, room, pier, ui, go, get scene() { return scene; }, get trip() { return trip; }, all, has, todays,
  // run the game for a while where the page draws no frames of its own, in steps of dt seconds
  run(sec, dt = 0.05) { let now = last; for (let i = 0; i < sec / dt; i++) { now += dt * 1000; tick(now, dt); } return scene; },
  // press a named thing of the office or the pier, as a hand would
  press(name) {
    const s = (scene === 'office' ? room : pier).L.spots[name]; if (!s) return false;
    const r = cv.getBoundingClientRect(), x = r.left + css(s.x + s.w / 2), y = r.top + css(s.y + s.h / 2);
    cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
    dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y }));
    return name;
  },
  // press a point of the scene (its own pixels), and let go
  down(x, y) { const r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + css(x), clientY: r.top + css(y), bubbles: true, pointerId: 1 })); },
  up(x, y) { const r = cv.getBoundingClientRect(); dispatchEvent(new PointerEvent('pointerup', { clientX: r.left + css(x), clientY: r.top + css(y), pointerId: 1 })); },
};
