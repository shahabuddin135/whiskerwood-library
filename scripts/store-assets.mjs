// Generates Google Play graphics from the real game:
//   docs/store/feature-graphic.png (1024x500) and docs/store/screenshot-N.png (1080x2160, captioned).
// Usage: npm run build && npm run store-assets   (set CHROME_PATH if Chrome isn't in the default place)
import { preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const OUT = path.resolve('docs/store');
fs.mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));

const server = await preview({ preview: { port: 4199, strictPort: true }, logLevel: 'silent' });
const url = 'http://localhost:4199/';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (fn, ...a) => page.evaluate(fn, ...a);
await page.setViewport({ width: 360, height: 720, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.goto(url + 'icon.svg');
await ev(() => localStorage.clear());

// Build a lively mid-game library.
async function setup({ floors = 5, lvl = 60 } = {}) {
  await page.goto(url, { waitUntil: 'networkidle0' });
  await wait(1200);
  await ev(({ floors, lvl }) => {
    const g = WWL.game; const w = WWL.world; const u = WWL.ui;
    g.s.questIdx = 16; g.s.quest = null; g.ensureQuest();
    g.s.story.seen = ['intro', 'firstBook', 'floor1', 'floor2', 'floor3', 'floor4', 'floor5', 'firstGuest', 'catIntro', 'wormIntro', 'thiefIntro', 'criticIntro'];
    u.story.queue = []; if (u.story.open) u.story.finish();
    for (let i = 1; i < floors; i++) { g.s.coins += 1e18; if (!g.s.rooms[i].built) { g.startBuild(i); g.finishBuildNow(i); } }
    g.s.rooms.forEach((r, i) => { if (!r.built) return; r.lvl = Math.max(10, lvl - i * 6); r.seats = 6 - (i % 2); r.shelves = 4 - (i % 2); r.staff = 8; r.decor = [true, true, i % 3 !== 1, true, i % 2 === 0]; });
    ['nook-0', 'nook-1', 'nook-2', 'story-0', 'story-1', 'cafe-0', 'maps-0'].forEach((id) => { g.s.album[id] = 1; });
    g.s.coins = 4.2e9; g.s.cheese = 86; g.s.rep = 17; g.s.jar = 3.1e7;
    g.markDirty();
    w.events.next = Infinity; w.nextSpecial = Infinity; w.nextPigeon = Infinity;
    w.prefillAll();
    document.querySelectorAll('.modal-back, .book-toast').forEach((m) => m.remove());
  }, { floors, lvl });
  await ev(() => { let n = 0; while (document.querySelector('.modal-close') && n++ < 10) document.querySelector('.modal-close').click(); });
  await wait(600);
}
const scene = async (fn, ms = 2500) => { await ev(fn); await wait(ms); };
const raw = [];
const snap = async (name) => { const p = path.join(OUT, `raw-${name}.png`); await page.screenshot({ path: p }); raw.push(p); return p; };

// 1. story intro
await page.goto(url + 'icon.svg'); await ev(() => localStorage.clear());
await page.goto(url, { waitUntil: 'networkidle0' });
await wait(4200);
await snap('story');

// 2. busy tower with a royal visit
await setup();
await scene(() => { const w = WWL.world; w.timeOverride = 0.3; w.seasonOverride = 1; w.panToRoom(1); const sim = w.sims[1]; sim.spawnSpecial('royal', 'Queen Mozzarella', { fur: '#efe9df', belly: '#fffbf4', crown: true, cape: '#7b2d8b' }, 60); }, 5500);
await snap('royal');

// 3. the cat
await scene(() => { const w = WWL.world; w.panToRoom(0); w.events.startCat(0); w.events.cat.life = 60; }, 2600);
await ev(() => { if (WWL.ui.story.open) WWL.ui.story.finish(); document.getElementById('banner').classList.remove('show'); });
await wait(600);
await snap('cat');
await ev(() => { WWL.world.events.endCat(); });

// 4. cosy close-up at night
await scene(() => { const w = WWL.world; w.timeOverride = 0.8; w.panToRoom(0); w.setZoom(2.1, 180, 360); }, 2600);
await snap('closeup');

// 5. whole tower in winter
await scene(() => { const w = WWL.world; w.timeOverride = 0.72; w.seasonOverride = 3; w.setZoom(0.62); w.cam.y = w.clampCam(-900); }, 2600);
await snap('winter');

// 6. autumn rain + rainbow, book fair
await scene(() => { const w = WWL.world; w.timeOverride = 0.35; w.seasonOverride = 2; w.setZoom(1); w.panToTop(); w.events.startFair(600); const a = w.ambient; a.weather.rainbow = 1; }, 3000);
await ev(() => document.getElementById('banner').classList.remove('show'));
await wait(400);
await snap('fair');

// 7. upgrades + books
await scene(() => { const w = WWL.world; w.events.endFair(); w.seasonOverride = 0; w.timeOverride = 0.25; WWL.ui.openRoom(0); }, 1500);
await snap('upgrades');
await ev(() => WWL.ui.sheet.close());
await wait(500);

await browser.close().catch(() => {});

// Compose captioned screenshots + the feature graphic.
const captions = {
  story: ['A cozy library, run by mice', 'Grandma Mimsy left you her tiny library'],
  royal: ['Welcome royal guests', 'Celebrities, authors and the Queen herself!'],
  cat: ['Shoo the sneaky cat!', 'Tap Baroness Clawdia before she scares the readers'],
  closeup: ['Pinch to zoom in', 'Every little reader has a story'],
  winter: ['Seasons & weather', 'Snow, blossoms, rain and rainbows'],
  fair: ['Build 10 magical floors', 'Festivals, balloons and surprises'],
  upgrades: ['Collect 50 books', 'Upgrade shelves, seats and cosy décor'],
};
const b2 = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p2 = await b2.newPage();
const fontCss = "font-family: 'Fredoka', 'Segoe UI Rounded', system-ui, sans-serif;";
// Embed the bundled fonts so rendering never waits on the network.
const ff = (pkg, file, family, weight) => `@font-face{font-family:${family};font-weight:${weight};src:url(data:font/woff2;base64,${fs.readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`).toString('base64')}) format('woff2')}`;
const FONTS = `<style>${ff('fredoka', 'fredoka-latin-600-normal.woff2', 'Fredoka', 600)}${ff('fredoka', 'fredoka-latin-700-normal.woff2', 'Fredoka', 700)}${ff('kalam', 'kalam-latin-400-normal.woff2', 'Kalam', 400)}</style>`;
let n = 1;
for (const file of raw) {
  const key = path.basename(file).replace(/^raw-|\.png$/g, '');
  const [title, sub] = captions[key];
  const img = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
  await p2.setViewport({ width: 1080, height: 2160, deviceScaleFactor: 1 });
  await p2.setContent(`<html><head>${FONTS}</head>
    <body style="margin:0;width:1080px;height:2160px;background:linear-gradient(#ffd9a8,#f3a879);${fontCss}overflow:hidden;position:relative">
      <div style="position:absolute;top:70px;left:0;right:0;text-align:center;color:#5a3218">
        <div style="font-size:92px;font-weight:700;line-height:1.05">${title}</div>
        <div style="font-size:46px;font-weight:600;margin-top:18px;color:#7a4b2e">${sub}</div>
      </div>
      <img src="${img}" style="position:absolute;left:90px;top:360px;width:900px;height:1800px;border-radius:60px 60px 0 0;box-shadow:0 20px 60px rgba(90,40,10,.35);border:14px solid #fff7e8;border-bottom:0;object-fit:cover;object-position:top">
    </body></html>`, { waitUntil: 'load', timeout: 120000 });
  await p2.evaluate(() => document.fonts.ready);
  await p2.screenshot({ path: path.join(OUT, `screenshot-${n++}.png`) });
}
// Feature graphic
const tower = 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, 'raw-royal.png')).toString('base64');
const icon = 'data:image/svg+xml;base64,' + fs.readFileSync('public/icon.svg').toString('base64');
await p2.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
await p2.setContent(`<html><head>${FONTS}</head>
  <body style="margin:0;width:1024px;height:500px;overflow:hidden;background:linear-gradient(120deg,#ffe3b8,#f6b58b 60%,#e8927a);${fontCss}position:relative">
    <div style="position:absolute;left:56px;top:70px;width:520px;color:#5a3218">
      <img src="${icon}" style="width:120px;height:120px;border-radius:28px;box-shadow:0 8px 20px rgba(90,40,10,.3)">
      <div style="font-size:66px;font-weight:700;line-height:1;margin-top:20px">Whiskerwood<br>Library</div>
      <div style="font-family:Kalam,cursive;font-size:30px;margin-top:14px;color:#7a4b2e">A cozy idle library run by mice 🐭📚</div>
    </div>
    <div style="position:absolute;right:60px;top:40px;width:300px;height:600px;border-radius:40px;overflow:hidden;border:10px solid #fff7e8;box-shadow:0 18px 40px rgba(90,40,10,.35);transform:rotate(4deg)">
      <img src="${tower}" style="width:100%;height:100%;object-fit:cover;object-position:center 40%">
    </div>
  </body></html>`, { waitUntil: 'load', timeout: 120000 });
await p2.evaluate(() => document.fonts.ready);
await p2.screenshot({ path: path.join(OUT, 'feature-graphic.png') });
await b2.close();
raw.forEach((f) => fs.unlinkSync(f));
server.httpServer.close();
console.log('Store assets written to', OUT);
process.exit(0);
