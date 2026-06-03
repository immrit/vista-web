"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Copy,
    ExternalLink,
    Loader2,
    MessageCircle,
    Smartphone,
    UsersRound,
    Users,
    Lock,
    Globe,
    Crown,
    Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Logo } from "@/components/ui/Logo"
import { Avatar } from "@/components/ui/Avatar"
import { useAuth } from "@/hooks/useAuth"
import { GroupInvitePreview, groupApi } from "@/lib/groupApi"

function getParamCode(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value || ""
}

function isProbablyMobile() {
    if (typeof navigator === "undefined") return false
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

function inviteErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : String(error || "")

    if (message.includes("INVITE_NOT_FOUND")) return "لینک دعوت پیدا نشد یا حذف شده است."
    if (message.includes("INVITE_DISABLED")) return "این لینک دعوت توسط مدیر گروه غیرفعال شده است."
    if (message.includes("MAX_MEMBERS_EXCEEDED")) return "ظرفیت گروه تکمیل شده است."
    if (message.includes("unauthorized")) return "برای عضویت ابتدا وارد حساب خود شوید."

    return message || "امکان بررسی لینک دعوت وجود ندارد."
}

export default function GroupInvitePage() {
    const params = useParams()
    const router = useRouter()
    const code = useMemo(() => decodeURIComponent(getParamCode(params?.code)), [params])
    const appDeepLink = useMemo(() => `vista://group/${encodeURIComponent(code)}`, [code])
    const publicLink = useMemo(() => {
        if (typeof window === "undefined") return `/group/${code}`
        return `${window.location.origin}/group/${encodeURIComponent(code)}`
    }, [code])

    const { user, loading: authLoading } = useAuth()
    const [preview, setPreview] = useState<GroupInvitePreview | null>(null)
    const [loadingPreview, setLoadingPreview] = useState(true)
    const [joining, setJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [notice, setNotice] = useState<string | null>(null)
    const [appFallbackVisible, setAppFallbackVisible] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!code) {
            setError("کد دعوت معتبر نیست.")
            setLoadingPreview(false)
            return
        }

        let ignore = false
        setLoadingPreview(true)
        setError(null)

        groupApi.previewInvite(code)
            .then(data => {
                if (ignore) return
                setPreview(data)
                setError(null)
            })
            .catch(err => {
                if (ignore) return
                setPreview(null)
                setError(inviteErrorMessage(err))
            })
            .finally(() => {
                if (!ignore) setLoadingPreview(false)
            })

        return () => {
            ignore = true
        }
    }, [code])

    useEffect(() => {
        if (!code || !isProbablyMobile()) return

        let returnedToPage = true
        const openTimer = window.setTimeout(() => {
            window.location.href = appDeepLink
        }, 450)
        const fallbackTimer = window.setTimeout(() => {
            if (returnedToPage) setAppFallbackVisible(true)
        }, 1800)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                returnedToPage = false
                window.clearTimeout(fallbackTimer)
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            window.clearTimeout(openTimer)
            window.clearTimeout(fallbackTimer)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [appDeepLink, code])

    const openInApp = () => {
        window.location.href = appDeepLink
        window.setTimeout(() => setAppFallbackVisible(true), 1200)
    }

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(publicLink)
            setCopied(true)
            setNotice("لینک دعوت کپی شد!")
            setTimeout(() => {
                setCopied(false)
                setNotice(null)
            }, 2500)
        } catch {
            setNotice("کپی خودکار ممکن نشد؛ لینک را از نوار آدرس بردارید.")
        }
    }

    const openConversation = (conversationId: string) => {
        router.replace(`/messages?conversation=${encodeURIComponent(conversationId)}`)
    }

    const joinWithWeb = async () => {
        if (!preview) return

        if (!user) {
            router.push(`/auth?redirect=/group/${encodeURIComponent(code)}`)
            return
        }

        if (preview.is_member) {
            openConversation(preview.id)
            return
        }

        setJoining(true)
        setError(null)
        setNotice(null)

        try {
            const conversation = await groupApi.joinByInvite(code)
            openConversation(conversation.id || preview.id)
        } catch (err) {
            setError(inviteErrorMessage(err))
        } finally {
            setJoining(false)
        }
    }

    const capacityPct = preview
        ? Math.min(100, (preview.member_count / preview.max_members) * 100)
        : 0

    return (
        <main
            dir="rtl"
            className="min-h-screen bg-[radial-gradient(circle_at_25%_15%,rgba(249,115,22,0.15),transparent_35%),radial-gradient(circle_at_75%_80%,rgba(168,85,247,0.12),transparent_40%),linear-gradient(160deg,#09090b_0%,#18181b_50%,#0f0f14_100%)] flex items-center justify-center px-4 py-8"
        >
            <div className="w-full max-w-sm">
                {/* Logo header */}
                <div className="text-center mb-6">
                    <Logo size="md" variant="white" />
                    <p className="text-zinc-500 text-xs mt-1">دعوت به گروه</p>
                </div>

                {/* Card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-zinc-900/80 backdrop-blur-xl shadow-2xl shadow-black/60">
                    {/* Decorative gradient top */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-orange-500/10 blur-2xl rounded-full" />

                    <div className="relative p-6">
                        {/* Loading state */}
                        {loadingPreview ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                                        <UsersRound className="w-7 h-7 text-zinc-500" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                                        <Loader2 className="w-3 h-3 text-orange-400 animate-spin" />
                                    </div>
                                </div>
                                <p className="text-zinc-400 text-sm">در حال بررسی لینک دعوت...</p>
                            </div>

                        ) : error && !preview ? (
                            /* Error state */
                            <div className="flex flex-col items-center text-center py-8 gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <AlertCircle className="w-8 h-8 text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold text-lg">لینک نامعتبر</h2>
                                    <p className="text-zinc-400 text-sm mt-2 leading-6">{error}</p>
                                </div>
                                <Button
                                    onClick={() => router.push("/feed")}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border-0"
                                >
                                    بازگشت به ویستا
                                </Button>
                            </div>

                        ) : (
                            /* Success state */
                            <div className="space-y-5">
                                {/* Group info */}
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-orange-500/30 ring-offset-2 ring-offset-zinc-900">
                                            <Avatar
                                                src={preview?.image || undefined}
                                                alt={preview?.name || "گروه ویستا"}
                                                size="xl"
                                            />
                                        </div>
                                        {preview?.is_member && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-teal-500 border-2 border-zinc-900 flex items-center justify-center">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-white font-bold text-xl truncate leading-tight">
                                            {preview?.name || "گروه ویستا"}
                                        </h1>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="inline-flex items-center gap-1 text-zinc-400 text-xs">
                                                <Users className="w-3.5 h-3.5" />
                                                {preview?.member_count.toLocaleString("fa-IR")} نفر
                                            </span>
                                            <span className="text-zinc-600">·</span>
                                            <span className="inline-flex items-center gap-1 text-zinc-400 text-xs">
                                                <Globe className="w-3.5 h-3.5" />
                                                عمومی
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Capacity bar */}
                                {preview && (
                                    <div className="bg-zinc-800/50 rounded-2xl p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-zinc-400 text-xs">ظرفیت گروه</span>
                                            <span className="text-zinc-300 text-xs font-medium">
                                                {preview.member_count.toLocaleString("fa-IR")} / {preview.max_members.toLocaleString("fa-IR")}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    capacityPct > 80
                                                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                                        : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                                                }`}
                                                style={{ width: `${capacityPct}%` }}
                                            />
                                        </div>
                                        {preview.is_full && !preview.is_member && (
                                            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                                <Lock className="w-3 h-3" />
                                                ظرفیت تکمیل است
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Status messages */}
                                {notice && (
                                    <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 px-4 py-3 text-sm text-teal-300 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        {notice}
                                    </div>
                                )}
                                {error && !loadingPreview && (
                                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                                        {error}
                                    </div>
                                )}
                                {appFallbackVisible && !notice && (
                                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200 leading-6">
                                        اگر اپ باز نشد، می‌توانید با نسخه وب وارد شوید.
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="space-y-2.5">
                                    {/* Primary: Open in App */}
                                    <button
                                        onClick={openInApp}
                                        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold text-sm hover:from-orange-400 hover:to-rose-400 transition-all duration-200 shadow-lg shadow-orange-500/30 active:scale-[0.98]"
                                    >
                                        <Smartphone className="w-5 h-5" />
                                        باز کردن در اپ ویستا
                                        <Sparkles className="w-4 h-4 opacity-70" />
                                    </button>

                                    {/* Secondary: Join with web */}
                                    <button
                                        onClick={joinWithWeb}
                                        disabled={Boolean((preview?.is_full && !preview?.is_member) || joining || authLoading)}
                                        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-white/8 text-white font-medium text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                                    >
                                        {joining ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <MessageCircle className="w-5 h-5" />
                                        )}
                                        {preview?.is_member
                                            ? "باز کردن گفتگو"
                                            : user
                                            ? "عضویت با نسخه وب"
                                            : "ورود و عضویت"}
                                    </button>

                                    {/* Copy link */}
                                    <button
                                        onClick={copyLink}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-medium transition-colors hover:bg-zinc-800/50"
                                    >
                                        <Copy className={`w-3.5 h-3.5 ${copied ? 'text-teal-400' : ''}`} />
                                        {copied ? 'کپی شد!' : 'کپی لینک دعوت'}
                                    </button>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-2 border-t border-white/6 text-[11px] text-zinc-600">
                                    <span className="font-mono opacity-60">{code.substring(0, 16)}{code.length > 16 ? '...' : ''}</span>
                                    <button
                                        onClick={() => router.push("/feed")}
                                        className="flex items-center gap-1 hover:text-zinc-400 transition-colors"
                                    >
                                        <ArrowLeft className="w-3 h-3" />
                                        ویستا
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom note */}
                <p className="text-center text-zinc-600 text-[11px] mt-4">
                    ویستا · شبکه اجتماعی ایرانی
                </p>
            </div>
        </main>
    )
}
