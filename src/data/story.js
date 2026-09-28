import { locationInfo } from './locations.js';

// The story of Whiskerwood Library, told in short chapters as the library grows.
// Each chapter plays once. `when` chapters trigger automatically; the rest are played by events.
export const CHARACTERS = {
  pip: { name: 'Pip', role: 'Apprentice Librarian', bg: '#bfe3f2', look: { fur: '#c9b29b', belly: '#f4e9dc', hat: 'cap', hatCol: '#4f7cac', scarf: '#e9b949' } },
  mimsy: { name: 'Grandma Mimsy', role: 'Founder of the library', bg: '#f3d9f0', look: { fur: '#ebe5dc', belly: '#fffaf3', glasses: true, scarf: '#9b6fb0', hat: 'bow', hatCol: '#c9a8f0' } },
  mayor: { name: 'Mayor Gruyère', role: 'Mayor of the Meadow', bg: '#f7e2b5', look: { fur: '#a98467', belly: '#ecd9c6', hat: 'tophat', scarf: '#c0504d', monocle: true } },
  chef: { name: 'Chef Gustavo', role: 'Tea & Crumbs Café', bg: '#f6d2c6', look: { fur: '#c9b29b', belly: '#f4e9dc', hat: 'chef', scarf: '#c0504d' } },
  clawdia: { name: 'Baroness Clawdia', role: 'A very large cat', bg: '#d9cdea', cat: true },
  rattigan: { name: 'Sneaky Rattigan', role: 'Coin thief', bg: '#cfd6dd', look: { fur: '#6f6560', belly: '#c9beb6', hat: 'bandit' } },
  fromage: { name: 'Monsieur Fromage', role: 'Book critic', bg: '#e9e1c9', look: { fur: '#b8aca1', belly: '#efe6dc', hat: 'beret', hatCol: '#1f1f2e', monocle: true, scarf: '#7a2f3a' } },
  queen: { name: 'Queen Mozzarella', role: 'Queen of the Meadow', bg: '#f1dcf5', look: { fur: '#efe9df', belly: '#fffbf4', crown: true, cape: '#7b2d8b' } },
  reader: { name: 'A Reader', role: 'Extremely upset', bg: '#e9e1c9', look: { fur: '#c9b29b', belly: '#f4e9dc', scarf: '#6a9f58', glasses: true } },
  // location hosts & shopkeepers
  bramble: { name: 'Mrs. Bramble', role: 'Shopkeeper, Meadow Burrow', bg: '#e3f0d0', look: { fur: '#b08968', belly: '#eedfcf', glasses: true, scarf: '#6a9f58', apron: '#e8d6b0', hat: 'flower', hatCol: '#f7a8c4' } },
  barnacle: { name: 'Captain Barnacle', role: 'Keeper of Lighthouse Cove', bg: '#d4ecf5', look: { fur: '#8f7f73', belly: '#d9cdc2', hat: 'captain', scarf: '#d9534f', vest: '#2f4a6b' } },
  delvina: { name: 'Madame Delvina Mole', role: 'Head Archivist, Glimmerdeep', bg: '#ddd6f3', look: { mole: true, fur: '#4f4a5e', belly: '#8a8499', scarf: '#6fe0d0', shades: true } },
  ada: { name: 'Ada Sprocket', role: 'Inventor, Gearhaven', bg: '#f3e2c4', look: { fur: '#d6b98c', belly: '#f7ead3', hat: 'goggles', scarf: '#b07a2e', vest: '#3f7f6f' } },
  crumbsworth: { name: 'Sir Crumbsworth', role: 'Royal Quartermaster', bg: '#e8dcf3', look: { fur: '#9a8b7e', belly: '#ddd2c6', hat: 'knight', scarf: '#6d5fa3', monocle: true } },
  aurora: { name: 'Aurora Featherfoot', role: 'Sky Captain, Nimbus Isle', bg: '#dcecfb', look: { fur: '#efe7dc', belly: '#fffaf2', hat: 'aviator', scarf: '#f2d27a' } },
  // the regulars
  barnaby: { name: 'Barnaby Bluffington', role: 'Has read everything (allegedly)', bg: '#efe0cc', look: { fur: '#a98467', belly: '#ecd9c6', vest: '#7a5a42', monocle: true, scarf: '#4f7cac' } },
  squeaky: { name: 'Squeaky Spoilsworth', role: 'Cannot keep a secret', bg: '#fbe7c6', look: { fur: '#d6b98c', belly: '#f7ead3', hat: 'cap', hatCol: '#e0405f', scarf: '#ffd24a' } },
  doris: { name: 'Doris Dogear', role: 'Folds every page', bg: '#efdcf3', look: { fur: '#e9e2d8', belly: '#fffaf3', glasses: true, hat: 'bow', hatCol: '#9b6fb0', vest: '#c0504d' } },
  filmore: { name: 'Filmore Reel', role: 'Prefers the movie', bg: '#dcdce8', look: { fur: '#6f6560', belly: '#c9beb6', shades: true, hat: 'beret', hatCol: '#1f1f2e', scarf: '#e0405f' } },
  footnote: { name: 'Professor Footnote', role: 'Technically correct', bg: '#e2e6ea', look: { fur: '#9aa0a6', belly: '#e3e6e8', glasses: true, hat: 'mortar', scarf: '#7a2f3a' } },
  granny: { name: 'Granny Crumbcake', role: 'Book club president', bg: '#f6e0d2', look: { fur: '#ebe5dc', belly: '#fffaf3', glasses: true, hat: 'bobble', hatCol: '#9b6fb0', scarf: '#f2a65a' } },
  tomasina: { name: 'Tomasina Tome', role: 'Reads the ending first', bg: '#d8efe6', look: { fur: '#c9b29b', belly: '#f4e9dc', hat: 'flower', hatCol: '#f4a3b5', scarf: '#3f7f6f' } },
};

const built = (i) => (s) => s.rooms[i]?.built;
const at = (id) => (s) => locationInfo(s.branch || 0).id === id && s.stats.prestiges > 0;

export const STORY = [
  { id: 'intro', when: () => true, lines: [
    ['mimsy', "Dear little one, I've left you my tiny library in the old meadow. It's only one cosy nook for now…"],
    ['mimsy', '…but every mouse who reads here drops a coin in the jar. Add armchairs, fill the shelves, build new floors!'],
    ['pip', "Hi! I'm Pip, your apprentice. I'll help you run things. Let's open the doors!"],
  ] },
  { id: 'firstBook', when: (s, h) => h.books >= 1, lines: [
    ['pip', 'Look — a brand-new book for our album! Every ×2 milestone brings its floor another book.'],
    ['pip', "And every book makes that floor earn more. Collect all five for a double bonus!"],
  ] },
  { id: 'floor1', when: built(1), lines: [
    ['mayor', 'Splendid, splendid! A second floor! The whole meadow is squeaking about your library.'],
    ['pip', 'The Mayor himself! Special guests will visit now — tap them when they glow gold!'],
  ] },
  { id: 'firstGuest', when: (s) => s.stats.specials >= 1, lines: [
    ['pip', 'A real celebrity! Guests boost a floor while they stay, so always say hello.'],
  ] },
  { id: 'floor2', when: built(2), lines: [
    ['chef', 'Bonjour! Tea and crumbs for every reader! A full tummy makes a happy reader, non?'],
    ['pip', 'Mmm… I smell cheese scones. Readers here sometimes ask for help finding books — tap their ❓ bubbles!'],
  ] },
  { id: 'catIntro', lines: [
    ['pip', "EEEK! That's Baroness Clawdia, the biggest cat in the meadow!"],
    ['clawdia', 'Mrrrow… what a delicious little library. It would make a lovely… snack bar.'],
    ['pip', "Quick — tap her again and again to shoo her away! No mouse will read while she's watching."],
  ] },
  { id: 'wormIntro', lines: [
    ['pip', 'Bookworms are nibbling our shelves! Squish every one before they chew up the stories!'],
  ] },
  { id: 'thiefIntro', lines: [
    ['rattigan', 'Heh heh… so many shiny coins in that jar…'],
    ['pip', "Sneaky Rattigan! He's running for the coin jar — tap him before he gets there!"],
  ] },
  { id: 'criticIntro', lines: [
    ['fromage', 'I am Monsieur Fromage. I have reviewed every library from here to the Big Cheese. Impress me.'],
    ['pip', 'Critics love cosy floors — seats, shelves, lamps and décor all count!'],
  ] },
  { id: 'floor3', when: built(3), lines: [
    ['pip', 'Look what I found tucked inside an old atlas… a letter from Grandma Mimsy!'],
    ['mimsy', 'Long ago this library kept the Golden Crumb of Destiny. Legend says it glows again when the library is complete.'],
  ] },
  { id: 'floor4', when: built(4), lines: [
    ['pip', 'There was a note pinned to the attic door…'],
    ['clawdia', '“This library will be MINE. Every mouse, every book, every crumb. — C.”'],
    ['pip', "We won't let her! We'll just keep growing."],
  ] },
  { id: 'floor5', when: built(5), lines: [
    ['mimsy', 'My dear, the greenhouse was always my favourite. You’re ready for something bigger.'],
    ['mimsy', 'Mice everywhere need libraries. Open the Map: a whole world of new places is waiting — a lighthouse, secret caverns, a city of gears, a castle, even a library in the clouds.'],
    ['mimsy', 'The floors start fresh, but everything that matters comes with you: your books, your furniture, your friends, your cheese — and Golden Quills that make every library stronger.'],
    ['pip', 'I’ll start packing the moving van!'],
  ] },
  { id: 'branch1', when: (s) => s.stats.prestiges >= 1, lines: [
    ['pip', 'We made it! And everything came with us — the books, the furniture, the regulars. Even Doris. Especially Doris.'],
    ['mimsy', 'Every library you open spreads stories further. I’m so proud of you.'],
  ] },
  { id: 'arrive-cove', when: at('cove'), lines: [
    ['barnacle', 'Ahoy, librarian! Welcome to Lighthouse Cove. The lighthouse was lonely, so we filled it with books.'],
    ['barnacle', 'Bottles wash up on the beach with every tide. Some hold letters, some hold treasure, and one held a very confused crab.'],
    ['pip', 'Portholes! Rope! Everything smells a bit of fish! I love it!'],
  ] },
  { id: 'arrive-caverns', when: at('caverns'), lines: [
    ['delvina', 'Who’s there? Ah… I smell a librarian. Welcome to the Glimmerdeep.'],
    ['delvina', 'Nobody knows who built this library. The shelves were already full when my grandmother found it.'],
    ['delvina', 'Harvest the glowcaps on the shelves before they fade. They light the way — and they pay very nicely.'],
    ['pip', 'It’s so… sparkly. Grandma Mimsy never mentioned THIS.'],
  ] },
  { id: 'arrive-clockwork', when: at('clockwork'), lines: [
    ['ada', 'The famous librarian! Mind the gears. And the steam. And that pipe. It bites.'],
    ['ada', 'Our book tubes deliver a novel anywhere in Gearhaven in four seconds. Snatch a capsule as it whooshes past!'],
    ['pip', 'Everything ticks here. I think my whiskers are ticking.'],
  ] },
  { id: 'arrive-castle', when: at('castle'), lines: [
    ['queen', 'Welcome to Moonlit Castle. The Moonlit Stacks have waited four hundred years for a proper librarian.'],
    ['queen', 'You may meet Sir Reginald on the battlements. He is a dragon. He is very small. He snores books.'],
    ['pip', 'A dragon who snores BOOKS? Best. Location. Ever.'],
  ] },
  { id: 'arrive-sky', when: at('sky'), lines: [
    ['aurora', 'Welcome aboard Nimbus Isle! Highest library in the world. Lowest fence.'],
    ['aurora', 'Keep an eye on the sky: when the cloud whale drifts by, tap her spout. She loves to share.'],
    ['pip', 'I can see the meadow from here! Hi, Grandma!'],
    ['mimsy', '(very, very far below) Hello, dear! Don’t lean over!'],
  ] },
  { id: 'arrive-home', when: (s) => s.branch >= 6 && locationInfo(s.branch).id === 'meadow', lines: [
    ['mimsy', 'You travelled the whole world… and came home. The meadow missed you, dear.'],
    ['pip', 'And look what we brought back: a lighthouse’s worth of stories, a dragon’s bookmark and a cloud in a bottle!'],
  ] },
  { id: 'floor6', when: built(6), lines: [
    ['pip', 'From the observatory we can see the whole meadow… and a big fluffy shape lurking by the pond.'],
    ['clawdia', 'Enjoy your stars, little mice. I’m watching.'],
  ] },
  { id: 'floor7', when: built(7), lines: [
    ['queen', 'By royal decree, this library is hereby granted a Royal Charter!'],
    ['pip', 'The Queen! Royal guests will visit far more often now.'],
  ] },
  { id: 'floor8', when: built(8), lines: [
    ['pip', 'Listen… the music hall’s very first concert! Even the pigeons are dancing.'],
  ] },
  { id: 'floor9', when: built(9), lines: [
    ['pip', 'The Grand Atrium… and the Golden Crumb is glowing, just like Grandma said!'],
    ['clawdia', '…I, erm. I only ever wanted someone to read me a story.'],
    ['pip', "Then come in, Baroness! There's a big comfy cushion with your name on it."],
    ['mimsy', 'And that, my dear, is what libraries are for. Happily ever after — for now.'],
  ] },
];
