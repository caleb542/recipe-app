// Path: netlify/functions/migrateAuthorIds.js
// ONE-TIME migration to restore authorId from old author.auth0Id format

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
    
    console.log('🔧 Starting authorId migration...');
    
    // Find all recipes without authorId but with author.auth0Id
    const recipesNeedingMigration = await collection.find({
      authorId: { $exists: false },
      'author.auth0Id': { $exists: true }
    }).toArray();
    
    console.log(`Found ${recipesNeedingMigration.length} recipes to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const recipe of recipesNeedingMigration) {
      try {
        await collection.updateOne(
          { _id: recipe._id },
          { 
            $set: { 
              authorId: recipe.author.auth0Id 
            }
          }
        );
        migratedCount++;
        console.log(`✓ Migrated recipe: ${recipe.name} (${recipe.id})`);
      } catch (err) {
        console.error(`✗ Failed to migrate recipe ${recipe.id}:`, err);
        errorCount++;
      }
    }
    
    console.log(`✅ Migration complete: ${migratedCount} migrated, ${errorCount} errors`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Migration complete',
        migratedCount,
        errorCount
      })
    };
    
  } catch (err) {
    console.error("❌ Migration failed:", err);
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