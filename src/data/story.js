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
  digby: { name: 'Digby Loam', role: 'Foreman, Mole Diggers’ Guild', bg: '#dccaa6', mole: true },
  burrow: { name: 'Mrs Burrow', role: 'Pie-maker, Mole City', bg: '#f6d2c6', mole: true, look: { fur: '#6b5a52', helmet: false, hat: 'bow', hatCol: '#e0404f', apron: '#fff3dc' } },
  hazel: { name: 'Hazel Pouchley', role: 'Hamster travel writer', bg: '#f7e2b5', hamster: true, look: { scarf: '#4f7cac', hat: 'beret', hatCol: '#b5523b' } },
  umber: { name: 'Umber', role: 'Keeper of the Deep Stacks', bg: '#f0c9a0', dragon: true },
  inky: { name: 'Inky Quillsworth', role: 'Printer, The Inky Paw', bg: '#dfe3ea', look: { fur: '#b8aca1', belly: '#efe6dc', hat: 'cap', hatCol: '#3a3440', apron: '#3a3440', glasses: true } },
  marrowby: { name: 'Professor Marrowby', role: 'Curator, Bone & Bauble Museum', bg: '#efe2c4', look: { fur: '#e8e1d8', belly: '#fffaf3', monocle: true, scarf: '#6b4d37', hat: 'deerstalker', hatCol: '#8a6a3a' } },
  brioche: { name: 'Madame Brioche', role: 'The Windmill Bakery', bg: '#fbe3d0', look: { fur: '#f0dcc0', belly: '#fff6e8', hat: 'chef', scarf: '#f28b82' } },
  thessaly: { name: 'Thessaly Vane', role: 'Last Archivist (in brown ink)', bg: '#efe2c4', look: { fur: '#d9d0c4', belly: '#f6efe4', glasses: true, scarf: '#5b3f8c', hat: 'bow', hatCol: '#7a5a42' } },
};

const built = (i) => (s) => s.rooms[i]?.built;
const wingAt = (id, lvl) => (s) => (s.wings?.[id]?.built && (s.wings[id].lvl || 0) >= lvl);
const halls = (n) => (s) => Object.values(s.deep?.halls || {}).filter((v) => v >= 3).length >= n;
const shops = (n) => (s) => Object.values(s.deep?.biz || {}).filter((b) => b.built).length >= n;

export const STORY = [
  { id: 'intro', when: () => true, lines: [
    ['pip', "Oh! You must be Grandma Mimsy's grandchild! I'm Pip, her apprentice. She said you'd come."],
    ['pip', "It's only one cosy nook for now, and it's been asleep for ever so long… but look, a reader's already at the door!"],
    ['pip', 'Every mouse who reads here drops a coin in our jar. Add armchairs, fill the shelves, build new floors. Let’s light the lamp!'],
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
  { id: 'siteFull', when: (s) => s.flags?.siteFull, lines: [
    ['pip', 'Uh-oh. The builders say this cottage can’t hold a single floor more. The chimney is already wobbling.'],
    ['mayor', 'Then think bigger, my dear! There is land for sale up at Windmill Hill. Room for more floors AND another wing.'],
    ['pip', 'We buy the land, the movers get it ready, and the WHOLE library comes along: every floor, every book, every armchair.'],
    ['mayor', 'Only the coins for the land are gone. And a bigger library means a bigger branch bonus. Tap 🚚 Move when you’re ready!'],
  ] },
  { id: 'branch1', when: (s) => s.stats.prestiges >= 1, lines: [
    ['pip', 'We moved! Look: every floor, every shelf, every sleepy reader. Nothing even fell off a shelf!'],
    ['mimsy', 'Of course not, dear. Libraries are sturdier than they look. So are librarians.'],
    ['pip', 'And there’s room for more floors, plus a new plot beside us for another wing!'],
  ] },
  { id: 'wing1', when: (s) => Object.values(s.wings || {}).some((w) => w.built), lines: [
    ['chef', 'Bonjour! A real café next door, at last! No more balancing teacups on the Atlas of Everywhere.'],
    ['pip', 'Every wing level makes the WHOLE library earn more. And when a tray of scones is ready, tap the café!'],
  ] },
  { id: 'hallOpen', when: wingAt('hall', 1), lines: [
    ['mayor', 'Ahem! As Mayor, it is my great honour to open the Whiskerwood Community Hall with a short speech.'],
    ['mayor', 'Chapter One: A History of Halls. It all began in the year of the Big Cheese…'],
    ['pip', '(whispering) Every evening there’s a club night: book club, choir, chess, dancing… Tap the hall when it’s ready. The whole library earns more while it’s on.'],
    ['mayor', '…Chapter Fourteen: Halls in the Modern Age. Are you all still listening? Splendid!'],
  ] },
  { id: 'cafe10', when: wingAt('cafe', 10), lines: [
    ['brioche', 'Bonjour, little café. I am Madame Brioche, of the Windmill Bakery. I have come to challenge your scones.'],
    ['chef', 'A Scone-Off? In MY kitchen? Very well! Monsieur Fromage shall judge.'],
    ['fromage', 'I have tasted both. The first was flaky and proud. The second, bold and buttery.'],
    ['fromage', 'The winner is… I must taste them again. Several times. For science.'],
    ['pip', 'He ate every scone in the building. The Great Scone-Off is officially a draw.'],
    ['brioche', 'A draw! Then we shall bake together. Tuesdays. Bring jam.'],
  ] },
  { id: 'hall10', when: wingAt('hall', 10), lines: [
    ['pip', 'There’s been an… incident at the Knitting Circle.'],
    ['clawdia', 'I only came in for the yarn. Nobody told me the balls of yarn were for KNITTING.'],
    ['pip', 'Baroness Clawdia has joined the Knitting Circle. She has knitted forty-one scarves. All of them for herself.'],
    ['clawdia', 'Forty-two. This one says “PURRFECT”. I am told that is a pun. I am told it is not a good one.'],
  ] },
  { id: 'pressOpen', when: wingAt('press', 1), lines: [
    ['inky', 'Inky Quillsworth, printer! Mind your paws, everything in here is wet.'],
    ['inky', 'Every print run makes a brand-new book for your album. And every morning: the Whiskerwood Gazette!'],
    ['pip', 'The first headline says “LIBARY OPENS NEW WING”.'],
    ['inky', '…We shall call that a collector’s edition.'],
  ] },
  { id: 'cafe30', when: wingAt('cafe', 30), lines: [
    ['queen', 'We have heard there is an upstairs tea room. We should like high tea. With the small sandwiches.'],
    ['chef', 'Your Majesty! The cucumber sandwiches are cut into perfect triangles, the crusts removed by hand—'],
    ['queen', 'We shall have the crusts, actually. The crusts are the best part. Tell no one.'],
  ] },
  { id: 'museumOpen', when: wingAt('museum', 1), lines: [
    ['marrowby', 'Professor Marrowby, curator. Welcome to the Bone & Bauble! Please do not lick the exhibits. Yes, even the cheese-coloured ones.'],
    ['marrowby', 'Every fossil your moles dig up goes on show here. The public adores a good bone.'],
    ['pip', 'There’s a school trip every few minutes, and the guard is… asleep. Already.'],
    ['marrowby', 'He is conserving his energy. For emergencies. Such as lunch.'],
  ] },
  { id: 'museumCat', when: (s) => s.wings?.museum?.built && s.deep?.fossils?.smilodon, lines: [
    ['clawdia', 'Is that… is that a sabre-toothed CAT? Great-great-great-grandmama?!'],
    ['marrowby', 'Madam, please step away from the glass. And please stop purring at it.'],
    ['clawdia', 'She has my cheekbones.'],
  ] },
  { id: 'press10', when: wingAt('press', 10), lines: [
    ['inky', 'Disaster! We printed the Queen’s royal portrait upside down. Ten thousand copies!'],
    ['queen', 'We have seen it. We look magnificent. At last, a new perspective.'],
    ['queen', 'Print ten thousand more. Upside down. It is now the law.'],
  ] },
  { id: 'museum10', when: wingAt('museum', 10), lines: [
    ['pip', 'The night guard says the Triceratops winked at him.'],
    ['marrowby', 'Nonsense. Fossils do not wink.'],
    ['marrowby', '…Although the Pterodactyl has been quietly rearranging its own placard. It now reads “Pterodactyl (handsome)”.'],
  ] },
  { id: 'hall30', when: wingAt('hall', 30), lines: [
    ['pip', 'I… I’ve been asked to sing a solo at Choir Night.'],
    ['mimsy', 'Then sing it, dear. Loudly and a little wrong. That’s how all the best songs start.'],
    ['pip', 'Mi-mi-MIIII— oh no, a teacup broke.'],
    ['mimsy', 'Encore!'],
  ] },
  { id: 'floor5', when: built(5), lines: [
    ['mimsy', 'My dear, the greenhouse was always my favourite. Every plant in here grew from a seed someone left inside a book.'],
    ['pip', 'We moved the whole library, Grandma, and not one pot fell over!'],
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

  /* ---------------- The Deep Stacks ---------------- */
  { id: 'deep0', when: (s) => s.deep?.open, lines: [
    ['digby', 'Beg pardon, boss. Digby Loam, Mole Diggers’ Guild. Your vault floor has been going “thump-hollow” under my shovel all week.'],
    ['pip', 'Hollow? It’s a vault. It’s supposed to be full of coins, not… hollow.'],
    ['digby', 'Coins on top, aye. Underneath there’s a trapdoor. Brass. Very old. With a crest on it: a key crossed with a quill.'],
    ['pip', 'That’s the crest on Grandma Mimsy’s spectacles case!'],
    ['digby', 'Then it’s yours to open. My crew will dig wherever you point, sideways or down, around the bedrock. It costs coin and time, and the deeper we go, the more of both.'],
    ['pip', 'There’s a page tucked under the lid. The ink has gone brown. It’s signed “Thessaly Vane, Last Archivist”…'],
    ['pip', 'I’ll keep every page we find in the Chronicle. Scroll down below the vault and tap a glowing spot to start digging!'],
  ] },
  { id: 'deep1', when: halls(1), lines: [
    ['pip', 'Our first hall, good as new! These armchairs are older than the meadow.'],
    ['digby', 'Roots got in through the ceiling. Your readers don’t mind. One’s using a root as a footrest.'],
    ['pip', 'Every hall we restore makes the whole library earn more. And there’s another page, tucked in the catalogue box.'],
  ] },
  { id: 'mole0', when: (s) => halls(1)(s) && s.story.seen.includes('deep1') && Object.keys(s.deep?.dug || {}).length >= 8, lines: [
    ['digby', 'Foreman’s report. Word’s got round the burrows that the Deep Stacks are safe again. The moles want to move in.'],
    ['burrow', 'Hello, dears! Mrs Burrow, pie-maker. We don’t want much: a few tunnels for shops, and a way for your mice to come down and visit.'],
    ['pip', 'A mole city under a mouse city? Books up top, pies down below?'],
    ['digby', 'And a lift. Brass cage, proper cable, a bell. Mice can’t do forty paces of ladder. They get dizzy and cry.'],
    ['hazel', 'Excuse me! Hazel Pouchley, hamster, travel writer. Is this where the new lift goes? I’ve packed snacks for the whole trip. In my cheeks.'],
    ['pip', 'Build the Grand Lift in the vault, then tap an empty tunnel to let a mole open a shop there. Every shop and every lift stop makes the whole library earn more!'],
  ] },
  { id: 'mole1', when: shops(1), lines: [
    ['burrow', 'Open for business! First customer gets a free pie. Second customer also gets a free pie. I just like giving out pies.'],
    ['hazel', 'Reviewing it now. “Mole City: small, warm, smells of mushrooms.” Five stars. I’m keeping two of the pies in my cheeks for later.'],
    ['digby', 'Upgrade the shops and they get busier. More customers, more fixtures, more income for the library.'],
  ] },
  { id: 'mole4', when: shops(4), lines: [
    ['mayor', 'Ahem! As Mayor of the Meadow, I have come down forty paces in a small brass box to greet my fellow mayor.'],
    ['digby', 'I’m not a mayor. I’m a foreman.'],
    ['burrow', 'He’s the mayor. We voted while he was digging. He can’t hear anything while he’s digging.'],
    ['mayor', 'Splendid! Then I declare Mole City and Whiskerwood twinned. Up top, a city of mice. Down below, a city of moles. One library.'],
  ] },
  { id: 'mole8', when: shops(8), lines: [
    ['hazel', 'Final chapter of my guidebook: “Mole City has a farm, a pie shop, a jeweller, a tea house, a spa, a cinema, a cheese cave and a post office. I am never going home.”'],
    ['burrow', 'She’s been living in the spa for a week, dear.'],
    ['digby', 'Every shop in Mole City is open. Tube Post says letters are coming in from burrows we’ve never heard of.'],
    ['pip', 'Two cities, one library. Grandma Mimsy would have loved this.'],
  ] },
  { id: 'deep2', when: halls(2), lines: [
    ['digby', 'All done. Found forty-one quills, eleven inkpots and one very offended beetle.'],
    ['pip', 'Digby… do you ever feel like someone’s watching the tunnels?'],
    ['digby', 'Moles don’t feel, we smell. And yes. Somebody down here smells of stolen coins.'],
  ] },
  { id: 'deep3', when: halls(3), lines: [
    ['pip', 'Look at these old catalogue cards: one for every page… but some have been scratched clean.'],
    ['digby', 'Scratched on purpose. Somebody went through here with a knife, a long time ago.'],
    ['pip', 'Thessaly’s next page is about that. I don’t like where this is going.'],
  ] },
  { id: 'deep4', when: halls(4), lines: [
    ['rattigan', 'Well, well. The little librarian and the pet mole, digging for MY dragon gold.'],
    ['pip', 'Rattigan! How did you even get down here?'],
    ['rattigan', 'Family map. My great-great-great-grand-somebody was Captain of the Royal Guard. He chased a thief down these tunnels and lost everything: his post, his name, his honour. I’m here to take a little of it back.'],
    ['digby', 'The next tunnel is half flooded, you daft rat. Don’t—'],
    ['rattigan', 'Ha! Catch me if you can!'],
    ['pip', '…He went straight into the flooded bit, didn’t he.'],
  ] },
  { id: 'deep5', when: halls(5), lines: [
    ['pip', 'RATTIGAN! Hold on to that beam!'],
    ['rattigan', 'I’m not scared! It’s just COLD and WET and there’s a FISH in my HAT!'],
    ['digby', 'Pumps are running! Grab the rope!'],
    ['rattigan', '…You came back for me. Nobody comes back for a Brannock.'],
    ['pip', 'Brannock? You’re Captain Brannock’s family?'],
    ['rattigan', 'The one who failed. He let the thief get away. We’ve been a joke for four hundred years.'],
    ['pip', 'Then you need to read the page we just found. Out loud. Go on.'],
    ['rattigan', '“…Captain Aldous Brannock was the bravest mouse I ever met.”'],
    ['rattigan', 'He wasn’t a coward. He was… kind. Four hundred years, and he was just kind.'],
    ['rattigan', '…Digby. Does your guild take rats?'],
    ['digby', 'We take anyone who can hold a shovel and doesn’t steal it.'],
    ['rattigan', 'I’ll get used to the second part.'],
  ] },
  { id: 'deep6', when: halls(6), lines: [
    ['rattigan', 'Found something by the braziers. Scratch marks. Big ones. Like… really, really big.'],
    ['digby', 'Claws. Old ones. Whatever made ’em went down, not up.'],
    ['pip', 'Grandma Mimsy used to say every dragon in a story is just somebody nobody bothered to talk to. I always thought it was only a saying.'],
  ] },
  { id: 'deep7', when: halls(7), lines: [
    ['pip', 'You can feel warm air coming up from somewhere far below.'],
    ['digby', 'Warm air from below means something big is breathing.'],
    ['rattigan', 'Breathing is good. Breathing means not a skeleton. I’m trying to be positive now.'],
    ['pip', 'One hall left: the Archivist’s Study. Its door has eight locks, and seven of them just clicked open.'],
  ] },
  { id: 'deep8', when: halls(8), lines: [
    ['pip', 'It’s her study. Her real study. Her glasses are still on the desk.'],
    ['digby', 'And the great door at the bottom: eight locks, and every one of them is open now.'],
    ['rattigan', 'Read the letter. Please. I’m not crying, there’s just a lot of dust down here.'],
    ['pip', '“…a small brass key shaped like a quill.”'],
    ['pip', 'Grandma Mimsy wore one on a ribbon every single day. She said it was the key to the most important room in the world. I thought she meant the library.'],
    ['mimsy', 'I did mean the library, dear. Just a bit more of it than you thought.'],
    ['pip', 'GRANDMA?!'],
    ['mimsy', 'My great-great-(and so on)-grandfather was Corwin Vane. Street singer. Terrible at sitting still. It runs in the family.'],
    ['mimsy', 'Go on down, dear. Open the great door, and take a good book. He will have been waiting a very long time.'],
  ] },
  { id: 'deepEnd', when: (s) => s.deep?.door, lines: [
    ['pip', 'It’s… a mountain. Of books. And gold. And one very, very large tail.'],
    ['umber', '…Thessaly? Is that you? You have gone very small. And there are more of you.'],
    ['pip', 'I’m Pip, from the library upstairs. Mr Umber… Thessaly has been gone a very long time. I’m so sorry.'],
    ['umber', 'Ah.'],
    ['umber', 'I did wonder. The reading stopped. I thought perhaps she had lost her place.'],
    ['umber', 'I kept her book safe. Four hundred years. No soldier. No king. No thief.'],
    ['rattigan', 'Reformed! Reformed thief! I’m on the shovel rota now!'],
    ['umber', 'Before I give it to anyone, I ask what I asked her. Small mouse: what is a book for?'],
    ['?', [
      { label: 'For power. Whoever holds it decides what is remembered.', retry: true, lines: [['umber', 'That was the King’s answer. He was wrong, and so are you… but you said it honestly, which he never did. Think again, little one.']] },
      { label: 'For keeping every story safe, so nobody is forgotten.', lines: [['umber', 'A librarian’s answer. A good one. Thessaly would have liked you.']] },
      { label: 'For reading to someone.', lines: [['umber', '…'], ['umber', 'That is exactly what she said.']] },
    ]],
    ['umber', 'Then take it: the Mighty Tales. Open it at the very end.'],
    ['pip', 'The last pages are… us. “The day Pip got stuck in the book-return slot.” “Mayor Gruyère’s very long speech.” “Baroness Clawdia asks for a story.”'],
    ['pip', 'It’s been writing Whiskerwood Library. All along.'],
    ['umber', 'Every story told near a library. Your little library upstairs has been talking in its sleep for years, and I have been listening. It is the best thing I have ever heard.'],
    ['pip', 'And the very last line is in different ink. Brown, and a little wobbly…'],
    ['thessaly', 'The rest is yours to write.'],
    ['umber', 'Will you… come back tomorrow? And read?'],
    ['pip', 'Every single night. We’ll make a rota. The whole library.'],
    ['rattigan', 'I call Tuesdays. I do the voices.'],
    ['digby', 'I’ll bring the cocoa. Dragons like cocoa? This one looks like he likes cocoa.'],
  ] },
];
