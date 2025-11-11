'use client';

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '#';
    }
    return parsed.toString();
  } catch (error) {
    console.warn('Invalid URL provided to sanitizeUrl:', error);
    return '#';
  }
}

export function validateFileClient(
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

  const allowedExtensions = allowedTypes.map(type => type.split('/')[1]);
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: 'پسوند فایل مجاز نیست',
    };
  }

  return { valid: true };
}

export const secureStorage = {
  setItem(key: string, value: unknown) {
    try {
      const encrypted = btoa(JSON.stringify(value));
      window.localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  },
  getItem<T>(key: string): T | null {
    try {
      const encrypted = window.localStorage.getItem(key);
      if (!encrypted) {
        return null;
      }
      return JSON.parse(atob(encrypted)) as T;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },
  removeItem(key: string) {
    window.localStorage.removeItem(key);
  },
  clear() {
    window.localStorage.clear();
  },
};

export function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

export function throttle<T extends (...args: any[]) => void>(fn: T, limit: number) {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

