// Holidays and festivals follow the real calendar. While one is on, the library is decorated
// inside and out, the mice chat about it, the Shop sells a couple of festival specials and there
// is a small daily festival gift.
//
// Ramadan and Eid follow the moon, so their dates come from a table (moon sighting can shift
// them by a day, so the windows start a day early and run a little long).

const RAMADAN = { 2025: ['2025-02-28', '2025-03-29'], 2026: ['2026-02-17', '2026-03-19'], 2027: ['2027-02-07', '2027-03-09'], 2028: ['2028-01-27', '2028-02-25'], 2029: ['2029-01-15', '2029-02-13'], 2030: ['2030-01-05', '2030-02-03'], 2031: ['2030-12-25', '2031-01-23'] };
const EID_FITR = { 2025: '2025-03-30', 2026: '2026-03-20', 2027: '2027-03-10', 2028: '2028-02-26', 2029: '2029-02-14', 2030: '2030-02-04', 2031: '2031-01-24' };
const EID_ADHA = { 2025: '2025-06-06', 2026: '2026-05-27', 2027: '2027-05-16', 2028: '2028-05-05', 2029: '2029-04-24', 2030: '2030-04-13', 2031: '2031-04-02' };

const DAY = 86400000;
const at = (s) => new Date(s + 'T00:00:00').getTime();
const md = (y, m, d) => new Date(y, m - 1, d).getTime();

// A yearly window [m1/d1 .. m2/d2] (may wrap over New Year).
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

// In priority order (earlier wins when two overlap).
export const FESTIVALS = [
  {
    id: 'eid', name: 'Eid Mubarak', icon: '🌟', when: (now) => table(EID_FITR, 0, 3)(now) || table(EID_ADHA, 0, 3)(now),
    colors: ['#f2d27a', '#7cc4b0', '#e8a0bf', '#9ec5f0'], gift: { cheese: 5, coinsSec: 600 },
    lines: ['Eid Mubarak!', 'I got new shoes AND a new book!', 'Grandma gave me some coins. Straight to the book fund.', 'Sweets? For me? I’ll read you a story in exchange.', 'Everyone looks so smart today!', 'I visited six burrows before lunch.', 'Save me a biscuit! …what? I’m on page 12.'],
  },
  {
    id: 'ramadan', name: 'Ramadan Kareem', icon: '🌙', when: table(RAMADAN, 1, 0),
    colors: ['#f2c14e', '#e0914a', '#7c5cbf', '#3f7f6f'], gift: { cheese: 4, coinsSec: 600 }, evening: true,
    lines: ['Ramadan Kareem!', 'The lanterns make the whole library glow.', 'Iftar is at sunset. Reading makes the time fly.', 'My family reads one story together every night.', 'Dates and cheese: the perfect sunset snack.', 'I’m giving my old books to the young mice.', 'The moon looks lovely tonight, doesn’t it?'],
  },
  {
    id: 'christmas', name: 'Merry Christmas', icon: '🎄', when: fixed(12, 10, 12, 27),
    colors: ['#c0392b', '#2e8b57', '#f2c14e', '#ffffff'], gift: { cheese: 5, coinsSec: 600 },
    lines: ['Merry Christmas!', 'I asked for books. I got socks. Book-shaped socks.', 'Is that a present under the shelf?!', 'Hot cocoa and a ghost story. Perfect.', 'I’ve been extremely good this year. Mostly.', 'Who put tinsel on the librarian?', 'Re-reading “The Night Before Cheesemas” for the 40th time.'],
  },
  {
    id: 'newyear', name: 'Happy New Year', icon: '🎆', when: fixed(12, 30, 1, 3),
    colors: ['#f2d27a', '#9ec5f0', '#e8a0bf', '#ffffff'], gift: { cheese: 5, coinsSec: 600 },
    lines: ['Happy New Year!', 'My resolution: finish “War and Cheese”. Again.', 'Last year I read 52 books. This year: 53!', '3… 2… 1… page turn!', 'I resolve to stop reading the last page first. Starting tomorrow.'],
  },
  {
    id: 'halloween', name: 'Spooky Stories Week', icon: '🎃', when: fixed(10, 20, 11, 1),
    colors: ['#f28c28', '#6d3f8f', '#2b2320', '#b6e36a'], gift: { cheese: 4, coinsSec: 600 },
    lines: ['BOO! …sorry. Shh. Boo.', 'I’m dressed as a book. A scary one: “Tax Law”.', 'Is that a ghost or a very pale reader?', 'The bats are borrowing books now?!', 'Trick or treat! Or a book. I’ll take a book.', 'This ghost story is SO scary. I’m reading it through my paws.'],
  },
  {
    id: 'valentine', name: 'Book Lovers’ Day', icon: '💕', when: fixed(2, 8, 2, 15),
    colors: ['#e0405f', '#f7a8c4', '#ffffff', '#c0504d'], gift: { cheese: 4, coinsSec: 600 },
    lines: ['Happy Book Lovers’ Day!', 'I’m on a blind date with a book. It’s going great.', 'Roses are red, cheese is too, I read this whole book and thought of you.', 'We met in the Mystery section. It was murder. Figuratively.', 'I love you more than my bookmark. And I LOVE my bookmark.'],
  },
  {
    id: 'bookweek', name: 'Book Week', icon: '📚', when: fixed(4, 19, 4, 26),
    colors: ['#4f7cac', '#e9b949', '#c0504d', '#6a9f58'], gift: { cheese: 4, coinsSec: 600, book: true },
    lines: ['Happy Book Week!', 'I came dressed as “In Search of Lost Crumbs”. Long costume.', 'An author signed my paw!', 'Book swap! I traded a cookbook for a mystery. Now I’m hungry AND suspicious.', 'One book in every genre this week. Currently: Poetry. Help.'],
  },
  {
    id: 'anniversary', name: 'Library Birthday', icon: '🎂', when: null, // yearly on the day your library opened
    colors: ['#f28b82', '#ffd24a', '#a3d9a5', '#9ec5f0', '#d4b3f0'], gift: { cheese: 10, coinsSec: 900 },
    lines: ['Happy birthday, library!', 'A whole year?! Time flies when you’re reading.', 'I’ve been coming here since day one. Well, day two.', 'Cake AND books? Best day ever.', 'I returned all my overdue books as a present!'],
  },
  {
    id: 'summer', name: 'Summer Reading Festival', icon: '🌻', when: fixed(7, 10, 8, 10),
    colors: ['#ffd24a', '#ff8a5c', '#6fb3d6', '#a3d9a5'], gift: { cheese: 3, coinsSec: 600 },
    lines: ['Summer reading list: 40 books. Progress: 1 page.', 'Too hot outside, perfect in here.', 'I brought my beach book. It has sand in it already.', 'Lemonade and a mystery. Summer sorted.', 'The fireflies are reading over my shoulder.'],
  },
  {
    id: 'autumn', name: 'Harvest Festival', icon: '🍁', when: fixed(9, 20, 10, 19),
    colors: ['#d9632d', '#e8913a', '#f2c14e', '#8a5a3a'], gift: { cheese: 3, coinsSec: 600 },
    lines: ['Leaves falling, pages turning.', 'Pumpkin soup and a big fat novel. Heaven.', 'I brought an acorn for the harvest table!', 'Scarf season means reading season.', 'Re-reading “Great Expectations of Pumpkin Spice”.', 'Crunch. Crunch. Crunch. Sorry, it’s the leaves.'],
  },
];
export const FESTIVAL = Object.fromEntries(FESTIVALS.map((f) => [f.id, f]));

// The festival running at `now` (or null). `created` = when the library opened.
export function festivalAt(now, created = now) {
  for (const f of FESTIVALS) {
    if (f.id === 'anniversary') {
      if (now - created < 300 * DAY) continue;
      const c = new Date(created); const y = new Date(now).getFullYear();
      for (const yy of [y - 1, y]) {
        const a = md(yy, c.getMonth() + 1, c.getDate());
        if (now >= a && now < a + 3 * DAY) return { ...f, start: a, end: a + 3 * DAY };
      }
      continue;
    }
    const win = f.when?.(now);
    if (win) return { ...f, start: win[0], end: win[1] };
  }
  return null;
}
