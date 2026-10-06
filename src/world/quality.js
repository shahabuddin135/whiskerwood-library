// Keeps the game smooth on every phone.
//   • Never draws more than 60 frames a second (120 Hz screens would otherwise double the work).
//   • "Auto" graphics watches the frame rate and lowers the render resolution step by step when a
//     phone struggles (2x → 1.6x → 1.3x → 1x, then simpler far-away details, and as a last resort
//     a steady 30 frames a second, which looks smoother than an uneven 40), and raises it again
//     when there is headroom. The other settings fix the level.
import { spritesWarming } from './sprites.js';

export const GRAPHICS = ['auto', 'beautiful', 'balanced', 'smooth'];
export const GRAPHICS_LABEL = { auto: 'Auto', beautiful: 'Beautiful', balanced: 'Balanced', smooth: 'Smooth' };
const LEVELS = [2, 1.6, 1.3, 1];
const FIXED = { beautiful: { level: 0, lite: false }, balanced: { level: 1, lite: false }, smooth: { level: 3, lite: true } };

export class Quality {
  constructor(world, settings) {
    this.world = world; this.settings = settings;
    // phones with few cores or little memory start one step lower
    const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
    this.level = weak ? 1 : 0; this.lite = false;
    this.downs = 0; // each step down makes the next step up more patient (no see-sawing)
    this.fps30 = false;
    this.win = { n: 0, gap: 0, work: 0, good: 0 };
    this.apply();
  }
  mode() { return GRAPHICS.includes(this.settings.graphics) ? this.settings.graphics : 'auto'; }
  apply() {
    const m = this.mode();
    if (m !== 'auto') this.fps30 = false;
    const lv = m === 'auto' ? this.level : FIXED[m].level;
    const lite = m === 'auto' ? this.lite : FIXED[m].lite;
    const cap = LEVELS[lv];
    if (this.world.renderCap !== cap) { this.world.renderCap = cap; this.world.resize(); }
    this.world.lite = lite;
  }
  setMode(m) { this.settings.graphics = m; this.win = { n: 0, gap: 0, work: 0, good: 0 }; this.apply(); }
  // Ignore the frame rate for a while (e.g. just after the opening story).
  hold(ms) { this.holdUntil = performance.now() + ms; this.win = { ...this.win, n: 0, gap: 0, work: 0 }; }
  // Called once per drawn frame: time since the previous drawn frame and time spent drawing it.
  sample(gapMs, workMs) {
    if (this.mode() !== 'auto' || gapMs > 150) return; // ignore pauses (tab switches, modals)
    // While new pictures are still being painted (just after starting, zooming, a new place) the
    // frames are slower than they'll be a moment later: judging them then would lower the
    // resolution, which means repainting everything, which is slow again... So wait (up to 8 s).
    const now = performance.now();
    if (now < (this.holdUntil || 0)) { this.win.n = 0; this.win.gap = 0; this.win.work = 0; return; }
    if (spritesWarming()) {
      this.warmSince ??= now;
      if (now - this.warmSince < 8000) { this.win.n = 0; this.win.gap = 0; this.win.work = 0; return; }
    } else this.warmSince = null;
    const w = this.win; w.n++; w.gap += gapMs; w.work += workMs;
    if (w.n < 90) return;
    const gap = w.gap / w.n; const work = w.work / w.n;
    w.n = 0; w.gap = 0; w.work = 0;
    if (this.fps30) { // at 30 a second: go back to 60 only when the work would clearly fit
      if (work < 8) { if (++w.good >= 6) { w.good = 0; this.fps30 = false; } } else w.good = 0;
      return;
    }
    if (gap > 21 || work > 15) { // under ~48 fps: step down
      w.good = 0;
      if (this.level < LEVELS.length - 1) this.level++;
      else if (!this.lite) this.lite = true;
      else this.fps30 = true;
      this.downs++;
      this.apply();
    } else if (gap < 17.8 && work < 7) { // comfortable: after a while, step back up
      // every change of resolution means repainting the cached pictures (see sprites.js), so only
      // step back up after a long, comfortable stretch
      if (++w.good >= 4 * (1 + this.downs)) {
        w.good = 0;
        if (this.lite) this.lite = false;
        else if (this.level > 0) this.level--;
        this.apply();
      }
    } else w.good = 0;
  }
}
