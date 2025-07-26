"use client";
import { usePathname } from "next/navigation";
import NavigationWrapper from "./NavigationWrapper";
import React from "react";

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Hide sidebar on /auth and /auth/*
    const hideSidebar = pathname.startsWith("/auth");
    return (
        <div className="min-h-screen w-full">
            {!hideSidebar && <NavigationWrapper />}
            <main className={`flex-1 ${!hideSidebar ? "md:mr-[220px]" : ""}`}>
                {children}
            </main>
        </div>
    );
} 