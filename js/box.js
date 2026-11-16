// THE FISHING BOX (PLAN.md 4 and step 5): every job caught (or netted, or off a snapped line) kept from day to day with
// its state: new, applied, expired, not_for_me. On this device always; signed in, in the table catches too (each person's
// own rows, by row level security), so the list follows them to any device. Never the CV.
import { sb, user } from './account.js';

const KEY = 'glf.box';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
let box = load();
const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(box)); } catch (e) { /* a private window: this visit alone */ } };
const today = () => new Date().toLocaleDateString('en-CA');
const slim = (j) => ({ id: j.id, company: j.company, title: j.title, place: j.place, url: j.url, posted: j.posted, fit: j.fit, size: j.size,
  skills: j.skills ? (Array.isArray(j.skills) ? j.skills : Object.keys(j.skills)) : undefined });   // the skill names alone, for the report's search

export const all = () => Object.values(box);
export const has = (id) => !!box[id];
// in the bag today: kept today, not put away (expired, not for me), not left at sunset unopened: the BAG button's number,
// the same as the report's «caught today»
export const todays = () => { const d = today(); return all().filter((e) => e.day === d && e.how !== 'ashore' && e.status !== 'not_for_me' && e.status !== 'expired'); };

// a catch into the box; a job already there keeps its state
export function add(job, how, status = 'new') {
  if (box[job.id]) return false;
  box[job.id] = { job: slim(job), day: today(), how, status, at: new Date().toISOString() };
  keep();
  push(box[job.id]);
  return true;
}
// the person's own word on a job: applied, expired, not for me (or back to new)
export function mark(id, status) {
  if (!box[id]) return;
  box[id].status = status; box[id].at = new Date().toISOString();
  keep();
  push(box[id]);
}

// a reply came for a job applied to: kept on this device (the office's screen counts them)
export function replied(id, yes = true) {
  if (!box[id]) return;
  box[id].replied = yes; keep();
}

// signed in: each change written to catches; the table's own words for how it came (a snapped line was a catch)
async function push(e) {
  try {
    const u = await user();
    if (!u) return;
    await (await sb()).from('catches').upsert({ user_id: u.id, job_id: e.job.id, day: e.day, how: e.how === 'net' ? 'net' : 'caught',
      status: e.status, status_at: e.at });
  } catch (err) { /* kept on this device; written next time */ }
}
// signed in: what the account holds comes in (another device's catches), and what only this device held goes up
export async function sync() {
  const u = await user();
  if (!u) return false;
  const c = await sb();
  const { data, error } = await c.from('catches').select('job_id,day,how,status,status_at,jobs(company,title,place,url,posted)');
  if (error) return false;
  const there = new Set();
  for (const r of data || []) {
    there.add(r.job_id);
    const mine = box[r.job_id];
    if (!mine || (r.status_at > mine.at)) {
      box[r.job_id] = { job: { id: r.job_id, ...(r.jobs || {}), posted: Date.parse((r.jobs || {}).posted) || 0, fit: mine ? mine.job.fit : null,
        size: mine ? mine.job.size : 'unread' }, day: r.day, how: r.how, status: r.status, at: r.status_at,
        ...(mine && mine.replied ? { replied: true } : {}) };
    }
  }
  keep();
  for (const e of all()) if (!there.has(e.job.id)) push(e);
  return true;
}
