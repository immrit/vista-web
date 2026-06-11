'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Save, ShoppingCart, UserCircle, Crown, Loader2, CheckCircle2 } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/lib/game/questions'

const PREDEFINED_AVATARS = [
  // Boys (Happy/Competitive)
  { id: 'b1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4&mouth=smile&eyes=happy' },
  { id: 'b2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=b6e3f4&mouth=smile&eyes=wink' },
  { id: 'b3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper&backgroundColor=b6e3f4&mouth=twinkle&eyes=happy' },
  { id: 'b4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam&backgroundColor=b6e3f4&mouth=smile&eyes=squint' },
  { id: 'b5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=b6e3f4&mouth=smile&eyes=happy' },
  { id: 'b6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4&mouth=smile&eyes=wink' },
  
  // Girls (Happy/Competitive)
  { id: 'g1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf&mouth=smile&eyes=happy' },
  { id: 'g2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe&backgroundColor=ffdfbf&mouth=smile&eyes=wink' },
  { id: 'g3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=ffdfbf&mouth=smile&eyes=happy' },
  { id: 'g4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=ffdfbf&mouth=twinkle&eyes=happy' },
  { id: 'g5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoey&backgroundColor=ffdfbf&mouth=smile&eyes=squint' },
  { id: 'g6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffdfbf&mouth=smile&eyes=happy' },

  // Adventure/Gaming Style
  { id: 'a1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack&backgroundColor=ffd5dc' },
  { id: 'a2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffd5dc' },
  { id: 'a3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=d1d5db' },
  { id: 'a4', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Cleo&backgroundColor=d1d5db' },
]

export default function GameProfilePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [coins, setCoins] = useState(0)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
  const [ties, setTies] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)
  const [categoryStats, setCategoryStats] = useState<Record<string, { correct: number, total: number }>>({})
  
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  
  const currentUserId = user?.id || profile?.id
  const vistaUsername = profile?.username || user?.username || 'ناشناس'

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.get<{ 
        coins: number; xp: number; level: number; 
        displayName: string | null; avatarUrl: string | null;
        wins: number; losses: number; ties: number; totalMatches: number;
        categoryStats: Record<string, { correct: number, total: number }>
      }>('/v1/game/profile')
      
      if (data) {
        setCoins(data.coins)
        setXp(data.xp)
        setLevel(data.level)
        setWins(data.wins || 0)
        setLosses(data.losses || 0)
        setTies(data.ties || 0)
        setTotalMatches(data.totalMatches || 0)
        setCategoryStats(data.categoryStats || {})
        
        // Defaults to main profile if game profile is not set
        setDisplayName(data.displayName || profile?.full_name || profile?.username || user?.full_name || user?.username || 'بازیکن')
        setAvatarUrl(data.avatarUrl || profile?.avatar_url || user?.avatar_url || '')
      }
    } catch (error) {
      console.error(error)
      toast.error('خطا در دریافت اطلاعات پروفایل')
    } finally {
      setLoading(false)
    }
  }, [currentUserId, profile, user])

  useEffect(() => {
    if (!authLoading && currentUserId) {
      fetchProfile()
    } else if (!authLoading && !currentUserId) {
      router.push('/auth')
    }
  }, [authLoading, currentUserId, fetchProfile, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error('نام نمایشی نمی‌تواند خالی باشد')
      return
    }
    
    try {
      setSaving(true)
      await apiClient.put('/v1/game/profile', {
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || null
      })
      toast.success('پروفایل بازی شما با موفقیت بروزرسانی شد!')
    } catch (error) {
      console.error(error)
      toast.error('خطا در ذخیره تغییرات')
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#114b82] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#114b82] flex justify-center font-sans">
      <div className="w-full max-w-md bg-[#1b73b5] flex flex-col h-[100dvh] relative shadow-2xl">
        <div className="flex items-center p-4 bg-[#1b73b5] sticky top-0 z-20 shadow-md">
          <button onClick={() => router.push('/game')} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-lg mr-4">پروفایل ویستا کوییز</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Header Section */}
          <div className="bg-gradient-to-b from-[#1b73b5] to-[#114b82] pt-8 pb-6 px-4 flex flex-col items-center border-b border-white/10">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#3ca2ea] bg-white shadow-xl flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={64} className="text-slate-300" />
                )}
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#78c02c] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg border-2 border-white whitespace-nowrap">
                سطح {level}
              </div>
            </div>
            
            <h2 className="text-white font-black text-2xl mt-5">{displayName}</h2>
            <div className="bg-black/20 px-3 py-1 rounded-full mt-1 mb-1 border border-white/10">
              <span className="text-white/60 text-xs font-mono">@{vistaUsername}</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-white/70 text-sm mt-1">
              <Crown size={16} className="text-yellow-400" />
              <span>بازیکن ویستا کوییز</span>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Stats */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white backdrop-blur-sm shadow-md space-y-4">
              {/* Top Stats */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-white/60 text-xs font-bold mb-1">XP</span>
                  <span className="font-black text-xl text-[#3ca2ea]">{xp.toLocaleString('fa-IR')}</span>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-white/60 text-xs font-bold mb-1">سکه</span>
                  <span className="font-black text-xl text-yellow-400">{coins.toLocaleString('fa-IR')}</span>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-white/60 text-xs font-bold mb-1">تعداد بازی</span>
                  <span className="font-black text-xl text-white">{totalMatches.toLocaleString('fa-IR')}</span>
                </div>
              </div>

              <hr className="border-white/10" />

              {/* Match Results */}
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <div className="w-3 h-3 rounded-full bg-[#78c02c]"></div>
                  <span className="font-bold">{wins} برد</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span className="font-bold">{ties} مساوی</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="font-bold">{losses} باخت</span>
                </div>
              </div>

              {/* Category Skills */}
              {Object.keys(categoryStats).length > 0 && (
                <>
                  <hr className="border-white/10" />
                  <div>
                    <h4 className="text-xs font-bold text-white/60 mb-3">مهارت در دسته‌بندی‌ها</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(categoryStats).map(([catId, stat]) => {
                        const cat = CATEGORIES[catId as keyof typeof CATEGORIES];
                        if (!cat) return null;
                        const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                        return (
                          <div key={catId} className="flex items-center justify-between bg-black/20 rounded-lg p-2 border border-white/5">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-base">{cat.icon}</span>
                              <span className="text-[10px] font-bold text-white/80">{cat.label}</span>
                            </div>
                            <span className={cn(
                              "text-[10px] font-black",
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

            {/* Quick Buy Coins */}
            <button
              onClick={() => router.push('/game/store')}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-black py-4 rounded-xl shadow-[0_4px_0_#a16207] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center space-x-2 space-x-reverse"
            >
              <ShoppingCart size={22} />
              <span>خرید سکه</span>
            </button>

            {/* Profile Form */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center space-x-2 space-x-reverse">
                <UserCircle className="text-[#20b2f5]" />
                <span>تنظیمات پروفایل بازی</span>
              </h3>
              
              <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                این اطلاعات فقط در محیط بازی (رده‌بندی، دوئل و تالار) به سایر بازیکنان نمایش داده می‌شود و تغییری در پروفایل اصلی ویستای شما ایجاد نمی‌کند.
              </p>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">نام نمایشی در بازی</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#20b2f5] focus:ring-2 focus:ring-[#20b2f5]/20 text-slate-800 font-bold transition-all"
                    placeholder="نام خود را وارد کنید..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">تصویر آواتار</label>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {/* Main Vista Avatar Option */}
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(profile?.avatar_url || user?.avatar_url || '')}
                      className={cn(
                        "aspect-square rounded-2xl border-2 overflow-hidden relative group transition-all",
                        (avatarUrl === (profile?.avatar_url || user?.avatar_url) || (avatarUrl === '' && !(profile?.avatar_url || user?.avatar_url)))
                          ? "border-[#20b2f5] ring-4 ring-[#20b2f5]/20" 
                          : "border-slate-200 hover:border-slate-300 bg-slate-100"
                      )}
                    >
                      {profile?.avatar_url || user?.avatar_url ? (
                        <img 
                          src={profile?.avatar_url || user?.avatar_url} 
                          alt="Vista Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <UserCircle size={32} />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1">
                        <span className="text-[8px] text-white font-bold block text-center">اصلی ویستا</span>
                      </div>
                    </button>

                    {/* Predefined Avatars */}
                    {PREDEFINED_AVATARS.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setAvatarUrl(avatar.url)}
                        className={cn(
                          "aspect-square rounded-2xl border-2 overflow-hidden transition-all bg-slate-50",
                          avatarUrl === avatar.url
                            ? "border-[#20b2f5] ring-4 ring-[#20b2f5]/20 scale-105 shadow-md"
                            : "border-slate-200 hover:border-slate-300 hover:scale-105"
                        )}
                      >
                        <img src={avatar.url} alt={avatar.id} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full mt-2 bg-[#78c02c] hover:bg-[#68a825] text-white font-black py-3.5 rounded-xl shadow-[0_4px_0_#5da01f] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center space-x-2 space-x-reverse disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  <span>{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
