/* A–Z cuisine directory and single-cuisine pages. */
window.Cooksy = window.Cooksy || {};
Cooksy.views = Cooksy.views || {};

(() => {
  const { esc, normalize, plural } = Cooksy.util;
  const { icon, recipeCard, empty } = Cooksy.ui;
  let q = '';
  let region = '';
  let favOnly = false;

  function row(c, favs) {
    const n = Cooksy.catalog.countForCuisine(c.id);
    const on = favs.includes(c.id);
    return `<li class="cuisine-row">
      <a href="#/cuisine/${c.id}"><strong>${esc(c.name)}</strong><span>${esc(c.region)} · ${n ? plural(n, 'sample recipe') : 'Recipes coming soon'}</span></a>
      <button class="icon-btn icon-btn--sm star" data-action="toggle-cuisine-fav" data-id="${c.id}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Add'} ${esc(c.name)} ${on ? 'from' : 'to'} favourite cuisines">${icon('star')}</button>
    </li>`;
  }

  Cooksy.views.cuisines = {
    title: () => 'Cuisines A–Z',
    render() {
      const favs = Cooksy.store.get().profile.favoriteCuisines;
      const nq = normalize(q);
      const list = Cooksy.CUISINES
        .filter((c) => !nq || normalize(`${c.name} ${c.region} ${c.blurb}`).includes(nq))
        .filter((c) => !region || c.region === region)
        .filter((c) => !favOnly || favs.includes(c.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      const groups = {};
      list.forEach((c) => { const L = c.name[0].toUpperCase(); (groups[L] = groups[L] || []).push(c); });
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

      return `
        <div class="page-head"><h1>Cuisines A–Z</h1><p>${Cooksy.CUISINES.length} food traditions from around the world. A cuisine is a region’s way of cooking; open one to see its dishes. Star the ones you love.</p></div>
        <div class="tabs" role="tablist" aria-label="Explore"><a href="#/explore" role="tab" aria-selected="false">Recipes</a><a href="#/cuisines" role="tab" aria-selected="true">Cuisines A–Z</a></div>
        <div class="form-grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">
          <div class="search">${icon('search')}<input class="input" id="cuisine-q" type="search" placeholder="Search cuisines or regions" value="${esc(q)}" data-input="q" aria-label="Search cuisines"></div>
          <select class="select" id="cuisine-region" data-change="region" aria-label="Filter by region"><option value="">All regions</option>
            ${Cooksy.CUISINE_REGIONS.map((r) => `<option ${region === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
        </div>
        <div class="row" style="margin-top:12px"><button class="chip" data-action="fav-only" aria-pressed="${favOnly}">${icon('star')} My favourites (${favs.length})</button></div>
        <nav class="az-nav" aria-label="Jump to letter">${letters.map((L) => (groups[L] ? `<a href="#az-${L}" data-action="jump" data-letter="${L}">${L}</a>` : `<span aria-hidden="true">${L}</span>`)).join('')}</nav>
        ${list.length ? Object.keys(groups).map((L) => `
          <section class="az-group" id="az-${L}" aria-labelledby="azh-${L}">
            <h2 class="az-letter" id="azh-${L}">${L}</h2>
            <ul class="grid grid--tight" style="list-style:none;padding:0;margin:0;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${groups[L].map((c) => row(c, favs)).join('')}</ul>
          </section>`).join('')
          : empty({ icon: '🌍', title: 'No cuisines match', text: favOnly ? 'You haven’t starred any cuisines yet.' : 'Try another spelling or region.', action: '<button class="btn btn--primary" data-action="reset">Show all cuisines</button>' })}`;
    },
    inputs: { q: (el) => { q = el.value; Cooksy.app.render(); } },
    changes: { region: (el) => { region = el.value; Cooksy.app.render(); } },
    actions: {
      'fav-only': () => { favOnly = !favOnly; Cooksy.app.render(); },
      reset: () => { q = ''; region = ''; favOnly = false; Cooksy.app.render(); },
      jump: (el, e) => { e.preventDefault(); document.getElementById(`az-${el.dataset.letter}`)?.scrollIntoView({ behavior: 'smooth' }); },
    },
  };

  Cooksy.views.cuisine = {
    title: ({ id }) => Cooksy.cuisineById(id)?.name || 'Cuisine',
    render({ id }) {
      const c = Cooksy.cuisineById(id);
      if (!c) return empty({ icon: '🧭', title: 'Cuisine not found', text: 'It may have been renamed.', action: '<a class="btn btn--primary" href="#/cuisines">All cuisines</a>' });
      const favs = Cooksy.store.get().profile.favoriteCuisines;
      const on = favs.includes(c.id);
      const total = Cooksy.catalog.countForCuisine(c.id);
      const { results, hiddenCount } = Cooksy.catalog.discover({ cuisine: c.id, includeSwaps: true });
      const countries = c.countries.map(Cooksy.countryByCode).filter(Boolean);
      return `
        <a class="back-link" href="#/cuisines">${icon('back')} All cuisines</a>
        <div class="row row--between page-head" style="align-items:flex-start">
          <div><span class="eyebrow">${esc(c.region)}${countries.length ? ' · ' + countries.map((x) => x.flag).join(' ') : ''}</span><h1 style="margin-top:6px">${esc(c.name)} cuisine</h1><p>${esc(c.blurb)}</p></div>
          <button class="btn ${on ? 'btn--accent' : 'btn--secondary'}" data-action="toggle-cuisine-fav" data-id="${c.id}" aria-pressed="${on}">${icon('star')} ${on ? 'Favourite' : 'Add to favourites'}</button>
        </div>
        ${hiddenCount ? `<div class="banner banner--info" style="margin-bottom:18px">${icon('shield')}<div>${plural(hiddenCount, 'recipe')} hidden because of your allergy & diet settings.</div></div>` : ''}
        ${results.length ? `<div class="grid">${results.map(recipeCard).join('')}</div>`
          : empty({
            icon: '🍲',
            title: total ? 'Nothing suitable here yet' : `${c.name} recipes are coming soon`,
            text: total ? 'All sample recipes in this cuisine conflict with your settings.' : 'Our prototype has a small sample catalog. The full app is built to grow to 10,000+ recipes across cuisines.',
            action: '<a class="btn btn--primary" href="#/explore">Explore all recipes</a>',
          })}`;
    },
  };
})();
