// While a festival runs the whole world joins in: the sky changes mood, lights go up on the
// building, every floor gets decorations (garlands, hanging lanterns, window decals, a treat
// on the desk) and festival collectibles appear to be tapped.
import { L, IX, BX0, BX1, floorTop } from './layout.js';
import { ell, circ, fillRR, star, heart, rgba, shade } from './draw.js';
import { drawBat } from './ambient.js';
import { drawGardenPiece } from './furnitureArt.js';
import { fmt } from '../core/format.js';
import { sfx } from '../audio/sfx.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const GARDEN_FOR = { christmas: 'xmastree', ramadan: 'lanternarch', eid: 'eidlights', halloween: 'pumpkins', valentine: 'heartarch', newyear: 'fireworks', summer: 'lemonade', autumn: 'haybales', bookweek: 'bookstall', anniversary: 'cake' };
export const TOKEN_ICON = { eid: 'sweet', ramadan: 'lantern', christmas: 'present', newyear: 'sparkler', halloween: 'pumpkin', valentine: 'letter', bookweek: 'bookmark', anniversary: 'cake', summer: 'shell', autumn: 'acorn' };

// Small token drawings (also used for festival HUD bits).
export function drawToken(ctx, kind, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  switch (kind) {
    case 'lantern': ctx.fillStyle = '#c98a2e'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(4, -6); ctx.lineTo(-4, -6); ctx.fill(); fillRR(ctx, -3.5, -6, 7, 8, 1.5, '#f2c14e'); star(ctx, 0, -2, 1.8, '#fff6d0', 4, 0.5); ctx.fillStyle = '#c98a2e'; ctx.beginPath(); ctx.moveTo(-3.5, 2); ctx.lineTo(3.5, 2); ctx.lineTo(0, 5); ctx.fill(); break;
    case 'present': fillRR(ctx, -5, -5, 10, 9, 1, '#d9534f'); ctx.fillStyle = '#f2c14e'; ctx.fillRect(-1, -5, 2, 9); ctx.fillRect(-5, -1.5, 10, 2); ell(ctx, -2.5, -6.5, 2.6, 1.6, '#f2c14e', -0.4); ell(ctx, 2.5, -6.5, 2.6, 1.6, '#f2c14e', 0.4); break;
    case 'pumpkin': ell(ctx, 0, 0, 6, 4.6, '#e8913a'); ctx.strokeStyle = '#c9731f'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 4.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#5b7f4d'; ctx.fillRect(-0.7, -7, 1.4, 3); break;
    case 'heart': case 'letter':
      if (kind === 'letter') { fillRR(ctx, -6, -4, 12, 8, 1, '#fff0f3'); ctx.strokeStyle = '#e0405f'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(0, 1); ctx.lineTo(6, -4); ctx.stroke(); heart(ctx, 0, 0.5, 2.6, '#e0405f'); }
      else heart(ctx, 0, 2, 6, '#e0405f');
      break;
    case 'sparkler': ctx.strokeStyle = '#8a8898'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -3); ctx.stroke(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + t * 4; ctx.strokeStyle = k % 2 ? '#ffd24a' : '#fff6d0'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(Math.cos(a) * 5, -4 + Math.sin(a) * 5); ctx.stroke(); } break;
    case 'bookmark': ctx.fillStyle = '#4f7cac'; ctx.beginPath(); ctx.moveTo(-3, -7); ctx.lineTo(3, -7); ctx.lineTo(3, 6); ctx.lineTo(0, 3.5); ctx.lineTo(-3, 6); ctx.fill(); circ(ctx, 0, -5, 1, '#f2c14e'); break;
    case 'cake': fillRR(ctx, -5, -2, 10, 6, 1.5, '#f7c9d6'); fillRR(ctx, -5, -3, 10, 2, 1, '#fff3dc'); ctx.fillStyle = '#9ec5f0'; ctx.fillRect(-0.6, -8, 1.2, 5); ell(ctx, 0, -9, 1, 1.6, '#ffcf5a'); break;
    case 'shell': ctx.fillStyle = '#f7c9b8'; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(-6, -3); ctx.quadraticCurveTo(0, -9, 6, -3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#e8a390'; ctx.lineWidth = 0.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(k * 2.4, -6); ctx.stroke(); } break;
    case 'acorn': ell(ctx, 0, 1, 3.6, 4.4, '#c98a3e'); ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(0, -2.5, 4.2, 2.4, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-0.5, -6, 1, 2); break;
    case 'sweet': circ(ctx, 0, 0, 4.4, '#f28b82'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, Math.PI * 1.4); ctx.stroke(); ctx.fillStyle = '#f28b82'; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, -3); ctx.lineTo(-8, 3); ctx.fill(); ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(8, -3); ctx.lineTo(8, 3); ctx.fill(); break;
    default: star(ctx, 0, 0, 5, '#f2c14e');
  }
  ctx.restore();
}

// Hanging decoration (from the ceiling at x, string length len).
function hangItem(ctx, kind, x, len, cols, t, k) {
  ctx.strokeStyle = 'rgba(58,42,32,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke();
  const sway = Math.sin(t * 1.3 + k) * 0.08;
  ctx.save(); ctx.translate(x, len); ctx.rotate(sway);
  const c = cols[k % cols.length];
  switch (kind) {
    case 'fanous': ctx.fillStyle = '#c98a2e'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4.5, 4); ctx.lineTo(-4.5, 4); ctx.fill(); fillRR(ctx, -4, 4, 8, 9, 1.5, '#e8b85a'); star(ctx, 0, 8.5, 2.2, '#fff4c8', 8, 0.5); ctx.fillStyle = '#c98a2e'; ctx.beginPath(); ctx.moveTo(-4, 13); ctx.lineTo(4, 13); ctx.lineTo(0, 17); ctx.fill(); break;
    case 'ornament': circ(ctx, 0, 5, 4.2, c); fillRR(ctx, -1.4, 0, 2.8, 1.8, 0.4, '#e3c26a'); ctx.fillStyle = 'rgba(255,255,255,0.55)'; circ(ctx, -1.4, 3.6, 1.1, 'rgba(255,255,255,0.6)'); break;
    case 'bat': drawBat(ctx, 0, 4, t * 10 + k, 0.55); break;
    case 'heart': heart(ctx, 0, 6, 5, c); break;
    case 'star': star(ctx, 0, 5, 4.6, c, 5, 0.45); break;
    case 'paperlantern': ell(ctx, 0, 6, 4.5, 5.5, c); ctx.fillStyle = '#3a2a20'; ctx.fillRect(-1.8, 0, 3.6, 1); ctx.fillRect(-1.8, 11, 3.6, 1); break;
    case 'leaf': ell(ctx, 0, 5, 4.4, 2.4, c, 0.6 + Math.sin(t + k)); break;
    case 'bookmark': ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-2.4, 0); ctx.lineTo(2.4, 0); ctx.lineTo(2.4, 11); ctx.lineTo(0, 9); ctx.lineTo(-2.4, 11); ctx.fill(); break;
    case 'balloon': ell(ctx, 0, 6, 4.6, 5.8, c); ell(ctx, -1.5, 4, 1.2, 2, 'rgba(255,255,255,0.5)'); break;
    default: star(ctx, 0, 5, 4, c);
  }
  ctx.restore();
}

export class FestivalFx {
  constructor(world) {
    this.w = world;
    this.t = 0;
    this.parts = [];
    this.bursts = [];
    this.tokens = [];
    this.nextToken = rand(8, 14);
    this.nextPart = 0;
    this.nextBurst = 1;
  }
  get fest() { return this.w.game.festival(); }

  update(dt, tod) {
    this.t += dt;
    const f = this.fest;
    if (!f) { this.parts.length = 0; this.tokens.length = 0; this.bursts.length = 0; return; }
    const W = this.w.Wpx; const H = this.w.Hpx;
    // sky particles
    this.nextPart -= dt;
    const kind = f.particles;
    const cap = { snow: 70, lanterns: 14, bats: 6, hearts: 16, pages: 12, confetti: 40, leaves: 20, fireflies: 24, fireworks: 0 }[kind] ?? 10;
    if (this.nextPart <= 0 && this.parts.length < cap) {
      this.nextPart = { snow: 0.08, confetti: 0.12, lanterns: 1.1, bats: 2.6, hearts: 0.7, pages: 0.9, leaves: 0.5, fireflies: 0.3 }[kind] ?? 1;
      const p = { kind, x: Math.random() * W, y: -20, vx: rand(-10, 10), vy: rand(20, 40), r: rand(0, 6), vr: rand(-2, 2), t: 0, life: 20, c: pick(f.colors), s: rand(0.7, 1.2) };
      if (kind === 'lanterns') { p.y = H + 20; p.vy = -rand(10, 18); p.vx = rand(-4, 4); p.life = 60; }
      if (kind === 'hearts') { p.y = H * rand(0.5, 1); p.vy = -rand(12, 22); }
      if (kind === 'bats') { p.y = H * rand(0.1, 0.4); p.x = Math.random() < 0.5 ? -30 : W + 30; p.vx = (p.x < 0 ? 1 : -1) * rand(40, 60); p.vy = 0; p.life = 30; }
      if (kind === 'fireflies') { p.y = H * rand(0.3, 0.95); p.vy = rand(-4, 4); p.life = rand(6, 12); }
      if (kind === 'pages') { p.vy = rand(14, 24); }
      this.parts.push(p);
    }
    for (const p of this.parts) {
      p.t += dt; p.x += (p.vx + Math.sin(p.t * 1.3 + p.r) * (p.kind === 'lanterns' ? 3 : 12)) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      if (p.kind === 'bats') p.y += Math.sin(p.t * 4) * 20 * dt;
    }
    this.parts = this.parts.filter((p) => p.t < p.life && p.y < H + 40 && p.y > -60 && p.x > -60 && p.x < W + 60);
    // fireworks at dusk and night (or softly in the day)
    if (kind === 'fireworks') {
      this.nextBurst -= dt;
      if (this.nextBurst <= 0) {
        this.nextBurst = rand(1.2, 3) / (0.4 + (tod?.dark || 0));
        const bx = W * rand(0.12, 0.88); const by = H * rand(0.1, 0.35); const c = pick(f.colors);
        this.bursts.push({ x: bx, y: by, t: 0, c, n: 18 + Math.floor(Math.random() * 10), r: rand(40, 70) });
        if (this.w.ambient && !this.w.ambient.underground && (tod?.dark || 0) > 0.25) sfx.firework?.();
      }
      for (const b of this.bursts) b.t += dt;
      this.bursts = this.bursts.filter((b) => b.t < 1.6);
    }
    // collectible tokens on the floors
    this.nextToken -= dt;
    if (this.nextToken <= 0 && this.tokens.length < 2 && this.w.game.s.questIdx >= 2) {
      this.nextToken = rand(24, 42);
      const i = this.w.chatter.visibleFloor();
      if (i != null) {
        const r = this.w.game.s.rooms[i];
        const spots = [
          () => ({ x: 44 + Math.random() * 200, y: L.laneFront - 2 }),
          () => ({ x: L.shelves[Math.floor(Math.random() * r.shelves)] + 26, y: L.shelfTop - 8 }),
          () => ({ x: L.desk.x0 + 52, y: L.desk.top - 6 }),
        ];
        this.tokens.push({ i, ...pick(spots)(), t: 0, life: 26 });
      }
    }
    for (const tk of this.tokens) tk.t += dt;
    this.tokens = this.tokens.filter((tk) => tk.t < tk.life);
  }

  /* ---------- sky (screen space, behind the building) ---------- */
  drawSky(ctx, v, tod, skyKind) {
    const f = this.fest; if (!f) return;
    const [r, g, b, a] = f.sky.tint || [0, 0, 0, 0];
    if (a && skyKind !== 'cave') { ctx.fillStyle = `rgba(${r},${g},${b},${a})`; ctx.fillRect(0, 0, v.W, v.H); }
    if (f.sky.evening && skyKind !== 'cave') {
      const e = f.sky.evening * (1 - tod.dark);
      const eg = ctx.createLinearGradient(0, 0, 0, v.H); eg.addColorStop(0, `rgba(80,60,140,${0.35 * e})`); eg.addColorStop(0.6, `rgba(240,140,90,${0.25 * e})`); eg.addColorStop(1, `rgba(255,190,120,${0.3 * e})`);
      ctx.fillStyle = eg; ctx.fillRect(0, 0, v.W, v.H);
    }
    // a big crescent and star for Ramadan & Eid
    if ((f.id === 'ramadan' || f.id === 'eid') && skyKind !== 'cave') {
      const mx = v.W * 0.8; const my = v.H * 0.12;
      const glow = ctx.createRadialGradient(mx, my, 4, mx, my, 60); glow.addColorStop(0, `rgba(255,235,180,${0.35 + tod.dark * 0.3})`); glow.addColorStop(1, 'rgba(255,235,180,0)');
      ctx.fillStyle = glow; ctx.fillRect(mx - 60, my - 60, 120, 120);
      ctx.save(); ctx.beginPath(); ctx.arc(mx, my, 20, 0, Math.PI * 2); ctx.arc(mx + 9, my - 5, 17, 0, Math.PI * 2); ctx.fillStyle = '#fff3c9'; ctx.fill('evenodd'); ctx.restore();
      star(ctx, mx + 22, my + 10, 5, '#fff3c9', 5, 0.45);
    }
    for (const b of this.bursts) {
      const k = b.t / 1.6; const rad = b.r * Math.min(1, b.t / 0.5);
      for (let j = 0; j < b.n; j++) {
        const an = (j / b.n) * Math.PI * 2;
        const x = b.x + Math.cos(an) * rad; const y = b.y + Math.sin(an) * rad + k * k * 30;
        ctx.globalAlpha = (1 - k) * (0.5 + tod.dark * 0.5);
        circ(ctx, x, y, 2 * (1 - k * 0.5), b.c); circ(ctx, x, y, 0.9, '#fff');
      }
      ctx.globalAlpha = 1;
    }
  }

  // Screen-space particles (drawn in the weather slot, behind the building).
  drawParticles(ctx, v, tod, skyKind) {
    const f = this.fest; if (!f) return;
    for (const p of this.parts) {
      switch (p.kind) {
        case 'snow': circ(ctx, p.x, p.y, 1.4 + p.s, 'rgba(255,255,255,0.9)'); break;
        case 'lanterns': {
          const glow = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 16); glow.addColorStop(0, `rgba(255,210,130,${0.45 * (0.4 + tod.dark)})`); glow.addColorStop(1, 'rgba(255,210,130,0)');
          ctx.fillStyle = glow; ctx.fillRect(p.x - 16, p.y - 16, 32, 32); circ(ctx, p.x, p.y, 2.2 * p.s, '#ffe3a0'); break;
        }
        case 'bats': drawBat(ctx, p.x, p.y, p.t * 12, 1.1 * p.s); break;
        case 'hearts': ctx.globalAlpha = 0.8; heart(ctx, p.x, p.y, 5 * p.s, p.c); ctx.globalAlpha = 1; break;
        case 'pages': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(Math.cos(p.t * 2), 1); fillRR(ctx, -5, -6, 10, 12, 1, '#fbf6ea'); ctx.fillStyle = 'rgba(80,60,40,0.4)'; for (let k = 0; k < 4; k++) ctx.fillRect(-3.5, -4 + k * 2.6, 7, 0.6); ctx.restore(); break;
        case 'confetti': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-3, -1.3, 6, 2.6); ctx.restore(); break;
        case 'leaves': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(Math.cos(p.t * 2.5), 1); ell(ctx, 0, 0, 5 * p.s, 2.6 * p.s, p.c); ctx.restore(); break;
        case 'fireflies': { const a = Math.max(0, Math.sin(p.t * 2.5)) * (0.3 + tod.dark * 0.7); const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 7); g2.addColorStop(0, `rgba(230,255,150,${a})`); g2.addColorStop(1, 'rgba(230,255,150,0)'); ctx.fillStyle = g2; ctx.fillRect(p.x - 7, p.y - 7, 14, 14); break; }
        default: break;
      }
    }
  }

  /* ---------- the building (world space) ---------- */
  drawExterior(ctx, topIndex, roofY, tod) {
    const f = this.fest; if (!f) return;
    const t = this.t; const cols = f.colors;
    // strings of lights up both sides and along the top
    const bulb = (x, y, k) => {
      const on = 0.55 + 0.45 * Math.sin(t * 3 + k * 1.3);
      const c = cols[k % cols.length];
      circ(ctx, x, y, 1.9, c);
      if (tod.dark > 0.15) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = on * tod.dark * 0.6; circ(ctx, x, y, 5, c); ctx.restore(); }
    };
    ctx.strokeStyle = 'rgba(40,30,30,0.6)'; ctx.lineWidth = 0.6;
    for (const x of [BX0 - 1, BX1 + 1]) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, roofY); ctx.stroke();
      for (let y = -8, k = 0; y > roofY + 6; y -= 14, k++) bulb(x, y, k + (x > 200 ? 3 : 0));
    }
    ctx.beginPath(); for (let x = BX0; x <= BX1; x += 4) ctx.lineTo(x, roofY + 3 + Math.abs(Math.sin(((x - BX0) / (BX1 - BX0)) * Math.PI * 4)) * 7); ctx.stroke();
    for (let x = BX0 + 8, k = 0; x < BX1; x += 16, k++) bulb(x, roofY + 3 + Math.abs(Math.sin(((x - BX0) / (BX1 - BX0)) * Math.PI * 4)) * 7 + 1.5, k);
    // two emblems beside the roof sign
    const cx = (BX0 + BX1) / 2;
    for (const dx of [-122, 122]) this.emblem(ctx, f.roof, cx + dx, roofY - 20, tod);
  }

  emblem(ctx, kind, x, y, tod) {
    const t = this.t;
    const glow = (c, r = 22) => { if (tod.dark < 0.1) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, rgba(c, 0.45 * tod.dark)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
    switch (kind) {
      case 'crescent': glow('#ffe7a0'); ctx.save(); ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.arc(x + 5, y - 3, 9.5, 0, Math.PI * 2); ctx.fillStyle = '#f2c14e'; ctx.fill('evenodd'); ctx.restore(); star(ctx, x + 11, y + 4, 3.6, '#f2c14e'); break;
      case 'star8': glow('#ffe7a0'); star(ctx, x, y, 11, '#f2c14e', 8, 0.55); star(ctx, x, y, 5, '#fff3c9', 8, 0.55); break;
      case 'star': glow('#fff3b0'); star(ctx, x, y, 11 + Math.sin(t * 2) * 0.8, '#ffd24a', 5, 0.45); break;
      case 'pumpkin': glow('#ffb060'); ell(ctx, x, y, 12, 9, '#e8913a'); ctx.fillStyle = tod.dark > 0.2 ? '#ffe070' : '#3a2a20'; ctx.beginPath(); ctx.moveTo(x - 6, y - 2); ctx.lineTo(x - 3, y - 6); ctx.lineTo(x - 1, y - 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 6, y - 2); ctx.lineTo(x + 3, y - 6); ctx.lineTo(x + 1, y - 2); ctx.fill(); ctx.fillRect(x - 6, y + 2, 12, 2); ctx.fillStyle = '#5b7f4d'; ctx.fillRect(x - 1, y - 13, 2, 5); break;
      case 'heart': glow('#ffc0cf'); heart(ctx, x, y + 6, 12 + Math.sin(t * 3) * 0.8, '#e0405f'); break;
      case 'clock': glow('#fff0b0'); circ(ctx, x, y, 11, '#f2c14e'); circ(ctx, x, y, 8.5, '#fbf6ea'); ctx.strokeStyle = '#3a3029'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 6.5); ctx.moveTo(x, y); ctx.lineTo(x - 0.5, y - 5); ctx.stroke(); break;
      case 'sun': glow('#fff3b0'); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + t * 0.3; ell(ctx, x + Math.cos(a) * 11, y + Math.sin(a) * 11, 3.4, 1.4, '#ffb030', a); } circ(ctx, x, y, 8, '#ffd24a'); break;
      case 'acorn': ell(ctx, x, y + 2, 7, 8.5, '#c98a3e'); ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(x, y - 4, 8.4, 4.6, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(x - 1, y - 12, 2, 4); for (let k = 0; k < 3; k++) ell(ctx, x - 7 + k * 7, y + 10, 3, 1.6, ['#e8913a', '#d9632d', '#f2c14e'][k], 0.3 * k); break;
      case 'book': fillRR(ctx, x - 10, y - 8, 20, 15, 1.5, '#4f7cac'); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(x - 8, y - 8, 16, 2); ctx.fillStyle = '#e9b949'; ctx.fillRect(x - 1, y - 8, 2, 15); break;
      case 'cake': fillRR(ctx, x - 10, y - 4, 20, 10, 2, '#f7c9d6'); fillRR(ctx, x - 10, y - 6, 20, 3, 1.5, '#fff3dc'); for (const d of [-5, 0, 5]) { ctx.fillStyle = '#9ec5f0'; ctx.fillRect(x + d - 0.7, y - 12, 1.4, 6); ell(ctx, x + d, y - 13.5, 1.1, 1.8, '#ffcf5a'); } break;
      default: star(ctx, x, y, 10, '#f2c14e');
    }
  }

  // Festival garden piece (only when the player hasn't placed a garden piece of their own).
  gardenPiece() { const f = this.fest; return f ? GARDEN_FOR[f.id] : null; }
  drawGarden(ctx, tod, occupied) {
    const f = this.fest; if (!f || occupied) return;
    drawGardenPiece(ctx, GARDEN_FOR[f.id], 350, 80, this.t, (c) => c, tod.dark);
  }

  /* ---------- every floor (floor-local) ---------- */
  drawRoom(ctx, i, tod, hasLamps) {
    const f = this.fest; if (!f) return;
    const t = this.t; const cols = f.colors;
    // garland swags either side of the name plaque
    for (const [x0, x1] of [[2, 100], [256, 350]]) {
      ctx.strokeStyle = shade(cols[0], -0.2); ctx.lineWidth = 1.2; ctx.beginPath();
      for (let x = x0; x <= x1; x += 3) ctx.lineTo(x, 3 + Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 7);
      ctx.stroke();
      for (let x = x0 + 5, k = 0; x < x1; x += 9, k++) { const y = 3 + Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 7; circ(ctx, x, y + 1.2, 1.7, cols[k % cols.length]); }
    }
    // hanging decorations (skip the lamp spots)
    [24, 72, hasLamps ? 118 : 92, 346].forEach((x, k) => hangItem(ctx, f.hang, x, 9 + (k % 2) * 6, cols, t, k + i));
    // window decoration
    const wn = L.window; const wx = wn.x + wn.w / 2;
    switch (f.window) {
      case 'wreath': { for (let k = 0; k < 18; k++) { const a = (k / 18) * Math.PI * 2; circ(ctx, wx + Math.cos(a) * 11, wn.y + 26 + Math.sin(a) * 11, 3, k % 2 ? '#3f9a5b' : '#2f7f4f'); } for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; circ(ctx, wx + Math.cos(a) * 11, wn.y + 26 + Math.sin(a) * 11, 1.4, '#d9534f'); } ell(ctx, wx - 3, wn.y + 38, 3.4, 2, '#d9534f', -0.4); ell(ctx, wx + 3, wn.y + 38, 3.4, 2, '#d9534f', 0.4); break; }
      case 'crescent': { ctx.save(); ctx.beginPath(); ctx.arc(wx - 6, wn.y + 20, 7, 0, Math.PI * 2); ctx.arc(wx - 3, wn.y + 18, 6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(242,193,78,0.95)'; ctx.fill('evenodd'); ctx.restore(); star(ctx, wx + 6, wn.y + 23, 2.6, 'rgba(242,193,78,0.95)'); star(ctx, wx + 12, wn.y + 14, 1.8, 'rgba(242,193,78,0.8)'); break; }
      case 'hearts': heart(ctx, wx - 10, wn.y + 30, 4, '#f28b9b'); heart(ctx, wx + 8, wn.y + 22, 5, '#e0405f'); heart(ctx, wx + 2, wn.y + 44, 3.4, '#f7c9d6'); break;
      case 'cobweb': ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.5; for (let k = 0; k < 5; k++) { const a = (k / 4) * Math.PI / 2; ctx.beginPath(); ctx.moveTo(wn.x + 2, wn.y + 20); ctx.lineTo(wn.x + 2 + Math.cos(a) * 18, wn.y + 20 + Math.sin(a) * 18); ctx.stroke(); } for (const rr2 of [6, 12]) { ctx.beginPath(); ctx.arc(wn.x + 2, wn.y + 20, rr2, 0, Math.PI / 2); ctx.stroke(); } drawBat(ctx, wx + 8, wn.y + 30, t * 8, 0.6); break;
      case 'lights': for (let k = 0; k < 9; k++) { const a = Math.PI + (k / 8) * Math.PI; const x = wx + Math.cos(a) * 27; const y = wn.y + 28 + Math.sin(a) * 24; circ(ctx, x, y, 1.8, cols[k % cols.length]); } break;
      case 'bunting': for (let k = 0; k < 6; k++) { ctx.fillStyle = cols[k % cols.length]; ctx.beginPath(); ctx.moveTo(wn.x + 2 + k * 8.4, wn.y + 8); ctx.lineTo(wn.x + 10 + k * 8.4, wn.y + 8); ctx.lineTo(wn.x + 6 + k * 8.4, wn.y + 15); ctx.fill(); } break;
      case 'garland': for (let k = 0; k < 11; k++) { const x = wn.x - 4 + k * 6; ell(ctx, x, wn.y - 1 + Math.sin((k / 10) * Math.PI) * 6, 3.4, 1.8, cols[k % 3], 0.5 * (k % 2 ? 1 : -1)); } break;
      default: break;
    }
    // a treat on the desk
    const d = L.desk; const x = d.x0 + 40; const y = d.top;
    switch (f.desk) {
      case 'candle': fillRR(ctx, x - 2, y - 9, 4, 9, 1, '#f7efdc'); ell(ctx, x, y - 11.5 + Math.sin(t * 8) * 0.3, 1.6, 2.6, '#ffcf5a'); fillRR(ctx, x - 4, y - 1.5, 8, 1.5, 0.5, '#d9534f'); break;
      case 'dates': ell(ctx, x, y - 1.5, 7, 2.2, '#e8d6b0'); for (let k = 0; k < 4; k++) ell(ctx, x - 4 + k * 2.6, y - 3.2 - (k % 2), 1.6, 1, '#7a3f2a'); break;
      case 'sweets': ell(ctx, x, y - 1.5, 7, 2.2, '#fbf6ea'); for (let k = 0; k < 5; k++) circ(ctx, x - 4 + k * 2, y - 3.6 - (k % 2) * 1.4, 1.5, cols[k % cols.length]); break;
      case 'pumpkin': ell(ctx, x, y - 4, 6, 4.4, '#e8913a'); ctx.fillStyle = '#5b7f4d'; ctx.fillRect(x - 0.7, y - 10, 1.4, 3); if (tod.dark > 0.2) { ctx.fillStyle = '#ffe070'; ctx.fillRect(x - 3, y - 4, 6, 1.2); } break;
      case 'confetti': case 'cake': drawToken(ctx, 'cake', x, y - 4, 1); break;
      case 'roses': fillRR(ctx, x - 2.5, y - 7, 5, 7, 1.5, 'rgba(200,230,245,0.7)'); for (let k = 0; k < 3; k++) { ctx.strokeStyle = '#4f8a44'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x - 3 + k * 3, y - 13); ctx.stroke(); circ(ctx, x - 3 + k * 3, y - 13.5, 1.8, '#e0405f'); } break;
      case 'lemonade': fillRR(ctx, x - 2.4, y - 8, 4.8, 8, 1, 'rgba(255,230,120,0.9)'); circ(ctx, x + 2, y - 8, 1.8, '#9ccf5a'); ctx.strokeStyle = '#e0405f'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 1, y - 8); ctx.lineTo(x + 1, y - 13); ctx.stroke(); break;
      case 'soup': ell(ctx, x, y - 2.5, 6, 3, '#c96f4a'); ell(ctx, x, y - 4, 5, 1.2, '#e8913a'); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.7; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(x - 2 + k * 3, y - 6); ctx.quadraticCurveTo(x - 4 + k * 3 + Math.sin(t * 2) * 1.5, y - 9, x - 2 + k * 3, y - 12); ctx.stroke(); } break;
      case 'books': [['#4f7cac', 11], ['#e9b949', 10]].forEach(([c, bw], k) => fillRR(ctx, x - bw / 2, y - 3 - k * 3, bw, 3, 0.6, c)); ell(ctx, x - 2, y - 7.5, 2.4, 1.4, '#e0405f', -0.4); ell(ctx, x + 2, y - 7.5, 2.4, 1.4, '#e0405f', 0.4); break;
      default: break;
    }
    // collectible tokens
    const icon = TOKEN_ICON[f.id];
    for (const tk of this.tokens) {
      if (tk.i !== i) continue;
      const bob = Math.sin(tk.t * 3) * 2; const a = Math.min(1, tk.t / 0.4, (tk.life - tk.t) / 1.5);
      ctx.globalAlpha = a;
      const g = ctx.createRadialGradient(tk.x, tk.y - 4 + bob, 1, tk.x, tk.y - 4 + bob, 16); g.addColorStop(0, `rgba(255,236,160,${0.55 + 0.2 * Math.sin(tk.t * 5)})`); g.addColorStop(1, 'rgba(255,236,160,0)');
      ctx.fillStyle = g; ctx.fillRect(tk.x - 16, tk.y - 20 + bob, 32, 32);
      drawToken(ctx, icon, tk.x, tk.y - 4 + bob, 1.25, this.t);
      ctx.globalAlpha = 1;
    }
  }

  hitRoom(i, lx, ly) {
    const f = this.fest; if (!f) return false;
    for (const tk of this.tokens) {
      if (tk.i === i && Math.hypot(lx - tk.x, ly - (tk.y - 4)) < 16) {
        this.tokens = this.tokens.filter((x) => x !== tk);
        const g = this.w.game;
        g.addTokens(1);
        const amt = g.rewardCoins(15); g.earn(amt);
        sfx.sparkle(); sfx.coin(5);
        this.w.fx.text(IX + tk.x, floorTop(i) + tk.y - 20, `+1 ${f.token.name.replace(/s$/, '')} +${fmt(amt)}`, { size: 9, color: '#fff3b0' });
        this.w.fx.sparkle(IX + tk.x, floorTop(i) + tk.y - 6, 12, f.glow);
        return true;
      }
    }
    return false;
  }
}
