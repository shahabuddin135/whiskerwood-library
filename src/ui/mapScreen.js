// The Map: travel the library around the world. Moving makes the floors start fresh, but the
// screen spells out exactly what comes along and what the new place brings.
import { openModal } from './modals.js';
import { h, ig, toast, bigText } from './dom.js';
import { icon } from './icons.js';
import { portrait } from './portraits.js';
import { thumb } from './thumbs.js';
import { artImg } from './art.js';
import { LOCATIONS, locationInfo } from '../data/locations.js';
import { FURNITURE } from '../data/furniture.js';
import { CHARACTERS } from '../data/story.js';
import { ROOMS } from '../data/rooms.js';
import { PRESTIGE_ROOM } from '../core/game.js';
import * as E from '../core/economy.js';
import { fmt } from '../core/format.js';
import { sfx } from '../audio/sfx.js';

const features = (l) => {
  const exclusive = FURNITURE.filter((f) => f.loc === l.id).length;
  return `<div class="feat-list">
    <div class="feat">${icon(l.mechanic.icon)}<div><b>${l.mechanic.name}</b>${l.mechanic.desc}</div></div>
    <div class="feat">${icon('friends')}<div><b>${CHARACTERS[l.host]?.name}</b>${CHARACTERS[l.host]?.role}</div></div>
    <div class="feat">${icon('shop')}<div><b>${l.shop.name}</b>${exclusive} exclusive pieces of furniture</div></div>
    <div class="feat">${icon('keepsake')}<div><b>3 souvenirs</b>+5% income each, kept forever</div></div>
    <div class="feat">${icon('tower')}<div><b>A whole new look</b>New walls, roof, windows, shelves, lamps and grounds</div></div>
    <div class="feat">${icon('stamp')}<div><b>Passport perk: ${l.perk.name}</b>${l.perk.desc} (earned when you move on)</div></div>
  </div>`;
};
const locCard = (l, label) => `<div class="loc-card" style="--la:${l.ui.a};--lb:${l.ui.ink}"><div class="muted" style="color:#fff3dc">${label}</div><b>${l.name}</b><div class="lc-lib">${l.library}</div><div class="lc-blurb">${l.blurb}</div></div>`;

export function mapScreen(S) {
  const g = S.game; const s = g.s;
  const cur = s.branch;
  const cycleStart = cur - (cur % LOCATIONS.length);
  const stops = LOCATIONS.map((_, k) => locationInfo(cycleStart + k));
  const next = g.nextBranch();
  const pend = g.pendingQuills(); const can = g.canPrestige();
  const req = !s.rooms[PRESTIGE_ROOM].built;
  const willVan = E.startFloors(s) > 1 || (g.loc().perk.id === 'movingVan' && !s.stamps.includes(g.loc().id));

  const stopHtml = (l) => {
    const here = l.index === cur; const nx = l.index === cur + 1; const past = l.index < cur;
    const stamped = s.stamps.includes(l.id);
    return `<button class="map-stop ${here ? 'here' : nx ? 'next' : !past ? 'future' : ''}" data-loc="${l.index}" style="--la:${l.ui.a};--lb:${l.ui.b}">
      <span class="ms-badge">${icon(l.mechanic.icon)}</span>
      <span class="ms-body"><b>${l.name}</b><div class="ms-sub">${here ? 'You are here · ' : nx ? 'Next stop · ' : past ? 'Visited · ' : ''}${l.library}</div>
        <span class="ms-tags"><span>${icon('coin')}×${fmt(l.mult)}</span><span>${icon(l.mechanic.icon)}${l.mechanic.name}</span>${s.trophies.includes(l.id) ? `<span>${icon('trophy')}Complete</span>` : ''}</span></span>
      ${stamped ? `<span class="stamped">${icon('stamp')}</span>` : ''}</button>`;
  };

  const body = h(`<div>
    <div class="flavor">Mice everywhere need libraries. Follow the road, and pack everything you love.</div>
    <div class="map-path">${stops.map(stopHtml).join('')}</div>
    ${locCard(next, 'Next stop')}
    ${features(next)}
    <div class="big-reward"><span class="ico ico-quill"></span>+${pend} Golden Quills</div>
    <div class="keep-list"><b>Comes with you:</b><ul>
      <li>Golden cheese (${fmt(s.cheese)}), Golden Quills and reputation</li>
      <li>Every book, festival book and keepsake</li>
      <li>All your furniture, librarian hats and garden pieces</li>
      <li>Your regulars and their stories</li>
      <li>Trophies, Passport perks and Shop upgrades</li></ul></div>
    <div class="fresh-list">Starts fresh: floors and coins.${willVan ? ' <b>Moving Van:</b> you arrive with 3 floors already built.' : ''}
      ${s.stamps.includes(g.loc().id) ? '' : `<br>Moving on also earns the <b>${g.loc().perk.name}</b> stamp: ${g.loc().perk.desc}`}</div>
    ${req ? `<div class="muted" style="color:#b5523b;margin-top:6px">Build the ${ROOMS[PRESTIGE_ROOM].name} to unlock travel.</div>` : pend < 1 ? '<div class="muted" style="color:#b5523b;margin-top:6px">Earn more coins here to gain a Golden Quill.</div>' : ''}
  </div>`);
  body.querySelectorAll('[data-loc]').forEach((b) => b.addEventListener('click', () => {
    const l = locationInfo(+b.dataset.loc); sfx.tap();
    openModal({ title: l.name, icon: 'location', body: `${locCard(l, l.index === cur ? 'You are here' : l.index < cur ? 'Visited' : 'Coming up')}${features(l)}`, buttons: [{ label: 'Back to the map', cls: 'plain', onClick: () => setTimeout(() => mapScreen(S), 50) }] });
  }));
  openModal({
    title: 'World Map', icon: 'map', wide: true, body,
    buttons: [{ label: `Move to ${next.name}`, cls: 'gold', disabled: !can, onClick: () => { S.confirmPrestige(pend, next); } }],
  });
}

// Shown right after moving: a warm welcome, the stamp you earned and a housewarming gift.
export function arrivalScreen(S, res) {
  const g = S.game;
  const { to, stamp, gift, head, gained } = res;
  const host = CHARACTERS[to.host];
  bigText(`Welcome to ${to.name}!`);
  openModal({
    title: `Welcome to ${to.name}!`, icon: 'location', dismissable: false,
    body: `<img class="art-portrait" src="${portrait(to.host)}" alt=""><div class="flavor"><b>${host.name}</b> is waiting at the door of <b>${to.library}</b>. The moving van made it — books, furniture, friends and all.</div>
      <div class="rewards"><div class="rw"><span class="ico ico-quill"></span>+${gained} quills</div>${stamp ? `<div class="rw">${ig('stamp')} ${stamp.perk.name}</div>` : ''}${head > 1 ? `<div class="rw">${ig('tower')} ${head} floors ready</div>` : ''}</div>
      ${stamp ? `<div class="keep-list"><b>Passport stamp: ${stamp.name}</b><br>${stamp.perk.desc}</div>` : ''}
      <div class="shop-sec">${icon('gift')}Housewarming gift</div>
      <div class="rewards"><div class="rw"><span class="ico ico-cheese"></span>${gift.cheese}</div>${gift.item ? `<div class="rw"><img src="${thumb(gift.item.id, 42, 32)}" width="42" height="32" alt=""> ${gift.item.name}</div>` : ''}</div>
      <div class="muted">New here: ${to.mechanic.name.toLowerCase()}, ${to.shop.name} and 3 souvenirs to find.</div>`,
    buttons: [
      S.adBtn(`Throw a housewarming party <small>+${gift.cheese} more cheese</small>`, 'housewarming_x2', () => { g.addCheese(gift.cheese); S.celebrate([{ kind: 'cheese', amount: gift.cheese }]); toast('What a party! Everybody brought cheese.', 'gold', 'cake'); }),
      { label: 'Let’s explore!', cls: 'gold', onClick: () => { sfx.fanfare(); } },
    ],
  });
}

export { artImg };
