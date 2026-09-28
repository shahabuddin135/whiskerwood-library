// Quick tasks: three short goals always on screen. Finish all three for a bonus chest.
// `event: true` tasks depend on random events, so at most one appears per set.
// text(n, ctx): ctx = { loc (location info), fest (running festival or null) }
const LOCALE_TEXT = {
  fishing: (n) => `Catch ${n} fish at the pond`, bottles: (n) => `Open ${n} bottle${n > 1 ? 's' : ''} on the beach`,
  glowcaps: (n) => `Harvest ${n} glowcaps`, capsules: (n) => `Catch ${n} book-tube capsule${n > 1 ? 's' : ''}`,
  bookwyrm: () => 'Catch a book from Sir Reginald', whale: () => 'Tap the cloud whale’s spout',
};
export const localeText = (mech, n) => LOCALE_TEXT[mech](n);
const LOCALE_BASE = { fishing: 1, bottles: 2, glowcaps: 4, capsules: 2, bookwyrm: 1, whale: 1 };

export const TASK_POOL = [
  { type: 'pets', icon: 'heart', base: 3, text: (n) => `Pet ${n} mice (tap a reader)` },
  { type: 'locale', icon: 'locale', base: 1, text: (n, c) => LOCALE_TEXT[c.loc.mechanic.id](n), baseFor: (c) => LOCALE_BASE[c.loc.mechanic.id] },
  { type: 'bellRings', icon: 'bell', base: 12, text: (n) => `Ring the desk bell ${n} times` },
  { type: 'jarCollects', icon: 'jar', base: 3, text: (n) => `Empty the coin jar ${n} times` },
  { type: 'upgrades', icon: 'hammer', base: 12, text: (n) => `Buy ${n} upgrades` },
  { type: 'requests', icon: 'book', base: 2, text: (n) => `Find ${n} books for readers (tap the ? bubbles)` },
  { type: 'curios', icon: 'curio', base: 2, minQuest: 4, text: (n) => `Poke ${n} centrepieces (tap the clocks, globes…)` },
  { type: 'specials', icon: 'star', base: 1, event: true, text: (n) => `Greet ${n} special guest${n > 1 ? 's' : ''}` },
  { type: 'regulars', icon: 'friends', base: 1, event: true, minQuest: 6, text: () => 'Chat with a regular (look for name tags)' },
  { type: 'cats', icon: 'cat', base: 1, event: true, minQuest: 8, text: () => 'Shoo Baroness Clawdia away' },
  { type: 'worms', icon: 'bug', base: 4, event: true, minQuest: 8, text: (n) => `Squish ${n} bookworms` },
  { type: 'parcels', icon: 'parcel', base: 1, event: true, minQuest: 5, text: () => 'Catch a pigeon parcel' },
  { type: 'balloons', icon: 'balloon', base: 1, event: true, minQuest: 6, text: () => 'Tap a hot-air balloon' },
  { type: 'lostBooks', icon: 'magnifier', base: 1, event: true, minQuest: 8, text: () => 'Find a lost book' },
  { type: 'tokens', icon: 'festival', base: 5, festival: true, text: (n, c) => `Collect ${n} festival ${c.fest.token.name.toLowerCase()}` },
];

export const TASK_CHEST = { cheese: 4, bookChance: 0.35, coinsSec: 180 };
