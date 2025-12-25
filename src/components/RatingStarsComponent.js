// RatingStars.js - WITH COMMENTS SUPPORT AND HOVER FIX
// Frontend component for displaying and submitting ratings WITH optional comments

import { getToken } from '../auth/auth0.js';

export class RatingStars {
  constructor(container, recipeId, options = {}) {
    this.container = container;
    this.recipeId = recipeId;
    this.options = {
      interactive: true,
      showCount: true,
      showComments: false,      // NEW: Show comment input
      showCommentsList: false,   // NEW: Show list of all comments
      onRatingChange: null,
      ...options
    };
    
    this.stats = null;
    this.currentRating = 0;
    this.hoverRating = 0;
    this.currentComment = '';
    
    this.init();
  }

  async init() {
    await this.loadRatingStats();
    this.render();
    // Attach event listeners after render completes
    if (this.options.interactive) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => this.attachEventListeners(), 0);
    }
  }

  async loadRatingStats() {
    try {
      const token = await getToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Include comments if showCommentsList is enabled
      const includeComments = this.options.showCommentsList ? '&includeComments=true' : '';
      const response = await fetch(
        `/.netlify/functions/ratings?recipeId=${this.recipeId}${includeComments}`,
        { headers }
      );
      
      if (response.ok) {
        this.stats = await response.json();
        this.currentRating = this.stats.userRating?.rating || 0;
        this.currentComment = this.stats.userRating?.comment || '';
      }
    } catch (error) {
      console.error('Error loading rating stats:', error);
      this.stats = {
        averageRating: 0,
        totalReviews: 0,
        userRating: null,
        comments: []
      };
    }
  }

  render() {
    if (!this.stats) return;

    const avgRating = this.stats.averageRating;
    const totalReviews = this.stats.totalReviews;
    // Show hover rating OR average rating (not user's personal rating in the display)
    const displayRating = this.hoverRating || avgRating;

    // Create container structure
    this.container.innerHTML = `
      <div class="rating-stars-container" role="group" aria-label="Recipe rating">
        <div class="stars-wrapper" aria-label="${displayRating} out of 5 stars">
          ${this.renderStars(displayRating)}
        </div>
        ${this.options.showCount ? `
          <div class="rating-info">
            <span class="average-rating" aria-live="polite">
              ${avgRating > 0 ? avgRating.toFixed(1) : 'No ratings yet'}
            </span>
            ${totalReviews > 0 ? `
              <span class="review-count" aria-label="${totalReviews} reviews">
                (${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            ` : ''}
          </div>
        ` : ''}
        
        ${this.options.showComments && this.options.interactive ? `
          <div class="comment-input-wrapper">
            <label for="rating-comment-${this.recipeId}" class="sr-only">
              Optional comment for your rating
            </label>
            <textarea 
              id="rating-comment-${this.recipeId}"
              class="rating-comment-input"
              placeholder="Add a comment (optional)"
              maxlength="1000"
              rows="3"
            >${this.currentComment}</textarea>
            <button 
              class="submit-rating-btn"
              ${!this.currentRating ? 'disabled' : ''}
            >
              ${this.currentRating ? 'Update' : 'Submit'} Rating
            </button>
          </div>
        ` : ''}

        ${this.options.showCommentsList && this.stats.comments?.length > 0 ? `
          <div class="comments-list-wrapper">
            <h3 class="comments-heading">Reviews</h3>
            <div class="comments-list">
              ${this.renderCommentsList()}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Add CSS if not already present
    if (!document.getElementById('rating-stars-css')) {
      this.injectCSS();
    }

    // Re-attach event listeners after render
    if (this.options.interactive) {
      this.attachEventListeners();
    }
  }

  renderCommentsList() {
    if (!this.stats.comments || this.stats.comments.length === 0) {
      return '<p class="no-comments">No reviews yet</p>';
    }

    return this.stats.comments.map(comment => {
      const date = new Date(comment.createdAt).toLocaleDateString();
      return `
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-author">${this.escapeHtml(comment.userName || 'Anonymous')}</span>
            <span class="comment-rating">${'★'.repeat(comment.rating)}${'☆'.repeat(5 - comment.rating)}</span>
          </div>
          <p class="comment-text">${this.escapeHtml(comment.comment)}</p>
          <span class="comment-date">${date}</span>
        </div>
      `;
    }).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  renderStars(rating) {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.floor(rating);
      const isPartial = i === Math.ceil(rating) && rating % 1 !== 0;
      const partialPercent = isPartial ? (rating % 1) * 100 : 0;
      
      // Check if this star should be highlighted as user's selection
      const isUserRating = this.options.interactive && this.currentRating > 0 && i <= this.currentRating;
      
      const starClass = this.options.interactive ? 'star interactive' : 'star';
      const userClass = isUserRating ? ' user-selected' : '';
      const ariaLabel = this.options.interactive 
        ? `Rate ${i} out of 5 stars` 
        : `${i} star${i > 1 ? 's' : ''}`;
      
      stars.push(`
        <span 
          class="${starClass}${userClass} ${isFilled || isPartial ? 'filled' : ''}"
          data-rating="${i}"
          role="${this.options.interactive ? 'button' : 'img'}"
          aria-label="${ariaLabel}"
          tabindex="${this.options.interactive ? '0' : '-1'}"
          ${isPartial ? `data-partial="${partialPercent}"` : ''}
        >
          ${this.renderStarSVG(isFilled, isPartial, partialPercent)}
        </span>
      `);
    }
    
    return stars.join('');
  }

  renderStarSVG(isFilled, isPartial, partialPercent) {
    if (isPartial) {
      return `
        <svg class="star-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="partial-${this.recipeId}-${partialPercent}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="${partialPercent}%" style="stop-color:#fbbf24;stop-opacity:1" />
              <stop offset="${partialPercent}%" style="stop-color:#d1d5db;stop-opacity:1" />
            </linearGradient>
          </defs>
          <path fill="url(#partial-${this.recipeId}-${partialPercent})" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      `;
    }
    
    return `
      <svg class="star-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="${isFilled ? '#fbbf24' : '#d1d5db'}" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    `;
  }

  attachEventListeners() {
    const stars = this.container.querySelectorAll('.star.interactive');
    
    stars.forEach((star, index) => {
      // Click handler
      star.addEventListener('click', async () => {
        const rating = index + 1;
        this.currentRating = rating;
        
        // Auto-submit if comments are disabled
        if (!this.options.showComments) {
          await this.submitRating(rating);
        } else {
          this.render();
        }
      });

      // Keyboard handler
      star.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const rating = index + 1;
          this.currentRating = rating;
          
          if (!this.options.showComments) {
            await this.submitRating(rating);
          } else {
            this.render();
          }
        }
      });

      // Hover - just update visual, don't re-render!
      star.addEventListener('mouseenter', () => {
        this.hoverRating = index + 1;
        this.updateStarVisuals();  // ← FIXED: Just update colors, keep DOM
      });
    });

    // Mouse leave
    this.container.addEventListener('mouseleave', () => {
      this.hoverRating = 0;
      this.updateStarVisuals();  // ← FIXED: Just update colors, keep DOM
    });

    // Submit button for comments
    if (this.options.showComments) {
      const submitBtn = this.container.querySelector('.submit-rating-btn');
      const commentInput = this.container.querySelector('.rating-comment-input');
      
      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          const comment = commentInput?.value || '';
          this.submitRating(this.currentRating, comment);
        });
      }

      if (commentInput) {
        commentInput.addEventListener('input', (e) => {
          this.currentComment = e.target.value;
        });
      }
    }
  }

  // NEW METHOD: Update star colors without destroying DOM
  updateStarVisuals() {
    const stars = this.container.querySelectorAll('.star.interactive');
    const displayRating = this.hoverRating || this.currentRating || this.stats?.averageRating || 0;
    
    stars.forEach((star, index) => {
      const rating = index + 1;
      const isFilled = rating <= Math.floor(displayRating);
      
      // Update SVG fill color
      const path = star.querySelector('svg path');
      if (path) {
        path.setAttribute('fill', isFilled ? '#fbbf24' : '#d1d5db');
      }
      
      // Update filled class
      if (isFilled) {
        star.classList.add('filled');
      } else {
        star.classList.remove('filled');
      }
    });
  }

  async submitRating(rating, comment = '') {
    try {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body = { recipeId: this.recipeId, rating };
      if (comment && comment.trim()) {
        body.comment = comment.trim();
      }

      const response = await fetch('/.netlify/functions/ratings', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        this.currentRating = rating;
        this.currentComment = comment;
        await this.loadRatingStats();
        this.render();
        
        if (this.options.onRatingChange) {
          this.options.onRatingChange(rating, this.stats);
        }

        this.announceRating(rating, !!comment);
      } else {
        console.error('Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  }

  announceRating(rating, hasComment) {
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = hasComment 
      ? `You rated this recipe ${rating} out of 5 stars and left a comment`
      : `You rated this recipe ${rating} out of 5 stars`;
    document.body.appendChild(announcement);
    
    setTimeout(() => announcement.remove(), 1000);
  }

  injectCSS() {
    const style = document.createElement('style');
    style.id = 'rating-stars-css';
    style.textContent = `
      .rating-stars-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .stars-wrapper {
        display: flex;
        gap: 0.25rem;
      }

      .star {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      }

      .star.interactive {
        cursor: pointer;
      }

      .star.interactive:hover,
      .star.interactive:focus {
        transform: scale(1.1);
        outline: 2px solid #fbbf24;
        outline-offset: 2px;
        border-radius: 2px;
      }

      .star.user-selected {
        position: relative;
      }

      .star.user-selected::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        background: #10b981;
        border-radius: 50%;
      }

      .star-svg {
        width: 24px;
        height: 24px;
      }

      .rating-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
        color: #4b5563;
      }

      .average-rating {
        font-weight: 600;
        color: #1f2937;
      }

      .review-count {
        color: #6b7280;
      }

      .comment-input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .rating-comment-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-family: inherit;
        font-size: 0.95rem;
        resize: vertical;
      }

      .rating-comment-input:focus {
        outline: 2px solid #fbbf24;
        border-color: #fbbf24;
      }

      .submit-rating-btn {
        align-self: flex-start;
        padding: 0.5rem 1rem;
        background-color: #fbbf24;
        color: #1f2937;
        border: none;
        border-radius: 0.375rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .submit-rating-btn:hover:not(:disabled) {
        background-color: #f59e0b;
      }

      .submit-rating-btn:disabled {
        background-color: #e5e7eb;
        color: #9ca3af;
        cursor: not-allowed;
      }

      .comments-list-wrapper {
        margin-top: 1.5rem;
      }

      .comments-heading {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #1f2937;
      }

      .comments-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .comment-item {
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        background-color: #f9fafb;
      }

      .comment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .comment-author {
        font-weight: 600;
        color: #1f2937;
      }

      .comment-rating {
        color: #fbbf24;
        font-size: 0.875rem;
      }

      .comment-text {
        margin: 0.5rem 0;
        color: #4b5563;
        line-height: 1.5;
      }

      .comment-date {
        font-size: 0.875rem;
        color: #9ca3af;
      }

      .no-comments {
        color: #6b7280;
        font-style: italic;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      @media (max-width: 640px) {
        .star-svg {
          width: 20px;
          height: 20px;
        }
        
        .rating-info {
          font-size: 0.875rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async refresh() {
    await this.loadRatingStats();
    this.render();
  }

  update(stats) {
    this.stats = stats;
    this.currentRating = stats.userRating?.rating || 0;
    this.currentComment = stats.userRating?.comment || '';
    this.render();
  }
}