// THE REPORT (PLAN.md 4, and 17 C): the day's numbers, then the list of jobs to act on, each with I applied, Expired, Not for
// me; those applied to below, with the day. The list goes on from day to day (js/box.js). Opened as the morning's results
// («Catch of the day»), it may also hold what is still in the lake, folded (each can be kept from there), and the buttons
// the moment calls for (Keep fishing, Home) in place of Close.
import { all, mark, replied, add } from './box.js';

const $ = (id) => document.getElementById(id);
const ago = (ms) => { const h = Math.max(0, (Date.now() - ms) / 36e5), n = h < 48 ? Math.round(h) : Math.round(h / 24), u = h < 48 ? 'hour' : 'day'; return h < 1 ? 'within the hour' : `${n} ${u}${n === 1 ? '' : 's'} ago`; };
let onClose = null, pond = [], showPond = false;

// opts: { pond: jobs still in the lake (not in the bucket), actions: [{ label, fn }] in place of Close }
export function openReport(head, closed, opts = {}) {
  onClose = closed || null;
  pond = opts.pond || []; showPond = false;
  $('rpHead').textContent = head || 'Your bucket';
  const acts = $('rpActs'); acts.replaceChildren();
  for (const { label, fn, quiet } of opts.actions || [{ label: 'Close', fn: null }]) {
    const b = document.createElement('button'); b.type = 'button'; b.className = quiet ? 'ghost' : 'go'; b.textContent = label;
    b.onclick = () => { $('report').hidden = true; if (fn) fn(); else if (onClose) onClose(); };
    acts.appendChild(b);
  }
  draw();
  $('report').hidden = false;
}

function draw() {
  const items = all(), day = new Date().toLocaleDateString('en-CA'), week = Date.now() - 7 * 864e5;
  const todays = items.filter((e) => e.day === day && e.how !== 'ashore' && e.status !== 'not_for_me' && e.status !== 'expired');   // kept today, as the sunset counts
  const fresh = items.filter((e) => e.status === 'new').sort((a, b) => (b.job.fit ?? -1) - (a.job.fit ?? -1) || b.job.posted - a.job.posted);
  const applied = items.filter((e) => e.status === 'applied').sort((a, b) => b.at.localeCompare(a.at));
  const away = items.filter((e) => e.status === 'expired' || e.status === 'not_for_me').length;
  $('rpStats').replaceChildren(...[
    [todays.length, 'caught today'], [todays.filter((e) => e.job.size === 'gold').length, 'golden'],
    [fresh.length, 'to look at'], [applied.filter((e) => Date.parse(e.at) >= week).length, 'applied this week'],
  ].map(([n, w]) => { const d = document.createElement('div'); d.innerHTML = `<b>${n}</b><span>${w}</span>`; return d; }));
  const list = $('rpList'); list.replaceChildren();
  const section = (title) => { const h = document.createElement('li'); h.className = 'head'; h.textContent = title; list.appendChild(h); return h; };
  if (!fresh.length && !applied.length && !pond.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Nothing in the bucket yet. Go fishing!'; list.appendChild(li); }
  if (fresh.length) section(`To look at: ${fresh.length}`);
  for (const e of fresh) list.appendChild(row(e, [['I applied', 'applied'], ['Expired', 'expired'], ['Not for me', 'not_for_me']]));
  if (applied.length) section(`Applied: ${applied.length}`);
  for (const e of applied) list.appendChild(row(e, [[e.replied ? 'Reply: yes' : 'Got a reply', 'reply'], ['Undo', 'new']], `applied ${new Date(e.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`));
  // what is still in the lake: not in the bucket; folded, the best first; any of them can be kept from here
  const left = pond.filter((j) => !items.some((e) => e.job.id === j.id));
  if (left.length) {
    const h = section(`Still in the lake: ${left.length}`);
    const tog = document.createElement('button'); tog.type = 'button'; tog.className = 'fold'; tog.textContent = showPond ? 'Hide' : 'See all';
    tog.onclick = () => { showPond = !showPond; draw(); };
    h.appendChild(tog);
    if (showPond) for (const j of left.slice(0, 80)) list.appendChild(row({ job: j, how: 'lake' }, [['Keep', 'keep']]));
  }
  $('rpAway').textContent = away ? `${away} put away (expired or not for you).` : '';
}
function row(e, buttons, note) {
  const j = e.job, li = document.createElement('li');
  const t = document.createElement('div'); t.className = 't';
  const b = document.createElement('b'); b.textContent = j.title;
  const s = document.createElement('span');
  s.textContent = [j.fit != null ? `${j.fit}%` : '', j.company, j.place, j.posted ? `posted ${ago(j.posted)}` : '',
    e.how === 'net' ? 'in the net' : e.how === 'ashore' ? 'washed ashore, not looked at' : '', note || '']
    .filter(Boolean).join(' · ');
  t.append(b, s);
  const a = document.createElement('a'); a.href = j.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open ↗';
  const acts = document.createElement('div'); acts.className = 'acts';
  acts.append(a, ...buttons.map(([label, status]) => {
    const x = document.createElement('button'); x.type = 'button'; x.textContent = label;
    x.onclick = () => {
      if (status === 'keep') add(j, 'caught');
      else if (status === 'reply') replied(j.id, !e.replied);
      else mark(j.id, status);
      draw();
    };
    return x;
  }));
  li.append(t, acts);
  return li;
}
