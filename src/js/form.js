/* Poptávkový formulář → Make webhook (JSON POST).
   URL webhooku je v data-endpoint (z config.json / MAKE_WEBHOOK_URL při buildu).
   Ochrana proti spamu: honeypot pole „web“ + minimální doba vyplnění (data-min-seconds),
   validace polí (telefon jen číslice, e-mail s @ a doménou, jméno bez čísel/odkazů, zpráva bez odkazů a kódu),
   očištění a zkrácení hodnot, blokace dvojího odeslání, limit 1 poptávka / 60 s a 3 / hod. z jednoho prohlížeče.
   Make scénář má zahodit requesty s honeypot ≠ "" nebo fill_seconds < min (viz docs/make-formular.md). */
(() => {
  const PHONE = '775 687 877';
  const PHONE_INTL = '+420775687877';
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

  // UTM parametry si pamatujeme po dobu návštěvy (uživatel může přejít na jinou stránku)
  const utm = (() => {
    const params = new URLSearchParams(location.search);
    let stored = {};
    try { stored = JSON.parse(sessionStorage.getItem('el_utm') || '{}'); } catch (e) { /* storage nedostupné */ }
    const fresh = {};
    UTM_KEYS.forEach((k) => { if (params.get(k)) fresh[k] = params.get(k).slice(0, 200); });
    const merged = Object.keys(fresh).length ? fresh : stored;
    try { sessionStorage.setItem('el_utm', JSON.stringify(merged)); } catch (e) { /* storage nedostupné */ }
    return merged;
  })();

  const messages = {
    jmeno: { valueMissing: 'Napište prosím své jméno.', invalid: 'Jméno pište prosím jen písmeny (bez čísel a odkazů).' },
    telefon: { valueMissing: 'Bez telefonu se vám těžko ozvu.', invalid: 'Telefon vypadá neúplně – stačí 9 číslic, např. 775687877.', stripped: 'Do telefonu pište jen číslice, bez mezer a dalších znaků.' },
    email: { valueMissing: 'Vyplňte prosím e-mail.', noAt: 'V e-mailu chybí zavináč (@).', invalid: 'E-mail nemá správný tvar (např. jan@email.cz).' },
    sluzba: { valueMissing: 'Vyberte, o jakou službu jde.' },
    lokalita: { invalid: 'Lokalitu pište prosím bez odkazů a speciálních znaků.' },
    zprava: { valueMissing: 'Napište pár slov, s čím potřebujete pomoct.', short: 'Napište prosím aspoň pár slov (min. 10 znaků).', link: 'Odkazy a kód prosím nevkládejte. Fotky mi klidně pošlete na WhatsApp.' },
    souhlas: { valueMissing: 'Bez souhlasu poptávku odeslat nemohu.' },
  };

  // --- pravidla ---
  const RE_LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|info|ru|cn|xyz|top|biz|io|link|click|site|online)\b)/i;
  const RE_CODE = /[<>{}[\]\\`]|&#|javascript:/i;
  const RE_NAME = /^[\p{L}][\p{L}\s.'’-]*$/u; // písmena (i s diakritikou), mezera, tečka, apostrof, pomlčka
  const RE_PLACE = /^[\p{L}0-9][\p{L}0-9\s.,'’()/-]*$/u;
  const RE_EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,24}$/;
  // telefon: jen číslice; 9 číslic (ČR/SR) nebo s předvolbou 420/421… (12 číslic) či 00… (až 15)
  const phoneOk = (v) => /^\d{9}$/.test(v) || /^(42[01]\d{9}|00\d{10,13}|[1-9]\d{10,14})$/.test(v);
  const clean = (v) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '');
  const oneLine = (v) => clean(v).replace(/\s+/g, ' ').trim();

  function ruleMessage(input) {
    const v = input.value.trim();
    const m = messages[input.name] || {};
    if (!v) return input.required ? m.valueMissing : '';
    switch (input.name) {
      case 'jmeno': return v.length < 2 || !RE_NAME.test(v) || RE_LINK.test(v) ? m.invalid : '';
      case 'telefon': return phoneOk(v) ? '' : m.invalid;
      case 'email': if (!v.includes('@')) return m.noAt; return RE_EMAIL.test(v) && !v.includes('..') ? '' : m.invalid;
      case 'lokalita': return !RE_PLACE.test(v) || RE_LINK.test(v) ? m.invalid : '';
      case 'zprava': if (RE_LINK.test(v) || RE_CODE.test(v)) return m.link; return v.replace(/\s/g, '').length < 10 ? m.short : '';
      case 'sluzba': return [...input.options].some((o) => o.value === input.value && !o.disabled) ? '' : m.valueMissing;
      default: return '';
    }
  }

  function setError(input, msg) {
    const field = input.closest('.field');
    const err = field && field.querySelector('.field__error');
    if (field) {
      field.classList.remove('is-invalid');
      if (msg) { void field.offsetWidth; field.classList.add('is-invalid'); }
    }
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
  }

  function validateField(input) {
    let msg = '';
    if (input.type === 'checkbox') msg = input.required && !input.checked ? messages[input.name].valueMissing : '';
    else msg = ruleMessage(input);
    setError(input, msg);
    return !msg;
  }

  // telefon: cokoli jiného než číslice se rovnou odfiltruje (i při vložení „+420 775 687 877“)
  function filterPhone(input) {
    const raw = input.value;
    const digits = raw.replace(/\D/g, '').slice(0, 15);
    if (digits === raw) return false;
    const caret = input.selectionStart == null ? raw.length : input.selectionStart;
    const before = raw.slice(0, caret).replace(/\D/g, '').length;
    input.value = digits;
    try { input.setSelectionRange(before, before); } catch (e) { /* type=tel podporuje, jistota */ }
    // hlášku ukážeme jen když člověk napsal znak navíc, ne při vložení čísla s mezerami či +420
    return /[^\d\s+()./-]/.test(raw);
  }

  // limit odeslání z jednoho prohlížeče: min. 60 s mezi poptávkami, max. 3 za hodinu
  const RATE_KEY = 'el_form_sent';
  const sentLog = () => { try { return JSON.parse(localStorage.getItem(RATE_KEY) || '[]').filter((t) => Date.now() - t < 3600e3); } catch (e) { return []; } };
  const rateLimited = () => { const log = sentLog(); return (log.length && Date.now() - log[log.length - 1] < 60e3) || log.length >= 3; };
  const logSent = () => { try { localStorage.setItem(RATE_KEY, JSON.stringify([...sentLog(), Date.now()])); } catch (e) { /* storage nedostupné */ } };

  function initForm(form) {
    const started = Date.now();
    const minSeconds = parseFloat(form.dataset.minSeconds) || 4;
    const submit = form.querySelector('.lead-form__submit');
    const label = form.querySelector('.lead-form__label');
    const status = form.querySelector('.lead-form__status');
    const done = form.querySelector('.lead-form__done');
    const inputs = [...form.querySelectorAll('input:not([name="web"]), select, textarea')];

    // předvyplnění služby z URL (?sluzba=Chytrá domácnost) – např. z CTA na podstránkách
    const pre = new URLSearchParams(location.search).get('sluzba');
    const select = form.querySelector('select[name="sluzba"]');
    if (pre && select && [...select.options].some((o) => o.value === pre)) select.value = pre;

    inputs.forEach((i) => {
      i.addEventListener('blur', () => { if (i.value || i.type === 'checkbox') validateField(i); });
      i.addEventListener('input', () => {
        if (i.name === 'telefon' && filterPhone(i)) { setError(i, messages.telefon.stripped); return; }
        if (i.name === 'email' && /\s/.test(i.value)) i.value = i.value.replace(/\s/g, '');
        if (i.closest('.field')?.classList.contains('is-invalid')) validateField(i);
      });
      i.addEventListener('change', () => { if (i.type === 'checkbox' || i.tagName === 'SELECT') validateField(i); });
    });

    const setBusy = (busy) => {
      submit.disabled = busy;
      submit.setAttribute('aria-busy', String(busy));
      label.textContent = busy ? 'Odesílám…' : 'Odeslat poptávku';
      const icon = submit.querySelector('.icon, .spinner');
      if (busy && icon) icon.outerHTML = '<span class="spinner" aria-hidden="true"></span>';
      if (!busy && submit.querySelector('.spinner')) submit.querySelector('.spinner').outerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    };

    const showError = () => {
      status.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 9.5v4.5M12 16.8v.2"/></svg>`
        + `<p>Něco se pokazilo. Na tohle je i pan elektrikář krátký. Zavolejte mi prosím na <a href="tel:${PHONE_INTL}">${PHONE}</a>, nebo to zkuste za chvíli znovu.</p>`;
    };

    const showDone = () => {
      done.hidden = false;
      form.classList.add('is-done');
      if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.from(done.children, { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.1, ease: 'expo.out' });
      }
      done.focus({ preventScroll: true });
      const top = form.getBoundingClientRect().top + window.scrollY - 90;
      if (window.__lenis) window.__lenis.scrollTo(top, { duration: 1 }); else window.scrollTo({ top, behavior: 'smooth' });
    };

    let sending = false;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return; // dvojklik / opakovaný Enter
      status.innerHTML = '';
      const tel = form.querySelector('[name="telefon"]');
      if (tel) filterPhone(tel);
      const invalid = inputs.filter((i) => !validateField(i));
      if (invalid.length) { invalid[0].focus(); return; }

      const data = new FormData(form);
      const fillSeconds = Math.round((Date.now() - started) / 1000);
      const honeypot = (data.get('web') || '').toString();

      // spam: tváříme se, že je odesláno, ale nic neposíláme
      if (honeypot || fillSeconds < minSeconds) { showDone(); return; }

      if (rateLimited()) {
        status.innerHTML = `<p>Poptávku jste už odeslali, ozvu se. Pokud spěcháte, zavolejte mi na <a href="tel:${PHONE_INTL}">${PHONE}</a>.</p>`;
        return;
      }

      const val = (k, max) => clean((data.get(k) || '').toString()).trim().slice(0, max);
      const payload = {
        form: form.id,
        jmeno: oneLine(val('jmeno', 80)),
        telefon: val('telefon', 15).replace(/\D/g, ''),
        email: val('email', 120).replace(/\s/g, '').toLowerCase(),
        sluzba: val('sluzba', 60),
        lokalita: oneLine(val('lokalita', 80)),
        zprava: val('zprava', 2000).replace(/\n{3,}/g, '\n\n'),
        souhlas_gdpr: data.get('souhlas') === 'ano',
        meta: {
          stranka: location.pathname,
          url: location.href.split('#')[0],
          titulek: document.title,
          referrer: document.referrer || null,
          timestamp: new Date().toISOString(),
          fill_seconds: fillSeconds,
          honeypot,
          utm,
        },
      };

      const endpoint = form.dataset.endpoint;
      if (!endpoint) { console.warn('Formulář: chybí URL Make webhooku (config.json → makeWebhookUrl).'); showError(); return; }

      sending = true;
      setBusy(true);
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
        clearTimeout(timer);
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'generate_lead', form_id: form.id, lead_service: payload.sluzba, page_path: location.pathname });
        logSent();
        form.reset();
        showDone();
      } catch (err) {
        console.error('Formulář: odeslání selhalo', err);
        showError();
      } finally {
        sending = false;
        setBusy(false);
      }
    });
  }

  document.querySelectorAll('.lead-form').forEach(initForm);

  // CTA s data-service (např. „Chci wallbox“) předvyplní službu ve formuláři
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-service]');
    const select = document.querySelector('#contact-me select[name="sluzba"]');
    if (!a || !select) return;
    if ([...select.options].some((o) => o.value === a.dataset.service)) {
      select.value = a.dataset.service;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
})();
