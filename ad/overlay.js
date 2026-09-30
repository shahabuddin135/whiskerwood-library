// Motion graphics drawn over the game for the ad: bouncy headlines, stickers, coins, sparkles,
// confetti, a tapping finger, flashes, speed lines, the coin counter and the end card.
// Everything is a pure function of time (no state), so any frame can be rendered on its own.
// Coordinates are in a 1080 x 1920 frame.
window.AdFx = (() => {
  const W = 1080; const H = 1920;
  const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const easeOutBack = (x, s = 2.2) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2));
  const easeOutCubic = (x) => 1 - Math.pow(1 - clamp01(x), 3);
  const easeInOut = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const PAL = { cream: ['#fffdf6', '#ffe6b0'], gold: ['#fff4b8', '#ffb627'], pink: ['#ffe4ef', '#ff7aa8'], mint: ['#f1fff4', '#7fdc9b'], sky: ['#f0fbff', '#7cc6ff'], fire: ['#fff1c4', '#ff7a3d'], lilac: ['#f7efff', '#b99cff'] };

  /* ---------- text ---------- */
  function styled(ctx, str, x, y, size, { fill = PAL.cream, stroke = '#4a2412', shadow = true, maxW = W - 110, weight = 700 } = {}) {
    ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const w = ctx.measureText(str).width; let s = size;
    if (w > maxW) { s = size * (maxW / w); ctx.font = `${weight} ${s}px ${FONT}`; }
    const lw = s * 0.2;
    if (shadow) { ctx.fillStyle = 'rgba(38,16,4,0.45)'; ctx.strokeStyle = 'rgba(38,16,4,0.45)'; ctx.lineWidth = lw; ctx.strokeText(str, x, y + s * 0.1); ctx.fillText(str, x, y + s * 0.1); }
    ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeText(str, x, y);
    const g = ctx.createLinearGradient(0, y - s * 0.45, 0, y + s * 0.45); g.addColorStop(0, fill[0]); g.addColorStop(1, fill[1] || fill[0]);
    ctx.fillStyle = g; ctx.fillText(str, x, y);
    // a glossy highlight across the top of the letters
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - s * 0.6, W, s * 0.42); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillText(str, x, y); ctx.restore();
    return s;
  }
  // A headline that pops (or slams) in at t0 and out at t1. lines: [{ text, size, fill }]
  function headline(ctx, T, t0, t1, lines, { y = 400, slam = false, rot = -0.03, gap = 1.02 } = {}) {
    if (T < t0 || T > t1) return;
    const u = (T - t0) / (slam ? 0.18 : 0.26); const v = clamp01((T - (t1 - 0.14)) / 0.14);
    let sc = slam ? lerp(2.1, 1, easeOutCubic(u)) : easeOutBack(clamp01(u));
    if (slam && u > 1) sc = 1 + 0.06 * Math.exp(-(T - t0 - 0.18) * 14) * Math.sin((T - t0) * 60);
    sc *= 1 + 0.18 * v;
    const a = clamp01(u * 3) * (1 - v);
    if (a <= 0) return;
    let yy = y;
    ctx.save(); ctx.globalAlpha = a;
    lines.forEach((ln, k) => {
      const delay = k * 0.08; const uk = clamp01((T - t0 - delay) / 0.24); const sk = slam ? sc : easeOutBack(uk) * (1 + 0.18 * v);
      if (sk <= 0.01) { yy += ln.size * gap; return; }
      ctx.save(); ctx.translate(W / 2, yy); ctx.rotate(rot + Math.sin(T * 5 + k) * 0.012); ctx.scale(sk, sk);
      styled(ctx, ln.text, 0, 0, ln.size, { fill: ln.fill || PAL.cream });
      ctx.restore();
      yy += ln.size * gap;
    });
    ctx.restore();
  }
  // A tilted badge stuck onto the action.
  function sticker(ctx, T, t0, t1, label, x, y, { fill = '#ff6f91', size = 58, rot = -0.08, icon = null } = {}) {
    if (T < t0 || T > t1) return;
    const u = clamp01((T - t0) / 0.28); const v = clamp01((T - (t1 - 0.14)) / 0.14);
    const sc = easeOutBack(u, 2.6) * (1 - 0.3 * v); if (sc <= 0.01) return;
    ctx.save(); ctx.globalAlpha = 1 - v; ctx.translate(x, y); ctx.rotate(rot + Math.sin(T * 6) * 0.03); ctx.scale(sc, sc);
    ctx.font = `700 ${size}px ${FONT}`; const tw = ctx.measureText(label).width + (icon ? size * 1.1 : 0);
    const bw = tw + size * 0.9; const bh = size * 1.45;
    ctx.fillStyle = 'rgba(38,16,4,0.35)'; roundRect(ctx, -bw / 2, -bh / 2 + 8, bw, bh, bh / 2); ctx.fill();
    ctx.fillStyle = '#fff'; roundRect(ctx, -bw / 2 - 7, -bh / 2 - 7, bw + 14, bh + 14, bh / 2 + 7); ctx.fill();
    ctx.fillStyle = fill; roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; roundRect(ctx, -bw / 2 + 10, -bh / 2 + 6, bw - 20, bh * 0.38, bh * 0.19); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const tx = icon ? size * 0.55 : 0;
    if (icon) { ctx.font = `${size * 0.95}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`; ctx.fillText(icon, -tw / 2 + size * 0.5, 2); ctx.font = `700 ${size}px ${FONT}`; }
    ctx.lineWidth = size * 0.16; ctx.strokeStyle = 'rgba(60,20,10,0.55)'; ctx.strokeText(label, tx, 2); ctx.fillStyle = '#fff'; ctx.fillText(label, tx, 2);
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* ---------- coins, sparkles, confetti ---------- */
  function coin(ctx, x, y, r, spin = 0, a = 1) {
    const sx = Math.max(0.18, Math.abs(Math.cos(spin)));
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sx, 1);
    ctx.fillStyle = '#a8651a'; ctx.beginPath(); ctx.arc(0, r * 0.1, r, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r); g.addColorStop(0, '#fff6c4'); g.addColorStop(0.45, '#ffd257'); g.addColorStop(1, '#e39a1c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(170,100,20,0.55)'; ctx.lineWidth = r * 0.13; ctx.beginPath(); ctx.arc(0, 0, r * 0.68, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(170,100,20,0.6)'; ctx.font = `700 ${r * 0.95}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('¢', 0, r * 0.05);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(-r * 0.36, -r * 0.42, r * 0.24, r * 0.12, -0.6, 0, 7); ctx.fill();
    ctx.restore();
  }
  // Coins bursting up and out from a point, falling back with gravity.
  function coinBurst(ctx, T, t0, x, y, n, seed, { speed = 1300, spread = 2.2, life = 1.1, r = 26 } = {}) {
    const dt = T - t0; if (dt < 0 || dt > life + 0.4) return;
    const R = rng(seed);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (R() - 0.5) * spread; const sp = speed * (0.55 + R() * 0.6); const lf = life * (0.75 + R() * 0.4);
      const rr = r * (0.75 + R() * 0.5); const s0 = R() * 6; const ws = 7 + R() * 8;
      if (dt > lf) continue;
      const px = x + Math.cos(ang) * sp * dt; const py = y + Math.sin(ang) * sp * dt + 0.5 * 2900 * dt * dt;
      coin(ctx, px, py, rr, s0 + dt * ws, 1 - clamp01((dt - lf + 0.2) / 0.2));
    }
  }
  // Coins flying from a point into the counter at the top.
  function coinFly(ctx, T, t0, x0, y0, x1, y1, n, seed) {
    const R = rng(seed);
    for (let i = 0; i < n; i++) {
      const st = t0 + i * 0.035; const dur = 0.55 + R() * 0.15; const side = (R() - 0.5) * 520; const sp = R() * 6;
      const u = (T - st) / dur; if (u < 0 || u > 1) continue;
      const e = u * u; const cx = (x0 + x1) / 2 + side; const cy = Math.min(y0, y1) - 60 + R() * 200;
      const px = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * cx + e * e * x1; const py = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * cy + e * e * y1;
      coin(ctx, px, py, 24 * (1 - 0.4 * e), sp + u * 12, 1);
    }
  }
  // Coins raining down over the whole frame.
  function coinRain(ctx, T, t0, t1, n, seed) {
    if (T < t0 || T > t1 + 1.6) return;
    const R = rng(seed);
    for (let i = 0; i < n; i++) {
      const st = t0 + R() * (t1 - t0); const x = 40 + R() * (W - 80); const vy = 900 + R() * 700; const r = 20 + R() * 16; const sp = R() * 6; const ws = 6 + R() * 6; const drift = (R() - 0.5) * 120;
      const dt = T - st; if (dt < 0) continue; const y = -60 + vy * dt + 400 * dt * dt; if (y > H + 60) continue;
      coin(ctx, x + drift * dt, y, r, sp + dt * ws, 1);
    }
  }
  function star4(ctx, x, y, r, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; const rr = k % 2 ? r * 0.28 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function sparkles(ctx, T, t0, x, y, n, seed, { color = '#fff6c9', spread = 260, life = 0.9, size = 26 } = {}) {
    const dt = T - t0; if (dt < 0 || dt > life + 0.3) return;
    const R = rng(seed);
    ctx.save(); ctx.fillStyle = color; ctx.shadowColor = 'rgba(255,230,140,0.9)'; ctx.shadowBlur = 18;
    for (let i = 0; i < n; i++) {
      const ang = R() * Math.PI * 2; const d = spread * (0.3 + R() * 0.7); const lf = life * (0.6 + R() * 0.5); const s = size * (0.5 + R());
      if (dt > lf) continue; const u = dt / lf; const e = easeOutCubic(u);
      ctx.globalAlpha = Math.sin(u * Math.PI); star4(ctx, x + Math.cos(ang) * d * e, y + Math.sin(ang) * d * e, s * (1 - 0.4 * u), u * 2);
    }
    ctx.restore();
  }
  const CONF = ['#ff6f91', '#ffd257', '#7cc6ff', '#7fdc9b', '#b99cff', '#ff9f43'];
  function confetti(ctx, T, t0, x, y, n, seed, { spread = 900, life = 1.6 } = {}) {
    const dt = T - t0; if (dt < 0 || dt > life) return;
    const R = rng(seed);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (R() - 0.5) * 2.6; const sp = spread * (0.4 + R() * 0.8); const lf = life * (0.6 + R() * 0.4);
      if (dt > lf) continue;
      const k = 1 - Math.exp(-dt * 2.2); const px = x + Math.cos(ang) * sp * k / 2.2 + Math.sin(dt * 6 + i) * 18; const py = y + Math.sin(ang) * sp * k / 2.2 + 260 * dt * dt;
      ctx.save(); ctx.globalAlpha = 1 - clamp01((dt - lf + 0.3) / 0.3); ctx.translate(px, py); ctx.rotate(dt * (4 + R() * 8)); ctx.scale(1, Math.cos(dt * (6 + R() * 6)));
      ctx.fillStyle = CONF[i % CONF.length]; ctx.fillRect(-9, -5, 18, 10); ctx.restore();
    }
  }
  // A puff of dust (for buildings popping up and digging).
  function dust(ctx, T, t0, x, y, seed, { n = 12, spread = 220, col = '230,210,180' } = {}) {
    const dt = T - t0; if (dt < 0 || dt > 0.8) return;
    const R = rng(seed);
    for (let i = 0; i < n; i++) {
      const ang = Math.PI + R() * Math.PI; const d = spread * (0.4 + R() * 0.6) * easeOutCubic(dt / 0.8); const r = 26 + R() * 30;
      ctx.fillStyle = `rgba(${col},${0.7 * (1 - dt / 0.8)})`; ctx.beginPath(); ctx.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d * 0.35 - dt * 40, r * (0.6 + dt), 0, 7); ctx.fill();
    }
  }

  /* ---------- the tapping finger ---------- */
  function hand(ctx, x, y, s = 1, press = 0, a = 1) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(-0.42); ctx.scale(s * (1 - 0.1 * press), s * (1 - 0.1 * press));
    ctx.lineJoin = 'round'; ctx.lineWidth = 9; ctx.strokeStyle = '#4a2412';
    ctx.fillStyle = 'rgba(38,16,4,0.3)'; roundRect(ctx, -28, 18, 56, 150, 28); ctx.fill(); roundRect(ctx, -70, 108, 150, 130, 50); ctx.fill();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, -26, 0, 52, 150, 26); ctx.fill(); ctx.stroke();
    roundRect(ctx, -72, 92, 146, 136, 52); ctx.fill(); ctx.stroke();
    [[-60, 104], [-8, 100], [40, 108]].forEach(([fx, fy], k) => { roundRect(ctx, fx, fy + (k === 1 ? 4 : 0), 44, 64, 22); ctx.fill(); ctx.stroke(); });
    roundRect(ctx, -24, 2, 48, 120, 24); ctx.fill();
    ctx.fillStyle = '#ffd2c2'; ctx.beginPath(); ctx.ellipse(0, 20, 14, 10, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function ripple(ctx, T, t0, x, y, { col = '255,255,255', r0 = 20, r1 = 170, life = 0.45 } = {}) {
    const u = (T - t0) / life; if (u < 0 || u > 1) return;
    ctx.save(); ctx.strokeStyle = `rgba(${col},${1 - u})`; ctx.lineWidth = 14 * (1 - u) + 2; ctx.beginPath(); ctx.arc(x, y, lerp(r0, r1, easeOutCubic(u)), 0, 7); ctx.stroke(); ctx.restore();
  }

  /* ---------- screen effects ---------- */
  function flash(ctx, T, t0, dur = 0.25, col = '255,255,255', peak = 0.85) {
    const u = (T - t0) / dur; if (u < 0 || u > 1) return;
    ctx.fillStyle = `rgba(${col},${peak * (1 - u) * (1 - u)})`; ctx.fillRect(0, 0, W, H);
  }
  function speedLines(ctx, T, t0, t1, seed, { dir = -1, n = 26, strength = 1 } = {}) {
    if (T < t0 || T > t1) return;
    const a = Math.min(1, (T - t0) / 0.15, (t1 - T) / 0.15) * strength; const R = rng(seed);
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = R() * W; const len = 260 + R() * 560; const sp = 3200 + R() * 2600; const w = 3 + R() * 6; const off = R() * (H + len);
      const y = ((off + dir * -1 * sp * (T - t0)) % (H + len) + (H + len)) % (H + len) - len;
      const g = ctx.createLinearGradient(0, y, 0, y + len); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.55 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
    }
    ctx.restore();
  }
  function vignette(ctx, k = 0.35) {
    const g = ctx.createRadialGradient(W / 2, H * 0.52, H * 0.28, W / 2, H * 0.52, H * 0.78);
    g.addColorStop(0, 'rgba(20,8,4,0)'); g.addColorStop(1, `rgba(20,8,4,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function topShade(ctx, a) {
    if (a <= 0) return; const g = ctx.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, `rgba(24,10,4,${0.55 * a})`); g.addColorStop(1, 'rgba(24,10,4,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 760);
  }

  /* ---------- the coin counter ---------- */
  const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  function fmt(n) {
    if (n < 1000) return String(Math.floor(n));
    let k = 0; while (n >= 1000 && k < SUFFIX.length - 1) { n /= 1000; k++; }
    return `${n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)}${SUFFIX[k]}`;
  }
  function counter(ctx, T, value, bump = 0, a = 1) {
    if (a <= 0) return;
    const x = W / 2; const y = 150; const sc = 1 + 0.16 * bump;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(sc, sc);
    const bw = 560; const bh = 124;
    ctx.fillStyle = 'rgba(38,16,4,0.35)'; roundRect(ctx, -bw / 2, -bh / 2 + 10, bw, bh, bh / 2); ctx.fill();
    ctx.fillStyle = '#6b3d1e'; roundRect(ctx, -bw / 2 - 8, -bh / 2 - 8, bw + 16, bh + 16, bh / 2 + 8); ctx.fill();
    const g = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2); g.addColorStop(0, '#fff8e6'); g.addColorStop(1, '#f6d9a3');
    ctx.fillStyle = g; roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
    if (bump > 0.05) { ctx.save(); ctx.shadowColor = 'rgba(255,210,90,0.9)'; ctx.shadowBlur = 40 * bump; ctx.strokeStyle = `rgba(255,210,90,${bump})`; ctx.lineWidth = 8; roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.stroke(); ctx.restore(); }
    coin(ctx, -bw / 2 + 64, 0, 44, Math.sin(T * 3) * 0.6);
    styled(ctx, fmt(value), 40, 4, 76, { fill: ['#7a4418', '#4a2412'], stroke: '#fff8e6', shadow: false, maxW: bw - 170 });
    ctx.restore();
  }

  /* ---------- end card ---------- */
  function endCard(ctx, T, t0, icon, { title1 = 'Whiskerwood', title2 = 'Library', tagline = 'Grow a cozy mouse city!', cta = 'PLAY FREE', sub = 'on Google Play' } = {}) {
    const dt = T - t0; if (dt < 0) return;
    // dim and warm the world behind
    const dim = clamp01(dt / 0.35);
    const bg = ctx.createRadialGradient(W / 2, H * 0.42, 100, W / 2, H * 0.5, H * 0.75);
    bg.addColorStop(0, `rgba(60,30,70,${0.35 * dim})`); bg.addColorStop(1, `rgba(20,10,30,${0.78 * dim})`); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // rays behind the icon
    ctx.save(); ctx.translate(W / 2, 640); ctx.rotate(dt * 0.25); ctx.globalAlpha = 0.18 * dim;
    for (let k = 0; k < 14; k++) { ctx.rotate(Math.PI / 7); ctx.fillStyle = k % 2 ? '#ffe7a3' : '#ffd0e6'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-70, -900); ctx.lineTo(70, -900); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    coinRain(ctx, T, t0 + 0.2, t0 + 3, 36, 991);
    // the app icon bounces in
    const iu = clamp01((dt - 0.05) / 0.45); const isc = easeOutBack(iu, 2.4);
    if (icon && isc > 0.01) {
      ctx.save(); ctx.translate(W / 2, 640 + Math.sin(T * 2.4) * 10); ctx.rotate(Math.sin(T * 1.7) * 0.03); ctx.scale(isc, isc);
      const s = 380; ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(ctx, -s / 2, -s / 2 + 16, s, s, 86); ctx.fill();
      ctx.fillStyle = '#fff'; roundRect(ctx, -s / 2 - 10, -s / 2 - 10, s + 20, s + 20, 96); ctx.fill();
      ctx.save(); roundRect(ctx, -s / 2, -s / 2, s, s, 86); ctx.clip(); ctx.drawImage(icon, -s / 2, -s / 2, s, s);
      const sh = ((dt * 0.8) % 1.6) - 0.3; const gg = ctx.createLinearGradient(-s + sh * 2 * s, -s, sh * 2 * s, s); gg.addColorStop(0.4, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gg.addColorStop(0.6, 'rgba(255,255,255,0)');
      ctx.fillStyle = gg; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
      ctx.restore();
    }
    sparkles(ctx, T, t0 + 0.2, W / 2, 640, 18, 71, { spread: 330, life: 1.1, size: 34 });
    sparkles(ctx, T, t0 + 1.4, W / 2, 640, 14, 72, { spread: 300, life: 1.1, size: 30 });
    // title, tagline and the button
    const title = (t, text, y, size, fill) => { const u = clamp01((dt - t) / 0.3); if (u <= 0) return; ctx.save(); ctx.translate(W / 2, y); ctx.scale(easeOutBack(u, 2.6), easeOutBack(u, 2.6)); ctx.rotate(-0.02 + Math.sin(T * 3 + y) * 0.01); styled(ctx, text, 0, 0, size, { fill }); ctx.restore(); };
    title(0.25, title1, 960, 138, PAL.gold); title(0.45, title2, 1090, 128, PAL.gold);
    title(0.9, tagline, 1225, 62, PAL.cream);
    const bu = clamp01((dt - 1.4) / 0.35);
    if (bu > 0) {
      const pulse = 1 + 0.045 * Math.sin((T - t0 - 1.4) * Math.PI * 4);
      ctx.save(); ctx.translate(W / 2, 1440); ctx.scale(easeOutBack(bu, 2.6) * pulse, easeOutBack(bu, 2.6) * pulse);
      const bw = 640; const bh = 156;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(ctx, -bw / 2, -bh / 2 + 14, bw, bh, bh / 2); ctx.fill();
      ctx.fillStyle = '#fff'; roundRect(ctx, -bw / 2 - 9, -bh / 2 - 9, bw + 18, bh + 18, bh / 2 + 9); ctx.fill();
      const g = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2); g.addColorStop(0, '#8be07b'); g.addColorStop(1, '#3a9a3f');
      ctx.fillStyle = g; roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
      ctx.save(); roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.clip();
      const sx = (((T - t0) * 1.1) % 1.6 - 0.3) * bw * 1.6 - bw; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(sx, -bh); ctx.lineTo(sx + 60, -bh); ctx.lineTo(sx - 20, bh); ctx.lineTo(sx - 80, bh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; roundRect(ctx, -bw / 2 + 16, -bh / 2 + 10, bw - 32, bh * 0.36, bh * 0.18); ctx.fill();
      ctx.restore();
      styled(ctx, cta, 0, 4, 84, { fill: ['#ffffff', '#f2fff0'], stroke: '#2a6a2a', shadow: false });
      ctx.restore();
      const su = clamp01((dt - 1.7) / 0.3);
      if (su > 0) { ctx.save(); ctx.globalAlpha = su; ctx.translate(W / 2, 1590); styled(ctx, sub, 0, 0, 50, { fill: PAL.cream }); ctx.restore(); }
    }
  }

  return { W, H, PAL, clamp01, lerp, easeOutBack, easeOutCubic, easeInOut, rng, styled, headline, sticker, coin, coinBurst, coinFly, coinRain, sparkles, confetti, dust, hand, ripple, flash, speedLines, vignette, topShade, counter, endCard, fmt };
})();
