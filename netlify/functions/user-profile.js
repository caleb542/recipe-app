// netlify/functions/user-profile.js
// User profile management - create, read, update user profiles

import { getMongoClient } from './utils/mongoClient.js';
import { verifyToken, getTokenFromHeader, headers } from './utils/verifyAuth.js';

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = await getMongoClient();
  const db = client.db('recipe-me-db');
  const usersCollection = db.collection('users');

  // Verify authentication
  const token = getTokenFromHeader(event.headers);
  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }

  try {
    const decoded = await verifyToken(token);
    const auth0Id = decoded.sub;
    const email = decoded.email;

    // GET - Fetch user profile
    if (event.httpMethod === 'GET') {
      const user = await usersCollection.findOne({ auth0Id });
      
      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Profile not found',
            needsSetup: true 
          })
        };
      }

      // Update last login
      await usersCollection.updateOne(
        { auth0Id },
        { $set: { lastLoginAt: new Date() } }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(user)
      };
    }

    // POST - Create new profile (first-time setup)
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      
      // Validate required fields
      if (!body.username || !body.displayName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Username and display name are required' 
          })
        };
      }

      // Clean and validate username
      const username = body.username.toLowerCase().trim();
      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Username must be 3-20 characters (letters, numbers, underscores only)' 
          })
        };
      }

      // Check if username is taken
      const existingUser = await usersCollection.findOne({ username });
      if (existingUser) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Username already taken' })
        };
      }

      // Check if user already has a profile (shouldn't happen, but just in case)
      const existingProfile = await usersCollection.findOne({ auth0Id });
      if (existingProfile) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Profile already exists' })
        };
      }

      // Create new user profile
      const newUser = {
        auth0Id: auth0Id,
        username: username.toLowerCase(),
        email: email || null,
        profile: {
          displayName: body.displayName.trim(),
          bio: '',
          location: '',
          website: ''
        },
        avatar: {
          type: body.avatarType || 'initials',
          url: body.avatarUrl || '',
          initials: getInitials(body.displayName)
        },
        groups: ['user'],
        preferences: {
          emailNotifications: true,
          publicProfile: true
        },
        stats: {
          recipesCreated: 0,
          reviewsWritten: 0,
          likesReceived: 0
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };

      const result = await usersCollection.insertOne(newUser);
      newUser._id = result.insertedId;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newUser)
      };
    }

    // PUT - Update existing profile
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body);
      
      // Build update document
      const updateDoc = {
        $set: {
          updatedAt: new Date()
        }
      };

      // Only update fields that are provided
      if (body.displayName !== undefined) {
        updateDoc.$set['profile.displayName'] = body.displayName.trim();
      }
      if (body.bio !== undefined) {
        updateDoc.$set['profile.bio'] = body.bio.trim().substring(0, 500);
      }
      if (body.location !== undefined) {
        updateDoc.$set['profile.location'] = body.location.trim().substring(0, 100);
      }
      if (body.website !== undefined) {
        updateDoc.$set['profile.website'] = body.website.trim().substring(0, 200);
      }
      if (body.avatar) {
        updateDoc.$set['avatar'] = body.avatar;
      }
      if (body.preferences) {
        if (body.preferences.emailNotifications !== undefined) {
          updateDoc.$set['preferences.emailNotifications'] = body.preferences.emailNotifications;
        }
        if (body.preferences.publicProfile !== undefined) {
          updateDoc.$set['preferences.publicProfile'] = body.preferences.publicProfile;
        }
      }

      const result = await usersCollection.updateOne(
        { auth0Id },
        updateDoc
      );

      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Profile not found' })
        };
      }

      const updatedUser = await usersCollection.findOne({ auth0Id });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedUser)
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('User profile error:', error);
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

// Helper function to generate initials from name
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}