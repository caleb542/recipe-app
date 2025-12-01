
import { Notyf } from 'notyf'
const notyf = new Notyf();
import 'notyf/notyf.min.css'; 



export async function deleteRecipeFromDatabase() {

   const recipe = JSON.parse(localStorage.getItem('editingRecipe'));
  const confirmed = confirm(`Are you sure you want to delete "${recipe.name}" from the database?`);

  if (!confirmed) return;

  try {
    const response = await fetch('/.netlify/functions/deleteRecipe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: recipe.id })
    });

    if (!response.ok) throw new Error('Delete failed');

    // ✅ Clear localStorage
    localStorage.removeItem('editingRecipe');

    // ✅ Optional: redirect or refresh UI
    notyf.success("Recipe deleted from database.");
    setTimeout(() => {
          window.location.href = '/'; // or wherever you want to go
      }, 2500); // 1.5 seconds gives the toast time to animate
  } catch (err) {
    console.error("❌ Delete failed:", err);
    notyf.error("Failed to delete recipe.");
  }
}