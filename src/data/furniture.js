// The furnishing catalogue. Everything here is bought once and KEPT FOREVER: it moves with you
// to every location. Owning an item adds a permanent income bonus (by rarity); floor items can be
// placed on any floor from its "Style" tab, global items (librarian hats, garden pieces) apply
// everywhere, and curiosities are displayed in the Keepsake Vault.
//
// slot:  rug | lamp | plant | art | shelf | desk | seat | center   (per floor)
//        hat | garden                                               (global)
//        curio                                                      (vault display)
// cost:  golden cheese.   tokens: festival tokens (festival items).
// loc:   only sold in that location's shop.   festival: only sold during that festival.
// src:   'regular' items are gifts from a regular's story, never sold.
// tap:   interactive furniture: tapping it in the world does something silly.

export const RARITY_BONUS = { C: 0.03, R: 0.06, E: 0.12, L: 0.25 };
export const RARITY_INFO = {
  C: { name: 'Common', color: '#8fa2b4' }, R: { name: 'Rare', color: '#4a90d9' },
  E: { name: 'Epic', color: '#a45bd6' }, L: { name: 'Legendary', color: '#f0a92e' },
};

export const SLOTS = {
  rug: { name: 'Rugs', icon: 'rug', floor: true }, lamp: { name: 'Lamps', icon: 'lamp', floor: true },
  plant: { name: 'Plants', icon: 'plant', floor: true }, art: { name: 'Wall art', icon: 'frame', floor: true },
  shelf: { name: 'Bookshelves', icon: 'shelf', floor: true }, desk: { name: 'Desks', icon: 'desk', floor: true },
  seat: { name: 'Chairs', icon: 'chair', floor: true }, center: { name: 'Curiosities', icon: 'curio', floor: true },
  hat: { name: 'Librarian hats', icon: 'hat' }, garden: { name: 'Garden', icon: 'garden' },
  curio: { name: 'Keepsakes', icon: 'keepsake' },
};
export const FLOOR_SLOTS = Object.keys(SLOTS).filter((k) => SLOTS[k].floor);

const I = (id, slot, rarity, cost, name, desc, extra = {}) => ({ id, slot, rarity, cost, name, desc, ...extra });

export const FURNITURE = [
  // ---------- rugs ----------
  I('persian', 'rug', 'C', 30, 'Grand Persian Rug', 'Hand-knotted by forty mice over forty days. One of them knotted himself in.'),
  I('rainbow', 'rug', 'C', 35, 'Braided Rainbow Rug', 'Every colour at once. Excellent for losing small beads.'),
  I('cheeserug', 'rug', 'R', 90, 'Cheese Wheel Rug', 'Looks delicious. Is not. Please stop licking the rug.'),
  I('fauxcat', 'rug', 'E', 260, 'Faux Cat Rug', 'No cats were harmed. Baroness Clawdia is still furious about it.'),
  I('starrug', 'rug', 'R', 110, 'Star Map Rug', 'Accurate to the night sky of 1832. Mostly.'),
  I('waves', 'rug', 'R', 95, 'Tidal Wave Rug', 'Makes readers feel slightly seasick. In a relaxing way.', { loc: 'cove' }),
  I('moss', 'rug', 'R', 95, 'Living Moss Carpet', 'Soft, springy and very slightly alive. Water weekly.', { loc: 'caverns' }),

  // ---------- lamps ----------
  I('lanterns', 'lamp', 'C', 30, 'Paper Lanterns', 'Cheerful, bouncy, and only a little bit flammable.'),
  I('fireflyjar', 'lamp', 'R', 85, 'Firefly Jars', 'The fireflies are volunteers. They get dental.', { loc: 'meadow' }),
  I('jelly', 'lamp', 'E', 240, 'Jellyfish Lamps', 'Gently glowing, gently drifting, gently judging your posture.', { loc: 'cove' }),
  I('glowcaplamp', 'lamp', 'R', 90, 'Glowcap Clusters', 'Mushrooms that glow. Do not eat. Do not ask how we know.', { loc: 'caverns' }),
  I('bulbs', 'lamp', 'R', 90, 'Edison Bulbs', 'The filaments spell “READ” if you squint really hard.', { loc: 'clockwork' }),
  I('candles', 'lamp', 'E', 250, 'Candle Chandelier', 'Forty candles. Twelve fire buckets. Zero drama so far.', { loc: 'castle' }),
  I('orbs', 'lamp', 'L', 800, 'Floating Light Orbs', 'Nobody knows what holds them up. Please do not ask them.', { loc: 'sky' }),

  // ---------- plants ----------
  I('cactus', 'plant', 'C', 25, 'Spike the Cactus', 'Low maintenance. High emotional distance. Do not hug.'),
  I('monstera', 'plant', 'C', 35, 'Monstera', 'Big leaves, bigger personality. Occasionally eats a bookmark.'),
  I('bonsai', 'plant', 'R', 100, 'Tiny Bonsai', 'Four hundred years old and still shorter than you.'),
  I('flytrap', 'plant', 'E', 230, 'Venus Book-Trap', 'Feeds exclusively on overdue notices. Very well fed.'),
  I('coral', 'plant', 'R', 95, 'Potted Coral', 'Technically an animal. Technically a plant. Technically fabulous.', { loc: 'cove' }),
  I('crystalfern', 'plant', 'E', 260, 'Crystal Fern', 'Grows one crystal leaf a century. We are on leaf nine.', { loc: 'caverns' }),

  // ---------- wall art ----------
  I('mona', 'art', 'R', 90, 'Mona Mousa', 'Her eyes follow you around the room. So do her whiskers.'),
  I('scream', 'art', 'R', 90, 'The Squeak', 'Painted the moment the artist saw the library fines.'),
  I('starry', 'art', 'E', 220, 'The Starry Nibble', 'Swirly. Very swirly. Please sit down if you feel swirly too.'),
  I('pearl', 'art', 'E', 230, 'Girl with a Cheese Earring', 'The earring is brie. It has been there since 1665. Nobody checks.'),
  I('wave', 'art', 'R', 100, 'The Great Wave off Cheddar', 'A tidal wave of fondue. Terrifying. Delicious.', { loc: 'cove' }),
  I('poker', 'art', 'C', 40, 'Mice Playing Poker', 'One of them is cheating. It is the one with the cheese.'),
  I('mimsyart', 'art', 'L', 750, 'Portrait of Grandma Mimsy', 'Painted in her prime, holding her first library card. She insisted on the tiara.'),

  // ---------- bookshelves ----------
  I('birch', 'shelf', 'C', 35, 'Pale Birch Shelves', 'Light, bright and Scandinavian-ish. Assembled with only three leftover screws.'),
  I('walnut', 'shelf', 'R', 90, 'Dark Walnut Shelves', 'Makes every book look forty percent more serious.'),
  I('painted', 'shelf', 'R', 100, 'Painted Cottage Shelves', 'Painted in the floor’s colours by a mouse with very steady paws.'),
  I('ladder', 'shelf', 'E', 240, 'Rolling Ladder Shelves', 'Comes with a rolling ladder. Readers mostly use it to go wheee.'),
  I('glass', 'shelf', 'E', 260, 'Glass-Front Cabinets', 'For books too precious to touch. So, all of them, according to Professor Footnote.'),
  I('gilded', 'shelf', 'L', 900, 'Gilded Royal Shelves', 'Gold leaf, velvet lining, and a tiny crown on every shelf.', { loc: 'castle' }),

  // ---------- desks ----------
  I('marble', 'desk', 'R', 95, 'Marble Counter', 'Cold, elegant and excellent for dramatically slamming books on.'),
  I('register', 'desk', 'R', 110, 'Antique Cash Register', 'KA-CHING! Every sale sounds like a small victory.'),
  I('stump', 'desk', 'C', 40, 'Tree-Stump Desk', 'Still growing. Please trim the twigs before opening time.'),
  I('brassdesk', 'desk', 'E', 250, 'Brass Book-Sorter Desk', 'Stamps, sorts and hums. Once stamped the librarian.', { loc: 'clockwork' }),

  // ---------- chairs ----------
  I('wingback', 'seat', 'C', 40, 'Velvet Wingbacks', 'Ears on a chair: for when you do not want to hear about the ending.'),
  I('beanbag', 'seat', 'C', 35, 'Squishy Beanbags', 'Easy to get into. Impossible to get out of. Several readers still inside.'),
  I('hammock', 'seat', 'R', 110, 'Reading Hammocks', 'Swing gently between chapters. Motion sickness sold separately.'),
  I('bathtub', 'seat', 'E', 280, 'Clawfoot Reading Tubs', 'For readers who like a soak with their saga. No actual water. Usually.'),
  I('throne', 'seat', 'E', 300, 'Velvet Thrones', 'Every reader a king. Every king still shushed.', { loc: 'castle' }),
  I('cloudbag', 'seat', 'L', 850, 'Cloud Beanbags', 'Made of real cloud. Squishy, cool and faintly drizzly.', { loc: 'sky' }),

  // ---------- curiosities (replace the floor's centerpiece; tap them!) ----------
  I('gramophone', 'center', 'R', 120, 'Gramophone', 'Plays one song. The song is a waltz. It will always be a waltz.', { tap: 'gramophone' }),
  I('cuckoo', 'center', 'R', 110, 'Cuckoo Clock', 'The bird has opinions about your book choices. Tap to hear them.', { tap: 'cuckoo' }),
  I('fishtank', 'center', 'E', 240, 'Fish Tank', 'Home of Sir Bubbles, who reads over your shoulder. Tap to say hello.', { tap: 'fishtank' }),
  I('typewriter', 'center', 'E', 230, 'Haunted Typewriter', 'Types the first lines of terrible novels all by itself. Tap to read one.', { tap: 'typewriter' }),
  I('crystalball', 'center', 'E', 250, 'Crystal Ball', 'Predicts the ending of any book. It is usually “sad”. Tap to consult.', { tap: 'crystalball' }),
  I('orrery', 'center', 'E', 280, 'Brass Orrery', 'The planets spin. The cheese moon spins fastest.', { tap: 'orrery', loc: 'clockwork' }),
  I('armor', 'center', 'E', 270, 'Suit of Armour', 'Definitely empty. Definitely did not just sigh. Tap it. Go on.', { tap: 'armor', loc: 'castle' }),
  I('tome', 'center', 'L', 1100, 'The Enchanted Tome', 'A book that reads itself aloud, does the voices, and never spoils the ending.', { tap: 'tome' }),
  I('popcorn', 'center', 'E', 0, "Filmore's Popcorn Machine", 'For watching the book. Filmore insists this is allowed.', { tap: 'popcorn', src: 'regular' }),

  // ---------- librarian hats (every floor's librarian wears it) ----------
  I('wizard', 'hat', 'C', 30, 'Wizard Hat', 'Makes the librarian 12% wiser. Unverified.'),
  I('tophat', 'hat', 'R', 0, "Barnaby's Top Hat", 'Barnaby read a whole book in this hat. A picture book. It counts.', { src: 'regular' }),
  I('flower', 'hat', 'C', 25, 'Flower Crown', 'Freshly picked. The bees are fine with it. Mostly.'),
  I('headphones', 'hat', 'R', 0, 'Spoiler-Proof Earmuffs', 'Blocks 99% of spoilers. Squeaky is the other 1%.', { src: 'regular' }),
  I('captain', 'hat', 'R', 80, "Captain's Cap", 'Makes every “shh” sound like an order.', { loc: 'cove' }),
  I('miner', 'hat', 'R', 80, 'Miner’s Lamp Helmet', 'For reading in dark corners. And finding lost bookmarks.', { loc: 'caverns' }),
  I('goggles', 'hat', 'R', 80, 'Brass Goggles', 'Magnify tiny print 10×. Magnify dust 100×. Worth it.', { loc: 'clockwork' }),
  I('crown', 'hat', 'L', 950, 'Librarian’s Crown', 'The highest honour in bookkeeping. Heavy is the head that stamps the cards.'),
  I('aviator', 'hat', 'E', 240, 'Aviator Cap', 'For librarians who shelve at altitude.', { loc: 'sky' }),

  // ---------- garden (shown outside the front door in every location) ----------
  I('gnome', 'garden', 'C', 30, 'Reading Gnome', 'Has been on the same page since 1974. Refuses to skip ahead.'),
  I('birdbath', 'garden', 'C', 35, 'Birdbath', 'The pigeons use it. The pigeons also use it as a birdbath.'),
  I('minilib', 'garden', 'R', 120, 'Little Free Library', 'A library for your library. Take a book, leave a book, take a snack.'),
  I('topiary', 'garden', 'E', 240, 'Book-Shaped Hedge', 'Trimmed into an open book. The title changes when it grows.'),
  I('sundial', 'garden', 'R', 90, 'Sundial', 'Tells the time when sunny. Tells fibs when cloudy.'),

  // ---------- keepsakes (vault display) ----------
  I('firsted', 'curio', 'E', 260, 'First Edition “Very Hungry Mouse”', 'Has original nibble marks. By the author himself.'),
  I('glasses', 'curio', 'R', 90, "Grandma Mimsy's Spare Glasses", 'She has seven pairs. She can never find any of them.'),
  I('hairball', 'curio', 'C', 25, 'A Suspiciously Cat-Shaped Hairball', 'Found in the Mystery Attic. Nobody wants to talk about it.'),
  I('goldmark', 'curio', 'L', 700, 'The Golden Bookmark', 'Marks your place in any book, even ones you have not opened yet.'),
  I('unfinished', 'curio', 'R', 100, 'A Book Nobody Has Finished', '4,000 pages. The last page is rumoured to say “thanks for reading”.'),
  I('envelope', 'curio', 'E', 220, 'Sealed Envelope: DO NOT OPEN', 'Contains the ending of every book ever. Squeaky wants it very badly.'),
  I('snowglobe', 'curio', 'C', 30, 'Library Snow Globe', 'A tiny Whiskerwood inside. Shake it and tiny mice complain.'),
  I('bookmarks', 'curio', 'R', 0, "Doris's 400 Bookmarks", 'She uses all of them. At once. In one book.', { src: 'regular' }),
  I('backclock', 'curio', 'R', 0, "Tomasina's Backwards Clock", 'Starts at the end. Like a proper story, she says.', { src: 'regular' }),
  I('knitrug', 'rug', 'R', 0, "Granny's 'RAED' Rug", 'Hand-knitted. Slightly misspelled. Deeply loved.', { src: 'regular' }),
  I('diploma', 'art', 'R', 0, 'Diploma of Being Technically Correct', 'Awarded by Professor Footnote to Professor Footnote.', { src: 'regular' }),

  // ---------- festival exclusives (bought with festival tokens) ----------
  I('xmastree', 'garden', 'E', 0, 'Grand Fir Tree', 'Decorated with tiny books instead of baubles.', { festival: 'christmas', tokens: 60 }),
  I('santahat', 'hat', 'R', 0, 'Festive Bobble Hat', 'Jingles every time the librarian says “shh”.', { festival: 'christmas', tokens: 35 }),
  I('lanternarch', 'garden', 'E', 0, 'Lantern Arch', 'Glowing lanterns in every colour, for long lovely evenings.', { festival: 'ramadan', tokens: 60 }),
  I('fanous', 'lamp', 'R', 0, 'Fanous Lanterns', 'Pierced-brass lanterns that scatter stars across the walls.', { festival: 'ramadan', tokens: 35 }),
  I('eidlights', 'garden', 'E', 0, 'Festival Lights Canopy', 'A canopy of lights over the garden path. Guests arrive glowing.', { festival: 'eid', tokens: 60 }),
  I('giftstack', 'curio', 'R', 0, 'Stack of Gift Boxes', 'Every box has a smaller box inside. The last one has a sweet.', { festival: 'eid', tokens: 35 }),
  I('pumpkins', 'garden', 'E', 0, 'Jack-o’-Lantern Pile', 'Carved with famous opening lines. “It was a dark and stormy night” is the scariest.', { festival: 'halloween', tokens: 60 }),
  I('witchhat', 'hat', 'R', 0, 'Pointy Witch Hat', 'Comes with a free cackle. The cackle is non-refundable.', { festival: 'halloween', tokens: 35 }),
  I('heartarch', 'garden', 'E', 0, 'Rose Heart Arch', 'Couples read under it. Singles read under it more smugly.', { festival: 'valentine', tokens: 60 }),
  I('heartrug', 'rug', 'R', 0, 'Heart Rug', 'Soft, pink and extremely sincere.', { festival: 'valentine', tokens: 35 }),
  I('fireworks', 'garden', 'E', 0, 'Firework Stand', 'Every rocket is labelled with a book you promise to finish this year.', { festival: 'newyear', tokens: 60 }),
  I('clockart', 'art', 'R', 0, 'Countdown Clock', 'Forever at 11:59. The suspense is permanent.', { festival: 'newyear', tokens: 35 }),
  I('lemonade', 'garden', 'E', 0, 'Lemonade & Books Stall', 'Buy a lemonade, borrow a beach read. Sticky pages guaranteed.', { festival: 'summer', tokens: 60 }),
  I('sunflowers', 'plant', 'R', 0, 'Giant Sunflowers', 'They turn to face whoever is reading the best book.', { festival: 'summer', tokens: 35 }),
  I('haybales', 'garden', 'E', 0, 'Harvest Scarecrow', 'Guards the pumpkins. Reads during his breaks. Scares nobody.', { festival: 'autumn', tokens: 60 }),
  I('leafrug', 'rug', 'R', 0, 'Autumn Leaf Rug', 'Crunches when you walk on it. Deeply satisfying.', { festival: 'autumn', tokens: 35 }),
  I('bookstall', 'garden', 'E', 0, 'Book Week Stall', 'Second-hand books, first-class gossip.', { festival: 'bookweek', tokens: 60 }),
  I('quillset', 'curio', 'R', 0, 'Famous Authors’ Quills', 'Seven quills from seven authors. One is just a pigeon feather. Shh.', { festival: 'bookweek', tokens: 35 }),
  I('cake', 'garden', 'E', 0, 'Giant Birthday Cake', 'Happy birthday, dear library! (Do not eat the candles.)', { festival: 'anniversary', tokens: 60 }),
  I('partyhat', 'hat', 'R', 0, 'Party Hat', 'Worn at a jaunty angle. Mandatory fun.', { festival: 'anniversary', tokens: 35 }),
];

export const FURN = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));

export function furnitureBonus(owned) {
  let b = 0;
  for (const id in owned || {}) { const f = FURN[id]; if (owned[id] && f) b += RARITY_BONUS[f.rarity]; }
  return b;
}
