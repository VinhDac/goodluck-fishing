// THE SKY (PLAN.md 3 and step 4, part 1): the duck's boat on a cloud, the city of the companies below, and the clouds
// that are jobs: real ones from the shared store (Supabase), for the person's titles and place, scored on this device
// against the CV's skills (the CV never leaves it). Big cloud, good fit; a golden one, 85 and over; a bright edge, posted
// within a day. Click a cloud to cast at it; hooked, it is reeled in and its card shows the job. Ten minutes a day:
// the sun crosses the sky, and at sunset the boat goes home (the bucket and the report: step 5).
import { AWAKE } from './art.js';
import { titleFits, placeFits } from './score.js';
import { add, has } from './box.js';
import { openReport } from './report.js';

const DAY = 600, SHOWN = 8, FRESH_DAYS = 14;
// THE STORE AS FILES (Vin, 15/11/2026: «đổi sang cách file tĩnh»): tools/publish.py writes them every six hours to the
// repo's store branch; read straight from GitHub, filtered and scored here. A part of the world by its cities.
const STORE = 'https://raw.githubusercontent.com/VinhDac/goodluck-fishing/store';
const REGION_OF = {
  uk: ['london', 'manchester', 'edinburgh', 'glasgow', 'bristol', 'cambridge', 'oxford', 'leeds', 'birmingham', 'belfast', 'cardiff', 'reading', 'brighton'],
  ie: ['dublin', 'cork', 'galway'], de: ['berlin', 'munich', 'hamburg', 'frankfurt'], fr: ['paris', 'lyon'], nl: ['amsterdam', 'rotterdam', 'utrecht'],
  es: ['madrid', 'barcelona', 'valencia'], eu: ['zurich', 'stockholm', 'copenhagen', 'lisbon', 'warsaw', 'vienna', 'prague', 'milan'],
  us: ['new york', 'san francisco', 'seattle', 'boston', 'austin', 'chicago', 'los angeles', 'denver'], ca: ['toronto', 'vancouver', 'montreal'],
  asia: ['singapore', 'hanoi', 'ho chi minh city', 'bangalore', 'tokyo', 'hong kong', 'dubai'], oceania: ['sydney', 'melbourne'],
  latam: ['sao paulo', 'mexico city', 'buenos aires'],
};
const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);

// the score of a job from the skills the harvester read in it: of what it asks (each ask weighed by how often, three at
// most), how much the CV speaks to; null when it names fewer than three (too little to judge: an «unread» cloud)
export function fitOf(jobSkills, mine) {
  const asks = Object.entries(jobSkills || {});
  if (asks.length < 3) return null;
  let got = 0, all = 0;
  for (const [k, n] of asks) { const w = Math.min(3, n); all += w; if (mine.has(k)) got += w; }
  return Math.round((100 * got) / all);
}
const sizeOf = (s) => (s == null ? 'unread' : s >= 85 ? 'gold' : s >= 70 ? 'big' : s >= 50 ? 'medium' : 'small');
const RADIUS = { gold: 13, big: 12, medium: 10, small: 8, unread: 9 };

const PRESS = matchMedia('(pointer: coarse)').matches ? 'Tap' : 'Click';      // a phone's finger, a computer's mouse
export function makeSky(g, dims, toCss, goHome) {
  const S = { on: false, t: 0, day: 0, over: false, lake: [], clouds: [], caught: [], cast: null, said: '', loaded: false,
    holding: false, bait: '', auto: false, netReady: 0 };
  let W = 320, H = 180;
  const me = (() => { try { return JSON.parse(localStorage.getItem('glf.me')) || {}; } catch (e) { return {}; } })();
  const mine = new Set(me.skills || []);

  // ---- the clouds come from the shared store: the jobs for this person's titles and place, the best fits first -------
  async function load() {
    say('Reading the sky…');
    try {
      const city = String(me.city || '').trim().toLowerCase();
      // the part of the world the city is in; a city not known, or none (anywhere), reads every part
      const region = Object.entries(REGION_OF).find(([, cities]) => cities.includes(city));
      const names = region ? [region[0], ...(me.remote ? ['remote'] : [])] : [...Object.keys(REGION_OF), 'remote', 'other'];
      const parts = await Promise.all(names.map((n) => fetch(`${STORE}/${n}.json`).then((r) => (r.ok ? r.json() : { jobs: [] })).catch(() => ({ jobs: [] }))));
      const seen = new Set(), rows = [];
      for (const p of parts) for (const r of p.jobs || []) if (!seen.has(r[0])) { seen.add(r[0]); rows.push(r); }
      const since = Date.now() - FRESH_DAYS * 864e5;
      const jobs = rows.map(([id, company, title, place, url, posted, skills]) => ({ id, company, title, place, url, posted: posted * 1000, skills }))
        .filter((j) => j.posted >= since && !has(j.id) && titleFits(j.title, me.titles || []) && placeFits(j.place, me.city || '', me.remote));
      S.lake = jobs.map((j) => { const fit = fitOf(j.skills, mine); return { ...j, fit, size: sizeOf(fit) }; })
        .sort((a, b) => (b.fit ?? -1) - (a.fit ?? -1) || b.posted - a.posted);
      S.loaded = true;
      say(S.lake.length ? `${S.lake.length} clouds for you today. ${PRESS} one to cast.` : 'No new jobs for you in the sky today. Come back tomorrow.');
      city_(jobs);
    } catch (e) { say(`The sky could not be read (${e.message}).`); }
  }
  function say(t) { S.said = t; $('skySaid').textContent = t; }

  // ---- the city below: the companies whose jobs are in the sky, their names on their roofs; a few made up, for fun -----
  const DECOR = ['Goggle', 'Amazoom', 'Snoozle', 'Facepalm'];
  let CITY = [];
  function city_(jobs) {
    const by = {};
    for (const j of jobs) by[j.company] = (by[j.company] || 0) + 1;
    const real = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([n]) => n);
    const names = [];
    real.forEach((n, i) => { names.push({ n, real: true }); if (i % 2 === 1 && DECOR[i >> 1]) names.push({ n: DECOR[i >> 1], real: false }); });
    if (!names.length) DECOR.forEach((n) => names.push({ n, real: false }));
    CITY = names;
    lay();
  }
  function lay() {
    const box = $('signs'); box.replaceChildren();
    // as many roofs as their names have room for: a phone's narrow city has fewer, wider buildings
    const room = toCss(W, 0).x - toCss(0, 0).x, shown = CITY.slice(0, Math.max(3, Math.floor(room / 78)));
    const n = Math.max(1, shown.length), w = (W - 8) / n;
    for (const b of CITY) b.w = 0;
    shown.forEach((b, i) => {
      b.x = 4 + i * w; b.w = Math.max(10, w - 3); b.h = 18 + ((i * 37) % 22); b.y = H - b.h;
      const s = document.createElement('span'); s.className = 'sign' + (b.real ? '' : ' decor'); s.textContent = b.n;
      const p = toCss(b.x + b.w / 2, b.y - 1); s.style.left = `${p.x}px`; s.style.top = `${p.y}px`;
      s.style.maxWidth = `${Math.floor(toCss(w, 0).x - toCss(0, 0).x) - 6}px`; s.title = b.n;   // a long name cut to its roof
      box.appendChild(s);
    });
  }

  // ---- the play ---------------------------------------------------------------------------------------------------
  const boat = () => ({ x: Math.round(W * 0.1), y: Math.round(H * 0.6) });
  const tip = () => { const b = boat(); return { x: b.x + 30, y: b.y - 22 + Math.sin(S.t * 1.5) }; };
  function spawn() {
    if (S.clouds.length >= SHOWN || !S.lake.length) return;
    const job = S.lake.shift();
    S.clouds.push({ job, x: rand(W * 0.35, W - 18), y: rand(16, H * 0.55), v: rand(-2.5, 2.5), r: RADIUS[job.size], bob: rand(0, 6), a: 0 });
  }
  // a press: a cast at a cloud; while one is hooked and fights, holding reels it in (PLAN.md 3: «quăng rồi kéo có lực căng»)
  function down(p) {
    if (!S.on || S.over || !$('catch').hidden) return;
    S.holding = true;
    if (S.cast) return;
    const t = tip();
    const hit = S.clouds.find((c) => Math.hypot(c.x - p.x, c.y - p.y) <= c.r + 3);
    S.cast = { x0: t.x, y0: t.y, x: p.x, y: p.y, age: 0, fly: 0.5, hit, phase: 'fly' };
  }
  function up() { S.holding = false; }
  // THE FIGHT: a big or golden cloud pulls in bursts; holding reels it in and tightens the line, letting go lets it run a
  // little and the line ease; past the red the line snaps, and the job is in the bucket all the same (never punished)
  const PULL = { gold: 0.95, big: 0.7 };
  function fight(k, dt) {
    k.next -= dt;
    if (k.next <= 0) { k.pull = k.pull ? 0 : PULL[k.hit.job.size] * rand(0.6, 1); k.next = k.pull ? rand(0.4, 0.8) : rand(0.6, 1.4); }
    const reel = S.auto ? k.ten < 0.62 : S.holding;
    if (reel) { k.prog += dt * 0.22 * (1 - k.pull * 0.55); k.ten += dt * (0.3 + k.pull * 0.95); }
    else { k.prog = Math.max(0, k.prog - dt * (0.03 + k.pull * 0.05)); k.ten = Math.max(0, k.ten - dt * 0.55); }
    const t = tip(), e = Math.min(1, k.prog);
    k.hit.x = k.from.x + (t.x - k.from.x) * e + (k.pull ? Math.sin(S.t * 25) * 1.5 : 0);
    k.hit.y = k.from.y + (t.y - k.from.y) * e;
    if (k.ten >= 1) return snapped(k);
    if (k.prog >= 1) landed(k.hit);
  }
  function snapped(k) {
    S.clouds.splice(S.clouds.indexOf(k.hit), 1);
    S.cast = null;
    keep(k.hit.job, 'snapped');
    say('The line snapped! But the job is in your bucket.');
  }
  function keep(job, how) { S.caught.push({ ...job, how }); $('skyCount').textContent = S.caught.length; add(job, how); }
  // THE NET (PLAN.md 3, C): every small cloud in sight brought in at once; then it dries for a while
  function net() {
    if (!S.on || S.over || S.t < S.netReady) return;
    const small = S.clouds.filter((c) => (c.job.size === 'small' || c.job.size === 'unread') && !(S.cast && S.cast.hit === c));
    small.forEach((c) => { S.clouds.splice(S.clouds.indexOf(c), 1); keep(c.job, 'net'); });
    S.netReady = S.t + 20;
    say(small.length ? `The net brought in ${small.length} small cloud${small.length === 1 ? '' : 's'}.` : 'No small cloud in sight for the net.');
  }
  // THE BAIT (PLAN.md 3: «mồi là kỹ năng»): a skill of the CV; the jobs that ask it come to the line first
  function bait(skill) {
    S.bait = skill;
    const asks = (j) => (skill && j.skills && j.skills[skill] ? 1 : 0);
    S.lake.sort((a, b) => asks(b) - asks(a) || (b.fit ?? -1) - (a.fit ?? -1) || b.posted - a.posted);
    if (skill) say(`Bait: ${skill}. The clouds that ask it come first.`);
  }
  function step(dt) {
    if (!S.on) return;
    S.t += dt;
    if (!S.over && $('catch').hidden && $('report').hidden) { S.day = Math.min(1, S.day + dt / DAY); if (S.day >= 1) sunset(); }
    if (S.loaded && Math.random() < dt * 0.8) spawn();
    for (const c of S.clouds) {
      c.a = Math.min(1, c.a + dt / 1.2);
      if (c !== (S.cast && S.cast.hit && S.cast.phase !== 'fly' ? S.cast.hit : null)) {
        c.x += c.v * dt; if (c.x < W * 0.3 || c.x > W - 10) c.v *= -1;
      }
    }
    const k = S.cast;
    if (k) {
      k.age += dt;
      if (k.phase === 'fly' && k.age >= k.fly) {
        if (k.hit && S.clouds.includes(k.hit)) { k.phase = 'bite'; k.age = 0; }
        else { say(`Missed: no cloud there. ${PRESS} right on one.`); S.cast = null; }
      } else if (k.phase === 'bite' && k.age >= 0.7) {
        k.from = { x: k.hit.x, y: k.hit.y }; k.age = 0;
        if (PULL[k.hit.job.size]) { k.phase = 'fight'; k.prog = 0; k.ten = 0.25; k.pull = 0; k.next = 0.5; say('It fights! Hold to reel in, let go when the line goes red.'); }
        else k.phase = 'reel';
      } else if (k.phase === 'fight') fight(k, dt);
      else if (k.phase === 'reel') {
        const t = tip(), e = Math.min(1, k.age / 1.1);
        k.hit.x = k.from.x + (t.x - k.from.x) * e; k.hit.y = k.from.y + (t.y - k.from.y) * e; k.hit.r = Math.max(3, RADIUS[k.hit.job.size] * (1 - e * 0.7));
        if (e >= 1) landed(k.hit);
      }
    }
    // the duck fishing by itself (PLAN.md 3, D): it casts at the best cloud in sight, and reels as a careful hand would
    if (S.auto && !S.cast && !S.over && $('catch').hidden && S.clouds.length && (S.autoWait = (S.autoWait || 0) - dt) <= 0) {
      S.autoWait = rand(1.2, 2.2);
      const best = S.clouds.slice().sort((a, b) => (b.job.fit ?? -1) - (a.job.fit ?? -1))[0];
      down({ x: best.x, y: best.y }); S.holding = false;
    }
    $('netBtn').textContent = S.t < S.netReady ? `Net ${Math.ceil(S.netReady - S.t)}s` : 'Net';
    clock();
  }
  function landed(c) {
    S.clouds.splice(S.clouds.indexOf(c), 1);
    S.cast = null;
    keep(c.job, 'caught');
    if (S.auto) say(`Caught: ${c.job.title} · ${c.job.company}`); else card(c.job);
  }
  const ago = (ms) => { const h = Math.max(0, (Date.now() - ms) / 36e5), n = h < 48 ? Math.round(h) : Math.round(h / 24), u = h < 48 ? 'hour' : 'day'; return h < 1 ? 'posted within the hour' : `posted ${n} ${u}${n === 1 ? '' : 's'} ago`; };
  function card(job) {
    $('ctKicker').textContent = job.size === 'gold' ? 'A golden cloud!' : job.size === 'big' ? 'A big one' : 'You caught';
    $('ctTitle').textContent = job.title;
    $('ctWho').textContent = job.company;
    $('ctMeta').textContent = [job.place, ago(job.posted)].filter(Boolean).join(' · ');
    const have = Object.keys(job.skills || {}).filter((k) => mine.has(k)), miss = Object.keys(job.skills || {}).filter((k) => !mine.has(k));
    $('ctFit').textContent = job.fit == null ? 'Its posting names too little to weigh: open it to judge.'
      : `Fits you ${job.fit}%. Your CV says: ${have.slice(0, 5).join(', ') || 'none of it'}.${miss.length ? ` It asks too: ${miss.slice(0, 5).join(', ')}.` : ''}`;
    $('ctOpen').href = job.url;
    $('catch').hidden = false;
  }
  // SUNSET: the boat goes home and the day's report opens (PLAN.md 4); closing it, back to the office
  function sunset() {
    S.over = true; S.cast = null;
    openReport('The sun has set', goHome);                 // the day's numbers are the report's own, from the box
  }
  function clock() {
    const left = Math.max(0, Math.ceil(DAY * (1 - S.day)));
    $('skyClock').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }

  // ---- drawing ----------------------------------------------------------------------------------------------------
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function blob(cx, cy, r, c) {
    g.fillStyle = c;
    for (const [dx, dy, k] of [[0, 0, 1], [-r * 0.8, r * 0.25, 0.7], [r * 0.8, r * 0.25, 0.7], [-r * 0.35, -r * 0.35, 0.7]]) {
      const rr = r * k;
      for (let y = -rr; y <= rr; y++) { const w = Math.round(rr * Math.sqrt(1 - (y * y) / (rr * rr))); g.fillRect(Math.round(cx + dx - w), Math.round(cy + dy + y), w * 2 + 1, 1); }
    }
  }
  const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
  function draw() {
    if (!S.on) return;
    const d = S.day, top = d < 0.85 ? [92, 160, 230] : mix([92, 160, 230], [60, 40, 110], (d - 0.85) / 0.15);
    const bot = d < 0.85 ? [200, 232, 250] : mix([200, 232, 250], [240, 150, 110], (d - 0.85) / 0.15);
    for (let b = 0; b < 12; b++) R(0, (b * H) / 12, W, H / 12 + 1, `rgb(${mix(top, bot, b / 11).join(',')})`);
    // the sun on its way across
    const sx = 10 + d * (W - 20), sy = H * 0.5 - Math.sin(Math.PI * d) * H * 0.42;
    blob(sx, sy, 6, '#fff3b0');
    // far clouds
    for (let i = 0; i < 6; i++) blob(((i * 71 + S.t * 3) % (W + 40)) - 20, 20 + (i * 23) % (H * 0.4), 5, 'rgba(255,255,255,0.35)');
    // the city below
    for (const b of CITY) if (b.w) { R(b.x, b.y, b.w, b.h, b.real ? '#5b6b8c' : '#7b86a0'); for (let y = b.y + 3; y < H - 2; y += 4) for (let x = b.x + 2; x < b.x + b.w - 2; x += 4) R(x, y, 2, 2, (x * y) % 7 ? '#ffe6a0' : '#4a5878'); }
    // the boat's own cloud, the boat, the duck, the rod
    const bt = boat(); blob(bt.x + 16, bt.y + 6, 15, '#ffffff');
    R(bt.x + 2, bt.y - 4 + Math.sin(S.t * 1.5), 30, 5, '#8a5a32'); R(bt.x + 4, bt.y + 1 + Math.sin(S.t * 1.5), 26, 2, '#6a4224');
    g.drawImage(AWAKE, bt.x + 6, Math.round(bt.y - 19 + Math.sin(S.t * 1.5)));
    const t = tip(); g.strokeStyle = '#5a3a1a'; g.beginPath(); g.moveTo(bt.x + 22, bt.y - 9); g.lineTo(t.x, t.y); g.stroke();
    // the clouds that are jobs
    for (const c of S.clouds) {
      const y = c.y + Math.sin(S.t * 1.2 + c.bob) * 1.5, fresh = Date.now() - c.job.posted < 864e5;
      if (fresh) blob(c.x, y, c.r + 1.5, `rgba(255,255,255,${0.5 * c.a})`);
      blob(c.x, y, c.r, c.job.size === 'gold' ? `rgba(255,214,90,${c.a})` : c.job.size === 'unread' ? `rgba(225,232,240,${c.a})` : `rgba(255,255,255,${c.a})`);
    }
    // the line, and the float
    const k = S.cast;
    if (k) {
      const e = k.phase === 'fly' ? Math.min(1, k.age / k.fly) : 1;
      const fx = k.phase === 'reel' ? k.hit.x : k.x0 + (k.x - k.x0) * e, fy = k.phase === 'reel' ? k.hit.y : k.y0 + (k.y - k.y0) * e - Math.sin(Math.PI * e) * 14;
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.moveTo(t.x, t.y); g.lineTo(fx, fy); g.stroke();
      R(fx - 1, fy - 1 + (k.phase === 'bite' ? Math.sin(S.t * 30) : 0), 3, 3, '#e03a3a');
      if (k.phase === 'fight') {
        // the line's tension, green to red, and how far it has come, by the boat
        const bx = boat().x - 2, by = boat().y - 46, h = 34, ten = Math.min(1, k.ten);
        R(bx - 1, by - 1, 5, h + 2, '#3a2a1a'); R(bx, by, 3, h, '#fff8e7');
        R(bx, by + h - Math.round(h * ten), 3, Math.round(h * ten), ten > 0.8 ? '#e03a3a' : ten > 0.55 ? '#f2a83a' : '#5cc96a');
        R(bx + 5, by + h - Math.round(h * Math.min(1, k.prog)), 2, Math.round(h * Math.min(1, k.prog)), '#8c9cf8');
      }
    }
    if (S.day > 0.92) R(0, 0, W, H, `rgba(30,20,60,${((S.day - 0.92) * 4).toFixed(2)})`);
  }

  return {
    S,
    start() { S.on = true; $('skyHud').hidden = false; ({ W, H } = dims()); load(); },
    resize() { ({ W, H } = dims()); if (S.on) lay(); },
    step, draw, down, up, net, bait,
    baits() { return [...mine]; },
    closeCard() { $('catch').hidden = true; $('ctOpen').hidden = false; },
  };
}
