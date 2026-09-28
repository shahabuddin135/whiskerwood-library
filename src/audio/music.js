// Original cozy waltz in F major, performed live by small Web Audio synths.
// Inspired by the warm, wistful feel of Studio Ghibli scores: 3/4 time, the
// "royal road" IV-V-iii-vi progression, maj7/add9 colours, piano arpeggios,
// a music box, a breathy flute and a soft string pad.
import { audioCtx, buses, whenReady, setVolume } from './audio.js';
import { CONFIG } from '../config.js';

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

const CH = {
  Bbmaj7: [46, [58, 62, 65, 69]], C7: [48, [58, 64, 67]], Am7: [45, [55, 60, 64]], Dm7: [50, [57, 60, 65]],
  Gm7: [43, [58, 62, 65]], C7sus: [48, [58, 65, 67]], Fmaj7: [41, [57, 60, 64]], F7: [41, [57, 63, 65]],
  C: [48, [55, 60, 64]], Fadd9: [41, [57, 60, 67]], Dm: [50, [57, 62, 65]], AmC: [48, [57, 60, 64]], FA: [45, [57, 60, 65]],
};

const SECTIONS = {
  A: {
    chords: ['Bbmaj7', 'C7', 'Am7', 'Dm7', 'Gm7', 'C7sus', 'Fmaj7', 'F7', 'Bbmaj7', 'C', 'Am7', 'Dm7', 'Gm7', 'C7', 'Fadd9', 'Fadd9'],
    melody: [
      [[74, 1.5], [72, 0.5], [74, 1]], [[76, 2], [67, 1]], [[72, 1.5], [70, 0.5], [72, 1]], [[74, 2], [69, 1]],
      [[70, 1], [69, 1], [67, 1]], [[65, 1], [67, 1], [72, 1]], [[69, 3]], [[0, 1], [72, 1], [75, 1]],
      [[74, 1.5], [77, 0.5], [81, 1]], [[79, 2], [76, 1]], [[76, 1.5], [74, 0.5], [72, 1]], [[77, 2], [74, 1]],
      [[74, 1], [72, 1], [70, 1]], [[69, 1], [70, 1], [67, 1]], [[69, 1.5], [67, 0.5], [65, 1]], [[65, 2], [0, 1]],
    ],
  },
  B: {
    chords: ['Dm', 'AmC', 'Bbmaj7', 'FA', 'Gm7', 'Am7', 'Bbmaj7', 'C7', 'Dm', 'AmC', 'Bbmaj7', 'FA', 'Gm7', 'C7sus', 'Fadd9', 'Fadd9'],
    melody: [
      [[74, 1], [77, 1], [81, 1]], [[79, 2], [76, 1]], [[77, 1.5], [76, 0.5], [74, 1]], [[72, 2], [69, 1]],
      [[70, 1], [74, 1], [77, 1]], [[76, 2], [72, 1]], [[74, 1.5], [72, 0.5], [70, 1]], [[72, 2], [76, 1]],
      [[77, 1], [74, 1], [81, 1]], [[84, 2], [81, 1]], [[82, 1.5], [81, 0.5], [77, 1]], [[77, 2], [72, 1]],
      [[70, 1], [74, 1], [79, 1]], [[77, 1.5], [79, 0.5], [77, 1]], [[77, 3]], [[0, 3]],
    ],
  },
};

// Arrangements: which layers play in each pass.
const DAY_PLAN = [
  { sec: 'A', lead: 'piano', oct: 0, pad: false, acc: 'flow' },
  { sec: 'B', lead: 'box', oct: 12, pad: true, acc: 'flow' },
  { sec: 'A', lead: 'flute', oct: 0, pad: true, acc: 'flow' },
  { sec: 'B', lead: 'flute', oct: 0, pad: true, acc: 'flow', double: 'box' },
];
const NIGHT_PLAN = [
  { sec: 'A', lead: 'box', oct: 12, pad: true, acc: 'waltz' },
  { sec: 'B', lead: 'piano', oct: 0, pad: true, acc: 'waltz' },
];

let noiseBuf = null;
function noise(ctx) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function panner(ctx, v, dest) {
  if (!ctx.createStereoPanner) return dest;
  const p = ctx.createStereoPanner(); p.pan.value = Math.max(-0.8, Math.min(0.8, v)); p.connect(dest); return p;
}

export const voices = {
  // Kept deliberately light (2 oscillators, short tails) so phones never crackle.
  piano(ctx, dest, t, midi, dur, vel, lead = false) {
    const f = mtof(midi);
    const out = ctx.createGain();
    if (lead) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(Math.min(f * 8, 8000), t);
      lp.frequency.setTargetAtTime(Math.max(f * 2.5, 700), t, 0.3);
      out.connect(lp).connect(panner(ctx, 0.15, dest));
    } else out.connect(dest);
    const tau = Math.min(0.75, 0.42 * Math.pow(440 / f, 0.3) + 0.18);
    const end = t + Math.min(4, Math.max(dur + 0.25, tau * 4));
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(vel, t + 0.006);
    out.gain.setTargetAtTime(0, t + 0.01, tau);
    out.gain.setTargetAtTime(0, Math.max(t + 0.02, end - 0.3), 0.08);
    const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.0015;
    const g2 = ctx.createGain(); g2.gain.value = lead ? 0.34 : 0.26;
    o1.connect(out); o2.connect(g2).connect(out);
    o1.start(t); o2.start(t); o1.stop(end); o2.stop(end);
  },
  box(ctx, dest, t, midi, dur, vel) {
    const f = mtof(midi);
    const out = ctx.createGain();
    out.connect(panner(ctx, 0.25, dest));
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(vel, t + 0.003);
    out.gain.setTargetAtTime(0, t + 0.004, 0.42);
    const end = t + 2.1;
    [[1, 1, 0], [2, 0.18, 0.4], [5.4, 0.12, 0.06]].forEach(([mul, g, fast]) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * mul;
      const gg = ctx.createGain(); gg.gain.setValueAtTime(g, t);
      if (fast) gg.gain.setTargetAtTime(0, t + 0.002, fast);
      o.connect(gg).connect(out); o.start(t); o.stop(end);
    });
  },
  flute(ctx, dest, t, midi, dur, vel) {
    const f = mtof(midi);
    const out = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    out.connect(lp).connect(panner(ctx, -0.2, dest));
    const rel = t + Math.max(0.12, dur - 0.04);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(vel, t + 0.07);
    out.gain.setValueAtTime(vel * 0.92, rel);
    out.gain.setTargetAtTime(0, rel, 0.09);
    const end = rel + 0.4;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.1;
    const depth = ctx.createGain(); depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(f * 0.006, t + 0.35);
    lfo.connect(depth); lfo.start(t); lfo.stop(end);
    [['sine', 1], ['triangle', 0.22]].forEach(([type, g]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      depth.connect(o.frequency);
      const gg = ctx.createGain(); gg.gain.value = g;
      o.connect(gg).connect(out); o.start(t); o.stop(end);
    });
    const n = ctx.createBufferSource(); n.buffer = noise(ctx); n.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 1.2;
    const ng = ctx.createGain(); ng.gain.value = 0.05;
    n.connect(bp).connect(ng).connect(out); n.start(t); n.stop(end);
  },
  // A whole chord shares one filter + envelope; one detuned saw per note.
  strings(ctx, dest, t, notes, dur, vel) {
    const out = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.Q.value = 0.6;
    out.connect(lp).connect(dest);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(vel, t + 0.7);
    out.gain.setValueAtTime(vel, t + dur);
    out.gain.setTargetAtTime(0, t + dur, 0.4);
    const end = t + dur + 1.6;
    notes.forEach((m, k) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = k % 2 ? 7 : -7;
      o.connect(out); o.start(t); o.stop(end);
    });
  },
  // Soft sleigh-bell shaker (filtered noise).
  shaker(ctx, dest, t, vel) {
    const n = ctx.createBufferSource(); n.buffer = noise(ctx);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6500;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.005); g.gain.setTargetAtTime(0, t + 0.01, 0.05);
    n.connect(hp).connect(g).connect(dest); n.start(t, Math.random() * 0.5); n.stop(t + 0.3);
  },
  sub(ctx, dest, t, midi, dur, vel) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + 0.02); g.gain.setTargetAtTime(0, t + 0.05, 0.6);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 1.5);
  },
};

export class Music {
  constructor() {
    this.enabled = true;
    this.volume = 0.6;
    this.mode = 'day';
    this.pendingMode = 'day';
    this.running = false;
    this.timer = null;
    this.bar = 0;
    this.pass = 0;
    this.nextTime = 0;
    this.flavor = null; // festival layer: 'bells' | 'chimes' | 'spooky'
  }

  setFlavor(f) { this.flavor = f; }

  start() {
    whenReady((ctx) => {
      if (this.running || !this.enabled) return;
      this.running = true;
      if (CONFIG.musicFiles?.day) { this.playFile(); return; }
      this.nextTime = ctx.currentTime + 0.2;
      this.bar = 0; this.pass = 0;
      setVolume('music', this.volume * 0.55, 2.5);
      this.timer = setInterval(() => this.tick(), 60);
    });
  }

  stop() {
    this.running = false;
    clearInterval(this.timer);
    setVolume('music', 0, 0.6);
    this.el?.pause();
  }

  // Optional: stream your own recorded tracks instead of the synthesized waltz.
  playFile() {
    const src = (this.mode === 'night' && CONFIG.musicFiles.night) || CONFIG.musicFiles.day;
    if (!this.el) { this.el = new Audio(); this.el.loop = true; }
    if (!this.el.src.endsWith(src)) this.el.src = src;
    this.el.volume = Math.min(1, this.volume);
    this.el.play().catch(() => {});
  }

  setEnabled(on) { this.enabled = on; if (on) this.start(); else this.stop(); }
  setVolume(v) { this.volume = v; if (this.running) setVolume('music', v * 0.55, 0.3); if (this.el) this.el.volume = Math.min(1, v); }
  setMode(m) {
    this.pendingMode = m;
    if (this.el && this.running && m !== this.mode && CONFIG.musicFiles?.night) { this.mode = m; this.playFile(); }
  }

  plan() { return this.mode === 'night' ? NIGHT_PLAN : DAY_PLAN; }
  bpm() { return this.mode === 'night' ? 78 : 96; }

  tick() {
    const ctx = audioCtx();
    if (!ctx || !this.running || ctx.state !== 'running') return;
    // If the tab slept, skip ahead instead of dumping a pile of notes.
    if (this.nextTime < ctx.currentTime - 0.5) this.nextTime = ctx.currentTime + 0.1;
    while (this.nextTime < ctx.currentTime + 0.35) {
      this.scheduleBar(ctx, this.nextTime);
      this.nextTime += (60 / this.bpm()) * 3;
      this.bar++;
      if (this.bar >= 16) {
        this.bar = 0; this.pass++;
        if (this.pendingMode !== this.mode && this.pass % 2 === 0) { this.mode = this.pendingMode; this.pass = 0; }
      }
    }
  }

  scheduleBar(ctx, t0, dest = buses().music) {
    const plan = this.plan();
    const p = plan[this.pass % plan.length];
    const sec = SECTIONS[p.sec];
    const spb = 60 / this.bpm();
    const [bass, tones] = CH[sec.chords[this.bar]];
    const hum = () => (Math.random() - 0.5) * 0.014;
    const night = this.mode === 'night';

    // Accompaniment
    if (p.acc === 'flow') {
      const pat = [bass, tones[0], tones[1], tones[2] ?? tones[1] + 12, tones[1], tones[0]];
      pat.forEach((m, k) => voices.piano(ctx, dest, t0 + (k * spb) / 2 + hum(), k === 0 ? m : m, spb * 1.4, k === 0 ? 0.2 : 0.1 + Math.random() * 0.025));
    } else {
      voices.piano(ctx, dest, t0 + hum(), bass, spb * 2.5, 0.18);
      tones.forEach((m, k) => voices.piano(ctx, dest, t0 + spb + k * 0.03 + hum(), m, spb, 0.07));
      tones.forEach((m, k) => voices.piano(ctx, dest, t0 + spb * 2 + k * 0.025 + hum(), m, spb, 0.055));
    }
    voices.sub(ctx, dest, t0, bass, spb * 2, night ? 0.1 : 0.13);

    if (p.pad) voices.strings(ctx, dest, t0, tones, spb * 3, night ? 0.026 : 0.032);

    // Festival flavour: a light extra layer so the whole soundtrack joins in.
    if (this.flavor === 'bells') {
      for (let k = 0; k < 3; k++) voices.shaker(ctx, dest, t0 + k * spb + hum(), k === 0 ? 0.05 : 0.03);
      if (this.bar % 2 === 0) voices.box(ctx, dest, t0 + spb * 2, tones[tones.length - 1] + 24, spb, 0.05);
    } else if (this.flavor === 'chimes' && this.bar % 2 === 1) {
      tones.forEach((m, k) => voices.box(ctx, dest, t0 + spb * 2 + k * spb * 0.18, m + 24, spb, 0.035));
    } else if (this.flavor === 'spooky' && this.bar % 4 === 3) {
      voices.box(ctx, dest, t0 + spb, tones[0] + 13, spb * 2, 0.04);
      voices.box(ctx, dest, t0 + spb * 1.5, tones[0] + 12, spb * 2, 0.035);
    }

    // Melody
    let beat = 0;
    for (const [m, len] of sec.melody[this.bar]) {
      if (m > 0) {
        const t = t0 + beat * spb + hum();
        const d = len * spb;
        const lead = p.lead;
        const vel = lead === 'piano' ? 0.26 : lead === 'box' ? 0.2 : 0.16;
        voices[lead](ctx, dest, t, m + p.oct, d, night ? vel * 0.8 : vel, true);
        if (p.double) voices[p.double](ctx, dest, t, m + 12, d, 0.08);
      }
      beat += len;
    }
  }
}

export const music = new Music();

// Renders the soundtrack offline (used to preview/export the music and check levels).
export async function renderPreview(seconds = 60, mode = 'day', rate = 44100, reverb = true) {
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate);
  const master = ctx.createGain(); master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);
  const verb = ctx.createConvolver();
  const len = Math.floor(rate * 2.2); const ir = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  verb.buffer = ir;
  const dest = ctx.createGain(); dest.gain.value = 0.55 * 0.6;
  const wet = ctx.createGain(); wet.gain.value = 0.32 * 0.55;
  dest.connect(master);
  if (reverb) { dest.connect(verb); verb.connect(wet).connect(master); }
  const m = new Music(); m.mode = mode; m.pendingMode = mode;
  let t = 0.1;
  while (t < seconds) {
    m.scheduleBar(ctx, t, dest);
    t += (60 / m.bpm()) * 3;
    if (++m.bar >= 16) { m.bar = 0; m.pass++; }
  }
  return ctx.startRendering();
}
