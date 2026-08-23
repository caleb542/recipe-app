import { isAuthenticated, getUser, login, logout } from './auth0.js';
import { redirectToAuth } from './authGuard.js';
import { getUserProfile, getUserAvatar } from '../userContext.js';
import { setupAvatarDropdown } from '../components/AvatarDropdown.js';

// Update the header based on auth status
export async function updateAuthUI() {
  const authenticated = await isAuthenticated();
  const loginBtn = document.getElementById('login-btn');
  const signUpBtn = document.getElementById('auth-prompt-register');
  const userInfo = document.getElementById('user-info');

  if (!loginBtn || !userInfo || !signUpBtn) {
    console.warn('Auth UI elements not found');
    return;
  }

  if (authenticated) {
    signUpBtn.style.display = 'none';
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';

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
        document.getElementById('username-btn')?.addEventListener('click', () => {
          document.getElementById('avatar-btn')?.click();
        });
      }
    } else {
      // Profile not loaded yet — try Auth0 user directly
      const auth0User = await getUser();
      if (auth0User) {
        setupAvatarDropdown(auth0User, auth0User.picture);
        if (userNameElement) {
          const displayName = auth0User.name || auth0User.nickname || 'User';
          userNameElement.innerHTML = `
            <button class="user-profile-link" id="username-btn">${displayName}</button>
          `;
          document.getElementById('username-btn')?.addEventListener('click', () => {
            document.getElementById('avatar-btn')?.click();
          });
        }
      } else {
        // No Auth0 user either — show SVG default
        if (avatarContainer) {
          avatarContainer.innerHTML = `
            <button class="avatar-btn" id="avatar-btn" aria-expanded="false" aria-haspopup="true">
              <svg class="header-avatar-default" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="18" fill="#e8e0d5"/>
                <circle cx="18" cy="14" r="6" fill="#c8a882"/>
                <path d="M6 30c0-6.627 5.373-10 12-10s12 3.373 12 10" fill="#c8a882"/>
              </svg>
            </button>
          `;
        }
      }
    }
  } else {
    signUpBtn.style.display = 'block';
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
  }
}

// Set up login/logout button listeners
export const setupAuthListeners = () => {
  const loginBtn = document.getElementById('login-btn');
  const signUpBtn = document.getElementById('auth-prompt-register');
  const logoutBtn = document.getElementById('logout-btn');

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      await login();
    });
  }
  if (signUpBtn) {
    signUpBtn.addEventListener('click', async () => {
      await redirectToAuth('signup');
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userProfile');
      logout();
    });
  }
};