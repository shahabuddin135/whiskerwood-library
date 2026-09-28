// Furniture for the Shop. Bought once with golden cheese, kept forever (across every branch),
// and placed on any floor from the Upgrade sheet. Each piece you own adds a little income.
//   slot: where it goes on a floor   rarity: C/R/E/L (uses the album's rarity colours)
//   branch: only sold at that location   festival: only sold during that festival
export const SLOTS = [
  { key: 'rug', name: 'Rug', icon: '🧶' },
  { key: 'lamp', name: 'Lamps', icon: '💡' },
  { key: 'art', name: 'Painting', icon: '🖼️' },
  { key: 'wall', name: 'Wall', icon: '🪝' },
  { key: 'board', name: 'Under Window', icon: '📌' },
  { key: 'desk', name: 'Desk', icon: '🛎️' },
  { key: 'ceiling', name: 'Ceiling', icon: '🎏' },
];

export const FURNITURE_PRICE = { C: 15, R: 35, E: 80, L: 180 };
export const FURNITURE_BONUS = { C: 0.02, R: 0.04, E: 0.08, L: 0.15 };

const F = (id, slot, rarity, icon, name, desc, extra = {}) => ({ id, slot, rarity, icon, name, desc, price: extra.price ?? FURNITURE_PRICE[rarity], ...extra });

export const FURNITURE = [
  // rugs
  F('cheeserug', 'rug', 'C', '🧀', 'Cheese-Wedge Rug', 'Holes included. Do not nibble.'),
  F('rainbowrug', 'rug', 'C', '🌈', 'Rainbow Rag Rug', 'Knitted from 200 odd socks.'),
  F('persian', 'rug', 'R', '🧶', 'Persian Rug', 'Imported from very far away. Well, the next meadow.'),
  F('starrug', 'rug', 'R', '✨', 'Starry Night Rug', 'Lie on it and count the stars. There are 14.'),
  F('catrug', 'rug', 'E', '🐈', 'Faux Cat-Fur Rug', 'No cats were harmed. One was deeply annoyed.'),
  F('redcarpet', 'rug', 'L', '👑', 'Royal Red Carpet', 'Every reader walks in like a celebrity.'),
  // lamps
  F('paperlanterns', 'lamp', 'C', '🏮', 'Paper Lanterns', 'Soft light, gentle rustle.'),
  F('oillamps', 'lamp', 'C', '🪔', 'Brass Oil Lamps', 'Polished every Tuesday by Pip.'),
  F('fireflyjars', 'lamp', 'R', '🫙', 'Firefly Jars', 'The fireflies are volunteers. They get dental.'),
  F('mushroomlamps', 'lamp', 'E', '🍄', 'Glow-Mushroom Lamps', 'Grown, not bought. Very eco.'),
  F('chandelier', 'lamp', 'L', '💎', 'Crystal Chandelier', 'Sparkly enough for a royal ball.'),
  // paintings
  F('stilllife', 'art', 'C', '🧀', 'Still Life with Cheese', 'The cheese did not stay still for long.'),
  F('scream', 'art', 'R', '😱', 'The Scream (But Quieter)', 'It is a library, after all.'),
  F('pearl', 'art', 'R', '🦪', 'Girl with a Pearl Crumb', 'She looks at you wherever you nibble.'),
  F('monamousa', 'art', 'E', '🖼️', 'The Mona Mousa', 'That smile? She knows where the cheese is.'),
  F('wave', 'art', 'E', '🌊', 'The Great Wave off Cheddar', 'Surf’s up. Pages down.'),
  F('starry', 'art', 'L', '🌌', 'Starry Night Over the Pantry', 'Priceless. Also slightly sticky.'),
  // wall pieces
  F('coatrack', 'wall', 'C', '🧥', 'Coat Hooks & Scarves', 'Three hooks, eleven scarves.'),
  F('rules', 'wall', 'C', '📜', 'Library Rules Sign', 'Rule 1: Shh. Rule 2: SHH.'),
  F('mirror', 'wall', 'R', '🪞', 'Antique Mirror', 'Mirror, mirror on the wall: who reads the most of all?'),
  F('cuckoo', 'wall', 'R', '🕰️', 'Cuckoo Clock', 'The cuckoo reads too. It never comes out on time.'),
  F('cheesetrophy', 'wall', 'E', '🏆', 'Mounted Cheese Wheel', 'The trophy of a legendary snack hunt.'),
  // under the window
  F('corkboard', 'board', 'C', '📌', 'Corkboard of Notes', '“Lost: one sock.” “Found: one sock?”'),
  F('sampler', 'board', 'C', '🧵', 'Embroidered Sampler', '“Home Sweet Burrow.”'),
  F('jarshelf', 'board', 'R', '🫙', 'Little Jar Shelf', 'Buttons, beads and one mystery jar.'),
  F('readchart', 'board', 'E', '⭐', 'Reading Challenge Chart', 'Gold stars for every hundred pages.'),
  // desk
  F('teaset', 'desk', 'C', '☕', 'Tea Set', 'Always warm. Nobody knows how.'),
  F('cactus', 'desk', 'C', '🌵', 'Spike the Cactus', 'Low maintenance. Do not hug.'),
  F('bankerlamp', 'desk', 'R', '💡', 'Green Banker’s Lamp', 'For serious reading. And serious napping.'),
  F('typewriter', 'desk', 'R', '⌨️', 'Tiny Typewriter', 'Clack clack ding! (Writes only in squeaks.)'),
  F('deskglobe', 'desk', 'E', '🌍', 'Spinning Desk Globe', 'Spin it, point, and that’s your next book.'),
  F('catfigure', 'desk', 'E', '🐈', 'Porcelain Cat Figurine', 'Keeps the real cat away. Probably.'),
  // ceiling
  F('bunting', 'ceiling', 'C', '🎏', 'Paper Bunting', 'Every flag is a different favourite book.'),
  F('fairylights', 'ceiling', 'R', '✨', 'Fairy Lights', 'Twinkly. Cosy. Slightly tangled.'),
  F('hangplants', 'ceiling', 'R', '🪴', 'Hanging Plants', 'Watered by the tallest mouse on staff.'),
  F('pagegarland', 'ceiling', 'E', '📚', 'Book-Page Garland', 'Made from pages of books nobody liked.'),

  // local finds: only sold at that branch (kept forever once bought)
  F('quiltrug', 'rug', 'R', '🧵', 'Patchwork Quilt Rug', 'Stitched by every grandma in the meadow.', { branch: 'meadow' }),
  F('wildgarland', 'ceiling', 'R', '🌼', 'Wildflower Garland', 'Picked this morning. Smells like summer.', { branch: 'meadow' }),
  F('flourrug', 'rug', 'R', '🌾', 'Flour-Sack Rug', 'Slightly floury. Makes every mouse look like a ghost.', { branch: 'windmill' }),
  F('millmodel', 'desk', 'E', '🌬️', 'Tiny Windmill Model', 'The sails turn when somebody sighs over a good book.', { branch: 'windmill' }),
  F('shipwheel', 'wall', 'R', '☸️', 'Ship’s Wheel', 'Steer the library into a good story.', { branch: 'cove' }),
  F('beaconlamp', 'lamp', 'E', '🚨', 'Lighthouse Lamps', 'Guides lost readers home.', { branch: 'cove' }),
  F('lilyrug', 'rug', 'R', '🪷', 'Lily-Pad Rug', 'Hop from pad to pad. Ribbit optional.', { branch: 'pond' }),
  F('frogfigure', 'desk', 'E', '🐸', 'Reading Frog Statue', 'He’s been on page one for years.', { branch: 'pond' }),
  F('castlebanner', 'wall', 'R', '🚩', 'Castle Banner', 'The royal crest: a crown on a wedge of cheese.', { branch: 'castle' }),
  F('candelabra', 'lamp', 'L', '🕯️', 'Castle Candelabras', 'Dramatic. Drippy. Magnificent.', { branch: 'castle' }),

  // festival specials (only while the festival lasts; kept forever)
  F('xmaslights', 'ceiling', 'R', '🎄', 'Christmas Lights', 'Red, green and gold, all year round.', { festival: 'christmas' }),
  F('wreath', 'board', 'E', '💚', 'Holly Wreath', 'Deck the halls with bits of holly.', { festival: 'christmas' }),
  F('fanous', 'lamp', 'E', '🏮', 'Fanous Lanterns', 'Warm Ramadan light for long evenings of reading.', { festival: 'ramadan' }),
  F('crescentgarland', 'ceiling', 'R', '🌙', 'Crescent & Star Garland', 'Little moons and stars for Ramadan nights.', { festival: 'ramadan' }),
  F('eidbunting', 'ceiling', 'R', '🎉', 'Eid Mubarak Bunting', 'Eid Mubarak from every mouse in the library!', { festival: 'eid' }),
  F('sweetstray', 'desk', 'E', '🍬', 'Tray of Eid Sweets', 'Help yourself. Leave one for Pip.', { festival: 'eid' }),
  F('pumpkinlamps', 'lamp', 'E', '🎃', 'Pumpkin Lanterns', 'Carved with tiny spooky smiles.', { festival: 'halloween' }),
  F('cobwebs', 'ceiling', 'R', '🕸️', 'Spooky Cobweb Garland', 'Hand-woven by a very artistic spider.', { festival: 'halloween' }),
  F('heartgarland', 'ceiling', 'R', '💕', 'Heart Garland', 'For readers who love books a little too much.', { festival: 'valentine' }),
  F('rosevase', 'desk', 'E', '🌹', 'Vase of Roses', 'From a secret admirer. It was the Mayor.', { festival: 'valentine' }),
  F('streamers', 'ceiling', 'R', '🎊', 'New Year Streamers', 'Leftover confetti found until March.', { festival: 'newyear' }),
  F('countdown', 'wall', 'E', '⏰', 'Countdown Clock', 'Ten, nine, eight… chapters to go.', { festival: 'newyear' }),
  F('shellgarland', 'ceiling', 'R', '🐚', 'Seashell Garland', 'Hold one to your ear: it says “shh”.', { festival: 'summer' }),
  F('lemonade', 'desk', 'E', '🍋', 'Lemonade Stand Jug', 'Fresh-squeezed summer in a jug.', { festival: 'summer' }),
  F('leafgarland', 'ceiling', 'R', '🍁', 'Autumn Leaf Garland', 'Crunchy, golden and rustly.', { festival: 'autumn' }),
  F('pumpkinpie', 'desk', 'E', '🥧', 'Pumpkin Pie', 'Do not read with sticky paws.', { festival: 'autumn' }),
  F('pagebunting', 'ceiling', 'R', '🔖', 'Bookmark Bunting', 'Made of bookmarks from Book Week.', { festival: 'bookweek' }),
  F('wormplush', 'desk', 'E', '🐛', 'Bookworm Plushie', 'The only bookworm allowed in the library.', { festival: 'bookweek' }),
  F('bdaybanner', 'ceiling', 'R', '🎈', 'Birthday Banner', 'Happy birthday, dear library!', { festival: 'anniversary' }),
  F('bdaycake', 'desk', 'L', '🎂', 'Library Birthday Cake', 'Shaped like a book. Tastes like cheese.', { festival: 'anniversary' }),
];
export const FURN = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));

// Permanent income bonus from every piece you own.
export function furnitureBonus(owned = {}) {
  let b = 0;
  for (const id of Object.keys(owned)) if (FURN[id]) b += FURNITURE_BONUS[FURN[id].rarity];
  return b;
}
