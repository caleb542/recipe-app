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

const firstLoad = document.getElementById("static-landing-page");
const pageContainer = document.querySelector('.page-container')
pageContainer.style.opacity='0.4'
pageContainer.style.top="10%"
firstLoad.style.opacity="1"
firstLoad.style.zIndex="10"

const stlCta = document.querySelector('.stl-cta')
stlCta.addEventListener("click", function(e){
  firstLoad.style.opacity="0.5"
  firstLoad.style.position="fixed"
  firstLoad.style.top="-120%"
  firstLoad.style.transition=" 0.8s ease-out"
  pageContainer.style.opacity="1"
  pageContainer.style.top="0"
  pageContainer.style.display="block"
  pageContainer.style.transition="all 0.8s ease-out"
})

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



// const spins = document.querySelector(".spinning-wheel")
// const box = document.body;


// const updateDisplay = (event) => {
 
//   let X = `${Math.round((event.pageX / 2) / window.innerWidth * 1000 )}px `
//   let Y = `${Math.floor((event.pageY / 2)/ window.innerHeight * 1000)}px`
//   spins.style.top="unset"
//   spins.style.left="unset"
//   spins.style.bottom=Y
//   spins.style.right=X
//   console.log(`spins top ${Y} left ${X}`)
// }

// box.addEventListener("mousemove", updateDisplay, false);
// box.addEventListener("mouseenter", updateDisplay, false);
// box.addEventListener("mouseleave", updateDisplay, false);