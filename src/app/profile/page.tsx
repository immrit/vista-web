'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileRoot() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (profile?.username) {
                router.replace(`/profile/${profile.username}`);
            }
        }
    }, [profile, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-lg text-gray-500 dark:text-gray-300">
                در حال بارگذاری...
            </div>
        );
    }

    if (!user || !profile?.username) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center text-lg text-gray-500 dark:text-gray-300">
                برای مشاهده پروفایل ابتدا وارد شوید.
            </div>
        );
    }

    // تا ریدایرکت انجام شود چیزی نمایش نده
    return null;
}
