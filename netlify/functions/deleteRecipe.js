import { MongoClient } from "mongodb";
import dotenv from "dotenv";


// dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

export async function handler(event) {
  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { id } = JSON.parse(event.body);

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing recipe ID" }),
      };
    }

    await client.connect();
    const collection = client.db("recipe-me-db").collection("recipes");

    const result = await collection.deleteOne({ id });


    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        deletedCount: result.deletedCount
      }),
    };
  } catch (err) {
    console.error("❌ Delete failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  } finally {
    await client.close();
  }
}
