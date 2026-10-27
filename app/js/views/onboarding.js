/* First-run account setup. Only a display name is required; everything else can be skipped
   and edited later in Settings. No legal name, email or other personal data is collected. */
window.Cooksy = window.Cooksy || {};
Cooksy.views = Cooksy.views || {};

(() => {
  const { esc } = Cooksy.util;
  const { icon } = Cooksy.ui;
  const STEPS = ['welcome', 'about', 'country', 'cuisines', 'allergies', 'diet'];
  let step = 0;
  let draft = Cooksy.store.emptyProfile();
  let error = '';
  let cuisineQuery = '';

  const rerender = () => Cooksy.app.render();
  const mutate = (fn) => { fn(draft); rerender(); };
  const DIETS = [
    { id: 'vegetarian', label: 'Vegetarian', hint: 'No meat or fish' },
    { id: 'vegan', label: 'Vegan', hint: 'No animal products' },
    { id: 'pescatarian', label: 'Pescatarian', hint: 'Fish, no meat' },
    { id: 'halal', label: 'Halal', hint: 'Flags meat that needs certification' },
  ];

  const views = {
    welcome: () => `
      <img class="onb-logo" src="assets/cooksy-logo.png" alt="Cooksy">
      <h1 style="text-align:center">Find food you can safely cook</h1>
      <p class="lead" style="text-align:center">Recipes from around the world, filtered for your allergies and matched to what’s already in your kitchen.</p>
      <div class="onb-body welcome-points">
        <div><span aria-hidden="true">🛡️</span><p><strong>Allergy-aware.</strong> Recipes with ingredients you avoid are filtered out everywhere.</p></div>
        <div><span aria-hidden="true">🧊</span><p><strong>Cook with what you have.</strong> Track your fridge, pantry and freezer.</p></div>
        <div><span aria-hidden="true">🛒</span><p><strong>Smart shopping list.</strong> Add only what’s missing, grouped by dish.</p></div>
      </div>`,
    about: () => `
      <h1>What should we call you?</h1>
      <p class="lead">A first name or nickname is perfect. We never ask for your legal name.</p>
      <div class="onb-body">
        <div class="field">
          <label for="onb-name">Display name</label>
          <input class="input" id="onb-name" data-input="name" value="${esc(draft.name)}" maxlength="40" autocomplete="nickname" ${error ? 'aria-invalid="true" aria-describedby="onb-err"' : ''}>
          ${error ? `<span class="error-text" id="onb-err">${esc(error)}</span>` : ''}
        </div>
        <div class="field">
          <label for="onb-age">Age <span class="muted">(optional)</span></label>
          <input class="input" id="onb-age" data-input="age" type="number" inputmode="numeric" min="1" max="120" value="${draft.age ?? ''}" style="max-width:140px">
          <span class="hint">Stored only on this device. Under 16? Please cook with an adult nearby.</span>
        </div>
      </div>`,
    country: () => `
      <h1>Where do you cook?</h1>
      <p class="lead">We’ll favour recipes with ingredients that are easier to find where you live and suggest swaps for harder ones.</p>
      <div class="onb-body">
        <div class="field">
          <label for="onb-country">Country</label>
          <select class="select" id="onb-country" data-change="country">
            <option value="">Prefer not to say</option>
            ${Cooksy.COUNTRIES.map((c) => `<option value="${c.code}" ${draft.country === c.code ? 'selected' : ''}>${c.flag} ${esc(c.name)}</option>`).join('')}
          </select>
        </div>
      </div>`,
    cuisines: () => {
      const q = Cooksy.util.normalize(cuisineQuery);
      const list = Cooksy.CUISINES.filter((c) => !q || Cooksy.util.normalize(c.name + ' ' + c.region).includes(q));
      const popular = ['pakistani', 'indian', 'hungarian', 'italian', 'turkish', 'mexican', 'chinese', 'japanese', 'lebanese', 'thai'];
      return `
      <h1>Which cuisines do you love?</h1>
      <p class="lead">Pick as many as you like. They’ll show up first on your home screen.</p>
      <div class="onb-body">
        <div class="search">${icon('search')}<input class="input" id="onb-cq" type="search" placeholder="Search ${Cooksy.CUISINES.length} cuisines" value="${esc(cuisineQuery)}" data-input="cq" aria-label="Search cuisines"></div>
        ${q ? '' : `<div><p class="small muted" style="margin-bottom:8px">Popular</p><div class="chips">${popular.map((id) => chip(Cooksy.cuisineById(id))).join('')}</div></div>`}
        <div class="pick-list"><div class="chips">${list.map(chip).join('') || '<p class="muted small" style="padding:8px">No cuisines match.</p>'}</div></div>
        <p class="small muted" aria-live="polite">${draft.favoriteCuisines.length} selected</p>
      </div>`;
    },
    allergies: () => `
      <h1>Allergies & foods to avoid</h1>
      <p class="lead">Recipes containing these are filtered out. You can change this any time in Settings.</p>
      <div class="onb-body">
        ${Cooksy.views.shared.allergyEditor(draft, 'onb')}
      </div>`,
    diet: () => `
      <h1>Any dietary preferences?</h1>
      <p class="lead">Optional. These filter what we suggest.</p>
      <div class="onb-body">
        <div class="chips">${DIETS.map((d) => `<button type="button" class="chip" data-action="toggle-diet" data-id="${d.id}" aria-pressed="${draft.diets.includes(d.id)}" title="${esc(d.hint)}">${esc(d.label)}</button>`).join('')}</div>
        <p class="small muted">Halal: we flag ingredients like meat that need a halal-certified source. Always check certification yourself.</p>
      </div>`,
  };

  function chip(c) {
    return `<button type="button" class="chip" data-action="toggle-cuisine" data-id="${c.id}" aria-pressed="${draft.favoriteCuisines.includes(c.id)}">${esc(c.name)}</button>`;
  }

  function validate() {
    if (STEPS[step] === 'about') {
      if (!draft.name.trim()) { error = 'Please enter a display name.'; return false; }
      if (draft.age != null && (draft.age < 1 || draft.age > 120)) { error = 'Please enter an age between 1 and 120, or leave it empty.'; return false; }
    }
    error = '';
    return true;
  }

  function finish() {
    const profile = { ...draft, name: draft.name.trim() };
    Cooksy.store.update((s) => {
      s.profile = profile;
      if (!s.inventory.length) s.inventory = Cooksy.store.sampleInventory();
    });
    step = 0;
    draft = Cooksy.store.emptyProfile();
    location.hash = '#/home';
    Cooksy.app.navigate();
    Cooksy.ui.toast(`Welcome to Cooksy, ${profile.name}!`);
  }

  Cooksy.views.onboarding = {
    render() {
      const name = STEPS[step];
      const optional = ['country', 'cuisines', 'allergies', 'diet'].includes(name);
      const last = step === STEPS.length - 1;
      return `
      <div class="onboarding">
        <form class="onb-card" data-submit="next" novalidate aria-labelledby="onb-h">
          ${step ? `<div class="onb-progress" aria-label="Step ${step} of ${STEPS.length - 1}">${STEPS.slice(1).map((_, i) => `<i class="${i < step ? 'is-on' : ''}"></i>`).join('')}</div>` : ''}
          <div id="onb-h">${views[name]()}</div>
          <div class="onb-footer">
            ${step ? `<button type="button" class="btn btn--ghost" data-action="back">${icon('back')} Back</button>` : ''}
            <div class="row">
              ${optional ? '<button type="button" class="btn btn--ghost" data-action="skip">Skip</button>' : ''}
              <button type="submit" class="btn btn--primary">${step === 0 ? 'Get started' : last ? 'Start cooking' : 'Continue'}</button>
            </div>
          </div>
        </form>
      </div>`;
    },
    afterRender(root) {
      if (STEPS[step] === 'about' && !document.activeElement?.id) root.querySelector('#onb-name')?.focus();
    },
    inputs: {
      name: (el) => { draft.name = el.value; },
      age: (el) => { draft.age = el.value === '' ? null : Number(el.value); },
      cq: (el) => { cuisineQuery = el.value; rerender(); },
      ...Cooksy.views.shared.allergyInputs(),
    },
    changes: {
      country: (el) => { draft.country = el.value || null; },
      ...Cooksy.views.shared.allergyChanges(() => draft, mutate),
    },
    actions: {
      back: () => { step = Math.max(0, step - 1); error = ''; rerender(); },
      skip: () => {
        const name = STEPS[step];
        if (name === 'country') draft.country = null;
        if (step === STEPS.length - 1) return finish();
        step++; rerender();
      },
      'toggle-cuisine': (el) => {
        const id = el.dataset.id;
        draft.favoriteCuisines = draft.favoriteCuisines.includes(id) ? draft.favoriteCuisines.filter((x) => x !== id) : [...draft.favoriteCuisines, id];
        rerender();
      },
      'toggle-diet': (el) => {
        const id = el.dataset.id;
        draft.diets = draft.diets.includes(id) ? draft.diets.filter((x) => x !== id) : [...draft.diets, id];
        rerender();
      },
      ...Cooksy.views.shared.allergyActions(() => draft, mutate),
    },
    submits: {
      next: () => {
        if (!validate()) { rerender(); document.getElementById('onb-name')?.focus(); return; }
        if (step === STEPS.length - 1) return finish();
        step++;
        rerender();
        window.scrollTo(0, 0);
      },
    },
  };
})();
