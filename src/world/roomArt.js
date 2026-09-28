// Pre-rendered static art for each library floor (walls, shelves, seats, décor).
// Drawn once into offscreen canvases and re-rendered only when the floor changes.
// Two things decide how a floor looks:
//   • the LOCATION style (materials: walls, floor, window, shelves, lamps, desk, mouse hole)
//   • the FLOOR itself (genre palette, wallpaper motif, frieze, signature painting, seats,
//     centrepiece) plus any furniture the player placed there.
import { L, IW, FH, WALL } from './layout.js';
import { rr, fillRR, ell, circ, shade, rng, star, rgba, heart } from './draw.js';
import { drawRug, drawLamp, LIVE_LAMPS, drawPlant, drawArt, shelfMaterial, drawBookshelf, drawLadder, drawCenter } from './furnitureArt.js';

export const SEAT_H = { armchair: 16, beanbag: 11, cafe: 15, trunk: 17, wingback: 16, bench: 15, stool: 23, throne: 16, piano: 16, royal: 16, hammock: 14, bathtub: 15, cloudbag: 11 };
const WOOD = '#8a5a3a';
const WOOD_DK = '#6b4128';
const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';

export function mixHex(a, b, t) {
  const A = parseInt(a.slice(1), 16); const B = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * t);
  return '#' + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
}

/* ---------------- wallpaper motifs (the floor's identity) ---------------- */
function wallpaper(ctx, pal, w, h, seed, alpha = 1) {
  ctx.save();
  if (alpha >= 1) { ctx.fillStyle = pal.wall; ctx.fillRect(0, 0, w, h); }
  ctx.globalAlpha = alpha;
  const c2 = pal.wall2;
  const R = rng(seed);
  ctx.fillStyle = c2; ctx.strokeStyle = c2;
  switch (pal.pattern) {
    case 'stripes': for (let x = 0; x < w; x += 18) ctx.fillRect(x, 0, 9, h); break;
    case 'dots': for (let y = 8, row = 0; y < h; y += 14, row++) for (let x = row % 2 ? 7 : 0; x < w; x += 14) circ(ctx, x, y, 2, c2); break;
    case 'checks':
      ctx.globalAlpha = 0.55 * alpha;
      for (let y = 0; y < h; y += 12) for (let x = ((y / 12) % 2) * 12; x < w; x += 24) ctx.fillRect(x, y, 12, 12);
      break;
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
  ctx.restore();
}

/* ---------------- location wall materials ---------------- */
const WY = 112; // top of the wainscot

function tapestry(ctx, pal, x0, x1, bottom, seed) {
  // A hanging cloth in the floor's colours: rock and stone walls still show whose floor it is.
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.lineTo(x1, bottom);
  for (let x = x1; x >= x0; x -= 12) ctx.lineTo(x - 6, bottom + (((x / 12) | 0) % 2 ? 5 : 0));
  ctx.lineTo(x0, bottom); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.save(); ctx.translate(2, 2); ctx.fill(); ctx.restore();
  ctx.clip();
  ctx.fillStyle = pal.wall; ctx.fillRect(x0, 0, x1 - x0, bottom + 6);
  ctx.translate(x0, 0); wallpaper(ctx, pal, x1 - x0, bottom + 6, seed, 0.9); ctx.translate(-x0, 0);
  ctx.restore();
  ctx.fillStyle = pal.trim; ctx.fillRect(x0 - 3, 0, x1 - x0 + 6, 3);
  ctx.strokeStyle = shade(pal.trim, 0.2); ctx.lineWidth = 1; ctx.strokeRect(x0 + 3, 4, x1 - x0 - 6, bottom - 8);
}

function paintWall(ctx, sty, pal, i) {
  const H = L.wallBottom;
  const seed = i * 97 + 13;
  const R = rng(seed + 5);
  switch (sty.wall) {
    case 'shiplap': {
      const base = mixHex(pal.wall, '#ffffff', 0.5);
      ctx.fillStyle = base; ctx.fillRect(0, 0, IW, H);
      wallpaper(ctx, pal, IW, WY, seed, 0.22);
      for (let y = 9; y < WY; y += 9) { ctx.fillStyle = 'rgba(60,80,100,0.18)'; ctx.fillRect(0, y, IW, 1); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, y + 1, IW, 0.8); }
      for (let y = 4; y < WY; y += 9) for (let x = (y % 18 ? 30 : 60) + R() * 10; x < IW; x += 90) circ(ctx, x, y, 0.7, 'rgba(60,60,70,0.35)');
      const bead = mixHex('#4f7fa8', pal.trim, 0.25);
      ctx.fillStyle = bead; ctx.fillRect(0, WY, IW, H - WY);
      ctx.fillStyle = shade(bead, -0.15); for (let x = 3; x < IW; x += 7) ctx.fillRect(x, WY + 4, 1, H - WY - 4);
      // twisted rope trim
      ctx.fillStyle = '#d9c49a'; ctx.fillRect(0, WY - 2, IW, 4);
      ctx.strokeStyle = '#b39a6a'; ctx.lineWidth = 0.8; for (let x = 0; x < IW; x += 4) { ctx.beginPath(); ctx.moveTo(x, WY - 2); ctx.lineTo(x + 3, WY + 2); ctx.stroke(); }
      break;
    }
    case 'rock': {
      const base = mixHex('#3e3850', pal.wall, 0.16);
      ctx.fillStyle = base; ctx.fillRect(0, 0, IW, H);
      for (let k = 0; k < 70; k++) ell(ctx, R() * IW, R() * H, 6 + R() * 16, 3 + R() * 8, R() < 0.5 ? shade(base, 0.07) : shade(base, -0.08), R() * 3);
      ctx.strokeStyle = shade(base, -0.25); ctx.lineWidth = 0.8;
      for (let k = 0; k < 6; k++) { let x = R() * IW, y = R() * H; ctx.beginPath(); ctx.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (R() - 0.5) * 14; y += 5 + R() * 8; ctx.lineTo(x, y); } ctx.stroke(); }
      tapestry(ctx, pal, 94, 262, 44, seed);
      ctx.fillStyle = shade(base, -0.12); ctx.fillRect(0, WY + 18, IW, H - WY - 18);
      ctx.fillStyle = shade(base, 0.1); ctx.fillRect(0, WY + 18, IW, 2);
      break;
    }
    case 'panel': {
      const base = mixHex('#2f4f4a', pal.wall, 0.32);
      ctx.fillStyle = base; ctx.fillRect(0, 0, IW, H);
      wallpaper(ctx, pal, IW, WY, seed, 0.16);
      ctx.strokeStyle = shade(base, -0.28); ctx.lineWidth = 1;
      for (let x = 0; x < IW; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WY); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, 56); ctx.lineTo(IW, 56); ctx.stroke();
      for (let x = 0; x < IW; x += 44) for (const y of [4, 52, 60, WY - 4]) { circ(ctx, x + 4, y, 1.1, '#c99a4d'); circ(ctx, x + 40, y, 1.1, '#c99a4d'); }
      // brass pipe along the ceiling
      ctx.fillStyle = '#b07a2e'; ctx.fillRect(0, 3, IW, 5); ctx.fillStyle = '#e0b060'; ctx.fillRect(0, 3.6, IW, 1.2);
      for (let x = 30; x < IW; x += 70) fillRR(ctx, x, 1.5, 6, 8, 1.5, '#8a5a24');
      const kick = mixHex('#2a2824', pal.wall, 0.12);
      ctx.fillStyle = kick; ctx.fillRect(0, WY, IW, H - WY);
      ctx.strokeStyle = shade(kick, 0.12); ctx.lineWidth = 0.7; for (let x = -40; x < IW; x += 8) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 16, WY); ctx.stroke(); }
      ctx.fillStyle = '#c99a4d'; ctx.fillRect(0, WY, IW, 2.5);
      break;
    }
    case 'stone': {
      const base = mixHex('#a39fb0', pal.wall, 0.14);
      ctx.fillStyle = base; ctx.fillRect(0, 0, IW, H);
      for (let y = 0, row = 0; y < H; y += 16, row++) for (let x = row % 2 ? -15 : 0; x < IW; x += 30) {
        fillRR(ctx, x + 1, y + 1, 28, 14, 2, R() < 0.5 ? shade(base, 0.05) : shade(base, -0.06));
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 2, y + 1.5, 26, 1);
      }
      tapestry(ctx, pal, 96, 260, 46, seed);
      const course = shade(base, -0.18);
      for (let x = 0, k = 0; x < IW; x += 44, k++) fillRR(ctx, x + 1, WY + 1, 42, H - WY - 2, 2, k % 2 ? course : shade(course, 0.05));
      ctx.fillStyle = shade(base, 0.12); ctx.fillRect(0, WY, IW, 2);
      break;
    }
    case 'marble': {
      const base = mixHex('#e6ebf3', pal.wall, 0.4); // cool sky-marble so white clouds and mice still read
      ctx.fillStyle = base; ctx.fillRect(0, 0, IW, H);
      wallpaper(ctx, pal, IW, WY, seed, 0.25);
      ctx.strokeStyle = 'rgba(160,150,140,0.28)'; ctx.lineWidth = 0.7;
      for (let k = 0; k < 7; k++) { let x = R() * IW, y = R() * WY; ctx.beginPath(); ctx.moveTo(x, y); for (let j = 0; j < 5; j++) { x += 6 + R() * 10; y += (R() - 0.4) * 10; ctx.quadraticCurveTo(x - 4, y - 4, x, y); } ctx.stroke(); }
      ctx.fillStyle = '#d9b24c'; ctx.fillRect(0, 5, IW, 1.2);
      const lower = mixHex('#c9cfdc', pal.wall, 0.25);
      ctx.fillStyle = lower; ctx.fillRect(0, WY, IW, H - WY);
      ctx.fillStyle = '#d9b24c'; ctx.fillRect(0, WY, IW, 2); ctx.fillRect(0, WY + 6, IW, 0.8);
      for (let x = 20; x < IW; x += 48) { ctx.strokeStyle = 'rgba(217,178,76,0.6)'; ctx.lineWidth = 0.8; rr(ctx, x, WY + 11, 30, H - WY - 17, 3); ctx.stroke(); }
      break;
    }
    default: { // cottage wallpaper + wooden wainscot
      wallpaper(ctx, pal, IW, L.wallBottom, seed);
      ctx.fillStyle = shade(pal.trim, 0.05); ctx.fillRect(0, WY, IW, L.wallBottom - WY);
      ctx.fillStyle = shade(pal.trim, 0.2); ctx.fillRect(0, WY, IW, 3);
      ctx.strokeStyle = shade(pal.trim, -0.15); ctx.lineWidth = 1;
      for (let x = 6; x < IW - 20; x += 34) { rr(ctx, x, WY + 8, 26, L.wallBottom - WY - 14, 2); ctx.stroke(); }
    }
  }
  // depth: ceiling shadow, low-wall shade and soft inner corners
  const g = ctx.createLinearGradient(0, 0, 0, 30); g.addColorStop(0, 'rgba(0,0,0,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, IW, 30);
  const g2 = ctx.createLinearGradient(0, H - 26, 0, H); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = g2; ctx.fillRect(0, H - 26, IW, 26);
  for (const [x0, dir] of [[0, 1], [IW, -1]]) { const gc = ctx.createLinearGradient(x0, 0, x0 + dir * 14, 0); gc.addColorStop(0, 'rgba(0,0,0,0.2)'); gc.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gc; ctx.fillRect(dir > 0 ? 0 : IW - 14, 0, 14, H); }
  if (sty.wall === 'paper' || sty.wall === 'shiplap') { ctx.fillStyle = shade(pal.trim, -0.1); ctx.fillRect(0, 0, IW, 4); }
}

/* ---------------- friezes: a signature band along the top of each floor ---------------- */
function frieze(ctx, kind, pal, i) {
  const R = rng(i * 17 + 3);
  const catenary = (y0, sag, fn, step = 18) => { for (let x = 0; x <= IW; x += step) fn(x, y0 + Math.sin((x / IW) * Math.PI * 3) * sag * 0.3 + sag * Math.abs(Math.sin((x / 118) * Math.PI))); };
  switch (kind) {
    case 'fairy': {
      ctx.strokeStyle = 'rgba(58,42,32,0.55)'; ctx.lineWidth = 0.5; ctx.beginPath();
      for (let x = 0; x <= IW; x += 4) ctx.lineTo(x, 5 + 4 * Math.abs(Math.sin((x / 88) * Math.PI)));
      ctx.stroke();
      const cols = ['#ffd257', '#f7a8c4', '#9ec5f0', '#b8e08a'];
      for (let x = 6, k = 0; x < IW; x += 11, k++) circ(ctx, x, 6.5 + 4 * Math.abs(Math.sin((x / 88) * Math.PI)), 1.5, cols[k % 4]);
      break;
    }
    case 'alphabet': {
      ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(IW, 3); ctx.stroke();
      const cols = ['#f28b82', '#fbbc04', '#7cc4b0', '#aecbfa', '#d7aefb'];
      ctx.font = `700 5.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let x = 4, k = 0; x < IW - 8; x += 13, k++) {
        ctx.fillStyle = cols[k % cols.length]; ctx.beginPath(); ctx.moveTo(x, 3); ctx.lineTo(x + 11, 3); ctx.lineTo(x + 5.5, 14); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(String.fromCharCode(65 + (k % 26)), x + 5.5, 7);
      }
      break;
    }
    case 'mugs': {
      fillRR(ctx, 0, 4, IW, 3, 1, shade(pal.trim, -0.1));
      const cols = ['#c96f4a', '#e8e1c9', '#6b8f71', '#f0c05a'];
      for (let x = 8, k = 0; x < IW; x += 22, k++) {
        ctx.strokeStyle = '#6b4128'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, 7); ctx.lineTo(x, 10); ctx.stroke();
        fillRR(ctx, x - 3.5, 10, 7, 7, 1.5, cols[k % 4]); ctx.strokeStyle = cols[k % 4]; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 3.6, 13.5, 2, -1.3, 1.3); ctx.stroke();
      }
      break;
    }
    case 'rope': {
      ctx.strokeStyle = '#c9a557'; ctx.lineWidth = 2.2; ctx.beginPath();
      for (let x = 0; x <= IW; x += 4) ctx.lineTo(x, 4 + 5 * Math.abs(Math.sin((x / 70) * Math.PI)));
      ctx.stroke();
      ctx.strokeStyle = '#8a6a2e'; ctx.lineWidth = 0.6; for (let x = 0; x < IW; x += 5) { const y = 4 + 5 * Math.abs(Math.sin((x / 70) * Math.PI)); ctx.beginPath(); ctx.moveTo(x - 1, y - 1); ctx.lineTo(x + 1, y + 1); ctx.stroke(); }
      for (let x = 0; x <= IW; x += 70) circ(ctx, x, 4.5, 2.4, '#b08a3e');
      break;
    }
    case 'cobweb': {
      // a sloping attic beam and cobwebs in the corners
      ctx.fillStyle = '#5b4033'; ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(0, 30); ctx.lineTo(34, 0); ctx.lineTo(50, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(34, 0); ctx.lineTo(37, 0); ctx.lineTo(0, 33); ctx.fill();
      for (const [cx, dir] of [[IW - 2, -1], [52, 1]]) {
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.5;
        for (let k = 0; k < 5; k++) { const a = (k / 4) * Math.PI / 2; ctx.beginPath(); ctx.moveTo(cx, 1); ctx.lineTo(cx + dir * Math.cos(a) * 22, 1 + Math.sin(a) * 22); ctx.stroke(); }
        for (let r = 6; r <= 20; r += 7) { ctx.beginPath(); for (let k = 0; k <= 4; k++) { const a = (k / 4) * Math.PI / 2; const x = cx + dir * Math.cos(a) * r; const y = 1 + Math.sin(a) * r; k ? ctx.quadraticCurveTo(cx + dir * Math.cos(a - 0.2) * r * 0.85, 1 + Math.sin(a - 0.2) * r * 0.85, x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      }
      circ(ctx, IW - 14, 16, 1.4, '#2a2430'); ctx.strokeStyle = '#2a2430'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(IW - 14, 1); ctx.lineTo(IW - 14, 15); ctx.stroke();
      break;
    }
    case 'vines': {
      for (let x = 6; x < IW; x += 26 + R() * 18) {
        const len = 10 + R() * 22;
        ctx.strokeStyle = '#4f7f4a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 4, len / 2, x - 1, len); ctx.stroke();
        for (let y = 4; y < len; y += 5) ell(ctx, x + (y % 10 ? 2.4 : -2) + (y / len) * 1.5, y, 2.4, 1.3, y % 10 ? '#6aa84f' : '#8fc98f', y % 10 ? 0.6 : -0.6);
        if (R() < 0.4) circ(ctx, x, len + 1, 1.6, '#f4a3b5');
      }
      break;
    }
    case 'constellation': {
      const pts = [];
      for (let k = 0; k < 14; k++) pts.push([10 + R() * (IW - 20), 4 + R() * 18]);
      ctx.strokeStyle = 'rgba(255,233,163,0.45)'; ctx.lineWidth = 0.5; ctx.beginPath();
      pts.forEach((p, k) => { if (k % 4 === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }); ctx.stroke();
      pts.forEach((p) => star(ctx, p[0], p[1], 1.6, '#ffe9a3'));
      break;
    }
    case 'banners': {
      const cols = [pal.accent, '#2d4a3e', '#e0b84f', '#7a1f2b'];
      ctx.strokeStyle = '#3e2a24'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(IW, 3); ctx.stroke();
      for (let x = 4, k = 0; x < IW - 10; x += 16, k++) {
        const c = cols[k % cols.length];
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, 3); ctx.lineTo(x + 12, 3); ctx.lineTo(x + 12, 14); ctx.lineTo(x + 6, 19); ctx.lineTo(x, 14); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; if (k % 2) star(ctx, x + 6, 10, 2.2, '#f2d27a'); else circ(ctx, x + 6, 10, 1.8, '#f2d27a');
      }
      break;
    }
    case 'staff': {
      ctx.strokeStyle = 'rgba(75,63,120,0.55)'; ctx.lineWidth = 0.5;
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(0, 3 + k * 2.4); ctx.lineTo(IW, 3 + k * 2.4); ctx.stroke(); }
      for (let x = 12; x < IW; x += 17) { const y = 3 + Math.floor(R() * 5) * 2.4; ell(ctx, x, y, 1.9, 1.4, '#4b3f78', -0.4); ctx.fillStyle = '#4b3f78'; ctx.fillRect(x + 1.4, y - 7, 0.7, 7); }
      ctx.fillStyle = '#4b3f78'; ctx.font = `700 14px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText('𝄞', 1, 14);
      break;
    }
    case 'laurel': {
      ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = 0; x <= IW; x += 3) ctx.lineTo(x, 5 + 3 * Math.abs(Math.sin((x / 44) * Math.PI)));
      ctx.stroke();
      for (let x = 2; x < IW; x += 6) { const y = 5 + 3 * Math.abs(Math.sin((x / 44) * Math.PI)); ell(ctx, x, y - 1.6, 2.4, 1.1, '#d9b24c', 0.5); ell(ctx, x + 2, y + 1.6, 2.4, 1.1, '#e0c060', -0.5); }
      for (let x = 44; x < IW; x += 88) circ(ctx, x, 8, 2.2, '#e0b84f');
      break;
    }
    default: break;
  }
}

/* ---------------- windows (glass is punched out: the real sky shows through) ---------------- */
function windowPath(ctx, kind) {
  const wn = L.window; const cx = wn.x + wn.w / 2;
  ctx.beginPath();
  switch (kind) {
    case 'porthole': case 'gear': ctx.arc(cx, 46, 25, 0, Math.PI * 2); break;
    case 'round': ctx.arc(cx, 46, 28, 0, Math.PI * 2); break;
    case 'lancet':
      ctx.moveTo(wn.x + 4, wn.y + wn.h); ctx.lineTo(wn.x + 4, wn.y + 26);
      ctx.quadraticCurveTo(wn.x + 4, wn.y + 4, cx, wn.y - 2); ctx.quadraticCurveTo(wn.x + wn.w - 4, wn.y + 4, wn.x + wn.w - 4, wn.y + 26);
      ctx.lineTo(wn.x + wn.w - 4, wn.y + wn.h); ctx.closePath(); break;
    case 'crystal': {
      const pts = [[0, 30], [6, 12], [18, 4], [30, 2], [44, 8], [52, 22], [54, 44], [48, 62], [34, 70], [16, 68], [4, 56]];
      pts.forEach(([x, y], k) => (k ? ctx.lineTo(wn.x - 1 + x, wn.y + y) : ctx.moveTo(wn.x - 1 + x, wn.y + y))); ctx.closePath(); break;
    }
    default: // arch
      ctx.moveTo(wn.x, wn.y + wn.h); ctx.lineTo(wn.x, wn.y + wn.w / 2);
      ctx.arc(cx, wn.y + wn.w / 2, wn.w / 2, Math.PI, 0);
      ctx.lineTo(wn.x + wn.w, wn.y + wn.h); ctx.closePath();
  }
}

function drawWindow(ctx, kind, pal, sty) {
  const wn = L.window; const cx = wn.x + wn.w / 2;
  windowPath(ctx, kind); ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.restore();
  windowPath(ctx, kind); ctx.fillStyle = 'rgba(200,225,255,0.10)'; ctx.fill();
  if (kind === 'lancet') { // stained glass panes
    ctx.save(); windowPath(ctx, kind); ctx.clip();
    const cols = [pal.accent, '#6d5fa3', '#e0b84f', '#3f7f6f', '#b33f40'];
    for (let y = wn.y - 2, r = 0; y < wn.y + wn.h; y += 12, r++) for (let x = wn.x, k = 0; x < wn.x + wn.w; x += 11, k++) { ctx.fillStyle = rgba(cols[(r + k) % cols.length], 0.32); ctx.fillRect(x, y, 11, 12); }
    ctx.restore();
  }
  ctx.save(); windowPath(ctx, kind); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath(); ctx.moveTo(wn.x + 6, wn.y + wn.h); ctx.lineTo(wn.x + 22, wn.y); ctx.lineTo(wn.x + 30, wn.y); ctx.lineTo(wn.x + 14, wn.y + wn.h); ctx.fill();
  ctx.restore();
  switch (kind) {
    case 'porthole':
      ctx.strokeStyle = '#b08a3e'; ctx.lineWidth = 6; windowPath(ctx, kind); ctx.stroke();
      ctx.strokeStyle = '#e8c070'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, 46, 27.5, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; circ(ctx, cx + Math.cos(a) * 25, 46 + Math.sin(a) * 25, 1.3, '#6b4a1e'); }
      break;
    case 'gear': {
      ctx.fillStyle = '#9c6a34';
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; ctx.save(); ctx.translate(cx + Math.cos(a) * 29, 46 + Math.sin(a) * 29); ctx.rotate(a); ctx.fillRect(-2.5, -3.5, 5, 7); ctx.restore(); }
      ctx.strokeStyle = '#c99a4d'; ctx.lineWidth = 6; windowPath(ctx, kind); ctx.stroke();
      ctx.strokeStyle = '#9c6a34'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 25, 46); ctx.lineTo(cx + 25, 46); ctx.moveTo(cx, 21); ctx.lineTo(cx, 71); ctx.stroke();
      circ(ctx, cx, 46, 4, '#c99a4d'); circ(ctx, cx, 46, 1.6, '#6b4520');
      break;
    }
    case 'round':
      ctx.strokeStyle = '#d9b24c'; ctx.lineWidth = 3.5; windowPath(ctx, kind); ctx.stroke();
      ctx.lineWidth = 1.2; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 6, 46 + Math.sin(a) * 6); ctx.lineTo(cx + Math.cos(a) * 28, 46 + Math.sin(a) * 28); ctx.stroke(); }
      circ(ctx, cx, 46, 6, 'rgba(217,178,76,0.9)'); star(ctx, cx, 46, 4, '#fff3b0');
      // sheer drapes
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.moveTo(cx - 34, 12); ctx.quadraticCurveTo(cx - 20, 30, cx - 30, 84); ctx.lineTo(cx - 36, 84); ctx.lineTo(cx - 38, 12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 34, 12); ctx.quadraticCurveTo(cx + 20, 30, cx + 30, 84); ctx.lineTo(cx + 36, 84); ctx.lineTo(cx + 38, 12); ctx.fill();
      fillRR(ctx, cx - 40, 9, 80, 3, 1.5, '#d9b24c');
      break;
    case 'lancet':
      ctx.strokeStyle = '#6d6880'; ctx.lineWidth = 4; windowPath(ctx, kind); ctx.stroke();
      ctx.strokeStyle = '#3a3446'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, wn.y - 1); ctx.lineTo(cx, wn.y + wn.h); for (let y = wn.y + 20; y < wn.y + wn.h; y += 16) { ctx.moveTo(wn.x + 4, y); ctx.lineTo(wn.x + wn.w - 4, y); } ctx.stroke();
      fillRR(ctx, wn.x - 2, wn.y + wn.h - 1, wn.w + 4, 6, 1.5, '#8e8a9c');
      break;
    case 'crystal': {
      ctx.strokeStyle = '#2a2436'; ctx.lineWidth = 3; windowPath(ctx, kind); ctx.stroke();
      const R = rng(77);
      const shards = [[wn.x + 2, wn.y + 36], [wn.x + 10, wn.y + 12], [wn.x + 46, wn.y + 10], [wn.x + 52, wn.y + 48], [wn.x + 30, wn.y + 70], [wn.x + 6, wn.y + 60]];
      shards.forEach(([x, y], k) => { const c = k % 2 ? '#7de8d8' : '#b69cf0'; for (let j = 0; j < 3; j++) { const a = R() * Math.PI * 2; const len = 6 + R() * 8; ctx.fillStyle = rgba(c, 0.9); ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.lineTo(x + 2, y + 1); ctx.fill(); } });
      break;
    }
    default: // arch with curtains
      ctx.strokeStyle = shade(pal.trim, 0.15); ctx.lineWidth = 3.2; windowPath(ctx, kind); ctx.stroke();
      ctx.lineWidth = 1.8; ctx.beginPath();
      ctx.moveTo(cx, wn.y); ctx.lineTo(cx, wn.y + wn.h);
      ctx.moveTo(wn.x, wn.y + wn.h * 0.58); ctx.lineTo(wn.x + wn.w, wn.y + wn.h * 0.58); ctx.stroke();
      fillRR(ctx, wn.x - 5, wn.y + wn.h - 1, wn.w + 10, 5, 1.5, shade(pal.trim, 0.1));
      ctx.fillStyle = pal.accent;
      ctx.beginPath(); ctx.moveTo(wn.x - 7, wn.y - 4); ctx.lineTo(wn.x + 9, wn.y - 4); ctx.quadraticCurveTo(wn.x + 3, wn.y + 30, wn.x + 6, wn.y + 44); ctx.quadraticCurveTo(wn.x - 2, wn.y + 60, wn.x - 7, wn.y + wn.h + 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(wn.x + wn.w + 7, wn.y - 4); ctx.lineTo(wn.x + wn.w - 9, wn.y - 4); ctx.quadraticCurveTo(wn.x + wn.w - 3, wn.y + 30, wn.x + wn.w - 6, wn.y + 44); ctx.quadraticCurveTo(wn.x + wn.w + 2, wn.y + 60, wn.x + wn.w + 7, wn.y + wn.h + 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(pal.accent, -0.2); ctx.fillRect(wn.x - 8, wn.y - 6, wn.w + 16, 3.5);
      circ(ctx, wn.x + 5, wn.y + 44, 1.8, '#e3c26a'); circ(ctx, wn.x + wn.w - 5, wn.y + 44, 1.8, '#e3c26a');
  }
}

/* ---------------- mouse hole (where visitors come in) ---------------- */
function mouseHole(ctx, wall, pal) {
  const h = L.hole; const cx = h.x + h.w / 2;
  const arch = () => { ctx.beginPath(); ctx.moveTo(h.x, L.floorTop); ctx.lineTo(h.x, h.top + h.w / 2); ctx.arc(cx, h.top + h.w / 2, h.w / 2, Math.PI, 0); ctx.lineTo(h.x + h.w, L.floorTop); ctx.closePath(); };
  const warm = () => { const hg = ctx.createRadialGradient(cx, L.floorTop - 6, 1, cx, L.floorTop - 6, 14); hg.addColorStop(0, 'rgba(255,200,120,0.35)'); hg.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = hg; ctx.fill(); };
  switch (wall) {
    case 'rock':
      ctx.fillStyle = '#16121e'; ctx.beginPath(); ctx.moveTo(h.x - 2, L.floorTop); ctx.lineTo(h.x + 2, h.top + 12); ctx.lineTo(h.x + 7, h.top + 2); ctx.lineTo(h.x + 12, h.top + 6); ctx.lineTo(h.x + 17, h.top); ctx.lineTo(h.x + 22, h.top + 10); ctx.lineTo(h.x + h.w + 2, L.floorTop); ctx.closePath(); ctx.fill();
      { const hg = ctx.createRadialGradient(cx, L.floorTop - 6, 1, cx, L.floorTop - 6, 14); hg.addColorStop(0, 'rgba(125,232,216,0.35)'); hg.addColorStop(1, 'rgba(125,232,216,0)'); ctx.fillStyle = hg; ctx.fill(); }
      break;
    case 'panel':
      arch(); ctx.fillStyle = '#1d1b24'; ctx.fill(); warm();
      ctx.strokeStyle = '#c99a4d'; ctx.lineWidth = 2.4; arch(); ctx.stroke();
      for (let k = 0; k < 5; k++) { const a = Math.PI + (k / 4) * Math.PI; circ(ctx, cx + Math.cos(a) * (h.w / 2 + 2.6), h.top + h.w / 2 + Math.sin(a) * (h.w / 2 + 2.6), 0.9, '#8a5a24'); }
      ctx.fillStyle = '#6d6d78'; ctx.save(); ctx.translate(h.x + h.w, L.floorTop); ctx.transform(0.35, -0.12, 0, 1, 0, 0); arch(); ctx.restore(); // hatch door swung open
      break;
    case 'stone':
      arch(); ctx.fillStyle = '#1d1512'; ctx.fill(); warm();
      ctx.strokeStyle = '#6d6880'; ctx.lineWidth = 3; arch(); ctx.stroke();
      ctx.save(); ctx.translate(h.x + h.w + 1, 0); ctx.scale(0.35, 1); fillRR(ctx, 0, h.top + 2, h.w, L.floorTop - h.top - 2, 4, '#6b4128'); ctx.restore();
      ctx.fillStyle = '#2f2a33'; ctx.fillRect(h.x + h.w + 1, h.top + 8, 6, 1.4); ctx.fillRect(h.x + h.w + 1, h.top + 18, 6, 1.4);
      break;
    case 'marble':
      arch(); ctx.fillStyle = '#2a2430'; ctx.fill(); warm();
      ctx.strokeStyle = '#d9b24c'; ctx.lineWidth = 2.4; arch(); ctx.stroke(); star(ctx, cx, h.top - 4, 2.4, '#d9b24c');
      break;
    default:
      arch(); ctx.fillStyle = '#2b1b14'; ctx.fill();
      ctx.strokeStyle = shade(pal.trim, -0.25); ctx.lineWidth = 2; ctx.stroke();
      warm();
  }
}

/* ---------------- name plaque ---------------- */
function plaque(ctx, def, sty) {
  const p = L.plaque;
  const [bg, border, ink] = sty.plaque;
  ctx.save();
  fillRR(ctx, p.x + 1.5, p.y + 2.5, p.w, p.h, 6, 'rgba(0,0,0,0.22)');
  switch (sty.wall) {
    case 'shiplap': // rope-framed board
      fillRR(ctx, p.x, p.y, p.w, p.h, 5, bg);
      ctx.strokeStyle = '#d9c49a'; ctx.lineWidth = 2.2; rr(ctx, p.x + 2, p.y + 2, p.w - 4, p.h - 4, 4); ctx.stroke();
      ctx.strokeStyle = '#b39a6a'; ctx.lineWidth = 0.6; ctx.setLineDash([1.5, 1.5]); rr(ctx, p.x + 2, p.y + 2, p.w - 4, p.h - 4, 4); ctx.stroke(); ctx.setLineDash([]);
      break;
    case 'rock': // carved stone tablet with glowing letters
      fillRR(ctx, p.x, p.y, p.w, p.h, 3, bg); ctx.strokeStyle = border; ctx.lineWidth = 0.8; rr(ctx, p.x + 3, p.y + 3, p.w - 6, p.h - 6, 2); ctx.stroke();
      break;
    case 'panel': // riveted brass plate
      fillRR(ctx, p.x, p.y, p.w, p.h, 2, border); fillRR(ctx, p.x + 2, p.y + 2, p.w - 4, p.h - 4, 1.5, bg);
      for (const x of [p.x + 5, p.x + p.w - 5]) for (const y of [p.y + 5, p.y + p.h - 5]) circ(ctx, x, y, 1.2, border);
      break;
    case 'stone': // hanging banner
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.w, p.y); ctx.lineTo(p.x + p.w, p.y + p.h); ctx.lineTo(p.x + p.w - 8, p.y + p.h - 5); ctx.lineTo(p.x + 8, p.y + p.h - 5); ctx.lineTo(p.x, p.y + p.h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = border; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x + 3, p.y + 3); ctx.lineTo(p.x + p.w - 3, p.y + 3); ctx.moveTo(p.x + 3, p.y + p.h - 8); ctx.lineTo(p.x + p.w - 3, p.y + p.h - 8); ctx.stroke();
      break;
    case 'marble': // cloud-edged sign
      for (let k = 0; k < 7; k++) circ(ctx, p.x + 8 + k * (p.w - 16) / 6, p.y + (k % 2 ? 2 : 4), 7, '#ffffff');
      fillRR(ctx, p.x, p.y + 2, p.w, p.h - 2, 12, bg); ctx.strokeStyle = border; ctx.lineWidth = 1.2; rr(ctx, p.x + 3, p.y + 5, p.w - 6, p.h - 8, 9); ctx.stroke();
      break;
    default:
      fillRR(ctx, p.x, p.y, p.w, p.h, 6, bg);
      ctx.strokeStyle = border; ctx.lineWidth = 1.2; rr(ctx, p.x + 2.5, p.y + 2.5, p.w - 5, p.h - 5, 4.5); ctx.stroke();
      circ(ctx, p.x + 7, p.y + p.h / 2, 1.3, border); circ(ctx, p.x + p.w - 7, p.y + p.h / 2, 1.3, border);
  }
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let fs = 12; ctx.font = `600 ${fs}px ${FONT}`;
  while (ctx.measureText(def.name).width > p.w - 20 && fs > 7) { fs -= 0.5; ctx.font = `600 ${fs}px ${FONT}`; }
  if (sty.wall === 'rock') { ctx.shadowColor = sty.glow || '#7de8d8'; ctx.shadowBlur = 6; }
  ctx.fillText(def.name, p.x + p.w / 2, p.y + p.h / 2 + (sty.wall === 'stone' ? -2 : 0.5));
  ctx.restore();
}

/* ---------------- floors ---------------- */
function paintFloor(ctx, kind, pal, i) {
  const y0 = L.floorTop; const y1 = L.beamTop; const h = y1 - y0;
  const R = rng(i * 7 + 1);
  switch (kind) {
    case 'deck': {
      const c = mixHex(pal.floor, '#c9b89c', 0.6);
      ctx.fillStyle = c; ctx.fillRect(0, y0, IW, h);
      ctx.fillStyle = shade(c, -0.14); for (let y = y0 + 5; y < y1; y += 6) ctx.fillRect(0, y, IW, 1);
      for (let y = y0, row = 0; y < y1; y += 6, row++) for (let x = (row % 2) * 30 + R() * 10; x < IW; x += 60) { ctx.fillStyle = shade(c, -0.14); ctx.fillRect(x, y, 1, 6); circ(ctx, x + 3, y + 3, 0.5, '#5a4a3a'); }
      break;
    }
    case 'flagstone': {
      const c = mixHex('#5a5468', pal.floor, 0.15);
      ctx.fillStyle = shade(c, -0.25); ctx.fillRect(0, y0, IW, h);
      for (let row = 0; row < 3; row++) for (let x = row * -9; x < IW; ) { const w = 14 + R() * 18; fillRR(ctx, x + 1, y0 + 1 + row * 8, w - 2, 7, 2, R() < 0.5 ? c : shade(c, 0.07)); x += w; }
      break;
    }
    case 'checker': {
      for (let row = 0; row < 3; row++) for (let x = 0, k = row; x < IW; x += 11, k++) { ctx.fillStyle = k % 2 ? '#2a2a33' : mixHex('#efe6d2', pal.floor, 0.1); ctx.fillRect(x, y0 + row * 8, 11, 8); }
      ctx.fillStyle = '#c99a4d'; ctx.fillRect(0, y1 - 2, IW, 2);
      break;
    }
    case 'carpet': {
      const c = '#6d6880';
      ctx.fillStyle = c; ctx.fillRect(0, y0, IW, h);
      ctx.fillStyle = mixHex('#8e1f2f', pal.accent, 0.15); ctx.fillRect(0, y0 + 3, IW, h - 5);
      ctx.fillStyle = '#e0b84f'; ctx.fillRect(0, y0 + 4, IW, 1); ctx.fillRect(0, y1 - 3, IW, 1);
      for (let x = 8; x < IW; x += 16) star(ctx, x, y0 + (h - 2) / 2 + 1.5, 1.6, 'rgba(224,184,79,0.6)', 4, 0.4);
      break;
    }
    case 'marble': {
      const c = mixHex('#f4efe4', pal.floor, 0.12);
      for (let row = 0; row < 2; row++) for (let x = row * -12, k = 0; x < IW; x += 24, k++) { ctx.fillStyle = (k + row) % 2 ? c : shade(c, -0.05); ctx.fillRect(x, y0 + row * 12, 24, 12); }
      ctx.strokeStyle = 'rgba(160,150,140,0.35)'; ctx.lineWidth = 0.5; for (let k = 0; k < 10; k++) { const x = R() * IW; ctx.beginPath(); ctx.moveTo(x, y0 + R() * h); ctx.quadraticCurveTo(x + 8, y0 + R() * h, x + 16, y0 + R() * h); ctx.stroke(); }
      ctx.fillStyle = '#d9b24c'; ctx.fillRect(0, y0 + 11.5, IW, 0.8);
      break;
    }
    default: {
      ctx.fillStyle = pal.floor; ctx.fillRect(0, y0, IW, h);
      ctx.fillStyle = pal.floor2;
      for (let y = y0 + 5; y < y1; y += 6) ctx.fillRect(0, y, IW, 1);
      for (let y = y0, row = 0; y < y1; y += 6, row++) for (let x = (row % 2) * 24 + R() * 10; x < IW; x += 48 + R() * 20) ctx.fillRect(x, y, 1, 6);
    }
  }
  // depth: darker where the floor meets the wall, lighter towards the viewer
  const fg = ctx.createLinearGradient(0, y0, 0, y1); fg.addColorStop(0, 'rgba(0,0,0,0.24)'); fg.addColorStop(0.45, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(255,255,255,0.07)');
  ctx.fillStyle = fg; ctx.fillRect(0, y0, IW, h);
}

function paintBeam(ctx, sty) {
  const [main, lt, dk] = sty.beam;
  ctx.fillStyle = main; ctx.fillRect(-WALL, L.beamTop, IW + WALL * 2, FH - L.beamTop);
  ctx.fillStyle = lt; ctx.fillRect(-WALL, L.beamTop, IW + WALL * 2, 2.5);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-WALL, FH - 2.5, IW + WALL * 2, 2.5);
  switch (sty.shell.kind) {
    case 'brass': for (let x = 6; x < IW; x += 22) circ(ctx, x, L.beamTop + 9, 1.4, '#c99a4d'); break;
    case 'marble': ctx.fillStyle = sty.shell.gold; ctx.fillRect(-WALL, L.beamTop + 8, IW + WALL * 2, 1.2); break;
    case 'stone': case 'rock': for (let x = 0; x < IW; x += 30) { ctx.fillStyle = dk; ctx.fillRect(x, L.beamTop + 3, 1, FH - L.beamTop - 5); } break;
    case 'shingle': ctx.fillStyle = sty.shell.stripe; ctx.fillRect(-WALL, L.beamTop + 7, IW + WALL * 2, 3); break;
    default: for (let x = 10; x < IW; x += 44) circ(ctx, x, L.beamTop + 10, 1.6, dk);
  }
}

/* ---------------- the building's outer walls (cross-section edges) ---------------- */
function paintSides(ctx, sty) {
  const s = sty.shell;
  for (const x0 of [0, WALL + IW]) {
    ctx.fillStyle = s.side; ctx.fillRect(x0, 0, WALL, FH);
    switch (s.kind) {
      case 'shingle': ctx.fillStyle = s.dk; for (let y = 0; y < FH; y += 7) ctx.fillRect(x0, y, WALL, 0.8); ctx.fillStyle = s.stripe; ctx.fillRect(x0, 60, WALL, 14); break;
      case 'rock': { const R = rng(x0 + 3); for (let k = 0; k < 14; k++) ell(ctx, x0 + R() * WALL, R() * FH, 2 + R() * 3, 3 + R() * 5, R() < 0.5 ? s.lt : s.dk); break; }
      case 'brass': ctx.fillStyle = s.dk; for (let y = 0; y < FH; y += 38) ctx.fillRect(x0, y, WALL, 1); for (let y = 6; y < FH; y += 38) { circ(ctx, x0 + 2.5, y, 0.9, s.lt); circ(ctx, x0 + WALL - 2.5, y, 0.9, s.lt); } break;
      case 'stone': ctx.fillStyle = s.dk; for (let y = 0, r = 0; y < FH; y += 14, r++) { ctx.fillRect(x0, y, WALL, 1); ctx.fillRect(x0 + (r % 2 ? 2 : 5), y, 1, 14); } break;
      case 'marble': ctx.fillStyle = s.gold; ctx.fillRect(x0 + WALL / 2 - 0.6, 0, 1.2, FH); break;
      default: ctx.fillStyle = s.dk; ctx.fillRect(x0 + WALL / 2 - 0.5, 0, 1, FH); // timber
    }
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x0 + 1, 0, 2, FH);
  }
}

/* ---------------- little location touches (only in empty wall space) ---------------- */
function locationProps(ctx, sty, r, hasCenter) {
  const x = 269; const y = 66;
  switch (sty.wall) {
    case 'shiplap': // life ring
      ctx.strokeStyle = '#f4f1ea'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#d9534f'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x, y, 8.5, k * Math.PI / 2, k * Math.PI / 2 + 0.6); ctx.stroke(); }
      ctx.strokeStyle = '#d9c49a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x, y - 20); ctx.stroke();
      break;
    case 'rock': {
      const R = rng(55);
      for (const [cx, cy, dir] of [[4, 0, 1], [IW - 6, 0, -1]]) for (let k = 0; k < 4; k++) { const c = k % 2 ? '#7de8d8' : '#b69cf0'; ctx.fillStyle = rgba(c, 0.9); ctx.beginPath(); ctx.moveTo(cx + dir * k * 4 - 2, cy); ctx.lineTo(cx + dir * k * 4, cy + 8 + R() * 10); ctx.lineTo(cx + dir * k * 4 + 2, cy); ctx.fill(); }
      if (!hasCenter) for (let k = 0; k < 3; k++) { const mx = 259 + k * 7; ctx.fillStyle = '#e8e0f0'; ctx.fillRect(mx - 0.6, L.floorTop - 6 - k * 2, 1.2, 6 + k * 2); ctx.fillStyle = k % 2 ? '#7de8d8' : '#b69cf0'; ctx.beginPath(); ctx.ellipse(mx, L.floorTop - 6 - k * 2, 3.4, 2.4, 0, Math.PI, 0); ctx.fill(); }
      break;
    }
    case 'panel':
      ctx.fillStyle = '#b07a2e'; ctx.fillRect(x - 2, 0, 4, y + 12);
      circ(ctx, x, y, 7, '#c99a4d'); circ(ctx, x, y, 5.5, '#fbf6ea');
      ctx.strokeStyle = '#c0504d'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 3); ctx.stroke();
      for (let k = 0; k < 5; k++) { const a = Math.PI * 0.8 + k * 0.35; ctx.fillStyle = '#3a3029'; ctx.fillRect(x + Math.cos(a) * 4.2, y + Math.sin(a) * 4.2, 0.6, 0.6); }
      ctx.strokeStyle = '#c0504d'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y + 16, 3.6, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 3.6, y + 16); ctx.lineTo(x + 3.6, y + 16); ctx.moveTo(x, y + 12.4); ctx.lineTo(x, y + 19.6); ctx.stroke();
      break;
    case 'stone':
      ctx.strokeStyle = '#b9b8c6'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 12, y - 12); ctx.lineTo(x + 12, y + 12); ctx.moveTo(x + 12, y - 12); ctx.lineTo(x - 12, y + 12); ctx.stroke();
      ctx.fillStyle = '#6b4128'; ctx.fillRect(x - 13, y - 13, 3, 3); ctx.fillRect(x + 10, y - 13, 3, 3);
      ctx.fillStyle = '#7a1f2b'; ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y - 8); ctx.lineTo(x + 8, y + 2); ctx.quadraticCurveTo(x, y + 12, x - 8, y + 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e0b84f'; ctx.lineWidth = 1; ctx.stroke(); star(ctx, x, y - 1, 3.4, '#e0b84f');
      break;
    case 'marble': {
      const R = rng(8);
      for (let k = 0; k < 7; k++) star(ctx, 258 + R() * 22, 50 + R() * 50, 1.4 + R() * 1.4, '#d9b24c');
      break;
    }
    default: // dried herbs hanging from a nail
      circ(ctx, x, y - 16, 1.2, '#3a2a20');
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x - 3, y - 10); ctx.moveTo(x, y - 16); ctx.lineTo(x + 3, y - 10); ctx.stroke();
      for (const [dx, c] of [[-4, '#8fae62'], [0, '#b69cf0'], [4, '#8fae62']]) { ctx.strokeStyle = '#6a8a4a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + dx, y + 8); ctx.stroke(); for (let j = 0; j < 4; j++) ell(ctx, x + dx * (0.4 + j * 0.2), y - 6 + j * 4, 1.6, 1, c); }
      ctx.fillStyle = '#c9a070'; ctx.fillRect(x - 3, y - 11, 6, 2);
  }
}

/* ---------------- seats ---------------- */
export function drawSeat(ctx, type, x, base, col, dir = 1) {
  const dk = shade(col, -0.22); const lt = shade(col, 0.16);
  ell(ctx, x, base + 0.3, 15, 2, 'rgba(0,0,0,0.14)');
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
    case 'hammock':
      ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 17, base - 34, 2.4, 34); ctx.fillRect(x + 14.6, base - 34, 2.4, 34);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 15, base - 30); ctx.quadraticCurveTo(x, base - 4, x + 15, base - 30); ctx.quadraticCurveTo(x, base - 12, x - 15, base - 30); ctx.fill();
      ctx.strokeStyle = lt; ctx.lineWidth = 0.7; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 5, base - 13 - Math.abs(k) * 2.4); ctx.lineTo(x + k * 5 + 1, base - 18 - Math.abs(k) * 3); ctx.stroke(); }
      break;
    case 'bathtub':
      fillRR(ctx, x - 17, base - 19, 34, 14, 7, '#f4f1ea'); fillRR(ctx, x - 17, base - 20, 34, 3, 1.5, '#ffffff');
      ctx.fillStyle = '#d8d0c2'; ctx.fillRect(x - 15, base - 9, 30, 1.2);
      for (const dx of [-12, 12]) { ctx.fillStyle = '#d9b24c'; ctx.beginPath(); ctx.moveTo(x + dx - 2, base - 6); ctx.lineTo(x + dx + 2, base - 6); ctx.lineTo(x + dx + 3, base); ctx.lineTo(x + dx - 3, base); ctx.fill(); }
      for (let k = 0; k < 5; k++) circ(ctx, x - 10 + k * 5, base - 20 - (k % 2) * 1.5, 2.2 + (k % 2), 'rgba(255,255,255,0.95)');
      ctx.strokeStyle = '#b9b3a8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 15 * dir, base - 20); ctx.lineTo(x + 15 * dir, base - 27); ctx.lineTo(x + 11 * dir, base - 27); ctx.stroke();
      break;
    case 'cloudbag':
      for (const [dx, dy, r] of [[-9, -6, 7], [0, -8, 8.5], [9, -6, 7], [-4, -12, 6], [5, -13, 6]]) circ(ctx, x + dx, base + dy, r, '#ffffff');
      ell(ctx, x, base - 3, 14, 3, '#e3eef8');
      break;
    default: fillRR(ctx, x - 12, base - 16, 24, 8, 3, col);
  }
}

/* ---------------- desk (front layer) ---------------- */
export function deskBody(ctx, kind, d, sty, def) {
  const w = d.x1 - d.x0; const top = d.top; const h = d.base - top;
  ell(ctx, (d.x0 + d.x1) / 2, d.base + 0.5, w / 2 + 4, 2.6, 'rgba(0,0,0,0.18)');
  switch (kind) {
    case 'hull':
      ctx.fillStyle = '#6b4a34'; ctx.beginPath(); ctx.moveTo(d.x0 - 4, top + 3); ctx.lineTo(d.x1 + 4, top + 3); ctx.quadraticCurveTo(d.x1 + 2, d.base - 2, d.x1 - 10, d.base); ctx.lineTo(d.x0 + 10, d.base); ctx.quadraticCurveTo(d.x0 - 2, d.base - 2, d.x0 - 4, top + 3); ctx.fill();
      ctx.strokeStyle = '#4a3121'; ctx.lineWidth = 0.8; for (let y = top + 9; y < d.base; y += 6) { ctx.beginPath(); ctx.moveTo(d.x0, y); ctx.lineTo(d.x1, y); ctx.stroke(); }
      ctx.fillStyle = '#3f5f7f'; ctx.fillRect(d.x0 - 4, top + 3, w + 8, 3);
      circ(ctx, d.x0 + 14, top + 18, 4.5, '#b08a3e'); circ(ctx, d.x0 + 14, top + 18, 3.2, 'rgba(160,210,235,0.9)');
      ctx.strokeStyle = '#d9c49a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(d.x0 - 3, top + 1); ctx.lineTo(d.x1 + 3, top + 1); ctx.stroke();
      return;
    case 'slab':
      ctx.fillStyle = '#453f52'; ctx.beginPath(); ctx.moveTo(d.x0 + 4, top + 4); ctx.lineTo(d.x1 - 4, top + 4); ctx.lineTo(d.x1 - 1, d.base); ctx.lineTo(d.x0 + 1, d.base); ctx.fill();
      { const R = rng(4); for (let k = 0; k < 8; k++) ell(ctx, d.x0 + 6 + R() * (w - 12), top + 8 + R() * (h - 12), 4 + R() * 5, 2 + R() * 3, R() < 0.5 ? '#524a60' : '#3a3446'); }
      fillRR(ctx, d.x0 - 4, top, w + 8, 6, 2, '#7d758c'); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(d.x0 - 3, top + 0.8, w + 6, 1);
      return;
    case 'brass': case 'brassdesk':
      fillRR(ctx, d.x0, top + 4, w, h - 4, 2, '#9c6a34');
      ctx.strokeStyle = '#6b4520'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { rr(ctx, d.x0 + 5 + k * ((w - 10) / 3), top + 11, (w - 10) / 3 - 4, h - 17, 1); ctx.stroke(); }
      for (let x = d.x0 + 4; x < d.x1; x += 8) { circ(ctx, x, top + 7, 0.8, '#e8c070'); circ(ctx, x, d.base - 3, 0.8, '#e8c070'); }
      fillRR(ctx, d.x0 - 3, top, w + 6, 6, 1.5, '#5a4a3e');
      ctx.fillStyle = '#b07a2e'; ctx.fillRect(d.x1 - 7, -40, 6, top + 40); ctx.fillStyle = '#e0b060'; ctx.fillRect(d.x1 - 6, -40, 1.4, top + 40);
      fillRR(ctx, d.x1 - 9, top - 12, 10, 8, 2, '#c99a4d');
      return;
    case 'carved':
      fillRR(ctx, d.x0, top + 4, w, h - 4, 2, '#4a2a1e');
      ctx.strokeStyle = '#e0b84f'; ctx.lineWidth = 0.8;
      for (let k = 0; k < 3; k++) { const x = d.x0 + 5 + k * ((w - 10) / 3); const ww = (w - 10) / 3 - 4; ctx.beginPath(); ctx.moveTo(x, d.base - 4); ctx.lineTo(x, top + 18); ctx.quadraticCurveTo(x + ww / 2, top + 9, x + ww, top + 18); ctx.lineTo(x + ww, d.base - 4); ctx.stroke(); }
      fillRR(ctx, d.x0 - 3, top, w + 6, 6, 2, '#6b3a28'); ctx.fillStyle = '#e0b84f'; ctx.fillRect(d.x0 - 3, top + 4.5, w + 6, 1.2);
      return;
    case 'cloud':
      for (let k = 0; k < 6; k++) circ(ctx, d.x0 + 6 + k * (w - 12) / 5, d.base - 6 - (k % 2) * 3, 9, '#ffffff');
      fillRR(ctx, d.x0 + 2, top + 8, w - 4, h - 12, 8, '#ffffff'); ell(ctx, (d.x0 + d.x1) / 2, d.base - 2, w / 2, 4, '#e3eef8');
      fillRR(ctx, d.x0 - 3, top, w + 6, 6, 3, '#f2ecdf'); ctx.fillStyle = '#d9b24c'; ctx.fillRect(d.x0 - 3, top + 4.6, w + 6, 1.2);
      return;
    case 'marble':
      fillRR(ctx, d.x0, top + 4, w, h - 4, 2, '#efe9df');
      ctx.strokeStyle = 'rgba(150,140,130,0.4)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(d.x0 + 6, top + 10); ctx.quadraticCurveTo(d.x0 + 30, top + 20, d.x0 + 22, d.base - 4); ctx.moveTo(d.x1 - 20, top + 8); ctx.quadraticCurveTo(d.x1 - 10, top + 18, d.x1 - 16, d.base - 6); ctx.stroke();
      fillRR(ctx, d.x0 - 3, top, w + 6, 6, 2, '#3a3440');
      return;
    case 'stump':
      ctx.fillStyle = '#6b4a34'; ctx.beginPath(); ctx.moveTo(d.x0 + 2, top + 4); ctx.lineTo(d.x1 - 2, top + 4); ctx.lineTo(d.x1 + 4, d.base); ctx.lineTo(d.x0 - 4, d.base); ctx.fill();
      ctx.strokeStyle = '#4a3121'; ctx.lineWidth = 0.8; for (let x = d.x0 + 6; x < d.x1; x += 7) { ctx.beginPath(); ctx.moveTo(x, top + 6); ctx.lineTo(x + (x % 3) - 1, d.base); ctx.stroke(); }
      ell(ctx, (d.x0 + d.x1) / 2, top + 3, w / 2 + 2, 4, '#d9b98c'); ctx.strokeStyle = '#b8956a'; ctx.lineWidth = 0.6; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse((d.x0 + d.x1) / 2, top + 3, (w / 2) * (k / 4), 4 * (k / 4), 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = '#6b4a34'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(d.x0 + 4, top + 12); ctx.lineTo(d.x0 - 4, top + 6); ctx.stroke(); ell(ctx, d.x0 - 5, top + 5, 2.6, 1.4, '#6aa84f', -0.5);
      return;
    default: // wood (or register: wood + a till on top)
      fillRR(ctx, d.x0, top + 4, w, h - 4, 2, WOOD);
      ctx.strokeStyle = shade(WOOD, 0.12); ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) { rr(ctx, d.x0 + 5 + k * ((w - 10) / 3), top + 11, (w - 10) / 3 - 4, h - 17, 2); ctx.stroke(); }
      fillRR(ctx, d.x0 - 3, top, w + 6, 6, 2, WOOD_DK);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(d.x0 - 2, top + 0.8, w + 4, 1.2);
  }
}

export function paintRoomFront(ctx, def, r, sty, furn = {}) {
  ctx.save();
  ctx.translate(WALL, 0);
  const d = L.desk;
  const w = d.x1 - d.x0;
  const kind = furn.desk || sty.desk;
  deskBody(ctx, kind, d, sty, def);
  // checkout sign
  const signCol = sty.wall === 'rock' ? '#7de8d8' : sty.wall === 'marble' ? '#d9b24c' : '#e3c26a';
  fillRR(ctx, d.x0 + w / 2 - 17, d.top + 14, 34, 9, 2, signCol);
  ctx.fillStyle = sty.wall === 'rock' ? '#1d1b24' : '#6b4128'; ctx.font = `600 6px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('CHECKOUT', d.x0 + w / 2, d.top + 18.8);
  // bell (a ship's bell on the hull desk)
  if (kind === 'hull') {
    ctx.strokeStyle = '#6b4a1e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(d.x0 + 6, d.top); ctx.lineTo(d.x0 + 6, d.top - 12); ctx.lineTo(d.x0 + 14, d.top - 12); ctx.stroke();
    ctx.fillStyle = '#e3b04b'; ctx.beginPath(); ctx.moveTo(d.x0 + 10, d.top - 11); ctx.quadraticCurveTo(d.x0 + 9, d.top - 4, d.x0 + 8, d.top - 3); ctx.lineTo(d.x0 + 20, d.top - 3); ctx.quadraticCurveTo(d.x0 + 19, d.top - 4, d.x0 + 18, d.top - 11); ctx.fill();
  } else {
    ell(ctx, d.x0 + 12, d.top - 0.5, 5, 1.4, '#9a7b2f');
    ctx.fillStyle = '#e3b04b'; ctx.beginPath(); ctx.arc(d.x0 + 12, d.top - 1, 4.2, Math.PI, 0); ctx.fill();
    circ(ctx, d.x0 + 12, d.top - 5.8, 1.1, '#e3b04b'); ell(ctx, d.x0 + 10.5, d.top - 3, 1, 1.6, 'rgba(255,255,255,.6)');
  }
  // stamp + ink
  fillRR(ctx, d.x0 + 24, d.top - 3, 7, 3, 1, '#3a2a40'); ctx.fillStyle = '#7a4b2e'; ctx.fillRect(d.x0 + 26.5, d.top - 8, 2, 5); circ(ctx, d.x0 + 27.5, d.top - 8.5, 2, '#7a4b2e');
  if (kind === 'register') {
    fillRR(ctx, d.x0 + 34, d.top - 15, 20, 15, 2, '#c99a4d'); fillRR(ctx, d.x0 + 36, d.top - 20, 16, 6, 1, '#b07a2e');
    ctx.fillStyle = '#1d1b24'; ctx.fillRect(d.x0 + 38, d.top - 19, 12, 4); ctx.fillStyle = '#7cc46b'; ctx.font = `700 3.6px ${FONT}`; ctx.fillText('0.50', d.x0 + 44, d.top - 16.8);
    for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) circ(ctx, d.x0 + 38 + j * 4, d.top - 11 + k * 3.4, 1, '#fbf6ea');
  }
  // plant on the desk (décor) or a little stack of books
  if (r.decor[2]) drawPlant(ctx, furn.plant, d.x1 - 9, d.top);
  else [['#4f7cac', 12], ['#c0504d', 11], ['#e9b949', 13]].forEach(([c, bw], k) => fillRR(ctx, d.x1 - 16 + (k % 2), d.top - 3.2 - k * 3.2, bw, 3, 0.8, c));
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
    fillRR(ctx, x - w / 2 + off, y - (k + 1) * 3.4, w, 3.2, 0.8, cols[Math.floor(R() * cols.length)]);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x - w / 2 + off + w - 2.2, y - (k + 1) * 3.4 + 0.6, 1.6, 2);
  }
}

export function lampKind(sty, furn) { return furn?.lamp || sty.lamp; }

export function paintRoomBack(ctx, i, def, r, fill, sty, furn = {}) {
  const pal = def.pal;
  paintSides(ctx, sty);

  ctx.save();
  ctx.translate(WALL, 0);
  paintWall(ctx, sty, pal, i);
  frieze(ctx, def.frieze, pal, i);

  drawWindow(ctx, sty.window, pal, sty);
  mouseHole(ctx, sty.wall, pal);
  plaque(ctx, def, sty);
  locationProps(ctx, sty, r, r.decor[4]);

  // painting: the floor's own signature piece, or wall art you placed here
  if (r.decor[3]) drawArt(ctx, furn.art || def.art, L.art, pal);

  // lamps (moving lamps are drawn live)
  const lk = lampKind(sty, furn);
  if (r.decor[1] && !LIVE_LAMPS.has(lk)) L.lamps.forEach((lx) => drawLamp(ctx, lk, lx, pal));

  // bookshelves fill up as the collection grows; piles appear on top at Lv 10/25/50
  const m = shelfMaterial(furn.shelf || sty.shelf.kind, sty, pal);
  for (let k = 0; k < r.shelves; k++) drawBookshelf(ctx, m, L.shelves[k], L.shelfTop, L.shelfW, L.shelfBot, def.books, i * 31 + k * 7 + 3, fill);
  if (m.ladder && r.shelves >= 2) drawLadder(ctx, L.shelves[1] + 30, L.shelfTop, L.shelfBot);
  const Rp = rng(i * 13 + 5);
  const piles = r.lvl >= 50 ? r.shelves : r.lvl >= 25 ? Math.min(2, r.shelves) : r.lvl >= 10 ? 1 : 0;
  for (let k = 0; k < piles; k++) bookPile(ctx, L.shelves[k] + 14 + Rp() * 24, L.shelfTop - 3, def.books, 2 + Math.floor(Rp() * 3) + (r.lvl >= 100 ? 1 : 0), Rp);

  paintFloor(ctx, sty.floor, pal, i);
  paintBeam(ctx, sty);

  if (r.decor[0]) drawRug(ctx, furn.rug, 142, 163, 108, pal);

  const seat = furn.seat || def.seat;
  for (let k = 0; k < r.seats; k++) drawSeat(ctx, seat, L.seats[k], L.laneBack, pal.seatCol, L.seatFacing[k]);

  if (r.decor[4] && !LIVE_CENTERS.has(furn.center || def.center)) drawCenter(ctx, furn.center || def.center, L.center, L.laneBack, pal, 0);

  ctx.restore();
}

// Centrepieces with moving parts are drawn every frame instead of cached.
export const LIVE_CENTERS = new Set(['fishtank', 'orrery', 'tome', 'crystalball', 'cuckoo', 'clock']);
export { drawLamp, drawCenter, heart };
