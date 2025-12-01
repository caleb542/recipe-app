/**
 * Accessibility helpers for dialogs and focus management
 */

let lastFocused = null;

/**
 * Store the last focused element before opening a modal
 */
export function rememberFocus() {
  lastFocused = document.activeElement;
}

/**
 * Restore focus to the last element after closing a modal
 */
export function restoreFocus() {
  if (lastFocused) {
    lastFocused.focus();
    lastFocused = null;
  }
}

/**
 * Setup accessibility for ingredient modal
 */
export function setupIngredientModalAccessibility() {
  const modal = document.getElementById('ingredient-modal');
  const closeBtn = document.getElementById('close-ingredient-modal');

  if (closeBtn) {
    closeBtn.addEventListener('click', e => {
      e.preventDefault();
      modal.close("Cancelled");
      restoreFocus();
    });
  }
}

/**
 * Setup accessibility for directions modal
 */
export function setupDirectionsModalAccessibility() {
  const modal = document.getElementById('add-directions');
  const closeBtns = modal.querySelectorAll('.dialog-close-button');

  closeBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      modal.close("Cancelled");
      restoreFocus();
    });
  });
}

/**
 * General accessibility setup
 */
export function setupAccessibility() {
  setupIngredientModalAccessibility();
  setupDirectionsModalAccessibility();

  // Example: ensure menu toggle has correct aria-expanded state
  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', e => {
      e.preventDefault();
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !expanded);
      nav.classList.toggle('hide');
    });
  }
}
