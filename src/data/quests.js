import { ROOMS, DECOR } from './rooms.js';

// Hand-written onboarding quests. `hint` drives the tutorial pointer.
// reward: { coins, coinsSec (seconds of income), cheese, book }
export const SCRIPTED = [
  { type: 'jarCollects', target: 1, text: 'Tap the coin jar to collect your coins', reward: { coins: 20 }, hint: 'jar' },
  { type: 'level', room: 0, target: 5, text: 'Grow the Cozy Nook book collection to Lv 5', reward: { coins: 40 }, hint: 'upgrade' },
  { type: 'seats', room: 0, target: 2, text: 'Add a second reading armchair', reward: { cheese: 2 }, hint: 'seats' },
  { type: 'level', room: 0, target: 10, text: 'Reach Lv 10 to double the Cozy Nook’s income', reward: { cheese: 3 }, hint: 'upgrade' },
  { type: 'staff', room: 0, target: 3, text: 'Train your librarian to Lv 3', reward: { coinsSec: 30 }, hint: 'staff' },
  { type: 'decor', room: 0, target: 1, text: 'Decorate the Cozy Nook', reward: { cheese: 3 }, hint: 'decor' },
  { type: 'built', room: 1, target: 1, text: 'Build a new floor: Storybook Corner', reward: { cheese: 5 }, hint: 'build' },
  { type: 'specials', target: 1, text: 'Greet a special guest (tap them when they visit!)', reward: { cheese: 3 } },
  { type: 'shelves', room: 0, target: 2, text: 'Add a second bookshelf to the Cozy Nook', reward: { coinsSec: 60 }, hint: 'shelves' },
  { type: 'bellRings', target: 10, text: 'Ring the librarian’s desk bell 10 times', reward: { cheese: 2 } },
  { type: 'spins', target: 1, text: 'Spin the Lucky Wheel', reward: { cheese: 2 }, hint: 'wheel' },
  { type: 'level', room: 1, target: 25, text: 'Reach Lv 25 in Storybook Corner', reward: { cheese: 5 } },
  { type: 'parcels', target: 1, text: 'Catch a pigeon parcel flying past', reward: { cheese: 3 } },
  { type: 'built', room: 2, target: 1, text: 'Build the Tea & Crumbs Café', reward: { cheese: 8 } },
  { type: 'books', target: 3, text: 'Collect 3 books for your album', reward: { cheese: 5, book: true } },
];

// Endless generated quests once the script runs out.
const CYCLE = ['level', 'built', 'digs', 'seats', 'requests', 'wing', 'mole', 'level', 'decor', 'specials', 'scones', 'staff', 'cats', 'digs', 'mole', 'books', 'shelves', 'wing', 'parcels', 'built', 'fish'];

// H: helpers from the Game that pick sensible (affordable-soon) targets:
//   H.level() -> { i, target } | null, H.cheapest(track) -> room index | null
export function generateQuest(n, s, H) {
  for (let k = 0; k < CYCLE.length; k++) {
    const type = CYCLE[(n + k) % CYCLE.length];
    const tier = Math.min(10, 1 + Math.floor(n / 6));
    switch (type) {
      case 'level': {
        const q = H.level();
        if (q) return { type, room: q.i, target: q.target, text: `Reach Lv ${q.target} in ${ROOMS[q.i].name}`, reward: { coinsSec: 120 * tier, cheese: 2 + tier } };
        break;
      }
      case 'built': {
        const nx = H.nextFloor ? H.nextFloor() : s.rooms.findIndex((r) => !r.built);
        if (nx > 0) return { type, room: nx, target: 1, text: `Build a new floor: ${ROOMS[nx].name}`, reward: { cheese: 6 + nx * 2, coinsSec: 300 } };
        break;
      }
      case 'digs': {
        if (!s.deep?.open || s.deep.tales) break;
        const n2 = Math.min(1 + Math.min(2, Math.floor(n / 20)), H.digsLeft ? H.digsLeft() : 3);
        if (n2 < 1) break;
        return { type, target: n2, text: `Dig ${n2 === 1 ? 'a tunnel' : `${n2} tunnels`} in the Deep Stacks`, reward: { cheese: 3 + n2, coinsSec: 120 * tier } };
      }
      case 'wing': {
        const b = H.wingToBuild?.();
        if (b) return { type: 'wingBuilt', wing: b.id, target: 1, text: `Build ${b.name} next door`, reward: { cheese: 6, coinsSec: 300 } };
        const w = H.wing?.();
        if (w) return { type: 'wingLvl', wing: w.id, target: w.target, text: `Upgrade the ${w.short} to Lv ${w.target}`, reward: { coinsSec: 120 * tier, cheese: 3 + tier } };
        break;
      }
      case 'mole': {
        const m = H.mole?.();
        if (m) { const { lvl, ...q } = m; void lvl; return { ...q, target: q.target ?? 1, reward: { cheese: 4 + Math.min(4, tier), coinsSec: 150 * tier } }; }
        break;
      }
      case 'scones': {
        if (!s.wings?.cafe?.built) break;
        return { type, target: 2, text: 'Serve 2 trays of scones at the café', reward: { cheese: 3, coinsSec: 90 * tier } };
      }
      case 'seats': {
        const i = H.cheapest('seats');
        if (i != null) return { type, room: i, target: s.rooms[i].seats + 1, text: `Add a reading seat in ${ROOMS[i].name}`, reward: { coinsSec: 90 * tier, cheese: 2 } };
        break;
      }
      case 'shelves': {
        const i = H.cheapest('shelves');
        if (i != null) return { type, room: i, target: s.rooms[i].shelves + 1, text: `Add a bookshelf in ${ROOMS[i].name}`, reward: { coinsSec: 120 * tier, cheese: 3 } };
        break;
      }
      case 'staff': {
        const i = H.cheapest('staff');
        if (i != null) { const t = Math.min(20, s.rooms[i].staff + 2); return { type, room: i, target: t, text: `Train the ${ROOMS[i].name} librarian to Lv ${t}`, reward: { coinsSec: 90 * tier, cheese: 2 } }; }
        break;
      }
      case 'decor': {
        const i = H.cheapest('decor');
        if (i != null) { const owned = s.rooms[i].decor.filter(Boolean).length; return { type, room: i, target: owned + 1, text: `Buy ${owned ? 'more ' : ''}décor for ${ROOMS[i].name} (${owned + 1}/${DECOR.length})`, reward: { coinsSec: 90 * tier, cheese: 3 } }; }
        break;
      }
      case 'specials': return { type, target: 2, text: 'Greet 2 special guests', reward: { cheese: 4, coinsSec: 60 * tier } };
      case 'requests': return { type, target: 3, text: 'Help 3 readers find their books (tap the ❓ bubbles)', reward: { cheese: 3, coinsSec: 90 * tier } };
      case 'cats': return { type, target: 1, text: 'Shoo Baroness Clawdia away from a window', reward: { cheese: 4, coinsSec: 90 * tier } };
      case 'fish': return { type, target: 2, text: 'Catch 2 fish at the pond (tap when the float bobs)', reward: { cheese: 2, coinsSec: 60 * tier } };
      case 'parcels': return { type, target: 1, text: 'Catch a pigeon parcel', reward: { cheese: 3, coinsSec: 60 * tier } };
      case 'books': if (H.booksLeft && H.booksLeft() <= 0) break; return { type, target: null, text: 'Collect a new book for your album', reward: { cheese: 5 } };
      default: break;
    }
  }
  return { type: 'specials', target: 1, text: 'Greet a special guest', reward: { cheese: 3 } };
}

export const DAILY = [
  { coinsSec: 600, label: '10 min coins', icon: 'coin' },
  { cheese: 5, label: '5 Cheese', icon: 'cheese' },
  { book: true, label: 'Mystery Book', icon: 'book' },
  { coinsSec: 1800, label: '30 min coins', icon: 'coin' },
  { cheese: 10, label: '10 Cheese', icon: 'cheese' },
  { boost: 3600, label: '1h Story Hour', icon: 'boost' },
  { cheese: 25, book: true, coinsSec: 3600, label: 'Grand Chest', icon: 'chest' },
];

// Lucky wheel segments (clockwise from the top).
export const WHEEL = [
  { coinsSec: 300, w: 22, label: '5m', icon: 'coin', color: '#f6d67a' },
  { cheese: 3, w: 18, label: '3', icon: 'cheese', color: '#f7b267' },
  { coinsSec: 900, w: 16, label: '15m', icon: 'coin', color: '#a3d9a5' },
  { boost: 900, w: 12, label: '×2', icon: 'boost', color: '#9ec5f0' },
  { book: true, w: 10, label: 'Book', icon: 'book', color: '#d4b3f0' },
  { cheese: 10, w: 8, label: '10', icon: 'cheese', color: '#f49d9d' },
  { coinsSec: 3600, w: 6, label: '1h', icon: 'coin', color: '#8fd3c7' },
  { cheese: 30, w: 3, label: 'JACKPOT', icon: 'cheese', color: '#ffd24a' },
];

export const SHOP = {
  jar: [{ sec: 600 }, { sec: 1200, cost: 20 }, { sec: 2400, cost: 50 }, { sec: 5400, cost: 120 }, { sec: 10800, cost: 250 }],
  offline: [{ sec: 7200 }, { sec: 14400, cost: 25 }, { sec: 28800, cost: 60 }, { sec: 43200, cost: 140 }, { sec: 86400, cost: 300 }],
  perm: [100, 300, 900, 2700, 8100],
  warp: [{ sec: 3600, cost: 30 }, { sec: 4 * 3600, cost: 100 }, { sec: 12 * 3600, cost: 250 }],
  crate: 15,
  adCheese: 5,
  adCheeseDaily: 5,
};

// The mystery gift box that turns up on the doorstep (open it with an optional ad, or just peek).
export const GIFT = { firstSec: 240, everySec: [420, 720], daily: 6, coinsSec: 900, cheese: [4, 8], furnitureChance: 0.2, bookChance: 0.3, peekSec: 45 };
