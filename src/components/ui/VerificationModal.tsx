'use client'

import { useState, useEffect } from 'react'
import { X, Mail, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'

interface VerificationModalProps {
    isOpen: boolean
    onClose: () => void
    onVerify: (code: string) => Promise<void>
    email: string
    isVerifying: boolean
    error: string | null
    success: string | null
    onResend: () => Promise<void>
    isResending: boolean
}

export function VerificationModal({
    isOpen,
    onClose,
    onVerify,
    email,
    isVerifying,
    error,
    success,
    onResend,
    isResending
}: VerificationModalProps) {
    const [code, setCode] = useState('')
    const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds

    useEffect(() => {
        if (!isOpen) {
            setCode('')
            setTimeLeft(600)
            return
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isOpen])

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const handleVerify = async () => {
        if (code.length === 6) {
            await onVerify(code)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && code.length === 6) {
            handleVerify()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            تأیید حذف حساب کاربری
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-1">
                                        کد ارسال شد
                                    </h3>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        {success}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
                                        خطا
                                    </h3>
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                    کد تأیید ارسال شد
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                    کد تأیید برای ایمیل <strong>{email}</strong> ارسال شده است.
                                    لطفاً کد 6 رقمی دریافتی را در فیلد زیر وارد کنید:
                                </p>

                                {/* Timer */}
                                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                                    <span>⏰ زمان باقی‌مانده:</span>
                                    <span className={`font-mono ${timeLeft < 60 ? 'text-red-600' : ''}`}>
                                        {formatTime(timeLeft)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Code Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            کد 6 رقمی تأیید
                        </label>
                        <Input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                                setCode(value)
                            }}
                            placeholder="000000"
                            className="text-center text-2xl font-mono tracking-widest"
                            maxLength={6}
                            onKeyPress={handleKeyPress}
                            disabled={isVerifying || timeLeft === 0}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                            فقط اعداد را وارد کنید
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleVerify}
                            disabled={isVerifying || code.length !== 6 || timeLeft === 0}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                            {isVerifying ? 'در حال تأیید...' : 'تأیید و حذف حساب'}
                        </Button>

                        <div className="flex gap-3">
                            <Button
                                onClick={onResend}
                                disabled={isResending || timeLeft > 0}
                                variant="outline"
                                className="flex-1"
                            >
                                {isResending ? 'در حال ارسال...' : 'ارسال مجدد'}
                            </Button>

                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="flex-1"
                            >
                                انصراف
                            </Button>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                    ⚠️ هشدار مهم
                                </h3>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    حذف حساب کاربری عملی غیرقابل بازگشت است. تمام اطلاعات شما شامل پست‌ها، نظرات، لایک‌ها و فایل‌ها برای همیشه حذف خواهد شد.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 