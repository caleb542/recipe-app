import "./style.scss";
import { loadRecipes, hamburger, getFeaturedImage, getAllImages, hideWarning, loadRecipesFromLocalStorage, loadCategories } from "./functions.js";
import { marked } from "marked";
import { setupShoppingList } from "./helpers/shoppingList.js";
import { initAuth0, getToken, isAuthenticated, getUser } from './auth/auth0.js';
import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { RatingDisplay } from './components/RatingDisplay.js';
import { CommunityNotes } from './components/CommunityNotes.js';
import { loadUserProfile, getUserProfile } from './userContext.js';
import { autoEmbedVideos } from './helpers/youtubeEmbed.js';
import { loadHeader } from './components/HeaderComponent.js';
import { showSpinner, removeSpinner } from "./components/SpinnerUtils.js";
import { initImpersonationBanner } from "./components/ImpersonationBanner.js";
import { setupSanityMegaMenu } from "./components/MegaMenuSanity.js";
import { CATEGORIES, getCategoryNames } from "./helpers/categories.js";



// const CATEGORIES = {
//   'breakfast-and-brunch': 'Breakfast & Brunch',
//   'appetizers-and-starters': 'Appetizers & Starters',
//   'finger-foods-and-party-snacks': 'Finger Foods & Party Snacks',
//   'main-dishes': 'Main Dishes',
//   'side-dishes': 'Side Dishes',
//   'soups-and-salads': 'Soups & Salads',
//   'desserts-and-sweets': 'Desserts & Sweets',
//   'cocktails': 'Cocktails',
//   'mocktails-and-non-alcoholic': 'Mocktails & Non-Alcoholic',
//   'hot-beverages': 'Hot Beverages',
//   'italian': 'Italian',
//   'mexican': 'Mexican',
//   'asian': 'Asian',
//   'mediterranean': 'Mediterranean',
//   'american': 'American',
//   'french': 'French',
//   'vegetarian': 'Vegetarian',
//   'vegan': 'Vegan',
//   'gluten-free': 'Gluten-Free',
//   'dairy-free': 'Dairy-Free',
//   'nut-free': 'Nut-Free',
//   'keto': 'Keto',
//   'quick-and-easy': 'Quick & Easy',
//   'party-and-entertaining': 'Party & Entertaining',
//   'holiday-and-special-occasions': 'Holiday & Special Occasions'
// };

// ✅ Wait for DOM before doing anything
if (document.readyState === 'loading') {
  await new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', resolve);
  });
}

// ✅ Extract slug from URL pathname or query string
let slug = null;

let CATEGORIES_MAP = {};

// Try query string first
const urlParams = new URLSearchParams(window.location.search);
slug = urlParams.get('slug');

// If not in query, extract from pathname
if (!slug && window.location.pathname !== '/' && window.location.pathname !== '/article.html') {
  // Strip /article/ prefix if present
  slug = window.location.pathname.replace(/^\/article\//, '').replace(/\/$/, '');
  
  // If no /article/ prefix, just remove leading slash
  if (slug === window.location.pathname.substring(1)) {
    slug = window.location.pathname.substring(1).replace(/\/$/, '');
  }
}

console.log("Slug:", slug);
console.log("Pathname:", window.location.pathname);

const recipeId = location.hash.substring(1);

let recipes;
let likesInitialized = false;
let articleHydrated = false;

await loadHeader();
await loadCategoriesMap();

hideWarning();
setupSanityMegaMenu();

// ✅ Query DOM for container
const container = document.querySelector(".template-container");

if (!container) {
  console.error("❌ CRITICAL: .template-container not found in DOM!");
  document.body.innerHTML = '<div style="padding: 2rem; text-align: center;">Error loading page. Please refresh.</div>';
  throw new Error('Container element missing');
}

console.log("✅ Container found:", container);
showSpinner();

// Initialize Auth0
await initAuth0();
const authenticated = await isAuthenticated();
if (authenticated) {
  await loadUserProfile(true);
}

await updateAuthUI();
setupAuthListeners();
initImpersonationBanner();



async function loadCategoriesMap() {
  const { categories } = await loadCategories();
  categories.forEach(cat => {
    CATEGORIES_MAP[cat.slug] = cat.name;
  });
}

// Add storage listener
window.addEventListener("storage", e => {
  if (e.key === "recipes") {
    fetchRecipes();
  }
});

// ✅ Entry point - handle both URL formats
async function fetchRecipes() {
  if (slug) {
    // New simple slug URL: /carbonara
    await loadRecipeBySlug(slug);
  } else if (recipeId) {
    // Old hash-based URL: /article.html#recipe-123
    recipes = await loadRecipesFromLocalStorage();
    await hydrateArticle(recipes);
  } else {
    // No recipe specified
    removeSpinner(400);
    location.assign("/index.html");
  }
}

fetchRecipes();

// ✅ Load recipe by simple slug
async function loadRecipeBySlug(slug) {

  try {
    const token = await getToken();
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `/.netlify/functions/recipe-by-slug?slug=${encodeURIComponent(slug)}`,
      { headers } 
    );

    if (!response.ok) {
      console.error('Recipe not found:', response.status);
      removeSpinner(0);
      location.assign("/index.html");
      return;
    }
    
    const recipe = await response.json();
    const recipesArray = [recipe];
    window.currentRecipeId = recipe.id;
    
    await hydrateArticle(recipesArray, recipe.id);
    
  } catch (error) {
    console.error('Load by slug failed:', error);
    removeSpinner(0);
    location.assign("/index.html");
  }
}

async function hydrateArticle(recipes, recipeIdOverride = null) {
  // Prevent multiple hydrations
  if (articleHydrated) {
    console.log('Article already hydrated, skipping...');
    return;
  }
  
  // ✅ Use override ID if provided (from slug loading)
  const currentRecipeId = recipeIdOverride || recipeId;
  
  const recItem = Array.isArray(recipes)
    ? recipes.find(recipe => recipe.id === currentRecipeId)
    : null;

  if (!recItem) {
    removeSpinner(0);
    location.assign("/index.html");
    return;
  }

  // ✅ Update URL to clean format if loaded via hash
  if (!slug && recItem.fullSlug) {
    const newUrl = `/${recItem.fullSlug}`;
    window.history.replaceState({}, '', newUrl);
  }

  // Load template
  const res = await fetch("/partials/article-template.html");
  const html = await res.text();
  
  // ✅ Remove spinner BEFORE adding content
  removeSpinner(0);
  
  container.insertAdjacentHTML("beforeend", html);

  const template = document.getElementById("article-template");
  const tpl = template.content.cloneNode(true);

  // Hydrate fields safely
  const articleTitle = tpl.querySelector(".article__title");


  if (articleTitle) {
    articleTitle.textContent = recItem.name;
    document.title = `Recipe Me - ${recItem.name}`;
  }
 
  const d = tpl.querySelector(".dates");
  if (d) d.innerHTML = `<date>${recItem.createdAt[0]}</date>`;

  const a = tpl.querySelector(".author");
  if (a) {
    const authorName = recItem.displayAuthor || recItem.author?.name || "Anonymous";
    a.innerHTML = `by ${authorName}`;
  }

  const pt = tpl.querySelector(".prep-time-value");
  if (pt) pt.textContent = recItem.prepTime || "Not specified";

  const tt = tpl.querySelector(".total-time-value");
  if (tt) tt.textContent = recItem.totalTime || "Not specified";

  const dsum = tpl.querySelector(".description.summary");
  if (dsum) dsum.innerHTML = recItem.description;

  // Handle multiple images from images array
  const imageElement = tpl.querySelector(".imageElement");
  const photoInfo = tpl.querySelector(".photoInfo");
  
  if (imageElement) {
    const featuredImage = getFeaturedImage(recItem);
    
    if (featuredImage) {
      // Display featured image
      imageElement.style.backgroundImage = `url(${featuredImage.url})`;
      
      // Show attribution if exists
      if (photoInfo && featuredImage.attribution) {
        if (featuredImage.source === 'unsplash') {
          photoInfo.innerHTML = `Photo by <a href="${featuredImage.attribution.photographerUrl}" target="_blank" rel="noopener">${featuredImage.attribution.photographer}</a> on <a href="https://unsplash.com/?utm_source=recipe_me&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>`;
        } else {
          // User-added attribution
          const attr = featuredImage.attribution;
          if (attr.customCredit) {
            photoInfo.innerHTML = attr.customCredit;
          } else if (attr.photographerUrl) {
            photoInfo.innerHTML = `Photo by <a href="${attr.photographerUrl}" target="_blank" rel="noopener">${attr.photographer}</a>`;
          } else {
            photoInfo.innerHTML = `Photo by ${attr.photographer}`;
          }
        }
      } else if (photoInfo) {
        photoInfo.innerHTML = '';
      }
    }
  }

  // Display image gallery (all images)
  const imageGalleryContainer = tpl.querySelector(".recipe-image-gallery");
  if (imageGalleryContainer) {
    const allImages = getAllImages(recItem);

    // ✅ Filter out featured image if there are fewer than 3 uploaded images
    const uploadedImages = allImages.filter(img => img.source === 'upload');
    const displayImages = uploadedImages.length < 3 
      ? allImages.filter(img => !img.isFeatured)
      : allImages;
    
    if (allImages.length > 0) {
      imageGalleryContainer.innerHTML = `
        <div class="recipe-images-grid">
          ${displayImages.map((img, index) => `
            <figure class="recipe-image-item ${img.isFeatured ? 'featured-image' : ''}">
              ${img.resourceType === 'video' ? `
                <video controls>
                  <source src="${img.url}" type="video/mp4">
                  Your browser does not support video.
                </video>
              ` : `
                <img src="${img.url}" alt="Recipe image ${index + 1}" loading="lazy">
              `}
              ${img.attribution ? `
                <figcaption class="image-attribution">
                  ${formatImageAttribution(img)}
                </figcaption>
              ` : ''}
            </figure>
          `).join('')}
        </div>
      `;
    }
  }

  // Summary content
  const summaryContent = tpl.querySelector(".summary-content");
  
  if (summaryContent) {
    let html = marked.parse(recItem.article || "");
    html = autoEmbedVideos(html);
    summaryContent.innerHTML = html;
  }

  // Directions
  const directionsList = tpl.querySelector(".directions-list");
  if (directionsList) {
    directionsList.innerHTML = "";
    recItem.directions.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step.text;
      directionsList.appendChild(li);
    });
  }

  // Ingredients checklist
  const checklist = tpl.querySelector(".checklist");
  if (checklist) {
    checklist.innerHTML = "";
    if (recItem.ingredients.length < 1) {
      const warning = document.createElement("div");
      warning.classList.add("warning");
      warning.innerHTML = `Do you want to <a href="edit.html#${currentRecipeId}">start adding some ingredients</a>?`;
      tpl.querySelector(".checklist-container")?.appendChild(warning);
    } else {
      recItem.ingredients.forEach(ingr => {
        const li = document.createElement("li");
        const label = document.createElement("label");
        label.classList.add("article-checklist-items");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        const amt = document.createElement("span");

        const parts = [
          ingr.amount, ingr.unit || ingr.measureWord, ingr.name, ingr.description
        ].filter(part => part && String(part).trim());
        amt.textContent = parts.join(' ');

        label.append(checkbox, amt);
        li.appendChild(label);
        checklist.appendChild(li);
      });
    }
  }

  // Edit button
  const editBtn = tpl.getElementById?.('edit-recipe-btn') || tpl.querySelector("#edit-recipe-btn");
  if (editBtn) {
    const authenticated = await isAuthenticated();

    if (authenticated) {
      const currentUser = await getUser();
      const isAuthor = recItem.author?.auth0Id === currentUser.sub;
      const isLegacy = !recItem.author || recItem.author.name === "Legacy User";
      
      if (isAuthor || isLegacy) {
        editBtn.href = `/edit.html#${currentRecipeId}`;
        editBtn.title = isLegacy ? "Claim and edit recipe" : "Edit recipe";
        editBtn.style.display = 'inline-block';
      } else {
        editBtn.style.display = 'none';
      }
    } else {
      editBtn.style.display = 'none';
    }
  }

  // Append hydrated fragment
  container.appendChild(tpl);

    // Render breadcrumbs
  renderBreadcrumbs(recItem);

  // Community notes
  const notesContainer = document.getElementById("community-notes");
  if (notesContainer) {
    new CommunityNotes(notesContainer, currentRecipeId);
  }

  // Wire shopping list helper
  const userProfile = getUserProfile();
  const userEmail = userProfile?.email || '';
  setupShoppingList(recItem, currentRecipeId, userEmail);

  // Initialize likes once
  if (!likesInitialized) {
    await initializeLikes(currentRecipeId, container);
    likesInitialized = true;
  }

  // Hamburger menu
  hamburger();
  articleHydrated = true;
  removeSpinner(1500);
}

/**
 * Format image attribution for display
 */
function formatImageAttribution(image) {
  if (!image.attribution) return '';
  
  const attr = image.attribution;
  
  // Unsplash format
  if (image.source === 'unsplash') {
    return `Photo by <a href="${attr.photographerUrl}" target="_blank" rel="noopener">${attr.photographer}</a> on <a href="https://unsplash.com/?utm_source=recipe_me&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>`;
  }
  
  // User attribution format
  if (attr.customCredit) {
    return attr.customCredit;
  }
  
  if (attr.photographerUrl) {
    return `<a href="${attr.photographerUrl}" target="_blank" rel="noopener">${attr.photographer}</a>`;
  }
  
  return attr.photographer;
}
/**
 * Render breadcrumbs based on referrer
 */
function renderBreadcrumbs(recipe) {
  const breadcrumbContainer = document.getElementById('breadcrumbs');
  if (!breadcrumbContainer) return;

  // Get category from query param, fall back to sessionStorage
  const params = new URLSearchParams(window.location.search);
  let fromCategory = params.get('from');

  const storageKey = `breadcrumb-${recipe.slug || recipe._id}`;

  if (fromCategory) {
    sessionStorage.setItem(storageKey, fromCategory);
  } else {
    fromCategory = sessionStorage.getItem(storageKey);
  }

  let breadcrumbHTML = '<nav aria-label="Breadcrumb" class="breadcrumb"><a href="/">Home</a>';

if (fromCategory && CATEGORIES_MAP[fromCategory]) {
  breadcrumbHTML += ` <span aria-hidden="true">›</span> <a href="/category/${fromCategory}">${CATEGORIES_MAP[fromCategory]}</a>`;
}

  breadcrumbHTML += ` <span aria-hidden="true">›</span> <span aria-current="page">${recipe.name}</span>`;
  breadcrumbHTML += '</nav>';

  // Also-in tags — exclude the category already in the trail
const otherCategories = (recipe.categories || []).filter(cat => {
  const catSlug = Object.keys(CATEGORIES_MAP).find(key => CATEGORIES_MAP[key] === cat) || cat;
  return catSlug !== fromCategory;
});

if (otherCategories.length > 0) {
  breadcrumbHTML += `<p class="also-in">Also in: ${
    otherCategories.map(cat => {
      const slug = Object.keys(CATEGORIES_MAP).find(key => CATEGORIES_MAP[key] === cat) || cat;
      return `<a href="/category/${slug}">${cat}</a>`;
    }).join(' · ')
  }</p>`;
}

  breadcrumbContainer.innerHTML = breadcrumbHTML;
}
// Like functionality
async function initializeLikes(recipeId, container) {
  const likeButton = container.querySelector("#like-button");

  function applyLikeState(btn, data) {
    btn.setAttribute("aria-pressed", data.liked ? "true" : "false");
    btn.classList.toggle("liked", !!data.liked);
  }

  async function refreshLikes(recipeId) {
    try {
      const authenticated = await isAuthenticated();
      
      if (!authenticated) {
        try {
          const res = await fetch(`/.netlify/functions/like?id=${recipeId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (res.ok) {
            const data = await res.json();
            const countEl = document.getElementById("like-count");
            if (countEl) {
              const likesText = data.likes === 1 ? ` ${data.likes} Like` : ` ${data.likes} Likes`;
              countEl.textContent = likesText;
            }
          }
        } catch (err) {
          console.log('Could not fetch public like count:', err);
        }
        
        const btn = document.getElementById("like-button");
        if (btn) {
          btn.disabled = true;
          btn.title = "Log in to like this recipe";
        }
        return;
      }

      const token = await getToken();
      
      const res = await fetch(`/.netlify/functions/like?id=${recipeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch likes: ${res.status}`);
      }
      
      const data = await res.json();

      let likesText = data.likes === 1 ? ` ${data.likes} Like` : ` ${data.likes} Likes`;
      const countEl = document.getElementById("like-count");

      if (countEl) countEl.textContent = likesText ?? 0;

      const btn = document.getElementById("like-button");
      if (btn) {
        applyLikeState(btn, data);
        btn.disabled = false;
      }
    } catch (err) {
      console.error("Failed to load likes:", err);
      
      const btn = document.getElementById("like-button");
      if (btn) {
        btn.disabled = true;
        btn.title = "Unable to load likes";
      }
    }
  }

  if (likeButton) {
    likeButton.addEventListener("click", async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        if (confirm('You need to log in to like recipes. Log in now?')) {
          window.location.href = '/index.html';
        }
        return;
      }

      const isLiked = likeButton.getAttribute("aria-pressed") === "true";
      const method = isLiked ? "DELETE" : "POST";

      try {
        const token = await getToken();
        
        await fetch(`/.netlify/functions/like?id=${recipeId}`, { 
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        await refreshLikes(recipeId);
      } catch (err) {
        console.error("Like toggle failed:", err);
        alert('Failed to update like. Please try again.');
      }
    });
  }

  await refreshLikes(recipeId);
}

// export { fetchRecipes };