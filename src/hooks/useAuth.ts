'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiClient, clearAuthTokens, persistAuthTokens } from '@/lib/apiClient'
import { profileApi } from '@/lib/backendApi'
import { Profile } from '@/lib/types'

const DEVICE_ID_KEY = 'vista_device_id'
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at'
const USER_ID_KEY = 'user_id'

export interface User {
    id: string
    username?: string | null
    full_name?: string | null
    email?: string | null
    phone?: string | null
    phone_number?: string | null
    account_status?: string | null
    profile_completed?: boolean
    phone_verified_at?: string | null
    email_verified_at?: string | null
    created_at?: string
    [key: string]: any
}

export interface AuthSession {
    access_token: string
    refresh_token?: string
    token_type?: string
    expires_at?: string
}

export interface AuthResponse {
    user: User
    session: AuthSession
    is_new_user?: boolean
}

export interface LookupIdentifierResponse {
    success: boolean
    exists?: boolean
    is_phone?: boolean
    normalized_identifier?: string
    auth_flow?: 'password' | 'otp' | string
    account_status?: string
}

export interface SendOtpResponse {
    success: boolean
    message?: string
    expires_in_seconds?: number
    retry_after_seconds?: number
    debug_code?: string
}

export interface VerifyOtpResponse {
    success: boolean
    is_2fa_required?: boolean
    two_factor_token?: string
    auth?: AuthResponse
}

export interface RegisterInput {
    email?: string
    phone_number?: string
    username?: string
    full_name?: string
    password: string
    birth_date?: string
    gender?: string
    marital_status?: string
}

function getStoredRefreshToken() {
    if (typeof window === 'undefined') return null
    // Refresh token is stored as HttpOnly cookie in production.
    // In dev it may be readable; the server route handles setting it.
    const cookieMatch = document.cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/)
    return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null
}

function createDeviceId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }

    return `web-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getDeviceId() {
    if (typeof window === 'undefined') return undefined

    const existing = window.localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing

    const next = createDeviceId()
    window.localStorage.setItem(DEVICE_ID_KEY, next)
    return next
}

function authRequestOptions() {
    const deviceId = getDeviceId()
    return deviceId ? { headers: { 'X-Device-ID': deviceId } } : undefined
}

function rememberAuthResponse(data: AuthResponse) {
    if (typeof window === 'undefined') return
    if (!data.session?.access_token) return

    // Store tokens securely via server-side HttpOnly cookie route
    persistAuthTokens(data.session.access_token, data.session.refresh_token)

    // Non-sensitive metadata only in sessionStorage (cleared on tab close)
    if (data.user?.id) {
        window.sessionStorage.setItem(USER_ID_KEY, data.user.id)
    }
    if (data.session.expires_at) {
        window.sessionStorage.setItem(TOKEN_EXPIRES_AT_KEY, data.session.expires_at)
    } else {
        window.sessionStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
    }
}

function forgetAuthResponse() {
    clearAuthTokens()
    if (typeof window === 'undefined') return

    window.sessionStorage.removeItem(USER_ID_KEY)
    window.sessionStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
    // Also clean up any legacy localStorage tokens if they exist
    window.localStorage.removeItem('access_token')
    window.localStorage.removeItem('refresh_token')
    window.localStorage.removeItem(USER_ID_KEY)
    window.localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
}

async function refreshStoredSession() {
    const refreshToken = getStoredRefreshToken()
    if (!refreshToken) return null

    const data = await apiClient.post<AuthResponse>(
        '/v1/auth/refresh',
        { refresh_token: refreshToken },
        authRequestOptions()
    )
    rememberAuthResponse(data)
    return data
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const data = await profileApi.get(userId)
            if (data) {
                setProfile(data)
            }
            return data
        } catch (err: any) {
            setError(err.message || 'پروفایل پیدا نشد.')
            return null
        }
    }, [])

    const applyAuthResponse = useCallback(async (data: AuthResponse) => {
        rememberAuthResponse(data)
        setUser(data.user)
        setError(null)

        if (data.user?.id) {
            await fetchProfile(data.user.id).catch(err => console.error(err))
        }

        return data
    }, [fetchProfile])

    useEffect(() => {
        if (!isHydrated) return

        let mounted = true

        const getInitialSession = async () => {
            try {
                let me = await apiClient.get<User>('/v1/auth/me').catch(async () => {
                    const refreshed = await refreshStoredSession().catch(() => null)
                    return refreshed?.user || null
                })

                if (!mounted) return

                if (me?.id) {
                    setUser(me)
                    setError(null)
                    fetchProfile(me.id).catch(err => console.error(err))
                } else {
                    forgetAuthResponse()
                    setUser(null)
                    setProfile(null)
                }
            } catch (err: any) {
                if (mounted) {
                    setError(err.message || 'Unknown error')
                    setUser(null)
                    setProfile(null)
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        getInitialSession()

        return () => {
            mounted = false
        }
    }, [isHydrated, fetchProfile])

    const signIn = async (identifier: string, password: string) => {
        const data = await apiClient.post<AuthResponse>(
            '/v1/auth/login',
            {
                identifier,
                password,
            },
            authRequestOptions()
        )

        return applyAuthResponse(data)
    }

    const signUp = async (
        email: string,
        password: string,
        username: string,
        fullName: string,
        bio?: string,
        birthDate?: string,
        avatarUrl?: string
    ) => {
        const data = await apiClient.post<AuthResponse>(
            '/v1/auth/register',
            {
                email,
                password,
                username,
                full_name: fullName,
                birth_date: birthDate,
            },
            authRequestOptions()
        )

        await applyAuthResponse(data)

        if (bio || avatarUrl) {
            await profileApi.update({
                ...(bio ? { bio } : {}),
                ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
            }).catch(err => console.error(err))
            if (data.user?.id) {
                fetchProfile(data.user.id).catch(err => console.error(err))
            }
        }

        return data
    }

    const registerWithPassword = async (input: RegisterInput) => {
        const data = await apiClient.post<AuthResponse>('/v1/auth/register', input, authRequestOptions())
        return applyAuthResponse(data)
    }

    const lookupIdentifier = async (identifier: string) => {
        return apiClient.post<LookupIdentifierResponse>(
            '/v1/auth/lookup',
            { identifier },
            authRequestOptions()
        )
    }

    const sendOtp = async (phoneNumber: string) => {
        return apiClient.post<SendOtpResponse>(
            '/v1/auth/send-otp',
            { phone_number: phoneNumber },
            authRequestOptions()
        )
    }

    const verifyOtp = async (phoneNumber: string, code: string) => {
        const data = await apiClient.post<VerifyOtpResponse>(
            '/v1/auth/verify-otp',
            {
                phone_number: phoneNumber,
                code,
            },
            authRequestOptions()
        )

        if (data.auth) {
            await applyAuthResponse(data.auth)
        }

        return data
    }

    const verify2fa = async (twoFactorToken: string, password: string) => {
        const data = await apiClient.post<AuthResponse>(
            '/v1/auth/2fa/verify',
            {
                two_factor_token: twoFactorToken,
                password,
            },
            authRequestOptions()
        )

        return applyAuthResponse(data)
    }

    const refreshSession = async () => {
        const data = await refreshStoredSession()
        if (!data) {
            throw new Error('نشست فعالی برای تمدید وجود ندارد.')
        }

        return applyAuthResponse(data)
    }

    const signOut = async () => {
        forgetAuthResponse()
        setUser(null)
        setProfile(null)
        setLoading(false)
    }

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) throw new Error('No user logged in')

        const data = await profileApi.update(updates)
        setProfile(data)
        return data
    }

    const sendDeleteCode = async () => {
        if (!user) throw new Error('No user logged in')
        const data = await apiClient.post('/v1/auth/send-delete-code', {
            userId: user.id,
            userEmail: user.email,
        })
        return data
    }

    const verifyDeleteCode = async (code: string) => {
        if (!user) throw new Error('No user logged in')
        await apiClient.post('/v1/auth/verify-delete-code', {
            code,
            userId: user.id,
        })
        await signOut()
    }

    const refreshProfile = useCallback(async () => {
        if (!user?.id) return

        setRefreshing(true)
        try {
            const data = await profileApi.get(user.id)
            setProfile(data)
            return data
        } catch (error) {
            console.error('Error refreshing profile:', error)
            throw error
        } finally {
            setRefreshing(false)
        }
    }, [user?.id])

    return {
        user,
        profile,
        loading,
        refreshing,
        error,
        signIn,
        signUp,
        registerWithPassword,
        signOut,
        lookupIdentifier,
        sendOtp,
        verifyOtp,
        verify2fa,
        refreshSession,
        updateProfile,
        fetchProfile,
        refreshProfile,
        sendDeleteCode,
        verifyDeleteCode,
    }
}
