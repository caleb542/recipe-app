// netlify/functions/ratings.js
// API endpoint for recipe ratings WITH OPTIONAL COMMENTS
// UPDATED to use your existing mongoClient.js

import { getMongoClient } from './utils/mongoClient.js';  // ← CORRECTED PATH
import { verifyToken, getTokenFromHeader, headers } from './utils/verifyAuth.js';

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = await getMongoClient();
  const db = client.db('recipe-me-db'); // ✅ Correct database name
  const ratingsCollection = db.collection('ratings');

  // Get user ID (either from auth token or anonymous)
  let userId = 'anonymous';
  let userName = 'Anonymous';
  const token = getTokenFromHeader(event.headers);
  if (token) {
    try {
      const decoded = await verifyToken(token);
      userId = decoded.sub;
      userName = decoded.name || decoded.email || 'User';
    } catch (err) {
      // If token is invalid, treat as anonymous
      userId = 'anonymous';
    }
  }

  try {
    // GET: Get rating stats for a recipe (including comments)
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const recipeId = params.recipeId;
      const includeComments = params.includeComments === 'true';

      if (!recipeId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'recipeId is required' })
        };
      }

      // Get aggregated stats for the recipe
      const stats = await ratingsCollection.aggregate([
        { $match: { recipeId } },
        {
          $group: {
            _id: '$recipeId',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            fiveStarCount: {
              $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
            },
            fourStarCount: {
              $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
            },
            threeStarCount: {
              $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
            },
            twoStarCount: {
              $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
            },
            oneStarCount: {
              $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
            }
          }
        }
      ]).toArray();

      // Get user's personal rating if they're logged in
      let userRating = null;
      if (userId !== 'anonymous') {
        const userRatingDoc = await ratingsCollection.findOne({
          recipeId,
          userId
        });
        userRating = userRatingDoc ? {
          rating: userRatingDoc.rating,
          comment: userRatingDoc.comment || null
        } : null;
      }

      // Get comments if requested
      let comments = [];
      if (includeComments) {
        comments = await ratingsCollection
          .find({ 
            recipeId,
            comment: { $exists: true, $nin: [null, ''] }
          })
          .sort({ createdAt: -1 })
          .limit(50) // Limit to 50 most recent comments
          .project({
            rating: 1,
            comment: 1,
            userName: 1,
            createdAt: 1,
            updatedAt: 1
          })
          .toArray();
      }

      const result = stats.length > 0 ? {
        recipeId,
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
        userRating,
        breakdown: {
          5: stats[0].fiveStarCount,
          4: stats[0].fourStarCount,
          3: stats[0].threeStarCount,
          2: stats[0].twoStarCount,
          1: stats[0].oneStarCount
        },
        comments: includeComments ? comments : undefined
      } : {
        recipeId,
        averageRating: 0,
        totalReviews: 0,
        userRating: null,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        comments: includeComments ? [] : undefined
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    // POST: Submit or update a rating (with optional comment)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { recipeId, rating, comment } = body;

      // Validation
      if (!recipeId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'recipeId is required' })
        };
      }

      if (!rating || rating < 1 || rating > 5) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'rating must be between 1 and 5' })
        };
      }

      // Optional comment validation
      if (comment && typeof comment !== 'string') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'comment must be a string' })
        };
      }

      // Limit comment length
      const trimmedComment = comment ? comment.trim().substring(0, 1000) : null;

      // Upsert rating (update if exists, insert if new)
      const updateDoc = {
        $set: {
          rating,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      };

      // Only set comment if provided (allows rating without comment)
      if (trimmedComment) {
        updateDoc.$set.comment = trimmedComment;
        updateDoc.$set.userName = userName;
      }

      const result = await ratingsCollection.updateOne(
        { recipeId, userId },
        updateDoc,
        { upsert: true }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: result.upsertedCount > 0 ? 'Rating created' : 'Rating updated',
          recipeId,
          rating,
          hasComment: !!trimmedComment
        })
      };
    }

    // DELETE: Remove a rating
    if (event.httpMethod === 'DELETE') {
      const params = event.queryStringParameters || {};
      const recipeId = params.recipeId;

      if (!recipeId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'recipeId is required' })
        };
      }

      // Only allow authenticated users to delete their own ratings
      if (userId === 'anonymous') {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Must be logged in to delete ratings' })
        };
      }

      const result = await ratingsCollection.deleteOne({
        recipeId,
        userId
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: result.deletedCount > 0 ? 'Rating deleted' : 'No rating found',
          deletedCount: result.deletedCount
        })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Rating function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};