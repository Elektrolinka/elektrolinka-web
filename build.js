#!/usr/bin/env node
// Generátor statického webu elektrolinka.cz
//   node build.js           → vygeneruje dist/
//   node build.js --watch   → generuje znovu při změně src/, content/, config.json
// Konfiguraci lze přepsat proměnnými prostředí: MAKE_WEBHOOK_URL, SITE_URL.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const img = require('./src/lib/images');
const seo = require('./src/lib/seo');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

// Pořadí CSS souborů ve výsledném site.css
const CSS = ['tokens.css', 'base.css', 'components.css', 'home.css', 'pages.css', 'form.css'];
const JS = ['main.js', 'form.js', 'lightbox.js'];
const FONTS = ['big-shoulders-display-800-cs.woff2', 'manrope-var-cs.woff2'];

function clearRequireCache() {
  for (const k of Object.keys(require.cache)) if (k.includes(`${path.sep}src${path.sep}`) && !k.includes('images.js')) delete require.cache[k];
}

function copyDir(from, to, filter = () => true) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b, filter);
    else if (filter(e.name)) fs.copyFileSync(a, b);
  }
}

const minifyCss = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();

const hash = (s) => crypto.createHash('md5').update(s).digest('hex').slice(0, 8);

async function build() {
  const t0 = Date.now();
  clearRequireCache();
  const config = readJSON('config.json');
  if (process.env.MAKE_WEBHOOK_URL) config.makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (process.env.SITE_URL) config.siteUrl = process.env.SITE_URL;
  const site = readJSON('content/site.json');
  const services = readJSON('content/services.json');

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // --- statické soubory ---
  copyDir(path.join(ROOT, 'assets', 'vendor'), path.join(DIST, 'assets', 'vendor'));
  copyDir(path.join(ROOT, 'assets', 'img', 'brand'), path.join(DIST, 'assets', 'img', 'brand'));
  copyDir(path.join(ROOT, 'assets', 'fonts'), path.join(DIST, 'assets', 'fonts'), (n) => FONTS.includes(n));
  if (fs.existsSync(path.join(ROOT, 'static'))) copyDir(path.join(ROOT, 'static'), DIST);

  // --- CSS: písma + zdrojové soubory → jeden minifikovaný soubor ---
  const fontCss = fs.readFileSync(path.join(ROOT, 'assets', 'fonts', 'site-fonts.css'), 'utf8');
  const css = minifyCss(fontCss + CSS.map((f) => fs.readFileSync(path.join(ROOT, 'src', 'css', f), 'utf8')).join('\n'));
  fs.mkdirSync(path.join(DIST, 'assets', 'css'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'assets', 'css', 'site.css'), css);

  // --- JS ---
  fs.mkdirSync(path.join(DIST, 'assets', 'js'), { recursive: true });
  const versions = { '/assets/css/site.css': hash(css) };
  for (const f of JS) {
    const src = fs.readFileSync(path.join(ROOT, 'src', 'js', f), 'utf8');
    fs.writeFileSync(path.join(DIST, 'assets', 'js', f), src);
    versions[`/assets/js/${f}`] = hash(src);
  }
  const asset = (p) => `${p}?v=${versions[p] || ''}`;

  // --- stránky ---
  const { layout } = require('./src/templates/layout');
  const pagesDir = path.join(ROOT, 'src', 'pages');
  const pages = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.js')).flatMap((f) => [].concat(require(path.join(pagesDir, f))));
  const indexable = [];
  for (const page of pages) {
    const ctx = { config, site, services, img, asset, css, page: { path: page.path } };
    const body = page.render(ctx);
    const out = path.join(DIST, page.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, layout(ctx, body));
    if (!ctx.page.noindex) indexable.push({ path: page.path });
  }

  // --- SEO a GitHub Pages soubory ---
  indexable.sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)));
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), seo.sitemap(config, indexable));
  fs.writeFileSync(path.join(DIST, 'robots.txt'), seo.robots(config));
  fs.writeFileSync(path.join(DIST, 'CNAME'), new URL(config.siteUrl).hostname + '\n');
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

  // --- přesměrování starých URL (GitHub Pages neumí 301 → meta refresh + canonical + JS) ---
  const { redirects } = readJSON('content/pages.json');
  for (const r of redirects) {
    const target = r.to.replace(/#.*$/, '').replace(/\/$/, '');
    fs.writeFileSync(path.join(DIST, `${r.from.slice(1)}.html`), `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><title>Přesměrování…</title>
<meta name="robots" content="noindex"><link rel="canonical" href="${config.siteUrl}${target}">
<meta http-equiv="refresh" content="0; url=${r.to}">
<script>location.replace(${JSON.stringify(r.to)})</script></head>
<body><p>Stránka se přesunula: <a href="${r.to}">${r.to}</a></p></body></html>
`);
  }

  // --- obrázky (jen ty, které šablony použily) ---
  const res = await img.processImages(path.join(DIST, 'assets', 'img'));
  console.log(`✓ build ${pages.length} str. + ${redirects.length} přesměrování, ${res.total} obrázků (${res.made} nově), ${Date.now() - t0} ms`);
}

async function main() {
  await img.loadMeta();
  await build();
  if (!process.argv.includes('--watch')) return;
  let timer = null;
  const rebuild = () => { clearTimeout(timer); timer = setTimeout(() => build().catch((e) => console.error(e)), 120); };
  for (const dir of ['src', 'content', 'assets/fonts', 'assets/img/brand']) fs.watch(path.join(ROOT, dir), { recursive: true }, rebuild);
  fs.watch(path.join(ROOT, 'config.json'), rebuild);
  console.log('… sleduji změny');
}

main().catch((e) => { console.error(e); process.exit(1); });
