// Features appear one at a time as the library grows, instead of a screen full of buttons on the
// very first day. Once a feature has appeared it stays (remembered in the save), and anything that
// appears during play pops in with a little "NEW" tag and a word from Pip.
import { $, toast } from './dom.js';
import { sfx } from '../audio/sfx.js';
import * as E from '../core/economy.js';

const built = (g) => g.builtCount();
const FEATURES = [
  { id: 'cheese', el: '#cheesePill', when: (s) => s.questIdx >= 2, say: '🧀 Golden cheese! Save it for the special things.' },
  { id: 'rep', el: '#repBtn', when: (s) => s.questIdx >= 4, say: '⭐ Your library has a reputation now. Every level brings a reward!' },
  { id: 'tasks', el: '#tasks', when: (s) => s.questIdx >= 5, say: '📋 Three little jobs every day, and a chest of treats for finishing them.' },
  { id: 'daily', el: '#dailyBtn', when: (s) => s.questIdx >= 5, say: '🎁 There’s a gift waiting for you every day.' },
  { id: 'build', el: '#topBtn', when: (s, g) => s.questIdx >= 6 || built(g) >= 2 },
  { id: 'shop', el: '#navShop', when: (s) => s.questIdx >= 7, say: '🛒 The shop is open!' },
  { id: 'floors', el: '#floorsBtn', when: (s, g) => built(g) >= 2 },
  { id: 'zoom', el: '#zoomCtl', when: (s, g) => built(g) >= 2 },
  { id: 'album', el: '#albumBtn', when: (s) => E.booksOwned(s) >= 1 },
  { id: 'story', el: '#storyBtn', when: (s) => s.questIdx >= 8, say: '📖 Story Hour: read to the whole library for double coins!' },
  { id: 'season', el: '.season-chip', when: (s) => s.questIdx >= 9 || s.branch > 0 },
  { id: 'wheel', el: '#navWheel', when: (s) => s.questIdx >= 10, say: '🎡 The Lucky Wheel is here: a free spin every day!' },
  { id: 'move', el: '#navBranch', when: (s) => !!(s.flags?.siteFull || s.branch > 0 || s.move?.end) },
];

export class Reveal {
  constructor(ui) {
    this.ui = ui; this.game = ui.game;
    const f = this.game.s.flags || (this.game.s.flags = {});
    this.seen = new Set(f.revealed || []);
    // on load, whatever the player has already reached is simply there
    for (const ft of FEATURES) if (ft.when(this.game.s, this.game)) this.seen.add(ft.id);
    this.save();
    this.apply();
  }
  save() { this.game.s.flags.revealed = [...this.seen]; }
  has(id) { return this.seen.has(id); }
  apply() {
    for (const ft of FEATURES) { const el = $(ft.el); if (el) el.classList.toggle('locked', !this.seen.has(ft.id)); }
  }
  // Called from the UI's regular refresh.
  update() {
    const s = this.game.s;
    let fresh = null;
    for (const ft of FEATURES) {
      if (this.seen.has(ft.id) || !ft.when(s, this.game)) continue;
      this.seen.add(ft.id); fresh = fresh || ft;
      const el = $(ft.el); if (!el) continue;
      el.classList.remove('locked');
      el.classList.add('just-unlocked');
      if (!el.querySelector('.new-tag')) el.insertAdjacentHTML('beforeend', '<i class="new-tag">NEW</i>');
      const clear = () => { el.classList.remove('just-unlocked'); el.querySelector('.new-tag')?.remove(); };
      el.addEventListener('click', clear, { once: true });
      setTimeout(clear, 12000);
    }
    if (fresh) {
      this.save();
      sfx.sparkle?.();
      if (fresh.say) toast(fresh.say, 'gold');
    }
  }
}
