import { getMongoClient } from './utils/mongoClient.js';
import { headers, verifyToken } from './utils/verifyAuth.js';
import { isValidSlug } from './utils/slugGenerator.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify user
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    const decoded = await verifyToken(token);
    
    const slug = event.queryStringParameters?.slug;
    const recipeId = event.queryStringParameters?.recipeId; // Optional, for updates
    
    if (!slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Slug required' })
      };
    }
    
    if (!isValidSlug(slug)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid slug format',
          available: false
        })
      };
    }
    
    const client = await getMongoClient();
    const db = client.db('recipe-me-db');
    const usersCollection = db.collection('users');
    const recipesCollection = db.collection('recipes');
    
    // Get user's username
    const user = await usersCollection.findOne({ auth0Id: decoded.sub });
    
    if (!user || !user.username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User has no username' })
      };
    }
    
    const fullSlug = `${user.username}/${slug}`;
    
    // Check if slug exists for this user
    const existing = await recipesCollection.findOne({
      fullSlug: fullSlug,
      ...(recipeId && { id: { $ne: recipeId } })
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        available: !existing,
        fullSlug
      })
    };
    
  } catch (error) {
    console.error('Check recipe slug error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};