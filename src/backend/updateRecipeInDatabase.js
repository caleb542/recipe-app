// Path: src/backend/updateRecipeInDatabase.js

import { getToken, getUser } from '../auth/auth0.js'; // Adjust path as needed
import { getUserProfile } from '../userContext.js'; 

export async function updateRecipeInDatabase(recItem, updates) {
  const id = recItem;
  
  try {
    if (!id || typeof updates !== 'object') {
      console.warn("⚠️ Invalid update payload:", { id, updates });
      throw new Error("Missing or invalid recipe ID or updates");
    }

    // Get auth token
    const token = await getToken();
    if (!token) {
      throw new Error('You must be logged in to save recipes');
    }

    // Get user info for new recipes
    const user = await getUser();
    const profile = getUserProfile(); 

    console.log('🔍 Full Auth0 user:', user);
    console.log('🔍 Full profile:', profile);

    const payload = {
      id,
      updates: {
        ...updates,
        // ✅ ONLY send author name - no email, no authId for privacy
        author: updates.author || {
          name: profile?.profile?.displayName || user.name || user.email || 'Unknown User'
        },
        // ✅ Add isPublic if not present
        isPublic: updates.isPublic !== undefined ? updates.isPublic : true
      },
      updatedAt: new Date().toISOString()
    };

    console.log('📦 Payload:', payload);

    const response = await fetch('/.netlify/functions/updateRecipe', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // ✅ Add auth header
      },
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonErr) {
      throw new Error('Server returned an invalid or empty response');
    }

    if (!response.ok) {
      throw new Error(result?.error || result?.message || 'Failed to update recipe');
    }

    return result; // { success, recipe }
  } catch (err) {
    console.error('❌ Update failed:', err);
    throw err;
  }
}