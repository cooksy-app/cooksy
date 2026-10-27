/* Allergen definitions.
   `aliases` are words that, when found in an ingredient name, indicate the allergen.
   They are used as a second line of defence on top of each ingredient's explicit allergen list,
   and to classify free-text items (custom shopping items, home inventory, "avoid" terms). */
window.Cooksy = window.Cooksy || {};

Cooksy.ALLERGENS = [
  {
    id: 'gluten', label: 'Gluten (wheat, barley, rye)', short: 'Gluten',
    terms: ['gluten', 'wheat', 'coeliac', 'celiac'],
    aliases: ['wheat', 'flour', 'atta', 'maida', 'barley', 'rye', 'semolina', 'suji', 'sooji', 'couscous',
      'bulgur', 'spelt', 'seitan', 'bread', 'pasta', 'spaghetti', 'noodle', 'breadcrumb', 'malt', 'paratha',
      'roti', 'chapati', 'naan', 'tortilla', 'cracker', 'biscuit', 'farro', 'freekeh', 'orzo', 'panko'],
  },
  {
    id: 'milk', label: 'Milk & dairy', short: 'Dairy',
    terms: ['milk', 'dairy', 'lactose', 'casein', 'whey'],
    aliases: ['milk', 'butter', 'ghee', 'cream', 'yogurt', 'yoghurt', 'dahi', 'curd', 'cheese', 'paneer',
      'whey', 'casein', 'lactose', 'tejfol', 'kefir', 'feta', 'parmesan', 'cheddar', 'mozzarella', 'ricotta',
      'labneh', 'skyr', 'khoa', 'malai', 'quark', 'turo'],
  },
  {
    id: 'egg', label: 'Eggs', short: 'Egg',
    terms: ['egg', 'eggs'],
    aliases: ['egg', 'eggs', 'mayonnaise', 'mayo', 'meringue', 'albumen', 'anda'],
  },
  {
    id: 'peanut', label: 'Peanuts', short: 'Peanut',
    terms: ['peanut', 'peanuts', 'groundnut'],
    aliases: ['peanut', 'groundnut', 'monkey nut', 'satay', 'arachis'],
  },
  {
    id: 'treenut', label: 'Tree nuts', short: 'Tree nuts',
    terms: ['nut', 'nuts', 'tree nut', 'tree nuts'],
    aliases: ['almond', 'hazelnut', 'walnut', 'cashew', 'pecan', 'pistachio', 'macadamia', 'brazil nut',
      'pine nut', 'praline', 'marzipan', 'badam', 'kaju', 'nutella'],
  },
  {
    id: 'soy', label: 'Soy', short: 'Soy',
    terms: ['soy', 'soya', 'soybean'],
    aliases: ['soy', 'soya', 'tofu', 'miso', 'edamame', 'tempeh', 'tamari', 'shoyu', 'gochujang', 'natto'],
  },
  {
    id: 'fish', label: 'Fish', short: 'Fish',
    terms: ['fish'],
    aliases: ['fish', 'anchovy', 'tuna', 'salmon', 'cod', 'sardine', 'mackerel', 'bonito', 'dashi', 'katsuobushi', 'tilapia'],
  },
  {
    id: 'crustacean', label: 'Crustacean shellfish', short: 'Crustaceans',
    terms: ['shellfish', 'crustacean', 'shrimp', 'prawn', 'crab', 'lobster'],
    aliases: ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'krill', 'jinga'],
  },
  {
    id: 'mollusc', label: 'Molluscs', short: 'Molluscs',
    terms: ['shellfish', 'mollusc', 'mollusk', 'squid', 'mussel', 'oyster', 'clam'],
    aliases: ['mussel', 'oyster', 'clam', 'squid', 'calamari', 'octopus', 'scallop', 'snail', 'oyster sauce'],
  },
  {
    id: 'sesame', label: 'Sesame', short: 'Sesame',
    terms: ['sesame', 'til'],
    aliases: ['sesame', 'tahini', 'tahina', 'til', 'gomasio', 'halva', 'halwa tahini'],
  },
  {
    id: 'mustard', label: 'Mustard', short: 'Mustard',
    terms: ['mustard'],
    aliases: ['mustard', 'rai', 'sarson'],
  },
  {
    id: 'celery', label: 'Celery', short: 'Celery',
    terms: ['celery', 'celeriac'],
    aliases: ['celery', 'celeriac'],
  },
  {
    id: 'sulphite', label: 'Sulphites', short: 'Sulphites',
    terms: ['sulphite', 'sulfite', 'sulphites', 'sulfites'],
    aliases: ['sulphite', 'sulfite', 'wine vinegar', 'wine'],
  },
  {
    id: 'lupin', label: 'Lupin', short: 'Lupin',
    terms: ['lupin', 'lupine'],
    aliases: ['lupin', 'lupine'],
  },
];

/* Phrases that contain an allergen alias but are not that allergen. Checked before alias detection. */
Cooksy.ALIAS_EXCEPTIONS = {
  milk: ['coconut milk', 'almond milk', 'oat milk', 'soy milk', 'soya milk', 'rice milk', 'plant milk', 'dairy free', 'peanut butter', 'butter bean', 'cocoa butter', 'shea butter', 'cream of tartar', 'nutritional yeast', 'plant yogurt', 'plant based', 'coconut yogurt', 'dairy free cheese', 'vegan cheese', 'seed butter', 'nut butter'],
  gluten: ['gluten free', 'rice flour', 'corn flour', 'cornflour', 'chickpea flour', 'gram flour', 'besan', 'almond flour', 'coconut flour', 'rice noodle', 'corn tortilla', 'buckwheat'],
  egg: ['eggplant', 'egg free', 'flax egg'],
  peanut: [],
  fish: ['vegan fish sauce', 'kombu dashi', 'fish free'],
  treenut: ['nutmeg', 'coconut', 'water chestnut'],
  sesame: [],
  sulphite: [],
};

Cooksy.allergenById = (id) => Cooksy.ALLERGENS.find((a) => a.id === id) || null;
