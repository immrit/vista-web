import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we're on the client side
if (typeof window !== 'undefined') {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables')
        throw new Error('Missing Supabase environment variables')
    }
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
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
        global: {
            headers: {
                'X-Client-Info': 'vista-web',
            },
        },
    }
)

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
                    subscription_plan: string | null
                    subscription_started_at: string | null
                    subscription_expires_at: string | null
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
            posts: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    image_url: string | null
                    video_url: string | null
                    likes_count: number
                    comments_count: number
                    created_at: string
                    updated_at: string
                    status?: string | null
                    music_url?: string | null
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
                    video_url?: string | null
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
                    video_url?: string | null
                    likes_count?: number
                    comments_count?: number
                    updated_at?: string
                }
            }
            likes: {
                Row: {
                    id: string
                    post_id: string
                    user_id: string
                    created_at: string
                    owner_id: string
                }
                Insert: {
                    id?: string
                    post_id: string
                    user_id: string
                    created_at?: string
                    owner_id?: string
                }
                Update: {
                    id?: string
                    post_id?: string
                    user_id?: string
                    created_at?: string
                    owner_id?: string
                }
            }
            comments: {
                Row: {
                    id: string
                    post_id: string
                    owner_id: string
                    content: string
                    created_at: string
                    user_id: string
                    parent_comment_id: string | null
                    mentioned_users: string[] | null
                }
                Insert: {
                    id?: string
                    post_id: string
                    owner_id?: string
                    content: string
                    created_at?: string
                    user_id: string
                    parent_comment_id?: string | null
                    mentioned_users?: string[] | null
                }
                Update: {
                    id?: string
                    post_id?: string
                    owner_id?: string
                    content?: string
                    created_at?: string
                    user_id?: string
                    parent_comment_id?: string | null
                    mentioned_users?: string[] | null
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
export type Like = Database['public']['Tables']['likes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']

// Account Status Types
export type AccountStatus = 'active' | 'suspended' | 'deactivated' | 'banned'
export type Role = 'admin' | 'moderator' | 'normal' | 'premium'
export type VerificationType = 'none' | 'verified' | 'premium' // شما باید انواع verification خودتون رو تعریف کنید
export type LastSeenStatus = 'public' | 'private'

