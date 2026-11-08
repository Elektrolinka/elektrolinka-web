// Právní stránky, děkovná stránka a 404
const fs = require('fs');
const path = require('path');
const { icon } = require('../templates/icons');
const { esc } = require('../templates/layout');
const { readJSON, pageHero } = require('../templates/partials');

const legal = (file) => fs.readFileSync(path.join(__dirname, '..', '..', 'content', 'legal', file), 'utf8');

module.exports = [
  {
    path: '/zasady-ochrany-osobnich-udaju',
    out: 'zasady-ochrany-osobnich-udaju.html',
    render(ctx) {
      ctx.page = {
        ...ctx.page,
        title: 'Zásady ochrany osobních údajů | Elektro Linka',
        description: 'Zásady ochrany osobních údajů na webu elektrolinka.cz',
        bodyClass: 'page-legal',
        breadcrumb: [{ name: 'Ochrana osobních údajů', url: '/zasady-ochrany-osobnich-udaju' }],
      };
      return `${pageHero(ctx, { crumbs: [{ label: 'Ochrana osobních údajů' }], h1: 'Zásady ochrany osobních údajů', compact: true })}
<section class="section section--legal"><div class="container legal">
${legal('zasady-ochrany-osobnich-udaju.html')}
</div></section>`;
    },
  },
  {
    path: '/cookies',
    out: 'cookies.html',
    render(ctx) {
      ctx.page = {
        ...ctx.page,
        title: 'Cookies | Elektro Linka',
        description: 'Zásady používání cookies na mém webu elektrolinka.cz',
        bodyClass: 'page-legal',
        noindex: true,
      };
      return `${pageHero(ctx, { crumbs: [{ label: 'Cookies' }], h1: 'Zásady cookies', compact: true })}
<section class="section section--legal"><div class="container legal">
  <p>Tento web používá cookies – malé soubory, které se ukládají ve vašem prohlížeči. Nezbytné cookies zajišťují základní fungování webu, ostatní (analytické a marketingové) používám jen s vaším souhlasem. Níže najdete jejich aktuální přehled a souhlas zde můžete kdykoliv změnit nebo odvolat.</p>
  <p><button class="btn btn--ghost btn--sm" type="button" onclick="window.Cookiebot&&Cookiebot.renew()">Změnit nastavení cookies</button></p>
  <div class="cookie-decl"><script id="CookieDeclaration" src="https://consent.cookiebot.com/bdcf6dcf-9263-4f99-abbc-a3a08d0fa30d/cd.js" type="text/javascript" async></script></div>
  <p>Další informace o zpracování osobních údajů najdete v <a class="u-link" href="/zasady-ochrany-osobnich-udaju">zásadách ochrany osobních údajů</a>.</p>
</div></section>`;
    },
  },
  {
    path: '/dekuji',
    out: 'dekuji.html',
    render(ctx) {
      const d = readJSON('content/pages.json').dekuji;
      ctx.page = { ...ctx.page, title: d.seo.title, description: d.seo.description, bodyClass: 'page-notice', noindex: true };
      return `<section class="notice" aria-labelledby="page-title"><div class="notice__inner">
  <svg class="done-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="m15 27 7.5 7.5L38 19"/></svg>
  <p class="notice__big">${esc(d.big)}</p>
  <h1 class="section-title" id="page-title">${esc(d.title)}</h1>
  <p>${esc(d.text)}</p>
  <div class="notice__actions">
    <a class="btn btn--volt" href="/">${esc(d.back)}${icon('arrow')}</a>
    <a class="btn btn--ghost" href="tel:${ctx.site.phoneIntl}">${icon('phone')}${esc(ctx.site.phone)}</a>
  </div>
</div></section>`;
    },
  },
  {
    path: '/404',
    out: '404.html',
    render(ctx) {
      const n = readJSON('content/pages.json').notFound;
      ctx.page = { ...ctx.page, title: n.seo.title, description: n.seo.description, bodyClass: 'page-notice', noindex: true };
      return `<section class="notice" aria-labelledby="page-title"><div class="notice__inner">
  <svg class="notice__bulb" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 44h16M26 50h12M28 56h8"/><path d="M22 40c-4-3.5-7-8.2-7-14a17 17 0 0 1 34 0c0 5.8-3 10.5-7 14"/><path class="filament" d="M26 36l3-9 3 6 3-6 3 9"/></svg>
  <p class="notice__big">404</p>
  <h1 class="section-title" id="page-title">${esc(n.title)}</h1>
  <p>${esc(n.text)}</p>
  <div class="notice__actions">
    <a class="btn btn--volt" href="/">${esc(n.back)}${icon('arrow')}</a>
    <a class="btn btn--ghost" href="tel:${ctx.site.phoneIntl}">${icon('phone')}${esc(ctx.site.phone)}</a>
  </div>
</div></section>`;
    },
  },
];
