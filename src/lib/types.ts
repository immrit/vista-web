export interface Profile {
    id: string
    user_id?: string
    username: string
    full_name?: string
    email?: string
    avatar_url?: string
    bio?: string
    created_at: string
    updated_at: string
    is_verified?: boolean
    verification_type?: string
    role?: string
    subscription_expires_at?: string
    subscription_plan?: string
    phone_number?: string
    profile_completed?: boolean
    account_status?: string
    email_visibility?: string
    birth_date_visibility?: string
    gender_visibility?: string
    marital_status_visibility?: string
    posts_count?: number
    followers_count?: number
    following_count?: number
}

export interface Post {
    id: string
    user_id: string
    content: string
    created_at: string
}

export interface Comment {
    id: string
    post_id: string
    user_id: string
    content: string
    created_at: string
}

export interface User {
    id: string
    username?: string | null
    full_name?: string | null
    email?: string | null
    phone_number?: string | null
    account_status?: string | null
    profile_completed?: boolean
    avatar_url?: string
    created_at: string
}

// Kept for backward compatibility with older UI code.
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
    is_saved?: boolean
}

export interface CommentWithProfile extends Comment {
    profiles?: Profile
    parent_comment_id?: string | null
    replies?: CommentWithProfile[]
}
