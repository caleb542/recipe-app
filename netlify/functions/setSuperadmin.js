/**
 * SUPERADMIN SETUP FUNCTION
 * 
 * One-time use function to set a user as superadmin
 * After setting yourself as superadmin, you can manage other users' roles from the UI
 */


import { getMongoClient } from './utils/mongoClient.js';

export async function handler(event) {
  // Only allow this in development or with a secret key
  const SECRET_KEY = process.env.SUPERADMIN_SETUP_KEY;
  const providedKey = event.queryStringParameters?.key;
  
  if (!SECRET_KEY || providedKey !== SECRET_KEY) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Unauthorized. Set SUPERADMIN_SETUP_KEY in .env' })
    };
  }
  
  // Get email or auth0Id from query params
  const email = event.queryStringParameters?.email;
  const auth0Id = event.queryStringParameters?.auth0Id;
  
  if (!email && !auth0Id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Must provide email or auth0Id',
        usage: '/.netlify/functions/setSuperadmin?key=YOUR_KEY&email=you@example.com'
      })
    };
  }
  
  try {
    const db = await getMongoClient();
    
    // Find user and update role
    const query = email ? { email } : { auth0Id };
    
    const result = await db.collection('users').findOneAndUpdate(
      query,
      { 
        $set: { 
          role: 'superadmin',
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'User not found',
          searched: query
        })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'User promoted to superadmin',
        user: {
          username: result.value.username,
          email: result.value.email,
          role: result.value.role
        }
      })
    };
    
  } catch (error) {
    console.error('Error setting superadmin:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
