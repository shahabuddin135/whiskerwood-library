// Quick tasks: three short goals always on screen. Finish all three for a bonus chest.
// `event: true` tasks depend on random events, so at most one appears per set.
export const TASK_POOL = [
  { type: 'pets', icon: '💗', base: 3, text: (n) => `Pet ${n} mice (tap a reader)` },
  { type: 'fish', icon: '🐟', base: 1, text: (n) => `Catch ${n} fish at the pond` },
  { type: 'bellRings', icon: '🔔', base: 12, text: (n) => `Ring the desk bell ${n} times` },
  { type: 'jarCollects', icon: '🫙', base: 3, text: (n) => `Empty the coin jar ${n} times` },
  { type: 'upgrades', icon: '🔨', base: 12, text: (n) => `Buy ${n} upgrades` },
  { type: 'requests', icon: '📕', base: 2, text: (n) => `Find ${n} books for readers (tap the ? bubbles)` },
  { type: 'specials', icon: '⭐', base: 1, event: true, text: (n) => `Greet ${n} special guest${n > 1 ? 's' : ''}` },
  { type: 'cats', icon: '🐱', base: 1, event: true, minQuest: 8, text: () => 'Shoo Baroness Clawdia away' },
  { type: 'worms', icon: '🐛', base: 4, event: true, minQuest: 8, text: (n) => `Squish ${n} bookworms` },
  { type: 'parcels', icon: '📦', base: 1, event: true, minQuest: 5, text: () => 'Catch a pigeon parcel' },
  { type: 'balloons', icon: '🎈', base: 1, event: true, minQuest: 6, text: () => 'Tap a hot-air balloon' },
  { type: 'lostBooks', icon: '🔍', base: 1, event: true, minQuest: 8, text: () => 'Find a lost book' },
];

export const TASK_CHEST = { cheese: 4, bookChance: 0.35, coinsSec: 180 };
