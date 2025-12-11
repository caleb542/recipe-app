import { getToken, getUser } from '../auth/auth0.js'; // Adjust path as needed

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

    const payload = {
      id,
      updates: {
        ...updates,
        // ✅ Add author info (will be used for new recipes)
        author: updates.author || {
          auth0Id: user.sub,
          name: user.name,
          email: user.email
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