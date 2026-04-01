# ROLE-BASED ACCESS CONTROL IMPLEMENTATION GUIDE

## Files Created:
1. `src/auth/roles.js` - Core permission checking functions
2. `src/auth/roleUI.js` - UI helpers for showing/hiding features
3. `netlify/functions/setSuperadmin.js` - One-time setup function

---

## Step 1: Set Up Your Superadmin Account

### Option A: Using the Setup Function (Recommended)

1. **Add to `.env`:**
   ```
   SUPERADMIN_SETUP_KEY=your-secret-key-here-12345
   ```

2. **Move `setSuperadmin.js` to your functions folder:**
   ```bash
   mv setSuperadmin.js netlify/functions/
   ```

3. **Call the function once** (replace with your email):
   ```
   http://localhost:8888/.netlify/functions/setSuperadmin?key=your-secret-key-here-12345&email=your@email.com
   ```

4. **Delete or disable the function** after you're set up (for security)

### Option B: Direct MongoDB Update

In MongoDB Atlas:
```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "superadmin" } }
)
```

---

## Step 2: Move Files to Your Project

```bash
# Move role files to your project
mv roles.js src/auth/roles.js
mv roleUI.js src/auth/roleUI.js
```

---

## Step 3: Update User Schema

Make sure your user documents have a `role` field. When creating new users, default to "user":

**In your user creation/login code:**
```javascript
const newUser = {
  auth0Id: userInfo.sub,
  username: userInfo.username,
  email: userInfo.email,
  role: "user", // ← Add this
  createdAt: new Date()
};
```

---

## Step 4: Integrate into Your App

### In `src/index.js`:

```javascript
import { initRoleBasedUI } from './auth/roleUI.js';

// After auth initialization
await initAuth0();
await loadUserProfile();
await updateAuthUI();
initRoleBasedUI(); // ← Add this
```

### In `src/article.js` (recipe detail page):

```javascript
import { canEditRecipe, canDeleteRecipe } from './auth/roles.js';
import { getUserProfile } from './userContext.js';

// Show/hide edit button
const user = getUserProfile();
const editButton = document.querySelector('.edit-button');

if (canEditRecipe(user, recipe)) {
  editButton.style.display = 'block';
} else {
  editButton.style.display = 'none';
}
```

### In `src/recipes.js` (when rendering recipe cards):

```javascript
import { canEditRecipe } from './auth/roles.js';
import { addSuperadminIndicator } from './auth/roleUI.js';
import { getUserProfile } from './userContext.js';

const renderRecipeCard = (recipe) => {
  const user = getUserProfile();
  
  // ... your existing card rendering code
  
  // Add superadmin indicator if applicable
  if (canEditRecipe(user, recipe)) {
    addSuperadminIndicator(recipe, cardElement);
  }
};
```

---

## Step 5: Backend Authorization (Important!)

### Update your recipe update endpoint:

**In `netlify/functions/updateRecipe.js`:**

```javascript
import { getUserFromToken } from './auth/getUserFromToken.js';

export async function handler(event) {
  // Get user from Auth0 token
  const user = await getUserFromToken(event.headers.authorization);
  
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  
  // Get recipe from database
  const recipe = await db.collection('recipes').findOne({ _id: recipeId });
  
  // Check permissions
  const isSuperAdmin = user.role === 'superadmin';
  const isOwner = recipe.author?.auth0Id === user.auth0Id;
  
  if (!isSuperAdmin && !isOwner) {
    return { 
      statusCode: 403, 
      body: JSON.stringify({ error: 'You do not have permission to edit this recipe' }) 
    };
  }
  
  // Proceed with update...
}
```

---

## Step 6: UI Features

### Show Admin Badge in Header

The `initRoleBasedUI()` function automatically adds a badge next to the username if you're an admin/superadmin.

### Show Crown Icon on Editable Recipes

When you're a superadmin viewing recipes you can edit (but don't own), a gold crown icon appears.

---

## Role Hierarchy

```
user        → Can only edit own recipes
admin       → Can edit any recipe
superadmin  → Can edit any recipe + future admin features
```

---

## Testing

1. **As superadmin:**
   - You should see edit buttons on ALL recipes
   - You should see a "Super Admin" badge in the header
   - You should see crown icons on recipes you don't own

2. **As regular user:**
   - You should only see edit buttons on your own recipes
   - No admin badge
   - No crown icons

3. **Logged out:**
   - No edit buttons anywhere

---

## Security Checklist

- ✅ Backend validates permissions (not just frontend hiding)
- ✅ Setup function requires secret key
- ✅ Setup function can be disabled after first use
- ✅ Role is stored in database, not just client
- ✅ Auth0 token is verified on backend

---

## Future Enhancements

You can add more roles or permissions:
- `moderator` - Can delete inappropriate content
- `contributor` - Can submit recipes for approval
- Custom permissions per feature

Just update `roles.js` with new functions!

---

## Need Help?

If you run into issues:
1. Check console for "User role:" log
2. Verify MongoDB has `role: "superadmin"` on your user
3. Make sure `getUserProfile()` returns the role field
4. Check Network tab for 403 errors on edit attempts
