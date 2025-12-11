import { isAuthenticated, getUser, login, logout } from './auth0.js';

// Update the header based on auth status
export const updateAuthUI = async () => {
  try {
    const authenticated = await isAuthenticated();
    
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    
    if (authenticated) {
      const user = await getUser();
      
      // Show user info, hide login
      if (loginBtn) loginBtn.style.display = 'none';
      if (userInfo) userInfo.style.display = 'flex';
      if (userName) userName.textContent = `Hi, ${user.name || user.email}`;
      
    } else {
      // Show login, hide user info
      if (loginBtn) loginBtn.style.display = 'block';
      if (userInfo) userInfo.style.display = 'none';
    }
  } catch (error) {
    console.error('Error updating auth UI:', error);
  }
};

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