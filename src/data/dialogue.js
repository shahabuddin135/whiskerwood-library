// Everything the mice say. Chatter picks lines by context: the floor's genre, the location,
// season, weather, time, festival, events and what YOU just did. Skits are little
// two-mouse conversations; 'ALL' lines are floor-wide reactions.

export const GENERIC = [
  "Shh! I'm reading!", 'Just one more chapter…', 'I love the smell of old books.', 'Has anyone seen my glasses? …Oh. Face.',
  'This seat is sooo comfy.', 'Squeak! What a twist!', 'Page 42 already?', 'I could live here. I might already live here.',
  'Who nibbled this page corner?', "Crumbs! I'm late for tea.", 'Reading is my cheese.', 'Borrowing three today. Returning… eventually.',
  'Psst… is there a sequel?', 'My tail is tingling. Good book.', 'I’m judging this book by its cover. Four stars.',
  'The author clearly has never met a mouse.', 'I only came in to use the bathroom. That was six hours ago.',
  'This chapter is just a list of cheeses. Riveting.', 'I’ve read this before. I don’t remember a thing. Perfect.',
  'Why does every hero have a dead parent AND a sword?', 'Footnotes! My favourite part!', 'I keep reading the same line. The same line. The same line.',
  'I bought this book for its smell. No regrets.', 'This bookmark is older than me.', 'Ooh, a pressed flower on page 90!',
  'Someone underlined every word on this page. Every. Word.', 'Ahh. A book with big print. Bless.',
];

export const GENRE = [
  ['Once upon a time… again.', 'I hope the princess finds her cheese!', 'Happily ever after! …wait, there’s a page 94?', 'Why is it always a wolf? Mice can be villains too!', 'Goldilocks is a burglar and nobody talks about it.', 'The seventh son of a seventh son. Busy family.'],
  ['Look at the pictures!', 'Read it again! AGAIN!', 'I can read the big words now! “THE”.', 'The hungry mouse ate a WHOLE cake. Role model.', 'This book has flaps! And one flap is a cat!', 'Pop-up book! It popped my nose.'],
  ['This tea is perfect.', 'Cheese scone recipe? Yes please!', 'MIND the crumbs on the pages!', 'Step one: preheat the oven. Step two: panic.', 'This recipe serves four. Or one very hungry mouse.', 'I’ve read this cookbook three times and I still can’t boil water.'],
  ['Here be dragons…', "I'm sailing to Swiss Island!", 'Where is north again? Oh. It says “north”.', 'X marks the cheese!', 'The map is upside down and so is my life.', 'Twenty chapters of walking. Riveting walking.'],
  ['The butler did it. It’s always the butler.', 'A clue! A CLUE!', 'Something smells fishy… oh, it’s my sandwich.', 'I suspect everyone. Including myself.', 'The detective has a moustache. He must be clever.', 'Locked-room mystery? Just use the mousehole.'],
  ['Roses are red, cheese is too…', 'Such lovely rhymes.', 'A haiku: squeak squeak squeak / squeak squeak squeak squeak squeak squeak squeak / squeak squeak squeak squeak.', 'This poem is 900 lines about a leaf. Stunning leaf.', 'Does it have to rhyme? It doesn’t rhyme. I feel betrayed.', 'The greenhouse makes the poems smell like tomatoes.'],
  ['Is the moon REALLY cheese?', 'I spotted a comet!', 'E equals mouse times cheese squared.', 'Stars are just far-away cheese. Science.', 'If a mouse reads in a forest and nobody hears…', 'The telescope says there’s a cat on Mars. That’s just the lens.'],
  ['Careful, this tome is ancient!', 'Gloves on, please.', 'A royal seal!', 'This page is older than Grandma Mimsy!', 'Is that a coffee ring from 1603?', 'Ye olde spelling giveth me ye headache.'],
  ['La la la ♪', 'Such a lovely melody.', 'Encore! Encore!', 'Is that a harp?', 'Reading sheet music with no instrument. Humming quietly. Annoying everyone.', 'Da-da-da-DUM. Sorry. Da-da-da-DUM.'],
  ['What a grand hall!', 'I feel like royalty.', 'Is the Golden Crumb real?', 'The statue winked at me!', 'Legends say this sofa once seated a king. It smells like it.', 'My echo is louder than me in here.'],
];

export const LOCATION_LINES = {
  meadow: ['Smells like fresh bread from the village.', 'The frogs outside are louder than the readers.', 'Grandma Mimsy used to sit right here.', 'A tractor! No wait, just a very big beetle.'],
  cove: ['Is that the sea or someone’s stomach?', 'Every book here smells faintly of fish.', 'The captain recommends “Moby-Dip”. He recommends it a LOT.', 'Ahoy! I mean… shh.', 'My bookmark is a strip of seaweed.', 'The crab keeps borrowing books and not returning them.'],
  caverns: ['Echo! …echo… …shh… …shh… …shh…', 'I read by mushroom light. Very romantic.', 'Madame Mole says this book smells like a mystery.', 'Who needs windows? We have crystals.', 'I’ve been down here so long I forgot what the sky looks like. Cheese-coloured?', 'Drip. Drip. Drip. Mood.'],
  clockwork: ['Tick. Tock. Page. Turn.', 'The book tube delivered my novel in 0.2 seconds!', 'My bookmark has a tiny engine.', 'Has anyone seen my goggles? Oh. Head.', 'The steam is making my pages curly.', 'Is that gear supposed to be spinning that fast?'],
  castle: ['The queen reads here, you know.', 'Mind the dragon, he’s napping.', 'My book is heavier than a knight.', 'Everything echoes in a castle. Especially the shushing.', 'The portraits keep looking at my book.', 'I think the suit of armour is reading over my shoulder.'],
  sky: ['Don’t look down! …I looked down.', 'A cloud just drifted through the reading room.', 'The wind turned my page. Rude.', 'Is this library… floating?!', 'I dropped a bookmark over the edge. It’s somewhere over the meadow now.', 'I’m reading above the clouds. Show-off? Me? Yes.'],
};

export const SEASON_LINES = {
  spring: ['Blossoms everywhere!', 'Spring cleaning my bookshelf. Found three sandwiches.', 'Achoo! Pollen. Achoo! Poetry.'],
  summer: ['Too hot outside, lovely in here.', 'Summer reading list: 40 books. Done: 0.5.', 'The sun is out, so obviously I’m indoors.'],
  autumn: ['Leaves falling, pages turning.', 'Pumpkin season!', 'Scarf on, book open, world off.'],
  winter: ['Hot cocoa and a good book.', 'I made a snow-mouse!', 'My paws are too cold to turn pages. Someone help.'],
};
export const WEATHER_LINES = {
  rain: ['Perfect reading weather.', 'Listen to that rain…', 'I forgot my umbrella! Guess I’ll stay. Forever.', 'Rain: nature’s “do not disturb” sign.'],
  snow: ['Brrr! Glad it’s warm in here.', 'Snow day = book day!', 'Every snowflake is unique. So is this book. It’s awful.'],
};
export const NIGHT_DARK = ["It's getting too dark to read…", 'Could we get some lamps?', 'I’m reading by the light of my own eyes.', 'Is this page blank or is it just night?'];
export const NIGHT_LAMP = ['Cosy lamplight ♥', 'Reading by lamplight is the best.', 'One more chapter, then bed. (A lie.)', 'Night owls, unite! Quietly.'];

// The librarian at the desk.
export const LIBRARIAN = [
  'Shhh!', 'Next, please!', 'Please do not lick the books.', 'No, you may not borrow the librarian.', 'Stamp, stamp, stamp. I love my job.',
  'That’s three days overdue. …Three YEARS? Oh my.', 'Returns go in the slot. Not the fish tank.', 'Welcome, welcome!', 'Please return books on time!',
  'Shelf three needs dusting… and a stern talking-to.', 'Who put the cookbook in Mystery? …Oh. “Who Stole the Cheese?”. Fair.',
];
export const RECOMMEND = [
  'Staff pick: “Dust: A Very Long History”. Seven volumes. Very dry.',
  'If you liked “The Very Hungry Mouse”, try “The Moderately Peckish Mouse”.',
  'For nervous readers: “Pages That Won’t Jump Out At You”.',
  'Today’s pick: the phone book. Huge cast. No plot.',
  'Try “Cheese: The Musical”. The songs are only slightly cheesy.',
  'Recommended: “How to Read Faster”. It takes four months.',
  'New arrival: “The Book Nobody Finished”. Be the first!',
  'Book of the week: “Silence”. It’s blank. Perfect for libraries.',
];

// Occasional fourth-wall moments. Rare on purpose.
export const FOURTH_WALL = [
  'Sometimes I feel like someone is watching us. From above. Through glass.',
  'Who keeps tapping on the sky?',
  'I think we might be in a game. …Nah.',
  'Does anyone else hear a waltz. All. The. Time?',
  'Whoever keeps poking me: your finger is ENORMOUS.',
  'If you’re reading this: you’re doing great.',
  'I’ve been on this page since you opened the app.',
  'Is it just me, or does the whole building scroll?',
  'Every time I blink, the coin jar gets emptier. Suspicious.',
];

// Two-mouse skits. A/B are two readers on the same floor, ALL is the whole floor, LIB the librarian.
export const SKITS = [
  [['A', 'No spoilers, but the butler did it.'], ['B', 'THAT IS THE SPOILER.']],
  [['A', 'Have you read “War and Cheese”?'], ['B', 'I’ve read the back cover. Very moving.'], ['A', 'Same! Book club?']],
  [['A', 'Honestly? I prefer the movie.'], ['ALL', 'GASP!'], ['B', 'Leave. Now.']],
  [['A', 'How’s the book?'], ['B', 'Page 1,204 of 1,300.'], ['A', 'Nearly done!'], ['B', 'That was the introduction.']],
  [['A', 'Can you recommend something short?'], ['B', '“In Search of Lost Crumbs”.'], ['A', 'How short?'], ['B', 'Seven volumes.']],
  [['A', 'I read the last page first.'], ['B', 'MONSTER.']],
  [['A', 'This book changed my life.'], ['B', 'What is it?'], ['A', '“How to Fold a Fitted Sheet”.'], ['B', '…can I borrow it?']],
  [['A', 'Did you finish “Moby-Dip”?'], ['B', 'It’s 600 pages about a pool.'], ['A', 'It’s a metaphor!'], ['B', 'For a POOL?']],
  [['A', 'The hero just died!'], ['B', 'On page three?!'], ['A', 'It’s a very short book.']],
  [['A', 'Why is your book upside down?'], ['B', 'It’s a mystery. Keeping them guessing.']],
  [['A', 'Shh! I’m at the good part!'], ['B', 'You’ve said that for four chapters.'], ['A', 'It’s a VERY good book.']],
  [['A', 'I’m writing a novel.'], ['B', 'About what?'], ['A', 'A mouse writing a novel.'], ['B', 'How does it end?'], ['A', 'Unclear. She’s stuck.']],
  [['A', 'Who keeps folding page corners?!'], ['B', '*whistles innocently*']],
  [['A', 'Is the ending happy?'], ['B', 'Define “happy”.'], ['A', 'Oh no.']],
  [['A', 'Pssst. Want a spoiler?'], ['B', 'NO.'], ['A', 'It’s good.'], ['B', '…okay, that one’s fine.']],
  [['A', 'Ah yes, “Principia Cheesematica”. Riveting.'], ['B', 'Favourite part?'], ['A', 'The… maths?'], ['B', 'It’s a cookbook.']],
  [['A', 'My book club finished a book!'], ['B', 'Congratulations!'], ['A', 'We started in the spring. Of 2019.']],
  [['A', 'They cast a HAMSTER as the lead in the movie.'], ['B', 'An OUTRAGE.'], ['ALL', 'Boooo!']],
  [['A', 'I’ve been reading for six hours.'], ['B', 'Wow!'], ['A', 'Still choosing which book.']],
  [['A', 'Goldilocks is a perfect ending.'], ['B', 'She commits a burglary!'], ['A', 'A COSY burglary.']],
  [['A', 'Who did it?'], ['B', 'The cat.'], ['A', 'It’s ALWAYS the cat.'], ['B', 'It’s a cookbook, though.']],
  [['A', 'Can you keep a secret?'], ['B', 'Yes.'], ['A', 'Page 204 has a pressed flower.'], ['B', 'EVERYONE, PAGE 204!']],
  [['A', 'This book is so long it has a sequel in the middle.'], ['B', 'I used mine as a bed. Then a house.']],
  [['A', 'Chapter 88: the hero finally stands up.'], ['B', 'Big moment.'], ['A', 'He sits back down in 89.']],
  [['A', 'Do you ever feel like we’re being watched?'], ['B', 'Only when the giant finger appears.'], ['A', '…the what?']],
  [['A', 'Who keeps taking coins out of the jar?'], ['B', 'The librarian?'], ['A', 'Then who taps it?'], ['B', '*both slowly look up*']],
  [['A', 'I don’t like books that make me cry.'], ['B', 'What are you reading?'], ['A', '“The Giving Cheese”. Fourth time today.']],
  [['A', 'The author is “Anonymous” again.'], ['B', 'Prolific fellow.']],
  [['A', 'I only read books with a map in the front.'], ['B', 'This is a cookbook.'], ['A', 'Then where’s the map to the cheese?']],
  [['A', 'I’ve read this eleven times.'], ['B', 'Does it get better?'], ['A', 'No, but I do.']],
  [['A', 'Which is scarier: the cat or the overdue fine?'], ['B', '…the fine.'], ['LIB', 'Correct.']],
  [['A', 'Sorry, is this seat taken?'], ['B', 'By my book, my snack and my emotional support bookmark.']],
  [['A', 'I read the book AND saw the movie.'], ['B', 'And?'], ['A', 'They changed the ending!'], ['ALL', 'GASP!']],
  [['A', 'Quick, what’s the best book ever?'], ['B', 'The one I’m reading.'], ['A', 'You said that yesterday.'], ['B', 'I was reading a different one yesterday.']],
  [['A', 'Did you finish it?'], ['B', 'I finished the snacks I brought to read it with.']],
];

// Location-flavoured skits get mixed in when you're there.
export const LOCATION_SKITS = {
  cove: [[['A', 'This book is water-damaged.'], ['B', 'Everything is water-damaged. We live in a lighthouse.']], [['A', 'The crab took my bookmark.'], ['B', 'He took my whole book.'], ['A', 'He can’t even read!'], ['B', 'Can’t he?']]],
  caverns: [[['A', 'Is it day or night?'], ['B', 'Yes.']], [['A', 'I think the walls are listening.'], ['B', '…listening… listening…'], ['A', 'That’s just the echo.'], ['B', 'Is it?']]],
  clockwork: [[['A', 'My book tube delivery went to the wrong floor.'], ['B', 'I got a cookbook and a very confused pigeon.']], [['A', 'Does anything here NOT tick?'], ['B', 'Me. …tick.']]],
  castle: [[['A', 'The dragon borrowed “How to Train Your Human”.'], ['B', 'Should we be worried?'], ['A', 'He gave it four stars.']], [['A', 'Are we allowed in here?'], ['B', 'I’m a duke.'], ['A', 'Since when?'], ['B', 'Since I sat on this chair.']]],
  sky: [[['A', 'My bookmark just flew away.'], ['B', 'Mine migrated south for the winter.']], [['A', 'Why is it so windy?'], ['B', 'We’re in the sky, Gerald.']]],
  meadow: [[['A', 'A frog borrowed a book.'], ['B', 'Which one?'], ['A', '“Leap Year”. Obviously.']]],
};

// Reactions to things the player does.
export const REACTIONS = {
  lvl: ['Ooh, new arrivals!', 'Fresh books! I can smell the ink!', 'The shelves are fuller! My heart is fuller!', 'NEW BOOKS. Everyone stay calm.', 'Is that a sequel?!'],
  seats: ['Dibs!', 'A new seat! Mine!', 'Finally, somewhere to sit that isn’t Gerald.', 'Ooh, still warm from the factory.'],
  shelves: ['More shelves? Now we’re talking.', 'A whole new shelf to get lost in!', 'I’ll alphabetise it! Nobody stop me!'],
  staff: ['The librarian got faster!', 'Stamping at record speed!', 'Look at those paws go!'],
  decor0: ['Ooh, a rug! Shoes off, everyone.', 'So soft! I’m lying down now. Goodbye.'],
  decor1: ['Let there be light!', 'I can see my paws!', 'Lamps! Now I can read the small print. Oh no.'],
  decor2: ['A plant! Hello, plant.', 'I shall name it Gerald II.', 'Don’t water it with tea again, Doris.'],
  decor3: ['Art! How sophisticated.', 'I don’t get it. I love it.', 'It’s looking at me.'],
  decor4: ['WOW. Just… wow.', 'Is it staring? It feels like it’s staring.', 'Now THAT is a centrepiece!'],
  furniture: ['Ooh, new furniture!', 'Very stylish.', 'The librarian has TASTE.', 'Can I sit on it? Can I read on it?'],
  milestone: ['DOUBLE income?! Party!', 'The library is famous now!', 'Hooray for the librarian!'],
  build: ['A new floor! Race you!', 'Let’s go upstairs!', 'More library?! I’m never leaving.'],
  jar: ['Ka-ching!', 'Somebody’s rich!', 'Where does that money even go?'],
  catWin: ['Hooray!', 'You saved us!', 'Our hero!', 'Good riddance, Baroness!'],
  cat: ['EEK! A CAT!', 'Hide the cheese!', "Don't make eye contact…", 'Somebody shoo her!'],
  worms: ['Something is nibbling the shelves!', 'Bookworms! Ew!', 'My book has holes in it!', 'That’s not how you read!'],
  special: ['Wow, a celebrity!', 'Can I get an autograph?', 'Squee!!', 'Act natural. ACT NATURAL.'],
  zoom: ['Hello? Who’s there?', 'Why is the sky so close?', 'Are you… zooming in on me?', 'Personal space, please!', 'Is there something on my face?'],
  idle: ['Is the librarian asleep?', 'Hello? Anyone tapping out there?', 'It’s very quiet up there today.', 'The coin jar looks lonely.'],
  bellSpam: ['Okay, we HEARD the bell.', 'DING DING DING, we get it!', 'My ears!', 'Is it a fire drill?'],
  pet: ['Hehe, that tickles!', 'Squee! ♥', 'Thank you!', 'Aww, hello!', 'Best librarian ever!', '*happy squeak*'],
  // Pet the same floor too often and the readers get fed up.
  petSpam: [["I'm trying to READ.", 'Hello again. And again.'], ['Okay that’s enough poking.', 'Personal space, please!'], ['Fine. Take a coin. Now shoo.', '*sigh* …hehe. No. Stop.']],
  request: ['Excuse me! Can you find this book?', 'Help! Where is my book?', 'Has anyone seen this one?', 'I need this book. Emotionally.'],
  requestWin: ["That's the one! Thank you!", 'You found it! ♥', 'My favourite book!', 'Wonderful!', 'How did you know?!'],
  requestFail: ['Oh well… 😢', 'Never mind…', "I'll read something else.", 'Guess I’ll read the back of a cereal box.'],
  story: ['Story Hour is my favourite!', 'Shh, the story is starting!', 'Do the voices! DO THE VOICES!'],
  fair: ['Book Fair! Hooray!', 'So many new books!', 'Get your signed copies!', 'I have no money and no self-control.'],
  jarFull: ['The coin jar is overflowing!', 'Someone empty that jar!', 'The jar is FULL. Like my heart.'],
};

// Small moments that happen on their own.
export const MOMENTS = {
  bookFall: ['Ow!', 'Oh! This one looks good.', 'The shelf chose for me.', 'A sign!'],
  sneeze: ['ACHOO!', 'Dusty!', 'Bless me.', 'That shelf needs dusting!'],
  sneezeReply: ['Bless you!', 'Gesundheit!', 'Shh!', 'Cover your nose, Gerald!'],
  sleepy: ['zzz…', '*snore*', 'zzz… cheese… zzz'],
  sleepyReply: ['He’s been on page one for an hour.', 'Shh, let him dream.', 'Boring book?', 'He’s “resting his eyes”.'],
  tug: ['That’s MY book!', 'I saw it first!', 'Let go!', 'Rock paper scissors?'],
  window: {
    meadow: ['A robin! Hello, robin!', 'The pigeon is reading over my shoulder.'],
    cove: ['A seagull is staring at my sandwich.', 'The gull wants my chips.'],
    caverns: ['A bat! …borrowing a book?', 'A glow-moth! Sparkly!'],
    clockwork: ['A little clockwork bird! It’s winding down…', 'Was that a mail capsule?'],
    castle: ['An owl! Very wise-looking.', 'Is that a raven? Very gothic.'],
    sky: ['A paper plane! Someone sent a letter!', 'A bird… at our height?'],
  },
};

// Tap a floor's centrepiece or curiosity.
export const TAP_LINES = {
  clock: ['BONG! …sorry, wrong hour.', 'Tick. Tock. Read.', 'It’s always five past “one more chapter”.'],
  horse: ['Neigh! (It’s wooden. It said nothing.)', 'Wheee!', 'Giddy-up, story time!'],
  urn: ['*bubble bubble*', 'Tea’s ready! It’s always ready.', 'Mind, it’s hot!'],
  globe: ['*spins wildly*', 'You landed on… the ocean. Again.', 'Wheee! Where shall we read next?'],
  candles: ['*flicker*', 'Spoooky…', 'Please don’t read too close to the flames.'],
  fountain: ['*splash!*', 'Make a wish! Wish for more books.', 'Someone threw a bookmark in here.'],
  telescope: ['You see: a cat. Very far away. Hopefully.', 'A new star! Name it “Page 42”.', 'Is that… the moon? Smells like cheddar.'],
  chest: ['Ooh, shiny!', 'Royal treasure! Please don’t bite the coins.', 'The chest is 90% coins, 10% lost bookmarks.'],
  harp: ['*glissando*', 'Plink plink plink.', 'Heavenly!'],
  statue: ['*the statue winks*', 'Is it… smiling?', 'Legend says rubbing its nose brings good books.'],
  gramophone: ['♪ It’s the waltz again ♪', '*crackle crackle* ♪', 'Dance break! One chapter, then dance!'],
  cuckoo: ['CUCKOO! (That book is overrated.)', 'CUCKOO! (Read the other one.)', 'CUCKOO! (It was the butler.)', 'CUCKOO! (Chapter 3 is the best bit.)'],
  fishtank: ['Blub. (Hello.)', 'Blub blub. (Turn the page, I’m waiting.)', 'Blub. (I prefer the movie.)', 'Sir Bubbles has read everything. Twice.'],
  crystalball: ['I foresee… a sad ending.', 'The ball says: “the cat did it”.', 'Your future contains… a sequel.', 'I see… a very long book. And snacks.'],
  orrery: ['*whirr* The cheese moon laps the planets.', 'The planets align! Nothing happens. Beautifully.'],
  armor: ['…is it my turn to read yet?', '*creak* …nobody saw that.', 'Clank. (Shh.)'],
  tome: ['“Chapter one,” said the book, in a lovely voice.', 'The tome clears its throat… and does all the voices.', '“I won’t spoil it,” whispers the book.'],
  popcorn: ['POP! POP! POP!', 'Popcorn for the book. It still counts.', 'Filmore says hi.'],
};

// The haunted typewriter's terrible opening lines.
export const TYPEWRITER = [
  'It was a dark and stormy night. Then it was a light and sunny morning. Chapter two.',
  'Call me Squeakmael. Or don’t. I’m not your boss.',
  'It was the best of cheese, it was the worst of cheese.',
  'Once upon a time there was a mouse. The end. (Sequel pending.)',
  'All happy mice are alike; every unhappy mouse has run out of cheese.',
  'The cat did it. Chapter one. Oops.',
  'She opened the book. The book opened her. They were both surprised.',
  'In a hole in the ground there lived a mouse. Obviously. Where else?',
];
