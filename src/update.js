import {
    loadRecipes,
    saveRecipes,
    getTimestamp,
    loadRecipesFromLocalStorage
} from './functions.js'

let recipes = await loadRecipesFromLocalStorage()
const updateRecipe = async function(id, update) {
    let recipes = await loadRecipesFromLocalStorage()


    const note = recipes.find((recipe) => recipe.id === id)


    if (!note) {
        return
    }

    if (typeof update.name === 'string') {

        note.name = update.name
        note.updatedAt = getTimestamp()
    }

    if (typeof update.description === 'string') {

        note.description = update.description
        note.updatedAt = getTimestamp()
    }
    if (typeof update.article === 'string') {
        note.article = update.article
        note.updatedAt = getTimestamp()
    }
    if (typeof update.author === 'string') {
        note.author = update.author
        note.updatedAt = getTimestamp()
    }
    if (typeof update.directions === 'string') {
        note.directions = update.directions
        note.updatedAt = getTimestamp()
    }
    if (typeof update.categories === 'object') {
        note.categories = update.categories
        note.updatedAt = getTimestamp()
    }

    saveRecipes(recipes)
    return note

}

const updateIngredient = async (recipeId, ingredientId, id, val) => {

    let recipes = await loadRecipesFromLocalStorage()

    const note = recipes.find((recipe) => recipe.id === recipeId)

    if (!note) {
        return
    }

    const ingredient = note.ingredients.find((ingredient) => ingredient.id === ingredientId);

    if (!ingredient) {
        return
    }
    if (typeof val.name === 'string') {
        ingredient.name = val.name
        note.updatedAt = getTimestamp()
    }
    if (typeof val.description === 'string') {
        ingredient.description = val.description
        note.updatedAt = getTimestamp()
    }
    if (typeof val.amount === 'string') {
        ingredient.amount = val.amount
        note.updatedAt = getTimestamp()
    }
    if (typeof val.unit === 'string') {
        ingredient.unit = val.unit
        note.updatedAt = getTimestamp()
    }
    if (typeof val.measureWord === 'string') {
        ingredient.measureWord = val.measureWord
        note.updatedAt = getTimestamp()
    }
    console.log('recipes...')
    console.log(ingredient)
    console.log(note)
    saveRecipes(recipes)
    // return note
}
export {
    updateRecipe,
    updateIngredient
}