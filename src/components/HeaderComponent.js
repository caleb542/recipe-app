/**
 * SHARED HEADER COMPONENT
 * 
 * Loads header HTML from partial and injects it into pages
 * Ensures consistent navigation across all pages
 */
import { buildNav, setupSanityMegaMenu,setupEdgeWarning } from './MegaMenuSanity.js';
import { isSuperadmin } from '../userContext.js';
import { buildMobileNav } from './MobileNav.js';
import { isAuthenticated, login } from '../auth/auth0.js';


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
  headerElement = document.createElement('header');
  const pageContainer = document.querySelector('.page-container');
  if (pageContainer) {
    pageContainer.insertBefore(headerElement, pageContainer.firstChild);
  } else {
    document.body.insertBefore(headerElement, document.body.firstChild);
  }
}

// Inject the header HTML
headerElement.innerHTML = headerHTML;

// Inject mobile overlay as direct child of body
if(document.getElementById('nav-overlay')){
  const overlay = document.getElementById('nav-overlay')
  overlay.id = 'nav-overlay';
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', () => {
    const toggle = document.getElementById('menu-toggle');
    if (toggle) toggle.click();
  });
}
  
  
    // Add admin link if superadmin
    addAdminLinkIfSuperadmin(headerElement);

    // Build nav from DB then setup interactions
    await buildNav();
    setupSanityMegaMenu();
    setupEdgeWarning();
    
    
    const addRecipeBtn = document.getElementById('create-recipe-link');
    addRecipeBtn?.addEventListener('click', async () => {
  
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        showAuthNotice();
        return;
      }
      window.location.href = '/edit.html';
    });
    await buildMobileNav();
    
    return true;
    
  } catch (error) {
    console.error('Error loading header:', error);
    return false;
  }
}

/**
 * Add admin link to navigation if user is superadmin
 */
function addAdminLinkIfSuperadmin(headerElement) {
  if (!isSuperadmin()) return;
  
  const navList = headerElement.querySelector('.nav-list');
  
  if (!navList) {
    console.warn('Navigation list not found in header');
    return;
  }
  
  if (navList.querySelector('.admin-link')) return;
  
  const adminItem = document.createElement('li');
  adminItem.className = 'nav-item';
  
  const adminLink = document.createElement('a');
  adminLink.href = '/admin.html';
  adminLink.className = 'nav-link admin-link';
  adminLink.innerHTML = `
    <i class="fa-solid fa-shield-halved"></i>
    <span>Admin</span>
  `;
  
  if (window.location.pathname === '/admin.html' || window.location.pathname === '/admin') {
    adminLink.classList.add('active');
  }
  
  adminItem.appendChild(adminLink);
  
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
  
  const existingToggle = document.getElementById('badgeToggle');
  console.log('🔍 Existing toggle:', existingToggle);
  
  if (existingToggle) {
    console.log('⚠️ Badge toggle already exists, skipping injection');
    return;
  }
  
  const toggleHTML = renderBadgeToggle();
  console.log('🔍 toggleHTML from renderBadgeToggle():', toggleHTML);
  console.log('🔍 toggleHTML length:', toggleHTML?.length);
  
  if (toggleHTML) {
    const temp = document.createElement('div');
    temp.innerHTML = toggleHTML;
    const toggleButton = temp.firstElementChild;
    console.log('🔍 Parsed toggle button element:', toggleButton);
    
    const logoutBtn = userInfo.querySelector('#logout-btn');
    console.log('🔍 Logout button found:', logoutBtn);
    
    if (logoutBtn) {
      userInfo.insertBefore(toggleButton, logoutBtn);
      console.log('✅ Badge toggle inserted before logout button');
    } else {
      userInfo.appendChild(toggleButton);
      console.log('✅ Badge toggle appended to user info (no logout button found)');
    }
    
    console.log('✓ Badge toggle injected into header');
  } else {
    console.warn('⚠️ renderBadgeToggle() returned empty string (user not authenticated?)');
  }
}
/**
 * Show dev notice banner after spinner disappears
 * Only shows if not previously dismissed
 */
export function showDevNotice() {
  const banner = document.querySelector('.dev-notice');
  if (!banner) return;
  if (localStorage.getItem('warning-notification-hidden') === 'true') return;
  banner.classList.add('animate');
}
/**
 * Initialize header with auth state and event listeners
 */
export function initHeader() {
  console.log('✓ Header initialized');
}

export function showAuthNotice() {
  const dialog = document.getElementById('auth-notice-dialog');
  if (!dialog) return;

  dialog.showModal();

  document.getElementById('auth-notice-login')?.addEventListener('click', () => {
    dialog.close();
    login();
  }, { once: true });

  document.getElementById('auth-notice-cancel')?.addEventListener('click', () => {
    dialog.close();
  }, { once: true });
}

export function showEditButton(recipeId) {
  const container = document.getElementById('header-edit-action');
  if (!container) return;

  container.innerHTML = `
    <a href="/edit.html#${recipeId}" class="header-edit-btn">
      <i class="fa-solid fa-pen-to-square"></i><span class="hide-on-mobile">Edit Recipe</span>
    </a>
  `;
}
