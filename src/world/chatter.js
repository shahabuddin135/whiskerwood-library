// Speech bubbles: the mice chat about their books, argue about endings, react to what you do
// and to whatever is happening. Bubbles are drawn in a final pass over the whole tower so a
// bubble near the ceiling is never hidden behind the floor above.
import { L, IX, floorTop } from './layout.js';
import { rr } from './draw.js';
import { GENERIC, GENRE, LOCATION_LINES, SEASON_LINES, WEATHER_LINES, NIGHT_DARK, NIGHT_LAMP, LIBRARIAN, RECOMMEND, FOURTH_WALL, SKITS, LOCATION_SKITS, REACTIONS } from '../data/dialogue.js';
import { REGULAR } from '../data/regulars.js';

const FONT = '600 7.5px "Fredoka", "Baloo 2", system-ui, sans-serif';
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const LIB_POS = { lib: true, x: L.librarianX, y: 152 };

export class Chatter {
  constructor(world) {
    this.w = world;
    this.bubbles = [];
    this.next = 2.5;
    this.skitT = rand(14, 22);
    this.queue = []; // scheduled skit lines
    this.recent = []; // avoid repeating lines
    this.cool = {}; // reaction cooldowns
  }

  get on() { return this.w.game.s.settings.chatter !== false; }

  say(i, v, text, life = 3.2, style = null) {
    if (!text) return;
    this.bubbles = this.bubbles.filter((b) => b.v !== v);
    this.bubbles.push({ i, v, text, life, max: life, style });
    if (this.bubbles.length > 7) this.bubbles.shift();
    this.recent.push(text); if (this.recent.length > 24) this.recent.shift();
  }
  lib(i, text, life = 3) { this.say(i, LIB_POS, text, life, 'lib'); }

  readers(i, n = 2, exclude = []) {
    const sim = this.w.sims[i];
    return sim.visitors.filter((v) => !v.special && v.alpha > 0.7 && v.state !== 'request' && !exclude.includes(v)).sort(() => Math.random() - 0.5).slice(0, n);
  }

  // Everyone on a floor reacts at once (cats! spoilers! "the movie was better"!).
  shout(i, lines, n = 2, life = 2.4) {
    this.readers(i, n).forEach((v, k) => setTimeout(() => this.say(i, v, typeof lines === 'string' ? lines : pick(lines), life), k * 280));
  }

  // A reaction to something the player did, with a per-kind cooldown so it never spams.
  react(kind, i = null, cooldown = 6) {
    if (!this.on) return;
    const now = performance.now();
    if (this.cool[kind] && now - this.cool[kind] < cooldown * 1000) return;
    const lines = REACTIONS[kind];
    if (!lines) return;
    const floor = i ?? this.visibleFloor();
    if (floor == null) return;
    const v = this.readers(floor, 1)[0];
    if (!v) return;
    this.cool[kind] = now;
    this.say(floor, v, pick(lines), 2.6);
  }

  visibleFloor() {
    const w = this.w;
    const floors = w.game.s.rooms.map((r, k) => (r.built && w.isVisible(k) ? k : -1)).filter((k) => k >= 0);
    return floors.length ? pick(floors) : null;
  }

  // Two readers on the same floor play out a little conversation.
  skit(i, lines = null) {
    const list = lines || this.pickSkit();
    const [a, b] = this.readers(i, 2);
    if (!a || !b) return false;
    let t = 0;
    for (const [who, text] of list) {
      const life = Math.min(3.6, 1.6 + text.length * 0.045);
      this.queue.push({ at: t, i, who, text, a, b, life });
      t += life * 0.82;
    }
    return true;
  }
  pickSkit() {
    const loc = this.w.game.loc().id;
    const pool = [...SKITS, ...(LOCATION_SKITS[loc] || []), ...(LOCATION_SKITS[loc] || [])];
    return pick(pool);
  }

  context(i) {
    const w = this.w; const g = w.game; const r = g.s.rooms[i];
    const sim = w.sims[i];
    return {
      night: w.tod?.dark > 0.35, lamps: r.decor[1], rug: r.decor[0],
      seatsFull: sim.seatTaken.slice(0, r.seats).every(Boolean), canSeat: r.seats < 6,
      jarFull: g.jarFull, bells: g.s.stats.bellRings, rain: w.ambient?.weather.kind === 'rain', snow: w.ambient?.weather.kind === 'snow',
      season: w.season?.key, fair: !!w.events?.fair, story: g.storyHourLeft() > 0,
      cat: w.events?.cat?.i === i, worms: w.events?.worms?.i === i, loc: g.loc().id, fest: g.festival(),
      underground: w.ambient?.underground,
    };
  }

  line(i) {
    const c = this.context(i);
    if (c.cat) return pick(REACTIONS.cat);
    if (c.worms) return pick(REACTIONS.worms);
    const pool = [];
    const add = (arr, weight = 1) => { for (let k = 0; k < weight; k++) pool.push(...arr); };
    add(GENERIC);
    add(GENRE[i] || [], 2);
    add(LOCATION_LINES[c.loc] || [], 2);
    if (c.fest) add(c.fest.lines, 3);
    if (c.night && !c.lamps && !c.underground) add(NIGHT_DARK, 2);
    if (c.night && c.lamps) add(NIGHT_LAMP);
    if (c.seatsFull && c.canSeat) add(['Every seat is taken!', 'Can we have more chairs?', 'I’m reading standing up. Like an animal.'], 2);
    if (c.rain) add(WEATHER_LINES.rain, 2);
    if (c.snow) add(WEATHER_LINES.snow, 2);
    if (c.season && !c.underground) add(SEASON_LINES[c.season]);
    if (c.fair) add(REACTIONS.fair, 3);
    if (c.story) add(REACTIONS.story, 2);
    if (c.jarFull) add(REACTIONS.jarFull);
    if (Math.random() < 0.04) return pick(FOURTH_WALL);
    const fresh = pool.filter((l) => !this.recent.includes(l));
    return pick(fresh.length ? fresh : pool);
  }

  librarianLine(i) {
    const c = this.context(i);
    if (c.bells < 10 && Math.random() < 0.5) return 'Tap my desk to ring the bell!';
    if (c.seatsFull && c.canSeat && Math.random() < 0.4) return 'We need more seats!';
    if (c.night && !c.lamps && !c.underground && Math.random() < 0.5) return "It's dark — lamps would help!";
    if (c.jarFull && Math.random() < 0.5) return 'The coin jar is full!';
    return Math.random() < 0.35 ? pick(RECOMMEND) : pick(LIBRARIAN);
  }

  update(dt) {
    for (const b of this.bubbles) b.life -= dt;
    this.bubbles = this.bubbles.filter((b) => b.life > 0 && (b.v.lib || (b.v.state !== 'gone' && b.v.alpha > 0.2)));
    // play queued skit lines
    for (const q of this.queue) q.at -= dt;
    const due = this.queue.filter((q) => q.at <= 0);
    this.queue = this.queue.filter((q) => q.at > 0);
    for (const q of due) {
      if (q.who === 'ALL') this.shout(q.i, q.text, 3, 1.8);
      else if (q.who === 'LIB') this.lib(q.i, q.text, q.life);
      else { const v = q.who === 'A' ? q.a : q.b; if (v.state !== 'gone' && v.alpha > 0.3) this.say(q.i, v, q.text, q.life); }
    }
    if (!this.on) return;
    this.next -= dt; this.skitT -= dt;
    if (this.skitT <= 0 && !this.queue.length) {
      this.skitT = rand(18, 32);
      const i = this.visibleFloor();
      if (i != null && this.skit(i)) return;
    }
    if (this.next > 0) return;
    this.next = rand(2.8, 5.5);
    const i = this.visibleFloor();
    if (i == null) return;
    const sim = this.w.sims[i];
    if (Math.random() < 0.16) { this.lib(i, this.librarianLine(i)); return; }
    // regulars say their signature lines
    const reg = sim.special?.special?.type === 'regular' ? sim.special : null;
    if (reg && Math.random() < 0.5) {
      const r = REGULAR[reg.special.id];
      const done = this.w.game.regularStep(r.id) >= 4;
      this.say(i, reg, pick(done ? r.done : r.lines), 3.4, 'regular');
      return;
    }
    const talkers = sim.visitors.filter((v) => !v.special && v.alpha > 0.8 && v.state !== 'request' && !this.bubbles.some((b) => b.v === v));
    if (!talkers.length) return;
    this.say(i, pick(talkers), this.line(i));
  }

  // Draws every bubble in world space, after all floors (top-most layer).
  drawAll(ctx, view) {
    ctx.font = FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const placed = [];
    // Librarian and regulars speak first so their lines are never the ones crowded out.
    const order = this.bubbles.filter((b) => b.style).concat(this.bubbles.filter((b) => !b.style));
    for (const b of order) {
      const y0 = floorTop(b.i);
      if (y0 > view.bottom + 40 || y0 + 200 < view.top) continue;
      const v = b.v;
      const lines = wrap(ctx, b.text, 108);
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 12;
      const h = lines.length * 9 + 7;
      const headY = v.lib ? v.y - 36 : v.state === 'read' ? v.y - 32 : v.y - 42;
      const vx = IX + v.x;
      const x = Math.max(IX + w / 2 + 2, Math.min(IX + 350 - w / 2, vx));
      let y = y0 + headY - h / 2 - 5;
      // Nudge upwards past bubbles already drawn; if it still collides (or would poke into the
      // floor above), let this one wait — the crowd takes turns.
      const hitAt = (yy) => placed.find((p) => Math.abs(p.x - x) < (p.w + w) / 2 + 2 && Math.abs(p.y - yy) < (p.h + h) / 2 + 2);
      for (let k = 0; k < 3; k++) { const hit = hitAt(y); if (!hit) break; y = hit.y - h - 3; }
      if (hitAt(y) || y < y0 + 2) continue;
      placed.push({ x, y, w, h });
      const age = b.max - b.life;
      const s = age < 0.15 ? 0.6 + (age / 0.15) * 0.4 : 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, b.life / 0.3);
      ctx.translate(x, y + h / 2); ctx.scale(s, s); ctx.translate(-x, -(y + h / 2));
      const border = b.style === 'lib' ? '#7cc46b' : b.style === 'regular' ? '#9b6fb0' : '#d9bb86';
      // soft drop shadow, body, tail
      ctx.fillStyle = 'rgba(60,40,20,0.18)'; rr(ctx, x - w / 2 + 1, y + 1.5, w, h, 6); ctx.fill();
      ctx.fillStyle = b.style === 'regular' ? '#fbf5ff' : '#fffdf6'; ctx.strokeStyle = border; ctx.lineWidth = 1;
      rr(ctx, x - w / 2, y, w, h, 6); ctx.fill(); ctx.stroke();
      const tx = Math.max(x - w / 2 + 8, Math.min(x + w / 2 - 8, vx));
      ctx.beginPath(); ctx.moveTo(tx - 3.5, y + h - 0.6); ctx.lineTo(vx, y + h + 5.5); ctx.lineTo(tx + 3.5, y + h - 0.6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(tx - 3.5, y + h); ctx.lineTo(vx, y + h + 5.5); ctx.lineTo(tx + 3.5, y + h); ctx.stroke();
      ctx.fillStyle = '#4a3121';
      lines.forEach((l, k) => ctx.fillText(l, x, y + 8 + k * 9));
      ctx.restore();
    }
  }
}

function wrap(ctx, text, max) {
  const words = text.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > max && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}
