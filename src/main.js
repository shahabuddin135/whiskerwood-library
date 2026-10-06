import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/kalam/400.css';
import './styles.css';

import { loadState, freshState } from './core/save.js';
import { Game } from './core/game.js';
import { World } from './world/world.js';
import { UI } from './ui/ui.js';
import { initAudioUnlock } from './audio/audio.js';
import { loadSfx } from './audio/sfx.js';
import { music } from './audio/music.js';
import { Ads } from './ads/ads.js';
import { initNative } from './native.js';
import { playPrologue } from './ui/prologue.js';
import { CONFIG } from './config.js';
import { Quality } from './world/quality.js';
import { spriteStats, setSprites } from './world/sprites.js';
import { renderSample } from './audio/voices.js';
import { renderPreview } from './audio/music.js';
import { fmt as fmtNum } from './core/format.js';

const OFFLINE_MIN_MS = 60 * 1000;

function boot() {
  const loaded = loadState();
  const state = loaded || freshState();
  const game = new Game(state);
  const world = new World(document.getElementById('world'), game);
  const ui = new UI(game, world);
  // Graphics quality (Settings → Graphics): 60 fps cap and, on "Auto", a render resolution that
  // adapts to the phone.
  const quality = new Quality(world, state.settings);
  ui.quality = quality;

  initAudioUnlock();
  loadSfx();
  if (state.settings.music) music.start();
  // First launch: the storybook prologue, then (on a phone) the reminder question and the ads
  // consent form where the law needs one, then the camera drifts down to the library and Pip
  // says hello. Nothing else pops up until then.
  if (loaded && state.story?.seen?.includes('intro')) state.flags.prologue = true; // they've met Pip already
  const firstRun = !state.flags.prologue;
  if (firstRun) {
    ui.cinematic = true;
    setTimeout(() => playPrologue({ settings: state.settings, native: () => ui.native }).then(() => {
      state.flags.prologue = true; game.save();
      world.introPan();
      quality.hold(6000); // the first seconds after the story say nothing about how fast the phone is
      setTimeout(() => { ui.cinematic = false; }, 2600); // Pip's welcome once the camera has landed
      // the ads (and their consent form, where needed) start once Pip has said hello
      let adsStarted = false;
      const startAds = () => { if (adsStarted) return; adsStarted = true; Ads.init({ preloadAfter: 45000 }).catch((e) => console.warn(e)); };
      ui.afterIntro = () => setTimeout(startAds, 2500);
      setTimeout(startAds, 90000);
    }), 300);
  } else Ads.init({ preloadAfter: 20000 }).catch((e) => console.warn(e));

  // Android back button, reminders, immersive mode, review prompt (no-op in browsers).
  initNative(ui, game).then((n) => { ui.native = n; }).catch((e) => console.warn('native', e));

  // Offline earnings since the last session. (First launch plays the story intro instead.)
  // The Mouse Calendar also moves on while you're away (up to one season), so you often come
  // back to a new season.
  const catchUpCalendar = (awayMs) => game.advanceCalendar(Math.min(awayMs / 1000, game.seasonSec()));
  if (loaded) {
    const away = Date.now() - (state.lastSeen || Date.now());
    if (away > OFFLINE_MIN_MS) { catchUpCalendar(away); setTimeout(() => ui.screens.offline(away), 600); }
  }

  const save = () => { if (!game.noSave) game.save(); };
  setInterval(save, 5000);
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); save(); }
    else if (hiddenAt) {
      const away = Date.now() - hiddenAt;
      hiddenAt = 0;
      if (away > OFFLINE_MIN_MS) { catchUpCalendar(away); ui.screens.offline(away); }
    }
  });
  window.addEventListener('pagehide', save);
  window.addEventListener('beforeunload', save);

  let last = performance.now();
  // One bad frame must never freeze the game: errors are logged (once) and the loop carries on.
  let reported = 0;
  let warmTick = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    // at most 60 frames a second, even on 90/120 Hz screens (30 when a slow phone needs it)
    if (now - last < (quality.fps30 ? 31 : 15)) return;
    const gap = now - last;
    const dt = Math.min(0.1, Math.max(0, gap / 1000));
    last = now;
    try {
      const prof = world.prof; const t0 = prof ? performance.now() : 0;
      game.update(dt);
      world.update(dt);
      if (prof) { const t1 = performance.now(); prof.update = (prof.update || 0) + (t1 - t0); }
      // Under the storybook the world isn't shown, but it's drawn now and then anyway, so its
      // pictures are all painted by the time the story ends (see world.prewarm).
      if (!document.body.classList.contains('prologue-on')) world.render();
      else if (++warmTick % 3 === 0 && !world.warm) world.prewarm(warmTick / 3);
      const t2 = prof ? performance.now() : 0;
      ui.frame(dt);
      if (prof) prof.ui = (prof.ui || 0) + (performance.now() - t2);
      if (!document.body.classList.contains('prologue-on')) quality.sample(gap, performance.now() - now); // (not while warming up behind the story)
    } catch (e) {
      if (reported++ < 3) console.error('frame error', e);
    }
  };
  requestAnimationFrame(loop);

  setTimeout(() => document.getElementById('loading')?.classList.add('hide'), 350);
  setTimeout(() => document.getElementById('loading')?.remove(), 1000);

  // Developer tools (CONFIG.devTools): a one-time testing gift, and the DEV tag on the settings button.
  if (CONFIG.devTools) {
    document.body.classList.add('dev');
    Ads.devInstant = !!state.flags.devInstantAds;
    if (!state.flags.devGift) {
      state.flags.devGift = true;
      setTimeout(() => {
        game.addCheese(5000);
        const coins = game.devCoins(86400);
        ui.toast(`🛠️ Developer gift: +5,000 golden cheese and ${fmtNum(coins)} coins. More in ⚙️ Settings.`, 'gold');
      }, 2500);
    }
  }

  // Handy for debugging in the browser console.
  window.WWL = { game, world, ui, sprites: { stats: spriteStats, set: setSprites }, voiceSample: renderSample, musicPreview: renderPreview };
}

// Wait for the fonts so canvas text uses them from the first frame.
const fontsReady = document.fonts?.ready || Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(boot);
