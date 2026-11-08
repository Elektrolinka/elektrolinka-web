// /ukazky-me-prace – galerie s filtrem a lightboxem (FLIP z miniatury, swipe)
const { icon } = require('../templates/icons');
const { esc } = require('../templates/layout');
const { readJSON, pageHero, contactSection } = require('../templates/partials');

/** Miniatura, která bez JS vede na velký obrázek; s JS otevře lightbox */
function galleryItem(ctx, { file, alt, category = '' }, group, sizes = '(min-width: 1100px) 25vw, (min-width: 760px) 33vw, 50vw') {
  const big = ctx.img.picture(file, { widths: [1600] }).match(/src="([^"]+\.webp)"/)[1];
  return `<a class="g-item" href="${big}" data-lightbox="${group}" data-category="${esc(category)}" data-caption="${esc(alt)}">${ctx.img.picture(file, { alt, sizes, widths: [480, 800, 1200, 1600] })}</a>`;
}

module.exports = {
  path: '/ukazky-me-prace',
  out: 'ukazky-me-prace.html',
  galleryItem,
  render(ctx) {
    const u = readJSON('content/pages.json').ukazky;
    const g = readJSON('content/gallery.json');
    const cats = [...new Set(g.items.map((i) => i.category))];
    ctx.page = {
      ...ctx.page,
      title: u.seo.title,
      description: u.seo.description,
      ogImage: ctx.img.jpg(g.items[0].file, 1200),
      bodyClass: 'page-gallery',
      form: true,
      lightbox: true,
      breadcrumb: [{ name: 'Ukázky mé práce', url: '/ukazky-me-prace' }],
    };
    return [
      pageHero(ctx, {
        crumbs: [{ label: 'Ukázky mé práce' }],
        h1: u.title,
        sub: u.sub,
        lead: 'Fotky z hotových zakázek – rozvaděče, wallboxy, fotovoltaika, osvětlení i zásuvky. Klikněte na fotku pro zvětšení.',
        compact: true,
      }),
      `<section class="section gallery" aria-label="Fotogalerie hotových zakázek">
  <div class="container">
    <div class="gallery__filters" role="group" aria-label="Filtrovat podle typu práce" data-filters hidden>
      <button type="button" aria-pressed="true" data-filter="">${esc(u.all)}</button>
      ${cats.map((c) => `<button type="button" aria-pressed="false" data-filter="${esc(c)}">${esc(c)}</button>`).join('\n      ')}
    </div>
    <div class="gallery__grid" data-reveal-group>
      ${g.items.map((i) => galleryItem(ctx, i, 'galerie')).join('\n      ')}
    </div>
  </div>
</section>`,
      contactSection(ctx, {
        title: 'Líbí se vám moje práce?',
        html: `Napište mi, co potřebujete udělat, nebo zavolejte na tel. <a class="u-link" href="tel:${ctx.site.phoneIntl}">${esc(ctx.site.phone)}</a>. Společně se domluvíme na dalším postupu.`,
      }),
    ].join('\n\n');
  },
};
