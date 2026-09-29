// Balance simulator: a greedy bot plays the economy and reports pacing.
// It builds floors (as far as each site allows), buys land and moves to bigger sites, builds and
// levels the wings, and sends the mole crew through the Deep Stacks.
// Usage: npm run simulate [-- --hours 12 --boost 1.3]
import { ROOMS } from '../src/data/rooms.js';
import {
  newRoomState, roomBaseIncome, permanentMult, trackCost, applyTrack,
  pendingQuills, repXpNeeded, milestoneCount, BOOK_MILESTONES,
} from '../src/core/economy.js';
import { branchInfo } from '../src/data/branches.js';
import { WINGS, WING_MAX, wingMult, wingLevelCost } from '../src/data/wings.js';
import { DEEP_COLS, DEEP_ROWS, cellKind, digCostSec, digTimeSec, restoreCostSec, restoreTimeSec } from '../src/data/deep.js';

const TRACKS = ['lvl', 'seats', 'shelves', 'staff', 'decor0', 'decor1', 'decor2', 'decor3', 'decor4'];
export const fmt = (n) => n < 1e3 ? n.toFixed(0) : n < 1e6 ? (n / 1e3).toFixed(1) + 'K' : n < 1e9 ? (n / 1e6).toFixed(1) + 'M' : n < 1e12 ? (n / 1e9).toFixed(1) + 'B' : n < 1e15 ? (n / 1e12).toFixed(1) + 'T' : n.toExponential(1);
export const mmss = (t) => t >= 3600 ? `${Math.floor(t / 3600)}h${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}m` : `${Math.floor(t / 60)}m${String(Math.floor(t % 60)).padStart(2, '0')}s`;

// The mole crew's plan: dig towards the nearest unrestored hall, restore it, repeat; then the door.
function deepPlan(s) {
  const dug = s.deep.dug; const halls = s.deep.halls;
  const key = (c, r) => `${c},${r}`;
  const done = (n) => (halls[n] || 0) >= 3;
  const hallsDone = Object.values(halls).filter((v) => v >= 3).length;
  // a started hall to finish?
  for (const id of Object.keys(dug)) { const [c, r] = id.split(',').map(Number); const k = cellKind(c, r); if (k >= '1' && k <= '8' && !done(+k) && !(k === '8' && hallsDone < 7)) return { kind: 'restore', c, r, hall: +k }; }
  // breadth-first search from the dug cells to the nearest wanted target
  const want = (c, r) => { const k = cellKind(c, r); if (k >= '1' && k <= '8') return !(k === '8' && hallsDone < 7); return k === 'D' && hallsDone >= 8; };
  const q = []; const prev = new Map();
  for (const id of Object.keys(dug)) { q.push(id); prev.set(id, null); }
  while (q.length) {
    const id = q.shift(); const [c, r] = id.split(',').map(Number);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc; const nr = r + dr; const nid = key(nc, nr);
      if (nc < 0 || nr < 0 || nc >= DEEP_COLS || nr >= DEEP_ROWS || prev.has(nid) || cellKind(nc, nr) === '#') continue;
      prev.set(nid, id);
      if (want(nc, nr)) {
        // walk back to the first undug step
        let step = nid; while (prev.get(step) && !dug[prev.get(step)]) step = prev.get(step);
        const [sc, sr] = step.split(',').map(Number);
        return cellKind(sc, sr) === 'D' ? { kind: 'door' } : { kind: 'dig', c: sc, r: sr };
      }
      if (cellKind(nc, nr) !== 'D') q.push(nid);
    }
  }
  return null;
}

// Returns { log, perMinute, events, state }.
// `skipBuild`: share of every timer players skip with ads or cheese.
export function simulate({ hours = 12, boost = 1.3, skipBuild = 0.5, stopAfterRoom = Infinity, quiet = false } = {}) {
  const s = {
    rooms: ROOMS.map((_, i) => newRoomState(i === 0)), coins: 0, quills: 0, branch: 0,
    rep: 1, xp: 0, album: {}, shop: { perm: 0 }, branchEarned: 0,
    wings: Object.fromEntries(WINGS.map((w) => [w.id, { built: false, lvl: 0 }])),
    deep: { open: false, dug: {}, halls: {}, fossils: {}, tales: false },
  };
  const base = () => ROOMS.reduce((t, _, i) => t + roomBaseIncome(s, i), 0);
  const income = () => base() * permanentMult(s) * boost;
  const gain = (i, track) => {
    const r = s.rooms[i]; const copy = { ...r, decor: [...r.decor] };
    applyTrack(copy, track, 1);
    return (roomBaseIncome(s, i, copy) - roomBaseIncome(s, i)) * permanentMult(s) * boost;
  };
  const wingGain = (w) => { const st = s.wings[w.id]; const cur = permanentMult(s); return base() * boost * cur * ((wingMult(st.lvl + 1) - wingMult(st.lvl)) / (1 + WINGS.reduce((a, x) => a + (s.wings[x.id].built ? wingMult(s.wings[x.id].lvl) : 0), 0))); };
  const log = []; const perMinute = []; const events = {}; const builtAt = [0];
  const note = (t, what) => { events[what] = t; log.push(`${mmss(t).padStart(7)}  ${what.padEnd(30)} income ${fmt(income())}/s  site ${branchInfo(s.branch).name}`); };
  let purchases = 0; let build = null; let wingBuild = null; let move = null; let job = null;

  for (let t = 0; t < hours * 3600; t++) {
    const inc = income();
    s.coins += inc; s.branchEarned += inc;
    const site = branchInfo(s.branch);
    // timers
    if (build && t >= build.end) { s.rooms[build.i].built = true; builtAt[build.i] = t; note(t, `floor ${build.i + 1} ${ROOMS[build.i].name}`); if (build.i >= stopAfterRoom) break; build = null; }
    if (wingBuild && t >= wingBuild.end) { s.wings[wingBuild.id].built = true; s.wings[wingBuild.id].lvl = 1; note(t, `wing: ${wingBuild.id}`); wingBuild = null; }
    if (move && t >= move.end) { s.quills += pendingQuills(s); s.branch++; s.branchEarned = 0; note(t, `moved (+quills → ${s.quills})`); move = null; }
    if (!s.deep.open && s.rooms[4].built) { s.deep.open = true; s.deep.dug['4,0'] = 1; note(t, 'Deep Stacks open'); }
    if (job && t >= job.end) {
      if (job.kind === 'dig') { s.deep.dug[`${job.c},${job.r}`] = 1; if (cellKind(job.c, job.r) === 'F') s.deep.fossils[`${job.c},${job.r}`] = 1; }
      else { s.deep.halls[job.hall] = (s.deep.halls[job.hall] || 0) + 1; if (s.deep.halls[job.hall] >= 3) note(t, `hall ${job.hall} restored`); }
      job = null;
    }
    // the mole crew
    let deepCost = 0;
    if (s.deep.open && !job && !s.deep.tales) {
      const plan = deepPlan(s);
      if (plan?.kind === 'door') { s.deep.tales = true; note(t, 'THE MIGHTY TALES'); }
      else if (plan) {
        const secIncome = inc / boost; // costs use steady income
        const cost = secIncome * (plan.kind === 'dig' ? digCostSec(plan.r) : restoreCostSec(plan.r, s.deep.halls[plan.hall] || 0));
        deepCost = cost;
        if (s.coins >= cost) {
          s.coins -= cost; deepCost = 0;
          const time = plan.kind === 'dig' ? digTimeSec(plan.r) : restoreTimeSec(plan.r, s.deep.halls[plan.hall] || 0);
          job = { ...plan, end: t + Math.ceil(time * (1 - skipBuild)) };
        }
      }
    }
    // floors, as far as this site allows
    const next = s.rooms.findIndex((r) => !r.built);
    const canFloor = next > 0 && next < site.floors && !build;
    if (canFloor && s.coins >= ROOMS[next].unlock) { s.coins -= ROOMS[next].unlock; build = { i: next, end: t + Math.ceil(ROOMS[next].build * (1 - skipBuild)) }; purchases++; }
    // wings
    const openWing = WINGS.find((w) => w.plot < site.plots && !s.wings[w.id].built);
    if (openWing && !wingBuild && s.coins >= openWing.unlock) { s.coins -= openWing.unlock; wingBuild = { id: openWing.id, end: t + Math.ceil(openWing.build * (1 - skipBuild)) }; }
    // moving: once this site is full, save up for the land
    const full = next < 0 || next >= site.floors;
    const nb = branchInfo(s.branch + 1);
    const wantMove = full && !build && !move && next >= 0;
    if (wantMove && s.coins >= nb.cost) { s.coins -= nb.cost; move = { end: t + Math.ceil(nb.prep * (1 - skipBuild)) }; note(t, `bought land at ${nb.name}`); }
    // save up for big things instead of spending everything on small upgrades
    const target = deepCost || (canFloor ? ROOMS[next].unlock : wantMove ? nb.cost : openWing && !wingBuild ? openWing.unlock : 0);
    for (let guard = 0; guard < 60; guard++) {
      let best = null;
      s.rooms.forEach((r, i) => {
        if (!r.built) return;
        for (const tr of TRACKS) {
          const c = trackCost(s, i, tr); if (!isFinite(c)) continue;
          const score = c / Math.max(gain(i, tr), 1e-12);
          if (!best || score < best.score) best = { i, tr, c, score };
        }
      });
      for (const w of WINGS) {
        const st = s.wings[w.id]; if (!st.built || st.lvl >= WING_MAX) continue;
        const c = wingLevelCost(w, st.lvl); const score = c / Math.max(wingGain(w), 1e-12);
        if (!best || score < best.score) best = { wing: w, c, score };
      }
      if (!best) break;
      if (deepCost && best.c > s.coins - deepCost) break; // the crew comes first
      if (target && !deepCost) { const eta = (target - s.coins) / income(); if (eta < 90 && best.c > s.coins - target) break; }
      if (best.c > s.coins) break;
      s.coins -= best.c; purchases++;
      if (best.wing) { s.wings[best.wing.id].lvl++; continue; }
      const before = milestoneCount(s.rooms[best.i].lvl);
      applyTrack(s.rooms[best.i], best.tr, 1);
      for (let m = before; m < Math.min(milestoneCount(s.rooms[best.i].lvl), BOOK_MILESTONES); m++) s.album[`${ROOMS[best.i].id}-${m}`] = 1;
      s.xp++; while (s.xp >= repXpNeeded(s.rep)) { s.xp -= repXpNeeded(s.rep); s.rep++; }
    }
    if (t % 60 === 59) perMinute.push(purchases);
    if (!quiet && t % 3600 === 3599) log.push(`${mmss(t + 1).padStart(7)}  -- checkpoint income ${fmt(income())}/s  coins ${fmt(s.coins)}  wings [${WINGS.map((w) => s.wings[w.id].lvl).join(',')}]  lvls [${s.rooms.filter((r) => r.built).map((r) => r.lvl).join(',')}]`);
  }
  return { log, perMinute, purchases, events, builtAt, state: s };
}

if (/simulate\.mjs$/.test(process.argv[1] || '')) {
  const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? +process.argv[i + 1] : d; };
  const opts = { hours: arg('hours', 12), boost: arg('boost', 1.3), skipBuild: arg('skip', 0.5) };
  const { log, perMinute, purchases } = simulate(opts);
  console.log(`Simulated ${opts.hours}h of play, avg boost x${opts.boost}, ${Math.round(opts.skipBuild * 100)}% of timers skipped`);
  console.log(log.join('\n'));
  const rate = (a, b) => ((perMinute[b - 1] ?? purchases) - (perMinute[a - 1] ?? 0)) / (b - a);
  console.log(`purchases/min: 0-5m ${rate(0, 5).toFixed(1)}  5-15m ${rate(5, 15).toFixed(1)}  15-30m ${rate(15, 30).toFixed(1)}  30-60m ${rate(30, 60).toFixed(1)}  1-2h ${rate(60, 120).toFixed(1)}  2-6h ${rate(120, 360).toFixed(1)}`);
}
