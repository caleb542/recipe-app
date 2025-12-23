import moment from 'moment'
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
import { syncRecipeUpdate } from './helpers/syncRecipe.js'
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const convertTimestamp = (rDate) => {
    if (typeof rDate === 'object') {
        // do nothing
    } else if (typeof rDate === 'string') {
        const format_unix = moment(rDate, 'MMM Do, YYYY HH:mm').unix();
        return format_unix
    }
}

const getTimestamp = () => {
    let timestamp = moment()
    let timestampValueOf = timestamp.valueOf()
    let timestampLong = timestamp.format('MMM Do, YYYY')
    let timestampShort = timestamp.format('MM-DD-YYYY')
    let unixTimestamp = moment(timestampShort, 'MMM Do, YYYY HH:mm').unix();
    return [timestampShort, unixTimestamp]
}




const listDirections = (directions) => {
    const directionsList = document.getElementById("directions-list");

    directions.forEach((step, index) => {
        const li = document.createElement('li')
        li.innerHTML = `<label for="${step.id}"></ <span>${step.text}</span></label> 

      <button id="${step.id}" data-id="${step.id}" class="item-buttons edit-direction">
        <i class="fa fa-pencil" aria-hidden="true"></i> Edit
      </button> 

      <button class="item-buttons remove-direction" data-name="${step.id}" data-id="${step.id}">
        <i class="fa fa-trash-can"></i> Delete
      </button>`
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


const openDirectionsDialogue = async (id, text) => {
  const modal = document.querySelector('#add-directions');
  modal.showModal();

  let recipes = await loadRecipesFromLocalStorage();
  let recipeId = location.hash.substring(1);
  let recItem = recipes.find((recipe) => recipe.id === recipeId);
  if (recItem && recItem.name) {

} else {
    console.log("No name for this recipe yet")
}

  const textBox = document.getElementById("enter-next-step");
  textBox.value = text ?? '';

  // Attach input listener ONCE
  textBox.oninput = async function (e) {
    const newText = e.target.value;
    console.log("Input event fired:", newText);

    await syncRecipeUpdate(recipeId, recipe => {
      recipe.directions = recipe.directions.map(d =>
        d.id === id ? { ...d, text: newText } : d
      );
    });

    // Re-render directions list from updated localStorage
    const updatedRecipes = await loadRecipesFromLocalStorage();
    const updatedRec = updatedRecipes.find(r => r.id === recipeId);
    if (updatedRec) {
      const directionsList = document.getElementById("directions-list");
      directionsList.innerHTML = '';
      listDirections(updatedRec.directions);
    }
  };

  modal.querySelector('textarea').focus();
  modal.addEventListener('transitionend', () => {
    modal.querySelector('textarea').focus();
  });

  const closeDialog = document.querySelector(".dialog-close-button");
  closeDialog.addEventListener('click', function (e) {
    e.preventDefault();
    modal.close("Cancelled");
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

const loadRecipes = async () => {
  const raw = localStorage.getItem('recipes');

  if (raw) {
    console.log('📦 Getting recipes from localStorage');

    try {
      let parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        console.log('✅ Parsed recipes successfully');
        
        // ✅ Migrate recipes to new format
        parsed = parsed.map(recipe => migrateRecipeImages(recipe));
        
        // Save migrated recipes back to localStorage
        localStorage.setItem('recipes', JSON.stringify(parsed));
        
        return parsed;
      } else {
        console.warn('⚠️ Parsed data is not an array:', parsed);
        return [];
      }
    } catch (e) {
      console.error('❌ Failed to parse recipes from localStorage:', e);
      return [];
    }
  }

  console.log('🌐 Fetching recipes from database');
  const recipes = await getRecipesFromDatabase();
  
  // ✅ Recipes are already migrated by the backend
  return recipes;
};

export { loadRecipes };


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
const hamburger = () => {
    const hamburger = document.getElementById('menu-toggle');

    hamburger.addEventListener('click', function (e) {

        e.preventDefault()
        toggleMenu();
    })

}
const toggleMenu = () => {
    let toggle = document.getElementById('menu-toggle')
    let menu = document.querySelector('nav');
    let status = toggle.getAttribute('aria-label');
    let nav = document.querySelector('nav');

    if (status.toLowerCase() === 'open the menu') {
        toggle.setAttribute('aria-label', 'close the menu');
        nav.classList.remove('hide')
        nav.classList.add('open')
        nav.setAttribute('aria-expanded', 'true')
        const a = document.querySelectorAll('nav a')
        a.forEach(anchor => {
            let tabindex = anchor.getAttribute('tabindex')
            tabindex === "-1" ? anchor.setAttribute('tabindex', "0") : anchor.setAttribute('tabindex', "-1")
        })

    }
    if (status.toLowerCase() === 'close the menu') {
        toggle.setAttribute('aria-label', 'Open the menu');
        nav.classList.add('hide')
        nav.classList.remove('open')
        nav.setAttribute('aria-expanded', false)
        const a = document.querySelectorAll('nav a')
        a.forEach(anchor => {
            let tabindex = anchor.getAttribute('tabindex')
            tabindex === "0" ? anchor.setAttribute('tabindex', "-1") : anchor.setAttribute('tabindex', "0")
        })
    }
}
const addToExistingRecipes = () => {
    const newRecipe = loadNewRecipeFromLocalStorage()
    let recipes = loadRecipes()
    const time = getTimestamp()
    newRecipe.createdAt = time
    newRecipe.id = uuidv4()
    recipes = [...recipes, newRecipe]
    saveRecipes(recipes)


}

let recipes = await loadRecipes()

// In unsplash images

import { selectUnsplashImageForGallery } from './helpers/featureImage.js';

export async function renderImageSelector(keyword, pageNumber, recipeId) {
  const modal = document.getElementById('select-images');
  const carouselTrack = modal?.querySelector('.carousel-track');
  
  if (!carouselTrack) return;

  // Show loading
  carouselTrack.innerHTML = '<li class="loading">Searching Unsplash...</li>';
  modal.showModal();

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&page=${pageNumber}&per_page=20&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      carouselTrack.innerHTML = '<li class="no-results">No images found.</li>';
      return;
    }

    // Render results with UTM parameters for Unsplash compliance
    carouselTrack.innerHTML = data.results.map(photo => `
      <li class="carousel-item">
        <div class="unsplash-photo">
          <img src="${photo.urls.small}" alt="${photo.alt_description || ''}" />
          <div class="photo-info">
            <div class="photo-credit">
              Photo by <a href="${photo.user.links.html}?utm_source=recipe_me&utm_medium=referral" target="_blank" rel="noopener">${photo.user.name}</a>
            </div>
            <button 
              class="select-photo-btn"
              data-url="${photo.urls.regular}"
              data-photographer="${photo.user.name}"
              data-photographer-link="${photo.user.links.html}?utm_source=recipe_me&utm_medium=referral"
            >
              <i class="fa-solid fa-plus"></i> Add to Recipe
            </button>
          </div>
        </div>
      </li>
    `).join('');

    // Add click handlers
    const selectButtons = carouselTrack.querySelectorAll('.select-photo-btn');
    selectButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        await selectUnsplashImageForGallery(
          recipeId,
          button.dataset.url,
          button.dataset.photographer,
          button.dataset.photographerLink // Now includes UTM params
        );
        
        // Close modal
        modal.close();
        
        // Clear search input
        const searchInput = document.getElementById('feature-keyword');
        if (searchInput) searchInput.value = '';
      });
    });

  } catch (error) {
    console.error('Unsplash search error:', error);
    carouselTrack.innerHTML = '<li class="error">Search failed. Please try again.</li>';
  }
}

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
    loadRecipesFromLocalStorage,
    loadNewRecipeFromLocalStorage,
    saveNewRecipeToLocalStorage,
    
    toggleMenu,
    hamburger,
    // updateRecipeInDatabase,
    convertTimestamp,
    listeners,
    updateLocalStorage
}