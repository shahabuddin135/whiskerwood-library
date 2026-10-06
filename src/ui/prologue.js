// The storybook prologue on the very first launch: how Grandma Mimsy's little library came to be
// yours. Six slow, narrated pages (voice: scripts/narrate-prologue.py), illustrated with the game's
// own characters, then, on a phone, a gentle question about reminders before the doors open.
// Tap to turn a page (or to show the words at once); Skip is always there.
import { h } from './dom.js';
import { sfx } from '../audio/sfx.js';
import { setVolume } from '../audio/audio.js';
import { ell, circ, fillRR, star, drawMouse, drawPigeon } from '../world/draw.js';
import { CHARACTERS } from '../data/story.js';

// Keep the text in step with scripts/narrate-prologue.py (it's what the narrator reads).
const PAGES = [
  { scene: meadow, text: 'Once upon a time, at the edge of an old meadow, there stood a very small library.' },
  { scene: reading, text: 'It belonged to Grandma Mimsy. Every evening, she lit the lamp and read stories to every mouse in the meadow.' },
  { scene: dusty, text: 'But the years went by. The lamp grew dim, dust settled on the shelves, and one by one, the readers stopped coming.' },
  { scene: pigeon, text: 'Then, one rainy morning, a pigeon brought a letter. It had your name on it.' },
  { scene: letter, text: '“Dear little one, the library is yours now. Light the lamp, open the doors, and fill it with stories again. With all my love, Grandma Mimsy.”', letter: true },
  { scene: journey, text: 'Tucked inside was a small brass key, shaped like a quill. So you packed your bag, and set off for the meadow…' },
];
const SW = 320; const SH = 220; // scene units

// Plays the prologue; resolves when it's over (or skipped). opts: { settings, native() }
export function playPrologue(opts = {}) {
  return new Promise((done) => {
    const settings = opts.settings || {};
    const el = h(`<div class="prologue">
      <button class="pro-skip">Skip ›</button>
      <div class="pro-book">
        <div class="pro-frame"><canvas class="pro-canvas"></canvas></div>
        <div class="pro-text"></div>
        <div class="pro-dots">${PAGES.map(() => '<i></i>').join('')}</div>
        <div class="pro-hint">tap to turn the page ›</div>
        <div class="pro-ask"></div>
      </div>
      <div class="pro-cover">
        <div class="pro-cover-art"><canvas class="pro-cover-canvas"></canvas></div>
        <h1>Whiskerwood <span>Library</span></h1>
        <p>A little story, before the doors open</p>
        <button class="btn pro-open">📖 Open the book</button>
      </div>
    </div>`);
    document.body.appendChild(el);
    document.body.classList.add('prologue-on');
    const canvas = el.querySelector('.pro-canvas'); const ctx = canvas.getContext('2d');
    const cover = el.querySelector('.pro-cover-canvas'); const cctx = cover.getContext('2d');
    const textEl = el.querySelector('.pro-text'); const hint = el.querySelector('.pro-hint');
    const dots = [...el.querySelectorAll('.pro-dots i')];
    const voice = PAGES.map((_, k) => { const a = new Audio(`audio/prologue/p${k + 1}.mp3`); a.preload = 'auto'; return a; });
    const vol = settings.sfx === false ? 0 : Math.min(1, settings.sfxVol ?? 0.9);
    let page = -1; let shown = 0; let words = []; let revealT = null; let t = 0; let raf = 0; let last = performance.now();
    let state = 'cover'; let fade = 1;

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of [canvas, cover]) {
        const w = c.parentElement.clientWidth; const hgt = Math.round((w * SH) / SW);
        c.style.height = `${hgt}px`; c.width = Math.round(w * dpr); c.height = Math.round(hgt * dpr);
      }
    };
    fit(); window.addEventListener('resize', fit);

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      if (state === 'cover') draw(cctx, cover, meadow, t, 1);
      else if (page >= 0 && page < PAGES.length) draw(ctx, canvas, PAGES[page].scene, t, fade);
      else if (state === 'ask') draw(ctx, canvas, askScene, t, fade);
    };
    raf = requestAnimationFrame(loop);

    const stopVoice = () => voice.forEach((a) => { a.pause(); });
    const revealAll = () => { clearInterval(revealT); revealT = null; words.forEach((w) => w.classList.add('on')); shown = words.length; hint.classList.add('show'); };
    const showPage = (k) => {
      page = k; stopVoice(); clearInterval(revealT); hint.classList.remove('show');
      dots.forEach((d, j) => d.classList.toggle('on', j <= k));
      const pg = PAGES[k];
      textEl.classList.toggle('letter', !!pg.letter);
      textEl.innerHTML = pg.text.split(' ').map((w) => `<span>${w}</span> `).join('');
      words = [...textEl.querySelectorAll('span')]; shown = 0;
      const a = voice[k]; let per = 0.32;
      if (vol > 0) {
        a.volume = vol; a.currentTime = 0;
        a.play().catch(() => {});
        if (a.duration) per = (a.duration * 0.92) / words.length;
      }
      revealT = setInterval(() => { if (shown < words.length) words[shown++].classList.add('on'); else revealAll(); }, per * 1000);
      fade = 0;
      const tween = setInterval(() => { fade = Math.min(1, fade + 0.08); if (fade >= 1) clearInterval(tween); }, 16);
    };
    const turn = () => {
      sfx.pageFlip ? sfx.pageFlip() : sfx.tap();
      if (page + 1 < PAGES.length) { el.querySelector('.pro-book').classList.add('turning'); setTimeout(() => { el.querySelector('.pro-book').classList.remove('turning'); showPage(page + 1); }, 260); }
      else ask();
    };
    // On a phone: may Pip send a little note? (asked here, right before the game starts)
    const ask = () => {
      stopVoice(); clearInterval(revealT);
      const native = opts.native?.();
      if (!native?.askPermission) { finish(); return; }
      state = 'ask'; page = PAGES.length; fade = 1;
      el.querySelector('.pro-dots').style.visibility = 'hidden'; hint.classList.remove('show');
      textEl.classList.remove('letter');
      textEl.innerHTML = '<span class="on">One last thing before you go in…</span>';
      el.querySelector('.pro-ask').innerHTML = `<p>May Pip send you a little note when your coin jar is full, or when a special guest comes to visit?</p>
        <div class="pro-ask-btns"><button class="btn pro-yes">🔔 Yes, please</button><button class="btn plain pro-no">Maybe later</button></div>`;
      el.querySelector('.pro-yes').addEventListener('click', async (e) => { e.stopPropagation(); sfx.tap(); try { await native.askPermission(); } catch { /* ignore */ } finish(); });
      el.querySelector('.pro-no').addEventListener('click', (e) => { e.stopPropagation(); sfx.tap(); finish(); });
    };
    const finish = () => {
      if (state === 'done') return;
      state = 'done'; stopVoice(); clearInterval(revealT);
      setVolume('music', settings.music === false ? 0 : settings.musicVol ?? 0.6, 1.2);
      el.classList.add('closing');
      document.body.classList.remove('prologue-on');
      setTimeout(() => {
        cancelAnimationFrame(raf); window.removeEventListener('resize', fit); el.remove();
        voice.forEach((a) => { a.removeAttribute('src'); a.load(); }); // let the narration go
        done();
      }, 900);
    };

    el.querySelector('.pro-open').addEventListener('click', (e) => {
      e.stopPropagation(); sfx.tap();
      // the narrator speaks: the music steps back a little
      setVolume('music', settings.music === false ? 0 : (settings.musicVol ?? 0.6) * 0.45, 1.5);
      el.querySelector('.pro-cover').classList.add('gone');
      state = 'pages'; fit(); showPage(0);
    });
    el.querySelector('.pro-skip').addEventListener('click', (e) => { e.stopPropagation(); sfx.tap(); if (state === 'ask') finish(); else ask(); });
    el.addEventListener('click', () => {
      if (state !== 'pages') return;
      if (shown < words.length) revealAll(); else turn();
    });
  });
}

/* ------------------------------------------------------------------ */
/* The pictures (drawn in a 320 x 220 scene)                           */
/* ------------------------------------------------------------------ */
function draw(ctx, c, scene, t, fade) {
  const k = c.width / SW;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.fillStyle = '#2b2230'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.globalAlpha = fade;
  scene(ctx, t);
  ctx.globalAlpha = 1;
}
const lin = (ctx, y0, y1, a, b) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
const glowAt = (ctx, x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
const LOOKS = {
  kid1: { fur: '#c9b29b', belly: '#f4e9dc', scarf: '#e9b949' },
  kid2: { fur: '#8f7f73', belly: '#d9cdc2', hat: 'bow', hatCol: '#e58fa8' },
  kid3: { fur: '#e9e2d8', belly: '#fffaf3', hat: 'cap', hatCol: '#4f7cac' },
  you: { fur: '#d6b98c', belly: '#f7ead3', scarf: '#c0504d', hat: 'bobble', hatCol: '#4f7cac' },
};

function hills(ctx, y, amp, col, off = 0) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, SH);
  for (let x = 0; x <= SW; x += 8) ctx.lineTo(x, y - Math.sin((x + off) * 0.018) * amp - Math.sin((x + off) * 0.041 + 1) * amp * 0.4);
  ctx.lineTo(SW, SH); ctx.closePath(); ctx.fill();
}
function cottage(ctx, x, y, s, lit, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#9b5a44'; ctx.fillRect(14, -58, 8, 16); // chimney
  for (let k = 0; k < 3; k++) { const p = (t * 0.25 + k / 3) % 1; circ(ctx, 18 + p * 10, -62 - p * 26, 2.5 + p * 4, `rgba(240,236,230,${0.5 * (1 - p)})`); }
  fillRR(ctx, -26, -36, 52, 36, 2, '#f3e3c3');
  ctx.fillStyle = '#b5523b'; ctx.beginPath(); ctx.moveTo(-32, -34); ctx.lineTo(0, -62); ctx.lineTo(32, -34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8e3b2d'; ctx.fillRect(-32, -36, 64, 3);
  circ(ctx, 0, -46, 6, '#6b4128'); circ(ctx, 0, -46, 4.4, lit ? '#ffd98a' : '#bfe3f2');
  fillRR(ctx, -6, -20, 12, 20, 5, '#7a4b2e'); circ(ctx, 3, -10, 1, '#e9b949');
  fillRR(ctx, -21, -26, 10, 9, 1.5, lit ? '#ffd98a' : '#bfe3f2'); fillRR(ctx, 11, -26, 10, 9, 1.5, lit ? '#ffd98a' : '#bfe3f2');
  ctx.restore();
  if (lit) { glowAt(ctx, x, y - 20 * s, 40 * s, '255,214,140', 0.35); }
}

function meadow(ctx, t) {
  ctx.fillStyle = lin(ctx, 0, SH, '#f2a77f', '#fde8c4'); ctx.fillRect(0, 0, SW, SH);
  glowAt(ctx, 238, 92, 70, '255,240,200', 0.7); circ(ctx, 238, 92, 16, '#fff3c4');
  hills(ctx, 128, 10, '#d6c79a', 40); hills(ctx, 146, 8, '#b4c98a', 0);
  // the old tree
  ctx.fillStyle = '#6b4a34'; ctx.fillRect(48, 112, 9, 50);
  [[52, 104, 30, 22, '#7fa860'], [36, 116, 18, 14, '#6e9a55'], [70, 114, 20, 15, '#8fb86a']].forEach(([x, y, rx, ry, col]) => ell(ctx, x, y, rx, ry, col));
  cottage(ctx, 196, 168, 1, true, t);
  ctx.fillStyle = '#9ccc6c'; ctx.fillRect(0, 168, SW, 60);
  ctx.fillStyle = '#e2c99a'; ctx.beginPath(); ctx.moveTo(190, 168); ctx.quadraticCurveTo(170, 196, 150, SH); ctx.lineTo(196, SH); ctx.quadraticCurveTo(202, 196, 202, 168); ctx.closePath(); ctx.fill();
  for (let k = 0; k < 26; k++) { const x = (k * 53) % SW; const y = 176 + ((k * 37) % 40); circ(ctx, x, y, 1.8, ['#f7a8c4', '#fff3b0', '#ffffff', '#c8a8f0'][k % 4]); }
  for (let k = 0; k < 7; k++) { const x = 30 + ((k * 71 + Math.sin(t * 0.6 + k) * 16) % 280); const y = 120 + ((k * 29) % 50) + Math.sin(t * 1.3 + k * 2) * 5; glowAt(ctx, x, y, 6, '240,255,160', 0.45 + 0.4 * Math.sin(t * 3 + k)); }
}

function room(ctx, t, lit) {
  ctx.fillStyle = '#f0d9bc'; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = 'rgba(180,120,80,0.10)'; for (let x = 0; x < SW; x += 16) ctx.fillRect(x, 0, 8, 160);
  // window with the evening outside
  fillRR(ctx, 214, 34, 62, 54, 4, '#7a4b2e'); ctx.fillStyle = lin(ctx, 38, 84, '#5b5a9a', '#e7a88c'); ctx.fillRect(218, 38, 54, 46);
  ctx.fillStyle = '#7a4b2e'; ctx.fillRect(244, 38, 3, 46); ctx.fillRect(218, 60, 54, 3);
  ctx.fillStyle = '#b98a5c'; ctx.fillRect(0, 160, SW, 60);
  ctx.fillStyle = 'rgba(90,60,40,0.18)'; for (let x = 0; x < SW; x += 24) ctx.fillRect(x, 160, 1.2, 60);
  // bookshelf
  fillRR(ctx, 18, 46, 64, 114, 3, '#7a4b2e');
  for (let r = 0; r < 4; r++) {
    ctx.fillStyle = '#5b3a26'; ctx.fillRect(22, 70 + r * 24, 56, 3);
    for (let b = 0; b < 8; b++) { if (!lit && (b + r) % 3 === 0) continue; fillRR(ctx, 24 + b * 6.6, 54 + r * 24, 5.2, 16 - ((b * 7 + r) % 5), 0.8, ['#b5523b', '#3d7a5a', '#4f7cac', '#e9b949', '#8e3b46', '#5b3f8c'][(b + r) % 6]); }
  }
  ell(ctx, 160, 192, 110, 16, lit ? '#c0504d' : '#8a4a46'); ell(ctx, 160, 192, 92, 11, lit ? '#d9774b' : '#9a5a4a');
  // the lamp
  ctx.fillStyle = '#5b3a26'; ctx.fillRect(255, 110, 3, 66); fillRR(ctx, 248, 174, 17, 4, 2, '#5b3a26');
  ctx.fillStyle = lit ? '#f6d28a' : '#bfae8a'; ctx.beginPath(); ctx.moveTo(244, 112); ctx.lineTo(270, 112); ctx.lineTo(264, 96); ctx.lineTo(250, 96); ctx.closePath(); ctx.fill();
  if (lit) glowAt(ctx, 257, 112, 70 + Math.sin(t * 7) * 2, '255,214,140', 0.42);
  // the big armchair
  fillRR(ctx, 128, 132, 64, 46, 10, lit ? '#9b6fb0' : '#7d6a86'); fillRR(ctx, 120, 152, 16, 30, 6, lit ? '#8a5ea0' : '#6f5e78'); fillRR(ctx, 184, 152, 16, 30, 6, lit ? '#8a5ea0' : '#6f5e78');
  fillRR(ctx, 132, 164, 56, 14, 5, lit ? '#b38ac4' : '#8c7a94');
}
function reading(ctx, t) {
  room(ctx, t, true);
  const m = CHARACTERS.mimsy.look;
  drawMouse(ctx, 156, 168, { ...m, pose: 'read', dir: 1, s: 1.5, t, book: '#c0504d', noShadow: true, seated: true, full: true });
  drawMouse(ctx, 92, 198, { ...LOOKS.kid1, pose: 'sit', dir: 1, s: 1.05, t: t + 1, full: true });
  drawMouse(ctx, 118, 205, { ...LOOKS.kid2, pose: 'sit', dir: 1, s: 1.0, t: t + 2.3, full: true });
  drawMouse(ctx, 222, 204, { ...LOOKS.kid3, pose: Math.sin(t * 0.7) > 0.7 ? 'happy' : 'sit', dir: -1, s: 1.05, t: t + 0.6, full: true });
}
function dusty(ctx, t) {
  room(ctx, t, false);
  ctx.fillStyle = 'rgba(40,32,52,0.42)'; ctx.fillRect(0, 0, SW, SH);
  // a beam of grey morning light from the window, full of slow dust
  ctx.fillStyle = 'rgba(255,245,220,0.12)'; ctx.beginPath(); ctx.moveTo(218, 40); ctx.lineTo(272, 40); ctx.lineTo(196, 200); ctx.lineTo(110, 200); ctx.closePath(); ctx.fill();
  for (let k = 0; k < 22; k++) { const x = 150 + ((k * 37 + t * (4 + (k % 3))) % 110) - ((k * 13) % 30); const y = 60 + ((k * 23 + t * (3 + (k % 4))) % 140); circ(ctx, x, y, 0.8 + (k % 3) * 0.4, 'rgba(255,240,210,0.6)'); }
  // cobweb
  ctx.strokeStyle = 'rgba(240,240,250,0.5)'; ctx.lineWidth = 0.6;
  for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(SW, 0, k * 9, Math.PI * 0.5, Math.PI); ctx.stroke(); }
  for (let k = 0; k < 4; k++) { const a = Math.PI * (0.5 + k / 6); ctx.beginPath(); ctx.moveTo(SW, 0); ctx.lineTo(SW + Math.cos(a) * 40, Math.sin(a) * 40); ctx.stroke(); }
  // an empty chair, and a cup gone cold
  fillRR(ctx, 236, 176, 12, 9, 2, '#d9d0c4');
}
function pigeon(ctx, t) {
  ctx.fillStyle = lin(ctx, 0, SH, '#8fa3b8', '#d6dee6'); ctx.fillRect(0, 0, SW, SH);
  hills(ctx, 150, 9, '#9fb092', 10); hills(ctx, 170, 6, '#8aa07c', 80);
  cottage(ctx, 70, 176, 0.6, false, t);
  ctx.fillStyle = '#7d9a6c'; ctx.fillRect(0, 176, SW, 50);
  // rain
  ctx.strokeStyle = 'rgba(230,238,250,0.55)'; ctx.lineWidth = 0.9; ctx.beginPath();
  for (let k = 0; k < 70; k++) { const x = ((k * 47 + t * 40) % (SW + 40)) - 20; const y = ((k * 31 + t * 260) % (SH + 20)) - 10; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 9); }
  ctx.stroke();
  // the pigeon, with the letter in its beak... well, on a string
  const x = 120 + Math.sin(t * 0.5) * 70; const y = 82 + Math.sin(t * 1.1) * 10;
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(t * 0.5) >= 0 ? 1 : -1, 1);
  ctx.strokeStyle = '#7a5b3a'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-2, 16); ctx.stroke();
  fillRR(ctx, -12, 15, 22, 15, 1.5, '#fbf3df'); ctx.fillStyle = '#e8dcc2'; ctx.beginPath(); ctx.moveTo(-12, 15); ctx.lineTo(-1, 24); ctx.lineTo(10, 15); ctx.closePath(); ctx.fill();
  circ(ctx, -1, 23, 2.6, '#c0392b');
  drawPigeon(ctx, 0, 0, t, 1.6, false);
  ctx.restore();
}
function letter(ctx, t) {
  ctx.fillStyle = '#8a5a3a'; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = 'rgba(60,35,20,0.25)'; for (let y = 6; y < SH; y += 14) ctx.fillRect(0, y, SW, 1.2);
  glowAt(ctx, 160, 100, 160, '255,220,170', 0.25);
  ctx.save(); ctx.translate(160, 108); ctx.rotate(-0.05);
  fillRR(ctx, -98, -86, 196, 172, 3, '#fbf3df');
  ctx.fillStyle = 'rgba(160,120,70,0.10)'; ctx.fillRect(-98, -86, 196, 172);
  ctx.fillStyle = '#5b3a26'; ctx.font = '13px "Kalam", cursive'; ctx.textAlign = 'left';
  ctx.fillText('Dear little one,', -82, -60);
  ctx.strokeStyle = 'rgba(91,58,38,0.55)'; ctx.lineWidth = 1;
  for (let r = 0; r < 5; r++) { ctx.beginPath(); for (let x = -82; x < 70 - (r === 4 ? 70 : 0); x += 3) ctx.lineTo(x, -40 + r * 17 + Math.sin(x * 0.5 + r * 2) * 1.6); ctx.stroke(); }
  ctx.font = '12px "Kalam", cursive'; ctx.fillText('With all my love,', 4, 54); ctx.fillText('Grandma Mimsy', 14, 70);
  circ(ctx, -66, 62, 11, '#a83228'); circ(ctx, -66, 62, 7, '#c0392b'); star(ctx, -66, 62, 4, '#e0605a');
  ctx.restore();
  // the little brass key, shaped like a quill
  ctx.save(); ctx.translate(196, 206); ctx.rotate(-0.12); // resting on the table, just below the letter
  ctx.fillStyle = '#c9a227'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(26, -10, 56, -4); ctx.quadraticCurveTo(28, 2, 0, 4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(4, 2); ctx.lineTo(54, -3);
  for (let k = 8; k < 52; k += 5) { ctx.moveTo(k, 1.5 - k * 0.1); ctx.lineTo(k + 4, -4 - k * 0.05); } ctx.stroke();
  ctx.fillStyle = '#b98a1a'; ctx.fillRect(-14, 0, 15, 2.6); ctx.fillRect(-14, 2.6, 3, 5); ctx.fillRect(-8, 2.6, 3, 4);
  circ(ctx, -18, 1.3, 4.5, '#c9a227'); circ(ctx, -18, 1.3, 2.2, '#8a5a3a');
  ctx.restore();
  const g = (t * 0.6) % 1; if (g < 0.35) star(ctx, 190 + g * 60, 204 - g * 10, 3.5 * Math.sin((g / 0.35) * Math.PI), '#fffbe0');
}
function journey(ctx, t) {
  ctx.fillStyle = lin(ctx, 0, SH, '#ffcf9e', '#fff2d6'); ctx.fillRect(0, 0, SW, SH);
  glowAt(ctx, 92, 120, 80, '255,236,190', 0.8); circ(ctx, 92, 124, 18, '#fff4cc');
  const off = t * 6;
  hills(ctx, 132, 9, '#d8cfa2', off * 0.3); hills(ctx, 150, 10, '#b9cf8e', off * 0.6);
  cottage(ctx, 258, 140, 0.42, false, t);
  for (let k = 0; k < 3; k++) { const bx = (60 + k * 22 + t * 10) % 360 - 20; const by = 52 + k * 7; const f = Math.sin(t * 9 + k) * 2.2; ctx.strokeStyle = 'rgba(70,60,80,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 4, by - f); ctx.quadraticCurveTo(bx - 1, by, bx, by); ctx.quadraticCurveTo(bx + 1, by, bx + 4, by - f); ctx.stroke(); }
  ctx.fillStyle = '#a9cc7c'; ctx.fillRect(0, 170, SW, 60);
  ctx.fillStyle = '#e8d2a4'; ctx.beginPath(); ctx.moveTo(0, 198); ctx.quadraticCurveTo(160, 180, SW, 186); ctx.lineTo(SW, 200); ctx.quadraticCurveTo(160, 194, 0, 212); ctx.closePath(); ctx.fill();
  for (let k = 0; k < 14; k++) { const x = ((k * 61 - off * 2.2) % (SW + 20) + SW + 20) % (SW + 20) - 10; circ(ctx, x, 176 + ((k * 13) % 12), 1.7, ['#f7a8c4', '#fff3b0', '#c8a8f0'][k % 3]); }
  // you, with a satchel and a little lantern, walking to the meadow
  const x = 132; const y = 198;
  drawMouse(ctx, x, y, { ...LOOKS.you, pose: 'walk', dir: 1, s: 1.5, t, full: true });
  ctx.strokeStyle = '#6b4128'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 2, y - 33); ctx.lineTo(x - 9, y - 16); ctx.stroke();
  fillRR(ctx, x - 17, y - 21, 11, 10, 3, '#9a6b45'); ctx.fillStyle = '#7a4b2e'; ctx.fillRect(x - 17, y - 19, 11, 2);
}
function askScene(ctx, t) {
  ctx.fillStyle = lin(ctx, 0, SH, '#fde2b8', '#fff6e4'); ctx.fillRect(0, 0, SW, SH);
  hills(ctx, 160, 8, '#c6d99a', 30);
  ctx.fillStyle = '#a9cc7c'; ctx.fillRect(0, 178, SW, 50);
  // a little mailbox with a bell
  ctx.fillStyle = '#7a4b2e'; ctx.fillRect(196, 128, 4, 52);
  fillRR(ctx, 182, 106, 32, 24, 9, '#4f7cac'); ctx.fillStyle = '#e0404f'; ctx.fillRect(210, 96, 3, 16); ctx.fillRect(210, 96, 9, 5);
  const ring = Math.sin(t * 9) * (Math.sin(t * 1.5) > 0.4 ? 0.35 : 0.03);
  ctx.save(); ctx.translate(232, 100); ctx.rotate(ring);
  ctx.fillStyle = '#e9b949'; ctx.beginPath(); ctx.moveTo(-8, 12); ctx.quadraticCurveTo(-8, -6, 0, -8); ctx.quadraticCurveTo(8, -6, 8, 12); ctx.closePath(); ctx.fill(); circ(ctx, 0, 13, 2.2, '#c9a227');
  ctx.restore();
  drawMouse(ctx, 132, 186, { ...CHARACTERS.pip.look, pose: 'wave', dir: 1, s: 1.9, t, full: true });
}
