// auth0.js - Auth0 authentication module
import { createAuth0Client } from '@auth0/auth0-spa-js';

let auth0 = null;

// Initialize Auth0 client
export const initAuth0 = async () => {

   // ✅ ADD THESE LINES
  console.log('🔧 Auth0 Config Check:');
  console.log('   Domain:', process.env.AUTH0_DOMAIN);
  console.log('   Client ID:', process.env.AUTH0_CLIENT_ID ? 'Set ✓' : 'Missing ✗');
  console.log('   Audience:', process.env.AUTH0_AUDIENCE);
  
  if (!process.env.AUTH0_AUDIENCE) {
    console.error('❌ CRITICAL: AUTH0_AUDIENCE is undefined!');
  }

  auth0 = await createAuth0Client({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: process.env.AUTH0_AUDIENCE, // ← Add this!
      scope: 'openid profile email'
    }
  });

  // Handle callback if returning from Auth0
  await handleCallback();
  
  // Update UI based on auth state
  await updateUI();
  
  return auth0;
};

// Handle the redirect callback
const handleCallback = async () => {
  const query = window.location.search;
  if (query.includes('code=') && query.includes('state=')) {
    try {
      await auth0.handleRedirectCallback();
      window.history.replaceState({}, document.title, '/');
    } catch (error) {
      console.error('Error handling callback:', error);
    }
  }
};

// Update UI based on authentication state
const updateUI = async () => {
  const isAuthenticated = await auth0.isAuthenticated();
  
  if (isAuthenticated) {
    // User is logged in
    const user = await auth0.getUser();
    
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userProfile = document.getElementById('user-profile');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userProfile) userProfile.textContent = `Welcome, ${user.name}`;
    
    // Get token for API calls
    // const token = await getToken();
    // if (token) {
    //   // You can now make authenticated API calls
    //   console.log('User authenticated with token');
    // }
  } else {
    // User is not logged in
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userProfile = document.getElementById('user-profile');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userProfile) userProfile.textContent = '';
  }
};

// Export login function
export const login = async () => {
  if (!auth0) {
    throw new Error('Auth0 client not initialized. Call initAuth0() first.');
  }
  await auth0.loginWithRedirect({
    authorizationParams: {
      redirect_uri: window.location.href,
      scope: 'openid profile email'  // ← Return to current page (including hash)
    }
  });
};

export const logout = () => {
  if (!auth0) {
    throw new Error('Auth0 client not initialized. Call initAuth0() first.');
  }
  
  // Check if current page requires auth
  const protectedPages = ['/edit.html', '/addRecipe.html'];
  const currentPath = window.location.pathname;
  const isProtected = protectedPages.some(page => currentPath.includes(page));
  
  const returnUrl = isProtected 
    ? window.location.origin
    : window.location.href;
  
  console.log('🚪 Logging out...');
  console.log('   Current path:', currentPath);
  console.log('   Is protected:', isProtected);
  console.log('   Return URL:', returnUrl);
  
  auth0.logout({
    logoutParams: {
      returnTo: returnUrl
    }
  });
};

// Export function to check if user is authenticated
export const isAuthenticated = async () => {
  if (!auth0) {
    throw new Error('Auth0 client not initialized. Call initAuth0() first.');
  }
  return await auth0.isAuthenticated();
};

// Export function to get user profile
export const getUser = async () => {
  if (!auth0) {
    throw new Error('Auth0 client not initialized. Call initAuth0() first.');
  }
  return await auth0.getUser();
};

// Export function to get access token
export const getToken = async () => {
  if (!auth0) {
    throw new Error('Auth0 client not initialized. Call initAuth0() first.');
  }
  try {
    return await auth0.getTokenSilently();
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Export function for making authenticated API calls
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No access token available');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  });
  
  return response;
};

// Export the auth0 client instance getter
export const getAuth0Client = () => {
  if (!auth0) {
    throw new Error('Auth0 client not initialized. Call initAuth0() first.');
  }
  return auth0;
};