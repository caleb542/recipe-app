import { getMongoClient } from './utils/mongoClient.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const client = await getMongoClient();

  try {
    const db = client.db('recipe-me-db');
    const categoriesCollection = db.collection('categories');
    const recipesCollection = db.collection('recipes');

    // 1. Add Drinks as a category if it doesn't exist
    const existing = await categoriesCollection.findOne({ slug: 'drinks' });
    if (!existing) {
      await categoriesCollection.insertOne({
        slug: 'drinks',
        name: 'Drinks',
        group: 'Drinks',
        order: 0, // first in group
        active: true,
        description: 'Cocktails, mocktails, hot drinks and everything in between.',
        sectionTitle: 'Drinks',
        image: null,
        createdAt: new Date(),
        recipeCount: 0
      });
      console.log('✅ Drinks category created');
    } else {
      console.log('⚠️ Drinks category already exists');
    }

    // 2. Find all drink subcategory display names
    const drinkSubcats = await categoriesCollection
      .find({ group: 'Drinks', slug: { $ne: 'drinks' } })
      .toArray();

    const drinkNames = drinkSubcats.map(c => c.name);
    console.log('🍹 Drink subcategories found:', drinkNames);

    // 3. Find all recipes tagged with any drink subcategory
    const drinkRecipes = await recipesCollection.find({
      categories: { $in: drinkNames }
    }).toArray();

    console.log(`📋 Found ${drinkRecipes.length} drink recipes to update`);

    // 4. Add 'Drinks' to each recipe's categories if not already there
    let updated = 0;
    for (const recipe of drinkRecipes) {
      if (!recipe.categories.includes('Drinks')) {
        await recipesCollection.updateOne(
          { _id: recipe._id },
          { $addToSet: { categories: 'Drinks' } }
        );
        updated++;
        console.log(`✅ Tagged: ${recipe.name}`);
      } else {
        console.log(`⏭️ Already tagged: ${recipe.name}`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Drinks migration complete',
        subcategories: drinkNames,
        recipesFound: drinkRecipes.length,
        recipesUpdated: updated
      })
    };

  } catch (error) {
    console.error('Migration error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};