"use client";
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/ui/Navigation';
import { useEffect, useState } from 'react';

export default function NavigationWrapper() {
    const { profile } = useAuth();
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydration safety
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Show loading during hydration
    if (!isHydrated) {
        return (
            <div className="hidden md:flex flex-col fixed right-0 top-0 h-full min-w-[220px] shrink-0 z-30">
                <div className="w-full h-full bg-black dark:bg-zinc-950 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    // Fixed sidebar on the right (for fa)
    return (
        <div className="hidden md:flex flex-col fixed right-0 top-0 h-full min-w-[220px] shrink-0 z-30">
            <Navigation lang="fa" user={profile || undefined} />
        </div>
    );
} 