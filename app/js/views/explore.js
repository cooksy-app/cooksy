window.Cooksy = window.Cooksy || {};
Cooksy.views = Cooksy.views || {};

(() => {
  const { esc, plural } = Cooksy.util;
  const { icon, recipeCard, empty, skeletonGrid } = Cooksy.ui;

  const defaults = () => ({ q: '', cuisine: '', region: '', time: 0, veg: false, halal: false, gf: false, fav: false, meal: '', swaps: false, sort: 'recommended' });
  let f = defaults();
  let lastQuery = null;
  let filtersOpen = false;

  const MEALS = [['', 'Any meal'], ['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snack', 'Snack'], ['soup', 'Soup']];
  const TIMES = [[0, 'Any time'], [15, '≤ 15 min'], [30, '≤ 30 min'], [60, '≤ 1 hour']];

  function syncFromQuery(query) {
    const key = JSON.stringify(query);
    if (key === lastQuery) return;
    lastQuery = key;
    if (!Object.keys(query).length) return; // plain #/explore keeps the current filters
    f = defaults();
    if (query.q) f.q = query.q;
    if (query.cuisine) f.cuisine = query.cuisine;
    if (query.time) f.time = Number(query.time) || 0;
    if (query.meal) f.meal = query.meal;
    if (query.veg) f.veg = true;
    if (query.fav) f.fav = true;
    if (query.swaps) f.swaps = true;
  }

  const toggle = (key, label) => `<button type="button" class="chip" data-action="toggle" data-key="${key}" aria-pressed="${!!f[key]}">${f[key] ? icon('check') : ''}${label}</button>`;
  const activeCount = () => ['cuisine', 'region', 'time', 'veg', 'halal', 'gf', 'fav', 'meal', 'swaps'].filter((k) => f[k]).length;

  function filtersPanel() {
    const usedCuisines = [...new Set(Cooksy.catalog.all().map((r) => r.cuisine))].map(Cooksy.cuisineById).sort((a, b) => a.name.localeCompare(b.name));
    const regions = [...new Set(usedCuisines.map((c) => c.region))].sort();
    return `
      <aside class="filters panel ${filtersOpen ? 'is-open' : ''}" id="filters" aria-label="Filters">
        <div class="field"><label for="f-cuisine">Cuisine</label>
          <select class="select" id="f-cuisine" data-change="set" data-key="cuisine"><option value="">All cuisines</option>
          ${usedCuisines.map((c) => `<option value="${c.id}" ${f.cuisine === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="f-region">Country / region</label>
          <select class="select" id="f-region" data-change="set" data-key="region"><option value="">Anywhere</option>
          ${regions.map((r) => `<option ${f.region === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></div>
        <div class="field"><label for="f-time">Total time</label>
          <select class="select" id="f-time" data-change="set" data-key="time">${TIMES.map(([v, l]) => `<option value="${v}" ${f.time === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="f-meal">Meal</label>
          <select class="select" id="f-meal" data-change="set" data-key="meal">${MEALS.map(([v, l]) => `<option value="${v}" ${f.meal === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div><h3 style="margin-bottom:8px">Diet</h3><div class="chips">${toggle('veg', 'Vegetarian')}${toggle('halal', 'Halal')}${toggle('gf', 'Gluten-free')}</div>
          <p class="small muted" style="margin-top:8px">“Gluten-free” means no gluten in the listed ingredients. Packaged items still need a GF label.</p></div>
        <div><h3 style="margin-bottom:8px">More</h3><div class="chips">${toggle('fav', 'Favourites only')}${toggle('swaps', 'Include recipes that need a swap')}</div></div>
        ${activeCount() ? '<button type="button" class="btn btn--ghost btn--sm" data-action="clear">Clear all filters</button>' : ''}
      </aside>`;
  }

  function results() {
    if (!Cooksy.catalog.isLoaded()) return skeletonGrid();
    const { results: list, hiddenCount, swapCount } = Cooksy.catalog.discover({
      query: f.q, cuisine: f.cuisine, region: f.region, maxTime: f.time, vegetarian: f.veg, halal: f.halal,
      glutenFree: f.gf, favoritesOnly: f.fav, meal: f.meal, includeSwaps: f.swaps, sort: f.sort,
    });
    const hiddenNote = hiddenCount
      ? `<p class="small muted">${icon('shield', 'style="width:15px;height:15px;vertical-align:-2px"')} ${plural(hiddenCount, 'recipe')} hidden by your allergy & diet settings${swapCount && !f.swaps ? ` · <button class="link small" data-action="show-swaps">show ${swapCount} that work with a swap</button>` : ''} · <a class="link small" href="#/settings">Settings</a></p>`
      : '';
    const bar = `<div class="results-bar"><div><strong aria-live="polite">${plural(list.length, 'recipe')}</strong>${hiddenNote}</div>
      <label class="row small" style="gap:8px"><span class="muted">Sort</span><select class="select" id="f-sort" data-change="set" data-key="sort">
        <option value="recommended" ${f.sort === 'recommended' ? 'selected' : ''}>Recommended</option>
        <option value="quickest" ${f.sort === 'quickest' ? 'selected' : ''}>Quickest</option>
        <option value="az" ${f.sort === 'az' ? 'selected' : ''}>A–Z</option></select></label></div>`;
    if (!list.length) {
      return bar + empty({
        icon: f.fav ? '💛' : '🔍',
        title: f.fav ? 'No favourites here yet' : 'No recipes found',
        text: f.fav ? 'Tap the heart on any recipe to save it here.' : 'Try a different word or remove a filter. Our sample catalog is small for now and growing.',
        action: activeCount() || f.q ? '<button class="btn btn--primary" data-action="clear">Clear search & filters</button>' : '',
      });
    }
    return bar + `<div class="grid">${list.map(recipeCard).join('')}</div>`;
  }

  Cooksy.views.explore = {
    title: () => 'Explore',
    render({ query }) {
      syncFromQuery(query || {});
      return `
        <div class="page-head"><h1>Explore</h1><p>Search dishes, ingredients, cuisines or tags like “vegetarian”. Results always respect your allergy settings.</p></div>
        <div class="tabs" role="tablist" aria-label="Explore"><a href="#/explore" role="tab" aria-selected="true">Recipes</a><a href="#/cuisines" role="tab" aria-selected="false">Cuisines A–Z</a></div>
        <div class="row" style="flex-wrap:nowrap">
          <div class="search" style="flex:1">${icon('search')}<input class="input" id="explore-q" type="search" placeholder="Try “daal”, “egg”, “Hungarian” or “halal”" value="${esc(f.q)}" data-input="q" aria-label="Search recipes"></div>
          <button type="button" class="btn btn--secondary filters-toggle" data-action="toggle-filters" aria-expanded="${filtersOpen}" aria-controls="filters">${icon('filter')} Filters${activeCount() ? ` (${activeCount()})` : ''}</button>
        </div>
        <div class="explore" style="margin-top:20px">
          ${filtersPanel()}
          <section aria-label="Results">${results()}</section>
        </div>`;
    },
    inputs: {
      q: Cooksy.util.debounce((el) => { f.q = el.value; Cooksy.app.render(); }, 120),
    },
    changes: {
      set: (el) => { const k = el.dataset.key; f[k] = k === 'time' ? Number(el.value) : el.value; Cooksy.app.render(); },
    },
    actions: {
      toggle: (el) => { const k = el.dataset.key; f[k] = !f[k]; Cooksy.app.render(); },
      clear: () => { f = { ...defaults(), sort: f.sort }; Cooksy.app.render(); },
      'show-swaps': () => { f.swaps = true; Cooksy.app.render(); },
      'toggle-filters': () => { filtersOpen = !filtersOpen; Cooksy.app.render(); },
    },
  };
})();
