// THE FLEET, AS THE GAME SEES IT (PLAN.md 16: «chơi và tìm là một»): in the app, the boats are real searches on this
// computer (app/fleet.py). The game sends them out when the person presses the boat, asks every moment what they have
// found, raises a cloud for each job the moment it is found, and calls them home at sunset. When a cloud is hooked, its
// posting is asked whether it is still up. On the web there is no fleet: inApp is false and none of this runs.

export const inApp = !!window.GLF_APP;
let after = 0, timer = null;
export const boats = {};                                              // each boat as the app last said: state, read, total, found

async function post(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  return r.json();
}
export async function moored() {                                      // the boats at the pier, before they go
  try { const r = await (await fetch('/api/fleet/poll?after=999999')).json(); Object.assign(boats, r.boats || {}); } catch (e) { /* the app not there */ }
  return boats;
}
// out: every boat, for this person's titles and place; the boards the shared store knows have jobs for them read first
export async function sail(me, first, on) {
  after = 0;
  const r = await post('/api/fleet/start', { titles: me.titles || [], city: me.city || '', remote: !!me.remote, first });
  if (!r || !r.ok) throw new Error('refused');                             // never a search line waiting on boats that never left
  clearInterval(timer);
  timer = setInterval(async () => {
    let r;
    try { r = await (await fetch(`/api/fleet/poll?after=${after}`)).json(); } catch (e) { return; }
    Object.assign(boats, r.boats || {});
    for (const e of r.events || []) {
      after = Math.max(after, e.seq);
      if (e.kind === 'job') on.job({ ...e.job, posted: e.job.posted * 1000, boat: e.boat });
      else on.boat(e);
    }
    if (Object.values(boats).every((b) => b.state === 'home')) { clearInterval(timer); timer = null; on.allHome(); }
  }, 600);
}
export function callHome() { clearInterval(timer); timer = null; post('/api/fleet/stop').catch(() => {}); }
// a job's own page, never in place of the game (Vin, 15/11): in the app the person's own browser opens it (the window holds
// the game alone); on the web, a new tab
export function openOut(url) {
  if (!/^https?:\/\//i.test(url || '')) return;
  if (inApp) post('/api/open', { url }).catch(() => window.open(url, '_blank', 'noopener'));
  else window.open(url, '_blank', 'noopener');
}
export async function stillOpen(id) {                                 // true, false, or null when it cannot be told
  try { return (await (await fetch(`/api/check?id=${encodeURIComponent(id)}`)).json()).open; } catch (e) { return null; }
}
