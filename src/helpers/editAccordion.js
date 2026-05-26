/**
 * editAccordion.js
 * Wires up accordion cards, restore banner, save button state,
 * and collapsed summary updates for the edit page.
 */

// ----------------------------------------
// ACCORDION
// ----------------------------------------

export function setupAccordion() {
  const cards = document.querySelectorAll('.edit-card');

  cards.forEach(card => {
    const header = card.querySelector('.edit-card__header');
    const body = card.querySelector('.edit-card__body');
    if (!header || !body) return;

    // Set initial state from aria-expanded
    const isOpen = header.getAttribute('aria-expanded') === 'true';
    if (isOpen) body.classList.add('is-open');

    header.addEventListener('click', () => {
      const currentlyOpen = header.getAttribute('aria-expanded') === 'true';
  console.log('click on', card.id, 'currentlyOpen:', currentlyOpen);
  header.setAttribute('aria-expanded', !currentlyOpen);
  body.classList.toggle('is-open', !currentlyOpen);
  console.log('body classes after toggle:', body.className);
    });
  });
}

/**
 * Open a specific card by its id
 * e.g. openCard('card-identity')
 */
export function openCard(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const header = card.querySelector('.edit-card__header');
  const body = card.querySelector('.edit-card__body');
  if (!header || !body) return;

  header.setAttribute('aria-expanded', 'true');
  body.classList.add('is-open');
}

/**
 * Close a specific card
 */
export function closeCard(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const header = card.querySelector('.edit-card__header');
  const body = card.querySelector('.edit-card__body');
  if (!header || !body) return;

  header.setAttribute('aria-expanded', 'false');
  body.classList.remove('is-open');
}

// ----------------------------------------
// SUMMARY UPDATERS
// Call these whenever a section's data changes
// ----------------------------------------

export function updateIdentitySummary(recipe) {
  const nameEl = document.getElementById('preview-identity-name');
  const catsEl = document.getElementById('preview-identity-cats');
  const slugEl = document.getElementById('preview-identity-slug');
  const dot = document.getElementById('dot-identity');

  if (nameEl) {
    nameEl.textContent = recipe?.name || '—';
  }

  if (catsEl) {
    catsEl.innerHTML = (recipe?.categories || [])
      .map(c => `<span class="preview-pill">${c}</span>`)
      .join('');
  }

  if (slugEl) {
    slugEl.textContent = recipe?.slug || recipe?.fullSlug || '';
  }

  if (dot) {
    dot.classList.toggle('is-complete', !!recipe?.name);
  }
}

export function updateDescriptionSummary(description) {
  const el = document.getElementById('preview-description-text');
  const dot = document.getElementById('dot-description');

  if (el) {
    if (description?.trim()) {
      el.textContent = description;
      el.classList.remove('edit-card__preview-empty');
    } else {
      el.textContent = 'No description yet';
      el.classList.add('edit-card__preview-empty');
    }
  }

  if (dot) {
    dot.classList.toggle('is-complete', !!description?.trim());
  }
}

export function updateImagesSummary(images = []) {
  const thumbsEl = document.getElementById('preview-images-thumbs');
  const dot = document.getElementById('dot-images');

  if (thumbsEl) {
    if (images.length > 0) {
      thumbsEl.innerHTML = images.slice(0, 6).map(img => `
        <div class="preview-thumb ${img.isFeatured ? 'is-featured' : ''}">
          <img src="${img.url}" alt="">
        </div>
      `).join('');
    } else {
      thumbsEl.innerHTML = '<span class="edit-card__preview-empty">No images yet</span>';
    }
  }

  if (dot) {
    dot.classList.toggle('is-complete', images.length > 0);
  }
}
export function updateIngredientsSummary(ingredients = []) {
  const countEl = document.getElementById('preview-ingredients-count');
  const listEl = document.getElementById('preview-ingredients-list');
  const dot = document.getElementById('dot-ingredients');

  if (ingredients.length > 0) {
    if (countEl) countEl.textContent = `${ingredients.length} ingredient${ingredients.length !== 1 ? 's' : ''}`;
    if (listEl) {
      listEl.innerHTML = ingredients.slice(0, 4)
        .map(i => `<li>${i.name || ''}</li>`)
        .join('');
      const more = ingredients.length > 4
        ? `<div class="preview-more">+ ${ingredients.length - 4} more</div>` : '';
      listEl.insertAdjacentHTML('afterend', more);
    }
    dot?.classList.add('is-complete');
  } else {
    if (countEl) countEl.textContent = '';
    if (listEl) listEl.innerHTML = '';
    dot?.classList.remove('is-complete', 'is-partial');
  }
}

export function updateDirectionsSummary(directions = []) {
  const countEl = document.getElementById('preview-directions-count');
  const listEl = document.getElementById('preview-directions-first');
  const dot = document.getElementById('dot-directions');

  if (directions.length > 0) {
    if (countEl) countEl.textContent = `${directions.length} step${directions.length !== 1 ? 's' : ''}`;
    if (listEl) {
      listEl.innerHTML = directions.slice(0, 3).map(d => {
        const text = d?.text || d || '';
        const truncated = text.length > 60 ? text.slice(0, 60).trim() + '…' : text;
        return `<li>${truncated}</li>`;
      }).join('');
    }
    dot?.classList.add('is-complete');
  } else {
    if (countEl) countEl.textContent = '';
    if (listEl) listEl.innerHTML = '';
    dot?.classList.remove('is-complete', 'is-partial');
  }
}

export function updateEditorialSummary(recipe) {
  const timesEl = document.getElementById('preview-editorial-times');
  const tagsEl = document.getElementById('preview-editorial-tags');
  const dot = document.getElementById('dot-editorial');

  if (timesEl) {
    const parts = [];
    if (recipe?.prepTime) parts.push(`<span><i class="fa-regular fa-clock"></i> Prep ${recipe.prepTime}</span>`);
    if (recipe?.totalTime) parts.push(`<span><i class="fa-solid fa-stopwatch"></i> Total ${recipe.totalTime}</span>`);
    timesEl.innerHTML = parts.join('');
  }

  if (tagsEl) {
    tagsEl.innerHTML = (recipe?.tags || [])
      .map(t => `<span class="preview-pill">${t}</span>`)
      .join('');
  }

  const hasSomething = recipe?.prepTime || recipe?.totalTime || recipe?.tags?.length;
  dot?.classList.toggle('is-partial', !!hasSomething);
}

// ----------------------------------------
// SAVE BUTTON STATE
// ----------------------------------------

let _hasChanges = false;

export function markUnsaved() {
  if (_hasChanges) return; // already marked
  _hasChanges = true;

  const btn = document.getElementById('save-button');
  if (btn) btn.classList.add('has-changes');

  // Dismiss restore banner if it's still showing
  dismissRestoreBanner();
}

export function markSaved() {
  _hasChanges = false;
  const btn = document.getElementById('save-button');
  if (!btn) return;

  btn.classList.remove('has-changes');
  const span = btn.querySelector('span');
  if (span) {
    span.textContent = 'Saved';
    setTimeout(() => { span.textContent = 'Save'; }, 1500);
  }
}

// ----------------------------------------
// DESCRIPTION CHAR COUNTER
// ----------------------------------------

export function setupDescriptionCounter() {
  const textarea = document.getElementById('recipe-description');
  const counter = document.getElementById('description-char-count');
  if (!textarea || !counter) return;

  const SUGGESTED = 280;

  function update() {
    const len = textarea.value.length;
    counter.textContent = len;

    const parent = counter.closest('.char-counter');
    if (!parent) return;

    parent.classList.remove('is-warning', 'is-over');
    if (len > SUGGESTED && len <= SUGGESTED + 100) {
      parent.classList.add('is-warning');
    } else if (len > SUGGESTED + 100) {
      parent.classList.add('is-over');
    }
  }

  textarea.addEventListener('input', () => {
    update();
    markUnsaved();
    updateDescriptionSummary(textarea.value);
  });

  update();
}

// ----------------------------------------
// RESTORE BANNER
// ----------------------------------------

const LS_DRAFT_KEY = 'editingRecipe';
const LS_DRAFT_TIME_KEY = 'editingRecipe_savedAt';

export function setupRestoreBanner(recipeId) {
  const banner = document.getElementById('restore-banner');
  if (!banner) return;

  const draft = localStorage.getItem(LS_DRAFT_KEY);
  const savedAt = localStorage.getItem(LS_DRAFT_TIME_KEY);
  if (!draft || !savedAt) return;

  let draftData;
  try {
    draftData = JSON.parse(draft);
  } catch {
    return;
  }

  // Only show if this is the same recipe
  if (draftData.id !== recipeId) return;

  // Format time ago
  const timeAgo = formatTimeAgo(new Date(savedAt));
  const timeEl = document.getElementById('restore-time');
  if (timeEl) timeEl.textContent = timeAgo;

  banner.removeAttribute('hidden');

  // Discard
  document.getElementById('restore-discard')?.addEventListener('click', () => {
    dismissRestoreBanner();
    localStorage.removeItem(LS_DRAFT_KEY);
    localStorage.removeItem(LS_DRAFT_TIME_KEY);
  });

  // Continue editing — just dismiss the banner, keep the LS data
  document.getElementById('restore-continue')?.addEventListener('click', () => {
    dismissRestoreBanner();
  });

  // Save to cloud — trigger the save button
  document.getElementById('restore-save')?.addEventListener('click', () => {
    dismissRestoreBanner();
    document.getElementById('save-button')?.click();
  });
}

export function dismissRestoreBanner() {
  const banner = document.getElementById('restore-banner');
  if (banner) banner.setAttribute('hidden', '');
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// ----------------------------------------
// QUICK ADD CARD STATE
// For existing recipes, collapse and show warning
// ----------------------------------------

export function setupQuickAddCard(isExistingRecipe) {
  const card = document.getElementById('card-quick-add');
  const warning = document.getElementById('reimport-warning');
  if (!card) return;

  if (isExistingRecipe) {
    // Collapse it
    const header = card.querySelector('.edit-card__header');
    const body = card.querySelector('.edit-card__body');
    header?.setAttribute('aria-expanded', 'false');
    body?.classList.remove('is-open');

    // Show overwrite warning
    warning?.removeAttribute('hidden');
  } else {
    // New recipe — open it, no warning
    const header = card.querySelector('.edit-card__header');
    const body = card.querySelector('.edit-card__body');
    header?.setAttribute('aria-expanded', 'true');
    body?.classList.add('is-open');
  }
}

export function updateCategoriesSummary(categories = []) {
  const pillsEl = document.getElementById('preview-categories-pills');
  const dot = document.getElementById('dot-categories');

  if (pillsEl) {
    if (categories.length > 0) {
      pillsEl.innerHTML = categories
        .map(c => `<span class="preview-pill">${c}</span>`)
        .join('');
    } else {
      pillsEl.innerHTML = '<span class="edit-card__preview-empty">No categories selected</span>';
    }
  }

  if (dot) {
    dot.classList.toggle('is-complete', categories.length > 0);
  }
}

export function updateTagsSummary(tags = []) {
  const pillsEl = document.getElementById('preview-tags-pills');
  const dot = document.getElementById('dot-tags');

  if (pillsEl) {
    if (tags.length > 0) {
      pillsEl.innerHTML = tags
        .map(t => `<span class="preview-pill">${t}</span>`)
        .join('');
    } else {
      pillsEl.innerHTML = '<span class="edit-card__preview-empty">No tags yet</span>';
    }
  }

  if (dot) {
    dot.classList.toggle('is-complete', tags.length > 0);
  }
}

export function updateArticleSummary(articleHTML = '') {
  const el = document.getElementById('preview-article-text');
  const dot = document.getElementById('dot-article');

  // Strip HTML tags to get plain text for preview
  const temp = document.createElement('div');
  temp.innerHTML = articleHTML;
  const text = temp.textContent?.trim() || '';

  if (el) {
    if (text.length > 0) {
      el.textContent = text.slice(0, 120) + (text.length > 120 ? '…' : '');
      el.classList.remove('edit-card__preview-empty');
    } else {
      el.textContent = 'No article yet';
      el.classList.add('edit-card__preview-empty');
    }
  }

  if (dot) {
    dot.classList.toggle('is-complete', text.length > 0);
  }
}