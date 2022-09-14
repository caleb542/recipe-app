import "./style.scss";
import {stringify, v4 as uuidv4} from 'uuid';
import { createApi } from 'unsplash-js'

import { unsplashme } from "./unsplash";
import { initEdit } from "../../notes-app/src/views";
import { loadNewRecipeFromLocalStorage, saveNewRecipeToLocalStorage, getTimestamp } from './functions'
import * as Realm from "realm-web";

let newRecipe;
if(localStorage.getItem('newRecipe')){
    newRecipe = loadNewRecipeFromLocalStorage()
    // console.log(newRecipe)
} else {
    let newRecipe = {
        name: "",
        photoURL: "",
        photographer: "",
        photographerLink: "",
        createdAt: "",
        updatedAt: "",
        author: "",
        description: "",
        directions:"",
        categories: "",
        article: "",
        id: "",
        ingredients: [{
            name: "",
            description: "",
            amount: "",
            unit: "",
            measureWord: "",
            alternatives: [],
            id: ""
        }]
    }
} 
const name =  document.getElementById('name')
const description = document.getElementById('description')
const article = document.getElementById('article')
const author = document.getElementById('author')
const directions = document.getElementById('directions')

    const createForm = (newRecipe) => { 
        console.log(newRecipe)
        name.value = newRecipe.name;
        description.value = newRecipe.description;
        article.value = newRecipe.article;
        author.value = newRecipe.author;
        directions.value = newRecipe.directions;

        newRecipe.ingredients.forEach(ingred => {
            let dataId;   
            if(ingred.id === ''){ 
                dataId = uuidv4()
                ingred.id = dataId;
                saveNewRecipeToLocalStorage(newRecipe)
            } else{
                dataId = ingred.id
            }

            const ingredient = document.createElement('li');
                ingredient.classList.add('ingredient')
            const button__header = document.createElement('div')
            button__header.classList.add('button__header');
            const removeIngredient = document.createElement('button');
            removeIngredient.textContent = 'remove';
            removeIngredient.classList.add('removeIngredient');
            button__header.appendChild(removeIngredient);

            const group = document.createElement('div');
            group.classList.add('group')

            const iNameLabel = document.createElement('label');
            const iNameDiv = document.createElement('div');
            iNameDiv.textContent = 'Name'
            const iNameInput = document.createElement('input');
            iNameInput.setAttribute('dataId',`name_${dataId}`)
            iNameLabel.appendChild(iNameDiv)
            iNameLabel.appendChild(iNameInput)

            const iDescLabel = document.createElement('label');
            const iDescDiv = document.createElement('div');
            iDescDiv.textContent = 'Description'
            const iDescInput = document.createElement('input');
            iDescInput.setAttribute('dataId',`description_${dataId}`)
            iDescLabel.appendChild(iDescDiv)
            iDescLabel.appendChild(iDescInput)

            const iAmountLabel = document.createElement('label');
            const iAmountDiv = document.createElement('div');
            iAmountDiv.textContent = 'Amount'
            const iAmountInput = document.createElement('input');
            iAmountInput.setAttribute('dataId',`amount_${dataId}`)
            iAmountLabel.appendChild(iAmountDiv)
            iAmountLabel.appendChild(iAmountInput)
            


            const iUnitLabel = document.createElement('label');
            const iUnitDiv = document.createElement('div');
            iUnitDiv.textContent = 'Unit'
            const iUnitInput = document.createElement('input');
            iUnitInput.setAttribute('dataId',`unit_${dataId}`)
            iUnitLabel.appendChild(iUnitDiv)
            iUnitLabel.appendChild(iUnitInput)

            const iMeasureLabel = document.createElement('label');
            const iMeasureDiv = document.createElement('div');
            iMeasureDiv.textContent = 'Alternate Measurement'
            const iMeasureInput = document.createElement('input');
            iMeasureInput.setAttribute('dataId',`measureWord_${dataId}`)
            iMeasureLabel.appendChild(iMeasureDiv)
            iMeasureLabel.appendChild(iMeasureInput) 

            const button__footer = document.createElement('div')
            button__footer.classList.add('button__footer')
            const addIngredient = document.createElement('button')
            addIngredient.textContent = 'Add ingredient';
            addIngredient.classList.add('addIngredient')
            addIngredient.setAttribute('id','addIngredient')
            button__footer.appendChild(addIngredient)

            const group2 = document.getElementById('group2');
            group2.appendChild(ingredient)

            ingredient.appendChild(button__header)
            ingredient.appendChild(group)
            group.appendChild(iNameLabel)
            group.appendChild(iDescLabel)
            group.appendChild(iAmountLabel)
            group.appendChild(iUnitLabel)
            group.appendChild(iMeasureLabel)
            ingredient.appendChild(button__footer)
        })
    }
    
    if(localStorage.getItem('newRecipe')){
        let newRecipe = loadNewRecipeFromLocalStorage(); 
    }else{
        saveNewRecipeToLocalStorage(newRecipe)
    }
   
    createForm(newRecipe)
    const populateFieldsFromStoredData = () => {
        const newRecipe = loadNewRecipeFromLocalStorage();

        let ingredientInputs = document.querySelectorAll('#group2 li .group > label > input')
        ingredientInputs.forEach(input => {
            let dataId = input.getAttribute('dataId')
            let DOMid = dataId.split('_')[1];
            let DOMname = dataId.split('_')[0]

            let ingredient = newRecipe.ingredients.find((ingredient) => ingredient.id === DOMid)
            if(DOMname === "name"){
                input.value = ingredient.name 
            }
            if(DOMname === "description"){
                input.value = ingredient.description 
            }
            if(DOMname === "amount"){
                input.value = ingredient.amount 
            }
            if(DOMname === "unit"){
                input.value = ingredient.unit 
            }
            if(DOMname === "measureWord"){
                input.value = ingredient.measureWord 
            }
            
            

        })
    }
    
populateFieldsFromStoredData()
    


//  LISTEN CHANGES IN THE TOP LEVEL FIELDS  name,description,article,author -- store form information to
    name.addEventListener('input', function(e){
        newRecipe.name = e.target.value
        saveNewRecipeToLocalStorage(newRecipe)
    })
    description.addEventListener('input', function(e){
        newRecipe.description = e.target.value
        saveNewRecipeToLocalStorage(newRecipe)
    })
    article.addEventListener('input', function(e){
        newRecipe.article = e.target.value
        saveNewRecipeToLocalStorage(newRecipe)
    })
    author.addEventListener('input', function(e){
        newRecipe.author = e.target.value
        saveNewRecipeToLocalStorage(newRecipe)
    })
    directions.addEventListener('input', function(e){
        newRecipe.directions = e.target.value
        saveNewRecipeToLocalStorage(newRecipe)
    })
// INGREDIENT LISTENERS
//  let recItem = recipes.find((recipe) => recipe.id === recipeId )
   let ingredientInputs = document.querySelectorAll('#group2 li .group > label > input')
   ingredientInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let findRecipeDataId = e.target.getAttribute('dataId')
            let dataId = findRecipeDataId.split('_')[1];
            let findFieldName = findRecipeDataId.split('_')[0]
            console.log(`field: ${findFieldName} id:${dataId}`)
            //update object
            let ingredient = newRecipe.ingredients.find((ingredient) => ingredient.id === dataId)
            if(findFieldName === 'name'){
                ingredient.name = e.target.value
            }
            if(findFieldName === 'description'){
                ingredient.description = e.target.value
            }
            if(findFieldName === 'unit'){
                ingredient.unit = e.target.value
            }
            if(findFieldName === 'amount'){
                ingredient.amount = e.target.value
            }
            if(findFieldName === 'measureWord'){
                ingredient.measureWord = e.target.value
            }
            
            saveNewRecipeToLocalStorage(newRecipe)
        })
   
   })


// BUTTON LISTENERS
    const addIngredients = document.querySelectorAll('.addIngredient');
    addIngredients.forEach(button => {
        button.addEventListener('click', function(){
            console.log(newRecipe)
            newRecipe.ingredients.push(
                {
                    name: "",
                    description: "",
                    amount: "",
                    unit: "",
                    measureWord: "",
                    alternatives: [],
                    id: `${uuidv4()}`
                }
            )
            saveNewRecipeToLocalStorage(newRecipe)

            newRecipe = loadNewRecipeFromLocalStorage()
            createForm(newRecipe)
            //const elem = document.querySelector('.ingredient');
           // const clone = elem.cloneNode(true);
           // document.querySelector('#group2').appendChild(clone)
          //  elem.after(clone)
        })
    })
    