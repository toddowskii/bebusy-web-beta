// lib/security/moderation.ts
// Using dynamic import to handle bad-words CommonJS module
let filter: any;

try {
  const BadWordsFilter = require('bad-words');
  filter = new BadWordsFilter();
} catch {
  // Fallback if require doesn't work
  filter = {
    isProfane: () => false,
    clean: (text: string) => text
  };
}

/**
 * Check if content contains profanity or inappropriate language
 * @param content - The content to check
 * @returns true if content is inappropriate
 */
export function isProfane(content: string): boolean {
  if (!content) return false;
  return filter.isProfane(content);
}

/**
 * Clean profanity from content (replace with asterisks)
 * @param content - The content to clean
 * @returns Content with profanity replaced
 */
export function cleanProfanity(content: string): string {
  if (!content) return '';
  return filter.clean(content);
}

/**
 * Validate content before posting
 * @param content - The content to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateContent(content: string): { isValid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Content cannot be empty' };
  }

  if (content.length > 5000) {
    return { isValid: false, error: 'Content is too long (max 5000 characters)' };
  }

  if (isProfane(content)) {
    return { isValid: false, error: 'Content contains inappropriate language' };
  }

  return { isValid: true };
}
