import { MongoClient } from "mongodb";
import { requireAuth } from "./utils/auth.js";

let client = null;

async function getClient() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  return client;
}

const baseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// ✅ Public handler for GET requests (no auth required)
async function publicLikeHandler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: baseHeaders, body: '' };
  }

  const recipeId = event.queryStringParameters.id;

  try {
    const client = await getClient();
    const db = client.db("recipe-me-db");
    const likes = db.collection("recipeLikes");

    if (event.httpMethod === "GET") {
      const count = await likes.countDocuments({ recipeId });
      
      return { 
        statusCode: 200, 
        headers: {
          ...baseHeaders,
          'Cache-Control': 'public, max-age=60', // ✅ Cache public likes for 60 seconds
          'CDN-Cache-Control': 'public, max-age=60'
        },
        body: JSON.stringify({ recipeId, likes: count, liked: false }) 
      };
    }

    // POST and DELETE require auth
    return { 
      statusCode: 401, 
      headers: baseHeaders,
      body: JSON.stringify({ error: "Authentication required" }) 
    };
  } catch (err) {
    console.error('Like function error:', err);
    return { 
      statusCode: 500, 
      headers: baseHeaders,
      body: JSON.stringify({ error: err.message }) 
    };
  }
}

// ✅ Protected handler for POST/DELETE (auth required)
async function authenticatedLikeHandler(event, context, user) {
  const recipeId = event.queryStringParameters.id;
  const userId = user.sub;

  try {
    const client = await getClient();
    const db = client.db("recipe-me-db");
    const likes = db.collection("recipeLikes");

    if (event.httpMethod === "POST") {
      await likes.updateOne(
        { recipeId, userId },
        { $setOnInsert: { likedAt: new Date() } },
        { upsert: true }
      );
      const youLikeIt = !!(await likes.findOne({ recipeId, userId }));
      const count = await likes.countDocuments({ recipeId });

      return { 
        statusCode: 200, 
        headers: {
          ...baseHeaders,
          'Cache-Control': 'no-store' // ✅ Don't cache POST - data changed
        },
        body: JSON.stringify({ success: true, likes: count, liked: youLikeIt }) 
      };
    }

    if (event.httpMethod === "DELETE") {
      await likes.deleteOne({ recipeId, userId });
      const count = await likes.countDocuments({ recipeId });
      
      return { 
        statusCode: 200, 
        headers: {
          ...baseHeaders,
          'Cache-Control': 'no-store' // ✅ Don't cache DELETE - data changed
        },
        body: JSON.stringify({ success: true, likes: count, liked: false }) 
      };
    }

    if (event.httpMethod === "GET") {
      // Authenticated GET - show if user liked it
      const count = await likes.countDocuments({ recipeId });
      const youLikeIt = !!(await likes.findOne({ recipeId, userId }));
      
      return { 
        statusCode: 200, 
        headers: {
          ...baseHeaders,
          'Cache-Control': 'private, max-age=10', // ✅ Cache authenticated GET for 10 seconds
          'CDN-Cache-Control': 'private, max-age=10'
        },
        body: JSON.stringify({ recipeId, likes: count, liked: youLikeIt }) 
      };
    }

    return { 
      statusCode: 405, 
      headers: baseHeaders,
      body: JSON.stringify({ message: "Method Not Allowed" }) 
    };
  } catch (err) {
    console.error('Like function error:', err);
    return { 
      statusCode: 500, 
      headers: baseHeaders,
      body: JSON.stringify({ error: err.message }) 
    };
  }
}

// ✅ Route based on auth header
export const handler = async (event, context) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  // If no auth header and it's a GET, allow public access
  if (!authHeader && event.httpMethod === 'GET') {
    return publicLikeHandler(event);
  }
  
  // If auth header or POST/DELETE, require authentication
  if (authHeader || event.httpMethod !== 'GET') {
    return requireAuth(authenticatedLikeHandler)(event, context);
  }
  
  return publicLikeHandler(event);
};