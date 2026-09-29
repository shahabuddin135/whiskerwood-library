// Seasons, weather and all the little lives around the library.
import { W, BX0, BX1, FH, floorTop } from './layout.js';
import { ell, circ, rng, star, drawMouse, fillRR, shade } from './draw.js';
import { FURS, CLOTH } from '../data/visitors.js';
import { texFill } from './textures.js';
import { glow } from './glow.js';
import { WINGS } from '../data/wings.js';
import { wingX, SIDE } from './wingArt.js';
import { sfx } from '../audio/sfx.js';

export const SEASONS = [
  { key: 'spring', name: 'Spring', icon: '🌸', grass: ['#a3d582', '#7fbb66'], hills: ['#bfe0b4', '#97cd86'], trees: ['#f5b8cb', '#f9d0dc', '#9ccf7a'], flowers: ['#f7a8c4', '#fff3b0', '#ffffff', '#c8a8f0', '#ffb3c7'] },
  { key: 'summer', name: 'Summer', icon: '☀️', grass: ['#8cc56f', '#6ea85a'], hills: ['#a9d3b0', '#86c07a'], trees: ['#5d9450', '#6ea35a', '#4f8a44'], flowers: ['#ffd24a', '#ff8a5c', '#ffffff', '#f7a8c4', '#c8a8f0'] },
  { key: 'autumn', name: 'Autumn', icon: '🍂', grass: ['#bfc06c', '#9f9f50'], hills: ['#e0c98f', '#cfa95e'], trees: ['#e8913a', '#d9632d', '#f2c14e'], flowers: ['#e8913a', '#d9632d', '#f2c14e', '#b5523b', '#fff3b0'] },
  { key: 'winter', name: 'Winter', icon: '❄️', grass: ['#f4f8fc', '#dde6ef'], hills: ['#eef3f9', '#d9e2ec'], trees: ['#f1f5f9', '#d5dee8', '#c3cfdb'], flowers: [], bare: true },
];
// Season for a Mouse Calendar reading (see core/calendar.js). In the last moments of a season
// the landscape colours fade into the next one, so the change feels natural rather than a jump.
export function seasonFor(cal, override = null) {
  if (override != null) return SEASONS[override % 4];
  const cur = SEASONS[cal.idx];
  const blendSec = Math.min(20, cal.seasonSec * 0.12);
  if (cal.left >= blendSec) return cur;
  return blendSeason(cur, SEASONS[(cal.idx + 1) % 4], 1 - cal.left / blendSec);
}

function blendSeason(a, b, f) {
  const arr = (x, y) => (x.length === y.length ? x.map((c, k) => mixHex(c, y[k], f)) : f < 0.5 ? x : y);
  return { ...a, grass: arr(a.grass, b.grass), hills: arr(a.hills, b.hills), trees: arr(a.trees, b.trees), flowers: arr(a.flowers, b.flowers), blend: f };
}

function mixHex(a, b, f) {
  const p = (h) => parseInt(h.slice(1), 16);
  const x = p(a), y = p(b);
  const ch = (s) => Math.round(((x >> s) & 255) + (((y >> s) & 255) - ((x >> s) & 255)) * f);
  return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
}

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class Ambient {
  constructor(world) {
    this.w = world;
    this.t = 0;
    this.weather = { kind: 'clear', left: rand(50, 90), intensity: 0, rainbow: 0 };
    this.rain = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random(), s: rand(0.8, 1.2), l: rand(8, 14) }));
    this.flakes = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), r: rand(1, 2.6), p: Math.random() * 6, s: rand(0.5, 1) }));
    this.drift = Array.from({ length: 10 }, () => ({ x: Math.random(), y: Math.random(), r: rand(0, 6), vr: rand(-2, 2), s: rand(0.6, 1.1), p: Math.random() * 6 }));
    this.birds = [];
    this.nextBirds = rand(20, 40);
    this.stars = [];
    this.nextStar = rand(15, 30);
    this.balloon = null;
    this.nextBalloon = rand(240, 360);
    this.walkers = [];
    this.nextWalker = 1;
    this.cyclist = null;
    this.nextCyclist = rand(30, 60);
    this.snail = { x: 60, dir: 1 };
    this.frogs = [{ pad: 0, x: 70, y: 56, jump: null, next: rand(4, 10) }, { pad: 1, x: 140, y: 58, jump: null, next: rand(6, 12) }];
    this.ducks = { x: 60, dir: 1 };
    this.skater = { t: 0 };
    this.flies = Array.from({ length: 3 }, (_, k) => ({ x: 60 + k * 120, y: 30, p: Math.random() * 6, col: ['#ffd24a', '#f7a8c4', '#ffffff'][k] }));
  }

  get wet() { return (this.weather.kind === 'rain' || this.weather.kind === 'snow') && this.weather.intensity > 0.5; }

  update(dt, tod, season) {
    this.t += dt;
    const wx = this.weather;
    wx.left -= dt;
    if (wx.left <= 0) {
      if (wx.kind === 'rain') wx.rainbow = 1;
      if (wx.kind === 'rain' || wx.kind === 'snow') { wx.kind = 'clear'; wx.left = rand(150, 260); }
      else {
        const r = Math.random();
        wx.kind = r < 0.32 ? (season.key === 'winter' ? 'snow' : 'rain') : r < 0.55 ? 'cloudy' : 'clear';
        wx.left = wx.kind === 'clear' ? rand(120, 220) : rand(70, 130);
      }
    }
    if (season.key === 'winter' && wx.kind === 'rain') wx.kind = 'snow';
    const target = wx.kind === 'rain' || wx.kind === 'snow' ? 1 : wx.kind === 'cloudy' ? 0.4 : 0;
    wx.intensity += (target - wx.intensity) * Math.min(1, dt * 0.5);
    if (wx.rainbow > 0) wx.rainbow = Math.max(0, wx.rainbow - dt / 45);

    // birds by day, shooting stars by night
    this.nextBirds -= dt;
    if (this.nextBirds <= 0 && tod.dark < 0.3 && wx.kind !== 'rain') {
      this.nextBirds = rand(45, 90);
      const dir = Math.random() < 0.5 ? 1 : -1;
      if (!this.birds.length) this.birds.push({ x: dir > 0 ? -60 : this.w.Wpx + 60, y: rand(0.12, 0.34) * this.w.Hpx, vx: dir * rand(28, 40), n: 2 + Math.floor(Math.random() * 3), dir });
      if (Math.random() < 0.5) sfx.bird();
    }
    this.birds = this.birds.filter((b) => { b.x += b.vx * dt; return b.x > -120 && b.x < this.w.Wpx + 120; });
    this.nextStar -= dt;
    if (this.nextStar <= 0 && tod.dark > 0.45 && wx.intensity < 0.3) {
      this.nextStar = rand(14, 30);
      this.stars.push({ x: rand(0.2, 0.9) * this.w.Wpx, y: rand(0.08, 0.3) * this.w.Hpx, life: 1.3, max: 1.3, caught: false });
    }
    this.stars = this.stars.filter((s) => (s.life -= dt) > 0);

    // hot-air balloon (tap for a gift)
    this.nextBalloon -= dt;
    // only one flying visitor at a time: no balloon while the pigeon is out
    if (!this.balloon && this.nextBalloon <= 0 && tod.dark < 0.4 && this.w.game.s.questIdx >= 6 && !this.w.pigeon) {
      this.nextBalloon = rand(300, 480);
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.balloon = { x: dir > 0 ? -60 : this.w.Wpx + 60, y: rand(190, 320), vx: dir * rand(14, 20), t: 0, caught: false, cols: pick([['#f28b82', '#ffd24a'], ['#9ec5f0', '#ffffff'], ['#a3d9a5', '#f7c9d6'], ['#d4b3f0', '#ffd24a']]) };
    }
    if (this.balloon) {
      const b = this.balloon; b.t += dt; b.x += b.vx * dt; if (b.caught) b.y -= 40 * dt;
      if (b.x < -120 || b.x > this.w.Wpx + 120 || b.y < -120) this.balloon = null;
    }

    // garden life
    this.nextWalker -= dt;
    if (this.nextWalker <= 0) {
      this.nextWalker = rand(4, 9);
      // where are they going? the library, or one of the wings
      const g = this.w.game;
      const doors = [(BX0 + BX1) / 2 - 8, ...WINGS.filter((w) => g.wing(w.id).built).map((w) => wingX(w) + SIDE + 10)];
      const door = Math.random() < 0.45 ? doors[0] : pick(doors);
      if (this.walkers.length < 5) {
        const left = this.w.cam.x - 40; const right = this.w.cam.x + this.w.viewW() + 40;
        const fromLeft = Math.random() < 0.5;
        const dir = fromLeft ? 1 : -1;
        const f = pick(FURS);
        this.walkers.push({
          x: fromLeft ? Math.min(left, door - 60) : Math.max(right, door + 60), y: rand(12, 22), dir, t: Math.random() * 5, alpha: 1, door,
          look: { ...f, scarf: season.key === 'winter' || Math.random() < 0.4 ? pick(CLOTH) : null, hat: season.key === 'winter' ? 'bobble' : Math.random() < 0.3 ? pick(['beret', 'cap', 'flower', 'bow']) : null, hatCol: pick(CLOTH), book: Math.random() < 0.5 ? pick(CLOTH) : null },
        });
      }
    }
    this.walkers = this.walkers.filter((m) => {
      m.t += dt;
      const door = m.door ?? (BX0 + BX1) / 2 - 8;
      if (Math.abs(m.x - door) < 3) { m.alpha -= dt * 2.5; return m.alpha > 0; }
      m.x += Math.sign(door - m.x) * 24 * dt;
      m.dir = door > m.x ? 1 : -1;
      return Math.abs(m.x - door) < 1400;
    });
    this.nextCyclist -= dt;
    if (!this.cyclist && this.nextCyclist <= 0) { this.nextCyclist = rand(45, 90); const dir = Math.random() < 0.5 ? 1 : -1; this.cyclist = { x: dir > 0 ? -60 : W + 60, dir, t: 0 }; }
    if (this.cyclist) { const c = this.cyclist; c.t += dt; c.x += c.dir * 55 * dt; if (Math.abs(c.x - W / 2) < 2 && this.w.isGardenVisible()) sfx.bell(); if (c.x < -80 || c.x > W + 80) this.cyclist = null; }
    this.snail.x += this.snail.dir * 1.3 * dt; if (this.snail.x > 190 || this.snail.x < 40) this.snail.dir *= -1;
    for (const f of this.frogs) {
      if (f.jump) { f.jump.t += dt / 0.6; if (f.jump.t >= 1) { f.x = f.jump.tx; f.y = f.jump.ty; f.jump = null; } }
      else if ((f.next -= dt) <= 0) this.jumpFrog(f);
    }
    this.ducks.x += this.ducks.dir * 7 * dt; if (this.ducks.x > 150 || this.ducks.x < 35) this.ducks.dir *= -1;
  }

  jumpFrog(f, fromTap = false) {
    if (f.jump) return;
    const spots = [[70, 56], [140, 58], [120, 42], [100, 60]];
    const [tx, ty] = pick(spots.filter(([x]) => x !== f.x));
    f.jump = { fx: f.x, fy: f.y, tx, ty, t: 0 };
    f.next = rand(5, 12);
    if (fromTap || this.w.isGardenVisible()) {
      sfx.ribbit?.();
    }
  }

  /* ---------------- screen-space sky layers ---------------- */
  drawSkyFx(ctx, v) {
    const wx = this.weather;
    if (wx.intensity > 0.02) { ctx.fillStyle = `rgba(80,90,112,${0.38 * wx.intensity})`; ctx.fillRect(0, 0, v.W, v.H); }
    if (wx.rainbow > 0) {
      const a = Math.min(1, wx.rainbow * 3) * 0.32;
      const cx = v.W * 0.72; const cy = v.H * 0.62; const r0 = Math.min(v.W, v.H) * 0.55;
      ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc'].forEach((c, k) => {
        ctx.strokeStyle = c; ctx.globalAlpha = a; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(cx, cy, r0 - k * 7, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
  }

  drawBirds(ctx) {
    ctx.strokeStyle = 'rgba(58,52,64,0.7)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    for (const b of this.birds) {
      for (let k = 0; k < b.n; k++) {
        const bx = b.x - b.dir * Math.abs(k - (b.n >> 1)) * 16 - b.dir * k * 2; const by = b.y + Math.abs(k - (b.n >> 1)) * 9;
        const flap = 3 * Math.sin(this.t * 10 + k);
        ctx.beginPath(); ctx.moveTo(bx - 5, by - flap); ctx.quadraticCurveTo(bx - 2, by - 1, bx, by); ctx.quadraticCurveTo(bx + 2, by - 1, bx + 5, by - flap); ctx.stroke();
      }
    }
    for (const s of this.stars) {
      const k = 1 - s.life / s.max;
      const x = s.x + k * 160; const y = s.y + k * 70;
      const g = ctx.createLinearGradient(x, y, x - 50, y - 22);
      g.addColorStop(0, `rgba(255,250,220,${1 - k})`); g.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 50, y - 22); ctx.stroke();
      star(ctx, x, y, 3, `rgba(255,250,220,${1 - k})`);
    }
  }

  /* ---------------- world-space: behind the building ---------------- */
  drawBack(ctx, v, tod, season) {
    const tint = (hex) => mixDark(hex, tod.dark);
    // two big old trees hugging the library (each branch has its own kind)
    const scene = this.w.game.branch().scene;
    const tree = scene === 'cove' ? this.drawPalm : scene === 'pond' ? this.drawWillow : scene === 'castle' ? this.drawPine : scene === 'windmill' ? this.drawPoplar : this.drawTree;
    tree.call(this, ctx, BX0 - 10, 0, 1.15, season, tint, 11);
    tree.call(this, ctx, BX1 + 12, 0, 0.95, season, tint, 23);
  }

  drawPalm(ctx, x, y, s, season, tint, seed) {
    const sway = Math.sin(this.t * 0.9 + seed) * 3;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = tint('#8a6440'); ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, -90, 8 + sway, -180); ctx.stroke();
    ctx.strokeStyle = tint('#6b4a34'); ctx.lineWidth = 1.2; for (let k = 1; k < 18; k++) { const u = k / 18; const px = -4 * 2 * u * (1 - u) + (8 + sway) * u * u; const py = -180 * u; ctx.beginPath(); ctx.moveTo(px - 4, py); ctx.lineTo(px + 4, py - 2); ctx.stroke(); }
    const top = [8 + sway, -180];
    const fr = season.key === 'winter' ? '#7fa06a' : '#4f9a4a';
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI + (k / 6) * Math.PI + Math.sin(this.t + k) * 0.05;
      ctx.strokeStyle = tint(fr); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(...top); ctx.quadraticCurveTo(top[0] + Math.cos(a) * 30, top[1] + Math.sin(a) * 26 - 8, top[0] + Math.cos(a) * 52, top[1] + Math.sin(a) * 18 + 22); ctx.stroke();
    }
    [[-4, 6], [5, 8], [0, 12]].forEach(([dx, dy]) => circ(ctx, top[0] + dx, top[1] + dy, 4.5, tint('#7a5236')));
    if (season.key === 'winter') for (let k = 0; k < 5; k++) ell(ctx, top[0] - 30 + k * 15, top[1] + 4, 6, 2, '#f7fafc');
    ctx.restore();
  }

  drawWillow(ctx, x, y, s, season, tint, seed) {
    const R = rng(seed); const sway = Math.sin(this.t * 0.7 + seed) * 3;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = tint('#6b4a34'); ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-6, -70, -2, -130); ctx.lineTo(5, -130); ctx.quadraticCurveTo(7, -70, 11, 0); ctx.closePath(); ctx.fill();
    texFill(ctx, 'bark', 1);
    const cols = season.bare ? ['#9aa37a'] : season.key === 'autumn' ? ['#d9a441', '#e8c465', '#b5943a'] : ['#7fae62', '#8fbe6c', '#6e9e55'];
    for (let k = 0; k < 9; k++) { ell(ctx, -45 + R() * 90 + sway * 0.5, -150 - R() * 50, 22 + R() * 10, 14 + R() * 6, tint(cols[k % cols.length])); texFill(ctx, 'leaves', 1); }
    ctx.lineWidth = 1.3;
    for (let k = -60; k <= 60; k += 5) {
      ctx.strokeStyle = tint(cols[Math.abs(k) % cols.length]);
      const len = 70 + ((k * 13) % 30) + (season.bare ? -30 : 0);
      ctx.beginPath(); ctx.moveTo(k * 0.8, -150); ctx.quadraticCurveTo(k + sway, -110, k * 1.1 + sway * 1.5 + Math.sin(this.t + k) * 1.5, -150 + len); ctx.stroke();
    }
    if (season.key === 'winter') for (let k = 0; k < 6; k++) ell(ctx, -45 + R() * 90, -175 - R() * 30, 9, 3, '#f7fafc');
    ctx.restore();
  }

  drawPine(ctx, x, y, s, season, tint, seed) {
    const sway = Math.sin(this.t * 0.6 + seed) * 1.5;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = tint('#5b3f2e'); ctx.beginPath(); ctx.rect(-6, -40, 12, 40); ctx.fill(); texFill(ctx, 'bark', 1);
    const layers = 6;
    for (let k = 0; k < layers; k++) {
      const yb = -30 - k * 32; const w = 58 - k * 8.5;
      ctx.fillStyle = tint(k % 2 ? '#3f7a4f' : '#356b44');
      ctx.beginPath(); ctx.moveTo(-w + sway * (k / layers), yb); ctx.lineTo(sway * (k / layers + 0.2), yb - 48); ctx.lineTo(w + sway * (k / layers), yb); ctx.quadraticCurveTo(sway * 0.5, yb + 8, -w + sway * (k / layers), yb); ctx.fill();
      texFill(ctx, 'leaves', 0.8);
      if (season.key === 'winter') { ctx.fillStyle = '#f7fafc'; ctx.beginPath(); ctx.moveTo(-w * 0.8, yb - 6); ctx.lineTo(sway * 0.2, yb - 44); ctx.lineTo(w * 0.8, yb - 6); ctx.quadraticCurveTo(0, yb - 14, -w * 0.8, yb - 6); ctx.fill(); }
    }
    ctx.restore();
  }

  drawPoplar(ctx, x, y, s, season, tint, seed) {
    const R = rng(seed); const sway = Math.sin(this.t * 0.8 + seed) * 2;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = tint('#6b4a34'); ctx.beginPath(); ctx.rect(-5, -60, 10, 60); ctx.fill(); texFill(ctx, 'bark', 1);
    if (season.bare) {
      ctx.strokeStyle = tint('#6b4a34'); ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { const yy = -60 - k * 22; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo((k % 2 ? 1 : -1) * (14 - k) + sway, yy - 18); ctx.stroke(); }
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(sway, -240); ctx.stroke();
    } else {
      const cols = season.key === 'autumn' ? ['#e8c465', '#d9a441', '#f2d27a'] : season.key === 'spring' ? ['#9ccf7a', '#b6dd8a', '#8fc26a'] : ['#5d9450', '#6ea35a', '#4f8a44'];
      ell(ctx, sway * 0.5, -150, 26, 98, tint(cols[0])); texFill(ctx, 'leaves', 1);
      for (let k = 0; k < 12; k++) { ell(ctx, (R() - 0.5) * 30 + sway * (0.4 + R() * 0.4), -80 - R() * 150, 10 + R() * 6, 16 + R() * 10, tint(cols[k % cols.length])); texFill(ctx, 'leaves', 1); }
    }
    ctx.restore();
  }

  drawTree(ctx, x, y, s, season, tint, seed) {
    const R = rng(seed);
    const sway = Math.sin(this.t * 0.8 + seed) * 2;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = tint('#6b4a34');
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.quadraticCurveTo(-6, -80, -3, -150); ctx.lineTo(4, -150); ctx.quadraticCurveTo(6, -80, 10, 0); ctx.closePath(); ctx.fill();
    texFill(ctx, 'bark', 1);
    ctx.strokeStyle = tint('#6b4a34'); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -110); ctx.quadraticCurveTo(-26, -140, -40 + sway, -170); ctx.moveTo(1, -125); ctx.quadraticCurveTo(26, -150, 36 + sway, -185); ctx.stroke();
    if (season.bare) {
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-40 + sway, -170); ctx.lineTo(-52 + sway, -190); ctx.moveTo(36 + sway, -185); ctx.lineTo(44 + sway, -205); ctx.moveTo(0, -150); ctx.lineTo(-4 + sway, -215); ctx.stroke();
      for (let k = 0; k < 7; k++) ell(ctx, -50 + R() * 100 + sway, -160 - R() * 60, 8 + R() * 6, 3, '#f7fafc');
    } else {
      const cols = season.trees;
      for (let k = 0; k < 16; k++) {
        const cx = -55 + R() * 110 + sway * (0.6 + R() * 0.4); const cy = -150 - R() * 95;
        const rx = 20 + R() * 14; const ry = 17 + R() * 10;
        ell(ctx, cx, cy, rx, ry, tint(cols[k % cols.length]));
        texFill(ctx, 'leaves', 1);
        ell(ctx, cx - rx * 0.25, cy - ry * 0.3, rx * 0.5, ry * 0.4, 'rgba(255,255,230,0.10)');
      }
      if (season.key === 'spring') for (let k = 0; k < 18; k++) circ(ctx, -50 + R() * 100 + sway, -150 - R() * 90, 1.8, tint('#ffffff'));
      if (season.key === 'summer') for (let k = 0; k < 6; k++) circ(ctx, -45 + R() * 90 + sway, -140 - R() * 80, 2.6, tint('#e0404f'));
    }
    ctx.restore();
  }

  /* ---------------- world-space: garden life ---------------- */
  drawGarden(ctx, v, tod, season) {
    const t = this.t;
    const winter = season.key === 'winter';
    const tint = (hex) => mixDark(hex, tod.dark * 0.9);
    // seasonal props
    if (season.key === 'spring') for (let k = 0; k < 7; k++) { const x = 296 + k * 7; ctx.strokeStyle = tint('#4f8a44'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 84); ctx.lineTo(x, 74); ctx.stroke(); ell(ctx, x, 72, 2.6, 3.6, tint(['#f28b82', '#ffd24a', '#f7a8c4', '#c8a8f0'][k % 4])); }
    if (season.key === 'summer') for (let k = 0; k < 3; k++) { const x = 300 + k * 14; ctx.strokeStyle = tint('#4f8a44'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, 86); ctx.lineTo(x + Math.sin(t + k) * 1.5, 58); ctx.stroke(); for (let p = 0; p < 10; p++) { const a = (p / 10) * Math.PI * 2; ell(ctx, x + Math.cos(a) * 5 + Math.sin(t + k) * 1.5, 56 + Math.sin(a) * 5, 2.6, 1.3, tint('#ffd24a'), a); } circ(ctx, x + Math.sin(t + k) * 1.5, 56, 3.4, tint('#7a4b2e')); }
    if (season.key === 'autumn') [[304, 80, 7], [320, 84, 5], [290, 86, 4]].forEach(([x, y, r]) => { ell(ctx, x, y, r * 1.3, r, tint('#e8913a')); ctx.strokeStyle = tint('#c9731f'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(x, y, r * 0.5, r, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = tint('#5b7f4d'); ctx.fillRect(x - 0.8, y - r - 3, 1.6, 3); });
    if (winter) {
      circ(ctx, 308, 76, 10, '#fbfdff'); circ(ctx, 308, 60, 7.5, '#fbfdff'); circ(ctx, 308, 49, 5.5, '#fbfdff');
      circ(ctx, 306, 48, 0.9, '#1d1b24'); circ(ctx, 310.5, 48, 0.9, '#1d1b24');
      ctx.fillStyle = '#f28c28'; ctx.beginPath(); ctx.moveTo(308, 50); ctx.lineTo(314, 51); ctx.lineTo(308, 52); ctx.fill();
      fillRR(ctx, 301, 53.5, 14, 2.6, 1.2, '#c0504d'); ctx.fillStyle = '#3a3440'; ctx.fillRect(303.5, 38, 9, 6); ctx.fillRect(301.5, 43.5, 13, 1.6);
      ctx.strokeStyle = '#6b4a34'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(300, 60); ctx.lineTo(292, 54); ctx.moveTo(316, 60); ctx.lineTo(324, 53); ctx.stroke();
    }
    // puddles in the rain
    if (this.weather.kind === 'rain' && this.weather.intensity > 0.3) {
      [[214, 30], [228, 62], [60, 80], [360, 20]].forEach(([x, y], k) => {
        ell(ctx, x, y, 11, 2.6, 'rgba(160,190,220,0.55)');
        const rr = ((t * 1.5 + k * 0.37) % 1);
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - rr)})`; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(x, y, 3 + rr * 8, 0.8 + rr * 1.8, 0, 0, Math.PI * 2); ctx.stroke();
      });
    }
    // frozen pond skater or ducks & frogs
    if (winter) {
      const k = this.t * 0.6;
      const sx = 96 + Math.sin(k) * 45; const sy = 50 + Math.sin(k * 2) * 6;
      drawMouse(ctx, sx, sy, { fur: '#c9b29b', belly: '#f4e9dc', dir: Math.cos(k) > 0 ? 1 : -1, pose: 'wave', t: this.t, scarf: '#c0504d', hat: 'bobble', hatCol: '#4f7cac', s: 0.7 });
    } else {
      const dx = this.ducks.x; const dir = this.ducks.dir;
      [[0, 1], [-11, 0.62], [-19, 0.62]].forEach(([off, s], k) => {
        const x = dx + off * dir; const y = 47 + k * 2 + Math.sin(this.t * 2 + k) * 0.7;
        ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
        ell(ctx, 0, 0, 7, 3.6, k ? tint('#ffe066') : tint('#fbf6ea')); circ(ctx, 5, -4, 3, k ? tint('#ffe066') : tint('#fbf6ea'));
        ctx.fillStyle = '#f2a13e'; ctx.fillRect(7.5, -4.5, 3.2, 1.6); circ(ctx, 6, -4.8, 0.6, '#1d1b24');
        ctx.restore();
      });
      for (const f of this.frogs) {
        let x = f.x, y = f.y;
        if (f.jump) { const k = f.jump.t; x = f.jump.fx + (f.jump.tx - f.jump.fx) * k; y = f.jump.fy + (f.jump.ty - f.jump.fy) * k - Math.sin(k * Math.PI) * 16; }
        ell(ctx, x, y - 2.5, 5, 3.4, tint('#5fae4f')); ell(ctx, x, y - 1.5, 3.4, 1.8, tint('#bfe39a'));
        circ(ctx, x - 2.4, y - 5.4, 1.7, tint('#5fae4f')); circ(ctx, x + 2.4, y - 5.4, 1.7, tint('#5fae4f'));
        circ(ctx, x - 2.4, y - 5.6, 0.9, '#fff'); circ(ctx, x + 2.4, y - 5.6, 0.9, '#fff');
        circ(ctx, x - 2.3, y - 5.5, 0.45, '#1d1b24'); circ(ctx, x + 2.5, y - 5.5, 0.45, '#1d1b24');
      }
    }
    // butterflies by day in spring/summer
    if ((season.key === 'spring' || season.key === 'summer') && tod.dark < 0.35 && this.weather.kind !== 'rain') {
      for (const b of this.flies) {
        b.p += 0.016;
        const x = b.x + Math.sin(this.t * 0.4 + b.p) * 40; const y = 20 + Math.sin(this.t * 0.9 + b.p * 2) * 16;
        const f = Math.abs(Math.sin(this.t * 14 + b.p));
        ell(ctx, x - 2 * f, y, 2.6 * f + 0.3, 2.2, b.col); ell(ctx, x + 2 * f, y, 2.6 * f + 0.3, 2.2, b.col);
        ctx.fillStyle = '#3a3440'; ctx.fillRect(x - 0.4, y - 1.6, 0.8, 3.4);
      }
    }
    // snail on the foundation stones
    const sn = this.snail;
    ctx.save(); ctx.translate(sn.x, 7); ctx.scale(sn.dir, 1);
    ell(ctx, 0, 0, 5, 1.6, tint('#b8aca1')); circ(ctx, -1, -3, 3.4, tint('#c98b52')); ctx.strokeStyle = tint('#8a5a3a'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(-1, -3, 1.6, 0, Math.PI * 1.6); ctx.stroke();
    ctx.strokeStyle = tint('#b8aca1'); ctx.beginPath(); ctx.moveTo(4, -1); ctx.lineTo(5.5, -4.5); ctx.stroke();
    ctx.restore();
    // passers-by heading for the door
    const umbrella = this.weather.kind === 'rain' && this.weather.intensity > 0.3;
    for (const m of this.walkers) {
      drawMouse(ctx, m.x, m.y, { ...m.look, dir: m.dir, pose: 'walk', t: m.t, s: 0.72, alpha: m.alpha, umbrella: umbrella ? CLOTH[Math.floor(m.x * 7) % CLOTH.length] : null });
    }
    // postmouse on a bicycle
    if (this.cyclist) {
      const c = this.cyclist; const x = c.x; const y = 44;
      ctx.save(); ctx.translate(x, y); ctx.scale(c.dir, 1);
      ctx.strokeStyle = tint('#3a3440'); ctx.lineWidth = 1.1;
      [-8, 8].forEach((wx2) => { ctx.beginPath(); ctx.arc(wx2, 0, 5, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(wx2, 0); ctx.lineTo(wx2 + Math.cos(c.t * 10) * 5, Math.sin(c.t * 10) * 5); ctx.stroke(); });
      ctx.strokeStyle = tint('#c0504d'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-1, -7); ctx.lineTo(7, -7); ctx.lineTo(8, 0); ctx.moveTo(-1, -7); ctx.lineTo(1, 0); ctx.moveTo(7, -7); ctx.lineTo(8, -10); ctx.stroke();
      drawMouse(ctx, -1, -7, { fur: '#a98467', belly: '#ecd9c6', pose: 'sit', t: c.t, hat: 'cap', hatCol: '#4f7cac', s: 0.7, noShadow: true });
      fillRR(ctx, 6, -6, 7, 5, 1, tint('#c98b52'));
      ctx.restore();
    }
  }

  /* ---------------- world-space: on the building ---------------- */
  drawExterior(ctx, v, tod, season, topIndex, builtCount) {
    const t = this.t;
    const leaf = season.key === 'autumn' ? ['#d9632d', '#e8913a', '#b5523b'] : season.key === 'winter' ? ['#8a6a4c'] : season.key === 'spring' ? ['#7fc063', '#9ccf7a', '#f5b8cb'] : ['#4f8a44', '#5e9c55', '#6ea35a'];
    const ivyTop = Math.max(floorTop(Math.max(0, builtCount - 1)) + 60, v.top - 20);
    const ivyBot = Math.min(0, v.bottom + 20);
    if (ivyBot > ivyTop) [[BX0 + 3, 11], [BX1 - 3, 29]].forEach(([x, seed]) => {
      ctx.strokeStyle = mixDark('#5b7f4d', tod.dark); ctx.lineWidth = 1.2;
      const y0 = Math.floor(ivyBot / 12) * 12;
      ctx.beginPath(); ctx.moveTo(x + Math.sin(y0 * 0.08 + seed) * 3, y0);
      for (let y = y0; y > ivyTop; y -= 12) ctx.lineTo(x + Math.sin(y * 0.08 + seed) * 3, y);
      ctx.stroke();
      // leaves are placed by position, so the ivy looks the same wherever you scroll
      const cols = leaf.map((c) => mixDark(c, tod.dark * 0.9));
      for (let y = Math.floor(ivyBot / 6.5) * 6.5 - 6; y > ivyTop; y -= 6.5) {
        const R = rng(seed * 997 + Math.round(-y * 10));
        if (season.bare && R() < 0.6) continue;
        const lx = x + Math.sin(y * 0.08 + seed) * 3 + (R() - 0.5) * 9;
        ell(ctx, lx, y + (R() - 0.5) * 4, 3 + R() * 1.4, 2 + R(), cols[Math.floor(R() * cols.length)], R() * 3);
      }
    });
    // lanterns at every floor
    for (let i = 0; i <= topIndex; i++) {
      const y = floorTop(i) + 50;
      if (y < v.top - 40 || y > v.bottom + 40) continue; // only the lanterns you can see
      [[BX0 - 7, 1], [BX1 + 7, -1]].forEach(([x, side]) => {
        ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + side * 7, y - 12); ctx.lineTo(x, y - 12); ctx.lineTo(x, y - 8); ctx.stroke();
        fillRR(ctx, x - 3.5, y - 8, 7, 10, 1.5, '#3a3440');
        ctx.fillStyle = tod.dark > 0.3 ? '#ffe39a' : '#f3ead3'; ctx.fillRect(x - 2.3, y - 6.5, 4.6, 7);
        if (tod.dark > 0.3) {
          ctx.globalCompositeOperation = 'lighter';
          glow(ctx, x, y - 3, 26, '255,214,130', 0.5 * tod.dark + Math.sin(t * 7 + i) * 0.03);
          ctx.globalCompositeOperation = 'source-over';
        }
      });
    }
  }

  /* ---------------- screen-space weather (behind rooms) ---------------- */
  drawWeather(ctx, v, season) {
    const wx = this.weather; const t = this.t;
    const Wd = v.W; const H = v.H;
    if (wx.kind === 'rain' || (wx.intensity > 0.05 && season.key !== 'winter' && this.weather.kind !== 'snow')) {
      const a = 0.45 * wx.intensity;
      if (a > 0.02) {
        ctx.strokeStyle = `rgba(210,228,255,${a})`; ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (const d of this.rain) {
          d.y = (d.y + 0.016 * 1.4 * d.s) % 1;
          const x = ((d.x + t * 0.02) % 1) * Wd; const y = d.y * H;
          ctx.moveTo(x, y); ctx.lineTo(x - 3, y + d.l);
        }
        ctx.stroke();
      }
    }
    const snowing = wx.kind === 'snow' || season.key === 'winter' || season.festiveSnow;
    if (snowing) {
      const count = Math.floor(this.flakes.length * (wx.kind === 'snow' ? Math.max(0.3, wx.intensity) : 0.25));
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let k = 0; k < count; k++) {
        const f = this.flakes[k];
        f.y = (f.y + 0.0016 * f.s) % 1;
        const x = ((f.x + Math.sin(t * 0.8 + f.p) * 0.02) % 1 + 1) % 1 * Wd;
        ctx.beginPath(); ctx.arc(x, f.y * H, f.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    if ((season.key === 'spring' || season.key === 'autumn') && wx.kind !== 'rain') {
      const cols = season.key === 'spring' ? ['#f9c6d6', '#ffffff', '#f5b8cb'] : ['#e8913a', '#d9632d', '#f2c14e'];
      this.drift.forEach((p, k) => {
        p.y = (p.y + 0.0011 * p.s) % 1; p.r += p.vr * 0.016;
        const x = ((p.x + Math.sin(t * 0.6 + p.p) * 0.05 + t * 0.006) % 1 + 1) % 1 * Wd;
        ctx.save(); ctx.translate(x, p.y * H); ctx.rotate(p.r); ctx.scale(Math.cos(t * 2 + p.p), 1);
        ell(ctx, 0, 0, season.key === 'spring' ? 3 : 4.5, season.key === 'spring' ? 2 : 2.6, cols[k % cols.length]);
        ctx.restore();
      });
    }
  }

  /* ---------------- screen-space interactive extras (in front) ---------------- */
  drawFront(ctx) {
    const b = this.balloon;
    if (!b) return;
    const x = b.x; const y = b.y + Math.sin(b.t * 0.8) * 6;
    ctx.save(); ctx.translate(x, y); ctx.scale(1.25, 1.25);
    ctx.strokeStyle = 'rgba(80,60,40,0.7)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-6, 26); ctx.moveTo(10, 8); ctx.lineTo(6, 26); ctx.stroke();
    ell(ctx, 0, -8, 18, 21, b.cols[0]);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -8, 18, 21, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = b.cols[1]; for (let k = -2; k <= 2; k++) ctx.fillRect(k * 7 - 1.8, -30, 3.6, 44);
    ctx.restore();
    ell(ctx, -6, -16, 4, 7, 'rgba(255,255,255,0.35)');
    if (!b.caught) drawMouse(ctx, 0, 25, { fur: '#c9b29b', belly: '#f4e9dc', pose: 'wave', t: b.t, scarf: '#4f7cac', s: 0.62, noShadow: true });
    fillRR(ctx, -7, 24, 14, 9, 2, '#a0764f'); ctx.fillStyle = '#8a6440'; ctx.fillRect(-7, 27, 14, 1.2);
    if (!b.caught) { ctx.fillStyle = '#fff'; ctx.font = '600 7px "Fredoka",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('tap me!', 0, 44 + Math.sin(b.t * 4)); }
    ctx.restore();
  }

  // Returns a reward kind if something in the sky was tapped.
  hitFront(sx, sy) {
    const b = this.balloon;
    if (b && !b.caught && Math.hypot(sx - b.x, sy - (b.y + 5)) < 42) { b.caught = true; return 'balloon'; }
    for (const s of this.stars) {
      if (s.caught) continue;
      const k = 1 - s.life / s.max; const x = s.x + k * 160; const y = s.y + k * 70;
      if (Math.hypot(sx - x, sy - y) < 40) { s.caught = true; s.life = Math.min(s.life, 0.2); return 'wish'; }
    }
    return null;
  }
  hitGarden(wx, wy) {
    for (const f of this.frogs) if (Math.hypot(wx - f.x, wy - (f.y - 3)) < 10) { this.jumpFrog(f, true); return 'frog'; }
    return null;
  }
}

function mixDark(hex, dark) {
  const n = parseInt(hex.slice(1), 16);
  const k = Math.min(0.75, dark * 1.05);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgb(${Math.round(r + (27 - r) * k)},${Math.round(g + (36 - g) * k)},${Math.round(b + (71 - b) * k)})`;
}
