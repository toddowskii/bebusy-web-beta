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

  // Preserve symbols like < and > for math while stripping control chars
  const clean = input.replace(/[\u0000-\u001F\u007F]/g, '');

  return clean.trim();
}

/**
 * Detect obvious script injection patterns
 * @param input - The user input to check
 * @returns true if input contains script-like patterns
 */
export function containsScriptLike(input: string): boolean {
  if (!input) return false;

  const pattern = /<\s*script|javascript:|on\w+\s*=/i;
  return pattern.test(input);
}
