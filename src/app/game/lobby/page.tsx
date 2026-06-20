'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Users, Play, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { toast } from 'sonner'
import Image from 'next/image'

interface ActiveMatch {
  matchId: string
  status: string
  player1: { id: string; name: string; avatar: string; score: number }
  player2: { id: string; name: string; avatar: string; score: number } | null
}

export default function GameLobbyPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<ActiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    fetchLobby()
    const interval = setInterval(fetchLobby, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchLobby = async () => {
    try {
      const res = await apiClient.get<{ matches: ActiveMatch[] }>('/v1/game/lobby')
      if (res?.matches) setMatches(res.matches)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const joinLobby = async (matchId: string) => {
    try {
      setJoining(matchId)
      await apiClient.post('/v1/game/lobby/join', { matchId })
      toast.success('شما با موفقیت به بازی پیوستید!')
      router.push(`/game/match/${matchId}`)
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.error || 'خطا در پیوستن به بازی')
    } finally {
      setJoining(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#4c1d95] flex justify-center">
      <div className="w-full max-w-md bg-[#6d28d9] flex flex-col h-[100dvh] relative shadow-2xl">
        <div className="flex items-center p-4 bg-[#4c1d95] sticky top-0 z-20 shadow-md">
          <button onClick={() => router.push('/game')} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-lg mr-4">تالار بازی‌های آزاد</h1>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {/* Daily spin wheel */}
          <button
            onClick={() => router.push('/game/spin')}
            className="w-full mb-4 bg-gradient-to-l from-[#fbbf24] to-[#f59e0b] border-2 border-yellow-300 rounded-2xl p-4 flex items-center gap-3 text-white shadow-[0_6px_0_#b45309] active:translate-y-[6px] active:shadow-none transition-all"
          >
            <div className="text-4xl animate-spin-slow">🎡</div>
            <div className="flex-1 text-right">
              <div className="font-black text-lg drop-shadow">گردونه شانس روزانه</div>
              <div className="text-xs opacity-90 font-bold">هر روز سکه رایگان بگیر!</div>
            </div>
            <div className="bg-white/25 rounded-full px-3 py-1 text-sm font-black">رایگان</div>
          </button>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-6 text-center text-white">
            <Users size={32} className="mx-auto mb-2 text-[#78c02c]" />
            <p className="text-sm opacity-90 leading-relaxed font-bold">
              در این بخش می‌توانید بازی‌هایی که منتظر حریف هستند را مشاهده کنید و به آنها بپیوندید.
            </p>
          </div>

          {loading && matches.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/50">
              <AlertCircle size={48} className="mb-4 opacity-50" />
              <p className="font-bold">هیچ بازی آزادی در حال حاضر وجود ندارد.</p>
              <button
                onClick={() => router.push('/game')}
                className="mt-6 bg-[#78c02c] text-white px-6 py-2 rounded-full font-bold shadow-[0_4px_0_#5da01f] active:translate-y-1 active:shadow-none"
              >
                شروع یک بازی جدید
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map(match => (
                <div key={match.matchId} className="bg-white rounded-2xl p-4 shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#6d28d9]">
                      <Image src={match.player1.avatar || '/images/default-avatar.png'} alt={match.player1.name} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{match.player1.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">منتظر حریف...</div>
                    </div>
                  </div>
                  <button
                    onClick={() => joinLobby(match.matchId)}
                    disabled={joining === match.matchId}
                    className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#6d28d9] hover:to-[#4c1d95] text-white px-5 py-2 rounded-xl font-bold shadow-[0_4px_0_#4c1d95] active:translate-y-1 active:shadow-none transition-all flex items-center gap-1 text-sm disabled:opacity-50"
                  >
                    {joining === match.matchId ? '...' : (
                      <>
                        <Play size={16} className="fill-white" />
                        <span>بازی</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
