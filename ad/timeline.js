// The ad's timing sheet, shared by the picture (director.js) and the sound (audio.js), so every cut,
// word and sound effect lands on the beat. 120 BPM: a beat is 0.5 s, a bar is 2 s.
window.AD_TIMELINE = (() => {
  const FPS = 30;
  const DURATION = 30;
  const BPM = 120;

  // Scene boundaries (seconds).
  const SCENES = {
    hook: [0, 2], // one tiny library: tap, tap, TAP
    tower: [2, 6], // floors stack up on the beat
    wings: [6, 9], // ...and out: café, hall, press, museum
    montage: [9, 11], // quick peeks inside the wings
    dig: [11, 14], // ...and down: through the soil, the mole crew digs
    lift: [14, 16], // the lift house on the lawn, then a dive down the shaft
    mole: [16, 19], // Mole City shops level up
    door: [19, 21], // eight locks light up
    dragon: [21, 23], // the door opens: Umber wakes
    world: [23, 27], // pull all the way out: the whole city
    end: [27, 30], // logo + call to action
  };

  // Floors 1-9 go up on these beats (accelerating), a wing pops up on each beat from 6.5 s.
  const FLOORS = [2.25, 2.75, 3.25, 3.5, 3.75, 4.25, 4.5, 4.75, 5.0];
  const WINGS = [['cafe', 6.5], ['hall', 7.0], ['press', 7.5], ['museum', 8.0]];
  const TAPS = [0.5, 1.0, 1.5];
  const LOCKS = [19.25, 19.5, 19.75, 20.0, 20.25, 20.5, 20.75, 21.0];

  // Sound cues (audio.js plays them; director.js uses some for visual bursts too).
  const CUES = [
    { t: 0.1, type: 'pop', pitch: 1.0 }, { t: 0.3, type: 'pop', pitch: 1.12 },
    ...TAPS.map((t, k) => ({ t, type: 'tap', note: [84, 88, 91][k] })),
    ...TAPS.map((t) => ({ t: t + 0.06, type: 'coins' })),
    { t: 1.72, type: 'whoosh', dur: 0.3, dir: 1 },
    { t: 2.0, type: 'slam' }, { t: 2.0, type: 'crash' },
    ...FLOORS.map((t, k) => ({ t, type: 'floor', n: k })),
    { t: 3.0, type: 'coins' }, { t: 4.0, type: 'coins' }, { t: 5.0, type: 'coins', big: true },
    { t: 5.45, type: 'whoosh', dur: 0.5, dir: -1 },
    { t: 6.0, type: 'slam' },
    ...WINGS.map(([, t]) => ({ t, type: 'stamp' })),
    { t: 8.5, type: 'chaching' },
    { t: 9.0, type: 'whoosh', dur: 0.2, dir: 1 }, { t: 9.05, type: 'clink' },
    { t: 9.5, type: 'whoosh', dur: 0.2, dir: 1 }, { t: 9.55, type: 'party' },
    { t: 10.0, type: 'whoosh', dur: 0.2, dir: 1 }, { t: 10.05, type: 'clunk' },
    { t: 10.5, type: 'whoosh', dur: 0.2, dir: 1 }, { t: 10.55, type: 'growl' },
    { t: 11.0, type: 'slam' }, { t: 11.0, type: 'womp' }, { t: 11.15, type: 'whoosh', dur: 0.9, dir: -1 },
    { t: 11.6, type: 'pop', pitch: 1.2 }, { t: 11.6, type: 'sparkle' },
    { t: 12.0, type: 'dig' }, { t: 12.35, type: 'dig' }, { t: 12.75, type: 'dig' }, { t: 12.75, type: 'pop', pitch: 0.9 },
    { t: 13.5, type: 'chime' }, { t: 13.5, type: 'sparkle' },
    { t: 14.0, type: 'pop', pitch: 1.0 }, { t: 14.3, type: 'ding' },
    { t: 15.0, type: 'whoosh', dur: 1.0, dir: -1 },
    { t: 16.0, type: 'ding' }, { t: 16.0, type: 'slam' },
    { t: 16.5, type: 'levelup' }, { t: 16.55, type: 'coins', big: true },
    { t: 17.0, type: 'whoosh', dur: 0.2, dir: 1 }, { t: 17.5, type: 'levelup' }, { t: 17.55, type: 'coins', big: true },
    { t: 18.0, type: 'whoosh', dur: 0.2, dir: 1 }, { t: 18.5, type: 'levelup' }, { t: 18.55, type: 'chaching' },
    { t: 19.0, type: 'riser', dur: 2.0 }, { t: 19.0, type: 'pop', pitch: 0.85 },
    ...LOCKS.map((t, k) => ({ t, type: 'lock', n: k })),
    { t: 19.5, type: 'heart' }, { t: 20.0, type: 'heart' }, { t: 20.5, type: 'heart' },
    { t: 20.0, type: 'pop', pitch: 0.8 },
    { t: 21.0, type: 'boom' }, { t: 21.0, type: 'door' },
    { t: 21.45, type: 'roar' }, { t: 21.6, type: 'slam' },
    { t: 22.0, type: 'crash' }, { t: 22.0, type: 'chaching' }, { t: 22.05, type: 'coins', big: true },
    { t: 23.0, type: 'slam' }, { t: 24.0, type: 'slam' }, { t: 25.0, type: 'slam' },
    { t: 23.05, type: 'whoosh', dur: 3.8, dir: 1, soft: true },
    { t: 26.0, type: 'chaching' }, { t: 26.0, type: 'sparkle' },
    { t: 27.0, type: 'boom', soft: true }, { t: 27.0, type: 'sparkle' },
    { t: 27.25, type: 'pop', pitch: 1.0 }, { t: 27.45, type: 'pop', pitch: 1.2 },
    { t: 27.9, type: 'pop', pitch: 1.35 }, { t: 28.4, type: 'button' },
    { t: 29.0, type: 'squeak' }, { t: 29.25, type: 'chime' },
  ].sort((a, b) => a.t - b.t);

  return { FPS, DURATION, BPM, SCENES, FLOORS, WINGS, TAPS, LOCKS, CUES };
})();
