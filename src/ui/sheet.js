// Bottom sheet with the upgrades of one library floor.
import { $, h, ICO, haptic, toast } from './dom.js';
import { ROOMS, DECOR, BOOKS, LIMITS, RARITY } from '../data/rooms.js';
import { SLOTS, FURNITURE, FURN } from '../data/furniture.js';
import * as E from '../core/economy.js';
import { fmt } from '../core/format.js';
import { sfx } from '../audio/sfx.js';
import { Ads } from '../ads/ads.js';
import { bookHtml } from './screens.js';

const SEAT_ICON = { armchair: '🛋️', beanbag: '🧸', cafe: '☕', trunk: '🧳', wingback: '💺', bench: '🪑', stool: '🔭', throne: '👑', piano: '🎹', royal: '🛋️' };
const SEAT_NAME = { armchair: 'Armchairs', beanbag: 'Beanbags', cafe: 'Café Tables', trunk: 'Sea Trunks', wingback: 'Wingback Chairs', bench: 'Garden Benches', stool: 'Star Stools', throne: 'Velvet Thrones', piano: 'Piano Benches', royal: 'Royal Sofas' };

export class RoomSheet {
  constructor(ui) {
    this.ui = ui;
    this.game = ui.game;
    this.el = $('#sheet');
    this.i = -1;
    this.mode = 1;
    this.isOpen = false;
    this.refs = null;
  }

  open(i) {
    if (!this.game.s.rooms[i]?.built) return;
    this.i = i;
    this.render();
    this.el.classList.add('open');
    this.el.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    this.ui.onSheet(true);
    this.frame();
  }
  frame() {
    this.ui.world.panToRoomBetween(this.i, 60, window.innerHeight - this.el.offsetHeight);
  }
  close() {
    if (!this.isOpen) return;
    this.el.classList.remove('open');
    this.el.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
    sfx.close();
    this.ui.onSheet(false);
  }

  builtRooms() { return this.game.s.rooms.map((r, k) => (r.built ? k : -1)).filter((k) => k >= 0); }

  render() {
    const i = this.i; const def = ROOMS[i]; const g = this.game;
    const built = this.builtRooms();
    const pos = built.indexOf(i);
    this.el.innerHTML = '';
    const root = h(`<div style="display:contents">
      <div class="sheet-head">
        <button class="arrow-btn" data-nav="-1" ${pos <= 0 ? 'disabled' : ''}>‹</button>
        <div class="title"><h2>${def.name}</h2><div class="sub">${def.genre} · Floor ${i + 1}</div></div>
        <button class="arrow-btn" data-nav="1" ${pos >= built.length - 1 ? 'disabled' : ''}>›</button>
        <button class="close-btn">✕</button>
      </div>
      <div class="sheet-body">
        <div class="stats">
          <div><b data-r="inc">0</b><small>coins / sec</small></div>
          <div><b data-r="vpm">0</b><small>visitors / min</small></div>
          <div><b data-r="per">0</b><small>per visitor</small></div>
        </div>
        <div class="milestone"><span data-r="ms"></span><div class="bar"><i data-r="msbar"></i></div></div>
        <div class="buy-mode"><button data-mode="1">×1</button><button data-mode="10">×10</button><button data-mode="max">MAX</button></div>
        ${this.rowHtml('lvl', '📚', 'Book Collection')}
        ${this.rowHtml('seats', SEAT_ICON[def.seat] || '🪑', SEAT_NAME[def.seat] || 'Seats')}
        ${this.rowHtml('shelves', '🗄️', 'Bookshelves')}
        ${this.rowHtml('staff', '👓', 'Librarian')}
        <div class="section-title">Décor <small>each boosts this floor's income</small></div>
        <div class="decor-grid">${DECOR.map((d, k) => `<button class="decor" data-decor="${k}"><span class="d-ico">${d.icon}</span><span class="d-name">${k === 4 ? def.centerName : d.name}</span><span class="d-cost" data-r="dc${k}"></span></button>`).join('')}</div>
        <div class="section-title">Furniture <small>from the 🛒 Shop · tap to swap</small></div>
        <div class="decor-grid">${SLOTS.map((sl) => `<button class="decor furn" data-slot="${sl.key}"><span class="d-ico" data-r="fi_${sl.key}"></span><span class="d-name" data-r="fn_${sl.key}"></span><span class="d-cost">${sl.name}</span></button>`).join('')}</div>
        <div class="section-title">${def.genre} Collection <small data-r="bookbonus"></small></div>
        <div class="books-row" data-r="books"></div>
      </div></div>`);
    this.el.appendChild(root.firstElementChild);
    this.el.appendChild(root.lastElementChild);

    const q = (sel) => this.el.querySelector(sel);
    this.refs = {};
    this.el.querySelectorAll('[data-r]').forEach((n) => { this.refs[n.dataset.r] = n; });
    q('.close-btn').addEventListener('click', () => this.close());
    this.el.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => {
      const list = this.builtRooms(); const k = list.indexOf(this.i) + +b.dataset.nav;
      if (list[k] != null) { sfx.tap(); this.i = list[k]; this.render(); this.frame(); }
    }));
    this.el.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { sfx.tap(); this.mode = b.dataset.mode === 'max' ? 'max' : +b.dataset.mode; this.update(true); }));
    this.el.querySelectorAll('.row').forEach((row) => {
      const track = row.dataset.track;
      const btn = row.querySelector('.buy');
      this.bindHold(btn, () => this.buy(track, row));
      row.querySelector('.free-ad').addEventListener('click', () => this.freeUpgrade(track));
    });
    this.el.querySelectorAll('[data-decor]').forEach((b) => b.addEventListener('click', () => {
      const k = +b.dataset.decor;
      if (g.s.rooms[this.i].decor[k]) { toast(`${k === 4 ? def.centerName : DECOR[k].name} is already here ✨`); return; }
      if (g.buy(this.i, `decor${k}`)) { sfx.buy(); sfx.sparkle(); haptic('medium'); this.update(true); }
      else { sfx.error(); b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 200); }
    }));
    this.el.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => this.swapFurniture(b.dataset.slot, b)));
    this.renderBooks();
    this.update(true);
  }

  // Cycle this floor's spot through: default -> each owned piece for that spot -> default.
  swapFurniture(slot, btn) {
    const g = this.game;
    const owned = FURNITURE.filter((f) => f.slot === slot && g.ownsFurniture(f.id)).map((f) => f.id);
    if (!owned.length) {
      sfx.tap(); toast(`No ${SLOTS.find((sl) => sl.key === slot).name.toLowerCase()} pieces yet. Find some in the Shop! 🛒`);
      this.close(); this.ui.screens.shop(slot); return;
    }
    const cur = g.floorFurniture(this.i)[slot] || null;
    const list = [null, ...owned];
    const next = list[(list.indexOf(cur) + 1) % list.length];
    g.placeFurniture(this.i, slot, next);
    sfx.buy(); haptic('light');
    btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], 180);
    if (next) this.ui.world.chatter.react(this.i, 'furniture');
    this.update(true);
  }

  rowHtml(track, icon, title) {
    return `<div class="row" data-track="${track}">
      <div class="r-ico">${icon}</div>
      <div class="r-body"><div class="r-title">${title} <em data-r="${track}Badge"></em></div><div class="r-desc" data-r="${track}Desc"></div></div>
      <button class="buy" data-r="${track}Btn"><small data-r="${track}Lbl"></small><span class="cost"><span class="ico ico-coin"></span><span data-r="${track}Cost"></span></span></button>
      <button class="free-ad" data-r="${track}Free">📺 FREE</button>
    </div>`;
  }

  renderBooks() {
    const s = this.game.s;
    const books = BOOKS.filter((b) => b.room === this.i);
    this.refs.books.innerHTML = books.map((b) => {
      const n = s.album[b.id] || 0;
      return `<div data-book="${b.id}" style="cursor:pointer">${bookHtml(b, n)}</div>`;
    }).join('');
    this.refs.books.querySelectorAll('[data-book]').forEach((el) => el.addEventListener('click', () => {
      const b = BOOKS.find((x) => x.id === el.dataset.book); sfx.tap();
      this.ui.screens.bookDetail(b, !!s.album[b.id]);
    }));
    const owned = books.filter((b) => s.album[b.id]).length;
    this.refs.bookbonus.textContent = `${owned}/5 · ×${E.albumMult(s, this.i).toFixed(1)} income`;
  }

  // Hold a buy button to keep buying: satisfying rapid upgrades.
  bindHold(btn, fn) {
    let timer = null; let rep = null; let fired = false;
    const stop = () => { clearTimeout(timer); clearInterval(rep); timer = rep = null; };
    btn.addEventListener('pointerdown', () => {
      fired = false;
      timer = setTimeout(() => { rep = setInterval(() => { fired = true; if (!fn()) stop(); }, 110); }, 420);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
    btn.addEventListener('click', () => { if (!fired) fn(); fired = false; });
  }

  levelCount() {
    if (this.mode === 'max') return Math.max(1, this.game.maxLevels(this.i));
    return this.mode;
  }

  gain(track, n) {
    const s = this.game.s; const r = s.rooms[this.i];
    const copy = { ...r, decor: [...r.decor] };
    E.applyTrack(copy, track, n);
    const mult = E.permanentMult(s) * E.boostMult(s, Date.now(), this.i);
    return (E.roomBaseIncome(s, this.i, copy) - E.roomBaseIncome(s, this.i)) * mult;
  }

  buy(track, row) {
    const n = track === 'lvl' ? this.levelCount() : 1;
    const ok = this.game.buy(this.i, track, n);
    if (ok) {
      sfx.buy(); haptic('light');
      row?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], 180);
    } else {
      sfx.error();
      row?.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'none' }], 220);
    }
    this.update(true);
    return ok;
  }

  async freeUpgrade(track) {
    const i = this.i;
    if (!this.game.freeUpgradeEligible(i, track)) return;
    const ok = await Ads.rewarded('free_upgrade');
    if (ok) {
      this.game.s.stats.adsWatched++;
      this.game.useFreeUpgrade(i, track);
      sfx.reward(); haptic('medium');
      toast('Free upgrade! 🎁', 'gold');
    }
    this.update(true);
  }

  update() {
    if (!this.isOpen || !this.refs) return;
    const g = this.game; const s = g.s; const i = this.i; const r = s.rooms[i]; const R = this.refs;
    if (!r.built) { this.close(); return; }
    const inc = g.roomIncome(i);
    const vpm = E.visitorsPerMin(r);
    R.inc.textContent = fmt(inc);
    R.vpm.textContent = vpm.toFixed(0);
    R.per.textContent = fmt(vpm > 0 ? (inc * 60) / vpm : 0);
    const next = E.nextMilestone(r.lvl); const prev = E.prevMilestone(r.lvl);
    const mi = E.milestoneCount(r.lvl);
    const nextBook = mi < E.BOOK_MILESTONES && !s.album[`${ROOMS[i].id}-${mi}`] ? BOOKS.find((b) => b.id === `${ROOMS[i].id}-${mi}`) : null;
    R.ms.innerHTML = next ? `Lv ${r.lvl} → <b>×2 income</b>${nextBook ? ` + 📕 <i>${nextBook.title}</i>` : ''} at Lv ${next}` : `Lv ${r.lvl} · all milestones reached!`;
    R.msbar.style.width = next ? `${((r.lvl - prev) / (next - prev)) * 100}%` : '100%';
    this.el.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', String(this.mode) === b.dataset.mode));

    const setRow = (track, badge, desc, label, cost, maxed) => {
      R[`${track}Badge`].textContent = badge;
      R[`${track}Desc`].innerHTML = desc;
      const btn = R[`${track}Btn`];
      btn.classList.toggle('maxed', maxed);
      btn.classList.toggle('can', !maxed && cost <= s.coins);
      R[`${track}Lbl`].textContent = maxed ? 'MAX' : label;
      R[`${track}Cost`].textContent = maxed ? '✓' : fmt(cost);
      btn.querySelector('.ico').style.display = maxed ? 'none' : '';
      R[`${track}Free`].classList.toggle('show', !maxed && g.freeUpgradeEligible(i, track) && (track !== 'lvl'));
    };
    const n = this.levelCount();
    setRow('lvl', `Lv ${r.lvl}`, `<b>+${fmt(this.gain('lvl', n))}/s</b> · more books, better visitors`, `Upgrade ×${n}`, g.cost(i, 'lvl', n), r.lvl >= LIMITS.level);
    setRow('seats', `${r.seats}/${LIMITS.seats}`, r.seats < LIMITS.seats ? `<b>+${fmt(this.gain('seats', 1))}/s</b> · more mice read at once` : 'Every seat is taken!', 'Add seat', g.cost(i, 'seats'), r.seats >= LIMITS.seats);
    setRow('shelves', `${r.shelves}/${LIMITS.shelves}`, r.shelves < LIMITS.shelves ? `<b>+${fmt(this.gain('shelves', 1))}/s</b> · attracts more visitors` : 'Shelves are full of stories!', 'Add shelf', g.cost(i, 'shelves'), r.shelves >= LIMITS.shelves);
    setRow('staff', `Lv ${r.staff}/${LIMITS.staff}`, r.staff < LIMITS.staff ? `<b>+${fmt(this.gain('staff', 1))}/s</b> · faster checkout` : 'A master librarian!', 'Train', g.cost(i, 'staff'), r.staff >= LIMITS.staff);

    const furn = g.floorFurniture(i);
    SLOTS.forEach((sl) => {
      const f = FURN[furn[sl.key]];
      R[`fi_${sl.key}`].textContent = f ? f.icon : sl.icon;
      R[`fi_${sl.key}`].style.opacity = f ? '1' : '0.45';
      R[`fn_${sl.key}`].textContent = f ? f.name : 'Floor’s own';
      this.el.querySelector(`[data-slot="${sl.key}"]`).classList.toggle('owned', !!f);
    });
    DECOR.forEach((d, k) => {
      const el = this.el.querySelector(`[data-decor="${k}"]`);
      const owned = r.decor[k];
      const cost = E.decorCost(i, k);
      el.classList.toggle('owned', owned);
      el.classList.toggle('can', !owned && cost <= s.coins);
      R[`dc${k}`].innerHTML = owned ? '✓ +' + Math.round(d.bonus * 100) + '%' : `<span class="ico ico-coin"></span>${fmt(cost)}`;
    });
  }
}
