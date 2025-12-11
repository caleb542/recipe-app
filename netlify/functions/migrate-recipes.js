// netlify/functions/migrate-recipes.js
import { getMongoClient } from "./utils/mongoClient.js";

export async function handler(event) {
  try {
    const client = await getMongoClient();
    const db = client.db('recipe-me-db');
    const collection = db.collection('recipes');

    // Update ALL existing recipes to be public
    const result = await collection.updateMany(
      { isPublic: { $exists: false } },  // Recipes without isPublic field
      { 
        $set: { 
          isPublic: true,  // Make them all public by default
          // Optionally add author info if missing
          author: {
            auth0Id: "legacy",
            name: "Legacy User",
            email: "legacy@example.com"
          }
        } 
      }
    );

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        updated: result.modifiedCount,
        message: `Updated ${result.modifiedCount} recipes to be public`
      }),
    };
  } catch (err) {
    console.error("Migration error:", err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
}