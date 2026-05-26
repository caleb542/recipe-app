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
  cacheLocation: 'localstorage', // ← add this
  authorizationParams: {
    redirect_uri: window.location.origin + '/callback',
    audience: process.env.AUTH0_AUDIENCE,
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
  const url = new URL(window.location.href);
  
  console.log('🔍 handleCallback called');
  console.log('   Full href:', window.location.href);
  console.log('   URL pathname:', url.pathname);
  console.log('   URL search:', url.search);

  // Handle error first — declined consent, etc.
  if (url.searchParams.has('error')) {
    const error = url.searchParams.get('error');
    const desc = url.searchParams.get('error_description');
    console.error('❌ Auth error:', error, desc);
    window.location.href = '/';
    return;
  }

  if (url.searchParams.has('code') && url.searchParams.has('state')) {
    console.log('✅ Auth code found in URL');
    try {
      console.log('🔄 Processing callback...');
      const result = await auth0.handleRedirectCallback();
      console.log('📦 Result:', result);
      const returnTo = result.appState?.returnTo || '/';
      console.log('✅ Login successful, redirecting to:', returnTo);
      window.location.href = returnTo;
    } catch (error) {
      console.error('❌ Error handling callback:', error);
      window.location.href = '/';
    }
  } else {
    console.log('⚠️ No auth code in URL');
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
  
  // ✅ Store current URL to return to after login
  const returnTo = window.location.href;
  
  console.log('🔑 Logging in...');
  console.log('   Return to:', returnTo);
  
  await auth0.loginWithRedirect({
    authorizationParams: {
      redirect_uri: window.location.origin + '/callback', // Single callback URL
      scope: 'openid profile email'
    },
    appState: {
      returnTo: returnTo  // ✅ Store where to return
    }
  });
};

export const logout = () => {
  if (!auth0) {
    throw new Error('Auth0 client not initialized. Call initAuth0() first.');
  }
  
  console.log('🚪 Logging out...');
  console.log('   From:', window.location.pathname);
  
  localStorage.removeItem('userProfile');
  
  auth0.logout({
    logoutParams: {
      returnTo: window.location.origin
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
    const authenticated = await auth0.isAuthenticated();
    if (!authenticated) return null;
    
    return await auth0.getTokenSilently();
  } catch (error) {
    // Token expired or refresh token expired — force fresh token from server
    if (
      error.error === 'login_required' ||
      error.error === 'consent_required' ||
      error.error === 'missing_refresh_token' ||
      error.message?.includes('expired')
    ) {
      console.warn('⚠️ Token expired, attempting silent refresh...');
      try {
        return await auth0.getTokenSilently({ cacheMode: 'off' });
      } catch (refreshError) {
        console.warn('⚠️ Silent refresh failed, user needs to re-authenticate');
        // Clear stale state
        localStorage.removeItem('userProfile');
        // Don't force redirect here — let the caller decide
        return null;
      }
    }

    console.error('Error getting token:', error);
    return null;
  }
};

// Export function to get ID token claims
export const getIdTokenClaims = async () => {
  if (!auth0) {
    throw new Error('Auth0 client not initialized. Call initAuth0() first.');
  }
  try {
    return await auth0.getIdTokenClaims();
  } catch (error) {
    console.error('Error getting ID token:', error);
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