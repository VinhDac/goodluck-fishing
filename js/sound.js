// THE SOUNDS (PLAN.md 12, C: «có âm thanh, mặc định tắt, có nút bật»): small ones, made on the spot by the browser's own
// synthesiser (no files): a quack, the cast's swish, the bite's ping, the reel's clicks, a catch, the net, a horn, the
// board's flaps. Off until the person turns them on; their choice kept on this device.

const KEY = 'glf.sound';
let on = (() => { try { return localStorage.getItem(KEY) === 'on'; } catch (e) { return false; } })();
let ac = null;
export const soundOn = () => on;
export function setSound(v) { on = v; try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) { /* this visit alone */ } }

function tone(freq, dur, { type = 'square', vol = 0.05, slide = 0, delay = 0 } = {}) {
  ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  const t = ac.currentTime + delay, o = ac.createOscillator(), gn = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
const SOUNDS = {
  quack: () => { tone(520, 0.09, { type: 'sawtooth', slide: -180 }); tone(470, 0.1, { type: 'sawtooth', slide: -160, delay: 0.11 }); },
  swish: () => tone(900, 0.18, { type: 'triangle', slide: -600, vol: 0.03 }),
  splash: () => tone(200, 0.15, { type: 'triangle', slide: -120, vol: 0.04 }),
  bite: () => { tone(1320, 0.07, { type: 'square', vol: 0.04 }); tone(1760, 0.09, { delay: 0.08, vol: 0.04 }); },
  reel: () => tone(2200, 0.02, { type: 'square', vol: 0.015 }),
  catch: () => [660, 880, 1100].forEach((f, i) => tone(f, 0.1, { delay: i * 0.08, vol: 0.04 })),
  fanfare: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, { delay: i * 0.1, vol: 0.045 })),
  snap: () => tone(300, 0.2, { type: 'sawtooth', slide: -250, vol: 0.04 }),
  net: () => tone(400, 0.3, { type: 'triangle', slide: 300, vol: 0.03 }),
  horn: () => { tone(196, 0.5, { type: 'sawtooth', vol: 0.03 }); tone(247, 0.5, { type: 'sawtooth', vol: 0.02 }); },
  hum: () => tone(110, 0.8, { type: 'sine', vol: 0.03, slide: 60 }),
  flaps: () => { for (let i = 0; i < 10; i++) tone(1800 + i * 40, 0.015, { delay: i * 0.03, vol: 0.02 }); },
  clink: () => tone(1500, 0.06, { type: 'triangle', vol: 0.04 }),
  dusk: () => [784, 659, 523].forEach((f, i) => tone(f, 0.25, { type: 'triangle', delay: i * 0.18, vol: 0.035 })),
};
export function sfx(name) { if (!on || !SOUNDS[name]) return; try { SOUNDS[name](); } catch (e) { /* no sound here */ } }
