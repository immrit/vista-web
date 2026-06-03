"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowRight,
    AtSign,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    LockKeyhole,
    Phone,
    ShieldCheck,
    Smartphone,
    UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Logo } from "@/components/ui/Logo"
import { AuthResponse, User as AuthUser, useAuth } from "@/hooks/useAuth"

type AuthStep = "identifier" | "password" | "otp"

const stepOrder: AuthStep[] = ["identifier", "password", "otp"]

const digitMap: Record<string, string> = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
}

function normalizeDigits(value: string) {
    return value.replace(/[۰-۹٠-٩]/g, digit => digitMap[digit] || digit)
}

function sanitizeIdentifier(value: string) {
    return normalizeDigits(value).trim()
}

function normalizePhone09(value: string) {
    let phone = sanitizeIdentifier(value).replace(/[\s\-()]/g, "")
    if (!phone) return null

    if (phone.startsWith("+98")) {
        phone = `0${phone.slice(3)}`
    } else if (phone.startsWith("0098")) {
        phone = `0${phone.slice(4)}`
    } else if (phone.startsWith("98") && phone.length === 12) {
        phone = `0${phone.slice(2)}`
    }

    return /^09\d{9}$/.test(phone) ? phone : null
}

function isDisabledAccount(status?: string | null) {
    const normalized = status?.trim().toLowerCase()
    return normalized === "banned" || normalized === "suspended"
}

function hasCompleteProfile(user?: AuthUser | null) {
    if (!user) return false
    return user.profile_completed !== false
}

function getAuthRedirectPath(user: AuthUser, fallback: string) {
    if (!hasCompleteProfile(user)) return "/settings?section=profile"
    return fallback || "/feed"
}

function describeError(error: unknown, fallback = "خطایی رخ داد. دوباره تلاش کنید.") {
    const raw = error instanceof Error ? error.message : String(error || "")

    if (!raw) return fallback
    if (raw.includes("AUTH_INVALID_CREDENTIALS")) return "شناسه ورود یا رمز عبور اشتباه است."
    if (raw.includes("AUTH_ACCOUNT_DISABLED")) return "حساب کاربری شما غیرفعال شده است."
    if (raw.includes("OTP_INVALID")) return "کد تایید وارد شده معتبر نیست."
    if (raw.includes("OTP_EXPIRED")) return "کد تایید منقضی شده است."
    if (raw.includes("OTP_RATE_LIMITED")) return "برای ارسال مجدد کد کمی صبر کنید."
    if (raw.includes("PHONE_INVALID")) return "شماره موبایل معتبر نیست."
    if (raw.includes("SMS_NOT_CONFIGURED")) return "سرویس پیامک روی بک‌اند تنظیم نشده است."
    if (raw.includes("SMS_DELIVERY_FAILED")) return "ارسال پیامک با خطا مواجه شد."

    return raw.replace(/^Error:\s*/, "")
}

export default function AuthPage() {
    const router = useRouter()
    const {
        user,
        loading: authLoading,
        signIn,
        lookupIdentifier,
        sendOtp,
        verifyOtp,
        verify2fa,
        registerWithPassword,
    } = useAuth()

    const [redirectPath, setRedirectPath] = useState("/feed")
    const [step, setStep] = useState<AuthStep>("identifier")
    const [identifier, setIdentifier] = useState("")
    const [normalizedIdentifier, setNormalizedIdentifier] = useState("")
    const [isPhoneInput, setIsPhoneInput] = useState(false)
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [otp, setOtp] = useState("")
    const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null)
    const [otpDebugCode, setOtpDebugCode] = useState<string | null>(null)
    const [countdown, setCountdown] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [isRegistering, setIsRegistering] = useState(false)

    const currentStepNumber = useMemo(() => stepOrder.indexOf(step) + 1, [step])

    useEffect(() => {
        if (typeof window === "undefined") return

        const params = new URLSearchParams(window.location.search)
        const next = params.get("redirect")
        if (next?.startsWith("/") && !next.startsWith("//")) {
            setRedirectPath(next)
        }
    }, [])

    useEffect(() => {
        if (!authLoading && user) {
            router.replace(getAuthRedirectPath(user, redirectPath))
        }
    }, [authLoading, redirectPath, router, user])

    useEffect(() => {
        if (step !== "otp" || countdown <= 0) return

        const timer = window.setTimeout(() => {
            setCountdown(value => Math.max(0, value - 1))
        }, 1000)

        return () => window.clearTimeout(timer)
    }, [countdown, step])

    const goToIdentifier = () => {
        setStep("identifier")
        setPassword("")
        setOtp("")
        setTwoFactorToken(null)
        setOtpDebugCode(null)
        setCountdown(0)
        setError(null)
        setNotice(null)
        setIsRegistering(false)
    }

    const completeAuth = (auth: AuthResponse) => {
        router.replace(getAuthRedirectPath(auth.user, redirectPath))
    }

    const handleIdentifierSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const cleanInput = sanitizeIdentifier(identifier)
        const phone = normalizePhone09(cleanInput)
        if (!cleanInput) {
            setError("شماره موبایل، ایمیل یا نام کاربری را وارد کنید.")
            return
        }

        setSubmitting(true)
        setError(null)
        setNotice(null)
        setOtpDebugCode(null)
        setTwoFactorToken(null)

        try {
            const lookupValue = phone || cleanInput.toLowerCase().replace(/^@+/, "")
            const lookup = await lookupIdentifier(lookupValue)

            if (isDisabledAccount(lookup.account_status)) {
                setError("حساب کاربری شما غیرفعال شده است.")
                return
            }

            if (phone) {
                const nextPhone = lookup.normalized_identifier?.trim() || phone
                setIdentifier(nextPhone)
                setNormalizedIdentifier(nextPhone)
                setIsPhoneInput(true)

                if (lookup.exists && lookup.auth_flow === "password") {
                    setIsRegistering(false)
                    setStep("password")
                    setNotice("برای این حساب رمز عبور تنظیم شده است.")
                } else if (lookup.exists) {
                    setIsRegistering(false)
                    await requestOtp(nextPhone, false)
                } else {
                    setIsRegistering(true)
                    setStep("password")
                    setNotice("لطفاً برای ثبت‌نام و حساب جدید خود یک رمز عبور امن انتخاب کنید.")
                }
                return
            }

            setNormalizedIdentifier(lookupValue)
            setIsPhoneInput(false)

            if (lookup.exists) {
                setIsRegistering(false)
                setStep("password")
                setNotice(null)
            } else {
                setError("برای ثبت‌نام جدید لطفاً از شماره موبایل استفاده کنید.")
            }
        } catch (err) {
            if (phone) {
                setIdentifier(phone)
                setNormalizedIdentifier(phone)
                setIsPhoneInput(true)
                await requestOtp(phone, false)
                return
            }

            setError(describeError(err, "بررسی شناسه ورود با خطا مواجه شد."))
        } finally {
            setSubmitting(false)
        }
    }

    const requestOtp = async (phoneNumber = normalizedIdentifier, isResend = true) => {
        const phone = normalizePhone09(phoneNumber)
        if (!phone) {
            setError("شماره موبایل معتبر نیست.")
            return
        }

        setSubmitting(true)
        setError(null)
        setNotice(null)

        try {
            const response = await sendOtp(phone)
            setIdentifier(phone)
            setNormalizedIdentifier(phone)
            setIsPhoneInput(true)
            setOtp("")
            setOtpDebugCode(response.debug_code || null)
            setCountdown(60)
            setStep("otp")
            setNotice(isResend ? "کد تایید جدید ارسال شد." : response.message || "کد تایید ارسال شد.")
        } catch (err) {
            setError(describeError(err, "ارسال کد تایید با خطا مواجه شد."))
        } finally {
            setSubmitting(false)
        }
    }

    const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!password) {
            setError("رمز عبور را وارد کنید.")
            return
        }

        setSubmitting(true)
        setError(null)
        setNotice(null)

        if (isRegistering) {
            await requestOtp(normalizedIdentifier, false)
            return
        }

        try {
            const auth = twoFactorToken
                ? await verify2fa(twoFactorToken, password)
                : await signIn(isPhoneInput ? normalizedIdentifier : normalizedIdentifier.toLowerCase(), password)

            completeAuth(auth)
        } catch (err) {
            setError(describeError(err, "ورود با خطا مواجه شد."))
        } finally {
            setSubmitting(false)
        }
    }

    const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const cleanOtp = normalizeDigits(otp).trim()
        if (cleanOtp.length < 4) {
            setError("کد تایید را کامل وارد کنید.")
            return
        }

        setSubmitting(true)
        setError(null)
        setNotice(null)

        try {
            const response = await verifyOtp(normalizedIdentifier, cleanOtp)

            if (response.is_2fa_required && response.two_factor_token) {
                setTwoFactorToken(response.two_factor_token)
                setPassword("")
                setStep("password")
                setNotice("برای تکمیل ورود، رمز عبور حساب را وارد کنید.")
                return
            }

            if (response.auth) {
                if (isRegistering && password) {
                    try {
                        const regResponse = await registerWithPassword({ phone_number: normalizedIdentifier, password })
                        completeAuth(regResponse)
                    } catch (regErr) {
                        setError(describeError(regErr, "ثبت رمز عبور با خطا مواجه شد."))
                    }
                } else {
                    completeAuth(response.auth)
                }
                return
            }

            setError("پاسخ ورود کامل نبود. دوباره تلاش کنید.")
        } catch (err) {
            setError(describeError(err, "تایید کد با خطا مواجه شد."))
        } finally {
            setSubmitting(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    return (
        <main
            dir="rtl"
            className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_32%),linear-gradient(135deg,#09090b,#18181b_48%,#111827)] px-4 py-8 text-zinc-950 dark:text-white"
        >
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
                <section className="grid w-full overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-zinc-950 md:grid-cols-[1fr_1.15fr]">
                    <aside className="hidden bg-zinc-950 p-8 text-white md:flex md:flex-col md:justify-between">
                        <Logo size="lg" variant="white" />
                        <div className="space-y-4">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-200">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold leading-tight">ورود امن به ویستا</h1>
                                <p className="mt-3 text-sm leading-7 text-zinc-300">
                                    همان جریان نسخه فلاتر: ابتدا شناسه را بررسی می‌کنیم، سپس بسته به حساب شما رمز عبور، کد تایید یا تایید دومرحله‌ای فعال می‌شود.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400">
                            <div className="rounded-lg border border-white/10 p-3">Lookup</div>
                            <div className="rounded-lg border border-white/10 p-3">OTP</div>
                            <div className="rounded-lg border border-white/10 p-3">2FA</div>
                        </div>
                    </aside>

                    <div className="p-6 sm:p-8">
                        <div className="mb-8 flex items-center justify-between md:hidden">
                            <Logo size="md" variant="default" />
                            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                                <ShieldCheck className="h-4 w-4" />
                                ورود امن
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="mb-4 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                <span>مرحله {currentStepNumber} از 3</span>
                                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                <span>{step === "identifier" ? "شناسه" : step === "otp" ? "کد تایید" : twoFactorToken ? "2FA" : "رمز عبور"}</span>
                            </div>
                            <div className="flex gap-2">
                                {stepOrder.map(item => (
                                    <div
                                        key={item}
                                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                                            stepOrder.indexOf(item) <= stepOrder.indexOf(step)
                                                ? "bg-teal-500"
                                                : "bg-zinc-200 dark:bg-zinc-800"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {step !== "identifier" && (
                            <button
                                type="button"
                                onClick={goToIdentifier}
                                className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            >
                                <ArrowRight className="h-4 w-4" />
                                تغییر شناسه ورود
                            </button>
                        )}

                        {error && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                                {error}
                            </div>
                        )}

                        {notice && (
                            <div className="mb-5 flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-100">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{notice}</span>
                            </div>
                        )}

                        {step === "identifier" && (
                            <form onSubmit={handleIdentifierSubmit} className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">ورود یا ثبت‌نام</h2>
                                    <p className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                                        شماره موبایل، ایمیل یا نام کاربری خود را وارد کنید. ثبت‌نام جدید مثل اپ فلاتر با شماره موبایل و کد تایید انجام می‌شود.
                                    </p>
                                </div>

                                <Input
                                    label="شماره موبایل، ایمیل یا نام کاربری"
                                    value={identifier}
                                    onChange={event => setIdentifier(event.target.value)}
                                    placeholder="09123456789 یا username"
                                    autoComplete="username"
                                    icon={<AtSign size={18} />}
                                />

                                <Button
                                    type="submit"
                                    size="lg"
                                    loading={submitting}
                                    className="w-full bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                                >
                                    ادامه
                                </Button>

                                <div className="grid gap-3 text-sm text-zinc-500 dark:text-zinc-400 sm:grid-cols-3">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-teal-500" />
                                        ورود با موبایل
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UserRound className="h-4 w-4 text-teal-500" />
                                        ورود با نام کاربری
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <LockKeyhole className="h-4 w-4 text-teal-500" />
                                        رمز یا OTP
                                    </div>
                                </div>
                            </form>
                        )}

                        {step === "password" && (
                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">
                                        {isRegistering ? "انتخاب رمز عبور" : twoFactorToken ? "تایید دومرحله‌ای" : "رمز عبور"}
                                    </h2>
                                    <p className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                                        {isRegistering
                                            ? "رمز عبوری شامل حداقل ۸ کاراکتر ترکیبی از حروف و اعداد انتخاب کنید."
                                            : twoFactorToken
                                            ? "کد موبایل تایید شد. حالا رمز عبور حساب را برای تکمیل ورود وارد کنید."
                                            : `رمز عبور حساب ${normalizedIdentifier || identifier} را وارد کنید.`}
                                    </p>
                                </div>

                                <Input
                                    label="رمز عبور"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={event => setPassword(event.target.value)}
                                    placeholder="رمز عبور"
                                    autoComplete={isRegistering ? "new-password" : twoFactorToken ? "current-password" : "password"}
                                    icon={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(value => !value)}
                                            className="text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-100"
                                            aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    }
                                />

                                <Button
                                    type="submit"
                                    size="lg"
                                    loading={submitting}
                                    className="w-full bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                                >
                                    {isRegistering ? "تایید و دریافت کد پیامکی" : "ورود"}
                                </Button>
                            </form>
                        )}

                        {step === "otp" && (
                            <form onSubmit={handleOtpSubmit} className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">کد تایید موبایل</h2>
                                    <p className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                                        کد 5 رقمی ارسال‌شده به شماره {normalizedIdentifier} را وارد کنید.
                                    </p>
                                </div>

                                <Input
                                    label="کد تایید"
                                    inputMode="numeric"
                                    maxLength={5}
                                    value={otp}
                                    onChange={event => setOtp(normalizeDigits(event.target.value).replace(/\D/g, ""))}
                                    placeholder="12345"
                                    autoComplete="one-time-code"
                                    icon={<KeyRound size={18} />}
                                    className="text-center text-lg tracking-[0.35em] ltr:tracking-[0.35em]"
                                    dir="ltr"
                                />

                                {otpDebugCode && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                                        کد تست: <span dir="ltr" className="font-mono font-bold">{otpDebugCode}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    size="lg"
                                    loading={submitting}
                                    className="w-full bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                                >
                                    تایید و ادامه
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => requestOtp(normalizedIdentifier, true)}
                                    disabled={countdown > 0 || submitting}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                >
                                    <Smartphone className="h-4 w-4" />
                                    {countdown > 0 ? `ارسال مجدد تا ${countdown} ثانیه` : "ارسال مجدد کد"}
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}
