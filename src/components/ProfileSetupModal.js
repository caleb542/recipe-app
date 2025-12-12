// ProfileSetupModal.js
// First-time user profile setup modal - Accessible Dialog Version

import { getToken } from '../auth/auth0.js';

export class ProfileSetupModal {
  constructor() {
    this.selectedRating = 0;
    this.usernameAvailable = false;
    this.usernameChecking = false;
    this.checkUsernameTimeout = null;
    
    this.render();
    this.attachEventListeners();
    this.show();
  }

  render() {
    const dialogHTML = `
      <dialog id="profile-setup-dialog" class="profile-setup-dialog">
        <div class="dialog-content">
          <div class="dialog-header">
            <h2>Welcome! Set up your profile</h2>
            <p class="dialog-subtitle">Choose how you'll appear on Recipe Me</p>
          </div>

          <form id="profile-setup-form" method="dialog">
            <!-- Username -->
            <div class="form-field">
              <label for="username">
                Username <span class="required" aria-label="required">*</span>
              </label>
              <div class="input-wrapper">
                <input
                  type="text"
                  id="username"
                  name="username"
                  class="form-input"
                  placeholder="chef_caleb"
                  required
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  minlength="3"
                  maxlength="20"
                  aria-describedby="username-help username-validation"
                />
                <span id="username-validation" class="validation-msg" role="alert"></span>
              </div>
              <p id="username-help" class="field-help">3-20 characters: lowercase letters, numbers, underscores</p>
            </div>

            <!-- Display Name -->
            <div class="form-field">
              <label for="displayName">
                Display Name <span class="required" aria-label="required">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                class="form-input"
                placeholder="Chef Caleb"
                required
                maxlength="50"
                aria-describedby="displayname-help"
              />
              <p id="displayname-help" class="field-help">Your name as it appears in reviews and recipes</p>
            </div>

            <!-- Avatar Preview -->
            <div class="form-field">
              <label>Avatar Preview</label>
              <div class="avatar-preview-section">
                <div class="avatar-preview-large" id="avatar-preview" aria-live="polite">
                  <span class="initials" id="initials-display">??</span>
                </div>
                <p class="avatar-help">Your initials will be used as your avatar</p>
              </div>
            </div>

            <!-- Submit -->
            <div class="form-actions">
              <button
                type="submit"
                class="btn-submit"
                id="submit-btn"
                disabled
                aria-busy="false"
              >
                Complete Setup
              </button>
            </div>
          </form>
        </div>
      </dialog>
    `;

    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    this.dialog = document.getElementById('profile-setup-dialog');
    this.injectCSS();
  }

  show() {
    // Show as modal (can't be closed by clicking backdrop or ESC)
    if (this.dialog) {
      this.dialog.showModal();
      
      // Prevent closing with ESC or backdrop click
      this.dialog.addEventListener('cancel', (e) => {
        e.preventDefault();
      });
      
      this.dialog.addEventListener('click', (e) => {
        // Prevent closing when clicking backdrop
        if (e.target === this.dialog) {
          e.preventDefault();
        }
      });
    }
  }

  attachEventListeners() {
    const form = document.getElementById('profile-setup-form');
    const usernameInput = document.getElementById('username');
    const displayNameInput = document.getElementById('displayName');
    const submitBtn = document.getElementById('submit-btn');

    // Username validation
    usernameInput.addEventListener('input', (e) => {
      let value = e.target.value;
      
      // Force lowercase and remove invalid characters
      value = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      e.target.value = value;

      // Clear previous timeout
      clearTimeout(this.checkUsernameTimeout);

      // Update initials preview
      this.updateInitialsPreview(displayNameInput.value);

      if (value.length === 0) {
        this.showUsernameValidation('', 'neutral');
        this.usernameAvailable = false;
        this.checkFormValidity();
        return;
      }

      if (value.length < 3) {
        this.showUsernameValidation('Too short (min 3 characters)', 'error');
        this.usernameAvailable = false;
        this.checkFormValidity();
        return;
      }

      // Show checking state
      this.showUsernameValidation('Checking availability...', 'checking');
      this.usernameChecking = true;

      // Debounce check
      this.checkUsernameTimeout = setTimeout(() => {
        this.checkUsername(value);
      }, 500);
    });

    // Display name - update initials preview
    displayNameInput.addEventListener('input', (e) => {
      this.updateInitialsPreview(e.target.value);
      this.checkFormValidity();
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  }

  async checkUsername(username) {
    try {
      const response = await fetch(
        `/.netlify/functions/check-username?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        throw new Error('Failed to check username');
      }

      const data = await response.json();
      this.usernameChecking = false;

      if (data.available) {
        this.showUsernameValidation('✓ Available', 'success');
        this.usernameAvailable = true;
      } else {
        this.showUsernameValidation(
          data.reason || '✗ Username taken',
          'error'
        );
        this.usernameAvailable = false;
      }

      this.checkFormValidity();
    } catch (error) {
      console.error('Username check error:', error);
      this.usernameChecking = false;
      // Don't show error to user - just mark as unavailable to be safe
      this.showUsernameValidation('Unable to verify, try a different username', 'error');
      this.usernameAvailable = false;
      this.checkFormValidity();
    }
  }

  showUsernameValidation(message, type) {
    const validationEl = document.getElementById('username-validation');
    if (!validationEl) return;
    
    validationEl.textContent = message;
    validationEl.className = `validation-msg ${type}`;
  }

  updateInitialsPreview(displayName) {
    const initialsDisplay = document.getElementById('initials-display');
    if (!initialsDisplay) return;

    if (!displayName || displayName.trim() === '') {
      initialsDisplay.textContent = '??';
      return;
    }

    const parts = displayName.trim().split(/\s+/);
    let initials;
    
    if (parts.length === 1) {
      initials = parts[0].substring(0, 2).toUpperCase();
    } else {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    
    initialsDisplay.textContent = initials;
  }

  checkFormValidity() {
    const usernameInput = document.getElementById('username');
    const displayNameInput = document.getElementById('displayName');
    const submitBtn = document.getElementById('submit-btn');

    if (!usernameInput || !displayNameInput || !submitBtn) return;

    const isValid =
      usernameInput.value.length >= 3 &&
      this.usernameAvailable &&
      !this.usernameChecking &&
      displayNameInput.value.trim().length > 0;

    submitBtn.disabled = !isValid;
  }

  async handleSubmit() {
    const username = document.getElementById('username').value;
    const displayName = document.getElementById('displayName').value;
    const submitBtn = document.getElementById('submit-btn');
    const initialsDisplay = document.getElementById('initials-display');

    if (!submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.textContent = 'Creating profile...';

    try {
      const token = await getToken();

      const response = await fetch('/.netlify/functions/user-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          displayName: displayName.trim(),
          avatarType: 'initials'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create profile');
      }

      const user = await response.json();
      
      // Store user profile
      localStorage.setItem('userProfile', JSON.stringify(user));

      // Success - close and reload
      this.close();
      window.location.reload();

    } catch (error) {
      console.error('Profile setup error:', error);
      alert(`Failed to create profile: ${error.message}\n\nPlease try again.`);
      
      submitBtn.disabled = false;
      submitBtn.setAttribute('aria-busy', 'false');
      submitBtn.textContent = 'Complete Setup';
    }
  }

  close() {
    if (this.dialog) {
      this.dialog.close();
      this.dialog.remove();
    }
  }
}