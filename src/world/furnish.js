// Floor furnishings: each floor's own built-in details (a wall piece, something under the window
// and a ceiling garland) plus any Shop furniture the player placed there. Everything is drawn in
// the same flat style as the rest of the room art and only in spots that are otherwise empty:
//   wall    : left of the bookshelves, above the mouse hole  (x 3..33, y 44..114)
//   board   : under the window, above the wainscot           (x 288..336, y 90..111)
//   ceiling : a garland along the ceiling, left and right of the name plaque
//   desk    : right end of the checkout desk (front layer)
//   rug / lamp / art : replace the floor's default rug, lamps and painting
import { L } from './layout.js';
import { rr, fillRR, ell, circ, shade, rng, star } from './draw.js';

const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';
const WOOD = '#8a5a3a';
const WOOD_DK = '#6b4128';

// Built-in look of each floor (by floor index).
export const FLOOR_LOOK = [
  { wall: 'hooks', board: 'sampler', ceiling: 'herbs' }, // Cozy Nook
  { wall: 'heightchart', board: 'drawings', ceiling: 'letters' }, // Storybook Corner
  { wall: 'pans', board: 'mugshelf', ceiling: 'mugs' }, // Tea & Crumbs Café
  { wall: 'anchor', board: 'treasuremap', ceiling: 'rope' }, // Adventure Map Room
  { wall: 'wanted', board: 'evidence', ceiling: 'cobwebs' }, // Mystery Attic
  { wall: 'birdcage', board: 'pressed', ceiling: 'vines' }, // Poetry Greenhouse
  { wall: 'planetchart', board: 'constellation', ceiling: 'mobile' }, // Stargazer Observatory
  { wall: 'shield', board: 'decree', ceiling: 'pennants' }, // Royal Archive
  { wall: 'violin', board: 'sheetmusic', ceiling: 'notes' }, // Moonlit Music Hall
  { wall: 'laurel', board: 'relief', ceiling: 'swags' }, // Grand Atrium
];

/* ---------------- ceiling garlands ---------------- */
const SPANS = [[2, 98], [258, 350]];
// Hang `n` items along each span of a sagging string. item(x, y, k)
function garland(ctx, col, sag, step, item, lineW = 0.7) {
  for (const [a, b] of SPANS) {
    const y0 = 3;
    const yAt = (x) => y0 + Math.sin(((x - a) / (b - a)) * Math.PI) * sag;
    if (col) {
      ctx.strokeStyle = col; ctx.lineWidth = lineW; ctx.beginPath(); ctx.moveTo(a, y0);
      for (let x = a; x <= b; x += 4) ctx.lineTo(x, yAt(x));
      ctx.stroke();
      circ(ctx, a, y0, 1.1, WOOD_DK); circ(ctx, b, y0, 1.1, WOOD_DK);
    }
    let k = 0;
    for (let x = a + step / 2; x < b - 2; x += step, k++) item(x, yAt(x), k);
  }
}
const flag = (ctx, x, y, w, h, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill(); };

export function drawCeiling(ctx, kind, pal, t = 0) {
  const R = rng(kind.length * 7 + 3);
  switch (kind) {
    case 'herbs': garland(ctx, '#8a6a3a', 5, 16, (x, y, k) => { ctx.strokeStyle = '#6a8a4a'; ctx.lineWidth = 0.8; for (const dx of [-1.5, 0, 1.5]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + 9); ctx.stroke(); } ell(ctx, x, y + 8, 2.4, 3.2, k % 2 ? '#a7c47a' : '#b69cf0'); ctx.fillStyle = '#c9a070'; ctx.fillRect(x - 1.5, y, 3, 1.6); }); break;
    case 'letters': garland(ctx, '#b8707f', 6, 12, (x, y, k) => { flag(ctx, x, y, 9, 11, ['#f28b82', '#fbbc04', '#7cc4b0', '#aecbfa', '#d7aefb'][k % 5]); ctx.fillStyle = '#fff'; ctx.font = `700 5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ABCDEFGHIJKLMNOP'[(k + (x > 200 ? 8 : 0)) % 16], x, y + 3.6); }); break;
    case 'mugs': garland(ctx, '#6f7d4f', 4, 15, (x, y, k) => { ctx.strokeStyle = '#6f7d4f'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 4); ctx.stroke(); fillRR(ctx, x - 3, y + 4, 6, 6, 1.2, ['#c96f4a', '#f3ead8', '#8fb069'][k % 3]); ctx.strokeStyle = ['#a95a3a', '#d9cbb0', '#6f8f4f'][k % 3]; ctx.beginPath(); ctx.arc(x + 3.2, y + 7, 1.6, -1.3, 1.3); ctx.stroke(); }); break;
    case 'rope': garland(ctx, '#c9a557', 7, 13, (x, y, k) => flag(ctx, x, y, 7, 9, ['#b33f40', '#e3b04b', '#3f7f6f', '#d9d2b6'][k % 4]), 1.4); break;
    case 'cobwebs': {
      ctx.strokeStyle = 'rgba(230,225,240,0.55)'; ctx.lineWidth = 0.5;
      for (const [cx, dir] of [[0, 1], [352, -1]]) {
        for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(cx, k * 7); ctx.quadraticCurveTo(cx + dir * k * 4, k * 4, cx + dir * k * 7, 0); ctx.stroke(); }
        for (let a = 0; a <= 1; a += 0.34) { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx + dir * Math.cos(a * 1.57) * 24, Math.sin(a * 1.57) * 24); ctx.stroke(); }
      }
      ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(60, 14 + Math.sin(t * 1.3) * 2); ctx.stroke(); circ(ctx, 60, 15 + Math.sin(t * 1.3) * 2, 1.6, '#3a2a40');
      break;
    }
    case 'vines': garland(ctx, '#5e8c61', 5, 9, (x, y, k) => { ell(ctx, x, y + 2, 2.8, 1.6, k % 2 ? '#7fbf6a' : '#5e9c55', k); if (k % 3 === 0) { ctx.strokeStyle = '#5e8c61'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y + 8, x - 1, y + 14); ctx.stroke(); ell(ctx, x - 1, y + 14, 2, 1.3, '#7fbf6a'); circ(ctx, x + 1, y + 9, 1.3, '#f4a3b5'); } }, 1); break;
    case 'mobile': [[40, 18, '#e06666', 4.5], [70, 12, '#ffd66b', 5.5], [286, 10, '#6fa8dc', 4], [322, 16, '#b4a7d6', 5]].forEach(([x, len, col, r], k) => { ctx.strokeStyle = '#b7c3e0'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke(); circ(ctx, x, len + r, r, col); if (k === 1) { ctx.strokeStyle = '#e8cf8a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(x, len + r, r + 3.5, 1.4, -0.2, 0, Math.PI * 2); ctx.stroke(); } }); break;
    case 'pennants': garland(ctx, '#e0b84f', 4, 14, (x, y, k) => { fillRR(ctx, x - 3.5, y, 7, 12, 0.5, k % 2 ? '#8e1f2f' : '#3a3563'); ctx.fillStyle = k % 2 ? '#8e1f2f' : '#3a3563'; ctx.beginPath(); ctx.moveTo(x - 3.5, y + 12); ctx.lineTo(x, y + 9); ctx.lineTo(x + 3.5, y + 12); ctx.lineTo(x + 3.5, y + 15); ctx.lineTo(x, y + 12); ctx.lineTo(x - 3.5, y + 15); ctx.fill(); circ(ctx, x, y + 5, 1.2, '#e0b84f'); }, 1); break;
    case 'notes': garland(ctx, '#6d5fa3', 5, 14, (x, y, k) => { ell(ctx, x, y + 8, 2.2, 1.6, '#4b3f78', -0.4); ctx.fillStyle = '#4b3f78'; ctx.fillRect(x + 1.6, y + 1, 0.9, 7); if (k % 2) ctx.fillRect(x + 1.6, y + 1, 4, 1.2); }); break;
    case 'swags': for (const [a, b] of SPANS) { for (let x = a; x < b - 10; x += 24) { ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 3); ctx.quadraticCurveTo(x + 12, 13, x + 24, 3); ctx.stroke(); circ(ctx, x, 3, 2, '#e0b84f'); } } break;
    // shop pieces
    case 'bunting': garland(ctx, '#8a6a4a', 6, 11, (x, y, k) => flag(ctx, x, y, 8, 10, ['#f28b82', '#ffd24a', '#a3d9a5', '#9ec5f0', '#d4b3f0'][k % 5])); break;
    case 'fairylights': garland(ctx, '#4a5a3a', 6, 8, (x, y, k) => { const on = 0.6 + 0.4 * Math.sin(t * 3 + k * 1.7); ctx.globalAlpha = on; circ(ctx, x, y + 2, 1.7, ['#ffe28a', '#ffb3c7', '#9ec5f0', '#b6e36a'][k % 4]); ctx.globalAlpha = 1; }); break;
    case 'hangplants': [[26, 16], [74, 10], [284, 10], [330, 16]].forEach(([x, len]) => { ctx.strokeStyle = '#c9a070'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - 4, len); ctx.lineTo(x, 0); ctx.lineTo(x + 4, len); ctx.stroke(); fillRR(ctx, x - 5, len, 10, 6, 2, '#c96f4a'); for (let k = -2; k <= 2; k++) { ell(ctx, x + k * 2.6, len - 1, 2.4, 1.6, '#5e9c55', k); ctx.strokeStyle = '#5e9c55'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x + k * 2.4, len + 5); ctx.quadraticCurveTo(x + k * 3.5, len + 11, x + k * 3, len + 15 + (k & 1) * 4); ctx.stroke(); } }); break;
    case 'pagegarland': garland(ctx, '#8a6a4a', 5, 10, (x, y, k) => { ctx.save(); ctx.translate(x, y + 5); ctx.rotate(Math.sin(t + k) * 0.08); fillRR(ctx, -3.2, -4, 6.4, 8, 0.6, '#fbf5e6'); ctx.fillStyle = '#c9bca0'; for (let j = -2; j < 3; j += 1.6) ctx.fillRect(-2.4, j, 4.8, 0.4); ctx.restore(); }); break;
    case 'wildgarland': garland(ctx, '#6a9f58', 5, 7, (x, y, k) => { circ(ctx, x, y + 1.5, 2, ['#fff3b0', '#f7a8c4', '#ffffff', '#c8a8f0'][k % 4]); circ(ctx, x, y + 1.5, 0.8, '#e9b949'); }, 1); break;
    case 'xmaslights': garland(ctx, '#2e5a3a', 6, 8, (x, y, k) => { const on = 0.55 + 0.45 * Math.sin(t * 2.5 + k * 2.1); ctx.globalAlpha = on; ell(ctx, x, y + 2.5, 1.5, 2.3, ['#e0404f', '#2e8b57', '#f2c14e', '#4f7cac'][k % 4]); ctx.globalAlpha = 1; }); break;
    case 'crescentgarland': garland(ctx, '#c9a557', 5, 12, (x, y, k) => { ctx.strokeStyle = '#c9a557'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 4); ctx.stroke(); if (k % 2) star(ctx, x, y + 7, 3, '#f2d27a'); else { ctx.save(); ctx.beginPath(); ctx.arc(x, y + 7.5, 3.4, 0, Math.PI * 2); ctx.arc(x + 1.8, y + 6.6, 2.8, 0, Math.PI * 2); ctx.fillStyle = '#f2d27a'; ctx.fill('evenodd'); ctx.restore(); } }); break;
    case 'eidbunting': garland(ctx, '#c9a557', 6, 11, (x, y, k) => { flag(ctx, x, y, 8, 10, ['#7cc4b0', '#f2d27a', '#e8a0bf', '#9ec5f0'][k % 4]); star(ctx, x, y + 3, 1.3, '#fff'); }); break;
    case 'heartgarland': garland(ctx, '#e0405f', 5, 10, (x, y, k) => heart(ctx, x, y + 4, 2.6, k % 2 ? '#e0405f' : '#f7a8c4')); break;
    case 'streamers': for (let k = 0; k < 14; k++) { const x = 6 + k * 26; if (x > 98 && x < 256) continue; ctx.strokeStyle = ['#f2d27a', '#9ec5f0', '#e8a0bf', '#a3d9a5'][k % 4]; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, 0); for (let y = 0; y < 16; y += 2) ctx.lineTo(x + Math.sin(y * 0.8 + k) * 2, y); ctx.stroke(); } break;
    case 'shellgarland': garland(ctx, '#c9b089', 5, 11, (x, y, k) => { ctx.fillStyle = ['#f7c9b6', '#fbe7c6', '#f2d7e8'][k % 3]; ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x - 3, y + 6); ctx.quadraticCurveTo(x, y + 8, x + 3, y + 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(160,110,90,0.5)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x, y + 7); ctx.stroke(); }); break;
    case 'leafgarland': garland(ctx, '#8a5a3a', 5, 7, (x, y, k) => ell(ctx, x, y + 2, 2.8, 1.7, ['#d9632d', '#e8913a', '#f2c14e', '#b5523b'][k % 4], k * 0.9)); break;
    case 'pagebunting': garland(ctx, '#8a6a4a', 5, 10, (x, y, k) => { fillRR(ctx, x - 2, y, 4, 10, 0.5, ['#4f7cac', '#e9b949', '#c0504d', '#6a9f58'][k % 4]); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - 2, y + 10); ctx.lineTo(x, y + 8); ctx.lineTo(x + 2, y + 10); ctx.fill(); }); break;
    case 'bdaybanner': garland(ctx, '#8a6a4a', 5, 10, (x, y, k) => { flag(ctx, x, y, 8, 10, ['#f28b82', '#ffd24a', '#a3d9a5', '#9ec5f0', '#d4b3f0'][k % 5]); ctx.fillStyle = '#fff'; ctx.font = `700 5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HAPPYBDAY'[k % 9], x, y + 3.6); }); break;
    default: break;
  }
  void R;
}

// Pieces that move, so they are drawn every frame instead of being cached with the room.
export const LIVE = new Set(['fairylights', 'xmaslights', 'fireflyjars', 'millmodel', 'deskglobe', 'countdown']);

function heart(ctx, x, y, s, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + s * 1.1);
  ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.8, y - s * 1.3, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.8, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 1.1); ctx.fill();
}

/* ---------------- left wall piece (x 3..33, y 44..114) ---------------- */
export function drawWall(ctx, kind, pal, t = 0) {
  const x = 18;
  switch (kind) {
    case 'hooks': fillRR(ctx, 5, 56, 26, 4, 1.5, WOOD); [9, 18, 27].forEach((hx) => circ(ctx, hx, 58, 1.4, '#c9a557'));
      ctx.fillStyle = '#c0504d'; ctx.beginPath(); ctx.moveTo(7, 60); ctx.lineTo(11, 60); ctx.quadraticCurveTo(14, 78, 13, 92); ctx.lineTo(4, 92); ctx.quadraticCurveTo(5, 78, 7, 60); ctx.fill(); ell(ctx, 9, 62, 3.5, 2.2, '#a8403d');
      ctx.fillStyle = pal.accent; ctx.fillRect(16.5, 60, 3, 26); ctx.fillRect(16, 86, 4, 2); ctx.fillStyle = shade(pal.accent, -0.2); for (let y = 63; y < 86; y += 5) ctx.fillRect(16.5, y, 3, 1);
      ell(ctx, 27, 64, 4, 3.5, '#6a9f58'); ctx.fillStyle = '#6a9f58'; ctx.fillRect(25, 64, 4, 8); break;
    case 'heightchart': fillRR(ctx, 11, 46, 14, 66, 2, '#fff7e6'); ctx.strokeStyle = '#b8707f'; ctx.lineWidth = 0.8; rr(ctx, 11, 46, 14, 66, 2); ctx.stroke();
      for (let y = 50; y < 110; y += 6) { ctx.fillStyle = '#b8707f'; ctx.fillRect(11, y, y % 12 === 2 ? 6 : 3.5, 0.8); }
      [[88, '#f28b82'], [72, '#7cc4b0'], [60, '#fbbc04']].forEach(([y, c]) => { ctx.fillStyle = c; ctx.fillRect(15, y, 10, 1.4); circ(ctx, 22, y - 2, 1.4, c); }); break;
    case 'pans': fillRR(ctx, 4, 50, 28, 3, 1, WOOD_DK); [[9, 7, '#c9773f'], [18, 9, '#b87333'], [27, 6, '#d98a4a']].forEach(([hx, r, c]) => { ctx.strokeStyle = '#6d5a3a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(hx, 52); ctx.lineTo(hx, 56); ctx.stroke(); fillRR(ctx, hx - 1, 56, 2, 9, 1, '#3a2a20'); circ(ctx, hx, 65 + r, r, c); circ(ctx, hx - r * 0.3, 63 + r, r * 0.35, 'rgba(255,255,255,0.3)'); });
      fillRR(ctx, 8, 88, 20, 3, 1, WOOD_DK); ctx.fillStyle = '#e8e1c9'; [[10, 7], [16, 9], [22, 8]].forEach(([jx, jh]) => ctx.fillRect(jx, 88 - jh, 5, jh)); break;
    case 'anchor': ctx.strokeStyle = '#6d6d78'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x, 58); ctx.lineTo(x, 96); ctx.moveTo(x - 7, 64); ctx.lineTo(x + 7, 64); ctx.stroke(); ctx.beginPath(); ctx.arc(x, 88, 10, 0.25, Math.PI - 0.25); ctx.stroke(); circ(ctx, x, 55, 3.4, '#6d6d78'); circ(ctx, x, 55, 1.6, pal.wall);
      ctx.strokeStyle = '#c9a557'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, 52); ctx.quadraticCurveTo(x - 12, 70, x - 6, 82); ctx.stroke(); break;
    case 'wanted': fillRR(ctx, 5, 48, 26, 36, 1, '#efe2c2'); ctx.fillStyle = '#6e2f3a'; ctx.font = `700 5.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('WANTED', x, 53);
      ell(ctx, x, 66, 7, 6, '#8a7aa0'); ctx.fillStyle = '#8a7aa0'; ctx.beginPath(); ctx.moveTo(x - 7, 63); ctx.lineTo(x - 5, 56); ctx.lineTo(x - 2, 61); ctx.moveTo(x + 7, 63); ctx.lineTo(x + 5, 56); ctx.lineTo(x + 2, 61); ctx.fill(); circ(ctx, x - 2.5, 65, 1, '#e8e070'); circ(ctx, x + 2.5, 65, 1, '#e8e070');
      ctx.fillStyle = '#6e2f3a'; ctx.font = `600 4px ${FONT}`; ctx.fillText('THE CAT', x, 77); ctx.fillText('1000 🧀', x, 81.5); circ(ctx, 7, 50, 1, '#c0504d'); circ(ctx, 29, 50, 1, '#c0504d'); break;
    case 'birdcage': ctx.strokeStyle = '#c9a557'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, 44); ctx.lineTo(x, 56); ctx.stroke(); ctx.beginPath(); ctx.arc(x, 66, 10, Math.PI, 0); ctx.stroke();
      for (let k = -8; k <= 8; k += 4) { ctx.beginPath(); ctx.moveTo(x + k, 66 - Math.sqrt(100 - k * k)); ctx.lineTo(x + k, 84); ctx.stroke(); } fillRR(ctx, x - 11, 83, 22, 3, 1, '#c9a557');
      ell(ctx, x - 1, 74 + Math.sin(t * 3) * 0.6, 3.6, 2.8, '#ffd66b'); circ(ctx, x + 2, 71 + Math.sin(t * 3) * 0.6, 2, '#ffd66b'); ctx.fillStyle = '#f28c28'; ctx.fillRect(x + 3.6, 71 + Math.sin(t * 3) * 0.6, 1.8, 1); ctx.strokeStyle = '#c9a557'; ctx.beginPath(); ctx.moveTo(x - 9, 78); ctx.lineTo(x + 9, 78); ctx.stroke(); break;
    case 'planetchart': fillRR(ctx, 4, 48, 28, 40, 1.5, '#1a2442'); ctx.strokeStyle = '#b7c3e0'; ctx.lineWidth = 0.8; rr(ctx, 4, 48, 28, 40, 1.5); ctx.stroke();
      circ(ctx, x, 60, 4, '#ffd66b'); [[9, '#e06666', 1.4], [14, '#6fa8dc', 1.8], [19, '#b4a7d6', 1.6]].forEach(([rad, c, r], k) => { ctx.strokeStyle = 'rgba(183,195,224,0.4)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.ellipse(x, 60, rad * 0.6, rad * 0.35, 0, 0, Math.PI * 2); ctx.stroke(); circ(ctx, x + rad * 0.6 * Math.cos(k * 2 + 1), 60 + rad * 0.35 * Math.sin(k * 2 + 1), r, c); });
      ctx.fillStyle = '#b7c3e0'; ctx.font = `600 4px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('PLANETS', x, 82); break;
    case 'shield': ctx.strokeStyle = '#b9b3c9'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(6, 52); ctx.lineTo(30, 90); ctx.moveTo(30, 52); ctx.lineTo(6, 90); ctx.stroke(); fillRR(ctx, 4, 50, 5, 3, 1, '#e0b84f'); fillRR(ctx, 27, 50, 5, 3, 1, '#e0b84f');
      ctx.fillStyle = '#8e1f2f'; ctx.beginPath(); ctx.moveTo(x - 9, 60); ctx.lineTo(x + 9, 60); ctx.lineTo(x + 9, 72); ctx.quadraticCurveTo(x, 84, x - 9, 72); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#e0b84f'; ctx.lineWidth = 1.2; ctx.stroke(); star(ctx, x, 69, 3.4, '#e0b84f'); break;
    case 'violin': ctx.save(); ctx.translate(x, 76); ctx.rotate(-0.25); ell(ctx, 0, 8, 7, 8, '#a0522d'); ell(ctx, 0, -4, 5.5, 6, '#a0522d'); ctx.fillStyle = '#b5652f'; ctx.fillRect(-1.2, -26, 2.4, 22); ell(ctx, 0, -26, 2, 3, '#6b3a1e');
      ctx.fillStyle = '#2a2430'; ctx.fillRect(-1, -20, 2, 26); ctx.strokeStyle = '#6b3a1e'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-3, 4); ctx.quadraticCurveTo(-4.5, 6, -3, 8); ctx.moveTo(3, 4); ctx.quadraticCurveTo(4.5, 6, 3, 8); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(28, 52); ctx.lineTo(8, 104); ctx.stroke(); break;
    case 'laurel': ctx.strokeStyle = '#8f9f4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, 72, 11, Math.PI * 0.6, Math.PI * 2.4); ctx.stroke();
      for (let a = Math.PI * 0.65; a < Math.PI * 2.4; a += 0.42) ell(ctx, x + Math.cos(a) * 11, 72 + Math.sin(a) * 11, 3, 1.5, '#9fb35a', a + 1.2); fillRR(ctx, x - 4, 81, 8, 5, 1, '#c9a227'); break;
    // shop pieces
    case 'coatrack': fillRR(ctx, 5, 54, 26, 4, 1.5, WOOD); [9, 18, 27].forEach((hx) => circ(ctx, hx, 56, 1.4, '#c9a557'));
      [['#4f7cac', 9], ['#e9b949', 18], ['#9b6fb0', 27]].forEach(([c, hx], k) => { ctx.fillStyle = c; ctx.fillRect(hx - 1.6, 58, 3.2, 20 + k * 5); ctx.fillStyle = shade(c, -0.2); for (let y = 61; y < 76 + k * 5; y += 5) ctx.fillRect(hx - 1.6, y, 3.2, 1); }); break;
    case 'rules': fillRR(ctx, 4, 50, 28, 40, 2, WOOD); fillRR(ctx, 6.5, 52.5, 23, 35, 1.5, '#fbf3df'); ctx.fillStyle = '#6b4128'; ctx.font = `700 4.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('RULES', x, 57);
      ctx.font = `600 3.6px ${FONT}`; ['1. Shh', '2. SHH', '3. No', 'nibbling', '4. Shh'].forEach((l, k) => ctx.fillText(l, x, 63 + k * 5)); break;
    case 'mirror': ell(ctx, x, 72, 12, 17, '#c9a227'); ell(ctx, x, 72, 9.5, 14.5, '#cfe3ee'); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(x - 3, 66, 2, 7, 0.3, 0, Math.PI * 2); ctx.fill(); circ(ctx, x, 54, 2.2, '#c9a227'); break;
    case 'cuckoo': ctx.fillStyle = WOOD; ctx.beginPath(); ctx.moveTo(x - 14, 64); ctx.lineTo(x, 50); ctx.lineTo(x + 14, 64); ctx.closePath(); ctx.fill(); fillRR(ctx, x - 11, 63, 22, 22, 1.5, WOOD_DK);
      circ(ctx, x, 75, 6.5, '#f7efdc'); ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, 75); ctx.lineTo(x, 70.5); ctx.moveTo(x, 75); ctx.lineTo(x + 3.2, 76); ctx.stroke(); fillRR(ctx, x - 2.5, 56, 5, 5, 1, '#2b1b14');
      ctx.strokeStyle = '#c9a557'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - 3, 85); ctx.lineTo(x - 3, 98); ctx.moveTo(x + 3, 85); ctx.lineTo(x + 3, 94); ctx.stroke(); ell(ctx, x - 3, 100, 1.8, 3, '#c9a557'); ell(ctx, x + 3, 96, 1.8, 3, '#c9a557'); break;
    case 'cheesetrophy': fillRR(ctx, 6, 58, 24, 30, 5, WOOD); fillRR(ctx, 8.5, 60.5, 19, 25, 4, WOOD_DK);
      ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(10, 80); ctx.lineTo(26, 80); ctx.lineTo(26, 70); ctx.lineTo(10, 64); ctx.closePath(); ctx.fill(); circ(ctx, 15, 73, 1.8, '#e8a41f'); circ(ctx, 21, 76, 1.4, '#e8a41f'); fillRR(ctx, 12, 83, 12, 2.6, 1, '#e3c26a'); break;
    case 'shipwheel': circ(ctx, x, 74, 13, WOOD); circ(ctx, x, 74, 9.5, pal.wall); circ(ctx, x, 74, 3.5, WOOD_DK); ctx.strokeStyle = WOOD; ctx.lineWidth = 2;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 3, 74 + Math.sin(a) * 3); ctx.lineTo(x + Math.cos(a) * 17, 74 + Math.sin(a) * 17); ctx.stroke(); circ(ctx, x + Math.cos(a) * 17, 74 + Math.sin(a) * 17, 1.6, WOOD_DK); } break;
    case 'castlebanner': ctx.fillStyle = '#c9a557'; ctx.fillRect(4, 48, 28, 2.4); ctx.fillStyle = '#6d5fa3'; ctx.beginPath(); ctx.moveTo(7, 50); ctx.lineTo(29, 50); ctx.lineTo(29, 96); ctx.lineTo(x, 88); ctx.lineTo(7, 96); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(12, 76); ctx.lineTo(24, 76); ctx.lineTo(24, 70); ctx.lineTo(12, 66); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e0b84f'; ctx.beginPath(); ctx.moveTo(12, 62); ctx.lineTo(14, 57); ctx.lineTo(x, 60); ctx.lineTo(22, 57); ctx.lineTo(24, 62); ctx.closePath(); ctx.fill(); break;
    case 'countdown': fillRR(ctx, 5, 56, 26, 24, 3, '#2b2430'); fillRR(ctx, 7.5, 58.5, 21, 19, 2, '#101018'); ctx.fillStyle = '#ffd24a'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(10 - (Math.floor(t) % 10)), x, 68.5); star(ctx, 8, 55, 2.4, '#f2d27a'); star(ctx, 28, 56, 2, '#e8a0bf'); break;
    default: break;
  }
}

/* ---------------- under the window (x 288..336, y 90..111) ---------------- */
export function drawBoard(ctx, kind, pal, t = 0) {
  const x0 = 290; const y0 = 91; const w = 44; const cx = x0 + w / 2;
  switch (kind) {
    case 'sampler': fillRR(ctx, x0 + 4, y0, w - 8, 19, 1.5, WOOD); fillRR(ctx, x0 + 6, y0 + 2, w - 12, 15, 1, '#fbf3df'); ctx.fillStyle = pal.accent; ctx.font = `600 4.6px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Once upon', cx, y0 + 6.5); ctx.fillText('a time…', cx, y0 + 12);
      for (let x = x0 + 8; x < x0 + w - 8; x += 3) circ(ctx, x, y0 + 15.2, 0.5, '#c0504d'); break;
    case 'drawings': [[x0 + 2, '#fff', -0.08, '#f28b82'], [x0 + 16, '#fffbe6', 0.06, '#7cc4b0'], [x0 + 30, '#fff', -0.04, '#fbbc04']].forEach(([px, bg, rot, col], k) => { ctx.save(); ctx.translate(px + 6, y0 + 9); ctx.rotate(rot); fillRR(ctx, -6, -8, 12, 15, 0.5, bg); circ(ctx, 0, -9, 0.9, '#e0404f');
      if (k === 0) { circ(ctx, 0, -1, 3.5, col); ctx.fillStyle = col; ctx.fillRect(-4, 4, 8, 1); } else if (k === 1) { ctx.fillStyle = col; ctx.fillRect(-4, 0, 8, 5); ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, -5); ctx.lineTo(5, 0); ctx.fill(); } else { star(ctx, 0, -1, 4, col); } ctx.restore(); }); break;
    case 'mugshelf': fillRR(ctx, x0, y0 + 12, w, 3, 1, WOOD_DK); [[x0 + 4, '#c96f4a'], [x0 + 14, '#f3ead8'], [x0 + 24, '#8fb069'], [x0 + 34, '#e9b949']].forEach(([mx, c]) => { fillRR(ctx, mx, y0 + 5, 7, 7, 1.3, c); ctx.strokeStyle = shade(c, -0.25); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(mx + 7.2, y0 + 8.5, 2, -1.3, 1.3); ctx.stroke(); }); break;
    case 'treasuremap': ctx.save(); ctx.translate(cx, y0 + 9); ctx.rotate(-0.04); fillRR(ctx, -20, -9, 40, 19, 1, '#e8d6a8'); ctx.strokeStyle = '#b89a62'; ctx.lineWidth = 0.6; rr(ctx, -20, -9, 40, 19, 1); ctx.stroke();
      ctx.strokeStyle = '#8a6a3a'; ctx.setLineDash([1.5, 1.5]); ctx.beginPath(); ctx.moveTo(-15, 5); ctx.quadraticCurveTo(-4, -8, 10, 2); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(8, -1); ctx.lineTo(13, 4); ctx.moveTo(13, -1); ctx.lineTo(8, 4); ctx.stroke(); ell(ctx, -12, -2, 4, 2.4, '#8fc98f'); ctx.restore(); break;
    case 'evidence': fillRR(ctx, x0, y0, w, 20, 1, '#b08a5a'); [[x0 + 4, y0 + 3], [x0 + 18, y0 + 9], [x0 + 32, y0 + 2]].forEach(([px, py], k) => { fillRR(ctx, px, py, 9, 8, 0.4, k === 1 ? '#fff' : '#efe2c2'); circ(ctx, px + 4.5, py + 0.5, 0.8, '#c0392b'); });
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x0 + 8.5, y0 + 3.5); ctx.lineTo(x0 + 22.5, y0 + 9.5); ctx.lineTo(x0 + 36.5, y0 + 2.5); ctx.stroke(); ctx.fillStyle = '#6e2f3a'; ctx.font = `700 5px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('?', x0 + 22.5, y0 + 15); break;
    case 'pressed': [x0 + 3, x0 + 24].forEach((px, k) => { fillRR(ctx, px, y0 + 1, 17, 18, 1, '#c9a557'); fillRR(ctx, px + 2, y0 + 3, 13, 14, 0.5, '#fbf7ea'); ctx.strokeStyle = '#6a9f58'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(px + 8.5, y0 + 15); ctx.lineTo(px + 8.5, y0 + 7); ctx.stroke(); circ(ctx, px + 8.5, y0 + 7, 2.2, k ? '#f4a3b5' : '#ce93d8'); ell(ctx, px + 6.5, y0 + 11, 2, 1, '#9ccc65', -0.5); }); break;
    case 'constellation': {
      fillRR(ctx, x0, y0, w, 20, 1.5, '#16203d'); const pts = [[x0 + 6, y0 + 14], [x0 + 14, y0 + 6], [x0 + 23, y0 + 10], [x0 + 31, y0 + 4], [x0 + 38, y0 + 13]];
      ctx.strokeStyle = 'rgba(255,230,160,0.6)'; ctx.lineWidth = 0.5; ctx.beginPath(); pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); pts.forEach(([px, py]) => star(ctx, px, py, 1.5, '#ffe9a3')); break;
    }
    case 'decree': fillRR(ctx, x0 + 4, y0 + 1, w - 8, 18, 1, '#f3e6c4'); ell(ctx, x0 + 4, y0 + 10, 2.4, 9, '#e0d0a8'); ell(ctx, x0 + w - 4, y0 + 10, 2.4, 9, '#e0d0a8'); ctx.fillStyle = '#8e1f2f'; ctx.font = `700 4.4px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ROYAL DECREE', cx, y0 + 6);
      ctx.fillStyle = 'rgba(80,60,40,0.5)'; for (let k = 0; k < 2; k++) ctx.fillRect(x0 + 10, y0 + 10 + k * 3, w - 20, 0.7); circ(ctx, cx, y0 + 17, 2.6, '#c0392b'); break;
    case 'sheetmusic': fillRR(ctx, x0 + 3, y0 + 1, w - 6, 18, 0.5, '#fbf7ea'); ctx.fillStyle = 'rgba(75,63,120,0.5)'; for (let k = 0; k < 5; k++) ctx.fillRect(x0 + 5, y0 + 5 + k * 2.4, w - 10, 0.4);
      [[x0 + 10, y0 + 9], [x0 + 18, y0 + 6], [x0 + 26, y0 + 11], [x0 + 34, y0 + 7]].forEach(([nx, ny]) => { ell(ctx, nx, ny + 3, 1.6, 1.2, '#4b3f78', -0.4); ctx.fillStyle = '#4b3f78'; ctx.fillRect(nx + 1.2, ny - 2.5, 0.6, 5.5); }); break;
    case 'relief': fillRR(ctx, x0 + 2, y0, w - 4, 20, 2, '#ece2c9'); ctx.strokeStyle = '#c9b88f'; ctx.lineWidth = 0.8; rr(ctx, x0 + 3.5, y0 + 1.5, w - 7, 17, 1.5); ctx.stroke();
      circ(ctx, cx, y0 + 9, 5, '#d8cdb1'); circ(ctx, cx - 3.5, y0 + 5, 2.4, '#d8cdb1'); circ(ctx, cx + 3.5, y0 + 5, 2.4, '#d8cdb1'); ell(ctx, cx, y0 + 17, 7, 3, '#d8cdb1'); break;
    // shop pieces
    case 'corkboard': fillRR(ctx, x0, y0, w, 20, 1.5, WOOD); fillRR(ctx, x0 + 2, y0 + 2, w - 4, 16, 1, '#c9a070'); [[x0 + 5, y0 + 4, '#fff3b0'], [x0 + 16, y0 + 6, '#b6e3f5'], [x0 + 27, y0 + 3, '#f7c9d6'], [x0 + 34, y0 + 9, '#fff']].forEach(([px, py, c]) => { fillRR(ctx, px, py, 8, 7, 0.4, c); circ(ctx, px + 4, py + 0.6, 0.8, '#e0404f'); ctx.fillStyle = 'rgba(80,60,40,0.4)'; ctx.fillRect(px + 1.5, py + 3, 5, 0.5); ctx.fillRect(px + 1.5, py + 4.6, 4, 0.5); }); break;
    case 'jarshelf': fillRR(ctx, x0, y0 + 14, w, 3, 1, WOOD_DK); [[x0 + 3, '#ffe28a', 9], [x0 + 13, '#f7a8c4', 11], [x0 + 24, '#9ec5f0', 8], [x0 + 33, '#b6e36a', 10]].forEach(([jx, c, jh]) => { fillRR(ctx, jx, y0 + 14 - jh, 8, jh, 1.5, 'rgba(220,240,250,0.7)'); fillRR(ctx, jx + 1, y0 + 14 - jh * 0.6, 6, jh * 0.6 - 1, 1, c); fillRR(ctx, jx + 0.5, y0 + 13 - jh, 7, 2, 0.8, '#b5523b'); }); break;
    case 'readchart': fillRR(ctx, x0, y0, w, 20, 1, '#fffbe6'); ctx.strokeStyle = '#e3c26a'; ctx.lineWidth = 0.6; rr(ctx, x0, y0, w, 20, 1); ctx.stroke(); ctx.fillStyle = '#6b4128'; ctx.font = `700 4px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('READING STARS', cx, y0 + 4);
      for (let r = 0; r < 2; r++) for (let k = 0; k < 7; k++) star(ctx, x0 + 5 + k * 5.6, y0 + 10 + r * 5.5, 1.8, (k + r * 3) % 5 < 4 ? '#ffcf3f' : '#e6dcc4'); break;
    case 'wreath': circ(ctx, cx, y0 + 10, 9.5, '#2e8b57'); circ(ctx, cx, y0 + 10, 5, pal.wall2); for (let a = 0; a < Math.PI * 2; a += 0.55) ell(ctx, cx + Math.cos(a) * 7.3, y0 + 10 + Math.sin(a) * 7.3, 2.8, 1.4, '#3fa36b', a + 1.2);
      [[-5, 4], [3, 6], [6, -3], [-6, -4]].forEach(([dx, dy]) => circ(ctx, cx + dx, y0 + 10 + dy, 1.3, '#e0404f')); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(cx, y0 + 18); ctx.lineTo(cx - 4, y0 + 22); ctx.lineTo(cx, y0 + 20); ctx.lineTo(cx + 4, y0 + 22); ctx.fill(); break;
    default: break;
  }
}

/* ---------------- rugs (replace the floor's rug) ---------------- */
export function drawRug(ctx, kind, pal) {
  const cx = 142; const cy = 163; const rx = 108;
  const base = (a, b) => { ell(ctx, cx, cy, rx, 7.5, a); ell(ctx, cx, cy, rx - 6, 6, b); };
  const clip = (fn) => { ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx - 6, 6, 0, 0, Math.PI * 2); ctx.clip(); fn(); ctx.restore(); };
  switch (kind) {
    case 'cheeserug': base('#d9a92b', '#ffcf3f'); clip(() => { const R = rng(4); for (let k = 0; k < 16; k++) ell(ctx, cx - 95 + R() * 190, cy - 4 + R() * 8, 2 + R() * 3, 1 + R(), '#e8a41f'); }); break;
    case 'rainbowrug': clip(() => { ['#f28b82', '#ffd24a', '#a3d9a5', '#9ec5f0', '#d4b3f0'].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(cx - rx, cy - 6 + k * 2.4, rx * 2, 2.5); }); }); ctx.strokeStyle = '#b8a888'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 6, 6, 0, 0, Math.PI * 2); ctx.stroke(); break;
    case 'persian': base('#6e2f3a', '#a8323e'); clip(() => { ctx.strokeStyle = '#e3b04b'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 14, 3.6, 0, 0, Math.PI * 2); ctx.stroke(); for (let x = cx - 90; x <= cx + 90; x += 15) { ctx.fillStyle = '#2f4f8f'; ctx.beginPath(); ctx.moveTo(x, cy - 2.2); ctx.lineTo(x + 3, cy); ctx.lineTo(x, cy + 2.2); ctx.lineTo(x - 3, cy); ctx.fill(); } }); ctx.strokeStyle = '#f3e6c4'; ctx.lineWidth = 0.6; for (let x = cx - rx + 2; x < cx - rx + 8; x += 1.5) { ctx.beginPath(); ctx.moveTo(x, cy - 2); ctx.lineTo(x - 3, cy - 1); ctx.stroke(); } break;
    case 'starrug': base('#1a2442', '#2a3a6b'); clip(() => { const R = rng(9); for (let k = 0; k < 14; k++) star(ctx, cx - 95 + R() * 190, cy - 3.5 + R() * 7, 1 + R() * 0.8, '#ffe9a3'); }); break;
    case 'catrug': ctx.fillStyle = '#8a7aa0'; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 4, 7, 0, 0, Math.PI * 2); ctx.fill(); ell(ctx, cx - rx + 2, cy - 2, 9, 7, '#8a7aa0'); ctx.fillStyle = '#8a7aa0'; ctx.beginPath(); ctx.moveTo(cx - rx - 4, cy - 6); ctx.lineTo(cx - rx - 2, cy - 13); ctx.lineTo(cx - rx + 3, cy - 7); ctx.moveTo(cx - rx + 4, cy - 7); ctx.lineTo(cx - rx + 8, cy - 13); ctx.lineTo(cx - rx + 10, cy - 5); ctx.fill();
      circ(ctx, cx - rx - 1, cy - 3, 0.9, '#2b2320'); circ(ctx, cx - rx + 5, cy - 3, 0.9, '#2b2320'); ctx.strokeStyle = '#6e6088'; ctx.lineWidth = 1; for (let x = cx - 80; x < cx + 90; x += 14) { ctx.beginPath(); ctx.moveTo(x, cy - 5); ctx.quadraticCurveTo(x + 3, cy, x, cy + 5); ctx.stroke(); } break;
    case 'redcarpet': ctx.fillStyle = '#8e1f2f'; ctx.fillRect(cx - rx - 20, cy - 6, (rx + 20) * 2, 12); ctx.fillStyle = '#e0b84f'; ctx.fillRect(cx - rx - 20, cy - 6, (rx + 20) * 2, 1.4); ctx.fillRect(cx - rx - 20, cy + 4.6, (rx + 20) * 2, 1.4); for (let x = cx - rx - 14; x < cx + rx + 20; x += 20) star(ctx, x, cy, 1.6, 'rgba(224,184,79,0.7)'); break;
    case 'quiltrug': clip(() => { const cols = ['#e58fa8', '#f2d27a', '#a3d9a5', '#9ec5f0', '#f2a65a']; for (let x = cx - rx, k = 0; x < cx + rx; x += 12, k++) for (let r = 0; r < 2; r++) { ctx.fillStyle = cols[(k + r * 2) % cols.length]; ctx.fillRect(x, cy - 6 + r * 6, 12, 6); } }); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.setLineDash([1.5, 1.5]); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 7, 5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); break;
    case 'flourrug': base('#c9b48a', '#efe3c6'); ctx.fillStyle = '#b89a62'; ctx.font = `700 5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FINEST FLOUR · WINDMILL HILL', cx, cy + 0.5); break;
    case 'lilyrug': base('#3f7f6f', '#5fae8f'); for (let k = 0; k < 6; k++) { const x = cx - 80 + k * 32; ell(ctx, x, cy + (k % 2 ? -1 : 1.5), 9, 3.2, '#7cc47a'); ctx.fillStyle = '#5fae8f'; ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + 9, cy - 1.5); ctx.lineTo(x + 9, cy + 1.5); ctx.fill(); if (k % 2) circ(ctx, x - 3, cy - 1, 1.8, '#f7a8c4'); } break;
    default: break;
  }
}

/* ---------------- lamps (replace the pendant lamps at L.lamps) ---------------- */
export const LAMP_GLOW = {
  paperlanterns: [255, 190, 140], oillamps: [255, 205, 130], fireflyjars: [220, 255, 150], mushroomlamps: [150, 230, 220],
  chandelier: [255, 235, 190], beaconlamp: [255, 240, 170], candelabra: [255, 200, 120], fanous: [255, 190, 100], pumpkinlamps: [255, 160, 80],
};
export function drawLamp(ctx, kind, lx, pal, t = 0) {
  const cord = (y1) => { ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, y1); ctx.stroke(); };
  switch (kind) {
    case 'paperlanterns': cord(18); ell(ctx, lx, 26, 7, 8.5, '#e0604a'); ctx.strokeStyle = 'rgba(120,40,30,0.5)'; ctx.lineWidth = 0.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(lx, 26, Math.abs(k) * 1.6 + 0.5, 8.5, 0, 0, Math.PI * 2); ctx.stroke(); } fillRR(ctx, lx - 3, 17, 6, 2, 0.5, '#3a2a20'); fillRR(ctx, lx - 3, 34, 6, 2, 0.5, '#3a2a20'); break;
    case 'oillamps': cord(16); ctx.fillStyle = '#c9a557'; ctx.beginPath(); ctx.moveTo(lx - 5, 30); ctx.quadraticCurveTo(lx, 36, lx + 5, 30); ctx.lineTo(lx + 3, 27); ctx.lineTo(lx - 3, 27); ctx.fill(); fillRR(ctx, lx - 3.5, 18, 7, 10, 3, 'rgba(255,245,210,0.8)'); ell(ctx, lx, 23, 1.4, 2.8, '#ffcf5a'); break;
    case 'fireflyjars': cord(16); fillRR(ctx, lx - 5, 17, 10, 13, 3, 'rgba(210,240,230,0.55)'); fillRR(ctx, lx - 4, 15, 8, 3, 1, '#8a6a4a'); for (let k = 0; k < 4; k++) circ(ctx, lx - 3 + ((k * 2.3 + Math.sin(t * 2 + k)) % 6), 20 + ((k * 3.1 + Math.cos(t * 1.7 + k) * 2) % 8), 1, '#e8ff9a'); break;
    case 'mushroomlamps': cord(20); ctx.fillStyle = '#6fe0d0'; ctx.beginPath(); ctx.arc(lx, 28, 8, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#f3ead8'; ctx.fillRect(lx - 2, 28, 4, 5); [[-4, 25], [2, 23], [4, 26]].forEach(([dx, dy]) => circ(ctx, lx + dx, dy, 1.1, '#e9fffb')); break;
    case 'chandelier': cord(12); ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(lx - 12, 22); ctx.quadraticCurveTo(lx, 30, lx + 12, 22); ctx.stroke(); fillRR(ctx, lx - 2, 12, 4, 14, 1, '#c9a227');
      [-12, -6, 0, 6, 12].forEach((dx, k) => { fillRR(ctx, lx + dx - 1, 18 + Math.abs(dx) * 0.2, 2, 4, 0.5, '#f7efdc'); ell(ctx, lx + dx, 16.5 + Math.abs(dx) * 0.2, 0.9, 1.6, '#ffcf5a'); ell(ctx, lx + dx, 26 + (k % 2) * 2, 1, 2, 'rgba(200,230,255,0.9)'); }); break;
    case 'beaconlamp': cord(14); fillRR(ctx, lx - 5, 14, 10, 3, 1, '#d9534f'); fillRR(ctx, lx - 4, 17, 8, 11, 2, 'rgba(255,245,200,0.9)'); ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 0.6; ctx.strokeRect(lx - 4, 17, 8, 11); fillRR(ctx, lx - 5, 28, 10, 3, 1, '#d9534f'); break;
    case 'candelabra': cord(10); ctx.strokeStyle = '#8a8577'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(lx - 10, 22); ctx.lineTo(lx + 10, 22); ctx.moveTo(lx, 10); ctx.lineTo(lx, 22); ctx.stroke();
      [-10, 0, 10].forEach((dx) => { fillRR(ctx, lx + dx - 1.4, 15, 2.8, 7, 0.5, '#f7efdc'); ell(ctx, lx + dx, 13.5 + Math.sin(t * 8 + dx) * 0.3, 1, 1.8, '#ffcf5a'); }); break;
    case 'fanous': cord(14); ctx.fillStyle = '#c9a557'; ctx.beginPath(); ctx.moveTo(lx - 3, 16); ctx.lineTo(lx, 12); ctx.lineTo(lx + 3, 16); ctx.fill(); fillRR(ctx, lx - 5, 16, 10, 12, 2, '#f2c14e'); ctx.fillStyle = 'rgba(200,80,40,0.8)'; ctx.fillRect(lx - 3.5, 18, 2.2, 8); ctx.fillStyle = 'rgba(40,140,110,0.8)'; ctx.fillRect(lx + 1.3, 18, 2.2, 8);
      ctx.fillStyle = '#c9a557'; ctx.beginPath(); ctx.moveTo(lx - 5, 28); ctx.lineTo(lx, 33); ctx.lineTo(lx + 5, 28); ctx.fill(); break;
    case 'pumpkinlamps': cord(18); ell(ctx, lx, 26, 8, 6.5, '#f28c28'); ctx.strokeStyle = '#c96a16'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(lx, 26, 3, 6.5, 0, 0, Math.PI * 2); ctx.stroke(); fillRR(ctx, lx - 1, 18, 2, 3, 0.5, '#5b7f4d');
      ctx.fillStyle = '#ffe07a'; ctx.beginPath(); ctx.moveTo(lx - 4, 24); ctx.lineTo(lx - 2, 22); ctx.lineTo(lx - 1, 25); ctx.fill(); ctx.beginPath(); ctx.moveTo(lx + 4, 24); ctx.lineTo(lx + 2, 22); ctx.lineTo(lx + 1, 25); ctx.fill(); ctx.fillRect(lx - 3, 28, 6, 1.2); break;
    default: break;
  }
}

/* ---------------- paintings (replace the floor's painting at L.art) ---------------- */
export function drawArt(ctx, kind) {
  const a = L.art;
  fillRR(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 2, kind === 'starry' || kind === 'monamousa' ? '#c9a227' : '#8a5a3a');
  ctx.save(); ctx.beginPath(); ctx.rect(a.x, a.y, a.w, a.h); ctx.clip();
  const cx = a.x + a.w / 2;
  switch (kind) {
    case 'stilllife': ctx.fillStyle = '#5b3f5a'; ctx.fillRect(a.x, a.y, a.w, a.h); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(a.x, a.y + a.h - 8, a.w, 8);
      ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(a.x + 8, a.y + a.h - 8); ctx.lineTo(a.x + 24, a.y + a.h - 8); ctx.lineTo(a.x + 24, a.y + a.h - 16); ctx.closePath(); ctx.fill(); circ(ctx, a.x + 31, a.y + a.h - 12, 4, '#c0392b'); circ(ctx, a.x + 35, a.y + a.h - 11, 3, '#6a9f58'); break;
    case 'scream': { const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#f28c28'); g.addColorStop(0.5, '#e0604a'); g.addColorStop(1, '#2f4f8f'); ctx.fillStyle = g; ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y + a.h - 4); ctx.lineTo(a.x + a.w, a.y + 12); ctx.stroke(); ell(ctx, cx + 4, a.y + 20, 4.5, 6.5, '#e8e1c9'); ell(ctx, cx + 4, a.y + 22, 1.2, 2, '#3a2a20'); circ(ctx, cx + 2.5, a.y + 18, 0.8, '#3a2a20'); circ(ctx, cx + 5.5, a.y + 18, 0.8, '#3a2a20'); ctx.fillStyle = '#3a2a40'; ctx.fillRect(cx, a.y + 25, 8, 8); break; }
    case 'pearl': ctx.fillStyle = '#1f2330'; ctx.fillRect(a.x, a.y, a.w, a.h); circ(ctx, cx, a.y + 17, 7, '#e9e2d8'); circ(ctx, cx - 5, a.y + 10, 3.4, '#e9e2d8'); circ(ctx, cx + 5, a.y + 10, 3.4, '#e9e2d8');
      ctx.fillStyle = '#3f6fae'; ctx.beginPath(); ctx.moveTo(cx - 8, a.y + 11); ctx.quadraticCurveTo(cx, a.y + 2, cx + 8, a.y + 11); ctx.lineTo(cx + 6, a.y + 14); ctx.lineTo(cx - 6, a.y + 14); ctx.fill(); ctx.fillStyle = '#e9b949'; ctx.fillRect(cx - 7, a.y + 11, 14, 2); circ(ctx, cx + 4, a.y + 23, 1.5, '#fffbe6'); ell(ctx, cx, a.y + 31, 9, 4, '#c9a557'); break;
    case 'monamousa': { const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#6a8a6a'); g.addColorStop(1, '#8a7a4a'); ctx.fillStyle = g; ctx.fillRect(a.x, a.y, a.w, a.h);
      ell(ctx, cx, a.y + a.h, 10, 9, '#3a3020'); circ(ctx, cx, a.y + 17, 7, '#c9b29b'); circ(ctx, cx - 5.5, a.y + 10, 3.6, '#c9b29b'); circ(ctx, cx + 5.5, a.y + 10, 3.6, '#c9b29b'); ctx.fillStyle = '#3a3020'; ctx.fillRect(cx - 8, a.y + 11, 3, 14); ctx.fillRect(cx + 5, a.y + 11, 3, 14);
      circ(ctx, cx - 2.5, a.y + 16, 0.8, '#2b2320'); circ(ctx, cx + 2.5, a.y + 16, 0.8, '#2b2320'); ctx.strokeStyle = '#6b4128'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(cx, a.y + 19, 2, 0.3, Math.PI - 0.3); ctx.stroke(); break; }
    case 'wave': ctx.fillStyle = '#f3e6c4'; ctx.fillRect(a.x, a.y, a.w, a.h); ctx.fillStyle = '#2f4f8f'; ctx.beginPath(); ctx.moveTo(a.x, a.y + a.h); ctx.quadraticCurveTo(a.x + 6, a.y + 4, a.x + 26, a.y + 8); ctx.quadraticCurveTo(a.x + 18, a.y + 10, a.x + 22, a.y + 18); ctx.quadraticCurveTo(a.x + 30, a.y + 26, a.x + a.w, a.y + 24); ctx.lineTo(a.x + a.w, a.y + a.h); ctx.fill();
      for (let k = 0; k < 6; k++) circ(ctx, a.x + 12 + k * 2.6, a.y + 6 + Math.sin(k) * 1.2, 1.2, '#ffffff'); ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(a.x + 30, a.y + 16); ctx.lineTo(a.x + 36, a.y + 16); ctx.lineTo(a.x + 33, a.y + 11); ctx.fill(); break;
    case 'starry': ctx.fillStyle = '#1f3a78'; ctx.fillRect(a.x, a.y, a.w, a.h); ctx.strokeStyle = '#8fb3e8'; ctx.lineWidth = 1.2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(a.x + 12 + k * 10, a.y + 12, 4 + k, 0, Math.PI * 1.5); ctx.stroke(); }
      circ(ctx, a.x + 34, a.y + 7, 3.6, '#ffe28a'); [[8, 5], [22, 4], [28, 14]].forEach(([dx, dy]) => circ(ctx, a.x + dx, a.y + dy, 1.4, '#fff3b0')); ctx.fillStyle = '#1a2a40'; ctx.beginPath(); ctx.moveTo(a.x + 5, a.y + a.h); ctx.lineTo(a.x + 8, a.y + 10); ctx.lineTo(a.x + 11, a.y + a.h); ctx.fill(); ctx.fillStyle = '#3a4a6a'; ctx.fillRect(a.x, a.y + a.h - 5, a.w, 5); break;
    default: break;
  }
  ctx.restore();
}

/* ---------------- desk items (right end of the checkout desk; front layer) ---------------- */
export function drawDesk(ctx, kind, x, top, t = 0) {
  // x = centre of the free space at the right end of the desk; top = desk top
  switch (kind) {
    case 'teaset': fillRR(ctx, x - 6, top - 7, 9, 7, 2, '#f3ead8'); ctx.strokeStyle = '#d9cbb0'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(x + 3, top - 4, 2, -1.3, 1.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 6, top - 5); ctx.lineTo(x - 9, top - 7); ctx.stroke(); circ(ctx, x - 1.5, top - 8, 1, '#c96f4a');
      ell(ctx, x + 6, top - 0.8, 3.5, 1, '#f3ead8'); fillRR(ctx, x + 4, top - 4, 4, 3, 1, '#f3ead8'); break;
    case 'cactus': fillRR(ctx, x - 4, top - 5, 8, 5, 1, '#c96f4a'); fillRR(ctx, x - 2.5, top - 15, 5, 11, 2.5, '#5fae4f'); fillRR(ctx, x - 6, top - 12, 3, 5, 1.5, '#5fae4f'); fillRR(ctx, x + 3, top - 13, 3, 6, 1.5, '#5fae4f'); circ(ctx, x, top - 15.5, 1.2, '#f7a8c4'); break;
    case 'bankerlamp': fillRR(ctx, x - 4, top - 2, 8, 2, 1, '#c9a557'); ctx.fillStyle = '#c9a557'; ctx.fillRect(x - 0.6, top - 11, 1.2, 9); ctx.fillStyle = '#2e7d4f'; ctx.beginPath(); ctx.moveTo(x - 7, top - 10); ctx.quadraticCurveTo(x, top - 17, x + 7, top - 10); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,240,180,0.6)'; ctx.fillRect(x - 6, top - 10, 12, 1); break;
    case 'typewriter': fillRR(ctx, x - 7, top - 7, 14, 7, 2, '#3a3440'); fillRR(ctx, x - 5, top - 11, 10, 4, 1, '#fbf5e6'); ctx.fillStyle = '#e9e2d8'; for (let k = 0; k < 5; k++) circ(ctx, x - 4 + k * 2, top - 3, 0.7, '#e9e2d8'); break;
    case 'deskglobe': ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 0.8, top - 5, 1.6, 5); ell(ctx, x, top - 0.6, 4, 1, WOOD_DK); circ(ctx, x, top - 10, 5.5, '#5d9cc9'); ctx.save(); ctx.beginPath(); ctx.arc(x, top - 10, 5.5, 0, Math.PI * 2); ctx.clip(); ell(ctx, x - 2 + ((t * 2) % 12) - 6, top - 11, 2.6, 1.8, '#8fc98f'); ell(ctx, x + 3 + ((t * 2) % 12) - 6, top - 8, 2, 1.3, '#8fc98f'); ctx.restore(); ctx.strokeStyle = '#c9a557'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(x, top - 10, 7, Math.PI * 0.6, Math.PI * 2.4); ctx.stroke(); break;
    case 'catfigure': ell(ctx, x, top - 4, 4.5, 4, '#fbfbf8'); circ(ctx, x, top - 10, 3.4, '#fbfbf8'); ctx.fillStyle = '#fbfbf8'; ctx.beginPath(); ctx.moveTo(x - 3, top - 12); ctx.lineTo(x - 2.5, top - 15); ctx.lineTo(x - 0.8, top - 12.8); ctx.moveTo(x + 3, top - 12); ctx.lineTo(x + 2.5, top - 15); ctx.lineTo(x + 0.8, top - 12.8); ctx.fill();
      circ(ctx, x - 1.2, top - 10, 0.5, '#3a6fb0'); circ(ctx, x + 1.2, top - 10, 0.5, '#3a6fb0'); ctx.strokeStyle = '#d9cbb0'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 4, top - 2); ctx.quadraticCurveTo(x + 8, top - 4, x + 6, top - 8); ctx.stroke(); break;
    case 'millmodel': ctx.fillStyle = '#efe3cf'; ctx.beginPath(); ctx.moveTo(x - 4, top); ctx.lineTo(x - 2.5, top - 11); ctx.lineTo(x + 2.5, top - 11); ctx.lineTo(x + 4, top); ctx.fill(); ctx.fillStyle = '#b5523b'; ctx.beginPath(); ctx.moveTo(x - 3.5, top - 11); ctx.lineTo(x, top - 15); ctx.lineTo(x + 3.5, top - 11); ctx.fill();
      ctx.save(); ctx.translate(x, top - 11); ctx.rotate(t * 0.8); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = '#f7efe0'; ctx.fillRect(0.5, -1, 8, 2); } ctx.restore(); break;
    case 'frogfigure': ell(ctx, x, top - 3.5, 5, 3.6, '#5fae4f'); circ(ctx, x - 2.4, top - 7, 1.8, '#5fae4f'); circ(ctx, x + 2.4, top - 7, 1.8, '#5fae4f'); circ(ctx, x - 2.4, top - 7.2, 0.9, '#fff'); circ(ctx, x + 2.4, top - 7.2, 0.9, '#fff'); circ(ctx, x - 2.3, top - 7.1, 0.45, '#1d1b24'); circ(ctx, x + 2.5, top - 7.1, 0.45, '#1d1b24'); fillRR(ctx, x - 3.5, top - 4.5, 7, 4, 0.5, '#c0504d'); break;
    case 'sweetstray': ell(ctx, x, top - 0.8, 8, 1.8, '#c9a557'); [[-5, '#f7c9d6'], [-2, '#f2d27a'], [1, '#a3d9a5'], [4, '#e8a0bf'], [-1, '#fff3dc']].forEach(([dx, c], k) => circ(ctx, x + dx, top - 2.5 - (k === 4 ? 2 : 0), 1.8, c)); break;
    case 'rosevase': fillRR(ctx, x - 2.5, top - 7, 5, 7, 2, '#9ec5f0'); ctx.strokeStyle = '#4f8a44'; ctx.lineWidth = 0.7; [[-3, -15], [0, -17], [3, -14]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(x, top - 7); ctx.lineTo(x + dx, top + dy + 2); ctx.stroke(); circ(ctx, x + dx, top + dy, 2, '#e0405f'); }); break;
    case 'lemonade': fillRR(ctx, x - 4, top - 11, 8, 11, 2, 'rgba(230,245,250,0.7)'); fillRR(ctx, x - 3, top - 8, 6, 7, 1.5, '#ffe066'); circ(ctx, x + 3.5, top - 10, 2, '#ffd24a'); ctx.fillStyle = '#f28b82'; ctx.fillRect(x - 1, top - 14, 1, 6); break;
    case 'pumpkinpie': ell(ctx, x, top - 2, 7, 2.6, '#c9864a'); ell(ctx, x, top - 2.8, 5.8, 1.8, '#e8913a'); ctx.fillStyle = '#fff'; circ(ctx, x, top - 4, 1.3, '#ffffff'); break;
    case 'wormplush': [0, 1, 2, 3].forEach((k) => circ(ctx, x - 5 + k * 3, top - 2.5 - Math.sin(k + t * 2) * 0.6, 2.6, k % 2 ? '#9ccf5a' : '#b6e36a')); circ(ctx, x + 5, top - 4, 3, '#b6e36a'); circ(ctx, x + 6, top - 4.6, 0.6, '#1d1b24'); ctx.strokeStyle = '#6d4c8d'; ctx.lineWidth = 0.7; ctx.strokeRect(x + 3.6, top - 6, 3.4, 2); break;
    case 'bdaycake': fillRR(ctx, x - 7, top - 7, 14, 7, 1.5, '#f7c9d6'); fillRR(ctx, x - 7, top - 8, 14, 2.5, 1, '#fff3dc'); fillRR(ctx, x - 4.5, top - 13, 9, 5, 1, '#f7c9d6'); [-2.5, 0, 2.5].forEach((dx) => { ctx.fillStyle = '#9ec5f0'; ctx.fillRect(x + dx - 0.5, top - 16, 1, 3); ell(ctx, x + dx, top - 17, 0.7, 1.3, '#ffcf5a'); }); break;
    default: break;
  }
}
