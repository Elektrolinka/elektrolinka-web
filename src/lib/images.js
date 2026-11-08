// Obrázková pipeline: z assets/img/original vyrobí AVIF + WebP ve více šířkách
// a vrací <picture> se srcset. Výsledky se cachují v .cache/img (podle hashe originálu).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'assets', 'img', 'original');
const CACHE = path.join(ROOT, '.cache', 'img');
const DEFAULT_WIDTHS = [480, 800, 1200, 1600, 2000];
const QUALITY = { avif: 45, webp: 74, jpg: 82 };

const meta = new Map();   // soubor → { width, height, hash }
const jobs = new Map();   // výstupní název → { file, width, format }

async function loadMeta() {
  for (const file of fs.readdirSync(SRC)) {
    if (!/\.(avif|webp|jpe?g|png)$/i.test(file)) continue;
    const full = path.join(SRC, file);
    const m = await sharp(full).metadata();
    const hash = crypto.createHash('md5').update(fs.readFileSync(full)).digest('hex');
    meta.set(file, { width: m.width, height: m.height, hash });
  }
}

const base = (file) => file.replace(/\.[a-z0-9]+$/i, '');

function variant(file, width, format) {
  const info = meta.get(file);
  if (!info) throw new Error(`Obrázek nenalezen: ${file}`);
  const w = Math.min(width, info.width);
  const name = `${base(file)}-${w}.${format}`;
  jobs.set(name, { file, width: w, format });
  return { url: `/assets/img/${name}`, width: w };
}

/**
 * <picture> s AVIF + WebP srcset.
 * opts: alt, sizes, widths, cls (picture), imgCls, loading ('lazy'|'eager'), priority (bool), attrs (string)
 */
function picture(file, opts = {}) {
  const info = meta.get(file);
  if (!info) throw new Error(`Obrázek nenalezen: ${file}`);
  const widths = [...new Set((opts.widths || DEFAULT_WIDTHS).map((w) => Math.min(w, info.width)))];
  const srcset = (fmt) => widths.map((w) => { const v = variant(file, w, fmt); return `${v.url} ${v.width}w`; }).join(', ');
  const fallback = variant(file, widths[Math.min(1, widths.length - 1)], 'webp');
  const sizes = opts.sizes || '100vw';
  const loading = opts.priority ? 'eager' : (opts.loading || 'lazy');
  const prio = opts.priority ? ' fetchpriority="high"' : '';
  const alt = (opts.alt || '').replace(/"/g, '&quot;');
  return `<picture${opts.cls ? ` class="${opts.cls}"` : ''}>`
    + `<source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">`
    + `<source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">`
    + `<img src="${fallback.url}" alt="${alt}" width="${info.width}" height="${info.height}" loading="${loading}" decoding="async"${prio}${opts.imgCls ? ` class="${opts.imgCls}"` : ''}${opts.attrs ? ' ' + opts.attrs : ''}>`
    + '</picture>';
}

/** URL jednoho JPG (např. pro Open Graph – sociální sítě neumí AVIF) */
function jpg(file, width = 1200) {
  return variant(file, width, 'jpg').url;
}

/** Preload hlavního obrázku (stejné srcset jako <picture>) */
function preload(file, opts = {}) {
  const info = meta.get(file);
  const widths = [...new Set((opts.widths || DEFAULT_WIDTHS).map((w) => Math.min(w, info.width)))];
  const set = widths.map((w) => { const v = variant(file, w, 'avif'); return `${v.url} ${v.width}w`; }).join(', ');
  return `<link rel="preload" as="image" type="image/avif" imagesrcset="${set}" imagesizes="${opts.sizes || '100vw'}" fetchpriority="high">`;
}

async function processImages(outDir) {
  fs.mkdirSync(CACHE, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });
  // manifest: výstupní název → hash originálu + nastavení kvality (mtime v CI po checkoutu nesedí)
  const manifestPath = path.join(CACHE, 'manifest.json');
  let manifest = {};
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (e) { /* první build */ }
  let made = 0;
  await Promise.all([...jobs].map(async ([name, job]) => {
    const cached = path.join(CACHE, name);
    const key = meta.get(job.file).hash + ':' + QUALITY[job.format];
    if (!fs.existsSync(cached) || manifest[name] !== key) {
      let img = sharp(path.join(SRC, job.file)).resize({ width: job.width, withoutEnlargement: true });
      if (job.format === 'avif') img = img.avif({ quality: QUALITY.avif, effort: 4 });
      else if (job.format === 'webp') img = img.webp({ quality: QUALITY.webp });
      else img = img.flatten({ background: '#ffffff' }).jpeg({ quality: QUALITY.jpg, mozjpeg: true });
      await img.toFile(cached);
      manifest[name] = key;
      made++;
    }
    fs.copyFileSync(cached, path.join(outDir, name));
  }));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  return { total: jobs.size, made };
}

module.exports = { loadMeta, picture, jpg, preload, processImages, meta };
