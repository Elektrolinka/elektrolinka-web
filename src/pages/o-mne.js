// /o-mne – příběh, poslání, milníky, certifikáty (#certifikaty)
const { icon } = require('../templates/icons');
const { esc } = require('../templates/layout');
const { readJSON, title, pageHero, ctaButtons, contactSection } = require('../templates/partials');
const { galleryItem } = require('./ukazky');

module.exports = {
  path: '/o-mne',
  out: 'o-mne.html',
  render(ctx) {
    const o = readJSON('content/pages.json').omne;
    const { img } = ctx;
    ctx.page = {
      ...ctx.page,
      title: o.seo.title,
      description: o.seo.description,
      ogImage: ctx.img.jpg(o.photo, 1200),
      headExtra: ctx.img.preload(o.photo, { sizes: '(min-width: 960px) 44vw, 100vw' }),
      bodyClass: 'page-about',
      form: true,
      lightbox: true,
      breadcrumb: [{ name: 'O mně', url: '/o-mne' }],
    };
    const story = (s, id, reverse, extra = '', sticky = false) => `<section class="section story${reverse ? ' story--reverse' : ''}${sticky ? ' story--sticky' : ''}" aria-labelledby="${id}">
  <div class="container story__grid">
    <figure class="story__photo" data-parallax-wrap data-reveal>
      ${img.picture(s.photo, { alt: s.photoAlt, sizes: '(min-width: 960px) 50vw, 100vw', widths: [480, 800, 1200, 1600], attrs: 'data-parallax="12"' })}
    </figure>
    <div>
      <h2 class="section-title" id="${id}" data-reveal-words>${title(s.title)}</h2>
      <div class="prose" data-reveal>${s.html}</div>
      ${extra}
    </div>
  </div>
</section>`;
    const milestones = `<ol class="milestones" data-reveal-group aria-label="Milníky">${o.timeline.map((m) => `<li><b>${esc(m.year)}</b><span>${esc(m.text)}</span></li>`).join('')}</ol>`;

    return [
      pageHero(ctx, {
        crumbs: [{ label: 'O mně' }],
        h1: o.title,
        sub: o.sub,
        lead: `Jan Linka, elektrikář z Lužan u Jičína. ${ctx.site.yearsOfPractice} let praxe, elektroinstalace, chytrá domácnost, wallboxy i montáž spotřebičů.`,
        ctas: ctaButtons(ctx, 'Nezávazně poptat'),
        photo: o.photo,
        photoAlt: o.photoAlt,
        photoPos: o.photoPos,
      }),
      story(o.story, 'story-title', false, milestones, true),
      story(o.mission, 'mission-title', true),
      `<section class="section certs" id="certifikaty" aria-labelledby="certs-title">
  <div class="container">
    <div class="section-head">
      <h2 class="section-title" id="certs-title" data-reveal-words>${title(o.certs.title)}</h2>
    </div>
    <div class="certs__grid" data-reveal-group>
      ${o.certs.items.map((c) => `<figure class="cert">${galleryItem(ctx, { file: c.file, alt: c.alt }, 'certifikaty', '320px')}<figcaption><span>${icon('check', 'icon icon--sm')}${esc(c.label)}</span></figcaption></figure>`).join('\n      ')}
    </div>
  </div>
</section>`,
      contactSection(ctx, {
        title: 'Pojďme se do toho pustit',
        html: `Vyplňte nezávazný poptávkový formulář nebo mi zavolejte na tel. <a class="u-link" href="tel:${ctx.site.phoneIntl}">${esc(ctx.site.phone)}</a>. Společně se domluvíme na dalším postupu.`,
        photo: null,
      }),
    ].join('\n\n');
  },
};
