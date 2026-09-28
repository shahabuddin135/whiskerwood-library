import { ROOMS } from '../data/rooms.js';
import { newRoomState } from './economy.js';
import { FURN } from '../data/furniture.js';

const KEY = 'whiskerwood-library-save';
const VERSION = 1;

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
    branchStart: now, // when the library arrived at this branch (the moving van needs a rest)
    rooms: ROOMS.map((_, i) => newRoomState(i === 0)),
    boostEnd: 0,
    boosts: [],
    album: {},
    questIdx: 0,
    questBase: {},
    stats: {
      jarCollects: 0, specials: 0, spins: 0, parcels: 0, purchases: 0, adsWatched: 0, floorsBuilt: 0, prestiges: 0, bellRings: 0,
      upgrades: 0, pets: 0, fish: 0, requests: 0, cats: 0, worms: 0, lostBooks: 0, thieves: 0, balloons: 0, wishes: 0, critics: 0,
    },
    tasks: null,
    story: { seen: [] },
    flags: {},
    daily: { last: '', streak: 0 },
    wheel: { lastFree: 0, adDay: '', adUsed: 0 },
    shop: { jar: 0, offline: 0, perm: 0, cheeseDay: '', cheeseUsed: 0, dealDay: '' },
    xp: 0,
    rep: 1,
    settings: { music: true, sfx: true, haptics: true, notifications: true, chatter: true, musicVol: 0.6, sfxVol: 0.9 },
    removeAds: false,
    cooldowns: { jarDouble: 0, freeUpgrade: 0 },
    furniture: { owned: {}, floors: {} }, // bought pieces (kept forever) and what is placed on each floor
    ads: { day: '', used: {}, next: {} }, // daily caps + cooldowns for optional ad offers
    festival: { key: '', gift: '' }, // festival gift claimed today
    gift: { next: 0 }, // mystery gift box on the doorstep
    lastSeen: now,
    created: now,
  };
}

// Fill in any fields missing from older saves.
function migrate(s) {
  const base = freshState();
  if (typeof s.branchStart !== 'number') s.branchStart = 0; // saves from before the moving van: free to move
  for (const k of Object.keys(base)) if (s[k] === undefined) s[k] = base[k];
  for (const k of ['stats', 'daily', 'wheel', 'shop', 'settings', 'cooldowns', 'story', 'flags', 'furniture', 'ads', 'festival', 'gift']) s[k] = { ...base[k], ...s[k] };
  s.furniture.owned = s.furniture.owned || {}; s.furniture.floors = s.furniture.floors || {};
  // Only keep pieces this version knows about, placed in the spot they belong to.
  for (const id of Object.keys(s.furniture.owned)) if (!FURN[id]) delete s.furniture.owned[id];
  for (const [i, fl] of Object.entries(s.furniture.floors)) {
    const clean = {};
    for (const [slot, id] of Object.entries(fl || {})) if (FURN[id] && FURN[id].slot === slot && s.furniture.owned[id]) clean[slot] = id;
    s.furniture.floors[i] = clean;
  }
  for (const k of Object.keys(s.furniture)) if (!['owned', 'floors'].includes(k)) delete s.furniture[k];
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
