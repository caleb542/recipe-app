/**
 * components/ImpersonationBanner.js
 * Shows when admin is impersonating another user
 */

import { isImpersonating, getEffectiveUser, stopImpersonation } from '../userContext.js';

export function initImpersonationBanner() {
  if (!isImpersonating()) return;
  
  const effectiveUser = getEffectiveUser();
  
  const banner = document.createElement('div');
  banner.className = 'impersonation-banner';
  banner.innerHTML = `
    <div class="impersonation-banner__content">
      <span class="impersonation-banner__icon">🎭</span>
      <span class="impersonation-banner__text">
        Viewing as <strong>${effectiveUser.username || effectiveUser.email}</strong>
      </span>
      <button class="impersonation-banner__exit" id="exit-impersonation">
        Exit Impersonation
      </button>
    </div>
  `;
  
  document.body.prepend(banner);
  
  // Wire up exit button
  document.getElementById('exit-impersonation')?.addEventListener('click', () => {
    if (confirm('Exit impersonation and return to admin view?')) {
      stopImpersonation();
    }
  });
  
  // Listen for impersonation changes
  window.addEventListener('impersonationChanged', () => {
    if (!isImpersonating()) {
      banner.remove();
    }
  });
}