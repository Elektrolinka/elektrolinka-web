/* Elektro Linka – pohybový systém a interakce (načítá se s defer).
   - Úvodní choreografie hero je v CSS (startuje hned, nečeká na JS kvůli LCP).
   - Scroll reveal: IntersectionObserver přidává .is-in, přechody řeší CSS.
   - GSAP + ScrollTrigger jen pro scrub (timeline kroků), parallax, mapu a slider; Lenis pro plynulý scroll.
   - prefers-reduced-motion (nebo ?rm v URL): bez parallaxu, smooth scrollu, scrubu a split-textu. */
(() => {
  const html = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]rm\b/.test(location.search);
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EASE = 'expo.out'; // ≈ --ease-out
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  window.__elReady = true;

  // ---------- Hlavička ----------
  const header = $('.site-header');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    if (!document.body.classList.contains('menu-open')) {
      if (y > 320 && y > lastY + 4) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y <= 320) header.classList.remove('is-hidden');
    }
    if (toTop) toTop.classList.toggle('is-visible', y > window.innerHeight * 0.9);
    lastY = y;
  };

  // ---------- Zpět nahoru ----------
  const toTop = $('.to-top');
  if (toTop) {
    toTop.addEventListener('click', (e) => {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.2 }); else window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
      // fokus zpět na začátek stránky (klávesnice, čtečky)
      $('.site-header__logo').focus({ preventScroll: true });
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  // první čtení scrollY až po prvním vykreslení (jinak vynucený layout celé stránky při startu)
  requestAnimationFrame(() => requestAnimationFrame(onScroll));

  // ---------- Mobilní menu ----------
  let lenis = null;
  const burger = $('.burger');
  const menu = $('#mobile-menu');
  if (burger && menu) {
    const set = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      header.classList.remove('is-hidden');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) lenis?.stop(); else lenis?.start();
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => e.target.closest('a') && set(false));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); burger.focus(); } });
  }

  // ---------- Rozbalovací „Služby“ v menu: hover + klik + klávesnice ----------
  $$('.nav__drop').forEach((drop) => {
    const btn = $('.nav__toggle', drop);
    let t;
    const set = (open) => { drop.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', () => set(!drop.classList.contains('is-open')));
    if (FINE) {
      drop.addEventListener('pointerenter', () => { clearTimeout(t); set(true); });
      drop.addEventListener('pointerleave', () => { t = setTimeout(() => set(false), 180); });
    }
    drop.addEventListener('focusout', (e) => { if (!drop.contains(e.relatedTarget)) set(false); });
    drop.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); btn.focus(); } });
    document.addEventListener('click', (e) => { if (!drop.contains(e.target)) set(false); });
  });

  // ---------- Kotvy: před skokem vykreslit všechny sekce (content-visibility), ať cíl sedí ----------
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || a.pathname !== location.pathname) return;
    const target = a.hash && document.getElementById(a.hash.slice(1));
    if (!target) return;
    e.preventDefault();
    html.classList.add('cv-off');
    requestAnimationFrame(() => {
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      if (lenis) lenis.scrollTo(top, { duration: 1.2 }); else window.scrollTo({ top, behavior: RM ? 'auto' : 'smooth' });
      history.replaceState(null, '', a.hash);
    });
  });
  // změna výšky stránky (vykreslení sekcí) → přepočítat ScrollTrigger
  let roT, lastH = 0;
  new ResizeObserver(([e]) => {
    const h = Math.round(e.contentRect.height);
    if (!lastH || Math.abs(h - lastH) < 40) { lastH = h; return; }
    lastH = h;
    clearTimeout(roT); roT = setTimeout(() => window.ScrollTrigger?.refresh(), 250);
  }).observe(document.body);

  // ---------- Taby (ceník): šipky, Home/End, hash v URL ----------
  $$('[data-tabs]').forEach((list) => {
    const tabs = $$('[role="tab"]', list);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const key = (t) => t.id.replace(/^tab-/, '');
    list.classList.add('is-ready');
    const select = (i, { focus = false, updateHash = true, animate = true } = {}) => {
      tabs.forEach((t, j) => {
        const on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
        if (on && !RM && animate) { panels[j].classList.remove('is-entering'); void panels[j].offsetWidth; panels[j].classList.add('is-entering'); }
      });
      if (focus) tabs[i].focus();
      if (updateHash) history.replaceState(null, '', `#${key(tabs[i])}`);
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        const n = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
        if (n !== undefined) { e.preventDefault(); select(n, { focus: true }); }
      });
    });
    const fromHash = () => tabs.findIndex((t) => `#${key(t)}` === location.hash);
    select(Math.max(0, fromHash()), { updateHash: false, animate: false });
    addEventListener('hashchange', () => { if (fromHash() >= 0) select(fromHash(), { updateHash: false }); });
  });

  // ---------- Scroll reveal (bez GSAP) ----------
  $$('[data-reveal-group]').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('[data-reveal], [data-reveal-group], [data-reveal-words]').forEach((el) => io.observe(el));

  // hero je vidět? (pauza pulzu proudu mimo obrazovku)
  const hero = $('.hero');
  if (hero) new IntersectionObserver(([e]) => hero.classList.toggle('is-visible', e.isIntersecting)).observe(hero);

  // ---------- Počítadla v hero (běží souběžně s CSS choreografií jističů) ----------
  const t0 = performance.now();
  $$('.mod [data-count]').forEach((el) => {
    const i = +el.closest('.mod').style.getPropertyValue('--i') || 0;
    const startAt = (850 + i * 200) - t0; // ms od načtení stránky (≈ CSS animation-delay)
    if (RM || startAt < -300) return; // JS dorazil pozdě – necháme konečnou hodnotu, ať nic neproblikne
    const to = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split('.')[1] || '').length;
    const fmt = (v) => v.toFixed(dec).replace('.', ',');
    el.textContent = fmt(0);
    const dur = 1100;
    setTimeout(() => {
      const s = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - s) / dur);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, Math.max(0, startAt));
  });

  // ---------- Magnetická tlačítka a 3D tilt karet (jen myš) ----------
  if (FINE && !RM) {
    $$('[data-magnetic]').forEach((btn) => {
      const inner = $('.btn__inner', btn);
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
        if (inner) inner.style.transform = `translate(${x * 6}px, ${y * 5}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; if (inner) inner.style.transform = ''; });
    });
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 8 + 'deg');
        card.style.setProperty('--rx', -((e.clientY - r.top) / r.height - 0.5) * 6 + 'deg');
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }

  // ---------- Slider: do načtení GSAP funguje nativní scroll se snapem ----------
  const sliderWrap = $('[data-slider]');
  const nativeStep = (dir) => {
    if (!sliderWrap || sliderWrap.classList.contains('is-draggable')) return;
    const card = $('.review', sliderWrap);
    sliderWrap.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: RM ? 'auto' : 'smooth' });
  };
  $('[data-slider-prev]')?.addEventListener('click', () => nativeStep(-1));
  $('[data-slider-next]')?.addEventListener('click', () => nativeStep(1));

  // ---------- Pohybové knihovny: načíst až při první interakci (nebo po 7 s) ----------
  // Hero choreografie je v CSS; GSAP/ScrollTrigger/Lenis jsou potřeba až pro scroll efekty,
  // takže je nestahujeme a nespouštíme během načítání stránky (výkon na mobilu, TBT).
  const V = '/assets/vendor/';
  const loadScript = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = V + src; s.async = false; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
  let motionStarted = false;
  const startMotion = () => {
    if (motionStarted || RM) return; // při reduced motion se pohybové knihovny vůbec nestahují
    motionStarted = true;
    events.forEach((ev) => removeEventListener(ev, startMotion, opts));
    const list = ['gsap.min.js', 'ScrollTrigger.min.js', 'lenis.min.js'];
    if ($('[data-slider]') && !RM) list.push('Draggable.min.js', 'InertiaPlugin.min.js');
    Promise.all(list.map(loadScript)).then(initMotion).catch((e) => console.warn('Animace se nenačetly', e));
  };
  const events = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'].concat(FINE ? ['pointermove'] : []);
  const opts = { passive: true };
  events.forEach((ev) => addEventListener(ev, startMotion, opts));
  setTimeout(startMotion, 7000);
  requestAnimationFrame(() => { if (window.scrollY > 0) startMotion(); }); // obnovení stránky uprostřed

  function initMotion() {
  gsap.registerPlugin(ScrollTrigger);
  if (window.Draggable) gsap.registerPlugin(Draggable, InertiaPlugin);
  gsap.defaults({ ease: EASE, duration: 0.9 });

  // ---------- Plynulý scroll ----------
  if (!RM && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ---------- Parallax fotek (max ~12 %) ----------
  function parallax() {
    $$('[data-parallax]').forEach((img) => {
      const amt = parseFloat(img.dataset.parallax) || 10;
      gsap.fromTo(img, { yPercent: -amt }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: img.closest('[data-parallax-wrap]') || img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  // ---------- Mapa: kraje se obkreslí a rozsvítí, města naskočí ----------
  function map() {
    const el = $('[data-map]');
    if (!el) return;
    const regions = $$('.map__region', el);
    regions.forEach((r) => { const l = r.getTotalLength(); gsap.set(r, { strokeDasharray: l, strokeDashoffset: l, fillOpacity: 0 }); });
    const cities = $$('.city', el);
    const labels = $$('.map__region-label', el);
    gsap.set(cities, { autoAlpha: 0, scale: 0.4 });
    gsap.set(labels, { autoAlpha: 0 });
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 75%', once: true } })
      .fromTo($('.map__cz', el), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 0)
      .to(regions, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.35 }, 0.1)
      .to(regions, { fillOpacity: 1, duration: 0.8, stagger: 0.35 }, 1.1)
      .to(labels, { autoAlpha: 1, duration: 0.6, stagger: 0.2 }, 1.3)
      .to(cities, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2)', stagger: 0.12 }, 1.4);
  }

  // ---------- Slider recenzí: drag/swipe se setrvačností ----------
  function slider() {
    const wrap = $('[data-slider]');
    if (!wrap) return;
    const track = $('.slider__track', wrap);
    const prev = $('[data-slider-prev]');
    const next = $('[data-slider-next]');
    const cards = $$('.review', track);

    if (RM || !window.Draggable) return; // zůstává nativní scroll se snapem
    wrap.scrollLeft = 0;

    wrap.classList.add('is-draggable');
    track.style.position = 'relative';
    let minX = 0, snaps = [];
    const measure = () => {
      const cs = getComputedStyle(wrap);
      const visible = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      minX = Math.min(0, visible - track.scrollWidth);
      snaps = [...new Set(cards.map((c) => Math.max(minX, -c.offsetLeft)))];
    };
    measure();
    const current = () => gsap.getProperty(track, 'x');
    const update = () => {
      const x = current();
      if (prev) prev.disabled = x > -2;
      if (next) next.disabled = x < minX + 2;
    };
    const [drag] = Draggable.create(track, {
      type: 'x', inertia: true, edgeResistance: 0.85, dragClickables: true, allowContextMenu: true,
      bounds: { minX, maxX: 0 },
      snap: (v) => gsap.utils.snap(snaps, v),
      onPress() { wrap.classList.add('is-dragging'); },
      onRelease() { wrap.classList.remove('is-dragging'); },
      onDrag: update, onThrowUpdate: update, onThrowComplete: update,
    });
    const go = (dir) => {
      const x = current();
      const idx = snaps.reduce((best, s, i) => (Math.abs(s - x) < Math.abs(snaps[best] - x) ? i : best), 0);
      const target = snaps[gsap.utils.clamp(0, snaps.length - 1, idx + dir)];
      gsap.to(track, { x: target, duration: 0.8, ease: EASE, overwrite: true, onUpdate: () => { drag.update(); update(); } });
    };
    prev?.addEventListener('click', () => go(-1));
    next?.addEventListener('click', () => go(1));
    wrap.setAttribute('tabindex', '0');
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    addEventListener('resize', () => { measure(); drag.applyBounds({ minX, maxX: 0 }); update(); });
    update();
  }

  // ---------- Timeline kroků: linka se vykresluje podle scrollu a rozsvěcí kroky ----------
  function timeline() {
    const tlEl = $('[data-timeline]');
    if (!tlEl) return;
    const fill = $('.timeline__fill', tlEl);
    const line = $('.timeline__line', tlEl);
    const steps = $$('.timeline__step', tlEl);
    const nodes = steps.map((s) => $('.timeline__node', s));
    steps.forEach((s) => s.classList.add('is-off'));
    gsap.set(fill, { scaleY: 0 });
    const light = (p) => {
      const lb = line.getBoundingClientRect();
      const filled = lb.top + lb.height * p;
      steps.forEach((s, i) => {
        const n = nodes[i].getBoundingClientRect();
        s.classList.toggle('is-off', filled < n.top + n.height / 2 - 2);
      });
    };
    gsap.to(fill, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: line, start: 'top 60%', end: 'bottom 60%', scrub: 0.6, onUpdate: (self) => light(self.progress), onEnter: () => light(0) },
    });
  }

  // GSAP prvky inicializujeme až při přiblížení sekce (odlehčí hlavní vlákno při načtení)
  const lazy = (sel, fn) => {
    const el = $(sel);
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; o.disconnect(); fn(); }, { rootMargin: '600px 0px' });
    o.observe(el);
  };
  if (!RM) {
    lazy('.hero', parallax);
    lazy('[data-map]', map);
    lazy('[data-timeline]', timeline);
  }
  lazy('[data-slider]', slider);
  }
})();
