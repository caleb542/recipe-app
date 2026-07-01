import { isSuperadmin } from '../userContext.js';
import { logout } from '../auth/auth0.js';
import { toggleBadgeVisibility, areBadgesHidden } from '../utils/badgeVisibility.js';

function getAvatarSVG(initials = '') {
  return `<svg class="header-avatar-default" viewBox="0 0 36 36" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="18" fill="#e8e0d5"/>
    <circle cx="18" cy="14" r="6" fill="#c8a882"/>
    <path d="M6 30c0-6.627 5.373-10 12-10s12 3.373 12 10" fill="#c8a882"/>
    ${initials ? `<text x="18" y="22" text-anchor="middle" font-size="11" font-weight="600" fill="#fff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" letter-spacing="0.5">${initials}</text>` : ''}
  </svg>`;
}

export function setupAvatarDropdown(user, avatar) {
  const avatarContainer = document.getElementById('user-avatar-container');
  const dialog = document.getElementById('avatar-dialog');
  if (!avatarContainer || !dialog) return;

  const displayName = user.profile?.displayName || user.username || 'User';
  const isSuperAdmin = isSuperadmin();

  // ----------------------------------------
  // Render avatar button with SVG default
  // ----------------------------------------
 const initials = avatar?.type === 'initials' ? avatar.initials : '';
avatarContainer.innerHTML = `
  <button class="avatar-btn" id="avatar-btn" 
    aria-expanded="false" 
    aria-haspopup="dialog"
    aria-controls="avatar-dialog">
    ${getAvatarSVG(initials)}
  </button>
`;

  // Silently swap to real image once loaded
  if (avatar?.type === 'image' && avatar.url) {
    const img = new Image();
    img.onload = () => {
      const avatarBtn = document.getElementById('avatar-btn');
      const svgEl = avatarBtn?.querySelector('.header-avatar-default');
      if (svgEl) {
        const imgEl = document.createElement('img');
        imgEl.src = avatar.url;
        imgEl.alt = displayName;
        imgEl.className = 'header-avatar';
        svgEl.replaceWith(imgEl);
      }
    };
    img.src = avatar.url;
  }

  // ----------------------------------------
  // Populate dialog content
  // ----------------------------------------
const avatarImgHTML = avatar?.type === 'image'
  ? `<img src="${avatar.url}" alt="${displayName}" class="avatar-dropdown-avatar">`
  : getAvatarSVG(initials);

  dialog.innerHTML = `
  <button class="avatar-dialog-close" id="avatar-dialog-close" aria-label="Close menu">
    <i class="fa-solid fa-xmark"></i>
  </button>
  <div class="avatar-dropdown-header">
    ${avatarImgHTML}
    <p class="avatar-dropdown-name">${displayName}</p>
    <p class="avatar-dropdown-role ${isSuperAdmin ? 'is-superadmin' : ''}">
      ${isSuperAdmin ? '★ Superadmin' : 'Member'}
    </p>
  </div>
  <div class="avatar-dropdown-divider"></div>
  <a href="/profile.html?username=${user.username}" class="avatar-dropdown-item">
    <i class="fa-solid fa-user"></i> Visit Profile
  </a>
  <a href="/profile.html?username=${user.username}#edit" class="avatar-dropdown-item">
    <i class="fa-solid fa-pen"></i> Edit Profile
  </a>
  ${isSuperAdmin ? `
  <div class="avatar-dropdown-divider"></div>
  <a href="/admin.html" class="avatar-dropdown-item">
    <i class="fa-solid fa-shield-halved"></i> Admin Panel
  </a>
  ` : ''}
  <div class="avatar-dropdown-divider"></div>
  <button class="avatar-dropdown-item" id="avatar-badge-toggle">
    <i class="fa-solid fa-eye"></i> <span id="avatar-badge-toggle-label">Hide recipe badges</span>
  </button>
  <div class="avatar-dropdown-divider"></div>
  <button class="avatar-dropdown-item avatar-dropdown-signout" id="avatar-signout">
    <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
  </button>
`;

  // ----------------------------------------
  // Wire up open/close
  // ----------------------------------------
  const btn = document.getElementById('avatar-btn');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dialog.open) {
      closeDialog();
    } else {
      openDialog();
    }
  });

  // Sign out
  dialog.querySelector('#avatar-signout')?.addEventListener('click', () => {
    localStorage.removeItem('userProfile');
    logout();
  });

  const badgeToggleBtn = dialog.querySelector('#avatar-badge-toggle');
const badgeToggleLabel = dialog.querySelector('#avatar-badge-toggle-label');
if (badgeToggleBtn) {
  // sync initial state
  const hidden = areBadgesHidden();
  badgeToggleLabel.textContent = hidden ? 'Show recipe badges' : 'Hide recipe badges';
  badgeToggleBtn.querySelector('i').className = `fa-solid fa-eye${hidden ? '' : '-slash'}`;

  badgeToggleBtn.addEventListener('click', () => {
    const nowVisible = toggleBadgeVisibility();
    const nowHidden = !nowVisible;
    badgeToggleLabel.textContent = nowHidden ? 'Show recipe badges' : 'Hide recipe badges';
    badgeToggleBtn.querySelector('i').className = `fa-solid fa-eye${nowHidden ? '' : '-slash'}`;
  });
}
  // Close on item click
  dialog.querySelectorAll('.avatar-dialog-close').forEach(item => {
    item.addEventListener('click', () => closeDialog());
  });

  // Close on backdrop click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });

  // Escape key handled natively by dialog

  function openDialog() {
    const rect = btn.getBoundingClientRect();
    dialog.style.position = 'fixed';
    dialog.style.margin = '0';
    dialog.style.top = `${rect.bottom + 6}px`;
    dialog.style.left = `unset`;
    dialog.style.right = `${window.innerWidth - (rect.right)}px`;
    dialog.showModal();
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeDialog() {
    dialog.style.animation = 'avatarDropdownClose 0.35s ease-in forwards';
    dialog.addEventListener('animationend', () => {
      dialog.close();
      dialog.style.animation = '';
      btn.setAttribute('aria-expanded', 'false');
    }, { once: true });
  }
}