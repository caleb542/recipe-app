/**
 * Badge Visibility Toggle Button Component
 * Renders an eye icon button that toggles badge visibility
 * Only shows for authenticated users
 * 
 * Location: /src/components/BadgeToggleButton.js
 */

import { toggleBadgeVisibility, getBadgeVisibility } from '../utils/badgeVisibility.js';
import { isAuthenticated } from '../auth/auth0.js';

/**
 * Render the badge visibility toggle button for the header
 * Returns empty string if user is not authenticated
 * 
 * @returns {string} HTML string for the toggle button
 */
export function renderBadgeToggle() {
  // Only show for authenticated users
  if (!isAuthenticated()) {
    return '';
  }
  

  const isVisible = getBadgeVisibility();

  const icon = isVisible ? 'fa-eye' : 'fa-eye-slash';
  const tooltip = isVisible ? 'Hide recipe badges' : 'Show recipe badges';
  
  return `
    <button 
      class="badge-visibility-toggle" 
      id="badgeToggle"
      data-tooltip="${tooltip}"
      aria-label="${tooltip}"
      title="${tooltip}"
    >
      <i class="fa-solid ${icon}"></i>
    </button>
  `;
}

/**
 * Initialize the badge toggle button event listener
 * Call this after the header has been rendered to the DOM
 * Attaches click handler that toggles visibility and updates icon
 */
export function initBadgeToggle() {
  const toggleButton = document.getElementById('badgeToggle');
  
  if (!toggleButton) {
    return;
  }
  
  toggleButton.addEventListener('click', () => {
    const newState = toggleBadgeVisibility();
    updateToggleButton(toggleButton, newState);
  });
}

/**
 * Update the toggle button's icon and tooltip based on new state
 * 
 * @param {HTMLElement} button - The toggle button element
 * @param {boolean} isVisible - New visibility state (true = visible, false = hidden)
 */
function updateToggleButton(button, isVisible) {
  const icon = button.querySelector('i');
  const newIcon = isVisible ? 'fa-eye' : 'fa-eye-slash';
  const tooltip = isVisible ? 'Hide recipe badges' : 'Show recipe badges';
  
  // Update Font Awesome icon class
  icon.className = `fa-solid ${newIcon}`;
  
  // Update tooltip and accessibility attributes
  button.setAttribute('data-tooltip', tooltip);
  button.setAttribute('aria-label', tooltip);
  button.setAttribute('title', tooltip);
}