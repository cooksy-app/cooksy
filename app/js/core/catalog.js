/* Recipe catalog service.
   The prototype reads the bundled sample data, but the async `load()` boundary is where a
   backend or a larger JSON dataset would plug in later. All discovery goes through
   `discover()`, which applies the centralised safety rules before any other filter. */
window.Cooksy = window.Cooksy || {};

Cooksy.catalog = (() => {
  const { normalize, hasPhrase } = Cooksy.util;
  let recipes = null;
  let loading = null;

  function hydrate(raw) {
    return raw.map((r) => {
      const lines = r.ing.map(([id, qty, unit, note, optional]) => {
        if (!Cooksy.ingredientById(id)) console.warn(`Cooksy: recipe ${r.id} uses unknown ingredient "${id}"`);
        return { id, qty, unit: unit || '', note: note || '', optional: !!optional };
      });
      const recipe = { ...r, lines, total: r.prep + r.cook };
      recipe.facts = Cooksy.safety.recipeFacts(recipe);
      recipe.cuisineInfo = Cooksy.cuisineById(r.cuisine);
      recipe.searchText = normalize([
        r.name, r.description, recipe.cuisineInfo?.name, recipe.cuisineInfo?.region, r.region, ...(r.meal || []),
        ...lines.map((l) => { const i = Cooksy.ingredientById(l.id); return i ? [i.name, ...i.aliases].join(' ') : l.id; }),
        recipe.facts.vegetarian ? 'vegetarian' : '', recipe.facts.vegan ? 'vegan' : '',
        recipe.facts.halal ? 'halal' : '', recipe.facts.noGlutenIngredients ? 'gluten free' : '',
      ].join(' '));
      return recipe;
    });
  }

  /** Simulates a network fetch so loading and error states are exercised like they would be with a backend. */
  function load() {
    if (recipes) return Promise.resolve(recipes);
    if (!loading) {
      loading = new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (!Array.isArray(Cooksy.RECIPE_DATA)) throw new Error('Recipe data is missing');
            recipes = hydrate(Cooksy.RECIPE_DATA);
            resolve(recipes);
          } catch (e) {
            loading = null;
            reject(e);
          }
        }, 450);
      });
    }
    return loading;
  }

  const all = () => recipes || [];
  const byId = (id) => all().find((r) => r.id === id) || null;
  const isLoaded = () => !!recipes;
  const countForCuisine = (cid) => all().filter((r) => r.cuisine === cid).length;

  function marketOf(profile) {
    return profile?.country ? Cooksy.countryByCode(profile.country)?.market : null;
  }

  /** Ingredients in a recipe that are often harder to find in the user's market. */
  function hardToFind(recipe, profile) {
    const market = marketOf(profile);
    if (!market) return [];
    return recipe.lines
      .filter((l) => !l.optional)
      .map((l) => Cooksy.ingredientById(l.id))
      .filter((ing) => ing && ing.hard.includes(market));
  }

  /** Recommendation score: favourite cuisines, local cuisines and easy-to-find ingredients rank higher. */
  function score(recipe, profile) {
    let s = 0;
    if (profile?.favoriteCuisines?.includes(recipe.cuisine)) s += 5;
    if (profile?.country && recipe.cuisineInfo?.countries.includes(profile.country)) s += 3;
    s -= hardToFind(recipe, profile).length * 1.5;
    if (recipe.total <= 30) s += 0.5;
    return s;
  }

  /**
   * Safety-aware search.
   * opts: { query, cuisine, region, maxTime, vegetarian, halal, glutenFree, favoritesOnly, meal, includeSwaps, sort }
   * Returns { results: [{ recipe, evaluation }], hiddenCount, swapCount }
   */
  function discover(opts = {}) {
    const state = Cooksy.store.get();
    const profile = state.profile;
    const q = normalize(opts.query || '');
    const words = q.split(' ').filter(Boolean);

    let hiddenCount = 0;
    let swapCount = 0;
    const results = [];
    for (const recipe of all()) {
      const evaluation = Cooksy.safety.evaluateRecipe(recipe, profile, state.subChoices);
      if (evaluation.status === 'blocked') { hiddenCount++; continue; }
      if (evaluation.status === 'swap') {
        swapCount++;
        if (!opts.includeSwaps) { hiddenCount++; continue; }
      }
      if (words.length && !words.every((w) => hasPhrase(recipe.searchText, w) || recipe.searchText.includes(w))) continue;
      if (opts.cuisine && recipe.cuisine !== opts.cuisine) continue;
      if (opts.region && recipe.cuisineInfo?.region !== opts.region) continue;
      if (opts.maxTime && recipe.total > opts.maxTime) continue;
      if (opts.vegetarian && !recipe.facts.vegetarian) continue;
      if (opts.halal && !recipe.facts.halal) continue;
      if (opts.glutenFree && !recipe.facts.noGlutenIngredients) continue;
      if (opts.favoritesOnly && !state.favorites.includes(recipe.id)) continue;
      if (opts.meal && !(recipe.meal || []).includes(opts.meal)) continue;
      results.push({ recipe, evaluation });
    }

    const sort = opts.sort || 'recommended';
    if (sort === 'quickest') results.sort((a, b) => a.recipe.total - b.recipe.total);
    else if (sort === 'az') results.sort((a, b) => a.recipe.name.localeCompare(b.recipe.name));
    else {
      // With a search query, dishes whose name matches come before ingredient-only matches.
      const nameHit = (r) => (words.length && words.every((w) => normalize(r.name).includes(w)) ? 100 : 0);
      results.sort((a, b) => nameHit(b.recipe) + score(b.recipe, profile) - nameHit(a.recipe) - score(a.recipe, profile) || a.recipe.total - b.recipe.total);
    }

    return { results, hiddenCount, swapCount };
  }

  /** Safe recipes ranked by how much of them the user can make from home inventory. */
  function cookWithWhatIHave(limit = 6) {
    const state = Cooksy.store.get();
    return discover({ includeSwaps: false })
      .results.map(({ recipe, evaluation }) => {
        const rows = Cooksy.kitchen.compare(recipe, evaluation, state.inventory, state.matchOverrides);
        return { recipe, evaluation, stats: Cooksy.kitchen.cookability(rows) };
      })
      .filter((x) => x.stats.score > 0.4)
      .sort((a, b) => b.stats.score - a.stats.score || a.recipe.total - b.recipe.total)
      .slice(0, limit);
  }

  const _hydrateForTest = () => (recipes = hydrate(Cooksy.RECIPE_DATA));

  return { load, all, byId, isLoaded, discover, cookWithWhatIHave, hardToFind, countForCuisine, score, _hydrateForTest };
})();
