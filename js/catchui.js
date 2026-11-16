// THE WORDS OF A CATCH (PLAN.md 19, 5: «không còn bảng chặn màn hình»): when the duck holds a letter up, a small paper tag
// over it says what it is (its title, its company, its stars, and New, Posted today, Perfect, a stamp found), then fades.
// A press on the tag slides a sheet in at the side with the rest (where, how long ago, how it fits the CV) and Open, Not for
// me; no veil, nothing to answer: the sky goes on behind it. Used by the game and by its trying page (tools/catch.html).

const CSS = `
.ctag, .cside, .cside button { font-variant-ligatures: none; font-feature-settings: "liga" 0, "clig" 0; }
.ctag { position: fixed; z-index: 6; left: 0; top: 0; transform: translate(-50%, -100%); max-width: min(270px, calc(100vw - 20px));
  background: #fff8e7; color: #1b1f3a; border: 3px solid #3a2a1a; border-radius: 4px; box-shadow: 0 3px 0 #3a2a1a;
  padding: 5px 10px 6px; font: 600 13px/1.25 "Pixelify Sans", ui-monospace, monospace; text-align: center; cursor: pointer;
  opacity: 0; transition: opacity .25s ease-out, margin-top .3s ease-out; margin-top: 8px; user-select: none; -webkit-user-select: none; }
.ctag.in { margin-top: 0; }
.ctag .k { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #8a6a3a; }
.ctag .ti { font-size: 14px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.ctag .co { font-weight: 400; color: #5a4a30; }
.ctag .st { color: #d9a020; letter-spacing: .05em; margin-left: 4px; }
.ctag .mk { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; margin-top: 3px; }
.ctag .mk span { font: 600 10px "Pixelify Sans", monospace; padding: 0 5px; border-radius: 2px; background: #efe3c4; color: #5a4a30; }
.ctag .mk .new { background: #d03a2a; color: #fff8e7; }
.ctag.t3 { border-color: #b8860b; box-shadow: 0 3px 0 #8a6410, 0 0 14px rgba(255, 216, 74, .65); }
.ctag.t3 .k { color: #b8860b; }
.ctag.legend { border-color: #7a4ad0; box-shadow: 0 3px 0 #4a2a90, 0 0 16px rgba(170, 140, 255, .6); }
.ctag.legend .k { background: linear-gradient(90deg, #e0443a, #e8a020, #4aa84a, #3a7ad0, #8a4ad0); -webkit-background-clip: text; background-clip: text; color: transparent; }
.ctag.gull { border-style: dashed; }
.ctag.junk { border-color: #8a8478; background: #f1ece0; }
.ctag.junk .k { color: #8a3a2a; }
.cside .stamps { display: grid; grid-template-columns: repeat(auto-fill, minmax(54px, 1fr)); gap: 6px; margin-top: 8px; max-height: 40vh; overflow: auto; }
.cside .stamp { position: relative; height: 54px; border: 3px dotted #fff8e7; outline: 1px solid #d8c597; display: flex; align-items: center; justify-content: center; text-align: center;
  font: 600 10px/1.1 "Pixelify Sans", monospace; color: #fff8e7; padding: 3px; overflow: hidden; }
.cside .stamp.gold { outline: 2px solid #d9a63a; box-shadow: 0 0 6px rgba(255,216,74,.7); }
.cside .stamp.empty { background: repeating-linear-gradient(45deg, #efe3c4, #efe3c4 4px, #f6ecd2 4px, #f6ecd2 8px); color: #b8a67e; }
.cside .recs { margin: 10px 0 0; padding: 0; list-style: none; font-size: 13px; color: #3a2a1a; }
.cside .recs li { padding: 2px 0; border-bottom: 1px dashed #e2d3ab; }
.cside .recs b { font-family: "Pixelify Sans", monospace; }

.cside { position: fixed; z-index: 7; right: max(12px, env(safe-area-inset-right)); top: 64px; width: min(320px, calc(100vw - 24px));
  background: #fff8e7; color: #1b1f3a; border: 3px solid #3a2a1a; border-radius: 4px; box-shadow: 0 5px 0 #3a2a1a, 0 14px 30px rgba(0,0,0,.35);
  padding: 12px 14px; font: 14px/1.45 system-ui, sans-serif; transform: translateX(calc(100% + 30px)); transition: transform .3s cubic-bezier(.2,.8,.3,1); }
.cside.in { transform: none; }
.cside .x { position: absolute; right: 6px; top: 2px; border: 0; background: none; font: 600 20px "Pixelify Sans", monospace; color: #8a6a3a; cursor: pointer; }
.cside .k { font: 600 12px "Pixelify Sans", monospace; letter-spacing: .08em; text-transform: uppercase; color: #8a6a3a; padding-right: 20px; }
.cside h2 { font: 600 18px/1.2 "Pixelify Sans", monospace; margin: 4px 0 2px; }
.cside .who { font-weight: 600; }
.cside .meta, .cside .fit { color: #5a4a30; margin: 6px 0 0; font-size: 13px; }
.cside .row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; align-items: center; }
.cside .row button, .cside .row a { font: 600 14px "Pixelify Sans", monospace; color: #1b1f3a; background: #efe3c4; border: 2px solid #3a2a1a; border-radius: 3px;
  padding: 6px 12px; cursor: pointer; text-decoration: none; box-shadow: 0 2px 0 #3a2a1a; }
.cside .row a { background: #ffd84a; }
.cside .said { color: #5a4a30; font-size: 13px; }
.cside .lst { max-height: min(52vh, 420px); overflow: auto; margin-top: 8px; border-top: 2px dashed #d8c597; }
.cside .it { all: unset; display: block; box-sizing: border-box; width: 100%; padding: 7px 2px; border-bottom: 1px dashed #e2d3ab; cursor: pointer; }
.cside .it:hover { background: #fff2cc; }
.cside .it .ti { display: block; font: 600 14px/1.25 "Pixelify Sans", monospace; }
.cside .it .co { display: block; font: 12px system-ui, sans-serif; color: #5a4a30; }
.cside .it .st { color: #d9a020; }
.cside .day { font: 600 11px "Pixelify Sans", monospace; letter-spacing: .08em; text-transform: uppercase; color: #8a6a3a; padding: 10px 2px 3px; border-bottom: 1px dashed #e2d3ab; }
.cside .day:first-child { padding-top: 4px; }
@media (max-width: 560px) { .cside { top: auto; bottom: 64px; left: 10px; right: 10px; width: auto; transform: translateY(calc(100% + 90px)); } .cside.in { transform: none; } }
`;

const STARS = { 1: '★', 2: '★★', 3: '★★★', legend: '★★★' };
const KICK = { 3: 'Golden letter!', legend: 'From a dream company!', junk: 'Junk! Into the drawer' };
const ago = (ms) => { const h = Math.max(0, (Date.now() - ms) / 36e5), n = h < 48 ? Math.round(h) : Math.round(h / 24), u = h < 48 ? 'hour' : 'day'; return h < 1 ? 'posted within the hour' : `posted ${n} ${u}${n === 1 ? '' : 's'} ago`; };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

// how a letter fits, said plainly: their own CV, or while they have given none, the typical CV of their field (PLAN.md 20 B)
export function fitWords(j, mine, sample = '') {
  if (j.fit == null) return 'Its posting names too little to weigh: open it to judge.';
  const asks = Array.isArray(j.skills) ? j.skills : Object.keys(j.skills || {});   // the box keeps a letter's skills as a list
  const have = asks.filter((k) => mine.has(k)).slice(0, 5).join(', ') || 'none of it', miss = asks.filter((k) => !mine.has(k)).slice(0, 5);
  const more = miss.length ? ` It asks too: ${miss.join(', ')}.` : '';
  return sample ? `Fits a typical ${sample} CV ${j.fit}%. That CV says: ${have}.${more} Drop your own CV on the desk to weigh it against yours.`
    : `Fits you ${j.fit}%. Your CV says: ${have}.${more}`;
}

// toCss(x, y): a point of the scene, in the page's pixels; skills(): the CV's skills; sample(): the field whose typical CV is
// in use, or ''; away(job): Not for me; open(url)
export function makeCatchUI({ toCss, skills = () => new Set(), sample = () => '', away = () => {}, open = (u) => window.open(u, '_blank', 'noopener') } = {}) {
  if (!document.getElementById('catchui-css')) { const st = el('style'); st.id = 'catchui-css'; st.textContent = CSS; document.head.appendChild(st); }
  const tag = el('div', 'ctag'); tag.hidden = true; document.body.appendChild(tag);
  const side = el('div', 'cside'); side.hidden = true; document.body.appendChild(side);
  let shown = 0, job = null, w = 0;
  tag.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (job && !job.junk) sheet(job, tag.dataset); });

  function build(t) {                                                  // a new catch: its tag, written once
    job = t.job; tag.className = `ctag${t.tier === 3 ? ' t3' : t.tier === 'legend' ? ' legend' : ''}${t.gull ? ' gull' : ''}${t.junk ? ' junk' : ''}`;
    tag.replaceChildren();
    const kick = KICK[t.tier] || (t.gull ? 'Airmail, from the gull' : '');
    if (kick) tag.appendChild(el('div', 'k', kick));
    tag.appendChild(el('div', 'ti', job.title));
    const co = el('div', 'co', job.company || '');
    if (STARS[t.tier]) co.appendChild(el('span', 'st', STARS[t.tier]));
    if (!t.junk) tag.appendChild(co);
    const marks = [t.isNew && ['new', 'New'], t.fresh && ['', 'Posted today'], t.perfect && ['', 'Perfect'], t.stamp && ['', '+1 stamp']].filter(Boolean);
    if (marks.length) { const mk = el('div', 'mk'); for (const [c, s] of marks) mk.appendChild(el('span', c, s)); tag.appendChild(mk); }
    Object.assign(tag.dataset, { tier: String(t.tier), gull: t.gull ? '1' : '' });
    tag.hidden = false; tag.classList.remove('in'); tag.style.opacity = '0';
    w = tag.offsetWidth;
    requestAnimationFrame(() => tag.classList.add('in'));
  }
  function update(v) {                                                 // each frame: where the tag is, and how faded
    const t = v && v.tag;
    if (!t) { if (!tag.hidden) { tag.hidden = true; } return; }
    if (t.id !== shown) { shown = t.id; build(t); }
    const p = toCss(t.at.x, t.at.y - 7), half = w / 2 + 10, hgt = tag.offsetHeight;
    if (p.y - hgt >= 8) {                                              // over the letter, when there is room above it
      tag.style.transform = 'translate(-50%, -100%)';
      tag.style.left = `${Math.max(half, Math.min(innerWidth - half, p.x))}px`; tag.style.top = `${p.y}px`;
    } else {                                                           // else beside it, to its right
      const q = toCss(t.at.x + 12, t.at.y);
      tag.style.transform = 'translate(0, -50%)';
      tag.style.left = `${Math.min(innerWidth - w - 10, q.x)}px`; tag.style.top = `${Math.max(hgt / 2 + 8, q.y)}px`;
    }
    tag.style.opacity = String(Math.max(0, Math.min(1, t.age / 0.2, (t.life - t.age) / 0.7)));
  }
  function sheet(j, d) {                                               // the rest of it, at the side; the sky goes on behind
    side.replaceChildren();
    const x = el('button', 'x', '×'); x.type = 'button'; x.title = 'Close'; x.onclick = shut;
    const kick = KICK[d.tier] || (d.gull ? 'Airmail, from the gull: not one of your titles, but the CV fits it' : d.kick || 'In your bag');
    side.append(x, el('div', 'k', kick), el('h2', '', j.title), el('div', 'who', j.company || ''),
      el('p', 'meta', [j.place, j.posted ? ago(j.posted) : ''].filter(Boolean).join(' · ')),
      el('p', 'fit', fitWords(j, skills(), sample())));
    const row = el('div', 'row'), a = el('a', '', 'Open ↗'), no = el('button', '', 'Not for me'), said = el('span', 'said', '');
    a.href = j.url || '#'; a.target = '_blank'; a.rel = 'noopener';
    a.onclick = (e) => { e.preventDefault(); if (j.url) open(j.url); };
    no.type = 'button'; no.onclick = () => { away(j); said.textContent = 'Put away.'; no.disabled = true; setTimeout(shut, 900); };
    row.append(a, no, said); side.appendChild(row);
    side.hidden = false; side.classList.remove('in'); void side.offsetWidth; side.classList.add('in');
  }
  function list(title, jobs, tierOf = () => 0, kick = '') {            // a list (the bag of the day, the bucket by day): each, at a press, its rest
    side.replaceChildren();
    const x = el('button', 'x', '×'); x.type = 'button'; x.title = 'Close'; x.onclick = shut;
    const box = el('div', 'lst');
    if (!jobs.length) box.appendChild(el('p', 'said', 'Nothing in it yet: cast, and wait for a bite.'));
    for (const j of jobs) {
      if (typeof j === 'string') { box.appendChild(el('div', 'day', j)); continue; }   // a day's heading
      const b = el('button', 'it'), tier = tierOf(j); b.type = 'button';
      const co = el('span', 'co', j.company || ''); if (STARS[tier]) co.appendChild(el('span', 'st', ` ${STARS[tier]}`));
      if (j.note) co.appendChild(document.createTextNode(` · ${j.note}`));
      b.append(el('span', 'ti', j.title), co);
      b.onclick = () => sheet(j, { tier: String(tier), gull: j.bottle ? '1' : '', kick });
      box.appendChild(b);
    }
    side.append(x, el('div', 'k', title), box);
    side.hidden = false; side.classList.remove('in'); void side.offsetWidth; side.classList.add('in');
  }
  function shut() { side.classList.remove('in'); setTimeout(() => { if (!side.classList.contains('in')) side.hidden = true; }, 320); }
  side.addEventListener('pointerdown', (e) => e.stopPropagation());
  function page(title, nodes) {                                        // anything at the side: the album, the drawer
    side.replaceChildren();
    const x = el('button', 'x', '×'); x.type = 'button'; x.title = 'Close'; x.onclick = shut;
    side.append(x, el('div', 'k', title), ...nodes);
    side.hidden = false; side.classList.remove('in'); void side.offsetWidth; side.classList.add('in');
  }
  return { update, sheet, list, page, el, shut, get open() { return !side.hidden && side.classList.contains('in'); } };
}
