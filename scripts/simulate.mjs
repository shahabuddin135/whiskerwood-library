// Balance simulator: a greedy bot plays the economy and reports pacing.
// Usage: npm run simulate [-- --hours 6 --boost 1.3 --quills 0]
import { ROOMS } from '../src/data/rooms.js';
import {
  newRoomState, roomBaseIncome, permanentMult, trackCost, applyTrack,
  pendingQuills, repXpNeeded, milestoneCount, BOOK_MILESTONES,
} from '../src/core/economy.js';

const TRACKS = ['lvl', 'seats', 'shelves', 'staff', 'decor0', 'decor1', 'decor2', 'decor3', 'decor4'];
export const fmt = (n) => n < 1e3 ? n.toFixed(0) : n < 1e6 ? (n / 1e3).toFixed(1) + 'K' : n < 1e9 ? (n / 1e6).toFixed(1) + 'M' : n < 1e12 ? (n / 1e9).toFixed(1) + 'B' : n < 1e15 ? (n / 1e12).toFixed(1) + 'T' : n.toExponential(1);
export const mmss = (t) => `${Math.floor(t / 60)}m${String(Math.floor(t % 60)).padStart(2, '0')}s`;

// Returns { builtAt: [seconds], log: [...], perMinute: [...] }.
// `skipBuild`: fraction of build time players skip with ads/cheese.
export function simulate({ hours = 5, boost = 1.3, quills = 0, branch = 0, skipBuild = 0.5, stopAfterRoom = Infinity } = {}) {
  const s = {
    rooms: ROOMS.map((_, i) => newRoomState(i === 0)), coins: 0, quills, branch,
    rep: 1, xp: 0, album: {}, shop: { perm: 0 }, branchEarned: 0,
  };
  const income = () => ROOMS.reduce((t, _, i) => t + roomBaseIncome(s, i), 0) * permanentMult(s) * boost;
  const gain = (i, track) => {
    const r = s.rooms[i];
    const copy = { ...r, decor: [...r.decor] };
    applyTrack(copy, track, 1);
    return roomBaseIncome(s, i, copy) - roomBaseIncome(s, i);
  };
  const builtAt = [0]; const log = []; const perMinute = []; const earnedAt = [0];
  let purchases = 0; let buildQueue = null;

  for (let t = 0; t < hours * 3600; t++) {
    const inc = income();
    s.coins += inc; s.branchEarned += inc;
    if (buildQueue && t >= buildQueue.end) {
      s.rooms[buildQueue.i].built = true; builtAt[buildQueue.i] = t; earnedAt[buildQueue.i] = s.branchEarned;
      log.push(`${mmss(t)}  built  ${ROOMS[buildQueue.i].name.padEnd(24)} income ${fmt(income())}/s  earned ${fmt(s.branchEarned)}  quills ${pendingQuills(s)}`);
      if (buildQueue.i >= stopAfterRoom) break;
      buildQueue = null;
    }
    const next = s.rooms.findIndex((r) => !r.built);
    if (next > 0 && !buildQueue && s.coins >= ROOMS[next].unlock) {
      s.coins -= ROOMS[next].unlock; buildQueue = { i: next, end: t + Math.ceil(ROOMS[next].build * (1 - skipBuild)) };
      purchases++;
    }
    for (let guard = 0; guard < 50; guard++) {
      let best = null;
      s.rooms.forEach((r, i) => {
        if (!r.built) return;
        for (const tr of TRACKS) {
          const c = trackCost(s, i, tr);
          if (!isFinite(c)) continue;
          const score = c / Math.max(gain(i, tr), 1e-12);
          if (!best || score < best.score) best = { i, tr, c, score };
        }
      });
      if (!best) break;
      if (next > 0 && !buildQueue) {
        const eta = (ROOMS[next].unlock - s.coins) / income();
        if (eta < 45 && best.c > s.coins - ROOMS[next].unlock) break;
      }
      if (best.c > s.coins) break;
      const before = milestoneCount(s.rooms[best.i].lvl);
      s.coins -= best.c; applyTrack(s.rooms[best.i], best.tr, 1); purchases++;
      // milestone books (like the game)
      for (let m = before; m < Math.min(milestoneCount(s.rooms[best.i].lvl), BOOK_MILESTONES); m++) s.album[`${ROOMS[best.i].id}-${m}`] = 1;
      s.xp++; while (s.xp >= repXpNeeded(s.rep)) { s.xp -= repXpNeeded(s.rep); s.rep++; }
    }
    if (t % 60 === 59) perMinute.push(purchases);
    if (t % 1800 === 1799) log.push(`${mmss(t + 1)}  checkpoint income ${fmt(income())}/s  rep ${s.rep}  earned ${fmt(s.branchEarned)}  quills ${pendingQuills(s)}  lvls [${s.rooms.filter((r) => r.built).map((r) => r.lvl).join(',')}]`);
  }
  return { builtAt, earnedAt, log, perMinute, purchases, state: s };
}

if (/simulate\.mjs$/.test(process.argv[1] || '')) {
  const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? +process.argv[i + 1] : d; };
  const opts = { hours: arg('hours', 3), boost: arg('boost', 1.3), quills: arg('quills', 0), branch: arg('branch', 0), skipBuild: arg('skip', 0.5) };
  const { log, perMinute, purchases } = simulate(opts);
  console.log(`Simulated ${opts.hours}h, avg boost x${opts.boost}, quills ${opts.quills}, branch ${opts.branch}`);
  console.log(log.join('\n'));
  const rate = (a, b) => ((perMinute[b - 1] ?? purchases) - (perMinute[a - 1] ?? 0)) / (b - a);
  console.log(`purchases/min: 0-5m ${rate(0, 5).toFixed(1)}  5-15m ${rate(5, 15).toFixed(1)}  15-30m ${rate(15, 30).toFixed(1)}  30-60m ${rate(30, 60).toFixed(1)}  1-2h ${rate(60, 120).toFixed(1)}`);
}
