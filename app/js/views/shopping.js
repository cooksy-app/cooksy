/* Shopping list grouped by recipe, with a custom "Other items" group. */
window.Cooksy = window.Cooksy || {};
Cooksy.views = Cooksy.views || {};

(() => {
  const { esc, plural } = Cooksy.util;
  const { icon, empty, art } = Cooksy.ui;
  const LOCS = ['Fridge', 'Pantry', 'Freezer'];
  let moving = null; // id of the checked item whose "move to kitchen" picker is open
  let formError = '';

  function itemRow(it) {
    const ing = it.ingredientId ? Cooksy.ingredientById(it.ingredientId) : null;
    const suggested = ing?.loc || 'Pantry';
    const allergens = new Set([...Cooksy.safety.detectAllergens(it.name), ...(ing?.allergens || [])]);
    const p = Cooksy.store.get().profile;
    const mine = [...allergens].filter((a) => p.allergens.includes(a) || (a === 'gluten' && p.glutenFree));
    return `
      <li class="item ${it.checked ? 'is-checked' : ''}">
        <input type="checkbox" class="check" id="chk-${it.id}" data-change="check" data-id="${it.id}" ${it.checked ? 'checked' : ''} aria-label="${it.checked ? 'Unmark' : 'Mark'} ${esc(it.name)} as bought">
        <div class="item__main">
          <label class="item__name" for="chk-${it.id}" style="cursor:pointer">${esc(it.name)}</label>
          <div class="item__sub">
            ${mine.length ? `<span class="tag tag--danger">${icon('alert')} Contains ${esc(mine.map((a) => Cooksy.allergenById(a).short.toLowerCase()).join(', '))}</span>` : ''}
            ${ing && (ing.packaged || ing.gfLabel) && (p.allergens.length || p.glutenFree) ? `<span class="tag">${icon('label')} Check label</span>` : ''}
          </div>
          ${it.checked ? (moving === it.id
            ? `<div class="move-menu" role="group" aria-label="Where did you put it?"><span class="small muted">Put away in:</span>${LOCS.map((l) => `<button class="btn btn--sm ${l === suggested ? 'btn--primary' : 'btn--secondary'}" data-action="move" data-id="${it.id}" data-loc="${l}">${l}</button>`).join('')}<button class="btn btn--sm btn--ghost" data-action="move-cancel">Cancel</button></div>`
            : `<div class="move-menu"><button class="btn btn--sm btn--secondary" data-action="move-open" data-id="${it.id}">${icon('kitchen')} Now at home: add to My Kitchen</button></div>`) : ''}
        </div>
        <div class="item__actions">
          <input class="input qty-input" id="qty-${it.id}" value="${esc(it.qty || '')}" placeholder="Qty" data-change="qty" data-id="${it.id}" aria-label="Quantity for ${esc(it.name)}">
          <button class="icon-btn icon-btn--sm" data-action="remove" data-id="${it.id}" aria-label="Remove ${esc(it.name)}">${icon('trash')}</button>
        </div>
      </li>`;
  }

  function group(recipeId, items) {
    const recipe = recipeId ? Cooksy.catalog.byId(recipeId) : null;
    const open = items.filter((i) => !i.checked);
    const summary = open.length ? `Still to buy: ${open.map((i) => i.name.toLowerCase()).join(', ')}` : 'All bought';
    return `
      <section class="group" aria-labelledby="g-${recipeId || 'other'}">
        <div class="group__head">
          ${recipe ? art(recipe, 'art--thumb') : '<span class="loc-icon loc-Pantry" aria-hidden="true">🛒</span>'}
          <div style="flex:1;min-width:0">
            <h3 id="g-${recipeId || 'other'}">${recipe ? `For ${esc(recipe.name)}` : 'Other items'}</h3>
            <p>${esc(summary)}</p>
          </div>
          ${recipe ? `<a class="btn btn--sm btn--secondary" href="#/recipe/${recipe.id}">Open recipe</a>` : ''}
        </div>
        <ul class="list" style="list-style:none;margin:0">${items.map(itemRow).join('')}</ul>
      </section>`;
  }

  Cooksy.views.shopping = {
    title: () => 'Shopping List',
    render() {
      const list = Cooksy.store.get().shopping;
      const groups = new Map();
      list.forEach((it) => {
        const key = it.recipeId && Cooksy.catalog.byId(it.recipeId) ? it.recipeId : '';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(it);
      });
      const keys = [...groups.keys()].sort((a, b) => (a === '') - (b === ''));
      const open = list.filter((i) => !i.checked).length;
      const checked = list.length - open;
      return `
        <div class="page-head row row--between" style="align-items:flex-end">
          <div><h1>Shopping List</h1><p>${list.length ? `${plural(open, 'item')} to buy${checked ? ` · ${checked} in the basket` : ''}` : 'Add missing ingredients from any recipe, or add your own items.'}</p></div>
          ${checked ? '<button class="btn btn--secondary btn--sm" data-action="clear-checked">Clear checked items</button>' : ''}
        </div>
        <form class="panel" data-submit="add" style="margin-bottom:22px">
          <div class="shop-form">
            <div class="field"><label for="shop-name">Add an item</label><input class="input" id="shop-name" name="name" placeholder="e.g. Dish soap, lemons" autocomplete="off" ${formError ? 'aria-invalid="true"' : ''}></div>
            <div class="field"><label for="shop-qty">Quantity</label><input class="input" id="shop-qty" name="qty" placeholder="Optional"></div>
            <button class="btn btn--primary" type="submit">${icon('plus')} Add</button>
          </div>
          ${formError ? `<p class="error-text" role="alert" style="margin-top:8px">${esc(formError)}</p>` : ''}
        </form>
        ${list.length ? keys.map((k) => group(k, groups.get(k))).join('')
          : empty({ icon: '🛒', title: 'Your list is empty', text: 'Open a recipe and tap “Add missing ingredients”. We’ll skip what you already have at home.', action: '<a class="btn btn--primary" href="#/explore">Find a recipe</a>' })}
        ${list.length ? `<div style="margin-top:18px">${Cooksy.ui.labelReminder(true)}</div>` : ''}`;
    },
    changes: {
      check: (el) => {
        const id = el.dataset.id;
        if (!el.checked && moving === id) moving = null;
        Cooksy.store.update((s) => { const it = s.shopping.find((i) => i.id === id); it.checked = el.checked; });
      },
      qty: (el) => Cooksy.store.update((s) => { s.shopping.find((i) => i.id === el.dataset.id).qty = el.value.trim(); }),
    },
    actions: {
      remove: (el) => {
        const id = el.dataset.id;
        const all = Cooksy.store.get().shopping;
        const idx = all.findIndex((i) => i.id === id);
        const item = all[idx];
        Cooksy.store.update((s) => { s.shopping = s.shopping.filter((i) => i.id !== id); });
        Cooksy.ui.toast(`Removed ${item.name}`, { actionLabel: 'Undo', onAction: () => Cooksy.store.update((s) => { s.shopping.splice(idx, 0, item); }) });
      },
      'move-open': (el) => { moving = el.dataset.id; Cooksy.app.render(); },
      'move-cancel': () => { moving = null; Cooksy.app.render(); },
      move: (el) => {
        const { id, loc } = el.dataset;
        const item = Cooksy.store.get().shopping.find((i) => i.id === id);
        moving = null;
        Cooksy.store.update((s) => {
          s.shopping = s.shopping.filter((i) => i.id !== id);
          s.inventory.unshift({ id: Cooksy.util.uid(), name: item.name, ingredientId: item.ingredientId || Cooksy.kitchen.resolve(item.name), qty: item.qty, location: loc, expiry: null });
          // A user's earlier "need it" override for this ingredient no longer applies once it's at home.
          Object.values(s.matchOverrides).forEach((o) => { if (o[item.ingredientId] === 'missing') delete o[item.ingredientId]; });
        });
        Cooksy.ui.toast(`${item.name} added to your ${loc}`, { actionLabel: 'View', onAction: () => { location.hash = '#/kitchen'; } });
      },
      'clear-checked': async () => {
        const ok = await Cooksy.ui.confirm({ title: 'Clear checked items?', text: 'Checked items will be removed from your list. They won’t be added to My Kitchen.', confirmLabel: 'Clear' });
        if (ok) Cooksy.store.update((s) => { s.shopping = s.shopping.filter((i) => !i.checked); });
      },
    },
    submits: {
      add: (form) => {
        const name = form.name.value.trim().replace(/\s+/g, ' ');
        if (!name) { formError = 'Please type an item name.'; Cooksy.app.render(); document.getElementById('shop-name')?.focus(); return; }
        formError = '';
        Cooksy.store.update((s) => {
          s.shopping.push({ id: Cooksy.util.uid(), name, ingredientId: Cooksy.kitchen.resolve(name), qty: form.qty.value.trim(), recipeId: null, checked: false });
        });
        Cooksy.ui.toast(`Added ${name}`);
        document.getElementById('shop-name')?.focus();
      },
    },
  };
})();
