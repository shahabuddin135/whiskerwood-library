// Looks for everyday visitor mice. Mixed and matched at random.
export const FURS = [
  { fur: '#b8aca1', belly: '#efe6dc' }, { fur: '#c9b29b', belly: '#f4e9dc' }, { fur: '#8f7f73', belly: '#d9cdc2' },
  { fur: '#e9e2d8', belly: '#fffaf3' }, { fur: '#a98467', belly: '#ecd9c6' }, { fur: '#6f6560', belly: '#c9beb6' },
  { fur: '#d6b98c', belly: '#f7ead3' }, { fur: '#9aa0a6', belly: '#e3e6e8' },
];
export const CLOTH = ['#d9774b', '#6a9f58', '#4f7cac', '#c0504d', '#e9b949', '#9b6fb0', '#3f7f6f', '#e58fa8', '#7a8fa6'];
export const HATS = [null, null, null, null, 'beret', 'bow', 'flower', 'cap', 'bobble'];

// Special guests.
export const CELEBS = [
  { name: 'Sir Nibbleton', line: 'Charmed. I only read books with gold-edged pages.', look: { fur: '#c9b7a3', belly: '#f3ebe1', hat: 'tophat', scarf: '#7a2f3a', monocle: true } },
  { name: 'Madame Brie', line: 'Darling, this library is simply ripe.', look: { fur: '#efe7dc', belly: '#fffaf2', hat: 'sunhat', scarf: '#e58fa8', shades: true } },
  { name: 'Captain Whiskerbeard', line: 'Arr! Where be the books with treasure maps?', look: { fur: '#8f7f73', belly: '#d9cdc2', hat: 'pirate', scarf: '#b33f40' } },
  { name: 'Lulu Squeakstar', line: 'No autographs! …Okay, one autograph.', look: { fur: '#d6b98c', belly: '#f7ead3', hat: 'star', scarf: '#9b6fb0', shades: true } },
  { name: 'DJ Crumbles', line: 'Dropping the beat… quietly. Library rules.', look: { fur: '#6f6560', belly: '#c9beb6', hat: 'headphones', scarf: '#3f7f6f', shades: true } },
  { name: 'Coco Camembert', line: 'Fashion fades. Library cards are forever.', look: { fur: '#e9e2d8', belly: '#fffaf3', hat: 'beret', scarf: '#1f1f2e', shades: true } },
  { name: 'Maestro Pipsqueak', line: 'The page-turning here has excellent rhythm.', look: { fur: '#a98467', belly: '#ecd9c6', hat: 'tophat', scarf: '#f2d27a' } },
  { name: 'Twinkle-Toes Tilly', line: 'I pirouetted through the whole poetry section!', look: { fur: '#c9b29b', belly: '#f4e9dc', hat: 'bow', scarf: '#f28b82' } },
  // parody stars
  { name: 'Taylor Swiss', line: 'I’m writing a song about this library. It has holes in it. On purpose.', look: { fur: '#efe7dc', belly: '#fffaf2', hat: 'bow', hatCol: '#e0405f', scarf: '#e0405f' } },
  { name: 'Mouse Jagger', line: 'I can’t get no… cheese-faction! Oh wait, there’s a café.', look: { fur: '#8f7f73', belly: '#d9cdc2', scarf: '#e0405f', shades: true } },
  { name: 'Elvis Presqueak', line: 'Thank you. Thank you very mousch.', look: { fur: '#6f6560', belly: '#c9beb6', hat: 'tophat', hatCol: '#1f1f2e', scarf: '#e9b949', shades: true } },
  { name: 'Lady Gouda', line: 'I was born this way. Specifically, in a cheese cave.', look: { fur: '#e9e2d8', belly: '#fffaf3', hat: 'star', scarf: '#9ec5f0', shades: true } },
  { name: 'Oprah Whiskfrey', line: 'You get a book! And YOU get a book! Everybody gets a book!', look: { fur: '#a98467', belly: '#ecd9c6', hat: 'sunhat', scarf: '#9b6fb0' } },
  { name: 'Gordon Ramsqueak', line: 'This cheese is so raw it’s still squeaking! …The books are lovely though.', look: { fur: '#d6b98c', belly: '#f7ead3', hat: 'chef', scarf: '#1f1f2e' } },
  { name: 'Keanu Squeaves', line: 'Whoa. So many books.', look: { fur: '#6f6560', belly: '#c9beb6', scarf: '#1f1f2e', shades: true } },
  { name: 'Leonardo DiCheddario', line: 'I’m the king of the bookshelf!', look: { fur: '#d6b98c', belly: '#f7ead3', hat: 'cap', hatCol: '#4f7cac', scarf: '#f2d27a' } },
  { name: 'Dwayne "The Crumb" Johnson', line: 'Can you SMELL what the mouse is reading?', look: { fur: '#9a8b7e', belly: '#ddd2c6', scarf: '#1f1f2e', shades: true } },
  { name: 'Squeakira', line: 'My whiskers don’t lie: this place is amazing.', look: { fur: '#c9b29b', belly: '#f4e9dc', hat: 'flower', hatCol: '#f2a65a', scarf: '#e9b949' } },
  { name: 'Brie Larson-Mouse', line: 'I trained for months to lift this dictionary.', look: { fur: '#efe7dc', belly: '#fffaf2', hat: 'star', scarf: '#c0504d' } },
  { name: 'Harry Squiles', line: 'Treat people with kindness. And books with bookmarks.', look: { fur: '#a98467', belly: '#ecd9c6', hat: 'flower', hatCol: '#f7a8c4', scarf: '#f7a8c4' } },
];

export const ROYALS = [
  { name: 'Queen Mozzarella', line: 'We are amused. Very, very amused.', look: { fur: '#efe9df', belly: '#fffbf4', crown: true, cape: '#7b2d8b' } },
  { name: 'King Roquefort III', line: 'By royal decree: naps are now compulsory in the reading room.', look: { fur: '#b8aca1', belly: '#efe6dc', crown: true, cape: '#2f4f8f' } },
  { name: 'Princess Petal', line: 'Is this the library with the rocking horse? I must ride it. Royally.', look: { fur: '#e3c9b0', belly: '#fbefe2', crown: true, cape: '#e58fa8' } },
  { name: 'The Duke of Edam', line: 'I have come to return a book. It is only forty years overdue.', look: { fur: '#9a8b7e', belly: '#ddd2c6', crown: true, cape: '#b33f40' } },
  // parody royals
  { name: 'Queen Brie-zabeth', line: 'One would like a cup of tea and a very long novel.', look: { fur: '#efe9df', belly: '#fffbf4', crown: true, cape: '#2f4f8f' } },
  { name: 'Napoleon Brie-naparte', line: 'I am not short. I am fun-sized. Bring me the history section!', look: { fur: '#9a8b7e', belly: '#ddd2c6', crown: true, cape: '#1f2a4d' } },
  { name: 'King Louie the 14th Slice', line: 'L’état, c’est moi. Le cheese, c’est aussi moi.', look: { fur: '#e3c9b0', belly: '#fbefe2', crown: true, cape: '#e0b84f' } },
  { name: 'Cleo-parmesan', line: 'Bring me every scroll you have. And a cushion. A gold one.', look: { fur: '#d6b98c', belly: '#f7ead3', crown: true, cape: '#3f7f6f' } },
  { name: 'Tsarina Stiltonova', line: 'In my palace, the books read YOU.', look: { fur: '#efe7dc', belly: '#fffaf2', crown: true, cape: '#8e1f2f' } },
  { name: 'Prince Charming-Cheddar', line: 'I have come for a glass slipper. Oh, it’s a bookmark? Even better.', look: { fur: '#c9b29b', belly: '#f4e9dc', crown: true, cape: '#4f7cac' } },
];

// One visiting author per floor genre (index = floor). PARODY_AUTHORS adds more per floor.
export const AUTHORS = [
  { name: 'Hazel Quillworth', look: { fur: '#b08968', belly: '#eedfcf', hat: 'beret', scarf: '#5b7f4d', glasses: true } },
  { name: 'Pip Paperpaw', look: { fur: '#e9e2d8', belly: '#fffaf3', hat: 'bobble', scarf: '#f2a65a', glasses: true } },
  { name: 'Chef Gustavo Gouda', look: { fur: '#c9b29b', belly: '#f4e9dc', hat: 'chef', scarf: '#c0504d' } },
  { name: 'Admiral Scribbles', look: { fur: '#8f7f73', belly: '#d9cdc2', hat: 'pirate', scarf: '#2f4a6b' } },
  { name: 'Agnes Magnifier', look: { fur: '#6f6560', belly: '#c9beb6', hat: 'deerstalker', scarf: '#8c7b5a', glasses: true } },
  { name: 'Rosalind Rhyme', look: { fur: '#d6b98c', belly: '#f7ead3', hat: 'flower', scarf: '#f4a3b5' } },
  { name: 'Prof. Tinkerwhisk', look: { fur: '#9aa0a6', belly: '#e3e6e8', hat: 'wizard', scarf: '#556b9e', glasses: true } },
  { name: 'Brother Parchment', look: { fur: '#a98467', belly: '#ecd9c6', hat: 'hood', scarf: '#7a1f2b' } },
  { name: 'Aria Nightingale', look: { fur: '#efe7dc', belly: '#fffaf2', hat: 'bow', scarf: '#6d5fa3' } },
  { name: 'Old Sage Bramble', look: { fur: '#b8aca1', belly: '#efe6dc', hat: 'wizard', scarf: '#c9a227', glasses: true } },
];

// Famous parody authors who hold signings on their genre's floor.
export const PARODY_AUTHORS = [
  [ // Fairy Tales
    { name: 'Hans Christian Crumbersen', line: 'Every mouse is a little mermaid at heart. Mostly the tail part.', look: { fur: '#c9b29b', belly: '#f4e9dc', hat: 'tophat', scarf: '#4f7cac' } },
    { name: 'The Brothers Brie-mm', line: 'We collect fairy tales. And crumbs. Mostly crumbs.', look: { fur: '#a98467', belly: '#ecd9c6', hat: 'hood', scarf: '#5b7f4d', glasses: true } },
  ],
  [ // Picture Books
    { name: 'Dr. Squeuss', line: 'One book, two book, red book, cheese book!', look: { fur: '#efe7dc', belly: '#fffaf2', hat: 'tophat', hatCol: '#e0405f', scarf: '#e0405f' } },
    { name: 'Maurice Squeakdak', line: 'Let the wild rumpus start! …Quietly, please.', look: { fur: '#8f7f73', belly: '#d9cdc2', hat: 'crown', scarf: '#e9b949' } },
  ],
  [ // Cookbooks
    { name: 'Julia Squeaks', line: 'If you’re afraid of butter, use cream. If you’re afraid of cream, read a different book.', look: { fur: '#e9e2d8', belly: '#fffaf3', hat: 'chef', scarf: '#4f7cac' } },
    { name: 'Nigella Nibbles', line: 'Pop it in the oven, darling, and have a little nibble while you wait.', look: { fur: '#6f6560', belly: '#c9beb6', scarf: '#b33f40' } },
  ],
  [ // Adventure
    { name: 'Jules Vermin', line: 'Around the world in 80 days? I did the pantry in 79.', look: { fur: '#9aa0a6', belly: '#e3e6e8', hat: 'pirate', scarf: '#2f4a6b', monocle: true } },
    { name: 'Robert Louis Stevenmouse', line: 'Fifteen mice on a dead cat’s chest! …Metaphorically.', look: { fur: '#a98467', belly: '#ecd9c6', hat: 'pirate', scarf: '#c96b2f' } },
  ],
  [ // Mysteries
    { name: 'Agatha Crustie', line: 'The butler did it. There is no butler. That’s how good he is.', look: { fur: '#efe7dc', belly: '#fffaf2', hat: 'bow', hatCol: '#5d4e75', scarf: '#5d4e75', glasses: true } },
    { name: 'Sir Arthur Conan Mouse', line: 'When you have eliminated the impossible, whatever remains is probably the cat.', look: { fur: '#8f7f73', belly: '#d9cdc2', hat: 'deerstalker', scarf: '#8c7b5a', monocle: true } },
  ],
  [ // Poetry
    { name: 'Emily Dickinmouse', line: 'Because I could not stop for cheese, it kindly stopped for me.', look: { fur: '#efe7dc', belly: '#fffaf2', hat: 'bow', hatCol: '#ffffff', scarf: '#9ccc65' } },
    { name: 'Walt Whiskman', line: 'I contain multitudes. And several crackers.', look: { fur: '#b8aca1', belly: '#efe6dc', hat: 'sunhat', scarf: '#8a6f4d' } },
  ],
  [ // Science & Stars
    { name: 'Carl Sagouda', line: 'Billions and billions of books. Well, several hundred. It feels like billions.', look: { fur: '#c9b29b', belly: '#f4e9dc', scarf: '#556b9e' } },
    { name: 'Marie Squeakie', line: 'I discovered two new elements: Cheddarium and Nap-onium.', look: { fur: '#efe7dc', belly: '#fffaf2', hat: 'bobble', hatCol: '#556b9e', scarf: '#ffd66b', glasses: true } },
  ],
  [ // Rare Tomes
    { name: 'William Squeakspeare', line: 'To read, or not to read? Obviously to read.', look: { fur: '#a98467', belly: '#ecd9c6', hat: 'beret', hatCol: '#3a3563', scarf: '#e0b84f' } },
    { name: 'Geoffrey Chaucheese', line: 'Whan that Aprille with his shoures soote… made the cheese go soggy.', look: { fur: '#9a8b7e', belly: '#ddd2c6', hat: 'hood', scarf: '#7a1f2b' } },
  ],
  [ // Music Scores
    { name: 'Ludwig van Squeakhoven', line: 'Da-da-da-DUM! …Sorry. Library. da-da-da-dum.', look: { fur: '#b8aca1', belly: '#efe6dc', scarf: '#6d5fa3' } },
    { name: 'W. A. Mousezart', line: 'Too many notes? Impossible. Too few snacks? Always.', look: { fur: '#efe7dc', belly: '#fffaf2', hat: 'bow', hatCol: '#e8a0bf', scarf: '#f2d27a' } },
  ],
  [ // Legends
    { name: 'Homouse', line: 'Sing, O muse, of the mouse who returned his books on time.', look: { fur: '#e9e2d8', belly: '#fffaf3', hat: 'wizard', hatCol: '#c9a227', scarf: '#2f5d8a' } },
    { name: 'J.R.R. Tolkmouse', line: 'One book to rule them all. Please return it by Tuesday.', look: { fur: '#9a8b7e', belly: '#ddd2c6', hat: 'wizard', hatCol: '#7a8fa6', scarf: '#3d7a5a', glasses: true } },
  ],
];
