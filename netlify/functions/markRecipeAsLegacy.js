// Path: netlify/functions/markRecipeAsLegacy.js
// ONE-TIME script to mark a specific orphaned recipe as legacy

import { getMongoClient } from "./utils/mongoClient.js";
import { headers } from './utils/auth.js';

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const { recipeId } = JSON.parse(event.body);
    
    if (!recipeId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "recipeId required" })
      };
    }

    const client = await getMongoClient();
    const collection = client.db("recipe-me-db").collection("recipes");
    
    console.log(`🔧 Marking recipe ${recipeId} as legacy...`);
    
    // Find the recipe
    const recipe = await collection.findOne({ id: recipeId });
    
    if (!recipe) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Recipe not found" })
      };
    }
    
    // Mark as legacy
    const result = await collection.updateOne(
      { id: recipeId },
      { 
        $set: { 
          author: {
            auth0Id: 'legacy',
            name: 'Legacy User',
            username: null
          }
        }
      }
    );
    
    console.log(`✅ Recipe marked as legacy: ${recipe.name}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Recipe "${recipe.name}" marked as legacy`,
        recipeId: recipe.id
      })
    };
    
  } catch (err) {
    console.error("❌ Failed to mark recipe as legacy:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: err.message 
      })
    };
  }
}