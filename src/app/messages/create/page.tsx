"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Camera, Loader2, Users, Check } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { groupApi } from "@/lib/groupApi"
import { UploadService } from "@/lib/uploadService"
import { SettingsPageShell } from "@/components/settings/VistaSettingsWidgets"

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
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "خطا در ساخت گروه")
            setLoading(false)
        }
    }

    return (
        <SettingsPageShell title="گروه جدید" backHref="/messages">
            <div className="max-w-xl mx-auto space-y-8">
                {error && (
                    <div className="p-4 rounded-xl bg-vista-error/10 text-vista-error text-sm border border-vista-error/30">
                        {error}
                    </div>
                )}

                <div className="flex flex-col items-center gap-4">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-28 h-28 rounded-full bg-vista-surface-variant dark:bg-vista-surface-variant-dark border-2 border-dashed border-vista-border dark:border-vista-border-dark flex items-center justify-center overflow-hidden hover:border-vista-primary transition-colors"
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Camera className="w-8 h-8 text-vista-text-secondary" />
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-vista-primary font-medium">
                        تغییر عکس گروه
                    </button>
                </div>

                <div className="space-y-5 glass-card p-5">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">نام گروه</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="نام گروه..." className="input-vista" maxLength={50} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">ظرفیت گروه</label>
                        <div className="relative">
                            <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vista-text-secondary" />
                            <select value={maxMembers} onChange={e => setMaxMembers(e.target.value)} className="input-vista pr-10 appearance-none">
                                <option value="20">۲۰ نفر</option>
                                <option value="50">۵۰ نفر</option>
                                <option value="100">۱۰۰ نفر</option>
                                <option value="500">۵۰۰ نفر</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button onClick={handleCreate} disabled={loading || !name.trim()} className="btn-vista w-full flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {loading ? "در حال ساخت..." : "ساخت گروه"}
                </button>
            </div>
        </SettingsPageShell>
    )
}
