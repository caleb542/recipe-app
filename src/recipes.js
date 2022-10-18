import moment, { unix } from 'moment'
import {
    v4 as uuidv4
} from 'uuid';
import { getFilters } from './filters'
import { loadRecipes, getRecipesFromDatabase, saveRecipes, sortRecipes} from './functions'


let listRecipes = async () => {
    let recipes = await loadRecipes()
    saveRecipes(recipes)
    const filters = getFilters()
    recipes = sortRecipes(filters.sortBy, recipes)
    console.log(recipes)
    // FILTER WITH SEARCH TXT
    recipes = recipes.filter(function (recipe) {
      
        const list = recipe.name.toLowerCase().includes(filters.searchText.toLowerCase())
        const list2 = recipe.author.toLowerCase().includes(filters.searchText.toLowerCase())
        const list3 = recipe.categories.join().toLowerCase().includes(filters.searchText.toLowerCase())
        
        return list + list2 + list3
        // 
    })
      // First - clear everything out
      const cardIndex = document.querySelector("#recipes");
      cardIndex.innerHTML=''
  
  
      if(recipes.length > 0 ){
        let n = 0
          recipes.forEach(recipe => {
          let resaveCreatedDate = recipe.createdAt;
          console.log( typeof resaveCreatedDate)
          if (typeof resaveCreatedDate === 'string'){
            let unixTimestamp = moment(resaveCreatedDate, 'MMM Do, YYYY HH:mm').unix();
            recipe.createdAt = [resaveCreatedDate,unixTimestamp]
            saveRecipes(recipes)
          }
          console.log(recipe)
          console.log(n++)
          let name = recipe.name
          let description = recipe.description
          let recipeID = recipe.id;
          // let recip = '<a href="article.html#'+ recipeID +'"><article><div class="imageElement" style="background-image:url(' + photoURL + ')")" /><p class="creator"></p></div><div class="text-area"><h1>'+name+'</h1><p>'+description+'</p></div></article></a><a class="photographer" href="'  + photographerLink + '">Unsplash image by ' + photographer + '</a>'
          // create DOM cards
          let cardAnchor = document.createElement('a');
          cardAnchor.setAttribute('href',`article.html#${recipeID}`);
          let article = document.createElement('article'); 
          let image = document.createElement('div');
          image.classList.add('imageElement');
     
          let creator = document.createElement('p');
          creator.classList.add('creator')
          let text = document.createElement('div');
          text.classList.add('text-area');
          let recipeName = document.createElement('h1');
          recipeName.textContent = name;
          let recipeDescription = document.createElement('p');
          recipeDescription.textContent = description;
          text.appendChild(recipeName)
          text.appendChild(recipeDescription)
          cardAnchor.classList.add('card')
          cardAnchor.classList.add('home')
          cardAnchor.appendChild(article)
          article.appendChild(image)
          article.appendChild(text)
          cardIndex.classList.add('cards')
          cardIndex.appendChild(cardAnchor)

            let photoURL = recipe.photoURL
            image.setAttribute('style',`background-image:url(${photoURL})`);
            image.setAttribute('description',`Decorative image relating to ${recipe.name}`);


             
           })
      }  else {
        const cardIndex = document.querySelector("#recipes");
          const warning = document.createElement('div');
          warning.classList.add('card')
          warning.innerHTML = "<p>Sorry, no recipes were found. Try searching another keyword or <a href='/edit.html'>create a recipe</a>?</p>"
          cardIndex.appendChild(warning)
      }  
  }

  export { sortRecipes, listRecipes }