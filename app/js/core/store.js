/* App state, persisted to localStorage (no backend in the prototype).
   Every mutation goes through `update()` so subscribers re-render and state is saved. */
window.Cooksy = window.Cooksy || {};

Cooksy.store = (() => {
  const KEY = 'cooksy:v1';

  const emptyProfile = () => ({
    name: '', age: null, country: null, favoriteCuisines: [],
    allergens: [], avoid: [], glutenFree: false, diets: [],
  });

  const initialState = () => ({
    version: 1,
    account: null, // { email, verifiedAt } once the email is verified (when accounts are on)
    profile: null, // null until onboarding is complete
    favorites: [], // recipe ids
    recent: [], // recipe ids, most recent first
    inventory: [], // { id, name, ingredientId, qty, location, expiry }
    shopping: [], // { id, name, ingredientId, qty, recipeId, checked }
    matchOverrides: {}, // { [recipeId]: { [ingredientId]: 'have' | 'missing' } }
    subChoices: {}, // { [recipeId]: { [ingredientId]: substituteId | '__omit' } }
  });

  let state = initialState();
  let storageOk = true;
  const listeners = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = { ...initialState(), ...JSON.parse(raw) };
    } catch (e) {
      storageOk = false;
      console.warn('Cooksy: could not read saved data', e);
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageOk = true;
    } catch (e) {
      storageOk = false;
      console.warn('Cooksy: could not save data', e);
    }
  }

  function update(mutator) {
    const draft = structuredClone(state);
    mutator(draft);
    state = draft;
    save();
    listeners.forEach((fn) => fn(state));
  }

  const get = () => state;
  const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

  function reset() {
    state = initialState();
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    listeners.forEach((fn) => fn(state));
  }

  /* Example items so "My Kitchen" and "Cook with what I have" are useful straight away.
     Clearly labelled as examples in the UI; the user can edit or remove them. */
  function sampleInventory() {
    const R = Cooksy.kitchen.resolve;
    const add = (name, qty, location, expiryInDays) => {
      let expiry = null;
      if (expiryInDays != null) {
        const d = new Date();
        d.setDate(d.getDate() + expiryInDays);
        expiry = d.toISOString().slice(0, 10);
      }
      return { id: Cooksy.util.uid(), name, ingredientId: R(name), qty, location, expiry, example: true };
    };
    return [
      add('Frozen parathas', '1 pack (5 pcs)', 'Freezer', 60),
      add('Frozen peas', '500 g', 'Freezer', 120),
      add('Eggs', '6', 'Fridge', 12),
      add('Tomatoes', '4', 'Fridge', 3),
      add('Plain yogurt', '1 tub', 'Fridge', 5),
      add('Green chillies', 'a handful', 'Fridge', 4),
      add('Onions', '1 kg', 'Pantry'),
      add('Garlic', '1 bulb', 'Pantry'),
      add('Basmati rice', '2 kg', 'Pantry'),
      add('Red lentils', '500 g', 'Pantry'),
      add('Vegetable oil', '1 bottle', 'Pantry'),
      add('Salt', '1 pack', 'Pantry'),
      add('Cumin seeds', '1 jar', 'Pantry'),
      add('Turmeric', '1 jar', 'Pantry'),
      add('Red chili powder', '1 jar', 'Pantry'),
      add('Black pepper', '1 jar', 'Pantry'),
    ];
  }

  load();
  return { get, update, subscribe, reset, emptyProfile, sampleInventory, storageOk: () => storageOk };
})();
