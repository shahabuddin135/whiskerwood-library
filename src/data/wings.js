// Wings: buildings on the plots beside the library tower. Each new site has room for more of them.
// A wing's levels raise the whole library's income, and every wing has one thing of its own to do.
// Plots are in world units (the tower spans x 36..404, ground at y = 0).
export const PLOTS = [
  { x0: 450, x1: 650 }, // right of the tower
  { x0: -210, x1: -10 }, // left of the tower
  { x0: 672, x1: 872 }, // far right
  { x0: -432, x1: -232 }, // far left
];
export const WING_W = 200;
export const STOREY_H = 130; // one storey of a wing
export const WING_MAX = 100;
export const WING_PER_LVL = 0.02; // +2% library income per wing level
export const WING_MILESTONES = [10, 25, 50, 75, 100]; // each adds another +10%
export const WING_GROWTH = 1.35;
export const WING_DECOR_BONUS = 0.05; // each piece of wing furniture: +5% library income
const DECOR_COST = [25, 250, 2500, 25000, 250000]; // × the wing's level cost (ground floor)
// Upper storeys open at these levels and each has its own room and five pieces of furniture.
export const STOREY_LVL = [1, 20, 50];
const UP_COST = [[2e3, 2e4, 2e5, 2e6, 2e7], [2e6, 2e7, 2e8, 2e9, 2e10]];
const fx = (icon, name, desc) => ({ icon, name, desc });

export const WINGS = [
  {
    id: 'cafe', plot: 0, name: 'The Crumb Café', short: 'Café', icon: '☕',
    blurb: 'A real café next door: pots of tea, warm scones and a window seat for every reader.',
    unlock: 6e6, build: 3 * 60, lvlC: 4e5,
    action: { key: 'bake', icon: '🧁', label: 'Serve the scones', every: 180, sec: 120, text: 'A fresh tray of scones is out of the oven!' },
    pal: { wall: '#f6e3cf', wall2: '#efd3b8', trim: '#b5523b', floor: '#c98b5a', roof: '#c25b42', roof2: '#a64a35', awning: ['#f28b82', '#fff7ec'], sign: '#7a2f3a' },
    decor: [
      { key: 'flowers', icon: '🌸', name: 'Window Flower Boxes', desc: 'Geraniums on every sill. The bees queue politely.' },
      { key: 'espresso', icon: '☕', name: 'Brass Espresso Machine', desc: 'Hisses like a cat, smells like heaven.' },
      { key: 'cake', icon: '🎂', name: 'Three-Tier Cake Stand', desc: 'Lemon, cheese, and a mystery layer nobody asks about.' },
      { key: 'terrace', icon: '⛱️', name: 'Garden Terrace', desc: 'A sunny table outside, under a striped parasol.' },
      { key: 'lights', icon: '💡', name: 'Fairy-Light Garland', desc: 'Glows at night. Makes every scone look romantic.' },
    ],
    upper: [
      { name: 'Upstairs Tea Room', icon: '🫖', fixtures: [fx('🕯️', 'Crystal Chandelier', 'Forty tiny candles. Somebody has to light them all.'), fx('🧸', 'Plush Cushions', 'For sinking into with a good book and a better scone.'), fx('🍰', 'Cake Trolley', 'Wheeled from table to table. Resistance is futile.'), fx('🖼️', 'Portrait of Chef Gustavo', 'He insisted. He also insisted on the gold frame.'), fx('🌴', 'Potted Palms', 'Very elegant. Slightly too tall for the ceiling.')] },
      { name: 'Pastry Kitchen', icon: '🥐', fixtures: [fx('🥖', 'Bread Racks', 'Baguettes, bloomers and one very round cob.'), fx('🧁', 'Cupcake Tower', 'Structurally unsound. Absolutely delicious.'), fx('🍯', 'Jam Pantry', 'Strawberry, apricot and “mystery berry”.'), fx('🌿', 'Herb Window', 'Basil, thyme and a mint plant with ambitions.'), fx('🔔', 'Order Dumbwaiter', 'Sends scones downstairs with a cheerful ding.')] },
    ],
    lines: ['One cheese scone, please!', 'Tea first, then chapter three.', 'Is it cake o’clock yet?', 'This crumpet is a masterpiece.', 'Extra honey, hold the cat.',
      'I’ll have what the Queen had.', 'Is the jam homemade? It tastes of summer.', 'Crumbs on my book again. Worth it.', 'This scone has a plot twist: raisins.',
      'Do you do cheese-flavoured tea?', 'I came in for one scone. I have had six.', 'Best table in the house, by the window.', 'Chef Gustavo waved at me! Swoon.'],
    talk: [['Is that a scone or a cloud?', 'Both. It’s a scloud.'], ['More tea?', 'Always more tea.'], ['Did you finish the mystery?', 'The butler did it. With a crumpet.'], ['Split the last scone?', 'Absolutely not.']],
  },
  {
    id: 'hall', plot: 1, name: 'Whiskerwood Community Hall', short: 'Community Hall', icon: '🎪',
    blurb: 'Book clubs, knitting circles, choir night and the famous cheese-tasting evening.',
    unlock: 2e10, build: 20 * 60, lvlC: 1.5e9,
    action: { key: 'club', icon: '🎶', label: 'Host tonight’s club', every: 900, run: 300, text: 'The hall is ready for tonight’s club!' },
    pal: { wall: '#e8eef6', wall2: '#d4e0ee', trim: '#4f7cac', floor: '#b98457', roof: '#4f7cac', roof2: '#3f6a98', awning: ['#9ec5f0', '#fff7ec'], sign: '#2f4f7a' },
    decor: [
      { key: 'balloons', icon: '🎈', name: 'Balloon Garlands', desc: 'Every night is a party if you believe hard enough.' },
      { key: 'piano', icon: '🎹', name: 'Grand Piano', desc: 'Slightly out of tune. Nobody minds.' },
      { key: 'spots', icon: '🔦', name: 'Stage Spotlights', desc: 'Now every performer is a star. Even the shy ones.' },
      { key: 'disco', icon: '🪩', name: 'Disco Ball', desc: 'Dance Class will never be the same.' },
      { key: 'popcorn', icon: '🍿', name: 'Popcorn Cart', desc: 'Buttered, salted, and occasionally cheesy.' },
    ],
    upper: [
      { name: 'Craft Room', icon: '🧵', fixtures: [fx('🧵', 'Sewing Machine', 'Rattles like a train, sews like a dream.'), fx('🏺', 'Pottery Wheel', 'Every pot so far has been a bowl. On purpose.'), fx('🎨', 'Painting Easel', 'Watercolours of the meadow, and one of the Mayor.'), fx('🧶', 'Yarn Shelves', 'Every colour. The Baroness has been asked to leave them alone.'), fx('🎀', 'Ribbon Rack', 'For bows, bookmarks and prize rosettes.')] },
      { name: 'Ballroom', icon: '💃', fixtures: [fx('💎', 'Crystal Chandelier', 'It sparkles when the waltz begins.'), fx('🪞', 'Mirror Wall', 'So every dancer can admire their own tail.'), fx('📯', 'Gramophone', 'Plays one song. Beautifully. Over and over.'), fx('🎊', 'Streamers', 'Pink, gold and slightly tangled.'), fx('🍹', 'Punch Table', 'Elderflower punch. The cheese straws go first.')] },
    ],
    lines: ['Knit one, purl one, gossip two.', 'Choir practice! Mi-mi-miii!', 'Who brought the brie?', 'Chess club rules: no nibbling pieces.', 'Poetry night! Everyone rhyme with “cheese”.',
      'Has anyone seen the good chairs?', 'The noticeboard says “Lost: one sock”. Again.', 'Is tonight the choir or the chess?', 'I signed up for everything. Help.',
      'The Mayor’s speech is on page three of the programme. It has pages four to nine.', 'Tea and biscuits after, I hope?'],
    talk: [['Are you in the choir?', 'I’m the choir’s biggest critic.'], ['Who’s sweeping tonight?', 'Not me. I swept in 1897.'], ['Fancy a dance?', 'I have two left feet. And a tail.']],
  },
  {
    id: 'press', plot: 2, name: 'The Inky Paw Printing Press', short: 'Printing Press', icon: '🖨️',
    blurb: 'Clank, whirr, thump! Fresh books for your album, hot off the press.',
    unlock: 5e13, build: 60 * 60, lvlC: 4e12,
    action: { key: 'print', icon: '📕', label: 'Start a print run', run: 600, text: 'A print run is finished!' },
    pal: { wall: '#e9e1cf', wall2: '#dccfb5', trim: '#3a3440', floor: '#8a7a6a', roof: '#6d6a80', roof2: '#5a576c', awning: ['#3a3440', '#f4efe6'], sign: '#1f1f2e' },
    decor: [
      { key: 'stand', icon: '📰', name: 'Newsstand', desc: 'The Whiskerwood Gazette, fresh every morning. Tap it to read!' },
      { key: 'typecase', icon: '🔤', name: 'Type Case', desc: 'Ten thousand tiny letters. Somebody always loses the Q.' },
      { key: 'belt', icon: '⚙️', name: 'Conveyor Belt', desc: 'Books ride it like a very slow, very proud roller coaster.' },
      { key: 'lanterns', icon: '🏮', name: 'Page Lanterns', desc: 'Paper lanterns folded from misprints. Lovely AND tidy.' },
      { key: 'bike', icon: '🚲', name: 'Delivery Bicycle', desc: 'Books to every burrow before breakfast.' },
    ],
    upper: [
      { name: 'Bindery', icon: '📚', fixtures: [fx('✂️', 'Paper Guillotine', 'Trims pages perfectly. Keep your tail well back.'), fx('✨', 'Gold-Leaf Stamper', 'For titles that shine on the spine.'), fx('🗂️', 'Cover Rack', 'Linen, leather and one cover made of cheese rind.'), fx('🪡', 'Sewing Frame', 'Where signatures become books.'), fx('🔖', 'Ribbon Bookmarks', 'Every book leaves with its own silk ribbon.')] },
      { name: 'Newsroom', icon: '🗞️', fixtures: [fx('⌨️', 'Typewriters', 'Clackety-clack-DING.'), fx('📰', 'Headline Board', 'Today: SCOOP! (It’s about ice cream.)'), fx('☕', 'Coffee Station', 'Fuel for reporters. Mostly cocoa, actually.'), fx('📨', 'Pneumatic Tubes', 'Whoosh! Stories fly downstairs to the press.'), fx('📷', 'Press Camera', 'Flash! Every photo is of somebody blinking.')] },
    ],
    lines: ['Hot off the press!', 'Mind the ink, it gets everywhere.', 'Page 312 is upside down again.', 'Stop the presses! Typo on the cover!', 'I can smell the fresh paper.',
      'Who spelled “library” with two Rs?', 'My whiskers are blue. Again.', 'Is this chapter meant to be in Italic?', 'One more run and then cocoa.',
      'The Gazette says it will rain. The Gazette is always wrong.', 'I found a Q! Everyone, I found the Q!'],
    talk: [['Did you proofread it?', 'I proof-skimmed it.'], ['Is that ink or jam on your paw?', '…Yes.'], ['Big run today?', 'Ten thousand copies of “Mice and Men”.']],
  },
  {
    id: 'museum', plot: 3, name: 'The Bone & Bauble Museum', short: 'Museum', icon: '🦴',
    blurb: 'Fossils from the Deep Stacks on display. Every fossil you dig up brings in more visitors.',
    unlock: 2e15, build: 2 * 3600, lvlC: 1.5e14,
    action: { key: 'tour', icon: '🎟️', label: 'Give a guided tour', every: 240, sec: 150, text: 'A school trip is waiting for a tour!' },
    pal: { wall: '#efe9dc', wall2: '#e2d8c4', trim: '#8a6a3a', floor: '#b9ad98', roof: '#8d8aa3', roof2: '#76738c', awning: ['#c9a227', '#fff7ec'], sign: '#5a4020' },
    decor: [
      { key: 'placards', icon: '🪧', name: 'Brass Placards & Spotlights', desc: 'Every fossil deserves its moment in the light.' },
      { key: 'rex', icon: '🦖', name: 'T. rex Skull Replica', desc: 'Plaster, mostly. It still makes the children squeal.' },
      { key: 'stars', icon: '🌌', name: 'Star-Map Ceiling', desc: 'Painted constellations, including “The Great Cheese”.' },
      { key: 'mammoth', icon: '🦣', name: 'Mammoth Statue', desc: 'A woolly welcome on the lawn. Pigeons love it.' },
      { key: 'shop', icon: '🎁', name: 'Gift Shop', desc: 'Plush dinosaurs, postcards and bone-shaped cheese.' },
    ],
    upper: [
      { name: 'Grand Gallery', icon: '🦕', fixtures: [fx('🦋', 'Butterfly Cases', 'Pinned with love. Labelled with even more.'), fx('☄️', 'Meteorite', 'Fell in the meadow in 1822. Nobody was hurt, except a turnip.'), fx('🗺️', 'Ancient Map', 'Shows the Hollow Kingdom, and a dragon in the corner.'), fx('🐚', 'Shell Cabinet', 'Whorls, spirals and one shell that hums.'), fx('💠', 'Crystal Geode', 'Cracked open to show a purple cave inside.')] },
      { name: 'Planetarium', icon: '🌌', fixtures: [fx('🔭', 'Brass Telescope', 'On clear nights you can see the Great Cheese.'), fx('🪐', 'Orrery', 'A clockwork solar system. Saturn squeaks.'), fx('🌙', 'Moon Rock', 'Donated by a very tall stranger. Possibly cheese.'), fx('☄️', 'Comet Model', 'Hangs from the dome, tail and all.'), fx('✨', 'Planet Mobiles', 'Tiny planets that turn when the door opens.')] },
    ],
    lines: ['Is that a real dinosaur?!', 'Please do not lick the fossils.', 'It’s a TRICERATOPS, obviously.', 'The gift shop sells bone-shaped cheese!', 'I want to be a palaeontologist!',
      'How old is it? Older than Grandma?', 'That ammonite looks like a cinnamon roll.', 'Stay with the group, everyone!', 'Can I touch it? Just a little bit?',
      'The guard is asleep again.', 'I think the Pterodactyl just blinked.'],
    talk: [['Is it scary?', 'Only if you’re a fern.'], ['How big was it?', 'Bigger than the library. Probably.'], ['Why is it called a sabre-tooth?', 'Because “butter-knife-tooth” is less scary.']],
  },
];
export const WING = Object.fromEntries(WINGS.map((w) => [w.id, w]));

// The Community Hall's clubs rotate, one a day.
export const CLUBS = [
  { id: 'book', name: 'Book Club', icon: '📚', line: 'This month: “Pride and Pre-Cheese”. Nobody finished it.',
    lines: ['Chapter twelve! I GASPED.', 'Who else cried at the ending?', 'I only read the blurb. Shh.', 'The dog was the narrator ALL ALONG?', 'I brought biscuits instead of opinions.', 'Next month: something shorter, please.'] },
  { id: 'knit', name: 'Knitting Circle', icon: '🧶', line: 'Forty scarves. Zero finished. Endless gossip.',
    lines: ['Knit one, purl one, gossip two.', 'This scarf is for my cousin. She’s very long.', 'I dropped a stitch. And a biscuit.', 'Did you hear about the Mayor’s moustache?', 'I’m making a tea cosy for the tea urn.', 'It’s not a mistake, it’s a DESIGN.'] },
  { id: 'choir', name: 'Choir Night', icon: '🎶', line: 'The sopranos are squeaking beautifully tonight.',
    lines: ['Mi-mi-MIIIII!', 'Squeak on the beat, everyone!', 'Who’s humming the Barley Ballad?', 'Bravo! Encore!', 'That high note cracked a teacup.', 'Altos, a little less enthusiasm.'] },
  { id: 'cheese', name: 'Cheese Tasting', icon: '🧀', line: 'Tonight: seven cheeses, one very full hall.',
    lines: ['Notes of hay, and… more cheese.', 'This brie is SO creamy.', 'I’ll just try one more. Or nine.', 'Is this blue cheese meant to be blue?', 'Pass the crackers!', 'The Gouda is gouda-licious.'] },
  { id: 'chess', name: 'Chess Club', icon: '♟️', line: 'Checkmate in three! Or thirty. Hard to say.',
    lines: ['Hmm… hmmmm…', 'Check!', 'Did my knight just move by itself?', 'Is it my turn? It’s been an hour.', 'Checkmate! …wait, no.', 'I’m thinking. Don’t breathe.'] },
  { id: 'poetry', name: 'Poetry Slam', icon: '🎤', line: 'Everyone must rhyme with “Camembert”.',
    lines: ['“O cheese, O cheese, wherefore art thou cheese?”', '*snap snap snap*', 'Deep. So deep.', 'Does “Camembert” rhyme with “tail”? No.', 'That haiku had eleven syllables.', 'Encore! Or maybe don’t.'] },
  { id: 'dance', name: 'Dance Class', icon: '💃', line: 'The Mouse Waltz: one-two-three, one-two-squeak.',
    lines: ['One-two-three, one-two-squeak!', 'Mind my tail!', 'Spin! And… spin again!', 'I’m a natural. Look at me go.', 'Conga line! Conga line!', 'My feet have never been happier.'] },
];

export function wingMult(lvl) {
  if (!lvl) return 0;
  const ms = WING_MILESTONES.filter((m) => lvl >= m).length;
  return WING_PER_LVL * lvl + 0.1 * ms;
}
export const wingLevelCost = (w, lvl) => w.lvlC * Math.pow(WING_GROWTH, lvl - 1);
export const wingDecorCost = (w, k) => w.lvlC * DECOR_COST[k];
// Furniture for an upper storey (u = 0 for the second storey, 1 for the third).
export const wingUpperCost = (w, u, k) => w.lvlC * UP_COST[u][k];
export const wingStoreys = (lvl) => (lvl >= STOREY_LVL[2] ? 3 : lvl >= STOREY_LVL[1] ? 2 : 1);
export const wingFurnitureCount = (st) => (st.decor || []).filter(Boolean).length + (st.up || []).reduce((a, u) => a + (u || []).filter(Boolean).length, 0);
