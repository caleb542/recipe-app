// scripts/add-recipe-slugs.js
import { getMongoClient } from '../netlify/functions/utils/mongoClient.js';

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

async function addRecipeSlugs() {
  const client = await getMongoClient();
  const db = client.db('recipe-me-db');
  const recipesCollection = db.collection('recipes');
  const usersCollection = db.collection('users');
  
  const recipes = await recipesCollection.find({ slug: { $exists: false } }).toArray();
  
  for (const recipe of recipes) {
    // Get username from user
    const user = await usersCollection.findOne({ auth0Id: recipe.author.auth0Id });
    
    if (!user || !user.username) {
      console.warn(`⚠️ No username for recipe ${recipe.id}`);
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
    
    await recipesCollection.updateOne(
      { id: recipe.id },
      { 
        $set: { 
          slug,
          fullSlug,
          'author.username': user.username  // Add username to author
        } 
      }
    );
    
    console.log(`✅ ${recipe.name} → /${fullSlug}`);
  }
  
  console.log('Migration complete!');
}

addRecipeSlugs();