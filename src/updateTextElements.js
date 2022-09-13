const updateTextElements = (pageName) => {
    var path = window.location.pathname;
    var page = path.split("/").pop();
    console.log( page );
}
export { updateTextElements }

