// /cenik – přepínač služeb (taby), bez JS jsou všechny ceníky pod sebou
const { icon } = require('../templates/icons');
const { esc } = require('../templates/layout');
const { readJSON, title, pageHero, contactSection } = require('../templates/partials');

module.exports = {
  path: '/cenik',
  out: 'cenik.html',
  render(ctx) {
    const c = readJSON('content/pages.json').cenik;
    ctx.page = {
      ...ctx.page,
      title: c.seo.title,
      description: c.seo.description,
      ogImage: ctx.img.jpg(c.photo, 1200),
      headExtra: ctx.img.preload(c.photo, { sizes: '(min-width: 960px) 44vw, 100vw' }),
      bodyClass: 'page-cenik',
      form: true,
      breadcrumb: [{ name: 'Ceník', url: '/cenik' }],
    };
    const tabs = ctx.services.map((s, i) => `<button class="price__tab" type="button" role="tab" id="tab-${s.slug}" aria-controls="cenik-${s.slug}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${icon(s.icon, 'icon icon--sm')}${esc(s.navTitle || s.title)}</button>`).join('');
    const panels = ctx.services.map((s) => {
      const p = c.services[s.slug];
      const inc = p.included ? `<div class="price__included">
          <h3>${esc(p.included.title)}</h3>
          <ul>${p.included.items.map((i) => `<li>${icon('check', 'icon icon--sm')}${esc(i)}</li>`).join('')}${p.included.excluded.map((i) => `<li class="is-no">${icon('alert', 'icon icon--sm')}${esc(i)}</li>`).join('')}</ul>
        </div>` : '';
      return `<section class="price__panel" id="cenik-${s.slug}" role="tabpanel" aria-labelledby="tab-${s.slug}" tabindex="0">
        <div class="price__head">
          <h2>${icon(s.icon)}${esc(s.title)}</h2>
          <a class="u-link more-link" href="/${s.slug}">Více o službě ${icon('arrow', 'icon icon--sm')}</a>
        </div>
        <dl class="price__rows">${p.rows.map(([k, v]) => `<div class="price__row"><dt>${esc(k)}</dt><span class="leader" aria-hidden="true"></span><dd>${esc(v)}</dd></div>`).join('')}</dl>
        ${inc}
        <div class="price__actions">
          <a class="btn btn--volt" href="#contact-me" data-service="${esc(s.formValue)}" data-magnetic><span class="btn__inner">${esc(s.slug === 'elektroinstalace' ? 'Nezávazně poptat' : s.cta)}${icon('arrow')}</span></a>
        </div>
      </section>`;
    }).join('\n      ');

    return [
      pageHero(ctx, {
        crumbs: [{ label: 'Ceník' }],
        h1: c.title,
        sub: c.sub,
        lead: 'Cenu znáte předem – přijedu, zkonzultuji, nacením. Orientační ceny jednotlivých služeb najdete níže.',
        photo: c.photo,
        photoAlt: c.photoAlt,
      }),
      `<section class="section price" aria-labelledby="price-title">
  <div class="container">
    <div class="section-head">
      <h2 class="section-title" id="price-title" data-reveal-words>${title(c.tabsTitle)}</h2>
    </div>
    <div class="price__tabs" role="tablist" aria-label="Služby" data-tabs>${tabs}</div>
    <div class="price__panels">
      ${panels}
    </div>
    <p class="price__note">${esc(c.note)}</p>
  </div>
</section>`,
      contactSection(ctx, { html: c.contactHtml }),
    ].join('\n\n');
  },
};
