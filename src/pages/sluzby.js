// Detaily služeb: /elektroinstalace, /chytra-domacnost, /nabijeci-stanice, /montaz-spotrebicu
const { icon } = require('../templates/icons');
const { esc } = require('../templates/layout');
const { readJSON, title, pageHero, ctaButtons, contactSection, faqSection, serviceCards } = require('../templates/partials');

function body(ctx, s) {
  const d = s.detail;
  const { img } = ctx;
  const lists = d.lists.map((l) => `<div class="checklist" data-reveal>
        <h2 class="checklist__title">${esc(l.title)}</h2>
        <ul>${l.items.map((i) => `<li>${icon('check', 'icon icon--sm')}<span>${esc(i)}</span></li>`).join('')}</ul>
      </div>`).join('\n      ');
  const brands = d.brands ? `<div class="side-card" data-reveal><h2>Značky, které instaluji</h2><ul class="brands">${d.brands.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>` : '';
  const facts = d.facts ? `<div class="side-card" data-reveal><h2>V kostce</h2><ul class="facts">${d.facts.map((f) => `<li><b>${esc(f.value)} <span>${esc(f.unit)}</span></b><small>${esc(f.label)}</small></li>`).join('')}</ul></div>` : '';
  const callout = d.callout ? `<aside class="callout" data-reveal>${icon('bolt', 'icon')}<div><h2>${esc(d.callout.title)}</h2><p>${esc(d.callout.text)}</p></div></aside>` : '';

  return `<section class="section svc-detail" aria-label="${esc(s.title)} – popis služby">
  <div class="container svc-detail__grid">
    <div class="prose" data-reveal>
      ${d.html}
    </div>
    <div class="svc-detail__side">
      ${brands}
      ${facts}
      ${lists}
      ${callout}
      <a class="btn btn--volt" href="#contact-me" data-service="${esc(s.formValue)}" data-magnetic><span class="btn__inner">${esc(s.cta)}${icon('arrow')}</span></a>
    </div>
  </div>
  <div class="container photo-pair">
    ${d.photos.map((p, i) => `<figure class="photo-pair__item${i ? ' photo-pair__item--offset' : ''}" data-parallax-wrap data-reveal>
      ${img.picture(p.file, { alt: p.alt, sizes: d.photos.length > 1 ? '(min-width: 760px) 50vw, 100vw' : '(min-width: 1400px) 1320px, 100vw', widths: d.photos.length > 1 ? [480, 800, 1200] : [480, 800, 1200, 1600, 1920], attrs: 'data-parallax="12"' })}
    </figure>`).join('\n    ')}
  </div>
</section>`;
}

function others(ctx, s) {
  const list = ctx.services.filter((x) => x.slug !== s.slug);
  return `<section class="section other-services" aria-labelledby="other-title">
  <div class="container">
    <div class="section-head section-head--split">
      <h2 class="section-title" id="other-title" data-reveal-words>${title('Další služby')}</h2>
      <a class="u-link more-link" href="/cenik">Ceník všech služeb ${icon('arrow', 'icon icon--sm')}</a>
    </div>
    ${serviceCards(ctx, list, { small: true })}
  </div>
</section>`;
}

const services = readJSON('content/services.json');

module.exports = services.map((s) => ({
  path: `/${s.slug}`,
  out: `${s.slug}.html`,
  render(ctx) {
    const svc = ctx.services.find((x) => x.slug === s.slug);
    const d = svc.detail;
    ctx.page = {
      ...ctx.page,
      title: svc.seo.title,
      description: svc.seo.description,
      ogImage: ctx.img.jpg(svc.image, 1200),
      headExtra: ctx.img.preload(svc.image, { sizes: '(min-width: 960px) 58vw, 130vw' }),
      bodyClass: 'page-service',
      service: svc,
      form: true,
      breadcrumb: [{ name: 'Služby', url: '/#sluzby' }, { name: svc.navTitle || svc.title, url: `/${svc.slug}` }],
    };
    return [
      pageHero(ctx, {
        crumbs: [{ label: 'Služby', href: '/#sluzby' }, { label: svc.navTitle || svc.title }],
        h1: d.h1 || svc.title,
        sub: d.sub,
        ctas: ctaButtons(ctx, svc.cta, svc.formValue),
        photo: svc.image,
        photoAlt: svc.imageAlt,
        vt: `svc-${svc.slug}`,
      }),
      body(ctx, svc),
      faqSection(d.faq, { draft: d.faqDraft }),
      contactSection(ctx, {
        title: 'Máte další otázky?',
        html: `Pište, volejte, WhatsAppujte. Nebo rovnou vyplňte nezávaznou poptávku – ozvu se vám do ${ctx.site.responseHours} hodin.`,
        preselect: svc.formValue,
        ...(d.contactPhoto === false ? { photo: null } : {}),
      }),
      others(ctx, svc),
    ].join('\n\n');
  },
}));
