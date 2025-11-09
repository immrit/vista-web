'use client';

import { useState } from 'react';
import { X, Users, ArrowRight, Heart, MessageSquare } from 'lucide-react';

interface SignUpPromptProps {
    isOpen: boolean;
    onClose: () => void;
    action: 'like' | 'comment' | 'general';
}

export function SignUpPrompt({ isOpen, onClose, action }: SignUpPromptProps) {
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleSignUp = () => {
        setIsRedirecting(true);
        window.location.href = '/auth';
    };

    const getActionText = () => {
        switch (action) {
            case 'like':
                return 'لایک کردن';
            case 'comment':
                return 'کامنت کردن';
            default:
                return 'استفاده از این قابلیت';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="text-center pt-4">
                    {/* Icon */}
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        برای {getActionText()} وارد شوید
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        برای {getActionText()} و استفاده از تمام قابلیت‌های Vista، لطفاً ثبت‌نام کنید یا وارد شوید.
                    </p>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>لایک کردن پست‌ها</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            <span>کامنت و پاسخ</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <Users className="w-4 h-4 text-green-500" />
                            <span>اشتراک‌گذاری محتوا</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                        >
                            بعداً
                        </button>
                        <button
                            onClick={handleSignUp}
                            disabled={isRedirecting}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isRedirecting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>در حال هدایت...</span>
                                </>
                            ) : (
                                <>
                                    <span>ورود</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 