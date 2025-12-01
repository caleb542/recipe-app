import { renderImageSelector } from '../functions.js';

/**
 * Setup feature image preview and search
 */
export function setupFeatureImage(recipe) {
  const featureImageFieldset = document.getElementById('image');
  const featureImageButton = document.getElementById('feature-image-button');
  const featureKeywordInput = document.getElementById('feature-keyword');
  const imagePreview = document.querySelector('figure.image-preview img');
  const figcaption = document.querySelector('figure.image-preview figcaption');

  // Initial preview from recipe data
  if (recipe.photoURL) {
    imagePreview.src = recipe.photoURL;
    imagePreview.style = 'width:200px;aspect-ratio:16/9';
  }
  if (recipe.photographer && recipe.photographerLink) {
    figcaption.innerHTML = `Unsplash photo by <a href="${recipe.photographerLink}">${recipe.photographer}</a>`;
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
    renderImageSelector(keyword, pageNumber);
  });
}
