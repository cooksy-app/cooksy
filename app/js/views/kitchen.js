/* My Kitchen: home inventory (fridge, pantry, freezer). */
window.Cooksy = window.Cooksy || {};
Cooksy.views = Cooksy.views || {};

(() => {
  const { esc, plural, expiryLabel, daysUntil } = Cooksy.util;
  const { icon, empty } = Cooksy.ui;
  const LOCS = ['Fridge', 'Pantry', 'Freezer'];
  const LOC_EMOJI = { Fridge: '🧊', Pantry: '🥫', Freezer: '❄️' };
  let tab = 'All';
  let q = '';
  let formError = '';

  function itemForm(item = {}, prefix = 'add') {
    return `
      <div class="form-grid">
        <div class="field"><label for="${prefix}-name">Ingredient</label>
          <input class="input" id="${prefix}-name" name="name" value="${esc(item.name || '')}" placeholder="e.g. Frozen parathas" list="ingredient-names" autocomplete="off" required ${formError && prefix === 'add' ? 'aria-invalid="true"' : ''}></div>
        <div class="field"><label for="${prefix}-qty">Quantity <span class="muted">(optional)</span></label>
          <input class="input" id="${prefix}-qty" name="qty" value="${esc(item.qty || '')}" placeholder="e.g. 500 g, 6, 1 pack"></div>
        <div class="field"><label for="${prefix}-loc">Stored in</label>
          <select class="select" id="${prefix}-loc" name="location">${LOCS.map((l) => `<option ${(item.location || (tab !== 'All' ? tab : 'Fridge')) === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="${prefix}-exp">Expiry date <span class="muted">(optional)</span></label>
          <input class="input" id="${prefix}-exp" name="expiry" type="date" value="${esc(item.expiry || '')}"></div>
      </div>`;
  }

  function readForm(form) {
    const name = form.name.value.trim().replace(/\s+/g, ' ');
    return { name, qty: form.qty.value.trim(), location: form.location.value, expiry: form.expiry.value || null, ingredientId: Cooksy.kitchen.resolve(name) };
  }

  function row(it) {
    const exp = expiryLabel(it.expiry);
    const matched = it.ingredientId ? Cooksy.ingredientById(it.ingredientId) : null;
    const allergens = [...Cooksy.safety.detectAllergens(it.name), ...(matched?.allergens || [])];
    const mine = Cooksy.store.get().profile;
    const userA = new Set([...(mine.allergens || []), ...(mine.glutenFree ? ['gluten'] : [])]);
    const warn = [...new Set(allergens)].filter((a) => userA.has(a));
    return `
      <li class="item">
        <span class="loc-icon loc-${it.location}" aria-hidden="true">${LOC_EMOJI[it.location]}</span>
        <div class="item__main">
          <div class="item__name">${esc(it.name)}</div>
          <div class="item__sub">
            ${it.qty ? `<span>${esc(it.qty)}</span>` : ''}
            <span>${esc(it.location)}</span>
            ${exp ? `<span class="tag tag--${exp.tone === 'danger' ? 'danger' : exp.tone === 'warn' ? 'warn' : ''}">${esc(exp.text)}</span>` : ''}
            ${matched && Cooksy.util.normalize(matched.name) !== Cooksy.util.normalize(it.name) ? `<span>Matches “${esc(matched.name)}”</span>` : ''}
            ${!matched ? '<span title="We’ll still try partial matches on recipe pages">Not matched to a recipe ingredient</span>' : ''}
            ${warn.length ? `<span class="tag tag--danger">${icon('alert')} Contains ${esc(warn.map((a) => Cooksy.allergenById(a).short.toLowerCase()).join(', '))}</span>` : ''}
            ${it.example ? '<span class="tag">Example item</span>' : ''}
          </div>
        </div>
        <div class="item__actions">
          <button class="icon-btn icon-btn--sm" data-action="edit" data-id="${it.id}" aria-label="Edit ${esc(it.name)}">${icon('edit')}</button>
          <button class="icon-btn icon-btn--sm" data-action="remove" data-id="${it.id}" aria-label="Remove ${esc(it.name)}">${icon('trash')}</button>
        </div>
      </li>`;
  }

  Cooksy.views.kitchen = {
    title: () => 'My Kitchen',
    render() {
      const inv = Cooksy.store.get().inventory;
      const nq = Cooksy.util.normalize(q);
      const list = inv
        .filter((i) => tab === 'All' || i.location === tab)
        .filter((i) => !nq || Cooksy.util.normalize(i.name).includes(nq))
        .sort((a, b) => (daysUntil(a.expiry) ?? 9999) - (daysUntil(b.expiry) ?? 9999) || a.name.localeCompare(b.name));
      const count = (l) => inv.filter((i) => l === 'All' || i.location === l).length;
      const hasExamples = inv.some((i) => i.example);

      return `
        <div class="page-head"><h1>My Kitchen</h1><p>Keep track of what’s at home. Recipes compare against this list so you know what to buy.</p></div>
        <form class="panel" data-submit="add" aria-labelledby="add-h">
          <h2 id="add-h" style="font-size:1.2rem;margin-bottom:14px">Add an ingredient</h2>
          ${itemForm()}
          ${formError ? `<p class="error-text" role="alert" style="margin-top:8px">${esc(formError)}</p>` : ''}
          <div class="row" style="margin-top:14px"><button class="btn btn--primary" type="submit">${icon('plus')} Add to kitchen</button></div>
          <datalist id="ingredient-names">${Cooksy.INGREDIENTS.filter((i) => !i.skip).map((i) => `<option value="${esc(i.name)}">`).join('')}</datalist>
        </form>

        <section class="section">
          <div class="row row--between" style="margin-bottom:14px">
            <div class="tabs" role="tablist" aria-label="Storage" style="margin:0">${['All', ...LOCS].map((l) => `<button role="tab" aria-selected="${tab === l}" data-action="tab" data-tab="${l}">${l} <span class="muted">${count(l)}</span></button>`).join('')}</div>
            <div class="search" style="min-width:min(280px,100%)">${icon('search')}<input class="input" id="kitchen-q" type="search" placeholder="Search your kitchen" value="${esc(q)}" data-input="q" aria-label="Search your kitchen" style="min-height:44px"></div>
          </div>
          ${hasExamples ? `<div class="banner banner--info" style="margin-bottom:14px">${icon('info')}<div>We added a few example items to get you started. Edit or remove them any time. <button class="link" data-action="clear-examples">Remove all examples</button></div></div>` : ''}
          ${list.length ? `<ul class="list" style="list-style:none;padding:0;margin:0">${list.map(row).join('')}</ul>`
            : inv.length
              ? empty({ icon: '🔍', title: 'Nothing here', text: q ? `No items match “${esc(q)}”.` : `Your ${tab.toLowerCase()} is empty.`, action: q ? '<button class="btn btn--secondary" data-action="clear-q">Clear search</button>' : '' })
              : empty({ icon: '🧺', title: 'Your kitchen is empty', text: 'Add what’s in your fridge, pantry and freezer to get “Cook with what I have” suggestions.' })}
          ${inv.length ? `<p class="small muted" style="margin-top:14px">${plural(inv.length, 'item')} · Data is saved on this device only.</p>` : ''}
        </section>`;
    },
    inputs: { q: (el) => { q = el.value; Cooksy.app.render(); } },
    actions: {
      tab: (el) => { tab = el.dataset.tab; Cooksy.app.render(); },
      'clear-q': () => { q = ''; Cooksy.app.render(); },
      remove: (el) => {
        const id = el.dataset.id;
        const inv = Cooksy.store.get().inventory;
        const idx = inv.findIndex((i) => i.id === id);
        const item = inv[idx];
        Cooksy.store.update((s) => { s.inventory = s.inventory.filter((i) => i.id !== id); });
        Cooksy.ui.toast(`Removed ${item.name}`, { actionLabel: 'Undo', onAction: () => Cooksy.store.update((s) => { s.inventory.splice(idx, 0, item); }) });
      },
      'clear-examples': async () => {
        const ok = await Cooksy.ui.confirm({ title: 'Remove example items?', text: 'This removes the sample items we added. Items you added or edited stay.', confirmLabel: 'Remove examples' });
        if (ok) Cooksy.store.update((s) => { s.inventory = s.inventory.filter((i) => !i.example); });
      },
      edit: (el) => {
        const item = Cooksy.store.get().inventory.find((i) => i.id === el.dataset.id);
        const m = Cooksy.ui.modal({
          title: `Edit ${item.name}`,
          body: `<form id="edit-form" novalidate>${itemForm(item, 'edit')}<p class="error-text" id="edit-err" role="alert"></p></form>`,
          actions: '<button class="btn btn--secondary" data-r="cancel">Cancel</button><button class="btn btn--primary" data-r="save">Save</button>',
        });
        const save = () => {
          const data = readForm(m.querySelector('#edit-form'));
          if (!data.name) { m.querySelector('#edit-err').textContent = 'Please enter an ingredient name.'; return; }
          Cooksy.ui.closeModal();
          Cooksy.store.update((s) => {
            const it = s.inventory.find((i) => i.id === item.id);
            Object.assign(it, data, { example: false });
          });
          Cooksy.ui.toast('Saved');
        };
        m.querySelector('#edit-form').addEventListener('submit', (e) => { e.preventDefault(); save(); });
        m.addEventListener('click', (e) => {
          const b = e.target.closest('[data-r]');
          if (b?.dataset.r === 'cancel') Cooksy.ui.closeModal();
          if (b?.dataset.r === 'save') save();
        });
      },
    },
    submits: {
      add: (form) => {
        const data = readForm(form);
        if (!data.name) { formError = 'Please enter an ingredient name.'; Cooksy.app.render(); document.getElementById('add-name')?.focus(); return; }
        formError = '';
        Cooksy.store.update((s) => { s.inventory.unshift({ id: Cooksy.util.uid(), ...data }); });
        const matched = data.ingredientId ? Cooksy.ingredientById(data.ingredientId) : null;
        Cooksy.ui.toast(`Added ${data.name} to ${data.location}${matched ? '' : ' (no exact recipe match)'}`);
        form.reset();
        document.getElementById('add-name')?.focus();
      },
    },
  };
})();
