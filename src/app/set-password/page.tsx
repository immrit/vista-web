"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, LockKeyhole, Eye, EyeOff, Loader2 } from "lucide-react"
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

    useEffect(() => {
        if (!authLoading && !user) router.replace("/auth")
        else if (!authLoading && user && !user.password_required) router.replace("/feed")
    }, [authLoading, user, router])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!password) { setError("لطفاً رمز عبور خود را وارد کنید."); return }
        if (password.length < 8) { setError("رمز عبور باید حداقل ۸ کاراکتر باشد."); return }
        if (password !== confirmPassword) { setError("رمز عبور و تایید آن مطابقت ندارند."); return }

        setSubmitting(true)
        setError(null)
        try {
            await apiClient.post("/v1/auth/2fa/setup", { password })
            await refreshSession()
            if (!user?.profile_completed) router.replace("/profile-setup")
            else router.replace("/feed")
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "تنظیم رمز عبور با خطا مواجه شد.")
        } finally {
            setSubmitting(false)
        }
    }

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-vista-bg dark:bg-vista-bg-dark flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-vista-primary" />
            </div>
        )
    }

    return (
        <main dir="rtl" className="min-h-screen relative overflow-hidden bg-vista-bg dark:bg-vista-bg-dark flex items-center justify-center px-4 py-8">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-vista-primary/10 blur-3xl" />
            </div>
            <div className="relative w-full max-w-md glass-card p-6 sm:p-8">
                <div className="mb-8 flex items-center justify-between">
                    <Logo size="md" variant="default" />
                    <div className="inline-flex items-center gap-2 rounded-full bg-vista-primary-light dark:bg-vista-primary/20 px-3 py-1 text-xs text-vista-primary font-medium">
                        <ShieldCheck className="h-4 w-4" />
                        امنیت حساب
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-2">تعریف رمز عبور</h2>
                <p className="text-sm text-vista-text-secondary mb-6 leading-relaxed">
                    برای امنیت بیشتر، یک رمز عبور برای حساب خود تعریف کنید.
                </p>

                {error && (
                    <div className="mb-5 rounded-xl border border-vista-error/30 bg-vista-error/10 px-4 py-3 text-sm text-vista-error">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">رمز عبور جدید</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="حداقل ۸ کاراکتر" className="input-vista pl-10" autoComplete="new-password" />
                            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-vista-text-secondary">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">تایید رمز عبور</label>
                        <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="رمز عبور را دوباره وارد کنید" className="input-vista" autoComplete="new-password" />
                    </div>
                    <button type="submit" disabled={submitting} className="btn-vista w-full flex items-center justify-center gap-2">
                        {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                        ثبت رمز عبور
                    </button>
                </form>
            </div>
        </main>
    )
}
