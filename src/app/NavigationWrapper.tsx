"use client";
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/ui/Navigation';

export default function NavigationWrapper() {
    const { profile, loading } = useAuth();
    // Fixed sidebar on the right (for fa)
    return (
        <div className="hidden md:flex flex-col fixed right-0 top-0 h-full min-w-[220px] shrink-0 z-30">
            <Navigation lang="fa" user={profile || undefined} />
        </div>
    );
} 