import { deleteRecipeFromDatabase } from '../backend/deleteRecipeFromDatabase.js';
import { updateRecipeInDatabase } from '../backend/updateRecipeInDatabase.js';
import { loadRecipesFromLocalStorage } from '../functions.js';
import { Notyf } from 'notyf';

const notyf = new Notyf();

/**
 * Setup recipe deletion button
 */
function setupRecipeDeletion(recipe) {
  const deleteBtn = document.getElementById('remove-recipe');
  if (!deleteBtn) return;

  deleteBtn.addEventListener('click', async e => {
    e.preventDefault();
    try {
      await deleteRecipeFromDatabase(recipe);
      notyf.success("Recipe deleted!");
      setTimeout(() => (window.location.href = '/'), 2000);
    } catch (err) {
      console.error("❌ Delete failed:", err);
      notyf.error("Failed to delete recipe.");
    }
  });
}

/**
 * Setup save button (local + DB update)
 */
function setupSaveButton(recipe) {
  const saveBtn = document.getElementById('save-button');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    let recipe = await JSON.parse(localStorage.getItem('editingRecipe'));
    
    const updates = {
      name: recipe.name || '',
      article: recipe.article || '',
      createdAt: recipe.createdAt || '',
      author: recipe.author || '',
      displayAuthor: recipe.displayAuthor || '',
      description: recipe.description || '',
      tags: recipe.tags || [],
      prepTime: recipe.prepTime || '',
      totalTime: recipe.totalTime || '',
      categories: recipe.categories || [],
      ingredients: recipe.ingredients || [],
      directions: recipe.directions || [],
      
      // NEW: Save images array instead of single photoURL
      images: recipe.images || [],
      
      // REMOVE old single-image fields:
      // photoURL: recipe.photoURL || '',
      // photographer: recipe.photographer || '',
      // photographerLink: recipe.photographerLink || ''
    };

    if (!recipe || !recipe.id) {
      notyf.error("Recipe not ready to save.");
      return;
    }

    try {
      const result = await updateRecipeInDatabase(recipe.id, updates);
      localStorage.setItem('editingRecipe', JSON.stringify(result.recipe));
      
      notyf.success("Recipe updated!");

      setTimeout(() => {
        window.location.href = `/article.html#${recipe.id}`;
      }, 2000);
    } catch (err) {
      console.error("❌ Update failed:", err);
      notyf.error("Failed to update recipe.");
    }
  });
}

/**
 * Setup "Update Database" nav link
 */
function setupUpdateDatabase() {
  const updateOne = document.getElementById('update-one');
  if (!updateOne) return;

  updateOne.addEventListener('click', e => {
    e.preventDefault();
    try {
      updateRecipeInDatabase();
      notyf.success("Database updated!");
    } catch (err) {
      console.error("❌ Database update failed:", err);
      notyf.error("Failed to update database.");
    }
  });
}

export {
  setupRecipeDeletion,
  setupSaveButton,
  setupUpdateDatabase
}