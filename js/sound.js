// THE SOUNDS (PLAN.md 12, C: «có âm thanh, mặc định tắt, có nút bật»; and 19.5): small ones, made on the spot by the browser's own
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

// ---- THE MUSIC (PLAN.md 19.5: «nhạc nền tự sinh ... không file, không bản quyền»): made on the spot, soft and slow. A pad of
// chords that change every few seconds, a few plucked notes of a five-note scale over them now and then, an echo for room;
// wind in the sky and on the pier. Its colour is the scene's: the office at night low and warm, the escalator a quiet choir,
// the pier a morning, the sky open and airy, sunset lower. It plays only while the sound is on, from the first press on.
const MOODS = {
  office: { chords: [[220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 349.2], [164.8, 207.7, 246.9, 329.6]], scale: [440, 523.3, 587.3, 659.3, 784], every: 5.5, pluck: [1.8, 3.6], vol: 0.014, wind: 0 },
  rise: { chords: [[261.6, 329.6, 392, 523.3], [220, 277.2, 329.6, 440], [293.7, 349.2, 440, 587.3], [246.9, 311.1, 370, 493.9]], scale: [523.3, 659.3, 784, 880, 1046.5], every: 4.5, pluck: [2.4, 4.4], vol: 0.016, wind: 0 },
  pier: { chords: [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 220, 261.6, 349.2], [196, 246.9, 293.7, 392]], scale: [523.3, 587.3, 659.3, 784, 880], every: 4.5, pluck: [1, 2.2], vol: 0.014, wind: 0.01 },
  sea: { chords: [[196, 246.9, 293.7, 392], [164.8, 196, 246.9, 329.6], [130.8, 164.8, 196, 261.6], [146.8, 185, 220, 293.7]], scale: [587.3, 659.3, 784, 880, 987.8], every: 6, pluck: [1.3, 3], vol: 0.013, wind: 0.016 },
  dusk: { chords: [[174.6, 220, 261.6, 329.6], [146.8, 174.6, 220, 293.7], [130.8, 164.8, 196, 246.9], [155.6, 196, 233.1, 311.1]], scale: [466.2, 523.3, 622.3, 698.5, 784], every: 6.5, pluck: [2, 3.8], vol: 0.013, wind: 0.012 },
};
let mood = 'office', mus = null;
export function setMood(m) { if (MOODS[m]) mood = m; }
function musicGraph() {                                              // a master gain and an echo, made once
  ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  const out = ac.createGain(); out.gain.value = 0; out.connect(ac.destination);
  const echo = ac.createDelay(1); echo.delayTime.value = 0.42;
  const fb = ac.createGain(); fb.gain.value = 0.32;
  const wet = ac.createGain(); wet.gain.value = 0.35;
  echo.connect(fb).connect(echo); echo.connect(wet).connect(out);
  const noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource(); src.buffer = noise; src.loop = true;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  const wind = ac.createGain(); wind.gain.value = 0;
  src.connect(lp).connect(wind).connect(out); src.start();
  return { out, echo, wind, next: 0, pluck: 0, chord: 0, timer: null };
}
function pad(freqs, t, len, vol) {                                   // a chord, in slowly and out slowly
  for (const f of freqs) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.detune.setValueAtTime((Math.random() - 0.5) * 8, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 1.6); g.gain.linearRampToValueAtTime(vol * 0.8, t + len); g.gain.linearRampToValueAtTime(0.0001, t + len + 2.2);
    o.connect(g).connect(mus.out); o.start(t); o.stop(t + len + 2.4);
  }
}
function pluck(f, t, vol) {                                          // a plucked note, its echo after it
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  o.connect(g); g.connect(mus.out); g.connect(mus.echo); o.start(t); o.stop(t + 1.5);
}
function music() {                                                    // what is due in the next second, put on the clock
  if (!mus || !on) return;
  const m = MOODS[mood], now = ac.currentTime;
  mus.wind.gain.setTargetAtTime(m.wind, now, 1.5);
  if (now + 1 >= mus.next) {
    const c = m.chords[mus.chord++ % m.chords.length], at = Math.max(now + 0.05, mus.next);
    pad(c, at, m.every, m.vol);
    mus.next = at + m.every;
  }
  if (now + 1 >= mus.pluck) {
    const at = Math.max(now + 0.05, mus.pluck), notes = m.scale;
    pluck(notes[Math.floor(Math.random() * notes.length)] * (Math.random() < 0.2 ? 0.5 : 1), at, m.vol * 1.6);
    if (Math.random() < 0.35) pluck(notes[Math.floor(Math.random() * notes.length)], at + 0.18, m.vol * 1.2);
    mus.pluck = at + m.pluck[0] + Math.random() * (m.pluck[1] - m.pluck[0]);
  }
}
// on: the music fades in (from a press: browsers start sound only after one); off: it fades out
export function playMusic(want) {
  try {
    if (want && on) {
      if (!mus) mus = musicGraph();
      if (ac.state === 'suspended') ac.resume();
      mus.out.gain.setTargetAtTime(1, ac.currentTime, 1.2);
      if (!mus.timer) mus.timer = setInterval(music, 250);
    } else if (mus) {
      mus.out.gain.setTargetAtTime(0, ac.currentTime, 0.6);
      clearInterval(mus.timer); mus.timer = null;
    }
  } catch (e) { /* no sound here */ }
}
