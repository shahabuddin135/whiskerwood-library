// Character portraits rendered with the in-game art (cached as data URLs).
import { drawMouse, drawCat } from '../world/draw.js';
import { drawMole, drawDragonHead, drawHamster } from '../world/creatures.js';
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
  else if (ch?.mole) drawMole(ctx, size * 0.4, size * 1.0, { s: size / 40, t: 1.2, pose: 'wave', noShadow: true, shovel: false, full: true, ...(ch.look || {}) });
  else if (ch?.hamster) drawHamster(ctx, size * 0.42, size * 1.0, { s: size / 36, t: 1.2, pose: 'wave', noShadow: true, full: true, ...(ch.look || {}) });
  else if (ch?.dragon) { ctx.save(); ctx.translate(size * 0.36, size * 0.62); ctx.scale(size / 74, size / 74); drawDragonHead(ctx, 0, 0, { awake: true }); ctx.restore(); }
  else drawMouse(ctx, size * 0.44, size * 1.02, { ...(ch?.look || {}), dir: 1, pose: 'stand', s: size / 44, t: 1.3, noShadow: true, full: true });
  ctx.restore();
  const url = c.toDataURL('image/png');
  cache.set(id, url);
  return url;
}
