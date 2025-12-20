import { isAuthenticated, getUser, login, logout } from './auth0.js';
import { getUserProfile } from '../userContext.js' 

// Update the header based on auth status
export async function updateAuthUI() {
  const authenticated = await isAuthenticated();
    const profile = getUserProfile();
  
  // Get DOM elements
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');

  if (authenticated) {
    const user = await getUser();
    const profile = getUserProfile();  // ← Get cached profile
    
    // Show user info, hide login
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    
    if (userName) {
      if (profile && profile.username) {
        // Use profile data and make it a link
        userName.innerHTML = `Hi, <a href="/profile.html?username=${profile.username}" class="user-profile-link">${profile.profile.displayName}</a>`;
      } else {
        // Fallback to Auth0 data (before profile setup)
        userName.textContent = `Hi, ${user.name || user.email}`;
      }
    }
    
  } else {
    // Show login, hide user info
    if (loginBtn) loginBtn.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';
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
      logout();
    });
  }
};