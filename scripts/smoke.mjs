// Headless logic smoke test: plays the Game class with a scripted "player"
// to make sure quests never get stuck and core systems behave.
// Usage: node scripts/smoke.mjs
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { Game } = await import('../src/core/game.js');
const { freshState } = await import('../src/core/save.js');
const { ROOMS } = await import('../src/data/rooms.js');
const { WINGS } = await import('../src/data/wings.js');
const { DEEP_COLS, DEEP_ROWS } = await import('../src/data/deep.js');

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
  // wings: build what's open, serve scones, level up for quests
  for (const w of WINGS) { const st = g.wing(w.id); if (g.wingOpen(w.id) && !st.built && !st.buildEnd && g.s.coins >= w.unlock && g.startWing(w.id)) st.buildEnd = Date.now() - 1; }
  if (q.type === 'wingLvl') g.buyWing(q.wing, 1);
  if (q.type === 'wingBuilt' && !g.wing(q.wing).built && !g.wing(q.wing).buildEnd && g.s.coins >= WINGS.find((w) => w.id === q.wing).unlock && g.startWing(q.wing)) g.wing(q.wing).buildEnd = Date.now() - 1;
  if (q.type === 'scones' && g.wing('cafe').built) { g.wing('cafe').next = 0; g.doWingAction('cafe'); }
  // the Deep Stacks: the crew works on shortened timers (like ads or cheese speed-ups)
  let crewWants = false;
  if (g.s.deep.open && !g.s.deep.tales) {
    for (const j of g.s.deep.jobs) { if (j.simEnd == null) j.simEnd = step + Math.ceil(j.total * 0.3); if (step >= j.simEnd) j.end = Date.now() - 1; }
    for (let r = 0; r < DEEP_ROWS && g.freeCrews() > 0; r++) for (let c = 0; c < DEEP_COLS && g.freeCrews() > 0; c++) {
      const a = g.cellAction(c, r);
      if (a === 'door') g.openDoor();
      else if (a === 'dig') { if (g.s.coins >= g.digCost(c, r)) g.startDig(c, r); else crewWants = true; }
      else if (a === 'restore') { if (g.s.coins >= g.restoreCost(c, r)) g.startRestore(c, r); else crewWants = true; }
    }
    if (g.s.deep.door && !g.s.deep.tales) g.claimTales();
  }
  // Mole City: the lift, new shops (timers skipped, like a speed-up) and shop levels, for quests
  if (g.moleCityOpen()) {
    if (q.type === 'liftStops' && !g.liftBlocker() && g.s.coins >= g.liftCost()) g.buyLiftStop();
    const spot = g.freeBizSpot();
    if (q.type === 'bizBuilt' && !g.biz(q.biz) && spot && g.s.coins >= g.bizBuildCost(q.biz)) g.buildBiz(q.biz, spot[0], spot[1]);
    for (const b of Object.values(g.s.deep.biz)) if (!b.built) b.buildEnd = Date.now() - 1;
    if (q.type === 'bizLvl') g.buyBizLevel(q.biz, 1);
  }
  // moving: when the site is full, buy the land and move in
  if (g.siteFull() && g.canBuyLand()) g.buyLand();
  if (g.s.move.end) { g.s.move.end = Date.now() - 1; if (g.moveReady()) { const res = g.prestige(); log.push(`${Math.round(t / 60)}m moved to ${res.to.name} (+${res.gained} quills)`); } }
  // build next floor, then buy cheapest upgrades
  const nx = g.nextFloor();
  // build timers use wall-clock time, so the bot skips them (like an ad/cheese speed-up)
  if (nx > 0 && g.constructing() < 0 && g.s.coins >= ROOMS[nx].unlock && g.startBuild(nx)) g.finishBuildNow(nx);
  let saving = (nx > 0 && (ROOMS[nx].unlock - g.s.coins) / g.income() < 600) || (g.siteFull() && !g.s.move.end && (g.moveCost() - g.s.coins) / g.income() < 900);
  if (crewWants && g.freeCrews() > 0) saving = true; // save up for the mole crew
  if (q.type === 'wingBuilt' && !g.wing(q.wing).built) saving = true; // and for the quest's new wing
  if (['liftStops', 'bizBuilt', 'bizLvl'].includes(q.type)) saving = true; // and for Mole City quests
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
console.log(log.filter((l) => l.includes('moved')).join('\n'));
console.log(`... ${log.length} quests done in 4h. rep ${g.s.rep}, cheese ${g.s.cheese}, floors ${g.builtCount()}, site ${g.branch().name}, wings ${WINGS.map((w) => g.wing(w.id).lvl).join('/')}, halls ${g.hallsDone()}/8, lift ${g.s.deep.lift}, shops ${g.bizCount()}, income ${g.income().toExponential(2)}/s`);

// daily
const d1 = g.dailyStatus(); if (!d1.canClaim || d1.day !== 0) fail('daily should start at day 0');
g.claimDaily(); const d2 = g.dailyStatus(); if (d2.canClaim) fail('daily claimed twice');
g.s.daily.last = '2000-01-01'; const d3 = g.dailyStatus(); if (d3.day !== 0 || d3.streak !== 0) fail('missed day should reset streak');

// offline
const off = g.offlineEarnings(10 * 3600 * 1000);
if (!(off.amount > 0) || !off.capped) fail('offline earnings should be positive and capped');

// moving: everything comes along (levels too); only the land's price is paid
const before = g.s.quills;
g.s.cheese += 100; g.buyFurniture('persian', 0);
g.s.coins += g.moveCost() * 1.5;
for (let i = g.nextFloor(); i >= 0; i = g.nextFloor()) { g.s.coins += ROOMS[i].unlock; g.startBuild(i); g.finishBuildNow(i); }
const builtBefore = g.builtCount(); const lvls = g.s.rooms.map((r) => r.lvl).join(); const decorBefore = g.s.rooms[0].decor.join(); const wingsBefore = WINGS.map((w) => g.wing(w.id).lvl).join();
const coinsBefore = g.s.coins; const cost = g.moveCost();
if (!g.canBuyLand()) fail(`should be able to buy land: ${g.landBlocker()}`);
g.buyLand();
if (Math.abs(g.s.coins - (coinsBefore - cost)) > 1) fail('land should cost exactly its price');
if (g.moveReady()) fail('movers should need time');
g.s.move.end = Date.now() - 1;
const res = g.prestige();
const ok = res && res.gained >= 1 && g.s.quills === before + res.gained && g.builtCount() >= builtBefore && g.s.rooms.map((r) => r.lvl).join() === lvls
  && g.s.rooms[0].decor.join() === decorBefore && WINGS.map((w) => g.wing(w.id).lvl).join() === wingsBefore && g.floorFurniture(0).rug === 'persian' && !g.moveReady() && g.floorCap() >= builtBefore;
if (!ok) fail('moving'); else console.log(`moving ok: +${res.gained} quills, ${res.floors} floors and every level moved to "${g.branch().name}" (${g.floorCap()} floors, ${g.plotsOpen()} wing plots)`);
if (!process.exitCode) console.log('SMOKE OK');
