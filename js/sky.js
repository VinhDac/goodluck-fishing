// THE SKY (PLAN.md 3 and step 4, part 1): the duck's boat on a cloud, the city of the companies below, and the clouds
// that are jobs: real ones from the shared store (Supabase), for the person's titles and place, scored on this device
// against the CV's skills (the CV never leaves it). Big cloud, good fit; a golden one, 85 and over; a bright edge, posted
// within a day. Click a cloud to cast at it; hooked, it is reeled in and its card shows the job. Ten minutes a day:
// the sun crosses the sky, and at sunset the boat goes home (the bucket and the report: step 5).
import { AWAKE } from './art.js';
import { sb } from './account.js';
import { titleFits, placeFits } from './score.js';

const DAY = 600, SHOWN = 8, FRESH_DAYS = 14;
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

export function makeSky(g, dims, toCss) {
  const S = { on: false, t: 0, day: 0, over: false, lake: [], clouds: [], caught: [], cast: null, said: '', loaded: false };
  let W = 320, H = 180;
  const me = (() => { try { return JSON.parse(localStorage.getItem('glf.me')) || {}; } catch (e) { return {}; } })();
  const mine = new Set(me.skills || []);

  // ---- the clouds come from the shared store: the jobs for this person's titles and place, the best fits first -------
  async function load() {
    say('Reading the sky…');
    try {
      const since = new Date(Date.now() - FRESH_DAYS * 864e5).toISOString();
      const word = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      const heads = [...new Set((me.titles || []).map((t) => word(t).split(' ').pop()).filter(Boolean))];
      let q = (await sb()).from('jobs').select('id,company,title,place,url,posted,skills').eq('open', true).eq('agency', false)
        .gte('posted', since).order('posted', { ascending: false }).limit(1000);
      if (heads.length) q = q.or(heads.map((h) => `title.ilike.*${h}*`).join(','));
      const city = word(me.city || '');
      if (city) q = q.or(`place.ilike.*${city}*` + (me.remote ? ',place.ilike.*remote*' : ''));
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      S.lake = (data || []).filter((j) => titleFits(j.title, me.titles || []) && placeFits(j.place, me.city || '', me.remote))
        .map((j) => { const fit = fitOf(j.skills, mine); return { ...j, fit, size: sizeOf(fit), posted: Date.parse(j.posted) || 0 }; })
        .sort((a, b) => (b.fit ?? -1) - (a.fit ?? -1) || b.posted - a.posted);
      S.loaded = true;
      say(S.lake.length ? `${S.lake.length} clouds for you today. Click one to cast.` : 'No new jobs for you in the sky today. Come back tomorrow.');
      city_(data || []);
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
    const n = Math.max(1, CITY.length), w = (W - 8) / n;
    CITY.forEach((b, i) => {
      b.x = 4 + i * w; b.w = Math.max(10, w - 3); b.h = 18 + ((i * 37) % 22); b.y = H - b.h;
      const s = document.createElement('span'); s.className = 'sign' + (b.real ? '' : ' decor'); s.textContent = b.n;
      const p = toCss(b.x + b.w / 2, b.y - 1); s.style.left = `${p.x}px`; s.style.top = `${p.y}px`;
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
  function click(p) {
    if (!S.on || S.over || S.cast) return;
    const t = tip();
    const hit = S.clouds.find((c) => Math.hypot(c.x - p.x, c.y - p.y) <= c.r + 3);
    S.cast = { x0: t.x, y0: t.y, x: p.x, y: p.y, age: 0, fly: 0.5, hit, phase: 'fly' };
  }
  function step(dt) {
    if (!S.on) return;
    S.t += dt;
    if (!S.over && $('catch').hidden) { S.day = Math.min(1, S.day + dt / DAY); if (S.day >= 1) sunset(); }
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
        else { say('Missed: no cloud there. Click right on one.'); S.cast = null; }
      } else if (k.phase === 'bite' && k.age >= 0.7) { k.phase = 'reel'; k.age = 0; k.from = { x: k.hit.x, y: k.hit.y }; }
      else if (k.phase === 'reel') {
        const t = tip(), e = Math.min(1, k.age / 1.1);
        k.hit.x = k.from.x + (t.x - k.from.x) * e; k.hit.y = k.from.y + (t.y - k.from.y) * e; k.hit.r = Math.max(3, RADIUS[k.hit.job.size] * (1 - e * 0.7));
        if (e >= 1) landed(k.hit);
      }
    }
    clock();
  }
  function landed(c) {
    S.clouds.splice(S.clouds.indexOf(c), 1);
    S.cast = null;
    S.caught.push(c.job);
    $('skyCount').textContent = S.caught.length;
    card(c.job);
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
  function sunset() {
    S.over = true; S.cast = null;
    $('ctKicker').textContent = 'The sun has set';
    $('ctTitle').textContent = `${S.caught.length} cloud${S.caught.length === 1 ? '' : 's'} caught today`;
    $('ctWho').textContent = ''; $('ctMeta').textContent = 'The boat goes home; the bucket and the day\'s report come next.';
    $('ctFit').textContent = ''; $('ctOpen').hidden = true; $('catch').hidden = false;
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
    for (const b of CITY) { R(b.x, b.y, b.w, b.h, b.real ? '#5b6b8c' : '#7b86a0'); for (let y = b.y + 3; y < H - 2; y += 4) for (let x = b.x + 2; x < b.x + b.w - 2; x += 4) R(x, y, 2, 2, (x * y) % 7 ? '#ffe6a0' : '#4a5878'); }
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
    }
    if (S.day > 0.92) R(0, 0, W, H, `rgba(30,20,60,${((S.day - 0.92) * 4).toFixed(2)})`);
  }

  return {
    S,
    start() { S.on = true; $('skyHud').hidden = false; ({ W, H } = dims()); load(); },
    resize() { ({ W, H } = dims()); if (S.on) lay(); },
    step, draw, click,
    closeCard() { $('catch').hidden = true; $('ctOpen').hidden = false; },
  };
}
