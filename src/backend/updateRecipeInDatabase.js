export async function updateRecipeInDatabase(recItem, updates) {
  const id = recItem;
  const payload = {
    id,
    updates,
    updatedAt: new Date().toISOString()
  };

  console.log('📦 Payload:', payload);

  try {
    if (!id || typeof updates !== 'object') {
  console.warn("⚠️ Invalid update payload:", { id, updates });
  throw new Error("Missing or invalid recipe ID or updates");
}

    const response = await fetch('/.netlify/functions/updateRecipe', {
      method: 'POST', // ✅ FIXED: 'PUSH' → 'POST'
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonErr) {
      throw new Error('Server returned an invalid or empty response');
    }

    if (!response.ok) {
      throw new Error(result?.message || 'Failed to update recipe');
    }

    return result; // { success, recipe }
  } catch (err) {
    console.error('❌ Update failed:', err);
    throw err; // rethrow so the caller can handle it (e.g. show toast)
  }
}
