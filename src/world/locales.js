// Location scenery: every location has its own sky, horizon, grounds, trees, roof and wall
// fixtures, so a screenshot tells you where you are at a glance.
import { W, BX0, BX1, GROUND_H, ROOF_H } from './layout.js';
import { rr, fillRR, ell, circ, shade, rng, star, drawMouse, coinIcon, drawCheese } from './draw.js';
import { drawKeepsake } from './furnitureArt.js';

const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }
const NIGHT = '#1b2447';

/* ================================================================== */
/* Sky extras (screen space)                                           */
/* ================================================================== */
const caveSpecks = (() => { const R = rng(19); return Array.from({ length: 60 }, () => ({ x: R(), y: R(), r: 0.6 + R() * 1.6, p: R() * 6, c: R() < 0.5 ? '125,232,216' : '182,156,240' })); })();
const stalactites = (() => { const R = rng(23); return Array.from({ length: 26 }, (_, k) => ({ x: k / 25 + (R() - 0.5) * 0.03, w: 10 + R() * 22, h: 30 + R() * 90 })); })();

export function drawCaveSky(ctx, v, tod) {
  const g = ctx.createLinearGradient(0, 0, 0, v.H);
  g.addColorStop(0, '#0e0a18'); g.addColorStop(0.55, '#1d1630'); g.addColorStop(1, '#2c2345');
  ctx.fillStyle = g; ctx.fillRect(0, 0, v.W, v.H);
  // a crack in the cavern roof lets the outside light in (sun by day, moon by night)
  const lightA = 0.16 + (1 - tod.dark) * 0.14;
  const lc = tod.dark > 0.4 ? '170,190,255' : '255,236,190';
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const sx = v.W * 0.3;
  const lg = ctx.createLinearGradient(sx, 0, sx + v.W * 0.2, v.H);
  lg.addColorStop(0, `rgba(${lc},${lightA})`); lg.addColorStop(1, `rgba(${lc},0)`);
  ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(sx - 20, 0); ctx.lineTo(sx + 30, 0); ctx.lineTo(sx + v.W * 0.38, v.H); ctx.lineTo(sx + v.W * 0.02, v.H); ctx.closePath(); ctx.fill();
  for (const s of caveSpecks) {
    const a = 0.25 + 0.55 * Math.max(0, Math.sin(v.t * 1.3 + s.p));
    ctx.fillStyle = `rgba(${s.c},${a})`; ctx.beginPath(); ctx.arc(s.x * v.W, ((s.y + v.t * 0.004 * (0.5 + s.r * 0.2)) % 1) * v.H, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // stalactites hang from the cavern roof (slight parallax)
  const off = v.camY * 0.03 * v.scale;
  ctx.fillStyle = '#0a0712';
  ctx.beginPath(); ctx.moveTo(0, 0);
  for (const s of stalactites) { const x = s.x * v.W; ctx.lineTo(x - s.w / 2, Math.max(0, 12 - off)); ctx.lineTo(x, Math.max(0, s.h - off)); ctx.lineTo(x + s.w / 2, Math.max(0, 12 - off)); }
  ctx.lineTo(v.W, 0); ctx.closePath(); ctx.fill();
  for (const [x, dir] of [[0, 1], [v.W, -1]]) for (let k = 0; k < 5; k++) {
    const cy = v.H * (0.2 + k * 0.13); const len = 16 + (k % 3) * 8;
    ctx.fillStyle = k % 2 ? 'rgba(125,232,216,0.55)' : 'rgba(182,156,240,0.55)';
    ctx.beginPath(); ctx.moveTo(x, cy - 4); ctx.lineTo(x + dir * len, cy - 1 + (k % 2) * 3); ctx.lineTo(x, cy + 4); ctx.fill();
  }
}

// Nimbus Isle: brighter high-altitude light with a glowing band of cloud sea on the horizon.
export function drawHighSkyGlow(ctx, v, tod) {
  const g = ctx.createLinearGradient(0, v.H * 0.35, 0, v.H);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,248,235,${0.35 * (1 - tod.dark)})`);
  ctx.fillStyle = g; ctx.fillRect(0, v.H * 0.35, v.W, v.H * 0.65);
}

/* ================================================================== */
/* Far layers (world space, parallax)                                  */
/* ================================================================== */
export function drawFarFor(ctx, v, tod, loc, t, season) {
  const tint = (hex, amt = 1) => mix(hex, NIGHT, Math.min(0.85, tod.dark * 1.15 * amt));
  const L = v.worldLeft - 40; const R = v.worldRight + 40;
  const winter = season.key === 'winter';
  const layer = (p, fn) => { ctx.save(); ctx.translate(0, (v.camY - v.camDefault) * (1 - p)); fn(); ctx.restore(); };
  const haze = (y, col) => { const g = ctx.createLinearGradient(0, y - 60, 0, y + 10); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, col); ctx.fillStyle = g; ctx.fillRect(L, y - 60, R - L, 70); };
  switch (loc.id) {
    case 'cove': return farCove(ctx, v, tod, t, season, tint, L, R, layer, winter);
    case 'caverns': return farCaverns(ctx, v, tod, t, tint, L, R, layer);
    case 'clockwork': return farCity(ctx, v, tod, t, season, tint, L, R, layer, winter);
    case 'castle': return farCastle(ctx, v, tod, t, season, tint, L, R, layer, winter, haze);
    case 'sky': return farSky(ctx, v, tod, t, tint, L, R, layer);
    default: return null; // meadow: the classic countryside in scenery.js
  }
}

function farCove(ctx, v, tod, t, season, tint, L, R, layer, winter) {
  layer(0.25, () => {
    // open sea to the horizon
    const sg = ctx.createLinearGradient(0, -90, 0, 40);
    sg.addColorStop(0, tint('#8fc7e0')); sg.addColorStop(1, tint('#3f86b8'));
    ctx.fillStyle = sg; ctx.fillRect(L, -90, R - L, 3200);
    ctx.fillStyle = tint('#b9e1f0'); ctx.fillRect(L, -90, R - L, 2);
    ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - tod.dark)})`;
    for (let k = 0; k < 22; k++) { const x = L + ((k * 71 + t * 5) % (R - L)); ctx.fillRect(x, -80 + (k % 6) * 9, 12 + (k % 3) * 4, 1.2); }
    // distant island with a little cottage
    ctx.fillStyle = tint('#6f9a7a'); ctx.beginPath(); ctx.ellipse(W - 60, -88, 60, 14, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = tint('#f3e3c3'); ctx.fillRect(W - 70, -104, 10, 7); ctx.fillStyle = tint('#b5523b'); ctx.beginPath(); ctx.moveTo(W - 72, -104); ctx.lineTo(W - 65, -110); ctx.lineTo(W - 58, -104); ctx.fill();
    // sailboats drifting
    for (let k = 0; k < 3; k++) { const x = L + ((t * (3 + k) + k * 180) % (R - L + 60)) - 30; const y = -70 + k * 14; ctx.fillStyle = tint('#8a5a3a'); ctx.fillRect(x - 7, y, 14, 3); ctx.fillStyle = tint(k === 1 ? '#f28b82' : '#fbf6ea'); ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x, y - 1); ctx.lineTo(x + 9, y - 1); ctx.fill(); }
  });
  layer(0.55, () => {
    // dunes with beach grass and striped beach huts
    const dune = (x) => -24 - Math.sin(x * 0.018 + 1) * 10 - Math.cos(x * 0.041) * 4;
    ctx.fillStyle = tint(winter ? '#e9eef2' : '#ecd6a4'); ctx.beginPath(); ctx.moveTo(L, 3000);
    for (let x = L; x <= R; x += 16) ctx.lineTo(x, dune(x));
    ctx.lineTo(R, 3000); ctx.closePath(); ctx.fill();
    const Rn = rng(9);
    for (let k = 0; k < 26; k++) { const x = L + Rn() * (R - L); const y = dune(x) + 4; ctx.strokeStyle = tint('#9fae62'); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2 + Math.sin(t + k) * 1.5, y - 8); ctx.moveTo(x, y); ctx.lineTo(x + 3 + Math.sin(t + k) * 1.5, y - 7); ctx.stroke(); }
    [-120, -70, 470, 520].forEach((hx, k) => { if (hx < L - 20 || hx > R + 20) return; const y = dune(hx) + 6; const cols = ['#d9534f', '#4f8fd9', '#f2c14e', '#6aa84f']; ctx.fillStyle = tint('#fbf6ea'); ctx.fillRect(hx - 8, y - 14, 16, 14); ctx.fillStyle = tint(cols[k]); for (let s = 0; s < 4; s++) ctx.fillRect(hx - 8 + s * 4, y - 14, 2, 14); ctx.fillStyle = tint(cols[k]); ctx.beginPath(); ctx.moveTo(hx - 10, y - 14); ctx.lineTo(hx, y - 21); ctx.lineTo(hx + 10, y - 14); ctx.fill(); });
  });
}

function farCaverns(ctx, v, tod, t, tint, L, R, layer) {
  layer(0.25, () => {
    const Rn = rng(31);
    ctx.fillStyle = '#231b36'; ctx.beginPath(); ctx.moveTo(L, 3000);
    for (let x = L; x <= R; x += 14) ctx.lineTo(x, -110 - Math.abs(Math.sin(x * 0.03)) * 40 - Rn() * 16);
    ctx.lineTo(R, 3000); ctx.closePath(); ctx.fill();
    // underground waterfall
    for (const wx of [60, W - 40]) {
      const g = ctx.createLinearGradient(0, -150, 0, -20); g.addColorStop(0, 'rgba(125,232,216,0.15)'); g.addColorStop(1, 'rgba(125,232,216,0.45)');
      ctx.fillStyle = g; ctx.fillRect(wx - 7, -150, 14, 130);
      ctx.strokeStyle = 'rgba(220,255,250,0.55)'; ctx.lineWidth = 0.8; for (let k = 0; k < 4; k++) { const y = -150 + ((t * 40 + k * 32) % 130); ctx.beginPath(); ctx.moveTo(wx - 5 + k * 3, y); ctx.lineTo(wx - 5 + k * 3, y + 10); ctx.stroke(); }
      ell(ctx, wx, -20, 16, 4, 'rgba(200,255,250,0.35)');
    }
  });
  layer(0.5, () => {
    const Rn = rng(12);
    ctx.fillStyle = '#2e2544'; ctx.beginPath(); ctx.moveTo(L, 3000);
    for (let x = L; x <= R; x += 12) ctx.lineTo(x, -36 - Math.abs(Math.sin(x * 0.05 + 2)) * 26 - Rn() * 6);
    ctx.lineTo(R, 3000); ctx.closePath(); ctx.fill();
    // giant glowing mushrooms and crystal clusters
    [-140, -80, 470, 540].forEach((mx, k) => {
      if (mx < L - 40 || mx > R + 40) return;
      const h = 44 + (k % 2) * 20; const c = k % 2 ? '#7de8d8' : '#b69cf0';
      ctx.fillStyle = '#d8cfe8'; ctx.fillRect(mx - 3, -30 - h, 6, h);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(mx, -30 - h, 2, mx, -30 - h, 40); g.addColorStop(0, c + '66'); g.addColorStop(1, c + '00'); ctx.fillStyle = g; ctx.fillRect(mx - 40, -70 - h, 80, 80); ctx.restore();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(mx, -30 - h, 20, 12, 0, Math.PI, 0); ctx.fill();
      for (let s = 0; s < 4; s++) circ(ctx, mx - 12 + s * 8, -34 - h - (s % 2) * 4, 1.6, 'rgba(255,255,255,0.8)');
    });
    for (let k = 0; k < 10; k++) { const x = L + Rn() * (R - L); const y = -30 - Rn() * 10; ctx.fillStyle = Rn() < 0.5 ? 'rgba(125,232,216,0.8)' : 'rgba(182,156,240,0.8)'; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x, y - 8 - Rn() * 8); ctx.lineTo(x + 3, y); ctx.fill(); }
    // a string of miners' lanterns
    ctx.strokeStyle = 'rgba(40,30,50,0.9)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(L, -60); for (let x = L; x <= R; x += 10) ctx.lineTo(x, -60 + Math.sin(x * 0.02) * 6 + 4); ctx.stroke();
    for (let x = Math.ceil(L / 60) * 60; x <= R; x += 60) { const y = -58 + Math.sin(x * 0.02) * 6 + 4; circ(ctx, x, y + 3, 2, '#ffcf7a'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y + 3, 0, x, y + 3, 10); g.addColorStop(0, 'rgba(255,200,120,0.5)'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - 10, y - 7, 20, 20); ctx.restore(); }
  });
}

function farCity(ctx, v, tod, t, season, tint, L, R, layer, winter) {
  const night = tod.dark > 0.3;
  layer(0.22, () => {
    ctx.fillStyle = tint('#9fb3b8'); ctx.fillRect(L, -40, R - L, 3200);
    const Rn = rng(41);
    for (let x = L - 20; x < R + 20; ) {
      const w = 18 + Rn() * 26; const h = 60 + Rn() * 90;
      ctx.fillStyle = tint('#7f8f98', 0.9); ctx.fillRect(x, -40 - h, w, h + 2);
      if (Rn() < 0.3) { ctx.beginPath(); ctx.arc(x + w / 2, -40 - h, w / 2, Math.PI, 0); ctx.fill(); }
      if (night) for (let k = 0; k < 6; k++) { ctx.fillStyle = Rn() < 0.6 ? 'rgba(255,214,140,0.8)' : 'rgba(0,0,0,0)'; ctx.fillRect(x + 3 + (k % 2) * (w / 2), -30 - h + Math.floor(k / 2) * 14, 3, 4); }
      x += w + 4;
    }
    // the great clock tower
    const cx = W - 70;
    ctx.fillStyle = tint('#6f7f88'); ctx.fillRect(cx - 12, -230, 24, 200);
    ctx.beginPath(); ctx.moveTo(cx - 15, -230); ctx.lineTo(cx, -262); ctx.lineTo(cx + 15, -230); ctx.fill();
    circ(ctx, cx, -205, 10, tint('#fbf6ea')); ctx.strokeStyle = tint('#3a3029'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, -205); ctx.lineTo(cx + Math.cos(t * 0.1) * 7, -205 + Math.sin(t * 0.1) * 7); ctx.moveTo(cx, -205); ctx.lineTo(cx + Math.cos(t * 0.01) * 5, -205 + Math.sin(t * 0.01) * 5); ctx.stroke();
    // airship
    const ax = L + ((t * 6) % (R - L + 200)) - 100; const ay = -200 + Math.sin(t * 0.3) * 6;
    ell(ctx, ax, ay, 34, 11, tint('#c99a4d')); ctx.fillStyle = tint('#9c6a34'); for (let k = -2; k <= 2; k++) ctx.fillRect(ax + k * 12 - 0.5, ay - 11, 1, 22);
    fillRR(ctx, ax - 10, ay + 12, 20, 6, 2, tint('#6b4520')); ctx.strokeStyle = tint('#6b4520'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(ax - 8, ay + 12); ctx.lineTo(ax - 14, ay + 8); ctx.moveTo(ax + 8, ay + 12); ctx.lineTo(ax + 14, ay + 8); ctx.stroke();
    ctx.fillStyle = tint('#9c6a34'); ctx.beginPath(); ctx.moveTo(ax - 34, ay); ctx.lineTo(ax - 44, ay - 8); ctx.lineTo(ax - 44, ay + 8); ctx.fill();
  });
  layer(0.5, () => {
    const Rn = rng(8);
    for (let x = L - 30; x < R + 30; ) {
      const w = 34 + Rn() * 30; const h = 40 + Rn() * 40; const y = -10 - h;
      const brick = ['#b5694a', '#9c5a44', '#c07a54'][Math.floor(Rn() * 3)];
      ctx.fillStyle = tint(brick); ctx.fillRect(x, y, w, h + 20);
      ctx.fillStyle = tint(winter ? '#f1f5f9' : '#5a6b70'); ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + w / 2, y - 12); ctx.lineTo(x + w + 3, y); ctx.fill();
      for (let k = 0; k < Math.floor(w / 12); k++) { ctx.fillStyle = night ? 'rgba(255,214,140,0.9)' : tint('#bfe3f2'); ctx.fillRect(x + 5 + k * 12, y + 10, 5, 7); ctx.fillRect(x + 5 + k * 12, y + 26, 5, 7); }
      const chx = x + w - 10; ctx.fillStyle = tint('#6b4520'); ctx.fillRect(chx, y - 16, 5, 12);
      for (let p = 0; p < 3; p++) { const ph = ((t * 0.3 + p / 3 + x * 0.01) % 1); circ(ctx, chx + 2.5 + ph * 8, y - 18 - ph * 20, 2 + ph * 4, `rgba(220,215,225,${0.5 * (1 - ph)})`); }
      x += w + 2 + Rn() * 8;
    }
  });
}

function farCastle(ctx, v, tod, t, season, tint, L, R, layer, winter, haze) {
  layer(0.2, () => {
    // mountains with snowcaps
    ctx.fillStyle = tint('#8e9ab8'); ctx.beginPath(); ctx.moveTo(L, 3000);
    const peaks = [[-160, -170], [-60, -230], [60, -180], [170, -250], [300, -190], [420, -240], [540, -175]];
    ctx.lineTo(L, -100); peaks.forEach(([x, y]) => { ctx.lineTo(x - 50, -100); ctx.lineTo(x, y); ctx.lineTo(x + 50, -100); }); ctx.lineTo(R, -100); ctx.lineTo(R, 3000); ctx.closePath(); ctx.fill();
    ctx.fillStyle = tint('#f4f6fb'); peaks.forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 14, y + 26); ctx.lineTo(x, y); ctx.lineTo(x + 14, y + 26); ctx.lineTo(x + 5, y + 20); ctx.lineTo(x, y + 28); ctx.lineTo(x - 6, y + 20); ctx.closePath(); ctx.fill(); });
    // the grand castle on its hill
    const cx = 50;
    ctx.fillStyle = tint('#7d8a6a'); ctx.beginPath(); ctx.ellipse(cx, -80, 110, 36, 0, Math.PI, 0); ctx.fill();
    const stone = tint('#b9b3c9'); const roof = tint('#6d5fa3');
    ctx.fillStyle = stone; ctx.fillRect(cx - 40, -150, 80, 70);
    for (let k = 0; k < 9; k++) ctx.fillRect(cx - 40 + k * 9.5, -156, 5, 7);
    [[-48, 90], [36, 90], [-12, 118]].forEach(([dx, h]) => { ctx.fillStyle = stone; ctx.fillRect(cx + dx, -80 - h, 14, h); ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(cx + dx - 3, -80 - h); ctx.lineTo(cx + dx + 7, -80 - h - 22); ctx.lineTo(cx + dx + 17, -80 - h); ctx.fill(); ctx.fillStyle = tint('#e0b84f'); ctx.fillRect(cx + dx + 6.5, -80 - h - 34, 1, 12); ctx.beginPath(); ctx.moveTo(cx + dx + 7.5, -80 - h - 34); ctx.lineTo(cx + dx + 16 + Math.sin(t * 3 + dx) * 2, -80 - h - 31); ctx.lineTo(cx + dx + 7.5, -80 - h - 28); ctx.fill(); });
    const lit = tod.dark > 0.3;
    for (let k = 0; k < 6; k++) { ctx.fillStyle = lit ? '#ffd98a' : tint('#4b3f58'); rr(ctx, cx - 32 + k * 12, -130, 5, 9, 2.5); ctx.fill(); }
  });
  layer(0.5, () => {
    // castle town rooftops and pines
    const hill = (x) => -30 - Math.sin(x * 0.02) * 10 - Math.cos(x * 0.05) * 5;
    ctx.fillStyle = tint(season.hills[1]); ctx.beginPath(); ctx.moveTo(L, 3000); for (let x = L; x <= R; x += 16) ctx.lineTo(x, hill(x)); ctx.lineTo(R, 3000); ctx.closePath(); ctx.fill();
    [-150, -110, -70, 455, 500, 545].forEach((hx, k) => {
      if (hx < L - 30 || hx > R + 30) return;
      const y = hill(hx) + 8; const w = 16 + (k % 3) * 4; const h = 16 + (k % 2) * 6;
      ctx.fillStyle = tint('#f3e3c3'); ctx.fillRect(hx - w / 2, y - h, w, h);
      ctx.strokeStyle = tint('#6b4a34'); ctx.lineWidth = 1; ctx.strokeRect(hx - w / 2, y - h, w, h); ctx.beginPath(); ctx.moveTo(hx - w / 2, y - h); ctx.lineTo(hx + w / 2, y); ctx.stroke();
      ctx.fillStyle = tint(winter ? '#f7fafc' : '#6d5fa3'); ctx.beginPath(); ctx.moveTo(hx - w / 2 - 3, y - h); ctx.lineTo(hx, y - h - 14); ctx.lineTo(hx + w / 2 + 3, y - h); ctx.fill();
      ctx.fillStyle = tod.dark > 0.3 ? '#ffd98a' : tint('#bfe3f2'); ctx.fillRect(hx - 3, y - h + 4, 5, 5);
    });
    const Rn = rng(14);
    for (let k = 0; k < 14; k++) { const x = L + Rn() * (R - L); const y = hill(x) + 6; ctx.fillStyle = tint(winter ? '#e8eef4' : '#3f6f4f'); ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x, y - 20 - Rn() * 8); ctx.lineTo(x + 6, y); ctx.fill(); }
  });
}

function farSky(ctx, v, tod, t, tint, L, R, layer) {
  const pink = tod.phase > 0.5 && tod.phase < 0.66;
  const cloudCol = (a) => tint(pink ? '#ffe3e0' : '#ffffff', a);
  const puffRow = (y, s, seed, col, speed) => { const Rn = rng(seed); ctx.fillStyle = col; for (let x = L - 60; x < R + 60; x += 26 + Rn() * 20) { const xx = x + ((t * speed) % 60); ctx.beginPath(); ctx.arc(xx, y - Rn() * 10, (14 + Rn() * 16) * s, 0, Math.PI * 2); ctx.fill(); } ctx.fillRect(L - 60, y, R - L + 120, 3000); };
  layer(0.18, () => {
    puffRow(-150, 1.2, 3, cloudCol(0.7), 1.5);
    // distant floating islands
    [[-110, -240, 0.8], [W + 80, -280, 0.65], [W / 2 + 40, -330, 0.45]].forEach(([x, y, s], k) => {
      const yy = y + Math.sin(t * 0.4 + k) * 4;
      ctx.save(); ctx.translate(x, yy); ctx.scale(s, s);
      ctx.fillStyle = tint('#8a7a8c'); ctx.beginPath(); ctx.moveTo(-40, 0); ctx.quadraticCurveTo(-20, 40, 0, 56); ctx.quadraticCurveTo(20, 40, 40, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = tint('#8cc56f'); ctx.beginPath(); ctx.ellipse(0, 0, 42, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tint('#5d9450'); ctx.beginPath(); ctx.arc(-14, -10, 10, 0, Math.PI * 2); ctx.arc(8, -14, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(210,235,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(26, 4); ctx.lineTo(26, 60 + Math.sin(t) * 2); ctx.stroke();
      ctx.restore();
    });
  });
  layer(0.4, () => {
    puffRow(-60, 1.5, 7, cloudCol(0.55), 3);
    // tethered balloons bob in the breeze
    [[-60, -150, '#f28b82'], [W + 40, -120, '#9ec5f0']].forEach(([x, y, c], k) => { const yy = y + Math.sin(t * 0.8 + k) * 5; ell(ctx, x, yy, 12, 14, tint(c)); fillRR(ctx, x - 4, yy + 16, 8, 5, 1.5, tint('#a0764f')); ctx.strokeStyle = tint('#6b4a34'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - 8, yy + 8); ctx.lineTo(x - 4, yy + 16); ctx.moveTo(x + 8, yy + 8); ctx.lineTo(x + 4, yy + 16); ctx.stroke(); });
  });
  layer(0.7, () => { puffRow(20, 1.9, 11, cloudCol(0.35), 5); });
}

/* ================================================================== */
/* Ground (garden apron + underground)                                 */
/* ================================================================== */
// Returns true when handled (meadow uses the classic garden in scenery.js).
export function drawGroundFor(ctx, v, tod, loc, t, coins, season, ctxInfo) {
  const L = v.worldLeft - 40; const R = v.worldRight + 40;
  const dark = tod.dark;
  const tint = (hex) => mix(hex, NIGHT, Math.min(0.75, dark * 1.05));
  const winter = season.key === 'winter';
  switch (loc.id) {
    case 'cove': groundCove(ctx, L, R, t, dark, tint, winter); break;
    case 'caverns': groundCavern(ctx, L, R, t, dark); break;
    case 'clockwork': groundStreet(ctx, L, R, t, dark, tint, winter); break;
    case 'castle': groundCourtyard(ctx, L, R, t, dark, tint, season, winter); break;
    case 'sky': groundIsland(ctx, L, R, t, dark, tint, season, winter); break;
    default: return false;
  }
  drawVault(ctx, loc, coins, t, ctxInfo);
  return true;
}

function lampPost(ctx, x, y, dark, tint, kind = 'post') {
  ctx.fillStyle = tint('#3a3440'); ctx.fillRect(x - 1.5, y - 50, 3, 50);
  if (kind === 'gas') { fillRR(ctx, x - 6, y - 62, 12, 14, 2, tint('#2f2a33')); ctx.fillStyle = dark > 0.3 ? '#fff0a8' : tint('#dfe8e0'); ctx.fillRect(x - 4, y - 60, 8, 10); ctx.fillStyle = tint('#2f2a33'); ctx.beginPath(); ctx.moveTo(x - 7, y - 62); ctx.lineTo(x, y - 68); ctx.lineTo(x + 7, y - 62); ctx.fill(); }
  else { fillRR(ctx, x - 6.5, y - 60, 13, 12, 3, tint('#3a3440')); circ(ctx, x, y - 54, 3.6, dark > 0.3 ? '#fff0a8' : tint('#f0e6c8')); }
  if (dark > 0.3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const lg = ctx.createRadialGradient(x, y - 55, 2, x, y - 55, 50); lg.addColorStop(0, `rgba(255,220,140,${dark * 0.6})`); lg.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = lg; ctx.fillRect(x - 50, y - 105, 100, 100); ctx.restore(); }
}

function groundCove(ctx, L, R, t, dark, tint, winter) {
  // sand
  const sg = ctx.createLinearGradient(0, 0, 0, 90); sg.addColorStop(0, tint(winter ? '#eef1f3' : '#f0dcae')); sg.addColorStop(1, tint('#e2c68c'));
  ctx.fillStyle = sg; ctx.fillRect(L, -2, R - L, 92);
  // the sea laps in on the left
  ctx.fillStyle = tint('#3f86b8'); ctx.beginPath(); ctx.moveTo(L, 10); ctx.lineTo(120, 10); ctx.quadraticCurveTo(170 + Math.sin(t * 0.8) * 6, 45, 110, 90); ctx.lineTo(L, 90); ctx.closePath(); ctx.fill();
  ctx.fillStyle = tint('#5fa3cf'); ctx.beginPath(); ctx.moveTo(L, 16); ctx.lineTo(108, 16); ctx.quadraticCurveTo(152 + Math.sin(t * 0.8) * 6, 46, 100, 90); ctx.lineTo(L, 90); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(120, 10); ctx.quadraticCurveTo(170 + Math.sin(t * 0.8) * 6, 45, 110, 90); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let k = 0; k < 8; k++) ctx.fillRect(L + 20 + ((k * 37 + t * 6) % 120), 24 + (k % 4) * 15, 10, 1.2);
  // rocks, a rowboat, starfish, beach umbrella
  ell(ctx, 150, 76, 12, 6, tint('#8a8577')); ell(ctx, 162, 80, 7, 4, tint('#a09a8a'));
  ctx.fillStyle = tint('#8a5a3a'); ctx.beginPath(); ctx.moveTo(176, 30); ctx.lineTo(214, 30); ctx.lineTo(208, 38); ctx.lineTo(182, 38); ctx.closePath(); ctx.fill(); ctx.fillStyle = tint('#d9534f'); ctx.fillRect(177, 30, 36, 2);
  star(ctx, 232, 70, 4, tint('#f29c7a'), 5, 0.45); star(ctx, 318, 84, 3, tint('#f2c14e'), 5, 0.45);
  ctx.fillStyle = tint('#6b4a34'); ctx.fillRect(299, 12, 1.6, 34);
  for (let k = 0; k < 6; k++) { ctx.fillStyle = tint(k % 2 ? '#d9534f' : '#fbf6ea'); ctx.beginPath(); ctx.moveTo(300, 8); ctx.arc(300, 16, 20, Math.PI + (k / 6) * Math.PI, Math.PI + ((k + 1) / 6) * Math.PI); ctx.closePath(); ctx.fill(); }
  fillRR(ctx, 286, 40, 16, 5, 1.5, tint('#4f8fd9'));
  // boardwalk path to the door
  ctx.fillStyle = tint('#b99a6a'); ctx.fillRect(196, -1, 44, 91); ctx.fillStyle = tint('#9c7e52'); for (let y = 4; y < 90; y += 7) ctx.fillRect(196, y, 44, 1);
  lampPost(ctx, 256, 44, dark, tint);
  // foundation: tarred pilings
  ctx.fillStyle = tint('#4a4a52'); ctx.fillRect(BX0 - 4, -2, BX1 - BX0 + 8, 10); ctx.fillStyle = tint('#3a3a42'); for (let x = BX0; x < BX1; x += 18) ctx.fillRect(x, -2, 5, 10);
  // palm-crab
  const cx = 270 + Math.sin(t * 0.5) * 30; ell(ctx, cx, 62, 5, 3, tint('#e0605a')); ctx.strokeStyle = tint('#e0605a'); ctx.lineWidth = 1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * 4, 61); ctx.lineTo(cx + s * 8, 57); ctx.stroke(); circ(ctx, cx + s * 8.5, 56.5, 1.6, tint('#e0605a')); } circ(ctx, cx - 1.5, 59, 0.7, '#1d1b24'); circ(ctx, cx + 1.5, 59, 0.7, '#1d1b24');
  // underground: wet sand then rock
  const ug = ctx.createLinearGradient(0, 90, 0, GROUND_H); ug.addColorStop(0, '#b89a6a'); ug.addColorStop(0.3, '#7a6a58'); ug.addColorStop(1, '#4a4450');
  ctx.fillStyle = ug; ctx.fillRect(L, 90, R - L, GROUND_H - 90 + 400);
  const Rp = rng(33); for (let k = 0; k < 40; k++) ell(ctx, L + Rp() * (R - L), 100 + Rp() * 120, 2 + Rp() * 4, 1.2 + Rp() * 2, Rp() < 0.5 ? '#8a7a66' : '#5a5260');
  for (let k = 0; k < 6; k++) star(ctx, L + Rp() * (R - L), 130 + Rp() * 80, 2.5, '#d9a58a', 5, 0.45);
}

function groundCavern(ctx, L, R, t, dark) {
  const g = ctx.createLinearGradient(0, 0, 0, 90); g.addColorStop(0, '#3e3654'); g.addColorStop(1, '#2e2742');
  ctx.fillStyle = g; ctx.fillRect(L, -2, R - L, 92);
  const Rn = rng(5); for (let k = 0; k < 40; k++) ell(ctx, L + Rn() * (R - L), 4 + Rn() * 84, 6 + Rn() * 12, 1.4 + Rn() * 2, Rn() < 0.5 ? '#48405f' : '#352e4a');
  // glowing underground lake
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const lg = ctx.createRadialGradient(96, 50, 10, 96, 50, 90); lg.addColorStop(0, 'rgba(125,232,216,0.35)'); lg.addColorStop(1, 'rgba(125,232,216,0)'); ctx.fillStyle = lg; ctx.fillRect(0, -40, 200, 180); ctx.restore();
  ell(ctx, 96, 50, 78, 25, '#1f4a58'); ell(ctx, 96, 48, 72, 21, '#2f7082');
  ctx.strokeStyle = 'rgba(160,255,245,0.5)'; ctx.lineWidth = 0.8; for (let k = 0; k < 5; k++) { const x = 50 + ((k * 31 + t * 5) % 100); ctx.beginPath(); ctx.moveTo(x, 44 + k * 3); ctx.lineTo(x + 8, 44 + k * 3); ctx.stroke(); }
  for (let k = 0; k < 4; k++) { const fx = 60 + ((t * (8 + k * 3) + k * 40) % 90); circ(ctx, fx, 46 + k * 4 + Math.sin(t * 2 + k) * 1.5, 1.6, 'rgba(180,255,245,0.9)'); }
  // little boat with a lantern
  const bx = 110 + Math.sin(t * 0.3) * 20; ctx.fillStyle = '#6b4a34'; ctx.beginPath(); ctx.moveTo(bx - 12, 46); ctx.lineTo(bx + 12, 46); ctx.lineTo(bx + 8, 51); ctx.lineTo(bx - 8, 51); ctx.fill(); ctx.fillStyle = '#3a3440'; ctx.fillRect(bx + 5, 36, 1, 10); circ(ctx, bx + 5.5, 36, 2, '#ffcf7a');
  // path of glowing stepping stones
  for (let k = 0; k < 7; k++) { ell(ctx, 212 + (k % 2) * 10, 8 + k * 12, 9, 3.5, '#5a5070'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ell(ctx, 212 + (k % 2) * 10, 8 + k * 12, 5, 1.6, `rgba(125,232,216,${0.25 + 0.15 * Math.sin(t * 2 + k)})`); ctx.restore(); }
  // mushrooms & crystals
  [[268, 40, '#7de8d8'], [284, 60, '#b69cf0'], [330, 30, '#7de8d8'], [410, 72, '#b69cf0'], [30, 84, '#b69cf0']].forEach(([x, y, c], k) => { ctx.fillStyle = '#d8cfe8'; ctx.fillRect(x - 1.2, y - 10, 2.4, 10); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y - 10, 7, 5, 0, Math.PI, 0); ctx.fill(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gg = ctx.createRadialGradient(x, y - 11, 0, x, y - 11, 16); gg.addColorStop(0, c + '55'); gg.addColorStop(1, c + '00'); ctx.fillStyle = gg; ctx.fillRect(x - 16, y - 27, 32, 32); ctx.restore(); });
  for (let k = 0; k < 5; k++) { const x = 360 + k * 12; ctx.fillStyle = k % 2 ? 'rgba(125,232,216,0.9)' : 'rgba(182,156,240,0.9)'; ctx.beginPath(); ctx.moveTo(x - 4, 60); ctx.lineTo(x - 1, 34 + k * 3); ctx.lineTo(x + 3, 60); ctx.fill(); }
  // crystal lamp on a post
  ctx.fillStyle = '#2a2436'; ctx.fillRect(254.5, -6, 3, 50); ctx.fillStyle = 'rgba(125,232,216,0.95)'; ctx.beginPath(); ctx.moveTo(256, -22); ctx.lineTo(262, -12); ctx.lineTo(256, -4); ctx.lineTo(250, -12); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const cg = ctx.createRadialGradient(256, -12, 2, 256, -12, 44); cg.addColorStop(0, 'rgba(125,232,216,0.45)'); cg.addColorStop(1, 'rgba(125,232,216,0)'); ctx.fillStyle = cg; ctx.fillRect(212, -56, 88, 88); ctx.restore();
  // foundation
  ctx.fillStyle = '#2a2436'; ctx.fillRect(BX0 - 4, -2, BX1 - BX0 + 8, 10);
  // underground: deeper rock
  const ug = ctx.createLinearGradient(0, 90, 0, GROUND_H); ug.addColorStop(0, '#2a2240'); ug.addColorStop(1, '#171126');
  ctx.fillStyle = ug; ctx.fillRect(L, 90, R - L, GROUND_H - 90 + 400);
  const Rp = rng(33); for (let k = 0; k < 20; k++) { const x = L + Rp() * (R - L); const y = 110 + Rp() * 110; ctx.fillStyle = Rp() < 0.5 ? 'rgba(125,232,216,0.6)' : 'rgba(182,156,240,0.6)'; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x, y - 5 - Rp() * 5); ctx.lineTo(x + 2, y); ctx.fill(); }
}

function groundStreet(ctx, L, R, t, dark, tint, winter) {
  // cobbles
  ctx.fillStyle = tint('#8a8278'); ctx.fillRect(L, -2, R - L, 92);
  for (let y = 0, row = 0; y < 90; y += 6, row++) for (let x = L + (row % 2) * 5; x < R; x += 10) { rr(ctx, x + 0.5, y + 0.5, 9, 5, 2); ctx.fillStyle = tint(((x + y) | 0) % 3 ? '#9d958a' : '#948c80'); ctx.fill(); }
  if (winter) { const Rs = rng(4); for (let k = 0; k < 20; k++) ell(ctx, L + Rs() * (R - L), 10 + Rs() * 75, 8 + Rs() * 14, 1.6, tint('#ffffff')); }
  // pavement kerb + tram rails
  ctx.fillStyle = tint('#b9b0a2'); ctx.fillRect(L, -2, R - L, 12); ctx.fillStyle = tint('#6d665c'); ctx.fillRect(L, 10, R - L, 2);
  ctx.fillStyle = tint('#5a5248'); ctx.fillRect(L, 66, R - L, 2); ctx.fillRect(L, 76, R - L, 2);
  // gear fountain (where the pond would be)
  ell(ctx, 96, 50, 56, 18, tint('#6d665c')); ell(ctx, 96, 48, 50, 14, tint('#5fa39a'));
  ctx.save(); ctx.translate(96, 30); ctx.rotate(t * 0.4); ctx.fillStyle = tint('#c99a4d'); for (let k = 0; k < 10; k++) { ctx.rotate(Math.PI / 5); ctx.fillRect(-2, -16, 4, 5); } circ(ctx, 0, 0, 12, tint('#c99a4d')); circ(ctx, 0, 0, 4, tint('#6b4520')); ctx.restore();
  ctx.strokeStyle = 'rgba(200,240,240,0.8)'; ctx.lineWidth = 1.1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(96, 18); ctx.quadraticCurveTo(96 + s * 22, 6, 96 + s * 34, 44); ctx.stroke(); }
  // newspaper kiosk
  fillRR(ctx, 150, 16, 30, 26, 2, tint('#3f7f6f')); ctx.fillStyle = tint('#2f5f52'); ctx.beginPath(); ctx.moveTo(146, 16); ctx.lineTo(165, 4); ctx.lineTo(184, 16); ctx.fill();
  ctx.fillStyle = tint('#fbf6ea'); ctx.fillRect(154, 22, 22, 12); ctx.fillStyle = tint('#3a3029'); ctx.font = `700 4px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('THE DAILY', 165, 27); ctx.fillText('SQUEAK', 165, 32);
  lampPost(ctx, 256, 44, dark, tint, 'gas'); lampPost(ctx, 410, 40, dark, tint, 'gas');
  // bench
  ctx.fillStyle = tint('#6b4520'); ctx.fillRect(300, 30, 34, 3); ctx.fillRect(300, 22, 34, 2); ctx.fillStyle = tint('#2f2a33'); ctx.fillRect(302, 30, 2, 8); ctx.fillRect(330, 30, 2, 8);
  // foundation: brick plinth
  ctx.fillStyle = tint('#8a5a44'); ctx.fillRect(BX0 - 4, -2, BX1 - BX0 + 8, 10); ctx.fillStyle = tint('#6b4535'); for (let x = BX0; x < BX1; x += 12) ctx.fillRect(x, -2, 1, 10); ctx.fillRect(BX0 - 4, 3, BX1 - BX0 + 8, 1);
  // underground: brick tunnels and pipes
  ctx.fillStyle = '#4a3a30'; ctx.fillRect(L, 90, R - L, GROUND_H - 90 + 400);
  for (let y = 92, row = 0; y < GROUND_H + 40; y += 8, row++) for (let x = L + (row % 2) * 8; x < R; x += 16) { ctx.fillStyle = ((x + y) | 0) % 5 ? '#5a4535' : '#523f31'; ctx.fillRect(x + 0.5, y + 0.5, 15, 7); }
  ctx.fillStyle = '#b07a2e'; ctx.fillRect(L, 104, R - L, 5); ctx.fillRect(40, 104, 5, 130); ctx.fillStyle = '#e0b060'; ctx.fillRect(L, 105, R - L, 1);
}

function groundCourtyard(ctx, L, R, t, dark, tint, season, winter) {
  // flagstone courtyard with grass verges
  const gg = ctx.createLinearGradient(0, 0, 0, 90); gg.addColorStop(0, tint(season.grass[0])); gg.addColorStop(1, tint(season.grass[1]));
  ctx.fillStyle = gg; ctx.fillRect(L, -2, R - L, 92);
  ctx.fillStyle = tint('#a8a3b0'); ctx.fillRect(176, -2, 90, 92);
  for (let y = 0, row = 0; y < 90; y += 10, row++) for (let x = 176 + (row % 2) * 9; x < 266; x += 18) { rr(ctx, x + 0.5, y + 0.5, 17, 9, 2); ctx.fillStyle = tint(row % 3 ? '#b9b4c2' : '#aaa5b4'); ctx.fill(); }
  // the moat where the pond would be, with a little drawbridge
  ell(ctx, 96, 50, 78, 25, tint('#3f6f7f')); ell(ctx, 96, 48, 72, 21, tint(winter ? '#cfe4ef' : '#4f8f9f'));
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8; for (let k = 0; k < 5; k++) { const x = 50 + ((k * 31 + t * 5) % 100); ctx.beginPath(); ctx.moveTo(x, 44 + k * 3); ctx.lineTo(x + 8, 44 + k * 3); ctx.stroke(); }
  ctx.fillStyle = tint('#8a5a3a'); ctx.fillRect(140, 38, 44, 7); ctx.fillStyle = tint('#6b4128'); for (let x = 142; x < 184; x += 6) ctx.fillRect(x, 38, 1, 7);
  ctx.strokeStyle = tint('#3a3440'); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(140, 38); ctx.lineTo(150, 18); ctx.moveTo(184, 38); ctx.lineTo(176, 18); ctx.stroke();
  // swan
  const sx = 70 + Math.sin(t * 0.2) * 30; ell(ctx, sx, 52, 7, 3.4, tint('#fbfbff')); ctx.strokeStyle = tint('#fbfbff'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx + 5, 50); ctx.quadraticCurveTo(sx + 9, 44, sx + 6, 41); ctx.stroke(); ctx.fillStyle = tint('#e8913a'); ctx.fillRect(sx + 6, 41, 3, 1.4);
  // topiary cones and a well
  [[292, 30], [292, 70], [420, 40]].forEach(([x, y]) => { fillRR(ctx, x - 5, y - 4, 10, 6, 1, tint('#8a5a3a')); ctx.fillStyle = tint(winter ? '#e8eef4' : '#3f7f4f'); ctx.beginPath(); ctx.moveTo(x - 7, y - 4); ctx.lineTo(x, y - 30); ctx.lineTo(x + 7, y - 4); ctx.fill(); });
  // banner poles
  for (const x of [270, 164]) { ctx.fillStyle = tint('#3a3440'); ctx.fillRect(x, -40, 1.6, 44); ctx.fillStyle = tint('#6d5fa3'); ctx.beginPath(); ctx.moveTo(x + 1.6, -38); ctx.lineTo(x + 12 + Math.sin(t * 3 + x) * 1.5, -36); ctx.lineTo(x + 12, -22); ctx.lineTo(x + 7, -26); ctx.lineTo(x + 1.6, -22); ctx.fill(); star(ctx, x + 7, -31, 2, '#e0b84f'); }
  // torches by the door
  for (const x of [184, 256]) { ctx.fillStyle = tint('#3a3440'); ctx.fillRect(x - 1, -30, 2, 30); fillRR(ctx, x - 3, -34, 6, 5, 1, tint('#6b4128')); const f = Math.sin(t * 9 + x) * 1.2; ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.moveTo(x - 3, -34); ctx.quadraticCurveTo(x + f, -46, x + 3, -34); ctx.fill(); ctx.fillStyle = '#fff0a0'; ctx.beginPath(); ctx.moveTo(x - 1.4, -34); ctx.quadraticCurveTo(x + f * 0.6, -40, x + 1.4, -34); ctx.fill(); if (dark > 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const lg = ctx.createRadialGradient(x, -38, 2, x, -38, 40); lg.addColorStop(0, `rgba(255,170,80,${0.55 * dark})`); lg.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = lg; ctx.fillRect(x - 40, -78, 80, 80); ctx.restore(); } }
  // foundation: big dressed stones
  ctx.fillStyle = tint('#7d7890'); ctx.fillRect(BX0 - 4, -2, BX1 - BX0 + 8, 12); ctx.fillStyle = tint('#625e70'); for (let x = BX0; x < BX1; x += 26) ctx.fillRect(x, -2, 1.2, 12);
  // underground: dungeon stones
  ctx.fillStyle = '#3a3446'; ctx.fillRect(L, 90, R - L, GROUND_H - 90 + 400);
  for (let y = 92, row = 0; y < GROUND_H + 40; y += 14, row++) for (let x = L + (row % 2) * 13; x < R; x += 26) { rr(ctx, x + 1, y + 1, 24, 12, 2); ctx.fillStyle = ((x * 7 + y) | 0) % 4 ? '#4a4458' : '#443e52'; ctx.fill(); }
}

function groundIsland(ctx, L, R, t, dark, tint, season, winter) {
  // the island's grassy top
  const gg = ctx.createLinearGradient(0, 0, 0, 90); gg.addColorStop(0, tint(season.grass[0])); gg.addColorStop(1, tint(season.grass[1]));
  ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(W + 10, -2); ctx.lineTo(W + 4, 86); ctx.lineTo(-4, 86); ctx.closePath(); ctx.fill();
  if (winter) { const Rs = rng(4); for (let k = 0; k < 16; k++) ell(ctx, Rs() * W, 10 + Rs() * 70, 8 + Rs() * 12, 1.6, tint('#ffffff')); }
  // sky pool (where the pond would be) reflects the sky
  ell(ctx, 96, 50, 70, 22, tint('#dfe8f2')); ell(ctx, 96, 48, 64, 18, tint('#9ec5f0')); ell(ctx, 80, 44, 20, 4, 'rgba(255,255,255,0.6)');
  // marble path, telescope, mooring post with a tethered balloon
  ctx.fillStyle = tint('#f1ede4'); ctx.beginPath(); ctx.moveTo(190, 0); ctx.quadraticCurveTo(170, 50, 205, 86); ctx.lineTo(250, 86); ctx.quadraticCurveTo(222, 50, 232, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = tint('#d9b24c'); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(190, 0); ctx.quadraticCurveTo(170, 50, 205, 86); ctx.moveTo(232, 0); ctx.quadraticCurveTo(222, 50, 250, 86); ctx.stroke();
  ctx.strokeStyle = tint('#6d5a3a'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(300, 40); ctx.lineTo(292, 60); ctx.moveTo(300, 40); ctx.lineTo(308, 60); ctx.stroke();
  ctx.save(); ctx.translate(300, 38); ctx.rotate(-0.6); fillRR(ctx, -10, -3, 24, 6, 2, tint('#c9a557')); ctx.restore();
  ctx.fillStyle = tint('#6b4a34'); ctx.fillRect(420, 20, 4, 40); ctx.strokeStyle = tint('#8a6a3a'); ctx.lineWidth = 0.7; const by = -60 + Math.sin(t * 0.7) * 5; ctx.beginPath(); ctx.moveTo(422, 22); ctx.quadraticCurveTo(440, -10, 430, by + 20); ctx.stroke();
  ell(ctx, 430, by, 14, 16, tint('#f2d27a')); ctx.save(); ctx.beginPath(); ctx.ellipse(430, by, 14, 16, 0, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = tint('#e0605a'); for (let k = -2; k <= 2; k++) ctx.fillRect(430 + k * 6 - 1.5, by - 16, 3, 32); ctx.restore(); fillRR(ctx, 425, by + 18, 10, 6, 1.5, tint('#a0764f'));
  // cloud-edge fence posts (sort of)
  for (let x = 6; x < W; x += 36) { circ(ctx, x, 86, 8, 'rgba(255,255,255,0.9)'); }
  lampPost(ctx, 256, 44, dark, tint);
  // foundation: marble plinth with gold
  ctx.fillStyle = tint('#e0d8c6'); ctx.fillRect(BX0 - 4, -2, BX1 - BX0 + 8, 10); ctx.fillStyle = tint('#d9b24c'); ctx.fillRect(BX0 - 4, 5, BX1 - BX0 + 8, 1.2);
  // the underside of the floating island: rock tapering into cloud
  ctx.fillStyle = '#7a6a7c'; ctx.beginPath(); ctx.moveTo(-4, 86); ctx.lineTo(W + 4, 86); ctx.quadraticCurveTo(W - 20, 180, W / 2 + 60, 260); ctx.quadraticCurveTo(W / 2, 330, W / 2 - 60, 260); ctx.quadraticCurveTo(20, 180, -4, 86); ctx.fill();
  ctx.fillStyle = '#65566a'; const Rp = rng(33); for (let k = 0; k < 30; k++) ell(ctx, 40 + Rp() * (W - 80), 100 + Rp() * 120, 4 + Rp() * 8, 2 + Rp() * 4, Rp() < 0.5 ? '#8a7a8c' : '#65566a');
  ctx.fillStyle = '#5d9450'; for (let k = 0; k < 8; k++) { const x = 30 + k * 52; ctx.beginPath(); ctx.moveTo(x, 86); ctx.quadraticCurveTo(x + 3, 100 + (k % 3) * 8, x - 2, 110 + (k % 3) * 10); ctx.lineTo(x - 4, 86); ctx.fill(); }
  // waterfalls spill off the edge
  for (const wx of [70, W - 60]) { const g = ctx.createLinearGradient(0, 86, 0, 240); g.addColorStop(0, 'rgba(200,230,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(wx - 5, 86, 10, 160); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.7; for (let k = 0; k < 3; k++) { const y = 90 + ((t * 50 + k * 50) % 150); ctx.beginPath(); ctx.moveTo(wx - 3 + k * 3, y); ctx.lineTo(wx - 3 + k * 3, y + 12); ctx.stroke(); } }
  // clouds hugging the island
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; for (let k = 0; k < 9; k++) { const x = -40 + k * 62 + Math.sin(t * 0.2 + k) * 6; circ(ctx, x, 170 + (k % 3) * 22, 26 + (k % 2) * 10, 'rgba(255,255,255,0.9)'); }
}

/* ================================================================== */
/* The Keepsake Vault: coins pile up, keepsakes line the shelves       */
/* ================================================================== */
export function drawVault(ctx, loc, coins, t, info = {}) {
  const vx = 150, vy = 120, vw = 170, vh = 80;
  const shell = { caverns: ['#1a1428', '#3a3150', '#4a4062'], clockwork: ['#2f241c', '#6b5040', '#7a5d48'], castle: ['#252030', '#58526a', '#6a647c'], sky: ['#4f4058', '#e8e0f0', '#d8d0e4'], cove: ['#3a3440', '#c9b89a', '#b8a687'] }[loc.id] || ['#3a271b', '#e8cfa0', '#d4b98a'];
  ctx.fillStyle = shell[0]; rr(ctx, vx, vy, vw, vh, 30); ctx.fill();
  ctx.fillStyle = shell[1]; rr(ctx, vx + 6, vy + 6, vw - 12, vh - 10, 26); ctx.fill();
  ctx.fillStyle = shell[2]; ctx.fillRect(vx + 6, vy + vh - 18, vw - 12, 14);
  // tunnel down from the garden
  ctx.fillStyle = shell[0]; ctx.fillRect(vx - 60, vy + vh - 26, 64, 20); ctx.fillRect(vx - 64, 90, 18, vy + vh - 96);
  // keepsake shelf along the back wall
  const keeps = info.keepsakes || [];
  ctx.fillStyle = '#6b4128'; ctx.fillRect(vx + 22, vy + 40, vw - 44, 3);
  keeps.slice(0, 11).forEach((id, k) => drawKeepsake(ctx, id, vx + 30 + k * 11, vy + 40, 0.72));
  // treasure pile grows with your wealth
  const lv = Math.max(0, Math.min(1, Math.log10(Math.max(1, coins)) / 16));
  const pileW = 20 + lv * 90; const pileH = 6 + lv * 26;
  ctx.fillStyle = '#e9a623'; ctx.beginPath(); ctx.moveTo(vx + vw / 2 - pileW / 2, vy + vh - 4); ctx.quadraticCurveTo(vx + vw / 2, vy + vh - 4 - pileH * 2, vx + vw / 2 + pileW / 2, vy + vh - 4); ctx.fill();
  ctx.fillStyle = '#ffd257'; ctx.beginPath(); ctx.moveTo(vx + vw / 2 - pileW / 2 + 6, vy + vh - 5); ctx.quadraticCurveTo(vx + vw / 2, vy + vh - 6 - pileH * 1.7, vx + vw / 2 + pileW / 2 - 6, vy + vh - 5); ctx.fill();
  const Rc = rng(3);
  for (let k = 0; k < 6 + lv * 16; k++) coinIcon(ctx, vx + vw / 2 + (Rc() - 0.5) * pileW * 0.8, vy + vh - 6 - Rc() * pileH * 0.8, 2.6);
  drawCheese(ctx, vx + 26, vy + vh - 12, 1.1); drawCheese(ctx, vx + 40, vy + vh - 10, 0.9);
  // trophies earned in finished locations stand on the right
  (info.trophies || 0) && Array.from({ length: Math.min(6, info.trophies) }, (_, k) => drawKeepsake(ctx, 'trophy', vx + vw - 30 - (k % 3) * 9, vy + vh - 20 - Math.floor(k / 3) * 13, 0.85));
  // sleepy guard mouse
  drawMouse(ctx, vx + vw - 58, vy + vh - 4, { fur: '#8f7f73', belly: '#d9cdc2', dir: -1, pose: 'sit', t: t * 0.3, sleep: true, hat: 'bobble', hatCol: '#4f7cac', noShadow: true });
  ctx.fillStyle = '#fff'; ctx.font = `600 7px ${FONT}`; ctx.textAlign = 'center';
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2); ctx.fillText('z', vx + vw - 52 + Math.sin(t) * 2, vy + vh - 34 - ((t * 6) % 10)); ctx.globalAlpha = 1;
  // name plate (dark ink on a light plate so it is readable)
  fillRR(ctx, vx + vw / 2 - 52, vy + 13, 104, 13, 6, 'rgba(58,39,27,0.82)');
  ctx.fillStyle = '#ffe9b0'; ctx.font = `600 7.5px ${FONT}`; ctx.fillText('The Keepsake Vault', vx + vw / 2, vy + 22);
}

/* ================================================================== */
/* Big trees / landmarks hugging the library                           */
/* ================================================================== */
export function drawSideLandmark(ctx, kind, x, s, season, tint, t, seed, side) {
  ctx.save(); ctx.translate(x, 0); ctx.scale(s, s);
  const sway = Math.sin(t * 0.8 + seed) * 2;
  switch (kind) {
    case 'palm': {
      ctx.strokeStyle = tint('#8a6a4a'); ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(side * 16, -90, side * 6 + sway, -170); ctx.stroke();
      ctx.strokeStyle = tint('#6b4a34'); ctx.lineWidth = 1; for (let y = -10; y > -165; y -= 9) { const x2 = side * 16 * Math.sin((-y / 170) * Math.PI * 0.9) * 0.9; ctx.beginPath(); ctx.moveTo(x2 - 3, y); ctx.lineTo(x2 + 3, y - 2); ctx.stroke(); }
      const tx = side * 6 + sway; const ty = -172;
      for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.5; ctx.strokeStyle = tint(k % 2 ? '#4f8a44' : '#5e9c55'); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * 34, ty + Math.sin(a) * 30 - 10, tx + Math.cos(a) * 58, ty + Math.sin(a) * 24 + 26); ctx.stroke(); }
      circ(ctx, tx - 4, ty + 6, 4, tint('#7a5a3a')); circ(ctx, tx + 4, ty + 7, 4, tint('#6b4a34'));
      ctx.lineCap = 'butt';
      break;
    }
    case 'mushroom': {
      ctx.fillStyle = '#d8cfe8'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-4, -80, -6, -150); ctx.lineTo(6, -150); ctx.quadraticCurveTo(4, -80, 8, 0); ctx.fill();
      ctx.strokeStyle = '#b8aecb'; ctx.lineWidth = 1; for (let y = -20; y > -140; y -= 18) { ctx.beginPath(); ctx.moveTo(-6, y); ctx.lineTo(6, y - 4); ctx.stroke(); }
      const c = seed % 2 ? '#7de8d8' : '#b69cf0';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -150, 4, 0, -150, 80); g.addColorStop(0, c + '55'); g.addColorStop(1, c + '00'); ctx.fillStyle = g; ctx.fillRect(-80, -230, 160, 160); ctx.restore();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -150, 52, 30, 0, Math.PI, 0); ctx.quadraticCurveTo(0, -140, -52, -150); ctx.fill();
      for (let k = 0; k < 9; k++) circ(ctx, -38 + k * 9.5, -160 - Math.sin((k / 8) * Math.PI) * 14, 2.6, 'rgba(255,255,255,0.85)');
      for (let k = 0; k < 6; k++) { const a = t * 1.3 + k; circ(ctx, Math.cos(a + seed) * 40, -120 + Math.sin(a * 0.7) * 30, 1.4, `rgba(200,255,245,${0.4 + 0.4 * Math.sin(t * 3 + k)})`); }
      break;
    }
    case 'city': {
      // a neighbouring townhouse / clock tower hugs the library
      const w = 70; const x0 = side < 0 ? -w + 10 : -10;
      ctx.fillStyle = tint('#a8634a'); ctx.fillRect(x0, -260, w, 260);
      for (let y = -250; y < 0; y += 8) { ctx.fillStyle = tint('#955742'); ctx.fillRect(x0, y, w, 0.8); }
      for (let r2 = 0; r2 < 5; r2++) for (let c2 = 0; c2 < 2; c2++) { const wx = x0 + 14 + c2 * 30; const wy = -240 + r2 * 48; ctx.fillStyle = tint('#e8dcc4'); ctx.fillRect(wx - 2, wy - 2, 18, 26); ctx.fillStyle = seed % 3 === r2 % 3 ? '#ffd98a' : tint('#6f8fa0'); ctx.fillRect(wx, wy, 14, 22); ctx.fillStyle = tint('#e8dcc4'); ctx.fillRect(wx + 6.5, wy, 1, 22); }
      ctx.fillStyle = tint('#5a6b70'); ctx.beginPath(); ctx.moveTo(x0 - 4, -260); ctx.lineTo(x0 + w / 2, -290); ctx.lineTo(x0 + w + 4, -260); ctx.fill();
      break;
    }
    case 'pine': {
      ctx.fillStyle = tint('#5a3f2e'); ctx.fillRect(-4, -40, 8, 40);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = tint(season.bare ? (k % 2 ? '#e8eef4' : '#f7fafc') : k % 2 ? '#2f5f45' : '#3f6f4f'); ctx.beginPath(); ctx.moveTo(-36 + k * 5 + sway * 0.2, -30 - k * 34); ctx.lineTo(sway * 0.5, -90 - k * 34); ctx.lineTo(36 - k * 5 + sway * 0.2, -30 - k * 34); ctx.fill(); }
      if (season.bare) for (let k = 0; k < 5; k++) { ctx.fillStyle = tint('#3f6f4f'); ctx.beginPath(); ctx.moveTo(-20 + k * 3, -36 - k * 34); ctx.lineTo(sway * 0.5, -60 - k * 34); ctx.lineTo(20 - k * 3, -36 - k * 34); ctx.fill(); }
      break;
    }
    case 'cloud': {
      ctx.strokeStyle = tint('#f4f1ea'); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(side * 10, -70, 0, -140); ctx.stroke();
      const cols = ['#ffffff', '#fdeef4', '#eef6ff'];
      const Rn = rng(seed);
      for (let k = 0; k < 12; k++) circ(ctx, -40 + Rn() * 80 + sway, -150 - Rn() * 70, 16 + Rn() * 12, tint(cols[k % 3]));
      for (let k = 0; k < 4; k++) { const lx = -30 + k * 20; const ly = -120 - (k % 2) * 16; ctx.strokeStyle = tint('#d9b24c'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(lx, ly - 8); ctx.lineTo(lx, ly); ctx.stroke(); circ(ctx, lx, ly + 3, 3, ['#f28b82', '#ffd24a', '#9ec5f0', '#d4b3f0'][k]); }
      break;
    }
    default: return false;
  }
  ctx.restore();
  return true;
}

/* ================================================================== */
/* Roofs                                                               */
/* ================================================================== */
export function drawRoofFor(ctx, kind, y0, t, tod, name, opts, sty) {
  const cx = (BX0 + BX1) / 2;
  const peak = y0 - ROOF_H;
  const sign = (col = '#fff3dc', ink = '#6b4128', y = y0 - 32) => {
    const sw = 212, sh = 24;
    fillRR(ctx, cx - sw / 2 + 2, y + 3, sw, sh, 7, 'rgba(0,0,0,0.2)');
    fillRR(ctx, cx - sw / 2, y, sw, sh, 7, col);
    ctx.strokeStyle = ink; ctx.lineWidth = 2; rr(ctx, cx - sw / 2, y, sw, sh, 7); ctx.stroke();
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let fs = 13; ctx.font = `700 ${fs}px ${FONT}`; while (ctx.measureText(name).width > sw - 18 && fs > 8) { fs -= 0.5; ctx.font = `700 ${fs}px ${FONT}`; }
    ctx.fillText(name, cx, y + 12.5);
  };
  const lit = tod.dark > 0.3;
  switch (kind) {
    case 'lighthouse': {
      // tapered red-and-white tower cap, a gallery rail and the lamp room
      ctx.fillStyle = '#e9eef2'; ctx.beginPath(); ctx.moveTo(BX0 - 6, y0 + 4); ctx.lineTo(cx - 60, peak + 40); ctx.lineTo(cx + 60, peak + 40); ctx.lineTo(BX1 + 6, y0 + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d9534f'; ctx.beginPath(); ctx.moveTo(BX0 + 30, y0 - 26); ctx.lineTo(cx - 52, peak + 58); ctx.lineTo(cx + 52, peak + 58); ctx.lineTo(BX1 - 30, y0 - 26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2f4a63'; ctx.fillRect(cx - 70, peak + 36, 140, 6);
      ctx.strokeStyle = '#2f4a63'; ctx.lineWidth = 1.4; for (let x = cx - 66; x <= cx + 66; x += 8) { ctx.beginPath(); ctx.moveTo(x, peak + 36); ctx.lineTo(x, peak + 24); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(cx - 70, peak + 24); ctx.lineTo(cx + 70, peak + 24); ctx.stroke();
      fillRR(ctx, cx - 26, peak - 10, 52, 46, 3, lit ? '#fff3b0' : '#cfe6f2');
      ctx.strokeStyle = '#2f4a63'; ctx.lineWidth = 2; for (let x = cx - 26; x <= cx + 26; x += 13) { ctx.beginPath(); ctx.moveTo(x, peak - 10); ctx.lineTo(x, peak + 36); ctx.stroke(); }
      circ(ctx, cx, peak + 14, 8, lit ? '#ffffff' : '#fff7d0');
      ctx.fillStyle = '#d9534f'; ctx.beginPath(); ctx.moveTo(cx - 32, peak - 10); ctx.quadraticCurveTo(cx, peak - 46, cx + 32, peak - 10); ctx.closePath(); ctx.fill();
      circ(ctx, cx, peak - 38, 4, '#2f4a63');
      if (lit) {
        const a = t * 0.9;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const beam = (dir) => { const len = 300; const g = ctx.createLinearGradient(cx, peak + 14, cx + Math.cos(a) * len * dir, peak + 14); g.addColorStop(0, `rgba(255,240,170,${0.5 * tod.dark})`); g.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, peak + 14); ctx.lineTo(cx + Math.cos(a) * len * dir, peak + 14 - 34); ctx.lineTo(cx + Math.cos(a) * len * dir, peak + 14 + 34); ctx.closePath(); ctx.fill(); };
        beam(1); beam(-1); ctx.restore();
      }
      sign('#f4fbff', '#2f4a63');
      return { none: true };
    }
    case 'cave': {
      // the cavern roof slab: rock with roots and stalactites; the sign hangs on chains
      ctx.fillStyle = '#2a2436'; ctx.beginPath(); ctx.moveTo(BX0 - 30, y0 + 4); ctx.lineTo(BX0 - 50, peak + 30); ctx.quadraticCurveTo(cx, peak - 20, BX1 + 50, peak + 30); ctx.lineTo(BX1 + 30, y0 + 4); ctx.closePath(); ctx.fill();
      const Rn = rng(66); for (let k = 0; k < 30; k++) ell(ctx, BX0 - 30 + Rn() * (BX1 - BX0 + 60), peak + 30 + Rn() * (y0 - peak - 30), 6 + Rn() * 14, 3 + Rn() * 6, Rn() < 0.5 ? '#352e46' : '#221d2e');
      ctx.fillStyle = '#2a2436'; for (let x = BX0 - 20; x < BX1 + 20; x += 18) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + 6, y0 + 10 + ((x * 7) % 12)); ctx.lineTo(x + 12, y0); ctx.fill(); }
      ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 1.4; for (let k = 0; k < 5; k++) { const x = BX0 + 20 + k * 70; ctx.beginPath(); ctx.moveTo(x, peak + 26); ctx.quadraticCurveTo(x + 10, peak + 50, x - 4, peak + 80); ctx.stroke(); }
      for (let k = 0; k < 6; k++) { const x = BX0 + k * 64; const c = k % 2 ? 'rgba(125,232,216,0.9)' : 'rgba(182,156,240,0.9)'; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 4, peak + 36); ctx.lineTo(x, peak + 14 - (k % 3) * 6); ctx.lineTo(x + 4, peak + 36); ctx.fill(); }
      ctx.strokeStyle = '#8a8898'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 90, y0 - 34); ctx.lineTo(cx - 80, peak + 50); ctx.moveTo(cx + 90, y0 - 34); ctx.lineTo(cx + 80, peak + 50); ctx.stroke();
      sign('#2e2840', '#7de8d8', y0 - 38);
      return { none: true };
    }
    case 'dome': {
      // brass dome with a clock face, gears and steam pipes
      ctx.fillStyle = '#6b4520'; ctx.fillRect(BX0 - 10, y0 - 8, BX1 - BX0 + 20, 12);
      ctx.fillStyle = '#9c6a34'; ctx.beginPath(); ctx.moveTo(BX0 + 6, y0 - 6); ctx.quadraticCurveTo(BX0 + 10, peak + 10, cx, peak); ctx.quadraticCurveTo(BX1 - 10, peak + 10, BX1 - 6, y0 - 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#c99a4d'; ctx.lineWidth = 1.4; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 40, y0 - 6); ctx.quadraticCurveTo(cx + k * 28, peak + 20, cx, peak); ctx.stroke(); }
      circ(ctx, cx, peak + 54, 22, '#c99a4d'); circ(ctx, cx, peak + 54, 18, '#fbf6ea');
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ctx.fillStyle = '#3a3029'; ctx.fillRect(cx + Math.cos(a) * 15 - 0.8, peak + 54 + Math.sin(a) * 15 - 0.8, 1.6, 1.6); }
      ctx.strokeStyle = '#3a3029'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx, peak + 54); ctx.lineTo(cx + Math.cos(t * 0.5) * 12, peak + 54 + Math.sin(t * 0.5) * 12); ctx.moveTo(cx, peak + 54); ctx.lineTo(cx + Math.cos(t * 0.04) * 8, peak + 54 + Math.sin(t * 0.04) * 8); ctx.stroke();
      const gear = (gx, gy, r, sp) => { ctx.save(); ctx.translate(gx, gy); ctx.rotate(t * sp); ctx.fillStyle = '#b07a2e'; for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-r * 0.2, -r - 3, r * 0.4, 5); } circ(ctx, 0, 0, r, '#b07a2e'); circ(ctx, 0, 0, r * 0.35, '#6b4520'); ctx.restore(); };
      gear(cx - 70, peak + 70, 14, 0.8); gear(cx - 50, peak + 88, 9, -1.2); gear(cx + 72, peak + 72, 12, -0.7);
      ctx.fillStyle = '#6b4520'; ctx.fillRect(cx - 2, peak - 30, 4, 32); ctx.beginPath(); ctx.moveTo(cx - 8, peak - 30); ctx.lineTo(cx, peak - 44); ctx.lineTo(cx + 8, peak - 30); ctx.fill();
      ctx.fillStyle = '#5a4a3e'; ctx.fillRect(BX1 - 70, peak + 10, 10, 60); ctx.fillRect(BX1 - 50, peak + 26, 8, 44);
      sign('#3a3029', '#e8b85a');
      return { chimneyX: BX1 - 65, chimneyY: peak + 6, steam: true };
    }
    case 'castle': {
      // crenellated battlements and two turrets with pennants
      ctx.fillStyle = '#8e8a9c'; ctx.fillRect(BX0 - 10, y0 - 34, BX1 - BX0 + 20, 38);
      for (let x = BX0 - 10; x < BX1 + 10; x += 22) ctx.fillRect(x, y0 - 46, 13, 13);
      ctx.fillStyle = '#625e70'; ctx.fillRect(BX0 - 10, y0 - 6, BX1 - BX0 + 20, 3);
      for (const [tx, h] of [[BX0 + 4, 96], [BX1 - 4, 110]]) {
        ctx.fillStyle = '#9d99ab'; ctx.fillRect(tx - 18, y0 - h, 36, h);
        ctx.fillStyle = '#6d5fa3'; ctx.beginPath(); ctx.moveTo(tx - 22, y0 - h); ctx.lineTo(tx, y0 - h - 44); ctx.lineTo(tx + 22, y0 - h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e0b84f'; ctx.fillRect(tx - 0.8, y0 - h - 62, 1.6, 20); ctx.fillStyle = '#b33f40'; ctx.beginPath(); ctx.moveTo(tx + 0.8, y0 - h - 62); ctx.lineTo(tx + 18 + Math.sin(t * 3 + tx) * 2, y0 - h - 58); ctx.lineTo(tx + 0.8, y0 - h - 53); ctx.fill();
        fillRR(ctx, tx - 5, y0 - h + 20, 10, 16, 5, lit ? '#ffd98a' : '#4b3f58');
      }
      if (opts.winter) { ctx.fillStyle = '#f7fafc'; for (let x = BX0 - 10; x < BX1 + 10; x += 22) ctx.fillRect(x, y0 - 48, 13, 3); }
      sign('#4a1f2e', '#e0b84f', y0 - 30);
      ctx.save(); ctx.fillStyle = '#e0b84f'; ctx.font = `700 13px ${FONT}`; ctx.restore();
      return { none: true, perch: { x: cx + 40, y: y0 - 46 } };
    }
    case 'cloud': {
      // white marble drum with a gold onion dome and a star finial
      ctx.fillStyle = '#f1ede4'; ctx.fillRect(BX0 + 30, y0 - 50, BX1 - BX0 - 60, 54);
      for (let x = BX0 + 44; x < BX1 - 36; x += 36) { ctx.fillStyle = '#e0d8c6'; ctx.fillRect(x, y0 - 50, 6, 54); }
      ctx.fillStyle = '#d9b24c'; ctx.fillRect(BX0 + 24, y0 - 54, BX1 - BX0 - 48, 5);
      ctx.fillStyle = '#6fa8dc'; ctx.beginPath(); ctx.moveTo(BX0 + 40, y0 - 54); ctx.bezierCurveTo(BX0 + 30, peak + 20, cx - 20, peak + 10, cx, peak - 24); ctx.bezierCurveTo(cx + 20, peak + 10, BX1 - 30, peak + 20, BX1 - 40, y0 - 54); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d9b24c'; ctx.lineWidth = 1.4; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 34, y0 - 54); ctx.quadraticCurveTo(cx + k * 18, peak + 16, cx, peak - 24); ctx.stroke(); }
      for (let k = 0; k < 10; k++) star(ctx, BX0 + 60 + k * 26, y0 - 70 - Math.sin((k / 9) * Math.PI) * 40, 2, '#fff3b0');
      ctx.fillStyle = '#d9b24c'; ctx.fillRect(cx - 1.2, peak - 50, 2.4, 28); star(ctx, cx, peak - 54, 8 + Math.sin(t * 2) * 0.8, '#ffd24a');
      sign('#27496d', '#f2d27a', y0 - 34);
      return { none: true };
    }
    default: return null;
  }
}

/* ================================================================== */
/* Wall fixtures on the outside of every floor                         */
/* ================================================================== */
export function drawFixture(ctx, kind, x, y, side, dark, t, i) {
  // wall plate + bracket so nothing floats
  const wallX = x + side * 7;
  fillRR(ctx, wallX - 1.5 + (side < 0 ? -1 : 0), y - 15, 3, 10, 1, '#3a3440');
  ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(wallX, y - 12); ctx.quadraticCurveTo(x + side * 2, y - 16, x, y - 11); ctx.stroke();
  const glow = (col, r = 26, a = 0.5) => { if (dark < 0.3) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y - 3, 1, x, y - 3, r); g.addColorStop(0, `rgba(${col},${a * dark + Math.sin(t * 7 + i) * 0.03})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - 3 - r, r * 2, r * 2); ctx.restore(); };
  switch (kind) {
    case 'shiplamp':
      fillRR(ctx, x - 4, y - 10, 8, 3, 1, '#b08a3e'); fillRR(ctx, x - 3.5, y - 7, 7, 9, 1.5, dark > 0.3 ? '#ffe39a' : '#f3ead3');
      ctx.strokeStyle = '#8a6a2e'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 2); ctx.moveTo(x - 3.5, y - 2.5); ctx.lineTo(x + 3.5, y - 2.5); ctx.stroke();
      fillRR(ctx, x - 4, y + 2, 8, 2, 1, '#b08a3e'); glow('255,214,130'); break;
    case 'crystal':
      ctx.fillStyle = 'rgba(125,232,216,0.95)'; ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 4, y - 3); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y - 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 1.5, y - 3); ctx.lineTo(x, y - 1); ctx.fill();
      { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y - 3, 1, x, y - 3, 24); g.addColorStop(0, `rgba(125,232,216,${0.35 + 0.1 * Math.sin(t * 2 + i)})`); g.addColorStop(1, 'rgba(125,232,216,0)'); ctx.fillStyle = g; ctx.fillRect(x - 24, y - 27, 48, 48); ctx.restore(); }
      break;
    case 'gaslamp':
      fillRR(ctx, x - 4.5, y - 10, 9, 12, 1.5, '#2f2a33'); ctx.fillStyle = dark > 0.3 ? '#ffe39a' : '#dfe8e0'; ctx.fillRect(x - 3, y - 8, 6, 8);
      ctx.fillStyle = '#2f2a33'; ctx.beginPath(); ctx.moveTo(x - 5.5, y - 10); ctx.lineTo(x, y - 15); ctx.lineTo(x + 5.5, y - 10); ctx.fill(); glow('255,210,120'); break;
    case 'torch': {
      fillRR(ctx, x - 2.5, y - 8, 5, 10, 1, '#6b4128');
      const f = Math.sin(t * 9 + i * 1.7) * 1.2;
      ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.moveTo(x - 3, y - 8); ctx.quadraticCurveTo(x + f, y - 22, x + 3, y - 8); ctx.fill();
      ctx.fillStyle = '#fff0a0'; ctx.beginPath(); ctx.moveTo(x - 1.4, y - 8); ctx.quadraticCurveTo(x + f * 0.6, y - 15, x + 1.4, y - 8); ctx.fill();
      glow('255,170,80', 30, 0.55); break;
    }
    case 'orb': {
      const yy = y - 4 + Math.sin(t * 1.5 + i) * 2;
      const g = ctx.createRadialGradient(x, yy, 0, x, yy, 9); g.addColorStop(0, 'rgba(255,250,225,0.95)'); g.addColorStop(1, 'rgba(255,236,170,0)'); ctx.fillStyle = g; ctx.fillRect(x - 9, yy - 9, 18, 18); circ(ctx, x, yy, 3, '#fffbe8'); glow('255,240,200', 22, 0.4); break;
    }
    default: // cottage lantern
      fillRR(ctx, x - 3.5, y - 10, 7, 11, 1.5, '#3a3440');
      ctx.fillStyle = dark > 0.3 ? '#ffe39a' : '#f3ead3'; ctx.fillRect(x - 2.3, y - 8.5, 4.6, 7.5);
      ctx.fillStyle = '#3a3440'; ctx.beginPath(); ctx.moveTo(x - 4.5, y - 10); ctx.lineTo(x, y - 14); ctx.lineTo(x + 4.5, y - 10); ctx.fill();
      glow('255,214,130');
  }
}
