import { getMongoClient } from "./utils/mongoClient.js";
import { verifyToken, getTokenFromHeader, headers } from './utils/auth.js';

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    // ✅ Verify authentication
    const token = getTokenFromHeader(event.headers);
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    const decoded = await verifyToken(token);
    const auth0Id = decoded.sub;

    const { id, updates, version, updatedAt } = JSON.parse(event.body);

    if (!id || !updates) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing recipe ID or updates" }),
      };
    }

    const client = await getMongoClient();
    const collection = client.db("recipe-me-db").collection("recipes");

    // Check if recipe exists
    const existing = await collection.findOne({ id });

    if (existing) {
      // ✅ Check if it's a legacy recipe (no author or "Legacy User")
      const isLegacy = !existing.author || 
                       !existing.author.auth0Id || 
                       existing.author.name === "Legacy User";
      
      // ✅ UPDATE: Verify ownership (but allow legacy recipes)
      if (!isLegacy && existing.author?.auth0Id && existing.author.auth0Id !== auth0Id) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Not authorized to edit this recipe' })
        };
      }

      // Legacy recipes can be claimed
      if (isLegacy) {
        console.log('📝 Claiming legacy recipe for user:', auth0Id);
      }

      // Version conflict check
      if (version !== undefined && existing.version !== undefined && version < existing.version) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: "Version conflict",
            serverRecipe: existing,
          }),
        };
      }

      const newVersion = (existing?.version || version || 1) + 1;
      
      // Build update object
      const updateFields = {
        ...updates,
        version: newVersion,
        updatedAt: updatedAt || new Date().toISOString(),
      };

      // ✅ If legacy recipe, claim it by adding proper author
      if (isLegacy) {
        updateFields.author = {
          auth0Id: decoded.sub,
          name: decoded.name,
          email: decoded.email
        };
        
        // Preserve old author name as displayAuthor if it exists
        if (existing.author?.name && existing.author.name !== "Legacy User") {
          updateFields.displayAuthor = existing.author.name;
        }
      }

      const result = await collection.updateOne(
        { id },
        { $set: updateFields }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          matched: result.matchedCount,
          modified: result.modifiedCount,
          version: newVersion,
        }),
      };

    } else {
      // ✅ INSERT (upsert for new recipe): Add author automatically
      const newRecipe = {
        id,
        ...updates,
        author: {
          auth0Id: decoded.sub,
          name: decoded.name,
          email: decoded.email
        },
        displayAuthor: updates.displayAuthor || decoded.name, // Use displayAuthor if provided
        isPublic: updates.isPublic !== undefined ? updates.isPublic : true,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: updatedAt || new Date().toISOString(),
      };

      const result = await collection.insertOne(newRecipe);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          inserted: true,
          id: result.insertedId,
          version: 1,
        }),
      };
    }

  } catch (err) {
    console.error("❌ Update failed:", err);
    return {
      statusCode: err.name === 'JsonWebTokenError' ? 401 : 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}