import { isAuthenticated, getUser, login, logout } from './auth0.js';
import { getUserProfile, getUserAvatar } from '../userContext.js' 

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
    
    // ✅ Only render if user profile exists
    if (user) {
      // Render avatar
      if (avatarContainer) {
        const avatar = getUserAvatar();
        
        if (avatar && avatar.type === 'image') {
          avatarContainer.innerHTML = `
            <a href="/profile.html?username=${user.username}">
              <img src="${avatar.url}" alt="Profile" class="header-avatar">
            </a>
          `;
        } else if (avatar && avatar.type === 'initials') {
          avatarContainer.innerHTML = `
            <a href="/profile.html?username=${user.username}">
              <div class="header-avatar-initials">${avatar.initials}</div>
            </a>
          `;
        } else {
          // Fallback: Show default avatar
          avatarContainer.innerHTML = `
            <a href="/profile.html?username=${user.username}">
              <div class="header-avatar-initials">??</div>
            </a>
          `;
        }
      }
      
      // Render username
      if (userNameElement) {
        const displayName = user.profile?.displayName || user.username || 'User';
        userNameElement.innerHTML = `
          <a href="/profile.html?username=${user.username}" class="user-profile-link">${displayName}</a>
        `;
      }
    } else {
      // ✅ Profile not loaded yet - show loading state
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