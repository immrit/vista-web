'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowRight, Trophy, Crown, Loader2, Flag } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { apiClient } from '@/lib/apiClient'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/lib/game/questions'

interface PublicProfile {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  level: number
  xp: number
  wins: number
  losses: number
  ties: number
  totalMatches: number
  categoryStats: Record<string, { correct: number, total: number }>
}

export default function PublicGameProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<PublicProfile | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.get<PublicProfile>(`/v1/game/profile?userId=${userId}`)
      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error(error)
      toast.error('خطا در دریافت پروفایل کاربر')
      router.back()
    } finally {
      setLoading(false)
    }
  }, [userId, router])

  useEffect(() => {
    if (userId) {
      fetchProfile()
    }
  }, [userId, fetchProfile])

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#114b82] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    )
  }

  const displayName = profile.displayName || 'بازیکن'
  const avatarUrl = profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/png?seed=${userId}`

  return (
    <div className="min-h-screen bg-[#114b82] flex justify-center font-sans">
      <div className="w-full max-w-md bg-[#1b73b5] flex flex-col h-[100dvh] relative shadow-2xl">
        <div className="flex items-center p-4 bg-[#1b73b5] sticky top-0 z-20 shadow-md">
          <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-lg mr-4">پروفایل بازیکن</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Header Section */}
          <div className="bg-gradient-to-b from-[#1b73b5] to-[#114b82] pt-10 pb-8 px-4 flex flex-col items-center border-b border-white/10">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#3ca2ea] bg-white shadow-xl">
                <Avatar src={avatarUrl} alt="Avatar" className="w-full h-full" />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#78c02c] text-white text-sm font-black px-5 py-1.5 rounded-full shadow-lg border-2 border-white whitespace-nowrap">
                سطح {profile.level}
              </div>
            </div>
            
            <h2 className="text-white font-black text-3xl mt-6">{displayName}</h2>
            
            <div className="flex items-center space-x-2 space-x-reverse text-white/70 text-sm mt-2">
              <Crown size={16} className="text-yellow-400" />
              <span>بازیکن ویستا کوییز</span>
            </div>
            
            <div className="mt-6 flex space-x-3 space-x-reverse">
              <button 
                onClick={() => router.push(`/game/duel/create?opponent=${userId}`)}
                className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2.5 px-6 rounded-xl shadow-[0_4px_0_#a16207] active:translate-y-1 active:shadow-none transition-all flex items-center space-x-2 space-x-reverse"
              >
                <Trophy size={18} />
                <span>دعوت به دوئل</span>
              </button>
              <button 
                onClick={() => toast.success('گزارش تخلف ثبت شد. با تشکر!')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-4 rounded-xl border border-white/20 transition-all flex items-center justify-center"
              >
                <Flag size={18} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Stats */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 text-white backdrop-blur-sm shadow-md space-y-5">
              {/* Top Stats */}
              <div className="flex justify-between items-center px-4">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-white/60 text-xs font-bold mb-1">تعداد بازی</span>
                  <span className="font-black text-2xl text-white">{profile.totalMatches.toLocaleString('fa-IR')}</span>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-white/60 text-xs font-bold mb-1">بردها</span>
                  <span className="font-black text-2xl text-[#78c02c]">{profile.wins.toLocaleString('fa-IR')}</span>
                </div>
              </div>

              <hr className="border-white/10" />

              {/* Match Results */}
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <div className="w-3 h-3 rounded-full bg-[#78c02c]"></div>
                  <span className="font-bold">{profile.wins} برد</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span className="font-bold">{profile.ties} مساوی</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="font-bold">{profile.losses} باخت</span>
                </div>
              </div>

              {/* Category Skills */}
              {Object.keys(profile.categoryStats).length > 0 && (
                <>
                  <hr className="border-white/10" />
                  <div>
                    <h4 className="text-xs font-bold text-white/60 mb-3">مهارت در دسته‌بندی‌ها</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(profile.categoryStats).map(([catId, stat]) => {
                        const cat = CATEGORIES[catId as keyof typeof CATEGORIES];
                        if (!cat) return null;
                        const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                        return (
                          <div key={catId} className="flex items-center justify-between bg-black/20 rounded-lg p-2.5 border border-white/5">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-lg">{cat.icon}</span>
                              <span className="text-[11px] font-bold text-white/80">{cat.label}</span>
                            </div>
                            <span className={cn(
                              "text-xs font-black",
                              pct >= 70 ? "text-[#78c02c]" : pct >= 40 ? "text-yellow-400" : "text-red-400"
                            )}>{pct}٪</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
