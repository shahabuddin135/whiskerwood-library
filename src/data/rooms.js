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
// Every book is a parody: [title, author, blurb, review].
const BOOK_DATA = [
  [
    ['Goldilocks & the Three Cheeses', 'The Brothers Brie-mm', 'A home-invasion thriller told entirely from the porridge’s point of view.', '★★☆☆☆ “Too long. Too short. Never just right.” — Papa Bear'],
    ['The Mouse Who Wished on a Crumb', 'Hans Christian Crumbersen', 'She wished for a bigger crumb. She got a bigger crumb. The end. There is no twist. We checked twice.', '★★★★★ “Relatable.” — every mouse'],
    ['Sleeping Brie-uty', 'Charles Perr-owl', 'A princess sleeps for a hundred years. Honestly? Goals.', '★★★★☆ “I fell asleep reading it. Very immersive.”'],
    ['Puss Without Boots', 'Baroness C. (ghostwritten)', 'A cat with no boots and no plan. Written by a cat. Reviewed by no mice.', '★☆☆☆☆ “Suspiciously pro-cat.” — The Meadow Gazette'],
    ['The Moon Is Made of Cheese', 'Anonymous (definitely not Pip)', 'A shocking exposé with forty diagrams. The diagrams are all of cheese.', '★★★★★ “Finally, the truth.” — anyone who has ever looked up'],
  ],
  [
    ['Where the Wild Mice Are', 'Maurice Squeakdak', 'Max is sent to bed without supper, sails away and becomes king of the wild mice. Still no supper.', '★★★★☆ “Let the wild rumpus start! (Quietly. This is a library.)”'],
    ['Goodnight, Little Crumb', 'Margaret Wise Brownie', 'Goodnight crumb. Goodnight crust. Goodnight the cat that we don’t trust.', '★★★★★ “Works on toddlers, grandmas and one very tired librarian.”'],
    ['The Very Hungry Mouse', 'Eric Cheddle', 'On Monday he ate one wedge of brie. By Sunday he was a very big mouse. A cautionary tale.', '★★★★☆ “Also a cookbook, if you squint.”'],
    ['Oh, the Holes You’ll Go!', 'Dr. Squeuss', 'The classic graduation gift for young mice leaving the hole. Rhymes 60% guaranteed.', '★★★★★ “Gave it to my nephew. He moved out. It works.”'],
    ['The Giving Cheese', 'Shel Silverwhisk', 'A cheese gives and gives until it is only a rind. Do not read this before lunch.', '★★★★★ “I cried. Then I had a snack. Then I cried again.”'],
  ],
  [
    ['The Joy of Nibbling', 'Irma Rombauer-Rat', 'Chapter 1: Nibble. Chapter 2: Nibble again. Chapter 3: Advanced nibbling (for professionals).', '★★★★☆ “Life-changing. I nibble differently now.”'],
    ['Mastering French Fromage', 'Julia Squeaks', 'Volume one of eleven. Volume eleven is just the word “butter”, beautifully typeset.', '★★★★★ “Bon appétit! I gained four ounces.”'],
    ['The Gouda Life', 'Ina Gartenmouse', '“How easy is that?” Very hard, it turns out. You need a copper pot and a barn.', '★★★☆☆ “I do not own a barn. Four stars for the pictures.”'],
    ['Salt, Crumb, Cheddar, Heat', 'Samin Nosratmouse', 'The four elements of cooking. A fifth element, panic, is covered in the appendix.', '★★★★★ “I now understand fire. My kitchen does not.”'],
    ['Grand-Mama Mimsy’s Secret Recipe', 'Grandma Mimsy', 'The secret ingredient is love. The second secret ingredient is an entire wheel of brie.', '★★★★★ “Ate the book. No regrets.”'],
  ],
  [
    ['Around the Pantry in 80 Days', 'Jules Vermin', 'A gentlemouse bets he can circle the pantry in 80 days. On day three he finds the biscuit tin.', '★★★☆☆ “Only visits the pantry. Title is accurate, sadly.”'],
    ['20,000 Squeaks Under the Sea', 'Jules Vermin', 'Captain Nibbo’s submarine is made of cheese. This becomes a problem at depth.', '★★★★☆ “Soggy but thrilling.”'],
    ['Treasure Isle of Swiss', 'Robert Louis Stevenmouse', 'X marks the spot. Holes mark the cheese. Parrot sold separately.', '★★★★★ “Arr. Also: squeak.”'],
    ['The Wind in the Whiskers', 'Kenneth Grahame-Cracker', 'Mole, Rat and Toad go boating. Toad insists on steering. Everyone regrets it.', '★★★★☆ “Toad should not have a licence.”'],
    ['Journey to the Center of the Cheese Wheel', 'Jules Vermin', 'It is cheese all the way down. The sequel is also cheese. So is the prequel.', '★★★★★ “Delicious worldbuilding.”'],
  ],
  [
    ['The Hound of the Basket-villes', 'Sir Arthur Conan Mouse', 'A spectral hound haunts the moors. (It is a large cat in a bedsheet.)', '★★★★☆ “Guessed it on page 2. Still spooky.”'],
    ['Murder on the Cheese Express', 'Agatha Crustie', 'Twelve suspects, one sleeper carriage, one very smug detective moustache.', '★★★★★ “Did not see it coming. Some of us did, Squeaky.”'],
    ['The Case of the Missing Crumb', 'Sherlock Holes-in-the-Wall', 'A crumb vanishes. The prime suspect is the detective, who has crumbs on his whiskers.', '★★★☆☆ “Elementary. Also delicious.”'],
    ['And Then There Were Mice', 'Agatha Crustie', 'Ten mice on an island. One by one they leave early because the tea is terrible.', '★★★★★ “Chilling. The tea really was terrible.”'],
    ['The Cat Who Never Came Back', 'A Grateful Detective', 'The case of the century. Case closed. Nobody is sad. Nobody at all.', '★★★★★ “A happy ending for once.” — every mouse ever'],
  ],
  [
    ['Leaves of Grass Seed', 'Walt Whiskman', 'I contain multitudes. Mostly seeds.', '★★★★☆ “Gave me hay fever. Beautifully.”'],
    ['The Road Not Nibbled', 'Robert Frostbite', 'Two paths diverged in a pantry, and I — I took both. I am a mouse.', '★★★★★ “And that has made all the difference.”'],
    ['Ode to a Field Mouse', 'John Squeats', 'A very long poem about a mouse. The mouse was not consulted and would like a word.', '★★★☆☆ “Flattering, but my nose is not a ‘rosy bud’.” — the mouse'],
    ['Do Not Go Gentle Into That Mousetrap', 'Dylan Thomouse', 'Rage, rage against the snapping of the spring.', '★★★★★ “Read it at every family gathering. Now banned from gatherings.”'],
    ['Sonnets from the Cellar', 'Elizabeth Barrett Brownmouse', 'How do I love cheese? Let me count the ways. (There are forty-seven.)', '★★★★★ “She missed number forty-eight: toasted.”'],
  ],
  [
    ['A Brief History of Cheese Time', 'Stephen Squawking', 'The universe, explained. Not brief.', '★★★★☆ “My brain is now a black hole. In a good way.”'],
    ['Cosmos & Crumbs', 'Carl Sagouda', 'Billions and billions of crumbs, and every one of them is special.', '★★★★★ “We are all made of star-cheese.”'],
    ['On the Origin of Squeaks', 'Charles Darmouse', 'A groundbreaking theory: survival of the snackiest.', '★★★★☆ “Controversial with the cats.”'],
    ['Principia Cheesematica', 'Sir Isaac Mewton', 'What goes up must come down. Especially cheese left on high shelves.', '★★★★★ “Got bonked by the cover. Understood gravity.”'],
    ['The Map of the Milky Whey', 'Galileo Galimouse', 'Includes a fold-out star chart that no mouse has ever folded back in.', '★★★★★ “And yet it moves. The chart, I mean. It will not stay folded.”'],
  ],
  [
    ['The Illuminated Cheddar Codex', 'Brother Parchment', 'Every letter hand-painted over forty years. Contains exactly one typo, on the first page.', '★★★★☆ “Breathtaking. Also: ‘Chedar’? Really?”'],
    ['Book of Whiskered Hours', 'The Monks of Crumb Abbey', 'A little prayer for every hour of the day, including 3 a.m. snack hour.', '★★★★★ “Snack hour is my favourite hour.”'],
    ['The Lost Scroll of Parmesan', 'Unknown (Ancient)', 'Found in 1432. Lost in 1433. Found again under the sofa last Tuesday.', '★★★★☆ “Smells like sofa. Priceless.”'],
    ['The Dragon-Rat Chronicle', 'Old Sage Bramble', 'Here be dragons. Also rats. The dragons are much nicer.', '★★★★★ “The rats wrote a rebuttal. It is mostly swearing.”'],
    ['The First Book Ever Nibbled', 'Nobody Knows', 'It has bite marks. Historians argue about whose. It is always Gerald.', '★★★★★ “A bite of history.”'],
  ],
  [
    ['Symphony No. 5 in Brie Minor', 'Ludwig van Squeakhoven', 'Da-da-da-DUM. Da-da-da-DUM. That is most of it, honestly.', '★★★★★ “Da-da-da-DUM.”'],
    ['Nocturnes for Tiny Paws', 'Frédéric Chopmouse', 'Soft night music for paws too small to reach the pedals.', '★★★★☆ “Played it at 2 a.m. Neighbours applauded. Or banged on the wall.”'],
    ['The Squeakers’ Songbook', 'Various Squeakers', 'Two hundred campfire songs, all about cheese, all in the same key.', '★★★☆☆ “Song 147 is just screaming. Still slaps.”'],
    ['The Magic Flute (Mouse Edition)', 'W. A. Mousezart', 'An opera about a magic flute, a bird-catcher and far too many trials.', '★★★★☆ “The Queen of the Night hit a note only bats can hear.”'],
    ['Moonlight Sonata for Whiskers', 'Ludwig van Squeakhoven', 'The loveliest melody ever written, best played by moonlight with the window open.', '★★★★★ “Made the cat outside cry. Result.”'],
  ],
  [
    ['King Arthur’s Round Cheese', 'Sir Thomas Malorymouse', 'The knights sat around a round table. The table was a cheese. It did not last the week.', '★★★★☆ “Chivalry is not dead. The table is.”'],
    ['The Twelve Labours of Hercumouse', 'Anonymous Greek Mouse', 'Twelve impossible tasks. Task seven is doing the washing up.', '★★★★★ “Task seven broke me too.”'],
    ['Beowhisker', 'Unknown Bard', 'Hwæt! (That is Old Mouse for “Shh!”)', '★★★★☆ “The monster was a draught under the door all along.”'],
    ['The Odyssey of Odymouse', 'Homouse', 'Ten years to get home. He took the scenic route and refused to ask for directions.', '★★★★★ “Just ask for directions, Ody!”'],
    ['The Golden Crumb of Destiny', 'Grandma Mimsy', 'The legend of this very library. Yes, you are in it. Yes, you look lovely.', '★★★★★ “Spoiler: it’s you.”'],
  ],
];
export const BOOKS = [];
BOOK_DATA.forEach((list, room) => list.forEach(([title, author, blurb, review], k) => {
  BOOKS.push({ id: `${ROOMS[room].id}-${k}`, room, title, author, blurb, review, rarity: RARS[k], color: ROOMS[room].books[k % ROOMS[room].books.length] });
}));
export const BOOK_BONUS = 0.1; // +10% floor income per owned book
export const SET_BONUS = 2; // x2 floor income when all 5 books of a floor are collected
