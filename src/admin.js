// admin.js
// Admin panel for managing users and recipes

import { initAuth0, isAuthenticated, getUser, getToken } from './auth/auth0.js';
import { loadUserProfile, isSuperadmin, startImpersonation } from './userContext.js';
import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { loadHeader } from './components/HeaderComponent.js';
import { initImpersonationBanner } from './components/ImpersonationBanner.js';
import { loadRecipes } from './functions.js';
import { getFeaturedImage } from './functions.js';
import { hideWarning } from './functions.js';

// Initialize
await loadHeader();
hideWarning();
await initAuth0();
await loadUserProfile();
await updateAuthUI();
setupAuthListeners();
initImpersonationBanner();

// Check if user is superadmin
if (!isSuperadmin()) {
  alert('Access denied. Superadmin privileges required.');
  window.location.href = '/index.html';
}

console.log('🛡️ Admin panel loaded');

// State
let allUsers = [];
let allRecipes = [];

// Load data on init
async function init() {
  await Promise.all([
    loadUsers(),
    loadAllRecipes(),
    loadStats()
  ]);
  
  setupTabs();
  setupSearch();
}

/**
 * Load all users from database
 */
async function loadUsers() {
  try {
    const token = await getToken();
    const response = await fetch('/.netlify/functions/admin-list-users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load users');
    }
    
    allUsers = await response.json();
    renderUsersList(allUsers);
    
  } catch (error) {
    console.error('Error loading users:', error);
    document.getElementById('users-list').innerHTML = `
      <tr>
        <td colspan="6" class="error-message">
          <i class="fa-solid fa-exclamation-triangle"></i>
          Failed to load users. ${error.message}
        </td>
      </tr>
    `;
  }
}

/**
 * Load all recipes (published + unpublished)
 */
async function loadAllRecipes() {
  try {
    // Load from localStorage first
    allRecipes = await loadRecipes();
    
    renderAllRecipes(allRecipes);
    renderDraftRecipes(allRecipes.filter(r => !r.isPublic));
    
  } catch (error) {
    console.error('Error loading recipes:', error);
  }
}

/**
 * Load stats
 */
async function loadStats() {
  const totalUsers = allUsers.length;
  const totalRecipes = allRecipes.length;
  const published = allRecipes.filter(r => r.isPublic).length;
  const drafts = allRecipes.filter(r => !r.isPublic).length;
  
  document.getElementById('total-users').textContent = totalUsers;
  document.getElementById('total-recipes').textContent = totalRecipes;
  document.getElementById('published-recipes').textContent = published;
  document.getElementById('draft-recipes').textContent = drafts;
}

/**
 * Render users list
 */
function renderUsersList(users) {
  const tbody = document.getElementById('users-list');
  
  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-message">No users found</td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = users.map(user => {
    const recipeCount = allRecipes.filter(r => r.author?.auth0Id === user.auth0Id).length;
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
    const displayName = user.profile?.displayName || user.name || 'Unknown';
    
    return `
      <tr>
        <td>
          <div class="user-cell">
            ${renderAvatar(user)}
            <div>
              <div class="user-name">${displayName}</div>
              ${user.isSuperadmin ? '<span class="badge superadmin">Superadmin</span>' : ''}
            </div>
          </div>
        </td>
        <td>${user.email}</td>
        <td><code>${user.username}</code></td>
        <td>${recipeCount}</td>
        <td>${joinDate}</td>
        <td>
          <button 
            class="btn-impersonate" 
            data-user='${JSON.stringify(user).replace(/'/g, "&apos;")}'
            title="View site as this user"
          >
            <i class="fa-solid fa-masks-theater"></i>
            Impersonate
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  // Wire up impersonate buttons
  document.querySelectorAll('.btn-impersonate').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const userData = JSON.parse(e.currentTarget.dataset.user);
      await handleImpersonate(userData);
    });
  });
}

/**
 * Render avatar
 */
function renderAvatar(user) {
  if (user.avatar?.type === 'initials') {
    return `<div class="avatar avatar-initials">${user.avatar.initials}</div>`;
  }
  
  if (user.avatar?.url) {
    return `<img src="${user.avatar.url}" class="avatar" alt="${user.name}" />`;
  }
  
  // Fallback initials
  const initials = (user.name || user.email || '??')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return `<div class="avatar avatar-initials">${initials}</div>`;
}

/**
 * Render all recipes
 */
function renderAllRecipes(recipes) {
  const container = document.getElementById('all-recipes-list');
  
  if (recipes.length === 0) {
    container.innerHTML = '<p class="empty-message">No recipes found</p>';
    return;
  }
  
  container.innerHTML = recipes.map(recipe => renderRecipeCard(recipe)).join('');
}

/**
 * Render draft recipes
 */
function renderDraftRecipes(recipes) {
  const container = document.getElementById('drafts-list');
  
  if (recipes.length === 0) {
    container.innerHTML = '<p class="empty-message">No unpublished recipes</p>';
    return;
  }
  
  container.innerHTML = recipes.map(recipe => renderRecipeCard(recipe)).join('');
}

/**
 * Render recipe card
 */
function renderRecipeCard(recipe) {
  const featuredImage = getFeaturedImage(recipe);
  const imageUrl = featuredImage?.url || '/images/placeholder.jpg';
  const authorName = recipe.displayAuthor || recipe.author?.name || 'Unknown';
  const recipeUrl = recipe.fullSlug ? `/${recipe.fullSlug}` : `/article.html#${recipe.id}`;
  
  return `
    <div class="recipe-card">
      <div class="recipe-image" style="background-image: url(${imageUrl})">
        ${!recipe.isPublic ? '<span class="draft-badge">DRAFT</span>' : ''}
      </div>
      <div class="recipe-content">
        <h3>${recipe.name}</h3>
        <p class="recipe-author">by ${authorName}</p>
        <div class="recipe-actions">
          <a href="${recipeUrl}" class="btn-view">
            <i class="fa-solid fa-eye"></i> View
          </a>
          <a href="/edit.html#${recipe.id}" class="btn-edit">
            <i class="fa-solid fa-pen"></i> Edit
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Handle impersonate action
 */
async function handleImpersonate(user) {
  const confirmMsg = `Start impersonating ${user.username}?\n\nYou will see the site exactly as they see it, but any edits will be credited to them.`;
  
  if (!confirm(confirmMsg)) return;
  
  try {
    await startImpersonation(user);
  } catch (error) {
    console.error('Impersonation failed:', error);
    alert(`Failed to impersonate user: ${error.message}`);
  }
}

/**
 * Setup tab switching
 */
function setupTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPanel = tab.dataset.tab;
      
      // Update active states
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`${targetPanel}-panel`).classList.add('active');
    });
  });
}

/**
 * Setup search
 */
function setupSearch() {
  // User search
  const userSearch = document.getElementById('user-search');
  if (userSearch) {
    userSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = allUsers.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query)
      );
      renderUsersList(filtered);
    });
  }
  
  // Recipe search
  const recipeSearch = document.getElementById('recipe-search');
  if (recipeSearch) {
    recipeSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = allRecipes.filter(recipe =>
        recipe.name?.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.author?.name?.toLowerCase().includes(query)
      );
      renderAllRecipes(filtered);
    });
  }
}

// Initialize
init();