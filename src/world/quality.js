// Keeps the game smooth on every phone.
//   • Never draws more than 60 frames a second (120 Hz screens would otherwise double the work).
//   • "Auto" graphics watches the frame rate and lowers the render resolution step by step when a
//     phone struggles (2x → 1.6x → 1.3x → 1x, then simpler far-away details), and raises it again
//     when there is headroom. The other settings fix the level.
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
    this.win = { n: 0, gap: 0, work: 0, good: 0 };
    this.apply();
  }
  mode() { return GRAPHICS.includes(this.settings.graphics) ? this.settings.graphics : 'auto'; }
  apply() {
    const m = this.mode();
    const lv = m === 'auto' ? this.level : FIXED[m].level;
    const lite = m === 'auto' ? this.lite : FIXED[m].lite;
    const cap = LEVELS[lv];
    if (this.world.renderCap !== cap) { this.world.renderCap = cap; this.world.resize(); }
    this.world.lite = lite;
  }
  setMode(m) { this.settings.graphics = m; this.win = { n: 0, gap: 0, work: 0, good: 0 }; this.apply(); }
  // Called once per drawn frame: time since the previous drawn frame and time spent drawing it.
  sample(gapMs, workMs) {
    if (this.mode() !== 'auto' || gapMs > 150) return; // ignore pauses (tab switches, modals)
    const w = this.win; w.n++; w.gap += gapMs; w.work += workMs;
    if (w.n < 90) return;
    const gap = w.gap / w.n; const work = w.work / w.n;
    w.n = 0; w.gap = 0; w.work = 0;
    if (gap > 21 || work > 15) { // under ~48 fps: step down
      w.good = 0;
      if (this.level < LEVELS.length - 1) this.level++;
      else this.lite = true;
      this.apply();
    } else if (gap < 17.8 && work < 7) { // comfortable: after a while, step back up
      if (++w.good >= 4) {
        w.good = 0;
        if (this.lite) this.lite = false;
        else if (this.level > 0) this.level--;
        this.apply();
      }
    } else w.good = 0;
  }
}
