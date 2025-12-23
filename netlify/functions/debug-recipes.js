// netlify/functions/debug-recipes.js
import { getMongoClient } from "./utils/mongoClient.js";

export async function handler(event) {
  try {
    const client = await getMongoClient();
    const db = client.db('recipe-me-db');
    const collection = db.collection('recipes');

    // Get ALL recipes without filter
    const allRecipes = await collection.find({}).toArray();
    
    console.log("Total recipes:", allRecipes.length);
    console.log("Sample recipe:", allRecipes[0]);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        total: allRecipes.length,
        sample: allRecipes[0],
        allRecipes: allRecipes
      }),
    };
  } catch (err) {
    console.error("Debug error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}