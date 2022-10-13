import "./style.scss";
import {stringify, v4 as uuidv4} from 'uuid';
import { createApi } from 'unsplash-js'
import { getFilters, setFilters } from './filters';
import { sortRecipes, listRecipes } from './recipes'
import { unsplashme } from "./unsplash";
import { getRecipesFromDatabase, loadRecipes, getTimestamp, saveRecipes, toggleMenu, hamburger, convertTimestamp } from './functions'
import * as Realm from "realm-web";

  
// const recs = await getRecipesFromDatabase()  

// const  sendRecipes = async () => {
//     const APP_ID = 'data-puyvo'
//     const app = new Realm.App({ id: APP_ID });
//     const credentials =  Realm.Credentials.anonymous();
//     const user = await app.logIn(credentials);
//     let recipes = await loadRecipes()
//     // const recsd = await user.functions.updateAllRecipes(recipes);

//   }

// const convertDate = async () => {
//   const recipes = await loadRecipes()
//   recipes.forEach(recipe => {
//     const updated = recipe.updatedAt 
//     recipe.updatedAt = [recipe.updatedAt, convertTimestamp(updated)]
//     (recipes)
//   })
// }  
// convertDate()

  // let recipes = await loadRecipes().then(result => {
  //   saveRecipes(result)
  // })

  listRecipes(recipes)



// Event Listeners
document.querySelector('#search-filter').addEventListener('input',  (e) =>  {
  console.log(e.target.value )
  setFilters ({
      searchText: e.target.value
  })
  listRecipes(recipes)
})

document.querySelector('#filter-by').addEventListener('change', (e) =>  {
console.log(e.target.value )
  setFilters ({
     sortBy: e.target.value 
  })
  listRecipes()
})



hamburger()
window.addEventListener('storage',  (e) =>  {
        if (e.key === 'recipes') {
          // const newRecipes = loadRecipes()
          //  let pagename = index            
listRecipes(recipes)
//          updateTextElements(pageName);
    }
})
