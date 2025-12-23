import { getMongoClient } from "./utils/mongoClient.js";
import { verifyToken, getTokenFromHeader, headers } from './utils/verifyAuth.js';

/**
 * Migrate old recipe format to new images array format
 */
function migrateRecipeImages(recipe) {
  // If already has images array, nothing to migrate
  if (recipe.images && Array.isArray(recipe.images)) {
    return recipe;
  }

  // Create images array
  recipe.images = [];

  // If old photoURL exists, migrate it
  if (recipe.photoURL) {
    const migratedImage = {
      id: `legacy-${Date.now()}`, // Generate ID for legacy image
      url: recipe.photoURL,
      source: recipe.imageSource || 'unsplash', // Assume unsplash if not specified
      isFeatured: true,
      order: 0,
      cloudinaryPublicId: null, // Legacy images don't have publicId
      attribution: recipe.photographer ? {
        photographer: recipe.photographer,
        photographerUrl: recipe.photographerLink || null,
        requiresAttribution: true,
        canEdit: false // Assume can't edit legacy attribution
      } : null
    };

    recipe.images.push(migratedImage);
  }

  return recipe;
}

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const client = await getMongoClient();
    console.log("✅ Connected to MongoDB");

    const db = client.db('recipe-me-db');
    const collection = db.collection('recipes');

    // Check if user is authenticated (optional)
    let auth0Id = null;
    const token = getTokenFromHeader(event.headers);
    
    if (token) {
      try {
        const decoded = await verifyToken(token);
        auth0Id = decoded.sub;
      } catch (err) {
        console.log("Token verification failed, showing public only");
      }
    }

    // TEMPORARILY: Get ALL recipes to see what's there
    let recipes = await collection.find({}).toArray();

    console.log("Found recipes:", recipes.length);

    // ✅ MIGRATE old format to new format on-the-fly
    recipes = recipes.map(recipe => migrateRecipeImages(recipe));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, recipes }),
    };
  } catch (err) {
    console.error("MongoDB fetch error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
}