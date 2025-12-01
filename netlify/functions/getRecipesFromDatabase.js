import { getMongoClient } from '../utils/mongoClient.js';

export async function handler(event) {
  try {
    const client = await getMongoClient();
    console.log("✅ Connected to MongoDB");

    const db = client.db('recipe-me-db');
    console.log("✅ Using DB:", db.databaseName);

    const collection = db.collection('recipes');
    console.log("✅ Collection ready");

    const recipes = await collection.find({}).toArray();

    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, recipes }),
    };
  } catch (err) {
    console.error("MongoDB fetch error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: err.message }),
    };
  }
}
