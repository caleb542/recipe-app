// helpers/tagsUI.js
import { updateLocalStorage } from '../functions.js';

function setupTagsUI(recipeId, recipe) {
  const input = document.getElementById('tag-input');
  const container = document.getElementById('tags-container');

  renderTags(recipe.tags || []);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
      e.preventDefault();
      const newTag = input.value.trim();
      const updatedTags = [...(recipe.tags || []), newTag];
      recipe.tags = updatedTags;
      updateLocalStorage(recipeId, { tags: updatedTags });
      renderTags(updatedTags);
      input.value = '';
    }
  });

    function renderTags(tags) {
    container.innerHTML = '';
    tags.forEach(tag => {
      const pill = document.createElement('span');
      pill.classList.add('tag-pill');
      pill.textContent = tag;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.classList.add('remove-tag');
      removeBtn.addEventListener('click', () => {
        const updatedTags = tags.filter(t => t !== tag);
        recipe.tags = updatedTags;
        updateLocalStorage(recipeId, { tags: updatedTags });
        renderTags(updatedTags);
      });

      pill.appendChild(removeBtn);
      container.appendChild(pill);
    });
  }
}

export {
    setupTagsUI
}