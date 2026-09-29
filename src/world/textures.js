// Soft, tileable textures (grass blades, soil, rock, bark, leaves, plaster, bricks, shingles).
// Each tile is painted once into a small canvas and used as a CanvasPattern in world space.
// Most are gentle light/dark overlays, so they work on any base colour and follow the seasons.
import { rng } from './draw.js';

const tiles = new Map();
const patterns = new WeakMap();
const RES = 2; // tiles are painted at 2x so they stay crisp when zoomed in

function tile(key, w, h, paint) {
  let c = tiles.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = w * RES; c.height = h * RES;
  const x = c.getContext('2d');
  x.scale(RES, RES);
  paint(x, w, h, rng(key.length * 977 + key.charCodeAt(0) * 31));
  tiles.set(key, c);
  return c;
}

// A pattern for this context. `scale` stretches the texture (1 = one tile per its size in world units).
export function tex(ctx, key, scale = 1) {
  let m = patterns.get(ctx);
  if (!m) { m = new Map(); patterns.set(ctx, m); }
  const id = key + '@' + scale;
  let p = m.get(id);
  if (p) return p;
  const def = DEFS[key];
  p = ctx.createPattern(tile(key, def.w, def.h, def.paint), 'repeat');
  try { p.setTransform(new DOMMatrix().scale(scale / RES)); } catch { /* old browsers: unscaled */ }
  m.set(id, p);
  return p;
}

// Fill the current path (or a rect) with a texture overlay.
export function texFill(ctx, key, alpha = 1, scale = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = tex(ctx, key, scale); ctx.fill(); ctx.restore();
}
export function texRect(ctx, key, x, y, w, h, alpha = 1, scale = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = tex(ctx, key, scale); ctx.fillRect(x, y, w, h); ctx.restore();
}

const DEFS = {
  // grass: short blades in two tones and the odd clover (overlay on the lawn gradient)
  grass: {
    w: 48, h: 32,
    paint(x, w, h, R) {
      x.lineCap = 'round';
      for (let k = 0; k < 90; k++) {
        const px = R() * w; const py = R() * h; const l = 1.6 + R() * 2.6; const lean = (R() - 0.5) * 1.6;
        x.strokeStyle = R() < 0.55 ? 'rgba(20,60,20,0.16)' : 'rgba(255,255,230,0.16)';
        x.lineWidth = 0.5 + R() * 0.35;
        x.beginPath(); x.moveTo(px, py); x.lineTo(px + lean, py - l); x.stroke();
      }
      for (let k = 0; k < 3; k++) { const px = R() * w; const py = R() * h; x.fillStyle = 'rgba(40,90,40,0.18)'; for (let a = 0; a < 3; a++) { x.beginPath(); x.arc(px + Math.cos(a * 2.1) * 0.9, py + Math.sin(a * 2.1) * 0.9, 0.8, 0, 7); x.fill(); } }
    },
  },
  // soil: crumbs, pebbles and tiny roots
  soil: {
    w: 64, h: 48,
    paint(x, w, h, R) {
      for (let k = 0; k < 140; k++) { x.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,230,200,0.08)'; x.fillRect(R() * w, R() * h, 0.8 + R(), 0.8 + R()); }
      for (let k = 0; k < 7; k++) {
        const px = R() * w; const py = R() * h; const rx = 1.2 + R() * 2.4; const ry = rx * (0.55 + R() * 0.3);
        x.fillStyle = `rgba(${R() < 0.5 ? '40,25,15' : '200,170,140'},${0.18 + R() * 0.1})`;
        x.beginPath(); x.ellipse(px, py, rx, ry, R() * 3, 0, 7); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.10)'; x.beginPath(); x.ellipse(px - rx * 0.3, py - ry * 0.35, rx * 0.4, ry * 0.3, 0, 0, 7); x.fill();
      }
      x.strokeStyle = 'rgba(60,35,20,0.16)'; x.lineWidth = 0.5;
      for (let k = 0; k < 2; k++) { const px = R() * w; const py = R() * h; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 4, py + 3, px + 7 + R() * 5, py + 1); x.stroke(); }
    },
  },
  // rock: faceted cracks and mineral glints (bedrock)
  rock: {
    w: 72, h: 60,
    paint(x, w, h, R) {
      for (let k = 0; k < 9; k++) {
        const px = R() * w; const py = R() * h; const r = 5 + R() * 9;
        x.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
        x.beginPath(); for (let a = 0; a < 6; a++) { const aa = (a / 6) * Math.PI * 2 + R() * 0.5; x.lineTo(px + Math.cos(aa) * r, py + Math.sin(aa) * r * 0.8); } x.closePath(); x.fill();
      }
      x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 0.6;
      for (let k = 0; k < 5; k++) { let px = R() * w; let py = R() * h; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 3; s++) { px += (R() - 0.3) * 10; py += (R() - 0.5) * 8; x.lineTo(px, py); } x.stroke(); }
      for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(255,245,210,0.22)'; x.fillRect(R() * w, R() * h, 0.8, 0.8); }
    },
  },
  // bark: long wavy grooves (overlay on trunks)
  bark: {
    w: 16, h: 40,
    paint(x, w, h, R) {
      for (let k = 0; k < 7; k++) {
        const px = R() * w; x.strokeStyle = R() < 0.6 ? 'rgba(40,20,10,0.28)' : 'rgba(255,230,200,0.14)'; x.lineWidth = 0.5 + R() * 0.6;
        x.beginPath(); x.moveTo(px, 0); for (let y = 0; y <= h; y += 5) x.lineTo(px + Math.sin(y * 0.2 + k) * 0.9, y); x.stroke();
      }
      for (let k = 0; k < 2; k++) { x.strokeStyle = 'rgba(40,20,10,0.25)'; x.lineWidth = 0.5; x.beginPath(); x.ellipse(R() * w, R() * h, 1, 2.2, 0, 0, 7); x.stroke(); }
    },
  },
  // leaves: little leaf shapes, sunlit and shaded (overlay on tree canopies)
  leaves: {
    w: 40, h: 40,
    paint(x, w, h, R) {
      for (let k = 0; k < 46; k++) {
        const px = R() * w; const py = R() * h; const a = R() * Math.PI * 2; const s = 1.4 + R() * 1.6;
        x.fillStyle = R() < 0.5 ? 'rgba(255,255,220,0.16)' : 'rgba(10,40,10,0.14)';
        x.save(); x.translate(px, py); x.rotate(a); x.beginPath(); x.ellipse(0, 0, s, s * 0.5, 0, 0, 7); x.fill(); x.restore();
      }
    },
  },
  // plaster: fine speckle for walls
  plaster: {
    w: 48, h: 48,
    paint(x, w, h, R) {
      for (let k = 0; k < 160; k++) { x.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.07)'; x.fillRect(R() * w, R() * h, 0.7 + R() * 0.8, 0.7 + R() * 0.8); }
      for (let k = 0; k < 3; k++) { x.fillStyle = 'rgba(0,0,0,0.025)'; x.beginPath(); x.ellipse(R() * w, R() * h, 4 + R() * 6, 2 + R() * 3, R() * 3, 0, 7); x.fill(); }
    },
  },
  // bricks: soft mortar lines (overlay)
  brick: {
    w: 32, h: 16,
    paint(x, w, h) {
      x.fillStyle = 'rgba(80,40,30,0.12)';
      x.fillRect(0, 7, w, 1); x.fillRect(0, 15, w, 1);
      x.fillRect(8, 0, 1, 7); x.fillRect(24, 0, 1, 7); x.fillRect(0, 8, 1, 7); x.fillRect(16, 8, 1, 7);
      x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(1, 1, 6, 1); x.fillRect(17, 9, 6, 1);
    },
  },
  // clapboard: overlapping horizontal boards
  boards: {
    w: 40, h: 12,
    paint(x, w, h) {
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 5, w, 1); x.fillRect(0, 11, w, 1);
      x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(0, 0, w, 1); x.fillRect(0, 6, w, 1);
    },
  },
  // shingles: scalloped roof tiles (overlay)
  shingles: {
    w: 16, h: 10,
    paint(x, w, h) {
      x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 0.8;
      for (const [ox, oy] of [[0, 0], [8, 5], [-8, 5], [16, 0]]) { x.beginPath(); x.arc(ox + 4, oy + 5, 4, 0, Math.PI); x.stroke(); }
      x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(1, 1, 5, 1);
    },
  },
  // fur: very soft strokes for mice portraits and big creatures
  fur: {
    w: 20, h: 20,
    paint(x, w, h, R) {
      for (let k = 0; k < 40; k++) { const px = R() * w; const py = R() * h; x.strokeStyle = R() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.10)'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 0.6, py - 1.8); x.stroke(); }
    },
  },
};
