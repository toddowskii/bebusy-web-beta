// lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - The user input to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Configure DOMPurify to be strict
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
    ALLOW_DATA_ATTR: false,
  });
  
  return clean;
}

/**
 * Sanitize plain text (no HTML allowed)
 * @param input - The user input to sanitize
 * @returns Plain text without any HTML
 */
export function sanitizePlainText(input: string): string {
  if (!input) return '';
  
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  
  return clean.trim();
}
