'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Users, ArrowLeft, X } from 'lucide-react';
import { useState } from 'react';

interface GuestJoinBannerProps {
    title?: string;
    description?: string;
    className?: string;
}

export function GuestJoinBanner({
    title = 'به جامعه ویستا بپیوند!',
    description = 'ثبت‌نام کن تا پست‌ها رو لایک کنی، کامنت بذاری و با دوستانت در ارتباط باشی',
    className = '',
}: GuestJoinBannerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleSignUp = () => {
        const next = pathname && pathname.startsWith('/') ? pathname : '/feed';
        router.push(`/auth?next=${encodeURIComponent(next)}`);
    };

    return (
        <div
            className={`fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.25)] ${className}`}
        >
            <div className="max-w-2xl mx-auto px-4 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                    <div className="p-2 bg-white/20 rounded-full shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                        <h3 className="font-semibold text-sm md:text-base truncate">{title}</h3>
                        <p className="text-blue-100 text-xs md:text-sm line-clamp-2">{description}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDismissed(true)}
                        className="sm:hidden p-1.5 text-white/70 hover:text-white shrink-0"
                        aria-label="بستن"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={handleSignUp}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm"
                    >
                        <span>ورود / ثبت‌نام</span>
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setDismissed(true)}
                        className="hidden sm:block p-2 text-white/70 hover:text-white"
                        aria-label="بستن"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
