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

export function getCategoryName(slug) {
  return categories[slug] || slug;
}