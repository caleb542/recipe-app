// src/category.js
// Category page - displays filtered recipes by category

import { loadHeader } from './components/HeaderComponent.js';
import { loadFooter } from './components/FooterComponent.js';
import { listRecipes } from './recipes.js';
import { loadRecipes, getFeaturedImage } from './functions.js';
import { hideWarning } from './functions.js';
import { showSpinner, removeSpinner } from "./components/SpinnerUtils.js";
import { setupSanityMegaMenu, openMegaMenu, closeMegaMenu } from './components/MegaMenuSanity.js';

// Category slug → display name mapping
const CATEGORIES = {
  // Course
  'breakfast-and-brunch': 'Breakfast & Brunch',
  'appetizers-and-starters': 'Appetizers & Starters',
  'finger-foods-and-party-snacks': 'Finger Foods & Party Snacks',
  'main-dishes': 'Main Dishes',
  'side-dishes': 'Side Dishes',
  'soups-and-salads': 'Soups & Salads',
  'desserts-and-sweets': 'Desserts & Sweets',
  
  // Drinks
  'cocktails': 'Cocktails',
  'mocktails-and-non-alcoholic': 'Mocktails & Non-Alcoholic',
  'hot-beverages': 'Hot Beverages',
  
  // Cuisine
  'italian': 'Italian',
  'mexican': 'Mexican',
  'asian': 'Asian',
  'mediterranean': 'Mediterranean',
  'american': 'American',
  'french': 'French',
  
  // Dietary
  'vegetarian': 'Vegetarian',
  'vegan': 'Vegan',
  'gluten-free': 'Gluten-Free',
  'dairy-free': 'Dairy-Free',
  'nut-free': 'Nut-Free',
  'keto': 'Keto',
  
  // Occasions
  'quick-and-easy': 'Quick & Easy',
  'party-and-entertaining': 'Party & Entertaining',
  'holiday-and-special-occasions': 'Holiday & Special Occasions'
};

let allRecipes = [];
let filteredRecipes = [];
let currentCategory = '';
let currentSlug = '';

async function init() {
  try {
    console.log('Category page initializing...');
    console.log('Current URL:', window.location.href);
    console.log('Search params:', window.location.search);
    
    // Load header and footer (public page - no auth required)
    await loadHeader();
    await loadHeader();
    hideWarning();
    await loadFooter();
    
    // Get category from URL
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('category');
    
    console.log('Category slug from params:', slug);
    
    // If slug is null, the redirect might not be working
    // Try to extract from pathname as fallback
    if (!slug) {
      const pathname = window.location.pathname;
      console.log('No slug in params, checking pathname:', pathname);
      
     // Extract slug from pathname (e.g., /category/breakfast-and-brunch → breakfast-and-brunch)
  currentSlug = pathname.replace(/^\/category\//, '').replace(/\/$/, '');
  console.log('Extracted slug from pathname:', currentSlug);
    } else {
       
      currentSlug = slug;
      console.log('Failed Current Slug Test: Extracted slug from pathname:', currentSlug);
    }
    
    currentCategory = CATEGORIES[currentSlug];
    
    if (!currentCategory) {
      console.error('Category not found for slug:', currentSlug);
      console.log('Available categories:', Object.keys(CATEGORIES));
      renderError(`Category "${currentSlug}" not found`);
      return;
    }
    
    console.log('Category name:', currentCategory);
    
    // Update page title
    document.title = `${currentCategory} - Recipe Me`;
    
    // Setup Megamenu
    setupSanityMegaMenu()
    
    // Render breadcrumbs
    renderBreadcrumbs(currentCategory, currentSlug);
    
    // Load recipes
    showSpinner();
  

    allRecipes = await loadRecipes();  // ← Use loadRecipes

    // filter for complete + public recipes only:
    allRecipes = allRecipes.filter(recipe => {
      const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
      const hasDirections = recipe.directions && recipe.directions.length > 0;
      const isComplete = hasIngredients && hasDirections;
      const isPublic = recipe.isPublic !== false; // Default to true if undefined

      return isComplete && isPublic;
    });

console.log('Total recipes loaded:', allRecipes.length);
    console.log('Total recipes loaded:', allRecipes.length);
    
    // Debug: Log first recipe's categories
    if (allRecipes.length > 0) {
      console.log('Sample recipe categories:', allRecipes[0].categories);
    }
    
    // Filter by category
    filteredRecipes = allRecipes.filter(recipe => {
      if (!recipe.categories) {
        return false;
      }
      const match = recipe.categories.includes(currentCategory);
      if (match) {
        console.log('Match found:', recipe.name, recipe.categories);
      }
      return match;
    });
    
    console.log('Filtered recipes:', filteredRecipes.length);
    

    
    // Render hero after filtering (so we have count)
    renderHero(currentCategory);
    
    // Render recipes
    renderRecipes();
    
    // RemoveSpinner
    removeSpinner(1500);

    // Setup sort listener
    const sortSelect = document.getElementById('filter-by');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        sortRecipes(e.target.value);
        renderRecipes();
      });
    }
    
  } catch (error) {
    console.error('Category page error:', error);
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
  container.setAttribute("data-count", count);
  if (!container) {
    console.error('Recipes container not found');
    return;
  }
  
  if (filteredRecipes.length === 0) {
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
  
  // Use the same card structure as homepage
  container.innerHTML = filteredRecipes.map(recipe => {
    // Get featured image (same logic as recipes.js)
    const featuredImage = recipe.images?.find(img => img.isFeatured) || recipe.images?.[0];
    const photoURL = featuredImage?.url || recipe.photoURL || '/images/pexels-mali-maeder-1.jpg';
    
    const recipeLink = `/article/${recipe.slug || recipe._id}`;
    
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
        <h1>Error</h1>
        <p>${message}</p>
        <a href="/" class="btn-primary">Go Home</a>
      </div>
    `;
  }
}



// Initialize
init();