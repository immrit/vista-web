import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        console.log('=== CREATE PROFILE API ===')
        const { userId, username, fullName, email, bio, birthDate, avatarUrl } = await request.json()

        if (!userId || !username || !fullName || !email) {
            return NextResponse.json(
                { error: 'User ID, username, full name, and email are required' },
                { status: 400 }
            )
        }

        // Check if service role key is available
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is not defined')
            return NextResponse.json(
                { error: 'Service role key not configured' },
                { status: 500 }
            )
        }

        // Create admin client with service role key
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        console.log('Creating profile with admin privileges...')
        console.log('Profile data:', { userId, username, fullName, email, bio, birthDate, avatarUrl })

        const { data: profileResult, error: profileError } = await adminSupabase
            .from('profiles')
            .insert({
                id: userId,
                username,
                full_name: fullName,
                email,
                bio: bio || null,
                birth_date: birthDate || null,
                avatar_url: avatarUrl || null,
            })
            .select()

        if (profileError) {
            console.error('Error creating profile with admin:', profileError)
            return NextResponse.json(
                { error: 'Failed to create profile', details: profileError.message },
                { status: 500 }
            )
        }

        console.log('Profile created successfully with admin:', profileResult)
        return NextResponse.json(
            { message: 'Profile created successfully', profile: profileResult[0] },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error in create profile:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 