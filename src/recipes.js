
import {
    v4 as uuidv4
} from 'uuid';
import { getFilters } from './filters.js'
import { loadRecipes, saveRecipes, sortRecipes, getFeaturedImage } from './functions.js';
// import { getRecipesFromDatabase } from './backend/getRecipesFromDatabase.js';
import { generateRecipeBadges } from './components/RecipeBadges.js';
import { isAuthenticated, getUser, isAuthor } from './auth/auth0.js';

let listRecipes = async (recipesParam, currentUserId = null) => {
 let recipes = await loadRecipes();

  // ✅ Get current user (with fallback for public pages)
  let authenticated = !!currentUserId;

  const filters = getFilters();
  recipes = sortRecipes(filters.sortBy, recipes);

  // ✅ STEP 1: Filter by visibility and completeness
  recipes = recipes.filter(recipe => {
    const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
    const hasDirections = recipe.directions && recipe.directions.length > 0;
    const isComplete = hasIngredients && hasDirections;
    
    // Show all complete recipes (regardless of isPublic)
    if (isComplete) return true;
    
    // For incomplete recipes:
    // Only show if unpublished (isPublic: false) AND you're the author
    if (!recipe.isPublic) {
      const isAuthor = currentUserId && recipe.author?.auth0Id === currentUserId;
      return isAuthor;
    }
    
    // Hide incomplete published recipes (safety check - shouldn't exist after migration)
    return false;
  });

  // ✅ STEP 2: Apply search/category filters
  recipes = recipes.filter(function (recipe) {
    // ✅ Handle Uncategorized filter FIRST
    if (filters.showUncategorized) {
      return !recipe.categories || recipe.categories.length === 0;
    }

    // ✅ Handle category filter (exact match) - BEFORE checking searchText
    if (filters.categoryFilter) {
      const recipeCategories = Array.isArray(recipe.categories)
        ? recipe.categories.map(cat => cat.toLowerCase())
        : [];
      return recipeCategories.includes(filters.categoryFilter);
    }

    // ✅ Handle text search (searches name, author, categories)
    const search = filters.searchText.toLowerCase();
    
    // If no search text AND no category filter, show all
    if (!search) {
      return true;
    }
    
    const matchName = recipe.name?.toLowerCase().includes(search);
    const matchAuthor = recipe.author?.name?.toLowerCase().includes(search);

    const matchCategories = Array.isArray(recipe.categories)
      ? recipe.categories.some(cat => cat.toLowerCase().includes(search))
      : false;

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
        const cleaned = resaveCreatedDate.replace(/(\d+)(st|nd|rd|th)/, '$1');
        let unixTimestamp = Math.floor(new Date(cleaned).getTime() / 1000);
        recipe.createdAt = [resaveCreatedDate, unixTimestamp];
        saveRecipes(recipes);
      }
      
      let name = recipe.name;
      let description = recipe.description;

      // ✅ FIXED: Use simple slug format
      const recipeLink = recipe.fullSlug 
        ? `/article/${recipe.fullSlug}`           // New: /carbonara
        : `/article.html#${recipe.id}`;   // Fallback: old hash format

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
      // text.appendChild(recipeDescription);
      
      cardAnchor.classList.add('card');
      cardAnchor.classList.add('home');
      cardAnchor.appendChild(article);
      article.appendChild(figure);
      figure.appendChild(image);         
      article.appendChild(text);
      
      cardIndex.classList.add('cards');
      cardIndex.appendChild(cardAnchor);

      // ✅ Get featured image from images array (backward compatible)
      const featuredImage = getFeaturedImage(recipe);
      const photoURL = featuredImage?.url || '/images/pexels-mali-maeder-1.jpg'; // Fallback image
      
      image.setAttribute('src', `${photoURL}`);
      image.setAttribute('alt', `Photo of ${recipe.name}`);
      image.setAttribute('description', `Decorative image relating to ${recipe.name}`);

      // Shared element morph — matches viewTransitionName set in article.js
    if (recipe.fullSlug) {
      image.style.viewTransitionName = `recipe-img-${recipe.id}`;
      recipeName.style.viewTransitionName = `recipe-title-${recipe.id}`;
     }

      const badges = generateRecipeBadges(recipe, currentUserId);
      if (badges) {
        article.insertAdjacentHTML('afterbegin', badges);
      }
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