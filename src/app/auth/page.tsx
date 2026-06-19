"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    ArrowRight,
    Eye,
    EyeOff,
    Fingerprint,
    KeyRound,
    Loader2,
    UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { AnimatedRibbonBackground } from "@/components/auth/AnimatedRibbonBackground"
import { AuthResponse, User as AuthUser, useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useWebAuthn } from "@/hooks/useWebAuthn"

type AuthStep = "identifier" | "password" | "otp"

const digitMap: Record<string, string> = {
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
}

function normalizeDigits(value: string) {
    return value.replace(/[۰-۹٠-٩]/g, digit => digitMap[digit] || digit)
}

function sanitizeInput(value: string) {
    return normalizeDigits(value).trim()
}

function normalizePhone09(value: string) {
    let phone = sanitizeInput(value).replace(/[\s\-()]/g, "")
    if (!phone) return null

    if (phone.startsWith("+98")) phone = `0${phone.slice(3)}`
    else if (phone.startsWith("0098")) phone = `0${phone.slice(4)}`
    else if (phone.startsWith("98") && phone.length === 12) phone = `0${phone.slice(2)}`

    return /^09\d{9}$/.test(phone) ? phone : null
}

function isDisabledAccount(status?: string | null) {
    const normalized = status?.trim().toLowerCase()
    return normalized === "banned" || normalized === "suspended"
}

function hasPhoneNumber(user?: AuthUser | null) {
    const phone = user?.phone_number || user?.phone
    return Boolean(phone && String(phone).trim())
}

function describeError(error: unknown, fallback = "خطایی رخ داد. دوباره تلاش کنید.") {
    const raw = error instanceof Error ? error.message : String(error || "")

    if (!raw) return fallback
    if (raw.includes("AUTH_INVALID_CREDENTIALS") || raw.includes("invalid_credentials")) {
        return "نام کاربری یا رمز عبور اشتباه است."
    }
    if (raw.includes("AUTH_ACCOUNT_DISABLED")) return "حساب کاربری شما غیرفعال شده است."
    if (raw.includes("OTP_INVALID")) return "کد وارد شده اشتباه است"
    if (raw.includes("OTP_EXPIRED")) return "کد تایید منقضی شده است."
    if (raw.includes("OTP_RATE_LIMITED")) return "برای ارسال مجدد کد کمی صبر کنید."
    if (raw.includes("PHONE_INVALID")) return "شماره موبایل نامعتبر است"
    if (raw.includes("SMS_NOT_CONFIGURED")) return "سرویس پیامک روی بک‌اند تنظیم نشده است."
    if (raw.includes("SMS_DELIVERY_FAILED")) return "ارسال پیامک با خطا مواجه شد."

    return raw.replace(/^Error:\s*/, "").replace(/^Exception:\s*/, "").trim() || fallback
}

function isPasswordAccountError(error: unknown) {
    const text = String(error instanceof Error ? error.message : error || "").toLowerCase()
    return text.includes("auth_has_password") || text.includes("password") || text.includes("رمز عبور")
}

function resolvePostLoginPath(user: AuthUser, fallback: string) {
    if (user.profile_completed === false) return "/profile-setup"
    return fallback || "/feed"
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

    const passwordInputRef = useRef<HTMLInputElement>(null)
    const otpInputRef = useRef<HTMLInputElement>(null)

    const [redirectPath, setRedirectPath] = useState("/feed")
    const [step, setStep] = useState<AuthStep>("identifier")
    const [identifier, setIdentifier] = useState("")
    const [isPhoneInput, setIsPhoneInput] = useState(false)
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [otp, setOtp] = useState("")
    const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null)
    const [countdown, setCountdown] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [otpError, setOtpError] = useState<string | null>(null)
    const [isRegistering, setIsRegistering] = useState(false)
    const webAuthn = useWebAuthn()

    useEffect(() => {
        if (typeof window === "undefined") return
        const params = new URLSearchParams(window.location.search)
        const next = params.get("redirect") || params.get("next")
        if (next?.startsWith("/") && !next.startsWith("//")) {
            setRedirectPath(next)
        }
    }, [])

    useEffect(() => {
        if (!authLoading && user) {
            if (user.password_required) router.replace("/set-password")
            else if (user.profile_completed === false) router.replace("/profile-setup")
            else router.replace(redirectPath)
        }
    }, [authLoading, redirectPath, router, user])

    useEffect(() => {
        if (step !== "otp" || countdown <= 0) return
        const timer = window.setTimeout(() => setCountdown(v => Math.max(0, v - 1)), 1000)
        return () => window.clearTimeout(timer)
    }, [countdown, step])

    useEffect(() => {
        if (step === "password") {
            const t = window.setTimeout(() => passwordInputRef.current?.focus(), 300)
            return () => window.clearTimeout(t)
        }
        if (step === "otp") {
            const t = window.setTimeout(() => otpInputRef.current?.focus(), 300)
            return () => window.clearTimeout(t)
        }
    }, [step])

    const backToInput = () => {
        setStep("identifier")
        setError(null)
        setOtpError(null)
        setTwoFactorToken(null)
    }

    const finishPasswordLogin = (auth: AuthResponse) => {
        if (!hasPhoneNumber(auth.user)) {
            toast.message("لطفاً شماره موبایل خود را تایید کنید")
            setIdentifier("")
            setPassword("")
            setStep("identifier")
            toast.message("برای تکمیل حساب کاربری، شماره موبایل خود را وارد کنید")
            return
        }

        toast.success("ورود موفقیت‌آمیز بود")
        router.replace(resolvePostLoginPath(auth.user, redirectPath))
    }

    const handleIdentifierSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const input = sanitizeInput(identifier)
        if (!input) {
            setError("لطفاً ورودی را کامل کنید")
            return
        }

        setSubmitting(true)
        setError(null)
        setTwoFactorToken(null)

        const normalizedPhone = normalizePhone09(input)
        const phoneInput = normalizedPhone !== null
        setIsPhoneInput(phoneInput)

        try {
            const lookup = await lookupIdentifier(phoneInput ? normalizedPhone! : input)

            if (isDisabledAccount(lookup.account_status)) {
                setError("حساب کاربری شما غیرفعال شده است")
                return
            }

            if (phoneInput) {
                const nextPhone = lookup.normalized_identifier?.trim() || normalizedPhone!
                setIdentifier(nextPhone)

                if (lookup.exists && lookup.auth_flow === "password") {
                    setIsRegistering(false)
                    setStep("password")
                } else if (lookup.exists) {
                    setIsRegistering(false)
                    await requestOtp(nextPhone, false)
                } else {
                    setIsRegistering(true)
                    setStep("password")
                }
                return
            }

            if (lookup.exists) {
                setIsRegistering(false)
                setStep("password")
            } else {
                setError("برای ثبت نام جدید لطفاً از شماره موبایل استفاده کنید")
            }
        } catch (err) {
            setError(describeError(err, `خطا در بررسی اطلاعات: ${err}`))
        } finally {
            setSubmitting(false)
        }
    }

    const requestOtp = async (phoneNumber?: string, isResend = true) => {
        const phone = normalizePhone09(sanitizeInput(phoneNumber ?? identifier))
        if (!phone) {
            setError("شماره موبایل نامعتبر است")
            return
        }

        setIdentifier(phone)
        if (!isResend) setSubmitting(true)
        setError(null)
        setOtpError(null)

        try {
            await sendOtp(phone)
            setOtp("")
            setCountdown(60)
            setStep("otp")
            if (isResend) toast.success("کد تایید مجدداً ارسال شد")
        } catch (err) {
            if (isPasswordAccountError(err)) {
                setIsRegistering(false)
                setPassword("")
                setStep("password")
                return
            }
            setError(describeError(err, "خطا در ارسال کد"))
        } finally {
            setSubmitting(false)
        }
    }

    const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!password) {
            setError("لطفاً رمز عبور را وارد کنید")
            return
        }

        setSubmitting(true)
        setError(null)

        if (isRegistering) {
            await requestOtp(undefined, false)
            return
        }

        try {
            const input = sanitizeInput(identifier)
            const loginIdentifier = isPhoneInput
                ? (normalizePhone09(input) ?? input)
                : input.toLowerCase()

            const auth = twoFactorToken
                ? await verify2fa(twoFactorToken, password)
                : await signIn(loginIdentifier, password)

            finishPasswordLogin(auth)
        } catch (err) {
            setError(describeError(err, `خطا در ورود: ${err}`))
        } finally {
            setSubmitting(false)
        }
    }

    const submitOtp = async (codeOverride?: string) => {
        const cleanOtp = sanitizeInput(codeOverride ?? otp)
        const phone = normalizePhone09(sanitizeInput(identifier))
        if (!phone) {
            setOtpError("شماره موبایل نامعتبر است")
            return
        }
        if (cleanOtp.length < 4) return

        setSubmitting(true)
        setOtpError(null)

        try {
            const response = await verifyOtp(phone, cleanOtp)

            if (response.is_2fa_required && response.two_factor_token) {
                setTwoFactorToken(response.two_factor_token)
                setPassword("")
                setStep("password")
                toast.message("حساب شما مجهز به تایید دو مرحله‌ای است")
                return
            }

            if (!response.auth) {
                setOtpError("پاسخ ورود کامل نبود")
                return
            }

            if (isRegistering) {
                if (password) {
                    try {
                        await registerWithPassword({
                            phone_number: phone,
                            password,
                            full_name: "",
                        })
                    } catch (regErr) {
                        console.error("Error setting password during registration:", regErr)
                    }
                }

                toast.success("خوش آمدید!")
                const authUser = response.auth.user
                if (response.auth.is_new_user || authUser.profile_completed === false) {
                    router.replace("/profile-setup")
                } else {
                    router.replace(redirectPath)
                }
                return
            }

            router.replace("/set-password")
        } catch (err) {
            setOtpError(describeError(err))
        } finally {
            setSubmitting(false)
        }
    }

    const handleOtpSubmit = async (event?: FormEvent) => {
        event?.preventDefault()
        await submitOtp()
    }

    const handleForgotPassword = () => {
        const prefill = sanitizeInput(identifier)
        const method = isPhoneInput ? "sms" : "email"
        router.push(`/auth/reset-password?prefill=${encodeURIComponent(prefill)}&method=${method}`)
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-vista-primary" />
            </div>
        )
    }

    return (
        <main dir="rtl" className="relative min-h-screen overflow-hidden">
            <AnimatedRibbonBackground />

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
                {step === "identifier" && (
                    <form onSubmit={handleIdentifierSubmit} className="flex flex-col items-stretch">
                        <div className="mb-12 flex justify-center">
                            <Image
                                src="/assets/images/logo-white.png"
                                alt="Vista"
                                width={200}
                                height={100}
                                priority
                                className="h-[100px] w-auto object-contain brightness-0 dark:brightness-100"
                            />
                        </div>

                        <h1 className="mb-8 text-center text-2xl font-bold text-zinc-950 dark:text-white">
                            ورود به ویستا
                        </h1>

                        {error && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                                {error}
                            </div>
                        )}

                        <Input
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            placeholder="شماره موبایل، ایمیل یا نام کاربری"
                            autoComplete="username"
                            dir="ltr"
                            className="text-left"
                            icon={<UserRound size={18} />}
                        />

                        <Button type="submit" size="lg" loading={submitting} className="mt-6 w-full btn-vista">
                            ادامه
                        </Button>

                        {webAuthn.isSupported && webAuthn.isRegistered && (
                            <button
                                type="button"
                                onClick={async () => {
                                    const ok = await webAuthn.authenticate()
                                    if (ok) {
                                        toast.success('ورود موفق')
                                        router.replace(redirectPath)
                                    }
                                }}
                                disabled={webAuthn.loading}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-vista-primary/30 text-vista-primary font-semibold text-sm hover:bg-vista-primary/5 transition-colors disabled:opacity-50"
                            >
                                {webAuthn.loading
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <Fingerprint className="w-5 h-5" />
                                }
                                ورود با اثر انگشت / Face ID
                            </button>
                        )}

                        <p className="mt-5 text-center text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                            با ورود به ویستا، قوانین و مقررات را می‌پذیرم.
                        </p>
                    </form>
                )}

                {step === "password" && (
                    <form onSubmit={handlePasswordSubmit} className="flex flex-col items-stretch">
                        <button
                            type="button"
                            onClick={backToInput}
                            className="mb-6 inline-flex items-center gap-2 self-start text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        >
                            <ArrowRight className="h-4 w-4" />
                            بازگشت
                        </button>

                        <h1 className="mb-2 text-center text-2xl font-bold text-zinc-950 dark:text-white">
                            {isRegistering ? "انتخاب رمز عبور" : twoFactorToken ? "رمز عبور خود را وارد کنید" : "رمز عبور خود را وارد کنید"}
                        </h1>

                        {isRegistering && (
                            <p className="mb-8 text-center text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                                رمز عبوری شامل حداقل ۸ کاراکتر ترکیبی از حروف و اعداد انتخاب کنید.
                            </p>
                        )}

                        {error && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                                {error}
                            </div>
                        )}

                        <Input
                            ref={passwordInputRef}
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="رمز عبور"
                            autoComplete={isRegistering ? "new-password" : "current-password"}
                            dir="ltr"
                            className="text-left"
                            icon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-100"
                                    aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        />

                        <Button type="submit" size="lg" loading={submitting} className="mt-6 w-full btn-vista">
                            {isRegistering ? "تایید و دریافت کد پیامکی" : "ورود"}
                        </Button>

                        {!isRegistering && !twoFactorToken && (
                            <button
                                type="button"
                                className="mt-4 text-center text-sm text-vista-primary hover:underline"
                                onClick={handleForgotPassword}
                            >
                                فراموشی رمزعبور؟
                            </button>
                        )}
                    </form>
                )}

                {step === "otp" && (
                    <form onSubmit={handleOtpSubmit} className="flex flex-col items-stretch">
                        <button
                            type="button"
                            onClick={backToInput}
                            className="mb-6 inline-flex items-center gap-2 self-start text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        >
                            <ArrowRight className="h-4 w-4" />
                            بازگشت
                        </button>

                        <h1 className="mb-3 text-center text-2xl font-bold text-zinc-950 dark:text-white">
                            کد تایید
                        </h1>
                        <p className="mb-8 text-center text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                            کد ارسال شده به شماره {identifier} را وارد کنید
                        </p>

                        <Input
                            ref={otpInputRef}
                            inputMode="numeric"
                            maxLength={5}
                            value={otp}
                            onChange={e => {
                                const next = normalizeDigits(e.target.value).replace(/\D/g, "")
                                setOtp(next)
                                if (next.length === 5) void submitOtp(next)
                            }}
                            placeholder="12345"
                            autoComplete="one-time-code"
                            dir="ltr"
                            className="text-center text-lg tracking-[0.35em]"
                            icon={<KeyRound size={18} />}
                        />

                        {otpError && (
                            <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{otpError}</p>
                        )}

                        <div className="mt-8 text-center">
                            {countdown > 0 ? (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    ارسال مجدد کد در {countdown} ثانیه
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => requestOtp(undefined, true)}
                                    disabled={submitting}
                                    className="text-sm font-medium text-vista-primary hover:underline disabled:opacity-50"
                                >
                                    ارسال مجدد کد
                                </button>
                            )}
                        </div>

                        <Button type="submit" size="lg" loading={submitting} className="mt-6 w-full btn-vista">
                            تایید
                        </Button>
                    </form>
                )}
            </div>
        </main>
    )
}
