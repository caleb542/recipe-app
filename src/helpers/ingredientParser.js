/**
 * ingredientParser.js
 * Regex-based ingredient and recipe text parser
 * No AI — deterministic, offline, translatable
 */

// ----------------------------------------
// UUID helper
// ----------------------------------------
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

// ----------------------------------------
// UNIT LOOKUP TABLE
// Case-sensitive single letters handled first
// ----------------------------------------
export const UNITS = {
  // Single letter — case sensitive
  'T': 'tbsp',
  't': 'tsp',
  'L': 'l',
  'g': 'g',
  'G': 'g',

  // Tablespoon variants
  'tbsp': 'tbsp', 'Tbsp': 'tbsp', 'TBSP': 'tbsp',
  'tbs': 'tbsp', 'Tbs': 'tbsp',
  'tblsp': 'tbsp', 'Tblsp': 'tbsp',
  'tablespoon': 'tbsp', 'Tablespoon': 'tbsp',
  'tablespoons': 'tbsp', 'Tablespoons': 'tbsp',

  // Teaspoon variants
  'tsp': 'tsp', 'Tsp': 'tsp', 'TSP': 'tsp',
  'ts': 'tsp',
  'teaspoon': 'tsp', 'Teaspoon': 'tsp',
  'teaspoons': 'tsp', 'Teaspoons': 'tsp',

  // Cup variants
  'cup': 'cup', 'Cup': 'cup', 'cups': 'cup', 'Cups': 'cup',
  'c': 'cup', 'C': 'cup',

  // Volume metric
  'ml': 'ml', 'mL': 'ml', 'ML': 'ml',
  'milliliter': 'ml', 'millilitre': 'ml',
  'milliliters': 'ml', 'millilitres': 'ml',
  'l': 'l', 'liter': 'l', 'litre': 'l',
  'liters': 'l', 'litres': 'l',

  // Volume imperial
  'fl oz': 'fl oz', 'fluid oz': 'fl oz',
  'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz',
  'pint': 'pint', 'pints': 'pint', 'pt': 'pint',
  'quart': 'quart', 'quarts': 'quart', 'qt': 'quart',
  'gallon': 'gallon', 'gallons': 'gallon', 'gal': 'gallon',

  // Weight metric
  'gram': 'g', 'grams': 'g', 'Gram': 'g', 'Grams': 'g',
  'gr': 'g',
  'kg': 'kg', 'Kg': 'kg', 'KG': 'kg',
  'kilogram': 'kg', 'kilograms': 'kg',
  'kilo': 'kg', 'kilos': 'kg',

  // Weight imperial
  'oz': 'oz', 'Oz': 'oz', 'OZ': 'oz',
  'ounce': 'oz', 'ounces': 'oz',
  'lb': 'lb', 'Lb': 'lb', 'LB': 'lb',
  'lbs': 'lb', 'Lbs': 'lb',
  'pound': 'lb', 'pounds': 'lb',
  '#': 'lb',
};

// ----------------------------------------
// MEASURE WORDS — not convertible units
// ----------------------------------------
export const MEASURE_WORDS = [
  'clove', 'cloves',
  'bunch', 'bunches',
  'pinch', 'pinches',
  'sprig', 'sprigs',
  'slice', 'slices',
  'piece', 'pieces',
  'can', 'cans',
  'package', 'packages', 'pkg',
  'box', 'boxes',
  'head', 'heads',
  'stalk', 'stalks',
  'fillet', 'fillets',
  'handful', 'handfuls',
  'dash', 'dashes',
  'drop', 'drops',
  'knob', 'knobs',
  'dollop', 'dollops',
  'bushel', 'bushels',
  'spoonful', 'spoonfuls',
  'strip', 'strips',
  'sheet', 'sheets',
  'rack', 'racks',
  'loaf', 'loaves',
];

// ----------------------------------------
// FOOD ADJECTIVES — stripped from name into description
// ----------------------------------------
const FOOD_ADJECTIVES = [
  'large', 'medium', 'small', 'extra-large', 'extra large',
  'big', 'tiny', 'whole', 'half',
  'ripe', 'unripe', 'overripe',
  'fresh', 'dried', 'dry', 'frozen', 'canned', 'tinned',
  'raw', 'cooked', 'roasted', 'toasted', 'smoked',
  'boneless', 'skinless', 'lean', 'trimmed',
  'chopped', 'diced', 'sliced', 'minced', 'grated',
  'shredded', 'crushed', 'peeled', 'seeded', 'pitted',
  'unsalted', 'salted', 'sweetened', 'unsweetened',
  'softened', 'melted', 'chilled', 'cold', 'warm', 'hot',
  'room temperature', 'packed', 'heaping', 'level',
  'thick', 'thin', 'fine', 'coarse',
  'rinsed', 'drained', 'patted dry',
];

// ----------------------------------------
// CANADIAN CUP → mL LOOKUP
// Standardized values, not mathematical
// ----------------------------------------
export const CUP_TO_ML = {
  '1/8':  30,
  '0.125': 30,
  '1/4':  60,
  '0.25': 60,
  '1/3':  75,
  '0.333': 75,
  '1/2':  125,
  '0.5':  125,
  '2/3':  150,
  '0.667': 150,
  '3/4':  175,
  '0.75': 175,
  '1':    250,
  '1.0':  250,
  '1.5':  375,
  '2':    500,
  '2.0':  500,
  '3':    750,
  '4':    1000,
};

// ----------------------------------------
// TSP → mL LOOKUP
// ----------------------------------------
export const TSP_TO_ML = {
  '1/4':  1,
  '0.25': 1,
  '1/2':  2,
  '0.5':  2,
  '1':    5,
  '1.0':  5,
  '2':    10,
  '3':    15,
};

// ----------------------------------------
// CONVERSION TABLE
// ----------------------------------------
export const CONVERSIONS = {
  tbsp: { factor: 15,     unit: 'mL', lookup: null },
  tsp:  { factor: 5,      unit: 'mL', lookup: TSP_TO_ML },
  cup:  { factor: 250,    unit: 'mL', lookup: CUP_TO_ML },
  oz:   { factor: 28.35,  unit: 'g',  lookup: null },
  lb:   { factor: 453.6,  unit: 'g',  lookup: null },
  pint: { factor: 500,    unit: 'mL', lookup: null },
  quart:{ factor: 1000,   unit: 'mL', lookup: null },
};

// ----------------------------------------
// FRACTION PARSER
// Handles: "1/2", "1 1/2", "2¾", unicode fractions
// ----------------------------------------
export function parseAmount(str) {
  if (!str) return '';
  str = str.trim();

  const unicodeFractions = {
    '½': '1/2', '⅓': '1/3', '⅔': '2/3',
    '¼': '1/4', '¾': '3/4', '⅛': '1/8',
    '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
  };
  for (const [char, frac] of Object.entries(unicodeFractions)) {
    str = str.replace(char, ` ${frac}`);
  }

  // Normalize internal whitespace
  str = str.replace(/\s+/g, ' ').trim();

  // Mixed number: "1 1/2"
  const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return parseFloat(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  }

  // Fraction: "1/2"
  const fraction = str.match(/^(\d+)\/(\d+)$/);
  if (fraction) return parseInt(fraction[1]) / parseInt(fraction[2]);

  const num = parseFloat(str);
  return isNaN(num) ? str : num;
}

// ----------------------------------------
// FORMAT AMOUNT for display
// Returns canonical string representation
// ----------------------------------------
export function formatAmount(amount) {
  if (!amount && amount !== 0) return '';
  const num = parseFloat(amount);
  if (isNaN(num)) return String(amount);

  const fractions = {
    0.125: '⅛', 0.25: '¼', 0.333: '⅓',
    0.375: '⅜', 0.5: '½', 0.625: '⅝',
    0.667: '⅔', 0.75: '¾', 0.875: '⅞',
  };

  const whole = Math.floor(num);
  const decimal = parseFloat((num - whole).toFixed(3));

  if (fractions[decimal]) {
    return whole > 0 ? `${whole} ${fractions[decimal]}` : fractions[decimal];
  }

  return String(num % 1 === 0 ? num : num.toFixed(2).replace(/\.?0+$/, ''));
}

// ----------------------------------------
// CONVERT AMOUNT to metric
// Uses lookup tables for Canadian standard values
// ----------------------------------------
export function convertToMetric(amount, unit) {
  const conversion = CONVERSIONS[unit];
  if (!conversion) return null;

  const num = parseFloat(amount);
  if (isNaN(num)) return null;

  if (conversion.lookup) {
    const key = String(amount);
    const fracKey = formatFractionKey(num);
    const metricVal = conversion.lookup[key] || conversion.lookup[fracKey];
    if (metricVal) {
      return { amount: metricVal, unit: conversion.unit };
    }
  }

  const raw = num * conversion.factor;
  const rounded = conversion.unit === 'mL'
    ? Math.round(raw / 5) * 5
    : Math.round(raw);

  return { amount: rounded, unit: conversion.unit };
}

function formatFractionKey(num) {
  const fractionMap = {
    0.125: '1/8', 0.25: '1/4', 0.333: '1/3',
    0.5: '1/2', 0.667: '2/3', 0.75: '3/4',
  };
  const whole = Math.floor(num);
  const decimal = parseFloat((num - whole).toFixed(3));
  const frac = fractionMap[decimal];

  if (!frac && whole === 0) return String(num);
  if (!frac) return String(num);
  if (whole === 0) return frac;
  return `${whole} ${frac}`;
}

// ----------------------------------------
// STRIP LEADING NOISE
// Removes bullets, numbers, step labels
// ----------------------------------------
export function stripLeadingNoise(line) {
  return line
    .trim()
    .replace(/[\u2018\u2019]/g, "'")  // normalize curly single quotes → straight
    .replace(/[\u201C\u201D]/g, '"')  // normalize curly double quotes → straight
    .replace(/^[-–—•·▪▸►]\s+/, '')
    .replace(/^\(?\[?\d+[\.\)\]:]\)?\s*/, '')
    .replace(/^step\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[:\.\s]\s*/i, '')
    .replace(/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|finally|lastly|then|next)[:\.\s]\s*/i, '')
    .replace(/\s+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip markdown links
.replace(/^\[.*?\](\(.*?\))?\s*/g, '')    // strip leading link remnants
    .trim();
}

// ----------------------------------------
// SECTION HEADER DETECTION
// ----------------------------------------
function isSectionHeader(line) {
  if (!/^[A-Za-z\s\(\)\/&,'\-]{2,50}:$/.test(line)) return false;
  if (hasAmount(line)) return false;
  return true;
}

// ----------------------------------------
// HAS AMOUNT
// ----------------------------------------
function hasAmount(line) {
  const trimmed = line.trim();
  if (/^[\d½⅓⅔¼¾⅛]/.test(trimmed)) return true;
  if (/^(a|an)\s+(pinch|dash|handful|bunch|clove|sprig|knob|dollop)/i.test(trimmed)) return true;
  return false;
}

// ----------------------------------------
// HAS KNOWN UNIT
// ----------------------------------------
function hasKnownUnit(line) {
  if (!hasAmount(line)) return false;
  const allUnits = [...Object.keys(UNITS), ...MEASURE_WORDS];
  for (const unit of allUnits) {
    const escaped = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`);
    if (pattern.test(line)) return true;
  }
  return false;
}

// ----------------------------------------
// PARSE SINGLE INGREDIENT LINE
// ----------------------------------------
export function parseIngredientLine(rawLine) {
  let line = stripLeadingNoise(rawLine);
  if (!line) return null;

  let amount = '';
  let unit = '';
  let measureWord = '';
  let name = '';
  let description = '';

  const commaIdx = line.indexOf(',');
  if (commaIdx > -1) {
    description = line.substring(commaIdx + 1).trim();
    line = line.substring(0, commaIdx).trim();
  }

  const dashIdx = line.indexOf(' - ');
  if (dashIdx > -1 && !description) {
    description = line.substring(dashIdx + 3).trim();
    line = line.substring(0, dashIdx).trim();
  }

  const aAnMatch = line.match(/^(a|an)\s+([a-z]+)\s+(?:of\s+)?(.+)$/i);
  if (aAnMatch) {
    const possibleMeasure = aAnMatch[2].toLowerCase();
    if (MEASURE_WORDS.includes(possibleMeasure)) {
      amount = '1';
      measureWord = possibleMeasure;
      name = aAnMatch[3].trim();
      return buildIngredient(amount, unit, measureWord, name, description);
    }
  }

  const amountMatch = line.match(/^([\d\s\/\.½⅓⅔¼¾⅛⅜⅝⅞]+)/);
  if (amountMatch) {
    amount = String(parseAmount(amountMatch[1].trim()));
    line = line.substring(amountMatch[1].length).trim();
  }

  const tokens = line.split(/\s+/);
  if (tokens.length > 0) {
    const firstToken = tokens[0];
    const firstTokenLower = firstToken.toLowerCase();

    if (UNITS[firstToken] && firstToken.length === 1) {
      unit = UNITS[firstToken];
      tokens.shift();
      line = tokens.join(' ');
    } else if (UNITS[firstTokenLower] || UNITS[firstToken]) {
      unit = UNITS[firstToken] || UNITS[firstTokenLower];
      tokens.shift();
      line = tokens.join(' ');
    } else if (MEASURE_WORDS.includes(firstTokenLower)) {
      measureWord = firstTokenLower;
      tokens.shift();
      if (tokens[0]?.toLowerCase() === 'of') tokens.shift();
      line = tokens.join(' ');
    }
  }

  name = line.trim();
  name = name.replace(/^of\s+/i, '').trim();

  const words = name.split(' ');
  const leadingAdjectives = [];

  while (words.length > 1) {
    const word = words[0].toLowerCase();
    if (FOOD_ADJECTIVES.includes(word)) {
      leadingAdjectives.push(words.shift());
    } else {
      break;
    }
  }

  if (leadingAdjectives.length) {
    name = words.join(' ');
    const adjStr = leadingAdjectives.join(' ');
    description = description ? `${adjStr}, ${description}` : adjStr;
  }

  if (amount && !name) return null;
  if (!amount && !name) return null;

  return buildIngredient(amount, unit, measureWord, name, description);
}

function buildIngredient(amount, unit, measureWord, name, description) {
  if (!name && !amount) return null; 
  return {
    id: generateUUID(),
    amount: amount || '',
    unit: unit || '',
    measureWord: measureWord || '',
    name: name || '',
    description: description || '',
    alternatives: [],
  };
}

// ----------------------------------------
// CLASSIFY LINE
// ----------------------------------------
function classifyLine(line) {
  const clean = stripLeadingNoise(line);

  if (!clean) return { type: 'empty' };

  // Section header
  if (isSectionHeader(clean)) {
    return { type: 'section', label: clean.replace(/:$/, '').trim() };
  }
// Skip obvious UI noise
if (/^\d+\s*(reviews?|photos?|ratings?|comments?)$/i.test(clean)) {
  return { type: 'empty' };
}
if (/^\d+\/?\d*\s*x$/i.test(clean)) {
  return { type: 'empty' };  // scaling buttons
}

if (/^\d+\s*(mins?|minutes?|hours?|hrs?)(\s+\d+\s*(mins?|minutes?))?$/i.test(clean)) {
  return { type: 'meta', text: clean };
}
  // Known section keywords
  if (/^ingredients?:?$/i.test(clean)) {
    return { type: 'section_ingredients' };
  }
  if (/^(directions?|instructions?|method|steps?|preparation|how to (make|prepare)):?$/i.test(clean)) {
    return { type: 'section_directions' };
  }

  // Sections to ignore — editorial, nutrition, author notes
if (/^(from the editor|editor'?s?\s*notes?|nutrition facts?|nutritional info|cook'?s?\s*notes?|author'?s?\s*notes?|note from the (author|chef|editor)|chef'?s?\s*notes?|tips?:|serving suggestions?|rate this recipe|from \d+ votes?|\d+ ratings?)/i.test(clean)) {
  console.log('🚫 Ignoring section:', clean);
  return { type: 'section_ignore' };
}


  // Time/meta lines
  if (/^(prep|cook|total|active)\s*(time)?:?\s*\d+/i.test(clean)) {
    return { type: 'meta', text: clean };
  }

  // Servings/serves/yield
  if (/^(servings?|serves?|yield):?\s*\d+/i.test(clean)) {
    return { type: 'meta', text: clean };
  }

  // Has amount or known unit — likely ingredient
if (hasAmount(clean) || hasKnownUnit(clean)) {
  const data = parseIngredientLine(clean);
  if (!data || !data.name) return { type: 'empty' };  // ← add this
  return { type: 'ingredient', data };
}

  // Numbered direction or step label
  if (/^\d+[\.\)]\s+[A-Z]/.test(line.trim())) {
    return { type: 'direction', text: clean };
  }

  return { type: 'unknown', text: clean };
}

// ----------------------------------------
// EXTRACT META (times, servings)
// ----------------------------------------
function extractMeta(text, recipe) {
  text = text.replace(/(\d+)(mins?|minutes?|hours?|hrs?)/gi, '$1 $2');
  const prepMatch = text.match(/prep\s*(time)?:?\s*(\d+)\s*(mins?|minutes?|hours?|hrs?)/i);
  if (prepMatch) {
    const val = parseInt(prepMatch[2]);
    const u = prepMatch[3].toLowerCase();
    recipe.prepTime = u.startsWith('h') ? `${val} hour${val > 1 ? 's' : ''}` : `${val} minutes`;
  }

  const cookMatch = text.match(/cook\s*(time)?:?\s*(\d+)\s*(mins?|minutes?|hours?|hrs?)/i);
  if (cookMatch) {
    const val = parseInt(cookMatch[2]);
    const u = cookMatch[3].toLowerCase();
    const cookMins = u.startsWith('h') ? val * 60 : val;
    const prepMins = recipe.prepTime ? parseInt(recipe.prepTime) : 0;
    recipe.totalTime = `${prepMins + cookMins} minutes`;
  }

  const totalMatch = text.match(/total\s*(time)?:?\s*(\d+)\s*(mins?|minutes?|hours?|hrs?)/i);
  if (totalMatch) {
    const val = parseInt(totalMatch[2]);
    const u = totalMatch[3].toLowerCase();
    recipe.totalTime = u.startsWith('h') ? `${val} hour${val > 1 ? 's' : ''}` : `${val} minutes`;
  }

  const servingsMatch = text.match(/^servings?:?\s*(\d+)/i);
  if (servingsMatch) {
    recipe.servings = servingsMatch[1];
  }

  const servesMatch = text.match(/^serves?:?\s*(\d+)/i);
  if (servesMatch) {
    recipe.servings = servesMatch[1];
  }

  const yieldMatch = text.match(/^yield:?\s*(\d+)/i);
  if (yieldMatch) {
    recipe.servings = yieldMatch[1];
  }

  const sourceMatch = text.match(/find it online at\s+(https?:\/\/\S+)/i);
  if (sourceMatch) {
    recipe.sourceUrl = sourceMatch[1];
  }
}

// ----------------------------------------
// MAIN RECIPE TEXT PARSER
// ----------------------------------------
export function parseRecipeText(text) {
  const lines = text.split('\n');

  const recipe = {
    name: '',
    description: '',
    prepTime: '',
    totalTime: '',
    servings: '',
    ingredients: [],
    directions: [],
    detectedSections: [],
  };

  let currentGroup = null;
  let mode = 'preamble';
  let ignoreMode = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const classified = classifyLine(line);

    // If in ignore mode skip everything except new real sections
    if (ignoreMode) {
      if (classified.type === 'section_ingredients') {
        ignoreMode = false;
        mode = 'ingredients';
      } else if (classified.type === 'section_directions') {
        ignoreMode = false;
        mode = 'directions';
      }
      continue;
    }

    switch (classified.type) {

      case 'empty':
        break;

      case 'section_ingredients':
        mode = 'ingredients';
        break;

      case 'section_directions':
        mode = 'directions';
        currentGroup = null;
        break;

      case 'section_ignore':
        console.log('🚫 section_ignore triggered for:', line);
        ignoreMode = true;
        break;

      case 'section':
        currentGroup = classified.label;
        if (!recipe.detectedSections.includes(currentGroup)) {
          recipe.detectedSections.push(currentGroup);
        }
        if (/ingredient|sauce|dough|batter|filling|topping|crust|marinade|dry|wet|spice/i.test(currentGroup)) {
          mode = 'ingredients';
        } else if (/direction|instruction|method|step|preparation|assembly/i.test(currentGroup)) {
          mode = 'directions';
        }
        break;

      case 'meta':
        extractMeta(classified.text, recipe);
        break;

      case 'ingredient':
        mode = 'ingredients';
        recipe.ingredients.push({
          ...classified.data,
          group: currentGroup || null,
        });
        break;

      case 'direction':
        mode = 'directions';
        recipe.directions.push({
          id: generateUUID(),
          text: classified.text,
          group: currentGroup || null,
        });
        break;

      case 'unknown': {
        // Check for source URL first
        const urlMatch = classified.text?.match(/find it online at\s+(https?:\/\/\S+)/i) ||
                        classified.text?.match(/^source:?\s+(https?:\/\/\S+)/i);
        if (urlMatch) {
          recipe.sourceUrl = urlMatch[1];
          break;
        }

        if (!recipe.name && line.length > 3 && line.length < 120) {
          recipe.name = line;
          break;
        }

         // Skip rating/review noise
        if (/rate this recipe|from \d+ votes?|\d+ ratings?/i.test(classified.text)) {
          break;
        }

        if (mode === 'directions') {
          recipe.directions.push({
            id: generateUUID(),
            text: classified.text,
            group: currentGroup || null,
          });
        } else if (mode === 'preamble' && recipe.name && !recipe.description) {
          recipe.description = classified.text;
        }
        break;
      }
    }
  }


  if (recipe.name) {
    console.log('name before strip:', recipe.name);
    recipe.name = recipe.name.replace(/\s*[-|–]\s*[^-|–]{3,50}$/, '').trim();
    console.log('name after strip:', recipe.name);
  }

  if (!recipe.name) {
    throw new Error('Could not find recipe name. Make sure the first line is the recipe title.');
  }
  if (!recipe.ingredients.length && !recipe.directions.length) {
    throw new Error('Could not find ingredients or directions. Try formatting with "Ingredients:" and "Directions:" headers.');
  }

  return recipe;
}