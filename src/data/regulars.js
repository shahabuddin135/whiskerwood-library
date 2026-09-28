// The regulars: named readers who keep coming back (and follow you to every new location).
// Each visit, tap them to play the next scene of their little story. Finishing a story
// gives a unique gift and a permanent +5% income. Friendships are never reset.

export const REGULAR_BONUS = 0.05;

export const REGULARS = [
  {
    id: 'barnaby', name: 'Barnaby Bluffington', title: 'Has read everything (allegedly)', gift: 'tophat',
    lines: ['Ah, yes. Read it. Loved it. Twice.', 'I prefer the original. In Ancient Mouse.', 'The ending? Oh, it was… very ending-ish.', 'Classic. Very… bound. Nicely bound.'],
    done: ['I finished a picture book! In PUBLIC!', 'Page 4 of a real novel. I am a changed mouse.'],
    arc: [
      [['barnaby', 'Ah, “War and Cheese”! Read it twice. In the original Mouse.'], ['pip', 'It was written in Mouse.'], ['barnaby', '…Three times, then.']],
      [['barnaby', 'The ending of “Moby-Dip” made me weep. When the whale— the pool— the, erm…'], ['pip', 'Barnaby. Have you read it?'], ['barnaby', 'I have read the back cover. With enormous feeling.']],
      [['barnaby', 'Pip, I must confess. I have never finished a book. I get to page three and panic.'], ['pip', 'Then let’s start small. Picture books have lovely short pages.'], ['barnaby', 'Short pages… I could do short pages.']],
      [['barnaby', 'I FINISHED IT! “Goodnight, Little Crumb”! The crumb… it said goodnight…'], ['pip', 'I’m so proud of you, Barnaby.'], ['barnaby', 'Please, take my lucky top hat. Let your librarians wear it with pride.']],
    ],
  },
  {
    id: 'squeaky', name: 'Squeaky Spoilsworth', title: 'Cannot keep an ending to himself', gift: 'headphones',
    lines: ['Oh I LOVE that one! The twist is—', 'Don’t worry, I won’t spoil it. (The dog lives.)', 'Guess who did it! …it was the cat.', 'Page 300 is WILD. Well, for the mayor.'],
    done: ['Spoilers ahead! …that’s all. I’m learning!', 'I will not say it. I will NOT say it.'],
    arc: [
      [['squeaky', 'Hi! I’m new! I love that book! The detective is the cat!'], ['reader', 'I WAS ON PAGE TWO.'], ['pip', 'Squeaky, we have talked about this…']],
      [['squeaky', 'I’ve been practising! Watch: “This book has an ending.”'], ['pip', '…that’s actually fine!'], ['squeaky', 'And the ending is the butler!'], ['pip', 'SQUEAKY.']],
      [['squeaky', 'I got a job at the cinema! I tell everyone who dies as they buy popcorn.'], ['pip', 'They hired you for that?'], ['squeaky', 'They didn’t hire me. I just stand there.']],
      [['squeaky', 'I wrote my own book! Chapter one: everybody lives. You’re welcome.'], ['pip', 'Squeaky… that’s actually lovely.'], ['squeaky', 'Here. Spoiler-proof earmuffs. For your librarians. Protect them from people like me.']],
    ],
  },
  {
    id: 'doris', name: 'Doris Dogear', title: 'Folds the corner of every page', gift: 'bookmarks',
    lines: ['*fold*', 'Just marking my place, dear.', 'Page 212. *fold* Page 213. *fold*', 'A bookmark? Whatever for?'],
    done: ['Bookmark number 312. It has a tassel!', 'I haven’t folded a page in a week. I feel strange.'],
    arc: [
      [['pip', 'Doris! Did you fold the corner of page 212?'], ['doris', 'It was marking my place, dear!'], ['pip', 'We have BOOKMARKS.'], ['doris', 'Bookmarks fall out. Folds are forever.']],
      [['doris', 'I have folded so many corners that this book is now a triangle.'], ['pip', 'It’s a pyramid, Doris. You made a pyramid.']],
      [['pip', 'Doris, I made you a bookmark. It has a tassel.'], ['doris', 'A… tassel? For me?'], ['doris', 'Oh, it’s beautiful. I shall never fold again. Probably.']],
      [['doris', 'I now own four hundred bookmarks. I use them all. At once.'], ['pip', 'That’s… one per page.'], ['doris', 'Exactly! Here, take the whole collection for your vault. I’ll start a new one.']],
    ],
  },
  {
    id: 'filmore', name: 'Filmore Reel', title: 'Honestly prefers the movie', gift: 'popcorn',
    lines: ['The movie was better.', 'Is there a film of this? There should be a film of this.', 'I’m waiting for the adaptation.', 'Needs more explosions.'],
    done: ['The book really was better. Don’t tell anyone.', 'I’m reading the book of the movie of the book. Full circle.'],
    arc: [
      [['filmore', 'Honestly? The movie was better.'], ['reader', 'GASP!'], ['reader', 'TAKE. THAT. BACK.']],
      [['filmore', 'Look, I’m reading! It’s the novelisation of the movie of the book.'], ['pip', 'So… the book?'], ['filmore', 'The EXCITING version of the book.']],
      [['filmore', 'I’m directing an adaptation of “War and Cheese”! Eleven minutes long.'], ['pip', 'It’s fourteen hundred pages!'], ['filmore', 'We cut the war. And the cheese. It’s mostly a horse now.']],
      [['filmore', 'The premiere flopped. Everyone said “the book was better”.'], ['filmore', '…They were right. I read it. I cried in chapter nine.'], ['filmore', 'Take my popcorn machine. For watching the book. It still counts.']],
    ],
  },
  {
    id: 'footnote', name: 'Professor Footnote', title: 'Technically correct. Always.', gift: 'diploma',
    lines: ['Technically¹, that shelf is a bookcase². ¹ ² citation needed', 'Actually, it’s pronounced “Gouda”. As in “good-ah”.', 'Ahem. There’s a comma missing on page 4.', 'Well, ACTUALLY…'],
    done: ['I was wrong once. It was lovely. Never again.', 'I have learned to let a typo go. Page 9. It haunts me.'],
    arc: [
      [['footnote', 'Technically¹, your “bookshelf” is a “bookcase”². ¹ Citation needed. ² Also citation needed.'], ['pip', 'Good morning to you too, Professor.']],
      [['footnote', 'I have written a nine-hundred-page book correcting a ninety-page book.'], ['pip', 'Which book?'], ['footnote', '“Goodnight, Little Crumb”. The moon is NOT made of cheese.'], ['pip', 'That’s a different book, Professor.']],
      [['footnote', 'Pip. I found a typo in my own book.'], ['pip', 'Oh no. Where?'], ['footnote', 'On the cover. In my name. It says “Profesor”.']],
      [['footnote', 'I have decided it is fine to be wrong sometimes.¹'], ['footnote', '¹ Not today, though.'], ['footnote', 'Please accept my diploma. I awarded it to myself. It is technically correct.']],
    ],
  },
  {
    id: 'granny', name: 'Granny Crumbcake', title: 'Gives terrible recommendations', gift: 'knitrug',
    lines: ['For you, sweetie: a 900-page history of tax law!', 'Have you tried “Dust: A Very Long History”?', 'Ooh, this one has a lovely font.', 'I knitted a cover for this book. And the next one.'],
    done: ['My book club finished a book! We started in spring.', 'I recommended a GOOD book today! By accident!'],
    arc: [
      [['granny', 'Here you are, little one: “The Complete History of Tax Law”, 1,200 pages. It has a lovely font.'], ['reader', 'I’m… four.'], ['granny', 'Then you’ll have plenty of time!']],
      [['granny', 'I recommended “The Very Hungry Mouse” to a cat.'], ['pip', 'Oh no.'], ['granny', 'It went badly. For the book.']],
      [['granny', 'I started a book club! We’ve read one book in two years.'], ['pip', 'Which book?'], ['granny', 'Mostly we eat cake. The book was about cake.']],
      [['granny', 'I knitted you a rug, dear. It says READ.'], ['pip', 'It says… “RAED”.'], ['granny', 'It’s artistic. Put it somewhere cosy.']],
    ],
  },
  {
    id: 'tomasina', name: 'Tomasina Tome', title: 'Reads the last page first', gift: 'backclock',
    lines: ['I always read the last page first.', 'Oh good, they get married. NOW I can start.', 'Page 1? How barbaric.', 'I know how it ends. That’s the fun part!'],
    done: ['I read a book front to back. My whiskers are still shaking.', 'Middle first today. Trying new things.'],
    arc: [
      [['tomasina', 'I always read the last page first. That way I know if it’s worth it.'], ['pip', 'Isn’t that… cheating?'], ['tomasina', 'It’s being PREPARED.']],
      [['tomasina', 'I read this mystery backwards. It starts with an arrest and ends at a lovely dinner party.'], ['pip', 'That sounds nicer, honestly.']],
      [['tomasina', 'I tried reading the first page first.'], ['tomasina', 'It was TERRIFYING. I didn’t know ANYTHING!'], ['pip', 'That’s… how everyone reads.'], ['tomasina', 'How do you all LIVE like this?']],
      [['tomasina', 'Pip, I did it. Front to back. I have never been so stressed or so happy.'], ['tomasina', 'Take my backwards clock. I don’t need it any more. Probably.']],
    ],
  },
];

export const REGULAR = Object.fromEntries(REGULARS.map((r) => [r.id, r]));
