import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();


const OLD_URI = process.env.OLD_MONGODB_URI;
const NEW_URI = process.env.NEW_MONGODB_URI;

const OLD_DB_NAME = "recipe-app";
const OLD_COLLECTION_NAME = "recipe-app-2";
const NEW_DB_NAME = "recipe-me-db";
const NEW_COLLECTION_NAME = "recipes";

const oldClient = new MongoClient(OLD_URI);
const newClient = new MongoClient(NEW_URI);

async function migrateRecipes() {
  try {
    await oldClient.connect();
    await newClient.connect();

    const oldCollection = oldClient.db(OLD_DB_NAME).collection(OLD_COLLECTION_NAME);
    const newCollection = newClient.db(NEW_DB_NAME).collection(NEW_COLLECTION_NAME);

    const recipes = await oldCollection.find({}).toArray();
    console.log(`✅ Fetched ${recipes.length} recipes from old cluster`);

    if (recipes.length > 0) {
      const result = await newCollection.insertMany(recipes);
      console.log(`✅ Inserted ${result.insertedCount} recipes into new cluster`);
    } else {
      console.log("⚠️ No recipes found to migrate");
    }
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await oldClient.close();
    await newClient.close();
  }
}

migrateRecipes();
