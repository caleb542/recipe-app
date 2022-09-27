import {
  createApi
} from "unsplash-js";
import * as Realm from "realm-web";

const imageElement = document.querySelector('.imageElement')
const imageLink = document.querySelector('.imageLink')
const imageCreator = document.querySelector('.creator')

// mongo connection 
const APP_ID = 'data-puyvo'
const app = new Realm.App({
  id: APP_ID
});
const credentials = Realm.Credentials.anonymous();
// checkin with credentials
const user = await app.logIn(credentials);
//pull all the recipes from the database with custom mongo server function (realm)
let connect = await user.functions.unsplashConnect()

// get api key from stored value in mongo values   
const unsplashme = (keyword) => {

  const unsplash = createApi({
    accessKey: connect
  })

  let sendPhotoObject = unsplash.search.getPhotos({
    // query: keyword,
    query: `${keyword}` ,
    page: 1,
    perPage: 30,
    orientation: 'landscape',
    w:30
  }).then(result => {
    if (result.errors) {
      //
      console.log('error occurred: ', result.errors[0]);
    } else {
      // handle success
      const photo = result.response
      let random = Math.floor(Math.random() * 15)
      const photoObject = photo.results[random];
      // const photoId = photoObject.id
 console.log(photoObject.urls.small)
      const photoSmallUrl = photoObject.urls.small
      const photoThumb = photoObject.urls.thumb
      const photographer = photoObject.user.name
      const photographerLink = photoObject.user.links.html
      sendPhotoObject = {
        photoSmallUrl: photoSmallUrl,
        photoThumbnail: photoThumb,
        photographer: photographer,
        photographerLink: photographerLink
      }
      return sendPhotoObject
    }
  })
  return sendPhotoObject
}

const getImageGroup = ( keyword, page ) => {
  // get api key from stored value in mongo values   

  const unsplash = createApi({
    accessKey: connect
  })

  let sendPhotoObject = unsplash.search.getPhotos({
    // query: keyword,
    query: `${keyword}` ,
    page: `${page}`,
    perPage: 30,
    orientation: 'landscape'
  }).then(result => {
    if (result.errors) {
      //
      console.log('error occurred: ', result.errors[0]);
    } else {
     // result.foreach(image => {

    
      // handle success
      const photo = result.response
      let random = Math.floor(Math.random() * 15)
      const photoObject = photo.results;
   return photoObject
    }
  })
  return sendPhotoObject

}


export { unsplashme, getImageGroup}