// The songbook: more original pieces for the Web Audio band in music.js, each for a time and place.
// A piece: bpm, beats per bar, its chords ([bass, [chord tones]] as MIDI notes), sections of 16 bars
// (a chord and a melody line of [note, beats] per bar; note 0 is a rest) and a plan of passes
// (which section, which lead instrument, an octave shift, string pad on or off, accompaniment
// 'flow' (rolling arpeggios) or 'waltz' (bass then chords), and an optional doubling voice).

// Moonlit Lullaby: for the night. D major, a slow 3/4 on the music box.
const LULLABY = {
  bpm: 66, beats: 3,
  ch: {
    D: [38, [54, 57, 62]], Bm7: [47, [54, 57, 62]], Gmaj7: [43, [54, 59, 62]], A: [45, [52, 57, 61]],
    DF: [42, [57, 62, 66]], G: [43, [55, 59, 62]], Em7: [40, [55, 59, 62]], A7sus: [45, [55, 57, 62]],
    A7: [45, [55, 57, 61]], Fm7: [42, [52, 57, 61]], Bm: [47, [54, 59, 62]],
  },
  sections: {
    A: {
      chords: ['D', 'Bm7', 'Gmaj7', 'A', 'DF', 'G', 'Em7', 'A7sus', 'D', 'Bm', 'Gmaj7', 'Fm7', 'Em7', 'A7', 'D', 'D'],
      melody: [
        [[74, 2], [73, 1]], [[71, 2], [69, 1]], [[71, 1], [74, 1], [78, 1]], [[76, 3]],
        [[78, 2], [76, 1]], [[74, 1], [71, 1], [74, 1]], [[76, 1.5], [74, 0.5], [71, 1]], [[69, 3]],
        [[74, 2], [73, 1]], [[71, 2], [78, 1]], [[79, 1.5], [78, 0.5], [76, 1]], [[73, 2], [69, 1]],
        [[71, 1], [74, 1], [79, 1]], [[78, 2], [76, 1]], [[74, 3]], [[0, 3]],
      ],
    },
    B: {
      chords: ['Bm', 'Fm7', 'Gmaj7', 'DF', 'Em7', 'A', 'D', 'D', 'Bm', 'Fm7', 'Gmaj7', 'DF', 'Em7', 'A7sus', 'D', 'D'],
      melody: [
        [[78, 2], [81, 1]], [[81, 2], [78, 1]], [[79, 1], [78, 1], [74, 1]], [[78, 3]],
        [[76, 1], [79, 1], [83, 1]], [[81, 2], [76, 1]], [[78, 1.5], [76, 0.5], [74, 1]], [[74, 3]],
        [[71, 1], [74, 1], [78, 1]], [[81, 2], [76, 1]], [[79, 2], [78, 1]], [[76, 1], [74, 1], [78, 1]],
        [[79, 2], [76, 1]], [[74, 2], [73, 1]], [[74, 3]], [[0, 3]],
      ],
    },
  },
  plan: [
    { sec: 'A', lead: 'box', oct: 0, pad: true, acc: 'waltz' },
    { sec: 'B', lead: 'piano', oct: 0, pad: true, acc: 'waltz' },
    { sec: 'A', lead: 'flute', oct: 0, pad: true, acc: 'flow' },
    { sec: 'B', lead: 'box', oct: 0, pad: true, acc: 'waltz' },
  ],
};

// The Deep Stacks: underground. A minor, slow 4/4: a low flute, rolling piano, music-box drips.
const DEEP = {
  bpm: 64, beats: 4, quiet: 0.85,
  ch: {
    Am9: [45, [55, 59, 60, 64]], Fmaj7: [41, [57, 60, 64]], Dm9: [38, [53, 57, 60, 64]], Esus: [40, [57, 59, 64]],
    E7: [40, [56, 59, 62]], Gsus: [43, [55, 60, 62]], Cmaj7: [36, [55, 59, 64]], Bm7b5: [47, [53, 57, 62]],
  },
  sections: {
    A: {
      chords: ['Am9', 'Fmaj7', 'Dm9', 'Esus', 'Am9', 'Fmaj7', 'Gsus', 'E7', 'Am9', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'Am9', 'Dm9', 'Esus', 'E7'],
      melody: [
        [[76, 2], [74, 1], [72, 1]], [[72, 3], [0, 1]], [[69, 1], [72, 1], [76, 2]], [[71, 4]],
        [[76, 2], [79, 1], [76, 1]], [[77, 3], [76, 1]], [[74, 2], [72, 2]], [[71, 3], [0, 1]],
        [[69, 2], [71, 1], [72, 1]], [[76, 4]], [[77, 2], [76, 1], [74, 1]], [[74, 2], [72, 2]],
        [[72, 1], [71, 1], [69, 2]], [[72, 2], [69, 2]], [[71, 4]], [[68, 2], [0, 2]],
      ],
    },
  },
  plan: [
    { sec: 'A', lead: 'flute', oct: -12, pad: true, acc: 'flow' },
    { sec: 'A', lead: 'box', oct: 0, pad: false, acc: 'flow' },
    { sec: 'A', lead: 'piano', oct: 0, pad: true, acc: 'flow' },
  ],
};

// Festival Jig: festival days. G major, a quick and bouncy 3/4.
const JIG = {
  bpm: 132, beats: 3,
  ch: {
    G: [43, [55, 59, 62]], D: [38, [54, 57, 62]], Em: [40, [55, 59, 64]], C: [36, [55, 60, 64]],
    Am7: [45, [55, 60, 64]], D7: [38, [54, 57, 60]], Am: [45, [57, 60, 64]], GB: [47, [55, 59, 62]],
  },
  sections: {
    A: {
      chords: ['G', 'D', 'Em', 'C', 'G', 'Am7', 'D7', 'G', 'C', 'G', 'Am', 'D', 'GB', 'C', 'D7', 'G'],
      melody: [
        [[74, 0.5], [76, 0.5], [78, 0.5], [79, 0.5], [78, 0.5], [76, 0.5]], [[74, 1], [69, 1], [74, 1]],
        [[71, 0.5], [74, 0.5], [79, 1], [76, 1]], [[76, 1.5], [74, 0.5], [72, 1]],
        [[71, 0.5], [72, 0.5], [74, 1], [79, 1]], [[76, 1], [72, 1], [76, 1]],
        [[74, 0.5], [72, 0.5], [71, 0.5], [69, 0.5], [66, 1]], [[67, 2], [0, 1]],
        [[76, 0.5], [78, 0.5], [79, 1], [76, 1]], [[74, 1], [79, 1], [83, 1]],
        [[81, 1.5], [79, 0.5], [76, 1]], [[78, 1], [74, 1], [78, 1]],
        [[79, 0.5], [78, 0.5], [79, 0.5], [81, 0.5], [83, 1]], [[81, 1], [79, 1], [76, 1]],
        [[78, 1], [76, 0.5], [74, 0.5], [72, 1]], [[71, 1], [67, 2]],
      ],
    },
  },
  plan: [
    { sec: 'A', lead: 'box', oct: 0, pad: false, acc: 'waltz' },
    { sec: 'A', lead: 'piano', oct: 0, pad: true, acc: 'flow', double: 'box' },
    { sec: 'A', lead: 'flute', oct: 0, pad: false, acc: 'waltz' },
  ],
};

// Rainy Window: rainy days. E minor, an unhurried 4/4 at the piano.
const RAIN = {
  bpm: 70, beats: 4,
  ch: {
    Em9: [40, [54, 55, 59, 62]], Cmaj7: [36, [55, 59, 64]], Am9: [45, [55, 59, 60, 64]], Bsus: [47, [52, 54, 59]],
    B7: [47, [51, 54, 57]], Gmaj7: [43, [54, 59, 62]], Dadd9: [38, [52, 54, 57]],
  },
  sections: {
    A: {
      chords: ['Em9', 'Cmaj7', 'Am9', 'Bsus', 'Em9', 'Cmaj7', 'Am9', 'B7', 'Gmaj7', 'Dadd9', 'Cmaj7', 'Bsus', 'Em9', 'Cmaj7', 'Am9', 'B7'],
      melody: [
        [[71, 1.5], [74, 0.5], [76, 2]], [[76, 1], [74, 1], [71, 2]], [[72, 2], [71, 1], [69, 1]], [[71, 4]],
        [[71, 1.5], [74, 0.5], [79, 2]], [[78, 1], [76, 1], [74, 2]], [[72, 1], [74, 1], [76, 1], [72, 1]], [[71, 3], [0, 1]],
        [[74, 1.5], [78, 0.5], [79, 2]], [[78, 2], [76, 2]], [[76, 1], [79, 1], [83, 2]], [[81, 2], [78, 2]],
        [[79, 1.5], [78, 0.5], [76, 2]], [[76, 1], [74, 1], [71, 2]], [[72, 2], [74, 1], [72, 1]], [[71, 4]],
      ],
    },
  },
  plan: [
    { sec: 'A', lead: 'piano', oct: 0, pad: true, acc: 'flow' },
    { sec: 'A', lead: 'flute', oct: 0, pad: true, acc: 'flow' },
  ],
};

// Snowfall: winter days. C major, a twinkling 3/4 on the music box.
const SNOW = {
  bpm: 88, beats: 3,
  ch: {
    Cmaj7: [36, [55, 59, 64]], Am7: [45, [55, 60, 64]], Fmaj7: [41, [57, 60, 64]], G: [43, [55, 59, 62]],
    CE: [40, [55, 60, 64]], F: [41, [57, 60, 65]], Dm7: [38, [57, 60, 65]], G7: [43, [53, 59, 62]],
  },
  sections: {
    A: {
      chords: ['Cmaj7', 'Am7', 'Fmaj7', 'G', 'CE', 'F', 'Dm7', 'G7', 'Cmaj7', 'Am7', 'Fmaj7', 'G', 'F', 'G7', 'Cmaj7', 'Cmaj7'],
      melody: [
        [[79, 1], [76, 1], [72, 1]], [[76, 2], [72, 1]], [[77, 1], [76, 1], [72, 1]], [[74, 3]],
        [[79, 1], [84, 1], [83, 1]], [[81, 2], [77, 1]], [[77, 1.5], [76, 0.5], [74, 1]], [[74, 2], [79, 1]],
        [[84, 1], [83, 1], [79, 1]], [[81, 2], [76, 1]], [[77, 1], [81, 1], [84, 1]], [[83, 3]],
        [[81, 1], [77, 1], [81, 1]], [[79, 1.5], [77, 0.5], [74, 1]], [[72, 3]], [[0, 3]],
      ],
    },
  },
  plan: [
    { sec: 'A', lead: 'box', oct: 0, pad: true, acc: 'waltz' },
    { sec: 'A', lead: 'piano', oct: 0, pad: false, acc: 'flow', double: 'box' },
  ],
};

export const SONGS = { night: LULLABY, deep: DEEP, festival: JIG, rain: RAIN, winter: SNOW };
export const SONG_NAMES = { day: 'Meadow Waltz', night: 'Moonlit Lullaby', deep: 'The Deep Stacks', festival: 'Festival Jig', rain: 'Rainy Window', winter: 'Snowfall' };
