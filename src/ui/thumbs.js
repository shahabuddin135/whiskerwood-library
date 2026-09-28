// Catalogue thumbnails: every furniture card shows the real in-game drawing of the item.
import { FURN } from '../data/furniture.js';
import { drawRug, drawLamp, drawPlant, drawArt, shelfMaterial, drawBookshelf, drawCenter, drawGardenPiece, drawKeepsake } from '../world/furnitureArt.js';
import { drawSeat, deskBody } from '../world/roomArt.js';
import { drawMouse } from '../world/draw.js';

const cache = new Map();
const PAL = { accent: '#d9774b', seatCol: '#c9583f', trim: '#9b6a43', wall: '#f3dfb8', wall2: '#ead0a0' };
const BOOKS = ['#c0504d', '#e9b949', '#6a9f58', '#4f7cac', '#9b6fb0', '#e07b39'];

export function thumb(id, w = 84, h = 64) {
  const key = `${id}@${w}x${h}`;
  if (cache.has(key)) return cache.get(key);
  const f = FURN[id];
  const c = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = w * dpr; c.height = h * dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const cx = w / 2; const base = h - 6;
  if (f) switch (f.slot) {
    case 'rug': ctx.save(); ctx.translate(cx, h / 2 + 4); ctx.scale(1.2, 1.9); drawRug(ctx, id, 0, 0, 28, PAL); ctx.restore(); break;
    case 'lamp': ctx.save(); ctx.translate(0, 4); ctx.scale(1.4, 1.4); drawLamp(ctx, id, cx / 1.4, PAL, 1); ctx.restore(); break;
    case 'plant': ctx.save(); ctx.translate(cx, base); ctx.scale(2, 2); drawPlant(ctx, id, 0, 0); ctx.restore(); break;
    case 'art': ctx.save(); ctx.translate(cx - 32, 6); ctx.scale(1.5, 1.5); drawArt(ctx, id, { x: 0, y: 0, w: 42, h: 32 }, PAL); ctx.restore(); break;
    case 'shelf': ctx.save(); ctx.translate(cx - 26 * 0.55 - 2, 4); ctx.scale(0.55, 0.55); drawBookshelf(ctx, shelfMaterial(id, null, PAL), 0, 6, 52, 100, BOOKS, 7, 0.95); ctx.restore(); break;
    case 'desk': ctx.save(); ctx.translate(cx - 35 * 0.9, 4); ctx.scale(0.9, 0.9); deskBody(ctx, id, { x0: 0, x1: 70, top: 20, base: 52 }, { shell: { kind: 'timber' } }, null); ctx.restore(); break;
    case 'seat': ctx.save(); ctx.translate(cx, base); ctx.scale(1.6, 1.6); drawSeat(ctx, id, 0, 0, PAL.seatCol, 1); ctx.restore(); break;
    case 'center': { ctx.save(); ctx.translate(cx, base); const s = Math.min(1.2, 50 / 70); ctx.scale(s, s); drawCenter(ctx, id, 0, 0, PAL, 0.6); ctx.restore(); break; }
    case 'hat': drawMouse(ctx, cx - 4, base + 16, { fur: '#b8aca1', belly: '#efe6dc', hat: id, hatCol: '#6d5fa3', glasses: true, s: 2.1, dir: 1, t: 1, noShadow: true }); break;
    case 'garden': ctx.save(); ctx.translate(cx, base); ctx.scale(0.95, 0.95); drawGardenPiece(ctx, id, 0, 0, 0.5); ctx.restore(); break;
    case 'curio': drawKeepsake(ctx, id, cx, base - 2, 3.4); break;
    default: break;
  }
  const url = c.toDataURL('image/png');
  cache.set(key, url);
  return url;
}
