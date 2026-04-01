// netlify/functions/migrateCategoryNames.js
// ONE-TIME SCRIPT: Update old category names to new taxonomy

import { getMongoClient } from './utils/mongoClient.js';

// Mapping old → new category names
const CATEGORY_MAPPING = {
  // Old → New (lowercase old names)
  'drinks': 'Cocktails',
  'desserts': 'Desserts & Sweets',
  'appetizers': 'Appetizers & Starters',
  'meals': 'Main Dishes',
  'breakfast': 'Breakfast & Brunch',
  'lunch': 'Main Dishes',
  'dinner': 'Main Dishes',
  
  // Also handle capitalized versions
  'Drinks': 'Cocktails',
  'Desserts': 'Desserts & Sweets',
  'Appetizers': 'Appetizers & Starters',
  'Meals': 'Main Dishes',
  'Breakfast': 'Breakfast & Brunch',
  'Lunch': 'Main Dishes',
  'Dinner': 'Main Dishes',
};

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const client = await getMongoClient();
    const db = client.db('recipe-me-db');
    const recipesCollection = db.collection('recipes');
    
    // Find all recipes with categories
    const recipes = await recipesCollection.find({
      categories: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`Found ${recipes.length} recipes with categories`);
    
    let updateCount = 0;
    const updateLog = [];
    
    // Process each recipe
    for (const recipe of recipes) {
      const oldCategories = recipe.categories || [];
      const newCategories = [];
      
      // Map old categories to new ones
      for (const oldCat of oldCategories) {
        const newCat = CATEGORY_MAPPING[oldCat] || oldCat;
        
        // Avoid duplicates
        if (!newCategories.includes(newCat)) {
          newCategories.push(newCat);
        }
      }
      
      // Only update if categories changed
      if (JSON.stringify(oldCategories.sort()) !== JSON.stringify(newCategories.sort())) {
        await recipesCollection.updateOne(
          { _id: recipe._id },
          { 
            $set: { 
              categories: newCategories,
              updatedAt: new Date().toISOString()
            } 
          }
        );
        
        updateCount++;
        updateLog.push({
          recipeId: recipe._id,
          recipeName: recipe.name,
          old: oldCategories,
          new: newCategories
        });
      }
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: `Updated ${updateCount} recipes`,
        totalRecipes: recipes.length,
        updatedRecipes: updateCount,
        log: updateLog
      })
    };
    
  } catch (error) {
    console.error('Migration error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Migration failed',
        message: error.message
      })
    };
  }
}