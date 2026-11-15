// THE BOAT GOOD LUCK, as both the pier and the sky draw it: a wooden hull with its name, a mast with a yellow pennant and a
// lantern, the bucket and the net aboard, a life ring; the duck in it with its rod when it sails. (x, y) is the hull's top
// left at rest; it bobs with t. Gives back where the rod's tip is, for the line.

import { upright } from './ducks.js';

export function drawBoat(px, x, y, t, { duck = false, rod = -0.95, wake = false, shadow = true } = {}) {
  const { R, P, ell, line, poly, text, textW } = px;
  const b = Math.round(Math.sin(t * 1.6) * 1.2), yy = y + b, w = 62;
  if (shadow) ell(x + w / 2, y + 9, w / 2 - 4, 2, 'rgba(120,130,170,0.35)');           // its shadow on the clouds
  if (wake) for (let i = 0; i < 7; i++) {                                              // cloud spray behind it, sailing
    const k = (t * 2 + i / 7) % 1, wx = x - 4 - k * 40, wy = yy + 2 + Math.sin(i * 2.3) * 3;
    ell(wx, wy, Math.round(4 * (1 - k)) + 1, Math.round(2 * (1 - k)) + 1, `rgba(255,255,255,${(0.9 * (1 - k)).toFixed(2)})`);
  }
  // the mast, its pennant (blowing back as it sails), its lantern
  R(x + 30, yy - 44, 2, 40, '#6a4628');
  const fl = Math.sin(t * 5) * 1.5;
  if (wake) poly([[x + 30, yy - 44], [x + 16, yy - 41 + fl], [x + 30, yy - 38]], '#ffd84a');
  else poly([[x + 32, yy - 44], [x + 46, yy - 41 + fl], [x + 32, yy - 38]], '#ffd84a');
  const lx = duck ? x + 23 : x + 33;                                                   // the lantern, clear of the duck
  R(lx, yy - 30, 5, 6, '#e8643a'); R(lx + 1, yy - 29, 3, 4, '#ffd27a'); R(lx - 1, yy - 31, 6, 1, '#3a2a1a');
  // the bucket and the net aboard
  R(x + 10, yy - 18, 9, 7, '#9aa0b0'); R(x + 10, yy - 18, 9, 1, '#c8ccd8'); line(x + 10, yy - 19, x + 14, yy - 23, '#6a6a7a'); line(x + 14, yy - 23, x + 18, yy - 19, '#6a6a7a');
  for (let i = 0; i < 4; i++) line(x + 21 + i * 2, yy - 12, x + 23 + i * 2, yy - 18, '#b8a888');
  // the duck, sitting at the stern with its rod; or the rod alone, leaning out
  let tip;
  if (duck) {
    upright(px, x + 47, yy - 9, { sit: true, blink: (t % 5) > 4.85 });
    const hx = x + 50, hy = yy - 18;
    tip = [hx + Math.cos(rod) * 28, hy + Math.sin(rod) * 28];
    line(hx, hy, tip[0], tip[1], '#5a3a1a'); R(hx - 1, hy - 1, 3, 3, '#3a2a1a');      // the rod, the reel
  } else {
    tip = [x + 62, yy - 31];
    line(x + 48, yy - 8, x + 62, yy - 30, '#5a3a1a'); P(x + 62, yy - 31, '#e03a3a');
  }
  // the hull: its rail, its boards, its name
  poly([[x, yy - 10], [x + w, yy - 10], [x + w - 8, yy + 4], [x + 8, yy + 4]], '#8a5a32');
  R(x - 2, yy - 12, w + 4, 3, '#c08a52'); R(x - 2, yy - 12, w + 4, 1, '#e0b07a');
  for (let i = 0; i < 3; i++) R(x + 3 + i * 2, yy - 6 + i * 4, w - 6 - i * 4, 1, '#6a4224');
  text('GOOD LUCK', x + w / 2 - textW('GOOD LUCK') / 2, yy - 7, '#fff8e7');
  ell(x + w - 10, yy - 4, 4, 4, '#f1ead6'); ell(x + w - 10, yy - 4, 2, 2, '#8a5a32'); R(x + w - 14, yy - 5, 2, 2, '#d03a2a'); R(x + w - 8, yy - 5, 2, 2, '#d03a2a');
  return tip;
}
