// Poptávkový formulář – odesílá se přes fetch() na Make webhook (viz src/js/form.js).
const { icon } = require('./icons');
const { esc } = require('./layout');

function contactForm(ctx, { id = 'poptavka', preselect = '' } = {}) {
  const { site, services, config } = ctx;
  const options = [...services.map((s) => s.formValue), 'Jiné']
    .map((v) => `<option value="${esc(v)}"${v === preselect ? ' selected' : ''}>${esc(v)}</option>`).join('');
  const f = (name) => `${id}-${name}`;
  const req = '<span class="field__req" aria-hidden="true">*</span>';

  return `<form class="lead-form" id="${id}" novalidate data-endpoint="${esc(config.makeWebhookUrl)}" data-min-seconds="${config.minFillSeconds}">
  <p class="lead-form__legend"><span class="field__req" aria-hidden="true">*</span> Pole označená hvězdičkou jsou povinná.</p>
  <div class="lead-form__fields">
    <div class="field">
      <label for="${f('jmeno')}">Jméno a příjmení${req}</label>
      <input id="${f('jmeno')}" name="jmeno" type="text" autocomplete="name" required minlength="2" maxlength="80" aria-describedby="${f('jmeno')}-err">
      <p class="field__error" id="${f('jmeno')}-err"></p>
    </div>
    <div class="field">
      <label for="${f('telefon')}">Telefon${req}</label>
      <input id="${f('telefon')}" name="telefon" type="tel" autocomplete="tel" inputmode="numeric" pattern="[0-9]{9,15}" required maxlength="15" aria-describedby="${f('telefon')}-err">
      <p class="field__error" id="${f('telefon')}-err"></p>
    </div>
    <div class="field">
      <label for="${f('email')}">E-mail${req}</label>
      <input id="${f('email')}" name="email" type="email" autocomplete="email" inputmode="email" spellcheck="false" required maxlength="120" aria-describedby="${f('email')}-err">
      <p class="field__error" id="${f('email')}-err"></p>
    </div>
    <div class="field">
      <label for="${f('sluzba')}">Služba${req}</label>
      <div class="field__select">
        <select id="${f('sluzba')}" name="sluzba" required aria-describedby="${f('sluzba')}-err">
          <option value=""${preselect ? '' : ' selected'} disabled>Vyberte službu</option>
          ${options}
        </select>
        ${icon('chevronDown', 'icon icon--sm')}
      </div>
      <p class="field__error" id="${f('sluzba')}-err"></p>
    </div>
    <div class="field field--wide">
      <label for="${f('lokalita')}">Lokalita <span class="field__opt">(nepovinné)</span></label>
      <input id="${f('lokalita')}" name="lokalita" type="text" autocomplete="address-level2" maxlength="80" placeholder="např. Jičín" aria-describedby="${f('lokalita')}-err">
      <p class="field__error" id="${f('lokalita')}-err"></p>
    </div>
    <div class="field field--wide">
      <label for="${f('zprava')}">S čím vám mohu pomoct?${req}</label>
      <textarea id="${f('zprava')}" name="zprava" rows="4" required minlength="10" maxlength="2000" aria-describedby="${f('zprava')}-err"></textarea>
      <p class="field__error" id="${f('zprava')}-err"></p>
    </div>
    <div class="field field--wide field--check">
      <input id="${f('souhlas')}" name="souhlas" type="checkbox" value="ano" required aria-describedby="${f('souhlas')}-err">
      <label for="${f('souhlas')}"><span class="check" aria-hidden="true">${icon('check')}</span><span>Souhlasím se <a class="u-link" href="/zasady-ochrany-osobnich-udaju" target="_blank">zásadami ochrany osobních údajů</a>.</span></label>
      <p class="field__error" id="${f('souhlas')}-err"></p>
    </div>
    <div class="hp" aria-hidden="true">
      <label for="${f('web')}">Nevyplňujte</label>
      <input id="${f('web')}" name="web" type="text" tabindex="-1" autocomplete="off">
    </div>
  </div>
  <div class="lead-form__actions">
    <button class="btn btn--volt lead-form__submit" type="submit" data-magnetic><span class="btn__inner"><span class="lead-form__label">Odeslat poptávku</span>${icon('arrow')}</span></button>
    <p class="lead-form__note">Ozvu se vám do ${site.responseHours} hodin.</p>
  </div>
  <div class="lead-form__status" role="status" aria-live="polite"></div>
  <div class="lead-form__done" hidden tabindex="-1">
    <svg class="done-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="m15 27 7.5 7.5L38 19"/></svg>
    <h3>Děkuji, poptávka je odeslaná.</h3>
    <p>Brzy se s vámi spojím a vše probereme. Nejpozději do ${site.responseHours} hodin.</p>
  </div>
</form>`;
}

module.exports = { contactForm };
