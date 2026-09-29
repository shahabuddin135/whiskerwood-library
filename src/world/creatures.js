// The Deep Stacks' residents: the mole diggers, Umber the dragon, and fossils in the soil.
import { ell, circ, fillRR, shade, mouseLod } from './draw.js';

const BONE = '#ecdfc2';
const BONE_DK = '#c4b08a';
const BONE_LN = 'rgba(120,95,60,0.55)';

/* ---------------- mole diggers ---------------- */
// A mole, feet at (x, y). o.pose: 'dig' | 'stand' | 'wave' | 'push' | 'walk' | 'serve'
// Diggers wear a miner's helmet; Mole City shopkeepers set o.helmet = false and wear o.hat
// ('bow' | 'chef' | 'cap' | 'top' | 'beret'), o.apron and o.glasses. o.item: a colour held out.
function drawMoleLite(ctx, x, y, o) {
  const s = o.s ?? 1; const t = o.t ?? 0; const FUR = o.fur || '#5f5049';
  const bob = o.pose === 'walk' ? Math.abs(Math.sin(t * 9)) * 1.2 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale((o.dir || 1) * s, s);
  ell(ctx, 0, -9 - bob, 9.5, 9, FUR); ell(ctx, 6, -13.5 - bob, 6.5, 6, FUR); circ(ctx, 16, -12.3 - bob, 2, '#f07a98');
  if (o.apron) fillRR(ctx, 0, -15 - bob, 9, 12, 3, o.apron);
  if (o.helmet !== false) { ctx.fillStyle = o.hatCol || '#f2c14e'; ctx.beginPath(); ctx.ellipse(5, -18.5 - bob, 6.8, 4.6, 0, Math.PI, 0); ctx.fill(); }
  else if (o.hat) fillRR(ctx, 0, -23 - bob, 10, 5, 2, o.hatCol || (o.hat === 'chef' ? '#fffaf0' : '#b5523b'));
  ctx.restore();
}
export function drawMole(ctx, x, y, o = {}) {
  if (mouseLod() && !o.full) { drawMoleLite(ctx, x, y, o); return; }
  const s = o.s ?? 1; const t = o.t ?? 0; const pose = o.pose || 'stand';
  const FUR = o.fur || '#5f5049'; const LT = shade(FUR, 0.22); const PAW = '#f2b6a8';
  ctx.save(); ctx.translate(x, y); ctx.scale((o.dir || 1) * s, s);
  const walk = pose === 'walk';
  const bob = pose === 'dig' ? Math.abs(Math.sin(t * 8)) * 1.2 : walk ? Math.abs(Math.sin(t * 9)) * 1.2 : Math.sin(t * 2) * 0.4;
  const step = walk ? Math.sin(t * 9) * 2.2 : 0;
  if (!o.noShadow) ell(ctx, 0, 0.5, 10, 2.2, 'rgba(0,0,0,0.18)');
  // back paw + tail stub
  ell(ctx, -6 + step, -1.2, 3.4, 1.8, PAW);
  ell(ctx, -9.5, -6 - bob, 2.2, 1.4, PAW, -0.5);
  // round velvety body
  ell(ctx, 0, -9 - bob, 9.5, 9, FUR);
  ell(ctx, -2.5, -13 - bob, 5.5, 4, 'rgba(255,255,255,0.10)'); // soft sheen
  ell(ctx, 3, -6.5 - bob, 5.5, 5.5, LT);
  ell(ctx, 3 - step, -1.2, 3.4, 1.8, PAW);
  if (o.apron) {
    fillRR(ctx, -0.5, -15 - bob, 10, 13, 3, o.apron);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(1, -9 - bob); ctx.lineTo(8, -9 - bob); ctx.stroke();
  }
  if (o.scarf) fillRR(ctx, 1, -18.5 - bob, 10, 3.6, 1.8, o.scarf);
  // head and snout
  ell(ctx, 6, -13.5 - bob, 6.5, 6, FUR);
  ell(ctx, 11.5, -12 - bob, 5, 3.4, LT);
  // the famous star nose
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + t * 0.5; ell(ctx, 16 + Math.cos(a) * 1.4, -12.3 - bob + Math.sin(a) * 1.4, 1.2, 0.8, '#f59ab0', a); }
  circ(ctx, 16, -12.3 - bob, 1.4, '#f07a98');
  // happy squint
  ctx.strokeStyle = '#1d1b24'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(8.5, -14.6 - bob, 1.3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ell(ctx, 10.5, -11 - bob, 1.6, 1, 'rgba(240,130,130,0.4)');
  if (o.glasses) { ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(8.8, -14.4 - bob, 2.3, 0, 7); ctx.stroke(); }
  // big spade paws
  const reach = pose === 'dig' ? Math.sin(t * 8) : pose === 'push' ? 0.6 : pose === 'serve' ? 0.9 + Math.sin(t * 2) * 0.1 : 0;
  const px = 10 + reach * 4; const py = pose === 'wave' ? -24 - Math.sin(t * 9) * 2 : pose === 'serve' ? -11 - bob : -6 - bob - reach * 2;
  if (o.item) ell(ctx, px + 3, py - 2.5, 4.2, 2.6, o.item);
  ell(ctx, px, py, 3.6, 2.8, PAW, pose === 'wave' ? -0.8 : 0.3);
  ctx.strokeStyle = 'rgba(160,90,80,0.6)'; ctx.lineWidth = 0.5;
  for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(px + 2, py + k * 1.2); ctx.lineTo(px + 4.4, py + k * 1.5); ctx.stroke(); }
  if (o.shovel) {
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.9 + reach * 0.5);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-1, -12, 1.8, 16);
    ctx.fillStyle = '#9aa0ab'; ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(3, 4); ctx.lineTo(2, 10); ctx.lineTo(-2, 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // miner's helmet with a lamp, or a shopkeeper's hat
  if (o.helmet !== false) {
    ctx.fillStyle = o.hatCol || '#f2c14e';
    ctx.beginPath(); ctx.ellipse(5, -18.5 - bob, 6.8, 4.6, 0, Math.PI, 0); ctx.fill();
    fillRR(ctx, -2.2, -19 - bob, 14.6, 1.8, 0.9, shade(o.hatCol || '#f2c14e', -0.18));
    circ(ctx, 10.5, -21 - bob, 1.9, '#fff3b0');
    ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(10.5, -21 - bob, 1.9, 0, 7); ctx.stroke();
  } else if (o.hat) moleHat(ctx, o.hat, 5, -19 - bob, o.hatCol);
  ctx.restore();
}
function moleHat(ctx, kind, x, y, col) {
  if (kind === 'chef') { fillRR(ctx, x - 4, y - 3, 8, 4, 1, '#fffaf0'); circ(ctx, x - 2.5, y - 5, 3, '#fffaf0'); circ(ctx, x + 2.5, y - 5, 3, '#fffaf0'); circ(ctx, x, y - 7, 3.2, '#fffaf0'); }
  else if (kind === 'bow') { const c = col || '#e0404f'; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y - 3.5); ctx.lineTo(x - 5, y + 2.5); ctx.closePath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y - 3.5); ctx.lineTo(x + 5, y + 2.5); ctx.closePath(); ctx.fill(); circ(ctx, x, y, 1.5, shade(c, -0.2)); }
  else if (kind === 'top') { fillRR(ctx, x - 6, y, 12, 1.8, 0.8, col || '#2a2530'); fillRR(ctx, x - 3.8, y - 8, 7.6, 8.4, 1, col || '#2a2530'); ctx.fillStyle = '#b5523b'; ctx.fillRect(x - 3.8, y - 2, 7.6, 1.4); }
  else if (kind === 'beret') { ell(ctx, x, y - 1.5, 6, 2.6, col || '#3d7a5a', -0.15); circ(ctx, x, y - 4, 0.9, col || '#3d7a5a'); }
  else { ctx.fillStyle = col || '#4f7cac'; ctx.beginPath(); ctx.ellipse(x, y, 5.4, 3.6, 0, Math.PI, 0); ctx.fill(); fillRR(ctx, x, y - 1, 8, 1.6, 0.8, shade(col || '#4f7cac', -0.2)); }
}

/* ---------------- hamsters ---------------- */
// A round little hamster (visitors to Mole City), feet at (x, y).
// o.pose: 'stand' | 'walk' | 'eat' | 'sit' | 'wave'. o.fur / o.belly, o.scarf, o.hat ('bow' | 'cap' | 'beret'), o.bag.
export function drawHamster(ctx, x, y, o = {}) {
  const s = o.s ?? 1; const t = o.t ?? 0; const pose = o.pose || 'stand';
  const FUR = o.fur || '#e0a15a'; const WH = o.belly || '#fbf1e2'; const PAW = '#f4b9a8';
  const walk = pose === 'walk';
  const bob = walk ? Math.abs(Math.sin(t * 10)) * 1.4 : Math.sin(t * 2.4) * 0.35;
  ctx.save(); ctx.translate(x, y); ctx.scale((o.dir || 1) * s, s);
  if (mouseLod() && !o.full) {
    ell(ctx, 0, -8 - bob, 9, 8.2, FUR); ell(ctx, 4.5, -14 - bob, 6.5, 5.8, FUR); ell(ctx, 7.5, -11.8 - bob, 3.6, 2.9, WH);
    circ(ctx, 1, -19 - bob, 2.2, FUR); circ(ctx, 6.8, -15.2 - bob, 1.2, '#1d1b24');
    ctx.restore(); return;
  }
  if (!o.noShadow) ell(ctx, 0, 0.5, 9, 2, 'rgba(0,0,0,0.18)');
  const step = walk ? Math.sin(t * 10) * 2 : 0;
  ell(ctx, -3 + step, -0.9, 2.6, 1.4, PAW); ell(ctx, 3 - step, -0.9, 2.6, 1.4, PAW);
  if (o.bag) { fillRR(ctx, -11, -13 - bob, 7, 8, 2, o.bag); ctx.strokeStyle = shade(o.bag, -0.3); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-7.5, -13 - bob); ctx.lineTo(2, -19 - bob); ctx.stroke(); }
  // a soft ball of a body
  ell(ctx, 0, -8 - bob, 9, 8.2, FUR);
  ell(ctx, 2.5, -6 - bob, 6, 5.5, WH);
  ell(ctx, -3, -12.5 - bob, 4.5, 2.6, 'rgba(255,255,255,0.16)');
  ell(ctx, -6.5, -3 - bob, 3.4, 2.4, shade(FUR, -0.1)); // haunch
  if (o.scarf) fillRR(ctx, -1, -12.5 - bob, 11, 3.4, 1.7, o.scarf);
  // head, merged into the body the way hamsters are
  const hy = -14.5 - bob;
  ell(ctx, 4.5, hy, 6.8, 6, FUR);
  circ(ctx, 0.8, hy - 5, 2.3, FUR); circ(ctx, 0.8, hy - 5, 1.2, PAW);
  circ(ctx, 6.2, hy - 5.6, 2.3, FUR); circ(ctx, 6.2, hy - 5.6, 1.2, PAW);
  // cheek pouches (full when eating)
  const puff = pose === 'eat' ? 1.25 + Math.abs(Math.sin(t * 3)) * 0.2 : 1;
  ell(ctx, 7.6, hy + 2.4, 3.7 * puff, 3 * puff, WH);
  ell(ctx, 8.6, hy + 1.6, 1.6, 0.9, 'rgba(240,130,130,0.45)');
  ell(ctx, 4.8, hy - 3.8, 1.2, 1.8, WH); // white blaze
  // eye, nose, whiskers
  if (pose === 'sit' && o.sleep) { ctx.strokeStyle = '#1d1b24'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(6.8, hy - 1.4, 1.2, 0.1, Math.PI - 0.1); ctx.stroke(); }
  else { circ(ctx, 6.9, hy - 1.2, 1.3, '#1d1b24'); circ(ctx, 7.3, hy - 1.7, 0.45, '#fff'); }
  circ(ctx, 10.9, hy + 0.5, 0.95, '#e27a8a');
  ctx.strokeStyle = 'rgba(90,60,40,0.45)'; ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(10, hy + 1.2); ctx.lineTo(14.5, hy + 0.2); ctx.moveTo(10, hy + 1.8); ctx.lineTo(14.5, hy + 2.6); ctx.stroke();
  // little front paws
  if (pose === 'wave') ell(ctx, 9.5, hy - 5 - Math.sin(t * 9) * 1.5, 1.8, 1.4, PAW);
  else if (pose === 'eat') { ell(ctx, 10.5, hy + 4.2, 2.4, 1.9, o.item || '#e8c465'); ell(ctx, 9, hy + 5, 1.6, 1.3, PAW); }
  else ell(ctx, 7.5, -5.5 - bob, 1.6, 1.3, PAW);
  if (o.hat) moleHat(ctx, o.hat, 3.5, hy - 6, o.hatCol);
  ctx.restore();
}

/* ---------------- Umber the dragon ---------------- */
const SCALE = '#d9824a'; const SCALE_DK = '#b3603a'; const BELLY = '#f6dcb0'; const HORN = '#efe3c8'; const WING = '#c9713f'; const MEMB = '#eaa56d';
// Curled up on the hoard. (x, y) is the middle of the resting line; ~260 x 110 at s = 1.
export function drawDragon(ctx, x, y, o = {}) {
  const s = o.s ?? 1; const t = o.t ?? 0; const awake = !!o.awake;
  const breathe = Math.sin(t * (awake ? 1.6 : 0.8)) * 2;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ell(ctx, 0, 2, 130, 10, 'rgba(0,0,0,0.25)');
  // tail curling round the front
  ctx.strokeStyle = SCALE; ctx.lineWidth = 18; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-70, -30); ctx.bezierCurveTo(-140, -10, -120, 8, -40, 4); ctx.bezierCurveTo(10, 2, 40, 6, 70, -2); ctx.stroke();
  ctx.strokeStyle = SCALE_DK; ctx.lineWidth = 2; ctx.setLineDash([3, 6]);
  ctx.beginPath(); ctx.moveTo(-70, -39); ctx.bezierCurveTo(-148, -16, -128, -2, -40, -5); ctx.stroke(); ctx.setLineDash([]);
  // tail tip spade
  ctx.fillStyle = SCALE_DK; ctx.beginPath(); ctx.moveTo(70, -8); ctx.lineTo(88, -4 + Math.sin(t) * 2); ctx.lineTo(72, 6); ctx.closePath(); ctx.fill();
  // body
  ell(ctx, -10, -40 - breathe * 0.5, 78, 40 + breathe * 0.5, SCALE);
  ell(ctx, -4, -26 - breathe * 0.3, 60, 20, BELLY);
  ctx.strokeStyle = 'rgba(180,120,70,0.5)'; ctx.lineWidth = 1;
  for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(-4 + k * 15, -44); ctx.quadraticCurveTo(-4 + k * 15 + 3, -26, -4 + k * 15, -9); ctx.stroke(); }
  // scale texture: little arcs over the back
  ctx.strokeStyle = 'rgba(120,60,30,0.35)'; ctx.lineWidth = 0.8;
  for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) { const sx = -70 + k * 16 + (r % 2) * 8; const sy = -66 + r * 9 - Math.sin((k / 8) * Math.PI) * 8; ctx.beginPath(); ctx.arc(sx, sy, 4, 0.1, Math.PI - 0.1); ctx.stroke(); }
  // folded wing
  ctx.fillStyle = WING; ctx.beginPath(); ctx.moveTo(-40, -66); ctx.quadraticCurveTo(-10, -118 - breathe, 34, -96); ctx.quadraticCurveTo(24, -80, 30, -68); ctx.quadraticCurveTo(8, -72, -6, -60); ctx.closePath(); ctx.fill();
  ctx.fillStyle = MEMB; ctx.beginPath(); ctx.moveTo(-30, -66); ctx.quadraticCurveTo(-4, -104 - breathe, 26, -92); ctx.quadraticCurveTo(10, -76, -4, -64); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = SCALE_DK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-36, -66); ctx.lineTo(8, -106 - breathe); ctx.moveTo(-18, -64); ctx.lineTo(24, -94); ctx.stroke();
  // back spikes
  ctx.fillStyle = SCALE_DK;
  for (let k = 0; k < 8; k++) { const sx = -78 + k * 13; const sy = -72 + Math.pow((k - 4) / 4, 2) * 18 - breathe * 0.4; ctx.beginPath(); ctx.moveTo(sx - 4, sy + 4); ctx.lineTo(sx + 1, sy - 7); ctx.lineTo(sx + 5, sy + 4); ctx.closePath(); ctx.fill(); }
  // front paw
  ell(ctx, 52, -6, 16, 8, SCALE);
  [44, 51, 58].forEach((cx) => ell(ctx, cx, -1, 2.6, 1.8, HORN));
  // neck and head resting on the paw
  ctx.fillStyle = SCALE; ctx.beginPath(); ctx.moveTo(40, -60); ctx.quadraticCurveTo(76, -64, 86, -34); ctx.lineTo(60, -18); ctx.quadraticCurveTo(46, -34, 26, -40); ctx.closePath(); ctx.fill();
  const hx = awake ? 92 : 88; const hy = awake ? -44 + Math.sin(t * 0.9) * 1.5 : -26;
  drawDragonHead(ctx, hx, hy, { t, awake, glasses: o.glasses });
  // sleepy smoke rings
  if (!awake) {
    for (let k = 0; k < 3; k++) {
      const ph = ((t * 0.3 + k / 3) % 1);
      ctx.strokeStyle = `rgba(230,225,215,${0.5 * (1 - ph)})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(hx + 26 + ph * 14, hy - 8 - ph * 26, 3 + ph * 5, 2 + ph * 3, 0, 0, 7); ctx.stroke();
    }
  }
  ctx.restore();
}

// Head facing right, centred on (x, y). Also used for the story portrait.
export function drawDragonHead(ctx, x, y, { t = 0, awake = false, glasses = false } = {}) {
  ctx.save(); ctx.translate(x, y);
  // horns
  ctx.fillStyle = HORN;
  ctx.beginPath(); ctx.moveTo(-12, -14); ctx.quadraticCurveTo(-26, -30, -16, -38); ctx.quadraticCurveTo(-14, -26, -4, -18); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-2, -17); ctx.quadraticCurveTo(-8, -34, 4, -40); ctx.quadraticCurveTo(0, -28, 8, -18); ctx.closePath(); ctx.fill();
  // head and snout
  ell(ctx, 0, 0, 22, 18, SCALE);
  ell(ctx, 20, 6, 18, 11, SCALE);
  ell(ctx, 18, 10, 14, 6, BELLY);
  ell(ctx, -6, -8, 10, 6, 'rgba(255,255,255,0.12)');
  // nostrils
  ell(ctx, 33, 1, 2, 1.3, SCALE_DK); ell(ctx, 29, 0, 1.6, 1.1, SCALE_DK);
  // cheek frill
  ctx.fillStyle = SCALE_DK; ctx.beginPath(); ctx.moveTo(-18, 4); ctx.lineTo(-30, 10); ctx.lineTo(-18, 12); ctx.lineTo(-28, 20); ctx.lineTo(-12, 16); ctx.closePath(); ctx.fill();
  // eye
  if (awake) {
    ell(ctx, 4, -4, 6.5, 6, '#fff8e6'); circ(ctx, 5.5, -3.5, 4.4, '#d99a28'); ell(ctx, 5.5, -3.5, 1.4, 3.6, '#2b1b10'); circ(ctx, 7, -5.5, 1.3, '#fff');
    ctx.strokeStyle = SCALE_DK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(4, -4, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else {
    ctx.strokeStyle = '#6b3a20'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(4, -4, 5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  }
  if (glasses) {
    ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(5, -4, 8, 0, 7); ctx.moveTo(13, -4); ctx.lineTo(18, -2); ctx.stroke();
  }
  // a small, polite smile
  ctx.strokeStyle = '#8a4a2a'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(14, 12); ctx.quadraticCurveTo(24, 16, 34, 9); ctx.stroke();
  ell(ctx, 14, 6, 3, 2, 'rgba(240,120,100,0.35)');
  ctx.restore();
  void t;
}

/* ---------------- fossils ---------------- */
function bone(ctx, x1, y1, x2, y2, w = 2.2) {
  ctx.strokeStyle = BONE; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  circ(ctx, x1, y1, w * 0.8, BONE); circ(ctx, x2, y2, w * 0.8, BONE);
}
function vertebrae(ctx, pts, r0, r1) {
  pts.forEach(([x, y], k) => { const r = r0 + (r1 - r0) * (k / Math.max(1, pts.length - 1)); ell(ctx, x, y, r * 1.2, r, BONE); ctx.strokeStyle = BONE_LN; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r, 0, 0, 7); ctx.stroke(); });
}
const curve = (a, b, c, n) => Array.from({ length: n }, (_, k) => { const u = k / (n - 1); return [a[0] * (1 - u) ** 2 + 2 * b[0] * u * (1 - u) + c[0] * u * u, a[1] * (1 - u) ** 2 + 2 * b[1] * u * (1 - u) + c[1] * u * u]; });

// A big T. rex skeleton lying in the soil (about 200 x 70 at s = 1), facing right.
export function drawRex(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const spine = curve([-100, -10], [-20, -44], [60, -34], 22);
  vertebrae(ctx, spine, 2.2, 4.2);
  // ribs
  for (let k = 8; k < 18; k++) { const [px, py] = spine[k]; ctx.strokeStyle = BONE; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 6, py + 16, px - 2, py + 26 - Math.abs(k - 13) * 2); ctx.stroke(); }
  // legs
  bone(ctx, 10, -30, 0, -6, 4); bone(ctx, 0, -6, 12, 12, 3.4); bone(ctx, 12, 12, 26, 14, 2.4);
  bone(ctx, 28, -28, 36, -6, 3.2); bone(ctx, 36, -6, 30, 12, 2.6);
  // tiny arms
  bone(ctx, 54, -26, 60, -16, 1.4); bone(ctx, 60, -16, 64, -18, 1);
  // skull
  ctx.fillStyle = BONE;
  ctx.beginPath(); ctx.moveTo(58, -46); ctx.quadraticCurveTo(70, -58, 94, -50); ctx.lineTo(104, -38); ctx.lineTo(96, -30); ctx.lineTo(66, -28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(66, -26); ctx.lineTo(100, -26); ctx.lineTo(90, -18); ctx.lineTo(68, -18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(80,55,30,0.55)'; ell(ctx, 76, -44, 4.5, 3.4, null); ctx.fill(); ell(ctx, 90, -42, 3, 2.2, null); ctx.fill();
  ctx.fillStyle = '#fbf6ea'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(70 + k * 4, -29); ctx.lineTo(71.5 + k * 4, -25); ctx.lineTo(73 + k * 4, -29); ctx.fill(); }
  ctx.restore();
}

// A long-necked sauropod skeleton (about 260 x 80 at s = 1), facing left.
export function drawSauropod(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const neck = curve([-20, -40], [-80, -50], [-120, -84], 14);
  const back = curve([-20, -40], [20, -54], [70, -40], 12);
  const tail = curve([70, -40], [110, -30], [150, -6], 16);
  vertebrae(ctx, neck, 3.4, 2); vertebrae(ctx, back, 3.8, 3.6); vertebrae(ctx, tail, 3.2, 1);
  for (let k = 1; k < 11; k++) { const [px, py] = back[k]; ctx.strokeStyle = BONE; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px - 4, py + 18, px + 2, py + 30); ctx.stroke(); }
  bone(ctx, -6, -34, -10, -4, 4.4); bone(ctx, -10, -4, -8, 16, 4); bone(ctx, 58, -36, 62, -6, 4.6); bone(ctx, 62, -6, 60, 16, 4);
  // skull
  ell(ctx, -128, -86, 9, 5, BONE); ell(ctx, -136, -83, 6, 3.4, BONE); circ(ctx, -127, -88, 1.8, 'rgba(80,55,30,0.55)');
  ctx.restore();
}

export function drawAmmonite(ctx, x, y, r = 12, col = '#d9c6a0') {
  ctx.save(); ctx.translate(x, y);
  circ(ctx, 0, 0, r, col);
  ctx.strokeStyle = 'rgba(110,85,55,0.6)'; ctx.lineWidth = Math.max(0.6, r * 0.06);
  ctx.beginPath(); for (let a = 0; a < Math.PI * 7; a += 0.2) { const rr = r * (1 - a / (Math.PI * 7.4)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.stroke();
  for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); ctx.lineTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98); ctx.stroke(); }
  ell(ctx, -r * 0.35, -r * 0.4, r * 0.3, r * 0.18, 'rgba(255,255,255,0.25)', -0.6);
  ctx.restore();
}

export function drawTrilobite(ctx, x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ell(ctx, 0, 0, 5, 7.5, '#bfae8e'); ell(ctx, 0, -6, 5.4, 2.8, '#cbb997');
  ctx.strokeStyle = 'rgba(90,70,45,0.6)'; ctx.lineWidth = 0.5;
  for (let k = -4; k < 7; k += 1.6) { ctx.beginPath(); ctx.moveTo(-4.6, k); ctx.lineTo(4.6, k); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 7); ctx.stroke();
  ctx.restore();
}

export function drawBone(ctx, x, y, len = 10, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  bone(ctx, -len / 2, 0, len / 2, 0, 1.8);
  circ(ctx, -len / 2 - 1, -1.2, 1.5, BONE); circ(ctx, -len / 2 - 1, 1.2, 1.5, BONE); circ(ctx, len / 2 + 1, -1.2, 1.5, BONE); circ(ctx, len / 2 + 1, 1.2, 1.5, BONE);
  ctx.restore();
}

// The four collectable fossils (drawn about 40 wide at s = 1, centred on the base line).
export function drawFossil(ctx, id, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  switch (id) {
    case 'ammonite': drawAmmonite(ctx, 0, -14, 14, '#e2cfa8'); break;
    case 'trike': {
      ctx.fillStyle = BONE; ctx.beginPath(); ctx.moveTo(-18, -26); ctx.quadraticCurveTo(-10, -40, 6, -34); ctx.lineTo(10, -18); ctx.lineTo(-14, -6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = BONE_DK; for (let k = 0; k < 6; k++) circ(ctx, -16 + k * 4, -30 + Math.abs(k - 2.5) * 2, 1.6, BONE_DK);
      ctx.fillStyle = BONE; ctx.beginPath(); ctx.moveTo(4, -22); ctx.lineTo(22, -12); ctx.lineTo(18, -4); ctx.lineTo(0, -6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(18, -12); ctx.lineTo(26, -8); ctx.lineTo(19, -5); ctx.fill();
      [[2, -26, 14, -40], [-4, -24, 4, -40], [16, -14, 22, -22]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a - 2, b); ctx.lineTo(c, d); ctx.lineTo(a + 2, b); ctx.fill(); });
      circ(ctx, 6, -18, 2.4, 'rgba(80,55,30,0.55)');
      break;
    }
    case 'ptero': {
      bone(ctx, 0, -16, -22, -30, 1.6); bone(ctx, -22, -30, -34, -12, 1.2); bone(ctx, 0, -16, 22, -30, 1.6); bone(ctx, 22, -30, 34, -12, 1.2);
      ctx.fillStyle = 'rgba(200,180,140,0.35)'; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(-22, -30); ctx.lineTo(-34, -12); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(22, -30); ctx.lineTo(34, -12); ctx.closePath(); ctx.fill();
      vertebrae(ctx, curve([0, -16], [2, -8], [0, -2], 5), 1.8, 1);
      ctx.fillStyle = BONE; ctx.beginPath(); ctx.moveTo(-3, -18); ctx.lineTo(14, -24); ctx.lineTo(-2, -22); ctx.lineTo(-10, -30); ctx.closePath(); ctx.fill();
      break;
    }
    case 'smilodon': {
      ell(ctx, 0, -18, 14, 10, BONE); ell(ctx, 10, -14, 9, 6, BONE);
      circ(ctx, 2, -20, 3, 'rgba(80,55,30,0.55)'); ell(ctx, 13, -15, 2, 1.4, 'rgba(80,55,30,0.55)');
      ctx.fillStyle = '#fbf6ea'; ctx.beginPath(); ctx.moveTo(10, -10); ctx.quadraticCurveTo(12, 0, 8, 6); ctx.lineTo(13, -10); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(15, -10); ctx.quadraticCurveTo(17, -2, 14, 3); ctx.lineTo(18, -10); ctx.closePath(); ctx.fill();
      ell(ctx, 4, -8, 10, 3, BONE_DK);
      break;
    }
    default: drawBone(ctx, 0, -8, 16, 0.3);
  }
  ctx.restore();
}
