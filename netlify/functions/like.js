import { MongoClient } from "mongodb";

let client = null;

async function getClient() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  return client;
}

export async function handler(event) {
  const recipeId = event.queryStringParameters.id;
  const userId = event.queryStringParameters.user;

  try {
    const client = await getClient();
    const db = client.db("recipesDB");
    const likes = db.collection("recipeLikes");

    if (event.httpMethod === "POST") {
      await likes.updateOne(
        { recipeId, userId },
        { $setOnInsert: { likedAt: new Date() } },
        { upsert: true }
      );
      const youLikeIt = userId ? !!(await likes.findOne({ recipeId, userId })) : false;
      const count = await likes.countDocuments({ recipeId });

      return { statusCode: 200, body: JSON.stringify({ success: true, likes: count, liked: youLikeIt }) };
    }

    if (event.httpMethod === "DELETE") {
        if (!userId) return { statusCode: 401, body: JSON.stringify({ message: "Missing User ID" }) };
        await likes.deleteOne({ recipeId, userId });
        const count = await likes.countDocuments({ recipeId });
        return { statusCode: 200, body: JSON.stringify({ success: true, likes: count, liked: false }) };
    }

    if (event.httpMethod === "GET") {
       const count = await likes.countDocuments({ recipeId });
        const youLikeIt = userId ? !!(await likes.findOne({ recipeId, userId })) : false;
        return { statusCode: 200, body: JSON.stringify({ recipeId, likes: count, liked: youLikeIt }) };
    }

    return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" })  };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
