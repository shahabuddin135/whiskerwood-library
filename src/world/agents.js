// Visitor mice simulation for one library floor.
import { L, IX, floorTop } from './layout.js';
import { SEAT_H } from './roomArt.js';
import { drawMouse, ell, circ, fillRR, star } from './draw.js';
import { WARDROBE } from '../data/visitors.js';
import { readTime, spawnInterval } from '../core/economy.js';
import { glow } from './glow.js';
import { art } from './sprites.js';

const WALK = 46;
let seedCounter = 1;

function randomLook() {
  const w = WARDROBE[Math.floor(Math.random() * WARDROBE.length)];
  return { ...w, book: undefined, s: 0.88 + Math.random() * 0.12 };
}
// Each regular always carries the same colour of book, whichever floor they visit (so the
// pictures of them reading are shared by every floor; see sprites.js).
const BOOKS_IN_HAND = ['#b5523b', '#3d7a5a', '#4f7cac', '#8e3b46', '#5b3f8c', '#c9a227'];
const bookFor = (v) => BOOKS_IN_HAND[(v.look.idx ?? v.seed) % BOOKS_IN_HAND.length];

export class Visitor {
  constructor(sim, seat, look = randomLook(), special = null) {
    this.sim = sim;
    this.x = L.holeX; this.y = L.laneFront;
    this.dir = 1;
    this.seat = seat;
    this.look = look;
    this.special = special; // { type, name, dur }
    this.state = 'enter';
    this.timer = 0.4;
    this.t = Math.random() * 10;
    this.alpha = 0;
    this.book = null;
    this.target = 0;
    this.seed = seedCounter++ % 97;
    this.emoteT = 2 + Math.random() * 4;
    this.petted = false;
    this.greeted = false;
  }

  moveTo(x, dt, speed) {
    const d = x - this.x;
    this.dir = d >= 0 ? 1 : -1;
    const step = speed * dt;
    if (Math.abs(d) <= step) { this.x = x; return true; }
    this.x += Math.sign(d) * step;
    return false;
  }

  get pose() {
    switch (this.state) {
      case 'toShelf': case 'toSeat': case 'toDesk': case 'exit': case 'toStage': return 'walk';
      case 'browse': return 'reach';
      case 'read': return 'read';
      case 'pay': return 'pay';
      case 'pose':
        if (this.special?.type === 'author') return 'sit';
        if (this.special?.type === 'critic') return 'stand';
        return Math.sin(this.t * 2) > 0.6 ? 'wave' : 'happy';
      case 'request': return Math.sin(this.t * 3) > 0.3 ? 'stand' : 'reach';
      default: return 'stand';
    }
  }
}

export class RoomSim {
  constructor(i, hooks) {
    this.i = i;
    this.hooks = hooks; // { onPay(sim, v), onRead(sim, v), onSpecialLeave(sim, v) }
    this.visitors = [];
    this.seatTaken = new Array(6).fill(false);
    this.spawnT = 0.5 + Math.random() * 1.5;
    this.special = null;
    this.guards = [];
    this.librarianT = 0;
    this.stampT = 0;
    this.fanBoost = 1;
    this.eventBoost = 1; // e.g. the Book Fair brings more visitors
    this.fear = false; // a cat at the window: nobody new dares to come in
    this.requests = 0;
  }

  fulfilRequest(v) {
    if (v.state !== 'request') return false;
    v.req = null; this.requests = Math.max(0, this.requests - 1);
    v.state = 'toSeat'; v.target = L.seats[v.seat];
    return true;
  }
  hitRequest(lx, ly) {
    for (const v of this.visitors) {
      if (v.state !== 'request') continue;
      if (Math.abs(lx - v.x) < 16 && ly > v.y - 70 && ly < v.y + 6) return v;
    }
    return null;
  }

  // Seat a few readers straight away so a floor never looks empty on load.
  prefill(def, r) {
    for (let k = 0; k < r.seats; k++) {
      if (this.seatTaken[k] || (k > 0 && Math.random() < 0.35)) continue;
      const v = new Visitor(this, k);
      this.seatTaken[k] = true;
      v.state = 'read'; v.alpha = 1; v.x = L.seats[k]; v.dir = L.seatFacing[k];
      v.y = L.laneBack - (SEAT_H[def.seat] || 15);
      v.book = bookFor(v);
      v.timer = k === 0 ? 0.8 : 1 + Math.random() * readTime(r);
      this.visitors.push(v);
    }
  }

  spawnSpecial(type, name, look, dur) {
    const v = new Visitor(this, -1, { ...look, s: 1.05 }, { type, name, dur });
    this.special = v;
    this.visitors.push(v);
    if (type === 'royal') {
      this.guards = [-1, 1].map((side) => {
        const g = new Visitor(this, -1, { fur: '#9aa0a6', belly: '#e3e6e8', hat: 'cap', hatCol: '#b33f40', vest: '#b33f40', s: 0.92 }, { type: 'guard', side });
        this.visitors.push(g);
        return g;
      });
    }
    this.fanBoost = type === 'author' ? 2.5 : type === 'celeb' ? 1.6 : type === 'critic' ? 1 : 1.3;
    return v;
  }

  update(dt, game, def, r) {
    this.librarianT += dt;
    if (this.stampT > 0) this.stampT -= dt;
    // Spawn regular visitors when a seat is free.
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const free = [];
      for (let k = 0; k < r.seats; k++) if (!this.seatTaken[k]) free.push(k);
      const regulars = this.visitors.filter((v) => !v.special).length;
      if (free.length && regulars < r.seats + 3 && !this.fear) {
        const seat = free[Math.floor(Math.random() * free.length)];
        this.seatTaken[seat] = true;
        this.visitors.push(new Visitor(this, seat));
      }
      this.spawnT = (spawnInterval(r) * (0.6 + Math.random() * 0.8)) / (this.fanBoost * this.eventBoost);
    }
    const speed = WALK * (1 + 0.02 * (r.staff - 1));
    const shelves = r.shelves;

    for (let k = this.visitors.length - 1; k >= 0; k--) {
      const v = this.visitors[k];
      v.t += dt;
      if (v.special?.type === 'guard') { this.updateGuard(v, dt, speed); if (v.state === 'gone') this.visitors.splice(k, 1); continue; }
      switch (v.state) {
        case 'enter':
          v.alpha = Math.min(1, v.alpha + dt / 0.4); v.timer -= dt;
          if (v.timer <= 0) {
            if (v.special) { v.state = 'toStage'; v.target = L.stageX + (v.special.type === 'author' ? -6 : 0); }
            else { v.state = 'toShelf'; const s = Math.floor(Math.random() * shelves); v.target = L.shelves[s] + 12 + Math.random() * 28; }
          }
          break;
        case 'toShelf':
          if (v.moveTo(v.target, dt, speed)) { v.state = 'browse'; v.timer = 0.9 + Math.random() * 0.6; v.dir = Math.random() < 0.5 ? 1 : -1; v.book = bookFor(v); }
          break;
        case 'browse':
          v.timer -= dt;
          if (v.timer <= 0) {
            // Sometimes a reader can't find what they want and asks for help.
            if (!this.fear && this.requests === 0 && Math.random() < 0.14) {
              v.state = 'request'; v.req = { t: 11, color: def.books[Math.floor(Math.random() * def.books.length)] }; v.book = null;
              this.requests++;
              this.hooks.onRequest?.(this, v);
            } else { v.state = 'toSeat'; v.target = L.seats[v.seat]; }
          }
          break;
        case 'request':
          v.req.t -= dt;
          if (v.req.t <= 0) {
            this.hooks.onRequestFail?.(this, v);
            v.req = null; this.requests = Math.max(0, this.requests - 1);
            v.book = bookFor(v); v.state = 'toSeat'; v.target = L.seats[v.seat];
          }
          break;
        case 'toSeat':
          if (v.moveTo(v.target, dt, speed)) {
            v.state = 'read'; v.dir = L.seatFacing[v.seat];
            v.y = L.laneBack - (SEAT_H[def.seat] || 15);
            v.timer = readTime(r) * (0.75 + Math.random() * 0.5);
            this.hooks.onRead?.(this, v);
          }
          break;
        case 'read':
          v.timer -= dt; v.emoteT -= dt;
          if (v.emoteT <= 0) { v.emoteT = 3 + Math.random() * 5; this.hooks.onEmote?.(this, v); }
          if (v.timer <= 0) {
            this.seatTaken[v.seat] = false; v.seat = -1;
            v.y = L.laneFront; v.state = 'toDesk'; v.target = L.payX + (Math.random() - 0.5) * 8;
          }
          break;
        case 'toDesk':
          if (v.moveTo(v.target, dt, speed)) { v.state = 'pay'; v.timer = 0.6; v.dir = 1; this.stampT = 0.35; this.hooks.onPay?.(this, v); }
          break;
        case 'pay':
          v.timer -= dt;
          if (v.timer <= 0) { v.state = 'exit'; v.book = null; }
          break;
        case 'toStage':
          if (v.moveTo(v.target, dt, speed * 0.85)) { v.state = 'pose'; v.timer = v.special.dur; v.dir = 1; this.hooks.onSpecialArrive?.(this, v); }
          break;
        case 'pose':
          v.timer -= dt;
          if (v.greeted && v.timer > 2.5) v.timer = 2.5; // wave goodbye soon after being greeted
          if (v.timer <= 0) { v.state = 'exit'; this.hooks.onSpecialLeave?.(this, v); }
          break;
        case 'exit':
          if (v.moveTo(L.holeX, dt, speed * (v.special ? 0.85 : 1))) { v.state = 'leave'; v.timer = 0.35; }
          break;
        case 'leave':
          v.alpha -= dt / 0.35;
          if (v.alpha <= 0) {
            v.state = 'gone';
            if (v === this.special) { this.special = null; this.fanBoost = 1; this.guards.forEach((g) => { g.state = 'exit'; }); }
            if (v.seat >= 0) this.seatTaken[v.seat] = false;
            this.visitors.splice(k, 1);
          }
          break;
        default: break;
      }
    }
  }

  updateGuard(g, dt, speed) {
    const lead = this.special;
    if (g.state === 'enter') { g.alpha = Math.min(1, g.alpha + dt / 0.4); g.timer -= dt; if (g.timer <= 0) g.state = 'follow'; return; }
    if (g.state === 'follow') {
      const tx = lead ? lead.x + g.special.side * 22 : L.holeX;
      if (!lead || lead.state === 'exit' || lead.state === 'leave') { g.state = 'exit'; return; }
      const arrived = g.moveTo(tx, dt, speed);
      if (arrived) g.dir = -g.special.side;
      g.idle = arrived;
      return;
    }
    if (g.state === 'exit') { if (g.moveTo(L.holeX, dt, speed)) { g.state = 'leave'; g.timer = 0.35; } g.idle = false; return; }
    if (g.state === 'leave') { g.alpha -= dt / 0.35; if (g.alpha <= 0) g.state = 'gone'; }
  }

  // Seated readers go between the back layer and the desk; walkers in front.
  drawSeated(ctx) {
    for (const v of this.visitors) if (v.state === 'read') this.drawVisitor(ctx, v);
  }
  drawWalkers(ctx, t) {
    const sp = this.special;
    if (sp && sp.state !== 'gone') this.drawSpecialFx(ctx, sp, t);
    for (const v of this.visitors) if (v.state !== 'read') this.drawVisitor(ctx, v);
    for (const v of this.visitors) if (v.state === 'request' && v.req) this.drawRequest(ctx, v, t);
  }

  // Thought bubble: "can you find me this book?"
  drawRequest(ctx, v, t) {
    const x = Math.max(16, Math.min(336, v.x)); const y = v.y - 58 + Math.sin(t * 3) * 1.5;
    const urgent = v.req.t < 4;
    circ(ctx, v.x + 3, v.y - 38, 1.8, '#fff'); circ(ctx, v.x + 6, v.y - 43, 2.6, '#fff');
    art(ctx, `request|${v.req.color}|${urgent ? 1 : 0}`, [-17, -14, 34, 28], paintRequest, [v.req.color, urgent], x, y);
    // timer ring
    ctx.strokeStyle = urgent ? '#e0605a' : '#7cc46b'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y, 17, -Math.PI / 2, -Math.PI / 2 + (v.req.t / 11) * Math.PI * 2); ctx.stroke();
  }

  drawVisitor(ctx, v) {
    const pose = v.special?.type === 'guard' ? (v.idle || v.state === 'enter' ? 'stand' : 'walk') : v.pose;
    let y = v.y;
    if (v.special?.type === 'author' && v.state === 'pose') y = L.laneBack - 13;
    const book = v.book || (v.special?.type === 'author' ? '#c0504d' : v.special?.type === 'critic' && v.state === 'pose' ? '#f3ead8' : null);
    drawMouse(ctx, v.x, y, { ...v.look, dir: v.dir, pose, t: v.t, alpha: v.alpha, book, seed: v.seed, s: v.look.s });
  }

  drawSpecialFx(ctx, v, t) {
    const type = v.special.type;
    if (type === 'critic') {
      if (v.state !== 'pose' || v.alpha < 0.5) return;
      const by = v.y - 56 + Math.sin(t * 3) * 2;
      ell(ctx, v.x, by, 11, 11, 'rgba(255,255,255,0.95)');
      ctx.font = '12px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('📝', v.x, by + 0.5);
      ctx.strokeStyle = '#e3c48e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(v.x, by, 13, -Math.PI / 2, -Math.PI / 2 + (1 - v.timer / v.special.dur) * Math.PI * 2); ctx.stroke();
      return;
    }
    // author's signing table
    if (type === 'author' && v.state === 'pose') {
      const tx = v.x + 18;
      fillRR(ctx, tx - 14, L.laneFront - 17, 28, 4, 1.5, '#7a4b2e');
      ctx.fillStyle = '#6b4128'; ctx.fillRect(tx - 12, L.laneFront - 13, 2, 13); ctx.fillRect(tx + 10, L.laneFront - 13, 2, 13);
      ['#c0504d', '#4f7cac', '#e9b949'].forEach((c, k) => fillRR(ctx, tx - 8 + k * 0.6, L.laneFront - 20 - k * 2.6, 12, 2.6, 0.6, c));
    }
    // golden halo so guests are easy to spot
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    const hy = (type === 'author' && v.state === 'pose' ? L.laneBack - 13 : v.y) - 18;
    glow(ctx, v.x, hy, 34, '255,225,120', (0.35 + pulse * 0.2) * v.alpha);
    if (!v.greeted && v.alpha > 0.5) {
      const by = hy - 38 + Math.sin(t * 3) * 2.5;
      ell(ctx, v.x, by, 11, 11, 'rgba(255,255,255,0.95)');
      ctx.beginPath(); ctx.moveTo(v.x - 3, by + 9); ctx.lineTo(v.x, by + 15); ctx.lineTo(v.x + 3, by + 9); ctx.fill();
      ctx.font = '12px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(type === 'royal' ? '👑' : type === 'author' ? '✍️' : '⭐', v.x, by + 0.5);
      for (let k = 0; k < 3; k++) {
        const a = t * 1.5 + (k * Math.PI * 2) / 3;
        star(ctx, v.x + Math.cos(a) * 20, hy + Math.sin(a) * 12, 2 + pulse, '#fff3b0');
      }
    }
  }

  // Hit tests in room-local interior coordinates.
  hitSpecial(lx, ly) {
    const v = this.special;
    if (!v || v.greeted || v.special.type === 'critic' || v.alpha < 0.3 || v.state === 'exit' || v.state === 'leave') return null;
    const top = v.y - 70; // includes the bubble
    return lx > v.x - 22 && lx < v.x + 22 && ly > top && ly < v.y + 6 ? v : null;
  }
  hitVisitor(lx, ly) {
    let best = null; let bd = 1e9;
    for (const v of this.visitors) {
      if (v.special || v.petted || v.alpha < 0.5) continue;
      const cy = v.y - 16;
      const d = Math.hypot(lx - v.x, (ly - cy) * 0.7);
      if (d < 18 && d < bd) { bd = d; best = v; }
    }
    return best;
  }
}

// The thought bubble itself: "can you find me this book?" (a cached picture; see sprites.js)
function paintRequest(ctx, [color, urgent]) {
  ell(ctx, 0, 0, 15, 12, '#ffffff');
  ctx.strokeStyle = urgent ? '#e0605a' : '#e3c48e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2); ctx.stroke();
  fillRR(ctx, -7, -6, 9, 11, 1.2, color); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(-5.5, -4.5, 1.2, 8);
  ctx.fillStyle = '#4a3121'; ctx.font = '700 10px "Fredoka",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', 7, 0);
}

export const roomOrigin = (i) => ({ x: IX, y: floorTop(i) });
