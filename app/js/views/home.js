window.Cooksy = window.Cooksy || {};
Cooksy.views = Cooksy.views || {};

(() => {
  const { esc, plural } = Cooksy.util;
  const { icon, recipeCard, empty } = Cooksy.ui;

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  function safetyStrip(profile) {
    const parts = Cooksy.safety.profileSummary(profile);
    if (!parts) {
      return `<div class="banner banner--saffron">${icon('shield')}<div><strong>No allergies set</strong>Add allergies or ingredients to avoid and we’ll filter every recipe for you. <a class="link" href="#/settings">Set up in Settings</a></div></div>`;
    }
    return `<div class="banner banner--info">${icon('shield')}<div><strong>Filtering for you: ${esc(parts.join(', '))}</strong>Recipes with these listed ingredients are hidden. Always check packaged food labels. <a class="link" href="#/settings">Edit</a></div></div>`;
  }

  Cooksy.views.home = {
    title: () => 'Home',
    render() {
      const state = Cooksy.store.get();
      const p = state.profile;
      const { discover } = Cooksy.catalog;
      const featured = discover().results.slice(0, 8);
      const quick = discover({ maxTime: 20, sort: 'quickest' }).results.slice(0, 8);
      const cook = Cooksy.catalog.cookWithWhatIHave(8);
      const recent = state.recent.map((id) => Cooksy.catalog.byId(id)).filter(Boolean).slice(0, 8)
        .map((recipe) => ({ recipe, evaluation: Cooksy.safety.evaluateRecipe(recipe, p, state.subChoices) }))
        .filter((x) => x.evaluation.status !== 'blocked');
      const favCuisines = p.favoriteCuisines.map(Cooksy.cuisineById).filter(Boolean);
      const expiring = state.inventory.filter((i) => { const d = Cooksy.util.daysUntil(i.expiry); return d != null && d <= 3; });
      const country = Cooksy.countryByCode(p.country);

      return `
        <section class="hero">
          <div>
            <span class="eyebrow" style="color:var(--saffron)">${greeting()}, ${esc(p.name)}</span>
            <h1 style="margin-top:8px">What are we cooking today?</h1>
            <p>${country ? `Recipes picked for cooks in ${country.flag} ${esc(country.name)}, ` : 'Recipes '}filtered for your allergies and matched to your kitchen.</p>
            <form class="search" data-submit="search" role="search">
              ${icon('search')}
              <input class="input" id="home-search" type="search" name="q" placeholder="Search dishes, ingredients or cuisines" aria-label="Search recipes">
            </form>
          </div>
          <img class="hero__mascot" src="assets/cooksy-mark.png" alt="" width="220" height="220">
        </section>

        <div class="quick-links">
          <a class="quick-link" href="#/explore?time=20"><span class="ico" aria-hidden="true">⚡</span>Under 20 min</a>
          <a class="quick-link" href="#/explore?meal=breakfast"><span class="ico" aria-hidden="true">🍳</span>Breakfast</a>
          <a class="quick-link" href="#/explore?veg=1"><span class="ico" aria-hidden="true">🥦</span>Vegetarian</a>
          <a class="quick-link" href="#/cuisines"><span class="ico" aria-hidden="true">🌍</span>Cuisines A–Z</a>
        </div>

        <div style="margin-top:20px">${safetyStrip(p)}</div>

        ${expiring.length ? `<div class="banner banner--warn" style="margin-top:12px">${icon('clock')}<div><strong>Use soon: ${esc(expiring.map((i) => i.name).join(', '))}</strong><a class="link" href="#/kitchen">Open My Kitchen</a></div></div>` : ''}

        <section class="section">
          <div class="section__head"><div><h2>Cook with what I have</h2><p>Based on ${plural(state.inventory.length, 'item')} in My Kitchen.</p></div><a class="btn btn--ghost btn--sm" href="#/kitchen">Update kitchen</a></div>
          ${cook.length ? `<div class="carousel">${cook.map(recipeCard).join('')}</div>`
            : empty({ icon: '🧺', title: 'Add a few ingredients', text: 'Tell us what’s in your fridge, pantry or freezer and we’ll suggest dishes you can make right now.', action: '<a class="btn btn--primary" href="#/kitchen">Add ingredients</a>' })}
        </section>

        <section class="section">
          <div class="section__head"><div><h2>Picked for you</h2><p>Favourite and local cuisines first, with easy-to-find ingredients.</p></div><a class="btn btn--ghost btn--sm" href="#/explore">See all</a></div>
          ${featured.length ? `<div class="carousel">${featured.map(recipeCard).join('')}</div>`
            : empty({ icon: '🛡️', title: 'No recipes match your settings yet', text: 'Your allergy and diet settings filter out every recipe in our sample catalog. Some recipes may work with a swap.', action: '<a class="btn btn--primary" href="#/explore?swaps=1">Show recipes with swaps</a>' })}
        </section>

        <section class="section">
          <div class="section__head"><div><h2>Your cuisines</h2><p>Tap a star in the directory to add more.</p></div><a class="btn btn--ghost btn--sm" href="#/cuisines">Browse A–Z</a></div>
          ${favCuisines.length ? `<div class="grid grid--tight" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${favCuisines.map((c) => {
            const n = Cooksy.catalog.countForCuisine(c.id);
            return `<a class="cuisine-tile" href="#/cuisine/${c.id}"><strong>${esc(c.name)}</strong><span class="muted">${n ? plural(n, 'sample recipe') : 'Recipes coming soon'}</span></a>`;
          }).join('')}</div>`
            : empty({ icon: '🌍', title: 'Pick your favourite cuisines', text: 'Explore over 100 food traditions, from Pakistani and Hungarian to Ethiopian and Thai.', action: '<a class="btn btn--primary" href="#/cuisines">Browse cuisines</a>' })}
        </section>

        ${quick.length ? `<section class="section">
          <div class="section__head"><div><h2>Quick & easy</h2><p>Ready in 20 minutes or less.</p></div></div>
          <div class="carousel">${quick.map(recipeCard).join('')}</div>
        </section>` : ''}

        ${recent.length ? `<section class="section">
          <div class="section__head"><div><h2>Recently viewed</h2></div></div>
          <div class="carousel">${recent.map(recipeCard).join('')}</div>
        </section>` : ''}

        <p class="footer-note">Cooksy prototype · ${Cooksy.catalog.all().length} sample recipes across ${new Set(Cooksy.catalog.all().map((r) => r.cuisine)).size} cuisines. The catalog is designed to grow to 10,000+ recipes. Nutrition values are estimates.</p>`;
    },
    submits: {
      search: (form) => {
        const q = form.q.value.trim();
        location.hash = `#/explore${q ? '?q=' + encodeURIComponent(q) : ''}`;
      },
    },
  };
})();
