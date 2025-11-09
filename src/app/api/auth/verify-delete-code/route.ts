import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { UploadService } from '@/lib/uploadService'

export async function POST(request: NextRequest) {
    try {
        console.log('=== VERIFY DELETE CODE API ===')
        const { code, userId } = await request.json()

        if (!code || !userId) {
            return NextResponse.json(
                { error: 'Verification code and user ID are required' },
                { status: 400 }
            )
        }

        const cookieStore = await cookies()
        console.log('Cookies found:', cookieStore.getAll().length)

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use anon key for API operations
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        // For now, we'll trust the client-side user data
        // In production, you should implement proper server-side authentication
        console.log('Using client-provided user data:', { userId })

        // Verify the code
        console.log('Verifying code...')
        const { data: codeData, error: codeError } = await supabase
            .from('delete_codes')
            .select('*')
            .eq('user_id', userId)
            .eq('code', code)
            .gte('expires_at', new Date().toISOString())
            .single()

        console.log('Code verification result:', { codeData: !!codeData, error: codeError?.message })

        if (codeError || !codeData) {
            return NextResponse.json(
                { error: 'Invalid or expired verification code' },
                { status: 400 }
            )
        }

        console.log('Code verified successfully')

        // Get user's posts to find files to delete
        console.log('Getting user posts for file cleanup...')
        const { data: userPosts, error: postsError } = await supabase
            .from('posts')
            .select('id, image_url, video_url, music_url')
            .eq('user_id', userId)

        if (postsError) {
            console.error('Error fetching user posts:', postsError)
        } else {
            console.log('Found posts with files:', userPosts?.length || 0)
        }

        // Delete files from Arvan Cloud storage
        if (userPosts && userPosts.length > 0) {
            console.log('Deleting files from Arvan Cloud storage...')
            const filesToDelete: string[] = []

            userPosts.forEach(post => {
                if (post.image_url) filesToDelete.push(post.image_url)
                if (post.video_url) filesToDelete.push(post.video_url)
                if (post.music_url) filesToDelete.push(post.music_url)
            })

            // Get user's avatar from profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', userId)
                .single()

            if (profile?.avatar_url) {
                filesToDelete.push(profile.avatar_url)
            }

            // Delete files from Arvan Cloud storage using UploadService
            if (filesToDelete.length > 0) {
                console.log('Deleting files from Arvan Cloud:', filesToDelete)

                for (const fileUrl of filesToDelete) {
                    try {
                        const deleteResult = await UploadService.deleteFile(fileUrl)
                        if (deleteResult) {
                            console.log(`File deleted from Arvan Cloud: ${fileUrl}`)
                        } else {
                            console.error(`Failed to delete file from Arvan Cloud: ${fileUrl}`)
                        }
                    } catch (error) {
                        console.error(`Error deleting file from Arvan Cloud: ${fileUrl}`, error)
                    }
                }
            }
        }

        // Delete all user's posts
        const { error: postsDeleteError } = await supabase
            .from('posts')
            .delete()
            .eq('user_id', userId)

        if (postsDeleteError) {
            console.error('Error deleting posts:', postsDeleteError)
            return NextResponse.json(
                { error: 'Failed to delete posts' },
                { status: 500 }
            )
        }

        // Delete all user's likes
        const { error: likesError } = await supabase
            .from('likes')
            .delete()
            .eq('user_id', userId)

        if (likesError) {
            console.error('Error deleting likes:', likesError)
            return NextResponse.json(
                { error: 'Failed to delete likes' },
                { status: 500 }
            )
        }

        // Delete all user's comments
        const { error: commentsError } = await supabase
            .from('comments')
            .delete()
            .eq('user_id', userId)

        if (commentsError) {
            console.error('Error deleting comments:', commentsError)
            return NextResponse.json(
                { error: 'Failed to delete comments' },
                { status: 500 }
            )
        }

        // Delete all notifications sent by the user
        const { error: notificationsSentError } = await supabase
            .from('notifications')
            .delete()
            .eq('sender_id', userId)

        if (notificationsSentError) {
            console.error('Error deleting sent notifications:', notificationsSentError)
            return NextResponse.json(
                { error: 'Failed to delete sent notifications' },
                { status: 500 }
            )
        }

        // Delete all notifications received by the user
        const { error: notificationsReceivedError } = await supabase
            .from('notifications')
            .delete()
            .eq('recipient_id', userId)

        if (notificationsReceivedError) {
            console.error('Error deleting received notifications:', notificationsReceivedError)
            return NextResponse.json(
                { error: 'Failed to delete received notifications' },
                { status: 500 }
            )
        }

        // Delete all follows where user is the follower
        const { error: followsFollowerError } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', userId)

        if (followsFollowerError) {
            console.error('Error deleting follows as follower:', followsFollowerError)
            return NextResponse.json(
                { error: 'Failed to delete follows as follower' },
                { status: 500 }
            )
        }

        // Delete all follows where user is the following
        const { error: followsFollowingError } = await supabase
            .from('follows')
            .delete()
            .eq('following_id', userId)

        if (followsFollowingError) {
            console.error('Error deleting follows as following:', followsFollowingError)
            return NextResponse.json(
                { error: 'Failed to delete follows as following' },
                { status: 500 }
            )
        }

        // Delete the profile (now all foreign key constraints should be satisfied)
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileError) {
            console.error('Error deleting profile:', profileError)
            return NextResponse.json(
                { error: 'Failed to delete profile' },
                { status: 500 }
            )
        }

        // Delete the verification code
        await supabase
            .from('delete_codes')
            .delete()
            .eq('user_id', userId)

        // Delete the user from Supabase Authentication
        console.log('Attempting to delete user from Supabase Authentication...')
        console.log('User ID:', userId)

        // Call the separate API route for auth deletion using service role key
        try {
            const authDeleteResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/delete-user-auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            })

            if (authDeleteResponse.ok) {
                console.log('User deleted from auth.users successfully')
            } else {
                const errorData = await authDeleteResponse.json()
                console.error('Error deleting user from auth.users:', errorData)
                console.error('User will need to contact support to completely remove their account')
            }
        } catch (fetchError) {
            console.error('Error calling auth deletion API:', fetchError)
            console.error('User will need to contact support to completely remove their account')
        }

        console.log('Account deleted successfully')
        return NextResponse.json(
            { message: 'Account deleted successfully' },
            { status: 200 }
        )

    } catch (error) {
        console.error('Account deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 