import { isAuthenticated, getUser, login, logout } from './auth0.js';
import { getUserProfile, getUserAvatar } from '../userContext.js';
import { setupAvatarDropdown } from '../components/AvatarDropdown.js';

// Update the header based on auth status
export async function updateAuthUI() {
  const authenticated = await isAuthenticated();
  const loginBtn = document.getElementById('login-btn');
  const userInfo = document.getElementById('user-info');
  
  if (!loginBtn || !userInfo) {
    console.warn('Auth UI elements not found');
    return;
  }
  
  if (authenticated) {
  loginBtn.style.display = 'none';
  userInfo.style.display = 'flex';
  userInfo.style.alignItems = 'center';
  userInfo.style.gap = '0.5rem';

  const user = getUserProfile();
  const userNameElement = document.getElementById('user-name');
  const avatarContainer = document.getElementById('user-avatar-container');

  if (user) {
    const avatar = getUserAvatar();
    setupAvatarDropdown(user, avatar);

   if (userNameElement) {
      const displayName = user.profile?.displayName || user.username || 'User';
      userNameElement.innerHTML = `
        <button class="user-profile-link" id="username-btn">${displayName}</button>
      `;

      // Wire to same dropdown as avatar
      document.getElementById('username-btn')?.addEventListener('click', () => {
        document.getElementById('avatar-btn')?.click();
      });
    }
  } else {
    // Profile not loaded yet - show loading state
    if (userNameElement) {
      userNameElement.textContent = 'Loading...';
    }
    if (avatarContainer) {
      avatarContainer.innerHTML = `
        <div class="header-avatar-initials">...</div>
      `;
    }
  }
} else {
  loginBtn.style.display = 'inline-block';
  userInfo.style.display = 'none';
}
}
// Set up login/logout button listeners
export const setupAuthListeners = () => {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      
      await login();
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userProfile');
      logout();
    });
  }
};