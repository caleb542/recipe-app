// /src/styles/edit-form.scss
import './styles/_edit-form.scss';
import { setupEditModal } from './helpers/editModal.js';

// /src/edit.js - Entry point for Recipe Editor
import { v4 as uuidv4 } from 'uuid';
import { loadRecipes, saveRecipes, hideWarning } from './functions.js';
import { showQuickAddModal } from './helpers/quickAdd.js';
import '@toast-ui/editor/dist/toastui-editor.css';
import { initProgressBar, updateProgress } from './helpers/editProgressBar.js';

// Helpers
import { populateFields, wireFieldListeners, loadCategories } from './helpers/fields.js';
import { listDirections, setupDirections } from './helpers/directions.js';
import { setupTagsUI } from './helpers/tagsUI.js';
import { listIngredients, setupIngredientDelegation, addIngredient } from './helpers/ingredients.js';
import { setupFeatureImage } from './helpers/featureImage.js';
import { setupEditor } from './helpers/editor.js';
import { setupRecipeDeletion, setupSaveButton, setupUpdateDatabase } from './helpers/actions.js';
import { setupAccessibility } from './helpers/accessibility.js';
import { hamburger } from './functions.js'; // menu toggle
import { setupImageGallery, renderImageGallery } from './helpers/imageGallery.js';

import { initAuth0, isAuthenticated, getUser } from './auth/auth0.js';
import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { loadUserProfile, getUserProfile } from './userContext.js';
import { canEditRecipe } from './auth/roles.js';

import { setupPreview } from './helpers/preview.js'
import { initStatusToggle, getCurrentPublishedState } from './helpers/statusToggle.js'
import { listVideos, setupVideoDelegation, setupVideoInput, addVideo, removeVideo } from './helpers/videoHelper.js';
import { loadHeader, showDevNotice } from './components/HeaderComponent.js';
import { initImpersonationBanner } from './components/ImpersonationBanner.js';

import {
  updateCategoriesSummary,
  updateTagsSummary,
  updateArticleSummary,
  setupAccordion,
  setupQuickAddCard,
  setupRestoreBanner,
  setupDescriptionCounter,
  markUnsaved,
  markSaved,
  updateIdentitySummary,
  updateIngredientsSummary,
  updateDirectionsSummary,
  updateImagesSummary,
  updateDescriptionSummary,
  updateEditorialSummary
} from './helpers/editAccordion.js';

loadHeader();

// Edit page always needs fresh data — clear the cache timestamp
localStorage.removeItem('recipes_timestamp');

// Initialize auth
await initAuth0();
await loadUserProfile();
await updateAuthUI();
setupAuthListeners();
initImpersonationBanner();
setUrlBase();

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
/**
 * Set dynamic URL base based on environment
 */
function setUrlBase() {
  const urlBaseElement = document.getElementById('url-base');
  if (urlBaseElement) {
    // Use current origin (e.g., http://localhost:8080 or https://recipeme.com)
    const origin = window.location.origin;
    urlBaseElement.textContent = `${origin}/`;
  }
}

export async function initEdit(recipeId) {
  const recipes = await loadRecipes();
  
hideWarning();
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
  const userProfile = getUserProfile();
  const isLegacy = !recipe.author || recipe.author?.name === "Legacy User";

  if (!isLegacy && !canEditRecipe(userProfile, recipe)) {
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
  await loadCategories(recipe.categories || []);
  populateFields(recipe);
  setupSlugEditor(recipe, currentUser)

  // setupAccordion();
  setupEditModal();
  setupQuickAddCard(true);
  setupRestoreBanner(recipeId);
  setupDescriptionCounter();

  updateIdentitySummary(recipe);
  updateDescriptionSummary(recipe.description);
  updateImagesSummary(recipe.images || []);
  updateIngredientsSummary(recipe.ingredients || []);
  updateDirectionsSummary(recipe.directions || []);
  updateEditorialSummary(recipe);
  updateCategoriesSummary(recipe.categories || []);
  updateTagsSummary(recipe.tags || []);
  updateArticleSummary(recipe.article || recipe.articleHTML || '');


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
    setupImageGallery(recipeId);
  // setupCloudinaryUpload(recipeId); // NEW - Cloudinary upload
  // initImagePreview(recipe);         // NEW - Initialize preview

  // Pass both recipeId and article content into editor
  setupEditor(recipeId, recipe.article || recipe.articleHTML || '');
  const editorInstance = window.editorInstance; // If you're storing it globally

window._videoModalInit = () => {
  listVideos(recipeId);
  setupVideoDelegation(recipeId);
  setupVideoInput(recipeId);

  const addBtn = document.getElementById('add-video-btn');
  if (addBtn && !addBtn.dataset.bound) {
    addBtn.dataset.bound = 'true';
    addBtn.addEventListener('click', () => addVideo(recipeId));
  }
};

  setupRecipeDeletion(recipe);
  setupSaveButton(recipe);
  setupUpdateDatabase();

  setupAccessibility();
  hamburger(); // menu toggle

  setupPreview(recipeId);
  initStatusToggle();
  initProgressBar(recipe);
}

/**
 * Initialize creation of a new recipe
 */
export async function initCreate() {
  const currentUser = await getUser();
  const recipes = await loadRecipes();
  const newRecipeId = uuidv4();

  const rawName = currentUser.name || currentUser.nickname || '';
  const safeName = rawName.includes('@') ? '' : rawName;

  const newRecipe = {
    id: newRecipeId,
    name: "New unnamed recipe",
    prepTime: "",
    totalTime: "",
    description: "",
    author: {
      auth0Id: currentUser.sub,
      name: safeName,
    },
    displayAuthor: safeName,
    isPublic: false,
    directions: [],
    tags: [],
    categories: [],
    article: "",
    ingredients: [],
    images: [],
    videos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  location.hash = newRecipe.id;
  recipes.push(newRecipe);
  saveRecipes(recipes);
  localStorage.setItem('editingRecipe', JSON.stringify(newRecipe));

  // Setup editor before modal opens
  setupEditor(newRecipeId, newRecipe.article || '');

  // Show Quick Add modal
  showQuickAddModal(newRecipeId);

  // Setup edit page
  setupEditModal();
  setupQuickAddCard(true);
  setupRestoreBanner(newRecipeId);
  setupDescriptionCounter();

  await loadCategories(newRecipe.categories || []);
  populateFields(newRecipe);
  setupSlugEditor(newRecipe, currentUser);

  updateIdentitySummary(newRecipe);
  updateDescriptionSummary(newRecipe.description);
  updateImagesSummary(newRecipe.images || []);
  updateIngredientsSummary(newRecipe.ingredients || []);
  updateDirectionsSummary(newRecipe.directions || []);
  updateEditorialSummary(newRecipe);
  updateCategoriesSummary(newRecipe.categories || []);
  updateTagsSummary(newRecipe.tags || []);
  updateArticleSummary(newRecipe.article || '');

  wireFieldListeners(newRecipe.id);

  listDirections(newRecipe.directions);
  setupDirections(newRecipe.id);
  setupTagsUI(newRecipeId, newRecipe);

  await listIngredients(newRecipeId);
  setupIngredientDelegation(newRecipeId);

  setupFeatureImage(newRecipe);
  setupImageGallery(newRecipeId);

  window._videoModalInit = () => {
    listVideos(newRecipeId);
    setupVideoDelegation(newRecipeId);
    setupVideoInput(newRecipeId);
    const addBtn = document.getElementById('add-video-btn');
    if (addBtn && !addBtn.dataset.bound) {
      addBtn.dataset.bound = 'true';
      addBtn.addEventListener('click', () => addVideo(newRecipeId));
    }
  };

  setupRecipeDeletion(newRecipe);
  setupSaveButton(newRecipe);
  setupUpdateDatabase();
  setupAccessibility();
  hamburger();

  setupPreview(newRecipeId);
  initStatusToggle();
  initProgressBar(newRecipe);
}

/**
 * Generate a URL-safe slug from text
 */
function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
}

// Add slug editor
function setupSlugEditor(recipe) {
  const slugInput = document.getElementById('recipe-slug');
  const slugFeedback = document.getElementById('slug-feedback');
  
  if (!slugInput) return;


  // ✅ Populate with existing slug if editing saved recipe
  if (recipe.fullSlug) {
    // ✅ NEW: Strip username prefix if it exists
    let cleanSlug = recipe.fullSlug;
    
    // Remove old format: "username/slug" or "@username/slug" → "slug"
    if (cleanSlug.includes('/')) {
      cleanSlug = cleanSlug.split('/').pop(); // Get part after last slash
    }
    
    slugInput.value = cleanSlug;
  } else if (recipe.slug) {
    // Same cleanup for slug field
    let cleanSlug = recipe.slug;
    if (cleanSlug.includes('/')) {
      cleanSlug = cleanSlug.split('/').pop();
    }
    slugInput.value = cleanSlug;
  }
  
  let checkTimeout;
  
  slugInput.addEventListener('input', (e) => {

    // ✅ Auto-generate slug when recipe name changes (if slug is empty)
    const recipeNameInput = document.getElementById('recipe-name');
    if (recipeNameInput) {
      recipeNameInput.addEventListener('blur', () => {
        if (!slugInput.value && recipeNameInput.value) {
          const generatedSlug = generateSlug(recipeNameInput.value);
          slugInput.value = generatedSlug;
          slugInput.dispatchEvent(new Event('input')); // Trigger validation
        }
      });
    }

    clearTimeout(checkTimeout);
   let slug = e.target.value.toLowerCase();
    
    // ✅ If empty, auto-generate from recipe name
    if (!slug) {
      const recipeNameInput = document.getElementById('recipe-name');
      if (recipeNameInput && recipeNameInput.value) {
        slug = generateSlug(recipeNameInput.value);
        slugInput.value = slug;
        
        if (!slug) {
          slugFeedback.textContent = '⚠️ Recipe name needed to generate slug';
          slugFeedback.className = 'slug-feedback warning';
          return;
        }
      } else {
        slugFeedback.textContent = '⚠️ Enter a recipe name first';
        slugFeedback.className = 'slug-feedback warning';
        return;
      }
    }
    
    // Debounce availability check
   // ✅ Check availability in localStorage (no DB call)
    checkTimeout = setTimeout(async () => {
      const recipes = await loadRecipes();
      const slugTaken = recipes.some(r => 
        r.id !== recipe.id && 
        (r.fullSlug === slug || r.slug === slug)
      );
      
      if (slugTaken) {
        slugFeedback.textContent = '❌ This slug is already in use';
        slugFeedback.className = 'slug-feedback error';
      } else {
        slugFeedback.textContent = '✅ Available!';
        slugFeedback.className = 'slug-feedback success';
      }
    }, 500);
  });
}

const previewButton = document.getElementById('preview-link');
 
if (recipeId) {
  initEdit(recipeId);
} else {
  initCreate();
}