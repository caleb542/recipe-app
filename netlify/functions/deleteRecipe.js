import { getMongoClient } from "./utils/mongoClient.js";
import { verifyToken, getTokenFromHeader, headers } from './utils/verifyAuth.js';

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    // Verify authentication
    const token = getTokenFromHeader(event.headers);
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    const decoded = await verifyToken(token);
    const auth0Id = decoded.sub;

    const { id } = JSON.parse(event.body);

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing recipe ID" }),
      };
    }

    const client = await getMongoClient();
    const collection = client.db("recipe-me-db").collection("recipes");

    // Only delete if user owns it
    const result = await collection.deleteOne({ 
      id,
      'author.auth0Id': auth0Id  // Ownership check
    });

    if (result.deletedCount === 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Not authorized to delete this recipe' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        deletedCount: result.deletedCount
      }),
    };
  } catch (err) {
    console.error("❌ Delete failed:", err);
    return {
      statusCode: err.name === 'JsonWebTokenError' ? 401 : 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
}