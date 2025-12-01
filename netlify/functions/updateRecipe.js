import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    const { id, updates, version, updatedAt } = JSON.parse(event.body);

    if (!id || !updates) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing recipe ID or updates" }),
      };
    }

    await client.connect();
    const collection = client.db("recipe-me-db").collection("recipes");

    // Optional: fetch existing recipe only for conflict detection
    const existing = await collection.findOne({ id });

    if (existing && version !== undefined && existing.version !== undefined && version < existing.version) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: "Version conflict",
          serverRecipe: existing,
        }),
      };
    }

    const newVersion = (existing?.version || version || 1) + 1;
    const updatedFields = {
      ...updates,
      version: newVersion,
      updatedAt: updatedAt || new Date().toISOString(),
    };

    const result = await collection.updateOne(
      { id },
      { $set: updatedFields },
      { upsert: true }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
        version: newVersion,
      }),
    };
  } catch (err) {
    console.error("❌ Update failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  } finally {
    await client.close();
  }
}
