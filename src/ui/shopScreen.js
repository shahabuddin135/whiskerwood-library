// The Shop. Every location has its own shopfront and shopkeeper, the catalogue has furniture of
// every rarity (some only sold in one place), and there is a daily deal.
import { openModal } from './modals.js';
import { h, ig, toast, centerOf, bigText } from './dom.js';
import { icon } from './icons.js';
import { portrait } from './portraits.js';
import { thumb } from './thumbs.js';
import { FURNITURE, FURN, SLOTS, RARITY_INFO, RARITY_BONUS } from '../data/furniture.js';
import { LOCATIONS } from '../data/locations.js';
import { SHOP } from '../data/quests.js';
import { ROOMS } from '../data/rooms.js';
import { IAP_PRODUCTS, purchase } from '../iap.js';
import { CONFIG } from '../config.js';
import { fmt, fmtTime } from '../core/format.js';
import { TOKEN_ICON } from '../world/festivalFx.js';
import { sfx } from '../audio/sfx.js';
import { Ads } from '../ads/ads.js';

const locName = (id) => LOCATIONS.find((l) => l.id === id)?.name || id;

export function shopScreen(S, startTab = 'furniture') {
  const g = S.game; const s = g.s; const ui = S.ui;
  const loc = g.loc();
  let tab = startTab || 'furniture';
  let cat = 'all';
  const hello = loc.shop.hello[Math.floor(Math.random() * loc.shop.hello.length)];
  const body = h('<div data-shop></div>');
  const cheeseBtn = (cost, attrs = '') => `<button class="btn gold" ${attrs}><span class="ico ico-cheese"></span>${fmt(cost)}</button>`;
  const item = (ico, title, desc, btn) => `<div class="shop-item"><div class="si-ico">${ico}</div><div class="si-body"><b>${title}</b><div>${desc}</div></div>${btn}</div>`;

  const card = (f) => {
    const lock = g.furnitureLock(f);
    const owned = lock === 'owned';
    const price = g.furniturePrice(f);
    let btn;
    if (owned) btn = SLOTS[f.slot].floor ? `<button class="btn plain" data-place="${f.id}">Place…</button>` : f.slot === 'curio' ? '<button class="btn plain" disabled>In the vault</button>' : `<button class="btn ${s.furniture[f.slot] === f.id ? 'plain' : ''}" data-equip="${f.id}">${s.furniture[f.slot] === f.id ? 'In use' : 'Use'}</button>`;
    else if (lock === 'regular') btn = '<button class="btn plain" disabled>A regular’s gift</button>';
    else if (lock === 'location') btn = `<button class="btn plain" disabled>${icon('location')}Only at ${locName(f.loc)}</button>`;
    else if (lock === 'festival') btn = '<button class="btn plain" disabled>Festival only</button>';
    else if (f.tokens) btn = `<button class="btn gold" data-buy="${f.id}">${ig(TOKEN_ICON[f.festival] || 'festival')}${f.tokens}</button>`;
    else btn = cheeseBtn(price, `data-buy="${f.id}" ${s.cheese < price ? 'data-poor="1"' : ''}`);
    return `<div class="fcard ${owned ? 'owned' : ''} r${f.rarity}">
      <span class="rar-tag" style="background:${RARITY_INFO[f.rarity].color}">${RARITY_INFO[f.rarity].name}</span>
      ${f.loc ? `<span class="loc-tag">${locName(f.loc)}</span>` : ''}
      <div class="ft"><img src="${thumb(f.id)}" alt=""></div>
      <b>${f.name}</b><div class="fd">${f.desc}</div>
      <div class="muted" style="font-size:10.5px;margin-bottom:4px">+${Math.round(RARITY_BONUS[f.rarity] * 100)}% income forever${f.tap ? ' · tap it!' : ''}</div>
      ${btn}</div>`;
  };

  const render = () => {
    const tabs = [['furniture', 'chair', 'Furniture'], ['treats', 'sparkle', 'Treats'], ['upgrades', 'gear', 'Upgrades']];
    if (CONFIG.iapEnabled) tabs.push(['support', 'heart', 'Support']);
    let html = `<div class="shop-front" style="--sa:${loc.ui.a};--sb:${loc.ui.ink}"><img src="${portrait(loc.shop.keeper)}" alt=""><b>${loc.shop.name}</b><div>“${hello}”</div></div>
      <div class="tabs">${tabs.map(([k, ic, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${icon(ic)}${l}</button>`).join('')}</div>`;
    if (tab === 'treats') {
      html += `<div class="shop-sec">${icon('tv')}Free treats</div>
        ${item(icon('cheese'), `+${SHOP.adCheese} Golden Cheese`, `${g.adCheeseLeft()} left today`, `<button class="btn ad" data-a="adcheese" ${g.adCheeseLeft() <= 0 ? 'disabled' : ''}>Free</button>`)}
        ${item(icon('hourglass'), 'Story Hour ×2', g.storyHourLeft() > 0 ? `Active · ${fmtTime(g.storyHourLeft())} left` : 'Double income for 30 min', `<button class="btn ad" data-a="story" ${g.storyHourFull() ? 'disabled' : ''}>+30m</button>`)}
        <div class="shop-sec">${icon('hourglass')}Time warps</div>
        ${SHOP.warp.map((w, k) => item(icon('coin'), `${w.sec / 3600}h of coins`, `Instantly get ${fmt(g.rewardCoins(w.sec))} coins`, cheeseBtn(w.cost, `data-a="warp" data-k="${k}"`))).join('')}
        ${item(icon('book'), 'Mystery Book Crate', 'A random book for your album', cheeseBtn(SHOP.crate, 'data-a="crate"'))}`;
    } else if (tab === 'upgrades') {
      const jarN = SHOP.jar[s.shop.jar + 1]; const offN = SHOP.offline[s.shop.offline + 1]; const perm = SHOP.perm[s.shop.perm];
      html += `<div class="shop-sec">${icon('star')}Kept forever, everywhere</div>
        ${item(icon('jar'), 'Bigger Coin Jar', `Holds ${fmtTime(SHOP.jar[s.shop.jar].sec)} of coins${jarN ? ` → ${fmtTime(jarN.sec)}` : ' (max)'}`, jarN ? cheeseBtn(jarN.cost, 'data-a="jar"') : '<button class="btn plain" disabled>MAX</button>')}
        ${item(icon('crescent'), 'Night Shift', `Offline earnings for ${fmtTime(SHOP.offline[s.shop.offline].sec)}${offN ? ` → ${fmtTime(offN.sec)}` : ' (max)'}`, offN ? cheeseBtn(offN.cost, 'data-a="offline"') : '<button class="btn plain" disabled>MAX</button>')}
        ${item(icon('sparkle'), 'Golden Reading Glasses', `Permanent ×2 income (owned: ${s.shop.perm})`, perm != null ? cheeseBtn(perm, 'data-a="perm"') : '<button class="btn plain" disabled>MAX</button>')}`;
    } else if (tab === 'support') {
      html += `<div class="shop-sec">${icon('heart')}Support the library</div>
        ${IAP_PRODUCTS.map((p) => item(icon(p.id === 'no_ads' ? 'close' : 'cheese'), p.title, p.desc, `<button class="btn" data-iap="${p.id}" ${p.id === 'no_ads' && s.removeAds ? 'disabled' : ''}>${p.id === 'no_ads' && s.removeAds ? 'Owned' : p.price}</button>`)).join('')}`;
    } else {
      // Furniture catalogue
      const deal = g.dailyDeal();
      if (deal) {
        const half = Math.ceil(deal.cost * 0.5);
        html += `<div class="deal"><span class="deal-tag">Today’s deal</span><img src="${thumb(deal.id)}" alt=""><div style="flex:1;min-width:0"><b>${deal.name}</b><div class="muted">${RARITY_INFO[deal.rarity].name} · ${SLOTS[deal.slot].name}</div>
          ${s.deal.used ? `<button class="btn gold" data-buy="${deal.id}"><span class="strike">${fmt(deal.cost)}</span><span class="ico ico-cheese"></span>${fmt(half)}</button>` : `<button class="btn ad" data-a="deal" ${g.offerReady('deal', 1) ? '' : 'disabled'}>Half price today</button>`}</div></div>`;
      }
      const cats = [['all', 'sparkle', 'All'], ...Object.entries(SLOTS).map(([k, v]) => [k, v.icon, v.name])];
      html += `<div class="tabs" style="border:0;margin-bottom:4px">${cats.map(([k, ic, l]) => `<button data-cat="${k}" class="${cat === k ? 'on' : ''}" style="border-radius:4px;border-bottom:2px solid var(--paper-edge);margin:0">${icon(ic)}${l}</button>`).join('')}</div>`;
      const fest = g.festival();
      const list = FURNITURE.filter((f) => (cat === 'all' || f.slot === cat) && (!f.festival || f.festival === fest?.id || g.ownsFurniture(f.id)));
      const order = (f) => { const l = g.furnitureLock(f); return (f.loc === loc.id ? 0 : 1) + (l === '' ? 0 : l === 'owned' ? 3 : 5) + (f.festival ? -1 : 0); };
      list.sort((a, b) => order(a) - order(b) || a.cost - b.cost);
      const owned = FURNITURE.filter((f) => g.ownsFurniture(f.id)).length;
      html += `<div class="muted" style="margin:4px 0 8px">You own <b>${owned}</b> of ${FURNITURE.length} pieces · furniture moves with you to every location</div>
        <div class="cat-grid">${list.map(card).join('')}</div>`;
    }
    html += `<div class="muted" style="margin-top:8px">Your golden cheese: <b>${fmt(s.cheese)}</b>${g.festState() ? ` · ${g.festival().token.name}: <b>${g.festState().tokens}</b>` : ''}</div>`;
    body.innerHTML = html;
    body.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); tab = b.dataset.tab; render(); }));
    body.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); cat = b.dataset.cat; render(); }));
    body.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => act(b.dataset.a, +b.dataset.k, b)));
    body.querySelectorAll('[data-iap]').forEach((b) => b.addEventListener('click', async () => { sfx.tap(); const ok = await purchase(b.dataset.iap, g); if (ok) { sfx.reward(); render(); } }));
    body.querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => buyFurn(b.dataset.buy, b)));
    body.querySelectorAll('[data-equip]').forEach((b) => b.addEventListener('click', () => { const f = FURN[b.dataset.equip]; sfx.tap(); g.equipGlobal(f.slot, s.furniture[f.slot] === f.id ? null : f.id); render(); }));
    body.querySelectorAll('[data-place]').forEach((b) => b.addEventListener('click', () => { sfx.open(); const i = ui.world.focusedRoom(); ui.openRoom(i, 'style'); }));
  };

  const buyFurn = (id, btn) => {
    const f = FURN[id];
    const floor = ui.world.focusedRoom();
    if (!g.buyFurniture(id, floor)) { sfx.error(); toast(f.tokens ? `Not enough ${g.festival()?.token.name.toLowerCase() || 'tokens'}` : 'Not enough golden cheese', '', f.tokens ? 'festival' : 'cheese'); return; }
    sfx.buy(); sfx.sparkle();
    if (f.rarity === 'L') bigText('Legendary!');
    const where = SLOTS[f.slot].floor ? ` Placed in ${ROOMS[g.s.rooms[floor]?.built ? floor : 0].name} — restyle any floor from its Style tab.` : f.slot === 'curio' ? ' It is on display in the Keepsake Vault.' : '';
    toast(`${f.name} is yours!${where}`, 'gold', SLOTS[f.slot].icon);
    ui.world.react('furniture');
    render();
  };

  const act = async (a, k, btn) => {
    sfx.tap();
    if (a === 'adcheese') {
      btn.disabled = true;
      if (await Ads.rewarded('shop_cheese')) { s.stats.adsWatched++; g.claimAdCheese(); S.celebrate([{ kind: 'cheese', amount: SHOP.adCheese }], centerOf(btn)); }
      render(); return;
    }
    if (a === 'story') { btn.disabled = true; if (await Ads.rewarded('story_hour')) { s.stats.adsWatched++; g.addStoryHour(); bigText('Story Hour ×2!'); } render(); return; }
    if (a === 'deal') { btn.disabled = true; if (await Ads.rewarded('shop_deal')) { g.unlockDeal(); toast('Deal unlocked: half price all day!', 'gold', 'sparkle'); } render(); return; }
    const res = g.shopBuy(a, k);
    if (!res) { sfx.error(); toast('Not enough golden cheese', '', 'cheese'); return; }
    if (a === 'warp') S.celebrate([{ kind: 'coins', amount: res }], centerOf(btn));
    else if (a === 'crate') S.bookReveal({ kind: 'book', ...res });
    else { sfx.levelUp(); toast('Upgraded!', 'gold', 'sparkle'); }
    render();
  };

  render();
  openModal({ title: 'Shop', icon: 'shop', body, wide: true });
}
