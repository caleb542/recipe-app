import "./style.scss";
import {
    stringify,
    v4 as uuidv4
} from 'uuid';
import {
    editAddIngredient,
    loadRecipes,
    saveRecipes,
    loadRecipeForm
} from "./functions"
import {
    updateRecipe,
    updateIngredient
} from "./update"
/***************** */

const recipeId = location.hash.substring(1)
let recipes = loadRecipes()
const initEdit = (recipeId) => {

    let recItem = recipes.find((recipe) => recipe.id === recipeId)
    if (!recItem) {
        location.assign('/index.html')
    }


    let section1 = document.querySelector('.section-1')
    section1.innerHTML = ''
    const recipeName = document.createElement('label')
    recipeName.innerHTML = '<div>Name</div><input id="recipe-name" class="input" type="text" placeholder="Recipe Name" name="text" value="' + recItem.name + '"/>'
    section1.appendChild(recipeName)

    const recipeDescription = document.createElement('label')
    recipeDescription.innerHTML = '<div>Description</div><textarea id="recipe-description"  placeholder="Recipe Description"></textarea>'
    section1.appendChild(recipeDescription)
    document.getElementById('recipe-description').value = recItem.description
    section1.appendChild(recipeDescription)

    const recipeArticle = document.createElement('label')
    recipeArticle.innerHTML = '<div>Article</div><textarea id="recipe-article"  placeholder="Recipe Article"></textarea>'
    section1.appendChild(recipeArticle)
    document.getElementById('recipe-article').value = recItem.article
    section1.appendChild(recipeArticle)

    const recipeAuthor = document.createElement('label')
    recipeAuthor.innerHTML = '<div>Author</div><input id="recipe-author" class="input" type="text" placeholder="Peter Peter pumpkin eater" name="text" value="' + recItem.author + '"/>'
    section1.appendChild(recipeAuthor)

    const recipeDirections = document.createElement('label')
    recipeDirections.innerHTML = '<div>Directions</div><textarea id="recipe-directions"  placeholder="So what do we do first?"></textarea>'
    section1.appendChild(recipeDirections)
    document.getElementById('recipe-directions').value = recItem.directions
    section1.appendChild(recipeDirections)

    const recipeCategories = document.createElement('label')
    recipeCategories.innerHTML = '<div>Categories</div><textarea id="recipe-categories"  placeholder="pastry, dinner, vegan"></textarea>'
    section1.appendChild(recipeCategories)
    document.getElementById('recipe-categories').value = recItem.categories
    section1.appendChild(recipeCategories)

    let cats;

    recItem.categories === 'string' ? cats = recItem.categories.split(',') : cats = []


    let item;
    cats.forEach((cat, i = 1) => {
        console.log(i++)
        item = document.createElement('li')
        let itemInput = document.createElement('input')
        itemInput.setAttribute('id', 'category-' + i);
        itemInput.value = cat
        item.appendChild(itemInput)
        recipeCategories.appendChild(item)

    })

    loadRecipeForm(recItem)


    //const recipeName = document.getElementById('recipe-name');
    //const recipeDescription = document.getElementById('recipe-description');
    //const recipeArticle = document.getElementById('recipe-article');
    //const recipeAuthor = document.getElementById('recipe-author');
    //const recipeDirections = document.getElementById('recipe-directions');
    //const recipeCategories = document.getElementById('recipe-categories');
    const ingredientsContainer = document.getElementById('ingredients');
    ingredientsContainer.classList.add('edit-ingredients')
    let n = 0;
    recItem.ingredients.forEach(ingred => {
        n++
        let iUUID = ingred.id
        let iName = ingred.name;
        let iDescription = ingred.description
        let iAmount = ingred.amount
        let iMeasureWord = ingred.measureWord
        let iUnit = ingred.unit;
        iMeasureWord !== "" ? iUnit = iMeasureWord : iUnit = ingred.unit


        const subtitle = document.querySelector('.header__subtitle');
        subtitle.textContent = recItem.name;

        const recipeContainer = document.querySelector('#recipe ul.recipe')
        const recipeIngredients = document.createElement('li');
        recipeIngredients.innerHTML = `<label for=""><a class="edit-item" href="#""><span>${iAmount} ${iUnit} of ${iName} </span><i class="fa fa-pencil" area-hidden="true"  data="${iUUID}" ></i><span class="hide-text">Edit</span></a></label>
    <a href="#" data="${iUUID}">Remove<span  data="${iUUID}">X</span></a>`

        recipeContainer.appendChild(recipeIngredients)

    })



    recipes = loadRecipes()
    recipeName.addEventListener('input', (e) => {
        updateRecipe(recipeId, {
            name: e.target.value
        })
        //dateElement.textContent = generateLastEdited(note.updatedAt)
    })
    recipeDescription.addEventListener('input', (e) => {
        updateRecipe(recipeId, {
            description: e.target.value
        })

        //dateElement.textContent = generateLastEdited(note.updatedAt)
    })
    recipeArticle.addEventListener('input', (e) => {
        updateRecipe(recipeId, {
            article: e.target.value
        })

        //dateElement.textContent = generateLastEdited(note.updatedAt)
    })
    recipeAuthor.addEventListener('input', (e) => {
        updateRecipe(recipeId, {
            author: e.target.value
        })
    })
    recipeDirections.addEventListener('input', (e) => {
        updateRecipe(recipeId, {
            directions: e.target.value
        })
    })
    recipeCategories.addEventListener('input', (e) => {
        updateRecipe(recipeId, {
            categories: e.target.value
        })
    })



    const edit = document.querySelectorAll('.recipe li a.edit-item');
    console.log(edit)
    edit.forEach(button => {
        console.log(button)
        button.addEventListener('click', function (e) {
            e.preventDefault();
            let ingredientId = e.target.getAttribute('data')
            let item = recItem.ingredients.find((ingredient) => ingredient.id === ingredientId)
            editIngredient(item)



        })
    })
    const editIngredient = (i) => {
        const modal = document.createElement('dialog');
        modal.setAttribute('aria-labelled-by', 'dialog_title')
        modal.setAttribute('aria_described-by', 'dialog_description')
        const iDom = `<ul id="ingredient${n}">
    <li><label>Name: <input dataId="${i.id}" id="name" value="${i.name}" /></label></li>
    <li><label>Description: <input id="description" dataId="${i.id}" value="${i.description}" /></label></li>
    <li><label>Amount: <input id="amount" dataId="${i.id}" value="${i.amount}" /></label></li>
    <li><label>Unit: <input id="unit" dataId="${i.id}"  value="${i.unit}" /></label></li>
    <li><label>Measure Word (Optional): <input id="measureWord" dataId="${i.id}" value="${i.measureWord}" /></label></li>
    <div class="button__footer">
    <button id="edit-add-ingredient" class=" edit-add-ingredient"></button>
    <button id="close_dialog">Close</button>
    </div>
    </ul>`;
        modal.innerHTML = iDom;
        const checkDialogs = document.querySelectorAll('dialog').length;
        if (checkDialogs > 0) {
            return
        }
        document.querySelector('.article__recipe').appendChild(modal)
        document.getElementById('close_dialog').addEventListener('click', function () {
            modal.remove()
        });

        const inputs = modal.querySelectorAll('input');

        inputs.forEach(input => {
        
            const dataid = input.getAttribute('dataId');
            const id = input.getAttribute('id')
        input.addEventListener('input', (e) => {
         
            const val = e.target.value
            if (id === 'name') {
                updateIngredient(recipeId, dataid, id, {
                    name: val
                })
            } else if (id === 'description') {
                updateIngredient(recipeId, dataid, id,  {
                    description: val
                })
            } else if (id === 'amount') {
                updateIngredient(recipeId, dataid, id, {
                    amount: val
                })
            } else if (id === 'unit') {
                updateIngredient(recipeId, dataid, id,  {
                    unit: val
                })
            } else if (id === 'measureWord') {
                updateIngredient(recipeId, dataid, id,  {
                    measureWord: val
                })
            }

        })
    });

    }

    





    const addIngredientButton = document.querySelectorAll('.edit-add-ingredient');
    addIngredientButton.forEach(button => {
        button.addEventListener('click', function () {

            alert('hello')
            const recipeId = location.hash.substring(1)
            let recipes = loadRecipes()
            let recItem = recipes.find((recipe) => recipe.id === recipeId)


            const newIngredient = {
                name: "",
                description: "",
                amount: "",
                unit: "",
                measureWord: "",
                alternatives: [],
                id: `${uuidv4()}`
            }

            recItem.ingredients.push(newIngredient)

            saveRecipes(recipes)
        })
    })
    // keep this listener at the bottom
    window.addEventListener('storage', (e) => {
        if (e.key === 'recipes') {
            // initEdit(recipeId)
            let recipes = loadRecipes()
            let recItem = recipes.find((recipe) => recipe.id === recipeId)
            if (!recItem) {
                location.assign('/index.html')
            }
            console.log(':edit.js some storage change')
            initEdit(recipeId)
        }
    })

}

initEdit(recipeId)