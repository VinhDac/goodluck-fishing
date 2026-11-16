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
  // the catch (PLAN.md 19): the float landing, a sniff, the hook set, up it comes or it slips; how it shows, by how it fits
  plop: () => tone(330, 0.12, { type: 'triangle', slide: -150, vol: 0.035 }),
  nibble: () => tone(1500, 0.03, { type: 'triangle', vol: 0.02 }),
  strike: () => tone(520, 0.12, { type: 'triangle', slide: 700, vol: 0.035 }),
  pop: () => tone(700, 0.06, { type: 'sine', slide: 300, vol: 0.03 }),
  slip: () => [523, 466, 392].forEach((f, i) => tone(f, 0.16, { type: 'triangle', delay: i * 0.12, vol: 0.028 })),
  pip: () => tone(988, 0.08, { type: 'sine', vol: 0.035 }),
  chime2: () => [784, 1175].forEach((f, i) => tone(f, 0.18, { type: 'sine', delay: i * 0.09, vol: 0.035 })),
  chime3: () => [659, 988, 1319].forEach((f, i) => tone(f, 0.2, { type: 'sine', delay: i * 0.09, vol: 0.035 })),
  golden: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.26, { type: 'sine', delay: i * 0.11, vol: 0.04 })); for (let i = 0; i < 8; i++) tone(2093 + (i % 2) * 300, 0.05, { type: 'sine', delay: 0.6 + i * 0.05, vol: 0.012 }); },
  legend: () => { [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.3, { type: 'sine', delay: i * 0.09, vol: 0.038 })); [1568, 1318, 1046].forEach((f, i) => tone(f, 0.4, { type: 'triangle', delay: 0.75 + i * 0.12, vol: 0.025 })); },
  rustle: () => { for (let i = 0; i < 6; i++) tone(2400 + ((i * 437) % 1200), 0.012, { type: 'square', delay: i * 0.018, vol: 0.008 }); },
  stamp: () => { tone(180, 0.05, { type: 'square', vol: 0.03 }); tone(1760, 0.1, { type: 'sine', delay: 0.07, vol: 0.03 }); },
  // the soul's way (PLAN.md 19.1): a soft choir as it leaves; a start as it wakes
  choir: () => { [392, 494, 587, 784].forEach((f, i) => tone(f, 1.6, { type: 'sine', delay: i * 0.08, vol: 0.022, slide: 8 })); },
  wake: () => { tone(330, 0.08, { type: 'triangle', slide: 300, vol: 0.04 }); tone(660, 0.12, { type: 'triangle', delay: 0.08, slide: -120, vol: 0.03 }); },
};
export function sfx(name) { if (!on || !SOUNDS[name]) return; try { SOUNDS[name](); } catch (e) { /* no sound here */ } }
