// Native (Capacitor) integrations: Android back button, immersive mode, splash screen,
// local reminder notifications and the in-app review prompt. No-ops in the browser.
import { Capacitor } from '@capacitor/core';
import { openModal, closeModal, modalOpen } from './ui/modals.js';
import { ROOMS } from './data/rooms.js';
import { fmt } from './core/format.js';

const IDS = { jar: 101, offline: 102, build: 103, daily: 104, miss: 105 };

export async function initNative(ui, game) {
  if (!Capacitor.isNativePlatform()) return null;
  const [{ App }, { StatusBar }, { SplashScreen }, { LocalNotifications }, review] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/local-notifications'),
    import('@capacitor-community/in-app-review').catch(() => null),
  ]);

  try { await StatusBar.hide(); } catch { /* not supported */ }
  try { await SplashScreen.hide({ fadeOutDuration: 300 }); } catch { /* ignore */ }

  // Hardware back button: close whatever is on top, then confirm leaving.
  let exitOpen = false;
  App.addListener('backButton', () => {
    if (ui.story.open) { ui.story.finish(); return; }
    if (modalOpen()) {
      const close = document.querySelector('.modal-back:last-child .modal-close');
      if (close) close.click();
      else if (exitOpen) closeModal();
      return;
    }
    if (ui.sheet.isOpen) { ui.sheet.close(); return; }
    exitOpen = true;
    openModal({
      title: 'Leave the library?', row: true,
      body: '<div class="art">🐭💤</div><div class="flavor">Your mice will keep earning while you’re away.</div>',
      buttons: [{ label: 'Stay', cls: 'plain' }, { label: 'Leave', cls: 'red', onClick: () => { game.save(); App.exitApp(); } }],
      onClose: () => { exitOpen = false; },
    });
  });

  const enabled = () => game.s.settings.notifications !== false;
  let permission = 'prompt';
  try { permission = (await LocalNotifications.checkPermissions()).display; } catch { /* ignore */ }
  const askPermission = async () => {
    if (permission === 'granted' || permission === 'denied' || !enabled()) return;
    try { permission = (await LocalNotifications.requestPermissions()).display; } catch { /* ignore */ }
  };

  const cancelAll = async () => {
    try { await LocalNotifications.cancel({ notifications: Object.values(IDS).map((id) => ({ id })) }); } catch { /* ignore */ }
  };

  const schedule = async () => {
    await cancelAll();
    if (permission !== 'granted' || !enabled()) return;
    const now = Date.now();
    const list = [];
    const at = (ms) => ({ at: new Date(now + ms), allowWhileIdle: true });
    const inc = game.steady();
    const space = Math.max(0, game.jarCap() - game.s.jar);
    const jarSec = space / Math.max(1, inc);
    if (jarSec > 600 && jarSec < 12 * 3600) list.push({ id: IDS.jar, title: '🫙 Your coin jar is full!', body: 'Your mice have filled the jar to the brim. Come and collect!', schedule: at(jarSec * 1000) });
    const cap = game.offlineCapSec();
    const offAmt = game.offlineEarnings(cap * 1000).amount;
    if (cap * 1000 > jarSec * 1000 + 30 * 60000) list.push({ id: IDS.offline, title: '📚 The library had a busy day', body: `Your mice earned ${fmt(offAmt)} coins while you were away.`, schedule: at(cap * 1000) });
    const c = game.constructing();
    if (c >= 0) { const ms = game.buildRemaining(c) * 1000; if (ms > 60000) list.push({ id: IDS.build, title: '🎉 Grand opening!', body: `${ROOMS[c].name} is finished and ready for readers.`, schedule: at(ms) }); }
    const d = new Date(); d.setDate(d.getDate() + (game.dailyStatus().canClaim ? 0 : 1)); d.setHours(10, 0, 0, 0);
    if (d.getTime() - now < 3600000) d.setTime(now + 3 * 3600000);
    list.push({ id: IDS.daily, title: '🎁 Your daily gift is waiting', body: 'Keep your streak going — today’s gift is even better!', schedule: { at: d, allowWhileIdle: true } });
    list.push({ id: IDS.miss, title: '🐭 The mice miss you!', body: 'Baroness Clawdia has been spotted near the library…', schedule: at(26 * 3600000) });
    try { await LocalNotifications.schedule({ notifications: list.map((n) => ({ ...n, smallIcon: 'ic_stat_whiskerwood', iconColor: '#d9774b' })) }); } catch (e) { console.warn('notifications', e); }
  };

  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) { game.save(); schedule(); } else cancelAll();
  });
  cancelAll();

  const askReview = async (why) => {
    const f = game.s.flags;
    if (!review?.InAppReview || f[`review_${why}`]) return;
    f[`review_${why}`] = true;
    setTimeout(() => review.InAppReview.requestReview().catch(() => {}), 2500);
  };

  return {
    onFloorBuilt(n) {
      if (n === 2) askPermission();
      if (n === 5) askReview('floors');
    },
    askReview,
    askPermission,
  };
}
