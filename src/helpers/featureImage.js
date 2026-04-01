// src/helpers/featureImage.js




export async function renderImageSelector(keyword, pageNumber, recipeId) {
  const modal = document.getElementById('select-images');
  const carouselTrack = modal?.querySelector('.carousel-track');
  
  if (!carouselTrack) return;

  // Show loading
  carouselTrack.innerHTML = '<li class="loading">Searching Unsplash...</li>';
  modal.showModal();

  try {
    // ✅ Get existing images from localStorage
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const recipe = recipes.find(r => r.id === recipeId);
    const existingImages = recipe?.images || [];
    const existingUrls = new Set(existingImages.map(img => img.url));

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&page=${pageNumber}&per_page=20&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      carouselTrack.innerHTML = '<li class="no-results">No images found.</li>';
      return;
    }

    // Render results - check if URL already exists in localStorage
    carouselTrack.innerHTML = data.results.map(photo => {
      const imageUrl = photo.urls.regular;
      const alreadyAdded = existingUrls.has(imageUrl);
      
      return `
        <li class="carousel-item ${alreadyAdded ? 'already-added' : ''}">
          <div class="unsplash-photo">
            <img src="${photo.urls.small}" alt="${photo.alt_description || ''}" />
            <div class="photo-info">
              <div class="photo-credit">
                Photo by <a href="${photo.user.links.html}?utm_source=recipe_me&utm_medium=referral" target="_blank" rel="noopener">${sanitizeText(photo.user.name)}</a>
              </div>
              <button 
                class="select-photo-btn ${alreadyAdded ? 'btn-already-added' : ''}"
                data-url="${imageUrl}"
                data-photographer="${photo.user.name}"
                data-photographer-link="${photo.user.links.html}?utm_source=recipe_me&utm_medium=referral"
                ${alreadyAdded ? 'disabled' : ''}
              >
                ${alreadyAdded 
                  ? '<i class="fa-solid fa-check"></i> Already Added'
                  : '<i class="fa-solid fa-plus"></i> Add to Recipe'
                }
              </button>
            </div>
          </div>
        </li>
      `;
    }).join('');

    // Add Done button at the top of the carousel
    const doneButton = document.createElement('button');
    doneButton.className = 'btn-done-selecting';
    doneButton.innerHTML = '<i class="fa-solid fa-check"></i> Done Selecting';
    doneButton.onclick = () => {
      modal.close();
      const searchInput = document.getElementById('feature-keyword');
      if (searchInput) searchInput.value = '';
    };
    
    const carousel = modal.querySelector('.carousel');
    if (carousel && !modal.querySelector('.btn-done-selecting')) {
      carousel.insertBefore(doneButton, carousel.firstChild);
    }

    // Add click handlers for image selection (skip already-added buttons)
    const selectButtons = carouselTrack.querySelectorAll('.select-photo-btn:not(.btn-already-added)');
    selectButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Show loading state
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';
        
        try {
          await selectUnsplashImageForGallery(
            recipeId,
            button.dataset.url,
            button.dataset.photographer,
            button.dataset.photographerLink
          );
          
          // Show success state
          button.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
          button.classList.add('btn-already-added');
          button.style.background = '#059669';
          
          // Add to existingUrls set so it stays marked
          existingUrls.add(button.dataset.url);
          
        } catch (error) {
          console.error('Failed to add image:', error);
          
          // Show error and re-enable
          button.innerHTML = '<i class="fa-solid fa-xmark"></i> Failed';
          button.style.background = '#ef4444';
          button.disabled = false;
          
          // Reset after 2 seconds
          setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = '';
          }, 2000);
        }
      });
    });

  } catch (error) {
    console.error('Unsplash search error:', error);
    carouselTrack.innerHTML = '<li class="error">Search failed. Please try again.</li>';
  }
}
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