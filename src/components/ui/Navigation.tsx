import { Home, Search, Bell, Mail, User, Plus, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from './Logo';

interface NavigationProps {
    lang: 'fa' | 'en';
    user?: { full_name?: string | null; avatar_url?: string | null; username?: string | null };
}

const menu = [
    { key: 'home', label: { fa: 'خانه', en: 'Home' }, icon: Home, href: '/feed' },
    { key: 'explore', label: { fa: 'جستجو', en: 'Explore' }, icon: Search, href: '/explore' },
    { key: 'notifications', label: { fa: 'اعلان‌ها', en: 'Notifications' }, icon: Bell, href: '/notifications' },
    { key: 'messages', label: { fa: 'پیام‌ها', en: 'Messages' }, icon: Mail, href: '/messages' },
    { key: 'profile', label: { fa: 'پروفایل', en: 'Profile' }, icon: User, href: '/profile' },
    { key: 'settings', label: { fa: 'تنظیمات', en: 'Settings' }, icon: Settings, href: '/settings' },
];

export function Navigation({ lang, user }: NavigationProps) {
    const isRtl = lang === 'fa';
    const [showDropdown, setShowDropdown] = useState(false);
    const router = useRouter();
    const { signOut } = useAuth();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/auth');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Sidebar (Desktop)
    return (
        <>
            <nav
                className={`hidden md:flex flex-col fixed top-0 ${isRtl ? 'right-0' : 'left-0'} h-full w-64 bg-black dark:bg-zinc-950 border-r border-zinc-800 z-30 py-8 px-4 space-y-2`}
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div className="mb-8 flex items-center justify-center">
                    <Logo size="md" variant="default" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                    {/* Home */}
                    <Link
                        key={menu[0].key}
                        href={menu[0].href}
                        className="flex items-center gap-4 rounded-2xl px-4 py-3 text-lg font-medium text-zinc-200 hover:bg-zinc-900 transition group"
                    >
                        <Home className="w-7 h-7 group-hover:text-blue-500 transition" />
                        <span className="hidden xl:inline">{menu[0].label[lang]}</span>
                    </Link>
                    {/* Explore */}
                    <Link
                        key={menu[1].key}
                        href={menu[1].href}
                        className="flex items-center gap-4 rounded-2xl px-4 py-3 text-lg font-medium text-zinc-200 hover:bg-zinc-900 transition group"
                    >
                        <Search className="w-7 h-7 group-hover:text-blue-500 transition" />
                        <span className="hidden xl:inline">{menu[1].label[lang]}</span>
                    </Link>
                    {/* Notifications (desktop only) */}
                    <Link
                        key={menu[2].key}
                        href={menu[2].href}
                        className="flex items-center gap-4 rounded-2xl px-4 py-3 text-lg font-medium text-zinc-200 hover:bg-zinc-900 transition group"
                    >
                        <Bell className="w-7 h-7 group-hover:text-blue-500 transition" />
                        <span className="hidden xl:inline">{menu[2].label[lang]}</span>
                    </Link>
                    {/* Messages */}
                    <Link
                        key={menu[3].key}
                        href={menu[3].href}
                        className="flex items-center gap-4 rounded-2xl px-4 py-3 text-lg font-medium text-zinc-200 hover:bg-zinc-900 transition group"
                    >
                        <Mail className="w-7 h-7 group-hover:text-blue-500 transition" />
                        <span className="hidden xl:inline">{menu[3].label[lang]}</span>
                    </Link>
                    {/* Profile */}
                    <Link
                        key={menu[4].key}
                        href={menu[4].href}
                        className="flex items-center gap-4 rounded-2xl px-4 py-3 text-lg font-medium text-zinc-200 hover:bg-zinc-900 transition group"
                    >
                        <User className="w-7 h-7 group-hover:text-blue-500 transition" />
                        <span className="hidden xl:inline">{menu[4].label[lang]}</span>
                    </Link>
                    {/* Settings */}
                    <Link
                        key={menu[5].key}
                        href={menu[5].href}
                        className="flex items-center gap-4 rounded-2xl px-4 py-3 text-lg font-medium text-zinc-200 hover:bg-zinc-900 transition group"
                    >
                        <Settings className="w-7 h-7 group-hover:text-blue-500 transition" />
                        <span className="hidden xl:inline">{menu[5].label[lang]}</span>
                    </Link>
                    {/* Post button */}
                    <Link
                        href="/post"
                        className="flex items-center justify-center gap-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-3 mt-4 shadow-xl transition"
                    >
                        <Plus className="w-6 h-6" />
                        <span className="hidden xl:inline">{lang === 'fa' ? 'پست جدید' : 'Post'}</span>
                    </Link>
                </div>
                {/* User profile bottom */}
                {user && (
                    <div className="mt-8 relative" ref={dropdownRef}>
                        <div
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition cursor-pointer"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-800" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl text-white font-bold">
                                    {user.full_name?.charAt(0) || user.username?.charAt(0) || '👤'}
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-zinc-200 font-semibold text-base">{user.full_name || user.username}</span>
                                <span className="text-zinc-400 text-xs">@{user.username}</span>
                            </div>
                        </div>

                        {/* Dropdown menu */}
                        {showDropdown && (
                            <div className={`absolute bottom-full ${isRtl ? 'right-0' : 'left-0'} mb-2 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden`}>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition text-right"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>{lang === 'fa' ? 'خروج' : 'Logout'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* Bottom Navigation (Mobile) */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 bg-black dark:bg-zinc-950 border-t border-zinc-800 z-30 flex justify-between px-2 py-1"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                {/* Home */}
                <Link
                    key={menu[0].key}
                    href={menu[0].href}
                    className="flex flex-col items-center justify-center flex-1 py-2 text-zinc-200 hover:text-blue-500 hover:bg-zinc-900 rounded-xl transition"
                >
                    <Home className="w-6 h-6 mb-1" />
                    <span className="text-xs">{menu[0].label[lang]}</span>
                </Link>
                {/* Explore */}
                <Link
                    key={menu[1].key}
                    href={menu[1].href}
                    className="flex flex-col items-center justify-center flex-1 py-2 text-zinc-200 hover:text-blue-500 hover:bg-zinc-900 rounded-xl transition"
                >
                    <Search className="w-6 h-6 mb-1" />
                    <span className="text-xs">{menu[1].label[lang]}</span>
                </Link>
                {/* Plus (center) */}
                <Link
                    href="/post"
                    className="flex flex-col items-center justify-center flex-1 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg mx-2 -mt-6 w-16 h-16 border-4 border-black dark:border-zinc-950 transition"
                >
                    <Plus className="w-7 h-7" />
                </Link>
                {/* Messages */}
                <Link
                    key={menu[3].key}
                    href={menu[3].href}
                    className="flex flex-col items-center justify-center flex-1 py-2 text-zinc-200 hover:text-blue-500 hover:bg-zinc-900 rounded-xl transition"
                >
                    <Mail className="w-6 h-6 mb-1" />
                    <span className="text-xs">{menu[3].label[lang]}</span>
                </Link>
                {/* Profile - Direct link */}
                <Link
                    key={menu[4].key}
                    href={menu[4].href}
                    className="flex flex-col items-center justify-center flex-1 py-2 text-zinc-200 hover:text-blue-500 hover:bg-zinc-900 rounded-xl transition"
                >
                    <User className="w-6 h-6 mb-1" />
                    <span className="text-xs">{menu[4].label[lang]}</span>
                </Link>
            </nav>
        </>
    );
} 