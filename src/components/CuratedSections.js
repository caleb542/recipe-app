import { getFeaturedImage } from '../functions.js';

const HOMEPAGE_SECTIONS = [
  {
    categorySlug: 'desserts-and-sweets',
    label: 'Something Sweet',
    count: 4
  },
  {
    categorySlug: 'drinks',
    label: 'Drinks',
    count: 3
  },
  {
    categorySlug: 'appetizers-and-starters',
    label: 'Appetizers & Starters',
    count: 6
  },
  {
    categorySlug: 'quick-and-easy',
    label: 'Quick & Easy',
    count: 4
  },
];

async function fetchSectionRecipes(slug, count) {
  try {
    const res = await fetch(
      `/.netlify/functions/recipes-for-homepage?slug=${slug}&limit=${count}`
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchCategoryMeta(slug) {
  try {
    const res = await fetch(`/.netlify/functions/get-categories`);
    if (!res.ok) return null;
    const { categories } = await res.json();
    return categories.find(c => c.slug === slug) || null;
  } catch {
    return null;
  }
}

async function fetchWorldFlavours() {
  try {
    const res = await fetch('/.netlify/functions/recipes-world-flavours');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function renderSectionCard(recipe) {
  const featuredImage = getFeaturedImage(recipe);
  const photoURL = featuredImage?.url || '/images/pexels-mali-maeder-1.jpg';
  const recipeLink = recipe.fullSlug
    ? `/article/${recipe.fullSlug}`
    : `/article.html#${recipe.id}`;

  return `
    <a href="${recipeLink}" class="curated-card">
      <figure>
        <img src="${photoURL}" alt="${recipe.name}" loading="lazy">
      </figure>
      <p class="curated-card-title">${recipe.name}</p>
    </a>
  `;
}

function renderWorldFlavoursCard(item) {
  const { recipe, cuisineName, slug } = item;
  const featuredImage = getFeaturedImage(recipe);
  const photoURL = featuredImage?.url || '/images/pexels-mali-maeder-1.jpg';
  const recipeLink = recipe.fullSlug
    ? `/article/${recipe.fullSlug}`
    : `/article.html#${recipe.id}`;

  return `
    <a href="${recipeLink}" class="curated-card">
      <figure>
        <img src="${photoURL}" alt="${recipe.name}" loading="lazy">
      </figure>
      <p class="curated-card-cuisine">${cuisineName}</p>
      <p class="curated-card-title">${recipe.name}</p>
    </a>
  `;
}

function renderWorldFlavoursSection(items) {
  if (!items.length) return '';

  return `
    <section class="curated-section curated-section--world">
      <div class="curated-section-heading">
        <h2>World Flavours</h2>
        <p class="curated-section-desc">A taste of something from around the globe.</p>
      </div>
      <div class="curated-cards">
        ${items.map(renderWorldFlavoursCard).join('')}
      </div>
    </section>
  `;
}

function renderSection(section, recipes, meta) {
  if (!recipes.length) return '';

  const description = meta?.description || '';

  return `
    <section class="curated-section">
      <div class="curated-section-heading">
        <h2>${section.label}</h2>
        ${description ? `<p class="curated-section-desc">${description}</p>` : ''}
      </div>
      <div class="curated-cards">
        ${recipes.map(renderSectionCard).join('')}
      </div>
      <div class="curated-section-footer">
        <a href="/category/${section.categorySlug}" class="curated-see-all-btn">
          View All ${section.label}
        </a>
      </div>
    </section>
  `;
}

export async function loadCuratedSections() {
  const container = document.getElementById('curated-sections');
  if (!container) return;

  container.innerHTML = '';

  try {
    // Fetch everything in parallel
    const [worldItems, categoriesRes, ...recipesResults] = await Promise.all([
      fetchWorldFlavours(),
      fetch('/.netlify/functions/get-categories'),
      ...HOMEPAGE_SECTIONS.map(section =>
        fetchSectionRecipes(section.categorySlug, section.count)
      )
    ]);

    const { categories } = await categoriesRes.json();

    const worldHTML = renderWorldFlavoursSection(worldItems);

    const sectionsHTML = HOMEPAGE_SECTIONS
      .map((section, i) => ({
        section,
        recipes: recipesResults[i],
        meta: categories.find(c => c.slug === section.categorySlug)
      }))
      .filter(({ recipes }) => recipes.length > 0)
      .map(({ section, recipes, meta }) => renderSection(section, recipes, meta))
      .join('');

    container.innerHTML = worldHTML + sectionsHTML;

  } catch (error) {
    console.error('Failed to load curated sections:', error);
    container.innerHTML = '';
  }
}