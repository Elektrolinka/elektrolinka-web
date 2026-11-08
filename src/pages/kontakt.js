// /kontakt – kontaktní údaje, mapa působnosti, formulář
const { icon } = require('../templates/icons');
const { esc } = require('../templates/layout');
const { readJSON, title, pageHero, ctaButtons, areaSection, contactSection } = require('../templates/partials');

module.exports = {
  path: '/kontakt',
  out: 'kontakt.html',
  render(ctx) {
    const k = readJSON('content/pages.json').kontakt;
    const cities = readJSON('content/home.json').area.cities;
    const { site } = ctx;
    ctx.page = {
      ...ctx.page,
      title: k.seo.title,
      description: k.seo.description,
      ogImage: ctx.img.jpg(k.photo, 1200),
      headExtra: ctx.img.preload(k.photo, { sizes: '(min-width: 960px) 44vw, 100vw' }),
      bodyClass: 'page-contact',
      form: true,
      breadcrumb: [{ name: 'Kontakt', url: '/kontakt' }],
    };
    return [
      pageHero(ctx, {
        crumbs: [{ label: 'Kontakt' }],
        h1: k.title,
        sub: k.sub,
        lead: `Ozvu se vám do ${site.responseHours} hodin. Pokud to hoří, rovnou zavolejte.`,
        ctas: ctaButtons(ctx, 'Napsat poptávku'),
        photo: k.photo,
        photoAlt: k.photoAlt,
        photoPos: '50% 50%',
        photoHref: ctx.site.google.url,
        photoHrefLabel: 'Lužany 135 v Google Mapách',
        photoCredit: 'Mapa © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }),
      `<section class="section details" aria-labelledby="details-title">
  <div class="container">
    <div class="section-head">
      <h2 class="section-title" id="details-title" data-reveal-words>${title(k.detailsTitle)}</h2>
    </div>
    <div class="contact-cards" data-reveal-group>
      <a class="c-card" href="tel:${site.phoneIntl}">${icon('phone')}<h3>Telefon</h3><p>${esc(site.phone)}</p><small>Volejte kdykoliv, případně vám zavolám zpět.</small></a>
      <a class="c-card" href="mailto:${site.email}?subject=Popt%C3%A1vka">${icon('mail')}<h3>E-mail</h3><p>${esc(site.email)}</p><small>Odpovím do ${site.responseHours} hodin.</small></a>
      <div class="c-card">${icon('pin')}<h3>Sídlo</h3><p>${esc(site.person)}<br>${esc(site.address.street)}, ${esc(site.address.zip)}</p><small>${esc(site.address.region)}</small></div>
      <div class="c-card">${icon('socket')}<h3>Fakturační údaje</h3><p>IČO: ${esc(site.ico)}</p><small>Č. ú.: ${esc(site.bank)}</small></div>
    </div>
  </div>
</section>`,
      areaSection(ctx, { title: k.areaTitle, text: k.areaText, cities }),
      contactSection(ctx, { title: k.formTitle, html: k.formHtml, photo: null }),
    ].join('\n\n');
  },
};
