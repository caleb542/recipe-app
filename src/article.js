import "./style.scss";
import { loadRecipes, addIngredients, loadRecipesFromLocalStorage } from "./functions"
import { getTimestamp, toggleMenu, hamburger } from "./functions"
// import { list } from "unsplash-js/dist/methods/photos";


const recipeId = location.hash.substring(1)

let recipes;

let fetchRecipes = async () => {
    recipes = await loadRecipesFromLocalStorage()
    createArticleDOM(recipes)
    console.log(recipes)
}

fetchRecipes()



const createArticleDOM = (recipes) => {
    // let recipes = loadRecipes()
    // "recItem": find the recipe with the id passed in the hash
    let recItem = recipes.find((recipe) => recipe.id === recipeId )
    // console.error(recItem.directions.length)
    if (!recItem) {
        location.assign('/index.html')
    }
    
    const articleHeader = document.createElement('div')
        articleHeader.classList.add('article-header')

    const editButton = document.createElement('a')
        editButton.setAttribute('id','cta-update')
        editButton.setAttribute('href','./edit.html#'+recipeId)
        editButton.textContent = "Update recipe"
        editButton.classList.add('cta-update','btn')



    const recipeBody = document.createElement('article')
    const card = document.createElement('div')
        card.classList.add('card')
        card.classList.add('article')
    const header = document.createElement('header')
       
    const title = document.querySelector('.article__title');
    const subtitle = document.querySelector('.header__subtitle');

    const summary = document.createElement('div')
    summary.classList.add('summary')
    const recipeLink = document.createElement('a')
    recipeLink.classList.add('recipe-link');
    recipeLink.setAttribute('href','#recipe');
    recipeLink.textContent='Hurry to the recipe';
    summary.appendChild(recipeLink);
    const imageElement = document.createElement('div')
    const photoInfo = document.createElement('p')
    photoInfo.classList.add('photoInfo')
    photoInfo.innerHTML = `Photo from Unsplash by <a href="${recItem.photographerLink}">${recItem.photographer}</a>`;

    const directionsElem = document.createElement('div')
        directionsElem.classList.add('directions')

    const dates = document.createElement('div')
        dates.classList.add('dates')
    const author = document.createElement('p')    
        author.classList.add('author')
    const recipeTitle = recItem.name;
    const directionsHeading = document.createElement('div')
    directionsHeading.classList.add('directions-heading')
    directionsHeading.innerHTML =  `<h2>Directions:</h2>`;
  
/* ----- */
  const directionsList = document.createElement('ol');
    directionsElem.appendChild(directionsHeading);
    directionsElem.appendChild(directionsList);
    const listDirections = (directions) => {
       
        directions.forEach(step => {
            const li = document.createElement('li')
            li.innerHTML = `${step.text}`
            directionsList.appendChild(li)
        })
    }
    const recipeDirections = recItem.directions
     listDirections(recipeDirections)
    
/* ------ */

    const article = recItem.article;
    
    const photoURL = recItem.photoURL
    const createdAt = recItem.createdAt
    let updatedAt = recItem.updatedAt
    let authorData = `by ${recItem.author}`
    author.textContent = authorData
    // console.log(recipeSubTitle)
    updatedAt ? updatedAt = createdAt:updatedAt = updatedAt
    updatedAt === createdAt ? dates.innerHTML = `<date>Created: ${createdAt[0]}</date>`: dates.innerHTML = `<date><strong>Created</strong>: ${createdAt[0]}</date>
    <date><strong>Modified</strong>: ${updatedAt[0]}</date>`


    imageElement.classList.add('imageElement')
    imageElement.setAttribute('style',`background-image:url(${photoURL})`)

    title.textContent = recipeTitle;
    // subtitle.textContent = recipeSubTitle;
    const summaryContent=document.createElement('div');
    summaryContent.innerHTML = `${recItem.article}` 
    summary.appendChild(summaryContent);
    

    const descriptionText = document.createElement('p');
    descriptionText.classList.add('description,summary');
    descriptionText.innerHTML = recItem.description;
    articleHeader.appendChild(dates)
    articleHeader.appendChild(author)
    articleHeader.appendChild(descriptionText)



    // header.appendChild(title)
    // header.appendChild(subTitle)
    

   
   
    recipeBody.appendChild(card)
    card.appendChild(header)
    card.appendChild(articleHeader)
    card.appendChild(imageElement)
    imageElement.appendChild(photoInfo)
    
    // card.appendChild(subTitle)
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
    checklistHeader.setAttribute('id','recipe')
    const checklistTitle = document.createElement('h3')
    checklistTitle.textContent = "Recipe";
    const editRecipeButton = document.createElement('button')
    editRecipeButton.setAttribute('id','edit-recipe');
    editRecipeButton.textContent = 'Edit recipe'
    checklistHeader.appendChild(checklistTitle)
    // checklistHeader.appendChild(editRecipeButton)
    
    checkListCont.appendChild(checklistHeader)
    checklistHeader.appendChild(editButton)
    checkListCont.appendChild(checklist)



    const shoppingListCont = document.createElement('div')
    shoppingListCont.classList.add("shoppinglist-container")
    shoppingListCont.classList.add("hide")
    const shoppingList = document.createElement('ul')
    const shoppingListTitle = document.createElement('h3')
    shoppingListTitle.textContent = "Shopping List"
    shoppingListCont.appendChild(shoppingListTitle);
    shoppingListCont.appendChild(shoppingList)
    shoppingList.classList.add('shopping-list')

    let ingredientsList = () => {
        if(recItem.ingredients.length < 1){
            alert('do something about this')
            card.appendChild(lists)
            lists.appendChild(checkListCont)
        }else{
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

        });
        }
       
    }
    
    ingredientsList()
    card.appendChild(directionsElem)

    const checkboxes = document.querySelectorAll('.checklist li input');
    const shoppingListArr = []
    const list = document.querySelector('.shopping-list');
    let your_email = 'caleb542@gmail.com'
    let n = 0;

    

checkboxes.forEach(item => {
    console.log(item.textContent)
    item.addEventListener('change', function(e){
        
        if(item.checked){
            const shop = document.querySelector('.shoppinglist-container') 
            const checks = document.querySelector('.checklist-container')
            shop.classList.remove('hide')
            checks.classList.add('checked')

            let parent = item.parentNode;
            const checkedItemText = parent.childNodes[1].textContent
            shoppingListArr.push(checkedItemText)

           
            let dom;
            shoppingListArr.forEach(one => {
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
                let name = recItem.name;
                let n = 0;

               shoppingListArr.forEach(ingredient => {
               n++;
                    bodyString +=  `${ingredient}%0D%0A`
                   document.querySelector("a#mail-list").setAttribute('href',`mailto:${your_email}?&subject="Shopping list for ${name}" &body=${bodyString}`);
               })
            }
           getHref()
    
        } else if(!item.checked){
           
            parent = item.parentNode;
            const uncheckedItemText = parent.childNodes[1].textContent
            shoppingListArr.find(listItem => {
                if(uncheckedItemText === listItem){
                   let index = shoppingListArr.indexOf(listItem)
                    shoppingListArr.splice(index, 1)
                } 
            })
            console.log(shoppingListArr)
            let dom;
            const shop = document.querySelector('.shoppinglist-container');
            const list = document.querySelector('.shopping-list');
            const mailto = document.getElementById('mail-list');
           
            list.innerHTML = '';
            let m = 0
            shoppingListArr.forEach(one => {
                m++
                console.log
                dom = document.createElement('li');

                dom.textContent = one
                list.appendChild(dom)
                console.log(list)
               
                if(m === 0) {
                    shop.classList.add('hide'),
                    checks.classList.remove('checked')
                }
              })
              
              if(m === 0) {
                mailto.remove()
                shop.classList.add('hide')
              } else{
                list.appendChild(mailto)
              }
             
               
               const getHref = () => {
                let bodyString  = "";
                let name = recItem.name
                n=0;
               shoppingListArr.forEach(ingredient => {
               n++;
                   bodyString +=  `${ingredient}%0D%0A`
                   mailto.setAttribute('href',`mailto:${your_email}?&subject="Shopping list for ${name}" &body=${bodyString}`);
                   list.appendChild(mailto)

               })

            }
          
           getHref()
            
        }
        
    })
})


}


hamburger() 
window.addEventListener('storage',  (e) =>  {
    if (e.key === 'recipes') {

        fetchRecipes()
        
    }
})