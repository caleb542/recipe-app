import "./style.scss";
import {
  stringify,
  v4 as uuidv4
} from 'uuid';
import {
  createApi
} from './unsplash.js'
import {
  getFilters,
  setFilters
} from './filters.js';
import {
  sortRecipes,
  listRecipes
} from './recipes.js'
import {
  unsplashme
} from "./unsplash.js";

import { initRoleBasedUI } from './auth/roleUI.js';
import {
  loadRecipes,
  getTimestamp,
  saveRecipes,
  toggleMenu,
  hamburger,
  convertTimestamp,
  loadRecipesFromLocalStorage,
  hideWarning
} from './functions.js'
import { getRecipesFromDatabase } from "./backend/getRecipesFromDatabase.js";

import { initAuth0, login, isAuthenticated, getUser } from './auth/auth0.js';

import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { loadUserProfile, getUserProfile } from './userContext.js';
import { loadHeader } from './components/HeaderComponent.js';
import { appendSpinner, removeSpinner } from "./components/SpinnerUtils.js";
import { initImpersonationBanner } from "./components/ImpersonationBanner.js";
// Monkey-patch localStorage to catch who's setting userProfile
// TRAP: Catch who's setting userProfile
// const originalSetItem = localStorage.setItem;
// localStorage.setItem = function(key, value) {
//   if (key === 'userProfile') {
//     console.error('🚨 CAUGHT: Something is setting userProfile!');
//     console.trace();
//     debugger; // This will pause execution so you can see the exact line
//   }
//   return originalSetItem.apply(this, arguments);
// };
// Load shared header FIRST
await loadHeader();
hideWarning();
const container = document.getElementById("spinner-container");
appendSpinner(container);

// Then initialize auth
await initAuth0();
const authenticated = await isAuthenticated();

if (authenticated) {
  await loadUserProfile(false); // ✅ Force fresh fetch (skipFetch = false)
}

await updateAuthUI();
setupAuthListeners();

// Initialize role-based UI (shows badge, etc.)
initRoleBasedUI();
initImpersonationBanner();

// Get overlay elements
const overlay = document.getElementById("static-landing-page");
const browseBtn = document.getElementById('browse-btn');
const splashLoginBtn = document.getElementById('splash-login-btn');

// ✅ Check localStorage FIRST - before any other logic
const isFirstTime = localStorage.getItem('firstTime') !== 'false';
// const authenticated = await isAuthenticated();

// ✅ Declare recipes variable
let recipes;
const getCategories = async () => {
  let categoryCounts = {};
  let uncategorizedCount = 0;
  
  console.log('🔍 getCategories called');
  console.log('🔍 recipes:', recipes);
  console.log('🔍 recipes is array?', Array.isArray(recipes));

  // ✅ Get current user (same as listRecipes)
  const authenticated = await isAuthenticated();
  let currentUserId = null;
  
  if (authenticated) {
    const user = await getUser();
    currentUserId = user?.sub;
    console.log('Current User ID for categories:', currentUserId);
  }

  if (Array.isArray(recipes)) {
    // ✅ Filter recipes using SAME logic as listRecipes
    const visibleRecipes = recipes.filter(recipe => {
      const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
      const hasDirections = recipe.directions && recipe.directions.length > 0;
      const isComplete = hasIngredients && hasDirections;
      
      // Show complete recipes
      if (isComplete) return true;
      
      // Show incomplete recipes only if you're the author AND it's unpublished
      const isAuthor = currentUserId && recipe.author?.auth0Id === currentUserId;
      return !recipe.isPublic && isAuthor;
    });

    console.log('🔍 Visible recipes after filtering:', visibleRecipes.length);

    // ✅ Now count categories from VISIBLE recipes only
    visibleRecipes.forEach((recipe) => {
      console.log('Recipe:', recipe.name, 'Categories:', recipe.categories);
      
      if (Array.isArray(recipe.categories) && recipe.categories.length > 0) {
        recipe.categories.forEach(cat => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      } else {
        uncategorizedCount++;
      }
    });
    
    console.log('🔍 categoryCounts:', categoryCounts);
    console.log('🔍 uncategorizedCount:', uncategorizedCount);

    let categories = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      count: categoryCounts[cat]
    }));
    
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    // ✅ Use visibleRecipes.length for "All" count
    categories.unshift({
      name: "All",
      count: visibleRecipes.length
    });
    
    if (uncategorizedCount > 0) {
      categories.push({
        name: "Uncategorized",
        count: uncategorizedCount
      });
    }
    
    console.log('🔍 Final categories array:', categories);

    const categoriesCloud = document.querySelector("#categories-cloud section");
    console.log('🔍 categoriesCloud element:', categoriesCloud);
    
    if (!categoriesCloud) {
      console.warn('⚠️ Categories cloud element not found');
      return;
    }
    
    categoriesCloud.innerHTML = '';
    categoriesCloud.setAttribute("tabindex", "0");
    categoriesCloud.setAttribute("role", "radiogroup");

    categories.forEach((cat, index) => {
      const label = document.createElement("label");
      label.setAttribute("role", "radio");
      label.setAttribute("for", `cat-${index}`);
      label.textContent = `${cat.name} (${cat.count})`;

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "category";
      radio.id = `cat-${index}`;
      radio.value = cat.name;
      radio.classList.add("sort", "radio");
      
      if (cat.name === "All") {
        radio.checked = true;
      }

      label.appendChild(radio);
      categoriesCloud.appendChild(label);
    });
  } else {
    console.warn("Recipes not available yet:", recipes);
  }
};

// ✅ Hide immediately if not first time OR already logged in
if (!isFirstTime || authenticated) {
  overlay.style.display = 'none';
  await updateAuthUI();
  setupAuthListeners();
  recipes = await loadRecipes(true); // ✅ Force fresh fetch
  await getCategories();
  await listRecipes(recipes);
  removeSpinner(200);
} else {
  // Show splash for first-time visitors
  overlay.style.display = "flex";
  removeSpinner(200);
  // Browse without login
  browseBtn.addEventListener('click', async () => { // ✅ Make async
    localStorage.setItem('firstTime', 'false');
    overlay.classList.add('hidden');
    await updateAuthUI(); // ✅ Add await
    setupAuthListeners();
    recipes = await loadRecipes(true);
    await getCategories();
    await listRecipes(recipes);
    

  });
  
  // Login to create
  splashLoginBtn.addEventListener('click', async () => {
    localStorage.setItem('firstTime', 'false');
    await login();
  });
}

console.log('📦 Initial recipes loaded:', recipes?.length || 0);



// Event Listeners
document.querySelector('#search-filter').addEventListener('input', (e) => {
  console.log(e.target.value)
  setFilters({
    searchText: e.target.value
  })
  listRecipes(recipes)
})

document.querySelector('#filter-by').addEventListener('change', (e) => {
  console.log(`Sort Changed To `, e.target.value)
  setFilters({
    sortBy: e.target.value
  })
  listRecipes(recipes) // ✅ Pass recipes
})

document.addEventListener("change", (e) => {
  if (e.target.matches('#categories-cloud input[type="radio"]')) {
    const selected = e.target.value;
    
    if (selected === "All") {
      setFilters({ 
        searchText: "",
        showUncategorized: false 
      });
    } else if (selected === "Uncategorized") {
      setFilters({ 
        searchText: "", 
        showUncategorized: true 
      });
    } else {
      setFilters({ 
        searchText: selected,
        showUncategorized: false 
      });
    }
    
    listRecipes(recipes);
  }
});

hamburger()