// profile.js - User profile page
import './style.scss'; 
import { initAuth0 } from './auth/auth0.js';
import { loadUserProfile, getUserProfile } from './userContext.js';

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
        </div>
        <div class="profile-info">
          <h1 class="profile-display-name">${escapeHtml(profile.profile.displayName)}</h1>
          <p class="profile-username">@${escapeHtml(profile.username)}</p>
          ${profile.profile.location ? `
            <p class="profile-location">📍 ${escapeHtml(profile.profile.location)}</p>
          ` : ''}
          ${isOwnProfile ? `
            <button class="btn-edit-profile" onclick="editProfile()">Edit Profile</button>
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
  `;
}

function getAvatarHTML(avatar, displayName) {
  if (avatar.type === 'initials') {
    return `<div class="avatar-initials">${avatar.initials}</div>`;
  }
  if (avatar.url) {
    return `<img src="${avatar.url}" alt="${escapeHtml(displayName)}" />`;
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

// Global function for edit button
window.editProfile = function() {
  // TODO: Show edit profile modal
  alert('Edit profile modal coming soon!');
};

// Initialize
init();