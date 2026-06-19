'use client';

/**
 * /game/sso?ticket=…
 *
 * Webview landing page for the native-app game handoff. It silently exchanges
 * the one-time ticket for a scoped game session cookie, then hard-navigates the
 * user to the game home page. The user never sees a login form.
 *
 * We use window.location.replace (not router.replace) so the browser starts a
 * fresh navigation with the newly-set game_token cookie already in place.
 * This prevents the root layout's useAuth hook from seeing an unauthenticated
 * state and redirecting to /auth before the cookie is available.
 *
 * On failure it shows a neutral message (no login redirect) — a webview that
 * arrives here is meant only for the game section.
 */

import { useEffect, useRef, useState } from 'react';

export default function GameSSOPage() {
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const ticket = new URLSearchParams(window.location.search).get('ticket');
      if (!ticket) {
        setFailed(true);
        return;
      }

      try {
        const res = await fetch('/api/game/sso', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ticket }),
        });
        if (!res.ok) {
          setFailed(true);
          return;
        }
        // Hard navigation: the game_token cookie is now set. A full page load
        // ensures useAuth starts fresh and picks up the scoped cookie immediately,
        // preventing the root layout from briefly redirecting to /auth.
        window.location.replace('/game');
      } catch {
        setFailed(true);
      }
    };

    run();
  }, []);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
      }}
    >
      {failed ? (
        <p style={{ fontSize: 15, opacity: 0.8 }}>
          ورود به بازی ممکن نشد. لطفاً دوباره از برنامه وارد شوید.
        </p>
      ) : (
        <>
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid rgba(255,65,108,0.25)',
              borderTopColor: '#FF416C',
              borderRadius: '50%',
              animation: 'gsso-spin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: 15, opacity: 0.8 }}>در حال آماده‌سازی بازی...</p>
          <style>{`@keyframes gsso-spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}
