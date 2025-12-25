import { updateLocalStorage, loadRecipes, saveRecipes } from '../functions.js';

/**
 * Populate the form fields with recipe data
 */
function populateFields(recipe) {
  document.getElementById('heading-name').textContent = recipe.name || '';
  document.getElementById('recipe-name').value = recipe.name || '';
  document.getElementById('recipe-description').value = recipe.description || '';
  
  // ✅ Author - use displayAuthor or fallback to author.name
  const authorInput = document.getElementById('recipe-author');
  if (authorInput) {
    authorInput.value = recipe.displayAuthor || recipe.author?.name || '';
  }
  
  document.getElementById('recipe-prep-time').value = recipe.prepTime || '';
  document.getElementById('recipe-total-time').value = recipe.totalTime || '';

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
  // ✅ Validate recipeId
  if (!recipeId) {
    console.error('❌ wireFieldListeners called without recipeId');
    return;
  }

  console.log('🔌 Wiring field listeners for recipe:', recipeId);

  const nameInput = document.getElementById('recipe-name');
  const descriptionInput = document.getElementById('recipe-description');
  const authorInput = document.getElementById('recipe-author');
  const prepTimeInput = document.getElementById('recipe-prep-time');
  const totalTimeInput = document.getElementById('recipe-total-time');
  const tagsInput = document.getElementById('recipe-tags');
  const categoryInputs = document.querySelectorAll('input[name="category"]');

  // Name - updates as you type
  if (nameInput) {
    nameInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { name: e.target.value });
    });
  }

  // Description - updates as you type
  if (descriptionInput) {
    descriptionInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { description: e.target.value });
    });
  }

  // ✅ Author (Display Name) - updates as you type
  if (authorInput) {
    authorInput.addEventListener('input', e => {
      console.log('📝 Updating displayAuthor:', e.target.value);
      updateLocalStorage(recipeId, { displayAuthor: e.target.value });
    });
  }

  // Prep Time - updates as you type
  if (prepTimeInput) {
    prepTimeInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { prepTime: e.target.value });
    });
  }
  
  // Total Time - updates as you type
  if (totalTimeInput) {
    totalTimeInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { totalTime: e.target.value });
    });
  }

  // Tags textarea → split on commas
  if (tagsInput) {
    tagsInput.addEventListener('input', e => {
      const tagsArray = e.target.value
        .split(',')
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