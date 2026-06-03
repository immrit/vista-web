"use client";
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/ui/Navigation';
import { useEffect, useState } from 'react';

interface NavigationWrapperProps {
    showMobileNav?: boolean;
}

export default function NavigationWrapper({ showMobileNav = true }: NavigationWrapperProps) {
    const { profile } = useAuth();
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydration safety
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Show loading during hydration
    if (!isHydrated) {
        return null;
    }

    // Navigation component itself is fixed, so we just render it
    return <Navigation lang="fa" user={profile || undefined} showMobileNav={showMobileNav} />;
}