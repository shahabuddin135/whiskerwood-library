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
import { music } from '../audio/music.js';
import { Ads } from '../ads/ads.js';
import { wipeSave } from '../core/save.js';
import { floorTop, IX } from '../world/layout.js';
import { drawMouse } from '../world/draw.js';

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
    this.seasonChip = h('<div class="season-chip"></div>');
    document.body.appendChild(this.seasonChip);
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
    on('#topBtn', () => {
      sfx.tap();
      const c = this.game.constructing();
      if (c >= 0) { this.world.panToRoom(c); this.screens.construction(c); } else this.world.panToTop();
    });
    on('#settingsBtn', () => { sfx.open(); this.screens.settings(); });
    on('#cheesePill', () => { sfx.open(); this.screens.shop(); });
    on('#repBtn', () => { sfx.open(); this.screens.reputation(); });
    on('#coinPill', () => { sfx.tap(); toast(`Lifetime coins earned: ${fmt(this.game.s.totalEarned)}`); });
    on('#quest', () => this.questTap());
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
    g.on('rep', ({ level, cheese }) => {
      sfx.levelUp();
      toast(`⭐ Reputation Lv ${level}! +${cheese} golden cheese`, 'gold');
      flyTo(centerOf($('#repBtn')), $('#cheesePill'), Math.min(8, 2 + cheese), 'cheese');
      $('#repBtn').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], 500);
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
    setSfxEnabled(st.sfx);
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

  questTap() {
    const g = this.game;
    const p = g.questProgress();
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
        this.screens.celebrate(res.chest, from);
        toast('All tasks done — here are 3 fresh ones!', 'gold');
      }, 500);
    }
    this.renderTasks();
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
    this.banner({ icon: '🦹', title: 'Stop, thief!', text: 'Sneaky Rattigan is running for your coin jar — tap him!', btn: 'OK', ms: 5000, urgent: true });
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
        toast(`🦹 Rattigan snatched ${fmt(lost)} coins from the jar! Catch him next time!`);
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
    drawMouse(ctx, 40, 74 + hop, { fur: '#6f6560', belly: '#c9beb6', hat: 'bandit', pose: th.state === 'caught' ? 'happy' : 'walk', t: th.t * 1.6, dir, sack: th.state !== 'caught', s: 1.45 });
    if (th.state === 'run') { ctx.fillStyle = '#fff'; ctx.font = '700 9px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TAP!', 40, 10 + Math.sin(th.t * 10) * 2); }
  }
  endThief() { this.thief = null; $('#thief').classList.remove('show'); }

  doPrestige() {
    const g = this.game;
    this.sheet.close();
    const gained = g.prestige();
    if (!gained) return;
    this.world.resetForBranch();
    sfx.fanfare(); haptic('heavy');
    bigText(`+${gained} Golden Quills!`);
    setTimeout(() => toast(`Welcome to ${g.branch().name}! 🌿`, 'gold'), 900);
    this.shownCoins = 0;
    g.save();
    this.native?.askReview?.('prestige');
    this.refresh();
  }

  resetAll() {
    this.game.noSave = true;
    wipeSave();
    location.reload();
  }

  onStoryDone() { this.refresh(); }

  /* ---------- per-frame refresh ---------- */
  frame(dt) {
    const g = this.game; const s = g.s;
    if (s.coins < this.shownCoins) this.shownCoins = s.coins;
    else this.shownCoins += (s.coins - this.shownCoins) * Math.min(1, dt * 9);
    if (s.coins - this.shownCoins < Math.max(1, s.coins * 0.0005)) this.shownCoins = s.coins;
    $('#coins').textContent = fmt(this.shownCoins);
    this.updateThief(dt);

    this.acc += dt;
    if (this.acc < 0.12) return;
    this.acc = 0;
    this.refresh();
  }

  refresh() {
    const g = this.game; const s = g.s;
    $('#ips').textContent = `+${fmt(g.income())}/s`;
    $('#cheese').textContent = fmt(s.cheese);
    $('#repLvl').textContent = s.rep;
    $('#repRing').style.strokeDashoffset = String(106.8 * (1 - s.xp / E.repXpNeeded(s.rep)));

    // quest
    const q = s.quest; const p = g.questProgress();
    $('#qText').textContent = q ? q.text : '';
    $('#qBar').style.width = `${(p.cur / p.target) * 100}%`;
    const rw = q?.reward || {};
    $('#qReward').innerHTML = p.done ? 'Claim!' : rw.cheese ? `<span class="ico ico-cheese" style="width:16px;height:16px"></span>${rw.cheese}` : `<span class="ico ico-coin" style="width:16px;height:16px"></span>${rw.coins ? fmt(rw.coins) : ''}`;
    $('#quest').classList.toggle('ready', p.done);

    // jar
    const cap = g.jarCap();
    const lvl = Math.min(1, (s.jar + g.jarPending()) / cap);
    const shown = s.jar > 0 ? Math.max(0.2, Math.sqrt(lvl)) : 0; // sqrt so small amounts still look rewarding
    $('#jarFill').setAttribute('transform', `translate(0,${76 - shown * 72})`);
    $('#jarAmt').textContent = fmt(s.jar);
    const jb = $('#jarBtn');
    jb.classList.toggle('full', g.jarFull);
    jb.classList.toggle('ready', !g.jarFull && lvl > 0.25);
    $('#jarAd').classList.toggle('show', g.jarDoubleReady() && !this.sheet.isOpen);

    // story hour
    const sh = g.storyHourLeft();
    $('#storyBtn').classList.toggle('active', sh > 0);
    $('#storyTime').textContent = sh > 0 ? fmtTime(sh) : 'Story Hour';

    const season = this.world.season; const wx = this.world.ambient.weather;
    const weatherIcon = wx.kind === 'rain' ? ' 🌧️' : wx.kind === 'snow' ? ' 🌨️' : wx.kind === 'cloudy' ? ' ☁️' : wx.rainbow > 0 ? ' 🌈' : '';
    const chip = `${season.icon} ${season.name}${weatherIcon}`;
    if (this.seasonChip.textContent !== chip) this.seasonChip.textContent = chip;

    if (this.sheet.isOpen) this.sheet.update();
    this.renderChips();
    this.renderTasks();
    this.refreshBadges();
    this.story.tick();
    this.updatePointer();
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
    set('#navBranch', g.canPrestige());
    const owned = E.booksOwned(s);
    set('#albumBtn', owned > this.seenBooks);
    $('#albumBtn small').textContent = `${owned}/${BOOKS.length}`;
    const next = g.nextFloor();
    set('#topBtn', next > 0 && g.constructing() < 0 && s.coins >= ROOMS[next].unlock);
    $('#topBtn').classList.toggle('hidden', next < 0 && g.constructing() < 0);
    $('#topBtn small').textContent = g.constructing() >= 0 ? 'Building' : 'Build';
    const f = this.world.focusedRoom();
    const cheap = ['lvl', 'seats', 'shelves', 'staff'].some((t) => g.cost(f, t) <= s.coins * 0.5);
    set('#navUpgrade', cheap && !this.sheet.isOpen);
  }

  /* ---------- tutorial pointer ---------- */
  updatePointer() {
    const ptr = $('#pointer');
    const g = this.game; const s = g.s; const q = s.quest;
    let target = null;
    if (q && s.questIdx < 12 && !modalOpen() && !this.story.open) {
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
