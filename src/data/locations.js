// World locations. "Moving the library" travels to the next one on the map.
// Each location re-skins the whole building (shell, roof, walls, shelves, windows, floors,
// lamps, desk), brings its own scenery, host, shop, interactive mechanic, souvenirs and a
// permanent Passport stamp perk that is kept forever.

export const LOCATIONS = [
  {
    id: 'meadow', name: 'Meadow Burrow', library: 'Whiskerwood Library', mult: 1,
    tagline: 'A cosy cottage library in the old meadow',
    blurb: 'Timber beams, a red-tiled roof, a fishing pond and the smell of warm bread drifting over from the village.',
    host: 'mimsy', shop: { name: "Bramble's Bits & Bobs", keeper: 'bramble', hello: ['Mind the step, dearie. And the cat.', 'Everything here is gently used. Mostly by me.', 'Buy two rugs, get a free sneeze. Dusty stock!'] },
    mechanic: { id: 'fishing', name: 'Pond fishing', icon: 'fish', desc: 'Tap the angler when the float bobs. Sometimes the pond coughs up a keepsake.' },
    perk: { id: 'movingVan', name: 'Moving Van', icon: 'van', desc: 'Every new location opens with 3 floors already built.' },
    souvenirs: [
      { id: 'acorn', name: 'Golden Acorn', desc: 'Found at the bottom of the pond. The squirrels want it back.' },
      { id: 'thimble', name: "Grandma's Thimble", desc: 'Mimsy used it as a teacup for forty years.' },
      { id: 'boot', name: 'The Old Boot', desc: 'Surprisingly comfy. Smells of pond. A family of snails lives in the toe.' },
    ],
    ui: { a: '#6aa84f', b: '#e8c465', ink: '#3f5a2a' },
    style: {
      shell: { kind: 'timber', side: '#7b5236', lt: '#9b6a47', dk: '#5b3a26' },
      roof: 'cottage', sky: 'open', ground: 'meadow', trees: 'oak',
      wall: 'paper', floor: 'planks', window: 'arch', lamp: 'pendant', desk: 'wood',
      shelf: { kind: 'wood', wood: '#8a5a3a', dk: '#6b4128' },
      beam: ['#5b3a26', '#704a31', '#4a2f1f'], plaque: ['#6d4630', '#e3c26a', '#fff3dc'],
      fixture: 'lantern', particles: 'dust', dim: 0, ivy: true,
    },
  },
  {
    id: 'cove', name: 'Lighthouse Cove', library: 'The Lighthouse Lending Library', mult: 1.5,
    tagline: 'A salty seaside library inside a working lighthouse',
    blurb: 'Whitewashed planks, porthole windows and a beacon on the roof. Messages in bottles wash up on the beach with every tide.',
    host: 'barnacle', shop: { name: 'The Salty Shelf', keeper: 'barnacle', hello: ['Ahoy! Everything is water-damaged, which is a style now.', 'No refunds. The sea took the receipts.', 'Mind the crab. He works here. Unpaid.'] },
    mechanic: { id: 'bottles', name: 'Messages in bottles', icon: 'bottle', desc: 'Bottles wash up on the shore. Tap them for letters, coins and the odd treasure.' },
    perk: { id: 'seaBreeze', name: 'Sea Breeze', icon: 'shell', desc: 'Mice earn 80% (not 60%) while you are away, everywhere.' },
    souvenirs: [
      { id: 'shipbottle', name: 'Ship in a Bottle', desc: 'Nobody knows how it got in. The ship does not know either.' },
      { id: 'seashell', name: 'Lucky Seashell', desc: 'Hold it to your ear to hear the sea. Or Captain Barnacle snoring.' },
      { id: 'compass', name: "Captain's Compass", desc: 'Always points to the nearest cheese. Useless at sea, perfect at home.' },
    ],
    ui: { a: '#3f7fbf', b: '#9fd8e0', ink: '#1f3f5f' },
    style: {
      shell: { kind: 'shingle', side: '#e9eef2', lt: '#ffffff', dk: '#9fb3c2', stripe: '#d9534f' },
      roof: 'lighthouse', sky: 'open', ground: 'beach', trees: 'palm',
      wall: 'shiplap', floor: 'deck', window: 'porthole', lamp: 'lantern', desk: 'hull',
      shelf: { kind: 'driftwood', wood: '#9c8a74', dk: '#6f6150' },
      beam: ['#3f5f7f', '#5a7a99', '#2f4a63'], plaque: ['#2f4a63', '#e3c26a', '#f4fbff'],
      fixture: 'shiplamp', particles: 'none', dim: 0, ivy: false, rope: true,
    },
  },
  {
    id: 'caverns', name: 'Glimmerdeep Caverns', library: 'The Glimmerdeep Undercroft', mult: 2.5,
    tagline: 'A secret library carved deep underground',
    blurb: 'Rock walls, glowing mushrooms, crystal windows and an underground lake. Nobody knows who built it. The shelves were already full.',
    host: 'delvina', shop: { name: 'Glimmer Goods', keeper: 'delvina', hello: ['Welcome, dear. I cannot see you, but you smell like a customer.', 'Everything glows. Some of it on purpose.', 'This lamp? Found it. The previous owner will not be needing it. He was a stalactite.'] },
    mechanic: { id: 'glowcaps', name: 'Glowcap harvest', icon: 'mushroom', desc: 'Glowing mushrooms sprout on the shelves. Tap them before they fade.' },
    perk: { id: 'glowJar', name: 'Glowcap Jar', icon: 'jar', desc: 'The coin jar holds 50% more, in every location.' },
    souvenirs: [
      { id: 'crystal', name: 'Singing Crystal', desc: 'Hums when someone opens a good book. Silent during poetry. Hmm.' },
      { id: 'fossil', name: 'Fossil Bookworm', desc: 'Ancient, enormous and, crucially, not hungry any more.' },
      { id: 'nowhere', name: 'Map to Nowhere', desc: 'Delvina drew it. She says it is very accurate.' },
    ],
    ui: { a: '#5b4a9e', b: '#6fe0d0', ink: '#2a2150' },
    style: {
      shell: { kind: 'rock', side: '#4a4458', lt: '#625b73', dk: '#2f2a3a' },
      roof: 'cave', sky: 'cave', ground: 'cavern', trees: 'mushroom',
      wall: 'rock', floor: 'flagstone', window: 'crystal', lamp: 'glowcap', desk: 'slab',
      shelf: { kind: 'niche', wood: '#6b6378', dk: '#453f52' },
      beam: ['#3a3446', '#4f4860', '#29243a'], plaque: ['#2e2840', '#7de8d8', '#e8fffb'],
      fixture: 'crystal', particles: 'spores', dim: 0.28, ivy: false, glow: '#7de8d8',
    },
  },
  {
    id: 'clockwork', name: 'Gearhaven', library: 'The Clockwork Athenaeum', mult: 4,
    tagline: 'A humming brass library in a city of gears',
    blurb: 'Riveted brass walls, turning gears, pneumatic book tubes and Edison bulbs. The city never sleeps; it just ticks quietly.',
    host: 'ada', shop: { name: "Sprocket's Emporium", keeper: 'ada', hello: ['Every item comes with a tiny instruction manual. For the manual.', 'Please do not wind the merchandise.', 'Yes, it ticks. No, it will not explode. Probably.'] },
    mechanic: { id: 'capsules', name: 'Book tube post', icon: 'capsule', desc: 'Capsules whoosh up the pneumatic tube. Tap one to snatch the delivery.' },
    perk: { id: 'swiftScaffolds', name: 'Swift Scaffolds', icon: 'gear', desc: 'Every new floor is built twice as fast, everywhere.' },
    souvenirs: [
      { id: 'page', name: 'Self-Turning Page', desc: 'Turns itself when you look away. Very bad for suspense.' },
      { id: 'owl', name: 'Tiny Brass Owl', desc: 'Hoots on the hour. And on the half hour. And whenever it wants.' },
      { id: 'bookmark', name: 'Perpetual Bookmark', desc: 'Always knows where you stopped. Judges you for it.' },
    ],
    ui: { a: '#b07a2e', b: '#5fa39a', ink: '#4a2f12' },
    style: {
      shell: { kind: 'brass', side: '#9c6a34', lt: '#c99a4d', dk: '#6b4520' },
      roof: 'dome', sky: 'open', ground: 'street', trees: 'city',
      wall: 'panel', floor: 'checker', window: 'gear', lamp: 'bulb', desk: 'brass',
      shelf: { kind: 'metal', wood: '#5a4a3e', dk: '#3a3029' },
      beam: ['#4a3a30', '#8a6a3a', '#33281f'], plaque: ['#3a3029', '#e8b85a', '#fff1d0'],
      fixture: 'gaslamp', particles: 'steam', dim: 0.04, ivy: false, pipes: true,
    },
  },
  {
    id: 'castle', name: 'Moonlit Castle', library: 'The Moonlit Stacks', mult: 7,
    tagline: 'An ancient royal archive behind castle walls',
    blurb: 'Stone halls, tapestries, stained-glass windows and candle chandeliers. A small dragon naps on the battlements. He is mostly harmless.',
    host: 'queen', shop: { name: 'The Royal Bazaar', keeper: 'crumbsworth', hello: ['By appointment to Her Majesty. She appointed me. Yesterday.', 'Every item is fit for a queen. Some are fit for a dragon. Ask first.', 'Haggling is treason. Lightly.'] },
    mechanic: { id: 'bookwyrm', name: 'Sir Reginald the bookwyrm', icon: 'dragon', desc: 'A tiny dragon naps on the roof. When he snores a book loose, tap him!' },
    perk: { id: 'royalFavour', name: 'Royal Favour', icon: 'crown', desc: 'Special guests visit more often and royal decrees last 50% longer.' },
    souvenirs: [
      { id: 'scale', name: 'Dragon-Scale Bookmark', desc: 'Sir Reginald shed it. He wants it noted that he did not cry.' },
      { id: 'card', name: "The Queen's Library Card", desc: 'Four hundred years overdue. Nobody dared to ask.' },
      { id: 'helmet', name: "Knight's Reading Helmet", desc: 'Has a little flip-up visor for turning pages.' },
    ],
    ui: { a: '#6d5fa3', b: '#e0b84f', ink: '#2f2550' },
    style: {
      shell: { kind: 'stone', side: '#8e8a9c', lt: '#aba7b8', dk: '#625e70' },
      roof: 'castle', sky: 'open', ground: 'courtyard', trees: 'pine',
      wall: 'stone', floor: 'carpet', window: 'lancet', lamp: 'chandelier', desk: 'carved',
      shelf: { kind: 'carved', wood: '#5a3526', dk: '#3e2219', gold: '#e0b84f' },
      beam: ['#4f4a5c', '#6d6880', '#39354a'], plaque: ['#4a1f2e', '#e0b84f', '#fff3dc'],
      fixture: 'torch', particles: 'embers', dim: 0.08, ivy: true,
    },
  },
  {
    id: 'sky', name: 'Nimbus Isle', library: 'The Nimbus Sky Library', mult: 12,
    tagline: 'A floating library high above the clouds',
    blurb: 'White marble, gold stars, floating light-orbs and a view of absolutely everything. Mind the edge. Seriously. There is no fence.',
    host: 'aurora', shop: { name: 'Cumulus Curios', keeper: 'aurora', hello: ['Everything is lighter up here. Including the prices. Not really.', 'Returns accepted if you can catch them.', 'Try the cloud beanbag. Do not try the cloud beanbag near the edge.'] },
    mechanic: { id: 'whale', name: 'The cloud whale', icon: 'whale', desc: 'A gentle whale drifts past now and then. Tap its spout for a shower of gifts.' },
    perk: { id: 'tailwind', name: 'Tailwind', icon: 'feather', desc: 'Every future move earns 25% more Golden Quills.' },
    souvenirs: [
      { id: 'cloud', name: 'Bottled Cloud', desc: 'Slightly damp. Occasionally rains on your desk.' },
      { id: 'whaleshell', name: 'Whale-Song Shell', desc: 'Plays whale songs. The whale is singing about snacks.' },
      { id: 'feather', name: 'Compass-Rose Feather', desc: 'From a bird who knew exactly where it was going.' },
    ],
    ui: { a: '#6fa8dc', b: '#f2d27a', ink: '#27496d' },
    style: {
      shell: { kind: 'marble', side: '#f1ede4', lt: '#ffffff', dk: '#c9c0ad', gold: '#d9b24c' },
      roof: 'cloud', sky: 'high', ground: 'island', trees: 'cloud',
      wall: 'marble', floor: 'marble', window: 'round', lamp: 'orb', desk: 'cloud',
      shelf: { kind: 'cloud', wood: '#efe9dc', dk: '#cfc4ae', gold: '#d9b24c' },
      beam: ['#d9d1bf', '#f2ecdf', '#b9ae97'], plaque: ['#27496d', '#f2d27a', '#ffffff'],
      fixture: 'orb', particles: 'feathers', dim: 0, ivy: false,
    },
  },
];

const ROMAN = ['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// Location i (with repeat cycles: after the last one, the map starts over with ×10 bonuses).
export function locationInfo(i) {
  const n = LOCATIONS.length;
  const b = LOCATIONS[((i % n) + n) % n];
  const cycle = Math.floor(i / n);
  const suffix = cycle ? ` ${ROMAN[cycle] || cycle + 1}` : '';
  return { ...b, index: i, cycle, name: b.name + suffix, library: b.library, mult: b.mult * Math.pow(10, cycle) };
}

export const SOUVENIRS = LOCATIONS.flatMap((l) => l.souvenirs.map((s) => ({ ...s, loc: l.id })));
export const SOUVENIR_BONUS = 0.05; // +5% income each, forever
export const TROPHY_BONUS = 0.15; // +15% income per completed location (all 10 floors built)
