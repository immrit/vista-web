"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavigationWrapper from "./NavigationWrapper";
import { useAuth } from "@/hooks/useAuth";
import SessionInitializer from "@/components/SessionInitializer";

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydration safety
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated || loading || !user?.password_required) return;
        if (pathname === "/set-password" || pathname.startsWith("/auth")) return;
        router.replace("/set-password");
    }, [isHydrated, loading, pathname, router, user?.password_required]);

    const isPublicSharePath =
        /^\/post\/[^/]+/.test(pathname) || /^\/profile\/[^/]+/.test(pathname);

    // Hide sidebar on auth, password setup, and public share pages for guests.
    const hideSidebar =
        pathname.startsWith("/auth") ||
        pathname === "/set-password" ||
        (isPublicSharePath && !user);

    // Hide bottom navigation on /messages and /game (game has its own mobile navs or UI)
    const hideBottomNav =
        pathname.startsWith("/messages") ||
        pathname.startsWith("/game") ||
        (isPublicSharePath && !user);

    // 🔥 Optimistic rendering: فقط hydration را چک کن، loading را چک نکن
    // محتوا را سریع نشان بده - hydration خیلی سریع است
    if (!isHydrated) {
        return null; // یا می‌توانیم children را نشان بدهیم
    }

    return (
        <div className="min-h-screen w-full flex">
            <SessionInitializer />
            {!hideSidebar && <NavigationWrapper showMobileNav={!hideBottomNav} />}
            <main className={`flex-1 w-full transition-all duration-300 ${!hideSidebar ? "md:mr-[220px]" : ""}`}>
                <div className="w-full h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
