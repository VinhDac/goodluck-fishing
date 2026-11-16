// THE DAY'S LAKE (PLAN.md 14): the jobs in the sky today, for this person. Read from the shared store (static files on the
// repo's store branch, written every six hours by tools/publish.py), kept to their titles and place, without those already
// in their bucket, scored on this device against the CV's skills (the CV never leaves it). Also: the second lake, of jobs
// outside their titles that the CV still fits (the bottle the plane drops), and the numbers the pier's board shows.

import { titleFits, placeFits } from './score.js';
import { has } from './box.js';

export const MARK = 70;                                             // from here a cloud is golden: a job that fits (PLAN.md 14)
export const HOOKS = { small: 0, medium: 40, big: 55 };             // the smallest fit each hook can catch
const FRESH_DAYS = 30;
const STORE = 'https://raw.githubusercontent.com/VinhDac/goodluck-fishing/store';
const REGION_OF = {
  uk: ['london', 'manchester', 'edinburgh', 'glasgow', 'bristol', 'cambridge', 'oxford', 'leeds', 'birmingham', 'belfast', 'cardiff', 'reading', 'brighton'],
  ie: ['dublin', 'cork', 'galway'], de: ['berlin', 'munich', 'hamburg', 'frankfurt'], fr: ['paris', 'lyon'], nl: ['amsterdam', 'rotterdam', 'utrecht'],
  es: ['madrid', 'barcelona', 'valencia'], eu: ['zurich', 'stockholm', 'copenhagen', 'lisbon', 'warsaw', 'vienna', 'prague', 'milan'],
  us: ['new york', 'san francisco', 'seattle', 'boston', 'austin', 'chicago', 'los angeles', 'denver'], ca: ['toronto', 'vancouver', 'montreal'],
  asia: ['singapore', 'hanoi', 'ho chi minh city', 'bangalore', 'tokyo', 'hong kong', 'dubai'], oceania: ['sydney', 'melbourne'],
  latam: ['sao paulo', 'mexico city', 'buenos aires'],
};
export const CITIES_KNOWN = Object.values(REGION_OF).flat();        // the cities whose region the store keeps on its own

// the fit of a job, from the skills the harvester read in it: of what it asks (each ask weighed by how often, three at
// most), how much the CV speaks to; null when it names fewer than three (too little to judge)
export function fitOf(jobSkills, mine) {
  const asks = Object.entries(jobSkills || {});
  if (asks.length < 3) return null;
  let got = 0, all = 0;
  for (const [k, n] of asks) { const w = Math.min(3, n); all += w; if (mine.has(k)) got += w; }
  return Math.round((100 * got) / all);
}
// a cloud's kind from its fit: golden from the mark, then big, medium, small; unread when there is too little to judge
export const sizeOf = (f) => (f == null ? 'unread' : f >= MARK ? 'gold' : f >= HOOKS.big ? 'big' : f >= HOOKS.medium ? 'medium' : 'small');
export const RADIUS = { gold: 12, big: 11, medium: 9, small: 7, unread: 8 };

const best = (a, b) => (b.fit ?? -1) - (a.fit ?? -1) || b.posted - a.posted;

// read the sky for this person: the lake (their titles and place), the bottles (outside their titles, fitting the CV)
export async function readLake(me) {
  const mine = new Set(me.skills || []);
  const city = String(me.city || '').trim().toLowerCase();
  const region = Object.entries(REGION_OF).find(([, cities]) => cities.includes(city));
  const names = region ? [region[0], ...(me.remote ? ['remote'] : [])] : [...Object.keys(REGION_OF), 'remote', 'other'];
  const parts = await Promise.all(names.map((n) => fetch(`${STORE}/${n}.json`, { signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined }).then((r) => (r.ok ? r.json() : { jobs: [] })).catch(() => ({ jobs: [] }))));
  const seen = new Set(), rows = [];
  for (const p of parts) for (const r of p.jobs || []) if (!seen.has(r[0])) { seen.add(r[0]); rows.push(r); }
  const since = Date.now() - FRESH_DAYS * 864e5, mineTitles = me.titles || [];
  const all = rows.map(([id, company, title, place, url, posted, skills]) => {
    const fit = fitOf(skills, mine);
    return { id, company, title, place, url, posted: posted * 1000, skills, fit, size: sizeOf(fit) };
  }).filter((j) => j.posted >= since && !has(j.id) && placeFits(j.place, me.city || '', me.remote));
  const lake = all.filter((j) => titleFits(j.title, mineTitles)).sort(best);
  const inLake = new Set(lake.map((j) => j.id));
  const bottles = all.filter((j) => !inLake.has(j.id) && j.fit != null && j.fit >= MARK).sort(best).slice(0, 12);
  return { lake, bottles, updated: rows.length ? Date.now() : 0 };
}

// the pier's board: how many clouds today where they look, how many remote, how many golden
export function boardOf(lake, me) {
  const remote = (j) => /remote|anywhere|work from home/i.test(j.place);
  const city = String(me.city || '').trim();
  const rows = [];
  if (city) rows.push([city.toUpperCase().slice(0, 9), lake.filter((j) => !remote(j)).length, 'ON TIME']);
  if (me.remote || !city) rows.push(['REMOTE', lake.filter(remote).length, 'ON TIME']);
  rows.push(['GOLDEN', lake.filter((j) => j.size === 'gold').length, 'BOARDING']);
  return rows;
}

// the skills worth offering as bait: the CV's own, by how many of today's clouds ask them
export function baitsOf(lake, me) {
  const n = new Map();
  for (const j of lake) for (const k of Object.keys(j.skills || {})) if ((me.skills || []).includes(k)) n.set(k, (n.get(k) || 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
}
