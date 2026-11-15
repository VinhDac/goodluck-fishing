// THE FISHING LAKE (PLAN.md 17, Vin, 15/11: «câu từ dưới lên ... ta đang lãng phí đồ họa đẹp mắt ở dưới»; «cho nhiều mây
// lên, để thả như thả hồ cá, rồi bắt»): the boat GOOD LUCK rides high on its own little cloud; the sky beneath it, down to
// the roofs, is the lake; the city is its bed. Every job found rises as a cloud-fish from its company's own roof and swims
// there. The duck leans over the side and lets its line straight down: the bait sinks, the fish come round it, nibble,
// bite; a fish is reeled UP. The best fish swim deep, near the roofs. A sonar in the corner shows the search going on (the
// companies read, the jobs found, the golden ones); a tackle bar along the bottom holds the bait, the hook, the net, who
// fishes (the duck or you), and the bucket. Drawn as the office, the pier and the city are: pixels, three quarters on.

import { makePix, hash } from './pix.js';
import { makeVoyage } from './voyage.js';
import { drawBoat } from './boat.js';

const FISH = {                                                       // a cloud-fish's colours: its outline, top, body, belly
  near: ['#7a84aa', '#fffaf0', '#eef1fa', '#c9d0ea'],
  gold: ['#a8701a', '#fff2b0', '#ffd65a', '#e8b030'],
  old: ['#8a8e9a', '#eceef2', '#d8dce4', '#b8bccb'],
  ghost: ['rgba(140,150,190,0.5)', 'rgba(255,255,255,0.55)', 'rgba(236,240,255,0.45)', 'rgba(200,210,240,0.4)'],
};

export function makeDeep(g) {
  const px = makePix(g), { R, P, ell, line, poly, text, textW } = px;
  const city = makeVoyage(g, { deep: true });
  const L = {};

  function layout(W, H) {
    const wide = W >= H;
    Object.assign(L, { W, H, wide });
    city.layout(W, H);
    L.boat = wide ? { x: Math.round(W * 0.05), y: 68 } : { x: 6, y: 92 };
    L.top = L.boat.y + 16;                                           // the lake: from under the boat's cloud ...
    L.bottom = Math.round(H * (wide ? 0.75 : 0.7));                  // ... down to the roofs
    L.deep = L.top + (L.bottom - L.top) * 0.62;                      // where the golden ones swim
    L.sonar = wide ? { x: W - 94, y: 6, w: 88, h: 66 } : { x: W - 90, y: 6, w: 84, h: 64 };
    L.bar = wide ? { x: W - 150, y: H - 38, w: 144, h: 32 } : { x: 6, y: H - 38, w: W - 12, h: 32 };
    L.talk = wide ? { x: 6, y: H - 30, w: Math.min(150, W - 166), h: 24 } : { x: 6, y: H - 70, w: W - 12, h: 26 };
    L.spots = {};
    return L;
  }

  // ---- a cloud-fish: a cloud with a tail, a fin and an eye; its size the fit, gold from the mark ---------------------------
  function fish(x, y, r, dir, kind, t, ph, { fresh = false, shy = 0 } = {}) {
    const [edge, top, body, belly] = FISH[kind] || FISH.near;
    const wag = Math.sin(t * 7 + ph) * r * 0.28, bx = x - dir * r * 1.15;
    const c = px.ctx;
    if (kind === 'gold') { c.globalCompositeOperation = 'lighter'; ell(x, y, r * 1.6, r, 'rgba(255,200,80,0.16)'); c.globalCompositeOperation = 'source-over'; }
    // outline first, a pixel bigger
    ell(x, y, r * 1.2 + 1, r * 0.72 + 1, edge);
    poly([[bx, y], [bx - dir * r * 0.75, y - r * 0.55 + wag], [bx - dir * r * 0.75, y + r * 0.55 + wag]], edge);
    // the body: a cloud, lit on top, shaded under
    ell(x, y + r * 0.12, r * 1.2, r * 0.62, belly);
    ell(x, y - r * 0.05, r * 1.1, r * 0.55, body);
    ell(x - dir * r * 0.3, y - r * 0.35, r * 0.55, r * 0.35, top);
    ell(x + dir * r * 0.35, y - r * 0.28, r * 0.45, r * 0.3, top);
    // the tail, wagging; a fin on the back
    poly([[bx + dir, y], [bx - dir * r * 0.65, y - r * 0.45 + wag], [bx - dir * r * 0.65, y + r * 0.45 + wag]], body);
    poly([[x - dir * r * 0.2, y - r * 0.55], [x - dir * r * 0.7, y - r * 0.95], [x - dir * r * 0.75, y - r * 0.45]], top);
    // the eye, and a little mouth
    const ex = Math.round(x + dir * r * 0.72), ey = Math.round(y - r * 0.12);
    R(ex, ey, 1, 2, '#1b1f3a'); if (r > 7) P(ex - dir, ey, '#1b1f3a');
    P(Math.round(x + dir * r * 1.12), Math.round(y + r * 0.18), edge);
    if (fresh) for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1 + ph; if (Math.sin(t * 6 + i * 3 + ph) > 0.2) P(x + Math.cos(a) * (r * 1.5 + 2), y + Math.sin(a) * (r * 0.8 + 2), '#ffffff'); }
    if (shy) for (let i = 0; i < 2; i++) P(x + dir * (r + 3 + i * 2), y - r - 2 - i * 2, 'rgba(255,255,255,0.8)');   // bubbles: it is looking at the bait
  }

  // ---- the boat on its cloud, the duck leaning over with its rod -------------------------------------------------------------
  function boatAndCloud(t, st) {
    const { x, y } = L.boat;
    for (const [dx, dy, r] of [[8, 10, 10], [26, 12, 13], [46, 11, 12], [62, 9, 9], [-2, 7, 7]]) px.lump(x + dx, y + dy, r, 'near');
    return drawBoat(px, x, y, t, { duck: true, rod: st.rod ?? 0.3, bend: st.bend || 0, shadow: false });
  }

  // ---- the line, straight down to the bait, sagging a little; the bait on its hook ----------------------------------------------
  function lineTo(tip, b, t, st) {
    const taut = st.taut || 0, sag = (1 - taut) * 6;
    let lx = tip[0], ly = tip[1];
    for (let i = 1; i <= 20; i++) {
      const u = i / 20, x = tip[0] + (b.x - tip[0]) * u + Math.sin(u * Math.PI) * sag, y = tip[1] + (b.y - tip[1]) * u;
      line(lx, ly, x, y, taut > 0.85 ? '#ff9a8a' : 'rgba(255,255,255,0.85)'); lx = x; ly = y;
    }
    R(b.x - 1, b.y - 4, 3, 3, '#6a6a7a');                                                  // the sinker
    line(b.x, b.y - 1, b.x, b.y + 3, '#c8c8d4'); P(b.x + 1, b.y + 4, '#c8c8d4'); P(b.x + 2, b.y + 3, '#c8c8d4');   // the hook
    const w = Math.sin(t * 5) * 1;                                                          // the bait, wriggling
    R(b.x + 1 + w, b.y + 2, 2, 2, '#e88a8a'); P(b.x + 2 + w, b.y + 1, '#e88a8a');
    if (st.label) {                                                                        // what the bait is: a skill of the CV
      const lw = textW(st.label) + 4; R(b.x + 5, b.y - 2, lw, 7, 'rgba(27,31,58,0.8)'); text(st.label, b.x + 7, b.y - 1, '#ffd84a');
    }
    if (st.nibble) for (let i = 0; i < 3; i++) { const k = (t * 1.5 + i / 3) % 1; ell(b.x + Math.sin(i * 2 + t) * 3, b.y - 2 - k * 10, 1, 1, `rgba(255,255,255,${(1 - k).toFixed(2)})`); }
  }

  // ---- a cloud-fish rising from its company's roof (a job just found), its company's name above it ---------------------------
  function rising(r, t) {
    const k = Math.min(1, r.k);
    for (let i = 0; i < 5; i++) { const u = (k - i * 0.12); if (u > 0) px.lump(r.x + Math.sin(i * 2 + t) * 2, r.from - (r.from - r.y) * u, 2 + i * 0.6, 'near'); }
    const y = r.from - (r.from - r.y) * k;
    fish(r.x, y, Math.max(3, r.r * k), r.dir || -1, r.kind || 'near', t, 1);
    const c = px.ctx; c.globalCompositeOperation = 'lighter'; ell(r.x, r.from, 10, 4, 'rgba(255,220,140,0.25)'); c.globalCompositeOperation = 'source-over';
    r.labelAt = { x: r.x, y: y - r.r - 13 };
  }
  function risingName(r) {                                                                  // its company's name, over everything
    const name = (r.name || '').toUpperCase(), w = textW(name) + 6;
    if (!name || !r.labelAt) return;
    R(r.labelAt.x - w / 2 + 1, r.labelAt.y + 1, w, 9, 'rgba(0,0,0,0.3)');
    R(r.labelAt.x - w / 2, r.labelAt.y, w, 9, '#1b1f3a'); R(r.labelAt.x - w / 2, r.labelAt.y, w, 1, '#d9a63a'); text(name, r.labelAt.x - w / 2 + 3, r.labelAt.y + 2, '#ffd84a');
  }

  // ---- the sonar: the search, as a fish-finder shows the water under a boat ------------------------------------------------------
  function sonar(sn, t) {
    const { x, y, w, h } = L.sonar;
    R(x + 2, y + 2, w, h, 'rgba(0,0,0,0.3)');
    R(x, y, w, h, '#2a2e3a'); R(x, y, w, 1, '#4a5060'); R(x, y + h - 1, w, 1, '#14161e'); R(x + w - 1, y, 1, h, '#14161e');
    text('SONAR', x + 4, y + 3, '#c9d0ff'); text(sn.clock || '', x + w - 4 - textW(sn.clock || ''), y + 3, '#ffd84a');
    P(x + 28, y + 5, Math.sin(t * 4) > 0 ? '#7fe0a0' : '#1e5a3a');                                // its light, blinking while it reads
    const sx = x + 4, sy = y + 10, sw = w - 8, sh = h - 30;
    R(sx, sy, sw, sh, '#081a12');
    for (let yy = sy + 5; yy < sy + sh; yy += 6) R(sx, yy, sw, 1, '#0f3322');
    const off = Math.floor(t * 6);
    for (let i = 0; i < sw; i++) {                                                            // the bed: the city's roofs
      const hh = 3 + Math.floor(hash(Math.floor((i + off) / 4)) * 8);
      R(sx + sw - 1 - i, sy + sh - hh, 1, hh, '#1e5a3a');
    }
    for (const b of sn.blips || []) {                                                         // the jobs found: arcs, gold the golden ones
      const bx = sx + sw - 1 - ((b.age * 6) % sw), by = sy + 3 + b.depth * (sh - 12);
      const col = b.gold ? '#ffd84a' : '#7fe0a0';
      P(bx - 1, by + 1, col); P(bx, by, col); P(bx + 1, by, col); P(bx + 2, by + 1, col);
    }
    R(sx + sw - 2, sy, 1, sh, 'rgba(127,224,160,0.6)');                                       // the sweep, at the right
    const k = sn.total ? sn.read / sn.total : 0, by2 = sy + sh + 3;
    R(sx, by2, sw, 3, '#14161e'); R(sx, by2, Math.round(sw * k), 3, '#7fe0a0');
    text(`${(sn.read || 0).toLocaleString('en-GB')}/${(sn.total || 0).toLocaleString('en-GB')}`, sx, by2 + 5, '#c9d0ff');
    const jobs = `${sn.found || 0} JOBS`, gold = `${sn.gold || 0} GOLD`;
    text(jobs, sx, by2 + 11, '#7fe0a0'); text(gold, sx + sw - textW(gold), by2 + 11, '#ffd84a');
    L.spots.sonar = { x, y, w, h };
  }

  // ---- the tackle bar: the bait, the hook, the net, who fishes, the bucket -------------------------------------------------------
  function bar(tb, t) {
    const { x, y, w, h } = L.bar, n = 5, gap = 3, sw = Math.floor((w - 8 - gap * (n - 1)) / n);
    R(x + 2, y + 2, w, h, 'rgba(0,0,0,0.3)');
    R(x, y, w, h, '#8a5a32'); R(x, y, w, 1, '#c08a52'); R(x, y + h - 1, w, 1, '#4a2e16');
    for (let k = x + 6; k < x + w; k += 23) P(k, y + 3, '#6a4224');
    const slots = ['bait', 'hook', 'net', 'who', 'bucket'];
    slots.forEach((name, i) => {
      const sx = x + 4 + i * (sw + gap), sy = y + 3, cx = sx + sw / 2, cy = sy + 10;
      R(sx, sy, sw, h - 6, '#6a4224'); R(sx, sy, sw, 1, '#4a2e16');
      L.spots[`bar:${name}`] = { x: sx, y: sy, w: sw, h: h - 6 };
      let label = '';
      if (name === 'bait') {                                                                   // a jar of the CV's skill
        R(cx - 5, cy - 5, 10, 11, 'rgba(214,240,255,0.7)'); R(cx - 4, cy - 1, 8, 7, '#e8a040'); ell(cx, cy - 6, 5, 1, '#6a6a7a');
        R(cx - 4, cy + 1, 8, 4, '#f4efe2'); const lab = (tb.baitShort || '?'); text(lab, cx - textW(lab) / 2, cy + 1, '#3a2a1a');
        label = 'BAIT';
      } else if (name === 'hook') {                                                            // the hook, its size
        const r = { S: 2, M: 3, L: 4 }[tb.hook || 'S'] || 2;
        R(cx, cy - 7, 1, 6, '#c8c8d4');
        for (let a = 0; a <= Math.PI; a += 0.3) P(cx - r + Math.round(Math.cos(a) * r) + r, cy - 1 + Math.round(Math.sin(a) * r), '#e8e8f0');
        label = `HOOK ${tb.hook || 'S'}`;
      } else if (name === 'net') {                                                             // the landing net, once a day
        const used = tb.netUsed, col = used ? '#6a5a4a' : '#d8c8a0';
        line(cx - 7, cy + 6, cx - 1, cy, col); ell(cx + 2, cy - 2, 5, 4, col); ell(cx + 2, cy - 2, 4, 3, '#6a4224');
        for (let k = -3; k <= 3; k += 2) { line(cx + 2 + k, cy - 5, cx + 2 + k, cy + 1, col); }
        label = used ? 'USED' : 'NET';
      } else if (name === 'who') {                                                             // who fishes: the duck, or you
        if (tb.auto) { ell(cx, cy - 1, 5, 5, '#ffd84a'); R(cx + 4, cy - 1, 4, 2, '#f2802a'); P(cx + 1, cy - 3, '#1b1f3a'); label = 'DUCK'; }
        else { R(cx - 3, cy - 4, 6, 8, '#f0c8a0'); R(cx - 4, cy - 1, 2, 4, '#f0c8a0'); R(cx - 2, cy - 6, 1, 3, '#f0c8a0'); label = 'YOU'; }
      } else {                                                                                 // the bucket, filling
        R(cx - 5, cy - 4, 10, 9, '#9aa0b0'); R(cx - 5, cy - 4, 10, 1, '#c8ccd8'); line(cx - 5, cy - 5, cx, cy - 9, '#6a6a7a'); line(cx, cy - 9, cx + 5, cy - 5, '#6a6a7a');
        if (tb.bucket) for (let k = 0; k < Math.min(4, tb.bucket); k++) ell(cx - 3 + k * 2, cy - 5, 1, 1, '#ffffff');
        label = String(tb.bucket || 0);
      }
      text(label, cx - textW(label) / 2, sy + h - 13, '#fff8e7');
    });
  }

  // ---- the line's tension, beside the boat, while a fish fights ---------------------------------------------------------------
  function gauge(fg) {
    const x = L.boat.x + 92, y = L.boat.y - 44, h = 34;
    text('LINE', x - 3, y - 7, '#fff8e7');
    R(x - 1, y - 1, 7, h + 2, '#1b1f3a'); R(x, y, 5, h, '#3a3f6a');
    R(x, y + h * 0.25, 5, h * 0.45, '#2e6a4a'); R(x, y, 5, h * 0.1, '#7a2a2a');
    const ten = Math.min(1, fg.ten), ky = Math.round(y + h - h * ten);
    R(x - 2, ky - 1, 9, 2, ten > 0.9 ? '#ff5a4a' : ten < 0.25 ? '#c9d0ff' : '#ffffff');
    R(x + 8, y, 3, h, '#3a3f6a'); R(x + 8, y + h - Math.round(h * fg.prog), 3, Math.round(h * fg.prog), '#ffd84a');
  }

  // ---- a gull, following the boat in the hope of a scrap --------------------------------------------------------------------
  function gull(t) {
    const x = L.boat.x + 110 + Math.sin(t * 0.4) * 30, y = L.boat.y - 40 + Math.sin(t * 0.9) * 6, f = Math.sin(t * 8) > 0;
    ell(x, y, 3, 2, '#f6f6f8'); R(x + 3, y - 1, 2, 1, '#f0b030'); P(x + 1, y - 1, '#1b1f3a');
    line(x - 1, y - 1, x - 6, y - (f ? 4 : -1), '#d8dce4'); line(x + 1, y - 1, x + 4, y - (f ? 4 : -1), '#d8dce4');
  }

  // ---- the whole lake --------------------------------------------------------------------------------------------------------
  // st: day, at (how far sailed), speed, names, fish [{x, y, r, dir, kind, fresh, shy, ph}], rising [...], bait {x, y}, label,
  // nibble, bite, taut, bend, fight {ten, prog}, sonar {...}, tools {...}
  function draw(W, H, t, st) {
    px.use(g);
    L.spots = {};
    city.draw(W, H, t, { day: st.day, at: st.at, speed: st.speed ?? 0, names: st.names });
    L.tops = city.L.tops || [];
    for (const r of st.rising || []) rising(r, t);
    for (const f of st.fish || []) fish(f.x, f.y, f.r, f.dir, f.kind, t, f.ph || 0, f);
    for (const r of st.rising || []) risingName(r);
    gull(t);
    const tip = boatAndCloud(t, st);
    L.tip = { x: tip[0], y: tip[1] };
    if (st.bait) lineTo(tip, st.bait, t, st);
    if (st.bite) {                                                                         // «!»: over the duck, nothing else hidden
      const bx = L.boat.x + 50, by = L.boat.y - 48;
      R(bx, by, 7, 10, '#fff8e7'); R(bx, by, 7, 1, '#3a2a1a'); R(bx, by + 9, 7, 1, '#3a2a1a'); R(bx + 3, by + 2, 1, 4, '#d03a2a'); R(bx + 3, by + 7, 1, 1, '#d03a2a');
    }
    if (st.fight) gauge(st.fight);
    sonar(st.sonar || {}, t);
    bar(st.tools || {}, t);
    return L.tip;
  }

  // ---- a lake as it looks a few minutes into a morning: for the stills, and for the web's tutorial -------------------------------
  function demo(t, variant = 'wait') {
    const { W, H, top, bottom, deep, boat } = L, wide = W >= H, n = wide ? 24 : 18;
    const fishes = [];
    for (let i = 0; i < n; i++) {
      const r0 = hash(i * 7.3), kind = i < 3 ? 'gold' : i === n - 1 ? 'ghost' : r0 > 0.86 ? 'old' : 'near';
      const r = kind === 'gold' ? 10 : Math.round(4 + hash(i + 40) * 4);
      const y0 = kind === 'gold' ? deep + 4 + hash(i + 3) * (bottom - deep - 8) : top + 6 + ((i * 0.618) % 1) * (deep - top);   // spread through the depths
      const span = W * 0.18, base = W * (0.08 + hash(i + 9) * 0.86), sp = 0.15 + hash(i + 11) * 0.25;
      let x = base + Math.sin(t * sp + i) * span, dir = Math.cos(t * sp + i) >= 0 ? 1 : -1;
      if (y0 < boat.y + 30 && x < boat.x + 90) x += 90;                                    // not inside the boat's cloud
      fishes.push({ x, y: y0 + Math.sin(t * 0.8 + i) * 2, r, dir, kind, fresh: hash(i + 21) > 0.8, ph: i });
    }
    const st = {
      day: 0.32, at: 3000 + t * (variant === 'fight' ? 0 : 8), names: ['Spotify', 'Monzo', 'Wise', 'Harvey', 'Toast', 'PhysicsX', 'Samsara', 'Magentic'],
      fish: fishes, label: 'PY', sonar: { read: 1240, total: 2840, found: 87, gold: 12, clock: '6:43',
        blips: Array.from({ length: 22 }, (_, i) => ({ age: i * 2.2 + t, depth: hash(i + 70), gold: i % 7 === 0 })) },
      tools: { baitShort: 'PY', hook: 'M', netUsed: false, auto: variant !== 'fight', bucket: 7 },
    };
    // a job just found, rising from its company's roof
    const roofs = (city.L.tops || []).filter((r) => r.x > W * 0.55 && r.x < W * 0.9);
    if (roofs.length) { const rf = roofs[0], k = (t * 0.35) % 1; st.rising = [{ x: rf.x, from: rf.y, y: deep - 6, k, r: 8, name: 'Spotify', dir: -1, kind: 'near' }]; }
    if (variant === 'wait') {
      st.bait = { x: Math.round(W * (wide ? 0.44 : 0.55)), y: Math.round(top + (bottom - top) * 0.45) };
      st.rod = 0.25; st.nibble = Math.sin(t * 1.7) > 0.4;
      const near = fishes[5]; near.x = st.bait.x + 14 + Math.sin(t * 1.3) * 3; near.y = st.bait.y + 2; near.dir = -1; near.shy = 1;
    } else {
      const f = fishes[0];                                                                  // a golden one on the line, coming up
      f.x = Math.round(W * (wide ? 0.38 : 0.5)) + Math.sin(t * 9) * 3; f.y = top + 16 + Math.sin(t * 2) * 3; f.dir = Math.sin(t * 3) > 0 ? 1 : -1;
      st.bait = { x: f.x + f.dir * 13, y: f.y + 2 };                                         // the hook in its mouth
      st.rod = 0.35; st.bend = 0.55 + Math.sin(t * 9) * 0.1; st.taut = 0.7; st.bite = Math.sin(t * 2) > 0.6;
      st.fight = { ten: 0.55 + Math.sin(t * 2.3) * 0.2, prog: 0.68 };
      for (const o of fishes) if (o !== f) {                                                 // the others scatter from the fight
        const dx = o.x - f.x, dy = o.y - f.y, d = Math.hypot(dx, dy) || 1;
        if (d < 34) { o.x = f.x + (dx / d) * 34; o.y = f.y + (dy / d) * 34; o.dir = dx >= 0 ? 1 : -1; }
      }
    }
    return st;
  }

  return { layout, draw, demo, L };
}
