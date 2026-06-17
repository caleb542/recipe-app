import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { randomUUID } from 'crypto';

export const handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }
    
    try {
        const { url } = JSON.parse(event.body);
        
        if (!url) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'URL is required' })
            };
        }
        
        console.log('📥 Fetching recipe from:', url);
        
        // Fetch the page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)'
            }
        });
        
        if (!response.ok) {
            console.error('❌ Fetch failed:', response.status, response.statusText);
            throw new Error(`Failed to fetch URL: ${response.status}`);
        }
        
        const html = await response.text();
        console.log('✅ HTML fetched, length:', html.length);
        
        // Extract schema.org Recipe data
       const recipe = extractRecipeFromHTML(html, url);

        if (!recipe) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Could not extract recipe from this URL. The page may not have structured data, or the format is not recognized. Try copying and pasting the recipe text instead.'
                })
            };
        }

        console.log('✅ Recipe extracted:', recipe.name);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(recipe)
        };
        
    } catch (error) {
        console.error('Import error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: error.message || 'Failed to import recipe'
            })
        };
    }
};

/**
 * Fallback: Extract recipe from HTML, first checking for buried JSON-LD, then HTML selectors
 */
function extractRecipeFromHTML(html, sourceUrl) {
    const $ = cheerio.load(html);
    console.log('🔧 Attempting HTML fallback parsing');

    // First: look for ANY JSON-LD with Recipe type buried anywhere in the HTML
    const allScripts = $('script[type="application/ld+json"]');
    for (let i = 0; i < allScripts.length; i++) {
        try {
            const data = JSON.parse($(allScripts[i]).html());
            const items = Array.isArray(data) ? data : [data];
            const recipe = items.find(item => item['@type'] === 'Recipe');
            if (recipe) {
                console.log('✅ Found Recipe JSON-LD buried in HTML');
                return transformSchemaToRecipe(recipe, sourceUrl);
            }
        } catch(e) { continue; }
    }

    console.log('🔍 No buried JSON-LD found, trying HTML selectors');

    // Fall through to HTML selector parsing
    const recipe = {
        name: '',
        ingredients: [],
        directions: [],
        sourceUrl
    };

    recipe.name = 
        $('h1[class*="recipe"]').first().text().trim() ||
        $('h1.headline').first().text().trim() ||
        $('h1').first().text().trim() ||
        $('title').text().replace(/\s*-\s*Allrecipes.*$/i, '').trim();

    console.log('Found name:', recipe.name);

    const ingredientSelectors = [
        '.recipe__ingredients li',
        '.ingredients-list li',
        'ul.ingredients li',
        '[class*="ingredient-list"] li',
        '.mntl-structured-ingredients__list-item',
        'li[class*="mntl-ingredients"]',
        'li[class*="ingredient"]'
    ];

    for (const selector of ingredientSelectors) {
        let items;
        if (selector.match(/^ul\.|^ol\./)) {
            const listEl = $(selector.split(' ')[0]).first();
            items = listEl.find('li');
        } else {
            items = $(selector);
        }

        if (items.length > 0) {
            items.each((i, el) => {

                  const cloned = $(el).clone();
                cloned.find('figure').nextAll().remove();
                
                cloned.find('figure').remove();
                console.log("removing figure")

                cloned.find('img').nextAll().remove();
                
                cloned.find('img').remove();
                console.log("removing img")
               
                const text = cloned.text().trim(); console.log('text', text);
                const isJunk = 
                    !text || 
                    text.length < 3 || 
                    text.match(/^(ad|advertisement|sponsored)/i) ||
                    text.match(/^https?:\/\//i);
                if (text && !isJunk) {
                    recipe.ingredients.push(parseIngredient(text));
                }
            });
            console.log(`Found ${recipe.ingredients.length} ingredients with selector: ${selector}`);
            if (recipe.ingredients.length > 0) break;
        }
    }

    const directionSelectors = [
        'ol li div[class*="body1"]',    // Saveur - MUI structure
        'li[class*="instruction"]',
        '.instructions li',
        '[class*="direction"] li',
        'ol[class*="instruction"] li',
        '.mntl-sc-block-group--OL li',
        '.tasty-recipes-instructions li',
        '.recipe__instructions li',
        '.preparation-steps li',
        '[data-testid="InstructionStep"]',
        '.recipe-directions li',
        '.recipe__directions li'
    ];

    for (const selector of directionSelectors) {
        let items;
        if (selector.match(/^ol /)) {
            const listEl = $(selector.split(' ')[0]).first();
            items = listEl.find(selector.split(' ').slice(1).join(' '));
        } else {
            items = $(selector);
        }
        if (items.length > 0) {
            items.each((i, el) => {
                const cloned = $(el).clone();
                cloned.find('figure').nextAll().remove();
                cloned.find('figure').remove();
                console.log("directions: Removing figure")
                cloned.find('img').nextAll().remove();
                cloned.find('img').remove();
                  console.log("directions: Removing img")
                const text = cloned.text().trim();
                  console.log(`directions text = ${text}`);
                const isValidStep = 
                    text.length > 15 &&
                    !text.match(/^(print|save|rate|review|comment|share|pin|tweet|recipes by)/i) &&
                    !text.match(/^(prep time|cook time|total time|servings|yield)/i) &&
                    !text.match(/^https?:\/\//i) &&
                    !text.match(/^(photos|video|notes|tips)/i);
                if (isValidStep) {
                    recipe.directions.push({
                        id: randomUUID(),
                        text: text.replace(/^\d+\.\s*/, '')
                    });
                }
            });
            console.log(`Found ${recipe.directions.length} directions with selector: ${selector}`);
            if (recipe.directions.length > 0) break;
        }
    }


    const bodyText = $('body').text();
const extractTime = (pattern) => {
  const normalized = bodyText.replace(/(\d+)(mins?|minutes?|hours?|hrs?)/gi, '$1 $2');
  const match = normalized.match(pattern);
  if (!match) return '';
  const val = parseInt(match[1]);
  const u = match[2].toLowerCase();
  return u.startsWith('h') ? `${val} hour${val > 1 ? 's' : ''}` : `${val} minutes`;
};

recipe.prepTime = extractTime(/prep\s*time:?\s*(\d+)\s*(mins?|minutes?|hours?|hrs?)/i);
recipe.cookTime = extractTime(/cook\s*time:?\s*(\d+)\s*(mins?|minutes?|hours?|hrs?)/i);
recipe.totalTime = extractTime(/total\s*time:?\s*(\d+)\s*(mins?|minutes?|hours?|hrs?)/i);

const servingsMatch = bodyText.match(/(?:serves?|servings?|yield):?\s*(\d+)/i);
if (servingsMatch) recipe.servings = servingsMatch[1];

// Final check
if (!recipe.name || (recipe.ingredients.length === 0 && recipe.directions.length === 0)) {
  console.log('❌ HTML fallback failed - insufficient data');
  return null;
}

    if (!recipe.name || (recipe.ingredients.length === 0 && recipe.directions.length === 0)) {
        console.log('❌ HTML fallback failed - insufficient data');
        return null;
    }

    console.log(`✅ HTML fallback succeeded: ${recipe.name}, ${recipe.ingredients.length} ingredients, ${recipe.directions.length} steps`);
    return recipe;
}



/**
 * Transform schema.org recipe to our format
 */
function transformSchemaToRecipe(schema, sourceUrl) {
    return {
        name: schema.name || 'Untitled Recipe',
        description: schema.description || '',
        prepTime: parseDuration(schema.prepTime),
        cookTime: parseDuration(schema.cookTime),
        totalTime: parseDuration(schema.totalTime) || 
                   (parseDuration(schema.prepTime) && parseDuration(schema.cookTime) ? 
                    `${parseInt(parseDuration(schema.prepTime)) + parseInt(parseDuration(schema.cookTime))} minutes` : ''),
        servings: parseServings(schema.recipeYield),
        ingredients: (schema.recipeIngredient || []).map(parseIngredient),
        directions: parseInstructions(schema.recipeInstructions || []),
        notes: schema.notes || schema.recipeNotes || schema.comment || '',
        sourceUrl: sourceUrl,
        image: extractImage(schema.image),
        author: schema.author?.name || '',
        categories: parseCategories(schema),
        nutrition: schema.nutrition ? {
            calories: schema.nutrition.calories,
            fat: schema.nutrition.fatContent,
            protein: schema.nutrition.proteinContent,
            carbs: schema.nutrition.carbohydrateContent
        } : null
    };
}

/**
 * Parse ISO 8601 duration to minutes
 */
function parseDuration(duration) {
    if (!duration) return '';
    
    // Handle "PT15M" format
    const match = duration.match(/PT(?:\d+D)?(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return '';
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const total = (hours * 60) + minutes;
    
    return total ? `${total} minutes` : '';
}

/**
 * Parse servings/yield
 */
function parseServings(yield_) {
    if (!yield_) return '';
    
    // Could be number or string like "4 servings" or "Makes 12 cookies"
    const match = String(yield_).match(/(\d+)/);
    return match ? match[1] : '';
}

/**
 * Parse ingredient string to structured object
 */
function parseIngredient(str) {
    // Remove HTML if present
    str = str.replace(/<[^>]*>/g, '').trim();
     // Strip leading checkbox/bullet characters (WP Recipe Maker, etc.)
    str = str.replace(/^[\u2610\u25A2\u25A1\u2611\u2612\u2713\u2714\s]+/, '');
    // Normalize unicode fractions to regular fractions
    str = str
        .replace(/¼/g, '1/4')
        .replace(/½/g, '1/2')
        .replace(/¾/g, '3/4')
        .replace(/⅓/g, '1/3')
        .replace(/⅔/g, '2/3')
        .replace(/⅛/g, '1/8')
        .replace(/⅜/g, '3/8')
        .replace(/⅝/g, '5/8')
        .replace(/⅞/g, '7/8');
    
    // Pattern 1: "2 cups all-purpose flour" or "1/2 tsp salt" (with unit)
    const withUnitMatch = str.match(/^([\d./\s-]+)?\s*(cup|tsp|tbsp|tablespoon|teaspoon|oz|ounce|lb|pound|g|gram|kg|ml|l|liter|clove|piece|slice|can|package|pkg)\.?s?\s+(.+)$/i);
    
    if (withUnitMatch) {
        const ingredient = withUnitMatch[3].trim();
        // Only treat content in parentheses as description, not commas
        const notesMatch = ingredient.match(/^([^(]+)\((.+)\)$/);
        
        return {
            id: randomUUID(),
            amount: withUnitMatch[1]?.trim() || '',
            unit: normalizeUnit(withUnitMatch[2]),
            name: notesMatch ? notesMatch[1].trim() : ingredient,
            description: notesMatch ? notesMatch[2].trim() : ''
        };
    }
    
    // Pattern 2: "8 chicken breasts" or "3 eggs" (number but no unit)
    const withoutUnitMatch = str.match(/^(\d+(?:\/\d+)?)\s+(.+)$/);
    
    if (withoutUnitMatch) {
        const ingredient = withoutUnitMatch[2].trim();
        const notesMatch = ingredient.match(/^([^(]+)\((.+)\)$/);
        
        return {
            id: randomUUID(),
            amount: withoutUnitMatch[1],
            unit: '', // Leave blank instead of defaulting to "piece"
            name: notesMatch ? notesMatch[1].trim() : ingredient,
            description: notesMatch ? notesMatch[2].trim() : ''
        };
    }
    
    // Fallback: entire string as ingredient name (e.g., "Salt to taste")
    return {
        id: randomUUID(),
        amount: '',
        unit: '',
        name: str,
        description: ''
    };
}

/**
 * Normalize unit names
 */
function normalizeUnit(unit) {
    const normalized = {
        'tablespoon': 'tbsp',
        'teaspoon': 'tsp',
        'ounce': 'oz',
        'pound': 'lb',
        'gram': 'g',
        'liter': 'l',
        'package': 'pkg'
    };
    
    const lower = unit.toLowerCase();
    return normalized[lower] || lower;
}

/**
 * Parse instructions
 */
function parseInstructions(instructions) {
    if (!Array.isArray(instructions)) {
        instructions = [instructions];
    }
    
    return instructions.map(inst => {
        let text = '';
        
        if (typeof inst === 'string') {
            text = inst;
        } else if (inst['@type'] === 'HowToStep') {
            text = inst.text || inst.name || '';
        } else if (inst.text) {
            text = inst.text;
        }
        
        // Remove figure and everything after it (images + captions)
        text = text.replace(/<figure[\s\S]*$/, '').trim();
        
        // Strip any remaining HTML tags
        text = text.replace(/<[^>]*>/g, '').trim();
        
        // Remove leading step numbers
        text = text.replace(/^\d+\.\s*/, '');
        
        return {
            id: randomUUID(),
            text: text
        };
    }).filter(step => step.text);
}

/**
 * Extract image URL
 */
function extractImage(image) {
    if (!image) return '';
    
    if (typeof image === 'string') return image;
    if (Array.isArray(image)) return image[0];
    if (image.url) return image.url;
    
    return '';
}

/**
 * Parse categories from schema
 */
function parseCategories(schema) {
    const categories = [];
    
    if (schema.recipeCategory) {
        categories.push(schema.recipeCategory);
    }
    
    if (schema.recipeCuisine) {
        categories.push(schema.recipeCuisine);
    }
    
    if (schema.keywords) {
        const keywords = Array.isArray(schema.keywords) ? 
                        schema.keywords : 
                        schema.keywords.split(',').map(k => k.trim());
        categories.push(...keywords);
    }
    
    return categories;
}