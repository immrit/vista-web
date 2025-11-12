'use client'

import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'
import { formatError } from '@/lib/utils/error'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isHydrated, setIsHydrated] = useState(false)

    // Hydration safety
    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                const message = formatError(error)
                setError(message || 'پروفایل یافت نشد.')
                return
            }

            setProfile(data)
        } catch (err) {
            const message = formatError(err)
            setError(message)
        }
    }, [])

    useEffect(() => {
        if (!isHydrated) return

        let mounted = true

        // 🔥 بهینه‌سازی: سریع‌تر session را بگیر و loading را false کن
        const getInitialSession = async () => {
            try {
                // سریع session را بگیر
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) {
                    if (mounted) {
                        setError(sessionError.message)
                        setLoading(false)
                    }
                    return
                }

                if (mounted) {
                    setUser(session?.user ?? null)
                    // 🔥 سریع loading را false کن - profile بعداً لود میشه
                    setLoading(false)

                    if (session?.user) {
                        // Profile را در background لود کن
                        fetchProfile(session.user.id).catch(err => {
                            console.error('Error fetching profile in background:', err)
                        })
                    }
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Unknown error')
                    setLoading(false)
                }
            }
        }

        getInitialSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                setUser(session?.user ?? null)

                if (session?.user) {
                    // Profile را در background لود کن
                    fetchProfile(session.user.id).catch(err => {
                        console.error('Error fetching profile:', err)
                    })
                } else {
                    setProfile(null)
                }

                setError(null)
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [isHydrated, fetchProfile])

    const signIn = async (email: string, password: string) => {
        try {
            console.log('Signing in user:', email)
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                console.error('Sign in error:', error)
                throw error
            }

            console.log('Sign in successful:', data)
            return data
        } catch (err) {
            console.error('Sign in failed:', err)
            throw err
        }
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
        try {
            console.log('=== SIGN UP PROCESS ===')
            console.log('Input data:', { email, username, fullName, bio, birthDate, avatarUrl })

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        full_name: fullName,
                    }
                }
            })

            if (error) {
                console.error('Sign up error:', error)
                throw error
            }

            console.log('Auth signup successful:', data)

            // ایجاد profile جدید
            if (data.user) {
                console.log('Creating profile for new user:', data.user.id)

                // Use API route to create profile with admin privileges
                const profileResponse = await fetch('/api/auth/create-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: data.user.id,
                        username,
                        fullName,
                        email,
                        bio,
                        birthDate,
                        avatarUrl
                    }),
                })

                if (!profileResponse.ok) {
                    const errorData = await profileResponse.json()
                    console.error('Profile creation failed:', errorData)
                    throw new Error(errorData.error || 'Failed to create profile')
                }

                const profileData = await profileResponse.json()
                console.log('Profile created successfully:', profileData)
            }

            console.log('Sign up successful:', data)
            return data
        } catch (err) {
            console.error('Sign up failed:', err)
            throw err
        }
    }

    const signOut = async () => {
        try {
            console.log('Signing out user')
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('Sign out error:', error)
                throw error
            }
            console.log('Sign out successful')

            // Clear local state immediately
            setUser(null)
            setProfile(null)
            setLoading(false)
        } catch (err) {
            console.error('Sign out failed:', err)
            throw err
        }
    }

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) throw new Error('No user logged in')

        try {
            console.log('Updating profile for user:', user.id)
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single()

            if (error) {
                console.error('Profile update error:', error)
                throw error
            }

            console.log('Profile updated:', data)
            setProfile(data)
            return data
        } catch (err) {
            console.error('Profile update failed:', err)
            throw err
        }
    }

    const sendDeleteCode = async () => {
        if (!user) throw new Error('No user logged in')

        try {
            console.log('Sending delete verification code...')

            const response = await fetch('/api/auth/send-delete-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    userEmail: user.email
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to send verification code')
            }

            const data = await response.json()
            console.log('Verification code sent successfully')
            return data

        } catch (err) {
            console.error('Failed to send verification code:', err)
            throw err
        }
    }

    const verifyDeleteCode = async (code: string) => {
        if (!user) throw new Error('No user logged in')

        try {
            console.log('Verifying delete code...')

            const response = await fetch('/api/auth/verify-delete-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    userId: user.id
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to verify code')
            }

            console.log('Account deleted successfully')

            // Clear local state
            setUser(null)
            setProfile(null)
            setLoading(false)

        } catch (err) {
            console.error('Account deletion failed:', err)
            throw err
        }
    }

    const refreshProfile = useCallback(async () => {
        if (!user?.id) return

        setRefreshing(true)
        try {
            console.log('🔄 Refreshing profile for user:', user.id)
            
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) {
                console.error('❌ Error refreshing profile:', error)
                throw error
            }

            console.log('✅ Profile refreshed:', data)
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
        signOut,
        updateProfile,
        fetchProfile,
        refreshProfile,
        sendDeleteCode,
        verifyDeleteCode,
    }
}
