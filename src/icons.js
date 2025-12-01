import {
    getImageGroup
} from './unsplash.js';
// import { render } from './functions'

let pageNumber = 1; //page of x number (currently 30), increment by 1 for a new set
let responseLength;

render(pageNumber)