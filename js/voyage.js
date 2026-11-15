// THE SKY WHILE FISHING, MOVING (Vin, 15/11: «cảnh trời tòa nhà cho nó di chuyển liên tục để tạo cảm giác nó đang đi»):
// the boat sails on and the world goes by under it. Four depths, each at its own pace: high thin clouds, the far city in
// the haze, the near city (the companies whose jobs are in the sky, their names on billboards on their roofs; water towers,
// aerials blinking, gardens, a helipad, windows lighting up as the day goes), and wisps of cloud rushing past in front.
// Now and then a little plane goes over trailing NOW HIRING. The day runs from morning to sunset (day: 0 to 1).

import { makePix, hash } from './pix.js';
import { drawBoat } from './boat.js';

export function makeVoyage(g) {
  const px = makePix(g), { R, P, ell, line, poly, text, textW, puff } = px;
  const L = {};
  let names = ['Goggle', 'Amazoom', 'Snoozle', 'Facepalm'];

  function layout(W, H) {
    const wide = W >= H;
    Object.assign(L, { W, H, wide });
    L.ground = H;                                                   // the city stands on the bottom edge
    L.cityH = Math.round(H * (wide ? 0.34 : 0.26));                 // the tallest tower's height
    L.boat = { x: Math.round(W * (wide ? 0.08 : 0.06)), y: Math.round(H * (wide ? 0.52 : 0.48)) };
    // the near city: a strip of buildings that comes round again, made up the same way every time
    L.strip = []; let x = 0;
    for (let i = 0; i < 48; i++) {
      const w = 22 + Math.round(hash(i) * 22), h = Math.round(L.cityH * (0.42 + hash(i + 100) * 0.58));
      L.strip.push({ i, x, w, h, roof: Math.floor(hash(i + 200) * 6), sign: i % 3 === 1 });
      x += w + 2 + Math.round(hash(i + 300) * 5);
    }
    L.stripW = x;
    return L;
  }

  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  function sky(t, day) {
    const { W, H } = L, late = Math.max(0, (day - 0.72) / 0.28);
    const top = mix([79, 155, 224], [58, 52, 120], late), low = mix([214, 236, 250], [250, 160, 110], late);
    for (let i = 0; i < 18; i++) R(0, (i * H) / 18, W, H / 18 + 1, `rgb(${mix(top, low, (i / 17) ** 1.3)})`);
    // the sun across the day
    const sx = W * (0.32 + day * 0.6), sy = H * 0.62 - Math.sin(Math.PI * Math.min(1, day * 1.05)) * H * 0.5;
    g.globalCompositeOperation = 'lighter';
    for (const [r, a] of [[34, 0.07], [20, 0.10]]) ell(sx, sy, r, r, `rgba(255,${200 - late * 60},120,${a})`);
    g.globalCompositeOperation = 'source-over';
    ell(sx, sy, 8, 8, late > 0.5 ? '#ffd0a0' : '#fff3c4');
    // high thin clouds, slowest
    for (let i = 0; i < 6; i++) {
      const x = ((hash(i) * (W + 80) - t * (3 + i)) % (W + 80) + W + 80) % (W + 80) - 40, y = 10 + hash(i + 9) * H * 0.3;
      R(x, y, 26 + hash(i + 3) * 24, 1, 'rgba(255,255,255,0.55)'); R(x + 7, y + 2, 16 + hash(i + 4) * 14, 1, 'rgba(255,255,255,0.35)');
    }
  }
  function plane(t) {                                                // every forty seconds, a plane with a banner
    const { W } = L, k = (t % 40) / 14;
    if (k > 1) return;
    const x = W + 60 - k * (W + 200), y = 22 + Math.sin(t) * 1.5;
    ell(x, y, 6, 2, '#e8e8f0'); R(x - 2, y - 4, 3, 4, '#d03a2a'); R(x + 4, y - 1, 2, 1, '#1b1f3a'); R(x - 6, y - 2, 2, 4, '#d03a2a');
    const word = 'NOW HIRING', bw = textW(word) + 6, bx = x + 16;
    line(x + 6, y, bx, y, '#8a8a96');
    R(bx, y - 4, bw, 8, '#fff8e7'); text(word, bx + 3, y - 2, '#d03a2a');
    for (let i = 0; i < 4; i++) P(bx + bw + i, y - 3 + ((i + Math.floor(t * 8)) % 2) * 6, '#fff8e7');
  }
  function farCity(t) {                                              // the far city in the haze
    const { W, H, cityH } = L, off = t * 4;
    for (let i = 0; i < 80; i++) {
      const w = 10 + hash(i + 500) * 14, h = cityH * (0.5 + hash(i + 600) * 0.7), x = ((i * 16 - off) % (80 * 16) + 80 * 16) % (80 * 16) - 20;
      if (x > W + 20) continue;
      R(x, H - h, w, h, '#a9bfdc'); if (hash(i + 700) > 0.7) R(x + w / 2, H - h - 5, 1, 5, '#a9bfdc');
    }
    R(0, H - cityH * 0.5, W, cityH * 0.5, 'rgba(200,220,240,0.35)');                                  // the haze
  }
  function building(b, x, t, day) {
    const { H } = L, y = H - b.h, wall = b.sign ? '#5b6b8c' : '#56658a', dark = '#46547a';
    R(x, y, b.w, b.h, wall); R(x + b.w - 3, y, 3, b.h, dark); R(x, y, b.w, 1, '#7a8ab0');
    // the windows: glass by day, lit as the day goes
    const lit = Math.max(0, (day - 0.55) / 0.45);
    for (let yy = y + 4; yy < H - 3; yy += 5) for (let xx = x + 3; xx < x + b.w - 5; xx += 4) {
      const r = hash(b.i * 131 + xx * 7 + yy * 3);
      R(xx, yy, 2, 3, r < lit * 0.8 ? '#ffe6a0' : r > 0.86 ? '#a8c8e8' : '#3e4a66');
    }
    // what is on the roof
    const cx = x + b.w / 2;
    switch (b.roof) {
      case 0: {                                                      // a water tower
        R(cx - 4, y - 3, 1, 3, '#3a3a4a'); R(cx + 3, y - 3, 1, 3, '#3a3a4a');
        R(cx - 5, y - 10, 10, 7, '#8a5a32'); for (let k = 0; k < 3; k++) R(cx - 5, y - 9 + k * 2, 10, 1, '#6a4224');
        poly([[cx - 6, y - 10], [cx + 6, y - 10], [cx, y - 14]], '#5a3a22');
        break;
      }
      case 1: {                                                      // an aerial, its light blinking
        R(cx, y - 14, 1, 14, '#3a3a4a'); R(cx - 2, y - 9, 5, 1, '#3a3a4a');
        if (Math.sin(t * 3 + b.i) > 0.3) { P(cx, y - 15, '#ff4a3a'); P(cx - 1, y - 15, 'rgba(255,74,58,0.4)'); P(cx + 1, y - 15, 'rgba(255,74,58,0.4)'); }
        break;
      }
      case 2: {                                                      // a garden
        R(x + 2, y - 2, b.w - 5, 2, '#6a4a2a');
        for (let k = x + 3; k < x + b.w - 4; k += 3) ell(k, y - 3 - (k % 2), 1, 1, k % 4 ? '#5ab07a' : '#e88aa0');
        break;
      }
      case 3: {                                                      // a helipad
        if (b.w < 30) { R(cx - 3, y - 3, 6, 3, '#8a8a96'); break; }
        ell(cx, y - 1, 8, 1, '#3a3a4a'); text('H', cx - 1, y - 4, '#ffd84a');
        break;
      }
      default: R(x + 3, y - 3, 6, 3, '#8a8a96'); R(x + b.w - 11, y - 4, 5, 4, '#9a9aa6');               // air conditioning
    }
    // a billboard with a company's name: the companies whose jobs are in the sky
    if (b.sign) {
      let n = names[b.i % names.length].toUpperCase();
      while (textW(n) + 6 > b.w + 22 && n.length > 3) n = n.slice(0, -1);                   // a long name cut to its board
      const sw = textW(n) + 6, sx = cx - sw / 2, sy = y - 15 - (b.roof === 0 || b.roof === 1 ? 2 : 0);
      R(sx + 2, sy + 7, 1, 8, '#3a3a4a'); R(sx + sw - 3, sy + 7, 1, 8, '#3a3a4a');
      R(sx, sy, sw, 8, '#1b1f3a'); R(sx, sy, sw, 1, '#d9a63a');
      text(n, sx + 3, sy + 2, lit > 0.2 ? '#ffd84a' : '#fff8e7');
    }
  }
  function city(t, day, speed) {
    const off = (t * speed) % L.stripW;
    for (const b of L.strip) for (const rep of [0, L.stripW]) {
      const x = b.x + rep - off;
      if (x > -50 && x < L.W + 50) building(b, x, t, day);
    }
  }
  function wisps(t) {                                                // clouds rushing by in front, fastest
    const { W, H } = L;
    for (let i = 0; i < 5; i++) {
      const sp = 38 + hash(i + 900) * 20, x = ((hash(i + 800) * (W + 160) - t * sp) % (W + 160) + W + 160) % (W + 160) - 80;
      const y = H * (0.66 + hash(i + 950) * 0.3);
      puff(x, y, 9 + hash(i + 990) * 8, 'rgba(255,255,255,0.85)', 'rgba(220,230,245,0.75)');
    }
  }

  function draw(W, H, t = 0, data = {}) {
    px.use(g);
    if (data.names && data.names.length) names = data.names;
    const day = data.day ?? 0.3, speed = data.speed ?? 14;
    sky(t, day); plane(t); farCity(t); city(t, day, speed);
    const tip = drawBoat(px, L.boat.x, L.boat.y, t, { duck: true, wake: true, shadow: false, rod: data.rod ?? -0.95 });
    for (const c of data.clouds || []) puff(c.x, c.y, c.r, c.gold ? '#ffd65a' : '#ffffff', c.gold ? '#e8b030' : '#dfe8f4');
    wisps(t);
    return tip;
  }
  return { layout, draw, L };
}
