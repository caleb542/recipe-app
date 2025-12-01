import { updateLocalStorage, loadRecipes, saveRecipes } from '../functions.js';

/**
 * Populate the form fields with recipe data
 */
function populateFields(recipe) {
  document.getElementById('heading-name').textContent = recipe.name || '';
  document.getElementById('recipe-name').value = recipe.name || '';
  document.getElementById('recipe-description').value = recipe.description || '';
  document.getElementById('recipe-author').value = recipe.author || '';
  document.getElementById('recipe-prep-time').value = recipe.prepTime || '';

  // Categories (checkboxes)
  const categoryInputs = document.querySelectorAll('input[name="category"]');
  categoryInputs.forEach(input => {
    input.checked = Array.isArray(recipe.categories) && recipe.categories.includes(input.value);
  });

  // Tags (comma‑delimited textarea)
  const tagsInput = document.getElementById('recipe-tags');
  if (tagsInput) {
    tagsInput.value = Array.isArray(recipe.tags) ? recipe.tags.join(', ') : '';
  }

  // Toast UI editor content
  if (window.toastEditor) {
    window.toastEditor.setHTML(recipe.content || '');
  }
}


/**
 * Wire up listeners so changes to fields update localStorage
 */
function wireFieldListeners(recipeId) {
  const nameInput = document.getElementById('recipe-name');
  const descriptionInput = document.getElementById('recipe-description');
  const authorInput = document.getElementById('recipe-author');
  const prepTimeInput = document.getElementById('recipe-prep-time');
  const tagsInput = document.getElementById('recipe-tags');
  const categoryInputs = document.querySelectorAll('input[name="category"]');

  if (nameInput) {
    nameInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { name: e.target.value });
    });
  }

  if (descriptionInput) {
    descriptionInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { description: e.target.value });
    });
  }

  if (authorInput) {
    authorInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { author: e.target.value });
    });
  }

  if (prepTimeInput) {
    prepTimeInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { prepTime: e.target.value });
    });
  }

  // Tags textarea → split on commas
  if (tagsInput) {
    tagsInput.addEventListener('input', e => {
      const tagsArray = e.target.value
        .split(', ')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      updateLocalStorage(recipeId, { tags: tagsArray });
    });
  }

  // Categories checkboxes
  categoryInputs.forEach(input => {
    input.addEventListener('change', () => {
      const selectedCategories = Array.from(
        document.querySelectorAll('input[name="category"]:checked')
      ).map(cb => cb.value);
      updateLocalStorage(recipeId, { categories: selectedCategories });
    });
  });
}


/**
 * Update a recipe in localStorage by merging new field values
 */
async function updateRecipe(recipeId, updates) {
  let recipes = await loadRecipes();
  let recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) return;

  Object.assign(recipe, updates);
  saveRecipes(recipes);

  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
}

export {
  populateFields,
  updateRecipe,
  wireFieldListeners
}
