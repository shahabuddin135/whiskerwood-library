// Drawings for furniture, centrepieces, garden pieces and keepsakes. Used by the cached room
// art, the live world, and the shop thumbnails, so every catalogue item looks like itself.
import { rr, fillRR, ell, circ, shade, rng, star, heart, rgba, drawMouse } from './draw.js';

const WOOD = '#8a5a3a';
const WOOD_DK = '#6b4128';
const INK = '#3a2a20';
const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';

/* ------------------------------------------------------------------ */
/* Rugs: ellipse around (cx, cy), half-width rx                        */
/* ------------------------------------------------------------------ */
export function drawRug(ctx, id, cx, cy, rx, pal) {
  const ry = 7.5;
  const base = (outer, inner) => { ell(ctx, cx, cy + 0.8, rx + 2, ry + 1.2, 'rgba(0,0,0,0.12)'); ell(ctx, cx, cy, rx, ry, outer); ell(ctx, cx, cy, rx - 6, ry - 1.6, inner); };
  const dash = (col, k = 0.88, d = [3, 3]) => { ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.setLineDash(d); ctx.beginPath(); ctx.ellipse(cx, cy, rx * k, ry * k * 0.8, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); };
  const fringe = (col) => { ctx.strokeStyle = col; ctx.lineWidth = 0.7; for (const s of [-1, 1]) for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(cx + s * rx, cy + k * 1.6); ctx.lineTo(cx + s * (rx + 3), cy + k * 1.8); ctx.stroke(); } };
  switch (id) {
    case 'persian':
      fringe('#e8d6b0'); base('#23385f', '#9e2b35');
      ctx.fillStyle = '#e3b04b'; for (let k = -6; k <= 6; k++) { const x = cx + k * rx * 0.13; star(ctx, x, cy, 1.6, '#e3b04b', 4, 0.5); }
      dash('#e3b04b', 0.93, [2, 2]); ell(ctx, cx, cy, 10, 3, '#23385f'); star(ctx, cx, cy, 2.4, '#e3b04b', 8, 0.5); break;
    case 'rainbow': ['#e0605a', '#f29c38', '#ffd24a', '#7cc46b', '#4f8fd9', '#9b6fb0'].forEach((c, k) => ell(ctx, cx, cy, rx - k * 9, ry - k * 1.05, c)); break;
    case 'cheeserug':
      ell(ctx, cx, cy + 0.8, rx + 2, ry + 1.2, 'rgba(0,0,0,0.12)'); ell(ctx, cx, cy, rx, ry, '#e8a41f'); ell(ctx, cx, cy - 0.5, rx - 3, ry - 1.2, '#ffcf3f');
      { const R = rng(9); for (let k = 0; k < 14; k++) ell(ctx, cx + (R() - 0.5) * rx * 1.6, cy + (R() - 0.5) * ry, 2 + R() * 3, 1 + R() * 0.9, '#e8a41f'); } break;
    case 'fauxcat':
      ell(ctx, cx, cy + 0.8, rx + 2, ry + 1.2, 'rgba(0,0,0,0.12)'); ell(ctx, cx + 6, cy, rx - 6, ry, '#8e86a3');
      ctx.strokeStyle = '#6f6884'; ctx.lineWidth = 2; for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 18, cy - ry + 1.5); ctx.lineTo(cx + k * 18 + 3, cy + ry - 1.5); ctx.stroke(); }
      { const hx = cx - rx + 6; ell(ctx, hx, cy - 1, 11, 7, '#8e86a3'); ctx.fillStyle = '#8e86a3'; ctx.beginPath(); ctx.moveTo(hx - 8, cy - 5); ctx.lineTo(hx - 6, cy - 13); ctx.lineTo(hx - 1, cy - 6); ctx.fill(); ctx.beginPath(); ctx.moveTo(hx + 8, cy - 5); ctx.lineTo(hx + 6, cy - 13); ctx.lineTo(hx + 1, cy - 6); ctx.fill();
        ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx - 5, cy - 2); ctx.lineTo(hx - 2, cy - 2); ctx.moveTo(hx + 2, cy - 2); ctx.lineTo(hx + 5, cy - 2); ctx.stroke(); circ(ctx, hx, cy + 1, 1, '#e98b9e'); }
      ctx.strokeStyle = '#8e86a3'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + rx, cy); ctx.quadraticCurveTo(cx + rx + 14, cy - 2, cx + rx + 10, cy - 8); ctx.stroke(); ctx.lineCap = 'butt'; break;
    case 'starrug':
      base('#1f2a4d', '#27365f'); { const R = rng(4); for (let k = 0; k < 18; k++) star(ctx, cx + (R() - 0.5) * rx * 1.7, cy + (R() - 0.5) * ry * 1.2, 0.9 + R() * 1.4, R() < 0.3 ? '#ffe9a3' : '#e8e8ff'); }
      ctx.strokeStyle = 'rgba(255,233,163,0.6)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(cx - 40, cy - 2); ctx.lineTo(cx - 20, cy + 2); ctx.lineTo(cx + 5, cy - 3); ctx.lineTo(cx + 30, cy + 1); ctx.stroke(); break;
    case 'waves':
      base('#2f6f9f', '#4f8fc0'); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1;
      for (let row = -1; row <= 1; row++) { ctx.beginPath(); for (let x = -rx + 14; x < rx - 14; x += 12) { const y = cy + row * 3; ctx.moveTo(cx + x, y); ctx.quadraticCurveTo(cx + x + 3, y - 2.4, cx + x + 6, y); } ctx.stroke(); } break;
    case 'moss':
      ell(ctx, cx, cy + 0.8, rx + 2, ry + 1.2, 'rgba(0,0,0,0.12)'); { const R = rng(12); ell(ctx, cx, cy, rx, ry, '#4f7f3f'); for (let k = 0; k < 40; k++) ell(ctx, cx + (R() - 0.5) * rx * 1.8, cy + (R() - 0.5) * ry * 1.4, 3 + R() * 4, 1.2 + R(), R() < 0.5 ? '#6a9f4f' : '#5b8f45'); for (let k = 0; k < 6; k++) circ(ctx, cx + (R() - 0.5) * rx * 1.5, cy + (R() - 0.5) * ry, 1.1, R() < 0.5 ? '#f7e08a' : '#e8a3c8'); } break;
    case 'knitrug':
      fringe('#c9a8f0'); base('#9b6fb0', '#f4ead8'); dash('#9b6fb0', 0.9, [2, 1.5]);
      ctx.fillStyle = '#9b6fb0'; ctx.font = `700 7px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('R A E D', cx, cy + 0.5); break;
    case 'heartrug':
      base('#e0405f', '#f7a8bb'); for (let k = -3; k <= 3; k++) heart(ctx, cx + k * 26, cy + 1.5, 3.2, '#e0405f'); break;
    case 'leafrug':
      base('#b5523b', '#e8913a'); { const R = rng(21); for (let k = 0; k < 12; k++) ell(ctx, cx + (R() - 0.5) * rx * 1.6, cy + (R() - 0.5) * ry, 3.5, 1.5, ['#f2c14e', '#d9632d', '#8a5a3a'][k % 3], R() * 3); } break;
    default: // the floor's own cosy oval rug
      ell(ctx, cx, cy + 0.8, rx + 2, ry + 1.2, 'rgba(0,0,0,0.12)');
      ell(ctx, cx, cy, rx, ry, shade(pal.accent, -0.15));
      ell(ctx, cx, cy, rx - 6, ry - 1.5, pal.accent);
      dash('rgba(255,255,255,0.45)');
  }
}

/* ------------------------------------------------------------------ */
/* Lamps (static part; the glow is drawn live)                         */
/* ------------------------------------------------------------------ */
export const LAMP_GLOW = {
  pendant: [255, 214, 140], lantern: [255, 208, 130], glowcap: [125, 232, 216], glowcaplamp: [125, 232, 216], bulb: [255, 196, 110], bulbs: [255, 196, 110],
  chandelier: [255, 200, 120], candles: [255, 200, 120], orb: [255, 246, 214], orbs: [255, 246, 214], lanterns: [255, 170, 120], fireflyjar: [220, 255, 150],
  jelly: [210, 170, 255], fanous: [255, 190, 100],
};
export const LIVE_LAMPS = new Set(['orb', 'orbs', 'jelly', 'fireflyjar']); // drawn every frame (they move)

export function drawLamp(ctx, kind, lx, pal, t = 0) {
  const cord = (y1, x = lx, c = '#3a2a20') => { ctx.strokeStyle = c; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y1); ctx.stroke(); };
  switch (kind) {
    case 'lantern': // ship lantern
      ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 0.9; for (let y = 0; y < 18; y += 3) { ctx.beginPath(); ctx.ellipse(lx, y + 1.5, 0.9, 1.5, 0, 0, Math.PI * 2); ctx.stroke(); }
      fillRR(ctx, lx - 6, 18, 12, 3, 1, '#b08a3e'); fillRR(ctx, lx - 5, 21, 10, 13, 2, 'rgba(255,240,190,0.85)');
      ctx.strokeStyle = '#8a6a2e'; ctx.lineWidth = 1; for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(lx + dx, 21); ctx.lineTo(lx + dx, 34); ctx.stroke(); }
      fillRR(ctx, lx - 6, 33, 12, 3, 1, '#b08a3e'); circ(ctx, lx, 28, 2.2, '#fff3b0'); break;
    case 'glowcap': case 'glowcaplamp':
      for (const [dx, len, r, c] of [[-7, 18, 5, '#7de8d8'], [0, 26, 6.5, '#b69cf0'], [7, 15, 4.5, '#7de8d8']]) {
        ctx.strokeStyle = '#d8cfe8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(lx + dx, 0); ctx.quadraticCurveTo(lx + dx + 2, len / 2, lx + dx, len); ctx.stroke();
        ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(lx + dx, len, r, r * 0.7, 0, Math.PI, 0); ctx.fill();
        for (let k = -1; k <= 1; k++) circ(ctx, lx + dx + k * r * 0.45, len - r * 0.35, 0.7, 'rgba(255,255,255,0.85)');
      } break;
    case 'bulb': case 'bulbs':
      for (const [dx, len] of [[-8, 20], [0, 28], [8, 16]]) {
        cord(len, lx + dx, '#2a2430'); fillRR(ctx, lx + dx - 1.8, len, 3.6, 3, 0.8, '#8a6a3a');
        ell(ctx, lx + dx, len + 7, 3.6, 4.6, 'rgba(255,236,190,0.9)');
        ctx.strokeStyle = '#e8902e'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(lx + dx - 1.2, len + 9); ctx.lineTo(lx + dx - 0.6, len + 5); ctx.lineTo(lx + dx + 0.6, len + 8); ctx.lineTo(lx + dx + 1.2, len + 5); ctx.stroke();
      } break;
    case 'chandelier': case 'candles':
      ctx.strokeStyle = '#2f2a33'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx - 12, 22); ctx.moveTo(lx, 0); ctx.lineTo(lx + 12, 22); ctx.moveTo(lx, 0); ctx.lineTo(lx, 22); ctx.stroke();
      ctx.strokeStyle = '#2f2a33'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(lx, 23, 14, 3, 0, 0, Math.PI * 2); ctx.stroke();
      for (const dx of [-12, -5, 5, 12]) { fillRR(ctx, lx + dx - 1.3, 14, 2.6, 8, 0.6, '#f7efdc'); ell(ctx, lx + dx, 12.4, 1.3, 2.2, '#ffcf5a'); }
      break;
    case 'lanterns': // paper lanterns
      ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(lx - 16, 0); ctx.quadraticCurveTo(lx, 10, lx + 16, 0); ctx.stroke();
      for (const [dx, c, dy] of [[-9, '#e0605a', 18], [0, '#f2c14e', 22], [9, '#e0605a', 17]]) {
        ctx.beginPath(); ctx.moveTo(lx + dx, 6); ctx.lineTo(lx + dx, dy - 5); ctx.stroke();
        ell(ctx, lx + dx, dy, 5, 6, c); ctx.strokeStyle = shade(c, -0.25); ctx.lineWidth = 0.5;
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(lx + dx, dy, 5 * Math.abs(k) * 0.6 + 0.3, 6, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = '#3a2a20'; ctx.fillRect(lx + dx - 2, dy - 6.5, 4, 1.2); ctx.fillRect(lx + dx - 2, dy + 5.3, 4, 1.2); ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.6;
      } break;
    case 'fanous': // pierced brass lanterns
      for (const [dx, len] of [[-7, 16], [7, 22]]) {
        cord(len, lx + dx, '#5a4a30');
        ctx.fillStyle = '#c98a2e'; ctx.beginPath(); ctx.moveTo(lx + dx, len); ctx.lineTo(lx + dx + 5, len + 5); ctx.lineTo(lx + dx - 5, len + 5); ctx.fill();
        fillRR(ctx, lx + dx - 4.5, len + 5, 9, 10, 1.5, '#e8b85a');
        ctx.fillStyle = 'rgba(255,240,190,0.95)'; for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) star(ctx, lx + dx - 2 + k * 4, len + 8 + j * 4, 1.3, 'rgba(255,245,200,0.95)', 4, 0.5);
        ctx.fillStyle = '#c98a2e'; ctx.beginPath(); ctx.moveTo(lx + dx - 4.5, len + 15); ctx.lineTo(lx + dx + 4.5, len + 15); ctx.lineTo(lx + dx, len + 19); ctx.fill();
      } break;
    case 'orb': case 'orbs': { // floating light orbs (animated)
      for (const [dx, dy, r, p] of [[-10, 24, 3.4, 0], [4, 16, 4.2, 1.7], [11, 28, 2.8, 3.1]]) {
        const y = dy + Math.sin(t * 1.4 + p) * 2.5;
        const g = ctx.createRadialGradient(lx + dx, y, 0, lx + dx, y, r * 2.4); g.addColorStop(0, 'rgba(255,250,225,0.95)'); g.addColorStop(0.45, 'rgba(255,236,170,0.6)'); g.addColorStop(1, 'rgba(255,236,170,0)');
        ctx.fillStyle = g; ctx.fillRect(lx + dx - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8); circ(ctx, lx + dx, y, r * 0.7, '#fffbe8');
      } break;
    }
    case 'jelly': { // drifting jellyfish lamps (animated)
      for (const [dx, dy, c, p] of [[-8, 20, '#d4b3f0', 0], [8, 26, '#9ec5f0', 2]]) {
        const y = dy + Math.sin(t * 1.1 + p) * 2;
        cord(y - 6, lx + dx, 'rgba(58,42,32,0.35)');
        ctx.strokeStyle = rgba(c, 0.8); ctx.lineWidth = 0.8;
        for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(lx + dx + k * 1.8, y); ctx.quadraticCurveTo(lx + dx + k * 2 + Math.sin(t * 3 + k) * 2, y + 6, lx + dx + k * 1.5, y + 11); ctx.stroke(); }
        ctx.fillStyle = rgba(c, 0.92); ctx.beginPath(); ctx.ellipse(lx + dx, y, 6, 5.5, 0, Math.PI, 0); ctx.fill();
        circ(ctx, lx + dx - 2, y - 2.5, 1.1, 'rgba(255,255,255,0.8)');
      } break;
    }
    case 'fireflyjar': { // jars with blinking fireflies (animated)
      for (const [dx, len] of [[-8, 18], [8, 24]]) {
        cord(len, lx + dx, '#5a4a30');
        fillRR(ctx, lx + dx - 4, len, 8, 2, 0.6, '#a07a4a'); fillRR(ctx, lx + dx - 4.5, len + 2, 9, 11, 3, 'rgba(210,235,225,0.55)');
        for (let k = 0; k < 3; k++) { const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 3 + k * 2.1 + dx)); circ(ctx, lx + dx - 2 + k * 2, len + 6 + (k % 2) * 3, 0.9, `rgba(230,255,150,${a})`); }
      } break;
    }
    default: // pendant shade in the floor's accent colour
      cord(22);
      ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.moveTo(lx - 5, 22); ctx.lineTo(lx + 5, 22); ctx.lineTo(lx + 10, 33); ctx.lineTo(lx - 10, 33); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(pal.accent, -0.2); ctx.fillRect(lx - 10, 32, 20, 2);
      circ(ctx, lx, 35, 2.6, '#fff3b0');
  }
}

/* ------------------------------------------------------------------ */
/* Plants (in a pot standing at (x, y) = bottom centre)                */
/* ------------------------------------------------------------------ */
export function drawPlant(ctx, id, x, y) {
  const pot = (c = '#c96f4a', w = 10, h = 9) => { fillRR(ctx, x - w / 2, y - h, w, h, 2, c); ctx.fillStyle = shade(c, -0.15); ctx.fillRect(x - w / 2 - 1, y - h, w + 2, 2.4); };
  const leaf = (a, len, col, w = 2.4) => { ctx.save(); ctx.translate(x, y - 9); ctx.rotate(a); ell(ctx, 0, -len / 2, w, len / 2, col); ctx.restore(); };
  switch (id) {
    case 'cactus':
      pot('#d9774b'); fillRR(ctx, x - 3.5, y - 26, 7, 18, 3.5, '#5e9c55'); fillRR(ctx, x - 9, y - 21, 4, 8, 2, '#5e9c55'); fillRR(ctx, x - 9, y - 17, 6, 3, 1.5, '#5e9c55');
      fillRR(ctx, x + 5, y - 24, 4, 7, 2, '#5e9c55'); fillRR(ctx, x + 3, y - 19, 6, 3, 1.5, '#5e9c55');
      ctx.fillStyle = '#e8f5d0'; for (let k = 0; k < 6; k++) ctx.fillRect(x - 2 + (k % 2) * 3, y - 24 + k * 2.6, 0.8, 0.8); circ(ctx, x, y - 27, 1.8, '#f28ba8'); break;
    case 'monstera':
      pot('#e8e1d6', 11, 9); [[-1.1, 13], [-0.5, 16], [0.2, 17], [0.8, 14], [1.3, 11]].forEach(([a, l]) => { ctx.save(); ctx.translate(x, y - 9); ctx.rotate(a); ell(ctx, 0, -l / 2 - 2, 4.2, l / 2, '#3f8a4a'); ctx.fillStyle = '#e8e1d6'; ctx.fillRect(-4.5, -l / 2 - 2, 2, 1); ctx.fillRect(2.5, -l / 2, 2, 1); ctx.restore(); }); break;
    case 'bonsai':
      fillRR(ctx, x - 7, y - 5, 14, 5, 1.5, '#4f7cac'); ctx.strokeStyle = '#6b4a34'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.quadraticCurveTo(x - 4, y - 10, x + 2, y - 14); ctx.quadraticCurveTo(x + 5, y - 17, x + 1, y - 20); ctx.stroke();
      ell(ctx, x - 4, y - 15, 5, 3, '#4f8a44'); ell(ctx, x + 4, y - 19, 5.5, 3.2, '#5e9c55'); ell(ctx, x, y - 23, 4, 2.6, '#4f8a44'); break;
    case 'flytrap':
      pot('#6d5fa3'); for (const [a, l] of [[-0.5, 12], [0.1, 15], [0.6, 11]]) { ctx.save(); ctx.translate(x, y - 9); ctx.rotate(a); ctx.strokeStyle = '#5e9c55'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -l); ctx.stroke();
        ell(ctx, -2, -l - 3, 3, 4, '#7cc46b', -0.4); ell(ctx, 2, -l - 3, 3, 4, '#c0504d', 0.4); ctx.fillStyle = '#fff'; for (let k = 0; k < 3; k++) ctx.fillRect(-1 + k, -l - 6 + k, 0.6, 1.4); ctx.restore(); }
      fillRR(ctx, x + 1, y - 26, 6, 4, 0.5, '#fbf6ea'); ctx.fillStyle = '#c0504d'; ctx.fillRect(x + 2, y - 25, 4, 0.8); break;
    case 'coral':
      pot('#3f7fbf', 11, 8); for (const [dx, c] of [[-4, '#f28b82'], [0, '#f7a8c4'], [4, '#ffb070']]) { ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + dx, y - 8); ctx.lineTo(x + dx, y - 18 - Math.abs(dx)); ctx.moveTo(x + dx, y - 13); ctx.lineTo(x + dx + 3, y - 18); ctx.stroke(); ctx.lineCap = 'butt'; } break;
    case 'crystalfern':
      pot('#4a4458'); [-0.8, -0.35, 0.1, 0.55, 0.95].forEach((a, k) => { ctx.save(); ctx.translate(x, y - 9); ctx.rotate(a); ctx.fillStyle = k % 2 ? 'rgba(125,232,216,0.9)' : 'rgba(182,156,240,0.9)'; ctx.beginPath(); ctx.moveTo(-1.8, 0); ctx.lineTo(0, -14 - (k % 2) * 3); ctx.lineTo(1.8, 0); ctx.fill(); ctx.restore(); }); break;
    case 'sunflowers':
      pot('#e8913a', 11, 8); for (const [dx, h] of [[-3, 20], [3, 25]]) { ctx.strokeStyle = '#4f8a44'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x + dx, y - 8); ctx.lineTo(x + dx, y - h); ctx.stroke(); for (let p = 0; p < 10; p++) { const a = (p / 10) * Math.PI * 2; ell(ctx, x + dx + Math.cos(a) * 3.4, y - h + Math.sin(a) * 3.4, 2, 1, '#ffd24a', a); } circ(ctx, x + dx, y - h, 2.3, '#7a4b2e'); } break;
    default: // potted fern
      pot();
      [[-0.9, 12], [-0.45, 14], [0, 15], [0.45, 14], [0.9, 12], [-1.3, 9], [1.3, 9]].forEach(([a, len]) => leaf(a, len, '#5e9c55'));
  }
}

/* ------------------------------------------------------------------ */
/* Wall art in the frame rect a = {x, y, w, h}                          */
/* ------------------------------------------------------------------ */
export function drawArt(ctx, kind, a, pal) {
  const frame = (c = '#c9a227', pad = 3) => { fillRR(ctx, a.x - pad + 1.5, a.y - pad + 2, a.w + pad * 2, a.h + pad * 2, 2, 'rgba(0,0,0,0.18)'); fillRR(ctx, a.x - pad, a.y - pad, a.w + pad * 2, a.h + pad * 2, 2, c); };
  const cx = a.x + a.w / 2; const cy = a.y + a.h / 2;
  const mouseFace = (x, y, s, fur = '#b8aca1') => { circ(ctx, x, y, 6 * s, fur); circ(ctx, x - 5 * s, y - 5 * s, 3.6 * s, fur); circ(ctx, x + 5 * s, y - 5 * s, 3.6 * s, fur); circ(ctx, x - 5 * s, y - 5 * s, 2.2 * s, '#f2b1ab'); circ(ctx, x + 5 * s, y - 5 * s, 2.2 * s, '#f2b1ab'); circ(ctx, x - 2 * s, y - 0.5 * s, 0.8 * s, '#2b2320'); circ(ctx, x + 2 * s, y - 0.5 * s, 0.8 * s, '#2b2320'); circ(ctx, x, y + 2 * s, 1 * s, '#e98b8b'); };
  ctx.save();
  switch (kind) {
    case 'crayon': frame('#f2a65a', 2); ctx.fillStyle = '#fffdf6'; ctx.fillRect(a.x, a.y, a.w, a.h);
      circ(ctx, a.x + 8, a.y + 7, 4, '#ffd24a'); ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 0.7; for (let k = 0; k < 6; k++) { const an = k; ctx.beginPath(); ctx.moveTo(a.x + 8 + Math.cos(an) * 5, a.y + 7 + Math.sin(an) * 5); ctx.lineTo(a.x + 8 + Math.cos(an) * 8, a.y + 7 + Math.sin(an) * 8); ctx.stroke(); }
      ctx.strokeStyle = '#e0605a'; ctx.lineWidth = 1.2; ctx.strokeRect(a.x + 20, a.y + 15, 12, 10); ctx.beginPath(); ctx.moveTo(a.x + 18, a.y + 15); ctx.lineTo(a.x + 26, a.y + 8); ctx.lineTo(a.x + 34, a.y + 15); ctx.stroke();
      ctx.strokeStyle = '#4f7cac'; ctx.beginPath(); ctx.arc(a.x + 12, a.y + 20, 2.6, 0, Math.PI * 2); ctx.moveTo(a.x + 12, a.y + 23); ctx.lineTo(a.x + 12, a.y + 29); ctx.stroke();
      ctx.strokeStyle = '#6a9f58'; ctx.beginPath(); ctx.moveTo(a.x, a.y + a.h - 2); ctx.lineTo(a.x + a.w, a.y + a.h - 3); ctx.stroke(); break;
    case 'menu': frame('#6b4a34', 3); ctx.fillStyle = '#2f3b33'; ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.fillStyle = '#f4f1ea'; ctx.font = `700 6px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('MENU', cx, a.y + 7);
      ctx.font = `500 4.4px ${FONT}`; ctx.textAlign = 'left'; ['Brie-oche  3c', 'Cheddar tea 2c', 'Crumb cake 4c', 'Page soup  ?'].forEach((l, k) => ctx.fillText(l, a.x + 3, a.y + 14 + k * 5)); break;
    case 'worldmap': frame('#8a5a3a', 2.5); ctx.fillStyle = '#ecd9a8'; ctx.fillRect(a.x, a.y, a.w, a.h);
      ell(ctx, a.x + 12, a.y + 12, 8, 6, '#b8c98a'); ell(ctx, a.x + 30, a.y + 20, 9, 7, '#b8c98a'); ell(ctx, a.x + 20, a.y + 26, 4, 3, '#b8c98a');
      ctx.strokeStyle = '#b5523b'; ctx.lineWidth = 0.7; ctx.setLineDash([1.5, 1.5]); ctx.beginPath(); ctx.moveTo(a.x + 10, a.y + 12); ctx.quadraticCurveTo(a.x + 22, a.y + 4, a.x + 30, a.y + 19); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#c0504d'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.x + 28, a.y + 17); ctx.lineTo(a.x + 32, a.y + 21); ctx.moveTo(a.x + 32, a.y + 17); ctx.lineTo(a.x + 28, a.y + 21); ctx.stroke(); break;
    case 'evidence': frame('#8a6440', 2); ctx.fillStyle = '#c9a070'; ctx.fillRect(a.x, a.y, a.w, a.h);
      [[4, 3, '#f4f1ea'], [24, 4, '#e8e1d6'], [8, 18, '#fbf6ea'], [27, 19, '#f4f1ea']].forEach(([px, py, c]) => { ctx.fillStyle = c; ctx.fillRect(a.x + px, a.y + py, 11, 9); circ(ctx, a.x + px + 5.5, a.y + py + 1, 1, '#e0405f'); });
      mouseFace(a.x + 9.5, a.y + 9, 0.35, '#8e86a3'); ctx.fillStyle = '#3a3440'; ctx.fillRect(a.x + 26, a.y + 7, 7, 1); ctx.fillRect(a.x + 10, a.y + 22, 7, 1);
      ctx.strokeStyle = '#e0405f'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(a.x + 9.5, a.y + 4); ctx.lineTo(a.x + 29.5, a.y + 5); ctx.lineTo(a.x + 13.5, a.y + 19); ctx.lineTo(a.x + 32.5, a.y + 20); ctx.stroke();
      ctx.fillStyle = '#c0504d'; ctx.font = `700 6px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('?', a.x + 21, a.y + 30); break;
    case 'pressed': frame('#e8e1d6', 3); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.strokeStyle = '#5e8c61'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(cx, a.y + a.h - 3); ctx.quadraticCurveTo(cx - 3, cy, cx + 1, a.y + 9); ctx.stroke();
      ell(ctx, cx - 5, cy + 3, 4, 1.6, '#8fc98f', -0.5); ell(ctx, cx + 5, cy + 6, 4, 1.6, '#8fc98f', 0.5);
      for (let k = 0; k < 5; k++) { const an = (k / 5) * Math.PI * 2; ell(ctx, cx + 1 + Math.cos(an) * 3.2, a.y + 9 + Math.sin(an) * 3.2, 2.4, 1.4, '#f4a3b5', an); } circ(ctx, cx + 1, a.y + 9, 1.4, '#ffd24a'); break;
    case 'starchart': frame('#b7c3e0', 2.5); ctx.fillStyle = '#1f2a4d'; ctx.fillRect(a.x, a.y, a.w, a.h);
      { const R = rng(3); const pts = []; for (let k = 0; k < 7; k++) { const p = [a.x + 4 + R() * (a.w - 8), a.y + 4 + R() * (a.h - 8)]; pts.push(p); star(ctx, p[0], p[1], 1.4, '#ffe9a3'); }
        ctx.strokeStyle = 'rgba(255,233,163,0.5)'; ctx.lineWidth = 0.5; ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(183,195,224,0.5)'; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.stroke(); break;
    case 'royal': frame('#e0b84f', 3); ctx.fillStyle = '#5c1a24'; ctx.fillRect(a.x, a.y, a.w, a.h);
      ell(ctx, cx, a.y + a.h, 12, 9, '#7b2d8b'); mouseFace(cx, cy + 1, 0.95, '#efe9df');
      ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(cx - 5, a.y + 9); ctx.lineTo(cx - 5, a.y + 4); ctx.lineTo(cx - 2.5, a.y + 7); ctx.lineTo(cx, a.y + 3); ctx.lineTo(cx + 2.5, a.y + 7); ctx.lineTo(cx + 5, a.y + 4); ctx.lineTo(cx + 5, a.y + 9); ctx.fill(); break;
    case 'poster': frame('#2a2430', 1.5); ctx.fillStyle = '#6d5fa3'; ctx.fillRect(a.x, a.y, a.w, a.h);
      ell(ctx, cx, a.y + a.h + 4, 20, 14, '#f2d27a'); circ(ctx, cx, a.y + 12, 5, '#fff3dc');
      ctx.fillStyle = '#f2d27a'; ctx.font = `700 5.4px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('SQUEAK', cx, a.y + 23); ctx.fillText('OPERA', cx, a.y + 29);
      ctx.fillStyle = '#2a2430'; ell(ctx, cx - 1, a.y + 14, 1.8, 1.3, '#2a2430'); ctx.fillRect(cx + 0.6, a.y + 8, 0.7, 6); break;
    case 'tapestry':
      ctx.fillStyle = '#6b4a34'; ctx.fillRect(a.x - 3, a.y - 3, a.w + 6, 2.6); ctx.fillStyle = '#2f5d8a'; ctx.fillRect(a.x, a.y, a.w, a.h - 2);
      ctx.beginPath(); ctx.moveTo(a.x, a.y + a.h - 2); for (let k = 0; k <= 6; k++) ctx.lineTo(a.x + (a.w * k) / 6, a.y + a.h + (k % 2 ? 3 : -2)); ctx.lineTo(a.x + a.w, a.y + a.h - 2); ctx.fill();
      ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1; ctx.strokeRect(a.x + 2, a.y + 2, a.w - 4, a.h - 6);
      circ(ctx, cx, cy - 1, 6, '#e0b84f'); star(ctx, cx, cy - 1, 3.5, '#fff3b0'); break;
    case 'mona': frame('#8a6a2e', 3); { const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#7f9a6a'); g.addColorStop(1, '#b8a26a'); ctx.fillStyle = g; ctx.fillRect(a.x, a.y, a.w, a.h); }
      ell(ctx, cx, a.y + a.h, 12, 10, '#3a2a20'); mouseFace(cx, cy - 1, 0.95, '#c9b29b'); ctx.fillStyle = '#3a2a20'; ctx.beginPath(); ctx.ellipse(cx, cy - 3, 8, 7, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(cx, cy + 2.2, 1.6, 0.2, Math.PI - 0.2); ctx.stroke(); break;
    case 'scream': frame('#6b4128', 2.5); { const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#e8742f'); g.addColorStop(0.5, '#f2c14e'); g.addColorStop(1, '#3f6f9f'); ctx.fillStyle = g; ctx.fillRect(a.x, a.y, a.w, a.h); }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(a.x, a.y + 5 + k * 5); ctx.bezierCurveTo(a.x + 12, a.y + k * 5, a.x + 28, a.y + 10 + k * 5, a.x + a.w, a.y + 4 + k * 5); ctx.stroke(); }
      ell(ctx, cx, cy + 3, 4.5, 7, '#e8e1c9'); circ(ctx, cx - 1.6, cy + 1, 0.9, '#3a2a20'); circ(ctx, cx + 1.6, cy + 1, 0.9, '#3a2a20'); ell(ctx, cx, cy + 5, 1, 1.8, '#3a2a20');
      ell(ctx, cx - 5, cy + 3, 1.4, 3.6, '#e8e1c9', 0.2); ell(ctx, cx + 5, cy + 3, 1.4, 3.6, '#e8e1c9', -0.2); break;
    case 'starry': frame('#c9a227', 3); ctx.fillStyle = '#23407a'; ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.strokeStyle = '#8fb3e8'; ctx.lineWidth = 1.1; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(a.x + 10 + k * 11, a.y + 10 + (k % 2) * 4, 3.5, 0, Math.PI * 1.6); ctx.stroke(); }
      circ(ctx, a.x + a.w - 7, a.y + 7, 4, '#ffe066'); for (let k = 0; k < 5; k++) circ(ctx, a.x + 5 + k * 8, a.y + 4 + (k % 2) * 3, 1.4, '#ffe066');
      ctx.fillStyle = '#1d2b3a'; ctx.beginPath(); ctx.moveTo(a.x + 6, a.y + a.h); ctx.lineTo(a.x + 9, a.y + 8); ctx.lineTo(a.x + 12, a.y + a.h); ctx.fill();
      ctx.fillStyle = '#3f5f3f'; ctx.fillRect(a.x, a.y + a.h - 6, a.w, 6); break;
    case 'pearl': frame('#6b4128', 3); ctx.fillStyle = '#1d1b24'; ctx.fillRect(a.x, a.y, a.w, a.h);
      mouseFace(cx + 1, cy + 3, 0.95, '#e9e2d8'); ctx.fillStyle = '#3f6fbf'; ctx.beginPath(); ctx.ellipse(cx - 1, cy - 2, 8, 6, -0.2, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#f2c14e'; ctx.fillRect(cx - 7, cy - 4, 8, 3);
      ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(cx - 4, cy + 7); ctx.lineTo(cx - 1, cy + 7); ctx.lineTo(cx - 2.5, cy + 4.5); ctx.fill(); break;
    case 'wave': frame('#6b4128', 2.5); ctx.fillStyle = '#f2e6c8'; ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.fillStyle = '#2f5d8a'; ctx.beginPath(); ctx.moveTo(a.x, a.y + a.h); ctx.quadraticCurveTo(a.x + 8, a.y + 6, a.x + 24, a.y + 5); ctx.quadraticCurveTo(a.x + 16, a.y + 12, a.x + 20, a.y + 20); ctx.quadraticCurveTo(a.x + 30, a.y + 26, a.x + a.w, a.y + a.h); ctx.fill();
      ctx.fillStyle = '#ffcf3f'; for (let k = 0; k < 5; k++) circ(ctx, a.x + 14 + k * 3, a.y + 6 + k * 0.4, 1.4, '#ffe58a'); circ(ctx, a.x + a.w - 8, a.y + 9, 3.5, '#f7b0a0'); break;
    case 'poker': frame('#6b4128', 2.5); ctx.fillStyle = '#3f5f3f'; ctx.fillRect(a.x, a.y, a.w, a.h); ell(ctx, cx, a.y + a.h - 6, 18, 5, '#2f7f4f');
      mouseFace(a.x + 9, cy, 0.55, '#8f7f73'); mouseFace(cx, a.y + 10, 0.55, '#c9b29b'); mouseFace(a.x + a.w - 9, cy, 0.55, '#e9e2d8');
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - 5, a.y + a.h - 8, 3, 4); ctx.fillRect(cx + 1, a.y + a.h - 8, 3, 4); ctx.fillStyle = '#ffcf3f'; ctx.fillRect(a.x + a.w - 12, a.y + a.h - 8, 4, 3); break;
    case 'mimsyart': frame('#e0b84f', 3.5); { const g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#d9c7f0'); g.addColorStop(1, '#f3d9f0'); ctx.fillStyle = g; ctx.fillRect(a.x, a.y, a.w, a.h); }
      ell(ctx, cx, a.y + a.h, 12, 9, '#9b6fb0'); mouseFace(cx, cy, 0.95, '#ebe5dc'); ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(cx - 2, cy - 0.5, 1.8, 0, Math.PI * 2); ctx.arc(cx + 2, cy - 0.5, 1.8, 0, Math.PI * 2); ctx.stroke();
      star(ctx, cx, a.y + 5, 2.4, '#f2d27a', 5, 0.5); break;
    case 'diploma': frame('#6b4128', 2); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.fillStyle = '#4a3121'; ctx.font = `700 4.6px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('DIPLOMA', cx, a.y + 7); ctx.font = `500 3.6px ${FONT}`; ctx.fillText('technically correct', cx, a.y + 14);
      ctx.fillRect(a.x + 8, a.y + 19, a.w - 16, 0.6); ctx.fillRect(a.x + 10, a.y + 23, a.w - 20, 0.6); circ(ctx, a.x + a.w - 9, a.y + a.h - 7, 4, '#c0504d'); break;
    case 'clockart': frame('#2a2430', 2); ctx.fillStyle = '#1f2a4d'; ctx.fillRect(a.x, a.y, a.w, a.h); circ(ctx, cx, cy, 11, '#fbf6ea');
      ctx.strokeStyle = '#2a2430'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 8); ctx.moveTo(cx, cy); ctx.lineTo(cx - 1, cy - 6); ctx.stroke(); star(ctx, a.x + 5, a.y + 5, 2, '#f2c14e'); star(ctx, a.x + a.w - 5, a.y + a.h - 5, 2, '#9ec5f0'); break;
    default: { // landscape
      frame();
      const sg = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); sg.addColorStop(0, '#9ed0f0'); sg.addColorStop(1, '#fce5b8');
      ctx.fillStyle = sg; ctx.fillRect(a.x, a.y, a.w, a.h);
      circ(ctx, a.x + a.w * 0.72, a.y + 9, 4.5, '#ffe28a');
      ctx.fillStyle = '#7cb36b'; ctx.beginPath(); ctx.moveTo(a.x, a.y + a.h); ctx.quadraticCurveTo(a.x + a.w * 0.3, a.y + a.h * 0.45, a.x + a.w * 0.6, a.y + a.h * 0.8); ctx.quadraticCurveTo(a.x + a.w * 0.85, a.y + a.h * 0.55, a.x + a.w, a.y + a.h * 0.75); ctx.lineTo(a.x + a.w, a.y + a.h); ctx.fill();
      ctx.fillStyle = '#c0504d'; ctx.fillRect(a.x + 9, a.y + a.h - 11, 6, 5); ctx.beginPath(); ctx.moveTo(a.x + 8, a.y + a.h - 11); ctx.lineTo(a.x + 12, a.y + a.h - 15); ctx.lineTo(a.x + 16, a.y + a.h - 11); ctx.fill();
    }
  }
  // glass sheen
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + a.w * 0.4, a.y); ctx.lineTo(a.x, a.y + a.h * 0.7); ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Bookshelves                                                          */
/* ------------------------------------------------------------------ */
// Material for a shelf style. `kind` is a location default or a furniture id.
export function shelfMaterial(kind, sty, pal) {
  switch (kind) {
    case 'birch': return { wood: '#d9b98c', dk: '#b8956a', crown: '#e8cfa5', trim: null };
    case 'walnut': return { wood: '#5a3526', dk: '#3e2219', crown: '#6b4230', trim: null };
    case 'painted': return { wood: shade(pal.accent, -0.05), dk: shade(pal.accent, -0.35), crown: shade(pal.accent, 0.15), trim: '#fff6e0' };
    case 'ladder': return { wood: '#8a5a3a', dk: '#6b4128', crown: '#9b6a47', trim: null, ladder: true };
    case 'glass': return { wood: '#6b4a34', dk: '#4a3121', crown: '#7a5a42', trim: null, glass: true };
    case 'gilded': return { wood: '#4a1f2e', dk: '#2e1119', crown: '#e0b84f', trim: '#e0b84f', finial: true };
    case 'driftwood': return { wood: '#9c8a74', dk: '#6f6150', crown: '#b3a38c', trim: null, rope: true };
    case 'niche': return { wood: '#6b6378', dk: '#3a3446', crown: '#7d758c', trim: null, niche: true };
    case 'metal': return { wood: '#4a4038', dk: '#2e2824', crown: '#c99a4d', trim: '#c99a4d', rivets: true };
    case 'carved': return { wood: '#5a3526', dk: '#3e2219', crown: '#6b4230', trim: '#e0b84f', finial: true };
    case 'cloud': return { wood: '#efe9dc', dk: '#cfc4ae', crown: '#ffffff', trim: '#d9b24c', puff: true };
    default: return { wood: sty?.shelf?.wood || WOOD, dk: sty?.shelf?.dk || WOOD_DK, crown: shade(sty?.shelf?.wood || WOOD, -0.08), trim: null };
  }
}

export function drawBookshelf(ctx, m, x, top, w, bot, bookCols, seed, fill) {
  const R = rng(seed);
  const h = bot - top;
  // soft drop shadow on the wall behind
  fillRR(ctx, x + 3, top + 3, w, h - 2, 3, 'rgba(0,0,0,0.16)');
  if (m.niche) {
    ctx.fillStyle = m.dk; ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x, top + 8); ctx.quadraticCurveTo(x + w / 2, top - 8, x + w, top + 8); ctx.lineTo(x + w, bot); ctx.fill();
    ctx.strokeStyle = m.crown; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x, top + 8); ctx.quadraticCurveTo(x + w / 2, top - 8, x + w, top + 8); ctx.lineTo(x + w, bot); ctx.stroke();
  } else {
    fillRR(ctx, x, top, w, h, 2, m.wood);
    ctx.fillStyle = m.dk; ctx.fillRect(x + 3, top + 6, w - 6, h - 9);
    if (m.puff) { for (let k = 0; k < 4; k++) circ(ctx, x + 6 + k * (w - 12) / 3, top - 1, 5, m.crown); }
    else fillRR(ctx, x - 2, top - 3, w + 4, 6, 2, m.crown);
    if (m.finial) { circ(ctx, x + 2, top - 5, 2, m.trim); circ(ctx, x + w - 2, top - 5, 2, m.trim); star(ctx, x + w / 2, top - 5, 2.6, m.trim); }
  }
  const rows = 4;
  const rowH = (h - 10) / rows;
  for (let k = 0; k < rows; k++) {
    const y0 = top + 6 + k * rowH;
    const yb = y0 + rowH - 2;
    ctx.fillStyle = m.niche ? m.crown : shade(m.wood.startsWith('#') ? m.wood : WOOD, 0.1); ctx.fillRect(x + 2, yb, w - 4, 2.6);
    if (m.trim) { ctx.fillStyle = m.trim; ctx.fillRect(x + 2, yb, w - 4, 0.9); }
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
      const col = bookCols[Math.floor(R() * bookCols.length)];
      const lean = R() < 0.08 && bx + bw + 4 < limit;
      if (lean) {
        ctx.save(); ctx.translate(bx, yb); ctx.rotate(-0.28); ctx.fillStyle = col; ctx.fillRect(0, -bh, bw, bh); ctx.restore();
        bx += bw + 3.5;
      } else {
        ctx.fillStyle = col; ctx.fillRect(bx, yb - bh, bw, bh);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx + 0.5, yb - bh + 2, bw - 1, 0.8);
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(bx + bw - 0.8, yb - bh, 0.8, bh);
        bx += bw + 0.3;
      }
    }
    // shadow under each shelf board
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(x + 3, y0, w - 6, 1.6);
  }
  if (m.glass) {
    ctx.fillStyle = 'rgba(210,230,245,0.18)'; ctx.fillRect(x + 3, top + 6, w - 6, h - 9);
    ctx.strokeStyle = m.crown; ctx.lineWidth = 1.2; ctx.strokeRect(x + 3, top + 6, (w - 6) / 2, h - 9); ctx.strokeRect(x + 3 + (w - 6) / 2, top + 6, (w - 6) / 2, h - 9);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(x + 6, top + 8); ctx.lineTo(x + 14, top + 8); ctx.lineTo(x + 6, top + 30); ctx.fill();
    circ(ctx, x + w / 2 - 2, top + h / 2, 1, '#e0b84f'); circ(ctx, x + w / 2 + 2, top + h / 2, 1, '#e0b84f');
  }
  if (m.rivets) { for (const yy of [top + 3, bot - 4]) for (const xx of [x + 2, x + w - 2]) circ(ctx, xx, yy, 1.1, m.trim); }
  if (m.rope) { ctx.strokeStyle = '#d9c49a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 1, top + 2); ctx.quadraticCurveTo(x + w / 2, top + 10, x + w + 1, top + 2); ctx.stroke(); star(ctx, x + w - 8, top + 12, 3, '#f29c7a'); }
  // contact shadow on the floor
  ell(ctx, x + w / 2, bot + 0.5, w / 2 + 3, 2.2, 'rgba(0,0,0,0.18)');
}

export function drawLadder(ctx, x, top, bot) {
  ctx.strokeStyle = '#6b4128'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x, top + 4); ctx.lineTo(x + 12, bot); ctx.moveTo(x + 9, top + 4); ctx.lineTo(x + 21, bot); ctx.stroke();
  ctx.lineWidth = 1.1; for (let k = 1; k < 8; k++) { const f = k / 8; ctx.beginPath(); ctx.moveTo(x + 12 * f, top + 4 + (bot - top - 4) * f); ctx.lineTo(x + 9 + 12 * f, top + 4 + (bot - top - 4) * f); ctx.stroke(); }
  ctx.strokeStyle = '#b08a3e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 30, top + 2); ctx.lineTo(x + 40, top + 2); ctx.stroke();
  circ(ctx, x + 1, top + 3, 1.6, '#b08a3e'); circ(ctx, x + 10, top + 3, 1.6, '#b08a3e');
}

/* ------------------------------------------------------------------ */
/* Centrepieces & curiosities: standing on the floor at (x, base)      */
/* ------------------------------------------------------------------ */
export const CENTER_H = { clock: 72, horse: 44, urn: 46, globe: 48, candles: 52, fountain: 36, telescope: 40, chest: 30, harp: 48, statue: 52, gramophone: 44, cuckoo: 70, fishtank: 40, typewriter: 34, crystalball: 40, orrery: 50, armor: 62, tome: 48, popcorn: 50 };

export function drawCenter(ctx, kind, x, base, pal, t = 0) {
  ell(ctx, x, base + 0.5, 15, 2.6, 'rgba(0,0,0,0.18)');
  switch (kind) {
    case 'clock':
      fillRR(ctx, x - 10, base - 62, 20, 62, 3, WOOD_DK);
      ctx.fillStyle = WOOD; ctx.beginPath(); ctx.moveTo(x - 11, base - 60); ctx.quadraticCurveTo(x, base - 72, x + 11, base - 60); ctx.fill();
      circ(ctx, x, base - 50, 7.5, '#f7efdc'); ctx.strokeStyle = INK; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(x, base - 50); ctx.lineTo(x, base - 55.5); ctx.moveTo(x, base - 50); ctx.lineTo(x + 4, base - 49); ctx.stroke();
      fillRR(ctx, x - 5.5, base - 38, 11, 28, 2, INK);
      circ(ctx, x + Math.sin(t * 3) * 3, base - 17, 2.6, '#e3b04b');
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
      for (let k = 0; k < 7; k++) circ(ctx, x - 9 + k * 3, base - 16 - (k % 2) * 2, 2.4, k % 3 ? '#ffd257' : '#e9a623');
      ctx.save(); ctx.translate(x - 13, base - 15); ctx.rotate(-0.5); fillRR(ctx, 0, -12, 26, 12, 4, WOOD_DK); ctx.restore();
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
    case 'gramophone':
      fillRR(ctx, x - 11, base - 12, 22, 12, 2, WOOD); ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 11, base - 4, 22, 1.4);
      ell(ctx, x - 2, base - 13, 9, 2, '#2a2430'); circ(ctx, x - 2, base - 13.4, 1.4, '#c0504d');
      ctx.strokeStyle = '#c99a4d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 6, base - 13); ctx.quadraticCurveTo(x + 8, base - 26, x + 2, base - 30); ctx.stroke();
      ctx.fillStyle = '#e8b85a'; ctx.beginPath(); ctx.moveTo(x + 2, base - 30); ctx.lineTo(x - 16, base - 44); ctx.quadraticCurveTo(x - 8, base - 34, x - 6, base - 26); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#b07a2e'; ctx.lineWidth = 0.6; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 2, base - 30); ctx.lineTo(x - 16 + k * 3, base - 44 + k * 4); ctx.stroke(); }
      break;
    case 'cuckoo':
      ctx.fillStyle = WOOD_DK; ctx.fillRect(x - 1, base - 44, 2, 44);
      ctx.strokeStyle = '#b08a3e'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 4, base - 44); ctx.lineTo(x - 4, base - 20 + Math.sin(t * 2) * 3); ctx.moveTo(x + 4, base - 44); ctx.lineTo(x + 4, base - 24 - Math.sin(t * 2) * 3); ctx.stroke();
      ell(ctx, x - 4, base - 18 + Math.sin(t * 2) * 3, 1.8, 3.2, '#b08a3e'); ell(ctx, x + 4, base - 22 - Math.sin(t * 2) * 3, 1.8, 3.2, '#b08a3e');
      fillRR(ctx, x - 12, base - 66, 24, 22, 2, WOOD);
      ctx.fillStyle = WOOD_DK; ctx.beginPath(); ctx.moveTo(x - 15, base - 64); ctx.lineTo(x, base - 76); ctx.lineTo(x + 15, base - 64); ctx.closePath(); ctx.fill();
      circ(ctx, x, base - 52, 6.5, '#f7efdc'); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, base - 52); ctx.lineTo(x, base - 56); ctx.moveTo(x, base - 52); ctx.lineTo(x + 3, base - 51); ctx.stroke();
      fillRR(ctx, x - 3, base - 66, 6, 5, 1, INK); ell(ctx, x - 7, base - 58, 2.5, 4, '#6a9f58', -0.4); ell(ctx, x + 7, base - 58, 2.5, 4, '#6a9f58', 0.4);
      break;
    case 'fishtank':
      fillRR(ctx, x - 13, base - 8, 26, 8, 1.5, WOOD_DK); ctx.fillStyle = WOOD; ctx.fillRect(x - 11, base - 8, 3, 8); ctx.fillRect(x + 8, base - 8, 3, 8);
      fillRR(ctx, x - 14, base - 36, 28, 28, 3, 'rgba(160,210,235,0.55)');
      ctx.fillStyle = 'rgba(95,159,200,0.45)'; ctx.fillRect(x - 13, base - 30, 26, 21);
      ell(ctx, x - 6, base - 10, 5, 2, '#e8d6b0'); ell(ctx, x + 5, base - 10, 6, 2, '#e8d6b0');
      ctx.strokeStyle = '#4f8a44'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 8, base - 10); ctx.quadraticCurveTo(x - 10, base - 18, x - 7, base - 24); ctx.stroke();
      { const fx = x + Math.sin(t * 0.9) * 7; const dir = Math.cos(t * 0.9) > 0 ? 1 : -1; ell(ctx, fx, base - 20, 4, 2.6, '#f29c38'); ctx.fillStyle = '#f29c38'; ctx.beginPath(); ctx.moveTo(fx - dir * 3.5, base - 20); ctx.lineTo(fx - dir * 7, base - 23); ctx.lineTo(fx - dir * 7, base - 17); ctx.fill(); circ(ctx, fx + dir * 2, base - 20.8, 0.6, INK);
        circ(ctx, fx + dir * 5, base - 26 - ((t * 8) % 6), 0.9, 'rgba(255,255,255,0.8)'); }
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; rr(ctx, x - 14, base - 36, 28, 28, 3); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - 12, base - 34, 3, 20);
      break;
    case 'typewriter':
      fillRR(ctx, x - 13, base - 14, 26, 14, 2, '#3a3440'); fillRR(ctx, x - 14, base - 14, 28, 3, 1, '#2a2430');
      fillRR(ctx, x - 9, base - 30, 18, 16, 1, '#fbf6ea'); ctx.fillStyle = '#6d6d78'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 7, base - 27 + k * 3, 10 + (k % 2) * 3, 0.6);
      fillRR(ctx, x - 13, base - 17, 26, 3, 1.5, '#1d1b24');
      for (let r2 = 0; r2 < 2; r2++) for (let k = 0; k < 6; k++) circ(ctx, x - 10 + k * 4 + r2 * 2, base - 8 + r2 * 3, 1.2, '#e8e1d6');
      ell(ctx, x - 7, base - 34, 1.8, 3.2, 'rgba(210,230,245,0.7)'); ell(ctx, x - 3, base - 36, 1.8, 3.2, 'rgba(210,230,245,0.5)');
      break;
    case 'crystalball':
      fillRR(ctx, x - 9, base - 8, 18, 8, 2, '#4b3f78'); ctx.fillStyle = '#e0b84f'; ctx.fillRect(x - 9, base - 8, 18, 1.4);
      { const g = ctx.createRadialGradient(x - 3, base - 24, 1, x, base - 20, 13); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#d4b3f0'); g.addColorStop(1, '#6d5fa3'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, base - 20, 12, 0, Math.PI * 2); ctx.fill(); }
      for (let k = 0; k < 3; k++) { const a = t * 1.5 + k * 2.1; circ(ctx, x + Math.cos(a) * 6, base - 20 + Math.sin(a) * 4, 1, 'rgba(255,255,255,0.85)'); }
      break;
    case 'orrery':
      ctx.fillStyle = '#6b4520'; ctx.fillRect(x - 1.5, base - 30, 3, 30); ell(ctx, x, base - 1, 9, 2.4, '#6b4520');
      ctx.strokeStyle = '#c99a4d'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(x, base - 34, 16, 5, 0, 0, Math.PI * 2); ctx.ellipse(x, base - 34, 9, 3, 0, 0, Math.PI * 2); ctx.stroke();
      circ(ctx, x, base - 34, 4.5, '#ffcf3f');
      circ(ctx, x + Math.cos(t * 1.3) * 9, base - 34 + Math.sin(t * 1.3) * 3, 2, '#6fa8dc');
      circ(ctx, x + Math.cos(t * 0.7 + 2) * 16, base - 34 + Math.sin(t * 0.7 + 2) * 5, 2.6, '#f2e0a0');
      break;
    case 'armor':
      fillRR(ctx, x - 8, base - 4, 16, 4, 1, '#6d6880');
      ctx.fillStyle = '#b9b8c6'; ctx.fillRect(x - 5, base - 20, 3.5, 16); ctx.fillRect(x + 1.5, base - 20, 3.5, 16);
      fillRR(ctx, x - 8, base - 42, 16, 22, 4, '#c9c8d6'); ctx.fillStyle = '#9d9cad'; ctx.fillRect(x - 8, base - 26, 16, 2);
      fillRR(ctx, x - 12, base - 42, 5, 16, 2.4, '#b9b8c6'); fillRR(ctx, x + 7, base - 42, 5, 16, 2.4, '#b9b8c6');
      fillRR(ctx, x - 6, base - 56, 12, 14, 5, '#d9d8e4'); ctx.fillStyle = '#2a2430'; ctx.fillRect(x - 4.5, base - 51, 9, 1.8);
      ctx.fillStyle = '#c0504d'; ctx.beginPath(); ctx.moveTo(x, base - 56); ctx.quadraticCurveTo(x + 8, base - 64, x + 3, base - 70); ctx.quadraticCurveTo(x + 2, base - 62, x - 2, base - 57); ctx.fill();
      ctx.strokeStyle = '#8a8898'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 13, base); ctx.lineTo(x + 13, base - 50); ctx.stroke(); ctx.fillStyle = '#d9d8e4'; ctx.beginPath(); ctx.moveTo(x + 11, base - 50); ctx.lineTo(x + 13, base - 58); ctx.lineTo(x + 15, base - 50); ctx.fill();
      break;
    case 'tome': {
      fillRR(ctx, x - 7, base - 20, 14, 20, 2, '#6b4520'); ctx.fillStyle = '#e0b84f'; ctx.fillRect(x - 9, base - 22, 18, 3);
      const y = base - 34 + Math.sin(t * 1.5) * 2.5;
      const g = ctx.createRadialGradient(x, y, 2, x, y, 22); g.addColorStop(0, 'rgba(255,230,150,0.55)'); g.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = g; ctx.fillRect(x - 22, y - 22, 44, 44);
      ctx.fillStyle = '#7a1f2b'; ctx.beginPath(); ctx.moveTo(x - 13, y + 3); ctx.lineTo(x, y + 6); ctx.lineTo(x + 13, y + 3); ctx.lineTo(x + 13, y + 5); ctx.lineTo(x, y + 8); ctx.lineTo(x - 13, y + 5); ctx.fill();
      ctx.fillStyle = '#fbf6ea'; ctx.beginPath(); ctx.moveTo(x - 12, y - 4); ctx.quadraticCurveTo(x - 6, y - 7, x, y - 3); ctx.lineTo(x, y + 5); ctx.quadraticCurveTo(x - 6, y + 1, x - 12, y + 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 12, y - 4); ctx.quadraticCurveTo(x + 6, y - 7, x, y - 3); ctx.lineTo(x, y + 5); ctx.quadraticCurveTo(x + 6, y + 1, x + 12, y + 3); ctx.fill();
      const flip = (t * 0.8) % 1; ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.quadraticCurveTo(x + Math.cos(flip * Math.PI) * 6, y - 9, x + Math.cos(flip * Math.PI) * 12, y - 4); ctx.lineTo(x + Math.cos(flip * Math.PI) * 12, y + 3); ctx.lineTo(x, y + 5); ctx.fill();
      for (let k = 0; k < 3; k++) star(ctx, x + Math.cos(t + k * 2.1) * 16, y - 4 + Math.sin(t * 1.3 + k * 2.1) * 8, 1.5, '#fff3b0');
      break;
    }
    case 'popcorn':
      ctx.fillStyle = '#c0504d'; ctx.fillRect(x - 10, base - 14, 20, 14); ctx.fillStyle = '#f2c14e'; ctx.fillRect(x - 10, base - 14, 20, 2);
      ctx.fillStyle = '#2a2430'; ctx.fillRect(x - 8, base - 2, 2, 2); ctx.fillRect(x + 6, base - 2, 2, 2);
      fillRR(ctx, x - 11, base - 40, 22, 26, 2, 'rgba(230,240,245,0.55)'); ctx.strokeStyle = '#c0504d'; ctx.lineWidth = 1.6; rr(ctx, x - 11, base - 40, 22, 26, 2); ctx.stroke();
      { const R = rng(5); for (let k = 0; k < 16; k++) circ(ctx, x - 8 + R() * 16, base - 16 - R() * 12, 1.8, '#fff6d8'); }
      fillRR(ctx, x - 12, base - 46, 24, 7, 2, '#c0504d'); ctx.fillStyle = '#fff'; ctx.font = `700 4.6px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('POPCORN', x, base - 42.3);
      break;
    default: break;
  }
}

/* ------------------------------------------------------------------ */
/* Garden pieces: standing at (x, y) on the grass (world space)        */
/* ------------------------------------------------------------------ */
export function drawGardenPiece(ctx, id, x, y, t = 0, tint = (c) => c, dark = 0) {
  ell(ctx, x, y + 1, 18, 3.5, 'rgba(0,0,0,0.14)');
  switch (id) {
    case 'gnome':
      ell(ctx, x, y - 7, 6, 7, tint('#4f7cac')); circ(ctx, x, y - 16, 4.5, tint('#f2c9a8')); ell(ctx, x, y - 12, 4.5, 4, tint('#ffffff'));
      ctx.fillStyle = tint('#c0504d'); ctx.beginPath(); ctx.moveTo(x - 5, y - 18); ctx.lineTo(x + 1, y - 32); ctx.lineTo(x + 5, y - 18); ctx.fill();
      fillRR(ctx, x - 7, y - 9, 8, 6, 1, tint('#e9b949')); circ(ctx, x + 1.5, y - 16, 1.4, tint('#e98b8b'));
      break;
    case 'birdbath':
      fillRR(ctx, x - 3, y - 14, 6, 14, 2, tint('#b9b3a8')); ell(ctx, x, y - 1, 8, 2, tint('#9d9486'));
      ell(ctx, x, y - 16, 14, 4, tint('#b9b3a8')); ell(ctx, x, y - 17, 11, 2.4, tint('#8fc3d9'));
      if (dark < 0.4) { const hop = Math.abs(Math.sin(t * 3)) * 2; ell(ctx, x + 8, y - 21 - hop, 3.4, 2.4, tint('#9aa5b8')); circ(ctx, x + 10.5, y - 23 - hop, 1.8, tint('#9aa5b8')); ctx.fillStyle = '#e8a33a'; ctx.fillRect(x + 12, y - 23.5 - hop, 1.8, 0.8); }
      break;
    case 'minilib':
      ctx.fillStyle = tint('#6b4128'); ctx.fillRect(x - 1.5, y - 20, 3, 20);
      fillRR(ctx, x - 12, y - 42, 24, 22, 2, tint('#d9774b')); ctx.fillStyle = tint('#8e3b2d'); ctx.beginPath(); ctx.moveTo(x - 15, y - 42); ctx.lineTo(x, y - 52); ctx.lineTo(x + 15, y - 42); ctx.fill();
      fillRR(ctx, x - 9, y - 39, 18, 16, 1, 'rgba(200,230,250,0.6)'); ['#4f7cac', '#e9b949', '#6a9f58', '#c0504d'].forEach((c, k) => { ctx.fillStyle = tint(c); ctx.fillRect(x - 7 + k * 4, y - 36, 3, 11); });
      ctx.fillStyle = tint('#fff3dc'); ctx.font = `700 4px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('FREE', x, y - 44);
      break;
    case 'topiary':
      fillRR(ctx, x - 16, y - 8, 32, 8, 2, tint('#8a5a3a'));
      ctx.fillStyle = tint('#4f8a44'); ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.quadraticCurveTo(x - 10, y - 16, x - 20, y - 12); ctx.lineTo(x - 20, y - 34); ctx.quadraticCurveTo(x - 10, y - 38, x, y - 32); ctx.quadraticCurveTo(x + 10, y - 38, x + 20, y - 34); ctx.lineTo(x + 20, y - 12); ctx.quadraticCurveTo(x + 10, y - 16, x, y - 10); ctx.fill();
      ctx.strokeStyle = tint('#3a6f35'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 32); ctx.lineTo(x, y - 10); ctx.stroke();
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 16, y - 28 + k * 5); ctx.lineTo(x - 4, y - 26 + k * 5); ctx.moveTo(x + 4, y - 26 + k * 5); ctx.lineTo(x + 16, y - 28 + k * 5); ctx.stroke(); }
      break;
    case 'sundial':
      fillRR(ctx, x - 5, y - 16, 10, 16, 2, tint('#b9b3a8')); ell(ctx, x, y - 17, 12, 3.5, tint('#d8d0c2'));
      ctx.fillStyle = tint('#8a6a2e'); ctx.beginPath(); ctx.moveTo(x - 1, y - 18); ctx.lineTo(x + 6, y - 18); ctx.lineTo(x - 1, y - 25); ctx.fill();
      break;
    case 'xmastree':
      ctx.fillStyle = tint('#6b4a34'); ctx.fillRect(x - 2.5, y - 8, 5, 8);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = tint(k % 2 ? '#2f7f4f' : '#3f9a5b'); ctx.beginPath(); ctx.moveTo(x - 20 + k * 4, y - 6 - k * 11); ctx.lineTo(x, y - 24 - k * 11); ctx.lineTo(x + 20 - k * 4, y - 6 - k * 11); ctx.fill(); }
      star(ctx, x, y - 58, 4.5, '#ffd24a');
      ['#d9534f', '#f2c14e', '#6fa8dc', '#ffffff', '#d4b3f0'].forEach((c, k) => { const on = 0.5 + 0.5 * Math.sin(t * 3 + k * 1.7); ctx.globalAlpha = 0.5 + on * 0.5; fillRR(ctx, x - 12 + (k * 7) % 22, y - 12 - k * 8, 3, 4, 0.6, c); ctx.globalAlpha = 1; });
      break;
    case 'lanternarch': {
      ctx.strokeStyle = tint('#6b4a34'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 22, y); ctx.lineTo(x - 22, y - 34); ctx.quadraticCurveTo(x, y - 54, x + 22, y - 34); ctx.lineTo(x + 22, y); ctx.stroke();
      ['#f2c14e', '#e8913a', '#3f9fbf', '#9b6fb0', '#e0605a'].forEach((c, k) => { const a = Math.PI * (0.1 + k * 0.2); const lx = x - Math.cos(a) * 22; const ly = y - 34 - Math.sin(a) * 18; ctx.strokeStyle = tint('#5a4a30'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 5); ctx.stroke(); fillRR(ctx, lx - 2.6, ly + 5, 5.2, 7, 1.5, c); if (dark > 0.25) { const g = ctx.createRadialGradient(lx, ly + 8, 0, lx, ly + 8, 10); g.addColorStop(0, rgba(c, 0.5 * dark)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(lx - 10, ly - 2, 20, 20); } });
      break;
    }
    case 'eidlights':
      ctx.strokeStyle = tint('#6b4a34'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x - 24, y - 40); ctx.moveTo(x + 24, y); ctx.lineTo(x + 24, y - 40); ctx.stroke();
      for (let row = 0; row < 3; row++) { ctx.strokeStyle = tint('#3a3440'); ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x - 24, y - 40 + row * 6); ctx.quadraticCurveTo(x, y - 30 + row * 6, x + 24, y - 40 + row * 6); ctx.stroke();
        for (let k = 1; k < 8; k++) { const f = k / 8; const lx = x - 24 + 48 * f; const ly = y - 40 + row * 6 + Math.sin(f * Math.PI) * 10; const on = 0.5 + 0.5 * Math.sin(t * 4 + k + row); circ(ctx, lx, ly, 1.3, ['#f2c14e', '#3fbf9f', '#f28b82'][(k + row) % 3]); if (dark > 0.25) { ctx.globalAlpha = on * dark * 0.5; circ(ctx, lx, ly, 3.5, '#fff0b0'); ctx.globalAlpha = 1; } } }
      star(ctx, x, y - 48, 4, '#f2c14e', 8, 0.5);
      break;
    case 'pumpkins':
      [[-10, 0, 9], [9, 0, 8], [0, -12, 7]].forEach(([dx, dy, r]) => {
        ell(ctx, x + dx, y + dy - r * 0.8, r * 1.2, r * 0.9, tint('#e8913a')); ctx.strokeStyle = tint('#c9731f'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(x + dx, y + dy - r * 0.8, r * 0.5, r * 0.9, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = tint('#5b7f4d'); ctx.fillRect(x + dx - 0.8, y + dy - r * 1.7 - 2, 1.6, 3);
        const glow = dark > 0.2 ? '#ffd257' : '#3a2a20';
        ctx.fillStyle = glow; ctx.beginPath(); ctx.moveTo(x + dx - r * 0.5, y + dy - r); ctx.lineTo(x + dx - r * 0.2, y + dy - r * 1.3); ctx.lineTo(x + dx - r * 0.05, y + dy - r); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + dx + r * 0.5, y + dy - r); ctx.lineTo(x + dx + r * 0.2, y + dy - r * 1.3); ctx.lineTo(x + dx + r * 0.05, y + dy - r); ctx.fill();
        ctx.fillRect(x + dx - r * 0.5, y + dy - r * 0.6, r, 1.6);
      });
      break;
    case 'heartarch':
      ctx.strokeStyle = tint('#4f8a44'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x - 20, y - 30); ctx.bezierCurveTo(x - 22, y - 52, x, y - 50, x, y - 38); ctx.bezierCurveTo(x, y - 50, x + 22, y - 52, x + 20, y - 30); ctx.lineTo(x + 20, y); ctx.stroke();
      for (let k = 0; k < 9; k++) { const a = k / 8; circ(ctx, x - 20 + (k % 2) * 2, y - a * 32, 2.2, tint(k % 2 ? '#e0405f' : '#f28b9b')); circ(ctx, x + 20 - (k % 2) * 2, y - a * 32, 2.2, tint(k % 2 ? '#f28b9b' : '#e0405f')); }
      heart(ctx, x, y - 24 + Math.sin(t * 2) * 1.5, 6, '#e0405f');
      break;
    case 'fireworks':
      fillRR(ctx, x - 14, y - 10, 28, 10, 1.5, tint('#4f7cac'));
      [[-8, '#e0605a'], [0, '#f2c14e'], [8, '#6fa8dc']].forEach(([dx, c]) => { fillRR(ctx, x + dx - 2, y - 26, 4, 16, 1, tint(c)); ctx.fillStyle = tint('#fbf6ea'); ctx.beginPath(); ctx.moveTo(x + dx - 2.5, y - 26); ctx.lineTo(x + dx, y - 31); ctx.lineTo(x + dx + 2.5, y - 26); ctx.fill(); });
      break;
    case 'lemonade':
      fillRR(ctx, x - 18, y - 16, 36, 16, 1.5, tint('#f2e6c8')); ctx.fillStyle = tint('#e0b84f'); ctx.fillRect(x - 18, y - 16, 36, 3);
      ctx.fillStyle = tint('#6b4a34'); ctx.fillRect(x - 17, y - 42, 2, 26); ctx.fillRect(x + 15, y - 42, 2, 26);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = tint(k % 2 ? '#ffd24a' : '#ffffff'); ctx.beginPath(); ctx.moveTo(x - 20 + k * 7, y - 42); ctx.lineTo(x - 13 + k * 7, y - 42); ctx.lineTo(x - 16.5 + k * 7, y - 36); ctx.fill(); }
      fillRR(ctx, x - 8, y - 24, 6, 8, 1, 'rgba(255,230,120,0.85)'); ['#c0504d', '#4f7cac'].forEach((c, k) => { ctx.fillStyle = tint(c); ctx.fillRect(x + 2 + k * 5, y - 24, 4, 8); });
      break;
    case 'haybales':
      [[-12, 0], [12, 0], [0, -11]].forEach(([dx, dy]) => { fillRR(ctx, x + dx - 11, y + dy - 11, 22, 11, 3, tint('#e8c465')); ctx.strokeStyle = tint('#c9a13e'); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x + dx - 5, y + dy - 11); ctx.lineTo(x + dx - 5, y + dy); ctx.moveTo(x + dx + 5, y + dy - 11); ctx.lineTo(x + dx + 5, y + dy); ctx.stroke(); });
      ctx.fillStyle = tint('#7a4b2e'); ctx.fillRect(x - 1, y - 48, 2.4, 26); ctx.fillRect(x - 11, y - 42, 22, 2);
      fillRR(ctx, x - 6, y - 44, 12, 12, 3, tint('#c0504d')); circ(ctx, x, y - 48, 4.5, tint('#e8c465')); ell(ctx, x, y - 52, 8, 2, tint('#9c7b4f')); ctx.fillStyle = tint('#9c7b4f'); ctx.fillRect(x - 3.5, y - 57, 7, 5);
      break;
    case 'bookstall':
      fillRR(ctx, x - 20, y - 14, 40, 14, 1.5, tint('#8a5a3a'));
      for (let k = 0; k < 8; k++) { ctx.fillStyle = tint(['#4f7cac', '#e9b949', '#c0504d', '#6a9f58'][k % 4]); ctx.fillRect(x - 18 + k * 4.6, y - 20, 3.6, 7); }
      ctx.fillStyle = tint('#6b4a34'); ctx.fillRect(x - 19, y - 40, 2, 26); ctx.fillRect(x + 17, y - 40, 2, 26);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = tint(k % 2 ? '#4f7cac' : '#fff3dc'); ctx.beginPath(); ctx.moveTo(x - 22 + k * 7.4, y - 40); ctx.lineTo(x - 14.6 + k * 7.4, y - 40); ctx.lineTo(x - 18.3 + k * 7.4, y - 34); ctx.fill(); }
      break;
    case 'cake':
      fillRR(ctx, x - 16, y - 12, 32, 12, 3, tint('#f7c9d6')); fillRR(ctx, x - 12, y - 22, 24, 10, 3, tint('#fff3dc')); fillRR(ctx, x - 8, y - 30, 16, 8, 3, tint('#f7c9d6'));
      ctx.fillStyle = tint('#e0405f'); for (let k = 0; k < 5; k++) circ(ctx, x - 12 + k * 6, y - 12, 1.6, '#e0405f');
      for (const dx of [-4, 0, 4]) { ctx.fillStyle = tint('#9ec5f0'); ctx.fillRect(x + dx - 0.8, y - 36, 1.6, 6); ell(ctx, x + dx, y - 38 + Math.sin(t * 8 + dx) * 0.4, 1.2, 2, '#ffcf5a'); }
      break;
    default: break;
  }
}

/* ------------------------------------------------------------------ */
/* Keepsakes (small icons for the vault shelves & collection)          */
/* ------------------------------------------------------------------ */
const KEEP_COL = { acorn: '#c9a227', thimble: '#b9b3c9', boot: '#6b4a34', shipbottle: '#8fd3c7', seashell: '#f7c9b8', compass: '#c99a4d', crystal: '#7de8d8', fossil: '#d8cdb1', nowhere: '#ecd9a8', page: '#fbf6ea', owl: '#c99a4d', bookmark: '#c0504d', scale: '#3fbf7f', card: '#e0b84f', helmet: '#b9b8c6', cloud: '#e8f4ff', whaleshell: '#9ec5f0', feather: '#f2d27a' };
export function drawKeepsake(ctx, id, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const c = KEEP_COL[id] || '#e0b84f';
  switch (id) {
    case 'trophy': fillRR(ctx, -5, -2, 10, 2, 0.5, '#8a6a2e'); ctx.fillStyle = '#e0b84f'; ctx.fillRect(-1.2, -6, 2.4, 4); ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(6, -14); ctx.quadraticCurveTo(6, -6, 0, -6); ctx.quadraticCurveTo(-6, -6, -6, -14); ctx.fill(); ctx.strokeStyle = '#e0b84f'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-6, -11, 2.2, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(6, -11, 2.2, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke(); star(ctx, 0, -11, 2, '#fff3b0'); break;
    case 'acorn': ell(ctx, 0, -4, 3.6, 4.4, c); ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(0, -7.5, 4.2, 2.4, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-0.5, -11, 1, 2); break;
    case 'boot': ctx.fillStyle = c; ctx.fillRect(-3, -12, 5, 9); fillRR(ctx, -3, -5, 9, 5, 2, c); ctx.fillStyle = '#4a3121'; ctx.fillRect(-3, -1, 9, 1); break;
    case 'shipbottle': ell(ctx, 0, -5, 7, 4, 'rgba(143,211,199,0.6)'); fillRR(ctx, 6, -6.5, 3, 3, 0.6, '#8a5a3a'); ctx.fillStyle = '#fbf6ea'; ctx.beginPath(); ctx.moveTo(-1, -8); ctx.lineTo(-1, -3.5); ctx.lineTo(2.5, -3.5); ctx.fill(); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-4, -3.4, 7, 1.2); break;
    case 'seashell': ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(-6, -8); ctx.quadraticCurveTo(0, -14, 6, -8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#e8a390'; ctx.lineWidth = 0.6; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(k * 2.4, -11); ctx.stroke(); } break;
    case 'compass': circ(ctx, 0, -6, 5.5, c); circ(ctx, 0, -6, 4.2, '#fbf6ea'); ctx.fillStyle = '#c0504d'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(1.2, -6); ctx.lineTo(-1.2, -6); ctx.fill(); break;
    case 'crystal': case 'scale': ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-4, -8); ctx.lineTo(-1, -13); ctx.lineTo(2, -8); ctx.lineTo(1, 0); ctx.fill(); ctx.fillStyle = shade(c, 0.3); ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(3, -6); ctx.lineTo(5, -9); ctx.lineTo(5, 0); ctx.fill(); break;
    case 'fossil': fillRR(ctx, -6, -9, 12, 9, 2, c); ctx.strokeStyle = '#9d9486'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, -4.5, 3, 0, Math.PI * 1.7); ctx.arc(0, -4.5, 1.4, 0, Math.PI * 1.7); ctx.stroke(); break;
    case 'nowhere': case 'page': case 'card': fillRR(ctx, -5, -12, 10, 12, 1, c); ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 3; k++) ctx.fillRect(-3, -9 + k * 3, 6, 0.6); if (id === 'nowhere') { ctx.strokeStyle = '#c0504d'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(1, -1); ctx.moveTo(1, -4); ctx.lineTo(-2, -1); ctx.stroke(); } break;
    case 'owl': ell(ctx, 0, -6, 4.5, 6, c); circ(ctx, -1.8, -8, 1.8, '#fbf6ea'); circ(ctx, 1.8, -8, 1.8, '#fbf6ea'); circ(ctx, -1.8, -8, 0.8, '#2a2430'); circ(ctx, 1.8, -8, 0.8, '#2a2430'); break;
    case 'bookmark': case 'bookmarks': ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-2.5, -13); ctx.lineTo(2.5, -13); ctx.lineTo(2.5, 0); ctx.lineTo(0, -2.5); ctx.lineTo(-2.5, 0); ctx.fill(); circ(ctx, 0, -11, 1, '#f2c14e'); break;
    case 'helmet': fillRR(ctx, -5, -12, 10, 12, 4, c); ctx.fillStyle = '#2a2430'; ctx.fillRect(-3.5, -8, 7, 1.4); break;
    case 'cloud': fillRR(ctx, -4, -13, 8, 13, 2, 'rgba(200,225,245,0.6)'); ell(ctx, 0, -6, 3, 2, '#ffffff'); ell(ctx, -1.4, -7, 2, 1.6, '#ffffff'); break;
    case 'whaleshell': case 'thimble': ell(ctx, 0, -5, 5, 5, c); ctx.strokeStyle = shade(c, -0.2); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(0, -5, 3, 0, Math.PI * 1.5); ctx.stroke(); break;
    case 'feather': ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-5, -8, 1, -14); ctx.quadraticCurveTo(4, -6, 0, 0); ctx.fill(); break;
    case 'firsted': fillRR(ctx, -5, -12, 10, 12, 1, '#7cc46b'); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(-3.5, -9, 7, 2); circ(ctx, 5, -10, 2.4, 'rgba(0,0,0,0)'); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5, -9, 2.4, Math.PI * 0.5, Math.PI * 1.5); ctx.fill(); break;
    case 'glasses': ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-3.5, -5, 3, 0, Math.PI * 2); ctx.moveTo(5.5, -5); ctx.arc(3.5, -5, 3, 0, Math.PI * 2); ctx.moveTo(-0.5, -5.5); ctx.lineTo(0.5, -5.5); ctx.stroke(); break;
    case 'hairball': ell(ctx, 0, -4, 6, 4.4, '#8e86a3'); ctx.fillStyle = '#8e86a3'; ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-4, -11); ctx.lineTo(-1.5, -7); ctx.moveTo(5, -6); ctx.lineTo(4, -11); ctx.lineTo(1.5, -7); ctx.fill(); break;
    case 'goldmark': ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(-3, -13); ctx.lineTo(3, -13); ctx.lineTo(3, 0); ctx.lineTo(0, -3); ctx.lineTo(-3, 0); ctx.fill(); star(ctx, 0, -9, 2, '#fff6c8'); break;
    case 'unfinished': fillRR(ctx, -6, -13, 12, 13, 1.2, '#6d5fa3'); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(4, -12, 2, 11); ctx.fillStyle = '#e0b84f'; ctx.fillRect(-4, -9, 7, 1); break;
    case 'envelope': fillRR(ctx, -6, -9, 12, 8, 1, '#f4ead8'); ctx.strokeStyle = '#b39a6a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(0, -4.5); ctx.lineTo(6, -9); ctx.stroke(); circ(ctx, 0, -4.5, 1.8, '#c0504d'); break;
    case 'snowglobe': fillRR(ctx, -5, -3, 10, 3, 1, '#8a5a3a'); circ(ctx, 0, -8, 5.5, 'rgba(210,235,250,0.75)'); fillRR(ctx, -2, -9, 4, 5, 0.6, '#b5523b'); circ(ctx, -2, -11, 0.6, '#fff'); circ(ctx, 2, -12, 0.6, '#fff'); break;
    case 'backclock': circ(ctx, 0, -6, 5.5, '#c99a4d'); circ(ctx, 0, -6, 4.2, '#fbf6ea'); ctx.strokeStyle = '#3a3029'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-2.5, -8); ctx.moveTo(0, -6); ctx.lineTo(0, -9.5); ctx.stroke(); break;
    case 'giftstack': fillRR(ctx, -6, -6, 12, 6, 1, '#3fbf9f'); fillRR(ctx, -4, -11, 8, 5, 1, '#f28b82'); ctx.fillStyle = '#f2c14e'; ctx.fillRect(-0.6, -11, 1.2, 11); break;
    case 'quillset': for (let k = -1; k <= 1; k++) { ctx.save(); ctx.rotate(k * 0.3); ctx.fillStyle = ['#f2d27a', '#fbf6ea', '#9ec5f0'][k + 1]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-3, -7, 1, -13); ctx.quadraticCurveTo(2.5, -6, 0, 0); ctx.fill(); ctx.restore(); } fillRR(ctx, -4, -3, 8, 4, 1, '#3a3440'); break;
    default: // generic keepsake: a little wrapped book
      fillRR(ctx, -5, -10, 10, 10, 1.2, c); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-5, -6, 10, 1.4);
  }
  ctx.restore();
}
