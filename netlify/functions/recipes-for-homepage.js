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

    const { slug, group, limit = 4 } = Object.fromEntries(
      new URLSearchParams(event.queryStringParameters)
    );

    if (!slug && !group) {
      return { statusCode: 400, body: 'slug or group is required' };
    }

    let matchNames = [];

    if (group) {
      // Fetch all category display names in this group
      const groupCats = await categoriesCollection
        .find({ group })
        .toArray();
      matchNames = groupCats.map(c => c.name);
    } else {
      // Single category — look up display name from slug
      const category = await categoriesCollection.findOne({ slug });
      matchNames = category?.name ? [category.name] : [slug];
    }

    const query = {
      isPublic: true,
      'ingredients.0': { $exists: true },
      'directions.0': { $exists: true },
      categories: { $in: matchNames }
    };

    // Liked first
    const likedRecipes = await recipesCollection
      .find({ ...query, likes: { $gt: 0 } })
      .sort({ likes: -1 })
      .limit(parseInt(limit))
      .toArray();

    let result = likedRecipes;

    // Fill with random if not enough liked
    if (result.length < parseInt(limit)) {
      const needed = parseInt(limit) - result.length;
      const existingIds = result.map(r => r._id);

      const randomRecipes = await recipesCollection
        .aggregate([
          { $match: { ...query, _id: { $nin: existingIds } } },
          { $sample: { size: needed } }
        ])
        .toArray();

      result = [...result, ...randomRecipes];
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('recipes-for-homepage error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};