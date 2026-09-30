// Renders the Whiskerwood Library video ad from the real game.
//   node render.mjs                  full ad -> out/whiskerwood-ad.mp4 (+ out/soundtrack.wav, out/stills/)
//   node render.mjs --preview        stills every 0.5 s only (quick check, no video)
//   node render.mjs --every 0.25     stills spacing for --preview
//   node render.mjs --audio-only     re-render just the soundtrack into the existing video
//   node render.mjs --ad cozy        the slow, narrated storybook ad (cozy/) -> out/whiskerwood-cozy-ad.mp4
// Needs the game built first (npm run build in the project root) and Google Chrome.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import ffmpegPath from 'ffmpeg-static';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '..', 'dist');
const OUT = path.join(HERE, 'out');
const args = process.argv.slice(2);
const PREVIEW = args.includes('--preview');
const AUDIO_ONLY = args.includes('--audio-only');
const AD = args.includes('--ad') ? args[args.indexOf('--ad') + 1] : 'fast';
const FILES = AD === 'cozy' ? ['cozy/copy.js', 'overlay.js', 'cozy/timeline.js', 'cozy/audio.js', 'cozy/director.js'] : ['copy.js', 'timeline.js', 'audio.js', 'overlay.js', 'director.js'];
const NAME = AD === 'cozy' ? 'whiskerwood-cozy-ad' : 'whiskerwood-ad';
const STILLS = path.join(HERE, 'out', AD === 'cozy' ? 'stills-cozy' : 'stills');
// the soundtrack goes out at streaming loudness, with true peaks safely below 0 dB
const AUDIO_OUT = ['-af', 'alimiter=limit=0.84:level=disabled', '-c:a', 'aac', '-b:a', '192k'];
const EVERY = +(args[args.indexOf('--every') + 1] || 0.5) || 0.5;
const AT = args.includes('--at') ? +args[args.indexOf('--at') + 1] : 0; // offset of the first preview still
const CLEAN = args.includes('--clean'); // hide the ad's text and effects: pure game frames (for the website)
const TIMES = args.includes('--times') ? args[args.indexOf('--times') + 1].split(',').map(Number) : null; // stills at these seconds
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 4190;

if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('Build the game first: npm run build (in the project root).'); process.exit(1); }
fs.mkdirSync(STILLS, { recursive: true });

// --- a tiny static server for the built game ---
const TYPES = { '.wav': 'audio/wav', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  // /ad/... serves this folder (the narration clips); everything else is the built game
  const root = url.startsWith('/ad/') ? HERE : DIST;
  const p = path.join(root, (url.startsWith('/ad/') ? url.slice(3) : url).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

// --- the game in a phone-shaped window, on a virtual clock ---
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 540, height: 960, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/404|favicon/.test(m.text())) errors.push(m.text()); });
await page.evaluateOnNewDocument(() => {
  // the same "random" every time, so every render of the ad is identical
  let seed = 20260930;
  Math.random = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // a clock that only moves when the ad steps it
  const RealDate = Date;
  const C = { base: new RealDate('2026-06-10T10:00:00').getTime(), t: 0 };
  window.__VCLOCK = C;
  performance.now = () => C.t;
  class VDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(C.base + C.t); } static now() { return C.base + C.t; } }
  window.Date = VDate;
  // the game's own frame loop never runs: the director draws each frame
  window.requestAnimationFrame = () => 0; window.cancelAnimationFrame = () => {};
});
await page.goto(`http://127.0.0.1:${PORT}/icon.svg`);
await page.evaluate(() => localStorage.clear());
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load' });
await page.waitForFunction(() => window.WWL && document.fonts.status === 'loaded', { timeout: 30000 });
await page.addStyleTag({ content: 'body > *:not(#world):not(#adfx) { display: none !important; } body { background: #000; }' });
const narr = path.join(HERE, 'cozy', 'narration', 'lines.json');
if (AD === 'cozy' && fs.existsSync(narr)) await page.addScriptTag({ content: `window.AD_NARRATION = ${fs.readFileSync(narr, 'utf8')};` });
for (const f of FILES) {
  if (fs.existsSync(path.join(HERE, f))) await page.addScriptTag({ content: fs.readFileSync(path.join(HERE, f), 'utf8') });
}
await page.evaluate(() => AdDirector.setup());
if (CLEAN) await page.addStyleTag({ content: '#adfx { display: none !important; }' });
const total = await page.evaluate(() => AdDirector.frames());
const FPS = await page.evaluate(() => AD_TIMELINE.FPS);
const t0 = Date.now();
// the soundtrack (the cozy ad also mixes in its narration clips)
const renderAudio = () => AdAudio.render({
  duration: AD_TIMELINE.DURATION, cues: AD_TIMELINE.CUES, sampleBase: '/audio/',
  voice: AD_TIMELINE.VOICE || [], narration: Object.fromEntries(((window.AD_NARRATION || {}).lines || []).map((l) => [l.id, l])), voiceBase: '/ad/cozy/narration/',
});

if (AUDIO_ONLY) {
  const wavB64 = await page.evaluate(renderAudio);
  const wav = path.join(OUT, `${NAME}.wav`); fs.writeFileSync(wav, Buffer.from(wavB64, 'base64'));
  const mp4 = path.join(OUT, `${NAME}.mp4`); const tmp = path.join(OUT, 'remux.mp4');
  const ff = spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-i', mp4, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', ...AUDIO_OUT, '-shortest', '-movflags', '+faststart', tmp], { stdio: 'inherit' });
  const code = await new Promise((r) => ff.on('close', r));
  if (code === 0) fs.renameSync(tmp, mp4);
  console.log(`soundtrack swapped into ${mp4}`);
} else if (PREVIEW) {
  const step = Math.max(1, Math.round(EVERY * FPS));
  for (let i = 0; i < total; i++) {
    await page.evaluate((i) => AdDirector.frame(i), i);
    if (TIMES) { const hit = TIMES.find((t) => Math.round(t * FPS) === i); if (hit != null) await page.screenshot({ path: path.join(STILLS, `${CLEAN ? 'clean' : 't'}-${hit}.jpg`), type: 'jpeg', quality: 92 }); continue; }
    if ((i - Math.round(AT * FPS)) % step === 0) await page.screenshot({ path: path.join(STILLS, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 85 });
  }
  console.log(`preview: ${Math.ceil(total / step)} stills in ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${path.relative(HERE, STILLS)}`);
} else {
  // the soundtrack first
  const wavB64 = await page.evaluate(renderAudio);
  const wav = path.join(OUT, `${NAME}.wav`); fs.writeFileSync(wav, Buffer.from(wavB64, 'base64'));
  console.log(`soundtrack: ${(fs.statSync(wav).size / 1e6).toFixed(1)} MB`);
  // then every frame, straight into the encoder
  const mp4 = path.join(OUT, `${NAME}.mp4`);
  const ff = spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS),
    ...AUDIO_OUT, '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((r) => ff.on('close', r));
  for (let i = 0; i < total; i++) {
    await page.evaluate((i) => AdDirector.frame(i), i);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % FPS === 0) { fs.writeFileSync(path.join(STILLS, `s${String(i / FPS).padStart(2, '0')}.jpg`), buf); process.stdout.write(`\r${i}/${total} frames`); }
  }
  ff.stdin.end(); const code = await done;
  console.log(`\nvideo: ${code === 0 ? mp4 : 'ffmpeg failed'} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
console.log('errors:', errors.length ? errors.slice(0, 5).join(' | ') : 'none');
await browser.close(); server.close();
