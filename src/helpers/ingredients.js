import { v4 as uuidv4 } from 'uuid';
import { loadRecipes, loadRecipesFromLocalStorage, saveRecipes } from '../functions.js';
import { updateIngredient } from '../update.js';
import { syncRecipeUpdate } from './syncRecipe.js'

/**
 * Render all ingredients for a given recipe
 */
async function listIngredients(recipeId) {
  const recipeContainer = document.querySelector('#recipe ul.recipe');
  recipeContainer.innerHTML = '';

  const recipes = await loadRecipesFromLocalStorage();
  const recItem = recipes.find(r => r.id === recipeId);

  recItem.ingredients.forEach(ingred => {
    if (!ingred.id) {
      ingred.id = uuidv4();
      saveRecipes(recipes);
    }
    recipeContainer.appendChild(renderIngredientItem(ingred, recipeId));
  });
}

/**
 * Render a single ingredient <li>
 */
function renderIngredientItem(ingred, recipeId) {

  const li = document.createElement('li');
  li.innerHTML = `
    <label class="ingredient-label" for="${ingred.id}">
        ${ingred.amount} ${ingred.unit || ingred.measureWord} ${ingred.name}
    </label>   
    <button id="${ingred.id}" data-id="${ingred.id}" class="item-buttons edit-ingredient"><i class="fa fa-pencil" aria-hidden="true"></i> Edit</button> 
   
    <button class="item-buttons remove-ingredient" data-name="${ingred.name}" data-id="${ingred.id}">
      <i class="fa fa-trash-can"></i> Delete
    </button>
  `;
  return li;
}

/**
 * Delegated listener for ingredient actions
 */
function setupIngredientDelegation(recipeId) {
  const recipeContainer = document.querySelector('#recipe ul.recipe');

  recipeContainer.addEventListener('click', async e => {
    const removeBtn = e.target.closest('button.remove-ingredient');
    const editLink = e.target.closest('button.edit-ingredient');
    const closeBtn = e.target.closest('#close-ingredient-modal');

    const recipes = await loadRecipes();
    const recItem = recipes.find(r => r.id === recipeId);

    if (removeBtn) {
      const id = removeBtn.dataset.id;
      const textName = removeBtn.dataset.name;
      if (confirm(`Remove ${textName}?`)) {
        await removeIngredient(recipeId, id);
      }
    }

    if (editLink) {
      const id = editLink.dataset.id;
      const item = recItem.ingredients.find(i => i.id === id);
      console.log('recItem', recItem)
      console.log('item', item)
      editIngredient(item, recipeId);
    }

    if (closeBtn) {
      document.getElementById('ingredient-modal').close();
      await listIngredients(recipeId);
      if (lastFocused) lastFocused.focus();
    }
  });
}

/**
 * Add a new ingredient and open modal
 */
async function addIngredient(recipeId) {
  const recipes = await loadRecipes();
  const recItem = recipes.find(r => r.id === recipeId);

  const newIngredient = {
    id: uuidv4(),
    name: "",
    description: "",
    amount: "",
    unit: "",
    measureWord: "",
    alternatives: []
  };


await syncRecipeUpdate(recipeId, recipe => {
  recipe.ingredients.push(newIngredient);
});
await listIngredients(recipeId);
editIngredient(newIngredient, recipeId);


}

/**
 * Edit ingredient in modal
 */

async function editIngredient(ingredient, recipeId) {
  const modal = document.getElementById("ingredient-modal");
  modal.showModal();
console.log("ingredient",ingredient)
  // Grab modal inputs
  const fields = ['name', 'description', 'amount', 'unit', 'measureWord'];
  const inputs = fields.map(id => document.querySelector(`#ingredient #${id}`));

  // Populate values
  inputs.forEach(input => {
    if (!input) return;
    input.value = ingredient[input.id] || "";
    input.setAttribute('data-id', ingredient.id);
  });

  // Attach listeners scoped to this ingredient
  inputs.forEach(input => {
    if (!input) return;

    const handler = async e => {
      const val = e.target.value;
      const recipes = await loadRecipes();
      const recipe = recipes.find(r => r.id === recipeId);

      if (!recipe) return;

await syncRecipeUpdate(recipeId, recipe => {
  recipe.ingredients = recipe.ingredients.map(ing =>
    ing.id === ingredient.id ? { ...ing, [input.id]: val } : ing
  );
});
    };

    input.addEventListener('input', handler);

    // Clean up when modal closes
    modal.addEventListener('close', () => {
      input.removeEventListener('input', handler);
    }, { once: true });
  });

  // Re-render ingredient list when modal closes
  modal.addEventListener('close', async () => {
    await listIngredients(recipeId);
  }, { once: true });
}
// function editIngredient(ingredient, recipeId) {
//   const modal = document.getElementById("ingredient-modal");
//   modal.showModal();

//   const name = document.querySelector('#ingredient #name');
//   const description = document.querySelector('#ingredient #description');
//   const amount = document.querySelector('#ingredient #amount');
//   const unit = document.querySelector('#ingredient #unit');
//   const measureWord = document.querySelector('#ingredient #measureWord');

//   name.value = ingredient.name || "";
//   description.value = ingredient.description || "";
//   amount.value = ingredient.amount || "";
//   unit.value = ingredient.unit || "";
//   measureWord.value = ingredient.measureWord || "";

//   [name, description, amount, unit, measureWord].forEach(input => {
//     input.setAttribute('data-id', ingredient.id);
//     input.addEventListener('input', e => {
//       const val = e.target.value;
//       updateIngredient(recipeId, ingredient.id, input.id, { [input.id]: val });
//     });
//   });

//   modal.addEventListener('close', async () => {
//     await listIngredients(recipeId); // re-render from localStorage
//   }, { once: true }); // only attach once per open
// }

/**
 * Remove ingredient by ID
 */
async function removeIngredient(recipeId, id) {
  const recipes = await loadRecipes();
  const rec = recipes.find(r => r.id === recipeId);
await syncRecipeUpdate(recipeId, recipe => {
  recipe.ingredients = recipe.ingredients.filter(ing => ing.id !== id);
});
await listIngredients(recipeId);
}



// Export them all together
export {
  listIngredients,
  setupIngredientDelegation,
  addIngredient,
  editIngredient,
  removeIngredient
};