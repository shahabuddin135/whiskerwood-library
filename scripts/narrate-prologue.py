"""Voices the storybook prologue (src/ui/prologue.js) with Kokoro, the open text-to-speech model
the cozy ad uses, and writes public/audio/prologue/p1.mp3 ... plus lines.json (text + seconds).

    pip install kokoro-onnx soundfile
    # model files (once) into ad/cozy/tts/: kokoro-v1.0.onnx and voices-v1.0.bin
    python scripts/narrate-prologue.py

Keep LINES in step with PAGES in src/ui/prologue.js (the page text is what's read aloud).
"""
import json
import os
import subprocess
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TTS = os.path.join(ROOT, 'ad', 'cozy', 'tts')
OUT = os.path.join(ROOT, 'public', 'audio', 'prologue')
FFMPEG = os.path.join(ROOT, 'ad', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
VOICE = 'af_heart'  # the warm storyteller from the cozy ad
SPEED = 0.8

LINES = [
    'Once upon a time, at the edge of an old meadow, there stood a very small library.',
    'It belonged to Grandma Mimsy. Every evening, she lit the lamp, and read stories to every mouse in the meadow.',
    'But the years went by. The lamp grew dim, dust settled on the shelves, and one by one, the readers stopped coming.',
    'Then, one rainy morning, a pigeon brought a letter. It had your name on it.',
    'Dear little one. The library is yours now. Light the lamp, open the doors, and fill it with stories again. With all my love, Grandma Mimsy.',
    'Tucked inside was a small brass key, shaped like a quill. So you packed your bag, and set off for the meadow.',
]


def trim(x, sr, thresh=0.01, pad=0.06):
    idx = np.where(np.abs(x) > thresh)[0]
    if not len(idx):
        return x
    return x[max(0, idx[0] - int(pad * sr)):min(len(x), idx[-1] + int(pad * sr))]


def main():
    os.makedirs(OUT, exist_ok=True)
    k = Kokoro(os.path.join(TTS, 'kokoro-v1.0.onnx'), os.path.join(TTS, 'voices-v1.0.bin'))
    meta = []
    for n, text in enumerate(LINES, 1):
        x, sr = k.create(text, voice=VOICE, speed=SPEED, lang='en-us')
        x = trim(np.asarray(x, dtype=np.float32), sr)
        peak = float(np.max(np.abs(x))) or 1.0
        x = x * (0.89 / peak)  # even loudness from page to page
        wav = os.path.join(OUT, f'p{n}.wav')
        sf.write(wav, x, sr)
        mp3 = os.path.join(OUT, f'p{n}.mp3')
        subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', '24000', '-b:a', '48k', mp3], check=True)
        os.remove(wav)
        meta.append({'text': text, 'sec': round(len(x) / sr, 2)})
        print(f'p{n}: {len(x) / sr:.1f}s')
    with open(os.path.join(OUT, 'lines.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=1)


if __name__ == '__main__':
    main()
