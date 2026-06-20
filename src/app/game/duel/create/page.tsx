'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Trophy, Copy, CheckCircle2, Search, Play } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { toast } from 'sonner'

export default function CreateDuelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  const handleCreateDuel = async () => {
    try {
      setLoading(true)
      const res = await apiClient.post<{ matchId: string }>('/v1/game/duel/create')
      if (res?.matchId) {
        setCreatedMatchId(res.matchId)
        toast.success('دوئل با موفقیت ساخته شد!')
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'خطا در ساخت دوئل')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinDuel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) {
      toast.error('لطفا کد دعوت را وارد کنید')
      return
    }
    try {
      setJoining(true)
      const res = await apiClient.post<{ matchId: string }>('/v1/game/duel/join', { matchId: joinCode.trim() })
      if (res?.matchId) {
        toast.success('شما با موفقیت به دوئل پیوستید!')
        router.push(`/game/match/${res.matchId}`)
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'کد دعوت نامعتبر است')
    } finally {
      setJoining(false)
    }
  }

  const copyCode = () => {
    if (createdMatchId) {
      navigator.clipboard.writeText(createdMatchId)
      setCopied(true)
      toast.success('کد دعوت کپی شد!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0c1e] relative overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 flex justify-center min-h-screen">
        <div className="w-full max-w-md flex flex-col">

          {/* Header */}
          <div className="flex items-center gap-3 p-4 bg-[#0d0c1e]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
            <button
              onClick={() => router.push('/game')}
              className="w-9 h-9 flex items-center justify-center bg-white/8 border border-white/10 rounded-xl text-white hover:bg-white/15 transition-colors"
            >
              <ArrowRight size={18} />
            </button>
            <h1 className="text-white font-black text-base">دوئل خصوصی</h1>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* Create section */}
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -left-4 -top-4 opacity-5 pointer-events-none">
                <Trophy size={120} />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center justify-center">
                  <Trophy size={22} className="text-rose-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-base">رقابت با دوستان</h2>
                  <p className="text-white/40 text-xs">دوئل خصوصی بساز یا بهش بپیوند</p>
                </div>
              </div>

              {!createdMatchId ? (
                <button
                  onClick={handleCreateDuel}
                  disabled={loading}
                  className="w-full bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-rose-500/25 text-sm"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>در حال ساخت...</span>
                    </div>
                  ) : 'ساخت دوئل جدید'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white/50">کد دعوت:</div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <span className="font-mono font-black text-white text-sm tracking-widest select-all">
                      {createdMatchId}
                    </span>
                    <button
                      onClick={copyCode}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {copied
                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                        : <Copy size={18} className="text-white/60" />
                      }
                    </button>
                  </div>
                  <p className="text-white/30 text-xs text-center">این کد را برای دوست خود بفرستید</p>
                  <button
                    onClick={() => router.push(`/game/match/${createdMatchId}`)}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm shadow-lg shadow-violet-500/25"
                  >
                    <Play size={16} className="fill-white" />
                    ورود به صفحه بازی
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-white/25 text-xs font-bold">یا</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Join section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Search size={18} className="text-cyan-400" />
                <h3 className="text-white font-black text-base">پیوستن به دوئل</h3>
              </div>

              <form onSubmit={handleJoinDuel} className="space-y-3">
                <input
                  type="text"
                  placeholder="کد دعوت را اینجا وارد کنید"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 rounded-xl p-3.5 outline-none text-white font-bold text-center tracking-widest font-mono text-sm transition-colors placeholder:text-white/20"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] text-sm shadow-lg shadow-cyan-500/20"
                >
                  {joining ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>در حال بررسی...</span>
                    </div>
                  ) : 'پیوستن به دوئل'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
