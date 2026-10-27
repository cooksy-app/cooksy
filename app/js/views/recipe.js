/* Recipe detail: safety, substitutions, kitchen comparison, steps, nutrition, shopping. */
window.Cooksy = window.Cooksy || {};
Cooksy.views = Cooksy.views || {};

(() => {
  const { esc, minutes, plural, lineText } = Cooksy.util;
  const { icon, art, favButton, dietTags, labelReminder, empty } = Cooksy.ui;
  const S = Cooksy.safety;
  const servingsById = {};
  const doneSteps = {};
  const openSwaps = new Set();

  const ctx = (id) => {
    const state = Cooksy.store.get();
    const recipe = Cooksy.catalog.byId(id);
    if (!recipe) return null;
    const evaluation = S.evaluateRecipe(recipe, state.profile, state.subChoices);
    const rows = Cooksy.kitchen.compare(recipe, evaluation, state.inventory, state.matchOverrides);
    const servings = servingsById[id] || recipe.servings;
    return { state, recipe, evaluation, rows, servings, factor: servings / recipe.servings };
  };

  const allergenNames = (set) => [...set].map((a) => Cooksy.allergenById(a)?.short).filter(Boolean);

  function safetyBanner({ recipe, evaluation }) {
    const out = [];
    if (evaluation.status === 'blocked') {
      out.push(`<div class="banner banner--danger" role="alert">${icon('alert')}<div><strong>Not suitable for your settings</strong>
        This recipe contains: ${evaluation.conflicts.map((l) => `<b>${esc(l.ing.name)}</b> (${esc(l.check.blocks.map((b) => b.text.toLowerCase()).join(', '))})`).join('; ')}.
        ${evaluation.conflicts.some((l) => !l.safeOptions.length) ? 'There is no safe substitution in our catalog for at least one of these.' : ''}
        <br><a class="link" href="#/settings">Review your settings</a></div></div>`);
    } else if (evaluation.status === 'swap') {
      out.push(`<div class="banner banner--warn" role="alert">${icon('swap')}<div><strong>Needs a swap before it suits you</strong>
        ${evaluation.conflicts.map((l) => `<b>${esc(l.ing.name)}</b>: ${esc(l.check.blocks.map((b) => b.text.toLowerCase()).join(', '))}`).join('; ')}.
        Choose a substitution in the ingredient list. We never swap ingredients without asking.</div></div>`);
    } else if (evaluation.lines.some((l) => l.substituted)) {
      out.push(`<div class="banner banner--info">${icon('check')}<div><strong>Using your swaps</strong>${evaluation.lines.filter((l) => l.substituted).map((l) => (l.omitted ? `leaving out ${esc(l.original.name)}` : `${esc(l.ing.name)} instead of ${esc(l.original.name)}`)).join('; ')}.</div></div>`);
    }
    if (evaluation.optionalConflicts.length) {
      out.push(`<div class="banner banner--warn">${icon('alert')}<div><strong>Leave out the optional ${esc(evaluation.optionalConflicts.map((l) => l.ing.name).join(', '))}</strong>${esc(evaluation.optionalConflicts.map((l) => l.check.blocks.map((b) => b.text).join(', ')).join('; '))}.</div></div>`);
    }
    const cautions = evaluation.cautions.filter((l) => !l.line.optional || !l.omitted);
    if (cautions.length) {
      out.push(`<div class="banner banner--saffron">${icon('label')}<div><strong>Check these labels for you</strong><ul>${cautions.map((l) => `<li><b>${esc(l.ing.name)}</b>: ${esc(l.check.cautions.map((c) => c.text).join(' '))}</li>`).join('')}</ul></div></div>`);
    }
    return out.join('');
  }

  function swapPanel(recipe, l, profile, current) {
    const options = S.substitutionOptions(l.original, profile);
    if (!options.length) return '';
    return `<div class="sub-options" role="group" aria-label="Substitutions for ${esc(l.original.name)}">
      ${options.map((o) => {
        const bad = o.check.blocks.length;
        const pressed = current === o.id;
        return `<button type="button" class="sub-option" data-action="choose-sub" data-recipe="${recipe.id}" data-ing="${l.original.id}" data-sub="${o.id}" aria-pressed="${pressed}" ${bad ? 'disabled style="opacity:.55;cursor:not-allowed"' : ''}>
          <span style="flex:1"><strong>${esc(o.name)}${pressed ? ' · selected' : ''}</strong><span>${esc(o.note)}</span>
          ${bad ? `<span class="flag flag--danger" style="display:flex">${icon('x')} ${esc(o.check.blocks.map((b) => b.text).join(', '))}</span>` : ''}
          ${!bad && o.check.cautions.length ? `<span class="flag flag--warn" style="display:flex">${icon('label')} ${esc(o.check.cautions.map((c) => c.text).join(' '))}</span>` : ''}</span>
        </button>`;
      }).join('')}
      ${current ? `<button type="button" class="btn btn--ghost btn--sm" data-action="choose-sub" data-recipe="${recipe.id}" data-ing="${l.original.id}" data-sub="">Use the original ${esc(l.original.name.toLowerCase())}</button>` : ''}
    </div>`;
  }

  function ingredientRow(c, r) {
    const { recipe, state, factor } = c;
    const l = r.l;
    const ing = l.ing || l.original;
    const market = state.profile.country ? Cooksy.countryByCode(state.profile.country)?.market : null;
    const choice = state.subChoices?.[recipe.id]?.[l.original.id] || '';
    const key = `${recipe.id}:${l.original.id}`;
    const statusIcon = { have: icon('check'), maybe: icon('question'), missing: icon('plus'), skip: icon('minus') }[r.status];
    const statusLabel = { have: 'You have this', maybe: 'You might have this', missing: 'Missing', skip: 'Not tracked' }[r.status];
    const extra = [];

    if (l.substituted) {
      extra.push(`<span class="flag flag--info">${icon('swap')} ${l.omitted ? 'Leaving this out (your choice)' : `Swapped from ${esc(l.original.name)} (your choice)`}</span>`);
    }
    l.check.blocks.forEach((b) => extra.push(`<span class="flag flag--danger">${icon('alert')} ${esc(b.text)}${l.line.optional ? ' (optional, leave it out)' : ''}</span>`));
    l.check.cautions.forEach((cn) => extra.push(`<span class="flag flag--warn">${icon('label')} ${esc(cn.text)}</span>`));
    if (ing?.note && (ing.packaged || ing.gfLabel)) extra.push(`<span class="flag flag--muted">${icon('info')} ${esc(ing.note)}</span>`);
    if (market && ing?.hard?.includes(market)) {
      extra.push(`<span class="flag flag--muted">${icon('globe')} Can be harder to find in ${esc(Cooksy.countryByCode(state.profile.country).name)}. ${esc(ing.hardNote || '')}</span>`);
    }

    if (!l.omitted && r.status !== 'skip') {
      if (r.items.length) {
        const it = r.items[0];
        extra.push(`<span class="flag flag--muted">${icon('kitchen')} ${r.detected === 'maybe' ? `You have “${esc(it.name)}”. Is that the same?` : `In your ${esc(it.location)}: ${esc(it.name)}${it.qty ? ' · ' + esc(it.qty) : ''}. Check you have enough.`}</span>`);
      }
      if (r.overridden) extra.push(`<span class="flag flag--muted">${icon('edit')} Marked by you</span>`);
    }

    const canSwap = (l.original?.subs || []).length;
    const actions = [];
    if (!l.omitted && r.status !== 'skip') {
      actions.push(`<button type="button" class="mini-btn" data-action="mark" data-recipe="${recipe.id}" data-ing="${ing.id}" data-val="have" aria-pressed="${r.status === 'have'}">I have it</button>`);
      actions.push(`<button type="button" class="mini-btn" data-action="mark" data-recipe="${recipe.id}" data-ing="${ing.id}" data-val="missing" aria-pressed="${r.status === 'missing'}">Need it</button>`);
    }
    if (canSwap) actions.push(`<button type="button" class="mini-btn" data-action="toggle-swaps" data-key="${key}" aria-expanded="${openSwaps.has(key) || (!!l.check.blocks.length && !l.line.optional)}">${icon('swap', 'style="width:12px;height:12px;vertical-align:-1px"')} Swaps</button>`);

    const showSwaps = canSwap && (openSwaps.has(key) || (l.check.blocks.length && !l.line.optional));
    return `
      <li class="ing-row">
        <span class="ing-row__status ing-row__status--${r.status}" title="${statusLabel}">${statusIcon}<span class="sr-only">${statusLabel}</span></span>
        <div>
          <div class="ing-row__name">${esc(l.omitted ? l.original.name : ing.name)}${l.line.optional ? ' <span class="muted small">(optional)</span>' : ''}</div>
          ${l.line.note ? `<div class="ing-row__note">${esc(l.line.note)}</div>` : ''}
          ${extra.length ? `<div class="ing-row__extra">${extra.join('')}</div>` : ''}
          ${actions.length ? `<div class="ing-row__actions">${actions.join('')}</div>` : ''}
          ${showSwaps ? swapPanel(recipe, l, state.profile, choice) : ''}
        </div>
        <span class="ing-row__qty">${l.omitted ? '—' : esc(lineText(l.line, factor))}</span>
      </li>`;
  }

  function facts(recipe) {
    const f = recipe.facts;
    const contains = allergenNames(f.contains);
    const may = allergenNames(f.may);
    const opt = allergenNames(f.optionalContains);
    return `
      <div class="panel">
        <h3>Allergen information</h3>
        <dl class="small" style="margin:12px 0 0;display:grid;gap:8px">
          <div><dt class="muted">Listed ingredients contain</dt><dd style="margin:0;font-weight:700">${contains.length ? esc(contains.join(', ')) : 'None of the 14 major allergens'}</dd></div>
          ${opt.length ? `<div><dt class="muted">Optional ingredients add</dt><dd style="margin:0;font-weight:700">${esc(opt.join(', '))}</dd></div>` : ''}
          ${may.length ? `<div><dt class="muted">Depending on brand, may contain</dt><dd style="margin:0;font-weight:700">${esc(may.join(', '))}</dd></div>` : ''}
        </dl>
        <div class="tags" style="margin-top:12px">${dietTags(recipe, 4)}</div>
        ${f.halalNeedsCert ? '<p class="small muted" style="margin-top:8px">* Halal when made with halal-certified meat.</p>' : ''}
        ${f.vegCheck ? '<p class="small muted" style="margin-top:8px">Vegetarian if you choose cheese made without animal rennet.</p>' : ''}
        <p class="small muted" style="margin-top:10px">Based on listed ingredients only. Not a guarantee. Always check labels.</p>
      </div>`;
  }

  function nutrition(recipe) {
    const n = recipe.nutrition;
    return `
      <div class="panel">
        <div class="row row--between"><h3>Nutrition</h3><span class="tag">Estimate · per serving</span></div>
        <div class="nutri" style="margin-top:14px">
          <div><strong>${n.kcal}</strong><span>kcal</span></div>
          <div><strong>${n.protein} g</strong><span>protein</span></div>
          <div><strong>${n.fat} g</strong><span>fat</span></div>
          <div><strong>${n.carbs} g</strong><span>carbs</span></div>
        </div>
        <p class="small muted" style="margin-top:12px">Rough estimate from typical values for the main ingredients at the original serving size. Brands, portion sizes and swaps change the real values. Not lab-tested.${recipe.nutritionNote ? ' ' + esc(recipe.nutritionNote) : ''}</p>
      </div>`;
  }

  function localNotes(c) {
    const hard = Cooksy.catalog.hardToFind(c.recipe, c.state.profile);
    const country = Cooksy.countryByCode(c.state.profile.country);
    if (!country) {
      return `<div class="panel"><h3>Ingredient availability</h3><p class="small muted" style="margin-top:8px">Add your country in <a class="link" href="#/settings">Settings</a> to see which ingredients may be harder to find where you live.</p></div>`;
    }
    return `<div class="panel"><h3>Cooking in ${country.flag} ${esc(country.name)}</h3>
      ${hard.length ? `<ul class="small" style="margin:10px 0 0;padding-left:18px;display:grid;gap:8px">${hard.map((i) => `<li><b>${esc(i.name)}</b> can be harder to find. ${esc(i.hardNote || '')}${i.subs.length ? ' Tap “Swaps” on the ingredient for options.' : ''}</li>`).join('')}</ul>`
        : '<p class="small muted" style="margin-top:8px">All main ingredients are usually easy to find in your area.</p>'}
    </div>`;
  }

  Cooksy.views.recipe = {
    title: ({ id }) => Cooksy.catalog.byId(id)?.name || 'Recipe',
    render({ id }) {
      const c = ctx(id);
      if (!c) return empty({ icon: '🍽️', title: 'Recipe not found', text: 'It may have been removed from the sample catalog.', action: '<a class="btn btn--primary" href="#/explore">Explore recipes</a>' });
      const { recipe, rows, servings, evaluation } = c;
      const stats = Cooksy.kitchen.cookability(rows);
      const done = doneSteps[id] || new Set();
      const cuisine = recipe.cuisineInfo;
      return `
        <a class="back-link" href="javascript:history.back()" data-action="back">${icon('back')} Back</a>
        <div class="recipe">
          <div>
            <div style="position:relative">${art(recipe, 'art--hero')}</div>
            <div class="recipe__title-row">
              <div>
                <a class="eyebrow" style="text-decoration:none" href="#/cuisine/${recipe.cuisine}">${esc(cuisine?.name || '')} · ${esc(recipe.region)}</a>
                <h1 style="margin-top:6px">${esc(recipe.name)}</h1>
              </div>
              ${favButton(recipe.id)}
            </div>
            <p class="recipe__desc">${esc(recipe.description)}</p>
            <div class="tags" style="margin-top:12px">${dietTags(recipe, 4)}${[...recipe.facts.contains].map((a) => `<span class="tag tag--danger">Contains ${esc(Cooksy.allergenById(a).short.toLowerCase())}</span>`).join('')}</div>
            <dl class="stats">
              <div><dt>Prep</dt><dd>${minutes(recipe.prep)}</dd></div>
              <div><dt>Cook</dt><dd>${recipe.cook ? minutes(recipe.cook) : 'No cooking'}</dd></div>
              <div><dt>Serves</dt><dd>${recipe.servings}</dd></div>
              <div><dt>Difficulty</dt><dd>${recipe.difficulty}</dd></div>
            </dl>
            ${recipe.soak ? `<p class="small" style="margin-top:12px">${icon('clock', 'style="width:15px;height:15px;vertical-align:-2px"')} <b>Plan ahead:</b> ${esc(recipe.soak)}</p>` : ''}

            <div class="stack" style="--stack:10px;margin-top:22px">${safetyBanner(c)}${labelReminder(evaluation.status === 'ok' && !Cooksy.store.get().profile.glutenFree)}</div>

            <section class="section" aria-labelledby="ing-h">
              <div class="section__head" style="align-items:center;flex-wrap:wrap">
                <div><h2 id="ing-h">Ingredients</h2><p>You have ${stats.have}${stats.maybe ? ` (+${stats.maybe} maybe)` : ''} of ${stats.total} · compared with <a class="link" href="#/kitchen">My Kitchen</a></p></div>
                <div class="servings" role="group" aria-label="Servings">
                  <button class="icon-btn icon-btn--sm icon-btn--plain" data-action="servings" data-delta="-1" aria-label="Fewer servings" ${servings <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
                  <output aria-live="polite">${plural(servings, 'serving')}</output>
                  <button class="icon-btn icon-btn--sm icon-btn--plain" data-action="servings" data-delta="1" aria-label="More servings" ${servings >= 24 ? 'disabled' : ''}>${icon('plus')}</button>
                </div>
              </div>
              <div class="panel" style="padding-top:8px;padding-bottom:8px">
                <ul class="ing-list">${rows.map((r) => ingredientRow(c, r)).join('')}</ul>
              </div>
              <div class="row" style="margin-top:14px">
                <button class="btn btn--accent" data-action="add-missing">${icon('cart')} Add missing ingredients to shopping list</button>
                <span class="small muted">You can review the list before adding.</span>
              </div>
            </section>

            <section class="section" aria-labelledby="steps-h">
              <div class="section__head"><div><h2 id="steps-h">Method</h2><p>Tap a step to mark it done.</p></div>${done.size ? '<button class="btn btn--ghost btn--sm" data-action="reset-steps">Reset</button>' : ''}</div>
              <ol class="steps">${recipe.steps.map((s, i) => `<li class="${done.has(i) ? 'is-done' : ''}" data-action="step" data-i="${i}" tabindex="0" role="checkbox" aria-checked="${done.has(i)}"><p>${esc(s)}</p></li>`).join('')}</ol>
            </section>
          </div>

          <aside class="recipe__aside" aria-label="Recipe details">
            ${nutrition(recipe)}
            ${facts(recipe)}
            ${localNotes(c)}
          </aside>
        </div>`;
    },
    afterRender(root, { id }) {
      const s = Cooksy.store.get();
      if (Cooksy.catalog.byId(id) && s.recent[0] !== id) {
        Cooksy.store.update((st) => { st.recent = [id, ...st.recent.filter((x) => x !== id)].slice(0, 12); });
      }
      root.querySelectorAll('.steps li').forEach((li) => li.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); li.click(); }
      }));
    },
    actions: {
      back: (el, e) => { e.preventDefault(); if (history.length > 1) history.back(); else location.hash = '#/explore'; },
      servings: (el) => {
        const id = currentId();
        const r = Cooksy.catalog.byId(id);
        servingsById[id] = Math.min(24, Math.max(1, (servingsById[id] || r.servings) + Number(el.dataset.delta)));
        Cooksy.app.render();
      },
      step: (el) => {
        const id = currentId();
        const set = (doneSteps[id] = doneSteps[id] || new Set());
        const i = Number(el.dataset.i);
        set.has(i) ? set.delete(i) : set.add(i);
        Cooksy.app.render();
      },
      'reset-steps': () => { doneSteps[currentId()] = new Set(); Cooksy.app.render(); },
      'toggle-swaps': (el) => { const k = el.dataset.key; openSwaps.has(k) ? openSwaps.delete(k) : openSwaps.add(k); Cooksy.app.render(); },
      'choose-sub': (el) => {
        const { recipe, ing, sub } = el.dataset;
        Cooksy.store.update((s) => {
          s.subChoices[recipe] = s.subChoices[recipe] || {};
          if (sub) s.subChoices[recipe][ing] = sub; else delete s.subChoices[recipe][ing];
        });
        Cooksy.ui.toast(sub ? 'Swap applied to this recipe' : 'Back to the original ingredient');
      },
      mark: (el) => {
        const { recipe, ing, val } = el.dataset;
        Cooksy.store.update((s) => {
          s.matchOverrides[recipe] = s.matchOverrides[recipe] || {};
          if (s.matchOverrides[recipe][ing] === val) delete s.matchOverrides[recipe][ing];
          else s.matchOverrides[recipe][ing] = val;
        });
      },
      'add-missing': () => openAddMissing(currentId()),
    },
  };

  function currentId() {
    return location.hash.split('/')[2]?.split('?')[0];
  }

  /** Review sheet: missing items pre-selected; items at home, conflicts and duplicates explained. */
  function openAddMissing(id) {
    const c = ctx(id);
    const shopping = c.state.shopping;
    const items = c.rows.filter((r) => r.status !== 'skip' && r.ing).map((r) => {
      const already = shopping.some((s) => s.recipeId === id && s.ingredientId === r.ing.id && !s.checked);
      const conflict = r.l.check.blocks.length > 0;
      const checked = !already && !conflict && r.status === 'missing' && !r.l.line.optional;
      let note = '';
      if (already) note = 'Already on your list';
      else if (conflict) note = `Conflicts with your settings: ${r.l.check.blocks.map((b) => b.text.toLowerCase()).join(', ')}`;
      else if (r.status === 'have') note = 'At home';
      else if (r.status === 'maybe') note = `Maybe at home (“${r.items[0].name}”)`;
      else if (r.l.line.optional) note = 'Optional';
      return { r, already, conflict, checked, note, qty: lineText(r.l.line, c.factor) };
    });
    const body = `
      <p>For <b>${esc(c.recipe.name)}</b> (${plural(c.servings, 'serving')}). Missing ingredients are selected; tick anything else you want to buy.</p>
      <ul class="list" style="list-style:none;padding:0;margin:14px 0 0">${items.map((x, i) => `
        <li><label class="item" style="cursor:${x.already || x.conflict ? 'default' : 'pointer'}">
          <input type="checkbox" class="check" data-i="${i}" ${x.checked ? 'checked' : ''} ${x.already ? 'disabled' : ''}>
          <span class="item__main"><span class="item__name">${esc(x.r.ing.name)}</span>
          <span class="item__sub"><span>${esc(x.qty)}</span>${x.note ? `<span class="${x.conflict ? 'flag flag--danger' : ''}">${esc(x.note)}</span>` : ''}</span></span>
        </label></li>`).join('')}</ul>`;
    const el = Cooksy.ui.modal({
      title: 'Add to shopping list',
      body,
      actions: '<button class="btn btn--secondary" data-r="cancel">Cancel</button><button class="btn btn--primary" data-r="add">Add selected</button>',
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-r]');
      if (!b) return;
      if (b.dataset.r === 'cancel') return Cooksy.ui.closeModal();
      const picked = [...el.querySelectorAll('input[type=checkbox]:checked')].map((cb) => items[Number(cb.dataset.i)]);
      if (picked.some((x) => x.conflict) && !window.confirm('Some selected ingredients conflict with your allergy or diet settings. Add them anyway?')) return;
      Cooksy.ui.closeModal();
      if (!picked.length) { Cooksy.ui.toast('Nothing added'); return; }
      Cooksy.store.update((s) => {
        picked.forEach((x) => s.shopping.push({
          id: Cooksy.util.uid(), name: x.r.ing.name, ingredientId: x.r.ing.id, qty: x.qty, recipeId: id, checked: false,
        }));
      });
      Cooksy.ui.toast(`Added ${plural(picked.length, 'item')} for ${c.recipe.name}`, { actionLabel: 'View list', onAction: () => { location.hash = '#/shopping'; } });
    });
  }
})();
