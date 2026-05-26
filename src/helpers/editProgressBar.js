/**
 * editProgressBar.js
 * Fixed right-side progress sidebar for the recipe editor.
 * Shows completion status per section, scrolls to card on click.
 */

// ----------------------------------------
// SECTION DEFINITIONS
// ----------------------------------------
const SECTIONS = [
  {
    id: 'card-identity',
    label: 'Identity',
    icon: 'fa-solid fa-pen',
    priority: 'required',
    evaluate: (recipe) => !!(recipe.name && recipe.name !== 'New unnamed recipe'),
  },
  {
    id: 'card-description',
    label: 'Description',
    icon: 'fa-solid fa-align-left',
    priority: 'recommended',
    evaluate: (recipe) => !!(recipe.description && recipe.description.trim().length > 0),
  },
  {
    id: 'card-images',
    label: 'Images',
    icon: 'fa-solid fa-image',
    priority: 'recommended',
    evaluate: (recipe) => !!(recipe.images && recipe.images.length > 0),
  },
  {
    id: 'card-article',
    label: 'Article',
    icon: 'fa-solid fa-newspaper',
    priority: 'optional',
    evaluate: (recipe) => !!(recipe.article && recipe.article.trim().length > 0),
  },
  {
    id: 'card-ingredients',
    label: 'Ingredients',
    icon: 'fa-solid fa-list',
    priority: 'required',
    evaluate: (recipe) => !!(recipe.ingredients && recipe.ingredients.length > 0),
  },
  {
    id: 'card-directions',
    label: 'Directions',
    icon: 'fa-solid fa-list-ol',
    priority: 'required',
    evaluate: (recipe) => !!(recipe.directions && recipe.directions.length > 0),
  },
  {
    id: 'card-categories',
    label: 'Categories',
    icon: 'fa-solid fa-table-cells',
    priority: 'recommended',
    evaluate: (recipe) => !!(recipe.categories && recipe.categories.length > 0),
  },
  {
    id: 'card-tags',
    label: 'Tags',
    icon: 'fa-solid fa-tag',
    priority: 'optional',
    evaluate: (recipe) => !!(recipe.tags && recipe.tags.length > 0),
  },
  {
    id: 'card-times',
    label: 'Times',
    icon: 'fa-solid fa-clock',
    priority: 'optional',
    evaluate: (recipe) => !!(recipe.prepTime || recipe.totalTime),
  },
  {
    id: 'card-video',
    label: 'Video',
    icon: 'fa-brands fa-youtube',
    priority: 'optional',
    evaluate: (recipe) => !!(recipe.videoUrl || recipe.video),
  },
];

// ----------------------------------------
// STATE
// ----------------------------------------
let observer = null;
let currentRecipe = null;

// ----------------------------------------
// EVALUATE SECTION STATUS
// Returns: 'complete' | 'incomplete' | 'empty'
// ----------------------------------------
function getStatus(section, recipe) {
  if (!recipe) return 'empty';
  const hasContent = section.evaluate(recipe);
  if (hasContent) return 'complete';
  return 'incomplete';
}

// ----------------------------------------
// OVERALL COMPLETION SCORE
// ----------------------------------------
function getCompletionScore(recipe) {
  const required = SECTIONS.filter(s => s.priority === 'required');
  const recommended = SECTIONS.filter(s => s.priority === 'recommended');

  const requiredDone = required.filter(s => s.evaluate(recipe)).length;
  const recommendedDone = recommended.filter(s => s.evaluate(recipe)).length;
  const totalDone = SECTIONS.filter(s => s.evaluate(recipe)).length;

  return {
    requiredDone,
    requiredTotal: required.length,
    recommendedDone,
    recommendedTotal: recommended.length,
    totalDone,
    total: SECTIONS.length,
    percent: Math.round((totalDone / SECTIONS.length) * 100),
  };
}

// ----------------------------------------
// RENDER SIDEBAR
// ----------------------------------------
function renderSidebar(recipe) {
  const score = getCompletionScore(recipe);

  const items = SECTIONS.map(section => {
    const status = getStatus(section, recipe);
    const isRequired = section.priority === 'required';
    const isRecommended = section.priority === 'recommended';

    let statusClass = '';
    let statusIcon = '';

    if (status === 'complete') {
      statusClass = 'is-complete';
      statusIcon = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
    } else if (isRequired) {
      statusClass = 'is-required';
      statusIcon = '<i class="fa-solid fa-exclamation" aria-hidden="true"></i>';
    } else if (isRecommended) {
      statusClass = 'is-recommended';
      statusIcon = '<span class="progress-asterisk" aria-hidden="true">✱</span>';
    } else {
      statusClass = 'is-optional';
      statusIcon = '';
    }

    return `
      <li class="progress-item ${statusClass}" data-card="${section.id}">
        <a href="#${section.id}" class="progress-item__link" aria-label="Go to ${section.label}">
          <span class="progress-item__label">${section.label}</span>
          <span class="progress-item__indicator ${statusClass}">${statusIcon}</span>
        </a>
      </li>
    `;
  }).join('');

  return `
    <nav class="edit-progress" aria-label="Recipe completion">
      <ul class="edit-progress__list">
        ${items}
      </ul>
      <div class="edit-progress__legend">
        <span class="legend-item legend-required"><i class="fa-solid fa-exclamation"></i> Required</span>
        <span class="legend-item legend-recommended">✱ Recommended</span>
      </div>
    </nav>
  `;
}

// ----------------------------------------
// SCROLL TO CARD + OPEN IT
// ----------------------------------------
function scrollToCard(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;

  // Open if collapsed
  const header = card.querySelector('.edit-card__header');
  const body = card.querySelector('.edit-card__body');
  if (header && header.getAttribute('aria-expanded') === 'false') {
    header.setAttribute('aria-expanded', 'true');
    header.classList.add('is-expanded');
    card.classList.add('is-expanded');
    if (body) body.classList.add('is-open');
  }

  // Scroll into view
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ----------------------------------------
// INTERSECTION OBSERVER — highlight active section
// ----------------------------------------
function setupScrollSpy() {
  if (observer) observer.disconnect();

  const cards = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean);

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const cardId = entry.target.id;
      const progressItem = document.querySelector(`.progress-item[data-card="${cardId}"]`);
      if (!progressItem) return;

      if (entry.isIntersecting) {
        document.querySelectorAll('.progress-item').forEach(el => el.classList.remove('is-active'));
        progressItem.classList.add('is-active');
      }
    });
  }, {
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0,
  });

  cards.forEach(card => observer.observe(card));
}

// ----------------------------------------
// WIRE CLICK HANDLERS
// ----------------------------------------
function wireClicks() {
  document.querySelectorAll('.progress-item__link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cardId = link.closest('.progress-item').dataset.card;
      scrollToCard(cardId);
    });
  });
}

// ----------------------------------------
// MOUNT SIDEBAR INTO DOM
// ----------------------------------------
function mountSidebar(recipe) {
  // Remove existing if present
  const existing = document.getElementById('edit-progress-sidebar');
  if (existing) existing.remove();

  const sidebar = document.createElement('div');
  sidebar.id = 'edit-progress-sidebar';
  sidebar.innerHTML = renderSidebar(recipe);

  // Insert after .content-wrap or into .page-container
  const pageContainer = document.querySelector('.page-container');
  if (pageContainer) {
    pageContainer.appendChild(sidebar);
  }
}

// ----------------------------------------
// PUBLIC: INIT
// Call once after initEdit() completes
// ----------------------------------------
export function initProgressBar(recipe) {
  currentRecipe = recipe;
  mountSidebar(recipe);
  wireClicks();
  setupScrollSpy();
}

// ----------------------------------------
// PUBLIC: UPDATE
// Call whenever recipe data changes
// ----------------------------------------
export function updateProgress(recipe) {
  currentRecipe = recipe;

  // Re-render items only, not the whole sidebar
  const list = document.querySelector('.edit-progress__list');
  const scoreBar = document.querySelector('.edit-progress__score-fill');
  if (!list || !scoreBar) return;

  const score = getCompletionScore(recipe);

  let barColor = 'var(--ef-red)';
  if (score.requiredDone === score.requiredTotal) {
    barColor = score.percent >= 80 ? 'var(--ef-green)' : 'var(--ef-amber)';
  }

  scoreBar.style.height = `${score.percent}%`;
  scoreBar.style.background = barColor;

  SECTIONS.forEach(section => {
    const item = document.querySelector(`.progress-item[data-card="${section.id}"]`);
    if (!item) return;

    const status = getStatus(section, recipe);
    const isRequired = section.priority === 'required';
    const isRecommended = section.priority === 'recommended';

    // Remove old status classes
    item.classList.remove('is-complete', 'is-required', 'is-recommended', 'is-optional');

    const indicator = item.querySelector('.progress-item__indicator');
    if (!indicator) return;

    indicator.classList.remove('is-complete', 'is-required', 'is-recommended', 'is-optional');

    if (status === 'complete') {
      item.classList.add('is-complete');
      indicator.classList.add('is-complete');
      indicator.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
    } else if (isRequired) {
      item.classList.add('is-required');
      indicator.classList.add('is-required');
      indicator.innerHTML = '<i class="fa-solid fa-exclamation" aria-hidden="true"></i>';
    } else if (isRecommended) {
      item.classList.add('is-recommended');
      indicator.classList.add('is-recommended');
      indicator.innerHTML = '<span class="progress-asterisk" aria-hidden="true">✱</span>';
    } else {
      item.classList.add('is-optional');
      indicator.classList.add('is-optional');
      indicator.innerHTML = '';
    }
  });
}