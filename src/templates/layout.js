// Společný layout: <head>, hlavička, mobilní menu, patička, sticky lišta, skripty.
const { icon } = require('./icons');
const { jsonLd } = require('../lib/seo');

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function head(ctx) {
  const { page, site, config, asset } = ctx;
  const url = config.siteUrl + (page.path === '/' ? '' : page.path);
  return `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
${page.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta property="og:type" content="website">
<meta property="og:locale" content="cs_CZ">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
${page.ogImage ? `<meta property="og:image" content="${config.siteUrl}${page.ogImage}">\n<meta property="og:image:width" content="1200">\n<meta name="twitter:card" content="summary_large_image">\n` : ''}<meta name="theme-color" content="#0D1626">
${config.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(config.googleSiteVerification)}">
` : ''}<link rel="icon" href="/assets/img/brand/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/brand/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/big-shoulders-display-800-cs.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/manrope-var-cs.woff2" as="font" type="font/woff2" crossorigin>
${page.headExtra || ''}
${jsonLd(ctx)}
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:2000});gtag('set','ads_data_redaction',true);</script>
<style>${ctx.css}</style>
<script>(function(d,k){function get(){try{var v=sessionStorage.getItem(k);sessionStorage.removeItem(k);return v}catch(x){return null}}addEventListener('pagereveal',function(e){if(get()===location.pathname&&e.viewTransition)d.classList.add('vt-morph')});document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.svc__link');if(a)try{sessionStorage.setItem(k,a.pathname)}catch(x){}},true)})(document.documentElement,'el-vt-card')</script>
<script>(function(d){if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!/[?&]rm\\b/.test(location.search)){d.classList.add('js-reveal');setTimeout(function(){if(!window.__elReady)d.classList.remove('js-reveal')},3000)}})(document.documentElement)</script>
<script src="${asset('/assets/js/main.js')}" defer></script>
${page.form ? `<script src="${asset('/assets/js/form.js')}" defer></script>\n` : ''}${page.lightbox ? `<script src="${asset('/assets/js/lightbox.js')}" defer></script>\n` : ''}</head>`;
}

function header(ctx) {
  const { site, services, page } = ctx;
  const current = (href) => (href === page.path ? ' aria-current="page"' : '');
  const servicesMenu = services.map((s) => `<li><a href="/${s.slug}"${current('/' + s.slug)}>${icon(s.icon, 'icon icon--sm')}<span>${esc(s.navTitle || s.title)}</span></a></li>`).join('');
  const nav = site.nav.map((n) => {
    if (n.children === 'services') {
      return `<li class="nav__drop">
          <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-sluzby"><span class="fill-link">${esc(n.label)}</span>${icon('chevronDown', 'icon icon--xs')}</button>
          <ul class="nav__sub" id="nav-sluzby">${servicesMenu}</ul>
        </li>`;
    }
    return `<li><a class="fill-link" href="${n.href}"${current(n.href)}>${esc(n.label)}</a></li>`;
  }).join('\n        ');
  const mobile = site.nav.map((n) => {
    if (n.children === 'services') {
      return `<li class="mobile-menu__group"><span class="mobile-menu__label">${esc(n.label)}</span><ul>${services.map((s) => `<li><a class="fill-link" href="/${s.slug}">${esc(s.navTitle || s.title)}</a></li>`).join('')}</ul></li>`;
    }
    return `<li><a class="fill-link" href="${n.href}">${esc(n.label)}</a></li>`;
  }).join('');

  return `<a class="skip-link" href="#main">Přeskočit na obsah</a>
<header class="site-header">
  <div class="site-header__bg"></div>
  <div class="container site-header__inner">
    <a class="site-header__logo" href="/" aria-label="${esc(site.person)} – elektrikář, úvodní stránka"><img src="/assets/img/brand/logo-light.svg" alt="" width="448" height="119"></a>
    <nav class="nav" aria-label="Hlavní menu">
      <ul>
        ${nav}
      </ul>
    </nav>
    <a class="btn btn--volt btn--sm header-phone" href="tel:${site.phoneIntl}" data-magnetic><span class="btn__inner">${icon('phone')}${esc(site.phone)}</span></a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Otevřít menu"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu">
  <nav aria-label="Mobilní menu"><ul>${mobile}</ul></nav>
  <div class="mobile-menu__contact">
    <a class="btn btn--volt" href="tel:${site.phoneIntl}">${icon('phone')}Zavolat ${esc(site.phone)}</a>
    <a class="u-link" href="mailto:${site.email}">${esc(site.email)}</a>
  </div>
</div>`;
}

function footer(ctx) {
  const { site, services } = ctx;
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
  <div class="container">
    <div class="site-footer__grid">
      <div class="site-footer__brand">
        <a href="/" aria-label="${esc(site.person)} – úvodní stránka"><img src="/assets/img/brand/logo-light.svg" alt="" width="448" height="119" loading="lazy"></a>
        <p>Elektroinstalace, chytrá domácnost, nabíjecí stanice a montáž spotřebičů. Hradec Králové, Jičín, Nová Paka a okolí.</p>
        <ul class="social" aria-label="Sociální sítě">
          <li><a href="${site.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a></li>
          <li><a href="${site.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a></li>
          <li><a href="${site.social.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a></li>
        </ul>
      </div>
      <div>
        <h2 class="site-footer__title">Služby</h2>
        <ul class="site-footer__links">${services.map((s) => `<li><a href="/${s.slug}"><span class="arrow-link">${esc(s.navTitle || s.title)}</span></a></li>`).join('')}</ul>
      </div>
      <div>
        <h2 class="site-footer__title">Web</h2>
        <ul class="site-footer__links">${site.nav.filter((n) => !n.children).map((n) => `<li><a href="${n.href}"><span class="arrow-link">${esc(n.label)}</span></a></li>`).join('')}</ul>
      </div>
      <div>
        <h2 class="site-footer__title">Kontakt</h2>
        <ul class="site-footer__links site-footer__contact">
          <li><a href="tel:${site.phoneIntl}">${icon('phone', 'icon icon--sm')}<span class="arrow-link">${esc(site.phone)}</span></a></li>
          <li><a href="mailto:${site.email}?subject=Popt%C3%A1vka">${icon('mail', 'icon icon--sm')}<span class="arrow-link">${esc(site.email)}</span></a></li>
          <li>${icon('pin', 'icon icon--sm')}<span>${esc(site.person)}, ${esc(site.address.street)}, ${esc(site.address.zip)}</span></li>
          <li class="site-footer__ico">IČO: ${esc(site.ico)}</li>
        </ul>
      </div>
    </div>
    <div class="site-footer__bottom">
      <p>© ${year} elektrolinka.cz</p>
      <ul>${site.legal.map((l) => `<li><a href="${l.href}"><span class="arrow-link">${esc(l.label)}</span></a></li>`).join('')}</ul>
      <p>${esc(site.credit.text)} <a href="${site.credit.url}" target="_blank" rel="noopener"><span class="arrow-link">${esc(site.credit.name)}</span></a></p>
    </div>
  </div>
</footer>
<a class="to-top" href="#top" aria-label="Zpět nahoru">
  <svg class="to-top__ring" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><circle class="to-top__progress" cx="26" cy="26" r="24" pathLength="100"/></svg>
  <svg class="to-top__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>
</a>`;
}

// GTM (Cookiebot, GA4, Ads, Sklik) se načítá líně – při první interakci, nejpozději po fallbackMs od načtení.
// Souhlas řeší Cookiebot uvnitř GTM; výchozí stav Consent Mode v2 (vše zamítnuto) je inline v <head>.
function gtmLoader(config) {
  const ms = (config.gtmLoad && config.gtmLoad.fallbackMs) || 0;
  return `<script>(function(w,d,id,ms){var done=0,ev=['scroll','pointerdown','keydown','touchstart','mousemove'];function load(){if(done)return;done=1;ev.forEach(function(e){w.removeEventListener(e,load)});w.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='+id;d.head.appendChild(s)}ev.forEach(function(e){w.addEventListener(e,load,{passive:true,once:true})});if(ms)w.addEventListener('load',function(){setTimeout(load,ms)})})(window,document,'${config.gtmId}',${ms})</script>`;
}

function layout(ctx, body) {
  return `${head(ctx)}
<body class="${ctx.page.bodyClass || ''}">
${ctx.config.gtmId ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${ctx.config.gtmId}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>` : ''}
${header(ctx)}
<main id="main">
${body}
</main>
${footer(ctx)}
${ctx.config.gtmId ? gtmLoader(ctx.config) : ''}
</body>
</html>
`;
}

module.exports = { layout, esc };
