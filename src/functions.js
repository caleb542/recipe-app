import moment from 'moment'
import {
    stringify,
    v4 as uuidv4
} from 'uuid';
import * as Realm from "realm-web";
import {
    getImageGroup
} from './unsplash';

const getTimestamp = () => {
    let timestamp = moment()
    let timestampValueOf = timestamp.valueOf()
    let timestampLong = timestamp.format('MMM Do, YYYY HH:mm')
    let timestampShort = timestamp.format('MMM Do, YYYY HH:mm')
    return timestampShort
}

const addIngredients = () => {
    const addIngredientsButton = document.querySelectorAll('.addIngredient');
    addIngredients.forEach(button => {
        button.addEventListener('click', function () {
            console.log(newRecipe)
            newRecipe.ingredients.push({
                name: "",
                description: "",
                amount: "",
                unit: "",
                measureWord: "",
                alternatives: [],
                id: `${uuidv4()}`
            })
            saveNewRecipeToLocalStorage(newRecipe)

            newRecipe = loadNewRecipeFromLocalStorage()
            createForm(newRecipe)
            //const elem = document.querySelector('.ingredient');
            // const clone = elem.cloneNode(true);
            // document.querySelector('#group2').appendChild(clone)
            //  elem.after(clone)
        })
    })
}

const loadRecipes = () => {

    if (localStorage.getItem('recipes')) {
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

    if (localStorage.getItem('newRecipe')) {
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

const getRecipesFromDatabase = async () => {
    // put this in a backebd-connect statement
    const APP_ID = 'data-puyvo'
    const app = new Realm.App({
        id: APP_ID
    });
    const credentials = Realm.Credentials.anonymous();

    let recs;
    try {
        // checkin with credentials
        const user = await app.logIn(credentials);
        //pull all the recipes from the database with custom serverside function
        recs = await user.functions.getAllRecipes();

        return recs;

    } catch (error) {
        console.error("Failed to log in", error);
    }

}
const sendRecipes = async () => {
    const APP_ID = 'data-puyvo'
    const app = new Realm.App({
        id: APP_ID
    });
    const credentials = Realm.Credentials.anonymous();
    let recipes = loadRecipes()


    const user = await app.logIn(credentials);
    const recsd = await user.functions.updateAllRecipes(recipes);

}

const addToExistingRecipes = () => {
    const newRecipe = loadNewRecipeFromLocalStorage()
    let recipes = loadRecipes()
    const time = getTimestamp()
    newRecipe.createdAt = time
    newRecipe.id = uuidv4()
    console.log(recipes)
    console.log("*************************combining*********************")
    recipes = [...recipes, newRecipe]
    console.log("`````````````````````````````````````````````")
    console.log(recipes)
    console.log(newRecipe)
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
    saveRecipes(recipes)


}
const renderImageSelector = (keyword, pageNumber) => {
    let responseLength
    let images;
    getImageGroup(keyword, pageNumber)
        .then(response => {
            responseLength = response.length;
            console.log(responseLength)
            const selectImages = document.getElementById("select-images")
            selectImages.innerHTML = ''
            const imageShow = document.createElement('ul')
            imageShow.classList.add('image-show');
            response.forEach(imageObject => {

                const li = document.createElement('li')
                const imgAnchor = document.createElement('a')
                imgAnchor.classList.add('imageListItem')
                imgAnchor.setAttribute('href','#')
                const fig = document.createElement('figure')
                const img = document.createElement('img')
                img.setAttribute('src', `${imageObject.urls.thumb}`)
                img.setAttribute('dataURL', `${imageObject.urls.regular}`)
                img.setAttribute('dataName', `${imageObject.user.name}`)
                img.setAttribute('dataLink', `${imageObject.user.links.html}`)
                const caption = document.createElement('figcaption')
                caption.innerHTML = `<a href="${imageObject.user.links.html}">${imageObject.user.name}</a>`

                fig.appendChild(imgAnchor);
                fig.appendChild(caption);
                imgAnchor.appendChild(img)
                li.appendChild(fig)
                imageShow.appendChild(li);


                document.getElementById('select-images').appendChild(imageShow);
               

                images = document.querySelectorAll('.imageListItem');
                

            })
            let recipes = loadRecipes()
            //   alert(e.target.getAttribute('dataName'))
            let recipeId = location.hash.substring(1) 
            let recItem = recipes.find((recipe) => recipe.id === recipeId)
            

            images.forEach(image => {
                image.addEventListener('click', function(e){
                 e.preventDefault()
                 recItem.photographer = e.target.getAttribute('dataName')
                 recItem.photographerLink = e.target.getAttribute('dataLink')
                 recItem.photoURL = e.target.getAttribute('dataURL') 
                 console.log(recItem)
                 saveRecipes(recipes)  
                })
            })
            const imageButtons = document.createElement('div');
            imageButtons.classList.add('image-buttons')
            imageButtons.innerHTML = `
            <button class="btn prev"><<<span class="hide-text">previous image</span></button>
            <button class="btn next">>><span class="hide-text">next image</span></button> 
            <p class="count"></p>`
            const prev = document.createElement('button')
            const next = document.createElement('button')

            prev.setAttribute('id', 'prev-page');
            next.setAttribute('id', 'next-page');
            prev.textContent = "Previous group";
            next.textContent = "Next Group";
            document.getElementById('select-images').appendChild(imageButtons);
            document.getElementById('select-images').appendChild(prev);
            document.getElementById('select-images').appendChild(next);

            const pagedown = document.getElementById('prev-page')
            const pageup = document.getElementById('next-page')
            /*
            3333333333333333333
            */
            const slider = document.querySelector('.image-show')
            let position = 0;
            let transform = 0;
            const decrementSlider = () => {
                position++;
                slider.style.transform = `translateX(${transform-=200}px)`
            }
            const incrementSlider = () => {
                position--;
                slider.style.transform = `translateX(${transform+=200}px)`
            }


            const previmage = document.querySelector('.prev');
            const nextimage = document.querySelector('.next');

            const total = responseLength;
            let slideNum = 1;
            let info;
            let count = document.querySelector('.count')
            previmage.addEventListener('click', function () {
                if (slideNum !== 1) {


                    slideNum -= 1;
                    info = `Viewing image ${slideNum}/${total}`;
                    count.textContent = info;
                    incrementSlider()
                }
            })
            nextimage.addEventListener('click', function () {

                if (slideNum !== responseLength) {

                    slideNum += 1;
                    info = `Viewing image ${slideNum}/${total}`;
                    count.textContent = info;
                    decrementSlider()
                }
            })



            /*--------------*/
            pagedown.addEventListener('click', function (e) {
                e.preventDefault()
                if (pageNumber === 0) {
                    // this.setAttribute(disabled, true)

                } else {

                    pageNumber -= 1
                    renderImageSelector(pageNumber)
                    console.log(`page number ${pageNumber}`)
                }
            })
            pageup.addEventListener('click', function (e) {
                e.preventDefault()
                if (pageNumber >= responseLength) {
                    //    this.setAttribute(disabled, true)
                    console.error("something")
                } else {
                    pageNumber += 1
                    renderImageSelector(pageNumber)
                    console.log(`*page number ${pageNumber}`)
                }
            })
           
        })
}

export {
    getRecipesFromDatabase,
    addIngredients,
    loadRecipes,
    saveRecipes,
    getTimestamp,
    loadNewRecipeFromLocalStorage,
    saveNewRecipeToLocalStorage,
    addToExistingRecipes,
    renderImageSelector
}