import { updateLocalStorage, loadRecipes, saveRecipes } from '../functions.js';

/**
 * Populate the form fields with recipe data
 */
function populateFields(recipe) {
  document.getElementById('heading-name').textContent = recipe.name || '';
  document.getElementById('recipe-name').value = recipe.name || '';
  document.getElementById('recipe-description').value = recipe.description || '';
  
  // ✅ Author - use displayAuthor or fallback to author.name
  const authorInput = document.getElementById('recipe-author');
  if (authorInput) {
    authorInput.value = recipe.displayAuthor || recipe.author?.name || '';
  }
  
  document.getElementById('recipe-prep-time').value = recipe.prepTime || '';
  document.getElementById('recipe-total-time').value = recipe.totalTime || '';

  // Categories (checkboxes) — exclude cuisine hidden checkboxes, handled by tag-input
const categoryInputs = document.querySelectorAll('input[name="category"]:not(.cuisine-hidden-checkbox)');
categoryInputs.forEach(input => {
  input.checked = Array.isArray(recipe.categories) && recipe.categories.includes(input.value);
});

  // Tags (comma‑delimited textarea)
  const tagsInput = document.getElementById('recipe-tags');
  if (tagsInput) {
    tagsInput.value = Array.isArray(recipe.tags) ? recipe.tags.join(', ') : '';
  }

  // Toast UI editor content
  if (window.toastEditor) {
    window.toastEditor.setHTML(recipe.content || '');
  }
}

/**
 * Wire up listeners so changes to fields update localStorage
 */
function wireFieldListeners(recipeId) {
  // ✅ Validate recipeId
  if (!recipeId) {
    console.error('❌ wireFieldListeners called without recipeId');
    return;
  }

  console.log('🔌 Wiring field listeners for recipe:', recipeId);

  const nameInput = document.getElementById('recipe-name');
  const descriptionInput = document.getElementById('recipe-description');
  const authorInput = document.getElementById('recipe-author');
  const prepTimeInput = document.getElementById('recipe-prep-time');
  const totalTimeInput = document.getElementById('recipe-total-time');
  const tagsInput = document.getElementById('recipe-tags');
  const categoryInputs = document.querySelectorAll('input[name="category"]');

  // Name - updates as you type
if (nameInput) {
  nameInput.addEventListener('input', e => {
    updateLocalStorage(recipeId, { name: e.target.value });
  });
}

// ✅ NEW: Slug input - updates as you type
const slugInput = document.getElementById('recipe-slug');
if (slugInput) {
  slugInput.addEventListener('input', e => {
    updateLocalStorage(recipeId, { 
      slug: e.target.value,
      fullSlug: e.target.value 
    });
  });
}


  // Description - updates as you type
  if (descriptionInput) {
    descriptionInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { description: e.target.value });
    });
  }

  // ✅ Author (Display Name) - updates as you type
  if (authorInput) {
    authorInput.addEventListener('input', e => {
      console.log('📝 Updating displayAuthor:', e.target.value);
      updateLocalStorage(recipeId, { displayAuthor: e.target.value });
    });
  }

  // Prep Time - updates as you type
  if (prepTimeInput) {
    prepTimeInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { prepTime: e.target.value });
    });
  }
  
  // Total Time - updates as you type
  if (totalTimeInput) {
    totalTimeInput.addEventListener('input', e => {
      updateLocalStorage(recipeId, { totalTime: e.target.value });
    });
  }

  // Tags textarea → split on commas
  if (tagsInput) {
    tagsInput.addEventListener('input', e => {
      const tagsArray = e.target.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      updateLocalStorage(recipeId, { tags: tagsArray });
    });
  }

 // Categories — use delegation so dynamically added checkboxes are caught
  document.getElementById('categories-container')?.addEventListener('change', e => {
    if (e.target.matches('input[name="category"]')) {
      const selectedCategories = Array.from(
        document.querySelectorAll('input[name="category"]:checked')
      ).map(cb => cb.value);
      updateLocalStorage(recipeId, { categories: selectedCategories });
    }
  });
}

/**
 * Update a recipe in localStorage by merging new field values
 */
async function updateRecipe(recipeId, updates) {
  let recipes = await loadRecipes();
  let recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) return;

  Object.assign(recipe, updates);
  saveRecipes(recipes);

  localStorage.setItem('editingRecipe', JSON.stringify(recipe));
}


async function loadCategories(selectedCategories = []) {
  try {
    const res = await fetch('/.netlify/functions/get-categories');
    const { grouped } = await res.json();

    const container = document.getElementById('categories-container');
    if (!container) return;

    container.innerHTML = Object.entries(grouped).map(([group, cats]) => {
      
      // Cuisine gets a searchable tag-input
      if (group === 'Cuisine') {
        const selectedCuisines = cats.filter(cat =>
          selectedCategories.includes(cat.name) ||
          selectedCategories.includes(cat.slug)
        );

         return `
    <div class="category-group">
          <h4>Cuisine</h4>
          <p class="category-hint">
            Select the cultural or regional tradition this recipe belongs to. 
            <span class="category-hint-examples">e.g. Italian · Japanese · Lebanese · Cajun · Jewish · Caribbean</span>
          </p>
          <div class="cuisine-tag-input" id="cuisine-tag-input">
              <div class="cuisine-tags" id="cuisine-tags">
                ${selectedCuisines.map(cat => `
                  <span class="cuisine-tag" data-value="${cat.name}">
                    ${cat.name}
                    <button type="button" class="cuisine-tag-remove" data-value="${cat.name}" aria-label="Remove ${cat.name}">×</button>
                  </span>
                `).join('')}
              </div>
              <input
                type="text"
                id="cuisine-search"
                placeholder="Search cuisines..."
                autocomplete="off"
              />
              <ul class="cuisine-dropdown" id="cuisine-dropdown" hidden></ul>
            </div>
            ${cats.map(cat => `
              <input type="checkbox" name="category" value="${cat.name}"
                class="cuisine-hidden-checkbox"
                style="display:none"
                ${selectedCuisines.some(s => s.name === cat.name) ? 'checked' : ''}
              >
            `).join('')}
          </div>
        `;
      }

      // All other groups — checkboxes
      return `
        <div class="category-group">
          <h4>${group}</h4>
          <div class="checkbox-grid">
            ${cats.map(cat => `
              <label>
                <input type="checkbox" name="category"
                  value="${cat.name}"
                  ${selectedCategories.includes(cat.name) ||
                    selectedCategories.includes(cat.slug) ? 'checked' : ''}
                >
                <span>${cat.name}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Wire up the cuisine tag-input
    initCuisineTagInput(grouped['Cuisine'] || []);

  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

function initCuisineTagInput(cuisines) {
  const searchInput = document.getElementById('cuisine-search');
  const dropdown = document.getElementById('cuisine-dropdown');
  const tagsContainer = document.getElementById('cuisine-tags');

  if (!searchInput || !dropdown || !tagsContainer) return;

  function getSelectedValues() {
    return Array.from(document.querySelectorAll('.cuisine-hidden-checkbox:checked'))
      .map(cb => cb.value);
  }

  function renderDropdown(query) {
    const selected = getSelectedValues();
    const filtered = cuisines.filter(cat =>
      cat.name.toLowerCase().includes(query.toLowerCase()) &&
      !selected.includes(cat.name)
    );

    if (!filtered.length || !query) {
      dropdown.hidden = true;
      return;
    }

      dropdown.innerHTML = filtered.map(cat => `
      <li class="cuisine-option" data-value="${cat.name}">${cat.name}</li>
    `).join('');
    dropdown.hidden = false;
    // No focused state on fresh render — user arrows into it
  }

  function addTag(value) {
    // Check the hidden checkbox
    const checkbox = document.querySelector(`.cuisine-hidden-checkbox[value="${value}"]`);
    if (checkbox) checkbox.checked = true;

    // Add pill
    const tag = document.createElement('span');
    tag.className = 'cuisine-tag';
    tag.dataset.value = value;
    tag.innerHTML = `${value}<button type="button" class="cuisine-tag-remove" data-value="${value}" aria-label="Remove ${value}">×</button>`;
    tagsContainer.appendChild(tag);

    searchInput.value = '';
    dropdown.hidden = true;
  }

  function removeTag(value) {
    const checkbox = document.querySelector(`.cuisine-hidden-checkbox[value="${value}"]`);
    if (checkbox) checkbox.checked = false;

    const tag = tagsContainer.querySelector(`.cuisine-tag[data-value="${value}"]`);
    if (tag) tag.remove();
  }

  // Search input
  searchInput.addEventListener('input', e => {
    renderDropdown(e.target.value);
  });

  searchInput.addEventListener('focus', e => {
    if (e.target.value) renderDropdown(e.target.value);
  });

  // Select from dropdown
  dropdown.addEventListener('click', e => {
    const option = e.target.closest('.cuisine-option');
    if (option) addTag(option.dataset.value);
  });

  // Remove tag
  tagsContainer.addEventListener('click', e => {
    const removeBtn = e.target.closest('.cuisine-tag-remove');
    if (removeBtn) removeTag(removeBtn.dataset.value);
  });
  searchInput.addEventListener('keydown', e => {
  const options = [...dropdown.querySelectorAll('.cuisine-option')];
  const focused = dropdown.querySelector('.cuisine-option.focused');
  const currentIndex = options.indexOf(focused);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (dropdown.hidden) return;
    const next = options[currentIndex + 1] || options[0];
    focused?.classList.remove('focused');
    next?.classList.add('focused');
    next?.scrollIntoView({ block: 'nearest' });
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (dropdown.hidden) return;
    const prev = options[currentIndex - 1] || options[options.length - 1];
    focused?.classList.remove('focused');
    prev?.classList.add('focused');
    prev?.scrollIntoView({ block: 'nearest' });
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const target = focused || options[0];
    if (target) addTag(target.dataset.value);
    dropdown.querySelectorAll('.cuisine-option').forEach(o => o.classList.remove('focused'));
  }

  if (e.key === 'Escape') {
    dropdown.hidden = true;
    dropdown.querySelectorAll('.cuisine-option').forEach(o => o.classList.remove('focused'));
  }
});
  // Close dropdown on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#cuisine-tag-input')) {
      dropdown.hidden = true;
    }
  });

  // Keyboard — Enter to select first option
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = dropdown.querySelector('.cuisine-option');
      if (first) addTag(first.dataset.value);
    }
    if (e.key === 'Escape') {
      dropdown.hidden = true;
    }
  });
}

export {
  populateFields,
  updateRecipe,
  wireFieldListeners,
  loadCategories
}