// scripts/add-usernames.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

function generateUsername(displayName, email) {
  // Try display name first
  if (displayName) {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 20);
  }
  
  // Fallback to email
  return email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 20);
}

async function addUsernames() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('recipe-me-db');
    const usersCollection = db.collection('users');
    
    // Find users without username
    const users = await usersCollection.find({ 
      username: { $exists: false } 
    }).toArray();
    
    console.log(`📊 Found ${users.length} users without usernames`);
    
    if (users.length === 0) {
      console.log('✅ All users already have usernames!');
      return;
    }
    
    for (const user of users) {
      // Generate base username
      let baseUsername = generateUsername(
        user.profile?.displayName,
        user.email
      );
      
      // Make unique
      let username = baseUsername;
      let counter = 1;
      
      while (await usersCollection.findOne({ username })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }
      
      // Update user
      await usersCollection.updateOne(
        { auth0Id: user.auth0Id },
        { $set: { username } }
      );
      
      console.log(`✅ ${user.email} → @${username}`);
    }
    
    console.log('\n🎉 Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addUsernames();