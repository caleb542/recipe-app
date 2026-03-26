import "./style.scss";
import 'notyf/notyf.min.css'; 
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
import { loadCuratedSections } from './components/CuratedSections.js';

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
import { showSpinner, removeSpinner } from "./components/SpinnerUtils.js";
import { initImpersonationBanner } from "./components/ImpersonationBanner.js";
import { loadFooter } from './components/FooterComponent.js';

import { initBadgeVisibility } from './utils/badgeVisibility.js';
import { loadHeader, injectBadgeToggle } from './components/HeaderComponent.js';
import { renderBadgeToggle, initBadgeToggle } from './components/BadgeToggleButton.js';
import { generateRecipeBadges } from './components/RecipeBadges.js';
import { setupSanityMegaMenu, openMegaMenu, closeMegaMenu } from './components/MegaMenuSanity.js';

// Load shared header FIRST
await loadHeader();
hideWarning();
console.log('🔍 After loadHeader, checking box:', document.querySelector('.mega-menu-box'));
setupSanityMegaMenu();
await loadFooter();
const container = document.getElementById("spinner-container");
showSpinner(container);

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
let currentUser = null;


// ✅ Hide immediately if not first time OR already logged in
if (!isFirstTime || authenticated) {
    overlay.style.display = 'none';
  await updateAuthUI();
  setupAuthListeners();
  recipes = await loadRecipes(true); // ✅ Force fresh fetch
 
try {
    currentUser = authenticated ? await getUser() : null;
} catch (e) {
    console.warn('Could not get user:', e.message);
}
await loadCuratedSections();
removeSpinner(1500);
await listRecipes(recipes, currentUser?.sub);
 

  initBadgeVisibility();
  injectBadgeToggle();
  initBadgeToggle();
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
    // await getCategories();
    await loadCuratedSections();
    await listRecipes(recipes, currentUser?.sub);
    
  initBadgeVisibility();
  injectBadgeToggle();
  initBadgeToggle();


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
  listRecipes(recipes, currentUser?.sub)
})

document.querySelector('#filter-by').addEventListener('change', (e) => {
  console.log(`Sort Changed To `, e.target.value)
  setFilters({
    sortBy: e.target.value
  })
  listRecipes(recipes, currentUser?.sub) // ✅ Pass recipes
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