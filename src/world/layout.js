// World geometry (world units; y grows downward, the ground floor sits at y = 0).
export const W = 440; // world width
export const BX0 = 36; // building outer left
export const BX1 = 404; // building outer right
export const WALL = 8; // outer wall thickness
export const IX = BX0 + WALL; // interior left (x of local 0)
export const IW = BX1 - BX0 - WALL * 2; // interior width = 352
export const FH = 190; // floor height
export const GROUND_H = 230; // garden below the ground floor
export const ROOF_H = 120;

// Interior-local layout (0..IW, 0..FH)
export const L = {
  wallBottom: 148,
  floorTop: 148,
  laneBack: 161,
  laneFront: 169,
  beamTop: 172,
  hole: { x: 6, w: 22, top: 122 },
  holeX: 17,
  shelves: [36, 92, 148, 204],
  shelfW: 52,
  shelfTop: 50,
  shelfBot: 150,
  seats: [52, 88, 124, 160, 196, 232],
  seatFacing: [1, -1, 1, -1, 1, -1],
  center: 260,
  desk: { x0: 278, x1: 348, top: 130, base: 162 },
  payX: 300,
  librarianX: 322,
  window: { x: 286, y: 14, w: 52, h: 70 },
  art: { x: 38, y: 9, w: 42, h: 32 },
  plaque: { x: 104, y: 9, w: 148, h: 28 },
  lamps: [92, 266],
  stageX: 150,
};

export const floorTop = (i) => -(i + 1) * FH;
