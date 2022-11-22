import "./style.scss";
import {
    getImageGroup
} from './unsplash'
import {
    stringify,
    v4 as uuidv4
} from 'uuid';
import {
    openDirectionsDialogue,
    listDirections,
    editDirection,
    removeDirection,
    removeRecipe,
    loadRecipes,
    saveRecipes,
    loadRecipesFromLocalStorage,
    getTimestamp,
    renderImageSelector,
    toggleMenu,
    hamburger,
    updateRecipeInDatabase,
    listeners
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

if (!location.hash.substring(1)) {
    const title = document.querySelector('.header__title');
    title.textContent = 'New Recipe'
    let subtitleEl = document.createElement('span')
    subtitleEl.classList.add('header__subtitle')
    title.appendChild(subtitleEl)

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

    let recs = await loadRecipes()
    console.log('createedAt')
    console.log(newRecipe)
    console.log(recs)
    console.log("###")
    newRecipe.id = recipeId
    newRecipe.createdAt = createdAt
    console.log(recs.push(newRecipe))

    saveRecipes(recs)



}




const initEdit = async (recipeId) => {
            let recipes = await loadRecipes()
            let recItem = recipes.find((recipe) => recipe.id === recipeId)
            if (!recItem) {
                location.assign('/index.html')
            }
            let section1 = document.querySelector('.section-1')
            // section1.innerHTML=''

            const recipeName = document.getElementById('name')
            recipeName.innerHTML = '<div>Name</div><input id="recipe-name" class="input" type="text" placeholder="Recipe Name" name="text" value="' + recItem.name + '"/>'


            const recipeDescription = document.getElementById('recipe-description')
            recipeDescription.value = recItem.description


            const recipeArticle = document.getElementById('recipe-article')
            recipeArticle.value = recItem.article


            const recipeAuthor = document.getElementById('author')
            recipeAuthor.innerHTML = '<div>Author</div><input id="recipe-author" class="input" type="text" placeholder="Peter Peter pumpkin eater" name="text" value="' + recItem.author + '"/>'

            const directionsHeading = document.getElementById('directions-heading');
            directionsHeading.setAttribute("id", "directions-heading")
            const directionsList = document.querySelector("#directions-heading ol");
            directionsList.setAttribute('id', 'directions-list')
            directionsList.classList.add("directions")

            /* ----- */


            const recipeDirections = recItem.directions

           
            listDirections(recipeDirections)
            const addStepButton = document.getElementById("add-step");



            // directions listeners


            addStepButton.addEventListener('click', async function (e) {

                e.preventDefault()

                let recipeId = location.hash.substring(1);
                recipes = await loadRecipesFromLocalStorage()
                let recItem = recipes.find(recipe => recipe.id === recipeId)
                let newDirections = {
                    id: uuidv4(),
                    text: ""
                }
                recItem.directions.push(newDirections)
                const id = newDirections.id
                const text = newDirections.text
                // e.target.parentNode.classList.add('return-focus')
                saveRecipes(recipes)
                // let focus = {button:".return-focus"}
                // localStorage.setItem("focusState",JSON.stringify(focus))

                let directionDialog = document.querySelectorAll('#add-directions');
                openDirectionsDialogue(id, text)
            })




            // const removeDirectionButtons = document.querySelectorAll('.directions a.remove');
            // removeDirectionButtons.forEach(button => {
            //     button.addEventListener('click', function (e){
            //         e.preventDefault();
            //         let id = e.target.getAttribute('dataId');
            //         id = 
            //         removeDirection(id)
            //     }, {once:true})
            // })



            const editDirectionButtons = document.querySelectorAll('.directions a.edit-item');

            editDirectionButtons.forEach(pencil => {
                pencil.addEventListener('click', function (e) {
                    e.preventDefault();

                    alert('pow!')
                    const id = e.target.getAttribute('dataId');
                    editDirection(id)
                })

            })


            const recipeCategoriesLabel = document.getElementById('categories');
            const recipeCategories = recipeCategoriesLabel.querySelector("textarea");
            const recipeCategoriesName = recipeCategoriesLabel.querySelector("div");


            recipeCategories.value = recItem.categories.join("'")
            recipeCategories.textContent = recItem.categories

            const featureImageFieldset = document.getElementById('image')
            const featureKeywordText = document.querySelector('#image legend')
            const div = featureKeywordText.querySelector('div')

            const featureImageButton = document.getElementById("feature-image-button")
            const featureImageButtonIcon = document.querySelector('#feature-image-button i');



            const selectImages = document.getElementById('select-images')
            featureKeywordText.textContent = "Feature Image";
            featureImageFieldset.classList.add('feature-image');

            const featureKeyword = document.createElement("feature-keyword")
            featureKeyword.value = recItem.name;
            const storedImage = recItem.photoURL;

            const imagePreview = document.querySelector('figure.image-preview');
            const image = imagePreview.querySelector('img');
            image.setAttribute('src', storedImage);
            const figcaption = document.querySelector('figcaption')
            figcaption.innerHTML = `Unsplash photo by <a href="${recItem.photographerLink}">${recItem.photographer}</a>`
            image.setAttribute('style', 'width:200px;aspect-ratio:16/9');
            // section1.appendChild(featureImageFieldset)
            // section1.appendChild(selectImages)
            // featureImageFieldset.appendChild(imagePreview)

            const recipeContainer = document.querySelector('#recipe ul.recipe')
            const ingredientsContainer = document.getElementById('ingredients');
            ingredientsContainer.classList.add('edit-ingredients')
            const listIngredients = async () => {
                const recipeContainer = document.querySelector('#recipe ul.recipe')
                recipeContainer.innerHTML = ''
                recipes = await loadRecipesFromLocalStorage()
                recipeId = location.hash.substring(1);
                recItem = recipes.find(recipe => recipe.id === recipeId)
                recItem.ingredients.forEach(ingred => {

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

                    subtitle.textContent = recItem.namerecipeDescription

                    const recipeIngredients = document.createElement('li');
                    recipeIngredients.innerHTML = `<label ><a class="edit-ingredient" href="edit.html#${recipeId}" data="${iUUID}"><span data="${iUUID}">${iAmount} ${iUnit} ${iName} </span><i class="fa fa-pencil" area-hidden="true"  data="${iUUID}" ></i><span class="hide-text">Edit</span></a></label>
                     <a href="edit.html#${recipeId}" class="remove-ingredient" data="${iUUID}">Remove<span  data="${iUUID}">X</span></a>`

                    recipeContainer.appendChild(recipeIngredients)
                    const editRecipeButtons = document.querySelectorAll('.edit-ingredient');
                    const removeRecipeButton = document.getElementById('remove-recipe');
                    const remove = document.querySelectorAll('a.remove-ingredient');

                    editRecipeButtons.forEach(button => {
                        button.addEventListener('click', function (e) {
                            e.preventDefault();
                            let dialogs = document.querySelector('#ingredient-modal');


                            button.classList.add('return-focus')

                            let ingredientId = e.target.getAttribute('data')
                            let item = recItem.ingredients.find((ingredient) => ingredient.id === ingredientId)
                            // alert('boogie')
                            editIngredient(item)
                        })
                    })


                    removeRecipeButton.addEventListener('click', function (e) {
                        const recipeId = location.hash.substring(1);
                        let text = "DELETE THE RECIPE\nAre You Sure?";
                        if (confirm(text) == true) {

                            removeRecipe(recipeId);
                        } else {
                            return
                        }

                    })

                    remove.forEach(x => {
                        x.addEventListener('click', function (e) {
                            let text = "You Sure?"
                            e.preventDefault();
                            let id = e.target.getAttribute('data');
                            if (confirm(text) == true) {
                                removeIngredient(id)
                            } else {

                            }

                        }, {
                            once: true
                        });

                    })

                })

            }

            listIngredients()


            recipes = await loadRecipes()
            document.getElementById("recipe-name").addEventListener('input', (e) => {

                document.querySelector('.header__subtitle').textContent = e.target.value
                updateRecipe(recipeId, {
                    name: e.target.value
                })
                //dateElement.textContent = generateLastEdited(note.updatedAt)
            })


            // TRY TINY MCE 
            
                tinymce.init({
                    selector: '#recipe-article',  // change this value according to your HTML
                    skin: 'oxide-dark',
                    content_css: 'dark',
                    toolbar: 'undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | link image code',
                    plugins:'link image code',
                    image_list:[
                      
                    ],
                    file_picker_callback: (callback, value, meta) => {
                        // Provide file and text for the link dialog
                        if (meta.filetype == 'file') {
                          callback('mypage.html', { text: 'My text' });
                        }
                    
                        // Provide image and alt text for the image dialog
                        if (meta.filetype == 'image') {
                          callback('myimage.jpg', { alt: 'My alt text' });
                        }
                    
                        // Provide alternative source and posted for the media dialog
                        if (meta.filetype == 'media') {
                          callback('movie.mp4', { source2: 'alt.ogg', poster: 'image.jpg' });
                        }
                      },
                    setup: function(editor) {
                        editor.on('input', function(e) {

                            
                            // alert(editor.value)
                        //   console.log('The Editor has initialized.');
                        let myArticle = editor.getContent()
                        updateRecipe(recipeId, {
                                            article:  myArticle
                                        })
                        });
                      }
                });
               
                tinymce.init({
                    selector: '#recipe-description',  // change this value according to your HTML
                    skin: 'oxide-dark',
                    content_css: 'dark',
                    toolbar: 'undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | link image code',
                    plugins:'link image code',
                    image_list:[
                      
                    ],
                    file_picker_callback: (callback, value, meta) => {
                        // Provide file and text for the link dialog
                        if (meta.filetype == 'file') {
                          callback('mypage.html', { text: 'My text' });
                        }
                    
                        // Provide image and alt text for the image dialog
                        if (meta.filetype == 'image') {
                          callback('myimage.jpg', { alt: 'My alt text' });
                        }
                    
                        // Provide alternative source and posted for the media dialog
                        if (meta.filetype == 'media') {
                          callback('movie.mp4', { source2: 'alt.ogg', poster: 'image.jpg' });
                        }
                      },
                    setup: function(editor) {
                        editor.on('input', function(e) {

                            
                            // alert(editor.value)
                        //   console.log('The Editor has initialized.');
                        let theDescription = editor.getContent()
                        updateRecipe(recipeId, {
                                            description:  theDescription
                                        })
                        });
                      }
                });
            
        // END TINYMCE

        // TRY CKEDITOR
            // const rd = document.querySelector('#recipe-description')
            // const ra = document.querySelector('#recipe-article')
            // let descEditor;
            // let artiEditor;

            // ClassicEditor
            //     .create(document.querySelector('#recipe-description'), {
            //         image: {
            //             toolbar: [ 'toggleImageCaption', 'imageTextAlternative' ]
            //         },
            //         updateSourceElementOnDestroy: true,
            //         cloudServices: {
            //             tokenUrl: 'https://example.com/cs-token-endpoint',
            //             uploadUrl: 'https://your-organization-id.cke-cs.com/easyimage/upload/'
            //         }
            //     })
            //     .then(newEditor => {
            //         descEditor = newEditor;
            //     })
                
            //     .catch(error => {
            //         console.error(error);
            //     });

            // ClassicEditor
            //     .create(document.querySelector('#recipe-article'), {
            //         updateSourceElementOnDestroy: true
            //     })
            //     .then(newEditor => {
            //         artiEditor = newEditor;
            //     })
                
            //     .catch(error => {
            //         console.error(error);
            //     });    

            //         // Assuming there is a <button id="submit">Submit</button> in your application.
                    
            //         //document.querySelector("button[type='submit']")
            //         document.querySelector("button#description-button").addEventListener('click', (evt) => {
            //                     const editorData = descEditor.getData();

            //                         //     editor.on('change', function (evt) {
            //                     //         // getData() returns CKEditor's HTML content.
            //                     //         // console.log( 'Total bytes: ' + evt.editor.getData().length );
            //                             updateRecipe(recipeId, {
            //                                 description: editorData
            //                             })
            //                     //     });
            //         })
            //         document.querySelector("button#article-button").addEventListener('click', (evt) => {
            //             const editorData = artiEditor.getData();

            //                 //     editor.on('change', function (evt) {
            //             //         // getData() returns CKEditor's HTML content.
            //             //         // console.log( 'Total bytes: ' + evt.editor.getData().length );
            //                     updateRecipe(recipeId, {
            //                         article: editorData
            //                     })
            //             //     });
            // })

                        //     editor.on('change', function (evt) {
                                //         // getData() returns CKEditor's HTML content.
                        //         // console.log( 'Total bytes: ' + evt.editor.getData().length );
                        //         updateRecipe(recipeId, {
                        //             article: evt.editor.getData()
                        //         })
                        //     });

                // END CKEDITOR

                        // document.querySelector('#recipe-article').addEventListener('focus', () => {
                        //     const editor = CKEDITOR.replace(recipeArticle, {
                        //         // Configure your file manager integration. This example uses CKFinder 3 for PHP.


                        //     })
                        //     editor.on('change', function (evt) {
                        //         // getData() returns CKEditor's HTML content.
                        //         // console.log( 'Total bytes: ' + evt.editor.getData().length );
                        //         updateRecipe(recipeId, {
                        //             article: evt.editor.getData()
                        //         })
                        //     });
                        // })

                        // document.querySelector('#recipe-description').addEventListener('focus', () => {
                        //     const editorDescription = CKEDITOR.replace( recipeDescription )
                        //     editorDescription.on('change', function( evt ) {

                        //         // getData() returns CKEditor's HTML content.
                        //         // console.log( 'Total bytes: ' + evt.editor.getData().length );

                        //         updateRecipe(recipeId, {
                        //             description:  evt.editor.getData()
                        //         })
                        //     });
                        // })
                        //
                        // ClassicEditor
                        // .create( document.querySelector( '#editor' ) )
                        // .catch( error => {
                        //     console.error( error );
                        // } );




        

                        recipeAuthor.addEventListener('input', (e) => {
                            updateRecipe(recipeId, {
                                author: e.target.value
                            })
                        })


                        document.getElementById('feature-image-button').addEventListener('click', function (e) {
                            // fire off image selection carousel

                            document.getElementById('feature-image-button').classList.add('return-focus')
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
                            listIngredients()

                        }

                        const remove = document.querySelectorAll('.recipe li a.remove');
                        remove.forEach(x => {
                            x.addEventListener('click', function (e) {
                                let text = "You Sure?"
                                e.preventDefault();
                                let id = e.target.getAttribute('data');
                                if (confirm(text) == true) {
                                    removeIngredient(id)
                                } else {

                                }

                            }, {
                                once: true
                            });

                        })



                        const editRecipeButtons = document.querySelectorAll('.recipe li a.edit-item');
                        editRecipeButtons.forEach(button => {
                            button.addEventListener('click', function (e) {
                                alert('click')
                                e.preventDefault();
                                let dialogs = document.querySelector('#ingredient-modal');


                                button.classList.add('return-focus')

                                let ingredientId = e.target.getAttribute('data')
                                let item = recItem.ingredients.find((ingredient) => ingredient.id === ingredientId)
                                // alert('boogie')
                                editIngredient(item)
                            })
                        })
                        const editIngredient = async (i) => {

                            const overlay = document.querySelector('.overlay')
                            overlay.classList.add('show')

                            let dialogs = document.querySelectorAll('#ingredient-modal');
                            if (dialogs.length > 1) {
                                dialogs.forEach(di => {



                                })
                            }

                            const modal = document.getElementById("ingredient-modal")

                            modal.removeAttribute('open')
                            const modalInner = `<ul id="ingredient">
                                <li><label><div>Name:</div> <input dataId="${i.id}" id="name" value="${i.name}" /></label></li>
                                <li><label><div>Description:</div> <input id="description" dataId="${i.id}" value="${i.description}" /></label></li>
                                <li><label><div>Amount:</div> <input id="amount" dataId="${i.id}" value="${i.amount}" /></label></li>
                                <li><label><div>Unit:</div> <input id="unit" dataId="${i.id}"  value="${i.unit}" /></label></li>
                                <li><label><div>Measure Word (Optional):</div> <input id="measureWord" placeholder="i.e. a splash, a pinch, a dollop" dataId="${i.id}" value="${i.measureWord}" /></label></li>
                                
                                <div class="button__footer">

                                <button class="close-ingredient-modal" id="close-ingredient-modal">Close</button>
                                </div>
                                </ul>`;
                            // const pageContainer = document.querySelector('.page-container')
                            // pageContainer.appendChild(modal)
                            modal.innerHTML = modalInner;

                            modal.setAttribute('open', '')
                            modal.querySelector('input').focus();

                            modal.addEventListener('transitionend', (e) => {
                                modal.querySelector('input').focus();
                            });


                            document.getElementById('close-ingredient-modal').addEventListener('click', function (e) {
                                e.preventDefault()
                                recipeId = location.hash.substring(1);
                                const overlay = document.querySelector('.overlay');
                                overlay.classList.remove('show');
                                modal.removeAttribute('autofocus')
                                modal.removeAttribute('open');
                                // document.querySelector('.return-focus').focus();
                                listIngredients()
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


                        recipeCategories.addEventListener("input", function (e) {
                            const recipeId = location.hash.substring(1);

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



                        const addAnIngredient = document.getElementById("add-an-ingredient");

                        addAnIngredient.addEventListener('click', async function (e) {
                            e.preventDefault();


                            // const buttons = document.querySelectorAll('.return-focus');
                            // buttons.forEach(button => {
                            //     button.classList.remove('return-focus')
                            // })
                            // addAnIngredient.classList.add('return-focus');
                            const hasDialogs = document.querySelectorAll('#ingredient-modal');

                            if (hasDialogs && hasDialogs.length > 1) {
                                alert('NO GO')
                                return
                            }
                            // console.log(`number of dialogs open = ${hasDialog.length}`)
                            let recipeId = location.hash.substring(1);
                            let recipes = await loadRecipes()
                            let recItem = recipes.find((recipe) => recipe.id === recipeId)

                            let newIngredient = {
                                name: "",
                                description: "",
                                amount: "",
                                unit: "",
                                measureWord: "",
                                alternatives: [],
                                id: uuidv4()
                            }
                            //  let recipes = await loadRecipes();
                            let uuid = newIngredient.id
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
                        const setFocus = async function () {
                            let focusElement = await JSON.parse(localStorage.getItem("focusState"))

                            // let bbutton = document.querySelector(`${focusElement.button}`)
                            // bbutton.focus()
                        }
                        setFocus()
                    }

                    initEdit(recipeId);
                    hamburger()

                    const updateOne = document.getElementById('update-one'); updateOne.addEventListener('click', function (e) {
                        e.preventDefault()
                        updateRecipeInDatabase()
                    })



                    const removeRecipeButton = document.getElementById('remove-recipe'); removeRecipeButton.addEventListener('click', function (e) {
                        const recipeId = location.hash.substring(1);
                        let text = "DELETE THE RECIPE\nAre You Sure?";
                        if (confirm(text) == true) {


                            removeRecipe(recipeId);
                        } else {
                            return
                        }

                    })

                    // window.addEventListener('storage', function(e){
                    //     e.key === 'recipes' ? initEdit(recipeId):console.log("not that")
                    // })