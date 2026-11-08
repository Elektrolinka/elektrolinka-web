// Jednorázově vygeneruje statickou mapu s pinem (úvod stránky Kontakt).
// Podklad: dlaždice OpenStreetMap (© OpenStreetMap contributors, ODbL), invertované do tmavé modré webu.
// Zdroj je uveden pod mapou. Dlaždice se stahují jen při ručním spuštění (pravidla tile.openstreetmap.org).
// Spuštění: node tools/static-map.js  → assets/img/original/mapa-luzany.png
const { execFileSync } = require('child_process');
const path = require('path');
const sharp = require('sharp');

const LAT = 50.4297925; // Lužany 135 (profil firmy v Google Mapách)
const LON = 15.469943;
const Z = 13;           // přiblížení: detail Lužan a nejbližšího okolí
const TILE = 256;
const OUT_W = 1000;
const OUT_H = 750;
const k = 1.25; // měřítko pinu a popisku (mapa se na webu zobrazuje zmenšeně)
const OUT = path.join(__dirname, '..', 'assets', 'img', 'original', 'mapa-luzany.png');

const n = 2 ** Z;
const px = ((LON + 180) / 360) * n * TILE;
const latR = (LAT * Math.PI) / 180;
const py = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n * TILE;
const left = Math.round(px - OUT_W / 2);
const top = Math.round(py - OUT_H / 2);
const x0 = Math.floor(left / TILE);
const y0 = Math.floor(top / TILE);
const x1 = Math.floor((left + OUT_W - 1) / TILE);
const y1 = Math.floor((top + OUT_H - 1) / TILE);

// stahuje přes curl (fetch v Node na některých sítích padá na ECONNRESET)
function tile(x, y) {
  const url = `https://tile.openstreetmap.org/${Z}/${x}/${y}.png`;
  return execFileSync('curl', ['-sSf', '-A', 'elektrolinka-web/1.0 (static map for elektrolinka.cz contact page)', url], { maxBuffer: 1 << 22 });
}

(async () => {
  const tiles = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) tiles.push({ input: tile(x, y), left: (x - x0) * TILE, top: (y - y0) * TILE });
  const W = (x1 - x0 + 1) * TILE;
  const H = (y1 - y0 + 1) * TILE;
  const base = await sharp({ create: { width: W, height: H, channels: 3, background: '#0D1626' } })
    .composite(tiles).png().toBuffer();
  // výřez kolem bodu + tónování do modré webu
  // sharp řadí operace v pevném pořadí → každý krok zvlášť
  const crop = await sharp(base).extract({ left: left - x0 * TILE, top: top - y0 * TILE, width: OUT_W, height: OUT_H }).png().toBuffer();
  const inv = await sharp(crop).greyscale().negate({ alpha: false }).png().toBuffer();
  const map = await sharp(inv).linear(1.1, 6).tint({ r: 60, g: 100, b: 165 }).png().toBuffer();

  // pin uprostřed (hrot přesně na souřadnici) + popisek
  const cx = OUT_W / 2; const cy = OUT_H / 2;
  const pin = `<svg xmlns="http://www.w3.org/2000/svg" width="${OUT_W}" height="${OUT_H}"><g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})">
    <circle cx="${cx}" cy="${cy}" r="90" fill="#F0CC0D" fill-opacity=".10"/>
    <circle cx="${cx}" cy="${cy}" r="46" fill="#F0CC0D" fill-opacity=".18"/>
    <ellipse cx="${cx}" cy="${cy + 4}" rx="22" ry="8" fill="#000" fill-opacity=".45"/>
    <path transform="translate(${cx - 40} ${cy - 108})" d="M40 108C40 108 80 64 80 40A40 40 0 0 0 0 40c0 24 40 68 40 68z" fill="#F0CC0D" stroke="#0D1626" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy - 68}" r="15" fill="#0D1626"/>
    <g font-family="Arial, Helvetica, sans-serif" font-weight="700">
      <rect x="${cx + 58}" y="${cy - 128}" width="196" height="84" rx="14" fill="#0D1626" fill-opacity=".92" stroke="#F0CC0D" stroke-width="3"/>
      <text x="${cx + 82}" y="${cy - 80}" font-size="40" fill="#F0CC0D">Lužany</text>
      <text x="${cx + 82}" y="${cy - 52}" font-size="22" font-weight="400" fill="#EAF0F7">u Jičína</text>
    </g>
  </g></svg>`;
  await sharp(map).composite([{ input: Buffer.from(pin) }]).png({ compressionLevel: 9 }).toFile(OUT);
  console.log(`✓ ${path.relative(process.cwd(), OUT)} (${tiles.length} dlaždic, z${Z})`);
})().catch((e) => { console.error(e); process.exit(1); });
