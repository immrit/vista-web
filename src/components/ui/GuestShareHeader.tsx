'use client';

import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';

export function GuestShareHeader() {
    const router = useRouter();

    return (
        <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => router.push('/auth')}
                    className="flex items-center gap-2"
                >
                    <Logo size="sm" />
                </button>
                <button
                    type="button"
                    onClick={() => router.push('/auth')}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                    ورود
                </button>
            </div>
        </header>
    );
}
