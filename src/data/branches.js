// Prestige locations. Each "New Branch" moves the library to a new countryside spot.
export const BRANCHES = [
  { id: 'meadow', name: 'Meadow Burrow', mult: 1, scene: 'meadow', blurb: 'Rolling hills, hay bales and golden wheat fields.' },
  { id: 'windmill', name: 'Windmill Hill', mult: 1.5, scene: 'windmill', blurb: 'A creaky old windmill turns over the barley farms.' },
  { id: 'cove', name: 'Lighthouse Cove', mult: 2.5, scene: 'cove', blurb: 'Salty breeze, sailboats and a beacon that never sleeps.' },
  { id: 'pond', name: 'Willow Pond', mult: 4, scene: 'pond', blurb: 'Weeping willows, lily pads and mice fishing at dusk.' },
  { id: 'castle', name: 'Moonlit Castle', mult: 7, scene: 'castle', blurb: 'A fairy-tale castle town beneath a silver moon.' },
];

export function branchInfo(i) {
  const b = BRANCHES[i % BRANCHES.length];
  const cycle = Math.floor(i / BRANCHES.length);
  return { ...b, name: cycle ? `${b.name} ${['', 'II', 'III', 'IV', 'V', 'VI'][cycle] || cycle + 1}` : b.name, mult: b.mult * Math.pow(10, cycle) };
}
