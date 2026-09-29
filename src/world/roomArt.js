// Pre-rendered static art for each library floor (walls, shelves, seats, décor).
// Drawn once into offscreen canvases and re-rendered only when the floor changes.
import { L, IW, FH, WALL } from './layout.js';
import { rr, fillRR, ell, circ, shade, rng, star, rgba } from './draw.js';
import { FLOOR_LOOK, LIVE, drawCeiling, drawWall, drawBoard, drawRug, drawLamp, drawArt, drawDesk } from './furnish.js';
import { paintSides, BEAM } from './buildings.js';
import { texRect } from './textures.js';

export const SEAT_H = { armchair: 16, beanbag: 11, cafe: 15, trunk: 17, wingback: 16, bench: 15, stool: 23, throne: 16, piano: 16, royal: 16 };
const WOOD = '#8a5a3a';
const WOOD_DK = '#6b4128';
const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';

/* ---------------- micro textures (subtle; baked into the cached room art) ---------------- */
// Paper grain: tiny light and dark specks.
function paperGrain(ctx, x0, y0, w, h, seed) {
  const R = rng(seed + 501);
  const n = Math.floor((w * h) / 70);
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(x0 + R() * w, y0 + R() * h, 0.7 + R() * 0.6, 0.7 + R() * 0.6);
  }
}
// Wood grain: long, gently wavy streaks running along the board.
function woodGrain(ctx, x0, y0, w, h, seed, vertical = false, alpha = 0.1) {
  const R = rng(seed + 907);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  const lines = Math.max(2, Math.floor((vertical ? w : h) / 2.6));
  for (let k = 0; k < lines; k++) {
    ctx.strokeStyle = R() < 0.6 ? `rgba(60,30,15,${alpha})` : `rgba(255,235,200,${alpha * 0.8})`;
    ctx.lineWidth = 0.4 + R() * 0.4;
    ctx.beginPath();
    if (vertical) {
      const x = x0 + R() * w; const amp = 0.4 + R() * 0.8; const ph = R() * 6;
      ctx.moveTo(x, y0); for (let y = y0; y <= y0 + h; y += 6) ctx.lineTo(x + Math.sin(y * 0.05 + ph) * amp, y);
    } else {
      const y = y0 + R() * h; const amp = 0.3 + R() * 0.6; const ph = R() * 6;
      ctx.moveTo(x0, y); for (let x = x0; x <= x0 + w; x += 6) ctx.lineTo(x, y + Math.sin(x * 0.04 + ph) * amp);
    }
    ctx.stroke();
  }
  // a knot or two
  if (w * h > 900) for (let k = 0; k < 2; k++) { ctx.strokeStyle = `rgba(60,30,15,${alpha * 1.2})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(x0 + R() * w, y0 + R() * h, vertical ? 0.8 : 2.2, vertical ? 2.2 : 0.8, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

/* ---------------- wallpaper ---------------- */
function wallpaper(ctx, pal, w, h, seed) {
  ctx.fillStyle = pal.wall; ctx.fillRect(0, 0, w, h);
  const c2 = pal.wall2;
  const R = rng(seed);
  ctx.fillStyle = c2; ctx.strokeStyle = c2;
  switch (pal.pattern) {
    case 'stripes': for (let x = 0; x < w; x += 18) ctx.fillRect(x, 0, 9, h); break;
    case 'dots': for (let y = 8, row = 0; y < h; y += 14, row++) for (let x = row % 2 ? 7 : 0; x < w; x += 14) circ(ctx, x, y, 2, c2); break;
    case 'checks':
      ctx.globalAlpha = 0.55;
      for (let y = 0; y < h; y += 12) for (let x = ((y / 12) % 2) * 12; x < w; x += 24) ctx.fillRect(x, y, 12, 12);
      ctx.globalAlpha = 1; break;
    case 'diamond':
      for (let y = 0; y < h + 20; y += 20) for (let x = 0; x < w + 20; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 10, y); ctx.lineTo(x, y + 10); ctx.lineTo(x - 10, y); ctx.closePath();
        if (((x + y) / 20) % 2 === 0) ctx.fill();
      }
      ctx.strokeStyle = rgba('#c9a557', 0.35); ctx.lineWidth = 0.6;
      for (let d = -h; d < w; d += 20) { ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + h, h); ctx.moveTo(d + h, 0); ctx.lineTo(d, h); ctx.stroke(); }
      break;
    case 'damask':
      for (let y = 12, row = 0; y < h; y += 24, row++) for (let x = row % 2 ? 12 : 0; x < w; x += 24) {
        for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; ell(ctx, x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5, 2.6, 1.6, c2, a); }
        circ(ctx, x, y, 1.4, shade(c2, 0.1));
      }
      break;
    case 'lattice':
      ctx.lineWidth = 1.2;
      for (let d = -h; d < w; d += 16) { ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + h, h); ctx.moveTo(d + h, 0); ctx.lineTo(d, h); ctx.stroke(); }
      for (let k = 0; k < 24; k++) { const x = R() * w, y = R() * h * 0.7; ell(ctx, x, y, 3, 1.6, '#8fc98f', R() * 3); }
      break;
    case 'stars':
      for (let k = 0; k < 60; k++) { const x = R() * w, y = R() * h; star(ctx, x, y, 1 + R() * 2, R() < 0.3 ? '#ffe9a3' : c2); }
      break;
    case 'fleur':
      for (let y = 14, row = 0; y < h; y += 26, row++) for (let x = row % 2 ? 13 : 0; x < w; x += 26) {
        ell(ctx, x, y - 3, 1.8, 4, c2); ell(ctx, x - 3.5, y, 3.5, 1.6, c2, 0.5); ell(ctx, x + 3.5, y, 3.5, 1.6, c2, -0.5); ctx.fillRect(x - 3, y + 2, 6, 1.4);
      }
      break;
    case 'notes':
      for (let k = 0; k < 28; k++) {
        const x = R() * w, y = 10 + R() * (h - 20);
        ell(ctx, x, y, 2.6, 1.9, c2, -0.4); ctx.fillRect(x + 2, y - 9, 1, 9);
        if (R() < 0.5) { ctx.fillRect(x + 2, y - 9, 5, 1.4); }
      }
      break;
    case 'columns':
      for (let x = 20; x < w; x += 64) {
        ctx.fillStyle = c2; ctx.fillRect(x, 0, 14, h);
        ctx.fillStyle = shade(c2, -0.06); for (let k = 2; k < 14; k += 4) ctx.fillRect(x + k, 6, 1.4, h - 12);
        ctx.fillStyle = shade(c2, 0.08); ctx.fillRect(x - 3, 0, 20, 5);
      }
      break;
    default: break;
  }
  paperGrain(ctx, 0, 0, w, h, seed);
  texRect(ctx, 'plaster', 0, 0, w, h, 1);
}

/* ---------------- book spines ---------------- */
const GOLD = '#e8c86a';
// One book spine (x, y = top-left). Rounded shading plus a random binding style:
// gold raised bands, a paper title label, leather-capped cloth, or tooled dots.
function spine(ctx, x, y, w, h, col, R) {
  ctx.fillStyle = col; ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.3)'); g.addColorStop(0.35, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const style = R();
  if (style < 0.4) { // raised bands, gold tooled
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; [0.14, 0.3, 0.7, 0.86].forEach((f) => ctx.fillRect(x, y + h * f, w, 0.8));
    ctx.fillStyle = GOLD; [0.14, 0.86].forEach((f) => ctx.fillRect(x, y + h * f - 0.6, w, 0.55));
    ctx.fillRect(x + w * 0.3, y + h * 0.46, w * 0.4, h * 0.08);
  } else if (style < 0.65) { // paper title label
    ctx.fillStyle = '#f5ecd6'; ctx.fillRect(x + w * 0.16, y + h * 0.26, w * 0.68, h * 0.24);
    ctx.fillStyle = 'rgba(60,40,30,0.55)'; ctx.fillRect(x + w * 0.3, y + h * 0.32, w * 0.4, 0.5); ctx.fillRect(x + w * 0.3, y + h * 0.4, w * 0.4, 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x, y + h * 0.88, w, 0.6);
  } else if (style < 0.85) { // leather caps top and bottom on a cloth body
    ctx.fillStyle = 'rgba(40,20,10,0.32)'; ctx.fillRect(x, y, w, h * 0.17); ctx.fillRect(x, y + h * 0.83, w, h * 0.17);
    ctx.fillStyle = GOLD; ctx.fillRect(x, y + h * 0.17, w, 0.5); ctx.fillRect(x, y + h * 0.83 - 0.5, w, 0.5);
  } else { // tooled dots down the spine
    ctx.fillStyle = 'rgba(255,240,200,0.6)';
    for (let py = y + 3; py < y + h - 2; py += 2.6) ctx.fillRect(x + w * 0.5 - 0.35, py, 0.7, 0.7);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 0.3, y + 0.5, w - 0.6, 0.6);
}

/* ---------------- shelves ---------------- */
function bookshelf(ctx, x, top, w, bot, def, seed, fill) {
  const R = rng(seed);
  const h = bot - top;
  fillRR(ctx, x, top, w, h, 2, WOOD);
  woodGrain(ctx, x, top, 3, h, seed, true, 0.16); woodGrain(ctx, x + w - 3, top, 3, h, seed + 1, true, 0.16);
  ctx.fillStyle = WOOD_DK; ctx.fillRect(x + 3, top + 6, w - 6, h - 9);
  // crown
  fillRR(ctx, x - 2, top - 3, w + 4, 6, 2, shade(WOOD, -0.08));
  const rows = 4;
  const rowH = (h - 10) / rows;
  for (let k = 0; k < rows; k++) {
    const y0 = top + 6 + k * rowH;
    const yb = y0 + rowH - 2;
    ctx.fillStyle = shade(WOOD, 0.1); ctx.fillRect(x + 2, yb, w - 4, 2.6);
    let bx = x + 4;
    const limit = x + w - 4;
    const stop = x + 4 + (w - 8) * fill * (0.75 + R() * 0.25);
    while (bx < limit - 2) {
      if (bx > stop) break;
      if (R() < 0.06 && bx < limit - 8) { // little knick-knack
        const kind = R();
        if (kind < 0.5) { fillRR(ctx, bx, yb - 6, 6, 6, 1, '#c96f4a'); ell(ctx, bx + 3, yb - 9, 4, 3, '#6a9f58'); }
        else { circ(ctx, bx + 3.5, yb - 5, 3.5, '#6fa8dc'); ctx.fillStyle = '#6a9f58'; ctx.fillRect(bx + 1, yb - 6, 3, 2); }
        bx += 8; continue;
      }
      const bw = 2.6 + R() * 3.2;
      const bh = rowH * (0.55 + R() * 0.38);
      const col = def.books[Math.floor(R() * def.books.length)];
      const lean = R() < 0.08 && bx + bw + 4 < limit;
      if (lean) {
        ctx.save(); ctx.translate(bx, yb); ctx.rotate(-0.28); spine(ctx, 0, -bh, bw, bh, col, R); ctx.restore();
        bx += bw + 3.5;
      } else {
        spine(ctx, bx, yb - bh, bw, bh, col, R);
        bx += bw + 0.3;
      }
    }
  }
}

/* ---------------- seats ---------------- */
export function drawSeat(ctx, type, x, base, col, dir = 1) {
  const dk = shade(col, -0.22); const lt = shade(col, 0.16);
  switch (type) {
    case 'armchair':
      fillRR(ctx, x - 13, base - 31, 26, 22, 8, dk);
      fillRR(ctx, x - 14, base - 17, 28, 9, 3, col);
      fillRR(ctx, x - 17, base - 22, 7, 15, 3.5, col); fillRR(ctx, x + 10, base - 22, 7, 15, 3.5, col);
      ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 14, base - 8, 2.6, 8); ctx.fillRect(x + 11.4, base - 8, 2.6, 8);
      break;
    case 'beanbag':
      ell(ctx, x, base - 7, 16, 8, col); ell(ctx, x - 4 * dir, base - 13, 10, 6, col); ell(ctx, x - 4, base - 11, 6, 2.5, lt);
      break;
    case 'cafe': {
      const tx = x + 13 * dir;
      ctx.fillStyle = WOOD_DK; ctx.fillRect(tx - 1, base - 18, 2.2, 18); ell(ctx, tx, base - 1, 5, 1.4, WOOD_DK);
      ell(ctx, tx, base - 19, 8, 2.2, '#f3ead8'); ell(ctx, tx, base - 19.6, 7, 1.4, '#fff9ee');
      fillRR(ctx, tx - 2.5, base - 24, 4.4, 4, 1, '#ffffff'); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(tx + 2.4, base - 22, 1.4, -1.4, 1.4); ctx.stroke();
      ctx.fillStyle = dk; ctx.fillRect(x - 9 * dir - 1.2, base - 32, 2.4, 32);
      fillRR(ctx, x - 10, base - 17, 18, 4, 2, col);
      ctx.fillRect(x + 6 * dir - 1, base - 14, 2, 14);
      break;
    }
    case 'trunk':
      fillRR(ctx, x - 14, base - 17, 28, 17, 3, WOOD);
      ctx.fillStyle = '#c9a557'; ctx.fillRect(x - 14, base - 12, 28, 2); ctx.fillRect(x - 8, base - 17, 2.2, 17); ctx.fillRect(x + 6, base - 17, 2.2, 17);
      fillRR(ctx, x - 2.5, base - 13, 5, 5, 1, '#e3b04b');
      fillRR(ctx, x - 12, base - 21, 24, 5, 2.5, col);
      break;
    case 'wingback':
      fillRR(ctx, x - 12, base - 40, 24, 32, 9, dk);
      fillRR(ctx, x - 15, base - 34, 6, 14, 3, col); fillRR(ctx, x + 9, base - 34, 6, 14, 3, col);
      fillRR(ctx, x - 14, base - 17, 28, 9, 3, col);
      ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 13, base - 8, 2.6, 8); ctx.fillRect(x + 10.4, base - 8, 2.6, 8);
      break;
    case 'bench':
      ctx.fillStyle = WOOD; ctx.fillRect(x - 15, base - 31, 30, 3.5); ctx.fillRect(x - 15, base - 25, 30, 3.5);
      ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 14, base - 31, 2.5, 31); ctx.fillRect(x + 11.5, base - 31, 2.5, 31);
      fillRR(ctx, x - 16, base - 17, 32, 4.5, 1.5, WOOD);
      ell(ctx, x, base - 18, 9, 2, col);
      break;
    case 'stool':
      ctx.strokeStyle = '#6d6d78'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x - 7, base); ctx.lineTo(x - 3, base - 20); ctx.moveTo(x + 7, base); ctx.lineTo(x + 3, base - 20); ctx.moveTo(x, base); ctx.lineTo(x, base - 20); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, base - 8, 5.5, 1.3, 0, 0, Math.PI * 2); ctx.stroke();
      ell(ctx, x, base - 22, 11, 3.6, col); ell(ctx, x, base - 23, 9, 1.6, lt);
      break;
    case 'throne':
      fillRR(ctx, x - 13, base - 44, 26, 38, 6, '#e0b84f');
      fillRR(ctx, x - 10, base - 41, 20, 32, 5, col);
      circ(ctx, x - 12, base - 45, 2.6, '#e0b84f'); circ(ctx, x + 12, base - 45, 2.6, '#e0b84f');
      fillRR(ctx, x - 15, base - 17, 30, 9, 3, col);
      ctx.fillStyle = '#e0b84f'; ctx.fillRect(x - 15, base - 9, 30, 2.5); ctx.fillRect(x - 14, base - 8, 3, 8); ctx.fillRect(x + 11, base - 8, 3, 8);
      break;
    case 'piano':
      fillRR(ctx, x - 14, base - 18, 28, 5, 1.5, '#2a2430');
      fillRR(ctx, x - 13, base - 20, 26, 4, 2, col);
      ctx.fillStyle = '#2a2430'; ctx.fillRect(x - 12, base - 13, 2.4, 13); ctx.fillRect(x + 9.6, base - 13, 2.4, 13);
      break;
    case 'royal':
      fillRR(ctx, x - 14, base - 34, 28, 24, 11, col);
      for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) circ(ctx, x - 7 + k * 7, base - 28 + j * 7, 0.9, dk);
      fillRR(ctx, x - 16, base - 17, 32, 9, 4, lt);
      fillRR(ctx, x - 18, base - 23, 6, 15, 3, col); fillRR(ctx, x + 12, base - 23, 6, 15, 3, col);
      ctx.fillStyle = '#c9a227'; ctx.fillRect(x - 14, base - 8, 2.6, 8); ctx.fillRect(x + 11.4, base - 8, 2.6, 8);
      break;
    default: fillRR(ctx, x - 12, base - 16, 24, 8, 3, col);
  }
}

/* ---------------- centerpieces ---------------- */
function centerpiece(ctx, kind, x, base, pal) {
  switch (kind) {
    case 'clock':
      fillRR(ctx, x - 10, base - 62, 20, 62, 3, WOOD_DK);
      ctx.fillStyle = WOOD; ctx.beginPath(); ctx.moveTo(x - 11, base - 60); ctx.quadraticCurveTo(x, base - 72, x + 11, base - 60); ctx.fill();
      circ(ctx, x, base - 50, 7.5, '#f7efdc'); ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(x, base - 50); ctx.lineTo(x, base - 55.5); ctx.moveTo(x, base - 50); ctx.lineTo(x + 4, base - 49); ctx.stroke();
      fillRR(ctx, x - 5.5, base - 38, 11, 28, 2, '#3a2a20');
      break;
    case 'horse':
      ctx.strokeStyle = WOOD_DK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, base - 30, 30, Math.PI * 0.32, Math.PI * 0.68); ctx.stroke();
      ell(ctx, x, base - 16, 11, 5.5, '#f2a65a'); ell(ctx, x + 11, base - 24, 4.5, 7, '#f2a65a', 0.5); ell(ctx, x + 14, base - 29, 5, 3.5, '#f2a65a');
      ctx.fillStyle = '#b8707f'; ctx.fillRect(x + 7, base - 31, 3, 9);
      ctx.fillStyle = '#e8718d'; ctx.fillRect(x - 5, base - 21, 7, 3);
      ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 8, base - 12, 2, 8); ctx.fillRect(x + 6, base - 12, 2, 8);
      circ(ctx, x + 15, base - 30, 0.9, '#2b2320');
      break;
    case 'urn':
      fillRR(ctx, x - 11, base - 14, 22, 14, 2, WOOD); ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 9, base - 3, 3, 3); ctx.fillRect(x + 6, base - 3, 3, 3);
      ell(ctx, x, base - 27, 9, 12, '#c9773f'); ell(ctx, x - 3, base - 30, 3, 6, '#e8a36a');
      fillRR(ctx, x - 4, base - 42, 8, 5, 2, '#c9773f'); circ(ctx, x, base - 44, 2, '#e3b04b');
      ctx.fillStyle = '#8a4a26'; ctx.fillRect(x + 8, base - 22, 6, 2); ctx.fillRect(x + 12, base - 22, 2, 4);
      break;
    case 'globe':
      ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 1.5, base - 22, 3, 22); ell(ctx, x, base - 1, 8, 2, WOOD_DK);
      circ(ctx, x, base - 34, 12, '#5d9cc9');
      ell(ctx, x - 3, base - 37, 5, 3.5, '#8fc98f', 0.4); ell(ctx, x + 5, base - 29, 4, 2.5, '#8fc98f', -0.3);
      ctx.strokeStyle = '#c9a557'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, base - 34, 14, Math.PI * 0.6, Math.PI * 2.4); ctx.stroke();
      break;
    case 'candles':
      ctx.fillStyle = '#c9a557'; ctx.fillRect(x - 1.5, base - 34, 3, 34); ell(ctx, x, base - 1, 7, 2, '#c9a557');
      ctx.strokeStyle = '#c9a557'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x - 11, base - 38); ctx.quadraticCurveTo(x, base - 26, x + 11, base - 38); ctx.stroke();
      [-11, 0, 11].forEach((dx) => { fillRR(ctx, x + dx - 1.8, base - 46 + (dx ? 0 : -4), 3.6, 9, 1, '#f7efdc'); ell(ctx, x + dx, base - 49 + (dx ? 0 : -4), 1.8, 3, '#ffcf5a'); });
      break;
    case 'fountain':
      ell(ctx, x, base - 4, 14, 5, '#b9b3a8'); ell(ctx, x, base - 7, 12, 3, '#8fc3d9');
      ctx.fillStyle = '#b9b3a8'; ctx.fillRect(x - 2, base - 26, 4, 20); ell(ctx, x, base - 26, 7, 2.5, '#b9b3a8');
      ctx.strokeStyle = 'rgba(143,195,217,0.9)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, base - 28); ctx.quadraticCurveTo(x - 8, base - 36, x - 11, base - 8); ctx.moveTo(x, base - 28); ctx.quadraticCurveTo(x + 8, base - 36, x + 11, base - 8); ctx.stroke();
      break;
    case 'telescope':
      ctx.strokeStyle = '#6d5a3a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, base - 24); ctx.lineTo(x - 9, base); ctx.moveTo(x, base - 24); ctx.lineTo(x + 9, base); ctx.moveTo(x, base - 24); ctx.lineTo(x, base); ctx.stroke();
      ctx.save(); ctx.translate(x, base - 26); ctx.rotate(-0.55);
      fillRR(ctx, -10, -3.5, 26, 7, 2, '#c9a557'); fillRR(ctx, 14, -4.5, 5, 9, 1.5, '#b08a3e'); ctx.fillStyle = '#e8cf8a'; ctx.fillRect(-4, -3.5, 2, 7);
      ctx.restore();
      break;
    case 'chest':
      fillRR(ctx, x - 13, base - 15, 26, 15, 2, WOOD);
      ctx.fillStyle = '#ffd257'; for (let k = 0; k < 7; k++) circ(ctx, x - 9 + k * 3, base - 16 - (k % 2) * 2, 2.4, k % 3 ? '#ffd257' : '#e9a623');
      ctx.fillStyle = WOOD_DK; ctx.save(); ctx.translate(x - 13, base - 15); ctx.rotate(-0.5); fillRR(ctx, 0, -12, 26, 12, 4, WOOD_DK); ctx.restore();
      ctx.fillStyle = '#e0b84f'; ctx.fillRect(x - 13, base - 9, 26, 2);
      circ(ctx, x + 5, base - 20, 1.6, '#e0404f'); circ(ctx, x - 2, base - 21, 1.3, '#3fbf7f');
      break;
    case 'harp':
      ctx.strokeStyle = '#e0b84f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 8, base); ctx.lineTo(x - 8, base - 44); ctx.quadraticCurveTo(x + 4, base - 48, x + 10, base - 30); ctx.lineTo(x - 8, base); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,245,220,0.9)'; ctx.lineWidth = 0.5;
      for (let k = 1; k < 7; k++) { const px = x - 8 + k * 2.6; ctx.beginPath(); ctx.moveTo(px, base - 42 + k * 2); ctx.lineTo(px, base - 4 - k * 1.5 + 6); ctx.stroke(); }
      break;
    case 'statue':
      fillRR(ctx, x - 10, base - 16, 20, 16, 1, '#ece2c9'); ctx.fillStyle = '#d8cdb1'; ctx.fillRect(x - 12, base - 18, 24, 3);
      ell(ctx, x, base - 27, 6.5, 8, '#e0b84f'); circ(ctx, x + 2, base - 38, 5.5, '#e0b84f'); circ(ctx, x - 2, base - 44, 4, '#e0b84f');
      circ(ctx, x - 2, base - 44, 2.4, '#f2d27a'); ell(ctx, x + 7, base - 37, 3.5, 2.6, '#e0b84f'); star(ctx, x + 1, base - 49, 3, '#fff3b0');
      break;
    default: break;
  }
}

/* ---------------- desk (front layer) ---------------- */
export function paintRoomFront(ctx, def, r, furn = {}) {
  ctx.save();
  ctx.translate(WALL, 0);
  const d = L.desk;
  const w = d.x1 - d.x0;
  // counter
  fillRR(ctx, d.x0, d.top + 4, w, d.base - d.top - 4, 2, WOOD);
  woodGrain(ctx, d.x0, d.top + 4, w, d.base - d.top - 4, 71, false, 0.12);
  ctx.strokeStyle = shade(WOOD, 0.12); ctx.lineWidth = 1;
  for (let k = 0; k < 3; k++) { rr(ctx, d.x0 + 5 + k * ((w - 10) / 3), d.top + 11, (w - 10) / 3 - 4, d.base - d.top - 17, 2); ctx.stroke(); }
  fillRR(ctx, d.x0 - 3, d.top, w + 6, 6, 2, WOOD_DK);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(d.x0 - 2, d.top + 0.8, w + 4, 1.2);
  // brass sign
  fillRR(ctx, d.x0 + w / 2 - 17, d.top + 14, 34, 9, 2, '#e3c26a');
  ctx.fillStyle = '#6b4128'; ctx.font = `600 6px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('CHECKOUT', d.x0 + w / 2, d.top + 18.8);
  // bell
  ell(ctx, d.x0 + 12, d.top - 0.5, 5, 1.4, '#9a7b2f');
  ctx.fillStyle = '#e3b04b'; ctx.beginPath(); ctx.arc(d.x0 + 12, d.top - 1, 4.2, Math.PI, 0); ctx.fill();
  circ(ctx, d.x0 + 12, d.top - 5.8, 1.1, '#e3b04b'); ell(ctx, d.x0 + 10.5, d.top - 3, 1, 1.6, 'rgba(255,255,255,.6)');
  // stamp + ink
  fillRR(ctx, d.x0 + 24, d.top - 3, 7, 3, 1, '#3a2a40'); ctx.fillStyle = '#7a4b2e'; ctx.fillRect(d.x0 + 26.5, d.top - 8, 2, 5); circ(ctx, d.x0 + 27.5, d.top - 8.5, 2, '#7a4b2e');
  // stack of books or fern (or a desk piece from the Shop)
  if (furn.desk) { if (!LIVE.has(furn.desk)) drawDesk(ctx, furn.desk, d.x1 - 9, d.top); }
  else if (r.decor[2]) {
    fillRR(ctx, d.x1 - 14, d.top - 9, 10, 9, 2, '#c96f4a'); ctx.fillStyle = '#a95a3a'; ctx.fillRect(d.x1 - 15, d.top - 9, 12, 2.4);
    const leaves = [[-0.9, 12], [-0.45, 14], [0, 15], [0.45, 14], [0.9, 12], [-1.3, 9], [1.3, 9]];
    leaves.forEach(([a, len]) => { ctx.save(); ctx.translate(d.x1 - 9, d.top - 9); ctx.rotate(a); ell(ctx, 0, -len / 2, 2.4, len / 2, '#5e9c55'); ctx.restore(); });
  } else {
    [['#4f7cac', 12], ['#c0504d', 11], ['#e9b949', 13]].forEach(([c, bw], k) => fillRR(ctx, d.x1 - 16 + (k % 2), d.top - 3.2 - k * 3.2, bw, 3, 0.8, c));
  }
  ctx.restore();
}

/* ---------------- back layer ---------------- */
// How full the shelves look for a given collection level (0.3 at Lv 1 -> 1.0 at Lv 150).
export function shelfFill(lvl) {
  const f = Math.min(1, 0.3 + (0.7 * Math.log(Math.max(1, lvl))) / Math.log(150));
  return Math.round(f * 16) / 16;
}

function bookPile(ctx, x, y, cols, n, R) {
  for (let k = 0; k < n; k++) {
    const w = 13 + R() * 6; const off = (R() - 0.5) * 3;
    const bx = x - w / 2 + off; const by = y - (k + 1) * 3.4;
    fillRR(ctx, bx, by, w, 3.2, 0.8, cols[Math.floor(R() * cols.length)]);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(bx + 0.5, by + 0.3, w - 1, 0.7); // rounded spine
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(bx + 0.5, by + 2.5, w - 1, 0.6);
    ctx.fillStyle = GOLD; ctx.fillRect(bx + 2.2, by + 0.4, 0.6, 2.4); ctx.fillRect(bx + w - 4.6, by + 0.4, 0.6, 2.4); // gold bands
    ctx.fillStyle = '#f6ecd6'; ctx.fillRect(bx + w - 2.2, by + 0.6, 1.6, 2); // page edges
    ctx.fillStyle = 'rgba(160,130,90,0.6)'; ctx.fillRect(bx + w - 2.2, by + 1.5, 1.6, 0.3);
  }
}

export function paintRoomBack(ctx, i, def, r, fill, furn = {}, scene = 'meadow', look = FLOOR_LOOK[i] || {}) {
  const pal = def.pal;
  // outer walls: each branch's building has its own walls
  paintSides(ctx, scene);

  ctx.save();
  ctx.translate(WALL, 0);
  wallpaper(ctx, pal, IW, L.wallBottom, i * 97 + 13);

  // soft shadow under ceiling
  const g = ctx.createLinearGradient(0, 0, 0, 30); g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, IW, 30);
  ctx.fillStyle = shade(pal.trim, -0.1); ctx.fillRect(0, 0, IW, 4);

  // wainscoting
  const wy = 112;
  ctx.fillStyle = shade(pal.trim, 0.05); ctx.fillRect(0, wy, IW, L.wallBottom - wy);
  woodGrain(ctx, 0, wy, IW, L.wallBottom - wy, i * 5 + 2, false, 0.08);
  ctx.fillStyle = shade(pal.trim, 0.2); ctx.fillRect(0, wy, IW, 3);
  ctx.strokeStyle = shade(pal.trim, -0.15); ctx.lineWidth = 1;
  for (let x = 6; x < IW - 20; x += 34) { rr(ctx, x, wy + 8, 26, L.wallBottom - wy - 14, 2); ctx.stroke(); }

  // window (glass punched out so the real sky shows through)
  const wn = L.window;
  const winPath = () => {
    ctx.beginPath();
    ctx.moveTo(wn.x, wn.y + wn.h); ctx.lineTo(wn.x, wn.y + wn.w / 2);
    ctx.arc(wn.x + wn.w / 2, wn.y + wn.w / 2, wn.w / 2, Math.PI, 0);
    ctx.lineTo(wn.x + wn.w, wn.y + wn.h); ctx.closePath();
  };
  winPath(); ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.restore();
  winPath(); ctx.fillStyle = 'rgba(200,225,255,0.10)'; ctx.fill();
  ctx.save(); winPath(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath(); ctx.moveTo(wn.x + 6, wn.y + wn.h); ctx.lineTo(wn.x + 22, wn.y); ctx.lineTo(wn.x + 30, wn.y); ctx.lineTo(wn.x + 14, wn.y + wn.h); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = shade(pal.trim, 0.15); ctx.lineWidth = 3.2; winPath(); ctx.stroke();
  ctx.lineWidth = 1.8; ctx.beginPath();
  ctx.moveTo(wn.x + wn.w / 2, wn.y); ctx.lineTo(wn.x + wn.w / 2, wn.y + wn.h);
  ctx.moveTo(wn.x, wn.y + wn.h * 0.58); ctx.lineTo(wn.x + wn.w, wn.y + wn.h * 0.58); ctx.stroke();
  fillRR(ctx, wn.x - 5, wn.y + wn.h - 1, wn.w + 10, 5, 1.5, shade(pal.trim, 0.1));
  // curtains
  ctx.fillStyle = pal.accent;
  ctx.beginPath(); ctx.moveTo(wn.x - 7, wn.y - 4); ctx.lineTo(wn.x + 9, wn.y - 4); ctx.quadraticCurveTo(wn.x + 3, wn.y + 30, wn.x + 6, wn.y + 44); ctx.quadraticCurveTo(wn.x - 2, wn.y + 60, wn.x - 7, wn.y + wn.h + 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(wn.x + wn.w + 7, wn.y - 4); ctx.lineTo(wn.x + wn.w - 9, wn.y - 4); ctx.quadraticCurveTo(wn.x + wn.w - 3, wn.y + 30, wn.x + wn.w - 6, wn.y + 44); ctx.quadraticCurveTo(wn.x + wn.w + 2, wn.y + 60, wn.x + wn.w + 7, wn.y + wn.h + 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(pal.accent, -0.2); ctx.fillRect(wn.x - 8, wn.y - 6, wn.w + 16, 3.5);
  circ(ctx, wn.x + 5, wn.y + 44, 1.8, '#e3c26a'); circ(ctx, wn.x + wn.w - 5, wn.y + 44, 1.8, '#e3c26a');

  // mouse hole
  const h = L.hole;
  ctx.fillStyle = '#2b1b14';
  ctx.beginPath(); ctx.moveTo(h.x, L.floorTop); ctx.lineTo(h.x, h.top + h.w / 2); ctx.arc(h.x + h.w / 2, h.top + h.w / 2, h.w / 2, Math.PI, 0); ctx.lineTo(h.x + h.w, L.floorTop); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = shade(pal.trim, -0.25); ctx.lineWidth = 2; ctx.stroke();
  const hg = ctx.createRadialGradient(h.x + h.w / 2, L.floorTop - 6, 1, h.x + h.w / 2, L.floorTop - 6, 14);
  hg.addColorStop(0, 'rgba(255,200,120,0.35)'); hg.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = hg; ctx.fill();

  // plaque with the floor name
  const p = L.plaque;
  fillRR(ctx, p.x, p.y, p.w, p.h, 6, '#6d4630');
  ctx.strokeStyle = '#e3c26a'; ctx.lineWidth = 1.2; rr(ctx, p.x + 2.5, p.y + 2.5, p.w - 5, p.h - 5, 4.5); ctx.stroke();
  circ(ctx, p.x + 7, p.y + p.h / 2, 1.3, '#e3c26a'); circ(ctx, p.x + p.w - 7, p.y + p.h / 2, 1.3, '#e3c26a');
  ctx.fillStyle = '#fff3dc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let fs = 12; ctx.font = `600 ${fs}px ${FONT}`;
  while (ctx.measureText(def.name).width > p.w - 20 && fs > 7) { fs -= 0.5; ctx.font = `600 ${fs}px ${FONT}`; }
  ctx.fillText(def.name, p.x + p.w / 2, p.y + p.h / 2 + 0.5);

  // this floor's own details, or Shop furniture placed here
  const ceil = furn.ceiling || look.ceiling;
  if (ceil && !LIVE.has(ceil)) drawCeiling(ctx, ceil, pal);
  if (furn.wall || look.wall) drawWall(ctx, furn.wall || look.wall, pal);
  if (furn.board || look.board) drawBoard(ctx, furn.board || look.board, pal);

  // painting
  if (furn.art) drawArt(ctx, furn.art);
  else if (r.decor[3]) {
    const a = L.art;
    fillRR(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 2, '#c9a227');
    const sg = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); sg.addColorStop(0, '#9ed0f0'); sg.addColorStop(1, '#fce5b8');
    ctx.fillStyle = sg; ctx.fillRect(a.x, a.y, a.w, a.h);
    if (i % 2 === 0) {
      circ(ctx, a.x + a.w * 0.72, a.y + 9, 4.5, '#ffe28a');
      ctx.fillStyle = '#7cb36b'; ctx.beginPath(); ctx.moveTo(a.x, a.y + a.h); ctx.quadraticCurveTo(a.x + a.w * 0.3, a.y + a.h * 0.45, a.x + a.w * 0.6, a.y + a.h * 0.8); ctx.quadraticCurveTo(a.x + a.w * 0.85, a.y + a.h * 0.55, a.x + a.w, a.y + a.h * 0.75); ctx.lineTo(a.x + a.w, a.y + a.h); ctx.fill();
      ctx.fillStyle = '#c0504d'; ctx.fillRect(a.x + 9, a.y + a.h - 11, 6, 5); ctx.beginPath(); ctx.moveTo(a.x + 8, a.y + a.h - 11); ctx.lineTo(a.x + 12, a.y + a.h - 15); ctx.lineTo(a.x + 16, a.y + a.h - 11); ctx.fill();
    } else {
      ctx.fillStyle = '#6a8f6a'; ctx.fillRect(a.x, a.y, a.w, a.h);
      ell(ctx, a.x + a.w / 2, a.y + a.h, 11, 9, '#7a2f3a');
      circ(ctx, a.x + a.w / 2, a.y + a.h * 0.5, 7, '#b8aca1'); circ(ctx, a.x + a.w / 2 - 6, a.y + a.h * 0.28, 4.5, '#b8aca1'); circ(ctx, a.x + a.w / 2 + 6, a.y + a.h * 0.28, 4.5, '#b8aca1');
      circ(ctx, a.x + a.w / 2 - 6, a.y + a.h * 0.28, 2.8, '#f2b1ab'); circ(ctx, a.x + a.w / 2 + 6, a.y + a.h * 0.28, 2.8, '#f2b1ab');
      circ(ctx, a.x + a.w / 2 - 2.5, a.y + a.h * 0.48, 0.9, '#2b2320'); circ(ctx, a.x + a.w / 2 + 2.5, a.y + a.h * 0.48, 0.9, '#2b2320'); circ(ctx, a.x + a.w / 2, a.y + a.h * 0.58, 1.1, '#e98b8b');
    }
  }

  // pendant lamps (glow is drawn live)
  if (furn.lamp) { if (!LIVE.has(furn.lamp)) L.lamps.forEach((lx) => drawLamp(ctx, furn.lamp, lx, pal)); }
  else if (r.decor[1]) {
    L.lamps.forEach((lx) => {
      ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 22); ctx.stroke();
      ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.moveTo(lx - 5, 22); ctx.lineTo(lx + 5, 22); ctx.lineTo(lx + 10, 33); ctx.lineTo(lx - 10, 33); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(pal.accent, -0.2); ctx.fillRect(lx - 10, 32, 20, 2);
      circ(ctx, lx, 35, 2.6, '#fff3b0');
    });
  }

  // bookshelves fill up as the collection grows; piles appear on top at Lv 10/25/50
  for (let k = 0; k < r.shelves; k++) bookshelf(ctx, L.shelves[k], L.shelfTop, L.shelfW, L.shelfBot, def, i * 31 + k * 7 + 3, fill);
  const Rp = rng(i * 13 + 5);
  // (never on the first shelf: that's right under the painting, and a tall pile would cover its frame)
  const piles = r.lvl >= 50 ? 3 : r.lvl >= 25 ? 2 : r.lvl >= 10 ? 1 : 0;
  [1, 2, 3].filter((k) => k < r.shelves).slice(0, piles).forEach((k) => bookPile(ctx, L.shelves[k] + 14 + Rp() * 24, L.shelfTop - 3, def.books, 2 + Math.floor(Rp() * 3) + (r.lvl >= 100 ? 1 : 0), Rp));

  // floor
  ctx.fillStyle = pal.floor; ctx.fillRect(0, L.floorTop, IW, L.beamTop - L.floorTop);
  const R = rng(i * 7 + 1);
  // plank-to-plank colour variation, then the grain
  for (let y = L.floorTop, row = 0; y < L.beamTop; y += 6, row++) {
    let x = -R() * 30;
    while (x < IW) { const len = 48 + R() * 20; ctx.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'; ctx.fillRect(x, y, len, 6); x += len; }
  }
  woodGrain(ctx, 0, L.floorTop, IW, L.beamTop - L.floorTop, i * 3 + 9, false, 0.1);
  ctx.fillStyle = pal.floor2;
  for (let y = L.floorTop + 5; y < L.beamTop; y += 6) ctx.fillRect(0, y, IW, 1);
  for (let y = L.floorTop, row = 0; y < L.beamTop; y += 6, row++) for (let x = (row % 2) * 24 + R() * 10; x < IW; x += 48 + R() * 20) ctx.fillRect(x, y, 1, 6);
  const fg = ctx.createLinearGradient(0, L.floorTop, 0, L.floorTop + 8); fg.addColorStop(0, 'rgba(0,0,0,0.2)'); fg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fg; ctx.fillRect(0, L.floorTop, IW, 8);
  // beam / ceiling of the floor below
  ctx.fillStyle = BEAM[scene] || '#5b3a26'; ctx.fillRect(-WALL, L.beamTop, IW + WALL * 2, FH - L.beamTop);
  ctx.fillStyle = BEAM[scene] && scene !== 'meadow' ? shade(BEAM[scene], 0.12) : '#704a31'; ctx.fillRect(-WALL, L.beamTop, IW + WALL * 2, 3);
  woodGrain(ctx, -WALL, L.beamTop + 3, IW + WALL * 2, FH - L.beamTop - 3, i * 11 + 4, false, 0.1);
  ctx.fillStyle = '#4a2f1f'; for (let x = 10; x < IW; x += 44) { circ(ctx, x, L.beamTop + 10, 1.6, '#4a2f1f'); }

  // rug
  if (furn.rug) drawRug(ctx, furn.rug, pal);
  else if (r.decor[0]) {
    ell(ctx, 142, 163, 108, 7.5, shade(pal.accent, -0.15));
    ell(ctx, 142, 163, 102, 6, pal.accent);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.ellipse(142, 163, 94, 4.4, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }

  // seats
  for (let k = 0; k < r.seats; k++) drawSeat(ctx, def.seat, L.seats[k], L.laneBack, pal.seatCol, L.seatFacing[k]);

  if (r.decor[4]) centerpiece(ctx, def.center, L.center, L.laneBack, pal);

  ctx.restore();
}
