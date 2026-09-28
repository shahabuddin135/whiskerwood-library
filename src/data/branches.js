// Prestige locations. Each "New Branch" moves the library to a new countryside spot.
// Each branch has its own library building (roof + walls) and garden landscaping.
export const BRANCHES = [
  { id: 'meadow', name: 'Meadow Burrow', mult: 1, scene: 'meadow', art: '🌾🏡🐭', blurb: 'Rolling hills, hay bales and golden wheat fields.', building: 'A cosy cottage library with a red tiled roof and a crooked chimney.' },
  { id: 'windmill', name: 'Windmill Hill', mult: 1.5, scene: 'windmill', art: '🌬️🌾🐭', blurb: 'A creaky old windmill turns over the barley farms.', building: 'A timber farmhouse library with a golden thatched roof and its very own windmill.' },
  { id: 'cove', name: 'Lighthouse Cove', mult: 2.5, scene: 'cove', art: '🌊⚓🐭', blurb: 'Salty breeze, sailboats and a beacon that never sleeps.', building: 'A blue clapboard library by the sea, crowned with a working lighthouse lamp.' },
  { id: 'pond', name: 'Willow Pond', mult: 4, scene: 'pond', art: '🪷🐸🐭', blurb: 'Weeping willows, lily pads and mice fishing at dusk.', building: 'A mossy boathouse library with a curved shingle roof and paper lanterns.' },
  { id: 'castle', name: 'Moonlit Castle', mult: 7, scene: 'castle', art: '🏰🌙🐭', blurb: 'A fairy-tale castle town beneath a silver moon.', building: 'A stone library keep with two turrets, royal banners and a drawbridge garden.' },
];

export function branchInfo(i) {
  const b = BRANCHES[i % BRANCHES.length];
  const cycle = Math.floor(i / BRANCHES.length);
  return { ...b, name: cycle ? `${b.name} ${['', 'II', 'III', 'IV', 'V', 'VI'][cycle] || cycle + 1}` : b.name, mult: b.mult * Math.pow(10, cycle) };
}
