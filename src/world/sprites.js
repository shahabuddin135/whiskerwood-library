// Characters (and any art that rarely changes) drawn from cached pictures ("sprites") instead of
// shape by shape. A mouse is about fifty vector shapes, and a busy library has well over a hundred
// characters on screen: thousands of shapes every frame, far too many for a phone. Instead, each
// look is painted once per animation frame, like a flip-book, and every frame after that just
// stamps pictures, which the GPU does almost for free.
//
// Small pictures are packed into a few big "atlas" canvases (the way game engines do it): stamping
// many pictures from one texture is far cheaper than from hundreds of separate little images.
// New ones are painted at the start of the next frame, before anything is stamped, so a page is
// never changed while the screen is still drawing from it. Big pictures (hills, trees, the roof)
// get a canvas each.
//
// sprite(...) returns false when it can't stamp this time (not painted yet, or no room); the
// caller then draws something else (a nearby animation frame, or plain shapes).
const cache = new Map(); // key@step → { pg, sx, sy, cw, ch, px, used } (pg: atlas page, else c: own canvas)
const PAGE = 2048; const PAD = 2; const BIG = 400; // pictures bigger than BIG pixels get their own canvas
const mem = navigator.deviceMemory || 8; // GB (roughly), where the browser tells us
const MAX_PAGES = mem <= 2 ? 1 : mem <= 4 ? 2 : 3; // 16 MB each
const BIG_BUDGET = mem <= 2 ? 2e6 : 4e6; // pixels of big pictures kept (8 or 16 MB)
const MAX_SIDE = 4096; // phones refuse very large canvases
const pages = [];
let bigPixels = 0;
let tick = 0;
let queue = new Map(); // atlas pictures to paint at the start of the next frame
let hold = false;
let enabled = true;
let painting = false; // while a picture is being painted, anything drawn inside it is drawn as shapes
let lookupOnly = false;
// Painting is limited per frame, so a slow phone doesn't stutter while pictures fill in.
// Each frame may spend a little time painting new pictures: a few milliseconds, at most a handful
// of small ones and one or two big ones (the GPU has to draw them too, after the script is done).
// Behind the storybook, while nobody is watching, the allowance is much bigger (setWarmup).
let artMade = 0; let artMode = false; let bigMs = 0;
let lastPainted = 0; let lastPaintTick = -1000;
let BUDGET_MS = 4; let MAX_SMALL = 8; let MAX_BIG = 2;
export function setWarmup(on) { BUDGET_MS = on ? 24 : 4; MAX_SMALL = on ? 80 : 8; MAX_BIG = on ? 8 : 2; }
// Still filling in: something was painted in the last second or so, or is waiting to be.
export const spritesWarming = () => queue.size > 0 || tick - lastPaintTick < 60;

// Once per rendered frame, before anything is drawn. While zooming, pictures at any resolution
// are reused (the sharp ones are painted once the zoom settles).
export function spriteFrame(zooming) {
  tick++; artMade = 0; bigMs = 0; hold = zooming;
  if (bigPixels > BIG_BUDGET) evictBig(BIG_BUDGET * 0.75);
  paintQueued(zooming ? 1.5 : BUDGET_MS);
}
export function setSprites(on) { enabled = on; if (!on) clearSprites(); }
export const spritesOn = () => enabled && !painting;
export function clearSprites() {
  cache.clear(); queue.clear(); bigPixels = 0;
  for (const pg of pages) { pg.x.clearRect(0, 0, PAGE, PAGE); pg.shelves = []; pg.bottom = 0; pg.keys = []; }
}
export const spriteStats = () => ({ count: cache.size, pages: pages.length, mb: +(((bigPixels + pages.length * PAGE * PAGE) * 4) / 1e6).toFixed(1), made: lastPainted, queued: queue.size });

// Picture resolutions come in steps of about a quarter (step n = 2^(n/3) pixels per unit), so
// small zoom changes reuse them. The same look can be on screen at two sizes at once. Characters
// drawn smaller than life size share their full-size pictures (scaled down, they stay sharp).
const stepOf = (k) => Math.min(9, Math.max(-3, Math.ceil(Math.log2(k) * 3 - 0.01)));
function near(key, step) { // while zooming: any resolution will do for now
  for (const d of [1, -1, 2, -2, 3, -3, 4, -4]) { const e = cache.get(key + '@' + (step + d)); if (e) return e; }
  return null;
}
const sizeOf = (box, px) => {
  px = Math.min(px, MAX_SIDE / box[2], MAX_SIDE / box[3]);
  return [Math.max(1, Math.ceil(box[2] * px)), Math.max(1, Math.ceil(box[3] * px)), px];
};

/* ---- atlas pages: shelves of pictures ---- */
function newPage() {
  const c = document.createElement('canvas'); c.width = c.height = PAGE;
  return { c, x: c.getContext('2d'), shelves: [], bottom: 0, used: tick, keys: [] };
}
function place(pg, w, h) {
  for (const sh of pg.shelves) if (h <= sh.h && h >= sh.h * 0.7 && sh.x + w <= PAGE) { const at = sh.x; sh.x += w; return [at, sh.y]; }
  if (pg.bottom + h > PAGE) return null;
  pg.shelves.push({ y: pg.bottom, h, x: w }); pg.bottom += h;
  return [0, pg.bottom - h];
}
function alloc(cw, ch) {
  const w = cw + PAD; const h = ch + PAD;
  for (const pg of pages) { const at = place(pg, w, h); if (at) return [pg, at]; }
  if (pages.length < MAX_PAGES) { const pg = newPage(); pages.push(pg); return [pg, place(pg, w, h)]; }
  // every page is full: start over on the one that's gone longest without being drawn from
  let old = pages[0]; for (const pg of pages) if (pg.used < old.used) old = pg;
  if (old.used > tick - 30) return null; // they're all in use: wait for things to settle
  for (const k of old.keys) cache.delete(k);
  old.keys = []; old.shelves = []; old.bottom = 0; old.x.clearRect(0, 0, PAGE, PAGE);
  return [old, place(old, w, h)];
}
function paintQueued(ms) {
  lastPainted = 0;
  if (!queue.size) return;
  const t0 = performance.now();
  for (const [full, q] of queue) {
    if (lastPainted >= MAX_SMALL || (lastPainted >= 2 && performance.now() - t0 > ms)) break;
    queue.delete(full);
    if (cache.has(full)) continue;
    const got = alloc(q.cw, q.ch); if (!got) { queue.clear(); break; }
    const [pg, [sx, sy]] = got;
    const x = pg.x;
    x.save();
    x.beginPath(); x.rect(sx, sy, q.cw, q.ch); x.clip();
    x.setTransform(q.px, 0, 0, q.px, sx - q.box[0] * q.px, sy - q.box[1] * q.px);
    painting = true;
    try { q.fn(x, q.o, q.pose, q.ph, false); } finally { painting = false; }
    x.restore();
    cache.set(full, { pg, sx, sy, cw: q.cw, ch: q.ch, px: q.px, used: tick });
    pg.keys.push(full);
    lastPainted++; lastPaintTick = tick;
  }
  queue.clear(); // whatever didn't fit is asked for again next frame if it's still needed
}

/* ---- big pictures: a canvas each ---- */
function paintBig(cw, ch, px, box, fn, o, pose, ph) {
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const x = c.getContext('2d');
  x.setTransform(px, 0, 0, px, -box[0] * px, -box[1] * px);
  painting = true;
  try { fn(x, o, pose, ph, false); } finally { painting = false; }
  return { c, sx: 0, sy: 0, cw, ch, px, used: tick };
}
// Drop the big pictures that have gone longest without being drawn.
function evictBig(target) {
  const list = [...cache].filter(([, e]) => e.c).sort((a, b) => a[1].used - b[1].used);
  for (const [k, e] of list) {
    if (bigPixels <= target || e.used >= tick - 1) break;
    bigPixels -= e.cw * e.ch; cache.delete(k);
  }
}

// Stamps the picture `key` with its origin (a character's feet) at (x, y), mirrored when dir < 0,
// scaled by s. `box` = [x, y, w, h] is the area the character can cover around its feet, at s = 1.
// When it isn't painted yet, fn(ctx, o, pose, phase) is queued to paint it. skew leans the picture
// sideways (x += skew * y), which is how trees and flowers sway without a picture per frame.
export function sprite(ctx, key, box, x, y, dir, s, alpha, fn, o, pose, ph, skew = 0) {
  if (!enabled || painting || alpha <= 0) return alpha <= 0 && enabled && !painting;
  const m = ctx.getTransform();
  const step = stepOf(Math.hypot(m.a, m.b) * (s > 1 ? s : 1));
  const full = key + '@' + step;
  let e = cache.get(full);
  if (!e && hold) e = near(key, step);
  if (!e) {
    if (lookupOnly) return false;
    const [cw, ch, px] = sizeOf(box, 2 ** (step / 3));
    if (cw > BIG || ch > BIG) {
      // big pictures (scenery, the dragon) are painted straight away, one or two a frame
      if (artMade >= MAX_BIG || (artMade >= 1 && bigMs > BUDGET_MS)) return false;
      artMade++; lastPaintTick = tick;
      const t0 = performance.now();
      e = paintBig(cw, ch, px, box, fn, o, pose, ph);
      bigMs += performance.now() - t0;
      bigPixels += cw * ch; cache.set(full, e);
    } else {
      if (!queue.has(full) && queue.size < 200) queue.set(full, { cw, ch, px, box, fn, o, pose, ph });
      return false;
    }
  }
  e.used = tick;
  const img = e.pg ? e.pg.c : e.c;
  if (e.pg) e.pg.used = tick;
  const ga = ctx.globalAlpha;
  if (alpha < 1) ctx.globalAlpha = ga * alpha;
  const w = e.cw / e.px; const h = e.ch / e.px;
  if (dir > 0 && !skew) {
    // the common case needs no change of transform: just a scaled rectangle
    ctx.drawImage(img, e.sx, e.sy, e.cw, e.ch, x + box[0] * s, y + box[1] * s, w * s, h * s);
  } else {
    const sx = dir < 0 ? -s : s; const kx = skew * s;
    ctx.setTransform(m.a * sx, m.b * sx, m.a * kx + m.c * s, m.b * kx + m.d * s, m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f);
    ctx.drawImage(img, e.sx, e.sy, e.cw, e.ch, box[0], box[1], w, h);
    ctx.setTransform(m);
  }
  if (alpha < 1) ctx.globalAlpha = ga;
  return true;
}

// Stamps one of the given animation frames that's already painted (the nearest after `f`), for a
// character whose own frame isn't painted yet: better a frame early than shapes.
export function spriteNearFrame(ctx, prefix, suffix, f, n, box, x, y, dir, s, alpha) {
  lookupOnly = true;
  let ok = false;
  for (let d = 1; d < n && !ok; d++) ok = sprite(ctx, prefix + ((f + d) % n) + suffix, box, x, y, dir, s, alpha);
  lookupOnly = false;
  return ok;
}

// Art that rarely changes (trees, ivy, hills, lanterns, flower beds...), drawn at (x, y) scaled by
// s: painted once into a picture, then stamped. paint(ctx, arg) draws it in its own coordinates and
// box = [x, y, w, h] covers it. The key must change whenever the picture would (season, light...).
// Until its picture is ready it's painted directly, so it never pops out. A negative s mirrors it.
const viaArt = (ctx, paint, arg) => paint(ctx, arg);
export function art(ctx, key, box, paint, arg, x = 0, y = 0, s = 1, skew = 0, alpha = 1) {
  const k = Math.abs(s);
  artMode = true;
  const ok = sprite(ctx, key, box, x, y, s < 0 ? -1 : 1, k, alpha, viaArt, paint, arg, 0, skew);
  artMode = false;
  if (ok) return;
  ctx.save(); ctx.translate(x, y); ctx.transform(s, 0, skew * k, k, 0, 0);
  if (alpha < 1) ctx.globalAlpha *= alpha;
  paint(ctx, arg);
  ctx.restore();
}

// Animated art as a little flip-book: paint(ctx, arg, t) is painted at n moments of a loop lasting
// `period` seconds, and the frame for time t is stamped. For decorations whose twinkles and sways
// don't need more than a few frames a second, it turns dozens of shapes into one picture.
const viaFrame = (ctx, a) => a.paint(ctx, a.arg, a.t);
export function animArt(ctx, key, box, paint, arg, t, period, n, x = 0, y = 0, s = 1) {
  const f = Math.floor((((t / period) % 1) + 1) % 1 * n) % n;
  art(ctx, `${key}#${f}`, box, viaFrame, { paint, arg, t: ((f + 0.5) / n) * period }, x, y, s);
}
