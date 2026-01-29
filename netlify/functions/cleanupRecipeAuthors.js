// Path: netlify/functions/cleanupRecipeAuthors.js
// NOTE: This is a ONE-TIME cleanup function. Run once, then DELETE this file.

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
    const client = await getMongoClient();
    const collection = client.db("recipe-me-db").collection("recipes");
    
    console.log('🧹 Starting cleanup of author.email from recipes...');
    
    // Remove ONLY email from author objects (keep auth0Id for ownership)
    const result = await collection.updateMany(
      { 'author.email': { $exists: true } },
      { 
        $unset: { 
          'author.email': ''
        }
      }
    );
    
    console.log(`✅ Cleanup complete: Modified ${result.modifiedCount} recipes`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Cleanup complete',
        modifiedCount: result.modifiedCount
      })
    };
    
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
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