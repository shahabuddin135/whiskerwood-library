// HUD, bottom bar, banners, quick tasks, story, tutorial pointer and the coin thief.
import { $, h, toast, flyTo, bigText, centerOf, haptic, setHaptics } from './dom.js';
import { RoomSheet } from './sheet.js';
import { Screens, bookHtml } from './screens.js';
import { StoryUI } from './story.js';
import { modalOpen, closeModal } from './modals.js';
import { ROOMS, BOOKS } from '../data/rooms.js';
import * as E from '../core/economy.js';
import { fmt, fmtTime } from '../core/format.js';
import { sfx, setSfxEnabled } from '../audio/sfx.js';
import { setVoicesEnabled } from '../audio/voices.js';
import { music } from '../audio/music.js';
import { Ads } from '../ads/ads.js';
import { wipeSave } from '../core/save.js';
import { floorTop, IX } from '../world/layout.js';
import { drawMouse } from '../world/draw.js';
import { SEASONS } from '../world/ambient.js';
import { WING, WINGS, WING_W, STOREY_H } from '../data/wings.js';
import { HALLS, cellY, cellX, CELL_W, DEEP_ROWS } from '../data/deep.js';
import { BIZ_BY_ID } from '../data/mole.js';
import { wingX, wingHeight } from '../world/wingArt.js';
import { Reveal } from './reveal.js';

// The HUD is only written to when a value actually changes: every write makes the browser lay out
// and repaint it, which on a phone costs about as much as drawing a good part of the world.
const setText = (el, v) => { v = String(v); if (el.textContent !== v) el.textContent = v; };
const setStyle = (el, prop, v) => { if (el.style[prop] !== v) el.style[prop] = v; };
const setAttr = (el, name, v) => { if (el.getAttribute(name) !== v) el.setAttribute(name, v); };

export class UI {
  constructor(game, world) {
    this.game = game;
    this.world = world;
    world.ui = this;
    this.sheet = new RoomSheet(this);
    this.screens = new Screens(this);
    this.story = new StoryUI(this);
    this.shownCoins = game.s.coins;
    this.acc = 0;
    this.bannerRoom = -1;
    this.seenBooks = E.booksOwned(game.s);
    this.jarFullNotified = false;
    this.thief = null;
    this.seasonChip = h('<button class="season-chip"><span class="sc-line"></span><span class="sc-fest"></span><i class="sc-bar"><b></b></i></button>');
    document.body.appendChild(this.seasonChip);
    this.seasonChip.addEventListener('click', () => {
      if (this.game.festival()) { sfx.open(); this.screens.festival(); return; }
      sfx.tap();
      const cal = this.game.calendar(); const w = this.world;
      const next = SEASONS[(cal.idx + 1) % 4];
      toast(`${w.season.icon} ${w.season.name}, Mouse Year ${cal.year} · ${next.icon} ${next.name} in ${fmtTime(cal.left)}`);
    });
    this.reveal = new Reveal(this);
    this.bind();
    this.listen();
    this.applySettings();
    this.refresh();
  }

  busy() { return modalOpen() || this.story.open; }

  bind() {
    const on = (id, fn) => $(id).addEventListener('click', (e) => { fn(e); });
    on('#jarBtn', () => this.collectJar());
    on('#jarAd', async () => {
      const g = this.game;
      if (!g.jarDoubleReady()) return;
      sfx.tap();
      if (await Ads.rewarded('jar_x2')) {
        g.s.stats.adsWatched++;
        g.s.cooldowns.jarDouble = Date.now() + 150000;
        this.collectJar(2);
        bigText('×2 Coins!');
      }
    });
    on('#navUpgrade', () => { sfx.open(); this.openRoom(this.world.focusedRoom()); });
    on('#navShop', () => { sfx.open(); this.screens.shop(); });
    on('#navWheel', () => { sfx.open(); this.screens.wheel(); });
    on('#navBranch', () => { sfx.open(); this.screens.branch(); });
    on('#storyBtn', () => { sfx.open(); this.screens.storyHour(); });
    on('#dailyBtn', () => { sfx.open(); this.screens.daily(); });
    on('#albumBtn', () => { sfx.open(); this.seenBooks = E.booksOwned(this.game.s); this.screens.album(this.world.focusedRoom()); this.refreshBadges(); });
    on('#floorsBtn', () => { sfx.open(); this.screens.floors(); });
    on('#deepBtn', () => { sfx.open(); this.screens.deep(); });
    on('#edgeL', () => this.edgeTap(-1));
    on('#edgeR', () => this.edgeTap(1));
    on('#topBtn', () => {
      sfx.tap();
      const c = this.game.constructing();
      if (c >= 0) { this.world.panToRoom(c); this.screens.construction(c); } else if (this.game.siteFull() || this.game.s.move.end) this.screens.move(); else this.world.panToTop();
    });
    on('#settingsBtn', () => { sfx.open(); this.screens.settings(); });
    on('#cheesePill', () => { sfx.open(); this.screens.shop(); });
    on('#repBtn', () => { sfx.open(); this.screens.reputation(); });
    on('#coinPill', () => { sfx.tap(); toast(`Lifetime coins earned: ${fmt(this.game.s.totalEarned)}`); });
    on('#quest', (e) => this.questTap(e));
    on('#zoomIn', () => { sfx.tap(); this.world.zoomBy(1.35); });
    on('#zoomOut', () => { sfx.tap(); this.world.zoomBy(1 / 1.35); });
    on('#zoomFit', () => { sfx.tap(); this.world.resetZoom(); });
    $('#tasks').addEventListener('click', (e) => {
      const b = e.target.closest('[data-task]');
      if (b) this.taskTap(+b.dataset.task);
      else if (e.target.closest('.chest')) toast('Finish all 3 tasks to open the chest! 🎁');
    });
    const thief = $('#thief');
    thief.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.catchThief(); });
  }

  listen() {
    const g = this.game;
    g.on('built', ({ i }) => {
      sfx.fanfare(); haptic('heavy');
      this.world.fx.confetti((IX + 180), floorTop(i) + 40, 60);
      this.world.sims[i].prefill(ROOMS[i], g.s.rooms[i]);
      this.world.sims[i].spawnT = 0.3;
      this.screens.built(i);
      this.refreshBadges();
      this.native?.onFloorBuilt?.(g.builtCount());
    });
    g.on('buildStart', ({ i }) => { toast(`🔨 Building ${ROOMS[i].name}…`); this.refreshBadges(); });
    g.on('milestone', ({ i, lvl }) => {
      sfx.milestone(); haptic('medium');
      toast(`🎉 ${ROOMS[i].name} Lv ${lvl}: income ×2!`, 'gold');
      this.world.fx.sparkle(IX + 180, floorTop(i) + 80, 24, '#ffe28a', 60);
      this.world.fx.text(IX + 176, floorTop(i) + 70, '×2 INCOME!', { color: '#ffd257', size: 18, life: 1.8 });
    });
    g.on('book', (res) => { if (res.source === 'milestone') this.bookCard(res); this.refreshBadges(); });
    g.on('mouseYear', ({ year }) => {
      g.addCheese(2);
      sfx.fanfare();
      bigText(`Mouse Year ${year}!`);
      toast(`🎉 Happy Mouse New Year! Year ${year} begins — here's 2 golden cheese.`, 'gold');
      this.world.fx.confetti(IX + 176, this.world.cam.y + this.world.viewH() * 0.4, 50);
    });
    g.on('rep', ({ level, cheese }) => {
      sfx.levelUp();
      toast(`⭐ Reputation Lv ${level}! +${cheese} golden cheese`, 'gold');
      flyTo(centerOf($('#repBtn')), $('#cheesePill'), Math.min(8, 2 + cheese), 'cheese');
      $('#repBtn').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], 500);
    });
    g.on('buy', ({ i, track }) => this.world.chatter.react(i, track.startsWith('decor') ? 'decor' : track));
    // wings
    g.on('wingStart', ({ id }) => { toast(`🔨 Building ${WING[id].name}…`); });
    g.on('wingBuilt', ({ id }) => {
      const w = WING[id];
      sfx.fanfare(); haptic('heavy'); bigText('Grand Opening!');
      this.world.fx.confetti(wingX(w) + WING_W / 2, -STOREY_H - 20, 50, 180);
      this.world.cache.delete('wing:' + id);
      toast(`🎉 ${w.name} is open! Every level adds income to the whole library.`, 'gold');
    });
    g.on('clubDone', ({ cheese }) => { toast(`🎶 What a club night! Everyone had a lovely time. +${cheese} golden cheese`, 'gold'); });
    // the Deep Stacks
    g.on('deepOpen', () => { this.world.deep.clear(); });
    g.on('deepJob', () => { this.world.deep.clear(); this.refreshBadges(); });
    g.on('deepDone', (j) => {
      this.world.deep.clear();
      const x = cellX(j.c) + CELL_W / 2; const y = cellY(j.r) + 50;
      this.world.fx.sparkle(x, y, 14, '#ffe28a', 40);
      if (j.kind === 'dig') {
        const hall = HALLS[this.game.hallAt(j.c, j.r)];
        if (j.fossil) { sfx.fanfare(); setTimeout(() => this.screens.fossilFound(j.fossil), 300); }
        else if (j.treasure) { sfx.reward(); toast(`💰 A treasure chest! +${j.treasure.cheese} golden cheese and ${fmt(j.treasure.coins)} coins`, 'gold'); this.world.fx.confetti(x, y, 30, 100); }
        else if (hall) { sfx.sparkle(); toast(`✨ The crew broke into an old hall: ${hall.name}!`, 'gold'); }
        else { sfx.collect(false); toast('⛏️ The mole crew dug through!'); }
      } else if (j.restored) {
        sfx.fanfare(); haptic('heavy'); bigText('Hall restored!');
        this.world.fx.confetti(x, y, 40, 140);
        toast(`✨ ${j.name} is restored! +15% income and a new page for the Chronicle 📜`, 'gold');
      } else { sfx.buy(); toast(`🔨 ${HALLS[j.hall].steps[j.step]}: done!`); }
      this.refreshBadges();
    });
    g.on('deepDoor', () => { this.world.deep.clear(); });
    // Mole City
    g.on('bizOpen', ({ id }) => {
      const b = BIZ_BY_ID[id]; const st = g.biz(id); const [c, r] = st.cell.split(',').map(Number);
      sfx.fanfare(); haptic('heavy'); bigText('Grand Opening!');
      this.world.fx.confetti(cellX(c) + CELL_W / 2, cellY(r) + 40, 40, 120);
      toast(`🎉 ${b.name} is open! Level it up to bring in more customers.`, 'gold');
    });
    g.on('tales', () => { this.world.deep.clear(); });
    // moving
    g.on('siteReady', () => {
      sfx.sparkle();
      this.banner({ icon: '🚚', title: 'The new site is ready!', text: `${g.nextBranch().name} is all set up. Time to move in!`, btn: 'Move in', ms: 9000, onClick: () => this.screens.move() });
    });
    g.on('questReady', () => { sfx.sparkle(); haptic('light'); });
    g.on('jarFull', (full) => {
      if (full && !this.jarFullNotified) { this.jarFullNotified = true; toast('🫙 The coin jar is full — tap it to collect!'); }
      if (!full) this.jarFullNotified = false;
    });
    g.on('boost', () => this.renderChips());
    g.on('tasks', () => this.renderTasks());
    Ads.onChange((showing) => {
      if (showing) music.stop(); else if (g.s.settings.music) music.start();
    });
  }

  applySettings() {
    const st = this.game.s.settings;
    music.setEnabled(st.music);
    setSfxEnabled(st.sfx); setVoicesEnabled(st.sfx);
    setHaptics(st.haptics);
  }

  /* ---------- actions ---------- */
  collectJar(mult = 1) {
    const g = this.game;
    const before = g.s.jar;
    const amt = g.collectJar(mult);
    const jar = $('#jarBtn');
    if (amt <= 0) { sfx.tap(); jar.animate([{ transform: 'translateX(-50%) rotate(-6deg)' }, { transform: 'translateX(-50%) rotate(6deg)' }, { transform: 'translateX(-50%)' }], 250); return; }
    const big = before > g.steady() * 60;
    sfx.collect(big); haptic(big ? 'medium' : 'light');
    this.flyCoins(centerOf(jar), big ? 14 : 8);
  }

  flyCoins(from, n = 10) {
    flyTo(from, $('#coinPill'), n, 'coin', () => {
      $('#coinPill').classList.remove('bump'); void $('#coinPill').offsetWidth; $('#coinPill').classList.add('bump');
    });
  }

  async questTap(e) {
    const g = this.game;
    const p = g.questProgress();
    if (p.done && e?.target?.closest?.('.q-ad')) {
      sfx.tap();
      if (!g.offerReady('questX2', 10)) return;
      if (await Ads.rewarded('quest_x2')) {
        g.s.stats.adsWatched++; g.useOffer('questX2', 120);
        const got = g.claimQuest(2);
        if (got) { this.screens.celebrate(got, centerOf($('#quest'))); bigText('Double reward!'); }
      }
      return;
    }
    if (p.done) {
      const got = g.claimQuest();
      if (got) { this.screens.celebrate(got, centerOf($('#quest'))); toast('Quest complete! 📜', 'gold'); }
      return;
    }
    sfx.tap();
    const q = g.s.quest;
    const hints = {
      jarCollects: 'Tap the big coin jar at the bottom! 🫙',
      specials: 'Special guests glow gold — watch for them and tap!',
      parcels: 'Pigeons fly past with parcels — tap them!',
      bellRings: 'Tap the librarian’s desk to ring the bell 🔔',
      requests: 'Readers with a ❓ bubble need help — tap them!',
      cats: 'When Baroness Clawdia peeks in a window, tap her until she runs!',
      fish: 'Scroll down to the pond and tap the fishing mouse when the float bobs 🐟',
    };
    if (q.type === 'digs') { this.panToDeep(); toast('⛏️ Tap a glowing “Dig here” spot underground!'); return; }
    if (q.type === 'liftStops') { this.screens.lift(); return; }
    if (q.type === 'bizBuilt') { this.panToDeep(); toast(`🏪 Tap an empty tunnel with a TO LET sign to open ${BIZ_BY_ID[q.biz]?.short || 'a shop'} there!`); return; }
    if (q.type === 'bizLvl') { const st = g.biz(q.biz); if (st) { const [c, r] = st.cell.split(',').map(Number); this.panToCell(c, r); } this.screens.biz(q.biz); return; }
    if (q.type === 'wingLvl' || q.type === 'wingBuilt') { this.panToWing(q.wing); setTimeout(() => this.screens.wing(q.wing), 300); return; }
    if (q.type === 'scones') { this.panToWing('cafe'); toast('🧁 Tap the café when a tray of scones is ready!'); return; }
    if (q.room != null && g.s.rooms[q.room]?.built && ['level', 'seats', 'shelves', 'staff', 'decor'].includes(q.type)) this.openRoom(q.room);
    else if (q.type === 'built') this.world.panToTop();
    else if (q.type === 'spins') this.screens.wheel();
    else if (q.type === 'books') this.screens.album();
    else if (hints[q.type]) toast(hints[q.type]);
  }

  taskTap(k) {
    const g = this.game;
    const info = g.taskInfo(k);
    if (!info) return;
    if (info.claimed) return;
    if (!info.done) { sfx.tap(); toast(`${info.icon} ${info.text} (${info.cur}/${info.target})`); return; }
    const res = g.claimTask(k);
    if (!res) return;
    const from = centerOf($(`[data-task="${k}"]`) || $('#tasks'));
    this.screens.celebrate(res.got, from);
    if (res.chest) {
      setTimeout(() => {
        bigText('Task Chest! 🎁');
        this.screens.taskChest(res.chest);
        toast('All tasks done — here are 3 fresh ones!', 'gold');
      }, 500);
    }
    this.renderTasks();
  }

  /* ---------- wings & the Deep Stacks ---------- */
  wingTap(id, kind) {
    const g = this.game; const w = WING[id];
    if (kind === 'gazette') { sfx.open(); this.screens.gazette(); return; }
    if (kind === 'bubble') {
      const res = g.doWingAction(id);
      if (!res) { sfx.tap(); this.screens.wing(id); return; }
      const x = wingX(w) + WING_W / 2; const y = -wingHeight(g.wing(id)) - 60;
      if (res.kind === 'coins') {
        sfx.collect(false); haptic('light');
        this.world.fx.text(x, y, '+' + fmt(res.amount), { icon: 'coin', size: 12 });
        this.flyCoins(centerOf($('#jarBtn')), 8);
        toast(id === 'cafe' ? `🧁 Scones for everyone! +${fmt(res.amount)} coins` : `🎟️ What a tour! +${fmt(res.amount)} coins`, 'gold');
      } else if (res.kind === 'club') {
        sfx.fanfare(); bigText(`${res.club.icon} ${res.club.name}!`);
        toast(`${res.club.icon} ${res.club.line} Income ×1.5 while it lasts!`, 'gold');
      } else if (res.kind === 'started') { sfx.hammer(); toast('🖨️ Clank, whirr, thump! The presses are rolling.'); }
      else if (res.kind === 'book') { this.screens.bookReveal(res); }
      return;
    }
    sfx.open();
    this.screens.wing(id);
  }
  deepTap(c, r) { sfx.tap(); this.screens.deepCell(c, r); }
  liftTap() {
    sfx.open();
    if (this.game.moleCityOpen()) this.screens.lift(); else this.screens.deep();
  }
  panToCell(c, r) { this.world.panTo(cellY(r) + 66, true, cellX(c) + CELL_W / 2); }
  panToWing(id) {
    const w = WING[id]; const st = this.game.wing(id);
    this.world.panTo(-(st.built ? wingHeight(st) : STOREY_H) / 2 - 20, true, wingX(w) + WING_W / 2);
  }
  // Show where the crew can work next (the deepest spot), or the dragon's hoard.
  panToDeep(hoard = false) {
    const g = this.game; const d = g.s.deep;
    let best = [4, 0];
    if (hoard) best = [4, DEEP_ROWS - 1];
    else {
      for (const j of d.jobs) if (j.r >= best[1]) best = [j.c, j.r];
      for (let r = 0; r < DEEP_ROWS; r++) for (let c = 0; c < 9; c++) if (['dig', 'restore', 'door'].includes(g.cellAction(c, r)) && r >= best[1]) best = [c, r];
    }
    this.world.panTo(cellY(best[1]) + 66, true, cellX(best[0]) + CELL_W / 2);
  }
  // Little arrows at the screen edges pointing at wings you can't see.
  updateEdges() {
    const w = this.world; const g = this.game;
    const L = $('#edgeL'); const R = $('#edgeR');
    const mid = w.cam.y + w.viewH() / 2;
    const ground = mid > -520 && mid < 60 && !this.sheet.isOpen && !modalOpen() && !this.story.open && g.s.questIdx >= 6;
    const left = w.cam.x; const right = w.cam.x + w.viewW();
    const find = (dir) => {
      let best = null;
      for (const wd of WINGS) {
        const st = g.wing(wd.id); if (!st.built && !st.buildEnd && !g.wingOpen(wd.id)) continue;
        const cx = wingX(wd) + WING_W / 2;
        if (dir < 0 ? cx < left : cx > right) { const dist = dir < 0 ? left - cx : cx - right; if (!best || dist < best.dist) best = { wd, dist }; }
      }
      if (!best && dir < 0 && left > 120) best = { tower: true };
      if (!best && dir > 0 && right < 320) best = { tower: true };
      return best;
    };
    const set = (el, info, dir) => {
      if (!ground || !info) { el.classList.remove('show'); return; }
      const ready = info.wd && ['ready', 'done'].includes(g.wingActionState(info.wd.id));
      const label = info.tower ? '🏛️ Library' : `${info.wd.icon} ${info.wd.short}${ready ? ' ✨' : ''}`;
      const html = dir < 0 ? `‹ ${label}` : `${label} ›`;
      if (el.innerHTML !== html) el.innerHTML = html;
      el.dataset.target = info.tower ? 'tower' : info.wd.id;
      el.classList.toggle('ready', !!ready);
      el.classList.add('show');
    };
    set(L, find(-1), -1); set(R, find(1), 1);
  }
  edgeTap(dir) {
    sfx.tap();
    const t = (dir < 0 ? $('#edgeL') : $('#edgeR')).dataset.target;
    if (t === 'tower') this.world.panTo(this.world.cam.y + this.world.viewH() / 2 - 40, true, 220);
    else if (t) this.panToWing(t);
  }

  openRoom(i) { closeModal(); this.sheet.open(i); }
  openBuild(i) { this.screens.build(i); }
  openConstruction(i) { this.screens.construction(i); }
  openParcel() { this.screens.parcel(); }
  onSheet(open) { document.body.classList.toggle('sheet-open', open); if (!open) this.world.cam.hold = false; }
  toast(text, cls) { toast(text, cls); }

  // Generic top banner: { icon, title, text, btn, onClick, ms, urgent, room }
  banner({ icon, title, text, btn = 'OK', onClick, ms = 8000, urgent = false, room = -1, extraBtn }) {
    const b = $('#banner');
    b.className = `banner ${urgent ? 'urgent' : ''}`;
    b.innerHTML = `<span class="b-ico">${icon}</span><span class="b-text"><b>${title}</b><br>${text}</span>${extraBtn ? `<button class="btn ad b-extra">${extraBtn.label}</button>` : ''}<button class="btn b-main">${btn}</button>`;
    b.querySelector('.b-main').addEventListener('click', () => { sfx.tap(); onClick?.(); b.classList.remove('show'); });
    if (extraBtn) b.querySelector('.b-extra').addEventListener('click', async () => { b.classList.remove('show'); await extraBtn.onClick(); });
    void b.offsetWidth;
    b.classList.add('show');
    this.bannerRoom = room;
    clearTimeout(this.bannerT);
    this.bannerT = setTimeout(() => b.classList.remove('show'), ms);
    haptic('light');
  }

  specialArrived(i, type, name) {
    const icon = type === 'royal' ? '👑' : type === 'author' ? '✍️' : '⭐';
    const what = type === 'royal' ? 'Royalty is visiting' : type === 'author' ? 'Book signing in' : 'A celebrity is in';
    this.banner({ icon, title: name, text: `${what} ${ROOMS[i].name}!`, btn: 'Visit', onClick: () => this.world.panToRoom(i), ms: 9000, room: i });
  }
  specialLeft(i) { if (this.bannerRoom === i) $('#banner').classList.remove('show'); }
  onSpecialGreeted(i, sp) {
    $('#banner').classList.remove('show');
    if (sp.type === 'celeb') this.screens.celeb(i, sp.name);
    else if (sp.type === 'royal') this.screens.royal(i, sp.name);
    else if (sp.type === 'author') this.screens.author(i, sp.name);
  }

  // Baroness Clawdia scared the readers off: offer to win them back.
  catEscaped(i) {
    const g = this.game;
    if (this.busy() || !g.offerReady('cat', 4)) { toast('😿 The readers were too scared… tap the cat next time!'); return; }
    const amt = g.rewardCoins(90);
    this.banner({
      icon: '😿', title: 'The readers ran off!', text: `Clawdia scared everyone out of ${ROOMS[i].name}.`, btn: 'Oh no', ms: 9000,
      extraBtn: { label: 'Cocoa for all', onClick: async () => { if (await Ads.rewarded('second_chance_cat')) { g.s.stats.adsWatched++; g.useOffer('cat'); g.earn(amt); this.flyCoins({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 10); toast(`☕ Free cocoa brought everyone back! +${fmt(amt)} coins`, 'gold'); } } },
    });
  }

  giftArrived() {
    this.banner({ icon: '🎁', title: 'A gift on the doorstep!', text: 'Somebody left a mystery box by the library door.', btn: 'Look', ms: 8000, onClick: () => { this.world.panTo(0, true, 236); setTimeout(() => this.screens.giftBox(), 500); } });
  }

  fairStarted(sec) {
    bigText('Book Fair! 🎪');
    this.banner({
      icon: '🎪', title: 'The Book Fair is here!', text: `All income ×2 and extra visitors for ${Math.round(sec / 60)} minutes!`, btn: 'Hooray!', ms: 9000,
      extraBtn: { label: '+3 min', onClick: async () => { if (await Ads.rewarded('fair_extend')) { this.game.s.stats.adsWatched++; this.world.events.startFair(180); toast('🎪 Book Fair extended by 3 minutes!', 'gold'); } } },
    });
  }

  // A small non-blocking card when a milestone delivers a new book.
  bookCard(res) {
    const el = h(`<div class="book-toast"><div class="bt-cover">${bookHtml(res.book)}</div><div class="bt-text"><b>New book!</b><br>${res.book.title}<br><small>+10% on ${ROOMS[res.book.room].name}${res.setDone ? ' · SET ×2!' : ''}</small></div></div>`);
    document.body.appendChild(el);
    sfx.sparkle();
    el.addEventListener('click', () => { this.seenBooks = E.booksOwned(this.game.s); this.screens.album(res.book.room); el.remove(); });
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3700);
  }

  /* ---------- 🦹 Sneaky Rattigan ---------- */
  startThief() {
    const g = this.game;
    if (this.thief || this.busy() || g.s.jar < g.steady() * 20) return false;
    const first = !g.storySeen('thiefIntro');
    if (first) this.story.play('thiefIntro');
    const jar = centerOf($('#jarBtn'));
    const y = window.innerHeight - 78 - 70 - (parseFloat(getComputedStyle(document.body).getPropertyValue('--safe-bottom')) || 0);
    this.thief = { x: -80, y, tx: jar.x - 70, t: 0, dur: first ? 14 : 7, state: 'run' };
    $('#thief').classList.add('show');
    const who = g.hallsDone() >= 5 ? 'Rattigan’s cousin Ratsby' : 'Sneaky Rattigan';
    this.banner({ icon: '🦹', title: 'Stop, thief!', text: `${who} is running for your coin jar — tap!`, btn: 'OK', ms: 5000, urgent: true });
    sfx.whistle();
    return true;
  }

  catchThief() {
    const th = this.thief;
    if (!th || th.state !== 'run') return;
    th.state = 'caught'; th.t2 = 0;
    const g = this.game;
    const amt = Math.max(g.rewardCoins(30), g.s.jar * 0.25);
    g.earn(amt); g.addCheese(2); g.s.stats.thieves++; g.checkQuest();
    sfx.reward(); haptic('heavy');
    bigText('Gotcha!');
    this.flyCoins({ x: th.x + 40, y: th.y + 40 }, 12);
    toast(`🦹 Caught Rattigan! He dropped ${fmt(amt)} coins + 2 cheese`, 'gold');
  }

  updateThief(dt) {
    const th = this.thief; if (!th) return;
    const el = $('#thief');
    th.t += dt;
    if (th.state === 'run') {
      const k = Math.min(1, th.t / th.dur);
      th.x = -80 + (th.tx + 80) * k;
      if (k >= 1) {
        th.state = 'stole'; th.t2 = 0;
        const g = this.game; const lost = g.s.jar * 0.2;
        g.s.jar -= lost;
        sfx.error();
        if (lost > 0 && g.offerReady('thief', 4)) {
          this.banner({
            icon: '🦹', title: 'Rattigan got away!', text: `He snatched ${fmt(lost)} coins from the jar.`, btn: 'Oh well', ms: 9000, urgent: true,
            extraBtn: { label: 'Get it back', onClick: async () => { if (await Ads.rewarded('second_chance_thief')) { g.s.stats.adsWatched++; g.useOffer('thief'); g.earn(lost); this.flyCoins(centerOf($('#jarBtn')), 12); toast(`🚓 The Mouse Police caught him! +${fmt(lost)} coins back`, 'gold'); } } },
          });
        } else toast(`🦹 Rattigan snatched ${fmt(lost)} coins from the jar! Catch him next time!`);
      }
    } else if (th.state === 'stole') { th.t2 += dt; th.x -= 260 * dt; if (th.x < -100) this.endThief(); }
    else if (th.state === 'caught') { th.t2 += dt; if (th.t2 > 0.7) this.endThief(); }
    el.style.transform = `translate(${th.x}px, ${th.y}px)`;
    const ctx = el.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, el.width, el.height);
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    const dir = th.state === 'stole' ? -1 : 1;
    const hop = th.state === 'caught' ? -Math.sin(Math.min(1, th.t2 / 0.7) * Math.PI) * 14 : 0;
    ctx.globalAlpha = th.state === 'caught' ? Math.max(0, 1 - th.t2 / 0.7) : 1;
    drawMouse(ctx, 40, 74 + hop, { fur: '#6f6560', belly: '#c9beb6', hat: 'bandit', pose: th.state === 'caught' ? 'happy' : 'walk', t: th.t * 1.6, dir, sack: th.state !== 'caught', s: 1.45, full: true });
    if (th.state === 'run') { ctx.fillStyle = '#fff'; ctx.font = '700 9px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TAP!', 40, 10 + Math.sin(th.t * 10) * 2); }
  }
  endThief() { this.thief = null; $('#thief').classList.remove('show'); }

  doPrestige() {
    const g = this.game;
    this.sheet.close();
    const res = g.prestige();
    if (!res) return;
    this.world.resetForBranch();
    sfx.fanfare(); haptic('heavy');
    bigText(`Welcome to ${res.to.name}!`);
    setTimeout(() => this.screens.arrival(res), 900);
    g.save();
    this.native?.askReview?.('prestige');
    this.refresh();
  }

  resetAll() {
    this.game.noSave = true;
    wipeSave();
    location.reload();
  }

  onStoryDone(id) {
    this.refresh();
    if (id === 'intro' && this.afterIntro) { const f = this.afterIntro; this.afterIntro = null; f(); }
    if (id === 'deepEnd') setTimeout(() => this.screens.talesReward(), 400);
    if (id === 'deep0') setTimeout(() => this.panToDeep(), 300);
  }

  /* ---------- per-frame refresh ---------- */
  frame(dt) {
    const g = this.game; const s = g.s;
    if (s.coins < this.shownCoins) this.shownCoins = s.coins;
    else this.shownCoins += (s.coins - this.shownCoins) * Math.min(1, dt * 9);
    if (s.coins - this.shownCoins < Math.max(1, s.coins * 0.0005)) this.shownCoins = s.coins;
    setText($('#coins'), fmt(this.shownCoins));
    this.updateThief(dt);

    this.acc += dt;
    if (this.acc < 0.12) return;
    this.acc = 0;
    this.refresh();
  }

  refresh() {
    const g = this.game; const s = g.s;
    setText($('#ips'), `+${fmt(g.income())}/s`);
    setText($('#cheese'), fmt(s.cheese));
    setText($('#repLvl'), s.rep);
    setStyle($('#repRing'), 'strokeDashoffset', (106.8 * (1 - s.xp / E.repXpNeeded(s.rep))).toFixed(1));

    // quest
    const q = s.quest; const p = g.questProgress();
    setText($('#qText'), q ? q.text : '');
    setStyle($('#qBar'), 'width', `${((p.cur / p.target) * 100).toFixed(1)}%`);
    const rw = q?.reward || {};
    const qAd = p.done && s.questIdx >= 4 && g.offerReady('questX2', 10) ? '<span class="q-ad">📺×2</span>' : '';
    const qHtml = p.done ? `${qAd}<span class="q-claim">Claim!</span>` : rw.cheese ? `<span class="ico ico-cheese" style="width:16px;height:16px"></span>${rw.cheese}` : `<span class="ico ico-coin" style="width:16px;height:16px"></span>${rw.coins ? fmt(rw.coins) : ''}`;
    if (this.qHtml !== qHtml) { this.qHtml = qHtml; $('#qReward').innerHTML = qHtml; } // only when it changes, so taps land
    $('#quest').classList.toggle('ready', p.done);

    // jar
    const cap = g.jarCap();
    const lvl = Math.min(1, (s.jar + g.jarPending()) / cap);
    const shown = s.jar > 0 ? Math.max(0.2, Math.sqrt(lvl)) : 0; // sqrt so small amounts still look rewarding
    setAttr($('#jarFill'), 'transform', `translate(0,${(76 - shown * 72).toFixed(1)})`);
    setText($('#jarAmt'), fmt(s.jar));
    const jb = $('#jarBtn');
    jb.classList.toggle('full', g.jarFull);
    jb.classList.toggle('ready', !g.jarFull && lvl > 0.25);
    $('#jarAd').classList.toggle('show', g.jarDoubleReady() && !this.sheet.isOpen);

    // story hour
    const sh = g.storyHourLeft();
    $('#storyBtn').classList.toggle('active', sh > 0);
    setText($('#storyTime'), sh > 0 ? fmtTime(sh) : 'Story Hour');

    const season = this.world.season; const wx = this.world.ambient.weather;
    const weatherIcon = wx.kind === 'rain' ? ' 🌧️' : wx.kind === 'snow' ? ' 🌨️' : wx.kind === 'cloudy' ? ' ☁️' : wx.rainbow > 0 ? ' 🌈' : '';
    const fest = g.festival();
    const cal = this.world.cal || g.calendar();
    const line = `${season.icon} ${season.name} · Year ${cal.year}${weatherIcon}`;
    const sc = this.seasonChip;
    if (sc.querySelector('.sc-line').textContent !== line) sc.querySelector('.sc-line').textContent = line;
    const festLine = fest ? `${fest.icon} ${fest.name}` : '';
    if (sc.querySelector('.sc-fest').textContent !== festLine) sc.querySelector('.sc-fest').textContent = festLine;
    setStyle(sc.querySelector('.sc-bar b'), 'width', `${Math.round(cal.progress * 100)}%`);
    if (sc.dataset.season !== season.key) sc.dataset.season = season.key;
    this.seasonChip.classList.toggle('fest', !!fest);
    this.seasonChip.classList.toggle('has-gift', g.festGiftReady());
    // mystery gift on the doorstep
    const giftDue = g.giftDue();
    if (giftDue && !this.giftNotified && !this.busy()) { this.giftNotified = true; this.giftArrived(); }
    if (!giftDue) this.giftNotified = false;

    if (this.sheet.isOpen) this.sheet.update();
    this.reveal.update();
    this.renderChips();
    this.renderTasks();
    this.refreshBadges();
    this.story.tick();
    this.updatePointer();
    this.updateEdges();
  }

  renderTasks() {
    const g = this.game;
    const list = g.s.tasks?.list || [];
    const parts = list.map((_, k) => {
      const t = g.taskInfo(k);
      return `<button class="task ${t.claimed ? 'claimed' : t.done ? 'done' : ''}" data-task="${k}" title="${t.text}"><i class="t-fill" style="width:${(t.cur / t.target) * 100}%"></i><span class="t-ico">${t.icon}</span><span class="t-num">${t.claimed ? '✓' : `${t.cur}/${t.target}`}</span></button>`;
    });
    const claimed = list.filter((t) => t.claimed).length;
    const html = parts.join('') + `<button class="chest" aria-label="Task chest">🎁<small>${claimed}/3</small></button>`;
    const el = $('#tasks');
    if (el.innerHTML !== html) el.innerHTML = html;
  }

  renderChips() {
    const g = this.game; const now = Date.now();
    const chips = [];
    const sh = g.storyHourLeft();
    if (sh > 0) chips.push(`<span class="chip">📖 Story Hour <b>×2</b> ${fmtTime(sh)}</span>`);
    for (const b of g.s.boosts) {
      if (b.end <= now) continue;
      const mult = b.mult === 0 ? '×0' : `×${b.mult}`;
      const time = b.key === 'weather' ? '' : ` ${fmtTime((b.end - now) / 1000)}`;
      chips.push(`<span class="chip">${b.icon} ${b.label} <b>${mult}</b>${b.room != null ? ` ${ROOMS[b.room].name.replace('The ', '')}` : ''}${time}</span>`);
    }
    const html = chips.join('');
    const el = $('#boostChips');
    if (el.innerHTML !== html) el.innerHTML = html;
  }

  refreshBadges() {
    const g = this.game; const s = g.s;
    const set = (id, on) => $(id).classList.toggle('has-dot', !!on);
    set('#dailyBtn', g.dailyStatus().canClaim);
    set('#navWheel', g.wheelStatus().free);
    set('#navBranch', g.canBuyLand() || g.moveReady());
    const d = s.deep;
    $('#deepBtn').classList.toggle('hidden', !d.open);
    if (d.open) set('#deepBtn', g.freeCrews() > 0 && !d.tales);
    const owned = E.booksOwned(s);
    set('#albumBtn', owned > this.seenBooks);
    setText($('#albumBtn small'), `${owned}/${BOOKS.length}`);
    const next = g.nextFloor();
    const full = (g.siteFull() || !!s.move.end) && next < 0 && g.constructing() < 0;
    set('#topBtn', (next > 0 && g.constructing() < 0 && s.coins >= ROOMS[next].unlock) || (full && (g.canBuyLand() || g.moveReady())));
    $('#topBtn').classList.toggle('hidden', next < 0 && g.constructing() < 0 && !full);
    setText($('#topBtn small'), g.constructing() >= 0 ? 'Building' : full ? 'Move' : 'Build');
    const ico = full ? '🚚' : '🎈';
    if ($('#topBtn .rb-ico').textContent !== ico) $('#topBtn .rb-ico').textContent = ico;
    const f = this.world.focusedRoom();
    const cheap = ['lvl', 'seats', 'shelves', 'staff'].some((t) => g.cost(f, t) <= s.coins * 0.5);
    set('#navUpgrade', cheap && !this.sheet.isOpen);
  }

  /* ---------- tutorial pointer ---------- */
  updatePointer() {
    const ptr = $('#pointer');
    const g = this.game; const s = g.s; const q = s.quest;
    let target = null;
    if (q && s.questIdx < 12 && !modalOpen() && !this.story.open && !this.cinematic) {
      const p = g.questProgress();
      if (p.done) target = this.sheet.isOpen ? null : $('#quest');
      else {
        const sheetTrack = { upgrade: 'lvl', seats: 'seats', staff: 'staff', shelves: 'shelves' }[q.hint];
        if (q.hint === 'jar') target = s.jar > 0 ? $('#jarBtn') : null;
        else if (sheetTrack) target = this.sheet.isOpen ? this.sheet.el.querySelector(`[data-r="${sheetTrack}Btn"]`) : $('#navUpgrade');
        else if (q.hint === 'decor') target = this.sheet.isOpen ? this.sheet.el.querySelector('.decor:not(.owned)') : $('#navUpgrade');
        else if (q.hint === 'wheel') target = $('#navWheel');
        else if (q.hint === 'build') {
          const r = this.world.signRect;
          if (r && !this.sheet.isOpen) {
            const a = this.world.toScreen((r.x0 + r.x1) / 2, r.y1 - 20);
            if (a.y > 200 && a.y < window.innerHeight - 140) target = { x: a.x, y: a.y };
          }
          if (!target && !this.sheet.isOpen && g.constructing() < 0) target = $('#topBtn');
        }
      }
    }
    if (!target) { ptr.style.display = 'none'; return; }
    const r = target.getBoundingClientRect ? target.getBoundingClientRect() : { left: target.x, top: target.y, width: 0, height: 0 };
    if (r.width === 0 && target.getBoundingClientRect) { ptr.style.display = 'none'; return; }
    const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
    const below = cy < window.innerHeight * 0.5;
    ptr.textContent = below ? '👆' : '👇';
    ptr.style.display = 'block';
    ptr.style.left = `${cx - 16}px`;
    ptr.style.top = below ? `${r.top + r.height - 4}px` : `${r.top - 46}px`;
  }
}
