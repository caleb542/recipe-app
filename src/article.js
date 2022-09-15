import "./style.scss";
import { loadRecipes } from "./functions"
import { getTimestamp } from "./functions"


const recipeId = location.hash.substring(1)
console.log(recipeId)


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
        header.classList.add('header__title')
    const title = document.createElement('h1')
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
    updatedAt === createdAt ? dates.innerHTML = `<div><strong>Created: </strong> ${createdAt}`: dates.innerHTML = `<p>Created: ${createdAt} / Modified: ${updatedAt}</p></div>`


    imageElement.classList.add('imageElement')
    imageElement.setAttribute('style',`background-image:url(${photoURL})`)

    title.textContent = recipeTitle;
    subTitle.textContent = recipeSubTitle;
    summary.innerHTML = article;
    

   
    articleHeader.appendChild(dates)
    articleHeader.appendChild(editButton)

    header.appendChild(articleHeader)
    header.appendChild(author)
    header.appendChild(title)
    header.appendChild(subTitle)
    recipeBody.appendChild(card)
    card.appendChild(imageElement)

    card.appendChild(header)
    card.appendChild(subTitle)
    card.appendChild(summary)
    

    document.querySelector('.container').innerHTML=''
    document.querySelector('.container').appendChild(recipeBody)
    document.title = `Recipe Me - ${recipeTitle}`


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
            const checklist = document.createElement('ul')
            checklist.classList.add('checklist')
            const checklistItem = document.createElement('li')
            const label = document.createElement('label')
            label.classList.add('article-checklist-items')

            const amt = document.createElement('span')
            const descr = document.createElement('span');
            const checkbox = document.createElement('input')
                checkbox.setAttribute('type', 'checkbox');
            unit === '' ? unit = measurementWord : unit = unit
            amt.textContent = `${amount} ${unit} of ${name} *${description}`

            label.appendChild(checkbox)
            amt ? label.appendChild(amt):console.log('no amt')
            descr ? label.appendChild(descr):console.log('no desc')
            
            checklistItem.appendChild(label)
            checklist.appendChild(checklistItem)

            let card = document.querySelector('.card')   
            card.appendChild(checklist)
            directionsElem.innerHTML = "<h2>Directions:</h2><div>" + recipeDirections + "</div>";
            card.appendChild(directionsElem)
            
        });
    }
    ingredientsList()

}
createArticleDOM(recipeId)

window.addEventListener('storage',  (e) =>  {
    if (e.key === 'recipes') {
        createArticleDOM(recipeId)
        
    }
})