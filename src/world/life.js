// Little moments that happen on their own: a book slips off a shelf, somebody sneezes in the
// dusty stacks, a reader dozes off, a bird lands on the windowsill. Nothing to tap, just life.
import { L, IX, floorTop } from './layout.js';
import { ell, circ, fillRR, star, drawPigeon } from './draw.js';
import { drawBat } from './ambient.js';
import { MOMENTS, TAP_LINES } from '../data/dialogue.js';
import { sfx } from '../audio/sfx.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export class Life {
  constructor(world) {
    this.w = world;
    this.next = rand(7, 12);
    this.books = []; // falling books
    this.puffs = []; // dust puffs
    this.sill = null; // window visitor { i, kind, t, life }
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    this.next -= dt;
    if (this.next <= 0) {
      this.next = rand(9, 17);
      const i = this.w.chatter.visibleFloor();
      if (i != null) this.trigger(pick(['bookFall', 'bookFall', 'sneeze', 'sleepy', 'window', 'window', 'curio']), i);
    }
    for (const b of this.books) {
      b.vy += 380 * dt; b.y += b.vy * dt; b.x += b.vx * dt; b.rot += b.vr * dt;
      if (!b.landed && b.y >= L.laneBack + 1) { b.landed = true; b.y = L.laneBack + 1; b.vy = 0; b.vx = 0; b.vr = 0; b.rot = Math.round(b.rot / Math.PI) * Math.PI; this.landed(b); }
      if (b.landed) b.life -= dt;
    }
    this.books = this.books.filter((b) => b.life > 0);
    for (const p of this.puffs) { p.life -= dt; p.r += dt * 8; p.y -= dt * 6; }
    this.puffs = this.puffs.filter((p) => p.life > 0);
    if (this.sill) { this.sill.t += dt; if (this.sill.t > this.sill.life) this.sill = null; }
  }

  trigger(kind, i) {
    const w = this.w; const sim = w.sims[i]; const r = w.game.s.rooms[i];
    const ch = w.chatter;
    switch (kind) {
      case 'bookFall': {
        const k = Math.floor(Math.random() * r.shelves);
        const row = Math.floor(Math.random() * 4);
        const rowH = (L.shelfBot - L.shelfTop - 10) / 4;
        const x = L.shelves[k] + 10 + Math.random() * 32;
        const def = w.roomDef(i);
        this.books.push({ i, x, y: L.shelfTop + 6 + row * rowH + rowH - 10, vx: (Math.random() - 0.5) * 30, vy: -40, rot: 0, vr: (Math.random() - 0.5) * 12, col: pick(def.books), life: 3.5, landed: false });
        break;
      }
      case 'sneeze': {
        const v = ch.readers(i, 1)[0];
        if (!v) return;
        ch.say(i, v, pick(MOMENTS.sneeze), 1.8);
        for (let k = 0; k < 6; k++) this.puffs.push({ i, x: v.x + 8 + Math.random() * 10, y: v.y - 24 + Math.random() * 8, r: 2 + Math.random() * 2, life: 1.1 });
        const other = ch.readers(i, 1, [v])[0];
        if (other) setTimeout(() => ch.say(i, other, pick(MOMENTS.sneezeReply), 2), 900);
        if (w.isVisible(i)) sfx.squeak();
        break;
      }
      case 'sleepy': {
        const v = sim.visitors.find((x) => x.state === 'read' && !x.special);
        if (!v) return;
        v.dozing = 7;
        v.timer = Math.max(v.timer, 7.5);
        ch.say(i, v, pick(MOMENTS.sleepy), 2.2);
        const other = ch.readers(i, 1, [v])[0];
        if (other) setTimeout(() => ch.say(i, other, pick(MOMENTS.sleepyReply), 2.6), 2300);
        break;
      }
      case 'window': {
        if (this.sill) return;
        const loc = w.game.loc().id;
        const kinds = { meadow: 'robin', cove: 'gull', caverns: 'bat', clockwork: 'clockbird', castle: 'owl', sky: 'plane' };
        this.sill = { i, kind: kinds[loc] || 'robin', t: 0, life: 7 };
        const v = ch.readers(i, 1)[0];
        if (v) setTimeout(() => ch.say(i, v, pick(MOMENTS.window[loc] || MOMENTS.window.meadow), 2.6), 900);
        break;
      }
      case 'curio': {
        if (!r.decor[4]) return;
        const c = w.centerKind(i);
        const lines = TAP_LINES[c];
        const v = ch.readers(i, 1)[0];
        if (v && lines) ch.say(i, v, pick(lines), 2.6);
        w.fx.sparkle(IX + L.center, floorTop(i) + L.laneBack - 30, 6, '#fff3b0');
        break;
      }
      default: break;
    }
  }

  landed(b) {
    const w = this.w; const sim = w.sims[b.i];
    if (w.isVisible(b.i)) sfx.drop();
    let best = null; let bd = 36;
    for (const v of sim.visitors) { if (v.special || v.alpha < 0.6) continue; const d = Math.abs(v.x - b.x); if (d < bd) { bd = d; best = v; } }
    if (best) w.chatter.say(b.i, best, pick(MOMENTS.bookFall), 2.2);
    else { const v = w.chatter.readers(b.i, 1)[0]; if (v) w.chatter.say(b.i, v, 'Did that book just… jump?', 2.2); }
  }

  // Floor-local drawing (called inside the floor's transform).
  drawRoom(ctx, i) {
    for (const b of this.books) {
      if (b.i !== i) continue;
      ctx.save(); ctx.globalAlpha = Math.min(1, b.life / 0.5); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
      if (b.landed) fillRR(ctx, -6, -3, 12, 3, 0.6, b.col); else fillRR(ctx, -2, -8, 4, 9, 0.6, b.col);
      ctx.restore();
    }
    for (const p of this.puffs) if (p.i === i) { ctx.globalAlpha = Math.max(0, p.life) * 0.6; circ(ctx, p.x, p.y, p.r, '#e8e0d0'); ctx.globalAlpha = 1; }
    const s = this.sill;
    if (s && s.i === i) {
      const wn = L.window; const x = wn.x + wn.w / 2 + 6; const sillY = wn.y + wn.h + 1;
      const k = Math.min(1, s.t / 0.6); const out = Math.max(0, (s.t - (s.life - 0.6)) / 0.6);
      const dx = (1 - k) * 50 + out * 60; const dy = -(1 - k) * 30 - out * 30;
      const hop = Math.abs(Math.sin(s.t * 3)) * (s.t > 1 && s.t < s.life - 1 ? 1.5 : 0);
      ctx.save(); ctx.translate(x + dx, sillY + dy - hop);
      switch (s.kind) {
        case 'gull': ell(ctx, 0, -5, 6, 4, '#fbfbff'); circ(ctx, 5, -9, 3, '#fbfbff'); ctx.fillStyle = '#f2c14e'; ctx.fillRect(7.5, -9.5, 3.4, 1.4); circ(ctx, 6, -10, 0.6, '#1d1b24'); ell(ctx, -2, -6, 4, 2, '#b9c3cf'); ctx.fillStyle = '#f2a13e'; ctx.fillRect(-1, -1.5, 1, 2); ctx.fillRect(2, -1.5, 1, 2); break;
        case 'bat': ctx.scale(1, -1); drawBat(ctx, 0, 6, this.t * 2, 0.8); break;
        case 'owl': ell(ctx, 0, -7, 5.5, 7, '#8a6a4a'); ell(ctx, 0, -5, 3.6, 4.6, '#d9c3a0'); circ(ctx, -2, -10, 2.2, '#fbf6ea'); circ(ctx, 2, -10, 2.2, '#fbf6ea'); circ(ctx, -2, -10, 1, '#1d1b24'); circ(ctx, 2, -10, 1, '#1d1b24'); ctx.fillStyle = '#e8a33a'; ctx.beginPath(); ctx.moveTo(-0.8, -8); ctx.lineTo(0.8, -8); ctx.lineTo(0, -6.5); ctx.fill(); break;
        case 'clockbird': ell(ctx, 0, -4, 5, 3.6, '#c99a4d'); circ(ctx, 4, -7, 2.6, '#c99a4d'); ctx.fillStyle = '#6b4520'; ctx.fillRect(6, -7.5, 3, 1.2); circ(ctx, 4.5, -7.6, 0.7, '#1d1b24'); ctx.save(); ctx.translate(-3, -9); ctx.rotate(this.t * 3); ctx.fillStyle = '#9c6a34'; ctx.fillRect(-0.6, -3, 1.2, 6); ctx.fillRect(-3, -0.6, 6, 1.2); ctx.restore(); break;
        case 'plane': ctx.fillStyle = '#fbf6ea'; ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(-8, -10); ctx.lineTo(-2, -6); ctx.lineTo(-8, -1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#c9b89a'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(-2, -6); ctx.stroke(); break;
        default: ell(ctx, 0, -4, 4.6, 3.6, '#8a6a4a'); ell(ctx, 1.6, -3, 2.6, 2.4, '#e0605a'); circ(ctx, 3.5, -7, 2.4, '#8a6a4a'); ctx.fillStyle = '#e8a33a'; ctx.fillRect(5.5, -7.3, 2.2, 1); circ(ctx, 4, -7.6, 0.6, '#1d1b24'); ctx.fillStyle = '#6b4a34'; ctx.fillRect(-7, -5, 3, 1.6);
      }
      ctx.restore();
    }
  }
}
