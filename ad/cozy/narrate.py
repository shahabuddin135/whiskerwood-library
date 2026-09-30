"""Voices the cozy ad's narration with Kokoro (an open, Apache-2.0 text-to-speech model that runs
locally). Writes narration/line1.wav ... and narration/lines.json (text + duration of each line).

    pip install kokoro-onnx soundfile
    # model files (once) into cozy/tts/: kokoro-v1.0.onnx and voices-v1.0.bin from
    # https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
    python narrate.py
"""
import json
import os
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.environ.get('VOICE', 'af_heart')  # warm, natural; Kokoro's best-rated voice
SPEED = float(os.environ.get('SPEED', '0.82'))  # a touch slower than normal: storybook pace

# (text, speed multiplier): every line of the ad, in order
LINES = [
    ('Once upon a time, a little mouse opened a little library.', 1.0),
    ('Readers came, and it grew, one cozy floor at a time.', 1.0),
    ('Through spring blossoms, summer sun, autumn leaves, and winter snow,', 1.0),
    ('And there was always something to celebrate.', 1.0),
    ('But deep below, a lonely dragon was waiting for a bedtime story.', 1.0),
    ('Whiskerwood Library. Your story is waiting.', 1.0),
]


# Line 3 is spoken as one sentence (natural flow), then cut into its four phrases so each season
# gets its own moment on screen. Cut points (seconds) sit in the pauses between phrases; each is
# nudged to the quietest spot within 0.12 s. Re-measure with Whisper word timings if the text changes.
SPLITS = {3: ([1.40, 2.27, 3.18], ['Through spring blossoms,', 'summer sun,', 'autumn leaves,', 'and winter snow,'])}


def split(x, sr, points):
    win = int(0.03 * sr); cuts = []
    for p in points:
        best = None
        for c in range(int((p - 0.12) * sr), int((p + 0.12) * sr), int(0.005 * sr)):
            e = float(np.mean(x[c - win // 2:c + win // 2] ** 2))
            if best is None or e < best[0]: best = (e, c)
        cuts.append(best[1])
    parts = []; edges = [0] + cuts + [len(x)]
    fade = int(0.012 * sr)
    for a, b in zip(edges, edges[1:]):
        seg = trim(x[a:b].copy(), sr)
        seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
        parts.append(seg)
    return parts


def trim(x, sr, thresh=0.01, pad=0.04):
    """Cut leading and trailing silence, keeping a short breath of padding."""
    idx = np.where(np.abs(x) > thresh)[0]
    if not len(idx):
        return x
    a = max(0, idx[0] - int(pad * sr)); b = min(len(x), idx[-1] + int(pad * sr))
    return x[a:b]


def main():
    k = Kokoro(os.path.join(HERE, 'tts', 'kokoro-v1.0.onnx'), os.path.join(HERE, 'tts', 'voices-v1.0.bin'))
    out = os.path.join(HERE, 'narration'); os.makedirs(out, exist_ok=True)
    meta = []
    for i, (text, sp) in enumerate(LINES, 1):
        audio, sr = k.create(text, voice=VOICE, speed=SPEED * sp, lang='en-us')
        audio = trim(np.asarray(audio, dtype=np.float32), sr)
        peak = float(np.max(np.abs(audio)))
        if peak > 0: audio = audio * (0.89 / peak)  # even level across lines
        name = f'line{i}.wav'
        sf.write(os.path.join(out, name), audio, sr, subtype='PCM_16')
        meta.append({'id': f'line{i}', 'file': name, 'text': text, 'duration': round(len(audio) / sr, 3)})
        print(f'{name}: {len(audio) / sr:5.2f} s  {text}')
        if i in SPLITS:
            points, texts = SPLITS[i]
            for part, ptext, tag in zip(split(audio, sr, points), texts, 'abcd'):
                pname = f'line{i}{tag}.wav'; sf.write(os.path.join(out, pname), part, sr, subtype='PCM_16')
                meta.append({'id': f'line{i}{tag}', 'file': pname, 'text': ptext, 'duration': round(len(part) / sr, 3)})
                print(f'  {pname}: {len(part) / sr:5.2f} s  {ptext}')
    with open(os.path.join(out, 'lines.json'), 'w', encoding='utf-8') as f:
        json.dump({'voice': VOICE, 'speed': SPEED, 'lines': meta}, f, indent=2)


if __name__ == '__main__':
    main()
