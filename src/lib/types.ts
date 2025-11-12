// Import database types from supabase
import type { Post, Profile, Comment } from './supabase'

export interface User {
    id: string
    username: string
    email: string
    avatar_url?: string
    created_at: string
}

// Note: Post type is imported from './supabase' above
// This is kept for backward compatibility but should use Post from supabase
export interface LegacyPost {
    id: string
    content: string
    user_id: string
    created_at: string
    updated_at: string
    user?: User
}

export interface ApiResponse<T> {
    data: T
    error?: string
    message?: string
}

export interface TypingUser {
    id: string
    name: string
    avatar?: string
}

// Extended types for UI components
// Explicitly define PostWithProfile to avoid type inference issues with Omit
export interface PostWithProfile {
    id: string
    user_id: string
    content: string
    image_url: string | null
    video_url: string | null
    created_at: string
    updated_at: string
    status?: string | null
    music_url?: string | null
    engagement_score?: number | null
    moderator_id?: string | null
    moderator_username?: string | null
    moderated_at?: string | null
    moderation_reason?: string | null
    profiles?: Profile
    is_liked?: boolean
    likes_count?: number
    comments_count?: number
}

export interface CommentWithProfile extends Comment {
    profiles?: Profile
    replies?: CommentWithProfile[]
}
