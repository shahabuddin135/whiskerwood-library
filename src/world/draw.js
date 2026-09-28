// Canvas drawing primitives, the mouse character and small props.

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function fillRR(ctx, x, y, w, h, r, fill) { rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
export function ell(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}
export function circ(ctx, x, y, r, fill) { ell(ctx, x, y, r, r, fill); }

// Lighten (amt > 0) or darken (amt < 0) a hex colour.
const shadeCache = new Map();
export function shade(hex, amt) {
  const key = hex + amt;
  if (shadeCache.has(key)) return shadeCache.get(key);
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255; const p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  const out = `rgb(${r},${g},${b})`;
  shadeCache.set(key, out);
  return out;
}
export function rgba(hex, a) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const n = parseInt(c, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function star(ctx, x, y, r, fill, points = 5, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r * inner : r;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}

export function heart(ctx, x, y, s, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.45, y - s, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s, x + s, y - s * 0.3, x, y + s * 0.35);
  ctx.fillStyle = fill; ctx.fill();
}

export function coinIcon(ctx, x, y, r) {
  circ(ctx, x, y, r, '#e9a623');
  circ(ctx, x, y, r * 0.78, '#ffd257');
  ctx.fillStyle = '#e9a623';
  ctx.fillRect(x - r * 0.12, y - r * 0.45, r * 0.24, r * 0.9);
}

/* ------------------------------------------------------------------ */
/* Mouse                                                               */
/* ------------------------------------------------------------------ */
const PINK = '#f2b1ab';
const FOOT = '#eea69e';
const EYE = '#2b2320';

// Draws a mouse with its feet at (x, y). o.dir: 1 faces right, -1 faces left.
export function drawMouse(ctx, x, y, o) {
  const s = o.s ?? 1;
  const t = o.t ?? 0;
  const pose = o.pose || 'stand';
  const fur = o.fur || '#b8aca1';
  const belly = o.belly || '#efe6dc';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale((o.dir || 1) * s, s);
  if (o.alpha != null && o.alpha < 1) ctx.globalAlpha *= Math.max(0, o.alpha);

  const sitting = pose === 'sit' || pose === 'read';
  const walking = pose === 'walk';
  const bob = walking ? Math.abs(Math.sin(t * 9)) * 1.6 : Math.sin(t * 2.2) * 0.35;
  const sway = Math.sin(t * 2.6 + (o.seed || 0)) * 3;

  if (!o.noShadow) ell(ctx, sitting ? 2 : 0, 0.6, 10, 2.4, 'rgba(0,0,0,0.14)');

  // Tail
  ctx.strokeStyle = PINK; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
  ctx.beginPath();
  if (sitting) { ctx.moveTo(-6, -4); ctx.bezierCurveTo(-14, -2, -16, 3 + sway * 0.3, -10, 0.5); }
  else { ctx.moveTo(-7, -7 - bob); ctx.bezierCurveTo(-16, -4, -21, -14 + sway, -15, -21 + sway * 0.6); }
  ctx.stroke();

  // Royal cape
  if (o.cape) {
    ctx.fillStyle = o.cape;
    ctx.beginPath();
    ctx.moveTo(-1, -20 - bob); ctx.quadraticCurveTo(-14, -12, -12, sitting ? -2 : -0.5);
    ctx.lineTo(4, sitting ? -2 : -0.5); ctx.quadraticCurveTo(2, -12, 5, -20 - bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7f1e6';
    ctx.fillRect(-12, (sitting ? -3.5 : -2) , 16, 1.6);
  }

  const hx = sitting ? 3 : 4;
  const hy = (sitting ? -19 : -23) - bob + (pose === 'read' ? Math.sin(t * 1.3) * 0.5 + 0.8 : 0);

  if (sitting) {
    ell(ctx, 0, -8, 8.5, 8.5, fur);
    ell(ctx, 3, -7.5, 5, 6, belly);
    ell(ctx, 7, -2.2, 5.5, 2.6, fur); // thigh
    ell(ctx, 11.5, -1.8, 3.2, 1.8, FOOT);
  } else {
    const p = walking ? Math.sin(t * 9) : 0;
    ell(ctx, -3 + p * 3, -1.1, 3.4, 1.8, FOOT);
    ell(ctx, 3 - p * 3, -1.1, 3.4, 1.8, FOOT);
    ell(ctx, 0, -10 - bob, 8.5, 10, fur);
    ell(ctx, 3, -9 - bob, 5, 7, belly);
  }
  const by = sitting ? 0 : -bob;

  if (o.apron) { fillRR(ctx, -2, -17 + by, 11, 14, 3, o.apron); }
  if (o.vest) { ctx.fillStyle = o.vest; ctx.beginPath(); ctx.ellipse(-1, -10 + by, 8.2, 9.2, 0, Math.PI * 0.55, Math.PI * 1.45); ctx.fill(); }

  // Scarf
  if (o.scarf) {
    fillRR(ctx, -5, -19.5 + by + (sitting ? 3.5 : 0), 14, 4.2, 2, o.scarf);
    ctx.fillStyle = shade(o.scarf, -0.12);
    ctx.beginPath(); const sy = -18 + by + (sitting ? 3.5 : 0);
    ctx.moveTo(-4, sy); ctx.lineTo(-8 + sway * 0.3, sy + 8); ctx.lineTo(-5, sy + 8.5); ctx.lineTo(-1, sy + 1); ctx.fill();
  }

  // Arms and held items
  if (pose === 'reach') {
    ell(ctx, 6, -24 - bob, 2.3, 5, fur, -0.3);
    if (o.book) fillRR(ctx, 6, -34 - bob, 6, 8, 1, o.book);
  } else if (pose === 'pay') {
    ell(ctx, 8, -13, 4.5, 2.2, fur);
    coinIcon(ctx, 13, -14, 2.8);
  } else if (pose === 'hammer') {
    const a = Math.sin(t * 14) * 0.9 - 0.3;
    ctx.save(); ctx.translate(5, -14); ctx.rotate(a);
    ell(ctx, 3, 0, 4, 2.2, fur);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(5, -1, 9, 1.8);
    ctx.fillStyle = '#6d6d78'; ctx.fillRect(12, -3.5, 4, 6.5);
    ctx.restore();
  } else if (pose === 'read') {
    // Open book held up
    const bc = o.book || '#c0504d';
    ctx.fillStyle = '#fbf6ea';
    ctx.beginPath(); ctx.moveTo(6.5, -17); ctx.lineTo(10.5, -14); ctx.lineTo(10.5, -7.5); ctx.lineTo(6.5, -10.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10.5, -14); ctx.lineTo(14.5, -17); ctx.lineTo(14.5, -10.5); ctx.lineTo(10.5, -7.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = bc; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(6.5, -10.5); ctx.lineTo(10.5, -7.5); ctx.lineTo(14.5, -10.5); ctx.stroke();
    ell(ctx, 8, -9.5, 2.2, 3, fur);
  } else if (pose === 'wave') {
    ell(ctx, 7, -22 - bob + Math.sin(t * 10) * 1.5, 2.3, 4.5, fur, -0.5 + Math.sin(t * 10) * 0.3);
  } else {
    ell(ctx, 4.5, -10.5 + by, 2.3, 4.2, fur, 0.2);
    if (o.book && !sitting) fillRR(ctx, 4, -17 + by, 7, 9, 1, o.book);
  }

  // Head
  ell(ctx, hx - 1, hy - 9, 5.2, 5.2, shade(fur, -0.12));
  ell(ctx, hx - 1, hy - 9, 3.2, 3.2, shade(PINK, -0.08));
  ell(ctx, hx, hy, 7.8, 7.6, fur);
  ell(ctx, hx + 6.3, hy + 1.8, 5.3, 4, fur);
  ell(ctx, hx + 3.2, hy + 3.4, 1.9, 1.5, 'rgba(240,130,130,0.4)');
  ell(ctx, hx - 3.8, hy - 8, 6.2, 6.2, fur);
  ell(ctx, hx - 3.5, hy - 7.7, 4.2, 4.2, PINK);

  // Eye (blinks now and then)
  const blink = o.sleep || ((t + (o.seed || 0) * 1.7) % 4.2) < 0.13;
  if (blink) { ctx.strokeStyle = EYE; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(hx + 2.4, hy - 1); ctx.lineTo(hx + 5.2, hy - 1); ctx.stroke(); }
  else if (pose === 'happy') {
    ctx.strokeStyle = EYE; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(hx + 3.8, hy - 0.6, 1.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else { circ(ctx, hx + 3.8, hy - 1.2, 1.55, EYE); circ(ctx, hx + 4.3, hy - 1.8, 0.55, '#fff'); }
  circ(ctx, hx + 11.3, hy + 1.1, 1.55, '#e98b8b');

  ctx.strokeStyle = 'rgba(90,70,60,0.45)'; ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(hx + 9, hy + 2.4); ctx.lineTo(hx + 15.5, hy + 0.6);
  ctx.moveTo(hx + 9, hy + 2.8); ctx.lineTo(hx + 16, hy + 3.4);
  ctx.moveTo(hx + 9, hy + 3.2); ctx.lineTo(hx + 15, hy + 6);
  ctx.stroke();

  if (o.glasses) {
    ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(hx + 4, hy - 1.1, 2.6, 0, Math.PI * 2); ctx.moveTo(hx + 1.4, hy - 1.4); ctx.lineTo(hx - 3, hy - 3); ctx.stroke();
  }
  if (o.shades) { fillRR(ctx, hx + 1.2, hy - 3.2, 6, 3.6, 1.4, '#1d1b24'); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(hx + 2.2, hy - 2.7, 1.5, 0.8); }
  if (o.monocle) {
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.arc(hx + 4, hy - 1.1, 2.7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 4, hy + 1.6); ctx.quadraticCurveTo(hx + 2, hy + 8, hx - 1, hy + 9); ctx.stroke();
  }
  drawHat(ctx, o.crown ? 'crown' : o.hat, hx, hy, o.hatCol, t);

  if (o.umbrella) {
    ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(6, -12 - bob); ctx.lineTo(4, hy - 22); ctx.stroke();
    ctx.fillStyle = o.umbrella;
    ctx.beginPath(); ctx.moveTo(4 - 15, hy - 20); ctx.quadraticCurveTo(4, hy - 38, 4 + 15, hy - 20);
    for (let k = 0; k < 4; k++) ctx.quadraticCurveTo(4 + 15 - k * 7.5 - 3.75, hy - 23, 4 + 15 - (k + 1) * 7.5, hy - 20);
    ctx.fill();
    circ(ctx, 4, hy - 29.5, 1, '#4a3a30');
  }
  if (o.sack) {
    ell(ctx, -9, -16 - bob, 7, 6.5, '#b9a27c');
    ctx.fillStyle = '#e9a623'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', -9, -14 - bob);
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Baroness Clawdia, the cat                                           */
/* ------------------------------------------------------------------ */
// mode 'peek': head + paws (origin = chin), 'bust' for portraits.
export function drawCat(ctx, x, y, { s = 1, t = 0, mode = 'peek', squint = 0, flee = 0 } = {}) {
  const FUR = '#8e86a3'; const DK = '#6f6884'; const LT = '#e4dfee';
  ctx.save(); ctx.translate(x, y + flee * 30); ctx.scale(s, s);
  if (mode === 'bust') {
    ell(ctx, 0, 30, 24, 20, FUR); ell(ctx, 0, 30, 12, 14, LT);
    for (let k = -3; k <= 3; k++) circ(ctx, k * 4.2, 17 + Math.abs(k) * 1.2, 1.9, '#f7f1e6');
  }
  // tail swish
  if (mode === 'peek') {
    ctx.strokeStyle = FUR; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(18, 12); ctx.quadraticCurveTo(34, 4 + Math.sin(t * 3) * 6, 30, -14 + Math.sin(t * 3 + 1) * 5); ctx.stroke();
  }
  // ears
  const ear = (sx) => {
    ctx.fillStyle = FUR; ctx.beginPath(); ctx.moveTo(sx * 5, -9); ctx.lineTo(sx * 15, -24 + Math.sin(t * 2) * (sx > 0 ? 1 : 0)); ctx.lineTo(sx * 16, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a3b8'; ctx.beginPath(); ctx.moveTo(sx * 8, -9); ctx.lineTo(sx * 14, -19); ctx.lineTo(sx * 14.5, -7); ctx.closePath(); ctx.fill();
  };
  ear(-1); ear(1);
  // head + cheek fluff
  ell(ctx, 0, 0, 17, 14, FUR);
  ctx.fillStyle = FUR;
  [-1, 1].forEach((sx) => { ctx.beginPath(); ctx.moveTo(sx * 14, 2); ctx.lineTo(sx * 21, 6); ctx.lineTo(sx * 15, 8); ctx.lineTo(sx * 20, 11); ctx.lineTo(sx * 11, 11); ctx.fill(); });
  ctx.fillStyle = DK; for (let k = -1; k <= 1; k++) { ctx.fillRect(k * 4 - 0.8, -13, 1.6, 5); }
  ell(ctx, 0, 6, 8, 5.2, LT);
  // eyes (smug half-lids)
  [-1, 1].forEach((sx) => {
    ell(ctx, sx * 6.5, -1.5, 4, 4.4, '#a6d86b');
    ell(ctx, sx * 6.5, -1.5, 0.9 + squint * 0.3, 3.6 - squint * 2, '#1d1b24');
    circ(ctx, sx * 6.5 + 1.2, -3, 0.8, '#fff');
    ctx.fillStyle = FUR; ctx.beginPath(); ctx.ellipse(sx * 6.5, -4.6 - squint * 1.5, 4.6, 2.8 + squint * 1.6, 0, Math.PI, 0); ctx.fill();
  });
  ctx.fillStyle = '#e98b9e'; ctx.beginPath(); ctx.moveTo(-1.8, 3.6); ctx.lineTo(1.8, 3.6); ctx.lineTo(0, 5.6); ctx.fill();
  ctx.strokeStyle = '#4a3a50'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(0, 5.6); ctx.quadraticCurveTo(-2, 8, -3.5, 6.8); ctx.moveTo(0, 5.6); ctx.quadraticCurveTo(2, 8, 3.5, 6.8); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.5;
  [-1, 1].forEach((sx) => { for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(sx * 7, 5 + k * 1.3); ctx.lineTo(sx * 21, 2 + k * 3.2); ctx.stroke(); } });
  // tiny baroness hat with feather
  fillRR(ctx, 3, -16, 10, 4, 1.5, '#6d3f8f');
  ctx.strokeStyle = '#f2d27a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(10, -16); ctx.quadraticCurveTo(16, -26, 22, -24); ctx.stroke();
  if (mode === 'peek') {
    [-1, 1].forEach((sx) => { ell(ctx, sx * 11, 14, 6.5, 4.2, FUR); ctx.strokeStyle = DK; ctx.lineWidth = 0.6; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(sx * 11 + k * 2.2, 11.5); ctx.lineTo(sx * 11 + k * 2.2, 14); ctx.stroke(); } });
  }
  ctx.restore();
}

export function drawWorm(ctx, x, y, t, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let k = 3; k >= 0; k--) circ(ctx, -k * 2.4, Math.sin(t * 9 + k) * 1.3, 2 - k * 0.15, k === 0 ? '#9ccf5a' : '#8bc34a');
  circ(ctx, 0.8, -0.6, 0.55, '#1d1b24');
  ctx.restore();
}

function drawHat(ctx, hat, hx, hy, col, t) {
  if (!hat) return;
  switch (hat) {
    case 'beret': ell(ctx, hx - 1, hy - 6.5, 7.5, 3, col || '#6a3d6e'); circ(ctx, hx - 1, hy - 9.8, 1, col || '#6a3d6e'); break;
    case 'tophat':
      fillRR(ctx, hx - 5.5, hy - 20, 10, 13, 1, '#2a2430');
      ctx.fillStyle = '#7a2f3a'; ctx.fillRect(hx - 5.5, hy - 10.5, 10, 2.2);
      ell(ctx, hx - 0.5, hy - 7, 9, 1.9, '#2a2430'); break;
    case 'bow':
      ctx.fillStyle = col || '#e8718d';
      ctx.beginPath(); ctx.moveTo(hx - 4, hy - 11); ctx.lineTo(hx - 9, hy - 14.5); ctx.lineTo(hx - 9, hy - 7.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx - 4, hy - 11); ctx.lineTo(hx + 1, hy - 14.5); ctx.lineTo(hx + 1, hy - 7.5); ctx.closePath(); ctx.fill();
      circ(ctx, hx - 4, hy - 11, 1.6, shade(col || '#e8718d', -0.15)); break;
    case 'flower':
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + t * 0.2; circ(ctx, hx + 1 + Math.cos(a) * 2.2, hy - 9 + Math.sin(a) * 2.2, 1.7, col || '#f7a8c4'); }
      circ(ctx, hx + 1, hy - 9, 1.3, '#ffd257'); break;
    case 'cap':
      ctx.fillStyle = col || '#4f7cac'; ctx.beginPath(); ctx.arc(hx, hy - 4.5, 7.6, Math.PI, 0); ctx.fill();
      ell(ctx, hx + 7, hy - 4.5, 5, 1.4, shade(col || '#4f7cac', -0.2)); break;
    case 'bobble':
      ctx.fillStyle = col || '#c0504d'; ctx.beginPath(); ctx.arc(hx, hy - 4, 7.8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff6ea'; ctx.fillRect(hx - 7.8, hy - 5, 15.6, 2.2); circ(ctx, hx, hy - 12.5, 2.2, '#fff6ea'); break;
    case 'crown':
      ctx.fillStyle = '#f2c230';
      ctx.beginPath(); ctx.moveTo(hx - 6, hy - 7); ctx.lineTo(hx - 6, hy - 14); ctx.lineTo(hx - 3, hy - 10); ctx.lineTo(hx, hy - 16);
      ctx.lineTo(hx + 3, hy - 10); ctx.lineTo(hx + 6, hy - 14); ctx.lineTo(hx + 6, hy - 7); ctx.closePath(); ctx.fill();
      circ(ctx, hx, hy - 9.5, 1.2, '#e0404f'); circ(ctx, hx - 4, hy - 9, 0.9, '#3f8fd9'); circ(ctx, hx + 4, hy - 9, 0.9, '#3fbf7f'); break;
    case 'sunhat':
      ell(ctx, hx, hy - 6, 13, 2.6, col || '#f3e0b0'); ctx.fillStyle = col || '#f3e0b0'; ctx.beginPath(); ctx.arc(hx, hy - 6.5, 6.5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#e58fa8'; ctx.fillRect(hx - 6.5, hy - 8.4, 13, 1.9); break;
    case 'pirate':
      ctx.fillStyle = '#1f1c22'; ctx.beginPath(); ctx.moveTo(hx - 11, hy - 6); ctx.quadraticCurveTo(hx, hy - 20, hx + 11, hy - 6); ctx.quadraticCurveTo(hx, hy - 9, hx - 11, hy - 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 5px sans-serif'; ctx.fillText('☠', hx - 2.2, hy - 9.5); break;
    case 'star': star(ctx, hx - 2, hy - 11, 4.5, '#ffd257'); break;
    case 'headphones':
      ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hx - 1, hy - 3, 9, Math.PI * 1.1, Math.PI * 1.95); ctx.stroke();
      fillRR(ctx, hx - 7, hy - 5, 4.5, 6, 2, '#e05a6a'); break;
    case 'chef':
      fillRR(ctx, hx - 5.5, hy - 12, 11, 6, 1, '#ffffff'); circ(ctx, hx - 3, hy - 13, 3.5, '#fff'); circ(ctx, hx + 2, hy - 14, 4, '#fff'); circ(ctx, hx + 5, hy - 12, 3, '#fff'); break;
    case 'deerstalker':
      ctx.fillStyle = '#9c7b4f'; ctx.beginPath(); ctx.arc(hx, hy - 4.5, 7.8, Math.PI, 0); ctx.fill();
      ell(ctx, hx + 8, hy - 4.8, 3.5, 1.4, '#7d6040'); ell(ctx, hx - 8, hy - 4.8, 3.5, 1.4, '#7d6040');
      ctx.strokeStyle = 'rgba(60,40,20,.4)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(hx - 5, hy - 10); ctx.lineTo(hx + 5, hy - 5); ctx.moveTo(hx + 4, hy - 11); ctx.lineTo(hx - 5, hy - 5); ctx.stroke(); break;
    case 'wizard':
      ctx.fillStyle = col || '#4b3f78'; ctx.beginPath(); ctx.moveTo(hx - 8, hy - 5); ctx.lineTo(hx - 3, hy - 24); ctx.lineTo(hx + 7, hy - 5); ctx.closePath(); ctx.fill();
      star(ctx, hx - 1, hy - 12, 2.2, '#ffd257'); break;
    case 'hood':
      ctx.fillStyle = col || '#6b4a3a'; ctx.beginPath(); ctx.arc(hx - 1, hy - 1, 9.5, Math.PI * 0.75, Math.PI * 1.9); ctx.lineTo(hx - 1, hy + 6); ctx.fill(); break;
    case 'hardhat':
      ctx.fillStyle = '#f5c518'; ctx.beginPath(); ctx.arc(hx, hy - 4.5, 7.8, Math.PI, 0); ctx.fill();
      ell(ctx, hx + 1, hy - 4.3, 10, 1.6, '#e0a800'); break;
    case 'bandit':
      fillRR(ctx, hx - 6, hy - 3.6, 13.5, 4.2, 2, '#1d1b24');
      ctx.fillStyle = '#1d1b24'; ctx.beginPath(); ctx.moveTo(hx - 5, hy - 2); ctx.lineTo(hx - 10, hy - 5 + Math.sin(t * 12) * 1.2); ctx.lineTo(hx - 9, hy + 0.5); ctx.fill();
      circ(ctx, hx + 3.8, hy - 1.5, 1, '#fff'); circ(ctx, hx + 4, hy - 1.5, 0.5, '#1d1b24');
      ctx.fillStyle = '#3a3440'; ctx.beginPath(); ctx.arc(hx, hy - 5, 7.4, Math.PI, 0); ctx.fill();
      break;
    default: break;
  }
}

/* ------------------------------------------------------------------ */
/* Pigeon                                                              */
/* ------------------------------------------------------------------ */
export function drawPigeon(ctx, x, y, t, s = 1, parcel = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const flap = Math.sin(t * 14);
  if (parcel) {
    ctx.strokeStyle = '#7a5b3a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-2, 5); ctx.lineTo(-4, 14); ctx.moveTo(3, 5); ctx.lineTo(4, 14); ctx.stroke();
    fillRR(ctx, -9, 13, 16, 12, 2, '#c98b52');
    ctx.fillStyle = '#e0404f'; ctx.fillRect(-2, 13, 2.4, 12); ctx.fillRect(-9, 18, 16, 2.2);
    circ(ctx, -0.8, 12.5, 2.4, '#e0404f');
  }
  ell(ctx, 0, 0, 11, 6.5, '#a9b3c4');
  ell(ctx, 2, 1.5, 7, 4, '#c8d0dc');
  ctx.fillStyle = '#8894a8';
  ctx.beginPath(); ctx.moveTo(-10, -1); ctx.lineTo(-19, -4); ctx.lineTo(-18, 3); ctx.closePath(); ctx.fill();
  circ(ctx, 10, -4, 5, '#9aa5b8');
  ell(ctx, 10, -1, 3.5, 2, '#7fb59a');
  circ(ctx, 11.8, -5, 1.1, '#1f1c22');
  ctx.fillStyle = '#e8a33a'; ctx.beginPath(); ctx.moveTo(14.5, -4); ctx.lineTo(19, -2.8); ctx.lineTo(14.5, -2); ctx.fill();
  ctx.fillStyle = '#8f9bb0';
  ctx.beginPath(); ctx.moveTo(-3, -2); ctx.quadraticCurveTo(-8, -14 * flap - 2, 4, -18 * flap - 1); ctx.quadraticCurveTo(4, -6, 4, -2); ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Cheese wedge (used for rewards)                                     */
/* ------------------------------------------------------------------ */
export function drawCheese(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(8, 4); ctx.lineTo(8, -2); ctx.lineTo(-8, -6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2b72b'; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(8, -2); ctx.lineTo(4, -6); ctx.closePath(); ctx.fill();
  circ(ctx, -3, 0, 1.4, '#e8a41f'); circ(ctx, 3, 1.5, 1.1, '#e8a41f'); circ(ctx, 5, -1, 0.8, '#e8a41f');
  ctx.restore();
}
