// Soft glows (lamps, lanterns, fireflies, the lift, ready bubbles) drawn from pre-rendered sprites.
// Building a radial gradient every frame for every lamp was one of the most expensive things the
// game did; stamping a small cached image is much cheaper for the CPU and the GPU.
const sprites = new Map();
const SIZE = 64;

function sprite(rgb, falloff) {
  const key = rgb + '|' + falloff;
  let c = sprites.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = SIZE;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2);
  g.addColorStop(0, `rgba(${rgb},1)`);
  if (falloff === 'soft') g.addColorStop(0.35, `rgba(${rgb},0.55)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, SIZE, SIZE);
  sprites.set(key, c);
  return c;
}

// A round glow of radius r at (x, y). `rgb` is "255,214,140". Optional clip band [y0, y1]
// (e.g. a floor's walls) so the light never spills into the room above or below.
export function glow(ctx, x, y, r, rgb, alpha, y0 = -Infinity, y1 = Infinity, falloff = 'soft') {
  if (alpha <= 0.004 || r <= 0) return;
  const img = sprite(rgb, falloff);
  let top = y - r; let bot = y + r;
  if (top >= y1 || bot <= y0) return;
  const cropTop = Math.max(0, y0 - top); const cropBot = Math.max(0, bot - y1);
  const k = SIZE / (2 * r);
  const a = ctx.globalAlpha; ctx.globalAlpha = a * Math.min(1, alpha);
  ctx.drawImage(img, 0, cropTop * k, SIZE, SIZE - (cropTop + cropBot) * k, x - r, top + cropTop, 2 * r, 2 * r - cropTop - cropBot);
  ctx.globalAlpha = a;
  void bot; top = 0;
}

// Same, stretched into an ellipse (rx by ry).
export function glowEllipse(ctx, x, y, rx, ry, rgb, alpha, falloff = 'soft') {
  if (alpha <= 0.004) return;
  const a = ctx.globalAlpha; ctx.globalAlpha = a * Math.min(1, alpha);
  ctx.drawImage(sprite(rgb, falloff), x - rx, y - ry, rx * 2, ry * 2);
  ctx.globalAlpha = a;
}
