// Mole City: shop interiors (painted once into the cached cell art), their shopkeepers and
// customers (live), the Grand Lift from the vault, and commuters walking the tunnels.
// Shop art lives in cell-local units: a cell is 150 x 132, the plank floor starts at y = 108 and
// feet stand at y = 118. The right-hand strip (x 104..128) is kept clear for the ladders.
import { rr, fillRR, ell, circ, shade, rng, star, coinIcon, drawCheese, drawMouse } from './draw.js';
import { drawMole, drawHamster } from './creatures.js';
import { texRect } from './textures.js';
import { glow } from './glow.js';
import { CELL_W, CELL_H, DEEP_COLS, DEEP_ROWS, cellX, cellY, cellId, cellKind } from '../data/deep.js';
import { BIZ_BY_ID, bizTier, LIFT_X, LIFT_ROWS } from '../data/mole.js';
import { fmtTime } from '../core/format.js';
import { art } from './sprites.js';

const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';
const F = CELL_H - 24; // top of the plank floor
const FEET = CELL_H - 14; // where customers stand

/* =================================================================== */
/* Who walks around down here                                           */
/* =================================================================== */
const LOOKS = {
  mouse: [
    { fur: '#c9b29b', belly: '#f4e9dc', scarf: '#4f7cac' }, { fur: '#e8e1d8', belly: '#fffaf3', hat: 'bow', hatCol: '#f28b82' },
    { fur: '#a98467', belly: '#ecd9c6', hat: 'beret', hatCol: '#3d7a5a' }, { fur: '#8f7f73', belly: '#d9cdc2', scarf: '#e9b949' },
    { fur: '#d9c7b0', belly: '#fff6e8', hat: 'cap', hatCol: '#b5523b' },
  ],
  hamster: [
    { fur: '#e0a15a' }, { fur: '#f2d2a0', belly: '#fffaf0', scarf: '#9b6fb0' }, { fur: '#c9a27a', hat: 'bow', hatCol: '#e0404f' },
    { fur: '#9a8a80', belly: '#efe6dc', bag: '#4f7cac' }, { fur: '#e8b878', scarf: '#3d7a5a', hat: 'cap', hatCol: '#e9b949' },
  ],
  mole: [
    { fur: '#5f5049', helmet: false, hat: 'cap', hatCol: '#4f7cac' }, { fur: '#6b5a52', helmet: false, scarf: '#e9b949' },
    { fur: '#4f4440', helmet: false, hat: 'top' }, { fur: '#6d5d55', helmet: false, hat: 'beret', hatCol: '#9b6fb0' },
  ],
};
// Scrambles nearby seeds so neighbouring visitors don't come out alike.
const mix = (n) => { n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); return (n ^ (n >>> 16)) >>> 0; };
// A random visitor from a seed: mice and hamsters ride down the lift, moles live here.
function visitor(seed, prefer) {
  const R = rng(mix(seed * 7919 + 13));
  const u = R();
  const kind = prefer && u < 0.5 ? prefer : u < 0.5 ? 'mouse' : u < 0.8 ? 'hamster' : 'mole';
  const list = LOOKS[kind];
  return { kind, look: list[Math.floor(R() * list.length)] };
}
// Draws any resident with a pose that suits their species.
export function drawCritter(ctx, x, y, who, pose, dir, t, s = 1, extra = {}) {
  if (who.kind === 'mouse') { drawMouse(ctx, x, y, { ...who.look, ...extra, pose, dir, t, s: 0.7 * s, noShadow: pose === 'sit' }); return; }
  if (who.kind === 'hamster') {
    const hp = pose === 'walk' || pose === 'eat' || pose === 'sit' ? pose : pose === 'point' || pose === 'pay' ? 'wave' : 'stand';
    drawHamster(ctx, x, y, { ...who.look, ...extra, pose: hp, dir, t, s: 0.8 * s, noShadow: pose === 'sit' }); return;
  }
  const mp = pose === 'walk' ? 'walk' : pose === 'pay' || pose === 'eat' ? 'serve' : pose === 'point' ? 'wave' : 'stand';
  drawMole(ctx, x, y, { ...who.look, ...extra, pose: mp, dir, t, s: 0.8 * s, noShadow: pose === 'sit' });
}

/* =================================================================== */
/* Shop interiors (cached)                                              */
/* =================================================================== */
// The shop's back wall, painted before the floor and ladders.
export function paintBizWall(ctx, id, conn) {
  const b = BIZ_BY_ID[id]; const [L, Rt] = conn.split('').map((v) => v === '1');
  const x0 = L ? 22 : 12; const x1 = Rt ? 128 : 138;
  ctx.save(); rr(ctx, 8, 10, CELL_W - 16, CELL_H - 20, 16); ctx.clip();
  const g = ctx.createLinearGradient(0, 14, 0, F);
  g.addColorStop(0, shade(b.wall, -0.06)); g.addColorStop(1, shade(b.wall, 0.14));
  ctx.fillStyle = g; ctx.fillRect(x0, 14, x1 - x0, F - 14);
  texRect(ctx, 'plaster', x0, 14, x1 - x0, F - 14, 0.35);
  if (id === 'spa') { // tiled walls
    ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 0.6;
    for (let y = 22; y < F; y += 8) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    for (let x = x0 + 8; x < x1; x += 8) { ctx.beginPath(); ctx.moveTo(x, 19); ctx.lineTo(x, F - 20); ctx.stroke(); }
  }
  ctx.fillStyle = shade(b.wall, -0.18); ctx.fillRect(x0, F - 20, x1 - x0, 20); // wainscot
  ctx.fillStyle = 'rgba(0,0,0,0.14)'; for (let x = x0 + 6; x < x1; x += 11) ctx.fillRect(x, F - 20, 0.8, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0, F - 21, x1 - x0, 1.4);
  fillRR(ctx, x0 - 2, 14, 4, F - 14, 1, shade(b.wall, -0.32)); fillRR(ctx, x1 - 2, 14, 4, F - 14, 1, shade(b.wall, -0.32));
  ctx.fillStyle = '#6b4128'; ctx.fillRect(x0 - 4, 14, x1 - x0 + 8, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x0 - 4, 14, x1 - x0 + 8, 1);
  ctx.restore();
}

export function paintBiz(ctx, id, st, R) {
  const b = BIZ_BY_ID[id];
  if (!st.built) { paintBuilding(ctx, b); return; }
  const tier = bizTier(st.lvl); const fx = (k) => !!st.fx[k];
  if (tier >= 3) { fillRR(ctx, 24, F + 3, 84, 7, 3.5, shade(b.sign, 0.1)); ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = 0.7; ctx.setLineDash([2, 2]); rr(ctx, 26, F + 4.2, 80, 4.6, 2.3); ctx.stroke(); ctx.setLineDash([]); }
  PAINT[id](ctx, b, tier, fx, R);
  if (tier >= 2) bunting(ctx, 82, 128, 21, [b.sign, '#fff3dc', '#e9b949']);
  shopSign(ctx, b, tier);
}

function shopSign(ctx, b, tier) {
  const x = 18; const y = 23; const w = 60; const h = 12;
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(x + 8, 19); ctx.lineTo(x + 8, y); ctx.moveTo(x + w - 8, 19); ctx.lineTo(x + w - 8, y); ctx.stroke();
  fillRR(ctx, x, y, w, h, 3, tier >= 4 ? '#e9b949' : '#4a2e1c');
  fillRR(ctx, x + 1.4, y + 1.4, w - 2.8, h - 2.8, 2.2, b.sign);
  ctx.fillStyle = '#fff3dc'; ctx.font = `700 5.6px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${b.icon} ${b.short}`, x + w / 2, y + h / 2 + 0.3, w - 5);
  if (tier >= 4) { star(ctx, x + w + 4, y + 3, 2.6, '#ffd257'); star(ctx, x - 4, y + 3, 2.6, '#ffd257'); }
  ctx.textBaseline = 'alphabetic';
}
function bunting(ctx, x0, x1, y, cols) {
  ctx.strokeStyle = 'rgba(60,40,30,0.6)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + 6, x1, y); ctx.stroke();
  const n = Math.floor((x1 - x0) / 7);
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n; const bx = x0 + (x1 - x0) * u; const by = y + Math.sin(u * Math.PI) * 4.5;
    ctx.fillStyle = cols[k % cols.length]; ctx.beginPath(); ctx.moveTo(bx - 2.6, by); ctx.lineTo(bx + 2.6, by); ctx.lineTo(bx, by + 5); ctx.closePath(); ctx.fill();
  }
}
function hangLamp(ctx, x, y, len, glass) {
  ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, 19); ctx.lineTo(x, y); ctx.stroke();
  ctx.fillStyle = '#3a3440'; ctx.beginPath(); ctx.moveTo(x - 5, y + 5); ctx.lineTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.lineTo(x + 5, y + 5); ctx.closePath(); ctx.fill();
  ell(ctx, x, y + 6, 3, 2.2, glass); void len;
}
function shelfBoard(ctx, x, y, w) {
  fillRR(ctx, x, y, w, 2.6, 1, '#8a5a3a'); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 1, y + 2.6, w - 2, 1.2);
  ctx.fillStyle = '#6b4128'; ctx.fillRect(x + 4, y + 2.6, 1.6, 4); ctx.fillRect(x + w - 5.6, y + 2.6, 1.6, 4);
}
function jar(ctx, x, y, col) {
  fillRR(ctx, x - 3.5, y - 9, 7, 9, 2, 'rgba(230,240,245,0.55)'); fillRR(ctx, x - 2.8, y - 6.5, 5.6, 6, 1.5, col);
  fillRR(ctx, x - 3, y - 10.5, 6, 2, 0.8, '#b98a3a'); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 2.4, y - 8, 0.8, 5);
}
function pie(ctx, x, y, s = 1, col = '#d98a3a') {
  ell(ctx, x, y, 6 * s, 2.4 * s, '#b86a2a'); ell(ctx, x, y - 1 * s, 5.4 * s, 2 * s, col);
  ctx.strokeStyle = 'rgba(120,60,20,0.55)'; ctx.lineWidth = 0.5;
  for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 2.2 * s - 1, y - 2 * s); ctx.lineTo(x + k * 2.2 * s + 1, y); ctx.stroke(); }
}
function mush(ctx, x, y, h, cap) {
  ctx.fillStyle = '#f4efe6'; ctx.fillRect(x - 0.9, y - h, 1.8, h);
  ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(x, y - h, 3.6 + h * 0.18, 2.6 + h * 0.12, 0, Math.PI, 0); ctx.fill();
  circ(ctx, x - 1.2, y - h - 1.2, 0.7, 'rgba(255,255,255,0.75)');
}
function bed(ctx, x, w, R) {
  for (let k = 0; k < Math.floor(w / 7); k++) mush(ctx, x + 5 + k * 7 + R() * 2, F - 11, 4 + R() * 7, ['#9ee6c8', '#bfe3f2', '#f5b3d0'][k % 3]);
  fillRR(ctx, x, F - 12, w, 12, 2, '#6b4128'); ctx.fillStyle = '#4a2e1c'; ctx.fillRect(x + 2, F - 12, w - 4, 2.4);
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; for (let k = x + 8; k < x + w - 2; k += 9) ctx.fillRect(k, F - 9, 0.8, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x + 1, F - 12, w - 2, 0.8);
}
function cheeseWheel(ctx, x, y, r, col = '#f2c14e') {
  ell(ctx, x, y, r, r * 0.62, shade(col, -0.18)); ell(ctx, x, y - r * 0.18, r, r * 0.5, col);
  circ(ctx, x - r * 0.3, y - r * 0.2, r * 0.12, shade(col, -0.25)); circ(ctx, x + r * 0.35, y - r * 0.1, r * 0.09, shade(col, -0.25));
}
function barrel(ctx, x, y, w, h) {
  fillRR(ctx, x - w / 2, y - h, w, h, w * 0.3, '#8a5a3a');
  ctx.fillStyle = '#6d6a80'; ctx.fillRect(x - w / 2, y - h * 0.8, w, 1.4); ctx.fillRect(x - w / 2, y - h * 0.25, w, 1.4);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x - w / 2 + 2, y - h + 2, 1.4, h - 4);
}
function plant(ctx, x, y) {
  fillRR(ctx, x - 4, y - 7, 8, 7, 1.5, '#b5523b');
  ctx.fillStyle = '#5e9c55'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x + k * 2.2, y - 11 - Math.abs(k) * -1, 1.8, 5, k * 0.35, 0, 7); ctx.fill(); }
}

const PAINT = {
  mushroom(ctx, b, tier, fx, R) {
    shelfBoard(ctx, 22, 52, 56);
    ['#9ee6c8', '#f5b3d0', '#bfe3f2', '#e8c465'].forEach((c, k) => jar(ctx, 28 + k * 11, 52, c));
    if (tier >= 3) ['#f5b3d0', '#9ee6c8'].forEach((c, k) => jar(ctx, 28 + k * 11, 70, c));
    if (tier >= 3) shelfBoard(ctx, 22, 70, 30);
    if (fx(1)) { // watering cans on the shelf
      [68, 76].forEach((x, k) => { fillRR(ctx, x - 3, 44, 6, 8, 1.5, k ? '#4f7cac' : '#8a9aa8'); ctx.strokeStyle = k ? '#4f7cac' : '#8a9aa8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 3, 47); ctx.lineTo(x + 7, 43); ctx.stroke(); });
    }
    if (tier >= 3) { // strings of dried mushrooms
      for (const x of [88, 98]) { ctx.strokeStyle = '#8a6a4c'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, 19); ctx.lineTo(x, 44); ctx.stroke(); for (let y = 24; y < 44; y += 5) ell(ctx, x, y, 2.4, 1.6, '#c9a27a'); }
    }
    if (fx(0)) { hangLamp(ctx, 40, 38, 0, '#b8f5dc'); hangLamp(ctx, 66, 30, 0, '#b8f5dc'); }
    bed(ctx, 14, 44, R);
    if (tier >= 2) bed(ctx, 72, 28, R);
    if (fx(2)) [106, 116].forEach((x) => { fillRR(ctx, x - 5, F - 7, 10, 7, 2, '#c99a5a'); ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 0.5; for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 5, F - 7 + k * 2.3); ctx.lineTo(x + 5, F - 7 + k * 2.3); ctx.stroke(); } [-2.5, 0, 2.5].forEach((d, j) => ell(ctx, x + d, F - 8, 2.4, 1.6, ['#9ee6c8', '#f5b3d0', '#bfe3f2'][j])); });
    if (fx(3)) { // the soup pot on a little stove
      fillRR(ctx, 120, F - 10, 16, 10, 2, '#3a3440'); circ(ctx, 128, F - 4, 2, '#ff9a4a');
      ell(ctx, 128, F - 14, 9, 6, '#2a2530'); ell(ctx, 128, F - 18, 8, 2, '#c9a27a'); fillRR(ctx, 118, F - 19, 20, 2, 1, '#3a3440');
    }
  },
  pies(ctx, b, tier, fx, R) {
    shelfBoard(ctx, 46, 50, 52);
    [52, 64, 76, 88].forEach((x, k) => pie(ctx, x, 49, 1, ['#d98a3a', '#c05050', '#e8c465', '#8e3b46'][k]));
    if (fx(1)) { shelfBoard(ctx, 46, 68, 52); [54, 68, 82].forEach((x, k) => pie(ctx, x, 67, 1.1, ['#e8c465', '#d98a3a', '#c05050'][k])); fillRR(ctx, 90, 58, 8, 9, 2, '#f6d2e0'); ell(ctx, 94, 58, 4, 1.5, '#fff'); circ(ctx, 94, 56.5, 1, '#e0404f'); }
    if (fx(0)) { // stone oven with a chimney
      ctx.fillStyle = '#6b6470'; ctx.fillRect(26, 19, 5, F - 58);
      ctx.fillStyle = '#8a8290'; ctx.beginPath(); ctx.moveTo(14, F); ctx.lineTo(14, F - 22); ctx.quadraticCurveTo(28, F - 46, 42, F - 22); ctx.lineTo(42, F); ctx.closePath(); ctx.fill();
      texRect(ctx, 'rock', 14, F - 40, 28, 40, 0.35);
      ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.moveTo(20, F - 3); ctx.lineTo(20, F - 12); ctx.arc(28, F - 12, 8, Math.PI, 0); ctx.lineTo(36, F - 3); ctx.closePath(); ctx.fill();
      ell(ctx, 28, F - 5, 6, 2.4, '#ff9a4a'); ell(ctx, 28, F - 6, 3.5, 1.6, '#ffe07a');
    } else {
      barrel(ctx, 26, F, 12, 16); ell(ctx, 26, F - 16, 6, 1.6, '#6b4128');
    }
    if (fx(2)) { // chalk menu
      fillRR(ctx, 80, 26, 22, 18, 2, '#8a5a3a'); fillRR(ctx, 81.5, 27.5, 19, 15, 1.5, '#2e3a34');
      ctx.fillStyle = 'rgba(240,240,230,0.85)'; ctx.font = `700 3.6px ${FONT}`; ctx.textAlign = 'center';
      ctx.fillText('PIES', 91, 32.5); ctx.fillRect(84, 35, 9, 0.6); ctx.fillRect(84, 38, 12, 0.6); ctx.fillText('worm-free!', 91, 42);
    }
    if (tier >= 3) plant(ctx, 110, F);
  },
  jeweller(ctx, b, tier, fx, R) {
    // velvet wall with gold picture rails
    ctx.fillStyle = 'rgba(120,90,160,0.25)'; ctx.fillRect(40, 38, 60, 40);
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 0.8; ctx.strokeRect(40, 38, 60, 40);
    // necklaces on hooks
    for (let k = 0; k < 4; k++) {
      const x = 48 + k * 14; ctx.strokeStyle = ['#ffd257', '#e8eef4', '#ffd257', '#f5b3d0'][k]; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(x - 4, 44); ctx.quadraticCurveTo(x, 56 + (k % 2) * 4, x + 4, 44); ctx.stroke();
      circ(ctx, x, 53 + (k % 2) * 4, 1.6, ['#6ec1ff', '#e0404f', '#7ce0a0', '#c9a8f0'][k]);
    }
    if (fx(1)) { // ring cabinet
      fillRR(ctx, 46, 62, 48, 13, 2, '#5a3a22'); fillRR(ctx, 48, 64, 44, 9, 1.5, '#2a2240');
      for (let k = 0; k < 8; k++) { ctx.strokeStyle = k % 2 ? '#e8eef4' : '#ffd257'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(51 + k * 5.3, 68.5, 1.4, 0, 7); ctx.stroke(); circ(ctx, 51 + k * 5.3, 67, 0.7, ['#6ec1ff', '#e0404f', '#7ce0a0'][k % 3]); }
    }
    if (fx(0)) { // the jeweller's bench and lamp
      fillRR(ctx, 14, F - 16, 22, 3, 1, '#8a5a3a'); ctx.fillStyle = '#6b4128'; ctx.fillRect(16, F - 13, 2, 13); ctx.fillRect(32, F - 13, 2, 13);
      ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(18, F - 16); ctx.lineTo(20, F - 30); ctx.lineTo(28, F - 26); ctx.stroke();
      ell(ctx, 29, F - 25, 3, 2, '#3a3440'); circ(ctx, 26, F - 18, 1.8, '#9ec5f0');
    } else barrel(ctx, 24, F, 12, 14);
    if (fx(3)) { hangLamp(ctx, 56, 30, 0, '#fff3b0'); hangLamp(ctx, 86, 30, 0, '#fff3b0'); }
    if (tier >= 3) plant(ctx, 110, F);
    void R;
  },
  tea(ctx, b, tier, fx, R) {
    // tins on a shelf and a scroll
    shelfBoard(ctx, 40, 46, 44);
    ['#b5523b', '#3d7a5a', '#e9b949', '#4f7cac', '#8e3b46'].forEach((c, k) => { fillRR(ctx, 43 + k * 8, 38, 6, 8, 1, c); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(43 + k * 8, 40, 6, 1); });
    fillRR(ctx, 88, 26, 12, 30, 1, '#f4efe6'); ctx.fillStyle = '#6b4128'; ctx.fillRect(87, 25, 14, 1.6); ctx.fillRect(87, 55.5, 14, 1.6);
    ctx.fillStyle = '#3a3440'; ctx.font = `700 5px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('茶', 94, 36); ctx.fillText('♨', 94, 46);
    if (fx(3)) { // bamboo screen
      for (let k = 0; k < 5; k++) { fillRR(ctx, 42 + k * 8, 56, 6, 30, 2, k % 2 ? '#b9c27a' : '#a8b26a'); ctx.fillStyle = 'rgba(80,90,40,0.5)'; ctx.fillRect(42 + k * 8, 66, 6, 0.8); ctx.fillRect(42 + k * 8, 76, 6, 0.8); }
    }
    if (fx(0)) { // iron teapot on a brazier
      fillRR(ctx, 14, F - 10, 18, 10, 2, '#3a3440'); circ(ctx, 23, F - 5, 2, '#ff9a4a');
      ell(ctx, 23, F - 15, 7, 5.5, '#2a2530'); ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(23, F - 19, 4.5, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(29, F - 16); ctx.lineTo(33, F - 19); ctx.stroke();
    }
    if (fx(1)) [110, 118, 114].forEach((x, k) => ell(ctx, x, F - 3 - k * 4, 7, 3.4, ['#e0404f', '#e9b949', '#9b6fb0'][k]));
    // cushions around low tables
    [32, 58, 108].forEach((x, k) => ell(ctx, x, F + 7, 7, 2.6, ['#b5523b', '#4f7cac', '#6b8e4e'][k]));
    if (fx(2)) [[30, 40], [68, 34], [100, 38]].forEach(([x, y]) => { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, 19); ctx.lineTo(x, y - 5); ctx.stroke(); ell(ctx, x, y, 4.5, 5.5, '#e0404f'); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 2.4, y - 6, 4.8, 1.2); ctx.fillRect(x - 2.4, y + 5, 4.8, 1.2); });
    void R;
  },
  spa(ctx, b, tier, fx, R) {
    if (fx(1)) { // towel rack
      ctx.fillStyle = '#b98a3a'; ctx.fillRect(84, 42, 20, 1.6);
      ['#f6d2e0', '#fffaf0', '#bfe3f2'].forEach((c, k) => fillRR(ctx, 85 + k * 6.4, 43, 5.6, 14, 1, c));
    }
    // mirror and a little sign
    fillRR(ctx, 44, 36, 26, 20, 10, '#c9a227'); fillRR(ctx, 46, 38, 22, 16, 8, '#cfe3ec'); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(50, 41, 2, 9);
    if (fx(3)) { // lily fountain
      ell(ctx, 22, F - 1, 9, 3, '#8a9aa8'); fillRR(ctx, 20, F - 22, 4, 21, 1, '#9aa7b6'); ell(ctx, 22, F - 22, 6, 2, '#9aa7b6');
      ell(ctx, 18, F - 3, 3, 1.2, '#7cc46b'); circ(ctx, 18, F - 4, 1.2, '#f5b3d0');
    } else plant(ctx, 20, F);
    if (fx(0)) { // cucumber bar
      fillRR(ctx, 94, F - 18, 22, 3, 1, '#e8eef4'); ctx.fillStyle = '#c9d6de'; ctx.fillRect(96, F - 15, 2, 15); ctx.fillRect(112, F - 15, 2, 15);
      for (let k = 0; k < 4; k++) { circ(ctx, 98 + k * 4.5, F - 19.5, 1.8, '#7cc46b'); circ(ctx, 98 + k * 4.5, F - 19.5, 1.1, '#d8f0c0'); }
    }
    // the mud bath (its front rim is drawn live, in front of the bathers)
    ell(ctx, 54, F - 6, 30, 5, '#5a4030'); ell(ctx, 54, F - 6.5, 27, 3.4, '#7a5a40');
    void R;
  },
  cinema(ctx, b, tier, fx, R) {
    // curtains and the screen
    const sx0 = 30; const sx1 = 104; const sy0 = 40; const sy1 = 82;
    fillRR(ctx, sx0 - 4, sy0 - 4, sx1 - sx0 + 8, sy1 - sy0 + 8, 2, '#1a1418');
    ctx.fillStyle = '#e9e4d8'; ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
    for (const [x, d] of [[sx0 - 4, 1], [sx1 + 4, -1]]) {
      ctx.fillStyle = '#9a2a38'; ctx.beginPath(); ctx.moveTo(x, sy0 - 6); ctx.lineTo(x + d * 12, sy0 - 6); ctx.quadraticCurveTo(x + d * 4, (sy0 + sy1) / 2, x + d * 6, sy1 + 6); ctx.lineTo(x, sy1 + 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.6; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + d * k * 2.6, sy0 - 6); ctx.lineTo(x + d * k * 1.2, sy1 + 6); ctx.stroke(); }
    }
    fillRR(ctx, sx0 - 8, sy0 - 9, sx1 - sx0 + 16, 5, 2, '#9a2a38');
    if (fx(2)) [[14, 48], [14, 70]].forEach(([x, y], k) => { fillRR(ctx, x, y - 10, 11, 16, 1, '#f4efe6'); fillRR(ctx, x + 1, y - 9, 9, 14, 0.5, ['#4f7cac', '#8e3b46'][k]); circ(ctx, x + 5.5, y - 3, 2.6, '#f4efe6'); ctx.fillStyle = '#ffd257'; ctx.fillRect(x + 2, y + 1.5, 7, 1.2); });
    if (fx(0)) { // popcorn cart
      fillRR(ctx, 12, F - 20, 16, 16, 2, '#e0404f'); ctx.fillStyle = '#fff'; for (let k = 0; k < 3; k++) ctx.fillRect(14 + k * 5, F - 20, 2.4, 16);
      fillRR(ctx, 11, F - 26, 18, 7, 2, 'rgba(230,240,245,0.6)'); for (let k = 0; k < 8; k++) circ(ctx, 14 + (k % 4) * 4, F - 22 - Math.floor(k / 4) * 2.5, 1.6, '#fff6d6');
      circ(ctx, 14, F - 2, 2.4, '#3a3440'); circ(ctx, 26, F - 2, 2.4, '#3a3440');
    }
    if (fx(3)) { // ticket booth
      fillRR(ctx, 108, F - 34, 22, 34, 3, '#9a2a38'); fillRR(ctx, 111, F - 30, 16, 12, 5, '#fff3dc');
      ctx.fillStyle = '#ffd257'; ctx.font = `700 4px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('TICKETS', 119, F - 8);
    }
    void R; void tier;
  },
  cheese(ctx, b, tier, fx, R) {
    // stone arch behind the racks
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.moveTo(14, F - 20); ctx.lineTo(14, 40); ctx.quadraticCurveTo(58, 18, 102, 40); ctx.lineTo(102, F - 20); ctx.closePath(); ctx.fill();
    const rack = (x0, w, rows, cols) => {
      ctx.fillStyle = '#6b4128'; ctx.fillRect(x0, 36, 2, F - 36); ctx.fillRect(x0 + w - 2, 36, 2, F - 36);
      for (let k = 0; k < rows; k++) {
        const y = 50 + k * 18; fillRR(ctx, x0, y, w, 2.4, 1, '#8a5a3a');
        for (let j = 0; j < cols; j++) cheeseWheel(ctx, x0 + 6 + j * ((w - 12) / Math.max(1, cols - 1)), y - 3.4, 5, ['#f2c14e', '#e8a33a', '#f6dc8a'][(j + k) % 3]);
      }
    };
    rack(14, 44, 3, 4);
    if (fx(0)) rack(62, 30, 3, 3);
    if (fx(1)) { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(100, 19); ctx.lineTo(100, 30); ctx.stroke(); ctx.fillStyle = '#e0a02a'; ctx.beginPath(); ctx.moveTo(96, 37); ctx.quadraticCurveTo(96, 29, 100, 29); ctx.quadraticCurveTo(104, 29, 104, 37); ctx.closePath(); ctx.fill(); circ(ctx, 100, 37.5, 1.2, '#8a5a1a'); }
    if (fx(2)) { fillRR(ctx, 98, 56, 30, 4, 1, '#9aa0ab'); texRect(ctx, 'rock', 98, 56, 30, 4, 0.5); [104, 114, 123].forEach((x) => cheeseWheel(ctx, x, 53, 4.2, '#dfe8ec')); ctx.fillStyle = '#6d8ab0'; [104, 114, 123].forEach((x) => { ctx.fillRect(x - 2, 52, 1, 1); ctx.fillRect(x + 1, 51, 1, 1); }); }
    if (fx(3)) { barrel(ctx, 114, F, 16, 20); ctx.fillStyle = '#6b2a4a'; circ(ctx, 114, F - 10, 2, '#6b2a4a'); fillRR(ctx, 112.5, F - 8, 3, 3, 0.5, '#9aa0ab'); }
    else drawCheese(ctx, 116, F - 3, 1.2);
    void R; void tier;
  },
  post(ctx, b, tier, fx, R) {
    // pigeonholes
    const cols = fx(1) ? 6 : 4; const rows = fx(1) ? 4 : 3;
    const x0 = 16; const y0 = 40; const cw = 7; const ch = 7;
    fillRR(ctx, x0 - 2, y0 - 2, cols * cw + 4, rows * ch + 4, 1.5, '#6b4128');
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      ctx.fillStyle = '#2a1a14'; ctx.fillRect(x0 + c * cw + 0.6, y0 + r * ch + 0.6, cw - 1.2, ch - 1.2);
      if (R() < 0.65) { fillRR(ctx, x0 + c * cw + 1.4, y0 + r * ch + 2.4, cw - 2.8, 3.6, 0.5, ['#fffaf0', '#f6d2e0', '#dfe8ec'][Math.floor(R() * 3)]); }
    }
    if (fx(0)) { // brass tubes along the ceiling, down to a funnel
      ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(12, 24); ctx.lineTo(90, 24); ctx.quadraticCurveTo(96, 24, 96, 30); ctx.lineTo(96, 58); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(12, 23); ctx.lineTo(90, 23); ctx.stroke();
      ctx.fillStyle = '#b98a3a'; ctx.beginPath(); ctx.moveTo(92, 58); ctx.lineTo(100, 58); ctx.lineTo(103, 64); ctx.lineTo(89, 64); ctx.closePath(); ctx.fill();
    }
    if (fx(2)) { // parcel scales
      fillRR(ctx, 16, F - 4, 20, 4, 1, '#9aa0ab'); ctx.fillStyle = '#6d6a80'; ctx.fillRect(25, F - 16, 2, 12); fillRR(ctx, 17, F - 18, 18, 2.4, 1, '#c9a227');
      fillRR(ctx, 19, F - 27, 13, 9, 1, '#c99a5a'); ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(25.5, F - 27); ctx.lineTo(25.5, F - 18); ctx.stroke();
    }
    // a map of the burrows
    fillRR(ctx, 64, 34, 26, 20, 1, '#e8d6b0'); ctx.strokeStyle = 'rgba(90,60,30,0.6)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(67, 40); ctx.lineTo(76, 44); ctx.lineTo(74, 50); ctx.lineTo(86, 48); ctx.moveTo(76, 44); ctx.lineTo(84, 38); ctx.stroke();
    [[67, 40], [74, 50], [86, 48], [84, 38]].forEach(([x, y]) => circ(ctx, x, y, 1.2, '#b5523b'));
    if (tier >= 3) plant(ctx, 112, F);
  },
};

function paintBuilding(ctx, b) {
  // scaffolding, planks and paint pots: a shop on its way
  ctx.strokeStyle = '#9a6b45'; ctx.lineWidth = 2.2;
  for (const x of [22, 60, 98]) { ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, F); ctx.stroke(); }
  ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(22, 46); ctx.lineTo(60, 76); ctx.moveTo(60, 46); ctx.lineTo(98, 76); ctx.stroke();
  for (const y of [46, 76]) fillRR(ctx, 16, y, 90, 4, 1, '#b98457');
  fillRR(ctx, 30, F - 14, 18, 14, 1.5, '#b98a5a'); ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 0.8; ctx.strokeRect(30, F - 14, 18, 14);
  fillRR(ctx, 70, F - 9, 8, 9, 1.5, '#4f7cac'); ell(ctx, 74, F - 9, 4, 1.4, b.sign);
  fillRR(ctx, 30, 26, 60, 14, 3, '#fff3dc'); ctx.strokeStyle = b.sign; ctx.lineWidth = 1.2; rr(ctx, 30, 26, 60, 14, 3); ctx.stroke();
  ctx.fillStyle = '#4a3121'; ctx.font = `700 5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${b.icon} Opening soon!`, 60, 30.5, 56); ctx.font = `600 4.2px ${FONT}`; ctx.fillText(b.short, 60, 36.2, 56);
  ctx.textBaseline = 'alphabetic';
}

/* =================================================================== */
/* Shops, live                                                          */
/* =================================================================== */
// keeper: the mole who runs the shop (y: feet; 108 stands behind a counter)
// spots: where customers go and what they do there (seat: raised feet; bath / cinema: drawn under the front)
const LAYOUT = {
  mushroom: { keeper: { x: 64, y: FEET, dir: -1, pose: 'push', look: { hat: 'cap', hatCol: '#3d7a5a', apron: '#9ec07a' } }, spots: [{ x: 112, pose: 'eat', dir: -1 }, { x: 36, pose: 'stand', dir: 1 }, { x: 88, pose: 'point', dir: -1 }] },
  pies: { keeper: { x: 72, y: 101, dir: 1, pose: 'serve', item: '#d98a3a', look: { fur: '#6b5a52', hat: 'bow', hatCol: '#e0404f', apron: '#fff3dc' } }, spots: [{ x: 110, pose: 'pay', dir: -1 }, { x: 126, pose: 'stand', dir: -1 }, { x: 34, pose: 'eat', dir: 1 }] },
  jeweller: { keeper: { x: 68, y: 101, dir: 1, pose: 'stand', look: { fur: '#4f4440', hat: 'top', glasses: true } }, spots: [{ x: 106, pose: 'point', dir: -1 }, { x: 122, pose: 'stand', dir: -1 }, { x: 28, pose: 'stand', dir: 1 }] },
  tea: { keeper: { x: 82, y: FEET, dir: -1, pose: 'serve', item: '#3a3440', look: { hat: 'beret', hatCol: '#6b8e4e', apron: '#e9d9b8' } }, spots: [{ x: 32, pose: 'sit', dir: 1, seat: 4 }, { x: 58, pose: 'sit', dir: -1, seat: 4 }, { x: 108, pose: 'sit', dir: -1, seat: 4 }] },
  spa: { keeper: { x: 102, y: FEET, dir: -1, pose: 'stand', look: { hat: 'cap', hatCol: '#9b6fb0', apron: '#fffaf0' } }, prefer: 'hamster', spots: [{ x: 42, pose: 'sit', dir: 1, under: true, seat: 8 }, { x: 66, pose: 'sit', dir: -1, under: true, seat: 8 }, { x: 124, pose: 'stand', dir: -1 }] },
  cinema: { keeper: { x: 124, y: FEET, dir: -1, pose: 'stand', look: { hat: 'cap', hatCol: '#e0404f' } }, spots: [{ x: 52, pose: 'sit', dir: 1, under: true, seat: 6 }, { x: 72, pose: 'sit', dir: 1, under: true, seat: 6 }, { x: 92, pose: 'sit', dir: -1, under: true, seat: 6 }] },
  cheese: { keeper: { x: 64, y: FEET, dir: 1, pose: 'serve', item: '#f2c14e', look: { hat: 'beret', hatCol: '#e0a02a', apron: '#fff3dc' } }, spots: [{ x: 86, pose: 'eat', dir: -1 }, { x: 118, pose: 'stand', dir: -1 }, { x: 34, pose: 'reach', dir: -1 }] },
  post: { keeper: { x: 80, y: 101, dir: 1, pose: 'stand', look: { hat: 'cap', hatCol: '#4f7cac', glasses: true } }, spots: [{ x: 112, pose: 'pay', dir: -1 }, { x: 128, pose: 'carry', dir: -1 }, { x: 36, pose: 'stand', dir: -1 }] },
};
const PERIOD = 19; // seconds for one customer to come, shop and go

// Everything moving in a shop cell. conn: 'LRUD' open flags; zoom: world scale (bubbles only up close).
export function drawBizLive(ctx, id, st, conn, x, y, t, zoom, rem) {
  const b = BIZ_BY_ID[id]; const lay = LAYOUT[id];
  if (!st.built) { drawBuildingLive(ctx, b, x, y, t, rem); return; }
  const tier = bizTier(st.lvl); const fx = (k) => !!st.fx[k];
  const [L, Rt, U, D] = conn.split('').map((v) => v === '1');
  const entry = L ? 2 : Rt ? CELL_W - 2 : U || D ? 116 : null;
  const seed = (x * 7 + y * 13) | 0;
  // light
  drawBizGlow(ctx, id, x, y, t, fx);
  // customers: more of them as the shop levels up
  const n = Math.min(lay.spots.length, 1 + (tier >= 2 ? 1 : 0) + (tier >= 3 ? 1 : 0));
  const people = [];
  for (let k = 0; k < n; k++) {
    const sp = lay.spots[k];
    const ph = t / PERIOD + k * 0.37 + (seed % 97) / 97; const cyc = Math.floor(ph); const f = ph - cyc;
    const who = visitor(seed + cyc * 31 + k * 101, lay.prefer);
    let px = sp.x; let pose = sp.pose; let dir = sp.dir; let at = true; let alpha = 1;
    if (entry == null) { if (f > 0.9) continue; }
    else if (f < 0.12) { const u = f / 0.12; px = entry + (sp.x - entry) * u; pose = 'walk'; dir = sp.x > entry ? 1 : -1; at = false; if (entry === 116 && u < 0.2) alpha = u / 0.2; }
    else if (f > 0.84 && f < 0.96) { const u = (f - 0.84) / 0.12; px = sp.x + (entry - sp.x) * u; pose = 'walk'; dir = entry > sp.x ? 1 : -1; at = false; if (entry === 116 && u > 0.8) alpha = (1 - u) / 0.2; }
    else if (f >= 0.96) continue;
    people.push({ k, sp, who, px, pose, dir, at, alpha, f, cyc });
  }
  // the shopkeeper (behind the counter where there is one)
  const kp = lay.keeper;
  const serving = people.some((p) => p.at && p.k === 0);
  const kpose = kp.pose === 'serve' ? (serving ? 'serve' : 'stand') : kp.pose === 'push' ? (Math.sin(t * 0.7) > 0 ? 'push' : 'stand') : Math.sin(t * 0.45 + seed) > 0.8 ? 'wave' : kp.pose;
  const under = people.filter((p) => p.at && p.sp.under);
  const over = people.filter((p) => !(p.at && p.sp.under));
  for (const p of under) drawPerson(ctx, x, y, p, t);
  drawMole(ctx, x + kp.x, y + kp.y, { ...kp.look, helmet: false, pose: kpose, dir: kp.dir, t: t + seed, s: 0.95, item: kpose === 'serve' ? kp.item : null, noShadow: kp.y < FEET });
  drawBizFront(ctx, id, x, y, t, fx, tier);
  for (const p of over) drawPerson(ctx, x, y, p, t);
  // a word from a customer now and then
  if (zoom > 0.55 && people.length) {
    const bc = Math.floor((t + seed) / 9); const bf = ((t + seed) / 9) - bc;
    const p = people[bc % people.length];
    if (p && p.at && bf < 0.4) bubble(ctx, x, y, x + p.px, y + FEET - (p.sp.seat || 0) - 36, b.lines[(bc + p.cyc) % b.lines.length], bf / 0.4);
  }
}
function drawPerson(ctx, x, y, p, t) {
  const seat = p.at ? p.sp.seat || 0 : 0;
  const pose = p.pose === 'reach' && p.who.kind !== 'mouse' ? 'point' : p.pose;
  ctx.globalAlpha = p.alpha;
  drawCritter(ctx, x + p.px, y + FEET - seat, p.who, pose, p.dir, t + p.k * 1.7, 1, p.pose === 'eat' ? { item: '#e8c465' } : {});
  ctx.globalAlpha = 1;
}
function bubble(ctx, cx0, cy0, x, y, text, u) {
  ctx.font = `600 6.5px ${FONT}`;
  const tw = Math.min(130, ctx.measureText(text).width + 12);
  const bx = Math.max(cx0 + 6, Math.min(cx0 + CELL_W - 6 - tw, x - tw / 2)); const by = Math.max(cy0 + 12, y);
  ctx.globalAlpha = Math.min(1, u * 8, (1 - u) * 8);
  fillRR(ctx, bx, by - 8, tw, 14, 6, '#fffaf0');
  ctx.strokeStyle = 'rgba(160,120,80,0.35)'; ctx.lineWidth = 0.6; rr(ctx, bx, by - 8, tw, 14, 6); ctx.stroke();
  ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(x - 3, by + 6); ctx.lineTo(x, by + 10); ctx.lineTo(x + 3, by + 6); ctx.fill();
  ctx.fillStyle = '#4a3121'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + tw / 2, by - 0.8, tw - 8);
  ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1;
}

function drawBizGlow(ctx, id, x, y, t, fx) {
  ctx.globalCompositeOperation = 'lighter';
  const y0 = y + 10; const y1 = y + CELL_H - 10;
  if (id === 'mushroom') {
    glow(ctx, x + 36, y + F - 16, 30, '150,240,200', 0.22 + 0.05 * Math.sin(t * 1.3), y0, y1);
    if (fx(0)) { glow(ctx, x + 40, y + 44, 26, '170,255,215', 0.28, y0, y1); glow(ctx, x + 66, y + 36, 26, '170,255,215', 0.28, y0, y1); }
  } else if (id === 'pies') {
    if (fx(0)) glow(ctx, x + 28, y + F - 6, 22, '255,150,70', 0.35 + 0.1 * Math.sin(t * 7), y0, y1);
    glow(ctx, x + 70, y + 40, 50, '255,210,140', 0.14, y0, y1);
  } else if (id === 'jeweller') {
    glow(ctx, x + 70, y + 56, 46, '200,190,255', 0.16, y0, y1);
    if (fx(3)) { glow(ctx, x + 56, y + 36, 22, '255,240,180', 0.3, y0, y1); glow(ctx, x + 86, y + 36, 22, '255,240,180', 0.3, y0, y1); }
  } else if (id === 'tea') {
    if (fx(2)) [[30, 40], [68, 34], [100, 38]].forEach(([lx, ly]) => glow(ctx, x + lx, y + ly, 20, '255,120,90', 0.3 + 0.05 * Math.sin(t * 3 + lx), y0, y1));
    else glow(ctx, x + 64, y + 40, 50, '255,200,140', 0.14, y0, y1);
  } else if (id === 'spa') {
    glow(ctx, x + 54, y + F - 16, 40, '200,230,255', 0.14, y0, y1);
  } else if (id === 'cinema') {
    const fl = 0.28 + 0.06 * Math.sin(t * 13) + 0.04 * Math.sin(t * 5.3);
    glow(ctx, x + 67, y + 62, 60, '220,230,255', fl, y0, y1);
  } else if (id === 'cheese') {
    glow(ctx, x + 50, y + 46, 50, '255,220,130', 0.16, y0, y1);
  } else if (id === 'post') {
    glow(ctx, x + 70, y + 40, 50, '255,220,160', 0.13, y0, y1);
  }
  ctx.globalCompositeOperation = 'source-over';
}

// In front of the shopkeeper: counters, the spa's tub rim, cinema seats (one cached picture per
// shop and set of upgrades), plus little animations drawn live on top.
function drawBizFront(ctx, id, x, y, t, fx, tier) {
  const bits = `${fx(0) ? 1 : 0}${fx(1) ? 1 : 0}${fx(2) ? 1 : 0}${fx(3) ? 1 : 0}`;
  if (id === 'spa') { // mud bubbles go under the tub's front rim
    const nb = fx(2) ? 6 : 3;
    for (let k = 0; k < nb; k++) { const u = (t * 0.6 + k / nb) % 1; const bx = 34 + ((k * 37) % 42); circ(ctx, x + bx, y + F - 6 - u * 3, 1 + u * 1.4, `rgba(140,105,75,${0.9 - u * 0.9})`); }
  }
  if (id !== 'mushroom' && id !== 'cheese') art(ctx, `bizfront|${id}|${bits}`, [0, 40, CELL_W, CELL_H - 40], paintBizFront, { id, fx: [fx(0), fx(1), fx(2), fx(3)] }, x, y);
  ctx.save(); ctx.translate(x, y);
  if (id === 'pies') steam(ctx, 56, 94, t); // steam off the fresh pie
  else if (id === 'jeweller') {
    for (let k = 0; k < 6; k++) if (Math.sin(t * 3 + k * 1.7) > 0.85) star(ctx, 44 + 8 + k * 8 + 1, 105.5, 2, '#ffffff');
  } else if (id === 'post') {
    if (fx(0)) { // a capsule whooshes along the tube every few seconds
      const u = ((t * 0.35) % 1); if (u < 0.5) { const p = u / 0.5; const cx = p < 0.75 ? 12 + (78 * p) / 0.75 : 96; const cy = p < 0.75 ? 24 : 24 + ((p - 0.75) / 0.25) * 34; fillRR(ctx, cx - 3, cy - 1.6, 6, 3.2, 1.5, '#e8eef4'); }
    }
  } else if (id === 'spa') {
    if (fx(3)) { const u = (t * 1.4) % 1; ctx.strokeStyle = 'rgba(190,225,255,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(22, F - 22); ctx.quadraticCurveTo(16, F - 26 + u, 14, F - 6); ctx.moveTo(22, F - 22); ctx.quadraticCurveTo(28, F - 26 + u, 30, F - 6); ctx.stroke(); }
  } else if (id === 'cinema') {
    // the film: a glow-worm chasing a mole across the screen, then back again (kept inside the screen)
    const u = (t * 0.12) % 1; const run = u < 0.5 ? u * 2 : (1 - u) * 2; const d = u < 0.5 ? 1 : -1;
    ctx.fillStyle = 'rgba(40,30,50,0.55)'; ctx.beginPath();
    const mx = 44 + run * 46;
    ctx.moveTo(mx + 7, 72); ctx.ellipse(mx, 72, 7, 6, 0, 0, Math.PI * 2);
    ctx.moveTo(mx + d * 7 + 4, 69); ctx.ellipse(mx + d * 7, 69, 4, 3.4, 0, 0, Math.PI * 2);
    const wx = mx - d * 22;
    for (let k = 0; k < 4; k++) { const ex = wx - d * k * 3.4; if (ex < 32 || ex > 102) continue; const ey = 74 + Math.sin(t * 8 + k) * 1.5; ctx.moveTo(ex + 2.2, ey); ctx.ellipse(ex, ey, 2.2, 1.8, 0, 0, Math.PI * 2); }
    ctx.fill();
    if (fx(0)) for (let k = 0; k < 3; k++) { const u2 = (t * 0.9 + k / 3) % 1; circ(ctx, 18 + k * 3, F - 26 - u2 * 6, 1.3, `rgba(255,246,214,${1 - u2})`); }
  } else if (id === 'tea') {
    for (const tx of [45, 96]) steam(ctx, tx - 1, F - 4, t + tx);
    if (fx(0)) steam(ctx, 27, F - 22, t * 1.3);
  } else if (id === 'mushroom') {
    if (fx(3)) steam(ctx, 128, F - 20, t);
    for (let k = 0; k < 4; k++) { const u = (t * 0.25 + k * 0.27) % 1; circ(ctx, 20 + k * 11, F - 18 - u * 26, 0.9, `rgba(180,255,220,${0.8 * (1 - u)})`); }
  } else if (id === 'cheese') {
    if (fx(1) && Math.sin(t * 0.8) > 0.95) { ctx.fillStyle = '#ffe9a0'; ctx.font = `700 7px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('ding!', 100, 46); }
  }
  void tier;
  ctx.restore();
}
function paintBizFront(ctx, { id, fx: FX }) {
  const fx = (k) => FX[k];
  if (id === 'pies' || id === 'jeweller' || id === 'post') {
    const [x0, x1, col] = id === 'pies' ? [46, 98, '#8a5a3a'] : id === 'jeweller' ? [44, 96, '#3a3a52'] : [58, 100, '#6d6a80'];
    fillRR(ctx, x0, 99, x1 - x0, 16, 2, col);
    fillRR(ctx, x0 - 2, 97, x1 - x0 + 4, 3.4, 1.5, shade(col, 0.25));
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x0, 113, x1 - x0, 2);
    if (id === 'pies') {
      fillRR(ctx, x0 + 4, 102, x1 - x0 - 8, 9, 1.5, 'rgba(220,240,250,0.35)');
      [x0 + 12, x0 + 26, x0 + 40].forEach((px, k) => pie(ctx, px, 108, 0.9, ['#d98a3a', '#c05050', '#e8c465'][k]));
      pie(ctx, x0 + 10, 96.5, 0.9);
      if (fx(3)) { ctx.fillStyle = '#c9a227'; ctx.fillRect(x1 - 10, 84, 1.2, 13); [96, 90, 85].forEach((ty, k) => { ell(ctx, x1 - 9.4, ty, 6 - k * 1.5, 1.2, '#e8eef4'); circ(ctx, x1 - 11, ty - 1.2, 1.2, '#f5b3d0'); circ(ctx, x1 - 8, ty - 1.2, 1.2, '#e8c465'); }); }
    } else if (id === 'jeweller') {
      fillRR(ctx, x0 + 3, 101, x1 - x0 - 6, 10, 1.5, 'rgba(200,225,255,0.4)');
      for (let k = 0; k < 6; k++) circ(ctx, x0 + 8 + k * 8, 107, 1.8, ['#6ec1ff', '#e0404f', '#7ce0a0', '#c9a8f0', '#ffd257', '#f5b3d0'][k]);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0 + 6, 102, 1, 8);
      if (fx(2)) { ell(ctx, x1 - 8, 91, 4, 5, '#e8e1d8'); fillRR(ctx, x1 - 11, 95, 6, 2, 1, '#c9d6de'); ctx.fillStyle = '#ffd257'; ctx.beginPath(); ctx.moveTo(x1 - 12, 87); ctx.lineTo(x1 - 10, 83); ctx.lineTo(x1 - 8, 86); ctx.lineTo(x1 - 6, 83); ctx.lineTo(x1 - 4, 87); ctx.closePath(); ctx.fill(); circ(ctx, x1 - 8, 85, 0.9, '#e0404f'); }
    } else {
      ctx.fillStyle = '#c9a227'; ctx.fillRect(x0 + 2, 103, x1 - x0 - 4, 1);
      fillRR(ctx, x0 + 6, 92, 10, 5, 1, '#fffaf0'); ctx.fillStyle = '#e0404f'; ctx.fillRect(x0 + 13, 93, 2, 2);
      if (fx(3)) { fillRR(ctx, x1 - 16, 88, 12, 9, 1, '#6b4128'); for (let k = 0; k < 3; k++) fillRR(ctx, x1 - 14.5 + k * 3.6, 89, 2.6, 3.4, 0.5, ['#e0404f', '#4f7cac', '#7cc46b'][k]); }
    }
  } else if (id === 'spa') {
    ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.moveTo(24, F - 6); ctx.quadraticCurveTo(24, F + 8, 40, F + 8); ctx.lineTo(68, F + 8); ctx.quadraticCurveTo(84, F + 8, 84, F - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(30, F - 4, 48, 1.2);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(28, F + 8, 3, 3); ctx.fillRect(77, F + 8, 3, 3);
  } else if (id === 'cinema') {
    const seat = fx(1) ? '#9a2a38' : '#8a5a3a';
    for (const sx of [52, 72, 92]) { fillRR(ctx, sx - 8, F - 4, 16, 12, 3, seat); fillRR(ctx, sx - 9, F + 6, 18, 3, 1.5, shade(seat, -0.2)); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(sx - 6, F - 3, 12, 1); }
  } else if (id === 'tea') {
    for (const tx of [45, 96]) { fillRR(ctx, tx - 9, F + 1, 18, 3, 1.5, '#6b4128'); ctx.fillStyle = '#4a2e1c'; ctx.fillRect(tx - 7, F + 4, 2, 5); ctx.fillRect(tx + 5, F + 4, 2, 5); fillRR(ctx, tx - 3, F - 2.5, 4, 3.5, 1, '#fffaf0'); }
  }
}
function steam(ctx, x, y, t) {
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.8; ctx.lineCap = 'round'; ctx.beginPath();
  for (let k = 0; k < 2; k++) {
    const u = (t * 0.5 + k * 0.5) % 1;
    ctx.moveTo(x + k * 2.4, y - u * 8); ctx.quadraticCurveTo(x + k * 2.4 + 2, y - u * 8 - 3, x + k * 2.4, y - u * 8 - 6);
  }
  ctx.stroke();
}

function drawBuildingLive(ctx, b, x, y, t, rem) {
  const cx = x + CELL_W / 2;
  drawMole(ctx, cx - 30, y + FEET, { t, pose: 'push', dir: 1, hatCol: '#e0804a' });
  drawMole(ctx, cx + 22, y + 75, { t: t + 0.6, pose: 'dig', dir: -1, noShadow: true });
  const frac = Math.max(0.05, Math.min(1, 1 - rem / b.build));
  fillRR(ctx, cx - 40, y + 41, 80, 11, 5.5, 'rgba(40,28,20,0.82)');
  fillRR(ctx, cx - 38, y + 42.5, 76 * frac, 8, 4, '#7cc46b');
  ctx.fillStyle = '#fff'; ctx.font = `700 6.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(rem > 0 ? `🔨 ${fmtTime(rem)}` : 'Opening!', cx, y + 46.7); ctx.textBaseline = 'alphabetic';
}

/* ---- empty tunnels: a "to let" board once a mole could open a shop ---- */
export function drawToLet(ctx, x, y, t) {
  const sway = Math.sin(t * 1.2 + x) * 0.05;
  ctx.save(); ctx.translate(x + 38, y + 27); ctx.rotate(sway);
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-10, 5); ctx.moveTo(10, 0); ctx.lineTo(10, 5); ctx.stroke();
  fillRR(ctx, -16, 5, 32, 12, 2.5, '#fff3dc'); ctx.strokeStyle = '#b5523b'; ctx.lineWidth = 1; rr(ctx, -16, 5, 32, 12, 2.5); ctx.stroke();
  ctx.fillStyle = '#b5523b'; ctx.font = `700 5.4px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏪 TO LET', 0, 11.3); ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

/* =================================================================== */
/* The Grand Lift                                                       */
/* =================================================================== */
// It starts in a little lift house on the lawn, runs down through the vault, and on through the
// maze beside the entrance column to Umber's cavern.
const LIFT_W = 24;
export const SURFACE_STOP = 82; // the car's floor inside the lift house on the lawn
const VAULT_STOP = 197; // the car's floor at the vault stop
const VAULT_TOP = 124; // where the shaft comes through the vault's ceiling
const PULLEY_Y = 26; // the big wheel in the lift house's round window
const DWELL = 2.6; const SPEED = 48;
export const liftStopY = (r) => cellY(r) + FEET + 2;
export function liftStops(lift) { return [SURFACE_STOP, VAULT_STOP, ...LIFT_ROWS.slice(0, lift).map(liftStopY)]; }
export function liftHit(wx, wy, lift) {
  if (!lift) return false;
  const ys = liftStops(lift);
  if (wy < SURFACE_STOP + 8) return Math.abs(wx - LIFT_X) < 24 && wy > 8; // the lift house
  return Math.abs(wx - LIFT_X) < LIFT_W / 2 + 4 && wy < ys[ys.length - 1] + 6;
}

function shaftSeg(ctx, y0, y1, fill = true) {
  const x = LIFT_X; const h = LIFT_W / 2;
  if (fill) { ctx.fillStyle = '#1f1612'; ctx.fillRect(x - h, y0, LIFT_W, y1 - y0); }
  ctx.fillStyle = '#7a6a5a'; ctx.fillRect(x - h, y0, 2, y1 - y0); ctx.fillRect(x + h - 2, y0, 2, y1 - y0);
  ctx.strokeStyle = 'rgba(122,106,90,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath();
  for (let y = y0 + 4; y < y1 - 4; y += 22) { const b = Math.min(18, y1 - y); ctx.moveTo(x - h + 2, y); ctx.lineTo(x + h - 2, y + b); ctx.moveTo(x + h - 2, y); ctx.lineTo(x - h + 2, y + b); }
  ctx.stroke();
}
// The shaft through the soil band and the vault (cached with the band).
export function paintLiftTop(ctx) {
  const x = LIFT_X; const h = LIFT_W / 2;
  shaftSeg(ctx, 90, VAULT_TOP + 2); // down from the lift house on the lawn
  shaftSeg(ctx, VAULT_STOP, 264); // on into the maze
  // through the vault: a brass frame from the ceiling collar to the floor
  ctx.fillStyle = '#2d1e16'; ctx.fillRect(x - h, VAULT_TOP, LIFT_W, VAULT_STOP - VAULT_TOP);
  fillRR(ctx, x - h - 3, VAULT_TOP, 3, VAULT_STOP - VAULT_TOP + 1, 1, '#c9a227'); fillRR(ctx, x + h, VAULT_TOP, 3, VAULT_STOP - VAULT_TOP + 1, 1, '#c9a227');
  fillRR(ctx, x - h - 5, VAULT_TOP - 2, LIFT_W + 10, 5, 2, '#b98a3a');
  // a plaque
  fillRR(ctx, x - 16, VAULT_STOP - 44, 13, 16, 2, '#b98a3a'); fillRR(ctx, x - 15, VAULT_STOP - 43, 11, 14, 1.5, '#5a3a1a');
  ctx.fillStyle = '#ffe9b0'; ctx.font = `700 3.6px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('LIFT', x - 9.5, VAULT_STOP - 39); ctx.fillText('⇅', x - 9.5, VAULT_STOP - 33.5); ctx.textBaseline = 'alphabetic';
}

// Timeline: the car goes down through every stop, then back up, pausing at each.
let planKey = -1; let plan = null;
function liftPlan(lift) {
  if (planKey === lift && plan) return plan;
  const ys = liftStops(lift); const idx = ys.map((_, i) => i);
  const seq = [...idx, ...idx.slice(1, -1).reverse()];
  const segs = []; let T = 0;
  for (let i = 0; i < seq.length; i++) {
    const a = ys[seq[i]]; const bY = ys[seq[(i + 1) % seq.length]];
    segs.push({ dwell: true, t0: T, t1: T + DWELL, y: a, stop: seq[i] }); T += DWELL;
    const d = Math.abs(bY - a) / SPEED; segs.push({ dwell: false, t0: T, t1: T + d, a, b: bY }); T += d;
  }
  planKey = lift; plan = { ys, segs, T };
  return plan;
}
function ridersFor(leg) {
  const R = rng(leg * 2654435 + 7);
  const u = R(); const n = u < 0.12 ? 0 : u < 0.55 ? 1 : u < 0.88 ? 2 : 3;
  const out = []; for (let k = 0; k < n; k++) out.push({ ...visitor(leg * 13 + k * 7 + 1), dir: R() < 0.5 ? 1 : -1 });
  return out;
}

// The shaft below the band, the lift house, the car and its riders, and the landings.
// tint / dark: the garden's night colouring, so the lift house matches the lawn.
export function drawLift(ctx, view, t, lift, tint = (c) => c, dark = 0) {
  if (!lift) return;
  const { ys, segs, T } = liftPlan(lift);
  const x = LIFT_X; const h = LIFT_W / 2; const bottom = ys[ys.length - 1] + 8;
  if (x + 30 < view.worldLeft || x - 30 > view.worldRight) return;
  const y0 = Math.max(262, view.top - 10); const y1 = Math.min(bottom, view.bottom + 40);
  if (y1 > y0) {
    // through Umber's cavern the shaft is an open brass cage, so the dragon stays in view
    const cave = cellY(DEEP_ROWS - 1);
    if (y0 < cave) shaftSeg(ctx, y0, Math.min(y1, cave));
    if (y1 > cave) shaftSeg(ctx, Math.max(y0, cave), y1, false);
  }
  // where is the car?
  const cyc = Math.floor(t / T); const tt = t - cyc * T;
  let si = 0; while (si < segs.length - 1 && tt >= segs[si].t1) si++;
  const sg = segs[si]; const u = (tt - sg.t0) / (sg.t1 - sg.t0);
  let cy; let open = 0; let leg = cyc * segs.length + si;
  if (sg.dwell) { cy = sg.y; open = Math.min(1, Math.max(0, Math.min(u, 1 - u) * 5)); if (u < 0.5) leg -= 1; else leg += 1; }
  else { const e = u * u * (3 - 2 * u); cy = sg.a + (sg.b - sg.a) * e; }
  const house = view.top < SURFACE_STOP + 12 && view.bottom > 4;
  if (house) drawHouseBack(ctx, tint);
  // the cable from the big wheel in the lift house
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x, Math.max(PULLEY_Y + 5, view.top - 10)); ctx.lineTo(x, cy - 34); ctx.stroke();
  // whoever boarded at the lawn rides down; whoever is about to step out there rides up
  let riders = ridersFor(leg); const L = segs.length; const mod = ((leg % L) + L) % L;
  if (mod === 1) riders = [{ ...visitor(Math.floor(leg / L) * 17 + 3), dir: 1 }, ...riders].slice(0, 3);
  else if (mod === L - 1 && si !== 0) riders = [{ ...visitor(((leg + 1) / L) * 17 + 9), dir: -1 }, ...riders].slice(0, 3);
  if (cy > view.top - 40 && cy - 40 < view.bottom) drawCar(ctx, x, cy, riders, open, t);
  // the house's riders belong to a round trip: the car calls at the lawn once, at the start of each
  if (house) drawHouseFront(ctx, t, cy, si === 0 ? u : -1, si === 0 ? cyc : cyc + 1, tint, dark);
  // landings in the maze: a floor lip to step onto, a lamp, and a folding gate when the car is away
  for (let i = 2; i < ys.length; i++) {
    const ly = ys[i]; if (ly < view.top - 10 || ly - 40 > view.bottom) continue;
    const here = Math.abs(cy - ly) < 1;
    art(ctx, here ? 'landing1' : 'landing0', [-h - 3, -41, LIFT_W + 6, 45], paintLanding, here, x, ly);
    if (here) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, ly - 38, 10, '255,220,120', 0.6); ctx.globalCompositeOperation = 'source-over'; }
  }
}
function paintLanding(ctx, here) {
  const h = LIFT_W / 2;
  fillRR(ctx, -h - 2, -1, LIFT_W + 4, 4, 1, '#8a5a3a'); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(-h - 2, -1, LIFT_W + 4, 0.8);
  circ(ctx, 0, -38, 2, here ? '#ffe07a' : '#6a5a4a');
  if (!here) gate(ctx, 0, 0, 30);
}
function gate(ctx, x, ly, hgt) {
  const h = LIFT_W / 2;
  ctx.strokeStyle = 'rgba(201,162,39,0.8)'; ctx.lineWidth = 0.7; ctx.beginPath();
  for (let k = 0; k <= 6; k++) { const gx = x - h + (k / 6) * LIFT_W; ctx.moveTo(gx, ly - hgt); ctx.lineTo(gx, ly - 1); }
  ctx.moveTo(x - h, ly - hgt); ctx.lineTo(x + h, ly - 1); ctx.moveTo(x + h, ly - hgt); ctx.lineTo(x - h, ly - 1); ctx.stroke();
}
const CAR_W = LIFT_W - 4; const CAR_H = 32;
const CAR_BOX = [-CAR_W / 2 - 3, -CAR_H - 8, CAR_W + 6, CAR_H + 10];
function drawCar(ctx, x, y, riders, open, t) {
  const w = CAR_W; const hgt = CAR_H; const x0 = x - w / 2;
  art(ctx, 'carBack', CAR_BOX, paintCarBack, 0, x, y);
  riders.forEach((rd, k) => drawCritter(ctx, x0 + 5 + k * 5.5, y - 1.5, rd, 'stand', rd.dir, t + k, 0.62));
  art(ctx, 'carFront', CAR_BOX, paintCarFront, 0, x, y);
  // folding gate: slides aside when the car stops
  ctx.strokeStyle = 'rgba(201,162,39,0.9)'; ctx.lineWidth = 0.7; ctx.beginPath();
  const gw = w * (1 - 0.85 * open);
  for (let k = 0; k <= 5; k++) { const gx = x0 + w - (k / 5) * gw; ctx.moveTo(gx, y - hgt + 2); ctx.lineTo(gx, y - 1); }
  ctx.stroke();
}
function paintCarBack(ctx) {
  const w = CAR_W; const hgt = CAR_H; const x0 = -w / 2;
  fillRR(ctx, x0, -hgt, w, hgt, 2, '#5a3a22'); fillRR(ctx, x0 + 1.5, -hgt + 2, w - 3, hgt - 4, 1.5, '#8a6440');
  ctx.fillStyle = 'rgba(255,240,200,0.18)'; ctx.fillRect(x0 + 2, -hgt + 2, w - 4, 8);
}
function paintCarFront(ctx) {
  const w = CAR_W; const hgt = CAR_H; const x0 = -w / 2;
  // brass frame, roof, lamp and floor lip
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.2; rr(ctx, x0, -hgt, w, hgt, 2); ctx.stroke();
  ctx.fillStyle = '#b98a3a'; ctx.beginPath(); ctx.moveTo(x0 - 2, -hgt); ctx.quadraticCurveTo(0, -hgt - 7, x0 + w + 2, -hgt); ctx.closePath(); ctx.fill();
  circ(ctx, 0, -hgt - 4, 1.4, '#ffe9a0');
  fillRR(ctx, x0 - 1, -2, w + 2, 3, 1, '#b98a3a');
}

/* ---- the lift house on the lawn ---- */
// A little green-and-copper kiosk right above the shaft. Its doorway is a hole in the front wall,
// so the car can be seen arriving inside it.
const HB = SURFACE_STOP; // floor of the house (the lawn's front edge is at y = 90)
const DOOR_L = LIFT_X - 12; const DOOR_R = LIFT_X + 12; const DOOR_TOP = 42; const DOOR_SPRING = 54;
function doorPath(ctx) {
  ctx.moveTo(DOOR_L, HB); ctx.lineTo(DOOR_L, DOOR_SPRING); ctx.arc(LIFT_X, DOOR_SPRING, 12, Math.PI, 0); ctx.lineTo(DOOR_R, HB); ctx.closePath();
}
function drawHouseBack(ctx, tint) {
  // the dark lift well behind the doorway
  ctx.fillStyle = tint('#1f1612'); ctx.beginPath(); doorPath(ctx); ctx.fill();
  ctx.fillStyle = tint('#7a6a5a'); ctx.fillRect(DOOR_L, DOOR_TOP, 2, HB - DOOR_TOP); ctx.fillRect(DOOR_R - 2, DOOR_TOP, 2, HB - DOOR_TOP);
}
function drawHouseFront(ctx, t, cy, dwellU, trip, tint, dark) {
  const x = LIFT_X; const here = Math.abs(cy - HB) < 1;
  // the house itself is one picture for the light of the hour
  const darkQ = Math.round(dark * 20) / 20;
  art(ctx, `liftHouse|${darkQ}`, [LIFT_X - 34, -1, 68, HB + 9], paintHouseFront, { tint, dark }, 0, 0);
  // the big wheel turns as the car moves
  const turn = cy * 0.12; ctx.strokeStyle = tint('#5a3a1a'); ctx.lineWidth = 0.8; ctx.beginPath();
  for (let k = 0; k < 3; k++) { const a = turn + (k * Math.PI) / 3; ctx.moveTo(x + Math.cos(a) * 4.6, PULLEY_Y - 4 + Math.sin(a) * 4.6); ctx.lineTo(x - Math.cos(a) * 4.6, PULLEY_Y - 4 - Math.sin(a) * 4.6); }
  ctx.stroke();
  if (dark > 0.3) { ctx.globalCompositeOperation = 'lighter'; for (const lx of [x - 23, x + 23]) glow(ctx, lx, 51, 16, '255,220,140', 0.45 * dark); ctx.globalCompositeOperation = 'source-over'; }
  // the gate across the doorway while the car is away
  if (!here) gate(ctx, x, HB, HB - DOOR_SPRING + 2);
  houseRiders(ctx, x, t, here, dwellU, trip);
}
function paintHouseFront(ctx, { tint, dark }) {
  const x = LIFT_X;
  // the front wall with the doorway cut out of it
  ctx.fillStyle = tint('#3d7a5a');
  ctx.beginPath(); rr(ctx, x - 18, 34, 36, HB - 34, 2); doorPath(ctx); ctx.fill('evenodd');
  ctx.fillStyle = tint('#2f6348'); ctx.fillRect(x - 18, 64, 5, HB - 64); ctx.fillRect(x + 13, 64, 5, HB - 64); // panelled skirting
  fillRR(ctx, x - 19, 33, 3, HB - 33, 1, tint('#c9a227')); fillRR(ctx, x + 16, 33, 3, HB - 33, 1, tint('#c9a227'));
  // gold door frame
  ctx.strokeStyle = tint('#c9a227'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(DOOR_L, HB); ctx.lineTo(DOOR_L, DOOR_SPRING); ctx.arc(x, DOOR_SPRING, 12, Math.PI, 0); ctx.lineTo(DOOR_R, HB); ctx.stroke();
  circ(ctx, x, DOOR_TOP, 2, tint('#e9b949'));
  // copper dome roof with a round window onto the big wheel, and a finial
  fillRR(ctx, x - 22, 30, 44, 6, 2.5, tint('#5a3a22'));
  ctx.fillStyle = tint('#c9713f'); ctx.beginPath(); ctx.moveTo(x - 20, 31); ctx.quadraticCurveTo(x - 20, 10, x, 8); ctx.quadraticCurveTo(x + 20, 10, x + 20, 31); ctx.closePath(); ctx.fill();
  ctx.fillStyle = tint('#e0925a'); ctx.beginPath(); ctx.moveTo(x - 14, 29); ctx.quadraticCurveTo(x - 13, 14, x - 3, 11); ctx.quadraticCurveTo(x - 9, 16, x - 10, 29); ctx.closePath(); ctx.fill();
  ctx.fillStyle = tint('#e9b949'); ctx.fillRect(x - 0.8, 1, 1.6, 8); circ(ctx, x, 3, 2, tint('#e9b949'));
  circ(ctx, x, PULLEY_Y - 4, 7, tint('#c9a227')); circ(ctx, x, PULLEY_Y - 4, 5.6, tint('#fff3dc'));
  circ(ctx, x, PULLEY_Y - 4, 1.2, tint('#5a3a1a'));
  // the sign on the eaves
  ctx.fillStyle = tint('#ffe9b0'); ctx.font = `700 4.2px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('GRAND LIFT', x, 33.2); ctx.textBaseline = 'alphabetic';
  // lanterns either side of the door, lit at night
  for (const lx of [x - 23, x + 23]) {
    ctx.strokeStyle = tint('#3a3440'); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(lx + (lx < x ? 4 : -4), 46); ctx.lineTo(lx, 46); ctx.lineTo(lx, 48); ctx.stroke();
    fillRR(ctx, lx - 2.6, 48, 5.2, 7, 1.5, tint('#3a3440')); fillRR(ctx, lx - 1.8, 49, 3.6, 5, 1, dark > 0.3 ? '#ffe9a0' : tint('#f6e7c0'));
  }
  // stone steps and flower pots
  fillRR(ctx, x - 22, HB - 1, 44, 5, 2, tint('#a39a86')); fillRR(ctx, x - 15, HB + 3, 30, 4, 1.5, tint('#b8ae9a'));
  for (const [px, col] of [[x - 27, '#f28b82'], [x + 27, '#e9b949']]) { fillRR(ctx, px - 4, HB - 6, 8, 7, 1.5, tint('#b5523b')); ctx.fillStyle = tint('#5e9c55'); ctx.beginPath(); ctx.ellipse(px, HB - 8, 5, 3.4, 0, 0, 7); ctx.fill(); circ(ctx, px - 2, HB - 9, 1.4, tint(col)); circ(ctx, px + 2, HB - 10, 1.4, tint(col)); }
}
function houseRiders(ctx, x, t, here, dwellU, trip) {
  // riders: someone waits by the door; when the car arrives, they step in and the passengers step out
  const next = visitor(trip * 17 + 3);
  if (!here) drawCritter(ctx, x + 32, HB + 2, next, Math.sin(t * 0.7) > 0.6 ? 'point' : 'stand', -1, t, 0.9, next.kind === 'hamster' ? { bag: '#4f7cac' } : {});
  else if (dwellU >= 0) {
    if (dwellU < 0.5) { const p = dwellU / 0.5; drawCritter(ctx, x + 32 - p * 30, HB + 2, next, 'walk', -1, t, 0.9); }
    const out = visitor(trip * 17 + 9); const p2 = Math.min(1, dwellU / 0.6);
    ctx.globalAlpha = 1 - Math.max(0, (p2 - 0.8) / 0.2); drawCritter(ctx, x - 4 - p2 * 34, HB + 2, out, 'walk', -1, t + 1, 0.9); ctx.globalAlpha = 1;
  }
}

/* =================================================================== */
/* Commuters along the tunnels                                          */
/* =================================================================== */
let runKey = ''; let runs = [];
function tunnelRuns(d) {
  const key = `${Object.keys(d.dug).length}|${d.door ? 1 : 0}`;
  if (key === runKey) return runs;
  runKey = key; runs = [];
  for (let r = 0; r < DEEP_ROWS; r++) {
    let c0 = -1;
    for (let c = 0; c <= DEEP_COLS; c++) {
      const k = cellKind(c, r);
      const open = c < DEEP_COLS && k !== '#' && k !== 'D' && !!d.dug[cellId(c, r)];
      if (open && c0 < 0) c0 = c;
      if (!open && c0 >= 0) { if (c - c0 >= 2) runs.push({ r, c0, c1: c - 1 }); c0 = -1; }
    }
  }
  return runs;
}
export function drawCommuters(ctx, view, t, d) {
  for (const run of tunnelRuns(d)) {
    const fy = cellY(run.r) + FEET + 1;
    if (fy < view.top - 10 || fy - 30 > view.bottom) continue;
    const xa = cellX(run.c0) + 26; const xb = cellX(run.c1 + 1) - 26; const len = xb - xa;
    const n = run.c1 - run.c0 >= 3 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const seed = run.r * 31 + run.c0 * 7 + k * 101;
      const sp = 13 + (seed % 5);
      const p = (t * sp + seed * 37 + k * len) % (2 * len);
      const wx = p < len ? xa + p : xb - (p - len); const dir = p < len ? 1 : -1;
      if (wx < view.worldLeft - 20 || wx > view.worldRight + 20) continue;
      const who = visitor(seed + Math.floor((t * sp + seed * 37 + k * len) / (2 * len)) * 17);
      drawCritter(ctx, wx, fy, who, 'walk', dir, t + k, 1, who.kind === 'hamster' && k % 2 ? { bag: '#b5523b' } : {});
    }
  }
}
void coinIcon;
