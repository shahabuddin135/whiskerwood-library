// The Deep Stacks' residents: the mole diggers, Umber the dragon, and fossils in the soil.
import { ell, circ, fillRR, shade, mouseLod, frameOf, TAU } from './draw.js';
import { sprite, spritesOn, spriteNearFrame } from './sprites.js';

// Moles and hamsters are stamped from cached pictures like the mice (see sprites.js):
// pose → [speed, frames] of its animation loop, and the area each can cover around its feet.
const MOLE_CYCLE = { dig: [8, 8], walk: [9, 8], wave: [9, 8] };
const MOLE_IDLE = [2, 8];
const MOLE_BOX = [-14, -32, 42, 36];
const HAMSTER_CYCLE = { walk: [10, 8], eat: [3, 8], wave: [9, 8] };
const HAMSTER_IDLE = [2.4, 8];
const HAMSTER_BOX = [-14, -35, 31, 38];
function stamp(ctx, x, y, o, pose, tag, cycles, idle, box, key, paint, lite) {
  const [speed, n0] = cycles[pose] || idle;
  const n = mouseLod() ? Math.max(2, n0 >> 1) : n0; // tiny on screen: half the frames do
  let ph = speed * (o.t ?? 0) + (o.seed || 0);
  if (spritesOn()) {
    const f = frameOf(ph, n); ph = ((f + 0.5) / n) * TAU;
    const look = key(o);
    if (sprite(ctx, tag + pose + f + look, box, x, y, o.dir || 1, o.s ?? 1, o.alpha ?? 1, paint, o, pose, ph)) return;
    if (spriteNearFrame(ctx, tag + pose, look, f, n, box, x, y, o.dir || 1, o.s ?? 1, o.alpha ?? 1)) return;
    if (!o.full) { lite(ctx, x, y, o); return; } // its pictures are on their way
  }
  if (mouseLod() && !o.full) { lite(ctx, x, y, o); return; }
  ctx.save(); ctx.translate(x, y); ctx.scale((o.dir || 1) * (o.s ?? 1), o.s ?? 1);
  if (o.alpha != null && o.alpha < 1) ctx.globalAlpha *= Math.max(0, o.alpha);
  paint(ctx, o, pose, ph);
  ctx.restore();
}
const moleKey = (o) => `${o.fur}|${o.hatCol}|${o.helmet}|${o.hat}|${o.apron}|${o.scarf}|${o.item}|${o.glasses ? 1 : 0}${o.shovel ? 1 : 0}${o.noShadow ? 1 : 0}`;
const hamsterKey = (o) => `${o.fur}|${o.belly}|${o.scarf}|${o.hat}|${o.hatCol}|${o.bag}|${o.item}|${o.sleep ? 1 : 0}${o.noShadow ? 1 : 0}`;

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
  stamp(ctx, x, y, o, o.pose || 'stand', 'o', MOLE_CYCLE, MOLE_IDLE, MOLE_BOX, moleKey, paintMole, drawMoleLite);
}
// feet at the origin, facing right, at animation phase ph
function paintMole(ctx, o, pose, ph) {
  const FUR = o.fur || '#5f5049'; const LT = shade(FUR, 0.22); const PAW = '#f2b6a8';
  const sn = Math.sin(ph);
  const walk = pose === 'walk';
  const bob = pose === 'dig' || walk ? Math.abs(sn) * 1.2 : sn * 0.4;
  const step = walk ? sn * 2.2 : 0;
  if (!o.noShadow) ell(ctx, 0, 0.5, 10, 2.2, 'rgba(0,0,0,0.18)');
  // back paw + tail stub
  ell(ctx, -6 + step, -1.2, 3.4, 1.8, PAW);
  ell(ctx, -9.5, -6 - bob, 2.2, 1.4, PAW, -0.5);
  // round velvety body (moles' fur lies any way you stroke it: little soft brush marks)
  ell(ctx, 0, -9 - bob, 9.5, 9, FUR);
  ell(ctx, -1, -5 - bob, 8, 5, 'rgba(0,0,0,0.10)');
  ell(ctx, -2.5, -13 - bob, 5.5, 4, 'rgba(255,255,255,0.12)'); // soft sheen
  ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 0.5; ctx.beginPath();
  for (const [fx, fy] of [[-6, -12], [-3, -15], [-7, -7], [-4, -9], [-1, -12], [-5, -4]]) { ctx.moveTo(fx, fy - bob); ctx.quadraticCurveTo(fx + 1, fy - 1.4 - bob, fx + 2.2, fy - 0.6 - bob); }
  ctx.stroke();
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
  // whiskers, then the famous star nose: a ring of little pink feelers (turning one per loop)
  ctx.strokeStyle = 'rgba(40,30,30,0.35)'; ctx.lineWidth = 0.4; ctx.beginPath();
  ctx.moveTo(13, -11.6 - bob); ctx.lineTo(18.5, -9.2 - bob); ctx.moveTo(13, -12.6 - bob); ctx.lineTo(19, -12.9 - bob); ctx.stroke();
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + ph / 10; ell(ctx, 16 + Math.cos(a) * 1.7, -12.3 - bob + Math.sin(a) * 1.7, 1.25, 0.65, k % 2 ? '#f59ab0' : '#f7b3c4', a); }
  circ(ctx, 16, -12.3 - bob, 1.3, '#f07a98'); circ(ctx, 15.6, -12.8 - bob, 0.4, 'rgba(255,255,255,0.7)');
  // happy squint
  ctx.strokeStyle = '#1d1b24'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(8.5, -14.6 - bob, 1.3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ell(ctx, 10.5, -11 - bob, 1.6, 1, 'rgba(240,130,130,0.4)');
  if (o.glasses) { ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(8.8, -14.4 - bob, 2.3, 0, 7); ctx.stroke(); }
  // big spade paws
  const reach = pose === 'dig' ? sn : pose === 'push' ? 0.6 : pose === 'serve' ? 0.9 + sn * 0.1 : 0;
  const px = 10 + reach * 4; const py = pose === 'wave' ? -24 - sn * 2 : pose === 'serve' ? -11 - bob : -6 - bob - reach * 2;
  if (o.item) ell(ctx, px + 3, py - 2.5, 4.2, 2.6, o.item);
  ell(ctx, px, py, 3.6, 2.8, PAW, pose === 'wave' ? -0.8 : 0.3);
  // big pale digging claws
  ctx.strokeStyle = '#f6ecd6'; ctx.lineWidth = 0.9; ctx.lineCap = 'round'; ctx.beginPath();
  for (let k = -1.5; k <= 1.5; k++) { ctx.moveTo(px + 2.2, py + k * 1.1); ctx.lineTo(px + 4.8, py + k * 1.45); }
  ctx.stroke();
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
function drawHamsterLite(ctx, x, y, o) {
  const s = o.s ?? 1; const FUR = o.fur || '#e0a15a'; const WH = o.belly || '#fbf1e2';
  ctx.save(); ctx.translate(x, y); ctx.scale((o.dir || 1) * s, s);
  ell(ctx, 0, -8, 9, 8.2, FUR); ell(ctx, 4.5, -14, 6.5, 5.8, FUR); ell(ctx, 7.5, -11.8, 3.6, 2.9, WH);
  circ(ctx, 1, -19, 2.2, FUR); circ(ctx, 6.8, -15.2, 1.2, '#1d1b24');
  ctx.restore();
}
export function drawHamster(ctx, x, y, o = {}) {
  stamp(ctx, x, y, o, o.pose || 'stand', 'h', HAMSTER_CYCLE, HAMSTER_IDLE, HAMSTER_BOX, hamsterKey, paintHamster, drawHamsterLite);
}
function paintHamster(ctx, o, pose, ph) {
  const FUR = o.fur || '#e0a15a'; const WH = o.belly || '#fbf1e2'; const PAW = '#f4b9a8';
  const sn = Math.sin(ph);
  const walk = pose === 'walk';
  const bob = walk ? Math.abs(sn) * 1.4 : sn * 0.35;
  if (!o.noShadow) ell(ctx, 0, 0.5, 9, 2, 'rgba(0,0,0,0.18)');
  const step = walk ? sn * 2 : 0;
  ell(ctx, -3 + step, -0.9, 2.6, 1.4, PAW); ell(ctx, 3 - step, -0.9, 2.6, 1.4, PAW);
  ctx.strokeStyle = 'rgba(200,110,100,0.5)'; ctx.lineWidth = 0.35; ctx.beginPath(); // toes
  for (const fx of [-3 + step, 3 - step]) for (let k = 0; k < 3; k++) { ctx.moveTo(fx + 0.6 + k * 0.8, -1.8); ctx.lineTo(fx + 0.8 + k * 0.8, -0.4); }
  ctx.stroke();
  if (o.bag) { fillRR(ctx, -11, -13 - bob, 7, 8, 2, o.bag); ctx.strokeStyle = shade(o.bag, -0.3); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-7.5, -13 - bob); ctx.lineTo(2, -19 - bob); ctx.stroke(); }
  // a soft ball of a body, darker along the back like a golden hamster's saddle
  ell(ctx, 0, -8 - bob, 9, 8.2, FUR);
  ell(ctx, -2.5, -11.5 - bob, 6.5, 4.4, 'rgba(110,60,20,0.16)');
  ell(ctx, 2.5, -6 - bob, 6, 5.5, WH);
  ell(ctx, -3, -12.5 - bob, 4.5, 2.6, 'rgba(255,255,255,0.16)');
  ctx.strokeStyle = 'rgba(110,60,20,0.25)'; ctx.lineWidth = 0.45; ctx.beginPath();
  for (const [fx, fy] of [[-6, -9], [-4, -12], [-7, -5], [-2, -14]]) { ctx.moveTo(fx, fy - bob); ctx.lineTo(fx + 1.2, fy - 1.2 - bob); }
  ctx.stroke();
  ell(ctx, -6.5, -3 - bob, 3.4, 2.4, shade(FUR, -0.1)); // haunch
  if (o.scarf) fillRR(ctx, -1, -12.5 - bob, 11, 3.4, 1.7, o.scarf);
  // head, merged into the body the way hamsters are
  const hy = -14.5 - bob;
  ell(ctx, 4.5, hy, 6.8, 6, FUR);
  circ(ctx, 0.8, hy - 5, 2.3, FUR); circ(ctx, 0.8, hy - 5, 1.2, PAW);
  circ(ctx, 6.2, hy - 5.6, 2.3, FUR); circ(ctx, 6.2, hy - 5.6, 1.2, PAW);
  // cheek pouches (full when eating)
  const puff = pose === 'eat' ? 1.25 + Math.abs(sn) * 0.2 : 1;
  ell(ctx, 7.6, hy + 2.4, 3.7 * puff, 3 * puff, WH);
  ell(ctx, 8.6, hy + 1.6, 1.6, 0.9, 'rgba(240,130,130,0.45)');
  ell(ctx, 4.8, hy - 3.8, 1.2, 1.8, WH); // white blaze
  ctx.strokeStyle = shade(FUR, -0.25); ctx.lineWidth = 0.6; ctx.lineCap = 'round'; ctx.beginPath(); // a little tuft on top
  ctx.moveTo(2.5, hy - 5.6); ctx.quadraticCurveTo(3, hy - 8, 4.6, hy - 8.2); ctx.moveTo(4, hy - 5.8); ctx.quadraticCurveTo(5, hy - 7.6, 6.4, hy - 7.4); ctx.stroke();
  // eye, nose, whiskers
  if (pose === 'sit' && o.sleep) { ctx.strokeStyle = '#1d1b24'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(6.8, hy - 1.4, 1.2, 0.1, Math.PI - 0.1); ctx.stroke(); }
  else { circ(ctx, 6.9, hy - 1.2, 1.3, '#1d1b24'); circ(ctx, 7.3, hy - 1.7, 0.45, '#fff'); }
  circ(ctx, 10.9, hy + 0.5, 0.95, '#e27a8a'); circ(ctx, 10.7, hy + 0.2, 0.3, 'rgba(255,255,255,0.7)');
  // a tiny mouth, and two little front teeth when there's something to nibble
  ctx.strokeStyle = 'rgba(120,60,50,0.6)'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(10.4, hy + 1.6); ctx.quadraticCurveTo(10.1, hy + 2.6, 9.3, hy + 2.5); ctx.stroke();
  if (pose === 'eat' || pose === 'wave') { ctx.fillStyle = '#fffaf0'; ctx.fillRect(9.6, hy + 2.3, 0.7, 1.1); ctx.fillRect(10.4, hy + 2.3, 0.7, 1.1); }
  ctx.strokeStyle = 'rgba(90,60,40,0.45)'; ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(10, hy + 1.2); ctx.lineTo(14.5, hy + 0.2); ctx.moveTo(10, hy + 1.8); ctx.lineTo(14.5, hy + 2.6); ctx.stroke();
  // little front paws
  if (pose === 'wave') ell(ctx, 9.5, hy - 5 - sn * 1.5, 1.8, 1.4, PAW);
  else if (pose === 'eat') { ell(ctx, 10.5, hy + 4.2, 2.4, 1.9, o.item || '#e8c465'); ell(ctx, 9, hy + 5, 1.6, 1.3, PAW); }
  else ell(ctx, 7.5, -5.5 - bob, 1.6, 1.3, PAW);
  if (o.hat) moleHat(ctx, o.hat, 3.5, hy - 6, o.hatCol);
}

/* ---------------- Umber the dragon ---------------- */
const SCALE = '#d9824a'; const SCALE_DK = '#b3603a'; const BELLY = '#f6dcb0'; const HORN = '#efe3c8'; const WING = '#c9713f'; const MEMB = '#eaa56d';
// Curled up on the hoard. (x, y) is the middle of the resting line; ~260 x 110 at s = 1.
// A flip-book of cached pictures over one breath (see sprites.js); the smoke rings are live.
const DRAGON_BOX = [-158, -130, 300, 152];
export function drawDragon(ctx, x, y, o = {}) {
  const s = o.s ?? 1; const t = o.t ?? 0; const awake = !!o.awake; const n = 10;
  let ph = t * (awake ? 1.6 : 0.8);
  let done = false;
  if (spritesOn()) {
    const f = frameOf(ph, n); ph = ((f + 0.5) / n) * TAU;
    done = sprite(ctx, `dragon|${awake ? 1 : 0}|${o.glasses ? 1 : 0}|${f}`, DRAGON_BOX, x, y, 1, s, 1, paintDragon, o, awake, ph);
  }
  if (!done) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); paintDragon(ctx, o, awake, ph); ctx.restore(); }
  // sleepy smoke rings
  if (!awake) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const hx = 88; const hy = -26;
    for (let k = 0; k < 3; k++) {
      const p = ((t * 0.3 + k / 3) % 1);
      ctx.strokeStyle = `rgba(230,225,215,${0.5 * (1 - p)})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(hx + 26 + p * 14, hy - 8 - p * 26, 3 + p * 5, 2 + p * 3, 0, 0, 7); ctx.stroke();
    }
    ctx.restore();
  }
}
// feet (resting line) at the origin, at breath phase ph. (He's a cached picture, so every scale,
// claw and whisker costs nothing once painted.)
const SCALE_LT = '#eba06a'; const CLAW = '#f6ecd6';
function paintDragon(ctx, o, awake, ph) {
  const breathe = Math.sin(ph) * 2;
  ell(ctx, 0, 2, 130, 10, 'rgba(0,0,0,0.25)');
  // tail curling round the front, with a pale stripe underneath and a row of little plates
  ctx.lineCap = 'round';
  const tail = () => { ctx.beginPath(); ctx.moveTo(-70, -30); ctx.bezierCurveTo(-140, -10, -120, 8, -40, 4); ctx.bezierCurveTo(10, 2, 40, 6, 70, -2); };
  ctx.strokeStyle = SCALE_DK; ctx.lineWidth = 20; tail(); ctx.stroke();
  ctx.strokeStyle = SCALE; ctx.lineWidth = 17; tail(); ctx.stroke();
  ctx.strokeStyle = 'rgba(246,220,176,0.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-60, -22); ctx.bezierCurveTo(-118, -4, -104, 9, -40, 8); ctx.bezierCurveTo(10, 6, 40, 9, 66, 4); ctx.stroke();
  ctx.strokeStyle = SCALE_DK; ctx.lineWidth = 2; ctx.setLineDash([3, 6]);
  ctx.beginPath(); ctx.moveTo(-70, -39); ctx.bezierCurveTo(-148, -16, -128, -2, -40, -5); ctx.stroke(); ctx.setLineDash([]);
  // tail tip: a spade with a shine
  ctx.fillStyle = SCALE_DK; ctx.beginPath(); ctx.moveTo(68, -9); ctx.quadraticCurveTo(84, -16, 90, -4 + Math.sin(ph + 1) * 2); ctx.quadraticCurveTo(82, 8, 70, 7); ctx.closePath(); ctx.fill();
  ell(ctx, 80, -5, 4, 1.6, 'rgba(255,230,190,0.35)', -0.3);
  // back leg tucked under
  ell(ctx, -58, -16, 22, 15, SCALE); ell(ctx, -58, -12, 16, 9, 'rgba(120,55,25,0.18)');
  [-74, -68, -62].forEach((cx) => { ell(ctx, cx, -3, 3, 2, SCALE_DK); ell(ctx, cx - 1.6, -2, 1.6, 1.1, CLAW); });
  // body: shading below, a sheen on top, and scales all over
  ell(ctx, -10, -40 - breathe * 0.5, 78, 40 + breathe * 0.5, SCALE);
  ell(ctx, -14, -24 - breathe * 0.3, 72, 22, 'rgba(120,55,25,0.16)');
  ell(ctx, -26, -62 - breathe * 0.5, 44, 12, 'rgba(255,220,180,0.18)');
  ctx.strokeStyle = 'rgba(120,60,30,0.32)'; ctx.lineWidth = 0.8;
  for (let r = 0; r < 6; r++) for (let k = 0; k < 11; k++) {
    const sx = -82 + k * 14 + (r % 2) * 7; const sy = -70 + r * 8 - Math.sin((k / 10) * Math.PI) * 8 - breathe * 0.4;
    if (Math.hypot((sx + 10) / 78, (sy + 40) / 40) > 0.92) continue;
    ctx.beginPath(); ctx.arc(sx, sy, 4, 0.15, Math.PI - 0.15); ctx.stroke();
  }
  [[-48, -52], [-20, -60], [6, -54], [-34, -40], [-62, -38]].forEach(([fx, fy], k) => circ(ctx, fx, fy - breathe * 0.4, 2.2 - (k % 2) * 0.6, 'rgba(255,214,160,0.35)'));
  // the soft belly, in curved plates
  ell(ctx, -4, -26 - breathe * 0.3, 60, 20, BELLY);
  ctx.strokeStyle = 'rgba(190,130,80,0.45)'; ctx.lineWidth = 1;
  for (let k = 0; k < 5; k++) { const yy = -40 + k * 6.5 - breathe * 0.3; const w = 52 - Math.abs(k - 2) * 6; ctx.beginPath(); ctx.moveTo(-4 - w, yy + 6); ctx.quadraticCurveTo(-4, yy - 2, -4 + w, yy + 6); ctx.stroke(); }
  // the folded wing: bones, veins, a little claw at the joint, a scalloped edge
  ctx.fillStyle = WING; ctx.beginPath(); ctx.moveTo(-40, -66); ctx.quadraticCurveTo(-10, -118 - breathe, 34, -96); ctx.quadraticCurveTo(24, -80, 30, -68); ctx.quadraticCurveTo(8, -72, -6, -60); ctx.closePath(); ctx.fill();
  ctx.fillStyle = MEMB; ctx.beginPath(); ctx.moveTo(-30, -66); ctx.quadraticCurveTo(-4, -104 - breathe, 26, -92); ctx.quadraticCurveTo(10, -76, -4, -64); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(179,96,58,0.55)'; ctx.lineWidth = 0.9; ctx.beginPath();
  for (const [ex, ey] of [[0, -100], [12, -96], [20, -86], [14, -76]]) { ctx.moveTo(-30, -66); ctx.quadraticCurveTo((ex - 30) / 2 + 4, (ey - 66) / 2 - 6, ex, ey - breathe * 0.6); }
  ctx.stroke();
  ctx.strokeStyle = SCALE_DK; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-36, -66); ctx.lineTo(8, -106 - breathe); ctx.moveTo(-18, -64); ctx.lineTo(24, -94); ctx.stroke();
  ctx.fillStyle = CLAW; ctx.beginPath(); ctx.moveTo(8, -106 - breathe); ctx.quadraticCurveTo(13, -113 - breathe, 17, -109 - breathe); ctx.quadraticCurveTo(12, -108 - breathe, 10, -103 - breathe); ctx.closePath(); ctx.fill();
  ctx.fillStyle = WING; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(30 - k * 7, -70 + k * 2.4, 3.6, 0, Math.PI); ctx.fill(); }
  // back spikes, two-toned
  for (let k = 0; k < 8; k++) {
    const sx = -78 + k * 13; const sy = -72 + Math.pow((k - 4) / 4, 2) * 18 - breathe * 0.4;
    ctx.fillStyle = SCALE_DK; ctx.beginPath(); ctx.moveTo(sx - 4, sy + 4); ctx.lineTo(sx + 1, sy - 7); ctx.lineTo(sx + 5, sy + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,200,150,0.35)'; ctx.beginPath(); ctx.moveTo(sx - 3, sy + 4); ctx.lineTo(sx + 1, sy - 6); ctx.lineTo(sx, sy + 4); ctx.closePath(); ctx.fill();
  }
  // front paw with knuckles and pale claws
  ell(ctx, 52, -6, 16, 8, SCALE); ell(ctx, 52, -3, 13, 4, 'rgba(120,55,25,0.16)');
  [44, 51, 58].forEach((cx) => { ell(ctx, cx, -1, 2.8, 2, CLAW); ell(ctx, cx + 1.4, 0.4, 1, 0.7, 'rgba(160,120,80,0.6)'); });
  // neck, with the belly running up it, and the head resting on the paw
  ctx.fillStyle = SCALE; ctx.beginPath(); ctx.moveTo(40, -60); ctx.quadraticCurveTo(76, -64, 86, -34); ctx.lineTo(60, -18); ctx.quadraticCurveTo(46, -34, 26, -40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(246,220,176,0.7)'; ctx.beginPath(); ctx.moveTo(34, -40); ctx.quadraticCurveTo(52, -34, 62, -20); ctx.lineTo(56, -18); ctx.quadraticCurveTo(46, -30, 30, -36); ctx.closePath(); ctx.fill();
  const hx = awake ? 92 : 88; const hy = awake ? -44 + Math.sin(ph * 0.5) * 1.5 : -26;
  drawDragonHead(ctx, hx, hy, { awake, glasses: o.glasses });
}

// Head facing right, centred on (x, y). Also used for the story portrait.
export function drawDragonHead(ctx, x, y, { awake = false, glasses = false } = {}) {
  ctx.save(); ctx.translate(x, y);
  // horns, ridged
  ctx.fillStyle = HORN;
  ctx.beginPath(); ctx.moveTo(-12, -14); ctx.quadraticCurveTo(-26, -30, -16, -38); ctx.quadraticCurveTo(-14, -26, -4, -18); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-2, -17); ctx.quadraticCurveTo(-8, -34, 4, -40); ctx.quadraticCurveTo(0, -28, 8, -18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(160,130,90,0.55)'; ctx.lineWidth = 0.7; ctx.beginPath();
  for (let k = 0; k < 3; k++) { ctx.moveTo(-15 + k * 1.5, -22 - k * 4); ctx.lineTo(-10 + k * 1.2, -20 - k * 4); ctx.moveTo(-3 + k * 1.6, -24 - k * 4); ctx.lineTo(3 + k * 0.8, -23 - k * 4); }
  ctx.stroke();
  // ear fin
  ctx.fillStyle = MEMB; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(-30, -14, -32, -4); ctx.quadraticCurveTo(-24, -2, -14, 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = SCALE_DK; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-15, -3); ctx.lineTo(-28, -7); ctx.moveTo(-15, 0); ctx.lineTo(-27, -2); ctx.stroke();
  // head and snout
  ell(ctx, 0, 0, 22, 18, SCALE);
  ell(ctx, 20, 6, 18, 11, SCALE);
  ell(ctx, 18, 10, 14, 6, BELLY);
  ell(ctx, -6, -8, 10, 6, 'rgba(255,255,255,0.12)');
  ell(ctx, 4, -12, 9, 3.4, SCALE_DK, -0.15); // a brow ridge
  ctx.strokeStyle = 'rgba(120,60,30,0.3)'; ctx.lineWidth = 0.7;
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-12 + k * 5, 6 + (k % 2) * 4, 2.6, 0.2, Math.PI - 0.2); ctx.stroke(); }
  // nostrils
  ell(ctx, 33, 1, 2, 1.3, SCALE_DK); ell(ctx, 29, 0, 1.6, 1.1, SCALE_DK);
  // cheek frill, two layers
  ctx.fillStyle = SCALE_DK; ctx.beginPath(); ctx.moveTo(-18, 4); ctx.lineTo(-30, 10); ctx.lineTo(-18, 12); ctx.lineTo(-28, 20); ctx.lineTo(-12, 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = SCALE_LT; ctx.beginPath(); ctx.moveTo(-16, 7); ctx.lineTo(-24, 11); ctx.lineTo(-16, 13); ctx.lineTo(-22, 18); ctx.lineTo(-11, 15); ctx.closePath(); ctx.fill();
  // whiskers (a dragon's barbels), drooping from the snout
  ctx.strokeStyle = '#b3603a'; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(30, 6); ctx.quadraticCurveTo(40, 14, 36, 24); ctx.moveTo(27, 8); ctx.quadraticCurveTo(32, 18, 26, 26);
  ctx.stroke();
  // eye
  if (awake) {
    ell(ctx, 4, -4, 6.5, 6, '#fff8e6'); circ(ctx, 5.5, -3.5, 4.4, '#d99a28'); circ(ctx, 5.5, -3.5, 3.2, '#e8b040'); ell(ctx, 5.5, -3.5, 1.4, 3.6, '#2b1b10');
    circ(ctx, 7, -5.5, 1.3, '#fff'); circ(ctx, 4, -1.6, 0.6, 'rgba(255,255,255,0.8)');
    ctx.strokeStyle = SCALE_DK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(4, -4, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else {
    ctx.strokeStyle = '#6b3a20'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(4, -4, 5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(-1.5, 1); ctx.moveTo(4, 0.6); ctx.lineTo(4, 2.6); ctx.moveTo(8, -1); ctx.lineTo(9.5, 1); ctx.stroke(); // lashes
  }
  if (glasses) {
    ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(5, -4, 8, 0, 7); ctx.moveTo(13, -4); ctx.lineTo(18, -2); ctx.stroke();
    ell(ctx, 2, -7, 2.6, 1.2, 'rgba(255,255,255,0.35)', -0.5);
  }
  // a small, polite smile, and a blush
  ctx.strokeStyle = '#8a4a2a'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(14, 12); ctx.quadraticCurveTo(24, 16, 34, 9); ctx.stroke();
  ell(ctx, 14, 6, 3.4, 2.2, 'rgba(240,120,100,0.4)');
  ctx.restore();
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
