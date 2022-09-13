import "./style.scss";
import {stringify, v4 as uuidv4} from 'uuid';
import { createApi } from 'unsplash-js'

import { unsplashme } from "./unsplash";
import { initEdit } from "../../notes-app/src/views";
import { loadRecipes, getTimestamp, saveRecipes } from './functions'
import * as Realm from "realm-web";

  
  
    // put this in a backebd-connect statement
    const APP_ID = 'data-puyvo'
    const app = new Realm.App({ id: APP_ID });
    const credentials = Realm.Credentials.anonymous();

  let recs;
  try {
    // checkin with credentials
    const user = await app.logIn(credentials);
    //pull all the recipes from the database with custom serverside function
     recs = await user.functions.getAllRecipes();


  }
  catch (error){
    console.error("Failed to log in", error);
  }
  
  
const  sendRecipes = async () => {
    const APP_ID = 'data-puyvo'
    const app = new Realm.App({ id: APP_ID });
    const credentials =  Realm.Credentials.anonymous();
    let recipes = loadRecipes()
   
   
    const user = await app.logIn(credentials);
    const recsd = await user.functions.updateAllRecipes(recipes);

  }
  sendRecipes()
  /*
 const getRec = (recs) => {
    
  {recs && recs.map(recipe => {
    let message = "Source: Mongo Database"
    let name = recipe.name
    let description = recipe.description
    let recipeID = recipe.id;
    let photoURL = recipe.photoURL;
    photoURL === '' ? photoURL = '/images/image_not_provided.jpg': photoURL = photoURL
    let recipeDOM = '<p>' + message + '</p><a href="article.html#'+ recipeID +'"><article><div class="imageElement" style="background-image:url(' + photoURL + ')")" /><p class="creator"></p></div><div class="text-area"><h1>'+ name +'</h1><p>'+ description +'</p></div></article></a>'
   
    let card = document.createElement('div')
        card.classList.add('card')

        card.innerHTML = recipeDOM

    const list = document.getElementById('recipes')
    list.appendChild(card)
  })}
 }
 */

 
// getRec(recs)


let newRecipes = recs


//    let newRecipes = [{
//         name:'Brown Bread',
//         photoURL:'',
//         createdAt: getTimestamp(),
//         updatedAt: getTimestamp(),
//         author:'',
//         description: 'This hearty loaf of bread is a staple of the ages. ',
//         categories:['Bread','brown+bread','bakery'],
//         article:"<p>This was my favorite bread growing up.  I used to sit beside the wood stove, warming my bones, waiting for Mom to take that bread out of the oven.</p><p>Served fresh out of the oven, with butter and honey.  There is no better life.</p>",
//         directions:'',
//         tags:['bread'],
//         id:'',
//         ingredients:[{
//             name:'flour',
//             description:'',
//             createdAt: getTimestamp(),
//             updatedAt: getTimestamp(),
//             amount: 3,
//             unit:'cups',
//             measureWord:'',
//             alternatives:[]
//             },
//             {
//                 name:'yeast',
//                 description:'',
//                 amount: 3,
//                 unit:'tablespoons',
//                 measureWord:'',
//                 alternatives:[]
//             }, 
//             {
//                 name:'fancy molasses',
//                 description:'',
//                 amount:1,
//                 unit:'teaspoons',
//                 measureWord:'',
//                 alternatives:[]
//             },
//             {
//                 name:'vegetable oil',
//                 description:'',
//                 amount:3,
//                 unit:'tablespoons',
//                 measureWord:'',
//                 alternatives:['canola oil','sunflower oil']
//             },{
//                 name:'water',
//                 description:'',
//                 amount:1.5,
//                 unit:'cups',
//                 measureWord:'',
//                 alternatives:['canola oil','sunflower oil']
//             },{
//                 name:'cream',
//                 description:'',
//                 amount:1,
//                 unit:'Cup',
//                 measureWord:'Dollop',
//                 alternatives:[]
//             }]
//         },{
//         name:'Lemonade',
//         photoURL:'',
//         createdAt: getTimestamp(),
//         updatedAt: getTimestamp(),
//         author:'',
//         description: 'The classic.',
//         categories:['lemonade'],
//         tags:[],
//         id:'',
//         article:"<p>For many kids this is the first sugary drink of childhood.  A kid's first recipe, first job.  It is said that the creators of McDonalds started with a lemonade stand. </p>",
//         directions:'',
//         ingredients:[
//             {
//                 name:'water',
//                 description:'',
//                 amount: 1,
//                 unit:'cups',
//                 measureWord:'',
//                 alternatives:[]
//             },
//             {
//                 name:'white sugar',
//                 description:'',
//                 amount:1,
//                 unit:'cups',
//                 measureWord:'',
//                 alternatives:[]
//             },
//             {
//                 name:'Lemon',
//                 description:'Juiced',
//                 amount:1,
//                 unit:'',
//                 measureWord:'',
//                 alternatives:[]
//             }]
//         },
//         {
//             name:'Limeade',
//             photoURL:'',
//             createdAt: getTimestamp(),
//             updatedAt: getTimestamp(),
//             author:'',
//             description: 'A twist on a classic summer drink',
//             categories:['limeade'],
//             tags:[],
//             id:'',
//             article:"<p>I first tried limeade at a restaurant where I was employed as a brunch cook.  This version is similar.  Freshly squeezed limes, simple syrup and some basil leaf is enough to take to the level of lemonade and beyond.</p>",
//             directions:'',
//             ingredients:[
//                 {
//                     name:'water',
//                     description:'',
//                     amount: 1,
//                     unit:'cups',
//                     measureWord:'',
//                     alternatives:[]
//                 },
//                 {
//                     name:'white sugar',
//                     description:'',
//                     amount:1,
//                     unit:'cups',
//                     measureWord:'',
//                     alternatives:[]
//                 },
//                 {
//                     name:'Lime',
//                     description:'Juiced',
//                     amount:4,
//                     unit:'',
//                     measureWord:'',
//                     alternatives:[]
//                 },
//                 {
//                     name:'Fresh Basil Leaves',
//                     description:'',
//                     amount:1,
//                     unit:'',
//                     measureWord:'',
//                     alternatives:[]
//                 }]
//             },
//             {
//                 name:'Crepes',
//                 photoURL:'',
//                 createdAt: getTimestamp(),
//                 updatedAt: getTimestamp(),
//                 author:'Caleb Hamilton',
//                 description: 'A delicate french pastry for all occasions',
//                 categories:['crepes'],
//                 tags:[],
//                 id:'',
//                 article:"<p>Who doesn't love a crepe?  Whether you're eating a savoury saute, scrambled eggs or a devilish dessert, crepes are undeniably great comfort food.</p>",
//                 directions:'',
//                 ingredients:[
//                     {
//                         name:'water',
//                         description:'',
//                         amount: 1,
//                         unit:'cups',
//                         measureWord:'',
//                         alternatives:[]
//                     },
//                     {
//                         name:'white sugar',
//                         description:'',
//                         amount:1,
//                         unit:'cups',
//                         alternatives:[]
//                     },
//                     {
//                         name:'Lime',
//                         description:'Juiced',
//                         amount:4,
//                         unit:'',
//                         measureWord:'',
//                         alternatives:[]
//                     },
//                     {
//                         name:'Fresh Basil Leaves',
//                         description:'',
//                         amount:1,
//                         unit:'',
//                         measureWord:'',
//                         alternatives:[]
//                     }]
//                 }
//     ]
    
    for(let i = 0;i < newRecipes.length; i++){
        let randomBread = `https://source.unsplash.com/random/?${newRecipes[i].categories}`
     //   newRecipes[i].id = uuidv4()
        
        newRecipes[i].photoURL = randomBread
    //    console.log(newRecipes)

    }

if(!localStorage.getItem('recipes')){
    
   saveRecipes(newRecipes)
}


const cardIndex = document.querySelector("#recipes");
let list = () => {
    // clear the view first
    cardIndex.innerHTML=''
    let recipes = loadRecipes()
    if(recipes.length > 0 ){
        recipes.forEach(recipe => {

            const imageObject = unsplashme(recipe.categories[0])
            .then( result => {
                let photoURL = result.photoSmallUrl
                let photographer = result.photographer
                let photographerLink = result.photographerLink
                let photoThumb = result.photoThumb
                
                recipe.photoURL = photoURL
                recipe.photographer = photographer
                recipe.photoThumb = photoThumb
                recipe.photographerLink = photographerLink

                saveRecipes(recipes)
                let name = recipe.name
                let description = recipe.description
                let recipeID = recipe.id;

                console.log(recipes)
                // let recip = '<a href="article.html#'+ recipeID +'"><article><div class="imageElement" style="background-image:url(' + photoURL + ')")" /><p class="creator"></p></div><div class="text-area"><h1>'+name+'</h1><p>'+description+'</p></div></article></a><a class="photographer" href="'  + photographerLink + '">Unsplash image by ' + photographer + '</a>'
                // create DOM cards
                let cardAnchor = document.createElement('a');
                cardAnchor.setAttribute('href',`article.html#${recipeID}`);
                let article = document.createElement('article'); 
                let image = document.createElement('div');
                image.classList.add('imageElement');
                image.style.backgroundImage=`url(${photoURL})`;
                let creator = document.createElement('p');
                creator.classList.add('creator')
                let text = document.createElement('div');
                text.classList.add('text-area');
                let recipeName = document.createElement('h1');
                recipeName.textContent = name;
                let recipeDescription = document.createElement('p');
                recipeDescription.textContent = description;
                text.appendChild(recipeName)
                text.appendChild(recipeDescription)
                cardAnchor.classList.add('card')
                cardAnchor.appendChild(article)
                article.appendChild(image)
                article.appendChild(text)
                cardIndex.classList.add('cards')
                cardIndex.appendChild(cardAnchor)

            })
           
         })
    }  else {
        const warning = document.createElement('div');
        warning.classList.add('card')
        warning.innerHTML = '<p>Sorry, there aint any recipes here.  Would you like to <a href="#" >add a recipe</a>?</p>'
        document.querySelector(".cards").appendChild(warning)
    }  
}

list()

window.addEventListener('storage',  (e) =>  {
        if (e.key === 'recipes') {
         
           const newRecipes = loadRecipes()
        
      
   
            let pagename = index            

          updateTextElements(pageName);
    }
})
