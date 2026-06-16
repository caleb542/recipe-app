/**
 * Quick Add - Import recipes from URL or pasted text
 */

import { loadRecipes, saveRecipes } from '../functions.js';
import { populateFields } from './fields.js';
import { listDirections } from './directions.js';
import { listIngredients } from './ingredients.js';
import { parseRecipeText } from './ingredientParser.js';
import {
  updateIdentitySummary,
  updateDescriptionSummary,
  updateIngredientsSummary,
  updateDirectionsSummary,
  updateEditorialSummary,
  markUnsaved
} from './editAccordion.js';

// Polyfill for crypto.randomUUID if not available
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Show Quick Add modal when creating new recipe
 */
export function showQuickAddModal(recipeId) {
  const modal = document.createElement('dialog');
  modal.id = 'quick-add-modal';
  modal.className = 'modal-dialog quick-add-modal';

  modal.innerHTML = `
    <div class="quick-add-modal-content">
      <button class="modal-close" aria-label="Close">&times;</button>
      <h2>Add a recipe</h2>
      <p class="modal-subtitle">How would you like to start?</p>

      <div class="quick-add-options">
        <button class="quick-add-option" data-method="manual">
          <i class="fa-solid fa-pencil"></i>
          <div>
            <strong>Type it in</strong>
            <span>Fill in the form manually</span>
          </div>
        </button>

        <button class="quick-add-option" data-method="url">
          <i class="fa-solid fa-link"></i>
          <div>
            <strong>Import from URL</strong>
            <span>Paste a link from any recipe site</span>
          </div>
        </button>

        <button class="quick-add-option" data-method="text">
          <i class="fa-solid fa-clipboard"></i>
          <div>
            <strong>Paste as text</strong>
            <span>Already have the text? Drop it in</span>
          </div>
        </button>

        <button class="quick-add-option quick-add-option--featured" data-method="photo">
          <i class="fa-solid fa-camera"></i>
          <div>
            <strong>Upload or snap photos</strong>
            <span>Cards, pages, or a cookbook</span>
          </div>
        </button>
      </div>

      <div class="quick-add-input-area" hidden>
        <textarea id="quick-add-textarea" rows="8" placeholder=""></textarea>
        <button id="parse-recipe-btn" class="btn-primary">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          Import Recipe
        </button>
      </div>

      <div id="parse-status" class="parse-status"></div>

      <div class="quick-add-footer">
        <small>⚠️ Only import recipes you have permission to use</small>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.showModal();

  // Close
  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.close();
    modal.remove();
  });

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { modal.close(); modal.remove(); }
  });

  // Option selection
  modal.querySelectorAll('.quick-add-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const method = btn.dataset.method;
      const inputArea = modal.querySelector('.quick-add-input-area');
      const textarea = document.getElementById('quick-add-textarea');

      if (method === 'manual') {
        modal.close();
        modal.remove();
        return;
      }

      if (method === 'photo') {
        // TODO: photo upload flow
        modal.close();
        modal.remove();
        return;
      }

      // URL or text
      inputArea.hidden = false;
      textarea.placeholder = method === 'url'
        ? 'Paste a recipe URL (e.g. https://allrecipes.com/recipe/...)'
        : 'Paste the full recipe text here...';
      textarea.focus();

      // Highlight selected option
      modal.querySelectorAll('.quick-add-option').forEach(o => o.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
  });

  // Parse
  document.getElementById('parse-recipe-btn').addEventListener('click', async () => {
    const input = document.getElementById('quick-add-textarea').value;
    await handleQuickAdd(input, recipeId, modal);
  });
}

/**
 * Handle Quick Add - detects URL vs text and parses accordingly
 */
async function handleQuickAdd(input, recipeId, modal) {
  const statusDiv = document.getElementById('parse-status');
  const parseBtn = document.getElementById('parse-recipe-btn');

  if (!input.trim()) {
    statusDiv.innerHTML = '<p class="error">❌ Please paste a URL or recipe text</p>';
    return;
  }

  const isURL = input.trim().match(/^https?:\/\//);

  console.log('🚀 Starting Quick Add:', isURL ? 'URL' : 'Text');

  try {
    parseBtn.disabled = true;
    parseBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Parsing...';
    statusDiv.innerHTML = '<p class="loading">⏳ Parsing recipe...</p>';

    let parsedRecipe;

    if (isURL) {
      statusDiv.innerHTML = '<p class="loading">⏳ Fetching recipe from URL...</p>';
      console.log('📡 Calling import-recipe function...');
      parsedRecipe = await importFromURL(input.trim());
      console.log('✅ Received parsed recipe:', parsedRecipe);
    } else {
      statusDiv.innerHTML = '<p class="loading">⏳ Parsing recipe text...</p>';
      console.log('📄 Parsing text...');
      parsedRecipe = parseRecipeText(input);
      console.log('✅ Parsed recipe:', parsedRecipe);
    }

    // Strip site name suffixes from title — applies to both URL and text imports
    if (parsedRecipe.name) {
      parsedRecipe.name = parsedRecipe.name
        .replace(/\s*[-–|]\s*[^-–|]{3,50}$/, '')
        .trim();
    }

    console.log('📝 Populating form...');
    await populateParsedRecipe(parsedRecipe, recipeId);
    console.log('✅ Form populated');

    modal.close();
    modal.remove();

    showSuccessNotification(parsedRecipe);

  } catch (error) {
    console.error('❌ Parse error:', error);
    statusDiv.innerHTML = `<p class="error">❌ ${error.message}</p>`;
    parseBtn.disabled = false;
    parseBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Import Recipe';
  }
}

/**
 * Import recipe from URL (schema.org extraction)
 */
async function importFromURL(url) {
  const response = await fetch('/.netlify/functions/import-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Could not import from this URL');
  }

  const data = await response.json();
  console.log('🕐 Raw import response:', JSON.stringify(data, null, 2));
  return data;
}

/**
 * Populate form with parsed recipe data
 */
async function populateParsedRecipe(parsedRecipe, recipeId) {
  const raw = localStorage.getItem('recipes');
  const parsed = JSON.parse(raw || '[]');
  console.log('📦 Raw localStorage recipe count:', parsed.length);
  console.log('📦 Recipe IDs in localStorage:', parsed.map(r => r.id));

  console.log('📝 Populating form with parsed recipe:', parsedRecipe);

  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);

  if (!recipe) {
    console.error('❌ Recipe not found in localStorage:', recipeId);
    return;
  }

  console.log('✅ Found recipe to update:', recipe.id);

  // Update recipe object
  if (parsedRecipe.name) {
    recipe.name = parsedRecipe.name;

    // Generate and set slug from parsed name
    const slug = parsedRecipe.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
    recipe.slug = slug;
    recipe.fullSlug = slug;

    // Update slug input field if empty or default
    const slugInput = document.getElementById('recipe-slug');
    if (slugInput && (!slugInput.value || slugInput.value === 'new-unnamed-recipe')) {
      slugInput.value = slug;
    }
  }

  if (parsedRecipe.description) recipe.description = parsedRecipe.description;
  if (parsedRecipe.prepTime) recipe.prepTime = parsedRecipe.prepTime;
  if (parsedRecipe.totalTime) recipe.totalTime = parsedRecipe.totalTime;
  if (parsedRecipe.sourceUrl) recipe.sourceUrl = parsedRecipe.sourceUrl;
  if (parsedRecipe.servings) recipe.servings = parsedRecipe.servings;
  if (parsedRecipe.notes) recipe.notes = parsedRecipe.notes;

  // Add ingredients (deduplicated)
  if (parsedRecipe.ingredients?.length) {
    const seen = new Set();
    recipe.ingredients = parsedRecipe.ingredients.filter(ing => {
      const key = `${ing.amount}|${ing.unit}|${ing.name}`.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    console.log('📋 Adding', recipe.ingredients.length, 'ingredients (deduplicated from', parsedRecipe.ingredients.length, ')');
  }

  // Add directions
  if (parsedRecipe.directions?.length) {
    console.log('📝 Adding', parsedRecipe.directions.length, 'directions');
    recipe.directions = parsedRecipe.directions;
  }

  // Add source attribution if from URL
  if (parsedRecipe.sourceUrl) {
    recipe.article = `<p><em>Source: <a href="${parsedRecipe.sourceUrl}" target="_blank">${parsedRecipe.sourceUrl}</a></em></p>\n\n`;
  }

  console.log('💾 Saving updated recipe:', recipe);

  // Save to localStorage and recipes
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
  saveRecipes(recipes);

  // Populate form fields
  populateFields(recipe);

  const featureKeyword = document.getElementById('feature-keyword');
    if (featureKeyword && recipe.name) {
    featureKeyword.value = recipe.name;
    }

  updateIdentitySummary(recipe);
  updateDescriptionSummary(recipe.description || '');
  updateIngredientsSummary(recipe.ingredients || []);
  updateDirectionsSummary(recipe.directions || []);
  updateEditorialSummary(recipe);
  markUnsaved();
  listDirections(recipe.directions);
  await listIngredients(recipeId);

  // If there's article content, update editor
  if (window.editorInstance && recipe.article) {
    window.editorInstance.setMarkdown(recipe.article);
  }
}

/**
 * Show success notification
 */
function showSuccessNotification(recipe) {
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fa-solid fa-circle-check"></i>
      <div>
        <strong>Recipe imported!</strong>
        <p>Review and edit as needed. ${recipe.ingredients?.length || 0} ingredients and ${recipe.directions?.length || 0} steps imported.</p>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}