export interface User {
    id: string
    username: string
    email: string
    avatar_url?: string
    created_at: string
}

export interface Post {
    id: string
    content: string
    user_id: string
    created_at: string
    updated_at: string
    user?: User
}

export interface Comment {
    id: string
    content: string
    post_id: string
    user_id: string
    created_at: string
    user?: User
}

export interface ApiResponse<T> {
    data: T
    error?: string
    message?: string
} 