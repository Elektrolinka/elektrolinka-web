# elektrolinka.cz

Statický web elektrikáře Jana Linky. Generuje se skriptem `build.js` do `dist/` a nasazuje přes GitHub Actions na GitHub Pages.

## Práce s webem

```bash
npm ci                 # jednou – nainstaluje sharp (zmenšování obrázků)
node build.js          # vygeneruje dist/
node build.js --watch  # generuje znovu při změně
node server.js dist 8080   # náhled na http://localhost:8080
```

Push do větve `main` = automatické nasazení (`.github/workflows/deploy.yml`).

## Kde co upravit

| Co | Soubor |
|---|---|
| Kontakty, IČO, sociální sítě, hodnocení Google, menu | `content/site.json` |
| Homepage (hero, výhody, mapa, recenze, kroky) | `content/home.json` |
| Služby: karty, detaily, FAQ, SEO | `content/services.json` |
| Ceník, O mně, Kontakt, Ukázky, přesměrování | `content/pages.json` |
| Fotky v Ukázkách mé práce (popisky, kategorie) | `content/gallery.json` + soubor do `assets/img/original/` |
| Zásady ochrany osobních údajů | `content/legal/zasady-ochrany-osobnich-udaju.html` |
| URL Make webhooku, GTM, adresa webu | `config.json` (nebo proměnná `MAKE_WEBHOOK_URL` v GitHubu) |

Obrázky stačí nahrát v plné velikosti do `assets/img/original/`. Build z nich udělá AVIF a WebP ve více šířkách.

## Struktura

```
build.js              generátor (stránky, CSS, JS, obrázky, sitemap, robots, CNAME, přesměrování)
src/pages/            šablony stránek (1 soubor = 1 nebo více stránek)
src/templates/        layout, sdílené části, formulář, ikony
src/css/              tokeny (barvy, písma, pohyb), komponenty, stránky – vkládá se inline
src/js/               main.js (pohyb, menu, reveal), form.js (Make webhook), lightbox.js
assets/               originální obrázky, písma, GSAP + Lenis (pevné verze)
tools/                pomocné skripty (statická mapa na stránce Kontakt)
```

Interní poznámky k projektu (audit, Make, GTM, DNS) nejsou součástí repozitáře.
