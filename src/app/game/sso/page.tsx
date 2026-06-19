'use client';

/**
 * /game/sso?ticket=…
 *
 * Webview landing page for the native-app game handoff. It silently exchanges
 * the one-time ticket for a scoped game session cookie, then lands the user on
 * their game profile. The user never sees a login form.
 *
 * On failure it shows a neutral message (no login redirect) — a webview that
 * arrives here is meant only for the game section.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GameSSOPage() {
  const router = useRouter();
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
        // Drop the ticket from history, land on the user's game lobby.
        router.replace('/game/lobby');
      } catch {
        setFailed(true);
      }
    };

    run();
  }, [router]);

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
