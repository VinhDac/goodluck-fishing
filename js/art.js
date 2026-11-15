// THE PICTURES BOTH SCENES SHARE: the yellow duck (GoodLuck's duck: its round head, raised tail and little beak), drawn
// from rows of letters, one letter a pixel.
export function sprite(rows, ink) {
  const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, i) => { if (ink[ch]) { x.fillStyle = ink[ch]; x.fillRect(i, y, 1, 1); } }));
  return c;
}
export const DUCK = [
  '.........kkkkk......',
  '........kwwwwwk.....',
  '.......kwwwwwwwk....',
  '.......kwwwwwEwk....',
  '.......kwwwwwwwkkk..',
  '.......kwwwwwwwoook.',
  '........kwwwwwwkkk..',
  '.kk......kwwwwwk....',
  'kwwk....kwwwwwwk....',
  'kwwwkkkkwwwwwwwwk...',
  'kwwwwwwwwwwwwwwwwk..',
  'kwwwwwwdddwwwwwwwk..',
  'kwwwwwdwwwdwwwwwwk..',
  '.kwwwwwwwwwwwwwwwk..',
  '.ksssssssssssssssk..',
  '..kssssssssssssk....',
  '...kkkkkkkkkkkk.....',
];
export const INK = { k: '#7a4a12', w: '#ffd84a', s: '#f2b52a', o: '#f2802a', d: '#e9a92a' };
export const AWAKE = sprite(DUCK, { ...INK, E: '#1b1f3a' });
export const ASLEEP = sprite(DUCK.map((r, i) => (i === 3 ? r.replace('wE', 'zz') : r)), { ...INK, z: '#5a3a10' });
