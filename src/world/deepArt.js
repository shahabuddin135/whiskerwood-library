// Everything under the lawn: soil layers with fossils, the Cheese & Coin Vault, and the Deep Stacks
// maze below it. Dug cells are painted once into cached canvases; moles, readers, lights and the
// dragon are drawn live.
import { GROUND_H } from './layout.js';
import { rr, fillRR, ell, circ, shade, rng, star, drawMouse, coinIcon, drawCheese } from './draw.js';
import { drawMole, drawDragon, drawRex, drawSauropod, drawAmmonite, drawTrilobite, drawBone, drawFossil } from './creatures.js';
import { texRect, texFill, tex } from './textures.js';
import {
  DEEP_COLS, DEEP_ROWS, DEEP_TOP, DEEP_BOTTOM, CELL_W, CELL_H, cellX, cellY, cellId, cellKind, HALLS, FOSSIL_AT, FOSSILS,
} from '../data/deep.js';
import { fmtTime } from '../core/format.js';
import { glow } from './glow.js';
import { art } from './sprites.js';
import { bizTier } from '../data/mole.js';
import { paintBizWall, paintBiz, drawBizLive, drawToLet, paintLiftTop, drawLift, drawCommuters, liftHit } from './moleArt.js';

const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';
const VAULT = { x: 150, y: 120, w: 170, h: 80 };
export const VAULT_BOX = { x0: VAULT.x, x1: VAULT.x + VAULT.w, y0: VAULT.y, y1: VAULT.y + VAULT.h };
const SHAFT_X = 208;

// Soil colour by depth (lighter topsoil → dark umber near the dragon).
function soilAt(y) {
  const stops = [[90, [122, 86, 56]], [262, [100, 70, 48]], [600, [78, 56, 44]], [900, [62, 44, 40]], [1200, [58, 36, 32]]];
  let k = 0; while (k < stops.length - 2 && stops[k + 1][0] <= y) k++;
  const [y0, a] = stops[k]; const [y1, b] = stops[k + 1];
  const f = Math.max(0, Math.min(1, (y - y0) / (y1 - y0)));
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',')})`;
}

const B_X0 = -560; const B_X1 = 1000; const B_Y0 = 90; const B_Y1 = DEEP_TOP + 2;
const CELL_CACHE_PX = 5.5e6; // painted cells kept in memory, by total pixels (least recently used go first)

export class DeepView {
  constructor(world) { this.w = world; this.cache = new Map(); this.frontier = []; this.band = null; }
  clear() { this.cache.clear(); if (this.band) this.band.key = ''; }
  get game() { return this.w.game; }

  // Deepest point the camera may scroll to.
  bottom() {
    const d = this.game.s.deep;
    if (!d.open) return GROUND_H;
    let maxR = 0;
    for (const id of Object.keys(d.dug)) maxR = Math.max(maxR, +id.split(',')[1]);
    for (const j of d.jobs) maxR = Math.max(maxR, j.r);
    return Math.min(DEEP_BOTTOM + 40, cellY(Math.min(DEEP_ROWS, maxR + 2)) + 24);
  }

  /* ---------------- drawing ---------------- */
  // px: pixels per world unit for the cached pictures; stable: false while zooming.
  // tint / dark: the garden's night colouring (for the lift house on the lawn).
  draw(ctx, view, t, coins, px = 2, stable = true, tint = (c) => c, dark = 0) {
    const d = this.game.s.deep;
    // the soil band under the lawn (soil, roots, fossils and the vault) is one cached picture
    if (view.bottom >= 90 && view.top < B_Y1) {
      const lv = Math.round(Math.max(0, Math.min(1, Math.log10(Math.max(1, coins)) / 16)) * 40) / 40;
      const base = `${d.open ? 1 : 0}|${d.lift ? 1 : 0}|${lv}`; const key = `${base}|${px}`;
      if (!this.band || !this.band.key || (this.band.key !== key && (stable || this.band.base !== base))) {
        const c = this.band?.c || document.createElement('canvas');
        const w = Math.ceil((B_X1 - B_X0) * px); const h = Math.ceil((B_Y1 - B_Y0) * px);
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
        x.setTransform(px, 0, 0, px, -B_X0 * px, -B_Y0 * px);
        this.paintBand(x, lv);
        this.band = { c, key, base };
      }
      ctx.drawImage(this.band.c, B_X0, B_Y0, B_X1 - B_X0, B_Y1 - B_Y0);
      this.drawVaultLive(ctx, t);
    }
    if (view.bottom >= B_Y1) this.drawBelow(ctx, view, t, px, stable);
    // Mole City: the Grand Lift and everyone walking the tunnels
    if (d.open && d.lift) { drawLift(ctx, view, t, d.lift, tint, dark); if (view.bottom >= B_Y1) drawCommuters(ctx, view, t, d); }
  }

  drawBelow(ctx, view, t, px, stable) {
    const d = this.game.s.deep;
    // soil beyond the maze (or everywhere, before the trapdoor is found)
    const y0 = Math.max(B_Y1 - 1, view.top - 10); const y1 = view.bottom + 10;
    const L = view.worldLeft - 20; const R = view.worldRight + 20;
    const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, soilAt(y0)); g.addColorStop(1, soilAt(y1));
    ctx.fillStyle = g;
    if (!d.open) { ctx.fillRect(L, y0, R - L, y1 - y0); texRect(ctx, 'soil', L, y0, R - L, y1 - y0, 1); return; }
    const gx0 = cellX(0); const gx1 = cellX(DEEP_COLS);
    if (L < gx0) ctx.fillRect(L, y0, gx0 - L, y1 - y0);
    if (R > gx1) ctx.fillRect(gx1, y0, R - gx1, y1 - y0);
    if (y1 > DEEP_BOTTOM) ctx.fillRect(Math.max(L, gx0), Math.max(y0, DEEP_BOTTOM), Math.min(R, gx1) - Math.max(L, gx0), y1 - Math.max(y0, DEEP_BOTTOM));
    this.drawCells(ctx, view, t, px, stable);
  }

  paintBand(ctx, lv) {
    const L = B_X0; const R = B_X1; const top = B_Y0; const bot = B_Y1;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, soilAt(top)); g.addColorStop(1, soilAt(bot));
    ctx.fillStyle = g; ctx.fillRect(L, top, R - L, bot - top);
    texRect(ctx, 'soil', L, top, R - L, bot - top, 1);
    ctx.fillStyle = '#5f4029'; ctx.fillRect(L, 90, R - L, 5);
    // grass roots dangling from the lawn
    ctx.strokeStyle = 'rgba(160,125,90,0.55)'; ctx.lineWidth = 1.1;
    for (let x = Math.floor(L / 37) * 37; x < R; x += 37) { const h = 12 + ((x * 7) % 17); ctx.beginPath(); ctx.moveTo(x, 94); ctx.bezierCurveTo(x + 4, 100, x - 3, 100 + h * 0.6, x + 2, 94 + h); ctx.stroke(); }
    // a strata band
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.beginPath(); ctx.moveTo(L, 236); for (let x = L; x <= R; x += 30) ctx.lineTo(x, 236 + Math.sin(x * 0.013) * 5); ctx.lineTo(R, 248); ctx.lineTo(L, 248); ctx.closePath(); ctx.fill();
    this.drawFossilBeds(ctx);
    this.drawVault(ctx, lv);
    if (this.game.s.deep.open) {
      // the shaft from the trapdoor down to the entrance cell
      ctx.fillStyle = '#2d1e16'; ctx.fillRect(SHAFT_X, VAULT.y + VAULT.h - 4, 26, B_Y1 - (VAULT.y + VAULT.h) + 4);
      this.ladder(ctx, SHAFT_X + 5, VAULT.y + VAULT.h - 4, B_Y1);
      if (this.game.s.deep.lift) paintLiftTop(ctx);
    }
  }

  ladder(ctx, x, y0, y1) {
    ctx.fillStyle = '#9a6b45'; ctx.fillRect(x, y0, 2.2, y1 - y0); ctx.fillRect(x + 14, y0, 2.2, y1 - y0);
    ctx.fillStyle = '#b98457'; for (let y = y0 + 6; y < y1; y += 9) ctx.fillRect(x, y, 16, 2);
  }

  // Decorative fossils in the upper soil, visible from day one.
  drawFossilBeds(ctx) {
    drawRex(ctx, -210, 214, 1);
    drawSauropod(ctx, 700, 222, 1);
    drawAmmonite(ctx, 20, 150, 9); drawAmmonite(ctx, 420, 176, 7); drawAmmonite(ctx, 880, 150, 10);
    drawTrilobite(ctx, 90, 222, 1.1, 0.4); drawTrilobite(ctx, 360, 232, 0.9, -0.6); drawTrilobite(ctx, -400, 150, 1, 1.1);
    drawBone(ctx, 60, 190, 12, 0.3); drawBone(ctx, 470, 128, 10, -0.5); drawBone(ctx, -40, 132, 9, 1.2); drawBone(ctx, 560, 150, 11, 0.1);
    // buried odds and ends
    ctx.save(); ctx.translate(-330, 128); ctx.rotate(0.3); fillRR(ctx, -6, -4, 12, 8, 2, '#6b5a4a'); fillRR(ctx, 2, -8, 5, 6, 2, '#6b5a4a'); ctx.restore(); // old boot
    ell(ctx, 520, 238, 7, 4.5, '#b9c7d6'); ell(ctx, 520, 236, 4, 1.4, '#e8eef4'); ctx.fillStyle = '#9aa7b6'; ctx.fillRect(525, 234, 5, 1.6); // teapot
    coinIcon(ctx, -120, 150, 3); coinIcon(ctx, 610, 132, 3); coinIcon(ctx, 256, 240, 2.6);
  }

  drawVault(ctx, lv) {
    const { x: vx, y: vy, w: vw, h: vh } = VAULT;
    ctx.fillStyle = '#3a271b'; rr(ctx, vx, vy, vw, vh, 30); ctx.fill();
    ctx.fillStyle = '#e8cfa0'; rr(ctx, vx + 6, vy + 6, vw - 12, vh - 10, 26); ctx.fill();
    texFill(ctx, 'plaster', 1);
    ctx.fillStyle = '#d4b98a'; ctx.fillRect(vx + 6, vy + vh - 18, vw - 12, 14);
    // tunnel up to the garden
    ctx.fillStyle = '#3a271b'; ctx.fillRect(vx - 60, vy + vh - 26, 64, 20); ctx.fillRect(vx - 64, 90, 18, vy + vh - 96);
    // the trapdoor
    const d = this.game.s.deep;
    if (d.open) { ctx.fillStyle = '#2d1e16'; ctx.fillRect(SHAFT_X, vy + vh - 18, 26, 14); fillRR(ctx, SHAFT_X - 2, vy + vh - 24, 30, 5, 1.5, '#b98a3a'); }
    else { fillRR(ctx, SHAFT_X, vy + vh - 17, 26, 11, 1.5, '#b98a3a'); ctx.strokeStyle = '#7a5a20'; ctx.lineWidth = 0.7; ctx.strokeRect(SHAFT_X + 2, vy + vh - 15, 22, 7); circ(ctx, SHAFT_X + 13, vy + vh - 11.5, 1.6, '#7a5a20'); }
    // treasure pile grows with your wealth (to the right of the trapdoor)
    const cx = vx + vw - 62;
    const pileW = 18 + lv * 30; const pileH = 6 + lv * 26;
    ctx.fillStyle = '#e9a623'; ctx.beginPath(); ctx.moveTo(cx - pileW / 2, vy + vh - 4); ctx.quadraticCurveTo(cx, vy + vh - 4 - pileH * 2, cx + pileW / 2, vy + vh - 4); ctx.fill();
    ctx.fillStyle = '#ffd257'; ctx.beginPath(); ctx.moveTo(cx - pileW / 2 + 6, vy + vh - 5); ctx.quadraticCurveTo(cx, vy + vh - 6 - pileH * 1.7, cx + pileW / 2 - 6, vy + vh - 5); ctx.fill();
    const Rc = rng(3);
    for (let k = 0; k < 6 + lv * 18; k++) coinIcon(ctx, cx + (Rc() - 0.5) * pileW * 0.8, vy + vh - 6 - Rc() * pileH * 0.8, 2.6);
    drawCheese(ctx, vx + 16, vy + vh - 12, 1.1); drawCheese(ctx, vx + 28, vy + vh - 9, 0.8);
    ctx.textAlign = 'center';
    fillRR(ctx, vx + vw / 2 - 52, vy + 12, 104, 13, 6, 'rgba(90,60,35,0.85)');
    ctx.fillStyle = '#fff3dc'; ctx.font = `600 8px ${FONT}`; ctx.textBaseline = 'middle'; ctx.fillText('The Cheese & Coin Vault', vx + vw / 2, vy + 18.8); ctx.textBaseline = 'alphabetic';
    if (d.open) { fillRR(ctx, SHAFT_X - 16, vy + 30, 58, 11, 5, 'rgba(90,60,35,0.8)'); ctx.fillStyle = '#ffe9b0'; ctx.font = `700 6.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▼ Deep Stacks', SHAFT_X + 13, vy + 35.8); ctx.textBaseline = 'alphabetic'; }
  }

  // the vault's sleepy guard (live, on top of the cached vault)
  drawVaultLive(ctx, t) {
    const { x: vx, y: vy, h: vh } = VAULT;
    drawMouse(ctx, vx + 40, vy + vh - 4, { fur: '#8f7f73', belly: '#d9cdc2', dir: 1, pose: 'sit', t: t * 0.3, sleep: true, hat: 'bobble', hatCol: '#4f7cac', noShadow: true });
    art(ctx, 'vaultZ', [-4, -7, 8, 9], paintZ, 0, vx + 46 + Math.sin(t) * 2, vy + vh - 34 - ((t * 6) % 10), 1, 0, 0.6 + 0.4 * Math.sin(t * 2));
  }

  /* ---------------- the maze ---------------- */
  drawCells(ctx, view, t, px = 2, stable = true) {
    const g = this.game; const d = g.s.deep;
    const c0 = Math.max(0, Math.floor((view.worldLeft - cellX(0)) / CELL_W) - 1);
    const c1 = Math.min(DEEP_COLS - 1, Math.ceil((view.worldRight - cellX(0)) / CELL_W));
    const r0 = Math.max(0, Math.floor((view.top - DEEP_TOP) / CELL_H) - 1);
    const r1 = Math.min(DEEP_ROWS - 1, Math.ceil((view.bottom - DEEP_TOP) / CELL_H));
    this.frontier = [];
    let hoardDrawn = false;
    const toLet = g.moleCityOpen() && d.lift > 0 && g.bizCount() + Object.values(d.biz).filter((b) => !b.built).length < 8;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const k = cellKind(c, r); const x = cellX(c); const y = cellY(r);
        if (k === 'D') { if (!hoardDrawn) { hoardDrawn = true; this.drawHoard(ctx, t); } continue; }
        const art = this.cellArt(c, r, px, stable);
        ctx.drawImage(art.img, x, y, CELL_W, CELL_H);
        if (k === '#') continue;
        const dug = !!d.dug[cellId(c, r)];
        if (dug) this.drawCellLive(ctx, c, r, x, y, t, toLet, y + 64 < view.bottom && y + CELL_H > view.top);
        else {
          const act = art.act;
          if (act === 'dig' && !g.jobAt(c, r)) this.drawDigMarker(ctx, x, y, t, g.freeCrews() > 0);
          else if (act === 'far' && k >= '1' && k <= '8') this.drawHallHint(ctx, x, y, t);
        }
        const job = g.jobAt(c, r);
        if (job) this.drawJob(ctx, job, x, y, t);
      }
    }
  }

  drawRock(ctx, c, r, x, y) {
    ctx.fillStyle = shade('#5d5560', -0.04 * r); ctx.fillRect(x, y, CELL_W, CELL_H);
    texRect(ctx, 'rock', x, y, CELL_W, CELL_H, 1);
    // jagged edges where the rock meets soil
    const R = rng(c * 17 + r * 131);
    ctx.strokeStyle = 'rgba(20,14,18,0.45)'; ctx.lineWidth = 2;
    const side = (dc, dr, ax, ay, bx, by) => {
      if (cellKind(c + dc, r + dr) === '#') return;
      ctx.beginPath(); ctx.moveTo(ax, ay);
      for (let k = 1; k < 8; k++) { const u = k / 8; ctx.lineTo(ax + (bx - ax) * u + (dr ? 0 : (R() - 0.5) * 6), ay + (by - ay) * u + (dc ? 0 : (R() - 0.5) * 6)); }
      ctx.lineTo(bx, by); ctx.stroke();
    };
    side(0, -1, x, y, x + CELL_W, y); side(0, 1, x, y + CELL_H, x + CELL_W, y + CELL_H); side(-1, 0, x, y, x, y + CELL_H); side(1, 0, x + CELL_W, y, x + CELL_W, y + CELL_H);
    // crystals and fossils locked in the rock
    const kind = Math.floor(R() * 4);
    if (kind === 0) this.crystals(ctx, x + 30 + R() * 90, y + 90 + R() * 20, R() < 0.5 ? '#9ec5f0' : '#d4b3f0', 0.8 + R() * 0.4);
    else if (kind === 1) drawAmmonite(ctx, x + 30 + R() * 90, y + 30 + R() * 70, 7 + R() * 5, '#8f8578');
    else if (kind === 2) drawTrilobite(ctx, x + 30 + R() * 90, y + 30 + R() * 70, 1.2, R() * 3);
    else drawBone(ctx, x + 30 + R() * 90, y + 30 + R() * 70, 14, R() * 3);
  }

  crystals(ctx, x, y, col, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    [[-8, -10, -0.3], [0, -16, 0], [8, -9, 0.35], [-3, -7, -0.1]].forEach(([dx, h, a]) => {
      ctx.save(); ctx.translate(dx, 0); ctx.rotate(a);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-3, h + 3); ctx.lineTo(0, h - 2); ctx.lineTo(3, h + 3); ctx.lineTo(3, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-2, h + 3, 1.2, -h - 4);
      ctx.restore();
    });
    ctx.restore();
  }

  // Bits and bobs in undug soil (seeded, so they never move).
  drawBuried(ctx, c, r, x, y) {
    const R = rng(c * 37 + r * 71 + 5);
    for (let k = 0; k < 3; k++) ell(ctx, x + 12 + R() * 126, y + 12 + R() * 108, 2 + R() * 3, 1.4 + R() * 2, R() < 0.5 ? 'rgba(40,25,15,0.35)' : 'rgba(210,180,150,0.22)', R() * 3);
    if (R() < 0.35) drawBone(ctx, x + 20 + R() * 110, y + 20 + R() * 90, 8 + R() * 6, R() * 3);
    if (R() < 0.25) { ctx.strokeStyle = 'rgba(200,160,130,0.5)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; const wx = x + 30 + R() * 90; const wy = y + 30 + R() * 70; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 5, wy - 4, wx + 10, wy + 1); ctx.stroke(); }
  }

  drawHallHint(ctx, x, y, t) {
    const cx = x + CELL_W / 2; const cy = y + CELL_H / 2;
    glow(ctx, cx, cy, 46, '255,214,130', 0.18 + 0.06 * Math.sin(t * 1.5));
    star(ctx, cx, cy, 3.4, 'rgba(255,230,160,0.6)');
  }

  drawDigMarker(ctx, x, y, t, crewFree) {
    const cx = x + CELL_W / 2; const cy = y + CELL_H / 2;
    const p = (t * 0.8) % 1;
    ctx.strokeStyle = `rgba(255,226,140,${0.6 * (1 - p)})`; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(cx, cy, 19 + p * 18, 0, 7); ctx.stroke();
    circ(ctx, cx, cy, 19, crewFree ? 'rgba(255,247,232,0.94)' : 'rgba(220,210,200,0.7)');
    ctx.strokeStyle = '#e6b34a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 19, 0, 7); ctx.stroke();
    // shovel
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1.3, 1.3); ctx.rotate(-0.7);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-0.9, -9, 1.8, 11); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-3, -10, 6, 1.6);
    ctx.fillStyle = '#9aa0ab'; ctx.beginPath(); ctx.moveTo(-3.4, 2); ctx.lineTo(3.4, 2); ctx.lineTo(2.4, 8); ctx.lineTo(0, 9.5); ctx.lineTo(-2.4, 8); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = '#3a271b'; ctx.lineJoin = 'round';
    ctx.strokeText('Dig here', cx, cy + 30); ctx.fillStyle = '#fff3dc'; ctx.fillText('Dig here', cx, cy + 30);
  }

  drawJob(ctx, job, x, y, t) {
    const g = this.game;
    const rem = g.jobRemaining(job); const frac = 1 - rem / Math.max(1, job.total);
    const cx = x + CELL_W / 2; const base = y + CELL_H - 20;
    if (job.kind === 'dig') {
      // the hole opens up as the crew digs
      ctx.fillStyle = 'rgba(45,30,22,0.85)'; ell(ctx, cx, y + CELL_H / 2 + 8, 20 + frac * 44, 14 + frac * 34, null); ctx.fill();
      for (let k = 0; k < 4; k++) { const ph = (t * 1.6 + k / 4) % 1; circ(ctx, cx + (k % 2 ? 1 : -1) * (10 + ph * 20), base - 16 - Math.sin(ph * Math.PI) * 18, 1.6, '#8a6a4c'); }
    }
    drawMole(ctx, cx - 16, base, { t, pose: 'dig', dir: 1, shovel: true });
    drawMole(ctx, cx + 18, base, { t: t + 0.4, pose: job.kind === 'dig' ? 'dig' : 'push', dir: -1, shovel: job.kind === 'dig', hatCol: '#e0804a' });
    fillRR(ctx, cx - 40, y + 12, 80, 13, 6.5, 'rgba(40,28,20,0.8)');
    fillRR(ctx, cx - 38, y + 14, 76 * Math.max(0.05, frac), 9, 4.5, '#7cc46b');
    ctx.fillStyle = '#fff'; ctx.font = `700 7px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(rem > 0 ? fmtTime(rem) : 'Done!', cx, y + 18.5);
  }

  /* ---- cached cell art (every cell: rock, soil and dug rooms) ---- */
  cellArt(c, r, px = 2, stable = true) {
    const g = this.game; const d = g.s.deep;
    const k = cellKind(c, r); const id = cellId(c, r);
    const dug = !!d.dug[id];
    let key; let act = null;
    if (k === '#') key = 'rock';
    else if (!dug) { act = g.jobAt(c, r) ? 'job' : g.cellAction(c, r); key = `soil|${act === 'far' ? 1 : 0}`; }
    else {
      const open = (dc, dr) => { const kk = cellKind(c + dc, r + dr); return kk !== '#' && (d.dug[cellId(c + dc, r + dr)] || (kk === 'D' && d.door)); };
      const conn = `${open(-1, 0) ? 1 : 0}${open(1, 0) ? 1 : 0}${open(0, -1) || (c === 4 && r === 0) ? 1 : 0}${open(0, 1) ? 1 : 0}`;
      const hall = g.hallAt(c, r); const stage = hall ? g.hallStage(hall) : 0;
      const bid = g.bizAt(c, r); const bst = bid && d.biz[bid];
      const bk = bst ? `${bid}:${bst.built ? bizTier(bst.lvl) : 0}:${bst.fx.map((v) => (v ? 1 : 0)).join('')}` : '';
      key = `${k}|${conn}|${stage}|${d.fossils[FOSSIL_AT[id]] ? 1 : 0}|${bk}`;
    }
    const pxc = Math.min(2.5, px);
    const hit = this.cache.get(id);
    if (hit && hit.key === key && (hit.px === pxc || !stable || this.w.budget <= 0)) {
      this.cache.delete(id); this.cache.set(id, hit); // most recently used
      hit.act = act; return hit;
    }
    this.w.budget--;
    const cv = hit?.img && hit.px === pxc ? hit.img : document.createElement('canvas');
    cv.width = Math.ceil(CELL_W * pxc); cv.height = Math.ceil(CELL_H * pxc);
    const x = cv.getContext('2d'); x.scale(pxc, pxc);
    // soil behind everything
    const sg = x.createLinearGradient(0, 0, 0, CELL_H); sg.addColorStop(0, soilAt(cellY(r))); sg.addColorStop(1, soilAt(cellY(r) + CELL_H));
    x.fillStyle = sg; x.fillRect(0, 0, CELL_W, CELL_H); texRect(x, 'soil', 0, 0, CELL_W, CELL_H, 1);
    if (k === '#') this.drawRock(x, c, r, 0, 0);
    else if (!dug) { this.drawBuried(x, c, r, 0, 0); if (act === 'far') { x.fillStyle = 'rgba(24,14,10,0.42)'; x.fillRect(0, 0, CELL_W, CELL_H); } }
    else { const hall = g.hallAt(c, r); const bid = g.bizAt(c, r); paintCell(x, c, r, k, key.split('|')[1], hall, hall ? g.hallStage(hall) : 0, bid ? { id: bid, st: d.biz[bid] } : null); }
    const art = { key, px: pxc, img: cv, act };
    this.cache.delete(id); this.cache.set(id, art);
    let total = 0; for (const a of this.cache.values()) total += a.img.width * a.img.height;
    for (const [k2, a] of this.cache) { if (total <= CELL_CACHE_PX || this.cache.size <= 24) break; total -= a.img.width * a.img.height; this.cache.delete(k2); }
    return art;
  }

  // Live bits inside dug cells: readers in restored halls, glowing lights, the entrance crew.
  // floor: whether the lower half of the cell (where everyone stands) is on screen
  drawCellLive(ctx, c, r, x, y, t, toLet = false, floor = true) {
    const g = this.game; const hall = g.hallAt(c, r); const k = cellKind(c, r);
    const floorY = y + CELL_H - 14;
    if (k === 'E' && floor) {
      drawMole(ctx, x + 108, floorY, { t, pose: Math.sin(t * 0.6) > 0.5 ? 'wave' : 'stand', dir: -1 });
    }
    const bid = k === '.' ? g.bizAt(c, r) : null;
    if (bid && !floor) return;
    if (bid) {
      const art = this.cache.get(cellId(c, r));
      drawBizLive(ctx, bid, g.s.deep.biz[bid], art ? art.key.split('|')[1] : '0000', x, y, t, this.w.scale, g.bizRemaining(bid));
      return;
    }
    if (!hall) {
      if (toLet && k === '.') drawToLet(ctx, x, y, t);
      // a lantern's flicker in every tunnel
      const lx = x + CELL_W / 2; const ly = y + 38;
      const a = 0.18 + 0.05 * Math.sin(t * 6 + c);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, lx, ly + 8, 60, '255,200,120', a, y + 8, y + CELL_H - 10);
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    const stage = g.hallStage(hall);
    if (stage >= 2) {
      ctx.globalCompositeOperation = 'lighter';
      const col = HALLS[hall].theme === 'crystal' ? '150,190,255' : '255,200,120';
      glow(ctx, x + CELL_W / 2, y + 58, 88, col, 0.2 + 0.04 * Math.sin(t * 3 + c), y + 8, y + CELL_H - 10);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (stage >= 3 && floor) {
      const looks = [{ fur: '#c9b29b', belly: '#f4e9dc', scarf: '#4f7cac' }, { fur: '#e8e1d8', belly: '#fffaf3', glasses: true, scarf: '#9b6fb0' }, { fur: '#a98467', belly: '#ecd9c6', hat: 'beret', hatCol: '#3d7a5a' }];
      const lk = looks[hall % looks.length]; const lvl = g.hallLevel(hall);
      drawMouse(ctx, x + 44, floorY - 6, { ...lk, dir: 1, pose: 'read', t: t + hall, s: 0.72, book: '#b5523b', noShadow: true });
      if (hall % 2 === 0 || lvl >= 10) drawMouse(ctx, x + 104, floorY, { ...looks[(hall + 1) % 3], dir: -1, pose: Math.sin(t * 0.5 + hall) > 0.6 ? 'reach' : 'stand', t: t + hall * 2, s: 0.72, book: '#3d7a5a' });
      if (lvl >= 25) drawMole(ctx, x + 78, floorY, { t: t + hall, pose: Math.sin(t * 0.4 + hall) > 0.3 ? 'stand' : 'wave', dir: hall % 2 ? 1 : -1, s: 0.8, helmet: false, scarf: '#b5523b' });
      if (lvl > 1) { // a brass plaque with the hall's level
        const stars = lvl >= 50 ? 3 : lvl >= 25 ? 2 : lvl >= 10 ? 1 : 0;
        const bw = 22 + stars * 5;
        fillRR(ctx, x + CELL_W / 2 - bw / 2, y + 24, bw, 8, 3, lvl >= 50 ? '#e9b949' : 'rgba(60,40,25,0.8)');
        ctx.fillStyle = lvl >= 50 ? '#5a3a1a' : '#ffe9b0'; ctx.font = `700 5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`Lv ${lvl}${stars ? ' ' + '★'.repeat(stars) : ''}`, x + CELL_W / 2, y + 28.3); ctx.textBaseline = 'alphabetic';
      }
    }
  }

  /* ---- the dragon's hoard ---- */
  drawHoard(ctx, t) {
    const d = this.game.s.deep; const g = this.game;
    let c0 = 0; while (c0 < DEEP_COLS && cellKind(c0, DEEP_ROWS - 1) !== 'D') c0++;
    const x = cellX(c0); const y = cellY(DEEP_ROWS - 1); const W = CELL_W * 3; const H = CELL_H;
    if (!d.door) {
      // rock face with the great sealed door: one picture per number of locks opened
      const dx = x + W / 2; const dy = y + H - 8;
      const done = g.hallsDone();
      art(ctx, `door|${done}`, [x, y, W, H], paintDoor, { x, y, W, H, done });
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < Math.min(8, done); k++) { const a = Math.PI * (1.08 + (k / 7) * 0.84); glow(ctx, dx + Math.cos(a) * 36, dy - 60 + Math.sin(a) * 36, 14, '255,220,120', 0.5); }
      ctx.globalCompositeOperation = 'source-over';
      // warm light leaking under the door
      const gl = ctx.createLinearGradient(0, dy - 8, 0, dy); gl.addColorStop(0, 'rgba(255,170,90,0)'); gl.addColorStop(1, `rgba(255,170,90,${0.35 + 0.1 * Math.sin(t)})`);
      ctx.fillStyle = gl; ctx.fillRect(dx - 60, dy - 8, 120, 8);
      if (done >= 8 && g.doorReachable()) this.drawDigMarker(ctx, dx - CELL_W / 2, dy - 90 - CELL_H / 2, t, true);
      return;
    }
    // the cavern: warm gold light, mounds of books and coins (one picture), and Umber
    art(ctx, 'hoard', [x, y, W, H], paintHoard, { x, y, W, H });
    // Umber curls up left of the lift shaft (which runs down the cavern's right side)
    drawDragon(ctx, x + W / 2 - 82, y + H - 16, { t, awake: d.tales, s: 0.78, glasses: d.tales });
    if (d.tales) {
      // somebody from the library reads to Umber every night, sitting on a pile of books
      const rx = x + W / 2 + 36;
      drawMouse(ctx, rx, y + H - 30, { fur: '#c9b29b', belly: '#f4e9dc', dir: -1, pose: 'read', t, scarf: '#e9b949', hat: 'cap', hatCol: '#4f7cac', s: 0.9, book: '#8e3b46', noShadow: true });
      fillRR(ctx, rx - 14, y + H - 30, 28, 9, 2, '#8e3b46');
    }
  }

  /* ---- hit testing ---- */
  liftAt(wx, wy) { return liftHit(wx, wy, this.game.s.deep.lift); }
  cellAt(wx, wy) {
    if (wy < DEEP_TOP || wy > DEEP_BOTTOM) return null;
    const c = Math.floor((wx - cellX(0)) / CELL_W); const r = Math.floor((wy - DEEP_TOP) / CELL_H);
    if (c < 0 || c >= DEEP_COLS || r < 0 || r >= DEEP_ROWS) return null;
    return [c, r];
  }
}

function paintDoor(ctx, { x, y, W, H, done }) {
  ctx.fillStyle = '#4a4050'; ctx.fillRect(x, y, W, H); texRect(ctx, 'rock', x, y, W, H, 1);
  const dx = x + W / 2; const dy = y + H - 8;
  ctx.fillStyle = '#6d6478'; ctx.beginPath(); ctx.moveTo(dx - 70, dy); ctx.lineTo(dx - 70, dy - 70); ctx.arc(dx, dy - 70, 70, Math.PI, 0); ctx.lineTo(dx + 70, dy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#857c90'; ctx.beginPath(); ctx.moveTo(dx - 62, dy); ctx.lineTo(dx - 62, dy - 68); ctx.arc(dx, dy - 68, 62, Math.PI, 0); ctx.lineTo(dx + 62, dy); ctx.closePath(); ctx.fill();
  texFill(ctx, 'rock', 0.6);
  ctx.strokeStyle = 'rgba(40,30,50,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, dy - 130); ctx.stroke();
  // a carved dragon curled over the arch
  ctx.strokeStyle = 'rgba(40,30,50,0.45)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(dx, dy - 68, 50, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  ctx.beginPath(); ctx.arc(dx + 44, dy - 92, 8, 0, 7); ctx.stroke();
  // eight locks, one for each hall
  for (let k = 0; k < 8; k++) {
    const a = Math.PI * (1.08 + (k / 7) * 0.84); const lx = dx + Math.cos(a) * 36; const ly = dy - 60 + Math.sin(a) * 36;
    circ(ctx, lx, ly, 6, k < done ? '#ffd257' : '#3a3242');
    ctx.fillStyle = k < done ? '#8a5a1a' : '#6d6478'; ctx.fillRect(lx - 1, ly - 2, 2, 4);
  }
  ctx.fillStyle = '#fff3dc'; ctx.font = `700 8px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(done >= 8 ? 'The great door is unlocked' : `${done} / 8 locks open`, dx, dy - 14);
}
function paintHoard(ctx, { x, y, W, H }) {
  const bg = ctx.createRadialGradient(x + W / 2, y + H, 20, x + W / 2, y + H * 0.6, W * 0.6);
  bg.addColorStop(0, '#8a5634'); bg.addColorStop(1, '#3a2620');
  ctx.fillStyle = bg; ctx.fillRect(x, y, W, H);
  texRect(ctx, 'rock', x, y, W, H, 0.6);
  const R = rng(99);
  for (let k = 0; k < 7; k++) {
    const hx = x + 30 + k * 64; const hw = 50 + R() * 30; const hh = 18 + R() * 16;
    ctx.fillStyle = k % 2 ? '#e9a623' : '#d99423'; ctx.beginPath(); ctx.moveTo(hx - hw / 2, y + H); ctx.quadraticCurveTo(hx, y + H - hh * 2, hx + hw / 2, y + H); ctx.fill();
  }
  for (let k = 0; k < 40; k++) coinIcon(ctx, x + 20 + R() * (W - 40), y + H - 4 - R() * 20, 2.6);
  for (let k = 0; k < 14; k++) { const bx = x + 20 + R() * (W - 40); const by = y + H - 8 - R() * 18; ctx.save(); ctx.translate(bx, by); ctx.rotate((R() - 0.5) * 0.8); fillRR(ctx, -6, -4, 12, 8, 1, ['#b5523b', '#3d7a5a', '#4f7cac', '#8e3b46', '#5b3f8c'][k % 5]); ctx.fillStyle = '#f6ecd6'; ctx.fillRect(-5, 2.4, 10, 1.2); ctx.restore(); }
}

function paintZ(ctx) { ctx.fillStyle = '#fff'; ctx.font = `600 7px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('z', 0, 0); }

/* =================================================================== */
/* Cell painting (cached)                                               */
/* =================================================================== */
const THEME = {
  roots: { wall: '#6b4a33', wall2: '#5c3f2b', floor: '#8a5a3a' },
  scriptorium: { wall: '#8a7258', wall2: '#7a644c', floor: '#6b4a33' },
  clockwork: { wall: '#6a5a4a', wall2: '#5a4c3e', floor: '#7a5236' },
  crystal: { wall: '#4a4a6a', wall2: '#3f3f5c', floor: '#5a5470' },
  galleon: { wall: '#6b4a33', wall2: '#5a3c28', floor: '#8a5a3a' },
  echoes: { wall: '#7a7480', wall2: '#6a6470', floor: '#8a8290' },
  stair: { wall: '#5a4a44', wall2: '#4c3e38', floor: '#6b5a4a' },
  study: { wall: '#7a5a42', wall2: '#6b4d37', floor: '#8a5a3a' },
};

// Vertical passages (and their ladders) run up the right-hand side of a cell, so they never
// cut through the middle of a hall. The entrance's shaft from the vault comes down the middle.
const SIDE_X = CELL_W - 34;
function cavity(ctx, conn, col, ux) {
  // the dug-out space, with passages to open neighbours
  const [L, R, U, D] = conn.split('').map((v) => v === '1');
  ctx.fillStyle = col;
  rr(ctx, 8, 10, CELL_W - 16, CELL_H - 20, 16); ctx.fill();
  if (L) ctx.fillRect(0, 52, 20, CELL_H - 62);
  if (R) ctx.fillRect(CELL_W - 20, 52, 20, CELL_H - 62);
  if (U) ctx.fillRect(ux - 15, 0, 30, 20);
  if (D) ctx.fillRect(SIDE_X - 15, CELL_H - 20, 30, 20);
}

function paintCell(ctx, c, r, k, conn, hall, stage, biz = null) {
  const R = rng(c * 101 + r * 13 + 7);
  const [L, Rt, U, D] = conn.split('').map((v) => v === '1');
  const th = hall ? THEME[HALLS[hall].theme] : biz ? { wall: '#3f2a1d', floor: '#8a5a3a' } : { wall: '#4a3222', wall2: '#3f2a1d', floor: '#8a5a3a' };
  const ux = c === 4 && r === 0 ? CELL_W / 2 : SIDE_X;
  // cavity
  cavity(ctx, conn, th.wall, ux);
  ctx.save(); rr(ctx, 8, 10, CELL_W - 16, CELL_H - 20, 16); ctx.clip();
  const bg = ctx.createLinearGradient(0, 10, 0, CELL_H);
  bg.addColorStop(0, shade(th.wall, -0.18)); bg.addColorStop(1, th.wall);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, CELL_W, CELL_H);
  texRect(ctx, hall && ['echoes', 'crystal'].includes(HALLS[hall].theme) ? 'rock' : 'soil', 0, 0, CELL_W, CELL_H, 1);
  ctx.restore();
  if (biz?.st.built) paintBizWall(ctx, biz.id, conn);
  // plank floor
  ctx.fillStyle = th.floor; ctx.fillRect(10, CELL_H - 24, CELL_W - 20, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = 16; x < CELL_W - 12; x += 18) ctx.fillRect(x, CELL_H - 24, 0.8, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(10, CELL_H - 24, CELL_W - 20, 1.2);
  if (L) { ctx.fillStyle = th.floor; ctx.fillRect(0, CELL_H - 24, 12, 12); }
  if (Rt) { ctx.fillStyle = th.floor; ctx.fillRect(CELL_W - 12, CELL_H - 24, 12, 12); }
  if (U) { ctx.fillStyle = '#2d1e16'; ctx.fillRect(ux - 13, 0, 26, 12); }
  if (D) { ctx.fillStyle = '#2d1e16'; ctx.fillRect(SIDE_X - 13, CELL_H - 14, 26, 14); }
  // ladders for up/down passages
  const ladder = (x, y0, y1) => { ctx.fillStyle = '#9a6b45'; ctx.fillRect(x - 9, y0, 2, y1 - y0); ctx.fillRect(x + 7, y0, 2, y1 - y0); ctx.fillStyle = '#b98457'; for (let y = y0 + 4; y < y1; y += 8) ctx.fillRect(x - 9, y, 18, 1.8); };
  if (U) ladder(ux, 0, CELL_H - 24);
  if (D) ladder(SIDE_X, CELL_H - 26, CELL_H);

  if (hall) paintHall(ctx, hall, stage, R);
  else if (biz) paintBiz(ctx, biz.id, biz.st, R);
  else paintTunnel(ctx, c, r, k, R);

  // soft vignette at the cavity edge
  ctx.save(); rr(ctx, 8, 10, CELL_W - 16, CELL_H - 20, 16); ctx.clip();
  const vg = ctx.createRadialGradient(CELL_W / 2, CELL_H / 2, 30, CELL_W / 2, CELL_H / 2, 90);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,6,4,0.35)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, CELL_W, CELL_H);
  if (hall && stage === 0) { ctx.fillStyle = 'rgba(12,8,10,0.45)'; ctx.fillRect(0, 0, CELL_W, CELL_H); }
  ctx.restore();
}

function supports(ctx) {
  ctx.fillStyle = '#7a4b2e'; ctx.fillRect(16, 24, 7, CELL_H - 48); ctx.fillRect(CELL_W - 23, 24, 7, CELL_H - 48);
  ctx.fillStyle = '#8a5a3a'; ctx.fillRect(12, 20, CELL_W - 24, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(12, 20, CELL_W - 24, 1.5);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(16, 27, 7, 2); ctx.fillRect(CELL_W - 23, 27, 7, 2);
}
function lantern(ctx, x, y) {
  ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y); ctx.stroke();
  fillRR(ctx, x - 4, y, 8, 10, 2, '#3a3440'); fillRR(ctx, x - 2.8, y + 1.5, 5.6, 7, 1, '#ffd98a');
}

function paintTunnel(ctx, c, r, k, R) {
  supports(ctx);
  lantern(ctx, CELL_W / 2, 27);
  const floor = CELL_H - 24;
  if (k === 'E') {
    // the mole guild's little office at the bottom of the shaft
    fillRR(ctx, 26, floor - 26, 34, 6, 1.5, '#8a5a3a'); ctx.fillStyle = '#6b4128'; ctx.fillRect(29, floor - 20, 3, 20); ctx.fillRect(54, floor - 20, 3, 20);
    fillRR(ctx, 30, floor - 34, 12, 8, 1, '#f4efe6'); ctx.fillStyle = '#e0404f'; ctx.fillRect(44, floor - 32, 8, 6);
    fillRR(ctx, 88, 34, 44, 22, 2, '#8a5a3a'); fillRR(ctx, 90, 36, 40, 18, 1.5, '#e8d6b0');
    ctx.fillStyle = '#5a3a1a'; ctx.font = `700 5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('MOLE DIGGERS’', 110, 41.5); ctx.fillText('GUILD', 110, 47.5);
    return;
  }
  if (k === 'F') {
    const id = FOSSIL_AT[cellId(c, r)];
    // the fossil still set into the back wall, with a little brass plaque
    ctx.save(); ctx.globalAlpha = 0.9; drawFossil(ctx, id, CELL_W / 2, floor - 22, 1.1); ctx.restore();
    const f = FOSSILS.find((x) => x.id === id);
    fillRR(ctx, CELL_W / 2 - 30, floor - 16, 60, 10, 2, '#b98a3a'); ctx.fillStyle = '#3a2a10'; ctx.font = `700 5.5px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(f ? f.name : 'Fossil', CELL_W / 2, floor - 10.5);
    return;
  }
  if (k === 'T') {
    // an old chest, opened
    const x = CELL_W / 2 + 10;
    fillRR(ctx, x - 16, floor - 16, 32, 16, 2, '#8a5a3a'); ctx.fillStyle = '#c9a227'; ctx.fillRect(x - 16, floor - 12, 32, 2); ctx.fillRect(x - 2, floor - 16, 4, 16);
    ctx.fillStyle = '#6b4128'; ctx.beginPath(); ctx.moveTo(x - 16, floor - 16); ctx.lineTo(x - 18, floor - 34); ctx.lineTo(x + 14, floor - 34); ctx.lineTo(x + 16, floor - 16); ctx.closePath(); ctx.fill();
    for (let j = 0; j < 7; j++) coinIcon(ctx, x - 10 + j * 3.4, floor - 17 - (j % 3) * 1.5, 2.4);
    drawCheese(ctx, x - 30, floor - 3, 0.9);
    return;
  }
  // everyday tunnel furniture (seeded)
  const pick = Math.floor(R() * 5);
  if (pick === 0) { // mine cart on rails
    ctx.fillStyle = '#6d6a80'; ctx.fillRect(12, floor - 2, CELL_W - 24, 1.5);
    const x = 40 + R() * 50; fillRR(ctx, x - 14, floor - 16, 28, 12, 2, '#7a7488'); circ(ctx, x - 8, floor - 3, 3, '#3a3440'); circ(ctx, x + 8, floor - 3, 3, '#3a3440');
    ell(ctx, x, floor - 17, 12, 4, '#8a6a4c'); coinIcon(ctx, x - 3, floor - 19, 2);
  } else if (pick === 1) { // crates and a pickaxe
    fillRR(ctx, 30, floor - 18, 20, 18, 1.5, '#b98a5a'); ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 1; ctx.strokeRect(30, floor - 18, 20, 18); ctx.beginPath(); ctx.moveTo(30, floor - 18); ctx.lineTo(50, floor); ctx.stroke();
    fillRR(ctx, 52, floor - 12, 14, 12, 1.5, '#a67a4a');
    ctx.save(); ctx.translate(104, floor - 12); ctx.rotate(0.5); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-1, -12, 2, 22); ctx.fillStyle = '#9aa0ab'; ctx.beginPath(); ctx.moveTo(-10, -12); ctx.quadraticCurveTo(0, -16, 10, -12); ctx.lineTo(0, -10); ctx.closePath(); ctx.fill(); ctx.restore();
  } else if (pick === 2) { // glowing mushrooms
    for (let j = 0; j < 5; j++) { const x = 30 + j * 20 + R() * 8; const h = 4 + R() * 6; ctx.fillStyle = '#f4efe6'; ctx.fillRect(x - 0.8, floor - h, 1.6, h); ell(ctx, x, floor - h, 4 + R() * 2, 2.6, j % 2 ? '#9ee6c8' : '#bfe3f2'); }
  } else if (pick === 3) { // barrels
    [40, 60].forEach((x) => { fillRR(ctx, x - 8, floor - 18, 16, 18, 4, '#8a5a3a'); ctx.fillStyle = '#6d6a80'; ctx.fillRect(x - 8, floor - 14, 16, 1.4); ctx.fillRect(x - 8, floor - 5, 16, 1.4); });
  } else { // a small bookcase someone forgot
    fillRR(ctx, 34, floor - 36, 30, 36, 1.5, '#6b4128'); ctx.fillStyle = '#3a2418'; ctx.fillRect(36, floor - 34, 26, 32);
    for (let y = floor - 34 + 14; y <= floor - 2; y += 15) { let bx = 37; while (bx < 60) { const bw = 2.4 + R() * 2; ctx.fillStyle = ['#b5523b', '#3d7a5a', '#e8c465', '#4f7cac'][Math.floor(R() * 4)]; ctx.fillRect(bx, y - 11, bw, 11); bx += bw + 0.4; } ctx.fillStyle = '#8a5a3a'; ctx.fillRect(35, y, 28, 2); }
  }
}

/* ---- the eight halls, at each stage of repair ---- */
function shelf(ctx, x, top, w, bot, fill, tilt, R, cols = ['#b5523b', '#3d7a5a', '#e8c465', '#4f7cac', '#8e3b46', '#5b3f8c']) {
  ctx.save(); ctx.translate(x + w / 2, bot); ctx.rotate(tilt); ctx.translate(-w / 2, -(bot - top));
  const h = bot - top;
  fillRR(ctx, -2, -2, w + 4, h + 2, 1.5, '#6b4128'); ctx.fillStyle = '#3a2418'; ctx.fillRect(0, 0, w, h);
  for (let y = 15; y <= h; y += 15) {
    let bx = 1; while (bx < w - 3) { const bw = 2.4 + R() * 2.2; if (R() < fill) { ctx.fillStyle = cols[Math.floor(R() * cols.length)]; ctx.fillRect(bx, y - 10 - R() * 3, bw, 10 + R() * 3); } bx += bw + 0.5; }
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-1, y, w + 2, 2);
  }
  ctx.restore();
}
function cobwebs(ctx) {
  ctx.strokeStyle = 'rgba(235,235,240,0.55)'; ctx.lineWidth = 0.6;
  [[12, 12, 1], [CELL_W - 12, 12, -1]].forEach(([x, y, s]) => {
    for (let k = 0; k < 5; k++) { const a = (k / 4) * Math.PI / 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * Math.cos(a) * 26, y + Math.sin(a) * 26); ctx.stroke(); }
    for (let rr2 = 8; rr2 < 26; rr2 += 6) { ctx.beginPath(); for (let k = 0; k <= 4; k++) { const a = (k / 4) * Math.PI / 2; ctx.lineTo(x + s * Math.cos(a) * rr2, y + Math.sin(a) * rr2); } ctx.stroke(); }
  });
}
function rubble(ctx, R) {
  for (let k = 0; k < 10; k++) { const x = 20 + R() * (CELL_W - 40); const s = 3 + R() * 6; ell(ctx, x, CELL_H - 24 - s * 0.4, s, s * 0.7, R() < 0.5 ? '#6b5a4e' : '#857264'); }
}
function candle(ctx, x, y, lit) {
  fillRR(ctx, x - 1.8, y - 8, 3.6, 8, 1, '#f4efe6');
  if (lit) { ell(ctx, x, y - 10.5, 1.6, 3, '#ffd24a'); ell(ctx, x, y - 10, 0.8, 1.6, '#fff3b0'); }
}

function paintHall(ctx, n, stage, R) {
  const theme = HALLS[n].theme; const floor = CELL_H - 24;
  const tidy = stage >= 1; const lit = stage >= 2; const done = stage >= 3;
  const fill = done ? 0.95 : 0.35;
  switch (theme) {
    case 'roots': {
      // roots through the ceiling, armchairs and jam jars
      ctx.strokeStyle = '#8a6a4c'; ctx.lineWidth = tidy ? 2 : 3; ctx.lineCap = 'round';
      for (let k = 0; k < (tidy ? 4 : 8); k++) { const x = 20 + k * (tidy ? 34 : 16); ctx.beginPath(); ctx.moveTo(x, 10); ctx.bezierCurveTo(x + 6, 24, x - 6, 30, x + 3, 36 + (k % 3) * 8 + (tidy ? 0 : 20)); ctx.stroke(); }
      shelf(ctx, 92, 34, 36, floor, fill, done ? 0 : 0.12, R);
      [34, 66].forEach((x, j) => { fillRR(ctx, x - 12, floor - 14, 24, 12, 4, j ? '#8a3b46' : '#3d6a8a'); fillRR(ctx, x - 13, floor - 24, 6, 20, 3, shade(j ? '#8a3b46' : '#3d6a8a', -0.1)); fillRR(ctx, x + 7, floor - 24, 6, 20, 3, shade(j ? '#8a3b46' : '#3d6a8a', -0.1)); fillRR(ctx, x - 9, floor - 30, 18, 12, 4, shade(j ? '#8a3b46' : '#3d6a8a', 0.1)); });
      if (lit) [40, 110].forEach((x) => lantern(ctx, x, 16));
      if (done) { ell(ctx, CELL_W / 2, floor + 2, 50, 4, '#b5523b'); [100, 108, 116].forEach((x, j) => { fillRR(ctx, x - 3, 24, 6, 8, 1.5, ['#e8913a', '#c0504d', '#ffd24a'][j]); }); }
      break;
    }
    case 'scriptorium': {
      for (let k = 0; k < 3; k++) { const x = 24 + k * 40; fillRR(ctx, x - 2, floor - 22, 30, 4, 1, '#8a5a3a'); ctx.save(); ctx.translate(x + 13, floor - 22); ctx.rotate(tidy ? -0.15 : 0.25); fillRR(ctx, -14, -4, 28, 4, 1, '#b98457'); ctx.restore(); ctx.fillStyle = '#6b4128'; ctx.fillRect(x, floor - 18, 2.4, 18); ctx.fillRect(x + 24, floor - 18, 2.4, 18);
        if (tidy) { fillRR(ctx, x + 6, floor - 28, 12, 7, 1, '#fbf6ea'); ell(ctx, x + 22, floor - 24, 2, 1.6, '#1d1b24'); ctx.strokeStyle = '#f4efe6'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 22, floor - 25); ctx.lineTo(x + 27, floor - 36); ctx.stroke(); }
        candle(ctx, x + 2, floor - 22, lit); }
      shelf(ctx, 24, 30, 100, 56, fill, 0, R, ['#e8d6b0', '#d9c6a0', '#c9b490']);
      break;
    }
    case 'clockwork': {
      const gear = (x, y, r, teeth, col) => { ctx.fillStyle = col; ctx.beginPath(); for (let k = 0; k < teeth * 2; k++) { const a = (k / (teeth * 2)) * Math.PI * 2; const rr2 = k % 2 ? r : r + 3; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); circ(ctx, x, y, r * 0.35, shade(col, -0.25)); };
      const brass = done ? '#d9a441' : '#8a7a5a';
      gear(40, 44, 16, 10, brass); gear(64, 30, 10, 8, shade(brass, -0.1)); gear(118, 40, 14, 9, brass);
      // card catalogue cabinet
      fillRR(ctx, 72, floor - 40, 50, 40, 2, '#8a5a3a');
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) { fillRR(ctx, 75 + x * 9.4, floor - 37 + y * 7.4, 8, 6, 1, tidy ? '#b98457' : (R() < 0.3 ? '#3a2418' : '#a67a4a')); circ(ctx, 79 + x * 9.4, floor - 34 + y * 7.4, 0.8, '#e8c465'); }
      // the great clock face
      circ(ctx, 34, floor - 22, 14, '#6b4128'); circ(ctx, 34, floor - 22, 11.5, lit ? '#fbf6ea' : '#bfb5a0');
      ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(34, floor - 22); ctx.lineTo(34, floor - 31); ctx.moveTo(34, floor - 22); ctx.lineTo(41, floor - 20); ctx.stroke();
      break;
    }
    case 'crystal': {
      const glow = lit ? 1 : 0.45;
      [[26, floor, '#9ec5f0', 1.2], [124, floor, '#d4b3f0', 1.3], [70, 22, '#bfe3f2', -0.9], [104, 26, '#9ec5f0', -0.8]].forEach(([x, y, col, s]) => {
        ctx.save(); ctx.globalAlpha = glow; ctx.translate(x, y); ctx.scale(Math.abs(s), s);
        [[-8, -14, -0.3], [0, -22, 0], [8, -12, 0.35]].forEach(([dx, h, a]) => { ctx.save(); ctx.translate(dx, 0); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-3.4, 0); ctx.lineTo(-3.4, h + 4); ctx.lineTo(0, h - 2); ctx.lineTo(3.4, h + 4); ctx.lineTo(3.4, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-2.4, h + 4, 1.2, -h - 5); ctx.restore(); });
        ctx.restore();
      });
      if (tidy) { fillRR(ctx, 50, 34, 44, 30, 2, '#2f3a5a'); for (let k = 0; k < 14; k++) star(ctx, 54 + R() * 36, 38 + R() * 22, 1 + R(), '#ffe9a3'); ctx.strokeStyle = 'rgba(255,233,163,0.5)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(58, 44); ctx.lineTo(70, 50); ctx.lineTo(84, 42); ctx.stroke(); }
      shelf(ctx, 58, floor - 30, 36, floor, fill, 0, R, ['#5b3f8c', '#4f7cac', '#9ec5f0', '#e8e1f0']);
      if (!tidy) { ctx.strokeStyle = '#7a4b2e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(130, 70); ctx.stroke(); }
      break;
    }
    case 'galleon': {
      // curved hull planks, portholes, a mast, and water until it's pumped out
      ctx.strokeStyle = 'rgba(40,25,15,0.5)'; ctx.lineWidth = 1;
      for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(12, 20 + k * 13); ctx.quadraticCurveTo(CELL_W / 2, 30 + k * 13, CELL_W - 12, 20 + k * 13); ctx.stroke(); }
      [44, 106].forEach((x) => { circ(ctx, x, 44, 9, '#b98a3a'); circ(ctx, x, 44, 6.5, lit ? '#6fb3d6' : '#3a4a5a'); });
      ctx.fillStyle = '#7a4b2e'; ctx.fillRect(CELL_W / 2 - 3, 10, 6, floor - 10);
      if (tidy) { ctx.strokeStyle = '#6b4128'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(CELL_W / 2 + 34, floor - 20, 12, 0, 7); ctx.stroke(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(CELL_W / 2 + 34, floor - 20); ctx.lineTo(CELL_W / 2 + 34 + Math.cos(a) * 16, floor - 20 + Math.sin(a) * 16); ctx.stroke(); } }
      shelf(ctx, 20, floor - 34, 30, floor, fill, 0, R, ['#8a5a3a', '#b98457', '#e8d6b0']);
      if (!tidy) { ctx.fillStyle = 'rgba(80,150,190,0.65)'; ctx.fillRect(8, floor - 40, CELL_W - 16, 52); ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 6; k++) ctx.fillRect(16 + k * 20, floor - 40, 10, 1.2); }
      if (lit) { lantern(ctx, 30, 16); lantern(ctx, 120, 16); }
      break;
    }
    case 'echoes': {
      // stone columns and arches, braziers, tapestries
      ctx.fillStyle = '#9a94a0';
      [20, 66, 112].forEach((x) => { ctx.fillRect(x, 24, 14, floor - 24); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 10, 24, 3, floor - 24); ctx.fillStyle = '#aaa4b0'; ctx.fillRect(x - 2, 22, 18, 5); ctx.fillStyle = '#9a94a0'; });
      ctx.strokeStyle = '#aaa4b0'; ctx.lineWidth = 4; [[27, 73], [73, 119]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc((a + b) / 2, 30, (b - a) / 2, Math.PI, 0); ctx.stroke(); });
      if (!tidy) rubble(ctx, R);
      if (done) [[42, '#7a2f3a'], [88, '#2f4f7a']].forEach(([x, col]) => { fillRR(ctx, x, 34, 16, 34, 1, col); ctx.fillStyle = '#e8c465'; ctx.fillRect(x, 34, 16, 2); star(ctx, x + 8, 50, 4, '#e8c465'); });
      [44, 106].forEach((x) => { ctx.fillStyle = '#5a5460'; ctx.fillRect(x - 1.5, floor - 14, 3, 14); ell(ctx, x, floor - 15, 6, 2.4, '#6d6478'); if (lit) { ell(ctx, x, floor - 20, 3.6, 6, '#ff9a3c'); ell(ctx, x, floor - 19, 2, 3.6, '#ffe28a'); } });
      break;
    }
    case 'stair': {
      // a spiral stair winding down into the warm dark
      for (let k = 0; k < 7; k++) {
        const x = CELL_W / 2 + Math.sin(k * 0.9) * 40; const y = 26 + k * 12;
        fillRR(ctx, x - 16, y, 32, 5, 1.5, (tidy || k % 3) ? '#8a7a6a' : '#5a4c3e');
        if (lit && k % 2 === 0) lantern(ctx, x + 18, y - 10);
      }
      ctx.strokeStyle = done ? '#d9a441' : '#6a5a3a'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 7; k++) { const x = CELL_W / 2 + Math.sin(k * 0.9) * 40 - 16; const y = 16 + k * 12; ctx.lineTo(x, y); } ctx.stroke();
      if (!tidy) rubble(ctx, R);
      // warm light from far below
      const g2 = ctx.createLinearGradient(0, floor - 30, 0, CELL_H); g2.addColorStop(0, 'rgba(255,150,80,0)'); g2.addColorStop(1, 'rgba(255,150,80,0.35)'); ctx.fillStyle = g2; ctx.fillRect(8, floor - 30, CELL_W - 16, 40);
      break;
    }
    default: { // study: Thessaly's desk, her portrait, her glasses
      shelf(ctx, 16, 26, 34, floor, fill, 0, R);
      shelf(ctx, CELL_W - 50, 26, 34, floor, fill, 0, R);
      fillRR(ctx, 58, floor - 26, 36, 5, 1.5, '#8a5a3a'); ctx.fillStyle = '#6b4128'; ctx.fillRect(60, floor - 21, 3, 21); ctx.fillRect(89, floor - 21, 3, 21);
      fillRR(ctx, 62, floor - 31, 14, 5, 1, '#fbf6ea'); ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(82, floor - 29, 2, 0, 7); ctx.arc(87, floor - 29, 2, 0, 7); ctx.stroke();
      candle(ctx, 90, floor - 26, lit);
      fillRR(ctx, 62, 30, 28, 34, 2, '#c9a227'); ctx.fillStyle = tidy ? '#e8d9c0' : '#8a806e'; ctx.fillRect(65, 33, 22, 28);
      // Thessaly's portrait: a proper bust inside the frame
      ctx.save(); ctx.beginPath(); ctx.rect(65, 33, 22, 28); ctx.clip();
      drawMouse(ctx, 73, 67, { fur: '#d9d0c4', belly: '#f6efe4', glasses: true, scarf: '#5b3f8c', hat: 'bow', hatCol: '#7a5a42', dir: 1, s: 0.95, noShadow: true, pose: 'stand', t: 1, full: true });
      ctx.restore();
      ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 1; ctx.strokeRect(64.5, 32.5, 23, 29);
      if (!tidy) cobwebs(ctx);
      if (done) { ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 1; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(70 + k * 2, floor - 36, 1.6, 0, 7); ctx.stroke(); } }
    }
  }
  if (!tidy && theme !== 'echoes' && theme !== 'stair') { cobwebs(ctx); rubble(ctx, R); }
  if (!lit && theme !== 'crystal') { ctx.fillStyle = 'rgba(8,6,10,0.25)'; ctx.fillRect(8, 10, CELL_W - 16, CELL_H - 20); }
  // brass name plaque once restored
  if (done) {
    const name = HALLS[n].name.replace('The ', '');
    ctx.font = `700 5.6px ${FONT}`; const tw = ctx.measureText(name).width + 10;
    fillRR(ctx, CELL_W / 2 - tw / 2, 12, tw, 9, 2, '#b98a3a'); ctx.fillStyle = '#3a2a10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, CELL_W / 2, 16.8);
  }
}
void tex;
