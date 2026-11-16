// THE FISHING BOX (PLAN.md 4 and step 5): every job caught (or netted, or off a snapped line) kept from day to day with
// its state: new, keep, applied, expired, not_for_me. On this device alone: no account, no sign-in (PLAN.md 15 E and 20 D).

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
  return true;
}
// the person's own word on a job: applied, expired, not for me (or back to new)
export function mark(id, status) {
  if (!box[id]) return;
  box[id].status = status; box[id].at = new Date().toISOString();
  keep();
}

// a reply came for a job applied to: kept on this device (the office's screen counts them)
export function replied(id, yes = true) {
  if (!box[id]) return;
  box[id].replied = yes; keep();
}
