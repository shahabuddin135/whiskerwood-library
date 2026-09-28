// Location mechanics: each place has its own little thing to tap.
//   Meadow     fishing at the pond (handled by World.tapFisher)
//   Cove       messages in bottles wash up on the beach
//   Caverns    glowcaps sprout on the shelves
//   Clockwork  capsules whoosh up the pneumatic book tube
//   Castle     Sir Reginald the bookwyrm snores books loose on the battlements
//   Sky        the cloud whale drifts by; tap her spout
// Plus the delivery crate that turns up on the doorstep (a rewarded-ad chest).
import { L, IX, BX0, BX1, W, floorTop } from './layout.js';
import { ell, circ, fillRR, star, rgba } from './draw.js';
import { fmt } from '../core/format.js';
import { sfx } from '../audio/sfx.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';

const LETTERS = [
  'Dear finder, please return my other sock. — The Sea',
  'HELP. I am trapped in a bottle factory. Also, lovely weather.',
  'If found, please return to Captain Barnacle. He has lost four hundred bottles.',
  'Chapter 7 of my book fell overboard. If you find it: the butler did it.',
  'To whoever reads this: you have excellent taste in beaches.',
  'I have been at sea for 40 days. I have read my only book 40 times. Send books.',
  'This is a message in a bottle. That is the message. Sorry.',
  'Roses are red, the ocean is blue, I threw this in the sea and it landed on you.',
  'Recipe for fish pie. Please do not tell the fish.',
  'Dear Library: the whale says hi. — A Seagull',
];
const MUMBLES = ['…five more minutes…', '*snore*', '…mmf… my books…', '…no, YOU’RE a dragon…'];

export class Mechanics {
  constructor(world) {
    this.w = world;
    this.t = 0;
    this.reset();
  }
  reset() {
    this.bottles = []; this.nextBottle = rand(6, 12);
    this.glowcaps = []; this.nextGlow = rand(5, 10);
    this.capsules = []; this.nextCap = rand(8, 16);
    this.wyrm = { state: 'sleep', t: 0, next: rand(20, 35), mumble: 0 };
    this.whale = null; this.nextWhale = rand(30, 60);
    this.perch = null; this.roofY = 0;
    this.crateT = 0;
  }
  get game() { return this.w.game; }
  get mech() { return this.game.loc().mechanic.id; }
  ready() { return this.game.s.questIdx >= 2; }

  update(dt) {
    this.t += dt;
    const m = this.mech;
    if (m === 'bottles') {
      this.nextBottle -= dt;
      if (this.nextBottle <= 0 && this.bottles.length < 2 && this.ready()) {
        this.nextBottle = rand(22, 40);
        const u = rand(0.1, 0.85);
        const x = (1 - u) ** 2 * 120 + 2 * (1 - u) * u * 170 + u * u * 110 + 8; const y = (1 - u) ** 2 * 10 + 2 * (1 - u) * u * 45 + u * u * 90;
        this.bottles.push({ x, y, t: 0, life: 50, rot: rand(-0.6, 0.6) });
      }
      for (const b of this.bottles) { b.t += dt; }
      this.bottles = this.bottles.filter((b) => b.t < b.life);
    }
    if (m === 'glowcaps') {
      this.nextGlow -= dt;
      if (this.nextGlow <= 0 && this.glowcaps.length < 3 && this.ready()) {
        this.nextGlow = rand(9, 18);
        const i = this.w.chatter.visibleFloor();
        if (i != null) {
          const r = this.game.s.rooms[i];
          const k = Math.floor(Math.random() * r.shelves); const row = Math.floor(Math.random() * 4);
          const rowH = (L.shelfBot - L.shelfTop - 10) / 4;
          this.glowcaps.push({ i, x: L.shelves[k] + 8 + Math.random() * 36, y: L.shelfTop + 6 + row * rowH + rowH - 2, t: 0, life: 24, c: Math.random() < 0.5 ? '#7de8d8' : '#b69cf0' });
        }
      }
      for (const g of this.glowcaps) g.t += dt;
      this.glowcaps = this.glowcaps.filter((g) => g.t < g.life);
    }
    if (m === 'capsules') {
      this.nextCap -= dt;
      if (this.nextCap <= 0 && this.ready()) { this.nextCap = rand(12, 24); this.capsules.push({ y: 6, t: 0, caught: false }); if (this.w.isGardenVisible()) sfx.whoosh(); }
      for (const c of this.capsules) { c.t += dt; c.y -= (c.caught ? 0 : 70) * dt; }
      this.capsules = this.capsules.filter((c) => (c.caught ? c.t < 0.5 : c.y > this.roofY - 30));
    }
    if (m === 'bookwyrm') {
      const w = this.wyrm; w.t += dt; w.next -= dt; w.mumble -= dt;
      if (w.state === 'sleep' && w.next <= 0 && this.ready()) { w.state = 'snore'; w.t = 0; if (this.perch && this.w.isVisibleY(this.perch.y)) sfx.snore(); }
      if (w.state === 'snore' && w.t > 7) { w.state = 'sleep'; w.next = rand(35, 60); }
      if (w.state === 'caught' && w.t > 1.2) { w.state = 'sleep'; w.next = rand(40, 65); }
    }
    if (m === 'whale') {
      this.nextWhale -= dt;
      if (!this.whale && this.nextWhale <= 0 && this.ready()) {
        this.nextWhale = rand(90, 150);
        const dir = Math.random() < 0.5 ? 1 : -1;
        this.whale = { dir, x: dir > 0 ? -160 : this.w.Wpx + 160, y: this.w.Hpx * rand(0.28, 0.42), vx: dir * rand(16, 22), t: 0, tapped: false, spout: 0 };
        sfx.whale();
      }
      const wh = this.whale;
      if (wh) { wh.t += dt; wh.x += wh.vx * dt; wh.spout = Math.max(0, wh.spout - dt); if ((wh.t % 6) < dt) wh.spout = 1.4; if (wh.x < -220 || wh.x > this.w.Wpx + 220) this.whale = null; }
    }
    this.crateT += dt;
  }

  /* ---------------- drawing ---------------- */
  // World space, on the garden (after the ground).
  drawGarden(ctx) {
    for (const b of this.bottles) {
      const bob = Math.sin(b.t * 2) * 1.2; const a = Math.min(1, b.t / 0.8, (b.life - b.t) / 1.5);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(b.x, b.y + bob); ctx.rotate(b.rot);
      ell(ctx, 0, 0, 7, 3.2, 'rgba(120,200,160,0.85)'); fillRR(ctx, 6, -1.6, 4, 3.2, 1, '#8a5a3a'); fillRR(ctx, -3, -1.4, 5, 2.8, 0.6, '#fbf6ea');
      ctx.restore();
      if (Math.sin(b.t * 3) > 0.8) star(ctx, b.x - 3, b.y - 4, 2.4, 'rgba(255,255,255,0.95)');
    }
    // the delivery crate on the path
    if (this.game.chestDue()) {
      const x = 232; const y = 50; const hop = Math.abs(Math.sin(this.crateT * 2.4)) * 3;
      const g = ctx.createRadialGradient(x, y - 8, 2, x, y - 8, 30); g.addColorStop(0, `rgba(255,225,120,${0.4 + 0.15 * Math.sin(this.crateT * 4)})`); g.addColorStop(1, 'rgba(255,225,120,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 30, y - 38, 60, 60);
      ell(ctx, x, y + 1, 12, 3, 'rgba(0,0,0,0.2)');
      fillRR(ctx, x - 10, y - 16 - hop, 20, 16, 2, '#b98a5a'); ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 1; ctx.strokeRect(x - 10, y - 16 - hop, 20, 16);
      ctx.beginPath(); ctx.moveTo(x - 10, y - 16 - hop); ctx.lineTo(x + 10, y - hop); ctx.moveTo(x + 10, y - 16 - hop); ctx.lineTo(x - 10, y - hop); ctx.stroke();
      ctx.fillStyle = '#e0404f'; ctx.fillRect(x - 1.6, y - 16 - hop, 3.2, 16); ctx.fillRect(x - 10, y - 9.5 - hop, 20, 3);
      ell(ctx, x - 4, y - 18 - hop, 4, 2.4, '#e0404f', -0.4); ell(ctx, x + 4, y - 18 - hop, 4, 2.4, '#e0404f', 0.4); circ(ctx, x, y - 17.5 - hop, 1.8, '#c0304a');
      ctx.fillStyle = '#fff'; ctx.font = `700 6.5px ${FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 2.4; ctx.strokeStyle = '#6b4128';
      ctx.strokeText('Delivery!', x, y - 27 - hop); ctx.fillText('Delivery!', x, y - 27 - hop);
    }
  }

  // World space, on the building (after floors): the pneumatic tube and the bookwyrm.
  drawExterior(ctx, topIndex, roofY, perch) {
    this.roofY = roofY; this.perch = perch;
    const m = this.mech;
    if (m === 'capsules') {
      const x = BX1 + 16;
      ctx.fillStyle = 'rgba(190,225,230,0.35)'; ctx.fillRect(x - 5, roofY - 20, 10, -roofY + 24);
      ctx.strokeStyle = '#b07a2e'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 5, 4); ctx.lineTo(x - 5, roofY - 20); ctx.moveTo(x + 5, 4); ctx.lineTo(x + 5, roofY - 20); ctx.stroke();
      for (let y = 0; y > roofY - 20; y -= 32) fillRR(ctx, x - 7, y - 3, 14, 5, 2, '#c99a4d');
      ctx.strokeStyle = '#b07a2e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, roofY - 20); ctx.quadraticCurveTo(x, roofY - 40, x - 24, roofY - 40); ctx.stroke();
      for (const c of this.capsules) {
        const a = c.caught ? 1 - c.t / 0.5 : 1;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(x, c.y);
        fillRR(ctx, -4, -9, 8, 18, 4, '#c99a4d'); fillRR(ctx, -2.6, -4, 5.2, 8, 1, '#fbf6ea'); ctx.fillStyle = '#c0504d'; ctx.fillRect(-2, -3, 4, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-3, -8, 1.2, 16);
        ctx.restore();
        if (!c.caught) { ctx.fillStyle = 'rgba(255,240,200,0.5)'; for (let k = 1; k < 4; k++) circ(ctx, x, c.y + 9 + k * 5, 2.2 - k * 0.5, 'rgba(255,240,200,0.5)'); }
      }
    }
    if (m === 'bookwyrm' && perch) this.drawWyrm(ctx, perch.x, perch.y);
  }

  drawWyrm(ctx, x, y) {
    const w = this.wyrm; const t = this.t;
    const breathe = Math.sin(t * 1.4) * 0.8;
    ctx.save(); ctx.translate(x, y);
    // tail curled round the merlon
    ctx.strokeStyle = '#4f9a5b'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.quadraticCurveTo(-26, 2, -24, -8); ctx.quadraticCurveTo(-22, -14, -16, -10); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#3f7f4f'; ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(-13, -15); ctx.lineTo(-13, -8); ctx.fill();
    ell(ctx, 0, -6 - breathe * 0.4, 13, 8 + breathe * 0.5, '#5fae6b'); ell(ctx, 2, -3, 8, 4, '#bfe39a');
    // folded wing
    ctx.fillStyle = '#3f8a4f'; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.quadraticCurveTo(0, -24 - breathe, 8, -13); ctx.quadraticCurveTo(2, -15, -6, -12); ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#3f7f4f'; ctx.beginPath(); ctx.moveTo(-8 + k * 5, -13); ctx.lineTo(-6 + k * 5, -17); ctx.lineTo(-4 + k * 5, -13); ctx.fill(); }
    // head resting on paws
    ell(ctx, 13, -4, 7, 5.5, '#5fae6b'); ell(ctx, 18, -2.5, 4.5, 3.2, '#6fbf7b');
    ctx.fillStyle = '#e8d6b0'; ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(8, -14); ctx.lineTo(12, -9); ctx.fill(); ctx.beginPath(); ctx.moveTo(14, -8.5); ctx.lineTo(14, -15); ctx.lineTo(16, -8.5); ctx.fill();
    const awake = w.state !== 'sleep';
    if (awake) { circ(ctx, 14.5, -5.5, 1.4, '#1d1b24'); circ(ctx, 14.9, -5.9, 0.5, '#fff'); }
    else { ctx.strokeStyle = '#1d1b24'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(14.5, -5.2, 1.4, 0.2, Math.PI - 0.2); ctx.stroke(); }
    circ(ctx, 21, -3, 0.7, '#2f5f3a');
    ell(ctx, 12, 1, 3.4, 2, '#5fae6b'); ell(ctx, 18, 1, 3.4, 2, '#5fae6b');
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = `700 7px ${FONT}`; ctx.textAlign = 'center';
    if (w.state === 'sleep') { ctx.globalAlpha = 0.7; ctx.fillText('z', x + 24 + Math.sin(t) * 2, y - 16 - ((t * 5) % 10)); ctx.fillText('Z', x + 30, y - 24 - ((t * 5 + 5) % 10)); ctx.globalAlpha = 1; }
    if (w.state === 'snore') {
      const k = Math.min(1, w.t / 0.6); const bx = x + 26; const by = y - 20 - k * 22 + Math.sin(w.t * 3) * 2;
      const g = ctx.createRadialGradient(bx, by, 2, bx, by, 18); g.addColorStop(0, 'rgba(255,230,140,0.7)'); g.addColorStop(1, 'rgba(255,230,140,0)'); ctx.fillStyle = g; ctx.fillRect(bx - 18, by - 18, 36, 36);
      fillRR(ctx, bx - 5, by - 6, 10, 12, 1.2, '#7a1f2b'); ctx.fillStyle = '#e0b84f'; ctx.fillRect(bx - 5, by - 1, 10, 1.4); ctx.fillStyle = '#fbf6ea'; ctx.fillRect(bx + 3.4, by - 5, 1.2, 10);
      ctx.lineWidth = 2.4; ctx.strokeStyle = '#6b4128'; ctx.fillStyle = '#fff'; ctx.font = `700 7.5px ${FONT}`;
      ctx.strokeText('TAP!', bx, by - 12); ctx.fillText('TAP!', bx, by - 12);
    }
  }

  // Floor-local: glowcaps on the shelves.
  drawRoom(ctx, i) {
    for (const g of this.glowcaps) {
      if (g.i !== i) continue;
      const grow = Math.min(1, g.t / 0.8); const fade = Math.min(1, (g.life - g.t) / 2);
      const s = grow * fade; const pulse = 0.6 + 0.4 * Math.sin(this.t * 4 + g.x);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(g.x, g.y - 6, 1, g.x, g.y - 6, 16); gr.addColorStop(0, rgba(g.c, 0.55 * s * pulse)); gr.addColorStop(1, rgba(g.c, 0));
      ctx.fillStyle = gr; ctx.fillRect(g.x - 16, g.y - 22, 32, 32); ctx.restore();
      ctx.fillStyle = '#e8e0f0'; ctx.fillRect(g.x - 0.8, g.y - 6 * s, 1.6, 6 * s);
      ctx.fillStyle = g.c; ctx.beginPath(); ctx.ellipse(g.x, g.y - 6 * s, 4.5 * s, 3.4 * s, 0, Math.PI, 0); ctx.fill();
      circ(ctx, g.x - 1.5 * s, g.y - 7.5 * s, 0.7 * s, 'rgba(255,255,255,0.9)');
    }
  }

  // Screen space: the cloud whale.
  drawScreen(ctx) {
    const wh = this.whale; if (!wh) return;
    const y = wh.y + Math.sin(wh.t * 0.6) * 8;
    ctx.save(); ctx.translate(wh.x, y); ctx.scale(wh.dir * 1.3, 1.3);
    // body made of soft cloud-blue puffs
    ctx.fillStyle = '#b9d3ea'; ctx.beginPath(); ctx.ellipse(0, 0, 44, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8f2fb'; ctx.beginPath(); ctx.ellipse(4, 8, 34, 10, 0, 0, Math.PI); ctx.fill();
    const tail = Math.sin(wh.t * 1.6) * 6;
    ctx.fillStyle = '#b9d3ea'; ctx.beginPath(); ctx.moveTo(-40, -2); ctx.quadraticCurveTo(-56, -4, -66, -14 + tail); ctx.quadraticCurveTo(-58, -2, -66, 10 + tail); ctx.quadraticCurveTo(-54, 4, -40, 6); ctx.fill();
    ctx.fillStyle = '#a3c3df'; ctx.beginPath(); ctx.ellipse(6, 12, 12, 4, 0.5, 0, Math.PI * 2); ctx.fill();
    circ(ctx, 26, -4, 2.4, '#27496d'); circ(ctx, 26.6, -4.8, 0.8, '#fff');
    ctx.strokeStyle = '#27496d'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(30, 4, 6, 0.2, 1.3); ctx.stroke();
    ell(ctx, 22, 2, 3, 1.8, 'rgba(242,139,160,0.45)');
    for (let k = 0; k < 5; k++) circ(ctx, -20 + k * 10, -14 - (k % 2) * 2, 5, 'rgba(255,255,255,0.55)');
    if (wh.spout > 0) {
      const k = 1 - wh.spout / 1.4;
      for (let j = 0; j < 5; j++) circ(ctx, 12 + (j - 2) * 4 * k * 2, -22 - k * 30 - Math.abs(j - 2) * 3 * (1 - k), 4 + k * 4, `rgba(255,255,255,${0.8 * (1 - k)})`);
    }
    ctx.restore();
    if (!wh.tapped) { ctx.fillStyle = '#fff'; ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#27496d'; ctx.strokeText('tap her spout!', wh.x, y - 44); ctx.fillText('tap her spout!', wh.x, y - 44); }
  }

  /* ---------------- taps ---------------- */
  reward(sec, extra = {}) {
    const g = this.game;
    const amt = g.rewardCoins(sec); g.earn(amt);
    if (extra.cheese) g.addCheese(extra.cheese);
    g.localeUsed();
    const sv = g.findSouvenir(extra.souvenir || 0);
    if (sv) setTimeout(() => this.w.ui?.souvenirFound(sv), 700);
    return amt;
  }

  hitWorld(wx, wy) {
    const w = this.w; const g = this.game;
    // delivery crate
    if (g.chestDue() && Math.hypot(wx - 232, wy - 40) < 24) { sfx.tap(); w.ui?.screens.deliveryCrate(); return true; }
    // bottles
    for (const b of this.bottles) {
      if (Math.hypot(wx - b.x, wy - b.y) < 16) {
        this.bottles = this.bottles.filter((x) => x !== b);
        const amt = this.reward(60, { souvenir: 0.1 });
        sfx.pop(); sfx.collect(false);
        w.fx.text(b.x, b.y - 12, `+${fmt(amt)}`, { icon: 'coin', size: 10 });
        w.fx.sparkle(b.x, b.y, 10, '#bfe8ff');
        w.ui?.note('Message in a bottle', pick(LETTERS), 'bottle');
        return true;
      }
    }
    // pneumatic capsules
    if (this.mech === 'capsules') {
      for (const c of this.capsules) {
        if (!c.caught && Math.abs(wx - (BX1 + 16)) < 18 && Math.abs(wy - c.y) < 20) {
          c.caught = true; c.t = 0;
          const cheese = Math.random() < 0.25 ? 1 : 0;
          const amt = this.reward(45, { cheese, souvenir: 0.05 });
          sfx.pop(); sfx.collect(false);
          w.fx.text(BX1 + 16, c.y - 16, `+${fmt(amt)}${cheese ? ' +1 cheese' : ''}`, { icon: 'coin', size: 10 });
          w.fx.sparkle(BX1 + 16, c.y, 12, '#ffe28a');
          if (Math.random() < 0.1) { const res = g.grantBook(); w.ui?.screens.bookReveal({ kind: 'book', ...res }); }
          return true;
        }
      }
    }
    // the bookwyrm
    if (this.mech === 'bookwyrm' && this.perch && Math.hypot(wx - (this.perch.x + 10), wy - (this.perch.y - 14)) < 34) {
      const wy2 = this.wyrm;
      if (wy2.state === 'snore') {
        wy2.state = 'caught'; wy2.t = 0;
        const amt = this.reward(60, { souvenir: 0.08 });
        sfx.sparkle(); sfx.dragon();
        w.fx.text(this.perch.x + 26, this.perch.y - 40, `+${fmt(amt)}`, { icon: 'coin', size: 11 });
        const res = g.grantBook(); w.ui?.screens.bookReveal({ kind: 'book', ...res });
      } else if (wy2.mumble <= 0) {
        wy2.mumble = 2.5; sfx.snore();
        w.fx.text(this.perch.x + 10, this.perch.y - 30, pick(MUMBLES), { color: '#fff', size: 8, life: 1.6, stroke: '#2f5f3a' });
      }
      return true;
    }
    return false;
  }

  hitRoom(i, lx, ly) {
    for (const gc of this.glowcaps) {
      if (gc.i === i && Math.hypot(lx - gc.x, ly - (gc.y - 5)) < 14) {
        this.glowcaps = this.glowcaps.filter((x) => x !== gc);
        const amt = this.reward(30, { souvenir: 0.04 });
        sfx.sparkle();
        this.w.fx.text(IX + gc.x, floorTop(i) + gc.y - 16, `+${fmt(amt)}`, { icon: 'coin', size: 9.5 });
        this.w.fx.sparkle(IX + gc.x, floorTop(i) + gc.y - 6, 10, gc.c);
        return true;
      }
    }
    return false;
  }

  hitScreen(sx, sy) {
    const wh = this.whale;
    if (wh && !wh.tapped && Math.hypot(sx - wh.x, sy - (wh.y + Math.sin(wh.t * 0.6) * 8)) < 70) {
      wh.tapped = true; wh.spout = 1.4;
      const amt = this.reward(120, { cheese: 2, souvenir: 0.1 });
      sfx.whale(); sfx.collect(true);
      this.w.ui?.flyCoins({ x: sx, y: sy }, 12);
      this.w.ui?.toast(`The cloud whale sprays a gift: +${fmt(amt)} coins and 2 golden cheese!`, 'gold', 'whale');
      return true;
    }
    return false;
  }
}

export { W };
