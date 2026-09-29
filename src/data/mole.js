// Mole City: the town the moles build in the Deep Stacks' tunnels once word gets out. Moles open
// shops in dug tunnels, and the Grand Lift carries mice, hamsters and moles between the vault and
// every level of the maze. Up top is a mouse city; down below is a mole city.
const fx = (icon, name, desc) => ({ icon, name, desc });

// Prices are in seconds of your steady income (like digging), so they never get trivially cheap.
export const BIZ_MAX = 50;
export const BIZ_PER_LVL = 0.01; // +1% library income per business level
export const BIZ_MILESTONES = [10, 25, 50]; // +5% more at each
export const BIZ_MILESTONE_BONUS = 0.05;
export const BIZ_FIXTURE_BONUS = 0.03; // +3% per fixture
export const BIZ_GROWTH = 1.075;
const FIX_SEC = [8, 30, 120, 480]; // × the business's first-level price

export const BIZ = [
  {
    id: 'mushroom', name: 'Glowcap Mushroom Farm', short: 'Mushroom Farm', icon: '🍄', halls: 1, build: 5 * 60, cost: 600, lvlSec: 60,
    blurb: 'Neat beds of glowing mushrooms. Mice come down for the soup; moles come for the gossip.',
    wall: '#3f4a3a', floor: '#6b5a3a', sign: '#3d7a5a',
    fixtures: [fx('💡', 'Glow Lamps', 'Brighter mushrooms, happier farmers.'), fx('🪣', 'Watering Cans', 'Tiny, dented, much loved.'), fx('🧺', 'Harvest Baskets', 'Heaped with caps and stalks.'), fx('🍲', 'Soup Pot', 'Mushroom soup, the special of every day.')],
    lines: ['These glow in the dark! Handy.', 'One bowl of soup, extra croutons.', 'Don’t eat the blue ones. Or do. They’re lovely.', 'I water them with lullabies.', 'Best mushrooms under the meadow!'],
  },
  {
    id: 'pies', name: 'Mrs Burrow’s Pie Shop', short: 'Pie Shop', icon: '🥧', halls: 1, build: 10 * 60, cost: 900, lvlSec: 85,
    blurb: 'Hot pies with worm-free fillings, as the sign proudly says. Queues reach the lift.',
    wall: '#5a3f2e', floor: '#8a5a3a', sign: '#b5523b',
    fixtures: [fx('🔥', 'Stone Oven', 'Hot enough to bake a pie in four minutes.'), fx('🥧', 'Pie Shelves', 'Apple, cheese and “root surprise”.'), fx('🪧', 'Chalk Menu', 'Worm-free! (Moles were very clear about this.)'), fx('🧁', 'Tart Stand', 'Little ones, for little paws.')],
    lines: ['One cheese-and-onion, please!', 'Worm-free? Promise?', 'Still warm! Mind your whiskers.', 'I came down the lift just for this.', 'Mrs Burrow, you’re a genius.'],
  },
  {
    id: 'jeweller', name: 'Glitterdig Jewellers', short: 'Jeweller', icon: '💎', halls: 2, build: 15 * 60, cost: 1200, lvlSec: 110,
    blurb: 'Crystals from the grotto, cut and polished by a very fussy mole with a loupe.',
    wall: '#3a3a52', floor: '#5a5470', sign: '#6d5fa3',
    fixtures: [fx('🔍', 'Loupe & Bench', 'For finding the one flaw nobody else can see.'), fx('💍', 'Ring Cabinet', 'Tiny rings for tiny tails.'), fx('👑', 'Tiara Display', 'On loan to Queen Mozzarella most weekends.'), fx('✨', 'Sparkle Lamps', 'Every gem looks twice as shiny.')],
    lines: ['Is that a real sapphire?', 'I’ll take the small one. No, the big one.', 'It matches my eyes!', 'Mind the glass, please.', 'Polished it myself, I did.'],
  },
  {
    id: 'tea', name: 'The Root Tea House', short: 'Tea House', icon: '🍵', halls: 3, build: 20 * 60, cost: 1500, lvlSec: 135,
    blurb: 'Low tables, soft cushions and tea brewed from roots. Surprisingly nice.',
    wall: '#4a3a2e', floor: '#7a5a3a', sign: '#6b8e4e',
    fixtures: [fx('🫖', 'Iron Teapot', 'Takes an hour to boil. Worth it.'), fx('🪷', 'Cushion Nook', 'Once you sit down, you never leave.'), fx('🏮', 'Paper Lanterns', 'Soft light for slow afternoons.'), fx('🎋', 'Bamboo Screen', 'For private conversations about cheese.')],
    lines: ['Root tea? Tastes like… autumn.', 'Another pot, please.', 'This is the calmest place in the world.', 'I’ve been here since Tuesday.', 'Sip. Sigh. Sip.'],
  },
  {
    id: 'spa', name: 'Mudbath Spa', short: 'Mud Spa', icon: '🛁', halls: 4, build: 30 * 60, cost: 1800, lvlSec: 160,
    blurb: 'Warm mud baths, cucumber slices and a lot of very relaxed hamsters.',
    wall: '#5a4a44', floor: '#7a6a5a', sign: '#9b6fb0',
    fixtures: [fx('🥒', 'Cucumber Bar', 'For the eyes. Not for eating. (Everyone eats them.)'), fx('🧖', 'Towel Rack', 'Fluffy towels, warmed by the pipes.'), fx('🫧', 'Bubble Jets', 'Blub blub blub.'), fx('🪷', 'Lily Fountain', 'Tinkles gently. Very soothing.')],
    lines: ['Ahhh. This is the life.', 'I can’t feel my whiskers. In a good way.', 'More mud, please.', 'Blub.', 'Is it rude to fall asleep in here?'],
  },
  {
    id: 'cinema', name: 'Glow-worm Cinema', short: 'Cinema', icon: '🎬', halls: 5, build: 45 * 60, cost: 2100, lvlSec: 185,
    blurb: 'Glow-worms wriggle behind a paper screen to make the pictures move. Tonight: “Jaws” (a mole film).',
    wall: '#2a2230', floor: '#4a3a44', sign: '#e0404f',
    fixtures: [fx('🍿', 'Popcorn Cart', 'Butter, salt, and “worm-free” again.'), fx('💺', 'Velvet Seats', 'The back row is for moles who hold paws.'), fx('🎞️', 'Poster Wall', 'Coming soon: “The Mole Who Knew Too Much”.'), fx('🎟️', 'Ticket Booth', 'One crumb, one film, one very big popcorn.')],
    lines: ['Shh! It’s starting!', 'Pass the popcorn.', 'I’m not crying, it’s the dust.', 'The worm playing the hero is SO good.', 'Sequel! Sequel!'],
  },
  {
    id: 'cheese', name: 'The Cheese Cave', short: 'Cheese Cave', icon: '🧀', halls: 6, build: 60 * 60, cost: 2400, lvlSec: 210,
    blurb: 'Wheels of cheese aged in the cool dark for years. Mice ride the lift down just to sniff.',
    wall: '#4a4436', floor: '#6b5a44', sign: '#e0a02a',
    fixtures: [fx('🧀', 'Aging Racks', 'Every wheel turned by paw, every Tuesday.'), fx('🔔', 'Tasting Bell', 'Ding! A new wheel is ready.'), fx('🧊', 'Cool Stone Shelf', 'Perfect for the blue ones.'), fx('🍷', 'Grape Juice Barrel', 'Pairs with everything. Especially cheese.')],
    lines: ['This one is thirty years old!', 'Just a tiny sniff. Or a nibble.', 'Heaven smells like this.', 'Mice come from miles for my brie.', 'Don’t tell the library I was here.'],
  },
  {
    id: 'post', name: 'Tube Post Office', short: 'Post Office', icon: '📮', halls: 7, build: 90 * 60, cost: 2700, lvlSec: 235,
    blurb: 'Letters whoosh through brass tubes to every burrow under the meadow, and up to the library.',
    wall: '#4a4a52', floor: '#6d6a80', sign: '#4f7cac',
    fixtures: [fx('📨', 'Brass Tubes', 'WHOOSH. Letter delivered.'), fx('🗄️', 'Sorting Wall', 'A slot for every burrow.'), fx('📦', 'Parcel Scales', 'Weighs parcels and occasionally moles.'), fx('🪪', 'Stamp Counter', 'Stamps with little mole faces on.')],
    lines: ['A letter for the dragon, please.', 'Is this going up or down?', 'WHOOSH! Ha, I love that.', 'Second-class snail mail, please.', 'Any post for Burrow 42?'],
  },
];
export const BIZ_BY_ID = Object.fromEntries(BIZ.map((b) => [b.id, b]));
// Seconds of income for level `lvl` (1 is the opening level) and for each fixture.
export const bizLevelSec = (b, lvl) => b.lvlSec * Math.pow(BIZ_GROWTH, lvl - 1);
export const bizFixtureSec = (b, k) => b.lvlSec * FIX_SEC[k];
export const bizTier = (lvl) => (lvl >= 50 ? 4 : lvl >= 25 ? 3 : lvl >= 10 ? 2 : 1);
export function bizBonus(st) {
  if (!st?.built) return 0;
  return BIZ_PER_LVL * st.lvl + BIZ_MILESTONE_BONUS * BIZ_MILESTONES.filter((m) => st.lvl >= m).length + BIZ_FIXTURE_BONUS * (st.fx || []).filter(Boolean).length;
}

// The restored library halls can be upgraded too (more readers, more books). They start at Lv 1.
export const HALL_MAX = 50;
export const HALL_PER_LVL = 0.01;
export const hallLevelSec = (n, lvl) => 90 * (1 + 0.15 * (n - 1)) * Math.pow(1.075, lvl - 1);

// The Grand Lift runs down beside the entrance column (between columns 4 and 5) and stops at
// every level with a dug tunnel next to it. Each stop you open: +3% library income.
export const LIFT_X = 295; // world x of the shaft's centre
export const LIFT_ROWS = [0, 1, 2, 3, 5, 6]; // row 4 is solid bedrock: the lift passes straight through
export const LIFT_STOP_BONUS = 0.03;
export const liftSec = (stops) => 600 * Math.pow(2, stops); // seconds of income for the next stop
export const MOLE_CITY_HALLS = 1; // the moles move in once the first hall is restored
