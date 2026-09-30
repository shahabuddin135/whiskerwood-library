// Directs the ad: sets up the game's state for each scene, moves the camera, steps the game one
// frame at a time on a virtual clock, and draws the motion graphics on top.
// Runs inside the game's page (render.mjs injects it after timeline.js, audio.js and overlay.js).
window.AdDirector = (() => {
  const TL = window.AD_TIMELINE; const FX = window.AdFx;
  const { SCENES: SC, FPS } = TL;
  const { clamp01, lerp, easeInOut, easeOutCubic } = FX;
  const FOCUS_Y = 0.56; // where the camera's focus point sits on screen (leaves room for the titles)
  const COPY = window.AD_COPY || {};

  let g; let w; let s; let d; let cv; let ctx; let icon;
  let T0 = 0; // virtual ms at frame 0
  let lastT = -1;
  const vnow = (t) => window.__VCLOCK.base + T0 + t * 1000; // the game's Date.now() at ad time t

  // the Grand Lift's round trip with all six stops (see src/world/moleArt.js): the car reaches the
  // lawn at the start of every trip, so the ad lines one up with the lift-house shot
  const LIFT_TRIP = (() => { const ys = [82, 197, 382, 514, 646, 778, 1042, 1174]; const dist = (ys[7] - ys[0]) + (ys[7] - ys[1]) + (ys[1] - ys[0]); return 14 * 2.6 + dist / 48; })();
  const WORLD_T0 = LIFT_TRIP * 10 - 14.3; // world.t = ad time + this: the car arrives at 14.3 s

  const BIZ_CELLS = { mushroom: '1,0', pies: '3,1', jeweller: '6,1', tea: '7,1', spa: '4,2', cinema: '5,3', cheese: '6,3', post: '2,5' };
  const MAP = ['T..#E.F#T', '.#1..#...', '.###.#2#.', 'F.3#...#F', '##.###4..', '5F..6###7', '8##DDD.T.'];
  const ALL5 = () => [true, true, true, true, true];
  const cellX = (c) => -455 + c * 150; const cellY = (r) => 262 + r * 132;
  const floorTop = (i) => -(i + 1) * 190;

  /* ---------------- setup ---------------- */
  async function setup() {
    g = WWL.game; w = WWL.world; s = g.s; d = s.deep;
    s.settings.music = false; s.settings.sfx = false; g.noSave = true;
    w.events.next = Infinity; w.nextSpecial = Infinity; w.nextPigeon = Infinity;
    w.ambient.weather = { kind: 'clear', left: 1e9, intensity: 0, rainbow: 0 };
    w.timeOverride = 0.3;
    g.festival = () => null; // no festival decorations
    g.constructing = () => 99; // no "build the next floor" sign above the roof
    g.todaysClub = () => ({ id: 'dance', name: 'Dance Class', icon: '💃', line: '', lines: ['Cha-cha-cha!', 'Twirl!', 'Watch my tail!', 'Again!'] });
    WWL.ui.quality?.setMode?.('beautiful');
    // the fully grown library, wings and Deep Stacks
    s.branch = 0; s.coins = 1e30;
    s.rooms.forEach((r) => Object.assign(r, { built: true, buildEnd: 0, lvl: 150, seats: 6, shelves: 4, staff: 15, decor: ALL5() }));
    for (const id of ['cafe', 'hall', 'press', 'museum']) Object.assign(s.wings[id], { built: true, buildEnd: 0, lvl: 60, next: vnow(1e6), runEnd: 0, decor: ALL5(), up: [ALL5(), ALL5()] });
    s.wings.hall.runEnd = vnow(1e6); // tonight: Dance Class
    fullDeep();
    // let everyone arrive: 10 seconds of life before the camera rolls
    w.prefillAll();
    for (let k = 0; k < 300; k++) { window.__VCLOCK.t += 1000 / FPS; w.update(1 / FPS); }
    w.fx.list = [];
    T0 = window.__VCLOCK.t;
    // our own canvas on top of the game
    cv = document.createElement('canvas'); cv.id = 'adfx'; cv.width = 1080; cv.height = 1920;
    Object.assign(cv.style, { position: 'fixed', left: '0', top: '0', width: `${innerWidth}px`, height: `${innerHeight}px`, zIndex: 99999, pointerEvents: 'none' });
    document.body.appendChild(cv); ctx = cv.getContext('2d');
    icon = new Image(); icon.src = '/icon-512.png'; await icon.decode().catch(() => {});
    await document.fonts.load('700 100px Fredoka');
  }

  function fullDeep() {
    d.open = true; d.door = true; d.tales = true; d.crews = 2; d.jobs = [];
    d.dug = {}; MAP.forEach((row, r) => [...row].forEach((k, c) => { if (k !== '#') d.dug[`${c},${r}`] = 1; }));
    d.halls = {}; for (let n = 1; n <= 8; n++) d.halls[n] = 3;
    d.hallLvl = {}; for (let n = 1; n <= 8; n++) d.hallLvl[n] = 30;
    d.fossils = { ammonite: 1, trike: 1, ptero: 1, smilodon: 1 };
    d.lift = 6;
    d.biz = {}; for (const [id, cell] of Object.entries(BIZ_CELLS)) d.biz[id] = { cell, built: true, buildEnd: 0, lvl: 50, fx: [true, true, true, true] };
  }

  /* ---------------- the game's state at time T ---------------- */
  let phase = '';
  function applyState(T) {
    // floors: one at the start, then one per beat in the tower scene
    const built = T < SC.tower[0] ? 1 : 1 + TL.FLOORS.filter((t) => T >= t).length;
    s.rooms.forEach((r, i) => { r.built = i < built; });
    // wings pop up one by one
    for (const [id, t] of TL.WINGS) s.wings[id].built = T >= t;
    // the Deep Stacks: nearly untouched, then being dug, then the whole city
    const ph = T < SC.dig[0] ? 'early' : T < SC.lift[0] ? 'dig' : 'full';
    if (ph !== phase) {
      phase = ph;
      if (ph === 'full') fullDeep();
      else {
        d.open = true; d.door = false; d.tales = false; d.lift = 0; d.biz = {}; d.jobs = []; d.hallLvl = {};
        d.dug = { '4,0': 1 }; d.halls = {}; d.fossils = {};
        if (ph === 'dig') Object.assign(d.dug, { '4,1': 1, '3,1': 1, '2,1': 1 });
      }
    }
    if (ph === 'dig') {
      d.jobs = [];
      if (T < 12.75) d.jobs.push({ kind: 'dig', c: 2, r: 0, end: vnow(12.75), total: 5 });
      if (T < 13.5) d.jobs.push({ kind: 'restore', c: 2, r: 1, hall: 1, step: 0, end: vnow(13.5), total: 6 });
      if (T >= 12.75) d.dug['2,0'] = 1;
      d.halls[1] = T >= 13.5 ? 3 : 0;
    }
    if (ph === 'full') {
      // Mole City shops level up on camera
      const up = (id, t, lo) => { const b = d.biz[id]; const on = T >= t; b.lvl = on ? 50 : lo; b.fx = on ? [true, true, true, true] : [false, false, false, false]; };
      up('pies', 16.5, 1); up('cinema', 17.5, 4); up('spa', 18.5, 2);
      // the great door: eight locks light up, then it opens and Umber wakes
      if (T >= SC.door[0] && T < SC.dragon[0]) {
        d.door = false; d.tales = false; d.lift = 5;
        const lit = TL.LOCKS.filter((t) => T >= t).length; g.hallsDone = () => lit;
      } else {
        delete g.hallsDone; d.door = true; d.lift = 6;
        d.tales = !(T >= SC.dragon[0] && T < 21.45);
      }
    }
    // day, then a warm dusk with every window lit for the finale
    w.timeOverride = T < SC.world[0] ? 0.3 : lerp(0.3, 0.77, easeInOut((T - SC.world[0]) / 3.6));
  }

  /* ---------------- camera ---------------- */
  // keyframes: [t, x, y, zoom]; eased between keys (zoom interpolates geometrically)
  function keys(T, list, ease = easeInOut) {
    if (T <= list[0][0]) return { x: list[0][1], y: list[0][2], z: list[0][3] };
    for (let k = 1; k < list.length; k++) {
      const [t1, x1, y1, z1] = list[k]; const [t0, x0, y0, z0] = list[k - 1];
      if (T <= t1) { const u = ease((T - t0) / (t1 - t0)); return { x: lerp(x0, x1, u), y: lerp(y0, y1, u), z: z0 * Math.pow(z1 / z0, u) }; }
    }
    const l = list[list.length - 1]; return { x: l[1], y: l[2], z: l[3] };
  }
  // Catmull-Rom through evenly timed keys, for one long smooth move
  function spline(T, list) {
    const n = list.length; const t0 = list[0][0]; const t1 = list[n - 1][0];
    const f = clamp01((T - t0) / (t1 - t0)) * (n - 1); const i = Math.min(n - 2, Math.floor(f)); const u = f - i;
    const P = (k) => list[Math.max(0, Math.min(n - 1, k))];
    const cr = (a, b, c, e) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - e) * u * u + (-a + 3 * b - 3 * c + e) * u * u * u);
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    return { x: cr(p0[1], p1[1], p2[1], p3[1]), y: cr(p0[2], p1[2], p2[2], p3[2]), z: Math.exp(cr(Math.log(p0[3]), Math.log(p1[3]), Math.log(p2[3]), Math.log(p3[3]))) };
  }
  function camera(T) {
    if (T < SC.tower[0]) return { x: 220, y: -100, z: lerp(1.52, 1.68, easeInOut(T / 2)) };
    if (T < SC.wings[0]) return spline(T, [[2, 220, -140, 1.3], [3, 220, -430, 0.95], [4, 220, -900, 0.72], [5, 220, -1470, 0.55], [6, 220, -960, 0.3]]);
    if (T < SC.montage[0]) return keys(T, [[6, 220, -960, 0.3], [6.45, 220, -270, 0.335], [9, 220, -250, 0.35]]);
    if (T < SC.dig[0]) {
      const k = Math.floor((T - 9) / 0.5); const x = [550, -110, 772, -332][k] ?? -332; const u = (T - 9 - k * 0.5) / 0.5;
      return { x, y: -70, z: lerp(2.0, 2.18, u) };
    }
    if (T < SC.lift[0]) return keys(T, [[11, -110, 10, 1.25], [11.18, -110, 20, 1.25], [11.95, -135, 250, 1.18], [12.6, -70, 470, 1.3], [14, -60, 470, 1.42]]);
    if (T < SC.mole[0]) {
      if (T < 15) return { x: 295, y: 52, z: lerp(2.85, 3.0, (T - 14)) };
      const u = clamp01(T - 15); const e = Math.pow(u, 2.1);
      return { x: 295, y: lerp(54, 600, e), z: lerp(3.0, 1.5, easeOutCubic(u)) };
    }
    if (T < SC.door[0]) {
      const k = Math.floor(T - 16); const [x, y] = [[70, 462], [370, 726], [220, 594]][k] || [220, 594]; const u = T - 16 - k;
      return { x, y, z: lerp(2.25, 2.42, u) };
    }
    if (T < SC.dragon[0]) return { x: 220, y: 1078, z: lerp(1.62, 1.8, (T - 19) / 2) };
    if (T < SC.world[0]) return { x: lerp(170, 160, (T - 21) / 2), y: 1090, z: lerp(1.5, 1.62, (T - 21) / 2) };
    if (T < SC.end[0]) { const u = easeInOut((T - 23) / 4); return { x: lerp(160, 220, u), y: lerp(1090, -640, u), z: 1.62 * Math.pow(0.285 / 1.62, u) }; }
    const u = (T - 27) / 3; return { x: 220, y: lerp(-640, -690, u), z: lerp(0.285, 0.298, u) };
  }
  // camera shake after the big hits (in screen pixels)
  const SHAKES = [[2.0, 10], [6.0, 10], [11.0, 12], [16.0, 10], [21.0, 34], [21.45, 18], [21.6, 10], [22.0, 12], [23.0, 8], [24.0, 8], [25.0, 8], [27.0, 10]];
  function shake(T) {
    let x = 0; let y = 0;
    for (const [t, amp] of SHAKES) { const dt = T - t; if (dt < 0 || dt > 0.6) continue; const k = amp * Math.exp(-dt * 7); x += Math.sin(dt * 71 + t) * k; y += Math.cos(dt * 57 + t * 3) * k; }
    return { x, y };
  }
  function applyCam(c, sh) {
    w.zoom = c.z; w.scale = w.baseScale * c.z; w.cam.anim = null; w.cam.vx = 0; w.cam.vy = 0; w.cam.hold = true;
    const px = w.scale * 2;
    w.cam.x = c.x - w.viewW() / 2 + sh.x / px; w.cam.y = c.y - w.viewH() * FOCUS_Y + sh.y / px;
  }
  const scr = (wx, wy) => ({ x: (wx - w.cam.x) * w.scale * 2, y: (wy - w.cam.y) * w.scale * 2 });

  /* ---------------- the coin counter ---------------- */
  const MONEY = [[0, 0], [0.5, 1], [1.0, 3], [1.5, 8], [2, 20], [3, 480], [4, 1.2e4], [5, 3.1e5], [6, 1.2e6], [8.5, 4.8e7], [11, 9.5e8], [14, 6.4e10], [16.5, 1.2e12], [18.5, 2.6e13], [21, 9.1e13], [22, 5.5e15], [26, 3.3e20], [27, 4.4e23], [30, 4.6e23]];
  function money(T) {
    for (let k = 1; k < MONEY.length; k++) {
      const [t1, v1] = MONEY[k]; const [t0, v0] = MONEY[k - 1];
      if (T <= t1) { const u = (T - t0) / (t1 - t0); return Math.pow(10, lerp(Math.log10(v0 + 1), Math.log10(v1 + 1), u)) - 1; }
    }
    return MONEY[MONEY.length - 1][1];
  }
  const BUMPS = TL.CUES.filter((c) => ['coins', 'chaching', 'levelup', 'floor', 'stamp', 'tap'].includes(c.type)).map((c) => c.t);
  const bump = (T) => BUMPS.reduce((m, t) => (T >= t && T - t < 0.4 ? Math.max(m, Math.exp(-(T - t) * 9)) : m), 0);

  /* ---------------- world effects fired once, as time passes them ---------------- */
  function worldEvents(T) {
    const hit = (t) => lastT < t && T >= t;
    TL.TAPS.forEach((t, k) => { if (hit(t)) { const [x, y] = TAP_PTS[k]; w.fx.coins(x, y, 6); w.fx.text(x, y - 16, '+1', { icon: 'coin', size: 13 }); w.fx.ring(x, y); } });
    TL.FLOORS.forEach((t, k) => { if (hit(t)) { const y = floorTop(k + 1) + 95; w.fx.confetti(220, y, 50, 420); w.fx.sparkle(220, y, 18, '#fff3b0', 160); } });
    TL.WINGS.forEach(([id, t]) => { if (hit(t)) { const x = { cafe: 550, hall: -110, press: 772, museum: -332 }[id]; w.fx.confetti(x, -300, 70, 520); } });
    if (hit(9.3)) w.wingSims.museum.tourT = 0; // a school trip arrives for the museum shot
    [12.0, 12.35, 12.75].forEach((t) => { if (hit(t)) w.fx.sparkle(cellX(2) + 75, cellY(0) + 70, 12, '#d9b38c', 60); });
    if (hit(13.5)) { w.fx.confetti(cellX(2) + 75, cellY(1) + 50, 60, 360); w.fx.sparkle(cellX(2) + 75, cellY(1) + 60, 24, '#fff3b0', 90); }
    [[16.5, 70, 420], [17.5, 370, 684], [18.5, 220, 552]].forEach(([t, x, y]) => { if (hit(t)) { w.fx.confetti(x, y, 60, 340); w.fx.sparkle(x, y + 20, 20, '#fff3b0', 80); } });
    TL.LOCKS.forEach((t, k) => { if (hit(t)) { const p = lockPos(k); w.fx.sparkle(p.x, p.y, 10, '#ffe28a', 26); } });
    if (hit(21.0)) { w.fx.confetti(220, 1110, 90, 520); w.fx.sparkle(220, 1120, 30, '#ffe28a', 180); }
    if (hit(22.0)) w.fx.coins(210, 1130, 16);
  }
  const TAP_PTS = [[150, -58], [262, -64], [357, -60]];
  const lockPos = (k) => { const a = Math.PI * (1.08 + (k / 7) * 0.84); return { x: 220 + Math.cos(a) * 36, y: 1178 - 60 + Math.sin(a) * 36 }; };

  /* ---------------- the motion graphics ---------------- */
  const P = FX.PAL;
  function overlay(T) {
    ctx.clearRect(0, 0, 1080, 1920);
    FX.vignette(ctx, T >= SC.door[0] && T < SC.world[0] ? 0.5 : 0.3);
    const titled = !(T >= 16.95 && T < 17.05);
    FX.topShade(ctx, T < SC.end[0] ? 0.85 : 0);
    // --- hook: tap, tap, TAP ---
    FX.headline(ctx, T, 0.1, 1.9, [{ text: COPY.hook1 || 'One tiny', size: 104 }, { text: COPY.hook2 || 'mouse library…', size: 104 }], { y: 360 });
    if (T < 2.0) {
      TAP_PTS.forEach(([x, y], k) => { const t = TL.TAPS[k]; const p = scr(x, y); FX.ripple(ctx, T, t, p.x, p.y); FX.coinBurst(ctx, T, t, p.x, p.y - 20, 8, 100 + k, { speed: 1000, life: 0.8, r: 22 }); FX.coinFly(ctx, T, t + 0.15, p.x, p.y - 40, 360, 150, 5, 200 + k); });
      const hp = handPath(T); if (hp) FX.hand(ctx, hp.x, hp.y, 1.05, hp.press, hp.a);
    }
    // --- the tower ---
    FX.headline(ctx, T, 2.0, 5.4, [{ text: COPY.tower || 'BUILD IT UP!', size: 150, fill: P.gold }], { y: 400, slam: true });
    TL.FLOORS.forEach((t, k) => {
      if (T < t || T > t + 0.7) return; const p = scr(220, floorTop(k + 1) + 95);
      FX.sparkles(ctx, T, t, p.x, p.y, 14, 300 + k, { spread: 360, life: 0.6 });
      FX.sticker(ctx, T, t, t + 0.62, `+1 FLOOR`, p.x + 250, p.y - 70, { fill: ['#ff6f91', '#7cc6ff', '#7fdc9b', '#b99cff', '#ff9f43'][k % 5], size: 44, rot: k % 2 ? 0.08 : -0.08 });
    });
    [3.0, 4.0, 5.0].forEach((t, k) => FX.coinFly(ctx, T, t, 540, 1100, 360, 150, 8 + k * 3, 400 + k));
    // --- ...and out: the wings ---
    FX.headline(ctx, T, 6.0, 8.95, [{ text: COPY.wings || '…AND OUT!', size: 150, fill: P.sky }], { y: 400, slam: true });
    TL.WINGS.forEach(([id, t], k) => {
      const x = { cafe: 550, hall: -110, press: 772, museum: -332 }[id]; const p = scr(x, { cafe: -600, hall: -600, press: -760, museum: -760 }[id]); const base = scr(x, 0);
      FX.dust(ctx, T, t, base.x, base.y, 500 + k, { spread: 260 });
      FX.sticker(ctx, T, t, 8.95, { cafe: 'CAFÉ', hall: 'HALL', press: 'PRESS', museum: 'MUSEUM' }[id], Math.max(150, Math.min(930, p.x)), p.y, { fill: ['#ff9f43', '#b99cff', '#4f9dff', '#3fbf8f'][k], size: 44, rot: k % 2 ? 0.07 : -0.07 });
    });
    FX.coinFly(ctx, T, 8.5, 540, 1000, 360, 150, 14, 600);
    // --- the montage ---
    [[9.0, COPY.cafe || 'CAFÉS!', P.fire], [9.5, COPY.clubs || 'DANCE CLUBS!', P.pink], [10.0, COPY.press || 'PRINTING!', P.sky], [10.5, COPY.dinos || 'DINOSAURS!', P.mint]].forEach(([t, text, fill]) => {
      FX.headline(ctx, T, t, t + 0.5, [{ text, size: 140, fill }], { y: 400, slam: true, rot: t % 1 ? 0.03 : -0.03 }); FX.flash(ctx, T, t, 0.1, '255,255,255', 0.3);
    });
    // --- ...and down ---
    FX.headline(ctx, T, 11.0, 11.95, [{ text: COPY.down || '…AND DOWN!', size: 150, fill: P.fire }], { y: 400, slam: true });
    FX.speedLines(ctx, T, 11.15, 12.2, 7, { dir: -1, strength: 0.8 });
    { const p = scr(-210, 214); FX.sticker(ctx, T, 11.6, 12.5, 'DINO BONES!', p.x + 40, p.y - 150, { fill: '#ff9f43', size: 50, rot: -0.1 }); }
    FX.headline(ctx, T, 12.0, 13.45, [{ text: COPY.dig || 'DIG DEEPER!', size: 140, fill: P.gold }], { y: 400 });
    [12.0, 12.35, 12.75].forEach((t, k) => { const p = scr(cellX(2) + 75, cellY(0) + 100); FX.dust(ctx, T, t, p.x, p.y, 700 + k, { col: '160,120,90', spread: 180 }); });
    { const p = scr(cellX(2) + 75, cellY(1) + 40); FX.flash(ctx, T, 13.5, 0.2, '255,240,200', 0.35); FX.sparkles(ctx, T, 13.5, p.x, p.y + 60, 22, 800, { spread: 380 }); FX.sticker(ctx, T, 13.55, 13.98, 'SECRET LIBRARY!', p.x, p.y - 40, { fill: '#b99cff', size: 50 }); }
    // --- the lift ---
    FX.headline(ctx, T, 14.0, 15.0, [{ text: COPY.lift1 || 'HOP IN', size: 120, fill: P.cream }, { text: COPY.lift2 || 'THE LIFT…', size: 120, fill: P.gold }], { y: 360 });
    FX.speedLines(ctx, T, 15.15, 16.0, 11, { dir: -1, n: 34, strength: 1 });
    // --- Mole City ---
    FX.flash(ctx, T, 16.0, 0.22, '255,250,230', 0.6);
    FX.headline(ctx, T, 16.0, 16.95, [{ text: COPY.mole1 || 'WELCOME TO', size: 92, fill: P.cream }, { text: COPY.mole2 || 'MOLE CITY!', size: 150, fill: P.gold }], { y: 350, slam: true });
    FX.headline(ctx, T, 17.0, 18.95, [{ text: COPY.shops1 || 'UPGRADE', size: 120, fill: P.mint }, { text: COPY.shops2 || 'EVERY SHOP!', size: 120, fill: P.gold }], { y: 360 });
    [[16.5, 70, 462], [17.5, 370, 726], [18.5, 220, 594]].forEach(([t, x, y], k) => {
      const p = scr(x, y - 40); FX.flash(ctx, T, t, 0.14, '255,245,200', 0.3); FX.sparkles(ctx, T, t, p.x, p.y, 20, 900 + k, { spread: 420 });
      FX.sticker(ctx, T, t, t + 0.48, k === 2 ? 'MAX LEVEL!' : 'LEVEL UP!', p.x, p.y - 120, { fill: ['#ff6f91', '#ff9f43', '#3fbf8f'][k], size: 56, rot: k % 2 ? 0.08 : -0.08 });
      FX.coinBurst(ctx, T, t + 0.05, p.x, p.y, 14, 950 + k, { speed: 1300 });
    });
    [17.0, 18.0].forEach((t) => FX.flash(ctx, T, t, 0.1, '255,255,255', 0.3));
    // --- the door ---
    FX.headline(ctx, T, 19.0, 19.98, [{ text: COPY.door1 || '8 SECRET', size: 116, fill: P.lilac }, { text: COPY.door2 || 'HALLS…', size: 116, fill: P.lilac }], { y: 360 });
    FX.headline(ctx, T, 20.0, 20.98, [{ text: COPY.door3 || '…1 SLEEPING', size: 116, fill: P.fire }, { text: COPY.door4 || 'DRAGON', size: 150, fill: P.fire }], { y: 360 });
    TL.LOCKS.forEach((t, k) => { const p = lockPos(k); const q = scr(p.x, p.y); FX.ripple(ctx, T, t, q.x, q.y, { col: '255,220,120', r0: 10, r1: 90, life: 0.35 }); });
    // --- the dragon ---
    FX.flash(ctx, T, 21.0, 0.4, '255,244,214', 0.9);
    FX.headline(ctx, T, 21.6, 21.98, [{ text: COPY.wake1 || 'WAKE THE', size: 118, fill: P.fire }, { text: COPY.wake2 || 'DRAGON!', size: 160, fill: P.fire }], { y: 350, slam: true });
    FX.headline(ctx, T, 22.0, 22.97, [{ text: COPY.x2a || '×2 COINS', size: 150, fill: P.gold }, { text: COPY.x2b || 'FOREVER!', size: 128, fill: P.gold }], { y: 350, slam: true });
    FX.coinRain(ctx, T, 22.0, 22.9, 40, 1200);
    // --- the whole world ---
    [[23.0, COPY.w1 || 'BUILD.', P.gold], [24.0, COPY.w2 || 'DIG.', P.fire], [25.0, COPY.w3 || 'DISCOVER.', P.mint]].forEach(([t, text, fill]) => FX.headline(ctx, T, t, t + 0.97, [{ text, size: 170, fill }], { y: 400, slam: true }));
    FX.headline(ctx, T, 26.0, 26.97, [{ text: COPY.w4a || 'GROW YOUR', size: 116, fill: P.cream }, { text: COPY.w4b || 'MOUSE CITY!', size: 136, fill: P.gold }], { y: 360 });
    FX.sparkles(ctx, T, 26.0, 540, 150, 20, 1300, { spread: 300 });
    // --- the coin counter, then the end card ---
    const ca = T < 0.2 ? T / 0.2 : T > SC.end[0] ? 1 - clamp01((T - SC.end[0]) / 0.25) : 1;
    FX.counter(ctx, T, money(T), bump(T), clamp01(ca));
    FX.endCard(ctx, T, SC.end[0], icon, COPY.end || {});
    void titled;
  }
  // the finger glides in, taps three times, and leaves
  function handPath(T) {
    if (T < 0.25 || T > 1.95) return null;
    const pts = TAP_PTS.map(([x, y]) => scr(x, y)); const taps = TL.TAPS;
    let x; let y;
    if (T < taps[0]) { const u = easeOutCubic((T - 0.25) / (taps[0] - 0.25)); x = lerp(1000, pts[0].x, u); y = lerp(1500, pts[0].y, u); }
    else if (T >= taps[2]) { const u = clamp01((T - taps[2] - 0.12) / 0.35); x = lerp(pts[2].x, 1150, u * u); y = lerp(pts[2].y, 1600, u * u); }
    else { const k = T < taps[1] ? 0 : 1; const u = easeInOut(clamp01((T - taps[k] - 0.12) / 0.3)); x = lerp(pts[k].x, pts[k + 1].x, u); y = lerp(pts[k].y, pts[k + 1].y, u) - Math.sin(u * Math.PI) * 70; }
    const press = taps.reduce((m, t) => Math.max(m, Math.max(0, 1 - Math.abs(T - t) / 0.08)), 0);
    return { x, y, press, a: T > 1.8 ? 1 - (T - 1.8) / 0.15 : 1 };
  }

  /* ---------------- one frame ---------------- */
  function frame(i) {
    const T = i / FPS; const dt = 1 / FPS;
    applyState(T);
    window.__VCLOCK.t = T0 + T * 1000;
    w.update(dt);
    w.t = T + WORLD_T0;
    if (T >= 13.9 && T < 16.1) w.chatter.bubbles = []; // no half-hidden speech bubbles in the lift shot
    worldEvents(T);
    // a soft blur on the world behind the end card
    w.canvas.style.filter = T >= SC.end[0] ? `blur(${Math.min(9, (T - SC.end[0]) * 30)}px) saturate(1.1)` : '';
    applyCam(camera(T), shake(T));
    w.render();
    overlay(T);
    lastT = T;
    return T;
  }
  // Paint the caches for a frame without moving time (after a jump, e.g. when previewing stills).
  function warm(i, n = 6) { const T = i / FPS; applyState(T); applyCam(camera(T), { x: 0, y: 0 }); for (let k = 0; k < n; k++) w.render(); }

  return { setup, frame, warm, frames: () => Math.round(TL.DURATION * FPS) };
})();
