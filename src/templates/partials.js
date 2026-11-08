// Sdílené části stránek: úvod podstránky, mapa působnosti, kontaktní sekce, FAQ, karty služeb.
const fs = require('fs');
const path = require('path');
const { icon } = require('./icons');
const { esc } = require('./layout');
const { contactForm } = require('./form');
const { splitWords } = require('../lib/split');

const ROOT = path.join(__dirname, '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const title = (text) => splitWords(esc(text));
const stars = (n = 5) => `<span class="stars" role="img" aria-label="${n} z 5 hvězdiček">${icon('star').repeat(n)}</span>`;
const fmtRating = (r) => r.toFixed(1).replace('.', ',');

/** Úvod podstránky: drobečky, H1 rozdělený na slova, podnadpis, CTA, fotka (--vt = jméno přeletu z karty služby) */
function pageHero(ctx, { crumbs = [], h1, sub, lead, ctas = '', photo, photoAlt = '', photoPos, photoHref, photoHrefLabel = '', photoCredit = '', vt, compact = false }) {
  const { img } = ctx;
  const trail = [{ label: 'Úvod', href: '/' }, ...crumbs];
  return `<section class="page-hero${photo ? '' : ' page-hero--text'}${compact ? ' page-hero--compact' : ''}" aria-labelledby="page-title">
  <div class="container page-hero__grid">
    <div class="page-hero__text">
      <nav class="crumbs" aria-label="Drobečková navigace"><ol>${trail.map((c, i) => (i === trail.length - 1 && !c.href
        ? `<li><span aria-current="page">${esc(c.label)}</span></li>`
        : `<li><a class="u-link" href="${c.href}">${esc(c.label)}</a></li>`)).join('')}</ol></nav>
      <h1 class="page-hero__title" id="page-title">${splitWords(esc(h1))}</h1>
      ${sub ? `<p class="page-hero__sub">${esc(sub)}</p>` : ''}
      ${lead ? `<p class="page-hero__lead">${lead}</p>` : ''}
      ${ctas ? `<div class="page-hero__ctas">${ctas}</div>` : ''}
    </div>
    ${photo ? (() => {
      const pic = img.picture(photo, { alt: photoAlt, priority: true, sizes: '(min-width: 960px) 44vw, 100vw', attrs: `data-parallax="10"${photoPos ? ` style="object-position:${photoPos}"` : ''}` });
      return `<figure class="page-hero__photo"${vt ? ` style="--vt:${vt}"` : ''} data-parallax-wrap>
      ${photoHref ? `<a class="page-hero__photo-link" href="${photoHref}" target="_blank" rel="noopener" aria-label="${esc(photoHrefLabel)} (otevře se v novém okně)">${pic}</a>` : pic}
      ${photoCredit ? `<figcaption class="page-hero__credit">${photoCredit}</figcaption>` : ''}
    </figure>`;
    })() : ''}
  </div>
</section>`;
}

const ctaButtons = (ctx, label, service) => `<a class="btn btn--volt" href="#contact-me"${service ? ` data-service="${esc(service)}"` : ''} data-magnetic><span class="btn__inner">${esc(label)}${icon('arrow')}</span></a>
        <a class="btn btn--ghost" href="tel:${ctx.site.phoneIntl}" data-magnetic><span class="btn__inner">${icon('phone')}Zavolat ${esc(ctx.site.phone)}</span></a>`;

// --- Mapa: obrysy ČR a krajů z původní SVG mapy webu ---
function mapPaths() {
  const svg = fs.readFileSync(path.join(ROOT, 'assets', 'img', 'original', 'group-2.svg'), 'utf8');
  const d = [...svg.matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)].map((m) => m[1]);
  const round = (p) => p.replace(/-?\d+\.\d+/g, (n) => (+n).toFixed(1));
  return { cz: round(d[0]), hk: round(d[4]), lb: round(d[6]) };
}
// lineární projekce ČR (12,09–18,86° v. d., 48,55–51,06° s. š.) do 1120 × 636
const project = (lat, lon) => [((lon - 12.09) / 6.77) * 1120, ((51.06 - lat) / 2.51) * 636];

function mapFigure(cities) {
  const m = mapPaths();
  const VB = { x: 380, y: 10, w: 400, h: 280 };
  const items = cities.map((c) => {
    const [x, y] = project(c.lat, c.lon);
    const left = (((x - VB.x) / VB.w) * 100).toFixed(2);
    const top = (((y - VB.y) / VB.h) * 100).toFixed(2);
    const side = ['Hradec Králové', 'Jaroměř', 'Nová Paka', 'Vrchlabí'].includes(c.name) ? 'right' : 'left';
    return `<li class="city city--${side}${c.main ? ' city--main' : ''}" style="left:${left}%;top:${top}%">${c.main ? '<span class="city__ring" aria-hidden="true"></span>' : ''}<span class="city__dot" aria-hidden="true"></span><span class="city__label">${esc(c.name)}</span></li>`;
  }).join('\n          ');
  return `<figure class="area__map" data-map>
      <div class="map__canvas">
        <svg viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" role="img" aria-labelledby="map-desc">
          <title id="map-desc">Mapa působnosti: Královéhradecký a Liberecký kraj, hlavně Hradec Králové, Jičín a Nová Paka</title>
          <path class="map__cz" d="${m.cz}"/>
          <path class="map__region map__region--lb" d="${m.lb}"/>
          <path class="map__region map__region--hk" d="${m.hk}"/>
          <text class="map__region-label" x="418" y="96">LIBERECKÝ KRAJ</text>
          <text class="map__region-label" x="560" y="232">KRÁLOVÉHRADECKÝ KRAJ</text>
        </svg>
        <ul class="map__cities" aria-hidden="true">
          ${items}
        </ul>
      </div>
    </figure>`;
}

function areaSection(ctx, { title: t, text, cities, id = 'area-title' }) {
  return `<section class="section area" aria-labelledby="${id}">
  <div class="container area__grid">
    <div class="area__text">
      <h2 class="section-title" id="${id}" data-reveal-words>${title(t)}</h2>
      <p data-reveal>${esc(text)}</p>
      <ul class="area__cities" data-reveal-group aria-label="Hlavní oblasti">
        ${cities.map((c) => `<li class="${c.main ? 'is-main' : ''}">${icon('pin', 'icon icon--sm')}${esc(c.name)}</li>`).join('')}
      </ul>
    </div>
    ${mapFigure(cities)}
  </div>
</section>`;
}

/** Kontaktní sekce s formulářem (#contact-me) */
function contactSection(ctx, { title: t = 'Kontaktní formulář', html, photo = null, photoAlt = '', preselect = '' } = {}) {
  const { site, img } = ctx;
  return `<section class="section contact" id="contact-me" aria-labelledby="contact-title">
  <div class="container contact__grid">
    <div class="contact__aside">
      <h2 class="section-title" id="contact-title" data-reveal-words>${title(t)}</h2>
      <p data-reveal>${html}</p>
      <ul class="contact__direct" data-reveal-group>
        <li><a href="tel:${site.phoneIntl}">${icon('phone')}<span><small>Zavolejte</small>${esc(site.phone)}</span></a></li>
        <li><a href="mailto:${site.email}?subject=Popt%C3%A1vka">${icon('mail')}<span><small>Napište</small>${esc(site.email)}</span></a></li>
        <li><a href="${site.social.whatsapp}" target="_blank" rel="noopener">${icon('whatsapp')}<span><small>WhatsApp</small>Napište mi zprávu</span></a></li>
      </ul>
      ${photo ? `<figure class="contact__photo" data-reveal>${img.picture(photo, { alt: photoAlt, sizes: '(min-width: 960px) 320px, 60vw', widths: [480, 800] })}</figure>` : ''}
    </div>
    <div class="contact__form" data-reveal>
      ${contactForm(ctx, { preselect })}
    </div>
  </div>
</section>`;
}

/** Často se ptáte – nativní <details>, funguje bez JS */
function faqSection(items, { draft = false } = {}) {
  if (!items || !items.length) return '';
  return `<section class="section faq" aria-labelledby="faq-title">
  <div class="container faq__grid">
    <div>
      <h2 class="section-title" id="faq-title" data-reveal-words>${title('Často se ptáte')}</h2>
      ${draft ? '<!-- FAQ je návrh ke schválení (viz docs/texty-upravy.md) -->' : ''}
    </div>
    <div class="faq__list" data-reveal-group>
      ${items.map((x) => `<details class="faq__item">
        <summary><span>${esc(x.q)}</span><span class="faq__plus" aria-hidden="true"></span></summary>
        <div class="faq__a"><p>${x.a}</p></div>
      </details>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

/** Karty služeb (homepage i „Další služby“) */
function serviceCards(ctx, list, { more = 'Více o službě', small = false } = {}) {
  const { img } = ctx;
  return `<ul class="services__grid${small ? ' services__grid--small' : ''}" data-reveal-group>
      ${list.map((x) => `<li class="svc" data-tilt>
        <a class="svc__link" href="/${x.slug}">
          <div class="svc__media" style="view-transition-name:svc-${x.slug}">${img.picture(x.image, { alt: '', sizes: '(min-width: 1100px) 300px, (min-width: 640px) 50vw, 100vw', widths: [480, 800, 1200], imgCls: 'svc__img' })}</div>
          <div class="svc__body">
            <span class="svc__icon">${icon(x.icon, 'icon icon--draw')}</span>
            <h3 class="svc__title">${esc(x.title)}</h3>
            ${small ? '' : `<p class="svc__text">${esc(x.short)}</p>`}
            <span class="svc__more">${esc(more)}${icon('arrow', 'icon icon--sm')}</span>
          </div>
        </a>
      </li>`).join('\n      ')}
    </ul>`;
}

module.exports = { readJSON, title, stars, fmtRating, pageHero, ctaButtons, mapFigure, areaSection, contactSection, faqSection, serviceCards };
