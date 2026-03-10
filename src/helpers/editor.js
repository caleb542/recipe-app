import Editor from '@toast-ui/editor';
import TurndownService from 'turndown';
import { updateLocalStorage } from '../functions.js';
import { optimizeImage, IMAGE_PRESETS } from './imageOptimizer.js';
import { generateFileHash } from './duplicateCheck.js';
import { findExistingImage, registerImage } from './globalImageRegistry.js';


const CLOUDINARY_CLOUD_NAME = 'day1f5nz8';
const CLOUDINARY_UPLOAD_PRESET = 'recipe_images';

const turndownService = new TurndownService();

function setupEditor(recipeId, rawHTML) {
  const markdown = turndownService.turndown(rawHTML);

  const toastEditor = new Editor({
    el: document.querySelector('#editor'),
    height: '230px',
    initialEditType: 'markdown',
    previewStyle: 'vertical',
    initialValue: markdown,
    hooks: {
      change: () => {
        updateLocalStorage(recipeId, { article: toastEditor.getMarkdown() });
      },
      
      // ✅ NEW: Upload inline images to Cloudinary instead of base64
      // In editor.js - update addImageBlobHook
addImageBlobHook: async (blob, callback) => {
  try {
    console.log('📤 Checking for existing image...');
    
    const statusDiv = document.getElementById('upload-status');
    if (statusDiv) {
      statusDiv.textContent = '⏳ Checking for duplicates...';
      statusDiv.className = 'upload-status-uploading';
    }
    
    const file = new File([blob], 'inline-image.jpg', { type: blob.type });
    const optimizedBlob = await optimizeImage(file, IMAGE_PRESETS.recipeHero);
    
    // ✅ Check global registry
    const fileHash = await generateFileHash(optimizedBlob);
    const existingImage = findExistingImage(fileHash);
    
    if (existingImage) {
      // Reuse existing image automatically (no prompt for inline)
      console.log('♻️ Reusing existing image for inline:', existingImage.url);
      
      // Register this recipe as using it
      registerImage(fileHash, existingImage, recipeId);
      
      callback(existingImage.url, 'Inline image');
      
      if (statusDiv) {
        statusDiv.textContent = '✅ Using existing image';
        statusDiv.className = 'upload-status-success';
        setTimeout(() => {
          statusDiv.textContent = '';
          statusDiv.className = '';
        }, 2000);
      }
      return;
    }
    
    // New image, upload it
    if (statusDiv) {
      statusDiv.textContent = '⏳ Uploading new image...';
    }
    
    const imageUrl = await uploadInlineImageToCloudinary(optimizedBlob);
    
    const imageData = {
      url: imageUrl,
      cloudinaryPublicId: null, // inline images don't get publicId stored
      metadata: {
        originalFilename: 'inline-image.jpg',
        optimizedSize: optimizedBlob.size
      }
    };
    
    // ✅ Register in global registry
    registerImage(fileHash, imageData, recipeId);
    
    console.log('✅ Uploaded new image:', imageUrl);
    
    if (statusDiv) {
      statusDiv.textContent = '✅ Image uploaded!';
      statusDiv.className = 'upload-status-success';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 2000);
    }
    
    callback(imageUrl, 'Inline image');
    
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    // ... error handling
  }
}
    }
  });

  window.toastEditor = toastEditor;
  window.editorInstance = toastEditor;
  return toastEditor;
}

/**
 * Upload inline image to Cloudinary
 */
async function uploadInlineImageToCloudinary(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'inline-image.jpg');
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'recipes/inline'); // Separate folder for inline images

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
  
  // Return optimized URL
  return data.secure_url.replace('/upload/', '/upload/q_auto,f_auto/');
}

export { setupEditor };