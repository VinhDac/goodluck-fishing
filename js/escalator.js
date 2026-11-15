// THE GOLDEN ESCALATOR, as the office and the pier both draw it: seen from the front left, the far balustrade behind,
// the steps (each a lit tread and a riser in shade, climbing), the golden truss under them, the near glass and its black
// handrail, a round rail end and a landing plate at whichever ends show. It climbs from (bx, by) up to the right to
// (tx, ty), x moving `slope` pixels for each pixel climbed.

const D = [13, -9];                                                 // from the near side to the far side

export function drawEscalator(px, { bx, by, tx, ty, slope, t = 0, bottom = true, top = false }) {
  const { R, P, ell, line, poly } = px;
  const rise = 5, run = rise * slope, escX = (y) => bx + (by - y) * slope;
  // the far balustrade and handrail, behind the steps
  poly([[bx + D[0], by - 22 + D[1]], [tx + D[0], ty - 22 + D[1]], [tx + D[0], ty + D[1]], [bx + D[0], by + D[1]]], 'rgba(190,230,255,0.10)');
  line(bx + D[0] - 2, by - 23 + D[1], tx + D[0], ty - 23 + D[1], '#2a1c0c', 2);
  // the steps, climbing
  const n = Math.ceil((by - ty) / rise) + 1, ph = (t * 0.9) % 1;
  for (let i = n; i >= -1; i--) {
    const y = by - (i + ph) * rise, x = escX(y);
    if (y > by + 1 || y < ty - 4) continue;
    poly([[x, y], [x + run, y], [x + run + D[0], y + D[1]], [x + D[0], y + D[1]]], '#f6d264');
    poly([[x, y], [x + D[0], y + D[1]], [x + D[0], y + D[1] + rise], [x, y + rise]], '#b8862a');
    line(x, y, x + run, y, '#fff0a8');
  }
  // the golden truss under the steps, its rivets, its shadowed underside
  const u = rise + 1;
  poly([[bx + run, by + u], [tx + run, ty + u], [tx + run, ty + u + 16], [bx + run, by + u + 16]], '#c9952a');
  poly([[bx + run, by + u + 11], [tx + run, ty + u + 11], [tx + run, ty + u + 16], [bx + run, by + u + 16]], '#8a5f18');
  line(bx + run, by + u, tx + run, ty + u, '#ffe58a');
  for (let y = by - 8; y > ty; y -= 14) P(escX(y) + run + 4, y + u + 7, '#ffe9a0');
  // the near glass and the handrail
  poly([[bx - 2, by - 3], [tx - 2, ty - 3], [tx - 2, ty - 22], [bx - 2, by - 22]], 'rgba(200,236,255,0.16)');
  line(bx - 2, by - 22, tx - 2, ty - 22, '#17100a', 3); line(bx - 2, by - 24, tx - 2, ty - 24, '#e8c25a');
  if (bottom) { ell(bx - 4, by - 15, 5, 7, '#17100a'); ell(bx - 4, by - 16, 3, 5, '#3a2a14'); R(bx - 30, by + 1, 34, 5, '#b8b8c4'); for (let x = bx - 28; x < bx + 2; x += 3) R(x, by + 2, 1, 3, '#8a8a96'); }
  if (top) { ell(tx + 1, ty - 16, 5, 7, '#17100a'); ell(tx + 2, ty - 17, 3, 5, '#3a2a14'); R(tx + run, ty + 1, 30, 4, '#c8c8d4'); for (let x = tx + run + 2; x < tx + run + 30; x += 3) R(x, ty + 2, 1, 2, '#8a8a96'); }
  return { escX, run };
}
