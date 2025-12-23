import { getMongoClient } from "./utils/mongoClient.js";
import { verifyToken, getTokenFromHeader, headers } from './utils/auth.js';
import { generateUniqueSlug } from './utils/slugGenerator.js'; // ✅ NEW

/**
 * Ensure recipe has images array format
 */
function ensureImagesArray(updates) {
  // If images array provided, use it
  if (updates.images && Array.isArray(updates.images)) {
    return updates;
  }

  // If old format provided, convert it
  if (updates.photoURL) {
    updates.images = [{
      id: `legacy-${Date.now()}`,
      url: updates.photoURL,
      source: updates.imageSource || 'unsplash',
      isFeatured: true,
      order: 0,
      cloudinaryPublicId: null,
      attribution: updates.photographer ? {
        photographer: updates.photographer,
        photographerUrl: updates.photographerLink || null,
        requiresAttribution: true,
        canEdit: false
      } : null
    }];

    // Remove old fields from updates
    delete updates.photoURL;
    delete updates.photographer;
    delete updates.photographerLink;
    delete updates.imageSource;
  }

  // Ensure images array exists (even if empty)
  if (!updates.images) {
    updates.images = [];
  }

  return updates;
}

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
    const email = decoded.email;
    const name = decoded.name;

    const { id, updates, version, updatedAt } = JSON.parse(event.body);

    console.log('📥 Backend:', decoded);
    console.log('📥 Backend received updates:', updates);
    console.log('📥 Backend received author:', updates.author);

    if (!id || !updates) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing recipe ID or updates" }),
      };
    }

    const client = await getMongoClient();
    const db = client.db("recipe-me-db");
    const collection = db.collection("recipes");
    const usersCollection = db.collection("users"); // ✅ NEW

    // ✅ NEW: Get user's username
    const user = await usersCollection.findOne({ auth0Id });
    
    if (!user || !user.username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'User must have a username. Please complete your profile setup.' 
        })
      };
    }

    // Check if recipe exists
    const existing = await collection.findOne({ id });

    if (existing) {
      // ✅ Check if it's a legacy recipe (no author or "Legacy User")
      const isLegacy = !existing.author || 
                       !existing.author.auth0Id || 
                       existing.author.name === "Legacy User";
      
      // ✅ Verify ownership (but allow legacy recipes)
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
      
      // ✅ Ensure images array format
      const processedUpdates = ensureImagesArray({ ...updates });
      
      // ✅ NEW: Handle slug updates
      let slugUpdates = {};
      
      // If name changed or no slug exists, regenerate slug
      if (processedUpdates.name && 
          (processedUpdates.name !== existing.name || !existing.slug)) {
        const { slug, fullSlug } = await generateUniqueSlug(
          processedUpdates.name,
          user.username,
          id
        );
        slugUpdates.slug = slug;
        slugUpdates.fullSlug = fullSlug;
        console.log(`🔗 Generated slug: ${fullSlug}`);
      }
      
      // If user provided custom slug, use it
      if (processedUpdates.slug) {
        const { slug, fullSlug } = await generateUniqueSlug(
          processedUpdates.slug, // Use custom slug as "name"
          user.username,
          id
        );
        slugUpdates.slug = slug;
        slugUpdates.fullSlug = fullSlug;
        console.log(`🔗 Custom slug: ${fullSlug}`);
      }
      
      // Build update object
      const updateFields = {
        ...processedUpdates,
        ...slugUpdates, // ✅ Add slug updates
        author: processedUpdates.author || {
          auth0Id: decoded.sub,
          username: user.username, // ✅ NEW
          name: decoded.name,
          email: decoded.email
        },
        version: newVersion,
        updatedAt: updatedAt || new Date().toISOString(),
      };

      // ✅ ALWAYS use frontend author if provided
      if (updates.author) {
        updateFields.author = {
          ...updates.author,
          username: user.username // ✅ Ensure username is always set
        };
      }

      // ✅ For legacy recipes being claimed, preserve old displayAuthor
      if (isLegacy && existing.author?.name && existing.author.name !== "Legacy User") {
        updateFields.displayAuthor = existing.author.name;
      }

      console.log('💾 About to save to MongoDB:', updateFields.author);
      console.log('💾 Images being saved:', updateFields.images);
      console.log('💾 Slug being saved:', updateFields.fullSlug);

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
          slug: updateFields.slug,
          fullSlug: updateFields.fullSlug
        }),
      };

    } else {
      // ✅ INSERT (upsert for new recipe)
      const processedUpdates = ensureImagesArray({ ...updates });

      // ✅ NEW: Generate slug for new recipe
      const recipeName = processedUpdates.name || 'Untitled Recipe';
      const { slug, fullSlug } = await generateUniqueSlug(
        recipeName,
        user.username,
        id
      );

      const newRecipe = {
        id,
        ...processedUpdates,
        slug, // ✅ NEW
        fullSlug, // ✅ NEW
        author: processedUpdates.author || {
          auth0Id: decoded.sub,
          username: user.username, // ✅ NEW
          name: name,
          email: email
        },
        displayAuthor: processedUpdates.displayAuthor || decoded.name,
        isPublic: processedUpdates.isPublic !== undefined ? processedUpdates.isPublic : true,
        images: processedUpdates.images || [], // Ensure images array
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: updatedAt || new Date().toISOString(),
      };

      console.log('💾 Creating new recipe with images:', newRecipe.images);
      console.log('💾 Creating new recipe with slug:', newRecipe.fullSlug);

      const result = await collection.insertOne(newRecipe);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          inserted: true,
          id: result.insertedId,
          version: 1,
          slug: newRecipe.slug,
          fullSlug: newRecipe.fullSlug
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