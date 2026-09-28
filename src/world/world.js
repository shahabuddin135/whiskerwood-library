// The living library: camera (pan + pinch zoom), input, simulation and rendering.
import { W, BX0, BX1, IX, FH, GROUND_H, ROOF_H, L, floorTop } from './layout.js';
import { paintRoomBack, paintRoomFront, shelfFill } from './roomArt.js';
import { drawSky, drawClouds, drawFar, drawGround, drawRoof, drawConstruction, drawBuildSign, drawComplete, timeOfDay, DAY_CYCLE } from './scenery.js';
import { drawPigeon, drawMouse } from './draw.js';
import { RoomSim } from './agents.js';
import { Effects } from './effects.js';
import { Ambient, seasonAt } from './ambient.js';
import { Events } from './events.js';
import { Chatter } from './chatter.js';
import { ROOMS } from '../data/rooms.js';
import { CELEBS, ROYALS, AUTHORS } from '../data/visitors.js';
import { fmt, fmtTime } from '../core/format.js';
import { sfx } from '../audio/sfx.js';
import { music } from '../audio/music.js';

const TOP_PAD = 190; // px reserved for the HUD (quest + tasks)
const BOTTOM_PAD = 118; // px reserved for the bottom bar
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2.6;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export class World {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.fx = new Effects();
    this.sims = ROOMS.map((_, i) => new RoomSim(i, this.simHooks()));
    this.ambient = new Ambient(this);
    this.events = new Events(this);
    this.chatter = new Chatter(this);
    this.cache = new Map();
    this.cam = { x: 0, y: 0, vx: 0, vy: 0, anim: null, hold: false };
    this.zoom = 1;
    this.zoomAnim = null;
    this.pinching = false;
    this.t = 0;
    this.ui = null; // set by UI
    this.pigeon = null;
    this.nextPigeon = performance.now() + rand(45, 70) * 1000;
    this.nextSpecial = performance.now() + rand(30, 45) * 1000;
    this.fisher = { bite: false, next: rand(6, 14) };
    this.ambientT = rand(4, 10);
    this.weatherT = 0;
    this.smokeT = 0;
    this.signRect = null;
    this.lastCoinSfx = 0;
    this.seasonOverride = null;
    this.timeOverride = null;
    this.season = seasonAt(Date.now() / 1000);
    this.prefillAll();
    this.resize();
    this.cam.y = this.defaultCamY();
    this.bindInput();
    window.addEventListener('resize', () => this.resize());
    document.fonts?.ready?.then(() => this.cache.clear());
  }

  /* ---------------- sizing, camera & zoom ---------------- */
  // Low-end phones: if frames are consistently slow, render at a lower resolution.
  trackPerf(dt) {
    if (this.lowPower) return;
    this.perf = this.perf || { t: 0, n: 0, slow: 0 };
    const p = this.perf; p.t += dt; p.n++;
    if (p.t >= 2) {
      const avg = p.t / p.n;
      p.slow = avg > 0.034 ? p.slow + 1 : 0;
      p.t = 0; p.n = 0;
      if (p.slow >= 2 && (window.devicePixelRatio || 1) > 1) { this.lowPower = true; this.resize(); console.info('Whiskerwood: low-power rendering enabled'); }
    }
  }

  resize() {
    const w = window.innerWidth; const h = window.innerHeight;
    this.dpr = this.lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.Wpx = w; this.Hpx = h;
    let base = Math.max(0.6, Math.min(w / W, h / 760, 2.2));
    if (w / W < base) base = w / W;
    this.baseScale = base;
    this.scale = base * this.zoom;
    this.cache.clear();
    this.cam.x = this.clampCamX(this.cam.x);
    this.cam.y = this.clampCam(this.cam.y);
  }
  viewW() { return this.Wpx / this.scale; }
  viewH() { return this.Hpx / this.scale; }
  defaultCamY() { return -(this.Hpx - BOTTOM_PAD - 90) / this.baseScale; }
  clampCamX(x) {
    const vw = this.viewW();
    if (vw >= W) return (W - vw) / 2; // whole width visible: keep centred
    return Math.max(-30, Math.min(W + 30 - vw, x));
  }
  setZoom(z, ax = this.Wpx / 2, ay = this.Hpx / 2) {
    const anchor = this.toWorld(ax, ay);
    this.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    this.scale = this.baseScale * this.zoom;
    this.cam.x = this.clampCamX(anchor.x - ax / this.scale);
    this.cam.y = anchor.y - ay / this.scale;
    this.cam.hold = false;
  }
  zoomBy(f, ax, ay) { this.zoomAnim = { from: this.zoom, to: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this.zoom * f)), t: 0, ax: ax ?? this.Wpx / 2, ay: ay ?? this.Hpx * 0.45 }; }
  resetZoom() { this.zoomAnim = { from: this.zoom, to: 1, t: 0, ax: this.Wpx / 2, ay: this.Hpx * 0.45 }; }
  topFloorIndex() {
    let top = 0;
    this.game.s.rooms.forEach((r, i) => { if (r.built || r.buildEnd) top = i; });
    return top;
  }
  contentTop() {
    const top = this.topFloorIndex();
    const hasSign = this.game.nextFloor() >= 0 || this.game.constructing() < 0;
    return floorTop(top) - ROOF_H - (hasSign ? 150 : 60);
  }
  camBounds() {
    const maxY = GROUND_H + BOTTOM_PAD / this.scale - this.viewH();
    const minY = this.contentTop() - TOP_PAD / this.scale;
    if (maxY < minY) { const mid = (minY + maxY) / 2; return [mid, mid]; } // everything fits: centre it
    return [minY, maxY];
  }
  clampCam(y) { const [a, b] = this.camBounds(); return Math.max(a, Math.min(b, y)); }
  panTo(worldY, smooth = true, worldX = null) {
    const target = this.clampCam(worldY - (this.viewH() - (BOTTOM_PAD - TOP_PAD) / this.scale) / 2);
    const tx = worldX == null ? this.cam.x : this.clampCamX(worldX - this.viewW() / 2);
    if (!smooth) { this.cam.y = target; this.cam.x = tx; this.cam.anim = null; return; }
    this.cam.anim = { from: this.cam.y, to: target, fx: this.cam.x, tx, t: 0 };
    this.cam.vy = 0; this.cam.vx = 0; this.cam.hold = false;
  }
  panToRoom(i) { this.panTo(floorTop(i) + FH / 2, true, (BX0 + BX1) / 2); }
  // Frame a floor inside a screen band (e.g. above the open upgrade sheet).
  panToRoomBetween(i, topPx, bottomPx) {
    const target = floorTop(i) + FH / 2 - ((topPx + bottomPx) / 2) / this.scale;
    const [a, b] = this.camBounds();
    this.cam.anim = { from: this.cam.y, to: Math.max(a - 400, Math.min(b + 400, target)), fx: this.cam.x, tx: this.clampCamX((BX0 + BX1) / 2 - this.viewW() / 2), t: 0 };
    this.cam.vy = 0; this.cam.vx = 0;
    this.cam.hold = true;
  }
  panToTop() { this.panTo(this.contentTop() + 220, true, (BX0 + BX1) / 2); }
  focusedRoom() {
    const centerY = this.cam.y + (TOP_PAD / this.scale + (this.viewH() - BOTTOM_PAD / this.scale)) / 2;
    let best = 0; let bd = 1e9;
    this.game.s.rooms.forEach((r, i) => { if (!r.built) return; const d = Math.abs(floorTop(i) + FH / 2 - centerY); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  toScreen(wx, wy) { return { x: (wx - this.cam.x) * this.scale, y: (wy - this.cam.y) * this.scale }; }
  toWorld(sx, sy) { return { x: sx / this.scale + this.cam.x, y: sy / this.scale + this.cam.y }; }
  isVisible(i) {
    const y0 = floorTop(i);
    return y0 + FH > this.cam.y && y0 < this.cam.y + this.viewH();
  }
  isGardenVisible() { return this.cam.y + this.viewH() > 0; }

  /* ---------------- input: drag, fling, pinch, wheel ---------------- */
  bindInput() {
    const c = this.canvas;
    const pts = new Map();
    let down = null; let pinch = null;
    const startDrag = (p) => {
      down = { x: p.x, y: p.y, t: performance.now(), camX: this.cam.x, camY: this.cam.y, moved: false, samples: [{ x: p.x, y: p.y, t: performance.now() }] };
    };
    c.addEventListener('pointerdown', (e) => {
      try { c.setPointerCapture?.(e.pointerId); } catch { /* synthetic or already-released pointer */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.cam.vx = this.cam.vy = 0; this.cam.anim = null; this.cam.hold = false; this.zoomAnim = null;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: this.zoom, anchor: this.toWorld(mid.x, mid.y) };
        this.pinching = true;
        if (down) down.moved = true;
      } else if (pts.size === 1) startDrag({ x: e.clientX, y: e.clientY });
    });
    c.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        this.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinch.z0 * (d / pinch.d0)));
        this.scale = this.baseScale * this.zoom;
        this.cam.x = this.clampCamX(pinch.anchor.x - mid.x / this.scale);
        this.cam.y = pinch.anchor.y - mid.y / this.scale;
        return;
      }
      if (!down) return;
      const dx = e.clientX - down.x; const dy = e.clientY - down.y;
      if (Math.abs(dy) > 8 || Math.abs(dx) > 8) down.moved = true;
      if (down.moved) {
        const [a, b] = this.camBounds();
        let y = down.camY - dy / this.scale;
        if (y < a) y = a - (a - y) * 0.35; if (y > b) y = b + (y - b) * 0.35; // rubber band
        this.cam.y = y;
        this.cam.x = this.clampCamX(down.camX - dx / this.scale);
      }
      down.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (down.samples.length > 6) down.samples.shift();
    });
    const up = (e) => {
      const had = pts.delete(e.pointerId);
      if (!had) return;
      if (pinch) {
        if (pts.size < 2) { pinch = null; this.pinching = false; }
        if (pts.size === 1) { startDrag([...pts.values()][0]); down.moved = true; }
        return;
      }
      if (!down) return;
      const dt = performance.now() - down.t;
      if (!down.moved && dt < 600) this.handleTap(e.clientX, e.clientY);
      else {
        const s = down.samples; const a = s[0]; const b = s[s.length - 1];
        const vt = (b.t - a.t) / 1000;
        if (vt > 0 && performance.now() - b.t < 80) { this.cam.vy = (-(b.y - a.y) / this.scale) / vt; this.cam.vx = (-(b.x - a.x) / this.scale) / vt; }
      }
      down = null;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); down = null; pinch = null; this.pinching = false; });
    c.addEventListener('wheel', (e) => {
      e.preventDefault(); this.cam.anim = null; this.zoomAnim = null;
      if (e.ctrlKey || e.metaKey) { this.setZoom(this.zoom * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY); return; }
      this.cam.y = this.clampCam(this.cam.y + e.deltaY / this.scale);
      this.cam.x = this.clampCamX(this.cam.x + (e.shiftKey ? e.deltaY : e.deltaX) / this.scale);
    }, { passive: false });
  }

  handleTap(sx, sy) {
    const game = this.game;
    // Things in the sky (screen space)
    if (this.pigeon && !this.pigeon.caught && Math.hypot(sx - this.pigeon.x, sy - (this.pigeon.y + 14)) < 46) {
      this.pigeon.caught = true; this.pigeon.vx *= 2.2;
      sfx.coo(); sfx.sparkle();
      this.ui?.openParcel();
      return;
    }
    const sky = this.ambient.hitFront(sx, sy);
    if (sky === 'balloon') {
      const amt = game.rewardCoins(60); game.earn(amt); game.s.stats.balloons++; game.checkQuest();
      sfx.whistle(); sfx.collect(false);
      this.ui?.flyCoins({ x: sx, y: sy }, 10);
      this.ui?.toast(`🎈 The balloonist dropped a gift: +${fmt(amt)} coins!`, 'gold');
      return;
    }
    if (sky === 'wish') {
      game.addCheese(3); game.s.stats.wishes++;
      sfx.wish(); this.ui?.toast('🌠 You caught a shooting star! Wish granted: +3 golden cheese', 'gold');
      return;
    }
    const { x: wx, y: wy } = this.toWorld(sx, sy);

    // Build sign
    if (this.signRect && wx > this.signRect.x0 && wx < this.signRect.x1 && wy > this.signRect.y0 && wy < this.signRect.y1) {
      sfx.tap(); this.ui?.openBuild(game.nextFloor()); return;
    }
    // Floors
    if (wx > BX0 && wx < BX1 && wy < 0) {
      const i = Math.floor(-wy / FH);
      const r = game.s.rooms[i];
      if (r && r.built) {
        const lx = wx - IX; const ly = wy - floorTop(i);
        const sim = this.sims[i];
        if (this.events.hit(i, lx, ly)) return;
        if (this.events.blocksFloor(i)) { this.fx.text(wx, wy - 6, 'Missed!', { color: '#fff', size: 8, life: 0.7, stroke: '#6d3f8f' }); return; }
        const sp = sim.hitSpecial(lx, ly);
        if (sp) { this.greetSpecial(i, sp); return; }
        const rq = sim.hitRequest(lx, ly);
        if (rq) { this.fulfilRequest(i, rq); return; }
        if (lx > L.desk.x0 - 6 && lx < L.desk.x1 + 4 && ly > L.desk.top - 40 && ly < L.laneFront + 4) { this.ringBell(i); return; }
        const v = sim.hitVisitor(lx, ly);
        if (v) { this.petMouse(i, v, wx, wy); return; }
        sfx.open(); this.ui?.openRoom(i); return;
      }
      if (r && r.buildEnd) { sfx.tap(); this.ui?.openConstruction(i); return; }
    }
    // Garden
    if (this.ambient.hitGarden(wx, wy) === 'frog') { this.fx.hearts(wx, wy - 8, 1); return; }
    if (wy > 0 && wy < 70 && wx > 100 && wx < 190) { this.tapFisher(); return; }
    if (wy > 110 && wy < 210 && wx > 150 && wx < 320) { sfx.collect(false); this.fx.sparkle(wx, wy, 10, '#ffd257'); this.ui?.toast('💰 Your vault grows as you earn coins!'); }
  }

  petMouse(i, v, wx, wy) {
    const g = this.game;
    v.petted = true; sfx.squeak();
    const amt = Math.max(1, g.roomIncome(i) * 1.5); g.earn(amt);
    g.s.stats.pets++; g.checkQuest();
    this.fx.hearts(wx, wy - 12, 3); this.fx.text(wx, wy - 26, '+' + fmt(amt), { icon: 'coin', size: 10 });
    this.chatter.say(i, v, pick(['Hehe, that tickles!', 'Squee! ♥', 'Thank you!', 'Aww, hello!', 'Best librarian ever!', '*happy squeak*']), 2.2);
  }

  fulfilRequest(i, v) {
    const g = this.game;
    if (!this.sims[i].fulfilRequest(v)) return;
    v.book = pick(ROOMS[i].books);
    const amt = Math.max(5, g.roomIncome(i) * 12); g.earn(amt);
    g.s.stats.requests++; g.checkQuest();
    sfx.sparkle(); sfx.squeak();
    const x = IX + v.x; const y = floorTop(i) + v.y;
    this.fx.hearts(x, y - 30, 3); this.fx.text(x, y - 50, '+' + fmt(amt), { icon: 'coin', size: 11 });
    this.chatter.say(i, v, pick(["That's the one! Thank you!", 'You found it! ♥', 'My favourite book!', 'Wonderful!']), 2.4);
  }

  ringBell(i) {
    const amt = this.game.ringBell(i);
    sfx.bell();
    const x = IX + L.desk.x0 + 12; const y = floorTop(i) + L.desk.top - 8;
    this.fx.text(x, y - 10, '+' + fmt(amt), { icon: 'coin', size: 10 });
    this.fx.ring(x, y + 4, '#ffe28a');
    this.sims[i].stampT = 0.25;
  }

  tapFisher() {
    const f = this.fisher;
    if (f.bite) {
      f.bite = false; f.next = rand(10, 22);
      const g = this.game;
      const amt = g.rewardCoins(20);
      g.earn(amt); g.s.stats.fish++; g.checkQuest();
      sfx.drop(); sfx.collect(false);
      const catchName = pick(['a minnow', 'a goldfish', 'an old boot?!', 'a shiny trout', 'a lost key']);
      this.fx.text(120, 30, `🐟 ${catchName}! +${fmt(amt)}`, { color: '#bfe8ff', size: 10 });
      this.fx.sparkle(118, 44, 10, '#bfe8ff');
    } else {
      this.fx.text(165, -2, 'Shh… wait for a bite!', { color: '#fff', size: 8, life: 1.2 });
    }
  }

  greetSpecial(i, v) {
    v.greeted = true;
    this.game.greetSpecial();
    sfx.special();
    this.fx.hearts(IX + v.x, floorTop(i) + v.y - 30, 5);
    this.fx.sparkle(IX + v.x, floorTop(i) + v.y - 20, 14);
    this.chatter.shout(i, ['Wow, a celebrity!', 'Can I get an autograph?', 'Squee!!'], 2);
    this.ui?.onSpecialGreeted(i, v.special);
  }

  /* ---------------- simulation hooks ---------------- */
  simHooks() {
    return {
      onPay: (sim, v) => {
        const amt = this.game.flushRoom(sim.i);
        const x = IX + v.x; const y = floorTop(sim.i) + L.laneFront - 44;
        if (!this.isVisible(sim.i)) return;
        if (amt > 0) {
          this.fx.text(x, y, '+' + fmt(amt), { icon: 'coin', size: 10.5 });
          this.fx.coins(x + 6, y + 18, 2);
          const now = performance.now();
          if (now - this.lastCoinSfx > 140) { this.lastCoinSfx = now; sfx.coin(Math.floor(Math.random() * 5)); }
        } else if (this.game.jarFull) {
          this.fx.text(x, y, 'Jar full!', { color: '#ff9a8a', size: 9 });
        }
      },
      onRead: (sim) => { if (this.isVisible(sim.i) && Math.random() < 0.35) sfx.pageFlip(); },
      onEmote: (sim, v) => {
        if (!this.isVisible(sim.i)) return;
        const x = IX + v.x; const y = floorTop(sim.i) + v.y - 34;
        const r = Math.random();
        if (sim.fear) this.fx.note(x, y, '!', '#e0605a');
        else if (r < 0.4) this.fx.note(x, y, '♪', '#6d5fa3');
        else if (r < 0.7) this.fx.hearts(x, y + 6, 1);
        else if (r < 0.85) this.fx.note(x, y, '!', '#d9774b');
        else this.fx.note(x, y, 'z', '#7a8fa6');
      },
      onRequest: (sim, v) => { if (this.isVisible(sim.i)) { this.chatter.say(sim.i, v, pick(['Excuse me! Can you find this book?', 'Help! Where is my book?', 'Has anyone seen this one?']), 3); sfx.tap(); } },
      onRequestFail: (sim, v) => { if (this.isVisible(sim.i)) this.chatter.say(sim.i, v, pick(['Oh well… 😢', 'Never mind…', "I'll read something else."]), 2.2); },
      onSpecialArrive: (sim, v) => {
        const i = sim.i; const type = v.special.type; const dur = v.special.dur;
        if (type === 'celeb') this.game.addBoost({ mult: 2, sec: dur, room: i, label: v.special.name, icon: '⭐', key: `sp${i}` });
        if (type === 'author') this.game.addBoost({ mult: 3, sec: dur, room: i, label: v.special.name, icon: '✍️', key: `sp${i}` });
        if (type === 'royal') this.game.addBoost({ mult: 2, sec: dur, room: null, label: v.special.name, icon: '👑', key: `sp${i}` });
        if (type === 'critic') this.chatter.say(i, v, pick(['Hmm. Hmmmm.', 'Let me see…', '*scribble scribble*']), 3);
        if (this.isVisible(i)) this.fx.sparkle(IX + v.x, floorTop(i) + v.y - 20, 16);
      },
      onSpecialLeave: (sim, v) => {
        this.game.removeBoost(`sp${sim.i}`);
        if (v.special.type === 'critic') this.events.criticDone(sim.i);
        else this.ui?.specialLeft(sim.i);
      },
    };
  }

  spawnSpecial() {
    const g = this.game;
    const built = g.s.rooms.map((r, i) => (r.built ? i : -1)).filter((i) => i >= 0 && !this.sims[i].special);
    if (!built.length) return;
    const focus = this.focusedRoom();
    const pool = built.flatMap((i) => (i === focus ? [i, i, i] : [i]));
    const i = pool[Math.floor(Math.random() * pool.length)];
    const roll = Math.random();
    const royalChance = g.s.rooms[7]?.built ? 0.25 : 0.15; // the Royal Charter brings more royals
    let type = 'celeb';
    if (roll < royalChance && built.length >= 2) type = 'royal';
    else if (roll < royalChance + 0.27) type = 'author';
    const who = type === 'royal' ? pick(ROYALS) : type === 'author' ? AUTHORS[i] : pick(CELEBS);
    const dur = type === 'author' ? 30 : type === 'royal' ? 28 : 24;
    this.sims[i].spawnSpecial(type, who.name, who.look, dur);
    sfx.special();
    this.ui?.specialArrived(i, type, who.name);
  }

  prefillAll() {
    this.game.s.rooms.forEach((r, i) => { if (r.built) this.sims[i].prefill(ROOMS[i], r); });
  }

  resetForBranch() {
    this.sims = ROOMS.map((_, i) => new RoomSim(i, this.simHooks()));
    this.events = new Events(this);
    this.prefillAll();
    this.cache.clear();
    this.cam.anim = null; this.cam.hold = false; this.cam.vy = this.cam.vx = 0;
    this.zoom = 1; this.scale = this.baseScale;
    this.cam.x = this.clampCamX(0);
    this.cam.y = this.defaultCamY();
    this.fx.confetti((BX0 + BX1) / 2, -260, 90);
  }

  /* ---------------- update ---------------- */
  update(dt) {
    this.t += dt;
    this.trackPerf(dt);
    const game = this.game;
    const s = game.s;
    const nowMs = performance.now();

    // zoom + camera motion
    if (this.zoomAnim) {
      const z = this.zoomAnim; z.t = Math.min(1, z.t + dt / 0.28);
      const e = 1 - Math.pow(1 - z.t, 3);
      this.setZoom(z.from + (z.to - z.from) * e, z.ax, z.ay);
      if (z.t >= 1) this.zoomAnim = null;
    }
    if (this.cam.anim) {
      const a = this.cam.anim; a.t = Math.min(1, a.t + dt / 0.6);
      const e = 1 - Math.pow(1 - a.t, 3);
      this.cam.y = a.from + (a.to - a.from) * e;
      if (a.tx != null) this.cam.x = a.fx + (a.tx - a.fx) * e;
      if (a.t >= 1) this.cam.anim = null;
    } else if (!this.pinching && (Math.abs(this.cam.vy) > 1 || Math.abs(this.cam.vx) > 1)) {
      this.cam.y += this.cam.vy * dt; this.cam.x = this.clampCamX(this.cam.x + this.cam.vx * dt);
      const k = Math.exp(-3.8 * dt); this.cam.vy *= k; this.cam.vx *= k;
      const c = this.clampCam(this.cam.y);
      if (c !== this.cam.y) { this.cam.y += (c - this.cam.y) * Math.min(1, dt * 12); this.cam.vy *= 0.6; }
    } else if (!this.cam.hold && !this.pinching) {
      const c = this.clampCam(this.cam.y);
      if (Math.abs(c - this.cam.y) > 0.5) this.cam.y += (c - this.cam.y) * Math.min(1, dt * 10);
      this.cam.x = this.clampCamX(this.cam.x);
    }

    s.rooms.forEach((r, i) => { if (r.built) this.sims[i].update(dt, game, ROOMS[i], r); });
    this.fx.update(dt);
    this.events.update(dt);
    this.chatter.update(dt);

    // guests & pigeons
    if (nowMs > this.nextSpecial) {
      this.nextSpecial = nowMs + rand(55, 100) * 1000;
      if (s.questIdx >= 3 || s.stats.specials > 0) this.spawnSpecial();
    }
    if (!this.pigeon && nowMs > this.nextPigeon) {
      this.nextPigeon = nowMs + rand(85, 150) * 1000;
      if (s.questIdx >= 5) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        this.pigeon = { dir, x: dir > 0 ? -40 : this.Wpx + 40, y: TOP_PAD + rand(20, 120), vx: dir * rand(38, 52), t: 0, caught: false };
        sfx.coo();
      }
    }
    if (this.pigeon) {
      const p = this.pigeon; p.t += dt; p.x += p.vx * dt;
      if (p.x < -80 || p.x > this.Wpx + 80) this.pigeon = null;
    }

    // fishing bobber
    const f = this.fisher; f.next -= dt;
    if (f.next <= 0) { f.bite = !f.bite; f.next = f.bite ? 3.2 : rand(8, 18); }

    // time, seasons & weather
    const nowSec = Date.now() / 1000;
    const tod = timeOfDay(this.timeOverride != null ? this.timeOverride * DAY_CYCLE : nowSec); // override: 0..1 day phase (screenshots)
    this.tod = tod;
    const season = seasonAt(nowSec, this.seasonOverride);
    if (this.season && season.key !== this.season.key) { this.ui?.toast(`${season.icon} ${season.name} has come to the meadow!`, 'gold'); this.cache.clear(); }
    this.season = season;
    this.ambient.update(dt, tod, season);
    this.weatherT -= dt;
    if (this.weatherT <= 0) {
      this.weatherT = 1;
      if (this.ambient.wet) {
        const snow = this.ambient.weather.kind === 'snow';
        game.addBoost({ mult: snow ? 1.3 : 1.5, sec: 3, label: snow ? 'Snow Day' : 'Rainy Day', icon: snow ? '❄️' : '🌧️', key: 'weather' });
      }
    }
    this.ambientT -= dt;
    if (this.ambientT <= 0) { this.ambientT = rand(5, 12); if (tod.dark > 0.4) { if (season.key !== 'winter') sfx.cricket(); } else if (this.ambient.weather.kind !== 'rain') sfx.bird(); }
    music.setMode(tod.night ? 'night' : 'day');

    // chimney smoke
    this.smokeT -= dt;
    if (this.smokeT <= 0 && this.chimney) { this.smokeT = 0.45; this.fx.smoke(this.chimney.chimneyX, this.chimney.chimneyY); }

    const cons = game.constructing();
    if (cons >= 0 && this.isVisible(cons) && Math.random() < dt * 2.2) sfx.hammer();
  }

  /* ---------------- render ---------------- */
  // Room art is cached per floor; re-rendered when the floor changes or the zoom settles.
  roomArt(i) {
    const r = this.game.s.rooms[i];
    const fill = shelfFill(r.lvl);
    const key = `${r.shelves}|${r.seats}|${r.decor.join('')}|${fill}|${r.lvl >= 10}${r.lvl >= 25}${r.lvl >= 50}${r.lvl >= 100}`;
    const px = Math.min(3, Math.max(0.75, Math.round(this.scale * this.dpr * 2) / 2));
    const hit = this.cache.get(i);
    if (hit && hit.key === key && (hit.px === px || this.pinching || this.zoomAnim || this.budget <= 0)) return hit;
    this.budget--;
    const w = BX1 - BX0; const make = () => {
      const c = document.createElement('canvas');
      c.width = Math.ceil(w * px); c.height = Math.ceil(FH * px);
      const x = c.getContext('2d'); x.scale(px, px); return [c, x];
    };
    const [back, bx] = make(); paintRoomBack(bx, i, ROOMS[i], r, fill);
    const [front, fxx] = make(); paintRoomFront(fxx, ROOMS[i], r);
    const art = { key, px, back, front };
    this.cache.set(i, art);
    return art;
  }

  render() {
    const ctx = this.ctx; const d = this.dpr;
    const game = this.game; const s = game.s;
    const tod = this.tod || timeOfDay(Date.now() / 1000);
    const season = this.season;
    const t = this.t;
    this.budget = 2;
    const view = {
      W: this.Wpx, H: this.Hpx, t, camY: this.cam.y, scale: this.scale, camDefault: this.defaultCamY(),
      worldLeft: this.cam.x, worldRight: this.cam.x + this.viewW(),
      top: this.cam.y, bottom: this.cam.y + this.viewH(),
    };
    const screen = () => ctx.setTransform(d, 0, 0, d, 0, 0);
    const world = () => ctx.setTransform(d * this.scale, 0, 0, d * this.scale, -d * this.scale * this.cam.x, -d * this.scale * this.cam.y);

    screen();
    drawSky(ctx, view, tod);
    this.ambient.drawSkyFx(ctx, view);
    drawClouds(ctx, view, tod, this.ambient.weather.intensity);
    this.ambient.drawBirds(ctx);

    world();
    const scene = game.branch().scene;
    drawFar(ctx, view, tod, scene, t, season);
    this.ambient.drawBack(ctx, view, tod, season);
    if (view.bottom > -20) {
      drawGround(ctx, view, tod, scene, t, s.coins, this.fisher, season);
      this.ambient.drawGarden(ctx, view, tod, season);
    }
    screen();
    this.ambient.drawWeather(ctx, view, season);
    world();

    const top = this.topFloorIndex();
    for (let i = 0; i <= top; i++) {
      const y0 = floorTop(i);
      if (y0 > view.bottom || y0 + FH < view.top) continue;
      const r = s.rooms[i];
      if (r.built) this.drawRoom(ctx, i, y0, tod);
      else if (r.buildEnd) {
        const total = ROOMS[i].build * 1000;
        const rem = game.buildRemaining(i);
        drawConstruction(ctx, i, t, Math.min(1, 1 - (rem * 1000) / Math.max(1, total)), fmtTime(rem));
      }
    }
    this.ambient.drawExterior(ctx, view, tod, season, top, game.builtCount());
    const roofY = floorTop(top);
    this.chimney = drawRoof(ctx, roofY, t, tod, 'Whiskerwood Library', { winter: season.key === 'winter', fair: !!this.events.fair });

    const next = game.nextFloor();
    this.signRect = null;
    if (next > 0 && game.constructing() < 0) {
      const cost = ROOMS[next].unlock;
      this.signRect = drawBuildSign(ctx, roofY - ROOF_H - 60, t, ROOMS[next].name, fmt(cost), s.coins >= cost);
    } else if (next < 0 && game.constructing() < 0) drawComplete(ctx, roofY - ROOF_H - 50, t);

    this.fx.draw(ctx, view);

    screen();
    if (this.pigeon) {
      const p = this.pigeon;
      ctx.save(); ctx.translate(p.x, p.y + Math.sin(p.t * 3) * 8); ctx.scale(p.dir, 1);
      drawPigeon(ctx, 0, 0, p.t, 1.5, !p.caught);
      ctx.restore();
    }
    this.ambient.drawFront(ctx);
  }

  drawRoom(ctx, i, y0, tod) {
    const art = this.roomArt(i);
    const sim = this.sims[i];
    const r = this.game.s.rooms[i];
    const def = ROOMS[i];
    const w = BX1 - BX0;
    ctx.save(); ctx.translate(IX, y0);
    this.events.drawBehind(ctx, i); // things seen through the window
    ctx.restore();
    ctx.drawImage(art.back, BX0, y0, w, FH);
    ctx.save(); ctx.translate(IX, y0);
    const stamp = sim.stampT > 0;
    drawMouse(ctx, L.librarianX, 152, {
      fur: '#b8aca1', belly: '#efe6dc', dir: -1, pose: stamp ? 'wave' : 'stand', t: sim.librarianT,
      glasses: true, scarf: def.pal.accent, hat: r.staff >= 10 ? 'beret' : null, hatCol: def.pal.trim, s: 1, noShadow: true,
    });
    sim.drawSeated(ctx);
    ctx.restore();
    ctx.drawImage(art.front, BX0, y0, w, FH);
    ctx.save(); ctx.translate(IX, y0);
    sim.drawWalkers(ctx, this.t);
    this.events.drawOver(ctx, i);
    // lighting: evenings get cosy; lamps glow
    if (tod.dark > 0.05) {
      ctx.fillStyle = `rgba(18,20,58,${tod.dark * (r.decor[1] ? 0.22 : 0.4)})`;
      ctx.fillRect(0, 0, BX1 - BX0 - 16, 172);
    }
    if (r.decor[1]) {
      ctx.globalCompositeOperation = 'lighter';
      const a = 0.1 + tod.dark * 0.45;
      for (const lx of L.lamps) {
        const g = ctx.createRadialGradient(lx, 36, 2, lx, 60, 90);
        g.addColorStop(0, `rgba(255,214,140,${a})`); g.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = g; ctx.fillRect(lx - 90, 0, 180, 172);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    this.chatter.draw(ctx, i);
    ctx.restore();
  }
}
