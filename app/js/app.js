/* App shell: hash router, navigation, global actions and re-rendering. */
window.Cooksy = window.Cooksy || {};

Cooksy.app = (() => {
  const { icon } = Cooksy.ui;
  const store = Cooksy.store;
  const V = () => Cooksy.views;

  const NAV = [
    { id: 'home', label: 'Home', icon: 'home', href: '#/home' },
    { id: 'explore', label: 'Explore', icon: 'explore', href: '#/explore' },
    { id: 'kitchen', label: 'My Kitchen', short: 'Kitchen', icon: 'kitchen', href: '#/kitchen' },
    { id: 'shopping', label: 'Shopping List', short: 'Shopping', icon: 'cart', href: '#/shopping' },
    { id: 'settings', label: 'Settings', icon: 'settings', href: '#/settings' },
  ];

  let current = { view: null, params: {}, section: 'home' };
  let forceAccount = false; // e.g. password-reset link opened

  /** Email verification is required when accounts are configured (js/config.js). */
  const needsAccount = () => Cooksy.auth.enabled && (forceAccount || !store.get().account);
  const activeView = () => (needsAccount() ? V().account : store.get().profile ? current.view : V().onboarding);

  /** Finish sign-in from a verification / reset link, then clean the tokens out of the URL. */
  async function handleAuthRedirect() {
    if (!Cooksy.auth.enabled || !Cooksy.auth.isAuthRedirect()) return;
    const hash = new URLSearchParams(location.hash.replace(/^#\/?/, ''));
    const recovery = hash.get('type') === 'recovery';
    const error = hash.get('error_description');
    let user = null;
    try { user = await Cooksy.auth.currentUser(); } catch (e) { console.warn(e); }
    history.replaceState(null, '', location.pathname + location.search + '#/home');
    if (error) {
      V().account.setMode('signin', { error: error.replace(/\+/g, ' ') + '. The link may have expired. Sign in to get a new one.' });
    } else if (recovery && user) {
      forceAccount = true;
      V().account.setMode('new-password', { email: user.email });
    } else if (user) {
      store.update((s) => { s.account = { email: user.email, verifiedAt: user.email_confirmed_at }; });
      setTimeout(() => Cooksy.ui.toast('Email verified! Welcome to Cooksy.'), 400);
    }
  }
  const root = () => document.getElementById('root');

  function parseRoute() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    const name = parts[0] || 'home';
    const routes = {
      home: () => ({ view: V().home, section: 'home' }),
      explore: () => ({ view: V().explore, section: 'explore' }),
      cuisines: () => ({ view: V().cuisines, section: 'explore' }),
      cuisine: () => ({ view: V().cuisine, section: 'explore', params: { id: parts[1] } }),
      recipe: () => ({ view: V().recipe, section: 'explore', params: { id: parts[1] } }),
      kitchen: () => ({ view: V().kitchen, section: 'kitchen' }),
      shopping: () => ({ view: V().shopping, section: 'shopping' }),
      settings: () => ({ view: V().settings, section: 'settings' }),
    };
    const r = (routes[name] || (() => ({ view: V().notFound, section: null })))();
    return { ...r, params: { ...(r.params || {}), query } };
  }

  function shell(content) {
    const openItems = store.get().shopping.filter((s) => !s.checked).length;
    const badge = (n) => (n ? `<span class="badge-count" aria-label="${n} items to buy">${n}</span>` : '');
    const link = (n, short) => `<a href="${n.href}" ${current.section === n.id ? 'aria-current="page"' : ''}>${icon(n.icon)}<span>${short ? n.short || n.label : n.label}</span>${n.id === 'shopping' ? badge(openItems) : ''}</a>`;
    return `
      <a class="skip-link" href="#main" data-action="skip">Skip to content</a>
      <div class="app">
        <header class="topbar"><div class="topbar__inner">
          <a class="brand" href="#/home" aria-label="Cooksy home">
            <img class="brand__mark" src="assets/cooksy-mark.png" alt="" width="44" height="44">
            <span class="brand__name">Cooksy<span class="brand__dot">.</span></span>
          </a>
          <nav class="nav" aria-label="Main">${NAV.map((n) => link(n)).join('')}</nav>
        </div></header>
        <main id="main" tabindex="-1">${content}</main>
        <nav class="tabbar" aria-label="Main">${NAV.map((n) => link(n, true)).join('')}</nav>
      </div>`;
  }

  /** Re-render while keeping focus, caret and scroll position (so typing in search isn't interrupted). */
  function render({ resetScroll = false } = {}) {
    const active = document.activeElement;
    const focusId = active && active.id;
    const sel = focusId && typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null;
    const y = window.scrollY;

    const state = store.get();
    let html;
    const gate = needsAccount();
    try {
      if (gate) {
        html = V().account.render();
      } else if (!state.profile) {
        html = V().onboarding.render();
      } else {
        html = shell(current.view.render(current.params));
      }
    } catch (e) {
      console.error(e);
      html = shell(Cooksy.ui.errorState('This page could not be displayed.', 'reload-page'));
    }
    root().innerHTML = html;
    activeView().afterRender?.(root(), current.params);

    if (resetScroll) window.scrollTo(0, 0);
    else window.scrollTo(0, y);
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) {
        el.focus({ preventScroll: true });
        if (sel) try { el.setSelectionRange(...sel); } catch (e) { /* not a text input */ }
      }
    }
  }

  function navigate() {
    current = parseRoute();
    document.title = current.view?.title ? `${current.view.title(current.params)} · Cooksy` : 'Cooksy';
    render({ resetScroll: true });
    if (store.get().profile) document.getElementById('main')?.focus({ preventScroll: true });
  }

  // ---- Global actions ----
  const globalActions = {
    'toggle-fav': (el) => {
      const id = el.dataset.id;
      const was = store.get().favorites.includes(id);
      store.update((s) => { s.favorites = was ? s.favorites.filter((x) => x !== id) : [id, ...s.favorites]; });
      Cooksy.ui.toast(was ? 'Removed from favourites' : 'Saved to favourites');
    },
    'toggle-cuisine-fav': (el) => {
      const id = el.dataset.id;
      store.update((s) => {
        const f = s.profile.favoriteCuisines;
        s.profile.favoriteCuisines = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      });
    },
    'retry-load': () => boot(),
    'reload-page': () => location.reload(),
    skip: (el, e) => { e.preventDefault(); document.getElementById('main')?.focus(); },
  };

  function dispatch(e, type) {
    const el = e.target.closest(`[data-${type}]`);
    if (!el || !root().contains(el)) return;
    const name = el.dataset[type];
    const view = activeView();
    const group = { action: 'actions', input: 'inputs', change: 'changes' }[type];
    const handler = view?.[group]?.[name] || (type === 'action' && globalActions[name]);
    if (handler) handler(el, e);
  }

  function boot() {
    const splash = document.getElementById('splash');
    const started = performance.now();
    const hideSplash = () => {
      const wait = Math.max(0, 1300 - (performance.now() - started));
      setTimeout(() => { splash?.classList.add('is-hidden'); splash?.setAttribute('aria-hidden', 'true'); }, wait);
    };
    Promise.all([Cooksy.catalog.load(), handleAuthRedirect()])
      .then(() => { navigate(); hideSplash(); })
      .catch((e) => {
        console.error(e);
        root().innerHTML = `<main style="padding:40px 16px;max-width:560px;margin:0 auto">${Cooksy.ui.errorState('We couldn’t load the recipe catalog.')}</main>`;
        hideSplash();
      });
  }

  function init() {
    document.addEventListener('click', (e) => dispatch(e, 'action'));
    document.addEventListener('input', (e) => dispatch(e, 'input'));
    document.addEventListener('change', (e) => dispatch(e, 'change'));
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('[data-submit]');
      if (!form) return;
      e.preventDefault();
      const view = activeView();
      view?.submits?.[form.dataset.submit]?.(form, e);
    });
    window.addEventListener('hashchange', navigate);
    store.subscribe(() => { if (Cooksy.catalog.isLoaded()) render(); });
    boot();
  }

  return { init, render, navigate, go: (hash) => { location.hash = hash; }, clearForceAccount: () => { forceAccount = false; } };
})();

document.addEventListener('DOMContentLoaded', () => {
  Cooksy.views.notFound = {
    title: () => 'Not found',
    render: () => Cooksy.ui.empty({ icon: '🧭', title: 'This page wandered off', text: 'We couldn’t find what you were looking for.', action: '<a class="btn btn--primary" href="#/home">Go home</a>' }),
  };
  Cooksy.app.init();
});
