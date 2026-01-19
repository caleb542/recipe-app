/**
 * Migration Script: Auto-unpublish incomplete recipes
 * 
 * Scans all recipes in MongoDB and sets isPublic: false
 * for any recipe missing ingredients or directions.
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'recipe-app';

async function autoUnpublishIncompleteRecipes() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected!\n');

   const db = client.db();
    const recipesCollection = db.collection('recipes');

    // Find all recipes
    console.log('📊 Fetching all recipes...');
    const allRecipes = await recipesCollection.find({}).toArray();
    console.log(`Found ${allRecipes.length} total recipes\n`);

    // Check each recipe for completeness
    const incompleteRecipes = [];
    
    for (const recipe of allRecipes) {
      const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
      const hasDirections = recipe.directions && recipe.directions.length > 0;
      const isComplete = hasIngredients && hasDirections;
      
      // If incomplete AND currently published
      if (!isComplete && recipe.isPublic === true) {
        incompleteRecipes.push({
          _id: recipe._id,
          name: recipe.name,
          hasIngredients,
          hasDirections
        });
      }
    }

    console.log(`\n📋 Found ${incompleteRecipes.length} incomplete recipes that are currently published:\n`);
    
    if (incompleteRecipes.length === 0) {
      console.log('✅ All recipes are either complete or already unpublished!');
      return;
    }

    // Display what will be unpublished
    incompleteRecipes.forEach((recipe, index) => {
      console.log(`${index + 1}. "${recipe.name}"`);
      console.log(`   - Has ingredients: ${recipe.hasIngredients ? '✅' : '❌'}`);
      console.log(`   - Has directions: ${recipe.hasDirections ? '✅' : '❌'}`);
    });

    console.log('\n⚠️  These recipes will be set to UNPUBLISHED (isPublic: false)');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

    // 5 second delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔄 Updating recipes...\n');

    // Update each incomplete recipe
    let updated = 0;
    for (const recipe of incompleteRecipes) {
      const result = await recipesCollection.updateOne(
        { _id: recipe._id },
        { 
          $set: { 
            isPublic: false,
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        updated++;
        console.log(`✅ Unpublished: "${recipe.name}"`);
      } else {
        console.log(`⚠️  Failed to update: "${recipe.name}"`);
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   - Total recipes: ${allRecipes.length}`);
    console.log(`   - Incomplete found: ${incompleteRecipes.length}`);
    console.log(`   - Successfully updated: ${updated}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
autoUnpublishIncompleteRecipes();