/* Centralised allergy, gluten and diet rules.
   Every discovery surface (home, explore, cuisine pages, "cook with what I have") and the
   recipe page go through `evaluateRecipe`, so the rules live in exactly one place.

   The app never claims a recipe is allergen-free: it only reports what the listed
   ingredients contain, and always asks the user to check labels. */
window.Cooksy = window.Cooksy || {};

Cooksy.safety = (() => {
  const { normalize, hasPhrase } = Cooksy.util;
  const OMIT = '__omit';

  const aliasIndex = Cooksy.ALLERGENS.map((a) => ({
    id: a.id,
    aliases: a.aliases.map(normalize),
    exceptions: (Cooksy.ALIAS_EXCEPTIONS[a.id] || []).map(normalize),
  }));

  /** Allergens implied by words in a free-text name (e.g. "paneer" → milk). */
  function detectAllergens(name) {
    const text = normalize(name);
    const found = new Set();
    for (const a of aliasIndex) {
      if (a.exceptions.some((ex) => hasPhrase(text, ex))) continue;
      if (a.aliases.some((al) => hasPhrase(text, al))) found.add(a.id);
    }
    return found;
  }

  /** Map a user's "avoid" term to allergen ids when it names an allergen group ("dairy", "nuts"). */
  function termAllergens(term) {
    const t = normalize(term);
    return Cooksy.ALLERGENS.filter((a) => a.id === t || a.terms.map(normalize).includes(t)).map((a) => a.id);
  }

  function ingredientAllergens(ing) {
    const contains = new Set(ing.allergens || []);
    detectAllergens(ing.name).forEach((a) => contains.add(a));
    const may = new Set((ing.may || []).filter((a) => !contains.has(a)));
    return { contains, may };
  }

  /** Which avoid term (if any) matches this ingredient's name or aliases. */
  function matchAvoid(ing, avoid) {
    const names = [ing.name, ...(ing.aliases || [])].map(normalize);
    for (const term of avoid || []) {
      const t = normalize(term);
      if (!t) continue;
      if (names.some((n) => hasPhrase(n, t) || hasPhrase(t, n))) return term;
    }
    return null;
  }

  const short = (id) => Cooksy.allergenById(id)?.short || id;

  /** Check one ingredient against the profile. Blocks = must not use; cautions = check before using. */
  function checkIngredient(ing, profile) {
    const p = profile || Cooksy.store.emptyProfile();
    const blocks = [];
    const cautions = [];
    const { contains, may } = ingredientAllergens(ing);
    const userAllergens = new Set(p.allergens || []);
    (p.avoid || []).forEach((t) => termAllergens(t).forEach((a) => userAllergens.add(a)));
    if (p.glutenFree) userAllergens.add('gluten');

    contains.forEach((a) => {
      if (userAllergens.has(a)) blocks.push({ code: 'allergen', allergen: a, text: `Contains ${short(a).toLowerCase()}` });
    });
    const avoidHit = matchAvoid(ing, p.avoid);
    if (avoidHit) blocks.push({ code: 'avoid', text: `You avoid “${avoidHit}”` });

    const diets = new Set(p.diets || []);
    if (diets.has('vegan') && ing.animal) blocks.push({ code: 'diet', text: 'Not vegan' });
    else if (diets.has('vegetarian') && (ing.meat || ing.fish)) blocks.push({ code: 'diet', text: 'Not vegetarian' });
    else if (diets.has('pescatarian') && ing.meat) blocks.push({ code: 'diet', text: 'Not pescatarian' });
    if (diets.has('halal') && ing.halal === 'no') blocks.push({ code: 'diet', text: 'Not halal' });

    may.forEach((a) => {
      if (userAllergens.has(a)) {
        cautions.push({ code: 'may', allergen: a, text: `May contain ${short(a).toLowerCase()} depending on the brand. Check the label.` });
      }
    });
    if (p.glutenFree && !contains.has('gluten') && (ing.gfLabel || may.has('gluten'))) {
      if (!cautions.some((c) => c.allergen === 'gluten')) {
        cautions.push({ code: 'gf', allergen: 'gluten', text: 'Buy a certified or clearly labelled gluten-free version.' });
      }
    }
    if (diets.has('halal') && (ing.halal === 'cert' || ing.halal === 'check')) {
      cautions.push({ code: 'halal', text: ing.halalNote || 'Check for halal certification.' });
    }
    if ((diets.has('vegetarian') || diets.has('pescatarian')) && ing.vegNote && !blocks.length) {
      cautions.push({ code: 'veg', text: ing.vegNote });
    }
    return { blocks, cautions };
  }

  /** The ingredient actually used for a line, after the user's substitution choice. */
  function effectiveLine(recipe, line, subChoices) {
    const choice = subChoices?.[recipe.id]?.[line.id];
    const original = Cooksy.ingredientById(line.id);
    if (choice === OMIT) return { original, ing: null, omitted: true, substituted: true };
    if (choice && Cooksy.ingredientById(choice)) {
      return { original, ing: Cooksy.ingredientById(choice), omitted: false, substituted: true };
    }
    return { original, ing: original, omitted: false, substituted: false };
  }

  /** Substitution options for an ingredient, each pre-checked against the profile. */
  function substitutionOptions(ing, profile) {
    return (ing?.subs || []).map((s) => {
      if (!s.to) return { id: OMIT, name: 'Leave it out', note: s.note, check: { blocks: [], cautions: [] } };
      const sub = Cooksy.ingredientById(s.to);
      return { id: s.to, name: sub.name, note: s.note, check: checkIngredient(sub, profile) };
    });
  }

  /**
   * Evaluate a recipe for a profile.
   * status: 'ok'      no listed ingredient conflicts (label checks may still apply)
   *         'swap'    conflicts exist but every one has a safe substitution the user can choose
   *         'blocked' at least one required ingredient conflicts with no safe substitution
   */
  function evaluateRecipe(recipe, profile, subChoices) {
    const lines = recipe.lines.map((line) => {
      const eff = effectiveLine(recipe, line, subChoices);
      const check = eff.ing ? checkIngredient(eff.ing, profile) : { blocks: [], cautions: [] };
      const options = check.blocks.length ? substitutionOptions(eff.original, profile).filter((o) => !o.check.blocks.length) : [];
      return { line, ...eff, check, safeOptions: options };
    });
    const required = lines.filter((l) => !l.line.optional && !l.omitted);
    const conflicts = required.filter((l) => l.check.blocks.length);
    const optionalConflicts = lines.filter((l) => l.line.optional && !l.omitted && l.check.blocks.length);
    const cautions = lines.filter((l) => l.ing && !l.check.blocks.length && l.check.cautions.length);
    const labelChecks = lines.filter((l) => l.ing && l.ing.packaged).map((l) => l.ing);

    let status = 'ok';
    if (conflicts.length) status = conflicts.every((l) => l.safeOptions.length) ? 'swap' : 'blocked';
    return { status, lines, conflicts, optionalConflicts, cautions, labelChecks };
  }

  /** Profile-independent facts about a recipe, used for tags and filters. */
  function recipeFacts(recipe) {
    const req = recipe.lines.filter((l) => !l.optional).map((l) => Cooksy.ingredientById(l.id)).filter(Boolean);
    const all = recipe.lines.map((l) => Cooksy.ingredientById(l.id)).filter(Boolean);
    const contains = new Set();
    const may = new Set();
    req.forEach((ing) => {
      const a = ingredientAllergens(ing);
      a.contains.forEach((x) => contains.add(x));
      a.may.forEach((x) => may.add(x));
    });
    contains.forEach((x) => may.delete(x));
    const optionalContains = new Set();
    all.filter((ing) => !req.includes(ing)).forEach((ing) => {
      ingredientAllergens(ing).contains.forEach((x) => { if (!contains.has(x)) optionalContains.add(x); });
    });
    const vegetarian = !req.some((i) => i.meat || i.fish);
    const vegan = !req.some((i) => i.animal);
    const halalBlocked = req.some((i) => i.halal === 'no');
    return {
      contains, may, optionalContains,
      vegetarian,
      vegan,
      pescatarian: !req.some((i) => i.meat),
      noGlutenIngredients: !contains.has('gluten'),
      halal: !halalBlocked,
      halalNeedsCert: req.some((i) => i.halal === 'cert'),
      halalCheck: req.some((i) => i.halal === 'check'),
      vegCheck: vegetarian && req.some((i) => i.vegNote),
    };
  }

  /** Short sentence describing the active safety settings, or null when none are set. */
  function profileSummary(profile) {
    if (!profile) return null;
    const parts = (profile.allergens || []).map(short);
    if (profile.glutenFree && !parts.includes('Gluten')) parts.push('Gluten');
    parts.push(...(profile.avoid || []).map((t) => `“${t}”`));
    return parts.length ? parts : null;
  }

  return {
    OMIT, detectAllergens, termAllergens, ingredientAllergens, checkIngredient, substitutionOptions,
    evaluateRecipe, recipeFacts, profileSummary, effectiveLine,
  };
})();
