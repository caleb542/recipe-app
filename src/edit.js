// Entry point for Recipe Editor
import { v4 as uuidv4 } from 'uuid';
import { loadRecipes, saveRecipes } from './functions.js';
import '@toast-ui/editor/dist/toastui-editor.css';

// Helpers
import { populateFields, wireFieldListeners } from './helpers/fields.js';
import { listDirections, setupDirections } from './helpers/directions.js';
import { setupTagsUI } from './helpers/tagsUI.js';
import { listIngredients, setupIngredientDelegation, addIngredient } from './helpers/ingredients.js';
import { setupFeatureImage } from './helpers/featureImage.js';
import { setupEditor } from './helpers/editor.js';
import { setupRecipeDeletion, setupSaveButton, setupUpdateDatabase } from './helpers/actions.js';
import { setupAccessibility } from './helpers/accessibility.js';
import { hamburger } from './functions.js'; // menu toggle

/**
 * Initialize editing for an existing recipe
 */
export async function initEdit(recipeId) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);

  if (!recipe) {
    location.assign('/index.html');
    return;
  }


  // Save current recipe to localStorage for editing
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));

  // Orchestration: call helpers
  populateFields(recipe);
  wireFieldListeners(recipeId);

  listDirections(recipe.directions);
  setupDirections(recipeId);

  setupTagsUI(recipeId, recipe);

  await listIngredients(recipeId);
  setupIngredientDelegation(recipeId);

  // Wire up the Add Ingredient button
  const addBtn = document.getElementById('add-an-ingredient');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addIngredient(recipeId);
    });
  }

  setupFeatureImage(recipe);

  // Pass both recipeId and article content into editor
  setupEditor(recipeId, recipe.article || recipe.articleHTML || '');

  setupRecipeDeletion(recipe);
  setupSaveButton(recipe);
  setupUpdateDatabase();

  setupAccessibility();
  hamburger(); // menu toggle
}

/**
 * Initialize creation of a new recipe
 */
export async function initCreate() {
  const recipes = await loadRecipes();

  // Generate new recipe object
  const newRecipe = {
    id: uuidv4(),
    name: "New unnamed recipe",
    prepTime: "",
    description: "",
    author: "anonymous",
    directions: [],
    tags: [],
    categories: [],
    prepTime: "",
    article: "",
    ingredients: [],
    photoURL: "",
    photographer: "",
    photographerLink: ""
  };

  // Push into recipes and save
  recipes.push(newRecipe);
  saveRecipes(recipes);

  // Save to localStorage for editing
  localStorage.setItem('editingRecipe', JSON.stringify(newRecipe));

  // Orchestration: call helpers
  populateFields(newRecipe);
  wireFieldListeners(newRecipe.id);

  listDirections(newRecipe.directions);
  setupDirections(newRecipe.id);

  await listIngredients(newRecipe.id);
  setupIngredientDelegation(newRecipe.id);

  setupFeatureImage(newRecipe);
  

  // Pass both recipeId and article content into editor
  setupEditor(newRecipe.id, newRecipe.article || '');

  setupRecipeDeletion(newRecipe);
  setupSaveButton(newRecipe);
  setupUpdateDatabase();

  setupAccessibility();
  hamburger(); // menu toggle
}

// Bootstrapping
const recipeId = location.hash.substring(1);
const previewButton = document.getElementById('preview-link');
previewButton.setAttribute('href',`article.html#${recipeId}`);
 
if (recipeId) {
  initEdit(recipeId);
} else {
  initCreate();
}
