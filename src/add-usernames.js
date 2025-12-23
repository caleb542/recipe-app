// scripts/add-usernames.js
import { getMongoClient } from '../netlify/functions/utils/mongoClient.js';

async function addUsernames() {
  const client = await getMongoClient();
  const db = client.db('recipe-me-db');
  const usersCollection = db.collection('users');
  
  const users = await usersCollection.find({ username: { $exists: false } }).toArray();
  
  for (const user of users) {
    // Generate username from display name or email
    let baseUsername = user.profile?.displayName 
      ? user.profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')
      : user.email.split('@')[0].toLowerCase();
    
    // Make unique
    let username = baseUsername;
    let counter = 1;
    
    while (await usersCollection.findOne({ username })) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }
    
    await usersCollection.updateOne(
      { auth0Id: user.auth0Id },
      { $set: { username } }
    );
    
    console.log(`✅ ${user.email} → ${username}`);
  }
}

addUsernames();