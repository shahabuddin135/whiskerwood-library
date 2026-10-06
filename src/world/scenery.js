// Sky, day/night cycle, parallax countryside, garden, underground vault, roof and construction.
import { W, BX0, BX1, FH, GROUND_H, ROOF_H, IX, IW, floorTop } from './layout.js';
import { rr, fillRR, ell, circ, shade, rng, star, drawMouse, coinIcon, drawCheese } from './draw.js';
import { drawFoundation, drawLawnDetail, drawLandscape } from './landscape.js';
import { texRect, texFill } from './textures.js';
import { glow } from './glow.js';
import { art, animArt } from './sprites.js';

const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';
export const DAY_CYCLE = 720; // seconds for a full day in game

const SKY = [
  [0.0, '#f3a58f', '#ffe1b0', 0.25],
  [0.07, '#8cc6ee', '#e3f3fb', 0],
  [0.45, '#78b5e8', '#f6ecce', 0],
  [0.56, '#7b78bd', '#f7b087', 0.12],
  [0.63, '#353a78', '#b27fa0', 0.4],
  [0.7, '#0f1a3d', '#2b3566', 0.62],
  [0.93, '#0f1a3d', '#2b3566', 0.62],
  [1.0, '#f3a58f', '#ffe1b0', 0.25],
];

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }
function mixRgb(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return A.map((v, i) => Math.round(v + (B[i] - v) * t)); }

export function timeOfDay(nowSec) {
  const phase = (nowSec % DAY_CYCLE) / DAY_CYCLE;
  let k = 0; while (k < SKY.length - 2 && SKY[k + 1][0] <= phase) k++;
  const [p0, t0, b0, d0] = SKY[k]; const [p1, t1, b1, d1] = SKY[k + 1];
  const f = (phase - p0) / (p1 - p0 || 1);
  return { phase, top: mix(t0, t1, f), bottom: mix(b0, b1, f), dark: d0 + (d1 - d0) * f, night: phase > 0.64 && phase < 0.97 };
}

/* ---------------- sky (screen space) ---------------- */
const starField = (() => { const R = rng(7); return Array.from({ length: 90 }, () => ({ x: R(), y: R() * 0.75, r: 0.4 + R() * 1.1, tw: R() * 6 })); })();
const clouds = (() => { const R = rng(11); return Array.from({ length: 7 }, (_, i) => ({ x: R() * 1.4 - 0.2, y: 0.05 + R() * 0.55, s: 0.6 + R() * 0.8, v: 0.004 + R() * 0.006, seed: i })); })();

// The stars are painted into three layers, each twinkling as one: three pictures a frame instead
// of ninety circles. (Painted at CSS-pixel resolution: they're little soft dots anyway.)
let starSky = null;
function starLayers(W, H) {
  if (starSky && starSky.W === W && starSky.H === H) return starSky.layers;
  const layers = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = Math.ceil(W); c.height = Math.ceil(H * 0.76); return c; });
  starField.forEach((s, k) => { const x = layers[k % 3].getContext('2d'); x.fillStyle = '#fffbe8'; x.beginPath(); x.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); x.fill(); });
  starSky = { W, H, layers };
  return layers;
}

export function drawSky(ctx, v, tod) {
  const g = ctx.createLinearGradient(0, 0, 0, v.H);
  g.addColorStop(0, tod.top); g.addColorStop(1, tod.bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, v.W, v.H);

  if (tod.dark > 0.15) {
    const a = Math.min(1, (tod.dark - 0.15) * 2);
    starLayers(v.W, v.H).forEach((c, k) => {
      ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(v.t * 2 + k * 2.1));
      ctx.drawImage(c, 0, 0, c.width, c.height);
    });
    ctx.globalAlpha = 1;
  }
  // Sun & moon travel in an arc.
  const arc = (p) => ({ x: v.W * (0.1 + 0.8 * p), y: v.H * (0.42 - Math.sin(p * Math.PI) * 0.34) });
  if (tod.phase < 0.64) {
    const p = tod.phase / 0.64; const s = arc(p);
    const sg = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 70);
    sg.addColorStop(0, 'rgba(255,245,200,0.9)'); sg.addColorStop(0.25, 'rgba(255,230,160,0.35)'); sg.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = sg; ctx.fillRect(s.x - 70, s.y - 70, 140, 140);
    circ(ctx, s.x, s.y, 16, '#fff3c4');
  } else {
    const p = (tod.phase - 0.64) / 0.36; const m = arc(p);
    const mg = ctx.createRadialGradient(m.x, m.y, 4, m.x, m.y, 50);
    mg.addColorStop(0, 'rgba(230,235,255,0.5)'); mg.addColorStop(1, 'rgba(230,235,255,0)');
    ctx.fillStyle = mg; ctx.fillRect(m.x - 50, m.y - 50, 100, 100);
    // crescent: the moon disc minus an offset disc, clipped to the moon
    ctx.save(); ctx.beginPath(); ctx.arc(m.x, m.y, 13, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.arc(m.x, m.y, 13, 0, Math.PI * 2); ctx.arc(m.x + 6, m.y - 4, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#f4f1e1'; ctx.fill('evenodd'); ctx.restore();
  }
}

export function drawClouds(ctx, v, tod, wet = 0) {
  let tint = tod.dark > 0.4 ? 'rgba(120,130,170,' : tod.phase > 0.53 && tod.phase < 0.66 ? 'rgba(255,205,190,' : 'rgba(255,255,255,';
  let alpha = tod.dark > 0.4 ? 0.35 : 0.85;
  if (wet > 0.3) { tint = tod.dark > 0.4 ? 'rgba(90,96,120,' : 'rgba(176,182,196,'; alpha = 0.92; }
  const list = wet > 0.3 ? clouds.concat(clouds.map((c) => ({ ...c, x: c.x + 0.45, y: c.y * 0.6 + 0.02, s: c.s * 1.2 }))) : clouds;
  const fill = tint + alpha + ')';
  for (const c of list) {
    const x = (((c.x + v.t * c.v * 0.1) % 1.4) - 0.2) * v.W;
    const y = c.y * v.H + v.camY * 0.04 * v.scale;
    const s = c.s * Math.min(1.4, v.W / 400);
    art(ctx, 'cloud|' + fill, CLOUD_BOX, paintCloud, fill, x, y, s);
  }
}
const CLOUD_BOX = [-35, -27, 78, 40];
function paintCloud(ctx, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 11, 0, 0, Math.PI * 2);
  ctx.ellipse(-16, -6, 16, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(8, -10, 20, 15, 0, 0, Math.PI * 2);
  ctx.ellipse(26, -2, 14, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------------- far countryside (parallax, world space) ---------------- */
// Two layers of hills, each in tiles of cached pictures (repainted only when the season or the
// light changes). Only the moving bits are drawn every frame: smoke, the windmill's sails, the
// lighthouse beam, the boat and the sparkles on the sea.
// `ctx` has the world transform; each layer shifts vertically for parallax.
const FAR_TILE = 440; const FAR_L = -1100; const FAR_R = 1540;
const FAR_TOP = -130; const FAR_BOT = 70;
const backHill = (x) => -70 - Math.sin(x * 0.012) * 26 - Math.sin(x * 0.031 + 1) * 10;
const frontHill = (x) => -34 - Math.sin(x * 0.02 + 2) * 14 - Math.cos(x * 0.045) * 6;
const HOUSES = [-150, -95, -40, 18, 60, 395, 445, 500, 560];
const farTint = (dark) => (hex, amt = 1) => mix(hex, '#1b2447', Math.min(0.85, dark * 1.15 * amt));

export function drawFar(ctx, v, tod, scene, t, season) {
  const darkQ = Math.round(tod.dark * 20) / 20;
  const tint = farTint(tod.dark);
  const L = v.worldLeft - 40; const R = v.worldRight + 40;
  const base = `${scene}|${season.key}|${season.hills.join()}|${season.trees.join()}|${darkQ}`;
  const layer = (p, back) => {
    ctx.save(); ctx.translate(0, (v.camY - v.camDefault) * (1 - p));
    for (let x0 = FAR_L; x0 < FAR_R; x0 += FAR_TILE) {
      if (x0 + FAR_TILE < L || x0 > R) continue;
      // tiles overlap by a hair so no seam shows between them
      art(ctx, `far${back ? 1 : 2}|${x0}|${base}`, [x0 - 1, FAR_TOP, FAR_TILE + 2, FAR_BOT - FAR_TOP], paintFarTile, { x0, back, scene, season, darkQ });
    }
    ctx.fillStyle = farTint(darkQ)(season.hills[back ? 0 : 1]); ctx.fillRect(L, FAR_BOT - 1, R - L, 3000); // the hillside below
    if (back) farLiveBack(ctx, scene, t, tod, tint, L, R);
    else farLiveFront(ctx, scene, t, tod, tint, L, R, season);
    ctx.restore();
  };
  layer(0.3, true);
  layer(0.55, false);
}

function paintFarTile(ctx, { x0, back, scene, season, darkQ }) {
  const tint = farTint(darkQ);
  const L = x0 - 30; const R = x0 + FAR_TILE + 30;
  const winter = season.key === 'winter';
  if (back) {
    ctx.fillStyle = tint(season.hills[0]);
    ctx.beginPath(); ctx.moveTo(L, FAR_BOT + 10);
    for (let x = Math.floor(L / 20) * 20; x <= R + 20; x += 20) ctx.lineTo(x, backHill(x));
    ctx.lineTo(R + 20, FAR_BOT + 10); ctx.closePath(); ctx.fill();
    if (scene === 'cove') { ctx.fillStyle = tint('#6fb3d6'); ctx.fillRect(L, -38, R - L, 60); drawLighthouse(ctx, W - 16, -40, darkQ, tint); }
    if (scene === 'castle') drawCastle(ctx, 10, -60, tint);
    return;
  }
  ctx.fillStyle = tint(season.hills[1]);
  ctx.beginPath(); ctx.moveTo(L, FAR_BOT + 10);
  for (let x = Math.floor(L / 16) * 16; x <= R + 16; x += 16) ctx.lineTo(x, frontHill(x));
  ctx.lineTo(R + 16, FAR_BOT + 10); ctx.closePath(); ctx.fill();
  // fields
  if ((scene === 'meadow' || scene === 'windmill') && !winter) {
    ctx.save(); ctx.globalAlpha = 0.55;
    const fieldCols = season.key === 'autumn' ? ['#e8b95a', '#c98f3e'] : ['#b9d77a', '#e8cf7a'];
    for (let k = 0, x = FAR_L; x < FAR_R; k++, x += 90) { if (x + 70 < L || x > R) continue; ctx.fillStyle = tint(fieldCols[k % 2]); ctx.fillRect(x, -18 + (k % 3) * 3, 70, 5); }
    ctx.restore();
  }
  // village cottages with glowing windows (their chimney smoke is drawn live)
  HOUSES.forEach((hx, k) => {
    if (hx < L - 30 || hx > R + 30) return;
    const hy = frontHill(hx) + 10; const w = 16 + (k % 3) * 4; const h = 12 + (k % 2) * 3;
    const body = ['#f3e3c3', '#e8d6f0', '#dfeccf', '#f6d2c6'][k % 4];
    ctx.fillStyle = tint(body); ctx.fillRect(hx - w / 2, hy - h, w, h);
    ctx.fillStyle = tint(winter ? '#f7fafc' : ['#b5523b', '#6d5fa3', '#4f7cac', '#8a5a3a'][k % 4]);
    ctx.beginPath(); ctx.moveTo(hx - w / 2 - 3, hy - h); ctx.lineTo(hx, hy - h - 9); ctx.lineTo(hx + w / 2 + 3, hy - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = tint('#7b5236'); ctx.fillRect(hx + w / 2 - 5, hy - h - 9, 3, 6);
    ctx.fillStyle = darkQ > 0.3 ? '#ffd98a' : tint('#bfe3f2'); ctx.fillRect(hx - w / 2 + 3, hy - h + 3, 4, 4); ctx.fillRect(hx + 1, hy - h + 3, 4, 4);
    ctx.fillStyle = tint('#6b4128'); ctx.fillRect(hx - 2, hy - 6, 4, 6);
  });
  // trees, scattered the same way whichever tile they land in
  const Rn = rng(5);
  for (let k = 0; k < 40; k++) {
    const x = FAR_L + Rn() * (FAR_R - FAR_L); const y = -22 - Rn() * 14;
    const rx = 6 + Rn() * 3; const ry = 7 + Rn() * 3; const col = season.trees[Math.floor(Rn() * season.trees.length)];
    if (x < L || x > R) continue;
    ctx.fillStyle = tint('#5b8a4a'); ctx.fillRect(x - 1, y, 2, 8);
    ell(ctx, x, y - 3, rx, ry, tint(col));
  }
  // sheep grazing on the hills
  if ((scene === 'meadow' || scene === 'windmill' || scene === 'castle') && !winter) {
    for (let k = 0; k < 6; k++) {
      const sx = -120 + k * 70 + (k > 2 ? 360 : 0);
      const sy = frontHill(sx) + 12 + (k % 2) * 4;
      ell(ctx, sx, sy - 3, 5, 3.4, tint('#fbf8f2')); circ(ctx, sx + 4.6 * (k % 2 ? 1 : -1), sy - 4, 1.8, tint('#3a3440'));
      ctx.fillStyle = tint('#3a3440'); ctx.fillRect(sx - 2.5, sy - 0.5, 1, 2); ctx.fillRect(sx + 1.5, sy - 0.5, 1, 2);
    }
  }
  if (scene === 'windmill') drawWindmillBody(ctx, W - 10, -30, 1.1, tint);
  if (scene === 'pond') { drawWillow(ctx, 12, -18, tint); drawWillow(ctx, W - 12, -22, tint); }
  if (scene === 'meadow') drawBarn(ctx, W - 18, -24, tint);
}

function farLiveBack(ctx, scene, t, tod, tint, L, R) {
  if (scene !== 'cove') return;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let k = 0; k < 14; k++) { const x = L + ((k * 53 + t * 6) % (R - L)); ctx.fillRect(x, -30 + (k % 4) * 6, 10, 1.2); }
  if (tod.dark > 0.3) lighthouseBeam(ctx, W - 16, -40, tod, t);
  drawBoat(ctx, 30 + ((t * 3) % 300) - 60, -36, tint);
}

function farLiveFront(ctx, scene, t, tod, tint, L, R) {
  // chimney smoke: every puff goes into one of three shapes by how faded it is (three draws in all)
  const puffs = [new Path2D(), new Path2D(), new Path2D()];
  HOUSES.forEach((hx, k) => {
    if (hx < L - 30 || hx > R + 30) return;
    const hy = frontHill(hx) + 10; const w = 16 + (k % 3) * 4; const h = 12 + (k % 2) * 3;
    for (let p = 0; p < 3; p++) {
      const ph = ((t * 0.25 + p / 3 + k * 0.13) % 1); const r = 2 + ph * 3;
      const px = hx + w / 2 - 3.5 + ph * 8; const py = hy - h - 12 - ph * 18;
      const path = puffs[Math.min(2, Math.floor(ph * 3))]; path.moveTo(px + r, py); path.arc(px, py, r, 0, Math.PI * 2);
    }
  });
  puffs.forEach((path, k) => { ctx.fillStyle = `rgba(230,228,240,${0.42 - k * 0.16})`; ctx.fill(path); });
  if (scene === 'windmill') {
    const darkQ = Math.round(tod.dark * 20) / 20;
    ctx.save(); ctx.translate(W - 10, -30 - 40 * 1.1); ctx.rotate(t * 0.9);
    art(ctx, `sails|${darkQ}`, [-44, -44, 88, 88], paintSails, darkQ, 0, 0, 1.1);
    ctx.restore();
  }
}

function drawWindmillBody(ctx, x, y, s, tint) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = tint('#efe3cf'); ctx.beginPath(); ctx.moveTo(-12, 20); ctx.lineTo(-8, -40); ctx.lineTo(8, -40); ctx.lineTo(12, 20); ctx.closePath(); ctx.fill();
  ctx.fillStyle = tint('#b5523b'); ctx.beginPath(); ctx.moveTo(-11, -38); ctx.lineTo(0, -54); ctx.lineTo(11, -38); ctx.closePath(); ctx.fill();
  fillRR(ctx, -3, 6, 6, 14, 3, tint('#7a4b2e'));
  ctx.restore();
}
// the four sails around the hub (the whole picture turns)
function paintSails(ctx, darkQ) {
  const tint = farTint(darkQ);
  for (let k = 0; k < 4; k++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = tint('#8a5a3a'); ctx.fillRect(-1, 0, 2, 40);
    ctx.fillStyle = tint('#f7efe0'); ctx.fillRect(1, 8, 8, 30);
    ctx.strokeStyle = tint('#c9b89a'); ctx.lineWidth = 0.6; for (let j = 12; j < 38; j += 6) { ctx.beginPath(); ctx.moveTo(1, j); ctx.lineTo(9, j); ctx.stroke(); }
  }
  circ(ctx, 0, 0, 3, tint('#5b3a26'));
}

function drawLighthouse(ctx, x, y, dark, tint) {
  ctx.save(); ctx.translate(x, y);
  ell(ctx, 0, 6, 26, 10, tint('#8a8577'));
  ctx.fillStyle = tint('#f4efe6'); ctx.beginPath(); ctx.moveTo(-9, 2); ctx.lineTo(-6, -58); ctx.lineTo(6, -58); ctx.lineTo(9, 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = tint('#d9534f'); [-44, -24, -4].forEach((yy) => { ctx.beginPath(); ctx.moveTo(-8.2 + (yy + 58) * -0.05, yy); ctx.lineTo(8.2 - (yy + 58) * -0.05, yy); ctx.lineTo(8.6, yy + 9); ctx.lineTo(-8.6, yy + 9); ctx.fill(); });
  fillRR(ctx, -8, -62, 16, 4, 1, tint('#3a3440'));
  fillRR(ctx, -5, -72, 10, 10, 2, dark > 0.3 ? '#fff3b0' : tint('#bfe3f2'));
  ctx.fillStyle = tint('#d9534f'); ctx.beginPath(); ctx.moveTo(-7, -72); ctx.lineTo(0, -80); ctx.lineTo(7, -72); ctx.fill();
  ctx.restore();
}
function lighthouseBeam(ctx, x, y, tod, t) {
  ctx.save(); ctx.translate(x, y);
  {
    const a = t * 0.9;
    ctx.globalCompositeOperation = 'lighter';
    const beam = (dir) => {
      const g = ctx.createLinearGradient(0, -67, Math.cos(a) * 220 * dir, -67);
      g.addColorStop(0, `rgba(255,240,170,${0.45 * tod.dark})`); g.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -67); ctx.lineTo(Math.cos(a) * 220 * dir, -67 - 26); ctx.lineTo(Math.cos(a) * 220 * dir, -67 + 26); ctx.closePath(); ctx.fill();
    };
    beam(1); beam(-1);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

function drawBoat(ctx, x, y, tint) {
  ctx.fillStyle = tint('#8a5a3a'); ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 7, y + 4); ctx.lineTo(x - 7, y + 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = tint('#fbf6ea'); ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 1); ctx.lineTo(x + 9, y - 1); ctx.closePath(); ctx.fill();
}

function drawCastle(ctx, x, y, tint) {
  const c = tint('#b9b3c9');
  ctx.fillStyle = c; ctx.fillRect(x - 20, y - 20, 40, 40);
  [-20, 12].forEach((dx) => { ctx.fillRect(x + dx, y - 44, 8, 64); ctx.fillStyle = tint('#6d5fa3'); ctx.beginPath(); ctx.moveTo(x + dx - 2, y - 44); ctx.lineTo(x + dx + 4, y - 58); ctx.lineTo(x + dx + 10, y - 44); ctx.fill(); ctx.fillStyle = c; });
  for (let k = 0; k < 5; k++) ctx.fillRect(x - 20 + k * 9, y - 25, 5, 6);
  fillRR(ctx, x - 5, y + 4, 10, 16, 5, tint('#4b3f58'));
}

function drawWillow(ctx, x, y, tint) {
  ctx.fillStyle = tint('#6b4a34'); ctx.fillRect(x - 2, y - 10, 4, 22);
  ell(ctx, x, y - 16, 20, 12, tint('#7fae62'));
  ctx.strokeStyle = tint('#6e9e55'); ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = -18; k <= 18; k += 4) { ctx.moveTo(x + k, y - 14); ctx.quadraticCurveTo(x + k + Math.sin(k) * 2, y, x + k * 1.1, y + 6); }
  ctx.stroke();
}

function drawBarn(ctx, x, y, tint) {
  ctx.fillStyle = tint('#b5523b'); ctx.fillRect(x - 14, y - 12, 28, 18);
  ctx.fillStyle = tint('#8e3b2d'); ctx.beginPath(); ctx.moveTo(x - 17, y - 12); ctx.lineTo(x, y - 24); ctx.lineTo(x + 17, y - 12); ctx.fill();
  ctx.strokeStyle = tint('#f4efe6'); ctx.lineWidth = 1; ctx.strokeRect(x - 5, y - 4, 10, 10);
  ctx.beginPath(); ctx.moveTo(x - 5, y - 4); ctx.lineTo(x + 5, y + 6); ctx.moveTo(x + 5, y - 4); ctx.lineTo(x - 5, y + 6); ctx.stroke();
}

/* ---------------- garden apron ---------------- */
// The lawn is painted once into a cached canvas (grass, path, flowers, pond, dock, lamp post,
// mailbox) and redrawn only when the season, the light or the zoom level changes. The fisher,
// ripples, cattails, fireflies, lamp glow and each site's garden are drawn live on top.
const G_X0 = -560; const G_X1 = 1000; const G_Y0 = -22; const G_Y1 = 95;
let groundCache = null;

function paintGroundStatic(ctx, scene, season, dark) {
  const L = G_X0; const R = G_X1;
  const tint = (hex) => mix(hex, '#1b2447', Math.min(0.75, dark * 1.05));
  const winter = season.key === 'winter';
  // grass apron
  const gg = ctx.createLinearGradient(0, 0, 0, 90);
  gg.addColorStop(0, tint(season.grass[0])); gg.addColorStop(1, tint(season.grass[1]));
  ctx.fillStyle = gg; ctx.fillRect(L, -2, R - L, 92);
  // a soft carpet of grass blades (or trodden snow) over the whole lawn
  texRect(ctx, winter ? 'plaster' : 'grass', L, -2, R - L, 92, winter ? 0.8 : 1);
  // gently mown stripes
  if (!winter) { ctx.fillStyle = 'rgba(255,255,255,0.035)'; for (let x = Math.floor(L / 60) * 60; x < R; x += 60) ctx.fillRect(x, 0, 30, 90); }
  if (winter) { const Rs = rng(4); for (let k = 0; k < 60; k++) ell(ctx, L + Rs() * (R - L), 10 + Rs() * 75, 8 + Rs() * 14, 1.6, tint('#ffffff')); }
  // path
  ctx.fillStyle = tint(winter ? '#e8e1d6' : '#d9c29a'); ctx.beginPath(); ctx.moveTo(190, 0); ctx.quadraticCurveTo(170, 50, 205, 90); ctx.lineTo(250, 90); ctx.quadraticCurveTo(222, 50, 232, 0); ctx.closePath(); ctx.fill();
  texFill(ctx, 'soil', 0.8);
  { const Rs = rng(12); for (let y = 6; y < 88; y += 9) { ell(ctx, 190 - (y / 90) * 8 + Rs() * 3, y, 3, 1.6, tint('#bfae8a')); ell(ctx, 234 + (y / 90) * 14 - Rs() * 3, y, 3, 1.6, tint('#bfae8a')); } }
  drawFoundation(ctx, scene, tint, winter);
  drawLawnDetail(ctx, scene, season, tint, L, R, 3);
  drawLandscape(ctx, scene, 0, { dark }, season, tint, 290, 452, false);
  // flowers (seasonal)
  const Rn = rng(21);
  const fcols = season.flowers;
  const stem = tint(season.key === 'autumn' ? '#8a7a3a' : '#4f8a44');
  for (let k = 0; k < 140 && fcols.length; k++) {
    const x = L + Rn() * (R - L); const y = 8 + Rn() * 78;
    if (x > 20 && x < 175 && y > 20 && y < 80) continue; // pond area
    ctx.strokeStyle = stem; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ((k % 3) - 1) * 0.6, y - 5); ctx.stroke();
    circ(ctx, x + ((k % 3) - 1) * 0.6, y - 5.5, 1.8, tint(fcols[k % fcols.length]));
  }
  // pond (frozen in winter)
  ell(ctx, 96, 50, 78, 25, tint(winter ? '#a9c9dc' : '#5f9fb8'));
  ell(ctx, 96, 48, 72, 21, tint(winter ? '#dcecf5' : '#79b8cf'));
  if (winter) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8;
    for (let k = 0; k < 5; k++) { const x = 50 + k * 22; ctx.beginPath(); ctx.moveTo(x, 44 + k * 3); ctx.lineTo(x + 14, 42 + k * 3); ctx.stroke(); }
    ell(ctx, 118, 47, 6, 2.2, tint('#4a7f9c'));
  } else [[70, 56], [120, 42], [140, 58]].forEach(([x, y], k) => { ell(ctx, x, y, 7, 3, tint('#5e9c55')); circ(ctx, x + 2, y - 1.5, k === 1 ? 1.8 : 0, tint('#f7a8c4')); });
  // dock
  ctx.fillStyle = tint('#9a6b45'); ctx.fillRect(140, 38, 44, 6); ctx.fillStyle = tint('#7a4b2e'); ctx.fillRect(146, 44, 3, 12); ctx.fillRect(176, 44, 3, 12);
  // lamp post + mailbox
  ctx.fillStyle = tint('#3a3440'); ctx.fillRect(255, -6, 3, 50); fillRR(ctx, 250, -16, 13, 12, 3, tint('#3a3440'));
  circ(ctx, 256.5, -10, 3.6, dark > 0.3 ? '#fff0a8' : tint('#f0e6c8'));
  ctx.fillStyle = tint('#7a4b2e'); ctx.fillRect(284, 20, 3, 26); fillRR(ctx, 276, 8, 20, 13, 5, tint('#4f7cac')); ctx.fillStyle = tint('#e0404f'); ctx.fillRect(292, 4, 2, 9); ctx.fillRect(292, 4, 6, 3);
}

// px: the pixels per world unit the cache should be painted at; stable: false while zooming.
export function drawGround(ctx, v, tod, scene, t, fisher, season, px = 2, stable = true) {
  const dark = tod.dark;
  const darkQ = Math.round(dark * 20) / 20;
  const base = `${scene}|${season.key}|${season.grass.join()}|${season.flowers.join()}|${darkQ}`;
  const key = `${base}|${px}`;
  if (!groundCache || (groundCache.key !== key && (stable || groundCache.base !== base))) {
    const c = groundCache?.c || document.createElement('canvas');
    const w = Math.ceil((G_X1 - G_X0) * px); const h = Math.ceil((G_Y1 - G_Y0) * px);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
    x.setTransform(px, 0, 0, px, -G_X0 * px, -G_Y0 * px);
    paintGroundStatic(x, scene, season, darkQ);
    groundCache = { key, base, c };
  }
  ctx.drawImage(groundCache.c, G_X0, G_Y0, G_X1 - G_X0, G_Y1 - G_Y0);

  const tint = (hex) => mix(hex, '#1b2447', Math.min(0.75, dark * 1.05));
  const winter = season.key === 'winter';
  // ripples on the pond
  if (!winter && v.worldLeft < 190) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath();
    for (let k = 0; k < 5; k++) { const x = 50 + ((k * 31 + t * 5) % 100); ctx.moveTo(x, 44 + k * 3); ctx.lineTo(x + 8, 44 + k * 3); }
    ctx.stroke();
  }
  // cattails
  ctx.strokeStyle = tint(winter || season.key === 'autumn' ? '#9a8a5a' : '#4f8a44'); ctx.lineWidth = 1; ctx.beginPath();
  for (let k = 0; k < 5; k++) { const x = 22 + k * 4; ctx.moveTo(x, 58); ctx.lineTo(x + Math.sin(t * 1.3 + k) * 1.5, 34 - k * 2); }
  ctx.stroke();
  ctx.fillStyle = tint('#7a4b2e'); ctx.beginPath(); // all five cattail heads in one shape
  for (let k = 0; k < 5; k++) { const x = 22 + k * 4 + Math.sin(t * 1.3 + k) * 1.5; ctx.moveTo(x + 1.6, 34 - k * 2); ctx.ellipse(x, 34 - k * 2, 1.6, 4, 0, 0, Math.PI * 2); }
  ctx.fill();
  // fisher mouse
  const bite = fisher.bite;
  drawMouse(ctx, 164, 38, { fur: '#a98467', belly: '#ecd9c6', dir: -1, pose: 'sit', t, hat: 'sunhat', hatCol: '#e8cf8a', scarf: '#5b7f4d', noShadow: true });
  ctx.strokeStyle = tint('#5b3a26'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(152, 26); ctx.lineTo(120, 4 + (bite ? 6 : 0)); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(120, 4 + (bite ? 6 : 0)); ctx.lineTo(118, 46); ctx.stroke();
  circ(ctx, 118, 46 + Math.sin(t * 3) * 0.8 + (bite ? 2 : 0), 1.8, '#e0404f');
  if (bite) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(118, 48, 6 + (t * 8) % 6, 2, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (dark > 0.3) {
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 256, -10, 50, '255,220,140', dark * 0.6); ctx.globalCompositeOperation = 'source-over';
  }
  // each site's garden landscaping on the right of the garden
  if (v.worldRight + 40 > 290 && v.worldLeft - 40 < 460) drawLandscape(ctx, scene, t, tod, season, tint, 290, 452, true);
  // fireflies at night
  if (dark > 0.35 && !winter) {
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 8; k++) {
      const x = 20 + ((k * 67 + Math.sin(t * 0.7 + k) * 30) % 400); const y = 10 + ((k * 23) % 60) + Math.sin(t * 1.3 + k * 2) * 8;
      glow(ctx, x, y, 6, '230,255,150', (0.5 + 0.5 * Math.sin(t * 3 + k)) * dark, -Infinity, Infinity, 'hard');
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

/* ---------------- roof ---------------- */
export function drawRoof(ctx, topY, t, tod, name, opts = {}) {
  const cx = (BX0 + BX1) / 2;
  const y0 = topY; // top of highest floor
  const peak = y0 - ROOF_H;
  const ox = 18;
  // chimney
  ctx.fillStyle = '#9b5a44'; ctx.fillRect(BX1 - 90, peak + 26, 22, 60);
  ctx.fillStyle = '#7d4535'; ctx.fillRect(BX1 - 94, peak + 22, 30, 8);
  // roof body
  ctx.fillStyle = '#b5523b';
  ctx.beginPath(); ctx.moveTo(BX0 - ox, y0 + 4); ctx.lineTo(cx, peak); ctx.lineTo(BX1 + ox, y0 + 4); ctx.closePath(); ctx.fill();
  // tiles
  ctx.save(); ctx.beginPath(); ctx.moveTo(BX0 - ox, y0 + 4); ctx.lineTo(cx, peak); ctx.lineTo(BX1 + ox, y0 + 4); ctx.closePath(); ctx.clip();
  for (let y = peak + 6, row = 0; y < y0 + 4; y += 9, row++) {
    for (let x = BX0 - ox + (row % 2) * 7; x < BX1 + ox; x += 14) {
      ctx.fillStyle = row % 3 === 0 ? '#a64a35' : '#c25b42';
      ctx.beginPath(); ctx.arc(x + 7, y, 7, 0, Math.PI); ctx.fill();
    }
  }
  ctx.restore();
  ctx.strokeStyle = '#8e3b2d'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(BX0 - ox, y0 + 4); ctx.lineTo(cx, peak); ctx.lineTo(BX1 + ox, y0 + 4); ctx.stroke();
  if (opts.winter) {
    // snow blanket + icicles
    ctx.fillStyle = '#f7fafc';
    ctx.beginPath(); ctx.moveTo(BX0 - ox - 2, y0 + 2); ctx.lineTo(cx, peak - 4); ctx.lineTo(BX1 + ox + 2, y0 + 2);
    ctx.lineTo(BX1 + ox - 10, y0 - 4); ctx.lineTo(cx, peak + 12); ctx.lineTo(BX0 - ox + 10, y0 - 4); ctx.closePath(); ctx.fill();
    fillRR(ctx, BX1 - 95, peak + 16, 32, 8, 4, '#f7fafc');
    ctx.fillStyle = 'rgba(220,238,250,0.95)';
    for (let x = BX0 - ox + 6; x < BX1 + ox - 4; x += 13) { const l = 4 + ((x * 7) % 9); ctx.beginPath(); ctx.moveTo(x - 2, y0 + 4); ctx.lineTo(x + 2, y0 + 4); ctx.lineTo(x, y0 + 4 + l); ctx.fill(); }
  }
  if (opts.fair) {
    // festival bunting along the eaves
    const cols = ['#f28b82', '#ffd24a', '#a3d9a5', '#9ec5f0', '#d4b3f0'];
    [[BX0 - ox + 4, y0], [BX1 + ox - 4, y0]].forEach(([ex, ey]) => {
      const n = 9;
      for (let k = 0; k < n; k++) {
        const a = k / n; const b = (k + 1) / n;
        const x1 = ex + (cx - ex) * a; const y1 = ey + (peak + 8 - ey) * a + Math.sin(a * Math.PI) * 10;
        const x2 = ex + (cx - ex) * b; const y2 = ey + (peak + 8 - ey) * b + Math.sin(b * Math.PI) * 10;
        ctx.fillStyle = cols[k % cols.length];
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo((x1 + x2) / 2, (y1 + y2) / 2 + 9 + Math.sin(k * 1.3) * 1.5); ctx.closePath(); ctx.fill();
      }
    });
  }
  // round attic window glowing at night
  circ(ctx, cx, peak + 52, 17, '#6b4128');
  circ(ctx, cx, peak + 52, 13, tod.dark > 0.3 ? '#ffd98a' : '#bfe3f2');
  ctx.strokeStyle = '#6b4128'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 13, peak + 52); ctx.lineTo(cx + 13, peak + 52); ctx.moveTo(cx, peak + 39); ctx.lineTo(cx, peak + 65); ctx.stroke();
  // sign board
  const sw = 190, sh = 24;
  fillRR(ctx, cx - sw / 2, y0 - 32, sw, sh, 7, '#fff3dc');
  ctx.strokeStyle = '#6b4128'; ctx.lineWidth = 2; rr(ctx, cx - sw / 2, y0 - 32, sw, sh, 7); ctx.stroke();
  ctx.fillStyle = '#6b4128'; ctx.font = `700 13px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name, cx, y0 - 19.5);
  // (the weathervane mouse is drawn live by drawRoofLive)
  void t;
  return { chimneyX: BX1 - 79, chimneyY: peak + 20 };
}

/* ---------------- construction site ---------------- */
export function drawConstruction(ctx, i, t, progress, remaining) {
  const y0 = floorTop(i);
  ctx.save(); ctx.translate(BX0, y0);
  ctx.fillStyle = '#7b5236'; ctx.fillRect(0, 0, 8, FH); ctx.fillRect(BX1 - BX0 - 8, 0, 8, FH);
  ctx.translate(8, 0);
  ctx.fillStyle = '#eadfca'; ctx.fillRect(0, 0, IW, 148);
  ctx.fillStyle = '#d9cbb0'; for (let x = 0; x < IW; x += 30) ctx.fillRect(x, 0, 1, 148);
  // blueprint
  fillRR(ctx, 150, 22, 90, 58, 3, '#3d6fa8');
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.8;
  ctx.strokeRect(160, 32, 70, 38); ctx.beginPath(); ctx.moveTo(160, 50); ctx.lineTo(230, 50); ctx.moveTo(195, 32); ctx.lineTo(195, 70); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `600 7px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('NEW FLOOR PLAN', 195, 29);
  // floor + beam
  ctx.fillStyle = '#b98457'; ctx.fillRect(0, 148, IW, 24);
  ctx.fillStyle = '#5b3a26'; ctx.fillRect(-8, 172, IW + 16, 18);
  // scaffolding
  ctx.strokeStyle = '#a0764f'; ctx.lineWidth = 3;
  [30, 110, 250, 330].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, 170); ctx.stroke(); });
  ctx.lineWidth = 4; [60, 110].forEach((y) => { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(340, y); ctx.stroke(); });
  ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(30, 60); ctx.lineTo(110, 110); ctx.moveTo(250, 110); ctx.lineTo(330, 60); ctx.stroke();
  // crates & planks
  fillRR(ctx, 50, 146, 26, 20, 2, '#b98a5a'); ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 1; ctx.strokeRect(50, 146, 26, 20);
  fillRR(ctx, 270, 158, 60, 5, 1, '#c9a070'); fillRR(ctx, 275, 153, 52, 5, 1, '#b98a5a');
  // builders
  drawMouse(ctx, 140, 169, { fur: '#a98467', belly: '#ecd9c6', pose: 'hammer', t, hat: 'hardhat', vest: '#f28c28', dir: 1 });
  drawMouse(ctx, 222, 108, { fur: '#8f7f73', belly: '#d9cdc2', pose: 'hammer', t: t + 0.3, hat: 'hardhat', vest: '#f28c28', dir: -1 });
  // progress banner
  fillRR(ctx, 96, 120, 160, 22, 11, 'rgba(40,28,20,0.78)');
  fillRR(ctx, 100, 124, 152 * progress, 14, 7, '#7cc46b');
  ctx.fillStyle = '#fff'; ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`Building… ${remaining}`, 176, 131.5);
  ctx.restore();
}

/* ---------------- "build next floor" balloon sign ---------------- */
// The board and its balloons are cached pictures (the board's text is only measured when it
// changes); the bob and the glow when you can afford it are live.
export function drawBuildSign(ctx, y, t, name, costText, affordable, head = '➕ BUILD A NEW FLOOR', coin = true) {
  const cx = (BX0 + BX1) / 2;
  const bob = Math.sin(t * 1.6) * 4;
  const sy = y + bob;
  const w = 200, h = 62;
  animArt(ctx, 'signBalloons', BALLOON_BOX, paintBalloons, 0, t, (Math.PI * 2) / 1.2, 8, cx, sy);
  if (affordable) glow(ctx, cx, sy + 11, 130, '255,230,140', 0.35 + 0.15 * Math.sin(t * 4));
  art(ctx, `sign|${head}|${name}|${costText}|${affordable ? 1 : 0}|${coin ? 1 : 0}`, SIGN_BOX, paintSignBoard, { head, name, costText, affordable, coin }, cx, sy);
  return { x0: cx - w / 2, x1: cx + w / 2, y0: sy - 80, y1: sy + h - 20 };
}
const SIGN_BOX = [-102, -22, 204, 66];
function paintSignBoard(ctx, { head, name, costText, affordable, coin }) {
  const w = 200, h = 62;
  fillRR(ctx, -w / 2, -20, w, h, 10, '#8a5a3a');
  fillRR(ctx, -w / 2 + 4, -16, w - 8, h - 8, 8, affordable ? '#fff3dc' : '#eadfcb');
  ctx.fillStyle = '#6b4128'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 11px ${FONT}`; ctx.fillText(head, 0, -5);
  ctx.font = `600 13px ${FONT}`; ctx.fillStyle = '#3d2a1e'; ctx.fillText(name, 0, 11);
  ctx.font = `700 12px ${FONT}`; ctx.fillStyle = affordable ? '#2f8a3a' : '#a0522d';
  const tw = ctx.measureText(costText).width;
  if (coin) { coinIcon(ctx, -tw / 2 - 7, 27, 5); ctx.fillText(costText, 4, 27.5); }
  else ctx.fillText(costText, 0, 27.5);
}
const BALLOON_BOX = [-88, -88, 176, 70];
function paintBalloons(ctx, _, t) {
  [[-70, '#f28b82'], [70, '#9ec5f0'], [-52, '#ffd24a'], [52, '#a3d9a5']].forEach(([dx, col], k) => {
    const bx = dx + Math.sin(t * 1.2 + k) * 3; const by = -58 - (k > 1 ? 10 : 0);
    ctx.strokeStyle = 'rgba(80,60,40,0.6)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(bx, by + 13); ctx.quadraticCurveTo(bx + 4, by + 30, dx * 0.8, -20); ctx.stroke();
    ell(ctx, bx, by, 10, 13, col); ell(ctx, bx - 3.5, by - 5, 2.5, 4, 'rgba(255,255,255,0.5)');
  });
}

export function drawComplete(ctx, y, t) {
  const cx = (BX0 + BX1) / 2;
  ctx.fillStyle = '#fff3dc'; ctx.font = `700 14px ${FONT}`; ctx.textAlign = 'center';
  star(ctx, cx - 90, y + Math.sin(t * 2) * 3, 7, '#ffd24a'); star(ctx, cx + 90, y + Math.cos(t * 2) * 3, 7, '#ffd24a');
  ctx.strokeStyle = 'rgba(107,65,40,0.8)'; ctx.lineWidth = 3; ctx.strokeText('The library is complete!', cx, y + 4); ctx.fillText('The library is complete!', cx, y + 4);
}
