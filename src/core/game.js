import { Emitter } from './emitter.js';
import { ROOMS, BOOKS, LIMITS, RARITY } from '../data/rooms.js';
import { SCRIPTED, generateQuest, DAILY, WHEEL, SHOP, GIFT } from '../data/quests.js';
import { TASK_POOL, TASK_CHEST } from '../data/tasks.js';
import { STORY } from '../data/story.js';
import { branchInfo } from '../data/branches.js';
import { FURN, FURNITURE } from '../data/furniture.js';
import { festivalAt } from '../data/festivals.js';
import * as E from './economy.js';
import { dayKey, daysBetween } from './format.js';
import { saveState } from './save.js';
import { SEASON_SPEEDS, calendarAt } from './calendar.js';
import { WINGS, WING, WING_MAX, CLUBS, wingLevelCost, wingDecorCost, wingUpperCost, wingStoreys } from '../data/wings.js';
import {
  DEEP_COLS, DEEP_ROWS, HALLS, FOSSIL_AT, FOSSILS, CHRONICLE, cellId, cellKind,
  digCostSec, digTimeSec, restoreCostSec, restoreTimeSec, CREW_CHEESE,
} from '../data/deep.js';
import {
  BIZ, BIZ_BY_ID, BIZ_MAX, HALL_MAX, LIFT_ROWS, MOLE_CITY_HALLS, bizLevelSec, bizFixtureSec, hallLevelSec, liftSec,
} from '../data/mole.js';

const COUNT_TYPES = ['jarCollects', 'specials', 'spins', 'parcels', 'bellRings', 'requests', 'cats', 'worms', 'lostBooks', 'fish', 'pets', 'digs', 'scones', 'tours', 'clubs', 'prints'];
const RARITY_WEIGHT = { C: 50, R: 30, E: 15, L: 5 };
function ordinal(n) { const k = ['th', 'st', 'nd', 'rd']; const v = n % 100; return n + (k[(v - 20) % 10] || k[v] || k[0]); }
const fmtCount = (n) => String(Math.round(n || 0));
export const OFFLINE_RATE = 0.6;
export const STORY_HOUR_SEC = 30 * 60;
export const STORY_HOUR_MAX = 4 * 3600;
export const DEEP_ROOM = 4; // the Mystery Attic's old map leads to the trapdoor under the vault

export class Game extends Emitter {
  constructor(state) {
    super();
    this.s = state;
    this.pending = ROOMS.map(() => 0);
    this.lastFlush = ROOMS.map(() => performance.now());
    this.roomInc = ROOMS.map(() => 0);
    this._inc = 0;
    this._incAt = -1e9;
    this._dirty = true;
    this.jarFull = false;
    this.sessionStart = Date.now();
    this.ensureQuest();
    this.ensureTasks();
  }

  /* ---------------- income ---------------- */
  markDirty() { this._dirty = true; }
  refreshIncome() {
    const t = performance.now();
    if (!this._dirty && t - this._incAt < 250) return;
    const now = Date.now();
    let tot = 0;
    for (let i = 0; i < ROOMS.length; i++) { this.roomInc[i] = E.roomIncome(this.s, i, now); tot += this.roomInc[i]; }
    this._inc = tot; this._incAt = t; this._dirty = false;
  }
  income() { this.refreshIncome(); return this._inc; }
  roomIncome(i) { this.refreshIncome(); return this.roomInc[i]; }
  steady() { return Math.max(1, E.steadyIncome(this.s)); }
  rewardCoins(sec) { return this.steady() * sec; }

  /* ---------------- jar ---------------- */
  jarSeconds() { return SHOP.jar[this.s.shop.jar].sec; }
  jarCap() { return Math.max(150, this.steady() * this.jarSeconds()); }
  jarPending() { return this.pending.reduce((a, b) => a + b, 0); }

  /* ---------------- mouse calendar ---------------- */
  seasonSec() { return SEASON_SPEEDS[this.s.settings.seasonSpeed] || SEASON_SPEEDS.normal; }
  calendar() { return calendarAt(this.s.calendar.t, this.seasonSec()); }
  // Moves library time forward; a new Mouse Year is announced with the 'mouseYear' event.
  advanceCalendar(sec) {
    const before = this.calendar().year;
    this.s.calendar.t += sec;
    const year = this.calendar().year;
    if (year > before) this.emit('mouseYear', { year });
  }
  // Changing speed keeps the same point in the year (mid-summer stays mid-summer).
  setSeasonSpeed(key) {
    if (!SEASON_SPEEDS[key]) return;
    const old = this.seasonSec();
    this.s.settings.seasonSpeed = key;
    this.s.calendar.t *= this.seasonSec() / old;
  }

  update(dt) {
    const now = Date.now();
    const s = this.s;
    this.advanceCalendar(dt);
    if (s.boosts.length && s.boosts.some((b) => b.end <= now)) {
      s.boosts = s.boosts.filter((b) => b.end > now);
      this.markDirty(); this.emit('boost');
    }
    s.rooms.forEach((r, i) => { if (!r.built && r.buildEnd && now >= r.buildEnd) this.completeBuild(i); });
    this.updateWings(now);
    this.updateDeep(now);
    if (!s.flags.siteFull && this.siteFull() && this.builtCount() >= this.floorCap()) s.flags.siteFull = true;
    if (s.move.end && now >= s.move.end && !s.move.ready) { s.move.ready = true; this.emit('siteReady'); }

    this.refreshIncome();
    let space = this.jarCap() - s.jar - this.jarPending();
    const wasFull = this.jarFull;
    this.jarFull = space <= 0;
    if (this.jarFull !== wasFull) this.emit('jarFull', this.jarFull);
    if (!this.jarFull) {
      for (let i = 0; i < ROOMS.length; i++) {
        if (!this.roomInc[i]) continue;
        const add = Math.min(space, this.roomInc[i] * dt);
        this.pending[i] += add; space -= add;
        if (space <= 0) break;
      }
    }
    // Failsafe: if no visitor paid for a while, move coins to the jar anyway.
    const t = performance.now();
    for (let i = 0; i < ROOMS.length; i++) if (this.pending[i] > 0 && t - this.lastFlush[i] > 9000) this.flushRoom(i);
  }

  // A visitor paid at the desk: room coins go into the jar.
  flushRoom(i) {
    const amt = this.pending[i];
    this.pending[i] = 0;
    this.lastFlush[i] = performance.now();
    this.s.jar += amt;
    return amt;
  }

  collectJar(mult = 1) {
    const amt = this.s.jar * mult;
    if (amt <= 0) return 0;
    this.s.jar = 0;
    this.earn(amt);
    this.s.stats.jarCollects++;
    this.emit('jar', { amount: amt, mult });
    this.checkQuest();
    return amt;
  }
  jarDoubleReady() {
    return Date.now() >= this.s.cooldowns.jarDouble && this.s.jar >= Math.max(60, this.steady() * 45);
  }

  /* ---------------- wallet ---------------- */
  earn(amt) {
    if (!(amt > 0)) return;
    this.s.coins += amt; this.s.totalEarned += amt; this.s.branchEarned += amt;
    this.emit('coins');
  }
  spend(cost) {
    if (!(cost <= this.s.coins)) return false;
    this.s.coins -= cost;
    this.emit('coins');
    return true;
  }
  addCheese(n) { this.s.cheese += n; this.emit('cheese', n); }
  spendCheese(n) {
    if (this.s.cheese < n) return false;
    this.s.cheese -= n; this.emit('cheese', -n); return true;
  }

  /* ---------------- upgrades ---------------- */
  cost(i, track, n = 1) { return E.trackCost(this.s, i, track, n); }
  maxLevels(i) {
    const r = this.s.rooms[i];
    return E.maxLevelsAffordable(i, r.lvl, this.s.coins);
  }

  buy(i, track, n = 1, free = false) {
    const r = this.s.rooms[i];
    if (!r?.built) return false;
    if (track === 'lvl') n = Math.max(1, Math.min(n, LIMITS.level - r.lvl));
    const cost = this.cost(i, track, n);
    if (!isFinite(cost)) return false;
    if (!free && !this.spend(cost)) { this.emit('cantAfford', { i, track }); return false; }
    const before = E.milestoneCount(r.lvl);
    E.applyTrack(r, track, n);
    this.s.stats.purchases++;
    this.markDirty();
    this.emit('buy', { i, track, n, cost, free });
    const after = E.milestoneCount(r.lvl);
    if (after > before) {
      this.emit('milestone', { i, lvl: r.lvl });
      // Early milestones deliver the floor's own books to the album (C, C, R, E, L).
      for (let m = before; m < Math.min(after, E.BOOK_MILESTONES); m++) this.grantSpecificBook(`${ROOMS[i].id}-${m}`, 'milestone');
    }
    this.s.stats.upgrades = (this.s.stats.upgrades || 0) + 1;
    this.addXp(track === 'lvl' ? n : 4);
    this.checkQuest();
    return true;
  }
  freeUpgradeReady() { return Date.now() >= this.s.cooldowns.freeUpgrade; }
  freeUpgradeEligible(i, track) {
    const c = this.cost(i, track, 1);
    return isFinite(c) && c > this.s.coins && c <= this.steady() * 240 && this.freeUpgradeReady();
  }
  useFreeUpgrade(i, track) {
    this.s.cooldowns.freeUpgrade = Date.now() + 180000;
    return this.buy(i, track, 1, true);
  }

  /* ---------------- floors ---------------- */
  // How many floors this site's building can hold (floors built at an older, bigger save are kept).
  floorCap() {
    let top = 0;
    this.s.rooms.forEach((r, i) => { if (r.built || r.buildEnd) top = i + 1; });
    return Math.max(this.branch().floors, top);
  }
  // The next floor you can build here, or -1 (either the library is complete or this site is full).
  nextFloor() {
    const i = this.s.rooms.findIndex((r) => !r.built && !r.buildEnd);
    return i >= 0 && i < this.floorCap() ? i : -1;
  }
  // True when more floors exist but this building has no room for them: time to move.
  siteFull() {
    const i = this.s.rooms.findIndex((r) => !r.built && !r.buildEnd);
    return i >= 0 && i >= this.floorCap();
  }
  constructing() { return this.s.rooms.findIndex((r) => !r.built && r.buildEnd > 0); }
  builtCount() { return this.s.rooms.filter((r) => r.built).length; }
  buildRemaining(i) { return Math.max(0, (this.s.rooms[i].buildEnd - Date.now()) / 1000); }
  cheeseToFinish(i) { return Math.max(1, Math.ceil(this.buildRemaining(i) / 90)); }

  startBuild(i) {
    const r = this.s.rooms[i];
    if (r.built || r.buildEnd || this.constructing() >= 0) return false;
    if (!this.spend(ROOMS[i].unlock)) { this.emit('cantAfford', { i, track: 'build' }); return false; }
    r.buildEnd = Date.now() + ROOMS[i].build * 1000;
    this.emit('buildStart', { i });
    if (ROOMS[i].build <= 0) this.completeBuild(i);
    return true;
  }
  finishBuildNow(i) { const r = this.s.rooms[i]; if (!r.built && r.buildEnd) this.completeBuild(i); }
  // Ad speed-up: halves the remaining time, or finishes short builds outright.
  speedBuild(i) {
    const rem = this.buildRemaining(i);
    if (rem <= 120) { this.finishBuildNow(i); return true; }
    this.s.rooms[i].buildEnd = Date.now() + (rem / 2) * 1000;
    return false;
  }
  completeBuild(i) {
    const r = this.s.rooms[i];
    r.built = true; r.buildEnd = 0;
    this.s.stats.floorsBuilt++;
    this.markDirty();
    this.addXp(10);
    this.emit('built', { i });
    this.checkQuest();
  }

  /* ---------------- boosts ---------------- */
  addBoost({ mult, sec, room = null, label = '', icon = '✨', key = '' }) {
    const end = Date.now() + sec * 1000;
    const existing = key && this.s.boosts.find((b) => b.key === key);
    if (existing) { existing.end = Math.max(existing.end, end); existing.mult = Math.max(existing.mult, mult); }
    else this.s.boosts.push({ mult, end, room, label, icon, key });
    this.markDirty(); this.emit('boost');
  }
  removeBoost(key) {
    const n = this.s.boosts.length;
    this.s.boosts = this.s.boosts.filter((b) => b.key !== key);
    if (n !== this.s.boosts.length) { this.markDirty(); this.emit('boost'); }
  }
  storyHourLeft() { return Math.max(0, (this.s.boostEnd - Date.now()) / 1000); }
  addStoryHour(sec = STORY_HOUR_SEC) {
    const now = Date.now();
    this.s.boostEnd = Math.min(now + STORY_HOUR_MAX * 1000, Math.max(now, this.s.boostEnd) + sec * 1000);
    this.markDirty(); this.emit('boost');
  }
  storyHourFull() { return this.storyHourLeft() > STORY_HOUR_MAX - STORY_HOUR_SEC; }

  /* ---------------- album ---------------- */
  pickBook(roomPref = null) {
    const builtRooms = this.s.rooms.map((r, i) => (r.built ? i : -1)).filter((i) => i >= 0);
    let pool = BOOKS.filter((b) => (roomPref != null ? b.room === roomPref : builtRooms.includes(b.room)));
    if (!pool.length) pool = BOOKS.filter((b) => b.room === 0);
    // Favor books you don't own yet so collecting feels rewarding.
    const weights = pool.map((b) => RARITY_WEIGHT[b.rarity] * (this.s.album[b.id] ? 0.45 : 1));
    let x = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let k = 0; k < pool.length; k++) { x -= weights[k]; if (x <= 0) return pool[k]; }
    return pool[pool.length - 1];
  }
  grantSpecificBook(id, source = 'gift') {
    const book = BOOKS.find((b) => b.id === id);
    if (!book || this.s.album[id]) return null;
    this.s.album[id] = 1;
    this.markDirty();
    const setDone = [0, 1, 2, 3, 4].every((k) => this.s.album[`${ROOMS[book.room].id}-${k}`]);
    const res = { book, dup: false, cheese: 0, setDone, source };
    this.emit('book', res);
    this.checkQuest();
    return res;
  }

  grantBook(roomPref = null) {
    const book = this.pickBook(roomPref);
    const dup = !!this.s.album[book.id];
    this.s.album[book.id] = (this.s.album[book.id] || 0) + 1;
    let cheese = 0;
    if (dup) { cheese = RARITY[book.rarity].dupCheese; this.addCheese(cheese); }
    this.markDirty();
    const setDone = !dup && [0, 1, 2, 3, 4].every((k) => this.s.album[`${ROOMS[book.room].id}-${k}`]);
    this.emit('book', { book, dup, cheese, setDone });
    this.checkQuest();
    return { book, dup, cheese, setDone };
  }

  /* ---------------- reputation ---------------- */
  addXp(n) {
    const s = this.s;
    s.xp += n;
    while (s.xp >= E.repXpNeeded(s.rep)) {
      s.xp -= E.repXpNeeded(s.rep);
      s.rep++;
      const cheese = 2 + Math.floor(s.rep / 5);
      this.addCheese(cheese);
      this.markDirty();
      this.emit('rep', { level: s.rep, cheese });
    }
  }

  /* ---------------- rewards ---------------- */
  // Applies a reward object and returns a list of granted items for the UI.
  grant(rw, mult = 1) {
    const out = [];
    if (rw.coins) { const c = rw.coins * mult; this.earn(c); out.push({ kind: 'coins', amount: c }); }
    if (rw.coinsSec) { const c = this.rewardCoins(rw.coinsSec) * mult; this.earn(c); out.push({ kind: 'coins', amount: c }); }
    if (rw.cheese) { const c = rw.cheese * mult; this.addCheese(c); out.push({ kind: 'cheese', amount: c }); }
    if (rw.boost) { this.addStoryHour(rw.boost * mult); out.push({ kind: 'boost', sec: rw.boost * mult }); }
    if (rw.book) for (let k = 0; k < mult; k++) out.push({ kind: 'book', ...this.grantBook() });
    return out;
  }

  /* ---------------- quests ---------------- */
  ensureQuest() {
    const s = this.s;
    if (s.quest) return;
    const idx = s.questIdx;
    const q = idx < SCRIPTED.length ? { ...SCRIPTED[idx] } : generateQuest(idx - SCRIPTED.length, s, this.questHelpers());
    if (q.type === 'books' && q.target == null) q.target = E.booksOwned(s) + 1;
    if (q.type === 'books' && idx < SCRIPTED.length) q.target = Math.max(q.target, 1);
    q.id = idx;
    s.quest = q;
    s.questBase = {};
    for (const t of COUNT_TYPES) s.questBase[t] = s.stats[t] || 0;
    this.emit('quest', q);
  }
  // Generated quests aim at goals reachable in a few minutes, never a grind.
  questHelpers() {
    const s = this.s;
    const inc = this.steady();
    const built = s.rooms.map((r, i) => (r.built ? i : -1)).filter((i) => i >= 0);
    return {
      nextFloor: () => this.nextFloor(),
      digsLeft: () => this.digsLeft(),
      booksLeft: () => BOOKS.length - E.booksOwned(s),
      // an open wing plot you could build on in the next ten minutes or so
      // Mole City: the next lift stop, a new shop, or a shop level, whichever is affordable soon
      mole: () => {
        if (!this.moleCityOpen()) return null;
        const soon = s.coins + inc * 300;
        if (!this.liftBlocker() && this.liftCost() <= soon) return { type: 'liftStops', target: s.deep.lift + 1, text: s.deep.lift ? 'Open the next stop on the Grand Lift' : 'Build the Grand Lift down to Mole City' };
        const nb = this.freeBizSpot() && BIZ.find((b) => !this.bizBlocker(b.id) && this.bizBuildCost(b.id) <= soon);
        if (nb) return { type: 'bizBuilt', biz: nb.id, text: `Open ${nb.name} in Mole City` };
        let best = null;
        for (const b of BIZ) {
          const st = s.deep.biz[b.id]; if (!st?.built || st.lvl >= BIZ_MAX) continue;
          let n = 0; while (st.lvl + n < BIZ_MAX && n < 5 && this.bizLevelCost(b.id, n + 1) <= soon) n++;
          if (n && (!best || st.lvl < best.lvl)) best = { lvl: st.lvl, type: 'bizLvl', biz: b.id, target: st.lvl + n, text: `Upgrade the ${b.short} to Lv ${st.lvl + n}` };
        }
        return best;
      },
      wingToBuild: () => WINGS.find((w) => this.wingOpen(w.id) && !s.wings[w.id].built && !s.wings[w.id].buildEnd && w.unlock <= s.coins + inc * 600) || null,
      // a wing level that's affordable in a few minutes
      wing: () => {
        let best = null;
        for (const w of WINGS) {
          const st = s.wings[w.id]; if (!st.built || st.lvl >= WING_MAX) continue;
          let n = 0; let c = 0;
          while (st.lvl + n < WING_MAX && c + wingLevelCost(w, st.lvl + n) <= s.coins + inc * 240) { c += wingLevelCost(w, st.lvl + n); n++; }
          if (n >= 1 && (!best || c < best.c)) best = { id: w.id, short: w.short, target: st.lvl + Math.max(1, Math.min(n, 5)), c };
        }
        return best;
      },
      level: () => {
        let best = null;
        for (const i of built) {
          const r = s.rooms[i];
          const next = E.nextMilestone(r.lvl);
          if (!next) continue;
          const secs = E.levelCost(i, r.lvl, next - r.lvl) / inc;
          if (!best || secs < best.secs) best = { i, target: next, secs };
        }
        if (best && best.secs > 900) {
          // Too far away: ask for a smaller step that's affordable in ~5 minutes.
          const r = s.rooms[best.i];
          const n = Math.max(3, E.maxLevelsAffordable(best.i, r.lvl, inc * 300));
          best.target = Math.min(best.target, r.lvl + n);
        }
        return best;
      },
      cheapest: (track) => {
        let best = null;
        for (const i of built) {
          const tracks = track === 'decor' ? [0, 1, 2, 3, 4].map((k) => `decor${k}`) : [track];
          for (const tr of tracks) {
            const c = E.trackCost(s, i, tr);
            if (isFinite(c) && (!best || c < best.c)) best = { i, c };
          }
        }
        return best && best.c < inc * 1200 ? best.i : null;
      },
    };
  }

  questProgress() {
    const s = this.s; const q = s.quest;
    if (!q) return { cur: 0, target: 1, done: false };
    let cur = 0;
    const r = q.room != null ? s.rooms[q.room] : null;
    switch (q.type) {
      case 'level': cur = r.lvl; break;
      case 'seats': cur = r.seats; break;
      case 'shelves': cur = r.shelves; break;
      case 'staff': cur = r.staff; break;
      case 'decor': cur = r.decor.filter(Boolean).length; break;
      case 'built': cur = r.built ? 1 : 0; break;
      case 'books': cur = E.booksOwned(s); if (cur >= BOOKS.length) cur = q.target; break; // a full album can't grow
      case 'wingLvl': cur = s.wings[q.wing]?.lvl || 0; break;
      case 'wingBuilt': cur = s.wings[q.wing]?.built ? 1 : 0; break;
      case 'liftStops': cur = s.deep.lift || 0; break;
      case 'bizBuilt': cur = s.deep.biz[q.biz]?.built ? 1 : 0; break;
      case 'bizLvl': cur = s.deep.biz[q.biz]?.lvl || 0; break;
      case 'digs': cur = (s.stats.digs || 0) - (s.questBase.digs || 0); if (s.deep.tales || this.digsLeft() + cur < q.target) cur = q.target; break;
      default: cur = (s.stats[q.type] || 0) - (s.questBase[q.type] || 0);
    }
    return { cur: Math.min(cur, q.target), target: q.target, done: cur >= q.target };
  }
  checkQuest() {
    const q = this.s.quest;
    if (!q || q.ready) return;
    if (this.questProgress().done) { q.ready = true; this.emit('questReady', q); }
  }
  claimQuest(mult = 1) {
    const q = this.s.quest;
    if (!q || !this.questProgress().done) return null;
    const got = this.grant(q.reward, mult);
    this.s.questIdx++;
    this.s.quest = null;
    this.addXp(5);
    this.ensureQuest();
    this.checkQuest();
    return got;
  }

  /* ---------------- quick tasks ---------------- */
  ensureTasks() {
    const s = this.s;
    if (!s.tasks) s.tasks = { list: [], sets: 0 };
    if (s.tasks.list.length) return;
    const pool = TASK_POOL.filter((t) => (t.minQuest ?? 0) <= s.questIdx && !(t.type === 'specials' && s.questIdx < 3));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const pickList = [];
    let events = 0;
    for (const t of shuffled) {
      if (pickList.length >= 3) break;
      if (t.event && events >= 1) continue;
      if (t.event) events++;
      pickList.push(t);
    }
    const sets = s.tasks.sets;
    s.tasks.list = pickList.map((t) => ({
      type: t.type,
      target: t.event ? t.base : Math.round(t.base * (1 + Math.min(2, sets * 0.12))),
      start: s.stats[t.type] || 0,
      claimed: false,
    }));
    this.emit('tasks');
  }
  taskInfo(k) {
    const t = this.s.tasks?.list[k];
    if (!t) return null;
    const def = TASK_POOL.find((d) => d.type === t.type);
    const cur = Math.min(t.target, (this.s.stats[t.type] || 0) - t.start);
    return { ...t, icon: def.icon, text: def.text(t.target), cur, done: cur >= t.target };
  }
  claimTask(k) {
    const s = this.s;
    const info = this.taskInfo(k);
    if (!info || !info.done || info.claimed) return null;
    s.tasks.list[k].claimed = true;
    const got = this.grant({ coinsSec: 60 + Math.min(240, s.tasks.sets * 10), cheese: 1 });
    this.addXp(3);
    let chest = null;
    if (s.tasks.list.every((t) => t.claimed)) {
      chest = this.grant({ cheese: TASK_CHEST.cheese, coinsSec: TASK_CHEST.coinsSec, book: Math.random() < TASK_CHEST.bookChance });
      s.tasks.sets++;
      s.tasks.list = [];
      this.ensureTasks();
    }
    this.emit('tasks');
    return { got, chest };
  }

  /* ---------------- story ---------------- */
  nextStory() {
    const seen = this.s.story.seen;
    const h = { books: E.booksOwned(this.s) };
    return STORY.find((ch) => ch.when && !seen.includes(ch.id) && ch.when(this.s, h)) || null;
  }
  storySeen(id) { return this.s.story.seen.includes(id); }
  markStory(id) { if (!this.storySeen(id)) this.s.story.seen.push(id); }

  /* ---------------- daily login ---------------- */
  dailyStatus() {
    const today = dayKey();
    const { last, streak } = this.s.daily;
    const canClaim = last !== today;
    const continuing = last && daysBetween(last, today) === 1;
    const day = canClaim ? (continuing ? streak % 7 : 0) : Math.max(0, (streak - 1) % 7);
    return { canClaim, day, streak: canClaim && !continuing ? 0 : streak };
  }
  claimDaily(mult = 1) {
    const st = this.dailyStatus();
    if (!st.canClaim) return null;
    const got = this.grant(DAILY[st.day], mult);
    this.s.daily.streak = st.streak + 1;
    this.s.daily.last = dayKey();
    this.emit('daily');
    return got;
  }

  /* ---------------- lucky wheel ---------------- */
  wheelStatus() {
    const now = Date.now();
    const w = this.s.wheel;
    const freeAt = w.lastFree + 6 * 3600 * 1000;
    const adUsed = w.adDay === dayKey() ? w.adUsed : 0;
    return { free: now >= freeAt, nextFree: Math.max(0, (freeAt - now) / 1000), adLeft: Math.max(0, 6 - adUsed) };
  }
  spinWheel(kind) {
    const w = this.s.wheel;
    if (kind === 'free') w.lastFree = Date.now();
    else { const today = dayKey(); if (w.adDay !== today) { w.adDay = today; w.adUsed = 0; } w.adUsed++; }
    const total = WHEEL.reduce((a, b) => a + b.w, 0);
    let x = Math.random() * total; let index = 0;
    for (let k = 0; k < WHEEL.length; k++) { x -= WHEEL[k].w; if (x <= 0) { index = k; break; } }
    this.s.stats.spins++;
    this.checkQuest();
    this.emit('wheel');
    return { index, prize: WHEEL[index] };
  }

  /* ---------------- shop ---------------- */
  // `free`: already paid for with ads.
  shopBuy(kind, arg, free = false) {
    const sh = this.s.shop;
    const pay = (c) => free || this.spendCheese(c);
    if (kind === 'jar' || kind === 'offline') {
      const next = SHOP[kind][sh[kind] + 1];
      if (!next || !pay(next.cost)) return false;
      sh[kind]++; this.emit('shop'); return true;
    }
    if (kind === 'perm') {
      const cost = SHOP.perm[sh.perm];
      if (cost == null || !pay(cost)) return false;
      sh.perm++; this.markDirty(); this.emit('shop'); return true;
    }
    if (kind === 'warp') {
      const w = SHOP.warp[arg];
      if (!pay(w.cost)) return false;
      const amt = this.rewardCoins(w.sec); this.earn(amt); this.emit('shop'); return amt;
    }
    if (kind === 'crate') {
      if (!pay(SHOP.crate)) return false;
      return this.grantBook();
    }
    return false;
  }
  adCheeseLeft() {
    const sh = this.s.shop;
    return SHOP.adCheeseDaily - (sh.cheeseDay === dayKey() ? sh.cheeseUsed : 0);
  }
  claimAdCheese() {
    const sh = this.s.shop; const today = dayKey();
    if (sh.cheeseDay !== today) { sh.cheeseDay = today; sh.cheeseUsed = 0; }
    sh.cheeseUsed++;
    this.addCheese(SHOP.adCheese);
  }

  /* ---------------- furniture (kept forever, placed per floor) ---------------- */
  ownsFurniture(id) { return !!this.s.furniture.owned[id]; }
  floorFurniture(i) { return this.s.furniture.floors[i] || {}; }
  // What the Shop sells right now: the regular range, this branch's local finds and festival specials.
  furnitureForSale() {
    const fest = this.festival(); const b = this.branch().id;
    return FURNITURE.filter((f) => (!f.branch || f.branch === b) && (!f.festival || f.festival === fest?.id));
  }
  buyFurniture(id, floor = null, free = false) {
    const f = FURN[id];
    if (!f || this.ownsFurniture(id) || !(free || this.spendCheese(f.price))) return false;
    this.s.furniture.owned[id] = 1;
    this.markDirty();
    // Put it straight onto a floor if that spot is still free there.
    if (floor != null && this.s.rooms[floor]?.built && !this.floorFurniture(floor)[f.slot]) this.placeFurniture(floor, f.slot, id);
    this.emit('furniture', { id, floor });
    return true;
  }
  placeFurniture(i, slot, id) {
    const fl = this.s.furniture.floors;
    fl[i] = { ...(fl[i] || {}) };
    if (id) fl[i][slot] = id; else delete fl[i][slot];
    this.emit('style', { i });
  }

  /* ---------------- festivals ---------------- */
  festival() {
    if (this.festOverride !== undefined) return this.festOverride; // debug / screenshots
    const t = performance.now();
    if (this._festAt === undefined || t - this._festAt > 1000) { this._fest = festivalAt(Date.now(), this.s.created || Date.now(), this.calendar()); this._festAt = t; }
    return this._fest;
  }

  /* ---------------- optional ad offers: daily caps + cooldowns ---------------- */
  offerReady(key, daily) {
    const a = this.s.ads; const today = dayKey();
    if (a.day !== today) { a.day = today; a.used = {}; }
    return (a.used[key] || 0) < daily && Date.now() >= (a.next[key] || 0);
  }
  useOffer(key, cooldownSec = 0) {
    const a = this.s.ads; const today = dayKey();
    if (a.day !== today) { a.day = today; a.used = {}; }
    a.used[key] = (a.used[key] || 0) + 1;
    a.next[key] = Date.now() + cooldownSec * 1000;
  }

  /* ---------------- mystery gift box on the doorstep (optional ad) ---------------- */
  giftDue() {
    const gb = this.s.gift;
    if (!gb.next) gb.next = Date.now() + GIFT.firstSec * 1000;
    return this.s.questIdx >= 6 && Date.now() >= gb.next && this.offerReady('gift', GIFT.daily);
  }
  // ad: open the whole box. Otherwise: a quick peek (small reward).
  openGift(ad) {
    const [a, b] = GIFT.everySec;
    this.s.gift.next = Date.now() + (a + Math.random() * (b - a)) * 1000;
    if (!ad) return this.grant({ coinsSec: GIFT.peekSec });
    this.useOffer('gift');
    const out = this.grant({ coinsSec: GIFT.coinsSec, cheese: GIFT.cheese[0] + Math.floor(Math.random() * (GIFT.cheese[1] - GIFT.cheese[0] + 1)) });
    // sometimes a piece of furniture you don't own yet, or a book
    const roll = Math.random();
    if (roll < GIFT.furnitureChance) {
      const pool = this.furnitureForSale().filter((f) => !this.ownsFurniture(f.id) && f.rarity !== 'L');
      if (pool.length) { const f = pool[Math.floor(Math.random() * pool.length)]; this.s.furniture.owned[f.id] = 1; this.markDirty(); out.push({ kind: 'furniture', item: f }); }
    } else if (roll < GIFT.furnitureChance + GIFT.bookChance) out.push({ kind: 'book', ...this.grantBook() });
    return out;
  }

  /* ---------------- the Shop's daily deal: one piece of furniture at half price ---------------- */
  dailyDeal() {
    const pool = this.furnitureForSale().filter((f) => !f.festival);
    if (!pool.length) return null;
    const d = dayKey(); let h = 0; for (const ch of d) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const f = pool[h % pool.length];
    return { item: f, unlocked: this.s.shop.dealDay === d, price: Math.ceil(f.price / 2) };
  }
  unlockDeal() { this.s.shop.dealDay = dayKey(); this.emit('shop'); }
  buyDeal() {
    const d = this.dailyDeal();
    if (!d || !d.unlocked || this.ownsFurniture(d.item.id) || !this.spendCheese(d.price)) return false;
    this.s.furniture.owned[d.item.id] = 1; this.markDirty(); this.emit('furniture', { id: d.item.id }); return true;
  }

  /* ---------------- festival gift (once a day while a festival is on) ---------------- */
  festGiftReady() { const f = this.festival(); return !!f && this.s.festival.gift !== dayKey(); }
  claimFestGift(mult = 1) {
    const f = this.festival();
    if (!f || !this.festGiftReady()) return null;
    this.s.festival.gift = dayKey();
    return this.grant(f.gift, mult);
  }

  /* ---------------- offline ---------------- */
  offlineCapSec() { return SHOP.offline[this.s.shop.offline].sec; }
  offlineEarnings(ms) {
    const sec = Math.min(ms / 1000, this.offlineCapSec());
    return { sec, amount: E.steadyIncome(this.s) * sec * OFFLINE_RATE, capped: ms / 1000 > this.offlineCapSec() };
  }

  /* ---------------- specials ---------------- */
  ringBell(i) {
    const amt = Math.max(1, this.roomIncome(i) * 0.35);
    this.earn(amt);
    this.s.stats.bellRings++;
    this.checkQuest();
    return amt;
  }
  greetSpecial() { this.s.stats.specials++; this.addXp(3); this.checkQuest(); }
  openedParcel() { this.s.stats.parcels++; this.checkQuest(); }

  /* ---------------- moving to a bigger site ---------------- */
  // Moving is how the library grows. Buy the land at the next site (coins), the movers get it
  // ready (a timer), then move in: every floor, level, wing, book and piece of furniture comes
  // along, you get the new site's branch bonus, room for more floors and wings, and Golden Quills
  // for what you earned here.
  pendingQuills() { return E.pendingQuills(this.s); }
  nextBranch() { return branchInfo(this.s.branch + 1); }
  branch() { return branchInfo(this.s.branch); }
  moveCost() { return this.nextBranch().cost; }
  // Why you can't buy the next site's land yet ('' when you can).
  landBlocker() {
    const s = this.s;
    if (s.move.end) return 'bought';
    const cap = this.branch().floors;
    const need = Math.min(cap, ROOMS.length);
    if (this.builtCount() < need) return 'floors';
    if (s.coins < this.moveCost()) return 'coins';
    return '';
  }
  canBuyLand() { return !this.landBlocker(); }
  buyLand() {
    if (!this.canBuyLand()) return false;
    const next = this.nextBranch();
    if (!this.spend(next.cost)) return false;
    this.s.move = { end: Date.now() + next.prep * 1000, total: next.prep, ready: next.prep <= 0 };
    this.emit('landBought', { to: next });
    return true;
  }
  moveRemaining() { return this.s.move.end ? Math.max(0, (this.s.move.end - Date.now()) / 1000) : 0; }
  moveReady() { return !!this.s.move.end && this.moveRemaining() <= 0; }
  // Ad speed-up for the movers: halves what's left, or finishes a short wait outright.
  speedMove() {
    const rem = this.moveRemaining();
    if (!this.s.move.end || rem <= 0) return;
    this.s.move.end = rem <= 120 ? Date.now() : Date.now() + (rem / 2) * 1000;
  }
  cheeseToMove() { return Math.max(1, Math.ceil(this.moveRemaining() / 120)); }
  finishMoveCheese() {
    if (!this.s.move.end || !this.spendCheese(this.cheeseToMove())) return false;
    this.s.move.end = Date.now(); return true;
  }
  canPrestige() { return this.moveReady(); }
  prestige() {
    if (!this.moveReady()) return null;
    const s = this.s;
    const from = this.branch();
    const gained = this.pendingQuills();
    s.quills += gained;
    s.branch++;
    s.branchStart = Date.now();
    s.branchEarned = 0;
    s.move = { end: 0 };
    s.flags.siteFull = false;
    s.rooms.forEach((r) => { if (!r.built && r.buildEnd) { r.built = true; r.buildEnd = 0; } }); // the movers finish any floor under construction
    s.stats.prestiges++;
    this.markDirty();
    const to = this.branch();
    const res = { gained, from, to, floors: this.builtCount(), newFloors: Math.max(0, to.floors - from.floors), newPlots: Math.max(0, to.plots - from.plots) };
    this.emit('prestige', res);
    this.checkQuest();
    return res;
  }

  /* ---------------- wings ---------------- */
  wing(id) { return this.s.wings[id]; }
  plotsOpen() { return this.branch().plots; }
  wingOpen(id) { return WING[id].plot < this.plotsOpen() || this.wing(id).built || this.wing(id).buildEnd > 0; }
  wingBuilding() { return WINGS.find((w) => !this.wing(w.id).built && this.wing(w.id).buildEnd > 0)?.id || null; }
  startWing(id) {
    const w = WING[id]; const st = this.wing(id);
    if (!this.wingOpen(id) || st.built || st.buildEnd) return false;
    if (!this.spend(w.unlock)) { this.emit('cantAfford', { wing: id }); return false; }
    st.buildEnd = Date.now() + w.build * 1000;
    this.emit('wingStart', { id });
    return true;
  }
  wingRemaining(id) { return Math.max(0, (this.wing(id).buildEnd - Date.now()) / 1000); }
  speedWing(id) {
    const st = this.wing(id); const rem = this.wingRemaining(id);
    if (st.built || !st.buildEnd) return;
    st.buildEnd = rem <= 120 ? Date.now() : Date.now() + (rem / 2) * 1000;
  }
  completeWing(id) {
    const st = this.wing(id);
    st.built = true; st.buildEnd = 0; st.lvl = Math.max(1, st.lvl); st.next = Date.now();
    this.markDirty(); this.addXp(15);
    this.emit('wingBuilt', { id });
  }
  wingCost(id, n = 1) {
    const w = WING[id]; const lvl = this.wing(id).lvl;
    let c = 0; for (let k = 0; k < n; k++) c += wingLevelCost(w, lvl + k);
    return c;
  }
  wingMaxLevels(id) {
    const lvl = this.wing(id).lvl; let n = 0; let c = 0;
    while (lvl + n < WING_MAX) { const next = wingLevelCost(WING[id], lvl + n); if (c + next > this.s.coins) break; c += next; n++; }
    return n;
  }
  buyWing(id, n = 1) {
    const st = this.wing(id);
    if (!st.built) return false;
    n = Math.max(1, Math.min(n, WING_MAX - st.lvl));
    if (st.lvl >= WING_MAX) return false;
    const cost = this.wingCost(id, n);
    if (!this.spend(cost)) { this.emit('cantAfford', { wing: id }); return false; }
    st.lvl += n;
    this.markDirty(); this.addXp(2 * n);
    this.s.stats.upgrades = (this.s.stats.upgrades || 0) + 1;
    this.emit('wingLevel', { id, lvl: st.lvl });
    this.checkQuest();
    return true;
  }
  wingDecorCost(id, k) { return wingDecorCost(WING[id], k); }
  buyWingDecor(id, k) {
    const st = this.wing(id);
    if (!st.built || st.decor[k]) return false;
    if (!this.spend(wingDecorCost(WING[id], k))) { this.emit('cantAfford', { wing: id }); return false; }
    st.decor[k] = true;
    this.markDirty(); this.addXp(5);
    this.emit('wingDecor', { id, k });
    return true;
  }
  // Furniture for the upper storeys (u: 0 second storey, 1 third storey).
  wingUpperCost(id, u, k) { return wingUpperCost(WING[id], u, k); }
  buyWingUpper(id, u, k) {
    const st = this.wing(id);
    if (!st.built || wingStoreys(st.lvl) < u + 2 || st.up[u][k]) return false;
    if (!this.spend(wingUpperCost(WING[id], u, k))) { this.emit('cantAfford', { wing: id }); return false; }
    st.up[u][k] = true;
    this.markDirty(); this.addXp(6);
    this.emit('wingDecor', { id, u, k });
    return true;
  }
  todaysClub() { let h = 0; for (const ch of dayKey()) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return CLUBS[h % CLUBS.length]; }
  // What a wing's special action is doing right now: 'ready' | 'running' | 'wait' | 'done' (a finished run to collect).
  wingActionState(id) {
    const st = this.wing(id); const a = WING[id].action; const now = Date.now();
    if (!st.built) return 'none';
    if (a.run) {
      if (st.runEnd && now < st.runEnd) return 'running';
      if (st.runEnd && now >= st.runEnd) return id === 'press' ? 'done' : 'ready';
    }
    return now >= (st.next || 0) ? 'ready' : 'wait';
  }
  wingActionLeft(id) {
    const st = this.wing(id); const now = Date.now();
    if (st.runEnd && now < st.runEnd) return (st.runEnd - now) / 1000;
    return Math.max(0, ((st.next || 0) - now) / 1000);
  }
  wingReward(id) { return this.rewardCoins(WING[id].action.sec || 60) * (1 + this.wing(id).lvl / 40); }
  // Tap the wing when its bubble shows: scones for the café, a tour for the museum,
  // a club night for the hall (×1.5 income while it runs), a print run for the press (a book).
  doWingAction(id) {
    const st = this.wing(id); const w = WING[id]; const a = w.action; const now = Date.now();
    const state = this.wingActionState(id);
    if (id === 'press') {
      if (state === 'done') { st.runEnd = 0; this.s.stats.prints = (this.s.stats.prints || 0) + 1; const got = this.grantBook(); this.emit('wingAction', { id }); return { kind: 'book', ...got }; }
      if (state === 'ready' && !st.runEnd) { st.runEnd = now + a.run * 1000; this.emit('wingAction', { id }); return { kind: 'started' }; }
      return null;
    }
    if (state !== 'ready') return null;
    if (id === 'hall') {
      const club = this.todaysClub();
      st.runEnd = now + a.run * 1000; st.next = st.runEnd + a.every * 1000;
      this.addBoost({ mult: 1.5, sec: a.run, label: club.name, icon: club.icon, key: 'club' });
      this.s.stats.clubs = (this.s.stats.clubs || 0) + 1;
      this.emit('wingAction', { id }); this.checkQuest();
      return { kind: 'club', club };
    }
    st.next = now + a.every * 1000;
    const amt = this.wingReward(id);
    this.earn(amt);
    this.s.stats[id === 'cafe' ? 'scones' : 'tours'] = (this.s.stats[id === 'cafe' ? 'scones' : 'tours'] || 0) + 1;
    this.emit('wingAction', { id }); this.checkQuest();
    return { kind: 'coins', amount: amt };
  }
  // Ad: finish a running print run / club night right away.
  rushWing(id) { const st = this.wing(id); if (st.runEnd > Date.now()) st.runEnd = Date.now(); }
  updateWings(now) {
    for (const w of WINGS) {
      const st = this.s.wings[w.id];
      if (!st.built && st.buildEnd && now >= st.buildEnd) this.completeWing(w.id);
      // a club night that just ended: everyone had a lovely time
      if (w.id === 'hall' && st.runEnd && now >= st.runEnd) {
        st.runEnd = 0;
        const cheese = 1 + Math.floor(Math.random() * 3);
        this.addCheese(cheese); this.addXp(12);
        this.emit('clubDone', { cheese });
      }
    }
  }

  /* ---------------- the Deep Stacks ---------------- */
  deep() { return this.s.deep; }
  openDeep() {
    const d = this.s.deep;
    if (d.open) return;
    d.open = true;
    d.dug[cellId(4, 0)] = 1; // the entrance under the vault trapdoor
    this.markDirty();
    this.emit('deepOpen');
  }
  cellDug(c, r) { return !!this.s.deep.dug[cellId(c, r)]; }
  hallAt(c, r) { const k = cellKind(c, r); return k >= '1' && k <= '8' ? +k : 0; }
  hallStage(n) { return this.s.deep.halls[n] || 0; }
  hallsDone() { return E.hallsRestored(this.s); }
  jobAt(c, r) { return this.s.deep.jobs.find((j) => j.c === c && j.r === r) || null; }
  freeCrews() { return this.s.deep.crews - this.s.deep.jobs.length; }
  // Can the crew reach this cell? (next to a dug cell and not bedrock)
  reachable(c, r) {
    if (cellKind(c, r) === '#') return false;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => this.cellDug(c + dc, r + dr));
  }
  doorReachable() {
    for (let r = 0; r < DEEP_ROWS; r++) for (let c = 0; c < DEEP_COLS; c++) if (cellKind(c, r) === 'D' && this.reachable(c, r)) return true;
    return false;
  }
  // What tapping a cell offers: 'dig' | 'restore' | 'door' | 'job' | 'sealed' | 'hall' | 'dug' | 'rock' | 'far'
  cellAction(c, r) {
    const k = cellKind(c, r);
    if (k === '#') return 'rock';
    if (this.jobAt(c, r)) return 'job';
    if (k === 'D') return this.s.deep.door ? 'hoard' : this.doorReachable() ? (this.hallsDone() >= 8 ? 'door' : 'sealed') : 'far';
    if (this.cellDug(c, r)) {
      if (this.bizAt(c, r)) return 'biz';
      const n = this.hallAt(c, r);
      if (n) return this.hallStage(n) >= 3 ? 'hall' : n === 8 && this.hallsDone() < 7 ? 'locked' : 'restore';
      return 'dug';
    }
    return this.reachable(c, r) ? 'dig' : 'far';
  }
  digCost(c, r) { return this.steady() * digCostSec(r); }
  restoreCost(c, r) { return this.steady() * restoreCostSec(r, this.hallStage(this.hallAt(c, r))); }
  startDig(c, r) {
    if (this.cellAction(c, r) !== 'dig' || this.freeCrews() <= 0) return false;
    if (!this.spend(this.digCost(c, r))) { this.emit('cantAfford', { deep: true }); return false; }
    const sec = digTimeSec(r);
    this.s.deep.jobs.push({ kind: 'dig', c, r, end: Date.now() + sec * 1000, total: sec });
    this.emit('deepJob', { c, r });
    return true;
  }
  startRestore(c, r) {
    if (this.cellAction(c, r) !== 'restore' || this.freeCrews() <= 0) return false;
    const n = this.hallAt(c, r); const step = this.hallStage(n);
    if (!this.spend(this.restoreCost(c, r))) { this.emit('cantAfford', { deep: true }); return false; }
    const sec = restoreTimeSec(r, step);
    this.s.deep.jobs.push({ kind: 'restore', c, r, hall: n, step, end: Date.now() + sec * 1000, total: sec });
    this.emit('deepJob', { c, r });
    return true;
  }
  jobRemaining(j) { return Math.max(0, (j.end - Date.now()) / 1000); }
  speedJob(j) { const rem = this.jobRemaining(j); j.end = rem <= 120 ? Date.now() : Date.now() + (rem / 2) * 1000; }
  cheeseForJob(j) { return Math.max(1, Math.ceil(this.jobRemaining(j) / 120)); }
  finishJobCheese(j) { if (!this.spendCheese(this.cheeseForJob(j))) return false; j.end = Date.now(); return true; }
  hireCrew(free = false) {
    const d = this.s.deep;
    if (d.crews >= 2) return false;
    if (!free && !this.spendCheese(CREW_CHEESE)) return false;
    d.crews = 2; this.emit('deepJob', {}); return true;
  }
  openDoor() {
    if (this.cellAction(...this.doorCell()) !== 'door') return false;
    const d = this.s.deep;
    d.door = true;
    for (let r = 0; r < DEEP_ROWS; r++) for (let c = 0; c < DEEP_COLS; c++) if (cellKind(c, r) === 'D') d.dug[cellId(c, r)] = 1;
    this.markDirty();
    this.emit('deepDoor');
    return true;
  }
  doorCell() { for (let r = 0; r < DEEP_ROWS; r++) for (let c = 0; c < DEEP_COLS; c++) if (cellKind(c, r) === 'D') return [c + 1, r]; return [4, 6]; }
  // After the dragon's question: the Mighty Tales comes home (×2 income forever) with Umber's gift.
  claimTales() {
    const d = this.s.deep;
    if (!d.door || d.tales) return null;
    d.tales = true; this.markDirty();
    this.addCheese(50);
    this.emit('tales');
    return { cheese: 50 };
  }
  chroniclePages() {
    const d = this.s.deep;
    if (!d.open) return 0;
    return 1 + Math.min(8, this.hallsDone()) + (d.tales ? 1 : 0);
  }
  // The Mighty Tales writes the last page itself, from your own library's story.
  chronicleLast() {
    const s = this.s; const cal = this.calendar();
    const books = E.booksOwned(s); const wings = WINGS.filter((w) => s.wings[w.id].built).length;
    const fossils = E.fossilsFound(s); const guests = s.stats.specials || 0;
    const plural = (n, one, many) => `${fmtCount(n)} ${n === 1 ? one : many}`;
    const deeds = ['restored eight halls', fossils ? `dug up ${plural(fossils, 'fossil', 'fossils')}` : '', books ? `collected ${plural(books, 'book', 'books')}` : '', guests ? `welcomed ${plural(guests, 'famous guest', 'famous guests')}` : ''].filter(Boolean);
    const list = deeds.length > 1 ? `${deeds.slice(0, -1).join(', ')} and ${deeds[deeds.length - 1]}` : deeds[0];
    return `In the ${cal.year > 1 ? `${ordinal(cal.year)} Mouse Year` : 'first Mouse Year'} of Whiskerwood Library, a library of ${this.builtCount()} floors${wings ? ` and ${wings} wing${wings > 1 ? 's' : ''}` : ''}, its keepers came down the Lantern Stair with a lamp and a very good book.

They had ${list}. A reformed thief carried the lamp. A mole carried the cocoa.

The dragon asked what a book was for, and they gave him a good answer.

Now, every night, somebody from the library goes down to read to Umber. On Tuesdays it is Rattigan, who does the voices. Umber always asks for the one about the King’s socks.

This page is not finished. Neither is the library. Nothing worth keeping ever is.`;
  }
  updateDeep(now) {
    const s = this.s; const d = s.deep;
    if (!d.open && s.rooms[DEEP_ROOM]?.built) this.openDeep();
    for (const id in d.biz) {
      const b = d.biz[id];
      if (!b.built && b.buildEnd && now >= b.buildEnd) { b.built = true; b.lvl = Math.max(1, b.lvl); this.markDirty(); this.addXp(12); this.emit('bizOpen', { id }); this.checkQuest(); }
    }
    if (!d.jobs.length) return;
    const done = d.jobs.filter((j) => now >= j.end);
    if (!done.length) return;
    d.jobs = d.jobs.filter((j) => now < j.end);
    for (const j of done) {
      const id = cellId(j.c, j.r);
      if (j.kind === 'dig') {
        d.dug[id] = 1;
        s.stats.digs = (s.stats.digs || 0) + 1;
        const k = cellKind(j.c, j.r);
        const out = { ...j };
        if (k === 'F' && FOSSIL_AT[id] && !d.fossils[FOSSIL_AT[id]]) { d.fossils[FOSSIL_AT[id]] = 1; out.fossil = FOSSILS.find((f) => f.id === FOSSIL_AT[id]); this.markDirty(); }
        if (k === 'T' && !d.found[id]) { d.found[id] = 1; const cheese = 8 + Math.floor(Math.random() * 8); this.addCheese(cheese); const coins = this.rewardCoins(900); this.earn(coins); out.treasure = { cheese, coins }; }
        this.addXp(4);
        this.emit('deepDone', out);
      } else {
        d.halls[j.hall] = Math.max(this.hallStage(j.hall), j.step + 1);
        this.markDirty(); this.addXp(8);
        this.emit('deepDone', { ...j, restored: d.halls[j.hall] >= 3, name: HALLS[j.hall].name });
      }
    }
    this.checkQuest();
  }
  pageCount() { return CHRONICLE.length; }
  // Soil cells still waiting for the crew (bedrock and the hoard don't count).
  digsLeft() {
    let n = 0;
    for (let r = 0; r < DEEP_ROWS; r++) for (let c = 0; c < DEEP_COLS; c++) { const k = cellKind(c, r); if (k !== '#' && k !== 'D' && !this.cellDug(c, r) && !this.jobAt(c, r)) n++; }
    return n;
  }

  /* ---------------- Mole City ---------------- */
  // Once the first hall is restored the moles move in: the Grand Lift carries mice, hamsters and
  // moles down from the vault, and moles open shops in the tunnels. Prices are seconds of income.
  moleCityOpen() { return !!this.s.deep.open && this.hallsDone() >= MOLE_CITY_HALLS; }
  liftStops() { return this.s.deep.lift || 0; }
  liftNextRow() { return LIFT_ROWS[this.s.deep.lift] ?? -1; } // -1: the lift already goes all the way down
  liftRowOpen(r) { return r === DEEP_ROWS - 1 ? !!this.s.deep.door : this.cellDug(4, r) || this.cellDug(5, r); }
  // Why the next stop can't be built yet: 'city' | 'done' | 'dig' | 'door' | ''
  liftBlocker() {
    if (!this.moleCityOpen()) return 'city';
    const r = this.liftNextRow(); if (r < 0) return 'done';
    if (!this.liftRowOpen(r)) return r === DEEP_ROWS - 1 ? 'door' : 'dig';
    return '';
  }
  liftCost() { return this.steady() * liftSec(this.s.deep.lift); }
  buyLiftStop() {
    if (this.liftBlocker()) return false;
    if (!this.spend(this.liftCost())) { this.emit('cantAfford', { deep: true }); return false; }
    this.s.deep.lift++; this.markDirty(); this.addXp(10);
    this.emit('liftStop', { stops: this.s.deep.lift, row: LIFT_ROWS[this.s.deep.lift - 1] });
    this.checkQuest();
    return true;
  }
  biz(id) { return this.s.deep.biz[id] || null; }
  bizAt(c, r) { const id = cellId(c, r); for (const k in this.s.deep.biz) if (this.s.deep.biz[k].cell === id) return k; return null; }
  bizCount() { return Object.values(this.s.deep.biz).filter((b) => b.built).length; }
  // What stops a business opening: 'city' | 'open' | 'halls' | 'lift' | ''
  bizBlocker(id) {
    if (!this.moleCityOpen()) return 'city';
    if (this.biz(id)) return 'open';
    if (this.hallsDone() < BIZ_BY_ID[id].halls) return 'halls';
    if (!this.s.deep.lift) return 'lift';
    return '';
  }
  bizSpot(c, r) { return cellKind(c, r) === '.' && this.cellDug(c, r) && !this.bizAt(c, r) && !this.jobAt(c, r); }
  freeBizSpot() { for (let r = 0; r < DEEP_ROWS; r++) for (let c = 0; c < DEEP_COLS; c++) if (this.bizSpot(c, r)) return [c, r]; return null; }
  bizBuildCost(id) { return this.steady() * BIZ_BY_ID[id].cost; }
  buildBiz(id, c, r) {
    const b = BIZ_BY_ID[id];
    if (!b || this.bizBlocker(id) || !this.bizSpot(c, r)) return false;
    if (!this.spend(this.bizBuildCost(id))) { this.emit('cantAfford', { deep: true }); return false; }
    this.s.deep.biz[id] = { cell: cellId(c, r), built: false, buildEnd: Date.now() + b.build * 1000, lvl: 0, fx: [false, false, false, false] };
    this.markDirty(); this.addXp(10);
    this.emit('bizBuild', { id, c, r });
    return true;
  }
  bizRemaining(id) { const b = this.biz(id); return b && !b.built ? Math.max(0, (b.buildEnd - Date.now()) / 1000) : 0; }
  speedBiz(id) { const b = this.biz(id); if (!b || b.built) return; const rem = this.bizRemaining(id); b.buildEnd = rem <= 120 ? Date.now() : Date.now() + (rem / 2) * 1000; }
  cheeseForBiz(id) { return Math.max(1, Math.ceil(this.bizRemaining(id) / 120)); }
  finishBizCheese(id) { const b = this.biz(id); if (!b || b.built || !this.spendCheese(this.cheeseForBiz(id))) return false; b.buildEnd = Date.now(); this.updateDeep(Date.now()); return true; }
  bizLevelCost(id, n = 1) { const b = this.biz(id); let c = 0; for (let k = 1; k <= n; k++) c += bizLevelSec(BIZ_BY_ID[id], b.lvl + k); return c * this.steady(); }
  bizMaxLevels(id) {
    const b = this.biz(id); if (!b?.built) return 0;
    const inc = this.steady(); let c = 0; let n = 0;
    while (b.lvl + n < BIZ_MAX) { const nc = c + bizLevelSec(BIZ_BY_ID[id], b.lvl + n + 1) * inc; if (nc > this.s.coins) break; c = nc; n++; }
    return n;
  }
  buyBizLevel(id, n = 1) {
    const b = this.biz(id); if (!b?.built) return false;
    n = Math.min(n, BIZ_MAX - b.lvl); if (n <= 0) return false;
    if (!this.spend(this.bizLevelCost(id, n))) { this.emit('cantAfford', { deep: true }); return false; }
    const before = b.lvl; b.lvl += n;
    this.markDirty(); this.addXp(Math.min(20, 2 * n));
    this.emit('bizLevel', { id, before, lvl: b.lvl });
    this.checkQuest();
    return true;
  }
  bizFixtureCost(id, k) { return this.steady() * bizFixtureSec(BIZ_BY_ID[id], k); }
  buyBizFixture(id, k) {
    const b = this.biz(id); if (!b?.built || b.fx[k]) return false;
    if (!this.spend(this.bizFixtureCost(id, k))) { this.emit('cantAfford', { deep: true }); return false; }
    b.fx[k] = true; this.markDirty(); this.addXp(6);
    this.emit('bizFixture', { id, k });
    return true;
  }
  // Restored halls level up too (Lv 1 when restored).
  hallLevel(n) { return this.hallStage(n) >= 3 ? this.s.deep.hallLvl[n] || 1 : 0; }
  hallLevelCost(n, count = 1) { const L = this.hallLevel(n); let c = 0; for (let k = 1; k <= count; k++) c += hallLevelSec(n, L + k); return c * this.steady(); }
  hallMaxLevels(n) {
    const L = this.hallLevel(n); if (!L) return 0;
    const inc = this.steady(); let c = 0; let k = 0;
    while (L + k < HALL_MAX) { const nc = c + hallLevelSec(n, L + k + 1) * inc; if (nc > this.s.coins) break; c = nc; k++; }
    return k;
  }
  buyHallLevel(n, count = 1) {
    const L = this.hallLevel(n); if (!L) return false;
    count = Math.min(count, HALL_MAX - L); if (count <= 0) return false;
    if (!this.spend(this.hallLevelCost(n, count))) { this.emit('cantAfford', { deep: true }); return false; }
    this.s.deep.hallLvl[n] = L + count;
    this.markDirty(); this.addXp(Math.min(20, 2 * count));
    this.emit('hallLevel', { n, lvl: L + count });
    return true;
  }

  /* ---------------- developer tools (CONFIG.devTools) ---------------- */
  devCoins(sec) { const amt = Math.max(1e9, this.steady() * sec); this.earn(amt); return amt; }
  // Finish every running timer: floors, wings, the movers, the mole crew, print runs and club nights.
  devFinishTimers() {
    const now = Date.now(); const s = this.s;
    s.rooms.forEach((r) => { if (!r.built && r.buildEnd) r.buildEnd = now; });
    for (const st of Object.values(s.wings)) { if (!st.built && st.buildEnd) st.buildEnd = now; if (st.runEnd > now) st.runEnd = now; st.next = 0; }
    if (s.move.end) s.move.end = now;
    s.deep.jobs.forEach((j) => { j.end = now; });
    for (const b of Object.values(s.deep.biz)) if (!b.built) b.buildEnd = now;
    s.gift.next = now;
    this.update(0);
  }

  /* ---------------- shop items paid for with ads instead of cheese ---------------- */
  // Every cheese price has an ad alternative: watch a few ads (progress is kept) and it's yours.
  adsFor(cheese) { return Math.max(1, Math.ceil(cheese / 6)); }
  adBuyProgress(key) { return this.s.adBuy[key] || 0; }
  // Returns true when this ad completes the purchase (progress is then cleared).
  adBuyStep(key, cheese) {
    const n = (this.s.adBuy[key] || 0) + 1;
    if (n >= this.adsFor(cheese)) { delete this.s.adBuy[key]; return true; }
    this.s.adBuy[key] = n; return false;
  }

  /* ---------------- persistence ---------------- */
  save() {
    const copy = { ...this.s, jar: this.s.jar + this.jarPending() };
    saveState(copy);
    this.s.lastSeen = copy.lastSeen;
  }
}
