// THE REPORT (PLAN.md 4, 17 C and 19.4): the day's numbers, then the letters kept to apply to, each with I applied, Expired,
// Not for me; the letters still in the tray, not opened (Keep, Expired, Not for me); those applied to below, with the day. The list goes on from day to day (js/box.js). Opened as the morning's results
// («Catch of the day»), it may also hold what is still in the lake, folded (each can be kept from there), and the buttons
// the moment calls for (Keep fishing, Home) in place of Close. A search over all of it (Vin, 15/11): every word typed is in
// the job's title, company, place or skills. A job's page opens outside the game (js/fleet.js openOut).
import { all, mark, replied, add, todays as bagToday } from './box.js';
import { openOut } from './fleet.js';

const $ = (id) => document.getElementById(id);
const ago = (ms) => { const h = Math.max(0, (Date.now() - ms) / 36e5), n = h < 48 ? Math.round(h) : Math.round(h / 24), u = h < 48 ? 'hour' : 'day'; return h < 1 ? 'within the hour' : `${n} ${u}${n === 1 ? '' : 's'} ago`; };
const LAKE_SHOWN = 80;                                               // of what is still in the lake, shown at once: the search finds the rest
let onClose = null, onKeep = null, pond = [], showPond = false, words = [];

$('rpFind').addEventListener('input', () => { words = $('rpFind').value.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').split(' ').filter(Boolean); draw(); });

// opts: { pond: jobs still in the lake (not in the bucket), keep: what the lake does when one of them is kept from here,
// actions: [{ label, fn }] in place of Close }
export function openReport(head, closed, opts = {}) {
  onClose = closed || null; onKeep = opts.keep || null;
  pond = opts.pond || []; showPond = false;
  $('rpFind').value = ''; words = [];
  $('rpHead').textContent = head || 'Your bucket';
  const acts = $('rpActs'); acts.replaceChildren();
  for (const { label, fn, quiet, stay } of opts.actions || [{ label: 'Close', fn: null }]) {   // stay: it does its thing, the list stays open
    const b = document.createElement('button'); b.type = 'button'; b.className = quiet ? 'ghost' : 'go'; b.textContent = label;
    b.onclick = () => { if (stay) return fn(b); $('report').hidden = true; if (fn) fn(); else if (onClose) onClose(); };
    acts.appendChild(b);
  }
  draw();
  $('report').hidden = false;
}

// every word typed begins a word of the job's («ai» finds AI, not retail or Dubai; «pyth» finds Python)
const said = (j) => ` ${[j.title, j.company, j.place, ...(Array.isArray(j.skills) ? j.skills : Object.keys(j.skills || {}))].join(' ').toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ')}`;
const found = (j) => { const s = said(j); return words.every((w) => s.includes(` ${w}`)); };

function draw() {
  const items = all(), week = Date.now() - 7 * 864e5;
  const todays = bagToday();                                          // kept today: the BAG button's own number
  const byFit = (a, b) => (b.job.fit ?? -1) - (a.job.fit ?? -1) || b.job.posted - a.job.posted;
  const keep = items.filter((e) => e.status === 'keep').sort(byFit);
  const fresh = items.filter((e) => e.status === 'new').sort(byFit);
  const applied = items.filter((e) => e.status === 'applied').sort((a, b) => b.at.localeCompare(a.at));
  const away = items.filter((e) => e.status === 'expired' || e.status === 'not_for_me').length;
  $('rpStats').replaceChildren(...[
    [todays.length, 'in the bag today'], [todays.filter((e) => e.job.size === 'gold').length, 'golden'],
    [keep.length, 'to apply'], [applied.filter((e) => Date.parse(e.at) >= week).length, 'applied this week'],
  ].map(([n, w]) => { const d = document.createElement('div'); d.innerHTML = `<b>${n}</b><span>${w}</span>`; return d; }));
  // what is still in the lake: not in the bucket, the best first; any of them can be kept from here
  const kept = new Set(items.map((e) => e.job.id)), left = pond.filter((j) => !kept.has(j.id));
  const keepHit = keep.filter((e) => found(e.job)), freshHit = fresh.filter((e) => found(e.job)), appliedHit = applied.filter((e) => found(e.job)), leftHit = left.filter(found);
  const list = $('rpList'); list.replaceChildren();
  const section = (title) => { const h = document.createElement('li'); h.className = 'head'; h.textContent = title; list.appendChild(h); return h; };
  const note = (text) => { const li = document.createElement('li'); li.className = 'empty'; li.textContent = text; list.appendChild(li); };
  const of = (hit, whole) => (words.length ? `${hit.length} of ${whole.length}` : `${whole.length}`);
  if (!keep.length && !fresh.length && !applied.length && !left.length) note('Nothing in the bag yet. Go fishing!');
  else if (!keepHit.length && !freshHit.length && !appliedHit.length && !leftHit.length) note('Nothing here has those words.');
  if (keepHit.length) section(`To apply: ${of(keepHit, keep)}`);
  for (const e of keepHit) list.appendChild(row(e, [['I applied', 'applied'], ['Expired', 'expired'], ['Not for me', 'not_for_me']]));
  if (freshHit.length) section(`In the tray, not opened: ${of(freshHit, fresh)}`);
  for (const e of freshHit) list.appendChild(row(e, [['Keep', 'keep'], ['Expired', 'expired'], ['Not for me', 'not_for_me']]));
  if (appliedHit.length) section(`Applied: ${of(appliedHit, applied)}`);
  for (const e of appliedHit) list.appendChild(row(e, [[e.replied ? 'Reply: yes' : 'Got a reply', 'reply'], ['Undo', 'keep']], `applied ${new Date(e.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`));
  if (leftHit.length) {
    const h = section(`Still in the sky: ${of(leftHit, left)}`);
    if (!words.length) {                                              // folded, unless a search is looking in it
      const tog = document.createElement('button'); tog.type = 'button'; tog.className = 'fold'; tog.textContent = showPond ? 'Hide' : 'See all';
      tog.onclick = () => { showPond = !showPond; draw(); };
      h.appendChild(tog);
    }
    if (showPond || words.length) {
      for (const j of leftHit.slice(0, LAKE_SHOWN)) list.appendChild(row({ job: j, how: 'lake' }, [['Keep', 'catch']]));
      if (leftHit.length > LAKE_SHOWN) note(`And ${leftHit.length - LAKE_SHOWN} more. Search to find one.`);
    }
  }
  $('rpAway').textContent = away ? `${away} put away (expired or not for you).` : '';
}
function row(e, buttons, note) {
  const j = e.job, li = document.createElement('li');
  const t = document.createElement('div'); t.className = 't';
  const b = document.createElement('b'); b.textContent = j.title;
  const s = document.createElement('span');
  s.textContent = [j.fit != null ? `${j.fit}%` : '', j.company, j.place, j.posted ? `posted ${ago(j.posted)}` : '',
    e.how === 'net' ? 'in the net' : e.how === 'ashore' ? 'left at sunset, not opened' : '', note || '']
    .filter(Boolean).join(' · ');
  t.append(b, s);
  const a = document.createElement('a'); a.href = j.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open ↗';
  a.onclick = (ev) => { ev.preventDefault(); openOut(j.url); };
  const acts = document.createElement('div'); acts.className = 'acts';
  acts.append(a, ...buttons.map(([label, status]) => {
    const x = document.createElement('button'); x.type = 'button'; x.textContent = label;
    x.onclick = () => {
      if (status === 'catch') { if (add(j, 'caught', 'keep') && onKeep) onKeep(j); }
      else if (status === 'reply') replied(j.id, !e.replied);
      else mark(j.id, status);
      draw();
    };
    return x;
  }));
  li.append(t, acts);
  return li;
}
