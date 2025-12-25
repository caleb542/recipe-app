/**
 * Optimize image before uploading to Cloudinary
 * @param {File} file - Original image file
 * @param {Object} options - Resize options
 * @returns {Promise<Blob>} - Optimized image blob
 */
export async function optimizeImage(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (maintain aspect ratio)
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`✅ Optimized: ${(file.size / 1024).toFixed(0)}KB → ${(blob.size / 1024).toFixed(0)}KB`);
              resolve(blob);
            } else {
              reject(new Error('Failed to optimize image'));
            }
          },
          format,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get recommended optimization settings for different image types
 */
export const IMAGE_PRESETS = {
  avatar: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.90,
    format: 'image/jpeg'
  },
  recipeHero: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.85,
    format: 'image/jpeg'
  },
  recipeThumbnail: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.80,
    format: 'image/jpeg'
  }
};