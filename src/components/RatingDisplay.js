// RatingDisplay.js
// Simple read-only rating display for top of recipe page (and recipe cards)

export class RatingDisplay {
  constructor(container, recipeId, options = {}) {
    this.container = container;
    this.recipeId = recipeId;
    this.options = {
      showStarsVisual: true,  // Show star icons
      ...options
    };
    
    this.stats = null;
    this.init();
  }

  async init() {
    await this.loadRatingStats();
    this.render();
  }

  async loadRatingStats() {
    try {
      const response = await fetch(
        `/.netlify/functions/ratings?recipeId=${this.recipeId}`
      );
      
      if (response.ok) {
        this.stats = await response.json();
      }
    } catch (error) {
      console.error('Error loading rating stats:', error);
      this.stats = {
        averageRating: 0,
        totalReviews: 0
      };
    }
  }

  render() {
    if (!this.stats) return;

    const avgRating = this.stats.averageRating;
    const totalReviews = this.stats.totalReviews;

    if (totalReviews === 0) {
      this.container.innerHTML = '<span class="no-ratings">No reviews yet</span>';
      this.injectCSS();
      return;
    }

    // Round to nearest whole number for display
    const roundedRating = Math.round(avgRating);
    const ratingText = `${roundedRating} Star${roundedRating !== 1 ? 's' : ''}`;
    const reviewText = `${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}`;

    this.container.innerHTML = `
      <div class="rating-display">
        ${this.options.showStarsVisual ? `
          <div class="stars-visual" aria-label="${roundedRating} out of 5 stars">
            ${this.renderStars(avgRating)}
          </div>
        ` : ''}
        <span class="rating-text">${ratingText}</span>
        <span class="review-count">(${reviewText})</span>
      </div>
    `;

    this.injectCSS();
  }

  renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        html += '<span class="star filled">★</span>';
      } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
        // Partial star
        const percent = (rating % 1) * 100;
        html += `<span class="star partial" style="--fill-percent: ${percent}%">★</span>`;
      } else {
        html += '<span class="star empty">☆</span>';
      }
    }
    return html;
  }

  injectCSS() {
    if (document.getElementById('rating-display-css')) return;

    const style = document.createElement('style');
    style.id = 'rating-display-css';
    style.textContent = `
      .rating-display {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.95rem;
        color: #4b5563;
      }

      .rating-display .stars-visual {
        display: inline-flex;
        gap: 0.125rem;
        font-size: 1.125rem;
      }

      .rating-display .star {
        line-height: 1;
      }

      .rating-display .star.filled {
        color: #fbbf24;
      }

      .rating-display .star.empty {
        color: #d1d5db;
      }

      .rating-display .star.partial {
        position: relative;
        color: #d1d5db;
      }

      .rating-display .star.partial::before {
        content: '★';
        position: absolute;
        left: 0;
        color: #fbbf24;
        width: var(--fill-percent);
        overflow: hidden;
      }

      .rating-display .rating-text {
        font-weight: 600;
        color: #1f2937;
      }

      .rating-display .review-count {
        color: #6b7280;
      }

      .no-ratings {
        color: #9ca3af;
        font-size: 0.875rem;
        font-style: italic;
      }

      /* Compact version for recipe cards */
      .rating-display.compact {
        font-size: 0.875rem;
      }

      .rating-display.compact .stars-visual {
        font-size: 1rem;
      }
    `;
    document.head.appendChild(style);
  }

  async refresh() {
    await this.loadRatingStats();
    this.render();
  }
}