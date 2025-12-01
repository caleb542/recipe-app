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

const renderImageSelector = (keyword, pageNumber) => {
    let responseLength
    let images;
    getImageGroup(keyword, pageNumber)
        .then(response => {
            responseLength = response.length;
            console.log(responseLength)
            const selectImages = document.getElementById("select-images")

            // selectImages.classList.add('show')
            selectImages.showModal();
            
            const imageViewport = document.querySelector('.carousel')
            imageViewport.classList.add('image-viewport');
            // const imageOverlay = document.createElement('div')
            // imageOverlay.setAttribute('id','image-overlay')
            const imageShow = document.querySelector('ul.carousel-track');
            imageShow.classList.add('image-show');
            response.forEach(imageObject => {

                const li = document.createElement('li')

                const fig = document.createElement('figure')
                const img = document.createElement('img')
                img.setAttribute('src', `${imageObject.urls.thumb}`)
                img.setAttribute('dataURL', `${imageObject.urls.regular}`)
                img.setAttribute('dataName', `${imageObject.user.name}`)
                img.setAttribute('dataLink', `${imageObject.user.links.html}`)
                const caption = document.createElement('figcaption')
                caption.innerHTML = `<p>${imageObject.user.name}</p>`

                // fig.appendChild(imgAnchor);

                fig.appendChild(img)
                li.appendChild(fig)
                fig.appendChild(caption);
                // imageViewport.appendChild(imageOverlay);
               
                imageShow.appendChild(li);


                // document.getElementById('select-images').appendChild(imageViewport);


                images = document.querySelectorAll('.imageListItem');

            })

            let recItem = async () => {
                let recipes = await loadRecipes()
                let recipeId = location.hash.substring(1)
                recItem = recipes.find((recipe) => recipe.id === recipeId)
                return recItem
            }

            //   alert(e.target.getAttribute('dataName'))





            const imageButtons = document.createElement('div');
            imageButtons.classList.add('image-buttons')
            imageButtons.innerHTML = `
            <button disabled class="btn prev"><i class="fa fas-solid fa-angle-left"></i><span class="hide-text">previous image</span></button>
            <button class="btn next"><i class="fa fas-solid fa-angle-right"></i><span class="hide-text">next image</span></button>`
            const imageCount = document.createElement('p')
            imageCount.classList.add('count')
            imageCount.textContent = 'Viewing image 1'
            const prev = document.createElement('button')
            const next = document.createElement('button')
            const modal = document.querySelector('dialog');
            modal.setAttribute("closeBy","any");


            prev.setAttribute('id', 'prev-page');
            next.setAttribute('id', 'next-page');
            prev.textContent = "Previous group";
            next.textContent = "Next Group";
            const selectImagesModal = document.getElementById('select-images')
            selectImagesModal.appendChild(imageButtons);
            selectImagesModal.appendChild(prev);
            selectImagesModal.appendChild(next);
            selectImagesModal.appendChild(imageCount);

            const selectImage = document.createElement('button')
            selectImage.setAttribute('id', 'select-image')
            selectImage.textContent = 'Select this image';
            selectImagesModal.appendChild(selectImage);

            const closeImageModal = document.createElement('button')
            closeImageModal.classList.add('close-image-modal')
            closeImageModal.innerHTML = `<span class="hide-text">Close Modal</span><i class="fa fas-solid fa-times"></i>`
            selectImagesModal.appendChild(closeImageModal)


            const pagedown = document.getElementById('prev-page')
            const pageup = document.getElementById('next-page')

            selectImagesModal.querySelector('.next').focus();
            selectImagesModal.addEventListener('transitionend', (e) => {
                selectImagesModal.querySelector('.btn').focus();
            });

       
            const slider = document.querySelector('.image-show')
            let images = document.querySelectorAll('#select-images img')

            let position = 0;
            let transform = 0;
            const decrementSlider = () => {
                position++;
                slider.style.transform = `translateX(${transform-=20}rem)`
            }
            const incrementSlider = () => {
                position--;
                slider.style.transform = `translateX(${transform+=20}rem)`
            }


            const previmage = document.querySelector('.prev');
            const nextimage = document.querySelector('.next');

            const total = responseLength;
            let slideNum = 1;
            let info;
            let count = document.querySelector('.count')


            previmage.addEventListener('click', function () {
                if (slideNum !== 1) {


                    slideNum -= 1;
                    info = `Viewing image ${slideNum}/${total}`;
                    count.textContent = info;
                    incrementSlider()


                }

                slideNum === 1 ? previmage.disabled = true : previmage.disabled = false
                slideNum === responseLength ? nextimage.disabled = true : nextimage.disabled = false
            })
            nextimage.addEventListener('click', function () {

                if (slideNum !== responseLength) {

                    slideNum += 1;
                    info = `Viewing image ${slideNum}/${total}`;
                    count.textContent = info;
                    decrementSlider()
                }

                slideNum === 1 ? previmage.disabled = true : previmage.disabled = false
                slideNum === responseLength ? nextimage.disabled = true : nextimage.disabled = false
            })

            slideNum === 1 ? previmage.disabled = true : previmage.disabled = false
            slideNum === responseLength ? nextimage.disabled = true : nextimage.disabled = false

            /*--------------*/
            pagedown.addEventListener('click', function (e) {
                e.preventDefault()
                if (pageNumber === 0) {
                    // this.setAttribute(disabled, true)

                } else {

                    pageNumber -= 1
                    renderImageSelector(pageNumber)
                    console.log(`page number ${pageNumber}`)
                }
            })
            pageup.addEventListener('click', function (e) {
                e.preventDefault()
                if (pageNumber >= responseLength) {
                    //    this.setAttribute(disabled, true)
                    // console.error("something")
                } else {
                    pageNumber += 1
                    renderImageSelector(pageNumber)
                    console.log(`*page number ${pageNumber}`)
                }
            })

            selectImage.addEventListener('click', async function (e) {

                e.preventDefault()
                console.log("selecting image")
                const selected = images[slideNum - 1];

                let recipeId = location.hash.substring(1);
                recipes = await loadRecipes()
                recItem = recipes.find((recipe) => recipe.id === recipeId)

                recItem.photographer = selected.getAttribute('dataName')
                recItem.photographerLink = selected.getAttribute('dataLink')
                recItem.photoURL = selected.getAttribute('dataURL')
                recItem.updatedAt = getTimestamp();

                console.log(recItem.photoURL);
                console.log(recItem.photographer);
                console.log(recItem.photographerLink);

                saveRecipes(recipes)
                document.querySelector('.image-preview img').setAttribute('src', recItem.photoURL);
                document.querySelector('.image-preview figcaption').innerHTML = `Unsplash photo by <a href="${recItem.photographerLink}">${recItem.photographer}</a>`;
            })

            // const chooseImage = document.querySelectorAll(".imageListItem");
            // chooseImage.forEach(imageAnchor => {
            //     imageAnchor.addEventListener('keypress', function(e){
            //         setAttribute(dataurl)
            //     })
            // })
            const closeModal = document.querySelector('.close-image-modal')
            closeModal.addEventListener('click', function (e) {
                e.preventDefault()
                const modal = document.getElementById('select-images')
                modal.close("Cancelled")
              
            })

        })
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