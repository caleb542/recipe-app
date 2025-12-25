export async function getRecipesFromDatabase() {
  console.trace('🔵 WHO IS CALLING THIS?');
  try {
    const response = await fetch('/.netlify/functions/getRecipesFromDatabase');
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || 'Failed to fetch recipes');

    console.log("✅ Recipes:", result.recipes);
    return result.recipes;
  } catch (err) {
    console.error("❌ Frontend fetch error:", err);
    return []; // Return empty array to avoid breaking UI
  }
}