// All pop-up screens. Rewarded-ad buttons are always optional and clearly marked (purple, with a TV).
import { openModal, closeModal } from './modals.js';
import { $, h, ICO, ig, toast, flyTo, bigText, centerOf, haptic } from './dom.js';
import { icon, iconInner } from './icons.js';
import { artImg } from './art.js';
import { portrait } from './portraits.js';
import { thumb } from './thumbs.js';
import { ROOMS, BOOKS, RARITY, DECOR } from '../data/rooms.js';
import { DAILY, WHEEL, SHOP } from '../data/quests.js';
import { FURN, RARITY_BONUS } from '../data/furniture.js';
import { CHARACTERS } from '../data/story.js';
import * as E from '../core/economy.js';
import { fmt, fmtTime } from '../core/format.js';
import { sfx } from '../audio/sfx.js';
import { Ads } from '../ads/ads.js';
import { PRESTIGE_ROOM, STORY_HOUR_MAX } from '../core/game.js';
import { CONFIG } from '../config.js';
import { shopScreen } from './shopScreen.js';
import { collectionScreen } from './collectionScreen.js';
import { mapScreen, arrivalScreen } from './mapScreen.js';
import { festivalScreen } from './festivalScreen.js';

export function bookHtml(b, count = 1, tag = 'div') {
  if (!count) return '<div class="book unknown">?</div>';
  return `<${tag} class="book ${b.rarity}" data-book="${b.id}" style="background:${b.color}"><span class="rar">${RARITY[b.rarity].name}</span><span>${b.title}</span>${b.author ? `<span class="by">${b.author}</span>` : ''}${count > 1 ? `<span class="count">×${count}</span>` : ''}</${tag}>`;
}

export function rewardsHtml(list) {
  return `<div class="rewards">${list.map((r) => {
    if (r.kind === 'coins') return `<div class="rw"><span class="ico ico-coin"></span>${fmt(r.amount)}</div>`;
    if (r.kind === 'cheese') return `<div class="rw"><span class="ico ico-cheese"></span>${fmt(r.amount)}</div>`;
    if (r.kind === 'boost') return `<div class="rw">${ig('hourglass')} ×2 · ${fmtTime(r.sec)}</div>`;
    if (r.kind === 'book') return `<div class="rw">${ig('book')} ${r.book.title}${r.dup ? ` <small>(dup +${r.cheese})</small>` : ''}</div>`;
    if (r.kind === 'fbook') return `<div class="rw">${ig('book')} ${r.book.title}</div>`;
    if (r.kind === 'tokens') return `<div class="rw">${ig(r.icon || 'festival')} +${r.amount}</div>`;
    if (r.kind === 'item') return `<div class="rw"><img src="${thumb(r.item.id, 42, 32)}" width="42" height="32" alt=""> ${r.item.name}</div>`;
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
        if (!ok) { toast('No reward this time — watch the whole ad to earn it', '', 'tv'); return false; }
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
      if (r.kind === 'item') setTimeout(() => toast(`New furniture: <b>${r.item.name}</b>! It moves with you everywhere.`, 'gold', 'chair'), delay + 200);
      delay += 150;
    }
    sfx.reward(); haptic('medium');
  }

  /* ---------- first launch ---------- */
  welcome() {
    openModal({
      title: 'A Letter For You', icon: 'letter',
      urgent: true, dismissable: false,
      body: `${artImg('letter')}
        <div class="flavor" style="text-align:left">Dear little one,<br><br>
        I've left you my tiny library in the old meadow. It's only one cosy nook for now, but every mouse who reads here drops a coin in the jar.<br><br>
        Add armchairs, fill the shelves, build new floors — and who knows? One day even the <b>Queen</b> may come to borrow a book.<br><br>
        With love, <b>Grandma Mimsy</b></div>`,
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
      title: 'Welcome back!', icon: 'hourglass', urgent: true, dismissable: false,
      body: `${artImg('sleep')}
        <div class="flavor">While you were away for <b>${fmtTime(sec)}</b>, your mice kept ${g.loc().library} open.</div>
        <div class="big-reward"><span class="ico ico-coin"></span>${fmt(amount)}</div>
        ${capped ? `<div class="muted">Offline earnings stop after ${fmtTime(g.offlineCapSec())}. Extend it in the Shop!</div>` : `<div class="muted">Mice earn ${Math.round(E.offlineRate(g.s) * 100)}% while you're away.</div>`}`,
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
      title: 'New Floor', icon: 'balloon',
      body: `${artImg('build')}
        <div style="font-size:21px;font-weight:700">${def.name}</div>
        <div class="flavor">“${def.sign}” — a home for ${def.genre.toLowerCase()} lovers, with its own seats, a ${def.centerName.toLowerCase()} and 5 books to collect.</div>
        <div style="display:flex;gap:6px;justify-content:center;margin:8px 0">
          <span style="width:46px;height:30px;border-radius:4px;border:2px solid #5b3a26;background:repeating-linear-gradient(90deg,${def.pal.wall} 0 7px,${def.pal.wall2} 7px 14px)"></span>
          <span style="width:30px;height:30px;border-radius:4px;border:2px solid #5b3a26;background:${def.pal.accent}"></span>
          <span style="width:30px;height:30px;border-radius:4px;border:2px solid #5b3a26;background:${def.pal.seatCol}"></span>
        </div>
        <div class="muted">Build time: ${g.buildSeconds(i) ? fmtTime(g.buildSeconds(i)) : 'instant'}${g.hasPerk('swiftScaffolds') ? ' (Swift Scaffolds ×2 speed)' : ''}</div>
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
    const body = h(`<div>${artImg('hammer')}<div style="font-size:19px;font-weight:700">${def.name}</div>
      <div class="flavor">The builder mice are hammering away!</div><div class="big-reward" data-t>--</div></div>`);
    const cheeseCost = () => g.cheeseToFinish(i);
    const m = openModal({
      title: 'Under Construction', icon: 'hammer', body,
      buttons: [
        { ...this.adBtn('Speed up', 'build_speedup', () => { const done = g.speedBuild(i); toast(done ? 'Finished!' : 'Build time halved!', 'gold', 'hammer'); }) },
        { label: `Finish now <span class="ico ico-cheese"></span> <span data-c>${cheeseCost()}</span>`, cls: 'gold', onClick: () => { const c = cheeseCost(); if (!g.spendCheese(c)) { toast('Not enough golden cheese', '', 'cheese'); sfx.error(); return false; } g.finishBuildNow(i); return true; } },
      ],
      onOpen: (hd) => {
        const tick = () => {
          const rem = g.buildRemaining(i);
          if (!g.s.rooms[i].buildEnd) { clearInterval(iv); closeModal(); return; }
          body.querySelector('[data-t]').innerHTML = `${ig('hourglass')} ${fmtTime(rem)}`;
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
      title: 'Grand Opening!', icon: 'sparkle',
      body: `${artImg('grand')}<div style="font-size:21px;font-weight:700">${def.name}</div>
        <div class="flavor">${def.genre} lovers are already queueing at the door!</div>
        <div class="muted">New seats, shelves, décor and 5 books to collect. Style it with furniture from the Shop.</div>`,
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
      title: 'Celebrity Visit!', icon: 'star', dismissable: false,
      body: `${artImg('celeb')}<div class="flavor"><b>${name}</b> adored ${ROOMS[i].name} and posted about it. Fans are flooding in!</div>
        <div class="big-reward"><span class="ico ico-coin"></span>${fmt(amt)}</div>`,
      buttons: [
        this.adBtn(`Triple it! <small>${fmt(amt * 3)}</small>`, 'celeb_x3', () => give(amt * 3)),
        { label: 'Thank you!', cls: 'plain', onClick: () => give(amt) },
      ],
    });
  }

  royal(i, name) {
    const g = this.game;
    const long = g.hasPerk('royalFavour') ? 1.5 : 1;
    openModal({
      title: 'A Royal Visit!', icon: 'crown', dismissable: false,
      body: `${artImg('royal')}<div class="flavor"><b>${name}</b> is delighted with your library and issues a royal decree…</div>
        <div class="big-reward">×3 income</div>${long > 1 ? '<div class="muted">Royal Favour: decrees last 50% longer.</div>' : ''}`,
      buttons: [
        this.adBtn(`×3 for ${Math.round(10 * long)} min + 10 <span class="ico ico-cheese"></span>`, 'royal_decree', () => {
          g.addBoost({ mult: 3, sec: 600 * long, label: 'Royal Decree', icon: 'crown', key: 'royal' }); g.addCheese(10);
          this.celebrate([{ kind: 'cheese', amount: 10 }]); bigText('Royal Decree! ×3');
        }),
        { label: `×3 income for ${Math.round(60 * long)} s`, cls: 'gold', onClick: () => { g.addBoost({ mult: 3, sec: 60 * long, label: 'Royal Decree', icon: 'crown', key: 'royal' }); sfx.reward(); } },
      ],
    });
  }

  author(i, name) {
    const g = this.game;
    const res = g.grantBook(i);
    const body = h(`<div><div class="flavor"><b>${name}</b> signed a copy just for you!</div><div class="card-reveal">${bookHtml(res.book)}</div>
      <div class="book-blurb">${res.book.blurb}</div>
      <div class="muted">${res.dup ? `Duplicate → +${res.cheese} golden cheese` : `New book! +10% income on ${ROOMS[res.book.room].name}`}${res.setDone ? '<br><b>Set complete! ×2 floor income!</b>' : ''}</div></div>`);
    sfx.sparkle();
    openModal({
      title: 'Book Signing!', icon: 'pen', body,
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
      title: 'Pigeon Post!', icon: 'parcel', dismissable: false,
      body: `${artImg('parcel')}<div class="flavor">A carrier pigeon dropped a parcel for the library! What could be inside?</div>`,
      buttons: [
        this.adBtn(`Open the Golden Parcel <small>${fmt(big)} + surprises</small>`, 'parcel_gold', () => {
          const list = [{ kind: 'coins', amount: big }]; g.earn(big);
          if (Math.random() < 0.6) { const c = 5 + Math.floor(Math.random() * 6); g.addCheese(c); list.push({ kind: 'cheese', amount: c }); }
          if (Math.random() < 0.4) list.push({ kind: 'book', ...g.grantBook() });
          if (g.festival()) { g.addTokens(3); list.push({ kind: 'tokens', amount: 3, icon: g.festival().token.icon }); }
          this.celebrate(list);
          toast(`Golden Parcel: ${list.map((r) => (r.kind === 'coins' ? fmt(r.amount) + ' coins' : r.kind === 'cheese' ? r.amount + ' cheese' : r.kind === 'tokens' ? r.amount + ' festival tokens' : 'a book!')).join(' + ')}`, 'gold', 'parcel');
        }),
        { label: `Open <span class="ico ico-coin"></span> ${fmt(small)}`, cls: 'plain', onClick: () => { g.earn(small); this.celebrate([{ kind: 'coins', amount: small }]); } },
      ],
    });
  }

  // Monsieur Fromage's verdict. Cheese platter (ad) bumps the rating.
  review(i, rv) {
    const g = this.game;
    const quotes = ['Dreadful. Simply dreadful. I have seen livelier mousetraps.', 'Hmph. It has… potential. Somewhere. Deep down.', 'Pleasant enough, I suppose. The chairs did not bite.', 'Charming! Truly charming. I shall mention it to my aunt.', 'Magnifique! The finest reading room in the land!'];
    const pay = (stars) => {
      const amt = g.rewardCoins(25 * stars); g.earn(amt);
      const list = [{ kind: 'coins', amount: amt }];
      if (stars >= 4) g.addBoost({ mult: 2, sec: 300, room: i, label: 'Rave Review', icon: 'pen', key: `review${i}` });
      if (stars === 5) { g.addCheese(3); list.push({ kind: 'cheese', amount: 3 }); }
      this.celebrate(list);
    };
    const body = (stars) => `${artImg('critic')}
      <div class="review-stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
      <div class="review-quote">“${quotes[stars - 1]}”</div>
      <div class="muted">${ROOMS[i].name}${stars >= 4 ? ' · <b>Rave review: ×2 income for 5 min!</b>' : ''}</div>
      ${rv.notes.length ? `<div class="review-tips"><b>To impress him next time:</b><br>• ${rv.notes.join('<br>• ')}</div>` : ''}`;
    const buttons = [{ label: `Collect <span class="ico ico-coin"></span> ${fmt(g.rewardCoins(25 * rv.stars))}`, cls: 'plain', onClick: () => pay(rv.stars) }];
    if (rv.stars < 5) buttons.unshift(this.adBtn('Offer a cheese platter (+1★)', 'critic_bribe', () => { pay(rv.stars + 1); toast(`Monsieur Fromage loved the cheese: ${'★'.repeat(rv.stars + 1)}!`, 'gold', 'cheese'); }));
    openModal({ title: 'The Review Is In!', icon: 'pen', dismissable: false, body: body(rv.stars), buttons });
  }

  bookReveal(r) {
    const b = r.book;
    openModal({
      title: r.dup ? 'Duplicate Book' : 'New Book!', icon: 'book',
      body: `<div class="card-reveal">${bookHtml(b)}</div><div class="book-meta">by ${b.author} · ${ROOMS[b.room].genre} · ${RARITY[b.rarity].name}</div>
        <div class="book-blurb">${b.blurb}</div>
        <div class="flavor">${r.dup ? `Traded for +${r.cheese} golden cheese.` : `+10% income on ${ROOMS[b.room].name}!`}</div>
        ${r.setDone ? '<div class="big-reward" style="font-size:20px">Set complete! ×2 floor income</div>' : ''}`,
      buttons: [{ label: 'Lovely!', cls: 'plain' }],
    });
    sfx.sparkle();
  }

  // Tap a book anywhere to read its blurb and a (very honest) review.
  bookDetail(b, owned = true) {
    const fest = !!b.festival;
    openModal({
      title: owned ? b.title : 'A mystery book', icon: 'book',
      body: owned ? `<div class="card-reveal">${bookHtml(b)}</div><div class="book-meta">by <b>${b.author}</b> · ${fest ? 'Festival edition' : ROOMS[b.room].genre} · ${RARITY[b.rarity].name}</div>
        <div class="book-blurb">${b.blurb}</div><div class="book-review">${b.review}</div>
        <div class="muted">${fest ? '+3% income everywhere, forever' : `+10% income on ${ROOMS[b.room].name}`}</div>`
        : `<div class="card-reveal"><div class="book unknown">?</div></div><div class="flavor">You haven't found this one yet. ${fest ? 'It is sold in the festival shop.' : 'Books come from milestones, author signings, the wheel, parcels, crates and the shop.'}</div>`,
      buttons: [{ label: 'Close', cls: 'plain' }],
    });
  }

  souvenir(sv) {
    openModal({
      title: 'A Souvenir!', icon: 'keepsake',
      body: `${artImg('keepsake', { id: sv.id })}<div style="font-size:20px;font-weight:700">${sv.name}</div>
        <div class="flavor">${sv.desc}</div>
        <div class="muted">Kept forever in the Keepsake Vault · <b>+5% income everywhere</b></div>`,
      buttons: [{ label: 'Into the vault it goes!', cls: 'gold' }],
    });
    sfx.levelUp();
  }

  trophy(loc) {
    bigText('Location complete!');
    openModal({
      title: 'Trophy Earned!', icon: 'trophy',
      body: `${artImg('keepsake', { id: 'trophy' })}<div style="font-size:20px;font-weight:700">${loc.name} Trophy</div>
        <div class="flavor">Every floor of ${loc.library} is open. The whole town turned up with cake.</div>
        <div class="muted"><b>+15% income, forever</b> — it stands in the Keepsake Vault wherever you go.</div>`,
      buttons: [{ label: 'Hooray!', cls: 'gold' }],
    });
    sfx.fanfare();
  }

  /* ---------- the delivery crate (rewarded-ad chest) ---------- */
  deliveryCrate() {
    const g = this.game;
    if (!g.chestDue()) { toast('The delivery mouse is on the way. Check back soon!', '', 'parcel'); return; }
    const peek = g.rewardCoins(60);
    openModal({
      title: 'A Mysterious Delivery!', icon: 'parcel',
      body: `${artImg('crate')}<div class="flavor">A crate turned up on the doorstep, addressed to “The Librarian”. It rattles. It smells faintly of cheese.</div>
        <div class="muted">Opened properly: 20 minutes of coins, golden cheese, and a chance of new furniture or a book.</div>`,
      buttons: [
        this.adBtn('Open the whole crate', 'delivery_crate', () => { const got = g.openChest(true); this.celebrate(got); this.ui.refreshBadges(); }),
        { label: `Just peek <small>+${fmt(peek)}</small>`, cls: 'plain', onClick: () => { const got = g.openChest(false); this.celebrate(got); this.ui.refreshBadges(); } },
      ],
    });
  }

  // Task chest, with an optional ad to double it.
  taskChest(got) {
    const g = this.game;
    openModal({
      title: 'Task Chest!', icon: 'chest',
      body: `${artImg('chest')}<div class="flavor">All three tasks done — the chest pops open!</div>${rewardsHtml(got)}`,
      buttons: [
        ...(g.offerReady('chestX2', 6) ? [this.adBtn('Double it!', 'task_chest_x2', () => { g.useOffer('chestX2', 60); const again = g.grant({ coinsSec: 180, cheese: 4 }); this.celebrate(again); })] : []),
        { label: 'Lovely!', cls: 'plain', onClick: () => this.celebrate(got) },
      ],
    });
  }

  // Second chances after a failed event: an optional ad to put things right.
  secondChance(kind, i, data = {}) {
    const g = this.game;
    if (!g.offerReady(`second_${kind}`, 4)) return false;
    const cfg = {
      thief: { title: 'Rattigan got away!', art: 'thief', text: `He ran off with <b>${fmt(data.lost || 0)}</b> coins. A quick chase could get it back — with interest!`, btn: 'Chase him down!', ok: () => { const amt = (data.lost || 0) * 1.5; g.earn(amt); this.celebrate([{ kind: 'coins', amount: amt }]); toast('You caught up with Rattigan! He handed it all back, plus a sorry note.', 'gold', 'jar'); } },
      cat: { title: 'The readers are rattled!', art: 'cat', text: `Baroness Clawdia scared everyone in ${ROOMS[i]?.name}. Some warm milk and biscuits would calm them down.`, btn: 'Serve milk & biscuits', ok: () => { const amt = g.rewardCoins(90); g.earn(amt); this.celebrate([{ kind: 'coins', amount: amt }]); } },
      spoiler: { title: 'The ending was spoiled!', art: 'spoiler', text: `The readers in ${ROOMS[i]?.name} are devastated. A surprise cookie party might cheer them up.`, btn: 'Throw a cookie party', ok: () => { g.removeBoost(`spoil${i}`); const amt = g.rewardCoins(60); g.earn(amt); this.celebrate([{ kind: 'coins', amount: amt }]); } },
    }[kind];
    if (!cfg) return false;
    openModal({
      title: cfg.title, icon: kind === 'cat' ? 'cat' : kind === 'spoiler' ? 'megaphone' : 'jar',
      body: `${artImg(cfg.art)}<div class="flavor">${cfg.text}</div>`,
      buttons: [this.adBtn(cfg.btn, `second_chance_${kind}`, () => { g.useOffer(`second_${kind}`, 120); cfg.ok(); }), { label: 'Never mind', cls: 'plain' }],
    });
    return true;
  }

  /* ---------- boosts ---------- */
  storyHour() {
    const g = this.game;
    const left = g.storyHourLeft();
    openModal({
      title: 'Story Hour', icon: 'hourglass',
      body: `${artImg('story')}<div class="flavor">Gather the little mice for Story Hour — every floor earns <b>double</b>!</div>
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
    const iconFor = (d) => ({ coin: 'coin', cheese: 'cheese', book: 'book', boost: 'hourglass', chest: 'chest' }[d.icon]);
    const grid = DAILY.map((d, k) => {
      const done = st.canClaim ? k < st.day : k <= st.day;
      const today = st.canClaim && k === st.day;
      return `<div class="day ${done ? 'done' : ''} ${today ? 'today' : ''} ${k === 6 ? 'last' : ''}"><span>Day ${k + 1}</span><span class="d-big">${icon(done ? 'check' : iconFor(d))}</span><span>${d.label}</span></div>`;
    }).join('');
    const claim = (mult) => { const got = g.claimDaily(mult); if (got) this.celebrate(got); this.ui.refreshBadges(); };
    openModal({
      title: 'Daily Gifts', icon: 'gift', wide: true,
      body: `<div class="flavor">Visit every day — the gifts get better! Miss a day and the streak starts over.</div><div class="daily-grid">${grid}</div>
        <div class="muted">Current streak: ${st.streak} day${st.streak === 1 ? '' : 's'}</div>`,
      buttons: st.canClaim ? [
        this.adBtn('Claim ×2', 'daily_x2', () => claim(2)),
        { label: 'Claim', cls: 'plain', onClick: () => claim(1) },
      ] : [{ label: 'Come back tomorrow!', cls: 'plain' }],
    });
  }

  /* ---------- lucky wheel ---------- */
  wheel() {
    const g = this.game;
    const n = WHEEL.length; const seg = 360 / n;
    const iconFor = (w) => ({ coin: 'coin', cheese: 'cheese', book: 'book', boost: 'hourglass' }[w.icon]);
    const slices = WHEEL.map((w, k) => {
      const a0 = ((k * seg - 90) * Math.PI) / 180; const a1 = (((k + 1) * seg - 90) * Math.PI) / 180;
      const x0 = 100 + 96 * Math.cos(a0), y0 = 100 + 96 * Math.sin(a0), x1 = 100 + 96 * Math.cos(a1), y1 = 100 + 96 * Math.sin(a1);
      const am = (((k + 0.5) * seg - 90) * Math.PI) / 180;
      const tx = 100 + 64 * Math.cos(am), ty = 100 + 64 * Math.sin(am);
      return `<path d="M100 100 L${x0} ${y0} A96 96 0 0 1 ${x1} ${y1} Z" fill="${w.color}" stroke="#4a3121" stroke-width="1.5"/>
        <g transform="translate(${tx} ${ty}) rotate(${(k + 0.5) * seg})"><svg x="-10" y="-17" width="20" height="20" viewBox="0 0 24 24">${iconInner(iconFor(w))}</svg><text y="14" text-anchor="middle" font-size="${w.label.length > 5 ? 8.5 : 11}" font-weight="700" fill="#4a3121" font-family="Fredoka,sans-serif">${w.label}</text></g>`;
    }).join('');
    const body = h(`<div>
      <div class="wheel-wrap"><div class="wheel-pin"></div>
        <svg viewBox="0 0 200 200" data-wheel><circle cx="100" cy="100" r="99" fill="#8a5a3a" stroke="#4a3121" stroke-width="2"/>${slices}
        ${Array.from({ length: n }, (_, k) => { const a = ((k * seg - 90) * Math.PI) / 180; return `<circle cx="${100 + 92 * Math.cos(a)}" cy="${100 + 92 * Math.sin(a)}" r="3" fill="#ffe39a" stroke="#4a3121" stroke-width="0.8"/>`; }).join('')}</svg>
        <div class="wheel-hub">${icon('mouse')}</div></div>
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
        toast(`You won ${got.map((r) => (r.kind === 'coins' ? fmt(r.amount) + ' coins' : r.kind === 'cheese' ? r.amount + ' golden cheese' : r.kind === 'boost' ? '×2 Story Hour' : 'a book')).join(', ')}!`, 'gold', 'wheel');
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
      title: 'Lucky Wheel', icon: 'wheel', body,
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

  /* ---------- big screens (own modules) ---------- */
  album(start) { collectionScreen(this, 'books', start); }
  collection(tab = 'books', start) { collectionScreen(this, tab, start); }
  shop(tab) { shopScreen(this, tab); }
  branch() { mapScreen(this); }
  map() { mapScreen(this); }
  arrival(res) { arrivalScreen(this, res); }
  festival() { festivalScreen(this); }

  confirmPrestige(pend, next) {
    openModal({
      title: 'Pack the moving van?', icon: 'van',
      body: `${artImg('move')}<div class="flavor">Move the library to <b>${next.name}</b>? You'll earn <b>${pend} Golden Quills</b>, and everything you've collected comes along for the ride.</div>`,
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
        <div class="fi-body"><b>${k + 1}. ${st.built || k <= next ? r.name : '???'}</b><div>${status}</div></div><span class="fi-go">${icon(st.built ? 'arrowR' : st.buildEnd ? 'hammer' : k === next ? 'balloon' : 'lock')}</span></button>`;
    }).reverse().join('')}</div>`);
    body.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
      const k = +b.dataset.k; const st = s.rooms[k];
      sfx.tap(); closeModal();
      if (st.built) this.ui.openRoom(k);
      else if (st.buildEnd) { this.ui.world.panToRoom(k); this.construction(k); }
      else if (k === next) { this.ui.world.panToTop(); this.build(k); }
    }));
    openModal({ title: `${g.loc().library}`, icon: 'tower', body });
  }

  /* ---------- reputation ---------- */
  reputation() {
    const s = this.game.s;
    openModal({
      title: `Reputation Lv ${s.rep}`, icon: 'star',
      body: `${artImg('rep')}<div class="flavor">Every upgrade and happy visitor spreads the word about your library.</div>
        <div class="big-reward" style="font-size:22px">+${(s.rep - 1) * 2}% income</div>
        <div class="muted">${s.xp} / ${E.repXpNeeded(s.rep)} XP to the next level · each level gives golden cheese and +2% income</div>`,
      buttons: [{ label: 'Keep reading!', cls: 'plain' }],
    });
  }

  /* ---------- settings ---------- */
  settings() {
    const g = this.game; const st = g.s.settings;
    const row = (ic, label, key) => `<div class="set-row"><span>${icon(ic)}${label}</span><button class="toggle ${st[key] ? 'on' : ''}" data-t="${key}" aria-label="${label}"></button></div>`;
    const body = h(`<div>
      ${row('music', 'Music', 'music')}
      ${row('bell', 'Sound effects', 'sfx')}
      ${row('heart', 'Vibration', 'haptics')}
      ${row('debate', 'Mouse chatter', 'chatter')}
      ${row('festival', 'Festivals & events', 'festivals')}
      ${row('hourglass', 'Reminders', 'notifications')}
      <div class="set-row"><span>${icon('scroll')}Replay the story</span><button class="btn plain" style="min-height:34px;font-size:13px" data-replay>Replay</button></div>
      ${Ads.provider === 'admob' ? `<div class="set-row"><span>${icon('lock')}Ad privacy options</span><button class="btn plain" style="min-height:34px;font-size:13px" data-privacy>Open</button></div>` : ''}
      <div class="set-row"><span>${icon('close')}Reset progress</span><button class="btn red" style="min-height:34px;font-size:13px" data-reset>Reset</button></div>
      <div class="credits">
        <b>Whiskerwood Library</b> v${CONFIG.version} · ads: ${Ads.provider}<br>
        Music: original waltz composed for this game, performed live by Web Audio synths.<br>
        <a href="${CONFIG.privacyUrl}" target="_blank" rel="noopener">Privacy policy</a><br>
        Sound effects: <a href="https://kenney.nl" target="_blank" rel="noopener">Kenney.nl</a> (CC0) — RPG Audio &amp; Interface Sounds.<br>
        Fonts: Fredoka &amp; Kalam (SIL Open Font License).<br>
        Every mouse, book, floor and location is hand-drawn in code. All book titles are affectionate parodies.
      </div></div>`);
    body.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.t; st[k] = !st[k]; b.classList.toggle('on', st[k]); sfx.tap();
      this.ui.applySettings();
      if (k === 'notifications' && st[k]) this.ui.native?.askPermission?.();
      if (k === 'festivals') { g._fest = undefined; this.ui.world.cache.clear(); }
    }));
    body.querySelector('[data-privacy]')?.addEventListener('click', () => Ads.privacyOptions());
    body.querySelector('[data-replay]').addEventListener('click', () => {
      closeModal();
      g.s.story.seen = g.s.story.seen.filter((id) => id !== 'intro');
      this.ui.story.play('intro');
    });
    body.querySelector('[data-reset]').addEventListener('click', () => {
      openModal({
        replace: true, title: 'Reset everything?', icon: 'close', row: true,
        body: `${artImg('cat')}<div class="flavor">This deletes all floors, books, furniture, friends, cheese and progress. It cannot be undone.</div>`,
        buttons: [{ label: 'Keep playing', cls: 'plain' }, { label: 'Reset', cls: 'red', onClick: () => { this.ui.resetAll(); } }],
      });
    });
    openModal({ title: 'Settings', icon: 'gear', body });
  }

  // A regular's story scene has finished: show their gift.
  regularGift(reg, f) {
    openModal({
      title: `A gift from ${reg.name.split(' ')[0]}!`, icon: 'friends',
      body: `<img class="art-portrait" src="${portrait(reg.id)}" alt=""><div class="fcard owned" style="max-width:190px;margin:6px auto"><div class="ft"><img src="${thumb(f.id)}" alt=""></div><b>${f.name}</b><div class="fd">${f.desc}</div></div>
        <div class="muted">${reg.name}'s story is complete · <b>+5% income forever</b> and a gift that goes wherever you go.</div>`,
      buttons: [{ label: 'Thank you!', cls: 'gold' }],
    });
    sfx.fanfare();
  }
}

export { CHARACTERS, FURN, RARITY_BONUS, DECOR, BOOKS, SHOP, PRESTIGE_ROOM, ICO };
