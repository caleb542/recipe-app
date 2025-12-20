// src/helpers/featureImage.js
import { renderImageSelector } from '../functions.js';

/**
 * Setup feature image preview and Unsplash search
 * @param {Object} recipe - Recipe object
 */
export function setupFeatureImage(recipe) {
  const featureImageButton = document.getElementById('feature-image-button');
  const featureKeywordInput = document.getElementById('feature-keyword');

  if (!featureImageButton || !featureKeywordInput) {
    console.warn('Feature image elements not found');
    return;
  }

  // Keyword defaults to recipe name
  featureKeywordInput.value = recipe.name || '';

  // Button listener → trigger Unsplash search
  featureImageButton.addEventListener('click', e => {
    e.preventDefault();
    featureImageButton.classList.add('return-focus');

    let keyword = featureKeywordInput.value.trim();
    if (!keyword) keyword = 'pie'; // fallback keyword

    const pageNumber = 1;
    renderImageSelector(keyword, pageNumber, recipe.id);
  });

  // Handle Enter key in search input
  featureKeywordInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      featureImageButton.click();
    }
  });

  // Close modal when clicking outside
  const modal = document.getElementById('select-images');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.close();
      }
    });
  }
}

/**
 * Called when user selects an image from Unsplash
 * @param {string} recipeId - Recipe ID
 * @param {string} url - Image URL
 * @param {string} photographer - Photographer name
 * @param {string} photographerLink - Photographer profile URL (with UTM)
 */
export async function selectUnsplashImageForGallery(recipeId, url, photographer, photographerLink) {
  const { addUnsplashImage } = await import('./imageGallery.js');
  
  // Add to image gallery with REQUIRED Unsplash attribution
  await addUnsplashImage(recipeId, {
    url,
    photographer,
    photographerLink // Already includes UTM params from renderImageSelector
  });

  // Show success message
  showImageAddedMessage();
}

/**
 * Show temporary success message
 */
function showImageAddedMessage() {
  const statusDiv = document.getElementById('upload-status');
  if (!statusDiv) return;

  statusDiv.textContent = '✓ Image added to gallery!';
  statusDiv.className = 'upload-status-success';

  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = '';
  }, 3000);
}