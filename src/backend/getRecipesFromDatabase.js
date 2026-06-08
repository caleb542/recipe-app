import { getToken } from '../auth/auth0.js';

export async function getRecipesFromDatabase() {
  try {
    const token = await getToken();
    
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch('/.netlify/functions/getRecipesFromDatabase', { headers });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || 'Failed to fetch recipes');

    return result.recipes;
  } catch (err) {
    console.error("❌ Frontend fetch error:", err);
    return [];
  }
}