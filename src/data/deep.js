// The Deep Stacks: the forgotten library of the Hollow Kingdom, under the Cheese & Coin Vault.
// It is a maze of cells: the mole crew digs tunnels cell by cell, sideways and down, around solid
// bedrock. Some cells hold old library halls to restore, fossils, or treasure. At the very
// bottom, behind a great door, sleeps Umber the dragon with the Mighty Tales.
//
// Map legend:  E entrance · . soil · # bedrock · 1-8 library halls · F fossil · T treasure · D the hoard
export const DEEP_MAP = [
  'T..#E.F#T',
  '.#1..#...',
  '.###.#2#.',
  'F.3#...#F',
  '##.###4..',
  '5F..6###7',
  '8##DDD.T.',
];
export const DEEP_COLS = 9;
export const DEEP_ROWS = 7;
export const DEEP_TOP = 262; // world y of the top of row 0 (the garden ground is y = 0)
export const CELL_W = 150;
export const CELL_H = 132;
export const DEEP_X0 = 220 - CELL_W * 4.5; // the entrance column sits right under the library door
export const cellX = (c) => DEEP_X0 + c * CELL_W;
export const cellY = (r) => DEEP_TOP + r * CELL_H;
export const cellId = (c, r) => `${c},${r}`;
export const cellKind = (c, r) => DEEP_MAP[r]?.[c] ?? '#';
export const DEEP_BOTTOM = DEEP_TOP + DEEP_ROWS * CELL_H;

// Library halls, in the order the story usually finds them. Each needs three repairs.
// The Archivist's Study (8) has eight locks: it opens once the other seven halls are restored.
export const HALLS = {
  1: { name: 'The Root Cellar Reading Room', theme: 'roots', steps: ['Untangle the roots', 'Hang the lanterns', 'Dust off the armchairs'], blurb: 'Where the apprentices read, under the roots of the old oak.' },
  2: { name: 'The Scriptorium of Quills', theme: 'scriptorium', steps: ['Sweep out the cobwebs', 'Relight the candles', 'Mend the writing desks'], blurb: 'Forty writing desks, all facing the bottom of the Stacks.' },
  3: { name: 'The Clockwork Catalogue', theme: 'clockwork', steps: ['Oil the gears', 'Wind the great clock', 'Sort the card drawers'], blurb: 'A brass machine that once knew where every page was.' },
  4: { name: 'The Crystal Grotto', theme: 'crystal', steps: ['Shore up the ceiling', 'Polish the crystals', 'Shelve the star charts'], blurb: 'A reading cave lit by glowing crystal.' },
  5: { name: 'The Sunken Galleon', theme: 'galleon', steps: ['Pump out the water', 'Patch the hull', 'Dry out the ship’s logs'], blurb: 'Somebody built a whole ship down here. Nobody knows why.' },
  6: { name: 'The Hall of Echoes', theme: 'echoes', steps: ['Clear the rubble', 'Light the braziers', 'Rehang the tapestries'], blurb: 'Whisper a line of poetry and the hall recites it back.' },
  7: { name: 'The Lantern Stair', theme: 'stair', steps: ['Mend the broken steps', 'Light every lantern', 'Polish the brass rail'], blurb: 'A spiral stair that breathes warm air from somewhere far below.' },
  8: { name: 'The Archivist’s Study', theme: 'study', steps: ['Clear the study', 'Turn the eight keys', 'Open the last letter'], blurb: 'Thessaly Vane’s own study. Her glasses are still on the desk.' },
};
export const HALL_BONUS = 0.15; // +15% library income per restored hall
export const FOSSIL_BONUS = 0.05; // +5% per fossil found (and on show in the Museum)
export const TALES_MULT = 2; // the Mighty Tales doubles all income, forever

// Collectable fossils, in map order (top to bottom, left to right).
export const FOSSILS = [
  { id: 'ammonite', name: 'Giant Ammonite', icon: '🐚', desc: 'A stone spiral as big as a cartwheel. Older than cheese itself.' },
  { id: 'trike', name: 'Triceratops Skull', icon: '🦕', desc: 'Three horns, one frill and a very smug grin.' },
  { id: 'ptero', name: 'Pterodactyl', icon: '🦅', desc: 'Wings like leather umbrellas. Probably loud.' },
  { id: 'smilodon', name: 'Sabre-toothed Cat', icon: '🐈', desc: 'Baroness Clawdia’s great-great-(many more greats)-grandcat. Do not tell her.' },
];
// Which fossil is in which F cell (map order).
export const FOSSIL_AT = (() => {
  const out = {}; let k = 0;
  DEEP_MAP.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'F') out[cellId(c, r)] = FOSSILS[k++]?.id; }));
  return out;
})();

// Digging and repairs cost a few minutes of your steady income, and take longer the deeper you go.
export const digCostSec = (r) => 90 + 60 * r;
export const digTimeSec = (r) => 60 * (2 + 3 * r);
export const restoreCostSec = (r, step) => 240 + 120 * r + 60 * step;
export const restoreTimeSec = (r, step) => 60 * (3 + 4 * r + step);
export const CREW_CHEESE = 120; // a second mole crew (two jobs at once)

// Thessaly Vane's journal: the Chronicle of the Deep Stacks. Page 0 is under the trapdoor lid;
// each restored hall reveals the next page; the last page writes itself at the very end.
export const CHRONICLE = [
  {
    title: 'To whoever lifts this lid',
    text: `If you are reading this, the brass has finally rusted through, or someone has finally been curious enough to pry at it. Either way: welcome, and I am sorry.

Beneath your feet lie the Deep Stacks of the Hollow Kingdom: nine hundred rooms of shelves cut into the living rock, the greatest library mice ever made. We carved it over three hundred years. I sealed it in a single night.

I did not do it lightly. I did it because of a book.

At the very bottom of the Stacks there is a volume called the Mighty Tales. Nobody ever wrote it. It writes itself. Every story told aloud within earshot of a library appears in it, in a small, neat hand, the moment the teller falls quiet. For centuries we thought it a marvel: a memory for the whole kingdom.

We were wrong about what it was for. I learned that too late, and I will tell you how, if you keep digging.

Mind the third step down. It has never been right.`,
    sign: 'Thessaly Vane, Last Archivist',
  },
  {
    title: 'Corwin',
    text: `The Root Cellar was where the apprentices read. I was one of them once, forty years before I became Archivist. I sat under these same roots with my little brother Corwin, who could not sit still for a paragraph and could recite a whole ballad after hearing it once.

Corwin loved the Mighty Tales more than anyone. He used to sneak down to the bottom hall just to watch it write. “Thess,” he said, “it’s like the whole kingdom is talking in its sleep.”

He grew up to be a street singer, which our mother thought a tragedy and I thought inevitable. He sang in the markets about everything: the harvest, the weather, the King. Especially the King. The songs were funny and they were true, and that was the trouble.

I am writing his name here, in my own hand, in my own book, on purpose. Corwin Vane.

Remember that I did this. It will matter.`,
    sign: 'T.V.',
  },
  {
    title: 'The song nobody knew',
    text: `It began with a song nobody knew.

I was at the market, humming the Barley Ballad (Corwin’s song, the one the whole kingdom had sung at every harvest for ten years), and the baker looked at me as if I had sneezed a frog. “Never heard it,” she said. Not “forgotten it.” Never heard it.

Then it was the Flood of the Ninth Spring, which half the city had lived through. Then the Grain Riots. Then the names of the six councillors who had spoken against the King’s granaries. Gone. Not hidden. Gone, as if they had never happened, from every head in the kingdom but mine.

I went home and asked my mother about her son.

She smiled at me kindly, the way you smile at someone who is unwell, and said: “Thessaly, dear. You’re my only child.”`,
    sign: 'T.V.',
  },
  {
    title: 'The torn pages',
    text: `The Clockwork Catalogue lists every page of the Mighty Tales. I spent three nights inside it with a candle and a magnifying glass, and I found them: stubs. Thin torn edges, deep in the spine, where whole pages had been cut out.

The Barley Ballad. The Flood. The Riots. The Six. And one page near the end, whose card had once read: “The Street Singer of Lantern Row, as told by himself.”

So that is what the Mighty Tales is. It does not just remember. It is the remembering. Whatever is written in it, the kingdom knows. Tear a page out and the kingdom forgets: the tale, and the mouse in it.

Only one thing survives the knife: what is written somewhere else, by hand, by someone who loved it. That is why I still remember Corwin. I have kept a diary since I was six, and he is on nearly every page.

Only one other mouse holds a key to the bottom hall. King Aurelian the Gilded, who does not care for songs about his granaries.`,
    sign: 'T.V.',
  },
  {
    title: 'Terrible knees',
    text: `I told only one mouse what I had found: Captain Brannock of the Royal Guard, who carried me on his shoulders at my naming day and who, I was sure, loved the truth more than his post.

He listened to all of it. He looked at the torn stubs. He was quiet for a very long time.

“If you take that book,” he said at last, “the King will send me after you. And I will come, Thessaly. I swore an oath.”

“I know,” I said.

“Then take the lower road, past the grotto, and don’t stop at the bridge.” He put on his helmet. “I am very slow on bridges. Terrible knees.”

I have decided. Tomorrow, at the changing of the guard, I am going to steal the Mighty Tales.`,
    sign: 'T.V.',
  },
  {
    title: 'The bridge',
    text: `I ran with the Mighty Tales under my coat. It is heavier than any book has a right to be. I think it is heavy with everything it knows.

They caught me at the Chasm Bridge, as I knew they would: twelve guards with lanterns, and Brannock at the front with his sword drawn, looking at me across forty feet of rope and plank.

“Archivist Vane,” he said, loud enough for the King’s mice to hear. “Surrender the book.”

I did not. He started across. Slowly. So slowly. Terrible knees. Halfway over he stopped, looked down into the dark and said, loud again, for the others: “The planks are rotten. No one follows until I say.”

Then, quietly, only for me: “Run, Thess. I’ll tell them the dragon had you.”

He never spoke to me again. That winter the King stripped him of his rank for cowardice on the bridge. I have written his name here too, so that someone knows the truth. Captain Aldous Brannock was the bravest mouse I ever met.`,
    sign: 'T.V.',
  },
  {
    title: 'The keeper',
    text: `There is a dragon at the bottom of the Stacks. Everyone knew it and nobody had seen it, which is how most frightening things work.

I had nowhere else to go. So I went down into the warm dark, and I found him curled around the roots of the mountain: older than the kingdom, with one eye open, and the eye was the size of a cartwheel.

I expected to be eaten. By then, honestly, I don’t think I would have minded much.

Instead he said, in a voice like a landslide trying to be polite: “What is that you are holding so tightly?”

“A book,” I said.

“What is a book for?”

I had no clever answer. I was tired and cold and very frightened, and I said the first true thing I could think of: “It’s for reading to someone.”

He was quiet. Then: “No one has ever read to me.”

His name is Umber. We have an arrangement now.`,
    sign: 'T.V.',
  },
  {
    title: 'The arrangement',
    text: `The arrangement is this. Umber guards the lower Stacks. No soldier of the King’s gets past the Lantern Stair. The three who tried came back up very quickly, with their eyebrows missing and a new respect for literature.

And every night, I read to him.

I read him the Barley Ballad from my diary, and he laughed so hard the ceiling dropped gravel. I read him the Flood, and the Grain Riots, and the names of the Six. I read him Corwin, all of Corwin, every silly song. Umber asked for “the one about the King’s socks” four times.

Then I did what I had come down here to do. I took my pen and wrote the torn pages back into the Mighty Tales from my diary, one by one, in my own hand.

The next spring, far above us, a baker I have never met started humming the Barley Ballad and could not say where she had learned it.`,
    sign: 'T.V.',
  },
  {
    title: 'The last letter',
    text: `I am old now. Umber says I have been old for a while, and is too polite to say how long.

The kingdom above is gone. Not destroyed; it simply came apart, the way kingdoms do when their stories stop fitting together. The mice have moved up into the meadows. I think they are happier there. I can hear their songs through the roots.

Corwin is back in the Mighty Tales. So somewhere up there is a family called Vane that remembers him: his children, and theirs. One day one of them may find their way to this door. I have left them the key: a small brass key shaped like a quill. They will not know what it opens. “Keep a library,” I told them. “Keep it open.” That is all I ask.

I am going to seal the last door now, so that Umber can sleep without soldiers poking at him.

Whoever you are: please go down and read to him. He will pretend he isn’t lonely. He is.`,
    sign: 'T.',
  },
  {
    title: 'The rest is yours to write',
    dynamic: true, // written from your own library's story (see game.chroniclePage)
    sign: 'The Mighty Tales',
  },
];
