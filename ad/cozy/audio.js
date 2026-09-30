// The cozy ad's soundtrack: an original music-box waltz (F major, 72 BPM, 3/4), soft sound effects
// for each shot, and the narration, with the music dipping under the voice. Rendered offline with
// the Web Audio API and returned as a WAV (base64).
window.AdAudio = (() => {
  const SR = 48000;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const BEAT = 60 / 72; const BAR = BEAT * 3;
  const SAMPLES = ['page_flip', 'book_close', 'book_open', 'pluck', 'sparkle', 'confirm'];
  const CH = { F: [41, [65, 69, 72]], C: [36, [64, 67, 72]], Dm: [38, [62, 65, 69]], Bb: [34, [62, 65, 70]], Gm: [43, [62, 67, 70]] };
  const BARS = ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'F', 'Gm', 'Dm', 'C', 'F'];
  // the lullaby: [midi, beats] per bar
  const TUNE = {
    1: [[69, 1.5], [70, 0.5], [72, 1]], 2: [[67, 2], [64, 1]], 3: [[65, 1.5], [67, 0.5], [69, 1]], 4: [[74, 2], [72, 1]],
    5: [[69, 1.5], [70, 0.5], [72, 1]], 6: [[76, 1.5], [74, 0.5], [72, 1]], 7: [[74, 1], [72, 1], [70, 1]], 8: [[69, 3]],
    g: [[70, 1.5], [69, 0.5], [67, 1]],
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

  async function render({ duration, cues, sampleBase, voice, narration, voiceBase }) {
    const ctx = new OfflineAudioContext(2, Math.ceil((duration + 0.5) * SR), SR);
    // --- mixing: music (ducked under the voice), effects, narration -> compressor -> limiter ---
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 2.5; comp.attack.value = 0.01; comp.release.value = 0.25;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.1;
    const master = ctx.createGain(); master.gain.value = 0.9; master.gain.setValueAtTime(0.9, duration - 1.2); master.gain.linearRampToValueAtTime(0.0001, duration);
    master.connect(comp); comp.connect(lim); lim.connect(ctx.destination);
    const music = ctx.createGain(); music.gain.value = 0.5; music.connect(master);
    const fx = ctx.createGain(); fx.gain.value = 0.7; fx.connect(master);
    const vox = ctx.createGain(); vox.gain.value = 1.0; vox.connect(master);
    const verb = ctx.createConvolver();
    { const len = Math.floor(SR * 3); const b = ctx.createBuffer(2, len, SR); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); } verb.buffer = b; }
    const verbOut = ctx.createGain(); verbOut.gain.value = 0.4; verb.connect(verbOut); verbOut.connect(master);
    const send = (node, amt) => { const g = ctx.createGain(); g.gain.value = amt; node.connect(g); g.connect(verb); };
    const noise = ctx.createBuffer(1, SR * 2, SR); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

    const S = {};
    await Promise.all(SAMPLES.map(async (n) => { try { S[n] = await ctx.decodeAudioData(await (await fetch(`${sampleBase}${n}.mp3`)).arrayBuffer()); } catch (e) { console.warn(n, e); } }));
    const samp = (n, t, gain = 1, rate = 1, dest = fx, v = 0.2) => { if (!S[n]) return; const s = ctx.createBufferSource(); s.buffer = S[n]; s.playbackRate.value = rate; const g = ctx.createGain(); g.gain.value = gain; s.connect(g); g.connect(dest); send(g, v); s.start(Math.max(0, t)); };
    const gainEnv = (t, a, peak, d, dest) => { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); g.connect(dest); return g; };
    const osc = (type, f, t, len, dest) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(dest); o.start(t); o.stop(t + len + 0.05); return o; };
    const noiseSrc = (t, len, dest) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.connect(dest); s.start(t, Math.random()); s.stop(t + len + 0.05); return s; };
    const filt = (type, f, q, dest) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };

    // --- instruments ---
    function musicBox(t, m, vel = 0.14, len = 2.2, dest = music) {
      [[1, 1, 1], [2, 0.3, 0.5], [3.01, 0.12, 0.3], [5.4, 0.05, 0.15]].forEach(([r, a, d]) => { const g = gainEnv(t, 0.002, vel * a, len * d, dest); send(g, 0.45); osc('sine', mtof(m) * r, t, len * d, g); });
    }
    function piano(t, m, vel = 0.1, len = 1.6) {
      const g = gainEnv(t, 0.004, vel, len, music); send(g, 0.35);
      const lp = filt('lowpass', 2400, 0.7, g); lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(700, t + len);
      osc('triangle', mtof(m), t, len, lp); const g2 = ctx.createGain(); g2.gain.value = 0.25; g2.connect(lp); osc('sine', mtof(m) * 2, t, len, g2);
    }
    function pizz(t, m, vel = 0.22) { const g = gainEnv(t, 0.004, vel, 0.5, music); send(g, 0.25); osc('triangle', mtof(m), t, 0.55, filt('lowpass', 700, 1, g)); const g2 = gainEnv(t, 0.004, vel * 0.5, 0.4, music); osc('sine', mtof(m + 12), t, 0.45, g2); }
    function marimba(t, m, vel = 0.16) { const g = gainEnv(t, 0.003, vel, 0.8, music); send(g, 0.35); osc('sine', mtof(m), t, 0.85, g); const g2 = gainEnv(t, 0.002, vel * 0.3, 0.1, music); osc('sine', mtof(m) * 4, t, 0.12, g2); }
    function pad(t0, t1, notes, vel = 0.03, cutoff = 1200) {
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vel, t0 + 0.6); g.gain.setValueAtTime(vel, Math.max(t0 + 0.61, t1 - 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.6); g.connect(music); send(g, 0.6);
      const lp = filt('lowpass', cutoff, 0.6, g); notes.forEach((m) => [-6, 6].forEach((c) => { const o = osc('sawtooth', mtof(m), t0, t1 - t0 + 0.7, lp); o.detune.value = c; }));
    }
    function bell(t, m, vel = 0.1, len = 3, dest = fx) { [[1, 1, 1], [2.76, 0.35, 0.5], [5.4, 0.12, 0.3], [0.5, 0.25, 0.8]].forEach(([r, a, d]) => { const g = gainEnv(t, 0.003, vel * a, len * d, dest); send(g, 0.5); osc('sine', mtof(m) * r, t, len * d, g); }); }

    // --- the waltz ---
    const tune = (bar, key, shift, voiceFn) => { let b = 0; for (const [m, len] of TUNE[key]) { voiceFn(bar * BAR + b * BEAT, m + shift, len); b += len; } };
    BARS.forEach((name, bar) => {
      const t = bar * BAR; const [root, triad] = CH[name];
      const under = bar === 8 || bar === 9;
      pad(t, t + BAR, triad, bar < 2 ? 0.022 : under ? 0.034 : 0.028, under ? 700 : 1300);
      if (bar >= 2 && bar <= 10) { pizz(t, root + 12, under ? 0.16 : 0.2); triad.forEach((m) => { piano(t + BEAT, m, 0.045); piano(t + 2 * BEAT, m, 0.04); }); }
      if (bar >= 4 && bar <= 7) [1, 2].forEach((b) => musicBox(t + b * BEAT + BEAT * 0.5, triad[(bar + b) % 3] + 24, 0.035, 1.2));
      if (bar === 7) [0, 1, 2].forEach((b) => bell(t + b * BEAT, 96 + (b % 2) * 4, 0.02, 0.6));
    });
    [1, 2, 3, 4, 5, 6, 7, 8].forEach((k) => tune(k - 1, k, 12, (s, m, len) => musicBox(s, m, 0.13, 1.4 + len * 0.6)));
    tune(8, 'g', 0, (s, m) => marimba(s, m, 0.14)); tune(9, 3, 0, (s, m) => marimba(s, m, 0.14));
    tune(10, 6, 12, (s, m, len) => musicBox(s, m, 0.12, 1.4 + len * 0.6));
    { const t = 11 * BAR; [65, 69, 72, 77, 81, 84, 89].forEach((m, k) => musicBox(t + k * 0.18, m + 12, 0.1, 2.2)); pad(t, 30, [65, 69, 72, 77], 0.03, 1600); pizz(t, 41, 0.22); }

    // --- sound effects ---
    for (const c of cues) {
      const t = c.t;
      switch (c.type) {
        case 'page': samp('page_flip', t, 0.9, 0.9); { const g = gainEnv(t, 0.15, 0.05, 0.35, fx); const bp = filt('bandpass', 1200, 0.8, g); bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.5); noiseSrc(t, 0.55, bp); } break;
        case 'bird': for (let k = 0; k < 3; k++) { const s = t + k * 0.11 + Math.random() * 0.03; const f = 2600 + Math.random() * 900; const g = gainEnv(s, 0.005, 0.035, 0.07, fx); send(g, 0.4); const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, s); o.frequency.exponentialRampToValueAtTime(f * 1.45, s + 0.04); o.frequency.exponentialRampToValueAtTime(f * 1.1, s + 0.08); o.connect(g); o.start(s); o.stop(s + 0.1); } break;
        case 'fire': { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 0.4); g.gain.setValueAtTime(0.03, t + 2); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6); g.connect(fx); noiseSrc(t, 2.6, filt('lowpass', 420, 0.6, g)); for (let k = 0; k < 14; k++) { const s = t + Math.random() * 2.4; const cg = gainEnv(s, 0.001, 0.03 + Math.random() * 0.03, 0.02, fx); noiseSrc(s, 0.03, filt('highpass', 2500, 0.8, cg)); } break; }
        case 'bubble': samp('pluck', t, 0.45, 1.3); { const g = gainEnv(t, 0.003, 0.07, 0.09, fx); const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(1100, t + 0.07); o.connect(g); o.start(t); o.stop(t + 0.12); } break;
        case 'floor': musicBox(t, [77, 79, 81, 82, 84, 86, 88, 89][c.n] + 12, 0.07, 1.6, fx); samp('sparkle', t, 0.12, 1.2 + c.n * 0.04); break;
        case 'sunny': [93, 96, 101].forEach((m, k) => bell(t + k * 0.09, m, 0.03, 1.4)); break;
        case 'wind': { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9); g.connect(fx); send(g, 0.3); const bp = filt('bandpass', 500, 0.9, g); bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(900, t + 0.8); bp.frequency.exponentialRampToValueAtTime(400, t + 1.9); noiseSrc(t, 1.9, bp); for (let k = 0; k < 10; k++) { const s = t + 0.3 + Math.random() * 1.4; const rg = gainEnv(s, 0.005, 0.02, 0.06, fx); noiseSrc(s, 0.08, filt('highpass', 4000, 0.7, rg)); } break; }
        case 'sleigh': for (let k = 0; k < 16; k++) { const s = t + k * (BEAT / 4) + Math.random() * 0.02; [2900 + Math.random() * 300, 4200 + Math.random() * 400, 6100].forEach((f, j) => { const g = gainEnv(s, 0.001, [0.02, 0.012, 0.006][j] * (k % 4 === 0 ? 1.4 : 1), 0.09, fx); send(g, 0.3); osc('sine', f, s, 0.1, g); }); } break;
        case 'firework': { const w = gainEnv(t, 0.05, 0.02, 0.45, fx); const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1900, t + 0.45); o.connect(w); o.start(t); o.stop(t + 0.5);
          const p = t + 0.5; const b = gainEnv(p, 0.002, 0.14, 0.4, fx); send(b, 0.5); noiseSrc(p, 0.45, filt('lowpass', 900, 0.7, b)); const k2 = gainEnv(p, 0.002, 0.18, 0.25, fx); const ko = ctx.createOscillator(); ko.type = 'sine'; ko.frequency.setValueAtTime(110, p); ko.frequency.exponentialRampToValueAtTime(45, p + 0.2); ko.connect(k2); ko.start(p); ko.stop(p + 0.3);
          for (let k = 0; k < 18; k++) { const s = p + 0.15 + Math.random() * 0.8; const cg = gainEnv(s, 0.001, 0.015 + Math.random() * 0.02, 0.015, fx); noiseSrc(s, 0.02, filt('highpass', 3500, 0.7, cg)); } break; }
        case 'temple': bell(t, 72, 0.08, 4); bell(t + 0.9, 79, 0.05, 3.5); break;
        case 'hum': { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8); g.connect(fx); noiseSrc(t, 1.8, filt('bandpass', 700, 0.6, g)); [0.3, 0.6, 1.1].forEach((d) => { const w = gainEnv(t + d, 0.001, 0.05, 0.06, fx); osc('sine', 950 + d * 200, t + d, 0.07, w); }); break; }
        case 'ding': bell(t, 88, 0.06, 1.8); bell(t + 0.3, 84, 0.05, 2); break;
        case 'snore': { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1); g.connect(fx); noiseSrc(t, 1.15, filt('lowpass', 260, 2, g)); const r = ctx.createGain(); r.gain.setValueAtTime(0.0001, t); r.gain.exponentialRampToValueAtTime(0.08, t + 0.5); r.gain.exponentialRampToValueAtTime(0.0001, t + 1.1); r.connect(fx); osc('sine', 52, t, 1.15, r); break; }
        case 'wake': { const g = gainEnv(t, 0.08, 0.1, 0.5, fx); const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(85, t); o.frequency.linearRampToValueAtTime(128, t + 0.45); o.connect(filt('lowpass', 480, 3, g)); o.start(t); o.stop(t + 0.65); samp('sparkle', t + 0.25, 0.25, 1); break; }
        case 'close': samp('book_close', t, 0.9, 0.85); samp('confirm', t + 0.12, 0.3, 0.9); samp('sparkle', t + 0.2, 0.35, 1); break;
        case 'twinkle': [89, 93, 96, 101].forEach((m, k) => bell(t + k * 0.14, m, 0.025, 1.6)); break;
        default: break;
      }
    }

    // --- narration, with the music dipping under it ---
    for (const [id, start] of voice) {
      const ln = narration[id]; if (!ln) continue;
      try {
        const buf = await ctx.decodeAudioData(await (await fetch(`${voiceBase}${ln.file}`)).arrayBuffer());
        const s = ctx.createBufferSource(); s.buffer = buf; const g = ctx.createGain(); g.gain.value = 0.95;
        const hp = filt('highpass', 90, 0.7, g); s.connect(hp); g.connect(vox); send(g, 0.06); s.start(start);
        const end = start + buf.duration;
        music.gain.setTargetAtTime(0.26, start - 0.25, 0.08); music.gain.setTargetAtTime(0.5, end + 0.1, 0.25);
      } catch (e) { console.warn('narration', id, e); }
    }
    const out = await ctx.startRendering();
    return wavBase64(out);
  }
  return { render };
})();
