// Ad abstraction with three providers:
//  1. AdMob via @capacitor-community/admob (native Android / iOS builds)
//  2. Google H5 Games Ads (adBreak) on the web, when a publisher id is configured
//  3. A clearly labelled mock ad for local development
// Rewarded ads are always opt-in (player taps a 📺 button) as required by ad network policies.
import { Capacitor } from '@capacitor/core';
import { CONFIG } from '../config.js';

let provider = 'mock';
let AdMob = null;
let RewardEvents = null;
let lastAdAt = 0;
let sessionStart = Date.now();
let busy = false;
const listeners = new Set();

export const Ads = {
  get provider() { return provider; },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  async init() {
    sessionStart = Date.now();
    if (Capacitor.isNativePlatform()) {
      try {
        const mod = await import('@capacitor-community/admob');
        AdMob = mod.AdMob; RewardEvents = mod.RewardAdPluginEvents;
        await AdMob.initialize({ initializeForTesting: CONFIG.ads.admob.testing });
        // GDPR / UMP consent (shows Google's form only where required).
        try {
          const info = await AdMob.requestConsentInfo();
          if (info.isConsentFormAvailable && info.status === mod.AdmobConsentStatus.REQUIRED) await AdMob.showConsentForm();
        } catch (e) { console.warn('consent', e); }
        if (Capacitor.getPlatform() === 'ios') {
          try {
            const st = await AdMob.trackingAuthorizationStatus();
            if (st.status === 'notDetermined') await AdMob.requestTrackingAuthorization?.();
          } catch { /* optional */ }
        }
        provider = 'admob';
        this.preloadRewarded();
        return;
      } catch (e) {
        console.warn('AdMob unavailable, falling back to mock ads', e);
      }
    }
    if (CONFIG.ads.h5.client) {
      await loadH5(CONFIG.ads.h5.client, CONFIG.ads.h5.testing);
      if (window.adBreak) provider = 'h5';
    }
  },

  ids() {
    const p = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
    return CONFIG.ads.admob[p];
  },

  async preloadRewarded() {
    if (provider !== 'admob') return;
    try { await AdMob.prepareRewardVideoAd({ adId: this.ids().rewarded, isTesting: CONFIG.ads.admob.testing }); } catch (e) { /* retry on show */ }
  },

  // Resolves true only if the player watched the ad to completion.
  devInstant: false, // developer tools: every rewarded ad pays out at once, with no ad shown
  async rewarded(placement = 'reward') {
    if (this.devInstant) return true;
    if (busy) return false;
    busy = true;
    notify(true);
    let ok = false;
    try {
      if (provider === 'admob') ok = await admobRewarded(this.ids());
      else if (provider === 'h5') ok = await h5Rewarded(placement);
      else ok = await mockAd('rewarded', placement);
    } catch (e) {
      console.warn('rewarded failed', e);
      ok = false;
    }
    lastAdAt = Date.now();
    busy = false;
    notify(false);
    if (provider === 'admob') this.preloadRewarded();
    return ok;
  },

  canShowInterstitial(floorsBuilt, removeAds) {
    const c = CONFIG.ads.interstitial;
    const now = Date.now();
    return !removeAds && !busy && floorsBuilt > c.minFloor
      && now - sessionStart > c.minSessionSec * 1000
      && now - lastAdAt > c.minGapSec * 1000;
  },

  async interstitial(placement = 'break') {
    if (this.devInstant || busy) return;
    busy = true; notify(true);
    try {
      if (provider === 'admob') {
        await AdMob.prepareInterstitial({ adId: this.ids().interstitial, isTesting: CONFIG.ads.admob.testing });
        await AdMob.showInterstitial();
      } else if (provider === 'h5') {
        await new Promise((res) => window.adBreak({ type: 'next', name: placement, adBreakDone: res }));
      } else {
        await mockAd('interstitial', placement);
      }
    } catch (e) { console.warn('interstitial failed', e); }
    lastAdAt = Date.now();
    busy = false; notify(false);
  },

  async privacyOptions() {
    if (provider === 'admob') { try { await AdMob.showPrivacyOptionsForm(); } catch (e) { console.warn(e); } }
  },
};

function notify(showing) { listeners.forEach((fn) => fn(showing)); }

function admobRewarded(ids) {
  return new Promise(async (resolve) => {
    let rewarded = false;
    const handles = [];
    const done = () => { handles.forEach((h) => h.remove?.()); resolve(rewarded); };
    handles.push(await AdMob.addListener(RewardEvents.Rewarded, () => { rewarded = true; }));
    handles.push(await AdMob.addListener(RewardEvents.Dismissed, done));
    handles.push(await AdMob.addListener(RewardEvents.FailedToShow, done));
    try {
      try { await AdMob.showRewardVideoAd(); } catch {
        await AdMob.prepareRewardVideoAd({ adId: ids.rewarded, isTesting: CONFIG.ads.admob.testing });
        await AdMob.showRewardVideoAd();
      }
    } catch (e) { done(); }
  });
}

function loadH5(client, testing) {
  return new Promise((resolve) => {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    s.crossOrigin = 'anonymous';
    if (testing) s.dataset.adbreakTest = 'on';
    s.onload = () => { window.adConfig({ preloadAdBreaks: 'on', sound: 'on' }); resolve(); };
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
}

function h5Rewarded(name) {
  return new Promise((resolve) => {
    let viewed = false;
    window.adBreak({
      type: 'reward', name,
      beforeReward: (showAdFn) => showAdFn(),
      adViewed: () => { viewed = true; },
      adDismissed: () => { viewed = false; },
      adBreakDone: () => resolve(viewed),
    });
  });
}

// Development stand-in so every ad placement can be tested in a browser.
function mockAd(kind, placement) {
  return new Promise((resolve) => {
    const secs = CONFIG.ads.mockSeconds;
    const el = document.createElement('div');
    el.className = 'mock-ad';
    el.innerHTML = `
      <div class="mock-ad-card">
        <div class="mock-ad-tag">TEST AD · ${kind} · ${placement}</div>
        <div class="mock-ad-art">🧀</div>
        <div class="mock-ad-title">Cheesy Crunch Crackers</div>
        <div class="mock-ad-sub">Real AdMob ads play here in the mobile build.</div>
        <div class="mock-ad-bar"><i></i></div>
        <button class="mock-ad-close" disabled>${secs}</button>
      </div>`;
    document.body.appendChild(el);
    const btn = el.querySelector('.mock-ad-close');
    const bar = el.querySelector('.mock-ad-bar i');
    const start = performance.now();
    let finished = false;
    const iv = setInterval(() => {
      const t = (performance.now() - start) / 1000;
      bar.style.width = `${Math.min(100, (t / secs) * 100)}%`;
      const left = Math.ceil(secs - t);
      if (left > 0) btn.textContent = left;
      else if (!finished) { finished = true; btn.disabled = false; btn.textContent = '✕'; clearInterval(iv); }
    }, 100);
    btn.addEventListener('click', () => { el.remove(); resolve(true); });
    // Let testers bail out early (counts as not watched).
    el.addEventListener('click', (e) => { if (e.target === el && !finished) { clearInterval(iv); el.remove(); resolve(false); } });
  });
}
