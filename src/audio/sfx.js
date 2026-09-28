// Sound effects: recorded CC0 samples (Kenney.nl) + small synths for musical stingers.
import { audioCtx, buses, whenReady } from './audio.js';
import { voices } from './music.js';

const FILES = {
  coins_big: 'audio/coins_big.mp3', coins_small: 'audio/coins_small.mp3', book_open: 'audio/book_open.mp3',
  book_close: 'audio/book_close.mp3', page_flip: 'audio/page_flip.mp3', book_place: 'audio/book_place.mp3',
  door: 'audio/door.mp3', hammer: 'audio/hammer.mp3', confirm: 'audio/confirm.mp3', confirm_big: 'audio/confirm_big.mp3',
  click: 'audio/click.mp3', tap: 'audio/tap.mp3', pluck: 'audio/pluck.mp3', pluck2: 'audio/pluck2.mp3', drop: 'audio/drop.mp3',
  error: 'audio/error.mp3', open: 'audio/open.mp3', close: 'audio/close.mp3', tick: 'audio/tick.mp3', sparkle: 'audio/sparkle.mp3',
};

const buffers = {};
let enabled = true;
let volume = 0.9;
const lastPlayed = {};

export function loadSfx() {
  whenReady(async (ctx) => {
    await Promise.all(Object.entries(FILES).map(async ([k, url]) => {
      try {
        const res = await fetch(url);
        const data = await res.arrayBuffer();
        buffers[k] = await new Promise((ok, bad) => ctx.decodeAudioData(data, ok, bad));
      } catch (e) { /* synth fallback used */ }
    }));
  });
}

export function setSfxEnabled(on) { enabled = on; }
export function setSfxVolume(v) { volume = v; const b = buses().sfx; if (b) b.gain.value = v; }

function ready() { const c = audioCtx(); return enabled && c && c.state === 'running' ? c : null; }

function sample(name, { vol = 1, rate = 1, throttle = 0 } = {}) {
  const ctx = ready();
  if (!ctx) return false;
  const now = performance.now();
  if (throttle && lastPlayed[name] && now - lastPlayed[name] < throttle) return true;
  lastPlayed[name] = now;
  const buf = buffers[name];
  if (!buf) return false;
  const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(g).connect(buses().sfx); src.start();
  return true;
}

function tone(freq, { type = 'sine', dur = 0.15, vol = 0.2, slide = 0, delay = 0, attack = 0.004 } = {}) {
  const ctx = ready(); if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(buses().sfx); o.start(t); o.stop(t + dur + 0.05);
}

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
function arp(notes, step = 0.07, vol = 0.22, voice = 'box') {
  const ctx = ready(); if (!ctx) return;
  notes.forEach((m, k) => voices[voice](ctx, buses().sfx, ctx.currentTime + k * step, m, 0.4, vol));
}

let buyCombo = 0; let buyComboAt = 0;

export const sfx = {
  tap() { sample('tap', { vol: 0.6 }) || tone(900, { dur: 0.05, vol: 0.1 }); },
  click() { sample('click', { vol: 0.6 }) || tone(700, { dur: 0.06, vol: 0.12 }); },
  open() { sample('book_open', { vol: 0.8 }) || tone(500, { dur: 0.1, slide: 1.5 }); },
  close() { sample('book_close', { vol: 0.6 }) || tone(600, { dur: 0.1, slide: 0.6 }); },
  error() { sample('error', { vol: 0.6 }) || tone(200, { type: 'square', dur: 0.12, vol: 0.08 }); },
  // Purchases climb in pitch when chained quickly: tiny dopamine ladder.
  buy() {
    const now = performance.now();
    buyCombo = now - buyComboAt < 1500 ? Math.min(buyCombo + 1, 12) : 0;
    buyComboAt = now;
    const rate = Math.pow(2, buyCombo / 12);
    sample('pluck', { vol: 0.7, rate }) || tone(660 * rate, { dur: 0.1, vol: 0.15 });
    const ctx = ready(); if (ctx) voices.box(ctx, buses().sfx, ctx.currentTime + 0.02, 79 + buyCombo, 0.3, 0.09);
  },
  coin(pitch = 0) {
    const f = 1900 * Math.pow(2, pitch / 12) * (0.97 + Math.random() * 0.06);
    tone(f, { dur: 0.12, vol: 0.05 }); tone(f * 1.5, { dur: 0.18, vol: 0.035, delay: 0.045 });
  },
  collect(big = false) {
    sample(big ? 'coins_big' : 'coins_small', { vol: 0.9 });
    for (let k = 0; k < (big ? 7 : 4); k++) setTimeout(() => sfx.coin(k), k * 55);
  },
  bell() {
    const ctx = ready(); if (!ctx) return;
    voices.box(ctx, buses().sfx, ctx.currentTime, 88 + (Math.random() < 0.5 ? 0 : 3), 0.5, 0.13);
  },
  pageFlip() { sample('page_flip', { vol: 0.25, throttle: 1200, rate: 0.9 + Math.random() * 0.2 }); },
  hammer() { sample('hammer', { vol: 0.18, throttle: 400, rate: 0.9 + Math.random() * 0.3 }); },
  squeak() {
    const f = 2200 + Math.random() * 700;
    tone(f, { type: 'sine', dur: 0.09, vol: 0.07, slide: 1.35 });
    tone(f * 1.3, { type: 'sine', dur: 0.08, vol: 0.05, slide: 1.2, delay: 0.1 });
  },
  sparkle() { sample('sparkle', { vol: 0.5 }); arp([84, 88, 91, 96], 0.05, 0.1); },
  milestone() { arp([72, 76, 79, 84, 88], 0.08, 0.2); sample('confirm', { vol: 0.5 }); },
  levelUp() { arp([67, 72, 76, 79, 84, 88, 91], 0.07, 0.18); },
  fanfare() { arp([65, 69, 72, 77, 81, 84, 89], 0.09, 0.2, 'box'); setTimeout(() => arp([77, 81, 84, 89], 0.0, 0.1, 'piano'), 650); sample('door', { vol: 0.4 }); },
  reward() { sample('confirm_big', { vol: 0.7 }); arp([76, 79, 84], 0.07, 0.15); },
  special() { arp([79, 83, 86, 91, 95], 0.06, 0.13); sample('sparkle', { vol: 0.5 }); },
  whoosh() { sample('open', { vol: 0.5 }); },
  tick() { sample('tick', { vol: 0.5 }) || tone(1400, { dur: 0.02, vol: 0.08 }); },
  drop() { sample('drop', { vol: 0.6 }); },
  coo() { tone(420, { type: 'triangle', dur: 0.22, vol: 0.06, slide: 0.8 }); tone(380, { type: 'triangle', dur: 0.3, vol: 0.05, slide: 0.85, delay: 0.25 }); },
  hiss() {
    const ctx = ready(); if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * 0.35);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 2500;
    const g = ctx.createGain(); g.gain.value = 0.09;
    src.connect(bp).connect(g).connect(buses().sfx); src.start();
    tone(520, { type: 'sawtooth', dur: 0.25, vol: 0.02, slide: 0.7 });
  },
  squish() { tone(320, { type: 'sine', dur: 0.12, vol: 0.14, slide: 0.45 }); sample('pluck2', { vol: 0.5, rate: 0.8 }); },
  ribbit() { tone(210, { type: 'square', dur: 0.08, vol: 0.035, slide: 1.4 }); tone(240, { type: 'square', dur: 0.1, vol: 0.035, slide: 1.3, delay: 0.12 }); },
  wish() { arp([84, 91, 96, 100, 103], 0.05, 0.12); },
  whistle() { tone(1800, { dur: 0.12, vol: 0.06, slide: 1.3 }); tone(2300, { dur: 0.25, vol: 0.06, slide: 0.8, delay: 0.14 }); },
  dialog() { tone(760 + Math.random() * 200, { type: 'triangle', dur: 0.04, vol: 0.035 }); },
  // World & furniture
  pop() { tone(900, { dur: 0.08, vol: 0.12, slide: 0.4 }); tone(1600, { dur: 0.05, vol: 0.05, delay: 0.02 }); },
  cuckoo() { tone(988, { type: 'triangle', dur: 0.22, vol: 0.09 }); tone(784, { type: 'triangle', dur: 0.3, vol: 0.09, delay: 0.26 }); },
  bong() { const ctx = ready(); if (!ctx) return; voices.box(ctx, buses().sfx, ctx.currentTime, 55, 1.2, 0.2); voices.box(ctx, buses().sfx, ctx.currentTime, 67, 1.2, 0.08); },
  waltz() { arp([65, 69, 72, 77, 72, 69], 0.16, 0.12, 'piano'); },
  typewriter() { for (let k = 0; k < 6; k++) tone(2600 + Math.random() * 800, { type: 'square', dur: 0.015, vol: 0.03, delay: k * 0.07 + Math.random() * 0.02 }); tone(2400, { dur: 0.3, vol: 0.05, delay: 0.5 }); },
  drip() { tone(1900 + Math.random() * 300, { dur: 0.09, vol: 0.03, slide: 0.55 }); },
  gull() { tone(1500, { type: 'triangle', dur: 0.18, vol: 0.025, slide: 0.65 }); tone(1400, { type: 'triangle', dur: 0.2, vol: 0.02, slide: 0.6, delay: 0.22 }); },
  snore() { tone(110, { type: 'sawtooth', dur: 0.6, vol: 0.03, slide: 1.4, attack: 0.25 }); },
  dragon() { tone(140, { type: 'sawtooth', dur: 0.3, vol: 0.04, slide: 1.6 }); arp([84, 88, 91], 0.06, 0.1); },
  whale() { tone(220, { type: 'sine', dur: 0.9, vol: 0.06, slide: 1.5, attack: 0.25 }); tone(330, { type: 'sine', dur: 1.1, vol: 0.05, slide: 0.7, attack: 0.3, delay: 0.8 }); },
  firework() {
    const ctx = ready(); if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * 0.5);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * (Math.random() < 0.08 ? 1 : 0.4);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    const g = ctx.createGain(); g.gain.value = 0.05;
    src.connect(lp).connect(g).connect(buses().sfx); src.start();
  },
  // Ambience
  bird() {
    const base = 2600 + Math.random() * 1400;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) tone(base * (1 + Math.random() * 0.2), { dur: 0.07, vol: 0.022, slide: 1.4, delay: k * 0.11 });
  },
  cricket() {
    for (let k = 0; k < 3; k++) tone(4300, { type: 'triangle', dur: 0.035, vol: 0.012, delay: k * 0.06 });
  },
};
