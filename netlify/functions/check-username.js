// netlify/functions/check-username.js
// Check if a username is available

import { getMongoClient } from './utils/mongoClient.js';
import { headers } from './utils/verifyAuth.js';

export const handler = async (event) => {
  // Handle CORS preflight
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
    const params = event.queryStringParameters || {};
    const username = params.username;

    if (!username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username parameter is required' })
      };
    }

    // Clean and validate format
    const cleanUsername = username.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          available: false,
          reason: 'Username must be 3-20 characters (letters, numbers, underscores only)'
        })
      };
    }

    // Check if username exists
    const client = await getMongoClient();
    const db = client.db('recipe-me-db');
    const usersCollection = db.collection('users');

    const existing = await usersCollection.findOne({ username: cleanUsername });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        available: !existing,
        username: cleanUsername
      })
    };

  } catch (error) {
    console.error('Username check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};