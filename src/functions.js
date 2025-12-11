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


const loadRecipes = async () => {
  const raw = localStorage.getItem('recipes');

  if (raw) {
    console.log('📦 Getting recipes from localStorage');

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        console.log('✅ Parsed recipes successfully');
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
  return await getRecipesFromDatabase();
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
    console.log(recipes)
    console.log("*************************combining*********************")
    recipes = [...recipes, newRecipe]
    console.log("`````````````````````````````````````````````")
    console.log(recipes)
    console.log(newRecipe)
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
    saveRecipes(recipes)


}

let recipes = await loadRecipes()

const renderImageSelector = async (keyword, pageNumber = 1) => {
  try {
    const response = await getImageGroup(keyword, pageNumber);
    
    if (!response || response.length === 0) {
      alert('No images found. Try a different keyword.');
      return;
    }

    // Get modal elements
    const modal = document.getElementById("select-images");
    const carousel = modal.querySelector('.carousel');
    const imageTrack = modal.querySelector('.carousel-track');
    
    // ✅ Clear previous content
    imageTrack.innerHTML = '';
    
    // Remove old controls if they exist
modal.querySelectorAll('.image-buttons, .count, .close-image-modal, #prev-page, #next-page, #select-image').forEach(el => el.remove());
    
    // ✅ Add your class to carousel
    carousel.classList.add('image-viewport');
    imageTrack.classList.add('image-show');
    
    // ✅ Populate images
    response.forEach((imageObject) => {
      const li = document.createElement('li');
      
      const fig = document.createElement('figure');
      const img = document.createElement('img');
      
      // Store data as data attributes
      img.src = imageObject.urls.thumb;
      img.dataset.url = imageObject.urls.regular;
      img.dataset.photographer = imageObject.user.name;
      img.dataset.link = imageObject.user.links.html;
      img.alt = imageObject.alt_description || 'Unsplash photo';
      
      const caption = document.createElement('figcaption');
      caption.textContent = imageObject.user.name;
      
      fig.appendChild(img);
      fig.appendChild(caption);
      li.appendChild(fig);
      imageTrack.appendChild(li);
    });
    
    const totalImages = response.length;
    let currentSlide = 0;
    
    // ✅ Create navigation buttons (matching your structure)
    const imageButtons = document.createElement('div');
    imageButtons.className = 'image-buttons';
    imageButtons.innerHTML = `
      <button class="btn prev">
        <i class="fa fa-angle-left"></i>
        <span class="hide-text">previous image</span>
      </button>
      <button class="btn next">
        <i class="fa fa-angle-right"></i>
        <span class="hide-text">next image</span>
      </button>
    `;
    
    // ✅ Create count
    const imageCount = document.createElement('p');
    imageCount.className = 'count';
    imageCount.textContent = `Viewing image 1 of ${totalImages}`;
    
    // ✅ Create page navigation buttons
    const prevPageBtn = document.createElement('button');
    prevPageBtn.id = 'prev-page';
    prevPageBtn.textContent = 'Previous Group';
    
    const nextPageBtn = document.createElement('button');
    nextPageBtn.id = 'next-page';
    nextPageBtn.textContent = 'Next Group';
    
    // ✅ Create select button
    const selectBtn = document.createElement('button');
    selectBtn.id = 'select-image';
    selectBtn.textContent = 'Select This Image';
    
    // ✅ Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-image-modal';
    closeBtn.innerHTML = '<span class="hide-text">Close Modal</span><i class="fa fa-times"></i>';
    
    // ✅ Append all to modal
    modal.appendChild(imageButtons);
    modal.appendChild(prevPageBtn);
    modal.appendChild(nextPageBtn);
    modal.appendChild(imageCount);
    modal.appendChild(selectBtn);
    modal.appendChild(closeBtn);
    
    // Get button references
    const prevBtn = imageButtons.querySelector('.prev');
    const nextBtn = imageButtons.querySelector('.next');
    
    // ✅ Slider logic
    let transform = 0;
    const slideWidth = 80; // Based on your li width: 80%
    
const updateUI = () => {
  imageCount.textContent = `Viewing image ${currentSlide + 1} of ${totalImages}`;
  prevBtn.disabled = currentSlide === 0;
  nextBtn.disabled = currentSlide === totalImages - 1;
  
  // Get the actual width of one slide
  const slideWidth = imageTrack.querySelector('li')?.offsetWidth || 0;
  transform = -currentSlide * slideWidth;
  imageTrack.style.transform = `translateX(${transform}px)`;
};
    // ✅ Navigation
    prevBtn.addEventListener('click', () => {
      if (currentSlide > 0) {
        currentSlide--;
        updateUI();
      }
    });
    
    nextBtn.addEventListener('click', () => {
      if (currentSlide < totalImages - 1) {
        currentSlide++;
        updateUI();
      }
    });
    
    // ✅ Keyboard navigation
    const handleKeydown = (e) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        currentSlide--;
        updateUI();
      } else if (e.key === 'ArrowRight' && currentSlide < totalImages - 1) {
        currentSlide++;
        updateUI();
      }
    };
    modal.addEventListener('keydown', handleKeydown);
    
    // ✅ Page navigation
    prevPageBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (pageNumber > 1) {
        modal.removeEventListener('keydown', handleKeydown); // Cleanup
        renderImageSelector(keyword, pageNumber - 1);
      }
    });
    
    nextPageBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.removeEventListener('keydown', handleKeydown); // Cleanup
      renderImageSelector(keyword, pageNumber + 1);
    });
    
    // Disable prev page on first page
    if (pageNumber === 1) {
      prevPageBtn.disabled = true;
    }
    
    // ✅ Select image
    selectBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const selectedImg = imageTrack.querySelectorAll('img')[currentSlide];
      
      if (!selectedImg) {
        alert('No image selected');
        return;
      }
      
      // Get current recipe ID from hash
      const recipeId = location.hash.substring(1);
      const recipes = await loadRecipes();
      const recipe = recipes.find(r => r.id === recipeId);
      
      if (!recipe) {
        alert('Recipe not found. Please refresh the page.');
        return;
      }
      
      // Update recipe with image data
      recipe.photographer = selectedImg.dataset.photographer;
      recipe.photographerLink = selectedImg.dataset.link;
      recipe.photoURL = selectedImg.dataset.url;
      recipe.updatedAt = getTimestamp();
      
      await saveRecipes(recipes);
      
      // Update preview in the form
      const previewImg = document.querySelector('.image-preview img');
      const previewCaption = document.querySelector('.image-preview figcaption');
      
      if (previewImg) previewImg.src = recipe.photoURL;
      if (previewCaption) {
        previewCaption.innerHTML = `Unsplash photo by <a href="${recipe.photographerLink}" target="_blank" rel="noopener">${recipe.photographer}</a>`;
      }
      
      console.log('Image selected:', recipe.photoURL);
      
      // Cleanup and close
      modal.removeEventListener('keydown', handleKeydown);
      modal.close();
    });
    
    // ✅ Close modal
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.removeEventListener('keydown', handleKeydown); // Cleanup
      modal.close();
    });
    
    // ✅ Initial state
    updateUI();
    
    // ✅ Show modal and focus
    modal.showModal();
    nextBtn.focus();
    
  } catch (error) {
    console.error('Error loading images:', error);
    alert('Failed to load images. Please try again.');
  }
};

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
   
const share = () => {
    alert('location')
}
const print = () => {
    window.print()
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
    loadRecipes,
    saveRecipes,
    getTimestamp,
    loadRecipesFromLocalStorage,
    loadNewRecipeFromLocalStorage,
    saveNewRecipeToLocalStorage,
    renderImageSelector,
    toggleMenu,
    hamburger,
    // updateRecipeInDatabase,
    convertTimestamp,
    listeners,
    updateLocalStorage
}