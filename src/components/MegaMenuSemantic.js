/**
 * SEMANTIC MEGA MENU HANDLER
 * Simple click/keyboard handling for semantically nested mega menus
 * Hover is handled purely by CSS
 */

/**
 * Setup mega menu interactions
 * Call this after header is loaded
 */
export function setupMegaMenu() {
  const navItems = document.querySelectorAll('.nav-item.has-dropdown');
  
  if (!navItems.length) {
    console.warn('No dropdown nav items found');
    return;
  }
  
  navItems.forEach(navItem => {
    const button = navItem.querySelector('.nav-link[aria-expanded]');
    const panel = navItem.querySelector('.mega-menu-panel');
    
    if (!button || !panel) return;
    
    // Click to toggle (for touch devices / explicit clicks)
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      
      // Close all other menus first
      closeAllMenus();
      
      if (!isExpanded) {
        // Open this menu
        button.setAttribute('aria-expanded', 'true');
        panel.removeAttribute('hidden');
      }
    });
    
    // Keyboard navigation
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
      
      if (e.key === 'Escape') {
        button.setAttribute('aria-expanded', 'false');
        panel.setAttribute('hidden', '');
        button.focus();
      }
    });
    
    // Close when clicking links inside
    panel.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        button.setAttribute('aria-expanded', 'false');
        panel.setAttribute('hidden', '');
      });
    });
  });
  
  // Close all menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item.has-dropdown')) {
      closeAllMenus();
    }
  });
  
  // Close all menus on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllMenus();
    }
  });
  
  console.log('✓ Mega menu interactions setup');
}

/**
 * Close all mega menus
 */
function closeAllMenus() {
  document.querySelectorAll('.nav-link[aria-expanded="true"]').forEach(button => {
    button.setAttribute('aria-expanded', 'false');
  });
  
  document.querySelectorAll('.mega-menu-panel').forEach(panel => {
    panel.setAttribute('hidden', '');
  });
}

/**
 * Programmatically open a specific menu
 */
export function openMenu(menuId) {
  const panel = document.getElementById(menuId);
  const button = document.querySelector(`[aria-controls="${menuId}"]`);
  
  if (button && panel) {
    closeAllMenus();
    button.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('hidden');
  }
}

/**
 * Programmatically close all menus
 */
export function closeMenus() {
  closeAllMenus();
}