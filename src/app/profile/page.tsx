'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileRoot() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (isHydrated && !loading) {
            if (profile?.username) {
                router.replace(`/profile/${profile.username}`);
            } else if (!user) {
                router.replace('/auth');
            }
        }
    }, [isHydrated, profile, loading, router, user]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-vista-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
