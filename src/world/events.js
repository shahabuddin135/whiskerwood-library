// Surprise library events: the twists that keep every session different.
//   🐱 Baroness Clawdia prowls at a window  -> tap her until she flees (floor earns nothing meanwhile)
//   🐛 Bookworms nibble a floor's shelves   -> squish them all
//   📕 A lost book is hidden somewhere        -> find it (zoom & scroll!)
//   📝 Monsieur Fromage reviews a floor       -> star rating, tips and rewards
//   🎪 Book Fair                              -> everything ×2, extra visitors
//   🦹 Sneaky Rattigan runs for the coin jar  -> catch him (handled by the UI layer)
import { L, IX, floorTop } from './layout.js';
import { drawCat, drawWorm, ell, circ, star, fillRR } from './draw.js';
import { ROOMS, LIMITS } from '../data/rooms.js';
import { sfx } from '../audio/sfx.js';
import { fmt } from '../core/format.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const CRITIC = { name: 'Monsieur Fromage', look: { fur: '#b8aca1', belly: '#efe6dc', hat: 'beret', hatCol: '#1f1f2e', monocle: true, scarf: '#7a2f3a' } };

export class Events {
  constructor(world) {
    this.w = world;
    this.cat = null;
    this.worms = null;
    this.lost = null;
    this.fair = null;
    this.critic = null;
    this.next = performance.now() + rand(80, 120) * 1000;
    this.lastFair = performance.now();
    this.t = 0;
  }

  get game() { return this.w.game; }
  builtFloors() { return this.game.s.rooms.map((r, i) => (r.built ? i : -1)).filter((i) => i >= 0); }
  preferVisible(list) {
    const vis = list.filter((i) => this.w.isVisible(i));
    return vis.length && Math.random() < 0.75 ? pick(vis) : pick(list);
  }

  update(dt) {
    this.t += dt;
    const g = this.game; const s = g.s;
    const now = performance.now();
    if (now > this.next) {
      this.next = now + rand(55, 100) * 1000;
      if (s.questIdx >= 8 && !this.w.ui?.busy()) this.spawnRandom();
    }
    // cat
    const c = this.cat;
    if (c) {
      c.t += dt; c.life -= dt; if (c.hit > 0) c.hit -= dt;
      if (c.leaving) { c.flee += dt / 0.6; if (c.flee >= 1) this.endCat(); }
      else if (c.life <= 0) { c.leaving = true; c.flee = 0; c.won = false; this.w.ui?.toast('😿 The readers were too scared… tap the cat next time!'); }
    }
    // worms
    const wm = this.worms;
    if (wm) {
      wm.life -= dt;
      for (const x of wm.list) { x.t += dt; if (x.alive) x.x += Math.sin(x.t * 0.8 + x.p) * dt * 3; else x.pop += dt; }
      if (wm.life <= 0) { this.endWorms(false); }
    }
    // lost book
    const lb = this.lost;
    if (lb) {
      lb.life -= dt; lb.t += dt;
      if (!lb.hinted && lb.t > 30) { lb.hinted = true; this.w.ui?.banner({ icon: '🔍', title: 'Still looking?', text: `The lost book is somewhere in ${ROOMS[lb.i].name}!`, btn: 'Go', onClick: () => this.w.panToRoom(lb.i), ms: 7000 }); }
      if (lb.life <= 0) { this.lost = null; }
    }
    // fair
    if (this.fair) {
      this.fair.left -= dt; this.fair.burst -= dt;
      if (this.fair.burst <= 0) {
        this.fair.burst = 3.5;
        const vis = this.builtFloors().filter((i) => this.w.isVisible(i));
        if (vis.length) { const i = pick(vis); this.w.fx.confetti(IX + 176, floorTop(i) + 30, 22, 280); }
      }
      if (this.fair.left <= 0) this.endFair();
    }
  }

  spawnRandom() {
    const g = this.game;
    const built = this.builtFloors();
    const opts = [];
    if (!this.cat) opts.push(['cat', 3]);
    if (!this.worms) opts.push(['worms', 3]);
    if (!this.lost) opts.push(['lost', 2]);
    if (g.s.jar >= g.steady() * 30) opts.push(['thief', 2]);
    if (!this.critic && built.length >= 2) opts.push(['critic', 2]);
    if (!this.fair && performance.now() - this.lastFair > 12 * 60000 && built.length >= 3) opts.push(['fair', 1.5]);
    const total = opts.reduce((a, [, w]) => a + w, 0);
    let x = Math.random() * total;
    for (const [kind, w] of opts) { x -= w; if (x <= 0) { this.start(kind); return; } }
  }

  start(kind, i = null) {
    const built = this.builtFloors();
    if (!built.length) return;
    const floor = i ?? this.preferVisible(built);
    switch (kind) {
      case 'cat': return this.startCat(floor);
      case 'worms': return this.startWorms(floor);
      case 'lost': return this.startLost(i ?? pick(built));
      case 'critic': return this.startCritic(floor);
      case 'fair': return this.startFair();
      case 'thief': return this.w.ui?.startThief();
      default: return null;
    }
  }

  /* ---------------- 🐱 the cat ---------------- */
  startCat(i) {
    if (this.cat) return;
    const first = !this.game.s.stats.cats;
    this.cat = { i, t: 0, taps: 0, need: 4 + Math.min(3, Math.floor(i / 3)), life: first ? 40 : 22, hit: 0, leaving: false, flee: 0 };
    this.game.addBoost({ mult: 0, sec: 60, room: i, label: 'Cat at the window!', icon: '🐱', key: `cat${i}` });
    this.w.sims[i].fear = true;
    sfx.hiss();
    this.w.chatter.shout(i, ['EEK! A CAT!', 'Hide the cheese!', 'Help!!'], 3);
    this.w.ui?.banner({ icon: '🐱', title: 'Baroness Clawdia!', text: `She's scaring readers in ${ROOMS[i].name}. Tap her to shoo her away!`, btn: 'Shoo!', onClick: () => this.w.panToRoom(i), ms: 8000, urgent: true });
    if (first) this.w.ui?.story?.play('catIntro');
  }
  tapCat() {
    const c = this.cat;
    if (!c || c.leaving) return;
    c.taps++; c.hit = 0.25;
    sfx.hiss(); sfx.tap();
    const x = IX + L.window.x + L.window.w / 2; const y = floorTop(c.i) + L.window.y + 30;
    this.w.fx.text(x + (Math.random() - 0.5) * 30, y - 10, pick(['Shoo!', 'Scat!', 'Go away!', 'Hiss!', 'Out!']), { color: '#fff', size: 12, stroke: '#6d3f8f' });
    this.w.fx.sparkle(x, y, 6, '#fff');
    if (c.taps >= c.need) {
      c.leaving = true; c.flee = 0; c.won = true;
      const g = this.game;
      const amt = g.rewardCoins(60); g.earn(amt); g.addCheese(1);
      g.s.stats.cats++; g.checkQuest();
      this.w.fx.text(x, y - 30, `+${fmt(amt)} +1🧀`, { icon: 'coin', size: 13 });
      this.w.chatter.shout(c.i, ['Hooray!', 'You saved us!', 'Our hero!'], 3);
      sfx.reward();
      this.w.ui?.toast('🐱 Clawdia ran off! The readers are safe.', 'gold');
    }
  }
  endCat() {
    const c = this.cat; if (!c) return;
    this.game.removeBoost(`cat${c.i}`);
    this.w.sims[c.i].fear = false;
    this.cat = null;
  }

  /* ---------------- 🐛 bookworms ---------------- */
  startWorms(i) {
    if (this.worms) return;
    const r = this.game.s.rooms[i];
    const rowH = (L.shelfBot - L.shelfTop - 10) / 4;
    const n = 4 + Math.floor(Math.random() * 3);
    const list = Array.from({ length: n }, () => {
      const s = Math.floor(Math.random() * r.shelves); const row = Math.floor(Math.random() * 4);
      return { x: L.shelves[s] + 10 + Math.random() * 32, y: L.shelfTop + 6 + row * rowH + rowH - 4, alive: true, t: Math.random() * 5, p: Math.random() * 6, pop: 0 };
    });
    this.worms = { i, list, life: 45 };
    this.game.addBoost({ mult: 0.6, sec: 60, room: i, label: 'Bookworms!', icon: '🐛', key: `worm${i}` });
    this.w.ui?.banner({ icon: '🐛', title: 'Bookworms!', text: `They're nibbling the shelves in ${ROOMS[i].name}. Squish them all!`, btn: 'Go', onClick: () => this.w.panToRoom(i), ms: 7000 });
    if (!this.game.s.stats.worms) this.w.ui?.story?.play('wormIntro');
  }
  endWorms(cleared) {
    const wm = this.worms; if (!wm) return;
    this.game.removeBoost(`worm${wm.i}`);
    if (cleared) {
      this.game.addCheese(2);
      this.w.ui?.toast('🐛 Every worm squished! +2 golden cheese', 'gold');
      sfx.reward();
    }
    this.worms = null;
  }

  /* ---------------- 📕 lost book ---------------- */
  startLost(i) {
    if (this.lost) return;
    const r = this.game.s.rooms[i];
    const spots = [
      () => ({ x: 40 + Math.random() * 200, y: L.laneFront + 1, flat: true }),
      () => ({ x: L.shelves[Math.floor(Math.random() * r.shelves)] + 26, y: L.shelfTop - 3, flat: true }),
      () => ({ x: L.desk.x0 + 44, y: L.desk.top, flat: true }),
      () => ({ x: L.seats[Math.floor(Math.random() * r.seats)] + 8, y: L.laneBack + 1, flat: true }),
      () => ({ x: L.window.x + 26, y: L.window.y + L.window.h - 1, flat: true }),
    ];
    const p = pick(spots)();
    this.lost = { i, ...p, t: 0, life: 90, hinted: false, color: pick(ROOMS[i].books) };
    this.w.ui?.banner({ icon: '📕', title: 'A book went missing!', text: 'Somebody left a book somewhere in the library. Find it (zoom in!) for a prize.', btn: 'OK', ms: 7000 });
  }
  takeLost() {
    const lb = this.lost; if (!lb) return;
    const g = this.game;
    this.lost = null;
    g.s.stats.lostBooks++; g.addCheese(2); g.checkQuest();
    const res = g.grantBook();
    sfx.sparkle();
    const x = IX + lb.x; const y = floorTop(lb.i) + lb.y;
    this.w.fx.sparkle(x, y - 6, 18, '#ffe28a');
    this.w.ui?.screens.bookReveal({ kind: 'book', ...res });
    this.w.ui?.toast('🔍 Found it! +2 golden cheese', 'gold');
  }

  /* ---------------- 📝 the critic ---------------- */
  startCritic(i) {
    const sim = this.w.sims[i];
    if (sim.special) return;
    sim.spawnSpecial('critic', CRITIC.name, CRITIC.look, 12);
    this.critic = { i };
    this.w.ui?.banner({ icon: '📝', title: 'A critic is here!', text: `Monsieur Fromage is reviewing ${ROOMS[i].name}. Is it cosy enough?`, btn: 'Watch', onClick: () => this.w.panToRoom(i), ms: 7000 });
    if (!this.game.s.stats.critics) this.w.ui?.story?.play('criticIntro');
  }
  // Score a floor 1..5 stars and explain what's missing.
  review(i) {
    const r = this.game.s.rooms[i];
    const decor = r.decor.filter(Boolean).length;
    const score = (r.seats / LIMITS.seats) * 1.1 + (r.shelves / 4) * 0.9 + (decor / 5) * 1.6 + Math.min(1, r.lvl / 50) * 0.7 + Math.min(1, r.staff / 8) * 0.7;
    const stars = Math.max(1, Math.min(5, Math.round(score)));
    const notes = [];
    if (r.seats < LIMITS.seats) notes.push('More seats, s’il vous plaît.');
    if (!r.decor[1]) notes.push('Rather dim. Lamps!');
    if (!r.decor[0]) notes.push('The floor is… chilly. A rug?');
    if (r.shelves < 4) notes.push('Where are all the shelves?');
    if (!r.decor[3]) notes.push('Such bare walls.');
    if (r.staff < 8) notes.push('Checkout was slow.');
    if (r.lvl < 50) notes.push('A thin collection.');
    return { stars, notes: notes.slice(0, 2) };
  }
  criticDone(i) {
    this.critic = null;
    const g = this.game;
    g.s.stats.critics++;
    const rv = this.review(i);
    this.w.ui?.screens.review(i, rv);
  }

  /* ---------------- 🎪 book fair ---------------- */
  startFair(sec = 120) {
    if (this.fair) { this.fair.left += sec; this.game.addBoost({ mult: 2, sec: this.fair.left, label: 'Book Fair', icon: '🎪', key: 'fair' }); return; }
    this.fair = { left: sec, burst: 0 };
    this.lastFair = performance.now();
    this.game.addBoost({ mult: 2, sec, label: 'Book Fair', icon: '🎪', key: 'fair' });
    this.w.sims.forEach((s) => { s.eventBoost = 1.8; });
    sfx.fanfare();
    this.w.ui?.fairStarted(sec);
  }
  endFair() {
    this.fair = null;
    this.w.sims.forEach((s) => { s.eventBoost = 1; });
    this.game.removeBoost('fair');
  }

  /* ---------------- drawing (floor-local coords) ---------------- */
  drawBehind(ctx, i) {
    const c = this.cat;
    if (!c || c.i !== i) return;
    const rise = Math.min(1, c.t / 0.6);
    const x = L.window.x + L.window.w / 2 + (c.hit > 0 ? Math.sin(c.hit * 60) * 3 : 0);
    const y = L.window.y + L.window.h - 16 + (1 - rise) * 40 + (c.hit > 0 ? 4 : 0);
    drawCat(ctx, x, y, { s: 1.15, t: c.t, mode: 'peek', squint: c.hit > 0 ? 1 : 0.35, flee: c.leaving ? c.flee : 0 });
  }

  drawOver(ctx, i) {
    const t = this.t;
    const c = this.cat;
    if (c && c.i === i && !c.leaving) {
      // paws on the sill + progress pips
      const x = L.window.x + L.window.w / 2; const y = L.window.y + L.window.h + 1;
      [-1, 1].forEach((sx) => { ell(ctx, x + sx * 12, y, 7, 4, '#8e86a3'); });
      for (let k = 0; k < c.need; k++) circ(ctx, x - (c.need - 1) * 5 + k * 10, y + 12, 3, k < c.taps ? '#7cc46b' : 'rgba(255,255,255,0.85)');
      const pulse = 0.5 + 0.5 * Math.sin(t * 8);
      ctx.strokeStyle = `rgba(224,96,90,${0.5 + pulse * 0.4})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - 26, 34 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '700 9px "Fredoka",sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#6d3f8f';
      ctx.strokeText('TAP!', x, y - 66); ctx.fillText('TAP!', x, y - 66);
    }
    const wm = this.worms;
    if (wm && wm.i === i) {
      for (const x of wm.list) {
        if (x.alive) drawWorm(ctx, x.x, x.y, x.t, 1.35);
        else if (x.pop < 0.4) { ctx.globalAlpha = 1 - x.pop / 0.4; star(ctx, x.x, x.y, 5 + x.pop * 12, '#c5e87f'); ctx.globalAlpha = 1; }
      }
    }
    const lb = this.lost;
    if (lb && lb.i === i) {
      const glow = 0.5 + 0.5 * Math.sin(t * 5);
      const g = ctx.createRadialGradient(lb.x, lb.y - 3, 1, lb.x, lb.y - 3, 16);
      g.addColorStop(0, `rgba(255,230,140,${0.55 + glow * 0.3})`); g.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = g; ctx.fillRect(lb.x - 16, lb.y - 19, 32, 32);
      fillRR(ctx, lb.x - 6, lb.y - 3.5, 12, 3.5, 0.8, lb.color);
      ctx.fillStyle = '#fbf6ea'; ctx.fillRect(lb.x + 3.5, lb.y - 3, 2, 2.6);
      star(ctx, lb.x + Math.cos(t * 3) * 9, lb.y - 8 + Math.sin(t * 3) * 3, 1.6 + glow, '#fff3b0');
    }
  }

  // While chasing the cat or squishing worms, stray taps shouldn't open the upgrade sheet.
  blocksFloor(i) {
    return (this.cat && this.cat.i === i && !this.cat.leaving) || (this.worms && this.worms.i === i);
  }

  // Tap handling in floor-local coords. Returns true when consumed.
  hit(i, lx, ly) {
    const c = this.cat;
    if (c && c.i === i && !c.leaving) {
      const wn = L.window;
      if (lx > wn.x - 16 && lx < wn.x + wn.w + 16 && ly > wn.y - 10 && ly < wn.y + wn.h + 22) { this.tapCat(); return true; }
    }
    const wm = this.worms;
    if (wm && wm.i === i) {
      let best = null; let bd = 15;
      for (const x of wm.list) { if (!x.alive) continue; const d = Math.hypot(lx - x.x, ly - x.y); if (d < bd) { bd = d; best = x; } }
      if (best) {
        best.alive = false; best.pop = 0;
        const g = this.game; const amt = g.rewardCoins(6); g.earn(amt);
        g.s.stats.worms++; g.checkQuest();
        sfx.squish();
        this.w.fx.text(IX + best.x, floorTop(i) + best.y - 12, `+${fmt(amt)}`, { icon: 'coin', size: 9 });
        if (wm.list.every((x) => !x.alive)) this.endWorms(true);
        return true;
      }
    }
    const lb = this.lost;
    if (lb && lb.i === i && Math.hypot(lx - lb.x, ly - lb.y) < 18) { this.takeLost(); return true; }
    return false;
  }
}
