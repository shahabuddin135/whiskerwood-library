// Each branch gets its own library building: roof, outer walls and foundation. Meadow Burrow keeps
// the original red-tiled cottage (drawn by scenery.drawRoof); the others are drawn here in the same
// flat style. Every roof returns { chimneyX, chimneyY } for smoke (or null) and `eaves`, a polyline
// along its edge that festival lights and Book Fair bunting hang from.
import { BX0, BX1, ROOF_H, WALL, FH } from './layout.js';
import { rr, fillRR, ell, circ, rng, star } from './draw.js';
import { texRect } from './textures.js';

const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';
const CX = (BX0 + BX1) / 2;

// The shared bits every building has: the name sign and the mouse weathervane.
export function roofSign(ctx, y0, name) {
  const sw = 190, sh = 24;
  fillRR(ctx, CX - sw / 2, y0 - 32, sw, sh, 7, '#fff3dc');
  ctx.strokeStyle = '#6b4128'; ctx.lineWidth = 2; rr(ctx, CX - sw / 2, y0 - 32, sw, sh, 7); ctx.stroke();
  ctx.fillStyle = '#6b4128'; ctx.font = `700 13px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name, CX, y0 - 19.5);
}
function vane(ctx, x, y, t) {
  ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 26); ctx.stroke();
  ctx.save(); ctx.translate(x, y - 24); ctx.scale(Math.cos(t * 0.4) > 0 ? 1 : -1, 1);
  ell(ctx, 0, 0, 9, 4.5, '#3a3440'); circ(ctx, 8, -2, 3.5, '#3a3440'); circ(ctx, 5, -6, 3, '#3a3440');
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-18, -2, -16, -9); ctx.stroke();
  ctx.restore();
}
function glowWindow(ctx, x, y, r, tod, frame = '#6b4128') {
  circ(ctx, x, y, r + 4, frame); circ(ctx, x, y, r, tod.dark > 0.3 ? '#ffd98a' : '#bfe3f2');
  ctx.strokeStyle = frame; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
}
function chimney(ctx, x, top, h, col, cap) {
  ctx.fillStyle = col; ctx.fillRect(x, top + 4, 20, h);
  ctx.fillStyle = cap; ctx.fillRect(x - 4, top, 28, 7);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = top + 10; y < top + h; y += 7) ctx.fillRect(x, y, 20, 1);
  return { chimneyX: x + 10, chimneyY: top - 4 };
}
// A straight roof edge from a to b as a list of points (for festival lights).
const edge = (ax, ay, bx, by, n = 16) => Array.from({ length: n + 1 }, (_, k) => [ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);

/* ---------------- Windmill Hill: thatched farmhouse with its own windmill ---------------- */
function windmillRoof(ctx, y0, t, tod, name, opts) {
  const peak = y0 - ROOF_H + 6; const ox = 20;
  const L0 = [BX0 - ox, y0 + 6]; const R0 = [BX1 + ox, y0 + 6];
  const ch = chimney(ctx, BX0 + 64, peak + 58, 44, '#9b5a44', '#7d4535');
  // thatch body
  ctx.fillStyle = '#d6a443'; ctx.beginPath(); ctx.moveTo(...L0); ctx.lineTo(CX, peak); ctx.lineTo(...R0); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.moveTo(...L0); ctx.lineTo(CX, peak); ctx.lineTo(...R0); ctx.closePath(); ctx.clip();
  const R = rng(17);
  for (let y = peak + 10, row = 0; y < y0 + 8; y += 12, row++) {
    ctx.fillStyle = row % 2 ? '#c99536' : '#dcae4c';
    ctx.beginPath(); ctx.moveTo(BX0 - ox, y - 12);
    for (let x = BX0 - ox; x <= BX1 + ox; x += 8) ctx.quadraticCurveTo(x + 4, y + 3, x + 8, y);
    ctx.lineTo(BX1 + ox, y - 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(140,95,30,0.35)'; ctx.lineWidth = 0.7;
    for (let x = BX0 - ox + (row % 2) * 3; x < BX1 + ox; x += 5) { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + R() * 2 - 1, y + 1); ctx.stroke(); }
  }
  ctx.restore();
  // ridge + eave fringe
  ctx.strokeStyle = '#a8782a'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...L0); ctx.lineTo(CX, peak); ctx.lineTo(...R0); ctx.stroke();
  ctx.strokeStyle = '#c99536'; ctx.lineWidth = 1; for (let x = BX0 - ox + 2; x < BX1 + ox; x += 3.5) { ctx.beginPath(); ctx.moveTo(x, y0 + 5); ctx.lineTo(x + 0.6, y0 + 10 + ((x * 7) % 4)); ctx.stroke(); }
  if (opts.winter) snowRidge(ctx, L0, [CX, peak], R0);
  glowWindow(ctx, CX, peak + 50, 12, tod, '#7a4b2e');
  // the library's own little windmill on the right of the roof
  const mx = BX1 - 58; const my = peak + 44;
  ctx.fillStyle = '#efe3cf'; ctx.beginPath(); ctx.moveTo(mx - 14, y0 - 6); ctx.lineTo(mx - 9, my); ctx.lineTo(mx + 9, my); ctx.lineTo(mx + 14, y0 - 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(160,140,110,0.35)'; for (let y = my + 6; y < y0 - 8; y += 6) ctx.fillRect(mx - 12, y, 24, 0.8);
  fillRR(ctx, mx - 3.5, y0 - 22, 7, 14, 3.5, '#7a4b2e');
  ctx.fillStyle = '#b5523b'; ctx.beginPath(); ctx.moveTo(mx - 12, my + 2); ctx.lineTo(mx, my - 14); ctx.lineTo(mx + 12, my + 2); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.translate(mx, my - 4); ctx.rotate(t * 0.7);
  for (let k = 0; k < 4; k++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-1.2, 0, 2.4, 40);
    ctx.fillStyle = '#f7efe0'; ctx.fillRect(1.2, 8, 9, 30);
    ctx.strokeStyle = '#c9b89a'; ctx.lineWidth = 0.6; for (let j = 12; j < 38; j += 5) { ctx.beginPath(); ctx.moveTo(1.2, j); ctx.lineTo(10.2, j); ctx.stroke(); }
  }
  circ(ctx, 0, 0, 3.5, '#5b3a26');
  ctx.restore();
  roofSign(ctx, y0, name);
  vane(ctx, CX, peak, t);
  return { ...ch, eaves: [...edge(...L0, CX, peak), ...edge(CX, peak, ...R0).slice(1)], peak };
}

/* ---------------- Lighthouse Cove: blue clapboard with a lighthouse lamp ---------------- */
function coveRoof(ctx, y0, t, tod, name, opts) {
  const peak = y0 - 80; const ox = 16;
  const L0 = [BX0 - ox, y0 + 4]; const R0 = [BX1 + ox, y0 + 4];
  const ch = chimney(ctx, BX0 + 56, y0 - 58, 40, '#8a8577', '#6d6a60');
  ctx.fillStyle = '#4f6f90'; ctx.beginPath(); ctx.moveTo(...L0); ctx.lineTo(CX, peak); ctx.lineTo(...R0); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.moveTo(...L0); ctx.lineTo(CX, peak); ctx.lineTo(...R0); ctx.closePath(); ctx.clip();
  for (let y = peak + 4, row = 0; y < y0 + 6; y += 8, row++) for (let x = BX0 - ox + (row % 2) * 9; x < BX1 + ox; x += 18) {
    fillRR(ctx, x + 0.6, y, 16.8, 7.2, 1, row % 3 === 0 ? '#5d7ea0' : '#6a8bad');
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 1, y + 0.4, 16, 1);
  }
  ctx.restore();
  ctx.strokeStyle = '#f4efe6'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...L0); ctx.lineTo(CX, peak); ctx.lineTo(...R0); ctx.stroke();
  if (opts.winter) snowRidge(ctx, L0, [CX, peak], R0);
  // portholes
  [CX - 44, CX + 44].forEach((x) => { circ(ctx, x, y0 - 48, 8.5, '#c9a557'); circ(ctx, x, y0 - 48, 6, tod.dark > 0.3 ? '#ffd98a' : '#bfe3f2'); ell(ctx, x - 2, y0 - 50, 1.4, 2.4, 'rgba(255,255,255,0.6)'); });
  // lighthouse lantern on the ridge
  const lx = CX;
  ctx.fillStyle = '#f4efe6'; ctx.beginPath(); ctx.moveTo(lx - 12, peak + 16); ctx.lineTo(lx - 9, peak - 22); ctx.lineTo(lx + 9, peak - 22); ctx.lineTo(lx + 12, peak + 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d9534f'; [peak - 14, peak + 2].forEach((yy) => ctx.fillRect(lx - 10.5 + (yy - peak) * 0.04, yy, 21 - (yy - peak) * 0.08, 7));
  fillRR(ctx, lx - 13, peak - 26, 26, 4, 1, '#3a3440');
  ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 0.8; for (let x = lx - 12; x <= lx + 12; x += 4) { ctx.beginPath(); ctx.moveTo(x, peak - 26); ctx.lineTo(x, peak - 31); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(lx - 13, peak - 31); ctx.lineTo(lx + 13, peak - 31); ctx.stroke();
  fillRR(ctx, lx - 7, peak - 40, 14, 14, 2, tod.dark > 0.3 ? '#fff3b0' : '#bfe3f2');
  ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, peak - 40); ctx.lineTo(lx, peak - 26); ctx.stroke();
  ctx.fillStyle = '#d9534f'; ctx.beginPath(); ctx.moveTo(lx - 9, peak - 40); ctx.quadraticCurveTo(lx, peak - 54, lx + 9, peak - 40); ctx.closePath(); ctx.fill();
  if (tod.dark > 0.3) {
    const a = t * 0.9;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [1, -1].forEach((dir) => {
      const g = ctx.createLinearGradient(lx, peak - 33, lx + Math.cos(a) * 200 * dir, peak - 33);
      g.addColorStop(0, `rgba(255,240,170,${0.4 * tod.dark})`); g.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx, peak - 33); ctx.lineTo(lx + Math.cos(a) * 200 * dir, peak - 57); ctx.lineTo(lx + Math.cos(a) * 200 * dir, peak - 9); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }
  // life ring on the gable
  circ(ctx, BX1 - 36, y0 - 20, 8, '#f4efe6'); circ(ctx, BX1 - 36, y0 - 20, 4.4, '#4f6f90');
  ctx.strokeStyle = '#d9534f'; ctx.lineWidth = 3; [0.3, 1.9, 3.5, 5.1].forEach((a) => { ctx.beginPath(); ctx.arc(BX1 - 36, y0 - 20, 6.2, a, a + 0.5); ctx.stroke(); });
  roofSign(ctx, y0, name);
  vane(ctx, lx, peak - 52, t);
  return { ...ch, eaves: [...edge(...L0, CX, peak), ...edge(CX, peak, ...R0).slice(1)], peak: peak - 52 };
}

/* ---------------- Willow Pond: a mossy boathouse with a curved roof ---------------- */
function pondRoof(ctx, y0, t, tod, name, opts) {
  const top = y0 - 98; const ox = 24;
  const shape = () => { ctx.beginPath(); ctx.moveTo(BX0 - ox, y0 + 6); ctx.quadraticCurveTo(BX0 + 30, y0 - 58, CX, top); ctx.quadraticCurveTo(BX1 - 30, y0 - 58, BX1 + ox, y0 + 6); ctx.closePath(); };
  // stovepipe chimney
  ctx.fillStyle = '#4a4a52'; ctx.fillRect(BX1 - 92, top + 18, 9, 50); fillRR(ctx, BX1 - 96, top + 12, 17, 8, 2, '#3a3a42');
  const ch = { chimneyX: BX1 - 87.5, chimneyY: top + 8 };
  ctx.fillStyle = '#56733f'; shape(); ctx.fill();
  ctx.save(); shape(); ctx.clip();
  for (let y = top + 6, row = 0; y < y0 + 8; y += 9, row++) for (let x = BX0 - ox + (row % 2) * 7; x < BX1 + ox; x += 14) {
    ctx.fillStyle = row % 3 === 0 ? '#4b6636' : '#5f7d48'; ctx.beginPath(); ctx.arc(x + 7, y, 7, 0, Math.PI); ctx.fill();
  }
  const R = rng(29);
  for (let k = 0; k < 14; k++) ell(ctx, BX0 + R() * (BX1 - BX0), top + 20 + R() * 80, 6 + R() * 8, 3 + R() * 2, 'rgba(150,185,90,0.55)');
  ctx.restore();
  ctx.strokeStyle = '#6b4a34'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(BX0 - ox, y0 + 6); ctx.quadraticCurveTo(BX0 + 30, y0 - 58, CX, top); ctx.quadraticCurveTo(BX1 - 30, y0 - 58, BX1 + ox, y0 + 6); ctx.stroke();
  // upturned eave tips
  [[BX0 - ox, -1], [BX1 + ox, 1]].forEach(([x, d]) => { ctx.strokeStyle = '#6b4a34'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y0 + 6); ctx.quadraticCurveTo(x + d * 8, y0 + 4, x + d * 10, y0 - 4); ctx.stroke(); });
  if (opts.winter) { ctx.fillStyle = '#f7fafc'; ctx.beginPath(); ctx.moveTo(BX0 - ox + 4, y0 + 2); ctx.quadraticCurveTo(BX0 + 30, y0 - 62, CX, top - 4); ctx.quadraticCurveTo(BX1 - 30, y0 - 62, BX1 + ox - 4, y0 + 2); ctx.quadraticCurveTo(BX1 - 34, y0 - 50, CX, top + 10); ctx.quadraticCurveTo(BX0 + 34, y0 - 50, BX0 - ox + 4, y0 + 2); ctx.fill(); }
  glowWindow(ctx, CX, y0 - 60, 12, tod, '#6b4a34');
  // paper lanterns along the eaves
  [BX0 - 6, BX0 + 26, BX1 - 26, BX1 + 6].forEach((x, k) => {
    const y = y0 + 8; ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
    ell(ctx, x, y + 10 + Math.sin(t * 1.5 + k) * 0.6, 5, 6.5, tod.dark > 0.3 ? '#ffb070' : '#e0604a');
    fillRR(ctx, x - 2.5, y + 3, 5, 1.6, 0.5, '#3a2a20'); fillRR(ctx, x - 2.5, y + 16, 5, 1.6, 0.5, '#3a2a20');
  });
  roofSign(ctx, y0, name);
  vane(ctx, CX, top, t);
  const eaves = []; for (let k = 0; k <= 32; k++) { const u = k / 32; const x = BX0 - ox + (BX1 - BX0 + ox * 2) * u; const a = u < 0.5 ? u * 2 : (1 - u) * 2; eaves.push([x, y0 + 6 - (y0 + 6 - top) * (1 - Math.pow(1 - a, 2))]); }
  return { ...ch, eaves, peak: top };
}

/* ---------------- Moonlit Castle: a stone keep with two turrets ---------------- */
function castleRoof(ctx, y0, t, tod, name, opts) {
  const wallTop = y0 - 46;
  // parapet wall
  ctx.fillStyle = '#9894ad'; ctx.fillRect(BX0 - 6, wallTop, BX1 - BX0 + 12, y0 + 4 - wallTop);
  stones(ctx, BX0 - 6, wallTop, BX1 - BX0 + 12, y0 + 4 - wallTop, 13);
  for (let x = BX0 - 6; x < BX1 + 6; x += 24) { ctx.fillStyle = '#9894ad'; ctx.fillRect(x, wallTop - 13, 14, 14); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 12, wallTop - 13, 2, 14); if (opts.winter) fillRR(ctx, x - 1, wallTop - 15, 16, 3.5, 1.5, '#f7fafc'); }
  // banners on the parapet
  [BX0 + 44, BX1 - 44].forEach((x) => { ctx.fillStyle = '#e0b84f'; ctx.fillRect(x - 11, wallTop + 2, 22, 2.4); ctx.fillStyle = '#6d5fa3'; ctx.beginPath(); ctx.moveTo(x - 9, wallTop + 4); ctx.lineTo(x + 9, wallTop + 4); ctx.lineTo(x + 9, wallTop + 34); ctx.lineTo(x, wallTop + 28); ctx.lineTo(x - 9, wallTop + 34); ctx.closePath(); ctx.fill(); star(ctx, x, wallTop + 16, 4, '#f2d27a'); });
  // turrets
  const turret = (x) => {
    const w = 36; const tt = y0 - 104;
    ctx.fillStyle = '#a3a0b8'; ctx.fillRect(x - w / 2, tt, w, y0 + 4 - tt);
    stones(ctx, x - w / 2, tt, w, y0 + 4 - tt, 11);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(x + w / 2 - 6, tt, 6, y0 + 4 - tt);
    fillRR(ctx, x - 4, tt + 30, 8, 16, 4, tod.dark > 0.3 ? '#ffd98a' : '#3a3450');
    ctx.fillStyle = '#6d5fa3'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 5, tt + 2); ctx.lineTo(x, tt - 44); ctx.lineTo(x + w / 2 + 5, tt + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.moveTo(x, tt - 44); ctx.lineTo(x + w / 2 + 5, tt + 2); ctx.lineTo(x + 6, tt + 2); ctx.closePath(); ctx.fill();
    if (opts.winter) { ctx.fillStyle = '#f7fafc'; ctx.beginPath(); ctx.moveTo(x - 8, tt - 30); ctx.lineTo(x, tt - 44); ctx.lineTo(x + 8, tt - 30); ctx.quadraticCurveTo(x, tt - 26, x - 8, tt - 30); ctx.fill(); }
    ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, tt - 44); ctx.lineTo(x, tt - 62); ctx.stroke();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(x, tt - 62); ctx.lineTo(x + 14 + Math.sin(t * 3 + x) * 2, tt - 57); ctx.lineTo(x, tt - 52); ctx.fill();
  };
  turret(BX0 + 4); turret(BX1 - 4);
  roofSign(ctx, y0, name);
  // a tiny keep chimney for the reading-room fire
  const ch = chimney(ctx, CX + 54, wallTop - 26, 26, '#8d8aa3', '#6d6a80');
  vane(ctx, CX, wallTop - 13, t);
  const eaves = [...edge(BX0 + 22, wallTop - 13, BX1 - 22, wallTop - 13, 24)];
  return { ...ch, eaves, peak: y0 - 166 };
}
function stones(ctx, x, y, w, h, bh) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = 'rgba(70,64,90,0.35)'; ctx.lineWidth = 0.8;
  for (let yy = y, row = 0; yy < y + h; yy += bh, row++) {
    ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
    for (let xx = x + (row % 2) * (bh * 0.9); xx < x + w; xx += bh * 1.8) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + bh); ctx.stroke(); }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; for (let yy = y + 1; yy < y + h; yy += bh) ctx.fillRect(x, yy, w, 1);
  ctx.restore();
}
function snowRidge(ctx, L0, P, R0) {
  ctx.fillStyle = '#f7fafc';
  ctx.beginPath(); ctx.moveTo(L0[0] - 2, L0[1] - 2); ctx.lineTo(P[0], P[1] - 4); ctx.lineTo(R0[0] + 2, R0[1] - 2);
  ctx.lineTo(R0[0] - 10, R0[1] - 8); ctx.lineTo(P[0], P[1] + 12); ctx.lineTo(L0[0] + 10, L0[1] - 8); ctx.closePath(); ctx.fill();
}

export function drawBuildingRoof(ctx, scene, y0, t, tod, name, opts) {
  switch (scene) {
    case 'windmill': return windmillRoof(ctx, y0, t, tod, name, opts);
    case 'cove': return coveRoof(ctx, y0, t, tod, name, opts);
    case 'pond': return pondRoof(ctx, y0, t, tod, name, opts);
    case 'castle': return castleRoof(ctx, y0, t, tod, name, opts);
    default: return null;
  }
}

/* ---------------- outer walls of each floor (cached with the room art) ---------------- */
export const BEAM = { meadow: '#5b3a26', windmill: '#5b3a26', cove: '#4f5a66', pond: '#4e3d2a', castle: '#6d6a80' };
export function paintSides(ctx, scene) {
  const both = (fn) => { fn(0); fn(WALL + (BX1 - BX0 - WALL * 2)); };
  const overlay = { meadow: 'bark', windmill: 'plaster', cove: 'boards', pond: 'bark', castle: 'rock' }[scene] || 'bark';
  const finish = () => both((x) => texRect(ctx, overlay, x, 0, WALL, FH, 0.9));
  switch (scene) {
    case 'windmill': both((x) => { ctx.fillStyle = '#efe3cf'; ctx.fillRect(x, 0, WALL, FH); ctx.fillStyle = '#7a4b2e'; ctx.fillRect(x + (x ? WALL - 2.5 : 0), 0, 2.5, FH); ctx.strokeStyle = '#7a4b2e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x + WALL, 90); ctx.moveTo(x + WALL, 100); ctx.lineTo(x, 170); ctx.stroke(); }); break;
    case 'cove': both((x) => { ctx.fillStyle = '#4f7fa8'; ctx.fillRect(x, 0, WALL, FH); ctx.fillStyle = '#3f6f98'; for (let y = 5; y < FH; y += 7) ctx.fillRect(x, y, WALL, 1.2); ctx.fillStyle = '#f4efe6'; ctx.fillRect(x + (x ? WALL - 1.8 : 0), 0, 1.8, FH); }); break;
    case 'pond': both((x) => { ctx.fillStyle = '#6b5a3a'; ctx.fillRect(x, 0, WALL, FH); for (let y = 0; y < FH; y += 9) { fillRR(ctx, x + 0.5, y + 0.5, WALL - 1, 8, 3.5, '#7d6a45'); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + 1, y + 7, WALL - 2, 1); } const R = rng(x + 7); for (let k = 0; k < 5; k++) ell(ctx, x + WALL / 2, R() * FH, 3.4, 5, 'rgba(130,170,80,0.7)'); }); break;
    case 'castle': both((x) => { ctx.fillStyle = '#8d8aa3'; ctx.fillRect(x, 0, WALL, FH); ctx.fillStyle = 'rgba(60,55,80,0.4)'; for (let y = 0, r = 0; y < FH; y += 11, r++) { ctx.fillRect(x, y, WALL, 1); ctx.fillRect(x + (r % 2 ? 3 : 6), y, 1, 11); } }); break;
    default: // meadow: warm timber with a little grain
      both((x) => { ctx.fillStyle = '#7b5236'; ctx.fillRect(x, 0, WALL, FH); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 1, 0, 2, FH); ctx.fillStyle = 'rgba(60,35,20,0.25)'; for (let y = 12; y < FH; y += 23) ctx.fillRect(x + 4.5, y, 1, 8); });
  }
  finish();
}
