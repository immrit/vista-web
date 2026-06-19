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

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated || loading || !user?.password_required) return;
        if (isOnboardingPath(pathname)) return;
        router.replace("/set-password");
    }, [isHydrated, loading, pathname, router, user?.password_required]);

    useEffect(() => {
        if (!isHydrated || loading || !user) return;
        if (user.password_required) return;
        if (
            user.profile_completed === false &&
            !pathname.startsWith("/profile-setup") &&
            !isOnboardingPath(pathname)
        ) {
            router.replace("/profile-setup");
        }
    }, [isHydrated, loading, pathname, router, user]);

    useEffect(() => {
        if (!isHydrated || loading || user) return;
        if (!requiresAuth(pathname)) return;
        const next = pathname === "/auth" ? "/feed" : buildAuthNextPath(pathname, window.location.search);
        router.replace(`/auth?next=${encodeURIComponent(next)}`);
    }, [isHydrated, loading, pathname, router, user]);

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
