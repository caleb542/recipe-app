/**
 * SHARED HEADER COMPONENT
 * 
 * Loads header HTML from partial and injects it into pages
 * Ensures consistent navigation across all pages
 */
import { isSuperadmin } from '../userContext.js';

export async function loadHeader() {
  try {
    const response = await fetch('/partials/header-template.html');
    
    if (!response.ok) {
      throw new Error('Failed to load header template');
    }
    
    const headerHTML = await response.text();
    
    // Find or create header element
    let headerElement = document.querySelector('.page-container > header');
    
    if (!headerElement) {
      // Create header if it doesn't exist
      headerElement = document.createElement('header');
      const contentWrap = document.querySelector('.content-wrap') || document.body;
      contentWrap.insertBefore(headerElement, contentWrap.firstChild);
    }
    
    // Inject the header HTML
    headerElement.innerHTML = headerHTML;
    
    // ✅ NEW: Add admin link if user is superadmin
    addAdminLinkIfSuperadmin(headerElement);
    
    console.log('✓ Header loaded');
    return true;
    
  } catch (error) {
    console.error('Error loading header:', error);
    return false;
  }
}

/**
 * ✅ NEW: Add admin link to navigation if user is superadmin
 */
function addAdminLinkIfSuperadmin(headerElement) {
  if (!isSuperadmin()) return;
  
  // Find the navigation menu
  const nav = headerElement.querySelector('nav') || headerElement.querySelector('.nav-menu');
  
  if (!nav) {
    console.warn('Navigation element not found in header');
    return;
  }
  
  // Check if admin link already exists
  if (nav.querySelector('.admin-link')) return;
  
  // Create admin link
  const adminLink = document.createElement('a');
  adminLink.href = '/admin.html';
  adminLink.className = 'nav-link admin-link';
  adminLink.innerHTML = `
    <i class="fa-solid fa-shield-halved"></i>
    <span>Admin</span>
  `;
  
  // Add active state if on admin page
  if (window.location.pathname === '/admin.html' || window.location.pathname === '/admin') {
    adminLink.classList.add('active');
  }
  
  // Insert before logout button or at the end
  const logoutBtn = nav.querySelector('.logout-link') || nav.querySelector('[data-action="logout"]');
  
  if (logoutBtn) {
    nav.insertBefore(adminLink, logoutBtn);
  } else {
    nav.appendChild(adminLink);
  }
  
  console.log('✓ Admin link added to navigation');
}

/**
 * Initialize header with auth state and event listeners
 * Call this after loadHeader() and after auth initialization
 */
export function initHeader() {
  // This function is for any header-specific initialization
  // Auth UI updates are handled by updateAuthUI()
  // Role-based UI updates are handled by initRoleBasedUI()
  
  console.log('✓ Header initialized');
}