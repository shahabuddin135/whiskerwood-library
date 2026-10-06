// Little voices for the story's characters. Not words: a soft babble of syllables, one per few
// letters as the text appears, with each character's own pitch, pace and timbre (the way animal
// villagers talk in cosy games). The letters steer the melody (vowels sing, consonants click), and
// the punctuation sets the mood: "!" lifts it, "?" rises at the end, "…" sighs and slows.
// Some characters also make a sound of their own as they start: Clawdia meows, Umber rumbles,
// Pip squeaks when excited.
import { audioCtx, buses } from './audio.js';

// pitch: Hz of a calm syllable. wave: the voice's raw tone, shaped by a formant (a "mouth" filter
// at `formant` Hz). dur: seconds per syllable. every: letters per syllable (the text types at about
// 70 letters a second, so 6 is a chatty 12 syllables a second and 16 a slow dragon's 4).
// vib: a wobble (old voices); noise: rasp; sub: a deep undertone; purr: a cat's flutter.
const VOICE = {
  pip: { pitch: 560, wave: 'triangle', formant: 2300, q: 2.2, dur: 0.055, every: 6, vol: 0.5 },
  mimsy: { pitch: 430, wave: 'sine', formant: 1700, q: 2, dur: 0.08, every: 8, vib: 7, vol: 0.47 },
  mayor: { pitch: 175, wave: 'sawtooth', formant: 850, q: 3, dur: 0.09, every: 9, vol: 0.5 },
  chef: { pitch: 255, wave: 'square', formant: 1250, q: 3, dur: 0.06, every: 6, bounce: 0.25, vol: 0.34 },
  clawdia: { pitch: 210, wave: 'sawtooth', formant: 900, q: 4, dur: 0.12, every: 11, purr: 24, glide: 1, vol: 0.18 },
  rattigan: { pitch: 330, wave: 'square', formant: 1900, q: 3, dur: 0.045, every: 5, noise: 0.5, vol: 0.24 },
  fromage: { pitch: 270, wave: 'sawtooth', formant: 1450, q: 9, dur: 0.075, every: 8, vol: 0.6 },
  queen: { pitch: 360, wave: 'sine', formant: 1700, q: 2, dur: 0.095, every: 8, vib: 5.5, vol: 0.45 },
  digby: { pitch: 160, wave: 'square', formant: 760, q: 3, dur: 0.075, every: 7, vol: 0.36 },
  burrow: { pitch: 320, wave: 'triangle', formant: 1350, q: 2.5, dur: 0.065, every: 6, vol: 0.5 },
  hazel: { pitch: 700, wave: 'triangle', formant: 2700, q: 2, dur: 0.04, every: 4, vol: 0.45 },
  umber: { pitch: 82, wave: 'sawtooth', formant: 380, q: 2.5, dur: 0.18, every: 16, sub: 0.7, noise: 0.25, vol: 0.24 },
  inky: { pitch: 300, wave: 'triangle', formant: 1750, q: 2.5, dur: 0.06, every: 6, vol: 0.5 },
  marrowby: { pitch: 205, wave: 'triangle', formant: 1100, q: 2.5, dur: 0.09, every: 8, vib: 6, vol: 0.5 },
  brioche: { pitch: 420, wave: 'triangle', formant: 2000, q: 2.2, dur: 0.06, every: 6, bounce: 0.2, vol: 0.5 },
  thessaly: { pitch: 370, wave: 'sine', formant: 1500, q: 2, dur: 0.095, every: 8, noise: 0.35, vol: 0.42 },
};
const DEFAULT = VOICE.pip;
// semitones each letter nudges the melody by (vowels sing, consonants stay near the middle)
const LETTER = { a: 0, e: 2, i: 4, o: -2, u: -3, y: 3 };

let enabled = true;
let OFFLINE = null; // { ctx, out } while rendering a sample (see renderSample)
export function setVoicesEnabled(on) { enabled = on; }
const ready = () => { if (OFFLINE) return OFFLINE.ctx; const c = audioCtx(); return enabled && c && c.state === 'running' ? c : null; };
let noiseBuf = null;
function noise(c) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

// One syllable: freq in Hz, at time `at`, with an optional pitch glide (ratio). Kept to three audio
// nodes (tone -> resonant "mouth" filter -> envelope) so a phone never runs short of time for them;
// the old voices' wobble is a pitch curve rather than another oscillator.
function syllable(c, v, freq, at, dur, vol, glide = 1) {
  const out = OFFLINE ? OFFLINE.out : buses().sfx;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol * 0.45, at + Math.min(0.012, dur * 0.25)); // (the resonant filter lets more through than the old band-pass did)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = v.formant; f.Q.value = Math.min(5, (v.q || 2) * 1.6); // (capped: a very sharp filter whistles)
  f.connect(g); g.connect(out);
  const o = c.createOscillator(); o.type = v.wave;
  o.frequency.setValueAtTime(freq, at);
  if (glide !== 1) o.frequency.exponentialRampToValueAtTime(freq * glide, at + dur);
  else if (v.vib) { o.frequency.linearRampToValueAtTime(freq * 1.03, at + dur * 0.4); o.frequency.linearRampToValueAtTime(freq * 0.985, at + dur); }
  if (v.purr) { const l = c.createOscillator(); const lg = c.createGain(); l.frequency.value = v.purr; lg.gain.value = vol * 0.6; l.connect(lg).connect(g.gain); l.start(at); l.stop(at + dur + 0.02); }
  o.connect(f); o.start(at); o.stop(at + dur + 0.02);
  if (v.sub) { const s = c.createOscillator(); s.type = 'sine'; s.frequency.setValueAtTime(freq / 2, at); const sg = c.createGain(); sg.gain.value = v.sub; s.connect(sg).connect(g); s.start(at); s.stop(at + dur + 0.02); }
  if (v.noise) {
    const n = c.createBufferSource(); n.buffer = noise(c);
    const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = v.formant * 1.6; nf.Q.value = 1.2;
    const ng = c.createGain(); ng.gain.value = v.noise;
    n.connect(nf).connect(ng).connect(g); n.start(at, Math.random() * 0.3); n.stop(at + dur + 0.02);
  }
}

// How a line feels, from its punctuation and shouting.
export function moodOf(text) {
  if (/[A-Z]{3,}/.test(text) && /!/.test(text)) return 'alarmed';
  if (/!/.test(text)) return 'excited';
  if (/\?\s*$/.test(text) || /\?/.test(text)) return 'asking';
  if (/…|\.\.\./.test(text)) return 'wistful';
  return 'calm';
}
const MOOD = { calm: [0, 1], excited: [3, 0.85], alarmed: [6, 0.7], asking: [1, 1], wistful: [-2, 1.25] };
// Syllables are queued one after another, never on top of each other: when the game stutters,
// the typewriter's timer catches up in a burst, and stacking that burst into one instant made a
// loud screech. Anything that would start more than a third of a second late is simply dropped.
let cursor = 0;

export const voices = {
  // Babble the newly typed piece of a line. `pos` is how far into the line it starts.
  say(who, chunk, mood = 'calm', pos = 0, lineLen = 1) {
    const c = ready(); if (!c || !chunk) return;
    const v = VOICE[who] || DEFAULT;
    const [lift, slow] = MOOD[mood] || MOOD.calm;
    let at = Math.max(c.currentTime, cursor);
    if (at > c.currentTime + 0.33) return;
    for (let k = 0; k < chunk.length; k++) {
      const p = pos + k;
      if (p % v.every) continue;
      const ch = chunk[k].toLowerCase();
      if (!/[a-z]/.test(ch)) continue; // spaces and punctuation are little breaths
      let semi = (LETTER[ch] ?? ((ch.charCodeAt(0) * 7) % 5) - 2) + lift;
      const end = p / Math.max(1, lineLen);
      if (mood === 'asking' && end > 0.8) semi += 5 * (end - 0.8) / 0.2; // the question lifts at the end
      if (mood === 'wistful') semi -= 3 * end; // and a sigh drifts down
      if (v.bounce) semi += (p % 2 ? 1 : -1) * v.bounce * 6;
      const freq = v.pitch * Math.pow(2, semi / 12) * (0.97 + Math.random() * 0.06);
      const dur = v.dur * slow;
      syllable(c, v, freq, at, dur, v.vol * 0.32, v.glide ? 1.18 : 1);
      at += dur * 0.55;
    }
    cursor = at;
  },
  // A character's own little sound as their line begins.
  emote(who, mood = 'calm') {
    const c = ready(); if (!c) return;
    const v = VOICE[who] || DEFAULT; const t = Math.max(c.currentTime, cursor);
    if (t > c.currentTime + 0.33) return;
    cursor = t + 0.12;
    if (who === 'clawdia') { syllable(c, { ...v, purr: 0 }, 380, t, 0.42, 0.16, 1.7); syllable(c, { ...v, purr: 0 }, 640, t + 0.2, 0.36, 0.12, 0.6); return; } // mrr-ow
    if (who === 'umber') { syllable(c, v, 62, t, 0.7, 0.09, 0.85); return; } // a long, warm rumble
    if (who === 'rattigan' && mood !== 'calm') { for (let k = 0; k < 3; k++) syllable(c, v, 420 - k * 30, t + k * 0.09, 0.07, 0.12); return; } // heh heh heh
    if (mood === 'alarmed') { syllable(c, v, v.pitch * 1.9, t, 0.16, 0.14, 1.5); return; } // eek!
    if (mood === 'excited' && v.pitch > 300) { syllable(c, v, v.pitch * 1.4, t, 0.1, 0.1, 1.35); } // a happy squeak
  },
};

// For checking the voices side by side: renders a line offline and returns its loudness.
export async function renderSample(who, text) {
  const ctx = new OfflineAudioContext(1, 44100 * 4, 44100);
  OFFLINE = { ctx, out: ctx.destination }; cursor = 0;
  try {
    const mood = moodOf(text);
    voices.emote(who, mood);
    for (let n = 0; n < text.length; n += 2) {
      // the typewriter's pace: two letters every 28 ms
      const at = (n / 2) * 0.028; const keep = ctx.currentTime;
      Object.defineProperty(ctx, 'currentTime', { value: at, configurable: true });
      voices.say(who, text.slice(n, n + 2), mood, n, text.length);
      Object.defineProperty(ctx, 'currentTime', { value: keep, configurable: true });
    }
  } finally { OFFLINE = null; cursor = 0; }
  const buf = await ctx.startRendering(); const d = buf.getChannelData(0);
  let peak = 0; let sum = 0; for (const x of d) { peak = Math.max(peak, Math.abs(x)); sum += x * x; }
  return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4) };
}
