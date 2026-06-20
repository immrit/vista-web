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
    <div className="min-h-screen bg-[#4c1d95] flex justify-center">
      <div className="w-full max-w-md bg-[#6d28d9] flex flex-col h-[100dvh] relative shadow-2xl">
        <div className="flex items-center p-4 bg-[#4c1d95] sticky top-0 z-20 shadow-md">
          <button onClick={() => router.push('/game')} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-lg mr-4">دوئل خصوصی</h1>
        </div>

        <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-6">
          <div className="bg-gradient-to-b from-[#f36b59] to-[#ea4b34] border border-[#f8a89d] rounded-2xl p-6 text-center text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none scale-150 -translate-y-1/4 translate-x-1/4">
              <Trophy size={120} />
            </div>

            <Trophy size={48} className="mx-auto mb-4 text-[#fbcf68]" fill="#fbcf68" />
            <h2 className="text-xl font-black mb-2">رقابت با دوستان</h2>
            <p className="text-sm opacity-90 leading-relaxed font-bold mb-6">
              یک دوئل خصوصی بسازید و کد آن را برای دوستانتان بفرستید، یا با استفاده از کد دعوت آن‌ها، وارد دوئل شوید.
            </p>

            {!createdMatchId ? (
              <button
                onClick={handleCreateDuel}
                disabled={loading}
                className="w-full bg-white text-[#ea4b34] hover:bg-slate-50 font-black py-4 rounded-xl shadow-[0_4px_0_#bc2e1a] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 text-lg"
              >
                {loading ? 'در حال ساخت...' : 'ساخت دوئل جدید'}
              </button>
            ) : (
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-sm font-bold mb-2">کد دعوت شما:</div>
                <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
                  <span className="font-mono font-bold text-lg tracking-wider select-all">{createdMatchId}</span>
                  <button onClick={copyCode} className="p-2 bg-white/20 hover:bg-white/30 rounded-md transition-colors">
                    {copied ? <CheckCircle2 size={20} className="text-[#fbcf68]" /> : <Copy size={20} />}
                  </button>
                </div>
                <p className="text-xs mt-3 opacity-80">این کد را برای دوست خود بفرستید.</p>
                <button
                  onClick={() => router.push(`/game/match/${createdMatchId}`)}
                  className="w-full mt-4 bg-[#78c02c] hover:bg-[#68a825] text-white font-black py-3 rounded-xl shadow-[0_4px_0_#5da01f] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  <Play size={18} className="fill-white" />
                  ورود به صفحه بازی
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#6d28d9] text-white px-3 py-1 rounded-full text-xs font-bold border-4 border-white">
              یا
            </div>

            <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2 mt-2">
              <Search className="text-[#7c3aed]" />
              پیوستن به دوئل
            </h3>

            <form onSubmit={handleJoinDuel} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="کد دعوت را اینجا وارد کنید..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-[#7c3aed] text-slate-800 font-bold text-center tracking-widest font-mono"
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={joining || !joinCode.trim()}
                className="w-full bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_0_#4c1d95] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
              >
                {joining ? 'در حال بررسی...' : 'پیوستن'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
