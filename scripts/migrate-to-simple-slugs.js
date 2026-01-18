/**
 * Migration: Convert from @username/slug to simple /slug format
 * 
 * OLD: fullSlug: "chef_caleb/carbonara"
 * NEW: fullSlug: "carbonara"
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'recipe-me-db';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

async function migrateToSimpleSlugs() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DB_NAME);
    const recipesCollection = db.collection('recipes');
    
    // Find all recipes with username/slug format
    const recipes = await recipesCollection.find({
      fullSlug: { $regex: /\// }  // Contains slash (username/slug format)
    }).toArray();
    
    console.log(`📊 Found ${recipes.length} recipes to migrate\n`);
    
    if (recipes.length === 0) {
      console.log('✅ No recipes need migration!');
      return;
    }
    
    let updated = 0;
    let skipped = 0;
    const slugCounts = {};  // Track slug usage for duplicates
    
    for (const recipe of recipes) {
      const oldFullSlug = recipe.fullSlug;
      
      // Extract just the slug part (after the slash)
      const parts = oldFullSlug.split('/');
      let newSlug = parts[parts.length - 1];  // Get last part
      
      // Handle duplicates by appending counter
      if (slugCounts[newSlug]) {
        slugCounts[newSlug]++;
        newSlug = `${newSlug}-${slugCounts[newSlug]}`;
      } else {
        slugCounts[newSlug] = 1;
      }
      
      console.log(`📝 ${recipe.name}`);
      console.log(`   OLD: /${oldFullSlug}`);
      console.log(`   NEW: /${newSlug}`);
      
      // Update recipe
      await recipesCollection.updateOne(
        { _id: recipe._id },
        { 
          $set: { 
            fullSlug: newSlug,
            slug: newSlug,
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      console.log(`   ✅ Migrated\n`);
      updated++;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎉 Migration complete!`);
    console.log(`   Updated: ${updated} recipes`);
    console.log(`   Skipped: ${skipped} recipes`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrateToSimpleSlugs();