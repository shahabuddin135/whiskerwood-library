// The cozy ad's timing sheet: shots (with slow dissolves between them), where each narration clip
// starts, and the gentle sound cues. Shared by director.js (picture) and audio.js (sound).
window.AD_TIMELINE = (() => {
  const FPS = 30;
  const DURATION = 30;
  const DISSOLVE = 0.7; // every new shot fades in over the last frame of the one before

  // [id, start]; a shot lasts until the next one starts
  const SHOTS = [
    ['open', 0], // sunrise over a tiny two-floor library in spring
    ['nook', 4.8], // inside the Cozy Nook: Pip says hello
    ['grow', 7.3], // the library grows, one floor at a time
    ['spring', 9.9], // Spring Egg Hunt
    ['summer', 11.8], // Summer Reading Festival
    ['autumn', 13.6], // Spooky Stories Week at golden hour
    ['winter', 15.4], // Christmas in the snow, at dusk
    ['lunar', 17.4], // Lunar New Year lanterns and fireworks
    ['diwali', 19.0], // Diwali lamps and rangoli
    ['mole', 20.7], // down in Mole City
    ['dragon', 22.6], // Umber, and his bedtime story
    ['end', 26.7], // the storybook cover
  ];

  // narration clips (ad/cozy/narration/*.wav) and when they start; the subtitle shows while each plays
  const VOICE = [
    ['line1', 0.7], ['line2', 5.3],
    ['line3a', 10.15], ['line3b', 12.05], ['line3c', 13.85], ['line3d', 15.65],
    ['line4', 17.75], ['line5', 21.0], ['line6', 26.62],
  ];

  const FLOORS = [7.55, 7.8, 8.05, 8.3, 8.55, 8.8, 9.05, 9.3]; // floors 2-9 appear during "grow"
  const WAKE = 24.6; // Umber opens his eyes

  const CUES = [
    { t: 0.05, type: 'page' },
    ...[0.5, 1.4, 2.5, 3.6].map((t) => ({ t, type: 'bird' })),
    { t: 4.8, type: 'fire' },
    { t: 5.7, type: 'bubble' },
    ...FLOORS.map((t, k) => ({ t, type: 'floor', n: k })),
    ...[10.0, 10.6, 11.2].map((t) => ({ t, type: 'bird' })),
    { t: 11.85, type: 'sunny' },
    { t: 13.62, type: 'wind' },
    { t: 15.45, type: 'sleigh' },
    ...[17.55, 18.15, 18.7].map((t) => ({ t, type: 'firework' })),
    { t: 19.15, type: 'temple' },
    { t: 20.75, type: 'hum' }, { t: 21.45, type: 'ding' },
    { t: 22.9, type: 'snore' }, { t: 23.8, type: 'snore' },
    { t: WAKE, type: 'wake' },
    { t: 25.6, type: 'bubble' },
    { t: 26.7, type: 'close' },
    { t: 29.2, type: 'twinkle' },
  ].sort((a, b) => a.t - b.t);

  return { FPS, DURATION, DISSOLVE, SHOTS, VOICE, FLOORS, WAKE, CUES };
})();
