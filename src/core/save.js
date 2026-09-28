import { ROOMS } from '../data/rooms.js';
import { LOCATIONS } from '../data/locations.js';
import { newRoomState } from './economy.js';

const KEY = 'whiskerwood-library-save';
const VERSION = 2;

export function freshState() {
  const now = Date.now();
  return {
    v: VERSION,
    coins: 0,
    cheese: 5,
    quills: 0,
    jar: 12, // a small welcome gift so the very first tap pays out
    totalEarned: 0,
    branchEarned: 0,
    branch: 0,
    rooms: ROOMS.map((_, i) => newRoomState(i === 0)),
    boostEnd: 0,
    boosts: [],
    album: {},
    questIdx: 0,
    questBase: {},
    stats: {
      jarCollects: 0, specials: 0, spins: 0, parcels: 0, purchases: 0, adsWatched: 0, floorsBuilt: 0, prestiges: 0, bellRings: 0,
      upgrades: 0, pets: 0, fish: 0, requests: 0, cats: 0, worms: 0, lostBooks: 0, thieves: 0, balloons: 0, wishes: 0, critics: 0,
      locale: 0, regulars: 0, curios: 0, tokens: 0, chests: 0, spoilers: 0, debates: 0,
    },
    // ----- kept forever (the "legacy": moves with you to every location) -----
    furniture: { owned: {}, floors: {}, hat: null, garden: null },
    stamps: [], // locations you have moved on from (each grants its perk)
    trophies: [], // locations where you built all 10 floors
    souvenirs: {},
    regulars: {}, // regular id -> story step (4 = finished)
    fbooks: {}, // festival books
    visited: { meadow: 1 },
    festival: { key: '', tokens: 0, got: 0, base: {}, claimed: [], gift: '' },
    ads: { day: '', used: {}, next: {} }, // rewarded-ad offer cooldowns & daily caps
    adChest: { next: 0 },
    deal: { day: '', used: false },
    tasks: null,
    story: { seen: [] },
    flags: {},
    daily: { last: '', streak: 0 },
    wheel: { lastFree: 0, adDay: '', adUsed: 0 },
    shop: { jar: 0, offline: 0, perm: 0, cheeseDay: '', cheeseUsed: 0 },
    xp: 0,
    rep: 1,
    settings: { music: true, sfx: true, haptics: true, notifications: true, chatter: true, festivals: true, musicVol: 0.6, sfxVol: 0.9 },
    removeAds: false,
    cooldowns: { jarDouble: 0, freeUpgrade: 0 },
    lastSeen: now,
    created: now,
  };
}

// Fill in any fields missing from older saves.
function migrate(s) {
  const base = freshState();
  for (const k of Object.keys(base)) if (s[k] === undefined) s[k] = base[k];
  const v1 = (s.v || 1) < 2;
  for (const k of ['stats', 'daily', 'wheel', 'shop', 'settings', 'cooldowns', 'story', 'flags', 'furniture', 'festival', 'ads', 'adChest', 'deal']) s[k] = { ...base[k], ...s[k] };
  // v1 -> v2: "branches" became world locations; stamp the ones already left behind.
  if (v1) for (let k = 0; k < (s.branch || 0) && k < LOCATIONS.length; k++) if (!s.stamps.includes(LOCATIONS[k].id)) s.stamps.push(LOCATIONS[k].id);
  if (!Array.isArray(s.stamps)) s.stamps = [];
  if (!Array.isArray(s.trophies)) s.trophies = [];
  if (!Array.isArray(s.story.seen)) s.story.seen = [];
  s.rooms = ROOMS.map((_, i) => ({ ...newRoomState(i === 0), ...(s.rooms?.[i] || {}) }));
  s.rooms.forEach((r) => { if (!Array.isArray(r.decor) || r.decor.length !== 5) r.decor = [false, false, false, false, false]; });
  s.v = VERSION;
  return s;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('Save load failed', e);
    return null;
  }
}

export function saveState(s) {
  try {
    s.lastSeen = Date.now();
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('Save failed', e);
  }
}

export function wipeSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
