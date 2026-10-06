// Shared Web Audio context, buses and a synthetic reverb.
let ctx = null;
const bus = {};
let unlocked = false;
const onReady = [];

export function audioCtx() { return ctx; }
export function buses() { return bus; }
export function isUnlocked() { return unlocked; }
export function whenReady(fn) { if (ctx && unlocked) fn(ctx); else onReady.push(fn); }

function makeImpulse(c, seconds = 1.6, decay = 2.4) { // (a shorter room is lighter work for a phone)
  const rate = c.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = c.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // Soft early reflections + smooth exponential tail.
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (i < rate * 0.01 ? i / (rate * 0.01) : 1);
    }
  }
  return buf;
}

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  // 'balanced': a slightly bigger audio buffer, so a busy phone doesn't crackle (taps still feel instant)
  ctx = new AC({ latencyHint: 'balanced' });
  bus.master = ctx.createGain();
  bus.master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
  bus.master.connect(comp).connect(ctx.destination);

  bus.reverb = ctx.createConvolver();
  bus.reverb.buffer = makeImpulse(ctx);
  bus.reverbIn = ctx.createGain();
  bus.reverbIn.gain.value = 1;
  const wet = ctx.createGain(); wet.gain.value = 0.32;
  bus.reverbIn.connect(bus.reverb).connect(wet).connect(bus.master);

  bus.music = ctx.createGain(); bus.music.gain.value = 0;
  bus.music.connect(bus.master);
  bus.musicVerb = ctx.createGain(); bus.musicVerb.gain.value = 0.55;
  bus.music.connect(bus.musicVerb).connect(bus.reverbIn);

  bus.sfx = ctx.createGain(); bus.sfx.gain.value = 0.9;
  bus.sfx.connect(bus.master);
  bus.sfxVerb = ctx.createGain(); bus.sfxVerb.gain.value = 0.18;
  bus.sfx.connect(bus.sfxVerb).connect(bus.reverbIn);
}

// Mobile browsers only allow audio after a user gesture.
export function initAudioUnlock() {
  const unlock = () => {
    if (!ctx) build();
    if (!ctx) return;
    const done = () => {
      if (unlocked) return;
      unlocked = true;
      // iOS: play a silent buffer to fully unlock.
      const b = ctx.createBuffer(1, 1, 22050); const src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination); src.start(0);
      while (onReady.length) onReady.shift()(ctx);
    };
    if (ctx.state === 'suspended') ctx.resume().then(done).catch(() => {}); else done();
  };
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (unlocked) ctx.resume().catch(() => {});
  });
}

export function setVolume(name, v, time = 0.4) {
  if (!ctx || !bus[name]) return;
  const g = bus[name].gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setValueAtTime(g.value, ctx.currentTime);
  g.linearRampToValueAtTime(v, ctx.currentTime + time);
}
