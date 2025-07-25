import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
})

// Types برای TypeScript طبق جدول واقعی شما
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    email: string | null
                    bio: string | null
                    followers_count: number | null
                    following_count: number | null
                    created_at: string | null
                    is_verified: boolean | null
                    verification_type: string | null
                    is_followed: boolean | null
                    fcm_token: string | null
                    last_active: string | null
                    last_ip: string | null
                    account_status: string | null
                    posts_count: number | null
                    updated_at: string | null
                    is_private: boolean | null
                    role: string | null
                    birth_date: string | null
                    last_online: string | null
                    account_type: string | null
                    last_seen_status: string | null
                    is_online: boolean | null
                }
                Insert: {
                    id: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    email?: string | null
                    bio?: string | null
                    followers_count?: number | null
                    following_count?: number | null
                    created_at?: string | null
                    is_verified?: boolean | null
                    verification_type?: string | null
                    is_followed?: boolean | null
                    fcm_token?: string | null
                    last_active?: string | null
                    last_ip?: string | null
                    account_status?: string | null
                    posts_count?: number | null
                    updated_at?: string | null
                    is_private?: boolean | null
                    role?: string | null
                    birth_date?: string | null
                    last_online?: string | null
                    account_type?: string | null
                    last_seen_status?: string | null
                    is_online?: boolean | null
                }
                Update: {
                    id?: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    email?: string | null
                    bio?: string | null
                    followers_count?: number | null
                    following_count?: number | null
                    created_at?: string | null
                    is_verified?: boolean | null
                    verification_type?: string | null
                    is_followed?: boolean | null
                    fcm_token?: string | null
                    last_active?: string | null
                    last_ip?: string | null
                    account_status?: string | null
                    posts_count?: number | null
                    updated_at?: string | null
                    is_private?: boolean | null
                    role?: string | null
                    birth_date?: string | null
                    last_online?: string | null
                    account_type?: string | null
                    last_seen_status?: string | null
                    is_online?: boolean | null
                }
            }
            // جداول دیگه رو بعداً اضافه می‌کنیم (posts, likes, comments, messages)
            posts: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    image_url: string | null
                    likes_count: number
                    comments_count: number
                    created_at: string
                    updated_at: string
                    status?: string | null
                    music_url?: string | null
                    video_url?: string | null
                    engagement_score?: number | null
                    moderator_id?: string | null
                    moderator_username?: string | null
                    moderated_at?: string | null
                    moderation_reason?: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    content: string
                    image_url?: string | null
                    likes_count?: number
                    comments_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    content?: string
                    image_url?: string | null
                    likes_count?: number
                    comments_count?: number
                    updated_at?: string
                }
            }
        }
    }
}

// Helper Types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type Post = Database['public']['Tables']['posts']['Row']

// Account Status Types
export type AccountStatus = 'active' | 'suspended' | 'deactivated' | 'banned'
export type Role = 'admin' | 'moderator' | 'normal' | 'premium'
export type VerificationType = 'none' | 'verified' | 'premium' // شما باید انواع verification خودتون رو تعریف کنید
export type LastSeenStatus = 'public' | 'private'

// Helper Functions برای کار با Profile
export const profileHelpers = {
    // چک کردن آنلاین بودن کاربر
    isOnline: (profile: Profile): boolean => {
        if (!profile.is_online) return false
        if (!profile.last_online) return false

        const lastOnline = new Date(profile.last_online)
        const now = new Date()
        const diffMinutes = (now.getTime() - lastOnline.getTime()) / (1000 * 60)

        return diffMinutes <= 5 // اگه کمتر از 5 دقیقه پیش آنلاین بوده
    },

    // فرمت کردن تعداد فالوورها
    formatFollowersCount: (count: number | null): string => {
        if (!count) return '0'
        if (count < 1000) return count.toString()
        if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
        return `${(count / 1000000).toFixed(1)}M`
    },

    // چک کردن verification
    isVerified: (profile: Profile): boolean => {
        return profile.is_verified === true && profile.verification_type !== 'none'
    },

    // گرفتن رنگ badge verification
    getVerificationColor: (verificationType: string | null): string => {
        switch (verificationType) {
            case 'verified': return 'text-blue-500'
            case 'premium': return 'text-yellow-500'
            default: return 'text-gray-400'
        }
    }
}
