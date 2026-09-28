// Finds floor unlock costs that hit target unlock times (sequential binary search).
// Usage: node scripts/tune.mjs   -> prints an UNLOCK array to paste into src/data/rooms.js
import { ROOMS } from '../src/data/rooms.js';
import { simulate } from './simulate.mjs';

const TARGET_MIN = [0, 1.5, 4, 8, 14, 22, 32, 45, 65, 95];
const result = [0];
for (let k = 1; k < ROOMS.length; k++) {
  let lo = Math.log10(ROOMS[k - 1].unlock || 100), hi = lo + 6;
  for (let it = 0; it < 30; it++) {
    const mid = (lo + hi) / 2;
    ROOMS[k].unlock = Math.pow(10, mid);
    const { builtAt } = simulate({ hours: TARGET_MIN[k] / 60 * 2 + 0.2, stopAfterRoom: k });
    const at = builtAt[k] ?? Infinity;
    if (at < TARGET_MIN[k] * 60) lo = mid; else hi = mid;
  }
  const v = Number(Math.pow(10, lo).toPrecision(2));
  ROOMS[k].unlock = v; result.push(v);
  console.log(`floor ${k} ${ROOMS[k].name.padEnd(24)} unlock ${v.toExponential(1)}  target ${TARGET_MIN[k]}m`);
}
console.log(`const UNLOCK = [${result.map((v) => (v === 0 ? '0' : v.toExponential(1).replace('e+', 'e'))).join(', ')}];`);
