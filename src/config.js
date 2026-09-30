// Central configuration. Replace the test IDs with your own before publishing.
export const CONFIG = {
  gameName: 'Whiskerwood Library',
  version: '1.1.0',
  // Turn on once real in-app purchases are wired (see src/iap.js). Hidden until then so the
  // store build never shows buttons that don't work.
  iapEnabled: false,
  // Developer tools for testing: a one-time gift of cheese and coins, and a 🛠️ Developer section in
  // Settings (more cheese/coins, finish every timer, instant ads). A "DEV" tag shows on the settings
  // button while this is on. ⚠️ Set to false before building the version you upload to Google Play.
  devTools: false,
  // The website (site/, deployed on Vercel) hosts the policy: put the same URL in the Play Console.
  // If your Vercel address is different, change it here and in site/site.config.json.
  privacyUrl: 'https://whiskerwood-library.vercel.app/privacy',

  ads: {
    // Google AdMob (native Android/iOS via Capacitor). These are Google's official TEST ids.
    admob: {
      android: {
        appId: 'ca-app-pub-3940256099942544~3347511713',
        rewarded: 'ca-app-pub-3940256099942544/5224354917',
        interstitial: 'ca-app-pub-3940256099942544/1033173712',
      },
      ios: {
        appId: 'ca-app-pub-3940256099942544~1458002511',
        rewarded: 'ca-app-pub-3940256099942544/1712485313',
        interstitial: 'ca-app-pub-3940256099942544/4411468910',
      },
      testing: true, // set false for production builds
    },
    // Google H5 Games Ads (web builds). Put your AdSense publisher id here, e.g. 'ca-pub-123...'.
    h5: { client: '', testing: true },

    // Interstitial pacing: never annoying, only at natural breaks.
    interstitial: {
      minSessionSec: 180, // no interstitials in the first 3 minutes of a session
      minGapSec: 240, // at least 4 minutes between any two ads
      minFloor: 3, // only after the player has built 4+ floors
    },
    // Length of the simulated ad shown in the browser during development.
    mockSeconds: 4,
  },

  // Optional: drop mp3/ogg files here to replace the procedural soundtrack.
  musicFiles: { day: null, night: null },
};
