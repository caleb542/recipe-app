import "./style.scss";
import { loadRecipesFromLocalStorage, hamburger } from "./functions.js";
import { marked } from "marked";
import { setupShoppingList } from "./helpers/shoppingList.js";

const recipeId = location.hash.substring(1);
let recipes;

// Entry point
async function fetchRecipes() {
  recipes = await loadRecipesFromLocalStorage();
  await hydrateArticle(recipes);
}
fetchRecipes();

async function hydrateArticle(recipes) {
  const recItem = Array.isArray(recipes)
    ? recipes.find(recipe => recipe.id === recipeId)
    : null;

  if (!recItem) {
    location.assign("/index.html");
    return;
  }

  // Load and insert template first
  const res = await fetch("./partials/article-template.html");
  const html = await res.text();
  const container = document.querySelector(".template-container");
  container.insertAdjacentHTML("beforeend", html);

  const template = document.getElementById("article-template");
  const tpl = template.content.cloneNode(true);

  // Hydrate fields safely
  const articleTitle = tpl.querySelector(".article__title");
  if (articleTitle) {
    articleTitle.textContent = recItem.name;
    document.title = `Recipe Me - ${recItem.name}`;
  }

  const d = tpl.querySelector(".dates");
  if (d) d.innerHTML = `<date>${recItem.createdAt[0]}</date>`;

  const a = tpl.querySelector(".author");
  if (a) a.innerHTML = `by ${recItem.author}`;

  const pt = tpl.querySelector(".preptime");
  if (pt) pt.innerHTML = `<p>${recItem.prepTime || ""}</p>`;

  const dsum = tpl.querySelector(".description.summary");
  if (dsum) dsum.innerHTML = recItem.description;

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
        star.addEventListener("click", () => {
          recItem.rating = i;
          updateLocalStorageRating(recipeId, i);
          renderStars(i);
        });
        ratingStars.appendChild(star);
      }
    }
    renderStars(recItem.rating || 0);
  }

  // Persist rating
  function updateLocalStorageRating(recipeId, rating) {
    const recipes = JSON.parse(localStorage.getItem("recipes")) || [];
    const index = recipes.findIndex(r => r.id === recipeId);
    if (index > -1) {
      recipes[index].rating = rating;
      localStorage.setItem("recipes", JSON.stringify(recipes));
    }
  }

  // Image + photo info
  const imageElement = tpl.querySelector(".imageElement");
  if (imageElement) imageElement.style.backgroundImage = `url(${recItem.photoURL})`;

  const photoInfo = tpl.querySelector(".photoInfo");
  if (photoInfo) {
    photoInfo.innerHTML = `Photo from Unsplash by <a href="${recItem.photographerLink}">${recItem.photographer}</a>`;
  }

  // Summary content
  const summaryContent = tpl.querySelector(".summary-content");
  if (summaryContent) summaryContent.innerHTML = marked.parse(recItem.article || "");

  // Directions
  const directionsList = tpl.querySelector(".directions-list");
  if (directionsList) {
    directionsList.innerHTML = "";
    recItem.directions.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step.text;
      directionsList.appendChild(li);
    });
  }

  // Ingredients checklist
  const checklist = tpl.querySelector(".checklist");
  if (checklist) {
    checklist.innerHTML = "";
    if (recItem.ingredients.length < 1) {
      const warning = document.createElement("div");
      warning.classList.add("warning");
      warning.innerHTML = `Do you want to <a href="edit.html#${recipeId}">start adding some ingredients</a>?`;
      tpl.querySelector(".checklist-container")?.appendChild(warning);
    } else {
      recItem.ingredients.forEach(ingr => {
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

  // Edit button
  const editButton = tpl.getElementById?.("cta-update") || tpl.querySelector("#cta-update");
  if (editButton) {
    editButton.href = `./edit.html#${recipeId}`;
    editButton.title = "Edit recipe";
  }

  // Append hydrated fragment
  container.appendChild(tpl);

  // Wire shopping list helper
  setupShoppingList(recItem, recipeId, "caleb542@gmail.com");

  // Like button
// const likeButton = container.querySelector("#like-button");

// function applyLikeState(btn, data) {
//   btn.setAttribute("aria-pressed", data.liked ? "true" : "false");
//   btn.classList.toggle("liked", !!data.liked);
// }

// if (likeButton) {
//   likeButton.addEventListener("click", async () => {
//     // Check current state from aria-pressed
//     const isLiked = likeButton.getAttribute("aria-pressed") === "true";
//     const method = isLiked ? "DELETE" : "POST";

   
//     // Send toggle request
//     await fetch(`/.netlify/functions/like?id=${recipeId}&user=demoUser`, { method });

    
//     // Refresh like count and button state
//     const res = await fetch(`/.netlify/functions/like?id=${recipeId}`);
//     const data = await res.json();

    

//     const countEl = container.querySelector("#like-count");
//     if (countEl) countEl.textContent = data.likes ?? 0;

//     applyLikeState(likeButton, data);

//     // Update button state and styling
//     likeButton.setAttribute("aria-pressed", data.liked ? "true" : "false");
//     likeButton.classList.toggle("liked", !!data.liked);
//   });
// }


// async function refreshLikes(recipeId) {
//   const res = await fetch(`/.netlify/functions/like?id=${recipeId}&user=${user}`);
//   const data = await res.json();
//   const likeCount = document.getElementById("like-count");
//   if (likeCount) likeCount.textContent = data.likes ?? 0;
//   const btn = document.getElementById("like-button");
//   if (btn) {
//     btn.setAttribute("aria-pressed", data.liked ? "true" : "false");
//     btn.classList.toggle("liked", !!data.liked);
//   }
// }
  

  // Refresh likes after template is in DOM
  // await refreshLikes(recipeId);


  const likeButton = container.querySelector("#like-button");
// const user = "demoUser";
const user = "demoUser";

function applyLikeState(btn, data) {
  btn.setAttribute("aria-pressed", data.liked ? "true" : "false");
  btn.classList.toggle("liked", !!data.liked);
}

async function refreshLikes(recipeId) {
  const res = await fetch(`/.netlify/functions/like?id=${recipeId}&user=${user}`);
  const data = await res.json();

  const countEl = document.getElementById("like-count");
  if (countEl) countEl.textContent = data.likes ?? 0;

  const btn = document.getElementById("like-button");
  if (btn) applyLikeState(btn, data);
}

if (likeButton) {
  likeButton.addEventListener("click", async () => {
    const isLiked = likeButton.getAttribute("aria-pressed") === "true";
    const method = isLiked ? "DELETE" : "POST";

    try {
      await fetch(`/.netlify/functions/like?id=${recipeId}&user=${user}`, { method });
      await refreshLikes(recipeId); // ✅ reuse helper
    } catch (err) {
      console.error("Like toggle failed:", err);
    }
  });
}

// Hydrate on load
await refreshLikes(recipeId);

}

// Hamburger + storage listener
  hamburger();
  window.addEventListener("storage", e => {
    if (e.key === "recipes") {
      fetchRecipes();
    }
  });
// Exported initArticle for external use
// export function initArticle(container, recItem) {
 
//   const titleEl = container.querySelector(".article__title");
//   if (titleEl) titleEl.textContent = recItem.name;
//   const likeBtn = container.querySelector("#like-button");
//   if (likeBtn) {
//     likeBtn.addEventListener("click", () => {
//       refreshLikes()
//     });
//   }
// }

export { fetchRecipes };
