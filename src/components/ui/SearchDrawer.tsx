'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, User, Hash, Image as ImageIcon, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchDrawerProps {
    isOpen: boolean
    onClose: () => void
}

interface SearchResult {
    id: string
    type: 'user' | 'hashtag' | 'post'
    title: string
    subtitle?: string
    avatar?: string
    href: string
}

export default function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Load recent searches from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('vista_recent_searches')
            if (saved) {
                try {
                    setRecentSearches(JSON.parse(saved))
                } catch (e) {
                    console.error('Error loading recent searches:', e)
                }
            }
        }
    }, [])

    // Focus input when drawer opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 300)
        }
    }, [isOpen])

    // Handle search
    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([])
            return
        }

        setIsSearching(true)
        try {
            // TODO: Replace with actual API call
            // For now, using mock data
            const mockResults: SearchResult[] = [
                // Mock users
                {
                    id: '1',
                    type: 'user',
                    title: 'علی احمدی',
                    subtitle: '@ali_ahmadi',
                    avatar: undefined,
                    href: '/profile/ali_ahmadi'
                },
                {
                    id: '2',
                    type: 'user',
                    title: 'سارا محمدی',
                    subtitle: '@sara_mohammadi',
                    avatar: undefined,
                    href: '/profile/sara_mohammadi'
                },
                // Mock hashtags
                {
                    id: '3',
                    type: 'hashtag',
                    title: `#${query}`,
                    subtitle: '1,234 پست',
                    href: `/explore?q=${encodeURIComponent(query)}`
                },
                // Mock posts
                {
                    id: '4',
                    type: 'post',
                    title: 'پست مرتبط با ' + query,
                    subtitle: '2 ساعت پیش',
                    href: `/post/123`
                }
            ]

            // Filter results based on query
            const filtered = mockResults.filter(result =>
                result.title.toLowerCase().includes(query.toLowerCase()) ||
                result.subtitle?.toLowerCase().includes(query.toLowerCase())
            )

            setSearchResults(filtered)

            // Save to recent searches
            if (query.trim() && !recentSearches.includes(query.trim())) {
                const updated = [query.trim(), ...recentSearches].slice(0, 5)
                setRecentSearches(updated)
                if (typeof window !== 'undefined') {
                    localStorage.setItem('vista_recent_searches', JSON.stringify(updated))
                }
            }
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsSearching(false)
        }
    }, [recentSearches]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery, handleSearch])

    // Clear recent search
    const clearRecentSearches = () => {
        setRecentSearches([])
        if (typeof window !== 'undefined') {
            localStorage.removeItem('vista_recent_searches')
        }
    }

    // Handle result click
    const handleResultClick = (href: string) => {
        router.push(href)
        onClose()
        setSearchQuery('')
    }

    // Get icon for result type
    const getResultIcon = (type: SearchResult['type']) => {
        switch (type) {
            case 'user':
                return <User className="w-5 h-5" />
            case 'hashtag':
                return <Hash className="w-5 h-5" />
            case 'post':
                return <ImageIcon className="w-5 h-5" />
            default:
                return <Search className="w-5 h-5" />
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="relative p-4 bg-gradient-to-r from-blue-500 to-purple-600">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="pr-12">
                        <h2 className="text-xl font-bold text-white mb-4">جستجو</h2>
                        <div className="relative">
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/80">
                                <Search size={18} />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="جستجوی کاربران، هشتگ‌ها، پست‌ها..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 rounded-xl border border-white/20 bg-white/10 px-4 pr-12 py-3 text-sm text-white placeholder:text-white/70 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Search Content */}
                <div className="flex-1 overflow-y-auto">
                    {isSearching && searchQuery && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {!isSearching && searchQuery && searchResults.length > 0 && (
                        <div className="p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
                                نتایج جستجو
                            </h3>
                            {searchResults.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleResultClick(result.href)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-right"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                                        {result.avatar ? (
                                            <img
                                                src={result.avatar}
                                                alt={result.title}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            getResultIcon(result.type)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-zinc-900 dark:text-white font-medium truncate">
                                            {result.title}
                                        </div>
                                        {result.subtitle && (
                                            <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                                                {result.subtitle}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {!isSearching && searchQuery && searchResults.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <Search className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
                            <p className="text-zinc-600 dark:text-zinc-400">
                                نتیجه‌ای یافت نشد
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
                                سعی کنید با کلمات کلیدی دیگر جستجو کنید
                            </p>
                        </div>
                    )}

                    {!searchQuery && recentSearches.length > 0 && (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                                    جستجوهای اخیر
                                </h3>
                                <button
                                    onClick={clearRecentSearches}
                                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                                >
                                    پاک کردن
                                </button>
                            </div>
                            <div className="space-y-1">
                                {recentSearches.map((search, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setSearchQuery(search)
                                            handleSearch(search)
                                        }}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-right"
                                    >
                                        <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                        <span className="text-zinc-700 dark:text-zinc-300 flex-1 text-right">
                                            {search}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!searchQuery && recentSearches.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <Search className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
                            <p className="text-zinc-600 dark:text-zinc-400">
                                شروع به جستجو کنید
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
                                کاربران، هشتگ‌ها و پست‌ها را جستجو کنید
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

