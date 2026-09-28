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

const OFFLINE_MIN_MS = 60 * 1000;

function boot() {
  const loaded = loadState();
  const state = loaded || freshState();
  const game = new Game(state);
  const world = new World(document.getElementById('world'), game);
  const ui = new UI(game, world);

  initAudioUnlock();
  loadSfx();
  if (state.settings.music) music.start();
  Ads.init().catch((e) => console.warn(e));

  // Android back button, reminders, immersive mode, review prompt (no-op in browsers).
  initNative(ui, game).then((n) => { ui.native = n; }).catch((e) => console.warn('native', e));

  // Offline earnings since the last session. (First launch plays the story intro instead.)
  if (loaded) {
    const away = Date.now() - (state.lastSeen || Date.now());
    if (away > OFFLINE_MIN_MS) setTimeout(() => ui.screens.offline(away), 600);
  }

  const save = () => { if (!game.noSave) game.save(); };
  setInterval(save, 5000);
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); save(); }
    else if (hiddenAt) {
      const away = Date.now() - hiddenAt;
      hiddenAt = 0;
      if (away > OFFLINE_MIN_MS) ui.screens.offline(away);
    }
  });
  window.addEventListener('pagehide', save);
  window.addEventListener('beforeunload', save);

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    game.update(dt);
    world.update(dt);
    world.render();
    ui.frame(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  setTimeout(() => document.getElementById('loading')?.classList.add('hide'), 350);
  setTimeout(() => document.getElementById('loading')?.remove(), 1000);

  // Handy for debugging in the browser console.
  window.WWL = { game, world, ui };
}

// Wait for the fonts so canvas text uses them from the first frame.
const fontsReady = document.fonts?.ready || Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(boot);
