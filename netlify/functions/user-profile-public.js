// netlify/functions/user-profile-public.js
// Public user profile view (no auth required)

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

    const client = await getMongoClient();
    const db = client.db('recipe-me-db');
    const usersCollection = db.collection('users');
    const ratingsCollection = db.collection('ratings');
    const recipesCollection = db.collection('recipes');

    // Find user by username
    const user = await usersCollection.findOne({ 
      username: username.toLowerCase() 
    });

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Check if profile is public
    if (!user.preferences?.publicProfile) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'This profile is private' })
      };
    }

    // Get user's recent reviews
    const recentReviews = await ratingsCollection
      .find({ 
        userId: user.auth0Id,
        comment: { $exists: true, $ne: '' }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Enrich reviews with recipe names
    const reviewsWithRecipeNames = await Promise.all(
      recentReviews.map(async (review) => {
        const recipe = await recipesCollection.findOne({ 
          id: review.recipeId 
        });
        return {
          rating: review.rating,
          comment: review.comment,
          recipeId: review.recipeId,
          recipeName: recipe?.name || 'Unknown Recipe',
          createdAt: review.createdAt
        };
      })
    );

    // Build public profile response
    const publicProfile = {
      username: user.username,
      profile: {
        displayName: user.profile.displayName,
        bio: user.profile.bio || '',
        location: user.profile.location || '',
        website: user.profile.website || ''
      },
      avatar: user.avatar,
      stats: user.stats,
      recentReviews: reviewsWithRecipeNames,
      memberSince: user.createdAt
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(publicProfile)
    };

  } catch (error) {
    console.error('Public profile error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};