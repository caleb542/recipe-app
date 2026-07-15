
import {
    stringify,
    v4 as uuidv4
} from 'uuid';
// import * as Realm from "realm-web";
import {
    getImageGroup
} from './unsplash.js';

import { getRecipesFromDatabase } from './backend/getRecipesFromDatabase.js';
import { updateRecipeInDatabase } from './backend/updateRecipeInDatabase.js';
import { syncRecipeUpdate } from './helpers/syncRecipe.js';
import { sanitizeHTML, sanitizeText } from './utils/sanitize.js';


const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const convertTimestamp = (rDate) => {
  if (typeof rDate === 'object') {
    // do nothing
  } else if (typeof rDate === 'string') {
    // Strip ordinal suffix (1st, 2nd, 3rd, 4th etc) so Date.parse can handle it
    const cleaned = rDate.replace(/(\d+)(st|nd|rd|th)/, '$1');
    return Math.floor(new Date(cleaned).getTime() / 1000);
  }
}

const getTimestamp = () => {
  const now = new Date();
  const timestampShort = now.toLocaleDateString('en-CA', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }); // "MM-DD-YYYY" equivalent
  const unixTimestamp = Math.floor(now.getTime() / 1000);
  return [timestampShort, unixTimestamp];
}




const listDirections = (directions) => {
    const directionsList = document.getElementById("directions-list");

    directions.forEach((step, index) => {
        const li = document.createElement('li')
        li.innerHTML = ` <label for="${step.id}"><span>${sanitizeText(step.text)}</span></label> 
 <div class="ingredient-actions">
  <button id="${step.id}" data-id="${step.id}" aria-label="Edit ${step.name}" class="item-buttons edit-direction">
    <i class="fa fa-pencil" aria-hidden="true"></i>
  </button> 

  <button class="item-buttons remove-direction" aria-label="Delete ${step.name}" data-name="${step.id}" data-id="${step.id}">
    <i class="fa fa-trash-can" aria-hidden="true"></i>
  </button>
  </div>`;
        directionsList.appendChild(li)
    })

    let editDirectionsButtons = document.querySelectorAll(".direction-container a.edit-item")
    editDirectionsButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault()
            const id = button.getAttribute('dataId');
            editDirection(id)
        })
    })
    let removeDirectionsButtons = document.querySelectorAll(".direction-container a.remove")
    removeDirectionsButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault()

            const id = e.target.getAttribute('dataId');
            const text = this.parentNode.firstChild.textContent;
            removeDirection(id, text)
        })
    })


    const emptyBlock = document.createElement('div')
    const directionsHeading = document.getElementById("directions-heading")
    // directionsHeading.appendChild(emptyBlock)
}
// Replace: import moment from 'moment'
// With this:

export function normalizeDate(createdAt) {
  if (!createdAt) return null;

  // Array format — old: ["Oct 14th, 2022 17:45", 1665783900] or new: ["2026-04-10T...", null]
  if (Array.isArray(createdAt)) {
    const [dateStr, unixTimestamp] = createdAt;
    if (unixTimestamp) return unixTimestamp * 1000; // old — unix to ms
    return new Date(dateStr).getTime(); // new — ISO string to ms
  }

  // Plain string — ISO format
  return new Date(createdAt).getTime();
}

export function formatDate(createdAt) {
  const ms = normalizeDate(createdAt);
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(ms));
}

export function toUnixTimestamp(createdAt) {
  const ms = normalizeDate(createdAt);
  if (!ms) return null;
  return Math.floor(ms / 1000);
}

const openDirectionsDialogue = async (id, text) => {
  const modal = document.querySelector('#add-directions');
  modal.showModal();

  let recipes = await loadRecipesFromLocalStorage();
  let recipeId = location.hash.substring(1);
  let recItem = recipes.find((recipe) => recipe.id === recipeId);
  
  if (!recItem || !recItem.name) {
    console.log("No name for this recipe yet");
  }

  const textBox = document.getElementById("enter-next-step");
  textBox.value = text ?? '';

  // ✅ Update just the text in the DOM as you type
  textBox.oninput = async function (e) {
    const newText = e.target.value;

    await syncRecipeUpdate(recipeId, recipe => {
      recipe.directions = recipe.directions.map(d =>
        d.id === id ? { ...d, text: newText } : d
      );
    });

    // Update ONLY the specific direction's text
    const directionItem = document.querySelector(`li[data-id="${id}"] span`);
    if (directionItem) {
      directionItem.textContent = newText;
    }
  };

  modal.querySelector('textarea').focus();
  modal.addEventListener('transitionend', () => {
    modal.querySelector('textarea').focus();
  });

  const closeDialog = document.querySelector(".dialog-close-button");
  closeDialog.addEventListener('click', async function (e) {
    e.preventDefault();
    modal.close("Cancelled");
    
    // ✅ Re-render full list when closing to ensure everything is synced
    const updatedRecipes = await loadRecipesFromLocalStorage();
    const updatedRec = updatedRecipes.find(r => r.id === recipeId);
    if (updatedRec) {
      const directionsList = document.getElementById("directions-list");
      directionsList.innerHTML = '';
      listDirections(updatedRec.directions);
    }
    
    document.querySelector('#add-step').focus();
  });
};

// Edit Direction Button
const editDirection = async (id) => {
  const recipes = await loadRecipesFromLocalStorage();
  const recipeId = location.hash.substring(1);
  const recItem = recipes.find(recipe => recipe.id === recipeId);
  if (!recItem) return;

  const stepItem = recItem.directions.find(direction => direction.id === id);
  if (!stepItem) return;

  // Just open the dialogue — input listener is handled inside openDirectionsDialogue
  openDirectionsDialogue(id, stepItem.text);
};





// Remove Directions Button
const removeDirection = async (itemID, text) => {
  const recipeId = location.hash.substring(1);

  // Optional: confirm before deleting
  const confirmText = `Erase "${text}"?`;
  if (!confirm(confirmText)) return;

  // Persist via syncRecipeUpdate
  await syncRecipeUpdate(recipeId, recipe => {
    recipe.directions = recipe.directions.filter(d => d.id !== itemID);
  });

  // Re-render from fresh localStorage to avoid stale references
  const updatedRecipes = await loadRecipesFromLocalStorage();
  const updatedRec = updatedRecipes.find(r => r.id === recipeId);
  if (updatedRec) {
    const directionsList = document.getElementById("directions-list");
    directionsList.innerHTML = '';
    listDirections(updatedRec.directions);
  }
};


const addIngredients = () => {
    const addIngredientsButton = document.querySelectorAll('.addIngredient');
    addIngredients.forEach(button => {
        button.addEventListener('click', function () {
            // console.log(newRecipe)
            newRecipe.ingredients.push({
                name: "",
                description: "",
                amount: "",
                unit: "",
                measureWord: "",
                alternatives: [],
                id: `${uuidv4()}`
            })
            saveNewRecipeToLocalStorage(newRecipe)

            newRecipe = loadNewRecipeFromLocalStorage()
            createForm(newRecipe)
           
        })
    })
}


// Sort your notes by one of three ways
const sortRecipes = (sortBy, recipes) => {
  if (!Array.isArray(recipes)) {
    console.warn('sortRecipes expected an array but got:', recipes);
    return [];
  }

  const getTimestamp = (field) =>
    Array.isArray(field) ? field[1] : 0;

  switch (sortBy) {
    case 'byEdited':
      return recipes.sort((a, b) => getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt));
    case 'byCreated':
      return recipes.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
    case 'alphabetical':
      return recipes.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
    default:
      return recipes;
  }
};



/**
 * Migrate old recipe format to new images array format
 */
function migrateRecipeImages(recipe) {
  // If already has images array, nothing to migrate
  if (recipe.images && Array.isArray(recipe.images)) {
    return recipe;
  }

  // Create images array
  recipe.images = [];

  // If old photoURL exists, migrate it
  if (recipe.photoURL) {
    const migratedImage = {
      id: uuidv4(),
      url: recipe.photoURL,
      source: recipe.imageSource || 'unsplash',
      isFeatured: true,
      order: 0,
      cloudinaryPublicId: null,
      attribution: recipe.photographer ? {
        photographer: recipe.photographer,
        photographerUrl: recipe.photographerLink || null,
        requiresAttribution: true,
        canEdit: false
      } : null
    };

    recipe.images.push(migratedImage);
  }

  return recipe;
}

const loadRecipes = async (forceRefresh = false) => {
  const raw = localStorage.getItem('recipes');
  const timestamp = localStorage.getItem('recipes_timestamp');
  
  // ✅ Check if cache is fresh (5 minutes)
  // const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  const isCacheFresh = timestamp && (Date.now() - parseInt(timestamp)) < CACHE_DURATION;
  
  // ✅ Use cache if available and fresh
  if (raw && !forceRefresh && isCacheFresh) {
    console.log('📦 Using cached recipes (age: ' + Math.round((Date.now() - parseInt(timestamp)) / 1000) + 's)');
    
    try {
      let parsed = JSON.parse(raw);
      
      if (Array.isArray(parsed)) {
        // Migrate recipes to new format
        parsed = parsed.map(recipe => migrateRecipeImages(recipe));
        return parsed;
      } else {
        console.warn('⚠️ Cached data is not an array');
        // Fall through to fetch fresh data
      }
    } catch (e) {
      console.error('❌ Failed to parse cached recipes:', e);
      // Fall through to fetch fresh data
    }
  }

   // ✅ Fetch fresh data from database
  console.log('🌐 Fetching recipes from database' + (forceRefresh ? ' (forced refresh)' : ' (cache expired/missing)'));
  
  try {
    const recipes = await getRecipesFromDatabase();
    
    // ✅ Save to cache with timestamp
    localStorage.setItem('recipes', JSON.stringify(recipes));
    localStorage.setItem('recipes_timestamp', Date.now().toString());
    console.log('💾 Cached ' + recipes.length + ' recipes');
    
    return recipes;
  } catch (err) {
    console.warn('⚠️ Fetch failed (likely offline) — falling back to cache:', err.message);
    
    if (raw) {
      try {
        let parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(recipe => migrateRecipeImages(recipe));
        }
      } catch (parseErr) {
        console.error('❌ Stale cache unparseable:', parseErr);
      }
    }
    
    // Nothing usable cached at all — nothing we can do
    throw err;
  }
};


const loadCategories = async (forceRefresh = false) => {
  const raw = localStorage.getItem('categories');
  const timestamp = localStorage.getItem('categories_timestamp');
  
  const CACHE_DURATION = 24 * 60 * 60 * 1000;
  const isCacheFresh = timestamp && (Date.now() - parseInt(timestamp)) < CACHE_DURATION;
  
  if (raw && !forceRefresh && isCacheFresh) {
    return JSON.parse(raw);
  }

  try {
    const res = await fetch('/.netlify/functions/get-categories');
    const data = await res.json();
    
    localStorage.setItem('categories', JSON.stringify(data));
    localStorage.setItem('categories_timestamp', Date.now().toString());
    
    return data;
  } catch (err) {
    console.warn('⚠️ Category fetch failed (likely offline) — falling back to cache:', err.message);
    
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (parseErr) {
        console.error('❌ Stale category cache unparseable:', parseErr);
      }
    }
    
    throw err;
  }
};


const loadRecipesFromLocalStorage = async () => {
    if (localStorage.getItem('recipes')) {
        const recipesJSON = localStorage.getItem('recipes')
        try {
            if (recipesJSON) {
                return await JSON.parse(recipesJSON)
            }

        } catch (e) {
            return []
        }
    }

}

const loadNewRecipeFromLocalStorage = () => {

    if (localStorage.getItem('newRecipe')) {
        const recipesJSON = localStorage.getItem('newRecipe')
        try {
            recipesJSON ? console.log(JSON.parse(recipesJSON)) : []
            return recipesJSON ? JSON.parse(recipesJSON) : []
        } catch (e) {
            return []
        }
    }


}
const saveRecipes = (newRecipes) => {
    localStorage.setItem('recipes', JSON.stringify(newRecipes))

}

const saveNewRecipeToLocalStorage = (newRecipe) => {
    localStorage.setItem('newRecipe', JSON.stringify(newRecipe))

}


const listeners = () => {

  
}
const sendRecipes = async () => {
    const APP_ID = 'data-puyvo'
    const app = new Realm.App({
        id: APP_ID
    });
    const credentials = Realm.Credentials.anonymous();
    let recipes = loadRecipes()


    const user = await app.logIn(credentials);
    const recsd = await user.functions.updateAllRecipes(recipes);

}
const hideWarning = () => {
  const warningCloseButton = document.getElementById('hide-this-header');
  const warningBanner = document.querySelector(".dev-notice");
  
  if (!warningCloseButton || !warningBanner) {
    console.warn('Warning banner or button not found');
    return;
  }
  
  // ✅ Check localStorage on page load
  const warningHidden = localStorage.getItem('warning-notification-hidden');
  
  if (warningHidden === 'true') {
    // Already hidden - apply class immediately
    warningBanner.classList.add("hidden");
    return; // Don't add event listener
  }
  
  // ✅ Add click listener to hide it
  warningCloseButton.addEventListener('click', function (e) {
    e.preventDefault();
    
    // Hide the banner
    warningCloseButton.classList.add("clicked");
     console.warn('Warning close button clicked');
    warningBanner.classList.add("hide-up");
     console.warn('warning banner should be hidden');
    // ✅ Save to localStorage
    localStorage.setItem('warning-notification-hidden', 'true');
  });

  warningCloseButton.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    warningCloseButton.classList.add("clicked");
    warningBanner.classList.add("hide-up");
    localStorage.setItem('warning-notification-hidden', 'true');
  }
});

}

const hamburger = () => {
    const hamburger = document.getElementById('menu-toggle');

     // ✅ Check if element exists before adding listener
    if (!hamburger) {
        console.warn('Menu toggle button not found');
        return;
    }
    
    hamburger.addEventListener('click', function (e) {

        // e.preventDefault()
        toggleMenu();

    })

}
const toggleMenu = () => {
  const toggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  
  if (!toggle || !mobileNav) return;
  
   const isOpen = toggle.getAttribute('aria-expanded') === 'true';
  const icon = toggle.querySelector('i');
  
  if (isOpen) {
    mobileNav.close();
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open the menu');
    if (icon) { icon.classList.replace('fa-times', 'fa-bars'); }
    document.body.classList.remove('nav-open');
  } else {
    mobileNav.show();
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close the menu');
    if (icon) { icon.classList.replace('fa-bars', 'fa-times'); }
    document.body.classList.add('nav-open');
  }
};
const addToExistingRecipes = async () => {
    const newRecipe = loadNewRecipeFromLocalStorage()
    let recipes = await loadRecipes()
    const time = getTimestamp()
    newRecipe.createdAt = time
    newRecipe.id = uuidv4()
    recipes = [...recipes, newRecipe]
    saveRecipes(recipes)
}

// let recipes = await loadRecipes() // IS THIS THE ONE?

// In unsplash images




const removeRecipe = async (recipeId) => {
    let recipes = await loadRecipes()
    let rec = recipes.find((recipe) => recipe.id === recipeId)

    let recNum = (recipes.indexOf(rec))

    const removerRec = () => {
        if (recNum === 0) {
            alert('shift')
            recipes.shift()
        } else if ((recNum + 1) === recipes.length) {
            alert('pop')
            recipes.pop()
        } else {
            alert('splice')
            recipes.splice(recNum, 1)
        }

        saveRecipes(recipes)
        window.location.href = "/"

    }
    removerRec()
}

/**
 * Update the currently editing recipe in localStorage.
 * This ensures that any changes made in the editor are persisted.
 */
async function updateLocalStorage(recipeId, updates = {}) {
  // Load all recipes
  let recipes = await loadRecipes();
  let recipe = recipes.find(r => r.id === recipeId);

  if (!recipe) {
    console.error(`❌ Recipe with ID ${recipeId} not found`);
    return;
  }

  // Merge updates into the recipe object
  Object.assign(recipe, updates);

  // Save back to recipes array
  saveRecipes(recipes);

  // Update the "editingRecipe" cache
  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
}


const like = () => {
    alert(`Thanks, we like you too! Unfortunately we don't have this button wired up yet, because USERS don't exist yet. `)
}
/**
 * Get the featured image for a recipe (backward compatible)
 */
export function getFeaturedImage(recipe) {
  // New format (images array)
  if (recipe.images && recipe.images.length > 0) {
    const featured = recipe.images.find(img => img.isFeatured);
    return featured || recipe.images[0];
  }
  
  // Old format (single photoURL) - backward compatibility
  if (recipe.photoURL) {
    return {
      id: 'legacy',
      url: recipe.photoURL,
      source: recipe.imageSource || 'unsplash',
      isFeatured: true,
      order: 0,
      attribution: recipe.photographer ? {
        photographer: recipe.photographer,
        photographerUrl: recipe.photographerLink
      } : null
    };
  }
  
  return null;
}

/**
 * Get all images for a recipe (backward compatible)
 */
export function getAllImages(recipe) {
  // New format
  if (recipe.images && recipe.images.length > 0) {
    return recipe.images.sort((a, b) => a.order - b.order);
  }
  
  // Old format - return as single-item array
  if (recipe.photoURL) {
    return [{
      id: 'legacy',
      url: recipe.photoURL,
      source: recipe.imageSource || 'unsplash',
      isFeatured: true,
      order: 0,
      attribution: recipe.photographer ? {
        photographer: recipe.photographer,
        photographerUrl: recipe.photographerLink
      } : null
    }];
  }
  
  return [];
}   
const share = () => {
    alert('location')
}
const print = () => {
    window.print()
}

/**
 * Get shareable URL for a recipe
 */
export function getRecipeShareUrl(recipe) {
  if (recipe.fullSlug) {
    return `${window.location.origin}/@${recipe.fullSlug}`;
  }
  // Fallback to hash
  return `${window.location.origin}/article.html#${recipe.id}`;
}

/**
 * Get edit URL for a recipe
 */
export function getRecipeEditUrl(recipe) {
  if (recipe.fullSlug) {
    return `${window.location.origin}/@${recipe.fullSlug}/edit`;
  }
  return `${window.location.origin}/edit.html#${recipe.id}`;
}

export {
    openDirectionsDialogue,
    listDirections,
    editDirection,
    removeDirection,
    removeRecipe,
    // getRecipesFromDatabase,
    addIngredients,
    addToExistingRecipes,
    sortRecipes,
    saveRecipes,
    getTimestamp,
    loadRecipes,
    loadCategories,
    loadRecipesFromLocalStorage,
    loadNewRecipeFromLocalStorage,
    saveNewRecipeToLocalStorage,
    
    toggleMenu,
    hamburger,
    // updateRecipeInDatabase,
    convertTimestamp,
    listeners,
    updateLocalStorage,
    hideWarning
}