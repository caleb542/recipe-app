const filters = {
    searchText: '',
    sortBy: 'byEdited'
}

const getFilters = () => filters

const setFilters = (updates) => {
    if( typeof updates.searchText === 'string' ) {
        filters.searchText = updates.searchText

        console.log("***") 
       console.log(filters)
    }
    if( typeof updates.sortBy === 'string' ) {
       filters.sortBy = updates.sortBy
       console.log("***") 
       console.log(filters)
    }else{
        console.log("***") 
       console.log(filters)
    }

}
export { getFilters, setFilters }