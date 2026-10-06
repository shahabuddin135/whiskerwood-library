// The mice who work at and visit the wings, so every building is as busy as a library floor:
//   ☕ café: customers order at the counter, wait at a table, the waiter brings tea, they tuck in;
//      the barista works the urn behind the counter.
//   🎪 hall: a janitor sweeps and a singer rehearses; on club nights the stage fills up
//      (book club, knitting circle, choir, cheese tasting, chess, poetry slam, dance class).
//   🖨️ press: the printer works the press, a porter carries book stacks, collectors browse.
//   🦴 museum: visitors gaze at the fossils, the guard naps, and school trips follow a guide.
// Coordinates are wing-interior local: x 0..184 from the inner left wall, y per storey 0..130.
import { drawMouse, fillRR, ell, circ, star } from './draw.js';
import { STOREY_H, CLUBS, wingStoreys } from '../data/wings.js';
import { WARDROBE } from '../data/visitors.js';
import { SIDE, INNER_W, HALL_CHAIRS, MUSEUM_SPOTS, wingX } from './wingArt.js';
import { glow } from './glow.js';

const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';
const DOOR = 10; const LANE = 104; const BACK = 100; const SEAT = 87; const STAGE = 80;
const WALK = 30;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
let seed = 1;

// visitors wear the town's outfits (see WARDROBE); children wear a cap, a bow or nothing
function look(small = false) {
  const w = pick(WARDROBE);
  if (small) return { fur: w.fur, belly: w.belly, scarf: w.scarf, hat: ['cap', 'bow', null][w.idx % 3], hatCol: w.hatCol, idx: w.idx, s: 0.58 };
  return { ...w, book: undefined, s: 0.74 + Math.random() * 0.08 };
}

// Where visitors go in each wing, and what they do there. `need: [u, k]` = only once that piece of
// upper-storey furniture is bought (u 0: second storey, 1: third storey).
const SPOTS = {
  cafe: [
    { k: 0, x: 20, y: SEAT, dir: 1, seated: true, pose: 'eat', item: 'cup', order: true, wait: true },
    { k: 0, x: 52, y: SEAT, dir: -1, seated: true, pose: 'eat', item: 'scone', order: true, wait: true },
    { k: 0, x: 68, y: SEAT, dir: 1, seated: true, pose: 'eat', item: 'scone', order: true, wait: true },
    { k: 0, x: 100, y: SEAT, dir: -1, seated: true, pose: 'eat', item: 'cup', order: true, wait: true },
    { k: 1, x: 22, y: SEAT, dir: 1, seated: true, pose: 'eat', item: 'cup' },
    { k: 1, x: 74, y: 77, dir: 1, seated: true, pose: 'read' },
    { k: 1, x: 96, y: 77, dir: -1, seated: true, pose: 'eat', item: 'scone' },
    { k: 1, x: 150, y: BACK, dir: 1, pose: 'reach' },
    { k: 2, x: 58, y: LANE, dir: 1, pose: 'hammer' }, // rolling out pastry
    { k: 2, x: 90, y: LANE, dir: -1, pose: 'eat', item: 'scone' }, // the official taster
    { k: 2, x: 30, y: LANE, dir: -1, pose: 'reach', need: [1, 0] }, // picking a loaf
    { k: 2, x: 108, y: LANE, dir: 1, pose: 'reach', need: [1, 4] }, // loading the dumbwaiter
  ],
  hall: [
    { k: 0, x: 124, y: BACK, dir: -1, pose: 'stand', alt: 'point' }, // reading the noticeboard
    { k: 0, x: 146, y: BACK, dir: 1, pose: 'stand', alt: 'wave' },
    { k: 0, x: HALL_CHAIRS[1], y: SEAT, dir: -1, seated: true, pose: 'sit', alt: 'clap' },
    { k: 0, x: HALL_CHAIRS[3], y: SEAT, dir: -1, seated: true, pose: 'sit' },
    { k: 1, x: 116, y: SEAT, dir: 1, seated: true, pose: 'knit', yarn: '#e8913a' },
    { k: 1, x: 142, y: SEAT, dir: -1, seated: true, pose: 'knit', yarn: '#9ec5f0' },
    { k: 1, x: 166, y: SEAT, dir: -1, seated: true, pose: 'knit', yarn: '#f7a8c4' },
    { k: 1, x: 90, y: BACK, dir: -1, pose: 'point' }, // admiring the quilt
    { k: 1, x: 76, y: SEAT, dir: -1, seated: true, pose: 'reach', need: [0, 1] }, // the potter
    { k: 1, x: 50, y: LANE, dir: -1, pose: 'reach', need: [0, 2] }, // the painter
    { k: 2, x: 66, y: LANE, dir: 1, pose: 'dance' }, { k: 2, x: 78, y: LANE, dir: -1, pose: 'dance' },
    { k: 2, x: 100, y: LANE, dir: 1, pose: 'dance' }, { k: 2, x: 112, y: LANE, dir: -1, pose: 'dance' },
    { k: 2, x: 42, y: LANE, dir: -1, pose: 'eat', item: 'cup', need: [1, 4] },
    { k: 2, x: 130, y: BACK, dir: -1, pose: 'wave', need: [1, 1] }, // waving at the mirror
  ],
  press: [
    { k: 0, x: 170, y: LANE, dir: 1, pose: 'reach' }, // picking up fresh books
    { k: 0, x: 142, y: LANE, dir: -1, pose: 'stand', book: '#f4efe6', alt: 'wave' }, // watching the press
    { k: 1, x: 62, y: SEAT, dir: 1, seated: true, pose: 'knit', yarn: '#f4efe6' }, // stitching a binding
    { k: 1, x: 92, y: SEAT, dir: -1, seated: true, pose: 'read' },
    { k: 1, x: 154, y: BACK, dir: 1, pose: 'reach' },
    { k: 2, x: 38, y: SEAT, dir: 1, seated: true, pose: 'point' }, // typing
    { k: 2, x: 80, y: SEAT, dir: 1, seated: true, pose: 'point' },
    { k: 2, x: 164, y: LANE, dir: -1, pose: 'eat', item: 'cup', need: [1, 2] },
    { k: 2, x: 136, y: LANE, dir: -1, pose: 'reach', need: [1, 4] }, // the photographer
  ],
  museum: [
    { k: 0, x: MUSEUM_SPOTS[0] + 14, y: LANE, dir: -1, pose: 'stand', alt: 'point' },
    { k: 0, x: MUSEUM_SPOTS[1] + 14, y: LANE, dir: -1, pose: 'stand', alt: 'wave' },
    { k: 0, x: MUSEUM_SPOTS[2] - 14, y: LANE, dir: 1, pose: 'stand', alt: 'point' },
    { k: 0, x: MUSEUM_SPOTS[3] - 16, y: LANE, dir: 1, pose: 'stand', alt: 'wave' },
    { k: 1, x: 96, y: LANE, dir: -1, pose: 'stand', alt: 'point' },
    { k: 1, x: 64, y: LANE, dir: 1, pose: 'point' },
    { k: 1, x: 36, y: BACK, dir: -1, pose: 'reach' },
    { k: 1, x: 160, y: LANE, dir: 1, pose: 'stand', alt: 'wave', need: [0, 3] },
    { k: 2, x: 52, y: SEAT, dir: 1, seated: true, pose: 'point' }, { k: 2, x: 68, y: SEAT, dir: -1, seated: true, pose: 'sit' },
    { k: 2, x: 112, y: SEAT, dir: 1, seated: true, pose: 'point' }, { k: 2, x: 128, y: SEAT, dir: -1, seated: true, pose: 'point' },
  ],
};

// Club-night casts for the hall's stage and chairs (storey 0).
function clubCast(id) {
  const seats = (pose, extra = {}) => HALL_CHAIRS.map((x) => ({ x, y: SEAT, dir: -1, seated: true, pose, ...extra }));
  switch (id) {
    case 'book': return [{ x: 50, y: STAGE, dir: 1, pose: 'stand', book: '#b5523b', alt: 'wave' }, ...seats('read')];
    case 'knit': return HALL_CHAIRS.map((x, j) => ({ x, y: SEAT, dir: j % 2 ? -1 : 1, seated: true, pose: 'knit', yarn: ['#e0604a', '#4f7cac', '#ffd24a', '#9b6fb0'][j] }));
    case 'choir': return [34, 48, 62, 76].map((x) => ({ x, y: STAGE, dir: 1, pose: 'sing', robe: '#7a2f3a' }))
      .concat([{ x: 96, y: LANE, dir: -1, pose: 'point', baton: true }], seats('clap').slice(1));
    case 'cheese': return [{ x: 50, y: STAGE, dir: 1, pose: 'wave', chef: true }, ...[112, 132, 152, 172].map((x, j) => ({ x, y: BACK - 4, dir: j % 2 ? -1 : 1, pose: 'eat', item: 'cheese' }))];
    case 'chess': return HALL_CHAIRS.map((x, j) => ({ x, y: SEAT, dir: j % 2 ? -1 : 1, seated: true, pose: 'sit', think: true }));
    case 'poetry': return [{ x: 48, y: STAGE, dir: 1, pose: 'sing', poet: true, alt: 'wave' }, ...seats('clap')];
    case 'dance': return [{ x: 50, y: STAGE, dir: 1, pose: 'dance' }, ...[[100, 1], [112, -1], [130, 1], [142, -1], [160, 1], [172, -1]].map(([x, dir]) => ({ x, y: LANE, dir, pose: 'dance' }))];
    default: return [];
  }
}

export class WingSim {
  constructor(world, w) {
    this.world = world; this.w = w;
    this.visitors = [];
    this.cast = []; // club-night performers and audience
    this.clubId = null;
    this.spawnT = rand(0.5, 2);
    this.t = 0;
    this.talk = [];
    this.talkT = rand(3, 7);
    this.fx = [];
    this.waiter = { x: 112, state: 'pickup', timer: 1, target: null, dir: 1, t: 0 };
    this.porter = { x: 132, dir: 1, carrying: true, pause: 0, t: 0 };
    this.janitor = { x: 150, dir: 1, t: 0 };
    this.tour = null; this.tourT = rand(8, 16);
    this.prefilled = false;
  }

  spots(st) {
    const n = wingStoreys(st.lvl);
    return SPOTS[this.w.id].filter((s) => s.k < n && (!s.need || st.up?.[s.need[0]]?.[s.need[1]]));
  }

  /* ---------------- update ---------------- */
  update(dt, game, st, visible) {
    this.t += dt;
    const running = this.w.id === 'hall' && game.wingActionState('hall') === 'running';
    this.syncClub(running ? game.todaysClub().id : null);
    const spots = this.spots(st).filter((s) => !(running && s.k === 0));
    const cap = Math.min(spots.length, 2 + Math.floor(st.lvl / 4));
    if (!this.prefilled) { this.prefill(spots, cap); this.prefilled = true; }
    // new visitors
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = rand(3, 7) / (1 + st.lvl / 60);
      const free = spots.filter((s) => !this.visitors.some((v) => v.spot === s));
      if (free.length && this.visitors.length < cap) this.visitors.push(this.newVisitor(pick(free)));
    }
    for (let k = this.visitors.length - 1; k >= 0; k--) {
      const v = this.visitors[k]; v.t += dt;
      if (running && v.spot.k === 0 && v.state !== 'exit' && v.state !== 'leave') this.leave(v);
      if (!this.stepVisitor(v, dt)) this.visitors.splice(k, 1);
    }
    for (const c of this.cast) { c.t += dt; c.alpha = Math.min(1, c.alpha + dt * 1.5); if (c.out) { c.alpha = Math.max(0, c.alpha - dt * 3); } }
    this.cast = this.cast.filter((c) => !(c.out && c.alpha <= 0));
    this.updateStaff(dt, game, st, running);
    // little floating notes, hearts and "z"s
    for (const p of this.fx) { p.life -= dt; p.y += p.vy * dt; p.x += p.vx * dt; }
    this.fx = this.fx.filter((p) => p.life > 0);
    if (visible) this.updateTalk(dt, game, running);
    else this.talk = [];
  }

  prefill(spots, cap) {
    // open the doors with a few mice already inside, so a wing never looks empty
    const list = [...spots].sort(() => Math.random() - 0.5).slice(0, Math.max(1, cap - 1));
    for (const s of list) {
      const v = this.newVisitor(s);
      v.alpha = 1; v.x = s.x; v.state = 'do'; v.timer = rand(4, 14); v.served = true;
      this.visitors.push(v);
    }
  }

  newVisitor(spot) {
    return { spot, k: spot.k, x: DOOR, y: LANE, dir: 1, state: 'enter', timer: 0.4, alpha: 0, t: Math.random() * 5, look: look(), seed: seed++ % 97, served: !spot.wait };
  }
  leave(v) { v.state = 'exit'; v.y = LANE; v.target = DOOR; }
  moveTo(a, x, dt, speed = WALK) {
    const d = x - a.x; a.dir = d >= 0 ? 1 : -1;
    if (Math.abs(d) <= speed * dt) { a.x = x; return true; }
    a.x += Math.sign(d) * speed * dt; return false;
  }

  stepVisitor(v, dt) {
    const s = v.spot;
    switch (v.state) {
      case 'enter':
        v.alpha = Math.min(1, v.alpha + dt / 0.4); v.timer -= dt;
        if (v.timer <= 0) { v.state = s.order ? 'toCounter' : 'toSpot'; }
        break;
      case 'toCounter':
        if (this.moveTo(v, 112, dt)) { v.state = 'order'; v.timer = 1.4; v.dir = 1; }
        break;
      case 'order':
        v.timer -= dt; if (v.timer <= 0) v.state = 'toSpot';
        break;
      case 'toSpot':
        if (this.moveTo(v, s.x, dt)) { v.state = 'do'; v.dir = s.dir; v.y = s.y; v.timer = rand(10, 18); v.waitT = 7; }
        break;
      case 'do':
        if (s.wait && !v.served) { v.waitT -= dt; if (v.waitT <= 0) v.served = true; break; } // waiting for the waiter
        v.timer -= dt;
        if (v.timer <= 0) this.leave(v);
        break;
      case 'exit':
        if (this.moveTo(v, DOOR, dt)) { v.state = 'leave'; }
        break;
      case 'leave':
        v.alpha -= dt / 0.4; if (v.alpha <= 0) return false;
        break;
      default: break;
    }
    return true;
  }

  syncClub(id) {
    if (id === this.clubId) return;
    this.cast.forEach((c) => { c.out = true; });
    this.clubId = id;
    if (!id) return;
    this.cast = this.cast.concat(clubCast(id).map((c) => ({ ...c, k: 0, t: Math.random() * 4, alpha: 0, look: c.chef ? { fur: '#c9b29b', belly: '#f4e9dc', hat: 'chef', s: 0.8 } : c.poet ? { fur: '#8f7f73', belly: '#d9cdc2', hat: 'beret', hatCol: '#1f1f2e', scarf: '#1f1f2e', s: 0.8 } : { ...look(), vest: c.robe || look().vest }, seed: seed++ % 97 })));
    this.startedAt = this.t;
  }

  updateStaff(dt, game, st, running) {
    const id = this.w.id;
    if (id === 'cafe') {
      const wt = this.waiter; wt.t += dt;
      if (wt.state === 'pickup') { wt.dir = 1; wt.timer -= dt; if (wt.timer <= 0) { const hungry = this.visitors.find((v) => v.k === 0 && v.state === 'do' && !v.served && !v.claimed); if (hungry) { hungry.claimed = true; wt.target = hungry; wt.state = 'deliver'; } else { wt.timer = 1.5; } } }
      else if (wt.state === 'deliver') {
        const tgt = wt.target; const tx = tgt.x + (tgt.spot.dir > 0 ? 12 : -12);
        if (tgt.state !== 'do') { wt.state = 'back'; }
        else if (this.moveTo(wt, tx, dt, 34)) { wt.state = 'serve'; wt.timer = 1.1; wt.dir = tgt.x > wt.x ? 1 : -1; }
      } else if (wt.state === 'serve') { wt.timer -= dt; if (wt.timer <= 0) { if (wt.target) { wt.target.served = true; this.emote(wt.target, 'heart'); } wt.target = null; wt.state = 'back'; } }
      else if (wt.state === 'back') { if (this.moveTo(wt, 112, dt, 34)) { wt.state = 'pickup'; wt.timer = 1.2; } }
    }
    if (id === 'hall') {
      const j = this.janitor; j.t += dt;
      if (!running) { if (this.moveTo(j, j.dir > 0 ? 178 : 96, dt, 10)) j.dir *= -1; }
      if (running && Math.random() < dt * 1.4) {
        const c = pick(this.cast.filter((x) => !x.out));
        if (c) this.fx.push({ x: c.x + rand(-4, 4), y: c.y - (c.seated ? 32 : 40), vx: rand(2, 6), vy: -12, life: 1.6, max: 1.6, glyph: this.clubId === 'choir' || this.clubId === 'dance' ? pick(['♪', '♫']) : this.clubId === 'chess' ? '…' : this.clubId === 'cheese' ? '♥' : this.clubId === 'poetry' ? '✦' : '♥', k: 0, color: this.clubId === 'cheese' ? '#f06b8b' : '#6d5fa3' });
      }
    }
    if (id === 'press') {
      const p = this.porter; p.t += dt;
      if (p.pause > 0) { p.pause -= dt; if (p.pause <= 0) p.carrying = !p.carrying; }
      else if (this.moveTo(p, p.carrying ? 162 : 132, dt, 20)) p.pause = 1;
    }
    if (id === 'museum') {
      if (Math.random() < dt * 0.4) this.fx.push({ x: 177 + 4, y: 60, vx: 3, vy: -6, life: 1.8, max: 1.8, glyph: 'z', k: 0, color: '#7a8fa6' });
      this.updateTour(dt, st);
    }
  }

  // A school trip: a guide with a flag and three small mice, stopping at every fossil.
  updateTour(dt) {
    if (!this.tour) {
      this.tourT -= dt;
      if (this.tourT <= 0) {
        this.tourT = rand(28, 45);
        this.tour = { x: DOOR, dir: 1, stop: 0, pause: 0, alpha: 0, leaving: false, t: 0, kids: [0, 1, 2].map(() => ({ look: look(true), seed: seed++ % 97 })), guide: { fur: '#e8e1d8', belly: '#fffaf3', glasses: true, scarf: '#7a2f3a', hat: 'cap', hatCol: '#7a2f3a', s: 0.8 } };
      }
      return;
    }
    const tr = this.tour; tr.t += dt; tr.alpha = Math.min(1, tr.alpha + dt * 2);
    if (tr.pause > 0) { tr.pause -= dt; return; }
    if (tr.leaving) { if (this.moveTo(tr, DOOR, dt, 24)) { tr.alpha -= dt * 3; if (tr.alpha <= 0.05) this.tour = null; } return; }
    const target = MUSEUM_SPOTS[tr.stop] + 16;
    if (this.moveTo(tr, target, dt, 22)) {
      tr.pause = 3.2; tr.dir = -1;
      this.fx.push({ x: target - 30, y: 60, vx: 0, vy: -10, life: 1.2, max: 1.2, glyph: '!', k: 0, color: '#d9774b' });
      tr.stop++; if (tr.stop >= MUSEUM_SPOTS.length) tr.leaving = true;
    }
  }

  emote(a, kind) {
    this.fx.push({ x: a.x, y: a.y - (a.spot?.seated ? 30 : 38), vx: rand(-3, 3), vy: -14, life: 1.3, max: 1.3, glyph: kind === 'heart' ? '♥' : '!', k: a.k, color: '#f06b8b' });
  }

  /* ---------------- chatter ---------------- */
  speakers() {
    const list = this.visitors.filter((v) => v.state === 'do' && v.alpha > 0.8).map((v) => ({ a: v, k: v.k }));
    for (const c of this.cast) if (!c.out && c.alpha > 0.8) list.push({ a: c, k: 0, club: true });
    return list;
  }
  updateTalk(dt, game, running) {
    for (const b of this.talk) b.life -= dt;
    this.talk = this.talk.filter((b) => b.life > 0);
    if (!game.s.settings.chatter) return;
    this.talkT -= dt;
    if (this.talkT > 0) return;
    this.talkT = rand(5, 9);
    const sp = this.speakers(); if (!sp.length) return;
    const club = running ? CLUBS.find((c) => c.id === this.clubId) : null;
    if (!club && sp.length >= 2 && Math.random() < 0.35 && this.w.talk?.length) {
      const [q, a] = pick(this.w.talk);
      const one = pick(sp); const two = pick(sp.filter((x) => x !== one && x.k === one.k)) || null;
      if (two) { this.say(one.a, q, 3); this.say(two.a, a, 3.2, 2.4); return; }
    }
    const who = club ? pick(sp.filter((x) => x.club)) || pick(sp) : pick(sp);
    this.say(who.a, club ? pick(club.lines) : pick(this.w.lines), 3.4);
  }
  say(a, text, life, delay = 0) { this.talk.push({ a, text, life: life + delay, delay, max: life }); }

  /* ---------------- drawing ---------------- */
  // World position of a storey-local point.
  wx(x) { return wingX(this.w) + SIDE + x; }
  wy(k, y) { return -(k + 1) * STOREY_H + y; }

  mouse(ctx, a, o) {
    drawMouse(ctx, this.wx(a.x), this.wy(a.k ?? 0, a.y), { ...a.look, seed: a.seed, t: a.t, dir: a.dir, alpha: a.alpha ?? 1, ...o });
  }

  // Behind the café counter (drawn before the front layer).
  drawBack(ctx, st, t) {
    if (this.w.id === 'cafe') {
      const pose = Math.sin(t * 0.9) > 0.2 ? 'reach' : 'stand';
      drawMouse(ctx, this.wx(163), this.wy(0, 70), { fur: '#c9b29b', belly: '#f4e9dc', dir: -1, pose, t, apron: '#fff7ec', hat: 'chef', s: 0.8, noShadow: true });
    }
  }

  draw(ctx, st, t, game) {
    const id = this.w.id;
    const running = id === 'hall' && game.wingActionState('hall') === 'running';
    if (id === 'hall') this.drawClubBack(ctx, st, t, running);
    // staff
    if (id === 'cafe') {
      const wt = this.waiter; const carrying = wt.state === 'deliver' || wt.state === 'serve';
      this.mouse(ctx, { ...wt, k: 0, y: LANE, look: { fur: '#a98467', belly: '#ecd9c6', vest: '#1f1f2e', scarf: '#b5523b', s: 0.78 } }, { pose: carrying ? 'carry' : wt.state === 'back' ? 'walk' : 'stand', item: 'cups', t: wt.t * (wt.state === 'deliver' || wt.state === 'back' ? 1 : 0.3) });
    }
    if (id === 'hall' && !running) {
      const j = this.janitor;
      this.mouse(ctx, { ...j, k: 0, y: LANE, look: { fur: '#8f7f73', belly: '#d9cdc2', hat: 'cap', hatCol: '#4f7cac', s: 0.76 } }, { pose: 'sweep' });
      const sing = Math.sin(t * 0.8) > 0;
      drawMouse(ctx, this.wx(52), this.wy(0, STAGE), { fur: '#e8e1d8', belly: '#fffaf3', scarf: '#ffd24a', hat: 'bow', hatCol: '#f28b82', dir: 1, pose: sing ? 'sing' : 'stand', t, s: 0.8 });
      if (sing && Math.random() < 0.03) this.fx.push({ x: 60, y: STAGE - 40, vx: 6, vy: -12, life: 1.4, max: 1.4, glyph: '♪', k: 0, color: '#6d5fa3' });
    }
    if (id === 'hall' && st.decor?.[1]) drawMouse(ctx, this.wx(158), this.wy(0, SEAT - 2), { fur: '#b8aca1', belly: '#efe6dc', hat: 'beret', hatCol: '#1f1f2e', dir: 1, pose: Math.sin(t * 6) > 0 ? 'point' : 'reach', seated: true, t, s: 0.76 });
    if (id === 'press') {
      const run = game.wingActionState('press') === 'running';
      drawMouse(ctx, this.wx(48), this.wy(0, LANE), { fur: '#a98467', belly: '#ecd9c6', dir: 1, pose: run ? 'hammer' : Math.sin(t * 0.7) > 0.4 ? 'reach' : 'stand', t, apron: '#3a3440', hat: 'cap', hatCol: '#3a3440', s: 0.8 });
      const p = this.porter;
      this.mouse(ctx, { ...p, k: 0, y: LANE, look: { fur: '#d7b98f', belly: '#f7ead6', apron: '#3a3440', s: 0.76 } }, { pose: p.pause > 0 ? 'stand' : p.carrying ? 'carry' : 'walk', item: 'books' });
      if (st.decor?.[1]) drawMouse(ctx, this.wx(30), this.wy(0, LANE), { fur: '#e8e1d8', belly: '#fffaf3', glasses: true, dir: -1, pose: Math.sin(t * 1.3) > 0 ? 'reach' : 'stand', t, apron: '#3a3440', s: 0.72 });
    }
    // staff on the upper storeys
    const n = wingStoreys(st.lvl); const up = (u, k) => n > u + 1 && st.up?.[u]?.[k];
    if (id === 'cafe') {
      if (up(0, 2)) drawMouse(ctx, this.wx(124), this.wy(1, LANE), { fur: '#e8e1d8', belly: '#fffaf3', apron: '#fff7ec', scarf: '#b5523b', dir: -1, pose: Math.sin(t * 0.6) > 0.3 ? 'carry' : 'stand', t, s: 0.76 });
      if (n > 2) drawMouse(ctx, this.wx(150), this.wy(2, LANE), { fur: '#c9b29b', belly: '#f4e9dc', hat: 'chef', apron: '#fff7ec', dir: 1, pose: Math.sin(t * 0.8) > 0 ? 'reach' : 'stand', t, s: 0.8 });
    }
    if (id === 'hall' && up(1, 2)) drawMouse(ctx, this.wx(156), this.wy(2, LANE), { fur: '#8f7f73', belly: '#d9cdc2', hat: 'tophat', dir: 1, pose: Math.sin(t * 2) > 0 ? 'point' : 'stand', t, s: 0.76 });
    if (id === 'press') {
      if (up(0, 0)) drawMouse(ctx, this.wx(110), this.wy(1, LANE), { fur: '#a98467', belly: '#ecd9c6', apron: '#3a3440', dir: 1, pose: 'hammer', t: t * 0.6, s: 0.76 });
      if (up(1, 1)) drawMouse(ctx, this.wx(62), this.wy(2, BACK), { fur: '#e8e1d8', belly: '#fffaf3', glasses: true, scarf: '#1f1f2e', dir: -1, pose: 'point', t, s: 0.8 });
    }
    if (id === 'museum') {
      drawMouse(ctx, this.wx(177), this.wy(0, 86), { fur: '#8f7f73', belly: '#d9cdc2', hat: 'cap', hatCol: '#2f4f7a', vest: '#2f4f7a', dir: -1, pose: 'sit', sleep: true, t: t * 0.3, s: 0.74, noShadow: true });
      if (n > 1) drawMouse(ctx, this.wx(140), this.wy(1, LANE), { fur: '#d7b98f', belly: '#f7ead6', hat: 'beret', hatCol: '#b5523b', dir: 1, pose: Math.sin(t * 0.9) > 0 ? 'reach' : 'stand', t, s: 0.76 });
      if (up(1, 0)) drawMouse(ctx, this.wx(150), this.wy(2, LANE), { fur: '#e8e1d8', belly: '#fffaf3', monocle: true, hat: 'wizard', hatCol: '#2f3a6a', dir: 1, pose: 'reach', t, s: 0.78 });
      const tr = this.tour;
      if (tr) {
        const back = -tr.dir;
        tr.kids.forEach((kd, j) => drawMouse(ctx, this.wx(tr.x + back * (12 + j * 10)), this.wy(0, LANE), { ...kd.look, seed: kd.seed, dir: tr.pause > 0 ? -1 : tr.dir, pose: tr.pause > 0 ? (Math.sin(tr.t * 3 + j) > 0.3 ? 'wave' : 'stand') : 'walk', t: tr.t + j, alpha: tr.alpha }));
        drawMouse(ctx, this.wx(tr.x), this.wy(0, LANE), { ...tr.guide, dir: tr.dir, pose: tr.pause > 0 ? 'point' : 'walk', flag: '#f2c14e', t: tr.t, alpha: tr.alpha });
      }
    }
    // visitors
    for (const v of this.visitors) {
      const s = v.spot; const doing = v.state === 'do';
      let pose = v.state === 'order' ? 'pay' : doing ? s.pose : 'walk';
      if (doing && s.wait && !v.served) pose = 'sit';
      if (doing && s.alt && Math.sin(v.t * 0.7 + v.seed) > 0.55) pose = s.alt;
      this.mouse(ctx, v, { pose, seated: doing && s.seated, item: s.item, yarn: s.yarn, book: s.book || (pose === 'read' ? '#b5523b' : null) });
    }
    // club-night cast
    for (const c of this.cast) {
      const pose = c.alt && Math.sin(c.t * 0.9) > 0.5 ? c.alt : c.pose;
      this.mouse(ctx, c, { pose, seated: c.seated, item: c.item, yarn: c.yarn, baton: c.baton, book: c.book || (pose === 'read' ? '#3d7a5a' : null) });
    }
    if (id === 'hall') this.drawClubFront(ctx, st, t, running);
    this.drawFx(ctx);
  }

  // Props behind the club cast (light cones, the dance floor).
  drawClubBack(ctx, st, t, running) {
    if (!running) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (st.decor?.[2]) [26, 50, 74].forEach((x, j) => {
      const g = ctx.createLinearGradient(0, this.wy(0, 6), 0, this.wy(0, STAGE));
      g.addColorStop(0, `rgba(255,240,180,${0.28 + 0.06 * Math.sin(t * 2 + j)})`); g.addColorStop(1, 'rgba(255,240,180,0.02)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(this.wx(x - 2), this.wy(0, 6)); ctx.lineTo(this.wx(x + 2), this.wy(0, 6)); ctx.lineTo(this.wx(x + 14), this.wy(0, STAGE)); ctx.lineTo(this.wx(x - 14), this.wy(0, STAGE)); ctx.closePath(); ctx.fill();
    });
    if (this.clubId === 'dance' || (st.decor?.[3] && ['choir', 'poetry'].includes(this.clubId))) {
      const cols = ['255,120,160', '120,200,255', '255,220,120', '170,255,170'];
      for (let j = 0; j < 7; j++) {
        const x = 96 + ((t * 18 + j * 23) % 88); const y = LANE + Math.sin(t * 2 + j) * 3;
        glow(ctx, this.wx(x), this.wy(0, y), 10, cols[j % 4], 0.45);
      }
      if (st.decor?.[3]) for (let j = 0; j < 10; j++) { const a = t * 0.8 + j; star(ctx, this.wx(130 + Math.cos(a) * (30 + j * 5)), this.wy(0, 21 + Math.sin(a * 1.3) * (20 + j * 4)), 1.4, 'rgba(255,255,255,0.8)', 4, 0.4); }
    }
    ctx.restore();
  }

  // Props in front of the club cast: the long cheese table, chessboards, the microphone, a scarf.
  drawClubFront(ctx, st, t, running) {
    if (!running) return;
    const X = (x) => this.wx(x); const Y = (y) => this.wy(0, y);
    const prog = Math.min(1, (this.t - (this.startedAt || 0)) / 300);
    switch (this.clubId) {
      case 'cheese': {
        fillRR(ctx, X(100), Y(84), 82, 4, 1.5, '#b98457'); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(X(103), Y(88), 3, 8); ctx.fillRect(X(176), Y(88), 3, 8);
        ctx.fillStyle = '#fff7ec'; ctx.fillRect(X(100), Y(86), 82, 5);
        [[110, '#ffcf3f'], [128, '#f4efe6'], [146, '#e8a41f'], [164, '#dfe6c8']].forEach(([x, c]) => { ell(ctx, X(x), Y(83), 7, 1.6, '#e9e1cf'); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(X(x - 5), Y(82)); ctx.lineTo(X(x + 5), Y(82)); ctx.lineTo(X(x + 5), Y(77)); ctx.closePath(); ctx.fill(); circ(ctx, X(x + 2), Y(80), 0.8, 'rgba(0,0,0,0.15)'); });
        break;
      }
      case 'chess': {
        [112, 144].forEach((x) => {
          ctx.fillStyle = '#6b4128'; ctx.fillRect(X(x - 1), Y(80), 2, 16);
          fillRR(ctx, X(x - 8), Y(78), 16, 3, 0.8, '#8a5a3a');
          for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { ctx.fillStyle = (r + c) % 2 ? '#fbf6ea' : '#3a2a20'; ctx.fillRect(X(x - 6 + c * 3), Y(76.5 - r * 1.5), 3, 1.5); }
          circ(ctx, X(x - 3), Y(74.5), 1, '#fbf6ea'); circ(ctx, X(x + 3), Y(74.5), 1, '#1d1b24');
        });
        break;
      }
      case 'poetry': {
        ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(62), Y(STAGE)); ctx.lineTo(X(62), Y(STAGE - 26)); ctx.lineTo(X(58), Y(STAGE - 30)); ctx.stroke();
        ell(ctx, X(57), Y(STAGE - 31), 2, 2.6, '#6d6a80'); ell(ctx, X(62), Y(STAGE), 5, 1.3, '#3a3440');
        break;
      }
      case 'knit': {
        // one enormous scarf, growing all evening
        const len = 20 + prog * 70; const cols = ['#e0604a', '#4f7cac', '#ffd24a', '#9b6fb0'];
        for (let x = 0; x < len; x += 5) { ctx.fillStyle = cols[Math.floor(x / 5) % 4]; ctx.fillRect(X(100 + x), Y(LANE + 2 + Math.sin(x * 0.2) * 1.5), 5.2, 4); }
        [[98, '#e0604a'], [180, '#9b6fb0']].forEach(([x, c]) => { circ(ctx, X(x), Y(LANE + 3), 3.4, c); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(X(x), Y(LANE + 3), 2, 0, 4); ctx.stroke(); });
        break;
      }
      default: break;
    }
  }

  drawFx(ctx) {
    for (const p of this.fx) {
      const a = Math.min(1, p.life / (p.max * 0.5));
      ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.font = `700 ${p.glyph === '♥' ? 9 : 8}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.glyph, this.wx(p.x), this.wy(p.k, p.y));
    }
    ctx.globalAlpha = 1;
  }

  // Speech bubbles go on top of everything in the wing.
  drawTalk(ctx) {
    for (const b of this.talk) {
      if (b.life > b.max) continue; // still waiting for its turn in a conversation
      const a = b.a; if (!a || (a.alpha ?? 1) < 0.5) continue;
      const x = this.wx(a.x); const y = this.wy(a.k ?? 0, a.y) - ((a.spot?.seated || a.seated) ? 36 : 44);
      ctx.font = `600 7px ${FONT}`;
      const tw = Math.min(160, ctx.measureText(b.text).width + 12);
      const bx = Math.max(wingX(this.w) + 4, Math.min(wingX(this.w) + 196 - tw, x - tw / 2));
      ctx.globalAlpha = Math.min(1, b.life * 3, (b.max - b.life + 0.3) * 4);
      ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.roundRect?.(bx, y - 9, tw, 16, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(160,120,80,0.35)'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 3, y + 7); ctx.lineTo(x, y + 12); ctx.lineTo(x + 3, y + 7); ctx.fillStyle = '#fffaf0'; ctx.fill();
      ctx.fillStyle = '#4a3121'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.text, bx + tw / 2, y - 0.5, tw - 8);
    }
    ctx.globalAlpha = 1;
  }
}
void INNER_W; void ell;
