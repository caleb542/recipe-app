/**
 * Badge Visibility Utility
 * Manages the show/hide state of recipe badges across the site
 * Uses localStorage for persistence and body class for CSS control
 * 
 * Location: /src/utils/badgeVisibility.js
 */

const STORAGE_KEY = 'recipeme_badges_visible';
const BODY_CLASS = 'badges-hidden';

/**
 * Initialize badge visibility on page load
 * Should be called early in page lifecycle before rendering badges
 * Call this at the top of every page's init function
 * 
 * @returns {boolean} Current visibility state
 */
export function initBadgeVisibility() {
  const isVisible = getBadgeVisibility();
  
  if (!isVisible) {
    document.body.classList.add(BODY_CLASS);
  } else {
    document.body.classList.remove(BODY_CLASS);
  }
  
  return isVisible;
}

/**
 * Get current badge visibility state from localStorage
 * 
 * @returns {boolean} true if badges should be visible, false if hidden
 */
export function getBadgeVisibility() {
  const stored = localStorage.getItem(STORAGE_KEY);
  
  // Default to true (show badges) if not set
  if (stored === null) {
    return true;
  }
  
  return stored === 'true';
}

/**
 * Set badge visibility state
 * Updates both localStorage and body class
 * 
 * @param {boolean} isVisible - true to show badges, false to hide
 */
export function setBadgeVisibility(isVisible) {
  localStorage.setItem(STORAGE_KEY, isVisible.toString());
  
  if (isVisible) {
    document.body.classList.remove(BODY_CLASS);
  } else {
    document.body.classList.add(BODY_CLASS);
  }
}

/**
 * Toggle badge visibility
 * Flips the current state and updates accordingly
 * 
 * @returns {boolean} New visibility state after toggle
 */
export function toggleBadgeVisibility() {
  const currentState = getBadgeVisibility();
  const newState = !currentState;
  setBadgeVisibility(newState);
  return newState;
}

/**
 * Check if badges are currently hidden
 * 
 * @returns {boolean} true if hidden, false if visible
 */
export function areBadgesHidden() {
  return !getBadgeVisibility();
}