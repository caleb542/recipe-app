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
    const usersCollection = db.collection('users');
    
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
    let skipped = 0;
    
    for (const recipe of recipes) {
      // Get username from user
      const user = await usersCollection.findOne({ 
        auth0Id: recipe.author?.auth0Id 
      });
      
      if (!user || !user.username) {
        console.warn(`⚠️  No username for recipe ${recipe.id} - skipping`);
        skipped++;
        continue;
      }
      
      // Generate base slug
      const baseSlug = generateSlug(recipe.name);
      
      // Make unique within user's recipes
      let slug = baseSlug;
      let counter = 2;
      
      while (await recipesCollection.findOne({ 
        fullSlug: `${user.username}/${slug}`,
        id: { $ne: recipe.id }
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      const fullSlug = `${user.username}/${slug}`;
      
      // Update recipe
      await recipesCollection.updateOne(
        { id: recipe.id },
        { 
          $set: { 
            slug,
            fullSlug,
            'author.username': user.username
          } 
        }
      );
      
      console.log(`✅ ${recipe.name} → /@${fullSlug}`);
      updated++;
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addRecipeSlugs();