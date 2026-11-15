// THE OFFICE'S OWN NUMBERS (PLAN.md 14: «mỗi đồ vật là một thứ thật»): what the room shows is the person's real search.
// The screen: applications sent and replies; the calendar: the days since they started; the papers on the desk: jobs in
// the bucket not yet looked at; the board of letters: those expired or not for them; the mugs: the days they fished this
// week; the plant: green while they come, wilting the longer they stay away. Kept on this device.

import { all } from './box.js';

const DAYS = 'glf.days', FIRST = 'glf.first';
const today = () => new Date().toLocaleDateString('en-CA');
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* this visit alone */ } };
const dayN = (s) => Math.floor(Date.parse(s) / 864e5);

// a day fished: written when the boat sets sail
export function fished() {
  const d = read(DAYS, []);
  if (!d.includes(today())) { d.push(today()); write(DAYS, d.slice(-120)); }
  if (!read(FIRST, null)) write(FIRST, today());
}
export function numbers() {
  const items = all(), days = read(DAYS, []), first = read(FIRST, null), now = dayN(today());
  const applied = items.filter((e) => e.status === 'applied');
  // the streak: days in a row up to today (or yesterday, if today is not fished yet)
  let streak = 0;
  for (let d = days.includes(today()) ? now : now - 1; days.some((s) => dayN(s) === d); d--) streak++;
  const last = days.length ? Math.max(...days.map(dayN)) : null;
  return {
    applied: applied.length,
    replies: applied.filter((e) => e.replied).length,
    day: first ? now - dayN(first) + 1 : 1,
    papers: items.filter((e) => e.status === 'new').length,
    letters: items.filter((e) => e.status === 'expired' || e.status === 'not_for_me').length,
    mugs: days.filter((s) => now - dayN(s) < 7).length,
    away: last == null ? 0 : now - last,                              // days since they last fished
    streak,
    yesterday: (() => { const y = items.filter((e) => dayN(e.day) === now - 1); return { caught: y.length, applied: y.filter((e) => e.status === 'applied').length }; })(),
    first: !first,
  };
}
