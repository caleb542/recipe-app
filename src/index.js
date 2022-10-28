import "./style.scss";
import {
  stringify,
  v4 as uuidv4
} from 'uuid';
import {
  createApi
} from 'unsplash-js'
import {
  getFilters,
  setFilters
} from './filters';
import {
  sortRecipes,
  listRecipes
} from './recipes'
import {
  unsplashme
} from "./unsplash";
import {
  getRecipesFromDatabase,
  loadRecipes,
  getTimestamp,
  saveRecipes,
  toggleMenu,
  hamburger,
  convertTimestamp,
  loadRecipesFromLocalStorage
} from './functions'
import * as Realm from "realm-web";


await listRecipes(recipes)

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
  let recipes = await loadRecipesFromLocalStorage()
  let categories = []
  recipes.forEach((recipe) => {
    recipe.categories.forEach(category => {
      categories.push(category)
    })
  })

  //filter out duplicates
  function uniq(categories) {
    var seen = {};
    return categories.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
  }
 function uniq(cats) {
  var seen = {};
  return cats.filter(function(item) {
      return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}
// add ALL

categories = uniq(categories)

categories.unshift("All")
  const categoriesCloud = document.createElement("div")
  categoriesCloud.setAttribute("id", "categories-cloud");
  categoriesCloud.style.display="flex"
  categoriesCloud.style.flexGrow="0"
  categoriesCloud.style.flexWrap="wrap"
  categoriesCloud.style.alignSelf="center"
  categoriesCloud.style.justifyContent="center"
  categoriesCloud.style.alignItems="center"
  categoriesCloud.style.gap="0.5rem"
  categoriesCloud.style.background = 'transparent'
  categoriesCloud.style.width = 'calc(50% - 4rem)'
  categoriesCloud.style.height = '3rem'
  categoriesCloud.style.zIndex = '8'
  categoriesCloud.style.bottom ='0'
  categoriesCloud.style.position='absolute'
  categoriesCloud.style.margin='0 auto'
  categoriesCloud.style.left="50%"
  categoriesCloud.style.transform='translateX(-50%)'
  categories.forEach(cat => {


    
    const div = document.createElement('div')
    const diva = document.createElement('a')
    diva.classList.add('sort')
    div.appendChild(diva)

    diva.setAttribute('href','#')

    diva.innerHTML = "<span></span><i class=''></i>"
    diva.classList.add('cat-item')
    diva.firstChild.textContent = cat
    diva.setAttribute('sort', cat)
    diva.firstChild.setAttribute('sort',cat)
    diva.firstChild.nextSibling.setAttribute('sort',cat)
    diva.style.display="grid"
    diva.style.placeContent="center"
    diva.style.textAlign="center"
    diva.style.textDecoration='none'
    diva.style.padding='0.2rem'
    diva.style.lineHeight='1'
    diva.style.textTransform='capitalize'
    diva.style.background='rgba(250,250,250,0.1)'
    diva.style.color='#fff'
    diva.style.fontSize='0.875rem'
    diva.style.borderRadius="0.5rem"
    diva.style.maxHeight="2rem"
    categoriesCloud.appendChild(div)
  })
  document.querySelector(".homepage-hero").appendChild(categoriesCloud);  
  document.querySelector(".homepage-hero").style.position="relative";

  
// Event Listeners
let tags = document.querySelectorAll('#categories-cloud a.sort')

tags.forEach(tag => {
  tag.addEventListener('click', (e) => {
   
    e.preventDefault()
   
    if(e.target.getAttribute('sort') === "All"){
      setFilters({
        searchText: " "

      })
      listRecipes(recipes)
    } else {
      setFilters({
        searchText: e.target.getAttribute('sort')
      })
      listRecipes(recipes)
    }
  
  
  },{once:true})
})
}

getCategories()
hamburger()


      
window.addEventListener('storage', (e) => {
  if (e.key === 'recipes') {
    // const newRecipes = loadRecipes()
    //  let pagename = index            
    listRecipes(recipes)
    //          updateTextElements(pageName);
  }
})