import "./style.scss";
import "./recipe-me.scss"
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

import { initAuth0, login, isAuthenticated } from './auth/auth0.js';

import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { loadUserProfile, getUserProfile } from './userContext.js';
import { loadHeader } from './components/HeaderComponent.js';
import { appendSpinner, removeSpinner } from "./components/SpinnerUtils.js";
// Load shared header FIRST
await loadHeader();
hideWarning();
const container = document.getElementById("spinner-container");
appendSpinner(container);
// Then initialize auth
await initAuth0();
await loadUserProfile();
await updateAuthUI();
setupAuthListeners();


// Initialize role-based UI (shows badge, etc.)
initRoleBasedUI();

await updateAuthUI();
setupAuthListeners();



// Get overlay elements
const overlay = document.getElementById("static-landing-page");
const browseBtn = document.getElementById('browse-btn');
const splashLoginBtn = document.getElementById('splash-login-btn');

// ✅ Check localStorage FIRST - before any other logic
const isFirstTime = localStorage.getItem('firstTime') !== 'false';
const authenticated = await isAuthenticated();

// ✅ Hide immediately if not first time OR already logged in
if (!isFirstTime || authenticated) {
 overlay.style.display = 'none';
  await updateAuthUI();
  setupAuthListeners();
  loadRecipes();
} else {
  // Show splash for first-time visitors
  overlay.style.display = "flex"; // Make sure it's visible
  
  // Browse without login
  browseBtn.addEventListener('click', () => {
    localStorage.setItem('firstTime', 'false');
    overlay.classList.add('hidden');
    updateAuthUI();
    setupAuthListeners();
    loadRecipes();
  });
  
  // Login to create
  splashLoginBtn.addEventListener('click', async () => {
    localStorage.setItem('firstTime', 'false');
    await login();
  });
}


let recipes =  await loadRecipesFromLocalStorage()
// ✅ Add safety check
if (!recipes) {
  console.warn('⚠️ No recipes in localStorage, fetching from database...');
  recipes = await getRecipesFromDatabase();
  saveRecipes(recipes);
}

console.log('📦 Initial recipes loaded:', recipes.length);


const getCategories = async () => {
  let categoryCounts = {}; // ✅ Track counts for each category
  let uncategorizedCount = 0;
  
  console.log('🔍 getCategories called');
  console.log('🔍 recipes:', recipes);
  console.log('🔍 recipes is array?', Array.isArray(recipes));

  if (Array.isArray(recipes)) {
    recipes.forEach((recipe) => {
        console.log('Recipe:', recipe.name, 'Categories:', recipe.categories); // ✅ Add this
      // Extract individual categories from array
      if (Array.isArray(recipe.categories) && recipe.categories.length > 0) {
        recipe.categories.forEach(cat => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      } else {
        uncategorizedCount++;
      }
    });
     console.log('🔍 categoryCounts:', categoryCounts); // ✅ Add this
  console.log('🔍 uncategorizedCount:', uncategorizedCount); // ✅ Add this
  } else {
    console.warn("Recipes not available yet:", recipes);
  }

  // ✅ Convert to array with counts
  let categories = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    count: categoryCounts[cat]
  }));
  
  // ✅ Sort alphabetically by name
  categories.sort((a, b) => a.name.localeCompare(b.name));
  
  // ✅ Add "All" at the beginning with total count
  categories.unshift({
    name: "All",
    count: recipes.length
  });
  
  // ✅ Add "Uncategorized" at the end ONLY if we have uncategorized recipes
  if (uncategorizedCount > 0) {
    categories.push({
      name: "Uncategorized",
      count: uncategorizedCount
    });
  }
console.log('🔍 Final categories array:', categories); // ✅ Add this

  const categoriesCloud = document.querySelector("#categories-cloud section");
  console.log('🔍 categoriesCloud element:', categoriesCloud); // ✅ Add this
  
  categoriesCloud.innerHTML = ''; // Clear first
  categoriesCloud.setAttribute("tabindex", "0");
  categoriesCloud.setAttribute("role", "radiogroup");

  categories.forEach((cat, index) => {
    const label = document.createElement("label");
    label.setAttribute("role", "radio");
    label.setAttribute("for", `cat-${index}`);
    
    // ✅ Display name with count
    label.textContent = `${cat.name} (${cat.count})`;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "category";
    radio.id = `cat-${index}`;
    radio.value = cat.name; // ✅ Still use just the name as value
    radio.classList.add("sort", "radio");
    
    // ✅ Auto-select "All" on page load
    if (cat.name === "All") {
      radio.checked = true;
    }

    label.appendChild(radio);
    categoriesCloud.appendChild(label);
  });
};

// Only proceed if we have recipes
if (recipes && recipes.length > 0) {
  await getCategories();
  await listRecipes(recipes);
} else {
  console.warn('⚠️ No recipes available to display');
  // Maybe show a "No recipes yet" message to user
}

removeSpinner(200);
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
  listRecipes()
})


// Event Listeners
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


await getCategories()
hamburger()
      
// window.addEventListener('storage', (e) => {
//   if (e.key === 'recipes') {
//     listRecipes(recipes)
//   }
// })