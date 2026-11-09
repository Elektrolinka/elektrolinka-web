// Homepage – pořadí sekcí odpovídá původnímu webu:
// Hero → Služby → Proč si mě vybrat → Kam dojedu → Recenze → Jak si mě objednat → Formulář
const { icon } = require('../templates/icons');
const { esc } = require('../templates/layout');
const { splitWords } = require('../lib/split');
const { readJSON, title, stars, fmtRating, areaSection, contactSection, serviceCards } = require('../templates/partials');

const home = () => readJSON('content/home.json');

function hero(ctx, h) {
  const { site, img } = ctx;
  const g = site.google;
  return `<section class="hero" aria-labelledby="hero-title">
  <div class="container">
    <div class="hero__grid">
      <div class="hero__text">
        <p class="eyebrow"><span class="eyebrow__dot" aria-hidden="true"></span>${esc(h.eyebrow)}</p>
        <h1 class="hero__title" id="hero-title">${splitWords(h.titleHtml)}</h1>
        <p class="hero__lead">${h.leadHtml}</p>
        <div class="hero__ctas">
          <a class="btn btn--volt" href="#contact-me" data-magnetic><span class="btn__inner">${esc(h.cta)}${icon('arrow')}</span></a>
          <a class="btn btn--ghost" href="tel:${site.phoneIntl}" data-magnetic><span class="btn__inner">${icon('phone')}Zavolat ${esc(site.phone)}</span></a>
        </div>
      </div>
      <figure class="hero__photo" data-parallax-wrap>
        ${img.picture(h.photo, { alt: h.photoAlt, priority: true, sizes: '(min-width: 960px) 46vw, 100vw', attrs: 'data-parallax="10"' })}
      </figure>
    </div>

    <div class="rail">
      <ul class="rail__list" aria-label="Proč si mě vybrat ve zkratce">
        <li class="mod" style="--i:0">
          <span class="mod__icon" aria-hidden="true">${icon('toolbox', 'icon')}</span>
          <span class="mod__value"><span data-count="${site.yearsOfPractice}">${site.yearsOfPractice}</span> <span class="unit">let</span></span>
          <span class="mod__label">praxe v oboru</span>
        </li>
        <li class="mod" style="--i:1">
          <span class="mod__icon mod__icon--brand" aria-hidden="true">${icon('google', 'icon')}</span>
          <span class="mod__value"><span data-count="${g.rating.toFixed(1)}">${fmtRating(g.rating)}</span> <span class="mod__stars" aria-hidden="true">${icon('star').repeat(5)}</span></span>
          <a class="mod__label" href="${g.url}" target="_blank" rel="noopener">hodnocení na Googlu<span class="visually-hidden"> (otevře se v novém okně)</span></a>
        </li>
        <li class="mod" style="--i:2">
          <span class="mod__icon" aria-hidden="true">${icon('stopwatch', 'icon')}</span>
          <span class="mod__value">do <span data-count="${site.responseHours}">${site.responseHours}</span> <span class="unit">h</span></span>
          <span class="mod__label">se vám ozvu</span>
        </li>
        <li class="mod" style="--i:3">
          <span class="mod__icon" aria-hidden="true">${icon('pricetag', 'icon')}</span>
          <span class="mod__value">Cenu <span class="unit">předem</span></span>
          <span class="mod__label">${esc(h.price.text)}</span>
        </li>
      </ul>
    </div>
  </div>
</section>`;
}

function services(ctx, s) {
  return `<section class="section services" id="sluzby" aria-labelledby="sluzby-title">
  <div class="container">
    <div class="section-head">
      <h2 class="section-title" id="sluzby-title" data-reveal-words>${title(s.title)}</h2>
    </div>
    ${serviceCards(ctx, ctx.services, { more: s.more })}
  </div>
</section>`;
}

function why(ctx, w) {
  const { img } = ctx;
  return `<section class="section why" aria-labelledby="why-title">
  <div class="container why__grid">
    <figure class="why__photo" data-parallax-wrap data-reveal>
      ${img.picture(w.photo, { alt: w.photoAlt, sizes: '(min-width: 960px) 72vw, 130vw', widths: [800, 1200, 1536], attrs: 'data-parallax="12"' })}
    </figure>
    <div>
      <h2 class="section-title" id="why-title" data-reveal-words>${title(w.title)}</h2>
      <ul class="why__list" data-reveal-group>
        ${w.items.map((i) => `<li class="why__item">
          <span class="why__icon">${icon(i.icon, 'icon')}</span>
          <h3>${esc(i.title)}</h3>
          <p>${i.html}</p>
        </li>`).join('\n        ')}
      </ul>
    </div>
  </div>
</section>`;
}

const area = (ctx, a) => areaSection(ctx, a);

function reviews(ctx, r) {
  const g = ctx.site.google;
  return `<section class="section reviews" id="recenze" aria-labelledby="reviews-title">
  <div class="container">
    <div class="section-head section-head--split">
      <div>
        <h2 class="section-title" id="reviews-title" data-reveal-words>${title(r.title)}</h2>
        <a class="g-badge" href="${g.url}" target="_blank" rel="noopener" data-reveal>
          ${icon('google', 'icon')}<strong>${fmtRating(g.rating)}</strong>${stars(5)}<span>${g.reviewCount ? `${g.reviewCount} recenzí na Googlu` : 'Recenze na Googlu'}</span>
        </a>
      </div>
      <div class="slider-nav" data-reveal>
        <button class="slider-nav__btn" type="button" data-slider-prev aria-label="Předchozí recenze">${icon('chevronLeft')}</button>
        <button class="slider-nav__btn" type="button" data-slider-next aria-label="Další recenze">${icon('chevronRight')}</button>
      </div>
    </div>
  </div>
  <div class="slider" data-slider role="region" aria-label="Recenze zákazníků">
    <ul class="slider__track" data-reveal-group>
      ${r.items.map((x) => `<li class="review">
        <div class="review__top">${stars(x.rating)}${icon('google', 'icon icon--sm')}</div>
        <blockquote><p>${esc(x.text)}</p></blockquote>
        <p class="review__name">${esc(x.name)}</p>
      </li>`).join('\n      ')}
    </ul>
  </div>
</section>`;
}

function steps(ctx, s) {
  return `<section class="section steps" aria-labelledby="steps-title">
  <div class="container steps__grid">
    <div class="steps__head">
      <h2 class="section-title" id="steps-title" data-reveal-words>${title(s.title)}</h2>
      <p data-reveal>${esc(s.intro)}</p>
      <a class="btn btn--volt" href="#contact-me" data-magnetic><span class="btn__inner">Nezávazně poptat${icon('arrow')}</span></a>
    </div>
    <ol class="timeline" data-timeline>
      <li class="timeline__line" aria-hidden="true"><span class="timeline__fill"></span></li>
      ${s.items.map((x, i) => `<li class="timeline__step">
        <span class="timeline__node" aria-hidden="true">${i + 1}</span>
        <div class="timeline__card">
          <h3><span class="visually-hidden">Krok ${i + 1}: </span>${esc(x.title)}</h3>
          <p>${x.html}</p>
        </div>
      </li>`).join('\n      ')}
    </ol>
  </div>
</section>`;
}

const contact = (ctx, c) => contactSection(ctx, c);

module.exports = {
  path: '/',
  out: 'index.html',
  render(ctx) {
    const h = home();
    ctx.page = {
      ...ctx.page,
      title: h.seo.title,
      description: h.seo.description,
      ogImage: ctx.img.jpg(h.seo.ogImage, 1200),
      headExtra: ctx.img.preload(h.hero.photo, { sizes: '(min-width: 960px) 46vw, 100vw' }),
      bodyClass: 'page-home',
      slider: true,
      form: true,
    };
    return [
      hero(ctx, h.hero),
      services(ctx, h.services),
      why(ctx, h.why),
      area(ctx, h.area),
      reviews(ctx, h.reviews),
      steps(ctx, h.steps),
      contact(ctx, h.contact),
    ].join('\n\n');
  },
};
