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
};

const built = (i) => (s) => s.rooms[i]?.built;

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
    ['mimsy', 'Mice everywhere need libraries. Open a new branch: you start fresh, but keep your books and earn Golden Quills that make every future library stronger.'],
    ['pip', 'The Branch button 🌿 is ready whenever you are!'],
  ] },
  { id: 'branch1', when: (s) => s.stats.prestiges >= 1, lines: [
    ['pip', 'A whole new library! And look — the Golden Quills make everything faster!'],
    ['mimsy', 'Every branch you open spreads stories further. I’m so proud of you.'],
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
