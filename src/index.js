import "./style.scss";
import {
  stringify,
  v4 as uuidv4
} from 'uuid';
import {
  createApi
} from './unsplash.js'
import {
  getFilters,
  setFilters
} from './filters.js';
import {
  sortRecipes,
  listRecipes
} from './recipes.js'
import {
  unsplashme
} from "./unsplash.js";
import {
  loadRecipes,
  getTimestamp,
  saveRecipes,
  toggleMenu,
  hamburger,
  convertTimestamp,
  loadRecipesFromLocalStorage
} from './functions.js'
import { getRecipesFromDatabase } from "./backend/getRecipesFromDatabase.js";


const staticOverlay = document.getElementById("static-landing-page");
const pageContainer = document.querySelector('.page-container');

if(localStorage.getItem("firstTime") === null || localStorage.getItem("firstTime") === "true") {
  localStorage.setItem("firstTime","true");
  pageContainer.style.opacity='0.4'
  pageContainer.style.top="10%"
  staticOverlay.style.opacity="1"
  staticOverlay.style.zIndex="10"
  staticOverlay.classList.add('show');
}


const stlCta = document.querySelector('.stl-cta')
stlCta.addEventListener("click", function(e){
  
  staticOverlay.style.opacity="0.5"
  staticOverlay.style.position="fixed"
  staticOverlay.style.top="-120%"
  staticOverlay.style.transition=" 0.8s ease-out"
  pageContainer.style.opacity="1"
  pageContainer.style.top="0"
  pageContainer.style.display="block"
  pageContainer.style.transition="all 0.8s ease-out"

  localStorage.setItem("firstTime","false");
    staticOverlay.classList.remove('show');
})


let recipes =  await loadRecipesFromLocalStorage()
await listRecipes(recipes);

// Event Listeners
document.querySelector('#search-filter').addEventListener('input', (e) => {
  console.log(e.target.value)
  setFilters({
    searchText: e.target.value
  })
  listRecipes(recipes)
})


document.querySelector('#filter-by').addEventListener('change', (e) => {
  console.log(e.target.value)
  setFilters({
    sortBy: e.target.value
  })
  listRecipes()
})


const getCategories = async () => {
  let categories = [];

  if (Array.isArray(recipes)) {
    recipes.forEach((recipe) => {
      // Controlled category
      const category = recipe.category || "Uncategorized";
      categories.push(category);

      // Optional: include tags if you want them in the cloud
      if (Array.isArray(recipe.tags)) {
        recipe.tags.forEach(tag => categories.push(tag));
      }
    });
  } else {
    console.warn("Recipes not available yet:", recipes);
  }

  categories = [...new Set(categories)];
  categories.unshift("All");

  const categoriesCloud = document.querySelector("#categories-cloud section");
  categoriesCloud.setAttribute("tabindex", "0");
  categoriesCloud.setAttribute("role", "radiogroup");

  categories.forEach((cat, index) => {
    const label = document.createElement("label");
    label.setAttribute("role", "radio");
    label.setAttribute("for", `cat-${index}`);
    label.textContent = cat;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "category";
    radio.id = `cat-${index}`;
    radio.value = cat;
    radio.classList.add("sort", "radio");

    label.appendChild(radio);
    categoriesCloud.appendChild(label);
  });
};


// Event Listeners
document.addEventListener("change", (e) => {
  if (e.target.matches('#categories-cloud input[type="radio"]')) {
    const selected = e.target.value;
    setFilters({
      searchText: selected === "All" ? "" : selected
    });
    listRecipes(recipes);
  }
});


await getCategories()
hamburger()
      
window.addEventListener('storage', (e) => {
  if (e.key === 'recipes') {
    listRecipes(recipes)
  }
})