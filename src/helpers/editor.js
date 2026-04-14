import TurndownService from 'turndown';
import { updateLocalStorage } from '../functions.js';
import { optimizeImage, IMAGE_PRESETS } from './imageOptimizer.js';
import { generateFileHash } from './duplicateCheck.js';
import { findExistingImage, registerImage } from './globalImageRegistry.js';

const CLOUDINARY_CLOUD_NAME = 'day1f5nz8';
const CLOUDINARY_UPLOAD_PRESET = 'recipe_images';

const turndownService = new TurndownService();

export async function setupEditor(recipeId, rawHTML) {
 const { default: Editor } = await import('@toast-ui/editor');

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
          
          const fileHash = await generateFileHash(optimizedBlob);
          const existingImage = findExistingImage(fileHash);
          
          if (existingImage) {
            console.log('♻️ Reusing existing image for inline:', existingImage.url);
            registerImage(fileHash, existingImage, recipeId);
            callback(existingImage.url, 'Inline image');
            if (statusDiv) {
              statusDiv.textContent = '✅ Using existing image';
              statusDiv.className = 'upload-status-success';
              setTimeout(() => { statusDiv.textContent = ''; statusDiv.className = ''; }, 2000);
            }
            return;
          }
          
          if (statusDiv) statusDiv.textContent = '⏳ Uploading new image...';
          
          const imageUrl = await uploadInlineImageToCloudinary(optimizedBlob);
          
          const imageData = {
            url: imageUrl,
            cloudinaryPublicId: null,
            metadata: {
              originalFilename: 'inline-image.jpg',
              optimizedSize: optimizedBlob.size
            }
          };
          
          registerImage(fileHash, imageData, recipeId);
          console.log('✅ Uploaded new image:', imageUrl);
          
          if (statusDiv) {
            statusDiv.textContent = '✅ Image uploaded!';
            statusDiv.className = 'upload-status-success';
            setTimeout(() => { statusDiv.textContent = ''; statusDiv.className = ''; }, 2000);
          }
          
          callback(imageUrl, 'Inline image');
          
        } catch (error) {
          console.error('❌ Image upload failed:', error);
        }
      }
    }
  });

  window.toastEditor = toastEditor;
  window.editorInstance = toastEditor;
  return toastEditor;
}

async function uploadInlineImageToCloudinary(blob) {
  const formData = new FormData();
  formData.append('file', blob, 'inline-image.jpg');
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'recipes/inline');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url.replace('/upload/', '/upload/q_auto,f_auto/');
}