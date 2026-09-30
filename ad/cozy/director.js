// Directs the cozy ad: slow camera moves, dissolves between shots, seasons and festivals, the
// narration's subtitles, two characters' speech bubbles, and a storybook opening and ending.
// Runs in the game's page after overlay.js (shared helpers) and cozy/timeline.js, cozy/audio.js.
window.AdDirector = (() => {
  const TL = window.AD_TIMELINE; const FX = window.AdFx;
  const { FPS, SHOTS, DISSOLVE } = TL;
  const { clamp01, lerp, easeInOut, easeOutBack, easeOutCubic, rng } = FX;
  const COPY = window.AD_COPY || {};
  const NAR = Object.fromEntries(((window.AD_NARRATION || {}).lines || []).map((l) => [l.id, l]));
  const FOCUS_Y = 0.54;
  const HAND = '"Kalam", "Fredoka", cursive'; const ROUND = '"Fredoka", system-ui, sans-serif';
  const W = 1080; const H = 1920;

  let g; let w; let s; let d; let cv; let ctx; let icon; let grain; let fadeCv; let fadeCtx;
  const PORTRAIT = {};
  let T0 = 0; let lastShot = -1; let fadeStart = -10; let lastT = -1;
  const vnow = (t) => window.__VCLOCK.base + T0 + t * 1000;
  const ALL5 = () => [true, true, true, true, true];
  const MAP = ['T..#E.F#T', '.#1..#...', '.###.#2#.', 'F.3#...#F', '##.###4..', '5F..6###7', '8##DDD.T.'];
  const BIZ_CELLS = { mushroom: '1,0', pies: '3,1', jeweller: '6,1', tea: '7,1', spa: '4,2', cinema: '5,3', cheese: '6,3', post: '2,5' };

  // what each shot shows: season (0 spring ... 3 winter), festival, time of day (see scenery.js), weather
  const LOOK = {
    open: { season: 0, fest: null, tod: [0.015, 0.05], floors: 2, grown: false },
    nook: { season: 0, fest: null, tod: [0.2, 0.2], floors: 2, grown: false },
    grow: { season: 0, fest: null, tod: [0.22, 0.24], floors: 'grow', grown: false },
    spring: { season: 0, fest: 'egghunt', tod: [0.25, 0.26] },
    summer: { season: 1, fest: 'summer', tod: [0.36, 0.37] },
    autumn: { season: 2, fest: 'halloween', tod: [0.52, 0.535] },
    winter: { season: 3, fest: 'christmas', tod: [0.6, 0.615], snow: true },
    lunar: { season: 0, fest: 'lunar', tod: [0.8, 0.8] },
    diwali: { season: 2, fest: 'diwali', tod: [0.8, 0.8] },
    mole: { season: 2, fest: null, tod: [0.4, 0.4] },
    dragon: { season: 2, fest: null, tod: [0.4, 0.4] },
    end: { season: 3, fest: 'christmas', tod: [0.8, 0.8], snow: true },
  };
  const CHIP = {
    spring: ['🥚', COPY.chipSpring || 'Spring Egg Hunt', '#ff9fc2'], summer: ['🌻', COPY.chipSummer || 'Summer Reading Festival', '#ffc94d'],
    autumn: ['🎃', COPY.chipAutumn || 'Spooky Stories Week', '#ff8a3d'], winter: ['🎄', COPY.chipWinter || 'Merry Christmas', '#8fd3ff'],
    lunar: ['🏮', COPY.chipLunar || 'Lunar New Year', '#ff6b6b'], diwali: ['🪔', COPY.chipDiwali || 'Diwali', '#ffb84d'],
  };

  /* ---------------- setup ---------------- */
  async function setup() {
    g = WWL.game; w = WWL.world; s = g.s; d = s.deep;
    s.settings.music = false; s.settings.sfx = false; g.noSave = true;
    w.events.next = Infinity; w.nextSpecial = Infinity; w.nextPigeon = Infinity;
    g.constructing = () => 99;
    WWL.ui.quality?.setMode?.('beautiful');
    s.branch = 0; s.coins = 1e30;
    s.rooms.forEach((r) => Object.assign(r, { built: true, buildEnd: 0, lvl: 150, seats: 6, shelves: 4, staff: 15, decor: ALL5() }));
    for (const id of ['cafe', 'hall', 'press', 'museum']) Object.assign(s.wings[id], { built: true, buildEnd: 0, lvl: 60, next: vnow(1e6), runEnd: 0, decor: ALL5(), up: [ALL5(), ALL5()] });
    fullDeep();
    w.prefillAll();
    for (let k = 0; k < 300; k++) { window.__VCLOCK.t += 1000 / FPS; w.update(1 / FPS); }
    w.fx.list = [];
    T0 = window.__VCLOCK.t;
    // the characters' portraits, drawn by the game's own story screen
    const st = WWL.ui.story;
    for (const who of ['pip', 'umber']) { st.active = { id: '__ad', lines: [[who, ' ']], k: 0 }; st.show(); PORTRAIT[who] = await loadImg(st.el.querySelector('.story-portrait').src); }
    clearInterval(st.typer); st.active = null; st.el.classList.remove('show');
    // our layer on top, a paper-grain pattern, and a canvas for dissolves
    cv = document.createElement('canvas'); cv.id = 'adfx'; cv.width = W; cv.height = H;
    Object.assign(cv.style, { position: 'fixed', left: '0', top: '0', width: `${innerWidth}px`, height: `${innerHeight}px`, zIndex: 99999, pointerEvents: 'none' });
    document.body.appendChild(cv); ctx = cv.getContext('2d');
    fadeCv = document.createElement('canvas'); fadeCv.width = W; fadeCv.height = H; fadeCtx = fadeCv.getContext('2d');
    const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d'); const R = rng(5);
    for (let i = 0; i < 9000; i++) { const v = 150 + R() * 105; gx.fillStyle = `rgba(${v},${v * 0.92},${v * 0.8},${0.35 + R() * 0.4})`; gx.fillRect(R() * 256, R() * 256, 1 + R() * 1.5, 1 + R() * 1.5); }
    grain = ctx.createPattern(gc, 'repeat');
    icon = await loadImg('/icon-512.png');
    await Promise.all([document.fonts.load('700 100px Fredoka'), document.fonts.load('400 60px Kalam')]);
  }
  function loadImg(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }

  function fullDeep() {
    d.open = true; d.door = true; d.tales = true; d.crews = 2; d.jobs = [];
    d.dug = {}; MAP.forEach((row, r) => [...row].forEach((k, c) => { if (k !== '#') d.dug[`${c},${r}`] = 1; }));
    d.halls = {}; for (let n = 1; n <= 8; n++) d.halls[n] = 3;
    d.hallLvl = {}; for (let n = 1; n <= 8; n++) d.hallLvl[n] = 30;
    d.fossils = { ammonite: 1, trike: 1, ptero: 1, smilodon: 1 }; d.lift = 6;
    d.biz = {}; for (const [id, cell] of Object.entries(BIZ_CELLS)) d.biz[id] = { cell, built: true, buildEnd: 0, lvl: 50, fx: [true, true, true, true] };
  }

  /* ---------------- shots ---------------- */
  const shotIndex = (T) => { let k = 0; while (k < SHOTS.length - 1 && T >= SHOTS[k + 1][1]) k++; return k; };
  const shotSpan = (k) => [SHOTS[k][1], k + 1 < SHOTS.length ? SHOTS[k + 1][1] : TL.DURATION];

  let festNow = 'unset'; let grown = null;
  function applyState(T, id, u) {
    const L = LOOK[id];
    const g1 = L.grown !== false;
    if (g1 !== grown) {
      grown = g1;
      for (const wid of ['cafe', 'hall', 'press', 'museum']) s.wings[wid].built = g1;
      if (g1) fullDeep(); else { d.open = false; d.lift = 0; d.biz = {}; }
    }
    const floors = L.floors === 'grow' ? 2 + TL.FLOORS.filter((t) => T >= t).length : L.floors || 10;
    s.rooms.forEach((r, i) => { r.built = i < floors; });
    if (festNow !== L.fest) { festNow = L.fest; if (L.fest) w.debugFestival(L.fest); else { g.festOverride = null; w.cache.clear(); } }
    w.seasonOverride = L.season;
    w.ambient.weather = L.snow ? { kind: 'snow', left: 1e9, intensity: 1, rainbow: 0 } : { kind: 'clear', left: 1e9, intensity: 0, rainbow: 0 };
    w.timeOverride = lerp(L.tod[0], L.tod[1], u);
    if (id === 'dragon') d.tales = T >= TL.WAKE; else d.tales = true;
  }

  // camera per shot: u runs 0..1 across the shot (slow, eased moves)
  function camera(id, u) {
    const e = easeInOut(u);
    switch (id) {
      case 'open': return { x: 220, y: lerp(-270, -235, e), z: lerp(0.8, 0.96, e) };
      case 'nook': return { x: lerp(175, 262, e), y: -98, z: lerp(2.2, 2.32, e) };
      case 'grow': return { x: 220, y: lerp(-330, -1080, e), z: lerp(0.95, 0.52, e) };
      case 'spring': return { x: lerp(280, 300, e), y: -430, z: lerp(0.6, 0.65, e) };
      case 'summer': return { x: lerp(360, 390, e), y: -230, z: lerp(0.92, 0.98, e) };
      case 'autumn': return { x: lerp(40, 70, e), y: -420, z: lerp(0.62, 0.67, e) };
      case 'winter': return { x: 220, y: lerp(-790, -810, e), z: lerp(0.355, 0.37, e) };
      case 'lunar': return { x: lerp(300, 320, e), y: -390, z: lerp(0.7, 0.74, e) };
      case 'diwali': return { x: lerp(232, 250, e), y: 30, z: lerp(1.42, 1.52, e) };
      case 'mole': return { x: lerp(250, 500, e), y: 722, z: 1.45 };
      case 'dragon': return { x: lerp(170, 160, e), y: 1086, z: lerp(1.45, 1.7, e) };
      default: return { x: 220, y: lerp(-800, -830, e), z: lerp(0.33, 0.345, e) };
    }
  }
  function applyCam(c) {
    w.zoom = c.z; w.scale = w.baseScale * c.z; w.cam.anim = null; w.cam.vx = 0; w.cam.vy = 0; w.cam.hold = true;
    w.cam.x = c.x - w.viewW() / 2; w.cam.y = c.y - w.viewH() * FOCUS_Y;
  }
  const scr = (wx, wy) => ({ x: (wx - w.cam.x) * w.scale * 2, y: (wy - w.cam.y) * w.scale * 2 });

  /* ---------------- overlay pieces ---------------- */
  function rrect(x, y, ww, hh, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + ww, y, x + ww, y + hh, r); ctx.arcTo(x + ww, y + hh, x, y + hh, r); ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + ww, y, r); ctx.closePath(); }
  // gentle falling or floating particles for each season / place
  function particles(T, kind, a = 1) {
    if (a <= 0) return;
    const R = rng({ petals: 11, leaves: 12, snow: 13, motes: 14, sun: 15, fireflies: 16, lanterns: 17 }[kind]);
    const n = { petals: 26, leaves: 18, snow: 40, motes: 30, sun: 16, fireflies: 26, lanterns: 9 }[kind];
    ctx.save(); ctx.globalAlpha = a;
    for (let i = 0; i < n; i++) {
      const x0 = R() * W; const sp = R(); const ph = R() * 100; const sz = R();
      if (kind === 'petals' || kind === 'leaves' || kind === 'snow') {
        const vy = kind === 'snow' ? 70 + sp * 110 : 90 + sp * 90; const y = ((ph * 40 + T * vy) % (H + 120)) - 60;
        const x = x0 + Math.sin(T * (0.8 + sp) + ph) * (kind === 'snow' ? 30 : 60);
        ctx.save(); ctx.translate(x, y); ctx.rotate(T * (0.8 + sp * 1.5) + ph);
        if (kind === 'petals') { ctx.fillStyle = ['#ffd1e1', '#ffb7cf', '#fff0f5'][i % 3]; ctx.beginPath(); ctx.ellipse(0, 0, 9 + sz * 7, 5 + sz * 3, 0, 0, 7); ctx.fill(); }
        else if (kind === 'leaves') { ctx.scale(1, Math.cos(T * 2 + ph)); ctx.fillStyle = ['#e0702d', '#c9502b', '#f2a33a', '#b5523b'][i % 4]; ctx.beginPath(); ctx.moveTo(0, -16 - sz * 8); ctx.quadraticCurveTo(12 + sz * 6, 0, 0, 16 + sz * 8); ctx.quadraticCurveTo(-12 - sz * 6, 0, 0, -16 - sz * 8); ctx.fill(); }
        else { const r = 3 + sz * sz * 11; ctx.fillStyle = `rgba(255,255,255,${0.55 + sz * 0.35})`; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); }
        ctx.restore();
      } else if (kind === 'motes' || kind === 'sun' || kind === 'fireflies') {
        const y = H - (((ph * 50 + T * (15 + sp * 25)) % (H + 80)) - 40); const x = x0 + Math.sin(T * 0.6 + ph) * 40;
        const tw = kind === 'fireflies' ? Math.max(0, Math.sin(T * (2 + sp * 2) + ph)) : 0.6 + 0.4 * Math.sin(T * 2 + ph);
        const r = kind === 'sun' ? 18 + sz * 30 : kind === 'fireflies' ? 5 + sz * 4 : 2 + sz * 3.5;
        const col = kind === 'sun' ? '255,236,170' : kind === 'fireflies' ? '255,226,120' : '255,232,190';
        const gr = ctx.createRadialGradient(x, y, 0, x, y, r * (kind === 'motes' ? 2.5 : 2));
        gr.addColorStop(0, `rgba(${col},${(kind === 'sun' ? 0.28 : 0.85) * tw})`); gr.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, 7); ctx.fill();
      } else if (kind === 'lanterns') {
        const y = H + 120 - ((ph * 30 + T * (55 + sp * 40)) % (H + 300)); const x = x0 + Math.sin(T * 0.7 + ph) * 25; const sc = 0.6 + sz * 0.8;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, 70 * sc); gr.addColorStop(0, 'rgba(255,170,80,0.55)'); gr.addColorStop(1, 'rgba(255,120,60,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 70 * sc, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffb454'; rrect(x - 16 * sc, y - 22 * sc, 32 * sc, 40 * sc, 12 * sc); ctx.fill();
        ctx.fillStyle = '#ffe29a'; rrect(x - 9 * sc, y - 14 * sc, 18 * sc, 26 * sc, 7 * sc); ctx.fill();
      }
    }
    ctx.restore();
  }
  function firework(T, t0, x, y, seed, col) {
    const dt = T - t0; if (dt < 0 || dt > 1.6) return;
    const R = rng(seed); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2 + R() * 0.1; const sp = 330 + R() * 160; const k = 1 - Math.exp(-dt * 2.6);
      const px = x + Math.cos(a) * sp * k; const py = y + Math.sin(a) * sp * k + 120 * dt * dt;
      const al = Math.max(0, 1 - dt / 1.5) * (0.6 + 0.4 * Math.sin(dt * 30 + i));
      ctx.fillStyle = `rgba(${col},${al})`; ctx.beginPath(); ctx.arc(px, py, 5.5 * (1 - dt * 0.4), 0, 7); ctx.fill();
    }
    const gr = ctx.createRadialGradient(x, y, 0, x, y, 300); gr.addColorStop(0, `rgba(${col},${0.35 * Math.max(0, 1 - dt * 2)})`); gr.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - 300, y - 300, 600, 600); ctx.restore();
  }
  // a handwritten subtitle for the narration
  function subtitle(T, text, t0, dur, tint = null, yBase = 1430) {
    const t1 = t0 + dur + 0.45; if (T < t0 - 0.15 || T > t1) return;
    const a = Math.min(clamp01((T - t0 + 0.15) / 0.3), clamp01((t1 - T) / 0.3));
    ctx.save(); ctx.globalAlpha = a; ctx.font = `400 66px ${HAND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const words = text.split(' '); const lines = []; let cur = '';
    for (const wd of words) { const tryL = cur ? `${cur} ${wd}` : wd; if (ctx.measureText(tryL).width > 900 && cur) { lines.push(cur); cur = wd; } else cur = tryL; }
    lines.push(cur);
    const y0 = yBase - (lines.length - 1) * 42 + (1 - a) * 12;
    lines.forEach((ln, k) => {
      const y = y0 + k * 84;
      ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(42,22,10,0.7)'; ctx.strokeText(ln, W / 2, y + 4);
      ctx.lineWidth = 10; ctx.strokeStyle = '#3b2412'; ctx.strokeText(ln, W / 2, y);
      ctx.fillStyle = tint || '#fff6e4'; ctx.fillText(ln, W / 2, y);
    });
    ctx.restore();
  }
  // a character's speech bubble with their portrait
  function bubble(T, t0, t1, who, name, text, x, y, tailX, tailY) {
    if (T < t0 || T > t1) return;
    const u = clamp01((T - t0) / 0.35); const v = clamp01((T - (t1 - 0.25)) / 0.25); const sc = easeOutBack(u, 2) * (1 - 0.2 * v);
    if (sc <= 0.01) return;
    ctx.save(); ctx.globalAlpha = 1 - v; ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.font = `600 44px ${ROUND}`; const tw = Math.max(ctx.measureText(text).width, 260); const bw = tw + 190; const bh = 150;
    ctx.fillStyle = 'rgba(40,20,8,0.3)'; rrect(-bw / 2, -bh / 2 + 10, bw, bh, 40); ctx.fill();
    ctx.fillStyle = '#fffaf0'; rrect(-bw / 2, -bh / 2, bw, bh, 40); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#6b3d1e'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-20, bh / 2 - 3); ctx.lineTo(tailX - x, tailY - y); ctx.lineTo(24, bh / 2 - 3); ctx.closePath(); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(-26, bh / 2 - 9, 56, 10);
    const img = PORTRAIT[who];
    if (img) { ctx.save(); ctx.beginPath(); ctx.arc(-bw / 2 + 82, 0, 58, 0, 7); ctx.clip(); ctx.drawImage(img, -bw / 2 + 24, -58, 116, 116); ctx.restore(); ctx.lineWidth = 5; ctx.strokeStyle = '#e9b949'; ctx.beginPath(); ctx.arc(-bw / 2 + 82, 0, 58, 0, 7); ctx.stroke(); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#b5523b'; ctx.font = `700 30px ${ROUND}`; ctx.fillText(name, -bw / 2 + 158, -30);
    ctx.fillStyle = '#3b2412'; ctx.font = `600 44px ${ROUND}`; ctx.fillText(text, -bw / 2 + 158, 18);
    ctx.restore();
  }
  function chip(T, id, t0, t1) {
    const c = CHIP[id]; if (!c || T < t0 + 0.25 || T > t1) return;
    const a = Math.min(clamp01((T - t0 - 0.25) / 0.35), clamp01((t1 - T) / 0.25));
    ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, 250 - (1 - a) * 16);
    ctx.font = `400 50px ${HAND}`; const tw = ctx.measureText(c[1]).width + 80;
    ctx.fillStyle = 'rgba(40,20,8,0.35)'; rrect(-tw / 2, -40 + 6, tw, 80, 40); ctx.fill();
    ctx.fillStyle = 'rgba(255,248,232,0.93)'; rrect(-tw / 2, -40, tw, 80, 40); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = c[2]; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '44px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; ctx.fillText(c[0], -tw / 2 + 44, 2);
    ctx.fillStyle = '#4a2a14'; ctx.font = `400 50px ${HAND}`; ctx.fillText(c[1], 22, 4);
    ctx.restore();
  }
  // the opening: a storybook page turns to reveal the library
  function pageTurn(T) {
    if (T > 1.2) return;
    const u = easeInOut(clamp01((T - 0.3) / 0.9)); const cw = Math.cos(u * Math.PI / 2);
    ctx.save();
    if (cw > 0.005) {
      const pw = W * cw;
      ctx.fillStyle = `rgba(20,10,4,${0.35 * (1 - u)})`; ctx.fillRect(pw, 0, W - pw, H);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, pw, H); ctx.clip(); ctx.transform(cw, 0, 0, 1, 0, 0);
      const pg = ctx.createLinearGradient(0, 0, W, 0); pg.addColorStop(0, '#f3e4c6'); pg.addColorStop(0.5, '#fbf1dc'); pg.addColorStop(1, '#efdcb8');
      ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H); ctx.fillStyle = grain; ctx.globalAlpha = 0.25; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#c9a15a'; ctx.lineWidth = 6; rrect(60, 60, W - 120, H - 120, 30); ctx.stroke(); ctx.lineWidth = 2; rrect(84, 84, W - 168, H - 168, 22); ctx.stroke();
      if (icon) { ctx.save(); rrect(W / 2 - 130, 640, 260, 260, 60); ctx.clip(); ctx.drawImage(icon, W / 2 - 130, 640, 260, 260); ctx.restore(); }
      ctx.fillStyle = '#5a3a1a'; ctx.font = `400 92px ${HAND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(COPY.pageTitle || 'Once upon a time…', W / 2, 1060);
      const sh = ctx.createLinearGradient(W * 0.75, 0, W, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, `rgba(60,30,10,${0.35 * u + 0.08})`); ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    ctx.restore();
  }
  // the ending: a storybook cover
  function endCard(T, t0) {
    const dt = T - t0; if (dt < 0) return;
    const a = clamp01(dt / 0.6);
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, `rgba(18,14,40,${0.55 * a})`); bg.addColorStop(1, `rgba(30,16,10,${0.7 * a})`); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    particles(T, 'snow', a * 0.8);
    const u = easeOutCubic(clamp01(dt / 0.7)); const cx = W / 2; const cy = 930;
    ctx.save(); ctx.globalAlpha = u; ctx.translate(cx, cy + (1 - u) * 60); ctx.scale(0.92 + 0.08 * u, 0.92 + 0.08 * u);
    const bw = 840; const bh = 1150;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; rrect(-bw / 2 + 10, -bh / 2 + 24, bw, bh, 36); ctx.fill();
    const lg = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2); lg.addColorStop(0, '#3a6b52'); lg.addColorStop(1, '#244a39');
    ctx.fillStyle = lg; rrect(-bw / 2, -bh / 2, bw, bh, 36); ctx.fill();
    ctx.fillStyle = grain; ctx.globalAlpha = u * 0.12; ctx.fillRect(-bw / 2, -bh / 2, bw, bh); ctx.globalAlpha = u;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-bw / 2, -bh / 2, 46, bh); // the spine
    ctx.strokeStyle = '#e2bd62'; ctx.lineWidth = 6; rrect(-bw / 2 + 60, -bh / 2 + 36, bw - 96, bh - 72, 26); ctx.stroke();
    ctx.lineWidth = 2.5; rrect(-bw / 2 + 80, -bh / 2 + 56, bw - 136, bh - 112, 18); ctx.stroke();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { ctx.save(); ctx.translate(sx * (bw / 2 - 90) + 23, sy * (bh / 2 - 66)); ctx.fillStyle = '#e2bd62'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(12, 0); ctx.lineTo(0, 18); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill(); ctx.restore(); });
    ctx.restore();
    const el = (t, fn) => { const k = clamp01((dt - t) / 0.45); if (k <= 0) return; ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - easeOutCubic(k)) * 26); fn(k); ctx.restore(); };
    el(0.3, () => { if (!icon) return; const r = 150; ctx.save(); ctx.translate(cx + 23, 600); ctx.fillStyle = '#e2bd62'; ctx.beginPath(); ctx.arc(0, 0, r + 14, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip(); ctx.drawImage(icon, -r, -r, r * 2, r * 2); ctx.restore(); FX.sparkles(ctx, T, t0 + 0.4, cx + 23, 600, 16, 77, { spread: 260, life: 1.4, size: 28 }); });
    el(0.55, () => { FX.styled(ctx, COPY.title1 || 'Whiskerwood', cx + 23, 850, 118, { fill: FX.PAL.gold, stroke: '#3a2208' }); FX.styled(ctx, COPY.title2 || 'Library', cx + 23, 970, 110, { fill: FX.PAL.gold, stroke: '#3a2208' }); });
    el(0.8, () => { ctx.strokeStyle = '#e2bd62'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 170, 1050); ctx.lineTo(cx + 216, 1050); ctx.stroke(); ctx.fillStyle = '#e2bd62'; ctx.beginPath(); ctx.moveTo(cx + 23, 1036); ctx.lineTo(cx + 37, 1050); ctx.lineTo(cx + 23, 1064); ctx.lineTo(cx + 9, 1050); ctx.closePath(); ctx.fill(); });
    el(1.0, () => { ctx.fillStyle = '#fff3d6'; ctx.font = `400 70px ${HAND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(COPY.tagline || 'Your story is waiting.', cx + 23, 1140); });
    el(1.5, (k) => {
      const p = 1 + 0.025 * Math.sin((dt - 1.5) * 3.2); ctx.save(); ctx.translate(cx + 23, 1300); ctx.scale(p * (0.8 + 0.2 * easeOutBack(k)), p * (0.8 + 0.2 * easeOutBack(k)));
      const pw = 480; const ph = 120; const bg2 = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2); bg2.addColorStop(0, '#ffe7a0'); bg2.addColorStop(1, '#e9a623');
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; rrect(-pw / 2, -ph / 2 + 10, pw, ph, ph / 2); ctx.fill(); ctx.fillStyle = bg2; rrect(-pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#fff6d8'; ctx.stroke();
      ctx.fillStyle = '#5a3208'; ctx.font = `700 60px ${ROUND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(COPY.cta || 'Play free', 0, 4); ctx.restore();
    });
    el(1.8, () => { ctx.fillStyle = 'rgba(255,243,214,0.9)'; ctx.font = `600 40px ${ROUND}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(COPY.sub || 'on Google Play', cx + 23, 1420); });
  }

  /* ---------------- one frame ---------------- */
  function frame(i) {
    const T = i / FPS; const k = shotIndex(T); const id = SHOTS[k][0]; const [s0, s1] = shotSpan(k); const u = clamp01((T - s0) / (s1 - s0));
    // a new shot: keep the last frame of the old one, to dissolve from
    const newShot = k !== lastShot;
    if (newShot) { if (lastShot >= 0) { fadeCtx.clearRect(0, 0, W, H); fadeCtx.drawImage(w.canvas, 0, 0, W, H); fadeStart = T; } lastShot = k; }
    applyState(T, id, u);
    window.__VCLOCK.t = T0 + T * 1000;
    w.update(1 / FPS);
    if (newShot) w.fx.list = []; // no "a festival has begun!" confetti at every cut
    if (id !== 'nook' && id !== 'dragon') w.chatter.bubbles = [];
    TL.FLOORS.forEach((t, n) => { if (lastT < t && T >= t) { const y = -(n + 3) * 190 + 95; w.fx.sparkle(220, y, 22, '#fff3b0', 170); } });
    w.canvas.style.filter = id === 'end' ? `blur(${Math.min(10, (T - s0) * 18)}px)` : '';
    applyCam(camera(id, u));
    w.render();
    // --- the layer on top ---
    ctx.clearRect(0, 0, W, H);
    const fu = (T - fadeStart) / DISSOLVE; if (fu >= 0 && fu < 1) { ctx.globalAlpha = 1 - easeInOut(fu); ctx.drawImage(fadeCv, 0, 0); ctx.globalAlpha = 1; }
    if (id === 'open' || id === 'spring') particles(T, 'petals', 0.9);
    if (id === 'summer') particles(T, 'sun', 1);
    if (id === 'autumn') particles(T, 'leaves', 0.95);
    if (id === 'winter') particles(T, 'snow', 0.8);
    if (id === 'nook' || id === 'grow' || id === 'mole' || id === 'dragon') particles(T, 'motes', 0.9);
    if (id === 'lunar') { particles(T, 'lanterns', 0.95); [[18.05, 300, 420, '255,120,110'], [18.65, 820, 360, '255,210,120'], [19.2, 560, 300, '255,160,220']].forEach(([t, x, y, c], n) => firework(T, t, x, y, 50 + n, c)); }
    if (id === 'diwali') { particles(T, 'fireflies', 1); firework(T, 19.2, 780, 330, 60, '255,190,90'); }
    // warm light, vignette and paper grain: the storybook look
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const lx = 820 + Math.sin(T * 0.3) * 120; const lk = ctx.createRadialGradient(lx, 260, 0, lx, 260, 900); lk.addColorStop(0, 'rgba(255,196,130,0.16)'); lk.addColorStop(1, 'rgba(255,196,130,0)');
    ctx.fillStyle = lk; ctx.fillRect(0, 0, W, H); ctx.restore();
    const vg = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.3, W / 2, H * 0.5, H * 0.8); vg.addColorStop(0, 'rgba(40,20,8,0)'); vg.addColorStop(1, 'rgba(40,20,8,0.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = grain; ctx.fillRect(0, 0, W, H); ctx.restore();
    // characters
    bubble(T, 5.7, 7.35, 'pip', COPY.pipName || 'Pip', COPY.pip || 'Welcome in! Mind the bookworm.', 540, 560, 470, 760);
    { const hd = scr(215, 1128); bubble(T, 25.6, 26.75, 'umber', COPY.umberName || 'Umber', COPY.umber || 'Again! The one with the socks.', 540, Math.max(420, hd.y - 330), hd.x, hd.y - 60); }
    // festival name, narration subtitles
    chip(T, id, s0, s1);
    const TINT = { line3a: '#ffd6e6', line3b: '#ffe7a0', line3c: '#ffc58f', line3d: '#dff3ff' };
    for (const [vid, start] of TL.VOICE) { if (vid === 'line6') continue; const ln = NAR[vid]; if (ln) subtitle(T, (COPY.subs || {})[vid] || ln.text.replace(/,$/, '…'), start, ln.duration, TINT[vid], vid === 'line5' && id === 'dragon' ? 1660 : 1430); }
    pageTurn(T);
    if (id === 'end') endCard(T, s0);
    lastT = T;
    return T;
  }
  return { setup, frame, frames: () => Math.round(TL.DURATION * FPS) };
})();
