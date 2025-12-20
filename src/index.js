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
import {
  loadRecipes,
  getTimestamp,
  saveRecipes,
  toggleMenu,
  hamburger,
  convertTimestamp,
  loadRecipesFromLocalStorage
} from './functions.js'
import { getRecipesFromDatabase } from "./backend/getRecipesFromDatabase.js";

import { initAuth0, login, isAuthenticated } from './auth/auth0.js';
import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { loadUserProfile, getUserProfile } from './userContext.js';

// Initialize auth
await initAuth0();
await loadUserProfile(); 
await updateAuthUI();
setupAuthListeners();

// Check if user is already logged in
const authenticated = await isAuthenticated();

// Get overlay elements
const overlay = document.getElementById("static-landing-page");
const browseBtn = document.getElementById('browse-btn');
const splashLoginBtn = document.getElementById('splash-login-btn');

// Check if first time visiting
const isFirstTime = localStorage.getItem('firstTime') !== 'false';

// Show splash only if first time AND not authenticated
if (!isFirstTime || authenticated) {
  overlay.classList.add('hidden');
  await updateAuthUI();
  setupAuthListeners();
  loadRecipes();
} else {
  // Show splash for first-time visitors
  
  // Browse without login
  browseBtn.addEventListener('click', () => {
    localStorage.setItem('firstTime', 'false'); // ✅ Mark as seen
    overlay.classList.add('hidden');
    updateAuthUI();
    setupAuthListeners();
    loadRecipes();
  });
  
  // Login to create
  splashLoginBtn.addEventListener('click', async () => {
    localStorage.setItem('firstTime', 'false'); // ✅ Mark as seen
    await login();
    // After Auth0 redirects back, they won't see splash again
  });
}


let recipes =  await loadRecipesFromLocalStorage()
await listRecipes(recipes);

// Event Listeners
document.querySelector('#search-filter').addEventListener('input', (e) => {
  console.log(e.target.value)
  setFilters({
    searchText: e.target.value
  })
  listRecipes(recipes)
})


document.querySelector('#filter-by').addEventListener('change', (e) => {
  console.log(e.target.value)
  setFilters({
    sortBy: e.target.value
  })
  listRecipes()
})


const getCategories = async () => {
  let categories = [];

  if (Array.isArray(recipes)) {
    recipes.forEach((recipe) => {
      // Controlled category
      const category = recipe.category || "Uncategorized";
      categories.push(category);

      // Optional: include tags if you want them in the cloud
      if (Array.isArray(recipe.tags)) {
        recipe.tags.forEach(tag => categories.push(tag));
      }
    });
  } else {
    console.warn("Recipes not available yet:", recipes);
  }

  categories = [...new Set(categories)];
  categories.unshift("All");

  const categoriesCloud = document.querySelector("#categories-cloud section");
  categoriesCloud.setAttribute("tabindex", "0");
  categoriesCloud.setAttribute("role", "radiogroup");

  categories.forEach((cat, index) => {
    const label = document.createElement("label");
    label.setAttribute("role", "radio");
    label.setAttribute("for", `cat-${index}`);
    label.textContent = cat;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "category";
    radio.id = `cat-${index}`;
    radio.value = cat;
    radio.classList.add("sort", "radio");

    label.appendChild(radio);
    categoriesCloud.appendChild(label);
  });
};


// Event Listeners
document.addEventListener("change", (e) => {
  if (e.target.matches('#categories-cloud input[type="radio"]')) {
    const selected = e.target.value;
    setFilters({
      searchText: selected === "All" ? "" : selected
    });
    listRecipes(recipes);
  }
});


await getCategories()
hamburger()
      
// window.addEventListener('storage', (e) => {
//   if (e.key === 'recipes') {
//     listRecipes(recipes)
//   }
// })