/* Pieces shared between onboarding and Settings: the allergy & gluten editor. */
window.Cooksy = window.Cooksy || {};
Cooksy.views = Cooksy.views || {};

(() => {
  const { esc, normalize } = Cooksy.util;
  const { icon } = Cooksy.ui;
  const SUGGESTED_AVOID = ['Mushroom', 'Coriander', 'Pork', 'Alcohol', 'Chili', 'Garlic', 'Onion', 'Avocado'];
  const pending = {}; // text typed into the "avoid" input, per prefix

  function avoidNote(term) {
    const groups = Cooksy.safety.termAllergens(term).map((id) => Cooksy.allergenById(id).short.toLowerCase());
    return groups.length ? ` (covers all ${groups.join(' & ')} ingredients)` : '';
  }

  /** p = profile-like object; prefix keeps element ids unique per screen. */
  function allergyEditor(p, prefix) {
    return `
      <fieldset class="field" style="border:0;padding:0;margin:0">
        <legend class="label" style="margin-bottom:8px">Allergens</legend>
        <div class="chips">${Cooksy.ALLERGENS.map((a) => `<button type="button" class="chip chip--allergen" data-action="toggle-allergen" data-id="${a.id}" aria-pressed="${p.allergens.includes(a.id)}">${p.allergens.includes(a.id) ? icon('check') : ''}${esc(a.label)}</button>`).join('')}</div>
        <span class="hint" style="margin-top:6px">We also check common alternative names, e.g. dairy covers butter, ghee, paneer and yogurt.</span>
      </fieldset>

      <div class="field">
        <label for="${prefix}-avoid">Other ingredients to avoid</label>
        <div class="row" style="flex-wrap:nowrap">
          <input class="input" id="${prefix}-avoid" data-input="avoid-text" data-prefix="${prefix}" value="${esc(pending[prefix] || '')}" placeholder="e.g. mushroom, coriander" autocomplete="off">
          <button type="button" class="btn btn--secondary" data-action="add-avoid" data-prefix="${prefix}">Add</button>
        </div>
        ${p.avoid.length ? `<div class="chips" style="margin-top:8px">${p.avoid.map((t, i) => `<button type="button" class="chip chip--removable" data-action="remove-avoid" data-index="${i}" aria-label="Remove ${esc(t)}">${esc(t)}${esc(avoidNote(t))} ${icon('x')}</button>`).join('')}</div>` : ''}
        <div class="chips" style="margin-top:4px">${SUGGESTED_AVOID.filter((s) => !p.avoid.some((t) => normalize(t) === normalize(s))).map((s) => `<button type="button" class="chip" data-action="quick-avoid" data-term="${esc(s)}">${icon('plus')}${esc(s)}</button>`).join('')}</div>
      </div>

      <div class="field">
        <label class="switch">
          <input type="checkbox" data-change="gluten-free" ${p.glutenFree ? 'checked' : ''}>
          <span class="switch__track" aria-hidden="true"></span>
          <span class="switch__text"><strong>I need gluten-free recipes</strong><span>Hides recipes with wheat, barley, rye and similar, and flags packaged ingredients that need a gluten-free label.</span></span>
        </label>
        ${p.glutenFree ? `<div class="banner banner--warn" role="note" style="margin-top:8px">${icon('alert')}<div><strong>Every packaged ingredient must be certified or clearly labelled gluten-free.</strong>That includes spices and spice blends, stock cubes, sauces, oats and flours, which are often processed alongside wheat. Prevent cross-contamination with clean boards, pans, colanders and toasters, and fresh frying oil.</div></div>` : ''}
      </div>

      <p class="small muted">${icon('info', 'style="width:15px;height:15px;vertical-align:-2px"')} Cooksy filters by the ingredients listed in recipes. It can’t guarantee a dish is allergen-free, so always check product labels.</p>`;
  }

  /** get(): current profile-like object; mutate(fn): apply a change and re-render. */
  function allergyActions(get, mutate) {
    const addTerm = (term) => {
      const t = term.trim().replace(/\s+/g, ' ');
      if (!t) return;
      if (get().avoid.some((x) => normalize(x) === normalize(t))) { Cooksy.ui.toast(`“${t}” is already on your list`); return; }
      mutate((p) => { p.avoid = [...p.avoid, t]; });
    };
    return {
      'toggle-allergen': (el) => {
        const id = el.dataset.id;
        mutate((p) => { p.allergens = p.allergens.includes(id) ? p.allergens.filter((x) => x !== id) : [...p.allergens, id]; });
      },
      'add-avoid': (el) => {
        const prefix = el.dataset.prefix;
        const terms = (pending[prefix] || '').split(',');
        pending[prefix] = '';
        terms.forEach(addTerm);
        if (!terms.some((t) => t.trim())) mutate(() => {});
        document.getElementById(`${prefix}-avoid`)?.focus();
      },
      'quick-avoid': (el) => addTerm(el.dataset.term),
      'remove-avoid': (el) => {
        const i = Number(el.dataset.index);
        mutate((p) => { p.avoid = p.avoid.filter((_, j) => j !== i); });
      },
    };
  }

  function allergyInputs() {
    return { 'avoid-text': (el) => { pending[el.dataset.prefix] = el.value; } };
  }

  function allergyChanges(get, mutate) {
    return { 'gluten-free': (el) => mutate((p) => { p.glutenFree = el.checked; }) };
  }

  // Enter in an "avoid" box adds the term instead of submitting the surrounding form.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches?.('[data-input="avoid-text"]')) {
      e.preventDefault();
      e.target.parentElement.querySelector('[data-action="add-avoid"]')?.click();
    }
  });

  Cooksy.views.shared = { allergyEditor, allergyActions, allergyInputs, allergyChanges };
})();
