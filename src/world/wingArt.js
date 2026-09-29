// The wings beside the library tower: café, community hall, printing press and museum.
// Static parts (walls, roof, furniture) are painted once into cached canvases per wing: a back
// layer and a front layer (the café counter, so the barista can stand behind it). The mice live in
// wingSim.js; lights, smoke, outdoor extras and the "ready!" bubble are drawn live here.
import { PLOTS, WING_W, STOREY_H, wingStoreys } from '../data/wings.js';
import { rr, fillRR, ell, circ, shade, rng, star, drawMouse, coinIcon } from './draw.js';
import { drawFossil, drawSauropod, drawRex } from './creatures.js';
import { texRect, texFill } from './textures.js';
import { glow } from './glow.js';

const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';
const ROOF_H = 58;
export const SIDE = 8;
// storey-local layout: back wall 0..96, floor 96..110, beam 110..130
export const WALL_B = 96; const FLOOR_B = 110;
export const INNER_W = WING_W - SIDE * 2;
// where the chairs of the Community Hall stand (facing the stage)
export const HALL_CHAIRS = [104, 120, 136, 152];

export const wingX = (w) => PLOTS[w.plot].x0;
export const wingHeight = (st) => wingStoreys(st.lvl || 1) * STOREY_H;
// Screen-tappable box of a wing in world units.
export function wingBox(w, st) {
  const x0 = wingX(w); const h = st.built ? wingHeight(st) : STOREY_H;
  return { x0, x1: x0 + WING_W, y0: -h - ROOF_H - 10, y1: 6 };
}
const has = (st, k) => !!st.decor?.[k];

/* ---------------- cached static art ---------------- */
export function wingArtKey(w, st, found, winter, extra = '') {
  const bits = (a) => (a || []).map((d) => (d ? 1 : 0)).join('');
  return `${w.id}|${wingStoreys(st.lvl)}|${bits(st.decor)}|${(st.up || []).map(bits).join('.')}|${found}|${winter ? 1 : 0}|${extra}`;
}
// Paints the whole wing (back layer) into ctx with origin at the building's bottom-left (ground).
export function paintWing(ctx, w, st, opts = {}) {
  const n = wingStoreys(st.lvl); const H = n * STOREY_H;
  // foundation
  ctx.fillStyle = '#9d9486'; ctx.fillRect(-4, -2, WING_W + 8, 9);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 4; x < WING_W; x += 20) ctx.fillRect(x, -2, 1.2, 9);
  for (let k = 0; k < n; k++) {
    ctx.save(); ctx.translate(0, -(k + 1) * STOREY_H);
    paintStorey(ctx, w, st, k, opts);
    ctx.restore();
  }
  sideWall(ctx, w, 0, -H, H); sideWall(ctx, w, WING_W - SIDE, -H, H);
  ctx.save(); ctx.translate(0, -H); paintRoof(ctx, w, st, opts); ctx.restore();
}
// Front layer: things that stand in front of the staff.
export function paintWingFront(ctx, w, st) {
  if (w.id !== 'cafe') return;
  ctx.save(); ctx.translate(SIDE, -STOREY_H);
  // the café counter (the barista stands behind it)
  fillRR(ctx, 118, 62, 66, 34, 2, '#8a5a3a'); texRect(ctx, 'boards', 118, 66, 66, 30, 0.8);
  ctx.fillStyle = shade(w.pal.trim, 0.1); ctx.fillRect(116, 60, 70, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 128; x < 182; x += 16) ctx.fillRect(x, 68, 1, 26);
  fillRR(ctx, 124, 72, 26, 14, 2, '#6b4128'); ctx.fillStyle = '#e8c465'; ctx.font = `700 5.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ORDER', 137, 79.5);
  coinIcon(ctx, 170, 58, 2.6); coinIcon(ctx, 174, 59, 2.2);
  ctx.restore();
}

function sideWall(ctx, w, x, y, h) {
  const pal = w.pal;
  if (w.id === 'museum') {
    // fluted stone pillars
    fillRR(ctx, x - 3, y, SIDE + 6, h, 2, '#e9e1cf');
    ctx.fillStyle = 'rgba(120,100,70,0.18)'; for (let k = 1; k < 5; k++) ctx.fillRect(x - 2 + k * 2.4, y + 6, 0.8, h - 12);
    fillRR(ctx, x - 5, y, SIDE + 10, 6, 1.5, '#d9cfb8'); fillRR(ctx, x - 5, y + h - 6, SIDE + 10, 6, 1.5, '#d9cfb8');
    return;
  }
  ctx.fillStyle = w.id === 'press' ? '#9a5a44' : shade(pal.trim, -0.05);
  ctx.fillRect(x, y, SIDE, h);
  texRect(ctx, w.id === 'press' ? 'brick' : 'boards', x, y, SIDE, h, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 1, y, 1.5, h);
}

function wallpaper(ctx, w, st, k, W) {
  const pal = w.pal;
  ctx.fillStyle = pal.wall; ctx.fillRect(0, 0, W, WALL_B);
  switch (w.id) {
    case 'cafe':
      // cream plaster with a band of little teacups; white tiles below
      for (let x = 22; x < W; x += 26) { fillRR(ctx, x, 20, 8, 6, 2, pal.wall2); ctx.fillStyle = pal.wall2; ctx.fillRect(x + 7, 21.5, 2.5, 2); }
      ctx.fillStyle = '#fbf8f2'; ctx.fillRect(0, 56, W, WALL_B - 56);
      ctx.fillStyle = 'rgba(120,110,100,0.18)';
      for (let y = 56; y < WALL_B; y += 6) ctx.fillRect(0, y, W, 0.7);
      for (let y = 56, r = 0; y < WALL_B; y += 6, r++) for (let x = (r % 2) * 6; x < W; x += 12) ctx.fillRect(x, y, 0.7, 6);
      fillRR(ctx, 0, 54, W, 3, 1, pal.trim);
      break;
    case 'hall':
      for (let x = 0; x < W; x += 16) { ctx.fillStyle = pal.wall2; ctx.fillRect(x, 0, 8, WALL_B); }
      fillRR(ctx, 0, 60, W, 3, 1, pal.trim);
      ctx.fillStyle = shade(pal.wall2, -0.04); ctx.fillRect(0, 63, W, WALL_B - 63);
      break;
    case 'press':
      ctx.fillStyle = '#c98b6a'; ctx.fillRect(0, 0, W, WALL_B); texRect(ctx, 'brick', 0, 0, W, WALL_B, 1.4);
      ctx.fillStyle = 'rgba(40,30,30,0.12)'; ctx.fillRect(0, 0, W, 10);
      break;
    default: // museum: warm stone blocks and a velvet dado
      for (let y = 0, r = 0; y < WALL_B; y += 16, r++) for (let x = (r % 2) * 20 - 20; x < W; x += 40) { ctx.fillStyle = r % 2 ? pal.wall2 : shade(pal.wall2, 0.03); ctx.fillRect(x + 0.6, y + 0.6, 39, 15); }
      ctx.fillStyle = '#7a2f3a'; ctx.fillRect(0, WALL_B - 18, W, 18); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, WALL_B - 18, W, 2);
      if (has(st, 2)) { // star-map ceiling
        ctx.fillStyle = '#23305a'; ctx.fillRect(0, 0, W, 16); const R = rng(k + 9);
        for (let j = 0; j < 22; j++) star(ctx, R() * W, 2 + R() * 12, 0.8 + R() * 1.2, R() < 0.3 ? '#ffe9a3' : '#dfe6ff');
        ctx.strokeStyle = 'rgba(255,233,163,0.45)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(40, 5); ctx.lineTo(52, 9); ctx.lineTo(66, 4); ctx.lineTo(78, 10); ctx.stroke();
      }
  }
  texRect(ctx, 'plaster', 0, 0, W, WALL_B, 1);
  const g = ctx.createLinearGradient(0, 0, 0, 20); g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 20);
}

// The little arched door visitors come in by (left wall).
function door(ctx, w) {
  const col = w.id === 'museum' ? '#7a5a3a' : shade(w.pal.trim, -0.2);
  ctx.fillStyle = '#3a2a20'; ctx.beginPath(); ctx.moveTo(2, WALL_B); ctx.lineTo(2, 66); ctx.arc(10, 66, 8, Math.PI, 0); ctx.lineTo(18, WALL_B); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
  const g = ctx.createRadialGradient(10, WALL_B - 6, 1, 10, WALL_B - 6, 14); g.addColorStop(0, 'rgba(255,220,150,0.45)'); g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g; ctx.fill();
  fillRR(ctx, 0, WALL_B + 1, 22, 3, 1.5, w.id === 'cafe' ? '#b5523b' : '#7a8a5a'); // doormat
}

function floorBoards(ctx, w, W, k) {
  const pal = w.pal;
  ctx.fillStyle = pal.floor; ctx.fillRect(0, WALL_B, W, FLOOR_B - WALL_B);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = WALL_B + 4.5; y < FLOOR_B; y += 4.5) ctx.fillRect(0, y, W, 0.8);
  const R = rng(k * 13 + w.plot * 7 + 3);
  for (let y = WALL_B, r = 0; y < FLOOR_B; y += 4.5, r++) for (let x = (r % 2) * 14 + R() * 8; x < W; x += 30 + R() * 10) ctx.fillRect(x, y, 0.8, 4.5);
  const fg = ctx.createLinearGradient(0, WALL_B, 0, WALL_B + 6); fg.addColorStop(0, 'rgba(0,0,0,0.22)'); fg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fg; ctx.fillRect(0, WALL_B, W, 6);
  ctx.fillStyle = '#5b3a26'; ctx.fillRect(-SIDE, FLOOR_B, W + SIDE * 2, STOREY_H - FLOOR_B);
  ctx.fillStyle = '#704a31'; ctx.fillRect(-SIDE, FLOOR_B, W + SIDE * 2, 2.5);
  texRect(ctx, 'boards', -SIDE, FLOOR_B + 2.5, W + SIDE * 2, STOREY_H - FLOOR_B - 2.5, 0.8);
}

function windowArch(ctx, x, y, ww, wh, frame) {
  const path = () => { ctx.beginPath(); ctx.moveTo(x, y + wh); ctx.lineTo(x, y + ww / 2); ctx.arc(x + ww / 2, y + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(x + ww, y + wh); ctx.closePath(); };
  path(); ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = 'rgba(200,225,255,0.12)'; ctx.fill();
  ctx.strokeStyle = frame; ctx.lineWidth = 2.6; path(); ctx.stroke();
  ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + ww / 2, y); ctx.lineTo(x + ww / 2, y + wh); ctx.moveTo(x, y + wh * 0.6); ctx.lineTo(x + ww, y + wh * 0.6); ctx.stroke();
  fillRR(ctx, x - 3, y + wh - 1, ww + 6, 4, 1.2, frame);
}

function bookshelf(ctx, x, top, w, bot, cols, seed) {
  const R = rng(seed);
  fillRR(ctx, x - 2, top - 2, w + 4, bot - top + 2, 2, '#6b4128');
  ctx.fillStyle = '#3a2418'; ctx.fillRect(x, top, w, bot - top);
  for (let y = top + 16; y <= bot; y += 16) {
    let bx = x + 1.5;
    while (bx < x + w - 3) { const bw = 2.6 + R() * 2.4; const bh = 10 + R() * 4; ctx.fillStyle = cols[Math.floor(R() * cols.length)]; ctx.fillRect(bx, y - bh, bw, bh); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bx, y - bh, 0.7, bh); bx += bw + 0.5; }
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 1, y, w + 2, 2.4);
  }
}

function roundTable(ctx, x, base, col) {
  ctx.fillStyle = '#6b4128'; ctx.fillRect(x - 1.2, base - 16, 2.4, 16); ell(ctx, x, base, 6, 1.6, '#6b4128');
  ell(ctx, x, base - 16, 13, 3.4, col); ell(ctx, x, base - 17, 12, 2.6, shade(col, 0.15));
  ell(ctx, x + 5, base - 18.2, 3.6, 1.1, '#fbf6ea'); ell(ctx, x + 5, base - 19.6, 2.4, 1.6, '#e8b36a');
  fillRR(ctx, x - 3, base - 21, 3, 3, 0.8, '#e0404f'); // a little vase
  ctx.strokeStyle = '#4f8a44'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 1.5, base - 21); ctx.lineTo(x - 1.5, base - 25); ctx.stroke(); circ(ctx, x - 1.5, base - 25.5, 1.4, '#f7a8c4');
}
export function chair(ctx, x, base, col, dir) {
  ctx.fillStyle = shade(col, -0.2); ctx.fillRect(x - 5, base - 8, 1.6, 8); ctx.fillRect(x + 3.4, base - 8, 1.6, 8);
  fillRR(ctx, x - 6, base - 11, 12, 3, 1, col);
  fillRR(ctx, x + (dir > 0 ? -6 : 3.5), base - 24, 2.6, 14, 1, col);
}

function paintStorey(ctx, w, st, k, opts) {
  const W = INNER_W;
  ctx.save(); ctx.translate(SIDE, 0);
  wallpaper(ctx, w, st, k, W);
  if (k > 0) paintUpper(ctx, w, st, k, W);
  else {
    switch (w.id) {
      case 'cafe': paintCafe(ctx, w, st, k, W); break;
      case 'hall': paintHall(ctx, w, st, k, W); break;
      case 'press': paintPress(ctx, w, st, k, W); break;
      default: paintMuseum(ctx, w, st, k, W, opts.found || []);
    }
  }
  door(ctx, w);
  floorBoards(ctx, w, W, k);
  ctx.restore();
}

/* ---- café ---- */
function fairyLights(ctx, W) {
  ctx.strokeStyle = 'rgba(60,40,30,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath();
  for (let x = 0; x <= W; x += 4) ctx.lineTo(x, 6 + Math.sin((x / W) * Math.PI * 3) * 3 + 3); ctx.stroke();
  for (let x = 6, j = 0; x < W; x += 10, j++) circ(ctx, x, 7 + Math.sin((x / W) * Math.PI * 3) * 3 + 4, 1.6, ['#ffe28a', '#f7a8c4', '#bfe3f2'][j % 3]);
}
function paintCafe(ctx, w, st, k, W) {
  const pal = w.pal;
  windowArch(ctx, 26, 12, 30, 40, pal.trim);
  if (has(st, 0)) { // window flower box
    fillRR(ctx, 22, 51, 38, 6, 1.5, '#8a5a3a');
    for (let j = 0; j < 7; j++) { ctx.strokeStyle = '#4f8a44'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(25 + j * 5, 51); ctx.lineTo(25 + j * 5, 46); ctx.stroke(); circ(ctx, 25 + j * 5, 45.5, 2, ['#e0404f', '#f7a8c4', '#ffd24a'][j % 3]); }
  }
  // pendant lamps
  [84, 106].forEach((x) => { ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 14); ctx.stroke(); ctx.fillStyle = '#c0504d'; ctx.beginPath(); ctx.moveTo(x - 6, 20); ctx.quadraticCurveTo(x, 10, x + 6, 20); ctx.closePath(); ctx.fill(); circ(ctx, x, 20.5, 1.8, '#fff3b0'); });
  if (has(st, 4)) fairyLights(ctx, W);
  if (k === 0) {
    // chalkboard menu (today's specials)
    fillRR(ctx, 124, 8, 52, 34, 2, '#6b4128'); fillRR(ctx, 126.5, 10.5, 47, 29, 1.5, '#2f3a33');
    ctx.fillStyle = '#f4efe6'; ctx.font = `600 5.6px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ['TEA ........ 2', 'SCONES ... 3', 'CHEESE PIE 5'].forEach((l, j) => ctx.fillText(l, 130, 17 + j * 8));
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(166, 34, 3, 0, 7); ctx.stroke();
    // back counter shelf with jars
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(118, 44, 66, 2);
    // cake display on the counter
    fillRR(ctx, 124, 48, 36, 13, 2, 'rgba(210,235,250,0.55)'); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8; rr(ctx, 124, 48, 36, 13, 2); ctx.stroke();
    [[131, '#f7c9d6'], [142, '#f2d27a'], [153, '#c98b52']].forEach(([x, c]) => { fillRR(ctx, x - 4, 53, 8, 7, 2, c); ell(ctx, x, 53, 4, 1.4, shade(c, 0.2)); circ(ctx, x, 51.5, 1.2, '#e0404f'); });
    if (has(st, 1)) {
      // brass espresso machine
      fillRR(ctx, 163, 36, 18, 24, 3, '#c9a227'); fillRR(ctx, 165, 38, 14, 6, 2, '#e8c86a'); ctx.fillStyle = '#6d6a80'; ctx.fillRect(167, 48, 3, 6); ctx.fillRect(174, 48, 3, 6);
      circ(ctx, 172, 41, 2.4, '#fff8e0'); ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(172, 41, 2.4, 0, 7); ctx.stroke();
      ell(ctx, 172, 35, 6, 2, '#b8871c');
    } else {
      fillRR(ctx, 166, 40, 12, 20, 4, '#c98a4a'); ell(ctx, 172, 40, 6, 2, '#e0a864'); ctx.fillStyle = '#6b4128'; ctx.fillRect(170.5, 36, 3, 4);
    }
    // tables
    [36, 84].forEach((x) => { roundTable(ctx, x, WALL_B, '#fff7ec'); chair(ctx, x - 16, WALL_B, '#b5523b', 1); chair(ctx, x + 16, WALL_B, '#b5523b', -1); });
    if (has(st, 2)) {
      // three-tier cake on a pedestal
      ctx.fillStyle = '#e9e1cf'; ctx.fillRect(109, 74, 4, 22); fillRR(ctx, 104, 94, 14, 3, 1, '#d9cfb8'); ell(ctx, 111, 74, 8, 2, '#d9cfb8');
      fillRR(ctx, 104, 64, 14, 9, 2, '#f7c9d6'); fillRR(ctx, 106, 57, 10, 7, 2, '#fff7ec'); fillRR(ctx, 107.5, 51, 7, 6, 2, '#f2d27a');
      for (let j = 0; j < 4; j++) circ(ctx, 105.5 + j * 3.5, 64.5, 1, '#fff');
      circ(ctx, 111, 49.5, 1.6, '#e0404f');
    }
  }
}

/* ---- community hall ---- */
function paintHall(ctx, w, st, k, W) {
  const pal = w.pal;
  const cols = ['#f28b82', '#ffd24a', '#a3d9a5', '#9ec5f0', '#d4b3f0'];
  for (let x = 4, j = 0; x < W - 8; x += 12, j++) { ctx.fillStyle = cols[j % cols.length]; const y = 10 + Math.sin((x / W) * Math.PI) * 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 5, y + 8); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.lineWidth = 0.5; ctx.beginPath(); for (let x = 4; x < W - 8; x += 2) ctx.lineTo(x, 10 + Math.sin((x / W) * Math.PI) * 6); ctx.stroke();
  if (k === 0) {
    // stage with red curtains
    fillRR(ctx, 8, 80, 84, 16, 2, '#8a5a3a'); ctx.fillStyle = '#704a31'; ctx.fillRect(8, 80, 84, 3);
    ctx.fillStyle = '#3a2440'; ctx.fillRect(12, 26, 76, 54);
    ctx.fillStyle = '#b8322f';
    ctx.beginPath(); ctx.moveTo(10, 22); ctx.lineTo(30, 22); ctx.quadraticCurveTo(22, 50, 26, 80); ctx.lineTo(10, 80); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(90, 22); ctx.lineTo(70, 22); ctx.quadraticCurveTo(78, 50, 74, 80); ctx.lineTo(90, 80); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9443f'; ctx.fillRect(8, 20, 84, 7); for (let x = 10; x < 90; x += 8) { ctx.beginPath(); ctx.arc(x + 4, 27, 4, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let x = 13; x < 26; x += 4) ctx.fillRect(x, 30, 1, 48);
    if (has(st, 0)) [[14, 28], [86, 28]].forEach(([x, y]) => { ['#f28b82', '#ffd24a', '#9ec5f0'].forEach((c, j) => { ell(ctx, x + (j - 1) * 5, y - j * 4, 4, 5, c); }); });
    if (has(st, 2)) [26, 50, 74].forEach((x) => { fillRR(ctx, x - 3, 1, 6, 5, 1, '#2a2a30'); ctx.fillStyle = '#fff3b0'; ctx.fillRect(x - 2, 6, 4, 1.2); });
    if (has(st, 3)) { ctx.strokeStyle = '#6b6b78'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(130, 0); ctx.lineTo(130, 16); ctx.stroke(); circ(ctx, 130, 21, 5.5, '#cfd6e0'); for (let j = 0; j < 10; j++) { const a = j * 0.63; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(130 + Math.cos(a) * 3.4 - 0.6, 21 + Math.sin(a) * 3.4 - 0.6, 1.2, 1.2); } }
    if (has(st, 4)) { fillRR(ctx, 12, 62, 14, 16, 2, '#e0404f'); ctx.fillStyle = '#fff'; ctx.fillRect(12, 66, 14, 2); fillRR(ctx, 13, 56, 12, 7, 2, 'rgba(230,240,250,0.7)'); for (let j = 0; j < 6; j++) circ(ctx, 15 + j * 1.6, 60 - (j % 2), 1.2, '#fff4c8'); }
    // noticeboard
    fillRR(ctx, 112, 26, 50, 30, 2, '#8a5a3a'); fillRR(ctx, 114.5, 28.5, 45, 25, 1.5, '#d9b98a');
    [[117, 31, '#fff7ec'], [132, 32, '#f7c9d6'], [147, 31, '#bfe3f2'], [121, 42, '#fff3b0'], [139, 43, '#d4f0c8']].forEach(([x, y, c]) => { ctx.fillStyle = c; ctx.fillRect(x, y, 11, 9); circ(ctx, x + 5.5, y + 1, 0.9, '#e0404f'); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 2, y + 4, 7, 0.6); ctx.fillRect(x + 2, y + 6, 5, 0.6); });
    // a row of chairs facing the stage
    HALL_CHAIRS.forEach((x) => chair(ctx, x, WALL_B, '#4f7cac', -1));
    if (has(st, 1)) {
      // a little grand piano at the side
      ctx.fillStyle = '#2a2230'; ctx.beginPath(); ctx.moveTo(164, 70); ctx.lineTo(184, 70); ctx.quadraticCurveTo(186, 80, 176, 82); ctx.lineTo(164, 82); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fbf6ea'; ctx.fillRect(164, 76, 10, 3); ctx.fillStyle = '#1d1b24'; for (let x = 165; x < 174; x += 2) ctx.fillRect(x, 76, 1, 2);
      ctx.fillStyle = '#2a2230'; ctx.fillRect(166, 82, 2, 14); ctx.fillRect(181, 82, 2, 14);
      ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(176, 70); ctx.lineTo(186, 60); ctx.stroke();
    }
  }
}

/* ---- printing press ---- */
function pageLanterns(ctx, W) {
  for (let x = 30, j = 0; x < W; x += 36, j++) { ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 8); ctx.stroke(); ell(ctx, x, 13, 5, 6, '#f4efe6'); ctx.fillStyle = 'rgba(40,40,50,0.35)'; for (let l = 0; l < 3; l++) ctx.fillRect(x - 3, 10 + l * 2.4, 6, 0.5); fillRR(ctx, x - 3, 6.5, 6, 1.5, 0.5, '#e0404f'); }
}
function paintPress(ctx, w, st, k, W) {
  if (has(st, 3)) pageLanterns(ctx, W);
  // drying lines with printed sheets
  ctx.strokeStyle = 'rgba(60,40,30,0.6)'; ctx.lineWidth = 0.6;
  [24].forEach((y) => { ctx.beginPath(); ctx.moveTo(24, y); ctx.quadraticCurveTo(W / 2, y + 5, W - 4, y); ctx.stroke(); });
  for (let x = 30; x < W - 10; x += 16) { const y = 24 + Math.sin(((x - 24) / (W - 28)) * Math.PI) * 4; ctx.fillStyle = '#fbf6ea'; ctx.fillRect(x, y, 9, 12); ctx.fillStyle = 'rgba(40,40,50,0.4)'; for (let l = 0; l < 4; l++) ctx.fillRect(x + 1.5, y + 2 + l * 2.4, 6, 0.6); ctx.fillStyle = '#e0404f'; ctx.fillRect(x + 3.6, y - 1, 1.6, 2.5); }
  if (k === 0) {
    if (has(st, 1)) {
      // type case: a wall of tiny drawers
      fillRR(ctx, 22, 42, 34, 28, 2, '#8a5a3a');
      for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) { fillRR(ctx, 24.5 + x * 6.2, 44.5 + y * 6.2, 5.4, 5.4, 0.8, '#b98457'); ctx.fillStyle = '#3a2a20'; ctx.fillRect(26.6 + x * 6.2, 46.8 + y * 6.2, 1.2, 1); }
    }
    // ink barrels and paper stacks
    [[30, '#3a3440'], [46, '#4f3a6a']].forEach(([x, c]) => { fillRR(ctx, x - 7, 76, 14, 20, 3, c); ctx.fillStyle = '#8a8577'; ctx.fillRect(x - 7, 80, 14, 1.4); ctx.fillRect(x - 7, 90, 14, 1.4); });
    for (let j = 0; j < 6; j++) fillRR(ctx, 152, 90 - j * 3.4, 26, 3, 0.6, j % 2 ? '#f4efe6' : '#e8e1d0');
    for (let j = 0; j < 4; j++) fillRR(ctx, 154, 70 - j * 4, 20, 4, 0.8, ['#b5523b', '#3d7a5a', '#4f7cac', '#e8c465'][j]);
    // the press frame (the wheel and platen move live)
    ctx.fillStyle = '#3a3440'; ctx.fillRect(66, 40, 6, 56); ctx.fillRect(116, 40, 6, 56); fillRR(ctx, 62, 36, 64, 8, 2, '#4a4452');
    fillRR(ctx, 70, 78, 48, 8, 1.5, '#5a5462'); ctx.fillStyle = '#c9a227'; ctx.fillRect(62, 38, 64, 1.5);
    ctx.fillStyle = '#fbf6ea'; ctx.fillRect(74, 74, 40, 4);
    ctx.fillStyle = '#6d6a80'; ctx.fillRect(60, 92, 68, 4);
    if (has(st, 2)) { // conveyor belt from the press to the stacks
      fillRR(ctx, 122, 84, 30, 5, 2, '#3a3440'); for (let x = 125; x < 150; x += 6) circ(ctx, x, 86.5, 1.6, '#8a8577');
      ctx.fillStyle = '#6b6b78'; ctx.fillRect(126, 89, 2, 7); ctx.fillRect(146, 89, 2, 7);
    }
  }
}

/* ---- museum ---- */
export const MUSEUM_SPOTS = [34, 76, 120, 162];
function paintMuseum(ctx, w, st, k, W, found) {
  if (k === 0) {
    fillRR(ctx, W / 2 - 34, has(st, 2) ? 18 : 6, 68, 16, 3, '#7a2f3a'); ctx.fillStyle = '#f2d27a'; ctx.font = `700 7.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FOSSIL HALL', W / 2, (has(st, 2) ? 18 : 6) + 8.5);
    if (has(st, 1)) { // T. rex skull replica mounted high on the wall
      fillRR(ctx, 126, 18, 56, 36, 3, '#8a6a3a'); fillRR(ctx, 129, 21, 50, 30, 2, '#3a2a30');
      ctx.save(); ctx.beginPath(); ctx.rect(129, 21, 50, 30); ctx.clip();
      ctx.translate(132 - 58 * 0.72, 24 + 58 * 0.72); ctx.scale(0.72, 0.72); drawRex(ctx, 0, 0, 1);
      ctx.restore();
    }
    ['ammonite', 'trike', 'ptero', 'smilodon'].forEach((id, j) => {
      const x = MUSEUM_SPOTS[j];
      fillRR(ctx, x - 12, 74, 24, 22, 1.5, '#e9e1cf'); ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(x - 12, 74, 24, 2); fillRR(ctx, x - 14, 72, 28, 4, 1, '#d9cfb8');
      if (found.includes(id)) drawFossil(ctx, id, x, 72, id === 'ptero' ? 0.55 : 0.7);
      else { fillRR(ctx, x - 8, 56, 16, 12, 1.5, '#fbf6ea'); ctx.fillStyle = '#8a6a3a'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x, 62.5); }
      if (has(st, 0)) { fillRR(ctx, x - 7, 82, 14, 5, 1, '#b98a3a'); ctx.fillStyle = '#3a2a10'; ctx.fillRect(x - 5, 84, 10, 0.6); }
    });
    if (has(st, 0)) MUSEUM_SPOTS.forEach((x) => { fillRR(ctx, x - 3, 0, 6, 5, 1, '#2a2a30'); });
    // velvet rope
    ctx.strokeStyle = '#b8322f'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(22, 84); for (let x = 22; x < W - 4; x += 21) ctx.quadraticCurveTo(x + 10, 90, x + 21, 84); ctx.stroke();
    // the guard's stool
    ctx.fillStyle = '#6b4128'; ctx.fillRect(172, 88, 2, 8); ctx.fillRect(180, 88, 2, 8); fillRR(ctx, 170, 86, 14, 3, 1, '#8a5a3a');
  }
}

/* ---------------- upper storeys: every wing has two more rooms ---------------- */
// k = 1 (second storey) or 2 (third storey). Each room has its own setting, and five pieces of
// furniture (st.up[k - 1]) that appear as they're bought.
function hangLamp(ctx, x, len, col) {
  ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 6, len + 6); ctx.quadraticCurveTo(x, len - 4, x + 6, len + 6); ctx.closePath(); ctx.fill(); circ(ctx, x, len + 6.5, 1.8, '#fff3b0');
}
function chandelier(ctx, x, drop, r) {
  ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, drop); ctx.stroke();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, drop + 4, r, r * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
  for (let j = 0; j < 7; j++) { const a = (j / 7) * Math.PI * 2; const cx = x + Math.cos(a) * r; const cy = drop + 4 + Math.sin(a) * r * 0.3; fillRR(ctx, cx - 0.9, cy - 5, 1.8, 5, 0.5, '#fbf6ea'); ell(ctx, cx, cy - 6.5, 0.9, 1.6, '#ffcf5a'); ell(ctx, cx, cy + 3, 0.9, 1.8, 'rgba(210,235,255,0.9)'); }
  ell(ctx, x, drop + 9, 2.2, 3.2, 'rgba(210,235,255,0.95)');
}
function plinth(ctx, x, w, top) { fillRR(ctx, x - w / 2, top, w, WALL_B - top, 1.5, '#e9e1cf'); fillRR(ctx, x - w / 2 - 2, top - 2, w + 4, 3.5, 1, '#d9cfb8'); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x - w / 2, top + 2, w, 2); }
function bunting(ctx, W) {
  const cols = ['#f28b82', '#ffd24a', '#a3d9a5', '#9ec5f0', '#d4b3f0'];
  for (let x = 24, j = 0; x < W - 8; x += 12, j++) { ctx.fillStyle = cols[j % cols.length]; const y = 8 + Math.sin((x / W) * Math.PI) * 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 5, y + 7); ctx.closePath(); ctx.fill(); }
}

function paintUpper(ctx, w, st, k, W) {
  const pal = w.pal; const up = st.up?.[k - 1] || []; const on = (i) => !!up[i];
  const booksCols = ['#b5523b', '#3d7a5a', '#e8c465', '#4f7cac', '#8e3b46'];
  switch (`${w.id}${k}`) {
    /* ☕ Upstairs Tea Room */
    case 'cafe1': {
      windowArch(ctx, 26, 12, 30, 40, pal.trim);
      [64, 112].forEach((x) => { fillRR(ctx, x - 2, 30, 4, 8, 1, '#c9a227'); ell(ctx, x, 27, 3, 4, '#fff3b0'); });
      bookshelf(ctx, 128, 16, 44, 94, booksCols, 55);
      // sofa
      fillRR(ctx, 60, 72, 50, 16, 5, '#7a9e7e'); fillRR(ctx, 56, 64, 10, 24, 4, '#6a8e6e'); fillRR(ctx, 104, 64, 10, 24, 4, '#6a8e6e'); fillRR(ctx, 62, 60, 46, 14, 5, '#86ab8a');
      ctx.fillStyle = '#5a3a26'; ctx.fillRect(60, 88, 3, 8); ctx.fillRect(107, 88, 3, 8);
      if (on(1)) [[70, '#f7c9d6'], [86, '#ffd24a'], [100, '#9ec5f0']].forEach(([x, c]) => { fillRR(ctx, x - 5, 62, 10, 9, 3, c); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 3, 64, 6, 1); });
      roundTable(ctx, 36, WALL_B, '#fff7ec'); chair(ctx, 22, WALL_B, '#b5523b', 1);
      if (on(3)) {
        // a portrait of Chef Gustavo, in the gold frame he insisted on
        fillRR(ctx, 68, 14, 38, 34, 2, '#c9a227'); fillRR(ctx, 71, 17, 32, 28, 1, '#f3d9c9');
        ctx.save(); ctx.beginPath(); ctx.rect(71, 17, 32, 28); ctx.clip();
        drawMouse(ctx, 84, 60, { fur: '#c9b29b', belly: '#f4e9dc', hat: 'chef', scarf: '#c0504d', dir: 1, s: 1.15, pose: 'stand', t: 1, noShadow: true, full: true });
        ctx.restore();
        ctx.fillStyle = '#8a6a2a'; ctx.fillRect(80, 49, 14, 3);
      } else { fillRR(ctx, 72, 20, 30, 22, 2, '#c9a227'); ctx.fillStyle = '#9ed0f0'; ctx.fillRect(75, 23, 24, 16); ctx.fillStyle = '#7cb36b'; ctx.fillRect(75, 33, 24, 6); circ(ctx, 92, 28, 3, '#ffe28a'); }
      if (on(0)) chandelier(ctx, 118, 10, 9); else hangLamp(ctx, 118, 12, '#c0504d');
      if (on(2)) {
        // cake trolley
        ctx.fillStyle = '#c9a227'; ctx.fillRect(112, 72, 1.5, 22); ctx.fillRect(128, 72, 1.5, 22);
        fillRR(ctx, 110, 70, 21, 3, 1, '#e8c86a'); fillRR(ctx, 110, 84, 21, 3, 1, '#e8c86a');
        fillRR(ctx, 113, 62, 7, 8, 2, '#f7c9d6'); fillRR(ctx, 121, 64, 7, 6, 2, '#c98b52'); circ(ctx, 116.5, 61, 1.2, '#e0404f');
        fillRR(ctx, 114, 78, 14, 6, 2, '#f2d27a');
        circ(ctx, 113, 95, 1.8, '#3a3440'); circ(ctx, 128, 95, 1.8, '#3a3440');
      }
      if (on(4)) {
        // potted palms
        fillRR(ctx, 174, 84, 10, 12, 2, '#b5523b'); ctx.strokeStyle = '#6b8e4e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(179, 84); ctx.lineTo(178, 56); ctx.stroke();
        [[-1, -12], [1, -14], [-1.4, -6], [1.2, -8]].forEach(([d, dy], j) => { ctx.fillStyle = j % 2 ? '#5d9450' : '#6ea35a'; ctx.beginPath(); ctx.moveTo(178, 56 + dy / 3); ctx.quadraticCurveTo(178 + d * 12, 50 + dy, 178 + d * 16, 64 + dy / 2); ctx.quadraticCurveTo(178 + d * 8, 56 + dy / 2, 178, 58); ctx.fill(); });
        fillRR(ctx, 30, 50, 12, 4, 1, '#b5523b'); ell(ctx, 36, 47, 6, 4, '#6ea35a');
      }
      break;
    }
    /* 🥐 Pastry Kitchen */
    case 'cafe2': {
      ctx.fillStyle = '#fbf8f2'; ctx.fillRect(0, 0, W, WALL_B);
      ctx.fillStyle = 'rgba(120,110,100,0.16)'; for (let y = 6; y < WALL_B; y += 7) ctx.fillRect(0, y, W, 0.7); for (let y = 0, r = 0; y < WALL_B; y += 7, r++) for (let x = (r % 2) * 7; x < W; x += 14) ctx.fillRect(x, y, 0.7, 7);
      fillRR(ctx, 0, 54, W, 3, 1, pal.trim);
      // the big brick oven
      ctx.fillStyle = '#9b5a44'; ctx.fillRect(148, 0, 14, 30);
      fillRR(ctx, 132, 28, 50, 68, 6, '#b5523b'); texRect(ctx, 'brick', 132, 28, 50, 68, 1.5);
      ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.moveTo(142, 84); ctx.lineTo(142, 62); ctx.arc(157, 62, 15, Math.PI, 0); ctx.lineTo(172, 84); ctx.closePath(); ctx.fill();
      ell(ctx, 157, 80, 12, 4, '#ff9a3c'); ell(ctx, 157, 78, 7, 3, '#ffe28a');
      fillRR(ctx, 138, 84, 38, 4, 1, '#6d6a80');
      // utensil rail
      ctx.fillStyle = '#8a8577'; ctx.fillRect(40, 10, 44, 2);
      ctx.strokeStyle = '#8a8577'; ctx.lineWidth = 1; [[48, 'whisk'], [60, 'ladle'], [72, 'pan']].forEach(([x, kind]) => { ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, 20); ctx.stroke(); if (kind === 'pan') circ(ctx, x, 24, 4.5, '#6d6a80'); else if (kind === 'ladle') circ(ctx, x, 22, 2.2, '#8a8577'); else ell(ctx, x, 23, 2.2, 4, 'rgba(138,133,119,0.6)'); });
      // the worktable, dusted with flour
      fillRR(ctx, 38, 68, 78, 5, 1.5, '#c9a070'); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(42, 73, 3, 23); ctx.fillRect(109, 73, 3, 23);
      ell(ctx, 58, 67, 9, 1.6, 'rgba(255,255,255,0.8)'); ell(ctx, 56, 64, 6, 4, '#f3e3c3'); fillRR(ctx, 64, 62, 16, 3, 1.5, '#b98457');
      if (on(0)) { fillRR(ctx, 20, 26, 16, 68, 1, '#8a5a3a'); for (let y = 40; y < 94; y += 16) { ctx.fillStyle = '#6b4128'; ctx.fillRect(20, y, 16, 2); ell(ctx, 25, y - 3, 4, 2.6, '#d9a060'); ell(ctx, 31, y - 3, 3.5, 2.6, '#c98b52'); } }
      if (on(1)) { ctx.fillStyle = '#e9e1cf'; ctx.fillRect(95, 50, 1.4, 18); [[95, 64, 14], [95, 57, 10], [95, 51, 6]].forEach(([x, y, wd]) => { fillRR(ctx, x - wd / 2, y, wd, 1.6, 0.6, '#e9e1cf'); for (let c = -wd / 2 + 2; c <= wd / 2 - 2; c += 4) { fillRR(ctx, x + c - 1.6, y - 3.4, 3.2, 3.4, 0.8, '#c98b52'); circ(ctx, x + c, y - 4, 1.8, ['#f7c9d6', '#fff7ec', '#c8a8f0'][Math.abs(c) % 3]); } }); }
      if (on(2)) { [24, 38].forEach((y) => { fillRR(ctx, 42, y, 40, 2.4, 0.8, '#8a5a3a'); for (let j = 0; j < 5; j++) { fillRR(ctx, 44 + j * 8, y - 8, 6, 8, 1.5, ['#e0404f', '#f2a13e', '#8e3b46', '#ffd24a', '#7cc46b'][(j + y) % 5]); fillRR(ctx, 44 + j * 8, y - 9.5, 6, 2, 0.6, '#f4efe6'); } }); }
      if (on(3)) { fillRR(ctx, 88, 10, 30, 26, 2, pal.trim); ctx.fillStyle = 'rgba(190,225,245,0.9)'; ctx.fillRect(91, 13, 24, 18); fillRR(ctx, 86, 31, 34, 4, 1, pal.trim); [93, 103, 113].forEach((x, j) => { fillRR(ctx, x - 3, 25, 6, 6, 1.5, '#b5523b'); ell(ctx, x, 23, 4, 3, ['#6ea35a', '#9ccf7a', '#5d9450'][j]); }); }
      if (on(4)) { fillRR(ctx, 116, 48, 14, 48, 1, '#6b4128'); ctx.fillStyle = '#2a1a14'; ctx.fillRect(118, 52, 10, 30); ctx.strokeStyle = '#d9b36a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(123, 52); ctx.lineTo(123, 70); ctx.stroke(); fillRR(ctx, 119, 70, 8, 5, 1, '#fbf6ea'); circ(ctx, 123, 45, 2.4, '#e0b84f'); }
      break;
    }
    /* 🧵 Craft Room */
    case 'hall1': {
      bunting(ctx, W);
      fillRR(ctx, 20, 20, 60, 44, 2, '#8a5a3a');
      const qc = ['#f28b82', '#ffd24a', '#9ec5f0', '#a3d9a5', '#d4b3f0', '#fff7ec'];
      for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) { ctx.fillStyle = qc[(x + y * 2) % qc.length]; ctx.fillRect(23 + x * 11, 23 + y * 10, 10.4, 9.4); }
      windowArch(ctx, 124, 12, 28, 38, pal.trim);
      fillRR(ctx, 100, 70, 80, 5, 1.5, '#b98457'); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(104, 75, 3, 21); ctx.fillRect(173, 75, 3, 21);
      ell(ctx, 132, 68, 5, 3.4, '#e8913a'); ell(ctx, 160, 68, 5, 3.4, '#9ec5f0');
      if (on(0)) { fillRR(ctx, 106, 58, 16, 12, 2, '#3a3440'); fillRR(ctx, 108, 52, 12, 7, 2, '#3a3440'); ctx.fillStyle = '#c9a227'; ctx.fillRect(108, 60, 12, 1.2); circ(ctx, 119, 56, 1.4, '#c0504d'); ctx.fillStyle = '#9ec5f0'; ctx.fillRect(106, 67, 16, 2); }
      if (on(1)) { fillRR(ctx, 50, 88, 22, 8, 2, '#8a8577'); ell(ctx, 61, 88, 12, 2.6, '#6d6a80'); ctx.fillStyle = '#c98b52'; ctx.beginPath(); ctx.moveTo(55, 87); ctx.quadraticCurveTo(54, 78, 58, 76); ctx.lineTo(64, 76); ctx.quadraticCurveTo(68, 78, 67, 87); ctx.closePath(); ctx.fill(); }
      if (on(2)) { ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(30, 96); ctx.lineTo(37, 62); ctx.lineTo(44, 96); ctx.stroke(); fillRR(ctx, 27, 60, 20, 16, 1, '#fbf6ea'); ctx.fillStyle = '#9ed0f0'; ctx.fillRect(29, 62, 16, 7); ctx.fillStyle = '#7cb36b'; ctx.fillRect(29, 69, 16, 5); circ(ctx, 41, 65, 2, '#ffe28a'); }
      if (on(3)) { [30, 46].forEach((y) => { fillRR(ctx, 156, y, 26, 2.4, 0.8, '#8a5a3a'); ['#e0604a', '#4f7cac', '#ffd24a', '#9b6fb0'].forEach((c, j) => { circ(ctx, 160 + j * 6, y - 3.2, 3, c); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(160 + j * 6, y - 3.2, 1.8, 0, 4); ctx.stroke(); }); }); }
      if (on(4)) { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(86, 20, 22, 2); ['#e0404f', '#ffd24a', '#4f7cac', '#f7a8c4', '#7cc46b'].forEach((c, j) => { ctx.fillStyle = c; ctx.fillRect(88 + j * 4, 22, 2.4, 18 + (j % 3) * 5); ctx.beginPath(); ctx.moveTo(88 + j * 4, 40 + (j % 3) * 5); ctx.lineTo(89.2 + j * 4, 37 + (j % 3) * 5); ctx.lineTo(90.4 + j * 4, 40 + (j % 3) * 5); ctx.fill(); }); }
      break;
    }
    /* 💃 Ballroom */
    case 'hall2': {
      ctx.fillStyle = '#f6efe2'; ctx.fillRect(0, 0, W, WALL_B); texRect(ctx, 'plaster', 0, 0, W, WALL_B, 1);
      ctx.strokeStyle = '#d9b36a'; ctx.lineWidth = 1; [[62, 14, 62, 60]].forEach(([x, y, ww, hh]) => { ctx.strokeRect(x, y, ww, hh); });
      fillRR(ctx, 0, 76, W, 3, 1, '#d9b36a'); ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 79, W, WALL_B - 79);
      windowArch(ctx, 24, 10, 24, 58, '#c9a227'); windowArch(ctx, 138, 10, 24, 58, '#c9a227');
      ctx.fillStyle = 'rgba(160,110,50,0.18)'; for (let x = 0; x < W; x += 10) { ctx.beginPath(); ctx.moveTo(x, WALL_B); ctx.lineTo(x + 5, WALL_B + 7); ctx.lineTo(x + 10, WALL_B); ctx.fill(); }
      if (on(1)) { fillRR(ctx, 62, 12, 62, 62, 2, '#c9a227'); ctx.fillStyle = '#cfe6f2'; ctx.fillRect(65, 15, 56, 56); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(70, 70); ctx.lineTo(90, 15); ctx.lineTo(98, 15); ctx.lineTo(78, 70); ctx.fill(); ctx.beginPath(); ctx.moveTo(96, 70); ctx.lineTo(108, 15); ctx.lineTo(112, 15); ctx.lineTo(100, 70); ctx.fill(); }
      else { fillRR(ctx, 76, 22, 34, 26, 2, '#c9a227'); ctx.fillStyle = '#f2d9e6'; ctx.fillRect(79, 25, 28, 20); circ(ctx, 88, 36, 3, '#9b6fb0'); circ(ctx, 97, 36, 3, '#4f7cac'); }
      if (on(0)) chandelier(ctx, 93, 6, 14);
      if (on(2)) { fillRR(ctx, 162, 74, 18, 4, 1, '#8a5a3a'); ctx.fillStyle = '#6b4128'; ctx.fillRect(164, 78, 2, 18); ctx.fillRect(176, 78, 2, 18); fillRR(ctx, 164, 66, 14, 8, 1.5, '#6b4128'); ctx.fillStyle = '#c9a227'; ctx.beginPath(); ctx.moveTo(171, 66); ctx.lineTo(166, 50); ctx.quadraticCurveTo(172, 44, 182, 48); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1d1b24'; ctx.fillRect(166, 64.5, 10, 1.6); }
      if (on(3)) [['#f7a8c4', 0], ['#e8c465', 1]].forEach(([c, j]) => { ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 2 + j * 3); ctx.quadraticCurveTo(46, 22 + j * 4, 93, 4 + j * 3); ctx.quadraticCurveTo(140, 22 + j * 4, W, 2 + j * 3); ctx.stroke(); });
      if (on(4)) { fillRR(ctx, 20, 78, 30, 4, 1, '#fff7ec'); ctx.fillStyle = '#d9cfb8'; ctx.fillRect(22, 82, 2, 14); ctx.fillRect(46, 82, 2, 14); ell(ctx, 35, 76, 7, 3, '#f7a8c4'); ell(ctx, 35, 75, 6, 1.6, '#fbd0de'); [25, 45].forEach((x) => fillRR(ctx, x - 1.6, 72, 3.2, 5, 0.8, 'rgba(210,235,255,0.9)')); }
      break;
    }
    /* 📚 Bindery */
    case 'press1': {
      if (has(st, 3)) pageLanterns(ctx, W);
      fillRR(ctx, 26, 66, 90, 5, 1.5, '#b98457'); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(30, 71, 3, 25); ctx.fillRect(109, 71, 3, 25);
      for (let j = 0; j < 3; j++) fillRR(ctx, 54 + j * 12, 58, 10, 8, 1, booksCols[j]);
      [140, 156, 172].forEach((x, j) => { fillRR(ctx, x - 5, 30, 10, 12, 2, '#8a5a3a'); ctx.fillStyle = ['#e0404f', '#4f7cac', '#ffd24a'][j]; ctx.fillRect(x - 4, 32, 8, 8); });
      bookshelf(ctx, 136, 48, 40, 94, ['#b5523b', '#3d7a5a', '#e8c465', '#4f7cac', '#f4efe6'], 77);
      if (on(0)) { fillRR(ctx, 116, 76, 16, 20, 1.5, '#4a4452'); fillRR(ctx, 114, 72, 20, 4, 1, '#6d6a80'); ctx.strokeStyle = '#9aa0ab'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(116, 72); ctx.lineTo(132, 60); ctx.stroke(); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(118, 69, 12, 3); }
      if (on(1)) { fillRR(ctx, 92, 54, 16, 12, 1.5, '#3a3440'); ctx.fillStyle = '#e8c86a'; ctx.fillRect(94, 50, 12, 4); fillRR(ctx, 98, 44, 4, 7, 1, '#6d6a80'); circ(ctx, 100, 43, 2, '#c9a227'); }
      if (on(2)) { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(26, 18, 44, 2); ctx.fillRect(26, 34, 44, 2); for (let j = 0; j < 5; j++) { fillRR(ctx, 28 + j * 8.4, 20, 7, 12, 1, booksCols[j]); fillRR(ctx, 28 + j * 8.4, 36, 7, 10, 1, booksCols[(j + 2) % 5]); } }
      if (on(3)) { ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1.6; ctx.strokeRect(32, 44, 16, 22); ctx.strokeStyle = '#f4efe6'; ctx.lineWidth = 0.5; for (let x = 35; x < 48; x += 3) { ctx.beginPath(); ctx.moveTo(x, 44); ctx.lineTo(x, 66); ctx.stroke(); } }
      if (on(4)) { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(74, 16, 42, 2); ['#e0404f', '#9b6fb0', '#ffd24a', '#3d7a5a', '#4f7cac', '#f7a8c4'].forEach((c, j) => { ctx.fillStyle = c; ctx.fillRect(76 + j * 6.6, 18, 2.2, 16 + (j % 3) * 4); }); }
      break;
    }
    /* 🗞️ Newsroom */
    case 'press2': {
      ctx.fillStyle = '#e3eadf'; ctx.fillRect(0, 0, W, 56); ctx.fillStyle = '#8a6a4a'; ctx.fillRect(0, 56, W, WALL_B - 56); texRect(ctx, 'boards', 0, 56, W, WALL_B - 56, 1);
      fillRR(ctx, 0, 54, W, 3, 1, '#6b4128'); texRect(ctx, 'plaster', 0, 0, W, 56, 1);
      circ(ctx, 130, 26, 10, '#6b4128'); circ(ctx, 130, 26, 8, '#fbf6ea'); ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(130, 26); ctx.lineTo(130, 20); ctx.moveTo(130, 26); ctx.lineTo(134, 27); ctx.stroke();
      [[24, 58], [66, 100]].forEach(([a, b]) => { fillRR(ctx, a, 72, b - a, 4, 1, '#b98457'); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(a + 2, 76, 3, 20); ctx.fillRect(b - 5, 76, 3, 20); fillRR(ctx, a + 4, 68, 10, 4, 0.6, '#fbf6ea'); });
      if (on(0)) [[44], [86]].forEach(([x]) => { fillRR(ctx, x - 7, 64, 14, 8, 2, '#3a3440'); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(x - 5, 58, 10, 7); ctx.fillStyle = '#6d6a80'; ctx.fillRect(x - 6, 68, 12, 1.4); });
      if (on(1)) { fillRR(ctx, 24, 10, 72, 36, 2, '#6b4128'); fillRR(ctx, 26.5, 12.5, 67, 31, 1.5, '#d9b98a'); ctx.fillStyle = '#1f1f2e'; ctx.font = `700 8px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SCOOP!', 60, 21); [[32, 29], [48, 30], [64, 29], [80, 30]].forEach(([x, y]) => { ctx.fillStyle = '#fbf6ea'; ctx.fillRect(x, y, 12, 11); circ(ctx, x + 6, y + 1, 0.9, '#e0404f'); }); }
      if (on(2)) { fillRR(ctx, 150, 70, 32, 26, 2, '#6b4128'); fillRR(ctx, 150, 68, 32, 3, 1, '#8a5a3a'); fillRR(ctx, 156, 56, 10, 12, 3, '#3a3440'); ctx.fillStyle = '#c9a227'; ctx.fillRect(157, 54, 8, 2); [170, 176].forEach((x) => { fillRR(ctx, x - 2.5, 62, 5, 6, 1, '#fbf6ea'); }); }
      if (on(3)) { ctx.strokeStyle = '#b9b3a8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(110, 6); ctx.lineTo(110, WALL_B); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(109, 5); ctx.stroke(); fillRR(ctx, 106, 40, 8, 12, 3, '#c9a227'); }
      if (on(4)) { ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(114, 96); ctx.lineTo(121, 70); ctx.lineTo(128, 96); ctx.moveTo(121, 70); ctx.lineTo(121, 96); ctx.stroke(); fillRR(ctx, 113, 60, 16, 11, 2, '#3a3440'); circ(ctx, 121, 65.5, 3.4, '#9aa0ab'); circ(ctx, 121, 65.5, 1.8, '#1d1b24'); fillRR(ctx, 125, 55, 6, 5, 1, '#e8e1d0'); }
      break;
    }
    /* 🦕 Grand Gallery */
    case 'museum1': {
      drawSauropod(ctx, W / 2 + 16, 84, 0.62);
      fillRR(ctx, 20, 30, 28, 36, 2, '#8a6a3a'); ctx.fillStyle = '#f4efe6'; ctx.fillRect(23, 33, 22, 30); ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let l = 0; l < 6; l++) ctx.fillRect(25, 37 + l * 4, 18, 0.6);
      ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(150, 96); ctx.lineTo(158, 60); ctx.lineTo(166, 96); ctx.stroke();
      fillRR(ctx, 147, 58, 22, 18, 1, '#fbf6ea'); ctx.fillStyle = '#7cb36b'; ctx.fillRect(149, 68, 18, 6); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(150, 68); ctx.quadraticCurveTo(156, 60, 162, 66); ctx.stroke();
      if (on(0)) [[56, '#f2a13e'], [76, '#4f7cac']].forEach(([x, c]) => { fillRR(ctx, x, 10, 18, 18, 1.5, '#6b4128'); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(x + 2, 12, 14, 14); ell(ctx, x + 6.5, 19, 3, 4, c, -0.4); ell(ctx, x + 11.5, 19, 3, 4, c, 0.4); ctx.fillStyle = '#1d1b24'; ctx.fillRect(x + 8.5, 15, 1, 8); });
      if (on(1)) { plinth(ctx, 122, 16, 80); ctx.fillStyle = '#4a4050'; ctx.beginPath(); ctx.moveTo(114, 79); ctx.lineTo(116, 71); ctx.lineTo(123, 68); ctx.lineTo(130, 72); ctx.lineTo(129, 79); ctx.closePath(); ctx.fill(); circ(ctx, 120, 73, 1, '#8a8577'); circ(ctx, 126, 75, 1.2, '#6d6478'); }
      if (on(2)) { fillRR(ctx, 100, 8, 42, 26, 1, '#e8d6b0'); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 0.6; ctx.strokeRect(100, 8, 42, 26); ctx.strokeStyle = '#6b8e4e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(104, 26); ctx.quadraticCurveTo(114, 14, 124, 22); ctx.quadraticCurveTo(132, 28, 138, 14); ctx.stroke(); ctx.fillStyle = '#b5523b'; ctx.beginPath(); ctx.arc(134, 26, 3, 0, 7); ctx.fill(); }
      if (on(3)) { fillRR(ctx, 170, 30, 14, 66, 1.5, '#8a5a3a'); ctx.fillStyle = 'rgba(210,235,255,0.55)'; ctx.fillRect(172, 32, 10, 62); [44, 60, 76].forEach((y, j) => { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(172, y, 10, 1.2); ell(ctx, 177, y - 3, 3, 2.4, ['#f7c9b6', '#fbe7c6', '#f2d7e8'][j]); }); }
      if (on(4)) { plinth(ctx, 66, 16, 82); ell(ctx, 66, 76, 7, 6, '#8a8577'); ell(ctx, 66, 76, 5, 4, '#9b6fb0'); for (let j = 0; j < 5; j++) { ctx.fillStyle = '#d4b3f0'; ctx.beginPath(); ctx.moveTo(62 + j * 2, 79); ctx.lineTo(63 + j * 2, 73); ctx.lineTo(64 + j * 2, 79); ctx.fill(); } }
      break;
    }
    /* 🌌 Planetarium */
    case 'museum2': {
      ctx.fillStyle = '#1f2a52'; ctx.fillRect(0, 0, W, WALL_B);
      ctx.fillStyle = '#2b3a6a'; ctx.beginPath(); ctx.ellipse(W / 2, WALL_B, W / 2 + 10, 88, 0, Math.PI, 0); ctx.fill();
      const R = rng(7); for (let j = 0; j < 40; j++) star(ctx, R() * W, R() * 80, 0.6 + R() * 1.3, R() < 0.25 ? '#ffe9a3' : '#dfe6ff');
      ctx.strokeStyle = 'rgba(255,233,163,0.4)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(24, 30); ctx.lineTo(36, 24); ctx.lineTo(48, 32); ctx.lineTo(60, 26); ctx.stroke();
      [[40, 80], [100, 140]].forEach(([a, b]) => { fillRR(ctx, a, 86, b - a, 5, 2, '#6b4d37'); ctx.fillStyle = '#5a3a26'; ctx.fillRect(a + 3, 91, 3, 5); ctx.fillRect(b - 6, 91, 3, 5); });
      if (on(0)) { ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(158, 96); ctx.lineTo(166, 74); ctx.lineTo(174, 96); ctx.stroke(); ctx.save(); ctx.translate(166, 72); ctx.rotate(-0.7); fillRR(ctx, -4, -3.5, 26, 7, 3, '#c9a227'); fillRR(ctx, 18, -4.5, 6, 9, 2, '#b8871c'); ctx.restore(); }
      if (on(1)) { ctx.strokeStyle = 'rgba(232,200,106,0.8)'; ctx.lineWidth = 0.7; [10, 17, 24].forEach((r) => { ctx.beginPath(); ctx.ellipse(92, 34, r, r * 0.35, 0, 0, Math.PI * 2); ctx.stroke(); }); circ(ctx, 92, 34, 4.5, '#ffcf3f'); [[102, 35, 1.8, '#9ec5f0'], [76, 32, 2.2, '#e0604a'], [112, 37, 2.6, '#e8c465']].forEach(([x, y, r, c]) => circ(ctx, x, y, r, c)); ctx.strokeStyle = '#8a6a2a'; ctx.beginPath(); ctx.moveTo(92, 0); ctx.lineTo(92, 29); ctx.stroke(); }
      if (on(2)) { plinth(ctx, 30, 16, 80); ell(ctx, 30, 76, 6, 4, '#b9b3c9'); circ(ctx, 28, 75, 1, '#8d8aa3'); circ(ctx, 32, 77, 1.2, '#8d8aa3'); }
      if (on(3)) { ctx.strokeStyle = '#8a8577'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(66, 0); ctx.lineTo(66, 12); ctx.stroke(); circ(ctx, 66, 14, 3, '#dfe6ff'); ctx.fillStyle = 'rgba(223,230,255,0.5)'; ctx.beginPath(); ctx.moveTo(66, 12); ctx.lineTo(40, 8); ctx.lineTo(42, 16); ctx.closePath(); ctx.fill(); }
      if (on(4)) [[120, 10, 3, '#e0604a'], [134, 14, 4, '#9ec5f0'], [146, 9, 2.4, '#f2d27a']].forEach(([x, y, r, c]) => { ctx.strokeStyle = '#8a8577'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - r); ctx.stroke(); circ(ctx, x, y, r, c); });
      break;
    }
    default: break;
  }
}

/* ---- roofs ---- */
function paintRoof(ctx, w, st, opts) {
  const pal = w.pal; const W = WING_W;
  const winter = !!opts.winter;
  switch (w.id) {
    case 'cafe': {
      ctx.fillStyle = '#9b5a44'; ctx.fillRect(150, -ROOF_H + 4, 16, 34); ctx.fillStyle = '#7d4535'; ctx.fillRect(147, -ROOF_H, 22, 6);
      ctx.fillStyle = pal.roof; ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(28, -ROOF_H + 12); ctx.lineTo(W - 28, -ROOF_H + 12); ctx.lineTo(W + 10, 2); ctx.closePath(); ctx.fill();
      texFill(ctx, 'shingles', 1);
      break;
    }
    case 'hall': {
      ctx.fillStyle = pal.roof; ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(W / 2, -ROOF_H); ctx.lineTo(W + 12, 2); ctx.closePath(); ctx.fill();
      texFill(ctx, 'shingles', 1);
      fillRR(ctx, W / 2 - 9, -ROOF_H - 22, 18, 20, 2, '#f4efe6'); ctx.fillStyle = '#3a3440'; ctx.fillRect(W / 2 - 5, -ROOF_H - 17, 10, 12);
      ell(ctx, W / 2, -ROOF_H - 9, 3.6, 3.6, '#e0b84f');
      ctx.fillStyle = pal.roof2; ctx.beginPath(); ctx.moveTo(W / 2 - 12, -ROOF_H - 21); ctx.lineTo(W / 2, -ROOF_H - 34); ctx.lineTo(W / 2 + 12, -ROOF_H - 21); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(W / 2, -ROOF_H - 34); ctx.lineTo(W / 2, -ROOF_H - 46); ctx.stroke();
      break;
    }
    case 'press': {
      ctx.fillStyle = '#9a5a44'; ctx.fillRect(160, -ROOF_H - 24, 18, ROOF_H + 24); texRect(ctx, 'brick', 160, -ROOF_H - 24, 18, ROOF_H + 24, 1.4);
      ctx.fillStyle = '#7d4535'; ctx.fillRect(156, -ROOF_H - 28, 26, 6);
      for (let k = 0; k < 4; k++) {
        const x = -6 + k * 52;
        ctx.fillStyle = pal.roof; ctx.beginPath(); ctx.moveTo(x, 2); ctx.lineTo(x + 40, -ROOF_H + 16); ctx.lineTo(x + 40, 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(190,225,245,0.85)'; ctx.fillRect(x + 40, -ROOF_H + 16, 10, ROOF_H - 14);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 42, -ROOF_H + 20, 2, ROOF_H - 22);
      }
      break;
    }
    default: {
      fillRR(ctx, -12, -10, W + 24, 12, 2, '#e9e1cf'); ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = -8; x < W + 10; x += 8) ctx.fillRect(x, -8, 4, 8);
      ctx.fillStyle = pal.roof; ctx.beginPath(); ctx.moveTo(-14, -10); ctx.lineTo(W / 2, -ROOF_H); ctx.lineTo(W + 14, -10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e9e1cf'; ctx.beginPath(); ctx.moveTo(8, -14); ctx.lineTo(W / 2, -ROOF_H + 10); ctx.lineTo(W - 8, -14); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.translate(W / 2, -26); drawFossilEmblem(ctx); ctx.restore();
    }
  }
  if (winter) {
    ctx.fillStyle = '#f7fafc';
    if (w.id === 'hall' || w.id === 'museum') { ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(W / 2, -ROOF_H - 3); ctx.lineTo(W + 12, 0); ctx.lineTo(W + 2, -4); ctx.lineTo(W / 2, -ROOF_H + 9); ctx.lineTo(-2, -4); ctx.closePath(); ctx.fill(); }
    else fillRR(ctx, 20, -ROOF_H + 8, W - 40, 6, 3, '#f7fafc');
  }
  const label = w.short;
  ctx.font = `700 10px ${FONT}`;
  const tw = ctx.measureText(label).width + 20;
  const sy = w.id === 'museum' ? -ROOF_H - 16 : w.id === 'hall' ? -18 : -ROOF_H + 16;
  fillRR(ctx, W / 2 - tw / 2, sy - 9, tw, 18, 6, '#fff3dc'); ctx.strokeStyle = pal.sign; ctx.lineWidth = 1.6; rr(ctx, W / 2 - tw / 2, sy - 9, tw, 18, 6); ctx.stroke();
  ctx.fillStyle = pal.sign; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, W / 2, sy + 0.5);
  if (w.id === 'cafe') {
    const [a, b] = pal.awning;
    for (let x = 0, j = 0; x < W; x += 14, j++) { ctx.fillStyle = j % 2 ? b : a; ctx.fillRect(x, -2, 14, 9); ctx.beginPath(); ctx.arc(x + 7, 7, 7, 0, Math.PI); ctx.fill(); }
    if (has(st, 0)) [30, 170].forEach((x) => { ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, 20); ctx.stroke(); ell(ctx, x, 23, 6, 4, '#8a5a3a'); [-3, 0, 3].forEach((d, j) => circ(ctx, x + d, 19.5 - (j % 2), 2, ['#e0404f', '#f7a8c4', '#ffd24a'][j])); });
  }
}

function drawFossilEmblem(ctx) {
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(10, -4); ctx.stroke();
  [[-10, 4], [10, -4]].forEach(([x, y]) => { circ(ctx, x - 1.5, y - 1.5, 2, '#8a6a3a'); circ(ctx, x + 1.5, y + 1.5, 2, '#8a6a3a'); });
}

/* ---------------- live: machines (behind the mice), then lights and smoke (over them) ---------------- */
export function drawWingMachines(ctx, w, st, t, running) {
  const x0 = wingX(w);
  ctx.save(); ctx.translate(x0 + SIDE, 0);
  if (w.id === 'press') {
    // the big wheel turns while a print run is on
    const cx = 128; const cy = -STOREY_H + 54; const a = running ? t * 3 : 0.3;
    ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, 7); ctx.stroke();
    ctx.lineWidth = 1.4; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a + (k * Math.PI) / 3) * 13, cy + Math.sin(a + (k * Math.PI) / 3) * 13); ctx.stroke(); }
    circ(ctx, cx, cy, 2.4, '#c9a227');
    const py = -STOREY_H + 44 + (running ? Math.abs(Math.sin(t * 3)) * 8 : 0);
    fillRR(ctx, 72, py, 44, 7, 1.5, '#6d6a80');
    // books riding the conveyor belt
    if (has(st, 2)) for (let j = 0; j < 3; j++) { const bx = 124 + ((t * 8 + j * 10) % 28); fillRR(ctx, bx, -STOREY_H + 80, 6, 4, 0.6, ['#b5523b', '#3d7a5a', '#4f7cac'][j]); }
  }
  if (w.id === 'cafe') {
    // steam from the tea urn / espresso machine
    const urnY = -STOREY_H + 34;
    for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; circ(ctx, 172 + Math.sin(t * 2 + k) * 2, urnY - ph * 16, 1.4 + ph * 2, null); ctx.fill(); }
  }
  ctx.restore();
}
export function drawWingNight(ctx, w, st, t, tod) {
  const x0 = wingX(w); const n = wingStoreys(st.lvl); const H = n * STOREY_H;
  ctx.save(); ctx.translate(x0 + SIDE, 0);
  if (tod.dark > 0.05) {
    ctx.fillStyle = `rgba(18,20,58,${tod.dark * 0.22})`; ctx.fillRect(0, -H, INNER_W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < n; k++) {
      const yy = -k * STOREY_H - STOREY_H + 44;
      glow(ctx, 92, yy, 92, '255,214,140', 0.1 + tod.dark * 0.35, -(k + 1) * STOREY_H, -k * STOREY_H - 20);
    }
    // fairy lights twinkle at night
    if (w.id === 'cafe' && has(st, 4)) for (let x = 6, j = 0; x < INNER_W; x += 10, j++) { const y = -STOREY_H + 7 + Math.sin((x / INNER_W) * Math.PI * 3) * 3 + 4; glow(ctx, x, y, 7, '255,230,160', tod.dark * (0.5 + 0.5 * Math.sin(t * 3 + j)) * 0.6); }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  if (w.id === 'cafe' || w.id === 'press') {
    const cx = x0 + (w.id === 'cafe' ? 158 : 169); const cy = -H - ROOF_H - (w.id === 'press' ? 28 : 0);
    for (let k = 0; k < 3; k++) { const ph = (t * 0.22 + k / 3) % 1; ctx.fillStyle = `rgba(232,228,238,${0.4 * (1 - ph)})`; circ(ctx, cx + ph * 12 + Math.sin(t + k) * 2, cy - ph * 30, 3 + ph * 5, null); ctx.fill(); }
  }
}

/* ---------------- outdoor extras on the lawn (bought as wing furniture) ---------------- */
// Returns hit boxes for tappable extras (the newsstand).
export function drawWingOutside(ctx, w, st, t, tod) {
  const x0 = wingX(w); const hits = [];
  if (w.id === 'cafe' && has(st, 3)) {
    // garden terrace: a parasol table with two chairs
    const x = x0 + 150; const y = 30;
    ctx.fillStyle = '#6b4128'; ctx.fillRect(x - 1, y - 16, 2, 16); ell(ctx, x, y - 16, 11, 3, '#fff7ec'); ell(ctx, x, y, 5, 1.4, 'rgba(0,0,0,0.2)');
    ctx.strokeStyle = '#8a8577'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 44); ctx.stroke();
    for (let j = 0; j < 6; j++) { ctx.fillStyle = j % 2 ? '#fff7ec' : '#f28b82'; ctx.beginPath(); ctx.moveTo(x, y - 48); ctx.lineTo(x - 22 + j * 7.3, y - 36); ctx.lineTo(x - 22 + (j + 1) * 7.3, y - 36); ctx.closePath(); ctx.fill(); }
    chair(ctx, x - 16, y, '#b5523b', 1); chair(ctx, x + 16, y, '#b5523b', -1);
    ell(ctx, x - 3, y - 18, 2.6, 1, '#fbf6ea'); fillRR(ctx, x + 2, y - 22, 4, 4, 1, '#fbf6ea');
  }
  if (w.id === 'press' && has(st, 0)) {
    // the Gazette newsstand
    const x = x0 + 34; const y = 34;
    fillRR(ctx, x - 20, y - 30, 40, 30, 2, '#3d6a5a'); fillRR(ctx, x - 23, y - 38, 46, 9, 2, '#2f5448');
    ctx.fillStyle = '#fff3dc'; ctx.font = `700 6.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GAZETTE', x, y - 33.2);
    for (let j = 0; j < 3; j++) { fillRR(ctx, x - 16 + j * 11, y - 24, 9, 12, 0.8, '#fbf6ea'); ctx.fillStyle = 'rgba(40,40,50,0.5)'; ctx.fillRect(x - 15 + j * 11, y - 22, 7, 1.2); for (let l = 0; l < 3; l++) ctx.fillRect(x - 15 + j * 11, y - 19 + l * 2, 7, 0.6); }
    ctx.fillStyle = '#e8c465'; ctx.font = `700 5px ${FONT}`; ctx.fillText('EXTRA! EXTRA!', x, y - 6);
    const bob = Math.sin(t * 2.4) * 1.5;
    ctx.fillStyle = '#fff7e8'; ctx.beginPath(); ctx.arc(x + 18, y - 48 + bob, 7, 0, 7); ctx.fill(); ctx.font = '8px sans-serif'; ctx.fillText('📰', x + 18, y - 47.5 + bob);
    hits.push({ x0: x - 26, x1: x + 26, y0: y - 58, y1: y + 4, id: w.id, kind: 'gazette' });
  }
  if (w.id === 'press' && has(st, 4)) {
    // the delivery bicycle, loaded with books
    const x = x0 + 170; const y = 34;
    ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.2;
    [-9, 9].forEach((dx) => { ctx.beginPath(); ctx.arc(x + dx, y - 5, 5.5, 0, 7); ctx.stroke(); });
    ctx.strokeStyle = '#c0504d'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 9, y - 5); ctx.lineTo(x - 1, y - 13); ctx.lineTo(x + 8, y - 13); ctx.lineTo(x + 9, y - 5); ctx.moveTo(x - 1, y - 13); ctx.lineTo(x + 1, y - 5); ctx.stroke();
    fillRR(ctx, x + 5, y - 21, 12, 8, 1, '#b98a5a'); ['#b5523b', '#4f7cac', '#e8c465'].forEach((c, j) => fillRR(ctx, x + 6, y - 24 - j * 2.4, 10, 2.4, 0.5, c));
  }
  if (w.id === 'museum' && has(st, 3)) {
    // a woolly mammoth statue on a plinth
    const x = x0 + 52; const y = 30;
    fillRR(ctx, x - 20, y - 8, 40, 8, 1.5, '#d9cfb8');
    ell(ctx, x, y - 22, 18, 13, '#8a6a4a'); ell(ctx, x + 14, y - 26, 8, 7, '#8a6a4a');
    ctx.fillStyle = '#7a5a3a'; [-12, -4, 6, 12].forEach((dx) => ctx.fillRect(x + dx - 2, y - 14, 4, 7));
    ctx.strokeStyle = '#f4efe6'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 18, y - 20); ctx.quadraticCurveTo(x + 28, y - 16, x + 24, y - 28); ctx.stroke();
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 20, y - 24); ctx.quadraticCurveTo(x + 23, y - 14, x + 19, y - 10); ctx.stroke();
    circ(ctx, x + 16, y - 28, 1.2, '#1d1b24');
    ctx.strokeStyle = 'rgba(60,40,20,0.35)'; ctx.lineWidth = 0.6; for (let j = 0; j < 8; j++) { ctx.beginPath(); ctx.moveTo(x - 14 + j * 4, y - 30); ctx.lineTo(x - 15 + j * 4, y - 22); ctx.stroke(); }
  }
  if (w.id === 'museum' && has(st, 4)) {
    // gift kiosk: plush dinosaurs and postcards
    const x = x0 + 160; const y = 32;
    fillRR(ctx, x - 20, y - 22, 40, 22, 2, '#fff7ec'); for (let j = 0; j < 5; j++) { ctx.fillStyle = j % 2 ? '#c9a227' : '#7a2f3a'; ctx.fillRect(x - 22 + j * 8.8, y - 32, 8.8, 7); }
    ctx.fillStyle = '#6b4128'; ctx.fillRect(x - 20, y - 26, 2, 4); ctx.fillRect(x + 18, y - 26, 2, 4);
    ell(ctx, x - 9, y - 26, 4, 3, '#9ccf7a'); circ(ctx, x - 5, y - 28, 2, '#9ccf7a'); ell(ctx, x + 6, y - 26, 4, 3, '#f7a8c4'); circ(ctx, x + 10, y - 28, 2, '#f7a8c4');
    ctx.fillStyle = '#7a2f3a'; ctx.font = `700 5.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GIFTS', x, y - 12);
  }
  void tod;
  return hits;
}

// The "ready!" bubble over a wing (tap it). Returns its hit box.
export function drawWingBubble(ctx, w, st, t, icon, label) {
  const lift = w.id === 'hall' ? 30 : w.id === 'museum' ? 14 : w.id === 'press' ? 24 : 0; // clear of towers and chimneys
  const x = wingX(w) + WING_W / 2; const y = -wingHeight(st) - ROOF_H - 40 - lift + Math.sin(t * 2.2) * 3;
  glow(ctx, x, y, 36, '255,230,140', 0.4 + 0.12 * Math.sin(t * 4));
  circ(ctx, x, y, 18, '#fff7e8'); ctx.strokeStyle = '#e6b34a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.stroke();
  ctx.fillStyle = '#fff7e8'; ctx.beginPath(); ctx.moveTo(x - 6, y + 15); ctx.lineTo(x, y + 25); ctx.lineTo(x + 6, y + 15); ctx.fill();
  ctx.font = `18px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, x, y + 1);
  ctx.font = `700 10px ${FONT}`; ctx.lineWidth = 3; ctx.strokeStyle = '#6b4128'; ctx.lineJoin = 'round'; ctx.strokeText(label, x, y - 27); ctx.fillStyle = '#fff'; ctx.fillText(label, x, y - 27);
  return { x0: x - 28, x1: x + 28, y0: y - 38, y1: y + 28 };
}

// A thin progress bar under the name board (print runs, club nights, building).
export function drawWingProgress(ctx, w, st, frac, text) {
  const x = wingX(w) + WING_W / 2; const y = -wingHeight(st) - 6;
  fillRR(ctx, x - 44, y - 7, 88, 13, 6.5, 'rgba(40,28,20,0.78)');
  fillRR(ctx, x - 42, y - 5, 84 * Math.max(0.04, Math.min(1, frac)), 9, 4.5, '#7cc46b');
  ctx.fillStyle = '#fff'; ctx.font = `700 7px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 0.5);
}

/* ---------------- empty plots and construction ---------------- */
// state: 'locked' (a later site) | 'open' (buildable) ; returns the sign's hit box
export function drawPlot(ctx, w, state, t, tod, info) {
  const x0 = wingX(w); const cx = x0 + WING_W / 2;
  ctx.strokeStyle = '#9a6b45'; ctx.lineWidth = 1.6;
  for (let x = x0 + 6; x <= x0 + WING_W - 6; x += 24) { ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, -14); ctx.stroke(); }
  ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0 + 4, -10); ctx.lineTo(x0 + WING_W - 4, -10); ctx.moveTo(x0 + 4, -3); ctx.lineTo(x0 + WING_W - 4, -3); ctx.stroke();
  const bob = state === 'open' ? Math.sin(t * 1.6) * 2 : 0;
  ctx.fillStyle = '#7a4b2e'; ctx.fillRect(cx - 2, -60, 4, 62);
  const sw = 150; const sh = 48; const sy = -108 + bob;
  if (state === 'open') {
    glow(ctx, cx, sy + sh / 2, 100, '255,230,140', info.affordable ? 0.35 + 0.12 * Math.sin(t * 4) : 0.12);
  }
  fillRR(ctx, cx - sw / 2, sy, sw, sh, 8, '#8a5a3a'); fillRR(ctx, cx - sw / 2 + 3, sy + 3, sw - 6, sh - 6, 6, state === 'open' ? '#fff3dc' : '#eadfcb');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#6b4128'; ctx.font = `700 8.5px ${FONT}`;
  ctx.fillText(state === 'open' ? `➕ BUILD ${w.short.toUpperCase()}` : '🔒 WING PLOT', cx, sy + 12);
  ctx.font = `600 10.5px ${FONT}`; ctx.fillStyle = '#3d2a1e'; ctx.fillText(w.name, cx, sy + 25);
  ctx.font = `700 9px ${FONT}`;
  if (state === 'open') {
    ctx.fillStyle = info.affordable ? '#2f8a3a' : '#a0522d';
    const tw = ctx.measureText(info.cost).width; coinIcon(ctx, cx - tw / 2 - 6, sy + 37, 4); ctx.fillText(info.cost, cx + 3, sy + 37.5);
  } else { ctx.fillStyle = '#8a6a50'; ctx.fillText(`Opens at ${info.site}`, cx, sy + 37.5); }
  void tod;
  return { x0: cx - sw / 2, x1: cx + sw / 2, y0: sy - 6, y1: 6 };
}

export function drawWingConstruction(ctx, w, t, progress, remaining) {
  const x0 = wingX(w);
  ctx.save(); ctx.translate(x0, 0);
  ctx.fillStyle = '#7b5236'; ctx.fillRect(0, -STOREY_H, SIDE, STOREY_H); ctx.fillRect(WING_W - SIDE, -STOREY_H, SIDE, STOREY_H);
  ctx.fillStyle = '#eadfca'; ctx.fillRect(SIDE, -STOREY_H, WING_W - SIDE * 2, STOREY_H - 16);
  ctx.fillStyle = '#d9cbb0'; for (let x = SIDE; x < WING_W - SIDE; x += 22) ctx.fillRect(x, -STOREY_H, 1, STOREY_H - 16);
  ctx.fillStyle = '#b98457'; ctx.fillRect(SIDE, -16, WING_W - SIDE * 2, 16);
  ctx.strokeStyle = '#a0764f'; ctx.lineWidth = 3;
  [22, 100, 178].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, -STOREY_H - 10); ctx.lineTo(x, 0); ctx.stroke(); });
  ctx.lineWidth = 3.4; [-90, -44].forEach((y) => { ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(188, y); ctx.stroke(); });
  fillRR(ctx, 70, -48, 60, 30, 3, '#3d6fa8'); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.7; ctx.strokeRect(78, -42, 44, 18);
  drawMouse(ctx, 60, -1, { fur: '#a98467', belly: '#ecd9c6', pose: 'hammer', t, hat: 'hardhat', vest: '#f28c28', dir: 1, s: 0.85 });
  drawMouse(ctx, 140, -45, { fur: '#8f7f73', belly: '#d9cdc2', pose: 'hammer', t: t + 0.4, hat: 'hardhat', vest: '#f28c28', dir: -1, s: 0.85 });
  drawMouse(ctx, 100, -1, { fur: '#c9b29b', belly: '#f4e9dc', pose: 'carry', item: 'books', t: t + 0.8, hat: 'hardhat', vest: '#f28c28', dir: 1, s: 0.85 });
  fillRR(ctx, 40, -128, 120, 18, 9, 'rgba(40,28,20,0.78)');
  fillRR(ctx, 43, -125, 114 * progress, 12, 6, '#7cc46b');
  ctx.fillStyle = '#fff'; ctx.font = `700 8.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`Building… ${remaining}`, 100, -118.5);
  ctx.restore();
}
export const WING_ROOF_H = ROOF_H;
