import { getMongoClient } from './utils/mongoClient.js';
import { headers, verifyToken } from './utils/verifyAuth.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const slug = event.queryStringParameters?.slug;
    
    if (!slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'slug parameter required' })
      };
    }

    // ✅ Check if user is authenticated (optional for drafts)
    const token = event.headers.authorization?.split(' ')[1];
    let currentUserId = null;
    
    if (token) {
      try {

        const decoded = await verifyToken(token);
        currentUserId = decoded.sub;
        console.log("currentUserId", currentUserId)
      } catch (err) {
        // Not authenticated, that's okay
        console.log('Token verification failed:', err.message);
      }
    }

    const client = await getMongoClient();
    const db = client.db('recipe-me-db');
    const recipesCollection = db.collection('recipes');

    // ✅ Look up by slug
    const recipe = await recipesCollection.findOne({ slug: slug });

    if (!recipe) {
      console.log(`Recipe not found with slug: ${slug}`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Recipe not found' })
      };
    }

    // ✅ Check access: published OR user is the author
    const isAuthor = currentUserId && recipe.author?.auth0Id === currentUserId;
    
    console.log('Recipe access check:', {
      slug,
      isPublic: recipe.isPublic,
      isAuthor,
      currentUserId,
      recipeAuthor: recipe.author?.auth0Id
    });
    
    if (!recipe.isPublic && !isAuthor) {
      console.log('Access denied: recipe is not public and user is not author');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Recipe not found' })
      };
    }

    console.log(`✅ Returning recipe: ${recipe.name}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(recipe)
    };

  } catch (error) {
    console.error('Get recipe by slug error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};