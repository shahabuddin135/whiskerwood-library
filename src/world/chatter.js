// Speech bubbles: the mice chat about their books, the weather and whatever is going on.
import { L } from './layout.js';
import { rr } from './draw.js';

const FONT = '600 7.5px "Fredoka", "Baloo 2", system-ui, sans-serif';
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const GENERIC = [
  "Shh! I'm reading!", 'Just one more chapter…', 'I love the smell of old books!', 'Has anyone seen my glasses?',
  'This seat is sooo comfy.', 'Squeak! What a twist!', 'Page 42 already?', 'Best library in the meadow!', 'I could live here.',
  'Who nibbled this page corner?', "Crumbs! I'm late for tea.", 'Reading is my cheese.', 'Borrowing three today!',
  'Grandma Mimsy would be proud.', 'Psst… is there a sequel?', 'My tail is tingling — good book!', 'Pip recommended this one.',
  'I judge books by their cover. And their smell.', 'I bought a bookmark. Now I need 400 more books.', 'My to-read pile is taller than me.',
  'I only read the last page. Saves time.', 'This book has pictures! …Of other books.', 'I’m on chapter one. For the fourth time.',
  'The library card is the best card. Sorry, cheese card.', 'I came for one book. Leaving with nine.', 'Is it cheating to read the audiobook?',
  'I dog-ear pages. Please don’t tell Pip.', 'This book smells like vanilla and old secrets.', 'I’ve read this before. I don’t remember a thing. Perfect.',
];
// Book gossip, fake spoilers, strange reviews and terrible recommendations.
const BOOKISH = [
  'Spoiler: the cheese was inside them all along.', 'Spoiler: it was a dream. Also the dream was a book.', 'Spoiler: the mouse finds the crumb. It is a very good crumb.',
  'Spoiler: the villain is misunderstood. And also a cat.', 'Spoiler: everybody lives! Except the sandwich.',
  'Review: one star, the book was too heavy to read upside down.', 'Review: five stars, I used it as a pillow. Very supportive.',
  'Review: two stars. The dragon never apologised.', 'Review: “needs more cheese.” It was a cookbook about cheese.',
  'If you liked The Very Hungry Mouse, try The Moderately Peckish Mouse.', 'Loved Moby-Dip? The sequel, Moby-Dunk, is even soggier.',
  'Don’t read Twenty Thousand Squeaks in the bath. Trust me.', 'The Hound of the Basket-villes kept me up all night. I left the light on.',
  'Pride and Pre-Cheese: a mouse of good fortune must be in want of a cracker.', 'Great Expectheddars was… fine. I expected more cheese.',
  'War and Peas: 1,400 pages and only three peas. Misleading.', 'The Catcher in the Rye Bread. Very crusty narrator.',
  'Of Mice and Mice. Finally, some representation!', 'The Grapes of Brie-th. Surprisingly not a cookbook.',
  'Lord of the Rinds. The walking parts are long. So long.', 'Harry Potter and the Chamber of Cheddar is my comfort read.',
  'Romeo and Julienne: two carrots, one tragic salad.', 'Fifty Shades of Grey Mouse. It’s about fur colour. I think.',
  'Nineteen Eighty-Fourmage: Big Cheese is watching you.', 'The Hitchhiker’s Guide to the Pantry. Don’t panic. Bring a towel.',
];
// Two-line exchanges between readers (first speaker, reply).
const CONVOS = [
  ['Book or movie?', 'Book. The movie left out the snack scene.'], ['Have you read the ending?', 'Don’t you DARE.'],
  ['Is it good?', 'I cried four times. Two were about cheese.'], ['Can I borrow it after you?', 'Only if you promise not to dog-ear it.'],
  ['What are you reading?', 'A book about a mouse reading a book.'], ['Is that a first edition?', 'It’s a first nibble.'],
  ['Shh! I’m at the good part!', 'You said that three chapters ago.'], ['Who’s your favourite author?', 'Squeakspeare. Obviously.'],
  ['Does the dog die?', 'It’s a cat. And no. Sadly.'], ['This plot twist!', 'I saw it coming. I read the last page first.'],
  ['Should I read the sequel?', 'Read the prequel first. Then the sequel. Then cry.'], ['I finished the whole series!', 'There’s a spin-off. Sorry.'],
  ['Why is your book upside down?', 'The plot is very twisty.'], ['Which is better, poetry or prose?', 'Snacks.'],
];
// The occasional wink at the big finger in the sky.
const FOURTH_WALL = [
  'Does anyone else feel like we’re being watched… from above?', 'The giant finger is back!', 'I think we’re in some kind of game.',
  'Somebody keeps zooming in on me. I’m flattered.', 'Psst… tap the jar. You know you want to.', 'Hello, person outside the screen!',
];
// Readers react to what the librarian just did on their floor.
const REACT = {
  lvl: ['New books! They smell like fresh ink and ambition.', 'More books? I’ll never leave now.', 'The shelves are groaning with stories!'],
  seats: ['A new seat! Dibs!', 'Finally, somewhere to sit and read for nine hours.', 'Ooh, still warm from the factory.'],
  shelves: ['Another bookshelf! My heart!', 'So many spines. So little time.', 'I will read ALL of these. Eventually.'],
  staff: ['The librarian stamps so fast now!', 'Checkout in record time!', 'Was that a stamp or a blur?'],
  decor: ['Ooh, fancy!', 'This floor is getting so cosy.', 'Now THAT’S interior decorating.'],
  furniture: ['Is that new? It’s gorgeous!', 'The decorator has taste.', 'I want one for my burrow.'],
};
const GENRE = [
  ['Once upon a time…', 'I hope the princess finds her cheese!', 'Happily ever after!', 'Beware the big bad cat!', 'Why do fairy godmothers never do taxes?', 'Three wishes and she picks a pumpkin?!'],
  ['Look at the pictures!', 'Read it again! Again!', 'I can read the big words now!', 'The hungry mouse is so funny!', 'I read it 400 times. I still don’t know where the wild mice are.', 'Goodnight moon. Goodnight crumb. Goodnight… zzz.'],
  ['This tea is perfect.', 'Cheese scone recipe? Yes please!', 'Mind the crumbs on the pages!', 'Mmm, fresh from the oven.', 'Step one: buy cheese. Step two: eat cheese. Step three: see step one.', 'This recipe says “a pinch of salt”. How big is a pinch?'],
  ['Here be dragons…', "I'm sailing to Swiss Island!", 'Where is north again?', 'X marks the cheese!', 'I’ve been lost in this map for an hour. Worth it.', 'Adventure is out there! I’ll just finish my tea first.'],
  ['The butler did it!', 'A clue! A clue!', 'Something smells fishy…', 'I knew it was the cat!', 'Everyone’s a suspect. Even me. Especially me.', 'The detective is suspiciously good at crime.'],
  ['Roses are red, cheese is too…', 'Such lovely rhymes.', 'The greenhouse is so peaceful.', 'A haiku: squeak, squeak, squeak.', 'Shall I compare thee to a wedge of brie?', 'This poem doesn’t rhyme. Is it broken?'],
  ['Is the moon REALLY cheese?', 'I spotted a comet!', 'E equals mouse squared.', 'Stars are just far-away cheese.', 'Space is big. Really big. Bigger than the pantry.', 'Black holes: nature’s way of eating the last crumb.'],
  ['Careful, this tome is ancient!', 'Gloves on, please.', 'A royal seal!', 'This page is older than Grandma!', 'Ye olde spelling is so fancy. “Cheefe.”', 'This scroll is 900 years overdue. The fine is… a lot.'],
  ['La la la ♪', 'Such a lovely melody.', 'Encore! Encore!', 'Is that a harp?', 'Humming quietly. Very quietly. Library rules.', 'Symphony No. 5 in Brie Minor slaps.'],
  ['What a grand hall!', 'I feel like royalty.', 'Is the Golden Crumb real?', 'The statue winked at me!', 'This legend has seven sequels and a cookbook.', 'Every hero needs a library card.'],
];
const PIP_TIPS = [
  [(c) => c.bells < 10, 'Tap my desk to ring the bell! 🔔'],
  [(c) => c.seatsFull && c.canSeat, 'We need more seats!'],
  [(c) => c.night && !c.lamps, "It's dark — lamps would help!"],
  [(c) => c.jarFull, 'The coin jar is full!'],
  [(c) => !c.rug, 'A cosy rug would be nice…'],
  [() => true, 'Welcome, welcome!'],
  [() => true, 'Please return books on time!'],
  [() => true, 'Shelf 3 needs dusting…'],
  [() => true, 'Please do not lick the books.'],
  [() => true, 'Reminder: the bookworms are NOT staff.'],
  [() => true, 'Late fees are payable in cheese.'],
  [() => true, 'Whoever keeps shelving the cookbooks in Mysteries: I see you.'],
  [() => true, 'Library rule 1: whisper. Rule 2: no, really, whisper.'],
];

export class Chatter {
  constructor(world) {
    this.w = world;
    this.bubbles = [];
    this.next = 2.5;
  }

  say(i, v, text, life = 3.2) {
    this.bubbles = this.bubbles.filter((b) => b.v !== v);
    this.bubbles.push({ i, v, text, life, max: life });
    if (this.bubbles.length > 4) this.bubbles.shift();
  }

  // Two readers chat: one line, then a reply.
  convo(i) {
    const sim = this.w.sims[i];
    const vs = sim.visitors.filter((v) => !v.special && v.alpha > 0.8 && v.state !== 'request' && !this.bubbles.some((b) => b.v === v)).sort(() => Math.random() - 0.5);
    if (vs.length < 2) return false;
    const [a, b] = pick(CONVOS);
    this.say(i, vs[0], a, 3);
    setTimeout(() => { if (vs[1].alpha > 0.5) this.say(i, vs[1], b, 3.4); }, 1500);
    return true;
  }

  // A reader comments on something the librarian just did.
  react(i, kind) {
    const lines = REACT[kind];
    if (!lines || !this.w.isVisible(i) || performance.now() - (this.lastReact || 0) < 2500) return;
    const vs = this.w.sims[i].visitors.filter((v) => !v.special && v.alpha > 0.8 && v.state !== 'request');
    if (!vs.length) return;
    this.lastReact = performance.now();
    this.say(i, pick(vs), pick(lines), 2.6);
  }

  // Everyone on a floor shouts at once (cats!).
  shout(i, lines, n = 2) {
    const sim = this.w.sims[i];
    const vs = sim.visitors.filter((v) => !v.special && v.alpha > 0.6).sort(() => Math.random() - 0.5).slice(0, n);
    vs.forEach((v, k) => setTimeout(() => this.say(i, v, pick(lines), 2.4), k * 350));
  }

  context(i) {
    const w = this.w; const g = w.game; const r = g.s.rooms[i];
    const sim = w.sims[i];
    return {
      night: w.tod?.dark > 0.35, lamps: r.decor[1], rug: r.decor[0],
      seatsFull: sim.seatTaken.slice(0, r.seats).every(Boolean), canSeat: r.seats < 6,
      jarFull: g.jarFull, bells: g.s.stats.bellRings, rain: w.ambient?.weather.kind === 'rain', snow: w.ambient?.weather.kind === 'snow',
      season: w.season?.key, fair: !!w.events?.fair, story: g.storyHourLeft() > 0,
      cat: w.events?.cat?.i === i, worms: w.events?.worms?.i === i, fest: g.festival(),
    };
  }

  line(i) {
    const c = this.context(i);
    if (c.cat) return pick(['EEK! A CAT!', 'Hide the cheese!', "Don't look at her…", 'Somebody shoo her!']);
    if (c.worms) return pick(['Something is nibbling the shelves!', 'Bookworms! Ew!', 'My book has holes in it!']);
    const pool = [];
    const add = (arr, weight = 1) => { for (let k = 0; k < weight; k++) pool.push(...arr); };
    add(GENERIC);
    add(GENRE[i] || [], 2);
    add(BOOKISH, 1);
    if (Math.random() < 0.05) return pick(FOURTH_WALL);
    if (c.night && !c.lamps) add(["It's getting too dark to read…", 'Could we get some lamps?'], 2);
    if (c.night && c.lamps) add(['Cosy lamplight ♥', 'Reading by lamplight is the best.']);
    if (c.seatsFull && c.canSeat) add(['Every seat is taken!', 'Can we have more chairs?'], 2);
    if (c.rain) add(['Perfect reading weather.', 'Listen to that rain…', 'I forgot my umbrella!'], 2);
    if (c.snow) add(['Brrr! Glad it’s warm in here.', 'Snow day = book day!'], 2);
    if (c.season === 'autumn') add(['Leaves falling, pages turning.', 'Pumpkin season!']);
    if (c.season === 'spring') add(['Blossoms everywhere!', 'Spring cleaning my bookshelf.']);
    if (c.season === 'summer') add(['Too hot outside, lovely in here.', 'Summer reading list: done!']);
    if (c.season === 'winter') add(['Hot cocoa and a good book.', 'I made a snow-mouse!']);
    if (c.fair) add(['Book Fair! Hooray!', 'So many new books!', 'Get your signed copies!'], 3);
    if (c.fest) add(c.fest.lines, 3);
    if (c.story) add(['Story Hour is my favourite!', 'Shh, the story is starting!'], 2);
    if (c.jarFull) add(['The coin jar is overflowing!']);
    return pick(pool);
  }

  update(dt) {
    for (const b of this.bubbles) b.life -= dt;
    this.bubbles = this.bubbles.filter((b) => b.life > 0 && (b.v.lib || (b.v.state !== 'gone' && b.v.alpha > 0.2)));
    this.next -= dt;
    if (this.next > 0 || this.w.game.s.settings.chatter === false) return;
    this.next = rand(2.8, 5.5);
    const w = this.w;
    const floors = w.game.s.rooms.map((r, i) => (r.built && w.isVisible(i) ? i : -1)).filter((i) => i >= 0);
    if (!floors.length) return;
    const i = pick(floors);
    const sim = w.sims[i];
    if (Math.random() < 0.16) {
      const c = this.context(i);
      const tips = PIP_TIPS.filter(([cond]) => cond(c));
      this.say(i, { lib: true, x: L.librarianX, y: 152 }, tips[0] && Math.random() < 0.7 ? tips[0][1] : pick(tips)[1]);
      return;
    }
    if (Math.random() < 0.18 && this.convo(i)) return;
    const talkers = sim.visitors.filter((v) => !v.special && v.alpha > 0.8 && v.state !== 'request' && !this.bubbles.some((b) => b.v === v));
    if (!talkers.length) return;
    this.say(i, pick(talkers), this.line(i));
  }

  draw(ctx, i) {
    ctx.font = FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const placed = [];
    for (const b of this.bubbles) {
      if (b.i !== i) continue;
      const v = b.v;
      const lines = wrap(ctx, b.text, 104);
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 10;
      const h = lines.length * 9 + 6;
      const headY = v.lib ? v.y - 36 : v.state === 'read' ? v.y - 32 : v.y - 40;
      const x = Math.max(w / 2 + 3, Math.min(349 - w / 2, v.x));
      let y = headY - h / 2 - 5;
      // stack bubbles that would overlap
      for (let k = 0; k < 3; k++) {
        const hit = placed.find((p) => Math.abs(p.x - x) < (p.w + w) / 2 + 2 && Math.abs(p.y - y) < (p.h + h) / 2 + 2);
        if (!hit) break;
        y = hit.y - h - 3;
      }
      placed.push({ x, y, w, h });
      const age = b.max - b.life;
      const s = age < 0.15 ? 0.6 + (age / 0.15) * 0.4 : 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, b.life / 0.3);
      ctx.translate(x, y + h / 2); ctx.scale(s, s); ctx.translate(-x, -(y + h / 2));
      ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = v.lib ? '#7cc46b' : '#d9bb86'; ctx.lineWidth = 0.9;
      rr(ctx, x - w / 2, y, w, h, 5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(Math.max(x - w / 2 + 5, Math.min(x + w / 2 - 9, v.x - 3)), y + h - 0.5); ctx.lineTo(v.x, y + h + 5); ctx.lineTo(Math.max(x - w / 2 + 9, Math.min(x + w / 2 - 5, v.x + 3)), y + h - 0.5); ctx.fill();
      ctx.fillStyle = '#4a3121';
      lines.forEach((l, k) => ctx.fillText(l, x, y + 7.5 + k * 9));
      ctx.restore();
    }
  }
}

function wrap(ctx, text, max) {
  const words = text.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > max && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}
