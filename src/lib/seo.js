// Strukturovaná data (JSON-LD), sitemap.xml a robots.txt
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function business(ctx) {
  const { site, config, services } = ctx;
  const cities = readJSON('content/home.json').area.cities;
  return {
    '@type': 'Electrician',
    '@id': `${config.siteUrl}/#firma`,
    name: `${site.name} – ${site.person}`,
    alternateName: `${site.person} – elektrikář`,
    slogan: site.slogan,
    url: `${config.siteUrl}/`,
    telephone: site.phoneIntl,
    email: site.email,
    image: `${config.siteUrl}${ctx.img.jpg('jan_linka_hero.webp', 1200)}`,
    logo: `${config.siteUrl}/assets/img/brand/apple-touch-icon.png`,
    priceRange: 'Kč',
    currenciesAccepted: 'CZK',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      postalCode: site.address.zip,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: 'CZ',
    },
    areaServed: [
      ...cities.map((c) => ({ '@type': 'City', name: c.name })),
      { '@type': 'AdministrativeArea', name: 'Královéhradecký kraj' },
      { '@type': 'AdministrativeArea', name: 'Liberecký kraj' },
    ],
    founder: { '@type': 'Person', name: site.person, jobTitle: 'Elektrikář' },
    identifier: { '@type': 'PropertyValue', propertyID: 'IČO', value: site.ico },
    sameAs: [site.social.facebook, site.social.instagram],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Služby',
      itemListElement: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, url: `${config.siteUrl}/${s.slug}` } })),
    },
  };
}

/** Všechny JSON-LD bloky stránky v jednom @graph */
function jsonLd(ctx) {
  const { page, config } = ctx;
  if (page.noindex) return '';
  const graph = [business(ctx)];
  if (page.path === '/') {
    graph.push({ '@type': 'WebSite', '@id': `${config.siteUrl}/#web`, url: `${config.siteUrl}/`, name: ctx.site.name, inLanguage: 'cs', publisher: { '@id': `${config.siteUrl}/#firma` } });
  }
  if (page.breadcrumb) {
    const items = [{ name: 'Úvod', url: '/' }, ...page.breadcrumb];
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: items.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: config.siteUrl + (b.url === '/' ? '/' : b.url) })),
    });
  }
  if (page.service) {
    const s = page.service;
    graph.push({
      '@type': 'Service',
      name: s.title,
      serviceType: s.title,
      description: s.seo.description,
      url: `${config.siteUrl}/${s.slug}`,
      image: `${config.siteUrl}${ctx.img.jpg(s.heroImage || s.image, 1200)}`,
      provider: { '@id': `${config.siteUrl}/#firma` },
      areaServed: [{ '@type': 'AdministrativeArea', name: 'Královéhradecký kraj' }, { '@type': 'AdministrativeArea', name: 'Liberecký kraj' }],
    });
    if (s.detail.faq && s.detail.faq.length) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: s.detail.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })),
      });
    }
  }
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}

function sitemap(config, entries) {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${config.siteUrl}${e.path === '/' ? '/' : e.path}</loc><lastmod>${today}</lastmod><priority>${e.path === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`;
}

const robots = (config) => `User-agent: *
Allow: /

Sitemap: ${config.siteUrl}/sitemap.xml
`;

module.exports = { jsonLd, sitemap, robots };
