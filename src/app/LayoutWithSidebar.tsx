"use client";
import { usePathname } from "next/navigation";
import NavigationWrapper from "./NavigationWrapper";
import { Navigation } from "@/components/ui/Navigation";
import { useAuth } from "@/hooks/useAuth";
import React, { useEffect, useState } from "react";

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

    // Show loading during hydration
    if (!isHydrated) {
        return (
            <div className="min-h-screen w-full">
                <main className="flex-1">
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full">
            {!hideSidebar && <NavigationWrapper />}
            {/* Mobile Navigation - Always visible except on auth pages */}
            {!hideSidebar && (
                <div className="md:hidden">
                    <Navigation lang="fa" user={profile || undefined} />
                </div>
            )}
            <main className={`flex-1 ${!hideSidebar ? "md:mr-[220px]" : ""}`}>
                {children}
            </main>
        </div>
    );
} 