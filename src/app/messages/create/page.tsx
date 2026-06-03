"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Camera, Loader2, Users, Check } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { groupApi } from "@/lib/groupApi"
import { UploadService } from "@/lib/uploadService"

export default function CreateGroupPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [name, setName] = useState("")
    const [maxMembers, setMaxMembers] = useState("20")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (authLoading) return null
    if (!user) {
        router.replace('/auth')
        return null
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleCreate = async () => {
        if (!name.trim()) {
            setError("نام گروه را وارد کنید.")
            return
        }

        setLoading(true)
        setError(null)

        try {
            let imageUrl = undefined
            if (imageFile) {
                imageUrl = await UploadService.uploadAvatar(imageFile, user.id)
            }

            const conversation = await groupApi.createGroup({
                name: name.trim(),
                image_url: imageUrl,
                max_members: parseInt(maxMembers) || 20,
            })

            router.push(`/messages?conversation=${conversation.id}`)
        } catch (err: any) {
            console.error(err)
            setError(err.message || "خطا در ساخت گروه")
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 flex-col">
            {/* Header */}
            <header className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">گروه جدید</h1>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-xl mx-auto space-y-8">
                    {error && (
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/50">
                            {error}
                        </div>
                    )}

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-28 h-28 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer group overflow-hidden"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="w-8 h-8 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                        >
                            تغییر عکس گروه
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-5 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                نام گروه
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="نام گروه را وارد کنید..."
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                maxLength={50}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                ظرفیت گروه
                            </label>
                            <div className="relative">
                                <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                <select
                                    value={maxMembers}
                                    onChange={(e) => setMaxMembers(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pr-10 pl-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                >
                                    <option value="20">۲۰ نفر (رایگان)</option>
                                    <option value="50">۵۰ نفر (استاندارد)</option>
                                    <option value="100">۱۰۰ نفر (ویژه)</option>
                                    <option value="500">۵۰۰ نفر (تجاری)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={loading || !name.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 dark:disabled:text-zinc-600 text-white rounded-xl py-3.5 font-medium transition-colors"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Check className="w-5 h-5" />
                        )}
                        {loading ? "در حال ساخت..." : "ساخت گروه"}
                    </button>
                </div>
            </main>
        </div>
    )
}
