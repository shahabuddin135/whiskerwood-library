// The Whiskerwood Gazette: a fresh edition every day, printed by the Inky Paw Printing Press.
// Headlines come from what's actually happening in your library, mixed with the town's gossip.
import { branchInfo } from './branches.js';
import { FOSSILS } from './deep.js';
import { rng } from '../world/draw.js';

const h = (title, text) => ({ title, text });
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// News about your own library (only the ones that are true today).
function localNews(s, g) {
  const out = [];
  const floors = g.builtCount();
  const halls = g.hallsDone();
  if (floors >= 3) out.push(h(`LIBRARY NOW ${floors} FLOORS TALL; MAYOR DEMANDS A LIFT`, 'Mayor Gruyère, who lives on the ground floor, called the stairs “a personal insult” and then took a nap on the landing.'));
  if (s.branch > 0) out.push(h(`LIBRARY SETTLES IN AT ${branchInfo(s.branch).name.toUpperCase()}`, 'Residents are delighted. Pigeons are confused. The removal mice have asked never to hear the word “bookcase” again.'));
  if (halls >= 1) out.push(h(`MOLES UNCOVER ${plural(halls, 'LOST HALL', 'LOST HALLS').toUpperCase()} BENEATH THE VAULT`, 'Also recovered: one extremely old sandwich. Experts urge the public not to eat the sandwich.'));
  if (halls >= 5) out.push(h('RATTIGAN SEEN HELPING OLD LADY ACROSS ROAD; POLICE BAFFLED', '“I’m reformed,” he told our reporter, before returning the reporter’s pencil, which nobody had noticed was missing.'));
  if (s.deep?.tales) out.push(h('DRAGON REQUESTS SEQUEL', 'Umber, aged roughly four hundred, would like “more of the one with the socks”. Volunteers for the reading rota should apply at the Lantern Stair.'));
  if ((s.stats.scones || 0) >= 3) out.push(h(`CAFÉ SERVES ${s.stats.scones} TRAYS OF SCONES; CRUMB LEVELS “CRITICAL”`, 'Chef Gustavo denies everything. His apron, covered in jam, tells a different story.'));
  if ((s.stats.clubs || 0) >= 2) out.push(h('KNITTING CIRCLE SCARF NOW VISIBLE FROM THE WINDMILL', 'The scarf, begun on a Tuesday, has been described as “ambitious”, “long” and “a tripping hazard”.'));
  const found = FOSSILS.filter((f) => s.deep?.fossils?.[f.id]);
  if (found.length && s.wings?.museum?.built) { const f = found[found.length - 1]; out.push(h(`MUSEUM UNVEILS ${f.name.toUpperCase()}; CHILDREN SCREAM WITH JOY`, `${f.desc} Professor Marrowby asks visitors to stop trying to feed it.`)); }
  if ((s.stats.specials || 0) >= 5) out.push(h(`${s.stats.specials} FAMOUS GUESTS AND COUNTING: LIBRARY RUNS OUT OF AUTOGRAPH PENS`, 'Staff are now signing books with crayons. Nobody has complained. One author asked to keep the crayon.'));
  if ((s.stats.cats || 0) >= 1) out.push(h('BARONESS CLAWDIA DENIES KNOCKING VASE OFF WINDOWSILL “FOR FUN”', '“It was for science,” she said, and knocked over our reporter’s tea to demonstrate.'));
  const fest = g.festival();
  if (fest) out.push(h(`${fest.name.toUpperCase()}: “BEST ONE YET,” SAYS EVERYONE, AS EVERY YEAR`, 'The library is decorated from mousehole to rooftop. The Gazette recommends a warm drink and a long book.'));
  return out;
}

const GOSSIP = [
  h('BOOK CLUB FINISHES A BOOK; MEMBERS STUNNED', 'It is the first time in eleven years. “We didn’t know books had endings,” said one member, visibly shaken.'),
  h('LOCAL MOUSE READS LAST PAGE FIRST, REGRETS NOTHING', '“Now I can relax and enjoy the middle,” she said, calmly, while everyone else screamed.'),
  h('CHEESE PRICES STABLE; MICE UNSTABLE', 'Economists blame the weather, the moon, and “that one mouse who buys all the brie”.'),
  h('SNAIL WINS RACE AGAINST NOBODY', '“I trained for years,” said the snail, who was the only entrant, and who is still crossing the finish line.'),
  h('PIGEON DELIVERS PARCEL TO THE CORRECT ADDRESS', 'Neighbours describe the experience as “unsettling” and “against nature”.'),
  h('CRITIC GIVES SCONE FIVE STARS, THEN EATS THE STARS', 'Monsieur Fromage later clarified that the stars were “also delicious”.'),
  h('LIBRARIAN SHUSHES THUNDERSTORM; STORM APOLOGISES', 'The storm has promised to rumble more quietly in future, especially near the Poetry section.'),
  h('MAYOR’S SPEECH ENTERS ITS THIRD WEEK', 'Listeners report that he has reached “Halls in the Modern Age”. Sandwiches are being passed in through the windows.'),
  h('BOOKWORM ARRESTED FOR EATING A THESAURUS', 'Police say he also devoured, consumed, ingested, scoffed and wolfed it.'),
  h('LOCAL FROG STILL NOT A PRINCE', '“I have been kissed four times this week,” he said. “Nothing. Not even a small crown.”'),
  h('A CORRECTION', 'In yesterday’s Gazette, “LIBARY” should have read “LIBRARY”. We regert the error.'),
  h('SOCK THIEF STRIKES AGAIN', 'Only left socks have been taken. Detectives believe the thief has one very cold foot.'),
  h('HEDGEHOG OPENS HAIR SALON', 'Business is slow. “Nobody trusts my styling advice,” he admits, spikily.'),
  h('WEATHERMOUSE PREDICTS WEATHER', 'For the first time in her career she was right. She has retired at the top of her game.'),
];

const ADS = [
  'LOST: one left sock. Great sentimental value. Reward: cheese.',
  'FOR SALE: slightly haunted bookmark. Keeps your place AND your secrets.',
  'WANTED: somebody to explain the ending of Chapter 9. Serious enquiries only.',
  'FREE TO A GOOD HOME: forty-one scarves. Ask for the Baroness.',
  'CHEESE WHEEL, barely rolled. One careful owner. Offers.',
  'PIANO LESSONS. Slightly out of tune. So is the teacher.',
  'ROOM TO LET in a teapot. Cosy. Occasionally hot.',
  'SEEKING: a pen pal who loves long books and short walks.',
];
const DRAGON_AD = 'TUTOR WANTED: I would like to learn to read. Must not be afraid of large, polite lizards. — U.';

const STARS = {
  spring: 'Mice born in Spring: a book will find you this week. Let it.',
  summer: 'Mice born in Summer: take your reading outside. The sun is also a lamp.',
  autumn: 'Mice born in Autumn: a warm drink and a mystery novel are in your future.',
  winter: 'Mice born in Winter: your tea is going cold. Drink it. Then read.',
};

export function todaysGazette(g) {
  const s = g.s;
  const day = new Date(); const key = day.getFullYear() * 1000 + day.getMonth() * 40 + day.getDate();
  const R = rng(key);
  const shuffle = (a) => a.map((x) => [R(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const local = shuffle(localNews(s, g));
  const gossip = shuffle(GOSSIP);
  const headlines = [...local.slice(0, 2), ...gossip].slice(0, 3);
  if (headlines.length < 3) headlines.push(...gossip.slice(3, 3 + (3 - headlines.length)));
  const ads = shuffle(s.deep?.tales ? [DRAGON_AD, ...ADS] : ADS).slice(0, 2);
  const cal = g.calendar();
  const season = ['spring', 'summer', 'autumn', 'winter'][cal.idx];
  const created = s.created || Date.now();
  const edition = 1 + Math.max(0, Math.floor((Date.now() - created) / 86400000));
  return { headlines, ads, stars: STARS[season], edition, year: cal.year, season };
}
