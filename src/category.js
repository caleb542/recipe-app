import { loadHeader, showDevNotice } from './components/HeaderComponent.js';
import { renderBreadcrumbs } from './components/Breadcrumbs.js';
import { loadFooter } from './components/FooterComponent.js';
import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { initImpersonationBanner } from './components/ImpersonationBanner.js';
import { loadUserProfile, getUserProfile } from './userContext.js';
import { listRecipes } from './recipes.js';
import { loadRecipes, getFeaturedImage, hamburger } from './functions.js';
import { hideWarning } from './functions.js';
import { initAuth0, isAuthenticated, getUser } from './auth/auth0.js';
import { generateRecipeBadges } from './components/RecipeBadges.js';
// import { showSpinner, removeSpinner } from "./components/SpinnerUtils.js";
import { setupSanityMegaMenu } from './components/MegaMenuSanity.js';

let allRecipes = [];
let filteredRecipes = [];
let currentCategoryGroup = '';
let currentCategory = '';
let currentSlug = '';
let CATEGORIES_MAP = {};
let currentUserId = null;

async function loadCategoriesMap() {
  try {
    const res = await fetch('/.netlify/functions/get-categories');
    const { categories } = await res.json();
    categories.forEach(cat => {
      CATEGORIES_MAP[cat.slug] = { name: cat.name, group: cat.group };
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
      // Initialize Auth0
    await initAuth0();
    const authenticated = await isAuthenticated();
    if (authenticated) {
      await loadUserProfile(true);
       const user = await getUser();
        currentUserId = user?.sub || null;
    }
    
    await updateAuthUI();
    setupAuthListeners();
    initImpersonationBanner();
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

    const categoryEntry = CATEGORIES_MAP[currentSlug];
    currentCategory = categoryEntry?.name;
    currentCategoryGroup = categoryEntry?.group;

    if (!currentCategory) {
      console.error('Category not found for slug:', currentSlug);
      renderError(`Category "${currentSlug}" not found`);
      return;
    }


    document.title = `${currentCategory} - Recipe Me`;
    setupSanityMegaMenu();
    renderBreadcrumbs({
      primary: [{ label: 'Home', href: '/' }],
      current: currentCategory
    });

    // showSpinner();

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

    renderHero(currentCategory, currentCategoryGroup);
    renderRecipes();
    document.body.classList.add('is-hydrated');
    // removeSpinner(1500);
    showDevNotice()
    hamburger()

    const sortSelect = document.getElementById('filter-by');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortRecipes(e.target.value);
        renderRecipes();
      });
    }

  } catch (error) {
    console.error('Category page error:', error);
    // removeSpinner(0);
    renderError('Failed to load category page: ' + error.message);
  }
}


function renderHero(categoryName, categoryGroup) {
  const hero = document.getElementById('category-hero');
  if (!hero) return;

  const count = filteredRecipes.length;
  const recipesWithImages = filteredRecipes.filter(r => r.images?.length);
  const randomRecipe = recipesWithImages[Math.floor(Math.random() * recipesWithImages.length)];
  const featuredImg = randomRecipe?.images?.find(i => i.isFeatured) || randomRecipe?.images?.[0];

hero.innerHTML = `
    <div class="category-hero" ${categoryGroup ? `data-group="${categoryGroup}"` : ''}>
      <span class="hero-corner corner-tl"></span>
      <span class="hero-corner corner-tr"></span>
      <span class="hero-corner corner-bl"></span>
      <span class="hero-corner corner-br"></span>

      <div class="category-hero-text">
        ${categoryGroup ? `<span class="category-group-badge">${categoryGroup}</span>` : ''}
        <div class="hero-title-row">
          <span class="hero-rule"></span>
          <h1>${categoryName}</h1>
          <span class="hero-rule"></span>
        </div>
        <p class="recipe-count">${count} recipe${count !== 1 ? 's' : ''}</p>
      </div>
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

  const addCard = `
    <a href="/edit.html" data-requires-auth class="card home add-recipe-card">
      <article>
        <figure class="add-recipe-figure">
          <i class="fa fa-plus"></i>
        </figure>
        <div class="text-area">
          <h2>Add your own</h2>
        </div>
      </article>
    </a>
  `;

  if (!filteredRecipes.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 4rem 2rem; text-align: center;">
        <i class="fa fa-utensils" style="font-size: 3rem; color: #ccc;"></i>
        <h2>No recipes found</h2>
        <p>There are no ${currentCategory.toLowerCase()} recipes yet.</p>
        <a href="/edit.html" data-requires-auth class="btn-primary">Create the first one!</a>
      </div>
    `;
    return;
  }

  const recipeCards = filteredRecipes.map(recipe => {
    const featuredImage = recipe.images?.find(img => img.isFeatured) || recipe.images?.[0];
    const photoURL = featuredImage?.url || recipe.photoURL || '/images/pexels-mali-maeder-1.jpg';
    const recipeLink = `/article/${recipe.slug || recipe._id}?from=${currentSlug}`;
    const badges = generateRecipeBadges(recipe, currentUserId);

    return `
      <a href="${recipeLink}" class="card home">
      <article>
        ${badges}
        <figure>
          <img src="${photoURL}" alt="${recipe.name}" class="imageElement" loading="lazy">
        </figure>
        <div class="text-area">
          <h2>${recipe.name}</h2>
        </div>
      </article>
    </a>
    `;
  }).join('');

  container.innerHTML = recipeCards + addCard;
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