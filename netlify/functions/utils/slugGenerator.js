import { getMongoClient } from './mongoClient.js';

/**
 * Generate base slug from text
 */
export function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    // Handle special characters
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    // Remove non-alphanumeric
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 100);
}

/**
 * Generate unique slug for a recipe
 */
export async function generateUniqueSlug(name, username, recipeId = null) {
  const baseSlug = generateSlug(name);
  
  if (!baseSlug) {
    throw new Error('Could not generate slug from recipe name');
  }
  
  const client = await getMongoClient();
  const db = client.db('recipe-me-db');
  const recipesCollection = db.collection('recipes');
  
  let slug = baseSlug;
  let counter = 2;
  
  // Find unique slug for this user
  while (true) {
    const fullSlug = `${username}/${slug}`;
    
    const existing = await recipesCollection.findOne({ 
      fullSlug: fullSlug,
      ...(recipeId && { id: { $ne: recipeId } })
    });
    
    if (!existing) {
      return { slug, fullSlug };
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
    
    if (counter > 100) {
      // Fallback to ID-based
      const shortId = recipeId ? recipeId.substring(recipeId.length - 8) : Date.now();
      slug = `${baseSlug}-${shortId}`;
      break;
    }
  }
  
  return { 
    slug, 
    fullSlug: `${username}/${slug}` 
  };
}

/**
 * Validate slug format
 */
export function isValidSlug(slug) {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 1 && slug.length <= 100;
}