export const CATEGORIES = {
  // Course
  'breakfast-and-brunch': 'Breakfast & Brunch',
  'appetizers-and-starters': 'Appetizers & Starters',
  'finger-foods-and-party-snacks': 'Finger Foods & Party Snacks',
  'main-dishes': 'Main Dishes',
  'side-dishes': 'Side Dishes',
  'soups-and-salads': 'Soups & Salads',
  'desserts-and-sweets': 'Desserts & Sweets',

  // Drinks
  'cocktails': 'Cocktails',
  'mocktails-and-non-alcoholic': 'Mocktails & Non-Alcoholic',
  'hot-beverages': 'Hot Beverages',

  // Cuisine
  'italian': 'Italian',
  'mexican': 'Mexican',
  'asian': 'Asian',
  'mediterranean': 'Mediterranean',
  'american': 'American',
  'irish': 'Irish',
  'french': 'French',

  // Dietary
  'vegetarian': 'Vegetarian',
  'vegan': 'Vegan',
  'gluten-free': 'Gluten-Free',
  'dairy-free': 'Dairy-Free',
  'nut-free': 'Nut-Free',
  'keto': 'Keto',

  // Occasions
  'quick-and-easy': 'Quick & Easy',
  'party-and-entertaining': 'Party & Entertaining',
  'holiday-and-special-occasions': 'Holiday & Special Occasions'

};

// Alias — some callers (Breadcrumbs.js, category.js) import this name
// instead of CATEGORIES. Same map, kept as one source of truth rather
// than two separately-maintained objects.
export const CATEGORIES_MAP = CATEGORIES;

export function getCategoryName(slug) {
  // Was referencing an undefined lowercase `categories` — threw at
  // runtime on every call. Fixed to reference the actual exported
  // CATEGORIES constant above.
  return CATEGORIES[slug] || slug;
}

// Plural helper — maps an array of category slugs (or already-resolved
// names) to their display names, for callers rendering multiple
// category badges (e.g. article.js).
export function getCategoryNames(slugs = []) {
  return slugs.map(slug => getCategoryName(slug));
}