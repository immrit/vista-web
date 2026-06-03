"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NavigationWrapper from "./NavigationWrapper";
import { useAuth } from "@/hooks/useAuth";
import SessionInitializer from "@/components/SessionInitializer";

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { profile, loading } = useAuth();
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydration safety
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Hide sidebar on /auth and /auth/*
    const hideSidebar = pathname.startsWith("/auth");

    // Hide bottom navigation on /messages
    const hideBottomNav = pathname.startsWith("/messages");

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