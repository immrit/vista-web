"use client";
import { usePathname } from "next/navigation";
import NavigationWrapper from "./NavigationWrapper";
import { Navigation } from "@/components/ui/Navigation";
import { useAuth } from "@/hooks/useAuth";
import React from "react";

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { profile } = useAuth();
    // Hide sidebar on /auth and /auth/*
    const hideSidebar = pathname.startsWith("/auth");
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