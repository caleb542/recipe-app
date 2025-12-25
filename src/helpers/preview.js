import { marked } from "marked";
// src/helpers/preview.js
async function setupPreview(recipeId) {

   
  const previewBtn = document.getElementById('preview-recipe-btn');
  const dialog = document.getElementById('preview-dialog');
  
  previewBtn.addEventListener('click', async () => {

    // Get current recipe from localStorage (live editing state)
    const recipe = JSON.parse(localStorage.getItem('editingRecipe'));
    
    // Load article template
    const res = await fetch('/partials/article-template.html');
    const html = await res.text();
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const template = tempDiv.querySelector('#article-template');
    const tpl = template.content.cloneNode(true);
    
    // Hydrate with current recipe data
    tpl.querySelector('.article__title').textContent = recipe.name || 'Untitled';
    tpl.querySelector('.author').textContent = `by ${recipe.displayAuthor || 'Anonymous'}`;
    tpl.querySelector('.preptime').textContent = recipe.prepTime || '';
  // Image + photo info
  const imageElement = tpl.querySelector(".imageElement");
  if (imageElement) imageElement.style.backgroundImage = `url(${recipe.photoURL})`;

  const photoInfo = tpl.querySelector(".photoInfo");
  if (photoInfo) {
    photoInfo.innerHTML = `Photo from Unsplash by <a href="${recipe.photographerLink}">${recipe.photographer}</a>`;
  }

  const d = tpl.querySelector(".dates");
  if (d) d.innerHTML = `<date>${recipe.createdAt[0]}</date>`;

  // Directions
  const directionsList = tpl.querySelector(".directions-list");
  if (directionsList) {
    directionsList.innerHTML = "";
    recipe.directions.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step.text;
      directionsList.appendChild(li);
    });
  }
  // Rating stars
  const ratingStars = tpl.getElementById?.("rating-stars") || tpl.querySelector("#rating-stars");
  if (ratingStars) {
    const maxStars = 5;
    function renderStars(currentRating) {
      ratingStars.innerHTML = "";
      for (let i = 1; i <= maxStars; i++) {
        const star = document.createElement("span");
        star.classList.add("star");
        star.textContent = i <= currentRating ? "★" : "☆";
        star.setAttribute("role", "button");
        star.setAttribute("tabindex", "0");
        star.setAttribute("aria-label", `Rate ${i} out of ${maxStars}`);
        // star.addEventListener("click", () => {
        //   recipe.rating = i;
        //   // updateLocalStorageRating(recipeId, i);
        //   renderStars(i);
        // });
        ratingStars.appendChild(star);
      }
    }
    renderStars(recipe.rating || 0);
  }

    // Summary content
    const summaryContent = tpl.querySelector(".summary-content");
    if (summaryContent) summaryContent.innerHTML = marked.parse(recipe.article || "");


    // Ingredients checklist
  const checklist = tpl.querySelector(".checklist");
  if (checklist) {
    checklist.innerHTML = "";
    if (recipe.ingredients.length < 1) {
      const warning = document.createElement("div");
      warning.classList.add("warning");
      warning.innerHTML = `Do you want to <a href="edit.html#${recipeId}">start adding some ingredients</a>?`;
      tpl.querySelector(".checklist-container")?.appendChild(warning);
    } else {
      recipe.ingredients.forEach(ingr => {
        const li = document.createElement("li");
        const label = document.createElement("label");
        label.classList.add("article-checklist-items");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        const amt = document.createElement("span");
        amt.textContent = `${ingr.amount} ${ingr.unit || ingr.measureWord} ${ingr.name} ${ingr.description}`;
        label.append(checkbox, amt);
        li.appendChild(label);
        checklist.appendChild(li);
      });
    }
  }
    // Show in dialog
    const previewContent = document.getElementById('preview-content');
    previewContent.innerHTML = '';
    previewContent.appendChild(tpl);
    
    dialog.showModal();
  });
  
  document.getElementById('close-preview').addEventListener('click', () => {
    dialog.close();
  });
}

export { setupPreview }