"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import SessionInitializer from "@/components/SessionInitializer";
import { AppShell } from "@/components/layout/AppShell";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useBadge } from "@/hooks/useBadge";
import {
  buildAuthNextPath,
  isGamePath,
  isOnboardingPath,
  requiresAuth,
  shouldHideAppShell,
  shouldHideMobileNav,
} from "@/lib/auth/routes";

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();
    const unreadCount = useUnreadCount();
    useBadge(unreadCount);
    const [isHydrated, setIsHydrated] = useState(false);

    // True when the current path belongs to the in-app webview game section.
    // Game sessions use a scoped `game_token` cookie (set after SSO exchange) that
    // is HttpOnly and therefore invisible to JS. We cannot detect the game session
    // here, so we skip all layout-level redirects for game paths and let the game
    // pages themselves handle auth state.
    const inGame = isGamePath(pathname);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated || loading || !user?.password_required) return;
        if (isOnboardingPath(pathname)) return;
        if (inGame) return;
        router.replace("/set-password");
    }, [isHydrated, inGame, loading, pathname, router, user?.password_required]);

    useEffect(() => {
        if (!isHydrated || loading || !user) return;
        if (user.password_required) return;
        if (inGame) return;
        if (
            user.profile_completed === false &&
            !pathname.startsWith("/profile-setup") &&
            !isOnboardingPath(pathname)
        ) {
            router.replace("/profile-setup");
        }
    }, [isHydrated, inGame, loading, pathname, router, user]);

    useEffect(() => {
        if (!isHydrated || loading || user) return;
        if (!requiresAuth(pathname)) return;
        // Game paths: skip the layout-level redirect. The SSO page bootstraps its
        // own session; other /game/* pages render a loading state until useAuth
        // resolves with the scoped game_token.
        if (inGame) return;
        const next = pathname === "/auth" ? "/feed" : buildAuthNextPath(pathname, window.location.search);
        router.replace(`/auth?next=${encodeURIComponent(next)}`);
    }, [isHydrated, inGame, loading, pathname, router, user]);

    const hideShell = shouldHideAppShell(pathname, Boolean(user));
    const hideMobileNav = shouldHideMobileNav(pathname, Boolean(user));

    if (!isHydrated) {
        return null;
    }

    if (hideShell) {
        return (
            <>
                <SessionInitializer />
                {children}
            </>
        );
    }

    return (
        <>
            <SessionInitializer />
            <AppShell showMobileNav={!hideMobileNav} unreadCount={unreadCount}>
                {children}
            </AppShell>
        </>
    );
}
