/* Ingredient catalog.
   Each ingredient carries the facts the safety and kitchen logic depend on:
     allergens   allergens the ingredient contains
     may         allergens commonly present depending on brand / processing (label check)
     gfLabel     must be bought in a certified or clearly labelled gluten-free version
     meat/fish   for vegetarian & pescatarian filtering; animal for vegan filtering
     halal       'cert' = needs halal-certified source, 'check' = depends on product, 'no' = not halal
     packaged    usually bought packaged -> shown in the "check labels" list
     hard        markets (see countries.js) where it is often harder to find, with hardNote
     subs        substitution options (ids of other catalog ingredients) with an explanation
     skip        not compared against home inventory (e.g. water)
     loc         default storage location suggestion */
window.Cooksy = window.Cooksy || {};

(function () {
  const list = [];
  const I = (id, name, o = {}) => list.push({
    id, name, aliases: [], allergens: [], may: [], subs: [], hard: [], halal: 'ok', loc: 'Pantry', ...o,
  });
  const SOUTH_ASIAN_GROCER = 'Often sold at South Asian grocers, larger supermarkets or online.';

  // Vegetables & fruit
  I('onion', 'Onion', { aliases: ['onions', 'red onion', 'white onion', 'yellow onion', 'pyaz', 'hagyma'], loc: 'Pantry' });
  I('tomato', 'Tomato', { aliases: ['tomatoes', 'tamatar', 'paradicsom'], loc: 'Fridge' });
  I('canned-tomatoes', 'Canned chopped tomatoes', { aliases: ['tinned tomatoes', 'chopped tomatoes', 'crushed tomatoes', 'canned tomato'], packaged: true });
  I('tomato-paste', 'Tomato paste', { aliases: ['tomato puree', 'tomato concentrate'], packaged: true });
  I('garlic', 'Garlic', { aliases: ['garlic clove', 'garlic cloves', 'lehsan', 'fokhagyma'] });
  I('ginger', 'Fresh ginger', { aliases: ['ginger', 'ginger root', 'adrak'], loc: 'Fridge' });
  I('green-chili', 'Green chili', { aliases: ['green chilli', 'green chillies', 'green chilies', 'hari mirch', 'serrano', 'jalapeno'], loc: 'Fridge' });
  I('scotch-bonnet', 'Scotch bonnet pepper', { aliases: ['scotch bonnet', 'habanero', 'ata rodo'], loc: 'Fridge', hard: ['europe', 'south-asia', 'east-asia', 'mena'], hardNote: 'Look in African or Caribbean grocers.', subs: [{ to: 'green-chili', note: 'Any fresh hot chili works; start with less and taste.' }] });
  I('bell-pepper', 'Bell or Hungarian wax pepper', { aliases: ['bell pepper', 'bell peppers', 'capsicum', 'green pepper', 'red pepper', 'sweet pepper', 'paprika pepper', 'tv paprika', 'shimla mirch', 'wax pepper'], loc: 'Fridge' });
  I('potato', 'Potato', { aliases: ['potatoes', 'aloo', 'krumpli', 'burgonya'] });
  I('carrot', 'Carrot', { aliases: ['carrots', 'gajar', 'sargarepa'], loc: 'Fridge' });
  I('cauliflower', 'Cauliflower', { aliases: ['gobi', 'phool gobi'], loc: 'Fridge' });
  I('peas-frozen', 'Frozen peas', { aliases: ['peas', 'green peas', 'matar'], loc: 'Freezer' });
  I('mixed-veg-frozen', 'Frozen mixed vegetables', { aliases: ['mixed vegetables', 'frozen vegetables', 'mixed veg'], loc: 'Freezer' });
  I('cucumber', 'Cucumber', { aliases: ['cucumbers', 'kheera', 'uborka'], loc: 'Fridge' });
  I('spring-onion', 'Spring onion', { aliases: ['spring onions', 'scallion', 'scallions', 'green onion', 'green onions'], loc: 'Fridge' });
  I('avocado', 'Avocado', { aliases: ['avocados'] });
  I('lemon', 'Lemon', { aliases: ['lemons', 'lemon juice', 'nimbu', 'citrom'], loc: 'Fridge' });
  I('lime', 'Lime', { aliases: ['limes', 'lime juice'], loc: 'Fridge' });
  I('apple', 'Apple', { aliases: ['apples', 'alma'], loc: 'Fridge' });
  I('banana', 'Banana', { aliases: ['bananas'] });
  I('olives', 'Kalamata olives', { aliases: ['olives', 'black olives', 'olive'], packaged: true, may: ['sulphite'] });

  // Fresh herbs
  I('coriander-leaves', 'Fresh coriander (cilantro)', { aliases: ['coriander', 'cilantro', 'dhania', 'hara dhania', 'coriander leaves'], loc: 'Fridge' });
  I('mint', 'Fresh mint', { aliases: ['mint', 'mint leaves', 'pudina'], loc: 'Fridge' });
  I('parsley', 'Fresh parsley', { aliases: ['parsley', 'petrezselyem'], loc: 'Fridge' });
  I('chives', 'Fresh chives', { aliases: ['chives'], loc: 'Fridge' });
  I('curry-leaves', 'Curry leaves', { aliases: ['curry leaf', 'kari patta', 'kadi patta'], loc: 'Fridge', hard: ['europe', 'north-america', 'latam', 'east-asia', 'africa', 'oceania', 'mena'], hardNote: SOUTH_ASIAN_GROCER + ' Frozen curry leaves keep well.', subs: [{ to: null, note: 'Leave them out. There is no close match; the dish will still taste good.' }] });

  // Dairy, eggs & alternatives
  I('egg', 'Eggs', { aliases: ['egg', 'eggs', 'anda', 'tojas'], allergens: ['egg'], animal: true, loc: 'Fridge' });
  I('milk', 'Milk', { aliases: ['whole milk', 'cow milk', 'doodh', 'tej'], allergens: ['milk'], animal: true, loc: 'Fridge', subs: [{ to: 'plant-milk', note: 'Unsweetened oat or soy drink works in most recipes. Soy drink contains soy; oat drink needs a gluten-free label if you avoid gluten.' }] });
  I('butter', 'Butter', { aliases: ['unsalted butter', 'salted butter', 'vaj', 'makhan'], allergens: ['milk'], animal: true, loc: 'Fridge', subs: [{ to: 'oil', note: 'Use a neutral oil; the flavour is lighter.' }, { to: 'olive-oil', note: 'Good in savoury dishes.' }] });
  I('ghee', 'Ghee', { aliases: ['desi ghee', 'clarified butter'], allergens: ['milk'], animal: true, packaged: true, subs: [{ to: 'oil', note: 'Use the same amount of neutral oil. Less nutty, still delicious.' }] });
  I('yogurt', 'Plain yogurt', { aliases: ['yogurt', 'yoghurt', 'dahi', 'curd', 'joghurt', 'natural yogurt'], allergens: ['milk'], animal: true, loc: 'Fridge', subs: [{ to: 'plant-yogurt', note: 'Unsweetened plain plant yogurt. Many are soy- or coconut-based: check the label.' }, { to: 'lemon', note: 'In curries, a squeeze of lemon adds the tang without the creaminess.' }] });
  I('sour-cream', 'Sour cream (tejföl)', { aliases: ['sour cream', 'tejfol', 'smetana'], allergens: ['milk'], animal: true, loc: 'Fridge', hard: ['south-asia', 'east-asia', 'mena', 'se-asia'], hardNote: 'Thick plain yogurt with a little lemon is a close match.', subs: [{ to: 'yogurt', note: 'Thick plain yogurt; stir in off the heat so it does not split. Still dairy.' }, { to: 'plant-yogurt', note: 'Dairy-free option. Check the label for soy.' }] });
  I('cheddar', 'Cheddar cheese', { aliases: ['cheese', 'cheddar', 'grated cheese', 'monterey jack', 'mozzarella'], allergens: ['milk'], animal: true, loc: 'Fridge', packaged: true, halal: 'check', halalNote: 'Some cheeses use animal rennet; look for vegetarian or halal-certified cheese.', vegNote: 'Some cheeses use animal rennet; look for a vegetarian label.', subs: [{ to: 'dairy-free-cheese', note: 'Melts differently. Check the label: some contain soy or nuts.' }] });
  I('feta', 'Feta cheese', { aliases: ['feta', 'white cheese', 'brined cheese'], allergens: ['milk'], animal: true, loc: 'Fridge', packaged: true, halal: 'check', halalNote: 'Check the rennet source on the label.', hard: ['south-asia', 'east-asia', 'se-asia'], hardNote: 'Any brined white cheese is a good stand-in.', subs: [{ to: null, note: 'Leave it out and add extra olives and a pinch more salt.' }, { to: 'dairy-free-cheese', note: 'A dairy-free feta-style block. Check the label for nuts or soy.' }] });
  I('parmesan', 'Parmesan', { aliases: ['parmesan', 'parmigiano', 'grana padano', 'hard cheese'], allergens: ['milk'], animal: true, loc: 'Fridge', packaged: true, halal: 'check', halalNote: 'Traditional Parmigiano uses animal rennet.', vegNote: 'Traditional Parmesan uses animal rennet. Look for a vegetarian hard cheese.', hard: ['south-asia'], hardNote: 'Any aged hard cheese works.', subs: [{ to: 'nutritional-yeast', note: 'Gives a savoury, cheesy note without dairy.' }] });
  I('plant-milk', 'Unsweetened plant milk', { aliases: ['oat milk', 'soy milk', 'soya milk', 'almond milk', 'plant milk'], may: ['soy', 'gluten', 'treenut'], gfLabel: true, packaged: true, loc: 'Fridge', note: 'Depends on the base: oat (gluten label), soy (soy) or nut (tree nuts).' });
  I('plant-yogurt', 'Plain plant-based yogurt', { aliases: ['plant yogurt', 'coconut yogurt', 'soy yogurt', 'dairy free yogurt'], may: ['soy', 'treenut'], packaged: true, loc: 'Fridge' });
  I('dairy-free-cheese', 'Dairy-free cheese', { aliases: ['vegan cheese', 'dairy free cheese'], may: ['soy', 'treenut'], packaged: true, loc: 'Fridge' });
  I('nutritional-yeast', 'Nutritional yeast', { aliases: ['nooch'], packaged: true, gfLabel: true });

  // Meat & fish
  I('chicken', 'Chicken (bone-in pieces)', { aliases: ['chicken', 'chicken pieces', 'chicken thighs', 'chicken legs', 'murgh', 'csirke'], meat: true, animal: true, halal: 'cert', halalNote: 'Use halal-certified chicken.', loc: 'Fridge' });
  I('dashi', 'Dashi stock (bonito)', { aliases: ['dashi', 'bonito stock', 'hondashi', 'dashi powder'], allergens: ['fish'], fish: true, animal: true, packaged: true, may: ['gluten', 'soy'], gfLabel: true, hard: ['south-asia', 'africa', 'latam', 'mena', 'europe'], hardNote: 'Instant dashi granules are sold in Asian grocers.', subs: [{ to: 'kombu-dashi', note: 'Kelp-only dashi is fish-free and vegetarian.' }, { to: 'vegetable-stock', note: 'Different flavour but works in a pinch.' }] });
  I('fish-sauce', 'Fish sauce', { aliases: ['nam pla', 'nuoc mam'], allergens: ['fish'], may: ['crustacean'], fish: true, animal: true, packaged: true, hard: ['south-asia', 'africa', 'mena'], hardNote: 'Found in Asian grocers.', subs: [{ to: 'soy-sauce', note: 'Use a little less. Contains soy and usually wheat.' }, { to: 'salt', note: 'A pinch of salt plus extra lime keeps it simple and allergen-light.' }] });

  // Grains, breads & pasta
  I('basmati-rice', 'Basmati rice', { aliases: ['basmati', 'chawal', 'sela rice'], packaged: true });
  I('rice', 'Long-grain rice', { aliases: ['rice', 'white rice', 'long grain rice', 'jasmine rice', 'parboiled rice', 'cooked rice', 'leftover rice', 'rizs'], packaged: true });
  I('poha', 'Poha (flattened rice)', { aliases: ['flattened rice', 'beaten rice', 'chivda', 'aval'], packaged: true, gfLabel: true, hard: ['europe', 'north-america', 'latam', 'east-asia', 'africa', 'oceania', 'mena'], hardNote: SOUTH_ASIAN_GROCER });
  I('oats', 'Rolled oats', { aliases: ['oats', 'porridge oats', 'oatmeal', 'zabpehely'], may: ['gluten'], gfLabel: true, packaged: true, note: 'Oats are often contaminated with wheat. Use oats labelled gluten-free; some people with coeliac disease also react to oats.' });
  I('flour', 'Wheat flour', { aliases: ['plain flour', 'all purpose flour', 'all-purpose flour', 'atta', 'maida', 'liszt', 'wheat flour'], allergens: ['gluten'], packaged: true, subs: [{ to: 'cornstarch', note: 'For thickening only: use half the amount, mixed with cold water first. Needs a gluten-free label.' }] });
  I('cornstarch', 'Cornstarch (cornflour)', { aliases: ['cornflour', 'corn starch', 'maize starch'], gfLabel: true, packaged: true });
  I('baking-powder', 'Baking powder', { aliases: [], may: ['gluten'], gfLabel: true, packaged: true });
  I('white-bread', 'Bread (sliced)', { aliases: ['bread', 'sliced bread', 'white bread', 'toast bread', 'kenyer', 'sourdough', 'loaf'], allergens: ['gluten'], may: ['milk', 'egg', 'soy', 'sesame'], packaged: true, subs: [{ to: 'gf-bread', note: 'Certified gluten-free bread. It browns faster, so use a slightly lower heat.' }] });
  I('gf-bread', 'Certified gluten-free bread', { aliases: ['gluten free bread', 'gf bread'], may: ['egg', 'milk', 'soy'], gfLabel: true, packaged: true });
  I('spaghetti', 'Spaghetti', { aliases: ['pasta', 'dried pasta', 'linguine'], allergens: ['gluten'], may: ['egg'], packaged: true, subs: [{ to: 'gf-pasta', note: 'Certified gluten-free spaghetti. Cook in a clean pot with fresh water.' }] });
  I('gf-pasta', 'Certified gluten-free pasta', { aliases: ['gluten free pasta', 'gf pasta', 'rice pasta'], gfLabel: true, packaged: true });
  I('flour-tortillas', 'Flour tortillas', { aliases: ['tortillas', 'tortilla', 'wraps', 'wheat tortillas'], allergens: ['gluten'], may: ['milk', 'soy'], packaged: true, hard: ['south-asia', 'africa'], hardNote: 'Chapati or roti work just as well.', subs: [{ to: 'corn-tortillas', note: 'Smaller and more fragile; warm them first. Choose ones labelled gluten-free.' }] });
  I('corn-tortillas', 'Corn tortillas', { aliases: ['corn tortilla', 'maize tortillas'], gfLabel: true, packaged: true });
  I('frozen-paratha', 'Frozen paratha', { aliases: ['paratha', 'parathas', 'frozen parathas', 'lachha paratha', 'frozen flatbread'], allergens: ['gluten'], may: ['milk', 'soy'], packaged: true, loc: 'Freezer', hard: ['latam', 'east-asia', 'africa'], hardNote: SOUTH_ASIAN_GROCER, subs: [{ to: 'flour-tortillas', note: 'Not flaky, but works for a quick egg wrap. Still contains wheat.' }] });

  // Pulses, nuts & seeds
  I('chana-dal', 'Chana dal (split chickpeas)', { aliases: ['chana daal', 'split bengal gram', 'chana dal'], packaged: true, hard: ['latam', 'east-asia', 'africa', 'europe', 'oceania'], hardNote: SOUTH_ASIAN_GROCER, subs: [{ to: 'yellow-split-peas', note: 'Very similar texture. Soak 2 hours and cook a little longer.' }] });
  I('toor-dal', 'Toor dal (split pigeon peas)', { aliases: ['arhar dal', 'tuvar dal', 'toor daal'], packaged: true, hard: ['latam', 'east-asia', 'africa', 'europe', 'oceania', 'north-america'], hardNote: SOUTH_ASIAN_GROCER, subs: [{ to: 'red-lentils', note: 'Cooks faster (about 20 minutes) and turns creamier.' }, { to: 'yellow-split-peas', note: 'Closest texture; soak first.' }] });
  I('yellow-split-peas', 'Yellow split peas', { aliases: ['split peas'], packaged: true });
  I('red-lentils', 'Red lentils', { aliases: ['masoor dal', 'red lentil', 'split red lentils', 'voros lencse', 'kirmizi mercimek'], packaged: true });
  I('chickpeas', 'Canned chickpeas', { aliases: ['chickpeas', 'garbanzo beans', 'chole', 'kabuli chana', 'cooked chickpeas'], packaged: true });
  I('white-beans', 'Canned white beans', { aliases: ['white beans', 'cannellini', 'haricot beans', 'navy beans', 'feher bab', 'bab'], packaged: true });
  I('black-beans', 'Canned black beans', { aliases: ['black beans', 'frijoles negros', 'turtle beans'], packaged: true, hard: ['south-asia', 'east-asia', 'mena'], hardNote: 'Kidney beans (rajma) are a good, easy-to-find stand-in.', subs: [{ to: 'kidney-beans', note: 'Same quantity; slightly firmer.' }] });
  I('kidney-beans', 'Canned kidney beans', { aliases: ['kidney beans', 'rajma', 'red beans'], packaged: true });
  I('baked-beans', 'Baked beans in tomato sauce', { aliases: ['baked beans', 'heinz beans'], may: ['gluten'], gfLabel: true, packaged: true, hard: ['east-asia', 'latam', 'south-asia'], hardNote: 'Simmer canned white beans in passata with a pinch of sugar and salt.', subs: [{ to: 'white-beans', note: 'Warm with a spoon of tomato paste, a splash of water and a pinch of sugar.' }] });
  I('peanuts', 'Roasted peanuts', { aliases: ['peanut', 'peanuts', 'groundnuts', 'moongphali'], allergens: ['peanut'], packaged: true, subs: [{ to: 'sunflower-seeds', note: 'Adds the same crunch. Check the label for “may contain nuts”.' }, { to: null, note: 'Simply leave them out.' }] });
  I('hazelnuts', 'Hazelnuts', { aliases: ['hazelnut', 'mogyoro'], allergens: ['treenut'], packaged: true, subs: [{ to: 'pumpkin-seeds', note: 'Toasted pumpkin seeds give a similar crunch.' }, { to: null, note: 'Leave them out.' }] });
  I('sunflower-seeds', 'Sunflower seeds', { aliases: ['sunflower seed'], packaged: true, may: ['peanut', 'treenut'] });
  I('pumpkin-seeds', 'Pumpkin seeds', { aliases: ['pepitas'], packaged: true, may: ['peanut', 'treenut'] });
  I('tahini', 'Tahini', { aliases: ['tahina', 'sesame paste'], allergens: ['sesame'], packaged: true, hard: ['south-asia', 'east-asia', 'latam'], hardNote: 'Middle Eastern grocers and larger supermarkets usually stock it.', subs: [{ to: 'sunflower-seed-butter', note: 'Sesame-free. Slightly sweeter; add extra lemon.' }] });
  I('sunflower-seed-butter', 'Sunflower seed butter', { aliases: ['sunflower butter'], packaged: true, may: ['peanut', 'treenut'] });
  I('tofu', 'Silken or soft tofu', { aliases: ['tofu', 'bean curd'], allergens: ['soy'], packaged: true, loc: 'Fridge', hard: ['south-asia', 'africa'], hardNote: 'Usually in the chilled section of larger supermarkets or Asian grocers.', subs: [{ to: null, note: 'Leave it out; the soup is still lovely.' }] });

  // Oils, sauces & condiments
  I('oil', 'Vegetable oil', { aliases: ['oil', 'cooking oil', 'sunflower oil', 'canola oil', 'rapeseed oil', 'neutral oil', 'olaj', 'napraforgo olaj'] });
  I('olive-oil', 'Olive oil', { aliases: ['extra virgin olive oil', 'olivaolaj'] });
  I('sesame-oil', 'Toasted sesame oil', { aliases: ['sesame oil'], allergens: ['sesame'], packaged: true, subs: [{ to: 'oil', note: 'Use neutral oil; you lose the toasty note.' }] });
  I('vinegar', 'White vinegar', { aliases: ['vinegar', 'ecet', 'spirit vinegar'], may: ['sulphite'], packaged: true });
  I('soy-sauce', 'Soy sauce', { aliases: ['soya sauce', 'shoyu', 'light soy sauce'], allergens: ['soy', 'gluten'], packaged: true, subs: [{ to: 'tamari', note: 'Tamari labelled gluten-free. Still contains soy.' }, { to: 'salt', note: 'A pinch of salt for a soy-free, wheat-free version.' }] });
  I('tamari', 'Gluten-free tamari', { aliases: ['tamari'], allergens: ['soy'], gfLabel: true, packaged: true });
  I('gochujang', 'Gochujang (Korean chili paste)', { aliases: ['korean chili paste', 'korean chilli paste'], allergens: ['soy'], may: ['gluten'], gfLabel: true, packaged: true, hard: ['south-asia', 'africa', 'latam', 'mena'], hardNote: 'Asian grocers or online.', subs: [{ to: 'red-chili-flakes', note: 'A pinch of chili flakes plus a little tomato paste and sugar.' }] });
  I('kimchi', 'Kimchi', { aliases: ['cabbage kimchi'], may: ['fish', 'crustacean'], fish: true, animal: true, packaged: true, loc: 'Fridge', vegNote: 'Most kimchi contains fish sauce or salted shrimp.', hard: ['south-asia', 'africa', 'latam', 'mena'], hardNote: 'Asian grocers; vegan kimchi is increasingly common.', subs: [{ to: 'vegan-kimchi', note: 'Labelled vegan kimchi has no fish or shrimp. Check the label.' }] });
  I('vegan-kimchi', 'Vegan kimchi', { aliases: ['vegan kimchi'], packaged: true, loc: 'Fridge' });
  I('miso', 'White miso paste', { aliases: ['miso', 'shiro miso', 'miso paste'], allergens: ['soy'], may: ['gluten'], gfLabel: true, packaged: true, loc: 'Fridge', hard: ['south-asia', 'africa', 'latam', 'mena'], hardNote: 'Asian grocers or online. Rice-only miso is usually gluten-free; barley miso is not.' });
  I('kombu-dashi', 'Kombu dashi (kelp stock)', { aliases: ['kombu dashi', 'kelp stock', 'vegan dashi'], packaged: true });
  I('wakame', 'Dried wakame seaweed', { aliases: ['wakame', 'seaweed'], packaged: true, hard: ['south-asia', 'africa', 'latam', 'mena'], hardNote: 'Asian grocers.', subs: [{ to: 'spring-onion', note: 'Leave out the seaweed and add more spring onion.' }] });
  I('harissa', 'Harissa paste', { aliases: ['harissa'], packaged: true, may: ['gluten'], gfLabel: true });
  I('salsa', 'Tomato salsa', { aliases: ['salsa', 'pico de gallo'], packaged: true, loc: 'Fridge' });
  I('honey', 'Honey', { aliases: ['mez', 'shahad'], animal: true, subs: [{ to: 'sugar', note: 'Or maple syrup.' }] });
  I('sugar', 'Sugar', { aliases: ['white sugar', 'cukor', 'cheeni'] });
  I('vegetable-stock', 'Vegetable stock cube', { aliases: ['stock cube', 'bouillon', 'vegetable stock', 'stock', 'broth', 'maggi cube'], may: ['gluten', 'celery', 'milk', 'soy'], gfLabel: true, packaged: true, note: 'Stock cubes frequently contain wheat, celery or milk.' });
  I('kombu', 'Kombu', { aliases: [], packaged: true });

  // Spices & seasonings
  I('salt', 'Salt', { aliases: ['table salt', 'sea salt', 'namak', 'so'] });
  I('black-pepper', 'Black pepper', { aliases: ['ground black pepper', 'black peppercorns', 'kali mirch', 'bors'] });
  I('turmeric', 'Ground turmeric', { aliases: ['turmeric', 'haldi'] });
  I('red-chili-powder', 'Red chili powder', { aliases: ['chili powder', 'chilli powder', 'lal mirch', 'kashmiri chili powder', 'cayenne'], packaged: true });
  I('red-chili-flakes', 'Red chili flakes', { aliases: ['chili flakes', 'chilli flakes', 'pul biber', 'crushed red pepper', 'kutti mirch'], packaged: true });
  I('dried-red-chili', 'Dried whole red chili', { aliases: ['dried red chili', 'dried chillies', 'sabut lal mirch'] });
  I('cumin-seeds', 'Cumin seeds', { aliases: ['cumin seed', 'zeera', 'jeera', 'whole cumin'] });
  I('cumin-ground', 'Ground cumin', { aliases: ['ground cumin', 'cumin powder', 'zeera powder', 'kimyon'] });
  I('coriander-seeds', 'Coriander seeds', { aliases: ['coriander seed', 'sabut dhania', 'whole coriander'] });
  I('coriander-powder', 'Ground coriander', { aliases: ['coriander powder', 'dhania powder'] });
  I('mustard-seeds', 'Mustard seeds', { aliases: ['rai', 'black mustard seeds', 'mustard seed'], allergens: ['mustard'], subs: [{ to: 'cumin-seeds', note: 'Use cumin seeds alone for the tempering.' }] });
  I('garam-masala', 'Garam masala', { aliases: [], packaged: true, may: ['gluten'], gfLabel: true, hard: ['latam', 'east-asia'], hardNote: 'Mix equal parts ground cumin, coriander and black pepper with a pinch of cinnamon and cloves.' });
  I('chaat-masala', 'Chaat masala', { aliases: [], packaged: true, may: ['gluten'], gfLabel: true, hard: ['europe', 'north-america', 'latam', 'east-asia', 'africa', 'oceania', 'mena'], hardNote: SOUTH_ASIAN_GROCER, subs: [{ to: 'cumin-ground', note: 'Toasted ground cumin, a pinch of salt and extra lemon gives a similar tang.' }] });
  I('asafoetida', 'Asafoetida (hing)', { aliases: ['hing'], allergens: ['gluten'], packaged: true, hard: ['europe', 'north-america', 'latam', 'east-asia', 'africa', 'oceania', 'mena'], hardNote: SOUTH_ASIAN_GROCER, note: 'Most powdered asafoetida is blended with wheat flour. Gluten-free (rice-flour based) versions exist.', subs: [{ to: null, note: 'Leave it out, or add one extra garlic clove.' }] });
  I('bay-leaf', 'Bay leaves', { aliases: ['bay leaf', 'tej patta', 'babérlevél'] });
  I('cinnamon', 'Cinnamon', { aliases: ['cinnamon stick', 'ground cinnamon', 'dalchini', 'fahej'] });
  I('cloves', 'Whole cloves', { aliases: ['clove', 'cloves', 'laung'] });
  I('green-cardamom', 'Green cardamom pods', { aliases: ['cardamom', 'elaichi', 'cardamom pods'] });
  I('saffron', 'Saffron', { aliases: ['zafran', 'kesar'], packaged: true });
  I('sweet-paprika', 'Sweet paprika (Hungarian)', { aliases: ['paprika', 'sweet paprika', 'pirospaprika', 'edesnemes paprika', 'hungarian paprika'], packaged: true });
  I('caraway', 'Caraway seeds', { aliases: ['caraway', 'komeny', 'kömény'] });
  I('dried-oregano', 'Dried oregano', { aliases: ['oregano', 'rigani'] });
  I('dried-thyme', 'Dried thyme', { aliases: ['thyme'] });
  I('curry-powder', 'Curry powder', { aliases: [], packaged: true, may: ['gluten', 'mustard', 'celery'], gfLabel: true });
  I('berbere', 'Berbere spice blend', { aliases: [], packaged: true, may: ['gluten'], gfLabel: true, hard: ['south-asia', 'europe', 'east-asia', 'latam', 'mena', 'se-asia', 'oceania'], hardNote: 'Make a quick version: 2 tsp paprika, 1 tsp chili powder, ½ tsp each ground ginger, coriander and fenugreek, pinch of cardamom and cloves.', subs: [{ to: 'sweet-paprika', note: 'Use paprika plus chili powder and a pinch of cardamom. Different, but warm and good.' }] });
  I('ground-flaxseed', 'Ground flaxseed', { aliases: ['flaxseed', 'linseed', 'flax'], packaged: true, may: ['gluten'], gfLabel: true });
  I('water', 'Water', { aliases: [], skip: true });

  Cooksy.INGREDIENTS = list;
  const byId = new Map(list.map((x) => [x.id, x]));
  Cooksy.ingredientById = (id) => byId.get(id) || null;
})();
