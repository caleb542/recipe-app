/**
 * RICH MEGA MENU HANDLER
 * Manages elegant multi-dropdown navigation with slide transitions
 */

let currentActiveMenu = null;
let menuCloseTimeout = null;
const MENU_CLOSE_DELAY = 300; // ms before closing when mouse leaves

/**
 * Setup rich mega menu interactions
 * Call this after header is loaded
 */
export function setupRichMegaMenu() {
  const navItems = document.querySelectorAll('.nav-item.has-dropdown');
  const megaMenu = document.querySelector('.rich-mega-menu');
  const backdrop = document.querySelector('.mega-menu-backdrop');
  const navBar = document.querySelector('.nav-bar');
  
  if (!navItems.length || !megaMenu) {
    console.warn('Rich mega menu elements not found');
    return;
  }
  
  // Setup hover interactions for each nav item
  navItems.forEach(navItem => {
    const trigger = navItem.querySelector('.mega-trigger');
    const menuId = navItem.getAttribute('data-menu');
    
    if (!trigger || !menuId) return;
    
    // Mouse enter nav item
    navItem.addEventListener('mouseenter', () => {
      clearTimeout(menuCloseTimeout);
      openMegaMenu(menuId, trigger);
    });
    
    // Click nav item (for keyboard/mobile)
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      
      if (isOpen && currentActiveMenu === menuId) {
        closeMegaMenu();
      } else {
        openMegaMenu(menuId, trigger);
      }
    });
  });
  
  // Keep menu open when hovering over the mega menu itself
  megaMenu.addEventListener('mouseenter', () => {
    clearTimeout(menuCloseTimeout);
  });
  
  // Close menu when leaving the mega menu
  megaMenu.addEventListener('mouseleave', () => {
    menuCloseTimeout = setTimeout(() => {
      closeMegaMenu();
    }, MENU_CLOSE_DELAY);
  });
  
  // Close menu when leaving nav bar
  navBar.addEventListener('mouseleave', () => {
    menuCloseTimeout = setTimeout(() => {
      closeMegaMenu();
    }, MENU_CLOSE_DELAY);
  });
  
  // Close on backdrop click
  backdrop.addEventListener('click', () => {
    closeMegaMenu();
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentActiveMenu) {
      closeMegaMenu();
      
      // Return focus to the trigger that opened it
      const activeTrigger = document.querySelector(`.mega-trigger[aria-expanded="true"]`);
      if (activeTrigger) {
        activeTrigger.focus();
      }
    }
  });
  
  // Close menu when clicking any link inside
  megaMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeMegaMenu();
    });
  });
  
  console.log('✓ Rich mega menu interactions setup');
}

/**
 * Open mega menu with slide transition
 */
function openMegaMenu(menuId, trigger) {
  const megaMenu = document.querySelector('.rich-mega-menu');
  const previousPanel = document.querySelector(`.mega-menu-panel[data-panel="${currentActiveMenu}"]`);
  const newPanel = document.querySelector(`.mega-menu-panel[data-panel="${menuId}"]`);
  
  if (!megaMenu || !newPanel) return;
  
  // If switching between menus, add exiting class to previous panel
  if (currentActiveMenu && currentActiveMenu !== menuId && previousPanel) {
    previousPanel.classList.add('exiting');
    
    // Remove exiting class after transition
    setTimeout(() => {
      previousPanel.classList.remove('exiting');
    }, 500);
  }
  
  // Update active menu
  currentActiveMenu = menuId;
  megaMenu.setAttribute('data-active-menu', menuId);
  
  // Update all triggers
  document.querySelectorAll('.mega-trigger').forEach(t => {
    t.setAttribute('aria-expanded', 'false');
  });
  
  // Set active trigger
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'true');
  }
  
  console.log(`✓ Opened mega menu: ${menuId}`);
}

/**
 * Close mega menu
 */
function closeMegaMenu() {
  const megaMenu = document.querySelector('.rich-mega-menu');
  
  if (!megaMenu || !currentActiveMenu) return;
  
  // Clear active menu
  megaMenu.setAttribute('data-active-menu', '');
  currentActiveMenu = null;
  
  // Reset all triggers
  document.querySelectorAll('.mega-trigger').forEach(trigger => {
    trigger.setAttribute('aria-expanded', 'false');
  });
  
  // Remove any exiting classes
  document.querySelectorAll('.mega-menu-panel').forEach(panel => {
    panel.classList.remove('exiting');
  });
  
  console.log('✓ Closed mega menu');
}

/**
 * Get current active menu ID
 */
export function getCurrentActiveMenu() {
  return currentActiveMenu;
}

/**
 * Programmatically open a specific menu
 * Useful for deep linking or initial states
 */
export function openSpecificMenu(menuId) {
  const navItem = document.querySelector(`.nav-item[data-menu="${menuId}"]`);
  const trigger = navItem?.querySelector('.mega-trigger');
  
  if (trigger) {
    openMegaMenu(menuId, trigger);
  }
}

/**
 * Programmatically close the menu
 */
export function closeMegaMenuProgrammatically() {
  closeMegaMenu();
}