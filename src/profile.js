// profile.js - User profile page with avatar upload
import './style.scss'; 
import { initAuth0, getToken } from './auth/auth0.js';
import { loadUserProfile, getUserProfile } from './userContext.js';
import { optimizeImage, IMAGE_PRESETS } from './helpers/imageOptimizer.js';
import { generateFileHash } from './helpers/duplicateCheck.js';
import { findExistingImage, registerImage } from './helpers/globalImageRegistry.js';

const CLOUDINARY_CLOUD_NAME = 'day1f5nz8';
const CLOUDINARY_UPLOAD_PRESET = 'recipe_images';

// Store current profile globally
let currentProfile = null;
let newAvatarUrl = null; // Store temporarily until save

async function init() {
  // Initialize Auth0
  await initAuth0();
  await loadUserProfile();

  // Get username from URL
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('username');

  if (!username) {
    showError('No username provided');
    return;
  }

  // Load and display profile
  await loadAndDisplayProfile(username);
}

async function loadAndDisplayProfile(username) {
  const container = document.getElementById('profile-container');
  
  try {
    // Fetch public profile
    const response = await fetch(
      `/.netlify/functions/user-profile-public?username=${encodeURIComponent(username)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        showError('User not found');
      } else {
        showError('Failed to load profile');
      }
      return;
    }

    const profile = await response.json();
    currentProfile = profile; // Store globally
    displayProfile(profile);

  } catch (error) {
    console.error('Error loading profile:', error);
    showError('Failed to load profile');
  }
}

function displayProfile(profile) {
  const container = document.getElementById('profile-container');
  const currentUser = getUserProfile();
  const isOwnProfile = currentUser?.username === profile.username;

  const avatar = getAvatarHTML(profile.avatar, profile.profile.displayName);

  container.innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar-large">
          ${avatar}
          ${isOwnProfile ? `
            <button class="avatar-upload-btn" onclick="window.uploadAvatar()" title="Change avatar">
              <i class="fa-solid fa-camera"></i>
            </button>
            <input 
              type="file" 
              id="avatar-upload-input" 
              accept="image/*" 
              style="display: none;"
            />
          ` : ''}
        </div>
        <div class="profile-info">
          <h1 class="profile-display-name">${escapeHtml(profile.profile.displayName)}</h1>
          <p class="profile-username">@${escapeHtml(profile.username)}</p>
          ${profile.profile.location ? `
            <p class="profile-location">📍 ${escapeHtml(profile.profile.location)}</p>
          ` : ''}
          ${isOwnProfile ? `
            <button class="btn-edit-profile" onclick="window.editProfile()">Edit Profile</button>
          ` : ''}
        </div>
      </div>

      ${profile.profile.bio ? `
        <div class="profile-bio">
          <h2>About</h2>
          <p>${escapeHtml(profile.profile.bio)}</p>
        </div>
      ` : ''}

      ${profile.profile.website ? `
        <div class="profile-website">
          <a href="${escapeHtml(profile.profile.website)}" target="_blank" rel="noopener noreferrer">
            🔗 ${escapeHtml(profile.profile.website)}
          </a>
        </div>
      ` : ''}

      <div class="profile-stats">
        <div class="stat">
          <div class="stat-value">${profile.stats.recipesCreated}</div>
          <div class="stat-label">Recipes</div>
        </div>
        <div class="stat">
          <div class="stat-value">${profile.stats.reviewsWritten}</div>
          <div class="stat-label">Reviews</div>
        </div>
        <div class="stat">
          <div class="stat-value">${profile.stats.likesReceived}</div>
          <div class="stat-label">Likes</div>
        </div>
      </div>

      ${/* Published Recipes Section */ ''}
      ${profile.publishedRecipes && profile.publishedRecipes.length > 0 ? `
        <div class="profile-section">
          <div class="section-header">
            <h2>
              <i class="fa-solid fa-check-circle" style="color: #2ecc71;"></i>
              ${isOwnProfile ? 'Published Recipes' : `${profile.profile.displayName}'s Recipes`}
            </h2>
            ${isOwnProfile ? `
              <a href="/edit.html" class="btn-create-recipe">
                <i class="fa-solid fa-plus"></i> Create Recipe
              </a>
            ` : ''}
          </div>
          <div class="recipe-grid">
            ${profile.publishedRecipes.map(recipe => renderRecipeCard(recipe, true)).join('')}
          </div>
        </div>
      ` : isOwnProfile ? `
        <div class="profile-section">
          <div class="section-header">
            <h2>
              <i class="fa-solid fa-check-circle" style="color: #2ecc71;"></i>
              Published Recipes
            </h2>
            <a href="/edit.html" class="btn-create-recipe">
              <i class="fa-solid fa-plus"></i> Create Recipe
            </a>
          </div>
          <div class="empty-state">
            <i class="fa-solid fa-utensils"></i>
            <p>You haven't published any recipes yet.</p>
          </div>
        </div>
      ` : ''}

      ${/* Unpublished Recipes Section (own profile only) */ ''}
      ${isOwnProfile && profile.unpublishedRecipes && profile.unpublishedRecipes.length > 0 ? `
        <div class="profile-section">
          <div class="section-header">
            <h2>
              <i class="fa-solid fa-eye-slash" style="color: #f39c12;"></i>
              Unpublished Recipes (Drafts)
            </h2>
          </div>
          <p class="section-note">
            <i class="fa-solid fa-info-circle"></i>
            These recipes are only visible to you. Publish them to share with others.
          </p>
          <div class="recipe-grid">
            ${profile.unpublishedRecipes.map(recipe => renderRecipeCard(recipe, false)).join('')}
          </div>
        </div>
      ` : ''}

      ${profile.recentReviews && profile.recentReviews.length > 0 ? `
        <div class="profile-section">
          <h2>Recent Reviews</h2>
          <div class="recent-reviews">
            ${profile.recentReviews.map(review => `
              <div class="review-item">
                <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
                <a href="/article.html#${review.recipeId}" class="review-recipe">
                  ${escapeHtml(review.recipeName || 'Recipe')}
                </a>
                <p class="review-comment">${escapeHtml(review.comment).substring(0, 150)}${review.comment.length > 150 ? '...' : ''}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
    
    <div id="upload-status" style="margin-top: 1rem;"></div>
  `;

  // Setup avatar upload listener if own profile
  if (isOwnProfile) {
    setupAvatarUpload();
  }
}

/**
 * Render recipe card with published/unpublished status
 */
function renderRecipeCard(recipe, isPublished) {
  return `
    <a href="${isPublished ? '/article.html' : '/edit.html'}#${recipe.id}" class="recipe-card ${!isPublished ? 'recipe-card-draft' : ''}">
      ${!isPublished ? `
        <div class="recipe-card-status">
          <span class="status-badge draft-badge">
            <i class="fa-solid fa-eye-slash"></i> Draft
          </span>
        </div>
      ` : ''}
      ${recipe.featuredImage ? `
        <div class="recipe-card-image">
          <img src="${recipe.featuredImage}" alt="${escapeHtml(recipe.name)}" loading="lazy">
        </div>
      ` : `
        <div class="recipe-card-image recipe-card-no-image">
          <i class="fa-solid fa-utensils"></i>
        </div>
      `}
      <div class="recipe-card-content">
        <h3 class="recipe-card-title">${escapeHtml(recipe.name)}</h3>
        ${recipe.description ? `
          <p class="recipe-card-description">${escapeHtml(recipe.description).substring(0, 100)}${recipe.description.length > 100 ? '...' : ''}</p>
        ` : ''}
        ${recipe.categories && recipe.categories.length > 0 ? `
          <div class="recipe-card-tags">
            ${recipe.categories.slice(0, 3).map(cat => `
              <span class="recipe-tag">${escapeHtml(cat)}</span>
            `).join('')}
          </div>
        ` : ''}
        <div class="recipe-card-meta">
          <span class="recipe-date">
            <i class="fa-solid fa-calendar"></i>
            ${new Date(recipe.createdAt).toLocaleDateString()}
          </span>
          ${!isPublished ? `
            <span class="recipe-action">
              <i class="fa-solid fa-edit"></i> Edit
            </span>
          ` : ''}
        </div>
      </div>
    </a>
  `;
}

/**
 * Setup avatar upload functionality (main profile page)
 */
function setupAvatarUpload() {
  const uploadInput = document.getElementById('avatar-upload-input');
  
  if (!uploadInput) return;

  uploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      showUploadStatus('Please select an image file', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showUploadStatus('Image must be smaller than 20MB', 'error');
      return;
    }

    try {
      showUploadStatus('Optimizing avatar...', 'uploading');
      
      const optimizedBlob = await optimizeImage(file, IMAGE_PRESETS.avatar);
      
      console.log(`📉 Avatar: ${(file.size / 1024).toFixed(0)}KB → ${(optimizedBlob.size / 1024).toFixed(0)}KB`);
      
      // Check global registry for duplicate
      const fileHash = await generateFileHash(optimizedBlob);
      const existingImage = findExistingImage(fileHash);
      
      if (existingImage) {
        const shouldReuse = confirm(
          `✅ This image already exists!\n\n` +
          `File: ${existingImage.metadata?.originalFilename || 'Unknown'}\n` +
          `Uploaded: ${new Date(existingImage.uploadedAt).toLocaleDateString()}\n\n` +
          `Reuse existing image? (Saves bandwidth & storage)`
        );
        
        if (shouldReuse) {
          console.log('♻️ Reusing existing avatar:', existingImage.url);
          registerImage(fileHash, existingImage, `avatar-${currentProfile.username}`);
          await updateUserAvatar(existingImage.url);
          showUploadStatus('✓ Avatar updated (reused)!', 'success');
          setTimeout(() => window.location.reload(), 1000);
          return;
        }
      }
      
      showUploadStatus('Uploading...', 'uploading');
      
      const avatarUrl = await uploadToCloudinary(optimizedBlob, 'avatar.jpg');
      
      const imageData = {
        url: avatarUrl,
        cloudinaryPublicId: null,
        metadata: {
          originalFilename: file.name,
          optimizedSize: optimizedBlob.size,
          type: 'avatar'
        }
      };
      
      registerImage(fileHash, imageData, `avatar-${currentProfile.username}`);
      await updateUserAvatar(avatarUrl);
      showUploadStatus('✓ Avatar updated!', 'success');
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      console.error('Avatar upload failed:', error);
      showUploadStatus(`✗ Upload failed: ${error.message}`, 'error');
    }
  });
}

/**
 * Upload avatar to Cloudinary
 */
async function uploadToCloudinary(fileOrBlob, filename = 'avatar.jpg') {
  const formData = new FormData();
  
  if (fileOrBlob instanceof Blob && !(fileOrBlob instanceof File)) {
    const file = new File([fileOrBlob], filename, { type: fileOrBlob.type });
    formData.append('file', file);
  } else {
    formData.append('file', fileOrBlob);
  }
  
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'avatars');

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
  return data.secure_url.replace('/upload/', '/upload/q_auto,f_auto/');
}

/**
 * Update user avatar in database
 */
async function updateUserAvatar(avatarUrl) {
  const token = await getToken();
  
  const response = await fetch('/.netlify/functions/user-profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      avatar: {
        type: 'uploaded',
        url: avatarUrl
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update avatar');
  }

  return await response.json();
}

/**
 * Show upload status message
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

/**
 * Open edit profile modal
 */
window.editProfile = function() {
  if (!currentProfile) {
    console.error('No profile loaded');
    return;
  }
  
  const modal = document.getElementById('edit-profile-modal');
  if (!modal) {
    console.error('Modal not found');
    return;
  }

  document.getElementById('edit-display-name').value = currentProfile.profile.displayName || '';
  document.getElementById('edit-bio').value = currentProfile.profile.bio || '';
  document.getElementById('edit-location').value = currentProfile.profile.location || '';
  document.getElementById('edit-website').value = currentProfile.profile.website || '';
  document.getElementById('edit-public-profile').checked = currentProfile.preferences?.publicProfile !== false;
  document.getElementById('edit-email-notifications').checked = currentProfile.preferences?.emailNotifications !== false;

  renderModalAvatar(currentProfile.avatar, currentProfile.profile.displayName);
  updateCharCount();
  modal.showModal();
  setupEditForm();
  setupModalAvatarUpload();
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
};

/**
 * Close edit modal
 */
window.closeEditModal = function() {
  const modal = document.getElementById('edit-profile-modal');
  if (modal) modal.close();
  
  newAvatarUrl = null;
  
  const statusDiv = document.getElementById('modal-status');
  if (statusDiv) statusDiv.innerHTML = '';
};

/**
 * Render current avatar in modal preview
 */
function renderModalAvatar(avatar, displayName) {
  const previewContainer = document.getElementById('modal-avatar-preview');
  const removeBtn = document.getElementById('remove-avatar-btn');
  
  if (!previewContainer) return;
  
  const avatarHTML = getAvatarHTML(avatar, displayName);
  previewContainer.innerHTML = avatarHTML;
  
  if (removeBtn && avatar?.type === 'uploaded' && avatar?.url) {
    removeBtn.style.display = 'inline-flex';
  } else if (removeBtn) {
    removeBtn.style.display = 'none';
  }
}

/**
 * Setup avatar upload in modal
 */
function setupModalAvatarUpload() {
  const uploadInput = document.getElementById('modal-avatar-upload');
  const removeBtn = document.getElementById('remove-avatar-btn');
  
  if (!uploadInput) return;

  const newInput = uploadInput.cloneNode(true);
  uploadInput.parentNode.replaceChild(newInput, uploadInput);
  
  const finalInput = document.getElementById('modal-avatar-upload');
  
  finalInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showModalStatus('Please select an image file', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showModalStatus('Image must be smaller than 20MB', 'error');
      return;
    }

    try {
      showModalStatus(`⏳ Optimizing ${(file.size / 1024).toFixed(0)}KB image...`, 'uploading');
      
      const optimizedBlob = await optimizeImage(file, IMAGE_PRESETS.avatar);
      const originalSize = (file.size / 1024).toFixed(0);
      const optimizedSize = (optimizedBlob.size / 1024).toFixed(0);
      const savings = Math.round((1 - optimizedBlob.size / file.size) * 100);
      
      console.log(`📉 Avatar: ${originalSize}KB → ${optimizedSize}KB (${savings}% smaller)`);
      
      const fileHash = await generateFileHash(optimizedBlob);
      const existingImage = findExistingImage(fileHash);
      
      if (existingImage) {
        const shouldReuse = confirm(
          `✅ This image already exists!\n\n` +
          `File: ${existingImage.metadata?.originalFilename || 'Unknown'}\n` +
          `Uploaded: ${new Date(existingImage.uploadedAt).toLocaleDateString()}\n\n` +
          `Reuse existing image? (Saves bandwidth & storage)`
        );
        
        if (shouldReuse) {
          console.log('♻️ Reusing existing avatar:', existingImage.url);
          registerImage(fileHash, existingImage, `avatar-${currentProfile.username}`);
          newAvatarUrl = existingImage.url;
          
          const previewContainer = document.getElementById('modal-avatar-preview');
          if (previewContainer) {
            previewContainer.innerHTML = `<img src="${existingImage.url}" alt="New avatar" class="avatar-image" />`;
          }
          
          if (removeBtn) removeBtn.style.display = 'inline-flex';
          showModalStatus(`✅ Avatar ready to save! (Reused, saved ${savings}%)`, 'success');
          return;
        }
      }
      
      showModalStatus('⏳ Uploading optimized avatar...', 'uploading');
      
      const avatarUrl = await uploadToCloudinary(optimizedBlob, file.name);
      
      const imageData = {
        url: avatarUrl,
        cloudinaryPublicId: null,
        metadata: {
          originalFilename: file.name,
          optimizedSize: optimizedBlob.size,
          type: 'avatar'
        }
      };
      
      registerImage(fileHash, imageData, `avatar-${currentProfile.username}`);
      newAvatarUrl = avatarUrl;
      
      const previewContainer = document.getElementById('modal-avatar-preview');
      if (previewContainer) {
        previewContainer.innerHTML = `<img src="${avatarUrl}" alt="New avatar" class="avatar-image" />`;
      }
      
      if (removeBtn) removeBtn.style.display = 'inline-flex';
      showModalStatus(`✅ Avatar ready to save! (Saved ${savings}%)`, 'success');
      
    } catch (error) {
      console.error('Avatar upload failed:', error);
      showModalStatus(`❌ Upload failed: ${error.message}`, 'error');
    }
  });

  if (removeBtn) {
    const newRemoveBtn = removeBtn.cloneNode(true);
    removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
    
    const finalRemoveBtn = document.getElementById('remove-avatar-btn');
    finalRemoveBtn.addEventListener('click', () => {
      if (confirm('Remove your avatar and use initials instead?')) {
        newAvatarUrl = 'REMOVE';
        
        const previewContainer = document.getElementById('modal-avatar-preview');
        if (previewContainer && currentProfile) {
          const initials = currentProfile.avatar?.initials || '??';
          previewContainer.innerHTML = `<div class="avatar-initials">${initials}</div>`;
        }
        
        finalRemoveBtn.style.display = 'none';
        showModalStatus('Avatar will be removed when you save', 'success');
      }
    });
  }
}

/**
 * Setup edit form submission
 */
function setupEditForm() {
  const form = document.getElementById('edit-profile-form');
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  const bioInputNew = document.getElementById('edit-bio');
  bioInputNew.addEventListener('input', updateCharCount);
  
  const finalForm = document.getElementById('edit-profile-form');
  finalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProfileChanges();
  });
}

/**
 * Update character count for bio
 */
function updateCharCount() {
  const bioInput = document.getElementById('edit-bio');
  const charCount = document.getElementById('bio-char-count');
  
  if (bioInput && charCount) {
    charCount.textContent = bioInput.value.length;
  }
}

/**
 * Save profile changes
 */
async function saveProfileChanges() {
  const saveBtn = document.getElementById('save-profile-btn');
  
  const updates = {
    displayName: document.getElementById('edit-display-name').value.trim(),
    bio: document.getElementById('edit-bio').value.trim(),
    location: document.getElementById('edit-location').value.trim(),
    website: document.getElementById('edit-website').value.trim(),
    preferences: {
      publicProfile: document.getElementById('edit-public-profile').checked,
      emailNotifications: document.getElementById('edit-email-notifications').checked
    }
  };

  if (newAvatarUrl === 'REMOVE') {
    updates.avatar = {
      type: 'initials',
      initials: getInitials(updates.displayName)
    };
  } else if (newAvatarUrl) {
    updates.avatar = {
      type: 'uploaded',
      url: newAvatarUrl
    };
  }

  if (!updates.displayName) {
    showModalStatus('Display name is required', 'error');
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    showModalStatus('Saving changes...', 'uploading');

    const token = await getToken();
    
    const response = await fetch('/.netlify/functions/user-profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    newAvatarUrl = null;
    showModalStatus('✓ Profile updated!', 'success');
    setTimeout(() => window.location.reload(), 1000);

  } catch (error) {
    console.error('Failed to save profile:', error);
    showModalStatus(`✗ ${error.message}`, 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
  }
}

/**
 * Show modal status message
 */
function showModalStatus(message, type) {
  const statusDiv = document.getElementById('modal-status');
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.className = `modal-status-${type}`;

  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      if (type === 'error') {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }
    }, 3000);
  }
}

/**
 * Get initials from name
 */
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarHTML(avatar, displayName) {
  if (!avatar || avatar.type === 'initials') {
    return `<div class="avatar-initials">${avatar?.initials || '??'}</div>`;
  }
  if (avatar.type === 'uploaded' && avatar.url) {
    return `<img src="${avatar.url}" alt="${escapeHtml(displayName)}" class="avatar-image" />`;
  }
  return `<div class="avatar-initials">??</div>`;
}

function showError(message) {
  const container = document.getElementById('profile-container');
  container.innerHTML = `
    <div class="error-message">
      <h2>😕 ${message}</h2>
      <p><a href="/">Go back home</a></p>
    </div>
  `;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Global function for avatar upload
window.uploadAvatar = function() {
  const uploadInput = document.getElementById('avatar-upload-input');
  if (uploadInput) {
    uploadInput.click();
  }
};

// Initialize
init();