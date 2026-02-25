/**
 * ANIMATED MEGA MENU
 * Sanity-style: persistent container, content slides/fades
 */

let currentActivePanel = null;
let closeTimeout = null;
const CLOSE_DELAY = 300; // ms

/**
 * Setup animated mega menu
 */
export function setupAnimatedMegaMenu() {
  const navItems = document.querySelectorAll('.nav-item.has-dropdown');
  const container = document.querySelector('.mega-menu-container');
  const backdrop = document.querySelector('.mega-menu-backdrop');
  const navBar = document.querySelector('.nav-bar');
  
  if (!navItems.length || !container) {
    console.warn('Mega menu elements not found');
    return;
  }
  
  navItems.forEach(navItem => {
    const button = navItem.querySelector('.nav-link[aria-controls]');
    const panelId = button?.getAttribute('aria-controls');
    
    if (!button || !panelId) return;
    
    // Hover to open
    navItem.addEventListener('mouseenter', () => {
      clearTimeout(closeTimeout);
      openPanel(panelId);
    });
    
    // Click to toggle (for touch/keyboard)
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (currentActivePanel === panelId) {
        closeContainer();
      } else {
        openPanel(panelId);
      }
    });
    
    // Keyboard support
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPanel(panelId);
      }
      
      if (e.key === 'Escape') {
        closeContainer();
        button.focus();
      }
    });
  });
  
  // Keep open when hovering container
  container.addEventListener('mouseenter', () => {
    clearTimeout(closeTimeout);
  });
  
  // Close when leaving container
  container.addEventListener('mouseleave', () => {
    closeTimeout = setTimeout(closeContainer, CLOSE_DELAY);
  });
  
  // Close when leaving nav bar
  navBar.addEventListener('mouseleave', () => {
    closeTimeout = setTimeout(closeContainer, CLOSE_DELAY);
  });
  
  // Close on backdrop click
  backdrop.addEventListener('click', closeContainer);
  
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentActivePanel) {
      closeContainer();
    }
  });
  
  // Close when clicking links
  container.querySelectorAll('.mega-link').forEach(link => {
    link.addEventListener('click', closeContainer);
  });
  
  console.log('✓ Animated mega menu setup');
}

/**
 * Open a panel with slide animation
 */
function openPanel(panelId) {
  const container = document.querySelector('.mega-menu-container');
  const backdrop = document.querySelector('.mega-menu-backdrop');
  const newPanel = document.getElementById(panelId);
  const newButton = document.querySelector(`[aria-controls="${panelId}"]`);
  
  if (!newPanel || !container) return;
  
  // If switching panels, add exiting class to current
  if (currentActivePanel && currentActivePanel !== panelId) {
    const oldPanel = document.getElementById(currentActivePanel);
    if (oldPanel) {
      oldPanel.classList.add('is-exiting');
      oldPanel.classList.remove('is-active');
      
      // Remove exiting class after animation
      setTimeout(() => {
        oldPanel.classList.remove('is-exiting');
        oldPanel.setAttribute('hidden', '');
      }, 500);
    }
  }
  
  // Show container
  container.classList.add('is-active');
  backdrop.classList.add('is-visible');
  
  // Activate new panel
  newPanel.removeAttribute('hidden');
  // Small delay for smooth transition
  setTimeout(() => {
    newPanel.classList.add('is-active');
  }, 10);
  
  // Update button states
  document.querySelectorAll('.nav-link[aria-expanded]').forEach(btn => {
    btn.setAttribute('aria-expanded', 'false');
  });
  
  if (newButton) {
    newButton.setAttribute('aria-expanded', 'true');
  }
  
  currentActivePanel = panelId;
  
  console.log(`✓ Opened panel: ${panelId}`);
}

/**
 * Close the mega menu container
 */
function closeContainer() {
  const container = document.querySelector('.mega-menu-container');
  const backdrop = document.querySelector('.mega-menu-backdrop');
  
  if (!currentActivePanel) return;
  
  // Hide container
  container.classList.remove('is-active');
  backdrop.classList.remove('is-visible');
  
  // Deactivate current panel
  const activePanel = document.getElementById(currentActivePanel);
  if (activePanel) {
    activePanel.classList.remove('is-active');
    setTimeout(() => {
      activePanel.setAttribute('hidden', '');
    }, 400);
  }
  
  // Reset buttons
  document.querySelectorAll('.nav-link[aria-expanded]').forEach(btn => {
    btn.setAttribute('aria-expanded', 'false');
  });
  
  currentActivePanel = null;
  
  console.log('✓ Closed mega menu');
}

/**
 * Programmatic control
 */
export function openMegaMenu(panelId) {
  openPanel(panelId);
}

export function closeMegaMenu() {
  closeContainer();
}

export function getCurrentPanel() {
  return currentActivePanel;
}