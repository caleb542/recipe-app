import moment from 'moment'
import {
    stringify,
    v4 as uuidv4
} from 'uuid';
import * as Realm from "realm-web";
import {
    getImageGroup
} from './unsplash';


const convertTimestamp = (rDate) => {
    if (typeof rDate === 'object'){
        // do nothing
    } else if (typeof rDate === 'string'){
        const format_unix = moment(rDate, 'MMM Do, YYYY HH:mm').unix();
        return format_unix
    } 
}

const getTimestamp = () => {
    let timestamp = moment()
    let timestampValueOf = timestamp.valueOf()
    let timestampLong = timestamp.format('MMM Do, YYYY HH:mm')
    let timestampShort = timestamp.format('MMM Do, YYYY HH:mm')
    let unixTimestamp = moment(timestampShort, 'MMM Do, YYYY HH:mm').unix();
    return [timestampShort, unixTimestamp]
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


// Sort your notes by one of three ways


const sortRecipes = function (sortBy, recipes) {
    if (sortBy === 'byEdited') {

        return recipes.sort(function (a, b) {

            if (a.updatedAt[1] > b.updatedAt[1]) {
                return -1
            } else if (a.updatedAt[1] < b.updatedAt[1]) {
                return 1
            } else {
                return 0
            }
        })
    } else if (sortBy === 'byCreated') {

        return recipes.sort(function (a, b) {
            if (a.createdAt[1] > b.createdAt[1]) {
                return -1
            } else if (a.createdAt[1] < b.createdAt[1]) {
                return 1
            } else {
                return 0
            }
        })
    } else if (sortBy === 'alphabetical') {

        return recipes.sort(function (a, b) {
            if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1
            } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1
            } else {
                return 0
            }
        })
    } else {
        return recipes
    }
}

const  loadRecipes = async() => {
   
    let recs;
    if (localStorage.getItem('recipes')) {
    
      console.log('getting from local storage')
        const recipesJSON = localStorage.getItem('recipes')
        try {

            recipesJSON ? console.log(JSON.parse(recipesJSON)) : console.log('NOJSON')

            return recipesJSON ? JSON.parse(recipesJSON) : console.log('NOJSON')
        } catch (e) {
           
            return []
        }
    } else{
        console.error("fetching from database")
        return await getRecipesFromDatabase()
       
       
    }

        
       
}

const loadRecipesFromLocalStorage = () => {

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
const hamburger = () => {
    const hamburger = document.getElementById('menu-toggle');

        hamburger.addEventListener('click', function(e){

            e.preventDefault() 
            toggleMenu();  
    })
  
} 
const toggleMenu = () => {
    let toggle = document.getElementById('menu-toggle')
    let menu = document.querySelector('nav');
    let status = toggle.getAttribute('aria-label');
    let nav = document.querySelector('nav');

    if(status.toLowerCase() === 'open the menu'){
        toggle.setAttribute('aria-label','close the menu');
        nav.classList.remove('hide')
        nav.classList.add('open')
        nav.setAttribute('aria-expanded','true')
        const a = document.querySelectorAll('nav a')
        a.forEach(anchor => {
            let tabindex = anchor.getAttribute('tabindex')
            tabindex === "-1" ? anchor.setAttribute('tabindex',"0") : anchor.setAttribute('tabindex',"-1")        
        })
       
    }
    if(status.toLowerCase() === 'close the menu'){
        toggle.setAttribute('aria-label','Open the menu');
        nav.classList.add('hide')
        nav.classList.remove('open')
        nav.setAttribute('aria-expanded',false)
        const a = document.querySelectorAll('nav a')
        a.forEach(anchor => {
            let tabindex = anchor.getAttribute('tabindex')
            tabindex === "0" ? anchor.setAttribute('tabindex',"-1") : anchor.setAttribute('tabindex',"0")        
        })
    }
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

let recipes = await loadRecipes()
   
const renderImageSelector = (keyword, pageNumber) => {
    let responseLength
    let images;
    getImageGroup(keyword, pageNumber)
        .then(response => {
            responseLength = response.length;
            console.log(responseLength)
            const selectImages = document.getElementById("select-images")
            selectImages.classList.add('show')
            selectImages.innerHTML = ''
            const imageViewport = document.createElement('div')
            imageViewport.classList.add('image-viewport')
            const imageShow = document.createElement('ul')
            imageShow.classList.add('image-show');
            response.forEach(imageObject => {

                const li = document.createElement('li')
                // const imgAnchor = document.createElement('a')
                // imgAnchor.setAttribute('dataURL', `${imageObject.urls.regular}`)
                // imgAnchor.setAttribute('dataName', `${imageObject.user.name}`)
                // imgAnchor.setAttribute('dataLink', `${imageObject.user.links.html}`)
                // imgAnchor.classList.add('imageListItem')
                // imgAnchor.setAttribute('href','#')
                const fig = document.createElement('figure')
                const img = document.createElement('img')
                img.setAttribute('src', `${imageObject.urls.thumb}`)
                img.setAttribute('dataURL', `${imageObject.urls.regular}`)
                img.setAttribute('dataName', `${imageObject.user.name}`)
                img.setAttribute('dataLink', `${imageObject.user.links.html}`)
                const caption = document.createElement('figcaption')
                caption.innerHTML = `<p>${imageObject.user.name}</p>`

                // fig.appendChild(imgAnchor);
                
                fig.appendChild(img)
                li.appendChild(fig)
                fig.appendChild(caption);
                imageViewport.appendChild(imageShow)
                imageShow.appendChild(li);


                document.getElementById('select-images').appendChild(imageViewport);
               

                images = document.querySelectorAll('.imageListItem');

            })

            let recItem = async () => {
                let recipes = await loadRecipes()
                let recipeId = location.hash.substring(1)
                recItem = recipes.find((recipe) => recipe.id === recipeId)
                return recItem
            }
           
            //   alert(e.target.getAttribute('dataName'))
            
     
            
           
           
            const imageButtons = document.createElement('div');
            imageButtons.classList.add('image-buttons')
            imageButtons.innerHTML = `
            <button disabled class="btn prev"><<<span class="hide-text">previous image</span></button>
            <button class="btn next">>><span class="hide-text">next image</span></button>`
            const imageCount = document.createElement('p')
            imageCount.classList.add('count')
            imageCount.textContent = 'Viewing image 1'
            const prev = document.createElement('button')
            const next = document.createElement('button')

            prev.setAttribute('id', 'prev-page');
            next.setAttribute('id', 'next-page');
            prev.textContent = "Previous group";
            next.textContent = "Next Group";
            const selectImagesModal = document.getElementById('select-images')
            selectImagesModal.appendChild(imageButtons);
            selectImagesModal.appendChild(prev);
            selectImagesModal.appendChild(next);
            selectImagesModal.appendChild(imageCount);
            
            const selectImage = document.createElement('button')
            selectImage.setAttribute('id','select-image')
            selectImage.textContent = 'Select this image';
            selectImagesModal.appendChild(selectImage);

            const closeImageModal = document.createElement('button')
            closeImageModal.classList.add('close-image-modal')
            closeImageModal.innerHTML = `<span class="hide-text">Close Modal</span><i class="fa fas-solid fa-times"></i>`
            selectImagesModal.appendChild(closeImageModal)


            const pagedown = document.getElementById('prev-page')
            const pageup = document.getElementById('next-page')
            /*
            3333333333333333333
            */
            const slider = document.querySelector('.image-show')
            let images =  document.querySelectorAll('#select-images img')
            
            let position = 0;
            let transform = 0;
            const decrementSlider = () => {
                position++;
                slider.style.transform = `translateX(${transform-=20}rem)`
            }
            const incrementSlider = () => {
                position--;
                slider.style.transform = `translateX(${transform+=20}rem)`
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

                slideNum === 1 ? previmage.disabled = true : previmage.disabled=false
                slideNum === responseLength ? nextimage.disabled = true : nextimage.disabled = false
            })
            nextimage.addEventListener('click', function () {

                if (slideNum !== responseLength) {

                    slideNum += 1;
                    info = `Viewing image ${slideNum}/${total}`;
                    count.textContent = info;
                    decrementSlider()
                }

                slideNum === 1 ? previmage.disabled = true : previmage.disabled=false
                slideNum === responseLength ? nextimage.disabled = true : nextimage.disabled = false
            })

            slideNum === 1 ? previmage.disabled = true : previmage.disabled=false
            slideNum === responseLength ? nextimage.disabled = true : nextimage.disabled = false

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

            selectImage.addEventListener('click', async function(e){
                 e.preventDefault()
                const selected = images[slideNum - 1];
              
                 let recipeId = location.hash.substring(1);
                 recipes = await loadRecipes()
                 recItem = recItem = recipes.find((recipe) => recipe.id === recipeId)

                 recItem.photographer = selected.getAttribute('dataName')
                 recItem.photographerLink = selected.getAttribute('dataLink')
                 recItem.photoURL = selected.getAttribute('dataURL')
                 recItem.updatedAt = getTimestamp();
             
                 saveRecipes(recipes)
                 document.querySelector('.image-preview img').setAttribute('src',recItem.photoURL);
                 document.querySelector('.image-preview figcaption').innerHTML = `Unsplash photo by <a href="${recItem.photographerLink}">${recItem.photographer}</a>`;
                })
            
            // const chooseImage = document.querySelectorAll(".imageListItem");
            // chooseImage.forEach(imageAnchor => {
            //     imageAnchor.addEventListener('keypress', function(e){
            //         setAttribute(dataurl)
            //     })
            // })
            const closeModal = document.querySelector('.close-image-modal')
            closeModal.addEventListener('click', function (e) {
                e.preventDefault()
                document.querySelector('.overlay').classList.remove('show')
                const modal = document.getElementById('select-images')
                modal.classList.remove('show');
            })
           
        })
}

const removeRecipe = async (recipeId) => {
    let recipes =  loadRecipesFromLocalStorage()
    let rec = recipes.find((recipe) => recipe.id === recipeId)
    
    let recNum = (recipes.indexOf(rec))
   
    const removerRec = () => {
        if(recNum === 0){
            alert('shift')
            recipes.shift()
        }else if((recNum+1) === recipes.length){
            alert('pop')
            recipes.pop()
        }else {
            alert('splice')
            recipes.splice(recNum, 1)
        }
       
        saveRecipes(recipes)
        window.location.href = "/"

    }
   removerRec()
}
export {
    removeRecipe,
    getRecipesFromDatabase,
    addIngredients,
    addToExistingRecipes,
    sortRecipes,
    loadRecipes,
    saveRecipes,
    getTimestamp,
    loadRecipesFromLocalStorage,
    loadNewRecipeFromLocalStorage,
    saveNewRecipeToLocalStorage,
    renderImageSelector,
    toggleMenu,
    hamburger,
    convertTimestamp
}