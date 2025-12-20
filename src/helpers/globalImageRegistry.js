// src/helpers/globalImageRegistry.js

/**
 * Global image registry for deduplication across all recipes
 * Structure:
 * {
 *   "hash123": {
 *     url: "https://cloudinary.com/.../image.jpg",
 *     cloudinaryPublicId: "recipes/abc123",
 *     uploadedAt: "2025-12-18T10:30:00Z",
 *     usedByRecipes: ["recipe-1", "recipe-2"],
 *     metadata: { originalFilename: "placeholder.jpg", size: 524288 }
 *   }
 * }
 */

const REGISTRY_KEY = 'imageRegistry';

/**
 * Get the global image registry
 */
export function getImageRegistry() {
  try {
    const data = localStorage.getItem(REGISTRY_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load image registry:', error);
    return {};
  }
}

/**
 * Save the global image registry
 */
export function saveImageRegistry(registry) {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  } catch (error) {
    console.error('Failed to save image registry:', error);
  }
}

/**
 * Check if image already exists globally (across all recipes)
 * @param {string} fileHash - SHA-256 hash of file
 * @returns {Object|null} - Image data if exists, null otherwise
 */
export function findExistingImage(fileHash) {
  const registry = getImageRegistry();
  return registry[fileHash] || null;
}

/**
 * Register a new uploaded image
 * @param {string} fileHash - SHA-256 hash of file
 * @param {Object} imageData - Image data (url, cloudinaryPublicId, etc.)
 * @param {string} recipeId - Recipe ID using this image
 */
export function registerImage(fileHash, imageData, recipeId) {
  const registry = getImageRegistry();
  
  if (registry[fileHash]) {
    // Image already exists, add this recipe to usage list
    if (!registry[fileHash].usedByRecipes.includes(recipeId)) {
      registry[fileHash].usedByRecipes.push(recipeId);
      registry[fileHash].lastUsedAt = new Date().toISOString();
    }
  } else {
    // New image, register it
    registry[fileHash] = {
      ...imageData,
      uploadedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      usedByRecipes: [recipeId]
    };
  }
  
  saveImageRegistry(registry);
}

/**
 * Remove recipe from image usage (when image removed from recipe)
 * @param {string} fileHash - SHA-256 hash of file
 * @param {string} recipeId - Recipe ID to remove
 */
export function unregisterImageFromRecipe(fileHash, recipeId) {
  const registry = getImageRegistry();
  
  if (registry[fileHash]) {
    registry[fileHash].usedByRecipes = registry[fileHash].usedByRecipes.filter(
      id => id !== recipeId
    );
    
    // If no recipes use this image anymore, you could optionally delete from Cloudinary
    // (but keeping it is safer in case of orphaned references)
    
    saveImageRegistry(registry);
  }
}

/**
 * Get statistics about global image usage
 */
export function getImageStats() {
  const registry = getImageRegistry();
  const images = Object.values(registry);
  
  return {
    totalImages: images.length,
    totalUsage: images.reduce((sum, img) => sum + img.usedByRecipes.length, 0),
    sharedImages: images.filter(img => img.usedByRecipes.length > 1).length,
    orphanedImages: images.filter(img => img.usedByRecipes.length === 0).length
  };
}

/**
 * Clean up orphaned images (not used by any recipe)
 */
export function cleanupOrphanedImages() {
  const registry = getImageRegistry();
  const cleaned = {};
  
  Object.entries(registry).forEach(([hash, imageData]) => {
    if (imageData.usedByRecipes.length > 0) {
      cleaned[hash] = imageData;
    } else {
      console.log('🗑️ Orphaned image:', imageData.metadata?.originalFilename);
    }
  });
  
  saveImageRegistry(cleaned);
  
  return {
    before: Object.keys(registry).length,
    after: Object.keys(cleaned).length,
    removed: Object.keys(registry).length - Object.keys(cleaned).length
  };
}