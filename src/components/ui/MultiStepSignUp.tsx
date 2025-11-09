'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { PersianDateInput } from '@/components/ui/PersianDateInput'
import { EnglishDateInput } from '@/components/ui/EnglishDateInput'
import { UploadService } from '@/lib/uploadService'
import {
    Mail,
    User,
    Eye,
    EyeOff,
    Camera,
    ArrowRight,
    ArrowLeft,
    Calendar,
    FileText,
    Upload,
    X
} from 'lucide-react'

type SignUpStep = 'credentials' | 'profile' | 'avatar' | 'complete'

interface SignUpData {
    // Step 1: Credentials
    email: string
    password: string
    confirmPassword: string

    // Step 2: Profile
    fullName: string
    username: string
    bio: string
    birthDate: string

    // Step 3: Avatar
    avatarFile: File | null
    avatarPreview: string | null
}

const texts = {
    fa: {
        step1: {
            title: 'اطلاعات ورود',
            subtitle: 'ایمیل و رمز عبور خود را وارد کنید',
            email: 'ایمیل',
            password: 'رمز عبور',
            confirmPassword: 'تأیید رمز عبور',
            placeholderEmail: 'example@gmail.com',
            placeholderPassword: 'رمز عبور',
            placeholderConfirmPassword: 'تکرار رمز عبور',
            requiredEmail: 'ایمیل الزامی است',
            invalidEmail: 'فرمت ایمیل صحیح نیست',
            requiredPassword: 'رمز عبور الزامی است',
            shortPassword: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
            requiredConfirmPassword: 'تأیید رمز عبور الزامی است',
            passwordMismatch: 'رمز عبور و تأیید آن یکسان نیستند',
        },
        step2: {
            title: 'اطلاعات پروفایل',
            subtitle: 'اطلاعات شخصی خود را تکمیل کنید',
            fullName: 'نام کامل',
            username: 'نام کاربری',
            bio: 'بیوگرافی',
            birthDate: 'تاریخ تولد (اختیاری)',
            placeholderFullName: 'نام و نام خانوادگی',
            placeholderUsername: 'نام کاربری (لاتین)',
            placeholderBio: 'درباره خودتان بنویسید...',
            placeholderBirthDate: 'تاریخ تولد (شمسی) - اختیاری',
            requiredFullName: 'نام کامل الزامی است',
            requiredUsername: 'نام کاربری الزامی است',
            shortUsername: 'نام کاربری باید حداقل ۳ کاراکتر باشد',
            invalidUsername: 'نام کاربری فقط شامل حروف، اعداد و _ باشد',
            requiredBirthDate: 'تاریخ تولد الزامی است',
        },
        step3: {
            title: 'عکس پروفایل',
            subtitle: 'عکس پروفایل خود را انتخاب کنید',
            uploadText: 'عکس پروفایل را آپلود کنید',
            dragText: 'فایل را اینجا بکشید یا کلیک کنید',
            supportedFormats: 'فرمت‌های پشتیبانی شده: JPG, PNG, GIF',
            maxSize: 'حداکثر اندازه: 5MB',
            removeImage: 'حذف عکس',
            skip: 'رد کردن',
        },
        common: {
            next: 'مرحله بعد',
            previous: 'مرحله قبل',
            complete: 'تکمیل ثبت‌نام',
            loading: 'در حال پردازش...',
            error: 'خطا در ثبت‌نام',
            success: 'حساب کاربری با موفقیت ایجاد شد',
        }
    },
    en: {
        step1: {
            title: 'Login Information',
            subtitle: 'Enter your email and password',
            email: 'Email',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            placeholderEmail: 'example@gmail.com',
            placeholderPassword: 'Password',
            placeholderConfirmPassword: 'Repeat password',
            requiredEmail: 'Email is required',
            invalidEmail: 'Invalid email format',
            requiredPassword: 'Password is required',
            shortPassword: 'Password must be at least 6 characters',
            requiredConfirmPassword: 'Confirm password is required',
            passwordMismatch: 'Passwords do not match',
        },
        step2: {
            title: 'Profile Information',
            subtitle: 'Complete your personal information',
            fullName: 'Full Name',
            username: 'Username',
            bio: 'Bio',
            birthDate: 'Birth Date (Optional)',
            placeholderFullName: 'Your full name',
            placeholderUsername: 'Username (latin)',
            placeholderBio: 'Tell us about yourself...',
            placeholderBirthDate: 'Birth date (Gregorian) - Optional',
            requiredFullName: 'Full name is required',
            requiredUsername: 'Username is required',
            shortUsername: 'Username must be at least 3 characters',
            invalidUsername: 'Username can only contain letters, numbers, and _',
            requiredBirthDate: 'Birth date is required',
        },
        step3: {
            title: 'Profile Picture',
            subtitle: 'Choose your profile picture',
            uploadText: 'Upload Profile Picture',
            dragText: 'Drag file here or click to browse',
            supportedFormats: 'Supported formats: JPG, PNG, GIF',
            maxSize: 'Maximum size: 5MB',
            removeImage: 'Remove Image',
            skip: 'Skip',
        },
        common: {
            next: 'Next Step',
            previous: 'Previous Step',
            complete: 'Complete Registration',
            loading: 'Processing...',
            error: 'Registration failed',
            success: 'Account created successfully',
        }
    }
}

export function MultiStepSignUp() {
    const [currentStep, setCurrentStep] = useState<SignUpStep>('credentials')
    const [lang, setLang] = useState<'fa' | 'en'>('fa')
    const [formData, setFormData] = useState<SignUpData>({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        username: '',
        bio: '',
        birthDate: '',
        avatarFile: null,
        avatarPreview: null,
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const { signUp } = useAuth()
    const router = useRouter()

    const t = texts[lang]
    const isRTL = lang === 'fa'

    const validateStep = (step: SignUpStep): boolean => {
        const newErrors: Record<string, string> = {}

        if (step === 'credentials') {
            if (!formData.email) newErrors.email = t.step1.requiredEmail
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t.step1.invalidEmail

            if (!formData.password) newErrors.password = t.step1.requiredPassword
            else if (formData.password.length < 6) newErrors.password = t.step1.shortPassword

            if (!formData.confirmPassword) newErrors.confirmPassword = t.step1.requiredConfirmPassword
            else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t.step1.passwordMismatch
        }

        if (step === 'profile') {
            if (!formData.fullName) newErrors.fullName = t.step2.requiredFullName
            if (!formData.username) newErrors.username = t.step2.requiredUsername
            else if (formData.username.length < 3) newErrors.username = t.step2.shortUsername
            else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.username = t.step2.invalidUsername
            // Birth date is now optional
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (!validateStep(currentStep)) return

        if (currentStep === 'credentials') {
            setCurrentStep('profile')
        } else if (currentStep === 'profile') {
            setCurrentStep('avatar')
        }
    }

    const handlePrevious = () => {
        if (currentStep === 'profile') {
            setCurrentStep('credentials')
        } else if (currentStep === 'avatar') {
            setCurrentStep('profile')
        }
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Validate file type
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                setErrors({ avatar: 'فقط فایل‌های JPG، PNG و GIF پشتیبانی می‌شوند' })
                return
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors({ avatar: 'اندازه فایل نباید بیشتر از 5MB باشد' })
                return
            }

            setFormData(prev => ({
                ...prev,
                avatarFile: file,
                avatarPreview: URL.createObjectURL(file)
            }))
            setErrors({})
        }
    }

    const handleRemoveAvatar = () => {
        setFormData(prev => ({
            ...prev,
            avatarFile: null,
            avatarPreview: null
        }))
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleComplete = async () => {
        try {
            setLoading(true)
            setErrors({})

            // Upload avatar if selected
            let avatarUrl = null
            if (formData.avatarFile) {
                // Generate a temporary user ID for upload
                const tempUserId = `temp_${Date.now()}`
                avatarUrl = await UploadService.uploadAvatar(
                    formData.avatarFile,
                    tempUserId
                )
            }

            // Create account
            await signUp(
                formData.email,
                formData.password,
                formData.username,
                formData.fullName,
                formData.bio,
                formData.birthDate,
                avatarUrl || undefined
            )

            // Redirect to feed
            router.push('/feed')
        } catch (error: any) {
            setErrors({ general: error.message || t.common.error })
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: keyof SignUpData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const renderStep = () => {
        switch (currentStep) {
            case 'credentials':
                return (
                    <div className="space-y-5">
                        <Input
                            label={t.step1.email}
                            type="email"
                            placeholder={t.step1.placeholderEmail}
                            value={formData.email}
                            onChange={handleInputChange('email')}
                            error={errors.email}
                            icon={<Mail size={18} />}
                        />
                        <Input
                            label={t.step1.password}
                            type={showPassword ? "text" : "password"}
                            placeholder={t.step1.placeholderPassword}
                            value={formData.password}
                            onChange={handleInputChange('password')}
                            error={errors.password}
                            icon={
                                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-zinc-400 dark:text-zinc-500">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        />
                        <Input
                            label={t.step1.confirmPassword}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={t.step1.placeholderConfirmPassword}
                            value={formData.confirmPassword}
                            onChange={handleInputChange('confirmPassword')}
                            error={errors.confirmPassword}
                            icon={
                                <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="text-zinc-400 dark:text-zinc-500">
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        />
                    </div>
                )

            case 'profile':
                return (
                    <div className="space-y-5">
                        <Input
                            label={t.step2.fullName}
                            type="text"
                            placeholder={t.step2.placeholderFullName}
                            value={formData.fullName}
                            onChange={handleInputChange('fullName')}
                            error={errors.fullName}
                            icon={<User size={18} />}
                        />
                        <Input
                            label={t.step2.username}
                            type="text"
                            placeholder={t.step2.placeholderUsername}
                            value={formData.username}
                            onChange={handleInputChange('username')}
                            error={errors.username}
                            icon={<span className="text-zinc-400 dark:text-zinc-500">@</span>}
                        />
                        <div>
                            <label className={`block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t.step2.bio}
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={handleInputChange('bio')}
                                placeholder={t.step2.placeholderBio}
                                className={`w-full h-24 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 resize-none ${isRTL ? 'text-right' : 'text-left'}`}
                                rows={3}
                            />
                        </div>
                        {isRTL ? (
                            <PersianDateInput
                                label={t.step2.birthDate}
                                value={formData.birthDate}
                                onChange={(value) => setFormData(prev => ({ ...prev, birthDate: value }))}
                                error={errors.birthDate}
                                placeholder={t.step2.placeholderBirthDate}
                                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                required={false}
                            />
                        ) : (
                            <EnglishDateInput
                                label={t.step2.birthDate}
                                value={formData.birthDate}
                                onChange={(value) => setFormData(prev => ({ ...prev, birthDate: value }))}
                                error={errors.birthDate}
                                placeholder={t.step2.placeholderBirthDate}
                                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            />
                        )}
                    </div>
                )

            case 'avatar':
                return (
                    <div className="space-y-5">
                        <div className="text-center">
                            <div className="mb-4">
                                {formData.avatarPreview ? (
                                    <div className="relative inline-block">
                                        <img
                                            src={formData.avatarPreview}
                                            alt="Avatar preview"
                                            className="w-32 h-32 rounded-full object-cover border-4 border-zinc-200 dark:border-zinc-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center mx-auto">
                                        <Camera size={32} className="text-zinc-400" />
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <Button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="mb-4"
                            >
                                <Upload size={18} className={isRTL ? "ml-2" : "mr-2"} />
                                {t.step3.uploadText}
                            </Button>

                            {errors.avatar && (
                                <div className="text-red-500 text-sm mt-2">{errors.avatar}</div>
                            )}

                            <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                                <p>{t.step3.supportedFormats}</p>
                                <p>{t.step3.maxSize}</p>
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    const getStepTitle = () => {
        switch (currentStep) {
            case 'credentials': return t.step1.title
            case 'profile': return t.step2.title
            case 'avatar': return t.step3.title
            default: return ''
        }
    }

    const getStepSubtitle = () => {
        switch (currentStep) {
            case 'credentials': return t.step1.subtitle
            case 'profile': return t.step2.subtitle
            case 'avatar': return t.step3.subtitle
            default: return ''
        }
    }

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black ${isRTL ? 'font-vazir' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}>

            {/* Language Toggle */}
            <div className="absolute top-6 left-6 right-6 flex justify-end z-20">
                <button
                    onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
                    className="px-3 py-1 rounded-full text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                >
                    {lang === 'fa' ? 'EN' : 'فا'}
                </button>
            </div>

            {/* Back to Login Button */}
            <div className="absolute top-6 left-6 z-20">
                <button
                    onClick={() => router.push('/auth')}
                    className="px-3 py-1 rounded-full text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all flex items-center gap-1"
                >
                    <ArrowLeft size={14} />
                    {isRTL ? 'بازگشت به ورود' : 'Back to Login'}
                </button>
            </div>

            <div className="w-full max-w-md mx-auto p-8 rounded-3xl shadow-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 relative">

                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Logo size="lg" variant="default" />
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center space-x-2">
                        {['credentials', 'profile', 'avatar'].map((step, index) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === step
                                    ? 'bg-blue-600 text-white'
                                    : index < ['credentials', 'profile', 'avatar'].indexOf(currentStep)
                                        ? 'bg-green-500 text-white'
                                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                {index < 2 && (
                                    <div className={`w-8 h-1 mx-2 ${index < ['credentials', 'profile', 'avatar'].indexOf(currentStep)
                                        ? 'bg-green-500'
                                        : 'bg-zinc-200 dark:bg-zinc-700'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        {getStepTitle()}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-300 text-sm">
                        {getStepSubtitle()}
                    </p>
                </div>

                {/* Error Message */}
                {errors.general && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-2 rounded-xl text-sm text-center mb-5">
                        {errors.general}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                    {renderStep()}
                </form>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    {currentStep !== 'credentials' && (
                        <Button
                            onClick={handlePrevious}
                            variant="outline"
                            className="flex items-center"
                        >
                            <ArrowLeft size={18} className={isRTL ? "ml-2" : "mr-2"} />
                            {t.common.previous}
                        </Button>
                    )}

                    <div className="flex-1" />

                    {currentStep === 'avatar' ? (
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleComplete()}
                                loading={loading}
                                className="flex items-center"
                            >
                                {t.common.complete}
                                <ArrowRight size={18} className={isRTL ? "mr-2" : "ml-2"} />
                            </Button>
                            <Button
                                onClick={() => handleComplete()}
                                variant="outline"
                                loading={loading}
                            >
                                {t.step3.skip}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleNext}
                            className="flex items-center"
                        >
                            {t.common.next}
                            <ArrowRight size={18} className={isRTL ? "mr-2" : "ml-2"} />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
} 