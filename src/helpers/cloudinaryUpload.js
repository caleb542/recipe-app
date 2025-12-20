// src/helpers/cloudinaryUpload.js
import { loadRecipes, saveRecipes } from '../functions.js';

const CLOUDINARY_CLOUD_NAME = 'day1f5nz8';
const CLOUDINARY_UPLOAD_PRESET = 'recipe_images';

/**
 * Setup Cloudinary upload functionality
 * @param {string} recipeId - Current recipe ID
 */
export function setupCloudinaryUpload(recipeId) {
  const uploadInput = document.getElementById('cloudinary-upload');
  const removeBtn = document.getElementById('remove-image');
  
  if (!uploadInput) {
    console.warn('Cloudinary upload input not found');
    return;
  }

  // Handle file selection
  uploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showUploadStatus('Please select an image file', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showUploadStatus('Image must be smaller than 10MB', 'error');
      return;
    }

    // Show immediate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      updateImagePreview(e.target.result, 'uploading');
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    try {
      showUploadStatus('Uploading...', 'uploading');
      const cloudinaryUrl = await uploadToCloudinary(file);
      
      // Update preview with Cloudinary URL
      updateImagePreview(cloudinaryUrl, 'cloudinary');
      
      // Save to recipe
      await saveImageToRecipe(recipeId, cloudinaryUrl, 'cloudinary');
      
      showUploadStatus('✓ Upload successful!', 'success');
      
      // Clear input so same file can be uploaded again if needed
      uploadInput.value = '';
      
    } catch (error) {
      console.error('Upload failed:', error);
      showUploadStatus(`✗ Upload failed: ${error.message}`, 'error');
      
      // Revert preview on error
      const recipes = await loadRecipes();
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe?.photoURL) {
        updateImagePreview(recipe.photoURL, recipe.imageSource || 'unsplash');
      } else {
        clearImagePreview();
      }
    }
  });

  // Handle remove image
  if (removeBtn) {
    removeBtn.addEventListener('click', async () => {
      if (confirm('Remove this image?')) {
        await removeImageFromRecipe(recipeId);
        clearImagePreview();
        showUploadStatus('Image removed', 'success');
      }
    });
  }
}

/**
 * Upload file to Cloudinary
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} - Cloudinary URL
 */
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'recipes');
  formData.append('tags', 'recipe,user-upload');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  const data = await response.json();
  
  // Return optimized URL with transformations
  return data.secure_url.replace('/upload/', '/upload/q_auto,f_auto/');
}

/**
 * Update image preview in the UI
 * @param {string} url - Image URL
 * @param {string} source - Source of image ('cloudinary', 'unsplash', 'uploading')
 */
function updateImagePreview(url, source) {
  const previewImg = document.getElementById('preview-image');
  const imageCredit = document.getElementById('image-credit');
  const removeBtn = document.getElementById('remove-image');
  const previewContainer = document.getElementById('image-preview-container');

  if (!previewImg) return;

  previewImg.src = url;
  previewImg.style.display = 'block';
  
  if (previewContainer) {
    previewContainer.style.display = 'block';
  }

  // Update credit based on source
  if (imageCredit) {
    if (source === 'cloudinary' || source === 'uploading') {
      imageCredit.style.display = 'none';
    } else if (source === 'unsplash') {
      imageCredit.style.display = 'block';
      // Credit will be set by your existing Unsplash code
    }
  }

  // Show remove button
  if (removeBtn) {
    removeBtn.style.display = 'inline-block';
  }
}

/**
 * Clear image preview
 */
function clearImagePreview() {
  const previewImg = document.getElementById('preview-image');
  const imageCredit = document.getElementById('image-credit');
  const removeBtn = document.getElementById('remove-image');
  const previewContainer = document.getElementById('image-preview-container');

  if (previewImg) {
    previewImg.src = '';
    previewImg.style.display = 'none';
  }

  if (imageCredit) {
    imageCredit.style.display = 'none';
  }

  if (removeBtn) {
    removeBtn.style.display = 'none';
  }

  if (previewContainer) {
    previewContainer.style.display = 'none';
  }
}

/**
 * Save image URL to recipe
 * @param {string} recipeId - Recipe ID
 * @param {string} url - Image URL
 * @param {string} source - Image source ('cloudinary' or 'unsplash')
 */
async function saveImageToRecipe(recipeId, url, source) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);

  if (!recipe) return;

  recipe.photoURL = url;
  recipe.imageSource = source;
  
  // Clear Unsplash credits if using Cloudinary
  if (source === 'cloudinary') {
    recipe.photographer = '';
    recipe.photographerLink = '';
  }

  recipe.updatedAt = new Date().toISOString();
  
  saveRecipes(recipes);
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
}

/**
 * Remove image from recipe
 * @param {string} recipeId - Recipe ID
 */
async function removeImageFromRecipe(recipeId) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);

  if (!recipe) return;

  recipe.photoURL = '';
  recipe.imageSource = '';
  recipe.photographer = '';
  recipe.photographerLink = '';
  recipe.updatedAt = new Date().toISOString();
  
  saveRecipes(recipes);
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
}

/**
 * Show upload status message
 * @param {string} message - Status message
 * @param {string} type - Status type ('uploading', 'success', 'error')
 */
function showUploadStatus(message, type) {
  const statusDiv = document.getElementById('upload-status');
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.className = `upload-status-${type}`;

  // Auto-clear success/error messages after 3 seconds
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 3000);
  }
}

/**
 * Initialize image preview on page load
 * @param {Object} recipe - Recipe object
 */
export function initImagePreview(recipe) {
  if (recipe.photoURL) {
    const source = recipe.imageSource || 'unsplash';
    updateImagePreview(recipe.photoURL, source);
    
    // If Unsplash, restore credit
    if (source === 'unsplash' && recipe.photographer) {
      const creditLink = document.querySelector('#image-credit a');
      if (creditLink) {
        creditLink.textContent = recipe.photographer;
        creditLink.href = recipe.photographerLink;
      }
    }
  }
}