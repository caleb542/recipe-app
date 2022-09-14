
import moment from 'moment'

const getTimestamp = () => {
    let timestamp = moment()
    let timestampValueOf = timestamp.valueOf()
    let timestampLong = timestamp.format('MMM Do, YYYY HH:mm')
    let timestampShort = timestamp.format('MMM Do, YYYY HH:mm')
    return timestampShort
}


const loadRecipes = () => {
    
    if(localStorage.getItem('recipes')){
            const recipesJSON = localStorage.getItem('recipes')
        try {
            recipesJSON ? console.log(JSON.parse(recipesJSON)) : []
            return recipesJSON ? JSON.parse(recipesJSON) : []
        } catch (e) {
        return []
        }
    } 
    
    
}
const loadNewRecipeFromLocalStorage = () => {
    
    if(localStorage.getItem('newRecipe')){
            const recipesJSON = localStorage.getItem('newRecipe')
        try {
            recipesJSON ? console.log(JSON.parse(recipesJSON)) : []
            return recipesJSON ? JSON.parse(recipesJSON) : []
        } catch (e) {
        return []
        }
    } 
    
    
}
const saveRecipes = (newRecipes) => {
    localStorage.setItem('recipes', JSON.stringify(newRecipes))

}

const saveNewRecipeToLocalStorage = (newRecipe) => {
    localStorage.setItem('newRecipe', JSON.stringify(newRecipe))

}


const  sendRecipes = async () => {
    const APP_ID = 'data-puyvo'
    const app = new Realm.App({ id: APP_ID });
    const credentials =  Realm.Credentials.anonymous();
    let recipes = loadRecipes()
   
   
    const user = await app.logIn(credentials);
    const recsd = await user.functions.updateAllRecipes(recipes);

  }
 // sendRecipes() this isn't working yet
const loadRecipeForm = (recItem) => {
/*
    const ingredients = recItem.ingredients

    
    ingredients.forEach(ingredient => {
       
        let name = ingredient.name
        let unit = ingredient.unit
        let amount = ingredient.amount
        let measureWord = ''
        ingredient.measureWord ? measureWord = ingredient.measureWord:measureWord=''

        
        let ingredients = document.getElementById('ingredients');
        ingredients.innerHTML=''

        const ingredientName = document.createElement('input');
                ingredientName.setAttribute('id','ingredient-name');

        const ingredientAmount = document.createElement('input')
             ingredientAmount.setAttribute('id','measurement-number');
        const ingredientUnit = document.createElement('input')
            ingredientUnit.setAttribute('id','unit-of-measurement');
        const ingredientWord = document.createElement('input')
            ingredientWord.setAttribute('id','measurement-word')
            ingredientWord.setAttribute('placeholder','a Pinch, a Dollop, a Smidgen, a Dram...')

        ingredientName.value = name
        ingredientAmount.value = amount
        ingredientWord.value = measureWord
        ingredientUnit.value = unit

        const group = document.createElement('div');
        const nameLi = document.createElement('li');
        const nameLabel = document.createElement('label');
        const nameLabelDiv = document.createElement('div');
            nameLabelDiv.textContent="Name"
        const amountLi = document.createElement('li');
        const amountLabel = document.createElement('label');
        const amountLabelDiv = document.createElement('div');
            amountLabelDiv.textContent="Quantity"
        const unitLi = document.createElement('li');       
        const unitLabel = document.createElement('label');
        const unitLabelDiv = document.createElement('div');
            unitLabelDiv.textContent="Unit"
            const measurementLi = document.createElement('li'); 
        const measurementLabel = document.createElement('label');
        const measurementLabelDiv = document.createElement('div');
             measurementLabelDiv.textContent="Other"
           

    
        nameLabel.appendChild(nameLabelDiv)
        nameLabel.innerHTML=''
        nameLabel.appendChild(ingredientName)
        nameLi.appendChild(nameLabel)

        amountLabel.appendChild(amountLabelDiv)
        amountLabel.appendChild(ingredientAmount)
        amountLi.appendChild(amountLabel)

        if(ingredientUnit){
            unitLabel.appendChild(unitLabelDiv)
            unitLabel.appendChild(ingredientUnit)
            unitLi.appendChild(unitLabel)
        }
        if(measurementLabel){
            
            measurementLabel.appendChild(ingredientWord)
            measurementLabel.appendChild(measurementLabelDiv)
            measurementLi.appendChild(measurementLabel)
        }
        measurementLabel ? measurementLabel.appendChild(ingredientWord) : console.log('No measurement word')
        group.classList.add('ingredient')
        ingredients.appendChild(group)
        group.appendChild(nameLi)
        group.appendChild(amountLi)
        group.appendChild(unitLi)
        group.appendChild(measurementLi)
        



    })*/
}

export{ loadRecipes, saveRecipes, getTimestamp, loadRecipeForm, loadNewRecipeFromLocalStorage, saveNewRecipeToLocalStorage}