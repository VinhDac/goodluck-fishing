// THE REPORT (PLAN.md 4): the day's numbers, then the list of jobs to act on, each with I applied, Expired, Not for me;
// those applied to below, with the day. The list goes on from day to day (js/box.js).
import { all, mark, replied } from './box.js';

const $ = (id) => document.getElementById(id);
const ago = (ms) => { const h = Math.max(0, (Date.now() - ms) / 36e5), n = h < 48 ? Math.round(h) : Math.round(h / 24), u = h < 48 ? 'hour' : 'day'; return h < 1 ? 'within the hour' : `${n} ${u}${n === 1 ? '' : 's'} ago`; };
let onClose = null;

export function openReport(head, closed) {
  onClose = closed || null;
  $('rpHead').textContent = head || 'Your bucket';
  draw();
  $('report').hidden = false;
}
$('rpBack').addEventListener('click', () => { $('report').hidden = true; if (onClose) onClose(); });

function draw() {
  const items = all(), day = new Date().toLocaleDateString('en-CA'), week = Date.now() - 7 * 864e5;
  const todays = items.filter((e) => e.day === day && e.how !== 'ashore' && e.status !== 'not_for_me');   // kept today, as the sunset counts
  const fresh = items.filter((e) => e.status === 'new').sort((a, b) => (b.job.fit ?? -1) - (a.job.fit ?? -1) || b.job.posted - a.job.posted);
  const applied = items.filter((e) => e.status === 'applied').sort((a, b) => b.at.localeCompare(a.at));
  const away = items.filter((e) => e.status === 'expired' || e.status === 'not_for_me').length;
  $('rpStats').replaceChildren(...[
    [todays.length, 'caught today'], [todays.filter((e) => e.job.size === 'gold').length, 'golden'],
    [fresh.length, 'to look at'], [applied.filter((e) => Date.parse(e.at) >= week).length, 'applied this week'],
  ].map(([n, w]) => { const d = document.createElement('div'); d.innerHTML = `<b>${n}</b><span>${w}</span>`; return d; }));
  const list = $('rpList'); list.replaceChildren();
  const section = (title) => { const h = document.createElement('li'); h.className = 'head'; h.textContent = title; list.appendChild(h); };
  if (!fresh.length && !applied.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Nothing in the bucket yet. Go fishing!'; list.appendChild(li); }
  if (fresh.length) section(`To look at: ${fresh.length}`);
  for (const e of fresh) list.appendChild(row(e, [['I applied', 'applied'], ['Expired', 'expired'], ['Not for me', 'not_for_me']]));
  if (applied.length) section(`Applied: ${applied.length}`);
  for (const e of applied) list.appendChild(row(e, [[e.replied ? 'Reply: yes' : 'Got a reply', 'reply'], ['Undo', 'new']], `applied ${new Date(e.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`));
  $('rpAway').textContent = away ? `${away} put away (expired or not for you).` : '';
}
function row(e, buttons, note) {
  const j = e.job, li = document.createElement('li');
  const t = document.createElement('div'); t.className = 't';
  const b = document.createElement('b'); b.textContent = j.title;
  const s = document.createElement('span');
  s.textContent = [j.fit != null ? `${j.fit}%` : '', j.company, j.place, j.posted ? `posted ${ago(j.posted)}` : '', e.how === 'net' ? 'in the net' : e.how === 'ashore' ? 'washed ashore, not looked at' : '', note || '']
    .filter(Boolean).join(' · ');
  t.append(b, s);
  const a = document.createElement('a'); a.href = j.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open ↗';
  const acts = document.createElement('div'); acts.className = 'acts';
  acts.append(a, ...buttons.map(([label, status]) => {
    const x = document.createElement('button'); x.type = 'button'; x.textContent = label;
    x.onclick = () => { if (status === 'reply') replied(j.id, !e.replied); else mark(j.id, status); draw(); };
    return x;
  }));
  li.append(t, acts);
  return li;
}
