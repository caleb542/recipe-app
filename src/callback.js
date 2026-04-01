import { initAuth0 } from './auth/auth0.js';

async function handleCallback() {
    try {
        await initAuth0();
        // auth0.js handleCallback reads appState.returnTo and redirects
    } catch (error) {
        console.error('Callback error:', error);
        window.location.href = '/';
    }
}

handleCallback();