// userContext.js
// Manages user profile state and loading

import { getToken, isAuthenticated, getUser as getAuth0User } from './auth/auth0.js';
import { ProfileSetupModal } from './components/ProfileSetupModal.js';

let currentUserProfile = null;

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
      console.log("!!!!!!!!!! Should be returning currentUserProfile")
      return currentUserProfile;
    }
    // Fetch fresh profile from API
     console.log("???????????????  FUUUUCK looking for tokern")
    const token = await getToken();
    const response = await fetch('/.netlify/functions/user-profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

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
      throw new Error('Failed to load profile');
    }

    const profile = await response.json();
    
    // Update cache
    currentUserProfile = profile;
    localStorage.setItem('userProfile', JSON.stringify(profile));

    console.log('✓ User profile loaded:', profile.username);
    return profile;

  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}

// Get current user profile (from memory)
export function getUserProfile() {
  return currentUserProfile;
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
  localStorage.removeItem('userProfile');
}

// Get user's display name
export function getUserDisplayName() {
  return currentUserProfile?.profile?.displayName || 'User';
}

// Get user's avatar
export function getUserAvatar() {
  const avatar = currentUserProfile?.avatar;
  if (!avatar) return null;

  if (avatar.type === 'initials') {
    return {
      type: 'initials',
      initials: avatar.initials || '??'
    };
  }

  if (avatar.type === 'gravatar' || avatar.type === 'upload') {
    return {
      type: 'image',
      url: avatar.url
    };
  }

  return null;
}