import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

export function sanitizeText(input: string): string {
  return input.replace(/[<>]/g, '').trim().substring(0, 10000);
}

export function sanitizeSqlInput(input: string): string {
  return input.replace(/('|"|;|--|\/\*|\*\/)/gi, '').trim();
}

export function sanitizeUuid(uuid: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    return null;
  }

  return uuid.toLowerCase();
}

export function validateFileUpload(
  file: File,
  options?: {
    maxSize?: number;
    allowedTypes?: string[];
  },
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  } = options || {};

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `حجم فایل نمی‌تواند بیشتر از ${Math.round(maxSize / 1024 / 1024)}MB باشد`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'فرمت فایل مجاز نیست',
    };
  }

  return { valid: true };
}

