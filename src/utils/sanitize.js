// Path: src/utils/sanitize.js
// Sanitize user-generated content to prevent XSS attacks

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content for safe rendering
 * Use this whenever inserting user-generated content via innerHTML
 */
export function sanitizeHTML(dirty) {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'blockquote', 'code', 'pre',
      'span', 'div', 'label'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'data-id', 'for'],
    ALLOW_DATA_ATTR: true // Allow data-* attributes for our buttons
  });
}

/**
 * Sanitize plain text (strips all HTML)
 * Use for text-only contexts
 */
export function sanitizeText(dirty) {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}