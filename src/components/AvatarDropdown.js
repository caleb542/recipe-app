import { isSuperadmin } from '../userContext.js';
import { logout } from '../auth/auth0.js';

export function setupAvatarDropdown(user, avatar) {
  const avatarContainer = document.getElementById('user-avatar-container');
  if (!avatarContainer) return;

  const avatarHTML = avatar?.type === 'image'
    ? `<img src="${avatar.url}" alt="Profile" class="header-avatar">`
    : `<div class="header-avatar-initials">${avatar?.initials || '??'}</div>`;

  const displayName = user.profile?.displayName || user.username || 'User';
  const role = isSuperadmin() ? 'Superadmin' : 'Member';

  avatarContainer.innerHTML = `
    <button class="avatar-btn" id="avatar-btn" aria-expanded="false" aria-haspopup="true">
      ${avatarHTML}
    </button>
  `;

  const btn = document.getElementById('avatar-btn');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown(btn, user, displayName, role, avatar);
    }
  });
}

function openDropdown(btn, user, displayName, role, avatar) {
  closeDropdown();

  const dropdown = document.createElement('div');
  dropdown.id = 'avatar-dropdown';
  dropdown.className = 'avatar-dropdown';

  const isSuperAdmin = isSuperadmin();

  const avatarImgHTML = avatar?.type === 'image'
    ? `<img src="${avatar.url}" alt="${displayName}" class="avatar-dropdown-avatar">`
    : `<div class="avatar-dropdown-avatar initials">${avatar?.initials || '??'}</div>`;

  dropdown.innerHTML = `
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
    <button class="avatar-dropdown-item avatar-dropdown-signout" id="avatar-signout">
      <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
    </button>
  `;

  // Position relative to button
  document.body.appendChild(dropdown);

  const rect = btn.getBoundingClientRect();

  dropdown.style.top = `${rect.bottom + 8}px`;
  dropdown.style.right = `${window.innerWidth - rect.right}px`;

  btn.setAttribute('aria-expanded', 'true');

  // Sign out
  document.getElementById('avatar-signout')?.addEventListener('click', () => {
    localStorage.removeItem('userProfile');
    logout();
  });

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', outsideClickHandler);
  }, 0);

  // Close on scroll
  window.addEventListener('scroll', closeDropdown, { passive: true, once: true });
}

function outsideClickHandler(e) {
  const dropdown = document.getElementById('avatar-dropdown');
  const btn = document.getElementById('avatar-btn');
  if (dropdown && !dropdown.contains(e.target) && e.target !== btn) {
    closeDropdown();
  }
}

function closeDropdown() {
  const dropdown = document.getElementById('avatar-dropdown');
  const btn = document.getElementById('avatar-btn');

  if (dropdown) {
    // Both animations start at the same time
    dropdown.style.animation = 'avatarDropdownClose 0.35s linear forwards';
    
    if (btn) {
      btn.style.animation = 'avatarGulp 0.7s linear forwards 0.1s';
      btn.addEventListener('animationend', () => {
        btn.style.animation = '';
      }, { once: true });
    }

    // Remove dropdown after its animation completes
    dropdown.addEventListener('animationend', () => {
      dropdown.remove();
    }, { once: true });
  }

  btn?.setAttribute('aria-expanded', 'false');
  document.removeEventListener('click', outsideClickHandler);
}