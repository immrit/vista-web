import * as Sentry from '@sentry/nextjs';

export function initializeErrorTracking() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      return event;
    },
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'AuthRetryableFetchException',
    ],
  });
}

export function logSecurityEvent(event: string, details: Record<string, unknown>) {
  const sanitized = { ...details };
  delete (sanitized as { password?: string }).password;
  delete (sanitized as { token?: string }).token;
  delete (sanitized as { email?: string }).email;

  console.log('[SECURITY]', event, sanitized);

  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(`Security Event: ${event}`, {
      level: 'warning',
      extra: sanitized,
    });
  }
}





