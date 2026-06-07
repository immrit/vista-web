"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, LockKeyhole, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Logo } from "@/components/ui/Logo"
import { useAuth } from "@/hooks/useAuth"
import { apiClient } from "@/lib/apiClient"

export default function SetPasswordPage() {
    const router = useRouter()
    const { user, loading: authLoading, refreshSession } = useAuth()
    
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Redirect to login if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/auth")
        } else if (!authLoading && user && !user.password_required) {
            router.replace("/feed")
        }
    }, [authLoading, user, router])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!password) {
            setError("لطفاً رمز عبور خود را وارد کنید.")
            return
        }

        if (password.length < 8) {
            setError("رمز عبور باید حداقل ۸ کاراکتر باشد.")
            return
        }

        if (password !== confirmPassword) {
            setError("رمز عبور و تایید آن مطابقت ندارند.")
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            await apiClient.post("/v1/auth/2fa/setup", { password })

            await refreshSession()
            // Password setup successful. Redirect to feed.
            router.replace("/feed")
        } catch (err: any) {
            setError(err.message || "تنظیم رمز عبور با خطا مواجه شد. لطفاً دوباره تلاش کنید.")
        } finally {
            setSubmitting(false)
        }
    }

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    return (
        <main
            dir="rtl"
            className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_32%),linear-gradient(135deg,#09090b,#18181b_48%,#111827)] px-4 py-8 text-zinc-950 dark:text-white flex items-center justify-center"
        >
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-zinc-950 p-6 sm:p-8">
                <div className="mb-8 flex items-center justify-between">
                    <Logo size="md" variant="default" />
                    <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                        <ShieldCheck className="h-4 w-4" />
                        امنیت حساب
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">تعریف رمز عبور</h2>
                    <p className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                        شما با موفقیت وارد شدید. برای امنیت بیشتر و همچنین امکان ورود سریع‌تر در آینده، لطفاً یک رمز عبور برای حساب خود تعریف کنید.
                    </p>
                </div>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="رمز عبور جدید"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        placeholder="حداقل ۸ کاراکتر"
                        autoComplete="new-password"
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

                    <Input
                        label="تایید رمز عبور"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={event => setConfirmPassword(event.target.value)}
                        placeholder="رمز عبور را دوباره وارد کنید"
                        autoComplete="new-password"
                        icon={<LockKeyhole size={18} className="text-zinc-400" />}
                    />

                    <Button
                        type="submit"
                        size="lg"
                        loading={submitting}
                        className="w-full bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                    >
                        ثبت رمز عبور
                    </Button>
                </form>
            </div>
        </main>
    )
}
