// Festival decorations, drawn live on top of the normal library while a festival is on:
// lights along the roof, something festive in every window, a garden piece by the path,
// and a little sky mood (Ramadan evenings, New Year fireworks, spooky Halloween dusk).
import { L } from './layout.js';
import { glow } from './glow.js';
import { fillRR, ell, circ, star } from './draw.js';
import { art } from './sprites.js';

/* ---------------- small shapes ---------------- */
// Each decoration is a cached picture (see sprites.js), painted once and then stamped: a window
// full of lanterns on every floor would otherwise be hundreds of shapes a frame. Flames flicker
// on top, live.
function crescent(ctx, x, y, r, col) { art(ctx, 'f:cres|' + col, [-1.1, -1.2, 2.6, 2.3], paintCrescent, col, x, y, r); }
function paintCrescent(ctx, col) {
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.arc(0.45, -0.25, 0.85, 0, Math.PI * 2);
  ctx.fillStyle = col; ctx.fill('evenodd');
}
function heart(ctx, x, y, s, col) { art(ctx, 'f:heart|' + col, [-1.7, -1.3, 3.4, 2.5], paintHeart, col, x, y, s); }
function paintHeart(ctx, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 1.1);
  ctx.bezierCurveTo(-1.6, -0.2, -0.8, -1.3, 0, -0.4);
  ctx.bezierCurveTo(0.8, -1.3, 1.6, -0.2, 0, 1.1); ctx.fill();
}
function fanous(ctx, x, y, s, lit) { art(ctx, 'f:fanous|' + (lit ? 1 : 0), [-6, -5, 12, 23], paintFanous, lit, x, y, s); }
function paintFanous(ctx, lit) {
  ctx.fillStyle = '#c9a557'; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(0, -4); ctx.lineTo(3, 0); ctx.fill();
  fillRR(ctx, -5, 0, 10, 12, 2, lit ? '#ffd26a' : '#f2c14e');
  ctx.fillStyle = 'rgba(200,80,40,0.75)'; ctx.fillRect(-3.5, 2, 2.2, 8); ctx.fillStyle = 'rgba(40,140,110,0.75)'; ctx.fillRect(1.3, 2, 2.2, 8);
  ctx.fillStyle = '#c9a557'; ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(0, 17); ctx.lineTo(5, 12); ctx.fill();
}
// painted at r = 6 and scaled
function pumpkin(ctx, x, y, r, face = true, lit = false) { art(ctx, `f:pumpkin|${face ? 1 : 0}${lit ? 1 : 0}`, [-8, -10, 16, 17], paintPumpkin, face ? (lit ? 2 : 1) : 0, x, y, r / 6); }
function paintPumpkin(ctx, a) {
  const r = 6; const face = a > 0; const lit = a > 1;
  ell(ctx, 0, 0, r * 1.2, r, '#f28c28'); ctx.strokeStyle = '#c96a16'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.45, r, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#5b7f4d'; ctx.fillRect(-1, -r - 3, 2, 3.4);
  if (face) { ctx.fillStyle = lit ? '#ffe07a' : '#6b3a10'; ctx.beginPath(); ctx.moveTo(-r * 0.55, -r * 0.2); ctx.lineTo(-r * 0.3, -r * 0.5); ctx.lineTo(-r * 0.15, -r * 0.15); ctx.fill(); ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.2); ctx.lineTo(r * 0.3, -r * 0.5); ctx.lineTo(r * 0.15, -r * 0.15); ctx.fill(); ctx.fillRect(-r * 0.5, r * 0.25, r, r * 0.18); }
}
// Round red paper lantern with a gold cap and tassel (Lunar New Year).
function redLantern(ctx, x, y, s, lit) { art(ctx, 'f:lantern|' + (lit ? 1 : 0), [-8, -2, 16, 21], paintRedLantern, lit, x, y, s); }
function paintRedLantern(ctx, lit) {
  fillRR(ctx, -3, -1, 6, 2.4, 1, '#f2c14e');
  ell(ctx, 0, 6, 7, 6, lit ? '#ff4a3a' : '#d62828');
  ctx.strokeStyle = 'rgba(120,20,20,0.55)'; ctx.lineWidth = 0.6;
  ctx.beginPath(); [-4, 0, 4].forEach((dx) => { ctx.moveTo(dx * 0.4 + (Math.abs(dx) > 0 ? 4.5 : 1.2), 6); ctx.ellipse(dx * 0.4, 6, Math.abs(dx) > 0 ? 4.5 : 1.2, 6, 0, 0, Math.PI * 2); }); ctx.stroke();
  fillRR(ctx, -3, 11, 6, 2.2, 1, '#f2c14e');
  ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, 13); ctx.lineTo(0, 18); ctx.stroke();
}
// Little clay oil lamp with a flickering flame (Diwali).
function diya(ctx, x, y, s, t, k = 0) {
  art(ctx, 'f:diya', [-6, -4, 12, 7], paintDiya, 0, x, y, s);
  const fl = 1 + Math.sin(t * 12 + k * 2.1) * 0.18;
  ell(ctx, x + 2.5 * s, y - 6 * fl * s, 1.5 * s, 3 * fl * s, '#ffcf5a'); ell(ctx, x + 2.5 * s, y - 5.2 * fl * s, 0.7 * s, 1.6 * fl * s, '#fff6d0');
}
function paintDiya(ctx) {
  ctx.fillStyle = '#b5523b'; ctx.beginPath(); ctx.moveTo(-5, -2); ctx.quadraticCurveTo(0, 5, 5, -2); ctx.lineTo(3.5, -2.8); ctx.lineTo(-5, -2.8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8913a'; ctx.fillRect(-4.6, -3.4, 9, 1);
}
function egg(ctx, x, y, s, base, band) { art(ctx, `f:egg|${base}|${band}`, [-3.6, -4.6, 7.2, 9.2], paintEgg, [base, band], x, y, s); }
function paintEgg(ctx, [base, band]) {
  ell(ctx, 0, 0, 3.2, 4.2, base);
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 3.2, 4.2, 0, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = band; ctx.fillRect(-4, -0.9, 8, 1.6);
  for (let k = -1; k <= 1; k++) circ(ctx, k * 1.6, -2.4, 0.55, band);
  ctx.restore();
}
// Nine-branched menorah; `lit` candles (plus the shamash) burn.
function menorah(ctx, x, y, s, lit, t) {
  art(ctx, 'f:menorah', [-12, -18, 24, 20], paintMenorah, 0, x, y, s);
  const xs = [-10.4, -7.8, -5.2, -2.6, 0, 2.6, 5.2, 7.8, 10.4];
  ctx.fillStyle = '#ffcf5a'; ctx.beginPath(); // every flame in one shape
  xs.forEach((cx, k) => {
    const shamash = k === 4; const cy = shamash ? -13 : -10;
    const n = k < 4 ? 8 - k : k - 4; // light from the right, one more each night
    if (shamash || n <= lit) { const fl = 1 + Math.sin(t * 11 + k) * 0.2; ctx.moveTo(x + (cx + 0.9) * s, y + (cy - 5.5 * fl) * s); ctx.ellipse(x + cx * s, y + (cy - 5.5 * fl) * s, 0.9 * s, 1.7 * fl * s, 0, 0, Math.PI * 2); }
  });
  ctx.fill();
}
function paintMenorah(ctx) {
  ctx.fillStyle = '#c9a227'; ctx.fillRect(-1, -10, 2, 10); fillRR(ctx, -5, -1, 10, 2, 1, '#c9a227');
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1;
  for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(0, -10, k * 2.6, 0, Math.PI); ctx.stroke(); }
  [-10.4, -7.8, -5.2, -2.6, 0, 2.6, 5.2, 7.8, 10.4].forEach((cx, k) => { const cy = k === 4 ? -13 : -10; ctx.fillStyle = '#e8f0ff'; ctx.fillRect(cx - 0.6, cy - 4, 1.2, 4); });
}
function dreidel(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3) * 0.25);
  art(ctx, 'f:dreidel', [-5, -11, 10, 17], paintDreidel, 0, 0, 0, s);
  ctx.restore();
}
function paintDreidel(ctx) {
  ctx.fillStyle = '#3a6ea5'; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9ec5f0'; ctx.fillRect(-0.8, -10, 1.6, 4); ctx.fillStyle = '#f2d27a'; ctx.fillRect(-2, -3.5, 4, 1);
}
// Colourful rangoli on the ground, seen at a slight angle (painted at r = 14).
function rangoli(ctx, x, y, r) { art(ctx, 'f:rangoli', [-15, -7, 30, 14], paintRangoli, 0, x, y, r / 14); }
function paintRangoli(ctx) {
  const r = 14; ctx.scale(1, 0.42);
  const rings = ['#e0405f', '#ff9f1c', '#f2c14e', '#9b5de5', '#3fa36b'];
  rings.forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, r * (1 - k * 0.18), 0, Math.PI * 2); ctx.fill(); });
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ell(ctx, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.2, r * 0.09, '#fff6e0', a); }
  circ(ctx, 0, 0, r * 0.12, '#fff6e0');
}
// A small round light bulb (strings of fairy lights, fireworks sparks).
function bulb(ctx, x, y, r, col) { art(ctx, 'f:bulb|' + col, [-1.1, -1.1, 2.2, 2.2], paintBulb, col, x, y, r); }
function paintBulb(ctx, col) { circ(ctx, 0, 0, 1, col); }
function bulbOval(ctx, x, y, rx, ry, col) { art(ctx, 'f:oval|' + col, [-1.1, -1.6, 2.2, 3.2], paintOval, col, x, y, rx); void ry; }
function paintOval(ctx, col) { ell(ctx, 0, 0, 1, 1.5, col); }
// Real festivals follow the calendar; Mouse Calendar ones are short. Either way: 0 → 1 through it.
const festProgress = (fest) => (fest.start && fest.end ? Math.max(0, Math.min(1, (Date.now() - fest.start) / (fest.end - fest.start))) : 0.5);
// What else changes a festival's decorations (for their cached pictures): the candles lit so far.
export const festKey = (fest) => (fest.id === 'hanukkah' ? 1 + Math.floor(festProgress(fest) * 8) : 0);

// painted at w = 8 and scaled
function gift(ctx, x, y, w, col, ribbon) { art(ctx, `f:gift|${col}|${ribbon}`, [-6, -12, 12, 13], paintGift, [col, ribbon], x, y, w / 8); }
function paintGift(ctx, [col, ribbon]) {
  const w = 8;
  fillRR(ctx, -w / 2, -w, w, w, 1, col); ctx.fillStyle = ribbon; ctx.fillRect(-1, -w, 2, w); ctx.fillRect(-w / 2, -w * 0.55, w, 2);
  ell(ctx, -2.5, -w - 1.5, 2.6, 1.6, ribbon, -0.4); ell(ctx, 2.5, -w - 1.5, 2.6, 1.6, ribbon, 0.4);
}

/* ---------------- inside every floor: the window ---------------- */
export function drawFestRoom(ctx, fest, t, tod) {
  const wn = L.window; const cx = wn.x + wn.w / 2; const sill = wn.y + wn.h - 1;
  const lit = tod.dark > 0.3;
  const lights = (cols) => { for (let k = 0; k < 9; k++) { const x = wn.x - 4 + k * 7.5; const y = wn.y - 2 + Math.sin((k / 8) * Math.PI) * 5; const on = 0.55 + 0.45 * Math.sin(t * 3 + k * 1.9); ctx.globalAlpha = on; bulb(ctx, x, y, 1.6, cols[k % cols.length]); ctx.globalAlpha = 1; } };
  switch (fest.id) {
    case 'christmas':
      circ(ctx, cx, wn.y + 30, 11, '#2e8b57'); circ(ctx, cx, wn.y + 30, 6, 'rgba(0,0,0,0)');
      for (let a = 0; a < Math.PI * 2; a += 0.5) ell(ctx, cx + Math.cos(a) * 9, wn.y + 30 + Math.sin(a) * 9, 3, 1.5, '#3fa36b', a + 1.2);
      [[-6, 5], [5, 7], [7, -4], [-7, -5]].forEach(([dx, dy]) => circ(ctx, cx + dx, wn.y + 30 + dy, 1.4, '#e0404f'));
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(cx, wn.y + 39); ctx.lineTo(cx - 4, wn.y + 44); ctx.lineTo(cx, wn.y + 41); ctx.lineTo(cx + 4, wn.y + 44); ctx.fill();
      fillRR(ctx, wn.x + 6, sill - 9, 3.5, 8, 1, '#f7efdc'); ell(ctx, wn.x + 7.75, sill - 11, 1.2, 2.2, '#ffcf5a');
      lights(fest.colors); break;
    case 'ramadan':
      crescent(ctx, cx + 8, wn.y + 22, 7, '#f2d27a'); star(ctx, cx - 8, wn.y + 18, 2.4, '#f2d27a'); star(ctx, cx - 2, wn.y + 30, 1.6, '#f2d27a');
      fanous(ctx, wn.x + 9, sill - 18, 0.95, lit); fanous(ctx, wn.x + wn.w - 9, sill - 18, 0.95, lit);
      if (lit) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; [wn.x + 9, wn.x + wn.w - 9].forEach((x) => glow(ctx, x, sill - 12, 16, '255,200,110', 0.45)); ctx.restore(); }
      break;
    case 'eid':
      lights(fest.colors); star(ctx, cx, wn.y + 24, 6, '#f2d27a'); crescent(ctx, cx - 12, wn.y + 36, 4, '#f2d27a');
      gift(ctx, wn.x + 10, sill, 8, '#7cc4b0', '#f2d27a'); gift(ctx, wn.x + wn.w - 10, sill, 7, '#e8a0bf', '#ffffff'); break;
    case 'newyear':
      lights(fest.colors); ['#f2d27a', '#9ec5f0', '#e8a0bf'].forEach((c, k) => { const x = wn.x + 12 + k * 14; ctx.strokeStyle = c; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, wn.y + 6); for (let y = 6; y < 36; y += 3) ctx.lineTo(x + Math.sin(y * 0.6 + k) * 2, wn.y + y); ctx.stroke(); });
      fillRR(ctx, wn.x + wn.w - 14, sill - 10, 8, 10, 1, '#2b2430'); ctx.fillStyle = '#f2d27a'; ctx.fillRect(wn.x + wn.w - 11, sill - 14, 2, 4); break;
    case 'halloween':
      pumpkin(ctx, wn.x + 12, sill - 5, 6, true, lit); pumpkin(ctx, wn.x + wn.w - 11, sill - 4, 4.5, true, lit);
      [[cx - 8, wn.y + 20], [cx + 10, wn.y + 32]].forEach(([x, y], k) => { const f = Math.sin(t * 8 + k) * 2; ctx.fillStyle = '#2b2320'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 4, y - 3 - f, x - 8, y + 1); ctx.quadraticCurveTo(x - 4, y - 1, x, y + 2); ctx.quadraticCurveTo(x + 4, y - 1, x + 8, y + 1); ctx.quadraticCurveTo(x + 4, y - 3 - f, x, y); ctx.fill(); });
      ctx.strokeStyle = 'rgba(240,240,250,0.6)'; ctx.lineWidth = 0.5; for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(wn.x + wn.w, wn.y + wn.w / 2, k * 5, Math.PI * 0.55, Math.PI); ctx.stroke(); } break;
    case 'valentine':
      [[cx - 10, wn.y + 22, 3.4], [cx + 8, wn.y + 18, 2.8], [cx, wn.y + 34, 3.8], [cx - 14, wn.y + 40, 2.2], [cx + 14, wn.y + 38, 2.4]].forEach(([x, y, sz], k) => heart(ctx, x, y + Math.sin(t * 2 + k) * 0.6, sz, k % 2 ? '#f7a8c4' : '#e0405f'));
      fillRR(ctx, wn.x + wn.w - 13, sill - 9, 6, 9, 2, '#9ec5f0'); [[-2, -14], [1, -16], [3, -13]].forEach(([dx, dy]) => circ(ctx, wn.x + wn.w - 10 + dx, sill + dy, 1.9, '#e0405f')); break;
    case 'bookweek':
      [['#4f7cac', 11], ['#e9b949', 12], ['#c0504d', 10], ['#6a9f58', 12]].forEach(([c, w], k) => fillRR(ctx, wn.x + 6 + (k % 2), sill - 3.2 - k * 3.2, w, 3, 0.8, c));
      lights(fest.colors); break;
    case 'anniversary':
      ['#f28b82', '#ffd24a', '#9ec5f0'].forEach((c, k) => { const x = wn.x + 12 + k * 14; const y = wn.y + 16 + Math.sin(t * 1.5 + k) * 1.5; ctx.strokeStyle = 'rgba(80,60,40,0.5)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.lineTo(x + 1, sill - 2); ctx.stroke(); ell(ctx, x, y, 5, 6.5, c); ell(ctx, x - 1.6, y - 2.4, 1.2, 2, 'rgba(255,255,255,0.5)'); }); break;
    case 'summer':
      fillRR(ctx, wn.x + 8, sill - 7, 6, 7, 1.5, '#9ec5f0'); [[-2, -18], [2, -21]].forEach(([dx, dy]) => { ctx.strokeStyle = '#4f8a44'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(wn.x + 11, sill - 7); ctx.lineTo(wn.x + 11 + dx, sill + dy + 3); ctx.stroke(); for (let p = 0; p < 8; p++) { const a = (p / 8) * Math.PI * 2; ell(ctx, wn.x + 11 + dx + Math.cos(a) * 2.8, sill + dy + Math.sin(a) * 2.8, 1.6, 0.9, '#ffd24a', a); } circ(ctx, wn.x + 11 + dx, sill + dy, 1.4, '#7a4b2e'); });
      lights(fest.colors); break;
    case 'autumn':
      pumpkin(ctx, wn.x + 11, sill - 4, 4.5, false); ell(ctx, wn.x + wn.w - 12, sill - 2.5, 5, 2.5, '#d9632d', 0.3); ell(ctx, wn.x + wn.w - 16, sill - 2, 3.5, 1.8, '#f2c14e', -0.4);
      [[wn.x + 16, wn.y + 12], [wn.x + 36, wn.y + 20]].forEach(([x, y], k) => ell(ctx, x + Math.sin(t + k) * 2, y + ((t * 6 + k * 20) % 30), 2.6, 1.5, k ? '#e8913a' : '#d9632d', t + k)); break;
    case 'lunar':
      [wn.x + 12, wn.x + wn.w - 12].forEach((x, k) => { const sw = Math.sin(t * 1.6 + k) * 1.5; ctx.strokeStyle = 'rgba(60,40,30,0.7)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, wn.y + 4); ctx.lineTo(x + sw, wn.y + 12); ctx.stroke(); redLantern(ctx, x + sw, wn.y + 12, 1, lit); });
      // firecracker string
      ctx.fillStyle = '#d62828'; ctx.beginPath(); for (let k = 0; k < 6; k++) ctx.rect(cx - 1.5 + (k % 2 ? 1.5 : -1.5), wn.y + 18 + k * 4, 3, 3.4); ctx.fill();
      if (lit) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; [wn.x + 12, wn.x + wn.w - 12].forEach((x) => glow(ctx, x, wn.y + 18, 16, '255,90,60', 0.4)); ctx.restore(); }
      break;
    case 'diwali':
      // marigold garland across the top and diyas on the sill
      for (let k = 0; k < 11; k++) { const x = wn.x - 4 + k * 6; const y = wn.y + 2 + Math.sin((k / 10) * Math.PI) * 7; bulb(ctx, x, y, 2.1, k % 2 ? '#ff9f1c' : '#f2c14e'); }
      [wn.x + 8, wn.x + 20, wn.x + wn.w - 20, wn.x + wn.w - 8].forEach((x, k) => diya(ctx, x, sill - 1, 0.85, t, k));
      if (lit) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, cx, sill - 6, 36, '255,190,90', 0.4, -Infinity, sill + 2); ctx.restore(); }
      break;
    case 'hanukkah':
      menorah(ctx, cx, sill - 1, 0.95, 1 + Math.floor(festProgress(fest) * 8), t);
      dreidel(ctx, wn.x + 9, sill - 4, 0.8, t);
      lights(fest.colors); break;
    case 'egghunt':
      egg(ctx, wn.x + 10, sill - 4.5, 1, '#f7a8c4', '#ffffff'); egg(ctx, wn.x + 18, sill - 4, 0.9, '#a3d9a5', '#ffe066'); egg(ctx, wn.x + wn.w - 11, sill - 4.5, 1, '#9ec5f0', '#d4b3f0');
      ['#f7a8c4', '#ffe066', '#a3d9a5'].forEach((c, k) => { const x = wn.x + 14 + k * 12; const y = wn.y + 12 + Math.sin(t * 1.4 + k) * 1.5; ctx.strokeStyle = 'rgba(80,60,40,0.5)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, wn.y); ctx.lineTo(x, y - 4); ctx.stroke(); egg(ctx, x, y, 0.8, c, '#ffffff'); });
      break;
    default: break;
  }
}

/* ---------------- on the building: lights along the roof ---------------- */
export function drawFestRoof(ctx, fest, roof, t, tod) {
  const pts = roof?.eaves; if (!pts || pts.length < 2) return;
  const cols = fest.colors;
  // the string of lights (or lanterns for Ramadan, little pumpkins for Halloween)
  ctx.strokeStyle = 'rgba(60,45,35,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath();
  pts.forEach(([x, y], k) => { const yy = y + 5 + (k % 2 ? 2 : 0); if (k) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); }); ctx.stroke();
  pts.forEach(([x, y], k) => {
    const yy = y + 6 + (k % 2 ? 2 : 0);
    if (fest.id === 'ramadan' && k % 3 === 0) { ctx.strokeStyle = 'rgba(60,45,35,0.8)'; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy + 4); ctx.stroke(); fanous(ctx, x, yy + 8, 0.7, tod.dark > 0.3); return; }
    if (fest.id === 'halloween' && k % 4 === 0) { pumpkin(ctx, x, yy + 5, 3.4, true, tod.dark > 0.3); return; }
    if (fest.id === 'lunar' && k % 3 === 0) { ctx.strokeStyle = 'rgba(60,45,35,0.8)'; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy + 3); ctx.stroke(); redLantern(ctx, x, yy + 3, 0.6, tod.dark > 0.3); return; }
    if (fest.id === 'diwali' && k % 3 === 0) { diya(ctx, x, yy + 5, 0.6, t, k); return; }
    if (fest.id === 'egghunt' && k % 4 === 0) { egg(ctx, x, yy + 5, 0.7, cols[(k >> 2) % cols.length], '#ffffff'); return; }
    const on = 0.5 + 0.5 * Math.sin(t * 3 + k * 1.7);
    ctx.globalAlpha = 0.45 + on * 0.55; bulbOval(ctx, x, yy + 1.5, 1.6, 2.4, cols[k % cols.length]); ctx.globalAlpha = 1;
    if (tod.dark > 0.3 && k % 2 === 0) { const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, yy + 1.5, 7, '255,230,160', 0.35 * on); ctx.globalCompositeOperation = op; }
  });
  // an emblem on the sign
  const sx = (pts[0][0] + pts[pts.length - 1][0]) / 2 - 104; const sy = pts[0][1] - 26;
  switch (fest.id) {
    case 'ramadan': case 'eid': crescent(ctx, sx, sy, 7, '#f2d27a'); star(ctx, sx + 7, sy - 5, 2.2, '#f2d27a'); break;
    case 'christmas': circ(ctx, sx, sy, 7, '#2e8b57'); circ(ctx, sx, sy, 3.5, '#fff3dc'); circ(ctx, sx + 3, sy + 5, 1.5, '#e0404f'); break;
    case 'halloween': pumpkin(ctx, sx, sy + 2, 6, true, tod.dark > 0.3); break;
    case 'valentine': heart(ctx, sx, sy, 5, '#e0405f'); break;
    case 'newyear': star(ctx, sx, sy, 7, '#f2d27a'); break;
    case 'anniversary': ell(ctx, sx, sy - 2, 5, 6.5, '#f28b82'); ctx.strokeStyle = 'rgba(80,60,40,0.6)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(sx, sy + 4); ctx.lineTo(sx + 2, sy + 12); ctx.stroke(); break;
    case 'bookweek': fillRR(ctx, sx - 6, sy - 5, 12, 10, 1, '#4f7cac'); ctx.fillStyle = '#fff3dc'; ctx.fillRect(sx - 0.6, sy - 5, 1.2, 10); break;
    case 'summer': circ(ctx, sx, sy, 5, '#ffd24a'); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + t * 0.5; ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * 6.5, sy + Math.sin(a) * 6.5); ctx.lineTo(sx + Math.cos(a) * 9, sy + Math.sin(a) * 9); ctx.stroke(); } break;
    case 'autumn': ell(ctx, sx, sy, 6, 3.4, '#d9632d', 0.5); ell(ctx, sx + 3, sy + 2, 4.5, 2.6, '#f2c14e', -0.3); break;
    case 'lunar': redLantern(ctx, sx, sy - 7, 0.9, tod.dark > 0.3); break;
    case 'diwali': diya(ctx, sx, sy + 3, 1.2, t); break;
    case 'hanukkah': menorah(ctx, sx, sy + 5, 0.55, 1 + Math.floor(festProgress(fest) * 8), t); break;
    case 'egghunt': egg(ctx, sx, sy, 1.5, '#f7a8c4', '#ffffff'); break;
    default: break;
  }
}

/* ---------------- in the garden, just right of the path (x 250..282, y 48..90) ---------------- */
export function drawFestGarden(ctx, fest, t, tod, tint) {
  const x = 232; const y = 88; const lit = tod.dark > 0.3; // left of the lift house (x 271..319)
  switch (fest.id) {
    case 'christmas': {
      ctx.fillStyle = tint('#6b4128'); ctx.fillRect(x - 2, y - 6, 4, 6);
      [[16, 0], [13, 10], [10, 19], [7, 27]].forEach(([w, dy]) => { ctx.fillStyle = tint('#2e7d4f'); ctx.beginPath(); ctx.moveTo(x - w, y - 6 - dy); ctx.lineTo(x, y - 20 - dy); ctx.lineTo(x + w, y - 6 - dy); ctx.closePath(); ctx.fill(); });
      for (let k = 0; k < 9; k++) { const a = k * 2.3; const ry = y - 10 - (k % 4) * 9; circ(ctx, x + Math.sin(a) * (12 - (k % 4) * 3), ry, 1.4, ['#e0404f', '#f2c14e', '#9ec5f0'][k % 3]); }
      star(ctx, x, y - 48, 4, '#f2d27a'); gift(ctx, x - 12, y, 7, '#c0392b', '#f2d27a'); gift(ctx, x + 12, y, 6, '#4f7cac', '#ffffff'); break;
    }
    case 'ramadan': {
      ctx.strokeStyle = tint('#8a6a4a'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x - 14, y - 38); ctx.quadraticCurveTo(x, y - 50, x + 14, y - 38); ctx.lineTo(x + 14, y); ctx.stroke();
      [x - 8, x, x + 8].forEach((lx, k) => { ctx.strokeStyle = tint('#8a6a4a'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(lx, y - 42 + Math.abs(k - 1) * 3); ctx.lineTo(lx, y - 36 + Math.abs(k - 1) * 3); ctx.stroke(); fanous(ctx, lx, y - 32 + Math.abs(k - 1) * 3, 0.6, lit); });
      crescent(ctx, x + 4, y - 56, 5, '#f2d27a'); break;
    }
    case 'eid': gift(ctx, x - 10, y, 12, '#7cc4b0', '#f2d27a'); gift(ctx, x + 6, y, 10, '#e8a0bf', '#ffffff'); gift(ctx, x - 3, y - 12, 8, '#f2d27a', '#c0504d'); star(ctx, x - 3, y - 28, 3.5, '#f2d27a'); break;
    case 'newyear': fillRR(ctx, x - 13, y - 34, 26, 18, 2, tint('#2b2430')); ctx.fillStyle = '#f2d27a'; ctx.font = '700 7px "Fredoka",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(new Date().getFullYear() + (new Date().getMonth() === 11 ? 1 : 0)), x, y - 25); ctx.fillStyle = tint('#6b4128'); ctx.fillRect(x - 1, y - 16, 2, 16); break;
    case 'halloween': pumpkin(ctx, x - 8, y - 5, 6, true, lit); pumpkin(ctx, x + 7, y - 4, 4.6, true, lit); pumpkin(ctx, x, y - 13, 4, false);
      { const gy = y - 38 + Math.sin(t * 2) * 3; ctx.fillStyle = 'rgba(250,250,255,0.9)'; ctx.beginPath(); ctx.arc(x + 4, gy, 6, Math.PI, 0); ctx.lineTo(x + 10, gy + 9); ctx.lineTo(x + 7, gy + 7); ctx.lineTo(x + 4, gy + 9); ctx.lineTo(x + 1, gy + 7); ctx.lineTo(x - 2, gy + 9); ctx.closePath(); ctx.fill(); circ(ctx, x + 2, gy - 1, 0.9, '#2b2320'); circ(ctx, x + 6, gy - 1, 0.9, '#2b2320'); } break;
    case 'valentine': ctx.strokeStyle = tint('#e0405f'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 12, y - 26); ctx.quadraticCurveTo(x, y - 38, x + 12, y - 26); ctx.lineTo(x + 12, y); ctx.stroke(); [[x - 12, y - 18], [x - 6, y - 32], [x + 6, y - 32], [x + 12, y - 18], [x, y - 35]].forEach(([hx, hy], k) => heart(ctx, hx, hy, 2.6, k % 2 ? '#f7a8c4' : '#e0405f')); break;
    case 'bookweek': [['#4f7cac', 22], ['#e9b949', 18], ['#c0504d', 20], ['#6a9f58', 16], ['#9b6fb0', 18], ['#e07b39', 14]].forEach(([c, w], k) => fillRR(ctx, x - w / 2 + (k % 2 ? 2 : -2), y - 5 - k * 5, w, 4.6, 1, tint(c))); star(ctx, x, y - 36, 3, '#f2d27a'); break;
    case 'anniversary': fillRR(ctx, x - 12, y - 12, 24, 12, 2, tint('#f7c9d6')); fillRR(ctx, x - 12, y - 13, 24, 3, 1, tint('#fff3dc')); fillRR(ctx, x - 8, y - 22, 16, 9, 2, tint('#f7c9d6')); [-4, 0, 4].forEach((dx) => { ctx.fillStyle = '#9ec5f0'; ctx.fillRect(x + dx - 0.6, y - 27, 1.2, 5); ell(ctx, x + dx, y - 28.5, 0.9, 1.6, '#ffcf5a'); }); break;
    case 'summer': fillRR(ctx, x - 13, y - 14, 26, 14, 1, tint('#f7efe0')); ctx.fillStyle = tint('#f2c14e'); for (let k = 0; k < 4; k++) ctx.fillRect(x - 13 + k * 7, y - 30, 3.5, 16); ctx.fillStyle = tint('#e0604a'); ctx.beginPath(); ctx.moveTo(x - 16, y - 30); ctx.lineTo(x + 16, y - 30); ctx.lineTo(x + 13, y - 36); ctx.lineTo(x - 13, y - 36); ctx.fill(); ctx.fillStyle = '#c0504d'; ctx.font = '700 5px "Fredoka",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('LEMONADE', x, y - 6); break;
    case 'autumn': ell(ctx, x, y - 3, 13, 5, tint('#9a6b45')); ell(ctx, x, y - 6, 11, 3.4, tint('#b88352')); [[-6, '#f28c28'], [0, '#c0504d'], [6, '#f2c14e']].forEach(([dx, c]) => circ(ctx, x + dx, y - 9, 3.6, tint(c))); ctx.strokeStyle = tint('#8a5a3a'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y - 6, 12, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); break;
    case 'lunar': {
      ctx.strokeStyle = tint('#8a3a2a'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x - 14, y - 40); ctx.moveTo(x + 14, y); ctx.lineTo(x + 14, y - 40); ctx.stroke();
      fillRR(ctx, x - 17, y - 44, 34, 4, 1.5, tint('#d62828'));
      [x - 8, x, x + 8].forEach((lx, k) => { const sw = Math.sin(t * 1.5 + k) * 1.2; ctx.strokeStyle = tint('#8a3a2a'); ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(lx, y - 40); ctx.lineTo(lx + sw, y - 36); ctx.stroke(); redLantern(ctx, lx + sw, y - 36, 0.55, lit); });
      for (let k = 0; k < 5; k++) fillRR(ctx, x + 18 + (k % 2 ? 1.5 : -1.5), y - 28 + k * 4, 3, 3.2, 0.8, '#d62828');
      break;
    }
    case 'diwali':
      rangoli(ctx, x, y - 4, 14);
      [[-16, -1], [16, -1], [0, -12], [-11, -9], [11, -9]].forEach(([dx, dy], k) => diya(ctx, x + dx, y + dy, 0.8, t, k));
      break;
    case 'hanukkah':
      ctx.fillStyle = tint('#6b4128'); ctx.fillRect(x - 1.5, y - 18, 3, 18); fillRR(ctx, x - 8, y - 2, 16, 3, 1, tint('#6b4128'));
      menorah(ctx, x, y - 18, 1.3, 1 + Math.floor(festProgress(fest) * 8), t);
      dreidel(ctx, x + 18, y - 4, 1.1, t);
      break;
    case 'egghunt':
      // basket of eggs + a few hidden in the grass
      ctx.fillStyle = tint('#b88352'); ctx.beginPath(); ctx.moveTo(x - 11, y - 12); ctx.lineTo(x + 11, y - 12); ctx.lineTo(x + 8, y); ctx.lineTo(x - 8, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = tint('#8a5a3a'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y - 12, 10, Math.PI, 0); ctx.stroke();
      [['#f7a8c4', -5], ['#a3d9a5', 0], ['#9ec5f0', 5]].forEach(([c, dx]) => egg(ctx, x + dx, y - 14, 1, c, '#ffffff'));
      [[-24, 2, '#ffe066'], [22, -6, '#d4b3f0'], [30, 4, '#f7a8c4']].forEach(([dx, dy, c]) => egg(ctx, x + dx, y + dy, 0.9, c, '#ffffff'));
      break;
    default: break;
  }
}

/* ---------------- sky mood (screen space, just above the sky) ---------------- */
export class FestSky {
  constructor() { this.fireworks = []; this.nextFw = 1; }
  draw(ctx, v, fest, tod, dt) {
    if (fest.id === 'ramadan' || fest.id === 'eid') {
      // warm golden evenings
      const a = 0.12 * (1 - Math.abs(tod.phase - 0.6) * 3);
      if (a > 0) { ctx.fillStyle = `rgba(255,170,90,${a})`; ctx.fillRect(0, 0, v.W, v.H); }
    }
    if (fest.id === 'halloween' && tod.dark > 0.2) { ctx.fillStyle = `rgba(90,40,120,${0.12 * tod.dark})`; ctx.fillRect(0, 0, v.W, v.H); }
    if (fest.id === 'valentine') { ctx.fillStyle = 'rgba(255,170,200,0.06)'; ctx.fillRect(0, 0, v.W, v.H); }
    if (fest.id === 'diwali') {
      // a warm glow of a thousand little lamps at dusk
      const a = 0.1 * Math.min(1, tod.dark * 2);
      if (a > 0) { ctx.fillStyle = `rgba(255,160,60,${a})`; ctx.fillRect(0, 0, v.W, v.H); }
    }
    if (fest.id === 'lunar') { ctx.fillStyle = 'rgba(214,40,40,0.04)'; ctx.fillRect(0, 0, v.W, v.H); }
    if ((fest.id === 'newyear' || fest.id === 'eid' || fest.id === 'anniversary' || fest.id === 'lunar' || fest.id === 'diwali') && tod.dark > 0.4) {
      this.nextFw -= dt;
      if (this.nextFw <= 0) { this.nextFw = 0.8 + Math.random() * 1.6; this.fireworks.push({ x: v.W * (0.15 + Math.random() * 0.7), y: v.H * (0.1 + Math.random() * 0.25), t: 0, col: fest.colors[Math.floor(Math.random() * fest.colors.length)] }); }
      this.fireworks = this.fireworks.filter((f) => (f.t += dt) < 1.6);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const f of this.fireworks) {
        const r = 8 + f.t * 34; const a = Math.max(0, 1 - f.t / 1.6);
        ctx.fillStyle = f.col; ctx.globalAlpha = a;
        for (let k = 0; k < 14; k++) { const ang = (k / 14) * Math.PI * 2; bulb(ctx, f.x + Math.cos(ang) * r, f.y + Math.sin(ang) * r + f.t * f.t * 6, 1.6, f.col); }
      }
      ctx.restore();
    }
  }
}
