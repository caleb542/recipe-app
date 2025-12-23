// src/helpers/imageGallery.js
import { v4 as uuidv4 } from 'uuid';
import { loadRecipes, saveRecipes } from '../functions.js';
import { optimizeImage, IMAGE_PRESETS } from './imageOptimizer.js';
import { generateFileHash, checkDuplicateByFilename } from './duplicateCheck.js';
import { findExistingImage, registerImage, unregisterImageFromRecipe, getImageRegistry } from './globalImageRegistry.js';

const CLOUDINARY_CLOUD_NAME = 'day1f5nz8';
const CLOUDINARY_UPLOAD_PRESET = 'recipe_images';

/**
 * Setup image gallery with upload, ordering, and feature selection
 * @param {string} recipeId - Current recipe ID
 */
export function setupImageGallery(recipeId) {
  const uploadInput = document.getElementById('cloudinary-upload');
  
  if (!uploadInput) {
    console.warn('Image upload input not found');
    return;
  }

  // Handle Cloudinary upload
  uploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ❌ Block video file uploads
    if (file.type.startsWith('video/')) {
      showUploadStatus('❌ Video files not supported. Please upload to YouTube and paste the link instead.', 'error');
      uploadInput.value = '';
      return;
    }

    // Validate image type
    if (!file.type.startsWith('image/')) {
      showUploadStatus('Please select an image file', 'error');
      uploadInput.value = '';
      return;
    }

    // Validate original file size (allow up to 20MB originals)
    if (file.size > 20 * 1024 * 1024) {
      showUploadStatus('Image must be smaller than 20MB', 'error');
      return;
    }

    try {
      showUploadStatus('Checking for duplicates...', 'uploading');
      
      // Optimize first (so hash matches what's stored)
      const optimizedBlob = await optimizeImage(file, IMAGE_PRESETS.recipeHero);
      
      // ✅ Generate hash of optimized image
      const fileHash = await generateFileHash(optimizedBlob);
      
      // ✅ Check GLOBAL registry (all recipes)
      const existingImage = findExistingImage(fileHash);
      
      if (existingImage) {
        const usedInRecipes = existingImage.usedByRecipes.length;
        const shouldReuse = confirm(
          `✅ This image already exists!\n\n` +
          `File: ${existingImage.metadata?.originalFilename || 'Unknown'}\n` +
          `Used in: ${usedInRecipes} recipe(s)\n` +
          `Uploaded: ${new Date(existingImage.uploadedAt).toLocaleDateString()}\n\n` +
          `Reuse existing image? (Saves bandwidth & storage)`
        );
        
        if (shouldReuse) {
          // ✅ Reuse existing image
          console.log('♻️ Reusing existing image:', existingImage.url);
          
          const imageData = {
            url: existingImage.url,
            source: 'user-upload',
            cloudinaryPublicId: existingImage.cloudinaryPublicId,
            fileHash: fileHash,
            attribution: null,
            metadata: {
              uploadedAt: existingImage.uploadedAt,
              originalFilename: file.name,
              reusedFrom: existingImage.metadata?.originalFilename,
              originalSize: file.size,
              optimizedSize: optimizedBlob.size
            }
          };
          
          await addImageToRecipe(recipeId, imageData);
          
          // Register this recipe as using the image
          registerImage(fileHash, existingImage, recipeId);
          
          await renderImageGallery(recipeId);
          showUploadStatus('✓ Image reused! (No upload needed)', 'success');
          uploadInput.value = '';
          return;
        }
      }
      
      // Not reusing, check for duplicate by filename within this recipe
      const recipes = await loadRecipes();
      const recipe = recipes.find(r => r.id === recipeId);
      
      if (recipe && recipe.images) {
        const duplicateByName = checkDuplicateByFilename(file.name, recipe.images);
        
        if (duplicateByName) {
          const shouldContinue = confirm(
            `⚠️ An image named "${file.name}" already exists in this recipe.\n\n` +
            `Do you want to upload it anyway?`
          );
          
          if (!shouldContinue) {
            uploadInput.value = '';
            showUploadStatus('Upload cancelled - duplicate detected', 'error');
            return;
          }
        }
      }
      
      // Proceed with new upload
      const originalSize = (file.size / 1024).toFixed(0);
      const optimizedSize = (optimizedBlob.size / 1024).toFixed(0);
      const savings = Math.round((1 - optimizedBlob.size / file.size) * 100);
      
      console.log(`📉 Size reduction: ${originalSize}KB → ${optimizedSize}KB (${savings}% smaller)`);
      
      showUploadStatus('Uploading optimized image...', 'uploading');
      
      // Upload to Cloudinary
      const { url, publicId } = await uploadToCloudinary(optimizedBlob, file.name);
      
      const imageData = {
        url,
        source: 'user-upload',
        cloudinaryPublicId: publicId,
        fileHash: fileHash,
        attribution: null,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalFilename: file.name,
          originalSize: file.size,
          optimizedSize: optimizedBlob.size
        }
      };
      
      // ✅ Register in global registry
      registerImage(fileHash, imageData, recipeId);
      
      // Add to recipe
      await addImageToRecipe(recipeId, imageData);
      
      await renderImageGallery(recipeId);
      showUploadStatus(`✓ Image added! (Saved ${savings}% bandwidth)`, 'success');
      uploadInput.value = '';
      
    } catch (error) {
      console.error('Upload failed:', error);
      showUploadStatus(`✗ Upload failed: ${error.message}`, 'error');
    }
  });

  // Initial render
  renderImageGallery(recipeId);
}

/**
 * Add image from Unsplash (called from featureImage.js)
 * ALWAYS includes attribution (Unsplash requirement)
 * @param {string} recipeId 
 * @param {Object} imageData 
 */
export async function addUnsplashImage(recipeId, imageData) {
  await addImageToRecipe(recipeId, {
    url: imageData.url,
    source: 'unsplash',
    cloudinaryPublicId: null,
    attribution: {
      photographer: imageData.photographer,
      photographerUrl: imageData.photographerLink, // Includes UTM params
      requiresAttribution: true,
      canEdit: false // Cannot edit/remove Unsplash attribution
    }
  });
  
  await renderImageGallery(recipeId);
}

/**
 * Upload to Cloudinary - returns URL and publicId
 */
async function uploadToCloudinary(fileOrBlob, filename = 'image.jpg') {
  const formData = new FormData();
  
  // Convert blob to file with proper name
  if (fileOrBlob instanceof Blob && !(fileOrBlob instanceof File)) {
    const file = new File([fileOrBlob], filename, { type: fileOrBlob.type });
    formData.append('file', file);
  } else {
    formData.append('file', fileOrBlob);
  }
  
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'recipes');

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
  
  return {
    url: data.secure_url.replace('/upload/', '/upload/q_auto,f_auto/'),
    publicId: data.public_id
  };
}

/**
 * Add image to recipe
 */
async function addImageToRecipe(recipeId, imageData) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) return;

  // Initialize images array if needed
  if (!recipe.images) {
    recipe.images = [];
  }

  // Create new image object
  const newImage = {
    id: uuidv4(),
    url: imageData.url,
    source: imageData.source,
    isFeatured: recipe.images.length === 0, // First image is featured
    order: recipe.images.length,
    cloudinaryPublicId: imageData.cloudinaryPublicId || null,
    fileHash: imageData.fileHash || null,
    attribution: imageData.attribution || null,
    metadata: imageData.metadata || null
  };

  recipe.images.push(newImage);
  recipe.updatedAt = new Date().toISOString();
  
  saveRecipes(recipes);
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
}

/**
 * Render the image gallery
 */
export async function renderImageGallery(recipeId) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
  const gallery = document.getElementById('image-gallery');
  const noImagesMsg = gallery?.querySelector('.no-images');
  
  if (!recipe || !gallery) return;

  // Show/hide no images message
  if (!recipe.images || recipe.images.length === 0) {
    if (noImagesMsg) noImagesMsg.style.display = 'block';
    gallery.innerHTML = '<p class="no-images">No images yet. Upload or search to add images.</p>';
    return;
  }

  if (noImagesMsg) noImagesMsg.style.display = 'none';

  // Sort images by order
  const sortedImages = [...recipe.images].sort((a, b) => a.order - b.order);

  gallery.innerHTML = `
    ${sortedImages.map(img => `
      <div class="image-card" data-image-id="${img.id}" draggable="true">
        <div class="image-preview">
          <img src="${img.url}" alt="Recipe image">
          ${img.isFeatured ? '<div class="featured-badge"><i class="fa-solid fa-star"></i> Featured</div>' : ''}
          
          ${img.source === 'unsplash' ? `
            <div class="source-badge unsplash-badge" title="From Unsplash">
              <i class="fa-solid fa-image"></i> Unsplash
            </div>
          ` : img.attribution ? `
            <div class="source-badge attribution-badge" title="${formatAttributionText(img)}">
              <i class="fa-solid fa-copyright"></i> Credit
            </div>
          ` : img.metadata?.reusedFrom ? `
            <div class="source-badge reused-badge" title="Reused from: ${img.metadata.reusedFrom}">
              <i class="fa-solid fa-recycle"></i> Reused
            </div>
          ` : ''}
        </div>
        
        <div class="image-actions">
          <button 
            class="btn-small ${img.isFeatured ? 'active' : ''}" 
            onclick="window.setFeaturedImage('${recipeId}', '${img.id}')"
            title="Set as featured image"
          >
            <i class="fa-solid fa-star"></i>
          </button>
          
          <button 
            class="btn-small" 
            onclick="window.moveImageUp('${recipeId}', '${img.id}')"
            title="Move up"
            ${img.order === 0 ? 'disabled' : ''}
          >
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          
          <button 
            class="btn-small" 
            onclick="window.moveImageDown('${recipeId}', '${img.id}')"
            title="Move down"
            ${img.order === sortedImages.length - 1 ? 'disabled' : ''}
          >
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          
          <button 
            class="btn-small ${img.attribution ? 'has-attribution' : ''}" 
            onclick="window.editAttribution('${recipeId}', '${img.id}')"
            title="${img.source === 'unsplash' ? 'Unsplash attribution (required)' : img.attribution ? 'Edit attribution' : 'Add attribution'}"
            ${img.source === 'unsplash' ? 'disabled' : ''}
          >
            <i class="fa-solid fa-${img.source === 'unsplash' ? 'lock' : 'copyright'}"></i>
          </button>
          
          <button 
            class="btn-small btn-danger" 
            onclick="window.removeImage('${recipeId}', '${img.id}')"
            title="Remove image"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        
        ${img.source === 'unsplash' || img.attribution ? `
          <div class="image-credit ${img.source === 'unsplash' ? 'unsplash-credit' : ''}">
            ${formatAttribution(img)}
          </div>
        ` : ''}
      </div>
    `).join('')}
  `;

  // Setup drag-and-drop for reordering
  setupDragAndDrop(recipeId);
}

/**
 * Format attribution for display (Unsplash-compliant)
 */
function formatAttribution(image) {
  if (!image.attribution) return '';
  
  const attr = image.attribution;
  
  // Unsplash-specific format (required by their guidelines)
  if (image.source === 'unsplash') {
    return `Photo by <a href="${attr.photographerUrl}" target="_blank" rel="noopener">${attr.photographer}</a> on <a href="https://unsplash.com/?utm_source=recipe_me&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>`;
  }
  
  // User-added attribution
  if (attr.customCredit) {
    return attr.customCredit;
  }
  
  let text = `Photo by ${attr.photographer}`;
  
  if (attr.photographerUrl) {
    text = `<a href="${attr.photographerUrl}" target="_blank" rel="noopener">${text}</a>`;
  }
  
  return text;
}

/**
 * Format attribution as plain text (for title attribute)
 */
function formatAttributionText(image) {
  if (!image.attribution) return '';
  
  const attr = image.attribution;
  
  if (image.source === 'unsplash') {
    return `Photo by ${attr.photographer} on Unsplash`;
  }
  
  if (attr.customCredit) {
    return attr.customCredit;
  }
  
  return `Photo by ${attr.photographer}`;
}

/**
 * Edit attribution (only for user uploads, not Unsplash)
 */
window.editAttribution = async function(recipeId, imageId) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
  const image = recipe?.images?.find(img => img.id === imageId);
  
  if (!image) return;
  
  // Block editing Unsplash attribution
  if (image.source === 'unsplash') {
    alert('Unsplash attribution cannot be edited or removed per their terms of use.');
    return;
  }
  
  const attribution = await showAttributionDialog(image.attribution);
  
  if (attribution !== undefined) { // undefined = cancelled
    image.attribution = attribution;
    recipe.updatedAt = new Date().toISOString();
    saveRecipes(recipes);
    localStorage.setItem('editingRecipe', JSON.stringify(recipe));
    await renderImageGallery(recipeId);
  }
};

/**
 * Show attribution dialog
 */
function showAttributionDialog(currentAttribution) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'attribution-dialog modal-dialog';
    
    const hasAttribution = currentAttribution && currentAttribution.photographer;
    
    dialog.innerHTML = `
      <form id="attribution-form">
        <h3>${hasAttribution ? 'Edit' : 'Add'} Image Attribution</h3>
        <p class="hint">Optional - add credit if this photo is from a photographer or requires attribution.</p>
        
        <div class="form-group">
          <label for="photographer-name">Photographer/Source Name:</label>
          <input 
            type="text" 
            id="photographer-name" 
            placeholder="e.g., Jane Smith Photography"
            value="${currentAttribution?.photographer || ''}"
          >
        </div>
        
        <div class="form-group">
          <label for="photographer-url">Website/URL (optional):</label>
          <input 
            type="url" 
            id="photographer-url" 
            placeholder="https://janesmith.com"
            value="${currentAttribution?.photographerUrl || ''}"
          >
        </div>
        
        <div class="form-group">
          <label for="custom-credit">Custom Credit Line (optional):</label>
          <input 
            type="text" 
            id="custom-credit" 
            placeholder="e.g., Photography by Jane Smith"
            value="${currentAttribution?.customCredit || ''}"
          >
          <small>If blank, will auto-generate from photographer name</small>
        </div>
        
        <div class="button-group">
          ${hasAttribution ? `
            <button type="button" id="remove-attribution-btn" class="btn-secondary">
              Remove Attribution
            </button>
          ` : ''}
          <button type="button" id="cancel-btn" class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Save
          </button>
        </div>
      </form>
    `;
    
    document.body.appendChild(dialog);
    dialog.showModal();
    
    const form = dialog.querySelector('#attribution-form');
    const photographerInput = dialog.querySelector('#photographer-name');
    const urlInput = dialog.querySelector('#photographer-url');
    const creditInput = dialog.querySelector('#custom-credit');
    const cancelBtn = dialog.querySelector('#cancel-btn');
    const removeBtn = dialog.querySelector('#remove-attribution-btn');
    
    photographerInput.focus();
    
    cancelBtn.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
      resolve(undefined); // undefined = cancelled
    });
    
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        if (confirm('Remove attribution from this image?')) {
          dialog.close();
          dialog.remove();
          resolve(null); // null = remove attribution
        }
      });
    }
    
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.close();
        dialog.remove();
        resolve(undefined);
      }
    });
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const photographer = photographerInput.value.trim();
      const url = urlInput.value.trim();
      const customCredit = creditInput.value.trim();
      
      if (!photographer) {
        dialog.close();
        dialog.remove();
        resolve(null); // No photographer = remove attribution
        return;
      }
      
      const attribution = {
        photographer,
        photographerUrl: url || null,
        customCredit: customCredit || null,
        requiresAttribution: true,
        canEdit: true
      };
      
      dialog.close();
      dialog.remove();
      resolve(attribution);
    });
  });
}

/**
 * Set featured image
 */
window.setFeaturedImage = async function(recipeId, imageId) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe || !recipe.images) return;

  recipe.images.forEach(img => img.isFeatured = false);
  const image = recipe.images.find(img => img.id === imageId);
  if (image) image.isFeatured = true;

  recipe.updatedAt = new Date().toISOString();
  saveRecipes(recipes);
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
  
  await renderImageGallery(recipeId);
};

/**
 * Move image up
 */
window.moveImageUp = async function(recipeId, imageId) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe || !recipe.images) return;

  const index = recipe.images.findIndex(img => img.id === imageId);
  if (index <= 0) return;

  const temp = recipe.images[index].order;
  recipe.images[index].order = recipe.images[index - 1].order;
  recipe.images[index - 1].order = temp;

  recipe.updatedAt = new Date().toISOString();
  saveRecipes(recipes);
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
  
  await renderImageGallery(recipeId);
};

/**
 * Move image down
 */
window.moveImageDown = async function(recipeId, imageId) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe || !recipe.images) return;

  const index = recipe.images.findIndex(img => img.id === imageId);
  if (index === -1 || index >= recipe.images.length - 1) return;

  const temp = recipe.images[index].order;
  recipe.images[index].order = recipe.images[index + 1].order;
  recipe.images[index + 1].order = temp;

  recipe.updatedAt = new Date().toISOString();
  saveRecipes(recipes);
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
  
  await renderImageGallery(recipeId);
};

/**
 * Remove image
 */
window.removeImage = async function(recipeId, imageId) {
  if (!confirm('Remove this image? This cannot be undone.')) return;

  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe || !recipe.images) return;

  const imageToRemove = recipe.images.find(img => img.id === imageId);
  
  // ✅ Unregister from global registry
  if (imageToRemove?.fileHash) {
    unregisterImageFromRecipe(imageToRemove.fileHash, recipeId);
  }
  
  // Check if other recipes still use this image
  const registry = getImageRegistry();
  const imageData = registry[imageToRemove?.fileHash];
  const stillInUse = imageData?.usedByRecipes.length > 0;
  
  // Only delete from Cloudinary if no other recipe uses it
  if (!stillInUse && imageToRemove?.source === 'user-upload' && imageToRemove.cloudinaryPublicId) {
    const shouldDelete = confirm(
      'This image is not used by any other recipe.\n\n' +
      'Delete from Cloudinary? (Saves storage)'
    );
    
    if (shouldDelete) {
      showUploadStatus('Deleting from Cloudinary...', 'uploading');
      // TODO: Implement Cloudinary deletion
      // await deleteFromCloudinary(imageToRemove.cloudinaryPublicId);
      console.log('🗑️ Would delete:', imageToRemove.cloudinaryPublicId);
    }
  } else if (stillInUse) {
    console.log(`♻️ Image still used by ${imageData.usedByRecipes.length} recipe(s), keeping in Cloudinary`);
  }

  // Remove from recipe
  recipe.images = recipe.images.filter(img => img.id !== imageId);
  
  // Reorder remaining images
  recipe.images.sort((a, b) => a.order - b.order);
  recipe.images.forEach((img, index) => img.order = index);

  // If removed image was featured, set first image as featured
  if (recipe.images.length > 0 && !recipe.images.some(img => img.isFeatured)) {
    recipe.images[0].isFeatured = true;
  }

  recipe.updatedAt = new Date().toISOString();
  saveRecipes(recipes);
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
  
  await renderImageGallery(recipeId);
  showUploadStatus('Image removed', 'success');
};

/**
 * Setup drag-and-drop reordering
 */
function setupDragAndDrop(recipeId) {
  const imageCards = document.querySelectorAll('.image-card');
  let draggedElement = null;

  imageCards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedElement = card;
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(card.parentElement, e.clientY);
      if (afterElement == null) {
        card.parentElement.appendChild(draggedElement);
      } else {
        card.parentElement.insertBefore(draggedElement, afterElement);
      }
    });

    card.addEventListener('drop', async (e) => {
      e.preventDefault();
      await reorderImagesAfterDrag(recipeId);
    });
  });
}

/**
 * Get element to insert dragged item after
 */
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.image-card:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Save new order after drag-and-drop
 */
async function reorderImagesAfterDrag(recipeId) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe || !recipe.images) return;

  const imageCards = document.querySelectorAll('.image-card');
  const newOrder = Array.from(imageCards).map(card => card.dataset.imageId);

  newOrder.forEach((imageId, index) => {
    const img = recipe.images.find(i => i.id === imageId);
    if (img) img.order = index;
  });

  recipe.updatedAt = new Date().toISOString();
  saveRecipes(recipes);
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
}

/**
 * Show upload status
 */
function showUploadStatus(message, type) {
  const statusDiv = document.getElementById('upload-status');
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.className = `upload-status-${type}`;

  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 3000);
  }
}