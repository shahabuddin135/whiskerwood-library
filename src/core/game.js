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

const COUNT_TYPES = ['jarCollects', 'specials', 'spins', 'parcels', 'bellRings', 'requests', 'cats', 'worms', 'lostBooks', 'fish', 'pets'];
const RARITY_WEIGHT = { C: 50, R: 30, E: 15, L: 5 };
export const OFFLINE_RATE = 0.6;
export const STORY_HOUR_SEC = 30 * 60;
export const STORY_HOUR_MAX = 4 * 3600;
export const PRESTIGE_ROOM = 5; // Poetry Greenhouse must be built to open a new branch
export const MOVE_REST_SEC = 20 * 60; // the moving van needs a rest between moves

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

  update(dt) {
    const now = Date.now();
    const s = this.s;
    if (s.boosts.length && s.boosts.some((b) => b.end <= now)) {
      s.boosts = s.boosts.filter((b) => b.end > now);
      this.markDirty(); this.emit('boost');
    }
    s.rooms.forEach((r, i) => { if (!r.built && r.buildEnd && now >= r.buildEnd) this.completeBuild(i); });

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
  nextFloor() { return this.s.rooms.findIndex((r) => !r.built && !r.buildEnd); }
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
      case 'books': cur = E.booksOwned(s); break;
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
  shopBuy(kind, arg) {
    const sh = this.s.shop;
    if (kind === 'jar' || kind === 'offline') {
      const next = SHOP[kind][sh[kind] + 1];
      if (!next || !this.spendCheese(next.cost)) return false;
      sh[kind]++; this.emit('shop'); return true;
    }
    if (kind === 'perm') {
      const cost = SHOP.perm[sh.perm];
      if (cost == null || !this.spendCheese(cost)) return false;
      sh.perm++; this.markDirty(); this.emit('shop'); return true;
    }
    if (kind === 'warp') {
      const w = SHOP.warp[arg];
      if (!this.spendCheese(w.cost)) return false;
      const amt = this.rewardCoins(w.sec); this.earn(amt); this.emit('shop'); return amt;
    }
    if (kind === 'crate') {
      if (!this.spendCheese(SHOP.crate)) return false;
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
  buyFurniture(id, floor = null) {
    const f = FURN[id];
    if (!f || this.ownsFurniture(id) || !this.spendCheese(f.price)) return false;
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
    if (this._festAt === undefined || t - this._festAt > 30000) { this._fest = festivalAt(Date.now(), this.s.created || Date.now()); this._festAt = t; }
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

  /* ---------------- prestige ---------------- */
  pendingQuills() { return E.pendingQuills(this.s); }
  moveWait() { return Math.max(0, MOVE_REST_SEC - (Date.now() - (this.s.branchStart || 0)) / 1000); }
  canPrestige() { return this.s.rooms[PRESTIGE_ROOM].built && this.pendingQuills() >= 1 && this.moveWait() <= 0; }
  nextBranch() { return branchInfo(this.s.branch + 1); }
  branch() { return branchInfo(this.s.branch); }
  // Move the library to the next branch. Every floor moves along with its seats, shelves,
  // librarian, décor and furniture; only the Book Collection levels and coins start fresh.
  prestige() {
    if (!this.canPrestige()) return null;
    const s = this.s;
    const from = this.branch();
    const gained = this.pendingQuills();
    s.quills += gained;
    s.branch++;
    s.branchStart = Date.now();
    s.coins = 0; s.jar = 0; s.branchEarned = 0;
    s.rooms.forEach((r) => {
      if (!r.built && r.buildEnd) { r.built = true; r.buildEnd = 0; } // the movers finish any floor under construction
      r.lvl = 1;
    });
    s.boosts = [];
    s.quest = null;
    s.stats.prestiges++;
    this.pending = ROOMS.map(() => 0);
    this.markDirty();
    this.ensureQuest();
    const res = { gained, from, to: this.branch(), floors: this.builtCount() };
    this.emit('prestige', res);
    return res;
  }

  /* ---------------- persistence ---------------- */
  save() {
    const copy = { ...this.s, jar: this.s.jar + this.jarPending() };
    saveState(copy);
    this.s.lastSeen = copy.lastSeen;
  }
}
