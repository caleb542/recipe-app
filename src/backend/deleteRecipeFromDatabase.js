
import { Notyf } from 'notyf'
const notyf = new Notyf();
import { getToken } from '../auth/auth0.js';
import 'notyf/notyf.min.css'; 



export async function deleteRecipeFromDatabase() {

   const recipe = JSON.parse(localStorage.getItem('editingRecipe'));
  const confirmed = confirm(`Are you sure you want to delete "${recipe.name}" from the database?`);

  if (!confirmed) return;

  try {
    // Get auth token
    const token = await getToken();

    const response = await fetch('/.netlify/functions/deleteRecipe', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // ✅ Add auth header
      },
      body: JSON.stringify({ id: recipe.id })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }

    // ✅ Clear localStorage
    localStorage.removeItem('editingRecipe');

    // ✅ Optional: redirect or refresh UI
    notyf.success("Recipe deleted from database.");
    setTimeout(() => {
          window.location.href = '/'; // or wherever you want to go
      }, 2000); // 1.5 seconds gives the toast time to animate
  } catch (err) {
    console.error("❌ Delete failed:", err);
    notyf.error("Failed to delete recipe.");
  }
}