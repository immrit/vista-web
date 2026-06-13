"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import SessionInitializer from "@/components/SessionInitializer";
import { AppShell } from "@/components/layout/AppShell";
import { useUnreadCount } from "@/hooks/useUnreadCount";

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();
    const unreadCount = useUnreadCount();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated || loading || !user?.password_required) return;
        if (pathname === "/set-password" || pathname.startsWith("/auth") || pathname.startsWith("/profile-setup")) return;
        router.replace("/set-password");
    }, [isHydrated, loading, pathname, router, user?.password_required]);

    useEffect(() => {
        if (!isHydrated || loading || !user) return;
        if (user.password_required) return;
        if (user.profile_completed === false && !pathname.startsWith("/profile-setup") && !pathname.startsWith("/auth") && pathname !== "/set-password") {
            router.replace("/profile-setup");
        }
    }, [isHydrated, loading, pathname, router, user]);

    const isPublicSharePath =
        /^\/post\/[^/]+/.test(pathname) || /^\/profile\/[^/]+/.test(pathname);

    const hideShell =
        pathname.startsWith("/auth") ||
        pathname === "/set-password" ||
        pathname.startsWith("/profile-setup") ||
        (isPublicSharePath && !user);

    const hideMobileNav =
        pathname.startsWith("/messages") ||
        pathname.startsWith("/game") ||
        (isPublicSharePath && !user);

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
