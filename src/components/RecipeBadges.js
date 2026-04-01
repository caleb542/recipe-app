/**
 * Generate status badges for recipe cards
 * @param {Object} recipe - Recipe object
 * @param {String} currentUserId - Current user's auth0Id
 * @returns {String} HTML string of badges
 */
export function generateRecipeBadges(recipe, currentUserId) {
  const badges = [];
  const isOwner = currentUserId && recipe.author?.auth0Id === currentUserId;
  
  if (!isOwner) return ''; // Only show badges on own recipes
  
  // Check completeness
  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
  const hasDirections = recipe.directions && recipe.directions.length > 0;
  const isIncomplete = !hasIngredients || !hasDirections;
  
  // Ownership badge (always show first)
  badges.push({
    icon: 'fa-solid fa-user',
    text: 'Your Recipe',
    class: 'badge-owner',
    bgColor: '#0d6efd',
    iconColor: '#fff'
  });
  
  // Incomplete warning
  if (isIncomplete) {
    const missing = [];
    if (!hasIngredients) missing.push('ingredients');
    if (!hasDirections) missing.push('directions');
    
    badges.push({
      icon: 'fa-solid fa-triangle-exclamation',
      text: `Missing ${missing.join(' & ')}`,
      class: 'badge-incomplete',
      bgColor: '#ffc107',
      iconColor: '#000',
      title: 'This recipe cannot be published until complete'
    });
  }
  
  // Draft/Unpublished
  if (!recipe.isPublic) {
    badges.push({
      icon: 'fa-solid fa-file-pen',
      text: 'Draft',
      class: 'badge-draft',
      bgColor: '#6c757d',
      iconColor: '#fff',
      title: 'Only you can see this recipe'
    });
  }
  
  // Scheduled to publish
  if (recipe.publishAt) {
    const publishDate = new Date(recipe.publishAt);
    const now = new Date();
    
    if (publishDate > now) {
      const days = Math.ceil((publishDate - now) / (1000 * 60 * 60 * 24));
      badges.push({
        icon: 'fa-solid fa-clock',
        text: `Publishes in ${days}d`,
        class: 'badge-scheduled',
        bgColor: '#0dcaf0',
        iconColor: '#000',
        title: `Will publish on ${publishDate.toLocaleDateString()}`
      });
    }
  }
  
  // Expiring soon or expired
  if (recipe.expireAt) {
    const expireDate = new Date(recipe.expireAt);
    const now = new Date();
    const daysUntilExpire = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));
    
    if (expireDate < now) {
      // Already expired
      badges.push({
        icon: 'fa-solid fa-lock',
        text: 'Expired',
        class: 'badge-expired',
        bgColor: '#dc3545',
        iconColor: '#fff',
        title: `Expired on ${expireDate.toLocaleDateString()}`
      });
    } else if (daysUntilExpire <= 7) {
      // Expiring soon
      badges.push({
        icon: 'fa-solid fa-hourglass-end',
        text: `Expires in ${daysUntilExpire}d`,
        class: 'badge-expiring',
        bgColor: '#fd7e14',
        iconColor: '#fff',
        title: `Will expire on ${expireDate.toLocaleDateString()}`
      });
    }
  }
  
  // Generate HTML
  return `
    <div class="recipe-badges">
      ${badges.map(badge => `
        <span class="recipe-badge ${badge.class}" 
              style="background: ${badge.bgColor};"
              title="${badge.title || badge.text}">
          <i class="${badge.icon} badge-icon" style="color: ${badge.iconColor};"></i>
          <span class="badge-text">${badge.text}</span>
        </span>
      `).join('')}
    </div>
  `;
}

/// Alternatives
// Ownership:

// fa-user (person)
// fa-crown (VIP feel)
// fa-star (featured)
// fa-id-badge (ID card)

// Incomplete:

// fa-triangle-exclamation (warning)
// fa-circle-exclamation (alert)
// fa-clipboard-question (missing)

// Draft:

// fa-file-pen (editing)
// fa-pencil (draft)
// fa-eye-slash (hidden)

// Scheduled:

// fa-clock (time)
// fa-calendar-days (scheduled)
// fa-calendar-plus (upcoming)

// Expiring:

// fa-hourglass-end (time running out)
// fa-calendar-xmark (expiring)
// fa-clock-rotate-left (countdown)

// Expired:

// fa-lock (locked)
// fa-ban (blocked)
// fa-circle-xmark (closed)