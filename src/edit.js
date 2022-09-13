import "./style.scss";
import { loadRecipes, saveRecipes, loadRecipeForm } from "./functions"
import { updateRecipe, updateIngredient} from "./update"
/***************** */

const recipeId = location.hash.substring(1)

const initEdit = (recipeId) => {
    let recipes = loadRecipes()
    let recItem = recipes.find((recipe) => recipe.id === recipeId )
    if (!recItem) {
        location.assign('/index.html')
    }

    
    let section1 = document.querySelector('.section-1')
   
    section1.innerHTML=''
    const recipeName = document.createElement('label')
    recipeName.innerHTML='<div>Name</div><input id="recipe-name" class="input" type="text" placeholder="Recipe Name" name="text" value="'+ recItem.name +'"/>'
    section1.appendChild(recipeName)

    const recipeDescription = document.createElement('label')
    recipeDescription.innerHTML='<div>Description</div><textarea id="recipe-description"  placeholder="Recipe Description"></textarea>'
    section1.appendChild(recipeDescription)
    document.getElementById('recipe-description').value=recItem.description
    section1.appendChild(recipeDescription)

    const recipeArticle = document.createElement('label')
    recipeArticle.innerHTML='<div>Article</div><textarea id="recipe-article"  placeholder="Recipe Article"></textarea>'
    section1.appendChild(recipeArticle)
    document.getElementById('recipe-article').value=recItem.article
    section1.appendChild(recipeArticle)

    const recipeAuthor = document.createElement('label')
    recipeAuthor.innerHTML='<div>Author</div><input id="recipe-author" class="input" type="text" placeholder="Peter Peter pumpkin eater" name="text" value="'+ recItem.author +'"/>'
    section1.appendChild(recipeAuthor)

    const recipeDirections = document.createElement('label')
    recipeDirections.innerHTML='<div>Directions</div><textarea id="recipe-directions"  placeholder="So what do we do first?"></textarea>'
    section1.appendChild(recipeDirections)
    document.getElementById('recipe-directions').value=recItem.directions
    section1.appendChild(recipeDirections)

    const recipeCategories = document.createElement('label')
    recipeCategories.innerHTML='<div>Categories</div><textarea id="recipe-categories"  placeholder="pastry, dinner, vegan"></textarea>'
    section1.appendChild(recipeCategories)
    document.getElementById('recipe-categories').value=recItem.categories
    section1.appendChild(recipeCategories)

let cats;

recItem.categories === 'string' ? cats = recItem.categories.split(','):cats = []   


let item;
cats.forEach((cat, i=1) => {
    console.log(i++)
    item = document.createElement('li')
    let itemInput = document.createElement('input')
    itemInput.setAttribute('id','category-' + i);
    itemInput.value = cat
    item.appendChild(itemInput)
    recipeCategories.appendChild( item )
    
})

loadRecipeForm(recItem)


//const recipeName = document.getElementById('recipe-name');
//const recipeDescription = document.getElementById('recipe-description');
//const recipeArticle = document.getElementById('recipe-article');
//const recipeAuthor = document.getElementById('recipe-author');
//const recipeDirections = document.getElementById('recipe-directions');
//const recipeCategories = document.getElementById('recipe-categories');
const ingredientsContainer = document.getElementById('ingredients');
let n = 0;
recItem.ingredients.forEach(ingred => {
    n++
      let iUUID = ingred.id
      let iName = ingred.name;
      let iDescription = ingred.description
      let iAmount = ingred.amount
      let iUnit = ingred.unit
      let iMeasureWord = ingred.measureWord

    
    const iDom = `<ul id="ingredient${n}">
                  <li><label>Name: <input dataId="${iUUID}" id="name" value="${iName}" /></label></li>
                  <li><label>Description: <input id="description" dataId="${iUUID}" value="${iDescription}" /></label></li>
                  <li><label>Amount: <input id="amount" dataId="${iUUID}" value="${iAmount}" /></label></li>
                  <li><label>Unit: <input id="unit" dataId="${iUUID}"  value="${iUnit}" /></label></li>
                  <li><label>Measure Word (Optional): <input id="measureWord" dataId="${iUUID}" value="${iMeasureWord}" /></label></li></ul>`;
    ingredientsContainer.innerHTML += iDom
})


recipes = loadRecipes()
recipeName.addEventListener('input', (e) => {
    updateRecipe(recipeId, {
        name:e.target.value
    })
    //dateElement.textContent = generateLastEdited(note.updatedAt)
})
recipeDescription.addEventListener('input', (e) => {
    updateRecipe(recipeId, {
        description:e.target.value
    })
   
    //dateElement.textContent = generateLastEdited(note.updatedAt)
})
recipeArticle.addEventListener('input', (e) => {
    updateRecipe(recipeId, {
        article:e.target.value
    })
   
    //dateElement.textContent = generateLastEdited(note.updatedAt)
})
recipeAuthor.addEventListener('input', (e) => {
    updateRecipe(recipeId, {
        author:e.target.value
    })
})
recipeDirections.addEventListener('input', (e) => {
    updateRecipe(recipeId, {
        directions:e.target.value
    })
})
recipeCategories.addEventListener('input', (e) => {
    updateRecipe(recipeId, {
        categories:e.target.value
    })
})



const ingredientListInput = document.querySelectorAll('#ingredients ul input')
 ingredientListInput.forEach(input => {
    const ingredientId = input.getAttribute('dataid');
    const id = input.getAttribute('id')
    input.addEventListener('input',  (e) => {
      // alert('id:' + id + ' recipeId:' + recipeId + " ingredientId:" + ingredientId)
    const val = e.target.value
     if(id === 'name'){
        updateIngredient(recipeId, ingredientId, id, {
            name:val})
     } else if(id === 'description'){
        updateIngredient(recipeId, ingredientId, id, {
            description:val})
     } else if(id === 'amount'){
        updateIngredient(recipeId, ingredientId, id, {
            amount:val})
     } else if(id === 'unit'){
        updateIngredient(recipeId, ingredientId, id, {
            unit:val})
     } else if(id === 'measureWord'){
        updateIngredient(recipeId, ingredientId, id, {
            measureWord:val})
     } 
    
    })
 });




// keep this listener at the bottom
window.addEventListener('storage',  (e) =>  {
    if (e.key === 'recipes') {
       // initEdit(recipeId)
       let recipes = loadRecipes()
        let recItem = recipes.find((recipe) => recipe.id === recipeId )
        if (!recItem) {
            location.assign('/index.html')
        }
        console.log(':edit.js some storage change')
        initEdit(recipeId)
    }
})

}

initEdit(recipeId)