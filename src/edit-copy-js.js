
import "./style.scss";
import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import {deleteRecipeFromDatabase} from './backend/deleteRecipeFromDatabase.js'

import {Notyf} from 'notyf';
const notyf = new Notyf();
import TurndownService from 'turndown';
const turndownService = new TurndownService();
import {getImageGroup} from './unsplash.js'
import {stringify, v4 as uuidv4} from 'uuid';
import {
  openDirectionsDialogue,
  listDirections,
  editDirection,
  removeDirection,
  removeRecipe,
  loadRecipes,
  saveRecipes,
  loadRecipesFromLocalStorage,
  getTimestamp,
  renderImageSelector,
  toggleMenu,
  hamburger,
  listeners
} from "./functions.js"

import {updateRecipeInDatabase} from "./backend/updateRecipeInDatabase.js";
import {updateRecipe, updateIngredient} from "./update.js"

/***************** */

let newRecipe = {
  name: "New unnamed recipe",
  photoURL: "https://unsplash.com/photos/cooked-food-on-table-1R7iHPt63Lc",
  photographer: "Tim Cooper",
  photographerLink: "https://unsplash.com/@tcooper86",
  createdAt: [],
  updatedAt: [],
  author: "anonymous",
  description: "",
  directions: [
    {
      id: uuidv4(),
      text: "Start here"
    }
  ],
  categories: ['Food'],
  article: "",
  id: "",
  ingredients: [
    {
      name: "First ingredient",
      description: "describe",
      amount: "2",
      unit: "cups",
      measureWord: "",
      alternatives: [],
      id: `${uuidv4()}`
    }
  ]
}
let recipeId = location
  .hash
  .substring(1);
const doneEditing = document.getElementById('done-editing');
doneEditing.setAttribute('href', `article.html#${recipeId}`)

if (!location.hash.substring(1)) {
  const title = document.querySelector('.header__title');
  title.textContent = 'New Recipe'
  let subtitleEl = document.createElement('span')
  subtitleEl
    .classList
    .add('header__subtitle')
  title.appendChild(subtitleEl)

  console.log('No hash yet, must create one')
  recipeId = uuidv4()
  doneEditing.setAttribute('href', `article.html#${recipeId}`)
  let createdAt = getTimestamp()
  if (history.pushState) {
    history.pushState(null, null, `edit.html#${recipeId}`);

  } else {
    if (recipeId !== "") {
      location.hash = `edit.html#${recipeId}`;
      console.log(`Creating a new hash for this recipe: ${recipeId}`)
    } else {
      console.error("This doesn't seem to have a recipe id yet!")
    }
  }

  // set up a new recipe in the recipes object

  let recs = await loadRecipes()
  console.log('createedAt')
  console.log(newRecipe)
  console.log(recs)
  console.log("###")
  newRecipe.id = recipeId
  newRecipe.createdAt = createdAt
  console.log(recs.push(newRecipe))

  saveRecipes(recs)

}

async function updateLocalStorage() {
  const updated = {
    name: document.getElementById('recipe-name')?.value || '',
    description: document.getElementById('recipe-description')?.value || '',
    article: toastEditor?.getMarkdown() || '',
    author: document.querySelector('#recipe-author')?.value || '',
    directions: Array.from(document.querySelectorAll('.direction-step')).map(el => el.textContent),
    categories: document.querySelector('#categories textarea')?.value.split(',').map(s => s.trim()),
    updatedAt: [getTimestamp()]
  };

  localStorage.setItem('editingRecipe', JSON.stringify(updated));

  const recipes = await loadRecipesFromLocalStorage();
  const index = recipes.findIndex(r => r.id === recipeId);
  if (index !== -1) {
    Object.assign(recipes[index], updated);
    saveRecipes(recipes);
  }
}

const recipeContainer = document.querySelector('.recipe-list');

// const initEdit = async(recipeId) => {

//   let recipes = await loadRecipes()
//   let recItem = recipes.find((recipe) => recipe.id === recipeId)
//   if (!recItem) {
//     location.assign('/index.html')
//   }

//   localStorage.setItem('editingRecipe', JSON.stringify(recItem));
//   let section1 = document.querySelector('.section-1');

//   const headingSpan = document.querySelector('#heading-name');
//   const nameInput = document.getElementById('recipe-name');

//   if (recItem
//     ?.name) {

//     nameInput.value = recItem.name;
//     headingSpan.textContent = recItem.name;

//   }

//   const recipeDescription = document.getElementById('recipe-description')
//   recipeDescription.value = recItem.description

//   const recipeAuthor = document.getElementById('recipe-author');
//   recipeAuthor.value = recItem.author
  
//   const directionsHeading = document.getElementById('directions-heading');
//   directionsHeading.setAttribute("id", "directions-heading")
//   const directionsList = document.querySelector("#directions-heading ol");
//   directionsList.setAttribute('id', 'directions-list')
//   directionsList
//     .classList
//     .add("directions")
//   /* ----- */

//   const recipeDirections = recItem.directions
//   listDirections(recipeDirections)
//   const addStepButton = document.getElementById("add-step");

//   // directions listeners
//   addStepButton.addEventListener('click', async function (e) {

//     e.preventDefault()

//     let recipeId = location
//       .hash
//       .substring(1);
//     recipes = await loadRecipesFromLocalStorage()
//     let recItem = recipes.find(recipe => recipe.id === recipeId)
//     let newDirections = {
//       id: uuidv4(),
//       text: ""
//     }
//     recItem
//       .directions
//       .push(newDirections)
//     const id = newDirections.id
//     const text = newDirections.text

//     saveRecipes(recipes)

//     let directionDialog = document.querySelectorAll('#add-directions');
//     openDirectionsDialogue(id, text)
//   })

//   document
//     .querySelectorAll('#recipe-name, #recipe-description, #recipe-author, #categories textarea')
//     .forEach(el => el.addEventListener('input', updateLocalStorage));

//   const rawHTML = recItem.article || '';
//   console.log('Raw HTML from DB:', rawHTML);
//   const markdown = turndownService.turndown(rawHTML);

//   const toastEditor = new Editor({
//     el: document.querySelector('#editor'),
//     height: '400px',
//     initialEditType: 'markdown',
//     previewStyle: 'vertical',
//     initialValue: markdown,
//     hooks: {
//       change: () => updateLocalStorage()
//     }
//   });

//   window.toastEditor = toastEditor;
//   toastEditor.getMarkdown()

//   console.log('Editor content:', toastEditor.getMarkdown());

//   document
//     .getElementById('save-button')
//     .addEventListener('click', () => {

//       let recipe = JSON.parse(localStorage.getItem('editingRecipe'));
//       setTimeout(() => doUpdates(recipe), 300);
//       if (!recipe || !recipe.id) {
//         console.error("⚠️ Recipe not ready — retrying in 100ms...");
//         setTimeout(() => doUpdates(), 500);
//         return;
//       } else {
//         console.log('else');
//         doUpdates()
//       }

//       function doUpdates() {
//         console.log('doUpdates', recipe.id)
//         const updates = {

//           name: recipe.name || '',
//           article: recipe.article || '',
//           createdAt: recipe.createdAt || '',
//           author: recipe.author || '',
//           description: recipe.description || '',
//           categories: recipe.categories || '',
//           ingredients: recipe.ingredients || '',
//           directions: recipe.directions || '',
//           photoURL: recipe.photoURL || '',
//           photographer: recipe.photographer || '',
//           photographerLink: recipe.photographerLink || ''
//           // Add other fields as needed
//         };
//         try {
//           const result = updateRecipeInDatabase(recipe.id, updates);
//           localStorage.setItem('editingRecipe', JSON.stringify(result.recipe));
//           notyf.success("Recipe updated!");

//           setTimeout(() => {
//             window.location.href = '/'; // or refresh the recipe list
//           }, 2500);
//         } catch (err) {
//           console.error("❌ Update failed:", err);
//           notyf.error("Failed to update recipe.");
//         }
//       }

//     });

 
//   document.getElementById('remove-recipe').addEventListener('click', async() => {

//       deleteRecipeFromDatabase(recItem);
//     });

//   const editDirectionButtons = document.querySelectorAll('.directions a.edit-item');

//   editDirectionButtons.forEach(pencil => {
//     pencil.addEventListener('click', function (e) {
//         e.preventDefault();

//         console.log('pow!')
//         const id = e.target.getAttribute('dataId');
//         editDirection(id)
//       })

//   })

//   const recipeCategoriesLabel = document.getElementById('categories');
//   const recipeCategories = recipeCategoriesLabel.querySelector("textarea");
//   const recipeCategoriesName = recipeCategoriesLabel.querySelector("div");

//   recipeCategories.value = recItem.categories.join(",");
//   recipeCategories.textContent = recItem.categories

//   const featureImageFieldset = document.getElementById('image')

//   const featureImageButton = document.getElementById("feature-image-button")
//   const featureImageButtonIcon = document.querySelector('#feature-image-button i');

//   const selectImages = document.getElementById('select-images')

//   featureImageFieldset.classList.add('feature-image');

//   const featureKeyword = document.createElement("feature-keyword")
//   featureKeyword.value = recItem.name;
//   const storedImage = recItem.photoURL;

//   const imagePreview = document.querySelector('figure.image-preview');
//   const image = imagePreview.querySelector('img');
//   image.setAttribute('src', storedImage);
//   const figcaption = document.querySelector('figcaption')
//   figcaption.innerHTML = `Unsplash photo by <a href="${recItem.photographerLink}">${recItem.photographer}</a>`
//   image.setAttribute('style', 'width:200px;aspect-ratio:16/9');


//   const recipeContainer = document.querySelector('.recipe-list')
//   const ingredientsContainer = document.getElementById('ingredients');
//   ingredientsContainer.classList.add('edit-ingredients')
 

//   listIngredients()

//   recipes = await loadRecipes()
//   document.getElementById("recipe-name").addEventListener('input', (e) => {
//       document
//         .querySelector('.header__subtitle')
//         .textContent = e.target.value
//       updateRecipe(recipeId, {name: e.target.value})
//       //dateElement.textContent = generateLastEdited(note.updatedAt)
//     })

//   recipeAuthor.addEventListener('input', (e) => {
//     updateRecipe(recipeId, {author: e.target.value})
//   })

//   document.getElementById('feature-image-button').addEventListener('click', function (e) {
//       // fire off image selection carousel
//       e.preventDefault()

//       document.getElementById('feature-image-button').classList.add('return-focus')

//       let pageNumber = 1;
//       let keyword = document.getElementById('feature-keyword').value;
//       keyword === '' ? keyword = 'pie': keyword = keyword
//       renderImageSelector(keyword, pageNumber)

//     })

//   const removeIngredient = async(id) => {
//     let recipes = await loadRecipes()
//     let rec = recipes.find((recipe) => recipe.id === recipeId)
//     let arr = rec.ingredients;
//     let item = arr.find(ingredient => ingredient.id === id)
//     let itemNum = (arr.indexOf(item))
//     // alert(itemNum)  const removerIng = () => {
//     if (itemNum === 0) {
//       //    alert('shift')
//       arr.shift()
//     } else if ((itemNum + 1) === arr.length) {
//       // alert('pop')
//       arr.pop()
//     } else {
//       //  alert('splice')
//       arr.splice(itemNum, 1)
//     }
//     // console.log(rec)
//     saveRecipes(recipes)
//     listIngredients()

//   }



// //   const editRecipeButtons = document.querySelectorAll('.recipe li a.edit-item');
// //   editRecipeButtons.forEach(button => {
// //     button
// //       .addEventListener('click', function (e) {
// //         alert('click')
// //         e.preventDefault();
// //         let dialogs = document.querySelector('#ingredient-modal');

// //         button.classList.add('return-focus')

// //         let ingredientId = e.target.getAttribute('data-id')
// //         let item = recItem.ingredients.find((ingredient) => ingredient.id === ingredientId)
// //         // alert('boogie')
// //         editIngredient(item)
// //       })
// //   })
//   const editIngredient = async(i) => {

//     let dialogs = document.querySelectorAll('#ingredient-modal');
//     if (dialogs.length > 1) {
//       dialogs.forEach(di => {})
//     }

//     const modal = document.getElementById("ingredient-modal")
//     modal.showModal();
//     // modal.close("Cancelled")

//     const modalInner = document.getElementById("ingredient");
//     let name = document.querySelector('#ingredient #name');
//     let description = document.querySelector('#ingredient #description');
//     let amount = document.querySelector('#ingredient #amount');
//     let unit = document.querySelector('#ingredient #unit');
//     let measureWord = document.querySelector('#ingredient #measureWord');

//     name.value = i.name || "";
//     name.setAttribute('data-id', i.id || "");
//     description.value = i.description || "";
//     description.setAttribute('data-id', i.id || "");
//     amount.value = i.amount || "";
//     amount.setAttribute('data-id', i.id);
//     unit.value = i.unit || "";
//     unit.setAttribute('data-id', i.id);
//     measureWord.setAttribute('data-id', i.id);
//     measureWord.value = i.measureWord || '';

//     // modal.innerHTML = modalInner; Show modal
//     modal.showModal();

    

//     const inputs = modal.querySelectorAll('input');
//     inputs.forEach(input => {
//       const dataid = input.getAttribute('data-id');
//       const id = input.getAttribute('id')
//       input.addEventListener('input', (e) => {

//         const val = e.target.value
//         if (id === 'name') {
//           updateIngredient(recipeId, dataid, id, {name: val})
//         } else if (id === 'description') {
//           updateIngredient(recipeId, dataid, id, {description: val})
//         } else if (id === 'amount') {
//           updateIngredient(recipeId, dataid, id, {amount: val})
//         } else if (id === 'unit') {
//           updateIngredient(recipeId, dataid, id, {unit: val})
//         } else if (id === 'measureWord') {
//           updateIngredient(recipeId, dataid, id, {measureWord: val})
//         }

//       })
//     })

// }



//   //----------------------------------------------------------------------------------------//
// // Close button
//     document.addEventListener("DOMContentLoaded", () => {
//       const closeBtn = document.getElementById("close-ingredient-modal");
      
//       if (closeBtn) {
//         closeBtn.addEventListener("click", (e) => {
//           e.preventDefault();
          
//           const modal = document.getElementById("ingredient-modal");
//           modal.close("Cancelled");
//           listIngredients();
//            let focusedElement = document.activeElement;
//            console.log(focusedElement)
//             focusedElement.blur();
//             console.log(focusedElement)
//              focusedElement.blur();
            
//         });
//       }
//     });
//   recipeCategories.addEventListener("input", function (e) {
//       const recipeId = location.hash.substring(1);
//       const raw = e.target.value;

//       // Split by comma, trim whitespace, and filter out empty strings
//       const val = raw.split(',').map(s => s.trim()).filter(Boolean);

//       // Update backend
//       updateRecipe(recipeId, {categories: val});

//       // Update localStorage
//       updateLocalStorage();
//     });

//   const addAnIngredient = document.getElementById("add-an-ingredient");

//   addAnIngredient.addEventListener('click', async function (e) {
//     e.preventDefault();

//     const hasDialogs = document.querySelectorAll('#ingredient-modal');

//     if (hasDialogs && hasDialogs.length > 1) {
//       return // if there is already a modal open, return
//     }
//     let recipeId = location.hash.substring(1);
//     let recipes = await loadRecipes()
//     let recItem = recipes.find((recipe) => recipe.id === recipeId)

//     let newIngredient = {
//       name: "",
//       description: "",
//       amount: "",
//       unit: "",
//       measureWord: "",
//       alternatives: [],
//       id: uuidv4()
//     }
//     //  let recipes = await loadRecipes();
//     let uuid = newIngredient.id
//     recItem.ingredients.push(newIngredient)
//     const updateIt = recipes.find((recipe) => {
//       if (recipe.id === recItem.id) {
//         let thisItem = recItem.ingredients.find(ingredient => ingredient.id === uuid)
//         // alert(thisItem.name)
//         editIngredient(thisItem)
//         //recipe.ingredients.push(newIngredient)
//         saveRecipes(recipes)
//       }
//     })
 
//   }, {once: true})

//   const setFocus =  function () {
   
//     const focusedElement = document.activeElement;
//     document.getElementById('ingredient-modal').focus();
//     console.log("FOCUS ON ", focusedElement)
    

//   }
//   setFocus()
// }
const initEdit = async (recipeId) => {
  let recipes = await loadRecipes();
  let recItem = recipes.find((recipe) => recipe.id === recipeId);
  if (!recItem) {
    location.assign('/index.html');
    return;
  }

  localStorage.setItem('editingRecipe', JSON.stringify(recItem));

  // Populate fields
  document.getElementById('recipe-name').value = recItem.name || '';
  document.getElementById('recipe-description').value = recItem.description || '';
  document.getElementById('recipe-author').value = recItem.author || '';
  document.querySelector('#heading-name').textContent = recItem.name || '';

  // Directions
  listDirections(recItem.directions);

  // Ingredients rendering
  const recipeContainer = document.querySelector('#recipe ul.recipe');
  const listIngredients = async () => {
    recipeContainer.innerHTML = '';
    recipes = await loadRecipesFromLocalStorage();
    recItem = recipes.find(recipe => recipe.id === recipeId);

    recItem.ingredients.forEach(ingred => {
      if (!ingred.id) {
        ingred.id = uuidv4();
        saveRecipes(recipes);
      }

      const li = document.createElement('li');
      li.innerHTML = `
        <label>
          <a class="edit-ingredient" href="edit.html#${recipeId}" data-id="${ingred.id}">
            <span data-id="${ingred.id}">${ingred.amount} ${ingred.unit || ingred.measureWord} ${ingred.name}</span>
            <i class="fa fa-pencil" aria-hidden="true" data-id="${ingred.id}"></i>
            <span class="hide-text">Edit</span>
          </a>
        </label>
        <button class="remove-ingredient" data-name="${ingred.name}" data-id="${ingred.id}">
          <i class="fa fa-times"></i>
        </button>
      `;
      recipeContainer.appendChild(li);
    });
  };

  await listIngredients();

  // 🔑 Single delegated listener for all ingredient actions
 

  // Remove ingredient helper
//   const removeIngredient = async (id) => {
//     let recipes = await loadRecipes();
//     let rec = recipes.find(r => r.id === recipeId);
//     rec.ingredients = rec.ingredients.filter(ing => ing.id !== id);
//     saveRecipes(recipes);
//     listIngredients();
//   };

  
};





initEdit(recipeId);
hamburger()



 const listIngredients = async() => {
    
    recipeContainer.innerHTML = ''
    const recipes = await loadRecipesFromLocalStorage()
    recipeId = location.hash.substring(1);
    const recItem = recipes.find(recipe => recipe.id === recipeId)
    recItem.ingredients.forEach(ingred => {

        let iUUID = ingred.id
        if (iUUID === undefined) {
          ingred.id = uuidv4();
          saveRecipes(recipes)
          let iUUID = ingred.id
        }
        let iName = ingred.name;
        let iDescription = ingred.description
        let iAmount = ingred.amount
        let iMeasureWord = ingred.measureWord
        let iUnit = ingred.unit;
        iMeasureWord !== "" ? iUnit = iMeasureWord : iUnit = ingred.unit
        const subtitle = document.querySelector('.header__subtitle');

        //  subtitle.textContent = recItem.namerecipeDescription

        const recipeIngredients = document.createElement('li');
        recipeIngredients.innerHTML = `<label ><a class="edit-ingredient" href="edit.html#${recipeId}" data-id="${iUUID}"><span data-id="${iUUID}">${iAmount} ${iUnit} ${iName} </span><i class="fa fa-pencil" aria-hidden="true"  data-id="${iUUID}" ></i><span class="hide-text">Edit</span></a></label>
                     <button class="remove-ingredient" data-name="${iName}" data-id="${iUUID}"><i class='fa fa-times'></i></i></button>`

        recipeContainer.appendChild(recipeIngredients)
        const editRecipeButtons = document.querySelectorAll('.edit-ingredient');
        const removeRecipeButton = document.getElementById('remove-recipe');
      

        editRecipeButtons.forEach(button => {
          button.addEventListener('click', function (e) {
              e.preventDefault();
              let dialogs = document.querySelector('#ingredient-modal');

              button.classList.add('return-focus')

              let ingredientId = e.target.getAttribute('data-id')
              let item = recItem.ingredients.find((ingredient) => ingredient.id === ingredientId)
              // alert('boogie')
              editIngredient(item)
            })
        })
        const remove = document.querySelectorAll('button.remove-ingredient');
        document.querySelector(".recipe-list").addEventListener("click", (e) => {
        // Check if the clicked element is a remove link
        const button = e.target.closest("button.remove-ingredient");
        if (button) {
            e.preventDefault(); // stop link navigation
            e.stopPropagation();  // stop bubbling to other handlers

            const id = button.dataset.id;
            const textName = button.dataset.name;

            if (confirm(`You Sure you want to remove ${textName}?`)) {
            removeIngredient(id);              // update storage / DB
            button.closest("li").remove();   // remove from DOM
            }
            // If Cancel, do nothing — no reload, no extra confirm
        }
        });
      })
  }

const addAnIngredientBtn = document.getElementById("add-an-ingredient");
if (addAnIngredientBtn) {
  addAnIngredientBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    // Reload recipes
    let recipes = await loadRecipes();
    let recItem = recipes.find(r => r.id === recipeId);

    // Create new ingredient
    const newIngredient = {
      id: uuidv4(),
      name: "",
      description: "",
      amount: "",
      unit: "",
      measureWord: "",
      alternatives: []
    };

    recItem.ingredients.push(newIngredient);
    saveRecipes(recipes);

    // Re-render list
    await listIngredients();

    // Open modal for the new ingredient
    editIngredient(newIngredient);
  });
}


 const editIngredient = async(i) => {

    let dialogs = document.querySelectorAll('#ingredient-modal');
    if (dialogs.length > 1) {
      dialogs.forEach(di => {})
    }

    const modal = document.getElementById("ingredient-modal")
    // modal.showModal();
    // modal.close("Cancelled")

    const modalInner = document.getElementById("ingredient");
    let name = document.querySelector('#ingredient #name');
    let description = document.querySelector('#ingredient #description');
    let amount = document.querySelector('#ingredient #amount');
    let unit = document.querySelector('#ingredient #unit');
    let measureWord = document.querySelector('#ingredient #measureWord');

    name.value = i.name || "";
    name.setAttribute('data-id', i.id || "");
    description.value = i.description || "";
    description.setAttribute('data-id', i.id || "");
    amount.value = i.amount || "";
    amount.setAttribute('data-id', i.id);
    unit.value = i.unit || "";
    unit.setAttribute('data-id', i.id);
    measureWord.setAttribute('data-id', i.id);
    measureWord.value = i.measureWord || '';

    // modal.innerHTML = modalInner; Show modal
    modal.showModal();

    

    const inputs = modal.querySelectorAll('input');
    inputs.forEach(input => {
      const dataid = input.getAttribute('data-id');
      const id = input.getAttribute('id')
      input.addEventListener('input', (e) => {

        const val = e.target.value
        if (id === 'name') {
          updateIngredient(recipeId, dataid, id, {name: val})
        } else if (id === 'description') {
          updateIngredient(recipeId, dataid, id, {description: val})
        } else if (id === 'amount') {
          updateIngredient(recipeId, dataid, id, {amount: val})
        } else if (id === 'unit') {
          updateIngredient(recipeId, dataid, id, {unit: val})
        } else if (id === 'measureWord') {
          updateIngredient(recipeId, dataid, id, {measureWord: val})
        }

      })
    })

}

  // 🔑 Single delegated listener for all ingredient actions
 recipeContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('button.remove-ingredient');
    const editLink = e.target.closest('a.edit-ingredient');
    const closeIngredientModalButton = document.getElementById("close-ingredient-modal");

    if (removeBtn) {
      e.preventDefault();
      const id = removeBtn.dataset.id;
      const textName = removeBtn.dataset.name;

      if (confirm(`You sure you want to remove ${textName}:${id}?`)) {
        removeIngredient(id);
        removeBtn.closest('li').remove();
      }
    }

    if (editLink) {
      e.preventDefault();
      editLink.classList.add('return-focus');
      const ingredientId = editLink.dataset.id;
      const item = recipeId.ingredients.find(ing => ing.id === ingredientId);
      editIngredient(item);
    }

    if (closeIngredientModalButton) {

          e.preventDefault();
          
          const modal = document.getElementById("ingredient-modal");
          modal.close("Cancelled");
          listIngredients();
           let focusedElement = document.activeElement;
           console.log(focusedElement)
            focusedElement.blur();
            console.log(focusedElement)
             focusedElement.blur();
            
        };

  });

// Remove ingredient
async function removeIngredient(id) {
  const recipes = await loadRecipes();
  console.log('Lin 792: recipes:', recipes)
  const rec = recipes.find(r => r.id === recipeId);
  rec.ingredients = rec.ingredients.filter(ing => ing.id !== id);
  saveRecipes(recipes);
  await listIngredients(recipeId);
}

const updateOne = document.getElementById('update-one');
updateOne.addEventListener('click', function (e) {
  e.preventDefault()
  updateRecipeInDatabase()
})
