import "./style.scss";
import {
    getImageGroup
} from './unsplash'
import {
    stringify,
    v4 as uuidv4
} from 'uuid';
import {
    removeRecipe,
    loadRecipes,
    saveRecipes,
    loadRecipesFromLocalStorage,
    getTimestamp,
    renderImageSelector,
    toggleMenu,
    hamburger
} from "./functions"
import {
    updateRecipe,
    updateIngredient
} from "./update"
/***************** */

let newRecipe = {
    name: "New unnamed recipe",
    photoURL: "/images/default-dish-image.jpg",
    photographer: "         ",
    photographerLink: "",
    createdAt: [],
    updatedAt: [],
    author: "anonymous",
    description: "",
    directions: [{
        id: uuidv4(),
        text: "Start here"
    }],
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
const doneEditing = document.getElementById('done-editing');
doneEditing.setAttribute('href', `article.html#${recipeId}`)
// console.error(`recipeId ${recipeId}`)
// check if we are editing an existing recipe or adding one
if (!location.hash.substring(1)) {
    document.querySelector('.header__title').textContent = 'New Recipe'
    console.error('no hash')
    recipeId = uuidv4()
    doneEditing.setAttribute('href', `article.html#${recipeId}`)
    let createdAt = getTimestamp()
    if (history.pushState) {
        history.pushState(null, null, `edit.html#${recipeId}`);
    } else {
        if (recipeId !== "") {
            location.hash = `edit.html#${recipeId}`;
        } else {
            console.error("This doesn't seem to have a recipe id yet!")
        }
    }
    console.error('new hash')
    // set up a new recipe in the recipes object
    let rec = await loadRecipes()
    newRecipe.id = recipeId
    newRecipe.createdAt = createdAt
    console.log(rec.push(newRecipe))
    saveRecipes(rec)
    console.log('@@@@@@@@@@@@')
    saveRecipes(rec)
}




const initEdit = async (recipeId) => {
    let recipes = await loadRecipes()
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

    const directionsHeading = document.createElement('label');
    directionsHeading.textContent = "Directions"
    const directionsList = document.createElement("ol");
    directionsList.classList.add("directions")
    directionsHeading.innerHTML = `<div>Directions</div>`;

    /* ----- */

    directionsHeading.appendChild(directionsList);

    const recipeDirections = recItem.directions
    const listDirections = (directions) => {

        directions.forEach((step, index) => {
            const li = document.createElement('li')
            li.innerHTML = `<div class="direction-container"><div>${step.text}</div><a class="edit-item" href="#" dataId="${step.id}"><span dataId="${step.id}"></span><i class="fa fa-pencil" area-hidden="true" dataId="${step.id}" aria-hidden="true"></i><span class="hide-text">Edit</span></a><a href="#" title="remove" class="remove" dataId="${step}"><span dataId="${step.id}">RemoveX</span></a></div>`
            directionsList.appendChild(li)
        })

        const emptyBlock = document.createElement('div')
        const addContainer = document.createElement('div')

        addContainer.setAttribute('id', 'add-container');
        const add = document.createElement('a');
        add.setAttribute('id', 'add-step');
        add.setAttribute('href', '#');
        add.innerHTML = `<i class="fa fa-plus"></i><span class="hide-text">Add another step</span>`
        addContainer.appendChild(add)
        directionsHeading.appendChild(emptyBlock)
        directionsHeading.appendChild(addContainer)

    }


    section1.appendChild(directionsHeading);


    listDirections(recipeDirections)
    const addStepButton = document.getElementById("add-step");

    const openDirectionsDialogue = (id) => {

        const overlay = document.querySelector('.overlay')
        overlay.classList.add('show');
        const modal = document.createElement('dialog')
        modal.setAttribute('id', 'add-directions');
        const form = document.createElement('div');
        form.innerHTML = `<h2>${recItem.name} - Directions</h2><p>What's the next step?</p><form><fieldset><textarea placeholder="The next step is..." id="enter-next-step"></textarea></fieldset></form><button class="dialog-close-button">Done</button>`

        modal.appendChild(form)
        const page = document.querySelector('.page-container')
        page.appendChild(modal);
        // dialog-close-button
        const closeDialog = document.querySelector(".dialog-close-button")

        closeDialog.addEventListener('click', function (e) {
            initEdit(recipeId)
            modal.remove()
            document.querySelector('.overlay').classList.remove('show')
        })

    }
    // directions listeners
    // 1. ADD BUTTON]

    addStepButton.addEventListener('click', async function (e) {


        e.preventDefault()
        let recipeId = location.hash.substring(1);
        let recipes = await loadRecipes()
        let recItem = recipes.find((recipe) => recipe.id === recipeId)

        const id = e.target.getAttribute('dataId')
        openDirectionsDialogue(id)

        const textBox = document.getElementById("enter-next-step");

        let newDirections = {
            id: uuidv4(),
            text: ""
        }
        recItem.directions.push(newDirections);

        textBox.addEventListener('input', function (e) {

            let item = recItem.directions.find(item => item.id === newDirections.id)
            item.text = e.target.value

            saveRecipes(recipes)

        })

    })


    // Remove Directions Button
    const removeDirection = async (recipeId, id) => {
        let recipes = await loadRecipesFromLocalStorage()
        let rec = recipes.find((recipe) => recipe.id === recipeId)
        console.log(recipes)
        let arr = rec.directions;
        let item = arr.find(direction => direction.id === id)
        let itemNum = (arr.indexOf(item))
        alert(itemNum)


        const removerDir = () => {
            if (itemNum === 0) {
                alert('shift')
                arr.shift()
            } else if ((itemNum + 1) === arr.length) {
                alert('pop')
                arr.pop()
            } else {
                alert('splice')
                arr.splice(itemNum, 1)
            }
            console.log(rec)
            saveRecipes(recipes)
            initEdit(recipeId)

        }
        removerDir()
    }

    const removeButtons = document.querySelectorAll('.directions a.remove');
    removeButtons.forEach(x => {
        x.addEventListener('click', function (e) {
            e.preventDefault();
            const id = e.target.getAttribute('dataId');
            removeDirection(recipeId, id)
        })

    })

    // Edit Direction Button


    const editDirection = async (id) => {
        let recipes = await loadRecipes()
        let arr = recItem.directions;
        let stepItem = arr.find(direction => direction.id === id)
        let text = stepItem.text
        openDirectionsDialogue(id)
        const textBox = document.getElementById("enter-next-step");
        textBox.value = text;
        textBox.addEventListener('input', function (e) {
            let recipeId = location.hash.substring(1);
            let recItem = recipes.find((recipe) => recipe.id === recipeId)
            let arr = recItem.directions;
            let stepItem = arr.find(direction => direction.id === id)
            stepItem.text = e.target.value
            saveRecipes(recipes)
        })
    }

    const editDirectionButtons = document.querySelectorAll('.directions a.edit-item');
    editDirectionButtons.forEach(pencil => {
        pencil.addEventListener('click', function (e) {
            e.preventDefault();
            const id = e.target.getAttribute('dataId');
            editDirection(id)
        })

    })



    const recipeCategories = document.createElement('label')
    recipeCategories.innerHTML = '<div>Categories</div><textarea id="recipe-categories"  placeholder="pastry, dinner, vegan"></textarea>'
    section1.appendChild(recipeCategories)
    document.getElementById('recipe-categories').value = recItem.categories
    section1.appendChild(recipeCategories)
    const featureImageFieldset = document.createElement('fieldset')
    const featureKeywordText = document.createElement('legend')
    const div = document.createElement('div')

    const featureImageButton = document.createElement('button')
    const featureImageButtonIcon = document.createElement('i');
    const featureImageButtonSpan = document.createElement('span');

    featureImageButtonIcon.classList.add('fa,fa-solid,fa-magnifying-glass')

    featureImageButton.appendChild(featureImageButtonIcon)
    featureImageButtonSpan.classList.add('hide-text')
    featureImageButtonSpan.textContent = "Search"
    featureImageButton.classList.add('feature-image')
    featureImageButton.setAttribute('id', 'feature-image-button')

    const selectImages = document.createElement('dialog')
    selectImages.setAttribute('id', 'select-images')
    featureKeywordText.textContent = "Feature Image";
    featureImageFieldset.classList.add('feature-image');

    const featureKeyword = document.createElement("input")
    featureKeyword.setAttribute('id', 'feature-keyword')
    featureKeyword.setAttribute('placeholder', 'Search for a photo')
    featureKeyword.value = recItem.name
    featureImageFieldset.appendChild(featureKeywordText)
    featureImageFieldset.appendChild(featureKeyword)

    featureImageFieldset.appendChild(featureImageButton)
    const storedImage = recItem.photoURL;

    const imagePreview = document.createElement('figure');
    imagePreview.classList.add('image-preview');
    const image = document.createElement('img');
    image.setAttribute('src', storedImage);
    const figcaption = document.createElement('figcaption')
    figcaption.innerHTML = `Unsplash photo by <a href="${recItem.photographerLink}">${recItem.photographer}</a>`
    imagePreview.appendChild(image);
    imagePreview.appendChild(figcaption);
    image.setAttribute('style', 'width:200px;aspect-ratio:16/9');
    section1.appendChild(featureImageFieldset)
    section1.appendChild(selectImages)
    featureImageFieldset.appendChild(imagePreview)


    const recipeContainer = document.querySelector('#recipe ul.recipe')
    const ingredientsContainer = document.getElementById('ingredients');
    ingredientsContainer.classList.add('edit-ingredients')

    recipeContainer.innerHTML = ''
    let n = 0;
    recItem.ingredients.forEach(ingred => {
        n++
        let iUUID = ingred.id
        if (iUUID === undefined) {
            ingred.id = uuidv4();
            saveRecipes(recipes)
            let iUUID = ingred.id
        }
        let iName = ingred.name;
        let iDescription = ingred.description
        let iAmount = ingred.amount
        let iMeasureWord = ingred.measureWord
        let iUnit = ingred.unit;
        iMeasureWord !== "" ? iUnit = iMeasureWord : iUnit = ingred.unit

        const subtitle = document.querySelector('.header__subtitle');
        subtitle.textContent = recItem.name;

        const recipeIngredients = document.createElement('li');
        recipeIngredients.innerHTML = `<label ><a class="edit-item" href="#" data="${iUUID}"><span data="${iUUID}">${iAmount} ${iUnit} ${iName} </span><i class="fa fa-pencil" area-hidden="true"  data="${iUUID}" ></i><span class="hide-text">Edit</span></a></label>
     <a href="#" class="remove" data="${iUUID}">Remove<span  data="${iUUID}">X</span></a>`

        recipeContainer.appendChild(recipeIngredients)
    })

    recipes = loadRecipes()
    recipeName.addEventListener('input', (e) => {
        document.querySelector('.header__subtitle').textContent = e.target.value
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
    // recipeDirections.addEventListener('input', (e) => {
    //     updateRecipe(recipeId, {
    //         directions: e.target.value
    //     })
    // })
    recipeCategories.addEventListener('input', (e) => {
        let categories = e.target.value
        // categories === "" ? categories = 'food':categories
        let f = categories.split("");
        let val;
        if (f.includes(",")) {
            let array = categories.split(',')
            console.log(array)
            val = array


        } else if (!f.includes(',')) {
            let array = categories.split()
            console.log(array)
            val = array
        }
        updateRecipe(recipeId, {
            categories: val
        })
    })
    document.getElementById('feature-image-button').addEventListener('click', function (e) {
        // fire off image selection carousel
        const overlay = document.querySelector('.overlay')
        overlay.classList.contains('show') ? overlay.classList.remove('show') : overlay.classList.add('show');
        let pageNumber = 1;
        let keyword = document.getElementById('feature-keyword').value;
        keyword === '' ? keyword = 'pie' : keyword = keyword
        renderImageSelector(keyword, pageNumber)

    })


    const removeIngredient = async (id) => {
        let recipes = await loadRecipes()
        let rec = recipes.find((recipe) => recipe.id === recipeId)
        let arr = rec.ingredients;
        let item = arr.find(ingredient => ingredient.id === id)
        let itemNum = (arr.indexOf(item))
        // alert(itemNum)


        //  const removerIng = () => {
        if (itemNum === 0) {
            //    alert('shift')
            arr.shift()
        } else if ((itemNum + 1) === arr.length) {
            // alert('pop')
            arr.pop()
        } else {
            //  alert('splice')
            arr.splice(itemNum, 1)
        }
        // console.log(rec)
        saveRecipes(recipes)
        initEdit(recipeId)

    }

    const remove = document.querySelectorAll('.recipe li a.remove');
    remove.forEach(x => {
        x.addEventListener('click', function (e) {

            e.preventDefault();
            let id = e.target.getAttribute('data');
            removeIngredient(id)
        }, {
            once: true
        });

    })



    const edit = document.querySelectorAll('.recipe li a.edit-item');
    console.log(edit)
    edit.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            let ingredientId = e.target.getAttribute('data')
            let item = recItem.ingredients.find((ingredient) => ingredient.id === ingredientId)
            // alert('boogie')
            editIngredient(item)
        })
    })
    const editIngredient = async (i) => {

        const overlay = document.querySelector('.overlay')
        overlay.classList.add('show')
        const modal = document.createElement('dialog');
        modal.classList.add('ingredient-modal')
        const modalInner = `<ul id="ingredient${n}">
        <li><label><div>Name:</div> <input dataId="${i.id}" id="name" value="${i.name}" /></label></li>
        <li><label><div>Description:</div> <input id="description" dataId="${i.id}" value="${i.description}" /></label></li>
        <li><label><div>Amount:</div> <input id="amount" dataId="${i.id}" value="${i.amount}" /></label></li>
        <li><label><div>Unit:</div> <input id="unit" dataId="${i.id}"  value="${i.unit}" /></label></li>
        <li><label><div>Measure Word (Optional):</div> <input id="measureWord" placeholder="i.e. a splash, a pinch, a dollop" dataId="${i.id}" value="${i.measureWord}" /></label></li>
        
        <div class="button__footer">

        <button class="close-ingredient-modal" id="close-ingredient-modal">Close</button>
        </div>
        </ul>`;


        const pageContainer = document.querySelector('.page-container')
        pageContainer.appendChild(modal)
        modal.innerHTML = modalInner;


        document.getElementById('close-ingredient-modal').addEventListener('click', function () {


            const overlay = document.querySelector('.overlay');
            overlay.classList.remove('show');
            modal.remove();
            initEdit(recipeId)
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
        })

    }




    const addAnIngredient = document.getElementById("add-an-ingredient");

    addAnIngredient.addEventListener('click', async function (e) {
        e.preventDefault();
        const hasDialog = document.querySelectorAll('.ingredient-modal');
        
        if(hasDialog && hasDialog.length > 0){
            return
        }
        // console.log(`number of dialogs open = ${hasDialog.length}`)

       
        let recipeId = location.hash.substring(1);
        recipes = await loadRecipes()
        let recItem = recipes.find((recipe) => recipe.id === recipeId)


        let newIngredient = {
            name: "New Ingredient",
            description: "",
            amount: "",
            unit: "",
            measureWord: "",
            alternatives: [],
            id: uuidv4()
        }
        //  let recipes = await loadRecipes();
        let uuid = newIngredient.id
        //   alert('pushing');
        recItem.ingredients.push(newIngredient)
        const updateIt = recipes.find((recipe) => {
            if (recipe.id === recItem.id) {
                let thisItem = recItem.ingredients.find(ingredient => ingredient.id === uuid)
                // alert(thisItem.name)
                editIngredient(thisItem)
                //recipe.ingredients.push(newIngredient)
                saveRecipes(recipes)
            }
        })
        //saveItems(recipes)
        console.log('something')
        //  return
    }, {
        once: true
    })


    // keep this listener at the bottom


}

initEdit(recipeId)
hamburger()


const removeRecipeButton = document.getElementById('remove-recipe');
removeRecipeButton.addEventListener('click', function (e) {

    let text = "Do you want to delete this recipe?";
    if (confirm(text) == true) {
        removeRecipe(recipeId);
        const recipeId = location.hash.substring(1);
    } else {
        return
    }

})