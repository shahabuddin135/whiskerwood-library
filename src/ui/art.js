// Little illustrated vignettes for dialogs, drawn with the same code as the world
// (so pop-ups look like pages of the same storybook, not emoji).
import { drawMouse, drawCat, drawPigeon, drawCheese, coinIcon, ell, circ, fillRR, star, heart } from '../world/draw.js';
import { CHARACTERS } from '../data/story.js';
import { drawGardenPiece, drawCenter, drawKeepsake } from '../world/furnitureArt.js';
import { drawToken } from '../world/festivalFx.js';

const cache = new Map();
const W = 240; const H = 120;

function canvas() {
  const c = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = W * dpr; c.height = H * dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  return [c, ctx];
}
function ground(ctx, col = 'rgba(160,120,70,0.18)') { ell(ctx, W / 2, H - 12, 92, 10, col); }
function books(ctx, x, y, n = 4) { const cols = ['#c0504d', '#4f7cac', '#e9b949', '#6a9f58', '#9b6fb0']; for (let k = 0; k < n; k++) fillRR(ctx, x - 16 + (k % 2) * 3, y - (k + 1) * 6, 32 - (k % 3) * 3, 5.5, 1.2, cols[k % cols.length]); }
const M = (who, extra = {}) => ({ ...(CHARACTERS[who]?.look || {}), ...extra });

export function sceneArt(kind, opt = {}) {
  const key = kind + JSON.stringify(opt);
  if (cache.has(key)) return cache.get(key);
  const [c, ctx] = canvas();
  const cx = W / 2; const base = H - 14;
  switch (kind) {
    case 'letter': ground(ctx); drawMouse(ctx, cx - 30, base, { ...M('mimsy'), s: 2.4, pose: 'stand', dir: 1, t: 1 });
      fillRR(ctx, cx + 6, base - 58, 46, 32, 3, '#fbf6ea'); ctx.strokeStyle = '#c9b89a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx + 6, base - 58); ctx.lineTo(cx + 29, base - 40); ctx.lineTo(cx + 52, base - 58); ctx.stroke();
      circ(ctx, cx + 29, base - 40, 5, '#c0504d'); heart(ctx, cx + 29, base - 39, 3, '#fbe3e3'); break;
    case 'sleep': ground(ctx); books(ctx, cx, base, 5); drawMouse(ctx, cx - 6, base - 30, { fur: '#c9b29b', belly: '#f4e9dc', s: 2, pose: 'sit', sleep: true, dir: 1, hat: 'bobble', hatCol: '#4f7cac', noShadow: true });
      ctx.save(); ctx.beginPath(); ctx.arc(cx + 70, 26, 14, 0, Math.PI * 2); ctx.arc(cx + 77, 21, 12, 0, Math.PI * 2); ctx.fillStyle = '#f4e9b0'; ctx.fill('evenodd'); ctx.restore();
      ctx.fillStyle = '#7a8fa6'; ctx.font = '700 16px Fredoka, sans-serif'; ctx.fillText('z', cx + 20, base - 70); ctx.font = '700 12px Fredoka, sans-serif'; ctx.fillText('z', cx + 32, base - 82); break;
    case 'build': ground(ctx); drawMouse(ctx, cx - 20, base, { fur: '#a98467', belly: '#ecd9c6', hat: 'hardhat', vest: '#f28c28', s: 2.2, pose: 'stand', dir: 1, t: 1 });
      fillRR(ctx, cx + 10, base - 70, 58, 42, 3, '#3d6fa8'); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.strokeRect(cx + 18, base - 62, 42, 26); ctx.beginPath(); ctx.moveTo(cx + 18, base - 49); ctx.lineTo(cx + 60, base - 49); ctx.moveTo(cx + 39, base - 62); ctx.lineTo(cx + 39, base - 36); ctx.stroke(); break;
    case 'hammer': ground(ctx); drawMouse(ctx, cx - 30, base, { fur: '#a98467', belly: '#ecd9c6', hat: 'hardhat', vest: '#f28c28', s: 2, pose: 'hammer', dir: 1, t: 0.4 });
      drawMouse(ctx, cx + 36, base, { fur: '#8f7f73', belly: '#d9cdc2', hat: 'hardhat', vest: '#f28c28', s: 2, pose: 'hammer', dir: -1, t: 1.1 }); fillRR(ctx, cx - 14, base - 10, 30, 10, 2, '#b98a5a'); break;
    case 'grand': ground(ctx); for (let k = 0; k < 24; k++) { ctx.save(); ctx.translate(20 + Math.random() * 200, 8 + Math.random() * 70); ctx.rotate(Math.random() * 6); ctx.fillStyle = ['#f28b82', '#fbbc04', '#a3d9a5', '#9ec5f0', '#d4b3f0'][k % 5]; ctx.fillRect(-3, -1.2, 6, 2.4); ctx.restore(); }
      ctx.strokeStyle = '#e0404f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, base - 40); ctx.quadraticCurveTo(cx, base - 30, W - 20, base - 40); ctx.stroke(); ell(ctx, cx, base - 34, 8, 5, '#e0404f');
      drawMouse(ctx, cx - 40, base, { ...M('pip'), s: 2, pose: 'wave', dir: 1, t: 1 }); drawMouse(ctx, cx + 40, base, { ...M('mayor'), s: 2, pose: 'happy', dir: -1, t: 1 }); break;
    case 'celeb': ground(ctx); for (let k = 0; k < 6; k++) star(ctx, 30 + k * 36, 20 + (k % 2) * 16, 6, '#ffe28a');
      drawMouse(ctx, cx, base, { fur: '#d6b98c', belly: '#f7ead3', hat: 'star', scarf: '#9b6fb0', shades: true, s: 2.4, pose: 'wave', dir: 1, t: 1 });
      fillRR(ctx, cx + 52, base - 50, 26, 18, 3, '#3a3440'); circ(ctx, cx + 65, base - 41, 6, '#9ec5f0'); star(ctx, cx + 76, base - 56, 8, '#fff'); break;
    case 'royal': ground(ctx); drawMouse(ctx, cx - 44, base, { fur: '#9aa0a6', belly: '#e3e6e8', hat: 'cap', hatCol: '#b33f40', vest: '#b33f40', s: 1.9, dir: 1, t: 1 });
      drawMouse(ctx, cx + 44, base, { fur: '#9aa0a6', belly: '#e3e6e8', hat: 'cap', hatCol: '#b33f40', vest: '#b33f40', s: 1.9, dir: -1, t: 2 });
      drawMouse(ctx, cx, base, { ...M('queen'), s: 2.4, pose: 'wave', dir: 1, t: 1 }); break;
    case 'parcel': drawPigeon(ctx, cx, 46, 0.3, 2.6, true); break;
    case 'critic': ground(ctx); drawMouse(ctx, cx - 10, base, { ...M('fromage'), s: 2.4, pose: 'stand', dir: 1, t: 1 }); fillRR(ctx, cx + 20, base - 60, 30, 38, 2, '#fbf6ea'); ctx.fillStyle = '#6d6d78'; for (let k = 0; k < 5; k++) ctx.fillRect(cx + 25, base - 52 + k * 6, 20, 1.2); for (let k = 0; k < 5; k++) star(ctx, cx - 60 + k * 14, 20, 5, k < 4 ? '#f2b72b' : '#e8dcc0'); break;
    case 'story': ground(ctx); books(ctx, cx, base, 2); drawMouse(ctx, cx, base - 12, { ...M('pip'), s: 2, pose: 'read', book: '#c0504d', dir: 1, t: 1 });
      drawMouse(ctx, cx - 64, base, { fur: '#e9e2d8', belly: '#fffaf3', s: 1.5, pose: 'sit', dir: 1, hat: 'bow', hatCol: '#f28b82' }); drawMouse(ctx, cx + 60, base, { fur: '#a98467', belly: '#ecd9c6', s: 1.5, pose: 'sit', dir: -1, hat: 'cap', hatCol: '#4f7cac' }); drawMouse(ctx, cx - 36, base, { fur: '#8f7f73', belly: '#d9cdc2', s: 1.4, pose: 'sit', dir: 1 }); break;
    case 'rep': for (let k = 0; k < 2; k++) { ctx.fillStyle = k ? '#4f7cac' : '#c0504d'; ctx.beginPath(); ctx.moveTo(cx - 12 + k * 12, 60); ctx.lineTo(cx - 20 + k * 28, 110); ctx.lineTo(cx - 8 + k * 16, 100); ctx.lineTo(cx + k * 4, 110); ctx.lineTo(cx - 4 + k * 12, 60); ctx.fill(); }
      circ(ctx, cx, 50, 32, '#e9a623'); circ(ctx, cx, 50, 26, '#ffd257'); star(ctx, cx, 50, 17, '#fff3b0'); break;
    case 'move': ground(ctx); fillRR(ctx, cx - 70, base - 58, 86, 48, 4, '#f2c14e'); fillRR(ctx, cx + 16, base - 44, 36, 34, 4, '#e0605a'); fillRR(ctx, cx + 22, base - 40, 18, 12, 2, '#dff1fb');
      circ(ctx, cx - 44, base - 8, 10, '#3a3440'); circ(ctx, cx + 30, base - 8, 10, '#3a3440'); circ(ctx, cx - 44, base - 8, 4, '#9aa0a6'); circ(ctx, cx + 30, base - 8, 4, '#9aa0a6');
      books(ctx, cx - 40, base - 58, 4); drawGardenPiece(ctx, 'gnome', cx - 4, base - 58, 0); drawMouse(ctx, cx + 76, base, { ...M('pip'), s: 1.9, pose: 'wave', dir: -1, t: 1 }); break;
    case 'crate': { const g = ctx.createRadialGradient(cx, 60, 6, cx, 60, 70); g.addColorStop(0, 'rgba(255,225,120,0.6)'); g.addColorStop(1, 'rgba(255,225,120,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ground(ctx);
      fillRR(ctx, cx - 34, base - 58, 68, 58, 4, '#b98a5a'); ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 2; ctx.strokeRect(cx - 34, base - 58, 68, 58); ctx.beginPath(); ctx.moveTo(cx - 34, base - 58); ctx.lineTo(cx + 34, base); ctx.moveTo(cx + 34, base - 58); ctx.lineTo(cx - 34, base); ctx.stroke();
      ctx.fillStyle = '#e0404f'; ctx.fillRect(cx - 5, base - 58, 10, 58); ctx.fillRect(cx - 34, base - 34, 68, 9); ell(ctx, cx - 12, base - 64, 12, 7, '#e0404f', -0.4); ell(ctx, cx + 12, base - 64, 12, 7, '#e0404f', 0.4); circ(ctx, cx, base - 62, 5, '#c0304a'); break; }
    case 'chest': ground(ctx); fillRR(ctx, cx - 36, base - 36, 72, 36, 4, '#8a5a3a'); for (let k = 0; k < 14; k++) coinIcon(ctx, cx - 28 + (k % 7) * 9, base - 38 - Math.floor(k / 7) * 7, 5); ctx.fillStyle = '#6b4128'; ctx.save(); ctx.translate(cx - 36, base - 36); ctx.rotate(-0.4); fillRR(ctx, 0, -26, 72, 26, 8, '#6b4128'); ctx.restore(); drawCheese(ctx, cx + 48, base - 8, 2); break;
    case 'cat': drawCat(ctx, cx, 66, { s: 2.3, t: 1, mode: 'peek', squint: 0.3 }); break;
    case 'thief': ground(ctx); drawMouse(ctx, cx, base, { fur: '#6f6560', belly: '#c9beb6', hat: 'bandit', pose: 'walk', sack: true, s: 2.4, t: 1, dir: -1 }); break;
    case 'spoiler': ground(ctx); drawMouse(ctx, cx - 14, base, { ...M('squeaky'), megaphone: true, pose: 'stand', s: 2.4, t: 1, dir: 1 }); for (let k = 0; k < 3; k++) { ctx.strokeStyle = '#e0405f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx + 30, base - 50, 12 + k * 10, -0.6, 0.6); ctx.stroke(); } break;
    case 'tokens': ground(ctx); for (let k = 0; k < 5; k++) drawToken(ctx, opt.icon, cx - 60 + k * 30, base - 20 - (k % 2) * 16, 2.6); break;
    case 'garden': ground(ctx); drawGardenPiece(ctx, opt.id, cx, base, 0.5); break;
    case 'center': ground(ctx); ctx.save(); ctx.translate(cx, base); ctx.scale(1.6, 1.6); drawCenter(ctx, opt.id, 0, 0, { accent: '#d9774b' }, 0.5); ctx.restore(); break;
    case 'keepsake': { const g = ctx.createRadialGradient(cx, 60, 6, cx, 60, 60); g.addColorStop(0, 'rgba(255,230,150,0.55)'); g.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ground(ctx); drawKeepsake(ctx, opt.id, cx, base - 4, 5); break; }
    default: ground(ctx); drawMouse(ctx, cx, base, { ...M('pip'), s: 2.4, pose: 'wave', dir: 1, t: 1 });
  }
  const url = c.toDataURL('image/png');
  cache.set(key, url);
  return url;
}

export const artImg = (kind, opt) => `<img class="art-img" alt="" src="${sceneArt(kind, opt)}" />`;
