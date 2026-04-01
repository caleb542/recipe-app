// scripts/add-recipe-slugs.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

async function addRecipeSlugs() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('recipe-me-db');
    const recipesCollection = db.collection('recipes');
    
    // Find recipes without slugs
    const recipes = await recipesCollection.find({ 
      slug: { $exists: false } 
    }).toArray();
    
    console.log(`📊 Found ${recipes.length} recipes without slugs`);
    
    if (recipes.length === 0) {
      console.log('✅ All recipes already have slugs!');
      return;
    }
    
    let updated = 0;
    
    for (const recipe of recipes) {
      // Generate base slug
      const baseSlug = generateSlug(recipe.name);
      
      // ✅ CHANGED: Make unique across ALL recipes (not just user's)
      let slug = baseSlug;
      let counter = 2;
      
      while (await recipesCollection.findOne({ 
        fullSlug: slug,
        id: { $ne: recipe.id }
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      // ✅ CHANGED: fullSlug is just the slug (no username)
      const fullSlug = slug;
      
      // Update recipe
      await recipesCollection.updateOne(
        { id: recipe.id },
        { 
          $set: { 
            slug,
            fullSlug,
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      console.log(`✅ ${recipe.name} → /${fullSlug}`);
      updated++;
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`   Updated: ${updated}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addRecipeSlugs();