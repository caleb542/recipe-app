import { loadRecipes, saveRecipes } from '../functions.js';

async function syncRecipeUpdate(recipeId, mutator) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) {
    console.warn("syncRecipeUpdate: no recipe found for id", recipeId);
    return;
  }

  // Apply mutation (mutator is a function that changes recipe in place)
  mutator(recipe);

    // Save back to recipes array
  saveRecipes(recipes);

  // Also update editingRecipe
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));

  // 🔎 Debug logs
  console.log("Recipes array:", recipes);
  console.log("syncRecipeUpdate called for recipe name" , recipe.name);
  console.log("Updated recipe object:", recipe.directions);
  console.log("LocalStorage editingRecipe:", JSON.parse(localStorage.getItem('editingRecipe')).directions);

}

export {
    syncRecipeUpdate
}
