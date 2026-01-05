/**
 * SHARED HEADER COMPONENT
 * 
 * Loads header HTML from partial and injects it into pages
 * Ensures consistent navigation across all pages
 */

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
    
    console.log('✓ Header loaded');
    return true;
    
  } catch (error) {
    console.error('Error loading header:', error);
    return false;
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