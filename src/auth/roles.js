/**
 * ROLE-BASED ACCESS CONTROL (RBAC)
 * 
 * Roles:
 * - user: Can create and edit their own recipes
 * - admin: Can moderate content, edit any recipe
 * - superadmin: Full access to everything
 */

/**
 * Check if user is a superadmin
 * @param {Object} user - User object from userContext
 * @returns {boolean}
 */
export const isSuperAdmin = (user) => {
  return user?.role === 'superadmin';
};

/**
 * Check if user is an admin or superadmin
 * @param {Object} user - User object from userContext
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user?.role === 'admin' || user?.role === 'superadmin';
};

/**
 * Check if user can edit a specific recipe
 * @param {Object} user - User object from userContext
 * @param {Object} recipe - Recipe object
 * @returns {boolean}
 */
export const canEditRecipe = (user, recipe) => {
  if (!user) return false;
  
  // Superadmin can edit anything
  if (isSuperAdmin(user)) return true;
  
  // Admin can edit anything
  if (isAdmin(user)) return true;
  
  // Regular users can only edit their own recipes
  // Check multiple possible author structures
  const recipeAuthorId = recipe.author?.auth0Id || recipe.authorId || recipe.auth0Id;
  return user.auth0Id === recipeAuthorId;
};

/**
 * Check if user can delete a specific recipe
 * @param {Object} user - User object from userContext
 * @param {Object} recipe - Recipe object
 * @returns {boolean}
 */
export const canDeleteRecipe = (user, recipe) => {
  if (!user) return false;
  
  // Superadmin can delete anything
  if (isSuperAdmin(user)) return true;
  
  // Admin can delete anything
  if (isAdmin(user)) return true;
  
  // Regular users can only delete their own recipes
  const recipeAuthorId = recipe.author?.auth0Id || recipe.authorId || recipe.auth0Id;
  return user.auth0Id === recipeAuthorId;
};

/**
 * Check if user can publish/unpublish recipes
 * @param {Object} user - User object from userContext
 * @param {Object} recipe - Recipe object
 * @returns {boolean}
 */
export const canPublishRecipe = (user, recipe) => {
  if (!user) return false;
  
  // Superadmin can publish/unpublish anything
  if (isSuperAdmin(user)) return true;
  
  // Admin can publish/unpublish anything
  if (isAdmin(user)) return true;
  
  // Regular users can only publish their own recipes
  const recipeAuthorId = recipe.author?.auth0Id || recipe.authorId || recipe.auth0Id;
  return user.auth0Id === recipeAuthorId;
};

/**
 * Check if user can access admin features
 * @param {Object} user - User object from userContext
 * @returns {boolean}
 */
export const canAccessAdmin = (user) => {
  return isAdmin(user) || isSuperAdmin(user);
};

/**
 * Get user role display name
 * @param {Object} user - User object from userContext
 * @returns {string}
 */
export const getRoleDisplayName = (user) => {
  const roles = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    user: 'User'
  };
  return roles[user?.role] || 'User';
};

/**
 * Check if user owns the recipe
 * @param {Object} user - User object from userContext
 * @param {Object} recipe - Recipe object
 * @returns {boolean}
 */
export const isRecipeOwner = (user, recipe) => {
  if (!user || !recipe) return false;
  const recipeAuthorId = recipe.author?.auth0Id || recipe.authorId || recipe.auth0Id;
  return user.auth0Id === recipeAuthorId;
};
