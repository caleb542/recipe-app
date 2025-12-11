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


import { initAuth0, isAuthenticated, getUser } from './auth/auth0.js';
import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { setupPreview } from './helpers/preview.js'
import { initStatusToggle, getCurrentPublishedState } from './helpers/statusToggle.js'



// Initialize auth
await initAuth0();
await updateAuthUI();
setupAuthListeners();

// Protect this page - must be logged in to edit
const authenticated = await isAuthenticated();
if (!authenticated) {
  alert('Please log in to edit recipes');
  window.location.href = '/index.html';
}
/**
 * Initialize editing for an existing recipe
 */

// Bootstrapping
const recipeId = location.hash.substring(1); 

export async function initEdit(recipeId) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);

  if (!recipe) {
    location.assign('/index.html');
    return;
  }

// Get current user (already authenticated at top of file)
  const currentUser = await getUser();
  const currentUserId = currentUser.sub;

   // ✅ Check ownership (matching your article.js logic)
  const isAuthor = recipe.author?.auth0Id === currentUserId;
  const isLegacy = !recipe.author || recipe.author?.name === "Legacy User";

  if (!isAuthor && !isLegacy) {
    // Not the author and not a legacy recipe
    alert('You can only edit recipes you created');
    location.assign(`/article.html#${recipeId}`);
    return;
  }

  // ✅ If legacy recipe, claim it
 if (isLegacy) {

  console.log('📝 Claiming legacy recipe for user:', currentUserId);
  recipe.author = {
    auth0Id: currentUserId,
    name: currentUser.name,
    email: currentUser.email
  };
  
  // ✅ Keep existing displayAuthor if it exists, otherwise use Auth0 name
  if (!recipe.displayAuthor) {
    recipe.displayAuthor = recipe.author?.name || currentUser.name;
  }
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

      setupPreview(recipeId);
      initStatusToggle()
}

/**
 * Initialize creation of a new recipe
 */
export async function initCreate() {
  const currentUser = await getUser();
  
  const recipes = await loadRecipes();

  const newRecipe = {
    id: uuidv4(),
    name: "New unnamed recipe",
    prepTime: "",
    totalTime: "",
    description: "",
    author: {
      auth0Id: currentUser.sub,
      name: currentUser.name,
      email: currentUser.email
    },
    displayAuthor: currentUser.name, // ✅ Default to Auth0 name, but editable
    isPublic: false,
    directions: [],
    tags: [],
    categories: [],
    article: "",
    ingredients: [],
    photoURL: "",
    photographer: "",
    photographerLink: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  location.hash = newRecipe.id;
  recipes.push(newRecipe);
  saveRecipes(recipes);
  localStorage.setItem('editingRecipe', JSON.stringify(newRecipe));

  // ... rest of your initialization


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


const previewButton = document.getElementById('preview-link');
// previewButton.setAttribute('href',`article.html#${recipeId}`);
 
if (recipeId) {
  initEdit(recipeId);
} else {
  initCreate();
}


