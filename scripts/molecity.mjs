// Logic test for Mole City: the Grand Lift, mole shops, hall levels, quests and save migration.
// Usage: node scripts/molecity.mjs
const store = {};
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const { Game } = await import('../src/core/game.js');
const { freshState, loadState } = await import('../src/core/save.js');
const { BIZ, LIFT_ROWS } = await import('../src/data/mole.js');
const { generateQuest } = await import('../src/data/quests.js');
const E = await import('../src/core/economy.js');

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error('FAIL:', msg); } };

const s = freshState();
s.rooms.forEach((r) => { r.built = true; r.buildEnd = 0; r.lvl = 60; });
s.coins = 1e40;
const g = new Game(s);
g.openDeep();
check(!g.moleCityOpen(), 'Mole City should wait for the first restored hall');
check(g.liftBlocker() === 'city', 'lift blocked until the moles move in');
s.deep.halls[1] = 3; g.markDirty();
check(g.moleCityOpen(), 'Mole City opens after the first hall');
// the lift: row 0 is the entrance, dug from the start
const inc0 = g.steady();
check(g.liftBlocker() === '' && g.buyLiftStop(), 'first lift stop');
check(g.steady() > inc0 * 1.02, 'a lift stop raises income');
check(g.liftBlocker() === 'dig', `next stop needs a dug tunnel, got ${g.liftBlocker()}`);
s.deep.dug['4,1'] = 1;
check(g.buyLiftStop() && s.deep.lift === 2, 'second stop after digging');
// shops: need the lift, a dug plain tunnel, and enough restored halls
check(g.bizBlocker('pies') === '', 'pie shop available with 1 hall');
check(g.bizBlocker('post') === 'halls', 'post office needs 7 halls');
check(!g.buildBiz('pies', 3, 0), 'bedrock is not a shop spot');
check(!g.buildBiz('pies', 5, 0), 'undug tunnel is not a shop spot');
s.deep.dug['5,0'] = 1;
check(g.buildBiz('pies', 5, 0), 'build the pie shop');
check(g.cellAction(5, 0) === 'biz' && g.bizAt(5, 0) === 'pies', 'the cell now holds the shop');
check(!g.buildBiz('mushroom', 5, 0), 'one shop per tunnel');
check(!g.buildBiz('pies', 4, 1), 'each shop opens once');
check(!g.buyBizLevel('pies'), 'no levels before opening');
g.updateDeep(Date.now() + 11 * 60 * 1000);
check(g.biz('pies').built && g.biz('pies').lvl === 1, 'the shop opens when its timer ends');
const inc1 = g.steady();
check(g.buyBizLevel('pies', 10) && g.biz('pies').lvl === 11, 'level up ×10');
check(g.steady() > inc1 * 1.1, 'shop levels (and the Lv 10 milestone) raise income');
check(g.buyBizFixture('pies', 2) && g.biz('pies').fx[2] && !g.buyBizFixture('pies', 2), 'fixtures buy once');
s.coins = 0;
check(g.bizMaxLevels('pies') === 0 && !g.buyBizLevel('pies'), 'no coins, no levels');
s.coins = 1e40;
g.buyBizLevel('pies', 999);
check(g.biz('pies').lvl === 50, 'levels cap at 50');
// hall levels
check(g.hallLevel(1) === 1 && g.hallLevel(2) === 0, 'restored halls start at Lv 1');
check(g.buyHallLevel(1, 9) && g.hallLevel(1) === 10, 'hall levels');
check(!g.buyHallLevel(2), 'unrestored halls cannot level');
// quests: the helper offers Mole City goals
const H = g.questHelpers();
const m = H.mole();
check(m && ['liftStops', 'bizBuilt', 'bizLvl'].includes(m.type), `mole quest helper: ${JSON.stringify(m)}`);
let sawMole = false;
for (let n = 0; n < 40; n++) { const q = generateQuest(n, s, H); if (['liftStops', 'bizBuilt', 'bizLvl'].includes(q.type)) sawMole = true; }
check(sawMole, 'generated quests include Mole City');
// a shop quest never appears without a free tunnel
const saved = s.deep.dug; s.deep.dug = { '4,0': 1, '5,0': 1 }; // the entrance and the pie shop only
const m2 = g.questHelpers().mole();
check(!m2 || m2.type !== 'bizBuilt', 'no shop quest without an empty tunnel');
s.deep.dug = saved;
// economy: the bonus shows up in deepMult
check(E.moleBonus(s) > 0.5, `mole bonus ${E.moleBonus(s)}`);
// save + migrate: junk is cleaned, good data kept
g.save();
const raw = JSON.parse(store[Object.keys(store)[0]]);
raw.deep.biz.bogus = { cell: '1,1', built: true, lvl: 3 };
raw.deep.biz.pies.fx = 'oops';
raw.deep.lift = 99;
localStorage.setItem(Object.keys(store)[0], JSON.stringify(raw));
const back = loadState();
check(!back.deep.biz.bogus, 'unknown shops dropped');
check(Array.isArray(back.deep.biz.pies.fx) && back.deep.biz.pies.fx.length === 4, 'fixtures repaired');
check(back.deep.lift === LIFT_ROWS.length, 'lift clamped');
check(back.deep.biz.pies.lvl === 50 && back.deep.hallLvl[1] === 10, 'levels kept');
// an old save without Mole City at all
const old = JSON.parse(JSON.stringify(raw)); delete old.deep.biz; delete old.deep.lift; delete old.deep.hallLvl;
localStorage.setItem(Object.keys(store)[0], JSON.stringify(old));
const back2 = loadState();
check(back2.deep.lift === 0 && typeof back2.deep.biz === 'object' && typeof back2.deep.hallLvl === 'object', 'old saves get empty Mole City');
check(BIZ.length === 8, '8 businesses');
console.log(fails ? `${fails} Mole City check(s) failed` : 'Mole City: all checks passed');
process.exitCode = fails ? 1 : 0;
