// All pop-up screens. Rewarded-ad buttons are always optional and clearly marked with 📺.
import { openModal, closeModal } from './modals.js';
import { $, h, ICO, toast, flyTo, bigText, centerOf, haptic } from './dom.js';
import { ROOMS, BOOKS, RARITY, DECOR } from '../data/rooms.js';
import { DAILY, WHEEL, SHOP } from '../data/quests.js';
import { SLOTS, FURNITURE_BONUS, FURN } from '../data/furniture.js';
import { BRANCHES, branchInfo } from '../data/branches.js';
import * as E from '../core/economy.js';
import { fmt, fmtTime } from '../core/format.js';
import { sfx } from '../audio/sfx.js';
import { music } from '../audio/music.js';
import { setSfxEnabled } from '../audio/sfx.js';
import { Ads } from '../ads/ads.js';
import { purchase, IAP_PRODUCTS } from '../iap.js';
import { STORY_HOUR_MAX, OFFLINE_RATE } from '../core/game.js';
import { placeScreens } from './places.js';
import { WINGS } from '../data/wings.js';
import { FURNITURE } from '../data/furniture.js';
import { CONFIG } from '../config.js';
import { SPEED_ORDER, SPEED_LABEL } from '../core/calendar.js';
import { GRAPHICS, GRAPHICS_LABEL } from '../world/quality.js';

const SCENE_BG = {
  meadow: 'linear-gradient(135deg,#8cc56f,#e8c465)', windmill: 'linear-gradient(135deg,#9ec5f0,#e8cf7a)',
  cove: 'linear-gradient(135deg,#4f8fd9,#8fd3c7)', pond: 'linear-gradient(135deg,#5e9c55,#79b8cf)', castle: 'linear-gradient(135deg,#4b3f78,#b27fa0)',
};

// Book covers: each book gets its own cloth pattern and title style (picked from its id, so it
// never changes), a gold emblem for its genre, and tooling that gets fancier with rarity.
const COVER_PATTERNS = ['cloth', 'stripes', 'dots', 'diamond', 'marble', 'plaid', 'scales', 'damask', 'stars', 'waves'];
const EMBLEM = (inner) => `<svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
const G = 'fill="#f2d27a" stroke="#5a3a1a" stroke-width="0.8" stroke-linejoin="round"';
const GL = 'fill="none" stroke="#f2d27a" stroke-linecap="round" stroke-linejoin="round"';
const GENRE_EMBLEMS = [
  EMBLEM(`<path ${G} d="M3.5 17 L4.5 7.5 L9 11 L12 5 L15 11 L19.5 7.5 L20.5 17 Z"/><rect ${G} x="3.5" y="17.6" width="17" height="2.6" rx="1"/>`), // fairy tales: crown
  EMBLEM(`<path ${G} d="M12 2.8 L14.7 8.7 L21.1 9.4 L16.3 13.6 L17.7 20 L12 16.7 L6.3 20 L7.7 13.6 L2.9 9.4 L9.3 8.7 Z"/>`), // picture books: star
  EMBLEM(`<path ${G} d="M4.5 9 H16.5 V13 A6 6 0 0 1 10.5 19 A6 6 0 0 1 4.5 13 Z"/><path ${GL} stroke-width="1.8" d="M16.5 10.5 H18.2 A2.4 2.4 0 0 1 18.2 15.3 H16"/><path ${GL} stroke-width="1.3" d="M8.5 6.5 Q9.5 5 8.5 3.5 M12.5 6.5 Q13.5 5 12.5 3.5"/>`), // cookbooks: teacup
  EMBLEM(`<circle ${GL} stroke-width="1.8" cx="12" cy="12" r="8.6"/><path ${G} d="M12 4.5 L14 12 L12 19.5 L10 12 Z"/><path ${G} opacity="0.75" d="M4.5 12 L12 10.2 L19.5 12 L12 13.8 Z"/>`), // adventure: compass
  EMBLEM(`<circle ${GL} stroke-width="2.6" cx="10" cy="10" r="5.8"/><path ${GL} stroke-width="3.4" d="M14.4 14.4 L19.8 19.8"/>`), // mystery: magnifier
  EMBLEM(`<path ${G} d="M20 3 C12.5 4 7.5 9 5.2 16.8 L7.2 17 C9 11 13 7 20 3 Z"/><path ${GL} stroke-width="1.6" d="M4 21 L6.4 16.8"/>`), // poetry: quill
  EMBLEM(`<circle ${G} cx="12" cy="12" r="5.2"/><ellipse ${GL} stroke-width="1.7" cx="12" cy="12" rx="10" ry="3.1" transform="rotate(-20 12 12)"/>`), // science: ringed planet
  EMBLEM(`<circle ${GL} stroke-width="2.4" cx="7.5" cy="12" r="3.8"/><path ${GL} stroke-width="2.2" d="M11.3 12 H21 M17.2 12 V15.4 M20 12 V14.6"/>`), // rare tomes: key
  EMBLEM(`<circle ${G} cx="7.5" cy="17" r="2.9"/><circle ${G} cx="17" cy="15" r="2.9"/><path ${GL} stroke-width="1.9" d="M10.2 17 V6.2 L19.7 4.2 V15"/>`), // music: notes
  EMBLEM(`<path ${GL} stroke-width="1.3" d="M12 21 C6.5 18.5 4.5 12.5 6.5 5 M12 21 C17.5 18.5 19.5 12.5 17.5 5"/>${[[6.6, 8, -40], [5.8, 12, -60], [7, 16, -80], [17.4, 8, 40], [18.2, 12, 60], [17, 16, 80]].map(([x, y, r]) => `<ellipse ${G} cx="${x}" cy="${y}" rx="2.2" ry="1.1" transform="rotate(${r} ${x} ${y})"/>`).join('')}`), // legends: laurel
];
const idHash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

export function bookHtml(b, count = 1) {
  if (!count) return '<div class="book unknown">?</div>';
  const h = idHash(b.id);
  const pat = COVER_PATTERNS[h % COVER_PATTERNS.length];
  const plate = (h >> 5) % 2 === 0;
  return `<div class="book ${b.rarity} pat-${pat}${plate ? ' plate' : ''}" style="--bc:${b.color}">
    <span class="rar">${RARITY[b.rarity].name}</span>
    <span class="b-emblem">${GENRE_EMBLEMS[b.room % GENRE_EMBLEMS.length]}</span>
    <span class="b-title">${b.title}</span>${count > 1 ? `<span class="count">×${count}</span>` : ''}${b.rarity === 'L' ? '<i class="b-shine"></i>' : ''}
  </div>`;
}

export function rewardsHtml(list) {
  return `<div class="rewards">${list.map((r) => {
    if (r.kind === 'coins') return `<div class="rw"><span class="ico ico-coin"></span>${fmt(r.amount)}</div>`;
    if (r.kind === 'cheese') return `<div class="rw"><span class="ico ico-cheese"></span>${fmt(r.amount)}</div>`;
    if (r.kind === 'boost') return `<div class="rw">📖 ×2 · ${fmtTime(r.sec)}</div>`;
    if (r.kind === 'book') return `<div class="rw">📕 ${r.book.title}${r.dup ? ` <small>(dup +${r.cheese}🧀)</small>` : ''}</div>`;
    if (r.kind === 'furniture') return `<div class="rw">${r.item.icon} ${r.item.name}</div>`;
    if (r.kind === 'text') return `<div class="rw">${r.text}</div>`;
    return '';
  }).join('')}</div>`;
}

export class Screens {
  constructor(ui) { this.ui = ui; this.game = ui.game; }

  adBtn(label, placement, onReward) {
    return {
      label, cls: 'ad',
      onClick: async () => {
        const ok = await Ads.rewarded(placement);
        if (!ok) { toast('No reward this time — watch the whole ad to earn it'); return false; }
        this.game.s.stats.adsWatched++;
        await onReward();
        return true;
      },
    };
  }

  // Animate granted items into the HUD.
  celebrate(list, from) {
    const p = from || { x: window.innerWidth / 2, y: window.innerHeight * 0.45 };
    let delay = 0;
    for (const r of list) {
      if (r.kind === 'coins') setTimeout(() => { this.ui.flyCoins(p, 10); }, delay);
      if (r.kind === 'cheese') setTimeout(() => { flyTo(p, $('#cheesePill'), Math.min(10, 3 + r.amount), 'cheese', (last) => { if (last) sfx.coin(7); }); }, delay);
      if (r.kind === 'book') setTimeout(() => this.bookReveal(r), delay + 300);
      delay += 150;
    }
    sfx.reward(); haptic('medium');
  }

  /* ---------- first launch ---------- */
  welcome() {
    openModal({
      title: '💌 A Letter For You',
      urgent: true, dismissable: false,
      body: `<div class="art">🐭📚🕯️</div>
        <div class="flavor" style="text-align:left">Dear little one,<br><br>
        I've left you my tiny library in the old meadow. It's only one cosy nook for now, but every mouse who reads here drops a coin in the jar.<br><br>
        Add armchairs, fill the shelves, build new floors — and who knows? One day even the <b>Queen</b> may come to borrow a book.<br><br>
        With love, <b>Grandma Mimsy</b> 🧀</div>`,
      buttons: [{ label: 'Open the library doors!', cls: 'gold', onClick: () => { sfx.fanfare(); bigText('Welcome!'); } }],
    });
  }

  /* ---------- offline ---------- */
  offline(ms) {
    const g = this.game;
    const { sec, amount, capped } = g.offlineEarnings(ms);
    if (amount < 1) return;
    const give = (a) => { g.earn(a); this.celebrate([{ kind: 'coins', amount: a }]); };
    openModal({
      title: 'Welcome back!', urgent: true, dismissable: false,
      body: `<div class="art">🐭💤📚</div>
        <div class="flavor">While you were away for <b>${fmtTime(sec)}</b>, your mice kept the library open.</div>
        <div class="big-reward"><span class="ico ico-coin"></span>${fmt(amount)}</div>
        ${capped ? `<div class="muted">Offline earnings stop after ${fmtTime(g.offlineCapSec())}. Extend it in the Shop!</div>` : `<div class="muted">Mice earn ${Math.round(OFFLINE_RATE * 100)}% while you're away.</div>`}`,
      buttons: [
        this.adBtn(`Collect ×3 <small>${fmt(amount * 3)}</small>`, 'offline_x3', () => give(amount * 3)),
        { label: `Collect ${fmt(amount)}`, cls: 'plain', onClick: () => give(amount) },
      ],
    });
  }

  /* ---------- floors ---------- */
  build(i) {
    const g = this.game;
    if (i < 0) return;
    const def = ROOMS[i];
    const can = g.s.coins >= def.unlock;
    openModal({
      title: 'New Floor',
      body: `<div class="art">🏗️</div>
        <div style="font-size:21px;font-weight:700">${def.name}</div>
        <div class="flavor">A cosy home for ${def.genre.toLowerCase()} lovers, with ${def.seat === 'cafe' ? 'café tables' : def.seat + 's'} and a ${def.centerName.toLowerCase()}.</div>
        <div style="display:flex;gap:6px;justify-content:center;margin:8px 0">
          <span style="width:46px;height:30px;border-radius:8px;background:repeating-linear-gradient(90deg,${def.pal.wall} 0 7px,${def.pal.wall2} 7px 14px)"></span>
          <span style="width:30px;height:30px;border-radius:8px;background:${def.pal.accent}"></span>
          <span style="width:30px;height:30px;border-radius:8px;background:${def.pal.seatCol}"></span>
        </div>
        <div class="muted">Build time: ${def.build ? fmtTime(def.build) : 'instant'} · 5 new books to collect</div>
        ${can ? '' : `<div class="muted" style="color:#b5523b;margin-top:6px">You need ${fmt(def.unlock - g.s.coins)} more coins. Tip: upgrade your floors and collect the jar!</div>`}`,
      buttons: [{
        label: `Build <span class="ico ico-coin"></span> ${fmt(def.unlock)}`, disabled: !can,
        onClick: () => {
          if (!g.startBuild(i)) { sfx.error(); return false; }
          sfx.hammer(); haptic('medium');
          this.ui.world.panToTop();
          return true;
        },
      }],
    });
  }

  construction(i) {
    const g = this.game;
    const def = ROOMS[i];
    let iv;
    const body = h(`<div><div class="art">🔨🐭</div><div style="font-size:19px;font-weight:700">${def.name}</div>
      <div class="flavor">The builder mice are hammering away!</div><div class="big-reward" data-t>--</div></div>`);
    const cheeseCost = () => g.cheeseToFinish(i);
    const m = openModal({
      title: 'Under Construction', body,
      buttons: [
        { ...this.adBtn('Speed up', 'build_speedup', () => { const done = g.speedBuild(i); toast(done ? 'Finished! 🎉' : 'Build time halved! ⏩', 'gold'); }) },
        { label: `Finish now <span class="ico ico-cheese"></span> <span data-c>${cheeseCost()}</span>`, cls: 'gold', onClick: () => { const c = cheeseCost(); if (!g.spendCheese(c)) { toast('Not enough golden cheese'); sfx.error(); return false; } g.finishBuildNow(i); return true; } },
      ],
      onOpen: (hd) => {
        const tick = () => {
          const rem = g.buildRemaining(i);
          if (!g.s.rooms[i].buildEnd) { clearInterval(iv); closeModal(); return; }
          body.querySelector('[data-t]').textContent = `⏳ ${fmtTime(rem)}`;
          const c = hd.el.querySelector('[data-c]'); if (c) c.textContent = cheeseCost();
          const ad = hd.el.querySelector('.btn.ad'); if (ad && !ad.disabled) ad.innerHTML = rem <= 120 ? 'Finish now' : 'Halve the time';
        };
        tick(); iv = setInterval(tick, 250);
      },
      onClose: () => clearInterval(iv),
    });
    return m;
  }

  built(i) {
    const def = ROOMS[i];
    bigText('Grand Opening!');
    openModal({
      title: '🎉 Grand Opening!',
      body: `<div class="art">🎊📚🐭</div><div style="font-size:21px;font-weight:700">${def.name}</div>
        <div class="flavor">${def.genre} lovers are already queueing at the door!</div>
        <div class="muted">New seats, shelves, décor and 5 books to collect.</div>`,
      buttons: [
        this.adBtn('Opening party! <small>×3 income here for 5 min</small>', 'opening_party', () => { this.game.addBoost({ mult: 3, sec: 300, room: i, label: 'Opening Party', icon: '🎉', key: `open${i}` }); this.ui.world.panToRoom(i); bigText('Party! ×3'); }),
        { label: 'Visit the new floor', cls: 'plain', onClick: () => { this.ui.world.panToRoom(i); } },
      ],
      onClose: () => {
        const g = this.game;
        if (Ads.canShowInterstitial(g.builtCount() - 1, g.s.removeAds)) setTimeout(() => Ads.interstitial('floor_built'), 400);
      },
    });
  }

  /* ---------- special guests ---------- */
  celeb(i, name) {
    const g = this.game;
    const amt = g.rewardCoins(120);
    const give = (a) => { g.earn(a); this.celebrate([{ kind: 'coins', amount: a }]); };
    openModal({
      title: '⭐ Celebrity Visit!', dismissable: false,
      body: `<div class="art">🌟🐭📸</div><div class="flavor"><b>${name}</b> adored ${ROOMS[i].name} and posted about it. Fans are flooding in!</div>
        <div class="big-reward"><span class="ico ico-coin"></span>${fmt(amt)}</div>`,
      buttons: [
        this.adBtn(`Triple it! <small>${fmt(amt * 3)}</small>`, 'celeb_x3', () => give(amt * 3)),
        { label: 'Thank you!', cls: 'plain', onClick: () => give(amt) },
      ],
    });
  }

  royal(i, name) {
    const g = this.game;
    openModal({
      title: '👑 A Royal Visit!', dismissable: false,
      body: `<div class="art">👑🐭✨</div><div class="flavor"><b>${name}</b> is delighted with your library and issues a royal decree…</div>
        <div class="big-reward">×3 income</div>`,
      buttons: [
        this.adBtn('×3 for 10 min + 10 <span class="ico ico-cheese"></span>', 'royal_decree', () => {
          g.addBoost({ mult: 3, sec: 600, label: 'Royal Decree', icon: '👑', key: 'royal' }); g.addCheese(10);
          this.celebrate([{ kind: 'cheese', amount: 10 }]); bigText('Royal Decree! ×3');
        }),
        { label: '×3 income for 1 min', cls: 'gold', onClick: () => { g.addBoost({ mult: 3, sec: 60, label: 'Royal Decree', icon: '👑', key: 'royal' }); sfx.reward(); } },
      ],
    });
  }

  author(i, name) {
    const g = this.game;
    const res = g.grantBook(i);
    const body = h(`<div><div class="flavor"><b>${name}</b> signed a copy just for you!</div><div class="card-reveal">${bookHtml(res.book)}</div>
      <div class="muted">${res.dup ? `Duplicate → +${res.cheese} golden cheese` : `New book! +10% income on ${ROOMS[res.book.room].name}`}${res.setDone ? '<br><b>Set complete! ×2 floor income!</b>' : ''}</div></div>`);
    sfx.sparkle();
    openModal({
      title: '✍️ Book Signing!', body,
      buttons: [
        this.adBtn('Get another signed book', 'author_book', () => { const r2 = g.grantBook(i); this.bookReveal({ kind: 'book', ...r2 }); }),
        { label: 'Wonderful!', cls: 'plain' },
      ],
    });
  }

  parcel() {
    const g = this.game;
    const small = g.rewardCoins(45); const big = g.rewardCoins(300);
    g.openedParcel();
    openModal({
      title: '📦 Pigeon Post!', dismissable: false,
      body: '<div class="art">🐦📦</div><div class="flavor">A carrier pigeon dropped a parcel for the library! What could be inside?</div>',
      buttons: [
        this.adBtn(`Open the Golden Parcel <small>${fmt(big)} + surprises</small>`, 'parcel_gold', () => {
          const list = [{ kind: 'coins', amount: big }]; g.earn(big);
          if (Math.random() < 0.6) { const c = 5 + Math.floor(Math.random() * 6); g.addCheese(c); list.push({ kind: 'cheese', amount: c }); }
          if (Math.random() < 0.4) list.push({ kind: 'book', ...g.grantBook() });
          this.celebrate(list);
          toast(`Golden Parcel: ${list.map((r) => (r.kind === 'coins' ? fmt(r.amount) + ' coins' : r.kind === 'cheese' ? r.amount + ' cheese' : 'a book!')).join(' + ')}`, 'gold');
        }),
        { label: `Open <span class="ico ico-coin"></span> ${fmt(small)}`, cls: 'plain', onClick: () => { g.earn(small); this.celebrate([{ kind: 'coins', amount: small }]); } },
      ],
    });
  }

  // Monsieur Fromage's verdict. Cheese platter (ad) bumps the rating.
  review(i, rv) {
    const g = this.game;
    const quotes = ['Dreadful. Simply dreadful.', 'Hmph. It has potential.', 'Pleasant enough, I suppose.', 'Charming! Truly charming.', 'Magnifique! The finest in the meadow!'];
    const pay = (stars) => {
      const amt = g.rewardCoins(25 * stars); g.earn(amt);
      const list = [{ kind: 'coins', amount: amt }];
      if (stars >= 4) g.addBoost({ mult: 2, sec: 300, room: i, label: 'Rave Review', icon: '📰', key: `review${i}` });
      if (stars === 5) { g.addCheese(3); list.push({ kind: 'cheese', amount: 3 }); }
      this.celebrate(list);
    };
    const body = (stars) => `<div class="art" style="font-size:44px">📝🧐</div>
      <div class="review-stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
      <div class="review-quote">“${quotes[stars - 1]}”</div>
      <div class="muted">${ROOMS[i].name}${stars >= 4 ? ' · <b>Rave review: ×2 income for 5 min!</b>' : ''}</div>
      ${rv.notes.length ? `<div class="review-tips"><b>To impress him next time:</b><br>• ${rv.notes.join('<br>• ')}</div>` : ''}`;
    const buttons = [{ label: `Collect <span class="ico ico-coin"></span> ${fmt(g.rewardCoins(25 * rv.stars))}`, cls: 'plain', onClick: () => pay(rv.stars) }];
    if (rv.stars < 5) buttons.unshift(this.adBtn('Offer a cheese platter (+1★)', 'critic_bribe', () => { pay(rv.stars + 1); toast(`🧀 Monsieur Fromage loved the cheese: ${'★'.repeat(rv.stars + 1)}!`, 'gold'); }));
    openModal({ title: '📰 The Review Is In!', dismissable: false, body: body(rv.stars), buttons });
  }

  bookReveal(r) {
    const b = r.book;
    openModal({
      title: r.dup ? 'Duplicate Book' : '📕 New Book!',
      body: `<div class="card-reveal">${bookHtml(b)}</div><div class="muted">by <b>${b.author}</b> · ${ROOMS[b.room].genre} · ${RARITY[b.rarity].name}</div>
        <div class="flavor">${b.blurb}</div><div class="review-quote">${b.review}</div>
        <div class="muted">${r.dup ? `Traded for +${r.cheese} golden cheese.` : `+10% income on ${ROOMS[b.room].name}!`}</div>
        ${r.setDone ? '<div class="big-reward" style="font-size:20px">Set complete! ×2 floor income</div>' : ''}`,
      buttons: [{ label: 'Lovely!', cls: 'plain' }],
    });
    sfx.sparkle();
  }

  // All three quick tasks done.
  taskChest(list) {
    const g = this.game;
    this.celebrate(list);
    const again = g.offerReady('chestX2', 6);
    openModal({
      title: '🎁 Task Chest!',
      body: `<div class="art">🎁✨</div><div class="flavor">All three tasks done! Here's your chest:</div>${rewardsHtml(list)}`,
      buttons: [
        ...(again ? [this.adBtn('Double it!', 'task_chest_x2', () => { g.useOffer('chestX2', 60); const more = g.grant({ coinsSec: 180, cheese: 4 }); this.celebrate(more); })] : []),
        { label: 'Lovely!', cls: 'plain' },
      ],
    });
  }

  // The mystery box on the doorstep.
  giftBox() {
    const g = this.game;
    if (!g.giftDue()) return;
    openModal({
      title: '🎁 A Mystery Gift!', dismissable: false,
      body: `<div class="art">📦🎀🐭</div><div class="flavor">A box with a big bow turned up on the doorstep. The tag just says <i>“For the librarian. Keep reading!”</i></div>
        <div class="muted">Inside: lots of coins, golden cheese, and maybe a piece of furniture or a book.</div>`,
      buttons: [
        this.adBtn(`Open the whole box <small>${fmt(g.rewardCoins(900))} + cheese + surprise</small>`, 'gift_box', () => {
          const got = g.openGift(true); this.celebrate(got);
          const f = got.find((r) => r.kind === 'furniture');
          if (f) toast(`${f.item.icon} There was a ${f.item.name} inside! Place it from 🔨 Upgrade.`, 'gold');
        }),
        { label: `Just peek <span class="ico ico-coin"></span> ${fmt(g.rewardCoins(45))}`, cls: 'plain', onClick: () => { this.celebrate(g.openGift(false)); } },
      ],
    });
  }

  // The current festival: what's on, the daily festival gift and the limited Shop specials.
  festival() {
    const g = this.game; const f = g.festival();
    if (!f) return;
    const specials = FURNITURE.filter((x) => x.festival === f.id);
    const ready = g.festGiftReady();
    const left = Math.max(0, (f.end - Date.now()) / 1000);
    openModal({
      title: `${f.icon} ${f.name}`,
      body: `<div class="art">${f.icon}📚🐭</div>
        <div class="flavor">The whole library is decorated and every mouse is in a festive mood!</div>
        ${left > 0 ? `<div class="muted">On for another ${fmtTime(left)}</div>` : ''}
        <div class="shop-sec">🎁 Today's festival gift</div>
        ${ready ? rewardsHtml(Object.entries(f.gift).map(([k, v]) => (k === 'cheese' ? { kind: 'cheese', amount: v } : k === 'coinsSec' ? { kind: 'coins', amount: g.rewardCoins(v) } : k === 'book' ? { kind: 'text', text: '📕 + a book' } : null)).filter(Boolean)) : '<div class="muted">Collected today. Come back tomorrow!</div>'}
        ${specials.length ? `<div class="shop-sec">🛍️ Limited specials in the Shop</div><div class="muted">${specials.map((x) => `${x.icon} ${x.name}${g.ownsFurniture(x.id) ? ' ✓' : ''}`).join(' · ')}</div>` : ''}`,
      buttons: ready ? [
        this.adBtn('Claim ×2', 'festival_gift', () => { const got = g.claimFestGift(2); if (got) this.celebrate(got); }),
        { label: 'Claim', cls: 'plain', onClick: () => { const got = g.claimFestGift(1); if (got) this.celebrate(got); } },
      ] : [{ label: 'Visit the Shop', cls: 'gold', onClick: () => setTimeout(() => this.shop(), 200) }],
    });
  }

  bookDetail(b, owned) {
    openModal({
      title: owned ? `📕 ${b.title}` : '📕 Undiscovered Book',
      body: owned
        ? `<div class="card-reveal">${bookHtml(b)}</div><div class="muted">by <b>${b.author}</b> · ${ROOMS[b.room].genre} · ${RARITY[b.rarity].name}</div>
          <div class="flavor">${b.blurb}</div><div class="review-quote">${b.review}</div>`
        : `<div class="card-reveal">${bookHtml(b, 0)}</div><div class="flavor">A ${RARITY[b.rarity].name.toLowerCase()} ${ROOMS[b.room].genre.toLowerCase()} book is waiting to be found.</div>
          <div class="muted">Books come from milestones, author signings, the wheel, parcels, daily gifts and the shop.</div>`,
      buttons: [{ label: 'Close', cls: 'plain' }],
    });
  }

  /* ---------- boosts ---------- */
  storyHour() {
    const g = this.game;
    const left = g.storyHourLeft();
    openModal({
      title: '📖 Story Hour',
      body: `<div class="art">📖🐭🐭🐭</div><div class="flavor">Gather the little mice for Story Hour — every floor earns <b>double</b>!</div>
        <div class="big-reward">×2 · 30 min</div>
        <div class="muted">${left > 0 ? `Active: ${fmtTime(left)} left · stacks up to ${STORY_HOUR_MAX / 3600}h` : 'Stack it up to 4 hours!'}</div>`,
      buttons: [
        { ...this.adBtn(left > 0 ? 'Add 30 minutes' : 'Start Story Hour', 'story_hour', () => { g.addStoryHour(); bigText('Story Hour ×2!'); sfx.levelUp(); }), disabled: g.storyHourFull() },
      ],
    });
  }

  /* ---------- daily ---------- */
  daily() {
    const g = this.game;
    const st = g.dailyStatus();
    const icon = (d) => ({ coin: '💰', cheese: '🧀', book: '📕', boost: '📖', chest: '🎁' }[d.icon]);
    const grid = DAILY.map((d, k) => {
      const done = st.canClaim ? k < st.day : k <= st.day;
      const today = st.canClaim && k === st.day;
      return `<div class="day ${done ? 'done' : ''} ${today ? 'today' : ''} ${k === 6 ? 'last' : ''}"><span>Day ${k + 1}</span><span class="d-big">${done ? '✅' : icon(d)}</span><span>${d.label}</span></div>`;
    }).join('');
    const claim = (mult) => { const got = g.claimDaily(mult); if (got) this.celebrate(got); this.ui.refreshBadges(); };
    openModal({
      title: '🎁 Daily Gifts', wide: true,
      body: `<div class="flavor">Visit every day — the gifts get better! Miss a day and the streak starts over.</div><div class="daily-grid">${grid}</div>
        <div class="muted">Current streak: ${st.streak} day${st.streak === 1 ? '' : 's'}</div>`,
      buttons: st.canClaim ? [
        this.adBtn('Claim ×2', 'daily_x2', () => claim(2)),
        { label: 'Claim', cls: 'plain', onClick: () => claim(1) },
      ] : [{ label: `Come back tomorrow! 🌙`, cls: 'plain' }],
    });
  }

  /* ---------- lucky wheel ---------- */
  wheel() {
    const g = this.game;
    const n = WHEEL.length; const seg = 360 / n;
    const icon = (w) => ({ coin: '💰', cheese: '🧀', book: '📕', boost: '📖' }[w.icon]);
    const slices = WHEEL.map((w, k) => {
      const a0 = ((k * seg - 90) * Math.PI) / 180; const a1 = (((k + 1) * seg - 90) * Math.PI) / 180;
      const x0 = 100 + 96 * Math.cos(a0), y0 = 100 + 96 * Math.sin(a0), x1 = 100 + 96 * Math.cos(a1), y1 = 100 + 96 * Math.sin(a1);
      const am = (((k + 0.5) * seg - 90) * Math.PI) / 180;
      const tx = 100 + 64 * Math.cos(am), ty = 100 + 64 * Math.sin(am);
      return `<path d="M100 100 L${x0} ${y0} A96 96 0 0 1 ${x1} ${y1} Z" fill="${w.color}" stroke="#fff" stroke-width="2"/>
        <g transform="translate(${tx} ${ty}) rotate(${(k + 0.5) * seg})"><text y="-4" text-anchor="middle" font-size="17">${icon(w)}</text><text y="13" text-anchor="middle" font-size="${w.label.length > 5 ? 8.5 : 11}" font-weight="700" fill="#4a3121" font-family="Fredoka,sans-serif">${w.label}</text></g>`;
    }).join('');
    const body = h(`<div>
      <div class="wheel-wrap"><div class="wheel-pin"></div>
        <svg viewBox="0 0 200 200" data-wheel><circle cx="100" cy="100" r="99" fill="#8a5a3a"/>${slices}
        ${Array.from({ length: n }, (_, k) => { const a = ((k * seg - 90) * Math.PI) / 180; return `<circle cx="${100 + 92 * Math.cos(a)}" cy="${100 + 92 * Math.sin(a)}" r="3" fill="#fff3c9"/>`; }).join('')}</svg>
        <div class="wheel-hub">🐭</div></div>
      <div class="muted" data-info></div></div>`);
    let rot = this.wheelRot || 0; let spinning = false;
    const svg = body.querySelector('[data-wheel]');
    svg.style.transform = `rotate(${rot}deg)`;
    const info = () => {
      const st = g.wheelStatus();
      body.querySelector('[data-info]').textContent = st.free ? 'Your free spin is ready!' : `Next free spin in ${fmtTime(st.nextFree)} · ${st.adLeft} bonus spins left today`;
      return st;
    };
    const spin = (kind) => new Promise((resolve) => {
      if (spinning) return resolve();
      spinning = true;
      const { index, prize } = g.spinWheel(kind);
      const target = 360 * 6 - (index * seg + seg / 2) + (Math.random() - 0.5) * seg * 0.6;
      rot = rot - (rot % 360) + target + 360;
      this.wheelRot = rot;
      svg.style.transform = `rotate(${rot}deg)`;
      let k = 0; const ticks = () => { if (k++ < 26) { sfx.tick(); setTimeout(ticks, 40 + k * k * 0.5); } }; ticks();
      setTimeout(() => {
        spinning = false;
        const got = g.grant(prize);
        if (prize.label === 'JACKPOT') bigText('JACKPOT!');
        this.celebrate(got, centerOf(svg));
        toast(`You won ${got.map((r) => (r.kind === 'coins' ? fmt(r.amount) + ' coins' : r.kind === 'cheese' ? r.amount + ' golden cheese' : r.kind === 'boost' ? '×2 Story Hour' : 'a book')).join(', ')}!`, 'gold');
        this.ui.refreshBadges();
        refreshBtns();
        resolve();
      }, 4300);
    });
    let hd;
    const refreshBtns = () => {
      const st = info();
      const [free, ad] = hd.el.querySelectorAll('.btn');
      free.style.display = st.free ? '' : 'none'; free.disabled = spinning;
      ad.innerHTML = `Bonus spin (${st.adLeft} left)`; ad.disabled = st.adLeft <= 0 || spinning;
    };
    hd = openModal({
      title: '🎡 Lucky Wheel', body,
      buttons: [
        { label: 'Free spin!', cls: 'gold', keepOpen: true, stayDisabled: true, onClick: async () => { await spin('free'); refreshBtns(); } },
        { label: 'Bonus spin', cls: 'ad', keepOpen: true, stayDisabled: true, onClick: async () => {
          const ok = await Ads.rewarded('wheel_spin');
          if (ok) { g.s.stats.adsWatched++; await spin('ad'); } refreshBtns();
        } },
      ],
    });
    if (hd) refreshBtns();
  }

  /* ---------- album ---------- */
  album(start = 0) {
    const g = this.game; const s = g.s;
    let tab = start;
    const body = h('<div><div class="bonus-line" data-total></div><div class="tabs" data-tabs></div><div class="album-grid" data-grid></div><div class="book-detail" data-detail></div><div class="muted" data-note></div></div>');
    const render = () => {
      const owned = E.booksOwned(s);
      body.querySelector('[data-total]').innerHTML = `📚 ${owned} / ${BOOKS.length} books · each book +10% floor income · full set ×2`;
      body.querySelector('[data-tabs]').innerHTML = ROOMS.map((r, k) => {
        const n = BOOKS.filter((b) => b.room === k && s.album[b.id]).length;
        return `<button data-k="${k}" class="${k === tab ? 'on' : ''} ${s.rooms[k].built ? '' : 'locked'}">${n === 5 ? '⭐ ' : ''}${r.genre} ${n}/5</button>`;
      }).join('');
      body.querySelector('[data-grid]').innerHTML = BOOKS.filter((b) => b.room === tab).map((b) => `<div data-book="${b.id}" style="cursor:pointer">${bookHtml(b, s.album[b.id] || 0)}</div>`).join('');
      body.querySelectorAll('[data-book]').forEach((el) => el.addEventListener('click', () => {
        const b = BOOKS.find((x) => x.id === el.dataset.book); sfx.tap();
        const owned = !!s.album[b.id];
        const box = body.querySelector('[data-detail]');
        box.innerHTML = owned ? `<b>${b.title}</b> <span class="muted">by ${b.author}</span><div class="flavor" style="margin:4px 0">${b.blurb}</div><div class="review-quote" style="font-size:13px">${b.review}</div>`
          : `<b>???</b><div class="muted">A ${RARITY[b.rarity].name.toLowerCase()} book you haven't found yet.</div>`;
        box.style.display = 'block';
      }));
      body.querySelector('[data-note]').innerHTML = `${ROOMS[tab].name}: ×${E.albumMult(s, tab).toFixed(1)} income from books.<br>Books come from author signings, the wheel, parcels, daily gifts and the shop.`;
      body.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); tab = +b.dataset.k; body.querySelector('[data-detail]').style.display = 'none'; render(); }));
    };
    render();
    openModal({ title: '📚 Book Album', body, wide: true });
  }

  /* ---------- shop ---------- */
  shop(startCat = null) {
    const g = this.game; const s = g.s;
    const body = h('<div data-shop></div>');
    let hd;
    let cat = startCat || 'all';
    const item = (ico, title, desc, btn) => `<div class="shop-item"><div class="si-ico">${ico}</div><div class="si-body"><b>${title}</b><div>${desc}</div></div>${btn}</div>`;
    // Every cheese price can also be paid in ads: progress is kept, so you can spread it out.
    const adAlt = (key, price) => `<button class="btn ad ad-alt" data-adbuy="${key}" data-price="${price}" title="Watch ads instead of paying cheese">📺 ${g.adBuyProgress(key)}/${g.adsFor(price)}</button>`;
    const pay = (key, price, cheeseBtn) => `<span class="btn-stack">${cheeseBtn}${adAlt(key, price)}</span>`;
    const furnRow = (f) => {
      const own = g.ownsFurniture(f.id);
      const rar = `<span style="color:${RARITY[f.rarity].color};font-weight:700">${RARITY[f.rarity].name}</span>`;
      const tag = f.festival ? ' · 🎉 limited' : f.branch ? ` · only in ${g.branch().name}` : '';
      return item(f.icon, f.name, `${rar} · +${Math.round(FURNITURE_BONUS[f.rarity] * 100)}% income${tag}<br><i>${f.desc}</i>`,
        own ? '<button class="btn plain" disabled>Owned ✓</button>' : pay(`f:${f.id}`, f.price, `<button class="btn gold" data-f="${f.id}"><span class="ico ico-cheese"></span>${f.price}</button>`));
    };
    const furnitureHtml = () => {
      const sale = g.furnitureForSale();
      const special = sale.filter((f) => f.branch || f.festival);
      const regular = sale.filter((f) => !f.branch && !f.festival && (cat === 'all' || f.slot === cat));
      const owned = Object.keys(s.furniture.owned).length;
      const deal = g.dailyDeal();
      const dealRow = deal && !g.ownsFurniture(deal.item.id) ? item('🏷️', `Today's deal: ${deal.item.icon} ${deal.item.name}`, `<span style="color:${RARITY[deal.item.rarity].color};font-weight:700">${RARITY[deal.item.rarity].name}</span> · half price today only<br><i>${deal.item.desc}</i>`,
        deal.unlocked ? `<button class="btn gold" data-deal><s style="opacity:.6">${deal.item.price}</s>&nbsp;<span class="ico ico-cheese"></span>${deal.price}</button>` : `<button class="btn ad" data-a="deal" ${g.offerReady('deal', 1) ? '' : 'disabled'}>½ price</button>`) : '';
      return `<div class="shop-sec">🛋️ Furniture <small style="font-weight:500">kept forever · place it from 🔨 Upgrade</small></div>
        ${dealRow}
        ${special.length ? `${special.map(furnRow).join('')}` : ''}
        <div class="tabs" data-cats style="margin-top:6px">${[['all', '✨ All'], ...SLOTS.map((sl) => [sl.key, `${sl.icon} ${sl.name}`])].map(([k, l]) => `<button data-cat="${k}" class="${cat === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        ${regular.map(furnRow).join('')}
        <div class="muted">You own ${owned} piece${owned === 1 ? '' : 's'} of furniture.</div>`;
    };
    const render = () => {
      const jarN = SHOP.jar[s.shop.jar + 1]; const offN = SHOP.offline[s.shop.offline + 1]; const perm = SHOP.perm[s.shop.perm];
      const fest = g.festival();
      body.innerHTML = `
        ${fest ? `<div class="bonus-line">${fest.icon} <b>${fest.name}!</b> Festival specials are in stock for a limited time.</div>` : ''}
        ${fest && g.festGiftReady() ? item(fest.icon, 'Festival gift', 'Once a day while the festival lasts', '<span class="btn-stack"><button class="btn gold" data-a="fest">Claim</button><button class="btn ad" data-a="festx2">×2</button></span>') : ''}
        <div class="shop-sec">Free treats</div>
        ${item('🧀', `+${SHOP.adCheese} Golden Cheese`, `${g.adCheeseLeft()} left today`, `<button class="btn ad" data-a="adcheese" ${g.adCheeseLeft() <= 0 ? 'disabled' : ''}>Free</button>`)}
        ${item('📖', 'Story Hour ×2', g.storyHourLeft() > 0 ? `Active · ${fmtTime(g.storyHourLeft())} left` : 'Double income for 30 min', `<button class="btn ad" data-a="story" ${g.storyHourFull() ? 'disabled' : ''}>+30m</button>`)}
        <div class="shop-sec">Time warps</div>
        ${SHOP.warp.map((w, k) => item('⏩', `${w.sec / 3600}h of coins`, `Instantly get ${fmt(g.rewardCoins(w.sec))} coins`, pay(`warp:${k}`, w.cost, `<button class="btn gold" data-a="warp" data-k="${k}"><span class="ico ico-cheese"></span>${w.cost}</button>`))).join('')}
        <div class="shop-sec">Library upgrades (kept forever)</div>
        ${item('🫙', 'Bigger Coin Jar', `Holds ${fmtTime(SHOP.jar[s.shop.jar].sec)} of coins${jarN ? ` → ${fmtTime(jarN.sec)}` : ' (max)'}`, jarN ? pay('jar:0', jarN.cost, `<button class="btn gold" data-a="jar"><span class="ico ico-cheese"></span>${jarN.cost}</button>`) : '<button class="btn plain" disabled>MAX</button>')}
        ${item('🌙', 'Night Shift', `Offline earnings for ${fmtTime(SHOP.offline[s.shop.offline].sec)}${offN ? ` → ${fmtTime(offN.sec)}` : ' (max)'}`, offN ? pay('offline:0', offN.cost, `<button class="btn gold" data-a="offline"><span class="ico ico-cheese"></span>${offN.cost}</button>`) : '<button class="btn plain" disabled>MAX</button>')}
        ${item('👓', 'Golden Reading Glasses', `Permanent ×2 income (owned: ${s.shop.perm})`, perm != null ? `<button class="btn gold" data-a="perm"><span class="ico ico-cheese"></span>${perm}</button>` : '<button class="btn plain" disabled>MAX</button>')}
        ${item('🎁', 'Mystery Book Crate', 'A random book for your album', pay('crate:0', SHOP.crate, `<button class="btn gold" data-a="crate"><span class="ico ico-cheese"></span>${SHOP.crate}</button>`))}
        ${furnitureHtml()}
        ${CONFIG.iapEnabled ? `<div class="shop-sec">Support the library</div>
        ${IAP_PRODUCTS.map((p) => item(p.icon, p.title, p.desc, `<button class="btn" data-iap="${p.id}" ${p.id === 'no_ads' && s.removeAds ? 'disabled' : ''}>${p.id === 'no_ads' && s.removeAds ? 'Owned' : p.price}</button>`)).join('')}` : ''}
        <div class="muted" style="margin-top:6px">Your golden cheese: <b>${fmt(s.cheese)}</b></div>`;
      body.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => act(b.dataset.a, +b.dataset.k, b)));
      body.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); cat = b.dataset.cat; const y = body.closest('.modal-body')?.scrollTop; render(); if (y != null) body.closest('.modal-body').scrollTop = y; }));
      body.querySelector('[data-deal]')?.addEventListener('click', () => {
        const d = g.dailyDeal(); const floor = this.ui.world.focusedRoom();
        if (!g.buyDeal()) { sfx.error(); toast('Not enough golden cheese 🧀'); return; }
        if (!g.floorFurniture(floor)[d.item.slot]) g.placeFurniture(floor, d.item.slot, d.item.id);
        sfx.buy(); sfx.sparkle(); toast(`${d.item.icon} ${d.item.name} is yours! A bargain!`, 'gold'); render();
      });
      body.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => {
        const f = FURN[b.dataset.f]; const floor = this.ui.world.focusedRoom();
        if (!g.buyFurniture(f.id, floor)) { sfx.error(); toast('Not enough golden cheese 🧀'); return; }
        sfx.buy(); sfx.sparkle(); haptic('medium');
        const placed = g.floorFurniture(floor)[f.slot] === f.id;
        toast(placed ? `${f.icon} ${f.name} is now in ${ROOMS[floor].name}!` : `${f.icon} ${f.name} bought! Place it from 🔨 Upgrade.`, 'gold');
        this.ui.world.chatter.react(floor, 'furniture');
        const y = body.closest('.modal-body')?.scrollTop; render(); if (y != null) body.closest('.modal-body').scrollTop = y;
      }));
      body.querySelectorAll('[data-iap]').forEach((b) => b.addEventListener('click', async () => { sfx.tap(); const ok = await purchase(b.dataset.iap, g); if (ok) { sfx.reward(); render(); } }));
      body.querySelectorAll('[data-adbuy]').forEach((b) => b.addEventListener('click', () => adBuy(b)));
    };
    // Pay with ads: each ad moves the item's progress on; the last one hands it over.
    const adBuy = async (btn) => {
      sfx.tap();
      if (!g.offerReady('adbuy', 30)) { toast('That’s plenty of ads for today. Come back tomorrow! 🌙'); return; }
      btn.disabled = true;
      const keep = () => { const y = body.closest('.modal-body')?.scrollTop; render(); if (y != null) body.closest('.modal-body').scrollTop = y; };
      if (!(await Ads.rewarded('shop_adbuy'))) { keep(); return; }
      s.stats.adsWatched++; g.useOffer('adbuy');
      const key = btn.dataset.adbuy; const price = +btn.dataset.price;
      if (!g.adBuyStep(key, price)) { toast(`📺 ${g.adBuyProgress(key)}/${g.adsFor(price)} — nearly there!`); keep(); return; }
      const [kind, arg] = key.split(':');
      if (kind === 'f') {
        const f = FURN[arg]; const floor = this.ui.world.focusedRoom();
        g.buyFurniture(f.id, floor, true); sfx.buy(); sfx.sparkle();
        toast(`${f.icon} ${f.name} is yours!`, 'gold'); this.ui.world.chatter.react(floor, 'furniture');
      } else {
        const res = g.shopBuy(kind, +arg, true);
        if (kind === 'warp') this.celebrate([{ kind: 'coins', amount: res }], centerOf(btn));
        else if (kind === 'crate') this.bookReveal({ kind: 'book', ...res });
        else { sfx.levelUp(); toast('Upgraded! ✨', 'gold'); }
      }
      keep();
    };
    const act = async (a, k, btn) => {
      sfx.tap();
      if (a === 'adcheese') {
        btn.disabled = true;
        if (await Ads.rewarded('shop_cheese')) { s.stats.adsWatched++; g.claimAdCheese(); this.celebrate([{ kind: 'cheese', amount: SHOP.adCheese }], centerOf(btn)); }
        render(); return;
      }
      if (a === 'story') { btn.disabled = true; if (await Ads.rewarded('story_hour')) { s.stats.adsWatched++; g.addStoryHour(); bigText('Story Hour ×2!'); } render(); return; }
      if (a === 'deal') { btn.disabled = true; if (await Ads.rewarded('shop_deal')) { s.stats.adsWatched++; g.useOffer('deal'); g.unlockDeal(); toast('🏷️ Half price unlocked for today!', 'gold'); } render(); return; }
      if (a === 'fest' || a === 'festx2') {
        if (a === 'festx2') { btn.disabled = true; if (!(await Ads.rewarded('festival_gift'))) { render(); return; } s.stats.adsWatched++; }
        const got = g.claimFestGift(a === 'festx2' ? 2 : 1); if (got) this.celebrate(got, centerOf(btn)); render(); return;
      }
      const res = g.shopBuy(a, k);
      if (!res) { sfx.error(); toast('Not enough golden cheese 🧀'); return; }
      if (a === 'warp') this.celebrate([{ kind: 'coins', amount: res }], centerOf(btn));
      else if (a === 'crate') this.bookReveal({ kind: 'book', ...res });
      else { sfx.levelUp(); toast('Upgraded! ✨', 'gold'); }
      render();
    };
    render();
    hd = openModal({ title: '🛒 Shop', body, wide: true });
  }

  /* ---------- moving (see places.js) ---------- */
  branch() { this.move(); }

  /* ---------- floors list ---------- */
  floors() {
    const g = this.game; const s = g.s;
    const next = g.nextFloor(); const cap = g.floorCap();
    const floorRows = ROOMS.map((r, k) => {
      const st = s.rooms[k];
      const beyond = !st.built && !st.buildEnd && k >= cap;
      const status = st.built ? `${fmt(g.roomIncome(k))}/s · Lv ${st.lvl}` : st.buildEnd ? `Building… ${fmtTime(g.buildRemaining(k))}` : k === next ? `Unlock for ${fmt(r.unlock)} coins` : beyond ? 'Needs a bigger site 🚚' : 'Locked';
      return `<button class="floor-item ${st.built || st.buildEnd || k === next ? '' : 'locked'}" data-k="${k}">
        <span class="fi-sw" style="background:repeating-linear-gradient(90deg,${r.pal.wall} 0 5px,${r.pal.wall2} 5px 10px)"></span>
        <div class="fi-body"><b>${k + 1}. ${st.built || k <= next ? r.name : '???'}</b><div>${status}</div></div><span>${st.built ? '›' : st.buildEnd ? '🔨' : k === next ? '🎈' : beyond ? '🚚' : '🔒'}</span></button>`;
    }).reverse().join('');
    const wingRows = WINGS.map((w) => {
      const st = g.wing(w.id); const open = g.wingOpen(w.id);
      const status = st.built ? `Lv ${st.lvl} · +${Math.round(E.wingsMult({ wings: { [w.id]: st } }) * 100 - 100)}% library income` : st.buildEnd ? `Building… ${fmtTime(g.wingRemaining(w.id))}` : open ? `Build for ${fmt(w.unlock)} coins` : 'Plot opens at a bigger site 🚚';
      return `<button class="floor-item ${st.built || open ? '' : 'locked'}" data-w="${w.id}"><span class="fi-sw fi-ico">${w.icon}</span><div class="fi-body"><b>${w.name}</b><div>${status}</div></div><span>${st.built ? '›' : st.buildEnd ? '🔨' : open ? '➕' : '🔒'}</span></button>`;
    }).join('');
    const d = s.deep;
    const deepRow = d.open ? `<button class="floor-item" data-deep><span class="fi-sw fi-ico">⛏️</span><div class="fi-body"><b>The Deep Stacks</b><div>${g.hallsDone()}/8 halls restored · ${Object.keys(d.fossils).length}/4 fossils</div></div><span>›</span></button>`
      : `<div class="floor-item locked"><span class="fi-sw fi-ico">❓</span><div class="fi-body"><b>???</b><div>Something is hidden under the vault… (build the ${ROOMS[4].name})</div></div><span>🔒</span></div>`;
    const siteRow = g.siteFull() || s.move.end ? `<button class="floor-item move-row" data-move><span class="fi-sw fi-ico">🚚</span><div class="fi-body"><b>${s.move.end ? (g.moveReady() ? 'Ready to move in!' : `Movers at work: ${fmtTime(g.moveRemaining())}`) : `This site is full (${cap} floors)`}</b><div>Move to ${g.nextBranch().name}: ${g.nextBranch().floors} floors, ${g.nextBranch().plots} wing plots</div></div><span>›</span></button>` : '';
    const body = h(`<div>${siteRow}<div class="section-title">Floors <small>${g.builtCount()}/${cap} at ${g.branch().name}</small></div>${floorRows}
      <div class="section-title">Wings <small>beside the library · swipe sideways to visit</small></div>${wingRows}
      <div class="section-title">Underground</div>${deepRow}</div>`);
    body.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
      const k = +b.dataset.k; const st = s.rooms[k];
      sfx.tap(); closeModal();
      if (st.built) this.ui.openRoom(k);
      else if (st.buildEnd) { this.ui.world.panToRoom(k); this.construction(k); }
      else if (k === next) { this.ui.world.panToTop(); this.build(k); }
      else if (k >= cap) setTimeout(() => this.move(), 200);
    }));
    body.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); closeModal(); const id = b.dataset.w; this.ui.panToWing(id); setTimeout(() => this.wing(id), 250); }));
    body.querySelector('[data-deep]')?.addEventListener('click', () => { sfx.tap(); closeModal(); setTimeout(() => this.deep(), 200); });
    body.querySelector('[data-move]')?.addEventListener('click', () => { sfx.tap(); closeModal(); setTimeout(() => this.move(), 200); });
    openModal({ title: '🏛️ Your Library', body });
  }

  /* ---------- reputation ---------- */
  reputation() {
    const s = this.game.s;
    openModal({
      title: `⭐ Reputation Lv ${s.rep}`,
      body: `<div class="art">🏅</div><div class="flavor">Every upgrade and happy visitor spreads the word about your library.</div>
        <div class="big-reward" style="font-size:22px">+${(s.rep - 1) * 2}% income</div>
        <div class="muted">${s.xp} / ${E.repXpNeeded(s.rep)} XP to the next level · each level gives golden cheese and +2% income</div>`,
      buttons: [{ label: 'Keep reading!', cls: 'plain' }],
    });
  }

  /* ---------- settings ---------- */
  settings() {
    const g = this.game; const st = g.s.settings;
    const body = h(`<div>
      <div class="set-row">🎵 Music <button class="toggle ${st.music ? 'on' : ''}" data-t="music"></button></div>
      <div class="set-row">🔔 Sound effects <button class="toggle ${st.sfx ? 'on' : ''}" data-t="sfx"></button></div>
      <div class="set-row">📳 Vibration <button class="toggle ${st.haptics ? 'on' : ''}" data-t="haptics"></button></div>
      <div class="set-row">💬 Mouse chatter <button class="toggle ${st.chatter ? 'on' : ''}" data-t="chatter"></button></div>
      <div class="set-row">🍂 Season speed <button class="btn plain" style="min-height:34px;font-size:13px;min-width:96px" data-seasons>${SPEED_LABEL[st.seasonSpeed || 'normal']}</button></div>
      <div class="muted" style="text-align:left;margin:-4px 4px 4px;font-size:11.5px" data-seasons-note></div>
      <div class="set-row">🖥️ Graphics <button class="btn plain" style="min-height:34px;font-size:13px;min-width:96px" data-gfx>${GRAPHICS_LABEL[st.graphics || 'auto']}</button></div>
      <div class="muted" style="text-align:left;margin:-4px 4px 4px;font-size:11.5px" data-gfx-note></div>
      <div class="set-row">🔔 Reminders <button class="toggle ${st.notifications ? 'on' : ''}" data-t="notifications"></button></div>
      <div class="set-row">📜 Replay the story <button class="btn plain" style="min-height:34px;font-size:13px" data-replay>Replay</button></div>
      ${Ads.provider === 'admob' ? '<div class="set-row">🔒 Ad privacy options <button class="btn plain" style="min-height:34px;font-size:13px" data-privacy>Open</button></div>' : ''}
      <div class="set-row">🧹 Reset progress <button class="btn red" style="min-height:34px;font-size:13px" data-reset>Reset</button></div>
      ${CONFIG.devTools ? `<div class="dev-box"><b>🛠️ Developer tools</b> <small>for testing: turn off in src/config.js before publishing</small>
        <div class="dev-grid">
          <button class="btn gold" data-dev="cheese1">+1,000 🧀</button>
          <button class="btn gold" data-dev="cheese10">+10,000 🧀</button>
          <button class="btn" data-dev="coinsHour">+1 hour of coins</button>
          <button class="btn" data-dev="coinsDay">+1 day of coins</button>
          <button class="btn plain" data-dev="timers">⏩ Finish all timers</button>
          <button class="btn plain" data-dev="ads">📺 Instant ads: <b data-devads>${Ads.devInstant ? 'ON' : 'OFF'}</b></button>
        </div></div>` : ''}
      <div class="credits">
        <b>Whiskerwood Library</b> v${CONFIG.version} · ads: ${Ads.provider}<br>
        Music: original waltz composed for this game, performed live by Web Audio synths.<br>
        <a href="${CONFIG.privacyUrl}" target="_blank" rel="noopener">Privacy policy</a><br>
        Sound effects: <a href="https://kenney.nl" target="_blank" rel="noopener">Kenney.nl</a> (CC0) — RPG Audio &amp; Interface Sounds.<br>
        Fonts: Fredoka &amp; Kalam (SIL Open Font License).<br>
        Every mouse, book and floor is hand-drawn in code.
      </div></div>`);
    body.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.t; st[k] = !st[k]; b.classList.toggle('on', st[k]); sfx.tap();
      this.ui.applySettings();
      if (k === 'notifications' && st[k]) this.ui.native?.askPermission?.();
    }));
    body.querySelector('[data-privacy]')?.addEventListener('click', () => Ads.privacyOptions());
    body.querySelectorAll('[data-dev]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.dev; sfx.reward();
      if (k === 'cheese1' || k === 'cheese10') { const n = k === 'cheese1' ? 1000 : 10000; g.addCheese(n); toast(`🛠️ +${fmt(n)} golden cheese`, 'gold'); }
      if (k === 'coinsHour' || k === 'coinsDay') { const amt = g.devCoins(k === 'coinsHour' ? 3600 : 86400); toast(`🛠️ +${fmt(amt)} coins`, 'gold'); }
      if (k === 'timers') { g.devFinishTimers(); toast('🛠️ Every timer is finished'); }
      if (k === 'ads') { Ads.devInstant = !Ads.devInstant; g.s.flags.devInstantAds = Ads.devInstant; b.querySelector('[data-devads]').textContent = Ads.devInstant ? 'ON' : 'OFF'; toast(Ads.devInstant ? '🛠️ Rewarded ads now pay out instantly' : '🛠️ Ads play normally again'); }
    }));
    // Season speed: how long a Mouse Year lasts. Your place in the year is kept.
    const seasonNote = () => { body.querySelector('[data-seasons-note]').textContent = `A Mouse Year lasts ${Math.round((g.seasonSec() * 4) / 60)} minutes of play — every season comes round with its festivals.`; };
    seasonNote();
    body.querySelector('[data-seasons]').addEventListener('click', (e) => {
      const cur = st.seasonSpeed || 'normal';
      const next = SPEED_ORDER[(SPEED_ORDER.indexOf(cur) + 1) % SPEED_ORDER.length];
      g.setSeasonSpeed(next); sfx.tap();
      e.currentTarget.textContent = SPEED_LABEL[next]; seasonNote();
    });
    const gfxNote = () => { body.querySelector('[data-gfx-note]').textContent = { auto: 'Adjusts itself to keep everything smooth on your phone.', beautiful: 'Sharpest picture. Best on newer phones.', balanced: 'A little softer, much lighter on the battery.', smooth: 'Fastest: for older phones and long play sessions.' }[st.graphics || 'auto']; };
    gfxNote();
    body.querySelector('[data-gfx]').addEventListener('click', (e) => {
      const next = GRAPHICS[(GRAPHICS.indexOf(st.graphics || 'auto') + 1) % GRAPHICS.length];
      this.ui.quality?.setMode(next); sfx.tap();
      e.currentTarget.textContent = GRAPHICS_LABEL[next]; gfxNote();
    });
    body.querySelector('[data-replay]').addEventListener('click', () => {
      closeModal();
      g.s.story.seen = g.s.story.seen.filter((id) => id !== 'intro');
      this.ui.story.play('intro');
    });
    body.querySelector('[data-reset]').addEventListener('click', () => {
      openModal({
        replace: true, title: 'Reset everything?', row: true,
        body: '<div class="art">😿</div><div class="flavor">This deletes all floors, books, cheese and progress. It cannot be undone.</div>',
        buttons: [{ label: 'Keep playing', cls: 'plain' }, { label: 'Reset', cls: 'red', onClick: () => { this.ui.resetAll(); } }],
      });
    });
    openModal({ title: '⚙️ Settings', body });
  }
}

Object.assign(Screens.prototype, placeScreens);
