/* Lightbox galerie: plynulý přechod z miniatury (FLIP), šipky, Esc, swipe na mobilu.
   Bez JS vedou miniatury přímo na velký obrázek. Obsahuje i filtr kategorií galerie. */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]rm\b/.test(location.search);
  const EASE = 'cubic-bezier(.22, 1, .36, 1)';
  const items = [...document.querySelectorAll('a[data-lightbox]')];
  if (!items.length) return;

  // ---------- filtr kategorií ----------
  const filters = document.querySelector('[data-filters]');
  if (filters) {
    filters.hidden = false;
    const btns = [...filters.querySelectorAll('button')];
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.filter;
      const grid = document.querySelector('.gallery__grid');
      const shown = [];
      grid.querySelectorAll('.g-item').forEach((it) => {
        const show = !f || it.dataset.category === f;
        it.hidden = !show;
        if (show) shown.push(it);
      });
      if (!RM) shown.forEach((it, i) => it.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: i * 40, easing: EASE, fill: 'backwards' }));
    });
  }

  // ---------- dialog ----------
  const icon = (d) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Zvětšená fotografie');
  dlg.innerHTML = `<div class="lightbox__stage"><img class="lightbox__img" alt="" decoding="async"></div>
    <button class="lightbox__btn lightbox__close lightbox__ui" type="button" aria-label="Zavřít">${icon('<path d="M6 6l12 12M18 6 6 18"/>')}</button>
    <div class="lightbox__bar lightbox__ui">
      <div><p class="lightbox__caption"></p><p class="lightbox__count" aria-live="polite"></p></div>
      <div class="lightbox__nav">
        <button class="lightbox__btn" type="button" data-dir="-1" aria-label="Předchozí fotka">${icon('<path d="M15 5 8 12l7 7"/>')}</button>
        <button class="lightbox__btn" type="button" data-dir="1" aria-label="Další fotka">${icon('<path d="m9 5 7 7-7 7"/>')}</button>
      </div>
    </div>`;
  document.body.appendChild(dlg);
  const stage = dlg.querySelector('.lightbox__stage');
  const img = dlg.querySelector('.lightbox__img');
  const caption = dlg.querySelector('.lightbox__caption');
  const count = dlg.querySelector('.lightbox__count');

  let list = [];
  let index = 0;
  let busy = false;

  const groupItems = (el) => items.filter((x) => x.dataset.lightbox === el.dataset.lightbox && !x.hidden);
  const preload = (i) => { const it = list[(i + list.length) % list.length]; if (it) { const p = new Image(); p.src = it.href; } };

  async function show(i) {
    index = (i + list.length) % list.length;
    const it = list[index];
    img.src = it.href;
    img.alt = it.dataset.caption || '';
    caption.textContent = it.dataset.caption || '';
    count.textContent = `${index + 1} / ${list.length}`;
    dlg.querySelector('.lightbox__nav').hidden = list.length < 2;
    try { await img.decode(); } catch (e) { /* obrázek se dočte později */ }
    preload(index + 1); preload(index - 1);
  }

  // FLIP: obrázek vyletí z místa miniatury do středu (a zpět)
  function flip(from, reverse = false) {
    const a = from.getBoundingClientRect();
    const b = img.getBoundingClientRect();
    const start = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
    const frames = [{ transform: start, borderRadius: '10px' }, { transform: 'none', borderRadius: '6px' }];
    return img.animate(reverse ? frames.reverse() : frames, { duration: reverse ? 420 : 560, easing: EASE, fill: 'both' }).finished;
  }

  async function open(el) {
    if (busy) return;
    busy = true;
    list = groupItems(el);
    dlg.showModal();
    document.body.style.overflow = 'hidden';
    window.__lenis?.stop();
    img.style.visibility = 'hidden';
    await show(list.indexOf(el));
    img.style.visibility = '';
    dlg.classList.add('is-open');
    if (!RM) await flip(el);
    busy = false;
  }

  async function close() {
    if (busy) return;
    busy = true;
    const thumb = list[index];
    const r = thumb.getBoundingClientRect();
    dlg.classList.remove('is-open');
    if (!RM && r.bottom > 0 && r.top < innerHeight) await flip(thumb, true);
    else if (!RM) await img.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'both' }).finished;
    img.getAnimations().forEach((a) => a.cancel());
    dlg.close();
    document.body.style.overflow = '';
    window.__lenis?.start();
    thumb.focus({ preventScroll: true });
    busy = false;
  }

  async function go(dir) {
    if (busy || list.length < 2) return;
    busy = true;
    if (!RM) await img.animate([{ transform: img.style.transform || 'none', opacity: 1 }, { transform: `translateX(${-dir * 60}px)`, opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'both' }).finished;
    img.style.transform = '';
    await show(index + dir);
    if (!RM) await img.animate([{ transform: `translateX(${dir * 60}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: EASE, fill: 'both' }).finished;
    img.getAnimations().forEach((a) => a.cancel());
    busy = false;
  }

  items.forEach((el) => el.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    open(el);
  }));
  dlg.querySelector('.lightbox__close').addEventListener('click', close);
  dlg.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.dir)));
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
  // klik mimo fotku zavře
  stage.addEventListener('click', (e) => { if (e.target === stage && !moved) close(); });

  // ---------- swipe ----------
  let x0 = null, dx = 0, moved = false;
  stage.addEventListener('pointerdown', (e) => { if (busy) return; x0 = e.clientX; dx = 0; moved = false; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => {
    if (x0 === null) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) > 4) moved = true;
    img.style.transform = `translateX(${dx}px) rotate(${dx / 60}deg)`;
  });
  const end = () => {
    if (x0 === null) return;
    x0 = null;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    else {
      if (!RM && dx) img.animate([{ transform: img.style.transform }, { transform: 'none' }], { duration: 300, easing: EASE });
      img.style.transform = '';
    }
    setTimeout(() => { moved = false; }, 0);
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
})();
