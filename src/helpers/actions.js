import { deleteRecipeFromDatabase } from '../backend/deleteRecipeFromDatabase.js';
import { updateRecipeInDatabase } from '../backend/updateRecipeInDatabase.js';
import { loadRecipesFromLocalStorage } from '../functions.js';
import { Notyf } from 'notyf';
import { sanitizeHTML, sanitizeText } from '../utils/sanitize.js';
import { invalidateCategories } from '../functions.js';
const notyf = new Notyf();

/**
 * Show warning modal for incomplete recipes
 */
async function showIncompleteWarning(warnings) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.id = 'incomplete-recipe-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7); display: flex; align-items: center;
      justify-content: center; z-index: 9999;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #856404; margin-top: 0;">⚠️ Recipe Incomplete</h2>
        <p style="font-size: 1.1rem; margin: 1rem 0; color: #333;">
          Your recipe is missing: <strong style="color: #856404;">${sanitizeText(warnings.join(', '))}</strong>
        </p>
        <p style="color: #666; margin-bottom: 1.5rem;">
          Recipes without these fields may be confusing or incomplete for readers.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button id="cancel-save" style="padding: 0.75rem 1.5rem; background: #6c757d; 
                  color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;">
            Cancel
          </button>
          <button id="save-anyway" style="padding: 0.75rem 1.5rem; background: #ffc107; 
                  color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1rem;">
            Save Anyway
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#cancel-save').onclick = () => {
      document.body.removeChild(modal);
      resolve(false);
    };
    
    modal.querySelector('#save-anyway').onclick = () => {
      document.body.removeChild(modal);
      resolve(true);
    };
    
    // Allow clicking outside to cancel
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        resolve(false);
      }
    };
  });
}

/**
 * Generate URL-friendly slug from recipe name
 */
function generateSlug(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Setup recipe deletion button
 */

function setupRecipeDeletion(recipe) {
  const deleteBtn = document.getElementById('remove-recipe');
  if (!deleteBtn) {
    console.log('⚠️ Delete button not found');
    return;
  }

  console.log('✅ Delete button found, setting up listener');

  deleteBtn.addEventListener('click', async e => {
    e.preventDefault();
    
    // ✅ Add confirmation
    const confirmDelete = confirm(
      `Are you sure you want to delete "${recipe.name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) {
      console.log('Delete cancelled by user');
      return;
    }
    
    try {
      console.log('🗑️ Deleting recipe:', recipe.id);
      await deleteRecipeFromDatabase(recipe);

      // Clean up localStorage
  const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
  const updated = recipes.filter(r => r.id !== recipe.id);
  localStorage.setItem('recipes', JSON.stringify(updated));
  localStorage.removeItem('editingRecipe');
  localStorage.removeItem('recipes_timestamp'); // bust cache
  invalidateCategories(); // bust categories cache — deletion changes recipeCount
      notyf.success("Recipe deleted!");


      setTimeout(() => (window.location.href = '/'), 2000);
    } catch (err) {
      console.error("❌ Delete failed:", err);
      notyf.error(`Failed to delete recipe: ${err.message}`);
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

    // ✅ Validate recipe completeness
    const warnings = [];
    
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      warnings.push('ingredients');
    }
    
    if (!recipe.directions || recipe.directions.length === 0) {
      warnings.push('directions');
    }
    
    if (!recipe.images || recipe.images.length === 0) {
      warnings.push('images');
    }
    
    // ✅ Show warning if recipe is incomplete
    if (warnings.length > 0) {
      const shouldSave = await showIncompleteWarning(warnings);
      if (!shouldSave) {
        console.log('Save cancelled by user');
        return;
      }
    }
    

   // ✅ NEW: Read from slug input field (user may have customized it)
const slugInput = document.getElementById('recipe-slug');
const baseSlug = slugInput?.value || generateSlug(recipe.name || 'untitled');

console.log('💾 Slug being saved:', baseSlug);
    
    const updates = {
      name: recipe.name || '',
      article: window.toastEditor ? window.toastEditor.getMarkdown() : recipe.article || '',
      createdAt: recipe.createdAt || '',
      displayAuthor: (recipe.displayAuthor ?? '').trim(),
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
      videos: (recipe.videos || []).filter(v => v.url && v.url.trim() !== ''),
      isPublic: recipe.isPublic === true,
      // ✅ NEW: Include slug (backend will handle uniqueness)
      slug: baseSlug,
      fullSlug: baseSlug,  // Same as slug for simple format
    };

    if (!recipe || !recipe.id) {
      notyf.error("Recipe not ready to save.");
      return;
    }

    try {
      console.log('💾 displayAuthor being sent:', updates.displayAuthor);
      const result = await updateRecipeInDatabase(recipe.id, updates);
      localStorage.setItem('editingRecipe', JSON.stringify(result.recipe));
      invalidateCategories(); // bust categories cache — save may change cuisine/publish status

      notyf.success("Recipe updated!");

      // ✅ CHANGED: Redirect to new slug URL if available
      const redirectUrl = result.recipe?.fullSlug 
        ? `/article/${result.recipe.fullSlug}`
        : `/article.html#${recipe.id}`;

      setTimeout(() => {
        window.location.href = redirectUrl;
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