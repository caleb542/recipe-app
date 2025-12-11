// CommunityNotes.js
// Community tips, variations, and helpful context - NOT reviews

import { getToken } from '../auth/auth0.js';

export class CommunityNotes {
  constructor(container, recipeId) {
    this.container = container;
    this.recipeId = recipeId;
    this.stats = null;
    this.showAddNote = false;
    this.currentNote = '';
    
    this.init();
  }

  async init() {
    await this.loadNotes();
    this.render();
  }

  async loadNotes() {
    try {
      const token = await getToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(
        `/.netlify/functions/ratings?recipeId=${this.recipeId}&includeComments=true`,
        { headers }
      );
      
      if (response.ok) {
        this.stats = await response.json();
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      this.stats = {
        averageRating: 0,
        totalReviews: 0,
        comments: []
      };
    }
  }

  render() {
    if (!this.stats) return;

    const { averageRating, totalReviews, comments } = this.stats;
    const userRating = this.stats.userRating?.rating || 0;

    this.container.innerHTML = `
      <section class="community-notes">
        <div class="notes-header">
          <h2>Cook's Notes & Tips</h2>
          <p class="notes-subtitle">Share what worked for you, your variations, or helpful context</p>
        </div>

        ${totalReviews > 0 ? `
          <div class="community-stats">
            <div class="stat-item">
              <span class="stat-icon">👩‍🍳</span>
              <span class="stat-text"><strong>${totalReviews}</strong> ${totalReviews === 1 ? 'person has' : 'people have'} made this</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">⭐</span>
              <span class="stat-text"><strong>${averageRating.toFixed(1)}</strong> average rating</span>
            </div>
          </div>
        ` : ''}

        ${this.renderAddNoteSection()}

        <div class="notes-list">
          ${comments.length > 0 ? this.renderNotes(comments) : this.renderEmptyState()}
        </div>
      </section>
    `;

    this.attachEventListeners();
    this.injectCSS();
  }

  renderAddNoteSection() {
    const userRating = this.stats.userRating?.rating || 0;
    const userNote = this.stats.userRating?.comment || '';

    if (userNote) {
      // User already left a note
      return `
        <div class="your-note-card">
          <div class="note-card-header">
            <span class="note-badge">Your Note</span>
            <button class="edit-note-btn" data-action="edit">Edit</button>
          </div>
          <div class="your-note-content">
            <div class="note-rating">${'⭐'.repeat(userRating)}</div>
            <p class="note-text">${this.escapeHtml(userNote)}</p>
          </div>
        </div>
      `;
    }

    if (this.showAddNote) {
      return `
        <div class="add-note-card">
          <div class="note-form">
            <label class="form-label">
              How would you rate this recipe?
              <div class="rating-input" id="note-rating">
                ${[1,2,3,4,5].map(i => `
                  <button type="button" class="star-btn" data-rating="${i}" aria-label="Rate ${i} stars">
                    ⭐
                  </button>
                `).join('')}
              </div>
            </label>
            
            <label class="form-label">
              Share your experience, tips, or variations
              <textarea 
                id="note-input" 
                class="note-textarea"
                placeholder="Example: 'Worked great! I used brown sugar instead of white and baked for 5 minutes longer. Turned out perfect!'"
                rows="4"
                maxlength="1000"
              >${this.currentNote}</textarea>
              <span class="char-count"><span id="char-count">0</span>/1000</span>
            </label>

            <div class="form-actions">
              <button class="btn-secondary" data-action="cancel">Cancel</button>
              <button class="btn-primary" data-action="submit" disabled>Share Note</button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <button class="add-note-btn" data-action="show-form">
        <span class="btn-icon">✏️</span>
        <span>Share your tips & experience</span>
      </button>
    `;
  }

  renderNotes(comments) {
    return comments.map(comment => {
      const date = new Date(comment.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const isHelpful = comment.rating >= 4;
      const needsTweaks = comment.rating === 3;

      return `
        <article class="note-card">
          <div class="note-header">
            <div class="note-author">
              <div class="author-avatar">${this.getInitials(comment.userName)}</div>
              <div class="author-info">
                <div class="author-name">${this.escapeHtml(comment.userName || 'Anonymous Cook')}</div>
                <div class="note-meta">
                  <span class="note-date">${date}</span>
                  <span class="note-separator">•</span>
                  <span class="note-rating">${'⭐'.repeat(comment.rating)}</span>
                  ${isHelpful ? '<span class="helpful-badge">Helpful</span>' : ''}
                  ${needsTweaks ? '<span class="tweaks-badge">With tweaks</span>' : ''}
                </div>
              </div>
            </div>
          </div>
          <div class="note-body">
            <p class="note-text">${this.escapeHtml(comment.comment)}</p>
          </div>
        </article>
      `;
    }).join('');
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No tips yet</h3>
        <p>Be the first to share your experience with this recipe!</p>
      </div>
    `;
  }

  attachEventListeners() {
    // Show add note form
    const showFormBtn = this.container.querySelector('[data-action="show-form"]');
    if (showFormBtn) {
      showFormBtn.addEventListener('click', () => {
        this.showAddNote = true;
        this.render();
      });
    }

    // Cancel adding note
    const cancelBtn = this.container.querySelector('[data-action="cancel"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.showAddNote = false;
        this.currentNote = '';
        this.render();
      });
    }

    // Star rating buttons
    const starBtns = this.container.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedRating = parseInt(btn.dataset.rating);
        // Highlight selected stars
        starBtns.forEach((b, i) => {
          b.classList.toggle('selected', i < this.selectedRating);
        });
        this.checkFormValid();
      });
    });

    // Note textarea
    const noteInput = this.container.querySelector('#note-input');
    if (noteInput) {
      noteInput.addEventListener('input', (e) => {
        this.currentNote = e.target.value;
        const charCount = this.container.querySelector('#char-count');
        if (charCount) charCount.textContent = e.target.value.length;
        this.checkFormValid();
      });
    }

    // Submit note
    const submitBtn = this.container.querySelector('[data-action="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        await this.submitNote();
      });
    }

    // Edit existing note
    const editBtn = this.container.querySelector('[data-action="edit"]');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.selectedRating = this.stats.userRating.rating;
        this.currentNote = this.stats.userRating.comment;
        this.showAddNote = true;
        this.render();
      });
    }
  }

  checkFormValid() {
    const submitBtn = this.container.querySelector('[data-action="submit"]');
    if (!submitBtn) return;

    const hasRating = this.selectedRating > 0;
    const hasNote = this.currentNote.trim().length > 0;
    
    submitBtn.disabled = !hasRating || !hasNote;
  }

  async submitNote() {
    try {
      const token = await getToken();
      if (!token) {
        alert('Please log in to share your notes');
        return;
      }

      const response = await fetch('/.netlify/functions/ratings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipeId: this.recipeId,
          rating: this.selectedRating,
          comment: this.currentNote.trim()
        })
      });

      if (response.ok) {
        this.showAddNote = false;
        this.currentNote = '';
        this.selectedRating = 0;
        await this.loadNotes();
        this.render();
        
        // Success message
        this.showToast('Thanks for sharing your experience! 🎉');
      } else {
        alert('Failed to save your note. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting note:', error);
      alert('Failed to save your note. Please try again.');
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  getInitials(name) {
    if (!name || name === 'Anonymous') return '👤';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  injectCSS() {
    if (document.getElementById('community-notes-css')) return;

    const style = document.createElement('style');
    style.id = 'community-notes-css';
    style.textContent = `
      .community-notes {
        margin: 3rem 0;
        padding: 2rem 0;
        border-top: 2px solid #e5e7eb;
      }

      .notes-header h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 0.5rem;
      }

      .notes-subtitle {
        color: #6b7280;
        font-size: 1rem;
        margin-bottom: 1.5rem;
      }

      .community-stats {
        display: flex;
        gap: 2rem;
        padding: 1.5rem;
        background: #f9fafb;
        border-radius: 0.5rem;
        margin-bottom: 2rem;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .stat-icon {
        font-size: 1.5rem;
      }

      .stat-text {
        color: #374151;
      }

      /* Add Note Button */
      .add-note-btn {
        width: 100%;
        padding: 1rem;
        border: 2px dashed #d1d5db;
        background: white;
        border-radius: 0.5rem;
        font-size: 1rem;
        color: #4b5563;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 2rem;
      }

      .add-note-btn:hover {
        border-color: #fbbf24;
        background: #fffbeb;
        color: #92400e;
      }

      .btn-icon {
        font-size: 1.25rem;
      }

      /* Note Form */
      .add-note-card, .your-note-card {
        background: #fffbeb;
        border: 2px solid #fbbf24;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .note-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .note-badge {
        background: #fbbf24;
        color: #92400e;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 600;
      }

      .edit-note-btn {
        background: none;
        border: none;
        color: #92400e;
        cursor: pointer;
        text-decoration: underline;
        font-size: 0.875rem;
      }

      .your-note-content .note-rating {
        margin-bottom: 0.5rem;
        font-size: 1.25rem;
      }

      .your-note-content .note-text {
        color: #1f2937;
        line-height: 1.6;
      }

      .note-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        color: #374151;
        font-weight: 500;
      }

      .rating-input {
        display: flex;
        gap: 0.25rem;
      }

      .star-btn {
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        opacity: 0.3;
        transition: all 0.2s;
      }

      .star-btn:hover,
      .star-btn.selected {
        opacity: 1;
        transform: scale(1.1);
      }

      .note-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
      }

      .note-textarea:focus {
        outline: 2px solid #fbbf24;
        border-color: #fbbf24;
      }

      .char-count {
        font-size: 0.875rem;
        color: #6b7280;
        align-self: flex-end;
      }

      .form-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      .btn-primary, .btn-secondary {
        padding: 0.625rem 1.25rem;
        border-radius: 0.375rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #fbbf24;
        border: none;
        color: #92400e;
      }

      .btn-primary:hover:not(:disabled) {
        background: #f59e0b;
      }

      .btn-primary:disabled {
        background: #e5e7eb;
        color: #9ca3af;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: white;
        border: 1px solid #d1d5db;
        color: #374151;
      }

      .btn-secondary:hover {
        background: #f9fafb;
      }

      /* Notes List */
      .notes-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .note-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1.5rem;
      }

      .note-header {
        margin-bottom: 1rem;
      }

      .note-author {
        display: flex;
        gap: 0.75rem;
      }

      .author-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1rem;
        flex-shrink: 0;
      }

      .author-name {
        font-weight: 600;
        color: #111827;
        margin-bottom: 0.25rem;
      }

      .note-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
      }

      .note-separator {
        opacity: 0.5;
      }

      .helpful-badge,
      .tweaks-badge {
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .helpful-badge {
        background: #d1fae5;
        color: #065f46;
      }

      .tweaks-badge {
        background: #fef3c7;
        color: #92400e;
      }

      .note-text {
        color: #374151;
        line-height: 1.6;
        margin: 0;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #6b7280;
      }

      .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .empty-state h3 {
        color: #374151;
        margin-bottom: 0.5rem;
      }

      /* Toast */
      .toast-message {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s;
        z-index: 1000;
      }

      .toast-message.show {
        transform: translateY(0);
        opacity: 1;
      }

      @media (max-width: 768px) {
        .community-stats {
          flex-direction: column;
          gap: 1rem;
        }

        .form-actions {
          flex-direction: column;
        }

        .btn-primary, .btn-secondary {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async refresh() {
    await this.loadNotes();
    this.render();
  }
}