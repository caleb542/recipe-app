import { getMongoClient } from "./utils/mongoClient.js";
import { verifyToken, getTokenFromHeader, headers } from './utils/verifyAuth.js';

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const client = await getMongoClient();
    console.log("✅ Connected to MongoDB");

    const db = client.db('recipe-me-db');
    const collection = db.collection('recipes');

    // Check if user is authenticated (optional)
    let auth0Id = null;
    const token = getTokenFromHeader(event.headers);
    
    if (token) {
      try {
        const decoded = await verifyToken(token);
        auth0Id = decoded.sub;
      } catch (err) {
        // Invalid token, but that's okay for public endpoint
        console.log("Token verification failed, showing public only");
      }
    }

    // let recipes;
    
    // if (auth0Id) {
    //   // Authenticated: show user's recipes + public recipes
    //   recipes = await collection.find({
    //     $or: [
    //       { 'author.auth0Id': auth0Id },
    //       { isPublic: true }
    //     ]
    //   }).toArray();
    // } else {
    //   // Not authenticated: show only public recipes
    //   recipes = await collection.find({ 
    //     isPublic: true 
    //   }).toArray();
    // }

    // TEMPORARILY: Get ALL recipes to see what's there
    const recipes = await collection.find({}).toArray();

    console.log("Found recipes:", recipes.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, recipes }),
    };
  } catch (err) {
    console.error("MongoDB fetch error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
}