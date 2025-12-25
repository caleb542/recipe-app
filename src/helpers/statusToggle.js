/**
 * Status Toggle Functionality
 * Handles the Published/Unpublished state toggle
 */

// Initialize the status toggle
function initStatusToggle() {
    const statusToggle = document.getElementById('statusToggle');
    
    if (!statusToggle) return;
    
    // Load initial state from your database/storage
    // This is a placeholder - replace with your actual data loading logic
    const currentPublishedState = loadPublishedState();
    updateToggleUI(statusToggle, currentPublishedState);
    
    // Add click event listener
    statusToggle.addEventListener('click', async function() {
        const currentState = this.getAttribute('data-published') === 'true';
        const newState = !currentState;
        
        // Add loading state
        this.classList.add('loading');
        this.disabled = true;
        
        try {
            // Save the new state (replace with your actual save logic)
            await savePublishedState(newState);
            
            // Update UI
            updateToggleUI(this, newState);
            
            // Optional: Show success feedback
            showSuccessMessage(newState ? 'Recipe published!' : 'Recipe unpublished');
            
        } catch (error) {
            console.error('Error updating published state:', error);
            showErrorMessage('Failed to update status. Please try again.');
        } finally {
            // Remove loading state
            this.classList.remove('loading');
            this.disabled = false;
        }
    });
}

/**
 * Update the toggle button UI based on published state
 */
function updateToggleUI(toggleElement, isPublished) {
    const icon = toggleElement.querySelector('.status-icon i');
    const text = toggleElement.querySelector('.status-text');
    
    toggleElement.setAttribute('data-published', isPublished);
    
    if (isPublished) {
        icon.className = 'fa-solid fa-eye';
        text.textContent = 'Published';
    } else {
        icon.className = 'fa-solid fa-eye-slash';
        text.textContent = 'Unpublished';
    }
}

/**
 * Load the published state from your data source
 * Replace this with your actual implementation
 */
function loadPublishedState() {
    // Example: Load from localStorage, or from your recipe data
    // const recipeId = getRecipeIdFromURL();
    // const recipe = getRecipeData(recipeId);
    // return recipe.published || false;
    
    // Placeholder - returns false by default
    return false;
}

/**
 * Save the published state to your data source
 * Replace this with your actual implementation
 */
async function savePublishedState(isPublished) {
    // Example implementation:
    // const recipeId = getRecipeIdFromURL();
    // await updateRecipeInDatabase(recipeId, { published: isPublished });
    
    // Simulated API call
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Published state saved: ${isPublished}`);
            resolve();
        }, 500);
    });
}

/**
 * Show success message to user
 */
function showSuccessMessage(message) {
    // You can implement this with your preferred notification system
    // For now, just console.log
    console.log('✓ ' + message);
    
    // Optional: Add a temporary success class to the save button
    const saveBtn = document.getElementById('saveToDatabaseButton');
    if (saveBtn) {
        saveBtn.classList.add('success');
        setTimeout(() => saveBtn.classList.remove('success'), 1000);
    }
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
    // You can implement this with your preferred notification system
    console.error('✗ ' + message);
    alert(message); // Simple fallback
}

/**
 * Optional: Add keyboard shortcut for toggling status
 * Ctrl/Cmd + Shift + P to toggle publish state
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+P or Cmd+Shift+P
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            const statusToggle = document.getElementById('statusToggle');
            if (statusToggle) {
                statusToggle.click();
            }
        }
    });
}

/**
 * Integration with your existing save functionality
 * Call this function when the user saves the recipe
 */
function getCurrentPublishedState() {
    const statusToggle = document.getElementById('statusToggle');
    return statusToggle ? statusToggle.getAttribute('data-published') === 'true' : false;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initStatusToggle();
        initKeyboardShortcuts();
    });
} else {
    initStatusToggle();
    initKeyboardShortcuts();
}

// Export functions for use in your existing code
export {
    initStatusToggle,
    getCurrentPublishedState,
    updateToggleUI,
    savePublishedState
};