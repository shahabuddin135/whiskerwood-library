// The ad's soundtrack: an original, bouncy 120 BPM tune (C major: C G Am F) with sections that follow
// the picture, plus sound effects on every cue in timeline.js. Synthesised offline with the Web Audio
// API (OfflineAudioContext), mixed with the game's own Kenney CC0 sounds, and returned as a WAV.
window.AdAudio = (() => {
  const SR = 48000;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const SAMPLES = ['tap', 'coins_small', 'coins_big', 'hammer', 'sparkle', 'confirm_big', 'door', 'drop', 'pluck', 'pluck2', 'tick', 'book_open', 'page_flip'];

  // chords: [bass note, triad]; melody: one bar of eighth notes per chord
  const CH = { C: [48, [60, 64, 67]], G: [43, [59, 62, 67]], Am: [45, [57, 60, 64]], F: [41, [57, 60, 65]], Em: [40, [55, 59, 64]] };
  const MEL = {
    C: [76, 79, 84, 79, 76, 74, 72, 74], G: [74, 79, 83, 79, 74, 72, 71, 72],
    Am: [72, 76, 81, 76, 72, 71, 69, 71], F: [69, 72, 77, 72, 69, 67, 65, 67],
  };

  function wavBase64(buf) {
    const ch = buf.numberOfChannels; const len = buf.length;
    const out = new DataView(new ArrayBuffer(44 + len * ch * 2));
    const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); out.setUint32(4, 36 + len * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, SR, true);
    out.setUint32(28, SR * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); str(36, 'data'); out.setUint32(40, len * ch * 2, true);
    const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][i])); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
    const bytes = new Uint8Array(out.buffer); let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  async function render({ duration, cues, sampleBase }) {
    const ctx = new OfflineAudioContext(2, Math.ceil((duration + 0.5) * SR), SR);
    // --- buses: music and effects into a gentle compressor; a shared reverb ---
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.18;
    // then a brick-wall limiter and a gentle soft-clip, so nothing ever clips
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.1;
    const post = ctx.createGain(); post.gain.value = 0.5;
    const soft = ctx.createWaveShaper(); { const c = new Float32Array(2048); for (let i = 0; i < c.length; i++) { const x = (i / (c.length - 1)) * 2 - 1; c[i] = Math.tanh(1.3 * x) / Math.tanh(1.3); } soft.curve = c; soft.oversample = '2x'; }
    const master = ctx.createGain(); master.gain.value = 0.95; master.connect(comp); comp.connect(lim); lim.connect(post); post.connect(soft); soft.connect(ctx.destination);
    // fade the very end
    master.gain.setValueAtTime(0.95, duration - 0.9); master.gain.linearRampToValueAtTime(0.0001, duration);
    const music = ctx.createGain(); music.gain.value = 0.62; music.connect(master);
    const fx = ctx.createGain(); fx.gain.value = 0.9; fx.connect(master);
    const verb = ctx.createConvolver();
    { const len = Math.floor(SR * 2.4); const b = ctx.createBuffer(2, len, SR); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); } verb.buffer = b; }
    const verbOut = ctx.createGain(); verbOut.gain.value = 0.32; verb.connect(verbOut); verbOut.connect(master);
    const send = (node, amt) => { const g = ctx.createGain(); g.gain.value = amt; node.connect(g); g.connect(verb); };
    const noise = ctx.createBuffer(1, SR * 2, SR); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

    // --- samples ---
    const S = {};
    await Promise.all(SAMPLES.map(async (n) => {
      try { const r = await fetch(`${sampleBase}${n}.mp3`); S[n] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) { console.warn('sample', n, e); }
    }));
    const samp = (n, t, gain = 1, rate = 1, dest = fx, verbAmt = 0.15) => {
      if (!S[n]) return; const src = ctx.createBufferSource(); src.buffer = S[n]; src.playbackRate.value = rate;
      const g = ctx.createGain(); g.gain.value = gain; src.connect(g); g.connect(dest); send(g, verbAmt); src.start(Math.max(0, t));
    };

    // --- helpers ---
    const gainEnv = (t, a, peak, d, dest) => { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); g.connect(dest); return g; };
    const osc = (type, f, t, len, dest) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(dest); o.start(t); o.stop(t + len + 0.05); return o; };
    const noiseSrc = (t, len, dest, rate = 1) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.playbackRate.value = rate; s.connect(dest); s.start(t, Math.random()); s.stop(t + len + 0.05); return s; };
    const filt = (type, f, q, dest) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };

    // --- instruments ---
    function pluck(t, m, len = 0.3, vel = 0.22, dest = music, bright = 3200) {
      const g = gainEnv(t, 0.005, vel, len, dest); send(g, 0.18);
      const lp = filt('lowpass', bright, 1.5, g); lp.frequency.setValueAtTime(bright, t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, bright * 0.25), t + len);
      osc('triangle', mtof(m), t, len, lp);
      const g2 = ctx.createGain(); g2.gain.value = 0.12; g2.connect(lp); osc('square', mtof(m) * 2, t, len, g2);
    }
    function marimba(t, m, vel = 0.25, dest = music) {
      const g = gainEnv(t, 0.003, vel, 0.45, dest); send(g, 0.25); osc('sine', mtof(m), t, 0.5, g);
      const g2 = gainEnv(t, 0.002, vel * 0.35, 0.08, dest); osc('sine', mtof(m) * 4, t, 0.1, g2);
    }
    function bell(t, m, vel = 0.2, len = 1.6, dest = music) {
      [[1, 1, 1], [2, 0.4, 0.6], [3.01, 0.22, 0.4], [4.2, 0.12, 0.25]].forEach(([r, a, d]) => { const g = gainEnv(t, 0.003, vel * a, len * d, dest); send(g, 0.35); osc('sine', mtof(m) * r, t, len * d, g); });
    }
    function bass(t, m, len = 0.22, vel = 0.34, cutoff = 600) {
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.008); g.gain.setValueAtTime(vel, t + len * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + len); g.connect(music);
      const lp = filt('lowpass', cutoff, 2, g); osc('sine', mtof(m), t, len, lp); const g2 = ctx.createGain(); g2.gain.value = 0.35; g2.connect(lp); osc('sawtooth', mtof(m), t, len, g2);
    }
    function pad(t0, t1, notes, vel = 0.05, cutoff = 1400) {
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vel, t0 + 0.25); g.gain.setValueAtTime(vel, Math.max(t0 + 0.26, t1 - 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.3); g.connect(music); send(g, 0.5);
      const lp = filt('lowpass', cutoff, 0.7, g);
      notes.forEach((m) => [-7, 7].forEach((c) => { const o = osc('sawtooth', mtof(m), t0, t1 - t0 + 0.35, lp); o.detune.value = c; }));
    }
    function kick(t, vel = 0.9, dest = music) {
      const g = ctx.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38); g.connect(dest);
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13); o.connect(g); o.start(t); o.stop(t + 0.4);
      const c = gainEnv(t, 0.001, vel * 0.3, 0.012, dest); noiseSrc(t, 0.02, filt('highpass', 3000, 0.7, c));
    }
    function clap(t, vel = 0.3, dest = music) {
      const g = ctx.createGain(); g.connect(dest); send(g, 0.3);
      [0, 0.011, 0.022].forEach((d, k) => { g.gain.setValueAtTime(vel, t + d); g.gain.exponentialRampToValueAtTime(vel * (k < 2 ? 0.3 : 0.0001), t + d + (k < 2 ? 0.01 : 0.16)); });
      noiseSrc(t, 0.2, filt('bandpass', 1500, 1.1, g));
    }
    function hat(t, vel = 0.07, len = 0.04, dest = music) { const g = gainEnv(t, 0.001, vel, len, dest); noiseSrc(t, len + 0.02, filt('highpass', 7500, 0.7, g)); }
    function shaker(t, vel = 0.04) { const g = gainEnv(t, 0.012, vel, 0.05, music); noiseSrc(t, 0.08, filt('bandpass', 6000, 1.2, g)); }
    function snare(t, vel = 0.25) { const g = gainEnv(t, 0.001, vel, 0.14, music); send(g, 0.2); noiseSrc(t, 0.16, filt('bandpass', 2000, 0.8, g)); const g2 = gainEnv(t, 0.001, vel * 0.6, 0.08, music); osc('triangle', 190, t, 0.1, g2); }
    function crash(t, vel = 0.22) { const g = gainEnv(t, 0.002, vel, 1.6, fx); send(g, 0.4); noiseSrc(t, 1.7, filt('highpass', 4200, 0.5, g)); }
    function woodblock(t, vel = 0.2, f = 1050) { const g = gainEnv(t, 0.001, vel, 0.07, music); send(g, 0.2); osc('sine', f, t, 0.08, g); }
    function whoosh(t, len = 0.4, dir = 1, vel = 0.3) {
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + len * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + len); g.connect(fx); send(g, 0.25);
      const bp = filt('bandpass', 800, 1.4, g); const [a, b] = dir > 0 ? [400, 4200] : [4200, 300];
      bp.frequency.setValueAtTime(a, t); bp.frequency.exponentialRampToValueAtTime(b, t + len); noiseSrc(t, len, bp);
    }
    function riser(t, len) {
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + len); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05); g.connect(fx); send(g, 0.3);
      const bp = filt('bandpass', 300, 2.5, g); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + len); noiseSrc(t, len, bp);
      const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.05, t + len); g2.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05); g2.connect(fx);
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(880, t + len); o.connect(filt('lowpass', 2000, 1, g2)); o.start(t); o.stop(t + len + 0.1);
    }
    function boom(t, soft = false) {
      const v = soft ? 0.5 : 1;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.9 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2); g.connect(fx); send(g, 0.5);
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.4); o.connect(g); o.start(t); o.stop(t + 2.3);
      const n = gainEnv(t, 0.002, 0.5 * v, 0.9, fx); send(n, 0.6); noiseSrc(t, 1, filt('lowpass', 420, 0.8, n));
    }
    function roar(t) {
      // a big but friendly dragon rumble: two detuned saws sweeping up then down, with a growl
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.15); g.gain.setValueAtTime(0.5, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); g.connect(fx); send(g, 0.45);
      const lp = filt('lowpass', 700, 4, g); lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1500, t + 0.45); lp.frequency.exponentialRampToValueAtTime(350, t + 1.5);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 27; const lg = ctx.createGain(); lg.gain.value = 18; lfo.connect(lg); lfo.start(t); lfo.stop(t + 1.6);
      [[92, -9], [92, 9], [46, 0]].forEach(([f, dt]) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.detune.value = dt * 10; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.7, t + 0.4); o.frequency.exponentialRampToValueAtTime(f * 0.8, t + 1.5); lg.connect(o.frequency); o.connect(lp); o.start(t); o.stop(t + 1.6); });
      const n = ctx.createGain(); n.gain.setValueAtTime(0.0001, t); n.gain.exponentialRampToValueAtTime(0.25, t + 0.2); n.gain.exponentialRampToValueAtTime(0.0001, t + 1.3); n.connect(fx); noiseSrc(t, 1.4, filt('bandpass', 600, 1.5, n));
    }
    function ding(t) { bell(t, 88, 0.3, 1.8, fx); bell(t + 0.28, 84, 0.26, 2.0, fx); }
    function squeak(t) { [0, 0.11].forEach((d) => { const g = gainEnv(t + d, 0.004, 0.16, 0.07, fx); const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(1500, t + d); o.frequency.exponentialRampToValueAtTime(2700, t + d + 0.07); o.connect(g); o.start(t + d); o.stop(t + d + 0.1); }); }
    function pop(t, pitch = 1) { samp('pluck', t, 0.55, pitch * 1.1); const g = gainEnv(t, 0.002, 0.14, 0.09, fx); const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(500 * pitch, t); o.frequency.exponentialRampToValueAtTime(1300 * pitch, t + 0.06); o.connect(g); o.start(t); o.stop(t + 0.12); }
    function slam(t) { kick(t, 1, fx); clap(t, 0.35, fx); const g = gainEnv(t, 0.002, 0.3, 0.3, fx); noiseSrc(t, 0.35, filt('lowpass', 900, 0.8, g)); }
    function stamp(t) { kick(t, 0.8, fx); samp('drop', t, 0.8, 0.8); samp('pluck2', t + 0.02, 0.4, 1.4); }
    function chaching(t) { samp('coins_big', t, 0.9, 1); bell(t + 0.06, 96, 0.14, 0.8, fx); bell(t + 0.14, 100, 0.12, 0.9, fx); }

    // --- the tune ---
    const ON = (t0, t1, step, fn) => { for (let t = t0; t < t1 - 1e-6; t += step) fn(t); };
    function groove(t0, t1, chords, { melody = true, octave = 0, stabs = true, full = true } = {}) {
      // chords: one per bar (2 s) unless given as [name, seconds] pairs
      let t = t0;
      for (const item of chords) {
        const [name, len] = Array.isArray(item) ? item : [item, 2];
        const end = Math.min(t1, t + len); const [root, triad] = CH[name];
        pad(t, end, triad.map((m) => m + 12), full ? 0.035 : 0.03);
        ON(t, end, 0.25, (s) => bass(s, root + ((Math.round((s - t) / 0.25) % 2) ? 12 : 0), 0.2, 0.3));
        if (melody) MEL[name].forEach((m, k) => { const s = t + k * 0.25; if (s < end) pluck(s, m + octave, 0.28, k % 2 ? 0.14 : 0.2); });
        if (stabs) ON(t + 0.25, end, 0.5, (s) => triad.forEach((m) => pluck(s, m + 12, 0.14, 0.05, music, 2200)));
        t = end; if (t >= t1) break;
      }
      ON(t0, t1, 0.5, (s) => kick(s, full ? 0.85 : 0.6));
      ON(t0 + 0.5, t1, 1, (s) => clap(s, full ? 0.26 : 0.18));
      ON(t0 + 0.25, t1, 0.5, (s) => hat(s, 0.06));
      ON(t0, t1, 0.125, (s) => shaker(s, 0.025));
    }
    // 0-2: a music box over a soft chord (the taps play the tune)
    pad(0, 2, [60, 64, 67], 0.034, 1100);
    bell(0.0, 84, 0.12, 1.2); bell(0.25, 79, 0.08, 0.9);
    ON(0.25, 2, 0.25, (s) => shaker(s, 0.03)); ON(0.5, 2, 0.5, (s) => clap(s, 0.12)); ON(0.5, 2, 0.5, (s) => bass(s, 48, 0.3, 0.22, 500));
    [0.75, 1.25, 1.75].forEach((s, k) => pluck(s, [79, 84, 86][k], 0.2, 0.1));
    // 2-11: the main groove, bright and bouncy
    groove(2, 11, ['C', 'G', 'Am', 'F', 'C']);
    // 11-14: underground: half-time, marimba, darker chords
    pad(11, 14, [57, 60, 64], 0.04, 700);
    [[11, 45], [12, 41], [13, 43]].forEach(([t, r]) => { bass(t, r, 0.9, 0.34, 400); bass(t + 0.75, r + 12, 0.2, 0.2, 400); });
    ON(11, 14, 1, (s) => kick(s, 0.7)); ON(11.5, 14, 1, (s) => clap(s, 0.16));
    ON(11, 14, 0.125, (s) => shaker(s, 0.02));
    [69, 72, 76, 72, 65, 69, 72, 69, 67, 71, 74, 71].forEach((m, k) => marimba(11 + k * 0.25, m, 0.2));
    [81, 79, 76, 72].forEach((m, k) => marimba(13 + k * 0.25, m, 0.16));
    // 14-16: the lift: light groove, woodblocks
    groove(14, 16, ['C'], { melody: false, full: false });
    ON(14.25, 15, 0.5, (s) => woodblock(s, 0.12, 1250));
    [72, 76, 79, 84].forEach((m, k) => marimba(15 + k * 0.25, m, 0.18));
    // 16-19: Mole City: the full groove again
    groove(16, 19, ['C', ['G', 1]], { octave: 0 });
    ON(16.75, 19, 1, (s) => woodblock(s, 0.1, 900));
    // 19-21: build-up: pedal bass, pad swell, snare roll, kicks getting louder
    pad(19, 21, [57, 60, 65], 0.05, 1100); pad(20, 21, [59, 62, 67], 0.05, 1600);
    ON(19, 21, 0.5, (s) => kick(s, 0.5 + (s - 19) * 0.2));
    ON(19, 21, 0.25, (s) => bass(s, 43, 0.18, 0.26));
    { let s = 19; while (s < 20.98) { const k = (s - 19) / 2; snare(s, 0.06 + k * 0.2); s += k < 0.5 ? 0.25 : k < 0.8 ? 0.125 : 0.0625; } }
    // 21-22: the door opens: a low drone under the boom and the roar
    pad(21.1, 22, [36, 43, 48], 0.05, 500);
    // 22-27: finale: the tune an octave up, faster chords
    groove(22, 27, [['C', 1], ['G', 1], ['Am', 1], ['F', 1], ['C', 1]], { octave: 12 });
    crash(26, 0.18);
    // 27-30: end card: big final chord, sparkling arpeggio, soft beat
    pad(27, 29.6, [60, 64, 67, 72], 0.05, 2000); bass(27, 36, 1.6, 0.36, 500);
    bell(27, 72, 0.18, 2.6); bell(27, 76, 0.14, 2.6); bell(27, 79, 0.12, 2.6);
    [72, 76, 79, 84, 88, 91, 96, 91, 88, 84, 88, 91].forEach((m, k) => pluck(27.25 + k * 0.125, m, 0.22, 0.11, music, 4200));
    ON(27, 29, 0.5, (s) => kick(s, 0.55)); ON(27.5, 29, 1, (s) => clap(s, 0.16)); ON(27, 29, 0.125, (s) => shaker(s, 0.02));
    [84, 88, 91, 96].forEach((m, k) => bell(28.4 + k * 0.12, m, 0.08, 1.2));

    // --- sound effects on the cues ---
    const floorNotes = [72, 74, 76, 77, 79, 81, 83, 84, 86];
    for (const c of cues) {
      const t = c.t;
      switch (c.type) {
        case 'tap': samp('tap', t, 1.0, 1.1); bell(t, c.note, 0.26, 1.4, fx); break;
        case 'coins': samp(c.big ? 'coins_big' : 'coins_small', t, c.big ? 0.8 : 0.6, 1); break;
        case 'pop': pop(t, c.pitch || 1); break;
        case 'slam': slam(t); break;
        case 'crash': crash(t); break;
        case 'floor': samp('hammer', t, 0.6, 1.05); pluck(t, floorNotes[c.n], 0.35, 0.2, fx, 4000); samp('pluck', t + 0.03, 0.35, 1 + c.n * 0.06); break;
        case 'whoosh': whoosh(t, c.dur || 0.4, c.dir || 1, c.soft ? 0.12 : 0.28); break;
        case 'stamp': stamp(t); break;
        case 'chaching': chaching(t); break;
        case 'clink': bell(t, 96, 0.16, 0.5, fx); bell(t + 0.07, 100, 0.12, 0.5, fx); break;
        case 'party': clap(t, 0.3, fx); clap(t + 0.08, 0.25, fx); clap(t + 0.16, 0.22, fx); pluck(t, 84, 0.25, 0.18, fx); pluck(t + 0.08, 88, 0.25, 0.16, fx); break;
        case 'clunk': samp('hammer', t, 0.8, 0.7); samp('page_flip', t + 0.1, 0.6, 1); break;
        case 'growl': { const g = gainEnv(t, 0.05, 0.25, 0.4, fx); const o = osc('sawtooth', 70, t, 0.45, filt('lowpass', 500, 3, g)); o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(110, t + 0.2); break; }
        case 'womp': { const g = ctx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); g.connect(fx); const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.7); o.connect(filt('lowpass', 400, 6, g)); o.start(t); o.stop(t + 0.85); break; }
        case 'dig': samp('drop', t, 0.7, 0.9 + Math.random() * 0.2); samp('hammer', t + 0.02, 0.25, 0.6); break;
        case 'sparkle': samp('sparkle', t, 0.6, 1); break;
        case 'chime': samp('confirm_big', t, 0.7, 1); break;
        case 'levelup': samp('confirm_big', t, 0.7, 1.05); bell(t + 0.05, 91, 0.12, 0.8, fx); break;
        case 'ding': ding(t); break;
        case 'lock': samp('tick', t, 0.8, 1 + c.n * 0.09); bell(t, 72 + [0, 2, 4, 5, 7, 9, 11, 12][c.n], 0.09, 0.6, fx); break;
        case 'heart': kick(t, 0.5, fx); kick(t + 0.16, 0.35, fx); break;
        case 'riser': riser(t, c.dur || 2); break;
        case 'boom': boom(t, !!c.soft); if (!c.soft) crash(t, 0.2); break;
        case 'door': samp('door', t + 0.05, 0.9, 0.6); samp('book_open', t + 0.3, 0.6, 0.7); break;
        case 'roar': roar(t); break;
        case 'squeak': squeak(t); break;
        case 'button': pop(t, 1.3); samp('confirm_big', t + 0.05, 0.4, 1.2); break;
        default: break;
      }
    }
    const buf = await ctx.startRendering();
    return wavBase64(buf);
  }
  return { render };
})();
