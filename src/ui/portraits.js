// Character portraits rendered with the in-game art (cached as data URLs).
import { drawMouse, drawCat } from '../world/draw.js';
import { CHARACTERS } from '../data/story.js';

const cache = new Map();

export function portrait(key, size = 132) {
  const id = `${key}@${size}`;
  if (cache.has(id)) return cache.get(id);
  const ch = CHARACTERS[key];
  const c = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = c.height = size * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const g = ctx.createRadialGradient(size / 2, size * 0.42, size * 0.1, size / 2, size / 2, size * 0.62);
  g.addColorStop(0, '#fffaf0'); g.addColorStop(1, ch?.bg || '#f3dfba');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2); ctx.clip();
  if (ch?.cat) drawCat(ctx, size / 2, size * 0.52, { s: size / 62, mode: 'bust', squint: 0.35 });
  else drawMouse(ctx, size * 0.44, size * 1.02, { ...(ch?.look || {}), dir: 1, pose: 'stand', s: size / 44, t: 1.3, noShadow: true });
  ctx.restore();
  const url = c.toDataURL('image/png');
  cache.set(id, url);
  return url;
}
