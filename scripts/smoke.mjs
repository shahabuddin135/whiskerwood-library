// Headless logic smoke test: plays the Game class with a scripted "player"
// to make sure quests never get stuck and core systems behave.
// Usage: node scripts/smoke.mjs
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { Game } = await import('../src/core/game.js');
const { freshState } = await import('../src/core/save.js');
const { ROOMS } = await import('../src/data/rooms.js');

const g = new Game(freshState());
const fail = (m) => { console.error('FAIL:', m); process.exitCode = 1; };
const log = [];
let t = 0; let lastQuest = -1; let stuckFor = 0;
const TRACKS = ['lvl', 'seats', 'shelves', 'staff', 'decor0', 'decor1', 'decor2', 'decor3', 'decor4'];

for (let step = 0; step < 4 * 3600; step++) {
  t++;
  g.update(1);
  for (let i = 0; i < ROOMS.length; i++) g.flushRoom(i); // visitors pay
  if (step % 3 === 0) g.collectJar();
  // do what the quest asks when possible
  const q = g.s.quest;
  if (q.type === 'specials') g.greetSpecial();
  if (q.type === 'parcels') g.openedParcel();
  if (q.type === 'bellRings') g.ringBell(0);
  if (q.type === 'spins' && g.wheelStatus().free) g.grant(g.spinWheel('free').prize);
  if (q.type === 'books') g.grantBook();
  // event-driven actions happen every so often in real play
  if (['requests', 'cats', 'worms', 'lostBooks', 'fish', 'pets'].includes(q.type) && step % 30 === 0) { g.s.stats[q.type]++; g.checkQuest(); }
  // like a player, work towards the current quest's upgrade
  const qTrack = { level: 'lvl', seats: 'seats', shelves: 'shelves', staff: 'staff' }[q.type];
  if (qTrack && g.s.rooms[q.room]?.built) g.buy(q.room, qTrack);
  if (q.type === 'decor' && g.s.rooms[q.room]?.built) { const k = g.s.rooms[q.room].decor.indexOf(false); if (k >= 0) g.buy(q.room, `decor${k}`); }
  if (g.questProgress().done) { const got = g.claimQuest(); log.push(`${Math.round(t / 60)}m quest #${q.id}: ${q.text} -> ${got.map((r) => r.kind).join(',')}`); }
  // build next floor, then buy cheapest upgrades
  const nx = g.nextFloor();
  // build timers use wall-clock time, so the bot skips them (like an ad/cheese speed-up)
  if (nx > 0 && g.constructing() < 0 && g.s.coins >= ROOMS[nx].unlock && g.startBuild(nx)) g.finishBuildNow(nx);
  let saving = nx > 0 && (ROOMS[nx].unlock - g.s.coins) / g.income() < 600;
  if (q.room != null && g.s.rooms[q.room]?.built && (qTrack || q.type === 'decor')) {
    const tr = qTrack || `decor${g.s.rooms[q.room].decor.indexOf(false)}`;
    const c = g.cost(q.room, tr);
    if (isFinite(c) && c > g.s.coins && c < g.income() * 1800) saving = true; // save up for the quest
  }
  for (let k = 0; k < 20 && !saving; k++) {
    let best = null;
    g.s.rooms.forEach((r, i) => { if (!r.built) return; for (const tr of TRACKS) { const c = g.cost(i, tr); if (isFinite(c) && (!best || c < best.c)) best = { i, tr, c }; } });
    if (!best || best.c > g.s.coins * 0.6) break;
    g.buy(best.i, best.tr);
  }
  if (g.s.questIdx === lastQuest) stuckFor++; else { stuckFor = 0; lastQuest = g.s.questIdx; }
  if (stuckFor > 3600) { fail(`quest stuck for an hour: ${JSON.stringify(g.s.quest)} progress ${JSON.stringify(g.questProgress())}`); break; }
}
console.log(log.slice(0, 22).join('\n'));
console.log(`... ${log.length} quests done in 4h. rep ${g.s.rep}, cheese ${g.s.cheese}, floors ${g.builtCount()}, income ${g.income().toExponential(2)}/s`);

// daily
const d1 = g.dailyStatus(); if (!d1.canClaim || d1.day !== 0) fail('daily should start at day 0');
g.claimDaily(); const d2 = g.dailyStatus(); if (d2.canClaim) fail('daily claimed twice');
g.s.daily.last = '2000-01-01'; const d3 = g.dailyStatus(); if (d3.day !== 0 || d3.streak !== 0) fail('missed day should reset streak');

// offline
const off = g.offlineEarnings(10 * 3600 * 1000);
if (!(off.amount > 0) || !off.capped) fail('offline earnings should be positive and capped');

// prestige: floors, seats, décor and furniture move along; Book Collection levels and coins reset
const before = g.s.quills;
g.s.cheese += 100; g.buyFurniture('persian', 0);
g.s.branchStart = 0; // the bot played 4h; skip the moving-van rest
const builtBefore = g.builtCount(); const seatsBefore = g.s.rooms[0].seats; const decorBefore = g.s.rooms[0].decor.join();
if (g.canPrestige()) {
  const res = g.prestige();
  const ok = res && res.gained >= 1 && g.s.quills === before + res.gained && g.builtCount() >= builtBefore && g.s.rooms[0].seats === seatsBefore
    && g.s.rooms[0].decor.join() === decorBefore && g.s.rooms.every((r) => r.lvl === 1) && g.s.coins === 0 && g.floorFurniture(0).rug === 'persian' && !g.canPrestige();
  if (!ok) fail('prestige'); else console.log(`prestige ok: +${res.gained} quills, ${res.floors} floors moved to "${g.branch().name}"`);
} else console.log('prestige not yet available after 4h of bot play (pending quills:', g.pendingQuills(), ')');
if (!process.exitCode) console.log('SMOKE OK');
