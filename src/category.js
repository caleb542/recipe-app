import { loadHeader } from './components/HeaderComponent.js';
import { loadFooter } from './components/FooterComponent.js';
import { listRecipes } from './recipes.js';
import { loadRecipes, getFeaturedImage } from './functions.js';
import { hideWarning } from './functions.js';
import { showSpinner, removeSpinner } from "./components/SpinnerUtils.js";
import { setupSanityMegaMenu } from './components/MegaMenuSanity.js';

let allRecipes = [];
let filteredRecipes = [];
let currentCategory = '';
let currentSlug = '';
let CATEGORIES_MAP = {};

async function loadCategoriesMap() {
  try {
    const res = await fetch('/.netlify/functions/get-categories');
    const { categories } = await res.json();
    categories.forEach(cat => {
      CATEGORIES_MAP[cat.slug] = cat.name;
    });
  } catch (e) {
    console.warn('Could not load categories map:', e);
  }
}

async function init() {
  try {
    await loadHeader();
    hideWarning();
    await loadFooter();
    await loadCategoriesMap();

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('category');

    if (!slug) {
      currentSlug = window.location.pathname
        .replace(/^\/category\//, '')
        .replace(/\/$/, '');
    } else {
      currentSlug = slug;
    }

    currentCategory = CATEGORIES_MAP[currentSlug];

    if (!currentCategory) {
      console.error('Category not found for slug:', currentSlug);
      removeSpinner(0);
      renderError(`Category "${currentSlug}" not found`);
      return;
    }

    document.title = `${currentCategory} - Recipe Me`;
    setupSanityMegaMenu();
    renderBreadcrumbs(currentCategory, currentSlug);

    showSpinner();

    allRecipes = await loadRecipes();
    allRecipes = allRecipes.filter(recipe => {
      const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
      const hasDirections = recipe.directions && recipe.directions.length > 0;
      return hasIngredients && hasDirections && recipe.isPublic !== false;
    });

    filteredRecipes = allRecipes.filter(recipe => {
      if (!recipe.categories) return false;
      return recipe.categories.includes(currentCategory);
    });

    renderHero(currentCategory);
    renderRecipes();
    removeSpinner(1500);

    const sortSelect = document.getElementById('filter-by');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortRecipes(e.target.value);
        renderRecipes();
      });
    }

  } catch (error) {
    console.error('Category page error:', error);
    removeSpinner(0);
    renderError('Failed to load category page: ' + error.message);
  }
}

function renderBreadcrumbs(categoryName, slug) {
  const breadcrumbs = document.getElementById('breadcrumbs');
  if (!breadcrumbs) return;
  
  breadcrumbs.innerHTML = `
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <a href="/">Home</a>
      <span aria-hidden="true"> › </span>
      <span aria-current="page">${categoryName}</span>
    </nav>
  `;
}

function renderHero(categoryName) {
  const hero = document.getElementById('category-hero');
  if (!hero) return;
  
  const count = filteredRecipes.length;
  hero.innerHTML = `
    <div class="category-hero">
      <h1>${categoryName}</h1>
      <p class="recipe-count">${count} recipe${count !== 1 ? 's' : ''}</p>
    </div>
  `;
}

function sortRecipes(sortBy) {
  switch (sortBy) {
    case 'alphabetical':
      filteredRecipes.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'byCreated':
      filteredRecipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'byEdited':
    default:
      filteredRecipes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      break;
  }
}

function renderRecipes() {
  const count = filteredRecipes.length;
  const container = document.getElementById('recipes');
  if (!container) return;
  
  container.setAttribute('data-count', count);

  if (!filteredRecipes.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 4rem 2rem; text-align: center;">
        <i class="fa fa-utensils" style="font-size: 3rem; color: #ccc;"></i>
        <h2>No recipes found</h2>
        <p>There are no ${currentCategory.toLowerCase()} recipes yet.</p>
        <a href="/edit.html" class="btn-primary">Create the first one!</a>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredRecipes.map(recipe => {
    const featuredImage = recipe.images?.find(img => img.isFeatured) || recipe.images?.[0];
    const photoURL = featuredImage?.url || recipe.photoURL || '/images/pexels-mali-maeder-1.jpg';
    const recipeLink = `/article/${recipe.slug || recipe._id}?from=${currentSlug}`;

    return `
      <a href="${recipeLink}" class="card home">
        <article>
          <figure>
            <img src="${photoURL}" alt="${recipe.name}" class="imageElement" loading="lazy">
          </figure>
          <div class="text-area">
            <h1>${recipe.name}</h1>
          </div>
        </article>
      </a>
    `;
  }).join('');
}

function renderError(message) {
  const hero = document.getElementById('category-hero');
  if (hero) {
    hero.innerHTML = `
      <div class="error-state" style="padding: 4rem 2rem; text-align: center;">
        <h1>Oops</h1>
        <p>${message}</p>
        <a href="/" class="btn-primary">Go Home</a>
      </div>
    `;
  }
}

init();