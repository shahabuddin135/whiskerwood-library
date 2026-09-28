// All pop-up screens. Rewarded-ad buttons are always optional and clearly marked with 📺.
import { openModal, closeModal } from './modals.js';
import { $, h, ICO, toast, flyTo, bigText, centerOf, haptic } from './dom.js';
import { ROOMS, BOOKS, RARITY, DECOR } from '../data/rooms.js';
import { DAILY, WHEEL, SHOP } from '../data/quests.js';
import { BRANCHES, branchInfo } from '../data/branches.js';
import * as E from '../core/economy.js';
import { fmt, fmtTime } from '../core/format.js';
import { sfx } from '../audio/sfx.js';
import { music } from '../audio/music.js';
import { setSfxEnabled } from '../audio/sfx.js';
import { Ads } from '../ads/ads.js';
import { purchase, IAP_PRODUCTS } from '../iap.js';
import { PRESTIGE_ROOM, STORY_HOUR_MAX, OFFLINE_RATE } from '../core/game.js';
import { CONFIG } from '../config.js';

const SCENE_BG = {
  meadow: 'linear-gradient(135deg,#8cc56f,#e8c465)', windmill: 'linear-gradient(135deg,#9ec5f0,#e8cf7a)',
  cove: 'linear-gradient(135deg,#4f8fd9,#8fd3c7)', pond: 'linear-gradient(135deg,#5e9c55,#79b8cf)', castle: 'linear-gradient(135deg,#4b3f78,#b27fa0)',
};

export function bookHtml(b, count = 1) {
  if (!count) return '<div class="book unknown">?</div>';
  return `<div class="book ${b.rarity}" style="background:${b.color}"><span class="rar">${RARITY[b.rarity].name}</span><span>${b.title}</span>${count > 1 ? `<span class="count">×${count}</span>` : ''}</div>`;
}

export function rewardsHtml(list) {
  return `<div class="rewards">${list.map((r) => {
    if (r.kind === 'coins') return `<div class="rw"><span class="ico ico-coin"></span>${fmt(r.amount)}</div>`;
    if (r.kind === 'cheese') return `<div class="rw"><span class="ico ico-cheese"></span>${fmt(r.amount)}</div>`;
    if (r.kind === 'boost') return `<div class="rw">📖 ×2 · ${fmtTime(r.sec)}</div>`;
    if (r.kind === 'book') return `<div class="rw">📕 ${r.book.title}${r.dup ? ` <small>(dup +${r.cheese}🧀)</small>` : ''}</div>`;
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
      buttons: [{ label: 'Visit the new floor', onClick: () => { this.ui.world.panToRoom(i); } }],
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
      body: `<div class="card-reveal">${bookHtml(b)}</div><div class="muted">${ROOMS[b.room].genre} · ${RARITY[b.rarity].name}</div>
        <div class="flavor">${r.dup ? `Traded for +${r.cheese} golden cheese.` : `+10% income on ${ROOMS[b.room].name}!`}</div>
        ${r.setDone ? '<div class="big-reward" style="font-size:20px">Set complete! ×2 floor income</div>' : ''}`,
      buttons: [{ label: 'Lovely!', cls: 'plain' }],
    });
    sfx.sparkle();
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
    const body = h('<div><div class="bonus-line" data-total></div><div class="tabs" data-tabs></div><div class="album-grid" data-grid></div><div class="muted" data-note></div></div>');
    const render = () => {
      const owned = E.booksOwned(s);
      body.querySelector('[data-total]').innerHTML = `📚 ${owned} / ${BOOKS.length} books · each book +10% floor income · full set ×2`;
      body.querySelector('[data-tabs]').innerHTML = ROOMS.map((r, k) => {
        const n = BOOKS.filter((b) => b.room === k && s.album[b.id]).length;
        return `<button data-k="${k}" class="${k === tab ? 'on' : ''} ${s.rooms[k].built ? '' : 'locked'}">${n === 5 ? '⭐ ' : ''}${r.genre} ${n}/5</button>`;
      }).join('');
      body.querySelector('[data-grid]').innerHTML = BOOKS.filter((b) => b.room === tab).map((b) => bookHtml(b, s.album[b.id] || 0)).join('');
      body.querySelector('[data-note]').innerHTML = `${ROOMS[tab].name}: ×${E.albumMult(s, tab).toFixed(1)} income from books.<br>Books come from author signings, the wheel, parcels, daily gifts and the shop.`;
      body.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); tab = +b.dataset.k; render(); }));
    };
    render();
    openModal({ title: '📚 Book Album', body, wide: true });
  }

  /* ---------- shop ---------- */
  shop() {
    const g = this.game; const s = g.s;
    const body = h('<div data-shop></div>');
    let hd;
    const item = (ico, title, desc, btn) => `<div class="shop-item"><div class="si-ico">${ico}</div><div class="si-body"><b>${title}</b><div>${desc}</div></div>${btn}</div>`;
    const render = () => {
      const jarN = SHOP.jar[s.shop.jar + 1]; const offN = SHOP.offline[s.shop.offline + 1]; const perm = SHOP.perm[s.shop.perm];
      body.innerHTML = `
        <div class="shop-sec">Free treats</div>
        ${item('🧀', `+${SHOP.adCheese} Golden Cheese`, `${g.adCheeseLeft()} left today`, `<button class="btn ad" data-a="adcheese" ${g.adCheeseLeft() <= 0 ? 'disabled' : ''}>Free</button>`)}
        ${item('📖', 'Story Hour ×2', g.storyHourLeft() > 0 ? `Active · ${fmtTime(g.storyHourLeft())} left` : 'Double income for 30 min', `<button class="btn ad" data-a="story" ${g.storyHourFull() ? 'disabled' : ''}>+30m</button>`)}
        <div class="shop-sec">Time warps</div>
        ${SHOP.warp.map((w, k) => item('⏩', `${w.sec / 3600}h of coins`, `Instantly get ${fmt(g.rewardCoins(w.sec))} coins`, `<button class="btn gold" data-a="warp" data-k="${k}"><span class="ico ico-cheese"></span>${w.cost}</button>`)).join('')}
        <div class="shop-sec">Library upgrades (kept forever)</div>
        ${item('🫙', 'Bigger Coin Jar', `Holds ${fmtTime(SHOP.jar[s.shop.jar].sec)} of coins${jarN ? ` → ${fmtTime(jarN.sec)}` : ' (max)'}`, jarN ? `<button class="btn gold" data-a="jar"><span class="ico ico-cheese"></span>${jarN.cost}</button>` : '<button class="btn plain" disabled>MAX</button>')}
        ${item('🌙', 'Night Shift', `Offline earnings for ${fmtTime(SHOP.offline[s.shop.offline].sec)}${offN ? ` → ${fmtTime(offN.sec)}` : ' (max)'}`, offN ? `<button class="btn gold" data-a="offline"><span class="ico ico-cheese"></span>${offN.cost}</button>` : '<button class="btn plain" disabled>MAX</button>')}
        ${item('👓', 'Golden Reading Glasses', `Permanent ×2 income (owned: ${s.shop.perm})`, perm != null ? `<button class="btn gold" data-a="perm"><span class="ico ico-cheese"></span>${perm}</button>` : '<button class="btn plain" disabled>MAX</button>')}
        ${item('🎁', 'Mystery Book Crate', 'A random book for your album', `<button class="btn gold" data-a="crate"><span class="ico ico-cheese"></span>${SHOP.crate}</button>`)}
        ${CONFIG.iapEnabled ? `<div class="shop-sec">Support the library</div>
        ${IAP_PRODUCTS.map((p) => item(p.icon, p.title, p.desc, `<button class="btn" data-iap="${p.id}" ${p.id === 'no_ads' && s.removeAds ? 'disabled' : ''}>${p.id === 'no_ads' && s.removeAds ? 'Owned' : p.price}</button>`)).join('')}` : ''}
        <div class="muted" style="margin-top:6px">Your golden cheese: <b>${fmt(s.cheese)}</b></div>`;
      body.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => act(b.dataset.a, +b.dataset.k, b)));
      body.querySelectorAll('[data-iap]').forEach((b) => b.addEventListener('click', async () => { sfx.tap(); const ok = await purchase(b.dataset.iap, g); if (ok) { sfx.reward(); render(); } }));
    };
    const act = async (a, k, btn) => {
      sfx.tap();
      if (a === 'adcheese') {
        btn.disabled = true;
        if (await Ads.rewarded('shop_cheese')) { s.stats.adsWatched++; g.claimAdCheese(); this.celebrate([{ kind: 'cheese', amount: SHOP.adCheese }], centerOf(btn)); }
        render(); return;
      }
      if (a === 'story') { btn.disabled = true; if (await Ads.rewarded('story_hour')) { s.stats.adsWatched++; g.addStoryHour(); bigText('Story Hour ×2!'); } render(); return; }
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

  /* ---------- prestige ---------- */
  branch() {
    const g = this.game; const s = g.s;
    const cur = g.branch(); const next = g.nextBranch();
    const pend = g.pendingQuills(); const can = g.canPrestige();
    const req = !s.rooms[PRESTIGE_ROOM].built;
    openModal({
      title: '🌿 New Branch', wide: true,
      body: `<div class="branch-card" style="background:${SCENE_BG[cur.scene]}"><b>Now: ${cur.name}</b><div>${cur.blurb}</div><div>Branch bonus ×${cur.mult} · ${s.quills} Golden Quills (+${s.quills * 10}% income)</div></div>
        <div class="art" style="font-size:34px">⬇️</div>
        <div class="branch-card" style="background:${SCENE_BG[next.scene]}"><b>Next: ${next.name}</b><div>${next.blurb}</div><div>Branch bonus ×${next.mult}</div></div>
        <div class="big-reward"><span class="ico ico-quill"></span>+${pend} Golden Quills</div>
        <div class="flavor">Open a brand-new library! Floors and coins start fresh, but you keep your golden cheese, books, reputation and shop upgrades. Each quill adds +10% income forever.</div>
        ${req ? `<div class="muted" style="color:#b5523b">Build the ${ROOMS[PRESTIGE_ROOM].name} to unlock new branches.</div>` : pend < 1 ? '<div class="muted" style="color:#b5523b">Earn more coins in this branch to gain a quill.</div>' : ''}`,
      buttons: [{
        label: `Open ${next.name}`, cls: 'gold', disabled: !can,
        onClick: () => { this.confirmPrestige(pend, next); },
      }],
    });
  }

  confirmPrestige(pend, next) {
    openModal({
      title: 'Are you sure?',
      body: `<div class="art">🧳🐭</div><div class="flavor">Pack up the books and move to <b>${next.name}</b>? You'll earn <b>${pend} Golden Quills</b>.</div>`,
      row: true,
      buttons: [
        { label: 'Not yet', cls: 'plain' },
        { label: "Let's go!", cls: 'gold', onClick: () => { this.ui.doPrestige(); } },
      ],
    });
  }

  /* ---------- floors list ---------- */
  floors() {
    const g = this.game; const s = g.s;
    const next = g.nextFloor();
    const body = h(`<div>${ROOMS.map((r, k) => {
      const st = s.rooms[k];
      const status = st.built ? `${fmt(g.roomIncome(k))}/s · Lv ${st.lvl}` : st.buildEnd ? `Building… ${fmtTime(g.buildRemaining(k))}` : k === next ? `Unlock for ${fmt(r.unlock)} coins` : 'Locked';
      return `<button class="floor-item ${st.built || st.buildEnd || k === next ? '' : 'locked'}" data-k="${k}">
        <span class="fi-sw" style="background:repeating-linear-gradient(90deg,${r.pal.wall} 0 5px,${r.pal.wall2} 5px 10px)"></span>
        <div class="fi-body"><b>${k + 1}. ${st.built || k <= next ? r.name : '???'}</b><div>${status}</div></div><span>${st.built ? '›' : st.buildEnd ? '🔨' : k === next ? '🎈' : '🔒'}</span></button>`;
    }).reverse().join('')}</div>`);
    body.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
      const k = +b.dataset.k; const st = s.rooms[k];
      sfx.tap(); closeModal();
      if (st.built) this.ui.openRoom(k);
      else if (st.buildEnd) { this.ui.world.panToRoom(k); this.construction(k); }
      else if (k === next) { this.ui.world.panToTop(); this.build(k); }
    }));
    openModal({ title: '🏛️ Library Floors', body });
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
      <div class="set-row">🔔 Reminders <button class="toggle ${st.notifications ? 'on' : ''}" data-t="notifications"></button></div>
      <div class="set-row">📜 Replay the story <button class="btn plain" style="min-height:34px;font-size:13px" data-replay>Replay</button></div>
      ${Ads.provider === 'admob' ? '<div class="set-row">🔒 Ad privacy options <button class="btn plain" style="min-height:34px;font-size:13px" data-privacy>Open</button></div>' : ''}
      <div class="set-row">🧹 Reset progress <button class="btn red" style="min-height:34px;font-size:13px" data-reset>Reset</button></div>
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
