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
 * Show Quick Add modal
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
            <strong>Scan pages or cards</strong>
            <span>Photograph a cookbook, recipe card, or printout</span>
          </div>
        </button>
        
        <button class="quick-add-option" data-method="manual">
          <i class="fa-solid fa-pencil"></i>
          <div>
            <strong>Type it in</strong>
            <span>Fill in the form manually</span>
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

  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.close();
    modal.remove();
  });

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { modal.close(); modal.remove(); }
  });

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
        showPhotoUploadScreen(modal, recipeId);
        return;
      }

      inputArea.hidden = false;
      textarea.placeholder = method === 'url'
        ? 'Paste a recipe URL (e.g. https://allrecipes.com/recipe/...)'
        : 'Paste the full recipe text here...';
      textarea.focus();

      modal.querySelectorAll('.quick-add-option').forEach(o => o.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
  });

  document.getElementById('parse-recipe-btn').addEventListener('click', async () => {
    const input = document.getElementById('quick-add-textarea').value;
    await handleQuickAdd(input, recipeId, modal);
  });
}

/**
 * Photo upload screen
 */
function showPhotoUploadScreen(modal, recipeId) {
  const content = modal.querySelector('.quick-add-modal-content');
  const photos = [];
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  content.innerHTML = `
    <button class="modal-close" aria-label="Close">&times;</button>
    <button class="quick-add-back" aria-label="Back">
      <i class="fa-solid fa-arrow-left"></i> Back
    </button>
    <h2>Scan pages or cards</h2>
    <p class="modal-subtitle">Snap pages one at a time or select multiple files. Drag to reorder.</p>

    <div class="photo-upload-grid" id="photo-grid"></div>

    <div class="photo-add-btns">
      ${isMobile ? `
        <label class="photo-add-btn">
          <i class="fa-solid fa-camera"></i> Snap a page
          <input
            type="file"
            id="photo-file-input-camera"
            accept="image/*"
            capture="environment"
            style="display:none"
          >
        </label>
      ` : ''}

      <label class="photo-add-btn">
        <i class="fa-solid fa-images"></i> Select files to scan
        <input
          type="file"
          id="photo-file-input-library"
          accept="image/*"
          multiple
          style="display:none"
        >
      </label>
    </div>

    <div id="photo-upload-status" class="parse-status"></div>

    <button class="btn-primary" id="photo-extract-btn" disabled>
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      Extract text from photos
    </button>

    <div class="quick-add-footer">
      <small>⚠️ Only import recipes you have permission to use</small>
    </div>
  `;

  content.querySelector('.modal-close').addEventListener('click', () => {
    modal.close();
    modal.remove();
  });

  content.querySelector('.quick-add-back').addEventListener('click', () => {
    showQuickAddModal.__reopen?.(modal, recipeId);
  });

  const grid = content.querySelector('#photo-grid');
  const extractBtn = content.querySelector('#photo-extract-btn');
  const statusDiv = content.querySelector('#photo-upload-status');

  function renderGrid() {
    grid.innerHTML = photos.map((p, i) => `
      <div class="photo-thumb" data-index="${i}">
        <div class="photo-thumb__num">${i + 1}</div>
        <img src="${p.objectUrl}" alt="Photo ${i + 1}">
        <button class="photo-thumb__remove" data-index="${i}" aria-label="Remove photo ${i + 1}">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `).join('');

    grid.querySelectorAll('.photo-thumb__remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        URL.revokeObjectURL(photos[idx].objectUrl);
        photos.splice(idx, 1);
        renderGrid();
        extractBtn.disabled = photos.length === 0;
      });
    });

    extractBtn.disabled = photos.length === 0;
  }

  if (isMobile) {
    content.querySelector('#photo-file-input-camera').addEventListener('change', (e) => {
      Array.from(e.target.files).forEach(file => {
        photos.push({ file, objectUrl: URL.createObjectURL(file), cloudinaryUrl: null });
      });
      renderGrid();
      e.target.value = '';
    });
  }

  content.querySelector('#photo-file-input-library').addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(file => {
      photos.push({ file, objectUrl: URL.createObjectURL(file), cloudinaryUrl: null });
    });
    renderGrid();
    e.target.value = '';
  });

  extractBtn.addEventListener('click', async () => {
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
    statusDiv.innerHTML = '<p class="loading">⏳ Uploading photos...</p>';

    try {
      for (let i = 0; i < photos.length; i++) {
        statusDiv.innerHTML = `<p class="loading">⏳ Uploading photo ${i + 1} of ${photos.length}...</p>`;
        const formData = new FormData();
        formData.append('file', photos[i].file);
        formData.append('upload_preset', 'recipe_sources');
        formData.append('folder', 'recipe-sources');
        formData.append('tags', 'recipe-source');

        const res = await fetch(`https://api.cloudinary.com/v1_1/day1f5nz8/image/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        photos[i].cloudinaryUrl = data.secure_url;
      }

      statusDiv.innerHTML = '<p class="loading">⏳ Reading text from photos...</p>';
      let combinedText = '';

      for (let i = 0; i < photos.length; i++) {
        statusDiv.innerHTML = `<p class="loading">⏳ Reading photo ${i + 1} of ${photos.length}...</p>`;
        const res = await fetch('/.netlify/functions/ocr-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: photos[i].cloudinaryUrl })
        });
        const data = await res.json();
        if (data.text) combinedText += data.text + '\n\n';
      }

      if (!combinedText.trim()) {
        throw new Error('Could not extract any text from the photos');
      }

      showOCRReviewScreen(modal, recipeId, combinedText.trim(), photos);

    } catch (error) {
      statusDiv.innerHTML = `<p class="error">❌ ${error.message}</p>`;
      extractBtn.disabled = false;
      extractBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Extract text from photos';
    }
  });
}

/**
 * OCR review screen
 */
function showOCRReviewScreen(modal, recipeId, extractedText, photos) {
  const content = modal.querySelector('.quick-add-modal-content');

  content.innerHTML = `
    <button class="modal-close" aria-label="Close">&times;</button>
    <h2>Review extracted text</h2>
    <p class="modal-subtitle">Edit anything that looks wrong, then import.</p>

    <div class="ocr-review-grid">
      <div class="ocr-review-original">
        <p class="ocr-review-label">Original</p>
        <img src="${photos[0].objectUrl}" alt="Recipe photo">
        ${photos.length > 1 ? `<p class="ocr-review-more">+${photos.length - 1} more photo${photos.length > 2 ? 's' : ''}</p>` : ''}
      </div>
      <div class="ocr-review-text">
        <p class="ocr-review-label">Extracted text</p>
        <textarea id="ocr-text-area" rows="12">${extractedText}</textarea>
      </div>
    </div>

    <div id="ocr-status" class="parse-status"></div>

    <div class="ocr-review-actions">
      <button class="btn-secondary" id="ocr-back-btn">Back</button>
      <button class="btn-primary" id="ocr-import-btn">
        <i class="fa-solid fa-wand-magic-sparkles"></i>
        Import to recipe
      </button>
    </div>

    <div class="quick-add-footer">
      <small>⚠️ Only import recipes you have permission to use</small>
    </div>
  `;

  content.querySelector('.modal-close').addEventListener('click', () => {
    modal.close();
    modal.remove();
  });

  content.querySelector('#ocr-back-btn').addEventListener('click', () => {
    showPhotoUploadScreen(modal, recipeId);
  });

  content.querySelector('#ocr-import-btn').addEventListener('click', async () => {
    const text = content.querySelector('#ocr-text-area').value;
    const statusDiv = content.querySelector('#ocr-status');
    const importBtn = content.querySelector('#ocr-import-btn');

    importBtn.disabled = true;
    importBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importing...';

    try {
      const parsedRecipe = parseRecipeText(text);
      await populateParsedRecipe(parsedRecipe, recipeId);
      modal.close();
      modal.remove();
      showSuccessNotification(parsedRecipe);
    } catch (error) {
      statusDiv.innerHTML = `<p class="error">❌ ${error.message}</p>`;
      importBtn.disabled = false;
      importBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Import to recipe';
    }
  });
}

/**
 * Handle Quick Add - URL or text
 */
async function handleQuickAdd(input, recipeId, modal) {
  const statusDiv = document.getElementById('parse-status');
  const parseBtn = document.getElementById('parse-recipe-btn');

  if (!input.trim()) {
    statusDiv.innerHTML = '<p class="error">❌ Please paste a URL or recipe text</p>';
    return;
  }

  const isURL = input.trim().match(/^https?:\/\//);

  try {
    parseBtn.disabled = true;
    parseBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Parsing...';
    statusDiv.innerHTML = '<p class="loading">⏳ Parsing recipe...</p>';

    let parsedRecipe;

    if (isURL) {
      statusDiv.innerHTML = '<p class="loading">⏳ Fetching recipe from URL...</p>';
      parsedRecipe = await importFromURL(input.trim());
    } else {
      statusDiv.innerHTML = '<p class="loading">⏳ Parsing recipe text...</p>';
      parsedRecipe = parseRecipeText(input);
    }

    if (parsedRecipe.name) {
      parsedRecipe.name = parsedRecipe.name
        .replace(/\s*[-–|]\s*[^-–|]{3,50}$/, '')
        .trim();
    }

    await populateParsedRecipe(parsedRecipe, recipeId);
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
 * Import from URL
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
  return data;
}

/**
 * Populate form with parsed recipe data
 */
async function populateParsedRecipe(parsedRecipe, recipeId) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);

  if (!recipe) {
    console.error('❌ Recipe not found:', recipeId);
    return;
  }

  if (parsedRecipe.name) {
    recipe.name = parsedRecipe.name;
    const slug = parsedRecipe.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
    recipe.slug = slug;
    recipe.fullSlug = slug;

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

  if (parsedRecipe.ingredients?.length) {
    const seen = new Set();
    recipe.ingredients = parsedRecipe.ingredients.filter(ing => {
      const key = `${ing.amount}|${ing.unit}|${ing.name}`.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (parsedRecipe.directions?.length) {
    recipe.directions = parsedRecipe.directions;
  }

  if (parsedRecipe.sourceUrl) {
    recipe.article = `<p><em>Source: <a href="${parsedRecipe.sourceUrl}" target="_blank">${parsedRecipe.sourceUrl}</a></em></p>\n\n`;
  }

  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
  saveRecipes(recipes);

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
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}