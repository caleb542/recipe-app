const filters = {
    searchText: '',
    sortBy: 'byEdited',
    showUncategorized: false  // ✅ Add new filter flag
}

const getFilters = () => filters

const setFilters = (updates) => {
    if (typeof updates.searchText === 'string') {
        filters.searchText = updates.searchText
        console.log("***") 
        console.log(filters)
    }
    
    if (typeof updates.sortBy === 'string') {
        filters.sortBy = updates.sortBy
        console.log("***") 
        console.log(filters)
    }
    
    // ✅ Handle showUncategorized flag
    if (typeof updates.showUncategorized === 'boolean') {
        filters.showUncategorized = updates.showUncategorized
        console.log("***") 
        console.log(filters)
    }
}

export { getFilters, setFilters }