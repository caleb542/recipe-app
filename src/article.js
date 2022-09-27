import "./style.scss";
import { loadRecipes, addIngredients } from "./functions"
import { getTimestamp } from "./functions"
// import { list } from "unsplash-js/dist/methods/photos";


const recipeId = location.hash.substring(1)
console.log(recipeId)

let recipes = loadRecipes()
let recItem = recipes.find((recipe) => recipe.id === recipeId )

const createArticleDOM = () => {
    let recipes = loadRecipes()
    // "recItem": find the recipe with the id passed in the hash
    let recItem = recipes.find((recipe) => recipe.id === recipeId )

    if (!recItem) {
        location.assign('/index.html')
    }
    
    const articleHeader = document.createElement('div')
        articleHeader.classList.add('article-header')

    const editButton = document.createElement('a')
        editButton.setAttribute('id','cta-update')
        editButton.setAttribute('href','./edit.html#'+recipeId)
        editButton.textContent = "Update this recipe"
        editButton.classList.add('cta-update')



    const recipeBody = document.createElement('article')
    const card = document.createElement('div')
        card.classList.add('card')
        card.classList.add('article')
    const header = document.createElement('header')
       
    const title = document.createElement('h1')
    title.classList.add('header__title')
    const subTitle = document.createElement('p') 
        subTitle.classList.add('header__subtitle')
    const summary = document.createElement('div')
    const imageElement = document.createElement('div')
    const directionsElem = document.createElement('div')
        directionsElem.classList.add('directions')

    const dates = document.createElement('div')
        dates.classList.add('dates')
    const author = document.createElement('p')    
        author.classList.add('author')
    const recipeSubTitle = recItem.description;
    const recipeTitle = recItem.name;
    const recipeDirections = recItem.directions;
    const article = recItem.article;
    
    const photoURL = recItem.photoURL
    const createdAt = recItem.createdAt
    const updatedAt = recItem.updatedAt
    const authorData = `Created by: ${recItem.author}`
    author.textContent = authorData
    console.log(recipeSubTitle)
    updatedAt === createdAt ? dates.innerHTML = `<date>Created: ${createdAt}</date>`: dates.innerHTML = `<date>Created: ${createdAt} / Modified: ${updatedAt}</p></date>`


    imageElement.classList.add('imageElement')
    imageElement.setAttribute('style',`background-image:url(${photoURL})`)

    title.textContent = recipeTitle;
    subTitle.textContent = recipeSubTitle;
    summary.innerHTML = article;
    

   
    articleHeader.appendChild(dates)
    articleHeader.appendChild(editButton)
    header.appendChild(title)
    header.appendChild(subTitle)
    header.appendChild(articleHeader)
    header.appendChild(author)
   
   
    recipeBody.appendChild(card)
    card.appendChild(imageElement)

    card.appendChild(header)
    card.appendChild(subTitle)
    card.appendChild(summary)
    

    document.querySelector('.container').innerHTML=''
    document.querySelector('.container').appendChild(recipeBody)
    document.title = `Recipe Me - ${recipeTitle}`
    const lists = document.createElement('div');
    lists.classList.add('lists')
    const checkListCont = document.createElement('div')
    checkListCont.classList.add("checklist-container")
    const checklist = document.createElement('ul')
    checklist.classList.add('checklist')
    const checklistHeader = document.createElement('div')
    checklistHeader.classList.add('checklistHeader');
    const checklistTitle = document.createElement('h2')
    checklistTitle.textContent = "Recipe";
    const editRecipeButton = document.createElement('button')
    editRecipeButton.setAttribute('id','edit-recipe');
    editRecipeButton.textContent = 'Edit recipe'
    checklistHeader.appendChild(checklistTitle)
    checklistHeader.appendChild(editRecipeButton)
    checkListCont.appendChild(checklistHeader)
    checkListCont.appendChild(checklist)



    const shoppingListCont = document.createElement('div')
    shoppingListCont.classList.add("shoppinglist-container")
    const shoppingList = document.createElement('ul')
    const shoppingListTitle = document.createElement('h2')
    shoppingListTitle.textContent = "Shopping List"
    shoppingListCont.appendChild(shoppingListTitle);
    shoppingListCont.appendChild(shoppingList)
    shoppingList.classList.add('shopping-list')

    let ingredientsList = () => {
        recItem.ingredients.forEach(ingr => {
           
                let name = ingr.name;
                let description = ingr.description
                let amount = ingr.amount
                let unit = ingr.unit
                let measurementWord = ingr.measureWord
                measurementWord != '' ? unit = measurementWord:unit=unit  
            
            if(ingr.alternatives.length > 0){
                let alts = ingr.alternatives
                    alts.forEach((alt) => {
                    return alt
                })
            }
            const ingredientsElem = document.createElement("div")
                ingredientsElem.setAttribute("id","ingredients")
            const checklistItem = document.createElement('li')
            const label = document.createElement('label')
            label.classList.add('article-checklist-items')

            const amt = document.createElement('span')
            const descr = document.createElement('span');
            const checkbox = document.createElement('input')
                checkbox.setAttribute('type', 'checkbox');
            unit === '' ? unit = measurementWord : unit = unit
            amt.textContent = `${amount} ${unit} of ${name} ${description}`

            label.appendChild(checkbox)
            amt ? label.appendChild(amt):console.log('no amt')
            descr ? label.appendChild(descr):console.log('no desc')
            
            checklistItem.appendChild(label)
            checklist.appendChild(checklistItem)

            let card = document.querySelector('.card')   
            card.appendChild(lists)
            lists.appendChild(checkListCont)
            lists.appendChild(shoppingListCont)

            directionsElem.innerHTML = "<h2>Directions:</h2><div>" + recipeDirections + "</div>";
            card.appendChild(directionsElem)
            
        });
    }
    ingredientsList()

}
createArticleDOM(recipeId)
const checkboxes = document.querySelectorAll('.checklist li input');
const shoppingList = []
const list = document.querySelector('.shopping-list');
let your_email = 'caleb542@gmail.com'
let n = 0;




document.getElementById("edit-recipe").addEventListener('click', function(){
    addIngredients()
})

checkboxes.forEach(item => {
    item.addEventListener('change', function(e){
        
        if(item.checked){
            let parent = item.parentNode;
            const checkedItemText = parent.childNodes[1].textContent
            shoppingList.push(checkedItemText)
//render
           
            let dom;
          shoppingList.forEach(one => {
            dom = document.createElement('li');
            dom.textContent = one
        })
          list.appendChild(dom)
          if(!document.querySelector("a#mail-list")){
            const mailto = document.createElement('a');
            mailto.classList.add('mailto')
            mailto.setAttribute('id','mail-list')
            mailto.textContent = "Email Shopping List";
            list.appendChild(mailto);
           }
            const getHref = () => {
                let bodyString  = "";
                let n = 0;
               shoppingList.forEach(ingredient => {
               n++;
                   bodyString +=  `Shopping List For ${recItem.name}%0D%0A%0D%0A${n}) ${ingredient}%0D%0A`
                   document.querySelector("a#mail-list").setAttribute('href',`mailto:${your_email}?&subject="Sharing this recipe" &body=${bodyString}`);
               })
            }
           getHref()
    
        }else if(!item.checked){
            parent = item.parentNode;
            const uncheckedItemText = parent.childNodes[1].textContent
            shoppingList.find(listItem => {
                if(uncheckedItemText === listItem){
                   let index = shoppingList.indexOf(listItem)
                    shoppingList.splice(index, 1)
                } 
            })
            console.log(shoppingList)
            let dom;
            const list = document.querySelector('.shopping-list');

            list.innerHTML = ''
            shoppingList.forEach(one => {

                dom = document.createElement('li');
                dom.textContent = one
                list.appendChild(dom)
          
                 
              })
              if(!document.querySelector("a#mail-list")){
                const mailto = document.createElement('a');
                mailto.classList.add('mailto')
                mailto.setAttribute('id','mail-list')
                mailto.textContent = "Email Shopping List";
                list.appendChild(mailto);
               }
               const getHref = () => {
                let bodyString  = "";
                let n = 0;
               shoppingList.forEach(ingredient => {
               n++;
                   bodyString +=  `Shopping List For ${recItem.name}%0D%0A%0D%0A${n}) ${ingredient}%0D%0A`
                   document.querySelector("a#mail-list").setAttribute('href',`mailto:${your_email}?&subject="Sharing this recipe" &body=${bodyString}`);
               })
            }
           getHref()
            
        }
      
 

        console.log(shoppingList)
    })
})

window.addEventListener('storage',  (e) =>  {
    if (e.key === 'recipes') {
        createArticleDOM(recipeId)
        
    }
})