export function formatError(error: unknown): string {
  if (!error) {
    return 'خطای ناشناخته';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;

    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }

    try {
      return JSON.stringify(error);
    } catch (serializationError) {
      console.warn('formatError: could not serialize error object', serializationError);
      return 'خطا (قابل نمایش نیست)';
    }
  }

  return String(error);
}








