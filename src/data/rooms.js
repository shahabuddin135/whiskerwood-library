// Library floors ("rooms"). Index 0 is the ground floor; new floors stack upward.
// Economy numbers are tuned with `npm run simulate` (scripts/simulate.mjs).

export const MILESTONES = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];

export const LIMITS = { seats: 6, shelves: 4, staff: 20, decor: 5, level: 1000 };

// Growth rates for each upgrade track.
export const GROWTH = { level: 1.15, seat: 20, shelf: 50, staff: 2, decor: 10 };

// Per-floor economy curve. Floor i: base income = BR^i, level cost = L0 * LR^i.
export const ECON = { BR: 9, L0: 5, LR: 13 };
const BUILD_SECONDS = [0, 5, 15, 30, 60, 120, 240, 480, 900, 1800];
const UNLOCK = [0, 40e3, 9e6, 1.75e8, 3e9, 3.5e10, 4e11, 4.5e12, 5.5e13, 7e14];

export const DECOR = [
  { key: 'rug', name: 'Cozy Rug', icon: '🧶', bonus: 0.2 },
  { key: 'lamps', name: 'Reading Lamps', icon: '💡', bonus: 0.2 },
  { key: 'plant', name: 'Potted Fern', icon: '🪴', bonus: 0.2 },
  { key: 'art', name: 'Framed Painting', icon: '🖼️', bonus: 0.2 },
  { key: 'center', name: 'Centerpiece', icon: '✨', bonus: 0.4 },
];

// Each floor: look & feel + economy.
// base: income/sec at Lv1 with 1 seat. lvl/seat/shelf/staff/decor: first-purchase costs.
export const ROOMS = [
  {
    id: 'nook', name: 'The Cozy Nook', genre: 'Fairy Tales', seat: 'armchair', center: 'clock', centerName: 'Grandfather Clock',
    pal: { wall: '#f3dfb8', wall2: '#ead0a0', pattern: 'stripes', trim: '#9b6a43', floor: '#b98457', floor2: '#a3714a', accent: '#d9774b', seatCol: '#c9583f' },
    books: ['#c0504d', '#e9b949', '#6a9f58', '#4f7cac', '#9b6fb0', '#e07b39'],
  },
  {
    id: 'story', name: 'Storybook Corner', genre: 'Picture Books', seat: 'beanbag', center: 'horse', centerName: 'Rocking Horse',
    pal: { wall: '#f9d9de', wall2: '#f2c2cb', pattern: 'dots', trim: '#b8707f', floor: '#e6c49a', floor2: '#d4ae82', accent: '#7cc4b0', seatCol: '#f2a65a' },
    books: ['#f28b82', '#fbbc04', '#ccff90', '#a7ffeb', '#aecbfa', '#d7aefb'],
  },
  {
    id: 'cafe', name: 'Tea & Crumbs Café', genre: 'Cookbooks', seat: 'cafe', center: 'urn', centerName: 'Copper Tea Urn',
    pal: { wall: '#dfe8d0', wall2: '#cddbb8', pattern: 'checks', trim: '#6f7d4f', floor: '#a0674a', floor2: '#8c573d', accent: '#c96f4a', seatCol: '#7b5a3c' },
    books: ['#d9774b', '#f0c05a', '#8fb069', '#e8e1c9', '#b5523b', '#6b8f71'],
  },
  {
    id: 'maps', name: 'Adventure Map Room', genre: 'Adventure', seat: 'trunk', center: 'globe', centerName: 'Great Globe',
    pal: { wall: '#2f4a6b', wall2: '#27405d', pattern: 'diamond', trim: '#c9a557', floor: '#8a5a3b', floor2: '#744a30', accent: '#e3b04b', seatCol: '#8e4a35' },
    books: ['#e3b04b', '#b33f40', '#3f7f6f', '#d9d2b6', '#6d4c8d', '#c96b2f'],
  },
  {
    id: 'mystery', name: 'Mystery Attic', genre: 'Mysteries', seat: 'wingback', center: 'candles', centerName: 'Candelabra',
    pal: { wall: '#4a3a52', wall2: '#40314a', pattern: 'damask', trim: '#a88b5a', floor: '#5b4033', floor2: '#4b3429', accent: '#b8a3d1', seatCol: '#6e2f3a' },
    books: ['#6e2f3a', '#2e4057', '#8c7b5a', '#3b5249', '#a34a28', '#5d4e75'],
  },
  {
    id: 'poetry', name: 'Poetry Greenhouse', genre: 'Poetry', seat: 'bench', center: 'fountain', centerName: 'Little Fountain',
    pal: { wall: '#d6ecd9', wall2: '#bfe0c4', pattern: 'lattice', trim: '#5e8c61', floor: '#b7a07a', floor2: '#a18a66', accent: '#f4a3b5', seatCol: '#8a6f4d' },
    books: ['#f4a3b5', '#9ccc65', '#ffe082', '#80cbc4', '#ce93d8', '#ffab91'],
  },
  {
    id: 'stars', name: 'Stargazer Observatory', genre: 'Science & Stars', seat: 'stool', center: 'telescope', centerName: 'Brass Telescope',
    pal: { wall: '#1f2a4d', wall2: '#1a2442', pattern: 'stars', trim: '#b7c3e0', floor: '#4a3f5c', floor2: '#3d344d', accent: '#ffd66b', seatCol: '#556b9e' },
    books: ['#ffd66b', '#6fa8dc', '#b4a7d6', '#93c47d', '#e06666', '#76a5af'],
  },
  {
    id: 'archive', name: 'Royal Archive', genre: 'Rare Tomes', seat: 'throne', center: 'chest', centerName: 'Treasure Chest',
    pal: { wall: '#6b1f2a', wall2: '#5c1a24', pattern: 'fleur', trim: '#e0b84f', floor: '#3e2a24', floor2: '#33221d', accent: '#e0b84f', seatCol: '#8e1f2f' },
    books: ['#e0b84f', '#7a1f2b', '#2d4a3e', '#c8b89a', '#3a3563', '#a0522d'],
  },
  {
    id: 'music', name: 'Moonlit Music Hall', genre: 'Music Scores', seat: 'piano', center: 'harp', centerName: 'Golden Harp',
    pal: { wall: '#cfc6ea', wall2: '#bdb2e0', pattern: 'notes', trim: '#6d5fa3', floor: '#7d6a93', floor2: '#6b5a80', accent: '#f2d27a', seatCol: '#4b3f78' },
    books: ['#6d5fa3', '#f2d27a', '#e8a0bf', '#9fd8cb', '#f5f0e1', '#4b3f78'],
  },
  {
    id: 'atrium', name: 'The Grand Atrium', genre: 'Legends', seat: 'royal', center: 'statue', centerName: 'Golden Mouse Statue',
    pal: { wall: '#f7f1e3', wall2: '#ece2c9', pattern: 'columns', trim: '#c9a227', floor: '#d8cfc0', floor2: '#c7bca9', accent: '#c9a227', seatCol: '#2f5d8a' },
    books: ['#c9a227', '#2f5d8a', '#8e3b46', '#3d7a5a', '#f4efe1', '#5b3f8c'],
  },
];

ROOMS.forEach((r, i) => {
  r.unlock = UNLOCK[i];
  r.build = BUILD_SECONDS[i];
  r.base = Math.pow(ECON.BR, i);
  r.lvl = ECON.L0 * Math.pow(ECON.LR, i);
  r.seatC = r.lvl * 10;
  r.shelfC = r.lvl * 60;
  r.staffC = r.lvl * 20;
  r.decorC = r.lvl * 100;
});

// Book collection album. 5 books per floor: C, C, R, E, L.
export const RARITY = {
  C: { name: 'Common', color: '#8fa2b4', dupCheese: 1 },
  R: { name: 'Rare', color: '#4a90d9', dupCheese: 3 },
  E: { name: 'Epic', color: '#a45bd6', dupCheese: 8 },
  L: { name: 'Legendary', color: '#f0a92e', dupCheese: 20 },
};
const RARS = ['C', 'C', 'R', 'E', 'L'];
const TITLES = [
  ['Goldilocks & the Three Cheeses', 'The Mouse Who Wished on a Crumb', 'Sleeping Brie-uty', 'Puss Without Boots', 'The Moon Is Made of Cheese'],
  ['Where the Wild Mice Are', 'Goodnight, Little Crumb', 'The Very Hungry Mouse', 'Oh, the Holes You’ll Go!', 'The Giving Cheese'],
  ['The Joy of Nibbling', 'Mastering French Fromage', 'The Gouda Life', 'Salt, Crumb, Cheddar, Heat', 'Grand-Mama Mimsy’s Secret Recipe'],
  ['Around the Pantry in 80 Days', '20,000 Squeaks Under the Sea', 'Treasure Isle of Swiss', 'The Wind in the Whiskers', 'Journey to the Center of the Cheese Wheel'],
  ['The Hound of the Basket-villes', 'Murder on the Cheese Express', 'The Case of the Missing Crumb', 'And Then There Were Mice', 'The Cat Who Never Came Back'],
  ['Leaves of Grass Seed', 'The Road Not Nibbled', 'Ode to a Field Mouse', 'Do Not Go Gentle Into That Mousetrap', 'Sonnets from the Cellar'],
  ['A Brief History of Cheese Time', 'Cosmos & Crumbs', 'On the Origin of Squeaks', 'Principia Cheesematica', 'The Map of the Milky Whey'],
  ['The Illuminated Cheddar Codex', 'Book of Whiskered Hours', 'The Lost Scroll of Parmesan', 'The Dragon-Rat Chronicle', 'The First Book Ever Nibbled'],
  ['Symphony No. 5 in Brie Minor', 'Nocturnes for Tiny Paws', 'The Squeakers’ Songbook', 'The Magic Flute (Mouse Edition)', 'Moonlight Sonata for Whiskers'],
  ['King Arthur’s Round Cheese', 'The Twelve Labours of Hercumouse', 'Beowhisker', 'The Odyssey of Odymouse', 'The Golden Crumb of Destiny'],
];
export const BOOKS = [];
TITLES.forEach((list, room) => list.forEach((title, k) => {
  BOOKS.push({ id: `${ROOMS[room].id}-${k}`, room, title, rarity: RARS[k], color: ROOMS[room].books[k % ROOMS[room].books.length] });
}));
export const BOOK_BONUS = 0.1; // +10% floor income per owned book
export const SET_BONUS = 2; // x2 floor income when all 5 books of a floor are collected
