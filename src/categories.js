import "./style.scss";
import { loadCategories } from "./functions.js";
import { loadHeader, showDevNotice } from './components/HeaderComponent.js';
import { initAuth0, isAuthenticated } from './auth/auth0.js';
import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { loadUserProfile } from './userContext.js';
import { initImpersonationBanner } from "./components/ImpersonationBanner.js";
import { setupSanityMegaMenu } from "./components/MegaMenuSanity.js";

await loadHeader();
setupSanityMegaMenu();

await initAuth0();
const authenticated = await isAuthenticated();
if (authenticated) {
  await loadUserProfile(true);
}
await updateAuthUI();
setupAuthListeners();
initImpersonationBanner();

// Breadcrumb
const breadcrumbContainer = document.getElementById('breadcrumbs');
if (breadcrumbContainer) {
  breadcrumbContainer.innerHTML = `
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <a href="/">Home</a>
      <span aria-hidden="true">›</span>
      <span aria-current="page">Categories</span>
    </nav>
  `;
}

// Load and render categories
async function loadCategoriesPage() {
  const container = document.getElementById('recipes');
  if (!container) return;

  try {
    const { grouped } = await loadCategories();

    const html = Object.entries(grouped).map(([group, cats]) => {
      // Only show categories with recipes
      const activeCats = cats.filter(c => c.recipeCount > 0);
      if (!activeCats.length) return '';

      return `
        <section class="categories-group" id="${group.toLowerCase()}">
          <h2 class="categories-group-title">${group}</h2>
          <div class="categories-group-grid">
            ${activeCats.map(cat => `
              <a href="/category/${cat.slug}?from=categories" class="category-card">
                <div class="category-card-body">
                  <h3 class="category-card-name">${cat.name}</h3>
                  ${cat.description ? `<p class="category-card-desc">${cat.description}</p>` : ''}
                  <span class="category-card-count">${cat.recipeCount} recipe${cat.recipeCount !== 1 ? 's' : ''}</span>
                </div>
              </a>
            `).join('')}
          </div>
        </section>
      `;
    }).join('');

    container.innerHTML = html;

  } catch (error) {
    console.error('Failed to load categories:', error);
    container.innerHTML = '<p>Failed to load categories.</p>';
  }
}

loadCategoriesPage();
showDevNotice();