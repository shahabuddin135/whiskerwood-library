// Seasonal festivals follow the real calendar. While one is running the whole world joins in:
// decorations inside and out, a sky mood, special particles, festival chatter, collectible
// tokens to tap, a festival quest, limited books and exclusive furniture.
//
// Lunar dates (Ramadan / Eid) are approximate: they depend on the moon sighting, so the
// windows start a day early and run a little long.

const RAMADAN = { 2025: ['2025-02-28', '2025-03-29'], 2026: ['2026-02-17', '2026-03-19'], 2027: ['2027-02-07', '2027-03-09'], 2028: ['2028-01-27', '2028-02-25'], 2029: ['2029-01-15', '2029-02-13'], 2030: ['2030-01-05', '2030-02-03'], 2031: ['2030-12-25', '2031-01-23'] };
const EID_FITR = { 2025: '2025-03-30', 2026: '2026-03-20', 2027: '2027-03-10', 2028: '2028-02-26', 2029: '2029-02-14', 2030: '2030-02-04', 2031: '2031-01-24' };
const EID_ADHA = { 2025: '2025-06-06', 2026: '2026-05-27', 2027: '2027-05-16', 2028: '2028-05-05', 2029: '2029-04-24', 2030: '2030-04-13', 2031: '2031-04-02' };

const DAY = 86400000;
const at = (s) => new Date(s + 'T00:00:00').getTime();
const md = (y, m, d) => new Date(y, m - 1, d).getTime();
const monthKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}`; };

// Each window returns [start, endExclusive] around `now` (or null).
function fixed(m1, d1, m2, d2) {
  return (now) => {
    const y = new Date(now).getFullYear();
    for (const yy of [y - 1, y]) {
      const a = md(yy, m1, d1); let b = md(yy, m2, d2) + DAY;
      if (b <= a) b = md(yy + 1, m2, d2) + DAY;
      if (now >= a && now < b) return [a, b];
    }
    return null;
  };
}
function table(tab, before = 0, after = 0) {
  return (now) => {
    for (const y in tab) {
      const v = tab[y]; const [s, e] = Array.isArray(v) ? v : [v, v];
      const a = at(s) - before * DAY; const b = at(e) + (after + 1) * DAY;
      if (now >= a && now < b) return [a, b];
    }
    return null;
  };
}

export const FESTIVALS = [
  {
    id: 'eid', name: 'Eid Celebrations', short: 'Eid', icon: 'star8', token: { name: 'Sweets', icon: 'sweet' },
    when: (now) => table(EID_FITR, 0, 3)(now) || table(EID_ADHA, 0, 3)(now),
    blurb: 'Eid Mubarak! Lights on every balcony, sweets for every guest and little envelopes of coins for the young mice.',
    colors: ['#f2c14e', '#3fbf9f', '#f28b82', '#9ec5f0', '#ffffff'], glow: '#ffe7a0',
    sky: { tint: [255, 214, 150, 0.06] }, particles: 'fireworks', hang: 'star', roof: 'star8', window: 'lights', desk: 'sweets',
    music: 'chimes', gift: 'Eidi envelope',
    lines: ['Eid Mubarak!', 'I got new shoes AND a new book!', 'Grandma gave me an envelope of coins. Straight to the book fund.', 'Sweets? For me? I will read to you in exchange.', 'Everyone looks so smart today!', 'I visited six burrows before lunch.', 'Save me a ma’amoul! …what? I’m on page 12.', 'The whole meadow smells of baking.'],
    books: [
      ['The Mystery of the Missing Eidi', 'Nadia Nibbleworth', 'A young mouse investigates where all the gift coins went. Suspect: her own sweet tooth.', '★★★★★ “Solved it before breakfast. Then bought books.”'],
      ['Sweets for Everyone', 'Chef Gustavo', 'Thirty recipes to share with neighbours, plus one to hide for yourself.', '★★★★★ “Page 31 is empty. Somebody hid it.”'],
      ['New Shoes, Big Plans', 'Little Idris', 'A picture book about the best morning of the year and the squeakiest new shoes.', '★★★★☆ “My shoes squeak too. Relatable.”'],
    ],
  },
  {
    id: 'ramadan', name: 'Ramadan Nights', short: 'Ramadan', icon: 'crescent', token: { name: 'Lanterns', icon: 'lantern' },
    when: table(RAMADAN, 1, 0),
    blurb: 'Ramadan Kareem! Lanterns glow in every window, the evenings are long and golden, and everyone gathers at sunset to share a meal and a story.',
    colors: ['#f2c14e', '#e8913a', '#3f7f9f', '#9b6fb0', '#fff3c9'], glow: '#ffcf7a',
    sky: { evening: 0.45, tint: [255, 170, 90, 0.07] }, particles: 'lanterns', hang: 'fanous', roof: 'crescent', window: 'crescent', desk: 'dates',
    music: 'chimes', gift: 'Iftar basket',
    lines: ['Ramadan Kareem!', 'The lanterns make the whole library glow.', 'Iftar is at sunset. I’m reading to make the time fly.', 'My family reads one story together every night.', 'Dates and cheese: the perfect sunset snack.', 'Shh… the evening stories are starting.', 'I’m giving away my old books to the young mice.', 'Suhoor snack, then chapter nine. Then sleep. Probably.', 'The moon looks lovely tonight, doesn’t it?'],
    books: [
      ['A Thousand and One Bedtime Stories', 'Shahrazad Squeakwell', 'A clever storyteller keeps everyone awake with one more story every night. Very bad for bedtimes.', '★★★★★ “Just one more. Just one more. Just one more…”'],
      ['The Lantern Keeper', 'Omar Oakwhisker', 'An old mouse lights every lantern in the village, one evening at a time.', '★★★★★ “Read it at sunset. Cried a little. In a good way.”'],
      ['Sunset Suppers', 'Grandma Mimsy', 'Warm soups, sweet dates and big pots for sharing with the whole street.', '★★★★☆ “Made the lentil soup. Made friends. Made more soup.”'],
    ],
  },
  {
    id: 'christmas', season: 3, name: 'Winter Festival', short: 'Christmas', icon: 'tree', token: { name: 'Presents', icon: 'present' },
    when: fixed(12, 10, 12, 27),
    blurb: 'Snow on the roof, a tree in the garden and a present under every shelf. The mice are knitting scarves for the books.',
    colors: ['#d9534f', '#3f9a5b', '#f2c14e', '#ffffff', '#6fa8dc'], glow: '#ffdca0',
    sky: { tint: [200, 220, 255, 0.05] }, particles: 'snow', hang: 'ornament', roof: 'star', window: 'wreath', desk: 'candle',
    music: 'bells', gift: 'Stocking',
    lines: ['Merry Christmas!', 'I asked for books. I got socks. Book-shaped socks.', 'Is that a present under the shelf?!', 'Hot cocoa and a ghost story. Perfection.', 'I’ve been extremely good this year. Mostly.', 'Who put tinsel on the librarian?', 'Snow day = book day!', 'I’m re-reading “The Night Before Cheesemas” for the 40th time.'],
    books: [
      ['The Night Before Cheesemas', 'Clement Clark Mouse', 'Not a creature was stirring. Except all of us, obviously. We are mice.', '★★★★★ “Read it every year. Still get excited at the sleigh bit.”'],
      ['A Christmas Carol-ine', 'Charles Squickens', 'A grumpy old mouse is visited by the Ghosts of Cheese Past, Present and Yet to Be Grated.', '★★★★★ “Bah! Humbug! …fine, it’s lovely.”'],
      ['How the Cat Stole Cheesemas', 'Dr. Squeuss', 'A grumpy cat steals every present. Her heart grows three sizes. She keeps the presents.', '★★★☆☆ “Clawdia wrote to complain about this one.”'],
    ],
  },
  {
    id: 'newyear', season: 3, name: 'New Year Lights', short: 'New Year', icon: 'firework', token: { name: 'Sparklers', icon: 'sparkler' },
    when: fixed(12, 30, 1, 3),
    blurb: 'Fireworks over the roof and a resolution on every bookmark: this is the year everyone finishes that one enormous novel.',
    colors: ['#f2c14e', '#e8e8f5', '#9ec5f0', '#d4b3f0', '#f28b82'], glow: '#fff0b0',
    sky: { tint: [120, 110, 200, 0.05] }, particles: 'fireworks', hang: 'star', roof: 'clock', window: 'lights', desk: 'confetti',
    music: 'bells', gift: 'Lucky envelope',
    lines: ['Happy New Year!', 'My resolution: finish “War and Cheese”. Again.', 'Last year I read 52 books. This year: 53!', '3… 2… 1… page turn!', 'I resolve to stop reading the last page first. Starting tomorrow.', 'The fireworks are shaped like books!'],
    books: [
      ['Resolutions I Actually Kept', 'Anonymous', 'A pamphlet. One page. Mostly blank.', '★★★★★ “Very achievable. Finished it.”'],
      ['Auld Lang Squeak', 'Robert Burrow', 'Should old acquaintance be forgot? Not if they still have your book.', '★★★★☆ “Nobody knows the second verse. Now I do.”'],
      ['Twelve Grapes, No Regrets', 'Lola Lunes', 'One grape for every chime. The author choked on grape seven and wrote a book about it.', '★★★★☆ “Tense final chapter.”'],
    ],
  },
  {
    id: 'halloween', season: 2, name: 'Spooky Stories Week', short: 'Halloween', icon: 'pumpkin', token: { name: 'Pumpkins', icon: 'pumpkin' },
    when: fixed(10, 20, 11, 1),
    blurb: 'Jack-o’-lanterns on the steps, bats in the rafters and ghost stories by candlelight. Baroness Clawdia says she is “just visiting”.',
    colors: ['#e8913a', '#6d3f8f', '#3a3440', '#9ccf5a', '#f2c14e'], glow: '#ffb060',
    sky: { tint: [120, 60, 140, 0.08] }, particles: 'bats', hang: 'bat', roof: 'pumpkin', window: 'cobweb', desk: 'pumpkin',
    music: 'spooky', gift: 'Treat bag',
    lines: ['BOO! …sorry. Shh. Boo.', 'I’m dressed as a book. A scary one: “Tax Law”.', 'Is that a ghost or a very pale reader?', 'The bats are borrowing books now?!', 'Trick or treat! Or a book. I’ll take a book.', 'This ghost story is SO scary. I’m reading it through my paws.', 'The cat is dressed as… a cat. Terrifying.'],
    books: [
      ['Frankenmouse', 'Mary Shelly-Squeak', 'A mad scientist builds a mouse out of spare mice. It just wants to join a book club.', '★★★★★ “It’s alive! And it has great taste in books.”'],
      ['The Legend of Squeaky Hollow', 'Washington Nibbling', 'A headless horsemouse terrorises the village. He has a head. It was in his bag the whole time.', '★★★★☆ “Spoiler: check the bag.”'],
      ['The Haunting of Hill Mouse', 'Shirley Jack-Mouse', 'Something walks in the library at night. It is the librarian, re-shelving. Still scary.', '★★★★★ “I will never shelve after midnight again.”'],
    ],
  },
  {
    id: 'valentine', name: 'Book Lovers’ Day', short: 'Valentine’s', icon: 'heart', token: { name: 'Love letters', icon: 'letter' },
    when: fixed(2, 8, 2, 15),
    blurb: 'Hearts on the windows, roses on the desk and a blind date with a book: wrapped in paper, you only see the first line.',
    colors: ['#f28b9b', '#e0405f', '#fff0f3', '#f7c9d6', '#d4b3f0'], glow: '#ffc0cf',
    sky: { tint: [255, 170, 200, 0.07] }, particles: 'hearts', hang: 'heart', roof: 'heart', window: 'hearts', desk: 'roses',
    music: 'chimes', gift: 'Love letter',
    lines: ['Happy Book Lovers’ Day!', 'I’m on a blind date with a book. It’s going great.', 'Roses are red, cheese is too, I read this whole book and it’s about you.', 'We met in the Mystery section. It was murder. Figuratively.', 'I love you more than my bookmark. And I LOVE my bookmark.', 'Our first date was reading in silence. Perfect.'],
    books: [
      ['Pride and Prejudice and Parmesan', 'Jane Austmouse', 'It is a truth universally acknowledged that a single mouse in possession of good cheese must be in want of a reader.', '★★★★★ “Mr. Darcheddar, you have bewitched me, body and cheese.”'],
      ['Romeo and Julie-Cheddar', 'William Shakesqueak', 'Two households, both alike in dignity, both extremely dramatic about cheese.', '★★★☆☆ “Just talk to each other!”'],
      ['Love in the Time of Cheddar', 'Gabriel García Mousequez', 'He waited fifty-one years, nine months and four days. The cheese aged beautifully.', '★★★★★ “Worth the wait. Like good cheddar.”'],
    ],
  },
  {
    id: 'bookweek', name: 'Book Week', short: 'Book Week', icon: 'books', token: { name: 'Bookmarks', icon: 'bookmark' },
    when: fixed(4, 19, 4, 26),
    blurb: 'World Book Week! Mice dress as their favourite characters, famous authors drop by, and everyone argues about endings.',
    colors: ['#4f7cac', '#e9b949', '#c0504d', '#6a9f58', '#9b6fb0'], glow: '#fff0c0',
    sky: {}, particles: 'pages', hang: 'bookmark', roof: 'book', window: 'bunting', desk: 'books',
    music: 'chimes', gift: 'Author’s goodie bag',
    lines: ['Happy Book Week!', 'I came dressed as “In Search of Lost Crumbs”. It’s a very long costume.', 'An author signed my paw!', 'Book swap! I traded a cookbook for a mystery. Now I’m hungry AND suspicious.', 'Let’s argue about endings! That’s the tradition, right?', 'I’m reading one book in every genre this week. Currently: Poetry. Help.'],
    books: [
      ['War and Cheese', 'Leo Tolsqueak', '1,400 pages. Contains war. Contains cheese. Mostly contains names ending in “-ovitch”.', '★★★★☆ “Finished it. Reader, I aged.”'],
      ['In Search of Lost Crumbs', 'Marcel Proustmouse', 'Seven volumes about remembering a biscuit. The biscuit is described for 300 pages.', '★★★★★ “Still on the biscuit.”'],
      ['Don Quixote and the Windmill of Cheese', 'Miguel de Cervantmouse', 'A knight attacks a windmill he believes is a giant. It is a giant cheese. He is right for once.', '★★★★☆ “Tilted at it. Ate it.”'],
    ],
  },
  {
    id: 'anniversary', name: 'Library Birthday', short: 'Anniversary', icon: 'cake', token: { name: 'Cake slices', icon: 'cake' },
    when: null, // yearly on the day your library opened (see festivalAt)
    blurb: 'Happy birthday, dear library! Another year of stories. Balloons on the roof, cake on every floor and presents for everyone who helped.',
    colors: ['#f28b82', '#ffd24a', '#a3d9a5', '#9ec5f0', '#d4b3f0'], glow: '#fff0c0',
    sky: {}, particles: 'confetti', hang: 'balloon', roof: 'cake', window: 'bunting', desk: 'cake',
    music: 'chimes', gift: 'Party bag',
    lines: ['Happy birthday, library!', 'A whole year?! Time flies when you’re reading.', 'I’ve been coming here since day one. Well, day two.', 'Cake AND books? Best day ever.', 'Grandma Mimsy would be so proud.', 'I got you a present: I returned all my overdue books!'],
    books: [
      ['Whiskerwood: A History (Vol. 1 of 1)', 'Pip', 'Everything that happened at the library this year, carefully written down by Pip. Includes 14 drawings of you.', '★★★★★ “Accurate. Pip drew my ears too big.”'],
      ['The Library That Grew', 'Grandma Mimsy', 'Once there was one tiny nook. Then there was more. Then there was much, much more.', '★★★★★ “I’m in it! Page 9!”'],
      ['Happy Birthday, Dear Library', 'The Readers', 'A card signed by every reader, bound into a book. It is very thick.', '★★★★★ “Found my paw print!”'],
    ],
  },
  {
    id: 'summer', season: 1, name: 'Summer Reading Festival', short: 'Summer', icon: 'sun', token: { name: 'Seashells', icon: 'shell' },
    when: fixed(7, 10, 8, 10),
    blurb: 'Long sunny days, paper lanterns at dusk, lemonade on the steps and a summer reading list as long as your tail.',
    colors: ['#ffd24a', '#ff8a5c', '#6fc6d9', '#a3d982', '#ffffff'], glow: '#fff3b0',
    sky: { tint: [255, 230, 150, 0.05] }, particles: 'fireflies', hang: 'paperlantern', roof: 'sun', window: 'bunting', desk: 'lemonade',
    music: 'chimes', gift: 'Picnic basket',
    lines: ['Summer reading list: 40 books. Progress: 1 page.', 'Too hot outside, perfect in here.', 'I brought my beach book. It has sand in it already.', 'Lemonade and a mystery. Summer sorted.', 'My sun hat doubles as a bookmark.', 'The fireflies are reading over my shoulder.'],
    books: [
      ['The Great Gatsbrie', 'F. Scott Fitzsqueak', 'Lavish parties, a green light across the pond and an alarming amount of brie.', '★★★★☆ “Old sport, the brie was the best part.”'],
      ['Moby-Dip', 'Herman Melmouse', 'A captain’s obsessive quest to find the deep end of the swimming pool.', '★★★☆☆ “600 pages about a pool. It’s a metaphor. For a pool.”'],
      ['Treasure Island (Sunscreen Edition)', 'Robert Louis Stevenmouse', 'The same classic, but everyone remembers to reapply.', '★★★★★ “Responsible pirates. Love it.”'],
    ],
  },
  {
    id: 'autumn', season: 2, name: 'Harvest Reading Festival', short: 'Harvest', icon: 'leaf', token: { name: 'Acorns', icon: 'acorn' },
    when: fixed(9, 20, 10, 19),
    blurb: 'Crunchy leaves, pumpkin soup, woolly scarves and the coziest reading nights of the year. Every mouse brings an acorn to the harvest table.',
    colors: ['#e8913a', '#d9632d', '#f2c14e', '#8a5a3a', '#b5523b'], glow: '#ffcf8a',
    sky: { tint: [255, 170, 90, 0.05] }, particles: 'leaves', hang: 'leaf', roof: 'acorn', window: 'garland', desk: 'soup',
    music: 'chimes', gift: 'Harvest basket',
    lines: ['Leaves falling, pages turning.', 'Pumpkin soup and a big fat novel. Heaven.', 'I brought an acorn for the harvest table!', 'Scarf season means reading season.', 'I’m re-reading “Great Expectations of Pumpkin Spice”.', 'The trees are the same colour as my favourite book!', 'Crunch. Crunch. Crunch. Sorry, it’s the leaves.'],
    books: [
      ['Great Expectations of Pumpkin Spice', 'Charles Squickens', 'Pip (a different Pip) expects great things from autumn. Autumn delivers soup.', '★★★★☆ “Our Pip says this is slander.”'],
      ['The Grapes of Harvest', 'John Steinmouse', 'A family travels west looking for the perfect orchard. Finds a very nice pear.', '★★★★☆ “The pear deserved its own book.”'],
      ['Leaves: A Falling Story', 'Autumn Oakley', 'A thriller told from the point of view of one brave leaf. It falls. Beautifully.', '★★★★★ “I screamed at page 1. It fell.”'],
    ],
  },
];

export const FESTIVAL = Object.fromEntries(FESTIVALS.map((f) => [f.id, f]));

// Festival running at `now` (earlier entries win clashes). `created` = when the save was made.
export function festivalAt(now, created = now) {
  for (const f of FESTIVALS) {
    if (f.id === 'anniversary') {
      if (now - created < 300 * DAY) continue;
      const c = new Date(created); const y = new Date(now).getFullYear();
      for (const yy of [y - 1, y]) {
        const a = md(yy, c.getMonth() + 1, c.getDate());
        if (now >= a && now < a + 3 * DAY) return { ...f, start: a, end: a + 3 * DAY, key: `${f.id}-${monthKey(a)}` };
      }
      continue;
    }
    const win = f.when?.(now);
    if (win) return { ...f, start: win[0], end: win[1], key: `${f.id}-${monthKey(win[0])}` };
  }
  return null;
}

// Festival quest: goals counted from the moment the festival started for this save.
export const FESTIVAL_QUEST = [
  { type: 'tokens', target: 25, text: (f) => `Collect 25 ${f.token.name.toLowerCase()}`, reward: { cheese: 10 } },
  { type: 'specials', target: 3, text: () => 'Greet 3 special guests', reward: { coinsSec: 600 } },
  { type: 'pets', target: 10, text: () => 'Pet 10 happy readers', reward: { cheese: 5 } },
  { type: 'upgrades', target: 40, text: () => 'Buy 40 upgrades', reward: { coinsSec: 900 } },
  { type: 'tokens', target: 60, text: (f) => `Collect 60 ${f.token.name.toLowerCase()}`, reward: { cheese: 20, fbook: true } },
];

// Festival books join the album and add a permanent bonus each.
export const FESTIVAL_BOOK_BONUS = 0.03;
export const FESTIVAL_BOOKS = FESTIVALS.flatMap((f) => f.books.map(([title, author, blurb, review], k) => ({
  id: `fest-${f.id}-${k}`, festival: f.id, title, author, blurb, review, rarity: ['R', 'E', 'L'][k], color: f.colors[k % f.colors.length], tokens: [20, 35, 55][k],
})));
