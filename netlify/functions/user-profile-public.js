// netlify/functions/user-profile-public.js
// Public user profile view (no auth required)

import { getMongoClient } from './utils/mongoClient.js';
import { headers, verifyToken, getTokenFromHeader } from './utils/verifyAuth.js';

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

    // ✅ Check if viewing own profile (authenticated)
    let isOwnProfile = false;
    let currentUserId = null;
    const token = getTokenFromHeader(event.headers);
    
    console.log('═══════════════════════════════════════');
    console.log('🔍 Profile Request Debug:');
    console.log('Username requested:', username);
    console.log('Token present:', !!token);
    
    if (token) {
      try {
        const decoded = await verifyToken(token);
        currentUserId = decoded.sub;
        isOwnProfile = decoded.sub === user.auth0Id;
        console.log('Current user ID:', currentUserId);
        console.log('Profile user ID:', user.auth0Id);
        console.log('Is own profile:', isOwnProfile);
      } catch (error) {
        console.log('Token verification failed:', error.message);
        isOwnProfile = false;
      }
    } else {
      console.log('No token provided - viewing as public');
    }
    
    console.log('═══════════════════════════════════════');

    // Check if profile is public (unless viewing own profile)
    if (!isOwnProfile && !user.preferences?.publicProfile) {
      console.log('❌ Profile is private and user is not owner');
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'This profile is private' })
      };
    }

    // ✅ Get published recipes (always)
    console.log('📚 Fetching published recipes...');
    const publishedRecipes = await recipesCollection
      .find({ 
        'author.auth0Id': user.auth0Id,
        isPublic: true
      })
      .sort({ createdAt: -1 })
      .limit(12)
      .toArray();
    console.log('Found published recipes:', publishedRecipes.length);

    // ✅ Get unpublished recipes (only if viewing own profile)
    let unpublishedRecipes = [];
    
    console.log('📝 Checking for unpublished recipes...');
    console.log('isOwnProfile value:', isOwnProfile);
    
    if (isOwnProfile) {
      console.log('✅ IS OWN PROFILE - fetching unpublished recipes');
      console.log('Searching for recipes with author.auth0Id:', user.auth0Id);
      
      unpublishedRecipes = await recipesCollection
        .find({ 
          'author.auth0Id': user.auth0Id,
          $or: [
            { isPublic: false },
            { isPublic: { $exists: false } }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(12)
        .toArray();
      
      console.log('Found unpublished recipes:', unpublishedRecipes.length);
      if (unpublishedRecipes.length > 0) {
        console.log('First unpublished recipe:', unpublishedRecipes[0]?.name);
        console.log('First recipe isPublic:', unpublishedRecipes[0]?.isPublic);
      }
    } else {
      console.log('❌ NOT own profile - skipping unpublished recipes');
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

    // Helper function to format recipes
    const formatRecipes = (recipes) => recipes.map(recipe => ({
      id: recipe.id,
      name: recipe.name,
      slug: recipe.slug,
      fullSlug: recipe.fullSlug,
      featuredImage: recipe.images?.find(img => img.isFeatured)?.url || recipe.images?.[0]?.url || null,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      isPublic: recipe.isPublic !== false,
      categories: recipe.categories || [],
      tags: recipe.tags || []
    }));

    // Build public profile response
    const publicProfile = {
      username: user.username,
      isOwnProfile: isOwnProfile,
      profile: {
        displayName: user.profile.displayName,
        bio: user.profile.bio || '',
        location: user.profile.location || '',
        website: user.profile.website || ''
      },
      avatar: user.avatar,
      stats: user.stats,
      publishedRecipes: formatRecipes(publishedRecipes),
      unpublishedRecipes: isOwnProfile ? formatRecipes(unpublishedRecipes) : [],
      recentReviews: reviewsWithRecipeNames,
      memberSince: user.createdAt
    };

    console.log('📤 Returning profile with:', {
      published: publicProfile.publishedRecipes.length,
      unpublished: publicProfile.unpublishedRecipes.length
    });

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