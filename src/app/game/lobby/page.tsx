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
            <h1 className="text-white font-black text-base">تالار بازی‌های آزاد</h1>
            <div className="mr-auto flex items-center gap-1.5 text-white/30 text-xs font-bold">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {matches.length} بازی
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 bg-cyan-500/15 border border-cyan-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-cyan-400" />
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                بازی‌هایی که منتظر حریف هستند. پیوستن به هر بازی <span className="text-white/70 font-bold">۵۰ سکه</span> هزینه دارد.
              </p>
            </div>

            {/* Match list */}
            {loading && matches.length === 0 ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-4">
                <AlertCircle size={44} className="opacity-40" />
                <p className="font-bold text-sm">هیچ بازی آزادی موجود نیست</p>
                <button
                  onClick={() => router.push('/game')}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-violet-500/25"
                >
                  شروع بازی جدید
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map(match => (
                  <div
                    key={match.matchId}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-violet-500/30 hover:bg-white/8 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/15 flex-shrink-0">
                        <Image
                          src={match.player1.avatar || '/images/default-avatar.png'}
                          alt={match.player1.name}
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{match.player1.name}</div>
                        <div className="text-[10px] text-white/30 font-bold mt-0.5 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                          منتظر حریف
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => joinLobby(match.matchId)}
                      disabled={joining === match.matchId}
                      className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-1.5 shadow-lg shadow-violet-500/20"
                    >
                      {joining === match.matchId ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play size={14} className="fill-white" />
                          <span>پیوستن</span>
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
    </div>
  )
}
