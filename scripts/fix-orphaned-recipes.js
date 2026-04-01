// scripts/fix-orphaned-recipes.js
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

async function fixOrphanedRecipes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('recipe-me-db');
    const recipesCollection = db.collection('recipes');
    const usersCollection = db.collection('users');
    
    // Find recipes without slugs
    const orphanedRecipes = await recipesCollection.find({ 
      slug: { $exists: false } 
    }).toArray();
    
    console.log(`📊 Found ${orphanedRecipes.length} orphaned recipes\n`);
    
    if (orphanedRecipes.length === 0) {
      console.log('✅ No orphaned recipes!');
      return;
    }
    
    // ✅ CHANGED: No longer need to find primary user
    
    for (const recipe of orphanedRecipes) {
      console.log(`📝 Recipe: ${recipe.name || 'Untitled'}`);
      console.log(`   ID: ${recipe.id}`);
      
      // Generate slug
      const baseSlug = generateSlug(recipe.name || 'untitled');
      let slug = baseSlug;
      let counter = 2;
      
      // ✅ CHANGED: Check against ALL recipes (not just user's recipes)
      while (await recipesCollection.findOne({ 
        fullSlug: slug,
        id: { $ne: recipe.id }
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      // ✅ CHANGED: fullSlug is just the slug now (no username)
      const fullSlug = slug;
      
      // Update recipe with slug
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
      
      console.log(`   ✅ Fixed → /${fullSlug}\n`);
    }
    
    console.log('🎉 All orphaned recipes have been fixed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixOrphanedRecipes();