import { getMongoClient } from './utils/mongoClient.js';
import { headers } from './utils/verifyAuth.js';

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
    // fullSlug format: "chef_caleb/carbonara"
    const fullSlug = event.queryStringParameters?.fullSlug;
    
    if (!fullSlug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'fullSlug parameter required' })
      };
    }

    const client = await getMongoClient();
    const db = client.db('recipe-me-db');
    const recipesCollection = db.collection('recipes');

    const recipe = await recipesCollection.findOne({ 
      fullSlug: fullSlug,
      isPublic: true
    });

    if (!recipe) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Recipe not found' })
      };
    }

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