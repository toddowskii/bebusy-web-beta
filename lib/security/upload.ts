// lib/security/upload.ts

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validate file before upload
 * @param file - The file to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateImageUpload(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
    };
  }

  // Check if file is actually an image (not just the MIME type)
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'File must be an image',
    };
  }

  return { isValid: true };
}

/**
 * Generate safe filename from original filename
 * @param originalName - Original file name
 * @returns Safe filename without special characters
 */
export function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Remove special characters and spaces
  const safeName = originalName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  
  return `${timestamp}_${random}_${safeName}.${extension}`;
}

/**
 * Validate and prepare file for upload
 * @param file - The file to prepare
 * @returns Object with validation result and safe filename
 */
export function prepareFileUpload(file: File): {
  isValid: boolean;
  error?: string;
  safeFilename?: string;
} {
  const validation = validateImageUpload(file);
  
  if (!validation.isValid) {
    return validation;
  }

  const safeFilename = generateSafeFilename(file.name);

  return {
    isValid: true,
    safeFilename,
  };
}
