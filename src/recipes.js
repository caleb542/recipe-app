import moment, { unix } from 'moment'
import {
    v4 as uuidv4
} from 'uuid';
import { getFilters } from './filters.js'
import { loadRecipes, saveRecipes, sortRecipes, getFeaturedImage } from './functions.js';
import { getRecipesFromDatabase } from './backend/getRecipesFromDatabase.js'

let listRecipes = async () => {
  let recipes = await getRecipesFromDatabase()
    saveRecipes(recipes)
    recipes = await loadRecipes();

    console.log('Loaded recipes:', recipes, Array.isArray(recipes));
  
    const filters = getFilters()
    recipes = sortRecipes(filters.sortBy, recipes)
    console.log('recipe.js', recipes)

    // FILTER WITH SEARCH TEXT
    recipes = recipes.filter(function (recipe) {
      const search = filters.searchText.toLowerCase();
      const matchName = recipe.name?.toLowerCase().includes(search);
      const matchAuthor = recipe.author?.name?.toLowerCase().includes(search);

      // Handle both old categories and new category/tags
      const matchCategories = Array.isArray(recipe.categories)
        ? recipe.categories.join(" ").toLowerCase().includes(search)
        : (recipe.categories || "").toLowerCase().includes(search);

      return matchName || matchAuthor || matchCategories;
    });

    // Clear everything out
    const cardIndex = document.querySelector("#recipes");
    cardIndex.innerHTML = '';
  
    if (recipes.length > 0) {
      let n = 0;
      recipes.forEach(recipe => {
        let resaveCreatedDate = recipe.createdAt;
   
        if (typeof resaveCreatedDate === 'string') {
          let unixTimestamp = moment(resaveCreatedDate, 'MMM Do, YYYY HH:mm').unix();
          recipe.createdAt = [resaveCreatedDate, unixTimestamp];
          saveRecipes(recipes);
        }
        
        let name = recipe.name;
        let description = recipe.description;
 
        // Create DOM cards
          // ✅ Update link to use new URL format

          console.log('Recipe:', recipe.name, 'fullSlug:', recipe.fullSlug);
        const recipeLink = recipe.fullSlug 
          ? `/article.html#${recipe.id}`
          : `/@${recipe.fullSlug}`;  // Fallback
    
// const recipeLink = recipe.fullSlug && recipe.fullSlug.includes('/')
//   ? `/article.html?user=${recipe.fullSlug.split('/')[0]}&slug=${recipe.fullSlug.split('/')[1]}`
//   : `/article.html#${recipe.id}`;  // Fallback for old recipes


        
        console.log('Final link:', recipeLink); // ✅ Add this
        let cardAnchor = document.createElement('a');
        cardAnchor.setAttribute('href', recipeLink);
        
        let article = document.createElement('article');
        let figure = document.createElement('figure');
        let image = document.createElement('img');
        image.classList.add('imageElement');
     
        let creator = document.createElement('p');
        creator.classList.add('creator');
        
        let text = document.createElement('div');
        text.classList.add('text-area');
        
        let recipeName = document.createElement('h1');
        recipeName.textContent = name;
        
        let recipeDescription = document.createElement('p');
        recipeDescription.innerHTML = description;
        
        text.appendChild(recipeName);
        text.appendChild(recipeDescription);
        
        cardAnchor.classList.add('card');
        cardAnchor.classList.add('home');
        cardAnchor.appendChild(article);
        article.appendChild(figure);
        figure.appendChild(image);         
        article.appendChild(text);
        
        cardIndex.classList.add('cards');
        cardIndex.appendChild(cardAnchor);

        // ✅ NEW: Get featured image from images array (backward compatible)
        const featuredImage = getFeaturedImage(recipe);
        const photoURL = featuredImage?.url || '/images/pexels-mali-maeder-1.jpg'; // Fallback image
        
        image.setAttribute('src', `${photoURL}`);
        image.setAttribute('alt', `Photo of ${recipe.name}`);
        image.setAttribute('description', `Decorative image relating to ${recipe.name}`);

        
      });
    } else {
      const cardIndex = document.querySelector("#recipes");
      const warning = document.createElement('div');
      warning.classList.add('card');
      warning.innerHTML = "<p>Sorry, no recipes were found. Try searching another keyword or <a href='/edit.html'>create a recipe</a>?</p>";
      cardIndex.appendChild(warning);
    }  
}

export { sortRecipes, listRecipes }