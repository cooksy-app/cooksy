/* Reusable UI pieces: icons, recipe cards, banners, modal, toast. */
window.Cooksy = window.Cooksy || {};

Cooksy.ui = (() => {
  const { esc, minutes } = Cooksy.util;

  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    explore: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    kitchen: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M5 10h14"/><path d="M9 6v1.5M9 13v3"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L21 7.5H6.4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    star: '<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    label: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
    swap: '<path d="M17 3l4 4-4 4"/><path d="M3 11V9a2 2 0 0 1 2-2h16"/><path d="M7 21l-4-4 4-4"/><path d="M21 13v2a2 2 0 0 1-2 2H3"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.5 5.1-6.1 2.4-.5 4.9-2 5.9-3.9"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.4 1.5 1.6 2.7 2.5 2.7z"/>',
  };
  const icon = (name, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[name] || ''}</svg>`;

  function art(recipe, cls = '') {
    const a = recipe.art || { emoji: '🍽️', hue: 35 };
    const img = recipe.image ? `<img src="${esc(recipe.image)}" alt="" loading="lazy">` : '';
    return `<div class="art ${cls}" style="--h:${a.hue}" role="img" aria-label="Illustration of ${esc(recipe.name)}">${img || `<span class="art__emoji" aria-hidden="true">${a.emoji}</span>`}</div>`;
  }

  function favButton(recipeId, small = false) {
    const on = Cooksy.store.get().favorites.includes(recipeId);
    return `<button class="icon-btn ${small ? 'icon-btn--sm' : ''} fav-btn" data-action="toggle-fav" data-id="${recipeId}" aria-pressed="${on}" aria-label="${on ? 'Remove from' : 'Save to'} favourites">${icon('heart')}</button>`;
  }

  function statusTag(evaluation) {
    if (!evaluation) return '';
    if (evaluation.status === 'swap') return `<span class="tag tag--warn">${icon('swap')} Needs a swap</span>`;
    if (evaluation.status === 'blocked') return `<span class="tag tag--danger">${icon('alert')} Not suitable</span>`;
    return '';
  }

  function dietTags(recipe, max = 3) {
    const f = recipe.facts;
    const t = [];
    if (f.vegan) t.push('<span class="tag tag--green">Vegan</span>');
    else if (f.vegetarian) t.push('<span class="tag tag--green">Vegetarian</span>');
    // Only meaningful for meat dishes, or for users who asked for halal.
    const wantsHalal = Cooksy.store.get().profile?.diets?.includes('halal');
    if (f.halal && !f.halalCheck && (wantsHalal || f.halalNeedsCert)) t.push(`<span class="tag tag--saffron">Halal${f.halalNeedsCert ? '*' : ''}</span>`);
    if (f.noGlutenIngredients) t.push('<span class="tag">No gluten ingredients</span>');
    return t.slice(0, max).join('');
  }

  function recipeCard({ recipe, evaluation, stats }) {
    const c = recipe.cuisineInfo;
    const have = stats
      ? `<div class="recipe-card__have"><span>You have ${stats.have}${stats.maybe ? '+' + stats.maybe : ''}/${stats.total}</span><span class="meter" aria-hidden="true"><i style="width:${Math.round(stats.score * 100)}%"></i></span></div>`
      : '';
    return `
      <article class="card recipe-card">
        <div class="recipe-card__status">${statusTag(evaluation)}</div>
        ${favButton(recipe.id, true)}
        <a class="recipe-card__link" href="#/recipe/${recipe.id}">
          ${art(recipe)}
          <div class="recipe-card__body">
            <span class="eyebrow">${esc(c?.name || '')}</span>
            <h3 class="recipe-card__title">${esc(recipe.name)}</h3>
            <div class="recipe-card__meta">
              <span>${icon('clock')} ${minutes(recipe.total)}</span>
              <span>${icon('users')} ${recipe.servings}</span>
              <span>${icon('flame')} ~${recipe.nutrition.kcal} kcal</span>
            </div>
            <div class="tags">${dietTags(recipe, 2)}</div>
            ${have}
          </div>
        </a>
      </article>`;
  }

  function empty({ icon: emoji = '🍽️', title, text, action = '' }) {
    return `<div class="empty"><div class="empty__icon" aria-hidden="true">${emoji}</div><h3>${esc(title)}</h3><p>${text}</p>${action}</div>`;
  }

  function skeletonGrid(n = 6) {
    return `<div class="grid" aria-busy="true" aria-label="Loading recipes">${'<div class="skeleton skeleton-card"></div>'.repeat(n)}</div>`;
  }

  function errorState(message, retryAction = 'retry-load') {
    return empty({
      icon: '🥄',
      title: 'Something boiled over',
      text: `${esc(message)} Your saved data is safe. Please try again.`,
      action: `<button class="btn btn--primary" data-action="${retryAction}">Try again</button>`,
    });
  }

  /** Always-visible reminder used on recipe pages and discovery surfaces. */
  function labelReminder(compact = false) {
    const profile = Cooksy.store.get().profile;
    const gf = profile?.glutenFree;
    if (compact) {
      return `<div class="banner banner--info" role="note">${icon('label')}<div><strong>Check labels</strong>Recipes are filtered by their listed ingredients only. Packaged foods can contain allergens or traces that aren’t shown here.</div></div>`;
    }
    return `
      <div class="banner banner--info" role="note">${icon('label')}
        <div><strong>Check labels before you cook</strong>
        Cooksy checks the ingredients listed in each recipe against your settings, including common alternative names. It can’t see inside packaged products, so a recipe is never guaranteed allergen-free. Read every label and think about how food is prepared, especially when cooking for someone else.
        ${gf ? '<br><br><strong>Gluten-free:</strong> buy every packaged ingredient (spices, stock, sauces, oats, flours) in a certified or clearly labelled gluten-free version. Avoid cross-contamination: use clean boards, pans, toasters and oil that haven’t been used for gluten-containing food.' : ''}
        </div>
      </div>`;
  }

  // ---- Modal ----
  let lastFocus = null;
  function modal({ title, body, actions = '', onMount, labelledBy = 'modal-title' }) {
    closeModal();
    lastFocus = document.activeElement;
    const el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="${labelledBy}">
      <h2 id="modal-title">${esc(title)}</h2><div class="modal__body">${body}</div>
      <div class="modal__actions">${actions}</div></div>`;
    el.addEventListener('mousedown', (e) => { if (e.target === el) closeModal(); });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab') {
        const f = [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    document.body.appendChild(el);
    const first = el.querySelector('[autofocus], input, select, button');
    first?.focus();
    onMount?.(el);
    return el;
  }
  function closeModal() {
    const el = document.querySelector('.modal-backdrop');
    if (el) { el.remove(); lastFocus?.focus?.(); }
  }
  function confirm({ title, text, confirmLabel = 'Confirm', danger = false }) {
    return new Promise((resolve) => {
      const el = modal({
        title,
        body: `<p>${text}</p>`,
        actions: `<button class="btn btn--secondary" data-r="0">Cancel</button><button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-r="1">${esc(confirmLabel)}</button>`,
      });
      el.querySelector('[data-r="0"]').focus();
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-r]');
        if (!b) return;
        closeModal();
        resolve(b.dataset.r === '1');
      });
    });
  }

  // ---- Toast ----
  function toast(message, { actionLabel, onAction, duration = 3800 } = {}) {
    let host = document.querySelector('.toasts');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toasts';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span>${esc(message)}</span>${actionLabel ? `<button>${esc(actionLabel)}</button>` : ''}`;
    if (actionLabel) t.querySelector('button').addEventListener('click', () => { onAction?.(); t.remove(); });
    host.appendChild(t);
    setTimeout(() => t.remove(), duration);
  }

  return { icon, art, favButton, statusTag, dietTags, recipeCard, empty, skeletonGrid, errorState, labelReminder, modal, closeModal, confirm, toast };
})();
