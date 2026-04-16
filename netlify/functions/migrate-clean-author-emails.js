import { getMongoClient } from "./utils/mongoClient.js";

export default async function handler(req, res) {
  // Safety check — only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
  }

  try {
    const client = await getMongoClient();
    const db = client.db('recipe-me-db');

    // Step 1 — Clear displayAuthor where it contains an email
    const displayAuthorResult = await db.collection('recipes').updateMany(
      { displayAuthor: { $regex: '@' } },
      { $set: { displayAuthor: '' } }
    );

    // Step 2 — Clear author.name where it contains an email
    const authorNameResult = await db.collection('recipes').updateMany(
      { 'author.name': { $regex: '@' } },
      { $set: { 'author.name': '' } }
    );

    // Step 3 — Remove author.email field entirely from all records
    const authorEmailResult = await db.collection('recipes').updateMany(
      { 'author.email': { $exists: true } },
      { $unset: { 'author.email': '' } }
    );

    return new Response(JSON.stringify({
      message: 'Migration complete',
      displayAuthor: {
        matched: displayAuthorResult.matchedCount,
        modified: displayAuthorResult.modifiedCount
      },
      authorName: {
        matched: authorNameResult.matchedCount,
        modified: authorNameResult.modifiedCount
      },
      authorEmail: {
        matched: authorEmailResult.matchedCount,
        modified: authorEmailResult.modifiedCount
      }
    }), {
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