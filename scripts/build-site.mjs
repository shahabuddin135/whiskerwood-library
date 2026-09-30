// Builds the website for Vercel into site-dist/:
//   /            landing page          /privacy, /terms, 404
//   /play/       the game itself (web build: no ads, see src/ads/ads.js)
//   /app-ads.txt AdMob's seller file    /robots.txt, /sitemap.xml
// Settings live in site/site.config.json. Usage: npm run build:site
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const OUT = path.join(ROOT, 'site-dist');
const cfg = JSON.parse(fs.readFileSync(path.join(SITE, 'site.config.json'), 'utf8'));
const siteUrl = cfg.siteUrl.replace(/\/$/, '');
const playUrl = `https://play.google.com/store/apps/details?id=${cfg.packageId}`;
const warnings = [];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 1. the game, built for the web into /play/ (relative paths, no ads)
process.env.VITE_SITE = '1';
if (cfg.playStoreLive) process.env.VITE_PLAY_URL = playUrl;
await build({ root: ROOT, configFile: path.join(ROOT, 'vite.config.js'), logLevel: 'warn', build: { outDir: path.join(OUT, 'play'), emptyOutDir: true } });

// 2. static files: styles, images, trailers, fonts, icons
const copy = (from, to) => fs.cpSync(from, to, { recursive: true });
copy(path.join(SITE, 'style.css'), path.join(OUT, 'style.css'));
copy(path.join(SITE, 'img'), path.join(OUT, 'img'));
copy(path.join(SITE, 'media'), path.join(OUT, 'media'));
fs.mkdirSync(path.join(OUT, 'fonts'));
const font = (pkg, file, to) => copy(path.join(ROOT, 'node_modules', '@fontsource', pkg, 'files', file), path.join(OUT, 'fonts', to));
font('fredoka', 'fredoka-latin-400-normal.woff2', 'fredoka-400.woff2');
font('fredoka', 'fredoka-latin-600-normal.woff2', 'fredoka-600.woff2');
font('fredoka', 'fredoka-latin-700-normal.woff2', 'fredoka-700.woff2');
font('kalam', 'kalam-latin-400-normal.woff2', 'kalam-400.woff2');
for (const f of ['icon.svg', 'icon-192.png', 'icon-512.png']) copy(path.join(ROOT, 'public', f), path.join(OUT, f));
copy(path.join(SITE, 'favicon.ico'), path.join(OUT, 'favicon.ico'));
copy(path.join(SITE, 'favicon.ico'), path.join(OUT, 'play', 'favicon.ico'));

// 3. the pages, with the shared head, header and footer filled in
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const playCta = cfg.playStoreLive
  ? `<a class="btn btn-gold" href="${playUrl}" rel="noopener"><span aria-hidden="true">▶</span><span class="two"><small>Get it on</small>Google Play</span></a>`
  : '<span class="btn btn-soft" aria-disabled="true"><span class="two"><small>Coming soon to</small>Google Play</span></span>';
const HEAD = `  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#f6c9a0" />
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <link rel="icon" href="/icon-192.png" sizes="192x192" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <link rel="preload" href="/fonts/fredoka-700.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/style.css" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${esc(cfg.name)}" />
  <meta property="og:title" content="${esc(cfg.name)}: a cozy idle game" />
  <meta property="og:description" content="Grow a tiny mouse library into a whole city, season by season, down to a dragon waiting for a bedtime story." />
  <meta property="og:image" content="${siteUrl}/img/og.jpg" />
  <meta name="twitter:card" content="summary_large_image" />`;
const HEADER = `<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
  <a class="brand" href="/"><img src="/img/icon-256.png" alt="" width="40" height="40" />${esc(cfg.name)}</a>
  <nav class="nav" aria-label="Main"><a href="/#features">Features</a><a href="/#seasons">Seasons</a><a href="/#trailers">Trailers</a><a href="/#story">Story</a><a href="/#faq">FAQ</a></nav>
  <a class="btn btn-gold btn-sm" href="/play/">▶ Play free</a>
</div></header>`;
const FOOTER = `<footer class="site-foot"><div class="wrap">
  <div><b>${esc(cfg.name)}</b><br />A cozy idle game by ${esc(cfg.developer)}.</div>
  <nav aria-label="Footer"><a href="/play/">Play</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Use</a><a href="mailto:${esc(cfg.supportEmail)}">Contact</a></nav>
  <div class="fine">© ${new Date().getFullYear()} ${esc(cfg.developer)}. Sound effects by Kenney (CC0). Fonts: Fredoka and Kalam (SIL OFL). Google Play is a trademark of Google LLC.</div>
</div></footer>`;
const R = (() => { let a = 7; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
const PETALS = Array.from({ length: 14 }, () => `<i style="left:${(R() * 100).toFixed(1)}%;animation-duration:${(9 + R() * 9).toFixed(1)}s;animation-delay:-${(R() * 18).toFixed(1)}s;transform:scale(${(0.6 + R() * 0.8).toFixed(2)})"></i>`).join('');
const SHOTS = fs.readdirSync(path.join(SITE, 'img')).filter((f) => /^shot-\d+\.jpg$/.test(f)).sort()
  .map((f, k) => `<img src="/img/${f}" alt="Screenshot ${k + 1}" width="450" height="900" loading="lazy" />`).join('');
const vars = { HEAD, HEADER, FOOTER, PETALS, SHOTS, PLAY_CTA: playCta, NAME: esc(cfg.name), SITE_URL: siteUrl, DEVELOPER: esc(cfg.developer), EMAIL: esc(cfg.supportEmail), POLICY_DATE: esc(cfg.policyDate) };
for (const page of ['index.html', 'privacy.html', 'terms.html', '404.html']) {
  let html = fs.readFileSync(path.join(SITE, page), 'utf8');
  for (let k = 0; k < 2; k++) html = html.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in vars ? vars[key] : m)); // twice: the head uses NAME too
  if (/\{\{\w+\}\}/.test(html)) warnings.push(`${page} still has an unfilled {{placeholder}}`);
  fs.writeFileSync(path.join(OUT, page), html);
}

// 4. app-ads.txt: AdMob checks this file on your developer website to authorise your ads.
// The publisher id comes from site.config.json, or from the AdMob app id in src/config.js.
const appId = (fs.readFileSync(path.join(ROOT, 'src', 'config.js'), 'utf8').match(/appId:\s*'ca-app-pub-(\d+)~/) || [])[1];
const pub = (cfg.admobPublisherId || '').replace(/^pub-/, '') || (appId && appId !== '3940256099942544' ? appId : '');
fs.writeFileSync(path.join(OUT, 'app-ads.txt'), pub
  ? `google.com, pub-${pub}, DIRECT, f08c47fec0942fa0\n`
  : '# Add your AdMob publisher id: set "admobPublisherId" in site/site.config.json (or your real AdMob app id in src/config.js),\n# then redeploy. The line will look like: google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n');
if (!pub) warnings.push('app-ads.txt has no publisher id yet (Google test ids are in src/config.js)');

// 5. robots.txt and sitemap.xml
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', '/play/', '/privacy', '/terms'].map((p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);

// 6. reminders
if (/YOUR/.test(cfg.developer)) warnings.push('set "developer" in site/site.config.json');
if (/YOUR|example\.com/.test(cfg.supportEmail)) warnings.push('set "supportEmail" in site/site.config.json');
const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((a, e) => a + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`\nsite-dist ready: ${(size(OUT) / 1e6).toFixed(1)} MB · ${siteUrl}`);
for (const w of warnings) console.warn(`⚠️  ${w}`);
