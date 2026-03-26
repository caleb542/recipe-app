import { getMongoClient } from './utils/mongoClient.js';

const CATEGORY_META = [
  // Course
  { slug: 'breakfast-and-brunch', description: 'Start your day deliciously', sectionTitle: 'Morning & Starters', image: null },
  { slug: 'appetizers-and-starters', description: 'Perfect beginnings', sectionTitle: 'Morning & Starters', image: null },
  { slug: 'finger-foods-and-party-snacks', description: 'Bite-sized delights', sectionTitle: 'Morning & Starters', image: null },
  { slug: 'main-dishes', description: 'Hearty centerpieces', sectionTitle: 'Main Courses', image: null },
  { slug: 'side-dishes', description: 'Perfect pairings', sectionTitle: 'Main Courses', image: null },
  { slug: 'soups-and-salads', description: 'Fresh & comforting', sectionTitle: 'Main Courses', image: null },
  { slug: 'desserts-and-sweets', description: 'Indulgent treats', sectionTitle: 'Sweet Endings', image: null },
  // Drinks
  { slug: 'cocktails', description: 'Craft cocktails & mixed drinks', sectionTitle: 'Beverages', image: null },
  { slug: 'mocktails-and-non-alcoholic', description: 'Alcohol-free refreshments', sectionTitle: 'Beverages', image: null },
  { slug: 'hot-beverages', description: 'Warming drinks', sectionTitle: 'Beverages', image: null },
  // Cuisine
  { slug: 'italian', description: 'Pasta, pizza & more', sectionTitle: 'World Flavors', image: null },
  { slug: 'mexican', description: 'Bold & vibrant flavors', sectionTitle: 'World Flavors', image: null },
  { slug: 'asian', description: 'Eastern culinary traditions', sectionTitle: 'World Flavors', image: null },
  { slug: 'mediterranean', description: 'Fresh & healthy', sectionTitle: 'World Flavors', image: null },
  { slug: 'american', description: 'Classic comfort food', sectionTitle: 'World Flavors', image: null },
  { slug: 'french', description: 'Refined & elegant', sectionTitle: 'World Flavors', image: null },
  { slug: 'irish', description: 'Hearty & soulful', sectionTitle: 'World Flavors', image: null },
  // Dietary
  { slug: 'vegetarian', description: 'Meat-free meals', sectionTitle: 'Special Diets', image: null },
  { slug: 'vegan', description: 'Plant-based recipes', sectionTitle: 'Special Diets', image: null },
  { slug: 'gluten-free', description: 'No gluten ingredients', sectionTitle: 'Special Diets', image: null },
  { slug: 'dairy-free', description: 'No dairy products', sectionTitle: 'Special Diets', image: null },
  { slug: 'nut-free', description: 'Safe for allergies', sectionTitle: 'Special Diets', image: null },
  { slug: 'keto', description: 'Low-carb, high-fat', sectionTitle: 'Special Diets', image: null },
  // Occasions
  { slug: 'quick-and-easy', description: 'Ready in 30 minutes or less', sectionTitle: 'Special Events', image: null },
  { slug: 'party-and-entertaining', description: 'Crowd-pleasing recipes', sectionTitle: 'Special Events', image: null },
  { slug: 'holiday-and-special-occasions', description: 'Festive celebrations', sectionTitle: 'Special Events', image: null },
];

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const client = await getMongoClient();

  try {
    const db = client.db('recipe-me-db');
    const collection = db.collection('categories');

    const results = { updated: [], notFound: [] };

    for (const meta of CATEGORY_META) {
      const result = await collection.updateOne(
        { slug: meta.slug },
        { 
          $set: { 
            description: meta.description,
            sectionTitle: meta.sectionTitle,
            image: meta.image
          } 
        }
      );

      if (result.matchedCount > 0) {
        results.updated.push(meta.slug);
      } else {
        results.notFound.push(meta.slug);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Update complete',
        updated: results.updated.length,
        notFound: results.notFound.length,
        details: results
      })
    };

  } catch (error) {
    console.error('Update error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};