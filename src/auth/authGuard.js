// src/auth/authGuard.js
import { initAuth0, isAuthenticated, getAuth0Client } from './auth0.js';

let guardInitialized = false;

export function setupAddRecipeGuard() {
  if (guardInitialized) return;
  guardInitialized = true;

  document.addEventListener('click', async (e) => {
    const trigger = e.target.closest('.add-recipe-card, [data-requires-auth]');
    if (!trigger) return;

    const authed = await isAuthenticated();
    if (authed) return;

    e.preventDefault();
    showLoginPrompt();
  });
}

export async function redirectToAuth(screenHint) {
  await initAuth0();
  const auth0 = getAuth0Client();

  const returnTo = window.location.href;

  await auth0.loginWithRedirect({
    authorizationParams: {
      redirect_uri: window.location.origin + '/callback',
      scope: 'openid profile email',
      screen_hint: screenHint
    },
    appState: {
      returnTo: returnTo
    }
  });
}

async function showLoginPrompt() {
  const dialog = document.createElement('dialog');
  dialog.className = 'auth-prompt-dialog';
  dialog.innerHTML = `
    <div class="auth-prompt-card">
      <h2>Sign in to add a recipe</h2>
      <p>You'll need an account to create and save recipes.</p>
      <div class="auth-prompt-actions">
        <button class="btn-primary" id="auth-prompt-register">Register</button>
        <button class="btn-secondary" id="auth-prompt-login">Log In</button>
      </div>
      <button class="btn-text" id="auth-prompt-dismiss">No thanks</button>
    </div>
  `;
  document.body.appendChild(dialog);
  dialog.showModal();

  const closeDialog = () => {
    dialog.close();
    dialog.remove();
  };

  dialog.querySelector('#auth-prompt-dismiss').addEventListener('click', closeDialog);

  dialog.querySelector('#auth-prompt-register').addEventListener('click', async () => {
    closeDialog();
    await redirectToAuth('signup');
  });

  dialog.querySelector('#auth-prompt-login').addEventListener('click', async () => {
    closeDialog();
    await redirectToAuth('login');
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });
}