// Holidays follow the real calendar, and every festival also comes round once per Mouse Year
// (see MOUSE_FESTIVALS). The seasonal festivals (Summer Reading, Harvest) only happen in the
// Mouse Calendar, so they never hide the other festivals for weeks. While a festival is on, the
// library is decorated inside and out, the mice chat about it, the Shop sells a couple of
// festival specials and there is a small daily festival gift.
//
// Ramadan and Eid follow the moon, so their dates come from a table (moon sighting can shift
// them by a day, so the windows start a day early and run a little long).

const RAMADAN = { 2025: ['2025-02-28', '2025-03-29'], 2026: ['2026-02-17', '2026-03-19'], 2027: ['2027-02-07', '2027-03-09'], 2028: ['2028-01-27', '2028-02-25'], 2029: ['2029-01-15', '2029-02-13'], 2030: ['2030-01-05', '2030-02-03'], 2031: ['2030-12-25', '2031-01-23'] };
const EID_FITR = { 2025: '2025-03-30', 2026: '2026-03-20', 2027: '2027-03-10', 2028: '2028-02-26', 2029: '2029-02-14', 2030: '2030-02-04', 2031: '2031-01-24' };
const EID_ADHA = { 2025: '2025-06-06', 2026: '2026-05-27', 2027: '2027-05-16', 2028: '2028-05-05', 2029: '2029-04-24', 2030: '2030-04-13', 2031: '2031-04-02' };

const LUNAR_NEW_YEAR = { 2026: '2026-02-17', 2027: '2027-02-06', 2028: '2028-01-26', 2029: '2029-02-13', 2030: '2030-02-03', 2031: '2031-01-23' };
const DIWALI = { 2026: '2026-11-08', 2027: '2027-10-29', 2028: '2028-10-17', 2029: '2029-11-05', 2030: '2030-10-26', 2031: '2031-11-14' };
const HANUKKAH = { 2026: ['2026-12-04', '2026-12-12'], 2027: ['2027-12-24', '2028-01-01'], 2028: ['2028-12-12', '2028-12-20'], 2029: ['2029-12-01', '2029-12-09'], 2030: ['2030-12-20', '2030-12-28'] };

const DAY = 86400000;

// Western Easter Sunday (anonymous Gregorian algorithm).
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day).getTime();
}
function aroundEaster(now) {
  const y = new Date(now).getFullYear();
  const e = easter(y);
  return now >= e - 3 * DAY && now < e + 2 * DAY ? [e - 3 * DAY, e + 2 * DAY] : null;
}
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
    id: 'lunar', name: 'Lunar New Year', icon: '🧧', when: table(LUNAR_NEW_YEAR, 1, 6),
    colors: ['#d62828', '#f2c14e', '#ff6b35', '#ffd24a'], gift: { cheese: 5, coinsSec: 600 },
    lines: ['Happy Lunar New Year!', 'Year of the Rat? We’ll take it as a compliment.', 'My red envelope had a cheese coupon in it!', 'Dumplings and a dragon story. Perfect.', 'The lion dance knocked over the poetry shelf!', 'Out with the old books… no wait, keep the old books.'],
  },
  {
    id: 'diwali', name: 'Diwali', icon: '🪔', when: table(DIWALI, 2, 2),
    colors: ['#ff9f1c', '#f2c14e', '#e0405f', '#9b5de5'], gift: { cheese: 5, coinsSec: 600 },
    lines: ['Happy Diwali!', 'Every window has a little lamp tonight.', 'Did you see the rangoli on the path? So pretty!', 'Sweets and stories — Diwali done right.', 'Light wins over dark, like every good ending.', 'I lit a diya by my favourite shelf.'],
  },
  {
    id: 'hanukkah', name: 'Happy Hanukkah', icon: '🕎', when: table(HANUKKAH, 0, 0),
    colors: ['#3a6ea5', '#ffffff', '#9ec5f0', '#f2d27a'], gift: { cheese: 5, coinsSec: 600 },
    lines: ['Happy Hanukkah!', 'Eight nights, eight books!', 'Latkes and a long novel. Bliss.', 'I spun the dreidel and won… a bookmark.', 'One more candle tonight!', 'The menorah makes the window glow.'],
  },
  {
    id: 'egghunt', name: 'Spring Egg Hunt', icon: '🥚', when: aroundEaster,
    colors: ['#f7a8c4', '#a3d9a5', '#9ec5f0', '#ffe066', '#d4b3f0'], gift: { cheese: 4, coinsSec: 600 },
    lines: ['I found an egg in the Mystery section!', 'This chocolate egg is melting onto my book…', 'Spring has sprung!', 'Somebody hid an egg inside “Moby-Cheese”.', 'The bunnies came to borrow picture books.'],
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
    id: 'summer', name: 'Summer Reading Festival', icon: '🌻', when: null, // Mouse Calendar only
    colors: ['#ffd24a', '#ff8a5c', '#6fb3d6', '#a3d9a5'], gift: { cheese: 3, coinsSec: 600 },
    lines: ['Summer reading list: 40 books. Progress: 1 page.', 'Too hot outside, perfect in here.', 'I brought my beach book. It has sand in it already.', 'Lemonade and a mystery. Summer sorted.', 'The fireflies are reading over my shoulder.'],
  },
  {
    id: 'autumn', name: 'Harvest Festival', icon: '🍁', when: null, // Mouse Calendar only
    colors: ['#d9632d', '#e8913a', '#f2c14e', '#8a5a3a'], gift: { cheese: 3, coinsSec: 600 },
    lines: ['Leaves falling, pages turning.', 'Pumpkin soup and a big fat novel. Heaven.', 'I brought an acorn for the harvest table!', 'Scarf season means reading season.', 'Re-reading “Great Expectations of Pumpkin Spice”.', 'Crunch. Crunch. Crunch. Sorry, it’s the leaves.'],
  },
];
export const FESTIVAL = Object.fromEntries(FESTIVALS.map((f) => [f.id, f]));

// Every festival also comes round once in each Mouse Year (see core/calendar.js), so players meet
// Ramadan, Diwali, Christmas and the rest as the seasons turn, without waiting for the real date.
// Positions are fractions of the Mouse Year; spring starts at 0 (summer 0.25, autumn 0.5, winter 0.75).
export const MOUSE_FESTIVALS = [
  { id: 'lunar', from: 0.0, to: 0.06 }, // every Mouse New Year is, of course, the Year of the Rat
  { id: 'egghunt', from: 0.08, to: 0.13 },
  { id: 'ramadan', from: 0.15, to: 0.22 },
  { id: 'eid', from: 0.22, to: 0.25 },
  { id: 'bookweek', from: 0.28, to: 0.33 },
  { id: 'summer', from: 0.38, to: 0.46 },
  { id: 'autumn', from: 0.52, to: 0.58 },
  { id: 'diwali', from: 0.6, to: 0.65 },
  { id: 'halloween', from: 0.68, to: 0.74 },
  { id: 'hanukkah', from: 0.77, to: 0.82 },
  { id: 'christmas', from: 0.84, to: 0.92 },
  { id: 'newyear', from: 0.94, to: 1.0 },
];

// Mouse-calendar festival for a calendar reading, with real-time start/end estimates.
export function mouseFestival(cal, now = Date.now()) {
  if (!cal) return null;
  const yearSec = cal.seasonSec * 4;
  const pos = (cal.idx + cal.progress) / 4;
  const slot = MOUSE_FESTIVALS.find((m) => pos >= m.from && pos < m.to);
  if (!slot) return null;
  return { ...FESTIVAL[slot.id], mouse: true, start: now - (pos - slot.from) * yearSec * 1000, end: now + (slot.to - pos) * yearSec * 1000 };
}

// The festival running at `now` (or null). `created` = when the library opened.
// Real-world dates come first; otherwise whatever the Mouse Calendar says.
export function festivalAt(now, created = now, cal = null) {
  return realFestival(now, created) || mouseFestival(cal, now);
}

function realFestival(now, created) {
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
