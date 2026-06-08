/**
 * editModal.js
 * Single reusable dialog for all edit section cards.
 * Cards are pure preview tiles — clicking opens this modal.
 *
 * Flow:
 *   click card → snapshot LS → inject content → showModal()
 *   input/change → write to LS → flash draft indicator
 *   Done / Escape / click backdrop → update preview → close()
 *   Revert → restore snapshot → update preview → close()
 */

import {
  updateIdentitySummary,
  updateDescriptionSummary,
  updateImagesSummary,
  updateIngredientsSummary,
  updateDirectionsSummary,
  updateCategoriesSummary,
  updateTagsSummary,
  updateArticleSummary,
  updateEditorialSummary,
  markUnsaved,
} from './editAccordion.js';

// ----------------------------------------
// CARD REGISTRY
// Maps card-id → { label, icon, contentSelector }
// contentSelector points to the hidden form content
// that gets moved into the modal on open
// ----------------------------------------
const CARD_REGISTRY = {
  'card-identity': {
    label: 'Identity',
    icon: 'fa-solid fa-pen',
    contentId: 'modal-content-identity',
  },
  'card-description': {
    label: 'Description',
    icon: 'fa-solid fa-align-left',
    contentId: 'modal-content-description',
  },
  'card-images': {
    label: 'Images',
    icon: 'fa-solid fa-image',
    contentId: 'modal-content-images',
  },
  'card-article': {
    label: 'Article',
    icon: 'fa-solid fa-newspaper',
    contentId: 'modal-content-article',
  },
  'card-ingredients': {
    label: 'Ingredients',
    icon: 'fa-solid fa-list',
    contentId: 'modal-content-ingredients',
  },
  'card-directions': {
    label: 'Directions',
    icon: 'fa-solid fa-list-ol',
    contentId: 'modal-content-directions',
  },
  'card-categories': {
    label: 'Categories',
    icon: 'fa-solid fa-table-cells',
    contentId: 'modal-content-categories',
  },
  'card-tags': {
    label: 'Tags',
    icon: 'fa-solid fa-tag',
    contentId: 'modal-content-tags',
  },
  'card-times': {
    label: 'Times & Author',
    icon: 'fa-solid fa-clock',
    contentId: 'modal-content-times',
  },
  'card-video': {
    label: 'Video',
    icon: 'fa-brands fa-youtube',
    contentId: 'modal-content-video',
  },
};

// ----------------------------------------
// STATE
// ----------------------------------------
let _dialog = null;
let _currentCardId = null;
let _snapshot = null;       // LS state at modal open
let _draftTimer = null;     // debounce for draft indicator
let _hasChangedSinceOpen = false;

// ----------------------------------------
// DRAFT INDICATOR
// Flashes "Draft saved" after input settles
// ----------------------------------------
function flashDraftSaved() {
  const indicator = _dialog?.querySelector('.em-draft-indicator');
  if (!indicator) return;

  // Clear pending timer
  clearTimeout(_draftTimer);

  // Show saving state immediately
  indicator.textContent = 'Saving draft…';
  indicator.classList.remove('is-saved');
  indicator.classList.add('is-saving');

  // After 400ms debounce, show saved
  _draftTimer = setTimeout(() => {
    indicator.textContent = 'Draft saved';
    indicator.classList.remove('is-saving');
    indicator.classList.add('is-saved');

    // Fade back after 3s
    setTimeout(() => {
      indicator.classList.remove('is-saved');
      indicator.textContent = 'Auto-saved to draft';
    }, 3000);
  }, 400);

  _hasChangedSinceOpen = true;
  updateRevertButton();
}

// ----------------------------------------
// REVERT BUTTON — only visible when changed
// ----------------------------------------
function updateRevertButton() {
  const revertBtn = _dialog?.querySelector('.em-revert-btn');
  if (!revertBtn) return;
  revertBtn.hidden = !_hasChangedSinceOpen;
}

// ----------------------------------------
// GET CURRENT RECIPE FROM LS
// ----------------------------------------
function getCurrentRecipe() {
  try {
    return JSON.parse(localStorage.getItem('editingRecipe')) || {};
  } catch {
    return {};
  }
}

// ----------------------------------------
// UPDATE PREVIEW FOR CLOSED CARD
// ----------------------------------------
function updateCardPreview(cardId) {
  const recipe = getCurrentRecipe();

  switch (cardId) {
    case 'card-identity':
      updateIdentitySummary(recipe);
      break;
    case 'card-description':
      updateDescriptionSummary(recipe.description || '');
      break;
    case 'card-images':
      updateImagesSummary(recipe.images || []);
      break;
    case 'card-article':
      updateArticleSummary(recipe.article || recipe.articleHTML || '');
      break;
    case 'card-ingredients':
      updateIngredientsSummary(recipe.ingredients || []);
      break;
    case 'card-directions':
      updateDirectionsSummary(recipe.directions || []);
      break;
    case 'card-categories':
      updateCategoriesSummary(recipe.categories || []);
      // Also update identity pills since categories show there too
      updateIdentitySummary(recipe);
      break;
    case 'card-tags':
      updateTagsSummary(recipe.tags || []);
      break;
    case 'card-times':
      updateEditorialSummary(recipe);
      break;
    case 'card-video':
      // no dedicated preview updater yet
      break;
  }
}

// ----------------------------------------
// CLOSE MODAL
// ----------------------------------------
function closeModal() {
  if (!_dialog) return;

  // Move content back to its stash before closing
  const cardId = _currentCardId;
  const config = CARD_REGISTRY[cardId];
  if (config) {
    const stash = document.getElementById(config.contentId);
    const modalBody = _dialog.querySelector('.em-body');
    if (stash && modalBody && modalBody.firstChild) {
      stash.appendChild(modalBody.firstChild);
    }
  }

  _dialog.close();

  // Update bento card preview
  if (cardId) updateCardPreview(cardId);

  // Mark main save button as having changes
  if (_hasChangedSinceOpen) markUnsaved();

  _currentCardId = null;
  _snapshot = null;
  _hasChangedSinceOpen = false;
}

// ----------------------------------------
// OPEN MODAL
// ----------------------------------------
export function openModal(cardId) {
  const config = CARD_REGISTRY[cardId];
  if (!config) return;

  _dialog = document.getElementById('edit-section-modal');
  if (!_dialog) return;

  _currentCardId = cardId;
  _hasChangedSinceOpen = false;

  // Snapshot current LS state for potential revert
  _snapshot = JSON.parse(localStorage.getItem('editingRecipe') || '{}');

  // Set header label + icon
  const labelEl = _dialog.querySelector('.em-title-text');
  const iconEl = _dialog.querySelector('.em-title-icon');
  if (labelEl) labelEl.textContent = config.label;
  if (iconEl) iconEl.className = `${config.icon} em-title-icon`;

  // Reset draft indicator
  const indicator = _dialog.querySelector('.em-draft-indicator');
  if (indicator) {
    indicator.textContent = 'Auto-saved to draft';
    indicator.classList.remove('is-saving', 'is-saved');
  }

  // Hide revert button initially
  updateRevertButton();

  // Move form content from stash into modal body
  const stash = document.getElementById(config.contentId);
  const modalBody = _dialog.querySelector('.em-body');
  if (stash && modalBody) {
    modalBody.innerHTML = '';
    modalBody.appendChild(stash.firstElementChild || stash);
  }

  _dialog.showModal();

  if (cardId === 'card-video') {
  window._videoModalInit?.();
}

  // Focus first focusable element
  setTimeout(() => {
    const first = _dialog.querySelector('input, textarea, select, button:not(.em-close-btn):not(.em-done-btn)');
    first?.focus();
  }, 50);
}

// ----------------------------------------
// REVERT
// ----------------------------------------
function revertChanges() {
  if (!_snapshot) return;

  localStorage.setItem('editingRecipe', JSON.stringify(_snapshot));

  const indicator = _dialog?.querySelector('.em-draft-indicator');
  if (indicator) {
    indicator.textContent = 'Reverted to previous state';
    indicator.classList.add('is-saved');
    setTimeout(() => {
      indicator.classList.remove('is-saved');
      indicator.textContent = 'Auto-saved to draft';
    }, 2000);
  }

  _hasChangedSinceOpen = false;
  updateRevertButton();

  // Re-populate visible form fields from reverted state
  // Fields module handles this, but we need to trigger a re-read
  // For now, close and reopen — or just close and let preview reflect snapshot
  closeModal();
}

// ----------------------------------------
// SETUP — call once after DOM is ready
// ----------------------------------------
export function setupEditModal() {
  _dialog = document.getElementById('edit-section-modal');
  if (!_dialog) {
    console.warn('edit-section-modal not found');
    return;
  }

  // Done button
  _dialog.querySelector('.em-done-btn')?.addEventListener('click', closeModal);

  // Close (✕) button
  _dialog.querySelector('.em-close-btn')?.addEventListener('click', closeModal);

  // Revert button
  _dialog.querySelector('.em-revert-btn')?.addEventListener('click', revertChanges);

  // Click backdrop to close
  _dialog.addEventListener('click', (e) => {
    if (e.target === _dialog) closeModal();
  });

  // Escape key — browser fires 'cancel' on dialog
  _dialog.addEventListener('cancel', (e) => {
    e.preventDefault(); // prevent default close, use our close
    closeModal();
  });

  // Draft indicator — listen to ALL input/change inside modal body
  _dialog.addEventListener('input', flashDraftSaved);
  _dialog.addEventListener('change', flashDraftSaved);

  // Wire bento cards — click header opens modal
  // document.querySelectorAll('.edit-card:not(.edit-card--placeholder)').forEach(card => {
  //   const header = card.querySelector('.edit-card__header');
  //   if (!header) return;

  //   // Skip quick-add card — it uses accordion
  //   if (card.id === 'card-quick-add') return;

  //   header.addEventListener('click', (e) => {
  //     e.preventDefault();
  //     openModal(card.id);
  //   });
  // });
  // Use delegation on the form wrap instead of direct card listeners
  document.querySelector('.edit-form-wrap')?.addEventListener('click', (e) => {
    const header = e.target.closest('.edit-card__header');
    if (!header) return;

    const card = header.closest('.edit-card');
    if (!card) return;
    if (card.id === 'card-quick-add') return;
    if (card.classList.contains('edit-card--placeholder')) return;

    e.preventDefault();
    openModal(card.id);
  });
}

// ----------------------------------------
// EXPORT for external callers
// (e.g. after image upload, refresh preview)
// ----------------------------------------
export function notifyModalChanged() {
  flashDraftSaved();
}