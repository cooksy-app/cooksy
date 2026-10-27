window.Cooksy = window.Cooksy || {};
Cooksy.views = Cooksy.views || {};

(() => {
  const { esc, normalize } = Cooksy.util;
  const { icon } = Cooksy.ui;
  let profileError = '';
  let cq = '';

  const getProfile = () => Cooksy.store.get().profile;
  const mutate = (fn) => Cooksy.store.update((s) => fn(s.profile));

  const DIETS = [['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'], ['pescatarian', 'Pescatarian'], ['halal', 'Halal']];

  Cooksy.views.settings = {
    title: () => 'Settings',
    render() {
      const p = getProfile();
      const nq = normalize(cq);
      const matches = nq ? Cooksy.CUISINES.filter((c) => normalize(c.name).includes(nq) && !p.favoriteCuisines.includes(c.id)).slice(0, 12) : [];
      return `
        <div class="settings">
          <div class="page-head"><h1>Settings</h1><p>Your preferences are stored on this device only.</p></div>

          <form class="panel" data-submit="profile" aria-labelledby="s-profile" novalidate>
            <div class="panel__head"><h2 id="s-profile">Profile</h2><p>No legal name or contact details needed.</p></div>
            <div class="form-grid">
              <div class="field"><label for="s-name">Display name</label><input class="input" id="s-name" name="name" value="${esc(p.name)}" maxlength="40" required ${profileError ? 'aria-invalid="true"' : ''}></div>
              <div class="field"><label for="s-age">Age <span class="muted">(optional)</span></label><input class="input" id="s-age" name="age" type="number" min="1" max="120" inputmode="numeric" value="${p.age ?? ''}"></div>
              <div class="field"><label for="s-country">Country</label><select class="select" id="s-country" name="country"><option value="">Prefer not to say</option>
                ${Cooksy.COUNTRIES.map((c) => `<option value="${c.code}" ${p.country === c.code ? 'selected' : ''}>${c.flag} ${esc(c.name)}</option>`).join('')}</select></div>
            </div>
            ${profileError ? `<p class="error-text" role="alert" style="margin-top:8px">${esc(profileError)}</p>` : ''}
            <div class="row" style="margin-top:16px"><button class="btn btn--primary" type="submit">Save profile</button></div>
          </form>

          <section class="panel" aria-labelledby="s-cuisines">
            <div class="panel__head"><h2 id="s-cuisines">Favourite cuisines</h2><p>These appear first on your home screen. <a class="link" href="#/cuisines">Browse all cuisines</a></p></div>
            ${p.favoriteCuisines.length ? `<div class="chips">${p.favoriteCuisines.map((id) => Cooksy.cuisineById(id)).filter(Boolean).map((c) => `<button type="button" class="chip chip--removable" data-action="toggle-cuisine-fav" data-id="${c.id}" aria-label="Remove ${esc(c.name)}">${esc(c.name)} ${icon('x')}</button>`).join('')}</div>` : '<p class="muted small">No favourites yet.</p>'}
            <div class="search" style="margin-top:14px">${icon('search')}<input class="input" id="s-cq" type="search" placeholder="Add a cuisine…" value="${esc(cq)}" data-input="cq" aria-label="Search cuisines to add" autocomplete="off"></div>
            ${matches.length ? `<div class="chips" style="margin-top:10px">${matches.map((c) => `<button type="button" class="chip" data-action="add-cuisine" data-id="${c.id}">${icon('plus')}${esc(c.name)}</button>`).join('')}</div>` : nq ? '<p class="small muted" style="margin-top:8px">No other cuisines match.</p>' : ''}
          </section>

          <section class="panel" aria-labelledby="s-allergy">
            <div class="panel__head"><h2 id="s-allergy">Allergies, gluten & ingredients to avoid</h2><p>Changes apply immediately across Home, Explore, cuisine pages and recipes.</p></div>
            <div class="stack" style="--stack:20px">${Cooksy.views.shared.allergyEditor(p, 'set')}</div>
          </section>

          <section class="panel" aria-labelledby="s-diet">
            <div class="panel__head"><h2 id="s-diet">Dietary preferences</h2><p>Optional. Recipes that don’t fit are hidden.</p></div>
            <div class="chips">${DIETS.map(([id, label]) => `<button type="button" class="chip" data-action="toggle-diet" data-id="${id}" aria-pressed="${p.diets.includes(id)}">${p.diets.includes(id) ? icon('check') : ''}${label}</button>`).join('')}</div>
            <p class="small muted" style="margin-top:10px">Halal: meat is flagged as needing a halal-certified source; check certification yourself.</p>
          </section>

          <section class="panel" aria-labelledby="s-about">
            <div class="panel__head"><h2 id="s-about">About this prototype</h2></div>
            <ul class="small" style="margin:0;padding-left:18px;display:grid;gap:6px;color:var(--ink-2)">
              <li>${Cooksy.catalog.all().length} hand-written sample recipes and ${Cooksy.CUISINES.length} cuisines. The catalog structure is built to grow to 10,000+ recipes.</li>
              <li>Nutrition values are rough estimates, not lab-tested.</li>
              <li>${Cooksy.auth.enabled ? 'Your account verifies your email. Recipes, kitchen and lists are saved on this device only.' : 'Accounts are off. Everything is saved in this browser on this device.'}</li>
            </ul>
          </section>

          <section class="danger-zone" aria-labelledby="s-account">
            <h2 id="s-account" style="font-size:1.2rem">Account</h2>
            <p class="small muted" style="margin:6px 0 16px">${Cooksy.store.get().account ? `Signed in as <b>${esc(Cooksy.store.get().account.email)}</b> (verified). ` : ''}Download a copy of your data, or sign out of Cooksy on this device.</p>
            <div class="row">
              <button class="btn btn--secondary" data-action="export">${icon('download')} Download my data</button>
              <button class="btn btn--danger-outline" data-action="signout">${icon('logout')} Sign out</button>
            </div>
          </section>
        </div>`;
    },
    inputs: {
      cq: (el) => { cq = el.value; Cooksy.app.render(); },
      ...Cooksy.views.shared.allergyInputs(),
    },
    changes: { ...Cooksy.views.shared.allergyChanges(getProfile, mutate) },
    actions: {
      ...Cooksy.views.shared.allergyActions(getProfile, mutate),
      'add-cuisine': (el) => { cq = ''; mutate((p) => { p.favoriteCuisines = [...p.favoriteCuisines, el.dataset.id]; }); },
      'toggle-diet': (el) => {
        const id = el.dataset.id;
        mutate((p) => { p.diets = p.diets.includes(id) ? p.diets.filter((x) => x !== id) : [...p.diets, id]; });
      },
      export: () => {
        const blob = new Blob([JSON.stringify(Cooksy.store.get(), null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'cooksy-data.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      },
      signout: async () => {
        const ok = await Cooksy.ui.confirm({
          title: 'Sign out of Cooksy?',
          text: 'Your profile, allergy settings, kitchen, shopping list and favourites are stored on this device only, so signing out removes them from here. Download your data first if you want a copy.',
          confirmLabel: 'Sign out',
          danger: true,
        });
        if (!ok) return;
        await Cooksy.auth.signOut();
        Cooksy.store.reset();
        location.hash = '#/home';
        Cooksy.ui.toast('You’ve been signed out');
      },
    },
    submits: {
      profile: (form) => {
        const name = form.name.value.trim();
        const age = form.age.value === '' ? null : Number(form.age.value);
        if (!name) { profileError = 'Please enter a display name.'; Cooksy.app.render(); return; }
        if (age != null && (!Number.isFinite(age) || age < 1 || age > 120)) { profileError = 'Age must be between 1 and 120, or left empty.'; Cooksy.app.render(); return; }
        profileError = '';
        mutate((p) => { p.name = name; p.age = age; p.country = form.country.value || null; });
        Cooksy.ui.toast('Profile saved');
      },
    },
  };
})();
