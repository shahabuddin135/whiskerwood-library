"""Makes the website's images and videos from the game's store art and the two video ads.
Run after rendering the ads (ad/README.md) and their clean stills:

    cd ad && node render.mjs --ad cozy --preview --clean --times 2.6,6.4,9.6,10.9,12.8,14.6,16.5,18.3,20,21.7,26.2
    cd ad && node render.mjs --preview --clean --times 7.9,12.6,17.8,24.6
    python site/make-media.py

Needs Pillow; uses the ffmpeg that ad/ installs. Writes site/img/ and site/media/ (committed, so the
Vercel build needs neither).
"""
import os
import subprocess
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'site', 'img'); MEDIA = os.path.join(ROOT, 'site', 'media')
COZY = os.path.join(ROOT, 'ad', 'out', 'stills-cozy'); FAST = os.path.join(ROOT, 'ad', 'out', 'stills')
FFMPEG = os.path.join(ROOT, 'ad', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
os.makedirs(IMG, exist_ok=True); os.makedirs(MEDIA, exist_ok=True)


def save(im, name, size, crop=None, q=82):
    """crop: (left, top, right, bottom) as fractions of the picture, then resized to size."""
    if crop:
        w, h = im.size; im = im.crop((int(crop[0] * w), int(crop[1] * h), int(crop[2] * w), int(crop[3] * h)))
    im = im.convert('RGB').resize(size, Image.LANCZOS)
    im.save(os.path.join(IMG, name), 'JPEG', quality=q, optimize=True, progressive=True)


# feature pictures (portrait 3:4, from the clean game frames)
PORTRAIT = (660, 880)
FEATURES = [
    ('library.jpg', COZY, 'clean-2.6.jpg', (0.0, 0.1, 1.0, 0.85)),
    ('nook.jpg', COZY, 'clean-6.4.jpg', (0.0, 0.1, 1.0, 0.85)),
    ('tower.jpg', COZY, 'clean-9.6.jpg', (0.0, 0.0, 1.0, 0.75)),
    ('wings.jpg', FAST, 'clean-7.9.jpg', (0.0, 0.25, 1.0, 1.0)),
    ('dig.jpg', FAST, 'clean-12.6.jpg', (0.0, 0.08, 1.0, 0.83)),
    ('mole-city.jpg', FAST, 'clean-17.8.jpg', (0.0, 0.2, 1.0, 0.95)),
    ('dragon.jpg', COZY, 'clean-26.2.jpg', (0.0, 0.1, 1.0, 0.85)),
]
for name, d, f, crop in FEATURES:
    save(Image.open(os.path.join(d, f)), name, PORTRAIT, crop)

# seasons and festivals (square tiles)
TILES = [('spring.jpg', 'clean-10.9.jpg'), ('summer.jpg', 'clean-12.8.jpg'), ('autumn.jpg', 'clean-14.6.jpg'), ('winter.jpg', 'clean-16.5.jpg'),
         ('lunar.jpg', 'clean-18.3.jpg'), ('diwali.jpg', 'clean-20.jpg')]
for name, f in TILES:
    save(Image.open(os.path.join(COZY, f)), name, (560, 560), (0.0, 0.3, 1.0, 0.8625))

# store screenshots for the gallery, the social preview image, and the app icon
STORE = os.path.join(ROOT, 'docs', 'store')
for k in range(1, 8):
    p = os.path.join(STORE, f'screenshot-{k}.png')
    if os.path.exists(p): save(Image.open(p), f'shot-{k}.jpg', (450, 900), q=80)
fg = Image.open(os.path.join(STORE, 'feature-graphic.png')).convert('RGB')
og = Image.new('RGB', (1200, 630), fg.getpixel((4, 4))); f2 = fg.resize((1200, int(500 * 1200 / 1024)), Image.LANCZOS)
og.paste(f2, (0, (630 - f2.height) // 2)); og.save(os.path.join(IMG, 'og.jpg'), 'JPEG', quality=85, optimize=True)
Image.open(os.path.join(ROOT, 'public', 'icon-512.png')).convert('RGBA').resize((256, 256), Image.LANCZOS).save(os.path.join(IMG, 'icon-256.png'), optimize=True)


# the two ads, made small enough for the web (720 x 1280), with a poster frame each
def web_video(src, name, poster_t):
    if not os.path.exists(src): print('missing', src); return
    out = os.path.join(MEDIA, name)
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', src, '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28',
                    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', out], check=True)
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-ss', str(poster_t), '-i', src, '-frames:v', '1', '-vf', 'scale=720:1280', '-q:v', '4',
                    os.path.join(MEDIA, name.replace('.mp4', '.jpg'))], check=True)
    print(name, round(os.path.getsize(out) / 1e6, 1), 'MB')


web_video(os.path.join(ROOT, 'ad', 'out', 'whiskerwood-cozy-ad.mp4'), 'story-trailer.mp4', 0.2)
web_video(os.path.join(ROOT, 'ad', 'out', 'whiskerwood-ad.mp4'), 'fun-trailer.mp4', 1.2)
print('images:', len(os.listdir(IMG)))
