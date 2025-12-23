import "./style.scss";
import { loadRecipesFromLocalStorage, hamburger, getFeaturedImage, getAllImages } from "./functions.js";
import { marked } from "marked";
import { setupShoppingList } from "./helpers/shoppingList.js";
import { initAuth0, getToken, isAuthenticated, getUser } from './auth/auth0.js';
import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { RatingDisplay } from './components/RatingDisplay.js';
import { CommunityNotes } from './components/CommunityNotes.js';
import { loadUserProfile, getUserProfile } from './userContext.js';
import { autoEmbedVideos } from './helpers/youtubeEmbed.js';

// ✅ NEW: Check for slug-based URL first
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('user');
const slug = urlParams.get('slug');

// Fallback to hash-based URL
const recipeId = location.hash.substring(1);

let recipes;
let likesInitialized = false;
let articleHydrated = false;

// Initialize Auth0
await initAuth0();
const authenticated = await isAuthenticated();
if (authenticated) {
  await loadUserProfile(true);
}

await updateAuthUI();
setupAuthListeners();

// Add storage listener
window.addEventListener("storage", e => {
  if (e.key === "recipes") {
    fetchRecipes();
  }
});

// ✅ NEW: Entry point - handle both URL formats
async function fetchRecipes() {
  if (username && slug) {
    // New slug-based URL: /@username/slug
    await loadRecipeBySlug(username, slug);
  } else if (recipeId) {
    // Old hash-based URL: /article.html#recipe-123
    recipes = await loadRecipesFromLocalStorage();
    await hydrateArticle(recipes);
  } else {
    // No recipe specified
    location.assign("/index.html");
  }
}

fetchRecipes();

// ✅ NEW: Load recipe by slug from backend
async function loadRecipeBySlug(username, slug) {
  try {
    const fullSlug = `${username}/${slug}`;
    const response = await fetch(
      `/.netlify/functions/recipe-by-slug?fullSlug=${encodeURIComponent(fullSlug)}`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        console.error('Recipe not found');
        location.assign("/index.html");
      } else {
        console.error('Failed to load recipe');
        location.assign("/index.html");
      }
      return;
    }
    
    const recipe = await response.json();
    
    // Convert to array format for hydrateArticle
    const recipesArray = [recipe];
    
    // Update global recipeId for other functions
    window.currentRecipeId = recipe.id;
    
    await hydrateArticle(recipesArray, recipe.id);
    
  } catch (error) {
    console.error('Load by slug failed:', error);
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
    location.assign("/index.html");
    return;
  }

  // ✅ NEW: Update URL to clean format if loaded via hash
  if (!username && !slug && recItem.fullSlug) {
    const newUrl = `/@${recItem.fullSlug}`;
    window.history.replaceState({}, '', newUrl);
  }

  // Load and insert template first
  const res = await fetch("/partials/article-template.html");
  const html = await res.text();
  const container = document.querySelector(".template-container");
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
        photoInfo.innerHTML = ''; // No attribution needed
      }
    }
  }

  // Display image gallery (all images)
  const imageGalleryContainer = tpl.querySelector(".recipe-image-gallery");
  if (imageGalleryContainer) {
    const allImages = getAllImages(recItem);
    
    if (allImages.length > 0) {
      imageGalleryContainer.innerHTML = `
        <div class="recipe-images-grid">
          ${allImages.map((img, index) => `
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
    html = autoEmbedVideos(html); // Auto-embed YouTube/Vimeo
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
        amt.textContent = `${ingr.amount} ${ingr.unit || ingr.measureWord} ${ingr.name} ${ingr.description}`;
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

  // Community notes
  const notesContainer = document.getElementById("community-notes");
  if (notesContainer) {
    new CommunityNotes(notesContainer, currentRecipeId);
  }

  // Wire shopping list helper
  setupShoppingList(recItem, currentRecipeId, "caleb542@gmail.com");

  // Initialize likes once
  if (!likesInitialized) {
    await initializeLikes(currentRecipeId, container);
    likesInitialized = true;
  }

  // Hamburger + storage listener
  hamburger();
  articleHydrated = true;
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

// Like functionality (unchanged)
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

export { fetchRecipes };