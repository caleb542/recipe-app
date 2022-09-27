import "./style.scss";
import { getImageGroup } from './unsplash'
import {
    stringify,
    v4 as uuidv4
} from 'uuid';
import {
    editAddIngredient,
    loadRecipes,
    saveRecipes,
    getRecipesFromDatabase,
    getTimestamp,
    renderImageSelector
} from "./functions"
import {
    updateRecipe,
    updateIngredient
} from "./update"
/***************** */

    let newRecipe = {
        name: "",
        photoURL: "",
        photographer: " ",
        photographerLink: "",
        createdAt: "",
        updatedAt: "",
        author: "",
        description: "",
        directions:"",
        categories: ['Food'],
        article: "",
        id: "",
        ingredients: [{
            name: "First ingredient",
            description: "describe",
            amount: "2",
            unit: "cups",
            measureWord: "",
            alternatives: [],
            id: `${uuidv4()}`
        }]
    }
    let recipeId = location.hash.substring(1);
    // console.error(`recipeId ${recipeId}`)
    // check if we are editing an existing recipe or adding one
    if(!location.hash.substring(1)){
        document.querySelector('.header__title').textContent = 'Add Recipe'
        console.error('no hash')
         recipeId = uuidv4()
         let createdAt = getTimestamp()
         if(history.pushState) {
            history.pushState(null, null, `edit.html#${recipeId}`);
        }
        else {
            location.hash = `edit.html#${recipeId}`;
        }
        console.error('new hash')
      // set up a new recipe in the recipes object
      let rec = loadRecipes()
      newRecipe.id = recipeId
      newRecipe.createdAt = createdAt  

    
   
    //   console.log(rec.splice(0, 0, newRecipe))
      console.log(rec.push(newRecipe))
   
      saveRecipes(rec)
      console.log('@@@@@@@@@@@@')
      

    // let recipes = loadRecipes();

    // if(typeof recipes !== 'array' ){
    //     console.error('Stored recipes not an array')

    //     recipes = await getRecipesFromDatabase().then( () => {
    //         newRecipe.id = recipeId  
    //         console.log("!!!!!!!!!!!!!!!!!!!!!!!")
    //         console.error(recipes)
    //         recipes = recipes.push(newRecipe)
    //         console.log(rec)
    //         saveRecipes(recc)
    //     })
        
    // } else {
   // newRecipe.id = recipeId  
    //console.log("!!!!!!!!!!!!!!!!!!!!!!!")
   // console.error(recipes)
    //recipes = recipes.push(newRecipe)
   // console.log(recipes)
    saveRecipes(rec)
    }
// }


const initEdit = (recipeId) => {
    let recipes = loadRecipes()
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


    const featureKeywordLabel = document.createElement('label')
    const featureKeywordText = document.createElement('div')
    const featureImageButton = document.createElement('button')
    featureImageButton.textContent = "Find an image"
    featureImageButton.classList.add('feature-image')
    featureImageButton.setAttribute('id','feature-image-button')
    const selectImages = document.createElement('div')
    selectImages.setAttribute('id','select-images')
    featureKeywordText.textContent = "Feature Image";
    featureKeywordLabel.classList.add('feature-image');
    const featureKeyword = document.createElement("input")
    featureKeyword.setAttribute('id','feature-keyword')
    featureKeyword.setAttribute('placeholder','Enter a keyword for the image search')
    featureKeywordLabel.appendChild(featureKeywordText)
    featureKeywordLabel.appendChild(featureKeyword)
    featureKeywordLabel.appendChild(featureImageButton)

    section1.appendChild(featureKeywordLabel)
    section1.appendChild(selectImages)


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
        recipeIngredients.innerHTML = `<label ><a class="edit-item" href="#" data="${iUUID}"><span data="${iUUID}">${iAmount} ${iUnit} ${iName} </span><i class="fa fa-pencil" area-hidden="true"  data="${iUUID}" ></i><span class="hide-text">Edit</span></a></label>
     <a href="#" class="remove" data="${iUUID}">Remove<span  data="${iUUID}">X</span></a>`

        recipeContainer.appendChild(recipeIngredients)

    })



    recipes = loadRecipes()
    recipeName.addEventListener('input', (e) => {
        document.querySelector('.header__subtitle').textContent=e.target.value
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
        let categories = e.target.value
        // categories === "" ? categories = 'food':categories
        let f = categories.split("");
        let val;
        if(f.includes(",")){
            let array = categories.split(',')
            console.log(array)
            val = array
            
            
        }else if(!f.includes(',')){
            let array = categories.split()
            console.log(array)
            val = array
        }
        updateRecipe(recipeId, {
            categories: val
        })
    })
    document.getElementById('feature-image-button').addEventListener('click', function(e){
        // fire image selection
        let pageNumber = 1;
        let keyword = document.getElementById('feature-keyword').value;
        keyword === '' ? keyword='pie':keyword=keyword
        renderImageSelector(keyword, pageNumber)
        
    })


    const removeIngredient = (id) => {
        console.log(id)
        let arr = recItem.ingredients;
        let item = arr.find(ingredient => ingredient.id === id)
        console.log(item)
        let i;

        for (let i = 0; i < arr.length; i++) {
            if (arr[i].id === id) {
                console.log('idddddddd: ' + i)
                console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
                recipes.forEach(recipe => {
                    if (recipe.id === recItem.id) {
                      console.log(`${recipe.name} i ? ${i}`)
                        if((recipe.ingredients.length - 1) === (i)){
                            recipe.ingredients.pop()
                        }else if(i === 0){
                            recipe.ingredients.shift()
                        }else{
                            recipe.ingredients.splice(recipe.ingredients[i], 1)
                        }

                        saveRecipes(recipes)
                    }
                 
                    
                })
            }

        }
    }

    const remove = document.querySelectorAll('.recipe li a.remove');
    remove.forEach(x => {
        x.addEventListener('click', function (e) {
            e.preventDefault();
            const id = e.target.getAttribute('data');
            removeIngredient(id)
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
        const modalContainer = document.createElement('div');
        modalContainer.classList.add('modal-container');
        const modal = document.createElement('dialog');
        modal.setAttribute('aria-labelled-by', 'dialog_title')
        modal.setAttribute('aria_described-by', 'dialog_description')
        const iDom = `<ul id="ingredient${n}">
        <li><label><div>Name:</div> <input dataId="${i.id}" id="name" value="${i.name}" /></label></li>
        <li><label><div>Description:</div> <input id="description" dataId="${i.id}" value="${i.description}" /></label></li>
        <li><label><div>Amount:</div> <input id="amount" dataId="${i.id}" value="${i.amount}" /></label></li>
        <li><label><div>Unit:</div> <input id="unit" dataId="${i.id}"  value="${i.unit}" /></label></li>
        <li><label><div>Measure Word (Optional):</div> <input id="measureWord" dataId="${i.id}" value="${i.measureWord}" /></label></li>
        
        <div class="button__footer">
        <button id="edit-add-ingredient" class=" edit-add-ingredient"></button>
        <button id="close_dialog">Close</button>
        </div>
        </ul>`;

        

        modalContainer.appendChild(modal)
        modal.innerHTML = iDom;
        const checkDialogs = document.querySelectorAll('dialog').length;
        if (checkDialogs > 0) {
            return
        }
        document.querySelector('body').appendChild(modalContainer)
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
                    updateIngredient(recipeId, dataid, id, {
                        description: val
                    })
                } else if (id === 'amount') {
                    updateIngredient(recipeId, dataid, id, {
                        amount: val
                    })
                } else if (id === 'unit') {
                    updateIngredient(recipeId, dataid, id, {
                        unit: val
                    })
                } else if (id === 'measureWord') {
                    updateIngredient(recipeId, dataid, id, {
                        measureWord: val
                    })
                }

            })
        });

    }


    const addIngredient = () => {
        const uuid = uuidv4()
        const newIngredient = {
                        name: "New Ingredient",
                        description: "",
                        amount: "",
                        unit: "",
                        measureWord: "",
                        alternatives: [],
                        id: uuid
                    }
        recItem.ingredients.push(newIngredient)
        const updateIt = recipes.find((recipe) =>{
            if(recipe.id === recItem.id){
                recipe.ingredients.push(newIngredient)
                saveRecipes(recipes)
            }
        })

       //saveItems(recipes)
        let thisItem = recItem.ingredients.find(ingredient => ingredient.id === uuid)
        console.log("################")
        console.log(recItem)
        console.log('TTTTTTTTTTTTTTTTTTTTT')
        console.log(recipes)
        
        editIngredient(thisItem)
        
    }
     
    const addAnIngredient = document.getElementById("add-an-ingredient");
    addAnIngredient.addEventListener('click', function(e){
        e.preventDefault();
        addIngredient()
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



            
