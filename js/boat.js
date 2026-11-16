// THE BOAT GOOD LUCK, as the pier and the sky both draw it, seen from above at the front left so its inside shows: the
// far side within, the floorboards, a seat across, the bucket and the net aboard; the mast, a yellow pennant (flying back
// when it sails), a lantern; the near side of the hull, its lit gunwale, its name and a life ring. The duck sits at the
// stern with its rod when it sails. (x, y) is the hull's top left at rest; it bobs with t. Gives back where the rod's tip is.
// For the stage (PLAN.md 18) it comes in two parts, the inside (part 'back') and the near side ('front'), so the duck and
// its rod, between them, can move by themselves; and with bob false, the bob is the stage's, to the screen's own pixel.

import { upright } from './ducks.js';

export const SEAT = { x: 52, y: -9 };                                  // where the duck sits, from the hull's top left
export function drawBoat(px, x, y, t, { duck = false, sailing = false, rod = -0.95, shadow = true, bend = 0, part = 'all', bob: rocks = true, halo = false } = {}) {
  const { R, P, ell, line, poly, text, textW } = px;
  const bob = rocks ? Math.round(Math.sin(t * 1.6) * 1.2) : 0, yy = y + bob, w = 66, inD = 12;
  if (part !== 'front') {
    if (shadow) ell(x + w / 2 - 6, y + 9, w / 2, 3, 'rgba(110,118,170,0.35)');
    if (sailing) for (let i = 0; i < 9; i++) {                                      // cloud spray thrown back behind it
      const k = (t * 1.6 + i / 9) % 1, wx = x + 4 - k * 46, wy = yy + 3 + Math.sin(i * 2.3) * 3 - k * 2;
      px.lump(wx, wy, Math.max(1, Math.round(5 * (1 - k))), 'near');
    } else for (let i = 0; i < 4; i++) ell(x - 2 + i * 22, yy + 6, 6, 1, 'rgba(255,255,255,0.8)');
    // the inside
    poly([[x + 3, yy - 10], [x + w - 3, yy - 10], [x + w - 8, yy - 10 - inD], [x + 10, yy - 10 - inD]], '#6a4224');
    poly([[x + 6, yy - 10], [x + w - 6, yy - 10], [x + w - 10, yy - 6 - inD], [x + 12, yy - 6 - inD]], '#9a6a3e');
    for (let k = 0; k < 3; k++) R(x + 12 - k, yy - 18 + k * 3, w - 22 + k * 2, 1, '#7a5030');
    R(x + 34, yy - 21, 4, 11, '#b88552'); R(x + 34, yy - 21, 4, 1, '#d8aa78');
    R(x + 14, yy - 22, 9, 8, '#9aa0b0'); ell(x + 18, yy - 22, 4, 1, '#c8ccd8'); R(x + 16, yy - 22, 5, 1, '#5a6070');
    for (let i = 0; i < 4; i++) line(x + 25 + i * 2, yy - 13, x + 27 + i * 2, yy - 19, '#c8b888');
    // the mast, its pennant, its lantern
    R(x + 40, yy - 52, 2, 40, '#6a4628'); R(x + 41, yy - 52, 1, 40, '#9a7048');
    const fl = Math.sin(t * (sailing ? 9 : 5)) * 1.5;
    if (sailing) { poly([[x + 40, yy - 52], [x + 24, yy - 49 + fl], [x + 40, yy - 46]], '#ffd84a'); line(x + 40, yy - 46, x + 24, yy - 49 + fl, '#e0b020'); }
    else { poly([[x + 42, yy - 52], [x + 56, yy - 49 + fl], [x + 42, yy - 46]], '#ffd84a'); line(x + 42, yy - 46, x + 56, yy - 49 + fl, '#e0b020'); }
    R(x + 43, yy - 38, 5, 6, '#e8643a'); R(x + 44, yy - 37, 3, 4, '#ffd27a'); R(x + 42, yy - 39, 6, 1, '#3a2a1a');
  }
  // the duck at the stern with its rod, or the rod alone leaning out
  let tip;
  if (part === 'all') {
    if (duck) {
      upright(px, x + SEAT.x, yy + SEAT.y, { sit: true, blink: (t % 5) > 4.85, halo });
      const hx = x + 58, hy = yy - 19, len = 30, a2 = rod + bend * 0.9;     // bend: a fish on, the rod curves toward the line
      tip = [hx + Math.cos(a2) * len, hy + Math.sin(a2) * len];
      const cx = hx + Math.cos(rod) * len * 0.62, cy = hy + Math.sin(rod) * len * 0.62;
      for (let i = 0; i <= 24; i++) {
        const u = i / 24, px0 = (1 - u) * (1 - u) * hx + 2 * (1 - u) * u * cx + u * u * tip[0], py0 = (1 - u) * (1 - u) * hy + 2 * (1 - u) * u * cy + u * u * tip[1];
        R(px0, py0, u < 0.3 ? 2 : 1, u < 0.3 ? 2 : 1, u < 0.3 ? '#3a2410' : '#5a3a1a');                   // the handle thicker
        if (i === 10 || i === 18) P(px0, py0 - 1, '#c8c8d4');                                              // its line guides
      }
      R(hx - 1, hy, 4, 3, '#2a1a10'); P(hx + 1, hy + 1, '#c8c8d4');                                     // the reel
    } else {
      tip = [x + 70, yy - 37];
      line(x + 54, yy - 12, x + 70, yy - 36, '#5a3a1a'); P(x + 70, yy - 37, '#e03a3a');
    }
  }
  if (part !== 'back') {
    // the near side of the hull
    poly([[x, yy - 10], [x + w, yy - 10], [x + w - 8, yy + 5], [x + 8, yy + 5]], '#7e5230');
    R(x - 2, yy - 12, w + 4, 3, '#c08a52'); R(x - 2, yy - 12, w + 4, 1, '#ecc08a');
    for (let i = 0; i < 3; i++) R(x + 3 + i * 2, yy - 6 + i * 4, w - 6 - i * 4, 1, '#5e3c20');
    R(x + w - 10, yy - 9, 6, 13, 'rgba(255,230,190,0.18)');
    text('GOOD LUCK', x + w / 2 - textW('GOOD LUCK') / 2 - 4, yy - 7, '#fff8e7');
    ell(x + w - 12, yy - 3, 4, 4, '#f4efe2'); ell(x + w - 12, yy - 3, 2, 2, '#7e5230'); R(x + w - 16, yy - 4, 2, 2, '#d03a2a'); R(x + w - 10, yy - 4, 2, 2, '#d03a2a');
  }
  return tip;
}
