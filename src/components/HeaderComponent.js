/**
 * SHARED HEADER COMPONENT
 * 
 * Loads header HTML from partial and injects it into pages
 * Ensures consistent navigation across all pages
 */
import { isSuperadmin } from '../userContext.js';
import { renderBadgeToggle } from './BadgeToggleButton.js';
// import { setupRichMegaMenu } from './RichMegaMenu.js';
// import { setupAnimatedMegaMenu } from './MegaMenuAnimated.js';
import { setupSanityMegaMenu } from './MegaMenuSanity.js';
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
    

    
    // ✅ Add admin link if user is superadmin
    addAdminLinkIfSuperadmin(headerElement);
    
    // console.log('✓ Header loaded');
        // ✅ Setup animated  mega menu interactions
    // setupSanityMegaMenu();
    return true;
    
  } catch (error) {
    console.error('Error loading header:', error);
    return false;
  }
}

/**
 * ✅ Add admin link to navigation if user is superadmin
 */
function addAdminLinkIfSuperadmin(headerElement) {
  if (!isSuperadmin()) return;
  
  // Find the navigation menu
  const navList = headerElement.querySelector('.nav-list');
  
  if (!navList) {
    console.warn('Navigation list not found in header');
    return;
  }
  
  // Check if admin link already exists
  if (navList.querySelector('.admin-link')) return;
  
  // Create admin nav item
  const adminItem = document.createElement('li');
  adminItem.className = 'nav-item';
  
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
  
  adminItem.appendChild(adminLink);
  
  // Insert before the last item (typically Create Recipe)
  const lastItem = navList.querySelector('li:last-child');
  if (lastItem) {
    navList.insertBefore(adminItem, lastItem);
  } else {
    navList.appendChild(adminItem);
  }
  
  console.log('✓ Admin link added to navigation');
}

/**
 * Inject badge visibility toggle into header
 * Call this after auth is initialized and updateAuthUI() has run
 */
export function injectBadgeToggle() {
  console.log('🔍 injectBadgeToggle() called');
  
  const userInfo = document.getElementById('user-info');
  console.log('🔍 userInfo element:', userInfo);
  
  if (!userInfo) {
    console.warn('⚠️ User info section not found');
    return;
  }
  
  // Check if toggle already exists
  const existingToggle = document.getElementById('badgeToggle');
  console.log('🔍 Existing toggle:', existingToggle);
  
  if (existingToggle) {
    console.log('⚠️ Badge toggle already exists, skipping injection');
    return;
  }
  
  // Get the toggle HTML
  const toggleHTML = renderBadgeToggle();
  console.log('🔍 toggleHTML from renderBadgeToggle():', toggleHTML);
  console.log('🔍 toggleHTML length:', toggleHTML?.length);
  
  if (toggleHTML) {
    // Create temporary container to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = toggleHTML;
    const toggleButton = temp.firstElementChild;
    console.log('🔍 Parsed toggle button element:', toggleButton);
    
    // Find the logout button
    const logoutBtn = userInfo.querySelector('#logout-btn');
    console.log('🔍 Logout button found:', logoutBtn);
    
    if (logoutBtn) {
      // Insert toggle BEFORE logout button
      userInfo.insertBefore(toggleButton, logoutBtn);
      console.log('✅ Badge toggle inserted before logout button');
    } else {
      // Fallback: append to user info
      userInfo.appendChild(toggleButton);
      console.log('✅ Badge toggle appended to user info (no logout button found)');
    }
    
    console.log('✓ Badge toggle injected into header');
  } else {
    console.warn('⚠️ renderBadgeToggle() returned empty string (user not authenticated?)');
  }
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