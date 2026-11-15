// THE YELLOW DUCK, IN EVERY POSE THE SCENES NEED: asleep face down on the keyboard; standing; sitting in its boat. Drawn
// from round shapes with the pixel tools, each part outlined a pixel bigger first, so it can be any size and any pose.

const K = '#6b3f10', Y = '#ffd84a', S = '#e5a928', H = '#fff1a8', O = '#f2802a', OD = '#c85a18', EYE = '#1b1f3a';

// asleep on the keyboard, facing left; (hx, hy) is where its cheek rests
export function sleeping(px, hx, hy) {
  const { R, P, ell, poly } = px;
  ell(hx + 17, hy - 9, 15, 11, K); ell(hx + 1, hy - 5, 9, 7, K); ell(hx - 10, hy - 1, 6, 3, K);
  poly([[hx + 27, hy - 14], [hx + 35, hy - 24], [hx + 34, hy - 12]], K);
  ell(hx + 17, hy - 9, 14, 10, S); ell(hx + 17, hy - 11, 13, 8, Y);                  // the body, shaded below
  poly([[hx + 28, hy - 14], [hx + 33, hy - 21], [hx + 32, hy - 13]], Y);              // the tail, up
  ell(hx + 11, hy - 16, 6, 2, H);                                                     // the light on its back
  ell(hx + 15, hy - 5, 9, 4, K); ell(hx + 15, hy - 6, 8, 3, S);                       // the wing, drooping
  R(hx + 8, hy - 3, 4, 3, S); R(hx + 8, hy, 4, 1, K);                                  // its tip over the desk
  ell(hx + 1, hy - 5, 8, 6, Y); ell(hx + 3, hy - 2, 6, 3, S);                         // the head, lying on its cheek
  ell(hx - 10, hy - 1, 5, 2, O); R(hx - 14, hy, 8, 1, OD);                            // the beak, flat on the keys
  R(hx - 3, hy - 7, 3, 1, '#3a2410'); P(hx - 4, hy - 8, '#3a2410');                   // an eye, shut
  P(hx - 15, hy + 1, '#9fd8ff'); P(hx - 15, hy + 2, '#9fd8ff');                       // drool
}

// standing or sitting, facing right; (x, y) is under its feet (standing) or its bottom (sitting). blink: eyes shut
export function upright(px, x, y, { sit = false, blink = false, look = 0 } = {}) {
  const { R, P, ell, poly } = px;
  const b = sit ? y - 7 : y - 10;                                                     // the body's middle
  // outline
  ell(x - 2, b, 11, 8, K); ell(x + 4, b - 11, 7, 7, K); ell(x + 12, b - 10, 5, 3, K);
  poly([[x - 11, b - 3], [x - 17, b - 12], [x - 9, b - 7]], K);
  if (!sit) { R(x - 5, y - 3, 4, 3, K); R(x + 1, y - 3, 4, 3, K); }
  // the body, its shade, its tail
  ell(x - 2, b, 10, 7, S); ell(x - 2, b - 2, 9, 5, Y);
  poly([[x - 10, b - 4], [x - 15, b - 11], [x - 9, b - 7]], Y);
  ell(x - 4, b - 5, 4, 1, H);
  // the wing
  ell(x - 3, b + 1, 6, 4, K); ell(x - 3, b, 5, 3, S); R(x - 6, b - 1, 4, 1, Y);
  // the head, its light, its beak, its eye
  ell(x + 4, b - 11, 6, 6, Y); ell(x + 2, b - 15, 3, 1, H);
  ell(x + 12, b - 10, 4, 2, O); R(x + 9, b - 9, 7, 1, OD);
  if (blink) R(x + 5 + look, b - 12, 3, 1, EYE);
  else { R(x + 6 + look, b - 13, 2, 3, EYE); P(x + 6 + look, b - 13, '#ffffff'); }
  P(x + 9, b - 9, '#f7a8a0');                                                         // a little blush
  if (!sit) { R(x - 4, y - 2, 3, 2, O); R(x + 2, y - 2, 3, 2, O); }                    // its feet
}
