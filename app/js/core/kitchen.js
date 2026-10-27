/* Matching between free-text home inventory items and catalog ingredients.
   Matching is deliberately conservative: exact name/alias = "have", a partial word match
   = "maybe" (the user confirms), anything else = "missing". Users can override each result. */
window.Cooksy = window.Cooksy || {};

Cooksy.kitchen = (() => {
  const { normalize } = Cooksy.util;
  let index = null;

  function buildIndex() {
    index = new Map();
    for (const ing of Cooksy.INGREDIENTS) {
      for (const n of [ing.name, ing.name.replace(/\(.*?\)/g, ''), ...ing.aliases]) {
        const key = normalize(n);
        if (key && !index.has(key)) index.set(key, ing.id);
      }
    }
    return index;
  }

  const DESCRIPTORS = new Set(['fresh', 'organic', 'large', 'small', 'medium', 'ripe', 'dried', 'whole', 'chopped', 'canned', 'tinned', 'pack', 'of', 'bag', 'jar', 'bottle']);

  /** Resolve a free-text name to a catalog ingredient id, or null. */
  function resolve(name) {
    if (!index) buildIndex();
    const key = normalize(name);
    if (index.has(key)) return index.get(key);
    const stripped = key.split(' ').filter((w) => !DESCRIPTORS.has(w)).join(' ');
    return index.get(stripped) || null;
  }

  function tokens(s) {
    return normalize(s).split(' ').filter((w) => w.length > 2 && !DESCRIPTORS.has(w) && w !== 'frozen');
  }

  /** Find inventory items for an ingredient: exact matches first, then partial ("maybe") matches. */
  function findInInventory(ing, inventory) {
    const exact = inventory.filter((it) => it.ingredientId === ing.id || (!it.ingredientId && resolve(it.name) === ing.id));
    if (exact.length) return { status: 'have', items: exact };
    // Partial: one name is a more general/specific form of the other ("rice" vs "basmati rice").
    const names = [ing.name.replace(/\(.*?\)/g, ''), ...ing.aliases].map(tokens).filter((t) => t.length);
    const subset = (a, b) => a.every((w) => b.includes(w));
    const partial = inventory.filter((it) => {
      const t = tokens(it.name);
      return t.length && names.some((n) => subset(t, n) || subset(n, t));
    });
    if (partial.length) return { status: 'maybe', items: partial };
    return { status: 'missing', items: [] };
  }

  /**
   * Compare a recipe (as evaluated by safety, so substitutions are respected) with home inventory.
   * Returns one row per line: { lineInfo, ing, status: 'have'|'maybe'|'missing'|'skip', items, overridden }
   */
  function compare(recipe, evaluation, inventory, overrides) {
    const ov = overrides?.[recipe.id] || {};
    return evaluation.lines.map((l) => {
      if (l.omitted || !l.ing) return { l, ing: null, status: 'skip', items: [] };
      if (l.ing.skip) return { l, ing: l.ing, status: 'skip', items: [] };
      const found = findInInventory(l.ing, inventory);
      const forced = ov[l.ing.id];
      return {
        l, ing: l.ing, items: found.items, detected: found.status,
        status: forced || found.status, overridden: !!forced && forced !== found.status,
      };
    });
  }

  /** Share of required ingredients the user has (maybe counts half). */
  function cookability(rows) {
    const req = rows.filter((r) => r.status !== 'skip' && !r.l.line.optional);
    if (!req.length) return { have: 0, total: 0, score: 0, missing: [] };
    const have = req.filter((r) => r.status === 'have').length;
    const maybe = req.filter((r) => r.status === 'maybe').length;
    return {
      have, maybe, total: req.length,
      score: (have + maybe * 0.5) / req.length,
      missing: req.filter((r) => r.status === 'missing').map((r) => r.ing),
    };
  }

  return { resolve, findInInventory, compare, cookability, buildIndex };
})();
