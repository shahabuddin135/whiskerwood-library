// Library sites. Moving is how the library grows: you buy the land at a bigger site, the movers get
// it ready, and then the whole library moves in: every floor, wing, level, book and piece of
// furniture comes along. Only the coins you paid for the land are gone.
// Each site holds more floors and has more wing plots (side buildings) than the last.
//   floors: how many floors the building can hold · plots: wing plots beside it
//   cost: coins to buy the land · prep: seconds the movers need to get the new site ready
export const BRANCHES = [
  { id: 'meadow', name: 'Meadow Burrow', mult: 1, floors: 4, plots: 1, cost: 0, prep: 0, scene: 'meadow', art: '🌾🏡🐭', blurb: 'Rolling hills, hay bales and golden wheat fields.', building: 'A cosy cottage library with a red tiled roof and a crooked chimney.' },
  { id: 'windmill', name: 'Windmill Hill', mult: 1.25, floors: 6, plots: 2, cost: 4e9, prep: 10 * 60, scene: 'windmill', art: '🌬️🌾🐭', blurb: 'A creaky old windmill turns over the barley farms.', building: 'A timber farmhouse library with a golden thatched roof and its very own windmill.' },
  { id: 'cove', name: 'Lighthouse Cove', mult: 1.5, floors: 8, plots: 3, cost: 2e13, prep: 40 * 60, scene: 'cove', art: '🌊⚓🐭', blurb: 'Salty breeze, sailboats and a beacon that never sleeps.', building: 'A blue clapboard library by the sea, crowned with a working lighthouse lamp.' },
  { id: 'pond', name: 'Willow Pond', mult: 2, floors: 9, plots: 4, cost: 3e15, prep: 90 * 60, scene: 'pond', art: '🪷🐸🐭', blurb: 'Weeping willows, lily pads and mice fishing at dusk.', building: 'A mossy boathouse library with a curved shingle roof and paper lanterns.' },
  { id: 'castle', name: 'Moonlit Castle', mult: 3, floors: 10, plots: 4, cost: 4e17, prep: 3 * 3600, scene: 'castle', art: '🏰🌙🐭', blurb: 'A fairy-tale castle town beneath a silver moon.', building: 'A stone library keep with two turrets, royal banners and a drawbridge garden.' },
];

// After Moonlit Castle the grand tour starts again (Meadow Burrow II…), with every floor and plot
// open, a much bigger branch bonus and a much pricier plot of land.
export function branchInfo(i) {
  const b = BRANCHES[i % BRANCHES.length];
  const cycle = Math.floor(i / BRANCHES.length);
  const last = BRANCHES[BRANCHES.length - 1];
  if (!cycle) return { ...b, index: i };
  return {
    ...b, index: i,
    name: `${b.name} ${['', 'II', 'III', 'IV', 'V', 'VI'][cycle] || cycle + 1}`,
    mult: b.mult * Math.pow(4, cycle) * last.mult,
    floors: last.floors, plots: last.plots,
    cost: last.cost * Math.pow(500, i - (BRANCHES.length - 1)),
    prep: last.prep,
  };
}
