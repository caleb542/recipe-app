import { getMongoClient } from "./utils/mongoClient.js";

export default async function handler(req, res) {
  try {
    const client = await getMongoClient();
    const db = client.db('recipe-me-db');

    const result = await db.collection('recipes').aggregate([
      { $project: { createdAtType: { $type: "$createdAt" } } },
      { $group: { _id: "$createdAtType", count: { $sum: 1 } } }
    ]).toArray();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}