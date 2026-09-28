// Pure economy math. No DOM access so it can run inside the Node balance simulator.
import { ROOMS, MILESTONES, LIMITS, GROWTH, DECOR, BOOKS, BOOK_BONUS, SET_BONUS } from '../data/rooms.js';
import { branchInfo } from '../data/branches.js';

export const QUILL_BONUS = 0.1; // +10% income per Golden Quill
export const BOOK_MILESTONES = 5; // the first 5 milestones (Lv 10/25/50/100/150) each deliver a book
export const REP_BONUS = 0.02; // +2% income per reputation level

export function newRoomState(built = false) {
  return { built, buildEnd: 0, lvl: 1, seats: 1, shelves: 1, staff: 1, decor: [false, false, false, false, false] };
}

export function milestoneCount(lvl) {
  let c = 0;
  for (const m of MILESTONES) { if (lvl >= m) c++; else break; }
  return c;
}
export const nextMilestone = (lvl) => MILESTONES.find((m) => m > lvl) ?? null;
export const prevMilestone = (lvl) => [...MILESTONES].reverse().find((m) => m <= lvl) ?? 0;

export function albumMult(state, i) {
  let owned = 0;
  for (let k = 0; k < 5; k++) if (state.album?.[`${ROOMS[i].id}-${k}`]) owned++;
  return (1 + BOOK_BONUS * owned) * (owned === 5 ? SET_BONUS : 1);
}

export function decorMult(r) {
  let m = 1;
  r.decor.forEach((own, k) => { if (own) m += DECOR[k].bonus; });
  return m;
}

export const seatMult = (r) => r.seats;
export const shelfMult = (r) => 1 + 0.5 * (r.shelves - 1);
export const staffMult = (r) => 1 + 0.1 * (r.staff - 1);

// Income/sec of a floor before global multipliers.
export function roomBaseIncome(state, i, r = state.rooms[i]) {
  if (!r || !r.built) return 0;
  const d = ROOMS[i];
  return d.base * r.lvl * Math.pow(2, milestoneCount(r.lvl)) * seatMult(r) * shelfMult(r) * staffMult(r) * decorMult(r) * albumMult(state, i);
}

// Multipliers that last forever (this branch).
export function permanentMult(state) {
  return (1 + QUILL_BONUS * (state.quills || 0))
    * branchInfo(state.branch || 0).mult
    * (1 + REP_BONUS * ((state.rep || 1) - 1))
    * Math.pow(2, state.shop?.perm || 0);
}

// Timed boosts (ads, royal visits). Returns multiplier for room i (or global when i == null).
export function boostMult(state, now, i = null) {
  let m = 1;
  if (state.boostEnd > now) m *= 2; // Story Hour
  for (const b of state.boosts || []) {
    if (b.end > now && (b.room == null || b.room === i)) m *= b.mult;
  }
  return m;
}

export function roomIncome(state, i, now = Date.now()) {
  return roomBaseIncome(state, i) * permanentMult(state) * boostMult(state, now, i);
}

export function totalIncome(state, now = Date.now()) {
  let t = 0;
  for (let i = 0; i < state.rooms.length; i++) t += roomIncome(state, i, now);
  return t;
}

// Income without temporary boosts (used for rewards so ads can't compound forever).
export function steadyIncome(state) {
  let t = 0;
  const pm = permanentMult(state);
  for (let i = 0; i < state.rooms.length; i++) t += roomBaseIncome(state, i) * pm;
  return t;
}

/* ---------------- Costs ---------------- */

export function levelCost(i, lvl, n = 1) {
  const d = ROOMS[i];
  const r = GROWTH.level;
  const first = d.lvl * Math.pow(r, lvl - 1);
  return n === 1 ? first : first * (Math.pow(r, n) - 1) / (r - 1);
}

export function maxLevelsAffordable(i, lvl, coins) {
  const d = ROOMS[i];
  const r = GROWTH.level;
  const first = d.lvl * Math.pow(r, lvl - 1);
  if (coins < first) return 0;
  const n = Math.floor(Math.log(coins * (r - 1) / first + 1) / Math.log(r));
  return Math.max(0, Math.min(n, LIMITS.level - lvl));
}

export const seatCost = (i, seats) => ROOMS[i].seatC * Math.pow(GROWTH.seat, seats - 1);
export const shelfCost = (i, shelves) => ROOMS[i].shelfC * Math.pow(GROWTH.shelf, shelves - 1);
export const staffCost = (i, staff) => ROOMS[i].staffC * Math.pow(GROWTH.staff, staff - 1);
export const decorCost = (i, k) => ROOMS[i].decorC * Math.pow(GROWTH.decor, k);

export function trackCost(state, i, track, n = 1) {
  const r = state.rooms[i];
  switch (track) {
    case 'lvl': return r.lvl >= LIMITS.level ? Infinity : levelCost(i, r.lvl, n);
    case 'seats': return r.seats >= LIMITS.seats ? Infinity : seatCost(i, r.seats);
    case 'shelves': return r.shelves >= LIMITS.shelves ? Infinity : shelfCost(i, r.shelves);
    case 'staff': return r.staff >= LIMITS.staff ? Infinity : staffCost(i, r.staff);
    default:
      if (track.startsWith('decor')) {
        const k = +track.slice(5);
        return r.decor[k] ? Infinity : decorCost(i, k);
      }
  }
  return Infinity;
}

// Applies a purchase to a room state copy-free (mutates). Used by game + simulator.
export function applyTrack(r, track, n = 1) {
  switch (track) {
    case 'lvl': r.lvl += n; break;
    case 'seats': r.seats++; break;
    case 'shelves': r.shelves++; break;
    case 'staff': r.staff++; break;
    default: if (track.startsWith('decor')) r.decor[+track.slice(5)] = true;
  }
}

/* ---------------- Visitors (display + visual pacing) ---------------- */

// Seconds a visitor spends reading. Better staff = faster service.
export const readTime = (r) => 5.5 / Math.sqrt(staffMult(r));
// Visual spawn interval for new visitors.
export const spawnInterval = (r) => 3.2 / shelfMult(r);

export function visitorsPerMin(r) {
  if (!r?.built) return 0;
  const visit = readTime(r) + 9; // reading + walking/browsing/paying
  return Math.min(60 / spawnInterval(r), (r.seats * 60) / visit);
}

/* ---------------- Prestige ---------------- */

export function quillsForEarnings(earned) {
  return Math.floor(Math.pow(earned / 1e12, 0.33) * 3);
}

export function pendingQuills(state) {
  return Math.max(0, quillsForEarnings(state.branchEarned || 0));
}

/* ---------------- Reputation ---------------- */

export const repXpNeeded = (lvl) => Math.round(5 + lvl * 3 + Math.pow(lvl, 1.5));

/* ---------------- Album ---------------- */

export function booksOwned(state) {
  return BOOKS.filter((b) => state.album?.[b.id]).length;
}
