import "./style.scss";
import {stringify, v4 as uuidv4} from 'uuid';
import { createApi } from 'unsplash-js'
import { getFilters, setFilters } from './filters';
import { sortRecipes, listRecipes } from './recipes'
import { unsplashme } from "./unsplash";
import { getRecipesFromDatabase, loadRecipes, getTimestamp, saveRecipes } from './functions'
import * as Realm from "realm-web";

  
const recs = await getRecipesFromDatabase()  

const  sendRecipes = async () => {
    const APP_ID = 'data-puyvo'
    const app = new Realm.App({ id: APP_ID });
    const credentials =  Realm.Credentials.anonymous();
    const user = await app.logIn(credentials);
    let recipes = loadRecipes()
    // const recsd = await user.functions.updateAllRecipes(recipes);

  }




listRecipes()


// Event Listeners
document.querySelector('#search-filter').addEventListener('input',  (e) =>  {

  setFilters ({
      searchText: e.target.value
  })
  listRecipes()
})

document.querySelector('#filter-by').addEventListener('change', (e) =>  {

  setFilters ({
     sortBy: e.target.value 
  })
  listRecipes()
})

window.addEventListener('storage',  (e) =>  {
        if (e.key === 'recipes') {
           const newRecipes = loadRecipes()
            let pagename = index            

          updateTextElements(pageName);
    }
})
