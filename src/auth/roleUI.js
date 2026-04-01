/**
 * UI HELPERS FOR ROLE-BASED FEATURES
 * 
 * Functions to show/hide UI elements based on user permissions
 */

import { getUserProfile } from '../userContext.js';
import { 
  canEditRecipe, 
  canDeleteRecipe, 
  isSuperAdmin,
  isAdmin,
  getRoleDisplayName 
} from './roles.js';

/**
 * Show/hide edit button on recipe cards
 * @param {Object} recipe - Recipe object
 */
export const toggleEditButton = (recipe) => {
  const user = getUserProfile();
  const editButton = document.querySelector(`[data-recipe-id="${recipe._id}"] .edit-button`);
  
  if (!editButton) return;
  
  if (canEditRecipe(user, recipe)) {
    editButton.style.display = 'inline-flex';
  } else {
    editButton.style.display = 'none';
  }
};

/**
 * Show/hide delete button
 * @param {Object} recipe - Recipe object
 */
export const toggleDeleteButton = (recipe) => {
  const user = getUserProfile();
  const deleteButton = document.querySelector(`[data-recipe-id="${recipe._id}"] .delete-button`);
  
  if (!deleteButton) return;
  
  if (canDeleteRecipe(user, recipe)) {
    deleteButton.style.display = 'inline-flex';
  } else {
    deleteButton.style.display = 'none';
  }
};

/**
 * Show admin badge in header if user is admin
 */
export const showAdminBadge = () => {
  const user = getUserProfile();
  const userInfoSection = document.getElementById('user-info');
  
  if (!userInfoSection || !user) return;
  
  // Remove existing badge
  const existingBadge = document.querySelector('.admin-badge');
  if (existingBadge) existingBadge.remove();
  
  // Add badge if admin or superadmin
  if (isAdmin(user) || isSuperAdmin(user)) {
    const badge = document.createElement('a');
    badge.href="/admin";
    badge.className = 'admin-badge';
    badge.textContent = getRoleDisplayName(user);
    badge.style.cssText = `
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-left: 0.5rem;
    `;
    userInfoSection.appendChild(badge);
  }
};

/**
 * Add superadmin indicator to recipe cards for recipes you can edit but don't own
 * @param {Object} recipe - Recipe object
 * @param {HTMLElement} cardElement - Card DOM element
 */
export const addSuperadminIndicator = (recipe, cardElement) => {
  const user = getUserProfile();
  
  if (!user || !cardElement) return;
  
  const isOwner = recipe.author?.auth0Id === user.auth0Id;
  const canEdit = canEditRecipe(user, recipe);
  
  // Only show indicator if user can edit but doesn't own
  if (canEdit && !isOwner && isSuperAdmin(user)) {
    const indicator = document.createElement('div');
    indicator.className = 'superadmin-edit-indicator';
    indicator.innerHTML = '<i class="fa fa-crown"></i> Can Edit';
    indicator.style.cssText = `
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(245, 158, 11, 0.9);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    `;
    cardElement.style.position = 'relative';
    cardElement.appendChild(indicator);
  }
};

/**
 * Update all UI elements based on current user permissions
 */
export const updateRoleBasedUI = () => {
  // showAdminBadge();
  
  // You can add more UI updates here as needed
  // For example, showing/hiding admin menu items, etc.
};

/**
 * Initialize role-based UI on page load
 */
export const initRoleBasedUI = () => {
  const user = getUserProfile();
  
  if (!user) return;
  
  updateRoleBasedUI();
  
  // Log role for debugging
  console.log('User role:', user.role || 'user (default)');
  if (isSuperAdmin(user)) {
    console.log('🔑 Superadmin access enabled');
  }
};
