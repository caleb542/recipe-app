import { MongoClient } from 'mongodb';

let cachedClient = null;

export async function getMongoClient() {
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }
  return cachedClient;
}
