import { v4 as uuidv4 } from 'uuid';
import { loadRecipes, loadRecipesFromLocalStorage, saveRecipes } from '../functions.js';
import { openDirectionsDialogue, editDirection, removeDirection } from '../functions.js';
import { syncRecipeUpdate } from './syncRecipe.js'

/**
 * Render all directions for a given recipe
 */
function listDirections(directions) {
  const directionsList = document.getElementById('directions-list');
  directionsList.innerHTML = '';

  // Build an array of <li> elements
  const items = directions.map(step => {
    const li = document.createElement('li');
    li.classList.add('direction-step');
    li.dataset.id = step.id;
    li.innerHTML = `
    <label for="${step.id}"></ <span>${step.text}</span></label> 

      <button id="${step.id}" data-id="${step.id}" class="item-buttons edit-direction">
        <i class="fa fa-pencil" aria-hidden="true"></i> Edit
      </button> 

      <button class="item-buttons remove-direction" data-name="${step.id}" data-id="${step.id}">
        <i class="fa fa-trash-can"></i> Delete
      </button>
    `;
    return li;
  });

  // Append all items at once
  directionsList.append(...items);
}

/**
 * Setup listeners for adding, editing, and removing directions
 */
function setupDirections(recipeId) {
  const addStepButton = document.getElementById('add-step');
  const directionsList = document.getElementById('directions-list');

  // Add new direction
  addStepButton.addEventListener('click', async e => {
    e.preventDefault();

    let recipes = await loadRecipesFromLocalStorage();
    let recItem = recipes.find(r => r.id === recipeId);

    const newDirection = { id: uuidv4(), text: "" };
    await syncRecipeUpdate(recipeId, recipe => {
    recipe.directions.push(newDirection);
    });

    openDirectionsDialogue(newDirection.id, newDirection.text);
    listDirections(recItem.directions);
  });

  // Delegated listener for edit/remove
directionsList.addEventListener('click', async e => {
  const editLink = e.target.closest('button.edit-direction');
  const removeBtn = e.target.closest('button.remove-direction');

  if (editLink) {
    e.preventDefault();
    const id = editLink.dataset.id;
    editDirection(id);
  }

  if (removeBtn) {
    e.preventDefault();
    const id = removeBtn.dataset.id;
    const text = removeBtn.closest('.direction-step')?.querySelector('span')?.textContent || '';

    // Confirm before deleting
    const confirmText = `Erase "${text}"?`;
    if (!confirm(confirmText)) return;

    // 🔄 Persist deletion via syncRecipeUpdate
    await syncRecipeUpdate(recipeId, recipe => {
      recipe.directions = recipe.directions.filter(d => d.id !== id);
    });

    // ✅ Reload directions from updated localStorage
    const recipes = await loadRecipesFromLocalStorage();
    const recItem = recipes.find(r => r.id === recipeId);
    if (recItem) {
      listDirections(recItem.directions);
    }
  }
});

}



export {
    listDirections,
    setupDirections
}