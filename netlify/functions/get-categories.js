import { getMongoClient } from './utils/mongoClient.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const client = await getMongoClient();

  try {
    const db = client.db('recipe-me-db');
    const categoriesCollection = db.collection('categories');
    const recipesCollection = db.collection('recipes');

    // Get all active categories
    const categories = await categoriesCollection
      .find({ active: true })
      .sort({ group: 1, order: 1 })
      .toArray();

    // Get recipe counts per category — recipes store display names currently
    // so we count against both slug and display name for compatibility
    const counted = await Promise.all(categories.map(async (cat) => {
      const count = await recipesCollection.countDocuments({
        isPublic: true,
        status: { $ne: 'draft' },
        $or: [
          { categories: cat.slug },
          { categories: cat.name }
        ]
      });

      return {
        slug: cat.slug,
        name: cat.name,
        group: cat.group,
        order: cat.order,
        recipeCount: count,
        description: cat.description || null,
        sectionTitle: cat.sectionTitle || null,
        image: cat.image || null
      };
    }));

    // Group by nav group
    const grouped = counted.reduce((acc, cat) => {
      if (!acc[cat.group]) acc[cat.group] = [];
      acc[cat.group].push(cat);
      return acc;
    }, {});

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories: counted,
        grouped
      })
    };

  } catch (error) {
    console.error('get-categories error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};