import { getMongoClient } from './utils/mongoClient.js';

const CATEGORIES_SEED = [
  // Course
//   { slug: 'breakfast-and-brunch', name: 'Breakfast & Brunch', group: 'Course', order: 0, active: true },
//   { slug: 'appetizers-and-starters', name: 'Appetizers & Starters', group: 'Course', order: 1, active: true },
//   { slug: 'finger-foods-and-party-snacks', name: 'Finger Foods & Party Snacks', group: 'Course', order: 2, active: true },
//   { slug: 'main-dishes', name: 'Main Dishes', group: 'Course', order: 3, active: true },
//   { slug: 'side-dishes', name: 'Side Dishes', group: 'Course', order: 4, active: true },
//   { slug: 'soups-and-salads', name: 'Soups & Salads', group: 'Course', order: 5, active: true },
//   { slug: 'desserts-and-sweets', name: 'Desserts & Sweets', group: 'Course', order: 6, active: true },
//   // Drinks
//   { slug: 'cocktails', name: 'Cocktails', group: 'Drinks', order: 0, active: true },
//   { slug: 'mocktails-and-non-alcoholic', name: 'Mocktails & Non-Alcoholic', group: 'Drinks', order: 1, active: true },
//   { slug: 'hot-beverages', name: 'Hot Beverages', group: 'Drinks', order: 2, active: true },
//   // Cuisine
//   { slug: 'italian', name: 'Italian', group: 'Cuisine', order: 0, active: true },
//   { slug: 'mexican', name: 'Mexican', group: 'Cuisine', order: 1, active: true },
//   { slug: 'asian', name: 'Asian', group: 'Cuisine', order: 2, active: true },
//   { slug: 'mediterranean', name: 'Mediterranean', group: 'Cuisine', order: 3, active: true },
//   { slug: 'american', name: 'American', group: 'Cuisine', order: 4, active: true },
  { slug: 'irish', name: 'Irish', group: 'Cuisine', order: 6, active: true },
//   { slug: 'french', name: 'French', group: 'Cuisine', order: 5, active: true },
//   // Dietary
//   { slug: 'vegetarian', name: 'Vegetarian', group: 'Dietary', order: 0, active: true },
//   { slug: 'vegan', name: 'Vegan', group: 'Dietary', order: 1, active: true },
//   { slug: 'gluten-free', name: 'Gluten-Free', group: 'Dietary', order: 2, active: true },
//   { slug: 'dairy-free', name: 'Dairy-Free', group: 'Dietary', order: 3, active: true },
//   { slug: 'nut-free', name: 'Nut-Free', group: 'Dietary', order: 4, active: true },
//   { slug: 'keto', name: 'Keto', group: 'Dietary', order: 5, active: true },
//   // Occasions
//   { slug: 'quick-and-easy', name: 'Quick & Easy', group: 'Occasions', order: 0, active: true },
//   { slug: 'party-and-entertaining', name: 'Party & Entertaining', group: 'Occasions', order: 1, active: true },
//   { slug: 'holiday-and-special-occasions', name: 'Holiday & Special Occasions', group: 'Occasions', order: 2, active: true },
];

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const client = await getMongoClient();

  try {
    const db = client.db('recipe-me-db');
    const collection = db.collection('categories');

    const results = { inserted: [], skipped: [] };

    for (const category of CATEGORIES_SEED) {
      const existing = await collection.findOne({ slug: category.slug });
      
      if (!existing) {
        await collection.insertOne({
          ...category,
          createdAt: new Date(),
          recipeCount: 0
        });
        results.inserted.push(category.slug);
      } else {
        results.skipped.push(category.slug);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Seed complete',
        inserted: results.inserted.length,
        skipped: results.skipped.length,
        details: results
      })
    };

  } catch (error) {
    console.error('Seed error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};