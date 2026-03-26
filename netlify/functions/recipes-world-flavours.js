import { getMongoClient } from './utils/mongoClient.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const client = await getMongoClient();

  try {
    const db = client.db('recipe-me-db');
    const recipesCollection = db.collection('recipes');
    const categoriesCollection = db.collection('categories');

    // Get all active cuisine categories that have recipes
    const cuisineCategories = await categoriesCollection
      .find({ group: 'Cuisine', active: true })
      .sort({ order: 1 })
      .toArray();

    // Fetch one recipe per cuisine — liked first, random fallback
    const results = await Promise.all(
      cuisineCategories.map(async cat => {
        const query = {
          isPublic: true,
          'ingredients.0': { $exists: true },
          'directions.0': { $exists: true },
          categories: cat.name
        };

        // Try liked first
        const liked = await recipesCollection.findOne(
          { ...query, likes: { $gt: 0 } },
          { sort: { likes: -1 } }
        );

        if (liked) return { recipe: liked, cuisineName: cat.name, slug: cat.slug };

        // Random fallback
        const random = await recipesCollection
          .aggregate([
            { $match: query },
            { $sample: { size: 1 } }
          ])
          .toArray();

        return random.length
          ? { recipe: random[0], cuisineName: cat.name, slug: cat.slug }
          : null;
      })
    );

    const filtered = results.filter(Boolean);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtered)
    };

  } catch (error) {
    console.error('world-flavours error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};