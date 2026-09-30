# Whiskerwood Library: video ad

A 30-second vertical (1080 × 1920, 30 fps) ad, filmed from the **real game**, with its own
motion graphics and an original soundtrack. Good for YouTube Shorts, TikTok, Instagram Reels
and ad networks.

**Output:** `out/whiskerwood-ad.mp4`. You also get `out/poster.png` (the end card, handy as a
thumbnail), `out/soundtrack.wav` and one still per second in `out/stills/`.

## The ad, beat by beat (120 BPM: every cut lands on the music)

| Time | Scene |
|---|---|
| 0–2 s | **Hook:** "One tiny mouse library…". A finger taps, coins fly into the counter, and each tap plays a note. |
| 2–6 s | **BUILD IT UP!** Floors stack up on the beat, each one a rising note, and the camera climbs the tower. |
| 6–9 s | **…AND OUT!** The café, hall, press and museum pop up beside it. |
| 9–11 s | Quick peeks inside: **CAFÉS! DANCE CLUBS! PRINTING! DINOSAURS!** |
| 11–14 s | **…AND DOWN!** The camera dives past a T. rex skeleton, the mole crew digs, and a secret library is restored. |
| 14–16 s | **HOP IN THE LIFT…** The lift house on the lawn, then a dive down the shaft. |
| 16–19 s | **WELCOME TO MOLE CITY!** The pie shop, cinema and mud spa level up on camera. |
| 19–21 s | **8 SECRET HALLS… 1 SLEEPING DRAGON.** The door's locks light up one by one as the tension builds. |
| 21–23 s | Boom: the door opens. **WAKE THE DRAGON! ×2 COINS FOREVER!** |
| 23–27 s | **BUILD. DIG. DISCOVER.** A pull-out from the dragon to the whole city at dusk. |
| 27–30 s | End card: app icon, title, "Grow a cozy mouse city!", **PLAY FREE** and "on Google Play". |

## Render it

```bash
# once: build the game (project root) and install the encoder (this folder)
cd .. && npm run build && cd ad && npm install

node render.mjs                # the full ad (about 6 minutes)
node render.mjs --preview      # stills every 0.5 s only, to check framing (about 2 minutes)
node render.mjs --audio-only   # re-mix just the soundtrack into the existing video
```

You need Google Chrome installed. Set `CHROME=/path/to/chrome` if it isn't in the default Windows
location. Every render comes out the same, because the randomness is seeded and the game runs on
a virtual clock.

## Change it

- **Words:** edit `copy.js`. Every headline, sticker and the end-card text is there.
- **Timing:** `timeline.js` has the scene times, the beats the floors and wings pop on, and every
  sound cue.
- **Camera and game state:** `director.js` holds each scene's camera path and what the game shows
  (floors built, shop levels, the dragon's door).
- **Look:** `overlay.js` draws the text style, coins, sparkles, confetti, the finger and the
  end card.
- **Music and sound effects:** `audio.js` synthesises the tune (C–G–Am–F, 120 BPM) and the
  effects with Web Audio, mixed with the game's own sounds.

## How it works

`render.mjs` serves the built game and opens it in headless Chrome at phone size, then:
- freezes the game's clock;
- hides the game's HUD;
- lets `director.js` step the game one frame at a time, setting up each scene and moving the camera;
- draws `overlay.js` on top;
- pipes every frame into ffmpeg.

The soundtrack is rendered offline from the same `timeline.js`, so picture and sound stay in sync.
The audio is mastered to about −13 LUFS with peaks below −1 dB.

## Credits and licences

- Game art and animation: the game itself.
- Music and most sound effects: original, synthesised in `audio.js`.
- Click, coin, hammer, sparkle and door sounds: [Kenney](https://kenney.nl) (CC0), from `public/audio/`.
- Font: Fredoka (SIL Open Font License), bundled with the game.

"Google Play" is a trademark of Google LLC. Keep the end-card wording as plain text ("on Google
Play"), or swap in Google's official badge following their
[badge guidelines](https://play.google.com/intl/en_us/badges/) once the game
is live.

---

# The cozy ad: "Once upon a time…"

A second 30-second vertical ad (`out/whiskerwood-cozy-ad.mp4`): slow, warm and narrated, like a
bedtime storybook. It covers the story, all four seasons and the festivals, with gentle dissolves
instead of cuts, handwritten subtitles, and a music-box waltz that dips whenever the narrator
speaks.

| Time | Picture | Narration |
|---|---|---|
| 0–5 s | A storybook page turns to show a tiny two-floor library at a spring sunrise, with petals drifting | "Once upon a time, a little mouse opened a little library." |
| 5–10 s | Inside the Cozy Nook (Pip: "Welcome in! Mind the bookworm."), then the library grows floor by floor | "Readers came, and it grew, one cozy floor at a time." |
| 10–17 s | The four seasons, each with its festival: Spring Egg Hunt, Summer Reading Festival, Spooky Stories Week and Christmas in the snow | "Through spring blossoms… summer sun… autumn leaves… and winter snow…" |
| 17–21 s | Lunar New Year at night (sky lanterns and fireworks), then Diwali lamps and rangoli | "And there was always something to celebrate." |
| 21–27 s | Down through Mole City to Umber, asleep. He wakes, a mouse reads to him, and he says "Again! The one with the socks." | "But deep below, a lonely dragon was waiting for a bedtime story." |
| 27–30 s | The storybook cover: icon, title, "Your story is waiting.", **Play free**, "on Google Play" | "Whiskerwood Library. Your story is waiting." |

## Narration

The voice is [Kokoro](https://github.com/thewh1teagle/kokoro-onnx), an open text-to-speech
model (Apache 2.0) that runs on your own computer, using the `af_heart` voice at storybook pace.
The finished clips are in `cozy/narration/`, so re-rendering the video doesn't need Kokoro. To
change what the narrator says:

```bash
pip install kokoro-onnx soundfile
# once: put kokoro-v1.0.onnx and voices-v1.0.bin into cozy/tts/, from
# https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
cd cozy && python narrate.py        # edit LINES in narrate.py first; VOICE=... and SPEED=... also work
```

Line 3 is spoken as one sentence, then cut into its four season phrases (`SPLITS` in
`narrate.py`) so each season gets its own moment. If you change a line's length, move its start
time in `cozy/timeline.js` (`VOICE`) so it still fits.

## Render and change it

```bash
node render.mjs --ad cozy             # the full cozy ad (about 5 minutes)
node render.mjs --ad cozy --preview   # stills every 0.5 s into out/stills-cozy/
```

- **Words on screen** (bubbles, festival names, end card): `cozy/copy.js`.
- **Shots, narration timing and sound cues**: `cozy/timeline.js`.
- **Camera, seasons, festivals and time of day for each shot**: `LOOK` and `camera()` in `cozy/director.js`.
- **Music and sound effects** (waltz, birdsong, fire, wind, sleigh bells, fireworks, dragon snores): `cozy/audio.js`.

The mix is mastered like the first ad: about −13 LUFS, with peaks at −1 dB. I checked the
finished video by running Whisper speech recognition on it, and it transcribed every narration
line word for word over the music.
