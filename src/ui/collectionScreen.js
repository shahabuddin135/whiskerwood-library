// The Collection: everything you keep forever, in one place.
import { openModal } from './modals.js';
import { h, ig } from './dom.js';
import { icon } from './icons.js';
import { portrait } from './portraits.js';
import { thumb } from './thumbs.js';
import { sceneArt } from './art.js';
import { ROOMS, BOOKS } from '../data/rooms.js';
import { LOCATIONS, SOUVENIRS } from '../data/locations.js';
import { FURNITURE, furnitureBonus } from '../data/furniture.js';
import { REGULARS } from '../data/regulars.js';
import { FESTIVALS, FESTIVAL_BOOKS } from '../data/festivals.js';
import * as E from '../core/economy.js';
import { sfx } from '../audio/sfx.js';

export function collectionScreen(S, startTab = 'books', startFloor = null) {
  const g = S.game; const s = g.s;
  let tab = startTab; let floor = startFloor ?? S.ui.world.focusedRoom();
  const body = h('<div></div>');
  const pct = (x) => `+${Math.round(x * 100)}%`;

  const render = () => {
    const legacy = E.legacyBonus(s);
    const tabs = [['books', 'books', 'Books'], ['festival', 'festival', 'Festival'], ['keep', 'keepsake', 'Keepsakes'], ['friends', 'friends', 'Regulars']];
    let html = `<div class="bonus-line">${ig('star')} Kept forever: <b>${pct(legacy)}</b> income from furniture, keepsakes, trophies, regulars and festival books · plus <b>${s.quills}</b> Golden Quills (${pct(s.quills * E.QUILL_BONUS)})</div>
      <div class="tabs" style="margin-top:8px">${tabs.map(([k, ic, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${icon(ic)}${l}</button>`).join('')}</div>`;
    if (tab === 'books') {
      const owned = E.booksOwned(s);
      html += `<div class="muted">${owned} / ${BOOKS.length} books · each +10% on its floor · a full set ×2 · tap a book to read the blurb</div>
        <div class="tabs" style="border:0">${ROOMS.map((r, k) => { const n = BOOKS.filter((b) => b.room === k && s.album[b.id]).length; return `<button data-floor="${k}" class="${k === floor ? 'on' : ''} ${s.rooms[k].built ? '' : 'locked'}" style="border-radius:4px;border-bottom:2px solid var(--paper-edge)">${n === 5 ? icon('star') : ''}${r.genre} ${n}/5</button>`; }).join('')}</div>
        <div class="album-grid">${BOOKS.filter((b) => b.room === floor).map((b) => bookBtn(b, s.album[b.id])).join('')}</div>
        <div class="muted">${ROOMS[floor].name}: ×${E.albumMult(s, floor).toFixed(1)} income from books.</div>`;
    } else if (tab === 'festival') {
      html += `<div class="muted">Limited books from the year’s festivals · each <b>+3% income everywhere, forever</b></div>`;
      for (const f of FESTIVALS) {
        const list = FESTIVAL_BOOKS.filter((b) => b.festival === f.id);
        const n = list.filter((b) => s.fbooks[b.id]).length;
        html += `<div class="shop-sec">${icon(f.icon)}${f.name} <small style="font-weight:500">${n}/3</small></div><div class="album-grid">${list.map((b) => bookBtn(b, s.fbooks[b.id])).join('')}</div>`;
      }
    } else if (tab === 'keep') {
      html += `<div class="shop-sec">${icon('trophy')}Location trophies <small style="font-weight:500">+15% each · build all 10 floors in a location</small></div>
        <div class="keep-grid">${LOCATIONS.map((l) => `<div class="keep ${s.trophies.includes(l.id) ? '' : 'locked'}"><img src="${sceneArt('keepsake', { id: 'trophy' })}" alt=""><b>${l.name}</b><small>${s.trophies.includes(l.id) ? 'Complete!' : 'Not yet'}</small></div>`).join('')}</div>
        <div class="shop-sec">${icon('stamp')}Passport stamps <small style="font-weight:500">perks for every location you move on from</small></div>
        <div class="keep-grid">${LOCATIONS.map((l) => `<div class="keep ${s.stamps.includes(l.id) ? '' : 'locked'}"><div style="width:44px;height:44px;margin:4px">${icon(l.perk.icon)}</div><b>${l.perk.name}</b><small>${l.perk.desc}</small></div>`).join('')}</div>`;
      for (const l of LOCATIONS) {
        const list = SOUVENIRS.filter((x) => x.loc === l.id);
        html += `<div class="shop-sec">${icon(l.mechanic.icon)}${l.name} souvenirs <small style="font-weight:500">${list.filter((x) => s.souvenirs[x.id]).length}/3 · +5% each</small></div>
          <div class="keep-grid">${list.map((x) => `<div class="keep ${s.souvenirs[x.id] ? '' : 'locked'}"><img src="${sceneArt('keepsake', { id: x.id })}" alt=""><b>${s.souvenirs[x.id] ? x.name : '???'}</b><small>${s.souvenirs[x.id] ? x.desc : `Found through ${l.mechanic.name.toLowerCase()}`}</small></div>`).join('')}</div>`;
      }
      const curios = FURNITURE.filter((f) => f.slot === 'curio');
      html += `<div class="shop-sec">${icon('keepsake')}Curiosities <small style="font-weight:500">from the Shop, festivals and friends</small></div>
        <div class="keep-grid">${curios.map((f) => `<div class="keep ${g.ownsFurniture(f.id) ? '' : 'locked'}"><img src="${thumb(f.id, 70, 54)}" alt=""><b>${f.name}</b></div>`).join('')}</div>
        <div class="muted">Furniture owned: ${FURNITURE.filter((f) => g.ownsFurniture(f.id)).length}/${FURNITURE.length} · ${pct(furnitureBonus(s.furniture.owned))} income</div>`;
    } else {
      html += `<div class="muted" style="margin-bottom:6px">Regulars drop by with a name tag. Tap them to hear the next part of their story. They follow you to every location.</div>`;
      for (const r of REGULARS) {
        const step = g.regularStep(r.id);
        const hearts = [0, 1, 2, 3].map((k) => `<span class="${k < step ? '' : 'off'}">${icon('heart')}</span>`).join('');
        html += `<div class="cast"><img src="${portrait(r.id)}" alt=""><div style="flex:1;min-width:0"><b>${step ? r.name : '???'}</b><div class="ct">${step ? r.title : 'Hasn’t visited yet'}</div><div class="hearts">${hearts}</div>
          <div class="muted" style="font-size:11px">${step >= 4 ? `Story complete · gave you the ${FURNITURE.find((f) => f.id === r.gift)?.name}` : step ? `Chapter ${step} of 4` : ''}</div></div></div>`;
      }
    }
    body.innerHTML = html;
    body.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); tab = b.dataset.tab; render(); }));
    body.querySelectorAll('[data-floor]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); floor = +b.dataset.floor; render(); }));
    body.querySelectorAll('[data-book]').forEach((b) => b.addEventListener('click', () => {
      sfx.open();
      const id = b.dataset.book; const book = BOOKS.find((x) => x.id === id) || FESTIVAL_BOOKS.find((x) => x.id === id);
      S.bookDetail(book, !!(s.album[id] || s.fbooks[id]));
    }));
  };
  const bookBtn = (b, owned) => (owned ? `<button class="book ${b.rarity}" data-book="${b.id}" style="background:${b.color}"><span class="rar">${b.rarity === 'L' ? 'Legendary' : b.rarity === 'E' ? 'Epic' : b.rarity === 'R' ? 'Rare' : 'Common'}</span><span>${b.title}</span><span class="by">${b.author}</span></button>` : `<button class="book unknown" data-book="${b.id}">?</button>`);
  render();
  openModal({ title: 'Collection', icon: 'books', body, wide: true });
}
