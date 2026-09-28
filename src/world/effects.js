// Lightweight particle + floating text system (world space).
import { circ, star, heart, coinIcon, ell } from './draw.js';

const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';

export class Effects {
  constructor() { this.list = []; }

  text(x, y, text, { color = '#ffd257', size = 11, life = 1.3, vy = -26, stroke = '#5a3a22', icon = null } = {}) {
    this.list.push({ kind: 'text', x, y, text, color, size, life, max: life, vy, stroke, icon });
  }
  sparkle(x, y, n = 8, color = '#fff3b0', spread = 20) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2; const sp = 10 + Math.random() * spread;
      this.list.push({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 10, life: 0.7 + Math.random() * 0.5, max: 1.2, color, r: 1.5 + Math.random() * 2.5 });
    }
  }
  coins(x, y, n = 5) {
    for (let k = 0; k < n; k++) {
      this.list.push({ kind: 'coin', x, y, vx: (Math.random() - 0.5) * 50, vy: -40 - Math.random() * 40, g: 140, life: 0.8 + Math.random() * 0.3, max: 1.1 });
    }
  }
  hearts(x, y, n = 3) {
    for (let k = 0; k < n; k++) this.list.push({ kind: 'heart', x: x + (Math.random() - 0.5) * 12, y, vx: (Math.random() - 0.5) * 10, vy: -18 - Math.random() * 10, life: 1.2, max: 1.2, s: 3 + Math.random() * 2 });
  }
  note(x, y, glyph = '♪', color = '#6d5fa3') {
    this.list.push({ kind: 'glyph', x, y, vx: 6 + Math.random() * 6, vy: -16, life: 1.4, max: 1.4, glyph, color, size: 9 });
  }
  smoke(x, y) {
    this.list.push({ kind: 'smoke', x: x + (Math.random() - 0.5) * 6, y, vx: 6 + Math.random() * 6, vy: -14 - Math.random() * 6, life: 3.2, max: 3.2, r: 4 + Math.random() * 3 });
  }
  confetti(x, y, n = 40, w = 300) {
    const cols = ['#f28b82', '#fbbc04', '#a3d9a5', '#9ec5f0', '#d4b3f0', '#ffd24a'];
    for (let k = 0; k < n; k++) {
      this.list.push({ kind: 'confetti', x: x + (Math.random() - 0.5) * w, y: y - Math.random() * 40, vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 60, g: 70, life: 2 + Math.random() * 1.2, max: 3.2, color: cols[k % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10 });
    }
  }
  ring(x, y, color = '#ffd257') { this.list.push({ kind: 'ring', x, y, life: 0.6, max: 0.6, color }); }

  update(dt) {
    const L = this.list;
    for (let k = L.length - 1; k >= 0; k--) {
      const p = L[k];
      p.life -= dt;
      if (p.life <= 0) { L.splice(k, 1); continue; }
      if (p.kind === 'text') { p.y += p.vy * dt; p.vy *= 0.97; continue; }
      if (p.g) p.vy += p.g * dt;
      if (p.vx != null) { p.x += p.vx * dt; p.y += p.vy * dt; }
      if (p.kind === 'spark') { p.vx *= 0.94; p.vy *= 0.94; }
      if (p.kind === 'smoke') { p.r += dt * 5; }
      if (p.rot != null) p.rot += p.vr * dt;
    }
    if (L.length > 400) L.splice(0, L.length - 400);
  }

  draw(ctx, view) {
    for (const p of this.list) {
      if (p.y < view.top - 60 || p.y > view.bottom + 60) continue;
      const a = Math.min(1, p.life / (p.max * 0.4));
      ctx.globalAlpha = a;
      switch (p.kind) {
        case 'text': {
          const pop = 1 + Math.max(0, (p.max - p.life - 0.0) < 0.12 ? (0.12 - (p.max - p.life)) * 3 : 0);
          ctx.font = `700 ${p.size * pop}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 3; ctx.strokeStyle = p.stroke; ctx.lineJoin = 'round';
          const off = p.icon ? 6 : 0;
          ctx.strokeText(p.text, p.x + off, p.y); ctx.fillStyle = p.color; ctx.fillText(p.text, p.x + off, p.y);
          if (p.icon === 'coin') coinIcon(ctx, p.x - ctx.measureText(p.text).width / 2 - 2, p.y, p.size * 0.42);
          break;
        }
        case 'spark': star(ctx, p.x, p.y, p.r, p.color, 4, 0.4); break;
        case 'coin': coinIcon(ctx, p.x, p.y, 3); break;
        case 'heart': heart(ctx, p.x, p.y, p.s, '#f06b8b'); break;
        case 'glyph': ctx.font = `700 ${p.size}px ${FONT}`; ctx.fillStyle = p.color; ctx.textAlign = 'center'; ctx.fillText(p.glyph, p.x, p.y); break;
        case 'smoke': ctx.globalAlpha = a * 0.35; circ(ctx, p.x, p.y, p.r, '#e8e4ee'); break;
        case 'confetti': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-2.5, -1.2, 5, 2.4); ctx.restore(); break;
        case 'ring': { const k = 1 - p.life / p.max; ctx.strokeStyle = p.color; ctx.lineWidth = 2 * (1 - k); ctx.beginPath(); ctx.arc(p.x, p.y, 6 + k * 22, 0, Math.PI * 2); ctx.stroke(); break; }
        default: ell(ctx, p.x, p.y, 2, 2, '#fff');
      }
    }
    ctx.globalAlpha = 1;
  }
}
