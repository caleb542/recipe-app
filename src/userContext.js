// userContext.js
// Manages user profile state, loading, and impersonation

import { getToken, isAuthenticated, getUser as getAuth0User } from './auth/auth0.js';
import { ProfileSetupModal } from './components/ProfileSetupModal.js';
import { getIdTokenClaims } from './auth/auth0.js';

let currentUserProfile = null;
let impersonationState = {
  isImpersonating: false,
  actualUser: null,
  effectiveUser: null
};

// ✅ NEW: Superadmin list
const SUPERADMINS = [
  'caleb542@gmail.com',
  // Add more superadmin emails here
];

// Load user profile from API
export async function loadUserProfile(skipFetch = false) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      currentUserProfile = null;
      localStorage.removeItem('userProfile');
      return null;
    }

    // Try localStorage first (faster)
    const cached = localStorage.getItem('userProfile');
    if (cached) {
      currentUserProfile = JSON.parse(cached);
    }
    
    // ✅ Skip fetch if requested or if we have cache
    if (skipFetch || cached) {
      // ✅ NEW: Check if user is superadmin
      if (currentUserProfile) {
        currentUserProfile.isSuperadmin = SUPERADMINS.includes(currentUserProfile.email);
      }
      
      // ✅ NEW: Restore impersonation state if exists
      await restoreImpersonationState();
      
      return currentUserProfile;
    }
    
    // Fetch fresh profile from API


const idToken = await getIdTokenClaims();
console.log("idToken: ", idToken);
const response = await fetch('/.netlify/functions/user-profile', {
  headers: {
    'Authorization': `Bearer ${idToken.__raw}` // Use ID token instead
  }
});
console.log('response',response);
   if (response.status === 404) {
      // Profile doesn't exist - show setup modal
      const data = await response.json();
      if (data.needsSetup) {
        console.log('👋 First-time user - showing profile setup');
        new ProfileSetupModal();
        return null;
      }
    }

    if (!response.ok) {
      // ✅ Better error logging
      let errorMessage = `Failed to load profile: ${response.status}`;
      try {
        const errorData = await response.text();
        console.error('🔴 Profile API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData
        });
        errorMessage += ` - ${errorData}`;
      } catch (e) {
        console.error('Could not parse error response');
      }
      throw new Error(errorMessage);
    }

    const profile = await response.json();
    
    // ✅ NEW: Add superadmin flag
    profile.isSuperadmin = SUPERADMINS.includes(profile.email);
    
    // Update cache
    currentUserProfile = profile;
    localStorage.setItem('userProfile', JSON.stringify(profile));

    console.log('✓ User profile loaded:', profile.username);
    
    // ✅ NEW: Restore impersonation state if exists
    await restoreImpersonationState();
    
    return profile;

  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}

// ✅ NEW: Restore impersonation state from session storage
async function restoreImpersonationState() {
  if (!currentUserProfile?.isSuperadmin) return;
  
  const storedImpersonation = sessionStorage.getItem('impersonation');
  if (storedImpersonation) {
    try {
      const state = JSON.parse(storedImpersonation);
      impersonationState = {
        isImpersonating: true,
        actualUser: currentUserProfile,
        effectiveUser: state.effectiveUser
      };
      console.log('🎭 Impersonation restored:', state.effectiveUser.username);
    } catch (error) {
      console.error('Failed to restore impersonation state:', error);
      sessionStorage.removeItem('impersonation');
    }
  }
}

// Get current user profile (from memory)
// ✅ UPDATED: Returns effective user if impersonating
export function getUserProfile() {
  return getEffectiveUser();
}

// ✅ NEW: Get the actual logged-in user (never changes during session)
export function getActualUser() {
  if (impersonationState.isImpersonating) {
    return impersonationState.actualUser;
  }
  return currentUserProfile;
}

// ✅ NEW: Get the effective user (who we're acting as)
export function getEffectiveUser() {
  if (impersonationState.isImpersonating) {
    return impersonationState.effectiveUser;
  }
  return currentUserProfile;
}

// ✅ NEW: Check if current actual user is a superadmin
export function isSuperadmin() {
  const actual = getActualUser();
  return actual?.isSuperadmin || false;
}

// ✅ NEW: Check if currently impersonating
export function isImpersonating() {
  return impersonationState.isImpersonating;
}

// ✅ NEW: Get impersonation state
export function getImpersonationState() {
  return { ...impersonationState };
}

// ✅ NEW: Start impersonating a user
export async function startImpersonation(targetUser) {
  if (!isSuperadmin()) {
    throw new Error('Only superadmins can impersonate users');
  }
  
  // Prevent impersonating yourself
  if (targetUser.auth0Id === currentUserProfile.auth0Id) {
    throw new Error('Cannot impersonate yourself');
  }
  
  impersonationState = {
    isImpersonating: true,
    actualUser: currentUserProfile,
    effectiveUser: targetUser
  };
  
  // Persist in session storage
  sessionStorage.setItem('impersonation', JSON.stringify({
    effectiveUser: targetUser
  }));
  
  console.log('🎭 Started impersonating:', targetUser.username);
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('impersonationChanged', {
    detail: { isImpersonating: true, effectiveUser: targetUser }
  }));
  
  // Reload page to apply new permissions
  window.location.reload();
}

// ✅ NEW: Stop impersonating and return to normal mode
export function stopImpersonation() {
  if (!impersonationState.isImpersonating) return;
  
  console.log('🎭 Stopped impersonating');
  
  impersonationState = {
    isImpersonating: false,
    actualUser: null,
    effectiveUser: null
  };
  
  sessionStorage.removeItem('impersonation');
  
  window.dispatchEvent(new CustomEvent('impersonationChanged', {
    detail: { isImpersonating: false }
  }));
  
  // Reload page to restore normal permissions
  window.location.reload();
}

// Update user profile
export async function updateUserProfile(updates) {
  try {
    const token = await getToken();
    const response = await fetch('/.netlify/functions/user-profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    const profile = await response.json();
    
    // ✅ Preserve superadmin flag
    profile.isSuperadmin = SUPERADMINS.includes(profile.email);
    
    // Update cache
    currentUserProfile = profile;
    localStorage.setItem('userProfile', JSON.stringify(profile));

    return profile;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Clear user profile (on logout)
export function clearUserProfile() {
  currentUserProfile = null;
  impersonationState = {
    isImpersonating: false,
    actualUser: null,
    effectiveUser: null
  };
  localStorage.removeItem('userProfile');
  sessionStorage.removeItem('impersonation');
}

// Get user's display name
export function getUserDisplayName() {
  const user = getEffectiveUser();
  return user?.profile?.displayName || 'User';
}

// Get user's avatar
export function getUserAvatar() {
  const user = getEffectiveUser();
  const avatar = user?.avatar;
  if (!avatar) return null;

  if (avatar.type === 'initials') {
    return {
      type: 'initials',
      initials: avatar.initials || '??'
    };
  }

  if (avatar.type === 'gravatar' || avatar.type === 'uploaded') {
    return {
      type: 'image',
      url: avatar.url
    };
  }

  return null;
}

// ✅ NEW: Export superadmins list
export { SUPERADMINS };