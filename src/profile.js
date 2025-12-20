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
      
      // ✅ OPTIMIZE to 400x400, ~50KB
      const optimizedBlob = await optimizeImage(file, IMAGE_PRESETS.avatar);
      
      console.log(`📉 Avatar: ${(file.size / 1024).toFixed(0)}KB → ${(optimizedBlob.size / 1024).toFixed(0)}KB`);
      
      // ✅ Check global registry for duplicate
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
          // ✅ Reuse existing image
          console.log('♻️ Reusing existing avatar:', existingImage.url);
          
          // Register usage (with special "avatar" ID)
          registerImage(fileHash, existingImage, `avatar-${currentProfile.username}`);
          
          // Update user profile with existing URL
          await updateUserAvatar(existingImage.url);
          
          showUploadStatus('✓ Avatar updated (reused)!', 'success');
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        }
      }
      
      showUploadStatus('Uploading...', 'uploading');
      
      // Upload optimized blob
      const avatarUrl = await uploadToCloudinary(optimizedBlob, 'avatar.jpg');
      
      // ✅ Register new upload in global registry
      const imageData = {
        url: avatarUrl,
        cloudinaryPublicId: null, // Avatar doesn't store publicId
        metadata: {
          originalFilename: file.name,
          optimizedSize: optimizedBlob.size,
          type: 'avatar'
        }
      };
      
      registerImage(fileHash, imageData, `avatar-${currentProfile.username}`);
      
      // Update user profile
      await updateUserAvatar(avatarUrl);
      
      showUploadStatus('✓ Avatar updated!', 'success');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
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
  
  // Convert blob to file with name
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
  
  // Return optimized URL
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

  // Populate form with current values
  document.getElementById('edit-display-name').value = currentProfile.profile.displayName || '';
  document.getElementById('edit-bio').value = currentProfile.profile.bio || '';
  document.getElementById('edit-location').value = currentProfile.profile.location || '';
  document.getElementById('edit-website').value = currentProfile.profile.website || '';
  document.getElementById('edit-public-profile').checked = currentProfile.preferences?.publicProfile !== false;
  document.getElementById('edit-email-notifications').checked = currentProfile.preferences?.emailNotifications !== false;

  // Render current avatar in modal
  renderModalAvatar(currentProfile.avatar, currentProfile.profile.displayName);

  // Update character count
  updateCharCount();

  // Show modal
  modal.showModal();
  
  // Setup form submission
  setupEditForm();
  
  // Setup avatar upload in modal
  setupModalAvatarUpload();
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.close();
    }
  });
};

/**
 * Close edit modal
 */
window.closeEditModal = function() {
  const modal = document.getElementById('edit-profile-modal');
  if (modal) modal.close();
  
  // Reset avatar state
  newAvatarUrl = null;
  
  // Clear status
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
  
  // Show remove button only if has uploaded avatar
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

  // Remove existing listeners
  const newInput = uploadInput.cloneNode(true);
  uploadInput.parentNode.replaceChild(newInput, uploadInput);
  
  const finalInput = document.getElementById('modal-avatar-upload');
  
  // Handle file selection
  finalInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
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
      
      // ✅ OPTIMIZE BEFORE UPLOAD
      const optimizedBlob = await optimizeImage(file, IMAGE_PRESETS.avatar);
      
      const originalSize = (file.size / 1024).toFixed(0);
      const optimizedSize = (optimizedBlob.size / 1024).toFixed(0);
      const savings = Math.round((1 - optimizedBlob.size / file.size) * 100);
      
      console.log(`📉 Avatar: ${originalSize}KB → ${optimizedSize}KB (${savings}% smaller)`);
      
      // ✅ Check global registry for duplicate
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
          // ✅ Reuse existing image
          console.log('♻️ Reusing existing avatar:', existingImage.url);
          
          // Register usage
          registerImage(fileHash, existingImage, `avatar-${currentProfile.username}`);
          
          // Store for later save
          newAvatarUrl = existingImage.url;
          
          // Update preview immediately
          const previewContainer = document.getElementById('modal-avatar-preview');
          if (previewContainer) {
            previewContainer.innerHTML = `<img src="${existingImage.url}" alt="New avatar" class="avatar-image" />`;
          }
          
          // Show remove button
          if (removeBtn) {
            removeBtn.style.display = 'inline-flex';
          }
          
          showModalStatus(`✅ Avatar ready to save! (Reused, saved ${savings}%)`, 'success');
          return;
        }
      }
      
      showModalStatus('⏳ Uploading optimized avatar...', 'uploading');
      
      // Upload to Cloudinary (optimized blob, not original file!)
      const avatarUrl = await uploadToCloudinary(optimizedBlob, file.name);
      
      // ✅ Register new upload in global registry
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
      
      // Store for later save
      newAvatarUrl = avatarUrl;
      
      // Update preview immediately
      const previewContainer = document.getElementById('modal-avatar-preview');
      if (previewContainer) {
        previewContainer.innerHTML = `<img src="${avatarUrl}" alt="New avatar" class="avatar-image" />`;
      }
      
      // Show remove button
      if (removeBtn) {
        removeBtn.style.display = 'inline-flex';
      }
      
      showModalStatus(`✅ Avatar ready to save! (Saved ${savings}%)`, 'success');
      
    } catch (error) {
      console.error('Avatar upload failed:', error);
      showModalStatus(`❌ Upload failed: ${error.message}`, 'error');
    }
  });

  // Handle remove avatar
  if (removeBtn) {
    const newRemoveBtn = removeBtn.cloneNode(true);
    removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
    
    const finalRemoveBtn = document.getElementById('remove-avatar-btn');
    finalRemoveBtn.addEventListener('click', () => {
      if (confirm('Remove your avatar and use initials instead?')) {
        newAvatarUrl = 'REMOVE'; // Special flag
        
        // Show initials preview
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
  
  // Remove existing listener to prevent duplicates
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  // Character count for bio
  const bioInputNew = document.getElementById('edit-bio');
  bioInputNew.addEventListener('input', updateCharCount);
  
  // Form submission
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
  
  // Get form values
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

  // Add avatar if changed
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

  // Validate
  if (!updates.displayName) {
    showModalStatus('Display name is required', 'error');
    return;
  }

  try {
    // Disable button
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    showModalStatus('Saving changes...', 'uploading');

    // Get auth token
    const token = await getToken();
    
    // Update profile
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

    // Reset avatar state
    newAvatarUrl = null;
    
    showModalStatus('✓ Profile updated!', 'success');
    
    // Reload profile after 1 second
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('Failed to save profile:', error);
    showModalStatus(`✗ ${error.message}`, 'error');
    
    // Re-enable button
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