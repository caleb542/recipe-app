/**
 * Quick Add - Import recipes from URL or pasted text
 */

import { loadRecipes, saveRecipes } from '../functions.js';
import { populateFields } from './fields.js';
import { listDirections } from './directions.js';
import { listIngredients } from './ingredients.js';
import {
  updateIdentitySummary,
  updateDescriptionSummary,
  updateIngredientsSummary,
  updateDirectionsSummary,
  updateEditorialSummary,
  markUnsaved
} from './editAccordion.js';

// Polyfill for crypto.randomUUID if not available
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Show Quick Add modal when creating new recipe
 */
export function showQuickAddModal(recipeId) {
    const modal = document.createElement('dialog');
    modal.id = 'quick-add-modal';
    modal.className = 'modal-dialog quick-add-modal';
    
    modal.innerHTML = `
        <div class="quick-add-modal-content">
            <button class="modal-close" aria-label="Close">&times;</button>
            
            <h2>Add New Recipe</h2>
            <p class="modal-subtitle">Choose how you'd like to start</p>
            
            <div class="quick-add-options">
                <div class="quick-add-option import-option">
                    <div class="option-icon">🚀</div>
                    <h3>Quick Import</h3>
                    <p>Paste a recipe URL or full recipe text</p>
                    
                    <textarea 
                        id="quick-add-textarea"
                        placeholder="Paste URL (e.g., https://allrecipes.com/recipe/...)

OR paste full recipe text:

Chocolate Chip Cookies

Ingredients:
- 2 cups flour
- 1 cup sugar
...

Instructions:
1. Preheat oven...
2. Mix ingredients..."
                        rows="8"
                    ></textarea>
                    
                    <button id="parse-recipe-btn" class="btn-primary">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                        Import Recipe
                    </button>
                </div>
                
                <div class="quick-add-divider">
                    <span>OR</span>
                </div>
                
                <div class="quick-add-option manual-option">
                    <div class="option-icon">✏️</div>
                    <h3>Start from Scratch</h3>
                    <p>Fill out the form step-by-step</p>
                    
                    <button id="manual-entry-btn" class="btn-secondary">
                        <i class="fa-solid fa-pen"></i>
                        Create Manually
                    </button>
                </div>
            </div>
            
            <div id="parse-status" class="parse-status"></div>
            
            <div class="quick-add-footer">
                <small>
                    ⚠️ Only import recipes you have permission to use (personal use)
                </small>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.showModal();
    
    // Wire up close button
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.close();
        modal.remove();
    });
    
    // Wire up Import button
    document.getElementById('parse-recipe-btn').addEventListener('click', async () => {
        const input = document.getElementById('quick-add-textarea').value;
        await handleQuickAdd(input, recipeId, modal);
    });
    
    // Wire up Manual Entry button
    document.getElementById('manual-entry-btn').addEventListener('click', () => {
        modal.close();
        modal.remove();
        // Form is already ready for manual entry
    });
    
    // Close on Escape
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.close();
            modal.remove();
        }
    });
}

/**
 * Handle Quick Add - detects URL vs text and parses accordingly
 */
async function handleQuickAdd(input, recipeId, modal) {
    const statusDiv = document.getElementById('parse-status');
    const parseBtn = document.getElementById('parse-recipe-btn');
    
    if (!input.trim()) {
        statusDiv.innerHTML = '<p class="error">❌ Please paste a URL or recipe text</p>';
        return;
    }
    
    // Detect if URL or text
    const isURL = input.trim().match(/^https?:\/\//);
    
    console.log('🚀 Starting Quick Add:', isURL ? 'URL' : 'Text');
    
    try {
        parseBtn.disabled = true;
        parseBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Parsing...';
        statusDiv.innerHTML = '<p class="loading">⏳ Parsing recipe...</p>';
        
        let parsedRecipe;
        
        if (isURL) {
            // URL import
            statusDiv.innerHTML = '<p class="loading">⏳ Fetching recipe from URL...</p>';
            console.log('📡 Calling import-recipe function...');
            parsedRecipe = await importFromURL(input.trim());
            console.log('✅ Received parsed recipe:', parsedRecipe);
        } else {
            // Text parsing
            statusDiv.innerHTML = '<p class="loading">⏳ Parsing recipe text...</p>';
            console.log('📄 Parsing text...');
            parsedRecipe = parseRecipeText(input);
            console.log('✅ Parsed recipe:', parsedRecipe);
        }
        
        // Populate form with parsed data

        console.log('📝 Populating form...');
        await populateParsedRecipe(parsedRecipe, recipeId);
        console.log('✅ Form populated');
        
        // Close modal
        modal.close();
        modal.remove();
        
        // Show success notification
        showSuccessNotification(parsedRecipe);
        
    } catch (error) {
        console.error('❌ Parse error:', error);
        statusDiv.innerHTML = `<p class="error">❌ ${error.message}</p>`;
        parseBtn.disabled = false;
        parseBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Import Recipe';
    }
}

/**
 * Import recipe from URL (schema.org extraction)
 */
async function importFromURL(url) {
    const response = await fetch('/.netlify/functions/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Could not import from this URL');
    }
    
    return await response.json();
}

/**
 * Parse pasted recipe text (simple regex-based)
 */
function parseRecipeText(text) {
    const lines = text.split('\n').filter(l => l.trim());
    
    const recipe = {
        name: '',
        ingredients: [],
        directions: [],
        description: '',
        prepTime: '',
        totalTime: ''
    };
    
    let currentSection = null;
    let stepNumber = 1;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines
        if (!trimmed) continue;
        
        // Detect recipe name (usually first substantial line)
        if (!recipe.name && trimmed.length > 5 && !trimmed.match(/^(ingredient|direction|instruction|prep|cook|total|serves)/i)) {
            recipe.name = trimmed;
            continue;
        }
        
        // Detect sections
        if (trimmed.match(/^ingredients?:?$/i)) {
            currentSection = 'ingredients';
            continue;
        }
        if (trimmed.match(/^(directions?|instructions?|steps?):?$/i)) {
            currentSection = 'directions';
            continue;
        }
        
        // Parse based on section
        if (currentSection === 'ingredients' && trimmed) {
            const ingredient = parseIngredientLine(trimmed);
            if (ingredient) recipe.ingredients.push(ingredient);
        }
        
        if (currentSection === 'directions' && trimmed) {
            recipe.directions.push({
                id: generateUUID(),
                text: trimmed.replace(/^\d+\.\s*/, '')
            });
        }
        
        // Extract times
        const prepMatch = trimmed.match(/prep:?\s*(\d+)\s*(min|hour)/i);
        if (prepMatch) {
            const value = prepMatch[1];
            const unit = prepMatch[2].toLowerCase();
            recipe.prepTime = unit === 'hour' ? `${value * 60} minutes` : `${value} minutes`;
        }
        
        const cookMatch = trimmed.match(/cook:?\s*(\d+)\s*(min|hour)/i);
        if (cookMatch) {
            const value = cookMatch[1];
            const unit = cookMatch[2].toLowerCase();
            const cookMins = unit === 'hour' ? value * 60 : parseInt(value);
            const prepMins = parseInt(recipe.prepTime) || 0;
            recipe.totalTime = `${prepMins + cookMins} minutes`;
        }
        
        const totalMatch = trimmed.match(/total:?\s*(\d+)\s*(min|hour)/i);
        if (totalMatch) {
            const value = totalMatch[1];
            const unit = totalMatch[2].toLowerCase();
            recipe.totalTime = unit === 'hour' ? `${value * 60} minutes` : `${value} minutes`;
        }
        
        // Extract servings
        const servesMatch = trimmed.match(/serves?:?\s*(\d+)/i);
        if (servesMatch) {
            recipe.servings = servesMatch[1];
        }
    }
    
    // Validation
    if (!recipe.name) {
        throw new Error('Could not find recipe name. Please make sure the first line is the recipe title.');
    }
    
    if (!recipe.ingredients.length && !recipe.directions.length) {
        throw new Error('Could not find ingredients or instructions. Please format with "Ingredients:" and "Instructions:" headers.');
    }
    
    return recipe;
}

/**
 * Parse ingredient line into structured object
 */
function parseIngredientLine(line) {
    // Remove leading bullets/dashes/asterisks
    line = line.replace(/^[-•*]\s*/, '');
    
    if (!line.trim()) return null;
    
    // Pattern: "2 cups flour" or "1/2 tsp salt, divided"
    const match = line.match(/^([\d./\s]+)?\s*(cup|tsp|tbsp|tablespoon|teaspoon|oz|lb|pound|g|kg|ml|l|liter|clove|piece|slice|can|package|pkg)s?\s+(.+)$/i);
    
    if (match) {
        const ingredient = match[3].trim();
        // Check for notes (e.g., "flour, sifted" or "butter (softened)")
        const notesMatch = ingredient.match(/^([^,(]+)[,\(](.+)[\)]?$/);
        
        return {
            id: generateUUID(),
            amount: match[1]?.trim() || '',
            unit: match[2]?.toLowerCase() || '',
            name: notesMatch ? notesMatch[1].trim() : ingredient,
            description: notesMatch ? notesMatch[2].replace(/\)$/, '').trim() : ''
        };
    }
    
    // Fallback: just the ingredient name (e.g., "Salt to taste")
    return {
        id: generateUUID(),
        amount: '',
        unit: '',
        name: line,
        description: ''
    };
}

/**
 * Populate form with parsed recipe data
 */
async function populateParsedRecipe(parsedRecipe, recipeId) {

    const raw = localStorage.getItem('recipes');
  const parsed = JSON.parse(raw || '[]');
  console.log('📦 Raw localStorage recipe count:', parsed.length);
  console.log('📦 Recipe IDs in localStorage:', parsed.map(r => r.id));
    
    console.log('📝 Populating form with parsed recipe:', parsedRecipe);
    
    const recipes = await loadRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        console.error('❌ Recipe not found in localStorage:', recipeId);
        return;
    }
    
    console.log('✅ Found recipe to update:', recipe.id);
    
    // Update recipe object
    if (parsedRecipe.name) recipe.name = parsedRecipe.name;
    if (parsedRecipe.description) recipe.description = parsedRecipe.description;
    if (parsedRecipe.prepTime) recipe.prepTime = parsedRecipe.prepTime;
    if (parsedRecipe.totalTime) recipe.totalTime = parsedRecipe.totalTime;
    if (parsedRecipe.sourceUrl) recipe.sourceUrl = parsedRecipe.sourceUrl;
    if (parsedRecipe.servings) recipe.servings = parsedRecipe.servings;
    
    // Add ingredients (deduplicated)
if (parsedRecipe.ingredients?.length) {
    const seen = new Set();
    recipe.ingredients = parsedRecipe.ingredients.filter(ing => {
        const key = `${ing.amount}|${ing.unit}|${ing.name}`.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    console.log('📋 Adding', recipe.ingredients.length, 'ingredients (deduplicated from', parsedRecipe.ingredients.length, ')');
}
    
    // Add directions
    if (parsedRecipe.directions?.length) {
        console.log('📝 Adding', parsedRecipe.directions.length, 'directions');
        recipe.directions = parsedRecipe.directions;
    }
    
    // Add source attribution if from URL
    if (parsedRecipe.sourceUrl) {
        recipe.article = `<p><em>Source: <a href="${parsedRecipe.sourceUrl}" target="_blank">${parsedRecipe.sourceUrl}</a></em></p>\n\n`;
    }
    
    console.log('💾 Saving updated recipe:', recipe);
    
    // Save to localStorage and recipes
    localStorage.setItem('editingRecipe', JSON.stringify(recipe));
    saveRecipes(recipes);
    
    // Populate form fields
    populateFields(recipe);
    updateIdentitySummary(recipe);
updateDescriptionSummary(recipe.description || '');
updateIngredientsSummary(recipe.ingredients || []);
updateDirectionsSummary(recipe.directions || []);
updateEditorialSummary(recipe);
markUnsaved();
    listDirections(recipe.directions);
    await listIngredients(recipeId);
    
    // If there's article content, update editor
    if (window.editorInstance && recipe.article) {
        window.editorInstance.setMarkdown(recipe.article);
    }
}

/**
 * Show success notification
 */
function showSuccessNotification(recipe) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fa-solid fa-circle-check"></i>
            <div>
                <strong>Recipe imported!</strong>
                <p>Review and edit as needed. ${recipe.ingredients?.length || 0} ingredients and ${recipe.directions?.length || 0} steps imported.</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}