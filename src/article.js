import "./style.scss";
import { loadRecipes, formatDate, hamburger, getFeaturedImage, getAllImages, hideWarning, loadRecipesFromLocalStorage, loadCategories } from "./functions.js";
import { marked } from "marked";
import { setupShoppingList } from "./helpers/shoppingList.js";
import { initAuth0, getToken, isAuthenticated, getUser } from './auth/auth0.js';
import { updateAuthUI, setupAuthListeners } from './auth/updateAuthUI.js';
import { RatingDisplay } from './components/RatingDisplay.js';
import { CommunityNotes } from './components/CommunityNotes.js';
import { loadUserProfile, getUserProfile } from './userContext.js';
import { autoEmbedVideos } from './helpers/youtubeEmbed.js';
import { loadHeader, showDevNotice, showEditButton } from './components/HeaderComponent.js';
// import { showSpinner, removeSpinner } from "./components/SpinnerUtils.js";
import { initImpersonationBanner } from "./components/ImpersonationBanner.js";
import { setupSanityMegaMenu } from "./components/MegaMenuSanity.js";
import { CATEGORIES, getCategoryNames } from "./helpers/categories.js";
import { extractYouTubeId, extractVimeoId } from './helpers/youtubeEmbed.js';
import { formatAmount } from './helpers/ingredientParser.js';



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
// showSpinner();

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
    // removeSpinner(400);
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
      // removeSpinner(0);
      location.assign("/index.html");
      return;
    }
    
    const recipe = await response.json();
    const recipesArray = [recipe];
    window.currentRecipeId = recipe.id;
    
    await hydrateArticle(recipesArray, recipe.id);
    
  } catch (error) {
    console.error('Load by slug failed:', error);
    // removeSpinner(0);
    location.assign("/index.html");
  }
}



async function hydrateArticle(recipes, recipeIdOverride = null) {
  if (articleHydrated) {
    console.log('Article already hydrated, skipping...');
    return;
  }
  
  const currentRecipeId = recipeIdOverride || recipeId;
  
  const recItem = Array.isArray(recipes)
    ? recipes.find(recipe => recipe.id === currentRecipeId)
    : null;

  if (!recItem) {
    // removeSpinner(0);
    location.assign("/index.html");
    return;
  }

  if (!slug && recItem.fullSlug) {
    window.history.replaceState({}, '', `/${recItem.fullSlug}`);
  }

  const res = await fetch("/partials/article-template.html");
  const html = await res.text();
  document.body.classList.add('is-hydrated');
  
  // removeSpinner(0);
  container.insertAdjacentHTML("beforeend", html);

  const template = document.getElementById("article-template");
  const tpl = template.content.cloneNode(true);

  const articleTitle = tpl.querySelector(".article__title");
  if (articleTitle) {
    articleTitle.textContent = recItem.name;
    document.title = `Recipe Me - ${recItem.name}`;
    articleTitle.style.viewTransitionName = `recipe-title-${currentRecipeId}`;
  }
 
  const dateEl = tpl.querySelector(".dates");
  if (dateEl) dateEl.innerHTML = `<date>${formatDate(recItem.createdAt)}</date>`;

  const a = tpl.querySelector(".author");
  if (a) {
    const authorName = (recItem.displayAuthor ?? '').trim() || 'Anonymous';
  a.innerHTML = `by ${authorName}`;
  }

  const pt = tpl.querySelector(".prep-time-value");
  if (pt) pt.textContent = recItem.prepTime || "Not specified";

  const tt = tpl.querySelector(".total-time-value");
  if (tt) tt.textContent = recItem.totalTime || "Not specified";

  const dsum = tpl.querySelector(".description.summary");
  if (dsum) dsum.innerHTML = recItem.description;

  // Image gallery
  renderArticleImageGallery(tpl, recItem);

  // Summary content
  const summaryContent = tpl.querySelector(".summary-content");

  if (summaryContent) {
    let html = marked.parse(recItem.article || "");
    html = autoEmbedVideos(html);
    summaryContent.innerHTML = html;
    
    const hasArticle = recItem.article && recItem.article.trim().length > 0;
    const summaryWrapper = tpl.querySelector("div.summary");
    if (summaryWrapper) summaryWrapper.style.display = hasArticle ? '' : 'none';
  }
  // Videos
const videosContainer = tpl.querySelector('.recipe-videos');
if (videosContainer && recItem.videos && recItem.videos.length > 0) {
  const validVideos = recItem.videos.filter(v => v.url && v.url.trim());
  
  validVideos.forEach(video => {
    const youtubeId = extractYouTubeId(video.url);
    const vimeoId = extractVimeoId(video.url);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'video-embed';
    
    if (youtubeId) {
      wrapper.innerHTML = `
        <iframe 
          src="https://www.youtube-nocookie.com/embed/${youtubeId}"
          title="${recItem.name} video"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      `;
    } else if (vimeoId) {
      wrapper.innerHTML = `
        <iframe
          src="https://player.vimeo.com/video/${vimeoId}"
          title="${recItem.name} video"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen>
        </iframe>
      `;
    }
    
    videosContainer.appendChild(wrapper);
  });
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
            formatAmount(ingr.amount),
            ingr.unit || ingr.measureWord,
            ingr.name,
            ingr.description
          ].filter(part => part && String(part).trim());
          amt.textContent = parts.join(' ');

        amt.textContent = parts.join(' ');
        label.append(checkbox, amt);
        li.appendChild(label);
        checklist.appendChild(li);
      });
      // i18n: recipe.checklist.hint
      const checklistHeader = tpl.querySelector('.checklistHeader');
      if (checklistHeader && recItem.ingredients.length > 0) {
        const hint = document.createElement('p');
        hint.className = 'checklist-hint';
        hint.textContent = 'Check items to build your shopping list';
        checklistHeader.appendChild(hint);
      }
    }
  }

// Check ownership and show header edit button
const authenticated = await isAuthenticated();
if (authenticated) {
  const currentUser = await getUser();
  const isAuthor = recItem.author?.auth0Id === currentUser.sub;
  const isLegacy = !recItem.author || recItem.author.name === "Legacy User";
  if (isAuthor || isLegacy) {
    showEditButton(currentRecipeId);
  }
}
  container.appendChild(tpl);

  // Wrap .lists and .directions in a recipe-body div
    const lists = container.querySelector('.lists');
    const directions = container.querySelector('.directions');

    console.log('lists:', lists);
    console.log('directions:', directions);

    if (lists && directions) {
      const recipeBody = document.createElement('div');
      recipeBody.className = 'recipe-body';
      lists.parentNode.insertBefore(recipeBody, lists);
      recipeBody.appendChild(lists);
      recipeBody.appendChild(directions);
      console.log('recipe-body created');
    }

  renderBreadcrumbs(recItem);

  const notesContainer = document.getElementById("community-notes");
  if (notesContainer) {
    new CommunityNotes(notesContainer, currentRecipeId);
  }

  const userProfile = getUserProfile();
  setupShoppingList(recItem, currentRecipeId, userProfile?.email || '');

  if (!likesInitialized) {
    await initializeLikes(currentRecipeId, container);
    likesInitialized = true;
  }

  hamburger();

const devNotice = document.querySelector('.dev-notice-inner');
if (devNotice) {
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'Article View';
  toggleBtn.className = 'view-toggle-btn';
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('recipe-page');
      document.body.classList.toggle('article-page');
    toggleBtn.textContent = document.body.classList.contains('article-page')
      ? 'Recipe View'
      : 'Article View';
  });
  devNotice.appendChild(toggleBtn);
} else {
  alert('no dev-notice');
}

  articleHydrated = true;
  // removeSpinner(1500);
  showDevNotice();
}



function renderArticleImageGallery(tpl, recipe) {
  const galleryEl = tpl.querySelector('.recipe-gallery');
  if (!galleryEl) return;

  let images = getAllImages(recipe);
  if (!images.length) {
    galleryEl.style.display = 'none';
    return;
  }

  // Always show featured first
  images = [...images].sort((a, b) => {
    if (a.isFeatured) return -1;
    if (b.isFeatured) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const figuresEl = galleryEl.querySelector('.recipe-gallery__figures');
  const barEl = galleryEl.querySelector('.recipe-gallery__bar');
  const counterEl = galleryEl.querySelector('.recipe-gallery__counter');
  const linesEl = galleryEl.querySelector('.recipe-gallery__lines');

  let currentIndex = 0;

  function buildAttribution(img) {
    if (!img.attribution) return '';
    const attr = img.attribution;
    if (img.source === 'unsplash') {
      return `Photo by <a href="${attr.photographerUrl}" target="_blank" rel="noopener">${attr.photographer}</a> on <a href="https://unsplash.com/?utm_source=recipe_me&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>`;
    }
    if (attr.customCredit) return attr.customCredit;
    if (attr.photographerUrl) return `Photo by <a href="${attr.photographerUrl}" target="_blank" rel="noopener">${attr.photographer}</a>`;
    return `Photo by ${attr.photographer}`;
  }

  function goTo(index) {
    currentIndex = index;

    // Update figures — show active, hide others
    figuresEl.querySelectorAll('.recipe-gallery__figure').forEach((fig, i) => {
      fig.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      fig.classList.toggle('is-active', i === index);
    });

    // Update counter
    if (counterEl) counterEl.textContent = `${index + 1} / ${images.length}`;


    // Update lines
    if (linesEl) {
      linesEl.querySelectorAll('.recipe-gallery__line').forEach((line, i) => {
        line.classList.toggle('is-active', i === index);
        line.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
    }
  }

  // Render all figures
 figuresEl.innerHTML = images.map((img, i) => {
  const alt = img.attribution?.photographer
    ? `Recipe photo by ${img.attribution.photographer}`
    : `${recipe.name} — photo ${i + 1} of ${images.length}`;
  return `
    <figure class="recipe-gallery__figure${i === 0 ? ' is-active' : ''}" 
      aria-hidden="${i === 0 ? 'false' : 'true'}"
      data-index="${i}">
      <img src="${img.url}" alt="${alt}" ${i > 0 ? 'loading="lazy"' : ''}>
      <figcaption class="recipe-gallery__figure-caption">
        ${buildAttribution(img) || ''}
      </figcaption>
    </figure>
  `;
}).join('');

  // Set view transition name on first image
  const firstImg = figuresEl.querySelector('.recipe-gallery__figure.is-active img');
  if (firstImg) firstImg.style.viewTransitionName = `recipe-img-${recipe.id}`;

  // Single image — no bar needed
  if (images.length === 1) {
    if (barEl) barEl.hidden = true;
    return;
  }

  // Multiple images — show bar
  if (barEl) barEl.hidden = false;

  // Render lines
  if (linesEl) {
    linesEl.innerHTML = images.map((img, i) => `
      <button
        class="recipe-gallery__line${i === 0 ? ' is-active' : ''}"
        aria-label="View photo ${i + 1} of ${images.length}${img.attribution?.photographer ? ': photo by ' + img.attribution.photographer : ''}"
        aria-pressed="${i === 0 ? 'true' : 'false'}"
        data-index="${i}"
      ></button>
    `).join('');

    linesEl.querySelectorAll('.recipe-gallery__line').forEach(line => {
      line.addEventListener('click', () => goTo(parseInt(line.dataset.index)));
    });
  }

  // Pointer drag to advance
  let dragStartX = 0;
  figuresEl.addEventListener('pointerdown', (e) => { dragStartX = e.clientX; });
  figuresEl.addEventListener('pointerup', (e) => {
    const delta = e.clientX - dragStartX;
    if (Math.abs(delta) < 40) return;
    if (delta < 0 && currentIndex < images.length - 1) goTo(currentIndex + 1);
    if (delta > 0 && currentIndex > 0) goTo(currentIndex - 1);
  });

  // Keyboard arrow support
  figuresEl.setAttribute('tabindex', '0');
  figuresEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' && currentIndex < images.length - 1) goTo(currentIndex + 1);
    if (e.key === 'ArrowLeft' && currentIndex > 0) goTo(currentIndex - 1);
  });

  // Init
  const featured = images.find(img => img.isFeatured) || images[0];
  goTo(0);
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

  const params = new URLSearchParams(window.location.search);
  let fromCategory = params.get('from');

  const storageKey = `breadcrumb-${recipe.slug || recipe._id}`;

  if (fromCategory) {
    sessionStorage.setItem(storageKey, fromCategory);
  } else {
    fromCategory = sessionStorage.getItem(storageKey);
  }

  const otherCategories = (recipe.categories || []).filter(cat => {
    const catSlug = Object.keys(CATEGORIES_MAP).find(key => CATEGORIES_MAP[key] === cat) || cat;
    return catSlug !== fromCategory;
  });

  let breadcrumbHTML = '<nav aria-label="Breadcrumb" class="breadcrumb"><a href="/">Home</a>';

  if (fromCategory && CATEGORIES_MAP[fromCategory]) {
    breadcrumbHTML += ` <span aria-hidden="true">›</span> <a href="/category/${fromCategory}">${CATEGORIES_MAP[fromCategory]}</a>`;
  }

  breadcrumbHTML += ` <span aria-hidden="true">›</span> <span aria-current="page">${recipe.name}</span>`;

  if (otherCategories.length > 0) {
    breadcrumbHTML += ` <span class="also-in-label">Also in:</span> ${
      otherCategories.map(cat => {
        const slug = Object.keys(CATEGORIES_MAP).find(key => CATEGORIES_MAP[key] === cat) || cat;
        return `<a href="/category/${slug}" class="also-in-pill">${cat}</a>`;
      }).join('')
    }`;
  }

  breadcrumbHTML += '</nav>';

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


