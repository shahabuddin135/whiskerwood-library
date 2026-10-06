// Canvas drawing primitives, the mouse character and small props.
import { sprite, spritesOn, spriteNearFrame } from './sprites.js';

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function fillRR(ctx, x, y, w, h, r, fill) { rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
export function ell(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}
export function circ(ctx, x, y, r, fill) { ell(ctx, x, y, r, r, fill); }

// Lighten (amt > 0) or darken (amt < 0) a hex colour.
const shadeCache = new Map();
export function shade(hex, amt) {
  const key = hex + amt;
  if (shadeCache.has(key)) return shadeCache.get(key);
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255; const p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  const out = `rgb(${r},${g},${b})`;
  shadeCache.set(key, out);
  return out;
}
export function rgba(hex, a) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const n = parseInt(c, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function star(ctx, x, y, r, fill, points = 5, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r * inner : r;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}

export function heart(ctx, x, y, s, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.45, y - s, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s, x + s, y - s * 0.3, x, y + s * 0.35);
  ctx.fillStyle = fill; ctx.fill();
}

export function coinIcon(ctx, x, y, r) {
  circ(ctx, x, y, r, '#e9a623');
  circ(ctx, x, y, r * 0.78, '#ffd257');
  ctx.fillStyle = '#e9a623';
  ctx.fillRect(x - r * 0.12, y - r * 0.45, r * 0.24, r * 0.9);
}

/* ------------------------------------------------------------------ */
/* Mouse                                                               */
/* ------------------------------------------------------------------ */
const PINK = '#f2b1ab';
const FOOT = '#eea69e';
const EYE = '#2b2320';

// Every pose loops over one phase angle, φ = speed·t + seed. The cached pictures (sprites.js) cut
// that loop into a few frames, like a flip-book: pose → [speed, frames].
export const TAU = Math.PI * 2;
export function frameOf(ph, n) { const u = ph / TAU; return Math.floor((u - Math.floor(u)) * n) % n; }
const MOUSE_CYCLE = { walk: [9, 8], dance: [5, 10], hammer: [14, 6], wave: [10, 6], eat: [1.8, 12], sing: [3, 8], knit: [8, 6], sweep: [5, 6], clap: [9, 6], read: [1.3, 6], sit: [1.3, 6], point: [5, 6] };
const MOUSE_IDLE = [2.4, 6];
// The area a mouse can cover around its feet, [x, y, w, h], for its picture.
const BOX = [-22, -44, 48, 48]; const BOX_HAT = [-22, -52, 48, 56]; const BOX_UMBRELLA = [-22, -67, 48, 71];
const BOX_SWEEP = [-24, -44, 50, 56]; const BOX_DANCE = [-30, -58, 62, 62];
const TALL_HATS = new Set(['tophat', 'wizard', 'chef', 'crown']);
function mouseBox(o, pose) {
  if (pose === 'dance') return BOX_DANCE;
  if (o.umbrella) return BOX_UMBRELLA;
  if (pose === 'sweep') return BOX_SWEEP;
  return o.crown || TALL_HATS.has(o.hat) ? BOX_HAT : BOX;
}
const mouseKey = (o) => `${o.fur}|${o.belly}|${o.hat}|${o.hatCol}|${o.scarf}|${o.vest}|${o.apron}|${o.book}|${o.item}|${o.yarn}|${o.flag}|${o.trayCol}|${o.umbrella}|${o.cape}|`
  + ((o.glasses ? 1 : 0) + (o.shades ? 2 : 0) + (o.monocle ? 4 : 0) + (o.crown ? 8 : 0) + (o.baton ? 16 : 0) + (o.sack ? 32 : 0) + (o.sleep ? 64 : 0) + (o.seated ? 128 : 0) + (o.noShadow ? 256 : 0));

// Draws a mouse with its feet at (x, y). o.dir: 1 faces right, -1 faces left.
// Poses: stand, walk, sit, read, reach, pay, hammer, wave, happy, plus eat, carry, sing, dance,
// knit, point, sweep and clap (o.seated sits for any of them; o.item / o.yarn / o.flag add props).
// Far away on screen, mice are drawn with a third of the shapes (no whiskers, shading or tufts):
// at that size nobody can see the difference, and a full library has well over a hundred mice.
let LOD = false;
export function setMouseLod(on) { LOD = on; }
export const mouseLod = () => LOD;
function drawMouseLite(ctx, x, y, o) {
  const s = o.s ?? 1; const t = o.t ?? 0; const pose = o.pose || 'stand';
  const fur = o.fur || '#b8aca1'; const belly = o.belly || '#efe6dc';
  ctx.save(); ctx.translate(x, y); ctx.scale((o.dir || 1) * s, s);
  if (o.alpha != null && o.alpha < 1) ctx.globalAlpha *= Math.max(0, o.alpha);
  const sitting = pose === 'sit' || pose === 'read' || !!o.seated;
  const bob = pose === 'walk' ? Math.abs(Math.sin(t * 9)) * 1.6 : pose === 'dance' ? Math.abs(Math.sin(t * 5)) * 2 : 0;
  ctx.strokeStyle = PINK; ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.beginPath();
  if (sitting) { ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-16, -2, -10, 0.5); } else { ctx.moveTo(-7, -7 - bob); ctx.quadraticCurveTo(-20, -10, -15, -21); }
  ctx.stroke();
  if (o.cape) { ctx.fillStyle = o.cape; ctx.fillRect(-12, -20 - bob, 16, 19); }
  const hx = sitting ? 3 : 4; const hy = (sitting ? -19 : -23) - bob;
  if (sitting) { ell(ctx, 0, -8, 8.5, 8.5, fur); ell(ctx, 3, -7.5, 5, 6, belly); ell(ctx, 7, -2.2, 5.5, 2.6, fur); }
  else { ell(ctx, 0, -1.1, 6.5, 1.8, FOOT); ell(ctx, 0, -10 - bob, 8.5, 10, fur); ell(ctx, 3, -9 - bob, 5, 7, belly); }
  const by = sitting ? 0 : -bob;
  if (o.apron) fillRR(ctx, -2, -17 + by, 11, 14, 3, o.apron);
  else if (o.vest) fillRR(ctx, -8, -17 + by, 8, 13, 3, o.vest);
  if (o.scarf) fillRR(ctx, -5, -19.5 + by + (sitting ? 3.5 : 0), 14, 4.2, 2, o.scarf);
  if (pose === 'read') { ctx.fillStyle = '#fbf6ea'; ctx.fillRect(6.5, -17, 8, 7); }
  else if (pose === 'carry') fillRR(ctx, 1, -28 + by, 16, 3, 1, o.item === 'books' ? '#b5523b' : '#c9a227');
  else if (pose === 'eat' || pose === 'knit') ell(ctx, 9, -13 + by, 3, 2.5, o.yarn || '#fbf6ea');
  ell(ctx, hx - 3.8, hy - 8, 6.2, 6.2, fur); ell(ctx, hx - 3.5, hy - 7.7, 4.2, 4.2, PINK);
  ell(ctx, hx, hy, 7.8, 7.6, fur); ell(ctx, hx + 6.3, hy + 1.8, 5.3, 4, fur);
  if (o.sleep) { ctx.strokeStyle = EYE; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(hx + 2.4, hy - 1); ctx.lineTo(hx + 5.2, hy - 1); ctx.stroke(); }
  else circ(ctx, hx + 3.8, hy - 1.2, 1.55, EYE);
  circ(ctx, hx + 11.3, hy + 1.1, 1.55, '#e98b8b');
  drawHat(ctx, o.crown ? 'crown' : o.hat, hx, hy, o.hatCol, t);
  ctx.restore();
}

export function drawMouse(ctx, x, y, o) {
  const pose = o.pose || 'stand'; const t = o.t ?? 0; const seed = o.seed || 0;
  const s = o.s ?? 1; const dir = o.dir || 1; const alpha = o.alpha ?? 1;
  const [speed, n0] = MOUSE_CYCLE[pose] || MOUSE_IDLE;
  const n = LOD ? Math.max(2, n0 >> 1) : n0; // tiny on screen: half the frames do
  let ph = speed * t + seed;
  const blink = !o.sleep && !LOD && ((t + seed * 1.7) % 4.2) < 0.13; // blinks now and then
  if (spritesOn()) {
    const f = frameOf(ph, n); ph = ((f + 0.5) / n) * TAU;
    const look = mouseKey(o); const box = mouseBox(o, pose);
    if (sprite(ctx, 'm' + pose + f + look, box, x, y, dir, s, alpha, paintMouse, o, pose, ph)) {
      if (blink && !o.shades) eyelid(ctx, x, y, dir, s, alpha, o, pose, ph);
      return;
    }
    if (spriteNearFrame(ctx, 'm' + pose, look, f, n, box, x, y, dir, s, alpha)) return;
    if (!o.full) { drawMouseLite(ctx, x, y, o); return; } // its pictures are on their way
  }
  if (LOD && !o.full) { drawMouseLite(ctx, x, y, o); return; }
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  if (alpha < 1) ctx.globalAlpha *= Math.max(0, alpha);
  paintMouse(ctx, o, pose, ph, blink);
  ctx.restore();
}

// A blink on top of a mouse's picture: fur over the eye and a closed-eye line (see paintMouse).
function eyelid(ctx, x, y, dir, s, alpha, o, pose, ph) {
  const sn = Math.sin(ph);
  const sitting = pose === 'sit' || pose === 'read' || !!o.seated;
  const bob = pose === 'walk' ? Math.abs(sn) * 1.6 : pose === 'dance' ? Math.abs(sn) * 2.2 : sn * 0.35;
  const hx = sitting ? 3 : 4; const hy = (sitting ? -19 : -23) - bob + (pose === 'read' ? sn * 0.5 + 0.8 : 0);
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  if (pose === 'dance') ctx.rotate(sn * 0.12);
  if (alpha < 1) ctx.globalAlpha *= Math.max(0, alpha);
  circ(ctx, hx + 3.9, hy - 1.3, 2, o.fur || '#b8aca1');
  ctx.strokeStyle = EYE; ctx.lineWidth = 0.9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + 2.4, hy - 1); ctx.lineTo(hx + 5.2, hy - 1); ctx.stroke();
  ctx.restore();
}

// The mouse itself, feet at the origin, facing right, at animation phase ph.
function paintMouse(ctx, o, pose, ph, blink) {
  const fur = o.fur || '#b8aca1';
  const belly = o.belly || '#efe6dc';
  const sn = Math.sin(ph);
  if (pose === 'dance') ctx.rotate(sn * 0.12);

  const sitting = pose === 'sit' || pose === 'read' || !!o.seated;
  const walking = pose === 'walk';
  const bob = walking ? Math.abs(sn) * 1.6 : pose === 'dance' ? Math.abs(sn) * 2.2 : sn * 0.35;
  const sway = walking ? Math.sin(ph + 1) * 2 : sn * 3;

  if (!o.noShadow) ell(ctx, sitting ? 2 : 0, 0.6, 10, 2.4, 'rgba(0,0,0,0.14)');

  // Tail
  ctx.strokeStyle = PINK; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
  ctx.beginPath();
  if (sitting) { ctx.moveTo(-6, -4); ctx.bezierCurveTo(-14, -2, -16, 3 + sway * 0.3, -10, 0.5); }
  else { ctx.moveTo(-7, -7 - bob); ctx.bezierCurveTo(-16, -4, -21, -14 + sway, -15, -21 + sway * 0.6); }
  ctx.stroke();

  // Royal cape
  if (o.cape) {
    ctx.fillStyle = o.cape;
    ctx.beginPath();
    ctx.moveTo(-1, -20 - bob); ctx.quadraticCurveTo(-14, -12, -12, sitting ? -2 : -0.5);
    ctx.lineTo(4, sitting ? -2 : -0.5); ctx.quadraticCurveTo(2, -12, 5, -20 - bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7f1e6';
    ctx.fillRect(-12, (sitting ? -3.5 : -2) , 16, 1.6);
  }

  const hx = sitting ? 3 : 4;
  const hy = (sitting ? -19 : -23) - bob + (pose === 'read' ? sn * 0.5 + 0.8 : 0);

  if (sitting) {
    ell(ctx, 0, -8, 8.5, 8.5, fur);
    ell(ctx, -3, -4, 5, 3.4, 'rgba(60,40,30,0.08)'); // soft shading at the back
    ell(ctx, -2, -12, 4.2, 3, 'rgba(255,255,255,0.14)'); // and a little sheen on top
    ell(ctx, 3, -7.5, 5, 6, belly);
    ell(ctx, 7, -2.2, 5.5, 2.6, fur); // thigh
    ell(ctx, 11.5, -1.8, 3.2, 1.8, FOOT);
  } else {
    const p = walking ? sn : 0;
    ell(ctx, -3 + p * 3, -1.1, 3.4, 1.8, FOOT);
    ell(ctx, 3 - p * 3, -1.1, 3.4, 1.8, FOOT);
    ell(ctx, 0, -10 - bob, 8.5, 10, fur);
    ell(ctx, -3.4, -5 - bob, 4.6, 4.6, 'rgba(60,40,30,0.08)');
    ell(ctx, -2.2, -15 - bob, 4.2, 3.4, 'rgba(255,255,255,0.14)');
    ell(ctx, 3, -9 - bob, 5, 7, belly);
  }
  const by = sitting ? 0 : -bob;

  if (o.apron) { fillRR(ctx, -2, -17 + by, 11, 14, 3, o.apron); }
  if (o.vest) { ctx.fillStyle = o.vest; ctx.beginPath(); ctx.ellipse(-1, -10 + by, 8.2, 9.2, 0, Math.PI * 0.55, Math.PI * 1.45); ctx.fill(); }

  // Scarf
  if (o.scarf) {
    fillRR(ctx, -5, -19.5 + by + (sitting ? 3.5 : 0), 14, 4.2, 2, o.scarf);
    ctx.fillStyle = shade(o.scarf, -0.12);
    ctx.beginPath(); const sy = -18 + by + (sitting ? 3.5 : 0);
    ctx.moveTo(-4, sy); ctx.lineTo(-8 + sway * 0.3, sy + 8); ctx.lineTo(-5, sy + 8.5); ctx.lineTo(-1, sy + 1); ctx.fill();
  }

  // Arms and held items
  if (pose === 'reach') {
    ell(ctx, 6, -24 - bob, 2.3, 5, fur, -0.3);
    if (o.book) fillRR(ctx, 6, -34 - bob, 6, 8, 1, o.book);
  } else if (pose === 'pay') {
    ell(ctx, 8, -13, 4.5, 2.2, fur);
    coinIcon(ctx, 13, -14, 2.8);
  } else if (pose === 'hammer') {
    const a = sn * 0.9 - 0.3;
    ctx.save(); ctx.translate(5, -14); ctx.rotate(a);
    ell(ctx, 3, 0, 4, 2.2, fur);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(5, -1, 9, 1.8);
    ctx.fillStyle = '#6d6d78'; ctx.fillRect(12, -3.5, 4, 6.5);
    ctx.restore();
  } else if (pose === 'read') {
    // Open book held up
    const bc = o.book || '#c0504d';
    ctx.fillStyle = '#fbf6ea';
    ctx.beginPath(); ctx.moveTo(6.5, -17); ctx.lineTo(10.5, -14); ctx.lineTo(10.5, -7.5); ctx.lineTo(6.5, -10.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10.5, -14); ctx.lineTo(14.5, -17); ctx.lineTo(14.5, -10.5); ctx.lineTo(10.5, -7.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = bc; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(6.5, -10.5); ctx.lineTo(10.5, -7.5); ctx.lineTo(14.5, -10.5); ctx.stroke();
    ell(ctx, 8, -9.5, 2.2, 3, fur);
  } else if (pose === 'wave') {
    ell(ctx, 7, -22 - bob + sn * 1.5, 2.3, 4.5, fur, -0.5 + sn * 0.3);
  } else if (pose === 'eat') {
    // lifting a cup or a snack to the mouth every so often
    const up = Math.max(0, sn);
    const ax = 7 + up * 2; const ay = (sitting ? -9 : -12 + by) - up * 7;
    ell(ctx, ax - 1, ay + 2, 2.3, 4, fur, -0.6 - up * 0.5);
    const it = o.item || 'cup';
    if (it === 'cup') { fillRR(ctx, ax + 1, ay - 5, 4.4, 4, 1, '#fbf6ea'); ctx.strokeStyle = '#fbf6ea'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(ax + 6, ay - 3, 1.2, -1.3, 1.3); ctx.stroke(); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(ax + 1.5, ay - 4.6, 3.4, 0.9); }
    else if (it === 'scone') { ell(ctx, ax + 3, ay - 3, 3, 2.4, '#e0b170'); ell(ctx, ax + 3, ay - 4.3, 2.2, 1, '#fff3dc'); circ(ctx, ax + 3.6, ay - 5, 0.8, '#e0404f'); }
    else if (it === 'cheese') { ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(ax + 0.5, ay - 1); ctx.lineTo(ax + 7, ay - 1); ctx.lineTo(ax + 7, ay - 5.5); ctx.closePath(); ctx.fill(); circ(ctx, ax + 5, ay - 2.4, 0.7, '#e8a41f'); }
    else if (it === 'popcorn') { fillRR(ctx, ax, ay - 5, 5, 5.4, 1, '#e0404f'); ctx.fillStyle = '#fff'; ctx.fillRect(ax + 1.6, ay - 5, 1, 5.4); for (let k = 0; k < 3; k++) circ(ctx, ax + 1 + k * 1.5, ay - 5.6, 1.2, '#fff8e0'); }
  } else if (pose === 'carry') {
    // a tray held up high: teacups, or a stack of books
    ell(ctx, 6, -20 + by, 2.3, 5, fur, -0.2);
    const it = o.item || 'cups';
    if (it === 'books') ['#b5523b', '#3d7a5a', '#4f7cac', '#e8c465'].forEach((c, k) => fillRR(ctx, 2 + (k % 2), -28 - k * 2.8 + by, 13, 2.8, 0.6, c));
    else {
      fillRR(ctx, 1, -28 + by, 16, 2.2, 1, o.trayCol || '#c9a227');
      fillRR(ctx, 3, -32 + by, 4, 4, 1, '#fbf6ea'); fillRR(ctx, 9, -32 + by, 4, 4, 1, '#fbf6ea'); ell(ctx, 15, -29.4 + by, 2, 1.3, '#e0b170');
    }
  } else if (pose === 'sing' || pose === 'dance') {
    // both arms up
    const sw = sn;
    ell(ctx, 7, -23 + by + sw * 1.2, 2.3, 4.6, fur, -0.6 + sw * 0.25);
    ell(ctx, -5, -21 + by - sw * 1.2, 2.2, 4.2, shade(fur, -0.06), 0.6 - sw * 0.25);
  } else if (pose === 'knit') {
    // needles clicking over a growing piece of knitting
    const k = sn;
    const ky = sitting ? -1 : by;
    ell(ctx, 7, -12 + ky, 2.3, 3.6, fur, 1.1);
    fillRR(ctx, 9, -11 + ky, 6, 7, 1.5, o.yarn || '#e0604a');
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let r = 0; r < 3; r++) ctx.fillRect(9.5, -10 + ky + r * 2.2, 5, 0.6);
    ctx.strokeStyle = '#c9a270'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(6, -16 + ky + k); ctx.lineTo(16, -9 + ky); ctx.moveTo(8, -8 + ky - k); ctx.lineTo(16, -15 + ky); ctx.stroke();
  } else if (pose === 'point') {
    ell(ctx, 10, -17 + by, 5, 2.1, fur, -0.15);
    if (o.flag) { ctx.strokeStyle = '#6b4128'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(14, -17 + by); ctx.lineTo(14, -32 + by); ctx.stroke(); ctx.fillStyle = o.flag; ctx.beginPath(); ctx.moveTo(14, -32 + by); ctx.lineTo(21 + sn, -29.5 + by); ctx.lineTo(14, -27 + by); ctx.closePath(); ctx.fill(); }
    else if (o.baton) { ctx.strokeStyle = '#fbf6ea'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(14, -17 + by); ctx.lineTo(19, -22 + by + sn * 3); ctx.stroke(); }
  } else if (pose === 'sweep') {
    const k = sn * 0.25;
    ctx.save(); ctx.translate(6, -13 + by); ctx.rotate(0.5 + k);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-0.8, -4, 1.6, 20);
    ctx.fillStyle = '#d9b36a'; ctx.beginPath(); ctx.moveTo(-3.5, 15); ctx.lineTo(3.5, 15); ctx.lineTo(5, 21); ctx.lineTo(-5, 21); ctx.closePath(); ctx.fill();
    ctx.restore();
    ell(ctx, 6, -13 + by, 2.3, 3, fur);
  } else if (pose === 'clap') {
    const k = Math.abs(sn);
    const cy = sitting ? -11 : -14 + by;
    ell(ctx, 8 - k * 2, cy, 2.2, 3.2, fur, 0.4);
    ell(ctx, 10 + k * 2, cy, 2.2, 3.2, shade(fur, -0.06), -0.4);
  } else {
    ell(ctx, 4.5, -10.5 + by, 2.3, 4.2, fur, 0.2);
    if (o.book && !sitting) fillRR(ctx, 4, -17 + by, 7, 9, 1, o.book);
  }

  // Head
  ell(ctx, hx - 1, hy - 9, 5.2, 5.2, shade(fur, -0.12));
  ell(ctx, hx - 1, hy - 9, 3.2, 3.2, shade(PINK, -0.08));
  ell(ctx, hx, hy, 7.8, 7.6, fur);
  ell(ctx, hx - 1.5, hy - 3.4, 4, 2.6, 'rgba(255,255,255,0.16)'); // sheen on the crown
  ell(ctx, hx + 6.3, hy + 1.8, 5.3, 4, fur);
  // a little tuft of fur
  ctx.strokeStyle = shade(fur, -0.18); ctx.lineWidth = 0.7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hx + 0.5, hy - 7.2); ctx.quadraticCurveTo(hx + 1.2, hy - 9.6, hx + 2.6, hy - 9.8); ctx.moveTo(hx + 2, hy - 7.4); ctx.quadraticCurveTo(hx + 3.2, hy - 9, hx + 4.4, hy - 8.8); ctx.stroke();
  ell(ctx, hx + 3.2, hy + 3.4, 1.9, 1.5, 'rgba(240,130,130,0.4)');
  ell(ctx, hx - 3.8, hy - 8, 6.2, 6.2, fur);
  ell(ctx, hx - 3.5, hy - 7.7, 4.2, 4.2, PINK);
  ell(ctx, hx - 3.1, hy - 8.4, 2, 2, 'rgba(255,255,255,0.22)');

  // Eye
  if (blink || o.sleep) { ctx.strokeStyle = EYE; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(hx + 2.4, hy - 1); ctx.lineTo(hx + 5.2, hy - 1); ctx.stroke(); }
  else if (pose === 'happy') {
    ctx.strokeStyle = EYE; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(hx + 3.8, hy - 0.6, 1.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else { circ(ctx, hx + 3.8, hy - 1.2, 1.55, EYE); circ(ctx, hx + 4.3, hy - 1.8, 0.55, '#fff'); }
  circ(ctx, hx + 11.3, hy + 1.1, 1.55, '#e98b8b');
  if (pose === 'sing') ell(ctx, hx + 8.2, hy + 4.4, 1.3, 0.8 + Math.abs(Math.sin(ph * 2)) * 1.1, '#6b2a2a');
  if (pose === 'eat' && sn > 0.75) ell(ctx, hx + 6.5, hy + 3.2, 2, 1.6, fur); // chewing cheeks

  ctx.strokeStyle = 'rgba(90,70,60,0.45)'; ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(hx + 9, hy + 2.4); ctx.lineTo(hx + 15.5, hy + 0.6);
  ctx.moveTo(hx + 9, hy + 2.8); ctx.lineTo(hx + 16, hy + 3.4);
  ctx.moveTo(hx + 9, hy + 3.2); ctx.lineTo(hx + 15, hy + 6);
  ctx.stroke();

  if (o.glasses) {
    ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(hx + 4, hy - 1.1, 2.6, 0, Math.PI * 2); ctx.moveTo(hx + 1.4, hy - 1.4); ctx.lineTo(hx - 3, hy - 3); ctx.stroke();
  }
  if (o.shades) { fillRR(ctx, hx + 1.2, hy - 3.2, 6, 3.6, 1.4, '#1d1b24'); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(hx + 2.2, hy - 2.7, 1.5, 0.8); }
  if (o.monocle) {
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.arc(hx + 4, hy - 1.1, 2.7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 4, hy + 1.6); ctx.quadraticCurveTo(hx + 2, hy + 8, hx - 1, hy + 9); ctx.stroke();
  }
  drawHat(ctx, o.crown ? 'crown' : o.hat, hx, hy, o.hatCol, ph);

  if (o.umbrella) {
    ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(6, -12 - bob); ctx.lineTo(4, hy - 22); ctx.stroke();
    ctx.fillStyle = o.umbrella;
    ctx.beginPath(); ctx.moveTo(4 - 15, hy - 20); ctx.quadraticCurveTo(4, hy - 38, 4 + 15, hy - 20);
    for (let k = 0; k < 4; k++) ctx.quadraticCurveTo(4 + 15 - k * 7.5 - 3.75, hy - 23, 4 + 15 - (k + 1) * 7.5, hy - 20);
    ctx.fill();
    circ(ctx, 4, hy - 29.5, 1, '#4a3a30');
  }
  if (o.sack) {
    ell(ctx, -9, -16 - bob, 7, 6.5, '#b9a27c');
    ctx.fillStyle = '#e9a623'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', -9, -14 - bob);
  }
}

/* ------------------------------------------------------------------ */
/* Baroness Clawdia, the cat                                           */
/* ------------------------------------------------------------------ */
// mode 'peek': head + paws (origin = chin), 'bust' for portraits.
export function drawCat(ctx, x, y, { s = 1, t = 0, mode = 'peek', squint = 0, flee = 0 } = {}) {
  const FUR = '#8e86a3'; const DK = '#6f6884'; const LT = '#e4dfee';
  ctx.save(); ctx.translate(x, y + flee * 30); ctx.scale(s, s);
  if (mode === 'bust') {
    ell(ctx, 0, 30, 24, 20, FUR); ell(ctx, 0, 30, 12, 14, LT);
    for (let k = -3; k <= 3; k++) circ(ctx, k * 4.2, 17 + Math.abs(k) * 1.2, 1.9, '#f7f1e6');
  }
  // tail swish
  if (mode === 'peek') {
    ctx.strokeStyle = FUR; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(18, 12); ctx.quadraticCurveTo(34, 4 + Math.sin(t * 3) * 6, 30, -14 + Math.sin(t * 3 + 1) * 5); ctx.stroke();
  }
  // ears
  const ear = (sx) => {
    ctx.fillStyle = FUR; ctx.beginPath(); ctx.moveTo(sx * 5, -9); ctx.lineTo(sx * 15, -24 + Math.sin(t * 2) * (sx > 0 ? 1 : 0)); ctx.lineTo(sx * 16, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a3b8'; ctx.beginPath(); ctx.moveTo(sx * 8, -9); ctx.lineTo(sx * 14, -19); ctx.lineTo(sx * 14.5, -7); ctx.closePath(); ctx.fill();
  };
  ear(-1); ear(1);
  // head + cheek fluff
  ell(ctx, 0, 0, 17, 14, FUR);
  ctx.fillStyle = FUR;
  [-1, 1].forEach((sx) => { ctx.beginPath(); ctx.moveTo(sx * 14, 2); ctx.lineTo(sx * 21, 6); ctx.lineTo(sx * 15, 8); ctx.lineTo(sx * 20, 11); ctx.lineTo(sx * 11, 11); ctx.fill(); });
  ctx.fillStyle = DK; for (let k = -1; k <= 1; k++) { ctx.fillRect(k * 4 - 0.8, -13, 1.6, 5); }
  ell(ctx, 0, 6, 8, 5.2, LT);
  // eyes (smug half-lids)
  [-1, 1].forEach((sx) => {
    ell(ctx, sx * 6.5, -1.5, 4, 4.4, '#a6d86b');
    ell(ctx, sx * 6.5, -1.5, 0.9 + squint * 0.3, 3.6 - squint * 2, '#1d1b24');
    circ(ctx, sx * 6.5 + 1.2, -3, 0.8, '#fff');
    ctx.fillStyle = FUR; ctx.beginPath(); ctx.ellipse(sx * 6.5, -4.6 - squint * 1.5, 4.6, 2.8 + squint * 1.6, 0, Math.PI, 0); ctx.fill();
  });
  ctx.fillStyle = '#e98b9e'; ctx.beginPath(); ctx.moveTo(-1.8, 3.6); ctx.lineTo(1.8, 3.6); ctx.lineTo(0, 5.6); ctx.fill();
  ctx.strokeStyle = '#4a3a50'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(0, 5.6); ctx.quadraticCurveTo(-2, 8, -3.5, 6.8); ctx.moveTo(0, 5.6); ctx.quadraticCurveTo(2, 8, 3.5, 6.8); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.5;
  [-1, 1].forEach((sx) => { for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(sx * 7, 5 + k * 1.3); ctx.lineTo(sx * 21, 2 + k * 3.2); ctx.stroke(); } });
  // tiny baroness hat with feather
  fillRR(ctx, 3, -16, 10, 4, 1.5, '#6d3f8f');
  ctx.strokeStyle = '#f2d27a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(10, -16); ctx.quadraticCurveTo(16, -26, 22, -24); ctx.stroke();
  if (mode === 'peek') {
    [-1, 1].forEach((sx) => { ell(ctx, sx * 11, 14, 6.5, 4.2, FUR); ctx.strokeStyle = DK; ctx.lineWidth = 0.6; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(sx * 11 + k * 2.2, 11.5); ctx.lineTo(sx * 11 + k * 2.2, 14); ctx.stroke(); } });
  }
  ctx.restore();
}

export function drawWorm(ctx, x, y, t, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let k = 3; k >= 0; k--) circ(ctx, -k * 2.4, Math.sin(t * 9 + k) * 1.3, 2 - k * 0.15, k === 0 ? '#9ccf5a' : '#8bc34a');
  circ(ctx, 0.8, -0.6, 0.55, '#1d1b24');
  ctx.restore();
}

function drawHat(ctx, hat, hx, hy, col, ph) {
  if (!hat) return;
  switch (hat) {
    case 'beret': ell(ctx, hx - 1, hy - 6.5, 7.5, 3, col || '#6a3d6e'); circ(ctx, hx - 1, hy - 9.8, 1, col || '#6a3d6e'); break;
    case 'tophat':
      fillRR(ctx, hx - 5.5, hy - 20, 10, 13, 1, '#2a2430');
      ctx.fillStyle = '#7a2f3a'; ctx.fillRect(hx - 5.5, hy - 10.5, 10, 2.2);
      ell(ctx, hx - 0.5, hy - 7, 9, 1.9, '#2a2430'); break;
    case 'bow':
      ctx.fillStyle = col || '#e8718d';
      ctx.beginPath(); ctx.moveTo(hx - 4, hy - 11); ctx.lineTo(hx - 9, hy - 14.5); ctx.lineTo(hx - 9, hy - 7.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx - 4, hy - 11); ctx.lineTo(hx + 1, hy - 14.5); ctx.lineTo(hx + 1, hy - 7.5); ctx.closePath(); ctx.fill();
      circ(ctx, hx - 4, hy - 11, 1.6, shade(col || '#e8718d', -0.15)); break;
    case 'flower':
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + ph * 0.2; circ(ctx, hx + 1 + Math.cos(a) * 2.2, hy - 9 + Math.sin(a) * 2.2, 1.7, col || '#f7a8c4'); }
      circ(ctx, hx + 1, hy - 9, 1.3, '#ffd257'); break;
    case 'cap':
      ctx.fillStyle = col || '#4f7cac'; ctx.beginPath(); ctx.arc(hx, hy - 4.5, 7.6, Math.PI, 0); ctx.fill();
      ell(ctx, hx + 7, hy - 4.5, 5, 1.4, shade(col || '#4f7cac', -0.2)); break;
    case 'bobble':
      ctx.fillStyle = col || '#c0504d'; ctx.beginPath(); ctx.arc(hx, hy - 4, 7.8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff6ea'; ctx.fillRect(hx - 7.8, hy - 5, 15.6, 2.2); circ(ctx, hx, hy - 12.5, 2.2, '#fff6ea'); break;
    case 'crown':
      ctx.fillStyle = '#f2c230';
      ctx.beginPath(); ctx.moveTo(hx - 6, hy - 7); ctx.lineTo(hx - 6, hy - 14); ctx.lineTo(hx - 3, hy - 10); ctx.lineTo(hx, hy - 16);
      ctx.lineTo(hx + 3, hy - 10); ctx.lineTo(hx + 6, hy - 14); ctx.lineTo(hx + 6, hy - 7); ctx.closePath(); ctx.fill();
      circ(ctx, hx, hy - 9.5, 1.2, '#e0404f'); circ(ctx, hx - 4, hy - 9, 0.9, '#3f8fd9'); circ(ctx, hx + 4, hy - 9, 0.9, '#3fbf7f'); break;
    case 'sunhat':
      ell(ctx, hx, hy - 6, 13, 2.6, col || '#f3e0b0'); ctx.fillStyle = col || '#f3e0b0'; ctx.beginPath(); ctx.arc(hx, hy - 6.5, 6.5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#e58fa8'; ctx.fillRect(hx - 6.5, hy - 8.4, 13, 1.9); break;
    case 'pirate':
      ctx.fillStyle = '#1f1c22'; ctx.beginPath(); ctx.moveTo(hx - 11, hy - 6); ctx.quadraticCurveTo(hx, hy - 20, hx + 11, hy - 6); ctx.quadraticCurveTo(hx, hy - 9, hx - 11, hy - 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 5px sans-serif'; ctx.fillText('☠', hx - 2.2, hy - 9.5); break;
    case 'star': star(ctx, hx - 2, hy - 11, 4.5, '#ffd257'); break;
    case 'headphones':
      ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hx - 1, hy - 3, 9, Math.PI * 1.1, Math.PI * 1.95); ctx.stroke();
      fillRR(ctx, hx - 7, hy - 5, 4.5, 6, 2, '#e05a6a'); break;
    case 'chef':
      fillRR(ctx, hx - 5.5, hy - 12, 11, 6, 1, '#ffffff'); circ(ctx, hx - 3, hy - 13, 3.5, '#fff'); circ(ctx, hx + 2, hy - 14, 4, '#fff'); circ(ctx, hx + 5, hy - 12, 3, '#fff'); break;
    case 'deerstalker':
      ctx.fillStyle = '#9c7b4f'; ctx.beginPath(); ctx.arc(hx, hy - 4.5, 7.8, Math.PI, 0); ctx.fill();
      ell(ctx, hx + 8, hy - 4.8, 3.5, 1.4, '#7d6040'); ell(ctx, hx - 8, hy - 4.8, 3.5, 1.4, '#7d6040');
      ctx.strokeStyle = 'rgba(60,40,20,.4)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(hx - 5, hy - 10); ctx.lineTo(hx + 5, hy - 5); ctx.moveTo(hx + 4, hy - 11); ctx.lineTo(hx - 5, hy - 5); ctx.stroke(); break;
    case 'wizard':
      ctx.fillStyle = col || '#4b3f78'; ctx.beginPath(); ctx.moveTo(hx - 8, hy - 5); ctx.lineTo(hx - 3, hy - 24); ctx.lineTo(hx + 7, hy - 5); ctx.closePath(); ctx.fill();
      star(ctx, hx - 1, hy - 12, 2.2, '#ffd257'); break;
    case 'hood':
      ctx.fillStyle = col || '#6b4a3a'; ctx.beginPath(); ctx.arc(hx - 1, hy - 1, 9.5, Math.PI * 0.75, Math.PI * 1.9); ctx.lineTo(hx - 1, hy + 6); ctx.fill(); break;
    case 'hardhat':
      ctx.fillStyle = '#f5c518'; ctx.beginPath(); ctx.arc(hx, hy - 4.5, 7.8, Math.PI, 0); ctx.fill();
      ell(ctx, hx + 1, hy - 4.3, 10, 1.6, '#e0a800'); break;
    case 'bandit':
      fillRR(ctx, hx - 6, hy - 3.6, 13.5, 4.2, 2, '#1d1b24');
      ctx.fillStyle = '#1d1b24'; ctx.beginPath(); ctx.moveTo(hx - 5, hy - 2); ctx.lineTo(hx - 10, hy - 5 + Math.sin(ph * 2) * 1.2); ctx.lineTo(hx - 9, hy + 0.5); ctx.fill();
      circ(ctx, hx + 3.8, hy - 1.5, 1, '#fff'); circ(ctx, hx + 4, hy - 1.5, 0.5, '#1d1b24');
      ctx.fillStyle = '#3a3440'; ctx.beginPath(); ctx.arc(hx, hy - 5, 7.4, Math.PI, 0); ctx.fill();
      break;
    default: break;
  }
}

/* ------------------------------------------------------------------ */
/* Pigeon: the meadow's courier, in a postman's cap with a satchel     */
/* ------------------------------------------------------------------ */
// Facing right, body centred on (x, y). parcel: a parcel hangs below on a string.
// Drawn from cached pictures, eight per wingbeat (see sprites.js).
const PIGEON_BOX = [-24, -22, 46, 50];
export function drawPigeon(ctx, x, y, t, s = 1, parcel = true) {
  const n = 8; let ph = t * 14;
  if (spritesOn()) {
    const f = frameOf(ph, n); ph = ((f + 0.5) / n) * TAU;
    if (sprite(ctx, `pigeon|${parcel ? 1 : 0}|${f}`, PIGEON_BOX, x, y, 1, s, 1, paintPigeon, parcel, 0, ph)) return;
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); paintPigeon(ctx, parcel, 0, ph); ctx.restore();
}
// A wing seen from the side, hinged at the shoulder. lift: 1 = raised high over the back,
// 0 = edge-on (level with the body), -1 = pushed down below it: a real up-and-down wingbeat,
// rather than swinging round the shoulder like a pendulum.
function pigeonWing(ctx, lift, dark) {
  ctx.save(); ctx.translate(-1, -3);
  ctx.transform(1, 0, 0.18 * lift, lift, 0, 0); // flip through the beat, tips trailing back a touch
  ctx.fillStyle = dark ? '#7b869b' : '#8f9bb0';
  ctx.beginPath(); ctx.moveTo(-3, 0); ctx.quadraticCurveTo(-2, -12, 6, -19); ctx.quadraticCurveTo(9, -10, 7, 1); ctx.closePath(); ctx.fill();
  if (!dark) {
    ctx.fillStyle = '#e4e9f0'; ctx.fillRect(-1.5, -6, 7, 1.2); ctx.fillRect(-0.5, -9, 7, 1.1); // two white wing bars
    ctx.strokeStyle = '#5d6678'; ctx.lineWidth = 0.7; ctx.beginPath(); // dark feather tips
    for (let k = 0; k < 4; k++) { ctx.moveTo(1 + k * 1.6, -15 + k * 0.5); ctx.lineTo(3 + k * 1.6, -19 + k * 1.5); }
    ctx.stroke();
  }
  ctx.restore();
}
function paintPigeon(ctx, parcel, _, ph) {
  const flap = Math.sin(ph);
  if (parcel) {
    ctx.strokeStyle = '#7a5b3a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-2, 5); ctx.lineTo(-4, 14); ctx.moveTo(3, 5); ctx.lineTo(4, 14); ctx.stroke();
    fillRR(ctx, -9, 13, 16, 12, 2, '#c98b52'); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-9, 21, 16, 4);
    ctx.fillStyle = '#e0404f'; ctx.fillRect(-2, 13, 2.4, 12); ctx.fillRect(-9, 18, 16, 2.2);
    circ(ctx, -0.8, 12.5, 2.4, '#e0404f'); circ(ctx, -2.6, 11.6, 1.3, '#c0303f'); circ(ctx, 1, 11.6, 1.3, '#c0303f');
  }
  pigeonWing(ctx, 0.85 * Math.sin(ph - 0.35), true); // the far wing, a beat behind
  // fanned tail with a dark band
  ctx.fillStyle = '#8894a8'; ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(-21, -6); ctx.lineTo(-22, 0); ctx.lineTo(-20, 4); ctx.lineTo(-9, 3); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4d5566'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-18.5, -5); ctx.lineTo(-19.5, 3.6); ctx.stroke();
  // plump body, pale belly, pink feet tucked up
  ell(ctx, 0, 0, 11.5, 7, '#a9b3c4');
  ell(ctx, 2.5, 2.2, 7.5, 4, '#c8d0dc');
  ell(ctx, -4, -3, 6, 2.6, 'rgba(255,255,255,0.18)');
  ell(ctx, -1, 6.4, 1.6, 1, '#e98b8b'); ell(ctx, 2.6, 6.6, 1.6, 1, '#e98b8b');
  // the satchel across its chest
  ctx.strokeStyle = '#7a4b2e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, -5); ctx.lineTo(-3, 4); ctx.stroke();
  fillRR(ctx, -7, 1, 7, 6, 1.5, '#b5845a'); fillRR(ctx, -7, 1, 7, 2.6, 1.2, '#9a6b45'); ctx.fillStyle = '#fbf3df'; ctx.fillRect(-5.5, 0, 4, 1.4);
  // neck with its green-and-violet shimmer
  ell(ctx, 9, -2.5, 4.6, 4.2, '#9aa5b8');
  ell(ctx, 9.2, -1.4, 3.6, 2.4, '#7fb59a'); ell(ctx, 8.4, 0.2, 3, 1.6, '#a985bf');
  // head, eye, beak (with its little white cere)
  circ(ctx, 11, -6, 5, '#9aa5b8');
  ell(ctx, 10, -8.6, 2.6, 1.2, 'rgba(255,255,255,0.22)');
  circ(ctx, 12.8, -6.4, 1.7, '#f2a13e'); circ(ctx, 13.1, -6.4, 0.95, '#1f1c22'); circ(ctx, 13.5, -6.9, 0.38, '#fff');
  ctx.fillStyle = '#5b5466'; ctx.beginPath(); ctx.moveTo(15.4, -6.4); ctx.lineTo(20, -5); ctx.lineTo(15.4, -4.2); ctx.closePath(); ctx.fill();
  ell(ctx, 15.8, -6.2, 1.3, 0.8, '#f4f1ea');
  // the postman's cap
  ctx.fillStyle = '#3d5a8c'; ctx.beginPath(); ctx.arc(10.5, -9.2, 4.6, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill();
  fillRR(ctx, 11, -10.2, 6, 1.6, 0.8, '#2a3f66'); circ(ctx, 10.4, -11.6, 0.9, '#f2c14e');
  pigeonWing(ctx, 0.15 + 0.85 * flap, false); // the near wing, beating up and down
}

// A swallow for the flocks that cross the sky (a cached picture per wingbeat frame).
const SWALLOW_BOX = [-9, -7, 18, 12];
export function drawSwallow(ctx, x, y, t, dir = 1, s = 1) {
  const n = 6; let ph = t * 10;
  if (spritesOn()) {
    const f = frameOf(ph, n); ph = ((f + 0.5) / n) * TAU;
    if (sprite(ctx, `swallow|${f}`, SWALLOW_BOX, x, y, dir, s, 1, paintSwallow, 0, 0, ph)) return;
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); paintSwallow(ctx, 0, 0, ph); ctx.restore();
}
function paintSwallow(ctx, _, __, ph) {
  const up = Math.sin(ph) * 4;
  ctx.fillStyle = '#34405c';
  ctx.beginPath(); ctx.moveTo(-1, -0.5); ctx.quadraticCurveTo(-4, -3 - up * 0.6, -8, -1.5 - up); ctx.quadraticCurveTo(-4, 0, -1, 0.5); ctx.fill(); // far wing
  ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-8.5, -1.2); ctx.lineTo(-6, 0.4); ctx.lineTo(-8.5, 2); ctx.closePath(); ctx.fill(); // forked tail
  ell(ctx, 0, 0, 4, 1.8, '#34405c'); circ(ctx, 3.4, -0.6, 1.6, '#34405c');
  ell(ctx, 1.4, 0.8, 2.4, 0.9, '#f4ece0'); ell(ctx, 4, 0.2, 0.9, 0.7, '#c0504d'); // pale belly, rusty throat
  ctx.fillStyle = '#2a3348'; ctx.beginPath(); ctx.moveTo(4.8, -0.8); ctx.lineTo(6.6, -0.4); ctx.lineTo(4.8, 0); ctx.fill();
  ctx.fillStyle = '#3f4c6b';
  ctx.beginPath(); ctx.moveTo(0, -0.6); ctx.quadraticCurveTo(1, -4 - up, -3, -6 - up * 1.2); ctx.quadraticCurveTo(0, -2.5, 1.5, 0); ctx.fill(); // near wing
}

/* ------------------------------------------------------------------ */
/* Cheese wedge (used for rewards)                                     */
/* ------------------------------------------------------------------ */
export function drawCheese(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(8, 4); ctx.lineTo(8, -2); ctx.lineTo(-8, -6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2b72b'; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(8, -2); ctx.lineTo(4, -6); ctx.closePath(); ctx.fill();
  circ(ctx, -3, 0, 1.4, '#e8a41f'); circ(ctx, 3, 1.5, 1.1, '#e8a41f'); circ(ctx, 5, -1, 0.8, '#e8a41f');
  ctx.restore();
}
